---
title: Golang 能力自检高频题示例代码片段
description: 作为能力自检题库的配套代码页，专注最小可讲解示例，减少与题库和主线专题的重复。
search: false
---

# Golang 能力自检高频题示例代码片段

这页只做一件事：给高频题提供**最小、可讲解、可手写**的代码片段。

它不再重复承担“题目解释”和“系统原理总览”的职责。想先看题目和口述模板，请到：

- 题库：[30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)
- 自检导航：[Go 能力自检与面试准备导航](./interview-prep.md)

## 怎么使用这页

- **准备手写代码**：优先看这页
- **准备口述表达**：先看题库，再回这页补例子
- **准备追源码或补主线**：从这页跳回对应专题，不在这页深挖

## 快速索引

| 主题 | 代码片段 | 对应题库/专题 |
| --- | --- | --- |
| Slice 与底层数组 | Slice 扩容与共享 | `go-top-30-interview-questions` 基础与底层 |
| Interface | Nil Interface | `go-top-30-interview-questions` 基础与底层 |
| Defer | 参数求值 | `go-top-30-interview-questions` 基础与底层 |
| Channel | 无缓冲同步 | `guide/03-channel-select-context` |
| Context | 取消传播 + 请求边界 | `context-usage-boundaries` + `guide/source-reading/context` |
| WaitGroup | 正确等待方式 | `guide/03-sync-primitives` |
| Mutex | 共享状态保护 | `guide/03-sync-primitives` |
| 逃逸分析 | `-gcflags=-m` | `guide/02-runtime-memory-lifecycle` |
| `sync.Pool` | 对象复用 | `guide/07-performance-troubleshooting` |
| Pprof | HTTP 接入 | `pprof-troubleshooting-guide` |
| `http.Client` | 复用客户端 | `guide/04-network-stdlib` |

## 基础与底层

### Slice 扩容与底层数组共享

::: details 点击展开代码：Slice 扩容与底层数组共享
```go
package main

import "fmt"

func main() {
	a := make([]int, 2, 4)
	a[0], a[1] = 1, 2

	b := append(a, 3) // 还没超过 cap，底层数组共享
	b[0] = 100
	fmt.Println(a, b) // [100 2] [100 2 3]

	c := append(b, 4, 5) // 触发扩容，通常分配新数组
	c[0] = 999
	fmt.Println(a, b, c)
}
```
:::

讲解重点：

- 没扩容时，新旧 Slice 可能共享底层数组
- 扩容后通常迁移到新数组，互相影响会消失

### Nil Interface 问题

::: details 点击展开代码：Nil Interface 问题
```go
package main

import "fmt"

type MyErr struct{}

func (*MyErr) Error() string { return "err" }

func main() {
	var e *MyErr = nil
	var err error = e

	fmt.Println(e == nil)   // true
	fmt.Println(err == nil) // false
}
```
:::

讲解重点：

- 接口是否为 nil，要看动态类型和值是否都为空

### Defer 参数求值

::: details 点击展开代码：Defer 参数求值
```go
package main

import "fmt"

func main() {
	x := 1

	defer fmt.Println("normal defer:", x)
	defer func() {
		fmt.Println("closure defer:", x)
	}()

	x = 2
}
```
:::

讲解重点：

- 普通 `defer` 参数在定义时求值
- 闭包 `defer` 更容易读到后续修改后的变量

## 并发与调度

### Channel 同步

::: details 点击展开代码：Channel 同步
```go
package main

import "fmt"

func main() {
	ch := make(chan int)

	go func() {
		ch <- 42
	}()

	v := <-ch
	fmt.Println(v)
}
```
:::

讲解重点：

- 无缓冲 Channel 不只是通信工具，也带同步语义

### Context 取消传播

::: details 点击展开代码：Context 取消传播
```go
package main

import (
	"context"
	"fmt"
	"time"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	go func() {
		<-ctx.Done()
		fmt.Println("cancelled:", ctx.Err())
	}()

	time.Sleep(200 * time.Millisecond)
}
```
:::

讲解重点：

- Context 适合超时和取消治理
- 子任务应监听 `ctx.Done()`
- `cancel()` 通常要 `defer` 调用，避免 timer 和子节点引用滞留

### HTTP 请求结束后的异步任务边界

::: details 点击展开代码：HTTP 请求结束后的异步任务边界
```go
package main

import (
	"context"
	"log"
	"net/http"
	"time"
)

func handler(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID") // 先把需要的数据拷出来
	base := context.WithoutCancel(r.Context()) // Go 1.21+

	go func(userID string, base context.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("async panic: %v", rec)
			}
		}()

		ctx, cancel := context.WithTimeout(base, 3*time.Second)
		defer cancel()

		writeAuditLog(ctx, userID)
	}(userID, base)

	w.WriteHeader(http.StatusAccepted)
}

func writeAuditLog(ctx context.Context, userID string) {
	select {
	case <-time.After(500 * time.Millisecond):
		log.Printf("audit ok: %s", userID)
	case <-ctx.Done():
		log.Printf("audit cancelled: %v", ctx.Err())
	}
}
```
:::

讲解重点：

- `r.Context()` 会在客户端断开或 `ServeHTTP` 返回后失效
- 请求内任务继续透传 `r.Context()`；离线任务不要直接复用它
- Go 1.21+ 可以用 `context.WithoutCancel()` 保留元数据但切断父取消
- 离线任务仍然要重新设置自己的超时，避免后台 goroutine 无限运行

### WaitGroup 正确用法

::: details 点击展开代码：WaitGroup 正确用法
```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var wg sync.WaitGroup

	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(v int) {
			defer wg.Done()
			fmt.Println(v)
		}(i)
	}

	wg.Wait()
}
```
:::

讲解重点：

- `Add` 最好在启动 Goroutine 之前完成
- `WaitGroup` 只负责等待结束，不负责错误传递

### Mutex 保护共享状态

::: details 点击展开代码：Mutex 保护共享状态
```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var mu sync.Mutex
	var n int
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			n++
			mu.Unlock()
		}()
	}

	wg.Wait()
	fmt.Println(n)
}
```
:::

讲解重点：

- 多协程修改共享状态时必须做同步保护

## 性能与工程

### 逃逸分析观察

::: details 点击展开代码：逃逸分析观察
```go
package main

type User struct {
	Name string
}

func newUser() *User {
	u := User{Name: "codex"}
	return &u
}

func main() {
	_ = newUser()
}
```
:::

命令：

::: details 点击展开代码：逃逸分析观察
```bash
go build -gcflags="-m" .
```
:::

讲解重点：

- 返回局部变量地址通常会触发逃逸

### sync.Pool 复用对象

::: details 点击展开代码：sync.Pool 复用对象
```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

func main() {
	pool := sync.Pool{
		New: func() any {
			return new(bytes.Buffer)
		},
	}

	buf := pool.Get().(*bytes.Buffer)
	buf.WriteString("hello")
	fmt.Println(buf.String())

	buf.Reset()
	pool.Put(buf)
}
```
:::

讲解重点：

- `sync.Pool` 适合短生命周期临时对象复用

### Pprof 接入

::: details 点击展开代码：Pprof 接入
```go
package main

import (
	"log"
	"net/http"
	_ "net/http/pprof"
)

func main() {
	log.Println(http.ListenAndServe("localhost:6060", nil))
}
```
:::

讲解重点：

- 能力自检里不一定要背命令，但要知道 `pprof` 常用接入方式

### 复用 http.Client

::: details 点击展开代码：复用 http.Client
```go
package main

import (
	"net/http"
	"time"
)

var client = &http.Client{
	Timeout: 2 * time.Second,
}

func main() {
	_, _ = client.Get("https://example.com")
}
```
:::

讲解重点：

- `http.Client` 应尽量复用
- 超时配置是服务稳定性的基础

## 建议使用方式

- 先用题库练“怎么回答”
- 再用这页练“怎么举例”
- 最后回对应专题练“为什么会这样”

如果你正在压缩准备时间，这页只需要反复吃透最常见的 5 到 10 个片段，不必一次全背。
