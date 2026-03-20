---
title: Pprof、Trace 与 Benchmark
description: Go 性能分析工具链：CPU/内存 Pprof、runtime/trace 事件追踪、Benchmark 性能测试与 benchstat 对比。
head:
  - - meta
    - name: keywords
      content: Go pprof,CPU Profile,内存分析,trace,Benchmark,benchstat,火焰图
---

# Pprof、Trace 与 Benchmark

## 1. Pprof CPU 分析

CPU Profile 是定位"程序到底在哪儿花时间"的核心手段。Go 内置了 `runtime/pprof`（命令行程序）和 `net/http/pprof`（HTTP 服务）两种接入方式。

### 命令行程序采集

```go
package main

import (
	"os"
	"runtime/pprof"
	"log"
)

func hotFunction() {
	sum := 0
	for i := 0; i < 1e8; i++ {
		sum += i
	}
}

func main() {
	f, err := os.Create("cpu.prof")
	if err != nil {
		log.Fatal(err)
	}
	defer f.Close()

	// 开始 CPU 采样
	if err := pprof.StartCPUProfile(f); err != nil {
		log.Fatal(err)
	}
	defer pprof.StopCPUProfile()

	hotFunction()
}
```

### HTTP 服务采集

```go
package main

import (
	"net/http"
	_ "net/http/pprof" // 自动注册 /debug/pprof 路由
	"log"
)

func main() {
	// 业务路由省略...
	log.Println("pprof listening on :6060")
	log.Fatal(http.ListenAndServe(":6060", nil))
}
```

### 常用命令

```bash
# 采集 30 秒 CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 交互模式常用命令
# top        查看 CPU 占比最高的函数
# list func  查看具体函数的逐行耗时
# web        生成调用图（需安装 graphviz）

# 直接生成火焰图（Go 1.22+）
go tool pprof -http=:8080 cpu.prof
```

<GoPerformanceDiagram kind="cpu-pprof" />

### 讲解重点

- **采样原理**：Go 的 CPU Profile 默认每秒采样 100 次（每 10ms 一次），记录当时所有 goroutine 的调用栈。采样率可通过 `runtime.SetCPUProfileRate` 调整，但通常默认值即可。
- **flat vs cum**：`flat` 是函数自身直接花费的时间，`cum`（cumulative）是函数及其所有子调用的总时间。排查时先看 `cum` 找到热路径，再看 `flat` 找到真正的耗时点。
- **火焰图阅读**：横轴是 CPU 占比（越宽越耗时），纵轴是调用栈深度。从下往上是调用链，找最宽的"平顶"就是优化目标。

---

## 2. Pprof 内存分析

内存 Profile 帮助回答"内存被谁分配了"和"内存被谁持有"两个问题。

### 采集与分析

```go
package main

import (
	"fmt"
	"os"
	"runtime"
	"runtime/pprof"
)

func allocateSlices() [][]byte {
	var result [][]byte
	for i := 0; i < 10000; i++ {
		buf := make([]byte, 1024) // 每次分配 1KB
		result = append(result, buf)
	}
	return result
}

func main() {
	data := allocateSlices()

	// 强制 GC 以获取准确的 inuse 数据
	runtime.GC()

	f, _ := os.Create("mem.prof")
	defer f.Close()
	pprof.WriteHeapProfile(f)

	fmt.Println("total slices:", len(data))
}
```

### 常用命令

```bash
# 查看当前在用对象（定位内存泄漏）
go tool pprof -inuse_space mem.prof

# 查看累计分配对象（定位分配热点）
go tool pprof -alloc_objects mem.prof

# HTTP 方式采集
go tool pprof http://localhost:6060/debug/pprof/heap

# 对比两个时间点的 heap，找增长点
go tool pprof -base heap1.prof heap2.prof
```

<GoPerformanceDiagram kind="heap-profile" />

### 讲解重点

- **四种视角**：`inuse_space`（当前占用字节）、`inuse_objects`（当前占用对象数）、`alloc_space`（累计分配字节）、`alloc_objects`（累计分配对象数）。排查泄漏看 `inuse`，优化分配频率看 `alloc`。
- **差异对比是关键**：单次 heap profile 很难判断是否泄漏，对比两个时间点的 profile（`-base` 参数）才能看到持续增长的分配路径。
- **MemProfileRate**：Go 默认每分配 512KB 采样一次（`runtime.MemProfileRate = 524288`）。如果需要更精确的小对象追踪，可以调小该值，但会增加开销。

> 完整的内存排障流程参考 [Pprof 排障指南](../pprof-troubleshooting-guide.md)

---

## 3. Trace 跟踪

`runtime/trace` 提供比 pprof 更细粒度的运行时事件追踪，可以看到 goroutine 的调度、阻塞、网络 IO、GC 等事件的时间线。

### 采集 Trace

```go
package main

import (
	"context"
	"fmt"
	"os"
	"runtime/trace"
	"sync"
)

func work(ctx context.Context, id int) {
	// 用 trace.WithRegion 标注业务区间
	trace.WithRegion(ctx, fmt.Sprintf("worker-%d", id), func() {
		sum := 0
		for i := 0; i < 1e7; i++ {
			sum += i
		}
	})
}

func main() {
	f, _ := os.Create("trace.out")
	defer f.Close()

	trace.Start(f)
	defer trace.Stop()

	ctx := context.Background()

	// 用 trace.NewTask 标注一个逻辑任务
	ctx, task := trace.NewTask(ctx, "batch-process")
	defer task.End()

	var wg sync.WaitGroup
	for i := 0; i < 4; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			work(ctx, id)
		}(i)
	}
	wg.Wait()
}
```

### HTTP 服务采集

```bash
# 采集 5 秒的 trace
curl -o trace.out http://localhost:6060/debug/pprof/trace?seconds=5

# 用浏览器打开 trace 可视化
go tool trace trace.out
```

<GoPerformanceDiagram kind="trace-timeline" />

### 讲解重点

- **Trace vs Pprof**：Pprof 是统计采样，告诉你"总共花了多少时间"；Trace 是事件记录，告诉你"每一刻发生了什么"。Trace 适合排查延迟抖动、调度延迟、GC 停顿等时序相关问题。
- **Goroutine 分析视图**：`go tool trace` 打开后，重点关注 Goroutine Analysis 页面，可以看到每个 goroutine 在执行、等待网络、等待同步、等待调度等状态各花了多少时间。
- **性能开销**：Trace 的开销远大于 Pprof（通常 10-20% 性能影响），线上环境只在排障时短时间开启，不要常驻。

---

## 4. Benchmark 性能测试

Go 内置的 benchmark 框架是性能优化的基础工具，可以量化优化前后的差异。

### 基本用法

```go
// fib_test.go
package main

import "testing"

func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}

func BenchmarkFib10(b *testing.B) {
	for i := 0; i < b.N; i++ {
		fib(10)
	}
}

func BenchmarkFib20(b *testing.B) {
	for i := 0; i < b.N; i++ {
		fib(20)
	}
}

// 子基准测试，批量对比不同参数
func BenchmarkFib(b *testing.B) {
	cases := []struct {
		name string
		n    int
	}{
		{"Fib5", 5},
		{"Fib10", 10},
		{"Fib20", 20},
	}
	for _, tc := range cases {
		b.Run(tc.name, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				fib(tc.n)
			}
		})
	}
}
```

### 内存分配统计

```go
func BenchmarkStringConcat(b *testing.B) {
	b.ReportAllocs() // 报告每次操作的内存分配次数和字节数
	for i := 0; i < b.N; i++ {
		s := ""
		for j := 0; j < 100; j++ {
			s += "x"
		}
	}
}
```

### 常用命令

```bash
# 运行所有 benchmark
go test -bench=. -benchmem ./...

# 只运行匹配的 benchmark，跑 5 秒
go test -bench=BenchmarkFib10 -benchtime=5s .

# 保存结果用于对比
go test -bench=. -count=5 . > old.txt
# （优化代码后）
go test -bench=. -count=5 . > new.txt

# 用 benchstat 对比（需安装：go install golang.org/x/perf/cmd/benchstat@latest）
benchstat old.txt new.txt
```

<GoPerformanceDiagram kind="benchmark-benchstat" />

### 讲解重点

- **b.N 的含义**：框架会自动调整 `b.N` 的值，直到测试运行足够长的时间（默认 1 秒）以获得稳定的结果。不要手动设置循环次数。
- **b.ResetTimer**：如果 benchmark 函数有昂贵的初始化逻辑（如构造测试数据），在初始化之后调用 `b.ResetTimer()` 重置计时器，避免初始化时间被计入结果。
- **benchstat 对比**：单次 benchmark 结果有波动，建议用 `-count=5` 跑多次，再用 `benchstat` 做统计对比，它会给出均值、变化百分比和置信度。
