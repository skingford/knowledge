---
title: math/rand/v2（Go 1.22+）源码精读
description: 精读 Go 1.22 math/rand/v2 的 PCG/ChaCha8 随机源实现，掌握泛型 rand.N、并发安全全局生成器与生产级随机数最佳实践。
---

# math/rand/v2（Go 1.22+）：现代随机数生成源码精读

> 核心源码：`src/math/rand/v2/rand.go`、`src/math/rand/v2/pcg.go`、`src/math/rand/v2/chacha8.go`

## 包结构图

```
math/rand/v2 体系（Go 1.22+）
══════════════════════════════════════════════════════════════════

  Source 接口（内部）：
  └── Uint64() uint64      ← 单一方法，生成 64 位随机整数

  内置 Source 实现：
  ┌─────────────┬──────────────────────────────────────────────┐
  │ PCG         │ Permuted Congruential Generator              │
  │             │ 周期 2^128，速度极快，适合模拟/游戏/测试    │
  ├─────────────┼──────────────────────────────────────────────┤
  │ ChaCha8     │ ChaCha20 流密码（8 轮精简版）               │
  │             │ 密码学级伪随机，适合 shuffle/抽样/安全场景  │
  └─────────────┴──────────────────────────────────────────────┘

  与 v1 的对比：
  ┌──────────────────────┬──────────────┬──────────────────────┐
  │ 特性                 │ math/rand    │ math/rand/v2         │
  ├──────────────────────┼──────────────┼──────────────────────┤
  │ 默认全局 Source      │ 固定 Go1 源  │ ChaCha8（自动种子）  │
  │ 全局函数线程安全     │ ✗ v1.20 前   │ ✓ 始终              │
  │ 需要手动 Seed        │ ✓ 推荐       │ ✗ 无需（自动）      │
  │ 泛型 N[T]()          │ ✗            │ ✓                   │
  │ Read([]byte)         │ ✓（已废弃）  │ ✗（用 crypto/rand） │
  │ Perm / Shuffle       │ ✓            │ ✓                   │
  └──────────────────────┴──────────────┴──────────────────────┘

  泛型函数（Go 1.22+）：
  ├── rand.N[int](100)         → [0, 100) 的 int
  ├── rand.N[float64](1.0)    → [0, 1.0) 的 float64
  ├── rand.N[time.Duration](d) → [0, d) 的随机 Duration
  └── rand.N[T](max T) T      → 任意整数/浮点类型

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/math/rand/v2/rand.go（简化）

// Rand 包装一个 Source，提供丰富的随机数 API
type Rand struct {
    src Source
}

// N 是 v2 的核心泛型函数：生成 [0, n) 的随机数
// 无偏拒绝采样（rejection sampling），避免取模偏差
func N[Int intType](n Int) Int {
    // 内部用无偏算法确保均匀分布
    return globalRand.N(n)
}

// PCG Source：128 位内部状态
type PCG struct {
    hi uint64
    lo uint64
}

func (p *PCG) Uint64() uint64 {
    // Permuted Congruential Generator 核心公式
    // hi, lo = PCG 推进状态
    // 输出经过随机置换（permutation）使低位也充分混合
    ...
}

// ChaCha8 Source：基于 ChaCha20 流密码（8 轮）
// 全局单例自动从 OS 熵源（crypto/rand）初始化种子
type ChaCha8 struct {
    state [32]byte // 256 位密钥
    buf   [64]byte // 输出缓冲（每次 ChaCha8 生成 64 字节）
    ...
}
```

---

## 二、代码示例

### 基础：泛型 rand.N

```go
import "math/rand/v2"

func basics() {
    // [0, 100) 的随机 int（无需 Seed，v2 自动初始化）
    n := rand.N(100)
    fmt.Println(n)

    // [0, 1.0) 的随机 float64
    f := rand.Float64()
    fmt.Printf("%.4f\n", f)

    // 随机 bool（50% 概率）
    b := rand.N(2) == 1

    // 随机 [min, max] 的整数（闭区间）
    min, max := 10, 20
    r := min + rand.N(max-min+1)
    fmt.Println(r)

    // 随机 Duration：[500ms, 1500ms)（用于抖动）
    jitter := 500*time.Millisecond + rand.N(time.Second)
    fmt.Println(jitter)
}
```

### 可复现随机序列：指定种子

```go
// 场景：测试中需要确定性随机序列
func deterministicRand() {
    // 指定种子的 PCG 生成器（可复现）
    r := rand.New(rand.NewPCG(42, 0))

    for i := 0; i < 5; i++ {
        fmt.Println(r.N(100))
    }
    // 每次运行输出相同：固定种子 → 固定序列
}

// 指定种子的 ChaCha8（密码学强度 + 可复现）
func deterministicChacha() {
    var seed [32]byte
    binary.LittleEndian.PutUint64(seed[:], 12345)
    r := rand.New(rand.NewChaCha8(seed))
    fmt.Println(r.N(1000))
}
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

### 加权随机选择

```go
// 场景：A/B 测试按权重分流
type WeightedItem struct {
    Name   string
    Weight int
}

func weightedChoice(items []WeightedItem) string {
    total := 0
    for _, item := range items {
        total += item.Weight
    }

    r := rand.N(total)
    for _, item := range items {
        if r < item.Weight {
            return item.Name
        }
        r -= item.Weight
    }
    return items[len(items)-1].Name
}

// 使用：70% A，20% B，10% C
func main() {
    items := []WeightedItem{
        {"A", 70},
        {"B", 20},
        {"C", 10},
    }
    fmt.Println(weightedChoice(items))
}
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

---

## 面试要点

| 问题 | 要点 |
|------|------|
| PCG 和 ChaCha8 各适合什么场景？ | PCG 速度极快（~2ns/op），适合模拟、游戏、Monte Carlo；ChaCha8 有密码学保证（不可预测），适合 shuffle 种子、token 前缀、A/B 实验 ID |
| v2 为什么去掉了 `Read([]byte)`？ | math/rand 的 Read 让用户误以为可用于密码学场景；v2 强迫用户区分：非安全场景用 Shuffle/N，安全场景用 crypto/rand.Read |
| `rand.N(n)` 比 `rand.Intn(n)` 好在哪里？ | N 是泛型，支持所有整数/浮点类型；内部用无偏拒绝采样避免取模偏差（旧 Intn 用 `Uint64()%n` 在 n 不是 2 的幂时有轻微偏差）|
| v2 全局函数为什么不需要 Seed？ | 全局 `globalRand` 是 ChaCha8 实例，在 `init()` 时从 `runtime_rand()` 读取 OS 熵源种子，每次运行都不同且线程安全 |
| 如何在测试中得到可复现的随机序列？ | 使用 `rand.New(rand.NewPCG(seed1, seed2))` 创建本地实例，固定 seed 则序列固定；生产代码用包级 rand，测试代码传入 `*rand.Rand` 参数 |
| 指数退避为什么要加随机抖动？ | 雷群效应（Thundering Herd）：多个客户端同时重试会在同一时刻打垮服务；全抖动 `[0, cap)` 使重试均匀分散，降低峰值流量 |
