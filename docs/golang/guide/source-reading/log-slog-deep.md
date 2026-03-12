---
title: log/slog 源码精读
description: 精读 log/slog 的结构化日志实现，掌握 Handler 接口设计、属性系统、Level 过滤与生产环境最佳实践。
---

# log/slog：结构化日志源码精读

> 核心源码：`src/log/slog/logger.go`、`src/log/slog/handler.go`、`src/log/slog/record.go`

## 包结构图

```
log/slog 体系（Go 1.21+）
══════════════════════════════════════════════════════════════════

  Logger（用户 API 入口）
  └── Handler（接口）← 实际日志写入逻辑
       ├── TextHandler  ← logfmt 格式（key=value）
       ├── JSONHandler  ← JSON 格式（{"key":"value"}）
       └── 自定义 Handler（实现 Handler 接口）

  Handler 接口（核心扩展点）：
  ├── Enabled(ctx, Level) bool         ← Level 过滤（热路径优化）
  ├── Handle(ctx, Record) error        ← 实际写日志
  ├── WithAttrs(attrs []Attr) Handler  ← 预附加属性（返回新 Handler）
  └── WithGroup(name string) Handler   ← 属性分组（返回新 Handler）

  Record（单条日志）：
  ├── Time    time.Time    ← 日志时间
  ├── Message string       ← 日志消息
  ├── Level   Level        ← 日志级别
  └── attrs   []Attr       ← 结构化属性列表

  Attr（键值对）：
  ├── Key   string
  └── Value Value  ← 联合类型（Int/Float/String/Bool/Time/Duration/Group/Any）

  Level 预定义（可扩展）：
  LevelDebug=-4, LevelInfo=0, LevelWarn=4, LevelError=8

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/log/slog/logger.go（简化）
type Logger struct {
    handler Handler
}

// 关键优化：先判断 Enabled，避免不必要的 Record 构建
func (l *Logger) log(ctx context.Context, level Level, msg string, args ...any) {
    if !l.Enabled(ctx, level) {
        return // Level 未达到阈值，直接返回（零开销）
    }

    r := NewRecord(time.Now(), level, msg, callerPC(3))
    r.Add(args...) // 解析 key-value 对或 Attr

    if ctx == nil {
        ctx = context.Background()
    }
    _ = l.Handler().Handle(ctx, r)
}

// src/log/slog/handler.go
type commonHandler struct {
    json              bool          // true=JSON，false=Text
    opts              HandlerOptions
    preformattedAttrs []byte        // WithAttrs 预格式化缓存
    mu                *sync.Mutex
    w                 io.Writer
}

// Handle：格式化 Record 并写入
func (h *commonHandler) Handle(_ context.Context, r Record) error {
    buf := newBuffer() // sync.Pool 复用
    defer buf.Free()
    // 格式化 time、level、source、msg、attrs
    h.mu.Lock()
    defer h.mu.Unlock()
    _, err := h.w.Write(*buf)
    return err
}
```

---

## 二、代码示例

### 快速上手

```go
import "log/slog"

func quickStart() {
    // 使用默认 logger（TextHandler，输出到 os.Stderr）
    slog.Info("server started", "port", 8080)
    // 输出：time=2024-01-01T00:00:00.000Z level=INFO msg="server started" port=8080

    slog.Warn("slow query", "duration", 2*time.Second, "sql", "SELECT ...")
    slog.Error("connection failed", "error", err)

    // 类型安全的 Attr（避免反射，性能更好）
    slog.Info("user login",
        slog.Int("user_id", 42),
        slog.String("name", "Alice"),
        slog.Duration("session", 30*time.Minute),
    )
}
```

### 配置 JSON Handler（生产推荐）

```go
func setupProductionLogger() *slog.Logger {
    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level:     slog.LevelInfo, // 生产环境不记录 Debug
        AddSource: true,           // 添加文件:行号
        ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
            // 自定义属性格式
            if a.Key == slog.TimeKey {
                // 统一时间格式为 Unix 时间戳（便于日志系统索引）
                return slog.Int64("ts", a.Value.Time().Unix())
            }
            if a.Key == slog.LevelKey {
                // 统一 level 为小写
                return slog.String("level", strings.ToLower(a.Value.String()))
            }
            return a
        },
    })

    return slog.New(handler)
}

// 输出格式：
// {"ts":1704067200,"level":"info","source":{"function":"main.xxx","file":"main.go","line":42},"msg":"server started","port":8080}
```

### WithAttrs 预绑定属性

```go
// WithAttrs 返回新 Logger，预格式化属性（避免重复序列化）
func contextualLogging(baseLogger *slog.Logger) {
    // 为每个请求创建携带请求 ID 的 logger
    requestLogger := baseLogger.With(
        "request_id", "req-abc123",
        "user_id", 42,
    )

    requestLogger.Info("processing request")
    requestLogger.Info("db query", "table", "users", "rows", 5)
    // 每条日志都自动包含 request_id 和 user_id
}

// HTTP 中间件：将 logger 注入 context
func loggingMiddleware(logger *slog.Logger, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        reqLogger := logger.With(
            "method", r.Method,
            "path", r.URL.Path,
            "request_id", r.Header.Get("X-Request-ID"),
        )

        // 将 logger 注入 context，供下游使用
        ctx := context.WithValue(r.Context(), loggerKey{}, reqLogger)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// 从 context 取出 logger
func LoggerFromCtx(ctx context.Context) *slog.Logger {
    if l, ok := ctx.Value(loggerKey{}).(*slog.Logger); ok {
        return l
    }
    return slog.Default()
}
```

### WithGroup 属性分组

```go
// WithGroup 将后续属性放入命名组
func groupedAttributes() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    // 分组：将数据库相关属性放入 "db" 组
    dbLogger := logger.WithGroup("db")
    dbLogger.Info("query executed",
        "host", "postgres:5432",
        "table", "users",
        "duration_ms", 12,
    )
    // 输出：{"msg":"query executed","db":{"host":"postgres:5432","table":"users","duration_ms":12}}

    // 嵌套分组
    httpLogger := logger.WithGroup("http").WithGroup("request")
    httpLogger.Info("incoming", "method", "GET", "path", "/api/v1")
    // 输出：{"msg":"incoming","http":{"request":{"method":"GET","path":"/api/v1"}}}
}
```

### 自定义 Handler（多目标 + 动态 Level）

```go
// 多目标 Handler：同时输出到控制台（Text）和文件（JSON）
type MultiHandler struct {
    handlers []slog.Handler
}

func (h *MultiHandler) Enabled(ctx context.Context, level slog.Level) bool {
    for _, handler := range h.handlers {
        if handler.Enabled(ctx, level) {
            return true
        }
    }
    return false
}

func (h *MultiHandler) Handle(ctx context.Context, r slog.Record) error {
    var errs []error
    for _, handler := range h.handlers {
        if handler.Enabled(ctx, r.Level) {
            if err := handler.Handle(ctx, r.Clone()); err != nil {
                errs = append(errs, err)
            }
        }
    }
    return errors.Join(errs...)
}

func (h *MultiHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
    handlers := make([]slog.Handler, len(h.handlers))
    for i, handler := range h.handlers {
        handlers[i] = handler.WithAttrs(attrs)
    }
    return &MultiHandler{handlers: handlers}
}

func (h *MultiHandler) WithGroup(name string) slog.Handler {
    handlers := make([]slog.Handler, len(h.handlers))
    for i, handler := range h.handlers {
        handlers[i] = handler.WithGroup(name)
    }
    return &MultiHandler{handlers: handlers}
}

// 动态 Level 调整（无需重启）
type DynamicLevelHandler struct {
    level   atomic.Int64 // slog.Level 的底层类型是 int
    handler slog.Handler
}

func (h *DynamicLevelHandler) SetLevel(level slog.Level) {
    h.level.Store(int64(level))
}

func (h *DynamicLevelHandler) Enabled(_ context.Context, level slog.Level) bool {
    return level >= slog.Level(h.level.Load())
}
```

### 与 OpenTelemetry 集成

```go
// 将 slog 日志关联到 OTel trace span
type OTelHandler struct {
    base slog.Handler
}

func (h *OTelHandler) Handle(ctx context.Context, r slog.Record) error {
    span := trace.SpanFromContext(ctx)
    if span.IsRecording() {
        // 将日志事件附加到 span
        attrs := make([]attribute.KeyValue, 0, r.NumAttrs())
        r.Attrs(func(a slog.Attr) bool {
            attrs = append(attrs, attribute.String(a.Key, a.Value.String()))
            return true
        })
        span.AddEvent(r.Message, trace.WithAttributes(attrs...))
        // 注入 trace_id 到日志
        r.AddAttrs(slog.String("trace_id", span.SpanContext().TraceID().String()))
    }
    return h.base.Handle(ctx, r)
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| slog 为什么先调用 `Enabled` 再构建 Record？ | 避免在 Level 未达到阈值时做无用的参数求值和内存分配（零成本过滤）|
| `slog.Attr` 和直接传 key-value 对的性能差异？ | `slog.Int/String` 等类型化 Attr 避免反射；直接传 `"key", value` 需反射判断类型，稍慢但更简洁 |
| `WithAttrs` 为什么返回新 Handler？ | 不可变设计：Handler 可在多个 goroutine 间共享；`WithAttrs` 预格式化属性并缓存，避免每次 Handle 重复序列化 |
| slog 的 Level 为什么是 int 而不是枚举？ | 支持自定义扩展级别（如 `slog.Level(-8)` 作为 Trace）；int 可以比较大小做范围过滤 |
| TextHandler 和 JSONHandler 在 Buffer 上的优化？ | 两者都用 `sync.Pool` 复用 `[]byte` buffer，避免每条日志分配；Handler 内部持有 Mutex 保护写入 |
| 如何实现动态调整日志级别？ | 用 `atomic.Int64` 存储 Level 值，实现自定义 Handler 的 Enabled 方法；通过 HTTP 端点修改 atomic 值 |
