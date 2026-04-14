---
title: crypto/rand 源码精读
description: 精读 crypto/rand 的密码学安全随机数实现，掌握 Token 生成、UUID v4 构建与安全随机数的正确用法。
---

# crypto/rand：密码学随机数源码精读

> 核心源码：`src/crypto/rand/rand.go`、`src/crypto/rand/rand_unix.go`
>
> 图例参考：
> - `GoSecurityDiagram`：`secure-random-source`

## 包结构图

```
随机数生态对比
══════════════════════════════════════════════════════════════════

  crypto/rand（密码学安全，CSPRNG）
  ├── rand.Reader          ← io.Reader，读取安全随机字节
  ├── rand.Read(b)         ← 填充随机字节（已废弃，用 io.ReadFull）
  ├── rand.Int(r, max)     ← 生成 [0, max) 的随机 big.Int
  └── rand.Prime(r, bits)  ← 生成指定位数的随机素数

  math/rand/v2（伪随机，不安全，高性能）
  ├── rand.Float64() / Intn / Shuffle ...
  └── 适合：模拟、游戏、测试、不需要安全性的场景

  操作系统随机源：
  ├── Linux   → getrandom(2) 系统调用（>=3.17）或 /dev/urandom
  ├── macOS   → arc4random（内核 CSPRNG）
  └── Windows → BCryptGenRandom

  crypto/rand vs math/rand 选择：
  ┌───────────────────────┬────────────────────────────────────┐
  │ crypto/rand           │ math/rand/v2                       │
  ├───────────────────────┼────────────────────────────────────┤
  │ 密码学安全（不可预测）│ 可预测（给定种子输出固定）         │
  │ 较慢（系统调用）      │ 极快（纯计算，ChaCha8/PCG）        │
  │ Token/密钥/UUID       │ 测试数据/随机采样/游戏             │
  └───────────────────────┴────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

<GoSecurityDiagram kind="secure-random-source" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/crypto/rand/rand.go
// Reader 是全局 io.Reader，读取密码学安全随机字节
var Reader io.Reader

func init() {
    Reader = &reader{} // 平台相关实现
}

// src/crypto/rand/rand_unix.go（Linux/macOS）
type reader struct {
    mu   sync.Mutex
    used atomic.Uint32
}

func (r *reader) Read(b []byte) (n int, err error) {
    // Linux ≥ 3.17：用 getrandom 系统调用（阻塞直到熵足够）
    // Linux < 3.17：/dev/urandom（不阻塞，早期启动可能熵不足）
    // macOS：arc4random_buf（arc4random 实际用 ChaCha20）
    return
}

// rand.Int：生成均匀分布的 [0, max) 随机大整数
// 内部：拒绝采样（rejection sampling）确保均匀分布
func Int(rand io.Reader, max *big.Int) (n *big.Int, err error) {
    // 循环读取随机字节，丢弃超出范围的值，保证均匀分布
}
```
:::

---

## 二、代码示例

### 生成随机字节与安全 Token

::: details 点击展开代码：生成随机字节与安全 Token
```go
import (
    "crypto/rand"
    "encoding/base64"
    "encoding/hex"
    "io"
)

// 生成 N 字节安全随机数据
func randomBytes(n int) ([]byte, error) {
    b := make([]byte, n)
    if _, err := io.ReadFull(rand.Reader, b); err != nil {
        return nil, err
    }
    return b, nil
}

// 生成 URL-safe Token（常用于会话 ID、CSRF Token）
func generateToken(byteLen int) (string, error) {
    b, err := randomBytes(byteLen)
    if err != nil {
        return "", err
    }
    return base64.URLEncoding.EncodeToString(b), nil
}

// 生成十六进制 Token（32字节 = 256位安全性）
func generateHexToken() (string, error) {
    b, err := randomBytes(32)
    if err != nil {
        return "", err
    }
    return hex.EncodeToString(b), nil
}

// 示例
token, _ := generateToken(32)  // 43字符 base64 URL-safe
hexTok, _ := generateHexToken() // 64字符十六进制
```
:::

### UUID v4 生成

::: details 点击展开代码：UUID v4 生成
```go
// UUID v4：基于随机数（RFC 4122）
func newUUIDv4() (string, error) {
    var uuid [16]byte
    if _, err := io.ReadFull(rand.Reader, uuid[:]); err != nil {
        return "", err
    }

    // 设置版本位（version 4）
    uuid[6] = (uuid[6] & 0x0f) | 0x40
    // 设置变体位（variant 10xx）
    uuid[8] = (uuid[8] & 0x3f) | 0x80

    return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
        uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:],
    ), nil
}

// 示例输出：550e8400-e29b-41d4-a716-446655440000

// 实际项目推荐使用 github.com/google/uuid：
// uuid.New()           // v4
// uuid.NewString()     // 字符串形式
```
:::

### 密码学安全的随机整数

::: details 点击展开代码：密码学安全的随机整数
```go
import (
    "crypto/rand"
    "math/big"
)

// 生成 [0, n) 的安全随机整数
func randInt(max int64) (int64, error) {
    n, err := rand.Int(rand.Reader, big.NewInt(max))
    if err != nil {
        return 0, err
    }
    return n.Int64(), nil
}

// 生成随机端口（1024-65535）
func randomPort() (int, error) {
    n, err := randInt(65535 - 1024)
    if err != nil {
        return 0, err
    }
    return int(n.Int64()) + 1024, nil
}

// 随机采样（密码学安全版 Fisher-Yates）
func secureShuffleStrings(s []string) error {
    for i := len(s) - 1; i > 0; i-- {
        jBig, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
        if err != nil {
            return err
        }
        j := int(jBig.Int64())
        s[i], s[j] = s[j], s[i]
    }
    return nil
}
```
:::

### API 密钥生成器

::: details 点击展开代码：API 密钥生成器
```go
// 生成带前缀的 API Key（类似 GitHub/Stripe 风格）
func generateAPIKey(prefix string) (string, error) {
    b, err := randomBytes(24) // 24字节 = 192位
    if err != nil {
        return "", err
    }
    // base32 避免 base64 的 +/= 字符，更易于复制
    encoded := base32.StdEncoding.WithPadding(base32.NoPadding).
        EncodeToString(b)

    return prefix + "_" + strings.ToLower(encoded), nil
}

// stripe_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx （Stripe 风格示例）
key, _ := generateAPIKey("stripe_live")
```
:::

### 密码重置 Token（带过期时间）

::: details 点击展开代码：密码重置 Token（带过期时间）
```go
type ResetToken struct {
    Token     string
    UserID    int64
    ExpiresAt time.Time
}

func generateResetToken(userID int64) (*ResetToken, error) {
    token, err := generateHexToken() // 64 字符
    if err != nil {
        return nil, err
    }
    return &ResetToken{
        Token:     token,
        UserID:    userID,
        ExpiresAt: time.Now().Add(24 * time.Hour),
    }, nil
}

// 存入 Redis 或数据库（key=token, value=userID, TTL=24h）
func storeToken(ctx context.Context, rt *ResetToken) error {
    return rdb.Set(ctx,
        "reset:"+rt.Token,
        rt.UserID,
        time.Until(rt.ExpiresAt),
    ).Err()
}
```
:::

### 加密 salt 生成

::: details 点击展开代码：加密 salt 生成
```go
// bcrypt salt 由 bcrypt 库内部用 crypto/rand 生成
// 但若需要手动生成 salt（用于 PBKDF2/Argon2）
func generateSalt(size int) ([]byte, error) {
    return randomBytes(size) // 通常 16 或 32 字节
}

// PBKDF2 密钥派生
import "golang.org/x/crypto/pbkdf2"

func deriveKey(password string, salt []byte) []byte {
    return pbkdf2.Key(
        []byte(password),
        salt,
        100000,         // 迭代次数（越高越安全）
        32,             // 输出密钥长度
        sha256.New,     // 哈希函数
    )
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| crypto/rand 和 math/rand 的本质区别？ | crypto/rand 读取 OS 提供的 CSPRNG（不可预测）；math/rand 是伪随机（可预测，给定种子输出固定） |
| 为什么 rand.Read 被废弃（Go 1.20+）？ | 签名 `func Read(b []byte) (n int, err error)` 从不返回 error（OS CSPRNG 极少失败），废弃避免误导；改用 `io.ReadFull(rand.Reader, b)` |
| UUID v4 的随机性有多强？ | 122 位随机位（去除版本和变体位）；碰撞概率极低（约 1/2^61 for 10^9 个 UUID）|
| rand.Int 如何保证均匀分布？ | 拒绝采样：生成足够位数随机数，若超出 [0, max) 则丢弃重试，直到在范围内 |
| 生成会话 ID 用多少字节？ | 至少 16 字节（128位），推荐 32 字节（256位）；更多字节更难暴力破解 |
| 什么场景必须用 crypto/rand？ | Token/密钥/密码 salt/UUID/验证码/CSRF Token；只要安全相关，都用 crypto/rand |
