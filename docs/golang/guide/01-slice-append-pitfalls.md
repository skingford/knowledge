---
title: Slice 的坑：append 污染原底层数组与三指切片
description: Go slice append 常见陷阱解析，理解底层数组共享、容量扩张与三指切片的使用场景。
search: false
---

# Slice 的坑：append 污染原底层数组与三指切片

这一页只讲一个高频坑：为什么对子切片 `append`，有时会把原数组后面的值直接覆盖，以及三下标切片 `s[low:high:max]` 为什么能把这个坑挡住。

## 本页内容

- [1. 为什么 append 会污染原底层数组](#_1-为什么-append-会污染原底层数组)
- [2. 三指切片的保护作用](#_2-三指切片的保护作用)
- [3. 最佳实践](#_3-最佳实践)

---

## 1. 为什么 `append` 会污染原底层数组

切片最容易踩坑的点，不是读写共享本身，而是很多人以为 `append` 一定会返回一块新的内存。这个理解是错的。`append` 只有在容量不够时才会扩容；只要当前 `cap` 还够，它就会直接复用当前底层数组。

<GoLanguageDiagram kind="slice-append-trap" />

### 不指定 `max` 时，`append` 可能覆盖后续元素

当你写：

::: details 点击展开代码：不指定 max 时，append 可能覆盖后续元素
```go
package main

import "fmt"

func main() {
	original := []int{0, 1, 2, 3, 4}
	s := original[1:3]

	fmt.Printf("s=%v len=%d cap=%d\n", s, len(s), cap(s))

	s = append(s, 99)
	fmt.Println("s after append:", s)
	fmt.Println("original:", original)
}
```
:::

输出：

::: details 点击展开代码：不指定 max 时，append 可能覆盖后续元素
```text
s=[1 2] len=2 cap=4
s after append: [1 2 99]
original: [0 1 2 99 4]
```
:::

这里的关键点是：

- `s` 的内容是 `[1, 2]`
- `len(s) == 2`
- `cap(s) == 4`

原因是二下标切片 `original[1:3]` 的容量默认会从 `low` 一直延伸到底层数组末尾，也就是还能“看见”后面的 `3, 4`。

这时执行 `append(s, 99)`，Go 会发现还有可用容量，于是不会分配新内存，而是直接把 `99` 写入底层数组索引 `3` 的位置。结果就是原切片对应的底层数据被改了。

这就是为什么很多 Go bug 看起来像“我明明只改了子切片，为什么原数据被污染了”。

---

## 2. 三指切片的保护作用

如果你写成：

::: details 点击展开代码：2. 三指切片的保护作用
```go
package main

import "fmt"

func main() {
	original := []int{0, 1, 2, 3, 4}
	safe := original[1:3:3]

	fmt.Printf("safe=%v len=%d cap=%d\n", safe, len(safe), cap(safe))

	safe = append(safe, 100)
	fmt.Println("safe after append:", safe)
	fmt.Println("original:", original)
}
```
:::

输出：

::: details 点击展开代码：2. 三指切片的保护作用
```text
safe=[1 2] len=2 cap=2
safe after append: [1 2 100]
original: [0 1 2 3 4]
```
:::

这就是 The Three-Index Slice，也就是三下标切片 `s[low:high:max]`。

这里的含义是：

- `low = 1`
- `high = 3`
- `max = 3`

所以：

- `len = high - low = 2`
- `cap = max - low = 2`

也就是说，你人为把这个子切片的容量锁死成了和长度一样大。这样一来，后续 `append` 时 Go 会发现容量已满，只能申请一块新的内存，把原来的 `[1, 2]` 拷贝过去，再追加新元素。新的切片因此和 `original` 脱离关系。

---

## 3. 最佳实践

- 当你只是想暴露某个子区间给下游读取或局部处理，但不希望对方 `append` 时污染原数据，优先使用三下标切片限制容量。
- 当你明确需要隔离副作用时，直接复制一份新切片比依赖调用方自觉更安全：`cloned := append([]int(nil), original[1:3]...)`。
- 只要子切片后面还有剩余容量，就要默认认为 `append` 可能改写原底层数组。
- 如果这个坑经常和扩容机制一起问到，可以继续回看 [底层原理详解](./02-underlying-principles.md) 中的 Slice 扩容部分。
