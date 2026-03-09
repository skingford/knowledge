# Golang 面试高频题示例代码片段

## 适合人群

- 想把 Go 面试题从“会说”提升到“会写”的工程师
- 需要准备手写代码或现场解释代码的候选人
- 希望用最小示例加深对底层原理理解的人

## 学习目标

- 给高频 Go 面试题补最小可讲解代码
- 形成“题目 -> 原理 -> 模板 -> 示例”的完整复习链路
- 帮助在面试里更自然地结合代码说明问题

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [基础与底层](#基础与底层)
- [并发与调度](#并发与调度)
- [性能与工程](#性能与工程)

## 基础与底层

### Slice 扩容与底层数组共享

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

讲解重点：

- 没扩容时，新旧 Slice 可能共享底层数组
- 扩容后通常迁移到新数组，互相影响会消失

### Nil Interface 问题

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

讲解重点：

- 接口是否为 nil，要看动态类型和值是否都为空

### Defer 参数求值

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

讲解重点：

- 普通 `defer` 参数在定义时求值
- 闭包 `defer` 更容易读到后续修改后的变量

## 并发与调度

### Channel 同步

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

讲解重点：

- 无缓冲 Channel 不只是通信工具，也带同步语义

### Context 取消传播

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

讲解重点：

- Context 适合超时和取消治理
- 子任务应监听 `ctx.Done()`

### WaitGroup 正确用法

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

讲解重点：

- `Add` 最好在启动 Goroutine 之前完成
- `WaitGroup` 只负责等待结束，不负责错误传递

### Mutex 保护共享状态

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

讲解重点：

- 多协程修改共享状态时必须做同步保护

## 性能与工程

### 逃逸分析观察

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

命令：

```bash
go build -gcflags="-m" .
```

讲解重点：

- 返回局部变量地址通常会触发逃逸

### sync.Pool 复用对象

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

讲解重点：

- `sync.Pool` 适合短生命周期临时对象复用

### Pprof 接入

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

讲解重点：

- 面试里不一定要背命令，但要知道 `pprof` 常用接入方式

### 复用 http.Client

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

讲解重点：

- `http.Client` 应尽量复用
- 超时配置是服务稳定性的基础

## 推荐使用方式

- 先口述题目答案
- 再手写最小代码片段
- 最后结合源码与原理文档补深度
