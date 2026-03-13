---
title: GMP 调度器源码精读
description: 精读 Go runtime GMP 调度模型，理解 goroutine 调度、抢占与 work-stealing 机制。
vocabulary:
  - word: scheduler
    meaning: 调度器
    phoneticUs: "/ˈskedʒ.uː.lɚ/"
    phoneticUk: "/ˈʃedʒ.uː.lər/"
  - word: preemption
    meaning: 抢占
    phoneticUs: "/priˈemp.ʃən/"
    phoneticUk: "/priˈemp.ʃən/"
  - word: work stealing
    meaning: 工作窃取（负载均衡策略）
    phoneticUs: "/wɝːrk ˈstiː.lɪŋ/"
    phoneticUk: "/wɜːk ˈstiː.lɪŋ/"
  - word: goroutine
    meaning: Go 协程；轻量级线程
    phoneticUs: "/ˌɡoʊ.ruˈtiːn/"
    phoneticUk: "/ˌɡəʊ.ruːˈtiːn/"
  - word: machine
    meaning: 机器；操作系统线程（GMP 中的 M）
    phoneticUs: "/məˈʃiːn/"
    phoneticUk: "/məˈʃiːn/"
  - word: processor
    meaning: 处理器（GMP 中的 P）
    phoneticUs: "/ˈprɑː.ses.ɚ/"
    phoneticUk: "/ˈprəʊ.ses.ər/"
  - word: syscall
    meaning: 系统调用
    phoneticUs: "/ˈsɪs.kɔːl/"
    phoneticUk: "/ˈsɪs.kɔːl/"
  - word: handoff
    meaning: 交接；移交
    phoneticUs: "/ˈhænd.ɔːf/"
    phoneticUk: "/ˈhænd.ɒf/"
  - word: starvation
    meaning: 饥饿（调度饥饿）
    phoneticUs: "/stɑːrˈveɪ.ʃən/"
    phoneticUk: "/stɑːˈveɪ.ʃən/"
  - word: cooperative
    meaning: 协作式的
    phoneticUs: "/koʊˈɑː.pɚ.ə.t̬ɪv/"
    phoneticUk: "/kəʊˈɒp.ər.ə.tɪv/"
  - word: asynchronous
    meaning: 异步的
    phoneticUs: "/eɪˈsɪŋ.krə.nəs/"
    phoneticUk: "/eɪˈsɪŋ.krə.nəs/"
---

# GMP 调度器：runtime 源码精读

> 核心源码：`src/runtime/proc.go`、`src/runtime/runtime2.go`

## GMP 全景图

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

### P（Processor）关键字段

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

---

## 二、调度循环

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

## 三、抢占机制

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

## 四、系统调用时的 P 交接

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

## 五、代码示例

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

```go
// 观察调度延迟（生产慎用）
import _ "net/http/pprof"

// 通过 pprof 查看 goroutine 阻塞原因
// go tool pprof http://localhost:6060/debug/pprof/goroutine
```

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
