---
title: Prometheus Go 客户端源码精读
description: 精读 prometheus/client_golang 的指标实现，掌握 Counter/Gauge/Histogram/Summary 四种类型、自定义 Collector、标签设计与生产级可观测性最佳实践。
---

# Prometheus Go 客户端：源码精读

> 核心包：`github.com/prometheus/client_golang/prometheus`
>
> 图例参考：
> - `GoEngineeringDiagram`：`prometheus-scrape-flow`

## 包结构图

```
prometheus/client_golang 体系
══════════════════════════════════════════════════════════════════

  四种指标类型：
  ┌───────────────┬────────────────────────────────────────────┐
  │ 类型           │ 说明                                       │
  ├───────────────┼────────────────────────────────────────────┤
  │ Counter       │ 单调递增（请求总数、错误总数）               │
  │ Gauge         │ 任意增减（当前连接数、内存使用）             │
  │ Histogram     │ 分桶统计（延迟分布、包大小）                 │
  │ Summary       │ 分位数（p50/p95/p99，客户端计算）           │
  └───────────────┴────────────────────────────────────────────┘

  命名规范（Prometheus 约定）：
  <namespace>_<subsystem>_<name>_<unit>_total
  例：http_requests_total、http_request_duration_seconds

  标签设计原则：
  ├── 基数（cardinality）不能太高（< 10000 种组合）
  ├── 不要用 user_id/request_id 作标签（基数爆炸）
  └── 好标签：method, status_code, endpoint, region

  采集端点：
  promhttp.Handler() → /metrics （默认 Prometheus 抓取格式）

══════════════════════════════════════════════════════════════════
```

<GoEngineeringDiagram kind="prometheus-scrape-flow" />

---

## 一、核心实现

```go
// Counter 实现（简化）
type counter struct {
    valInt  uint64  // 整数部分（atomic）
    valBits uint64  // 浮点部分（atomic，存 IEEE 754）
    desc    *Desc
    labelPairs []*dto.LabelPair
}

func (c *counter) Add(v float64) {
    // 使用 CAS 原子更新浮点值（无锁）
    for {
        old := atomic.LoadUint64(&c.valBits)
        new := math.Float64bits(math.Float64frombits(old) + v)
        if atomic.CompareAndSwapUint64(&c.valBits, old, new) {
            return
        }
    }
}

// Histogram 实现：写时加速（每个 bucket 独立原子计数）
// 采集时计算累积分布（_count, _sum, _bucket{le="..."})
```

---

## 二、代码示例

### 基础：四种指标类型

```go
import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
    "net/http"
)

// promauto：自动注册到默认 Registry（推荐用于应用指标）
var (
    // Counter：只增不减
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "myapp",
            Subsystem: "http",
            Name:      "requests_total",
            Help:      "HTTP 请求总数",
        },
        []string{"method", "path", "status"}, // 标签
    )

    // Gauge：可增可减
    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "myapp",
            Name:      "active_connections",
            Help:      "当前活跃连接数",
        },
    )

    // Histogram：延迟分布（推荐生产使用）
    requestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "myapp",
            Subsystem: "http",
            Name:      "request_duration_seconds",
            Help:      "HTTP 请求延迟分布",
            // 为业务定制桶边界（单位：秒）
            Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
        },
        []string{"method", "path"},
    )

    // Summary：精确分位数（客户端计算，无法聚合）
    // 生产中通常用 Histogram 替代 Summary
    cacheHitRatio = promauto.NewSummary(
        prometheus.SummaryOpts{
            Name:       "myapp_cache_hit_ratio",
            Help:       "缓存命中率",
            Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
        },
    )
)

// 暴露 /metrics 端点
func main() {
    http.Handle("/metrics", promhttp.Handler())
    http.ListenAndServe(":9090", nil)
}
```

### HTTP 中间件（自动埋点）

```go
// 在 HTTP 中间件中自动采集请求指标
func metricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // 包装 ResponseWriter 以捕获状态码
        rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        next.ServeHTTP(rw, r)

        // 规范化路径（防止高基数：/users/123 → /users/:id）
        path := normalizePath(r.URL.Path)
        duration := time.Since(start).Seconds()
        statusStr := strconv.Itoa(rw.statusCode)

        httpRequestsTotal.WithLabelValues(r.Method, path, statusStr).Inc()
        requestDuration.WithLabelValues(r.Method, path).Observe(duration)
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

// 路径规范化：将动态 ID 替换为占位符
func normalizePath(path string) string {
    // /users/123 → /users/:id
    // /orders/abc-def → /orders/:id
    re := regexp.MustCompile(`/[0-9a-f\-]{6,}`)
    return re.ReplaceAllString(path, "/:id")
}
```

### 自定义 Collector（批量采集）

```go
// 自定义 Collector 适合从外部系统批量拉取指标
// 例：从数据库查询各状态订单数量
type OrderStatsCollector struct {
    db             *sql.DB
    pendingOrders  *prometheus.Desc
    completedOrders *prometheus.Desc
    failedOrders   *prometheus.Desc
}

func NewOrderStatsCollector(db *sql.DB) *OrderStatsCollector {
    return &OrderStatsCollector{
        db: db,
        pendingOrders: prometheus.NewDesc(
            "myapp_orders_pending_total",
            "待处理订单总数",
            []string{"region"}, nil,
        ),
        completedOrders: prometheus.NewDesc(
            "myapp_orders_completed_total",
            "已完成订单总数",
            []string{"region"}, nil,
        ),
        failedOrders: prometheus.NewDesc(
            "myapp_orders_failed_total",
            "失败订单总数",
            []string{"region"}, nil,
        ),
    }
}

func (c *OrderStatsCollector) Describe(ch chan<- *prometheus.Desc) {
    ch <- c.pendingOrders
    ch <- c.completedOrders
    ch <- c.failedOrders
}

// Collect 每次 Prometheus 抓取时调用（通常 15s 一次）
func (c *OrderStatsCollector) Collect(ch chan<- prometheus.Metric) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    rows, err := c.db.QueryContext(ctx,
        "SELECT region, status, COUNT(*) FROM orders GROUP BY region, status")
    if err != nil {
        // 采集失败：发送 error metric
        ch <- prometheus.NewInvalidMetric(c.pendingOrders, err)
        return
    }
    defer rows.Close()

    type key struct{ region, status string }
    counts := make(map[key]int64)
    for rows.Next() {
        var k key
        var count int64
        rows.Scan(&k.region, &k.status, &count)
        counts[k] = count
    }

    regions := collectRegions(counts)
    for _, region := range regions {
        ch <- prometheus.MustNewConstMetric(c.pendingOrders,
            prometheus.GaugeValue,
            float64(counts[key{region, "pending"}]),
            region,
        )
        ch <- prometheus.MustNewConstMetric(c.completedOrders,
            prometheus.CounterValue,
            float64(counts[key{region, "completed"}]),
            region,
        )
        ch <- prometheus.MustNewConstMetric(c.failedOrders,
            prometheus.CounterValue,
            float64(counts[key{region, "failed"}]),
            region,
        )
    }
}

// 注册自定义 Collector
func setupMetrics(db *sql.DB) {
    collector := NewOrderStatsCollector(db)
    prometheus.MustRegister(collector)
}
```

### 独立 Registry（测试/多服务实例）

```go
// 使用独立 Registry 避免全局状态（推荐生产）
func newRegistry() (*prometheus.Registry, *AppMetrics) {
    reg := prometheus.NewRegistry()

    // 注册 Go 运行时指标
    reg.MustRegister(
        collectors.NewGoCollector(),
        collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}),
    )

    metrics := &AppMetrics{
        RequestsTotal: prometheus.NewCounterVec(
            prometheus.CounterOpts{Name: "http_requests_total"},
            []string{"method", "status"},
        ),
        RequestDuration: prometheus.NewHistogramVec(
            prometheus.HistogramOpts{
                Name:    "http_request_duration_seconds",
                Buckets: prometheus.DefBuckets,
            },
            []string{"method"},
        ),
    }

    reg.MustRegister(metrics.RequestsTotal, metrics.RequestDuration)

    return reg, metrics
}

type AppMetrics struct {
    RequestsTotal   *prometheus.CounterVec
    RequestDuration *prometheus.HistogramVec
}

// 在测试中使用独立 Registry
func TestMetrics(t *testing.T) {
    reg, metrics := newRegistry()

    metrics.RequestsTotal.WithLabelValues("GET", "200").Inc()
    metrics.RequestsTotal.WithLabelValues("GET", "200").Inc()
    metrics.RequestsTotal.WithLabelValues("POST", "500").Inc()

    // 采集并验证
    mfs, err := reg.Gather()
    if err != nil {
        t.Fatal(err)
    }

    for _, mf := range mfs {
        if *mf.Name == "http_requests_total" {
            // 验证具体指标值
            for _, m := range mf.Metric {
                t.Logf("labels=%v value=%v", m.Label, m.Counter.GetValue())
            }
        }
    }
}
```

### Go 运行时指标（开箱即用）

```go
// collectors.NewGoCollector() 自动暴露的指标：
// go_goroutines              - goroutine 数量
// go_gc_duration_seconds     - GC 停顿时间分位数
// go_memstats_heap_inuse_bytes - 堆使用字节
// go_memstats_alloc_bytes_total - 累计分配字节
// go_memstats_gc_cpu_fraction - GC CPU 占比

// 常用 PromQL 查询：
// rate(http_requests_total[5m])                 ← 5分钟 RPS
// histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))  ← P99 延迟
// rate(go_gc_duration_seconds_count[5m])        ← GC 频率
// go_memstats_heap_inuse_bytes / 1024 / 1024    ← 堆内存 MB
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Histogram 和 Summary 如何选择？ | Histogram 推荐：可聚合（多实例 → 集群 P99）；桶边界固定需预设；Summary：精确但不可聚合（只能看单实例 P99）；生产中几乎都用 Histogram |
| 标签基数（cardinality）为什么重要？ | 每个标签组合 = 一个时间序列；基数爆炸（如 user_id 标签 100 万用户）导致 Prometheus 内存耗尽；好标签基数 < 50，最多 < 10000 |
| `promauto` 和手动注册的区别？ | `promauto` 自动注册到 `DefaultRegisterer`，包导入时执行；手动注册更灵活（可用独立 Registry），适合测试和多实例隔离 |
| 自定义 Collector 和普通指标的区别？ | 普通指标：程序运行时持续更新，抓取时直接读；自定义 Collector：每次抓取时才执行 `Collect()`（适合需要查 DB 等慢操作）|
| 如何避免 Histogram 桶边界设计不当？ | 根据业务 SLO 设计桶（如 P99 目标 100ms，桶包含 10ms/50ms/100ms/200ms）；不要用默认 `DefBuckets`（针对通用延迟设计，可能不适合你的业务）|
| Counter 为什么要以 `_total` 结尾？ | Prometheus 命名规范（OpenMetrics 标准）；prometheus Go 库强制要求（否则自动添加）；方便 PromQL 用 `rate()` 函数计算速率 |
