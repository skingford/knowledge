---
title: LeetCode 17. 电话号码的字母组合
description: 用回溯和 DFS 求电话号码的字母组合，讲清搜索树展开、代码模板与复杂度分析。
---

# LeetCode 17. 电话号码的字母组合

> 题目地址：[17. 电话号码的字母组合](https://leetcode.cn/problems/letter-combinations-of-a-phone-number/)

## 适合人群

- 刚开始刷回溯题，还没把“递归 + 撤销选择”写顺的人
- 能看懂 DFS，但分不清“组合枚举”和“全排列”的开发者
- 想把 LeetCode 题解沉淀成可复用模板，而不是只记答案的人

## 学习目标

- 识别这是“按位展开的多叉搜索树”问题，本质是枚举每一位数字对应的所有字符
- 写清楚回溯模板里的 `path`、递归终止条件和撤销选择
- 能说明时间复杂度为什么取决于 `3/4` 个分支的笛卡尔积

## 快速导航

- [题目理解](#题目理解)
- [先说结论](#先说结论)
- [搜索树怎么展开](#搜索树怎么展开)
- [多语言实现](#多语言实现)
- [复杂度分析](#复杂度分析)
- [为什么这题是回溯不是全排列](#为什么这题是回溯不是全排列)
- [高频问题](#高频问题)
- [延伸练习](#延伸练习)

## 题目理解

给定一个只包含 `2-9` 的字符串 `digits`，返回它能表示的所有字母组合。

例如：

- 输入：`"23"`
- 输出：`["ad","ae","af","bd","be","bf","cd","ce","cf"]`

关键点只有两个：

- 每一位数字只能从自己的映射表里选字符
- 结果顺序不重要，但每种合法组合都要覆盖到

这不是在已有字符里“交换位置”，而是按数字顺序，一位一位往下选。

## 先说结论

这题最直接的做法就是 `DFS + 回溯`：

1. 用下标 `index` 表示当前处理到第几位数字
2. 从该数字对应的字符集合里依次选一个字符，追加到 `path`
3. 递归处理下一位
4. 回来后撤销刚才的选择，继续试下一个字符
5. 当 `path` 长度等于 `digits` 长度时，说明得到一个完整答案

如果 `digits` 是空字符串，直接返回空数组。

### 数字到字母的映射

| 数字 | 字母 |
| --- | --- |
| `2` | `abc` |
| `3` | `def` |
| `4` | `ghi` |
| `5` | `jkl` |
| `6` | `mno` |
| `7` | `pqrs` |
| `8` | `tuv` |
| `9` | `wxyz` |

## 搜索树怎么展开

以 `digits = "23"` 为例：

```text
                    ""
           /         |         \
         "a"        "b"        "c"
       /  |  \     /  |  \     /  |  \
    "ad""ae""af" "bd""be""bf" "cd""ce""cf"
```

可以把它理解成一个按层展开的多叉树：

- 第 1 层处理数字 `2`，有 `a / b / c` 3 个分支
- 第 2 层处理数字 `3`，每个节点再分出 `d / e / f` 3 个分支
- 走到叶子节点时，就得到一个完整字符串

回溯模板的核心不是“神秘递归”，而是这三步反复执行：

```text
选择一个字符 -> 递归处理下一位 -> 撤销这个字符
```

## 多语言实现

四种语言都采用同一套回溯骨架：`选择 → 递归 → 撤销`。点击 tab 切换语言。

::: code-group

```go [Go]
func letterCombinations(digits string) []string {
	if digits == "" {
		return []string{}
	}

	mapping := [...]string{
		"",     // 0
		"",     // 1
		"abc",  // 2
		"def",  // 3
		"ghi",  // 4
		"jkl",  // 5
		"mno",  // 6
		"pqrs", // 7
		"tuv",  // 8
		"wxyz", // 9
	}

	ans := make([]string, 0)
	path := make([]byte, 0, len(digits))

	var dfs func(int)
	dfs = func(index int) {
		if index == len(digits) {
			ans = append(ans, string(path))
			return
		}

		letters := mapping[digits[index]-'0']
		for i := 0; i < len(letters); i++ {
			path = append(path, letters[i])
			dfs(index + 1)
			path = path[:len(path)-1]
		}
	}

	dfs(0)
	return ans
}
```

```ts [TypeScript]
function letterCombinations(digits: string): string[] {
  if (digits.length === 0) return []

  const mapping: string[] = [
    '', '', 'abc', 'def', 'ghi',
    'jkl', 'mno', 'pqrs', 'tuv', 'wxyz',
  ]

  const ans: string[] = []
  const path: string[] = []

  const dfs = (index: number): void => {
    if (index === digits.length) {
      ans.push(path.join(''))
      return
    }

    const letters = mapping[Number(digits[index])]
    for (const ch of letters) {
      path.push(ch)
      dfs(index + 1)
      path.pop()
    }
  }

  dfs(0)
  return ans
}
```

```rust [Rust]
impl Solution {
    pub fn letter_combinations(digits: String) -> Vec<String> {
        if digits.is_empty() {
            return vec![];
        }

        let mapping: [&str; 10] = [
            "", "", "abc", "def", "ghi",
            "jkl", "mno", "pqrs", "tuv", "wxyz",
        ];

        let digits: Vec<usize> = digits
            .chars()
            .map(|c| c.to_digit(10).unwrap() as usize)
            .collect();

        let mut ans: Vec<String> = Vec::new();
        let mut path: Vec<char> = Vec::with_capacity(digits.len());

        fn dfs(
            index: usize,
            digits: &[usize],
            mapping: &[&str; 10],
            path: &mut Vec<char>,
            ans: &mut Vec<String>,
        ) {
            if index == digits.len() {
                ans.push(path.iter().collect());
                return;
            }

            for ch in mapping[digits[index]].chars() {
                path.push(ch);
                dfs(index + 1, digits, mapping, path, ans);
                path.pop();
            }
        }

        dfs(0, &digits, &mapping, &mut path, &mut ans);
        ans
    }
}
```

```python [Python]
class Solution:
    def letterCombinations(self, digits: str) -> list[str]:
        if not digits:
            return []

        mapping = [
            "", "", "abc", "def", "ghi",
            "jkl", "mno", "pqrs", "tuv", "wxyz",
        ]

        ans: list[str] = []
        path: list[str] = []

        def dfs(index: int) -> None:
            if index == len(digits):
                ans.append("".join(path))
                return

            for ch in mapping[int(digits[index])]:
                path.append(ch)
                dfs(index + 1)
                path.pop()

        dfs(0)
        return ans
```

:::

**多语言实现要点**

- **共用骨架**：`选择 → 递归 → 撤销` 三步循环；结算时拼接 `path` 生成一个完整字符串
- **Go**：`path` 用 `[]byte` 避免字符串拼接开销，结算时 `string(path)` 一次转换
- **TypeScript**：`path: string[]` + `.join('')`，比字符串 `+=` 少产生大量中间对象
- **Rust**：`dfs` 写成自由函数并显式传 `&mut Vec<...>`，绕开闭包捕获可变引用时的借用冲突；`path: Vec<char>` 结算时 `.iter().collect()` 成 `String`
- **Python**：闭包捕获外层 `ans` / `path` 做 `append/pop` 不需要 `nonlocal`；不使用 `itertools.product` 以保留回溯模板的教学意义

## 复杂度分析

设 `n = len(digits)`，其中有 `k` 位数字是 `7` 或 `9`，它们各有 4 个字母，其余位各有 3 个字母。

- 组合总数：`3^(n-k) * 4^k`
- 时间复杂度：`O(3^(n-k) * 4^k * n)`
- 空间复杂度：`O(n)`，这是递归深度和 `path` 的额外开销；如果把结果集算进去，总空间还要加上所有输出字符串的体积

为什么时间复杂度要乘一个 `n`：

- 因为每生成一个答案，都要把当前 `path` 转成字符串
- 这一步的成本和答案长度 `n` 成正比

如果只写最常见的 worst-case，也可以记成 `O(n * 4^n)`。

## 为什么这题是回溯不是全排列

很多人第一次做会误以为这是“排列题”，其实不是。

全排列问题的特征是：

- 你有一组现成元素
- 每个元素最多用一次
- 你需要决定它们的排列顺序

这题的特征是：

- 每一层只能从“当前 digit 对应的字符集合”里选
- 字符的位置是被 digit 顺序固定的
- 我们不是在交换顺序，而是在做多组字符集合的笛卡尔积

所以它更准确地说是：

- 多叉树 DFS
- 按位展开
- 回溯枚举

## 高频问题

### Q1：为什么空字符串要返回空数组，而不是 `[""]`？

因为题目要的是“有效字母组合”。当没有任何数字时，不存在一个实际组合，所以返回空数组更符合语义。

### Q2：这题能不用回溯吗？

可以。也能用迭代法逐层构造字符串。但回溯写法更接近后续大部分组合、子集、路径类题目的统一模板，更值得先掌握。

### Q3：为什么 `7` 和 `9` 需要单独提？

因为它们对应 4 个字符，其余数字大多是 3 个字符。复杂度分析时，分支因子并不完全相同。

### Q4：这题最容易写错的点是什么？

最常见的两个错误是：

- 忘了处理 `digits == ""`
- 递归返回后没有做 `path` 回退，导致结果串相互污染

## 延伸练习

如果这题已经写顺，可以继续做这几类相邻题型：

- 子集问题：练“选 / 不选”的二叉决策树
- 组合总和：练带约束的回溯搜索
- 括号生成：练合法性剪枝
- 单词搜索：练二维网格上的 DFS + 回溯
