---
title: Goroutine 泄漏与线上问题定位
description: Go Goroutine 泄漏排查（常见模式与 context 修复）、线上问题定位四步法（指标→日志→Trace→Profile）。
head:
  - - meta
    - name: keywords
      content: Goroutine泄漏,context取消,线上排障,pprof goroutine,运行时自检,OpenTelemetry
---

# Goroutine 泄漏与线上问题定位

## 10. Goroutine 泄漏排查

Goroutine 泄漏是 Go 程序最常见的资源泄漏类型，表现为 goroutine 数量持续增长，最终导致内存耗尽或程序卡死。

### 常见泄漏模式

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

// 泄漏 1：向无人接收的 channel 发送
func leakBySend() {
	ch := make(chan int)
	go func() {
		ch <- 42 // 永远阻塞，因为没人读
	}()
	// 没有 <-ch
}

// 泄漏 2：从无人发送的 channel 接收
func leakByRecv() {
	ch := make(chan int)
	go func() {
		<-ch // 永远阻塞，因为没人写
	}()
	// 没有 ch <- value
}

// 泄漏 3：忘记关闭的 channel range
func leakByRange() {
	ch := make(chan int)
	go func() {
		for v := range ch { // 永远阻塞，因为 ch 没有被 close
			_ = v
		}
	}()
	ch <- 1
	// 缺少 close(ch)
}

// 泄漏 4：没有退出条件的 goroutine
func leakByInfiniteLoop() {
	go func() {
		for {
			time.Sleep(time.Second) // 永远不退出
		}
	}()
}

func main() {
	fmt.Println("before:", runtime.NumGoroutine())

	for i := 0; i < 100; i++ {
		leakBySend()
		leakByRecv()
	}

	time.Sleep(time.Second)
	fmt.Println("after:", runtime.NumGoroutine()) // 远大于 before
}
```

<GoPerformanceDiagram kind="goroutine-leak-patterns" />

### 修复方式：使用 context 控制退出

```go
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func worker(ctx context.Context, ch chan int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Println("worker exiting")
			return
		case val, ok := <-ch:
			if !ok {
				return
			}
			fmt.Println("processing:", val)
		}
	}
}

func main() {
	fmt.Println("goroutines before:", runtime.NumGoroutine())

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	ch := make(chan int)
	go worker(ctx, ch)

	ch <- 1
	ch <- 2

	// 等待超时自动取消
	<-ctx.Done()
	time.Sleep(100 * time.Millisecond) // 等 worker 退出

	fmt.Println("goroutines after:", runtime.NumGoroutine())
}
```

<GoPerformanceDiagram kind="goroutine-context-exit" />

### 线上检测 Goroutine 泄漏

```bash
# 查看当前 goroutine 数量和堆栈
curl http://localhost:6060/debug/pprof/goroutine?debug=1

# 详细堆栈信息（debug=2 显示每个 goroutine 的创建位置）
curl http://localhost:6060/debug/pprof/goroutine?debug=2

# 用 pprof 分析
go tool pprof http://localhost:6060/debug/pprof/goroutine
# (pprof) top    查看哪些函数创建了最多的 goroutine
# (pprof) traces 查看完整调用栈
```

### 讲解重点

- **四种常见原因**：（1）向/从无缓冲 channel 发送/接收但对端已退出；（2）忘记 close channel 导致 range 永远阻塞；（3）没有退出条件的后台 goroutine；（4）忘记取消 context 导致下游 goroutine 挂起。
- **debug=2 是利器**：`/debug/pprof/goroutine?debug=2` 会显示每个 goroutine 的完整堆栈和阻塞时间。如果看到大量 goroutine 阻塞在同一行代码且持续时间很长，基本就是泄漏点。
- **监控先行**：在指标系统中监控 `runtime.NumGoroutine()`，设置告警阈值。goroutine 数量持续上升且不回落就是泄漏信号，不要等到 OOM 才发现。

---

## 11. 线上问题定位思路

线上问题排查需要系统化的方法论，避免盲目猜测。核心是"指标发现 -> 日志定位 -> Trace 还原 -> Profile 确认"的四步法。

### 排障流程

```
指标告警触发
    │
    ▼
确认问题类型（CPU / 内存 / 延迟 / 错误率）
    │
    ▼
查看监控大盘，确认影响范围和时间线
    │
    ▼
根据问题类型选择工具
    ├── CPU 高      → pprof CPU profile
    ├── 内存上涨    → pprof heap profile
    ├── 延迟抖动    → trace + 慢请求日志
    ├── 错误率上升  → 错误日志 + 下游健康检查
    └── goroutine 堆积 → pprof goroutine profile
    │
    ▼
结合业务代码和请求场景分析根因
    │
    ▼
修复 → 验证 → 复盘
```

<GoPerformanceDiagram kind="incident-workflow" />

### 运行时自检工具

```go
package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"runtime/debug"
	"time"
)

type RuntimeStats struct {
	Goroutines   int    `json:"goroutines"`
	HeapAllocMB  uint64 `json:"heap_alloc_mb"`
	HeapSysMB    uint64 `json:"heap_sys_mb"`
	NumGC        uint32 `json:"num_gc"`
	LastGCPause  string `json:"last_gc_pause"`
	GoVersion    string `json:"go_version"`
	NumCPU       int    `json:"num_cpu"`
}

func runtimeHandler(w http.ResponseWriter, r *http.Request) {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	var gcStats debug.GCStats
	debug.ReadGCStats(&gcStats)

	lastPause := "N/A"
	if len(gcStats.Pause) > 0 {
		lastPause = gcStats.Pause[0].String()
	}

	stats := RuntimeStats{
		Goroutines:  runtime.NumGoroutine(),
		HeapAllocMB: mem.HeapAlloc / 1024 / 1024,
		HeapSysMB:   mem.HeapSys / 1024 / 1024,
		NumGC:       mem.NumGC,
		LastGCPause: lastPause,
		GoVersion:   runtime.Version(),
		NumCPU:      runtime.NumCPU(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	goroutines := runtime.NumGoroutine()
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	status := "healthy"
	issues := []string{}

	if goroutines > 10000 {
		status = "warning"
		issues = append(issues, fmt.Sprintf("goroutine count high: %d", goroutines))
	}
	if mem.HeapAlloc > 1024*1024*1024 { // 1GB
		status = "warning"
		issues = append(issues, fmt.Sprintf("heap usage high: %d MB", mem.HeapAlloc/1024/1024))
	}

	result := map[string]interface{}{
		"status":    status,
		"timestamp": time.Now().Format(time.RFC3339),
		"issues":    issues,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func main() {
	http.HandleFunc("/debug/runtime", runtimeHandler)
	http.HandleFunc("/health", healthHandler)
	fmt.Println("listening on :8080")
	http.ListenAndServe(":8080", nil)
}
```

<GoPerformanceDiagram kind="runtime-selfcheck" />

### 指标/日志/Trace 三件套

```go
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"
)

// 模拟指标上报
type Metrics struct{}

func (m *Metrics) RecordLatency(api string, duration time.Duration) {
	log.Printf("[METRIC] api=%s latency_ms=%d", api, duration.Milliseconds())
}

func (m *Metrics) RecordError(api string, err error) {
	log.Printf("[METRIC] api=%s error=%v", api, err)
}

// 模拟结构化日志
func logWithTrace(ctx context.Context, level, msg string, fields map[string]interface{}) {
	traceID := ctx.Value("trace_id")
	log.Printf("[%s] trace_id=%v msg=%s fields=%v", level, traceID, msg, fields)
}

// 模拟业务处理
func processOrder(ctx context.Context, metrics *Metrics) error {
	start := time.Now()
	defer func() {
		metrics.RecordLatency("/api/order", time.Since(start))
	}()

	// 阶段 1：参数校验
	logWithTrace(ctx, "INFO", "validating input", nil)

	// 阶段 2：查库
	dbStart := time.Now()
	time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)
	logWithTrace(ctx, "INFO", "db query done", map[string]interface{}{
		"duration_ms": time.Since(dbStart).Milliseconds(),
	})

	// 阶段 3：调下游
	rpcStart := time.Now()
	time.Sleep(time.Duration(rand.Intn(300)) * time.Millisecond)
	rpcDuration := time.Since(rpcStart)
	logWithTrace(ctx, "INFO", "rpc call done", map[string]interface{}{
		"duration_ms": rpcDuration.Milliseconds(),
	})

	if rpcDuration > 200*time.Millisecond {
		logWithTrace(ctx, "WARN", "slow downstream detected", map[string]interface{}{
			"threshold_ms": 200,
			"actual_ms":    rpcDuration.Milliseconds(),
		})
	}

	return nil
}

func main() {
	metrics := &Metrics{}
	ctx := context.WithValue(context.Background(), "trace_id", "abc-123")

	for i := 0; i < 5; i++ {
		if err := processOrder(ctx, metrics); err != nil {
			metrics.RecordError("/api/order", err)
		}
	}

	fmt.Println("done")
}
```

<GoPerformanceDiagram kind="telemetry-triad" />

### 讲解重点

- **先看全局，后看局部**：不要一上来就抓 pprof。先看监控大盘确认问题类型（CPU? 内存? 延迟?），再确认影响范围（全部实例还是单个？持续还是间歇？），然后才有针对性地用工具。
- **指标/日志/Trace 三位一体**：指标（Metrics）告诉你"出了什么问题"，日志（Logs）告诉你"问题的细节"，链路追踪（Trace）告诉你"问题发生在哪个环节"。三者通过 Trace ID 关联。生产环境建议使用 OpenTelemetry 统一采集。
- **复盘比修复更重要**：每次线上事故修复后，做一次复盘：根因是什么？为什么没提前发现？需要补什么监控或告警？形成文档沉淀，避免同类问题再次发生。

> 完整的 pprof 排障实操流程，参考 [Pprof 排障指南](../pprof-troubleshooting-guide.md)
