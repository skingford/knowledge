---
title: React 生态组合：一套最好用的务实方案
description: 从框架、路由、请求、状态、表单、UI 到测试，给出一套 React 项目里最顺手、最容易长期维护的生态组合，并说明各自边界。
---

# React 生态组合：一套最好用的务实方案

如果只给 React 项目一套默认推荐，我会优先选：**Next.js + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod + Vitest + Playwright**。

这套组合不一定适合所有项目，但它有几个很现实的优点：

- 社区共识强，不属于“小众但优雅”的路线
- 角色分工清楚，请求状态、本地状态、表单状态各管各的
- 既能做后台管理，也能做内容站、BFF、SSR 和中型业务系统
- 学习成本虽然不低，但后续维护成本通常比“库越少越好”的随意拼装更低

这篇不是列库清单，而是回答一个更关键的问题：**React 项目到底应该怎么搭，才能在开发效率、可维护性和团队协作之间保持平衡。**

## 适合谁看

- 已经会写 React，但每次开新项目都在纠结路由、状态管理、请求和表单该怎么选
- 项目做着做着就出现 `useEffect` 到处拉数据、Context 越塞越大、表单校验越来越乱的问题
- 想要一套可以长期复用的 React 技术栈，而不是每次都重新拼一遍

## 学习目标

- 建立 React 生态分层：框架层、UI 层、数据层、状态层、表单层、测试层
- 明确哪些问题该交给哪类库解决，避免一把锤子到处敲
- 拿到一套默认可落地的技术组合，并知道什么时候该偏离它

## 快速导航

- [先给结论：默认推荐组合](#先给结论默认推荐组合)
- [为什么这套组合更稳](#为什么这套组合更稳)
- [一层一层拆开看](#一层一层拆开看)
- [不同项目场景怎么裁剪](#不同项目场景怎么裁剪)
- [不推荐的常见搭法](#不推荐的常见搭法)
- [一个可直接落地的目录思路](#一个可直接落地的目录思路)

## 先给结论：默认推荐组合

| 层 | 推荐 | 作用 |
| --- | --- | --- |
| 应用框架 | Next.js App Router | 路由、SSR、RSC、接口层、部署一体化 |
| 语言与规范 | TypeScript + ESLint | 保证可维护性和协作下限 |
| 样式 | Tailwind CSS | 快速搭建稳定 UI，减少样式分散 |
| 组件方案 | shadcn/ui | 基于可组合原语搭建业务组件，而不是被黑盒组件库绑死 |
| 服务端状态 | TanStack Query | 请求缓存、重试、失效、并发状态管理 |
| 客户端状态 | Zustand | 管理少量跨组件共享状态，替代过度膨胀的 Context |
| 表单 | React Hook Form + Zod | 表单注册、性能控制、校验和类型收敛 |
| 测试 | Vitest + Testing Library + Playwright | 单测、组件行为测试、端到端测试分层覆盖 |

一句话概括它们的分工：

- **Next.js** 负责应用骨架和渲染模型
- **TanStack Query** 负责远程数据
- **Zustand** 负责本地共享状态
- **React Hook Form + Zod** 负责输入和校验
- **Tailwind CSS + shadcn/ui** 负责界面落地
- **Vitest + Playwright** 负责回归信心

## 为什么这套组合更稳

### 1. 它把三种状态拆开了

React 项目最容易失控的地方，不是组件本身，而是把不同性质的数据混在一起：

- 请求回来的数据也塞进全局 store
- 表单草稿和页面业务状态混在一起
- 一些本该派生出来的值，又被额外存成 state

更稳的做法是先区分三类状态：

1. **服务端状态**：来自接口，需要缓存、重试、失效和同步，交给 TanStack Query
2. **客户端共享状态**：例如侧边栏开关、筛选面板状态、登录弹窗、向导步骤，交给 Zustand
3. **表单状态**：输入值、错误态、提交态、默认值和 schema 校验，交给 React Hook Form + Zod

这样每层边界都会清楚很多，`useEffect` 的数量也会明显下降。

### 2. 它不是“全局状态中心化”思路

很多 React 项目一开始就把 Redux、Context 或自建 store 当成总线，结果是：

- 请求数据进 store
- 表单草稿进 store
- UI 开关进 store
- 临时筛选条件也进 store

最后 store 变成第二套后端数据库，组件只是被动读取器。

这套组合反过来做：**谁最擅长处理什么问题，就把问题交给谁。**

### 3. 它对团队协作更友好

真正难维护的，不是“库多”，而是“边界不清”。

这套组合里，每个人都比较容易形成共识：

- 拉接口先想 Query，而不是自己写 effect
- 跨组件共享少量交互状态先想 Zustand，而不是先上 Context 大杂烩
- 做表单先写 schema，再接入 RHF，而不是校验逻辑散在事件里
- 做 UI 先复用已有组件，再补业务封装，而不是页面里反复复制粘贴样式

## 一层一层拆开看

### 应用框架：优先 Next.js App Router

如果你做的是中后台、内容站、电商前台、SaaS、带 SEO 的官网或需要服务端渲染的应用，Next.js 仍然是 React 生态里最务实的默认答案。

它解决的是 React 本体不直接解决的问题：

- 文件路由与布局
- 服务端渲染和流式渲染
- Server Components / Server Actions 这类新的渲染与数据边界
- 接口层与前端工程的统一部署模型

### 什么场景不一定要上 Next.js

如果你做的是：

- 强交互后台系统
- 纯内网工具
- 对 SEO 没要求
- 已经有独立后端 API

那可以把默认组合裁成：**Vite + React + React Router + 下面其余配套**。

也就是说，**Next.js 是默认框架，不是宗教。** 纯 SPA 项目里，Vite 往往更轻更快。

### UI 层：Tailwind CSS + shadcn/ui

这套组合适合大多数业务系统，而不是因为“它最潮”，而是因为它在复用和可控之间比较平衡。

### Tailwind CSS 解决什么问题

- 样式就地表达，减少在 CSS 文件和组件之间反复跳转
- 间距、颜色、布局和响应式规则更容易统一
- 设计系统沉淀成本更低

### shadcn/ui 为什么比“直接上大而全组件库”更顺手

shadcn/ui 的价值，不只是现成组件，而是：

- 它给你的是可落地代码，不是完全不可控的黑盒
- 组件通常更适合做二次封装
- 适合逐步演化为团队自己的设计系统

如果项目是内部管理台、运营后台、控制面板，这套 UI 组合通常非常顺手。

### 数据层：TanStack Query 管远程数据

很多 React 新手最大的问题，是把“请求”当成副作用细节，而不是数据同步问题。

一旦你自己用 `useEffect` 拉数据，很快就会碰到这些事：

- loading、error、success 状态自己维护
- 重复请求和缓存复用不好处理
- 多页面切回来是否重取不一致
- 提交后怎么让旧数据失效和刷新变复杂

TanStack Query 正好就是解决这类问题的。

适合交给它的内容：

- 列表查询
- 详情查询
- 分页与无限滚动
- 提交后刷新或局部更新
- 缓存复用和后台刷新

### 一个务实原则

- 只要数据来自接口，并且你会关心缓存与同步，就优先用 Query
- 不要把接口数据再复制一份到 Zustand 里做“第二缓存”

### 状态层：Zustand 管少量共享交互状态

Zustand 最适合管的，不是整个业务世界，而是**轻量、本地、跨组件共享**的状态。

常见例子：

- 当前选中的面板
- 侧边栏展开收起
- 弹窗开关
- 表格筛选器的 UI 态
- 多步骤向导当前步骤

为什么这里不默认推荐 Redux：

- 现在很多 React 项目并没有复杂到必须上 Redux 的程度
- 太早中心化，容易把所有状态都塞进去
- 对中小团队而言，样板代码和心智负担往往偏重

为什么也不建议一上来就全用 Context：

- Context 更像依赖注入，不是天然的全局状态方案
- 一旦 value 经常变化、范围又大，维护体验通常会变差

### 表单层：React Hook Form + Zod

表单是 React 项目里最容易被低估的一层。

只用 `useState` 手写小表单当然可以，但一旦出现这些情况，成本就会直线上升：

- 字段变多
- 嵌套结构变深
- 校验规则复杂
- 默认值来自异步接口
- 错误提示、脏状态、提交态都要统一处理

RHF 负责表单状态和注册机制，Zod 负责 schema 和校验收敛，这个组合的好处是：

- 校验规则有单一出口
- 类型推导更顺
- 复杂表单性能通常比全量受控输入更稳
- 更适合和服务端 DTO 或接口约束对齐

### 一个经验法则

- 简单搜索框、单个开关、小范围输入，可以直接用 `useState`
- 只要是“正式表单”，尤其是创建/编辑页，优先上 RHF + Zod

### 测试层：Vitest + Testing Library + Playwright

如果只写一种测试，很多 React 项目最后会出现两个极端：

- 要么完全不测
- 要么把很多真实用户流程强行塞进单测

更稳的拆法是：

- **Vitest**：测纯函数、hooks、工具模块
- **Testing Library**：测组件交互和可见行为
- **Playwright**：测登录、下单、提交表单、关键业务路径

这样测试层次更清晰，也更符合 React 应用的实际风险分布。

## 不同项目场景怎么裁剪

### 1. 默认全栈 Web 方案

推荐：

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod
- Vitest + Playwright

适合：SaaS、官网 + 控制台、带后台的业务平台。

### 2. 纯前端后台 / 内网系统

推荐：

- Vite
- React Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod
- Vitest + Playwright

适合：SEO 不重要、独立 API 已经成熟的管理后台。

### 3. 内容型站点或营销站

推荐：

- Next.js
- TypeScript
- Tailwind CSS
- 少量交互配 Zustand
- 表单再按需上 RHF + Zod

适合：官网、文档站、博客、落地页。

核心原则不是“库越多越高级”，而是：**按项目约束裁剪，但尽量保持边界模型不变。**

## 不推荐的常见搭法

### 1. 所有状态都塞进一个 store

这会让请求缓存、本地交互状态、表单草稿混成一团，后续很难拆。

### 2. 所有请求都手写在 `useEffect`

短期省事，长期会把重试、缓存、并发和失效策略全部变成重复劳动。

### 3. 为了“简单”只用 Context 硬扛全局状态

Context 很重要，但它不是所有共享状态问题的默认答案。

### 4. 直接被大而全组件库锁死

组件库当然能提高起步速度，但如果二次封装困难、样式系统封闭、业务组件抽象很难沉淀，后续维护成本会越来越高。

## 一个可直接落地的目录思路

```txt
src/
  app/
  pages/
  components/
    ui/
    shared/
  features/
    user/
    order/
  stores/
  services/
  queries/
  forms/
  schemas/
  hooks/
  utils/
  tests/
```

一个务实约定：

- `queries/` 放 TanStack Query 查询与 mutation 封装
- `stores/` 放 Zustand store
- `forms/` 放 RHF 相关表单组件与提交逻辑
- `schemas/` 放 Zod schema
- `features/` 按业务域组织页面和组件，而不是全都平铺在 `components/`

## 最后给一个简单判断

如果你现在还没有稳定偏好，可以直接从这套开始：

- **全栈默认**：Next.js + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod
- **纯 SPA 默认**：Vite + React Router + Tailwind CSS + shadcn/ui + TanStack Query + Zustand + React Hook Form + Zod

它不是唯一答案，但对绝大多数 React 中型项目来说，已经足够稳、足够快，也足够容易长期维护。

## 关联阅读

- [React 技术指南：组件、状态、Effect 与工程边界](./react-technical-guide.md)
- [React 高频问题：渲染、状态与副作用排错清单](./react-common-questions.md)
- [React 性能优化指南：渲染分析、列表性能与稳定性优化](./react-performance-optimization.md)
- [React 官方学习文档](https://react.dev/learn)
