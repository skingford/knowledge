---
title: 错误处理设计
description: Go 错误处理设计，sentinel error、自定义错误类型、errors.Is/As、%w 包装与分层处理。
head:
  - - meta
    - name: keywords
      content: Go错误处理,errors.Is,errors.As,sentinel error,错误包装,%w
---

# 错误处理设计

## 10. 错误处理设计

Go 用返回值而非异常处理错误，核心原则是：错误是值，可以被编程处理。Go 1.13 引入 `errors.Is`（判断错误链中是否包含特定错误）和 `errors.As`（从错误链中提取特定类型错误）以及 `fmt.Errorf` 的 `%w` 动词用于错误包装。良好的错误处理设计应该分层：底层返回 sentinel error 或自定义错误类型，中间层用 `%w` 包装添加上下文，上层用 `errors.Is/As` 做决策。避免对所有错误都 `log.Fatal` 或简单打印。

<GoLanguageDiagram kind="error-chain" />

```go
package main

import (
	"errors"
	"fmt"
	"io"
)

// Sentinel error：预定义的包级错误
var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
)

// 自定义错误类型：携带结构化信息
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation failed: %s - %s", e.Field, e.Message)
}

// 模拟业务函数
func findUser(id int) (string, error) {
	if id <= 0 {
		return "", &ValidationError{Field: "id", Message: "必须大于 0"}
	}
	if id == 999 {
		return "", ErrNotFound
	}
	return "alice", nil
}

// 中间层：包装错误添加上下文
func getUserProfile(id int) (string, error) {
	name, err := findUser(id)
	if err != nil {
		return "", fmt.Errorf("getUserProfile(id=%d): %w", id, err)
	}
	return fmt.Sprintf("profile:%s", name), nil
}

// 顶层：根据错误类型做不同处理
func handleRequest(id int) {
	profile, err := getUserProfile(id)
	if err != nil {
		// errors.Is: 检查错误链中是否包含特定 sentinel error
		if errors.Is(err, ErrNotFound) {
			fmt.Println("  -> 404: 用户不存在")
			return
		}

		// errors.As: 从错误链中提取特定类型的错误
		var ve *ValidationError
		if errors.As(err, &ve) {
			fmt.Printf("  -> 400: 参数错误 field=%s msg=%s\n", ve.Field, ve.Message)
			return
		}

		// 未知错误
		fmt.Println("  -> 500:", err)
		return
	}
	fmt.Println("  -> 200:", profile)
}

func main() {
	fmt.Println("--- 错误处理分层 ---")

	fmt.Println("请求 id=1:")
	handleRequest(1)

	fmt.Println("请求 id=999:")
	handleRequest(999)

	fmt.Println("请求 id=-1:")
	handleRequest(-1)

	// 错误包装链条演示
	fmt.Println("\n--- 错误链 ---")
	_, err := getUserProfile(999)
	fmt.Println("完整错误:", err)
	fmt.Println("Is ErrNotFound:", errors.Is(err, ErrNotFound))
	fmt.Println("Unwrap:", errors.Unwrap(err))

	// io.EOF 也是 sentinel error 的经典案例
	fmt.Println("\n--- Sentinel Error ---")
	fmt.Println("io.EOF:", io.EOF)
	fmt.Println("Is io.EOF:", errors.Is(io.EOF, io.EOF))
}
```

讲解重点：

- 用 `%w` 包装错误保留错误链，用 `errors.Is` 判断 sentinel error，用 `errors.As` 提取自定义错误类型
- Sentinel error（如 `io.EOF`、自定义 `ErrNotFound`）适合表示"已知的、可预期的"错误状态
- 错误处理应分层：底层产生、中间层包装上下文、上层根据类型决策；避免每层都打日志导致重复

---

## 总结

| 主题 | 核心要点 |
|------|---------|
| 变量/常量/iota | `iota` 按 const 块递增，位掩码模式常用 |
| 值类型 vs 引用语义 | Go 只有值传递，slice/map/channel 值含指针 |
| 数组/Slice/Map | slice 三要素（ptr/len/cap），map 需 make 初始化 |
| String/[]byte | 转换有拷贝开销，大量拼接用 Builder |
| defer/panic/recover | defer LIFO，参数立即求值，recover 仅限 defer |
| 闭包 | 捕获变量引用，注意循环变量陷阱 |
| Interface | eface/iface 双指针结构，nil 陷阱 |
| 反射 | TypeOf/ValueOf，修改需传指针，性能开销大 |
| 泛型 | 类型参数 + 约束，适合容器和算法 |
| 错误处理 | errors.Is/As + %w 包装，分层处理 |
