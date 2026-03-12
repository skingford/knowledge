---
title: maps/cmp/slices 泛型工具源码精读
description: 精读 Go 1.21+ 泛型工具包 maps、cmp、slices 的设计思路与常用 API，掌握现代 Go 惯用写法。
---

# maps / cmp / slices：泛型工具包源码精读

> 核心源码：`src/maps/maps.go`、`src/cmp/cmp.go`、`src/slices/slices.go`（Go 1.21+）

## 包结构图

```
Go 1.21+ 泛型工具包全景
══════════════════════════════════════════════════════════════════

  maps 包（map 操作）
  ├── maps.Clone(m)           ← 浅拷贝
  ├── maps.Copy(dst, src)     ← 合并（src 覆盖 dst 重复 key）
  ├── maps.Delete(m, keys...) ← 批量删除
  ├── maps.Keys(m)            ← 返回所有 key（无序）
  ├── maps.Values(m)          ← 返回所有 value（无序）
  ├── maps.Equal(m1, m2)      ← 值相等判断
  └── maps.Collect(iter)      ← 从迭代器构建 map（Go 1.23+）

  cmp 包（泛型比较）
  ├── cmp.Compare(a, b)       ← 三路比较（-1/0/1）
  ├── cmp.Equal(a, b)         ← 等于判断（类型安全）
  ├── cmp.Or(vals...)         ← 返回第一个非零值（Go 1.22+）
  └── cmp.Ordered 约束        ← 所有可排序类型的联合

  slices 包（切片操作，Go 1.21+）
  ├── slices.Contains(s, v)   ← 线性查找
  ├── slices.Index(s, v)      ← 返回首次出现位置
  ├── slices.Equal(s1, s2)    ← 值相等判断
  ├── slices.Reverse(s)       ← 原地反转
  ├── slices.Sort(s)          ← 排序（自动类型推断）
  ├── slices.SortFunc(s, fn)  ← 自定义比较排序
  ├── slices.BinarySearch(s,v)← 二分查找（已排序切片）
  ├── slices.Compact(s)       ← 去除相邻重复元素
  ├── slices.Clip(s)          ← 去除多余容量
  ├── slices.Concat(ss...)    ← 合并多个切片
  ├── slices.Max/Min(s)       ← 最大/最小值
  └── slices.Delete(s,i,j)    ← 删除区间 [i,j)

══════════════════════════════════════════════════════════════════
```

---

## 一、cmp.Ordered 约束

```go
// src/cmp/cmp.go
// Ordered 涵盖所有支持 < <= >= > 的类型
type Ordered interface {
    ~int | ~int8 | ~int16 | ~int32 | ~int64 |
    ~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr |
    ~float32 | ~float64 |
    ~string
}

// Compare 三路比较（类似 C++ operator<=>）
func Compare[T Ordered](x, y T) int {
    xNaN := isNaN(x)
    yNaN := isNaN(y)
    if xNaN && yNaN { return 0 }
    if xNaN || x < y { return -1 }
    if yNaN || x > y { return +1 }
    return 0
}

// Or 返回首个非零值（Go 1.22+）
func Or[T comparable](vals ...T) T {
    var zero T
    for _, v := range vals {
        if v != zero { return v }
    }
    return zero
}
```

---

## 二、代码示例

### maps 包操作

```go
import "maps"

// Clone：浅拷贝（修改副本不影响原 map）
original := map[string]int{"a": 1, "b": 2, "c": 3}
clone := maps.Clone(original)
clone["d"] = 4 // 不影响 original

// Copy：合并 map（src 的 key 覆盖 dst）
defaults := map[string]string{
    "host": "localhost",
    "port": "8080",
    "env":  "dev",
}
overrides := map[string]string{
    "port": "9090",
    "env":  "prod",
}
config := maps.Clone(defaults)
maps.Copy(config, overrides)
// config = {"host":"localhost","port":"9090","env":"prod"}

// Keys / Values（Go 1.21+）
keys := maps.Keys(original)    // []string，无序
vals := maps.Values(original)  // []int，无序

// 排序后的 key（常见需求）
slices.Sort(keys)

// Equal：两个 map 值相等判断
m1 := map[string]int{"a": 1}
m2 := map[string]int{"a": 1}
fmt.Println(maps.Equal(m1, m2)) // true（深比较 value）

// Delete 多个 key
m := map[string]int{"a": 1, "b": 2, "c": 3}
maps.DeleteFunc(m, func(k string, v int) bool {
    return v < 2 // 删除 value < 2 的项
})
// m = {"b":2,"c":3}
```

### slices 包操作

```go
import "slices"

nums := []int{3, 1, 4, 1, 5, 9, 2, 6, 5}

// 查找
fmt.Println(slices.Contains(nums, 4))       // true
fmt.Println(slices.Index(nums, 5))          // 4（首次出现）

// 排序
sorted := slices.Clone(nums)
slices.Sort(sorted)                          // [1 1 2 3 4 5 5 6 9]

// 二分查找（要求已排序）
pos, found := slices.BinarySearch(sorted, 4) // 4, true
pos, found  = slices.BinarySearch(sorted, 7)  // 7, false

// 去重（Compact 去除相邻重复，需先排序）
deduped := slices.Compact(sorted)            // [1 2 3 4 5 6 9]

// 反转
reversed := slices.Clone(deduped)
slices.Reverse(reversed)                     // [9 6 5 4 3 2 1]

// 最大/最小
fmt.Println(slices.Max(nums))  // 9
fmt.Println(slices.Min(nums))  // 1

// 删除区间 [i, j)
s := []int{0, 1, 2, 3, 4, 5}
s = slices.Delete(s, 2, 4)     // [0 1 4 5]

// 合并多个切片
combined := slices.Concat([]int{1, 2}, []int{3, 4}, []int{5})
// [1 2 3 4 5]
```

### SortFunc 自定义排序

```go
type Person struct {
    Name string
    Age  int
}

people := []Person{
    {"Alice", 30},
    {"Bob", 25},
    {"Charlie", 35},
    {"Dave", 25},
}

// 按年龄升序，同龄按姓名排序
slices.SortFunc(people, func(a, b Person) int {
    if n := cmp.Compare(a.Age, b.Age); n != 0 {
        return n
    }
    return cmp.Compare(a.Name, b.Name)
})
// [{Bob 25} {Dave 25} {Alice 30} {Charlie 35}]

// 检查是否已排序
fmt.Println(slices.IsSorted([]int{1, 2, 3, 4})) // true

// 自定义二分查找
pos, found := slices.BinarySearchFunc(people,
    Person{Age: 30},
    func(a, b Person) int { return cmp.Compare(a.Age, b.Age) },
)
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

---

## 面试要点

| 问题 | 要点 |
|------|------|
| maps.Keys 返回的顺序是确定的吗？ | 不确定，与 map 迭代顺序一致（随机）；需要排序时用 `slices.Sort(maps.Keys(m))` |
| slices.Compact 和去重有何区别？ | Compact 只去**相邻**重复；完全去重需先 Sort 再 Compact |
| cmp.Compare 和自定义 Less 的关系？ | slices.SortFunc 接受 `func(a,b T) int`（三路比较），用 cmp.Compare 组合多字段很简洁 |
| cmp.Or 和 || 的区别？ | `||` 是布尔逻辑；cmp.Or 对任意 comparable 类型返回第一个非零值，类似其他语言的 ?? 运算符 |
| slices.Delete 后 slice 容量怎么变？ | 容量不变（底层数组不缩小）；用 `slices.Clip` 去除多余容量，释放内存 |
| 这些包在 Go 1.21 之前能用吗？ | 不能；Go 1.21 引入。旧版本需用 golang.org/x/exp/maps 和 golang.org/x/exp/slices |
