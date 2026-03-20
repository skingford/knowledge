---
title: time/Timer 源码精读
description: 精读 time.Timer/Ticker 与 runtime 定时器堆实现，理解定时器的调度机制与陷阱。
---

# time.Timer/Ticker：定时器源码精读

> 核心源码：`src/time/sleep.go`、`src/runtime/time.go`
>
> 图例参考：补了 runtime 定时器堆图，把 `time.Timer`、`Ticker`、`AfterFunc` 和 per-P timer heap 放到同一条链上看，再回头理解 Stop/Reset 与 netpoll 的关系。

## 定时器架构图

<GoRuntimeDiagram kind="timer-heap" />

```
定时器体系全景
══════════════════════════════════════════════════════════════════

  用户层（time 包）
  ├── time.Timer   → 一次性定时器（make(chan Time, 1)）
  ├── time.Ticker  → 周期性定时器（make(chan Time, 1)）
  ├── time.After   → 语法糖（返回 <-chan Time）
  ├── time.AfterFunc → 异步执行函数（不走 channel）
  └── time.Sleep   → 阻塞当前 goroutine

  runtime 层（每个 P 一套定时器）
  ├── runtime.timer struct  → 基本定时单元
  ├── timers（per-P）       → 最小堆（按 when 排序）
  └── timerproc / netpoll   → 到期触发执行

══════════════════════════════════════════════════════════════════
```

---

## 一、runtime.timer 结构

```go
// src/runtime/time.go
type timer struct {
    mu      mutex        // 保护所有字段
    astate  atomic.Uint8 // 状态的原子副本
    state   uint8        // 状态位
    isChan  bool         // 是否绑定 channel（Timer/Ticker 为 true）

    when    int64        // 首次触发时间（纳秒，单调时钟）
    period  int64        // 周期（>0 表示 Ticker，==0 表示 Timer）
    f       func(arg any, seq uintptr, delay int64) // 触发函数
    arg     any          // f 的参数（channel 或 AfterFunc 的 func）

    ts      *timers      // 所属 P 的定时器堆
    sendLock mutex       // 保护 channel 发送
    isSending atomic.Int32 // 发送中标记（处理 Stop/Reset 竞争）
}
```

---

## 二、定时器堆（per-P 最小堆）

```
每个 P 维护一个最小堆
══════════════════════════════════════════════════════════════════

  timers（per-P）
  ┌───────────────────────────────────────────────────────────┐
  │  heap  []*timer     ← 按 when 排序的最小堆               │
  │  len   int                                                │
  │  zombies atomic.Int32 ← 待清理的停止定时器数量           │
  └───────────────────────────────────────────────────────────┘

  堆操作：
  ├── addtimer(t)   → 插入堆，O(log n)
  ├── deltimer(t)   → 标记删除（lazy，不立即移除）
  └── runtimer(now) → 弹出 when≤now 的 timer，执行 f()

  触发时机：
  ├── schedule() 每轮检查 P.timers 堆顶
  ├── netpoll 等待时以最近 timer 作为超时
  └── sysmon 定期检查（托底，防止长时间无调度）

══════════════════════════════════════════════════════════════════
```

---

## 三、Timer vs Ticker

```
┌────────────────────────────────────────────────────────────────┐
│  time.Timer（一次性）                                          │
│                                                                │
│  type Timer struct {                                           │
│      C        <-chan Time  // 触发时接收当前时间               │
│      initTimer bool                                            │
│  }                                                             │
│                                                                │
│  timer.period = 0  → 触发一次后不再入堆                       │
│  Stop() 返回 true  → 成功阻止触发                              │
│  Stop() 返回 false → 已触发或已停止，C 中可能有值              │
│                                                                │
│  Go 1.23+ 改进：                                               │
│  ├── C 改为无缓冲（同步）                                      │
│  ├── Stop 后保证 C 不会收到旧值                                │
│  └── 未引用的 Timer 可被 GC 回收（无需 defer Stop）           │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  time.Ticker（周期性）                                         │
│                                                                │
│  type Ticker struct {                                          │
│      C <-chan Time                                             │
│  }                                                             │
│                                                                │
│  timer.period = d  → 每次触发后重新入堆（when += period）     │
│  必须调用 Stop() → 否则 goroutine 和 timer 对象不会被释放     │
│                                                                │
│  ⚠️ 注意：消费速度慢于 period 时，C 中值会被丢弃              │
│     （channel 缓冲为 1，新值到达时旧值若未消费则丢弃）        │
└────────────────────────────────────────────────────────────────┘
```

---

## 四、常见陷阱

```
陷阱一：time.After 内存泄漏（Go 1.23 之前）
══════════════════════════════════════════════════════

  for {
      select {
      case <-time.After(1 * time.Second): // ❌ 每次循环创建新 Timer
          doWork()                          // 旧 Timer 等超时才 GC
      case <-quit:
          return
      }
  }

  ✅ 修复：复用 Timer
  t := time.NewTimer(1 * time.Second)
  defer t.Stop()
  for {
      select {
      case <-t.C:
          doWork()
          t.Reset(1 * time.Second) // 复用
      case <-quit:
          return
      }
  }

  Go 1.23+ time.After 创建的 Timer 无引用时可被 GC，不再泄漏

══════════════════════════════════════════════════════
```

```
陷阱二：Reset 的竞争（Go 1.23 之前）
══════════════════════════════════════════════════════

  // 旧版（≤1.22）正确但繁琐的 Reset 写法：
  if !t.Stop() {
      select {
      case <-t.C: // 排空可能的旧值
      default:
      }
  }
  t.Reset(d)

  // Go 1.23+ C 是同步的，Stop 后 C 不再有旧值，直接 Reset 即可：
  t.Stop()
  t.Reset(d)

══════════════════════════════════════════════════════
```

---

## 五、代码示例

### 带超时的操作

```go
func withTimeout(d time.Duration, fn func() error) error {
    done := make(chan error, 1)
    go func() { done <- fn() }()

    t := time.NewTimer(d)
    defer t.Stop()

    select {
    case err := <-done:
        return err
    case <-t.C:
        return fmt.Errorf("timeout after %v", d)
    }
}
```

### 心跳 Ticker

```go
func heartbeat(ctx context.Context, interval time.Duration, fn func()) {
    ticker := time.NewTicker(interval)
    defer ticker.Stop() // 必须 Stop，否则 ticker 永不被 GC

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            fn()
        }
    }
}
```

### time.AfterFunc（无 channel 模式）

```go
// AfterFunc 在 d 后在新 goroutine 中执行 f
// 不占用 channel，适合纯回调场景
t := time.AfterFunc(5*time.Second, func() {
    fmt.Println("5 seconds later")
})

// 取消
t.Stop()
```

### 限速器（基于 time.Tick）

```go
func rateLimited(rps int, tasks []func()) {
    limiter := time.Tick(time.Second / time.Duration(rps))
    for _, task := range tasks {
        <-limiter // 等令牌
        go task()
    }
}
// 注意：time.Tick 不可 Stop，生产建议用 time.NewTicker
```

---

## 六、定时器性能

```
定时器性能要点
══════════════════════════════════════════════════════

  堆操作：O(log n)
  └── 大量定时器（百万级）时堆操作成为瓶颈

  高性能替代方案（时间轮 Time Wheel）：
  ├── O(1) 插入/删除（固定精度）
  └── 适合大量短生命周期定时器（如连接超时管理）

  实践建议：
  ├── 系统定时器（连接超时）：context.WithTimeout 优先
  ├── 业务调度（定期任务）：time.NewTicker + Stop
  ├── 大量细粒度超时：考虑第三方时间轮库
  └── 避免在热路径中频繁创建 time.After

══════════════════════════════════════════════════════
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Timer 和 Ticker 的区别？ | Timer 触发一次（period=0），Ticker 周期触发（period>0） |
| time.After 会泄漏吗？ | Go 1.23 之前会（Timer 等到期才 GC）；1.23+ 不再泄漏 |
| Ticker 不 Stop 有什么后果？ | Timer 对象和底层 goroutine 永不释放，泄漏 |
| runtime 定时器存在哪里？ | 每个 P 一个最小堆（timers），按触发时间排序 |
| Stop 返回 false 后 C 还有值吗？ | 1.22 及以前：可能有；1.23+：不会有 |
| time.Sleep 和 channel 超时的区别？ | Sleep 阻塞 goroutine；channel select 可同时等多个事件 |
