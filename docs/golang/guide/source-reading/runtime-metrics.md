---
title: runtime/metrics 源码精读
description: 精读 runtime/metrics 的运行时指标采集实现，掌握 GC 延迟、内存分配、goroutine 数量等关键指标的采集与 Prometheus 集成最佳实践。
---

# runtime/metrics：运行时指标源码精读

> 核心源码：`src/runtime/metrics/`、`src/runtime/metrics.go`（Go 1.16+）

## 包结构图

```
runtime/metrics 体系（Go 1.16+）
══════════════════════════════════════════════════════════════════

  指标分类（/go/ 命名空间）：
  ┌────────────────────────────────┬─────────────────────────────┐
  │ 指标名称                       │ 含义                        │
  ├────────────────────────────────┼─────────────────────────────┤
  │ /gc/cycles/total:gc-cycles     │ GC 总次数                   │
  │ /gc/pause/total-ns:ns          │ GC STW 暂停总时间           │
  │ /gc/heap/allocs:bytes          │ 堆分配总字节（历史）        │
  │ /gc/heap/live:bytes            │ 当前堆存活对象大小          │
  │ /memory/classes/heap/in-use:bytes │ 堆内存使用量             │
  │ /memory/classes/total:bytes    │ 进程总内存                  │
  │ /sched/goroutines:goroutines   │ 当前 goroutine 数量         │
  │ /sched/latencies:seconds       │ goroutine 调度延迟直方图    │
  │ /cpu/classes/gc/total:cpu-seconds │ GC 消耗 CPU 时间         │
  └────────────────────────────────┴─────────────────────────────┘

  vs runtime.MemStats（旧方式）：
  ┌──────────────────────────┬──────────────────────────────────┐
  │ runtime.MemStats         │ runtime/metrics                  │
  ├──────────────────────────┼──────────────────────────────────┤
  │ Stop-The-World 采集      │ 无 STW（安全并发采集）           │
  │ 一次性读取所有字段        │ 按需采集指定指标（高效）         │
  │ 不含直方图               │ 含调度延迟直方图等分布数据       │
  │ 固定 API（不扩展）        │ 可枚举所有可用指标（稳定命名）   │
  └──────────────────────────┴──────────────────────────────────┘

  核心 API：
  ├── metrics.All() []metrics.Description  ← 枚举所有可用指标
  ├── metrics.Read(samples []metrics.Sample) ← 批量采集指定指标
  └── metrics.Sample{Name string, Value metrics.Value}

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/runtime/metrics/sample.go（简化）

// Sample：单个指标的采集请求和结果
type Sample struct {
    Name  string  // 指标名（如 "/gc/cycles/total:gc-cycles"）
    Value Value   // 采集结果（填充在 Read 后）
}

// Value：指标值（联合类型）
type Value struct {
    kind KindFloat64 | KindUint64 | KindFloat64Histogram | ...
    scalar uint64     // uint64/float64 存储
    pointer *histogram // 直方图存储
}

// Read：批量采集（高效，一次系统调用）
// samples 的 Name 必须预先填写，Read 填充 Value
func Read(samples []Sample) {
    // 调用 runtime 内部实现，无 STW
    runtime_readMetrics(&samples[0], len(samples), cap(samples))
}
```

---

## 二、代码示例

### 枚举所有可用指标

```go
import "runtime/metrics"

func listAllMetrics() {
    descs := metrics.All()
    for _, d := range descs {
        fmt.Printf("%-55s %s\n", d.Name, d.Kind)
    }
}

// 输出示例：
// /cgo/go-to-c-calls:calls                        KindUint64
// /cpu/classes/gc/mark/assist:cpu-seconds          KindFloat64
// /gc/cycles/automatic:gc-cycles                   KindUint64
// /gc/heap/allocs:bytes                            KindUint64
// /sched/latencies:seconds                         KindFloat64Histogram
// ...
```

### 基础指标采集

```go
func collectMetrics() {
    // 预定义感兴趣的指标
    samples := []metrics.Sample{
        {Name: "/gc/cycles/total:gc-cycles"},
        {Name: "/gc/pause/total-ns:ns"},
        {Name: "/gc/heap/live:bytes"},
        {Name: "/memory/classes/heap/in-use:bytes"},
        {Name: "/sched/goroutines:goroutines"},
    }

    // 一次批量采集（高效）
    metrics.Read(samples)

    for _, s := range samples {
        switch s.Value.Kind() {
        case metrics.KindUint64:
            fmt.Printf("%s = %d\n", s.Name, s.Value.Uint64())
        case metrics.KindFloat64:
            fmt.Printf("%s = %.2f\n", s.Name, s.Value.Float64())
        case metrics.KindBad:
            fmt.Printf("%s = 不支持此指标\n", s.Name)
        }
    }
}
```

### 读取调度延迟直方图

```go
// GC 和调度延迟直方图：P99/P95 延迟分析
func analyzeLatency() {
    samples := []metrics.Sample{
        {Name: "/sched/latencies:seconds"},
        {Name: "/gc/pauses:seconds"},
    }
    metrics.Read(samples)

    for _, s := range samples {
        if s.Value.Kind() != metrics.KindFloat64Histogram {
            continue
        }
        h := s.Value.Float64Histogram()

        // 计算 P99 延迟
        p99 := percentile(h, 0.99)
        p50 := percentile(h, 0.50)
        fmt.Printf("%s: p50=%.2fms p99=%.2fms\n",
            s.Name, p50*1000, p99*1000)
    }
}

func percentile(h *metrics.Float64Histogram, p float64) float64 {
    // 累计计数找分位数
    total := uint64(0)
    for _, count := range h.Counts {
        total += count
    }
    target := uint64(float64(total) * p)

    cumulative := uint64(0)
    for i, count := range h.Counts {
        cumulative += count
        if cumulative >= target {
            // 返回 bucket 的上界（保守估计）
            if i+1 < len(h.Buckets) {
                return h.Buckets[i+1]
            }
            return h.Buckets[i]
        }
    }
    return 0
}
```

### 与 Prometheus 集成

```go
import (
    "runtime/metrics"
    "github.com/prometheus/client_golang/prometheus"
)

// 注册 Go runtime 指标到 Prometheus
type GoRuntimeCollector struct {
    gcCycles   *prometheus.CounterVec
    heapInUse  prometheus.Gauge
    goroutines prometheus.Gauge
    gcPauseNs  prometheus.Counter
}

func NewGoRuntimeCollector() *GoRuntimeCollector {
    return &GoRuntimeCollector{
        gcCycles: prometheus.NewCounterVec(prometheus.CounterOpts{
            Name: "go_gc_cycles_total",
            Help: "Total number of GC cycles",
        }, []string{}),
        heapInUse: prometheus.NewGauge(prometheus.GaugeOpts{
            Name: "go_memory_heap_inuse_bytes",
            Help: "Heap memory in use",
        }),
        goroutines: prometheus.NewGauge(prometheus.GaugeOpts{
            Name: "go_goroutines",
            Help: "Number of goroutines",
        }),
        gcPauseNs: prometheus.NewCounter(prometheus.CounterOpts{
            Name: "go_gc_pause_total_ns",
            Help: "Total GC pause time in nanoseconds",
        }),
    }
}

func (c *GoRuntimeCollector) Collect(ch chan<- prometheus.Metric) {
    samples := []metrics.Sample{
        {Name: "/gc/cycles/total:gc-cycles"},
        {Name: "/gc/pause/total-ns:ns"},
        {Name: "/memory/classes/heap/in-use:bytes"},
        {Name: "/sched/goroutines:goroutines"},
    }
    metrics.Read(samples)

    for _, s := range samples {
        switch s.Name {
        case "/gc/cycles/total:gc-cycles":
            ch <- prometheus.MustNewConstMetric(
                c.gcCycles.With(nil).Desc(),
                prometheus.CounterValue,
                float64(s.Value.Uint64()),
            )
        case "/memory/classes/heap/in-use:bytes":
            c.heapInUse.Set(float64(s.Value.Uint64()))
            c.heapInUse.Collect(ch)
        case "/sched/goroutines:goroutines":
            c.goroutines.Set(float64(s.Value.Uint64()))
            c.goroutines.Collect(ch)
        }
    }
}
```

### 定期指标上报（生产监控）

```go
// 定期采集 runtime 指标并写入 Prometheus / StatsD
func startMetricsReporter(ctx context.Context, interval time.Duration) {
    // 预分配 samples（避免每次 tick 都分配）
    samples := []metrics.Sample{
        {Name: "/gc/cycles/total:gc-cycles"},
        {Name: "/gc/heap/live:bytes"},
        {Name: "/memory/classes/heap/in-use:bytes"},
        {Name: "/sched/goroutines:goroutines"},
        {Name: "/cpu/classes/gc/total:cpu-seconds"},
    }

    ticker := time.NewTicker(interval)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            metrics.Read(samples) // 原地更新 Value（无额外分配）
            reportToMonitoring(samples)
        }
    }
}

func reportToMonitoring(samples []metrics.Sample) {
    for _, s := range samples {
        var value float64
        switch s.Value.Kind() {
        case metrics.KindUint64:
            value = float64(s.Value.Uint64())
        case metrics.KindFloat64:
            value = s.Value.Float64()
        default:
            continue
        }
        // 发送到监控系统（statsd/prometheus/datadog）
        statsd.Gauge(s.Name, value, nil, 1)
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `runtime/metrics` 比 `runtime.MemStats` 的优势？ | 无 STW（MemStats 需要 Stop-The-World）；支持直方图分布数据；按需采集指定指标（不必读取全部字段）；API 稳定可枚举 |
| `/gc/pause/total-ns` 和 `/gc/pauses:seconds` 的区别？ | `total-ns` 是累计总暂停时间（Counter）；`pauses:seconds` 是每次 GC 暂停时间的直方图（可计算 P99 等分位数） |
| 如何用 `runtime/metrics` 检测 goroutine 泄漏？ | 定期采集 `/sched/goroutines:goroutines`，持续增长且不下降则泄漏；配合 `/debug/pprof/goroutine` 定位根因 |
| `metrics.Read` 是否线程安全？ | 是。无需加锁；内部使用无锁或细粒度锁实现；可在任意 goroutine 中调用 |
| 指标名的命名规范？ | `/<namespace>/<category>/<name>:<unit>` 格式；单位用 SI 后缀（ns/bytes/seconds/goroutines）；Go 团队保证命名稳定性 |
| 直方图指标如何计算 P99？ | `h.Buckets` 是桶边界，`h.Counts` 是桶内计数；累计 Counts 到 99% 位置对应的 Buckets 值即 P99 |
