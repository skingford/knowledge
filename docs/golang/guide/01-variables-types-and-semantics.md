---
title: 变量、类型与值语义
description: Go 变量声明、常量 iota、值类型与引用语义、数组/Slice/Map、String 与 []byte 转换。
head:
  - - meta
    - name: keywords
      content: Go变量,iota,值传递,引用语义,Slice,Map,String,byte转换
---

# 变量、类型与值语义

## 1. 变量、常量、iota

Go 提供多种变量声明方式：`var` 显式声明、`:=` 短变量声明、以及批量 `var()` 块声明。常量用 `const` 定义，编译期确定，不可修改。`iota` 是常量生成器，在 `const` 块中从 0 开始自动递增，常用于定义枚举值、位掩码和自定义序列。理解 `iota` 的作用域是 `const` 块级别，每遇到新的 `const` 关键字就重置为 0。

```go
package main

import "fmt"

// iota 枚举用法
type Weekday int

const (
	Sunday    Weekday = iota // 0
	Monday                   // 1
	Tuesday                  // 2
	Wednesday                // 3
	Thursday                 // 4
	Friday                   // 5
	Saturday                 // 6
)

// iota 位掩码用法
type Permission uint

const (
	Read    Permission = 1 << iota // 1
	Write                          // 2
	Execute                        // 4
)

// iota 跳值与自定义表达式
const (
	_  = iota             // 0，用 _ 丢弃
	KB = 1 << (10 * iota) // 1 << 10 = 1024
	MB                    // 1 << 20
	GB                    // 1 << 30
)

func main() {
	// 多种声明方式
	var a int = 10
	b := 20
	var c, d = "hello", true

	fmt.Println(a, b, c, d)
	fmt.Println("Wednesday =", Wednesday)
	fmt.Println("Read|Write =", Read|Write)
	fmt.Println("KB =", KB, "MB =", MB, "GB =", GB)

	// 检查权限
	perm := Read | Execute
	fmt.Println("有写权限?", perm&Write != 0)   // false
	fmt.Println("有读权限?", perm&Read != 0)     // true
}
```

讲解重点：

- `iota` 在每个 `const` 块内从 0 开始递增，新的 `const` 块重置为 0
- 位掩码模式 `1 << iota` 是 Go 中定义权限、标志位的惯用写法
- `:=` 只能在函数内使用，包级别变量必须用 `var`

---

## 2. 值类型 vs 引用语义

Go 中所有赋值和函数传参都是**值拷贝**（pass by value），没有真正的引用传递。但 slice、map、channel、指针、函数这些类型的"值"本身就包含了指向底层数据的指针，所以拷贝后仍然共享底层数据，表现出"引用语义"。理解这一点是避免 Go 中最常见 bug 的关键：struct 赋值是深拷贝，但 struct 内含 slice/map 字段时，拷贝后的 struct 与原 struct 共享这些字段的底层数据。

```go
package main

import "fmt"

type User struct {
	Name  string
	Roles []string
}

func modifyValue(u User) {
	u.Name = "modified" // 不影响外部，因为 struct 是值拷贝
	u.Roles[0] = "admin" // 会影响外部！slice header 被拷贝，但底层数组共享
}

func modifyPointer(u *User) {
	u.Name = "modified" // 通过指针修改，影响外部
}

func main() {
	// 值类型：int, bool, string, array, struct
	a := [3]int{1, 2, 3}
	b := a    // 数组是值类型，完整拷贝
	b[0] = 99
	fmt.Println("数组 a:", a) // [1 2 3]
	fmt.Println("数组 b:", b) // [99 2 3]

	// struct 含 slice 字段的陷阱
	u1 := User{Name: "alice", Roles: []string{"user"}}
	u2 := u1 // 值拷贝，但 Roles slice 共享底层数组
	u2.Name = "bob"
	u2.Roles[0] = "admin"
	fmt.Println("u1:", u1) // {alice [admin]} — Name 没变，但 Roles 被改了！

	// 函数传参
	u3 := User{Name: "charlie", Roles: []string{"viewer"}}
	modifyValue(u3)
	fmt.Println("modifyValue 后:", u3) // {charlie [admin]} — Name 没变，Roles 变了

	u4 := User{Name: "dave", Roles: []string{"viewer"}}
	modifyPointer(&u4)
	fmt.Println("modifyPointer 后:", u4) // {modified [viewer]}
}
```

讲解重点：

- Go 只有值传递，但 slice/map/channel 的值本身含指针，拷贝后共享底层数据
- 数组（`[N]T`）是值类型，赋值和传参都是完整拷贝；slice（`[]T`）是引用语义
- 需要深拷贝 struct 中的 slice/map 字段时，必须手动 `copy` 或重新 `make`

---

## 3. 数组、Slice、Map

数组是固定长度的值类型，实际开发中很少直接使用。Slice 是对底层数组的引用视图，包含指针、长度、容量三个字段，是 Go 中最常用的序列容器。Map 是无序的键值对集合，基于哈希表实现，零值为 nil，必须用 `make` 初始化后才能写入。Slice 和 Map 都有各自的常见陷阱：slice 的扩容可能导致底层数组变化，map 的并发读写会 panic。

```go
package main

import "fmt"

func main() {
	// === Slice ===
	// 声明与初始化
	s1 := []int{1, 2, 3}
	s2 := make([]int, 3, 8) // len=3, cap=8
	fmt.Printf("s1: %v len=%d cap=%d\n", s1, len(s1), cap(s1))
	fmt.Printf("s2: %v len=%d cap=%d\n", s2, len(s2), cap(s2))

	// append 与扩容
	s3 := make([]int, 0, 2)
	fmt.Printf("扩容前 cap=%d\n", cap(s3))
	s3 = append(s3, 1, 2, 3) // 超过 cap，触发扩容
	fmt.Printf("扩容后 cap=%d\n", cap(s3))

	// 切片共享底层数组
	origin := []int{1, 2, 3, 4, 5}
	sub := origin[1:3] // [2, 3]，与 origin 共享底层数组
	sub[0] = 99
	fmt.Println("origin:", origin) // [1 99 3 4 5]

	// 不限制 cap 时，append 可能覆盖原底层数组后续元素
	original := []int{0, 1, 2, 3, 4}
	s := original[1:3] // len=2, cap=4（容量一直延伸到 original 末尾）
	s = append(s, 99)  // 直接写入底层数组索引 3
	fmt.Println("original after append:", original) // [0 1 2 99 4]

	// 安全切片：限制 cap 避免意外修改
	safe := original[1:3:3] // len=2, cap=2，append 时必定扩容
	safe = append(safe, 100)
	fmt.Println("original after safe append:", original) // 保持不变

	// === Map ===
	m := map[string]int{
		"apple":  5,
		"banana": 3,
	}

	// 安全读取：用 comma-ok 模式
	v, ok := m["cherry"]
	if !ok {
		fmt.Println("cherry 不存在, 零值:", v)
	}

	// 删除
	delete(m, "banana")

	// 遍历（无序）
	for k, v := range m {
		fmt.Printf("%s: %d\n", k, v)
	}

	// nil map 可读不可写
	var nilMap map[string]int
	fmt.Println("nil map 读:", nilMap["key"]) // 0, 不 panic
	// nilMap["key"] = 1 // panic: assignment to entry in nil map
}
```

讲解重点：

- Slice 三要素：指针、len、cap；用 `s[low:high:max]` 三下标切片可限制 cap，防止意外共享
- Map 读取务必用 `v, ok := m[key]` 模式区分"键不存在"和"值为零值"
- nil slice 可以 append，nil map 可以读但不能写（会 panic）

::: tip 延伸阅读
Slice 这部分最容易踩坑的是：子切片后面如果还有剩余 `cap`，`append` 很可能直接复用原底层数组，导致原数据被污染。三下标切片 `s[low:high:max]` 的作用，就是主动把 `cap` 锁死，逼迫后续 `append` 走扩容路径。

详细原理、对照示例和最佳实践见 [Slice 的坑：append 污染原底层数组与三指切片](./01-slice-append-pitfalls.md)。
:::

---

## 4. String 与 []byte 转换

Go 的 string 是不可变的字节序列，底层由指针和长度组成。`[]byte` 和 `string` 之间的转换通常会发生内存拷贝，因为 string 不可变而 `[]byte` 可变，编译器必须保证 string 的不变性。工程实践里，第一原则不是"想办法零拷贝"，而是先把数据流设计清楚：什么时候应该一直保持 `[]byte`，什么时候应该在边界处转成 string。`unsafe` 零拷贝转换只是少数高频热点场景下的优化手段，不应该作为默认方案。

```go
package main

import (
	"fmt"
	"strings"
	"unsafe"
)

func main() {
	// 基本转换（会拷贝内存）
	s := "Hello, 世界"
	b := []byte(s)       // string -> []byte，拷贝
	s2 := string(b)      // []byte -> string，拷贝
	fmt.Println(s2)

	// string 是字节序列，len 返回字节数
	fmt.Println("len:", len(s))                    // 13（UTF-8 编码）
	fmt.Println("rune count:", len([]rune(s)))      // 9（字符数）

	// 遍历方式不同
	fmt.Println("--- byte 遍历 ---")
	for i := 0; i < len(s); i++ {
		fmt.Printf("%d: %x ", i, s[i])
	}
	fmt.Println()

	fmt.Println("--- rune 遍历 ---")
	for i, r := range s { // range 自动按 rune 解码
		fmt.Printf("%d: %c ", i, r)
	}
	fmt.Println()

	// 高效拼接：strings.Builder
	var builder strings.Builder
	for i := 0; i < 1000; i++ {
		builder.WriteString("a")
	}
	result := builder.String()
	fmt.Println("builder len:", len(result))

	// 零拷贝转换（Go 1.22+，慎用）
	bs := []byte("zero copy")
	str := unsafe.String(&bs[0], len(bs))
	fmt.Println("zero copy:", str)
	// 注意：此后不能再修改 bs，否则 str 也会变
}
```

讲解重点：

- `string` <-> `[]byte` 转换默认有内存拷贝开销，高频场景需注意性能
- 用 `range` 遍历 string 按 rune（Unicode 码点）迭代，用下标遍历按字节迭代
- 大量拼接字符串用 `strings.Builder`，避免 `+` 拼接产生大量临时对象

::: tip 延伸阅读
`string` 和 `[]byte` 这块真正重要的不是死记转换规则，而是知道什么场景该直接拷贝、什么场景应当全程保持 `[]byte`、什么时候应该用 `strings.Builder`，以及为什么不要试图修改已存在 `string` 的底层内存。

推荐方案对照表、数据流设计原则和大文件局部修改建议见 [String 与 []byte：转换、构建与数据流最佳实践](./01-string-byte-best-practices.md)。
:::
