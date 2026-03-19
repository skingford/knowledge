---
title: Goroutine 泄漏与并发安全
description: Goroutine 泄漏原因与排查、数据竞争检测、Race Detector、闭包陷阱与 Map 并发安全。
search: false
---

# Goroutine 泄漏与并发安全

## 10. Goroutine 泄漏与排查

Goroutine 泄漏是指启动的 Goroutine 无法退出、持续占用内存和调度资源，是 Go 服务中常见的生产问题。

### 常见泄漏原因

```go
package main

import (
	"fmt"
	"runtime"
	"time"
)

// 泄漏原因 1：向无人接收的 Channel 发送数据
func leakByBlockedSend() {
	ch := make(chan int)
	go func() {
		ch <- 42 // 永远阻塞，没有接收者
		fmt.Println("this line never executes")
	}()
	// 没有 <-ch，Goroutine 泄漏
}

// 泄漏原因 2：从无人发送的 Channel 接收数据
func leakByBlockedRecv() {
	ch := make(chan int)
	go func() {
		val := <-ch // 永远阻塞，没有发送者
		fmt.Println("received:", val)
	}()
	// 没有 ch <- xxx，也没有 close(ch)
}

// 泄漏原因 3：没有退出条件的无限循环
func leakByInfiniteLoop() {
	go func() {
		for {
			// 没有 return / break / select + done
			time.Sleep(time.Second)
		}
	}()
}

func main() {
	fmt.Println("before leaks:", runtime.NumGoroutine())

	leakByBlockedSend()
	leakByBlockedRecv()
	leakByInfiniteLoop()

	time.Sleep(100 * time.Millisecond)
	fmt.Println("after leaks:", runtime.NumGoroutine()) // 比 before 多了 3 个
}
```

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:620px;width:100%;">
<svg viewBox="0 0 620 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="310" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">三种常见 Goroutine 泄漏场景</text>
  <!-- Scene 1: Blocked Send -->
  <rect x="10" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="105" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景一 · 发送阻塞</text>
  <rect x="30" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="70" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ch &lt;- data</text>
  <rect x="120" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="150" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无接收者</text>
  <text x="150" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">永远阻塞</text>
  <rect x="22" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="106" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: select + ctx.Done()</text>
  <text x="106" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或确保有接收者</text>
  <!-- Red blocked indicator -->
  <text x="106" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>
  <!-- Scene 2: Blocked Recv -->
  <rect x="215" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="310" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景二 · 接收阻塞</text>
  <rect x="235" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="275" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">&lt;- ch</text>
  <rect x="325" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="355" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无发送者</text>
  <text x="355" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">永远阻塞</text>
  <rect x="227" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="311" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: 确保 close(ch)</text>
  <text x="311" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或用 ctx 超时控制</text>
  <text x="311" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>
  <!-- Scene 3: Infinite Loop -->
  <rect x="420" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="515" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景三 · 死循环</text>
  <rect x="440" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
  <text x="480" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">for { ... }</text>
  <rect x="530" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="560" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无退出</text>
  <text x="560" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">条件</text>
  <rect x="432" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="516" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: select + done Chan</text>
  <text x="516" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或 ctx 取消信号</text>
  <text x="516" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>
</svg>
</div>
</div>

### 正确的退出模式

```go
package main

import (
	"context"
	"fmt"
	"runtime"
	"time"
)

func properWorker(ctx context.Context, id int) {
	for {
		select {
		case <-ctx.Done():
			fmt.Printf("worker %d: exiting\n", id)
			return
		default:
			// 做实际工作
			time.Sleep(100 * time.Millisecond)
		}
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()

	for i := 1; i <= 3; i++ {
		go properWorker(ctx, i)
	}

	time.Sleep(1 * time.Second)
	fmt.Println("goroutines:", runtime.NumGoroutine()) // 只剩 main
}
```

### 用 pprof 检测泄漏

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof" // 导入即注册 pprof 路由
	"time"
)

func leakyOperation() {
	ch := make(chan struct{})
	go func() {
		<-ch // 永远不会收到数据
	}()
	// 忘记 close(ch)
}

func main() {
	// 启动 pprof HTTP 服务
	go func() {
		fmt.Println("pprof at http://localhost:6060/debug/pprof/")
		http.ListenAndServe(":6060", nil)
	}()

	// 模拟每秒泄漏一个 Goroutine
	for i := 0; i < 100; i++ {
		leakyOperation()
		time.Sleep(100 * time.Millisecond)
	}

	// 保持进程运行，方便 pprof 抓取
	// 访问 http://localhost:6060/debug/pprof/goroutine?debug=1 查看所有 Goroutine 栈
	// 命令行: go tool pprof http://localhost:6060/debug/pprof/goroutine
	select {}
}
```

### 讲解重点

- **常见根因**：Channel 无对端读写、缺少退出信号（done Channel 或 Context）、锁竞争导致永久阻塞、忘记关闭 `net.Conn` / `http.Response.Body`。
- **检测手段**：`runtime.NumGoroutine()` 观察趋势；`net/http/pprof` 的 goroutine 端点查看完整栈帧；`go tool pprof` 分析 goroutine profile。
- **预防模式**：每个 Goroutine 都应有明确退出路径；使用 `context.Context` 传递取消信号；Channel 使用完毕及时关闭或配合 done Channel。
- **测试检测**：可以在测试中检查 `runtime.NumGoroutine()` 在测试前后是否一致，第三方库如 `goleak`（uber-go/goleak）提供了更便捷的泄漏检测。


---

## 11. 并发安全常见问题

数据竞争（data race）是并发编程中最常见也最危险的 bug 类型，Go 提供了内建工具和语言机制来帮助发现和避免这些问题。

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:520px;width:100%;">
<svg viewBox="0 0 520 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <text x="260" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Data Race: 两个 Goroutine 竞争 counter</text>
  <!-- Shared variable -->
  <rect x="200" y="32" width="120" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="260" y="51" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">counter = 0</text>
  <!-- G1 timeline -->
  <text x="20" y="82" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">G1</text>
  <line x1="50" y1="78" x2="470" y2="78" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <!-- G2 timeline -->
  <text x="20" y="122" font-size="10" font-weight="bold" fill="var(--d-rv-b-text)">G2</text>
  <line x1="50" y1="118" x2="470" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.5"/>
  <!-- Time arrow -->
  <line x1="50" y1="150" x2="470" y2="150" stroke="var(--d-text-muted)" stroke-width="1" marker-end="url(#aDR)"/>
  <text x="480" y="154" font-size="8" fill="var(--d-text-muted)">时间</text>
  <!-- G1: read 0 -->
  <rect x="70" y="64" width="70" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
  <text x="105" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">read: 0</text>
  <!-- G2: read 0 (concurrent) -->
  <rect x="110" y="106" width="70" height="22" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1"/>
  <text x="145" y="121" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">read: 0</text>
  <!-- G1: compute +1 -->
  <rect x="160" y="64" width="70" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
  <text x="195" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">0 + 1 = 1</text>
  <!-- G2: compute +1 -->
  <rect x="200" y="106" width="70" height="22" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1"/>
  <text x="235" y="121" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">0 + 1 = 1</text>
  <!-- G1: write 1 -->
  <rect x="260" y="64" width="80" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="300" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">write: 1</text>
  <!-- G2: write 1 (overwrites!) -->
  <rect x="310" y="106" width="80" height="22" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5"/>
  <text x="350" y="121" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">write: 1 !</text>
  <!-- Result -->
  <rect x="420" y="82" width="80" height="28" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
  <text x="460" y="100" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-c-text)">counter=1</text>
  <!-- Expected -->
  <text x="260" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">预期: counter = 2，实际: counter = 1（丢失更新）</text>
  <!-- Fix hint -->
  <rect x="110" y="190" width="300" height="22" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="260" y="205" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">修复: Mutex 保护 或 atomic.AddInt64</text>
  <defs>
    <marker id="aDR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)"/></marker>
  </defs>
</svg>
</div>
</div>

### 数据竞争示例

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	counter := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter++ // 数据竞争！多个 Goroutine 同时读写
		}()
	}

	wg.Wait()
	fmt.Println("counter:", counter) // 结果不确定，可能 < 1000

	// 运行 go run -race main.go 可以检测到竞争
}
```

### Race Detector 使用

```go
package main

import (
	"fmt"
	"sync"
)

// 用 go run -race main.go 或 go test -race ./... 检测
// 编译: go build -race -o app main.go

func main() {
	// 修复方案 1: 使用 Mutex
	var mu sync.Mutex
	counter1 := 0
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			counter1++
			mu.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println("mutex counter:", counter1)

	// 修复方案 2: 使用 Channel 汇总
	counter2 := 0
	ch := make(chan int, 1000)

	for i := 0; i < 1000; i++ {
		go func() {
			ch <- 1
		}()
	}

	for i := 0; i < 1000; i++ {
		counter2 += <-ch
	}
	fmt.Println("channel counter:", counter2)
}
```

### 循环中闭包捕获变量

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	// 错误写法：所有 Goroutine 共享变量 i
	fmt.Println("=== 错误写法 (Go < 1.22) ===")
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ") // 可能打印 5 5 5 5 5
		}()
	}
	wg.Wait()
	fmt.Println()

	// 正确写法 1：通过参数传值
	fmt.Println("=== 参数传值 ===")
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			fmt.Print(n, " ") // 0 1 2 3 4（顺序不定）
		}(i)
	}
	wg.Wait()
	fmt.Println()

	// 正确写法 2：局部变量拷贝
	fmt.Println("=== 局部变量拷贝 ===")
	for i := 0; i < 5; i++ {
		i := i // 创建新的局部变量
		wg.Add(1)
		go func() {
			defer wg.Done()
			fmt.Print(i, " ")
		}()
	}
	wg.Wait()
	fmt.Println()

	// 注意：Go 1.22+ 的 for 循环变量语义已改为每次迭代创建新变量
	// 但为了兼容性和可读性，显式传参仍是好习惯
}
```

### Map 并发读写 panic

```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	// 普通 map 并发读写会直接 panic（不是数据竞争，是 runtime 检测到后主动 panic）
	// 以下代码会触发: fatal error: concurrent map writes
	/*
		m := make(map[int]int)
		var wg sync.WaitGroup
		for i := 0; i < 100; i++ {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				m[n] = n // panic!
			}(i)
		}
		wg.Wait()
	*/

	// 方案 1: sync.RWMutex + map
	var mu sync.RWMutex
	safeMap := make(map[int]int)
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			mu.Lock()
			safeMap[n] = n
			mu.Unlock()
		}(i)
	}
	wg.Wait()
	fmt.Println("safe map size:", len(safeMap))

	// 方案 2: sync.Map（见第 9 节）
	// 方案 3: Channel 序列化访问
}
```

### 讲解重点

- **Race Detector 必须用**：在开发和 CI 中始终开启 `-race` 标志。它通过在编译期插桩来检测运行时数据竞争，能发现大多数并发 bug。注意它有 2-10 倍的性能开销和更多内存使用，不要在生产环境开启。
- **Map 并发写是 fatal**：Go 的 map 并发写不是静默的数据竞争，而是 runtime 会检测到并直接 `fatal error`，进程无法 recover。
- **闭包捕获**：Go 1.22 之前，`for` 循环变量被闭包捕获是引用而非拷贝。Go 1.22 已修复此行为，但显式传参仍是好习惯。
- **Happens-before 规则**：Go 内存模型定义了严格的 happens-before 关系：Channel 发送 happens-before 对应接收完成；Mutex Unlock happens-before 下一次 Lock。不依赖这些规则的代码都可能存在数据竞争。
