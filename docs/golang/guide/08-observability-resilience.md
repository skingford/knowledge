---
title: 追踪、容错与重试
description: Go 微服务可观测性与稳定性专题，涵盖链路追踪、熔断限流、幂等和重试策略。
search: false
---

# 微服务与分布式：追踪、容错与重试

[返回总览](./08-microservices-distributed)

## 快速导航

- [5. 链路追踪](#_5-链路追踪)
- [6. 熔断、限流、降级](#_6-熔断限流降级)
- [7. 幂等设计](#_7-幂等设计)
- [8. 重试策略](#_8-重试策略)

## 5. 链路追踪

链路追踪帮助在分布式系统中追踪一个请求经过的所有服务，是可观测性的关键组成部分。

### 5.1 OpenTelemetry 基础设置

::: details 点击展开代码：5.1 OpenTelemetry 基础设置
```go
package tracing

import (
    "context"
    "log"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

// InitTracer 初始化 OpenTelemetry Tracer
func InitTracer(ctx context.Context, serviceName string) (func(), error) {
    // 创建 OTLP exporter（发送到 Jaeger/Tempo 等后端）
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // 设置资源信息
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceNameKey.String(serviceName),
            semconv.ServiceVersionKey.String("1.0.0"),
            attribute.String("environment", "production"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // 创建 TracerProvider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.TraceIDRatioBased(0.1)), // 采样 10%
    )

    otel.SetTracerProvider(tp)

    // 设置上下文传播器（W3C TraceContext）
    otel.SetTextMapPropagator(
        propagation.NewCompositeTextMapPropagator(
            propagation.TraceContext{},
            propagation.Baggage{},
        ),
    )

    // 返回清理函数
    cleanup := func() {
        // TracerProvider 关闭属于进程级收尾，不能复用可能已经超时或取消的业务 ctx。
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        if err := tp.Shutdown(shutdownCtx); err != nil {
            log.Printf("shutdown tracer: %v", err)
        }
    }

    return cleanup, nil
}
```
:::

### 5.2 创建 Span 与上下文传播

::: details 点击展开代码：5.2 创建 Span 与上下文传播
```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

var tracer = otel.Tracer("order-service")

// handleCreateOrder HTTP 处理函数中使用追踪
func handleCreateOrder(w http.ResponseWriter, r *http.Request) {
    // 从请求头提取 trace context
    ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

    // 创建 span
    ctx, span := tracer.Start(ctx, "CreateOrder",
        trace.WithAttributes(
            attribute.String("http.method", r.Method),
            attribute.String("http.url", r.URL.String()),
        ),
    )
    defer span.End()

    // 业务逻辑
    orderID, err := processOrder(ctx)
    if err != nil {
        span.SetStatus(codes.Error, err.Error())
        span.RecordError(err)
        http.Error(w, err.Error(), 500)
        return
    }

    span.SetAttributes(attribute.String("order.id", orderID))
    fmt.Fprintf(w, "Order created: %s", orderID)
}

func processOrder(ctx context.Context) (string, error) {
    // 子 span：校验库存
    ctx, span := tracer.Start(ctx, "CheckInventory")
    time.Sleep(50 * time.Millisecond) // 模拟调用
    span.SetAttributes(attribute.Bool("inventory.available", true))
    span.End()

    // 子 span：扣减库存
    ctx, span = tracer.Start(ctx, "DeductInventory")
    time.Sleep(30 * time.Millisecond)
    span.End()

    // 子 span：创建支付单
    _, span = tracer.Start(ctx, "CreatePayment")
    time.Sleep(80 * time.Millisecond)
    span.End()

    return "ORD-20240101-001", nil
}
```
:::

如果你的 HTTP 服务已经用 `otelhttp.NewHandler(...)` 做了自动插桩，那 `r.Context()` 里通常已经带着提取后的 Span 上下文，就不需要在 Handler 里再次手动 `Extract(...)`。

### 5.2.1 请求内传播 vs 离线异步任务

::: details 点击展开代码：5.2.1 请求内传播 vs 离线异步任务
```go
func handleAsyncNotify(w http.ResponseWriter, r *http.Request) {
    // 先保存链路关联信息
    link := trace.LinkFromContext(r.Context())
    base := context.WithoutCancel(r.Context()) // Go 1.21+

    go func(base context.Context, link trace.Link) {
        ctx, cancel := context.WithTimeout(base, 3*time.Second)
        defer cancel()

        // 新起根 Span，并用 Link 关联回原请求。
        ctx, span := tracer.Start(ctx, "AsyncNotify",
            trace.WithNewRoot(),
            trace.WithLinks(link),
        )
        defer span.End()

        if err := sendNotification(ctx); err != nil {
            span.RecordError(err)
            span.SetStatus(codes.Error, err.Error())
        }
    }(base, link)

    w.WriteHeader(http.StatusAccepted)
}
```
:::

这个模式适合：

- 请求已经结束，但异步通知、审计日志、补偿任务还要继续执行
- 希望保留与原请求的可观测性关联

不建议的做法是：在 Handler 返回后继续把后台任务作为原请求 Span 的普通子 Span 挂着跑。

### 5.3 gRPC 拦截器集成追踪

::: details 点击展开代码：5.3 gRPC 拦截器集成追踪
```go
import (
    "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
    "google.golang.org/grpc"
)

// 服务端自动追踪
func newTracedGRPCServer() *grpc.Server {
    return grpc.NewServer(
        grpc.StatsHandler(otelgrpc.NewServerHandler()),
    )
}

// 客户端自动追踪
func newTracedGRPCConn(addr string) (*grpc.ClientConn, error) {
    return grpc.Dial(addr,
        grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
}
```
:::

<GoMicroserviceDiagram kind="otel-trace" />

### 讲解重点

- **Context 传播是核心**：Trace 信息通过 `context.Context` 在进程内传递，通过 HTTP Header / gRPC Metadata 跨进程传递。丢失 context 就断链。
- **采样策略**：生产环境不能 100% 采样（性能开销大），常用 `TraceIDRatioBased` 按比例采样或 `ParentBased` 跟随上游决策。
- **Span 命名规范**：Span name 应体现操作语义（如 `CreateOrder`、`QueryDB`），不要包含动态参数（如订单号），动态数据放 attributes。
- **请求边界要和 Trace 边界一起看**：请求内操作继续透传 `r.Context()`；离线任务要重建自己的生命周期，必要时用新的根 Span + Link 关联回原请求。

---

## 6. 熔断、限流、降级

这三种机制是微服务容错的核心手段，防止局部故障扩散到整个系统。

### 6.1 熔断器（Circuit Breaker）

::: details 点击展开代码：6.1 熔断器（Circuit Breaker）
```go
package circuitbreaker

import (
    "errors"
    "sync"
    "time"
)

type State int

const (
    StateClosed   State = iota // 正常，请求正常通过
    StateOpen                  // 熔断，请求直接拒绝
    StateHalfOpen              // 半开，允许少量试探请求
)

var ErrCircuitOpen = errors.New("circuit breaker is open")

type CircuitBreaker struct {
    mu sync.Mutex

    state           State
    failureCount    int
    successCount    int
    failureThreshold int
    successThreshold int     // 半开状态需要连续成功几次才恢复
    timeout          time.Duration // 熔断持续时间
    lastFailureTime  time.Time
}

func NewCircuitBreaker(failureThreshold, successThreshold int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:            StateClosed,
        failureThreshold: failureThreshold,
        successThreshold: successThreshold,
        timeout:          timeout,
    }
}

// Execute 通过熔断器执行函数
func (cb *CircuitBreaker) Execute(fn func() error) error {
    cb.mu.Lock()

    switch cb.state {
    case StateOpen:
        // 判断是否超过冷却时间，进入半开
        if time.Since(cb.lastFailureTime) > cb.timeout {
            cb.state = StateHalfOpen
            cb.successCount = 0
            cb.mu.Unlock()
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }

    case StateClosed, StateHalfOpen:
        cb.mu.Unlock()
    }

    // 执行业务函数
    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failureCount++
        cb.lastFailureTime = time.Now()

        if cb.failureCount >= cb.failureThreshold {
            cb.state = StateOpen
        }
        return err
    }

    // 成功
    if cb.state == StateHalfOpen {
        cb.successCount++
        if cb.successCount >= cb.successThreshold {
            cb.state = StateClosed
            cb.failureCount = 0
        }
    } else {
        cb.failureCount = 0 // 重置失败计数
    }

    return nil
}

func (cb *CircuitBreaker) State() State {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    return cb.state
}
```
:::

<GoMicroserviceDiagram kind="circuit-breaker" />

### 6.2 限流器（Rate Limiter）

::: details 点击展开代码：6.2 限流器（Rate Limiter）
```go
package ratelimit

import (
    "net/http"
    "sync"
    "time"

    "golang.org/x/time/rate"
)

// 单机限流：基于令牌桶
func NewRateLimitMiddleware(rps int, burst int) func(http.Handler) http.Handler {
    limiter := rate.NewLimiter(rate.Limit(rps), burst)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// 按用户/IP 限流
type PerClientLimiter struct {
    mu       sync.Mutex
    limiters map[string]*rate.Limiter
    rps      rate.Limit
    burst    int
}

func NewPerClientLimiter(rps int, burst int) *PerClientLimiter {
    pcl := &PerClientLimiter{
        limiters: make(map[string]*rate.Limiter),
        rps:      rate.Limit(rps),
        burst:    burst,
    }

    // 定期清理不活跃的 limiter，防止内存泄漏
    go func() {
        for range time.Tick(10 * time.Minute) {
            pcl.mu.Lock()
            pcl.limiters = make(map[string]*rate.Limiter)
            pcl.mu.Unlock()
        }
    }()

    return pcl
}

func (pcl *PerClientLimiter) GetLimiter(clientID string) *rate.Limiter {
    pcl.mu.Lock()
    defer pcl.mu.Unlock()

    if l, ok := pcl.limiters[clientID]; ok {
        return l
    }
    l := rate.NewLimiter(pcl.rps, pcl.burst)
    pcl.limiters[clientID] = l
    return l
}

func (pcl *PerClientLimiter) Allow(clientID string) bool {
    return pcl.GetLimiter(clientID).Allow()
}
```
:::

<GoMicroserviceDiagram kind="rate-limiter" />

### 6.3 降级策略

::: details 点击展开代码：6.3 降级策略
```go
package degradation

import (
    "context"
    "log"
    "time"
)

// 降级：当依赖不可用时，返回兜底数据
type ProductService struct {
    cb *circuitbreaker.CircuitBreaker
}

func (s *ProductService) GetRecommendations(ctx context.Context, userID string) ([]Product, error) {
    var result []Product

    err := s.cb.Execute(func() error {
        // 尝试调用推荐服务
        var err error
        result, err = s.callRecommendationService(ctx, userID)
        return err
    })

    if err != nil {
        log.Printf("recommendation service degraded: %v", err)
        // 降级：返回热门商品兜底
        return s.getHotProducts(ctx)
    }

    return result, nil
}

func (s *ProductService) getHotProducts(ctx context.Context) ([]Product, error) {
    // 从缓存读取热门商品，这是预先准备好的兜底数据
    return []Product{
        {ID: "1", Name: "热门商品A", Price: 99.0},
        {ID: "2", Name: "热门商品B", Price: 199.0},
    }, nil
}

type Product struct {
    ID    string
    Name  string
    Price float64
}
```
:::

<GoMicroserviceDiagram kind="degradation-fallback" />

### 讲解重点

- **三态转换**：熔断器的 Closed -> Open -> HalfOpen -> Closed 状态机是核心。Open 状态直接 fail-fast，避免资源浪费；HalfOpen 通过试探请求判断下游是否恢复。
- **限流算法选择**：令牌桶（Token Bucket）允许突发流量，适合大多数场景；漏桶（Leaky Bucket）严格匀速，适合保护下游。`golang.org/x/time/rate` 实现的是令牌桶。
- **降级要提前准备**：降级数据（兜底数据、缓存快照）要在系统正常时预热好，不能等到出问题再临时准备。

---

## 7. 幂等设计

幂等性保证同一操作执行一次和执行多次的效果相同，在网络不可靠的分布式环境中至关重要。

### 7.1 基于幂等 Key 的方案

::: details 点击展开代码：7.1 基于幂等 Key 的方案
```go
package idempotent

import (
    "context"
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "errors"
    "fmt"
    "time"
)

var (
    ErrDuplicateRequest = errors.New("duplicate request")
    ErrIdempotencyKeyRequired = errors.New("idempotency key is required")
)

// IdempotencyStore 幂等性存储
type IdempotencyStore struct {
    db *sql.DB
}

// IdempotencyRecord 幂等记录
type IdempotencyRecord struct {
    Key        string
    Status     string // pending, success, failed
    Response   []byte
    CreatedAt  time.Time
    ExpiresAt  time.Time
}

func NewIdempotencyStore(db *sql.DB) *IdempotencyStore {
    return &IdempotencyStore{db: db}
}

/*
 建表 SQL:
 CREATE TABLE idempotency_keys (
     key VARCHAR(64) PRIMARY KEY,
     status VARCHAR(16) NOT NULL DEFAULT 'pending',
     response BLOB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     expires_at TIMESTAMP NOT NULL,
     INDEX idx_expires (expires_at)
 );
*/

// Execute 幂等执行
func (s *IdempotencyStore) Execute(
    ctx context.Context,
    idempotencyKey string,
    ttl time.Duration,
    fn func(ctx context.Context) ([]byte, error),
) ([]byte, error) {
    if idempotencyKey == "" {
        return nil, ErrIdempotencyKeyRequired
    }

    // 1. 尝试插入幂等记录（利用主键唯一约束）
    expiresAt := time.Now().Add(ttl)
    _, err := s.db.ExecContext(ctx,
        `INSERT INTO idempotency_keys (key_id, status, expires_at)
         VALUES (?, 'pending', ?)
         ON DUPLICATE KEY UPDATE key_id=key_id`, // MySQL
        idempotencyKey, expiresAt,
    )

    if err != nil {
        return nil, fmt.Errorf("insert idempotency key: %w", err)
    }

    // 2. 查询已有记录
    var record IdempotencyRecord
    err = s.db.QueryRowContext(ctx,
        `SELECT key_id, status, response FROM idempotency_keys WHERE key_id = ?`,
        idempotencyKey,
    ).Scan(&record.Key, &record.Status, &record.Response)

    if err != nil {
        return nil, fmt.Errorf("query idempotency key: %w", err)
    }

    // 3. 如果已成功，直接返回缓存的响应
    if record.Status == "success" {
        return record.Response, nil
    }

    // 4. 执行实际业务逻辑
    response, err := fn(ctx)
    if err != nil {
        // 标记失败，允许重试
        s.db.ExecContext(ctx,
            `UPDATE idempotency_keys SET status = 'failed' WHERE key_id = ?`,
            idempotencyKey,
        )
        return nil, err
    }

    // 5. 标记成功，缓存响应
    s.db.ExecContext(ctx,
        `UPDATE idempotency_keys SET status = 'success', response = ? WHERE key_id = ?`,
        response, idempotencyKey,
    )

    return response, nil
}
```
:::

### 7.2 基于 Token 的防重提交

::: details 点击展开代码：7.2 基于 Token 的防重提交
```go
package idempotent

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

type TokenDedup struct {
    rdb *redis.Client
}

func NewTokenDedup(rdb *redis.Client) *TokenDedup {
    return &TokenDedup{rdb: rdb}
}

// GenerateToken 生成唯一 Token（表单渲染时下发给前端）
func (t *TokenDedup) GenerateToken(ctx context.Context) (string, error) {
    b := make([]byte, 16)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    token := hex.EncodeToString(b)

    // 存入 Redis，设置过期时间
    key := fmt.Sprintf("dedup:token:%s", token)
    err := t.rdb.Set(ctx, key, "1", 10*time.Minute).Err()
    if err != nil {
        return "", err
    }

    return token, nil
}

// ConsumeToken 消费 Token（提交时验证并删除）
// 利用 Redis 的原子性，确保只有一个请求能消费成功
func (t *TokenDedup) ConsumeToken(ctx context.Context, token string) (bool, error) {
    key := fmt.Sprintf("dedup:token:%s", token)

    // DEL 返回删除的 key 数量，>0 表示首次消费
    result, err := t.rdb.Del(ctx, key).Result()
    if err != nil {
        return false, err
    }

    return result > 0, nil
}
```
:::

### 7.3 数据库唯一约束方案

::: details 点击展开代码：7.3 数据库唯一约束方案
```go
// 利用数据库唯一索引实现自然幂等
// 场景：创建订单时，使用 业务流水号 作为唯一约束

func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderRequest) error {
    // 生成幂等性业务键：用户ID + 商品ID + 日期（防止同一天重复下单）
    bizKey := fmt.Sprintf("%s:%s:%s",
        req.UserID, req.ProductID, time.Now().Format("2006-01-02"))
    hash := sha256.Sum256([]byte(bizKey))
    orderNo := hex.EncodeToString(hash[:16])

    _, err := s.db.ExecContext(ctx,
        `INSERT INTO orders (order_no, user_id, product_id, amount)
         VALUES (?, ?, ?, ?)`,
        orderNo, req.UserID, req.ProductID, req.Amount,
    )

    if err != nil {
        // 唯一约束冲突 -> 重复请求，视为成功
        if isDuplicateKeyError(err) {
            return nil // 幂等返回
        }
        return err
    }
    return nil
}
```
:::

<GoMicroserviceDiagram kind="idempotency-key" />

### 讲解重点

- **幂等 Key 设计**：Key 应由客户端生成并在请求头传递（如 `X-Idempotency-Key`）。Key 要有过期时间，过期后允许重新执行。
- **数据库唯一约束是最简单的幂等方案**：对于 INSERT 操作，利用唯一索引天然防重复，无需额外组件。核心是设计好业务唯一键。
- **Token 方案适合表单提交**：服务端下发 Token，提交时原子消费（Redis DEL），保证"一个 Token 只能用一次"。

---

## 8. 重试策略

合理的重试策略能提高分布式系统的容错能力，但不当的重试会加剧故障（重试风暴）。

### 8.1 指数退避重试

::: details 点击展开代码：8.1 指数退避重试
```go
package retry

import (
    "context"
    "errors"
    "fmt"
    "math"
    "math/rand"
    "time"

    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type Config struct {
    MaxRetries  int
    BaseDelay   time.Duration
    MaxDelay    time.Duration
    Multiplier  float64
    JitterRatio float64 // 0~1，抖动比例
}

var DefaultConfig = Config{
    MaxRetries:  3,
    BaseDelay:   100 * time.Millisecond,
    MaxDelay:    10 * time.Second,
    Multiplier:  2.0,
    JitterRatio: 0.3,
}

// RetryableFunc 可重试的函数
type RetryableFunc func(ctx context.Context) error

// Do 执行带重试的函数
func Do(ctx context.Context, cfg Config, fn RetryableFunc) error {
    var lastErr error

    for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
        lastErr = fn(ctx)
        if lastErr == nil {
            return nil // 成功
        }

        // 判断是否可重试
        if !IsRetryable(lastErr) {
            return lastErr // 不可重试的错误，直接返回
        }

        // 最后一次重试失败，不再等待
        if attempt == cfg.MaxRetries {
            break
        }

        // 计算退避时间
        delay := calcDelay(cfg, attempt)

        select {
        case <-ctx.Done():
            return fmt.Errorf("retry cancelled: %w", ctx.Err())
        case <-time.After(delay):
            // 继续重试
        }
    }

    return fmt.Errorf("max retries (%d) exceeded: %w", cfg.MaxRetries, lastErr)
}

// calcDelay 计算带抖动的指数退避延迟
func calcDelay(cfg Config, attempt int) time.Duration {
    delay := float64(cfg.BaseDelay) * math.Pow(cfg.Multiplier, float64(attempt))

    if delay > float64(cfg.MaxDelay) {
        delay = float64(cfg.MaxDelay)
    }

    // 添加随机抖动，避免重试风暴（thundering herd）
    jitter := delay * cfg.JitterRatio * (rand.Float64()*2 - 1) // [-jitter, +jitter]
    delay += jitter

    return time.Duration(delay)
}

// IsRetryable 判断错误是否可重试
func IsRetryable(err error) bool {
    // 网络超时、临时错误可重试
    if errors.Is(err, context.DeadlineExceeded) {
        return true
    }

    // gRPC 错误码判断
    if s, ok := status.FromError(err); ok {
        switch s.Code() {
        case codes.Unavailable,     // 服务不可用
            codes.ResourceExhausted, // 资源耗尽（限流）
            codes.Aborted,           // 事务冲突
            codes.DeadlineExceeded:  // 超时
            return true
        case codes.InvalidArgument,  // 参数错误
            codes.NotFound,          // 未找到
            codes.PermissionDenied,  // 权限不足
            codes.Unauthenticated:   // 未认证
            return false             // 重试无意义
        }
    }

    return false
}
```
:::

### 8.2 重试预算（Retry Budget）

::: details 点击展开代码：8.2 重试预算（Retry Budget）
```go
package retry

import (
    "sync/atomic"
    "time"
)

// RetryBudget 防止重试风暴
// 限制一段时间窗口内的重试次数占总请求的比例
type RetryBudget struct {
    totalRequests  atomic.Int64
    retryRequests  atomic.Int64
    maxRetryRatio  float64
    window         time.Duration
}

func NewRetryBudget(maxRetryRatio float64, window time.Duration) *RetryBudget {
    rb := &RetryBudget{
        maxRetryRatio: maxRetryRatio,
        window:        window,
    }

    // 定期重置计数器
    go func() {
        ticker := time.NewTicker(window)
        defer ticker.Stop()
        for range ticker.C {
            rb.totalRequests.Store(0)
            rb.retryRequests.Store(0)
        }
    }()

    return rb
}

// AllowRetry 判断是否允许重试
func (rb *RetryBudget) AllowRetry() bool {
    total := rb.totalRequests.Load()
    retries := rb.retryRequests.Load()

    if total == 0 {
        return true
    }

    ratio := float64(retries) / float64(total)
    return ratio < rb.maxRetryRatio
}

// RecordRequest 记录一次请求
func (rb *RetryBudget) RecordRequest() {
    rb.totalRequests.Add(1)
}

// RecordRetry 记录一次重试
func (rb *RetryBudget) RecordRetry() {
    rb.retryRequests.Add(1)
}
```
:::

### 8.3 使用示例

::: details 点击展开代码：8.3 使用示例
```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    budget := NewRetryBudget(0.2, 1*time.Minute) // 重试率不超过 20%

    err := Do(ctx, DefaultConfig, func(ctx context.Context) error {
        budget.RecordRequest()

        err := callRemoteService(ctx)
        if err != nil && IsRetryable(err) {
            if !budget.AllowRetry() {
                return fmt.Errorf("retry budget exhausted: %w", err)
            }
            budget.RecordRetry()
        }
        return err
    })

    if err != nil {
        log.Printf("request failed after retries: %v", err)
    }
}
```
:::

<GoMicroserviceDiagram kind="retry-budget" />

### 讲解重点

- **指数退避 + 抖动**：退避时间 = BaseDelay * Multiplier^attempt + Jitter。抖动（Jitter）是关键，防止多个客户端在同一时刻集体重试（thundering herd 问题）。
- **只重试可重试的错误**：参数错误、权限不足等重试无意义；超时、服务不可用、限流等才应该重试。错误分类是重试策略的基础。
- **重试预算防雪崩**：全局限制重试比例（如不超过 20%），防止下游故障时大量重试请求加剧故障。这是 Google SRE 推荐的实践。
