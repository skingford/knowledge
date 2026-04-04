---
title: Goroutine 与 GMP 调度模型
description: Go Goroutine 基础、生命周期、GMP 调度模型、Work Stealing 与 Hand-off 机制详解。
search: false
---

# Goroutine 与 GMP 调度模型（并发核心基石）

## 1. Goroutine 基础

- Goroutine 是 Go 中的轻量级协程，并发的最小执行单元，由 Go runtime 管理，而非操作系统线程；

- 相比于操作系统线程（MB 级别），Goroutine 的初始栈非常小（通常为 2KB），并且可以动态扩缩容，这使得 Go 程序可以轻松同时运行数十万个 Goroutine。

### Goroutine 与线程的底层差异

Go 提倡“不要通过共享内存来通信，而要通过通信来共享内存”。这套并发哲学之所以可行，关键就在于 Goroutine 不是对 OS 线程的一对一封装，而是由 runtime 在用户态统一调度。

| 特性 | OS 线程（Thread） | Goroutine |
| --- | --- | --- |
| 初始栈 | 通常是 MB 级，具体大小取决于操作系统和运行参数 | 通常从很小的栈开始，按需动态扩缩 |
| 调度者 | 操作系统内核 | Go runtime |
| 切换成本 | 需要内核参与，保存/恢复更多线程上下文 | 大多在用户态完成，切换成本更低 |
| 阻塞影响 | 一个线程阻塞，就会占住一个内核线程 | 一个 Goroutine 阻塞后，runtime 可让线程去执行其他 G |
| 数量级 | 容易受内存和内核资源限制 | 更适合承载海量并发任务 |
| 通信方式 | 常依赖锁、条件变量、共享内存 | 更强调 Channel、Context 和所有权转移 |

从架构视角看，真正重要的不是”Goroutine 更轻”这句结论，而是下面三点：

- **调度权变化**：线程由内核调度，Goroutine 由 runtime 通过 GMP 模型调度，海量任务得以复用在少量线程上。
- **阻塞粒度变化**：在线程模型里，网络/磁盘等待往往直接卡住线程；在 Go 里，很多阻塞只会挂起当前 G，M 仍可继续服务其他请求。
- **编程模型变化**：业务更容易按”任务 + 通信”建模，而不是围绕共享状态、锁竞争和条件变量组织代码。

<GoSchedulerDiagram kind="thread-vs-goroutine" />

> 注意：Goroutine 很轻量，但不是”零成本”。如果无上限创建，依然会带来栈内存、调度、GC 和下游资源压力，因此生产代码仍要控制并发度、处理超时并避免泄漏。

### 创建与生命周期

::: details 点击查看代码：Goroutine 创建与生命周期
```go
package main

import (
	"fmt"
	"time"
)

func sayHello(name string) {
	fmt.Printf("Hello, %s!\n", name)
}

func main() {
	// 用 go 关键字启动 Goroutine
	go sayHello("World")

	// 匿名函数启动
	go func(msg string) {
		fmt.Println(msg)
	}("anonymous goroutine")

	// main 退出时，所有 Goroutine 被强制终止
	// 这里用 Sleep 只是演示，实际应使用 WaitGroup 或 Channel 同步
	time.Sleep(100 * time.Millisecond)
}
```
:::

### Goroutine 的开销

::: details 点击查看代码：Goroutine 开销演示
```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	var wg sync.WaitGroup
	n := 100_000

	fmt.Printf("启动前 Goroutine 数量: %d\n", runtime.NumGoroutine())

	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// 模拟轻量任务
			_ = 1 + 1
			// 让出 CPU，避免忙等
			runtime.Gosched()
		}()
	}

	fmt.Printf("峰值 Goroutine 数量: %d\n", runtime.NumGoroutine())
	wg.Wait()
	fmt.Printf("结束后 Goroutine 数量: %d\n", runtime.NumGoroutine())
}
```
:::

### 讲解重点

- **栈起始大小**：每个 Goroutine 初始栈只有 2-8 KB（随版本有变化），远小于操作系统线程的 1-8 MB。栈可动态增长和收缩。
- **调度方式**：Goroutine 由 Go runtime 的用户态调度器管理，上下文切换不需要陷入内核，成本极低。
- **main 退出即终止**：`main` 函数结束时所有 Goroutine 被直接杀掉，不要依赖 `time.Sleep` 做同步，应使用 `sync.WaitGroup` 或 Channel。
- **何时使用**：I/O 等待（网络、磁盘）、并行计算、后台任务。不适合做纯 CPU 密集且无法分割的单一计算。

<GoSchedulerDiagram kind="lifecycle" />

### Goroutine 的高效依赖于 Go 运行时的 GMP 调度模型：

- G (Goroutine): 代表一个协程，包含执行的栈信息、指令指针、当前状态等。

- M (Machine): 代表操作系统层面的线程（OS Thread）。所有 G 的代码最终都是在 M 上执行的。

- P (Processor): 代表逻辑处理器，包含了运行 Goroutine 所需的资源（本地可运行 G 队列、内存分配缓存等）。M 必须绑定一个 P 才能执行 G。P 的数量默认由 GOMAXPROCS 决定（通常等于 CPU 核心数）。

### 协程间的桥梁：Channel (通道)

Channel 是 Goroutine 之间进行安全通信的管道。它底层是一个名叫 hchan 的结构体。

分类：

- 无缓冲 Channel (make(chan T))： 同步执行。发送方和接收方必须同时准备好，否则先执行的一方会阻塞等待。

- 有缓冲 Channel (make(chan T, capacity))： 异步执行。底层包含一个环形数组缓存。当缓冲区未满时发送不阻塞，缓冲区未空时接收不阻塞。

## 2. GMP 调度模型

Go 的调度器采用 GMP 模型，将大量 Goroutine 映射到少量操作系统线程上执行。

### 核心调度机制

- 本地队列与全局队列： P 维护一个本地的 G 队列（无锁，提高效率，上限 256 个）。当本地队列满了，新创建的 G 会被放入全局队列（需要加锁）。

- Work Stealing（工作窃取）：如果一个 P 的本地队列空了，**不是立刻去偷别人的任务**，而是会先按 `findrunnable` 的顺序检查全局队列和 NetPoller；只有公共区域也没活时，才会随机挑选其他 P，窃取其本地队列中的一部分 G。

- Handoff（移交）： 当 M 执行某个 G 发生系统调用（Syscall）阻塞时，M 会释放绑定的 P，把 P 移交给其他空闲的 M 去执行剩余的 G，从而保证 CPU 利用率。

### 角色说明

<GoSchedulerDiagram kind="roles" />

#### 工厂打工比喻

把 GMP 代入一个工厂场景，可以建立直觉理解：

| 角色 | 比喻 | 说明 |
| --- | --- | --- |
| **G** (Goroutine) | 工单 | 记录了要执行的工作逻辑、干到哪一步了（指令指针）以及临时草稿纸（栈内存） |
| **M** (Machine) | 工人 | 操作系统派来的线程，只负责出卖体力（占用 CPU 周期），必须有工位才能干活 |
| **P** (Processor) | 工位 / 包工头 | 为工人封装好干活所需的一切：本地工单夹（本地 G 队列）、工具（mcache 等资源）、调度逻辑 |

**为什么必须有 P？** 早期 Go（1.1 之前）只有 G 和 M，所有工人都去一个全厂唯一的"大公告板"（全局队列）抢工单，锁竞争激烈，效率极低。引入 P 后，每个工人有了专属工位（本地队列），大多数时候无需跟别人抢（无锁操作），效率大幅提升。如果工人 M 被系统调用卡住，P 会带着剩余工单转给其他空闲的 M 继续干活（Hand-off 机制）。

> **总结：G 是待干的活，M 是干活的牛马，P 是带着活和工具的管理者。**

### 调度流程图

<GoSchedulerDiagram kind="schedule-flow" />

### 关键机制

::: details 点击查看代码：GOMAXPROCS 与 Gosched 示例
```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// GOMAXPROCS 控制 P 的数量
	fmt.Printf("逻辑处理器 P 数量: %d\n", runtime.GOMAXPROCS(0))
	fmt.Printf("操作系统线程数上限 (非固定): 通过 runtime/debug.SetMaxThreads 设置\n")
	fmt.Printf("当前 Goroutine 数量: %d\n", runtime.NumGoroutine())

	// runtime.Gosched() 主动让出当前 P，让其他 G 有机会执行
	go func() {
		for i := 0; i < 3; i++ {
			fmt.Println("goroutine running", i)
			runtime.Gosched() // 主动让出
		}
	}()

	runtime.Gosched()
	fmt.Println("main continues")
}
```
:::

### 讲解重点

- **Work Stealing（工作窃取）**：当某个 P 的本地队列为空时，它会先看全局队列、再看 NetPoller，最后才随机偷其他 P 的本地任务，避免 P 空闲。

<GoSchedulerDiagram kind="work-stealing" />

- **Hand-off（交接）**：当 M 因系统调用阻塞时，它绑定的 P 会被交接给另一个空闲的 M（或创建新 M），保证 P 不闲置。

<GoSchedulerDiagram kind="handoff" />

阻塞 syscall 时为什么还能继续跑别的 G？这张图建议和 `entersyscall / exitsyscall` 一起看。核心不是”阻塞 syscall 消失了”，而是 **阻塞的是 M，不应该顺带把 P 也困住**，所以 runtime 会把 P 交给其他 M。

- **抢占式调度**：Go 1.14 起引入基于信号的抢占（异步抢占），即使 Goroutine 没有函数调用也能被抢占，避免单个 G 长期霸占 M。
- **本地队列 vs 全局队列**：新创建的 G 优先放入当前 P 的本地队列；本地队列满（256 个）时，一半会被转移到全局队列。调度器每隔一段时间也会检查全局队列，防止 G 饿死。

### `runnext`、本地队列与全局队列

<GoSchedulerDiagram kind="run-queue" />

学习这部分时，最容易混淆的是“新建的 G 到底先进哪里”。实践上可以先记住一条主线：**优先放当前 P 的近处，放不下再向全局扩散**。这样既能减少加锁，也更容易命中 CPU cache。


### Handoff 三幕剧

**场景设定**：工位 P1 上，工人 M1 正在处理工单 G1，P1 的本地工单夹里还有 10 个工单（G2~G11）排队。

**第一幕：工人 M1 被迫停工**

G1 是一项特殊任务——读取一个超大的本地文件（同步系统调用）。操作系统把 M1 强制按在原地等待，M1 陷入阻塞。

**第二幕：包工头 P1 的”无情抛弃”**

Go 调度器绝不允许 P1 陪着 M1 一起等——P1 手里还有 10 个工单没人做！

1. **立刻解绑**：发现 M1 卡住后，P1 毫不犹豫地与 M1 分离。M1 留在原地傻等，P1 带着工单撤了。
2. **寻找新欢**：P1 去线程缓存池里喊一个闲置工人 M2。如果池里没人，调度器直接向操作系统新雇一个 M。
3. **继续干活**：P1 把工单夹交给 M2，M2 接着处理 G2~G11。

**第三幕：王者归来，M1 苏醒**

文件读完了，M1 拿到结果苏醒，但发现 P1 和工位都不见了——没有 P 就没法执行代码：

1. **尝试抢工位**：M1 先看全厂有没有空闲的 P。如果有，绑定并完成 G1 收尾。
2. **无家可归，上交工单**：如果所有 P 都在忙，M1 把 G1 挂到全局队列，等其他 P 领取。
3. **回去睡觉**：M1 进入睡眠状态，放回空闲线程池，等待下次被唤醒。

#### 网络请求卡住怎么办？——NetPoller 优化

对于**网络 I/O**（以及 `time.Sleep` 等），Go 不会占用 M 去死等。它把这个 G 踢给专门的外包部门——**NetPoller**（底层基于 epoll/kqueue）。M1 把 G 扔给 NetPoller 后，**立刻可以接手下一个任务**，根本不会阻塞。等 NetPoller 发现数据回来了，再把 G 塞回全局或本地队列。

> 这就是为什么 Go 的网络编程性能出色——**同步系统调用才触发 Handoff 和线程创建，网络 I/O 走 NetPoller 几乎零额外线程开销**。

### 抢占式调度：为什么死循环不再长期霸占 CPU

<GoSchedulerDiagram kind="preemption" />

这里要把“协作式抢占”和“异步抢占”区分开。前者更依赖函数调用边界，后者则由 `sysmon` 观察长时间运行的 G，并通过信号让它在安全点让出执行权。

### Work Stealing 的工厂场景

想象工厂里有 4 个工位（P1~P4），各绑着一个工人（M1~M4）。P1 的工人 M1 手脚麻利，把本地工单夹里的活儿全干完了。CPU 资源极其宝贵，M1 不能闲着摸鱼——P1 会执行一套经典的”找活儿（`findrunnable`）”流程：

**第一步：按规矩找（常规检查）**

P1 不会立刻去抢别人的活，而是先去公共区域：

1. **看公共看板（全局队列）**：如果大公告板上有公共工单，P1 顺手拿走一批带回工位让 M1 接着干。运行时会按 `runqsize / GOMAXPROCS + 1` 的思路估算批量，再受当前 P 本地队列容量约束，不会一次性全搬空。
2. **看外包部门（NetPoller）**：如果公共看板也没活，P1 去看有没有因等网络响应而暂停的工单现在可以唤醒继续了。

**第二步：随机锁定”受害者”（开始窃取）**

公共区域实在没活了，P1 开始”内卷”——**随机**挑选另一个工位（比如 P2）。随机是为了防止大家都盯着同一个效率高的工位薅羊毛，分散压力。

**第三步：毫不客气，拿走一半（Steal Half）**

P1 从 P2 的工单夹里直接拿走**一半**的工单，放到自己的工单夹里。

- **太少不划算**：只拿 1 个，M1 干完又得去抢，频繁窃取消耗系统性能（需要加短小自旋锁）。
- **太多不公平**：全拿走，P2 马上没活干又得去抢别人，造成恶性循环。
- **拿一半（平分秋色）**：最完美的负载均衡——P1 和 P2 瞬间都有足够干一阵子的活，工厂整体效率最大化。

> **Work Stealing 的意义**：完美解决”局部繁忙与局部闲置”的资源不平衡。依靠 P 之间的互助窃取，只要有代码需要运行，所有 CPU 核心都像上了发条一样被压榨到极致。

### Work Stealing 的查找顺序与触发逻辑

这个问题最容易记错的一点是：**工作窃取不是“本地队列空了就直接偷别人”**。从 `runtime/proc.go` 的 `findRunnable` 来看，真正顺序更接近下面这样：

1. **先看 `runnext` 和本地队列**：这是命中率最高、成本最低的路径，优先级永远最高。
2. **周期性补一次全局公平性检查**：`schedtick % 61 == 0` 时，调度器会先去看一眼全局队列，防止两个 Goroutine 在本地队列里互相唤醒，长期霸占执行机会，导致全局队列里的任务饿死。
3. **本地确实空了，再查全局队列**：这是空闲 P 的第一反应，不是去抢别人的，而是先接手那些已经落入 `sched.runq` 的”公共任务”。
4. **再查 NetPoller**：如果有网络 I/O、定时器等事件刚好就绪，对应的 G 会被重新唤醒并进入 runnable 状态。
5. **最后才进入 Work Stealing**：前面都没找到活，当前 M 才会进入 spinning 状态，随机挑选其他 P 作为受害者，从它们的本地队列中窃取任务。
6. **实在没活，才考虑阻塞等待或休眠**：这时 runtime 会进一步处理 idle GC、定时器和阻塞式 netpoll；如果仍然什么都没有，当前 M 才会 `stopm` 休眠。

也就是说，关于“先从全局，还是先从其他 P 偷”这个问题，答案是：

> **先全局队列，再 NetPoller，最后才随机偷其他 P。**

这里再补两个非常关键的实现细节：

- **为什么要随机偷**：源码里的 `stealWork` 不是按 P0、P1、P2 固定顺序扫，而是从一个伪随机起点开始枚举。这样能避免多个空闲 P 同时扑向同一个繁忙 P，降低锁竞争和惊群效应。
- **为什么常说“偷一半”**：`runqsteal` 的目标不是把对方掏空，而是搬走后半段任务做负载均衡。偷太少，自己很快又会饿；偷太多，对方马上又空，整体吞吐反而变差。
- **随机也不是只试一次**：Go 运行时通常会进行多轮窃取尝试（当前版本源码里 `stealTries = 4`），最后一轮还会更积极地检查 `runnext` 和可偷取的 timer。

### `findrunnable` 流程图

<GoSchedulerDiagram kind="findrunnable" />

### 自旋线程（Spinning）为什么存在

<GoSchedulerDiagram kind="spinning" />

如果一个 M/P 组合没找到任务就立刻休眠，会频繁进入内核态睡眠与唤醒，代价并不低。Go runtime 因此引入了自旋线程：

- **含义**：短时间内不睡眠，继续主动寻找可运行的 G。
- **收益**：新任务刚被创建、网络事件刚就绪时，可以更快被发现，降低调度延迟。
- **限制**：runtime 会控制自旋线程数量，避免所有线程一起空转把 CPU 烧掉。

这也是为什么 Go 在高并发 I/O 场景下通常表现很好：它既避免“一没活就睡”的迟钝，也避免“所有线程疯狂自旋”的浪费。

---

## 3. sysmon：幕后的"厂长"

如果某个 G 是死循环（没有任何网络等待和系统调用），工人 M1 一直低头算这个算不完的账，P1 队列里的其他工单岂不是全部饿死？

为了防止这种"霸占资源"的情况，Go 运行时在启动时会安插一个**"巡检员"**——`sysmon`（System Monitor）监控线程。

### sysmon 的特殊身份

`sysmon` 是一个极其特殊的 M（操作系统线程）：**不需要绑定任何 P**，不受普通调度逻辑控制。它像幽灵一样隐藏在监控室里，死循环式地定期巡视整个运行时的状态。核心职责是"找茬"和"兜底"。

### sysmon 的四大铁腕手段

#### 第一板斧：强行剥夺执行权（抢占式调度）

sysmon 持续监控所有 P。如果发现某个 M 执行同一个 G 的时间超过 **10ms**，就判定该 G 占用了过多 CPU 资源：

- **Go 1.14 之前**：抢占是协作式的，依赖函数调用边界。如果死循环里没有任何函数调用，sysmon 也拿它没办法。
- **Go 1.14 之后**：引入**基于信号的异步抢占**。sysmon 向操作系统发送 `SIGURG` 信号，硬生生把执行过久的 G 从 M 上"揪下来"，塞回全局队列末尾排队。这完美解决了死循环导致程序卡死的问题。

#### 第二板斧：发现并处理卡死的 M（Handoff 的幕后推手）

前面说"P 发现 M 卡住了，果断抛弃"——但 P 本身是数据结构，不会主动"发现"。**真正的侦探是 sysmon**。它在巡检时发现某个 M 因系统调用卡住超过一定时间（约 10ms），就下达指令强行剥离 M 和 P，触发 Handoff 机制。

#### 第三板斧：主动查收网络快递（处理 NetPoll）

sysmon 每次巡检都会问 NetPoller："有没有网络请求的结果回来了？"如果有，sysmon 亲手把等待网络结果的 G 重新唤醒，塞回本地或全局队列继续执行。

#### 第四板斧：强制打扫卫生（保底触发 GC）

Go 的 GC 通常根据内存分配比例触发。但如果程序内存分配非常慢，很久都没达到阈值怎么办？sysmon 盯着时间表，如果距离上一次 GC 已过 **2 分钟**，不管内存用得怎么样，都会**强制触发一次垃圾回收**。

---

### 对性能优化的启示

- **不要过早手工干预调度**：大多数服务端场景先相信默认调度器，再用 pprof、trace 和 runtime 指标验证瓶颈。
- **减少长时间阻塞 syscall**：频繁进入阻塞系统调用会触发 P 交接，增加调度抖动；网络场景优先使用 Go 标准库的非阻塞 I/O 路径。
- **区分 I/O 密集与 CPU 密集**：I/O 密集型适合大量 Goroutine；CPU 密集型任务则要控制并发度，避免创建过多长期 runnable 的 G。
- **容器内正确设置 `GOMAXPROCS`**：如果容器 CPU Quota 很小却放大了 `GOMAXPROCS`，调度器会误以为可并行的 P 更多，导致额外抢占和自旋开销。
- **关注”调度层问题”而不只是业务层问题**：Goroutine 堆积、线程数异常上升、syscall 阻塞、run queue 过长，往往是吞吐下降和尾延迟上升的前置信号。

---

## GMP 调度模型总结

把 Work Stealing 和 Handoff 结合起来看，就能理解 Go 并发为何如此高效：

| 机制 | 作用 | 一句话 |
| --- | --- | --- |
| **Goroutine (G)** | 轻量级任务 | 封装代码和上下文，初始栈极小，可动态扩缩 |
| **Machine (M)** | 操作系统线程 | 真正干活的牛马，所有 G 的代码最终在 M 上执行 |
| **Processor (P)** | 逻辑处理器 | 资源管理者，自带本地队列，连接 G 和 M |
| **Work Stealing** | 偷活儿 | P 空闲时随机偷其他 P 的一半 G，保证**资源不闲置** |
| **Handoff** | 甩锅 | M 卡住时 sysmon 剥离 P，让 P 找新 M 继续干，保证**任务不阻塞** |
| **sysmon** | 幕后巡检 | 超时抢占、触发 Handoff、唤醒网络任务、保底 GC——最后一道防线 |

> **一推一拉之间**：Work Stealing 保证所有 M 不会闲着，Handoff 保证所有 G 不会被牵连堵塞。Go 运行时把 CPU 压榨到了物理极限。
