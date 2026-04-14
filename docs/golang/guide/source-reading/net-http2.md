---
title: golang.org/x/net/http2 源码精读
description: 精读 Go HTTP/2 实现，掌握多路复用、Server Push、流量控制、HPACK 头压缩与生产 HTTP/2 服务配置最佳实践。
---

# golang.org/x/net/http2：HTTP/2 协议深度解析

> 核心源码：`golang.org/x/net/http2`（已集成进 `net/http` 标准库）
>
> 图例参考：
> - `GoNetworkDiagram`：`http2-multiplex`

## 包结构图

```
HTTP/2 体系
══════════════════════════════════════════════════════════════════

  HTTP/1.1 vs HTTP/2 对比：
  ┌──────────────────────┬──────────────┬────────────────────────┐
  │ 特性                 │ HTTP/1.1     │ HTTP/2                 │
  ├──────────────────────┼──────────────┼────────────────────────┤
  │ 连接数               │ 6-8 个并行   │ 1 个连接（多路复用）   │
  │ 队头阻塞             │ 有           │ 无（帧级别并发）       │
  │ 头部                 │ 文本（重复） │ HPACK 压缩（索引表）   │
  │ 服务端推送           │ 不支持       │ 支持（Server Push）    │
  │ 优先级               │ 无           │ 流优先级+权重          │
  │ 连接复用             │ Keep-Alive   │ 单连接多流（Stream）   │
  └──────────────────────┴──────────────┴────────────────────────┘

  HTTP/2 帧类型：
  ├── DATA      ← 请求/响应体
  ├── HEADERS   ← 请求/响应头（HPACK 压缩）
  ├── SETTINGS  ← 连接参数协商
  ├── PUSH_PROMISE ← Server Push 预告
  ├── WINDOW_UPDATE← 流量控制
  ├── PING      ← 连接保活
  ├── GOAWAY    ← 优雅关闭连接
  └── RST_STREAM← 重置单个流

  Go HTTP/2 激活方式：
  ├── HTTPS：自动激活（TLS ALPN 协商 h2）
  ├── http.ListenAndServeTLS → 自动 HTTP/2
  └── h2c（明文 HTTP/2）：需要显式配置

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="http2-multiplex" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// net/http 内部集成 http2（golang.org/x/net/http2）
// TLS 握手时通过 ALPN 协商协议：
// Client Hello: ALPN=["h2", "http/1.1"]
// Server Hello: ALPN="h2"（若服务器支持）
// → 后续通信使用 HTTP/2 帧格式

// HTTP/2 连接建立（Client Preface）：
// PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n  ← 魔数（24字节）
// + SETTINGS 帧                      ← 初始参数

// 多路复用：每个请求分配一个 Stream ID（奇数）
// Stream 1: GET /api/users
// Stream 3: GET /api/orders
// Stream 5: POST /api/events
// → 这 3 个请求在同一 TCP 连接上并发
```
:::

---

## 二、代码示例

### 启用 HTTP/2（自动）

::: details 点击展开代码：启用 HTTP/2（自动）
```go
import (
    "crypto/tls"
    "net/http"
    "golang.org/x/net/http2"
)

// HTTPS 服务器：自动启用 HTTP/2（无需额外配置）
func startHTTPS() error {
    srv := &http.Server{
        Addr:    ":443",
        Handler: http.DefaultServeMux,
        TLSConfig: &tls.Config{
            MinVersion: tls.VersionTLS12,
            // ALPN 自动设置为 ["h2", "http/1.1"]
        },
    }

    // ListenAndServeTLS 自动协商 HTTP/2
    return srv.ListenAndServeTLS("cert.pem", "key.pem")
}

// 验证 HTTP/2 是否生效
func checkHTTP2(url string) {
    resp, err := http.Get(url)
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    fmt.Printf("协议: %s\n", resp.Proto) // HTTP/2.0
}
```
:::

### h2c：明文 HTTP/2（不加密）

::: details 点击展开代码：h2c：明文 HTTP/2（不加密）
```go
import "golang.org/x/net/http2/h2c"

// h2c：在非 TLS 连接上使用 HTTP/2（内网服务间通信）
// 场景：gRPC（默认使用 h2c）、内部微服务
func startH2C() error {
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "协议: %s, Stream: %v", r.Proto, r.TLS == nil)
    })

    // h2c.NewHandler：兼容 HTTP/1.1 和明文 HTTP/2
    h2s := &http2.Server{
        MaxConcurrentStreams: 250, // 最大并发流（默认 250）
        MaxReadFrameSize:    1 << 20, // 最大帧大小（1MB）
    }
    h2cHandler := h2c.NewHandler(handler, h2s)

    srv := &http.Server{
        Addr:    ":8080",
        Handler: h2cHandler,
    }
    return srv.ListenAndServe()
}
```
:::

### Server Push：服务端主动推送资源

::: details 点击展开代码：Server Push：服务端主动推送资源
```go
// Server Push：在响应主 HTML 时，提前推送 CSS/JS
// 客户端收到 PUSH_PROMISE 帧后直接缓存，无需发起额外请求
func indexHandler(w http.ResponseWriter, r *http.Request) {
    // 检查客户端是否支持 Server Push
    pusher, ok := w.(http.Pusher)
    if ok {
        // 推送 CSS（浏览器会自动缓存，无需等 HTML 解析）
        opts := &http.PushOptions{
            Header: http.Header{
                "Accept-Encoding": r.Header["Accept-Encoding"],
            },
        }

        if err := pusher.Push("/static/style.css", opts); err != nil {
            log.Printf("Push CSS 失败: %v", err) // HTTP/1.1 不支持时忽略
        }

        if err := pusher.Push("/static/app.js", opts); err != nil {
            log.Printf("Push JS 失败: %v", err)
        }
    }

    // 响应主 HTML
    w.Header().Set("Content-Type", "text/html")
    fmt.Fprintf(w, `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/static/style.css">
    <script src="/static/app.js"></script>
</head>
<body><h1>Hello HTTP/2!</h1></body>
</html>`)
}

// ⚠️ Server Push 注意事项：
// 1. 现代浏览器逐步废弃 Push（Cache Digest 未标准化导致重复推送）
// 2. 更好的替代：Link: </static/style.css>; rel=preload 头部
// 3. gRPC 场景中 Push 不常用，主要用于 Web 加速
```
:::

### HTTP/2 Client：连接复用诊断

::: details 点击展开代码：HTTP/2 Client：连接复用诊断
```go
// HTTP/2 客户端：单连接多路复用（高并发场景优势明显）
func http2Client() {
    transport := &http.Transport{
        TLSClientConfig:    &tls.Config{InsecureSkipVerify: false},
        ForceAttemptHTTP2:  true, // 强制尝试 HTTP/2
        MaxIdleConnsPerHost: 1,   // HTTP/2 下通常只需 1 个连接
    }

    // 或者直接配置 http2.Transport
    t2 := &http2.Transport{
        TLSClientConfig: &tls.Config{},
        // 流量控制窗口
        InitialWindowSize:     65535,    // 流级别（默认 64KB）
        InitialConnWindowSize: 65535*10, // 连接级别（默认 640KB）
    }
    _ = t2

    client := &http.Client{Transport: transport}

    // 并发请求：复用同一 HTTP/2 连接
    var wg sync.WaitGroup
    results := make(chan string, 10)

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            resp, err := client.Get("https://httpbin.org/get")
            if err != nil {
                results <- fmt.Sprintf("error: %v", err)
                return
            }
            defer resp.Body.Close()
            io.Copy(io.Discard, resp.Body)
            results <- fmt.Sprintf("stream %d: %s", id, resp.Proto)
        }(i)
    }

    go func() { wg.Wait(); close(results) }()
    for r := range results {
        fmt.Println(r) // 所有请求都应该显示 HTTP/2.0
    }
}
```
:::

### HTTP/2 调优参数

::: details 点击展开代码：HTTP/2 调优参数
```go
import "golang.org/x/net/http2"

// 服务端 HTTP/2 精细调优
func configureHTTP2Server(srv *http.Server) error {
    h2srv := &http2.Server{
        // 最大并发流数（默认 250）
        // 超过此数量的请求会排队等待
        MaxConcurrentStreams: 500,

        // 最大帧大小（默认 16KB，最大 16MB）
        // 大文件传输时适当增大
        MaxReadFrameSize: 1 << 20, // 1MB

        // 空闲连接超时（默认 0=不关闭）
        IdleTimeout: 5 * time.Minute,

        // PING 保活（防止 NAT/防火墙断开空闲连接）
        // 每 30s 发送一次 PING，超过 15s 无响应则断开
    }

    return http2.ConfigureServer(srv, h2srv)
}

// 客户端 HTTP/2 调优
func configureHTTP2Client(t *http.Transport) error {
    return http2.ConfigureTransport(t)
}

// 查看连接使用的协议
func showNegotiatedProtocol(resp *http.Response) {
    if resp.TLS != nil {
        fmt.Printf("TLS 协商协议: %s\n", resp.TLS.NegotiatedProtocol)
    }
    fmt.Printf("HTTP 协议: %s\n", resp.Proto)
}
```
:::

### gRPC 与 HTTP/2

::: details 点击展开代码：gRPC 与 HTTP/2
```go
// gRPC 使用 HTTP/2 h2c（明文）作为传输层
// 理解 gRPC 底层有助于调试连接问题

// gRPC 帧映射：
// gRPC 请求  → HTTP/2 HEADERS + DATA 帧
// gRPC 响应  → HTTP/2 HEADERS + DATA 帧（trailer 也是 HEADERS）
// gRPC 流式  → 多个 DATA 帧（同一 Stream ID）
// gRPC 元数据→ HTTP/2 HEADERS（gRPC-metadata- 前缀）

// 诊断 HTTP/2 连接问题（GODEBUG 环境变量）
// GODEBUG=http2debug=1 → 打印帧级别调试信息
// GODEBUG=http2debug=2 → 更详细（含数据帧内容）
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| HTTP/2 多路复用如何解决 HTTP/1.1 的队头阻塞？ | HTTP/1.1 的队头阻塞发生在应用层（一个响应阻塞后续请求）；HTTP/2 将每个请求分配独立 Stream ID，帧可交错传输；⚠️ TCP 层的队头阻塞 HTTP/2 仍然存在（HTTP/3/QUIC 解决了这个问题）|
| HPACK 头压缩是如何工作的？ | 维护静态表（61 个常用头字段）和动态表（会话级别）；重复的头字段只发送索引号（1-2 字节）而非完整字符串；如 `GET /`、`content-type: application/json` 都只需 1 字节 |
| Go 中如何判断请求是否使用了 HTTP/2？ | 检查 `r.Proto == "HTTP/2.0"` 或 `resp.Proto`；服务端还可检查 `r.TLS.NegotiatedProtocol == "h2"` |
| Server Push 为什么正在被废弃？ | 浏览器无法告知服务端缓存状态（Cache Digest 未标准化），导致推送已缓存资源浪费带宽；`Link: <url>; rel=preload` 头部配合 103 Early Hints 是更好替代 |
| HTTP/2 和 gRPC 的关系？ | gRPC 以 HTTP/2 作为传输层（默认 h2c 明文）；gRPC 的 Streaming 对应 HTTP/2 的长流；gRPC 的 metadata 对应 HTTP/2 的 HEADERS 帧 |
| `MaxConcurrentStreams` 设置太大有什么风险？ | 单连接并发流过多会消耗大量内存（每个流有独立缓冲区）；也会增加服务端处理压力；默认 250 对大多数场景是合理值 |
