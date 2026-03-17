---
title: math/rand 源码精读
description: 精读 Go math/rand v1 与 v2（Go 1.22+）的 ChaCha8/PCG 生成器实现，理解伪随机数生成、并发安全设计与 v1→v2 迁移。
---

# math/rand：随机数源码精读

> 核心源码：`src/math/rand/v2/`（Go 1.22+）、`src/math/rand/`（legacy）

## 包结构图

```
math/rand 版本对比
══════════════════════════════════════════════════════════════════

  math/rand（v1，legacy）         math/rand/v2（Go 1.22+，推荐）
  ─────────────────────────────────────────────────────────────
  全局 Source 需手动 Seed           全局自动随机种子（安全）
  rand.Seed(42) 全局锁竞争          N/A（已废弃 Seed）
  rand.Intn(n)（全局锁）            rand.N[T](n) 泛型
  rand.Read（不安全，已废弃）        N/A（用 crypto/rand）
  LCG / Rng（线性同余 / 长周期）     ChaCha8 / PCG 算法
  rand.New(src) 创建独立实例        rand.New(rand.NewChaCha8(seed))

  主要改变：
  ├── 引入泛型 N[T]（T 为任意整数/浮点类型）
  ├── 默认全局随机种子（crypto/rand 获取）
  ├── ChaCha8 替代 LCG（更高安全性）
  └── 废弃 Shuffle 的旧签名 → 用 rand.Shuffle

══════════════════════════════════════════════════════════════════
```

---

## 一、ChaCha8 算法

```go
// src/math/rand/v2/chacha8.go
type ChaCha8 struct {
    state  [32]byte   // ChaCha 内部状态（256位）
    seed   [32]byte   // 原始种子
    buf    [64]byte   // 输出缓冲（ChaCha 每轮产生 64 字节）
    pos    int        // buf 中的当前位置
    readLen int
}
```

```
ChaCha8 = ChaCha20 的 8 轮变体
══════════════════════════════════════════════════════════════════

  ChaCha20（全强度）：20 轮混淆，密码学安全
  ChaCha8（math/rand/v2）：8 轮混淆，更快，足够用于随机数生成

  ChaCha 轮函数（quarter round）：
  a += b; d ^= a; d <<<= 16
  c += d; b ^= c; b <<<= 12
  a += b; d ^= a; d <<<= 8
  c += d; b ^= c; b <<<= 7

  特性：
  ├── 每次产生 64 字节的随机块（高效批处理）
  ├── 可从任意位置继续生成（流密码特性）
  ├── 对同一种子可重现（确定性）
  └── 256位种子空间，周期极长

══════════════════════════════════════════════════════════════════
```

---

## 二、PCG 算法

```go
// src/math/rand/v2/pcg.go
type PCG struct {
    hi, lo uint64   // 128位内部状态
}

func (p *PCG) Uint64() uint64 {
    // LCG 推进状态
    hi, lo := bits.Mul64(p.lo, pcgMul)
    hi += p.hi*pcgMul + p.lo*pcgAdd
    // 输出函数（XSH-RR：异或移位右旋）
    ...
}
```

```
PCG（Permuted Congruential Generator）
══════════════════════════════════════════════════════════════════

  = LCG + 精心设计的输出混淆函数

  LCG（线性同余）：state = state * mult + inc（mod 2^128）
  → 高位统计性质好，低位有规律

  PCG 输出函数（XSH-RR）：
  → 混合高低位 + 旋转 → 均匀输出

  vs LCG（老 math/rand）：
  ├── 周期相同（2^128）
  ├── 统计质量更好（通过 TestU01 BigCrush）
  └── 速度相近

  vs ChaCha8：
  ├── PCG 更快（状态更小）
  ├── ChaCha8 更安全（密码学强度）
  └── v2 全局用 ChaCha8，rand.NewPCG 可手动选择

══════════════════════════════════════════════════════════════════
```

---

## 三、全局 Rand 的并发安全

```go
// src/math/rand/v2/rand.go
// 全局 globalRand 的并发安全实现（简化）
var globalRand = &Rand{
    src: newLockedSource(), // 带锁的全局 source
}

// lockedSource：互斥锁保护（多 goroutine 竞争时有锁开销）
type lockedSource struct {
    mu  sync.Mutex
    src Source
}

// ✅ 高并发推荐：每个 goroutine 或 goroutine 池使用独立 Rand
// 避免全局锁竞争
func newPerGoroutineRand() *rand.Rand {
    seed := rand.New(rand.NewChaCha8([32]byte{}))
    seed.Uint64() // 占位：实际应从 crypto/rand 获取种子
    return seed
}
```

```
并发场景的 Rand 选择策略
══════════════════════════════════════════════════════════════════

  并发 goroutine 数       推荐方案
  ─────────────────────────────────────────────────────────────
  < 8（低并发）            全局 rand.N[T]（锁开销可忽略）
  8~100（中并发）          sync.Pool 复用 *rand.Rand 实例
  > 100（高并发）          每个 goroutine 独立 *rand.Rand
  需要密码学安全            crypto/rand（系统熵源，慢但安全）

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 基础使用（v2）

```go
import "math/rand/v2"

// 整数随机（泛型）
n := rand.N(100)          // [0, 100) int
n64 := rand.N(int64(1000)) // [0, 1000) int64

// 浮点
f := rand.Float64()        // [0.0, 1.0)
f32 := rand.Float32()

// 打乱切片
s := []int{1, 2, 3, 4, 5}
rand.Shuffle(len(s), func(i, j int) {
    s[i], s[j] = s[j], s[i]
})

// 从切片随机取一个（Go 1.22+）
items := []string{"apple", "banana", "cherry"}
pick := items[rand.N(len(items))]
```

### Shuffle：无偏洗牌（Fisher-Yates）

```go
// 洗牌（v2 比 v1 的 Shuffle 更简洁）
func shuffle(s []string) []string {
    result := make([]string, len(s))
    copy(result, s)
    rand.Shuffle(len(result), func(i, j int) {
        result[i], result[j] = result[j], result[i]
    })
    return result
}

// 随机抽取 k 个（reservoir sampling 简化版）
func sample[T any](items []T, k int) []T {
    if k >= len(items) {
        return items
    }
    // 复制并洗牌，取前 k 个
    cp := make([]T, len(items))
    copy(cp, items)
    rand.Shuffle(len(cp), func(i, j int) {
        cp[i], cp[j] = cp[j], cp[i]
    })
    return cp[:k]
}
```

### 可重现的随机序列（固定种子）

```go
// 测试或模拟场景：固定种子保证可重现
var seed [32]byte
copy(seed[:], "my-deterministic-seed-32-bytes!!")
rng := rand.New(rand.NewChaCha8(seed))

for i := range 5 {
    fmt.Println(rng.N(100)) // 每次运行结果相同
}
```

### 高并发场景：sync.Pool 复用

```go
var randPool = sync.Pool{
    New: func() any {
        var seed [32]byte
        // 用 crypto/rand 生成真正随机的种子
        if _, err := cryptorand.Read(seed[:]); err != nil {
            panic(err)
        }
        return rand.New(rand.NewChaCha8(seed))
    },
}

func randomInt(max int) int {
    r := randPool.Get().(*rand.Rand)
    defer randPool.Put(r)
    return r.N(max)
}
```

### 加权随机选择

```go
// 按权重随机选择（轮盘赌算法）
func weightedChoice(items []string, weights []float64) string {
    total := 0.0
    for _, w := range weights {
        total += w
    }
    r := rand.Float64() * total
    cumulative := 0.0
    for i, w := range weights {
        cumulative += w
        if r < cumulative {
            return items[i]
        }
    }
    return items[len(items)-1]
}

// items=["A","B","C"], weights=[1,2,7] → A:10%, B:20%, C:70%
```

### 指数退避抖动（防雷群效应）

```go
// 带抖动的指数退避（Cloud Spanner/Envoy 标准模式）
func exponentialBackoffWithJitter(attempt int, base, max time.Duration) time.Duration {
    // 指数部分：base * 2^attempt
    exp := base * (1 << attempt)
    if exp > max {
        exp = max
    }

    // 全抖动：[0, exp)（full jitter 策略）
    return rand.N(exp)

    // 等抖动：[exp/2, exp)（equal jitter，均值更稳定）
    // half := exp / 2
    // return half + rand.N(exp-half)
}

// 重试循环
func retryWithBackoff(fn func() error, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        if err := fn(); err == nil {
            return nil
        }
        wait := exponentialBackoffWithJitter(i, 100*time.Millisecond, 30*time.Second)
        time.Sleep(wait)
    }
    return errors.New("max retries exceeded")
}
```

### 测试辅助：随机测试数据生成

```go
// 随机字符串（测试数据生成）
const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randString(n int) string {
    b := make([]byte, n)
    for i := range b {
        b[i] = charset[rand.N(len(charset))]
    }
    return string(b)
}

// 随机 Email
func randEmail() string {
    return randString(8) + "@" + randString(5) + ".com"
}

// 表格驱动测试 + 随机输入（fuzz 前置）
func TestSomeFunc(t *testing.T) {
    // 固定种子保证测试可复现
    r := rand.New(rand.NewPCG(uint64(time.Now().UnixNano()), 0))

    for i := 0; i < 1000; i++ {
        input := r.N(10000)
        result := someFunc(input)
        if !isValid(result) {
            t.Errorf("someFunc(%d) = %v, invalid", input, result)
        }
    }
}
```

### v1 → v2 迁移指南

```go
// v1（旧写法）：
import "math/rand"
rand.Seed(time.Now().UnixNano()) // ⚠️ 多 goroutine 全局 Seed 有竞争
n := rand.Intn(100)

// v2（新写法）：
import "math/rand/v2"
n := rand.N(100) // 无需 Seed，自动从 OS 熵源初始化

// v1 本地实例（测试中可复现）：
r1 := rand.New(rand.NewSource(42))
n1 := r1.Intn(100)

// v2 本地实例（测试中可复现）：
r2 := rand.New(rand.NewPCG(42, 0))
n2 := r2.N(100)

// 注意：v2 移除了 Read([]byte)，需用 crypto/rand
// ⚠️ 安全随机字节应始终用 crypto/rand.Read，不是 math/rand
import "crypto/rand"
token := make([]byte, 32)
crypto_rand.Read(token)
```

### 正态分布

```go
// math/rand/v2 内置正态分布
rng := rand.New(rand.NewPCG(42, 0))
for i := range 5 {
    v := rng.NormFloat64() // 标准正态分布（均值0，标准差1）
    scaled := v*10 + 50   // 均值50，标准差10
    fmt.Printf("%.2f\n", scaled)
}
```

### crypto/rand vs math/rand

```go
import (
    cryptorand "crypto/rand"
    "math/big"
    "math/rand/v2"
)

// 密码学安全随机数（用于生成密钥、token、salt）
func secureToken(length int) (string, error) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    b := make([]byte, length)
    for i := range b {
        n, err := cryptorand.Int(cryptorand.Reader, big.NewInt(int64(len(chars))))
        if err != nil {
            return "", err
        }
        b[i] = chars[n.Int64()]
    }
    return string(b), nil
}

// 非密码学（模拟、测试、游戏）→ math/rand/v2 更快
func simulationRandom(n int) int {
    return rand.N(n) // 快约 100x vs crypto/rand
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| math/rand/v2 和 v1 的核心区别？ | v2 默认安全种子（无需手动 Seed）；ChaCha8/PCG 替代 LCG；泛型 N[T] |
| ChaCha8 和 PCG 怎么选？ | rand.New 默认 ChaCha8（更安全，可序列化状态）；NewPCG 更快，适合纯性能场景 |
| 什么时候用 crypto/rand？ | 生成密钥、token、session ID、salt 等安全敏感随机数；比 math/rand 慢约 100x |
| 全局 rand.N 并发安全吗？ | 安全（内部带锁）；高并发时有锁竞争，可用 sync.Pool 缓存 *rand.Rand |
| v1 的 rand.Seed 有什么问题？ | 全局状态修改影响所有使用全局 rand 的代码；v2 废弃了 Seed |
| Go 1.20 前全局 rand 的默认种子是什么？ | 1（固定！），即 rand.Intn 每次运行结果相同；1.20 起默认随机种子 |
| v2 为什么去掉了 `Read([]byte)`？ | math/rand 的 Read 让用户误以为可用于密码学场景；v2 强迫用户区分：非安全场景用 Shuffle/N，安全场景用 crypto/rand.Read |
| `rand.N(n)` 比 `rand.Intn(n)` 好在哪里？ | N 是泛型，支持所有整数/浮点类型；内部用无偏拒绝采样避免取模偏差（旧 Intn 用 `Uint64()%n` 在 n 不是 2 的幂时有轻微偏差）|
| v2 全局函数为什么不需要 Seed？ | 全局 `globalRand` 是 ChaCha8 实例，在 `init()` 时从 `runtime_rand()` 读取 OS 熵源种子，每次运行都不同且线程安全 |
| 如何在测试中得到可复现的随机序列？ | 使用 `rand.New(rand.NewPCG(seed1, seed2))` 创建本地实例，固定 seed 则序列固定；生产代码用包级 rand，测试代码传入 `*rand.Rand` 参数 |
| 指数退避为什么要加随机抖动？ | 雷群效应（Thundering Herd）：多个客户端同时重试会在同一时刻打垮服务；全抖动 `[0, cap)` 使重试均匀分散，降低峰值流量 |
