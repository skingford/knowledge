---
title: iter（Go 1.23+）源码精读
description: 精读 Go 1.23 iter 包与 range over func 语言特性，掌握 push/pull 迭代器模式、Seq/Seq2 类型与自定义集合迭代最佳实践。
---

# iter（Go 1.23+）：迭代器协议源码精读

> 核心源码：`src/iter/iter.go`（Go 1.23+）

## 包结构图

```
Go 1.23 迭代器体系
══════════════════════════════════════════════════════════════════

  iter 包（核心类型）：
  ├── type Seq[V any]  func(yield func(V) bool)
  │    └── 单值迭代器（range 循环使用）
  ├── type Seq2[K, V any] func(yield func(K, V) bool)
  │    └── 键值对迭代器（range 循环使用）
  └── func Pull[V any](seq Seq[V]) (next func() (V, bool), stop func())
       └── 将 push 迭代器转换为 pull 迭代器

  range over func（语言特性，Go 1.22 实验→1.23 正式）：
  for v := range seq        ← seq 类型为 func(yield func(V) bool)
  for k, v := range seq2   ← seq2 类型为 func(yield func(K, V) bool)
  for range seq0            ← seq0 类型为 func(yield func() bool)

  push vs pull 模型：
  ┌───────────────┬──────────────────────────────────────────┐
  │ Push（Seq）   │ 生产者控制节奏，yield 给消费者           │
  │               │ 天然支持 range，适合树形/图形遍历        │
  ├───────────────┼──────────────────────────────────────────┤
  │ Pull           │ 消费者控制节奏，next() 按需拉取          │
  │               │ 适合 zip/merge 多个迭代器               │
  └───────────────┴──────────────────────────────────────────┘

  标准库集成（Go 1.23+）：
  ├── slices.All(s)          → Seq2[int, E]（下标+元素）
  ├── slices.Values(s)       → Seq[E]（仅元素）
  ├── maps.All(m)            → Seq2[K, V]（键值对）
  ├── maps.Keys(m)           → Seq[K]（仅键）
  └── maps.Values(m)         → Seq[V]（仅值）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/iter/iter.go（Go 1.23）
package iter

// Seq：push 迭代器，生产者调用 yield 推送每个元素
// yield 返回 false 时停止迭代（等价于 break）
type Seq[V any] func(yield func(V) bool)

// Seq2：双值 push 迭代器（键值对）
type Seq2[K, V any] func(yield func(K, V) bool)

// Pull：将 push 迭代器（Seq）转换为 pull 迭代器
// 内部用 goroutine + channel 实现协程切换
func Pull[V any](seq Seq[V]) (next func() (V, bool), stop func()) {
    // 编译器将此函数特殊处理为协程切换（非真实 goroutine）
    // next() 恢复迭代器 goroutine，等待下一个 yield
    // stop() 向迭代器发送停止信号，释放资源
    ...
}
```

---

## 二、代码示例

### range over func 基础用法

```go
import (
    "fmt"
    "iter"
)

// 自定义整数范围迭代器
func integers(from, to int) iter.Seq[int] {
    return func(yield func(int) bool) {
        for i := from; i <= to; i++ {
            if !yield(i) {
                return // break 或 return 时 yield 返回 false
            }
        }
    }
}

func main() {
    // range over func（Go 1.23+）
    for n := range integers(1, 5) {
        fmt.Println(n) // 1 2 3 4 5
    }

    // 提前退出（等价于 break）
    for n := range integers(1, 100) {
        if n > 3 {
            break // yield 返回 false，迭代器 return
        }
        fmt.Println(n) // 1 2 3
    }
}
```

### 树形结构深度优先遍历

```go
type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}

// 中序遍历（左→根→右）
// push 模型天然适合递归树遍历（无需显式栈）
func (t *TreeNode) InOrder() iter.Seq[int] {
    return func(yield func(int) bool) {
        var traverse func(*TreeNode) bool
        traverse = func(node *TreeNode) bool {
            if node == nil {
                return true
            }
            return traverse(node.Left) &&
                yield(node.Val) &&
                traverse(node.Right)
        }
        traverse(t)
    }
}

// 使用
func printTree(root *TreeNode) {
    for v := range root.InOrder() {
        fmt.Print(v, " ")
    }
}
```

### Seq2：键值对迭代器

```go
// 数据库查询结果迭代器（避免一次性加载所有行）
func queryRows(db *sql.DB, query string) iter.Seq2[int, string] {
    return func(yield func(int, string) bool) {
        rows, err := db.Query(query)
        if err != nil {
            return
        }
        defer rows.Close()

        i := 0
        for rows.Next() {
            var name string
            if err := rows.Scan(&name); err != nil {
                return
            }
            if !yield(i, name) {
                return // 提前停止，rows.Close() 由 defer 处理
            }
            i++
        }
    }
}

// 使用
for idx, name := range queryRows(db, "SELECT name FROM users") {
    fmt.Printf("%d: %s\n", idx, name)
    if idx >= 9 {
        break // 只取前 10 条，自动清理数据库游标
    }
}
```

### Pull 迭代器：合并两个有序序列

```go
import "iter"

// 合并两个有序 Seq（类似 merge sort 中的 merge 步骤）
// pull 模型允许同时控制两个迭代器的推进节奏
func merge(a, b iter.Seq[int]) iter.Seq[int] {
    return func(yield func(int) bool) {
        nextA, stopA := iter.Pull(a)
        nextB, stopB := iter.Pull(b)
        defer stopA()
        defer stopB()

        va, okA := nextA()
        vb, okB := nextB()

        for okA && okB {
            if va <= vb {
                if !yield(va) {
                    return
                }
                va, okA = nextA()
            } else {
                if !yield(vb) {
                    return
                }
                vb, okB = nextB()
            }
        }

        // 排空剩余
        for okA {
            if !yield(va) {
                return
            }
            va, okA = nextA()
        }
        for okB {
            if !yield(vb) {
                return
            }
            vb, okB = nextB()
        }
    }
}
```

### 迭代器适配器：map / filter / take

```go
// map：元素变换
func Map[In, Out any](seq iter.Seq[In], f func(In) Out) iter.Seq[Out] {
    return func(yield func(Out) bool) {
        for v := range seq {
            if !yield(f(v)) {
                return
            }
        }
    }
}

// filter：条件过滤
func Filter[V any](seq iter.Seq[V], pred func(V) bool) iter.Seq[V] {
    return func(yield func(V) bool) {
        for v := range seq {
            if pred(v) && !yield(v) {
                return
            }
        }
    }
}

// take：取前 n 个
func Take[V any](seq iter.Seq[V], n int) iter.Seq[V] {
    return func(yield func(V) bool) {
        i := 0
        for v := range seq {
            if !yield(v) || i >= n-1 {
                return
            }
            i++
        }
    }
}

// 组合使用：找前 5 个偶数的平方
func main() {
    nums := integers(1, 100)
    evens := Filter(nums, func(n int) bool { return n%2 == 0 })
    squares := Map(evens, func(n int) int { return n * n })
    top5 := Take(squares, 5)

    for v := range top5 {
        fmt.Println(v) // 4 16 36 64 100
    }
}
```

### 与标准库集成（Go 1.23）

```go
import (
    "maps"
    "slices"
)

func stdlibIntegration() {
    s := []string{"c", "a", "b"}

    // slices.All：下标+元素
    for i, v := range slices.All(s) {
        fmt.Printf("%d: %s\n", i, v)
    }

    // slices.Values：仅元素
    for v := range slices.Values(s) {
        fmt.Print(v, " ") // c a b
    }

    m := map[string]int{"a": 1, "b": 2}

    // maps.All：键值对（注意顺序随机）
    for k, v := range maps.All(m) {
        fmt.Printf("%s=%d\n", k, v)
    }

    // 收集迭代器结果到 slice
    sorted := slices.Sorted(maps.Keys(m)) // 对 key 排序
    fmt.Println(sorted)                   // [a b]
}

// 迭代器转 slice（收集）
func Collect[V any](seq iter.Seq[V]) []V {
    var result []V
    for v := range seq {
        result = append(result, v)
    }
    return result
}
```

### 文件行迭代器

```go
// 懒加载文件行（内存高效）
func lines(filename string) iter.Seq2[int, string] {
    return func(yield func(int, string) bool) {
        f, err := os.Open(filename)
        if err != nil {
            return
        }
        defer f.Close()

        scanner := bufio.NewScanner(f)
        lineNum := 0
        for scanner.Scan() {
            lineNum++
            if !yield(lineNum, scanner.Text()) {
                return // 提前停止，f.Close() 由 defer 处理
            }
        }
    }
}

// 使用：找前 3 个包含 "error" 的行
for lineNum, line := range lines("app.log") {
    if strings.Contains(line, "error") {
        fmt.Printf("Line %d: %s\n", lineNum, line)
        // 不用 break 找完所有，只取需要的
        if lineNum > 1000 {
            break
        }
    }
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `iter.Seq` 的 `yield` 返回 false 意味着什么？ | 调用方执行了 `break`/`return`，迭代器应立即停止并释放资源（如关闭文件/数据库游标）；不检查 yield 返回值会导致资源泄漏 |
| push 和 pull 迭代器各适合什么场景？ | push（Seq）适合树/图递归遍历、单序列消费；pull（Pull）适合需要同时推进多个迭代器（如 zip/merge），或需要手动控制步进节奏 |
| `iter.Pull` 内部如何实现 push→pull 转换？ | 编译器将其实现为协程切换（coroutine），生产者和消费者交替执行；不是普通 goroutine，没有额外调度开销 |
| 为什么 `iter.Pull` 的 `stop` 必须调用？ | 若迭代器未消耗完就放弃，必须调用 stop 通知生产者退出，否则底层协程泄漏；通常用 `defer stop()` 保证 |
| range over func 在 Go 1.22 和 1.23 的区别？ | 1.22 以实验特性 `GOEXPERIMENT=rangefunc` 开启；1.23 正式稳定，`iter` 包进入标准库，`slices`/`maps` 包返回 Seq 类型 |
| 迭代器适配器（map/filter）比 `for` 循环有什么优势？ | 惰性求值：只在 range 时实际计算，`Take(5)` 后立即停止，不多算；可组合复用；但调试链式调用时不如普通循环直观 |
