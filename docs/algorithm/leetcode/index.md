---
title: LeetCode 高频题专题
description: 收纳算法模块里的 LeetCode 高频题，按题型整理回溯、双指针、矩阵模拟、二叉树与动态规划等常见模板。
---

# LeetCode 高频题专题

这里把 LeetCode 题目按“题型 + 可复用模板”来整理，不追求题量，先把回溯、双指针、矩阵模拟、二叉树遍历、滑动窗口与动态规划这些高频模式写熟。

## 这组题怎么用

- 先判断题目是在考"枚举""状态转移"还是"数据结构维护"
- 每道题都尽量沉淀成一套可复用模板，而不是只记住这道题的答案
- 先刷能代表一个题型核心骨架的题，再逐步补变体
- 每道题都提供 **Go / TypeScript / Rust / Python** 四种语言实现：以 tabs 形式切换，方便对照不同语言里回溯、双指针、原地修改这些模式的写法差异

## 当前题目

- [LeetCode 17. 电话号码的字母组合](./letter-combinations-of-a-phone-number.md)：回溯 / DFS 入门题，重点是把多叉搜索树展开过程和 `path` 回退写顺
- [LeetCode 11. 盛最多水的容器](./container-with-most-water.md)：双指针经典题，重点是讲清为什么每次只能移动短板
- [LeetCode 289. 生命游戏](./game-of-life.md)：矩阵模拟 / 原地编码题，重点是处理“读旧状态”和“写新状态”的冲突

## 建议阅读顺序

1. 先做 [LeetCode 17. 电话号码的字母组合](./letter-combinations-of-a-phone-number.md)，建立“按位选字符”的回溯模板
2. 再做 [LeetCode 11. 盛最多水的容器](./container-with-most-water.md)，把双指针里“为什么能删掉一边”这个核心判断练熟
3. 最后做 [LeetCode 289. 生命游戏](./game-of-life.md)，把矩阵模拟和原地状态编码这类题型补上
4. 后续可以沿着回溯 -> 双指针 -> 矩阵模拟 -> 树遍历 -> 动态规划的顺序扩展，逐步把常见题型串起来

## 多语言模版约定

新增题目时，按这四条走，文档风格就能保持统一：

- 结构固定：**题目理解 → 先说结论 → 思路推导 → 多语言实现 → 复杂度分析 → 高频问题 → 延伸练习**
- 多语言实现使用 VitePress 原生 `::: code-group` 做 tab 切换，顺序固定为 **Go → TypeScript → Rust → Python**
- 代码 fence 统一用 `go [Go]` / `ts [TypeScript]` / `rust [Rust]` / `python [Python]`
- `code-group` 后紧跟一个「多语言实现要点」列表：第一条是"共用骨架"，再按语言顺序各一条讲该语言独有的 idiom

语言版本锁定（截至 2026-04-22）：**Go 1.24** / **Node.js 22 LTS + TypeScript 5.7** / **Rust 1.83** / **Python 3.13**。

## 关联入口

- [算法专题总览](../index.md)
- [Raft 共识算法详解](../raft.md)
- [限流算法详解](../rate-limiting.md)
