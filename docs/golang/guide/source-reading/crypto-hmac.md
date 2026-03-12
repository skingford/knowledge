---
title: crypto/hmac 源码精读
description: 精读 crypto/hmac 与 hash 生态系统，理解 HMAC 认证、SHA 系列哈希与 Go 接口驱动的密码学设计。
---

# crypto/hmac：哈希与消息认证源码精读

> 核心源码：`src/crypto/hmac/hmac.go`、`src/crypto/sha256/sha256.go`、`src/hash/hash.go`

## 包结构图

```
Go 哈希与 MAC 生态
══════════════════════════════════════════════════════════════════

  hash.Hash 接口（核心抽象）
  ├── io.Writer              ← Write(p []byte) 流式输入
  ├── Sum(b []byte) []byte   ← 追加当前哈希值（不重置状态）
  ├── Reset()                ← 重置到初始状态
  ├── Size() int             ← 输出字节数
  └── BlockSize() int        ← 输入块大小

  hash 算法实现：
  ├── crypto/sha256  → sha256.New()（32字节）/ sha224.New()（28字节）
  ├── crypto/sha512  → sha512.New()（64字节）/ sha384.New()（48字节）
  ├── crypto/sha1    → sha1.New()（20字节，已不安全，勿用于新设计）
  ├── crypto/md5     → md5.New()（16字节，已不安全）
  ├── hash/fnv       → fnv.New32/64/128（非密码学，快速哈希）
  └── hash/crc32     → crc32.NewIEEE（校验和）

  HMAC（Hash-based Message Authentication Code）：
  crypto/hmac
  ├── hmac.New(hashFunc, key) → hash.Hash
  └── hmac.Equal(mac1, mac2)  ← 常数时间比较（防时序攻击）

  便捷函数（一次性哈希）：
  sha256.Sum256(data)  → [32]byte
  sha512.Sum512(data)  → [64]byte
  md5.Sum(data)        → [16]byte

══════════════════════════════════════════════════════════════════
```

---

## 一、hash.Hash 接口与 HMAC 实现

```go
// src/hash/hash.go
type Hash interface {
    io.Writer                    // Write 追加数据
    Sum(b []byte) []byte         // 返回 b + 当前摘要（不影响状态）
    Reset()                      // 重置状态（可复用）
    Size() int                   // 摘要字节长度
    BlockSize() int              // 内部块大小
}

// src/crypto/hmac/hmac.go（简化）
type hmac struct {
    opad, ipad hash.Hash   // 外层/内层哈希
    outer      hash.Hash
    inner      hash.Hash
    // HMAC(key, msg) = H((key ⊕ opad) || H((key ⊕ ipad) || msg))
}

func New(h func() hash.Hash, key []byte) hash.Hash {
    hm := new(hmac)
    hm.outer = h()
    hm.inner = h()
    blockSize := hm.inner.BlockSize()

    // key 超过块大小时先哈希
    if len(key) > blockSize {
        hm.outer.Write(key)
        key = hm.outer.Sum(nil)
        hm.outer.Reset()
    }

    // 构造 ipad（0x36 填充）和 opad（0x5c 填充）
    ipad := make([]byte, blockSize)
    opad := make([]byte, blockSize)
    copy(ipad, key)
    copy(opad, key)
    for i := range ipad {
        ipad[i] ^= 0x36
        opad[i] ^= 0x5c
    }
    hm.inner.Write(ipad)
    hm.outer.Write(opad)
    // ...
    return hm
}
```

---

## 二、代码示例

### SHA256 哈希

```go
import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

// 一次性哈希（小数据）
data := []byte("Hello, Go!")
sum := sha256.Sum256(data)                // [32]byte 值类型
fmt.Println(hex.EncodeToString(sum[:]))   // 十六进制字符串

// 流式哈希（大文件）
func hashFile(path string) (string, error) {
    f, err := os.Open(path)
    if err != nil {
        return "", err
    }
    defer f.Close()

    h := sha256.New()
    if _, err := io.Copy(h, f); err != nil {
        return "", err
    }
    return hex.EncodeToString(h.Sum(nil)), nil
}

// 多次复用（Reset 避免重复分配）
h := sha256.New()
for _, chunk := range chunks {
    h.Reset()
    h.Write(chunk)
    digest := h.Sum(nil)
    process(digest)
}
```

### HMAC 签名与验证（API 认证）

```go
import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/base64"
)

var secretKey = []byte("my-secret-key-32-bytes-minimum!!")

// 生成 HMAC 签名
func sign(payload []byte) string {
    mac := hmac.New(sha256.New, secretKey)
    mac.Write(payload)
    return base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

// 验证签名（常数时间比较，防止时序攻击）
func verify(payload []byte, signature string) bool {
    expected, err := base64.StdEncoding.DecodeString(signature)
    if err != nil {
        return false
    }
    mac := hmac.New(sha256.New, secretKey)
    mac.Write(payload)
    actual := mac.Sum(nil)

    // ✅ 必须用 hmac.Equal，不能用 bytes.Equal 或 ==
    // hmac.Equal 是常数时间比较，防止通过响应时间推断签名
    return hmac.Equal(actual, expected)
}

// HTTP 请求签名中间件
func signRequest(r *http.Request, body []byte) {
    timestamp := strconv.FormatInt(time.Now().Unix(), 10)
    payload := timestamp + "." + string(body)
    sig := sign([]byte(payload))

    r.Header.Set("X-Timestamp", timestamp)
    r.Header.Set("X-Signature", sig)
}

func verifyRequest(r *http.Request, body []byte) bool {
    timestamp := r.Header.Get("X-Timestamp")
    sig := r.Header.Get("X-Signature")

    // 防重放：时间戳在 5 分钟内
    ts, _ := strconv.ParseInt(timestamp, 10, 64)
    if time.Since(time.Unix(ts, 0)) > 5*time.Minute {
        return false
    }

    payload := timestamp + "." + string(body)
    return verify([]byte(payload), sig)
}
```

### Webhook 签名验证（GitHub/Stripe 风格）

```go
// GitHub Webhook 签名验证
func verifyGitHubWebhook(payload []byte, signature, secret string) bool {
    // signature 格式: "sha256=<hex>"
    if !strings.HasPrefix(signature, "sha256=") {
        return false
    }
    sigHex := signature[7:]
    sigBytes, err := hex.DecodeString(sigHex)
    if err != nil {
        return false
    }

    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(payload)
    expected := mac.Sum(nil)

    return hmac.Equal(expected, sigBytes) // 常数时间比较
}

// 使用示例
http.HandleFunc("/webhook", func(w http.ResponseWriter, r *http.Request) {
    body, _ := io.ReadAll(r.Body)
    sig := r.Header.Get("X-Hub-Signature-256")

    if !verifyGitHubWebhook(body, sig, os.Getenv("WEBHOOK_SECRET")) {
        http.Error(w, "Invalid signature", http.StatusUnauthorized)
        return
    }
    // 处理 webhook...
})
```

### 密码哈希（bcrypt/argon2，非 SHA）

```go
import "golang.org/x/crypto/bcrypt"

// ✅ 密码存储：用 bcrypt/argon2，不要用 SHA
func hashPassword(pwd string) (string, error) {
    hash, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
    return string(hash), err
}

func checkPassword(pwd, hash string) bool {
    return bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd)) == nil
}

// ❌ 错误：用 SHA256 存密码（无加盐，可彩虹表攻击）
// sha256.Sum256([]byte(password)) ← 危险！
```

### 内容完整性校验

```go
// 文件下载完整性校验
type VerifiedReader struct {
    r        io.Reader
    h        hash.Hash
    expected []byte
}

func NewVerifiedReader(r io.Reader, expectedSHA256 []byte) *VerifiedReader {
    return &VerifiedReader{r: r, h: sha256.New(), expected: expectedSHA256}
}

func (v *VerifiedReader) Read(p []byte) (int, error) {
    n, err := v.r.Read(p)
    v.h.Write(p[:n])
    if err == io.EOF {
        if !hmac.Equal(v.h.Sum(nil), v.expected) {
            return n, fmt.Errorf("SHA256 校验失败：文件可能已损坏")
        }
    }
    return n, err
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| HMAC 和直接哈希的区别？ | HMAC 需要密钥，防止伪造；SHA256(msg) 任何人都能计算，无法验证来源 |
| 为什么要用 hmac.Equal 而不是 bytes.Equal？ | bytes.Equal 在首个不匹配字节处提前返回，时序差异可被攻击者用于推断签名；hmac.Equal 是常数时间 |
| SHA1/MD5 还能用吗？ | 非密码学场景（校验和、缓存 key）可用；密码学场景（签名、密码）不安全，禁止使用 |
| hash.Hash 的 Sum 会重置状态吗？ | 不会！Sum 追加摘要到参数 b，不修改内部状态；可继续 Write 更多数据 |
| 密码存储该用哪个算法？ | bcrypt（golang.org/x/crypto/bcrypt）或 argon2id；不要用 SHA 系列（无加盐、速度太快）|
| fnv 和 sha256 的使用场景区别？ | fnv（hash/fnv）：非密码学，极快，用于 map/cache key；sha256：密码学安全，用于签名、完整性校验 |
