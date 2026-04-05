---
title: Alova 指南：请求策略、缓存与跨组件数据协作
description: 围绕 createAlova、statesHook、useRequest、缓存、自动状态管理、跨组件协作和请求策略，整理一套 Vue 项目中的 Alova 主线。
---

# Alova 指南：请求策略、缓存与跨组件数据协作

Alova 在 Vue 项目里的价值，不只是“另一个请求库”，而是把请求状态和请求策略往上提了一层。

真正需要先立住的，是这三件事：

1. 它解决的是 HTTP 发送，还是请求编排
2. 它和 Axios / fetch 的关系是什么
3. 哪些页面适合用请求策略，哪些页面不该把数据流搞得太重

## 适合谁看

- 已经在做 Vue 项目，发现分页、刷新、依赖请求、缓存和跨组件刷新越来越难统一
- 正在评估 Alova，想知道它到底比普通 Axios / fetch 多解决了什么
- 想把请求状态从“手写 loading/data/error 三件套”提升到“有统一策略模型”

## 学习目标

- 建立 Alova 在 Vue 项目里的统一职责：请求策略与状态编排层
- 掌握 `createAlova`、`statesHook`、`useRequest`、缓存和跨组件协作的主线
- 分清 Alova 与 Axios、Pinia、普通 composable 的边界

## 快速导航

- [先把 Alova 放在对的位置](#先把-alova-放在对的位置)
- [基础接入：`createAlova` 与 `statesHook`](#基础接入createalova-与-stateshook)
- [常见 useHook 场景](#常见-usehook-场景)
- [缓存与跨组件协作](#缓存与跨组件协作)
- [什么时候适合，什么时候不适合](#什么时候适合什么时候不适合)
- [一套务实的工程建议](#一套务实的工程建议)

## 先把 Alova 放在对的位置

Alova 更像是“请求策略层”，不是单纯的 transport client。

它适合解决：

- 自动管理 `loading` / `data` / `error`
- 分页、表单提交、监听请求、依赖请求
- 缓存与重新获取
- 跨组件触发数据刷新

它不替代：

- 业务建模
- 全局业务状态管理
- 页面组件拆分

## 基础接入：`createAlova` 与 `statesHook`

Svelte、React、Vue 都能接 Alova；Vue 侧最关键的是设置对应的 `statesHook`。

```ts
import { createAlova } from 'alova'
import VueHook from 'alova/vue'
import adapterFetch from 'alova/fetch'

export const alova = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  statesHook: VueHook,
  requestAdapter: adapterFetch(),
})
```

官方文档当前主线强调：

- `statesHook` 决定它如何生成与返回 Vue 响应式状态
- `requestAdapter` 决定底层怎么真正发请求

如果团队已经有成熟的 Axios transport 约定，也可以评估适配器层，而不是直接重写所有 API。

## 常见 useHook 场景

Alova 当前文档主线里，最值得关注的不是某一个 API，而是“请求策略”。

### `useRequest`

适合：

- 普通列表请求
- 详情页数据
- 表单提交

### `useWatcher`

适合：

- 输入值变化触发请求
- 筛选条件变化刷新列表

### `useFetcher`

适合更偏数据获取和复用的场景。

一个务实判断：

- 如果页面只是偶尔发一次请求，普通 composable 已经够用
- 如果页面长期要处理刷新、依赖、分页、缓存、重试、跨组件联动，Alova 会更省事

## 缓存与跨组件协作

Alova 的优势之一是请求缓存和跨组件协作不是“额外拼装”，而是它主线能力的一部分。

适合场景：

- 列表页和详情页共享某份接口结果
- 编辑成功后希望多个视图同步刷新
- 高频读取接口需要短期缓存

但务实边界也要先立住：

- 缓存解决的是请求结果复用，不是业务真相来源
- 业务真相仍要看后端接口和状态边界

## 什么时候适合，什么时候不适合

### 适合

- 数据获取逻辑明显复杂
- 页面存在大量分页、筛选、刷新和自动重试
- 想减少重复手写请求状态模板

### 不适合

- 页面只发少量简单请求
- 团队还没有稳定的请求层分层
- 业务复杂度主要不在请求，而在领域建模

这种时候先把 Axios / composable / Pinia 边界立住，通常更重要。

## 一套务实的工程建议

1. 先判断团队需要的是 transport client，还是请求策略层
2. 简单请求别硬上 Alova，复杂数据流再用它放大收益
3. 让 Alova 负责请求状态和策略，不替代业务建模与状态管理
4. 缓存、跨组件刷新和自动重取只服务明确场景，不要默认全开

## 关联阅读

- [Vue 专题](./index.md)
- [Axios 指南：实例、拦截器、取消请求与错误处理](./axios-http-client-guide.md)
- [Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界](./pinia-state-management-guide.md)
- [Alova 官方文档](https://alova.js.org/tutorial/getting-started/basic/combine-framework)
