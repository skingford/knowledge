---
title: runtime.SetFinalizer 源码精读
description: 精读 Go runtime.SetFinalizer 终结器实现，掌握 GC 钩子、资源泄漏检测、弱引用模式与安全资源清理最佳实践。
---

# runtime.SetFinalizer：GC 终结器源码精读

> 核心源码：`src/runtime/mfinal.go`、`src/runtime/malloc.go`
>
> 图例参考：
> - `GoRuntimeDiagram`：`finalizer-lifecycle`

## 包结构图

```
runtime.SetFinalizer 体系
══════════════════════════════════════════════════════════════════

  终结器（Finalizer）执行流程：
  1. 对象分配 → SetFinalizer 注册终结器函数
  2. 对象变为不可达（无强引用）
  3. GC 扫描时发现：对象有终结器但不可达
  4. 对象转为"等待终结化"状态（不立即回收）
  5. 专用 goroutine 执行终结器函数
  6. 下一次 GC 才真正回收内存

  ⚠️ 关键限制：
  ├── 不保证执行时机（可能永远不执行：程序退出时）
  ├── 不保证执行顺序（对象间有引用关系时难以预测）
  ├── 延迟一个 GC 周期回收（增加内存压力）
  ├── 不适合释放有序依赖的资源（如数据库事务）
  └── 在终结器中调用 SetFinalizer 可重新注册（循环终结）

  正确使用场景：
  ├── 资源泄漏检测（调试工具，打印栈跟踪）
  ├── 外部资源兜底清理（操作系统句柄、C 内存）
  └── 对象生命周期监控（不依赖终结器做关键清理）

  推荐替代方案：
  ├── defer close/cleanup  ← 首选（确定性）
  ├── context.WithCancel   ← goroutine 生命周期
  └── io.Closer 接口       ← 显式关闭约定

══════════════════════════════════════════════════════════════════
```

<GoRuntimeDiagram kind="finalizer-lifecycle" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/runtime/mfinal.go（简化）

// SetFinalizer：为对象 x 注册终结器函数 f
// x 必须是指针，f 接受一个相同类型的指针参数
func SetFinalizer(obj any, finalizer any) {
    // 1. 验证 obj 是指针且分配在堆上
    // 2. 将 (obj指针, finalizer函数) 存入 fing（finalizer goroutine 队列）
    // 3. GC 时：若 obj 不可达，放入 finq（待执行队列）
}

// finalizer goroutine（runtime 内部单例）：
// - 从 finq 取出待执行的终结器
// - 在独立的栈帧中调用 finalizer(obj)
// - 执行完后 obj 才真正无引用，下次 GC 回收

// KeepAlive：防止对象被过早终结化
func KeepAlive(x any) {
    // 告知编译器：x 的引用持续到此处
    // 无实际代码，纯编译器语义
}
```
:::

---

## 二、代码示例

### 资源泄漏检测（调试工具）

::: details 点击展开代码：资源泄漏检测（调试工具）
```go
import (
    "runtime"
    "runtime/debug"
    "fmt"
)

// FileWrapper：带泄漏检测的文件句柄
type FileWrapper struct {
    file     *os.File
    closed   bool
    openStack []byte // 记录 Open 时的调用栈
}

func OpenFile(name string) (*FileWrapper, error) {
    f, err := os.Open(name)
    if err != nil {
        return nil, err
    }

    fw := &FileWrapper{
        file:      f,
        openStack: debug.Stack(), // 记录打开时的调用栈
    }

    // 注册终结器：如果 fw 被 GC 时仍未关闭，打印泄漏信息
    runtime.SetFinalizer(fw, func(fw *FileWrapper) {
        if !fw.closed {
            fmt.Printf("⚠️ 文件泄漏检测：%s 未被关闭\n打开时的调用栈:\n%s\n",
                name, fw.openStack)
            fw.file.Close() // 兜底关闭
        }
    })

    return fw, nil
}

func (fw *FileWrapper) Close() error {
    fw.closed = true
    runtime.SetFinalizer(fw, nil) // 移除终结器（已正常关闭）
    return fw.file.Close()
}

// 使用
func processFile(name string) error {
    fw, err := OpenFile(name)
    if err != nil {
        return err
    }
    defer fw.Close() // 正常路径：defer 关闭，终结器被移除
    // ...
    return nil
}
```
:::

### 外部 C 资源管理

::: details 点击展开代码：外部 C 资源管理
```go
// #cgo 场景：管理 C 库分配的内存
// （无法通过 Go GC 自动管理）

/*
#include <stdlib.h>
char* createBuffer(int size) { return (char*)malloc(size); }
void freeBuffer(char* buf) { free(buf); }
*/
import "C"
import "unsafe"

type CBuffer struct {
    ptr  *C.char
    size int
}

func NewCBuffer(size int) *CBuffer {
    buf := &CBuffer{
        ptr:  C.createBuffer(C.int(size)),
        size: size,
    }

    if buf.ptr == nil {
        panic("C malloc failed")
    }

    // 兜底：防止 Go 侧忘记调用 Free
    runtime.SetFinalizer(buf, func(b *CBuffer) {
        if b.ptr != nil {
            C.freeBuffer(b.ptr)
            b.ptr = nil
        }
    })

    return buf
}

func (b *CBuffer) Free() {
    if b.ptr != nil {
        C.freeBuffer(b.ptr)
        b.ptr = nil
        runtime.SetFinalizer(b, nil) // 移除终结器
    }
}

func (b *CBuffer) Bytes() []byte {
    return (*[1 << 30]byte)(unsafe.Pointer(b.ptr))[:b.size:b.size]
}
```
:::

### KeepAlive：防止提前终结化

::: details 点击展开代码：KeepAlive：防止提前终结化
```go
// 问题：编译器可能在最后一次使用 obj 后认为它不可达
// 导致终结器过早执行（在关联的 C/OS 资源还在使用时）

type Timer struct {
    c    *C.timer_t // C 层定时器
    ch   chan struct{}
}

func (t *Timer) Wait() {
    select {
    case <-t.ch:
    }
    // ⚠️ 如果不加 KeepAlive，编译器可能在 <-t.ch 之后
    // 认为 t 不可达，触发终结器（关闭 C 定时器），
    // 但 C 定时器回调还在运行中！
    runtime.KeepAlive(t) // 确保 t 在此处仍然存活
}

// 等效写法（更常见）：
func processData(data *LargeData) {
    handle := data.cHandle
    result := processWithHandle(handle)
    // 编译器看到 data 不再被使用，可能在此行前回收 data
    // 但 data 的终结器会 free(handle)！
    runtime.KeepAlive(data) // 保证 data 活到此处
    return result
}
```
:::

### 弱引用模式（Go 1.24 前的方案）

::: details 点击展开代码：弱引用模式（Go 1.24 前的方案）
```go
// Go 1.23 前：用 map+WeakRef 实现弱引用
// （Go 1.24+ 有 weak.Pointer 官方支持）

type WeakRef struct {
    mu  sync.Mutex
    val any
}

func NewWeakRef(obj any) *WeakRef {
    w := &WeakRef{val: obj}
    // 当 obj 被 GC，清空 WeakRef
    runtime.SetFinalizer(obj, func(_ any) {
        w.mu.Lock()
        w.val = nil
        w.mu.Unlock()
    })
    return w
}

func (w *WeakRef) Get() any {
    w.mu.Lock()
    defer w.mu.Unlock()
    return w.val
}

// 使用：观察者模式中持有弱引用，避免阻止 GC
type EventBus struct {
    handlers []*WeakRef
}

func (b *EventBus) Subscribe(h *Handler) {
    b.handlers = append(b.handlers, NewWeakRef(h))
}

func (b *EventBus) Emit(event Event) {
    var alive []*WeakRef
    for _, ref := range b.handlers {
        if h, ok := ref.Get().(*Handler); ok && h != nil {
            h.Handle(event)
            alive = append(alive, ref)
        }
        // 已被 GC 的 handler 自动过滤
    }
    b.handlers = alive
}
```
:::

### 对象池与终结器配合

::: details 点击展开代码：对象池与终结器配合
```go
// 场景：对象池中检测对象是否被归还
type PooledConn struct {
    conn     net.Conn
    returned bool
    pool     *ConnPool
}

func (p *ConnPool) Get() *PooledConn {
    c := &PooledConn{
        conn: p.dial(),
        pool: p,
    }

    runtime.SetFinalizer(c, func(c *PooledConn) {
        if !c.returned {
            // 连接泄漏：没有归还到池中
            log.Printf("连接泄漏：%v", c.conn.RemoteAddr())
            c.conn.Close()
            p.stats.leaked.Add(1)
        }
    })
    return c
}

func (p *ConnPool) Put(c *PooledConn) {
    c.returned = true
    runtime.SetFinalizer(c, nil) // 正常归还，移除终结器
    p.pool <- c.conn
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `runtime.SetFinalizer` 有什么执行保证？ | 无！不保证执行时机（程序正常退出时可能不执行）；不保证执行顺序；GC 才能触发，GC 频率不定；绝不能用于关键资源释放 |
| 为什么终结器执行后对象才在下一次 GC 被回收？ | GC 发现不可达对象有终结器时，将其移入"等待终结化"队列（仍存活）；终结器执行完后对象再次无引用；下次 GC 才真正回收 |
| `runtime.KeepAlive` 的实际用途？ | 防止编译器过早认为对象不可达（触发终结器）；典型场景：CGO 中 Go 包装 C 资源，确保 Go 包装对象存活到 C 调用返回后 |
| 如何正确移除终结器？ | `runtime.SetFinalizer(obj, nil)`；通常在对象正常关闭/归还时调用，防止终结器重复执行清理逻辑 |
| 终结器能调用 `SetFinalizer` 重新注册自己吗？ | 可以，这会导致对象在每次 GC 后复活一次；可用于实现"每 N 次 GC 检查一次"的周期性任务，但非常规用法 |
| 生产代码中什么情况可以用终结器？ | 资源泄漏调试（开发/测试环境）；CGO 外部资源的兜底清理；观察者模式中弱引用实现；主路径仍应使用 defer/Close 显式清理 |
