---
title: LeetCode 题解模版（多语言）
description: LeetCode 题解通用结构与 Go / TypeScript / Rust / Python 四语言骨架模版，新增题目时复制本文修改即可。
---

# LeetCode 题解模版（多语言）

> 本文是内部写作模版，不面向读者介绍题型。新增题目时：
>
> 1. 复制本文 → 改文件名 / 题号 / 题目链接
> 2. 按「统一结构」补齐各章节
> 3. 至少提供 Go / TypeScript / Rust / Python 四种语言实现
>
> 语言版本（截至 2026-04-22）：**Go 1.24** / **Node.js 22 LTS + TypeScript 5.7** / **Rust 1.83** / **Python 3.13**

## 统一结构

每道题按以下章节顺序组织，让读者在不同题目间的阅读路径一致：

1. **适合人群**：说明这题最适合什么阶段的读者
2. **学习目标**：做完后能带走的 2-3 条能力
3. **快速导航**：跳转锚点
4. **题目理解**：简述题意与关键约束（不重复粘题面）
5. **先说结论**：一段话讲清正确解法
6. **思路推导**：讲清为什么是这个解法（反证、剪枝、状态转移等）
7. **多语言实现**：4 种语言版本
8. **复杂度分析**：时间 / 空间 + 与暴力解对比
9. **高频问题**：4 个左右的 Q&A
10. **延伸练习**：同题型相邻题

## 多语言实现约定

### 展示策略

- 4 种语言统一用 VitePress 原生 `::: code-group` 做 tab 切换
- Tab 顺序固定：**Go → TypeScript → Rust → Python**（默认选中 Go）
- Tab 标题写完整语言名：`[Go]` / `[TypeScript]` / `[Rust]` / `[Python]`
- `code-group` 结束后紧跟一个 **「多语言实现要点」** 列表：第一条固定是"共用骨架"，再按语言顺序每种一条，交代该语言独有的 idiom
- **不要**在 `code-group` 内部夹段落或列表，否则插件解析会出错

### 代码 fence 语言标识

统一用：`go` / `ts` / `rust` / `python`（不是 `typescript` / `py` / `javascript`）。

### 语言习惯

| 语言 | 风格要点 |
| --- | --- |
| Go | 小写导出名；切片 `[]T`；避免过度封装 |
| TypeScript | 严格类型；`number[]` 而非 `Array<number>`；用闭包递归或内部函数 |
| Rust | 所有权清晰；`&[T]` vs `Vec<T>`；`usize` 下标；避免不必要 `clone()` |
| Python | 原生 list / str；必要时列表推导；尽量不引三方库 |

## 骨架模版

复制下面这段到新题目里，改掉 TODO 即可：

````markdown
## 多语言实现

（一句话描述共用骨架）。点击 tab 切换语言。

::: code-group

```go [Go]
func solve(input []int) int {
    // TODO: 主解法
    return 0
}
```

```ts [TypeScript]
function solve(input: number[]): number {
  // TODO: 主解法
  return 0
}
```

```rust [Rust]
impl Solution {
    pub fn solve(input: Vec<i32>) -> i32 {
        // TODO: 主解法
        0
    }
}
```

```python [Python]
class Solution:
    def solve(self, input: list[int]) -> int:
        # TODO: 主解法
        return 0
```

:::

**多语言实现要点**

- **共用骨架**：（一句话把四种语言共用的核心步骤讲清）
- **Go**：（该语言独有 idiom，如闭包捕获、切片 append/slice）
- **TypeScript**：（该语言独有 idiom，如 `===`、解构、`Math.min`）
- **Rust**：（该语言独有 idiom，如 `usize` / `i32` 切换、借用冲突绕开）
- **Python**：（该语言独有 idiom，如 `nonlocal`、为什么不引三方库）
````

## 写作检查清单

提交前过一遍：

- [ ] 4 种语言实现全部到位，没有「只给 Go，其他 TODO」的情况
- [ ] Tab 顺序是 Go → TypeScript → Rust → Python
- [ ] 代码 fence 是 `go [Go]` / `ts [TypeScript]` / `rust [Rust]` / `python [Python]`
- [ ] `::: code-group` 内部没有混入段落或列表
- [ ] `code-group` 后紧跟 **「多语言实现要点」** 列表，至少 5 条（共用骨架 + 4 种语言）
- [ ] 复杂度章节同时标注时间与空间
- [ ] 「高频问题」不少于 3 个
- [ ] 页尾「延伸练习」至少 2 道相邻题
- [ ] 标题 frontmatter 里的 `title` 与 `description` 都填了

## 不要做的事

- 不要把 4 种语言实现写成机翻版本（变量名、函数名按语言习惯走）
- 不要引入题目不要求的三方库（如 Python 的 `numpy`）
- 不要照抄 LeetCode 官方题解的"解题模版"套话
