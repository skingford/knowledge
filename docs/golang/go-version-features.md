---
title: Go 版本特性总结（1.21 ~ 1.24）
description: 系统总结 Go 1.21 到 Go 1.24 每个版本的关键新特性、语法变更和标准库改进，附带可运行代码示例。
search: false
---

# Go 版本特性总结（1.21 ~ 1.24）

## 适合人群

- 使用 Go 1.20 及以下版本、准备升级到新版本的开发者
- 想系统了解 Go 语言近两年演进方向的工程师
- 需要快速查阅某个版本引入了哪些新特性的开发者

## 学习目标

- 掌握 Go 1.21 ~ 1.24 每个版本的核心新特性和语法变更
- 理解 `for` 循环变量语义、`range over func` 等重大语言变更的背景和用法
- 熟练使用新增的标准库包：`log/slog`、`slices`、`maps`、`iter` 等
- 了解版本升级的注意事项和最佳实践

## 快速导航

- [Go 1.21 — 内建函数、结构化日志、slices/maps 包](#go-121202308)
- [Go 1.22 — for 循环变量语义变更、路由增强](#go-122202402)
- [Go 1.23 — range over func 迭代器、unique 包](#go-123202408)
- [Go 1.24 — 泛型类型别名、弱指针、os.Root](#go-124202502)
- [版本升级建议](#版本升级建议)

---

## Go 1.21（2023.08）

Go 1.21 引入了多个内建函数、结构化日志包 `log/slog`，并将之前实验性的 `slices`、`maps` 包正式纳入标准库。这是一次标准库大幅增强的版本。

### 1. `min`/`max`/`clear` 内建函数

Go 1.21 新增三个内建函数：`min` 和 `max` 支持所有可比较的有序类型，`clear` 可以清空 map 或将 slice 元素归零。这些函数无需导入任何包即可直接使用。

::: details 点击展开代码：1. min/max/clear 内建函数
```go
package main

import "fmt"

func main() {
	// min/max 支持整数
	fmt.Println("min(3, 1, 2) =", min(3, 1, 2)) // 1
	fmt.Println("max(3, 1, 2) =", max(3, 1, 2)) // 3

	// min/max 支持浮点数
	fmt.Println("min(3.14, 2.71) =", min(3.14, 2.71)) // 2.71

	// min/max 支持字符串（按字典序）
	fmt.Println("min(\"banana\", \"apple\") =", min("banana", "apple")) // apple

	// min/max 支持可变参数，至少传一个
	fmt.Println("max(10) =", max(10)) // 10

	// clear 清空 map
	m := map[string]int{"a": 1, "b": 2, "c": 3}
	fmt.Println("清空前 map:", m) // map[a:1 b:2 c:3]
	clear(m)
	fmt.Println("清空后 map:", m)    // map[]
	fmt.Println("map 长度:", len(m)) // 0

	// clear 将 slice 元素归零（长度不变）
	s := []int{1, 2, 3, 4, 5}
	fmt.Println("归零前 slice:", s) // [1 2 3 4 5]
	clear(s)
	fmt.Println("归零后 slice:", s)    // [0 0 0 0 0]
	fmt.Println("slice 长度:", len(s)) // 5
}
```
:::

> **讲解重点**
>
> - `min`/`max` 是泛型内建函数，支持所有 `cmp.Ordered` 类型（整数、浮点数、字符串）。
> - `min`/`max` 至少需要一个参数，支持可变参数。
> - `clear(map)` 删除所有键值对，保留 map 本身（不为 nil）。
> - `clear(slice)` 将所有元素设为零值，**不改变长度和容量**。

---

### 2. `log/slog` 结构化日志

`log/slog` 是 Go 1.21 引入的结构化日志包，支持日志级别、键值对属性、分组和自定义 Handler。它是标准库中对 `log` 包的现代化替代。

::: details 点击展开代码：2. log/slog 结构化日志
```go
package main

import (
	"context"
	"log/slog"
	"os"
)

func main() {
	// 1. 使用默认 logger（输出到 stderr，文本格式）
	slog.Info("服务启动", "port", 8080, "env", "production")
	slog.Warn("配置缺失", "key", "DATABASE_URL")
	slog.Error("连接失败", "err", "connection refused", "retry", 3)

	// 2. 创建 JSON 格式的 logger
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelDebug, // 设置最低日志级别
	})
	logger := slog.New(jsonHandler)
	logger.Debug("调试信息", "module", "auth")
	logger.Info("用户登录", "user_id", 42, "ip", "192.168.1.1")

	// 3. 使用分组属性（Group）
	logger.Info("请求处理完成",
		slog.Group("request",
			slog.String("method", "GET"),
			slog.String("path", "/api/users"),
			slog.Int("status", 200),
		),
		slog.Group("timing",
			slog.String("duration", "15ms"),
		),
	)

	// 4. 创建带固定属性的子 logger
	reqLogger := logger.With("request_id", "abc-123", "trace_id", "xyz-789")
	reqLogger.Info("开始处理请求")
	reqLogger.Info("查询数据库")
	reqLogger.Info("请求完成")

	// 5. 带 context 的日志
	ctx := context.Background()
	logger.InfoContext(ctx, "带上下文的日志", "action", "query")

	// 6. 设置为默认 logger
	slog.SetDefault(logger)
	slog.Info("现在默认 logger 也是 JSON 格式了")
}
```
:::

> **讲解重点**
>
> - `slog` 提供四个级别：`Debug`、`Info`、`Warn`、`Error`，可通过 `HandlerOptions.Level` 控制最低输出级别。
> - 内置两种 Handler：`TextHandler`（文本格式）和 `JSONHandler`（JSON 格式）。
> - `slog.Group()` 可以将多个属性组织在同一个命名空间下，JSON 输出时体现为嵌套对象。
> - `logger.With()` 创建子 logger，自动附带固定属性，适合在请求链路中传递。
> - 可以通过实现 `slog.Handler` 接口自定义输出格式和目标。

---

### 3. `slices`/`maps`/`cmp` 标准库包

Go 1.21 将之前在 `golang.org/x/exp` 中实验的 `slices`、`maps`、`cmp` 包正式纳入标准库。这些包提供了大量泛型工具函数，极大减少了手写循环的需要。

::: details 点击展开代码：3. slices/maps/cmp 标准库包
```go
package main

import (
	"cmp"
	"fmt"
	"maps"
	"slices"
)

func main() {
	// === slices 包 ===

	// 排序
	nums := []int{5, 3, 8, 1, 9, 2}
	slices.Sort(nums)
	fmt.Println("排序后:", nums) // [1 2 3 5 8 9]

	// 自定义排序（按绝对值）
	vals := []int{-3, 1, -5, 2, -1}
	slices.SortFunc(vals, func(a, b int) int {
		if abs(a) < abs(b) {
			return -1
		}
		if abs(a) > abs(b) {
			return 1
		}
		return 0
	})
	fmt.Println("按绝对值排序:", vals) // [-1 1 2 -3 -5]

	// 二分查找（需要已排序的 slice）
	sorted := []int{1, 3, 5, 7, 9, 11}
	idx, found := slices.BinarySearch(sorted, 7)
	fmt.Printf("查找 7: 索引=%d, 找到=%v\n", idx, found) // 索引=3, 找到=true

	// 包含检查
	fruits := []string{"apple", "banana", "cherry"}
	fmt.Println("包含 banana:", slices.Contains(fruits, "banana")) // true

	// 查找索引
	fmt.Println("cherry 的索引:", slices.Index(fruits, "cherry")) // 2

	// 反转
	slices.Reverse(fruits)
	fmt.Println("反转后:", fruits) // [cherry banana apple]

	// 去重（需要已排序）
	duped := []int{1, 1, 2, 2, 3, 3, 3, 4}
	unique := slices.Compact(duped)
	fmt.Println("去重后:", unique) // [1 2 3 4]

	// === maps 包 ===

	// 获取所有键和值
	scores := map[string]int{"Alice": 95, "Bob": 87, "Carol": 92}
	keys := slices.Sorted(maps.Keys(scores))
	fmt.Println("所有键（排序后）:", keys) // [Alice Bob Carol]

	vals2 := slices.Sorted(maps.Values(scores))
	fmt.Println("所有值（排序后）:", vals2) // [87 92 95]

	// 复制 map
	copied := maps.Clone(scores)
	fmt.Println("复制的 map:", copied)

	// 判断两个 map 是否相等
	fmt.Println("map 相等:", maps.Equal(scores, copied)) // true

	// 合并 map（后者覆盖前者的重复键）
	extra := map[string]int{"Dave": 88, "Alice": 99}
	maps.Copy(scores, extra)
	fmt.Println("合并后:", scores) // Alice 被覆盖为 99

	// === cmp 包 ===

	// 比较函数
	fmt.Println("cmp.Compare(1, 2):", cmp.Compare(1, 2))   // -1
	fmt.Println("cmp.Compare(2, 2):", cmp.Compare(2, 2))   // 0
	fmt.Println("cmp.Compare(3, 2):", cmp.Compare(3, 2))   // 1

	// Or：返回第一个非零值
	fmt.Println("cmp.Or(0, 0, 3, 5):", cmp.Or(0, 0, 3, 5)) // 3
	fmt.Println("cmp.Or(\"\", \"\", \"hello\"):", cmp.Or("", "", "hello")) // hello

	// cmp.Or 常用于提供默认值
	port := cmp.Or(os.Getenv("PORT"), "8080")
	_ = port
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
```
:::

> **讲解重点**
>
> - `slices` 包涵盖排序、查找、比较、去重、反转等常用操作，全部支持泛型。
> - `maps.Keys()` 和 `maps.Values()` 返回迭代器（Go 1.23 起），可配合 `slices.Sorted()` 使用。
> - `cmp.Or()` 返回参数中第一个非零值，非常适合提供默认值，是替代 `if x == "" { x = default }` 的简洁写法。
> - `cmp.Compare()` 返回 -1、0、1，适合在 `SortFunc` 中使用。

---

### 4. `sync.OnceFunc`/`OnceValue`/`OnceValues`

Go 1.21 为 `sync` 包新增了三个便捷函数，简化了"只执行一次"的常见模式，避免了传统 `sync.Once` 需要额外变量的繁琐写法。

::: details 点击展开代码：4. sync.OnceFunc/OnceValue/OnceValues
```go
package main

import (
	"fmt"
	"sync"
)

// === 传统 sync.Once 写法 ===
var ( // [!code --]
	once     sync.Once // [!code --]
	instance *Config   // [!code --]
)

type Config struct {
	DSN string
}

func getConfigOld() *Config {
	once.Do(func() {
		fmt.Println("初始化配置（旧方式）...")
		instance = &Config{DSN: "postgres://localhost/mydb"}
	})
	return instance
}

// === Go 1.21 新方式 ===

// OnceFunc：只执行一次，无返回值
var initSystem = sync.OnceFunc(func() {
	fmt.Println("系统初始化（只执行一次）")
})

// OnceValue：只执行一次，返回一个值
var getConfig = sync.OnceValue(func() *Config { // [!code ++]
	fmt.Println("初始化配置（新方式）...")
	return &Config{DSN: "postgres://localhost/mydb"}
})

// OnceValues：只执行一次，返回两个值（常用于返回值 + error）
var loadData = sync.OnceValues(func() ([]string, error) { // [!code ++]
	fmt.Println("加载数据（只执行一次）...")
	return []string{"item1", "item2", "item3"}, nil
})

func main() {
	// OnceFunc 示例
	initSystem() // 打印 "系统初始化"
	initSystem() // 不再打印
	initSystem() // 不再打印

	// OnceValue 示例
	cfg1 := getConfig() // 打印 "初始化配置"
	cfg2 := getConfig() // 不再打印
	fmt.Printf("同一个实例: %v\n", cfg1 == cfg2) // true
	fmt.Println("DSN:", cfg1.DSN)

	// OnceValues 示例
	data, err := loadData() // 打印 "加载数据"
	fmt.Println("数据:", data, "错误:", err)

	data2, _ := loadData() // 不再打印
	fmt.Println("再次获取:", data2)
}
```
:::

> **讲解重点**
>
> - `sync.OnceFunc(f)` 返回一个函数，该函数无论调用多少次都只执行 `f` 一次。
> - `sync.OnceValue(f)` 适合惰性初始化单例，返回值会被缓存。
> - `sync.OnceValues(f)` 支持返回两个值，完美适配 Go 的 `(value, error)` 惯例。
> - 相比传统写法，新 API 不需要额外声明全局变量来存储结果，代码更简洁、更安全。
> - 如果 `f` 发生 panic，后续调用也会 panic（传播相同的 panic 值）。

---

### 5. `context.WithoutCancel`/`context.AfterFunc`

Go 1.21 为 `context` 包新增了两个实用函数，解决了一些常见的 context 使用痛点。

::: details 点击展开代码：5. context.WithoutCancel/context.AfterFunc
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	// === context.WithoutCancel ===
	// 场景：请求结束后仍需执行异步任务（如写审计日志）
	// 需要继承 context 中的值，但不希望被父 context 取消

	parentCtx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	// 创建一个不会被父 context 取消的子 context
	detachedCtx := context.WithoutCancel(parentCtx)

	// 父 context 取消后，detachedCtx 不受影响
	cancel()
	fmt.Println("父 context 已取消:", parentCtx.Err())       // context canceled
	fmt.Println("detached context:", detachedCtx.Err())      // <nil>

	// === context.AfterFunc ===
	// 场景：context 取消后自动执行清理逻辑

	ctx, cancel2 := context.WithCancel(context.Background())

	// 注册回调：当 ctx 被取消时执行
	stop := context.AfterFunc(ctx, func() {
		fmt.Println("context 被取消，执行清理...")
	})

	// 取消 context 会触发回调
	cancel2()
	time.Sleep(100 * time.Millisecond) // 等待回调执行

	// stop 函数可以取消注册（如果回调尚未执行）
	_ = stop

	// AfterFunc 的另一个用途：合并多个 context 的取消信号
	ctx1, cancel1 := context.WithCancel(context.Background())
	ctx2, cancelFunc2 := context.WithCancel(context.Background())
	defer cancel1()
	defer cancelFunc2()

	// 创建一个合并 context：任一取消即触发
	mergedCtx, mergedCancel := context.WithCancel(context.Background())
	context.AfterFunc(ctx1, func() { mergedCancel() })
	context.AfterFunc(ctx2, func() { mergedCancel() })

	// 取消其中一个即可
	cancel1()
	time.Sleep(50 * time.Millisecond)
	fmt.Println("合并 context:", mergedCtx.Err()) // context canceled
}
```
:::

> **讲解重点**
>
> - `context.WithoutCancel(parent)` 创建一个继承父 context 值但不继承取消信号的子 context。常用于请求结束后的异步操作（审计日志、指标上报等）。
> - `context.AfterFunc(ctx, f)` 注册一个回调函数，当 `ctx` 被取消（或超时）后在独立 goroutine 中执行 `f`。
> - `AfterFunc` 返回一个 `stop` 函数，调用 `stop()` 可以取消注册（若回调尚未执行则返回 `true`）。
> - `AfterFunc` 可以优雅地实现"合并多个 context 取消信号"的模式。

---

### 6. WASI 支持预览

::: tip 提示
WASI 支持目前仍为实验性质，部分 syscall 和网络功能受限，不建议在生产环境直接使用。
:::

Go 1.21 新增了对 WebAssembly System Interface (WASI) Preview 1 的实验性支持。可以通过 `GOOS=wasip1 GOARCH=wasm` 编译出可在 WASI 运行时（如 Wasmtime、WasmEdge）中执行的 Wasm 模块。

::: details 点击展开代码：6. WASI 支持预览
```bash
# 编译为 WASI 模块
GOOS=wasip1 GOARCH=wasm go build -o app.wasm main.go

# 使用 wasmtime 运行
wasmtime app.wasm
```
:::

> **讲解重点**
>
> - WASI 让 Go 程序可以在浏览器之外的 WebAssembly 运行时中执行。
> - 相比之前的 `js/wasm` 目标，WASI 不依赖 JavaScript 环境。
> - 目前仍为实验性支持，部分 syscall 和网络功能受限。

---

## Go 1.22（2024.02）

Go 1.22 带来了一个**重大语言变更**：`for` 循环变量的作用域语义发生改变。同时，`net/http` 路由功能大幅增强，新增 `math/rand/v2` 包。

### 1. `for` 循环变量语义变更（重大变更）

::: warning 注意
这是 Go 诞生以来最重要的语言行为变更之一。此变更通过 `go.mod` 中的 `go` 指令控制：`go 1.22` 及以上启用新行为。升级前请确认项目中没有依赖旧语义的代码。
:::

在 Go 1.22 之前，`for` 循环的迭代变量在整个循环中共享同一个变量；从 Go 1.22 开始，每次迭代创建独立的变量。这个变更修复了 Go 中最常见的 "陷阱" 之一。

::: details 点击展开代码：1. for 循环变量语义变更（重大变更）
```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// === 示例 1：闭包捕获循环变量 ===
	values := []int{1, 2, 3, 4, 5}
	var funcs []func()

	for _, v := range values {
		funcs = append(funcs, func() {
			fmt.Print(v, " ")
		})
	}

	fmt.Print("闭包结果: ")
	for _, f := range funcs {
		f()
	}
	fmt.Println()
	// Go 1.21 及之前: 5 5 5 5 5（所有闭包捕获同一个变量，循环结束时 v=5）
	// Go 1.22 及之后: 1 2 3 4 5（每次迭代 v 是独立变量）

	// === 示例 2：goroutine 中的循环变量 ===
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ")
		}()
	}
	wg.Wait()
	fmt.Println()
	// Go 1.21 及之前: 可能输出 5 5 5 5 5（数据竞争）
	// Go 1.22 及之后: 输出 0~4 的某种排列（每次迭代 i 独立）

	// === 示例 3：旧版本中的常见修复方式（Go 1.22 后不再需要） ===
	for _, v := range values {
		v := v // Go 1.22 之前需要这行"影子变量"来避免问题 // [!code --]
		go func() {
			fmt.Print(v, " ")
		}()
		_ = v
	}
}
```
:::

> **讲解重点**
>
> - **旧行为（Go 1.21 及之前）**：`for` 循环的迭代变量（`i`、`v` 等）在整个循环生命周期内是同一个变量，每次迭代只是更新其值。闭包和 goroutine 捕获的是变量的引用，不是值。
> - **新行为（Go 1.22 及之后）**：每次迭代都创建新的变量实例，闭包和 goroutine 自然捕获到正确的值。
> - 此变更通过 `go.mod` 中的 `go` 指令控制：`go 1.22` 及以上启用新行为。
> - 旧代码中 `v := v` 的"影子变量"技巧在 Go 1.22 后不再需要（但保留也不会出错）。
> - **这是一个破坏性变更**，但实际上修复的是之前的"错误行为"，极少有代码依赖旧的语义。

---

### 2. `net/http` 路由增强

Go 1.22 大幅增强了标准库 `http.ServeMux` 的路由能力，支持 HTTP 方法匹配和路径参数。这使得许多简单项目不再需要第三方路由库。

::: details 点击展开代码：2. net/http 路由增强
```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// 方法匹配：只处理特定 HTTP 方法
	mux.HandleFunc("GET /users", listUsers)   // [!code ++]
	mux.HandleFunc("POST /users", createUser) // [!code ++]

	// 路径参数：使用 {name} 语法
	mux.HandleFunc("GET /users/{id}", getUser) // [!code ++]
	mux.HandleFunc("PUT /users/{id}", updateUser)
	mux.HandleFunc("DELETE /users/{id}", deleteUser)

	// 嵌套路径参数
	mux.HandleFunc("GET /users/{userId}/posts/{postId}", getUserPost)

	// 通配符：{path...} 匹配剩余所有路径段
	mux.HandleFunc("GET /files/{path...}", serveFile)

	// 精确匹配 vs 前缀匹配
	// 末尾带 / 的模式匹配该路径及其所有子路径
	// 末尾带 {$} 表示精确匹配，不匹配子路径
	mux.HandleFunc("GET /about/{$}", aboutPage)     // 只匹配 /about/
	mux.HandleFunc("GET /about/team", aboutTeam)     // 匹配 /about/team

	fmt.Println("服务器启动在 :8080")
	http.ListenAndServe(":8080", mux)
}

func listUsers(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "用户列表")
}

func createUser(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "创建用户")
}

func getUser(w http.ResponseWriter, r *http.Request) {
	// 使用 PathValue 获取路径参数
	id := r.PathValue("id")
	fmt.Fprintf(w, "获取用户: %s\n", id)
}

func updateUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	fmt.Fprintf(w, "更新用户: %s\n", id)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	fmt.Fprintf(w, "删除用户: %s\n", id)
}

func getUserPost(w http.ResponseWriter, r *http.Request) {
	userId := r.PathValue("userId")
	postId := r.PathValue("postId")
	fmt.Fprintf(w, "用户 %s 的帖子 %s\n", userId, postId)
}

func serveFile(w http.ResponseWriter, r *http.Request) {
	// {path...} 捕获剩余所有路径
	path := r.PathValue("path")
	fmt.Fprintf(w, "文件路径: %s\n", path)
}

func aboutPage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "关于页面")
}

func aboutTeam(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "团队介绍")
}
```
:::

> **讲解重点**
>
> - 路由模式格式：`"METHOD /path/{param}"`，METHOD 可选。
> - `r.PathValue("param")` 获取路径参数值。
> - `{name...}` 通配符匹配剩余所有路径段。
> - `{$}` 后缀表示精确匹配（不匹配子路径）。
> - 路由优先级：更具体的模式优先于更通用的模式。
> - 对于简单的 REST API，不再需要 `gorilla/mux` 或 `chi` 等第三方库。

---

### 3. `math/rand/v2` 新随机数 API

Go 1.22 引入了 `math/rand/v2` 包，改进了 API 设计，默认自动初始化种子，并新增了更多分布函数。

::: details 点击展开代码：3. math/rand/v2 新随机数 API
```go
package main

import (
	"fmt"
	"math/rand/v2"
)

func main() {
	// 无需手动设置种子，默认自动初始化

	// 基本随机数生成
	fmt.Println("随机整数:", rand.Int())
	fmt.Println("随机 int32:", rand.Int32())
	fmt.Println("随机 int64:", rand.Int64())
	fmt.Println("随机 uint64:", rand.Uint64())

	// IntN 替代旧版 Intn（更好的命名）
	fmt.Println("0~99 随机数:", rand.IntN(100)) // [!code ++]

	// 随机浮点数
	fmt.Println("随机 float64:", rand.Float64())

	// N[T] 泛型函数：适用于任意整数类型
	var n int8 = rand.N[int8](100) // [!code ++]
	fmt.Println("随机 int8:", n)

	// 使用特定的随机源
	src := rand.NewPCG(42, 99) // PCG 是新的默认随机算法
	rng := rand.New(src)
	fmt.Println("PCG 随机数:", rng.IntN(1000))
}
```
:::

> **讲解重点**
>
> - `math/rand/v2` 默认自动使用安全种子，不再需要 `rand.Seed(time.Now().UnixNano())`。
> - `Intn` 改名为 `IntN`，`Int31n` 改名为 `Int32N`，命名更一致。
> - 新增泛型函数 `rand.N[T](n)`，支持任意整数类型。
> - 默认算法从 `Source` 换为更高效的 PCG 和 ChaCha8。

---

### 4. `range` 支持整数

Go 1.22 允许 `range` 直接迭代整数，`for i := range n` 等价于 `for i := 0; i < n; i++`。

::: details 点击展开代码：4. range 支持整数
```go
package main

import "fmt"

func main() {
	// range 整数：从 0 到 n-1
	fmt.Print("range 5: ")
	for i := range 5 { // [!code ++]
		fmt.Print(i, " ") // 0 1 2 3 4
	}
	fmt.Println()

	// 实际用途：重复操作
	fmt.Print("重复 3 次: ")
	for range 3 { // [!code ++]
		fmt.Print("Go! ")
	}
	fmt.Println()

	// 生成序列
	squares := make([]int, 10)
	for i := range 10 {
		squares[i] = i * i
	}
	fmt.Println("平方数:", squares)
}
```
:::

> **讲解重点**
>
> - `for i := range n` 中 `n` 必须是整数类型，迭代范围是 `[0, n)`。
> - `for range n` 省略变量，只执行 n 次循环体。
> - 这是一个纯语法糖，行为等价于传统 `for` 循环，但更简洁。

---

### 5. `slices.Concat` 等新增函数

Go 1.22 为 `slices` 包新增了若干实用函数。

::: details 点击展开代码：5. slices.Concat 等新增函数
```go
package main

import (
	"fmt"
	"slices"
)

func main() {
	// slices.Concat：拼接多个 slice
	a := []int{1, 2}
	b := []int{3, 4}
	c := []int{5, 6}
	result := slices.Concat(a, b, c)
	fmt.Println("Concat:", result) // [1 2 3 4 5 6]

	// 与 append 的区别：Concat 不修改原 slice，总是返回新的
	fmt.Println("原始 a:", a) // [1 2]（未被修改）
}
```
:::

> **讲解重点**
>
> - `slices.Concat` 将多个 slice 合并为一个新 slice，不修改原始 slice。
> - 相比 `append(append(a, b...), c...)`，`Concat` 更安全（不会意外修改底层数组）且更易读。

---

## Go 1.23（2024.08）

Go 1.23 引入了 **`range over func`** 这一重大语言特性，让自定义类型可以被 `for-range` 遍历。同时新增了 `unique` 包和多项标准库改进。

### 1. `range over func` 迭代器（重大特性）

::: tip 建议
迭代器是 Go 1.23 最重要的新特性，建议优先学习。标准库的 `maps.Keys()`、`maps.Values()`、`slices.All()` 等函数已返回迭代器，掌握迭代器模式是使用现代 Go 标准库的基础。
:::

Go 1.23 引入了函数迭代器，允许 `for-range` 循环遍历函数。迭代器函数接受一个 `yield` 回调，每次调用 `yield` 产出一个值。标准库新增 `iter` 包定义了 `Seq[V]` 和 `Seq2[K, V]` 两种迭代器类型。

::: details 点击展开代码：1. range over func 迭代器（重大特性）
```go
package main

import (
	"fmt"
	"iter"
	"slices"
)

// === 基础：理解迭代器签名 ===
// iter.Seq[V]  等价于 func(yield func(V) bool)
// iter.Seq2[K,V] 等价于 func(yield func(K, V) bool)

// 示例 1：生成斐波那契数列的迭代器
func Fibonacci(n int) iter.Seq[int] {
	return func(yield func(int) bool) {
		a, b := 0, 1
		for i := 0; i < n; i++ {
			if !yield(a) {
				return // 消费者调用 break 时 yield 返回 false
			}
			a, b = b, a+b
		}
	}
}

// 示例 2：过滤迭代器（高阶迭代器）
func Filter[V any](seq iter.Seq[V], predicate func(V) bool) iter.Seq[V] {
	return func(yield func(V) bool) {
		for v := range seq {
			if predicate(v) {
				if !yield(v) {
					return
				}
			}
		}
	}
}

// 示例 3：映射迭代器
func Map[V, R any](seq iter.Seq[V], transform func(V) R) iter.Seq[R] {
	return func(yield func(R) bool) {
		for v := range seq {
			if !yield(transform(v)) {
				return
			}
		}
	}
}

// 示例 4：自定义集合类型的迭代器
type Set[T comparable] struct {
	items map[T]struct{}
}

func NewSet[T comparable](items ...T) *Set[T] {
	s := &Set[T]{items: make(map[T]struct{})}
	for _, item := range items {
		s.items[item] = struct{}{}
	}
	return s
}

// All 返回集合中所有元素的迭代器
func (s *Set[T]) All() iter.Seq[T] {
	return func(yield func(T) bool) {
		for item := range s.items {
			if !yield(item) {
				return
			}
		}
	}
}

// 示例 5：Seq2 双值迭代器 — 带索引的枚举
func Enumerate[V any](seq iter.Seq[V]) iter.Seq2[int, V] {
	return func(yield func(int, V) bool) {
		i := 0
		for v := range seq {
			if !yield(i, v) {
				return
			}
			i++
		}
	}
}

func main() {
	// 使用斐波那契迭代器
	fmt.Print("斐波那契(10): ")
	for v := range Fibonacci(10) {
		fmt.Print(v, " ") // 0 1 1 2 3 5 8 13 21 34
	}
	fmt.Println()

	// 提前退出（break）
	fmt.Print("前 5 个斐波那契: ")
	count := 0
	for v := range Fibonacci(100) {
		if count >= 5 {
			break // yield 返回 false，迭代器退出
		}
		fmt.Print(v, " ")
		count++
	}
	fmt.Println()

	// 组合迭代器：过滤偶数
	evenFib := Filter(Fibonacci(15), func(v int) bool {
		return v%2 == 0
	})
	fmt.Print("偶数斐波那契: ")
	for v := range evenFib {
		fmt.Print(v, " ") // 0 2 8 34 144
	}
	fmt.Println()

	// 组合迭代器：映射 + 过滤
	doubled := Map(Fibonacci(8), func(v int) int {
		return v * 2
	})
	fmt.Print("翻倍斐波那契: ")
	for v := range doubled {
		fmt.Print(v, " ") // 0 2 2 4 6 10 16 26
	}
	fmt.Println()

	// 将迭代器收集为 slice
	fibSlice := slices.Collect(Fibonacci(7))
	fmt.Println("收集为 slice:", fibSlice) // [0 1 1 2 3 5 8]

	// 自定义集合的迭代器
	fruits := NewSet("apple", "banana", "cherry")
	fmt.Print("集合元素: ")
	for item := range fruits.All() {
		fmt.Print(item, " ")
	}
	fmt.Println()

	// Seq2 双值迭代器
	fmt.Println("带索引的斐波那契:")
	for i, v := range Enumerate(Fibonacci(5)) {
		fmt.Printf("  [%d] = %d\n", i, v)
	}
}
```
:::

> **讲解重点**
>
> - 迭代器函数签名：`func(yield func(V) bool)`，每次调用 `yield(v)` 将值 `v` 产出给 `for-range`。
> - 当消费者执行 `break` 时，`yield` 返回 `false`，迭代器应当立即停止并返回。
> - `iter.Seq[V]` 用于单值迭代，`iter.Seq2[K, V]` 用于键值对迭代（类似 `range map`）。
> - 迭代器天然支持惰性求值、组合（过滤、映射、链接等函数式模式）。
> - `slices.Collect()` 可将迭代器收集为 slice。
> - 标准库的 `maps.Keys()`、`maps.Values()`、`slices.All()` 等函数已返回迭代器。

---

### 2. `unique` 包 — 字符串 interning

Go 1.23 新增 `unique` 包，提供值的规范化（interning）功能。相同值只保存一份，可以用 `==` 快速比较。

::: details 点击展开代码：2. unique 包 — 字符串 interning
```go
package main

import (
	"fmt"
	"unique"
)

func main() {
	// Make 将值规范化，返回 Handle
	h1 := unique.Make("hello")
	h2 := unique.Make("hello")
	h3 := unique.Make("world")

	// 相同值的 Handle 可以直接用 == 比较（O(1) 而非 O(n)）
	fmt.Println("h1 == h2:", h1 == h2) // true（同一个 "hello"）
	fmt.Println("h1 == h3:", h1 == h3) // false

	// 通过 Value() 获取原始值
	fmt.Println("h1 的值:", h1.Value()) // hello

	// 适用于任何 comparable 类型
	n1 := unique.Make(42)
	n2 := unique.Make(42)
	fmt.Println("n1 == n2:", n1 == n2) // true
}
```
:::

> **讲解重点**
>
> - `unique.Make(v)` 返回一个 `Handle[T]`，相同值的 Handle 指向同一份内存。
> - Handle 之间用 `==` 比较是指针比较，时间复杂度 O(1)，比字符串比较更快。
> - 适合大量重复字符串的场景（如 HTTP Header 名称、JSON 键名），可以节省内存并加速比较。
> - 底层使用弱引用，不再使用的值会被垃圾回收。

---

### 3. Timer/Ticker 行为变更

::: warning 注意
此变更通过 `go.mod` 中 `go 1.23` 指令启用。升级后，之前手动排空 Timer channel 的代码不再必要，但保留也不会出错。
:::

Go 1.23 改进了 `time.Timer` 和 `time.Ticker` 的垃圾回收行为。

::: details 点击展开代码：3. Timer/Ticker 行为变更
```go
package main

import (
	"fmt"
	"time"
)

func main() {
	// Go 1.23 起，未 Stop 的 Timer/Ticker 可以被垃圾回收
	// 之前版本：未 Stop 的 Timer 会泄漏 goroutine

	// 示例：创建 Timer 后不调用 Stop 也不会泄漏
	t := time.NewTimer(time.Hour)
	_ = t // 即使不 Stop，GC 也能回收

	// Stop 后的 channel 行为也有改进
	timer := time.NewTimer(50 * time.Millisecond)
	time.Sleep(100 * time.Millisecond)

	// Go 1.23 起，Stop 返回 false 后 channel 已自动清空
	// 不再需要以下排空操作：
	// if !timer.Stop() {
	//     <-timer.C  // Go 1.23 前需要这一步排空 channel
	// }
	timer.Stop()

	fmt.Println("Timer/Ticker 行为改进完成")
}
```
:::

> **讲解重点**
>
> - Go 1.23 之前，未调用 `Stop()` 的 `Timer`/`Ticker` 无法被垃圾回收，会导致资源泄漏。
> - Go 1.23 起，不再使用的 `Timer`/`Ticker` 会被自动回收，即使没有调用 `Stop()`。
> - `Stop()` 后不再需要手动排空 channel，简化了使用方式。
> - 此变更通过 `go.mod` 中 `go 1.23` 指令启用。

---

### 4. `slices`/`maps` 包新增函数

Go 1.23 为 `slices` 和 `maps` 包新增了多个实用函数，并将部分函数的返回值改为迭代器。

::: details 点击展开代码：4. slices/maps 包新增函数
```go
package main

import (
	"fmt"
	"maps"
	"slices"
)

func main() {
	// slices.All：返回 (index, value) 迭代器
	fruits := []string{"apple", "banana", "cherry"}
	for i, v := range slices.All(fruits) {
		fmt.Printf("  [%d] %s\n", i, v)
	}

	// slices.Values：返回值迭代器
	fmt.Print("值迭代: ")
	for v := range slices.Values(fruits) {
		fmt.Print(v, " ")
	}
	fmt.Println()

	// slices.Backward：反向迭代
	fmt.Print("反向迭代: ")
	for _, v := range slices.Backward(fruits) {
		fmt.Print(v, " ")
	}
	fmt.Println()

	// slices.Collect：将迭代器收集为 slice
	collected := slices.Collect(slices.Values(fruits))
	fmt.Println("收集:", collected)

	// slices.AppendSeq：将迭代器追加到已有 slice
	base := []string{"start"}
	extended := slices.AppendSeq(base, slices.Values(fruits))
	fmt.Println("追加:", extended)

	// slices.Chunk：将 slice 分块
	nums := []int{1, 2, 3, 4, 5, 6, 7}
	for chunk := range slices.Chunk(nums, 3) {
		fmt.Println("分块:", chunk) // [1 2 3], [4 5 6], [7]
	}

	// slices.Repeat：重复 slice
	repeated := slices.Repeat([]int{1, 2}, 3)
	fmt.Println("重复:", repeated) // [1 2 1 2 1 2]

	// slices.SortedFunc：从迭代器中排序收集
	m := map[string]int{"banana": 2, "apple": 1, "cherry": 3}
	sortedKeys := slices.Sorted(maps.Keys(m))
	fmt.Println("排序后的键:", sortedKeys)

	// maps.Collect：从迭代器构建 map
	pairs := maps.All(m)
	newMap := maps.Collect(pairs)
	fmt.Println("收集的 map:", newMap)

	// maps.Insert：批量插入
	target := map[string]int{"x": 10}
	maps.Insert(target, maps.All(m))
	fmt.Println("插入后:", target)
}
```
:::

> **讲解重点**
>
> - `slices.All()`、`slices.Values()`、`slices.Backward()` 返回迭代器，与 `range over func` 配合使用。
> - `slices.Chunk()` 将 slice 按指定大小分块，返回迭代器，适合批处理场景。
> - `slices.Collect()` 和 `maps.Collect()` 将迭代器转换为具体的 slice 或 map。
> - `maps.Keys()` 和 `maps.Values()` 在 Go 1.23 中改为返回迭代器（不再返回 slice）。

---

## Go 1.24（2025.02）

Go 1.24 引入了泛型类型别名、弱指针、新的文件系统限制 API 等特性，并在工具链和密码学库方面做了大量改进。

### 1. 泛型类型别名（Generic Type Aliases）

Go 1.24 允许类型别名使用类型参数，使泛型代码的类型定义更加灵活。

::: details 点击展开代码：1. 泛型类型别名（Generic Type Aliases）
```go
package main

import "fmt"

// 泛型类型别名：为复杂的泛型类型创建简短别名
type Pair[A, B any] = struct { // [!code ++]
	First  A
	Second B
}

// 为常用的泛型实例化创建别名
type StringPair = Pair[string, string]
type IntStringPair = Pair[int, string]

// 泛型类型别名可以引用其他包的泛型类型
// type MySlice[T any] = slices.Slice[T]  // 假设 slices 有这样的类型

// 实际用途：简化回调签名
type Handler[T any] = func(T) error           // [!code ++]
type Middleware[T any] = func(Handler[T]) Handler[T] // [!code ++]

func applyMiddleware[T any](h Handler[T], mws ...Middleware[T]) Handler[T] {
	for i := len(mws) - 1; i >= 0; i-- {
		h = mws[i](h)
	}
	return h
}

func main() {
	// 使用泛型类型别名
	p1 := Pair[int, string]{First: 1, Second: "hello"}
	fmt.Println("Pair:", p1)

	p2 := StringPair{First: "key", Second: "value"}
	fmt.Println("StringPair:", p2)

	// 使用 Handler 别名
	var h Handler[string] = func(s string) error {
		fmt.Println("处理:", s)
		return nil
	}

	logging := func(next Handler[string]) Handler[string] {
		return func(s string) error {
			fmt.Println("日志: 开始处理")
			err := next(s)
			fmt.Println("日志: 处理完成")
			return err
		}
	}

	wrapped := applyMiddleware(h, logging)
	wrapped("测试数据")
}
```
:::

> **讲解重点**
>
> - 泛型类型别名格式：`type Name[T any] = ExistingType[T]`，注意有 `=` 号（别名而非新类型）。
> - 类型别名不创建新类型，只是为现有类型提供另一个名称。
> - 常见用途：简化冗长的泛型类型签名、为特定类型参数创建便捷别名。
> - Go 1.23 中此特性处于实验阶段（需要 `GOEXPERIMENT=aliastypeparams`），Go 1.24 正式启用。

---

### 2. `go tool` 工具链改进

::: tip 建议
`tool` 指令替代了之前 `tools.go` 文件 + `//go:build ignore` 的 hack 方式，建议新项目直接采用此方式管理工具依赖。
:::

Go 1.24 改进了工具依赖管理，`go.mod` 中可以声明 `tool` 指令来追踪项目使用的工具。

::: details 点击展开代码：2. go tool 工具链改进
```go
// go.mod 示例
module myproject

go 1.24

// 新增 tool 指令，声明项目依赖的工具
tool (
    golang.org/x/tools/cmd/stringer
    github.com/golangci/golangci-lint/cmd/golangci-lint
    honnef.co/go/tools/cmd/staticcheck
)

require (
    golang.org/x/tools v0.28.0
    // ...
)
```
:::

::: details 点击展开代码：2. go tool 工具链改进
```bash
# 运行声明的工具
go tool stringer -type=Color
go tool golangci-lint run ./...

# 添加新的工具依赖
go get -tool github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```
:::

> **讲解重点**
>
> - `tool` 指令替代了之前 `tools.go` 文件 + `//go:build ignore` 的 hack 方式。
> - 工具版本由 `go.mod` 和 `go.sum` 管理，确保团队成员使用一致的工具版本。
> - `go tool <name>` 直接运行已声明的工具，无需预先 `go install`。
> - 使用 `go get -tool` 添加新的工具依赖。

---

### 3. `os.Root` 类型 — 限制文件系统访问

Go 1.24 新增 `os.Root` 类型，提供受限的文件系统访问能力，防止路径遍历攻击。

::: details 点击展开代码：3. os.Root 类型 — 限制文件系统访问
```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 创建一个限制在指定目录下的 Root
	root, err := os.OpenRoot("/tmp/sandbox")
	if err != nil {
		fmt.Println("打开 Root 失败:", err)
		return
	}
	defer root.Close()

	// 在 Root 范围内创建文件（安全）
	f, err := root.Create("data.txt")
	if err != nil {
		fmt.Println("创建文件失败:", err)
		return
	}
	f.WriteString("hello from sandbox")
	f.Close()

	// 在 Root 范围内打开文件
	f2, err := root.Open("data.txt")
	if err != nil {
		fmt.Println("打开文件失败:", err)
		return
	}
	defer f2.Close()

	buf := make([]byte, 100)
	n, _ := f2.Read(buf)
	fmt.Println("读取内容:", string(buf[:n]))

	// 路径遍历尝试会被阻止
	_, err = root.Open("../../etc/passwd")
	if err != nil {
		fmt.Println("路径遍历被阻止:", err) // 会返回错误
	}

	// 也可以使用其他文件操作
	err = root.Mkdir("subdir", 0o755)
	if err == nil {
		fmt.Println("子目录创建成功")
	}

	// 获取文件信息
	info, err := root.Stat("data.txt")
	if err == nil {
		fmt.Printf("文件大小: %d 字节\n", info.Size())
	}
}
```
:::

> **讲解重点**
>
> - `os.OpenRoot(dir)` 创建一个以 `dir` 为根的受限文件系统视图。
> - 所有通过 `Root` 执行的文件操作都限制在该目录及其子目录内。
> - `../` 等路径遍历尝试会被自动检测并拒绝，防止目录逃逸。
> - 适用于处理用户上传文件、沙箱环境、多租户文件隔离等安全场景。
> - 支持 `Open`、`Create`、`Mkdir`、`Remove`、`Stat` 等常用文件操作。

---

### 4. 弱指针 `weak` 包

Go 1.24 新增 `weak` 包，提供弱指针（弱引用）支持。弱指针不阻止垃圾回收器回收其指向的对象。

::: details 点击展开代码：4. 弱指针 weak 包
```go
package main

import (
	"fmt"
	"runtime"
	"weak"
)

func main() {
	// 创建一个对象
	data := new(string)
	*data = "important data"

	// 创建弱指针
	wp := weak.Make(data)

	// 弱指针可以获取原始指针
	if ptr := wp.Value(); ptr != nil {
		fmt.Println("弱指针有效:", *ptr) // important data
	}

	// 移除强引用
	data = nil

	// 强制垃圾回收
	runtime.GC()

	// 对象可能已被回收，弱指针返回 nil
	if ptr := wp.Value(); ptr != nil {
		fmt.Println("对象仍然存在:", *ptr)
	} else {
		fmt.Println("对象已被回收") // 很可能输出这个
	}

	// 弱指针的典型应用场景：缓存
	// 配合 unique 包可实现高效的规范化缓存
}
```
:::

> **讲解重点**
>
> - `weak.Make(ptr)` 创建弱指针，`wp.Value()` 获取原始指针（可能为 nil）。
> - 弱指针不会阻止 GC 回收对象，当所有强引用消失后对象可能被回收。
> - 适用于缓存、观察者模式等场景，避免内存泄漏。
> - `unique` 包内部就使用了弱指针来实现值的自动清理。

---

### 5. `runtime.AddCleanup` 替代 `runtime.SetFinalizer`

Go 1.24 新增 `runtime.AddCleanup`，作为 `runtime.SetFinalizer` 的改进替代方案。

::: details 点击展开代码：5. runtime.AddCleanup 替代 runtime.SetFinalizer
```go
package main

import (
	"fmt"
	"runtime"
)

type Resource struct {
	Name string
	fd   int // 模拟文件描述符
}

func NewResource(name string, fd int) *Resource {
	r := &Resource{Name: name, fd: fd}

	// 新方式：AddCleanup（Go 1.24）
	// 清理函数接收一个独立的值，不引用 Resource 本身
	runtime.AddCleanup(r, func(fd int) {
		fmt.Printf("清理资源: fd=%d\n", fd)
		// 关闭文件描述符等操作
	}, r.fd)

	// 可以为同一个对象注册多个清理函数
	runtime.AddCleanup(r, func(name string) {
		fmt.Printf("记录日志: 资源 %s 被回收\n", name)
	}, r.Name)

	return r
}

func main() {
	r := NewResource("database-connection", 42)
	fmt.Println("使用资源:", r.Name)

	// 移除引用
	r = nil

	// 强制 GC，触发清理函数
	runtime.GC()
	runtime.GC() // 多次 GC 确保清理执行

	fmt.Println("程序结束")
}
```
:::

> **讲解重点**
>
> - `runtime.AddCleanup(ptr, cleanup, arg)` 为对象注册清理函数，GC 回收对象时自动调用。
> - 与 `SetFinalizer` 的关键区别：
>   - 支持为同一对象注册**多个**清理函数。
>   - 清理函数接收独立参数（不是对象本身），避免意外延长对象生命周期。
>   - 不会导致对象"复活"（SetFinalizer 可能让对象再次可达）。
>   - 清理函数的执行不影响对象的回收。
> - `runtime.SetFinalizer` 已被标记为不推荐使用，新代码应使用 `AddCleanup`。

---

### 6. `crypto` 包增强 — FIPS 140 支持

Go 1.24 的 `crypto` 包增加了 FIPS 140-3 合规模式支持，通过环境变量 `GOEXPERIMENT=systemcrypto` 可以使用操作系统提供的经认证的密码学实现。

::: details 点击展开代码：6. crypto 包增强 — FIPS 140 支持
```bash
# 启用 FIPS 140 模式编译
GOEXPERIMENT=systemcrypto go build -o myapp .

# 运行时检查 FIPS 模式
GODEBUG=fips140=on ./myapp
```
:::

> **讲解重点**
>
> - 面向金融、政府等对密码学合规有要求的场景。
> - 启用后，Go 的 `crypto` 包会使用操作系统的 FIPS 认证密码学模块。
> - 新增 `crypto/fips140` 包用于查询和验证 FIPS 模式状态。

---

### 7. `testing/synctest` 实验性包

::: tip 提示
`testing/synctest` 目前仍为实验性 API，需要 `GOEXPERIMENT=synctest` 编译标签才能使用，API 可能在后续版本中变更。
:::

Go 1.24 引入实验性的 `testing/synctest` 包，帮助测试并发代码。

::: details 点击展开代码：7. testing/synctest 实验性包
```go
// 注意：这是实验性 API，需要 GOEXPERIMENT=synctest 启用
package main

// import "testing/synctest"

// 基本用法概念示例
// func TestConcurrent(t *testing.T) {
//     synctest.Run(func() {
//         // 在这个虚拟时间环境中：
//         // - time.Sleep 不会真正等待
//         // - 可以精确控制 goroutine 的调度顺序
//
//         go func() {
//             time.Sleep(time.Hour) // 不会真正等一小时
//             // ... 执行逻辑
//         }()
//
//         // synctest.Wait() 等待所有 goroutine 到达稳定状态
//         synctest.Wait()
//
//         // 验证结果
//     })
// }

func main() {
	// synctest 目前仅在测试中可用
	// 需要 GOEXPERIMENT=synctest 编译标签
	println("testing/synctest 是 Go 1.24 的实验性包")
	println("用于在虚拟时间中测试并发代码")
}
```
:::

> **讲解重点**
>
> - `synctest.Run()` 创建一个虚拟时间环境，`time.Sleep` 等操作不会真正等待。
> - `synctest.Wait()` 等待所有 goroutine 到达阻塞状态，方便验证中间状态。
> - 解决了并发代码测试中"等多久才够"的经典问题。
> - 目前仍为实验性质，需要 `GOEXPERIMENT=synctest` 启用。

---

## 版本升级建议

### 每个版本最需要注意的破坏性变更

| 版本 | 破坏性变更 | 影响级别 | 说明 |
|------|-----------|---------|------|
| Go 1.21 | `panic(nil)` 行为变更 | 中 | `recover()` 不再返回 `nil`，改为返回 `*runtime.PanicNilError` |
| Go 1.22 | `for` 循环变量语义变更 | **高** | 每次迭代创建新变量，极少数依赖旧行为的代码会受影响 |
| Go 1.22 | `net/http` 路由优先级 | 低 | 更具体的模式优先匹配，可能改变已有路由行为 |
| Go 1.23 | `Timer`/`Ticker` 行为变更 | 中 | Stop 后 channel 自动清空，之前手动排空的代码不受影响 |
| Go 1.24 | `runtime.SetFinalizer` 废弃 | 低 | 仍然可用，但推荐迁移到 `AddCleanup` |

### 推荐的最低生产版本

::: tip 建议
推荐使用 Go 1.23 或更高版本作为生产环境的最低版本。如果项目需要泛型类型别名、弱指针等最新特性，可以升级到 Go 1.24。
:::

**推荐使用 Go 1.23 或更高版本**作为生产环境的最低版本：

- Go 1.23 包含了 `for` 循环变量修复（Go 1.22 引入），经过一个版本的验证更加稳定。
- 迭代器模式让代码更现代化，标准库也开始广泛使用。
- Timer/Ticker 改进消除了一类常见的资源泄漏问题。

如果项目需要最新特性（泛型类型别名、弱指针等），可以升级到 Go 1.24。

::: warning 注意
升级 `go` 指令版本前，应先阅读对应版本的 Release Notes，了解行为变更。建议渐进式升级：先升级编译器，运行测试通过后再升级 `go.mod` 中的版本号。
:::

### 使用 `go.mod` 的 `go` 指令控制语言特性

::: details 点击展开代码：使用 go.mod 的 go 指令控制语言特性
```go
// go.mod
module myproject

go 1.23  // 指定最低 Go 版本

// go 指令的作用：
// 1. 控制语言特性的启用
//    - go 1.22：启用新的 for 循环变量语义
//    - go 1.23：启用 range over func、Timer/Ticker 新行为
//    - go 1.24：启用泛型类型别名
//
// 2. 控制标准库行为
//    - 某些标准库的行为变更通过 go 指令版本门控
//
// 3. 不影响编译器版本
//    - go 1.23 的 go.mod 可以用 Go 1.24 的编译器编译
//    - 但不会启用 Go 1.24 的新语言特性
```
:::

::: details 点击展开代码：使用 go.mod 的 go 指令控制语言特性
```bash
# 查看当前项目的 Go 版本要求
go mod edit -json | jq .Go

# 升级 go 指令版本
go mod edit -go=1.23

# 升级所有依赖到最新版本
go get -u ./...

# 整理 go.mod（移除不需要的依赖）
go mod tidy

# 检查是否使用了当前 go 版本不支持的特性
go vet ./...
```
:::

> **讲解重点**
>
> - `go.mod` 中的 `go` 指令是**语言版本**，不是编译器版本。用 Go 1.24 编译器处理 `go 1.22` 的模块时，只启用 Go 1.22 的语言特性。
> - 升级 `go` 指令版本前，应先阅读对应版本的 Release Notes，了解行为变更。
> - 建议渐进式升级：先升级编译器，运行测试通过后再升级 `go.mod` 中的版本号。
> - `go` 指令版本也决定了依赖解析行为：如果依赖模块要求更高版本，`go mod tidy` 会自动提升。
