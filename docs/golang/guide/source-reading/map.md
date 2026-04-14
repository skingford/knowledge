---
title: Map 源码精读
description: 精读 Go map 实现（Go 1.24+ Swiss Table），理解哈希表结构、查找/插入/扩容机制。
---

# Map：Swiss Table 实现源码精读

> Go 1.24+ 核心源码：`src/internal/runtime/maps/`（Swiss Table 实现）
> 旧版（≤1.23）源码：`src/runtime/map.go`（基于拉链法的 hmap）
>
> 图例参考：这里补了 Go 1.24+ Swiss Table 结构图，并复用旧版 `hmap`、渐进式扩容和并发写 panic 图，先把版本差异、查找路径和并发限制看清，再回头读 `internal/runtime/maps`。

## 版本演进

```
Go map 实现版本演进
══════════════════════════════════════════════════════

  ≤ Go 1.23    hmap + bmap（拉链+溢出桶）
                ├── bucket 数组，每 bucket 存 8 个 KV
                └── 负载因子 6.5，超过则翻倍扩容

  Go 1.24+     Swiss Table（open-addressing，SIMD 优化）
                ├── 参考 Abseil C++ Swiss Table 设计
                ├── 控制字节并行比较（8路 SIMD）
                └── 更低内存占用，更好 CPU cache 利用

══════════════════════════════════════════════════════
```

---

## 一、Swiss Table 结构（Go 1.24+）

<GoInternalsDiagram kind="map-swiss" />

```
map 数据结构（Swiss Table）
══════════════════════════════════════════════════════════════════

  Map（顶层）
  ┌─────────────────────────────────────────────────────────────┐
  │  used        uint64      ← 有效元素总数                     │
  │  seed        uintptr     ← 哈希种子（随机，防 DoS）         │
  │  dirPtr      *[]*table   ← table 目录（可扩展哈希）         │
  │  dirLen      int         ← 目录长度（2^globalDepth）        │
  │  globalDepth uint8       ← 用于目录寻址的哈希位数           │
  │  writing     uint8       ← 并发写检测标记                   │
  └─────────────────────────────────────────────────────────────┘
             │ 每个 table
  table（单个哈希表）
  ┌─────────────────────────────────────────────────────────────┐
  │  used       uint16       ← 已用槽数                         │
  │  capacity   uint16       ← 总槽数（groups数 × 8）           │
  │  growthLeft uint16       ← 可继续插入的槽数                 │
  │  groups     groupsRef    ← group 数组                       │
  └─────────────────────────────────────────────────────────────┘
             │ 每个 group（8个槽）
  group（核心存储单元）
  ┌─────────────────────────────────────────────────────────────┐
  │  ctrl  [8]byte           ← 控制字节（每槽1字节）            │
  │  ├── 0x80: 空槽                                             │
  │  ├── 0xFE: 已删除（墓碑）                                   │
  │  └── 0x00~0x7F: 已用，低7位为 H2（哈希后7位）              │
  │                                                             │
  │  slots [8]slot           ← 8 个 KV 槽                      │
  └─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 二、哈希查找流程

```
m[key]  查找流程（mapaccess）
══════════════════════════════════════════════════════════════════

  hash := hashFunc(key, seed)     ← 计算哈希
      │
  H1 = hash >> 7   ← 高57位，用于定位初始 group
  H2 = hash & 0x7F ← 低7位，用于控制字节匹配
      │
      ▼
  table = dir[hash >> globalShift]  ← 由顶层目录选 table
      │
      ▼
  初始 group = H1 % groups.length   ← 定位起始 group
      │
      ▼
  循环探测（二次探测）：
  ├── ctrlGroup.matchH2(H2)         ← 并行比较8个控制字节（SIMD）
  │       └── 返回 bitmask（哪些槽的 H2 匹配）
  ├── 对每个匹配槽：比较完整 key（排除 H2 碰撞）
  │       └── 匹配 → 返回 elem 地址
  ├── matchEmpty() ← 如果有空槽 → key 不存在，返回零值
  └── 无空槽 → 探测下一个 group（quadratic probing）

══════════════════════════════════════════════════════════════════

核心优化：并行 H2 比较
  一次比较 8 个控制字节 vs 目标 H2
  → 8 步探测合并为 1 次位运算
  → 大幅减少 key 完整比较次数（false positive 率 ~0.7%）
```

---

## 三、旧版 hmap 结构（≤Go 1.23，面试仍常考）

<GoInternalsDiagram kind="map-hmap" />

```
hmap（Go 1.23 及以前）
══════════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────────┐
  │                        hmap                                │
  │                                                            │
  │  count     int     ← 元素数量                             │
  │  flags     uint8   ← 状态标记（写中/迭代中）              │
  │  B         uint8   ← 桶数量的对数（桶数 = 2^B）           │
  │  noverflow uint16  ← 溢出桶近似数                         │
  │  hash0     uint32  ← 哈希种子                             │
  │  buckets   unsafe.Pointer ← 桶数组（[]bmap）             │
  │  oldbuckets unsafe.Pointer ← 扩容时的旧桶数组            │
  │  nevacuate uintptr ← 扩容进度（已迁移到多少桶）           │
  └────────────────────────────────────────────────────────────┘

  bmap（桶结构，每桶存8个KV）
  ┌─────────────────────────────────────────────┐
  │  tophash [8]uint8   ← 每个 key 哈希值高8位 │
  │  keys    [8]K       ← 8 个 key              │
  │  elems   [8]V       ← 8 个 value            │
  │  overflow *bmap     ← 溢出桶链              │
  └─────────────────────────────────────────────┘

  查找：hash → 低B位选桶 → 比较 tophash → 比较完整 key
  扩容：等量扩容（整理碎片）或翻倍扩容（负载因子>6.5）

══════════════════════════════════════════════════════════════════
```

---

## 四、扩容机制

<GoInternalsDiagram kind="map-grow" />

```
扩容策略
══════════════════════════════════════════════════════

  Swiss Table（Go 1.24+）：
  ├── 每个 table 独立扩容（增量式）
  ├── growthLeft 计数到 0 → 单 table rehash
  └── 用于分散扩容延迟（不是全量 stop-and-rehash）

  hmap（旧版）两种扩容：
  ├── 翻倍扩容：count/buckets > 6.5（负载因子）
  │       桶数翻倍，渐进式迁移（每次写操作迁移2个桶）
  └── 等量扩容：溢出桶过多但元素不多（大量删除后）
          重新整理，回收碎片，桶数不变

══════════════════════════════════════════════════════
```

---

## 五、代码示例

### 正确使用 map

::: details 点击展开代码：正确使用 map
```go
// 预分配：避免频繁扩容
m := make(map[string]int, 1000)

// 安全读取（零值判断）
v := m["key"]          // 不存在返回 0，不 panic
v, ok := m["key"]      // ok=false 时明确不存在

// 删除
delete(m, "key")       // key 不存在也不 panic

// 遍历（随机顺序）
for k, v := range m {
    fmt.Println(k, v)
}
```
:::

### map 并发安全

<GoLeakRaceDiagram kind="map-concurrent-write" />

::: details 点击展开代码：map 并发安全
```go
// ❌ 错误：并发读写未加锁 → data race
var m = map[string]int{}
go func() { m["a"] = 1 }()
go func() { _ = m["a"] }()

// ✅ 方案1：sync.RWMutex
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]int
}

func (s *SafeMap) Get(k string) int {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.m[k]
}

func (s *SafeMap) Set(k string, v int) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.m[k] = v
}

// ✅ 方案2：sync.Map（读多写少场景）
var sm sync.Map
sm.Store("key", 1)
v, ok := sm.Load("key")
```
:::

### 结构体作 value（就地修改陷阱）

::: details 点击展开代码：结构体作 value（就地修改陷阱）
```go
type Point struct{ X, Y int }

m := map[string]Point{"a": {1, 2}}

// ❌ 无法直接修改结构体字段
// m["a"].X = 10  // compile error: cannot assign to m["a"].X

// ✅ 取出→修改→存回
p := m["a"]
p.X = 10
m["a"] = p

// ✅ 或用指针
pm := map[string]*Point{"a": {1, 2}}
pm["a"].X = 10 // 可以
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| map 的 key 必须满足什么条件？ | 可比较（comparable），不能是 slice/map/func |
| map 并发安全吗？ | 不安全，并发读写会 panic（fatal error: concurrent map） |
| map 遍历顺序固定吗？ | 不固定，Go 故意随机化（防依赖顺序的 bug） |
| 删除元素后内存会释放吗？ | 不会立即归还 OS，桶槽标记为空但保留（等扩容整理） |
| Go 1.24 map 最大变化？ | 从拉链式 hmap 改为 Swiss Table，性能和内存更优 |
| 负载因子是多少？ | 旧版 6.5（每桶8槽），Swiss Table 按 growthLeft 控制 |
