---
title: net/http 服务端高级模式源码精读
description: 精读 net/http Server 的连接生命周期、middleware 链设计、graceful shutdown、Server-Sent Events 与连接劫持最佳实践。
---

# net/http 服务端高级模式：源码精读

> 核心源码：`src/net/http/server.go`
>
> 图例参考：复用 [HTTP 服务端、客户端、TCP/UDP](../04-http-server-client-tcp-udp.md) 和 [连接池、超时、重试与限流](../04-connection-timeout-retry-rate-limit.md) 里的服务端流程、优雅关闭、中间件链图例，先把连接生命周期和关闭顺序看清，再读 `conn.serve`。

这篇是 `net/http` 服务端方向的深挖页，重点是连接生命周期、middleware、graceful shutdown、SSE 和连接劫持。

如果你还没建立 `net/http` 的整体认知，建议先看总览页：

- 总览：[net/http 源码精读](./net-http.md)

如果你关心的是客户端连接池和超时治理，而不是服务端，请看：

- Transport：[net/http Transport 深度解析](./net-http-transport.md)

## 包结构图

<GoNetworkDiagram kind="http-server-flow" />

```
net/http Server 体系
══════════════════════════════════════════════════════════════════

  http.Server
  ├── Addr          string          ← 监听地址
  ├── Handler       http.Handler    ← 根 Handler（通常是 Mux）
  ├── ReadTimeout   time.Duration   ← 读取整个请求的超时
  ├── WriteTimeout  time.Duration   ← 写入响应的超时
  ├── IdleTimeout   time.Duration   ← Keep-Alive 空闲超时
  ├── ConnState     func(net.Conn, ConnState) ← 连接状态钩子
  └── RegisterOnShutdown(func())   ← 优雅关闭回调

  连接状态机：
  New → Active → Idle → Active → ...
                  ↓
               Hijacked（连接劫持，WebSocket 用）
                  ↓
               Closed

  Handler 接口（核心）：
  type Handler interface {
      ServeHTTP(ResponseWriter, *Request)
  }
  ├── HandlerFunc  ← func 适配为 Handler
  ├── ServeMux     ← 路由复用器
  └── 第三方路由（chi/gin）包装此接口

  Middleware 洋葱模型：
  Request → [Auth] → [Rate] → [Log] → Handler
  Response ← [Auth] ← [Rate] ← [Log] ← Handler

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/net/http/server.go（简化）

// Server.Serve 核心循环：accept 连接 → goroutine 处理
func (srv *Server) Serve(l net.Listener) error {
    for {
        rw, err := l.Accept()
        if err != nil { /* 处理关闭 */ }

        c := srv.newConn(rw)
        c.setState(c.rwc, StateNew, runHooks) // 触发 ConnState 钩子
        go c.serve(connCtx)                  // 每个连接一个 goroutine
    }
}

// conn.serve：处理单个连接（Keep-Alive 复用）
func (c *conn) serve(ctx context.Context) {
    for {
        w, err := c.readRequest()  // 读取请求
        // 调用 Handler（通过 ServeMux 路由）
        serverHandler{c.server}.ServeHTTP(w, w.req)
        w.finishRequest()          // 刷新响应
        if !w.shouldReuseConnection() {
            return // 关闭连接
        }
        c.setState(c.rwc, StateIdle, runHooks)
    }
}
```

---

## 二、代码示例

### 生产级 Server 配置

<GoNetworkDiagram kind="graceful-shutdown" />

```go
import (
    "context"
    "net/http"
    "os/signal"
    "syscall"
    "time"
)

func startServer(handler http.Handler) error {
    srv := &http.Server{
        Addr:    ":8080",
        Handler: handler,

        // 超时防护（必须设置，防止慢客户端耗尽资源）
        ReadTimeout:       15 * time.Second, // 读取整个请求（含 Body）
        ReadHeaderTimeout: 5 * time.Second,  // 仅读取请求头（更严格）
        WriteTimeout:      30 * time.Second, // 写响应超时
        IdleTimeout:       120 * time.Second,// Keep-Alive 空闲超时

        // 最大请求头大小（防止头部攻击）
        MaxHeaderBytes: 1 << 20, // 1MB
    }

    // 优雅关闭：监听 SIGINT / SIGTERM
    ctx, stop := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    // 后台启动
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("server error: %v", err)
        }
    }()

    log.Println("server started on :8080")
    <-ctx.Done() // 等待信号

    // 优雅关闭：等最多 30s 完成在途请求
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(shutdownCtx); err != nil {
        return fmt.Errorf("shutdown error: %w", err)
    }
    log.Println("server shutdown gracefully")
    return nil
}
```

这里的 `context.Background()` 也是**刻意为之**：

- `signal.NotifyContext(context.Background(), ...)` 管的是**进程生命周期**
- `srv.Shutdown(context.WithTimeout(...))` 管的是**服务关闭窗口**
- 这和 Handler 里的请求上下文不是一回事，不要混用

### 请求 Context 生命周期：请求一结束就会取消

对服务端收到的 HTTP 请求来说，`r.Context()` 会在下面几种情况失效：

- 客户端连接关闭
- HTTP/2 请求被取消
- `ServeHTTP` 返回

因此在 Handler 中：

- 请求内的 DB / Redis / RPC / HTTP 下游调用，应继续透传 `r.Context()`
- 需要在请求结束后继续执行的离线任务，不应直接复用 `r.Context()`

```go
func getOrder(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()

    order, err := orderService.Get(ctx, r.PathValue("id"))
    if err != nil {
        http.Error(w, err.Error(), http.StatusGatewayTimeout)
        return
    }

    _ = json.NewEncoder(w).Encode(order)
}
```

如果你要在请求结束后继续写审计日志、异步补偿或发通知，应该改用 `context.WithoutCancel(r.Context())`（Go 1.21+）或 `context.Background()` 重建任务边界，并重新设置独立超时。

### Middleware 链：洋葱模型

<GoNetworkDiagram kind="middleware-chain" />

```go
// Middleware 类型定义：接收 Handler 返回 Handler
type Middleware func(http.Handler) http.Handler

// 链式组合（从右到左包裹）
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}

// 1. 请求日志
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        // 包装 ResponseWriter 以捕获状态码
        lrw := &loggingResponseWriter{ResponseWriter: w, statusCode: 200}
        next.ServeHTTP(lrw, r)
        log.Printf("%s %s %d %v", r.Method, r.URL.Path,
            lrw.statusCode, time.Since(start))
    })
}

type loggingResponseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
    lrw.statusCode = code
    lrw.ResponseWriter.WriteHeader(code)
}

// 2. 请求 ID（追踪）
type contextKey string

const requestIDKey contextKey = "requestID"

func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Request-ID")
        if id == "" {
            id = fmt.Sprintf("%d", time.Now().UnixNano())
        }
        ctx := context.WithValue(r.Context(), requestIDKey, id)
        w.Header().Set("X-Request-ID", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 3. Rate Limiting（令牌桶）
func RateLimitMiddleware(rps int) Middleware {
    limiter := rate.NewLimiter(rate.Limit(rps), rps)
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

// 4. Recovery（panic 防护）
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("panic: %v\n%s", err, debug.Stack())
                http.Error(w, "Internal Server Error", 500)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// 组合：
func buildRouter() http.Handler {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /users/{id}", getUserHandler)
    mux.HandleFunc("POST /users", createUserHandler)

    return Chain(mux,
        RecoveryMiddleware,
        LoggingMiddleware,
        RequestIDMiddleware,
        RateLimitMiddleware(100),
    )
}
```

### Server-Sent Events（SSE）：服务器推送

```go
// SSE：无需 WebSocket，HTTP 单向推送（实时日志/进度/通知）
func sseHandler(w http.ResponseWriter, r *http.Request) {
    // 设置 SSE 响应头
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")
    w.Header().Set("Access-Control-Allow-Origin", "*")

    // 获取底层 Flusher（SSE 需要逐行 flush）
    flusher, ok := w.(http.Flusher)
    if !ok {
        http.Error(w, "SSE not supported", 500)
        return
    }

    // 订阅事件（示例：定时发送）
    ticker := time.NewTicker(time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-r.Context().Done():
            return // 客户端断开

        case t := <-ticker.C:
            // SSE 格式：data: ...\n\n
            fmt.Fprintf(w, "data: %s\n\n", t.Format(time.RFC3339))
            flusher.Flush() // 立即推送（不等缓冲区满）
        }
    }
}

// 带事件类型和 ID 的 SSE
func writeSSEEvent(w http.Flusher, rw http.ResponseWriter,
    eventType, data, id string) {
    if id != "" {
        fmt.Fprintf(rw, "id: %s\n", id)
    }
    if eventType != "" {
        fmt.Fprintf(rw, "event: %s\n", eventType)
    }
    fmt.Fprintf(rw, "data: %s\n\n", data)
    w.Flush()
}
```

### WebSocket 连接劫持

```go
// Hijack：从 HTTP 升级为 WebSocket（或其他协议）
func upgradeToWebSocket(w http.ResponseWriter, r *http.Request) {
    hijacker, ok := w.(http.Hijacker)
    if !ok {
        http.Error(w, "hijacking not supported", 500)
        return
    }

    // 发送 101 Switching Protocols
    w.Header().Set("Upgrade", "websocket")
    w.Header().Set("Connection", "Upgrade")
    w.WriteHeader(http.StatusSwitchingProtocols)

    // 劫持连接：获取底层 net.Conn
    conn, bufrw, err := hijacker.Hijack()
    if err != nil {
        return
    }
    defer conn.Close()

    // 此后直接操作 conn（HTTP 层退出，自行处理协议）
    // 生产中用 github.com/gorilla/websocket 或 nhooyr.io/websocket
    handleWebSocketConn(conn, bufrw)
}
```

### 连接状态监控

```go
// ConnState 钩子：追踪活跃连接数
type connectionTracker struct {
    mu     sync.Mutex
    active int
    idle   int
}

func (ct *connectionTracker) onStateChange(c net.Conn, state http.ConnState) {
    ct.mu.Lock()
    defer ct.mu.Unlock()
    switch state {
    case http.StateActive:
        ct.active++
        ct.idle--
    case http.StateIdle:
        ct.active--
        ct.idle++
    case http.StateClosed, http.StateHijacked:
        ct.active--
    }
}

func newTrackedServer(handler http.Handler) *http.Server {
    tracker := &connectionTracker{}
    srv := &http.Server{
        Handler:   handler,
        ConnState: tracker.onStateChange,
    }
    // 定期输出连接状态
    go func() {
        for range time.Tick(10 * time.Second) {
            tracker.mu.Lock()
            log.Printf("connections: active=%d idle=%d",
                tracker.active, tracker.idle)
            tracker.mu.Unlock()
        }
    }()
    return srv
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `ReadTimeout` 和 `ReadHeaderTimeout` 的区别？ | ReadTimeout 覆盖读取请求头+Body 全程；ReadHeaderTimeout 只限制读头时间（Body 上传不受限）；文件上传接口应只设 ReadHeaderTimeout |
| `Shutdown` 和 `Close` 的区别？ | Shutdown 等待在途请求完成（优雅）；Close 立即断开所有连接；生产中用 Shutdown + WithTimeout 兜底 |
| 为什么每个连接一个 goroutine 不会导致 OOM？ | Go goroutine 初始栈只有 2-8KB（按需扩展）；1 万并发连接只占约 80MB；但仍需设置超时防止慢连接占用 goroutine |
| Middleware 中如何捕获响应状态码？ | 标准 `http.ResponseWriter` 不暴露状态码；需包装一个自定义 `ResponseWriter`，拦截 `WriteHeader(code)` 调用并记录 code |
| SSE 与 WebSocket 如何选择？ | SSE：单向推送（服务→客户端），基于 HTTP，天然走代理/CDN，适合通知/日志/进度；WebSocket：双向，适合聊天/游戏/协作编辑 |
| `http.Hijacker` 接口用于什么场景？ | 升级协议（HTTP→WebSocket/HTTP2 fallback）；需要直接操作 TCP 字节流；劫持后 HTTP Server 不再管理该连接 |
