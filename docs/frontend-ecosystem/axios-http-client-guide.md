---
title: Axios HTTP 客户端指南：实例、拦截器、取消请求与错误处理
description: 围绕 Axios 实例、请求与响应拦截器、AbortController 取消请求、错误归一和前端框架集成方式，整理一套稳妥的 HTTP 客户端主线。
search: false
---

# Axios HTTP 客户端指南：实例、拦截器、取消请求与错误处理

Axios 在前端项目里最容易写乱的地方，不是发一个 GET 请求，而是三件事：

1. 实例层和业务层有没有分开
2. 拦截器是不是承载了过多业务逻辑
3. 错误、取消、重试和鉴权有没有统一口径

如果这三件事没立住，后面就会出现"每个页面都能请求，但每个页面都不一样"的问题。

## 适合谁看

- 已经在前端项目里用 Axios，但实例、拦截器和错误处理比较分散
- 需要把请求层从"页面里直接调"提升到"有统一约束的基础设施"
- 想判断 Axios 和上层请求策略库在项目里各适合承担哪一层职责

## 学习目标

- 建立 Axios 在前端项目里的统一职责：HTTP 客户端与传输层封装
- 掌握实例封装、拦截器、取消请求和错误归一的稳妥写法
- 分清 Axios 与框架层（hooks / composable / store）的职责边界

## 快速导航

- [先把 Axios 放在对的位置](#先把-axios-放在对的位置)
- [实例优先，不要直接到处调用](#实例优先不要直接到处调用)
- [拦截器边界](#拦截器边界)
- [取消请求与错误归一](#取消请求与错误归一)
- [和前端框架怎么配合](#和前端框架怎么配合)
- [一套务实的工程建议](#一套务实的工程建议)

## 先把 Axios 放在对的位置

Axios 更适合承担：

- baseURL、超时、headers
- 鉴权头注入
- 响应解包
- 统一错误对象

不适合承担：

- 页面级 loading 状态编排
- 复杂请求策略
- 分页、刷新、轮询、依赖请求的全套 orchestration

这些更像是框架层的 hooks / composable / store 或上层请求策略库该做的事。

## 实例优先，不要直接到处调用

更稳的模式是先建实例：

```ts
import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
})
```

然后再按业务域封装 API：

```ts
export function getUserProfile() {
  return http.get('/user/profile')
}
```

这样项目里真正共享的是"请求约定"，不是"某个页面刚好能发请求"。

## 拦截器边界

### 请求拦截器适合做什么

- 注入 token
- 补默认 headers
- 统一 trace id

### 响应拦截器适合做什么

- 统一提取响应数据
- 把后端错误包装成统一错误对象
- 处理通用未登录场景

### 不适合做什么

- 页面跳转逻辑写满拦截器
- 在拦截器里弹 UI 提示
- 根据具体业务码塞满分支判断

这些会让请求层变成半个业务层。

## 取消请求与错误归一

### 取消请求

当前 Axios 官方文档主线已经以 `AbortController` 为主。前端项目里最常见的用途是：

- 组件卸载时取消请求
- 搜索输入防止旧请求回写
- 路由切换时中断不再需要的请求

```ts
const controller = new AbortController()

http.get('/search', {
  params: { keyword },
  signal: controller.signal,
})

controller.abort()
```

### 错误归一

更稳的做法：

- 网络错误
- 业务错误
- 取消错误

三类分开处理，而不是所有异常都直接 toast。

## 和前端框架怎么配合

不管用什么框架，Axios 的职责都一样：留在下层做 transport。页面级请求状态交给框架自己的抽象层。

### React：custom hooks

页面级请求通过 custom hooks 组织，如 `useUserProfile`、`useSearchList`。hook 内部调用 API 函数，管理 loading / error / data 状态。TanStack Query 等库也是建在这一层上。

### Vue：composable

和 React hooks 思路一致，用 composable 封装请求逻辑，如 `useUserProfile`、`useSubmitOrder`。Axios 只负责 transport，composable 负责状态。

### Svelte：自定义 store 或 load 函数

Svelte 的 writable store 或 SvelteKit 的 `load` 函数承担类似角色。请求逻辑可以封装在自定义 store 里，也可以放在 `+page.ts` 的 load 函数中。

### 状态管理层

跨页面共享状态交给各框架的状态管理方案：

- React：Redux / Zustand
- Vue：Pinia
- Svelte：Svelte stores

这些方案适合保存跨页面共享状态，不适合把每个接口的 loading / error 全都塞进去。

### 上层请求策略库

务实口径：

- 如果项目只需要稳定 HTTP 客户端，Axios 足够
- 如果项目需要大量请求策略、缓存、自动状态管理、跨组件触发，TanStack Query、Alova 等更合适

可以让上层库基于适配器接在请求层上，但不要让 Axios 和上层库同时承担"顶层请求编排"。

## 一套务实的工程建议

1. 先统一 Axios 实例，再写业务 API 层
2. 拦截器只处理通用传输层问题，不侵入页面业务
3. 取消请求和错误分类要先建口径，再谈页面体验
4. 页面状态交给框架层抽象（hooks / composable / store），跨页共享交给状态管理

## 关联阅读

- [前端公共生态](./index.md)
- [Axios 官方文档](https://axios-http.com/docs/intro)
