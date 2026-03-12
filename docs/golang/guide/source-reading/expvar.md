---
title: expvar 源码精读
description: 精读 expvar 的可导出变量机制，理解内置 /debug/vars 端点设计与生产级指标暴露的最佳实践。
---

# expvar：可导出变量源码精读

> 核心源码：`src/expvar/expvar.go`

## 包结构图

```
expvar 全景
══════════════════════════════════════════════════════════════════

  expvar 包（导入即副作用注册 HTTP 端点）
  │
  ├── 内置变量（自动注册）：
  │   ├── "cmdline"  → os.Args（命令行参数）
  │   └── "memstats" → runtime.MemStats（内存统计）
  │
  ├── 变量类型：
  │   ├── expvar.Int     ← int64，原子操作
  │   ├── expvar.Float   ← float64，原子操作
  │   ├── expvar.String  ← string，互斥锁保护
  │   ├── expvar.Map     ← key-value map，按 key 排序输出
  │   └── expvar.Func    ← func() any，每次请求时调用
  │
  ├── 注册函数：
  │   ├── expvar.NewInt("name")       → *expvar.Int
  │   ├── expvar.NewFloat("name")     → *expvar.Float
  │   ├── expvar.NewString("name")    → *expvar.String
  │   ├── expvar.NewMap("name")       → *expvar.Map
  │   └── expvar.Publish("name", var) ← 注册自定义 Var
  │
  └── HTTP 端点：
      import _ "expvar" → 自动注册 /debug/vars
      GET /debug/vars   → JSON 格式所有已注册变量

  expvar.Var 接口：
  └── String() string   ← 返回 JSON 字符串表示

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/expvar/expvar.go
// 全局变量注册表（有序 map）
var vars sync.Map    // map[string]Var
var varKeysMu sync.RWMutex
var varKeys []string // 有序 key 列表（输出时排序）

// Var 接口：任何实现 String() 的类型都可注册
type Var interface {
    String() string // 返回 JSON 格式的值
}

// Int：原子 int64
type Int struct {
    i atomic.Int64
}
func (v *Int) Add(delta int64) { v.i.Add(delta) }
func (v *Int) Set(value int64) { v.i.Store(value) }
func (v *Int) Value() int64    { return v.i.Load() }
func (v *Int) String() string  { return strconv.FormatInt(v.i.Load(), 10) }

// Map：线程安全的 key-value 存储
type Map struct {
    m      sync.Map
    keysMu sync.RWMutex
    keys   []string // 排序后的 key（输出稳定）
}

// HTTP handler（import _ "expvar" 时注册）
func expvarHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    fmt.Fprintf(w, "{\n")
    first := true
    Do(func(kv KeyValue) {
        if !first { fmt.Fprintf(w, ",\n") }
        first = false
        fmt.Fprintf(w, "%q: %s", kv.Key, kv.Value) // Value 已是 JSON
    })
    fmt.Fprintf(w, "\n}\n")
}
```

---

## 二、代码示例

### 基础指标注册

```go
package main

import (
    "expvar"
    "net/http"
    _ "net/http/pprof" // 同时暴露 pprof
)

// 包级别声明（init 之前初始化）
var (
    requestTotal   = expvar.NewInt("requests_total")
    requestErrors  = expvar.NewInt("requests_errors")
    activeConns    = expvar.NewInt("connections_active")
    lastQueryTime  = expvar.NewFloat("last_query_seconds")
    serverVersion  = expvar.NewString("server_version")
)

func init() {
    serverVersion.Set("1.2.3")

    // Func：每次请求时动态计算
    expvar.Publish("goroutines", expvar.Func(func() any {
        return runtime.NumGoroutine()
    }))
    expvar.Publish("uptime_seconds", expvar.Func(func() any {
        return time.Since(startTime).Seconds()
    }))
}

var startTime = time.Now()

func handler(w http.ResponseWriter, r *http.Request) {
    requestTotal.Add(1)
    activeConns.Add(1)
    defer activeConns.Add(-1)

    start := time.Now()
    defer func() {
        lastQueryTime.Set(time.Since(start).Seconds())
    }()

    // 业务逻辑
}

func main() {
    http.HandleFunc("/api", handler)
    // /debug/vars 由 import _ "expvar" 自动注册
    http.ListenAndServe(":8080", nil)
}
```

### Map 类型（分类统计）

```go
// 按路径统计请求数
var httpRequests = expvar.NewMap("http_requests")

func trackRequest(path string, statusCode int) {
    httpRequests.Add(path, 1) // path → 计数

    // 嵌套 Map（按状态码分类）
    if statusCode >= 500 {
        httpRequests.Add("5xx_errors", 1)
    }
}

// /debug/vars 输出:
// "http_requests": {"/api/users": 42, "/api/orders": 18, "5xx_errors": 2}
```

### 自定义 Var 实现

```go
// 实现 expvar.Var 接口
type HealthStatus struct {
    mu     sync.RWMutex
    checks map[string]bool
}

func (h *HealthStatus) Set(name string, healthy bool) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.checks[name] = healthy
}

func (h *HealthStatus) String() string {
    h.mu.RLock()
    defer h.mu.RUnlock()
    // 返回 JSON 格式
    b, _ := json.Marshal(h.checks)
    return string(b)
}

var health = &HealthStatus{checks: make(map[string]bool)}

func init() {
    expvar.Publish("health", health)
    health.Set("database", true)
    health.Set("redis", true)
    health.Set("kafka", false)
}

// /debug/vars 输出:
// "health": {"database":true,"kafka":false,"redis":true}
```

### 与 Prometheus 结合（生产级监控）

```go
// expvar 适合轻量级内部调试；生产环境推荐 Prometheus
// 可以用 expvar 数据桥接到 Prometheus

import (
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    // Prometheus 指标（生产级）
    reqCounter = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    // 同时保留 expvar（开发调试用）
    expRequests = expvar.NewMap("requests_by_path")
)

func init() {
    prometheus.MustRegister(reqCounter)
}

func recordMetrics(method, path string, status int, duration time.Duration) {
    // Prometheus（精细标签，多维查询）
    reqCounter.WithLabelValues(method, path, strconv.Itoa(status)).Inc()

    // expvar（直接 curl /debug/vars 即可查看）
    expRequests.Add(path, 1)
}

func main() {
    http.Handle("/metrics", promhttp.Handler())   // Prometheus
    // /debug/vars 由 import _ "expvar" 自动注册
    http.ListenAndServe(":8080", nil)
}
```

### 读取 /debug/vars 数据

```go
// 从 expvar 端点读取数据（用于监控脚本）
func fetchExpvars(addr string) (map[string]json.RawMessage, error) {
    resp, err := http.Get("http://" + addr + "/debug/vars")
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var data map[string]json.RawMessage
    return data, json.NewDecoder(resp.Body).Decode(&data)
}

// 读取内存统计
vars, _ := fetchExpvars("localhost:8080")
var memStats runtime.MemStats
json.Unmarshal(vars["memstats"], &memStats)
fmt.Printf("堆内存: %d MB\n", memStats.HeapAlloc/1024/1024)
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| import _ "expvar" 做了什么？ | 注册 /debug/vars HTTP 端点；注册内置变量 cmdline 和 memstats |
| expvar.Int 的 Add/Set 是线程安全的吗？ | 是，内部用 atomic.Int64；Map 内部用 sync.Map |
| expvar.Func 和 expvar.Int 的区别？ | Int 存储值（主动更新）；Func 每次请求时调用（动态计算，如 goroutine 数量）|
| expvar 适合生产环境用于监控吗？ | 适合内部轻量调试；生产监控推荐 Prometheus（支持拉取、告警、多维标签）|
| /debug/vars 输出格式是什么？ | JSON，所有 key 按字母排序；每个 value 是对应 Var.String() 的 JSON |
| expvar.Map 的 key 顺序是否稳定？ | 稳定（输出时按 key 排序），便于 diff 比较 |
