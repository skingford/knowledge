---
title: slices/maps/cmp 源码精读
description: 精读 Go 1.21 泛型标准库三件套，掌握类型安全的切片排序、集合操作、比较函数与旧版 sort/map 操作的迁移策略。
---

# slices + maps + cmp：Go 1.21 泛型标准库源码精读

> 核心源码：`src/slices/`、`src/maps/`、`src/cmp/cmp.go`（Go 1.21+）

## 包结构图

```
Go 1.21 泛型标准库三件套
══════════════════════════════════════════════════════════════════

  slices 包（切片泛型操作）：
  ├── 排序：Sort/SortFunc/SortStable/IsSorted/Min/Max/MinFunc/MaxFunc
  ├── 查找：Contains/Index/IndexFunc/BinarySearch/BinarySearchFunc
  ├── 变换：Reverse/Compact/CompactFunc/Clip/Grow
  ├── 集合：Equal/EqualFunc/Compare
  └── 修改：Delete/DeleteFunc/Replace/Insert/Concat

  maps 包（map 泛型操作）：
  ├── maps.Keys(m)         ← 返回所有 key（顺序不定）
  ├── maps.Values(m)       ← 返回所有 value（顺序不定）
  ├── maps.Clone(m)        ← 浅拷贝
  ├── maps.Copy(dst, src)  ← 合并（src 覆盖 dst 同名 key）
  ├── maps.Delete(m, keys) ← 批量删除
  ├── maps.Equal(m1, m2)   ← 相等比较
  └── maps.EqualFunc(m1, m2, eq) ← 自定义值比较

  cmp 包（比较泛型）：
  ├── cmp.Compare(x, y T) int    ← 返回 -1/0/+1
  ├── cmp.Less(x, y T) bool      ← x < y
  └── cmp.Or(vals ...T) T        ← 返回第一个非零值（Go 1.22+）

  vs 旧 API：
  sort.Slice → slices.SortFunc（类型安全，无反射）
  sort.Sort  → slices.Sort（约束 cmp.Ordered）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/slices/sort.go（简化）
// slices.Sort 使用 pdqsort（Pattern-Defeating Quicksort）
// = 快速排序 + 堆排序 + 插入排序 自适应混合
// 平均 O(n log n)，最坏 O(n log n)（比纯快排的 O(n²) 更安全）

func Sort[S ~[]E, E cmp.Ordered](x S) {
    n := len(x)
    if n < 2 { return }
    pdqsort(x, 0, n, bits.Len(uint(n)))
}

// 约束 cmp.Ordered 包含：int/uint/float/string 等所有可排序类型
// ~[]E 表示底层类型为 []E 的任意类型（包括 type MySlice []int）
```

---

## 二、代码示例

### slices：类型安全排序

```go
import "slices"

func sortExamples() {
    // ✅ slices.Sort：编译期类型检查，无反射
    nums := []int{5, 2, 8, 1, 9, 3}
    slices.Sort(nums)
    fmt.Println(nums) // [1 2 3 5 8 9]

    strs := []string{"banana", "apple", "cherry"}
    slices.Sort(strs)
    fmt.Println(strs) // [apple banana cherry]

    // ✅ SortFunc：自定义比较函数
    type Person struct {
        Name string
        Age  int
    }
    people := []Person{
        {"Bob", 30}, {"Alice", 25}, {"Charlie", 35},
    }
    // 按年龄升序排列
    slices.SortFunc(people, func(a, b Person) int {
        return a.Age - b.Age
    })

    // 多字段排序（先按年龄，同年龄按名字）
    slices.SortFunc(people, func(a, b Person) int {
        if n := a.Age - b.Age; n != 0 {
            return n
        }
        return strings.Compare(a.Name, b.Name)
    })

    // ✅ SortStable：稳定排序（等值元素保持原有顺序）
    slices.SortStableFunc(people, func(a, b Person) int {
        return a.Age - b.Age
    })
}
```

### slices：查找与二分搜索

```go
func searchExamples() {
    nums := []int{1, 3, 5, 7, 9, 11}

    // Contains：线性查找
    fmt.Println(slices.Contains(nums, 7))   // true
    fmt.Println(slices.Index(nums, 7))      // 3（索引）
    fmt.Println(slices.Index(nums, 4))      // -1（未找到）

    // BinarySearch：有序切片二分查找（O(log n)）
    idx, found := slices.BinarySearch(nums, 7)
    fmt.Println(idx, found)  // 3 true

    idx, found = slices.BinarySearch(nums, 6)
    fmt.Println(idx, found)  // 3 false（返回插入位置）

    // BinarySearchFunc：自定义比较的二分查找
    type Record struct {
        ID   int
        Name string
    }
    records := []Record{{1, "a"}, {3, "b"}, {5, "c"}}
    i, ok := slices.BinarySearchFunc(records, 3, func(r Record, id int) int {
        return r.ID - id
    })
    fmt.Println(i, ok) // 1 true

    // IndexFunc：按条件查找
    idx = slices.IndexFunc(nums, func(n int) bool { return n > 6 })
    fmt.Println(idx) // 3（第一个 > 6 的元素索引）
}
```

### slices：变换操作

```go
func transformExamples() {
    // Reverse：原地反转
    s := []int{1, 2, 3, 4, 5}
    slices.Reverse(s)
    fmt.Println(s) // [5 4 3 2 1]

    // Compact：去除连续重复元素（需先排序）
    s2 := []int{1, 1, 2, 3, 3, 3, 4}
    s2 = slices.Compact(s2)
    fmt.Println(s2) // [1 2 3 4]

    // Delete：删除指定范围元素
    s3 := []int{1, 2, 3, 4, 5}
    s3 = slices.Delete(s3, 1, 3) // 删除索引 [1,3)
    fmt.Println(s3)               // [1 4 5]

    // DeleteFunc：按条件删除
    s4 := []int{1, 2, 3, 4, 5, 6}
    s4 = slices.DeleteFunc(s4, func(n int) bool { return n%2 == 0 })
    fmt.Println(s4) // [1 3 5]

    // Insert：在指定位置插入
    s5 := []int{1, 2, 4, 5}
    s5 = slices.Insert(s5, 2, 3)  // 在索引2插入3
    fmt.Println(s5)                // [1 2 3 4 5]

    // Clip：去除切片多余容量（收缩 cap = len）
    s6 := make([]int, 3, 10)
    s6 = slices.Clip(s6) // cap 变为 3
}
```

### maps：安全 map 操作

```go
import "maps"

func mapsExamples() {
    m := map[string]int{"a": 1, "b": 2, "c": 3}

    // Keys/Values（顺序随机）
    keys := slices.Collect(maps.Keys(m))
    slices.Sort(keys) // 排序后确定性
    fmt.Println(keys) // [a b c]

    // Clone：浅拷贝（新 map，相同的值引用）
    m2 := maps.Clone(m)
    m2["d"] = 4
    fmt.Println(len(m), len(m2)) // 3, 4

    // Copy：合并 map
    dst := map[string]int{"a": 10, "x": 99}
    maps.Copy(dst, m) // m 中的值覆盖 dst 同名 key
    fmt.Println(dst)  // map[a:1 b:2 c:3 x:99]

    // Equal：比较两个 map
    m3 := map[string]int{"a": 1, "b": 2, "c": 3}
    fmt.Println(maps.Equal(m, m3)) // true

    // DeleteFunc：按条件删除 key
    maps.DeleteFunc(m, func(k string, v int) bool {
        return v < 2 // 删除值小于 2 的 key
    })
    fmt.Println(m) // map[b:2 c:3]
}
```

### cmp：泛型比较

```go
import "cmp"

func cmpExamples() {
    // Compare：通用三路比较
    fmt.Println(cmp.Compare(1, 2))   // -1
    fmt.Println(cmp.Compare(2, 2))   // 0
    fmt.Println(cmp.Compare(3, 2))   // 1
    fmt.Println(cmp.Compare("a", "b")) // -1

    // 用于 SortFunc
    nums := []int{3, 1, 4, 1, 5}
    slices.SortFunc(nums, cmp.Compare) // 等价于 slices.Sort

    // cmp.Or：返回第一个非零值（Go 1.22+）
    // 常用于合并默认值
    name := cmp.Or(os.Getenv("APP_NAME"), "default-app")
    fmt.Println(name)

    timeout := cmp.Or(configTimeout, envTimeout, 30*time.Second)
    _ = timeout
}
```

### cmp.Or 惯用法（替代三元运算符）

```go
import "cmp"

// cmp.Or：返回第一个非零值（Go 1.22+）

// 配置回退链
host := cmp.Or(os.Getenv("DB_HOST"), "localhost")
port := cmp.Or(os.Getenv("DB_PORT"), "5432")

// 多级回退
timeout := cmp.Or(
    cfg.Timeout,           // 用户配置
    envTimeout,            // 环境变量
    30*time.Second,        // 默认值
)

// 替代冗长的 if 链：
// 旧写法：
name := userInput
if name == "" { name = defaultName }

// 新写法：
name = cmp.Or(userInput, defaultName)
```

### 实际场景：Map 转换与过滤

```go
// 按条件过滤 map（maps 包暂无 Filter，需手动）
func filterMap[K comparable, V any](m map[K]V, fn func(K, V) bool) map[K]V {
    result := make(map[K]V)
    for k, v := range m {
        if fn(k, v) {
            result[k] = v
        }
    }
    return result
}

// 实际使用
scores := map[string]int{
    "Alice": 92, "Bob": 75, "Charlie": 88, "Dave": 61,
}
passed := filterMap(scores, func(_ string, score int) bool {
    return score >= 80
})
// passed = {"Alice":92,"Charlie":88}

// 获取排好序的 key
sortedKeys := maps.Keys(passed)
slices.Sort(sortedKeys)
for _, k := range sortedKeys {
    fmt.Printf("%s: %d\n", k, passed[k])
}
```

### 实际场景：去重并排序

```go
// 去重（利用 Compact + Sort）
func uniqueSorted[T cmp.Ordered](s []T) []T {
    slices.Sort(s)
    return slices.Compact(s) // 排序后 Compact 即去重
}

// 自定义对象去重（按 ID 去重）
func uniqueByID(people []Person) []Person {
    slices.SortFunc(people, func(a, b Person) int {
        return a.ID - b.ID
    })
    return slices.CompactFunc(people, func(a, b Person) bool {
        return a.ID == b.ID
    })
}

// 求两个切片的交集
func intersection[T cmp.Ordered](a, b []T) []T {
    slices.Sort(a)
    slices.Sort(b)
    var result []T
    for _, v := range a {
        if _, found := slices.BinarySearch(b, v); found {
            result = append(result, v)
        }
    }
    return slices.Compact(result) // 去掉重复的交集元素
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `slices.Sort` 比 `sort.Slice` 的优势？ | 类型安全（编译期检查，无 `interface{}` 反射开销）；性能更好（pdqsort 算法）；API 更简洁直观 |
| `slices.BinarySearch` 未找到时返回什么？ | 返回 `(插入位置, false)`；插入位置是使切片保持有序的正确插入点，可用于有序插入 |
| `slices.Compact` 为什么需要先排序？ | Compact 只去除**连续**重复元素；不排序的话 `[1,2,1]` 去重后仍是 `[1,2,1]` |
| `maps.Keys` 的返回顺序？ | 不确定（Go map 迭代顺序随机化）；需要确定顺序时用 `slices.Sort(slices.Collect(maps.Keys(m)))` |
| `cmp.Ordered` 约束包含哪些类型？ | 所有整数类型（int/uint/...）、浮点（float32/64）、string；不包含 bool 和复数 |
| `slices.Delete` 的内存行为？ | 返回的切片与原切片共享底层数组；删除后末尾可能有"脏数据"（零值）；用 `slices.Clip` 收缩容量避免内存泄漏 |
| `cmp.Or` 和 `\|\|` 的区别？ | `\|\|` 是布尔逻辑；cmp.Or 对任意 comparable 类型返回第一个非零值，类似其他语言的 ?? 运算符 |
| 这些包在 Go 1.21 之前能用吗？ | 不能；Go 1.21 引入。旧版本需用 golang.org/x/exp/maps 和 golang.org/x/exp/slices |
