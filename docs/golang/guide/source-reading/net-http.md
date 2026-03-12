---
title: net/http 源码精读
description: 精读 net/http Server、Transport、ServeMux 实现，理解 HTTP 服务端与客户端底层原理。
---

# net/http 包：HTTP 实现源码精读

> 核心源码：`src/net/http/server.go`、`src/net/http/transport.go`

## 包结构图

```
net/http 包结构
══════════════════════════════════════════════════════════════════

  服务端
  ├── Server          ← HTTP 服务器（Accept 循环 + goroutine 池）
  ├── ServeMux        ← 默认路由复用器
  ├── Handler         ← 接口：ServeHTTP(ResponseWriter, *Request)
  ├── ResponseWriter  ← 接口：响应写入
  └── conn            ← 每个连接对应一个（内部类型）

  客户端
  ├── Client          ← 高层客户端（封装 Transport）
  ├── Transport       ← 连接池 + HTTP/2 多路复用
  └── persistConn     ← 持久连接（内部类型）

  公共
  ├── Request         ← HTTP 请求（服务端收到 / 客户端发出）
  └── Response        ← HTTP 响应（服务端写出 / 客户端接收）

══════════════════════════════════════════════════════════════════
```

---

## 一、Server：服务端流程

```
HTTP 服务端请求处理流程
══════════════════════════════════════════════════════════════════

  ListenAndServe("addr", handler)
       │
       ▼
  net.Listen("tcp", addr)  ← 监听端口
       │
       ▼
  Serve(listener)
       │
       ▼
  ┌─── Accept() ───────────────────────────────────────┐
  │         │                                          │
  │         ▼                                          │
  │    go c.serve(ctx)  ← 每个连接启动一个 goroutine   │
  │         │                                          │
  └─────────┘（循环 Accept）                           │
             │                                         │
             ▼                                         │
       conn.serve(ctx)                                 │
       ├── 读取 HTTP 请求（readRequest）               │
       ├── 解析 Header / Body                          │
       ├── serverHandler.ServeHTTP(w, req)            │
       │       └── mux.ServeHTTP → 匹配路由 → Handler │
       └── 写响应（finishRequest）                     │
                                                       │
══════════════════════════════════════════════════════ ┘
```

### Server 关键结构

```
┌──────────────────────────────────────────────────────────┐
│                     http.Server                          │
│                                                          │
│  Addr           string        ← 监听地址                 │
│  Handler        Handler       ← 路由处理器               │
│  TLSConfig      *tls.Config   ← TLS 配置                │
│  ReadTimeout    time.Duration ← 读超时（含 Header+Body） │
│  WriteTimeout   time.Duration ← 写超时                  │
│  IdleTimeout    time.Duration ← Keep-Alive 空闲超时      │
│  MaxHeaderBytes int           ← Header 最大字节（1MB）   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 二、ServeMux：路由匹配

```
ServeMux 匹配规则
══════════════════════════════════════════════════════

  路由树（map[string]muxEntry）

  pattern 类型：
  ├── 精确匹配："/api/user"   → 只匹配 /api/user
  ├── 前缀匹配："/api/"       → 匹配所有 /api/ 开头的路径
  └── 根匹配：  "/"           → 兜底，匹配所有

  匹配优先级：
  精确 > 最长前缀 > 根路径

  示例：
  注册 "/images/"  和 "/images/thumb/"
  请求 /images/thumb/a.jpg → 匹配 /images/thumb/（更长）
  请求 /images/other.jpg   → 匹配 /images/

══════════════════════════════════════════════════════
```

---

## 三、Transport：客户端连接池

```
┌──────────────────────────────────────────────────────────────┐
│                     http.Transport                           │
│                                                              │
│  idleConn  map[connectMethodKey][]*persistConn              │
│                 ↑ 连接池（按 host:port+scheme 分组）        │
│                                                              │
│  MaxIdleConns        int  ← 全局最大空闲连接（默认 100）    │
│  MaxIdleConnsPerHost int  ← 每 host 最大空闲（默认 2）      │
│  MaxConnsPerHost     int  ← 每 host 最大总连接              │
│  IdleConnTimeout     time.Duration ← 空闲超时（默认 90s）   │
│                                                              │
│  RoundTrip 流程：                                            │
│  ├── 从连接池取空闲 persistConn                             │
│  ├── 无空闲 → 新建连接（Dial）                              │
│  ├── 写请求 → 读响应                                        │
│  └── 响应 Body 读完 → 连接归还连接池                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

⚠️ 常见陷阱：
  resp.Body 必须读完并 Close，否则连接不归还池，导致连接泄漏
```

---

## 四、代码示例

### 生产级 HTTP 服务端

```go
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /api/users", listUsers)
    mux.HandleFunc("POST /api/users", createUser)

    srv := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  5 * time.Second,
        WriteTimeout: 10 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // 优雅关闭
    go func() {
        sigCh := make(chan os.Signal, 1)
        signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
        <-sigCh

        ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
        defer cancel()
        srv.Shutdown(ctx)
    }()

    log.Fatal(srv.ListenAndServe())
}

func listUsers(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode([]string{"alice", "bob"})
}

func createUser(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusCreated)
}
```

### 生产级 HTTP 客户端

```go
var httpClient = &http.Client{
    Timeout: 10 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
        // 连接建立超时
        DialContext: (&net.Dialer{
            Timeout:   5 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,
    },
}

func fetch(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close() // 必须关闭，归还连接到池

    return io.ReadAll(io.LimitReader(resp.Body, 10<<20)) // 限制 10MB
}
```

### 中间件链

```go
type Middleware func(http.Handler) http.Handler

// 日志中间件
func Logger(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

// 组合中间件
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 每个连接用几个 goroutine？ | 1 个（`go c.serve(ctx)`） |
| http.DefaultClient 有超时吗？ | 无，生产必须自定义 Client 并设置 Timeout |
| Body 不关闭会怎样？ | 连接不归还池，连接泄漏，最终耗尽 fd |
| MaxIdleConnsPerHost 默认值？ | 2，高并发场景应调大（如 100） |
| HTTP/2 多路复用在哪层？ | Transport 层，多个请求复用同一 TCP 连接 |
| ServeMux 支持路径参数吗？ | Go 1.22+ 原生支持 `/user/{id}`，旧版不支持 |
