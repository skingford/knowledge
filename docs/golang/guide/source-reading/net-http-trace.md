---
title: net/http/httptrace 源码精读
description: 精读 net/http/httptrace 的请求生命周期追踪机制，掌握连接复用诊断、DNS 延迟分析与请求链路观测。
---

# net/http/httptrace：HTTP 请求追踪源码精读

> 核心源码：`src/net/http/httptrace/trace.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`httptrace-events`
> - `GoNetworkDiagram`：`http-client-pool`

## 包结构图

```
HTTP 请求生命周期追踪点
══════════════════════════════════════════════════════════════════

  客户端发起请求
       │
       ▼ GetConn(hostPort)          ← 开始获取连接
       │
       ├─► [连接池命中] ─────────────► GotConn(info)  ← 复用连接
       │
       └─► [新建连接]
              │
              ▼ DNSStart(dnsInfo)   ← DNS 解析开始
              ▼ DNSDone(dnsInfo)    ← DNS 解析完成
              ▼ ConnectStart        ← TCP 握手开始
              ▼ ConnectDone         ← TCP 握手完成
              ▼ TLSHandshakeStart   ← TLS 握手开始（HTTPS）
              ▼ TLSHandshakeDone    ← TLS 握手完成
              ▼ GotConn(info)       ← 拿到连接（新建）
              │
              ▼ WroteHeaderField    ← 写入每个请求头
              ▼ WroteHeaders        ← 所有请求头写完
              ▼ WroteRequest        ← 请求体写完
              │
              ▼ GotFirstResponseByte ← 收到响应第一个字节（TTFB）
              │
              ▼ 读取响应体...

  ClientTrace 结构：
  └── 所有钩子字段均为可选 func，nil 表示不追踪该事件

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="httptrace-events" />

---

## 一、核心实现

```go
// src/net/http/httptrace/trace.go
type ClientTrace struct {
    // 获取连接前
    GetConn func(hostPort string)

    // 拿到连接（复用或新建）
    GotConn func(GotConnInfo)

    // DNS 解析
    DNSStart func(DNSStartInfo)
    DNSDone  func(DNSDoneInfo)

    // TCP 连接
    ConnectStart func(network, addr string)
    ConnectDone  func(network, addr string, err error)

    // TLS 握手
    TLSHandshakeStart func()
    TLSHandshakeDone  func(tls.ConnectionState, error)

    // 写请求
    WroteHeaderField  func(key string, value []string)
    WroteHeaders      func()
    WroteRequest      func(WroteRequestInfo)

    // 收到响应
    GotFirstResponseByte func()
}

type GotConnInfo struct {
    Conn         net.Conn
    Reused       bool          // ← 是否复用了连接
    WasIdle      bool          // ← 连接是否来自空闲池
    IdleTime     time.Duration // ← 连接在池中闲置了多久
}

// 注入 context 的方式
func WithClientTrace(ctx context.Context, trace *ClientTrace) context.Context {
    // 将 trace 存入 ctx，Transport 层通过 ContextClientTrace 取出
    return context.WithValue(ctx, clientEventContextKey{}, trace)
}
```

---

## 二、代码示例

### 基础请求诊断

```go
import (
    "net/http/httptrace"
    "time"
)

func traceRequest(url string) {
    var (
        dnsStart, dnsDone     time.Time
        connectStart, connectDone time.Time
        tlsStart, tlsDone     time.Time
        firstByte             time.Time
        reused                bool
    )

    trace := &httptrace.ClientTrace{
        DNSStart: func(_ httptrace.DNSStartInfo) {
            dnsStart = time.Now()
        },
        DNSDone: func(_ httptrace.DNSDoneInfo) {
            dnsDone = time.Now()
        },
        ConnectStart: func(_, _ string) {
            connectStart = time.Now()
        },
        ConnectDone: func(_, _ string, err error) {
            connectDone = time.Now()
        },
        TLSHandshakeStart: func() {
            tlsStart = time.Now()
        },
        TLSHandshakeDone: func(_ tls.ConnectionState, _ error) {
            tlsDone = time.Now()
        },
        GotConn: func(info httptrace.GotConnInfo) {
            reused = info.Reused
        },
        GotFirstResponseByte: func() {
            firstByte = time.Now()
        },
    }

    req, _ := http.NewRequestWithContext(
        httptrace.WithClientTrace(context.Background(), trace),
        "GET", url, nil,
    )

    start := time.Now()
    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()
    io.Copy(io.Discard, resp.Body) // 读完响应体

    total := time.Since(start)
    fmt.Printf("连接复用: %v\n", reused)
    if !reused {
        fmt.Printf("DNS:     %v\n", dnsDone.Sub(dnsStart))
        fmt.Printf("TCP:     %v\n", connectDone.Sub(connectStart))
        fmt.Printf("TLS:     %v\n", tlsDone.Sub(tlsStart))
    }
    fmt.Printf("TTFB:    %v\n", firstByte.Sub(start))
    fmt.Printf("Total:   %v\n", total)
}
```

### 连接复用诊断（排查连接池问题）

<GoNetworkDiagram kind="http-client-pool" />

```go
type ConnectionStats struct {
    mu       sync.Mutex
    reused   int
    newConns int
    idleTimes []time.Duration
}

func (s *ConnectionStats) trace() *httptrace.ClientTrace {
    return &httptrace.ClientTrace{
        GotConn: func(info httptrace.GotConnInfo) {
            s.mu.Lock()
            defer s.mu.Unlock()
            if info.Reused {
                s.reused++
                s.idleTimes = append(s.idleTimes, info.IdleTime)
            } else {
                s.newConns++
            }
        },
    }
}

func (s *ConnectionStats) Report() {
    s.mu.Lock()
    defer s.mu.Unlock()
    total := s.reused + s.newConns
    fmt.Printf("总请求: %d, 复用连接: %d (%.1f%%), 新建连接: %d\n",
        total, s.reused, float64(s.reused)/float64(total)*100, s.newConns)
    if len(s.idleTimes) > 0 {
        var avg time.Duration
        for _, d := range s.idleTimes { avg += d }
        avg /= time.Duration(len(s.idleTimes))
        fmt.Printf("平均空闲时间: %v\n", avg)
    }
}

// 使用
stats := &ConnectionStats{}
client := &http.Client{}

for i := 0; i < 100; i++ {
    req, _ := http.NewRequestWithContext(
        httptrace.WithClientTrace(context.Background(), stats.trace()),
        "GET", "https://api.example.com/data", nil,
    )
    resp, _ := client.Do(req)
    io.Copy(io.Discard, resp.Body)
    resp.Body.Close()
}
stats.Report()
```

### 集成到 OpenTelemetry 链路追踪

```go
// 将 httptrace 事件上报到 OTel span
func withOTelTrace(ctx context.Context, span trace.Span) context.Context {
    return httptrace.WithClientTrace(ctx, &httptrace.ClientTrace{
        DNSStart: func(info httptrace.DNSStartInfo) {
            span.AddEvent("dns.start", trace.WithAttributes(
                attribute.String("host", info.Host),
            ))
        },
        DNSDone: func(info httptrace.DNSDoneInfo) {
            if info.Err != nil {
                span.RecordError(info.Err)
            }
            span.AddEvent("dns.done")
        },
        ConnectStart: func(network, addr string) {
            span.AddEvent("connect.start", trace.WithAttributes(
                attribute.String("addr", addr),
            ))
        },
        ConnectDone: func(network, addr string, err error) {
            if err != nil {
                span.RecordError(err)
            }
            span.AddEvent("connect.done")
        },
        GotFirstResponseByte: func() {
            span.AddEvent("response.first_byte")
        },
        GotConn: func(info httptrace.GotConnInfo) {
            span.SetAttributes(
                attribute.Bool("http.conn.reused", info.Reused),
            )
        },
    })
}
```

### HTTP 客户端中间件（自动追踪）

```go
// 封装为 http.RoundTripper，对所有请求自动注入追踪
type TracingTransport struct {
    Base    http.RoundTripper
    OnStats func(RequestStats)
}

type RequestStats struct {
    URL       string
    DNS       time.Duration
    Connect   time.Duration
    TLS       time.Duration
    TTFB      time.Duration
    Total     time.Duration
    Reused    bool
    StatusCode int
}

func (t *TracingTransport) RoundTrip(req *http.Request) (*http.Response, error) {
    stats := &RequestStats{URL: req.URL.String()}
    var (
        dnsStart, connectStart, tlsStart time.Time
        start = time.Now()
    )

    trace := &httptrace.ClientTrace{
        DNSStart:  func(_ httptrace.DNSStartInfo)    { dnsStart = time.Now() },
        DNSDone:   func(_ httptrace.DNSDoneInfo)     { stats.DNS = time.Since(dnsStart) },
        ConnectStart: func(_, _ string)              { connectStart = time.Now() },
        ConnectDone:  func(_, _ string, _ error)     { stats.Connect = time.Since(connectStart) },
        TLSHandshakeStart: func()                    { tlsStart = time.Now() },
        TLSHandshakeDone:  func(_ tls.ConnectionState, _ error) {
            stats.TLS = time.Since(tlsStart)
        },
        GotConn: func(info httptrace.GotConnInfo) { stats.Reused = info.Reused },
        GotFirstResponseByte: func() { stats.TTFB = time.Since(start) },
    }

    req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))
    resp, err := t.Base.RoundTrip(req)

    stats.Total = time.Since(start)
    if resp != nil {
        stats.StatusCode = resp.StatusCode
    }
    if t.OnStats != nil {
        t.OnStats(*stats)
    }
    return resp, err
}

// 使用
client := &http.Client{
    Transport: &TracingTransport{
        Base: http.DefaultTransport,
        OnStats: func(s RequestStats) {
            log.Printf("URL=%s DNS=%v TCP=%v TLS=%v TTFB=%v Total=%v Reused=%v",
                s.URL, s.DNS, s.Connect, s.TLS, s.TTFB, s.Total, s.Reused)
        },
    },
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| httptrace 如何将钩子传入 Transport 层？ | 通过 context.Value 存储 ClientTrace；Transport 的 RoundTrip 内部调用 ContextClientTrace 取出并触发 |
| GotConnInfo.Reused 为 false 时说明什么？ | 新建了 TCP 连接；常见原因：连接池耗尽、Keep-Alive 关闭、服务端关闭了连接 |
| TTFB 如何测量？ | GotFirstResponseByte 触发时间 - 请求开始时间；高 TTFB 说明服务端处理慢或网络延迟大 |
| 连接复用率低该如何排查？ | 检查 resp.Body 是否被完全读取并 Close（未读完 Body 导致连接无法复用）|
| httptrace 和 OpenTelemetry 如何结合？ | 在 ClientTrace 的钩子中调用 span.AddEvent，将 DNS/TCP/TLS 各阶段上报为 Span 事件 |
| WroteRequest 钩子的 err 字段有什么用？ | 捕获写入请求时的错误（网络中断、超时）；比在 Do() 层面更早得到错误信息 |
