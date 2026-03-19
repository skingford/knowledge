---
title: Interface、反射与泛型
description: Go Interface 底层原理（eface/iface）、nil 陷阱、reflect 反射机制、泛型类型参数与约束。
head:
  - - meta
    - name: keywords
      content: Go Interface,eface,iface,nil陷阱,reflect反射,泛型,generics,类型约束
---

# Interface、反射与泛型

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
