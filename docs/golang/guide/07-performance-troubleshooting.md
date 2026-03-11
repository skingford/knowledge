---
title: 性能优化与排障
description: Go 性能优化与排障专题，系统整理 pprof、trace、内存、CPU 与线上问题定位方法。
search: false
---

# 性能优化与排障

## 适合人群

- 需要系统掌握 Go 性能分析工具链的工程师
- 线上服务出现 CPU 飙高、内存泄漏、延迟抖动等问题需要快速定位的开发者
- 希望在面试中能完整讲清性能排障思路的候选人

## 学习目标

- 熟练使用 pprof、trace、benchmark 等工具定位性能瓶颈
- 掌握 GC 调优、内存分配优化、对象池等实战技巧
- 建立从指标异常到根因定位的系统化排障思路

## 快速导航

- [1. Pprof CPU 分析](#_1-pprof-cpu-分析)
- [2. Pprof 内存分析](#_2-pprof-内存分析)
- [3. Trace 跟踪](#_3-trace-跟踪)
- [4. Benchmark 性能测试](#_4-benchmark-性能测试)
- [5. GC 调优](#_5-gc-调优)
- [6. 减少内存分配](#_6-减少内存分配)
- [7. 对象池 sync.Pool](#_7-对象池-sync-pool)
- [8. 锁竞争分析](#_8-锁竞争分析)
- [9. 接口慢请求排查](#_9-接口慢请求排查)
- [10. Goroutine 泄漏排查](#_10-goroutine-泄漏排查)
- [11. 线上问题定位思路](#_11-线上问题定位思路)

> 更详细的 pprof 排障实操流程，参考 [Pprof 排障指南](../pprof-troubleshooting-guide.md)

---

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

### 讲解重点

- **b.N 的含义**：框架会自动调整 `b.N` 的值，直到测试运行足够长的时间（默认 1 秒）以获得稳定的结果。不要手动设置循环次数。
- **b.ResetTimer**：如果 benchmark 函数有昂贵的初始化逻辑（如构造测试数据），在初始化之后调用 `b.ResetTimer()` 重置计时器，避免初始化时间被计入结果。
- **benchstat 对比**：单次 benchmark 结果有波动，建议用 `-count=5` 跑多次，再用 `benchstat` 做统计对比，它会给出均值、变化百分比和置信度。

---

## 5. GC 调优

Go 的 GC 是并发标记清除，理解其调优参数可以在吞吐量和内存占用之间找到平衡。

### 关键环境变量

```bash
# GOGC：控制 GC 触发频率，默认 100（堆增长 100% 时触发 GC）
# 设为 200 表示堆增长到 2 倍时才 GC，减少 GC 频率但增加内存占用
GOGC=200 ./myapp

# GOMEMLIMIT（Go 1.19+）：设置内存软上限
# 配合 GOGC=off 使用，只在接近上限时触发 GC
GOMEMLIMIT=1GiB GOGC=off ./myapp

# 查看 GC 详细日志
GODEBUG=gctrace=1 ./myapp
```

### 代码层面观察 GC

```go
package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"time"
)

func printGCStats() {
	var stats debug.GCStats
	debug.ReadGCStats(&stats)
	fmt.Printf("GC 次数: %d\n", stats.NumGC)
	fmt.Printf("最近一次 GC 停顿: %v\n", stats.PauseTotal)

	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)
	fmt.Printf("堆已分配: %d MB\n", mem.HeapAlloc/1024/1024)
	fmt.Printf("堆系统占用: %d MB\n", mem.HeapSys/1024/1024)
	fmt.Printf("GC 总次数: %d\n", mem.NumGC)
}

func main() {
	// 设置 GOGC
	debug.SetGCPercent(200)

	// 设置内存上限（Go 1.19+）
	debug.SetMemoryLimit(512 * 1024 * 1024) // 512MB

	// 模拟内存分配
	var data [][]byte
	for i := 0; i < 100; i++ {
		data = append(data, make([]byte, 1024*1024)) // 每次 1MB
		time.Sleep(10 * time.Millisecond)
	}

	printGCStats()
	_ = data
}
```

### gctrace 输出解读

```bash
# GODEBUG=gctrace=1 的输出格式：
# gc 1 @0.012s 2%: 0.034+1.3+0.040 ms clock, 0.27+0.60/1.1/0+0.32 ms cpu, 4->4->1 MB, 5 MB goal, 8 P
#
# gc 1       : 第 1 次 GC
# @0.012s    : 程序启动后 0.012 秒
# 2%         : GC 占程序总时间的比例
# 4->4->1 MB : GC 开始时堆大小 -> GC 结束时堆大小 -> 存活对象大小
# 5 MB goal  : 下次触发 GC 的堆目标大小
# 8 P        : 使用的 P（processor）数量
```

### 讲解重点

- **GOGC vs GOMEMLIMIT**：`GOGC` 按比例控制，适合通用场景；`GOMEMLIMIT` 按绝对值控制，适合容器环境（已知内存上限）。两者组合使用效果最佳：`GOGC=off` + `GOMEMLIMIT=容器内存的70-80%`。
- **GC 压力的判断**：如果 `gctrace` 显示 GC 占比超过 5%，或 GC 频率高于每秒 10 次，说明 GC 压力过大，需要优化分配或调整参数。
- **减少 GC 压力的根本方法**：调参只是治标，减少堆内存分配才是治本。优先从减少临时对象分配入手（见第 6、7 节）。

---

## 6. 减少内存分配

减少堆内存分配是提升 Go 程序性能最有效的手段之一。

### 逃逸分析

```go
package main

import "fmt"

// 不逃逸：x 分配在栈上
func noEscape() int {
	x := 42
	return x
}

// 逃逸：返回局部变量的指针，x 必须分配在堆上
func escapeToHeap() *int {
	x := 42
	return &x
}

// 逃逸：传给 interface{} 参数，编译器无法确定生命周期
func escapeViaInterface() {
	x := 42
	fmt.Println(x) // x 逃逸，因为 Println 接收 interface{}
}

func main() {
	_ = noEscape()
	_ = escapeToHeap()
	escapeViaInterface()
}
```

```bash
# 查看逃逸分析结果
go build -gcflags="-m" main.go

# 更详细的分析
go build -gcflags="-m -m" main.go
```

### strings.Builder 替代字符串拼接

```go
package main

import (
	"fmt"
	"strings"
)

// 差：每次拼接都分配新字符串
func concatBad(items []string) string {
	result := ""
	for _, item := range items {
		result += item + ","
	}
	return result
}

// 好：Builder 内部维护 []byte，减少分配
func concatGood(items []string) string {
	var b strings.Builder
	// 预分配容量
	b.Grow(len(items) * 10)
	for i, item := range items {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(item)
	}
	return b.String()
}

func main() {
	items := []string{"apple", "banana", "cherry", "date", "elderberry"}
	fmt.Println(concatBad(items))
	fmt.Println(concatGood(items))
}
```

### 预分配 Slice 和 Map

```go
package main

import "fmt"

// 差：反复扩容，每次扩容都要复制和分配
func buildSliceBad(n int) []int {
	var s []int
	for i := 0; i < n; i++ {
		s = append(s, i)
	}
	return s
}

// 好：一次性分配足够容量
func buildSliceGood(n int) []int {
	s := make([]int, 0, n)
	for i := 0; i < n; i++ {
		s = append(s, i)
	}
	return s
}

// Map 同理
func buildMapGood(n int) map[string]int {
	m := make(map[string]int, n) // 预分配
	for i := 0; i < n; i++ {
		m[fmt.Sprintf("key%d", i)] = i
	}
	return m
}

func main() {
	fmt.Println(len(buildSliceBad(1000)))
	fmt.Println(len(buildSliceGood(1000)))
	fmt.Println(len(buildMapGood(1000)))
}
```

### 避免不必要的 []byte 与 string 转换

```go
package main

import (
	"bytes"
	"fmt"
)

// 差：反复在 []byte 和 string 之间转换，每次都分配
func processBad(data []byte) string {
	s := string(data)           // 分配
	upper := []byte(s)          // 又分配
	for i, b := range upper {
		if b >= 'a' && b <= 'z' {
			upper[i] = b - 32
		}
	}
	return string(upper)        // 再分配
}

// 好：直接操作 []byte
func processGood(data []byte) []byte {
	result := make([]byte, len(data))
	copy(result, data)
	for i, b := range result {
		if b >= 'a' && b <= 'z' {
			result[i] = b - 32
		}
	}
	return result
}

func main() {
	data := []byte("hello world")
	fmt.Println(processBad(data))
	fmt.Println(string(processGood(data)))
}
```

### 讲解重点

- **逃逸 = 堆分配 = GC 压力**：Go 编译器通过逃逸分析决定变量分配在栈还是堆上。栈分配几乎零成本（函数返回自动回收），堆分配需要 GC 参与。用 `-gcflags="-m"` 检查关键路径上的逃逸。
- **预分配是最简单的优化**：如果能估算 slice 或 map 的大小，用 `make([]T, 0, n)` 或 `make(map[K]V, n)` 预分配。这在高频调用路径上效果显著。
- **避免 interface{} 导致的隐式逃逸**：将值传给 `interface{}` 类型参数时（如 `fmt.Println`、`log.Printf`），值通常会逃逸到堆上。在热路径上考虑用类型安全的替代方案。

---

## 7. 对象池 sync.Pool

`sync.Pool` 是标准库提供的临时对象池，适合复用频繁创建和销毁的临时对象，减少 GC 压力。

### 基本用法

```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

var bufferPool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

func processRequest(data string) string {
	// 从池中获取
	buf := bufferPool.Get().(*bytes.Buffer)
	defer func() {
		buf.Reset() // 清空内容再放回，避免数据泄漏
		bufferPool.Put(buf)
	}()

	buf.WriteString("processed: ")
	buf.WriteString(data)
	return buf.String()
}

func main() {
	results := make([]string, 10)
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			results[id] = processRequest(fmt.Sprintf("request-%d", id))
		}(i)
	}
	wg.Wait()
	for _, r := range results {
		fmt.Println(r)
	}
}
```

### Benchmark 对比

```go
// pool_test.go
package main

import (
	"bytes"
	"sync"
	"testing"
)

var pool = sync.Pool{
	New: func() interface{} {
		return new(bytes.Buffer)
	},
}

func BenchmarkWithoutPool(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := new(bytes.Buffer)
		buf.WriteString("hello world")
		_ = buf.String()
	}
}

func BenchmarkWithPool(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		buf := pool.Get().(*bytes.Buffer)
		buf.WriteString("hello world")
		_ = buf.String()
		buf.Reset()
		pool.Put(buf)
	}
}
```

### 讲解重点

- **Pool 不是缓存**：`sync.Pool` 中的对象随时可能被 GC 回收（每次 GC 都会清空 Pool）。不要依赖 Pool 保留对象，它只是"可能复用"的优化手段。
- **放回前必须重置**：从 Pool 取出的对象可能包含上次使用的数据。放回前务必调用 `Reset()` 或手动清零，否则会导致数据泄漏或逻辑错误。
- **适用场景**：高频创建且生命周期短的对象，如 `bytes.Buffer`、编解码器、临时切片等。对于生命周期长或创建频率低的对象，Pool 没有意义。

---

## 8. 锁竞争分析

当多个 goroutine 频繁竞争同一把锁时，程序的并发性能会严重下降。Go 提供了 mutex profile 来定位锁竞争热点。

### 开启 Mutex Profile

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"sync"
)

func main() {
	// 开启 mutex profile，采样比例 1（全采样）
	runtime.SetMutexProfileFraction(1)

	var mu sync.Mutex
	counter := 0

	// 模拟高并发锁竞争
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 10000; j++ {
				mu.Lock()
				counter++
				mu.Unlock()
			}
		}()
	}

	go func() {
		fmt.Println("pprof on :6060")
		http.ListenAndServe(":6060", nil)
	}()

	wg.Wait()
	fmt.Println("counter:", counter)
}
```

### 分析锁竞争

```bash
# 采集 mutex profile
go tool pprof http://localhost:6060/debug/pprof/mutex

# 交互模式下查看竞争热点
# (pprof) top
# (pprof) list funcName
```

### 分片降低锁粒度

```go
package main

import (
	"fmt"
	"hash/fnv"
	"sync"
)

const shardCount = 32

type ShardedMap struct {
	shards [shardCount]struct {
		sync.RWMutex
		data map[string]interface{}
	}
}

func NewShardedMap() *ShardedMap {
	m := &ShardedMap{}
	for i := range m.shards {
		m.shards[i].data = make(map[string]interface{})
	}
	return m
}

func (m *ShardedMap) getShard(key string) int {
	h := fnv.New32a()
	h.Write([]byte(key))
	return int(h.Sum32()) % shardCount
}

func (m *ShardedMap) Set(key string, val interface{}) {
	idx := m.getShard(key)
	m.shards[idx].Lock()
	m.shards[idx].data[key] = val
	m.shards[idx].Unlock()
}

func (m *ShardedMap) Get(key string) (interface{}, bool) {
	idx := m.getShard(key)
	m.shards[idx].RLock()
	val, ok := m.shards[idx].data[key]
	m.shards[idx].RUnlock()
	return val, ok
}

func main() {
	m := NewShardedMap()
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			key := fmt.Sprintf("key-%d", id)
			m.Set(key, id)
			val, _ := m.Get(key)
			fmt.Println(key, val)
		}(i)
	}
	wg.Wait()
}
```

### 讲解重点

- **SetMutexProfileFraction**：该值控制采样比例。设为 1 表示记录每次锁竞争，线上建议设为 5-10，降低开销。设为 0 关闭采样。
- **降低锁粒度的三个层次**：（1）缩小临界区，锁内只做最小操作；（2）分片，将一把大锁拆成多把小锁；（3）用 `sync/atomic` 或 lock-free 结构替代锁。
- **读写锁的适用条件**：读多写少的场景用 `sync.RWMutex` 替代 `sync.Mutex`，允许多个读并发。但如果写操作频繁，`RWMutex` 可能比 `Mutex` 更差（写锁需要等所有读锁释放）。

---

## 9. 接口慢请求排查

线上服务的慢请求通常涉及多个环节，需要结合 Trace、日志和指标进行关联分析。

### 请求链路追踪中间件

```go
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"
)

type contextKey string

const traceIDKey contextKey = "trace_id"

// 生成 Trace ID 的中间件
func traceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := fmt.Sprintf("trace-%d", rand.Int63())
		ctx := context.WithValue(r.Context(), traceIDKey, traceID)

		start := time.Now()
		next.ServeHTTP(w, r.WithContext(ctx))
		duration := time.Since(start)

		// 记录请求耗时
		log.Printf("[%s] %s %s %v", traceID, r.Method, r.URL.Path, duration)

		// 慢请求告警
		if duration > 500*time.Millisecond {
			log.Printf("[SLOW] [%s] %s took %v", traceID, r.URL.Path, duration)
		}
	})
}

// 模拟业务处理
func handleOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	traceID := ctx.Value(traceIDKey).(string)

	// 模拟数据库查询
	dbStart := time.Now()
	time.Sleep(time.Duration(50+rand.Intn(200)) * time.Millisecond)
	log.Printf("[%s] DB query took %v", traceID, time.Since(dbStart))

	// 模拟下游服务调用
	rpcStart := time.Now()
	time.Sleep(time.Duration(100+rand.Intn(400)) * time.Millisecond)
	log.Printf("[%s] RPC call took %v", traceID, time.Since(rpcStart))

	fmt.Fprintf(w, "order processed, trace: %s", traceID)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/order", handleOrder)
	log.Fatal(http.ListenAndServe(":8080", traceMiddleware(mux)))
}
```

### 分段计时工具

```go
package main

import (
	"fmt"
	"time"
)

// Span 记录一个操作的耗时
type Span struct {
	Name     string
	Duration time.Duration
}

// Timer 收集多个 Span
type Timer struct {
	spans []Span
}

func (t *Timer) Track(name string) func() {
	start := time.Now()
	return func() {
		t.spans = append(t.spans, Span{
			Name:     name,
			Duration: time.Since(start),
		})
	}
}

func (t *Timer) Report() {
	for _, s := range t.spans {
		fmt.Printf("  %-20s %v\n", s.Name, s.Duration)
	}
}

func main() {
	t := &Timer{}

	// 模拟各阶段
	end := t.Track("validate_input")
	time.Sleep(10 * time.Millisecond)
	end()

	end = t.Track("query_db")
	time.Sleep(150 * time.Millisecond)
	end()

	end = t.Track("call_payment")
	time.Sleep(300 * time.Millisecond)
	end()

	end = t.Track("send_notification")
	time.Sleep(50 * time.Millisecond)
	end()

	fmt.Println("Request breakdown:")
	t.Report()
}
```

### 讲解重点

- **Trace ID 是关联一切的线索**：一个请求从入口到数据库、到下游服务，所有日志都带上同一个 Trace ID，排查慢请求时可以快速串联整条链路。生产环境建议使用 OpenTelemetry 等标准方案。
- **分段计时定位瓶颈**：将请求处理拆分为多个阶段（验证、查数据库、调下游、序列化等），各段独立计时。慢请求出现时，日志直接告诉你是哪个阶段慢了。
- **P99 比平均值更重要**：平均耗时可能看不出问题，P99（第 99 百分位）才能暴露尾部延迟。监控系统应同时记录 P50、P95、P99。

---

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

### 讲解重点

- **先看全局，后看局部**：不要一上来就抓 pprof。先看监控大盘确认问题类型（CPU? 内存? 延迟?），再确认影响范围（全部实例还是单个？持续还是间歇？），然后才有针对性地用工具。
- **指标/日志/Trace 三位一体**：指标（Metrics）告诉你"出了什么问题"，日志（Logs）告诉你"问题的细节"，链路追踪（Trace）告诉你"问题发生在哪个环节"。三者通过 Trace ID 关联。生产环境建议使用 OpenTelemetry 统一采集。
- **复盘比修复更重要**：每次线上事故修复后，做一次复盘：根因是什么？为什么没提前发现？需要补什么监控或告警？形成文档沉淀，避免同类问题再次发生。

> 完整的 pprof 排障实操流程，参考 [Pprof 排障指南](../pprof-troubleshooting-guide.md)
