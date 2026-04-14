---
title: 中间件、JSON 编解码与文件 IO
description: Go 标准库工程专题，整理中间件设计、JSON 编解码细节与文件 IO 处理实践。
search: false
---

# 中间件、JSON 编解码与文件 IO

这一页收拢标准库里偏工程侧的常用能力，包括中间件组织、JSON 编解码细节，以及文件与 IO 处理。

## 本页内容

- [8. 中间件设计](#_8-中间件设计)
- [9. JSON 编解码](#_9-json-编解码)
- [10. 文件与 IO](#_10-文件与-io)

---

## 8. 中间件设计

中间件（Middleware）是 Go HTTP 服务中最重要的设计模式之一，用于在请求处理前后注入通用逻辑。

### 中间件基本模式

::: details 点击展开代码：中间件基本模式
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// Middleware 类型：接收一个 Handler，返回一个新的 Handler
type Middleware func(http.Handler) http.Handler

// LoggingMiddleware 日志中间件
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 用 ResponseRecorder 捕获状态码
		rec := &statusRecorder{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(rec, r) // 调用下一层

		log.Printf("[%s] %s %s %d %v",
			r.Method, r.URL.Path, r.RemoteAddr,
			rec.statusCode, time.Since(start))
	})
}

type statusRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.statusCode = code
	r.ResponseWriter.WriteHeader(code)
}

// RecoveryMiddleware panic 恢复中间件
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// AuthMiddleware 认证中间件
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return // 不调用 next，终止链路
		}
		// 验证 token...
		next.ServeHTTP(w, r)
	})
}

// CORSMiddleware CORS 中间件
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Chain 将多个中间件串联
func Chain(handler http.Handler, middlewares ...Middleware) http.Handler {
	// 从后往前包裹，使得第一个中间件在最外层
	for i := len(middlewares) - 1; i >= 0; i-- {
		handler = middlewares[i](handler)
	}
	return handler
}

func main() {
	// 业务 Handler
	helloHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello, World!")
	})

	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("something went wrong")
	})

	mux := http.NewServeMux()

	// 手动嵌套
	mux.Handle("/hello", LoggingMiddleware(AuthMiddleware(helloHandler)))

	// 使用 Chain 函数组合（更清晰）
	mux.Handle("/api/hello", Chain(
		helloHandler,
		RecoveryMiddleware,
		LoggingMiddleware,
		CORSMiddleware,
		AuthMiddleware,
	))

	// 不需要认证的路由
	mux.Handle("/panic", Chain(
		panicHandler,
		RecoveryMiddleware,
		LoggingMiddleware,
	))

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", mux)
}
```
:::

### 带参数的中间件工厂

::: details 点击展开代码：带参数的中间件工厂
```go
package main

import (
	"fmt"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

// RateLimitMiddleware 限流中间件工厂
func RateLimitMiddleware(rps float64, burst int) func(http.Handler) http.Handler {
	limiter := rate.NewLimiter(rate.Limit(rps), burst)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow() {
				http.Error(w, "Too Many Requests", http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// TimeoutMiddleware 超时中间件工厂
func TimeoutMiddleware(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.TimeoutHandler(next, timeout, "Request Timeout")
	}
}

func main() {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "OK")
	})

	// 使用带参数的中间件
	limited := RateLimitMiddleware(10, 20)(handler)
	timed := TimeoutMiddleware(5 * time.Second)(limited)

	http.Handle("/", timed)

	fmt.Println("Server starting on :8080")
	http.ListenAndServe(":8080", nil)
}
```
:::

<GoNetworkDiagram kind="middleware-chain" />

**讲解重点：**

1. **中间件本质是函数装饰器**：接收 `http.Handler` 返回 `http.Handler`，在调用 `next.ServeHTTP` 前后注入逻辑。不调用 `next` 就终止了请求链路（如认证失败）。
2. **Chain 的顺序很重要**：Recovery 应该在最外层（最先执行），这样才能捕获所有内层的 panic。Logging 通常也在外层，以记录完整的请求生命周期。
3. **ResponseWriter 包装器**：标准 `http.ResponseWriter` 写入后无法读取状态码，需要用包装器（如 `statusRecorder`）拦截 `WriteHeader` 调用来记录。

---

## 9. JSON 编解码

`encoding/json` 是 Go 中最常用的序列化包，掌握它的细节能避免很多线上问题。

### 基本用法与 struct tags

::: details 点击展开代码：基本用法与 struct tags
```go
package main

import (
	"encoding/json"
	"fmt"
	"time"
)

type User struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email,omitempty"` // 空值不序列化
	Password  string    `json:"-"`               // 永远不序列化
	Age       int       `json:"age,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	IsAdmin   bool      `json:"is_admin"`
	Tags      []string  `json:"tags,omitempty"`
	Score     *float64  `json:"score,omitempty"` // 指针可以区分零值和缺失

	// 嵌入匿名结构体的字段会提升到外层
	Address `json:"address,omitempty"`
}

type Address struct {
	City    string `json:"city,omitempty"`
	Country string `json:"country,omitempty"`
}

func main() {
	score := 95.5
	user := User{
		ID:        1,
		Name:      "Alice",
		Email:     "alice@example.com",
		Password:  "secret123",     // 不会出现在 JSON 中
		Age:       0,               // omitempty，零值会被忽略
		CreatedAt: time.Now(),
		IsAdmin:   false,           // bool 零值 false 不会被 omitempty 忽略（因为无 omitempty）
		Score:     &score,
		Address:   Address{City: "Beijing", Country: "China"},
	}

	// Marshal：struct -> JSON
	data, err := json.Marshal(user)
	if err != nil {
		panic(err)
	}
	fmt.Println("Compact:", string(data))

	// MarshalIndent：格式化输出
	pretty, _ := json.MarshalIndent(user, "", "  ")
	fmt.Println("Pretty:", string(pretty))

	// Unmarshal：JSON -> struct
	jsonStr := `{
		"id": 2,
		"name": "Bob",
		"email": "bob@example.com",
		"created_at": "2024-01-01T00:00:00Z",
		"is_admin": true,
		"unknown_field": "this will be ignored"
	}`

	var user2 User
	if err := json.Unmarshal([]byte(jsonStr), &user2); err != nil {
		panic(err)
	}
	fmt.Printf("Parsed: %+v\n", user2)
	// 注意：unknown_field 被静默忽略了
}
```
:::

<GoNetworkDiagram kind="json-struct-tags" />

### 自定义 Marshaler / Unmarshaler

::: details 点击展开代码：自定义 Marshaler / Unmarshaler
```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// UnixTime 自定义类型：序列化为 Unix 时间戳
type UnixTime time.Time

func (t UnixTime) MarshalJSON() ([]byte, error) {
	stamp := time.Time(t).Unix()
	return json.Marshal(stamp)
}

func (t *UnixTime) UnmarshalJSON(data []byte) error {
	var stamp int64
	if err := json.Unmarshal(data, &stamp); err != nil {
		return err
	}
	*t = UnixTime(time.Unix(stamp, 0))
	return nil
}

func (t UnixTime) String() string {
	return time.Time(t).Format("2006-01-02 15:04:05")
}

// Status 枚举类型
type Status int

const (
	StatusActive   Status = 1
	StatusInactive Status = 2
	StatusBanned   Status = 3
)

var statusNames = map[Status]string{
	StatusActive:   "active",
	StatusInactive: "inactive",
	StatusBanned:   "banned",
}

var statusValues = map[string]Status{
	"active":   StatusActive,
	"inactive": StatusInactive,
	"banned":   StatusBanned,
}

func (s Status) MarshalJSON() ([]byte, error) {
	name, ok := statusNames[s]
	if !ok {
		return nil, fmt.Errorf("unknown status: %d", s)
	}
	return json.Marshal(name)
}

func (s *Status) UnmarshalJSON(data []byte) error {
	var name string
	if err := json.Unmarshal(data, &name); err != nil {
		return err
	}
	val, ok := statusValues[strings.ToLower(name)]
	if !ok {
		return fmt.Errorf("unknown status: %s", name)
	}
	*s = val
	return nil
}

type Event struct {
	Name      string   `json:"name"`
	Status    Status   `json:"status"`
	CreatedAt UnixTime `json:"created_at"`
}

func main() {
	event := Event{
		Name:      "deploy",
		Status:    StatusActive,
		CreatedAt: UnixTime(time.Now()),
	}

	data, _ := json.MarshalIndent(event, "", "  ")
	fmt.Println("Serialized:", string(data))
	// 输出：{"name":"deploy","status":"active","created_at":1700000000}

	// 反序列化
	jsonStr := `{"name":"rollback","status":"banned","created_at":1700000000}`
	var event2 Event
	json.Unmarshal([]byte(jsonStr), &event2)
	fmt.Printf("Deserialized: %+v\n", event2)
	fmt.Printf("Time: %s\n", event2.CreatedAt)
}
```
:::

### 流式解码（处理大 JSON）

::: details 点击展开代码：流式解码（处理大 JSON）
```go
package main

import (
	"encoding/json"
	"fmt"
	"strings"
)

type Record struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func main() {
	// 模拟一个大的 JSON 数组流
	jsonStream := `[
		{"id": 1, "name": "Alice"},
		{"id": 2, "name": "Bob"},
		{"id": 3, "name": "Charlie"},
		{"id": 4, "name": "Diana"}
	]`

	decoder := json.NewDecoder(strings.NewReader(jsonStream))

	// 读取开头的 '['
	token, err := decoder.Token()
	if err != nil {
		panic(err)
	}
	fmt.Println("Start:", token)

	// 逐个解码数组元素（内存友好）
	for decoder.More() {
		var record Record
		if err := decoder.Decode(&record); err != nil {
			panic(err)
		}
		fmt.Printf("Record: %+v\n", record)
	}

	// 读取结尾的 ']'
	token, _ = decoder.Token()
	fmt.Println("End:", token)

	// ========================================
	// json.Decoder 也常用于 HTTP 请求解码
	// ========================================
	// func handler(w http.ResponseWriter, r *http.Request) {
	//     var req MyRequest
	//     decoder := json.NewDecoder(r.Body)
	//     decoder.DisallowUnknownFields() // 严格模式：不允许未知字段
	//     if err := decoder.Decode(&req); err != nil {
	//         http.Error(w, err.Error(), http.StatusBadRequest)
	//         return
	//     }
	//     // 确保只有一个 JSON 对象
	//     if decoder.More() {
	//         http.Error(w, "unexpected extra data", http.StatusBadRequest)
	//         return
	//     }
	// }
}
```
:::

<GoNetworkDiagram kind="json-stream-decoder" />

**讲解重点：**

1. **`omitempty` 对不同类型的行为不同**：数值零值（0）、空字符串、nil 指针、空 slice/map 都被视为"空"而被忽略。但 `false` 对 bool 来说是零值，如果你的业务需要区分"未设置"和"false"，用 `*bool` 指针。
2. **实现 `json.Marshaler` / `json.Unmarshaler` 接口**可以完全控制序列化行为。常见场景：时间格式自定义、枚举字符串化、敏感字段脱敏。
3. **流式解码 `json.NewDecoder` vs `json.Unmarshal`**：对于大 JSON 文件或 HTTP 请求体，用 `Decoder` 可以边读边解析，不用把整个 JSON 加载到内存。`DisallowUnknownFields` 可以在 API 中启用严格校验。

---

## 10. 文件与 IO

Go 的 `io` 包围绕 `Reader` 和 `Writer` 两个接口构建了整个 IO 体系，这是理解标准库的关键。

### io.Reader / io.Writer 核心接口

::: details 点击展开代码：io.Reader / io.Writer 核心接口
```go
package main

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"
)

// io.Reader 接口：Read(p []byte) (n int, err error)
// io.Writer 接口：Write(p []byte) (n int, err error)
// 一切 IO 操作都基于这两个接口

func main() {
	// strings.Reader 实现了 io.Reader
	reader := strings.NewReader("Hello, Go IO!")

	// os.Stdout 实现了 io.Writer
	// io.Copy 是最通用的数据传输方式
	fmt.Println("=== io.Copy ===")
	io.Copy(os.Stdout, reader)
	fmt.Println()

	// bytes.Buffer 同时实现了 Reader 和 Writer
	fmt.Println("\n=== bytes.Buffer ===")
	var buf bytes.Buffer
	buf.WriteString("Hello ")
	buf.Write([]byte("World"))
	fmt.Println(buf.String())

	// io.MultiReader：串联多个 Reader
	fmt.Println("\n=== io.MultiReader ===")
	r1 := strings.NewReader("Part 1, ")
	r2 := strings.NewReader("Part 2, ")
	r3 := strings.NewReader("Part 3")
	multi := io.MultiReader(r1, r2, r3)
	io.Copy(os.Stdout, multi)
	fmt.Println()

	// io.TeeReader：读取同时写到另一个 Writer（类似 tee 命令）
	fmt.Println("\n=== io.TeeReader ===")
	original := strings.NewReader("important data")
	var backup bytes.Buffer
	tee := io.TeeReader(original, &backup)
	io.Copy(os.Stdout, tee) // 读取内容
	fmt.Println()
	fmt.Println("Backup:", backup.String()) // 同时写入了 backup

	// io.LimitReader：限制读取量
	fmt.Println("\n=== io.LimitReader ===")
	bigReader := strings.NewReader("This is a very long string that we want to limit")
	limited := io.LimitReader(bigReader, 10)
	data, _ := io.ReadAll(limited)
	fmt.Println("Limited:", string(data)) // 只读了 10 字节

	// io.Pipe：同步内存管道
	fmt.Println("\n=== io.Pipe ===")
	pr, pw := io.Pipe()
	go func() {
		defer pw.Close()
		for i := 0; i < 3; i++ {
			fmt.Fprintf(pw, "Line %d\n", i)
		}
	}()
	io.Copy(os.Stdout, pr)
}
```
:::

<GoNetworkDiagram kind="io-primitives" />

### bufio 缓冲 IO

::: details 点击展开代码：bufio 缓冲 IO
```go
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// === bufio.Scanner：按行读取（最常用） ===
	fmt.Println("=== Scanner ===")
	input := "line1\nline2\nline3\n"
	scanner := bufio.NewScanner(strings.NewReader(input))
	for scanner.Scan() {
		fmt.Println("Line:", scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Println("Scanner error:", err)
	}

	// 自定义分隔符
	fmt.Println("\n=== Custom split ===")
	csvData := "a,b,c,d,e"
	scanner2 := bufio.NewScanner(strings.NewReader(csvData))
	scanner2.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
		for i := 0; i < len(data); i++ {
			if data[i] == ',' {
				return i + 1, data[:i], nil
			}
		}
		if atEOF && len(data) > 0 {
			return len(data), data, nil
		}
		return 0, nil, nil
	})
	for scanner2.Scan() {
		fmt.Println("Token:", scanner2.Text())
	}

	// === bufio.Writer：缓冲写入 ===
	fmt.Println("\n=== Buffered Writer ===")
	writer := bufio.NewWriter(os.Stdout)
	writer.WriteString("buffered ")
	writer.WriteString("output ")
	writer.WriteString("here\n")
	writer.Flush() // 必须 Flush，否则数据还在缓冲区

	// === bufio.ReadWriter：同时缓冲读写 ===
	// 常用于网络连接的读写
}
```
:::

### 文件操作

::: details 点击展开代码：文件操作
```go
package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

func main() {
	tempDir := os.TempDir()
	testFile := filepath.Join(tempDir, "go_io_test.txt")

	// === 创建并写入文件 ===
	fmt.Println("=== Write File ===")
	f, err := os.Create(testFile)
	if err != nil {
		panic(err)
	}

	// 使用 bufio.Writer 提升写入性能
	writer := bufio.NewWriter(f)
	for i := 0; i < 5; i++ {
		fmt.Fprintf(writer, "Line %d: Hello, File IO!\n", i)
	}
	writer.Flush() // 把缓冲区刷到文件
	f.Close()

	// === 读取整个文件 ===
	fmt.Println("=== Read All ===")
	data, err := os.ReadFile(testFile)
	if err != nil {
		panic(err)
	}
	fmt.Print(string(data))

	// === 逐行读取文件 ===
	fmt.Println("=== Read Lines ===")
	f2, _ := os.Open(testFile)
	defer f2.Close()
	scanner := bufio.NewScanner(f2)
	lineNum := 0
	for scanner.Scan() {
		lineNum++
		fmt.Printf("%d: %s\n", lineNum, scanner.Text())
	}

	// === 追加写入 ===
	fmt.Println("\n=== Append ===")
	f3, _ := os.OpenFile(testFile, os.O_APPEND|os.O_WRONLY, 0644)
	f3.WriteString("Appended line\n")
	f3.Close()

	// === 文件复制（io.Copy） ===
	fmt.Println("=== Copy File ===")
	copyFile := filepath.Join(tempDir, "go_io_copy.txt")
	src, _ := os.Open(testFile)
	dst, _ := os.Create(copyFile)
	written, err := io.Copy(dst, src)
	src.Close()
	dst.Close()
	fmt.Printf("Copied %d bytes\n", written)

	// === 检查文件是否存在 ===
	if info, err := os.Stat(testFile); err == nil {
		fmt.Printf("File: %s, Size: %d, ModTime: %v\n", info.Name(), info.Size(), info.ModTime())
	}

	// === 遍历目录 ===
	fmt.Println("\n=== Walk Directory ===")
	filepath.WalkDir(tempDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() && path != tempDir {
			return filepath.SkipDir // 不递归子目录
		}
		if filepath.Ext(path) == ".txt" {
			fmt.Println("Found:", filepath.Base(path))
		}
		return nil
	})

	// === 临时文件 ===
	fmt.Println("\n=== Temp File ===")
	tmpFile, _ := os.CreateTemp("", "myapp-*.txt")
	fmt.Println("Temp file:", tmpFile.Name())
	tmpFile.WriteString("temporary data")
	tmpFile.Close()
	os.Remove(tmpFile.Name()) // 用完记得删除

	// 清理测试文件
	os.Remove(testFile)
	os.Remove(copyFile)
}
```
:::

### io.Pipe 实战：流式处理

::: details 点击展开代码：io.Pipe 实战：流式处理
```go
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
)

type LogEntry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
}

func main() {
	// io.Pipe 创建一个同步管道
	// 写入端和读取端在不同 goroutine 中运行
	// 写入会阻塞直到有人读取，反之亦然

	pr, pw := io.Pipe()

	// 生产者：生成 JSON 流
	go func() {
		encoder := json.NewEncoder(pw)
		entries := []LogEntry{
			{Level: "INFO", Message: "Server started"},
			{Level: "WARN", Message: "High memory usage"},
			{Level: "ERROR", Message: "Connection refused"},
		}
		for _, entry := range entries {
			if err := encoder.Encode(entry); err != nil {
				pw.CloseWithError(err)
				return
			}
		}
		pw.Close()
	}()

	// 消费者：逐条解码
	decoder := json.NewDecoder(pr)
	for {
		var entry LogEntry
		if err := decoder.Decode(&entry); err != nil {
			if err == io.EOF {
				break
			}
			fmt.Println("Decode error:", err)
			break
		}
		fmt.Fprintf(os.Stdout, "[%s] %s\n", entry.Level, entry.Message)
	}
}
```
:::

<GoNetworkDiagram kind="io-pipe-stream" />

**讲解重点：**

1. **`io.Reader` / `io.Writer` 是 Go IO 的基石**：文件、网络连接、HTTP Body、压缩流、加密流都实现了这两个接口。掌握它们就掌握了整个 IO 体系，可以像搭积木一样组合各种 IO 操作。
2. **`bufio` 显著提升 IO 性能**：直接调用 `os.File.Write` 每次都会触发系统调用，`bufio.Writer` 在内存中积攒数据，减少系统调用次数。记得最后调用 `Flush()`。
3. **`io.Pipe` 实现生产者-消费者模式**：零缓冲的同步管道，适合在一个 goroutine 生成数据、另一个消费数据的场景。常用于 HTTP multipart upload、流式 JSON 处理等。
