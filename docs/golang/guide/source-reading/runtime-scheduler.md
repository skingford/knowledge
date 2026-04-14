---
title: GMP 调度器源码精读
description: 精读 Go runtime GMP 调度模型，理解 goroutine 调度、抢占与 work-stealing 机制。
vocabulary:
  - scheduler
  - preemption
  - work-stealing
  - goroutine
  - machine
  - processor
  - syscall
  - handoff
  - starvation
  - cooperative
  - asynchronous
---

# GMP 调度器：runtime 源码精读

> 核心源码：`src/runtime/proc.go`、`src/runtime/runtime2.go`
>
> 图例参考：复用 [Goroutine 与 GMP 调度模型](../03-goroutine-and-scheduler.md) 中的 SVG 图例，把角色关系、调度路径和 work stealing 先看成图，再对照本文的 runtime 细节。

## GMP 全景图

<GoSchedulerDiagram kind="roles" />

```
GMP 调度模型
══════════════════════════════════════════════════════════════════

  G (Goroutine)       M (Machine/OS线程)      P (Processor/逻辑处理器)
  ┌──────────┐         ┌──────────────┐         ┌──────────────────┐
  │  stack   │         │  g0 (调度栈) │         │  runq [256]G    │ ← 本地队列
  │  gobuf   │──绑定──▶│  curg        │◀─关联──▶│  runnext G      │
  │  status  │         │  p *P        │         │  mcache         │
  │  goid    │         └──────────────┘         └──────────────────┘
  └──────────┘
                                                  全局队列
                                               sched.runq (无锁链表)

  关键约束：
  ├── M 必须绑定一个 P 才能执行 G
  ├── P 的数量由 GOMAXPROCS 决定（默认=CPU核数）
  └── M 的数量不固定，随阻塞动态增减

══════════════════════════════════════════════════════════════════
```

---

## 一、核心数据结构

### G（Goroutine）关键字段

::: details 点击展开代码：G（Goroutine）关键字段
```go
// src/runtime/runtime2.go:471
type g struct {
    stack       stack       // goroutine 栈 [lo, hi)
    stackguard0 uintptr     // 栈溢出检测指针
    _panic      *_panic     // 最内层 panic
    _defer      *_defer     // 最内层 defer
    m           *m          // 当前绑定的 M
    sched       gobuf       // 调度上下文（SP/PC/BP）
    atomicstatus atomic.Uint32 // 状态（运行/等待/死亡...）
    goid        uint64      // goroutine ID
    preempt     bool        // 抢占标记
    waitreason  waitReason  // 等待原因（chan recv/mutex/...）
}
```
:::

### P（Processor）关键字段

::: details 点击展开代码：P（Processor）关键字段
```go
// src/runtime/runtime2.go:774
type p struct {
    id       int32
    status   uint32      // pidle/prunning/psyscall/pgcstop
    m        muintptr    // 关联的 M（空闲时为 nil）
    mcache   *mcache     // 内存分配缓存

    // 本地运行队列（无锁环形缓冲区）
    runqhead uint32
    runqtail uint32
    runq     [256]guintptr  // 最多 256 个 G
    runnext  guintptr       // 下一个优先运行的 G
}
```
:::

---

## 二、调度循环

<GoSchedulerDiagram kind="schedule-flow" />

<GoSchedulerDiagram kind="run-queue" />

```
schedule() 主循环
══════════════════════════════════════════════════════

  M 进入 schedule()
       │
       ▼
  findRunnable()  ← 寻找可运行的 G
       │
       ├─ 1. 检查 P.runnext（最高优先级）
       │
       ├─ 2. 从 P.runq 取（本地队列，无锁）
       │
       ├─ 3. 从 sched.runq 取（全局队列，加锁）
       │       每 61 次调度检查一次，防止全局队列饥饿
       │
       ├─ 4. netpoll（网络就绪的 G）
       │
       └─ 5. work stealing（从其他 P 偷取一半 G）
                   │
                   ▼
           随机选 P → 偷 runq 后半部分 → 加入自己 runq
       │
       ▼
  execute(g)  ← 切换到 G 的栈，恢复寄存器
       │
       ▼
  G 运行完 / 主动让步 / 被抢占
       │
       ▼
  goexit0() / gopark() → 回到 schedule()

══════════════════════════════════════════════════════
```

---

## 三、findRunnable 查找顺序与 Work Stealing

<GoSchedulerDiagram kind="findrunnable" />

从源码角度看，`schedule()` 真正的核心不是“执行”，而是 `findRunnable()` 如何尽量低成本地把下一个 G 找出来。它大致遵循这样的优先级：

1. **`runnext`**：优先执行被标记为“下一次就跑”的 G，减少唤醒后的额外排队。
2. **本地队列 `runq`**：无锁环形数组，命中成本最低。
3. **全局队列 `sched.runq`**：不是每轮都查，而是按节奏检查，避免加锁过于频繁，同时防止全局任务饥饿。
4. **`netpoll`**：把网络 I/O 已就绪的 G 捞回来。
5. **Work Stealing**：当本地、全局、netpoll 都没有命中时，再去其他 P 的本地队列里偷任务。

这个顺序体现了 runtime 的设计取舍：先走局部性最好、代价最低的路径，再逐步扩大搜索范围，最后才进入跨 P 的负载均衡。

### Work Stealing 为什么有效

<GoSchedulerDiagram kind="work-stealing" />

`runqsteal` 的核心思想并不复杂：如果某个 P 很忙、另一个 P 很闲，就把忙者本地队列的一部分任务转移给闲者。

- **随机选择受害者 P**：避免多个空闲 P 都顺序扫描并盯上同一个目标。
- **通常窃取一半任务**：既快速拉平负载，又不至于把受害者瞬间偷空。
- **优先偷可运行任务而非迁移全部状态**：调度器只处理“谁先跑”，不会在窃取阶段做复杂的业务级重排。

本地队列是长度固定的环形数组（当前实现为 256 槽位），偷任务时 runtime 会结合 `runqhead` / `runqtail` 做原子读写，尽量降低锁竞争。这里要注意两点：

- 这些实现细节属于 runtime 内部策略，版本间可能调整，文档里更应该记住的是“随机 + 批量均衡”这条主线。
- Work Stealing 不是每次都成功；如果采样到的目标 P 本来也快空了，当前 M 还会继续尝试其他路径。

### 为什么常说“每 61 次检查一次全局队列”

源码里确实长期存在“按固定调度节奏检查全局队列”的实现，常见描述会提到 `61`。理解重点不是死记这个数字，而是明白它背后的目的：

- **不能每轮都查全局队列**：全局队列要加锁，频繁访问会破坏本地队列的无锁优势。
- **也不能永远不查**：否则全局任务可能长期抢不到 CPU，形成饥饿。
- **用一个不太规则的节奏值**：是为了在公平性和局部性之间折中，减少固定周期带来的偏斜。

所以工程上更值得记住的是：Go 调度器优先本地性，但不会放任全局任务一直挨饿。

### 自旋线程（Spinning Threads）

<GoSchedulerDiagram kind="spinning" />

当一个 M 没找到任务时，并不会总是立刻睡眠。原因很现实：线程休眠/唤醒涉及内核切换，代价并不小。如果系统此刻正有新任务即将出现，立刻休眠反而会增加调度延迟。

因此 runtime 会让一部分 M 进入 **spinning** 状态：

- **继续短暂寻找任务**：包括看全局队列、netpoll、work stealing。
- **更快响应新工作**：适合高并发网络服务这种“任务不断到来”的场景。
- **数量受控**：不会让所有 M 都无限自旋，避免空转浪费 CPU。

这套机制解释了 Go 服务常见的一个现象：吞吐高的时候调度器响应很快，但系统并不会因为少量空闲就立刻把所有线程睡死。

---

## 四、抢占机制

<GoSchedulerDiagram kind="preemption" />

```
Go 抢占演进
══════════════════════════════════════════════════════

  Go 1.13 及以前：协作式抢占
  ─────────────────────────────
  ├── 仅在函数调用时检查 stackguard0 标记
  └── 纯计算循环（无函数调用）不可抢占，可导致 STW 卡顿

  Go 1.14+：异步抢占（信号驱动）
  ─────────────────────────────
  ├── sysmon 线程每 10ms 检测运行超时的 G
  ├── 向对应 M 发送 SIGURG 信号
  ├── M 在信号处理函数中注入 asyncPreempt 调用
  └── G 在安全点暂停，切换到调度器

  抢占触发条件：
  ├── G 连续运行超过 10ms（sysmon 检测）
  ├── GC STW 时强制抢占所有 G
  └── channel/mutex/syscall 主动让步

══════════════════════════════════════════════════════
```

---

## 五、系统调用时的 P 交接

<GoSchedulerDiagram kind="handoff" />

```
M 进入系统调用
══════════════════════════════════════════════════════

  G 发起阻塞系统调用（如 read）
       │
       ▼
  entersyscall()
  ├── 保存 G 的调度现场
  └── M 与 P 解绑（P.status = Psyscall）
       │
       ▼
  系统调用期间：P 空闲
       │
  sysmon 检测到 P 空闲超过 20μs
       │
       ▼
  handoff：P 转移给其他 M（或创建新 M）
       │
       ▼
  系统调用返回：exitsyscall()
  ├── 尝试重新获取原 P → 成功则继续
  └── 获取失败 → G 放入全局队列，M 进入休眠

══════════════════════════════════════════════════════
```

---

## 六、调优启示

- **先看调度现象，再改业务实现**：Goroutine 堆积、线程数上升、run queue 过长、syscall 阻塞，常常是尾延迟恶化的根因。
- **I/O 场景优先走 runtime 友好路径**：标准库网络栈能很好利用 netpoll；频繁长阻塞 syscall 会增加 P handoff 和调度抖动。
- **CPU 密集任务控制 runnable G 的数量**：G 太多不代表更快，反而可能增加抢占、窃取和缓存失效。
- **容器内关注 `GOMAXPROCS`**：如果 CPU 配额很小却把 P 开太多，会放大自旋和调度竞争。
- **不要把 runtime 常量当 API 保证**：例如本地队列长度、检查节奏等，理解设计目标比死记实现常量更重要。

---

## 七、如何观察调度问题

理解调度器之后，下一步不是“猜”，而是“看”。Go 在线上排查调度问题时，最有价值的通常是 `pprof`、`runtime/trace` 和少量 runtime 指标。

### 用 pprof 看 Goroutine 堆积点

- **适合回答什么问题**：是不是有大量 G 堵在同一类操作上，比如 `chan send`、`select`、`sync.Mutex`、网络读写或系统调用。
- **常见信号**：`runtime.NumGoroutine()` 持续增长；goroutine profile 里大量栈帧集中在少数等待点。
- **典型结论**：如果大量 G 都在等待下游 I/O 或锁，问题可能不在调度器本身，而在上游并发度和资源配额。

::: details 点击展开代码：用 pprof 看 Goroutine 堆积点
```bash
go tool pprof http://localhost:6060/debug/pprof/goroutine
go tool pprof http://localhost:6060/debug/pprof/block
go tool pprof http://localhost:6060/debug/pprof/mutex
```
:::

### 用 trace 看调度延迟和阻塞原因

- **适合回答什么问题**：G 为什么迟迟没被调度；是 CPU 不够、syscall 太多、网络阻塞，还是 GC/抢占影响了时延。
- **重点视图**：
  - `Goroutine analysis`：看阻塞原因分布
  - `Scheduler latency`：看从 runnable 到真正执行的等待时间
  - `Network blocking`：看 netpoll 路径上的等待
- **特别适合**：排查“CPU 不高但接口就是慢”“偶发尾延迟很高”这类问题。

::: details 点击展开代码：用 trace 看调度延迟和阻塞原因
```bash
go test -trace=trace.out ./...
go tool trace trace.out
```
:::

### 建议关注的运行时指标

- **Goroutine 数量**：持续上升通常意味着泄漏、背压不足或下游阻塞。
- **线程数量**：如果线程数异常上升，要怀疑 syscall/cgo/锁竞争导致的 M 扩张。
- **阻塞与锁竞争 profile**：可以帮助区分“调度慢”还是“业务自己堵住了”。
- **尾延迟**：调度问题往往最先体现在 P99 / P999，而不是平均延迟。

一个很实用的排障顺序是：

1. 先看 `runtime.NumGoroutine()`、线程数、延迟分位数是否异常。
2. 再用 goroutine / block / mutex profile 判断是在“等什么”。
3. 最后用 trace 确认是调度延迟、syscall、netpoll 还是 GC 抢占导致。

---

## 八、代码示例

::: details 点击展开代码：八、代码示例
```go
package main

import (
    "fmt"
    "runtime"
    "sync"
)

func main() {
    // 查看当前 P 数量
    fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0))

    // 手动让步（触发调度）
    var wg sync.WaitGroup
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(n int) {
            defer wg.Done()
            runtime.Gosched() // 主动让出 P
            fmt.Println("goroutine", n)
        }(i)
    }
    wg.Wait()
}
```
:::

::: details 点击展开代码：八、代码示例
```go
// 观察调度延迟（生产慎用）
import _ "net/http/pprof"

// 通过 pprof 查看 goroutine 阻塞原因
// go tool pprof http://localhost:6060/debug/pprof/goroutine
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| GOMAXPROCS 默认值？ | CPU 核数，控制并行 P 的数量 |
| G、M、P 数量关系？ | G 远多于 M/P；M≥P（系统调用时 M>P） |
| work stealing 步骤？ | 随机选 P → 偷其 runq 后半部分 |
| goroutine 栈初始大小？ | 2KB（可动态扩缩，最大 1GB） |
| 什么情况 M 数量增加？ | M 阻塞在系统调用，sysmon 触发 P handoff 创建新 M |
| 全局队列 vs 本地队列？ | 本地无锁，每 61 次调度检查一次全局队列防饥饿 |
