---
layout: page
title: false
description: 算法专题入口，覆盖分布式共识、分布式锁、限流算法，以及 LeetCode 的回溯、双指针、矩阵模拟等高频题型。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'algorithm')!
</script>

<SectionLanding
  :eyebrow="landing.eyebrow"
  :title="landing.title"
  :intro="landing.intro"
  :primary="landing.primary"
  :secondary="landing.secondary"
  :scope="landing.scope"
  :docs="landing.docs"
  :order="landing.order"
/>

## 快速导航

- [当前专题入口](#当前专题入口)
- [LeetCode 刷题专题](#leetcode-刷题专题)
- [建议阅读顺序](#建议阅读顺序)

## 当前专题入口

- [Raft 共识算法详解](./raft.md)：从 Leader Election、Log Replication 到 Safety，完整拆解 Raft 协议的设计动机与工程实现
- [Redlock 分布式锁算法详解](./redlock.md)：从多数派租约、有效期计算到争议点，讲清 Redlock 的原理、边界与生产适用场景
- [限流算法详解](./rate-limiting.md)：从固定窗口、滑动窗口到漏桶和令牌桶，拆解四种限流算法的原理、差异与工程选型
- [LeetCode 高频题专题](./leetcode/index.md)：按题型收纳回溯、双指针、矩阵模拟、二叉树和动态规划等高频题，先从能复用模板的题开始

## LeetCode 刷题专题

- [LeetCode 高频题专题](./leetcode/index.md)：先看专题范围、题型规划和当前收录题目
- [LeetCode 17. 电话号码的字母组合](./leetcode/letter-combinations-of-a-phone-number.md)：用回溯和 DFS 拆解多叉搜索树，理解 `path` 入栈与回退
- [LeetCode 11. 盛最多水的容器](./leetcode/container-with-most-water.md)：用双指针和短板证明讲清 `O(n)` 解法为什么成立
- [LeetCode 289. 生命游戏](./leetcode/game-of-life.md)：用原地状态编码讲清矩阵模拟里的同步更新问题

## 建议阅读顺序

1. 先读 [Raft 共识算法详解](./raft.md)，把分布式共识的核心问题和 Raft 的解法建立起来
2. 再读 [Redlock 分布式锁算法详解](./redlock.md)，理解 Redis 分布式锁为什么只是高可用租约，而不是强一致锁
3. 再读 [限流算法详解](./rate-limiting.md)，搞清楚漏桶、令牌桶的本质区别和工程选型
4. 如果你当前目标是刷题或准备面试，直接进入 [LeetCode 高频题专题](./leetcode/index.md)，按题型补模板
5. 从 [LeetCode 17. 电话号码的字母组合](./leetcode/letter-combinations-of-a-phone-number.md) 开始，把回溯里“选一个 -> 递归 -> 撤销选择”的最小闭环写熟
6. 再做 [LeetCode 11. 盛最多水的容器](./leetcode/container-with-most-water.md)，把双指针里“移动短板”的证明讲清楚
7. 再做 [LeetCode 289. 生命游戏](./leetcode/game-of-life.md)，把矩阵模拟和原地标记的套路补齐
