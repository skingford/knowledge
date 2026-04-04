---
layout: page
title: false
description: Node.js 专题入口，覆盖模块系统、运行时、事件循环、配置治理、可观测性、数据库边界、测试工程化、Web 服务与 NestJS 工程实践。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'nodejs')!
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

- 已经会写一点 JavaScript 或 TypeScript，但对 Node.js 服务端运行时和工程边界理解还不成体系
- 要做 BFF、API 服务、管理后台后端或中台服务，想用一条更稳的路线把 Node.js 基本盘补齐
- 正在用 NestJS，但模块拆分、DTO、事务、鉴权、日志和测试仍然靠零散经验堆出来
- 面试或项目复盘里经常能写代码，却说不清事件循环、模块系统、依赖注入和请求链路

## 建议阅读顺序

1. 先看这篇 [Node.js 专题总览](./index.md)，把学习范围、阅读主线和工程关注点放回同一张图里
2. 再读 [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md)，先把 import/export、包边界和 workspace 主线理顺
3. 接着读 [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)，把服务端最容易讲不清的运行时模型和排障顺序立住
4. 再读 [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md)，把项目结构、依赖管理、测试分层和 CI 基本盘补齐
5. 然后读 [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md)，把配置收口、结构化日志、trace 和指标主线理顺
6. 再读 [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md)，把事务边界、连接管理、Repository 和 ORM 取舍讲清
7. 然后读 [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md)，把 Node.js Web 服务的路由、中间件、错误处理和分层边界讲清
8. 再读 [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md)，把异步链路、重试、幂等和优雅关闭主线理顺
9. 最后看 [NestJS 实战指南](./nestjs-practice-guide.md)，把框架能力放回 Node.js 服务端整体工程里理解

## 这个专题的重点

- 不只讲语法，而是优先建立 Node.js 服务端工程的对象模型：运行时、模块、依赖、请求、配置和部署
- 先把包和模块边界立住，再进入运行时、测试、Web 服务与异步任务，不让工程问题越写越混
- 让配置、日志、Tracing、数据库事务这些真正影响线上稳定性的基础设施边界尽早收口
- 优先补齐最容易影响线上稳定性的几条线：事件循环、内存/CPU 排障、测试治理、队列消费和优雅退出
- 不把 NestJS 当“会写装饰器就行”的框架，而是把它放回模块边界、依赖注入、HTTP 请求链路和工程交付里理解
- 先把系统设计和项目结构讲清，再进入校验、鉴权、数据库、异步任务和测试这些高频实战问题

## 当前内容结构

| 文档 | 重点 |
| --- | --- |
| [Node.js 专题总览](./index.md) | 先建立 Node.js 服务端主线、适合人群和阅读顺序 |
| [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md) | 重点补 import/export、require、exports、workspace、共享包和 monorepo 分层边界 |
| [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md) | 重点补事件循环、microtask、流、内存、CPU、阻塞定位和线上排障流程 |
| [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md) | 重点补目录结构、依赖管理、单元/集成/e2e 测试、Mock 边界、日志配置和 CI |
| [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md) | 重点补配置收口、request id、trace、结构化日志、metrics 和线上排障观测 |
| [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md) | 重点补连接管理、事务边界、Repository 分层、Prisma/ORM/Query Builder 取舍和常见坑 |
| [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md) | 重点补路由、中间件、请求上下文、错误处理、分层、校验和优雅关闭 |
| [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md) | 重点补异步任务拆分、BullMQ / 队列思维、重试幂等、死信、调度和优雅退出 |
| [NestJS 实战指南](./nestjs-practice-guide.md) | 重点补模块分层、DTO 与 Entity 边界、Guard / Pipe / Interceptor / Filter 责任、事务与部署实践 |
