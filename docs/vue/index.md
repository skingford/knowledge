---
layout: page
title: false
description: Vue 3 专题入口，覆盖组合式 API、响应式系统、组件通信、高频问题、性能优化与常用生态工具。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'vue')!
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

- 已经会写一点 Vue，但 `ref`、`reactive`、`computed`、`watch` 用法还不够稳定
- 从 React 切到 Vue，想快速建立 Vue 3 的组件与响应式心智模型
- 页面能写，但经常遇到 props 解构、列表更新、`v-if` / `v-show`、watch 误用等问题
- 想补 Vue 3 的现代写法，而不是继续停留在零散 Options API 片段
- 已经在做 Vue 项目，但 Vite、Pinia、请求层和数据获取策略还比较零散

## 快速导航

- [你会得到什么](#你会得到什么)
- [内容结构](#内容结构)
- [建议阅读顺序](#建议阅读顺序)
- [推荐实践项目](#推荐实践项目)
- [关联资料](#关联资料)

## 你会得到什么

- 一套 Vue 3 组合式 API 的稳定主线：`<script setup>`、`ref`、`reactive`、`computed`、`watch`
- 一套组件通信判断：`props`、`emits`、`slots`、`provide/inject`、`composable`
- 一套高频问题排查口径：响应式丢失、props 解构、列表 key、`v-if` / `v-show`、模板重计算
- 一套性能优化顺序：先看 props 稳定性和组件边界，再看异步组件、缓存和大列表治理
- 一套 Vue 工程配套主线：Vite、`@vitejs/plugin-vue`、Pinia、Axios、Alova

## 内容结构

| 文档 | 重点 |
| --- | --- |
| [Vue 专题](./index.md) | 建立 Vue 3 主线、阅读顺序和练习建议 |
| [Vue 技术指南：组合式 API、响应式系统与组件边界](./technical-guide.md) | 系统整理 `ref` / `reactive` / `computed` / `watch`、组件拆分和通信边界 |
| [Vue 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md) | 集中处理 Vue 开发中最常见的问题、误区和排查方法 |
| [Vue 性能优化指南：更新机制、异步组件与列表性能](./performance-optimization.md) | 围绕 props 稳定性、异步组件、`KeepAlive`、`v-memo` 和大列表优化展开 |
| [Vite 与 Vue 工程化指南：脚手架、环境变量与构建边界](./vite-build-and-env-guide.md) | 整理 create-vite、环境变量、构建拆包、类型检查与生产构建边界 |
| [@vitejs/plugin-vue 指南：SFC 编译、资源处理与编译选项](./vite-plugin-vue-guide.md) | 整理 SFC 编译、资源 URL 转换、编译选项和 custom block 边界 |
| [Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界](./pinia-state-management-guide.md) | 围绕 store 拆分、setup store、插件扩展和 SSR 组织状态管理主线 |
| [Axios 指南：实例、拦截器、取消请求与错误处理](./axios-http-client-guide.md) | 围绕实例封装、拦截器、取消请求和错误归一组织 HTTP 客户端主线 |
| [Alova 指南：请求策略、缓存与跨组件数据协作](./alova-request-strategy-guide.md) | 围绕请求策略、缓存、状态管理和跨组件协作组织数据获取主线 |

## 建议阅读顺序

1. 先看这篇 [Vue 专题](./index.md)，明确主线和术语
2. 再读 [Vue 技术指南：组合式 API、响应式系统与组件边界](./technical-guide.md)，先把响应式系统和组件通信立住
3. 接着读 [Vue 高频问题：响应式、组件通信与模板陷阱排错清单](./common-questions.md)，把开发里最常见的坑集中补掉
4. 最后读 [Vue 性能优化指南：更新机制、异步组件与列表性能](./performance-optimization.md)，把更新优化和加载优化收成一条线
5. 想把工程链路补齐时，再按 [Vite](./vite-build-and-env-guide.md) -> [plugin-vue](./vite-plugin-vue-guide.md) -> [Pinia](./pinia-state-management-guide.md) -> [Axios](./axios-http-client-guide.md) / [Alova](./alova-request-strategy-guide.md) 的顺序补生态工具

## 推荐实践项目

### 1. 任务管理面板

目标：

- 用 `<script setup>` + `ref` / `computed` / `watch` 组织页面状态
- 练习 `props` / `emits`、局部表单和列表拆分
- 理解 Vue 模板和组合式 API 的协作方式

### 2. 多步骤表单

目标：

- 练习 `v-model`、校验、步骤切换和提交边界
- 区分 `computed` 派生值和 `watch` 副作用
- 处理组件切换、状态保留和重置

### 3. 列表性能实验

目标：

- 验证 `key`、props 稳定性、`v-if` / `v-show` 和大列表更新成本
- 练习异步组件、`KeepAlive`、`v-once`、`v-memo`
- 建立“先量化，再优化”的排查顺序

## 关联资料

- [React 专题总览](../react/index.md)
- [React 技术指南：组件、状态、Effect 与工程边界](../react/react-technical-guide.md)
- [Vue 官方文档](https://vuejs.org/guide/introduction.html)
- [Vite 官方文档](https://vite.dev/guide/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Axios 官方文档](https://axios-http.com/docs/intro)
- [Alova 官方文档](https://alova.js.org/tutorial/getting-started/basic/combine-framework)
