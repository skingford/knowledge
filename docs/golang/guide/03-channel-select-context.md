---
title: Channel、select 与 Context
description: Go Channel 用法与原理、select 多路复用、Context 取消与超时传播机制详解。
search: false
---

# Channel、select 与 Context

## 3. Channel 使用场景与原理

Channel 是 Go 中 Goroutine 间通信的核心机制，遵循 CSP（Communicating Sequential Processes）模型。

### 基本用法：无缓冲与有缓冲

::: details 点击查看代码：无缓冲与有缓冲 Channel
```go
package main

import "fmt"

func main() {
	// 无缓冲 Channel —— 发送和接收必须同步
	unbuffered := make(chan int)
	go func() {
		unbuffered <- 42 // 阻塞直到有接收者
	}()
	val := <-unbuffered // 阻塞直到有发送者
	fmt.Println("unbuffered:", val)

	// 有缓冲 Channel —— 缓冲区满才阻塞
	buffered := make(chan string, 3)
	buffered <- "a"
	buffered <- "b"
	buffered <- "c"
	// buffered <- "d" // 会阻塞，因为缓冲区已满

	fmt.Println("buffered:", <-buffered, <-buffered, <-buffered)
}
```
:::

<GoChannelDiagram kind="buffered-vs-unbuffered" />

### 单向 Channel 与关闭

::: details 点击查看代码：单向 Channel 与关闭
```go
package main

import "fmt"

// 只写 Channel 作为参数
func produce(ch chan<- int, n int) {
	for i := 0; i < n; i++ {
		ch <- i
	}
	close(ch) // 生产者负责关闭
}

// 只读 Channel 作为参数
func consume(ch <-chan int) {
	// range 自动在 Channel 关闭时退出
	for v := range ch {
		fmt.Println("received:", v)
	}
}

func main() {
	ch := make(chan int, 5)
	go produce(ch, 5)
	consume(ch)
}
```
:::

<GoChannelDiagram kind="channel-close" />

### Pipeline 模式

如果说 GMP 是底层的车间和工人，那么 Pipeline 就是车间里的**流水线（传送带）**。将复杂任务拆分为多个独立阶段（Stage），每个阶段由一组 Goroutine 负责，阶段之间用 Channel（传送带）连接。

一个标准 Pipeline 包含三种角色：

| 角色 | 工厂比喻 | 职责 |
| --- | --- | --- |
| **Generator** | 供料区 | 生成初始数据，放到第一条传送带上 |
| **Processor** | 加工区 | 从上一条传送带拿数据，处理后放到下一条传送带（可以有多个） |
| **Sink** | 包装区 | 从最后一条传送带拿出成品，进行最终处理 |

::: details 点击查看代码：Pipeline 模式
```go
package main

import "fmt"

func generator(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out) // 发送完毕，关闭传送带（非常重要）
	}()
	return out
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out) // 加工完毕，关闭自己的传送带
	}()
	return out
}

func main() {
	// pipeline: generator -> square -> print
	ch := generator(2, 3, 4, 5)
	result := square(ch)

	for v := range result {
		fmt.Println(v) // 4, 9, 16, 25
	}
}
```
:::

<GoChannelDiagram kind="pipeline" />

#### Pipeline 的威力：解耦与流式处理

- **极低内存占用**：处理 10GB 日志文件不需要全部读入内存，数据一行行经过 Channel，内存里同时只有传送带上的那几个元素。
- **谁发送，谁关闭**：关闭 Channel 永远由发送方完成，接收方用 `for range` 优雅等待关闭并自动退出。这避免了向已关闭 Channel 发送导致 panic。
- **按需组装，高度复用**：想加一道"过滤奇数"的工序？写一个 `filter` 函数，像搭积木一样串联：`c3 := filter(square(generate(...)))`。

#### 防泄漏的流水线：context + select

上面的代码是"理想状态"。如果包装区（消费者）突然不再接收数据，但供料区还在往传送带扔东西——发送方的 Goroutine 会永远阻塞，导致 **Goroutine 泄漏**。

解决方案：在全厂安装**广播大喇叭**（`context`），配合 `select` 让每个阶段同时"干活"和"听广播"：

::: details 点击查看代码：防泄漏的流水线（context + select）
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func generate(ctx context.Context, nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out) // 无论正常结束还是被叫停，都关闭传送带
		for _, n := range nums {
			select {
			case out <- n:
			case <-ctx.Done(): // 监听大喇叭：紧急停止
				return
			}
		}
	}()
	return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			time.Sleep(100 * time.Millisecond) // 模拟加工耗时
			select {
			case out <- n * n:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	c1 := generate(ctx, 1, 2, 3, 4, 5, 6, 7)
	c2 := square(ctx, c1)

	count := 0
	for result := range c2 {
		fmt.Println("成品:", result)
		count++
		if count == 2 {
			cancel() // 只要 2 个成品，按下紧急停止按钮
			break
		}
	}

	time.Sleep(200 * time.Millisecond)
	fmt.Println("流水线安全停机")
}
```
:::

三个关键防御性技巧：

1. **`select` + `ctx.Done()`**：`cancel()` 调用后，`ctx.Done()` 这个 Channel 被关闭，所有 `case <-ctx.Done()` 瞬间触发，各 Goroutine 顺利 return 退出。
2. **必须 `defer close(out)`**：Goroutine 因收到停工广播而提前 return 时，没有 `defer` 就执行不到 `close`，下游会死等。
3. **谁创建 context，谁调用 cancel**：自上而下的优雅控制流。

### Fan-out / Fan-in 模式

::: details 点击查看代码：Fan-out / Fan-in 模式
```go
package main

import (
	"fmt"
	"sync"
)

func producer(id int, ch chan<- string) {
	for i := 0; i < 3; i++ {
		ch <- fmt.Sprintf("producer-%d: item-%d", id, i)
	}
}

// Fan-in: 多个 Channel 合并到一个
func fanIn(channels ...<-chan string) <-chan string {
	merged := make(chan string)
	var wg sync.WaitGroup

	for _, ch := range channels {
		wg.Add(1)
		go func(c <-chan string) {
			defer wg.Done()
			for v := range c {
				merged <- v
			}
		}(ch)
	}

	go func() {
		wg.Wait()
		close(merged)
	}()

	return merged
}

func main() {
	// Fan-out: 启动多个 producer
	ch1 := make(chan string, 3)
	ch2 := make(chan string, 3)

	go func() { producer(1, ch1); close(ch1) }()
	go func() { producer(2, ch2); close(ch2) }()

	// Fan-in: 合并结果
	for msg := range fanIn(ch1, ch2) {
		fmt.Println(msg)
	}
}
```
:::

<GoChannelDiagram kind="fan-in-out" />

### Channel 操作与状态矩阵

这张表是并发编程中最重要的参考之一，建议牢记：

| 操作 | nil Channel（未初始化） | 正常打开（Open） | 已关闭（Closed） |
| --- | --- | --- | --- |
| **读** `<-ch` | 永远阻塞 | 读到值 / 阻塞等待 | 读取剩余缓冲值；读完后返回零值和 `false` |
| **写** `ch <-` | 永远阻塞 | 写入值 / 阻塞等待 | **panic** |
| **关闭** `close(ch)` | **panic** | 关闭成功 | **panic** |

> 实践口诀：**读关闭得零值，写关闭必 panic，nil Channel 全阻塞**。

### 讲解重点

- **nil Channel**：向 nil Channel 发送或接收会永远阻塞；关闭 nil Channel 会 panic。利用这个特性可以在 select 中动态启停分支。
- **关闭原则**：只有发送方应该关闭 Channel；多个发送方场景下不要直接关闭 Channel，应使用 `sync.Once` 或额外的 done Channel 来协调。
- **底层结构**：Channel 内部是一个名为 `hchan` 的结构体，包含带锁的环形缓冲区 + 两个等待队列（sendq / recvq），发送和接收都需要加锁。
- **容量选择**：无缓冲适合严格同步；有缓冲适合解耦生产和消费速度差异。缓冲区大小应根据实际吞吐和延迟需求设定，不要随意开大。
- **`for range` 读取**：可以持续从 channel 中读取数据，直到 channel 被关闭并且缓冲区为空，循环自动结束。


---

## 4. select 机制

`select` 让一个 Goroutine 同时监听多个 Channel 操作，哪个 Channel 就绪就执行哪个分支。

### 基本用法与随机选择

::: details 点击查看代码：基本用法与随机选择
```go
package main

import (
	"fmt"
	"time"
)

func main() {
	ch1 := make(chan string, 1)
	ch2 := make(chan string, 1)

	ch1 <- "one"
	ch2 <- "two"

	// 多个 case 同时就绪时，Go 随机选一个
	select {
	case msg := <-ch1:
		fmt.Println("received from ch1:", msg)
	case msg := <-ch2:
		fmt.Println("received from ch2:", msg)
	}
}
```
:::

### default 实现非阻塞收发

::: details 点击查看代码：default 实现非阻塞收发
```go
package main

import "fmt"

func main() {
	ch := make(chan int, 1)

	// 非阻塞发送
	select {
	case ch <- 42:
		fmt.Println("sent 42")
	default:
		fmt.Println("channel full, skip")
	}

	// 非阻塞接收
	select {
	case val := <-ch:
		fmt.Println("received:", val)
	default:
		fmt.Println("no data available")
	}
}
```
:::

<GoChannelDiagram kind="select-flow" />

### 超时控制

::: details 点击查看代码：超时控制
```go
package main

import (
	"fmt"
	"time"
)

func longRunningTask(ch chan<- string) {
	time.Sleep(3 * time.Second) // 模拟耗时操作
	ch <- "task done"
}

func main() {
	result := make(chan string, 1)
	go longRunningTask(result)

	select {
	case msg := <-result:
		fmt.Println(msg)
	case <-time.After(1 * time.Second):
		fmt.Println("timeout: task took too long")
	}
}
```
:::

### 用 select 实现心跳与退出

::: details 点击查看代码：用 select 实现心跳与退出
```go
package main

import (
	"fmt"
	"time"
)

func worker(done <-chan struct{}) {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-done:
			fmt.Println("worker: received quit signal")
			return
		case t := <-ticker.C:
			fmt.Println("worker: heartbeat at", t.Format("15:04:05.000"))
		}
	}
}

func main() {
	done := make(chan struct{})

	go worker(done)

	time.Sleep(2 * time.Second)
	close(done) // 通知退出
	time.Sleep(100 * time.Millisecond)
	fmt.Println("main: done")
}
```
:::

### 讲解重点

- **随机性**：当多个 case 同时就绪时，`select` 会伪随机选一个执行，这是为了避免饥饿，不是按顺序。
- **空 select**：`select {}` 永远阻塞，常用在 main 中保持进程不退出。
- **time.After 的陷阱**：在循环内使用 `time.After` 每次都会创建新 Timer，可能导致内存泄漏。循环场景应使用 `time.NewTimer` 或 `time.NewTicker`。
- **nil Channel 的妙用**：将一个 Channel 变量设为 nil 可以在 select 中"关闭"该分支，因为 nil Channel 的 case 永远不会被选中。


---

## 5. Context 的取消、超时、传递

`context.Context` 是 Go 中用于跨 Goroutine 传递取消信号、超时控制和请求级数据的标准机制。

### WithCancel

::: details 点击查看代码：WithCancel
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func worker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("worker %d: stopped, reason: %v\n", id, ctx.Err())
			return
		default:
			fmt.Printf("worker %d: working...\n", id)
			time.Sleep(300 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithCancel(context.Background())

	for i := 1; i <= 3; i++ {
		go worker(ctx, i)
	}

	time.Sleep(1 * time.Second)
	cancel() // 一次 cancel 通知所有子 Goroutine

	time.Sleep(200 * time.Millisecond)
	fmt.Println("all workers stopped")
}
```
:::

### WithTimeout / WithDeadline

::: details 点击查看代码：WithTimeout / WithDeadline
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func fetchData(ctx context.Context) (string, error) {
	select {
	case <-time.After(2 * time.Second): // 模拟慢请求
		return "data", nil
	case <-ctx.Done():
		return "", ctx.Err()
	}
}

func main() {
	// WithTimeout: 相对时间
	ctx1, cancel1 := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel1()

	result, err := fetchData(ctx1)
	if err != nil {
		fmt.Println("timeout:", err)
	} else {
		fmt.Println("got:", result)
	}

	// WithDeadline: 绝对时间
	deadline := time.Now().Add(3 * time.Second)
	ctx2, cancel2 := context.WithDeadline(context.Background(), deadline)
	defer cancel2()

	result, err = fetchData(ctx2)
	if err != nil {
		fmt.Println("deadline exceeded:", err)
	} else {
		fmt.Println("got:", result)
	}
}
```
:::

### WithValue 传递请求级数据

::: details 点击查看代码：WithValue 传递请求级数据
```go
package main

import (
	"context"
	"fmt"
)

// 使用自定义类型作为 key，避免碰撞
type contextKey string

const (
	keyRequestID contextKey = "request_id"
	keyUserID    contextKey = "user_id"
)

func handleRequest(ctx context.Context) {
	reqID := ctx.Value(keyRequestID)
	userID := ctx.Value(keyUserID)
	fmt.Printf("handling request: reqID=%v, userID=%v\n", reqID, userID)
}

func main() {
	ctx := context.Background()
	ctx = context.WithValue(ctx, keyRequestID, "req-abc-123")
	ctx = context.WithValue(ctx, keyUserID, 42)

	handleRequest(ctx)
}
```
:::

### Context 传播链

::: details 点击查看代码：Context 传播链
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func serviceA(ctx context.Context) {
	// 继承父 Context 的超时，同时可以加更短的超时
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	fmt.Println("serviceA: calling serviceB")
	serviceB(ctx)
}

func serviceB(ctx context.Context) {
	select {
	case <-time.After(3 * time.Second):
		fmt.Println("serviceB: completed")
	case <-ctx.Done():
		fmt.Println("serviceB: cancelled:", ctx.Err())
	}
}

func main() {
	// 父级设置 5 秒超时
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	serviceA(ctx) // serviceA 内部设置了 2 秒超时，所以 serviceB 会在 2 秒后被取消
}
```
:::

<GoChannelDiagram kind="context-tree" />

### 讲解重点

- **必须调用 cancel**：`WithCancel`、`WithTimeout`、`WithDeadline` 返回的 `cancel` 函数必须调用（通常 `defer cancel()`），否则 Context 对应的资源不会被释放，会导致泄漏。
- **Context 树形传播**：父 Context 取消时，所有子 Context 自动取消；子 Context 取消不影响父 Context。
- **WithValue 的限制**：只适合传递请求级元数据（trace ID、auth token），不要传业务对象。key 应使用未导出的自定义类型，避免包间碰撞。
- **作为函数第一个参数**：按 Go 惯例，`ctx context.Context` 放在函数参数列表的第一位，不要放在 struct 里。

### Context 源码级剖析：级联取消是如何实现的

#### 核心接口

::: details 点击查看代码：核心接口
```go
type Context interface {
    Deadline() (deadline time.Time, ok bool) // 是否有截止时间
    Done() <-chan struct{}                   // 广播大喇叭，被取消时关闭
    Err() error                             // 取消原因
    Value(key any) any                      // 请求域的值
}
```
:::

#### 树根：emptyCtx

`context.Background()` 和 `context.TODO()` 底层都返回 `emptyCtx`——一个空壳子，永远不会被取消、没有值、没有 deadline。它存在的唯一意义是作为整棵 Context 多叉树的**根节点**。

#### 广播中枢：cancelCtx 的内部构造

`context.WithCancel(parent)` 底层会把 parent 包装进一个 `cancelCtx`：

::: details 点击查看代码：cancelCtx 的内部构造
```go
type cancelCtx struct {
    Context                          // 匿名字段，保存父节点指针（向上查找）
    mu       sync.Mutex              // 保护以下字段
    done     atomic.Value            // 存放 chan struct{}，即广播大喇叭
    children map[canceler]struct{}   // 所有子节点的指针（向下广播）
    err      error                   // 取消原因
}
```
:::

双向关联的秘密：
- **向上查找**：通过内嵌的 `Context` 字段，子节点知道父亲是谁
- **向下广播**：通过 `children` map，父节点攥着所有直接子节点的名单

#### 挂载子节点：propagateCancel

基于 Parent 创建 Child 时，底层调用 `propagateCancel(parent, child)` 把子节点的命运与父节点绑定：

1. 如果父节点是 `emptyCtx`（永远不会取消），什么都不做
2. 如果父节点**已经被取消**，立刻当场取消 child
3. 如果父节点还活着，把 child 塞进父节点的 `children` map——像新车间去总部花名册上登记

#### 扣动扳机：cancel() 的死亡递归

调用 `cancel()` 时，底层执行的步骤：

1. **加锁与状态检查**：检查 `err` 字段，如果不为空说明已被取消过，直接返回（保证幂等性）
2. **关闭大喇叭**：对底层的 `done` channel 执行 `close()`。Go 的 Channel 一旦被 close，**所有阻塞在 `<-ctx.Done()` 的 Goroutine 瞬间收到零值并被唤醒**——这就是"广播"的物理实现
3. **级联取消子节点**：遍历 `children` map，**递归调用**每个子节点的 `cancel()`。子节点又去调用孙子节点……瞬间一撸到底，整条树枝寸草不生
4. **清理门户**：将 `children` 设为 nil 帮助 GC，从父节点的 `children` map 中抹除自己

#### valueCtx 的 O(N) 陷阱

`context.WithValue(parent, key, val)` 底层生成 `valueCtx`：

::: details 点击查看代码：valueCtx 的 O(N) 陷阱
```go
type valueCtx struct {
    Context      // 指向父节点
    key, val any // 注意：没有 map！只存一对 Key-Value
}
```
:::

连续存 10 个值后会形成**单向链表**：`ctx10 → ctx9 → … → ctx1 → Background`。

调用 `ctx10.Value(key)` 时，从当前节点一层层往上找，直到匹配或撞到 Background 返回 nil——**时间复杂度 O(N)**。

> **正确用法**：只传递跨 API 边界的核心链路数据（TraceID、鉴权 Token）。**绝对不要**把 Context 当全局 Map 传递业务参数、连接池或配置对象。

#### Context 源码的设计哲学

- 利用 Channel 的 **close 特性**实现无锁广播
- 利用 **Mutex** 保护内部树形结构的并发安全
- 利用**嵌套接口**实现多态和递归级联
