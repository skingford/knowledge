---
title: 源码与 Runtime
description: Go runtime 与源码阅读专题，聚焦调度、GC、Channel、内存分配与底层实现理解。
search: false
---

# 源码与 Runtime

## 适合人群

- 已经熟悉 Go 并发、内存模型，想深入阅读 runtime 源码的工程师
- 需要排查调度、GC、Channel 等底层问题的后端开发
- 准备 Go 高级能力自检，需要理解核心数据结构和执行流程

## 学习目标

- 掌握 runtime 包常用函数的用途和使用场景
- 能读懂 Goroutine 调度、Channel、Map 等核心源码的关键路径
- 理解 sync 包、net/http、Context、GC 的实现原理
- 建立从源码角度定位问题的能力

## 快速导航

- [1. runtime 包核心机制](#_1-runtime-包核心机制)
- [2. Goroutine 调度源码](#_2-goroutine-调度源码)
- [3. Channel 源码](#_3-channel-源码)
- [4. Map 源码](#_4-map-源码)
- [5. sync 包源码](#_5-sync-包源码)
- [6. net/http 源码](#_6-net-http-源码)
- [7. Context 源码](#_7-context-源码)
- [8. GC 相关源码入口](#_8-gc-相关源码入口)

---

## 1. runtime 包核心机制

runtime 包是 Go 运行时的公开接口，提供了对调度器、GC、栈等底层机制的有限控制和观测能力。

### 常用函数

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	// 设置最大可用 CPU 数（P 的数量）
	prev := runtime.GOMAXPROCS(4)
	fmt.Println("之前的 GOMAXPROCS:", prev)
	fmt.Println("当前 GOMAXPROCS:", runtime.GOMAXPROCS(0)) // 传 0 只读不改

	// 当前活跃的 Goroutine 数量
	fmt.Println("Goroutine 数量:", runtime.NumGoroutine())

	// 主动让出当前 Goroutine 的执行权
	runtime.Gosched()

	// 主动触发一次 GC
	runtime.GC()

	// 获取当前 Goroutine 的调用栈
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false) // false=仅当前 goroutine, true=所有
	fmt.Println("当前栈信息:\n", string(buf[:n]))
}
```

### 运行时信息采集

```go
package main

import (
	"fmt"
	"runtime"
)

func main() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	fmt.Printf("Alloc = %d KB\n", m.Alloc/1024)
	fmt.Printf("TotalAlloc = %d KB\n", m.TotalAlloc/1024)
	fmt.Printf("Sys = %d KB\n", m.Sys/1024)
	fmt.Printf("NumGC = %d\n", m.NumGC)
	fmt.Printf("GCCPUFraction = %.4f\n", m.GCCPUFraction)

	// NumCPU 返回逻辑 CPU 数量
	fmt.Println("NumCPU:", runtime.NumCPU())
	fmt.Println("GOROOT:", runtime.GOROOT())
	fmt.Println("Version:", runtime.Version())
}
```

### 讲解重点

- **GOMAXPROCS 的作用范围**：它控制的是 P（Processor）的数量，不是线程数。Go 1.5 起默认值等于 `runtime.NumCPU()`，大多数场景不需要手动设置。
- **runtime.Stack 的排障价值**：在线上服务中，可以通过 `runtime.Stack(buf, true)` 导出所有 Goroutine 的栈信息，是排查 Goroutine 泄漏和死锁的关键手段。
- **MemStats 的采集成本**：`ReadMemStats` 会触发 STW（Stop-The-World），在高频调用场景要注意性能影响，建议通过 pprof 或 metrics 系统定期采集而非在热路径调用。

---

## 2. Goroutine 调度源码

调度器的核心代码在 `runtime/proc.go`，理解调度需要先理解 G-M-P 模型和 G 的状态机。

### G 的状态转换

```
Gidle → Grunnable → Grunning → Gwaiting → Grunnable → Grunning → Gdead
         ↑                        ↓
         ←───── goready ──────────┘
```

主要状态：

| 状态 | 含义 |
|------|------|
| `_Gidle` | 刚分配，还未初始化 |
| `_Grunnable` | 在运行队列中，等待被调度 |
| `_Grunning` | 正在某个 M 上执行 |
| `_Gwaiting` | 被阻塞（Channel、锁、IO 等），不在任何运行队列 |
| `_Gsyscall` | 正在执行系统调用 |
| `_Gdead` | 执行完毕，可以被复用 |

### proc.go 关键函数调用链

```
newproc() → newproc1()           // go func() 创建新 G
    ↓
runqput()                        // 放入 P 的本地队列
    ↓
schedule()                       // 调度循环入口
    ↓
findrunnable()                   // 找到一个可运行的 G
    ├── runqget()                // 先从本地队列取
    ├── globrunqget()            // 再从全局队列取
    └── runqsteal()              // 最后从其他 P 偷（work stealing）
    ↓
execute(gp)                      // 切换到目标 G 执行
    ↓
gogo()                           // 汇编实现，恢复 G 的寄存器上下文
    ↓
goexit() → goexit1()            // G 执行完毕，回到调度循环
    ↓
schedule()                       // 重新进入调度
```

### 观测调度行为

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
)

func main() {
	runtime.GOMAXPROCS(1) // 限制为 1 个 P，方便观察调度

	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 3; j++ {
				fmt.Printf("goroutine %d, iter %d\n", id, j)
				runtime.Gosched() // 主动让出，触发 schedule()
			}
		}(i)
	}
	wg.Wait()
}
```

使用 `GODEBUG=schedtrace=1000` 可以观察调度器的实时状态：

```bash
GODEBUG=schedtrace=1000 go run main.go
# 输出类似：
# SCHED 0ms: gomaxprocs=4 idleprocs=2 threads=5 spinningthreads=1
#   idlethreads=0 runqueue=0 [0 0 0 0]
```

### 讲解重点

- **schedule() 是调度循环的心脏**：每个 M 绑定一个 P 后，就在 `schedule()` 中不断循环——找 G、执行 G、G 结束后回到 schedule()。
- **work stealing 机制**：当本地队列和全局队列都为空时，P 会随机选一个其他 P，偷走其本地队列一半的 G。这是 Go 调度器高效的关键。
- **Gsyscall 的处理**：当 G 进入系统调用时，调度器会把 P 从当前 M 上解绑（handoffp），交给另一个空闲的 M 使用，避免 P 被阻塞。

---

## 3. Channel 源码

Channel 的实现在 `runtime/chan.go`，核心数据结构是 `hchan`。

### hchan 结构体

```go
// runtime/chan.go（简化）
type hchan struct {
	qcount   uint           // 当前队列中的元素数量
	dataqsiz uint           // 环形缓冲区大小（make(chan T, N) 中的 N）
	buf      unsafe.Pointer // 环形缓冲区指针
	elemsize uint16         // 单个元素大小
	closed   uint32         // 是否已关闭
	elemtype *_type         // 元素类型
	sendx    uint           // 发送索引（环形缓冲区写位置）
	recvx    uint           // 接收索引（环形缓冲区读位置）
	recvq    waitq          // 等待接收的 goroutine 队列（sudog 链表）
	sendq    waitq          // 等待发送的 goroutine 队列（sudog 链表）
	lock     mutex          // 保护 hchan 所有字段的锁
}

// sudog 表示一个等待在 channel 上的 goroutine
type sudog struct {
	g    *g             // 等待的 goroutine
	elem unsafe.Pointer // 发送/接收的数据指针
	next *sudog
	prev *sudog
	// ...
}
```

### chansend 发送流程

```
ch <- value 编译为 chansend1() → chansend()

chansend(c *hchan, ep unsafe.Pointer, block bool) bool:
  1. 加锁 lock(&c.lock)
  2. 如果 recvq 中有等待的接收者（sg := c.recvq.dequeue()）
     → 直接把数据拷贝给接收者（send），调用 goready(sg.g) 唤醒它
     → 不经过缓冲区，这是最快的路径
  3. 如果缓冲区未满（c.qcount < c.dataqsiz）
     → 把数据拷贝到 buf[sendx]，sendx++，qcount++
  4. 如果缓冲区满了
     → 创建 sudog，将当前 G 挂到 sendq
     → 调用 gopark() 挂起当前 G（状态变为 Gwaiting）
     → 等待被接收者唤醒
```

### chanrecv 接收流程

```
<-ch 编译为 chanrecv1() → chanrecv()

chanrecv(c *hchan, ep unsafe.Pointer, block bool):
  1. 加锁
  2. 如果 sendq 中有等待的发送者
     → 分两种情况：
       a. 无缓冲 channel：直接从发送者拷贝数据
       b. 有缓冲 channel：从 buf[recvx] 拷贝数据给接收者，
          再把发送者的数据放入 buf[sendx]
     → 调用 goready(sg.g) 唤醒发送者
  3. 如果缓冲区有数据（c.qcount > 0）
     → 从 buf[recvx] 拷贝数据
  4. 如果缓冲区为空
     → 创建 sudog，挂到 recvq
     → gopark() 挂起当前 G
```

### 观察 Channel 行为

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

func main() {
	ch := make(chan int, 2)

	// 填满缓冲区
	ch <- 1
	ch <- 2
	fmt.Println("缓冲区已满, goroutine 数:", runtime.NumGoroutine())

	// 第三次发送会阻塞
	go func() {
		ch <- 3 // 这里会 gopark
		fmt.Println("发送 3 完成")
	}()

	time.Sleep(100 * time.Millisecond)
	fmt.Println("阻塞发送后, goroutine 数:", runtime.NumGoroutine())

	// 读取一个，触发 goready 唤醒发送者
	v := <-ch
	fmt.Println("收到:", v)

	time.Sleep(100 * time.Millisecond)
	fmt.Println("唤醒后, goroutine 数:", runtime.NumGoroutine())
}
```

### 讲解重点

- **gopark/goready 是调度器的核心原语**：`gopark` 将 G 从 Grunning 切到 Gwaiting 并让出执行权；`goready` 将 G 从 Gwaiting 切到 Grunnable 并放回运行队列。Channel、Mutex、net 等底层都依赖这对函数。
- **无缓冲 Channel 的直接拷贝**：当发送者和接收者同时就绪时，数据会直接从发送者的栈拷贝到接收者的栈，跳过缓冲区，这是性能优化的关键路径。
- **关闭 Channel 的实现**：`closechan` 会将 `closed` 置 1，然后遍历 recvq 和 sendq 中的所有 sudog，依次唤醒。向已关闭的 Channel 发送会 panic，这个检查在 `chansend` 的加锁后立即进行。

---

## 4. Map 源码

Map 的实现在 `runtime/map.go`，采用哈希表 + 链地址法（桶 + 溢出桶）。

### 核心数据结构

```go
// runtime/map.go（简化）
type hmap struct {
	count     int    // 当前元素数量，len(m) 返回这个值
	flags     uint8  // 并发读写检测标志
	B         uint8  // 桶数量 = 2^B
	noverflow uint16 // 溢出桶的近似数量
	hash0     uint32 // 哈希种子，创建 map 时随机生成

	buckets    unsafe.Pointer // 桶数组指针，长度 2^B
	oldbuckets unsafe.Pointer // 扩容时的旧桶数组
	nevacuate  uintptr        // 扩容进度：下一个待迁移的桶编号

	extra *mapextra // 溢出桶相关
}

// 每个桶固定存 8 个 key-value 对
type bmap struct {
	tophash [8]uint8 // 每个位置存 key hash 的高 8 位，用于快速比较
	// 后面紧跟 8 个 key 和 8 个 value（编译时确定布局）
	// overflow *bmap（指向溢出桶）
}
```

### 查找流程 (mapaccess)

```
v := m[key] 编译为 mapaccess1() 或 mapaccess2()

mapaccess1(t *maptype, h *hmap, key unsafe.Pointer):
  1. 计算 hash := t.hasher(key, uintptr(h.hash0))
  2. 定位桶：bucket := hash & (2^B - 1)，取低 B 位
  3. 取 tophash：top := hash >> (64 - 8)，取高 8 位
  4. 遍历桶链（bmap + overflow）
     → 先比 tophash[i] == top（快速筛选）
     → 再比 key 是否相等
  5. 如果正在扩容（oldbuckets != nil）
     → 先到 oldbuckets 对应的桶里查
```

### 扩容机制

```
触发条件（在 mapassign 中检查）:
  1. 负载因子 > 6.5（count / 2^B > 6.5）→ 翻倍扩容（B+1）
  2. 溢出桶过多 → 等量扩容（整理碎片）

扩容过程（渐进式）：
  mapassign / mapdelete 中调用 growWork()
    → evacuate(t, h, bucket) 迁移旧桶数据到新桶
    → 每次操作最多迁移 2 个桶
    → 直到 nevacuate == 2^oldB，扩容完成
```

### 并发检测

```go
package main

import "sync"

func main() {
	m := make(map[int]int)

	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(v int) {
			defer wg.Done()
			m[v] = v // 并发写 map 会触发 fatal: concurrent map writes
		}(i)
	}
	wg.Wait()
}
// 运行时会 panic：fatal error: concurrent map writes
// 这是因为 mapassign 中会检查 flags & hashWriting != 0
```

### 讲解重点

- **tophash 的加速作用**：每次查找不需要逐个比较完整 key，先比较 hash 高 8 位（1 字节比较），大多数不匹配的 key 在这一步就被过滤掉，大幅减少完整 key 比较的次数。
- **渐进式扩容的设计**：Go 的 map 不会一次性迁移所有数据，而是在每次读写操作时顺带迁移 1-2 个桶（`growWork`），避免单次扩容的延迟毛刺。
- **并发不安全是设计选择**：map 通过 `flags` 字段进行并发写检测（hashWriting 标记），一旦发现并发写直接 fatal 而非静默损坏。需要并发安全时使用 `sync.Map` 或加锁。

---

## 5. sync 包源码

sync 包的实现在 `sync/` 目录下，这里分析三个最常用的原语。

### Mutex 实现

```go
// sync/mutex.go（简化）
type Mutex struct {
	state int32  // 包含 locked、woken、starving 标志位和 waiter 计数
	sema  uint32 // 信号量，用于阻塞/唤醒
}

// state 的位布局：
// |31 ........... 3|   2      |  1    |  0     |
// |  waiter count  | starving | woken | locked |
```

**正常模式 vs 饥饿模式**：

```
正常模式（Normal）：
  - 新来的 goroutine 会先自旋几次尝试 CAS 获取锁
  - 如果失败，加入等待队列（FIFO）
  - 被唤醒后和新到的 goroutine 竞争锁
  - 新 goroutine 在 CPU 上，有优势，老 waiter 容易再次失败

饥饿模式（Starvation）：
  - 当 waiter 等待超过 1ms，切换到饥饿模式
  - 锁直接交给等待队列头部的 goroutine，不再竞争
  - 新来的 goroutine 不自旋，直接排队
  - 当等待队列为空或当前 waiter 等待不到 1ms 时，切回正常模式
```

### Once 实现

```go
// sync/once.go（简化）
type Once struct {
	done atomic.Uint32
	m    Mutex
}

func (o *Once) Do(f func()) {
	// 快速路径：大多数情况在这里返回
	if o.done.Load() == 0 {
		o.doSlow(f) // 慢路径
	}
}

func (o *Once) doSlow(f func()) {
	o.m.Lock()
	defer o.m.Unlock()
	if o.done.Load() == 0 { // double-check
		defer o.done.Store(1)
		f()
	}
}
```

### WaitGroup 实现

```go
// sync/waitgroup.go（简化）
type WaitGroup struct {
	// state: 高 32 位是 counter，低 32 位是 waiter 数量
	// sema: 信号量
	state atomic.Uint64
	sema  uint32
}

// Add(delta): counter += delta
//   如果 counter 变为 0 且 waiter > 0
//     → 对每个 waiter 调用 runtime_Semrelease 唤醒
// Wait(): waiter++
//   如果 counter > 0 → runtime_Semacquire 阻塞
```

### 观察 Mutex 竞争

```go
package main

import (
	"fmt"
	"runtime"
	"sync"
	"time"
)

func main() {
	var mu sync.Mutex
	var wg sync.WaitGroup

	runtime.GOMAXPROCS(4)

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			mu.Lock()
			fmt.Printf("goroutine %d 获得锁\n", id)
			time.Sleep(10 * time.Millisecond) // 模拟临界区工作
			mu.Unlock()
		}(i)
	}
	wg.Wait()
}

// 配合 go test -race 和 pprof mutex profile 可以分析锁竞争
```

### 讲解重点

- **Mutex 的饥饿模式解决了公平性问题**：Go 1.9 引入饥饿模式，确保等待超过 1ms 的 goroutine 能获得锁。这是自旋锁和队列锁的折中——正常情况下自旋获取锁效率高，极端情况下队列保证公平。
- **Once 的 double-check pattern**：外层用 atomic.Load 做快速路径（无锁），内层加锁后再检查一次。这样在 `Do` 已经执行过之后，后续调用零开销。
- **WaitGroup 的 counter 和 waiter 打包在一个 uint64 中**：这样可以用一次原子操作同时读写两个值，避免了额外的锁开销。但这也意味着 `Add` 和 `Wait` 的调用顺序很重要——`Add` 必须在 `Wait` 之前。

---

## 6. net/http 源码

`net/http` 是 Go 标准库中最常用的包之一，理解其源码对于构建高性能 HTTP 服务非常有帮助。

### Server.ListenAndServe 调用链

```
http.ListenAndServe(addr, handler)
  → Server.ListenAndServe()
    → net.Listen("tcp", addr)    // 监听端口
    → Server.Serve(listener)
      → for {
           conn, err := l.Accept()   // 接受连接
           go c.serve(connCtx)       // 每个连接一个 goroutine
         }

c.serve(ctx):
  → for {
       req, err := c.readRequest(ctx)  // 读取 HTTP 请求
       serverHandler{c.server}.ServeHTTP(w, req)  // 路由到 handler
    }
```

### goroutine-per-connection 模型

```go
package main

import (
	"fmt"
	"net/http"
	"runtime"
	"time"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "goroutine 数: %d", runtime.NumGoroutine())
	})

	http.HandleFunc("/slow", func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(10 * time.Second) // 模拟慢请求
		fmt.Fprintf(w, "done")
	})

	// 每个并发连接会创建一个 goroutine
	// 10000 个并发慢请求 = 10000+ goroutine
	http.ListenAndServe(":8080", nil)
}
```

### ServeMux 路由

```go
// net/http/server.go（简化）
type ServeMux struct {
	mu    sync.RWMutex
	m     map[string]muxEntry  // 精确匹配路由
	es    []muxEntry           // 以 "/" 结尾的模式，按长度排序
	hosts bool                 // 是否有带 host 的模式
}

// 路由匹配过程：
// 1. 先精确匹配 m[path]
// 2. 再遍历 es，找最长前缀匹配
// 3. Go 1.22+ 支持方法匹配和路径参数：GET /users/{id}
```

### Transport 连接池

```go
// net/http/transport.go（简化）
type Transport struct {
	idleConn     map[connectMethodKey][]*persistConn // 空闲连接池
	MaxIdleConns          int  // 所有 host 的最大空闲连接总数（默认 100）
	MaxIdleConnsPerHost   int  // 每个 host 的最大空闲连接（默认 2）
	IdleConnTimeout       time.Duration // 空闲连接超时（默认 90s）
	MaxConnsPerHost       int  // 每个 host 的最大连接数（0=无限制）
}
```

```go
package main

import (
	"net/http"
	"time"
)

func main() {
	// 生产环境建议自定义 Transport
	client := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,  // 默认 2 太小，高并发场景需要调大
			IdleConnTimeout:     90 * time.Second,
			MaxConnsPerHost:     50,
		},
	}

	resp, err := client.Get("https://example.com")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	// 注意：不读取 resp.Body 或不 Close 会导致连接无法回收
}
```

### 讲解重点

- **goroutine-per-connection 的代价**：每个连接都开一个 goroutine，简单但不免费。大量慢连接（长轮询、WebSocket、慢客户端）会堆积 goroutine。需要配合 `Server.ReadTimeout`、`WriteTimeout`、`IdleTimeout` 来控制。
- **DefaultServeMux 的安全隐患**：`http.HandleFunc` 注册到全局 `DefaultServeMux`，如果引入了第三方库，它们也可能注册路由（如 pprof）。生产环境建议创建独立的 `ServeMux`。
- **Transport 连接复用的关键**：`resp.Body` 必须读完并 Close，否则连接不会回到连接池。`MaxIdleConnsPerHost` 默认值 2 在高并发请求同一 host 时会成为瓶颈。

---

## 7. Context 源码

Context 的实现在 `context/context.go`，代码量不大但设计精巧。更多使用层面的内容参见 [Context 使用边界](../context-usage-boundaries.md)。

### 核心类型

```go
// context/context.go（简化）
type cancelCtx struct {
	Context                        // 嵌入父 Context
	mu       sync.Mutex
	done     atomic.Value          // chan struct{}，惰性创建
	children map[canceler]struct{} // 子 context 集合
	err      error                 // 取消原因
}

type timerCtx struct {
	*cancelCtx              // 嵌入 cancelCtx
	timer *time.Timer       // 定时器
	deadline time.Time      // 截止时间
}

type valueCtx struct {
	Context                 // 嵌入父 Context
	key, val any            // 单个 key-value 对
}
```

### cancel 链的传播机制

```
WithCancel(parent) → propagateCancel(parent, child)

propagateCancel 的逻辑：
  1. 如果 parent.Done() == nil
     → 父 context 永远不会取消（如 Background），不需要传播
  2. 如果 parent 是 *cancelCtx（或嵌套 *cancelCtx）
     → 直接把 child 加入 parent.children map
     → 父取消时遍历 children 逐个取消
  3. 如果 parent 是自定义实现
     → 启一个 goroutine 监听 parent.Done()
     → 父取消时取消 child
```

### cancel 的执行流程

```
cancelCtx.cancel(removeFromParent bool, err error):
  1. 设置 c.err = err
  2. 关闭 c.done channel（close(d)）
     → 所有在 <-ctx.Done() 上等待的 goroutine 被唤醒
  3. 遍历 c.children，对每个 child 调用 child.cancel(false, err)
     → 取消沿着树向下传播
  4. c.children = nil（释放引用）
  5. 如果 removeFromParent
     → 从父 context 的 children 中删除自己
```

### 观察 Context 树

```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// 构建 context 树
	root := context.Background()
	ctx1, cancel1 := context.WithCancel(root)
	ctx2, _ := context.WithCancel(ctx1)
	ctx3, _ := context.WithTimeout(ctx1, 5*time.Second) // timerCtx

	// ctx1 取消会级联取消 ctx2 和 ctx3
	go func() {
		<-ctx2.Done()
		fmt.Println("ctx2 取消:", ctx2.Err())
	}()
	go func() {
		<-ctx3.Done()
		fmt.Println("ctx3 取消:", ctx3.Err())
	}()

	time.Sleep(100 * time.Millisecond)
	cancel1() // 取消 ctx1，ctx2 和 ctx3 也会被取消
	time.Sleep(100 * time.Millisecond)
}
```

### 讲解重点

- **cancelCtx.children 形成树结构**：每个 `WithCancel/WithTimeout` 都会通过 `propagateCancel` 把自己注册到最近的父 `cancelCtx` 的 children 中。取消操作沿树向下广播，这就是 Context 实现级联取消的核心机制。
- **done channel 的惰性创建**：`cancelCtx.done` 不是在 `WithCancel` 时创建，而是在第一次调用 `Done()` 时才创建。如果一个 Context 从未被 select 监听，就不会分配 channel，减少了内存开销。
- **valueCtx 的链表查找**：`valueCtx.Value(key)` 会沿着父链逐个比较 key，时间复杂度 O(n)。这是有意设计——Context 不适合存放大量 key-value，只用于请求级别的少量元数据（traceID、userID 等）。

---

## 8. GC 相关源码入口

Go 使用并发三色标记清除（Concurrent Tri-color Mark and Sweep）GC，核心代码分布在 `runtime/mgc.go`、`runtime/mgcsweep.go`、`runtime/mgcmark.go` 等文件。

### GC 触发条件

```go
// runtime/mgc.go（简化）
type gcTrigger struct {
	kind gcTriggerKind
	now  int64   // gcTriggerTime 用
	n    uint32  // gcTriggerCycle 用
}

// 三种触发方式：
// gcTriggerHeap   — 堆内存增长达到阈值（默认目标：上次 GC 后堆大小的 2 倍）
// gcTriggerTime   — 超过 2 分钟没有 GC
// gcTriggerCycle  — 手动调用 runtime.GC()
```

### GC 主要阶段

```
                     ┌─────────────────────────────┐
                     │    gcStart() (mgc.go)        │
                     │  1. STW - 开启写屏障          │
                     │  2. 启动标记 worker            │
                     │  3. Start The World           │
                     └──────────┬──────────────────┘
                                ↓
                     ┌─────────────────────────────┐
                     │    并发标记阶段                 │
                     │  - gcBgMarkWorker 扫描根对象   │
                     │  - 用户代码与标记并发执行        │
                     │  - 写屏障记录指针修改           │
                     └──────────┬──────────────────┘
                                ↓
                     ┌─────────────────────────────┐
                     │    gcMarkDone() (mgc.go)     │
                     │  1. STW - 标记终止             │
                     │  2. 关闭写屏障                 │
                     │  3. 计算下次 GC 触发阈值        │
                     │  4. Start The World           │
                     └──────────┬──────────────────┘
                                ↓
                     ┌─────────────────────────────┐
                     │    并发清除阶段                 │
                     │  - sweepone() (mgcsweep.go)  │
                     │  - 按需清除 span               │
                     │  - 与用户代码并发执行           │
                     └─────────────────────────────┘
```

### 写屏障（Write Barrier）

```
写屏障的作用：在并发标记阶段，用户代码修改指针时通知 GC

Go 使用混合写屏障（Hybrid Write Barrier，Go 1.8+）：
  runtime.gcWriteBarrier（汇编实现）
    → 对被覆盖的旧指针和新写入的指针都标灰
    → 这样不需要在标记阶段重新扫描栈

源码位置：
  - runtime/mgc.go         → gcStart, gcMarkDone, gcSweep
  - runtime/mgcmark.go     → gcBgMarkWorker, scanobject, greyobject
  - runtime/mgcsweep.go    → sweepone, sweep
  - runtime/mbarrier.go    → 写屏障相关
  - runtime/asm_amd64.s    → gcWriteBarrier 汇编实现
```

### 观测 GC 行为

```go
package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"time"
)

func main() {
	// 设置 GC 目标百分比（默认 100，即堆增长 100% 后触发 GC）
	debug.SetGCPercent(50) // 更激进：堆增长 50% 就触发

	// 也可以通过环境变量观察：
	// GODEBUG=gctrace=1 go run main.go

	var overall [][]byte
	for i := 0; i < 20; i++ {
		// 每次分配 1MB
		block := make([]byte, 1024*1024)
		overall = append(overall, block)

		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		fmt.Printf("轮次 %2d: Alloc=%5d KB, NumGC=%d, NextGC=%d KB\n",
			i, m.Alloc/1024, m.NumGC, m.NextGC/1024)

		time.Sleep(50 * time.Millisecond)
	}
}
```

使用 `GODEBUG=gctrace=1` 查看详细 GC 日志：

```bash
GODEBUG=gctrace=1 go run main.go
# 输出类似：
# gc 1 @0.012s 2%: 0.031+0.45+0.003 ms clock,
#   0.12+0.42/0.38/0+0.012 ms cpu, 4->4->0 MB, 4 MB goal,
#   0 MB stacks, 0 MB globals, 8 P
#
# 格式：gc# @时间 CPU占比: STW扫描+并发标记+STW终止
#       CPU详情, 堆使用变化, 目标堆大小, P数量
```

### 讲解重点

- **gcTrigger 的三种触发方式**：最常见的是 `gcTriggerHeap`（堆增长触发），由 `GOGC` 环境变量或 `debug.SetGCPercent` 控制。Go 1.19 引入了 `debug.SetMemoryLimit`，可以设置软内存上限，避免 OOM。
- **两次 STW 的时长是关键指标**：`gcStart` 和 `gcMarkDone` 各有一次短暂的 STW。通过 `gctrace` 输出或 pprof 可以观测到。如果 STW 时间过长（超过几毫秒），可能是因为大量 goroutine 需要被停止。
- **混合写屏障消除了栈重扫**：Go 1.8 之前使用 Dijkstra 写屏障，需要在标记终止时重新扫描所有 goroutine 栈。混合写屏障通过同时标灰旧指针和新指针，保证不遗漏存活对象，从而消除了栈重扫，显著缩短了 STW 时间。
