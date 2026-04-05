---
layout: page
title: false
description: Svelte 5 专题入口，覆盖 runes、组件通信、状态组织、高频问题与性能优化。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'svelte')!
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

## 适合谁看

- 已经会写一点 Svelte，但对 Svelte 5 runes、状态组织和组件通信还没有稳定口径
- 从 React 或 Vue 切到 Svelte，想快速建立“编译期 + 细粒度更新”的心智模型
- 页面能跑，但经常在 `$state`、`$derived`、`$effect`、`bind:`、列表更新这些地方踩坑
- 想把 Svelte 从“语法很轻巧”提升到“能解释机制、能定位问题、能做性能治理”

## 快速导航

- [你会得到什么](#你会得到什么)
- [内容结构](#内容结构)
- [建议阅读顺序](#建议阅读顺序)
- [推荐实践项目](#推荐实践项目)
- [关联资料](#关联资料)

## 你会得到什么

- 一套 Svelte 5 的稳定主线：`$state`、`$derived`、`$effect`、`$props`
- 一套组件通信判断：回调 props、`bind:`、`snippet`、context、store
- 一套高频问题排查口径：effect 误用、列表 key、双向绑定滥用、状态循环、DOM 时机
- 一套性能优化顺序：先看更新热点和列表，再看懒加载、代码分割和加载链路

## 内容结构

| 文档 | 重点 |
| --- | --- |
| [Svelte 专题](./index.md) | 建立 Svelte 5 主线、阅读顺序和练习建议 |
| [Svelte 技术指南：runes、组件边界与状态组织](./technical-guide.md) | 系统整理 `$state` / `$derived` / `$effect`、`$props`、snippet、context 和组件通信边界 |
| [Svelte 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md) | 集中处理 Svelte 开发中最常见的问题、误区和排查方法 |
| [Svelte 性能优化指南：更新粒度、懒加载与列表性能](./performance-optimization.md) | 围绕细粒度更新、keyed each、懒加载和 SvelteKit 加载策略展开 |

## 建议阅读顺序

1. 先看这篇 [Svelte 专题](./index.md)，明确主线和术语
2. 再读 [Svelte 技术指南：runes、组件边界与状态组织](./technical-guide.md)，先把 runes 和组件通信边界立住
3. 接着读 [Svelte 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md)，把开发里最常见的坑集中补掉
4. 最后读 [Svelte 性能优化指南：更新粒度、懒加载与列表性能](./performance-optimization.md)，把更新优化和加载优化收成一条线

## 推荐实践项目

### 1. 任务管理面板

目标：

- 用 `$state`、`$derived` 和 `$props` 组织页面状态与组件边界
- 练习回调 props、`bind:`、列表拆分和局部交互
- 理解 Svelte 的细粒度更新到底会更新什么

### 2. 多步骤表单

目标：

- 练习表单状态建模、`bind:`、校验派生值和提交边界
- 区分哪些值应该放 `$derived`，哪些动作才需要 `$effect`
- 处理步骤切换、重置和 DOM 更新时机

### 3. 大列表性能实验

目标：

- 验证 keyed each、过滤排序和局部交互对更新成本的影响
- 练习动态导入、低频组件懒加载和虚拟列表
- 建立“先量化，再优化”的性能排查顺序

## 关联资料

- [React 专题总览](../react/index.md)
- [Vue 专题](../vue/index.md)
- [Svelte 官方文档](https://svelte.dev/docs/svelte/overview)
