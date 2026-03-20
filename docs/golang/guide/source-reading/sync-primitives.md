---
title: sync 包源码精读
description: 精读 sync.Mutex、RWMutex、WaitGroup、Once、Map 的实现原理，配 text 图例与示例。
---

# sync 包：同步原语源码精读

> 源码路径：`src/sync/` & `src/internal/sync/`
>
> 图例参考：复用 [锁、原子操作与同步原语](../03-sync-primitives.md) 的选型图和关键结构图，先分清“保护共享状态”与“协调 goroutine”的边界，再读 `sync` 包各个类型的源码实现。

这篇是 `sync` 体系的总览页，负责把 `Mutex`、`RWMutex`、`WaitGroup`、`Once`、`Map` 这些最常用同步原语串起来理解。

如果你只关心某一个更细的专题，可以继续读这些子页：

- 原子操作：[sync/atomic 源码精读](./sync-atomic.md)
- 条件变量：[sync.Cond 源码精读](./sync-cond.md)
- 对象池：[sync.Pool 源码精读](./sync-pool.md)

建议顺序：

1. 先看 `sync-primitives` 建立整体框架
2. 再按需深入 `atomic` / `Cond` / `Pool`

## 包结构图

<GoSyncPrimitiveDiagram kind="primitive-decision-tree" />

```
sync 包结构
══════════════════════════════════════════════════════

  sync/
  ├── mutex.go       → Mutex / RWMutex
  ├── waitgroup.go   → WaitGroup
  ├── once.go        → Once
  ├── map.go         → Map（并发安全）
  ├── pool.go        → Pool（对象池）
  ├── cond.go        → Cond（条件变量）
  └── atomic/        → 原子操作（封装 sync/atomic）

  internal/sync/
  └── mutex.go       → 底层 Mutex 实现（Go 1.23+ 重构后）

══════════════════════════════════════════════════════
```

---

## 一、Mutex（互斥锁）

### 数据结构

```
┌──────────────────────────────────────────────────────┐
│                    sync.Mutex                        │
│                                                      │
│   state  int32   ← 状态位压缩在一个 int32 中         │
│   ├── bit[0]: mutexLocked    (1=已锁定)              │
│   ├── bit[1]: mutexWoken     (1=有协程被唤醒)        │
│   ├── bit[2]: mutexStarving  (1=饥饿模式)            │
│   └── bit[3..]: waiter count (等待者数量)            │
│                                                      │
│   sema   uint32  ← 信号量，用于挂起/唤醒 goroutine   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 加锁流程图

```
Lock() 调用流程
══════════════════════════════════════════════════════

  调用 Lock()
      │
      ▼
  CAS(state, 0, 1) ─── 成功 ───→ [持有锁，返回]
      │
    失败
      │
      ▼
  进入 lockSlow()
      │
      ├── [正常模式] 自旋尝试（最多4次）
      │       │
      │   自旋失败
      │       │
      ▼       ▼
  将自身加入等待队列（waiter++）
      │
      ▼
  runtime_SemacquireMutex() ── 挂起 goroutine
      │
  被唤醒后
      │
      ├── [正常模式] 重新竞争锁（可能被新来的 goroutine 抢占）
      │
      └── [饥饿模式] 等待时间 > 1ms → 直接获得锁，不竞争

══════════════════════════════════════════════════════
饥饿模式：防止 goroutine 无限等待
  - 进入条件：等待时间超过 1ms
  - 退出条件：等待队列清空 或 等待时间 < 1ms
```

### 代码示例

```go
package main

import (
    "fmt"
    "sync"
)

type SafeCounter struct {
    mu sync.Mutex
    n  int
}

func (c *SafeCounter) Inc() {
    c.mu.Lock()
    c.n++
    c.mu.Unlock()
}

// 推荐：defer 保证解锁
func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.n
}

func main() {
    c := &SafeCounter{}
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            c.Inc()
        }()
    }
    wg.Wait()
    fmt.Println(c.Value()) // 1000
}
```

---

## 二、RWMutex（读写锁）

<GoSyncPrimitiveDiagram kind="mutex-vs-rwmutex" />

### 结构图

```
┌──────────────────────────────────────────────────────────────┐
│                       sync.RWMutex                          │
│                                                              │
│  w           Mutex    ← 写锁（互斥）                         │
│  writerSem   uint32   ← 写等待信号量                         │
│  readerSem   uint32   ← 读等待信号量                         │
│  readerCount atomic.Int32 ← 活跃读者数（负数=有写锁）        │
│  readerWait  atomic.Int32 ← 写锁等待读者退出数量             │
│                                                              │
│  读锁路径（快）：readerCount++ → 无写者则直接持锁            │
│  写锁路径（慢）：先获取 w.Mutex → 等所有读者退出             │
│                                                              │
└──────────────────────────────────────────────────────────────┘

读多写少时性能优势：
  多个读者可并发持锁，写者独占
  适用：缓存读取、配置读取等场景
```

### 代码示例

```go
type Config struct {
    mu   sync.RWMutex
    data map[string]string
}

// 读：可并发
func (c *Config) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    return c.data[key]
}

// 写：独占
func (c *Config) Set(key, val string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.data[key] = val
}
```

---

## 三、WaitGroup

<GoSyncPrimitiveDiagram kind="coordination-primitives" />

### 结构与原理

```
┌──────────────────────────────────────────────────────┐
│                   sync.WaitGroup                     │
│                                                      │
│  state atomic.Uint64                                 │
│  ├── high 32bit: counter（Add/Done 计数）            │
│  └── low  32bit: waiter（Wait 挂起数量）             │
│  sema  uint32  ← 信号量                              │
│                                                      │
│  Add(n)  → counter += n                              │
│  Done()  → counter-- （等价于 Add(-1)）              │
│  Wait()  → counter==0 时返回，否则挂起               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 代码示例

```go
func fanOut(tasks []string) []string {
    var (
        wg      sync.WaitGroup
        mu      sync.Mutex
        results []string
    )

    for _, t := range tasks {
        wg.Add(1)
        go func(task string) {
            defer wg.Done()
            result := process(task) // 并发处理
            mu.Lock()
            results = append(results, result)
            mu.Unlock()
        }(t)
    }

    wg.Wait()
    return results
}

func process(s string) string { return "[done]" + s }
```

---

## 四、Once（单次初始化）

### 结构与原理

```
┌──────────────────────────────────────────────────────┐
│                    sync.Once                         │
│                                                      │
│  done atomic.Uint32  ← 0=未执行，1=已执行            │
│  m    Mutex          ← 保证并发安全                   │
│                                                      │
│  Do(f) 流程：                                        │
│  1. atomic.Load(done) == 1 → 直接返回（快路径）      │
│  2. 加锁 → 再次检查 done（double-check）             │
│  3. 执行 f() → atomic.Store(done, 1) → 解锁         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 代码示例

```go
var (
    instance *DB
    once     sync.Once
)

func GetDB() *DB {
    once.Do(func() {
        instance = &DB{conn: connect()} // 只执行一次
    })
    return instance
}

type DB struct{ conn interface{} }
func connect() interface{} { return nil }
```

---

## 五、sync.Map（并发安全 Map）

<GoSyncPrimitiveDiagram kind="sync-map-read-dirty" />

### 结构图

```
┌──────────────────────────────────────────────────────────────┐
│                       sync.Map                              │
│                                                              │
│  mu     Mutex                                                │
│  read   atomic.Pointer[readOnly]  ← 只读副本（无锁读）       │
│  dirty  map[any]*entry            ← 可写副本（有锁写）       │
│  misses int                       ← 读 miss 计数             │
│                                                              │
│  readOnly{                                                   │
│    m       map[any]*entry                                    │
│    amended bool  ← dirty 中是否有 read 没有的 key           │
│  }                                                           │
│                                                              │
│  entry.p 状态：                                              │
│    ┌──────────┬──────────┬──────────┐                        │
│    │  正常值  │  expunged│   nil    │                        │
│    │ (有效)   │ (已删除) │(逻辑删除)│                        │
│    └──────────┴──────────┴──────────┘                        │
│                                                              │
│  Load 路径：read → (miss++) → dirty                          │
│  Store 路径：read 中存在 → 原子更新；否则 加锁写 dirty       │
│  miss 超阈值 → dirty 晋升为 read（dirty=nil）                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

适用场景：
  ✅ 写少读多（key 集合相对稳定）
  ✅ 多 goroutine 读取不同 key（无竞争）
  ❌ 频繁写入不同 key → 用 Mutex+map 性能更好
```

### 代码示例

```go
var cache sync.Map

func set(key, val string) {
    cache.Store(key, val)
}

func get(key string) (string, bool) {
    v, ok := cache.Load(key)
    if !ok {
        return "", false
    }
    return v.(string), true
}

// 原子：存在则读取，不存在则写入
func getOrSet(key, val string) string {
    actual, _ := cache.LoadOrStore(key, val)
    return actual.(string)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Mutex 两种模式？ | 正常模式（竞争）、饥饿模式（顺序，等待 >1ms 触发） |
| Mutex 可以复制吗？ | 不能，使用后复制会带走锁状态，导致死锁 |
| RWMutex 读锁能升级写锁吗？ | 不能，会死锁；需先释放读锁再获取写锁 |
| WaitGroup 为什么 Add 要在 goroutine 外？ | 防止 Wait 在 Add 之前执行，计数为 0 提前返回 |
| sync.Map 适合什么场景？ | 读多写少；普通并发建议 `sync.Mutex + map` |
| Once 执行 panic 后还会再执行吗？ | 不会，panic 后 done 仍设为 1（注意此行为） |
