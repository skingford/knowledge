---
layout: page
title: false
description: React 专题入口，覆盖组件思维、状态建模、副作用边界、生态组合、高频问题与性能优化。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'react')!
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

- 已经会写一点 React，但组件拆分、state 设计、effect 使用仍然靠经验堆出来
- 页面能跑起来，但经常遇到重复渲染、输入卡顿、列表抖动、状态不同步等问题
- 需要把 React 从“会写功能”提升到“能解释机制、能定位问题、能做性能治理”
- 想把 React 工程知识整理成一条稳定主线，而不是零散背 Hook 和 API

## 建议阅读顺序

1. 先看这篇 [React 专题总览](./index.md)，明确当前专题范围和推荐阅读顺序
2. 再读 [React 技术指南：组件、状态、Effect 与工程边界](./react-technical-guide.md)，先把组件思维、数据流和副作用边界立住
3. 再补 [React 生态组合：一套最好用的务实方案](./react-ecosystem-stack.md)，把框架、请求、状态、表单和 UI 的配套组合起来
4. 如果你的主要场景是中后台，再读 [React 后台管理系统生态组合：一套高效可维护的方案](./react-admin-stack.md)，把表格、筛选器、权限和复杂表单的配套补齐
5. 接着读 [React 后台权限、菜单与路由设计：一套不容易失控的方案](./react-admin-permission-menu-routing.md)，把路由权限、菜单权限、按钮权限和字段权限放进一条主线
6. 再补 [React 后台权限模型的目录结构与代码模板](./react-admin-structure-and-template.md)，把 permissions、router、navigation 和页面消费方式真正落进目录结构
7. 如果你的系统已经开始出现租户、组织或工作区，再读 [React 后台多租户与多组织权限扩展设计](./react-admin-multi-tenant-permission-design.md)，把上下文切换和数据范围控制补齐
8. 再补 [React 后台数据权限与列表查询参数设计](./react-admin-data-scope-and-query-design.md)，把 `all / org / self`、筛选器、URL 参数和导出约束真正串起来
9. 再读 [React 高频问题：渲染、状态与副作用排错清单](./react-common-questions.md)，把开发里最常踩的坑集中补掉
10. 最后读 [React 性能优化指南：渲染分析、列表性能与稳定性优化](./react-performance-optimization.md)，把渲染分析、列表性能和交互流畅性收成一条线

## 这个专题的重点

- 不把 React 学成一组零散 Hook，而是优先建立组件、状态、渲染、提交和副作用的统一模型
- 先解决“state 应该放哪、哪些值不要放 state、哪些逻辑不该放 effect”这些最容易让代码失控的问题
- 把常见问题拆成可排查口径：key、闭包、批处理、Strict Mode、依赖数组、props 派生 state、状态重置
- 把性能优化从“到处包 `memo`”调整为“先测量，再优化结构，再局部做缓存和列表治理”
- 先把 React 主线和常用生态搭配打通，再往浏览器基础、工程化、构建和发布链路扩展

## 当前内容结构

| 文档 | 重点 |
| --- | --- |
| [React 专题总览](./index.md) | 建立当前专题范围、阅读顺序和练习建议 |
| [React 技术指南：组件、状态、Effect 与工程边界](./react-technical-guide.md) | 系统整理组件拆分、状态建模、组件通信、Effect 边界和工程判断 |
| [React 生态组合：一套最好用的务实方案](./react-ecosystem-stack.md) | 把 Next.js、TanStack Query、Zustand、React Hook Form、Zod 等常用配套串成一套默认方案 |
| [React 后台管理系统生态组合：一套高效可维护的方案](./react-admin-stack.md) | 聚焦 Vite、React Router、TanStack Query、TanStack Table、RHF 这套中后台高频组合 |
| [React 后台权限、菜单与路由设计：一套不容易失控的方案](./react-admin-permission-menu-routing.md) | 统一梳理路由权限、菜单权限、按钮权限和字段权限的工程分层 |
| [React 后台权限模型的目录结构与代码模板](./react-admin-structure-and-template.md) | 给出目录拆分、权限中心、路由守卫、菜单配置和 `PermissionGate` 的最小模板 |
| [React 后台多租户与多组织权限扩展设计](./react-admin-multi-tenant-permission-design.md) | 进一步扩展到 tenant、organization、上下文切换和数据范围控制 |
| [React 后台数据权限与列表查询参数设计](./react-admin-data-scope-and-query-design.md) | 聚焦 `all / org / self`、强制查询条件、筛选器和导出约束的统一设计 |
| [React 高频问题：渲染、状态与副作用排错清单](./react-common-questions.md) | 集中补 React 日常开发中最常见的误区、现象和排查方法 |
| [React 性能优化指南：渲染分析、列表性能与稳定性优化](./react-performance-optimization.md) | 围绕渲染来源、分析工具、列表性能、代码分割和交互流畅性展开 |

## 推荐实践项目

### 1. 任务管理面板

目标：

- 拆出列表、筛选、详情抽屉和编辑表单
- 练习状态提升、局部 state、受控输入和不可变更新
- 让组件边界清晰，避免 props 和状态乱串

### 2. 多步骤表单

目标：

- 练习表单状态建模、校验时机、草稿保存和提交流程
- 明确哪些逻辑应该放事件里，哪些场景才需要 effect
- 处理步骤切换、重置和错误提示的一致性

### 3. 大列表性能实验

目标：

- 用 1000+ 条数据验证 key、筛选、排序和渲染耗时
- 练习列表拆分、虚拟化、`memo`、`useDeferredValue` 和分析工具
- 建立“先量化，再优化”的性能排查顺序

## 关联资料

- [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](../nodejs/module-system-esm-commonjs-and-monorepo-boundaries.md)
- [Nginx 缓存、回源与静态资源加速实践](../nginx/cache-origin-and-static-acceleration-practice.md)
- [Nginx CDN、对象存储与大文件分发实践](../nginx/cdn-object-storage-and-large-file-distribution-practice.md)
- [Vue 专题](../vue/index.md)
- [React 官方学习文档](https://react.dev/learn)
