---
title: crypto/aes 源码精读
description: 精读 crypto/aes 与 crypto/cipher 的对称加密实现，掌握 AES-GCM 认证加密、密钥派生与安全使用模式。
---

# crypto/aes + crypto/cipher：对称加密源码精读

> 核心源码：`src/crypto/aes/aes.go`、`src/crypto/cipher/gcm.go`、`src/crypto/cipher/cbc.go`

## 包结构图

```
Go 对称加密体系
══════════════════════════════════════════════════════════════════

  crypto/aes（块加密，单块 16 字节）
  └── aes.NewCipher(key) → cipher.Block
      key 长度：16(AES-128)、24(AES-192)、32(AES-256)字节

  crypto/cipher（工作模式，块 → 流）
  ├── cipher.NewGCM(block) → cipher.AEAD    ← 推荐（认证加密）
  ├── cipher.NewCBCEncrypter/Decrypter      ← 旧模式（需手动填充）
  ├── cipher.NewCTR(block, iv)              ← 计数器模式
  └── cipher.NewOFB/CFB                    ← 不推荐

  AEAD 接口（Authenticated Encryption with Associated Data）：
  ├── aead.Seal(dst, nonce, plaintext, additionalData)  ← 加密+认证
  ├── aead.Open(dst, nonce, ciphertext, additionalData) ← 解密+验证
  ├── aead.NonceSize() int   ← GCM = 12 字节
  └── aead.Overhead() int    ← GCM = 16 字节（认证标签）

  加密模式对比：
  ┌─────────┬──────────┬────────┬──────────────────────────┐
  │ 模式    │ 认证标签 │ 并行性 │ 推荐度                   │
  ├─────────┼──────────┼────────┼──────────────────────────┤
  │ GCM     │ ✓ 16字节 │ ✓      │ ✅ 首选（AEAD）          │
  │ CBC     │ ✗        │ 解密✓  │ ⚠️  需额外 HMAC 认证     │
  │ CTR     │ ✗        │ ✓      │ ⚠️  需额外 HMAC 认证     │
  │ ECB     │ ✗        │ ✓      │ ❌ 禁止（存在模式泄漏）  │
  └─────────┴──────────┴────────┴──────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、AES-GCM 工作原理

```
AES-GCM 加密流程
══════════════════════════════════════════════════════════════════

  输入：明文 P、密钥 K（32字节）、随机 Nonce N（12字节）
        可选关联数据 A（不加密但认证，如 HTTP Header）

  加密：
  P + K + N → AES-CTR → 密文 C
  C + A + K + N → GHASH → 认证标签 T（16字节）

  输出：C || T（密文 + 认证标签，共 len(P)+16 字节）

  解密验证：
  C + A + K + N → 重新计算 T'
  若 T' != T → 认证失败（数据被篡改），返回 error
  若 T' == T → 解密成功

  关键安全属性：
  ├── Nonce 必须每次唯一（重用 Nonce → 密钥泄露！）
  ├── 认证标签确保完整性（防篡改）
  └── 关联数据可绑定上下文（防重放攻击）

══════════════════════════════════════════════════════════════════
```

---

## 二、代码示例

### AES-GCM 基础加解密

```go
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "io"
)

// 加密（AES-256-GCM）
func encrypt(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key) // key 必须 32 字节（AES-256）
    if err != nil {
        return nil, err
    }

    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }

    // ⚠️ Nonce 必须每次随机生成，绝不重用！
    nonce := make([]byte, gcm.NonceSize()) // 12 字节
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, err
    }

    // Seal：nonce || ciphertext+tag
    // 将 nonce 作为前缀存入输出（解密时需要）
    ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
    return ciphertext, nil
}

// 解密
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
        return nil, fmt.Errorf("密文太短")
    }

    // 分离 nonce 和真正的密文+标签
    nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

    // Open：验证认证标签并解密（标签验证失败 → error）
    return gcm.Open(nil, nonce, ciphertext, nil)
}
```

### 密钥派生（从密码生成密钥）

```go
import (
    "crypto/sha256"
    "golang.org/x/crypto/pbkdf2"
    "golang.org/x/crypto/argon2"
)

// ❌ 危险：直接用密码作为 AES 密钥
// key := []byte("my-password") // 长度不足且不安全

// ✅ 正确：PBKDF2 派生（推荐）
func deriveKeyPBKDF2(password, salt []byte) []byte {
    return pbkdf2.Key(password, salt, 600000, 32, sha256.New)
    // 600000 轮迭代（2023 NIST 建议）
}

// ✅ 更安全：Argon2id 派生（内存困难，抗 GPU 破解）
func deriveKeyArgon2(password, salt []byte) []byte {
    return argon2.IDKey(password, salt,
        1,         // time（迭代）
        64*1024,   // memory（64MB）
        4,         // threads
        32,        // keyLen（AES-256）
    )
}

// 完整加密流程（含密钥派生）
func encryptWithPassword(password string, plaintext []byte) ([]byte, error) {
    // 1. 生成随机 salt
    salt := make([]byte, 32)
    io.ReadFull(rand.Reader, salt)

    // 2. 派生密钥
    key := deriveKeyArgon2([]byte(password), salt)

    // 3. AES-GCM 加密
    ciphertext, err := encrypt(key, plaintext)
    if err != nil {
        return nil, err
    }

    // 4. 输出: salt || ciphertext
    return append(salt, ciphertext...), nil
}
```

### 带关联数据（绑定上下文防重放）

```go
// 关联数据（Additional Data）：不加密但参与认证
// 常用于绑定用户 ID、过期时间等元数据

type EncryptedToken struct {
    UserID    int64
    ExpiresAt int64  // Unix 时间戳
    Data      []byte // 加密的载荷
}

func sealToken(key []byte, userID int64, expires time.Time, payload []byte) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    nonce := make([]byte, gcm.NonceSize())
    io.ReadFull(rand.Reader, nonce)

    // 关联数据：userID + expiry（不加密，防止密文被移植给其他用户）
    ad := fmt.Appendf(nil, "%d:%d", userID, expires.Unix())

    ciphertext := gcm.Seal(nonce, nonce, payload, ad)
    return ciphertext, nil
}

func openToken(key, ciphertext []byte, userID int64, expires time.Time) ([]byte, error) {
    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    nonce := ciphertext[:gcm.NonceSize()]
    ct := ciphertext[gcm.NonceSize():]

    ad := fmt.Appendf(nil, "%d:%d", userID, expires.Unix())

    // 若关联数据不匹配 → 认证失败（防止 userID 被篡改）
    return gcm.Open(nil, nonce, ct, ad)
}
```

### 文件加密

```go
func encryptFile(key []byte, src, dst string) error {
    in, _ := os.Open(src)
    defer in.Close()
    out, _ := os.Create(dst)
    defer out.Close()

    block, _ := aes.NewCipher(key)
    gcm, _ := cipher.NewGCM(block)

    nonce := make([]byte, gcm.NonceSize())
    io.ReadFull(rand.Reader, nonce)
    out.Write(nonce) // 写入 nonce 头

    // 读取全部内容加密（小文件）
    // 大文件应分块：每块用递增 nonce 或独立 nonce
    plaintext, _ := io.ReadAll(in)
    ciphertext := gcm.Seal(nil, nonce, plaintext, nil)
    out.Write(ciphertext)
    return nil
}
```

### 安全随机密钥生成

```go
// 生成 AES-256 密钥（32 字节）
func generateAESKey() ([]byte, error) {
    key := make([]byte, 32)
    _, err := io.ReadFull(rand.Reader, key)
    return key, err
}

// 实际项目中密钥管理：
// - 开发：环境变量（os.Getenv）
// - 生产：AWS KMS / GCP KMS / HashiCorp Vault
// - 密钥轮换：每个加密值携带密钥版本号
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| AES-GCM 中 Nonce 重用为什么是灾难性的？ | 相同 (key, nonce) 对加密两段不同明文，攻击者可通过 XOR 破解出密钥流，等同于密钥泄露 |
| GCM 的 Overhead（16字节）是什么？ | 认证标签（GHASH），确保密文完整性；篡改密文 → Open 返回 error |
| 关联数据（Additional Data）有什么用？ | 将上下文（userID、过期时间）绑定到密文；防止攻击者将密文移植到其他上下文 |
| 为什么不能直接用密码作为 AES 密钥？ | 密码长度和随机性不足；应用 PBKDF2/Argon2 进行密钥派生（加盐、高迭代） |
| AES-CBC 和 AES-GCM 的主要区别？ | CBC 只加密，不提供完整性保证（需额外 HMAC）；GCM 是 AEAD，加密+认证一体 |
| cipher.Block 和 cipher.AEAD 的关系？ | Block 是底层块加密（单块）；AEAD 是上层工作模式（GCM 包装 Block），提供认证加密接口 |
