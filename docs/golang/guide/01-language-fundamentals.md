# 语言基础深化

## 适合人群

- 已有 Go 基础，想系统补齐语言核心机制的工程师
- 需要深入理解 Go 底层行为（值传递、接口、反射等）的开发者
- 准备能力自检或想建立完整 Go 知识体系的人

## 学习目标

- 掌握 Go 语言核心语法与惯用写法
- 理解值类型与引用语义的本质区别
- 熟练运用 defer/panic/recover、闭包、接口、反射、泛型
- 建立规范的错误处理思维

## 快速导航

- [1. 变量、常量、iota](#_1-变量、常量、iota)
- [2. 值类型 vs 引用语义](#_2-值类型-vs-引用语义)
- [3. 数组、Slice、Map](#_3-数组、slice、map)
- [4. String 与 []byte 转换](#_4-string-与-byte-转换)
- [5. defer / panic / recover](#_5-defer-panic-recover)
- [6. 函数闭包](#_6-函数闭包)
- [7. Interface 底层原理](#_7-interface-底层原理)
- [8. 反射 reflect](#_8-反射-reflect)
- [9. 泛型 generics](#_9-泛型-generics)
- [10. 错误处理设计](#_10-错误处理设计)

---

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

### Slice 的坑：`append` 可能污染原底层数组

切片最容易踩坑的点，不是读写共享本身，而是很多人以为 `append` 一定会返回一块新的内存。这个理解是错的。`append` 只有在容量不够时才会扩容；只要当前 `cap` 还够，它就会直接复用当前底层数组。

#### 1. 不指定 `max` 时，`append` 可能覆盖后续元素

当你写：

```go
original := []int{0, 1, 2, 3, 4}
s := original[1:3]
```

此时：

- `s` 的内容是 `[1, 2]`
- `len(s) == 2`
- `cap(s) == 4`

原因是二下标切片 `original[1:3]` 的容量默认会从 `low` 一直延伸到底层数组末尾，也就是还能“看见”后面的 `3, 4`。

这时如果执行：

```go
s = append(s, 99)
```

Go 会发现：

- 当前 `len=2`
- 当前 `cap=4`
- 还有可用空间

于是它不会分配新内存，而是直接把 `99` 写入底层数组中索引 `3` 的位置。结果就是原切片对应的底层数据被改了：

```go
fmt.Println(original) // [0 1 2 99 4]
```

这就是为什么很多 Go bug 看起来像“我明明只改了子切片，为什么原数据被污染了”。

#### 2. 三指切片的保护作用：主动锁死容量

如果你写成：

```go
safe := original[1:3:3]
```

这就是 The Three-Index Slice，也就是三下标切片 `s[low:high:max]`。

这里的含义是：

- `low = 1`
- `high = 3`
- `max = 3`

所以：

- `len = high - low = 2`
- `cap = max - low = 2`

也就是说，你人为把这个子切片的容量锁死成了和长度一样大。这样一来：

```go
safe = append(safe, 100)
```

Go 会发现：

- `len=2`
- `cap=2`
- 容量已满

为了完成 `append`，它只能申请一块新的内存，把原来的 `[1, 2]` 拷贝过去，再追加 `100`。这样新的 `safe` 就和 `original` 脱离关系了，原切片不会被覆盖：

```go
fmt.Println(original) // [0 1 2 3 4]
```

#### 3. 最佳实践

- 当你只是想暴露某个子区间给下游读取或局部处理，但不希望对方 `append` 时污染原数据，优先使用三下标切片限制容量。
- 当你明确需要隔离副作用时，直接复制一份新切片比依赖调用方自觉更安全：`cloned := append([]int(nil), original[1:3]...)`。
- 只要子切片后面还有剩余容量，就要默认认为 `append` 可能改写原底层数组。

---

## 4. String 与 []byte 转换

Go 的 string 是不可变的字节序列，底层由指针和长度组成。`[]byte` 和 `string` 之间的转换会发生内存拷贝，因为 string 不可变而 `[]byte` 可变，编译器必须保证 string 的不变性。在高频转换场景（如 HTTP 处理、日志格式化），可以用 `unsafe` 包做零拷贝转换来避免性能损耗，但需要确保 `[]byte` 在转换后不被修改。Go 1.22+ 推荐使用 `unsafe.String` 和 `unsafe.SliceData` 进行安全的零拷贝转换。

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

---

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

---

## 7. Interface 底层原理

Go 的接口在运行时有两种底层结构：`eface`（空接口 `interface{}`/`any`）只包含类型指针和数据指针；`iface`（非空接口）还额外包含方法表（`itab`）。接口变量是否为 nil 取决于其类型指针和数据指针**是否都为零**——一个常见陷阱是将具体类型的 nil 指针赋值给接口变量，此时接口的类型信息非空，导致 `interface != nil`。理解这个原理可以避免大量"明明是 nil 但判断不为 nil"的 bug。

```go
package main

import "fmt"

// === nil 接口陷阱 ===
type MyError struct {
	Msg string
}

func (e *MyError) Error() string {
	return e.Msg
}

// 错误示范：返回具体类型的 nil 指针
func badGetError(fail bool) error {
	var err *MyError // nil 指针
	if fail {
		err = &MyError{Msg: "failed"}
	}
	return err // 即使 err 为 nil，接口也不为 nil！
}

// 正确做法：直接返回 nil
func goodGetError(fail bool) error {
	if fail {
		return &MyError{Msg: "failed"}
	}
	return nil // 明确返回 nil 接口
}

// === 接口类型断言与 type switch ===
type Shape interface {
	Area() float64
}

type Circle struct{ Radius float64 }
type Rect struct{ W, H float64 }

func (c Circle) Area() float64 { return 3.14159 * c.Radius * c.Radius }
func (r Rect) Area() float64   { return r.W * r.H }

func describe(s Shape) {
	switch v := s.(type) {
	case Circle:
		fmt.Printf("Circle: radius=%.1f area=%.2f\n", v.Radius, v.Area())
	case Rect:
		fmt.Printf("Rect: %.1fx%.1f area=%.2f\n", v.W, v.H, v.Area())
	default:
		fmt.Printf("Unknown shape: %T\n", v)
	}
}

// === 接口组合 ===
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}

type ReadWriter interface {
	Reader
	Writer
}

func main() {
	// nil 接口陷阱
	fmt.Println("--- nil 接口陷阱 ---")
	err1 := badGetError(false)
	err2 := goodGetError(false)
	fmt.Println("badGetError:", err1 == nil)  // false！
	fmt.Println("goodGetError:", err2 == nil) // true

	// 类型断言
	fmt.Println("\n--- 类型断言 ---")
	var s Shape = Circle{Radius: 5}
	if c, ok := s.(Circle); ok {
		fmt.Println("是 Circle, radius:", c.Radius)
	}

	// type switch
	fmt.Println("\n--- type switch ---")
	describe(Circle{Radius: 3})
	describe(Rect{W: 4, H: 5})
}
```

讲解重点：

- 接口底层：`eface{_type, data}` 用于空接口，`iface{tab, data}` 用于非空接口；两个字段都为零才是 nil
- 永远不要返回具体类型的 nil 指针作为 error 接口，直接 `return nil` 避免 nil 接口陷阱
- 类型断言用 `v, ok := i.(T)` 安全模式，避免断言失败 panic

---

## 8. 反射 reflect

Go 的 `reflect` 包提供运行时类型检查和值操作能力。`reflect.TypeOf` 返回类型信息，`reflect.ValueOf` 返回值的反射对象。反射的三大法则：反射可以从接口值获取反射对象；反射对象可以还原为接口值；要修改反射对象，其值必须可设置（settable，即通过指针传入）。反射常用于序列化框架、ORM、配置解析等场景，但性能开销大，生产代码应尽量避免在热路径使用。

```go
package main

import (
	"fmt"
	"reflect"
)

type Config struct {
	Host    string `json:"host" env:"APP_HOST" required:"true"`
	Port    int    `json:"port" env:"APP_PORT"`
	Debug   bool   `json:"debug" env:"APP_DEBUG"`
}

// 读取 struct tag 信息
func inspectTags(v interface{}) {
	t := reflect.TypeOf(v)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	fmt.Printf("Type: %s\n", t.Name())
	for i := 0; i < t.NumField(); i++ {
		field := t.Field(i)
		fmt.Printf("  %s: json=%q env=%q required=%q\n",
			field.Name,
			field.Tag.Get("json"),
			field.Tag.Get("env"),
			field.Tag.Get("required"),
		)
	}
}

// 通过反射修改 struct 字段
func setField(obj interface{}, name string, value interface{}) error {
	v := reflect.ValueOf(obj)
	if v.Kind() != reflect.Ptr || v.Elem().Kind() != reflect.Struct {
		return fmt.Errorf("需要传入 struct 指针")
	}

	field := v.Elem().FieldByName(name)
	if !field.IsValid() {
		return fmt.Errorf("字段 %s 不存在", name)
	}
	if !field.CanSet() {
		return fmt.Errorf("字段 %s 不可设置", name)
	}

	val := reflect.ValueOf(value)
	if field.Type() != val.Type() {
		return fmt.Errorf("类型不匹配: 期望 %s, 得到 %s", field.Type(), val.Type())
	}

	field.Set(val)
	return nil
}

func main() {
	// 基本类型信息
	fmt.Println("--- TypeOf / ValueOf ---")
	x := 42
	fmt.Println("Type:", reflect.TypeOf(x))           // int
	fmt.Println("Value:", reflect.ValueOf(x))          // 42
	fmt.Println("Kind:", reflect.TypeOf(x).Kind())     // int

	// Struct Tag 读取
	fmt.Println("\n--- Struct Tags ---")
	cfg := Config{Host: "localhost", Port: 8080, Debug: true}
	inspectTags(cfg)

	// 通过反射修改值（必须传指针）
	fmt.Println("\n--- 反射修改值 ---")
	err := setField(&cfg, "Host", "0.0.0.0")
	if err != nil {
		fmt.Println("error:", err)
	}
	fmt.Println("修改后:", cfg)

	// 动态调用方法
	fmt.Println("\n--- 动态调用 ---")
	s := "hello"
	v := reflect.ValueOf(s)
	upper := v.MethodByName("Clone") // string 没有 Clone，演示 IsValid 检查
	if !upper.IsValid() {
		fmt.Println("方法不存在，反射调用前要用 IsValid 检查")
	}
}
```

讲解重点：

- 反射修改值必须传入指针，并通过 `Elem()` 获取指向的值，否则 `CanSet()` 返回 false
- `reflect.TypeOf` 用于获取类型和 struct tag，`reflect.ValueOf` 用于读写值
- 反射性能比直接操作慢 1-2 个数量级，热路径避免使用；优先考虑代码生成或泛型替代

---

## 9. 泛型 generics

Go 1.18 引入泛型，通过类型参数（type parameters）和类型约束（constraints）实现类型安全的通用代码。约束用接口定义，可以包含类型集合（`~int | ~float64`）和方法集合。泛型最适合用于容器类型（如通用 slice 操作）、算法函数（如排序、查找）和减少类型断言的场景。避免过度使用泛型——如果 `interface{}` 或具体类型就能清晰表达，就不需要泛型。

```go
package main

import (
	"cmp"
	"fmt"
	"slices"
)

// 类型约束：可比较的数字类型
type Number interface {
	~int | ~int32 | ~int64 | ~float32 | ~float64
}

// 泛型函数：求和
func Sum[T Number](nums []T) T {
	var total T
	for _, n := range nums {
		total += n
	}
	return total
}

// 泛型函数：过滤
func Filter[T any](slice []T, predicate func(T) bool) []T {
	result := make([]T, 0)
	for _, v := range slice {
		if predicate(v) {
			result = append(result, v)
		}
	}
	return result
}

// 泛型函数：Map 转换
func Map[T any, R any](slice []T, transform func(T) R) []R {
	result := make([]R, len(slice))
	for i, v := range slice {
		result[i] = transform(v)
	}
	return result
}

// 泛型类型：有序 Set
type Set[T comparable] struct {
	items map[T]struct{}
}

func NewSet[T comparable]() *Set[T] {
	return &Set[T]{items: make(map[T]struct{})}
}

func (s *Set[T]) Add(v T)          { s.items[v] = struct{}{} }
func (s *Set[T]) Contains(v T) bool { _, ok := s.items[v]; return ok }
func (s *Set[T]) Len() int         { return len(s.items) }

func main() {
	// 泛型求和
	ints := []int{1, 2, 3, 4, 5}
	floats := []float64{1.1, 2.2, 3.3}
	fmt.Println("int sum:", Sum(ints))       // 15
	fmt.Println("float sum:", Sum(floats))   // 6.6

	// 泛型过滤
	evens := Filter(ints, func(n int) bool { return n%2 == 0 })
	fmt.Println("evens:", evens) // [2 4]

	// 泛型 Map
	strs := Map(ints, func(n int) string {
		return fmt.Sprintf("#%d", n)
	})
	fmt.Println("mapped:", strs) // [#1 #2 #3 #4 #5]

	// 泛型 Set
	s := NewSet[string]()
	s.Add("go")
	s.Add("rust")
	s.Add("go") // 重复
	fmt.Println("set size:", s.Len())          // 2
	fmt.Println("contains go:", s.Contains("go")) // true

	// 标准库泛型：slices 和 cmp（Go 1.21+）
	nums := []int{5, 2, 8, 1, 9}
	slices.Sort(nums)
	fmt.Println("sorted:", nums)

	fmt.Println("max:", slices.Max(nums))
	fmt.Println("cmp:", cmp.Compare(3, 5)) // -1
}
```

讲解重点：

- `~T` 表示底层类型为 T 的所有类型（包括自定义类型），`comparable` 约束用于 map key 等需要 `==` 的场景
- 标准库 `slices` 和 `cmp` 包（Go 1.21+）提供了常用泛型工具函数，优先使用而非自己实现
- 泛型适用于通用数据结构和算法；业务逻辑代码通常用接口多态更清晰

---

## 10. 错误处理设计

Go 用返回值而非异常处理错误，核心原则是：错误是值，可以被编程处理。Go 1.13 引入 `errors.Is`（判断错误链中是否包含特定错误）和 `errors.As`（从错误链中提取特定类型错误）以及 `fmt.Errorf` 的 `%w` 动词用于错误包装。良好的错误处理设计应该分层：底层返回 sentinel error 或自定义错误类型，中间层用 `%w` 包装添加上下文，上层用 `errors.Is/As` 做决策。避免对所有错误都 `log.Fatal` 或简单打印。

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
