---
title: 连接池、超时、重试与限流
description: Go 网络治理专题，聚焦连接池、超时边界、重试策略、限流模式与生产实践。
search: false
---

# 连接池、超时、重试与限流

这一页聚焦生产环境最容易出问题的网络治理主题：连接复用、超时边界、重试策略和限流实现。

## 本页内容

- [4. 连接池](#_4-连接池)
- [5. 超时控制](#_5-超时控制)
- [6. 重试机制](#_6-重试机制)
- [7. 限流](#_7-限流)

---

## 4. 连接池

连接池是避免频繁建连开销的核心模式，Go 标准库在 `database/sql` 和 `http.Transport` 中都内置了连接池。

### database/sql 连接池配置

::: details 点击展开代码：database/sql 连接池配置
```go
package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "github.com/go-sql-driver/mysql" // 导入驱动
)

func main() {
	db, err := sql.Open("mysql", "user:password@tcp(localhost:3306)/dbname")
	if err != nil {
		panic(err)
	}
	defer db.Close()

	// 连接池配置
	db.SetMaxOpenConns(25)                 // 最大打开连接数
	db.SetMaxIdleConns(10)                 // 最大空闲连接数
	db.SetConnMaxLifetime(5 * time.Minute) // 连接最大存活时间
	db.SetConnMaxIdleTime(3 * time.Minute) // 空闲连接最大存活时间

	// Ping 验证连接可用
	if err := db.Ping(); err != nil {
		panic(err)
	}

	// 查看连接池状态
	stats := db.Stats()
	fmt.Printf("Open connections: %d\n", stats.OpenConnections)
	fmt.Printf("In use: %d\n", stats.InUse)
	fmt.Printf("Idle: %d\n", stats.Idle)
	fmt.Printf("Wait count: %d\n", stats.WaitCount)
	fmt.Printf("Wait duration: %v\n", stats.WaitDuration)
}
```
:::

### 自定义连接池实现

::: details 点击展开代码：自定义连接池实现
```go
package main

import (
	"errors"
	"fmt"
	"sync"
	"time"
)

// Conn 模拟一个网络连接
type Conn struct {
	ID        int
	CreatedAt time.Time
}

func (c *Conn) Close() {
	fmt.Printf("Closing connection %d\n", c.ID)
}

// Pool 通用连接池
type Pool struct {
	mu       sync.Mutex
	conns    chan *Conn     // 空闲连接缓冲区
	factory  func() (*Conn, error) // 创建新连接的工厂函数
	maxSize  int
	curSize  int
	closed   bool
}

func NewPool(maxSize int, factory func() (*Conn, error)) *Pool {
	return &Pool{
		conns:   make(chan *Conn, maxSize),
		factory: factory,
		maxSize: maxSize,
	}
}

// Get 获取一个连接
func (p *Pool) Get() (*Conn, error) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return nil, errors.New("pool is closed")
	}
	p.mu.Unlock()

	// 优先从空闲连接中取
	select {
	case conn := <-p.conns:
		return conn, nil
	default:
	}

	// 没有空闲连接，尝试创建新的
	p.mu.Lock()
	if p.curSize >= p.maxSize {
		p.mu.Unlock()
		// 等待空闲连接
		conn := <-p.conns
		return conn, nil
	}
	p.curSize++
	p.mu.Unlock()

	conn, err := p.factory()
	if err != nil {
		p.mu.Lock()
		p.curSize--
		p.mu.Unlock()
		return nil, err
	}
	return conn, nil
}

// Put 归还连接
func (p *Pool) Put(conn *Conn) {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		conn.Close()
		return
	}
	p.mu.Unlock()

	select {
	case p.conns <- conn:
		// 成功归还到池中
	default:
		// 池已满，关闭多余连接
		conn.Close()
		p.mu.Lock()
		p.curSize--
		p.mu.Unlock()
	}
}

// Close 关闭连接池
func (p *Pool) Close() {
	p.mu.Lock()
	if p.closed {
		p.mu.Unlock()
		return
	}
	p.closed = true
	p.mu.Unlock()

	close(p.conns)
	for conn := range p.conns {
		conn.Close()
	}
}

func main() {
	nextID := 0
	pool := NewPool(3, func() (*Conn, error) {
		nextID++
		fmt.Printf("Creating connection %d\n", nextID)
		return &Conn{ID: nextID, CreatedAt: time.Now()}, nil
	})
	defer pool.Close()

	// 模拟并发获取连接
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			conn, err := pool.Get()
			if err != nil {
				fmt.Printf("Worker %d: get error: %v\n", i, err)
				return
			}
			fmt.Printf("Worker %d: got connection %d\n", i, conn.ID)
			time.Sleep(100 * time.Millisecond) // 模拟使用
			pool.Put(conn)
			fmt.Printf("Worker %d: returned connection %d\n", i, conn.ID)
		}(i)
	}
	wg.Wait()
}
```
:::

<GoNetworkDiagram kind="connection-pool" />

**讲解重点：**

1. **`database/sql` 自带连接池**：`sql.Open` 并不会立即建连，只有实际查询时才从池中取连接。必须合理配置 `MaxOpenConns` 和 `MaxIdleConns`，否则可能出现连接耗尽或频繁建连。
2. **`ConnMaxLifetime` 防止连接老化**：数据库端可能会关闭长时间空闲的连接，设置 `ConnMaxLifetime` 可以让客户端主动回收旧连接，避免使用已失效的连接。
3. **自定义连接池的核心是 `chan` + 工厂函数**：用 buffered channel 作为空闲连接队列，配合互斥锁控制最大连接数，是 Go 中最常见的连接池实现模式。

---

## 5. 超时控制

超时是分布式系统的生命线。没有超时的网络调用就像没有安全带的汽车。

### 各层超时配置

::: details 点击展开代码：各层超时配置
```go
package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"
)

func main() {
	// === 1. http.Client 级别超时 ===
	client := &http.Client{
		// 这是整个请求的超时，包括连接、发送、读取响应头和 Body
		Timeout: 30 * time.Second,

		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   5 * time.Second,  // TCP 拨号超时
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   5 * time.Second,  // TLS 握手超时
			ResponseHeaderTimeout: 10 * time.Second,  // 等待响应头超时
			IdleConnTimeout:       90 * time.Second,  // 空闲连接超时
		},
	}

	// === 2. Context 级别超时（覆盖 Client.Timeout） ===
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "GET", "https://httpbin.org/delay/3", nil)
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Request failed:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body[:100]))

	// === 3. net.Conn 级别 Deadline ===
	conn, err := net.DialTimeout("tcp", "httpbin.org:80", 5*time.Second)
	if err != nil {
		fmt.Println("Dial failed:", err)
		return
	}
	defer conn.Close()

	// SetDeadline 同时设置读写截止时间
	conn.SetDeadline(time.Now().Add(10 * time.Second))
	// 也可以分别设置
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	conn.SetWriteDeadline(time.Now().Add(5 * time.Second))

	fmt.Fprintf(conn, "GET / HTTP/1.0\r\nHost: httpbin.org\r\n\r\n")
	buf := make([]byte, 256)
	n, _ := conn.Read(buf)
	fmt.Println("Raw response:", string(buf[:n]))
}
```
:::

### Context 超时在函数调用链中传播

::: details 点击展开代码：Context 超时在函数调用链中传播
```go
package main

import (
	"context"
	"fmt"
	"time"
)

// 模拟数据库查询
func queryDB(ctx context.Context, query string) (string, error) {
	// 检查 context 是否已经超时
	select {
	case <-ctx.Done():
		return "", fmt.Errorf("query cancelled: %w", ctx.Err())
	default:
	}

	// 模拟耗时查询
	ch := make(chan string, 1)
	go func() {
		time.Sleep(2 * time.Second) // 模拟查询耗时
		ch <- "query result"
	}()

	select {
	case result := <-ch:
		return result, nil
	case <-ctx.Done():
		return "", fmt.Errorf("query timeout: %w", ctx.Err())
	}
}

// 模拟调用外部 API
func callExternalAPI(ctx context.Context) (string, error) {
	// 给子操作一个更短的超时
	subCtx, cancel := context.WithTimeout(ctx, 1*time.Second)
	defer cancel()

	ch := make(chan string, 1)
	go func() {
		time.Sleep(500 * time.Millisecond)
		ch <- "api response"
	}()

	select {
	case result := <-ch:
		return result, nil
	case <-subCtx.Done():
		return "", fmt.Errorf("API call timeout: %w", subCtx.Err())
	}
}

func handleRequest(ctx context.Context) error {
	// 查数据库
	result, err := queryDB(ctx, "SELECT * FROM users")
	if err != nil {
		return fmt.Errorf("DB error: %w", err)
	}
	fmt.Println("DB result:", result)

	// 调外部接口
	apiResult, err := callExternalAPI(ctx)
	if err != nil {
		return fmt.Errorf("API error: %w", err)
	}
	fmt.Println("API result:", apiResult)

	return nil
}

func main() {
	// 整个请求链路给 5 秒
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := handleRequest(ctx); err != nil {
		fmt.Println("Request failed:", err)
	} else {
		fmt.Println("Request succeeded")
	}
}
```
:::

<GoNetworkDiagram kind="timeout-layers" />

**讲解重点：**

1. **超时是分层的**：`Dialer.Timeout`（建连）< `ResponseHeaderTimeout`（等响应头）< `Client.Timeout`（整个请求）。每层超时针对不同阶段，需要合理搭配。
2. **Context 超时优先级最高**：`req.WithContext(ctx)` 中 context 的 deadline 如果早于 `Client.Timeout`，会以 context 为准。建议在业务层用 context 控制超时。
3. **Deadline 是绝对时间**：`net.Conn.SetReadDeadline` 设置的是 wall clock 时间点，不是持续时长。每次读写后如果要续期，需要重新调用 `SetReadDeadline`。

---

## 6. 重试机制

网络请求不可能 100% 成功，合理的重试策略能大幅提高系统可靠性。

### 指数退避 + 抖动

::: details 点击展开代码：指数退避 + 抖动
```go
package main

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"time"
)

// RetryConfig 重试配置
type RetryConfig struct {
	MaxRetries  int           // 最大重试次数
	BaseDelay   time.Duration // 基础延迟
	MaxDelay    time.Duration // 最大延迟
	Multiplier  float64       // 退避倍数
	JitterRatio float64       // 抖动比例 (0-1)
}

var DefaultRetryConfig = RetryConfig{
	MaxRetries:  3,
	BaseDelay:   100 * time.Millisecond,
	MaxDelay:    10 * time.Second,
	Multiplier:  2.0,
	JitterRatio: 0.3,
}

// calculateDelay 计算带抖动的退避时间
func calculateDelay(attempt int, cfg RetryConfig) time.Duration {
	// 指数退避：baseDelay * multiplier^attempt
	delay := float64(cfg.BaseDelay) * math.Pow(cfg.Multiplier, float64(attempt))

	// 限制最大延迟
	if delay > float64(cfg.MaxDelay) {
		delay = float64(cfg.MaxDelay)
	}

	// 添加抖动：delay ± (delay * jitterRatio)
	jitter := delay * cfg.JitterRatio
	delay = delay + (rand.Float64()*2-1)*jitter

	return time.Duration(delay)
}

// isRetryable 判断是否可重试
func isRetryable(err error, resp *http.Response) bool {
	if err != nil {
		return true // 网络错误一般可重试
	}
	if resp == nil {
		return true
	}
	// 5xx 服务端错误可重试，4xx 客户端错误不应重试
	return resp.StatusCode >= 500
}

// DoWithRetry 带重试的 HTTP 请求
func DoWithRetry(ctx context.Context, client *http.Client, req *http.Request, cfg RetryConfig) (*http.Response, error) {
	var lastErr error
	var lastResp *http.Response

	for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
		if attempt > 0 {
			delay := calculateDelay(attempt-1, cfg)
			fmt.Printf("Retry attempt %d, waiting %v\n", attempt, delay)

			select {
			case <-ctx.Done():
				return nil, fmt.Errorf("context cancelled during retry: %w", ctx.Err())
			case <-time.After(delay):
			}
		}

		// 重要：每次重试需要 clone 请求（Body 可能已被消费）
		reqClone := req.Clone(ctx)
		resp, err := client.Do(reqClone)

		if !isRetryable(err, resp) {
			return resp, err
		}

		lastErr = err
		lastResp = resp

		if resp != nil {
			resp.Body.Close() // 释放连接
		}
	}

	if lastErr != nil {
		return nil, fmt.Errorf("all %d retries failed, last error: %w", cfg.MaxRetries, lastErr)
	}
	return lastResp, errors.New("all retries failed with server error")
}

func main() {
	client := &http.Client{Timeout: 10 * time.Second}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	req, _ := http.NewRequestWithContext(ctx, "GET", "https://httpbin.org/status/500", nil)
	resp, err := DoWithRetry(ctx, client, req, DefaultRetryConfig)
	if err != nil {
		fmt.Println("Final error:", err)
		return
	}
	defer resp.Body.Close()
	fmt.Println("Final status:", resp.StatusCode)
}
```
:::

<GoNetworkDiagram kind="retry-backoff" />

**讲解重点：**

1. **指数退避避免雪崩**：固定间隔重试在大量客户端同时失败时会在同一时刻产生重试洪峰。指数退避（`delay * 2^attempt`）加随机抖动（jitter）能有效分散重试压力。
2. **只重试可重试的错误**：网络超时、5xx 服务端错误可以重试；4xx 客户端错误（如 400、401、403）重试没有意义。POST 等非幂等请求需要慎重考虑重试，可能导致重复操作。
3. **重试必须有上限和总超时**：重试次数有限（MaxRetries）、每次等待有上限（MaxDelay）、整体受 context 控制。三层保护缺一不可。

---

## 7. 限流

限流保护下游服务不被过量请求压垮，是微服务架构中的基础能力。

### 使用 time.Ticker 简易限流

::: details 点击展开代码：使用 time.Ticker 简易限流
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

// SimpleRateLimiter 基于 Ticker 的简易限流器
type SimpleRateLimiter struct {
	ticker *time.Ticker
}

func NewSimpleRateLimiter(rps int) *SimpleRateLimiter {
	return &SimpleRateLimiter{
		ticker: time.NewTicker(time.Second / time.Duration(rps)),
	}
}

func (rl *SimpleRateLimiter) Wait() {
	<-rl.ticker.C
}

func (rl *SimpleRateLimiter) Stop() {
	rl.ticker.Stop()
}

func main() {
	limiter := NewSimpleRateLimiter(5) // 每秒 5 个请求
	defer limiter.Stop()

	start := time.Now()
	for i := 0; i < 10; i++ {
		limiter.Wait()
		fmt.Printf("Request %d at %v\n", i, time.Since(start).Round(time.Millisecond))
	}
}
```
:::

### 使用 golang.org/x/time/rate（令牌桶）

::: details 点击展开代码：使用 golang.org/x/time/rate（令牌桶）
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

func main() {
	// rate.NewLimiter(rate, burst)
	// rate: 每秒产生的令牌数
	// burst: 桶容量（允许的最大突发量）
	limiter := rate.NewLimiter(5, 10) // 每秒 5 个，允许突发 10 个

	// === 方式一：Wait（阻塞等待） ===
	fmt.Println("=== Wait mode ===")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	start := time.Now()
	for i := 0; i < 15; i++ {
		if err := limiter.Wait(ctx); err != nil {
			fmt.Printf("Request %d: rate limited: %v\n", i, err)
			break
		}
		fmt.Printf("Request %d at %v\n", i, time.Since(start).Round(time.Millisecond))
	}

	// === 方式二：Allow（非阻塞判断） ===
	fmt.Println("\n=== Allow mode ===")
	limiter2 := rate.NewLimiter(2, 5)
	allowed := 0
	denied := 0
	for i := 0; i < 20; i++ {
		if limiter2.Allow() {
			allowed++
		} else {
			denied++
		}
	}
	fmt.Printf("Allowed: %d, Denied: %d\n", allowed, denied)

	// === 方式三：Reserve（获取等待信息） ===
	fmt.Println("\n=== Reserve mode ===")
	limiter3 := rate.NewLimiter(1, 3)
	for i := 0; i < 5; i++ {
		r := limiter3.Reserve()
		if !r.OK() {
			fmt.Println("Cannot reserve")
			break
		}
		delay := r.Delay()
		if delay > 0 {
			fmt.Printf("Request %d: need to wait %v\n", i, delay)
			time.Sleep(delay)
		}
		fmt.Printf("Request %d: proceeding\n", i)
	}

	// === 并发限流示例 ===
	fmt.Println("\n=== Concurrent limiting ===")
	concurrentLimiter := rate.NewLimiter(10, 20)
	var wg sync.WaitGroup
	concurrentStart := time.Now()

	for i := 0; i < 30; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			bgCtx, bgCancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer bgCancel()

			if err := concurrentLimiter.Wait(bgCtx); err != nil {
				fmt.Printf("Worker %d: limited: %v\n", id, err)
				return
			}
			fmt.Printf("Worker %d: passed at %v\n", id, time.Since(concurrentStart).Round(time.Millisecond))
		}(i)
	}
	wg.Wait()
}
```
:::

<GoNetworkDiagram kind="rate-limit-modes" />

**讲解重点：**

1. **令牌桶 vs 漏桶**：`rate.Limiter` 实现的是令牌桶算法——令牌按固定速率产生，请求需要消耗令牌。`burst` 参数允许一定量的突发流量，比漏桶更灵活。
2. **三种使用方式场景不同**：`Wait` 适合阻塞式限流（如定时任务）；`Allow` 适合非阻塞快速拒绝（如 HTTP 中间件返回 429）；`Reserve` 适合需要知道等待时间的场景。
3. **限流器是并发安全的**：`rate.Limiter` 内部用原子操作实现，可以被多个 goroutine 并发使用，不需要额外加锁。

---
