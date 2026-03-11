---
title: Pprof 排障指南
description: Go pprof 排障指南，帮助定位 CPU、内存、锁竞争和 Goroutine 相关性能问题。
search: false
---

# Pprof 排障指南

这一页从接入方式、命令用法、火焰图解读到端到端排障案例，覆盖 Go 性能排查的完整流程。目标是看完之后，拿到任何一个性能问题都能系统地定位和修复。

## 本页内容

- [1. 接入 pprof 的方式](#_1-接入-pprof-的方式)
- [2. 排障流程](#_2-排障流程)
- [3. go tool pprof 交互式命令详解](#_3-go-tool-pprof-交互式命令详解)
- [4. 火焰图解读方法](#_4-火焰图解读方法)
- [5. GODEBUG=gctrace=1 输出解读](#_5-godebuggctrace1-输出解读)
- [6. 常看指标](#_6-常看指标)
- [7. 常见场景](#_7-常见场景)
- [8. 端到端排障案例](#_8-端到端排障案例)
- [9. fgprof：wall-clock profiling](#_9-fgprofwall-clock-profiling)
- [10. 自动化监控与持续 Profiling](#_10-自动化监控与持续-profiling)
- [11. 排查误区](#_11-排查误区)

---

## 1. 接入 pprof 的方式

Go 提供了三种方式接入 pprof，适用于不同的场景。

### 方式一：`net/http/pprof`（适合有 HTTP 服务的场景）

最简单的方式，只需要一行 import，pprof 的所有 HTTP 端点就会自动注册到 `DefaultServeMux`。

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof" // 仅需 import，自动注册 /debug/pprof/ 路由
)

func main() {
	http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello world")
	})

	// pprof 端点已经自动挂载在 DefaultServeMux 上
	// 访问 http://localhost:8080/debug/pprof/ 即可看到所有 profile
	fmt.Println("服务启动: http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
```

!!! warning "安全提示"
    `net/http/pprof` 会将 profile 端点挂载在业务端口上。生产环境中如果业务端口对外暴露，pprof 数据也会暴露，存在信息泄漏风险。

### 方式二：独立端口暴露 pprof（生产环境推荐）

将 pprof 监听在一个独立的内部端口上，与业务端口隔离。这是生产环境的推荐做法。

```go
package main

import (
	"fmt"
	"net/http"
	"net/http/pprof"
)

func main() {
	// 业务路由 —— 使用独立的 ServeMux，不会包含 pprof
	bizMux := http.NewServeMux()
	bizMux.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello world")
	})

	// pprof 路由 —— 监听在独立端口，仅内网可访问
	debugMux := http.NewServeMux()
	debugMux.HandleFunc("/debug/pprof/", pprof.Index)
	debugMux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	debugMux.HandleFunc("/debug/pprof/profile", pprof.Profile)
	debugMux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	debugMux.HandleFunc("/debug/pprof/trace", pprof.Trace)

	// 启动 pprof 服务（仅绑定内网地址）
	go func() {
		fmt.Println("pprof 服务启动: http://127.0.0.1:6060/debug/pprof/")
		http.ListenAndServe("127.0.0.1:6060", debugMux)
	}()

	// 启动业务服务
	fmt.Println("业务服务启动: http://0.0.0.0:8080")
	http.ListenAndServe(":8080", bizMux)
}
```

### 方式三：`runtime/pprof`（适合 CLI 工具和 Benchmark）

对于非 HTTP 服务（CLI 工具、批处理任务），使用 `runtime/pprof` 直接将 profile 数据写入文件。

```go
package main

import (
	"fmt"
	"os"
	"runtime"
	"runtime/pprof"
)

func main() {
	// ---- CPU Profile ----
	cpuFile, _ := os.Create("cpu.prof")
	defer cpuFile.Close()
	pprof.StartCPUProfile(cpuFile)
	defer pprof.StopCPUProfile()

	// 模拟业务逻辑
	result := heavyWork()
	fmt.Println("结果:", result)

	// ---- Heap Profile ----
	heapFile, _ := os.Create("heap.prof")
	defer heapFile.Close()
	runtime.GC() // 先触发 GC，让 heap profile 更准确
	pprof.WriteHeapProfile(heapFile)
}

func heavyWork() int {
	sum := 0
	for i := 0; i < 100000000; i++ {
		sum += i
	}
	return sum
}
```

运行后分析生成的 profile 文件：

```bash
# 分析 CPU profile
go tool pprof cpu.prof

# 分析 Heap profile
go tool pprof heap.prof
```

---

## 2. 排障流程

性能排障不是随便抓个 profile 就看。遵循固定流程，才能避免在错误方向上浪费时间。

### 第一步：确认问题类型

先从监控或现象判断问题属于哪一类：

| 现象 | 问题类型 | 对应 Profile |
|------|---------|-------------|
| CPU 使用率持续 80%+ | CPU 热点 | `profile`（CPU） |
| RSS 内存持续增长不回落 | 内存泄漏 | `heap` |
| 接口延迟抖动、P99 飙升 | 锁竞争 / GC 压力 | `mutex` / `block` |
| Goroutine 数量持续上升 | Goroutine 泄漏 | `goroutine` |
| 服务偶尔卡顿 | 阻塞等待 | `block` / `trace` |

### 第二步：选择对应 Profile 并抓取

```bash
# CPU 分析（默认采样 30 秒）
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 内存分析
go tool pprof http://localhost:6060/debug/pprof/heap

# Goroutine 分析
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 锁竞争分析（需要先在代码中启用：runtime.SetMutexProfileFraction(1)）
go tool pprof http://localhost:6060/debug/pprof/mutex

# 阻塞分析（需要先在代码中启用：runtime.SetBlockProfileRate(1)）
go tool pprof http://localhost:6060/debug/pprof/block
```

!!! tip "启用 Mutex 和 Block Profile"
    Mutex 和 Block profile 默认是关闭的，需要在程序启动时显式开启：

    ```go
    import "runtime"

    func init() {
        runtime.SetMutexProfileFraction(1) // 启用 mutex profile
        runtime.SetBlockProfileRate(1)     // 启用 block profile
    }
    ```

### 第三步：结合业务现场分析

1. **找热点函数**：用 `top` 命令看占比最高的函数
2. **看调用链**：用 `top -cum` 查看累计调用时间，找出真正的源头
3. **看源码**：用 `list funcName` 定位到具体代码行
4. **回到业务验证**：结合请求日志、链路追踪，确认是哪类请求触发了热点

---

## 3. go tool pprof 交互式命令详解

### 启动方式

```bash
# 方式一：直接从 HTTP 端点抓取并进入交互模式
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 方式二：分析已保存的 profile 文件
go tool pprof cpu.prof

# 方式三：可视化 Web UI（推荐，更直观）
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/heap

# 方式四：对比两次 profile（定位回归）
go tool pprof -diff_base old.pb.gz new.pb.gz
```

### 交互模式常用命令

进入交互模式后（出现 `(pprof)` 提示符），以下是最常用的命令：

#### `top` — 查看热点函数

```
(pprof) top
Showing nodes accounting for 4.82s, 89.26% of 5.40s total
Dropped 23 nodes (cum <= 0.03s)
Showing top 10 nodes out of 45
      flat  flat%   sum%        cum   cum%
     1.87s 34.63% 34.63%      1.87s 34.63%  runtime.memmove
     0.87s 16.11% 50.74%      0.87s 16.11%  encoding/json.stateInString
     0.56s 10.37% 61.11%      0.56s 10.37%  encoding/json.(*scanner).eof
     ...
```

- **flat**：函数自身执行时间（不含调用子函数的时间）
- **cum**：函数累计执行时间（含调用子函数的时间）
- `flat` 高说明函数本身是热点；`cum` 高说明函数调用的子函数是热点

#### `top -cum` — 按累计时间排序

```
(pprof) top -cum
```

这个命令能找到"虽然自身不耗时，但触发了大量热点调用"的入口函数，帮助定位问题的源头。

#### `list funcName` — 查看函数源码级耗时

```
(pprof) list handleRequest
Total: 5.40s
ROUTINE ======================== main.handleRequest in /app/main.go
     1.20s      3.80s (flat, cum) 70.37% of Total
         .          .     45:func handleRequest(w http.ResponseWriter, r *http.Request) {
         .      0.20s     46:   data := readBody(r)
     1.20s      3.20s     47:   result := json.Marshal(data) // <-- 热点在这行
         .      0.40s     48:   w.Write(result)
         .          .     49:}
```

这是最有价值的命令：直接告诉你哪一行代码最耗时。

#### `peek funcName` — 查看函数的上下游调用

```
(pprof) peek handleRequest
```

显示谁调用了这个函数（caller），以及这个函数又调用了谁（callee）。

#### `tree` — 以树形结构显示调用关系

```
(pprof) tree
```

#### `web` — 在浏览器中打开调用图

```
(pprof) web
```

需要安装 `graphviz`。macOS 上可以用 `brew install graphviz`。

#### `svg` — 导出 SVG 格式的调用图

```
(pprof) svg
Generating report in profile001.svg
```

### Web UI 模式（推荐）

```bash
go tool pprof -http=:8080 http://localhost:6060/debug/pprof/heap
```

打开浏览器访问 `http://localhost:8080`，Web UI 提供以下视图：

- **Top**：热点函数列表
- **Graph**：调用关系图
- **Flame Graph**：火焰图（最直观）
- **Peek**：上下游调用分析
- **Source**：源码级耗时标注

### 对比两次 Profile

当你做了一次优化想验证效果，或者想找出性能回归的原因时，可以用 `diff_base`：

```bash
# 先分别保存优化前后的 profile
curl -o before.pb.gz http://localhost:6060/debug/pprof/heap
# ... 部署优化后的代码 ...
curl -o after.pb.gz http://localhost:6060/debug/pprof/heap

# 对比分析
go tool pprof -diff_base before.pb.gz after.pb.gz
```

在对比模式下，正数表示"变差了"，负数表示"改善了"。

---

## 4. 火焰图解读方法

火焰图（Flame Graph）是性能分析中最直观的可视化方式。

### 如何阅读火焰图

```
┌──────────────────────────────────────────────────────────┐
│                      main.main                           │  ← 调用栈底部（入口）
├────────────────────────────────┬─────────────────────────┤
│      main.handleRequest       │   main.healthCheck      │  ← 第二层调用
├───────────────┬────────────────┤                         │
│ json.Marshal  │ db.Query       │                         │  ← 第三层调用
├───────────────┤                │                         │
│reflect.Value  │                │                         │  ← 第四层调用
└───────────────┴────────────────┴─────────────────────────┘

宽度 = 时间占比（越宽，耗时越多）
纵轴 = 调用栈深度（从底到顶是调用顺序）
```

关键规则：

- **宽度代表耗时占比**：一个函数块越宽，说明它（含子调用）占用的时间越多
- **纵轴是调用深度**：底部是入口函数，越往上越深入调用链
- **颜色没有特殊含义**：不同颜色只是为了区分相邻的函数块，便于阅读
- **重点关注"平顶山"**：又宽又在顶部的函数块，说明这个函数自身执行时间长，是优化的首要目标

### CPU 火焰图 vs 内存火焰图

| 维度 | CPU 火焰图 | 内存火焰图 |
|------|-----------|-----------|
| 宽度含义 | 函数 CPU 占用时间比例 | 函数内存分配量比例 |
| 纵轴含义 | 调用栈深度 | 分配路径深度 |
| 关注点 | 哪个函数计算最耗时 | 哪个函数分配内存最多 |
| 典型热点 | 序列化、加密、排序 | 字符串拼接、Slice 扩容、反序列化 |

### 从火焰图定位热点的步骤

1. **找最宽的"平顶山"**：这些是 flat 时间最长的函数，优化收益最大
2. **从顶部往下看**：找到热点函数后，沿着调用栈往下看，找出是谁调用了它
3. **对比业务逻辑**：确认这个调用路径是否合理——是正常业务需要，还是有不必要的重复调用
4. **量化优化空间**：宽度直接反映时间占比，一个占 30% 的函数即使优化一半也只能减少 15%

---

## 5. GODEBUG=gctrace=1 输出解读

当怀疑 GC 导致延迟抖动时，可以通过 `gctrace` 观察每次 GC 的详细信息。

### 启用方式

```bash
GODEBUG=gctrace=1 ./your-app
```

### 输出示例

```
gc 14 @1.432s 2%: 0.012+3.4+0.002 ms clock, 0.096+2.1/3.0/0.5+0.016 ms cpu, 8->9->5 MB, 10 MB goal, 0 MB stacks, 0 MB globals, 8 P
```

### 逐字段含义

| 字段 | 示例值 | 含义 |
|------|--------|------|
| `gc 14` | 14 | 第 14 次 GC |
| `@1.432s` | 1.432s | 程序启动后 1.432 秒 |
| `2%` | 2% | 自程序启动以来，GC 占用的总 CPU 时间比例 |
| `0.012+3.4+0.002 ms clock` | — | wall-clock 时间：STW 标记准备 + 并发标记 + STW 标记终止 |
| `0.096+2.1/3.0/0.5+0.016 ms cpu` | — | CPU 时间：STW + (辅助标记 / 后台标记 / 空闲标记) + STW |
| `8->9->5 MB` | — | GC 开始时堆大小 → GC 结束时堆大小 → 存活对象大小 |
| `10 MB goal` | 10 MB | 下次触发 GC 的堆大小目标 |
| `0 MB stacks` | 0 MB | 栈内存估算 |
| `0 MB globals` | 0 MB | 全局变量内存估算 |
| `8 P` | 8 | GOMAXPROCS 的值 |

### 关注重点

- **GC 占 CPU 比例（第三个字段）**：超过 5% 就需要关注，超过 10% 说明 GC 压力严重
- **STW 时间（clock 的第一和第三段）**：这是真正导致延迟的停顿时间，通常应在 1ms 以下
- **堆内存变化（`X->Y->Z MB`）**：如果 Z（存活对象）持续增长，说明可能有内存泄漏
- **goal 值持续增大**：说明程序内存需求在持续上涨

---

## 6. 常看指标

### CPU

- **热点函数占比**：`top` 命令中 `flat%` 超过 10% 的函数值得关注
- **调用链路特征**：是否集中在序列化（`encoding/json`）、反射（`reflect`）、加密（`crypto`）、日志（`log`）等
- **系统调用占比**：`syscall` 开头的函数占比高，说明 IO 可能是瓶颈

```bash
# 抓取 60 秒 CPU profile，看更稳定的结果
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=60

# 进入后执行
(pprof) top 20
(pprof) top -cum 20
```

### Heap

- **哪些对象分配最多**：`alloc_space` 显示累计分配量，`inuse_space` 显示当前在用量
- **内存是否在增长**：多次抓取 heap profile 对比 `inuse_space`，如果持续增长就有泄漏嫌疑
- **常见元凶**：缓存无上限、Slice 长期持有、字符串大量复制

```bash
# 查看当前在用内存（默认）
go tool pprof http://localhost:6060/debug/pprof/heap

# 查看累计分配量（找分配热点）
go tool pprof -alloc_space http://localhost:6060/debug/pprof/heap

# 进入后执行
(pprof) top 20 -cum
(pprof) list suspectedFunction
```

### Goroutine

- **总数是否合理**：几百到几千通常正常，几万就需要排查
- **是否大量卡在同一位置**：`goroutine` profile 会按调用栈聚合，如果某个位置有上千个 goroutine 在等待，大概率有泄漏

```bash
# 查看 goroutine 堆栈
go tool pprof http://localhost:6060/debug/pprof/goroutine

# 或者直接在浏览器中查看（更方便的文本格式）
curl http://localhost:6060/debug/pprof/goroutine?debug=1

# debug=2 会显示每个 goroutine 的完整堆栈
curl http://localhost:6060/debug/pprof/goroutine?debug=2
```

### Mutex / Block

- **是否有单点热点锁**：一个 `sync.Mutex` 被大量 goroutine 竞争
- **Channel 阻塞**：大量 goroutine 阻塞在 channel 的发送或接收上
- **IO 等待堆积**：数据库连接池耗尽，导致大量请求排队

```bash
# 查看 mutex 竞争
go tool pprof http://localhost:6060/debug/pprof/mutex

# 查看阻塞事件
go tool pprof http://localhost:6060/debug/pprof/block
```

---

## 7. 常见场景

### CPU 高

| 原因 | 特征 | 优化方向 |
|------|------|---------|
| JSON 编解码过重 | `encoding/json` 相关函数占比高 | 换用 `sonic` / `easyjson` / `jsoniter` |
| 反射频繁 | `reflect.Value` 系列函数占比高 | 用代码生成替代反射 |
| 日志过多 | `fmt.Sprintf` / `log` 相关函数频繁出现 | 降低日志级别，用结构化日志库 |
| 热点循环内多余分配 | `runtime.mallocgc` 占比高 | 预分配、对象复用（`sync.Pool`） |
| 正则表达式 | `regexp` 相关函数占比高 | 预编译正则，或用字符串操作替代 |

### 内存高

| 原因 | 特征 | 优化方向 |
|------|------|---------|
| 大对象 Slice 长期持有 | `inuse_space` 集中在某个 Slice | 用完及时置 nil，或限制容量 |
| 缓存无上限 | map 的 `inuse_space` 持续增长 | 加 LRU / TTL 淘汰机制 |
| 字符串复制过多 | `runtime.slicebytetostring` 占比高 | 用 `[]byte` 直接操作，减少转换 |
| 临时对象分配频繁 | `alloc_objects` 很高 | `sync.Pool` 复用对象 |

### Goroutine 泄漏

| 原因 | 特征 | 修复方向 |
|------|------|---------|
| Channel 无接收方 | 大量 goroutine 阻塞在 `chan send` | 加缓冲或确保有消费者 |
| Context 取消未透传 | 父请求已结束但子 goroutine 仍在运行 | 正确传递和监听 `ctx.Done()` |
| 定时任务退出条件缺失 | `time.Tick` 创建的 goroutine 无法停止 | 改用 `time.NewTicker` 并 defer Stop |
| 重试逻辑无限循环 | goroutine 卡在重试循环中 | 加最大重试次数和退避策略 |

---

## 8. 端到端排障案例

### 案例 1：CPU 占用高 — JSON 序列化瓶颈

#### 场景

一个 HTTP 服务在压测时 CPU 持续 80%+，接口平均延迟从 5ms 上涨到 50ms。

#### 模拟代码

```go
package main

import (
	"encoding/json"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
)

// 模拟一个包含大量字段的业务结构体
type BigPayload struct {
	ID       int               `json:"id"`
	Name     string            `json:"name"`
	Tags     []string          `json:"tags"`
	Metadata map[string]string `json:"metadata"`
	Items    []Item            `json:"items"`
}

type Item struct {
	Key   string  `json:"key"`
	Value float64 `json:"value"`
}

func generatePayload() BigPayload {
	p := BigPayload{
		ID:       rand.Intn(10000),
		Name:     "test-payload",
		Tags:     make([]string, 20),
		Metadata: make(map[string]string, 50),
		Items:    make([]Item, 100),
	}
	for i := range p.Tags {
		p.Tags[i] = "tag-" + string(rune('a'+i%26))
	}
	for i := 0; i < 50; i++ {
		p.Metadata["key-"+string(rune('a'+i%26))] = "value"
	}
	for i := range p.Items {
		p.Items[i] = Item{Key: "item", Value: float64(i)}
	}
	return p
}

func handleAPI(w http.ResponseWriter, r *http.Request) {
	payload := generatePayload()
	// 每次请求都做一次 JSON 序列化 —— 使用标准库的反射实现
	data, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func main() {
	http.HandleFunc("/api/data", handleAPI)
	http.ListenAndServe(":8080", nil)
}
```

#### 排查流程

**第一步：压测复现问题**

```bash
# 使用 wrk 进行压测
wrk -t4 -c100 -d30s http://localhost:8080/api/data
```

**第二步：抓取 CPU profile**

```bash
go tool pprof -http=:9090 http://localhost:8080/debug/pprof/profile?seconds=30
```

**第三步：交互模式分析**

```
(pprof) top 15
      flat  flat%   sum%        cum   cum%
     1.87s 34.63% 34.63%      1.87s 34.63%  encoding/json.(*encodeState).stringBytes
     0.87s 16.11% 50.74%      0.87s 16.11%  encoding/json.stateInString
     0.56s 10.37% 61.11%      3.80s 70.37%  encoding/json.(*encodeState).marshal
     ...

(pprof) top -cum
      flat  flat%   sum%        cum   cum%
     0.02s  0.37%  0.37%      4.50s 83.33%  main.handleAPI      # <-- 入口
     0.01s  0.19%  0.56%      4.20s 77.78%  encoding/json.Marshal
     ...

(pprof) list handleAPI
     ...
         .      4.20s     47:   data, _ := json.Marshal(payload)  # <-- 瓶颈就在这一行
     ...
```

**发现**：`encoding/json.Marshal` 及其内部调用占了 80%+ 的 CPU，因为标准库的 JSON 序列化大量使用反射。

#### 优化方案

将 `encoding/json` 替换为高性能 JSON 库（如 `sonic`）：

```go
import "github.com/bytedance/sonic"

func handleAPI(w http.ResponseWriter, r *http.Request) {
	payload := generatePayload()
	// sonic 使用 JIT 编译，避免反射开销
	data, _ := sonic.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
```

优化后用 `diff_base` 对比验证：

```bash
# 保存优化前的 profile
curl -o before.pb.gz 'http://localhost:8080/debug/pprof/profile?seconds=30'

# 部署优化后的代码，重新抓取
curl -o after.pb.gz 'http://localhost:8080/debug/pprof/profile?seconds=30'

# 对比
go tool pprof -diff_base before.pb.gz after.pb.gz
```

---

### 案例 2：内存持续增长（泄漏）

#### 场景

一个 Go 服务运行几天后 RSS 从 200MB 涨到 2GB，重启后恢复，但会再次增长。

#### 模拟代码

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"sync"
)

// 模拟一个没有过期机制的内存缓存
var (
	cache   = make(map[string][]byte)
	cacheMu sync.RWMutex
)

func handleSet(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	if key == "" {
		key = fmt.Sprintf("key-%d", len(cache))
	}

	// 每次请求写入 1KB 数据到缓存，但永远不会被清理
	data := make([]byte, 1024)
	for i := range data {
		data[i] = byte(i % 256)
	}

	cacheMu.Lock()
	cache[key] = data // 只增不删，内存持续增长
	cacheMu.Unlock()

	fmt.Fprintf(w, "cached: %s, total keys: %d\n", key, len(cache))
}

func handleGet(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	cacheMu.RLock()
	val, ok := cache[key]
	cacheMu.RUnlock()

	if ok {
		w.Write(val)
	} else {
		http.Error(w, "not found", 404)
	}
}

func main() {
	http.HandleFunc("/set", handleSet)
	http.HandleFunc("/get", handleGet)
	fmt.Println("服务启动: http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
```

#### 排查流程

**第一步：确认内存在增长**

```bash
# 持续观察进程内存
watch -n 5 'ps -o rss,vsz,pid,comm -p $(pgrep your-app)'
```

**第二步：抓取 heap profile（对比两次）**

```bash
# 第一次抓取
curl -o heap1.pb.gz http://localhost:8080/debug/pprof/heap

# 等待一段时间，模拟请求持续写入
wrk -t2 -c10 -d60s 'http://localhost:8080/set?key=test'

# 第二次抓取
curl -o heap2.pb.gz http://localhost:8080/debug/pprof/heap

# 对比两次的差异
go tool pprof -diff_base heap1.pb.gz heap2.pb.gz
```

**第三步：分析 inuse_space**

```bash
go tool pprof -inuse_space http://localhost:8080/debug/pprof/heap
```

```
(pprof) top
Showing nodes accounting for 1.5GB, 98.5% of 1.52GB total
      flat  flat%   sum%        cum   cum%
    1.50GB 98.50% 98.50%     1.50GB 98.50%  main.handleSet
         0     0% 98.50%     1.50GB 98.50%  net/http.(*ServeMux).ServeHTTP
         ...

(pprof) list handleSet
     ...
    1.50GB     1.50GB     23:   data := make([]byte, 1024)        # <-- 分配在这里
         .          .     ...
         .          .     28:   cache[key] = data                  # <-- 存入 map 永不释放
     ...
```

**发现**：`handleSet` 中分配的 `[]byte` 被放入全局 map，永远不会被释放。

#### 优化方案

给缓存加上容量限制和过期机制：

```go
import (
	lru "github.com/hashicorp/golang-lru/v2"
)

// 使用 LRU 缓存替代无限制 map
var cache, _ = lru.New[string, []byte](10000) // 最多保留 10000 个 key

func handleSet(w http.ResponseWriter, r *http.Request) {
	key := r.URL.Query().Get("key")
	data := make([]byte, 1024)
	cache.Add(key, data) // 超过容量时自动淘汰最旧的
	fmt.Fprintf(w, "cached: %s, total keys: %d\n", key, cache.Len())
}
```

---

### 案例 3：Goroutine 泄漏

#### 场景

监控告警显示 Goroutine 数量从启动时的 20 个，在一天内涨到了 50000+，服务内存也随之飙升。

#### 模拟代码

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"time"
)

// 模拟异步任务：每个请求启动一个 goroutine 往 channel 发数据
// 但没有消费者接收，导致 goroutine 永远阻塞
func handleTask(w http.ResponseWriter, r *http.Request) {
	ch := make(chan string) // 无缓冲 channel

	go func() {
		// 模拟一些处理
		time.Sleep(100 * time.Millisecond)

		// 往 channel 发送结果，但没有人接收
		// 这个 goroutine 会永远阻塞在这里
		ch <- "result"
	}()

	// 请求处理器直接返回了，没有从 ch 中接收数据
	// 上面启动的 goroutine 将永远无法退出
	fmt.Fprintf(w, "task submitted, goroutines: %d\n", runtime.NumGoroutine())
}

func main() {
	http.HandleFunc("/task", handleTask)

	// 启动一个监控 goroutine 数量的后台任务
	go func() {
		for {
			fmt.Printf("[monitor] goroutine count: %d\n", runtime.NumGoroutine())
			time.Sleep(5 * time.Second)
		}
	}()

	fmt.Println("服务启动: http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
```

#### 排查流程

**第一步：确认 goroutine 在增长**

```bash
# 查看 goroutine 总数
curl http://localhost:8080/debug/pprof/goroutine?debug=1 | head -5
```

输出：

```
goroutine profile: total 50123
48000 @ 0x43e1a6 0x44f2c8 0x44f2a1 0x46c9c5 0x47a8c1
#   0x46c9c4    main.handleTask.func1+0x44    /app/main.go:21
```

可以看到有 48000 个 goroutine 堆积在同一个位置。

**第二步：用 pprof 详细分析**

```bash
go tool pprof http://localhost:8080/debug/pprof/goroutine
```

```
(pprof) top
Showing nodes accounting for 48000, 99.75% of 48120 total
      flat  flat%   sum%        cum   cum%
     48000 99.75% 99.75%      48000 99.75%  runtime.gopark
         0     0% 99.75%      48000 99.75%  runtime.chansend
         0     0% 99.75%      48000 99.75%  runtime.chansend1
         0     0% 99.75%      48000 99.75%  main.handleTask.func1

(pprof) list handleTask
     ...
         .      48000     21:       ch <- "result"   # <-- 48000 个 goroutine 阻塞在这里
     ...
```

**发现**：每次请求都创建了一个 goroutine，向无缓冲 channel 发送数据，但没有接收方，导致 goroutine 永远阻塞。

#### 优化方案

使用 `context` 控制 goroutine 的生命周期：

```go
func handleTask(w http.ResponseWriter, r *http.Request) {
	// 使用请求的 context，请求结束时 context 会自动取消
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	ch := make(chan string, 1) // 改为带缓冲的 channel

	go func() {
		time.Sleep(100 * time.Millisecond)
		select {
		case ch <- "result":
			// 成功发送
		case <-ctx.Done():
			// 超时或请求取消，goroutine 正常退出
			return
		}
	}()

	select {
	case result := <-ch:
		fmt.Fprintf(w, "result: %s, goroutines: %d\n", result, runtime.NumGoroutine())
	case <-ctx.Done():
		http.Error(w, "timeout", http.StatusGatewayTimeout)
	}
}
```

关键改动：

1. **带缓冲 channel**：即使没有接收方，发送方也不会阻塞（缓冲区大小为 1）
2. **context 超时控制**：goroutine 内部监听 `ctx.Done()`，请求取消时自动退出
3. **select 多路复用**：同时等待结果和超时，避免无限阻塞

---

## 9. fgprof：wall-clock profiling

Go 内置的 CPU profiler 只采样"on-CPU"的时间——即 goroutine 真正在 CPU 上执行的时间。如果你的程序瓶颈在 IO 等待、锁等待、sleep 等"off-CPU"操作，CPU profile 里是看不到的。

[fgprof](https://github.com/felixge/fgprof) 是一个 wall-clock profiler，它同时采样 on-CPU 和 off-CPU 的时间，能真实反映每个函数的"挂钟时间"消耗。

### 什么时候用 fgprof

- CPU profile 显示 CPU 占用率不高，但接口延迟很大
- 怀疑瓶颈在网络 IO、数据库查询、外部 API 调用等阻塞操作
- 想看到函数的真实耗时（包括等待时间），而不仅仅是计算时间

### 接入方式

```go
package main

import (
	"log"
	"net/http"
	_ "net/http/pprof"

	"github.com/felixge/fgprof"
)

func main() {
	// 注册 fgprof 端点
	http.DefaultServeMux.Handle("/debug/fgprof", fgprof.Handler())

	// 启动服务
	log.Fatal(http.ListenAndServe(":6060", nil))
}
```

### 使用方式

```bash
# 抓取 30 秒的 wall-clock profile
go tool pprof -http=:9090 http://localhost:6060/debug/fgprof?seconds=30
```

在 fgprof 的火焰图中，你能看到那些"CPU profile 里几乎不出现，但实际上耗时很长"的函数——比如 `net/http.(*Transport).RoundTrip`（HTTP 请求等待）、`database/sql.(*DB).query`（数据库查询等待）。

---

## 10. 自动化监控与持续 Profiling

在生产环境中，不可能每次出问题都手动抓 profile。持续 Profiling（Continuous Profiling）会在后台以极低的开销持续采集 profile 数据，问题发生时可以直接回溯。

### 常用工具

| 工具 | 特点 | 适用场景 |
|------|------|---------|
| [Pyroscope](https://github.com/grafana/pyroscope) | 开源，支持 Go 原生集成，提供时间线视图 | 自建基础设施 |
| [Datadog Continuous Profiler](https://docs.datadoghq.com/profiler/) | 商业方案，与 APM 联动 | 已使用 Datadog 的团队 |
| [Parca](https://github.com/parca-dev/parca) | 开源，基于 eBPF，几乎零侵入 | 追求低开销的场景 |
| [Grafana Alloy](https://grafana.com/docs/alloy/latest/) | Grafana 生态，可推送到 Pyroscope | Grafana 技术栈 |

### Pyroscope 接入示例

```go
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/grafana/pyroscope-go"
)

func main() {
	// 启动 Pyroscope agent，持续上报 profile 数据
	pyroscope.Start(pyroscope.Config{
		ApplicationName: "my-go-service",
		ServerAddress:   "http://pyroscope-server:4040",

		// 可选：设置标签，用于在 Pyroscope UI 中过滤
		Tags: map[string]string{
			"env":     os.Getenv("ENV"),
			"version": os.Getenv("VERSION"),
		},

		// 启用的 profile 类型
		ProfileTypes: []pyroscope.ProfileType{
			pyroscope.ProfileCPU,
			pyroscope.ProfileAllocObjects,
			pyroscope.ProfileAllocSpace,
			pyroscope.ProfileInuseObjects,
			pyroscope.ProfileInuseSpace,
			pyroscope.ProfileGoroutines,
			pyroscope.ProfileMutexCount,
			pyroscope.ProfileMutexDuration,
			pyroscope.ProfileBlockCount,
			pyroscope.ProfileBlockDuration,
		},
	})

	// 正常启动业务服务
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

接入后可以在 Pyroscope UI 中按时间线查看历史 profile，直接定位到某个时间段的性能异常。

---

## 11. 排查误区

| 误区 | 正确做法 |
|------|---------|
| 只看一次 profile 截图就下结论 | 结合业务请求场景和多次采样对比 |
| 看见热点函数就直接改 | 先量化优化收益（改完能提升多少？），再动手 |
| 把偶发采样结果当成长期结论 | 多次采样、在压测环境复现后再判断 |
| 不做压测复现，只在生产环境猜测 | 在压测环境复现问题，再验证修复效果 |
| 只看 CPU profile，忽略其他维度 | 根据现象选择对应的 profile 类型 |
| 优化前不留 baseline | 保存优化前的 profile，用 `diff_base` 对比优化效果 |
| 在低负载下抓 profile | 在高负载下抓取才能看到真实热点 |

---

## 延伸阅读

- [Go 官方 pprof 文档](https://pkg.go.dev/net/http/pprof)
- [Google pprof 工具](https://github.com/google/pprof)
- [fgprof - wall-clock profiler](https://github.com/felixge/fgprof)
- [Pyroscope - 开源持续 Profiling](https://github.com/grafana/pyroscope)
- [Parca - 基于 eBPF 的持续 Profiling](https://github.com/parca-dev/parca)
