---
title: container/list 源码精读
description: 精读 container/list 的双向链表实现，理解 Element/List 设计模式与 LRU 缓存等典型应用场景。
---

# container/list：双向链表源码精读

> 核心源码：`src/container/list/list.go`（约 200 行）
>
> 图例参考：
> - `GoInternalsDiagram`：`list-sentinel`

## 包结构图

```
container/list 结构全景
══════════════════════════════════════════════════════════════════

  List（双向循环链表）
  ├── root Element          ← 哨兵节点（不存储值，简化边界处理）
  │   ├── next → 首节点
  │   └── prev → 尾节点
  └── len  int              ← 链表长度

  Element（节点）
  ├── next *Element
  ├── prev *Element
  ├── list *List            ← 归属链表（防止跨链表操作）
  └── Value any             ← 存储的值

  核心操作（均 O(1)）：
  ├── l.PushFront(v)        ← 头插，返回 *Element
  ├── l.PushBack(v)         ← 尾插，返回 *Element
  ├── l.InsertBefore(v, at) ← 在 at 前插入
  ├── l.InsertAfter(v, at)  ← 在 at 后插入
  ├── l.Remove(e)           ← 删除节点，返回 Value
  ├── l.MoveToFront(e)      ← 移到头部（LRU 核心操作）
  ├── l.MoveToBack(e)       ← 移到尾部
  └── l.MoveBefore/After    ← 移到指定节点前后

  遍历：
  ├── l.Front() *Element    ← 首节点（nil 表示空链表）
  ├── l.Back() *Element     ← 尾节点
  └── e.Next() / e.Prev()   ← 前后节点（越界时返回 nil）

  vs 其他数据结构：
  ┌──────────────┬──────────┬──────────┬───────────┐
  │ 操作         │ 链表     │ 切片     │ 堆（heap）│
  ├──────────────┼──────────┼──────────┼───────────┤
  │ 头/尾插入    │ O(1)     │ O(n)/O(1)│ O(log n)  │
  │ 任意位置删除 │ O(1)*    │ O(n)     │ O(log n)  │
  │ 随机访问     │ O(n)     │ O(1)     │ O(1)      │
  │ 内存局部性   │ 差       │ 好       │ 好        │
  └──────────────┴──────────┴──────────┴───────────┘
  * 需要持有 *Element

══════════════════════════════════════════════════════════════════
```

<GoInternalsDiagram kind="list-sentinel" />

---

## 一、核心实现（哨兵节点设计）

```go
// src/container/list/list.go
type Element struct {
    next, prev *Element
    list       *List  // 归属校验，防止跨链表操作
    Value      any
}

type List struct {
    root Element // 哨兵节点（root.next=front, root.prev=back）
    len  int
}

// 初始化：root 指向自身（空链表是自环）
func (l *List) Init() *List {
    l.root.next = &l.root
    l.root.prev = &l.root
    l.len = 0
    return l
}

// 在 at 后插入（所有插入操作的基础）
func (l *List) insertValue(v any, at *Element) *Element {
    return l.insert(&Element{Value: v}, at)
}

func (l *List) insert(e, at *Element) *Element {
    e.prev = at
    e.next = at.next
    e.prev.next = e
    e.next.prev = e
    e.list = l
    l.len++
    return e
}

// Remove（O(1)）
func (l *List) remove(e *Element) {
    e.prev.next = e.next
    e.next.prev = e.prev
    e.next = nil  // 防止内存泄漏
    e.prev = nil
    e.list = nil
    l.len--
}

// MoveToFront（LRU 核心）= Remove + InsertFront（内部合并为 move）
func (l *List) MoveToFront(e *Element) {
    if e.list != l || l.root.next == e { return } // 已在头部
    l.move(e, &l.root)
}
```

---

## 二、代码示例

### 基础操作

```go
l := list.New()

// 插入
e1 := l.PushBack(1)   // [1]
e2 := l.PushBack(2)   // [1, 2]
e3 := l.PushFront(0)  // [0, 1, 2]
l.InsertAfter(1.5, e1) // [0, 1, 1.5, 2]

// 遍历
for e := l.Front(); e != nil; e = e.Next() {
    fmt.Println(e.Value)
}

// 从后往前遍历
for e := l.Back(); e != nil; e = e.Prev() {
    fmt.Println(e.Value)
}

// 删除
l.Remove(e2)    // 删除值为 2 的节点，O(1)
fmt.Println(l.Len()) // 3

// 移动
l.MoveToFront(e1) // 将 1 移到头部
```

### LRU 缓存（经典双向链表 + map）

```go
// LRU Cache：O(1) Get 和 Put
type LRUCache struct {
    cap   int
    mu    sync.Mutex
    cache map[int]*list.Element // key → *Element
    list  *list.List            // 最近使用在前
}

type entry struct {
    key   int
    value int
}

func NewLRUCache(cap int) *LRUCache {
    return &LRUCache{
        cap:   cap,
        cache: make(map[int]*list.Element),
        list:  list.New(),
    }
}

func (c *LRUCache) Get(key int) (int, bool) {
    c.mu.Lock()
    defer c.mu.Unlock()

    if el, ok := c.cache[key]; ok {
        c.list.MoveToFront(el)       // 标记最近使用
        return el.Value.(*entry).value, true
    }
    return 0, false
}

func (c *LRUCache) Put(key, value int) {
    c.mu.Lock()
    defer c.mu.Unlock()

    if el, ok := c.cache[key]; ok {
        // 已存在：更新值，移到头部
        el.Value.(*entry).value = value
        c.list.MoveToFront(el)
        return
    }

    // 新 key：插入头部
    el := c.list.PushFront(&entry{key, value})
    c.cache[key] = el

    // 超容：淘汰尾部（最久未使用）
    if c.list.Len() > c.cap {
        tail := c.list.Back()
        c.list.Remove(tail)
        delete(c.cache, tail.Value.(*entry).key)
    }
}
```

### 用作任务队列（双端队列 Deque）

```go
type Deque[T any] struct {
    l *list.List
}

func NewDeque[T any]() *Deque[T] {
    return &Deque[T]{l: list.New()}
}

func (d *Deque[T]) PushFront(v T) { d.l.PushFront(v) }
func (d *Deque[T]) PushBack(v T)  { d.l.PushBack(v) }

func (d *Deque[T]) PopFront() (T, bool) {
    if d.l.Len() == 0 {
        var zero T
        return zero, false
    }
    e := d.l.Front()
    d.l.Remove(e)
    return e.Value.(T), true
}

func (d *Deque[T]) PopBack() (T, bool) {
    if d.l.Len() == 0 {
        var zero T
        return zero, false
    }
    e := d.l.Back()
    d.l.Remove(e)
    return e.Value.(T), true
}
```

### 有序链表（插入排序）

```go
// 维护有序链表（O(n) 插入，O(1) 头尾访问）
func insertSorted(l *list.List, val int) {
    for e := l.Front(); e != nil; e = e.Next() {
        if val < e.Value.(int) {
            l.InsertBefore(val, e)
            return
        }
    }
    l.PushBack(val)
}
```

### 合并两个链表

```go
func mergeLists(l1, l2 *list.List) *list.List {
    result := list.New()
    result.PushBackList(l1) // 将 l1 所有元素追加到 result
    result.PushBackList(l2) // 将 l2 所有元素追加到 result
    return result
    // 注意：l1 和 l2 操作后会被清空
}
```

---

## container/ring（循环链表）

```go
// container/ring：固定大小的循环缓冲
import "container/ring"

// 创建大小为 5 的环
r := ring.New(5)

// 写入
for i := 0; i < r.Len(); i++ {
    r.Value = i
    r = r.Next()
}

// 遍历
r.Do(func(v any) {
    fmt.Println(v)
}) // 0 1 2 3 4

// 滑动窗口（最近 N 条日志）
type RingBuffer struct {
    r   *ring.Ring
    mu  sync.Mutex
}

func NewRingBuffer(n int) *RingBuffer {
    return &RingBuffer{r: ring.New(n)}
}

func (rb *RingBuffer) Add(v any) {
    rb.mu.Lock()
    rb.r.Value = v
    rb.r = rb.r.Next() // 覆盖最老的数据
    rb.mu.Unlock()
}

func (rb *RingBuffer) All() []any {
    rb.mu.Lock()
    defer rb.mu.Unlock()
    var result []any
    rb.r.Do(func(v any) {
        if v != nil { result = append(result, v) }
    })
    return result
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| container/list 为什么用哨兵节点？ | 消除链表为空时的 nil 判断，统一 insert/remove 逻辑，代码更简洁 |
| list.Element.list 字段的作用？ | 归属校验：防止将一个链表的 Element 用于另一个链表的操作（误操作会 panic）|
| LRU 为什么选双向链表而非切片？ | 切片删除任意位置是 O(n)；双向链表持有 *Element 后删除是 O(1) |
| MoveToFront 的时间复杂度？ | O(1)：只修改前后指针，不需要遍历 |
| container/list 和 container/ring 的区别？ | list 是变长双向链表；ring 是固定大小循环链表（适合滑动窗口/最近 N 条记录）|
| Go 标准库 list 是否泛型？ | 否（Value 是 any），需类型断言。想要泛型版本可自行封装或等社区库 |
