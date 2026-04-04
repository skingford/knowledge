---
title: 高级并发模式
description: Go 高级并发模式专题，涵盖 ErrGroup、Singleflight、Semaphore、Worker Pool、Pipeline、Fan-Out/Fan-In、Rate Limiter、Context 级联取消与并发安全设计模式。
search: false
---

# 高级并发模式

## 适合人群

- 已掌握 Goroutine、Channel、Mutex、Context 等基础并发原语的开发者
- 在生产项目中遇到缓存击穿、并发控制、错误传播等实际问题，需要成熟模式的工程师
- 希望深入理解 `golang.org/x/sync`、`golang.org/x/time` 等扩展库的使用者

## 学习目标

- 掌握 ErrGroup、Singleflight、Semaphore 等扩展同步原语的使用场景和最佳实践
- 能够实现生产级 Worker Pool、Pipeline、Fan-Out/Fan-In 等并发模式
- 理解有界并发、背压机制、速率限制等流量控制策略
- 掌握 Context 超时与级联取消的正确用法，避免常见陷阱
- 能够选择合适的并发安全设计模式保护共享状态

## 快速导航

- [1. ErrGroup 错误传播](#_1-errgroup-错误传播)
- [2. Singleflight 防缓存击穿](#_2-singleflight-防缓存击穿)
- [3. Semaphore 信号量](#_3-semaphore-信号量)
- [4. Worker Pool 模式](#_4-worker-pool-模式)
- [5. 有界并发（Bounded Concurrency）](#_5-有界并发-bounded-concurrency)
- [6. Pipeline 取消与错误传播](#_6-pipeline-取消与错误传播)
- [7. Fan-Out / Fan-In 进阶](#_7-fan-out-fan-in-进阶)
- [8. Rate Limiter 令牌桶](#_8-rate-limiter-令牌桶)
- [9. Context 超时与级联取消](#_9-context-超时与级联取消)
- [10. 并发安全的设计模式](#_10-并发安全的设计模式)

---

## 1. ErrGroup 错误传播

`sync.WaitGroup` 只能等待一组 goroutine 完成，但无法收集错误。`golang.org/x/sync/errgroup` 在此基础上增加了错误传播和 context 取消能力，是生产代码中处理并发任务组的首选。

#### 工厂故事：对讲机与紧急广播

`errgroup` 就是一套**自带对讲机和紧急广播系统的"智能指挥枢纽"**，完美解决 WaitGroup 的两个致命痛点：

1. **无法捕获错误**：WaitGroup 里的协程报错，主协程拿不到。
2. **缺乏一损俱损的联动**：10 个并发任务，第 1 个瞬间失败，剩下 9 个白白浪费资源。

比喻：老板派 3 个采购员去不同城市买零件，任何一个买不到整个计划就泡汤——

- **用 WaitGroup**：北京采购员第一天发现没货，但没法通知别人。上海和广州还在苦找半个月。
- **用 errgroup**：北京采购员发现没货，立刻通过对讲机喊报告。总控台收到错误，触发全频道紧急广播（自动 Cancel Context），上海广州立刻买机票回家。

核心三板斧：
1. `g, ctx := errgroup.WithContext(context.Background())` — 创建 Group 与派生 ctx，任一协程返回 error 则 ctx 自动取消
2. `g.Go(func() error { ... })` — 派发任务，强制返回 error
3. `err := g.Wait()` — 等待全部完成，返回第一个 error

### 基本用法：并发请求多个 API 并收集错误

::: details 点击查看代码：并发请求多个 API 并收集错误
```go
package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	urls := []string{
		"https://httpbin.org/get",
		"https://httpbin.org/status/500", // 会返回 500 错误
		"https://httpbin.org/delay/1",
	}

	// 使用 WithContext 创建带取消能力的 errgroup
	// 任一 goroutine 返回错误时，ctx 会被自动取消
	g, ctx := errgroup.WithContext(context.Background())

	results := make([]string, len(urls))

	for i, url := range urls {
		i, url := i, url // Go 1.22 之前需要显式捕获
		g.Go(func() error {
			// 使用 errgroup 提供的 ctx 创建请求
			req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
			if err != nil {
				return fmt.Errorf("创建请求失败 %s: %w", url, err)
			}

			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				return fmt.Errorf("请求失败 %s: %w", url, err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				return fmt.Errorf("非预期状态码 %s: %d", url, resp.StatusCode)
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				return fmt.Errorf("读取响应失败 %s: %w", url, err)
			}
			results[i] = string(body[:50]) // 只取前 50 字节演示
			return nil
		})
	}

	// Wait 返回第一个非 nil 的错误
	if err := g.Wait(); err != nil {
		fmt.Println("errgroup 出错:", err)
	}

	for i, r := range results {
		if r != "" {
			fmt.Printf("结果 %d: %s...\n", i, r)
		}
	}
}
```
:::

### 设置并发限制

::: details 点击查看代码：ErrGroup 设置并发限制
```go
package main

import (
	"fmt"
	"sync/atomic"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	var g errgroup.Group

	// 限制最多 3 个 goroutine 同时运行
	g.SetLimit(3)

	var running int64

	for i := 0; i < 10; i++ {
		i := i
		g.Go(func() error {
			cur := atomic.AddInt64(&running, 1)
			fmt.Printf("任务 %d 开始，当前并发: %d\n", i, cur)

			time.Sleep(100 * time.Millisecond) // 模拟工作

			atomic.AddInt64(&running, -1)
			fmt.Printf("任务 %d 完成\n", i)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		fmt.Println("出错:", err)
	}
}
```
:::

<GoAdvancedConcurrencyDiagram kind="errgroup" />

### 讲解重点

- **适用场景**：并发执行一组独立任务，需要收集第一个错误并取消其余任务。典型用于并发请求多个微服务、并发加载页面多个模块。
- **不适用场景**：需要收集所有错误（而非第一个）时，errgroup 不够用，需自行封装 multi-error 收集器。
- **性能考量**：`SetLimit(n)` 内部使用 buffered channel 实现信号量，开销极小。不设置限制时每次 `Go()` 直接启动 goroutine。
- **常见陷阱**：`g.Wait()` 只返回第一个错误，其余错误会被丢弃。如果需要所有错误，应在各 goroutine 内部自行收集。使用 `WithContext` 时，ctx 在第一个错误后即被取消，其余 goroutine 需要检查 `ctx.Err()` 来感知取消。
- **标准库/开源使用**：Kubernetes controller-runtime 大量使用 errgroup 管理并发 reconciler；Go 标准库 `cmd/go` 内部也使用 errgroup 进行并发编译。

#### 终极必杀技：`SetLimit` 让 errgroup 变身超级 Worker Pool

Go 1.20 引入 `g.SetLimit(n)`，一行代码就让 errgroup 变成自带错误处理和上下文取消的 Worker Pool：

::: details 点击查看代码：SetLimit 让 errgroup 变身 Worker Pool
```go
g, ctx := errgroup.WithContext(context.Background())
g.SetLimit(3) // 全厂最多 3 个工人同时干活

for i := 0; i < 100; i++ {
	taskID := i
	// 达到 3 个并发时，g.Go 自动阻塞等待
	g.Go(func() error {
		fmt.Printf("处理任务 %d\n", taskID)
		return nil
	})
}

g.Wait()
```
:::

> 在绝大多数**不需要流式传递数据**的场景下，可以直接用 `errgroup` + `SetLimit` 替代手写的 channel Worker Pool，代码量减半且更稳健。

#### WaitGroup vs errgroup 选型

| 场景 | 选择 |
| --- | --- |
| 无关联的单纯并发等待 | `sync.WaitGroup` |
| 有关联的业务并发（一损俱损），或需要捕获错误 | `errgroup` |
| 需要限制并发数 + 错误处理 | `errgroup` + `SetLimit` |

---

## 2. Singleflight 防缓存击穿

当大量并发请求查询同一个缓存 key 且缓存恰好过期时，所有请求都会穿透到后端数据库——这就是缓存击穿。`singleflight` 将同一 key 的并发调用合并为一次实际执行，其余调用共享结果。

### Do() 基本用法

::: details 点击查看代码：Singleflight Do() 基本用法
```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"golang.org/x/sync/singleflight"
)

// 模拟数据库查询
var queryCount int64

func queryDB(key string) (string, error) {
	atomic.AddInt64(&queryCount, 1)
	time.Sleep(100 * time.Millisecond) // 模拟查询耗时
	return fmt.Sprintf("value_for_%s", key), nil
}

func main() {
	var g singleflight.Group

	var wg sync.WaitGroup
	// 模拟 10 个并发请求查询同一个 key
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			// Do 会合并对同一 key 的并发调用
			// 只有第一个调用会真正执行函数，其余等待结果
			val, err, shared := g.Do("user:123", func() (interface{}, error) {
				return queryDB("user:123")
			})

			if err != nil {
				fmt.Printf("goroutine %d 出错: %v\n", id, err)
				return
			}
			fmt.Printf("goroutine %d 获取到: %s (共享结果: %v)\n", id, val, shared)
		}(i)
	}

	wg.Wait()
	fmt.Printf("\n实际查询数据库次数: %d（10 个并发请求只触发了 1 次查询）\n", queryCount)
}
```
:::

### DoChan() 非阻塞用法

::: details 点击查看代码：DoChan() 非阻塞用法
```go
package main

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/sync/singleflight"
)

func main() {
	var g singleflight.Group

	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	// DoChan 返回一个 channel，可以配合 select 使用
	ch := g.DoChan("slow-query", func() (interface{}, error) {
		time.Sleep(200 * time.Millisecond) // 模拟慢查询
		return "结果", nil
	})

	select {
	case result := <-ch:
		fmt.Println("获取到结果:", result.Val)
	case <-ctx.Done():
		fmt.Println("超时，放弃等待")
		// 注意：即使这里超时，底层调用仍在继续
		// 下一次对同一 key 的调用会等待当前执行完成
	}
}
```
:::

<GoAdvancedConcurrencyDiagram kind="singleflight" />

### 讲解重点

- **适用场景**：缓存击穿防护、热点数据加载、减少对下游服务的重复请求。典型架构：cache miss → singleflight → DB → 写回 cache。
- **不适用场景**：请求结果因调用者不同而不同（如带用户 token 的请求）；需要每个调用者都获得独立执行结果。
- **性能考量**：singleflight 内部使用 mutex + map 管理 key，锁粒度为 key 级别，开销很小。但如果底层调用很慢，所有等待者都会被阻塞。
- **常见陷阱**：`Do()` 返回的错误也会被共享——如果底层调用失败，所有等待者都会收到同一个错误。可用 `Forget(key)` 在错误时立即清除 key，让下一次调用重新执行。
- **标准库/开源使用**：Go 标准库 `net` 包内部用 singleflight 合并 DNS 查询；groupcache（memcache 作者写的分布式缓存）将 singleflight 作为核心组件。

---

## 3. Semaphore 信号量

信号量是一种经典的并发控制原语，用于限制同时访问某个资源的数量。`golang.org/x/sync/semaphore` 提供了带权重的信号量实现。

### 使用 semaphore 限制数据库连接数

::: details 点击查看代码：使用 semaphore 限制数据库连接数
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"golang.org/x/sync/semaphore"
)

// 模拟数据库连接池，最多 3 个并发连接
var sem = semaphore.NewWeighted(3)

func queryDatabase(ctx context.Context, id int) error {
	// 获取 1 个信号量（权重为 1）
	if err := sem.Acquire(ctx, 1); err != nil {
		return fmt.Errorf("获取信号量失败: %w", err)
	}
	defer sem.Release(1)

	fmt.Printf("任务 %d: 获取到连接，开始查询\n", id)
	time.Sleep(100 * time.Millisecond) // 模拟查询
	fmt.Printf("任务 %d: 查询完成，释放连接\n", id)
	return nil
}

func main() {
	ctx := context.Background()
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			if err := queryDatabase(ctx, id); err != nil {
				fmt.Printf("任务 %d 失败: %v\n", id, err)
			}
		}(i)
	}

	wg.Wait()
	fmt.Println("所有任务完成")
}
```
:::

### 对比：用 buffered channel 实现信号量

::: details 点击查看代码：用 buffered channel 实现信号量
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	const maxConcurrency = 3

	// buffered channel 天然就是一个信号量
	sem := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			sem <- struct{}{} // 获取令牌（阻塞直到有空位）
			defer func() { <-sem }() // 归还令牌

			fmt.Printf("任务 %d 开始执行\n", id)
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("任务 %d 完成\n", id)
		}(i)
	}

	wg.Wait()
	fmt.Println("所有任务完成")
}
```
:::

### TryAcquire 非阻塞获取

::: details 点击查看代码：TryAcquire 非阻塞获取
```go
package main

import (
	"fmt"

	"golang.org/x/sync/semaphore"
)

func main() {
	sem := semaphore.NewWeighted(2)

	// 尝试获取，不阻塞
	if sem.TryAcquire(1) {
		fmt.Println("获取信号量成功")
		defer sem.Release(1)
	} else {
		fmt.Println("信号量已满，执行降级逻辑")
	}

	// 占满信号量
	sem.TryAcquire(1) // 第二个也成功

	// 第三个会失败
	if !sem.TryAcquire(1) {
		fmt.Println("信号量已满，快速失败而非阻塞")
	}
}
```
:::

<GoAdvancedConcurrencyDiagram kind="semaphore" />

### 讲解重点

- **适用场景**：限制并发访问外部资源（数据库连接、文件句柄、API 调用）；需要带权重的信号量（如不同操作消耗不同数量的连接）。
- **不适用场景**：简单的互斥访问用 Mutex 更直接；只需要限制 goroutine 数量用 `errgroup.SetLimit` 更简洁。
- **buffered channel vs semaphore**：buffered channel 实现简单直观，适合权重为 1 的场景；`semaphore.Weighted` 支持不同权重和 context 取消，适合更复杂的资源管理。
- **常见陷阱**：`Acquire` 和 `Release` 的权重必须匹配，否则会导致信号量泄漏或 panic。`TryAcquire` 适合做降级策略，但不要用它来轮询。
- **标准库/开源使用**：gRPC-Go 在内部使用信号量控制并发流数量；许多数据库连接池库用信号量管理连接上限。

---

## 4. Worker Pool 模式

Worker Pool 是一种固定数量的工作协程从共享任务队列取任务处理的模式，避免为每个任务都创建 goroutine，适合任务量大、需要控制资源使用的场景。

#### 工厂思维：暴兵流 vs 工作池

假设年底爆单，工厂接到 10,000 个贴标签订单：

- **新手做法（暴兵流）**：直接 `go func()` 启动 10,000 个零时工。结果工厂挤爆，食堂没饭，大门踩塌（内存 OOM，连接池打爆，系统崩溃）。
- **老手做法（工作池）**：只设 50 个固定工位（Worker Goroutines），把 10,000 个订单扔进一个大筐（Buffered Channel）。谁干完手头的活就去筐里拿下一个，直到筐空。

三大核心组件：
1. **任务队列（Jobs Channel）**：带缓冲的 Channel，存放待处理任务（订单筐）
2. **结果队列（Results Channel）**：收集处理完的成品
3. **工作者（Workers）**：固定数量的 Goroutine，不断从 Jobs Channel 抢任务，处理后塞进 Results Channel

<GoAdvancedConcurrencyDiagram kind="worker-pool" />

### 完整的 Worker Pool 实现

::: details 点击查看代码：完整的 Worker Pool 实现
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// Task 定义任务
type Task struct {
	ID   int
	Data string
}

// Result 定义结果
type Result struct {
	TaskID int
	Output string
	Err    error
}

// WorkerPool 工作池
type WorkerPool struct {
	workerCount int
	taskCh      chan Task
	resultCh    chan Result
	wg          sync.WaitGroup
}

// NewWorkerPool 创建工作池
func NewWorkerPool(workerCount, taskBufferSize int) *WorkerPool {
	return &WorkerPool{
		workerCount: workerCount,
		taskCh:      make(chan Task, taskBufferSize),
		resultCh:    make(chan Result, taskBufferSize),
	}
}

// Start 启动工作池
func (p *WorkerPool) Start(ctx context.Context) {
	for i := 0; i < p.workerCount; i++ {
		p.wg.Add(1)
		go p.worker(ctx, i)
	}
}

// worker 工作协程
func (p *WorkerPool) worker(ctx context.Context, id int) {
	defer p.wg.Done()
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("worker %d: 收到取消信号，退出\n", id)
			return
		case task, ok := <-p.taskCh:
			if !ok {
				fmt.Printf("worker %d: 任务通道关闭，退出\n", id)
				return
			}
			// 处理任务
			result := p.process(task)
			// 发送结果（注意 ctx 取消时也要能退出）
			select {
			case p.resultCh <- result:
			case <-ctx.Done():
				return
			}
		}
	}
}

// process 处理单个任务
func (p *WorkerPool) process(task Task) Result {
	time.Sleep(50 * time.Millisecond) // 模拟处理
	return Result{
		TaskID: task.ID,
		Output: fmt.Sprintf("已处理: %s", task.Data),
	}
}

// Submit 提交任务
func (p *WorkerPool) Submit(ctx context.Context, task Task) error {
	select {
	case p.taskCh <- task:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// Results 获取结果通道
func (p *WorkerPool) Results() <-chan Result {
	return p.resultCh
}

// Shutdown 优雅关闭
func (p *WorkerPool) Shutdown() {
	close(p.taskCh) // 关闭任务通道，worker 会在处理完当前任务后退出
	p.wg.Wait()     // 等待所有 worker 退出
	close(p.resultCh) // 所有 worker 退出后才关闭结果通道
}

func main() {
	ctx := context.Background()
	pool := NewWorkerPool(3, 10)
	pool.Start(ctx)

	// 启动结果收集器
	var collectWg sync.WaitGroup
	collectWg.Add(1)
	go func() {
		defer collectWg.Done()
		for result := range pool.Results() {
			fmt.Printf("收到结果: 任务%d -> %s\n", result.TaskID, result.Output)
		}
	}()

	// 提交任务
	for i := 0; i < 10; i++ {
		err := pool.Submit(ctx, Task{
			ID:   i,
			Data: fmt.Sprintf("数据_%d", i),
		})
		if err != nil {
			fmt.Printf("提交任务 %d 失败: %v\n", i, err)
		}
	}

	// 优雅关闭
	pool.Shutdown()
	collectWg.Wait()
	fmt.Println("所有任务处理完成")
}
```
:::

### 讲解重点

- **适用场景**：大量同质任务需要处理，且需要控制并发数量（如批量图片处理、批量数据导入、消息队列消费）。
- **不适用场景**：任务量少（直接用 goroutine 更简单）；任务之间有依赖关系（应该用 DAG 调度器）。
- **性能考量**：worker 数量通常设为 CPU 核数（CPU 密集型）或更高（IO 密集型）。任务通道 buffer 大小影响背压行为——buffer 越大，生产者被阻塞的概率越低，但内存占用越高。
- **常见陷阱**：关闭顺序很重要——必须先关闭 taskCh，等所有 worker 退出后再关闭 resultCh，否则会 panic。不要在 worker 内部关闭 resultCh。
- **动态扩缩容思路**：可以用一个管理 goroutine 监控任务队列长度，当积压超过阈值时启动新 worker，空闲超时后让多余 worker 退出。`ants` 库是 Go 生态中成熟的 goroutine 池实现，支持动态调整。
- **开源推荐**：如果你在业务里不想自己维护 goroutine 池实现，优先推荐 [ants](https://github.com/panjf2000/ants)。它在 Go 生态里使用很广，提供池容量控制、预分配、非阻塞提交、动态调参等能力，适合把无边界的 `go func()` 收敛成可控的 worker pool。仓库地址：[https://github.com/panjf2000/ants](https://github.com/panjf2000/ants)
- **标准库/开源使用**：`ants` 适合高性能 goroutine 池场景，`tunny` 更偏固定大小 worker pool；如果你要的是带重试、限速、延迟队列语义的任务消费模型，也可以参考 Kubernetes 的 `workqueue`。相关地址：[tunny](https://github.com/Jeffail/tunny)、[https://github.com/Jeffail/tunny](https://github.com/Jeffail/tunny)；[workqueue](https://github.com/kubernetes/client-go/tree/master/util/workqueue)、[https://github.com/kubernetes/client-go/tree/master/util/workqueue](https://github.com/kubernetes/client-go/tree/master/util/workqueue)

#### Pipeline vs Worker Pool 怎么选？

| 选择 | 场景 | 比喻 |
| --- | --- | --- |
| **Pipeline** | 多步骤任务（A 洗菜 → B 切菜 → C 炒菜），重点在于数据流经不同工序 | 流水线 |
| **Worker Pool** | 单一步骤但量极大（10,000 个土豆只需削皮），核心痛点是防止系统被压垮 | 工位制 |
| **王炸组合** | 流水线的"切菜"环节太耗时，在该环节引入 Worker Pool 让 5 个工人同时切，再汇总到下一道工序 | 混合模式 |

---

## 5. 有界并发（Bounded Concurrency）

有界并发的核心思想是：允许并发执行，但限制同时运行的 goroutine 数量，防止资源耗尽。

### 批量下载文件但限制并发数

::: details 点击查看代码：批量下载文件但限制并发数
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func downloadFile(url string) error {
	fmt.Printf("开始下载: %s\n", url)
	time.Sleep(100 * time.Millisecond) // 模拟下载
	fmt.Printf("完成下载: %s\n", url)
	return nil
}

func main() {
	urls := []string{
		"file1.zip", "file2.zip", "file3.zip",
		"file4.zip", "file5.zip", "file6.zip",
		"file7.zip", "file8.zip", "file9.zip",
		"file10.zip",
	}

	const maxConcurrency = 3

	// 令牌桶模式：buffered channel 作为并发令牌
	tokens := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup

	for _, url := range urls {
		wg.Add(1)
		url := url

		tokens <- struct{}{} // 获取令牌（会阻塞直到有空位）

		go func() {
			defer wg.Done()
			defer func() { <-tokens }() // 归还令牌

			if err := downloadFile(url); err != nil {
				fmt.Printf("下载失败 %s: %v\n", url, err)
			}
		}()
	}

	wg.Wait()
	fmt.Println("所有文件下载完成")
}
```
:::

### 使用 errgroup.SetLimit 实现有界并发

::: details 点击查看代码：使用 errgroup.SetLimit 实现有界并发
```go
package main

import (
	"fmt"
	"time"

	"golang.org/x/sync/errgroup"
)

func main() {
	urls := []string{
		"file1.zip", "file2.zip", "file3.zip",
		"file4.zip", "file5.zip", "file6.zip",
		"file7.zip", "file8.zip", "file9.zip",
		"file10.zip",
	}

	var g errgroup.Group
	g.SetLimit(3) // 最多 3 个并发

	for _, url := range urls {
		url := url
		g.Go(func() error {
			fmt.Printf("开始下载: %s\n", url)
			time.Sleep(100 * time.Millisecond)
			fmt.Printf("完成下载: %s\n", url)
			return nil
		})
	}

	if err := g.Wait(); err != nil {
		fmt.Println("下载出错:", err)
	}
	fmt.Println("所有文件下载完成")
}
```
:::

<GoAdvancedConcurrencyDiagram kind="bounded-concurrency" />

### 讲解重点

- **适用场景**：批量操作（下载、上传、API 调用）；资源有限（数据库连接、文件句柄）的情况下控制并发量。
- **不适用场景**：任务之间有严格的顺序依赖；需要精细的优先级调度。
- **三种实现方式对比**：（1）buffered channel 令牌桶——最基础，完全手动控制；（2）`errgroup.SetLimit`——最简洁，带错误传播；（3）`semaphore.Weighted`——支持权重，最灵活。推荐优先用 `errgroup.SetLimit`，它覆盖了大多数场景。
- **常见陷阱**：令牌桶模式中，如果在 goroutine 外部获取令牌（如示例），则主 goroutine 本身也会被阻塞。这通常是期望行为，但如果主 goroutine 需要继续做其他事情，应在 goroutine 内部获取令牌。
- **标准库/开源使用**：Docker 的镜像拉取使用有界并发限制同时下载的层数；Hugo 静态站点生成器在并发渲染页面时使用类似模式。

---

## 6. Pipeline 取消与错误传播

Pipeline 模式将数据处理分为多个阶段，每个阶段由独立的 goroutine 处理，通过 channel 连接。关键挑战在于：任一阶段出错时，如何优雅地取消整个管道并释放资源。

### 多阶段数据处理管道

::: details 点击查看代码：多阶段数据处理管道
```go
package main

import (
	"context"
	"fmt"
	"math/rand"
	"time"
)

// generate 生成阶段：产生数据
func generate(ctx context.Context, nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			select {
			case out <- n:
			case <-ctx.Done():
				fmt.Println("[生成] 收到取消信号，停止生成")
				return
			}
		}
	}()
	return out
}

// filter 过滤阶段：只保留偶数
func filter(ctx context.Context, in <-chan int) (<-chan int, <-chan error) {
	out := make(chan int)
	errCh := make(chan error, 1)
	go func() {
		defer close(out)
		defer close(errCh)
		for n := range in {
			// 模拟过滤阶段可能出错（比如遇到负数）
			if n < 0 {
				errCh <- fmt.Errorf("[过滤] 遇到非法值: %d", n)
				return
			}
			if n%2 == 0 {
				select {
				case out <- n:
				case <-ctx.Done():
					fmt.Println("[过滤] 收到取消信号")
					return
				}
			}
		}
	}()
	return out, errCh
}

// transform 转换阶段：将值翻倍
func transform(ctx context.Context, in <-chan int) (<-chan int, <-chan error) {
	out := make(chan int)
	errCh := make(chan error, 1)
	go func() {
		defer close(out)
		defer close(errCh)
		for n := range in {
			// 模拟转换阶段可能出错
			if n > 100 {
				errCh <- fmt.Errorf("[转换] 值超出范围: %d", n)
				return
			}
			result := n * 2
			select {
			case out <- result:
			case <-ctx.Done():
				fmt.Println("[转换] 收到取消信号")
				return
			}
		}
	}()
	return out, errCh
}

// output 输出阶段：消费最终结果
func output(ctx context.Context, in <-chan int) <-chan error {
	errCh := make(chan error, 1)
	go func() {
		defer close(errCh)
		for n := range in {
			select {
			case <-ctx.Done():
				fmt.Println("[输出] 收到取消信号")
				return
			default:
				fmt.Printf("[输出] 最终结果: %d\n", n)
			}
		}
	}()
	return errCh
}

func main() {
	rand.Seed(time.Now().UnixNano())
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 构建管道：生成 → 过滤 → 转换 → 输出
	nums := []int{2, 4, 6, 8, 10, 12, 14, 16}
	genOut := generate(ctx, nums...)
	filterOut, filterErr := filter(ctx, genOut)
	transformOut, transformErr := transform(ctx, filterOut)
	outputErr := output(ctx, transformOut)

	// 监控所有阶段的错误
	// 任一阶段出错则取消整个管道
	for _, ch := range []<-chan error{filterErr, transformErr, outputErr} {
		if err := <-ch; err != nil {
			fmt.Printf("管道出错: %v，取消所有阶段\n", err)
			cancel()
		}
	}

	fmt.Println("管道处理完成")
}
```
:::

### 讲解重点

- **适用场景**：数据流式处理（ETL、日志处理、流式计算）；多个处理步骤可以流水线并行执行的场景。
- **不适用场景**：处理步骤之间延迟差异极大（会导致 channel 积压）；数据量很小不值得构建管道。
- **性能考量**：每个阶段通过 channel 传递数据，有一定的同步开销。如果单个阶段是瓶颈，可以对该阶段做 fan-out（多个 worker 并行处理同一阶段）。
- **常见陷阱**：必须在每个阶段都检查 `ctx.Done()`，否则取消信号无法传播。所有 channel 最终都必须被关闭，否则下游会永远阻塞。errCh 必须有 buffer（至少为 1），否则错误发送会阻塞。
- **标准库/开源使用**：Go 官方博客 [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines) 是此模式的权威参考。

---

## 7. Fan-Out / Fan-In 进阶

Fan-Out 是将一个 channel 的数据分发给多个 worker 并行处理；Fan-In 是将多个 channel 的结果合并到一个 channel。进阶版本需要处理背压（backpressure）和慢消费者问题。

<GoAdvancedConcurrencyDiagram kind="fan-in-advanced" />

### 带背压的 Fan-Out/Fan-In

::: details 点击查看代码：带背压的 Fan-Out/Fan-In
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// fanOut 将输入分发给 n 个 worker，返回 n 个输出 channel
func fanOut(ctx context.Context, in <-chan int, workerCount int) []<-chan string {
	outputs := make([]<-chan string, workerCount)
	for i := 0; i < workerCount; i++ {
		outputs[i] = worker(ctx, in, i)
	}
	return outputs
}

// worker 单个工作协程
func worker(ctx context.Context, in <-chan int, id int) <-chan string {
	out := make(chan string) // 无 buffer，自然形成背压
	go func() {
		defer close(out)
		for n := range in {
			// 模拟处理耗时不均匀
			processingTime := time.Duration(n*10) * time.Millisecond
			time.Sleep(processingTime)

			result := fmt.Sprintf("worker-%d 处理了 %d（耗时 %v）", id, n, processingTime)

			select {
			case out <- result:
			case <-ctx.Done():
				return
			}
		}
	}()
	return out
}

// fanIn 将多个 channel 合并为一个
func fanIn(ctx context.Context, channels ...<-chan string) <-chan string {
	merged := make(chan string)
	var wg sync.WaitGroup

	for _, ch := range channels {
		wg.Add(1)
		ch := ch
		go func() {
			defer wg.Done()
			for val := range ch {
				select {
				case merged <- val:
				case <-ctx.Done():
					return
				}
			}
		}()
	}

	// 所有输入 channel 关闭后，关闭合并 channel
	go func() {
		wg.Wait()
		close(merged)
	}()

	return merged
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// 生成任务
	in := make(chan int)
	go func() {
		defer close(in)
		for i := 1; i <= 20; i++ {
			select {
			case in <- i:
			case <-ctx.Done():
				return
			}
		}
	}()

	// Fan-Out: 3 个 worker 共享同一个输入 channel
	// 多个 goroutine 从同一个 channel 接收是安全的，Go 保证每个值只被一个接收者获取
	outputs := fanOut(ctx, in, 3)

	// Fan-In: 合并所有 worker 的输出
	merged := fanIn(ctx, outputs...)

	// 消费合并后的结果
	count := 0
	for result := range merged {
		fmt.Println(result)
		count++
	}
	fmt.Printf("\n共处理 %d 个任务\n", count)
}
```
:::

### 讲解重点

- **适用场景**：处理阶段是瓶颈，需要水平扩展（如并发处理 HTTP 请求、并发处理图片缩略图生成）。
- **不适用场景**：处理顺序有严格要求（fan-out 会打乱顺序）；任务之间有状态依赖。
- **背压机制**：无 buffer 的 channel 天然提供背压——当下游消费慢时，worker 的 `out <- result` 会阻塞，进而导致 worker 不再从 `in` 读取新任务，最终生产者也被阻塞。这是一种自然的流量控制。如果需要更精细的控制，可以用带 buffer 的 channel 设置"水位线"。
- **慢消费者问题**：如果某个 worker 很慢，它不会影响其他 worker（因为它们共享同一个 input channel，慢 worker 只是少抢到一些任务）。但如果下游消费者慢，所有 worker 都会被阻塞。解决方案：加大 output buffer、丢弃旧数据、或使用超时机制。
- **常见陷阱**：fan-in 的 goroutine 必须等待所有输入 channel 关闭后才能关闭输出 channel，否则消费者会提前退出丢失数据。
- **标准库/开源使用**：Go 官方博客的 Pipeline 文章详细描述了 fan-out/fan-in 模式；许多日志收集系统（如 Fluentd 的 Go 实现）使用此模式。

---

## 8. Rate Limiter 令牌桶

速率限制用于控制操作的频率，防止过载。`golang.org/x/time/rate` 提供了基于令牌桶算法的实现，支持平稳速率和突发流量。

### 基本速率限制

::: details 点击查看代码：基本速率限制
```go
package main

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/time/rate"
)

func main() {
	// 每秒 5 个请求，允许突发 10 个
	// rate.Limit(5) 表示每秒补充 5 个令牌
	// burst 10 表示令牌桶最多存储 10 个令牌
	limiter := rate.NewLimiter(rate.Limit(5), 10)

	ctx := context.Background()

	fmt.Println("=== 突发请求（消耗预存令牌）===")
	start := time.Now()
	for i := 0; i < 12; i++ {
		// Wait 会阻塞直到获取到令牌
		if err := limiter.Wait(ctx); err != nil {
			fmt.Printf("请求 %d 被限流: %v\n", i, err)
			continue
		}
		fmt.Printf("请求 %d: 耗时 %v\n", i, time.Since(start).Round(time.Millisecond))
	}
}
```
:::

### 自定义 Per-Key Rate Limiter（Per-IP 限流）

::: details 点击查看代码：Per-Key Rate Limiter（Per-IP 限流）
```go
package main

import (
	"fmt"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// PerKeyLimiter 每个 key 独立的限流器
type PerKeyLimiter struct {
	mu       sync.Mutex
	limiters map[string]*rateLimiterEntry
	rate     rate.Limit
	burst    int
	ttl      time.Duration // 过期清理时间
}

type rateLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// NewPerKeyLimiter 创建 per-key 限流器
func NewPerKeyLimiter(r rate.Limit, burst int, ttl time.Duration) *PerKeyLimiter {
	pkl := &PerKeyLimiter{
		limiters: make(map[string]*rateLimiterEntry),
		rate:     r,
		burst:    burst,
		ttl:      ttl,
	}
	// 启动清理协程
	go pkl.cleanup()
	return pkl
}

// Allow 检查指定 key 是否允许通过
func (pkl *PerKeyLimiter) Allow(key string) bool {
	pkl.mu.Lock()
	entry, exists := pkl.limiters[key]
	if !exists {
		entry = &rateLimiterEntry{
			limiter: rate.NewLimiter(pkl.rate, pkl.burst),
		}
		pkl.limiters[key] = entry
	}
	entry.lastSeen = time.Now()
	pkl.mu.Unlock()

	return entry.limiter.Allow()
}

// cleanup 定期清理过期的 limiter，防止内存泄漏
func (pkl *PerKeyLimiter) cleanup() {
	ticker := time.NewTicker(pkl.ttl)
	defer ticker.Stop()
	for range ticker.C {
		pkl.mu.Lock()
		for key, entry := range pkl.limiters {
			if time.Since(entry.lastSeen) > pkl.ttl {
				delete(pkl.limiters, key)
			}
		}
		pkl.mu.Unlock()
	}
}

func main() {
	// 每个 IP 每秒最多 2 个请求，突发 5 个，5 分钟不活跃后清理
	limiter := NewPerKeyLimiter(2, 5, 5*time.Minute)

	// 模拟来自不同 IP 的请求
	ips := []string{"192.168.1.1", "192.168.1.2", "192.168.1.1", "192.168.1.1"}

	for i, ip := range ips {
		if limiter.Allow(ip) {
			fmt.Printf("请求 %d (IP: %s): 允许通过\n", i, ip)
		} else {
			fmt.Printf("请求 %d (IP: %s): 被限流\n", i, ip)
		}
	}

	// 快速发送大量请求，触发限流
	fmt.Println("\n=== 快速发送 10 个请求（同一 IP）===")
	for i := 0; i < 10; i++ {
		if limiter.Allow("192.168.1.1") {
			fmt.Printf("请求 %d: 通过\n", i)
		} else {
			fmt.Printf("请求 %d: 被限流\n", i)
		}
	}
}
```
:::

<GoAdvancedConcurrencyDiagram kind="rate-limiter" />

### 讲解重点

- **适用场景**：API 网关限流、防爬虫、第三方 API 调用频率控制、数据库写入速率控制。
- **不适用场景**：需要分布式限流（单机 rate.Limiter 只能限制本进程）；需要精确的滑动窗口计数。
- **令牌桶 vs 漏桶**：令牌桶允许突发流量（burst），适合需要偶尔处理峰值的场景；漏桶以恒定速率处理请求，适合需要平滑输出的场景。`rate.Limiter` 实现的是令牌桶。
- **Wait vs Allow vs Reserve**：`Wait` 阻塞等待令牌（适合后台任务）；`Allow` 立即返回是否允许（适合快速拒绝）；`Reserve` 返回需要等待的时间（适合需要精细控制的场景）。
- **常见陷阱**：per-key limiter 如果不做过期清理，key 越来越多会导致内存泄漏。高并发场景下 map + mutex 的锁竞争可能成为瓶颈，可考虑分片锁（sharded map）。
- **标准库/开源使用**：gRPC 服务端拦截器常用 rate.Limiter 做限流；Uber 的 `ratelimit` 库提供了漏桶实现作为替代方案。

---

## 9. Context 超时与级联取消

Context 是 Go 并发编程中传递取消信号、超时和请求级元数据的标准机制。正确使用 context 是避免 goroutine 泄漏和资源浪费的关键。

### HTTP 请求链中的超时传递

::: details 点击查看代码：HTTP 请求链中的超时传递
```go
package main

import (
	"context"
	"fmt"
	"time"
)

// 模拟微服务调用链：API Gateway → Service A → Service B

func serviceB(ctx context.Context) (string, error) {
	// 检查剩余超时时间
	if deadline, ok := ctx.Deadline(); ok {
		remaining := time.Until(deadline)
		fmt.Printf("[Service B] 剩余超时时间: %v\n", remaining.Round(time.Millisecond))
	}

	// 模拟处理
	select {
	case <-time.After(100 * time.Millisecond):
		return "B 的结果", nil
	case <-ctx.Done():
		return "", fmt.Errorf("Service B 被取消: %w", ctx.Err())
	}
}

func serviceA(ctx context.Context) (string, error) {
	// Service A 设置自己的子超时，但不能超过父 context 的超时
	// 如果父 context 还剩 200ms，这里设置 500ms 实际只有 200ms 生效
	ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
	defer cancel() // 必须调用！否则 timer 和 goroutine 会泄漏

	if deadline, ok := ctx.Deadline(); ok {
		remaining := time.Until(deadline)
		fmt.Printf("[Service A] 剩余超时时间: %v\n", remaining.Round(time.Millisecond))
	}

	// 调用下游服务
	result, err := serviceB(ctx)
	if err != nil {
		return "", fmt.Errorf("调用 Service B 失败: %w", err)
	}

	return "A 的结果 + " + result, nil
}

func apiGateway() {
	// 网关设置总超时 300ms
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Millisecond)
	defer cancel()

	fmt.Println("=== 正常场景 ===")
	result, err := serviceA(ctx)
	if err != nil {
		fmt.Printf("请求失败: %v\n", err)
	} else {
		fmt.Printf("请求成功: %s\n", result)
	}
}

func main() {
	apiGateway()

	fmt.Println()

	// 演示超时场景
	fmt.Println("=== 超时场景 ===")
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()

	result, err := serviceA(ctx)
	if err != nil {
		fmt.Printf("请求失败: %v\n", err)
	} else {
		fmt.Printf("请求成功: %s\n", result)
	}
}
```
:::

### 多层 Context 取消传播

::: details 点击查看代码：多层 Context 取消传播
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

func main() {
	// 根 context
	rootCtx, rootCancel := context.WithCancel(context.Background())

	// 子 context（继承根 context 的取消信号）
	childCtx1, childCancel1 := context.WithCancel(rootCtx)
	childCtx2, _ := context.WithTimeout(rootCtx, 5*time.Second)

	// 孙 context
	grandchildCtx, _ := context.WithCancel(childCtx1)

	_ = childCancel1 // 保持引用

	var wg sync.WaitGroup

	// 启动监听各级 context 的 goroutine
	for name, ctx := range map[string]context.Context{
		"child1":     childCtx1,
		"child2":     childCtx2,
		"grandchild": grandchildCtx,
	} {
		name, ctx := name, ctx
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-ctx.Done()
			fmt.Printf("[%s] 被取消: %v\n", name, ctx.Err())
		}()
	}

	// 取消根 context，观察级联取消
	fmt.Println("取消根 context...")
	rootCancel()

	wg.Wait()
	fmt.Println("所有 context 已取消")
}
```
:::

<GoChannelDiagram kind="context-tree" />

### 常见陷阱演示

::: details 点击查看代码：Context 常见陷阱演示
```go
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func main() {
	// 陷阱 1: 忘记调用 cancel 导致 timer 泄漏
	fmt.Println("=== 陷阱 1: 忘记调用 cancel ===")
	for i := 0; i < 5; i++ {
		// 错误写法：没有调用 cancel
		// ctx, _ := context.WithTimeout(context.Background(), time.Second)

		// 正确写法：始终 defer cancel()
		ctx, cancel := context.WithTimeout(context.Background(), time.Second)
		_ = ctx
		cancel() // 即使 ctx 还没超时，也应该在不需要时立即取消
	}

	// 陷阱 2: context 泄漏——goroutine 没有监听 ctx.Done()
	fmt.Println("\n=== 陷阱 2: context 泄漏 ===")
	ctx, cancel := context.WithCancel(context.Background())

	// 这个 goroutine 永远不会退出，因为它没有监听 ctx.Done()
	go func() {
		for {
			time.Sleep(time.Second) // 永远运行
			// 应该加上：
			// select {
			// case <-ctx.Done():
			//     return
			// default:
			// }
		}
	}()
	_ = ctx
	cancel() // 取消了 context，但 goroutine 不知道

	time.Sleep(100 * time.Millisecond)
	fmt.Printf("活跃 goroutine 数: %d（应该只有 1-2 个）\n", runtime.NumGoroutine())

	// 陷阱 3: 用 context.Background() 而非传入的 ctx
	fmt.Println("\n=== 陷阱 3: 忽略传入的 context ===")
	fmt.Println("错误做法: func doWork() { ctx := context.Background(); ... }")
	fmt.Println("正确做法: func doWork(ctx context.Context) { ... }")
	fmt.Println("应始终接受 context 参数并传递给下游调用")
}
```
:::

### 讲解重点

- **适用场景**：任何有超时需求的操作（HTTP 请求、数据库查询、RPC 调用）；需要级联取消的请求处理链路。
- **不适用场景**：不要用 context 传递大量业务数据——它的 Value 功能只适合传递请求级元数据（如 trace ID、认证信息）。
- **性能考量**：`context.WithValue` 内部是链表结构，查找 Value 是 O(n) 的。避免在 context 中存放过多 key-value。`WithTimeout` 每次调用都会创建一个 timer，忘记 cancel 会导致 timer 泄漏。
- **常见陷阱**：（1）忘记调用 `cancel()`——这是最常见的错误，会导致 timer 和相关 goroutine 泄漏，`go vet` 会检查这个问题；（2）goroutine 内部不检查 `ctx.Done()`，导致取消信号无法传播；（3）在函数内部创建新的 `context.Background()` 而不使用传入的 ctx，打断了取消链路。
- **标准库/开源使用**：`net/http` 的 `Request.Context()` 是 context 在标准库中最典型的应用；`database/sql` 的所有查询方法都接受 context；gRPC 的每个 RPC 调用都携带 context。

---

## 10. 并发安全的设计模式

保护共享状态有多种策略，选择正确的策略取决于读写比例、性能需求和复杂度容忍度。

### 读写锁保护共享状态

::: details 点击查看代码：读写锁保护共享状态
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// SafeConfig 线程安全的配置管理
type SafeConfig struct {
	mu   sync.RWMutex
	data map[string]string
}

func NewSafeConfig() *SafeConfig {
	return &SafeConfig{
		data: make(map[string]string),
	}
}

// Get 读操作使用读锁，允许多个读者并发
func (c *SafeConfig) Get(key string) (string, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

// Set 写操作使用写锁，独占访问
func (c *SafeConfig) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = value
}

// GetAll 返回快照，调用者可安全使用而不持有锁
func (c *SafeConfig) GetAll() map[string]string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	// 返回拷贝，而非引用
	snapshot := make(map[string]string, len(c.data))
	for k, v := range c.data {
		snapshot[k] = v
	}
	return snapshot
}

func main() {
	config := NewSafeConfig()

	// 初始化配置
	config.Set("db_host", "localhost")
	config.Set("db_port", "5432")

	var wg sync.WaitGroup

	// 大量并发读
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			if val, ok := config.Get("db_host"); ok {
				_ = val // 使用配置值
			}
		}(i)
	}

	// 少量并发写（模拟配置热更新）
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			config.Set("db_host", fmt.Sprintf("host-%d", id))
		}(i)
	}

	wg.Wait()

	snapshot := config.GetAll()
	fmt.Println("最终配置:", snapshot)
}
```
:::

### Copy-on-Write 模式

::: details 点击查看代码：Copy-on-Write 模式
```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"
)

// CowConfig 使用 Copy-on-Write 模式的配置
// 读操作完全无锁，写操作时复制一份新的再替换
type CowConfig struct {
	data atomic.Value // 存储 map[string]string
	mu   sync.Mutex   // 仅保护写操作的串行化
}

func NewCowConfig() *CowConfig {
	c := &CowConfig{}
	c.data.Store(make(map[string]string))
	return c
}

// Get 读操作：完全无锁，直接读取当前快照
func (c *CowConfig) Get(key string) (string, bool) {
	current := c.data.Load().(map[string]string)
	val, ok := current[key]
	return val, ok
}

// Set 写操作：复制 → 修改 → 替换
func (c *CowConfig) Set(key, value string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	// 1. 获取当前数据
	current := c.data.Load().(map[string]string)

	// 2. 创建副本
	newData := make(map[string]string, len(current)+1)
	for k, v := range current {
		newData[k] = v
	}

	// 3. 在副本上修改
	newData[key] = value

	// 4. 原子替换
	c.data.Store(newData)
}

func main() {
	config := NewCowConfig()
	config.Set("version", "1.0")

	var wg sync.WaitGroup

	// 大量并发读——完全无锁，性能极高
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 100; j++ {
				config.Get("version")
			}
		}()
	}

	// 少量写
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 10; i++ {
			config.Set("version", fmt.Sprintf("%d.0", i+2))
			time.Sleep(10 * time.Millisecond)
		}
	}()

	wg.Wait()
	val, _ := config.Get("version")
	fmt.Println("最终版本:", val)
}
```
:::

### Confinement（数据限制）模式

::: details 点击查看代码：Confinement 数据限制模式
```go
package main

import (
	"fmt"
	"sync"
)

// Confinement: 每个 goroutine 只访问自己的数据，无需加锁

func main() {
	data := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	results := make([]int, len(data))

	var wg sync.WaitGroup

	// 每个 goroutine 只操作 results[i]，不访问其他索引
	// 这是天然的 confinement——不需要锁
	for i, val := range data {
		wg.Add(1)
		go func(idx, v int) {
			defer wg.Done()
			results[idx] = v * v // 每个 goroutine 只写自己的位置
		}(i, val)
	}

	wg.Wait()
	fmt.Println("平方结果:", results)

	// 另一种 Confinement: 通过 channel 传递所有权
	// 数据在 channel 中传递后，发送方不再持有引用
	fmt.Println("\n=== Channel Confinement ===")
	type OwnedData struct {
		ID    int
		Value string
	}

	ch := make(chan *OwnedData, 5)

	// 生产者：创建数据后通过 channel 转移所有权
	go func() {
		defer close(ch)
		for i := 0; i < 5; i++ {
			d := &OwnedData{ID: i, Value: fmt.Sprintf("item-%d", i)}
			ch <- d
			// 发送后不再访问 d！所有权已转移给接收方
		}
	}()

	// 消费者：独占 channel 接收到的数据
	var consumerWg sync.WaitGroup
	for i := 0; i < 2; i++ {
		consumerWg.Add(1)
		go func(workerID int) {
			defer consumerWg.Done()
			for d := range ch {
				// 此时 d 完全属于当前 goroutine，可安全修改
				d.Value = fmt.Sprintf("worker-%d 处理了 %s", workerID, d.Value)
				fmt.Println(d.Value)
			}
		}(i)
	}
	consumerWg.Wait()
}
```
:::

### 线程安全的配置热更新

::: details 点击查看代码：线程安全的配置热更新
```go
package main

import (
	"encoding/json"
	"fmt"
	"sync/atomic"
	"time"
)

// AppConfig 应用配置
type AppConfig struct {
	DatabaseURL string `json:"database_url"`
	MaxConns    int    `json:"max_conns"`
	LogLevel    string `json:"log_level"`
}

// ConfigManager 使用 atomic.Value 实现无锁读取的配置管理
type ConfigManager struct {
	config atomic.Value // 存储 *AppConfig
}

func NewConfigManager(initial *AppConfig) *ConfigManager {
	cm := &ConfigManager{}
	cm.config.Store(initial)
	return cm
}

// GetConfig 无锁读取当前配置
func (cm *ConfigManager) GetConfig() *AppConfig {
	return cm.config.Load().(*AppConfig)
}

// ReloadConfig 模拟从文件/配置中心重新加载配置
func (cm *ConfigManager) ReloadConfig(jsonData []byte) error {
	newConfig := &AppConfig{}
	if err := json.Unmarshal(jsonData, newConfig); err != nil {
		return fmt.Errorf("解析配置失败: %w", err)
	}

	// 原子替换，所有后续读取都会看到新配置
	// 已经读取了旧配置的 goroutine 不受影响（它们持有旧指针）
	cm.config.Store(newConfig)
	fmt.Println("配置已热更新")
	return nil
}

func main() {
	initial := &AppConfig{
		DatabaseURL: "postgres://localhost:5432/mydb",
		MaxConns:    10,
		LogLevel:    "info",
	}

	cm := NewConfigManager(initial)

	// 模拟业务代码持续读取配置
	go func() {
		for i := 0; i < 20; i++ {
			cfg := cm.GetConfig()
			fmt.Printf("[业务] 当前日志级别: %s, 最大连接数: %d\n", cfg.LogLevel, cfg.MaxConns)
			time.Sleep(50 * time.Millisecond)
		}
	}()

	// 模拟配置热更新
	time.Sleep(200 * time.Millisecond)
	newConfigJSON := []byte(`{
		"database_url": "postgres://newhost:5432/mydb",
		"max_conns": 20,
		"log_level": "debug"
	}`)

	if err := cm.ReloadConfig(newConfigJSON); err != nil {
		fmt.Println("热更新失败:", err)
	}

	time.Sleep(500 * time.Millisecond)
}
```
:::

### 讲解重点

- **RWMutex 适用场景**：读多写少的共享数据。读锁允许并发读取，写锁独占。如果读写比例接近 1:1，RWMutex 的开销不比 Mutex 少（因为读锁本身也需要原子操作），此时直接用 Mutex 更简单。
- **Copy-on-Write 适用场景**：极端读多写少（如配置数据），写操作可以容忍全量复制的开销。读操作完全无锁，性能最高。但每次写都会产生一份完整拷贝，如果数据量大或写频繁，内存和 GC 开销会很高。
- **Confinement 适用场景**：最理想的并发模式——通过设计避免共享。每个 goroutine 只访问自己的数据分片，或通过 channel 传递所有权，从根本上消除数据竞争。Go 的哲学"不要通过共享内存来通信，而是通过通信来共享内存"正是 confinement 思想。
- **常见陷阱**：（1）RWMutex 不可重入——在持有读锁时尝试获取写锁会死锁；（2）Copy-on-Write 使用 `atomic.Value` 时，Store 的值类型必须一致；（3）Confinement 需要开发者自觉遵守，编译器无法强制——建议配合 `-race` 检测。
- **标准库/开源使用**：`sync.Map` 内部使用了 Copy-on-Write + 分代的混合策略；Kubernetes 的 SharedInformer 使用 RWMutex 保护本地缓存；etcd 的 MVCC 层使用了类似 Copy-on-Write 的方式管理版本数据。

---

## 延伸阅读

- 并发编程基础（Goroutine、Channel、Mutex、Context）详见 [并发编程](./03-concurrency.md)
- 网络编程中的超时与重试策略详见 [连接管理、超时、重试与限流](./04-connection-timeout-retry-rate-limit.md)
- 性能调优与 goroutine 泄漏排查详见 [性能与故障排查](./07-performance-troubleshooting.md)
- 微服务场景下的并发与弹性模式详见 [可观测性与弹性](./08-observability-resilience.md)
- 并发数据结构设计详见 [并发 Slice 操作模式](./02-concurrent-slice-patterns.md)
