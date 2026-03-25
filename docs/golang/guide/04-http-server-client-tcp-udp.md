---
title: HTTP 服务端、客户端与 TCP/UDP
description: Go 网络编程基础专题，覆盖 net/http 服务端模型、http.Client 配置与 TCP UDP 基础。
search: false
---

# HTTP 服务端、客户端与 TCP/UDP

聚焦 Go 网络编程基础能力：先理解 `net/http` 服务端模型，再掌握 `http.Client` 的配置与常见陷阱，最后补齐 TCP / UDP 编程基础。

## 本页内容

- [1. net/http 服务端原理](#_1-net-http-服务端原理)
- [2. http.Client 使用与坑点](#_2-http-client-使用与坑点)
- [3. TCP/UDP 编程基础](#_3-tcp-udp-编程基础)

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

<GoNetworkDiagram kind="http-server-flow" />

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
		// 模拟耗时请求：请求内逻辑应继续透传 r.Context()
		select {
		case <-time.After(2 * time.Second):
			w.Write([]byte("done"))
		case <-r.Context().Done():
			// 客户端断开或请求已取消，尽快退出
			return
		}
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

<GoNetworkDiagram kind="graceful-shutdown" />

**讲解重点：**

1. **每个连接一个 goroutine**：`ListenAndServe` 内部对每个 Accept 到的连接启动独立 goroutine，这是 Go HTTP 服务高并发的基础，但也意味着需要注意 goroutine 泄漏。
2. **避免使用 DefaultServeMux**：`http.HandleFunc` 注册到全局 `DefaultServeMux`，在测试和多模块项目中容易产生路由冲突，推荐用 `http.NewServeMux()` 创建独立路由。
3. **Graceful Shutdown 是生产必备**：`server.Shutdown` 会停止接收新连接，等待已有请求处理完毕后再退出，避免请求被截断。
4. **区分进程级 ctx 和请求级 ctx**：这里 `server.Shutdown` 使用 `context.Background()` 是合理的，因为它描述的是进程退出流程；但 Handler 内部调 DB / RPC 时，应继续透传 `r.Context()`，不要切断请求的取消链路。

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

<GoNetworkDiagram kind="http-client-pool" />

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

<GoNetworkDiagram kind="tcp-vs-udp" />

**讲解重点：**

1. **TCP 是面向连接的流协议**：数据没有边界，需要自己定义消息分隔（如换行符、长度前缀）。`bufio.Scanner` 默认按行分割，是处理文本协议的常用方式。
2. **UDP 是无连接的报文协议**：每个 `ReadFromUDP` 读到的就是一个完整数据包，不需要消息分隔。但不可靠，可能丢包、乱序。
3. **Deadline vs Timeout**：`net.Conn.SetReadDeadline` 是设置绝对截止时间，不是相对超时。每次操作后需要重新设置，否则后续操作可能立即超时。

---
