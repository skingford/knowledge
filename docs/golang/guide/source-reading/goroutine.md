---
title: Goroutine 生命周期源码精读
description: 精读 goroutine 的创建（newproc）、状态机、栈扩缩容与退出流程。
---

# Goroutine 生命周期：runtime 源码精读

> 核心源码：`src/runtime/proc.go`、`src/runtime/stack.go`、`src/runtime/runtime2.go`
>
> 图例参考：复用 [Goroutine 与 GMP 调度模型](../03-goroutine-and-scheduler.md) 中的 SVG 图例，先建立直观状态流转，再回到 runtime 源码里的字段和调用链。

## Goroutine 生命周期全景图

<GoSchedulerDiagram kind="lifecycle" />

```
Goroutine 状态机
══════════════════════════════════════════════════════════════════

              newproc()
                  │
                  ▼
             _Gdead ──────── gfget(p)（复用空闲 G）
                  │
                  ▼
           _Grunnable ←──────────────────────────────────────┐
                  │                                          │
          execute(g) 调度                                    │
                  │                                          │
                  ▼                                          │
           _Grunning                                         │
           ╱     │    ╲                                      │
          ╱      │     ╲                                     │
   主动让步   系统调用   阻塞(chan/mutex)                     │
      │         │          │                                 │
      ▼         ▼          ▼                                 │
  _Grunnable _Gsyscall  _Gwaiting                            │
                         │                                   │
                    事件触发                                  │
                         └───────────────────────────────────┘
                              goready() → _Grunnable

              goexit()
                  │
                  ▼
             _Gdead ───→ 放回 gfree 池（复用）

══════════════════════════════════════════════════════════════════

状态枚举：
  _Gidle      = 0  // 刚分配，未初始化
  _Grunnable  = 1  // 就绪，在运行队列中
  _Grunning   = 2  // 正在 M 上运行
  _Gsyscall   = 3  // 系统调用中
  _Gwaiting   = 4  // 阻塞（channel/mutex/timer...）
  _Gdead      = 6  // 已退出，可复用
  _Gcopystack = 8  // 栈复制中（扩容）
  _Gpreempted = 9  // 被信号抢占，等待恢复
```

---

## 一、Goroutine 创建（newproc）

```
go func() 编译后的调用链
══════════════════════════════════════════════════════

  用户代码: go f(args)
       │
       ▼ 编译器插入
  newproc(fn *funcval)
       │
       ▼
  newproc1(fn, callergp, callerpc, ...)
  ├── 1. gfget(p) → 从 P 的 gfree 空闲池取 G（复用）
  │         └── 无空闲 → malg(stackMin=2048B) 分配新 G + 初始栈
  │
  ├── 2. 初始化调度上下文（gobuf）
  │         ├── sched.pc = goexit 地址（G 退出后的返回地址）
  │         └── 通过 gostartcallfn 将 fn 压入调用栈
  │
  ├── 3. 设置 G 状态：_Gdead → _Grunnable
  │
  ├── 4. runqput(pp, newg, true) → 优先放入 P 的 runnext
  │
  └── 5. wakep() → 如有空闲 P，唤醒或创建 M 来运行它

══════════════════════════════════════════════════════
```

### 初始栈大小

<GoSchedulerDiagram kind="thread-vs-goroutine" />

```
┌──────────────────────────────────────────────────────┐
│            Goroutine 栈规格                          │
│                                                      │
│  初始大小：2KB（stackMin = 2048）                    │
│  最大限制：1GB（64位系统默认，可调）                 │
│                                                      │
│  对比：OS 线程默认栈 8MB（不可缩减）                 │
│  → goroutine 初始成本极低，支持百万级并发            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 二、栈扩容（Stack Growth）

<GoSchedulerDiagram kind="stack-growth" />

```
栈扩容触发机制
══════════════════════════════════════════════════════

  每个函数入口（编译器插入）：
  ├── 比较当前 SP 与 stackguard0
  └── SP < stackguard0 → 调用 morestack()

  morestack() 流程：
  ├── 1. 计算新栈大小（当前栈 × 2）
  ├── 2. 分配新栈（stackalloc）
  ├── 3. 复制旧栈内容到新栈（copystack）
  │         └── 更新所有指向旧栈的指针（GC 扫描 + 逐帧修复）
  ├── 4. 释放旧栈（stackfree）
  └── 5. 重新执行触发扩容的函数

  抢占标记（preemption）：
  └── stackguard0 被设为 stackPreempt → 触发调度切换

══════════════════════════════════════════════════════
```

### 栈缩容（Stack Shrink）

```
栈缩容时机：
├── GC 扫描时（gcMark 阶段）检测使用率
├── 当前使用量 < 栈大小 1/4 → 触发缩容
└── 新栈大小 = 当前栈大小 / 2（最小保持 stackMin）

缩容开销：同样需要复制栈内容
→ 避免频繁扩缩（Go 运行时有 hysteresis 保护）
```

---

## 三、Goroutine 退出（goexit）

<GoSchedulerDiagram kind="goexit" />

```
goexit 链式调用
══════════════════════════════════════════════════════

  G 的 sched.pc 初始化为 goexit 地址
  当 G 的 goroutine 函数返回时，ret 指令跳到 goexit

  goexit0(gp)：
  ├── 1. 执行所有 defer（panic 未被 recover 时也执行）
  ├── 2. 解绑 M（gp.m = nil）
  ├── 3. 更新调度统计
  ├── 4. 将 G 状态改为 _Gdead
  ├── 5. gfput(pp, gp) → 放回 gfree 池（可复用）
  └── 6. schedule() → 继续调度其他 G

  复用机制：
  G 对象和 G 的栈（如果不太大）都会放回缓存
  → 下次 go 语句可以直接复用，避免内存分配

══════════════════════════════════════════════════════
```

---

## 四、goroutine 泄漏常见场景

<GoLeakRaceDiagram kind="leak-scenarios" />

```
泄漏场景一览
══════════════════════════════════════════════════════

  ① 阻塞在无人发送的 channel
     go func() { v := <-ch }()  // ch 永远无人发送

  ② select 缺少退出条件
     go func() {
         for { select { case v := <-ch: ... } }  // 无退出
     }()

  ③ 阻塞的 HTTP/gRPC 调用无超时
     go func() { http.Get(url) }()  // url 不响应则永久挂起

  ④ 死锁的 mutex
     go func() { mu.Lock(); mu.Lock() }()  // 第二次 Lock 永久阻塞

  检测方法：
  ├── runtime.NumGoroutine() → 监控 goroutine 数量增长
  ├── pprof goroutine profile → 查看阻塞 goroutine 的堆栈
  └── GODEBUG=schedtrace=1000 → 每秒打印调度信息

══════════════════════════════════════════════════════
```

---

## 五、代码示例

### goroutine + context 防泄漏

```go
func safeGo(ctx context.Context, fn func(ctx context.Context)) {
    go func() {
        fn(ctx) // ctx 取消时 fn 应主动退出
    }()
}

// 使用：超时控制防止 goroutine 泄漏
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    safeGo(ctx, func(ctx context.Context) {
        select {
        case <-ctx.Done():
            return // 超时退出
        case result := <-doWork():
            fmt.Println(result)
        }
    })
}

func doWork() <-chan string {
    ch := make(chan string, 1)
    go func() { ch <- "done" }()
    return ch
}
```

### goroutine 数量监控

```go
import (
    "runtime"
    "time"
    "log"
)

func monitorGoroutines(threshold int) {
    for {
        n := runtime.NumGoroutine()
        if n > threshold {
            log.Printf("goroutine leak? count=%d", n)
        }
        time.Sleep(10 * time.Second)
    }
}
```

### errgroup：goroutine 错误聚合

```go
import "golang.org/x/sync/errgroup"

func parallelFetch(urls []string) error {
    g, ctx := errgroup.WithContext(context.Background())

    for _, url := range urls {
        url := url // 捕获
        g.Go(func() error {
            return fetch(ctx, url)
        })
    }

    return g.Wait() // 等待所有 goroutine，返回第一个错误
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| goroutine 初始栈多大？ | 2KB（Go 1.4+ 从 8KB 降至 2KB） |
| goroutine 和 OS 线程的区别？ | goroutine 用户态调度、栈可动态扩缩、成本更低（~2KB vs 8MB） |
| goroutine 栈如何扩容？ | 检测 SP < stackguard0 → morestack → 分配新栈 → 复制 → 重执行 |
| goroutine 退出后资源如何处理？ | G 对象放回 gfree 池，供后续 go 语句复用 |
| goroutine 泄漏如何检测？ | pprof goroutine profile 或 runtime.NumGoroutine() 监控 |
| g0 是什么？ | 每个 M 的调度栈（运行 schedule/morestack 等 runtime 函数） |
