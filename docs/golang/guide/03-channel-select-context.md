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

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:620px;width:100%;">
<svg viewBox="0 0 620 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="310" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">无缓冲 vs 有缓冲 Channel</text>
  <!-- Unbuffered (left) -->
  <rect x="10" y="34" width="280" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="150" y="54" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">无缓冲 · 同步</text>
  <rect x="30" y="68" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="70" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sender</text>
  <rect x="190" y="68" width="80" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
  <text x="230" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Receiver</text>
  <line x1="110" y1="78" x2="188" y2="78" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#aCH1)"/>
  <text x="150" y="72" text-anchor="middle" font-size="8" fill="var(--d-orange)">data</text>
  <line x1="188" y1="92" x2="110" y2="92" stroke="var(--d-rv-a-border)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#aCH1g)"/>
  <text x="150" y="108" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">同步确认</text>
  <line x1="70" y1="118" x2="70" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <line x1="230" y1="118" x2="230" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
  <rect x="38" y="126" width="64" height="18" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8"/>
  <text x="70" y="139" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">send 阻塞…</text>
  <rect x="198" y="148" width="64" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
  <text x="230" y="161" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">recv 就绪</text>
  <line x1="102" y1="158" x2="196" y2="158" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#aCH1gr)"/>
  <text x="150" y="176" text-anchor="middle" font-size="8" fill="var(--d-green)">双方同时就绪才完成</text>
  <!-- Buffered (right) -->
  <rect x="320" y="34" width="290" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="465" y="54" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">有缓冲 · 异步</text>
  <rect x="336" y="68" width="68" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="370" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sender</text>
  <rect x="422" y="64" width="90" height="38" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="467" y="78" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-blue)">buf</text>
  <rect x="428" y="86" width="22" height="12" rx="2" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8"/>
  <text x="439" y="96" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">d1</text>
  <rect x="452" y="86" width="22" height="12" rx="2" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8"/>
  <text x="463" y="96" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">d2</text>
  <rect x="476" y="86" width="22" height="12" rx="2" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
  <text x="487" y="96" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">—</text>
  <rect x="530" y="68" width="68" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
  <text x="564" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Receiver</text>
  <line x1="404" y1="83" x2="420" y2="83" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCH1)"/>
  <line x1="512" y1="83" x2="528" y2="83" stroke="var(--d-rv-a-border)" stroke-width="1.5" marker-end="url(#aCH1g)"/>
  <line x1="370" y1="118" x2="370" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <line x1="564" y1="118" x2="564" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
  <rect x="338" y="124" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
  <text x="370" y="136" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">send d1 ✓</text>
  <rect x="338" y="142" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
  <text x="370" y="154" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">send d2 ✓</text>
  <rect x="338" y="160" width="64" height="16" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8"/>
  <text x="370" y="172" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">send d3 阻塞</text>
  <rect x="532" y="152" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
  <text x="564" y="164" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">recv d1</text>
  <text x="465" y="198" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">buf 未满时发送不阻塞</text>
  <defs>
    <marker id="aCH1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
    <marker id="aCH1g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)"/></marker>
    <marker id="aCH1gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/></marker>
  </defs>
</svg>
</div>
</div>

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

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:560px;width:100%;">
<svg viewBox="0 0 560 100" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Pipeline 流水线模式</text>
  <!-- generator -->
  <rect x="20" y="34" width="130" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="85" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">generator()</text>
  <text x="85" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">2, 3, 4, 5</text>
  <!-- ch1 arrow -->
  <line x1="150" y1="58" x2="200" y2="58" stroke="var(--d-blue-border)" stroke-width="2" marker-end="url(#aPL)"/>
  <text x="175" y="50" text-anchor="middle" font-size="8" fill="var(--d-blue)">ch1</text>
  <!-- square -->
  <rect x="205" y="34" width="130" height="48" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="270" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">square()</text>
  <text x="270" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">n × n</text>
  <!-- ch2 arrow -->
  <line x1="335" y1="58" x2="385" y2="58" stroke="var(--d-blue-border)" stroke-width="2" marker-end="url(#aPL)"/>
  <text x="360" y="50" text-anchor="middle" font-size="8" fill="var(--d-blue)">ch2</text>
  <!-- main print -->
  <rect x="390" y="34" width="150" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
  <text x="465" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">main Println</text>
  <text x="465" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">4, 9, 16, 25</text>
  <text x="280" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">每个阶段一个 goroutine，通过 Channel 连接</text>
  <defs>
    <marker id="aPL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/></marker>
  </defs>
</svg>
</div>
</div>

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

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:580px;width:100%;">
<svg viewBox="0 0 580 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="290" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Fan-out / Fan-in 模式</text>
  <!-- Source -->
  <rect x="20" y="62" width="90" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="65" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">数据源</text>
  <!-- Fan-out arrows -->
  <line x1="110" y1="72" x2="168" y2="52" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)"/>
  <line x1="110" y1="82" x2="168" y2="82" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)"/>
  <line x1="110" y1="92" x2="168" y2="112" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)"/>
  <text x="140" y="44" font-size="8" fill="var(--d-orange)">fan-out</text>
  <!-- Workers -->
  <rect x="172" y="34" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="217" y="54" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 1</text>
  <rect x="172" y="70" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="217" y="90" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 2</text>
  <rect x="172" y="106" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="217" y="126" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 3</text>
  <!-- Fan-in arrows -->
  <line x1="262" y1="49" x2="320" y2="72" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)"/>
  <line x1="262" y1="85" x2="320" y2="82" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)"/>
  <line x1="262" y1="121" x2="320" y2="92" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)"/>
  <text x="292" y="62" font-size="8" fill="var(--d-blue)">ch</text>
  <!-- Merge -->
  <rect x="324" y="58" width="110" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="379" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">Fan-in</text>
  <text x="379" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">合并 Channel</text>
  <!-- Consumer -->
  <line x1="434" y1="82" x2="464" y2="82" stroke="var(--d-rv-a-border)" stroke-width="1.5" marker-end="url(#aFOg)"/>
  <rect x="468" y="62" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
  <text x="513" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">消费者</text>
  <text x="290" y="165" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1 → N → 1：分发工作，合并结果</text>
  <defs>
    <marker id="aFO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
    <marker id="aFOb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/></marker>
    <marker id="aFOg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)"/></marker>
  </defs>
</svg>
</div>
</div>

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

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:500px;width:100%;">
<svg viewBox="0 0 500 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="250" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Context 取消传播树</text>
  <!-- Background -->
  <rect x="170" y="32" width="160" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="250" y="52" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">context.Background()</text>
  <line x1="250" y1="62" x2="250" y2="78" stroke="var(--d-text-sub)" stroke-width="1.2" marker-end="url(#aCTX)"/>
  <!-- WithTimeout 5s -->
  <rect x="155" y="80" width="190" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="250" y="96" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">WithTimeout · 5s</text>
  <text x="250" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">main</text>
  <!-- Arrow down -->
  <line x1="250" y1="114" x2="250" y2="130" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCTXo)"/>
  <text x="295" y="126" font-size="8" fill="var(--d-orange)">取消信号向下传播</text>
  <!-- WithTimeout 2s -->
  <rect x="155" y="132" width="190" height="34" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="250" y="148" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">WithTimeout · 2s</text>
  <text x="250" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">serviceA</text>
  <!-- Arrow down -->
  <line x1="250" y1="166" x2="250" y2="182" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCTXo)"/>
  <!-- serviceB -->
  <rect x="130" y="184" width="240" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="250" y="203" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">serviceB · 继承 2s 超时，3s 任务将被取消</text>
  <defs>
    <marker id="aCTX" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-sub)"/></marker>
    <marker id="aCTXo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
  </defs>
</svg>
</div>
</div>

### 讲解重点

- **必须调用 cancel**：`WithCancel`、`WithTimeout`、`WithDeadline` 返回的 `cancel` 函数必须调用（通常 `defer cancel()`），否则 Context 对应的资源不会被释放，会导致泄漏。
- **Context 树形传播**：父 Context 取消时，所有子 Context 自动取消；子 Context 取消不影响父 Context。
- **WithValue 的限制**：只适合传递请求级元数据（trace ID、auth token），不要传业务对象。key 应使用未导出的自定义类型，避免包间碰撞。
- **作为函数第一个参数**：按 Go 惯例，`ctx context.Context` 放在函数参数列表的第一位，不要放在 struct 里。

