---
layout: page
title: false
description: Node.js 专题入口，按运行时基础 / 高并发与性能 / 一致性与幂等 / 异步与数据 / 工程化与运维 / Web 框架 / 源码专题分组组织，覆盖模块系统、事件循环、高并发治理、缓存、Redis、限流、Webhook、秒杀、幂等、数据库、队列、导出、配置治理、Secrets 与凭证轮换、可观测性、监控告警与压测演练、Feature Flag、Express / Fastify、NestJS，以及 libuv、V8、Worker Threads 与 C++ Binding 源码视角。
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
- 想把"为什么 Node.js 能扛高并发"从"会用 async/await"升级到"能讲清 libuv、V8 与 C++ Binding 的源码链路"

## 建议阅读顺序

本专题按 **7 个分组**组织（Phase 1）；另有 **源码专题（3 篇）** 在后续接入，给想深挖底层原理的读者准备。建议先顺着分组主线读完应用层，再回头切进源码层。

### 分组 1：核心入口

1. 先看这篇 [Node.js 专题总览](./index.md)，把学习范围、阅读主线和工程关注点放回同一张图里

### 分组 2：运行时基础

2. [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md)，先把 import/export、包边界和 workspace 主线理顺
3. [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)，把服务端最容易讲不清的运行时模型和排障顺序立住

### 分组 3：高并发与性能

4. [Node.js 高并发解决方案实践](./high-concurrency-solution-practice.md)，把 Node.js 服务在高峰流量下的限流、连接池、缓存、异步削峰和 Worker 主线立住
5. [Node.js 缓存、热点 Key 与缓存一致性实践](./cache-hotkey-and-consistency-practice.md)，把本地缓存、Redis、两级缓存、热点 Key 和写库删缓存这条高并发读路径主线立住
6. [Node.js Redis 实战：客户端、连接池、Pipeline 与 Lua 脚本边界](./redis-client-pipeline-and-lua-practice.md)，把 Redis client 复用、key 设计、Pipeline、Lua 和高并发下的热点治理边界立住
7. [Node.js 限流、超时与过载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)，把 rate limit、concurrency limit、timeout、backpressure 和快速失败这些高并发保护边界拆开理解

### 分组 4：一致性与幂等

8. [Node.js HTTP Client、重试、熔断与退避实践](./http-client-retry-circuit-breaker-and-backoff-practice.md)，把第三方依赖调用、timeout、重试预算、退避和熔断这条下游保护主线立住
9. [Node.js Webhook、回调与签名校验实践](/nodejs/webhook-and-callback-practice)，把原始 body 验签、重放防护、2xx/5xx 返回语义、重复回调和异步解耦讲清
10. [Node.js 秒杀 / 抢券系统实践](./seckill-and-coupon-claim-system-practice.md)，把限流、资格校验、Redis 预扣减、异步排队、幂等补偿和结果查询放回同一个典型业务里理解
11. [Node.js 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)，把重复请求、状态推进、本地事务、Outbox 和补偿放回同一条一致性主线

### 分组 5：异步与数据

12. [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md)，把事务边界、连接管理、Repository 和 ORM 取舍讲清
13. [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md)，把异步链路、重试、幂等和优雅关闭主线理顺
14. [Node.js 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)，把异步导出、游标扫描、流式生成、对象存储交付和导出配额讲清

### 分组 6：工程化与运维

15. [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md)，把项目结构、依赖管理、测试分层和 CI 基本盘补齐
16. [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md)，把配置收口、结构化日志、trace 和指标主线理顺
17. [Node.js 监控、告警与压测演练实践](./monitoring-alerting-and-pressure-drill-practice.md)，把 runtime 指标、依赖指标、业务指标、告警分级、压测和演练闭环理顺
18. [Node.js Feature Flag、运行时开关与灰度治理实践](./feature-flag-and-runtime-governance-practice.md)，把灰度放量、kill switch、request 级 snapshot、回退与拆除治理讲清
19. [Node.js Secrets、密钥与凭证轮换实践](./secret-management-and-credential-rotation-practice.md)，把 secret 注入、日志脱敏、Webhook / JWT 兼容窗口、对象存储凭证和外部 API token 轮换这条主线补齐

### 分组 7：Web 框架

20. [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md)，把 Node.js Web 服务的路由、中间件、错误处理和分层边界讲清
21. [NestJS 实战指南](./nestjs-practice-guide.md)，把框架能力放回 Node.js 服务端整体工程里理解

### 分组 8：源码专题

锁定 Node.js 22 LTS / libuv 1.48+ / V8 12.x。应用层读完再来，能把"为什么这样治理"升级到"能解释底层如何实现"。

22. [Node.js 源码剖析：libuv 事件循环与线程池](./source-libuv-event-loop-and-thread-pool.md)，从 `uv_run` 入口逐阶段走读事件循环六阶段、线程池调度、`process.nextTick` 与 Promise microtask 的 C++ 落点
23. [Node.js 源码剖析：I/O 多路复用与 net/http 底层 Binding](./source-io-multiplexing-and-net-http-binding.md)，讲清 epoll / kqueue / IOCP 抽象、TCP socket 从内核到 JS 的完整调用栈与 llhttp 解析器接入
24. [Node.js 源码剖析：Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md)，从 V8 Isolate / Context / Environment 三层模型到 MessagePort / transferList / SharedArrayBuffer 的 C++ 实现

::: tip 想直接跳源码？
如果你已经熟悉 Node.js 应用层治理，想一步到位解答"为什么 Node.js 能扛高并发"，可以直接从分组 8 开始读。三篇彼此交叉引用，建议按 libuv → I/O 多路复用 → Worker Threads 顺序。
:::

## 这个专题的重点

- 不只讲语法，而是优先建立 Node.js 服务端工程的对象模型：运行时、模块、依赖、请求、配置和部署
- 先把包和模块边界立住，再进入运行时、测试、Web 服务与异步任务，不让工程问题越写越混
- 把高并发场景下真正会出问题的几条线单独拎出来：事件循环、连接池、热点缓存、请求内并发和异步削峰
- 把缓存这条最容易"先能跑、后失控"的链路单独展开：本地缓存、Redis、热 key、击穿/雪崩和一致性窗口
- 把 Redis 单独收成一层基础设施：client 复用、key 设计、Pipeline、Lua、热点 Key 和慢命令治理
- 把第三方依赖调用单独收成边界层：HTTP client 复用、超时、重试预算、退避、熔断和幂等
- 把典型高并发业务场景单独落地：秒杀、抢券、资格发放、异步排队、结果查询和补偿收口
- 把一致性问题单独收成执行主线：幂等、状态机、Outbox、本地事务、补偿和最终一致性
- 让配置、日志、Tracing、数据库事务这些真正影响线上稳定性的基础设施边界尽早收口
- 把 Secrets、签名密钥、短期凭证和对象存储访问能力单独收成生命周期边界，不和普通配置混在一起
- 把可观测性继续推进到监控、告警、压测和故障演练，不只停留在"能看日志和图表"
- 把导出、报表和大结果集从"顺手做个下载接口"升级成异步任务、流式生成、对象存储交付和清理回收的完整链路
- 把 Feature Flag、灰度、kill switch 和运行时回退从"几个临时 bool"升级成可观测、可审计、可拆除的治理体系
- 把 Webhook、支付回调和三方通知从"收个 POST 就行"升级成验签、幂等、乱序处理和异步收口的稳定入口
- 优先补齐最容易影响线上稳定性的几条线：事件循环、内存/CPU 排障、测试治理、队列消费和优雅退出
- 不把 NestJS 当"会写装饰器就行"的框架，而是把它放回模块边界、依赖注入、HTTP 请求链路和工程交付里理解
- 先把系统设计和项目结构讲清，再进入校验、鉴权、数据库、异步任务和测试这些高频实战问题
- 保留一条从应用层向下沉的"源码视角"：libuv 事件循环与线程池、I/O 多路复用与 net/http Binding、Worker Threads 与 V8 Isolate

## 当前内容结构

### 分组 1：核心入口

| 文档 | 重点 |
| --- | --- |
| [Node.js 专题总览](./index.md) | 先建立 Node.js 服务端主线、适合人群和阅读顺序 |

### 分组 2：运行时基础

| 文档 | 重点 |
| --- | --- |
| [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md) | 重点补 import/export、require、exports、workspace、共享包和 monorepo 分层边界 |
| [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md) | 重点补事件循环、microtask、流、内存、CPU、阻塞定位和线上排障流程 |

### 分组 3：高并发与性能

| 文档 | 重点 |
| --- | --- |
| [Node.js 高并发解决方案实践](./high-concurrency-solution-practice.md) | 重点补限流、连接池、缓存、热点治理、异步削峰、Worker、超时重试和可观测性主线 |
| [Node.js 缓存、热点 Key 与缓存一致性实践](./cache-hotkey-and-consistency-practice.md) | 重点补本地缓存、Redis、两级缓存、热点 Key、缓存击穿/雪崩和写库删缓存的一致性主线 |
| [Node.js Redis 实战：客户端、连接池、Pipeline 与 Lua 脚本边界](./redis-client-pipeline-and-lua-practice.md) | 重点补 Redis client 复用、Pipeline、Lua、热点 Key、大 Key、慢命令和高并发治理边界 |
| [Node.js 限流、超时与过载保护实践](./rate-limit-timeout-and-overload-protection-practice.md) | 重点补 rate limit、并发限制、timeout、backpressure、快速失败和高风险接口保护组合 |

### 分组 4：一致性与幂等

| 文档 | 重点 |
| --- | --- |
| [Node.js HTTP Client、重试、熔断与退避实践](./http-client-retry-circuit-breaker-and-backoff-practice.md) | 重点补 client 复用、timeout、错误分层、重试预算、退避、熔断和下游保护边界 |
| [Node.js Webhook、回调与签名校验实践](/nodejs/webhook-and-callback-practice) | 重点补原始 body 验签、时间戳与重放防护、重复与乱序回调、2xx/5xx 返回语义和异步解耦 |
| [Node.js 秒杀 / 抢券系统实践](./seckill-and-coupon-claim-system-practice.md) | 重点补活动预热、资格校验、限流削峰、Redis 预扣减、异步排队、补偿和结果查询主线 |
| [Node.js 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md) | 重点补重复请求、状态推进、本地事务、Outbox、异步补偿和最终一致性主线 |

### 分组 5：异步与数据

| 文档 | 重点 |
| --- | --- |
| [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md) | 重点补连接管理、事务边界、Repository 分层、Prisma/ORM/Query Builder 取舍和常见坑 |
| [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md) | 重点补异步任务拆分、BullMQ / 队列思维、重试幂等、死信、调度和优雅退出 |
| [Node.js 导出、报表与大结果集实践](./export-report-and-large-result-practice.md) | 重点补同步小导出、异步导出任务、游标扫描、流式生成、对象存储交付、配额与过期清理 |

### 分组 6：工程化与运维

| 文档 | 重点 |
| --- | --- |
| [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md) | 重点补目录结构、依赖管理、单元/集成/e2e 测试、Mock 边界、日志配置和 CI |
| [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md) | 重点补配置收口、request id、trace、结构化日志、metrics 和线上排障观测 |
| [Node.js 监控、告警与压测演练实践](./monitoring-alerting-and-pressure-drill-practice.md) | 重点补 runtime / 依赖 / 队列 / 业务四层指标、告警分级、压测建模、故障演练与阈值回写 |
| [Node.js Feature Flag、运行时开关与灰度治理实践](./feature-flag-and-runtime-governance-practice.md) | 重点补静态配置与运行时开关分层、灰度放量、kill switch、snapshot、审计观测与拆除治理 |
| [Node.js Secrets、密钥与凭证轮换实践](./secret-management-and-credential-rotation-practice.md) | 重点补普通配置 / secret / 签名密钥 / 短期凭证区分、脱敏、兼容窗口、client 边界和轮换生效策略 |

### 分组 7：Web 框架

| 文档 | 重点 |
| --- | --- |
| [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md) | 重点补路由、中间件、请求上下文、错误处理、分层、校验和优雅关闭 |
| [NestJS 实战指南](./nestjs-practice-guide.md) | 重点补模块分层、DTO 与 Entity 边界、Guard / Pipe / Interceptor / Filter 责任、事务与部署实践 |

### 分组 8：源码专题

| 文档 | 重点 |
| --- | --- |
| [Node.js 源码剖析：libuv 事件循环与线程池](./source-libuv-event-loop-and-thread-pool.md) | 重点补 `uv_run` 七阶段源码走读、timer 堆结构、`uv__io_poll` 心跳、`UV_THREADPOOL_SIZE` 调优真相、nextTick / microtask C++ 落点 |
| [Node.js 源码剖析：I/O 多路复用与 net/http 底层 Binding](./source-io-multiplexing-and-net-http-binding.md) | 重点补 epoll / kqueue / IOCP 三平台对比、`uv__io_t` 统一抽象、TCP accept / read 到 JS 回调的完整调用栈、llhttp 解析器生命周期 |
| [Node.js 源码剖析：Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md) | 重点补 V8 Isolate / Context / Environment 三层对象、Worker 启动与独立 event loop、MessagePort / transferList / SharedArrayBuffer、为什么 CPU 密集不能走线程池 |
