---
title: Channel、select 与 Context
description: Go Channel 用法与原理、select 多路复用、Context 取消与超时传播机制详解。
search: false
---

# Channel、select 与 Context

## 3. Channel 使用场景与原理

Channel 是 Go 中 Goroutine 间通信的核心机制，遵循 CSP（Communicating Sequential Processes）模型。

### 基本用法：无缓冲与有缓冲

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

<GoChannelDiagram kind="buffered-vs-unbuffered" />

### 单向 Channel 与关闭

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

### Pipeline 模式

```go
package main

import "fmt"

func generator(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		for _, n := range nums {
			out <- n
		}
		close(out)
	}()
	return out
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for n := range in {
			out <- n * n
		}
		close(out)
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

<GoChannelDiagram kind="pipeline" />

### Fan-out / Fan-in 模式

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

<GoChannelDiagram kind="fan-in-out" />

### 讲解重点

- **nil Channel**：向 nil Channel 发送或接收会永远阻塞；关闭 nil Channel 会 panic。利用这个特性可以在 select 中动态启停分支。
- **关闭原则**：只有发送方应该关闭 Channel；多个发送方场景下不要直接关闭 Channel，应使用 `sync.Once` 或额外的 done Channel 来协调。
- **底层结构**：Channel 内部是一个带锁的环形缓冲区 + 两个等待队列（sendq / recvq），发送和接收都需要加锁。
- **容量选择**：无缓冲适合严格同步；有缓冲适合解耦生产和消费速度差异。缓冲区大小应根据实际吞吐和延迟需求设定，不要随意开大。


---

## 4. select 机制

`select` 让一个 Goroutine 同时监听多个 Channel 操作，哪个 Channel 就绪就执行哪个分支。

### 基本用法与随机选择

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

### default 实现非阻塞收发

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

### 超时控制

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

### 用 select 实现心跳与退出

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

### 讲解重点

- **随机性**：当多个 case 同时就绪时，`select` 会伪随机选一个执行，这是为了避免饥饿，不是按顺序。
- **空 select**：`select {}` 永远阻塞，常用在 main 中保持进程不退出。
- **time.After 的陷阱**：在循环内使用 `time.After` 每次都会创建新 Timer，可能导致内存泄漏。循环场景应使用 `time.NewTimer` 或 `time.NewTicker`。
- **nil Channel 的妙用**：将一个 Channel 变量设为 nil 可以在 select 中"关闭"该分支，因为 nil Channel 的 case 永远不会被选中。


---

## 5. Context 的取消、超时、传递

`context.Context` 是 Go 中用于跨 Goroutine 传递取消信号、超时控制和请求级数据的标准机制。

### WithCancel

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

### WithTimeout / WithDeadline

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

### WithValue 传递请求级数据

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

### Context 传播链

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

<GoChannelDiagram kind="context-tree" />

### 讲解重点

- **必须调用 cancel**：`WithCancel`、`WithTimeout`、`WithDeadline` 返回的 `cancel` 函数必须调用（通常 `defer cancel()`），否则 Context 对应的资源不会被释放，会导致泄漏。
- **Context 树形传播**：父 Context 取消时，所有子 Context 自动取消；子 Context 取消不影响父 Context。
- **WithValue 的限制**：只适合传递请求级元数据（trace ID、auth token），不要传业务对象。key 应使用未导出的自定义类型，避免包间碰撞。
- **作为函数第一个参数**：按 Go 惯例，`ctx context.Context` 放在函数参数列表的第一位，不要放在 struct 里。

