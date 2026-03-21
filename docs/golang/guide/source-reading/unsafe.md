---
title: unsafe 包源码精读
description: 精读 unsafe 包的指针操作、内存布局函数与零拷贝转换，理解 Go 底层内存模型的边界。
---

# unsafe：内存操作源码精读

> 核心源码：`src/unsafe/unsafe.go`（接口定义）、编译器内置实现（`cmd/compile/internal/typecheck`）
>
> 图例参考：
> - `GoRuntimeDiagram`：`unsafe-pointer-flow`

## 包结构图

```
unsafe 包全景
══════════════════════════════════════════════════════════════════

  函数（编译器内置，非普通函数调用）
  ├── unsafe.Sizeof(x)        ← x 的内存大小（字节），不含间接引用
  ├── unsafe.Alignof(x)       ← x 的对齐要求
  ├── unsafe.Offsetof(x.f)    ← 结构体字段 f 的偏移量
  ├── unsafe.Add(ptr, delta)  ← 指针算术（Go 1.17+）
  └── unsafe.Slice(ptr, len)  ← 从原始指针构造切片（Go 1.17+）
      unsafe.SliceData(s)     ← 切片底层数组指针（Go 1.17+）
      unsafe.String(ptr, len) ← 从原始指针构造字符串（Go 1.20+）
      unsafe.StringData(s)    ← 字符串底层指针（Go 1.20+）

  核心类型
  └── unsafe.Pointer          ← 通用指针（可在任意类型指针间转换）

  6 条合法转换规则（GC 安全）：
  ├── *T → unsafe.Pointer
  ├── unsafe.Pointer → *T
  ├── uintptr ← unsafe.Pointer（只在单一表达式中）
  ├── unsafe.Pointer ← uintptr（有条件，见下文）
  ├── syscall.Syscall 参数中的 uintptr
  └── reflect.Value.Pointer / reflect.Value.UnsafeAddr

══════════════════════════════════════════════════════════════════
```

<GoRuntimeDiagram kind="unsafe-pointer-flow" />

---

## 一、unsafe.Pointer 的本质

```
unsafe.Pointer vs uintptr 的区别
══════════════════════════════════════════════════════════════════

  unsafe.Pointer          uintptr
  ┌──────────────┐        ┌──────────────┐
  │ 持有 GC 引用 │        │ 普通整数      │
  │ GC 可追踪    │        │ GC 不追踪     │
  │ 可安全保存   │        │ 对象可能移动  │
  └──────────────┘        └──────────────┘

  ⚠️ 危险写法（uintptr 临时保存地址，期间 GC 可能移动对象）：
  p := uintptr(unsafe.Pointer(&x))  // 保存到变量
  // GC 运行，x 移动，p 指向无效地址
  // ... 后续使用 p 已 unsafe

  ✅ 安全写法（在单一表达式内完成转换）：
  p := (*int)(unsafe.Pointer(uintptr(unsafe.Pointer(&x)) + offset))

══════════════════════════════════════════════════════════════════
```

---

## 二、内存布局函数

```go
// src/unsafe/unsafe.go（声明，实际由编译器实现）

type ArbitraryType int
type IntegerType int
type Pointer *ArbitraryType

func Sizeof(x ArbitraryType) uintptr   // 编译期常量
func Alignof(x ArbitraryType) uintptr  // 编译期常量
func Offsetof(x ArbitraryType) uintptr // 编译期常量，仅用于 x.field 形式
```

```
常见类型的 Sizeof / Alignof（64位系统）
══════════════════════════════════════════════════════════════════

  类型              Sizeof   Alignof
  ─────────────────────────────────
  bool              1        1
  int8/uint8        1        1
  int16/uint16      2        2
  int32/uint32      4        4
  int64/uint64      8        8
  float32           4        4
  float64           8        8
  complex64         8        4
  complex128        16       8
  uintptr           8        8
  string            16       8   （ptr + len）
  slice             24       8   （ptr + len + cap）
  interface{}       16       8   （type + data）
  pointer           8        8

══════════════════════════════════════════════════════════════════
```

### 结构体内存对齐与 Offsetof

```go
type Example struct {
    A bool    // offset=0,  size=1
    // padding  [3]byte    // offset=1..3（为 B 对齐）
    B int32   // offset=4,  size=4
    C bool    // offset=8,  size=1
    // padding  [7]byte    // offset=9..15（为 D 对齐）
    D float64 // offset=16, size=8
}
// Sizeof(Example{}) = 24（最大对齐 8，总大小为 8 的倍数）

fmt.Println(unsafe.Offsetof(Example{}.A)) // 0
fmt.Println(unsafe.Offsetof(Example{}.B)) // 4
fmt.Println(unsafe.Offsetof(Example{}.C)) // 8
fmt.Println(unsafe.Offsetof(Example{}.D)) // 16
```

---

## 三、指针算术（unsafe.Add）

```go
// Go 1.17+ 引入，编译器直接处理
func Add(ptr Pointer, delta IntegerType) Pointer

// 等价于旧写法：
// unsafe.Pointer(uintptr(ptr) + delta)
// 但 Add 更安全：编译器保证不分拆 ptr 和 delta
```

```go
// 访问结构体字段（演示，生产用 reflect 更清晰）
type Point struct{ X, Y int32 }
p := &Point{X: 1, Y: 2}

// 访问 Y 字段
yPtr := (*int32)(unsafe.Add(unsafe.Pointer(p), unsafe.Offsetof(p.Y)))
fmt.Println(*yPtr) // 2
```

---

## 四、零拷贝 string ↔ []byte（Go 1.20+）

```go
// src/strings/builder.go 中的 String() 实现
func (b *Builder) String() string {
    return unsafe.String(unsafe.SliceData(b.buf), len(b.buf))
    // unsafe.SliceData：获取切片底层数组指针
    // unsafe.String：从指针+长度构造 string，零拷贝
}
```

```
string ↔ []byte 转换方式对比
══════════════════════════════════════════════════════════════════

  方式                              是否拷贝   安全性
  ─────────────────────────────────────────────────────
  string(b)                         是         安全
  []byte(s)                         是         安全
  unsafe.String(ptr, len)           否         需保证 ptr 存活
  unsafe.Slice(ptr, len)            否         需保证只读
  *(*string)(unsafe.Pointer(&b))    否（旧法） 不推荐
  ─────────────────────────────────────────────────────

  ✅ Go 1.20+ 推荐的零拷贝写法：
  func bytesToString(b []byte) string {
      return unsafe.String(unsafe.SliceData(b), len(b))
  }

  func stringToBytes(s string) []byte {
      return unsafe.Slice(unsafe.StringData(s), len(s))
      // ⚠️ 不可写入，string 底层是只读内存
  }

══════════════════════════════════════════════════════════════════
```

---

## 五、读取私有字段（反射无法访问时）

```go
// 示例：读取 sync.Mutex 的内部状态（仅用于监控，生产慎用）
import "sync"

func mutexState(m *sync.Mutex) int32 {
    // Mutex 第一个字段是 state int32
    return *(*int32)(unsafe.Pointer(m))
}

func main() {
    var mu sync.Mutex
    mu.Lock()
    fmt.Printf("locked state: %d\n", mutexState(&mu)) // 1
    mu.Unlock()
    fmt.Printf("unlocked state: %d\n", mutexState(&mu)) // 0
}
```

---

## 六、代码示例

### 高性能字节处理（避免 string/[]byte 拷贝）

```go
// HTTP handler 中检查路径前缀，避免 []byte → string 拷贝
func hasPrefix(b []byte, prefix string) bool {
    if len(b) < len(prefix) {
        return false
    }
    // 临时零拷贝转换（不保存变量，GC 安全）
    return unsafe.String(unsafe.SliceData(b), len(prefix)) == prefix
}
```

### 紧凑结构体设计（减少 padding）

```go
// ❌ 浪费空间（Sizeof = 24）
type Bad struct {
    A bool    // 1 byte + 7 padding
    B float64 // 8 bytes
    C bool    // 1 byte + 7 padding
}

// ✅ 重排字段（Sizeof = 16）
type Good struct {
    B float64 // 8 bytes（先放大字段）
    A bool    // 1 byte
    C bool    // 1 byte + 6 padding
}

// 技巧：按字段大小从大到小排列，减少 padding

// 实际项目：使用 go vet 或 fieldalignment 工具自动检测
// go install golang.org/x/tools/go/analysis/passes/fieldalignment/cmd/fieldalignment@latest
// fieldalignment ./...
```

### sync/atomic 操作自定义结构体字段

```go
type Stats struct {
    _       [0]func()  // 防止误用（不可比较）
    count   int64
    errCount int64
}

func (s *Stats) Inc() {
    atomic.AddInt64((*int64)(unsafe.Pointer(&s.count)), 1)
}
```

---

## 七、cgo 内存交互

```go
/*
#include <stdlib.h>
#include <string.h>

char* createString(int n) {
    return (char*)malloc(n);
}
*/
import "C"
import "unsafe"

func cgoExample() {
    // C 分配内存 → Go 使用 → C 释放
    cStr := C.createString(256)
    defer C.free(unsafe.Pointer(cStr))

    // Go string → C string（有内存分配）
    goStr := "hello from Go"
    cGoStr := C.CString(goStr)
    defer C.free(unsafe.Pointer(cGoStr))

    // C 内存视为 Go byte slice（零拷贝读取）
    // ⚠️ 不可让 GC 管理 C 内存
    goSlice := unsafe.Slice((*byte)(unsafe.Pointer(cStr)), 256)
    _ = goSlice
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| unsafe.Pointer 和 uintptr 的区别？ | Pointer 持有 GC 引用，GC 不会移动其指向对象；uintptr 是普通整数，GC 不追踪 |
| 什么时候用 unsafe？ | 零拷贝 string/[]byte 互转；访问结构体私有字段；与 C 库互操作 |
| Sizeof([]int) 是多少？ | 24（ptr 8 + len 8 + cap 8），不含元素占用 |
| 如何安全地做指针算术？ | 用 unsafe.Add，在单一表达式中完成，不把 uintptr 存入变量 |
| struct 如何减少内存占用？ | 字段按大小降序排列，减少 padding；或用 -gcflags=-S 查看汇编 |
| Go 1.17/1.20 引入了什么 unsafe 函数？ | 1.17: Add/Slice；1.20: SliceData/String/StringData |
| 为什么 `uintptr` 不能长期持有地址？ | `uintptr` 是整数，GC 不知道它指向堆对象；GC 移动对象（未来计划）或对象被回收后，`uintptr` 成为悬空指针 |
| `unsafe.Pointer` 的 6 条合法规则中最重要的是？ | 规则 3：`uintptr` → `unsafe.Pointer` 必须在**同一个表达式**中完成，不可将 `uintptr` 存入变量后再转换 |
| `unsafe.Sizeof` 和 `reflect.Type.Size()` 的区别？ | 结果相同，但 `unsafe.Sizeof` 在编译期计算（零开销）；`reflect.Type.Size()` 是运行时方法（有反射开销） |
| 什么时候应该使用 `unsafe`？ | 极少数高性能场景（零拷贝转换、特定底层操作）；CGO 交互；实现类似 `sync/atomic` 的基础库；业务代码应完全避免 |
