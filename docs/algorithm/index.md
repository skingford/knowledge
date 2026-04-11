---
layout: page
title: false
description: 算法专题入口，覆盖分布式共识（Raft / Paxos）、分布式锁（Redlock）、一致性哈希、限流算法与经典数据结构。
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
- [建议阅读顺序](#建议阅读顺序)

## 当前专题入口

- [Raft 共识算法详解](./raft.md)：从 Leader Election、Log Replication 到 Safety，完整拆解 Raft 协议的设计动机与工程实现
- [Redlock 分布式锁算法详解](./redlock.md)：从多数派租约、有效期计算到争议点，讲清 Redlock 的原理、边界与生产适用场景

## 建议阅读顺序

1. 先读 [Raft 共识算法详解](./raft.md)，把分布式共识的核心问题和 Raft 的解法建立起来
2. 再读 [Redlock 分布式锁算法详解](./redlock.md)，理解 Redis 分布式锁为什么只是高可用租约，而不是强一致锁
