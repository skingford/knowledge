---
title: crypto/cipher 源码精读
description: 精读 Go crypto/cipher 分组密码接口体系，掌握 AEAD/AES-GCM/AES-CTR/ChaCha20-Poly1305 实现与生产加密最佳实践。
---

# crypto/cipher：分组密码接口源码精读

> 核心源码：`src/crypto/cipher/gcm.go`、`src/crypto/cipher/ctr.go`、`src/crypto/aes/aes.go`

## 包结构图

```
crypto/cipher 体系
══════════════════════════════════════════════════════════════════

  核心接口：
  ├── Block（分组密码：密钥→加密单个块）
  │    ├── BlockSize() int
  │    ├── Encrypt(dst, src []byte)
  │    └── Decrypt(dst, src []byte)
  │
  ├── AEAD（认证加密：推荐！）
  │    ├── NonceSize() int         ← nonce（随机数）长度
  │    ├── Overhead() int          ← 认证 tag 长度
  │    ├── Seal(dst, nonce, plaintext, additionalData []byte) []byte
  │    └── Open(dst, nonce, ciphertext, additionalData []byte) ([]byte, error)
  │
  ├── Stream（流密码模式）
  │    └── XORKeyStream(dst, src []byte)
  │
  └── BlockMode（ECB/CBC 等块模式，⚠️ 不推荐用于新代码）
       ├── NewCBCEncrypter(b Block, iv []byte) BlockMode
       └── NewCBCDecrypter(b Block, iv []byte) BlockMode

  推荐使用矩阵：
  ┌───────────────────────┬──────────────────────────────────────┐
  │ 场景                  │ 推荐算法                             │
  ├───────────────────────┼──────────────────────────────────────┤
  │ 通用对称加密          │ AES-256-GCM (AEAD) ★               │
  │ 高性能/嵌入式         │ ChaCha20-Poly1305 (AEAD) ★         │
  │ 流式加密（大文件）    │ AES-256-CTR + HMAC-SHA256           │
  │ 文件/磁盘加密         │ AES-256-GCM（随机 nonce）           │
  │ 不推荐                │ AES-ECB（无 IV），AES-CBC（无认证） │
  └───────────────────────┴──────────────────────────────────────┘

  AEAD（Authenticated Encryption with Associated Data）：
  密文 = Encrypt(plaintext) || AuthTag(key, nonce, plaintext, aad)
  ├── 解密时同时验证完整性（篡改检测）
  └── aad（关联数据）：不加密但受认证保护（如 HTTP 头）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/crypto/cipher/gcm.go（简化）
// GCM = Galois/Counter Mode：CTR 模式加密 + GHASH 认证

type gcm struct {
    cipher    Block        // 底层分组密码（通常是 AES）
    nonceSize int          // nonce 大小（标准 12 字节）
    tagSize   int          // 认证 tag（默认 16 字节）
    productTable [16]gcmFieldElement // GHASH 预计算表
}

// Seal：加密并附加认证 tag
func (g *gcm) Seal(dst, nonce, plaintext, data []byte) []byte {
    ret, out := sliceForAppend(dst, len(plaintext)+g.tagSize)
    // 1. CTR 模式加密 plaintext → out[:len(plaintext)]
    g.counterCrypt(out, plaintext, &counter)
    // 2. GHASH 计算认证 tag（覆盖 aad + 密文）
    g.auth(out[len(plaintext):], out[:len(plaintext)], data, &tagMask)
    return ret
}

// Open：验证 tag 后解密（tag 验证失败返回 error）
func (g *gcm) Open(dst, nonce, ciphertext, data []byte) ([]byte, error) {
    // 1. 提取 tag
    tag := ciphertext[len(ciphertext)-g.tagSize:]
    ciphertext = ciphertext[:len(ciphertext)-g.tagSize]
    // 2. 计算期望 tag，与实际 tag 常量时间比较
    var expectedTag [gcmTagSize]byte
    g.auth(expectedTag[:], ciphertext, data, &tagMask)
    if subtle.ConstantTimeCompare(expectedTag[:g.tagSize], tag) != 1 {
        return nil, errOpen // 认证失败：密文被篡改
    }
    // 3. 解密
    ret, out := sliceForAppend(dst, len(ciphertext))
    g.counterCrypt(out, ciphertext, &counter)
    return ret, nil
}
```

---

## 二、代码示例

### AES-256-GCM：推荐的对称加密方案

```go
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "io"
)

// AES-256-GCM 加密（AEAD：同时提供加密和认证）
func encrypt(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key) // key 必须是 16/24/32 字节
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    // nonce：每次加密必须唯一（随机 12 字节）
    // ⚠️ 绝对不能重用同一个 (key, nonce) 对
    nonce := make([]byte, gcm.NonceSize()) // 12 字节
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, err
    }

    // Seal：nonce 前置 + 密文 + 16 字节认证 tag
    // 输出格式：nonce(12) || ciphertext || tag(16)
    ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
    return ciphertext, nil
}

// AES-256-GCM 解密
func decrypt(key, ciphertext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    nonceSize := gcm.NonceSize()
    if len(ciphertext) < nonceSize {
        return nil, errors.New("ciphertext too short")
    }

    nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

    // Open：验证 tag 并解密（tag 失败返回 error）
    plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return nil, errors.New("decryption failed: ciphertext tampered")
    }
    return plaintext, nil
}

// 使用
func main() {
    key := make([]byte, 32) // AES-256
    rand.Read(key)

    ciphertext, _ := encrypt(key, []byte("hello, world"))
    plaintext, _ := decrypt(key, ciphertext)
    fmt.Println(string(plaintext)) // hello, world
}
```

### AEAD 关联数据（AAD）：HTTP 头认证

```go
// 场景：加密响应 body，但 Content-Type 不加密只认证
// 任何对 aad 的篡改都会导致解密失败（完整性保护）
func encryptWithAAD(key, plaintext, additionalData []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    nonce := make([]byte, gcm.NonceSize())
    rand.Read(nonce)

    // additionalData（如 HTTP 方法+路径+时间戳）参与认证但不加密
    ciphertext := gcm.Seal(nonce, nonce, plaintext, additionalData)
    return ciphertext, nil
}

func decryptWithAAD(key, ciphertext, additionalData []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    nonce := ciphertext[:gcm.NonceSize()]
    ciphertext = ciphertext[gcm.NonceSize():]

    // 必须提供相同的 additionalData，否则认证失败
    return gcm.Open(nil, nonce, ciphertext, additionalData)
}
```

### ChaCha20-Poly1305：移动端/嵌入式推荐

```go
import "golang.org/x/crypto/chacha20poly1305"

// ChaCha20-Poly1305：无 AES-NI 硬件时比 AES-GCM 更快
// IETF 标准，TLS 1.3 内置支持
func encryptChaCha(key, plaintext []byte) ([]byte, error) {
    // key 必须是 32 字节
    aead, err := chacha20poly1305.New(key)
    if err != nil {
        return nil, err
    }

    nonce := make([]byte, aead.NonceSize()) // 12 字节
    rand.Read(nonce)

    return aead.Seal(nonce, nonce, plaintext, nil), nil
}

// XChaCha20-Poly1305：扩展 nonce（24 字节），适合随机 nonce 场景
// nonce 碰撞概率极低，适合大规模消息加密
func encryptXChaCha(key, plaintext []byte) ([]byte, error) {
    aead, err := chacha20poly1305.NewX(key)
    if err != nil {
        return nil, err
    }

    nonce := make([]byte, aead.NonceSize()) // 24 字节
    rand.Read(nonce)

    return aead.Seal(nonce, nonce, plaintext, nil), nil
}
```

### AES-CTR：大文件流式加密

```go
// AES-256-CTR：流式加密大文件（不需要一次性加载到内存）
// ⚠️ CTR 模式本身不提供完整性认证，需要额外 HMAC
func encryptStream(key []byte, src io.Reader, dst io.Writer) error {
    block, err := aes.NewCipher(key)
    if err != nil {
        return err
    }

    // IV（初始向量）：与 nonce 类似，每次必须随机
    iv := make([]byte, aes.BlockSize) // 16 字节
    if _, err := rand.Read(iv); err != nil {
        return err
    }

    // 先写 IV（解密时需要读取）
    if _, err := dst.Write(iv); err != nil {
        return err
    }

    // CTR 模式：流式加密
    stream := cipher.NewCTR(block, iv)
    writer := &cipher.StreamWriter{S: stream, W: dst}

    _, err = io.Copy(writer, src)
    return err
}

func decryptStream(key []byte, src io.Reader, dst io.Writer) error {
    block, _ := aes.NewCipher(key)

    // 读取 IV
    iv := make([]byte, aes.BlockSize)
    if _, err := io.ReadFull(src, iv); err != nil {
        return err
    }

    stream := cipher.NewCTR(block, iv)
    reader := &cipher.StreamReader{S: stream, R: src}
    _, err := io.Copy(dst, reader)
    return err
}
```

### 密钥派生：从密码生成安全密钥

```go
import "golang.org/x/crypto/argon2"

// 从用户密码派生 AES 密钥（Argon2id 是当前推荐）
func deriveKey(password, salt []byte) []byte {
    return argon2.IDKey(
        password,
        salt,
        1,        // time（迭代次数）
        64*1024,  // memory（64MB）
        4,        // threads
        32,       // keyLen（AES-256）
    )
}

// 加密流程：密码 → Argon2id → AES 密钥 → AES-GCM 加密
func encryptWithPassword(password string, plaintext []byte) ([]byte, error) {
    salt := make([]byte, 16)
    rand.Read(salt)

    key := deriveKey([]byte(password), salt)

    ciphertext, err := encrypt(key, plaintext)
    if err != nil {
        return nil, err
    }

    // 输出：salt(16) + ciphertext
    result := make([]byte, 0, 16+len(ciphertext))
    result = append(result, salt...)
    result = append(result, ciphertext...)
    return result, nil
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| 为什么推荐 AES-GCM 而不是 AES-CBC？ | GCM 是 AEAD（认证加密），同时提供加密和完整性认证；CBC 只提供加密，不检测篡改，且有 padding oracle 攻击风险 |
| `nonce` 重用会有什么后果？ | AES-GCM 中 (key, nonce) 相同的两段密文可以互 XOR 还原 keystream，攻击者可恢复明文差；nonce 必须每次随机或单调递增 |
| `Seal` 中的 `additionalData` 有什么用？ | AAD 参与认证 tag 计算但不加密；适合保护协议头、请求 ID 等元数据的完整性，防止攻击者将密文与其他 header 组合重放 |
| AES-GCM 和 ChaCha20-Poly1305 如何选择？ | 有 AES-NI 硬件（现代 x86/ARM）时 AES-GCM 更快；无硬件加速（移动/嵌入式）时 ChaCha20 更快；TLS 1.3 两者都支持，由协商决定 |
| CTR 模式为什么不适合独立使用？ | CTR 只提供加密，不提供认证；攻击者可以翻转密文中的特定位，导致明文对应位被翻转（比特翻转攻击）；必须配合 HMAC 使用 |
| AES-256 比 AES-128 安全多少？ | 理论上安全性翻倍（128→256 位），但 AES-128 目前无已知实际攻击；选 AES-256 是为了后量子安全冗余，性能开销约 10-20% |
