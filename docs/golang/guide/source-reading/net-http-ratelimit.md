---
title: net/http 限流与熔断源码精读
description: 精读限流与熔断的 Go 实现，掌握令牌桶/滑动窗口限流、断路器模式、golang.org/x/time/rate 使用、中间件封装与分布式限流最佳实践。
---

# net/http 限流与熔断：源码精读

> 核心包：`golang.org/x/time/rate`（令牌桶）、自实现断路器
>
> 图例参考：
> - `GoNetworkDiagram`：`rate-limit-modes`
> - `GoNetworkDiagram`：`circuit-breaker-states`

## 包结构图

```
限流与熔断体系
══════════════════════════════════════════════════════════════════

  限流算法对比：
  ┌───────────────┬──────────────────────────────────────────┐
  │ 算法           │ 特点                                     │
  ├───────────────┼──────────────────────────────────────────┤
  │ 令牌桶         │ 允许突发（桶里有令牌）；平均速率可控      │
  │ 漏桶           │ 匀速处理；超出直接丢弃（无突发）          │
  │ 固定窗口计数   │ 简单；窗口边界突发问题                    │
  │ 滑动窗口计数   │ 平滑；无边界突发；内存较高               │
  └───────────────┴──────────────────────────────────────────┘

  golang.org/x/time/rate（令牌桶）：
  rate.NewLimiter(r Limit, b int)
  ├── r: 每秒产生令牌数（rate.Limit(10) = 10 QPS）
  ├── b: 桶容量（最大突发数）
  ├── Allow()        → 立即检查（非阻塞）
  ├── Wait(ctx)      → 阻塞等待令牌（可取消）
  └── Reserve()      → 预约令牌（获取等待时间）

  断路器状态机：
  Closed（正常）→ [失败率超阈值] → Open（断路）
                                        ↓ [超时]
  Closed（恢复）← [探测成功]  ← HalfOpen（半开）

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="rate-limit-modes" />

---

## 一、核心实现

```go
// golang.org/x/time/rate（令牌桶简化原理）

type Limiter struct {
    mu     sync.Mutex
    limit  Limit      // 每秒令牌数
    burst  int        // 桶容量
    tokens float64    // 当前令牌数
    last   time.Time  // 上次更新时间
}

func (lim *Limiter) Allow() bool {
    lim.mu.Lock()
    defer lim.mu.Unlock()

    now := time.Now()
    // 自上次更新累积令牌
    elapsed := now.Sub(lim.last).Seconds()
    lim.tokens = min(float64(lim.burst), lim.tokens+elapsed*float64(lim.limit))
    lim.last = now

    if lim.tokens >= 1 {
        lim.tokens--
        return true
    }
    return false
}
```

---

## 二、代码示例

### 全局限流中间件（令牌桶）

```go
import (
    "golang.org/x/time/rate"
    "net/http"
)

// 全局限流：整个服务 100 QPS，允许 20 的突发
func globalRateLimitMiddleware(rps float64, burst int) func(http.Handler) http.Handler {
    limiter := rate.NewLimiter(rate.Limit(rps), burst)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
                // 按 RFC 6585 返回 Retry-After
                w.Header().Set("Retry-After", "1")
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// 使用
mux := http.NewServeMux()
handler := globalRateLimitMiddleware(100, 20)(mux)
```

### 按 IP 限流（每个客户端独立限速）

```go
type IPRateLimiter struct {
    visitors map[string]*visitorEntry
    mu       sync.Mutex
    rps      float64
    burst    int
    ttl      time.Duration // 不活跃 visitor 的清理时间
}

type visitorEntry struct {
    limiter  *rate.Limiter
    lastSeen time.Time
}

func NewIPRateLimiter(rps float64, burst int) *IPRateLimiter {
    l := &IPRateLimiter{
        visitors: make(map[string]*visitorEntry),
        rps:      rps,
        burst:    burst,
        ttl:      5 * time.Minute,
    }
    go l.cleanupLoop()
    return l
}

func (l *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
    l.mu.Lock()
    defer l.mu.Unlock()

    v, ok := l.visitors[ip]
    if !ok {
        limiter := rate.NewLimiter(rate.Limit(l.rps), l.burst)
        l.visitors[ip] = &visitorEntry{limiter: limiter, lastSeen: time.Now()}
        return limiter
    }
    v.lastSeen = time.Now()
    return v.limiter
}

// 定期清理长期不活跃的 visitor
func (l *IPRateLimiter) cleanupLoop() {
    ticker := time.NewTicker(time.Minute)
    for range ticker.C {
        l.mu.Lock()
        for ip, v := range l.visitors {
            if time.Since(v.lastSeen) > l.ttl {
                delete(l.visitors, ip)
            }
        }
        l.mu.Unlock()
    }
}

// 中间件
func (l *IPRateLimiter) Middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        ip := realIP(r) // 提取真实 IP（考虑反向代理）
        limiter := l.GetLimiter(ip)

        if !limiter.Allow() {
            http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// 提取真实 IP（处理 X-Forwarded-For / X-Real-IP）
func realIP(r *http.Request) string {
    if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
        ips := strings.Split(xff, ",")
        return strings.TrimSpace(ips[0])
    }
    if xri := r.Header.Get("X-Real-IP"); xri != "" {
        return xri
    }
    ip, _, _ := net.SplitHostPort(r.RemoteAddr)
    return ip
}
```

### 滑动窗口限流（精确计数）

```go
// 基于 sync.Map + 时间槽的滑动窗口（适合精确计数场景）
type SlidingWindowLimiter struct {
    windowSize time.Duration
    maxReqs    int
    mu         sync.Mutex
    windows    map[string][]time.Time // IP → 请求时间戳列表
}

func NewSlidingWindowLimiter(window time.Duration, maxReqs int) *SlidingWindowLimiter {
    l := &SlidingWindowLimiter{
        windowSize: window,
        maxReqs:    maxReqs,
        windows:    make(map[string][]time.Time),
    }
    go l.cleanup()
    return l
}

func (l *SlidingWindowLimiter) Allow(key string) bool {
    l.mu.Lock()
    defer l.mu.Unlock()

    now := time.Now()
    cutoff := now.Add(-l.windowSize)

    // 过滤掉窗口外的请求
    times := l.windows[key]
    valid := times[:0]
    for _, t := range times {
        if t.After(cutoff) {
            valid = append(valid, t)
        }
    }

    if len(valid) >= l.maxReqs {
        l.windows[key] = valid
        return false
    }

    l.windows[key] = append(valid, now)
    return true
}

func (l *SlidingWindowLimiter) cleanup() {
    for range time.Tick(time.Minute) {
        l.mu.Lock()
        cutoff := time.Now().Add(-l.windowSize)
        for key, times := range l.windows {
            if len(times) > 0 && times[len(times)-1].Before(cutoff) {
                delete(l.windows, key)
            }
        }
        l.mu.Unlock()
    }
}
```

### 断路器（Circuit Breaker）

<GoNetworkDiagram kind="circuit-breaker-states" />

```go
// 三态断路器：Closed → Open → HalfOpen → Closed
type State int

const (
    StateClosed   State = iota // 正常通行
    StateOpen                  // 断路（快速失败）
    StateHalfOpen              // 半开（探测恢复）
)

type CircuitBreaker struct {
    mu          sync.Mutex
    state       State
    failures    int
    successes   int
    lastFailure time.Time

    maxFailures    int           // 触发断路的失败次数
    resetTimeout   time.Duration // Open → HalfOpen 的等待时间
    halfOpenMaxReqs int          // HalfOpen 允许的探测请求数
}

func NewCircuitBreaker(maxFailures int, resetTimeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        maxFailures:     maxFailures,
        resetTimeout:    resetTimeout,
        halfOpenMaxReqs: 1,
    }
}

var ErrCircuitOpen = errors.New("circuit breaker is open")

func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()

    switch cb.state {
    case StateOpen:
        // 检查是否可以转为 HalfOpen
        if time.Since(cb.lastFailure) > cb.resetTimeout {
            cb.state = StateHalfOpen
            cb.successes = 0
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen // 快速失败
        }

    case StateHalfOpen:
        if cb.successes >= cb.halfOpenMaxReqs {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }
    }

    cb.mu.Unlock()

    // 执行实际调用
    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failures++
        cb.lastFailure = time.Now()

        if cb.state == StateHalfOpen || cb.failures >= cb.maxFailures {
            cb.state = StateOpen
            cb.failures = 0
        }
        return err
    }

    // 成功
    switch cb.state {
    case StateHalfOpen:
        cb.successes++
        if cb.successes >= cb.halfOpenMaxReqs {
            cb.state = StateClosed // 恢复正常
            cb.failures = 0
        }
    case StateClosed:
        cb.failures = 0 // 重置失败计数
    }

    return nil
}

func (cb *CircuitBreaker) State() State {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    return cb.state
}
```

### 限流 + 熔断组合 HTTP 客户端

```go
// 生产级 HTTP 客户端：内置限流 + 熔断 + 重试
type ResilientClient struct {
    client  *http.Client
    limiter *rate.Limiter
    cb      *CircuitBreaker
}

func NewResilientClient(rps float64) *ResilientClient {
    return &ResilientClient{
        client:  &http.Client{Timeout: 10 * time.Second},
        limiter: rate.NewLimiter(rate.Limit(rps), int(rps)*2),
        cb:      NewCircuitBreaker(5, 30*time.Second),
    }
}

func (c *ResilientClient) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
    // 1. 限流（等待令牌，可被 ctx 取消）
    if err := c.limiter.Wait(ctx); err != nil {
        return nil, fmt.Errorf("rate limit: %w", err)
    }

    // 2. 断路器保护
    var resp *http.Response
    err := c.cb.Call(func() error {
        var err error
        resp, err = c.client.Do(req.WithContext(ctx))
        if err != nil {
            return err
        }
        // 5xx 也算失败（触发断路器）
        if resp.StatusCode >= 500 {
            return fmt.Errorf("server error: %d", resp.StatusCode)
        }
        return nil
    })

    if errors.Is(err, ErrCircuitOpen) {
        return nil, fmt.Errorf("service unavailable (circuit open)")
    }
    return resp, err
}

// 带指数退避的重试
func (c *ResilientClient) DoWithRetry(ctx context.Context, makeReq func() *http.Request, maxRetries int) (*http.Response, error) {
    var lastErr error
    for attempt := 0; attempt <= maxRetries; attempt++ {
        if attempt > 0 {
            // 指数退避 + 抖动
            backoff := time.Duration(1<<uint(attempt-1)) * 100 * time.Millisecond
            jitter := time.Duration(rand.Int63n(int64(backoff / 2)))
            select {
            case <-time.After(backoff + jitter):
            case <-ctx.Done():
                return nil, ctx.Err()
            }
        }

        resp, err := c.Do(ctx, makeReq())
        if err == nil {
            return resp, nil
        }
        lastErr = err

        // 断路器打开时不重试
        if errors.Is(err, ErrCircuitOpen) {
            break
        }
    }
    return nil, fmt.Errorf("after %d retries: %w", maxRetries, lastErr)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 令牌桶和漏桶的区别？ | 令牌桶：匀速产生令牌，桶满后溢出；允许突发（桶里有积累的令牌）；漏桶：请求排队匀速处理，超出容量直接丢弃；无突发 |
| `rate.Limiter.Allow()` vs `Wait()` 如何选择？ | `Allow()` 非阻塞，超限立即返回 false（适合 HTTP 中间件，快速返回 429）；`Wait()` 阻塞等待令牌（适合后台任务，控制速率不丢弃）|
| 断路器 HalfOpen 状态的作用？ | 避免恢复期间大量请求涌入导致再次崩溃；HalfOpen 时只放行少量探测请求（如 1 个）；探测成功则 Close，失败则重新 Open |
| 分布式限流如何实现？ | Redis INCR + EXPIRE（固定窗口）；Redis Sorted Set（滑动窗口）；Redis + Lua 脚本保证原子性；golang 侧用 `go-redis` 封装 `Allow()` 接口 |
| 如何防止限流器内存泄漏（按 IP 限流）？ | 定期清理长期不活跃的 key（LRU 淘汰或 TTL 清理）；`cleanupLoop` 每分钟扫描，移除超过 5 分钟无请求的 IP |
| 断路器的 `maxFailures` 和 `resetTimeout` 如何设置？ | `maxFailures`：根据服务 SLA 设置（如 5 次失败触发）；`resetTimeout`：等于下游服务重启时间（通常 10~30s）；过短会频繁半开增加压力 |
