---
title: net/http/httptest 源码精读
description: 精读 net/http/httptest 的测试服务器与响应记录器，掌握 HTTP handler 单元测试与集成测试的标准模式。
---

# net/http/httptest：HTTP 测试工具源码精读

> 核心源码：`src/net/http/httptest/recorder.go`、`src/net/http/httptest/server.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`httptest-modes`

## 包结构图

```
net/http/httptest 两大工具
══════════════════════════════════════════════════════════════════

  ResponseRecorder（单元测试）
  ├── httptest.NewRecorder()     ← 创建记录器
  ├── .Code     int              ← 记录的状态码（默认 200）
  ├── .HeaderMap http.Header     ← 记录的响应头
  ├── .Body     *bytes.Buffer    ← 记录的响应体
  ├── .Flushed  bool             ← 是否调用过 Flush
  └── .Result() *http.Response   ← 转为标准 Response（Go 1.7+）

  Server（集成测试）
  ├── httptest.NewServer(h)      ← 启动真实 HTTP 服务（随机端口）
  ├── httptest.NewTLSServer(h)   ← 启动真实 HTTPS 服务
  ├── httptest.NewUnstartedServer(h) ← 未启动（可定制后再 Start）
  ├── .URL      string           ← "http://127.0.0.1:PORT"
  ├── .Client() *http.Client     ← 预配置好的客户端（TLS 信任测试证书）
  └── .Close()                   ← 关闭服务器（defer 调用）

  使用场景对比：
  ┌─────────────────────────┬──────────────────────────────────┐
  │ ResponseRecorder        │ Server                           │
  ├─────────────────────────┼──────────────────────────────────┤
  │ 直接调用 ServeHTTP      │ 通过真实网络连接                 │
  │ 无网络开销              │ 测试中间件/连接池/TLS 等         │
  │ 单元测试首选            │ 集成/端到端测试                  │
  │ 快速（纳秒级）          │ 较慢（毫秒级）                   │
  └─────────────────────────┴──────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="httptest-modes" />

---

## 一、ResponseRecorder 实现

```go
// src/net/http/httptest/recorder.go
type ResponseRecorder struct {
    Code      int           // WriteHeader 写入的状态码
    HeaderMap http.Header   // Handler 写入的响应头
    Body      *bytes.Buffer // 响应体缓冲
    Flushed   bool

    result      *http.Response // Result() 缓存
    snapHeader  http.Header    // WriteHeader 时的快照
    wroteHeader bool
}

func (rw *ResponseRecorder) WriteHeader(code int) {
    if rw.wroteHeader { return } // 只能写一次
    checkWriteHeaderCode(code)
    rw.Code = code
    rw.wroteHeader = true
    // 快照当前 header（写入后 handler 修改 header 不影响记录）
    rw.snapHeader = rw.HeaderMap.Clone()
}

func (rw *ResponseRecorder) Write(buf []byte) (int, error) {
    if !rw.wroteHeader {
        rw.WriteHeader(200) // 默认 200
    }
    if rw.Body != nil {
        rw.Body.Write(buf)
    }
    return len(buf), nil
}

// Result() 将记录转为标准 *http.Response
func (rw *ResponseRecorder) Result() *http.Response {
    // 构建完整的 http.Response（含 Body reader）
    res := &http.Response{
        Proto:      "HTTP/1.1",
        StatusCode: rw.Code,
        Header:     rw.snapHeader,
        Body:       io.NopCloser(bytes.NewReader(rw.Body.Bytes())),
    }
    // ... 设置 Cookies、Trailers 等
    return res
}
```

---

## 二、代码示例

### Handler 单元测试（ResponseRecorder）

```go
// 被测 handler
func helloHandler(w http.ResponseWriter, r *http.Request) {
    name := r.URL.Query().Get("name")
    if name == "" {
        http.Error(w, "name required", http.StatusBadRequest)
        return
    }
    w.Header().Set("Content-Type", "text/plain")
    fmt.Fprintf(w, "Hello, %s!", name)
}

func TestHelloHandler(t *testing.T) {
    tests := []struct {
        name       string
        url        string
        wantStatus int
        wantBody   string
    }{
        {"ok", "/?name=Alice", 200, "Hello, Alice!"},
        {"missing name", "/", 400, "name required\n"},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(http.MethodGet, tt.url, nil)
            rec := httptest.NewRecorder()

            helloHandler(rec, req)

            res := rec.Result()
            defer res.Body.Close()

            if res.StatusCode != tt.wantStatus {
                t.Errorf("status = %d, want %d", res.StatusCode, tt.wantStatus)
            }
            body, _ := io.ReadAll(res.Body)
            if string(body) != tt.wantBody {
                t.Errorf("body = %q, want %q", body, tt.wantBody)
            }
        })
    }
}
```

### 测试 JSON API handler

```go
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid json", http.StatusBadRequest)
        return
    }
    if req.Name == "" || req.Email == "" {
        http.Error(w, "name and email required", http.StatusUnprocessableEntity)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]any{
        "id":    42,
        "name":  req.Name,
        "email": req.Email,
    })
}

func TestCreateUserHandler(t *testing.T) {
    body := `{"name":"Alice","email":"alice@example.com"}`
    req := httptest.NewRequest(http.MethodPost, "/users",
        strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    createUserHandler(rec, req)

    if rec.Code != http.StatusCreated {
        t.Fatalf("status = %d, want 201", rec.Code)
    }
    if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
        t.Errorf("Content-Type = %q", ct)
    }

    var resp map[string]any
    json.NewDecoder(rec.Body).Decode(&resp)
    if resp["name"] != "Alice" {
        t.Errorf("name = %v", resp["name"])
    }
}
```

### 测试中间件

```go
// 被测中间件：JWT 鉴权
func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "unauthorized", http.StatusUnauthorized)
            return
        }
        // 验证 token...
        next.ServeHTTP(w, r)
    })
}

func TestAuthMiddleware(t *testing.T) {
    // 被保护的 handler
    protected := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
    })
    handler := AuthMiddleware(protected)

    t.Run("no token", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/", nil)
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        if rec.Code != http.StatusUnauthorized {
            t.Errorf("want 401, got %d", rec.Code)
        }
    })

    t.Run("with token", func(t *testing.T) {
        req := httptest.NewRequest("GET", "/", nil)
        req.Header.Set("Authorization", "Bearer valid-token")
        rec := httptest.NewRecorder()
        handler.ServeHTTP(rec, req)
        if rec.Code != http.StatusOK {
            t.Errorf("want 200, got %d", rec.Code)
        }
    })
}
```

### 集成测试（httptest.Server）

```go
func TestHTTPIntegration(t *testing.T) {
    // 启动真实 HTTP 服务器
    mux := http.NewServeMux()
    mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("pong"))
    })

    srv := httptest.NewServer(mux)
    defer srv.Close() // 测试结束后关闭

    // srv.URL = "http://127.0.0.1:随机端口"
    resp, err := srv.Client().Get(srv.URL + "/ping")
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    if string(body) != "pong" {
        t.Errorf("body = %q", body)
    }
}
```

### TLS 集成测试

```go
func TestTLSServer(t *testing.T) {
    srv := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("secure"))
    }))
    defer srv.Close()

    // srv.Client() 返回已信任测试证书的 http.Client
    resp, err := srv.Client().Get(srv.URL)
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()
    body, _ := io.ReadAll(resp.Body)
    if string(body) != "secure" {
        t.Errorf("body = %q", body)
    }
}
```

### 测试外部 HTTP 依赖（Mock 服务）

```go
// 模拟第三方 API
func TestFetchUser(t *testing.T) {
    mockAPI := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path != "/users/42" {
            http.NotFound(w, r)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]any{
            "id": 42, "name": "Alice",
        })
    }))
    defer mockAPI.Close()

    // 将被测函数的 baseURL 指向 mock 服务器
    client := NewUserClient(mockAPI.URL, mockAPI.Client())
    user, err := client.FetchUser(42)
    if err != nil {
        t.Fatal(err)
    }
    if user.Name != "Alice" {
        t.Errorf("name = %q", user.Name)
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| ResponseRecorder 和 httptest.Server 如何选择？ | 单元测试用 Recorder（无网络，快）；集成测试或需真实连接/TLS 用 Server |
| httptest.NewRequest 和 http.NewRequest 的区别？ | httptest.NewRequest panic 而不返回 error（测试用），且自动设置 RemoteAddr/RequestURI |
| rec.Header() 和 rec.HeaderMap 的区别？ | rec.Header() 返回待写入的 Header（handler 读写用）；rec.HeaderMap 在 WriteHeader 后由 Header 填充 |
| TLS server 的测试客户端为什么不验证证书失败？ | srv.Client() 返回已注入测试证书 CA 的 http.Client，专门信任测试服务器的自签证书 |
| 如何测试 SSE/流式响应？ | 实现 http.Flusher 接口；用 httptest.Server + chunked 读取；或测试 Flushed 字段 |
| 如何在 handler 测试中模拟请求 body？ | `httptest.NewRequest("POST", "/", strings.NewReader(body))` 或 `bytes.NewBufferString` |
