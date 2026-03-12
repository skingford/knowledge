---
title: 密码散列：bcrypt/argon2/scrypt 源码精读
description: 精读 Go x/crypto 密码散列实现，掌握 bcrypt/Argon2id/scrypt 算法选择、cost factor 调优与生产级密码存储最佳实践。
---

# 密码散列：bcrypt / Argon2id / scrypt 源码精读

> 核心源码：`golang.org/x/crypto/bcrypt`、`golang.org/x/crypto/argon2`、`golang.org/x/crypto/scrypt`

## 包结构图

```
密码散列体系（golang.org/x/crypto）
══════════════════════════════════════════════════════════════════

  ⚠️ 绝对不能用于密码存储的函数：
  ├── MD5 / SHA-256 / SHA-512   ← 速度太快，暴力破解成本低
  └── HMAC-SHA256               ← 同上，非密码专用哈希

  专用密码散列函数（慢哈希）：
  ┌───────────────┬─────────┬──────────────────────────────────┐
  │ 算法          │ 推荐度  │ 特点                             │
  ├───────────────┼─────────┼──────────────────────────────────┤
  │ Argon2id      │ ★★★★★  │ 内存+CPU 硬化，OWASP 2023 首选  │
  │ bcrypt        │ ★★★★☆  │ 成熟稳定，广泛支持，纯 CPU 硬化 │
  │ scrypt        │ ★★★★☆  │ 内存+CPU 硬化，比 Argon2 早     │
  │ PBKDF2-SHA512 │ ★★★☆☆  │ FIPS 合规场景（政府/银行）      │
  └───────────────┴─────────┴──────────────────────────────────┘

  Argon2id 参数（OWASP 推荐）：
  ├── Memory:  64MB（最低）→ 生产建议 128MB+
  ├── Time:    1 次迭代（最低）→ 生产建议 2+
  ├── Threads: runtime.NumCPU()
  └── KeyLen:  32 字节

  bcrypt 成本因子（cost factor）：
  ├── cost=10  → ~100ms（最低安全线）
  ├── cost=12  → ~400ms（推荐：2024 年标准硬件）
  └── cost=14  → ~1600ms（高安全场景）
  每增加 1，计算量翻倍。随硬件提升需周期性调高

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// bcrypt 内部：OpenBSD Blowfish 算法变体
// cost factor 控制 key setup 轮数：2^cost 次
// 输出格式（60字符固定长度）：
// $2a$12$<22字符salt><31字符hash>
// └── 算法版本  └── cost

// argon2 内部：Memory-Hard Function
// 填充 Memory KB 的内存块（每个 1KB）
// 多次迭代混合 → 输出 keyLen 字节
// 攻击者必须真正占用内存，GPU/ASIC 优势大幅缩小
```

---

## 二、代码示例

### bcrypt：密码散列与验证

```go
import "golang.org/x/crypto/bcrypt"

// 散列密码（注册/修改密码时使用）
func hashPassword(password string) (string, error) {
    // cost=12：约 400ms，平衡安全与性能
    hash, err := bcrypt.GenerateFromPassword(
        []byte(password),
        12, // bcrypt.DefaultCost=10，推荐 12
    )
    if err != nil {
        return "", err
    }
    return string(hash), nil
}

// 验证密码（登录时使用）
func verifyPassword(hash, password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    return err == nil // 内置常量时间比较，防时序攻击
}

// 使用示例
func registerUser(username, password string) error {
    hash, err := hashPassword(password)
    if err != nil {
        return err
    }
    // 存储 hash（而非明文密码）
    return db.Exec("INSERT INTO users(username, password_hash) VALUES(?,?)",
        username, hash)
}

func loginUser(username, password string) (bool, error) {
    var hash string
    err := db.QueryRow("SELECT password_hash FROM users WHERE username=?",
        username).Scan(&hash)
    if err == sql.ErrNoRows {
        // 防枚举：即使用户不存在也执行一次比较（恒定时间）
        bcrypt.CompareHashAndPassword([]byte("$2a$12$invalid"), []byte(password))
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return verifyPassword(hash, password), nil
}
```

### Argon2id：OWASP 2023 首选算法

```go
import (
    "crypto/rand"
    "crypto/subtle"
    "encoding/base64"
    "fmt"
    "golang.org/x/crypto/argon2"
    "strings"
)

// Argon2id 参数（遵循 OWASP 推荐）
type Argon2Params struct {
    Memory      uint32 // 内存（KB）：64MB = 64*1024
    Iterations  uint32 // 迭代次数
    Parallelism uint8  // 并行线程数
    SaltLen     uint32 // salt 长度（字节）
    KeyLen      uint32 // 输出密钥长度
}

var defaultParams = &Argon2Params{
    Memory:      64 * 1024, // 64MB（OWASP 最低）
    Iterations:  1,
    Parallelism: 2,
    SaltLen:     16,
    KeyLen:      32,
}

// 散列密码，输出 PHC 格式字符串（自包含参数）
func hashArgon2id(password string) (string, error) {
    salt := make([]byte, defaultParams.SaltLen)
    if _, err := rand.Read(salt); err != nil {
        return "", err
    }

    hash := argon2.IDKey(
        []byte(password),
        salt,
        defaultParams.Iterations,
        defaultParams.Memory,
        defaultParams.Parallelism,
        defaultParams.KeyLen,
    )

    // PHC 格式：$argon2id$v=19$m=65536,t=1,p=2$<salt>$<hash>
    b64Salt := base64.RawStdEncoding.EncodeToString(salt)
    b64Hash := base64.RawStdEncoding.EncodeToString(hash)

    return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
        argon2.Version,
        defaultParams.Memory,
        defaultParams.Iterations,
        defaultParams.Parallelism,
        b64Salt,
        b64Hash,
    ), nil
}

// 验证 Argon2id 密码
func verifyArgon2id(password, encodedHash string) (bool, error) {
    // 解析 PHC 格式
    parts := strings.Split(encodedHash, "$")
    if len(parts) != 6 {
        return false, errors.New("invalid hash format")
    }

    var p Argon2Params
    var version int
    fmt.Sscanf(parts[2], "v=%d", &version)
    fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d",
        &p.Memory, &p.Iterations, &p.Parallelism)

    salt, _ := base64.RawStdEncoding.DecodeString(parts[4])
    hash, _ := base64.RawStdEncoding.DecodeString(parts[5])
    p.KeyLen = uint32(len(hash))

    // 使用相同参数重新计算
    computed := argon2.IDKey(
        []byte(password), salt,
        p.Iterations, p.Memory, p.Parallelism, p.KeyLen,
    )

    // 常量时间比较（防时序攻击）
    return subtle.ConstantTimeCompare(hash, computed) == 1, nil
}
```

### 密码重散列：自动升级 cost factor

```go
// 生产最佳实践：登录成功后检测 cost，自动升级旧散列
func loginWithRehash(username, password string) error {
    var storedHash string
    db.QueryRow("SELECT password_hash FROM users WHERE username=?",
        username).Scan(&storedHash)

    if !verifyPassword(storedHash, password) {
        return errors.New("invalid credentials")
    }

    // 检查 cost 是否需要升级
    cost, _ := bcrypt.Cost([]byte(storedHash))
    if cost < 12 {
        // 用更高 cost 重新散列（透明升级，用户无感知）
        newHash, _ := hashPassword(password)
        db.Exec("UPDATE users SET password_hash=? WHERE username=?",
            newHash, username)
        log.Printf("用户 %s 密码散列已从 cost=%d 升级到 cost=12", username, cost)
    }

    return nil
}
```

### 算法性能对比基准

```go
func BenchmarkPasswordHashing(b *testing.B) {
    password := "test-password-123"

    b.Run("bcrypt-cost10", func(b *testing.B) {
        for b.Loop() {
            bcrypt.GenerateFromPassword([]byte(password), 10)
        }
    })

    b.Run("bcrypt-cost12", func(b *testing.B) {
        for b.Loop() {
            bcrypt.GenerateFromPassword([]byte(password), 12)
        }
    })

    b.Run("argon2id-64MB", func(b *testing.B) {
        salt := make([]byte, 16)
        for b.Loop() {
            argon2.IDKey([]byte(password), salt, 1, 64*1024, 2, 32)
        }
    })

    b.Run("scrypt-N32768", func(b *testing.B) {
        salt := make([]byte, 16)
        for b.Loop() {
            scrypt.Key([]byte(password), salt, 32768, 8, 1, 32)
        }
    })
}

// 参考耗时（2024 标准服务器）：
// bcrypt-cost10:  ~80ms
// bcrypt-cost12:  ~320ms
// argon2id-64MB:  ~30ms（内存 64MB，线程 2）
// scrypt-N32768:  ~150ms
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| 为什么不能用 SHA-256 存储密码？ | SHA-256 速度极快（GB/s 级）；GPU 可每秒计算数十亿次；攻击者用 rainbow table 或暴力破解成本极低；必须用慢哈希函数 |
| bcrypt 和 Argon2id 如何选择？ | 新项目首选 Argon2id（内存硬化，抵抗 GPU/ASIC）；存量系统用 bcrypt（成熟稳定，迁移成本低）；合规场景（FIPS）用 PBKDF2-SHA512 |
| bcrypt cost factor 如何确定？ | 目标：在目标服务器上散列耗时 300-500ms；每 18-24 个月评估一次，随硬件提升调高 1（计算量翻倍）；登录时自动重散列实现平滑升级 |
| 为什么登录时即使用户不存在也要执行比较？ | 防时序攻击：若不存在直接返回，攻击者可通过响应时间枚举有效用户名；执行无效比较保证恒定时间响应 |
| bcrypt 输出为什么是 60 字节固定长度？ | 格式 `$2a$cost$22字符salt31字符hash`；salt 内嵌在输出中，无需单独存储；bcrypt 自身验证函数解析格式，接口简洁 |
| Argon2i 和 Argon2id 的区别？ | Argon2i：内存访问模式固定，抵抗 side-channel；Argon2id：混合模式（前半 Argon2i + 后半 Argon2d），两者优点兼顾；OWASP 推荐 Argon2id |
