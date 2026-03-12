---
title: zap 高性能日志源码精读
description: 精读 Uber zap 的高性能结构化日志实现，掌握 zapcore 分层架构、Logger/SugaredLogger 取舍、自定义编码器、日志轮转与生产级日志最佳实践。
---

# zap：高性能结构化日志源码精读

> 核心包：`go.uber.org/zap`、`go.uber.org/zap/zapcore`

## 包结构图

```
zap 体系
══════════════════════════════════════════════════════════════════

  分层架构：
  ┌─────────────────────────────────────────┐
  │           zap.Logger（用户层）           │
  │  ├── zap.Logger       ← 零分配，强类型字段│
  │  └── zap.SugaredLogger← printf 风格，有分配│
  ├─────────────────────────────────────────┤
  │           zapcore（核心层）              │
  │  ├── Core             ← 写入决策（级别+编码+输出）│
  │  ├── Encoder          ← JSON / Console 格式化   │
  │  ├── WriteSyncer      ← os.Stderr / 文件 / 多路  │
  │  └── LevelEnabler     ← 动态级别过滤            │
  └─────────────────────────────────────────┘

  性能对比（ns/op，来自官方 benchmark）：
  ┌────────────────────┬────────┬──────────┐
  │ Logger             │ ns/op  │ allocs/op│
  ├────────────────────┼────────┼──────────┤
  │ zap.Logger         │  ~98   │    0     │
  │ zap.SugaredLogger  │  ~200  │    1     │
  │ logrus             │  ~3000 │   24     │
  │ fmt.Println        │  ~1300 │    2     │
  └────────────────────┴────────┴──────────┘

  日志级别（低 → 高）：
  Debug → Info → Warn → Error → DPanic → Panic → Fatal

══════════════════════════════════════════════════════════════════
```

---

## 一、核心示例

```go
import (
    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

// 生产环境：JSON 格式 + Error 级别 stderr
func newProductionLogger() *zap.Logger {
    logger, _ := zap.NewProduction()
    defer logger.Sync() // 确保缓冲区刷盘
    return logger
}

// 开发环境：Console 格式 + Debug 级别 + 彩色输出
func newDevelopmentLogger() *zap.Logger {
    logger, _ := zap.NewDevelopment()
    return logger
}

// 使用（零分配强类型字段）
func example(logger *zap.Logger) {
    logger.Info("server started",
        zap.String("host", "0.0.0.0"),
        zap.Int("port", 8080),
        zap.Duration("startup", 230*time.Millisecond),
    )

    logger.Error("database error",
        zap.Error(err),
        zap.String("query", "SELECT * FROM users"),
        zap.Int64("user_id", 12345),
    )
}
```

---

## 二、代码示例

### zapcore：自定义 Core（生产推荐配置）

```go
// 生产级自定义 Logger：JSON 格式 + 文件轮转 + 多级别输出
func newCustomLogger(logPath string) *zap.Logger {
    // 编码配置
    encoderCfg := zapcore.EncoderConfig{
        TimeKey:        "time",
        LevelKey:       "level",
        NameKey:        "logger",
        CallerKey:      "caller",
        FunctionKey:    zapcore.OmitKey,
        MessageKey:     "msg",
        StacktraceKey:  "stacktrace",
        LineEnding:     zapcore.DefaultLineEnding,
        EncodeLevel:    zapcore.LowercaseLevelEncoder,   // "info"
        EncodeTime:     zapcore.ISO8601TimeEncoder,       // "2006-01-02T15:04:05.000Z0700"
        EncodeDuration: zapcore.MillisDurationEncoder,   // 毫秒
        EncodeCaller:   zapcore.ShortCallerEncoder,      // "pkg/file.go:42"
    }

    // 输出目标 1：所有级别写文件（Info+）
    fileEncoder := zapcore.NewJSONEncoder(encoderCfg)
    fileWriter := zapcore.AddSync(&lumberjack.Logger{
        Filename:   logPath,
        MaxSize:    100,  // MB
        MaxBackups: 7,
        MaxAge:     30,   // 天
        Compress:   true, // gzip 压缩旧文件
    })
    fileCore := zapcore.NewCore(fileEncoder, fileWriter, zapcore.InfoLevel)

    // 输出目标 2：Error+ 同时写 stderr（方便容器日志采集）
    consoleEncoder := zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())
    stderrWriter := zapcore.AddSync(os.Stderr)
    stderrCore := zapcore.NewCore(consoleEncoder, stderrWriter, zapcore.ErrorLevel)

    // 合并多个 Core
    core := zapcore.NewTee(fileCore, stderrCore)

    return zap.New(core,
        zap.AddCaller(),              // 记录调用位置
        zap.AddCallerSkip(0),
        zap.AddStacktrace(zapcore.ErrorLevel), // Error+ 记录堆栈
    )
}
```

### Logger vs SugaredLogger

```go
// zap.Logger：零分配，强类型字段（性能关键路径推荐）
func withLogger(logger *zap.Logger) {
    // 所有字段必须是 zap.Field 类型
    logger.Info("order created",
        zap.String("order_id", "ORD-12345"),
        zap.Float64("amount", 99.99),
        zap.Strings("items", []string{"item1", "item2"}),
        zap.Time("created_at", time.Now()),
        zap.Any("metadata", map[string]string{"source": "web"}), // any 有分配
    )
}

// SugaredLogger：printf 风格，有少量分配（日常开发更方便）
func withSugar(logger *zap.Logger) {
    sugar := logger.Sugar() // 包装为 SugaredLogger

    // Infow：key-value 对（推荐）
    sugar.Infow("order created",
        "order_id", "ORD-12345",
        "amount", 99.99,
    )

    // Infof：printf 格式（最差性能，但最易读）
    sugar.Infof("order %s created with amount %.2f", "ORD-12345", 99.99)

    // 切回 Logger
    rawLogger := sugar.Desugar()
    _ = rawLogger
}

// 最佳实践：库用 Logger，应用代码可用 Sugar
type OrderService struct {
    logger *zap.Logger // 依赖注入，不用全局变量
}

func NewOrderService(logger *zap.Logger) *OrderService {
    return &OrderService{
        logger: logger.Named("order"), // 给 logger 添加名称
    }
}
```

### 字段类型全览

```go
// zap 内置字段类型（所有类型均零分配）
func fieldExamples(logger *zap.Logger) {
    logger.Info("all field types",
        // 基础类型
        zap.String("str", "value"),
        zap.Int("int", 42),
        zap.Int64("int64", int64(100)),
        zap.Float64("float64", 3.14),
        zap.Bool("bool", true),
        zap.Duration("duration", 5*time.Second),
        zap.Time("time", time.Now()),

        // 错误（自动提取 Error() 和 stacktrace）
        zap.Error(errors.New("something went wrong")),
        zap.NamedError("db_error", dbErr),

        // 集合（有分配）
        zap.Strings("tags", []string{"a", "b"}),
        zap.Ints("ids", []int{1, 2, 3}),

        // 二进制
        zap.Binary("data", []byte("raw")),
        zap.ByteString("bs", []byte("hello")),

        // 任意类型（使用 reflect，有分配）
        zap.Any("obj", someStruct),

        // 跳过空值
        zap.Skip(), // 条件跳过字段
    )
}
```

### With：上下文字段（请求追踪）

```go
// With：创建携带固定字段的子 Logger（零分配字段）
func handleRequest(logger *zap.Logger, r *http.Request) {
    // 为每个请求创建带 traceID 的子 Logger
    reqLogger := logger.With(
        zap.String("trace_id", r.Header.Get("X-Trace-ID")),
        zap.String("request_id", uuid.New().String()),
        zap.String("method", r.Method),
        zap.String("path", r.URL.Path),
        zap.String("remote_addr", r.RemoteAddr),
    )

    // reqLogger 的所有日志都自动带上以上字段
    reqLogger.Info("request started")

    // 传递给下游函数（避免函数签名污染）
    result, err := processRequest(reqLogger, r)
    if err != nil {
        reqLogger.Error("request failed", zap.Error(err))
        return
    }

    reqLogger.Info("request completed",
        zap.Int("status", 200),
        zap.Any("result", result),
    )
}

// HTTP 中间件：为每个请求注入 logger
func LoggerMiddleware(logger *zap.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            reqLogger := logger.With(
                zap.String("trace_id", r.Header.Get("X-Trace-ID")),
                zap.String("method", r.Method),
                zap.String("path", r.URL.Path),
            )

            // 将 logger 存入 context
            ctx := context.WithValue(r.Context(), loggerKey, reqLogger)
            next.ServeHTTP(w, r.WithContext(ctx))

            reqLogger.Info("request completed",
                zap.Duration("latency", time.Since(start)),
            )
        })
    }
}

// 从 context 取 logger
func LoggerFromContext(ctx context.Context) *zap.Logger {
    if logger, ok := ctx.Value(loggerKey).(*zap.Logger); ok {
        return logger
    }
    return zap.L() // 回退到全局 Logger
}
```

### 动态日志级别（AtomicLevel）

```go
// AtomicLevel：运行时动态调整日志级别（不重启服务）
func newDynamicLogger() (*zap.Logger, zap.AtomicLevel) {
    level := zap.NewAtomicLevelAt(zapcore.InfoLevel)

    logger := zap.New(zapcore.NewCore(
        zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
        zapcore.AddSync(os.Stdout),
        level, // 传入 AtomicLevel
    ))

    return logger, level
}

// HTTP 接口动态调整级别
func registerLevelHandler(mux *http.ServeMux, level zap.AtomicLevel) {
    // GET /log-level → 当前级别
    // PUT /log-level {"level": "debug"} → 修改级别
    mux.Handle("/log-level", level) // AtomicLevel 实现了 http.Handler
}

// 使用示例
func main() {
    logger, level := newDynamicLogger()
    defer logger.Sync()

    mux := http.NewServeMux()
    registerLevelHandler(mux, level)

    // 动态开启 Debug（用于线上排查问题）
    // curl -X PUT http://localhost:8080/log-level -d '{"level":"debug"}'
    go http.ListenAndServe(":8080", mux)
}
```

### 与 slog 互通（Go 1.21+）

```go
// zap 作为 slog 的 Handler（统一日志接口）
import "go.uber.org/zap/exp/zapslog"

func integrateWithSlog(logger *zap.Logger) {
    // 用 zap 作为 slog 后端
    handler := zapslog.NewHandler(logger.Core(),
        zapslog.WithCaller(true),
    )
    slogLogger := slog.New(handler)

    // 现在可以用标准库 slog API，底层走 zap
    slogLogger.Info("message from slog",
        slog.String("key", "value"),
        slog.Int("count", 42),
    )

    // 设置为全局 slog Logger
    slog.SetDefault(slogLogger)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| zap 为什么比 logrus 快 10x 以上？ | 零分配字段（`zap.Field` 是预分配结构，不用 `interface{}`）；不用 `fmt.Sprintf`；JSON 编码器直接写 bytes.Buffer；避免反射 |
| `Logger` 和 `SugaredLogger` 如何选择？ | `Logger`：零分配，适合热路径、库代码；`SugaredLogger`：有 1-2 次分配，适合应用层业务代码；可随时 `.Sugar()` / `.Desugar()` 切换 |
| `zap.With()` 的原理？ | 克隆 Logger 并追加固定字段（字段在 `With` 时序列化为 bytes，后续日志只 append，不重复序列化）；适合 request-scoped 日志 |
| `zapcore.NewTee` 的作用？ | 将多个 `Core` 合并为一个，日志同时写入所有目标；常见用法：Info+ 写文件，Error+ 写 stderr 或告警系统 |
| `AtomicLevel` 有什么用？ | 提供线程安全的级别修改，实现 `http.Handler` 可通过 HTTP 接口动态调整级别；线上问题排查时临时开 Debug 无需重启 |
| 如何避免日志导致性能问题？ | 检查 `logger.Core().Enabled(level)` 后再构造字段（尤其是昂贵的 `zap.Any`）；用 `zap.Stringer` 延迟 String() 调用；避免在热路径用 SugaredLogger |
