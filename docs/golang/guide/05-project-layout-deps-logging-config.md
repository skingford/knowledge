---
title: 项目结构、依赖管理、日志与配置
description: Go 工程化基础专题，聚焦项目布局、依赖管理、日志体系与配置管理实践。
search: false
---

# 项目结构、依赖管理、日志与配置

这一页先打 Go 工程化基础，把项目布局、依赖管理、日志规范和配置管理放在同一条主线上理解。

## 本页内容

- [1. 项目结构设计](#_1-项目结构设计)
- [2. 依赖管理 go mod](#_2-依赖管理-go-mod)
- [3. 日志规范](#_3-日志规范)
- [4. 配置管理](#_4-配置管理)

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
