# 并发编程

## 适合人群

- 已掌握 Go 基础语法，想系统理解并发模型的开发者
- 在项目中使用过 Goroutine 和 Channel，但对底层机制缺乏体感
- 准备能力自检、希望把并发知识串成体系的工程师

## 学习目标

- 理解 Goroutine 的创建、调度和生命周期管理
- 掌握 GMP 调度模型的核心流程
- 熟练运用 Channel、select、Context 完成常见并发模式
- 掌握 sync 包各同步原语的适用场景与注意事项
- 能够排查 Goroutine 泄漏和并发安全问题

## 快速导航

- [1. Goroutine 基础](#_1-goroutine-基础)
- [2. GMP 调度模型](#_2-gmp-调度模型)
- [3. Channel 使用场景与原理](#_3-channel-使用场景与原理)
- [4. select 机制](#_4-select-机制)
- [5. Context 的取消、超时、传递](#_5-context-的取消、超时、传递)
- [6. sync.Mutex / sync.RWMutex](#_6-sync-mutex-sync-rwmutex)
- [7. Atomic 原子操作](#_7-atomic-原子操作)
- [8. WaitGroup / Once / Cond / Pool](#_8-waitgroup-once-cond-pool)
- [9. sync.Map](#_9-sync-map)
- [10. Goroutine 泄漏与排查](#_10-goroutine-泄漏与排查)
- [11. 并发安全常见问题](#_11-并发安全常见问题)

---

## 1. Goroutine 基础

Goroutine 是 Go 并发的最小执行单元，由 Go runtime 管理，而非操作系统线程。

### 创建与生命周期

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

### Goroutine 的开销

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

### 讲解重点

- **栈起始大小**：每个 Goroutine 初始栈只有 2-8 KB（随版本有变化），远小于操作系统线程的 1-8 MB。栈可动态增长和收缩。
- **调度方式**：Goroutine 由 Go runtime 的用户态调度器管理，上下文切换不需要陷入内核，成本极低。
- **main 退出即终止**：`main` 函数结束时所有 Goroutine 被直接杀掉，不要依赖 `time.Sleep` 做同步，应使用 `sync.WaitGroup` 或 Channel。
- **何时使用**：I/O 等待（网络、磁盘）、并行计算、后台任务。不适合做纯 CPU 密集且无法分割的单一计算。

---

## 2. GMP 调度模型

Go 的调度器采用 GMP 模型，将大量 Goroutine 映射到少量操作系统线程上执行。

### 角色说明

```
┌─────────────────────────────────────────────────────────┐
│                      Go Scheduler                       │
│                                                         │
│  G (Goroutine)    待执行的任务单元                        │
│  M (Machine)      操作系统线程，真正执行代码               │
│  P (Processor)    逻辑处理器，持有本地队列和执行上下文       │
│                                                         │
│  默认 P 的数量 = runtime.GOMAXPROCS = CPU 核数            │
└─────────────────────────────────────────────────────────┘
```

### 调度流程图

```
                    ┌──────────────┐
                    │  Global Queue │  (全局队列，存放溢出的 G)
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
       │   P0    │    │   P1    │    │   P2    │
       │┌──────┐ │    │┌──────┐ │    │┌──────┐ │
       ││Local │ │    ││Local │ │    ││Local │ │
       ││Queue │ │    ││Queue │ │    ││Queue │ │
       │└──────┘ │    │└──────┘ │    │└──────┘ │
       └────┬────┘    └────┬────┘    └────┬────┘
            │              │              │
       ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
       │   M0    │    │   M1    │    │   M2    │
       │ (线程)  │    │ (线程)  │    │ (线程)  │
       └─────────┘    └─────────┘    └─────────┘
```

### 关键机制

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

### 讲解重点

- **Work Stealing（工作窃取）**：当某个 P 的本地队列为空时，它会尝试从其他 P 的本地队列偷取一半 G 来执行，避免 P 空闲。
- **Hand-off（交接）**：当 M 因系统调用阻塞时，它绑定的 P 会被交接给另一个空闲的 M（或创建新 M），保证 P 不闲置。
- **抢占式调度**：Go 1.14 起引入基于信号的抢占，即使 Goroutine 没有函数调用也能被抢占，避免单个 G 长期霸占 M。
- **本地队列 vs 全局队列**：新创建的 G 优先放入当前 P 的本地队列；本地队列满（256 个）时，一半会被转移到全局队列。调度器每隔一段时间也会检查全局队列，防止 G 饿死。

---

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

### 讲解重点

- **必须调用 cancel**：`WithCancel`、`WithTimeout`、`WithDeadline` 返回的 `cancel` 函数必须调用（通常 `defer cancel()`），否则 Context 对应的资源不会被释放，会导致泄漏。
- **Context 树形传播**：父 Context 取消时，所有子 Context 自动取消；子 Context 取消不影响父 Context。
- **WithValue 的限制**：只适合传递请求级元数据（trace ID、auth token），不要传业务对象。key 应使用未导出的自定义类型，避免包间碰撞。
- **作为函数第一个参数**：按 Go 惯例，`ctx context.Context` 放在函数参数列表的第一位，不要放在 struct 里。

---

## 6. sync.Mutex / sync.RWMutex

互斥锁用于保护共享资源的并发访问，是最基础的同步原语。

### Mutex 基本用法

```go
package main

import (
	"fmt"
	"sync"
)

type SafeCounter struct {
	mu sync.Mutex
	v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.v[key]++
}

func (c *SafeCounter) Value(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.v[key]
}

func main() {
	counter := SafeCounter{v: make(map[string]int)}
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Inc("key")
		}()
	}

	wg.Wait()
	fmt.Println("final count:", counter.Value("key")) // 1000
}
```

### RWMutex 读写锁

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Cache struct {
	mu   sync.RWMutex
	data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
	c.mu.RLock() // 读锁，多个读者可同时持有
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock() // 写锁，排斥所有读者和写者
	defer c.mu.Unlock()
	c.data[key] = value
}

func main() {
	cache := &Cache{data: make(map[string]string)}
	cache.Set("name", "Go")

	var wg sync.WaitGroup

	// 多个并发读
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			if val, ok := cache.Get("name"); ok {
				fmt.Printf("reader %d: %s\n", id, val)
			}
		}(i)
	}

	// 偶尔写
	wg.Add(1)
	go func() {
		defer wg.Done()
		time.Sleep(5 * time.Millisecond)
		cache.Set("name", "Golang")
		fmt.Println("writer: updated")
	}()

	wg.Wait()
}
```

### 讲解重点

- **Mutex vs RWMutex**：读多写少用 `RWMutex`，读写频率接近时 `RWMutex` 因内部开销反而可能更慢，直接用 `Mutex` 即可。
- **不要复制锁**：`sync.Mutex` 和 `sync.RWMutex` 不能被复制。包含锁的结构体应通过指针传递。可用 `go vet` 检查。
- **避免死锁**：不要在持有锁的情况下再去获取同一把锁（Go 的 Mutex 不可重入）；多把锁时统一加锁顺序。
- **defer Unlock**：建议用 `defer mu.Unlock()` 确保异常路径也能释放锁，但注意 defer 在函数返回时才执行，如果临界区很小，可以手动 Unlock 缩小锁范围。

---

## 7. Atomic 原子操作

`sync/atomic` 提供无锁的原子操作，适用于简单的计数器、标志位等场景，性能优于互斥锁。

### 基本原子操作

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	var counter int64

	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			atomic.AddInt64(&counter, 1) // 原子自增
		}()
	}
	wg.Wait()

	fmt.Println("counter:", atomic.LoadInt64(&counter)) // 1000
}
```

### CompareAndSwap (CAS)

```go
package main

import (
	"fmt"
	"sync/atomic"
)

func main() {
	var val int64 = 100

	// CAS：如果当前值是 100，就替换成 200
	swapped := atomic.CompareAndSwapInt64(&val, 100, 200)
	fmt.Println("swapped:", swapped, "val:", val) // true, 200

	// 当前值是 200 而不是 100，交换失败
	swapped = atomic.CompareAndSwapInt64(&val, 100, 300)
	fmt.Println("swapped:", swapped, "val:", val) // false, 200
}
```

### atomic.Value 存取任意类型

```go
package main

import (
	"fmt"
	"sync/atomic"
	"time"
)

type Config struct {
	Timeout  time.Duration
	MaxRetry int
}

func main() {
	var configStore atomic.Value

	// 初始配置
	configStore.Store(Config{
		Timeout:  5 * time.Second,
		MaxRetry: 3,
	})

	// 模拟热更新配置
	go func() {
		time.Sleep(100 * time.Millisecond)
		configStore.Store(Config{
			Timeout:  10 * time.Second,
			MaxRetry: 5,
		})
		fmt.Println("config updated")
	}()

	// 读取配置（无锁）
	cfg := configStore.Load().(Config)
	fmt.Printf("current config: timeout=%v, maxRetry=%d\n", cfg.Timeout, cfg.MaxRetry)

	time.Sleep(200 * time.Millisecond)
	cfg = configStore.Load().(Config)
	fmt.Printf("updated config: timeout=%v, maxRetry=%d\n", cfg.Timeout, cfg.MaxRetry)
}
```

### 讲解重点

- **适用场景**：计数器、标志位、配置热加载等简单共享状态。复杂逻辑（多个字段需一致性更新）仍应使用 Mutex。
- **CAS 的自旋**：CAS 可能因竞争失败，通常需要在循环中重试。高竞争场景下自旋会浪费 CPU，此时 Mutex 更合适。
- **atomic.Value 类型一致**：存入 `atomic.Value` 后，后续 Store 的值类型必须一致，否则 panic。
- **内存序**：Go 的 atomic 操作提供顺序一致性保证，能正确建立 happens-before 关系。

---

## 8. WaitGroup / Once / Cond / Pool

`sync` 包提供了多种同步原语，覆盖常见的并发协调场景。

### WaitGroup：等待一组 Goroutine 完成

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var wg sync.WaitGroup

	for i := 1; i <= 5; i++ {
		wg.Add(1) // 必须在 go 之前调用
		go func(id int) {
			defer wg.Done()
			time.Sleep(time.Duration(id) * 100 * time.Millisecond)
			fmt.Printf("task %d done\n", id)
		}(i)
	}

	wg.Wait() // 阻塞直到计数器归零
	fmt.Println("all tasks completed")
}
```

### Once：保证只执行一次

```go
package main

import (
	"fmt"
	"sync"
)

type Singleton struct {
	Name string
}

var (
	instance *Singleton
	once     sync.Once
)

func GetInstance() *Singleton {
	once.Do(func() {
		fmt.Println("initializing singleton...")
		instance = &Singleton{Name: "only-one"}
	})
	return instance
}

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s := GetInstance()
			fmt.Println("got:", s.Name)
		}()
	}
	wg.Wait()
	// "initializing singleton..." 只打印一次
}
```

### Cond：条件变量

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var mu sync.Mutex
	cond := sync.NewCond(&mu)

	ready := false

	// 等待方
	go func() {
		mu.Lock()
		for !ready { // 必须在循环中检查条件，防止虚假唤醒
			cond.Wait() // 释放锁 + 等待通知 + 重新获取锁
		}
		fmt.Println("consumer: condition met, proceeding")
		mu.Unlock()
	}()

	// 通知方
	time.Sleep(500 * time.Millisecond)
	mu.Lock()
	ready = true
	cond.Signal() // 唤醒一个等待者；Broadcast() 唤醒所有
	mu.Unlock()

	time.Sleep(100 * time.Millisecond)
}
```

### Pool：对象池复用

```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

func main() {
	pool := &sync.Pool{
		New: func() interface{} {
			fmt.Println("creating new buffer")
			return new(bytes.Buffer)
		},
	}

	// 获取 -> 使用 -> 归还
	buf := pool.Get().(*bytes.Buffer)
	buf.WriteString("hello pool")
	fmt.Println(buf.String())

	buf.Reset() // 归还前清理状态
	pool.Put(buf)

	// 再次获取，复用刚才归还的对象
	buf2 := pool.Get().(*bytes.Buffer)
	fmt.Println("reused buffer, len:", buf2.Len()) // 0，已 Reset
}
```

### 讲解重点

- **WaitGroup.Add 的时机**：`Add` 必须在启动 Goroutine 之前调用，否则 `Wait` 可能在 `Add` 之前返回。不要在 Goroutine 内部调用 `Add`。
- **Once 的 panic 语义**：如果 `once.Do(f)` 中的 `f` 发生 panic，`once` 仍然被标记为已执行，后续调用不会重试。Go 1.21+ 提供 `sync.OnceFunc` / `sync.OnceValue` 可以更优雅地处理。
- **Cond 不常用**：实际开发中 Channel 能覆盖绝大多数条件等待场景，`sync.Cond` 通常只在需要 `Broadcast` 唤醒多个等待者且不方便用 Channel 时使用。
- **Pool 的 GC 行为**：`sync.Pool` 中的对象可能在任意 GC 周期被回收，不要把它当缓存用。典型场景是高频分配的临时对象（如 `bytes.Buffer`、编解码器）。

---

## 9. sync.Map

`sync.Map` 是 Go 标准库提供的并发安全 Map，针对两种场景做了优化：key 写入一次后多次读取，以及多个 Goroutine 读写不相交的 key 集合。

### 基本用法

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var m sync.Map

	// Store 写入
	m.Store("name", "Go")
	m.Store("version", 21)

	// Load 读取
	if val, ok := m.Load("name"); ok {
		fmt.Println("name:", val)
	}

	// LoadOrStore 不存在就写入
	actual, loaded := m.LoadOrStore("name", "Rust")
	fmt.Println("actual:", actual, "loaded:", loaded) // Go, true（已存在）

	// Delete 删除
	m.Delete("version")

	// Range 遍历
	m.Store("lang", "Go")
	m.Store("year", 2009)
	m.Range(func(key, value interface{}) bool {
		fmt.Printf("  %v: %v\n", key, value)
		return true // 返回 false 停止遍历
	})
}
```

### 并发读写对比

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func benchSyncMap() time.Duration {
	var m sync.Map
	var wg sync.WaitGroup
	start := time.Now()

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				if j%10 == 0 {
					m.Store(id, j) // 10% 写
				} else {
					m.Load(id) // 90% 读
				}
			}
		}(i)
	}

	wg.Wait()
	return time.Since(start)
}

func benchMutexMap() time.Duration {
	mu := &sync.RWMutex{}
	data := make(map[int]int)
	var wg sync.WaitGroup
	start := time.Now()

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				if j%10 == 0 {
					mu.Lock()
					data[id] = j
					mu.Unlock()
				} else {
					mu.RLock()
					_ = data[id]
					mu.RUnlock()
				}
			}
		}(i)
	}

	wg.Wait()
	return time.Since(start)
}

func main() {
	fmt.Println("sync.Map:", benchSyncMap())
	fmt.Println("RWMutex+map:", benchMutexMap())
}
```

### 讲解重点

- **适用场景**：key 稳定（写少读多）或各 Goroutine 操作不同 key 集合。这两种场景下 `sync.Map` 内部的 read-only 快路径能避免加锁。
- **不适用场景**：key 频繁增删、写入比例高的场景。此时 `sync.Map` 的双 map（read/dirty）切换开销反而更大，不如 `RWMutex` + 普通 map。
- **类型安全**：`sync.Map` 的 key 和 value 都是 `interface{}`/`any`，没有泛型约束。如果需要类型安全，可以自己封装或使用第三方库。
- **无法获取长度**：`sync.Map` 没有 `Len()` 方法，只能通过 `Range` 遍历计数，这本身就说明它不适合需要频繁统计大小的场景。

---

## 10. Goroutine 泄漏与排查

Goroutine 泄漏是指启动的 Goroutine 无法退出、持续占用内存和调度资源，是 Go 服务中常见的生产问题。

### 常见泄漏原因

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

// 泄漏原因 1：向无人接收的 Channel 发送数据
func leakByBlockedSend() {
	ch := make(chan int)
	go func() {
		ch <- 42 // 永远阻塞，没有接收者
		fmt.Println("this line never executes")
	}()
	// 没有 <-ch，Goroutine 泄漏
}

// 泄漏原因 2：从无人发送的 Channel 接收数据
func leakByBlockedRecv() {
	ch := make(chan int)
	go func() {
		val := <-ch // 永远阻塞，没有发送者
		fmt.Println("received:", val)
	}()
	// 没有 ch <- xxx，也没有 close(ch)
}

// 泄漏原因 3：没有退出条件的无限循环
func leakByInfiniteLoop() {
	go func() {
		for {
			// 没有 return / break / select + done
			time.Sleep(time.Second)
		}
	}()
}

func main() {
	fmt.Println("before leaks:", runtime.NumGoroutine())

	leakByBlockedSend()
	leakByBlockedRecv()
	leakByInfiniteLoop()

	time.Sleep(100 * time.Millisecond)
	fmt.Println("after leaks:", runtime.NumGoroutine()) // 比 before 多了 3 个
}
```

### 正确的退出模式

```go
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func properWorker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("worker %d: exiting\n", id)
			return
		default:
			// 做实际工作
			time.Sleep(100 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	for i := 1; i <= 3; i++ {
		go properWorker(ctx, i)
	}

	time.Sleep(1 * time.Second)
	fmt.Println("goroutines:", runtime.NumGoroutine()) // 只剩 main
}
```

### 用 pprof 检测泄漏

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof" // 导入即注册 pprof 路由
	"time"
)

func leakyOperation() {
	ch := make(chan struct{})
	go func() {
		<-ch // 永远不会收到数据
	}()
	// 忘记 close(ch)
}

func main() {
	// 启动 pprof HTTP 服务
	go func() {
		fmt.Println("pprof at http://localhost:6060/debug/pprof/")
		http.ListenAndServe(":6060", nil)
	}()

	// 模拟每秒泄漏一个 Goroutine
	for i := 0; i < 100; i++ {
		leakyOperation()
		time.Sleep(100 * time.Millisecond)
	}

	// 保持进程运行，方便 pprof 抓取
	// 访问 http://localhost:6060/debug/pprof/goroutine?debug=1 查看所有 Goroutine 栈
	// 命令行: go tool pprof http://localhost:6060/debug/pprof/goroutine
	select {}
}
```

### 讲解重点

- **常见根因**：Channel 无对端读写、缺少退出信号（done Channel 或 Context）、锁竞争导致永久阻塞、忘记关闭 `net.Conn` / `http.Response.Body`。
- **检测手段**：`runtime.NumGoroutine()` 观察趋势；`net/http/pprof` 的 goroutine 端点查看完整栈帧；`go tool pprof` 分析 goroutine profile。
- **预防模式**：每个 Goroutine 都应有明确退出路径；使用 `context.Context` 传递取消信号；Channel 使用完毕及时关闭或配合 done Channel。
- **测试检测**：可以在测试中检查 `runtime.NumGoroutine()` 在测试前后是否一致，第三方库如 `goleak`（uber-go/goleak）提供了更便捷的泄漏检测。

---

## 11. 并发安全常见问题

数据竞争（data race）是并发编程中最常见也最危险的 bug 类型，Go 提供了内建工具和语言机制来帮助发现和避免这些问题。

### 数据竞争示例

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	counter := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter++ // 数据竞争！多个 Goroutine 同时读写
		}()
	}

	wg.Wait()
	fmt.Println("counter:", counter) // 结果不确定，可能 < 1000

	// 运行 go run -race main.go 可以检测到竞争
}
```

### Race Detector 使用

```go
package main

import (
	"fmt"
	"sync"
)

// 用 go run -race main.go 或 go test -race ./... 检测
// 编译: go build -race -o app main.go

func main() {
	// 修复方案 1: 使用 Mutex
	var mu sync.Mutex
	counter1 := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			counter1++
			mu.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println("mutex counter:", counter1)

	// 修复方案 2: 使用 Channel 汇总
	counter2 := 0
	ch := make(chan int, 1000)

	for i := 0; i < 1000; i++ {
		go func() {
			ch <- 1
		}()
	}

	for i := 0; i < 1000; i++ {
		counter2 += <-ch
	}
	fmt.Println("channel counter:", counter2)
}
```

### 循环中闭包捕获变量

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	// 错误写法：所有 Goroutine 共享变量 i
	fmt.Println("=== 错误写法 (Go < 1.22) ===")
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ") // 可能打印 5 5 5 5 5
		}()
	}
	wg.Wait()
	fmt.Println()

	// 正确写法 1：通过参数传值
	fmt.Println("=== 参数传值 ===")
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			fmt.Print(n, " ") // 0 1 2 3 4（顺序不定）
		}(i)
	}
	wg.Wait()
	fmt.Println()

	// 正确写法 2：局部变量拷贝
	fmt.Println("=== 局部变量拷贝 ===")
	for i := 0; i < 5; i++ {
		i := i // 创建新的局部变量
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ")
		}()
	}
	wg.Wait()
	fmt.Println()

	// 注意：Go 1.22+ 的 for 循环变量语义已改为每次迭代创建新变量
	// 但为了兼容性和可读性，显式传参仍是好习惯
}
```

### Map 并发读写 panic

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// 普通 map 并发读写会直接 panic（不是数据竞争，是 runtime 检测到后主动 panic）
	// 以下代码会触发: fatal error: concurrent map writes
	/*
		m := make(map[int]int)
		var wg sync.WaitGroup
		for i := 0; i < 100; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				m[n] = n // panic!
			}(i)
		}
		wg.Wait()
	*/

	// 方案 1: sync.RWMutex + map
	var mu sync.RWMutex
	safeMap := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			mu.Lock()
			safeMap[n] = n
			mu.Unlock()
		}(i)
	}
	wg.Wait()
	fmt.Println("safe map size:", len(safeMap))

	// 方案 2: sync.Map（见第 9 节）
	// 方案 3: Channel 序列化访问
}
```

### 讲解重点

- **Race Detector 必须用**：在开发和 CI 中始终开启 `-race` 标志。它通过在编译期插桩来检测运行时数据竞争，能发现大多数并发 bug。注意它有 2-10 倍的性能开销和更多内存使用，不要在生产环境开启。
- **Map 并发写是 fatal**：Go 的 map 并发写不是静默的数据竞争，而是 runtime 会检测到并直接 `fatal error`，进程无法 recover。
- **闭包捕获**：Go 1.22 之前，`for` 循环变量被闭包捕获是引用而非拷贝。Go 1.22 已修复此行为，但显式传参仍是好习惯。
- **Happens-before 规则**：Go 内存模型定义了严格的 happens-before 关系：Channel 发送 happens-before 对应接收完成；Mutex Unlock happens-before 下一次 Lock。不依赖这些规则的代码都可能存在数据竞争。
