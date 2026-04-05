---
title: Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界
description: 围绕 createPinia、defineStore、Option Store、Setup Store、storeToRefs、插件扩展和 SSR 组织 Pinia 的状态管理主线。
---

# Pinia 状态管理指南：Store 设计、插件扩展与 SSR 边界

Pinia 真正难的地方，通常不是 `defineStore()` 怎么写，而是三个判断：

1. 哪些状态真的值得进 store
2. 该用 Option Store 还是 Setup Store
3. 组件本地状态、composable 和全局 store 之间的边界怎么划

如果这些判断一开始没立住，后面很容易把 Pinia 用成“全局大仓库”。

## 适合谁看

- 已经在用 Pinia，但 store 越写越大，边界越来越模糊
- 正在从 Vuex 或纯 composable 状态迁移到 Pinia
- 想把 Pinia 从“会写 store”提升到“能解释什么时候该上、怎么拆、怎么接 SSR”

## 学习目标

- 建立 Pinia 在 Vue 项目里的统一职责：全局业务状态和共享业务逻辑
- 分清组件局部状态、composable 状态和 store 的边界
- 掌握 Option Store、Setup Store、`storeToRefs()`、插件和 SSR 的稳妥用法

## 快速导航

- [什么时候该用 Pinia](#什么时候该用-pinia)
- [安装与接入](#安装与接入)
- [Option Store 和 Setup Store 怎么选](#option-store-和-setup-store-怎么选)
- [Store 设计与拆分](#store-设计与拆分)
- [插件扩展与 SSR 边界](#插件扩展与-ssr-边界)
- [一套务实的工程建议](#一套务实的工程建议)

## 什么时候该用 Pinia

官方文档对 store 的定义很清楚：它承载的是不绑定到某个组件树局部的状态和业务逻辑。

更适合进 Pinia 的状态：

- 当前登录用户
- 权限与会话信息
- 跨页面保留的多步骤表单
- 全局筛选条件
- 多处都要读写的业务实体状态

不适合进 Pinia 的状态：

- 弹窗开关
- 某个输入框是否聚焦
- 某页局部 tab 展开态
- 只在一个组件里消费的临时状态

## 安装与接入

最小接入方式：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

这一步只是接入根 store。真正容易写乱的是 store 设计，而不是安装本身。

## Option Store 和 Setup Store 怎么选

### Option Store

特点：

- 上手直接
- 结构清晰
- 适合简单共享状态

核心概念就是：

- `state`
- `getters`
- `actions`

### Setup Store

特点：

- 更灵活
- 能自由用 composable
- 适合复杂状态和更细的逻辑组织

但代价也更明确：

- SSR 约束更多
- 不能把应属于外部上下文的内容随便返回
- 团队规范不清时更容易失控

### 一个务实判断

- 简单业务 store，优先 Option Store
- 需要更强组合能力和复杂逻辑，才升到 Setup Store

## Store 设计与拆分

### 1. 按业务域拆，不按页面乱拆

更稳的做法：

- `useAuthStore`
- `useCartStore`
- `useOrderStore`

而不是：

- `useHomePageStore`
- `useDialogStore`
- `useTableStore`

### 2. 不要直接解构 store

Pinia store 本身是响应式对象，直接解构会丢响应性。需要拆开用时，优先：

```ts
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const { profile, loading } = storeToRefs(userStore)
const { refreshProfile } = userStore
```

### 3. 派生值进 getter，动作进 action

不要把 getter 写成副作用入口，也不要把 action 写成随处散落的状态同步器。

## 插件扩展与 SSR 边界

### 插件

Pinia 插件适合处理：

- 持久化
- 埋点
- 通用元信息
- store 扩展能力

不适合：

- 大量业务逻辑注入
- 让每个 store 背后都藏一层隐式魔法

### SSR

官方文档明确提醒，Setup Store 里不是所有值都该返回。像路由实例、注入对象这类不属于 store 自身的数据，不该直接暴露成 store 状态。

更稳的口径是：

- 只把属于 store 自身的状态和行为放进返回值
- 把外部上下文依赖控制在实现内部

## 一套务实的工程建议

1. 先判断它是不是全局共享状态，再决定要不要上 Pinia
2. 先用 Option Store，复杂场景再升 Setup Store
3. 每个 store 只负责一个业务域，不做万能仓库
4. 读取状态用 `storeToRefs()`，动作直接从 store 上取
5. 插件和 SSR 只解决明确问题，不增加隐式复杂度

## 关联阅读

- [Vue 专题](./index.md)
- [Vue 技术指南：组合式 API、响应式系统与组件边界](./technical-guide.md)
- [Axios 指南：实例、拦截器、取消请求与错误处理](./axios-http-client-guide.md)
- [Pinia 官方文档](https://pinia.vuejs.org/)
