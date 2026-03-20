---
title: runtime/trace 源码精读
description: 精读 runtime/trace 的执行追踪机制，掌握 goroutine 调度可视化、GC 停顿分析与生产环境低开销追踪实践。
---

# runtime/trace：执行追踪源码精读

> 核心源码：`src/runtime/trace.go`、`src/cmd/trace`
>
> 图例参考：复用 [Pprof、Trace 与 Benchmark](../07-pprof-trace-and-benchmark.md) 里的 Trace 时间线图，把调度、阻塞、GC 事件先看成时序，再回头读 `runtime/trace` 的事件落盘流程。

## 包结构图

<GoPerformanceDiagram kind="trace-timeline" />

```
runtime/trace 追踪体系
══════════════════════════════════════════════════════════════════

  trace.Start(w) ──► 开始将追踪事件写入 w (io.Writer)
       │
       │  记录的事件类型
       ├── goroutine 生命周期：GoCreate / GoStart / GoEnd / GoBlock
       ├── 系统调用：GoSysCall / GoSysExit / GoSysBlock
       ├── GC 事件：GCStart / GCDone / GCSTWStart / GCSTWDone
       ├── 网络事件：GoBlockNet / GoUnblockNet
       ├── 同步原语：GoBlockSync / GoBlockSelect / GoBlockCond
       └── 用户自定义：log(taskID, category, message)
                       region(task, "region name")
                       task(ctx, "task name")

  trace.Stop() ──► 停止追踪，刷新 buffer

  分析工具：
  ├── go tool trace <trace.out>  ← 浏览器可视化 UI
  ├── gotraceui（第三方，更现代的 UI）
  └── trace.NewReader() (Go 1.22+) ← 编程式解析

  核心数据结构：
  ┌──────────────────────────────────────────────────┐
  │  traceEvent { typ, ts(纳秒), args... }           │
  │  traceReader  ← 无锁环形 buffer（per-P）         │
  │  traceStack   ← 复用的栈快照                      │
  └──────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心 API

```go
// runtime/trace 包
import "runtime/trace"

// 1. 全局追踪
trace.Start(w io.Writer) error  // 开始写追踪数据
trace.Stop()                     // 停止追踪

// 2. 任务追踪（关联多个相关操作）
ctx, task := trace.NewTask(ctx, "processOrder")
defer task.End()

// 3. 区域追踪（标记关键代码段）
defer trace.StartRegion(ctx, "encryptData").End()

// 4. 用户日志（嵌入时间戳和 goroutine 信息）
trace.Log(ctx, "category", "message")
trace.Logf(ctx, "db", "query took %v", dur)
```

---

## 二、代码示例

### 基础：将追踪写入文件

```go
import (
    "os"
    "runtime/trace"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()

    // 开始追踪
    trace.Start(f)
    defer trace.Stop()

    // ... 业务代码 ...
    processOrders()
}

// 分析：go tool trace trace.out
```

### HTTP 处理器中的追踪

```go
import (
    "net/http"
    "runtime/trace"
)

func handler(w http.ResponseWriter, r *http.Request) {
    // 为每个请求创建 task（在 trace UI 中可按 task 筛选）
    ctx, task := trace.NewTask(r.Context(), "handleRequest")
    defer task.End()

    // 标记子阶段
    region := trace.StartRegion(ctx, "parseBody")
    body := parseBody(r)
    region.End()

    region2 := trace.StartRegion(ctx, "dbQuery")
    result := queryDB(ctx, body)
    region2.End()

    trace.Log(ctx, "result", fmt.Sprintf("rows=%d", len(result)))
    json.NewEncoder(w).Encode(result)
}
```

### 生产环境：定时采样（低开销）

```go
// 每隔 5 分钟采集 10 秒追踪，不持续开启
func startPeriodicTrace(dir string) {
    go func() {
        for {
            time.Sleep(5 * time.Minute)
            collectTrace(dir, 10*time.Second)
        }
    }()
}

func collectTrace(dir string, dur time.Duration) {
    name := filepath.Join(dir, fmt.Sprintf("trace-%s.out",
        time.Now().Format("20060102-150405")))
    f, err := os.Create(name)
    if err != nil {
        return
    }
    defer f.Close()

    trace.Start(f)
    time.Sleep(dur)
    trace.Stop()
    log.Printf("trace saved: %s", name)
}
```

### HTTP 端点触发追踪（诊断工具）

```go
// 注册调试端点：curl localhost:8080/debug/trace?seconds=5 > trace.out
import _ "net/http/pprof" // 同步引入 pprof

func registerTraceHandler() {
    http.HandleFunc("/debug/trace", func(w http.ResponseWriter, r *http.Request) {
        seconds := 5
        if s := r.URL.Query().Get("seconds"); s != "" {
            fmt.Sscanf(s, "%d", &seconds)
        }
        if seconds > 30 {
            seconds = 30 // 限制最长追踪时间
        }

        w.Header().Set("Content-Type", "application/octet-stream")
        w.Header().Set("Content-Disposition", "attachment; filename=trace.out")

        if err := trace.Start(w); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }
        time.Sleep(time.Duration(seconds) * time.Second)
        trace.Stop()
    })
}
```

### 编程式解析（Go 1.22+）

```go
import (
    "golang.org/x/exp/trace"  // 实验性包
)

// 统计各 goroutine 的调度延迟（从 runnable → running 的等待时间）
func analyzeSchedulingLatency(traceFile string) {
    f, _ := os.Open(traceFile)
    defer f.Close()

    r, _ := trace.NewReader(f)
    var latencies []time.Duration

    for {
        ev, err := r.ReadEvent()
        if err != nil {
            break
        }
        if ev.Kind() == trace.EventStateTransition {
            tr := ev.StateTransition()
            if tr.Resource.Kind == trace.ResourceGoroutine {
                // GoRunnable → GoRunning 的延迟
                if tr.Old == trace.GoRunnable && tr.New == trace.GoRunning {
                    latencies = append(latencies, ev.Time().Sub(tr.OldTime))
                }
            }
        }
    }

    if len(latencies) > 0 {
        var total time.Duration
        for _, l := range latencies {
            total += l
        }
        fmt.Printf("调度延迟 P99: %v, 平均: %v\n",
            percentile(latencies, 99), total/time.Duration(len(latencies)))
    }
}
```

### 与 pprof 结合使用

```go
// trace 和 pprof 互补：
// - pprof: 统计 CPU/内存热点（聚合视图）
// - trace: 展示时间线上的调度行为（时序视图）

func diagnose() {
    // 同时采集，从不同维度分析
    go func() {
        f, _ := os.Create("cpu.pprof")
        pprof.StartCPUProfile(f)
        time.Sleep(30 * time.Second)
        pprof.StopCPUProfile()
        f.Close()
    }()

    f, _ := os.Create("trace.out")
    trace.Start(f)
    time.Sleep(10 * time.Second) // trace 开销更大，采集更短
    trace.Stop()
    f.Close()
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| trace 和 pprof 的区别？ | pprof 是采样聚合（不精确但低开销）；trace 是全量事件记录（精确但开销较高，约 5-15%） |
| trace 如何标记业务逻辑？ | `trace.NewTask` 创建任务，`trace.StartRegion` 标记阶段，`trace.Log` 插入日志；在 UI 中可按 task 筛选 |
| 生产环境能持续开启 trace 吗？ | 不建议。应定时采样（如每 5 分钟采 10 秒）或按需触发（HTTP 端点） |
| trace 的事件存储在哪？ | per-P 的无锁环形 buffer，避免多 goroutine 争用；Stop 时刷入 io.Writer |
| GC 停顿分析用 trace 还是 pprof？ | trace —— UI 中 GCSTWStart/GCSTWDone 事件直接显示停顿时间线，pprof 无法体现 STW |
| `go tool trace` 最有价值的视图？ | Goroutine analysis（阻塞原因分布）、Scheduler latency（调度延迟）、Network blocking（网络等待） |
