---
title: sort/slices 包源码精读
description: 精读 Go sort 包的 pdqsort（模式消除快速排序）算法实现，以及 Go 1.21 slices 泛型排序的设计。
---

# sort/slices：排序算法源码精读

> 核心源码：`src/sort/zsortinterface.go`（pdqsort）、`src/slices/sort.go`（Go 1.21+）
>
> 图例参考：这里补了 pdqsort 选择流程图，先看默认排序什么时候走插入排序、快排和堆排兜底，再回头读 `zsortinterface.go` 和 `slices/sort.go`。

## 包结构图

```
sort / slices 包对比
══════════════════════════════════════════════════════════════════

  sort 包（接口式，Go 1.0+）
  ├── sort.Interface        ← Len/Less/Swap 三方法接口
  ├── sort.Sort(data)       ← 不稳定排序（pdqsort）
  ├── sort.Stable(data)     ← 稳定排序（归并排序）
  ├── sort.Slice(s, less)   ← 函数式，无需实现接口
  ├── sort.SliceStable(...)
  ├── sort.Search(n, f)     ← 二分查找（通用）
  └── sort.Find(n, cmp)     ← 二分查找（Go 1.19+，返回 found bool）

  slices 包（泛型式，Go 1.21+）
  ├── slices.Sort(s)              ← 基础排序（需 cmp.Ordered）
  ├── slices.SortFunc(s, cmp)     ← 自定义比较函数
  ├── slices.SortStableFunc(...)
  ├── slices.BinarySearch(s, v)   ← 二分查找
  ├── slices.BinarySearchFunc(...)
  ├── slices.IsSorted(s)
  └── slices.Reverse(s)

  算法核心（Go 1.19+ pdqsort）
  ├── pdqsort（pattern-defeating quicksort）
  │       ├── 小切片（≤24）：插入排序
  │       ├── 中等：快速排序（ninther 选主元）
  │       └── 退化时：堆排序（保证 O(n log n)）
  └── stable（TimSort 思路）：归并 + 插入排序

══════════════════════════════════════════════════════════════════
```

---

## 一、pdqsort 算法（Go 1.19+）

<GoLanguageDiagram kind="pdqsort-flow" />

```
pdqsort = pattern-defeating quicksort（模式消除快速排序）
══════════════════════════════════════════════════════════════════

  核心思想：快速排序 + 退化检测 + 多种特化策略

  ┌──────────────────────────────────────────────────────────────┐
  │                      pdqsort(s, limit)                       │
  │                                                              │
  │  len(s) <= 24  ──→  insertionSort（插入排序，缓存友好）      │
  │                                                              │
  │  否则                                                        │
  │  ├── limit == 0（退化太多次）──→ heapSort（O(n log n) 兜底） │
  │  │                                                          │
  │  ├── choosePivot()（ninther 三点取中位数）                  │
  │  │       → 避免已排序数组 O(n²) 退化                        │
  │  │                                                          │
  │  ├── partition()（三路分区）                                │
  │  │       → 等于主元的元素归中间                             │
  │  │       → 避免大量重复元素 O(n²)                          │
  │  │                                                          │
  │  ├── 左右子数组分别递归                                     │
  │  │       limit-- 记录退化次数                               │
  │  │                                                          │
  │  └── 若发现已近乎有序：partialInsertionSort 微调            │
  └──────────────────────────────────────────────────────────────┘

  时间复杂度：平均 O(n log n)，最坏 O(n log n)（堆排序兜底）
  空间复杂度：O(log n)（递归栈）

══════════════════════════════════════════════════════════════════
```

### ninther 主元选择

::: details 点击展开代码：ninther 主元选择
```go
// src/sort/zsortinterface.go（自动生成）
// ninther：9 点取中位数，更好的主元估计
func ninther(data Interface, a, b, c, d, e, f, g, h, i int) int {
    // 先对三组各取中位数，再取中位数的中位数
    return medianOfThree(data,
        medianOfThree(data, a, b, c),
        medianOfThree(data, d, e, f),
        medianOfThree(data, g, h, i),
    )
}
// 对于 n >= 50 的切片使用，更准确地选出接近中位数的主元
```
:::

---

## 二、sort.Interface vs sort.Slice

```
两种使用方式的对比
══════════════════════════════════════════════════════════════════

  sort.Interface（实现接口）
  ├── 需定义新类型 + 3 个方法
  ├── 适合：频繁调用、需要复用的排序逻辑
  └── 零额外分配（接口方法内联）

  sort.Slice（闭包函数）
  ├── 只需一个 less 函数，简洁
  ├── 内部用 reflectswap 或 unsafe.Swap
  └── 闭包可能有轻微分配开销（但实际影响极小）

  slices.SortFunc（泛型，Go 1.21+）
  ├── 类型安全，无 reflect 开销
  ├── 比较函数签名：func(a, b T) int（负/零/正）
  └── ✅ 新代码推荐使用

══════════════════════════════════════════════════════════════════
```

---

## 三、二分查找

::: details 点击展开代码：三、二分查找
```go
// sort.Search：通用二分（最低层原语）
// 返回最小 i 使 f(i) == true，要求 f 单调（false...false,true...true）
i := sort.Search(len(a), func(i int) bool {
    return a[i] >= target
})
// 如果 i < len(a) && a[i] == target，则找到

// sort.Find（Go 1.19+）：语义更清晰
i, found := sort.Find(len(a), func(i int) int {
    return cmp.Compare(target, a[i]) // 负/零/正
})

// slices.BinarySearch（Go 1.21+）：最简洁
i, found := slices.BinarySearch(sortedSlice, target)
```
:::

---

## 四、代码示例

### 实现 sort.Interface（多字段排序）

::: details 点击展开代码：实现 sort.Interface（多字段排序）
```go
type Employee struct {
    Name   string
    Age    int
    Salary float64
}

// 按薪资降序，薪资相同按姓名升序
type BySalaryThenName []Employee

func (s BySalaryThenName) Len() int      { return len(s) }
func (s BySalaryThenName) Swap(i, j int) { s[i], s[j] = s[j], s[i] }
func (s BySalaryThenName) Less(i, j int) bool {
    if s[i].Salary != s[j].Salary {
        return s[i].Salary > s[j].Salary // 降序
    }
    return s[i].Name < s[j].Name // 升序
}

sort.Sort(BySalaryThenName(employees))
```
:::

### slices.SortFunc（推荐，Go 1.21+）

::: details 点击展开代码：slices.SortFunc（推荐，Go 1.21+）
```go
import "slices"
import "cmp"

// 简单排序
slices.Sort([]int{3, 1, 4, 1, 5}) // [1 1 3 4 5]

// 自定义比较（多字段）
slices.SortFunc(employees, func(a, b Employee) int {
    if n := cmp.Compare(b.Salary, a.Salary); n != 0 { // 降序
        return n
    }
    return cmp.Compare(a.Name, b.Name) // 升序
})

// 稳定排序（保留等值元素的相对顺序）
slices.SortStableFunc(employees, func(a, b Employee) int {
    return cmp.Compare(a.Department, b.Department)
})
```
:::

### 高效查找（二分）

::: details 点击展开代码：高效查找（二分）
```go
// 有序切片中查找
sorted := []int{1, 3, 5, 7, 9, 11}

// 方式一：sort.Search
idx := sort.Search(len(sorted), func(i int) bool {
    return sorted[i] >= 7
})
if idx < len(sorted) && sorted[idx] == 7 {
    fmt.Println("found at", idx) // found at 3
}

// 方式二：slices.BinarySearch（Go 1.21+，更简洁）
idx, found := slices.BinarySearch(sorted, 7)
fmt.Println(idx, found) // 3 true
```
:::

### sort.Slice 快速排序

::: details 点击展开代码：sort.Slice 快速排序
```go
// 不需要实现接口，适合一次性排序
people := []struct{ Name string; Age int }{
    {"Alice", 30}, {"Bob", 25}, {"Carol", 35},
}

sort.Slice(people, func(i, j int) bool {
    return people[i].Age < people[j].Age
})
// [{Bob 25} {Alice 30} {Carol 35}]
```
:::

### 自定义有序集合（利用 sort.Search 实现插入）

::: details 点击展开代码：自定义有序集合（利用 sort.Search 实现插入）
```go
// 有序切片的有序插入（保持排序）
func insertSorted(s []int, v int) []int {
    i := sort.SearchInts(s, v) // sort.SearchInts 是 Search 的 int 特化
    s = append(s, 0)
    copy(s[i+1:], s[i:])
    s[i] = v
    return s
}

// 使用
s := []int{1, 3, 5, 7}
s = insertSorted(s, 4) // [1 3 4 5 7]
```
:::

### Benchmark：sort.Sort vs sort.Slice vs slices.Sort

```
性能对比（10000 int 随机排序，近似值）
══════════════════════════════════════════════════════════════════

  方式                  时间         说明
  ─────────────────────────────────────────────────────────────
  slices.Sort           最快        泛型，无 interface 开销
  sort.Sort（Interface）次之        有 interface dispatch 开销
  sort.Slice            与 Sort 近  闭包稍有开销，差距可忽略
  ─────────────────────────────────────────────────────────────

  实践建议：
  ├── Go 1.21+：优先用 slices.SortFunc（类型安全，性能好）
  ├── 大量重复元素：pdqsort 三路分区自动处理，无需特殊处理
  └── 稳定排序需求：sort.Stable / slices.SortStableFunc

══════════════════════════════════════════════════════════════════
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Go sort.Sort 用什么算法？ | pdqsort（Go 1.19+）：小数组插入排序、中等快速排序（ninther 选主元）、退化时堆排序 |
| 为什么选 ninther 而不是随机主元？ | ninther（9点取中值）确定性好，对近乎有序的数组很友好；随机主元引入 rand 开销 |
| sort.Stable 用什么算法？ | 归并排序（小段插入排序 + 自底向上归并），空间 O(n) |
| sort.Slice 和 sort.Sort 哪个更快？ | 数据上无差异（都调 pdqsort）；sort.Sort 接口调用有 interface dispatch，sort.Slice 有闭包，现代 Go 差距极小 |
| slices.Sort 和 sort.Sort 的区别？ | slices.Sort 泛型，编译期类型特化，无 interface 虚调用；sort.Sort 运行时接口，有间接调用开销 |
| sort.Search 的前提条件？ | f(i) 必须单调（false...false,true...true），即满足条件的 i 连续靠右 |
