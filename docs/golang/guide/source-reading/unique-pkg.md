---
title: unique（Go 1.23+）源码精读
description: 精读 Go 1.23 unique 包的字符串驻留实现，掌握 Handle 内存去重、comparable 约束与高并发缓存 key 优化最佳实践。
---

# unique（Go 1.23+）：字符串驻留与内存去重源码精读

> 核心源码：`src/unique/handle.go`（Go 1.23+）

## 包结构图

```
unique 包（Go 1.23+）
══════════════════════════════════════════════════════════════════

  核心 API：
  ├── func Make[T comparable](v T) Handle[T]
  │    └── 返回 v 的规范化句柄（相等值共享同一底层指针）
  └── type Handle[T comparable] struct{ ... }
       ├── Value() T      ← 取出原始值
       └── == 运算符      ← 直接指针比较（O(1) vs 字符串的 O(n)）

  驻留（Interning）原理：
  全局 map[T]*T（并发安全）
  ├── Make("hello") → 分配 "hello"，存入 map，返回 Handle{ptr}
  ├── Make("hello") → 发现已存在，返回相同 Handle{ptr}（零分配）
  └── 相等的值始终指向同一内存地址

  与直接存储 string 的对比：
  ┌──────────────────────┬──────────────┬──────────────────────┐
  │ 操作                 │ string       │ Handle[string]       │
  ├──────────────────────┼──────────────┼──────────────────────┤
  │ 相等比较             │ O(n) 逐字节  │ O(1) 指针比较        │
  │ map key 查找         │ O(n) 哈希+比较│ O(1)               │
  │ 内存（1M 相同字符串）│ 1M * len(s)  │ len(s)（只存一份）  │
  │ GC 压力              │ 高           │ 低（少量唯一值）     │
  └──────────────────────┴──────────────┴──────────────────────┘

  适用场景：
  ├── 大量重复字符串（协议字段、枚举值、URL 前缀）
  ├── 频繁相等比较的 map key
  └── 高基数但低唯一值的分布式追踪 tag

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/unique/handle.go（Go 1.23，简化）
package unique

import (
    "sync"
    "unsafe"
)

// Handle 是驻留值的不透明句柄
// 内部是一个指针，指向全局规范化存储中的值
type Handle[T comparable] struct {
    value *T
}

func (h Handle[T]) Value() T { return *h.value }

// 全局驻留表（每种类型独立一个 map）
var (
    internMu sync.Mutex
    interns  = make(map[any]*any) // 实际用 weak 指针，GC 可回收
)

// Make：返回 v 的规范化句柄
// 相同值多次调用返回相同的 Handle（指针相等）
func Make[T comparable](v T) Handle[T] {
    // 内部使用 weak 指针（弱引用），允许 GC 回收无引用的条目
    // 若条目已被 GC 回收，重新分配
    ...
}
```

---

## 二、代码示例

### 基础：字符串驻留

```go
import "unique"

func basicInterning() {
    h1 := unique.Make("hello")
    h2 := unique.Make("hello")
    h3 := unique.Make("world")

    // Handle 相等比较是指针比较（O(1)）
    fmt.Println(h1 == h2) // true（同一内存地址）
    fmt.Println(h1 == h3) // false

    // 取原始值
    fmt.Println(h1.Value()) // "hello"
}
```

### 高基数 Tag 内存优化

```go
// 场景：Prometheus/OpenTelemetry 的 label/attribute
// 同一个 label key 会被成千上万的 metric 重复存储

type MetricTag struct {
    Key   unique.Handle[string]
    Value unique.Handle[string]
}

func newTag(k, v string) MetricTag {
    return MetricTag{
        Key:   unique.Make(k),   // "http.method" 只存一份
        Value: unique.Make(v),   // "GET" 只存一份
    }
}

// 1000 个 metric 都带 "http.method=GET"：
// 不用 unique：1000 * (len("http.method") + len("GET")) = ~14KB
// 用 unique：len("http.method") + len("GET") = 14B（只存一份）
func optimizedMetrics() {
    tags := make([]MetricTag, 1000)
    for i := range tags {
        tags[i] = newTag("http.method", "GET")
    }
    // tags[0].Key == tags[999].Key → true（指针相等）
}
```

### 高效 map key：Handle 替换 string

```go
// 场景：缓存系统中用复合 key 查找（用户+区域+语言）
type CacheKey struct {
    UserID unique.Handle[string]
    Region unique.Handle[string]
    Lang   unique.Handle[string]
}

type Cache struct {
    mu   sync.RWMutex
    data map[CacheKey]any
}

func (c *Cache) Get(userID, region, lang string) (any, bool) {
    key := CacheKey{
        UserID: unique.Make(userID),
        Region: unique.Make(region),
        Lang:   unique.Make(lang),
    }
    c.mu.RLock()
    defer c.mu.RUnlock()
    v, ok := c.data[key]
    return v, ok
}

// 相比 string key 的优势：
// 1. map 查找时，Handle 的哈希是指针哈希（O(1)）
// 2. 相等比较是指针比较（不逐字节比对字符串内容）
// 3. map 中存储的 key 不重复分配字符串内存
```

### 协议字段规范化

```go
// 场景：HTTP 请求解析时，Content-Type 等头字段大量重复
type ParsedHeader struct {
    Name  unique.Handle[string] // "Content-Type", "Accept", etc.
    Value unique.Handle[string]
}

type HTTPParser struct {
    headers []ParsedHeader
}

func (p *HTTPParser) parseHeader(name, value string) {
    // 规范化：相同 header name 复用同一内存
    p.headers = append(p.headers, ParsedHeader{
        Name:  unique.Make(strings.ToLower(name)),
        Value: unique.Make(value),
    })
}

// 大量并发请求时，"content-type", "application/json" 只各存一份
// 显著减少 GC 压力
```

### 与 comparable 泛型约束配合

```go
// unique.Make 接受任何 comparable 类型，不限于 string
type Point struct {
    X, Y int
}

func internedPoints() {
    p1 := unique.Make(Point{1, 2})
    p2 := unique.Make(Point{1, 2})
    p3 := unique.Make(Point{3, 4})

    fmt.Println(p1 == p2) // true
    fmt.Println(p1 == p3) // false

    // 驻留 net/netip.Addr（节省路由表内存）
    addr1 := unique.Make(netip.MustParseAddr("192.168.1.1"))
    addr2 := unique.Make(netip.MustParseAddr("192.168.1.1"))
    fmt.Println(addr1 == addr2) // true
}
```

### 驻留生命周期：弱引用与 GC

```go
// unique 使用弱引用（weak pointer）管理驻留表
// 当没有任何 Handle 引用某个值时，GC 可以回收该条目
// 下次 Make 相同值时重新分配

func lifecycleDemo() {
    h := unique.Make("temporary")
    fmt.Println(h.Value()) // "temporary"

    // 当 h 超出作用域，且没有其他 Handle 持有 "temporary" 时
    // GC 下次运行会回收该条目（不像传统 interning 会永远持有）
    // 这解决了经典 string interning 的"内存泄漏"问题
    _ = h
}

// 与传统 interning（如 Java String.intern()）的区别：
// Java：intern 的字符串永远不 GC（PermGen/Metaspace 内存泄漏风险）
// Go unique：使用弱引用，无引用时自动 GC，更安全
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `unique.Handle` 的相等比较为什么是 O(1)？ | Handle 内部是指针；相同值经过 Make 后指向同一内存地址；`==` 比较的是指针地址，不比较底层字符串内容 |
| unique 如何避免传统字符串驻留的内存泄漏？ | 使用弱引用（weak pointer）存储驻留表；当所有 Handle 都不再引用某个值时，GC 可以回收该条目；Java 的 `String.intern()` 用强引用永远不回收 |
| `unique.Make` 的并发安全吗？ | 是，内部有同步机制（基于 `sync.Map` 或类似结构）；多个 goroutine 并发 Make 相同值时，只有一个会分配内存，其他等待后复用 |
| 什么情况下用 unique 收益最大？ | 高重复率的字符串（枚举值、协议头字段、URL 路径前缀）；频繁作为 map key 的复合结构；大规模遥测数据（label/tag）处理 |
| unique 和 `sync.Map` 手写 interning 的区别？ | unique 使用弱引用（可 GC）；手写 sync.Map 通常是强引用（永不 GC）；unique 是语言内置保证正确性，手写容易有并发 bug |
| Go 1.23 的弱引用是如何实现的？ | 通过 `internal/weak` 包（运行时支持）；弱引用不阻止 GC；GC 时若目标对象无强引用则置弱引用为 nil；unique 包在 GC 后惰性清理驻留表 |
