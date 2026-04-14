---
title: sync/atomic 源码精读
description: 精读 sync/atomic 原子操作与 atomic.Value 实现，理解无锁编程的底层原语。
---

# sync/atomic：原子操作源码精读

> 核心源码：`src/sync/atomic/doc.go`、`src/sync/atomic/value.go`、`src/sync/atomic/type.go`
>
> 图例参考：复用 [锁、原子操作与同步原语](../03-sync-primitives.md) 和 [底层原理](../02-underlying-principles.md) 里的 CAS、可见性图例，先看单变量原子更新和 `happens-before`，再回头看 `atomic.Value` 和泛型包装类型。

这篇聚焦无锁原语和内存可见性，不再展开 `Mutex`、`WaitGroup`、`Once` 等更高层同步工具。

如果你想先建立同步体系的整体认知，先看：

- 总览：[sync 包源码精读](./sync-primitives.md)

如果你的问题是“什么时候该用锁、什么时候该用原子操作”，建议把这页和 `sync-primitives` 对照着看。

## 包结构图

<GoSyncPrimitiveDiagram kind="atomic-cas" />

```
sync/atomic 包结构
══════════════════════════════════════════════════════════════════

  函数族（对应硬件原子指令）
  ├── Load*      → 原子读（内存屏障保证可见性）
  ├── Store*     → 原子写
  ├── Add*       → 原子加减
  ├── Swap*      → 原子交换（返回旧值）
  └── CompareAndSwap* (CAS) → 比较并交换（返回是否成功）

  泛型类型（Go 1.19+，推荐使用）
  ├── atomic.Int32 / Int64 / Uint32 / Uint64 / Uintptr
  ├── atomic.Bool
  ├── atomic.Pointer[T]
  └── atomic.Value（任意类型，但类型必须一致）

  支持的类型：int32, int64, uint32, uint64, uintptr, unsafe.Pointer

══════════════════════════════════════════════════════════════════
```

---

## 一、原子操作原理

```
原子操作 vs 普通操作 vs 互斥锁
══════════════════════════════════════════════════════════════════

  普通操作（非原子）：
  ┌─────────────────────────────────────────────────────────┐
  │  LOAD  reg, [addr]   ← 读取内存到寄存器（非原子）       │
  │  ADD   reg, 1        ← 加法                             │
  │  STORE [addr], reg   ← 写回内存（非原子）               │
  │  多个 CPU 并发时：两次 LOAD 可能读到相同旧值 → 数据竞争 │
  └─────────────────────────────────────────────────────────┘

  原子 ADD（硬件保证）：
  ┌─────────────────────────────────────────────────────────┐
  │  LOCK XADD [addr], val  ← x86 单指令，总线锁保证原子性  │
  │  或 LDREX/STREX         ← ARM 独占加载/存储对           │
  └─────────────────────────────────────────────────────────┘

  性能对比（相对倍数）：
  ┌──────────────────────────────────────────────────────┐
  │  操作                    延迟（近似）                 │
  ├──────────────────────────────────────────────────────┤
  │  普通读写（L1 cache hit） 1x                          │
  │  atomic.Load/Store        ~2-5x（内存屏障）           │
  │  atomic.Add               ~5-10x（LOCK 前缀）         │
  │  atomic CAS               ~5-10x（竞争时重试更慢）    │
  │  sync.Mutex Lock/Unlock   ~30-50x                     │
  └──────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 二、CAS（Compare-And-Swap）

```
CAS 语义
══════════════════════════════════════════════════════

  CompareAndSwapInt64(addr *int64, old, new int64) bool

  原子执行：
  if *addr == old {
      *addr = new
      return true
  }
  return false

  CAS 是构建无锁数据结构的基础原语：
  ├── sync.Mutex 底层使用 CAS 获取锁
  ├── channel 操作使用 CAS 更新状态
  └── sync.Once 的 done 字段使用原子操作

  ABA 问题：
  ├── 线程 A 读旧值 = 1
  ├── 线程 B 将值改为 2，再改回 1
  ├── 线程 A 的 CAS(1→3) 成功（误认为未改变）
  └── Go 指针 CAS 不受 ABA 影响（GC 保证地址唯一性）

══════════════════════════════════════════════════════
```

---

## 三、atomic.Value 实现

::: details 点击展开代码：三、atomic.Value 实现
```go
// src/sync/atomic/value.go
type Value struct {
    v any  // 存储 interface{} 的 type+data 两个指针
}

// 内部表示（利用 interface{} 的内存布局）
type efaceWords struct {
    typ  unsafe.Pointer  // 类型指针
    data unsafe.Pointer  // 数据指针
}

// Store 使用 CAS 保证首次写入原子性
func (v *Value) Store(val any) {
    vp := (*efaceWords)(unsafe.Pointer(v))
    vlp := (*efaceWords)(unsafe.Pointer(&val))
    for {
        typ := LoadPointer(&vp.typ)
        if typ == nil {
            // 首次写：用 firstStoreInProgress 占位（防止并发重复初始化）
            runtime_procPin()  // 禁止抢占
            if !CompareAndSwapPointer(&vp.typ, nil, firstStoreInProgress) {
                runtime_procUnpin()
                continue
            }
            StorePointer(&vp.data, vlp.data)
            StorePointer(&vp.typ, vlp.typ)
            runtime_procUnpin()
            return
        }
        // 类型必须一致（不能存不同类型）
        if typ != vlp.typ { panic(...) }
        StorePointer(&vp.data, vlp.data)
        return
    }
}
```
:::

```
atomic.Value 关键约束
══════════════════════════════════════════════════════

  ① 存储的具体类型必须始终一致（不能先存 int 再存 string）
  ② Store(nil) 会 panic
  ③ 首次 Load 在 Store 之前返回 nil（不是零值）
  ④ 适合：配置热更新、只读数据的无锁读取

══════════════════════════════════════════════════════
```

---

## 四、泛型原子类型（Go 1.19+）

```
推荐使用泛型包装类型（比函数族更安全）
══════════════════════════════════════════════════════

  atomic.Int64           atomic.Bool
  ┌────────────────┐     ┌────────────────┐
  │ v int64        │     │ _ noCopy       │
  │                │     │ v uint32       │
  │ Load() int64   │     │                │
  │ Store(int64)   │     │ Load() bool    │
  │ Add(int64)     │     │ Store(bool)    │
  │ Swap(int64)    │     │ Swap(bool)     │
  │ CAS(old, new)  │     │ CAS(old, new)  │
  └────────────────┘     └────────────────┘

  atomic.Pointer[T]
  ┌────────────────────────────────────────┐
  │ v unsafe.Pointer                       │
  │                                        │
  │ Load() *T                              │
  │ Store(*T)                              │
  │ Swap(*T) *T                            │
  │ CompareAndSwap(old, new *T) bool       │
  └────────────────────────────────────────┘
  → 类型安全的指针原子操作，避免 unsafe 直接操作

══════════════════════════════════════════════════════
```

---

## 五、代码示例

### 原子计数器

::: details 点击展开代码：原子计数器
```go
// 推荐：使用泛型类型
type Counter struct {
    n atomic.Int64
}

func (c *Counter) Inc()          { c.n.Add(1) }
func (c *Counter) Dec()          { c.n.Add(-1) }
func (c *Counter) Value() int64  { return c.n.Load() }
func (c *Counter) Reset()        { c.n.Store(0) }

// 使用
var hits Counter
go func() { hits.Inc() }()
go func() { hits.Inc() }()
fmt.Println(hits.Value())
```
:::

### atomic.Value 热更新配置

::: details 点击展开代码：atomic.Value 热更新配置
```go
type Config struct {
    MaxConns int
    Timeout  time.Duration
}

type Server struct {
    cfg atomic.Value // 存储 *Config
}

func (s *Server) UpdateConfig(c *Config) {
    s.cfg.Store(c) // 原子写，无需加锁
}

func (s *Server) getConfig() *Config {
    return s.cfg.Load().(*Config) // 原子读，无需加锁
}

func (s *Server) Handle() {
    cfg := s.getConfig()
    // cfg 是一致的快照，在本次请求中不变
    _ = cfg.MaxConns
}
```
:::

### CAS 实现无锁自旋锁

::: details 点击展开代码：CAS 实现无锁自旋锁
```go
type SpinLock struct {
    locked atomic.Int32
}

func (s *SpinLock) Lock() {
    for !s.locked.CompareAndSwap(0, 1) {
        runtime.Gosched() // 让出 CPU，防止 busy wait 占满核
    }
}

func (s *SpinLock) Unlock() {
    s.locked.Store(0)
}
```
:::

### atomic.Pointer 无锁链表节点替换

::: details 点击展开代码：atomic.Pointer 无锁链表节点替换
```go
type Node struct {
    val  int
    next *Node
}

type Stack struct {
    head atomic.Pointer[Node]
}

func (s *Stack) Push(val int) {
    newNode := &Node{val: val}
    for {
        old := s.head.Load()
        newNode.next = old
        if s.head.CompareAndSwap(old, newNode) {
            return // CAS 成功，入栈完成
        }
        // CAS 失败（head 被其他 goroutine 修改），重试
    }
}
```
:::

---

## 六、内存顺序与可见性

<GoRuntimeDiagram kind="happens-before" />

```
Go 的内存模型约定（happens-before）
══════════════════════════════════════════════════════

  atomic.Store(addr, v)    在  atomic.Load(addr) 之前
  → Load 一定能看到 Store 的写入

  对比：
  ├── 普通写  后 普通读  → 不保证可见性（CPU 缓存/重排序）
  ├── atomic.Store 后 atomic.Load → 保证可见性
  └── Mutex.Lock 后 读  → 保证可见性（但有额外开销）

  单纯用 atomic 不能替代 Mutex 的场景：
  └── 多个变量需要同时保持一致性（需要 Mutex 保护临界区）

══════════════════════════════════════════════════════
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| atomic vs Mutex 怎么选？ | 单变量读写选 atomic；多变量需一致性选 Mutex |
| atomic.Value 存不同类型会怎样？ | panic（类型必须始终一致） |
| CAS 失败后应该怎么做？ | 重新读取并重试（CAS loop），注意避免 live lock |
| Go 1.19 前如何用泛型原子类型？ | 只能用 LoadInt64/StoreInt64 等函数，或 atomic.Value |
| atomic 操作保证 happens-before 吗？ | 是，Load 一定能看到最近一次 Store 的值 |
| int64 在 32 位系统上的原子操作？ | 需要 64 位对齐，否则 panic；放在结构体首字段最安全 |
