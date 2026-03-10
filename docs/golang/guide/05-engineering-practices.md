# 工程实践

## 适合人群

- 已能写 Go 项目，想提升代码质量和工程规范
- 需要在团队中推动 Go 最佳实践
- 想系统掌握测试、CI/CD、项目结构等工程化能力

## 学习目标

- 掌握标准 Go 项目结构设计与依赖管理
- 建立完善的日志、配置、错误码体系
- 能编写高质量的单元测试、Mock 测试、集成测试和基准测试
- 搭建自动化 CI/CD 流水线

## 快速导航

- [1. 项目结构设计](#_1-项目结构设计)
- [2. 依赖管理 go mod](#_2-依赖管理-go-mod)
- [3. 日志规范](#_3-日志规范)
- [4. 配置管理](#_4-配置管理)
- [5. 错误码设计](#_5-错误码设计)
- [6. 中间件封装](#_6-中间件封装)
- [7. 代码规范](#_7-代码规范)
- [8. 单元测试](#_8-单元测试)
- [9. Mock 测试](#_9-mock-测试)
- [10. 集成测试](#_10-集成测试)
- [11. Benchmark](#_11-benchmark)
- [12. CI/CD](#_12-ci-cd)

---

## 1. 项目结构设计

Go 社区推荐的项目布局遵循 **关注点分离** 原则，常见模式为 `cmd/internal/pkg` 三层结构。

### 标准项目结构

```
myproject/
├── cmd/                    # 入口程序（可多个）
│   ├── api-server/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/               # 私有代码，不可被外部 import
│   ├── handler/            # HTTP handler
│   ├── service/            # 业务逻辑层
│   ├── repository/         # 数据访问层
│   ├── model/              # 数据模型
│   └── middleware/         # 中间件
├── pkg/                    # 可被外部项目引用的公共库
│   ├── errcode/
│   ├── httputil/
│   └── logger/
├── configs/                # 配置文件模板
├── scripts/                # 构建、部署脚本
├── docs/                   # 项目文档
├── api/                    # API 定义（OpenAPI, protobuf）
├── deployments/            # Docker、K8s 部署文件
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

### 领域驱动（DDD）布局

适合复杂业务系统，按领域划分模块：

```
myproject/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── user/               # 用户领域
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── model.go
│   ├── order/              # 订单领域
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── model.go
│   └── shared/             # 跨领域共享
│       ├── middleware/
│       └── config/
├── pkg/
│   └── response/
├── go.mod
└── Makefile
```

### cmd 入口示例

```go
// cmd/api-server/main.go
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"myproject/internal/handler"
	"myproject/internal/service"
)

func main() {
	// 初始化依赖
	svc := service.NewUserService()
	h := handler.NewUserHandler(svc)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /users/{id}", h.GetUser)

	srv := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// 优雅关闭
	go func() {
		slog.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	slog.Info("server stopped")
}
```

::: tip 讲解重点
1. **`internal/` 是 Go 编译器强制的访问控制**：任何 `internal/` 下的包只能被其父目录的代码导入，这比注释约定更可靠。
2. **`cmd/` 下每个子目录对应一个可执行文件**，`main.go` 应保持精简，只做依赖组装和启动，业务逻辑放在 `internal/`。
3. **按团队规模选择布局**：小项目用扁平结构即可，中大型项目推荐标准分层或 DDD 布局，避免过度设计。
:::

---

## 2. 依赖管理 go mod

Go Modules 是 Go 官方的依赖管理方案，从 Go 1.16 起默认开启。

### 基础命令

```bash
# 初始化模块
go mod init github.com/yourname/myproject

# 整理依赖（添加缺失、移除未用）
go mod tidy

# 将依赖复制到 vendor 目录
go mod vendor

# 查看依赖图
go mod graph

# 验证依赖完整性
go mod verify

# 查看某个依赖的所有可用版本
go list -m -versions github.com/gin-gonic/gin
```

### go.mod 详解

```go
module github.com/yourname/myproject

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/spf13/viper v1.18.2
    go.uber.org/zap v1.27.0
)

// 版本锁定：强制使用特定版本
require github.com/some/lib v1.2.3

// replace 指令：本地开发调试、fork 替换
replace (
    // 替换为本地路径（开发调试用）
    github.com/some/lib => ../my-local-lib

    // 替换为 fork 版本
    github.com/original/pkg => github.com/myfork/pkg v1.0.1
)

// exclude 指令：排除有问题的版本
exclude github.com/some/lib v1.1.0
```

### 私有模块配置

```bash
# 设置私有模块路径，跳过 GOPROXY 和校验
export GOPRIVATE=github.com/yourcompany/*,gitlab.internal.com/*

# 或使用 GONOSUMCHECK 跳过校验
export GONOSUMCHECK=github.com/yourcompany/*

# 配置 Git 使用 SSH 拉取私有仓库
git config --global url."git@github.com:yourcompany/".insteadOf "https://github.com/yourcompany/"
```

### 版本管理最佳实践

```go
// 使用 go mod edit 精确控制版本
// go mod edit -require github.com/some/lib@v1.2.3

// 查看为什么需要某个依赖
// go mod why github.com/some/lib

// 升级所有依赖到最新的小版本
// go get -u ./...

// 只升级补丁版本
// go get -u=patch ./...
```

::: tip 讲解重点
1. **始终提交 `go.sum`**：它保证了依赖的完整性校验，团队成员拉取代码后能获得完全一致的依赖版本。
2. **`replace` 指令适合临时调试**，不要长期保留在 go.mod 中；发布开源库时必须移除 replace。
3. **善用 `GOPRIVATE`**：在企业内部项目中，正确配置私有模块路径可以避免依赖拉取失败和安全问题。
:::

---

## 3. 日志规范

Go 1.21 引入的 `log/slog` 是官方推荐的结构化日志库，适合生产环境使用。

### slog 基础用法

```go
package main

import (
	"log/slog"
	"os"
)

func main() {
	// 默认文本格式
	slog.Info("server starting", "port", 8080)

	// JSON 格式（生产环境推荐）
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(jsonHandler)
	slog.SetDefault(logger)

	slog.Info("user login",
		"user_id", 12345,
		"ip", "192.168.1.1",
		"method", "POST",
	)
	// 输出: {"time":"...","level":"INFO","msg":"user login","user_id":12345,"ip":"192.168.1.1","method":"POST"}
}
```

### 日志级别与动态调整

```go
package main

import (
	"log/slog"
	"os"
)

func main() {
	// 使用 LevelVar 支持运行时动态调整日志级别
	var level slog.LevelVar
	level.Set(slog.LevelInfo)

	handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: &level,
	})
	logger := slog.New(handler)
	slog.SetDefault(logger)

	slog.Debug("this will not print")  // 低于 Info，被过滤
	slog.Info("this will print")
	slog.Warn("warning message")
	slog.Error("error occurred", "err", "connection refused")

	// 运行时切换到 Debug 级别（可通过 HTTP 接口触发）
	level.Set(slog.LevelDebug)
	slog.Debug("now debug prints") // 切换后可见
}
```

### Context 感知日志

```go
package main

import (
	"context"
	"log/slog"
	"os"
)

// 自定义 context key
type ctxKey string

const requestIDKey ctxKey = "request_id"

// ContextHandler 从 context 中提取字段并自动附加到日志
type ContextHandler struct {
	slog.Handler
}

func (h *ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	if reqID, ok := ctx.Value(requestIDKey).(string); ok {
		r.AddAttrs(slog.String("request_id", reqID))
	}
	return h.Handler.Handle(ctx, r)
}

func main() {
	base := slog.NewJSONHandler(os.Stdout, nil)
	logger := slog.New(&ContextHandler{Handler: base})
	slog.SetDefault(logger)

	// 模拟带 request_id 的请求上下文
	ctx := context.WithValue(context.Background(), requestIDKey, "req-abc-123")
	slog.InfoContext(ctx, "processing request", "path", "/api/users")
	// 输出包含 request_id 字段
}
```

### 日志分组与子 Logger

```go
func processOrder(logger *slog.Logger, orderID string) {
	// 创建带固定字段的子 logger
	orderLogger := logger.With(
		slog.String("order_id", orderID),
		slog.String("module", "order"),
	)

	orderLogger.Info("order processing started")
	// ... 处理逻辑
	orderLogger.Info("order completed", "total", 99.9)
}

// 使用 Group 对字段分组
func logWithGroup() {
	slog.Info("request handled",
		slog.Group("request",
			slog.String("method", "GET"),
			slog.String("path", "/users"),
		),
		slog.Group("response",
			slog.Int("status", 200),
			slog.Duration("latency", 42_000_000),
		),
	)
}
```

::: tip 讲解重点
1. **生产环境使用 JSON 格式**：便于 ELK/Loki 等日志系统采集和检索，文本格式仅用于本地开发。
2. **通过 `LevelVar` 实现动态日志级别**：可以在不重启服务的情况下临时开启 Debug 日志排查问题。
3. **日志不要记录敏感信息**（密码、token、身份证号等），可使用自定义 `slog.Handler` 对敏感字段脱敏。
:::

---

## 4. 配置管理

良好的配置管理遵循 [12-Factor App](https://12factor.net/config) 原则：配置与代码分离，优先使用环境变量。

### 环境变量方式

```go
package main

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port         int
	DatabaseURL  string
	ReadTimeout  time.Duration
	Debug        bool
}

func LoadFromEnv() (*Config, error) {
	port, _ := strconv.Atoi(getEnvOrDefault("APP_PORT", "8080"))
	timeout, _ := time.ParseDuration(getEnvOrDefault("APP_READ_TIMEOUT", "10s"))
	debug, _ := strconv.ParseBool(getEnvOrDefault("APP_DEBUG", "false"))

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		ReadTimeout: timeout,
		Debug:       debug,
	}, nil
}

func getEnvOrDefault(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
```

### Viper 配置管理

```go
package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"`
	Log      LogConfig      `mapstructure:"log"`
}

type ServerConfig struct {
	Port         int           `mapstructure:"port"`
	ReadTimeout  time.Duration `mapstructure:"read_timeout"`
	WriteTimeout time.Duration `mapstructure:"write_timeout"`
}

type DatabaseConfig struct {
	DSN             string `mapstructure:"dsn"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
}

type RedisConfig struct {
	Addr     string `mapstructure:"addr"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type LogConfig struct {
	Level  string `mapstructure:"level"`
	Format string `mapstructure:"format"`
}

func Load(configPath string) (*Config, error) {
	v := viper.New()

	// 设置默认值
	v.SetDefault("server.port", 8080)
	v.SetDefault("server.read_timeout", "10s")
	v.SetDefault("server.write_timeout", "10s")
	v.SetDefault("database.max_open_conns", 25)
	v.SetDefault("database.max_idle_conns", 5)
	v.SetDefault("log.level", "info")
	v.SetDefault("log.format", "json")

	// 读取配置文件
	v.SetConfigFile(configPath)
	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("read config: %w", err)
	}

	// 环境变量覆盖（APP_SERVER_PORT -> server.port）
	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	if err := validate(&cfg); err != nil {
		return nil, fmt.Errorf("validate config: %w", err)
	}

	return &cfg, nil
}

func validate(cfg *Config) error {
	if cfg.Server.Port < 1 || cfg.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", cfg.Server.Port)
	}
	if cfg.Database.DSN == "" {
		return fmt.Errorf("database DSN is required")
	}
	return nil
}
```

### 配置文件示例

```yaml
# configs/config.yaml
server:
  port: 8080
  read_timeout: 10s
  write_timeout: 10s

database:
  dsn: "postgres://user:pass@localhost:5432/mydb?sslmode=disable"
  max_open_conns: 25
  max_idle_conns: 5
  conn_max_lifetime: 5m

redis:
  addr: "localhost:6379"
  password: ""
  db: 0

log:
  level: "info"
  format: "json"
```

::: tip 讲解重点
1. **环境变量优先级最高**：Viper 支持 配置文件 < 环境变量 < 命令行参数 的优先级链，生产环境敏感信息（密码、密钥）必须走环境变量或 Secrets Manager。
2. **配置校验前置**：在应用启动阶段就校验配置合法性，快速失败（fail fast）优于运行时报错。
3. **不要把 `config.yaml` 的真实值提交到代码仓库**，只提交 `config.yaml.example` 模板文件。
:::

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

## 8. 单元测试

Go 的 `testing` 包提供了简洁而强大的测试框架。

### 基础测试

```go
// mathutil/math.go
package mathutil

func Add(a, b int) int {
	return a + b
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("division by zero")
	}
	return a / b, nil
}
```

```go
// mathutil/math_test.go
package mathutil

import (
	"math"
	"testing"
)

func TestAdd(t *testing.T) {
	got := Add(2, 3)
	want := 5
	if got != want {
		t.Errorf("Add(2, 3) = %d, want %d", got, want)
	}
}
```

### 表驱动测试

```go
func TestDivide(t *testing.T) {
	tests := []struct {
		name    string
		a, b    float64
		want    float64
		wantErr bool
	}{
		{"normal", 10, 2, 5, false},
		{"negative", -10, 2, -5, false},
		{"decimal", 1, 3, 0.333333, false},
		{"divide by zero", 10, 0, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("Divide(%v, %v) error = %v, wantErr %v", tt.a, tt.b, err, tt.wantErr)
				return
			}
			if !tt.wantErr && math.Abs(got-tt.want) > 0.001 {
				t.Errorf("Divide(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}
```

### 测试辅助函数

```go
// testutil/helper.go
package testutil

import "testing"

// AssertEqual 通用断言辅助函数
func AssertEqual[T comparable](t *testing.T, got, want T) {
	t.Helper() // 标记为辅助函数，错误信息显示调用方行号
	if got != want {
		t.Errorf("got %v, want %v", got, want)
	}
}

// AssertNoError 断言无错误
func AssertNoError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// AssertError 断言有错误
func AssertError(t *testing.T, err error) {
	t.Helper()
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
```

### 使用 testify 简化断言

```go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserService(t *testing.T) {
	svc := NewUserService()

	t.Run("create user", func(t *testing.T) {
		user, err := svc.Create("alice", "alice@example.com")
		require.NoError(t, err)                 // 失败直接终止
		assert.Equal(t, "alice", user.Name)      // 失败继续执行
		assert.NotZero(t, user.ID)
		assert.NotEmpty(t, user.CreatedAt)
	})

	t.Run("duplicate email", func(t *testing.T) {
		_, err := svc.Create("bob", "alice@example.com")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrEmailExists)
	})
}
```

### 覆盖率

```bash
# 运行测试并输出覆盖率
go test -cover ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...

# 查看 HTML 报告
go tool cover -html=coverage.out -o coverage.html

# 按函数查看覆盖率
go tool cover -func=coverage.out
```

::: tip 讲解重点
1. **表驱动测试是 Go 的核心测试模式**：所有用例集中在一个 slice 中，新增用例只需加一行，减少了重复代码。
2. **`t.Helper()` 让错误定位更准确**：在辅助函数中调用它，出错时报告的是调用方的行号而非辅助函数内部。
3. **`require` 与 `assert` 的区别**：`require` 失败后立即终止当前测试（`t.FailNow()`），`assert` 失败后继续执行后续断言，按场景选用。
:::

---

## 9. Mock 测试

Mock 测试通过替换外部依赖（数据库、HTTP 服务等）来实现单元级别的隔离测试。

### 基于接口的 Mock

```go
// repository/user.go - 定义接口
package repository

import "context"

type User struct {
	ID    int64
	Name  string
	Email string
}

type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, user *User) error
}
```

```go
// service/user.go - 业务层依赖接口
package service

import (
	"context"
	"fmt"

	"myproject/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUser(ctx context.Context, id int64) (*repository.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user %d not found", id)
	}
	return user, nil
}
```

### 手写 Mock

```go
// service/user_test.go
package service

import (
	"context"
	"errors"
	"testing"

	"myproject/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockUserRepo 手写 mock 实现
type mockUserRepo struct {
	findByIDFunc func(ctx context.Context, id int64) (*repository.User, error)
	createFunc   func(ctx context.Context, user *repository.User) error
}

func (m *mockUserRepo) FindByID(ctx context.Context, id int64) (*repository.User, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockUserRepo) Create(ctx context.Context, user *repository.User) error {
	return m.createFunc(ctx, user)
}

func TestGetUser(t *testing.T) {
	tests := []struct {
		name     string
		id       int64
		mockRepo *mockUserRepo
		want     *repository.User
		wantErr  bool
	}{
		{
			name: "user found",
			id:   1,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return &repository.User{ID: 1, Name: "alice"}, nil
				},
			},
			want: &repository.User{ID: 1, Name: "alice"},
		},
		{
			name: "user not found",
			id:   999,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return nil, nil
				},
			},
			wantErr: true,
		},
		{
			name: "db error",
			id:   1,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return nil, errors.New("connection refused")
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewUserService(tt.mockRepo)
			got, err := svc.GetUser(context.Background(), tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want.ID, got.ID)
			assert.Equal(t, tt.want.Name, got.Name)
		})
	}
}
```

### 使用 testify/mock

```go
package service

import (
	"context"
	"testing"

	"myproject/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepo 使用 testify/mock
type MockUserRepo struct {
	mock.Mock
}

func (m *MockUserRepo) FindByID(ctx context.Context, id int64) (*repository.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserRepo) Create(ctx context.Context, user *repository.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func TestGetUser_WithTestifyMock(t *testing.T) {
	mockRepo := new(MockUserRepo)

	// 设置期望
	mockRepo.On("FindByID", mock.Anything, int64(1)).
		Return(&repository.User{ID: 1, Name: "alice"}, nil)

	svc := NewUserService(mockRepo)
	user, err := svc.GetUser(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, "alice", user.Name)

	// 验证 mock 方法被正确调用
	mockRepo.AssertExpectations(t)
	mockRepo.AssertCalled(t, "FindByID", mock.Anything, int64(1))
}
```

### 使用 gomock

```bash
# 安装 mockgen
go install go.uber.org/mock/mockgen@latest

# 从接口生成 mock 代码
mockgen -source=internal/repository/user.go -destination=internal/repository/mock/user_mock.go -package=mock
```

```go
package service

import (
	"context"
	"testing"

	"myproject/internal/repository/mock"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"
)

func TestGetUser_WithGoMock(t *testing.T) {
	ctrl := gomock.NewController(t)

	mockRepo := mock.NewMockUserRepository(ctrl)
	mockRepo.EXPECT().
		FindByID(gomock.Any(), int64(1)).
		Return(&repository.User{ID: 1, Name: "alice"}, nil).
		Times(1)

	svc := NewUserService(mockRepo)
	user, err := svc.GetUser(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, "alice", user.Name)
}
```

::: tip 讲解重点
1. **Mock 的前提是面向接口编程**：只有业务层依赖接口而非具体实现，才能在测试中注入 Mock 对象。
2. **手写 Mock 适合简单场景**，使用函数字段的方式灵活且无第三方依赖；`testify/mock` 和 `gomock` 适合接口方法多、需要验证调用次数/顺序的场景。
3. **不要 Mock 一切**：只 Mock 外部依赖（数据库、HTTP 调用、消息队列），纯业务逻辑的内部函数不需要 Mock。
:::

---

## 10. 集成测试

集成测试验证多个组件协作的正确性，通常涉及真实数据库或外部服务。

### TestMain 生命周期管理

```go
package integration

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

var testDB *sql.DB

func TestMain(m *testing.M) {
	// Setup：在所有测试执行前运行
	var err error
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://test:test@localhost:5433/testdb?sslmode=disable"
	}

	testDB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("connect to test db: %v", err)
	}

	// 执行迁移
	if err := runMigrations(testDB); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	// 运行所有测试
	code := m.Run()

	// Teardown：在所有测试执行后运行
	testDB.Close()
	os.Exit(code)
}

func runMigrations(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(200) UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	return err
}

// cleanTable 每个测试前清理数据
func cleanTable(t *testing.T, tables ...string) {
	t.Helper()
	for _, table := range tables {
		_, err := testDB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Fatalf("clean table %s: %v", table, err)
		}
	}
}
```

### 数据库集成测试

```go
package integration

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository_Create(t *testing.T) {
	cleanTable(t, "users")

	repo := NewUserRepository(testDB)
	ctx := context.Background()

	user := &User{Name: "alice", Email: "alice@example.com"}
	err := repo.Create(ctx, user)
	require.NoError(t, err)
	assert.NotZero(t, user.ID)

	// 验证数据确实写入
	got, err := repo.FindByID(ctx, user.ID)
	require.NoError(t, err)
	assert.Equal(t, "alice", got.Name)
	assert.Equal(t, "alice@example.com", got.Email)
}

func TestUserRepository_DuplicateEmail(t *testing.T) {
	cleanTable(t, "users")

	repo := NewUserRepository(testDB)
	ctx := context.Background()

	user1 := &User{Name: "alice", Email: "same@example.com"}
	require.NoError(t, repo.Create(ctx, user1))

	user2 := &User{Name: "bob", Email: "same@example.com"}
	err := repo.Create(ctx, user2)
	assert.Error(t, err) // 应当因唯一约束失败
}
```

### 使用 Testcontainers

```go
package integration

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	_ "github.com/lib/pq"
)

func setupPostgresContainer(t *testing.T) (*sql.DB, func()) {
	t.Helper()
	ctx := context.Background()

	// 启动 PostgreSQL 容器
	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "test",
			"POSTGRES_PASSWORD": "test",
			"POSTGRES_DB":       "testdb",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(30 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		t.Fatalf("start container: %v", err)
	}

	host, _ := container.Host(ctx)
	port, _ := container.MappedPort(ctx, "5432")

	dsn := fmt.Sprintf("postgres://test:test@%s:%s/testdb?sslmode=disable", host, port.Port())
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("connect db: %v", err)
	}

	// 返回清理函数
	cleanup := func() {
		db.Close()
		container.Terminate(ctx)
	}

	return db, cleanup
}

func TestWithContainer(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	db, cleanup := setupPostgresContainer(t)
	defer cleanup()

	// 使用真实数据库执行测试
	_, err := db.Exec(`CREATE TABLE test_items (id SERIAL PRIMARY KEY, name TEXT)`)
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.Exec(`INSERT INTO test_items (name) VALUES ($1)`, "item1")
	if err != nil {
		t.Fatal(err)
	}

	var name string
	err = db.QueryRow(`SELECT name FROM test_items WHERE id = 1`).Scan(&name)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, "item1", name)
}
```

```bash
# 运行集成测试（跳过 -short 标记的测试）
go test -v -count=1 ./internal/integration/...

# 快速运行（跳过集成测试）
go test -short ./...

# 指定 build tag 隔离集成测试
# 在文件头部加: //go:build integration
go test -tags=integration ./...
```

::: tip 讲解重点
1. **`TestMain` 是包级别的测试生命周期钩子**：适合数据库连接、容器启动等重量级 Setup/Teardown，每个包只能有一个。
2. **Testcontainers 自动管理容器生命周期**：无需手动启停 Docker，测试结束自动清理，适合 CI 环境。
3. **用 `-short` 和 build tag 区分测试层次**：日常开发跑 `go test -short`（秒级），CI 全量跑集成测试（分钟级）。
:::

---

## 11. Benchmark

Go 内置的 benchmark 框架可以精确测量代码性能。

### 基础 Benchmark

```go
package stringutil

import (
	"fmt"
	"strings"
	"testing"
)

// 待测函数
func ConcatWithPlus(strs []string) string {
	result := ""
	for _, s := range strs {
		result += s
	}
	return result
}

func ConcatWithBuilder(strs []string) string {
	var b strings.Builder
	for _, s := range strs {
		b.WriteString(s)
	}
	return b.String()
}

func ConcatWithJoin(strs []string) string {
	return strings.Join(strs, "")
}

// Benchmark 函数
func BenchmarkConcatWithPlus(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer() // 重置计时器，排除初始化时间
	for i := 0; i < b.N; i++ {
		ConcatWithPlus(strs)
	}
}

func BenchmarkConcatWithBuilder(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConcatWithBuilder(strs)
	}
}

func BenchmarkConcatWithJoin(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConcatWithJoin(strs)
	}
}
```

### 内存分配统计

```go
func BenchmarkMapAccess(b *testing.B) {
	m := make(map[string]int, 1000)
	for i := 0; i < 1000; i++ {
		m[fmt.Sprintf("key-%d", i)] = i
	}

	b.ResetTimer()
	b.ReportAllocs() // 报告内存分配

	for i := 0; i < b.N; i++ {
		_ = m["key-500"]
	}
}

// 对比 sync.Map
func BenchmarkSyncMapAccess(b *testing.B) {
	var m sync.Map
	for i := 0; i < 1000; i++ {
		m.Store(fmt.Sprintf("key-%d", i), i)
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		m.Load("key-500")
	}
}
```

### 子 Benchmark 与不同输入规模

```go
func BenchmarkSliceAppend(b *testing.B) {
	sizes := []int{10, 100, 1000, 10000}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("size-%d", size), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				s := make([]int, 0)
				for j := 0; j < size; j++ {
					s = append(s, j)
				}
			}
		})

		b.Run(fmt.Sprintf("size-%d-prealloc", size), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				s := make([]int, 0, size) // 预分配
				for j := 0; j < size; j++ {
					s = append(s, j)
				}
			}
		})
	}
}
```

### 运行与解读结果

```bash
# 运行 benchmark
go test -bench=. -benchmem ./...

# 只运行特定 benchmark
go test -bench=BenchmarkConcat -benchmem ./...

# 多次运行取稳定值
go test -bench=. -benchmem -count=5 ./...

# 输出结果用 benchstat 分析
go test -bench=. -benchmem -count=10 ./... > old.txt
# 修改代码后再跑一次
go test -bench=. -benchmem -count=10 ./... > new.txt

# 比较前后差异
go install golang.org/x/perf/cmd/benchstat@latest
benchstat old.txt new.txt
```

```
# 输出解读示例：
# BenchmarkConcatWithPlus-8      5000   300000 ns/op   500000 B/op   99 allocs/op
#                        │       │      │               │              │
#                        │       │      │               │              └── 每次操作的内存分配次数
#                        │       │      │               └── 每次操作分配的字节数
#                        │       │      └── 每次操作耗时
#                        │       └── 循环次数（b.N）
#                        └── GOMAXPROCS
```

::: tip 讲解重点
1. **`b.ResetTimer()` 排除初始化开销**：如果 benchmark 前有数据准备工作，必须在循环前重置计时器。
2. **`b.ReportAllocs()` 暴露内存问题**：高频路径上的内存分配会增加 GC 压力，关注 `allocs/op` 指标。
3. **使用 `benchstat` 做科学对比**：单次 benchmark 结果有波动，至少跑 5-10 次取统计值才有参考意义。
:::

---

## 12. CI/CD

自动化 CI/CD 流水线保证代码质量并加速发布流程。

### GitHub Actions 基础配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          args: --timeout=5m

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Cache Go modules
        uses: actions/cache@v4
        with:
          path: ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: ${{ runner.os }}-go-

      - name: Run unit tests
        run: go test -short -race -coverprofile=coverage.out ./...

      - name: Run integration tests
        run: go test -race -tags=integration ./...
        env:
          TEST_DATABASE_URL: postgres://test:test@localhost:5432/testdb?sslmode=disable

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage.out

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Build
        run: |
          CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api-server ./cmd/api-server
          CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/worker ./cmd/worker

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: binaries
          path: bin/
```

### Release 自动化

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GoReleaser 配置

```yaml
# .goreleaser.yml
version: 2

builds:
  - id: api-server
    main: ./cmd/api-server
    binary: api-server
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X main.version={{.Version}}
      - -X main.commit={{.Commit}}
      - -X main.date={{.Date}}

dockers:
  - image_templates:
      - "ghcr.io/yourname/api-server:{{ .Tag }}"
      - "ghcr.io/yourname/api-server:latest"
    dockerfile: Dockerfile
    build_flag_templates:
      - "--platform=linux/amd64"

archives:
  - format: tar.gz
    name_template: "{{ .ProjectName }}_{{ .Os }}_{{ .Arch }}"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"
```

### Makefile 统一入口

```makefile
# Makefile
.PHONY: all build test lint clean

GO := go
BINARY := bin/api-server
GOFLAGS := -ldflags="-s -w"

all: lint test build

build:
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o $(BINARY) ./cmd/api-server

test:
	$(GO) test -short -race -cover ./...

test-integration:
	$(GO) test -race -tags=integration -count=1 ./...

lint:
	golangci-lint run ./...

fmt:
	$(GO) fmt ./...
	goimports -w .

clean:
	rm -rf bin/ coverage.out

coverage:
	$(GO) test -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html

bench:
	$(GO) test -bench=. -benchmem ./...

docker-build:
	docker build -t api-server:latest .

run:
	$(GO) run ./cmd/api-server

help:
	@echo "Available targets:"
	@echo "  build            - Build binary"
	@echo "  test             - Run unit tests"
	@echo "  test-integration - Run integration tests"
	@echo "  lint             - Run linters"
	@echo "  fmt              - Format code"
	@echo "  coverage         - Generate coverage report"
	@echo "  bench            - Run benchmarks"
	@echo "  clean            - Remove build artifacts"
```

### Dockerfile 多阶段构建

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /api-server ./cmd/api-server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /api-server /api-server

EXPOSE 8080
ENTRYPOINT ["/api-server"]
```

::: tip 讲解重点
1. **CI 流水线分阶段执行**：Lint -> Test -> Build，前一阶段失败就跳过后续步骤，节省资源并快速反馈。
2. **`-race` 标志在 CI 中必须开启**：竞态检测器能发现并发 bug，虽然会增加约 2-10x 运行时间，但在 CI 中值得。
3. **GoReleaser + GitHub Actions 实现一键发布**：打 tag 自动触发多平台构建、Docker 镜像推送和 Changelog 生成，减少人工操作失误。
:::
