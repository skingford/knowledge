---
title: net/http RESTful API 设计模式
description: 精读 Go net/http RESTful API 服务端设计，掌握路由模式、统一错误处理、API 版本化、请求验证与 OpenAPI 规范最佳实践。
---

# net/http RESTful API 设计模式

> 核心：`net/http`（Go 1.22+ 路由增强）、中间件架构、统一响应规范

## 包结构图

```
Go RESTful API 体系（Go 1.22+）
══════════════════════════════════════════════════════════════════

  Go 1.22 路由增强（net/http.ServeMux）：
  ├── "GET /users/{id}"     ← 方法 + 路径模式
  ├── "POST /users"         ← 精确方法匹配
  ├── "GET /files/{path...}"← 通配符（尾部多段）
  └── r.PathValue("id")     ← 提取路径参数

  API 设计层次：
  ┌─────────────────────────────────────────────────────────────┐
  │ Router（路由层）  → 路径匹配、方法分发                      │
  │   ↓                                                         │
  │ Middleware（中间件层）→ 认证、日志、限流、CORS              │
  │   ↓                                                         │
  │ Handler（处理层）→ 请求解析、业务逻辑调用                   │
  │   ↓                                                         │
  │ Service（服务层）→ 业务逻辑（纯 Go，无 HTTP 依赖）          │
  │   ↓                                                         │
  │ Repository（数据层）→ DB/缓存访问                           │
  └─────────────────────────────────────────────────────────────┘

  统一响应格式：
  成功：{"data": {...}, "meta": {"requestId": "..."}}
  失败：{"error": {"code": "NOT_FOUND", "message": "..."}}

══════════════════════════════════════════════════════════════════
```

---

## 一、Go 1.22+ 路由：方法 + 路径参数

```go
import "net/http"

func setupRouter() http.Handler {
    mux := http.NewServeMux()

    // Go 1.22+：HTTP 方法 + 路径参数（无需第三方路由）
    mux.HandleFunc("GET /api/v1/users", listUsers)
    mux.HandleFunc("POST /api/v1/users", createUser)
    mux.HandleFunc("GET /api/v1/users/{id}", getUser)
    mux.HandleFunc("PUT /api/v1/users/{id}", updateUser)
    mux.HandleFunc("DELETE /api/v1/users/{id}", deleteUser)

    // 文件路径通配符
    mux.HandleFunc("GET /files/{path...}", serveFile)

    return mux
}

func getUser(w http.ResponseWriter, r *http.Request) {
    // 提取路径参数（Go 1.22+）
    id := r.PathValue("id")
    if id == "" {
        respondError(w, ErrBadRequest("id is required"))
        return
    }
    // ...
}
```

---

## 二、代码示例

### 统一响应与错误处理

```go
// API 响应结构
type APIResponse struct {
    Data  any      `json:"data,omitempty"`
    Error *APIError `json:"error,omitempty"`
    Meta  *Meta    `json:"meta,omitempty"`
}

type APIError struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details any    `json:"details,omitempty"`
}

type Meta struct {
    RequestID string `json:"requestId"`
    Total     int    `json:"total,omitempty"` // 分页总数
    Page      int    `json:"page,omitempty"`
    PageSize  int    `json:"pageSize,omitempty"`
}

// 业务错误类型（可携带 HTTP 状态码）
type AppError struct {
    Code       string
    Message    string
    HTTPStatus int
    Err        error
}

func (e *AppError) Error() string { return e.Message }
func (e *AppError) Unwrap() error { return e.Err }

// 预定义错误构造函数
func ErrNotFound(msg string) *AppError {
    return &AppError{Code: "NOT_FOUND", Message: msg, HTTPStatus: 404}
}
func ErrBadRequest(msg string) *AppError {
    return &AppError{Code: "BAD_REQUEST", Message: msg, HTTPStatus: 400}
}
func ErrUnauthorized(msg string) *AppError {
    return &AppError{Code: "UNAUTHORIZED", Message: msg, HTTPStatus: 401}
}
func ErrInternal(err error) *AppError {
    return &AppError{Code: "INTERNAL_ERROR", Message: "内部服务错误",
        HTTPStatus: 500, Err: err}
}

// 统一响应函数
func respondJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func respondOK(w http.ResponseWriter, data any) {
    respondJSON(w, 200, APIResponse{Data: data})
}

func respondCreated(w http.ResponseWriter, data any) {
    respondJSON(w, 201, APIResponse{Data: data})
}

func respondError(w http.ResponseWriter, err error) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        respondJSON(w, appErr.HTTPStatus, APIResponse{
            Error: &APIError{Code: appErr.Code, Message: appErr.Message},
        })
        return
    }
    // 未知错误：500
    log.Printf("internal error: %v", err)
    respondJSON(w, 500, APIResponse{
        Error: &APIError{Code: "INTERNAL_ERROR", Message: "内部服务错误"},
    })
}

// Handler 包装：自动捕获 error
type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

func Handle(h HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        if err := h(w, r); err != nil {
            respondError(w, err)
        }
    }
}
```

### 请求解析与验证

```go
// 通用 JSON 解析 + 验证
func decodeJSON[T any](r *http.Request, v *T) error {
    if r.ContentLength > 1<<20 { // 限制 1MB
        return ErrBadRequest("request body too large")
    }

    dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
    dec.DisallowUnknownFields() // 拒绝未知字段

    if err := dec.Decode(v); err != nil {
        return ErrBadRequest("invalid JSON: " + err.Error())
    }
    return nil
}

// 用 struct tag 做验证（不依赖第三方库）
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
    Age   int    `json:"age"`
}

func (r CreateUserRequest) Validate() error {
    if r.Name == "" {
        return ErrBadRequest("name is required")
    }
    if !strings.Contains(r.Email, "@") {
        return ErrBadRequest("invalid email")
    }
    if r.Age < 0 || r.Age > 150 {
        return ErrBadRequest("invalid age")
    }
    return nil
}

// 完整 Handler 示例
func createUser(w http.ResponseWriter, r *http.Request) error {
    var req CreateUserRequest
    if err := decodeJSON(r, &req); err != nil {
        return err
    }
    if err := req.Validate(); err != nil {
        return err
    }

    user, err := userService.Create(r.Context(), req)
    if err != nil {
        return ErrInternal(err)
    }

    respondCreated(w, user)
    return nil
}
```

### API 版本化策略

```go
// 方案一：URL 路径版本（最常见）
// /api/v1/users、/api/v2/users

func setupVersionedRouter() http.Handler {
    mux := http.NewServeMux()

    // v1：旧版 API
    v1 := http.NewServeMux()
    v1.HandleFunc("GET /users", listUsersV1)
    v1.HandleFunc("POST /users", createUserV1)
    mux.Handle("/api/v1/", http.StripPrefix("/api/v1", v1))

    // v2：新版 API（破坏性变更）
    v2 := http.NewServeMux()
    v2.HandleFunc("GET /users", listUsersV2)
    v2.HandleFunc("POST /users", createUserV2)
    mux.Handle("/api/v2/", http.StripPrefix("/api/v2", v2))

    return mux
}

// 方案二：Accept 头版本（Content Negotiation）
func versionMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        accept := r.Header.Get("Accept")
        version := "v1"
        if strings.Contains(accept, "application/vnd.myapi.v2+json") {
            version = "v2"
        }
        ctx := context.WithValue(r.Context(), "apiVersion", version)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### 分页与过滤

```go
// 统一分页参数解析
type Pagination struct {
    Page     int `json:"page"`
    PageSize int `json:"pageSize"`
    Offset   int `json:"-"` // 计算得出
}

func parsePagination(r *http.Request) Pagination {
    page, _ := strconv.Atoi(r.URL.Query().Get("page"))
    if page < 1 {
        page = 1
    }
    pageSize, _ := strconv.Atoi(r.URL.Query().Get("pageSize"))
    if pageSize < 1 || pageSize > 100 {
        pageSize = 20 // 默认 20，最大 100
    }
    return Pagination{
        Page:     page,
        PageSize: pageSize,
        Offset:   (page - 1) * pageSize,
    }
}

// 分页响应
func listUsers(w http.ResponseWriter, r *http.Request) error {
    p := parsePagination(r)
    filter := r.URL.Query().Get("q") // 搜索关键词

    users, total, err := userService.List(r.Context(), p.Offset, p.PageSize, filter)
    if err != nil {
        return ErrInternal(err)
    }

    respondJSON(w, 200, APIResponse{
        Data: users,
        Meta: &Meta{
            Total:    total,
            Page:     p.Page,
            PageSize: p.PageSize,
        },
    })
    return nil
}
```

### CORS 中间件

```go
func corsMiddleware(allowedOrigins []string) func(http.Handler) http.Handler {
    originSet := make(map[string]bool)
    for _, o := range allowedOrigins {
        originSet[o] = true
    }

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")

            if originSet[origin] || len(allowedOrigins) == 0 {
                w.Header().Set("Access-Control-Allow-Origin", origin)
                w.Header().Set("Access-Control-Allow-Methods",
                    "GET, POST, PUT, DELETE, OPTIONS")
                w.Header().Set("Access-Control-Allow-Headers",
                    "Content-Type, Authorization, X-Request-ID")
                w.Header().Set("Access-Control-Max-Age", "86400")
            }

            // 预检请求直接返回
            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

### 完整 API 服务组装

```go
func NewAPIServer(cfg Config) *http.Server {
    mux := http.NewServeMux()

    // 注册路由
    mux.HandleFunc("GET /api/v1/users", Handle(listUsers))
    mux.HandleFunc("POST /api/v1/users", Handle(createUser))
    mux.HandleFunc("GET /api/v1/users/{id}", Handle(getUser))
    mux.HandleFunc("PUT /api/v1/users/{id}", Handle(updateUser))
    mux.HandleFunc("DELETE /api/v1/users/{id}", Handle(deleteUser))
    mux.HandleFunc("GET /healthz", healthCheck)

    // 中间件链（从外到内）
    handler := Chain(mux,
        corsMiddleware(cfg.AllowedOrigins),
        RecoveryMiddleware,
        LoggingMiddleware,
        RequestIDMiddleware,
        AuthMiddleware(cfg.JWTSecret),
        RateLimitMiddleware(cfg.RPS),
    )

    return &http.Server{
        Addr:              cfg.Addr,
        Handler:           handler,
        ReadHeaderTimeout: 5 * time.Second,
        WriteTimeout:      30 * time.Second,
        IdleTimeout:       120 * time.Second,
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Go 1.22 路由增强解决了什么问题？ | 标准库 ServeMux 终于支持 HTTP 方法限定（`GET /path`）和路径参数（`{id}`），无需第三方路由库即可构建 RESTful API |
| 统一错误处理为什么用 `errors.As` 而不是类型断言？ | `errors.As` 支持错误链（wrapping）；类型断言只检查顶层；`fmt.Errorf("wrap: %w", appErr)` 后类型断言失败，但 `errors.As` 仍能找到 |
| 如何防止用户传入超大请求体导致 OOM？ | `io.LimitReader(r.Body, maxBytes)` 限制读取大小；`http.MaxBytesReader` 也可，区别是它会设置 ReadTimeout；还应设置 `Server.MaxHeaderBytes` |
| API 版本化三种方案的优缺点？ | URL 路径（/v1/）：直观，可缓存，大多数场景推荐；Accept 头：更符合 REST 语义，但难调试；查询参数（?version=1）：最简单但不规范 |
| `json.Decoder.DisallowUnknownFields()` 有什么风险？ | 客户端发送的字段多一个就报错，对 API 演进不友好；通常只在强类型接口（gRPC-Gateway 等）使用；REST API 通常应忽略未知字段 |
| 分页 cursor 和 offset 的区别？ | offset 分页（LIMIT OFFSET）：实现简单，但深翻页性能差（扫描大量行）；cursor 分页：用 `WHERE id > cursor ORDER BY id LIMIT n`，性能稳定，推荐大数据集 |
