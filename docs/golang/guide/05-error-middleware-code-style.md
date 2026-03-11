---
title: 错误码、中间件与代码规范
description: Go 可维护性专题，覆盖错误码设计、中间件封装与团队代码规范落地方式。
search: false
---

# 错误码、中间件与代码规范

这一页聚焦可维护性，覆盖错误表达方式、中间件封装习惯，以及团队协作时最常落地的代码规范。

## 本页内容

- [5. 错误码设计](#_5-错误码设计)
- [6. 中间件封装](#_6-中间件封装)
- [7. 代码规范](#_7-代码规范)

---

## 5. 错误码设计

统一的错误码体系有助于前后端协作和问题排查。

### 错误码定义

```go
package errcode

import "fmt"

// ErrCode 统一错误码
type ErrCode struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	HTTPStatus int `json:"-"` // 不序列化到响应体
}

func (e *ErrCode) Error() string {
	return fmt.Sprintf("code: %d, message: %s", e.Code, e.Message)
}

// 错误码规范：
// 1xxxx - 通用错误
// 2xxxx - 用户模块
// 3xxxx - 订单模块
// 4xxxx - 支付模块

// 通用错误码
var (
	OK              = &ErrCode{Code: 0, Message: "success", HTTPStatus: 200}
	ErrBadRequest   = &ErrCode{Code: 10001, Message: "bad request", HTTPStatus: 400}
	ErrUnauthorized = &ErrCode{Code: 10002, Message: "unauthorized", HTTPStatus: 401}
	ErrForbidden    = &ErrCode{Code: 10003, Message: "forbidden", HTTPStatus: 403}
	ErrNotFound     = &ErrCode{Code: 10004, Message: "not found", HTTPStatus: 404}
	ErrInternal     = &ErrCode{Code: 10005, Message: "internal server error", HTTPStatus: 500}
	ErrRateLimit    = &ErrCode{Code: 10006, Message: "rate limit exceeded", HTTPStatus: 429}
)

// 用户模块错误码
var (
	ErrUserNotFound      = &ErrCode{Code: 20001, Message: "user not found", HTTPStatus: 404}
	ErrUserAlreadyExists = &ErrCode{Code: 20002, Message: "user already exists", HTTPStatus: 409}
	ErrInvalidPassword   = &ErrCode{Code: 20003, Message: "invalid password", HTTPStatus: 401}
	ErrEmailExists       = &ErrCode{Code: 20004, Message: "email already registered", HTTPStatus: 409}
)

// 订单模块错误码
var (
	ErrOrderNotFound     = &ErrCode{Code: 30001, Message: "order not found", HTTPStatus: 404}
	ErrInsufficientStock = &ErrCode{Code: 30002, Message: "insufficient stock", HTTPStatus: 422}
)
```

### 错误码注册与查询

```go
package errcode

import "sync"

var (
	mu       sync.RWMutex
	registry = map[int]*ErrCode{}
)

func init() {
	// 注册所有已定义的错误码
	codes := []*ErrCode{
		OK, ErrBadRequest, ErrUnauthorized, ErrForbidden, ErrNotFound, ErrInternal,
		ErrUserNotFound, ErrUserAlreadyExists, ErrInvalidPassword,
		ErrOrderNotFound, ErrInsufficientStock,
	}
	for _, c := range codes {
		Register(c)
	}
}

func Register(e *ErrCode) {
	mu.Lock()
	defer mu.Unlock()
	if _, exists := registry[e.Code]; exists {
		panic(fmt.Sprintf("duplicate error code: %d", e.Code))
	}
	registry[e.Code] = e
}

func Lookup(code int) (*ErrCode, bool) {
	mu.RLock()
	defer mu.RUnlock()
	e, ok := registry[code]
	return e, ok
}
```

### 统一 API 响应

```go
package response

import (
	"encoding/json"
	"net/http"

	"myproject/pkg/errcode"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusOK, &Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func Error(w http.ResponseWriter, e *errcode.ErrCode) {
	writeJSON(w, e.HTTPStatus, &Response{
		Code:    e.Code,
		Message: e.Message,
	})
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
```

::: tip 讲解重点
1. **错误码按模块分段**：使用 5 位数字编码，万位代表模块，便于快速定位错误来源。
2. **错误码注册表防止重复**：通过 `init()` 注册 + `panic` 检测重复，在编译/启动阶段就能发现冲突。
3. **HTTP 状态码与业务错误码分离**：HTTP 状态码给网关/监控用，业务错误码给前端/客户端用，两者职责不同。
:::

---

## 6. 中间件封装

中间件（Middleware）是 HTTP 处理链中的可复用组件，负责横切关注点（日志、认证、限流等）。

### 中间件签名与链式组合

```go
package middleware

import "net/http"

// Middleware 标准中间件类型
type Middleware func(http.Handler) http.Handler

// Chain 链式组合多个中间件
func Chain(middlewares ...Middleware) Middleware {
	return func(final http.Handler) http.Handler {
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}
```

### 请求 ID 中间件

```go
package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

type ctxKey string

const RequestIDKey ctxKey = "request_id"

func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reqID := r.Header.Get("X-Request-ID")
		if reqID == "" {
			reqID = uuid.NewString()
		}
		ctx := context.WithValue(r.Context(), RequestIDKey, reqID)
		w.Header().Set("X-Request-ID", reqID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

### 日志中间件

```go
package middleware

import (
	"log/slog"
	"net/http"
	"time"
)

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(rw, r)

		reqID, _ := r.Context().Value(RequestIDKey).(string)
		slog.Info("http request",
			"request_id", reqID,
			"method", r.Method,
			"path", r.URL.Path,
			"status", rw.statusCode,
			"latency", time.Since(start).String(),
			"ip", r.RemoteAddr,
		)
	})
}
```

### Recovery 中间件

```go
package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("panic recovered",
					"error", err,
					"stack", string(debug.Stack()),
					"path", r.URL.Path,
				)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}
```

### CORS 中间件

```go
package middleware

import "net/http"

type CORSConfig struct {
	AllowOrigins []string
	AllowMethods []string
	AllowHeaders []string
	MaxAge       int
}

func CORS(cfg CORSConfig) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			allowed := false
			for _, o := range cfg.AllowOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}
			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", joinStrings(cfg.AllowMethods))
				w.Header().Set("Access-Control-Allow-Headers", joinStrings(cfg.AllowHeaders))
				w.Header().Set("Access-Control-Max-Age", fmt.Sprintf("%d", cfg.MaxAge))
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func joinStrings(ss []string) string {
	result := ""
	for i, s := range ss {
		if i > 0 {
			result += ", "
		}
		result += s
	}
	return result
}
```

### 使用示例

```go
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/users", listUsers)

	// 链式组合中间件
	chain := middleware.Chain(
		middleware.Recovery,
		middleware.RequestID,
		middleware.Logger,
		middleware.CORS(middleware.CORSConfig{
			AllowOrigins: []string{"*"},
			AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
			AllowHeaders: []string{"Content-Type", "Authorization"},
			MaxAge:       86400,
		}),
	)

	http.ListenAndServe(":8080", chain(mux))
}
```

::: tip 讲解重点
1. **中间件执行顺序很重要**：Recovery 应放在最外层确保 panic 被捕获，RequestID 在 Logger 之前确保日志能记录请求 ID。
2. **包装 `http.ResponseWriter`** 来捕获状态码是常见技巧，因为标准库的 ResponseWriter 写入后无法再读取状态码。
3. **中间件应当是无状态的**：每次请求独立处理，共享状态通过闭包传入配置（如 CORS 的 `CORSConfig`）。
:::

---

## 7. 代码规范

遵循社区约定的代码规范能显著提升团队协作效率。

### 命名规范

```go
// 包名：小写单词，不用下划线或驼峰
package httputil  // ✅
package http_util // ❌
package httpUtil  // ❌

// 变量和函数：驼峰命名
var userCount int        // ✅ 不导出
var UserCount int        // ✅ 导出
var user_count int       // ❌

// 接口命名：单方法接口用 -er 后缀
type Reader interface {
	Read(p []byte) (n int, err error)
}

type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, user *User) error
}

// 缩写词保持全大写或全小写
var httpClient *http.Client  // ✅
var userID int64             // ✅
var userId int64             // ❌
var HTTPClient *http.Client  // ✅（导出时）

// Error 变量以 Err 开头
var ErrNotFound = errors.New("not found")     // ✅
var NotFoundError = errors.New("not found")   // ❌

// 常量用驼峰，不用全大写下划线
const maxRetries = 3        // ✅
const MAX_RETRIES = 3       // ❌（Go 不是 Java/Python）
const MaxRetries = 3        // ✅（导出时）
```

### Effective Go 常用模式

```go
// 1. 零值可用
type Buffer struct {
	data []byte
}
// Buffer{} 即可使用，无需构造函数

// 2. 构造函数返回指针，命名为 NewXxx
func NewServer(addr string, opts ...Option) *Server {
	s := &Server{addr: addr}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

// 3. Option 模式
type Option func(*Server)

func WithTimeout(d time.Duration) Option {
	return func(s *Server) { s.timeout = d }
}

func WithLogger(l *slog.Logger) Option {
	return func(s *Server) { s.logger = l }
}

// 使用：
// srv := NewServer(":8080", WithTimeout(10*time.Second), WithLogger(myLogger))

// 4. 接口在消费方定义，而非实现方
// ❌ 在实现包中定义接口
// package mysql
// type UserStore interface { ... }
// type userStore struct { ... }

// ✅ 在消费方定义所需的接口
// package service
// type UserRepository interface {
//     FindByID(ctx context.Context, id int64) (*User, error)
// }
```

### golangci-lint 配置

```yaml
# .golangci.yml
run:
  timeout: 5m
  go: "1.22"

linters:
  enable:
    - errcheck        # 检查未处理的错误
    - govet           # 报告可疑的构造
    - staticcheck     # 静态分析
    - unused          # 未使用的变量/函数
    - gosimple        # 简化代码建议
    - ineffassign     # 无效赋值
    - gocritic        # 代码风格检查
    - gofmt           # 格式化检查
    - misspell        # 拼写检查
    - revive          # golint 替代品
    - bodyclose       # HTTP response body 未关闭
    - contextcheck    # context 传递检查

linters-settings:
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance
  revive:
    rules:
      - name: unexported-return
        disabled: true

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - errcheck
        - gocritic
```

```bash
# 安装和使用
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# 检查当前项目
golangci-lint run ./...

# 只检查改动的文件（适合 CI）
golangci-lint run --new-from-rev=HEAD~1 ./...
```

::: tip 讲解重点
1. **Go 的命名哲学是简短且有上下文**：在 `user` 包中用 `Service` 而非 `UserService`，因为调用方写的是 `user.Service`。
2. **接口在消费方定义**是 Go 区别于 Java 的核心设计理念，它实现了真正的解耦——实现方甚至不需要知道接口的存在。
3. **golangci-lint 整合了 50+ 检查工具**，配置一次即可替代手动逐个安装 linter，建议在 CI 中强制执行。
:::

---
