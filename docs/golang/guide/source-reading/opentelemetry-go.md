---
title: OpenTelemetry Go 源码精读
description: 精读 OpenTelemetry Go SDK 的实现，掌握 Trace/Span 创建、Propagation 传播、OTLP 导出、自动 HTTP/gRPC 插桩与生产级分布式追踪最佳实践。
---

# OpenTelemetry Go：源码精读

> 核心包：`go.opentelemetry.io/otel`、`go.opentelemetry.io/otel/trace`
>
> 图例参考：
> - `GoMicroserviceDiagram`：`otel-trace`

## 包结构图

```
OpenTelemetry Go 体系
══════════════════════════════════════════════════════════════════

  三大信号（Signals）：
  ├── Traces  ← 分布式追踪（请求链路）
  ├── Metrics ← 指标（计数/延迟/分布）
  └── Logs    ← 日志（结构化，与 trace 关联）

  Trace 核心概念：
  Trace（一次请求的完整链路）
  └── Span（链路中的单个操作）
       ├── TraceID    ← 128-bit，全局唯一
       ├── SpanID     ← 64-bit，当前 Span 唯一
       ├── ParentSpanID ← 父 Span（无 = 根 Span）
       ├── Attributes ← KV 标签（如 http.method, db.statement）
       ├── Events     ← 带时间戳的日志
       └── Status     ← OK / Error

  传播机制（跨服务）：
  W3C TraceContext: traceparent: 00-{traceID}-{spanID}-01
  HTTP 请求中自动注入/提取，gRPC 通过 metadata 传播

  导出器（Exporter）：
  ├── OTLP/gRPC   → Jaeger / Tempo / OTEL Collector（推荐）
  ├── OTLP/HTTP   → 同上，更易穿防火墙
  ├── Stdout      → 开发调试
  └── Zipkin      → 兼容旧系统

══════════════════════════════════════════════════════════════════
```

<GoMicroserviceDiagram kind="otel-trace" />

---

## 一、核心实现

```go
// otel/trace/span.go（简化）
type Span interface {
    End(options ...SpanEndOption)
    AddEvent(name string, options ...EventOption)
    SetAttributes(kv ...attribute.KeyValue)
    SetStatus(code codes.Code, description string)
    RecordError(err error, options ...EventOption)
    SpanContext() SpanContext // 包含 TraceID/SpanID
    IsRecording() bool       // 是否采样（false 时操作为空操作）
}

// 上下文传播：Span 通过 context 在调用链中传递
// otel.Tracer("name").Start(ctx, "operation") → 从 ctx 提取父 Span
```

---

## 二、代码示例

### 初始化 TracerProvider（程序入口）

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

func initTracer(ctx context.Context) (func(), error) {
    // OTLP/gRPC 导出器（发送到 Jaeger / Grafana Tempo）
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, fmt.Errorf("create exporter: %w", err)
    }

    // 服务资源信息（出现在 Jaeger 服务列表中）
    res, _ := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName("user-service"),
            semconv.ServiceVersion("1.0.0"),
            semconv.DeploymentEnvironment("production"),
        ),
    )

    // TracerProvider 配置
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter), // 批量发送，减少网络调用
        sdktrace.WithResource(res),
        // 采样策略：生产中通常 10%~100%
        sdktrace.WithSampler(sdktrace.TraceIDRatioBased(0.1)),
        // 开发：100% 采样
        // sdktrace.WithSampler(sdktrace.AlwaysSample()),
    )

    // 设置全局 TracerProvider
    otel.SetTracerProvider(tp)

    // 设置 W3C TraceContext 传播器
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))

    // 返回 shutdown 函数
    return func() {
        // 关闭 TracerProvider 属于进程级收尾，不应复用可能已取消的请求 ctx。
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        tp.Shutdown(ctx)
    }, nil
}
```

### 手动创建 Span

```go
// 获取 tracer（通常在包级别定义）
var tracer = otel.Tracer("github.com/example/app/user")

// 业务函数：手动创建 Span
func (s *UserService) GetUser(ctx context.Context, userID int64) (*User, error) {
    // 创建子 Span（自动关联父 Span）
    ctx, span := tracer.Start(ctx, "UserService.GetUser",
        trace.WithAttributes(
            attribute.Int64("user.id", userID),
        ),
        trace.WithSpanKind(trace.SpanKindInternal),
    )
    defer span.End() // 必须 End，否则 Span 不会发送

    // 缓存查询
    ctx, cacheSpan := tracer.Start(ctx, "cache.get")
    user, err := s.cache.Get(ctx, userID)
    cacheSpan.SetAttributes(attribute.Bool("cache.hit", err == nil))
    cacheSpan.End()

    if err == nil {
        return user, nil
    }

    // 数据库查询
    ctx, dbSpan := tracer.Start(ctx, "db.query",
        trace.WithAttributes(
            semconv.DBSystemPostgreSQL,
            semconv.DBStatement("SELECT * FROM users WHERE id = $1"),
        ),
        trace.WithSpanKind(trace.SpanKindClient),
    )
    user, err = s.repo.GetByID(ctx, userID)
    if err != nil {
        // 记录错误到 Span（会在 Jaeger 中标红）
        dbSpan.RecordError(err)
        dbSpan.SetStatus(codes.Error, err.Error())
        dbSpan.End()
        span.RecordError(err)
        span.SetStatus(codes.Error, "db query failed")
        return nil, err
    }
    dbSpan.End()

    // 添加事件（带时间戳的日志）
    span.AddEvent("user_fetched_from_db",
        trace.WithAttributes(attribute.String("user.name", user.Name)))

    return user, nil
}
```

### HTTP 服务器自动插桩

```go
import (
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// otelhttp.NewHandler 自动：
// 1. 从请求 Header 提取 TraceContext（传播）
// 2. 创建服务端 Span
// 3. 记录 http.method, http.url, http.status_code 等属性
// 4. 处理结束后自动 End Span

func main() {
    shutdown, _ := initTracer(context.Background())
    defer shutdown()

    mux := http.NewServeMux()
    mux.HandleFunc("/api/users/{id}", handleGetUser)

    // 用 otelhttp 包装 Handler（自动插桩）
    handler := otelhttp.NewHandler(mux, "http.server",
        otelhttp.WithMessageEvents(otelhttp.ReadEvents, otelhttp.WriteEvents),
    )

    http.ListenAndServe(":8080", handler)
}

func handleGetUser(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context() // 已包含从请求传播的 Span 上下文

    // 直接使用 ctx 创建子 Span（自动关联 HTTP Span）
    ctx, span := tracer.Start(ctx, "handleGetUser")
    defer span.End()

    // 后续操作使用传递的 ctx
    user, err := userSvc.GetUser(ctx, extractID(r))
    if err != nil {
        span.RecordError(err)
        http.Error(w, err.Error(), 500)
        return
    }
    json.NewEncoder(w).Encode(user)
}
```

这里 `r.Context()` 的语义要特别清楚：

- 它既承载了请求取消信号，也承载了当前 Trace / Span 上下文
- 只要逻辑仍属于当前请求，就应该继续把这个 `ctx` 往下传
- 一旦 Handler 返回，请求 Span 也应该随请求一起结束

### 请求结束后的异步任务：不要继续把后台 Span 挂在请求 Span 下面

```go
func handleCreateAudit(w http.ResponseWriter, r *http.Request) {
    // 在请求阶段先提取需要保留的链路关联信息
    link := trace.LinkFromContext(r.Context())
    base := context.WithoutCancel(r.Context()) // Go 1.21+，保留 baggage / 值链

    go func(base context.Context, link trace.Link) {
        ctx, cancel := context.WithTimeout(base, 5*time.Second)
        defer cancel()

        // 后台任务不再作为请求 Span 的普通子 Span，而是新起根 Span，再链接回原请求。
        ctx, span := tracer.Start(ctx, "AuditLog.Send",
            trace.WithNewRoot(),
            trace.WithLinks(link),
        )
        defer span.End()

        if err := auditSvc.Send(ctx); err != nil {
            span.RecordError(err)
        }
    }(base, link)

    w.WriteHeader(http.StatusAccepted)
}
```

这段代码的边界是：

- 请求 Span 应该随请求结束，不要让后台任务继续占着它
- 如果后台任务需要保留观测关联性，更稳妥的是**新建根 Span + link 回原请求**
- `WithoutCancel` 只负责切断父级取消，不负责给后台任务兜底；后台任务仍要设置自己的超时

### gRPC 自动插桩

```go
import (
    "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
)

// 服务端：添加 gRPC 拦截器（自动插桩所有 RPC）
srv := grpc.NewServer(
    grpc.StatsHandler(otelgrpc.NewServerHandler()),
)

// 客户端：添加拦截器（自动传播 TraceContext）
conn, _ := grpc.NewClient(target,
    grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
)

// otelgrpc 自动记录：
// rpc.system = "grpc"
// rpc.method = "GetUser"
// rpc.grpc.status_code = "OK"
// net.peer.addr = "127.0.0.1:50051"
```

### 关联日志与 Trace

```go
import "go.opentelemetry.io/otel/trace"

// 在日志中注入 TraceID（方便从日志跳转到 Jaeger）
func logWithTrace(ctx context.Context, msg string, args ...any) {
    span := trace.SpanFromContext(ctx)
    sc := span.SpanContext()

    if sc.IsValid() {
        // 注入到 slog（结构化日志）
        slog.InfoContext(ctx, msg,
            append(args,
                "trace_id", sc.TraceID().String(),
                "span_id", sc.SpanID().String(),
            )...,
        )
    } else {
        slog.InfoContext(ctx, msg, args...)
    }
}

// Grafana Loki + Tempo 集成：日志和链路互相跳转
// 日志中有 trace_id → 点击跳转 Tempo 查看链路
// Tempo 中点击 Span → 跳转 Loki 查看对应时间段日志
```

### 采样策略

```go
// 生产采样策略：根据流量动态调整
type adaptiveSampler struct {
    base sdktrace.Sampler
}

func newAdaptiveSampler(qps int) sdktrace.Sampler {
    var ratio float64
    switch {
    case qps < 100:
        ratio = 1.0 // 低流量全采样
    case qps < 1000:
        ratio = 0.1 // 中等流量 10%
    default:
        ratio = 0.01 // 高流量 1%
    }
    return sdktrace.TraceIDRatioBased(ratio)
}

// ParentBased 采样：遵从上游采样决策
// 若上游采样了，子服务也采样；上游未采样则子服务也不采
sampler := sdktrace.ParentBased(
    sdktrace.TraceIDRatioBased(0.1), // 根 Span 10% 采样
)
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| OpenTelemetry 和 Jaeger/Zipkin 的关系？ | OTel 是采集/传播标准（SDK + API）；Jaeger/Tempo/Zipkin 是后端存储和 UI；OTel SDK 通过 OTLP 导出器把数据发给后端 |
| `span.End()` 为什么必须 defer？ | `End()` 触发 Span 发送到导出器；忘记调用则 Span 永远不会出现在 Jaeger 中；defer 确保函数返回（包括 error 路径）时都会结束 Span |
| TraceContext 如何跨服务传播？ | HTTP：`otelhttp` 自动在 Header 注入 `traceparent: 00-{traceID}-{spanID}-01`；gRPC：通过 metadata；服务端从请求中提取并恢复 Span 上下文 |
| `IsRecording()` 的用途？ | 检查当前 Span 是否被采样；未采样时 Span 是 no-op（空操作，零开销）；用于避免计算昂贵的 Attribute 值（如 `span.IsRecording() && span.SetAttributes(...)`) |
| ParentBased 采样的意义？ | 分布式系统中采样决策必须一致：要么整条链路都采，要么都不采；`ParentBased` 让子服务遵从父服务的采样决策，避免链路断裂 |
| 如何在日志和 Trace 之间关联？ | 从 `trace.SpanFromContext(ctx).SpanContext()` 获取 `TraceID` 和 `SpanID`，注入到日志字段；Grafana Loki + Tempo 原生支持从日志跳转到链路 |
