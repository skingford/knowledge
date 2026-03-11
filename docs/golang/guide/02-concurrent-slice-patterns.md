---
search: false
---

# 切片并发陷阱：Append、锁、Channel 与工程化取舍

这一页专门讲切片并发写为什么危险，以及工程里常见的三类解法：预分配按索引写、锁保护共享切片、Monitor Goroutine + Channel 串行化。

## 本页内容

- [1. 为什么并发 append 不安全](#_1-为什么并发-append-不安全)
- [2. 怎么验证并发切片问题](#_2-怎么验证并发切片问题)
- [3. 更稳妥的收集结果模式](#_3-更稳妥的收集结果模式)
- [4. 工业级并发安全切片：RWMutex 方案](#_4-工业级并发安全切片rwmutex-方案)
- [5. Monitor Goroutine：Channel 串行化方案](#_5-monitor-goroutinechannel-串行化方案)
- [6. Mutex 和 Channel 怎么选](#_6-mutex-和-channel-怎么选)
- [7. 生产环境里的 Channel 管理器还要考虑什么](#_7-生产环境里的-channel-管理器还要考虑什么)

---

## 1. 为什么并发 `append` 不安全

切片在运行时可以理解为这样一个结构：

```go
type slice struct {
	array unsafe.Pointer
	len   int
	cap   int
}
```

当你执行 `append(s, x)` 时，运行时可能会做这些事：

1. 读取当前 `len` 和 `cap`
2. 判断是否需要扩容
3. 把新元素写到目标位置
4. 更新 `len`
5. 如果扩容了，还要更新底层数组指针

这些操作不是一个原子动作，所以切片本身不是并发安全的。

典型反例：

```go
package main

var s = make([]int, 0, 10)

func main() {
	go func() { s = append(s, 1) }()
	go func() { s = append(s, 2) }()
}
```

可能出现的后果：

- 数据丢失或互相覆盖
- 扩容后写入落到旧数组，结果后来完全不可见
- 在更复杂的代码里触发 data race，甚至出现越界相关 panic

---

## 2. 怎么验证并发切片问题

最直接的是 race detector：

```bash
go test -race ./...
```

或者：

```bash
go run -race main.go
```

如果多个 goroutine 并发读写同一个切片 header 或底层数组，而没有同步保护，race detector 通常会报出来。

### 一个常见误区：并发写不同索引就一定安全吗？

要分情况看：

1. 如果切片长度已经固定，不做 `append`，每个 goroutine 只写自己独占的索引区间
这在设计正确、没有索引冲突的前提下可以是安全的。

```go
result := make([]int, 100)
for i := 0; i < 100; i++ {
	go func(i int) {
		result[i] = i * 2
	}(i)
}
```

2. 如果 goroutine 里做的是 `append`
那就默认视为不安全，因为它可能改 `len/cap`、可能扩容、可能换底层数组。

---

## 3. 更稳妥的收集结果模式

### 预分配结果切片，按索引写入

适合任务数固定、每个 goroutine 都知道自己写哪一格的场景。

```go
results := make([]int, n)
for i := 0; i < n; i++ {
	go func(i int) {
		results[i] = work(i)
	}(i)
}
```

### Channel 汇总

适合结果数量动态、由单独 goroutine 串行收集的场景。

```go
ch := make(chan int, n)
go func() {
	for v := range ch {
		results = append(results, v)
	}
}()
```

### 加锁保护共享切片

适合必须共享同一个切片对象、又不想改整体结构的场景。

工程上优先级通常是：

- 能按索引写，就按索引写
- 需要聚合流式结果，就用 Channel
- 改造成本太高，再用锁保护共享切片

---

## 4. 工业级并发安全切片：`RWMutex` 方案

如果业务里确实需要长期维护一个可并发访问的共享切片，通常会把切片封装进一个类型里，对外只暴露受控方法。

```go
package main

import (
	"fmt"
	"sync"
)

type SafeSlice struct {
	mu    sync.RWMutex
	items []int
}

func NewSafeSlice(capacity int) *SafeSlice {
	return &SafeSlice{
		items: make([]int, 0, capacity),
	}
}

func (s *SafeSlice) Append(item int) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.items = append(s.items, item)
}

func (s *SafeSlice) Len() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.items)
}

func (s *SafeSlice) GetAll() []int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	snapshot := make([]int, len(s.items))
	copy(snapshot, s.items)
	return snapshot
}

func main() {
	safeList := NewSafeSlice(1000)
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(val int) {
			defer wg.Done()
			safeList.Append(val)
		}(i)
	}

	wg.Wait()
	fmt.Printf("最终切片长度: %d\n", safeList.Len())
}
```

为什么这段代码更接近工业级：

- 字段私有化，避免别人绕过锁
- `RWMutex` 更适合读多写少
- `GetAll()` 做防御性拷贝，返回快照而不是内部切片本体

---

## 5. Monitor Goroutine：Channel 串行化方案

Go 并发编程里有一句经典的话：

> Don't communicate by sharing memory; share memory by communicating.

也就是：不要通过共享内存来通信，而应通过通信来共享内存。

Channel 方案的思路是：把切片的所有权交给唯一一个 goroutine，其他 goroutine 不能直接碰它，只能通过消息让它代办。

```go
package main

import (
	"fmt"
	"sync"
)

type ChannelSlice struct {
	addCh  chan int
	getCh  chan chan []int
	quitCh chan struct{}
}

func NewChannelSlice() *ChannelSlice {
	cs := &ChannelSlice{
		addCh:  make(chan int),
		getCh:  make(chan chan []int),
		quitCh: make(chan struct{}),
	}
	go cs.managerLoop()
	return cs
}

func (cs *ChannelSlice) managerLoop() {
	var items []int

	for {
		select {
		case item := <-cs.addCh:
			items = append(items, item)
		case respCh := <-cs.getCh:
			snapshot := make([]int, len(items))
			copy(snapshot, items)
			respCh <- snapshot
		case <-cs.quitCh:
			return
		}
	}
}

func (cs *ChannelSlice) Append(item int) {
	cs.addCh <- item
}

func (cs *ChannelSlice) GetAll() []int {
	respCh := make(chan []int)
	cs.getCh <- respCh
	return <-respCh
}

func (cs *ChannelSlice) Stop() {
	close(cs.quitCh)
}

func main() {
	cs := NewChannelSlice()
	defer cs.Stop()

	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func(val int) {
			defer wg.Done()
			cs.Append(val)
		}(i)
	}

	wg.Wait()
	result := cs.GetAll()
	fmt.Printf("最终切片长度: %d\n", len(result))
}
```

这个方案的关键点：

- `items` 是 `managerLoop` 内部局部变量
- 其他 goroutine 根本拿不到它的引用
- 所有读写都必须通过 Channel 请求 manager goroutine 代办

`chan chan []int` 是 Go 里非常常见的 request-response 模式：调用方先创建一个回信通道，再把这个通道发给后台 goroutine，让它通过这个通道把结果发回来。

注意：即使是 Channel 方案，读取时依然要快照拷贝，不能直接把内部切片暴露出去。

---

## 6. Mutex 和 Channel 怎么选

### 更偏向选 `sync.Mutex` / `sync.RWMutex` 的场景

- 只是单纯保护一个内存数据结构
- 操作很短，只是 `append`、读长度、取值这类本地内存读写
- 追求更低的实现成本和更高的吞吐

### 更偏向选 Channel 的场景

- 你要处理的是数据流，而不只是保护一块内存
- 需要组合多个事件源、`select`、超时、取消信号
- 需要一个后台 goroutine 维护状态机或串行业务逻辑

换句话说：

- 保护状态，用锁
- 传递数据流、协调事件，用 Channel

如果只是给一个切片并发加 `append`，工程里大多数时候还是先选 `Mutex`。如果你已经进入了后台 manager goroutine、请求响应、超时取消、多类事件协作的模型，那 Channel 方案就会更自然。

---

## 7. 生产环境里的 Channel 管理器还要考虑什么

### 优雅关闭

生产里要考虑：

- `Stop()` 被重复调用怎么办
- `Stop()` 之后还继续 `Append()` 会怎样
- manager goroutine 退出前，是否要把已收到的请求处理完

更稳妥的做法通常包括：

- 用 `sync.Once` 确保关闭逻辑只执行一次
- 用额外状态位或 `context.Context` 阻止关闭后的继续写入
- 明确约定 `Stop()` 是立刻停机还是处理完队列后再停

### 背压（Backpressure）

无缓冲 channel 会让调用方阻塞直到 manager goroutine 真正取走消息；有缓冲 channel 则能平滑短时突发流量，但你要明确：

- 缓冲区多大合适
- 满了之后是阻塞、丢弃、报错，还是降级

### 超时与取消

`GetAll()` 这类 request-response 模式，真实项目里最好带 `context.Context`，避免调用方永远挂死。

```go
func (cs *ChannelSlice) GetAll(ctx context.Context) ([]int, error) {
	respCh := make(chan []int, 1)

	select {
	case cs.getCh <- respCh:
	case <-ctx.Done():
		return nil, ctx.Err()
	}

	select {
	case snapshot := <-respCh:
		return snapshot, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
```

### 把请求建模成结构体

当操作越来越多时，比起散落多个 channel，更常见的工业写法是统一成命令消息或请求结构体，让 manager goroutine 更像一个小型状态机。

### 最大风险是复杂度失控

Channel 方案很强，但它不是“默认比锁高级”。它更适合有明确状态所有权、需要事件驱动处理、值得为此承担额外模型复杂度的场景。
