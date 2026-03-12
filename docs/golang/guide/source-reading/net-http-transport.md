---
title: net/http Transport 深度解析
description: 精读 net/http Transport 连接池实现，掌握 Keep-Alive 调优、超时级联、请求重试与反向代理最佳实践。
---

# net/http Transport：连接池与传输层深度解析

> 核心源码：`src/net/http/transport.go`、`src/net/http/persistconn.go`

## 包结构图

```
net/http 传输层体系
══════════════════════════════════════════════════════════════════

  http.Client
  └── Transport（http.RoundTripper 接口）
       └── *http.Transport（默认实现）

  Transport 连接池：
  ├── idleConn map[connectMethodKey][]*persistConn
  │    └── persistConn：复用的 TCP 连接（Keep-Alive）
  ├── idleConnCh map[connectMethodKey]chan *persistConn
  │    └── 等待可用连接的 goroutine channel
  ├── connsPerHostMap：每 host 当前连接数（限流）
  └── MaxIdleConnsPerHost（默认 2）→ ⚠️ 生产必须调大

  超时层次（Client 下钻顺序）：
  ┌────────────────────────────────────────────────────────────┐
  │ client.Timeout          ← 整个请求生命周期（最外层）      │
  │   ├── DialContext.Timeout  ← TCP 三次握手                 │
  │   ├── TLSHandshakeTimeout  ← TLS 握手                     │
  │   ├── ResponseHeaderTimeout← 等待第一个响应字节            │
  │   └── IdleConnTimeout      ← 空闲连接保持时长             │
  └────────────────────────────────────────────────────────────┘

  RoundTripper 接口：
  RoundTrip(*Request) (*Response, error)
  ├── 不跟随重定向（Client 层处理）
  ├── 不解析响应体（调用方负责 Close）
  └── 请求和响应 Headers 只读后不可改

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/net/http/transport.go（简化）

// Transport 是 http.Client 的默认传输层，负责 TCP 连接管理
type Transport struct {
    // 连接池配置
    MaxIdleConns        int           // 全局最大空闲连接数（默认 100）
    MaxIdleConnsPerHost int           // 每 host 最大空闲连接（默认 2 ⚠️ 生产中太小）
    MaxConnsPerHost     int           // 每 host 最大连接数（0=不限）
    IdleConnTimeout     time.Duration // 空闲连接保持时长（默认 90s）

    // 超时配置
    TLSHandshakeTimeout   time.Duration // TLS 握手超时（默认 10s）
    ResponseHeaderTimeout time.Duration // 等待响应头超时（默认无）
    ExpectContinueTimeout time.Duration // 100-continue 超时

    // 拨号配置
    DialContext func(ctx context.Context, network, addr string) (net.Conn, error)

    // HTTP/2
    ForceAttemptHTTP2 bool // 对 http:// 也尝试 h2c
}

// roundTrip 核心流程：
// 1. 从 idleConn 池取可用 persistConn
// 2. 没有则 dial 新连接（受 MaxConnsPerHost 限制）
// 3. 通过 persistConn.roundTrip 发送请求
// 4. 响应 Body 关闭后，连接归还连接池
```

---

## 二、代码示例

### 生产级 HTTP Client 配置

```go
import (
    "context"
    "crypto/tls"
    "net"
    "net/http"
    "time"
)

// 生产级 HTTP Client（全局单例复用）
func newHTTPClient() *http.Client {
    transport := &http.Transport{
        // 连接池：每 host 允许最多 100 个空闲连接
        MaxIdleConns:        1000,
        MaxIdleConnsPerHost: 100,  // 默认只有 2，高并发服务必须调大
        MaxConnsPerHost:     0,    // 不限制总连接数（由 MaxIdleConnsPerHost 控制）
        IdleConnTimeout:     90 * time.Second,

        // 超时
        TLSHandshakeTimeout:   10 * time.Second,
        ResponseHeaderTimeout: 30 * time.Second, // 防止服务端不响应
        ExpectContinueTimeout: 1 * time.Second,

        // TCP 拨号配置
        DialContext: (&net.Dialer{
            Timeout:   30 * time.Second, // TCP 建连超时
            KeepAlive: 30 * time.Second, // TCP Keep-Alive 心跳
        }).DialContext,

        // TLS 配置
        TLSClientConfig: &tls.Config{
            MinVersion: tls.VersionTLS12,
        },

        // 启用 HTTP/2（默认已开启，需要显式配置时使用）
        ForceAttemptHTTP2: true,
    }

    return &http.Client{
        Transport: transport,
        Timeout:   60 * time.Second, // 整个请求生命周期超时
        // CheckRedirect 默认跟随 10 次重定向
    }
}

// ⚠️ 必须是全局/包级别单例，不要在每次请求中 new 新 Client
var globalClient = newHTTPClient()
```

### 超时级联：按需设置不同阶段超时

```go
// 场景：下载大文件需要长超时，但首包要快速
func downloadFile(ctx context.Context, url string) (io.ReadCloser, error) {
    // 在请求级别覆盖超时（比 Client 级别更灵活）
    reqCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
    _ = cancel // 由 Body.Close 触发 cancel 是 ok 的

    req, _ := http.NewRequestWithContext(reqCtx, "GET", url, nil)
    req.Header.Set("Accept-Encoding", "gzip")

    resp, err := globalClient.Do(req)
    if err != nil {
        cancel()
        return nil, err
    }
    // 调用方负责 resp.Body.Close()（Close 时 cancel 也会触发）
    return resp.Body, nil
}

// 场景：API 调用需要严格控制每个阶段
func callAPI(endpoint string, payload []byte) (*http.Response, error) {
    transport := &http.Transport{
        DialContext:           (&net.Dialer{Timeout: 3 * time.Second}).DialContext,
        TLSHandshakeTimeout:   5 * time.Second,
        ResponseHeaderTimeout: 10 * time.Second, // 服务端 10s 内必须开始响应
    }
    client := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second, // 兜底：整个流程 30s
    }

    req, _ := http.NewRequest("POST", endpoint, bytes.NewReader(payload))
    req.Header.Set("Content-Type", "application/json")
    return client.Do(req)
}
```

### 自定义 RoundTripper：请求日志、重试、限速

```go
// 日志中间件：记录每次请求的耗时和状态码
type LoggingTransport struct {
    base   http.RoundTripper
    logger *slog.Logger
}

func (t *LoggingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
    start := time.Now()
    resp, err := t.base.RoundTrip(req)
    elapsed := time.Since(start)

    if err != nil {
        t.logger.Error("HTTP request failed",
            "method", req.Method,
            "url", req.URL.String(),
            "elapsed", elapsed,
            "error", err)
        return nil, err
    }

    t.logger.Info("HTTP request",
        "method", req.Method,
        "url", req.URL.String(),
        "status", resp.StatusCode,
        "elapsed", elapsed)
    return resp, nil
}

// 重试中间件：对 5xx / 网络错误自动重试
type RetryTransport struct {
    base       http.RoundTripper
    maxRetries int
    backoff    time.Duration
}

func (t *RetryTransport) RoundTrip(req *http.Request) (*http.Response, error) {
    var lastErr error
    for i := 0; i <= t.maxRetries; i++ {
        if i > 0 {
            // ⚠️ 重试前需重置 Body（已读取，必须 rewind）
            if req.GetBody != nil {
                body, err := req.GetBody()
                if err != nil {
                    return nil, err
                }
                req.Body = body
            }
            time.Sleep(t.backoff * time.Duration(i))
        }

        resp, err := t.base.RoundTrip(req)
        if err != nil {
            lastErr = err
            continue
        }
        if resp.StatusCode >= 500 {
            resp.Body.Close()
            lastErr = fmt.Errorf("server error: %d", resp.StatusCode)
            continue
        }
        return resp, nil
    }
    return nil, lastErr
}

// 组合使用（洋葱模型）
func buildClient() *http.Client {
    base := &http.Transport{
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
    }
    logger := slog.Default()
    transport := &LoggingTransport{
        base: &RetryTransport{base: base, maxRetries: 3, backoff: 500 * time.Millisecond},
        logger: logger,
    }
    return &http.Client{Transport: transport, Timeout: 60 * time.Second}
}
```

### 连接池监控与诊断

```go
import "net/http/httptrace"

// 追踪连接复用情况（判断连接池是否生效）
func traceRequest(client *http.Client, url string) {
    var reused bool
    trace := &httptrace.ClientTrace{
        // 建立新连接时触发（reused=false 时）
        GotConn: func(info httptrace.GotConnInfo) {
            reused = info.Reused
            fmt.Printf("连接: reused=%v, idle=%v, idleTime=%v\n",
                info.Reused, info.WasIdle, info.IdleTime)
        },
        // DNS 解析耗时
        DNSDone: func(info httptrace.DNSDoneInfo) {
            fmt.Printf("DNS 解析完成, addrs=%v\n", info.Addrs)
        },
        // TLS 握手完成
        TLSHandshakeDone: func(state tls.ConnectionState, err error) {
            fmt.Printf("TLS 握手完成, resumed=%v\n", state.DidResume)
        },
    }

    req, _ := http.NewRequest("GET", url, nil)
    req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))

    resp, _ := client.Do(req)
    if resp != nil {
        io.Copy(io.Discard, resp.Body)
        resp.Body.Close()
    }
    fmt.Printf("连接复用: %v\n", reused)
}

// 定期导出连接池状态（监控仪表盘）
func monitorTransport(t *http.Transport, interval time.Duration) {
    go func() {
        ticker := time.NewTicker(interval)
        for range ticker.C {
            // http.Transport 暴露了 CloseIdleConnections，
            // 但没有直接获取池状态的 API，需通过 expvar 间接监控
            fmt.Printf("transport stats: %+v\n", t)
        }
    }()
}
```

### 代理配置：企业内网 / SOCKS5

```go
import (
    "golang.org/x/net/proxy"
    "net/url"
)

// HTTP 代理
func httpProxyClient(proxyURL string) *http.Client {
    proxy, _ := url.Parse(proxyURL)
    transport := &http.Transport{
        Proxy:               http.ProxyURL(proxy),
        MaxIdleConnsPerHost: 100,
    }
    return &http.Client{Transport: transport}
}

// SOCKS5 代理（Tor、内网穿透）
func socks5Client(socks5Addr string) (*http.Client, error) {
    dialer, err := proxy.SOCKS5("tcp", socks5Addr, nil, proxy.Direct)
    if err != nil {
        return nil, err
    }

    transport := &http.Transport{
        DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
            return dialer.Dial(network, addr)
        },
    }
    return &http.Client{Transport: transport}, nil
}

// 根据环境变量自动代理（HTTP_PROXY / HTTPS_PROXY / NO_PROXY）
func autoProxyClient() *http.Client {
    transport := &http.Transport{
        Proxy: http.ProxyFromEnvironment, // 读取环境变量
    }
    return &http.Client{Transport: transport}
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| 为什么 `MaxIdleConnsPerHost` 默认值 2 在生产中是问题？ | 高并发服务向同一 host 发大量请求时，超过 2 的连接用完后立刻关闭，无法复用；每次都重新建 TCP+TLS，大幅增加延迟 |
| `http.Client.Timeout` 和 `Transport.ResponseHeaderTimeout` 的区别？ | Client.Timeout 覆盖整个生命周期（含读取 Body）；ResponseHeaderTimeout 仅控制等待第一个响应头字节的时长，之后读 Body 不受限 |
| 自定义 `RoundTripper` 重试时为什么需要 `GetBody`？ | Body 是 `io.Reader`，被读取一次后位置不可倒回；`GetBody` 是可重复调用的工厂函数；`http.NewRequest` 对 `bytes.Reader`/`strings.Reader` 自动设置 `GetBody` |
| Keep-Alive 连接在何时归还连接池？ | 调用方执行 `resp.Body.Close()` 后，Transport 检测连接是否健康，健康则放回 `idleConn` 池；未 Close 则连接泄漏 |
| `http.DefaultTransport` 线程安全吗？ | 是，`Transport` 内部有锁保护连接池；但 `http.DefaultClient` 无超时，生产中不应直接使用 |
| 如何避免连接池污染（stale connection）？ | 设置合理的 `IdleConnTimeout`（≤ 服务端 keep-alive timeout）；用 `DisableKeepAlives=true` 可关闭连接复用（调试用）|
