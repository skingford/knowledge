---
title: Goroutine 与 GMP 调度模型
description: Go Goroutine 基础、生命周期、GMP 调度模型、Work Stealing 与 Hand-off 机制详解。
head:
  - - meta
    - name: keywords
      content: Goroutine,GMP,调度器,Work Stealing,Handoff,sysmon,抢占式调度,NetPoller,Go并发,GOMAXPROCS
---

# Goroutine 与 GMP 调度模型（并发核心基石）

## 1. Goroutine 基础

- Goroutine 是 Go 中的轻量级协程，并发的最小执行单元，由 Go runtime 管理，而非操作系统线程；

- 相比于操作系统线程（MB 级别），Goroutine 的初始栈非常小（2KB，Go 1.4 起），并且可以动态扩缩容，这使得 Go 程序可以轻松同时运行数十万个 Goroutine。

### Goroutine 与线程的底层差异

Go 提倡"不要通过共享内存来通信，而要通过通信来共享内存"。这套并发哲学之所以可行，关键就在于 Goroutine 不是对 OS 线程的一对一封装，而是由 runtime 在用户态统一调度。

| 特性 | OS 线程（Thread） | Goroutine |
| --- | --- | --- |
| 初始栈 | Linux 默认 8MB，macOS 512KB-8MB | 2KB（Go 1.4 起），按需动态扩缩 |
| 调度者 | 操作系统内核 | Go runtime |
| 切换成本 | 需要内核参与，保存/恢复更多线程上下文 | 大多在用户态完成，切换成本更低 |
| 阻塞影响 | 一个线程阻塞，就会占住一个内核线程 | 一个 Goroutine 阻塞后，runtime 可让线程去执行其他 G |
| 数量级 | 容易受内存和内核资源限制 | 更适合承载海量并发任务 |
| 通信方式 | 常依赖锁、条件变量、共享内存 | 更强调 Channel、Context 和所有权转移 |

从架构视角看，真正重要的不是"Goroutine 更轻"这句结论，而是下面三点：

- **调度权变化**：线程由内核调度，Goroutine 由 runtime 通过 GMP 模型调度，海量任务得以复用在少量线程上。
- **阻塞粒度变化**：在线程模型里，网络/磁盘等待往往直接卡住线程；在 Go 里，很多阻塞只会挂起当前 G，M 仍可继续服务其他请求。
- **编程模型变化**：业务更容易按"任务 + 通信"建模，而不是围绕共享状态、锁竞争和条件变量组织代码。

<GoSchedulerDiagram kind="thread-vs-goroutine" />

> 注意：Goroutine 很轻量，但不是"零成本"。如果无上限创建，依然会带来栈内存、调度、GC 和下游资源压力，因此生产代码仍要控制并发度、处理超时并避免泄漏。

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

<GoSchedulerDiagram kind="lifecycle" />

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

### Goroutine 要点回顾

- **栈起始大小**：每个 Goroutine 初始栈为 2KB（Go 1.4 起），远小于操作系统线程的 MB 级栈。栈可动态增长和收缩。
- **调度方式**：Goroutine 由 Go runtime 的用户态调度器管理，上下文切换不需要陷入内核，成本极低。
- **main 退出即终止**：`main` 函数结束时所有 Goroutine 被直接杀掉，不要依赖 `time.Sleep` 做同步，应使用 `sync.WaitGroup` 或 Channel。
- **何时使用**：I/O 等待（网络、磁盘）、并行计算、后台任务。不适合做纯 CPU 密集且无法分割的单一计算。

> Goroutine 之间的通信依赖 Channel（通道），详见 [Channel 与 Select](./03-channel-select-context)。

---

## 2. GMP 调度模型

Go 的调度器采用 GMP 模型，将大量 Goroutine 映射到少量操作系统线程上执行。Goroutine 的高效正是依赖于这套调度架构。

### G / M / P 三角色

<GoSchedulerDiagram kind="roles" />

#### 工厂打工比喻

把 GMP 代入一个工厂场景，可以建立直觉理解：

| 角色 | 比喻 | 说明 |
| --- | --- | --- |
| **G** (Goroutine) | 工单 | 记录了要执行的工作逻辑、干到哪一步了（指令指针）以及临时草稿纸（栈内存） |
| **M** (Machine) | 工人 | 操作系统派来的线程，只负责出卖体力（占用 CPU 周期），必须有工位才能干活 |
| **P** (Processor) | 工位 / 包工头 | 为工人封装好干活所需的一切：本地工单夹（本地 G 队列）、工具（mcache 等资源）、调度逻辑。P 的数量默认由 `GOMAXPROCS` 决定（通常等于 CPU 核心数） |

**为什么必须有 P？** 早期 Go（1.1 之前）只有 G 和 M，所有工人都去一个全厂唯一的"大公告板"（全局队列）抢工单，锁竞争激烈，效率极低。引入 P 后，每个工人有了专属工位（本地队列），大多数时候无需跟别人抢（无锁操作），效率大幅提升。如果工人 M 被系统调用卡住，P 会带着剩余工单转给其他空闲的 M 继续干活（Hand-off 机制）。

> **总结：G 是待干的活，M 是干活的牛马，P 是带着活和工具的管理者。**

### `runnext`、本地队列与全局队列

<GoSchedulerDiagram kind="run-queue" />

学习这部分时，最容易混淆的是"新建的 G 到底先进哪里"。实践上可以先记住一条主线：**优先放当前 P 的近处，放不下再向全局扩散**。这样既能减少加锁，也更容易命中 CPU cache。

- **本地队列**：P 维护的无锁 G 队列，上限 256 个，大多数时候新 G 直接入此队列。
- **全局队列**：本地队列满时，一半 G 被转移到全局队列（需要加锁）。调度器每隔一段时间也会检查全局队列，防止 G 饿死。

### 调度流程

<GoSchedulerDiagram kind="schedule-flow" />

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

---

## 3. 核心调度机制

### Work Stealing（工作窃取）

<GoSchedulerDiagram kind="work-stealing" />

当某个 P 的本地队列为空时，**不是立刻去偷别人的任务**，而是按 `findRunnable` 的顺序逐步寻找可运行的 G。这个查找顺序是理解调度器行为的关键：

1. **先看 `runnext` 和本地队列**：命中率最高、成本最低的路径，优先级永远最高。
2. **周期性全局公平性检查**：`schedtick % 61 == 0` 时，调度器会先去看一眼全局队列，防止本地队列里的 G 互相唤醒、长期霸占执行机会，导致全局队列中的任务饿死。
3. **本地确实空了，查全局队列**：空闲 P 的第一反应不是去抢别人的，而是先接手全局队列中的"公共任务"。运行时会按 `runqsize / GOMAXPROCS + 1` 估算批量，不会一次性全搬空。
4. **查 NetPoller**：如果有网络 I/O、定时器等事件刚好就绪，对应的 G 会被重新唤醒。
5. **最后才进入 Work Stealing**：前面都没找到活，当前 M 才会进入 spinning 状态，随机挑选其他 P 作为"受害者"，从它们的本地队列中窃取任务。
6. **实在没活，考虑休眠**：runtime 会进一步处理 idle GC、定时器和阻塞式 netpoll；如果仍然什么都没有，当前 M 才会 `stopm` 休眠。

> **先全局队列，再 NetPoller，最后才随机偷其他 P。**

<GoSchedulerDiagram kind="findrunnable" />

#### Work Stealing 的工厂场景

想象工厂里有 4 个工位（P1~P4），各绑着一个工人（M1~M4）。P1 的工人 M1 手脚麻利，把本地工单夹里的活儿全干完了。CPU 资源极其宝贵，M1 不能闲着摸鱼——P1 会执行"找活儿"流程：

**第一步：按规矩找（常规检查）**

P1 不会立刻去抢别人的活，而是先去公共区域——公共看板（全局队列）和外包部门（NetPoller）。

**第二步：随机锁定"受害者"（开始窃取）**

公共区域实在没活了，P1 开始"内卷"——**随机**挑选另一个工位（比如 P2）。随机是为了防止大家都盯着同一个效率高的工位薅羊毛，分散压力。

**第三步：毫不客气，拿走一半（Steal Half）**

P1 从 P2 的工单夹里直接拿走**一半**的工单，放到自己的工单夹里。

- **太少不划算**：只拿 1 个，M1 干完又得去抢，频繁窃取消耗系统性能（需要加短小自旋锁）。
- **太多不公平**：全拿走，P2 马上没活干又得去抢别人，造成恶性循环。
- **拿一半（平分秋色）**：最完美的负载均衡——P1 和 P2 瞬间都有足够干一阵子的活，工厂整体效率最大化。

#### 实现细节

- **为什么要随机偷**：源码里的 `stealWork` 不是按 P0、P1、P2 固定顺序扫，而是从一个伪随机起点开始枚举。这样能避免多个空闲 P 同时扑向同一个繁忙 P，降低锁竞争和惊群效应。
- **为什么常说"偷一半"**：`runqsteal` 的目标不是把对方掏空，而是搬走后半段任务做负载均衡。偷太少，自己很快又会饿；偷太多，对方马上又空，整体吞吐反而变差。
- **随机也不是只试一次**：Go 运行时通常会进行多轮窃取尝试（当前版本源码里 `stealTries = 4`），最后一轮还会更积极地检查 `runnext` 和可偷取的 timer。

> **Work Stealing 的意义**：完美解决"局部繁忙与局部闲置"的资源不平衡。依靠 P 之间的互助窃取，只要有代码需要运行，所有 CPU 核心都像上了发条一样被压榨到极致。

### Handoff（移交）

<GoSchedulerDiagram kind="handoff" />

当 M 执行某个 G 发生系统调用（Syscall）阻塞时，M 会释放绑定的 P，把 P 移交给其他空闲的 M 去执行剩余的 G，从而保证 CPU 利用率。

阻塞 syscall 时为什么还能继续跑别的 G？核心不是"阻塞 syscall 消失了"，而是 **阻塞的是 M，不应该顺带把 P 也困住**，所以 runtime 会把 P 交给其他 M。

#### Handoff 三幕剧

**场景设定**：工位 P1 上，工人 M1 正在处理工单 G1，P1 的本地工单夹里还有 10 个工单（G2~G11）排队。

**第一幕：工人 M1 被迫停工**

G1 是一项特殊任务——读取一个超大的本地文件（同步系统调用）。操作系统把 M1 强制按在原地等待，M1 陷入阻塞。

**第二幕：包工头 P1 的"无情抛弃"**

Go 调度器绝不允许 P1 陪着 M1 一起等——P1 手里还有 10 个工单没人做！

1. **立刻解绑**：发现 M1 卡住后，P1 毫不犹豫地与 M1 分离。M1 留在原地傻等，P1 带着工单撤了。
2. **寻找新欢**：P1 去线程缓存池里喊一个闲置工人 M2。如果池里没人，调度器直接向操作系统新雇一个 M。
3. **继续干活**：P1 把工单夹交给 M2，M2 接着处理 G2~G11。

**第三幕：王者归来，M1 苏醒**

文件读完了，M1 拿到结果苏醒，但发现 P1 和工位都不见了——没有 P 就没法执行代码：

1. **尝试抢工位**：M1 先看全厂有没有空闲的 P。如果有，绑定并完成 G1 收尾。
2. **无家可归，上交工单**：如果所有 P 都在忙，M1 把 G1 挂到全局队列，等其他 P 领取。
3. **回去睡觉**：M1 进入睡眠状态，放回空闲线程池，等待下次被唤醒。

### NetPoller 与网络 I/O

对于**网络 I/O**（以及 `time.Sleep` 等），Go 不会占用 M 去死等。它把这个 G 踢给专门的外包部门——**NetPoller**（底层基于 epoll/kqueue）。M 把 G 扔给 NetPoller 后，**立刻可以接手下一个任务**，根本不会阻塞。等 NetPoller 发现数据回来了，再把 G 塞回全局或本地队列。

> 这就是为什么 Go 的网络编程性能出色——**同步系统调用才触发 Handoff 和线程创建，网络 I/O 走 NetPoller 几乎零额外线程开销**。

### 抢占式调度

<GoSchedulerDiagram kind="preemption" />

Go 1.14 起引入基于信号的抢占（异步抢占），即使 Goroutine 没有函数调用也能被抢占，避免单个 G 长期霸占 M。

这里要把"协作式抢占"和"异步抢占"区分开：前者依赖函数调用边界，后者由 `sysmon` 观察长时间运行的 G，并通过 `SIGURG` 信号让它在安全点让出执行权。

### 自旋线程（Spinning）

<GoSchedulerDiagram kind="spinning" />

如果一个 M/P 组合没找到任务就立刻休眠，会频繁进入内核态睡眠与唤醒，代价并不低。Go runtime 因此引入了自旋线程：

- **含义**：短时间内不睡眠，继续主动寻找可运行的 G。
- **收益**：新任务刚被创建、网络事件刚就绪时，可以更快被发现，降低调度延迟。
- **限制**：runtime 会控制自旋线程数量，避免所有线程一起空转把 CPU 烧掉。

这也是为什么 Go 在高并发 I/O 场景下通常表现很好：它既避免"一没活就睡"的迟钝，也避免"所有线程疯狂自旋"的浪费。

---

## 4. sysmon：幕后的"厂长"

如果某个 G 是死循环（没有任何网络等待和系统调用），工人 M1 一直低头算这个算不完的账，P1 队列里的其他工单岂不是全部饿死？

为了防止这种"霸占资源"的情况，Go 运行时在启动时会安插一个**"巡检员"**——`sysmon`（System Monitor）监控线程。

### sysmon 的特殊身份

`sysmon` 是一个极其特殊的 M（操作系统线程）：**不需要绑定任何 P**，不受普通调度逻辑控制。它像幽灵一样隐藏在监控室里，死循环式地定期巡视整个运行时的状态。核心职责是"找茬"和"兜底"。

> 一个常见误解是：`sysmon` 不能像操作系统调度器那样，在 `M` 正执行用户态 `G` 时，直接把 `P` 从 `M` 身上“抠走”。Go runtime 没有那种“异步中断 + 保存现场 + 强制迁移 `P`”的能力。对正在运行的用户态代码，`sysmon` 能做的是**标记抢占**，让当前 `G` 尽快在安全点回到调度器；只有当 `G` 被切走、进入 `schedule` 之后，`P` 才会重新参与调度。更准确的路径是：`sysmon -> 标记抢占 -> G 进入调度点 -> M 释放 / 调度 P`，而不是 `sysmon -> 直接拆 P`。

<GoSchedulerDiagram kind="sysmon-workflow" />

### sysmon 的四大铁腕手段

#### 第一板斧：强行剥夺执行权（抢占式调度）

sysmon 持续监控所有 P。如果发现某个 M 执行同一个 G 的时间超过 **10ms**，就判定该 G 占用了过多 CPU 资源：

- **Go 1.14 之前**：抢占是协作式的，依赖函数调用边界。如果死循环里没有任何函数调用，sysmon 也拿它没办法。
- **Go 1.14 之后**：引入**基于信号的异步抢占**。sysmon 会向对应 M 发送 `SIGURG` 信号，把当前 G 标记为需要抢占；真正的切换发生在 G 到达安全点、回到调度器之后。也就是说，sysmon 不是直接"把 P 从 M 上抢走"，而是先让 G 退出当前执行片段，再由调度器重新安排 M / P / G 的组合。

#### 第二板斧：发现并处理卡死的 M（Handoff 的幕后推手）

前面说"P 发现 M 卡住了，果断抛弃"——但 P 本身是数据结构，不会主动"发现"。**真正的侦探是 sysmon**。不过这里也要分清场景：如果 `M` 正在执行用户态 `G`，sysmon 不能直接把 `P` 从它身上硬拆下来，只能先触发抢占，让 `G` 进入调度点后再由调度器归还 / 重新分配 `P`。而在 `syscall` 场景里，`G` 一旦进入 `entersyscall`，`M / P / G` 的关系就进入了 syscall 特殊状态；runtime 后续才能通过 retake / handoff 让其他 `M` 接手这个 `P`。所以更准确的理解是：**sysmon 负责观察并推动后续 handoff，而不是直接把正在运行的 M 上的 P 抠走。**

#### 第三板斧：主动查收网络快递（处理 NetPoll）

sysmon 每次巡检都会问 NetPoller："有没有网络请求的结果回来了？"如果有，sysmon 亲手把等待网络结果的 G 重新唤醒，塞回本地或全局队列继续执行。

#### 第四板斧：强制打扫卫生（保底触发 GC）

Go 的 GC 通常根据内存分配比例触发。但如果程序内存分配非常慢，很久都没达到阈值怎么办？sysmon 盯着时间表，如果距离上一次 GC 已过 **2 分钟**，不管内存用得怎么样，都会**强制触发一次垃圾回收**。

---

## 5. 对性能优化的启示

- **不要过早手工干预调度**：大多数服务端场景先相信默认调度器，再用 pprof、trace 和 runtime 指标验证瓶颈。
- **减少长时间阻塞 syscall**：频繁进入阻塞系统调用会触发 P 交接，增加调度抖动；网络场景优先使用 Go 标准库的非阻塞 I/O 路径。
- **区分 I/O 密集与 CPU 密集**：I/O 密集型适合大量 Goroutine；CPU 密集型任务则要控制并发度，避免创建过多长期 runnable 的 G。
- **容器内正确设置 `GOMAXPROCS`**：如果容器 CPU Quota 很小却放大了 `GOMAXPROCS`，调度器会误以为可并行的 P 更多，导致额外抢占和自旋开销。
- **关注"调度层问题"而不只是业务层问题**：Goroutine 堆积、线程数异常上升、syscall 阻塞、run queue 过长，往往是吞吐下降和尾延迟上升的前置信号。

---

## GMP 调度模型总结

把 Work Stealing 和 Handoff 结合起来看，就能理解 Go 并发为何如此高效：

| 机制 | 作用 | 一句话 |
| --- | --- | --- |
| **Goroutine (G)** | 轻量级任务 | 封装代码和上下文，初始栈极小，可动态扩缩 |
| **Machine (M)** | 操作系统线程 | 真正干活的牛马，所有 G 的代码最终在 M 上执行 |
| **Processor (P)** | 逻辑处理器 | 资源管理者，自带本地队列，连接 G 和 M |
| **Work Stealing** | 偷活儿 | P 空闲时随机偷其他 P 的一半 G，保证**资源不闲置** |
| **Handoff** | 甩锅 | M 因 syscall 进入特殊状态后，runtime 让 P 被其他 M 接手，保证**任务不阻塞** |
| **sysmon** | 幕后巡检 | 超时抢占、触发 Handoff、唤醒网络任务、保底 GC——最后一道防线 |

> **一推一拉之间**：Work Stealing 保证所有 M 不会闲着，Handoff 保证所有 G 不会被牵连堵塞。Go 运行时把 CPU 压榨到了物理极限。

---

## 附录：名词解释

<details>
<summary>展开详情</summary>

| 术语 | 全称 / 出处 | 说明 |
|------|-------------|------|
| Goroutine (G) | Go Runtime | Go 的轻量级协程，并发最小执行单元，初始栈 2KB，由 runtime 调度而非 OS |
| Machine (M) | Go Runtime | 操作系统线程的抽象，所有 G 的代码最终在 M 上执行 |
| Processor (P) | Go Runtime | 逻辑处理器，持有本地 G 队列和 mcache 等资源，M 必须绑定 P 才能执行 G |
| GMP | Go Runtime | Go 调度模型的三要素：Goroutine、Machine、Processor |
| GOMAXPROCS | `runtime.GOMAXPROCS()` | 控制 P 的数量，默认等于 CPU 核心数 |
| runnext | `runtime/proc.go` | P 上的特殊单槽位，存放下一个优先执行的 G，命中率最高的快捷路径 |
| Local Run Queue | Go Runtime | P 维护的本地 G 队列，无锁操作，上限 256 个 |
| Global Run Queue | Go Runtime | 全局共享的 G 队列，需要加锁，本地队列溢出时 G 会被转移至此 |
| Work Stealing | 调度策略 | P 空闲时随机从其他 P 的本地队列窃取一半 G，实现负载均衡 |
| Handoff | 调度策略 | M 因 syscall 进入特殊状态后，runtime 通过 retake / handoff 让其他空闲 M 接手 P |
| findRunnable | `runtime/proc.go` | 调度器查找可运行 G 的核心函数，按本地→全局→NetPoller→Stealing 顺序执行 |
| schedtick | `runtime/proc.go` | 调度计数器，每执行一个 G 递增一次；`% 61` 时触发全局队列公平性检查 |
| Spinning Thread | Go Runtime | 自旋线程，短时间内不休眠持续寻找可运行的 G，降低调度延迟 |
| sysmon | System Monitor | 特殊监控线程，不绑定 P，负责抢占、Handoff、NetPoll 唤醒和保底 GC |
| NetPoller | Go Runtime | 基于 epoll/kqueue 的网络轮询器，让网络 I/O 不占用 M，实现非阻塞等待 |
| Syscall | System Call | 系统调用，进入内核态执行的操作（如文件读写），同步 syscall 会阻塞 M |
| epoll / kqueue | Linux / macOS | 操作系统提供的 I/O 多路复用机制，NetPoller 的底层实现 |
| SIGURG | POSIX Signal | Go 1.14 起用于异步抢占的信号，sysmon 向长期运行的 G 所在 M 发送此信号 |
| 协作式抢占 | Go < 1.14 | 依赖函数调用边界插入抢占检查点，死循环无法被抢占 |
| 异步抢占 | Go >= 1.14 | 基于信号的抢占机制，即使无函数调用也能中断长期运行的 G |
| GC | Garbage Collection | 垃圾回收，Go 使用三色标记并发 GC，sysmon 可在超过 2 分钟未触发时强制执行 |
| mcache | Go Runtime | P 持有的本地内存缓存，用于小对象分配，减少全局锁竞争 |
| WaitGroup | `sync.WaitGroup` | 同步原语，等待一组 Goroutine 完成，通过 Add/Done/Wait 控制 |
| Channel | Go Runtime | Goroutine 间的通信管道，分为无缓冲（同步）和有缓冲（异步）两种 |
| Context | `context.Context` | 跨 Goroutine 传递取消信号、超时和请求级数据的标准机制 |
| Gosched | `runtime.Gosched()` | 主动让出当前 P 的执行权，让其他 G 有机会运行 |
| pprof | `runtime/pprof` | Go 内置的性能分析工具，支持 CPU、内存、Goroutine 等多种 profile |

</details>
