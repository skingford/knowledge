# 网络编程与标准库

## 适合人群

- 已掌握 Go 基础语法，准备写后端服务的工程师
- 需要理解 HTTP / TCP / UDP 底层机制的开发者
- 希望在生产环境中正确处理超时、重试、限流、连接池的 Go 工程师

## 学习目标

- 掌握 `net/http` 服务端与客户端的核心原理和常见坑点
- 理解 TCP/UDP 编程基础，能手写简单的网络服务
- 学会连接池、超时控制、重试机制、限流等生产级模式
- 熟练使用中间件设计、JSON 编解码、文件 IO 等标准库能力

## 快速导航

- [1. net/http 服务端原理](#_1-net-http-服务端原理)
- [2. http.Client 使用与坑点](#_2-http-client-使用与坑点)
- [3. TCP/UDP 编程基础](#_3-tcp-udp-编程基础)
- [4. 连接池](#_4-连接池)
- [5. 超时控制](#_5-超时控制)
- [6. 重试机制](#_6-重试机制)
- [7. 限流](#_7-限流)
- [8. 中间件设计](#_8-中间件设计)
- [9. JSON 编解码](#_9-json-编解码)
- [10. 文件与 IO](#_10-文件与-io)

---

## 1. net/http 服务端原理

Go 标准库的 `net/http` 是一个生产级的 HTTP 服务器，理解它的内部流程是写好后端服务的基础。

### DefaultServeMux 与 Handler 接口

```go
package main

import (
	"fmt"
	"net/http"
)

// Handler 接口只有一个方法：ServeHTTP(ResponseWriter, *Request)
// 任何实现了这个接口的类型都可以处理 HTTP 请求

type helloHandler struct{}

func (h *helloHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
}

func main() {
	// 方式一：使用 DefaultServeMux（全局路由）
	http.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("pong"))
	})

	// 方式二：使用自定义 Handler
	http.Handle("/hello/", &helloHandler{})

	// 方式三：使用自定义 ServeMux（推荐，避免全局状态）
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	// ListenAndServe 内部流程：
	// 1. 创建 TCP listener（net.Listen）
	// 2. 循环 Accept 连接
	// 3. 每个连接起一个 goroutine 处理
	// 4. 读取请求 -> 路由匹配 -> 调用 Handler -> 写响应
	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", mux)
}
```

### Graceful Shutdown

```go
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 模拟耗时请求
		time.Sleep(2 * time.Second)
		w.Write([]byte("done"))
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 启动服务器（非阻塞）
	go func() {
		fmt.Println("Server starting on :8080")
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			fmt.Printf("Server error: %v\n", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("Shutting down server...")

	// 给在途请求最多 30 秒完成
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		fmt.Printf("Server forced to shutdown: %v\n", err)
	}
	fmt.Println("Server exited")
}
```

**讲解重点：**

1. **每个连接一个 goroutine**：`ListenAndServe` 内部对每个 Accept 到的连接启动独立 goroutine，这是 Go HTTP 服务高并发的基础，但也意味着需要注意 goroutine 泄漏。
2. **避免使用 DefaultServeMux**：`http.HandleFunc` 注册到全局 `DefaultServeMux`，在测试和多模块项目中容易产生路由冲突，推荐用 `http.NewServeMux()` 创建独立路由。
3. **Graceful Shutdown 是生产必备**：`server.Shutdown` 会停止接收新连接，等待已有请求处理完毕后再退出，避免请求被截断。

---

## 2. http.Client 使用与坑点

`http.Client` 是 Go 发送 HTTP 请求的核心，但默认配置在生产环境中有很多坑。

### 正确的 Client 配置

```go
package main

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"time"
)

func main() {
	// ❌ 错误：使用默认 Client（无超时，连接数无限制）
	// resp, err := http.Get("https://example.com")

	// ✅ 正确：自定义 Transport 和超时
	transport := &http.Transport{
		// 连接池配置
		MaxIdleConns:        100,              // 所有 host 的最大空闲连接总数
		MaxIdleConnsPerHost: 10,               // 每个 host 的最大空闲连接数（默认只有 2！）
		MaxConnsPerHost:     100,              // 每个 host 的最大连接数
		IdleConnTimeout:     90 * time.Second, // 空闲连接超时

		// 连接相关超时
		DialContext: (&net.Dialer{
			Timeout:   5 * time.Second,  // 建立 TCP 连接超时
			KeepAlive: 30 * time.Second, // TCP keepalive 间隔
		}).DialContext,
		TLSHandshakeTimeout:   5 * time.Second,  // TLS 握手超时
		ResponseHeaderTimeout: 10 * time.Second,  // 等待响应头超时
		ExpectContinueTimeout: 1 * time.Second,
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   30 * time.Second, // 整个请求的总超时（含读取 Body）
	}

	// 发送请求
	resp, err := client.Get("https://httpbin.org/get")
	if err != nil {
		fmt.Printf("Request failed: %v\n", err)
		return
	}
	// ⚠️ 关键：必须关闭 Body，否则连接无法回到连接池
	defer resp.Body.Close()

	// ⚠️ 关键：必须读完 Body，否则连接也无法复用
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Read body failed: %v\n", err)
		return
	}

	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Body: %s\n", body)
}
```

### Body 不关闭导致连接泄漏

```go
package main

import (
	"fmt"
	"io"
	"net/http"
	"time"
)

func leakyRequest(client *http.Client, url string) {
	resp, err := client.Get(url)
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	// ❌ 忘记关闭 Body -> 连接不会归还到连接池 -> 连接泄漏
	_ = resp
}

func correctRequest(client *http.Client, url string) {
	resp, err := client.Get(url)
	if err != nil {
		fmt.Println("error:", err)
		return
	}
	defer resp.Body.Close()

	// 如果不需要 Body 内容，也要 drain 掉
	io.Copy(io.Discard, resp.Body)

	fmt.Println("status:", resp.StatusCode)
}

func main() {
	client := &http.Client{Timeout: 10 * time.Second}

	// 正确方式
	correctRequest(client, "https://httpbin.org/get")
}
```

**讲解重点：**

1. **Transport 必须复用**：`http.Transport` 内部维护连接池，每次创建新 Transport 会导致连接无法复用。应该在应用生命周期内创建一个 Transport，多个请求共享。
2. **Body 必须关闭且读完**：不关闭 `resp.Body` 会泄漏 TCP 连接；关闭但没读完也会导致连接无法复用（需要 `io.Copy(io.Discard, resp.Body)` 来 drain）。
3. **MaxIdleConnsPerHost 默认值太小**：默认只有 2，对高并发调用同一服务的场景远远不够，容易频繁建连，需要根据实际流量调大。

---

## 3. TCP/UDP 编程基础

Go 的 `net` 包提供了底层网络编程的能力，理解 TCP/UDP 是理解上层 HTTP 的基础。

### TCP Server / Client

```go
package main

import (
	"bufio"
	"fmt"
	"net"
	"os"
	"strings"
	"time"
)

// TCP Echo Server
func startServer() {
	listener, err := net.Listen("tcp", ":9090")
	if err != nil {
		fmt.Println("Listen error:", err)
		os.Exit(1)
	}
	defer listener.Close()
	fmt.Println("TCP server listening on :9090")

	for {
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Accept error:", err)
			continue
		}
		// 每个连接一个 goroutine
		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	defer conn.Close()
	remoteAddr := conn.RemoteAddr().String()
	fmt.Println("Client connected:", remoteAddr)

	// 设置读超时
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	scanner := bufio.NewScanner(conn)
	for scanner.Scan() {
		msg := scanner.Text()
		fmt.Printf("[%s] Received: %s\n", remoteAddr, msg)

		if strings.TrimSpace(msg) == "quit" {
			fmt.Fprintf(conn, "Bye!\n")
			return
		}

		// Echo 回去
		response := fmt.Sprintf("Echo: %s\n", msg)
		conn.Write([]byte(response))

		// 续期超时
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("[%s] Read error: %v\n", remoteAddr, err)
	}
	fmt.Println("Client disconnected:", remoteAddr)
}

// TCP Client
func startClient() {
	conn, err := net.DialTimeout("tcp", "localhost:9090", 5*time.Second)
	if err != nil {
		fmt.Println("Dial error:", err)
		return
	}
	defer conn.Close()

	// 发送消息
	fmt.Fprintf(conn, "Hello TCP!\n")

	// 读取响应
	response, err := bufio.NewReader(conn).ReadString('\n')
	if err != nil {
		fmt.Println("Read error:", err)
		return
	}
	fmt.Print("Server response: ", response)

	// 发送退出
	fmt.Fprintf(conn, "quit\n")
	response, _ = bufio.NewReader(conn).ReadString('\n')
	fmt.Print("Server response: ", response)
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "client" {
		startClient()
	} else {
		startServer()
	}
}
```

### UDP 基础

```go
package main

import (
	"fmt"
	"net"
	"os"
	"time"
)

func udpServer() {
	addr, _ := net.ResolveUDPAddr("udp", ":9091")
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		fmt.Println("Listen error:", err)
		os.Exit(1)
	}
	defer conn.Close()
	fmt.Println("UDP server listening on :9091")

	buf := make([]byte, 1024)
	for {
		n, clientAddr, err := conn.ReadFromUDP(buf)
		if err != nil {
			fmt.Println("Read error:", err)
			continue
		}
		msg := string(buf[:n])
		fmt.Printf("Received from %s: %s\n", clientAddr, msg)

		// 回复
		reply := fmt.Sprintf("Echo: %s", msg)
		conn.WriteToUDP([]byte(reply), clientAddr)
	}
}

func udpClient() {
	conn, err := net.Dial("udp", "localhost:9091")
	if err != nil {
		fmt.Println("Dial error:", err)
		return
	}
	defer conn.Close()

	conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
	conn.Write([]byte("Hello UDP!"))

	buf := make([]byte, 1024)
	conn.SetReadDeadline(time.Now().Add(5 * time.Second))
	n, err := conn.Read(buf)
	if err != nil {
		fmt.Println("Read error:", err)
		return
	}
	fmt.Println("Server response:", string(buf[:n]))
}

func main() {
	if len(os.Args) > 1 && os.Args[1] == "client" {
		udpClient()
	} else {
		udpServer()
	}
}
```

**讲解重点：**

1. **TCP 是面向连接的流协议**：数据没有边界，需要自己定义消息分隔（如换行符、长度前缀）。`bufio.Scanner` 默认按行分割，是处理文本协议的常用方式。
2. **UDP 是无连接的报文协议**：每个 `ReadFromUDP` 读到的就是一个完整数据包，不需要消息分隔。但不可靠，可能丢包、乱序。
3. **Deadline vs Timeout**：`net.Conn.SetReadDeadline` 是设置绝对截止时间，不是相对超时。每次操作后需要重新设置，否则后续操作可能立即超时。

---

## 4. 连接池

连接池是避免频繁建连开销的核心模式，Go 标准库在 `database/sql` 和 `http.Transport` 中都内置了连接池。

### database/sql 连接池配置

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

### 自定义连接池实现

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

**讲解重点：**

1. **`database/sql` 自带连接池**：`sql.Open` 并不会立即建连，只有实际查询时才从池中取连接。必须合理配置 `MaxOpenConns` 和 `MaxIdleConns`，否则可能出现连接耗尽或频繁建连。
2. **`ConnMaxLifetime` 防止连接老化**：数据库端可能会关闭长时间空闲的连接，设置 `ConnMaxLifetime` 可以让客户端主动回收旧连接，避免使用已失效的连接。
3. **自定义连接池的核心是 `chan` + 工厂函数**：用 buffered channel 作为空闲连接队列，配合互斥锁控制最大连接数，是 Go 中最常见的连接池实现模式。

---

## 5. 超时控制

超时是分布式系统的生命线。没有超时的网络调用就像没有安全带的汽车。

### 各层超时配置

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

### Context 超时在函数调用链中传播

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

**讲解重点：**

1. **超时是分层的**：`Dialer.Timeout`（建连）< `ResponseHeaderTimeout`（等响应头）< `Client.Timeout`（整个请求）。每层超时针对不同阶段，需要合理搭配。
2. **Context 超时优先级最高**：`req.WithContext(ctx)` 中 context 的 deadline 如果早于 `Client.Timeout`，会以 context 为准。建议在业务层用 context 控制超时。
3. **Deadline 是绝对时间**：`net.Conn.SetReadDeadline` 设置的是 wall clock 时间点，不是持续时长。每次读写后如果要续期，需要重新调用 `SetReadDeadline`。

---

## 6. 重试机制

网络请求不可能 100% 成功，合理的重试策略能大幅提高系统可靠性。

### 指数退避 + 抖动

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

**讲解重点：**

1. **指数退避避免雪崩**：固定间隔重试在大量客户端同时失败时会在同一时刻产生重试洪峰。指数退避（`delay * 2^attempt`）加随机抖动（jitter）能有效分散重试压力。
2. **只重试可重试的错误**：网络超时、5xx 服务端错误可以重试；4xx 客户端错误（如 400、401、403）重试没有意义。POST 等非幂等请求需要慎重考虑重试，可能导致重复操作。
3. **重试必须有上限和总超时**：重试次数有限（MaxRetries）、每次等待有上限（MaxDelay）、整体受 context 控制。三层保护缺一不可。

---

## 7. 限流

限流保护下游服务不被过量请求压垮，是微服务架构中的基础能力。

### 使用 time.Ticker 简易限流

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

### 使用 golang.org/x/time/rate（令牌桶）

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

**讲解重点：**

1. **令牌桶 vs 漏桶**：`rate.Limiter` 实现的是令牌桶算法——令牌按固定速率产生，请求需要消耗令牌。`burst` 参数允许一定量的突发流量，比漏桶更灵活。
2. **三种使用方式场景不同**：`Wait` 适合阻塞式限流（如定时任务）；`Allow` 适合非阻塞快速拒绝（如 HTTP 中间件返回 429）；`Reserve` 适合需要知道等待时间的场景。
3. **限流器是并发安全的**：`rate.Limiter` 内部用原子操作实现，可以被多个 goroutine 并发使用，不需要额外加锁。

---

## 8. 中间件设计

中间件（Middleware）是 Go HTTP 服务中最重要的设计模式之一，用于在请求处理前后注入通用逻辑。

### 中间件基本模式

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// Middleware 类型：接收一个 Handler，返回一个新的 Handler
type Middleware func(http.Handler) http.Handler

// LoggingMiddleware 日志中间件
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 用 ResponseRecorder 捕获状态码
		rec := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(rec, r) // 调用下一层

		log.Printf("[%s] %s %s %d %v",
			r.Method, r.URL.Path, r.RemoteAddr,
			rec.statusCode, time.Since(start))
	})
}

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

// RecoveryMiddleware panic 恢复中间件
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// AuthMiddleware 认证中间件
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return // 不调用 next，终止链路
		}
		// 验证 token...
		next.ServeHTTP(w, r)
	})
}

// CORSMiddleware CORS 中间件
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Chain 将多个中间件串联
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	// 从后往前包裹，使得第一个中间件在最外层
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func main() {
	// 业务 Handler
	helloHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, World!")
	})

	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("something went wrong")
	})

	mux := http.NewServeMux()

	// 手动嵌套
	mux.Handle("/hello", LoggingMiddleware(AuthMiddleware(helloHandler)))

	// 使用 Chain 函数组合（更清晰）
	mux.Handle("/api/hello", Chain(
		helloHandler,
		RecoveryMiddleware,
		LoggingMiddleware,
		CORSMiddleware,
		AuthMiddleware,
	))

	// 不需要认证的路由
	mux.Handle("/panic", Chain(
		panicHandler,
		RecoveryMiddleware,
		LoggingMiddleware,
	))

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", mux)
}
```

### 带参数的中间件工厂

```go
package main

import (
	"fmt"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

// RateLimitMiddleware 限流中间件工厂
func RateLimitMiddleware(rps float64, burst int) func(http.Handler) http.Handler {
	limiter := rate.NewLimiter(rate.Limit(rps), burst)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow() {
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// TimeoutMiddleware 超时中间件工厂
func TimeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.TimeoutHandler(next, timeout, "Request Timeout")
	}
}

func main() {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

	// 使用带参数的中间件
	limited := RateLimitMiddleware(10, 20)(handler)
	timed := TimeoutMiddleware(5 * time.Second)(limited)

	http.Handle("/", timed)

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
```

**讲解重点：**

1. **中间件本质是函数装饰器**：接收 `http.Handler` 返回 `http.Handler`，在调用 `next.ServeHTTP` 前后注入逻辑。不调用 `next` 就终止了请求链路（如认证失败）。
2. **Chain 的顺序很重要**：Recovery 应该在最外层（最先执行），这样才能捕获所有内层的 panic。Logging 通常也在外层，以记录完整的请求生命周期。
3. **ResponseWriter 包装器**：标准 `http.ResponseWriter` 写入后无法读取状态码，需要用包装器（如 `statusRecorder`）拦截 `WriteHeader` 调用来记录。

---

## 9. JSON 编解码

`encoding/json` 是 Go 中最常用的序列化包，掌握它的细节能避免很多线上问题。

### 基本用法与 struct tags

```go
package main

import (
	"encoding/json"
	"fmt"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email,omitempty"` // 空值不序列化
	Password  string    `json:"-"`               // 永远不序列化
	Age       int       `json:"age,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	IsAdmin   bool      `json:"is_admin"`
	Tags      []string  `json:"tags,omitempty"`
	Score     *float64  `json:"score,omitempty"` // 指针可以区分零值和缺失

	// 嵌入匿名结构体的字段会提升到外层
	Address `json:"address,omitempty"`
}

type Address struct {
	City    string `json:"city,omitempty"`
	Country string `json:"country,omitempty"`
}

func main() {
	score := 95.5
	user := User{
		ID:        1,
		Name:      "Alice",
		Email:     "alice@example.com",
		Password:  "secret123",     // 不会出现在 JSON 中
		Age:       0,               // omitempty，零值会被忽略
		CreatedAt: time.Now(),
		IsAdmin:   false,           // bool 零值 false 不会被 omitempty 忽略（因为无 omitempty）
		Score:     &score,
		Address:   Address{City: "Beijing", Country: "China"},
	}

	// Marshal：struct -> JSON
	data, err := json.Marshal(user)
	if err != nil {
		panic(err)
	}
	fmt.Println("Compact:", string(data))

	// MarshalIndent：格式化输出
	pretty, _ := json.MarshalIndent(user, "", "  ")
	fmt.Println("Pretty:", string(pretty))

	// Unmarshal：JSON -> struct
	jsonStr := `{
		"id": 2,
		"name": "Bob",
		"email": "bob@example.com",
		"created_at": "2024-01-01T00:00:00Z",
		"is_admin": true,
		"unknown_field": "this will be ignored"
	}`

	var user2 User
	if err := json.Unmarshal([]byte(jsonStr), &user2); err != nil {
		panic(err)
	}
	fmt.Printf("Parsed: %+v\n", user2)
	// 注意：unknown_field 被静默忽略了
}
```

### 自定义 Marshaler / Unmarshaler

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// UnixTime 自定义类型：序列化为 Unix 时间戳
type UnixTime time.Time

func (t UnixTime) MarshalJSON() ([]byte, error) {
	stamp := time.Time(t).Unix()
	return json.Marshal(stamp)
}

func (t *UnixTime) UnmarshalJSON(data []byte) error {
	var stamp int64
	if err := json.Unmarshal(data, &stamp); err != nil {
		return err
	}
	*t = UnixTime(time.Unix(stamp, 0))
	return nil
}

func (t UnixTime) String() string {
	return time.Time(t).Format("2006-01-02 15:04:05")
}

// Status 枚举类型
type Status int

const (
	StatusActive   Status = 1
	StatusInactive Status = 2
	StatusBanned   Status = 3
)

var statusNames = map[Status]string{
	StatusActive:   "active",
	StatusInactive: "inactive",
	StatusBanned:   "banned",
}

var statusValues = map[string]Status{
	"active":   StatusActive,
	"inactive": StatusInactive,
	"banned":   StatusBanned,
}

func (s Status) MarshalJSON() ([]byte, error) {
	name, ok := statusNames[s]
	if !ok {
		return nil, fmt.Errorf("unknown status: %d", s)
	}
	return json.Marshal(name)
}

func (s *Status) UnmarshalJSON(data []byte) error {
	var name string
	if err := json.Unmarshal(data, &name); err != nil {
		return err
	}
	val, ok := statusValues[strings.ToLower(name)]
	if !ok {
		return fmt.Errorf("unknown status: %s", name)
	}
	*s = val
	return nil
}

type Event struct {
	Name      string   `json:"name"`
	Status    Status   `json:"status"`
	CreatedAt UnixTime `json:"created_at"`
}

func main() {
	event := Event{
		Name:      "deploy",
		Status:    StatusActive,
		CreatedAt: UnixTime(time.Now()),
	}

	data, _ := json.MarshalIndent(event, "", "  ")
	fmt.Println("Serialized:", string(data))
	// 输出：{"name":"deploy","status":"active","created_at":1700000000}

	// 反序列化
	jsonStr := `{"name":"rollback","status":"banned","created_at":1700000000}`
	var event2 Event
	json.Unmarshal([]byte(jsonStr), &event2)
	fmt.Printf("Deserialized: %+v\n", event2)
	fmt.Printf("Time: %s\n", event2.CreatedAt)
}
```

### 流式解码（处理大 JSON）

```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Record struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func main() {
	// 模拟一个大的 JSON 数组流
	jsonStream := `[
		{"id": 1, "name": "Alice"},
		{"id": 2, "name": "Bob"},
		{"id": 3, "name": "Charlie"},
		{"id": 4, "name": "Diana"}
	]`

	decoder := json.NewDecoder(strings.NewReader(jsonStream))

	// 读取开头的 '['
	token, err := decoder.Token()
	if err != nil {
		panic(err)
	}
	fmt.Println("Start:", token)

	// 逐个解码数组元素（内存友好）
	for decoder.More() {
		var record Record
		if err := decoder.Decode(&record); err != nil {
			panic(err)
		}
		fmt.Printf("Record: %+v\n", record)
	}

	// 读取结尾的 ']'
	token, _ = decoder.Token()
	fmt.Println("End:", token)

	// ========================================
	// json.Decoder 也常用于 HTTP 请求解码
	// ========================================
	// func handler(w http.ResponseWriter, r *http.Request) {
	//     var req MyRequest
	//     decoder := json.NewDecoder(r.Body)
	//     decoder.DisallowUnknownFields() // 严格模式：不允许未知字段
	//     if err := decoder.Decode(&req); err != nil {
	//         http.Error(w, err.Error(), http.StatusBadRequest)
	//         return
	//     }
	//     // 确保只有一个 JSON 对象
	//     if decoder.More() {
	//         http.Error(w, "unexpected extra data", http.StatusBadRequest)
	//         return
	//     }
	// }
}
```

**讲解重点：**

1. **`omitempty` 对不同类型的行为不同**：数值零值（0）、空字符串、nil 指针、空 slice/map 都被视为"空"而被忽略。但 `false` 对 bool 来说是零值，如果你的业务需要区分"未设置"和"false"，用 `*bool` 指针。
2. **实现 `json.Marshaler` / `json.Unmarshaler` 接口**可以完全控制序列化行为。常见场景：时间格式自定义、枚举字符串化、敏感字段脱敏。
3. **流式解码 `json.NewDecoder` vs `json.Unmarshal`**：对于大 JSON 文件或 HTTP 请求体，用 `Decoder` 可以边读边解析，不用把整个 JSON 加载到内存。`DisallowUnknownFields` 可以在 API 中启用严格校验。

---

## 10. 文件与 IO

Go 的 `io` 包围绕 `Reader` 和 `Writer` 两个接口构建了整个 IO 体系，这是理解标准库的关键。

### io.Reader / io.Writer 核心接口

```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"
)

// io.Reader 接口：Read(p []byte) (n int, err error)
// io.Writer 接口：Write(p []byte) (n int, err error)
// 一切 IO 操作都基于这两个接口

func main() {
	// strings.Reader 实现了 io.Reader
	reader := strings.NewReader("Hello, Go IO!")

	// os.Stdout 实现了 io.Writer
	// io.Copy 是最通用的数据传输方式
	fmt.Println("=== io.Copy ===")
	io.Copy(os.Stdout, reader)
	fmt.Println()

	// bytes.Buffer 同时实现了 Reader 和 Writer
	fmt.Println("\n=== bytes.Buffer ===")
	var buf bytes.Buffer
	buf.WriteString("Hello ")
	buf.Write([]byte("World"))
	fmt.Println(buf.String())

	// io.MultiReader：串联多个 Reader
	fmt.Println("\n=== io.MultiReader ===")
	r1 := strings.NewReader("Part 1, ")
	r2 := strings.NewReader("Part 2, ")
	r3 := strings.NewReader("Part 3")
	multi := io.MultiReader(r1, r2, r3)
	io.Copy(os.Stdout, multi)
	fmt.Println()

	// io.TeeReader：读取同时写到另一个 Writer（类似 tee 命令）
	fmt.Println("\n=== io.TeeReader ===")
	original := strings.NewReader("important data")
	var backup bytes.Buffer
	tee := io.TeeReader(original, &backup)
	io.Copy(os.Stdout, tee) // 读取内容
	fmt.Println()
	fmt.Println("Backup:", backup.String()) // 同时写入了 backup

	// io.LimitReader：限制读取量
	fmt.Println("\n=== io.LimitReader ===")
	bigReader := strings.NewReader("This is a very long string that we want to limit")
	limited := io.LimitReader(bigReader, 10)
	data, _ := io.ReadAll(limited)
	fmt.Println("Limited:", string(data)) // 只读了 10 字节

	// io.Pipe：同步内存管道
	fmt.Println("\n=== io.Pipe ===")
	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		for i := 0; i < 3; i++ {
			fmt.Fprintf(pw, "Line %d\n", i)
		}
	}()
	io.Copy(os.Stdout, pr)
}
```

### bufio 缓冲 IO

```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// === bufio.Scanner：按行读取（最常用） ===
	fmt.Println("=== Scanner ===")
	input := "line1\nline2\nline3\n"
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		fmt.Println("Line:", scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("Scanner error:", err)
	}

	// 自定义分隔符
	fmt.Println("\n=== Custom split ===")
	csvData := "a,b,c,d,e"
	scanner2 := bufio.NewScanner(strings.NewReader(csvData))
	scanner2.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		for i := 0; i < len(data); i++ {
			if data[i] == ',' {
				return i + 1, data[:i], nil
			}
		}
		if atEOF && len(data) > 0 {
			return len(data), data, nil
		}
		return 0, nil, nil
	})
	for scanner2.Scan() {
		fmt.Println("Token:", scanner2.Text())
	}

	// === bufio.Writer：缓冲写入 ===
	fmt.Println("\n=== Buffered Writer ===")
	writer := bufio.NewWriter(os.Stdout)
	writer.WriteString("buffered ")
	writer.WriteString("output ")
	writer.WriteString("here\n")
	writer.Flush() // 必须 Flush，否则数据还在缓冲区

	// === bufio.ReadWriter：同时缓冲读写 ===
	// 常用于网络连接的读写
}
```

### 文件操作

```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func main() {
	tempDir := os.TempDir()
	testFile := filepath.Join(tempDir, "go_io_test.txt")

	// === 创建并写入文件 ===
	fmt.Println("=== Write File ===")
	f, err := os.Create(testFile)
	if err != nil {
		panic(err)
	}

	// 使用 bufio.Writer 提升写入性能
	writer := bufio.NewWriter(f)
	for i := 0; i < 5; i++ {
		fmt.Fprintf(writer, "Line %d: Hello, File IO!\n", i)
	}
	writer.Flush() // 把缓冲区刷到文件
	f.Close()

	// === 读取整个文件 ===
	fmt.Println("=== Read All ===")
	data, err := os.ReadFile(testFile)
	if err != nil {
		panic(err)
	}
	fmt.Print(string(data))

	// === 逐行读取文件 ===
	fmt.Println("=== Read Lines ===")
	f2, _ := os.Open(testFile)
	defer f2.Close()
	scanner := bufio.NewScanner(f2)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		fmt.Printf("%d: %s\n", lineNum, scanner.Text())
	}

	// === 追加写入 ===
	fmt.Println("\n=== Append ===")
	f3, _ := os.OpenFile(testFile, os.O_APPEND|os.O_WRONLY, 0644)
	f3.WriteString("Appended line\n")
	f3.Close()

	// === 文件复制（io.Copy） ===
	fmt.Println("=== Copy File ===")
	copyFile := filepath.Join(tempDir, "go_io_copy.txt")
	src, _ := os.Open(testFile)
	dst, _ := os.Create(copyFile)
	written, err := io.Copy(dst, src)
	src.Close()
	dst.Close()
	fmt.Printf("Copied %d bytes\n", written)

	// === 检查文件是否存在 ===
	if info, err := os.Stat(testFile); err == nil {
		fmt.Printf("File: %s, Size: %d, ModTime: %v\n", info.Name(), info.Size(), info.ModTime())
	}

	// === 遍历目录 ===
	fmt.Println("\n=== Walk Directory ===")
	filepath.WalkDir(tempDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && path != tempDir {
			return filepath.SkipDir // 不递归子目录
		}
		if filepath.Ext(path) == ".txt" {
			fmt.Println("Found:", filepath.Base(path))
		}
		return nil
	})

	// === 临时文件 ===
	fmt.Println("\n=== Temp File ===")
	tmpFile, _ := os.CreateTemp("", "myapp-*.txt")
	fmt.Println("Temp file:", tmpFile.Name())
	tmpFile.WriteString("temporary data")
	tmpFile.Close()
	os.Remove(tmpFile.Name()) // 用完记得删除

	// 清理测试文件
	os.Remove(testFile)
	os.Remove(copyFile)
}
```

### io.Pipe 实战：流式处理

```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
}

func main() {
	// io.Pipe 创建一个同步管道
	// 写入端和读取端在不同 goroutine 中运行
	// 写入会阻塞直到有人读取，反之亦然

	pr, pw := io.Pipe()

	// 生产者：生成 JSON 流
	go func() {
		encoder := json.NewEncoder(pw)
		entries := []LogEntry{
			{Level: "INFO", Message: "Server started"},
			{Level: "WARN", Message: "High memory usage"},
			{Level: "ERROR", Message: "Connection refused"},
		}
		for _, entry := range entries {
			if err := encoder.Encode(entry); err != nil {
				pw.CloseWithError(err)
				return
			}
		}
		pw.Close()
	}()

	// 消费者：逐条解码
	decoder := json.NewDecoder(pr)
	for {
		var entry LogEntry
		if err := decoder.Decode(&entry); err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("Decode error:", err)
			break
		}
		fmt.Fprintf(os.Stdout, "[%s] %s\n", entry.Level, entry.Message)
	}
}
```

**讲解重点：**

1. **`io.Reader` / `io.Writer` 是 Go IO 的基石**：文件、网络连接、HTTP Body、压缩流、加密流都实现了这两个接口。掌握它们就掌握了整个 IO 体系，可以像搭积木一样组合各种 IO 操作。
2. **`bufio` 显著提升 IO 性能**：直接调用 `os.File.Write` 每次都会触发系统调用，`bufio.Writer` 在内存中积攒数据，减少系统调用次数。记得最后调用 `Flush()`。
3. **`io.Pipe` 实现生产者-消费者模式**：零缓冲的同步管道，适合在一个 goroutine 生成数据、另一个消费数据的场景。常用于 HTTP multipart upload、流式 JSON 处理等。
