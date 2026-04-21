---
title: LeetCode 11. 盛最多水的容器
description: 用双指针求盛最多水的容器，讲清面积公式、为什么必须移动短板，以及复杂度分析。
---

# LeetCode 11. 盛最多水的容器

> 题目地址：[11. 盛最多水的容器](https://leetcode.cn/problems/container-with-most-water/description/)

## 适合人群

- 刚开始学双指针，还不太会判断“什么时候能贪心删掉一侧”的开发者
- 会写暴力枚举，但不知道怎么把 `O(n^2)` 压到 `O(n)` 的人
- 想把“反证 + 剪枝理由”讲清楚，而不只是背答案的人

## 学习目标

- 理解面积公式 `min(height[left], height[right]) * (right - left)` 的含义
- 讲清楚为什么每次只能移动短板，移动长板不会得到更优解
- 把双指针模板从“感觉上对”变成“可以证明地对”

## 快速导航

- [题目理解](#题目理解)
- [先说结论](#先说结论)
- [为什么每次移动短板](#为什么每次移动短板)
- [多语言实现](#多语言实现)
- [复杂度分析](#复杂度分析)
- [高频问题](#高频问题)
- [延伸练习](#延伸练习)

## 题目理解

给定一个数组 `height`，第 `i` 根竖线的高度是 `height[i]`。选两根竖线和 `x` 轴组成一个容器，求它最多能盛多少水。

面积计算方式是：

```text
面积 = 宽度 * 高度
     = (right - left) * min(height[left], height[right])
```

关键点：

- 宽度由两个下标的距离决定
- 高度不是两根线里更高的那个，而是更短的那个
- 所以真正限制容器容量的是短板

## 先说结论

最优写法是双指针：

1. `left` 放在最左边，`right` 放在最右边
2. 先计算当前容器面积，更新答案
3. 比较 `height[left]` 和 `height[right]`
4. 谁更短，就移动谁
5. 一直收缩到 `left >= right`

直觉上这是在做一件事：

- 宽度一定会变小
- 那就只能想办法让“短板”变高
- 所以应该丢掉当前更短的那一侧

## 为什么每次移动短板

假设当前是：

- `height[left] <= height[right]`

当前面积是：

```text
(right - left) * height[left]
```

这时如果你移动 `right`，会发生两件事：

- 宽度变小
- 短板上限仍然不可能超过 `height[left]`

因为即使新的右边更高，容器高度仍然最多只能被左边这块短板限制住；如果新的右边更矮，那就更差。

所以：

```text
移动右指针，不可能得到比当前更好的答案
```

反过来，只有移动左指针，才有机会找到一根更高的线，把短板抬高，弥补宽度缩小带来的损失。

同理：

- 如果 `height[right] < height[left]`，就移动 `right`

这就是这题双指针成立的核心原因，不是“试出来的经验”，而是一次有明确剪枝依据的删除。

## 多语言实现

四种语言都是同一套双指针骨架：一轮循环内「先结算，再收缩短板」。点击 tab 切换语言。

::: code-group

```go [Go]
func maxArea(height []int) int {
	left, right := 0, len(height)-1
	ans := 0

	for left < right {
		width := right - left
		h := height[left]
		if height[right] < h {
			h = height[right]
		}

		area := width * h
		if area > ans {
			ans = area
		}

		if height[left] <= height[right] {
			left++
		} else {
			right--
		}
	}

	return ans
}
```

```ts [TypeScript]
function maxArea(height: number[]): number {
  let left = 0
  let right = height.length - 1
  let ans = 0

  while (left < right) {
    const h = Math.min(height[left], height[right])
    const area = (right - left) * h
    if (area > ans) ans = area

    if (height[left] <= height[right]) {
      left++
    } else {
      right--
    }
  }

  return ans
}
```

```rust [Rust]
impl Solution {
    pub fn max_area(height: Vec<i32>) -> i32 {
        let (mut left, mut right) = (0_usize, height.len() - 1);
        let mut ans = 0_i32;

        while left < right {
            let h = height[left].min(height[right]);
            let area = (right - left) as i32 * h;
            if area > ans {
                ans = area;
            }

            if height[left] <= height[right] {
                left += 1;
            } else {
                right -= 1;
            }
        }

        ans
    }
}
```

```python [Python]
class Solution:
    def maxArea(self, height: list[int]) -> int:
        left, right = 0, len(height) - 1
        ans = 0

        while left < right:
            h = min(height[left], height[right])
            area = (right - left) * h
            if area > ans:
                ans = area

            if height[left] <= height[right]:
                left += 1
            else:
                right -= 1

        return ans
```

:::

**多语言实现要点**

- **共用骨架**：`left` 和 `right` 是候选容器两条边，每轮先结算面积，再移动短板那一侧；`height[left] <= height[right]` 时丢弃左边
- **Go**：用显式三元替换 `min`，符合 `math` 包在 Go 1.21 前没有泛型 `min` 的历史写法
- **TypeScript**：签名用 `number[]` 与 LeetCode 官方一致，`Math.min` 足够快
- **Rust**：下标统一 `usize`，宽度 `as i32` 再与高度相乘，避免 `usize - usize` 下溢
- **Python**：直接用内置 `min()`，不引 `numpy`；题目保证 `n >= 2` 无需判空

## 复杂度分析

- 时间复杂度：`O(n)`，两个指针一共只会向中间移动 `n-1` 次
- 空间复杂度：`O(1)`，只用了常数级额外变量

和暴力枚举相比：

- 暴力：`O(n^2)`
- 双指针：`O(n)`

这题的关键优化不是用了更复杂的数据结构，而是基于“短板限制容量”做了正确剪枝。

## 高频问题

### Q1：为什么不能移动长板？

因为宽度一定会变小，而短板还是原来的那块。既然决定面积上限的短板没变，移动长板只会让答案不增反降。

### Q2：如果两边一样高，移动哪边？

都可以。因为这时两边都可以视为短板，移动任意一边都不会破坏正确性。

### Q3：这题为什么不是滑动窗口？

滑动窗口通常依赖“窗口扩大/缩小时，某个条件单调变化”。这题不是在维护一个满足条件的区间，而是在做双端收缩 + 剪枝，更准确地说是双指针贪心。

### Q4：这题最容易写错的点是什么？

最常见的错误是：

- 误以为应该移动更高的一边
- 忘了每轮都要先更新当前面积
- 把高度写成 `max(height[left], height[right])`

## 延伸练习

如果这题已经写顺，可以继续做这些相邻题型：

- 有序数组的两数之和：练相向双指针
- 三数之和：练排序后的双指针去重
- 接雨水：练双指针里“左右最大值”维护
