---
title: log/slog 源码精读
description: 精读 Go 1.21+ 结构化日志 log/slog 的 Handler 接口设计、Attr/Record 数据流与性能优化实现。
---

# log/slog：结构化日志源码精读

> 核心源码：`src/log/slog/`（Go 1.21+）

## 包结构图

```
log/slog 架构分层
══════════════════════════════════════════════════════════════════

  用户 API 层
  ├── slog.Info / Warn / Error / Debug  ← 顶层函数（用默认 Logger）
  ├── slog.With(attrs...)               ← 创建带固定字段的子 Logger
  └── slog.Logger                       ← 核心类型（持有 Handler）

  核心数据层
  ├── slog.Record    ← 一条日志记录（时间/级别/消息/Attrs）
  ├── slog.Attr      ← 键值对（Key string + Value）
  ├── slog.Value     ← 无分配标量联合体（7 种 Kind）
  └── slog.Level     ← 日志级别（int，可自定义）

  Handler 接口层
  ├── slog.Handler   ← 接口（Enabled/Handle/WithAttrs/WithGroup）
  ├── TextHandler    ← 人类可读文本格式
  ├── JSONHandler    ← JSON Lines 格式
  └── 自定义 Handler ← 对接 zap/logrus/OpenTelemetry 等

══════════════════════════════════════════════════════════════════
```

---

## 一、核心数据结构

### slog.Value：零分配标量

```go
// src/log/slog/value.go
type Value struct {
    _ [0]func() // 禁止比较
    // num 存数字/布尔/时间纳秒；any 存字符串指针/复杂类型
    num uint64
    any any
}

// Kind 枚举（7 种）
const (
    KindAny       Kind = iota
    KindBool
    KindDuration
    KindFloat64
    KindInt64
    KindString
    KindTime
    KindUint64
    KindGroup
    KindLogValuer
)
```

```
Value 内存布局（16 字节，无堆分配）
══════════════════════════════════════════════════════════════════

  对于 int64/uint64/bool/Duration：
  ┌─────────────────┬─────────────────────────────────────────┐
  │  num (uint64)   │  any = (*[0]byte)(nil) + kind 编码      │
  └─────────────────┴─────────────────────────────────────────┘

  对于 string：
  ┌─────────────────┬─────────────────────────────────────────┐
  │ num=len(s)      │  any = unsafe.StringData(s) 指针         │
  └─────────────────┴─────────────────────────────────────────┘

  设计目标：Int64Value/StringValue 等常见类型不触发堆分配

══════════════════════════════════════════════════════════════════
```

### slog.Record

```go
// src/log/slog/record.go
type Record struct {
    Time    time.Time   // 日志时间
    Message string      // 消息文本
    Level   Level       // 日志级别
    PC      uintptr     // 调用者 PC（用于 source location）

    // front 存前 3 个 Attr（栈上分配，无堆分配）
    nFront  int
    front   [nAttrsInline]Attr

    // back 存更多 Attr（超出 3 个才堆分配）
    back []Attr
}

const nAttrsInline = 5  // 实际值，栈上预留空间
```

---

## 二、Handler 接口

```go
// src/log/slog/handler.go
type Handler interface {
    // Enabled 报告该级别是否需要处理（关闭时跳过 Record 构建）
    Enabled(ctx context.Context, level Level) bool

    // Handle 实际处理一条日志 Record
    Handle(ctx context.Context, r Record) error

    // WithAttrs 返回添加了固定 attrs 的新 Handler（不可变）
    WithAttrs(attrs []Attr) Handler

    // WithGroup 返回后续 Attr 都归入 group 的新 Handler
    WithGroup(name string) Handler
}
```

```
Handler 的不可变链式设计
══════════════════════════════════════════════════════════════════

  baseHandler
       │
       ├── WithAttrs(userID=42) → handler1（持有 baseHandler + [userID=42]）
       │         │
       │         └── WithGroup("request") → handler2（持有 handler1 + group）
       │                   │
       │                   └── WithAttrs(path="/api") → handler3
       │
  Logger.With / Logger.WithGroup 均创建新 Logger，原有不变
  → 适合 per-request logger：每次请求 With(requestID) 创建子 logger

══════════════════════════════════════════════════════════════════
```

---

## 三、日志调用链路

```
slog.Info("msg", "key", val) 完整调用链
══════════════════════════════════════════════════════════════════

  slog.Info(msg, args...)
       │
       ▼
  defaultLogger.log(ctx, LevelInfo, msg, args...)
       │
       ├─ handler.Enabled(ctx, level)?  否 → 直接返回（零开销）
       │
       ├─ newRecord(time.Now(), level, msg, pc)
       │       → 获取调用者 PC（runtime.Callers，1次）
       │
       ├─ r.Add(args...)
       │       → 解析 key-value 对或 Attr
       │       → 前 5 个 Attr 存 front[]（栈）
       │       → 超出部分追加 back slice（堆）
       │
       └─ handler.Handle(ctx, r)
               → TextHandler：格式化为 "time=... level=... msg=... key=val"
               → JSONHandler：格式化为 {"time":...,"level":...,"msg":...}

══════════════════════════════════════════════════════════════════
```

---

## 四、级别系统

```go
// src/log/slog/level.go
type Level int

const (
    LevelDebug Level = -4  // 预留负值区间给更细粒度级别
    LevelInfo  Level = 0
    LevelWarn  Level = 4
    LevelError Level = 8
)

// 自定义级别（在 Info 和 Warn 之间）
const LevelNotice Level = 2

// 动态调整日志级别（无需重启）
var programLevel = new(slog.LevelVar) // 默认 Info
programLevel.Set(slog.LevelDebug)

h := slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
    Level: programLevel, // 实现 Leveler 接口，动态读取
})
```

---

## 五、代码示例

### 基础使用

```go
import "log/slog"

func main() {
    // 默认 TextHandler 输出到 stderr
    slog.Info("server started", "port", 8080, "env", "prod")
    // time=2024-01-01T00:00:00Z level=INFO msg="server started" port=8080 env=prod

    // JSON 格式
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
    logger.Info("user login", "userID", 42, "ip", "127.0.0.1")
    // {"time":"...","level":"INFO","msg":"user login","userID":42,"ip":"127.0.0.1"}
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

### WithAttrs 预绑定属性（per-request Logger）

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

### 结构化错误日志

```go
func processOrder(ctx context.Context, orderID int64) error {
    log := slog.With("orderID", orderID)

    item, err := fetchItem(ctx, orderID)
    if err != nil {
        // slog.Any 可以包装任意类型，包括 error
        log.ErrorContext(ctx, "fetch item failed",
            slog.Any("error", err),
            slog.String("component", "fetchItem"),
        )
        return fmt.Errorf("fetchItem: %w", err)
    }

    log.InfoContext(ctx, "item fetched",
        slog.Int64("itemID", item.ID),
        slog.Float64("price", item.Price),
    )
    return nil
}
```

### 性能敏感路径：使用 LogAttrs

```go
// Info(msg, args...) 会在内部做 key-value 配对，有轻微反射
// LogAttrs 直接传 Attr，更快
logger.LogAttrs(ctx, slog.LevelInfo, "cache hit",
    slog.String("key", key),
    slog.Int("ttl", ttl),
    slog.Int64("size", size),
)

// 或者先检查是否 Enabled，在关闭 debug 时完全跳过参数计算
if logger.Enabled(ctx, slog.LevelDebug) {
    logger.Debug("expensive debug", "data", computeExpensiveData())
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| slog 和 log 包的区别？ | log 是非结构化文本；slog 结构化（key=value/JSON），支持级别、Handler 可扩展 |
| slog.Value 如何避免堆分配？ | 用 num+any 两字段的联合体编码 7 种标量类型，不触发 interface boxing |
| Record 前 5 个 Attr 为什么在栈上？ | front [5]Attr 是 Record 的内联字段，超出才用 back slice |
| With 为什么每次返回新 Logger？ | Handler 不可变设计，并发安全；不同 goroutine 可持有不同字段集 |
| 如何做到动态调整日志级别？ | slog.LevelVar 实现 Leveler 接口，Enabled() 每次调用时读取原子值 |
| 为什么用 LogAttrs 而不是 Info？ | LogAttrs 接受 []Attr，无需 key-value 配对解析，零额外分配 |
| slog 为什么先调用 `Enabled` 再构建 Record？ | 避免在 Level 未达到阈值时做无用的参数求值和内存分配（零成本过滤）|
| `slog.Attr` 和直接传 key-value 对的性能差异？ | `slog.Int/String` 等类型化 Attr 避免反射；直接传 `"key", value` 需反射判断类型，稍慢但更简洁 |
| TextHandler 和 JSONHandler 在 Buffer 上的优化？ | 两者都用 `sync.Pool` 复用 `[]byte` buffer，避免每条日志分配；Handler 内部持有 Mutex 保护写入 |
| 如何实现动态调整日志级别？ | 用 `atomic.Int64` 存储 Level 值，实现自定义 Handler 的 Enabled 方法；通过 HTTP 端点修改 atomic 值 |
