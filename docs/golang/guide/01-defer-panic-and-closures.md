---
title: defer、panic/recover 与函数闭包
description: Go defer 执行顺序与参数求值、panic/recover 恢复机制、闭包捕获与循环变量陷阱。
head:
  - - meta
    - name: keywords
      content: Go defer,panic,recover,闭包,循环变量陷阱,Go1.22
---

# defer、panic/recover 与函数闭包

## 5. defer / panic / recover

`defer` 将函数调用压入栈，在当前函数返回前按 LIFO（后进先出）顺序执行。defer 的参数在 `defer` 语句执行时就已经求值（而非延迟到调用时）。`panic` 触发运行时恐慌，沿调用栈向上传播；`recover` 只能在 `defer` 函数中调用，用于捕获 panic 并恢复正常执行。这三者组合构成了 Go 的异常处理机制，常用于资源清理、锁释放和顶层错误兜底。

```go
package main

import "fmt"

// defer 执行顺序与参数求值时机
func deferOrder() {
	fmt.Println("--- defer 顺序 ---")
	for i := 0; i < 3; i++ {
		defer fmt.Printf("defer: %d\n", i) // 参数 i 在 defer 时求值
	}
	// 输出: defer: 2, defer: 1, defer: 0（LIFO）
}

// defer 与命名返回值
func deferReturn() (result int) {
	defer func() {
		result++ // defer 可以修改命名返回值
	}()
	return 10 // 实际返回 11
}

// panic + recover 模式
func safeDivide(a, b int) (result int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()

	return a / b, nil // b=0 时触发 panic（整数除零）
}

// 实际应用：HTTP handler 兜底
func safeHandler(handler func()) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Printf("handler panic recovered: %v\n", r)
		}
	}()
	handler()
}

func main() {
	deferOrder()

	fmt.Println("\n--- defer 与返回值 ---")
	fmt.Println("deferReturn:", deferReturn()) // 11

	fmt.Println("\n--- recover ---")
	result, err := safeDivide(10, 0)
	fmt.Println("result:", result, "err:", err)

	fmt.Println("\n--- safeHandler ---")
	safeHandler(func() {
		panic("something went wrong")
	})
	fmt.Println("程序继续运行")
}
```

讲解重点：

- defer 参数在 `defer` 语句出现时立即求值，不是在函数返回时才求值
- defer 闭包可以读写命名返回值，这是实现"函数退出前修改返回值"的惯用手法
- `recover` 只在 `defer` 中有效，且只能捕获当前 goroutine 的 panic

---

## 6. 函数闭包

闭包是引用了外部变量的函数，Go 中闭包捕获的是变量的**引用**而非值的拷贝。这意味着闭包执行时会读取变量的最新值，而不是定义闭包时的值。最经典的陷阱是在 for 循环中创建 goroutine 或 defer 闭包引用循环变量——所有闭包最终都会看到循环变量的最后一个值。Go 1.22 修复了 `for` 循环变量的语义（每次迭代创建新变量），但理解底层原理仍然重要。

```go
package main

import (
	"fmt"
	"sync"
)

// 闭包基础：计数器工厂
func counter(start int) func() int {
	count := start
	return func() int {
		count++
		return count
	}
}

// 经典陷阱：循环变量捕获（Go < 1.22 行为）
func loopTrap() {
	fmt.Println("--- 循环变量陷阱 ---")
	funcs := make([]func(), 5)
	for i := 0; i < 5; i++ {
		funcs[i] = func() {
			fmt.Printf("%d ", i) // 捕获的是变量 i 的引用
		}
	}
	// Go < 1.22: 全部输出 5
	// Go >= 1.22: 输出 0 1 2 3 4（每次迭代创建新变量）
	for _, f := range funcs {
		f()
	}
	fmt.Println()
}

// 修复方式一：参数传入（适用所有 Go 版本）
func loopFixed() {
	fmt.Println("--- 修复：参数传入 ---")
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(n int) { // 通过参数拷贝值
			defer wg.Done()
			fmt.Printf("%d ", n)
		}(i)
	}
	wg.Wait()
	fmt.Println()
}

// 闭包实用模式：中间件 / 装饰器
func withLogging(name string, fn func(int) int) func(int) int {
	return func(x int) int {
		result := fn(x)
		fmt.Printf("[%s] input=%d output=%d\n", name, x, result)
		return result
	}
}

func main() {
	// 闭包计数器
	c := counter(0)
	fmt.Println(c(), c(), c()) // 1 2 3

	// 每个闭包有独立的 count
	c2 := counter(10)
	fmt.Println(c2(), c2()) // 11 12
	fmt.Println(c())        // 4（c 的 count 继续）

	loopTrap()
	loopFixed()

	// 装饰器模式
	double := withLogging("double", func(x int) int { return x * 2 })
	double(5)
}
```

讲解重点：

- 闭包捕获的是变量的引用（地址），不是值的快照；变量后续变化会影响闭包的行为
- Go 1.22 之前的循环变量陷阱：在 goroutine/defer 中引用循环变量时务必通过参数传值
- 闭包是实现工厂函数、中间件、装饰器等模式的基础
