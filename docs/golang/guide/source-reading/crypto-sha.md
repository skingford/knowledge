---
title: crypto/sha256 & hash 接口源码精读
description: 精读 Go hash 接口体系与 SHA-256/SHA-512 实现，掌握 Merkle 树、流式哈希、HMAC 构建及数据完整性校验最佳实践。
---

# crypto/sha256 & hash 接口：源码精读

> 核心源码：`src/crypto/sha256/sha256.go`、`src/hash/hash.go`

## 包结构图

```
Go hash 体系
══════════════════════════════════════════════════════════════════

  hash.Hash（核心接口）
  ├── io.Writer            ← Write([]byte) 流式输入
  ├── Sum(b []byte) []byte ← 追加摘要（不重置状态）
  ├── Reset()              ← 重置为初始状态
  ├── Size() int           ← 摘要字节数
  └── BlockSize() int      ← 算法块大小

  hash.Hash32 / hash.Hash64
  └── Sum32() / Sum64()    ← 快速非加密哈希（fnv/adler32）

  标准库实现矩阵：
  ┌──────────────┬──────────┬─────────────────────────────────┐
  │ 包           │ 输出长度 │ 用途                            │
  ├──────────────┼──────────┼─────────────────────────────────┤
  │ crypto/sha256│ 32 字节  │ 数据完整性、数字签名、TLS       │
  │ crypto/sha512│ 64 字节  │ 高安全场景、SHA-512/256         │
  │ crypto/sha1  │ 20 字节  │ Git 对象 ID（已不推荐加密用）   │
  │ crypto/md5   │ 16 字节  │ 非安全校验（文件指纹）          │
  │ hash/fnv     │ 4/8 字节 │ Hash Map、非加密去重            │
  │ hash/adler32 │ 4 字节   │ zlib/gzip 快速校验              │
  └──────────────┴──────────┴─────────────────────────────────┘

  SHA-256 内部：
  ├── 块大小：64 字节（512 位）
  ├── 摘要：32 字节（256 位）
  ├── 轮数：64 轮 → 8 个 32 位中间状态字（a-h）
  └── iv：前 8 个素数平方根小数部分（固定常量）

  crypto/hmac（基于 hash 接口）：
  HMAC = Hash((K ⊕ opad) || Hash((K ⊕ ipad) || message))
  └── 使用 hash.Hash 作为底层，任意哈希算法均可插入

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/hash/hash.go
type Hash interface {
    io.Writer             // Write([]byte) (int, error)
    Sum(b []byte) []byte  // 追加摘要到 b，不改变哈希状态
    Reset()
    Size() int
    BlockSize() int
}

// src/crypto/sha256/sha256.go（简化）
// SHA-256 的核心状态：8 个 32 位字（初始为固定 iv）
type digest struct {
    h   [8]uint32   // 中间哈希值
    x   [chunk]byte // 当前未处理块（64 字节）
    nx  int          // x 中已写字节数
    len uint64       // 已处理总字节数（用于 padding）
}

// Write：填充块，满 64 字节触发一轮 block 压缩
func (d *digest) Write(p []byte) (nn int, err error) {
    nn = len(p)
    d.len += uint64(nn)
    if d.nx > 0 {
        n := copy(d.x[d.nx:], p)
        d.nx += n
        if d.nx == chunk {
            block(d, d.x[:])  // 核心压缩函数（汇编实现）
            d.nx = 0
        }
        p = p[n:]
    }
    if len(p) >= chunk {
        n := len(p) &^ (chunk - 1)
        block(d, p[:n])
        p = p[n:]
    }
    if len(p) > 0 {
        d.nx = copy(d.x[:], p)
    }
    return
}

// Sum：添加 Merkle-Damgård 填充后输出摘要
func (d0 *digest) Sum(in []byte) []byte {
    d := *d0 // 复制状态，不影响后续 Write
    hash := d.checkSum()
    return append(in, hash[:]...)
}
```

---

## 二、代码示例

### 基础：计算文件哈希

```go
import (
    "crypto/sha256"
    "encoding/hex"
    "io"
    "os"
)

// 流式计算文件 SHA-256（不把整个文件读入内存）
func sha256File(path string) (string, error) {
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

// 简单字节哈希（小数据直接用）
func sha256Sum(data []byte) string {
    sum := sha256.Sum256(data) // [32]byte，一次性
    return hex.EncodeToString(sum[:])
}
```

### SHA-256 vs SHA-512 选择

```go
import (
    "crypto/sha256"
    "crypto/sha512"
)

// SHA-256：32 字节，绝大多数场景（TLS、代码签名、数字指纹）
func hash256(data []byte) []byte {
    h := sha256.Sum256(data)
    return h[:]
}

// SHA-512/256：截断为 32 字节，避免长度扩展攻击，比 SHA-256 在 64 位 CPU 更快
func hash512_256(data []byte) []byte {
    h := sha512.Sum512_256(data)
    return h[:]
}

// SHA-512：64 字节，密钥派生、高安全场景
func hash512(data []byte) []byte {
    h := sha512.Sum512(data)
    return h[:]
}
```

### HMAC：基于 hash 接口的消息认证

```go
import (
    "crypto/hmac"
    "crypto/sha256"
)

// HMAC-SHA256 签名
func hmacSign(key, message []byte) []byte {
    mac := hmac.New(sha256.New, key)
    mac.Write(message)
    return mac.Sum(nil) // 32 字节
}

// 常量时间比较（防时序攻击）
func hmacVerify(key, message, sig []byte) bool {
    expected := hmacSign(key, message)
    return hmac.Equal(sig, expected)
}

// Webhook 签名验证（GitHub/Stripe 风格）
func validateWebhook(secret string, body []byte, sigHeader string) bool {
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(body)
    expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))
    return hmac.Equal([]byte(expected), []byte(sigHeader))
}
```

### Merkle 树：数据完整性验证

```go
// Merkle 树（简化版，用于区块链/文件分块校验）
func buildMerkleRoot(chunks [][]byte) []byte {
    if len(chunks) == 0 {
        return nil
    }

    // 叶子节点哈希
    hashes := make([][]byte, len(chunks))
    for i, chunk := range chunks {
        h := sha256.Sum256(chunk)
        hashes[i] = h[:]
    }

    // 逐层合并（奇数个时复制最后一个）
    for len(hashes) > 1 {
        if len(hashes)%2 != 0 {
            hashes = append(hashes, hashes[len(hashes)-1])
        }
        next := make([][]byte, len(hashes)/2)
        for i := 0; i < len(hashes); i += 2 {
            combined := append(hashes[i], hashes[i+1]...)
            h := sha256.Sum256(combined)
            next[i/2] = h[:]
        }
        hashes = next
    }

    return hashes[0]
}
```

### sync.Pool 复用 hash.Hash（高并发优化）

```go
var sha256Pool = sync.Pool{
    New: func() any { return sha256.New() },
}

// 高并发场景下复用 hash 对象，避免频繁分配
func sha256Fast(data []byte) []byte {
    h := sha256Pool.Get().(hash.Hash)
    defer sha256Pool.Put(h)

    h.Reset()
    h.Write(data)
    return h.Sum(nil) // ⚠️ 不要持有返回值的引用
}
```

### 内容寻址存储（CAS）

```go
// 基于 SHA-256 的内容寻址存储（类似 Git 对象存储）
type ContentStore struct {
    dir string
}

func (cs *ContentStore) Put(data []byte) (string, error) {
    key := sha256Sum(data)
    path := filepath.Join(cs.dir, key[:2], key[2:])

    if _, err := os.Stat(path); err == nil {
        return key, nil // 已存在，内容相同则跳过
    }

    os.MkdirAll(filepath.Dir(path), 0755)
    return key, os.WriteFile(path, data, 0644)
}

func (cs *ContentStore) Get(key string) ([]byte, error) {
    path := filepath.Join(cs.dir, key[:2], key[2:])
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    // 验证完整性
    if sha256Sum(data) != key {
        return nil, errors.New("数据损坏")
    }
    return data, nil
}
```

### 彩虹表防护：加盐哈希

```go
import (
    "crypto/rand"
    "crypto/sha256"
    "encoding/hex"
)

// ⚠️ 生产中应使用 bcrypt/argon2，此处仅演示加盐哈希原理
type SaltedHash struct {
    Salt string
    Hash string
}

func hashPassword(password string) (SaltedHash, error) {
    salt := make([]byte, 16)
    if _, err := rand.Read(salt); err != nil {
        return SaltedHash{}, err
    }

    h := sha256.New()
    h.Write(salt)
    h.Write([]byte(password))

    return SaltedHash{
        Salt: hex.EncodeToString(salt),
        Hash: hex.EncodeToString(h.Sum(nil)),
    }, nil
}

func verifyPassword(password string, sh SaltedHash) bool {
    salt, _ := hex.DecodeString(sh.Salt)
    h := sha256.New()
    h.Write(salt)
    h.Write([]byte(password))
    computed := hex.EncodeToString(h.Sum(nil))
    return hmac.Equal([]byte(computed), []byte(sh.Hash))
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `hash.Hash.Sum(b)` 为什么不重置状态？ | Sum 是"快照"操作，追加摘要到 b 后 hash 对象可继续 Write；这允许流式计算中途检查点 |
| SHA-256 和 SHA-512 各适合什么场景？ | SHA-256 用于大多数场景（TLS/代码签名）；SHA-512 在 64 位 CPU 上更快，适合高安全要求；SHA-512/256 兼顾两者 |
| 为什么不能直接用 SHA-256 做 HMAC？ | 普通 `SHA256(key || msg)` 有长度扩展攻击漏洞；HMAC 用双层嵌套构造解决此问题 |
| `hmac.Equal` 为什么要用常量时间比较？ | 普通 `==` 比较有时序侧信道，攻击者可通过响应时间推导出签名前缀；`hmac.Equal` 无论差异在哪里都花等量时间 |
| SHA-256 的 `Sum256(data)` 和 `New().Write().Sum()` 的区别？ | `Sum256` 返回 `[32]byte`（栈分配）；`New()` 方式返回 `[]byte`（堆分配），但支持流式输入；高频场景用 sync.Pool 复用 |
| sync.Pool 复用 hash.Hash 时需要注意什么？ | 归还前必须 Reset()，且不能持有 Sum() 返回的切片（归还后 h 被重置，切片内容可能被覆盖） |
