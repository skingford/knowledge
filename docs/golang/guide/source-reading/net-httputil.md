---
title: net/http/httputil 源码精读
description: 精读 net/http/httputil 的反向代理实现，掌握 ReverseProxy 请求转发、负载均衡、请求/响应调试与 DumpRequest 最佳实践。
---

# net/http/httputil：反向代理源码精读

> 核心源码：`src/net/http/httputil/reverseproxy.go`、`src/net/http/httputil/dump.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`reverse-proxy-flow`

## 包结构图

```
net/http/httputil 体系
══════════════════════════════════════════════════════════════════

  ReverseProxy（反向代理核心）
  ┌──────────────────────────────────────────────────────────┐
  │  Client → ReverseProxy → Backend                         │
  │                                                          │
  │  请求处理流程：                                           │
  │  1. Director(req)    修改请求（改 URL/Host/Header）       │
  │  2. Transport.RoundTrip(req) 转发到后端                   │
  │  3. ModifyResponse(resp)     修改响应（可选）             │
  │  4. 将响应流式写回客户端                                  │
  │                                                          │
  │  关键字段：                                               │
  │  ├── Director func(*http.Request)  必填，修改转发请求     │
  │  ├── Transport http.RoundTripper   自定义传输层           │
  │  ├── ModifyResponse func(*http.Response) error  响应修改  │
  │  ├── ErrorHandler func(w, r, err)  错误处理              │
  │  ├── BufferPool   BufferPool       响应体缓冲池           │
  │  └── FlushInterval time.Duration   流式响应刷新间隔       │
  └──────────────────────────────────────────────────────────┘

  调试工具：
  ├── DumpRequest(r, body bool) ([]byte, error)   ← 序列化请求（含/不含 body）
  ├── DumpRequestOut(r, body bool) ([]byte, error) ← 序列化出站请求
  └── DumpResponse(r, body bool) ([]byte, error)  ← 序列化响应

  SingleHostReverseProxy：
  httputil.NewSingleHostReverseProxy(target *url.URL)
  └── 快速创建单后端代理（Director 自动设置 URL）

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="reverse-proxy-flow" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/net/http/httputil/reverseproxy.go（简化）

func (p *ReverseProxy) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
    // 1. 复制请求（避免修改原始请求）
    outreq := req.Clone(req.Context())

    // 2. Director 修改请求（URL、Host、Header 等）
    p.Director(outreq)

    // 3. 清理逐跳头（Connection、Upgrade 等不应转发）
    removeHopHeaders(outreq.Header)
    // 添加 X-Forwarded-For
    outreq.Header.Add("X-Forwarded-For", req.RemoteAddr)

    // 4. 通过 Transport 发送请求到后端
    res, err := transport.RoundTrip(outreq)
    if err != nil {
        p.getErrorHandler()(rw, req, err)
        return
    }
    defer res.Body.Close()

    // 5. ModifyResponse 修改响应
    if p.ModifyResponse != nil {
        if err := p.ModifyResponse(res); err != nil {
            p.getErrorHandler()(rw, req, err)
            return
        }
    }

    // 6. 将响应头写入客户端
    copyHeader(rw.Header(), res.Header)
    rw.WriteHeader(res.StatusCode)

    // 7. 流式拷贝响应体（支持 SSE/流式传输）
    p.copyResponse(rw, res.Body, p.flushInterval(res))
}
```
:::

---

## 二、代码示例

### 最简单的单后端反向代理

::: details 点击展开代码：最简单的单后端反向代理
```go
import (
    "net/http"
    "net/http/httputil"
    "net/url"
)

func simpleProxy() {
    target, _ := url.Parse("http://backend:8080")
    proxy := httputil.NewSingleHostReverseProxy(target)

    // 修改 Host 头（后端需要正确的 Host）
    originalDirector := proxy.Director
    proxy.Director = func(req *http.Request) {
        originalDirector(req)
        req.Host = target.Host // 覆盖 Host 头
    }

    http.ListenAndServe(":80", proxy)
}
```
:::

### 多后端负载均衡代理

::: details 点击展开代码：多后端负载均衡代理
```go
type LoadBalancer struct {
    backends []*url.URL
    current  atomic.Uint64
}

func NewLoadBalancer(addrs []string) *LoadBalancer {
    var backends []*url.URL
    for _, addr := range addrs {
        u, _ := url.Parse(addr)
        backends = append(backends, u)
    }
    return &LoadBalancer{backends: backends}
}

// 轮询选择后端
func (lb *LoadBalancer) next() *url.URL {
    idx := lb.current.Add(1) % uint64(len(lb.backends))
    return lb.backends[idx]
}

func (lb *LoadBalancer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    target := lb.next()

    proxy := &httputil.ReverseProxy{
        Director: func(req *http.Request) {
            req.URL.Scheme = target.Scheme
            req.URL.Host = target.Host
            req.Host = target.Host
            // 保留原始路径，仅替换 host
            if target.Path != "" {
                req.URL.Path = target.Path + req.URL.Path
            }
        },
        // 自定义错误处理
        ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
            log.Printf("代理错误 [%s]: %v", target.Host, err)
            http.Error(w, "Bad Gateway", http.StatusBadGateway)
        },
        // 流式响应（SSE/WebSocket）：0 = 立即刷新
        FlushInterval: -1,
    }
    proxy.ServeHTTP(w, r)
}
```
:::

### 修改请求和响应（中间件能力）

::: details 点击展开代码：修改请求和响应（中间件能力）
```go
func proxyWithMiddleware(backend string) http.Handler {
    target, _ := url.Parse(backend)

    return &httputil.ReverseProxy{
        // 修改转发请求
        Director: func(req *http.Request) {
            req.URL.Scheme = target.Scheme
            req.URL.Host = target.Host
            req.Host = target.Host

            // 添加认证头
            req.Header.Set("X-Internal-Auth", "secret-token")
            // 删除敏感头
            req.Header.Del("Cookie")
            // 记录请求 ID
            req.Header.Set("X-Request-ID", uuid.New().String())
        },

        // 修改响应
        ModifyResponse: func(resp *http.Response) error {
            // 添加安全响应头
            resp.Header.Set("X-Frame-Options", "DENY")
            resp.Header.Set("X-Content-Type-Options", "nosniff")

            // 替换响应体（如注入分析脚本）
            if strings.Contains(resp.Header.Get("Content-Type"), "text/html") {
                body, _ := io.ReadAll(resp.Body)
                resp.Body.Close()

                newBody := bytes.ReplaceAll(body,
                    []byte("</body>"),
                    []byte(`<script src="/analytics.js"></script></body>`),
                )
                resp.Body = io.NopCloser(bytes.NewReader(newBody))
                resp.ContentLength = int64(len(newBody))
            }
            return nil
        },
    }
}
```
:::

### 路径路由代理（API 网关模式）

::: details 点击展开代码：路径路由代理（API 网关模式）
```go
// 不同路径转发到不同后端
func apiGateway() http.Handler {
    mux := http.NewServeMux()

    // /api/users → user-service
    mux.Handle("/api/users/", newProxy("http://user-service:8001"))
    // /api/orders → order-service
    mux.Handle("/api/orders/", newProxy("http://order-service:8002"))
    // /api/products → product-service
    mux.Handle("/api/products/", newProxy("http://product-service:8003"))

    return mux
}

func newProxy(backend string) *httputil.ReverseProxy {
    target, _ := url.Parse(backend)
    proxy := httputil.NewSingleHostReverseProxy(target)

    // 自定义 Transport（连接池优化）
    proxy.Transport = &http.Transport{
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
        DisableCompression:  true, // 代理不需要解压再压缩
    }
    return proxy
}
```
:::

### DumpRequest/DumpResponse（调试利器）

::: details 点击展开代码：DumpRequest/DumpResponse（调试利器）
```go
// 调试中间件：记录完整请求和响应
func debugMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 序列化请求（含 body，但 body 会被消耗需要恢复）
        dump, err := httputil.DumpRequest(r, true)
        if err == nil {
            log.Printf("→ 请求:\n%s", dump)
        }

        // 包装 ResponseWriter 以捕获响应
        rec := httptest.NewRecorder()
        next.ServeHTTP(rec, r)

        // 序列化响应
        resp := rec.Result()
        respDump, _ := httputil.DumpResponse(resp, true)
        log.Printf("← 响应:\n%s", respDump)

        // 将实际响应写回
        for k, v := range rec.Header() {
            w.Header()[k] = v
        }
        w.WriteHeader(rec.Code)
        rec.Body.WriteTo(w)
    })
}

// 调试出站 HTTP 请求（客户端）
func debugHTTPClient() {
    req, _ := http.NewRequest("GET", "https://example.com/api", nil)
    req.Header.Set("Authorization", "Bearer token123")

    // DumpRequestOut：序列化即将发送的请求（含完整头部）
    dump, _ := httputil.DumpRequestOut(req, true)
    fmt.Printf("发出请求:\n%s\n", dump)

    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()

    respDump, _ := httputil.DumpResponse(resp, true)
    fmt.Printf("收到响应:\n%s\n", respDump)
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `ReverseProxy.Director` 和 `ModifyResponse` 的职责？ | Director 修改**转发请求**（改 URL/Host/Header）；ModifyResponse 修改**后端响应**（改头/改体）；二者对应请求和响应两个方向 |
| 逐跳头（Hop-by-Hop Headers）为什么不能转发？ | Connection/Upgrade/Keep-Alive 等头是连接级别的，只适用于当前连接；代理转发会导致协议错误 |
| 如何实现 SSE/WebSocket 流式代理？ | 设置 `FlushInterval: -1`（立即刷新）或正向值（定期刷新）；WebSocket 需额外处理 `Upgrade` 头 |
| `DumpRequest` 和 `DumpRequestOut` 的区别？ | DumpRequest 序列化服务端收到的请求（入站）；DumpRequestOut 序列化客户端即将发出的请求（出站，含完整 HTTP/1.1 格式） |
| 代理时如何处理 `X-Forwarded-For`？ | ReverseProxy 自动追加客户端 IP；多级代理时该头包含所有经过的 IP；应验证最左侧 IP（需配合 TrustedProxies 配置） |
| 如何优化代理的连接池？ | 自定义 `Transport`：增大 `MaxIdleConnsPerHost`（默认 2，代理场景应设 50-200）；设置 `DisableCompression: true` 避免无意义的压缩/解压 |
