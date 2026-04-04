---
title: Express / Fastify Web 服务实践
description: 围绕路由、中间件、请求上下文、错误处理、分层、校验与部署边界，整理 Node.js Web 服务工程主线。
---

# Express / Fastify Web 服务实践

很多人学 Node.js 服务端，真正落地时常见的第一站不是 NestJS，而是：

- Express
- Fastify

它们看起来都像“先起个服务再加几个路由”，但一进入真实项目，很快就会碰到这些问题：

- 路由、service、repository 怎么分层
- 中间件到底放哪些能力
- 请求上下文怎么贯穿
- 错误应该在哪里统一收口
- 为什么接口能跑，但一复杂就越来越难测、越来越难改

这页的目标，就是把 Express / Fastify Web 服务的工程主线讲清。

## 先理解这两个框架各自在解决什么

### Express

Express 的价值通常是：

- 简单直接
- 中间件生态成熟
- 上手快

它更像一套灵活的最小 Web 组装能力。

### Fastify

Fastify 的价值通常是：

- 更强调性能和 schema 驱动
- 插件体系更清晰
- 对请求/响应和校验链路的收口更强

它更像“更有边界意识的 Node.js Web 框架骨架”。

### 真正要关心的不是谁更好

而是：

- 你要的是快速搭服务，还是更清晰的插件/校验边界
- 团队是否有足够的工程约束来防止 Express 项目失控
- 你的服务是否更依赖 schema、性能和插件治理

## Web 服务先分清最小分层

无论是 Express 还是 Fastify，一个更稳的 Web 服务至少建议分清：

- 路由层：接 HTTP 参数、状态码、响应语义
- service 层：业务规则和流程编排
- repository / DAO 层：数据库访问
- adapter / client 层：第三方服务调用
- DTO / schema 层：请求响应边界

一个够用的目录通常可以这样：

```text
src/
├── main.ts
├── app.ts
├── routes/
├── modules/
├── common/
├── infra/
│   ├── db/
│   ├── redis/
│   └── http/
└── config/
```

关键点不是目录名，而是：

- 不要让 route 里直接写完所有业务
- 不要让第三方调用、数据库访问和错误映射散在同一层

## 路由层应该薄

一个健康的 route handler 通常只做这些事：

- 接参数
- 调 service
- 把结果映射成响应
- 维持清晰的 HTTP 语义

不要在路由层里堆这些逻辑：

- 大量业务判断
- 多表事务
- 第三方重试逻辑
- 大段数据拼装

路由越重，后面越难测试，也越难复用。

## 中间件 / Hook 的边界要尽早立住

中间件最容易变成“什么都往里塞”的大坑。

更适合放在中间件或 hook 的，通常是：

- request id
- trace 上下文
- 认证信息提取
- 基础日志
- 超时、CORS、压缩

不适合放在中间件里的，通常是：

- 复杂业务流程
- 大量数据库编排
- 重计算逻辑

一个很实用的原则是：

- 越基础设施化的能力，越适合靠外层中间件
- 越贴近业务语义的逻辑，越应该回到 service

## Express 和 Fastify 的一个关键差别：边界感

### Express 更灵活

优点是：

- 容易快速起步
- 生态多

风险是：

- 如果团队没有额外约束，很容易越来越像“到处挂中间件和工具函数”

### Fastify 更强调 schema 和插件边界

优点通常是：

- 请求和响应 schema 更容易统一
- 插件注册边界更明确
- 对工程收口更友好

但也要注意：

- 它不是自动架构方案
- service、repository、错误边界照样需要你自己立住

## 请求校验别等到业务层才补

更稳的方式通常是：

- 在请求入口就校验
- 尽早把非法输入挡掉

这样做的价值是：

- 减少业务层防御性代码
- 错误响应更稳定
- 问题更容易定位

如果你在 Fastify 里走 schema 驱动，这条链路更自然；  
如果你在 Express 里做，也建议尽量统一校验入口，而不是每个 route 自己散写。

## 请求上下文最好有统一载体

一个成熟一点的 Node.js Web 服务，通常会把这些信息贯穿整个请求：

- request id
- trace id
- 当前用户
- 租户信息
- 调用来源

更稳的做法通常是：

- 在中间件阶段创建上下文
- 在 service 和 logger 里显式传递或绑定

不要等项目大了以后，才发现日志和错误都对不上请求链路。

## 错误处理要统一出口

一个更稳的错误模型通常至少区分：

- 输入错误
- 业务规则冲突
- 系统内部错误

如果没有统一错误出口，常见结果就是：

- 有的接口返回 400
- 有的接口返回 500
- 有的接口直接把底层异常字符串吐出去

这会让调用方和排障都很痛苦。

更稳的做法通常是：

- 边界层统一捕获错误
- 业务层抛稳定业务异常
- 路由层只负责最终 HTTP 映射

## 数据库和第三方依赖不要直接粘在 route 上

更健康的做法通常是：

- route 调 service
- service 调 repository / adapter

这样做的价值是：

- 测试更容易
- 事务边界更清楚
- 替换依赖更容易

尤其是第三方 HTTP 调用，不要在 route 里：

- 直接发请求
- 直接重试
- 直接拼日志和错误映射

否则业务和外部依赖会越来越耦合。

如果你想把 HTTP client 复用、timeout、重试和熔断边界单独理顺，继续看：

- [Node.js HTTP Client、重试、熔断与退避实践](./http-client-retry-circuit-breaker-and-backoff-practice.md)

## Web 服务和运行时主线要一起看

很多 Web 服务问题看起来像“路由写得不够好”，本质其实是：

- 运行时阻塞
- 大 JSON / 大对象处理
- 事件循环延迟
- 下游 I/O 堵塞

如果你还没把这条底层主线理顺，建议先补：

- [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)
- [Node.js 配置管理、日志、Tracing 与可观测性实践](./config-logging-tracing-and-observability-practice.md)
- [Node.js 高并发解决方案实践](./high-concurrency-solution-practice.md)
- [Node.js 限流、超时与过载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## 模块边界和 Web 服务边界也要一起看

Web 服务一复杂，通常就会走到：

- 多模块拆分
- 多包共享
- monorepo

如果你还没把共享包、workspace 和包导出边界理顺，建议继续看：

- [Node.js 模块系统、ESM/CommonJS 与 monorepo 工程边界](./module-system-esm-commonjs-and-monorepo-boundaries.md)

## 测试要覆盖真正的请求链路

Web 服务测试至少建议覆盖：

- service 单元测试
- route / handler 集成测试
- 认证失败路径
- 参数错误路径
- 下游依赖失败路径

如果你想把数据库连接、事务边界和 Repository 分层单独理顺，继续看：

- [Node.js 数据库、事务与 ORM/Query Builder 实践](./database-transaction-and-orm-practice.md)

如果你想把测试分层、Mock/Fake、CI 和工程化主线单独系统化，继续看：

- [Node.js 测试、Mock 与工程化实践](./testing-mock-and-engineering-practice.md)

## 异步任务别全塞在 HTTP 请求里

很多 Web 服务最后会变得难维护，不是因为路由太多，而是：

- 导出、通知、重试、补偿都塞在请求生命周期里

更稳的做法通常是：

- 请求只做快速确认
- 真正的重任务拆到队列或 worker

如果你想把这条异步主线单独展开，继续看：

- [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md)

## 和 NestJS 的关系

Express / Fastify 和 NestJS 不是互斥关系。

更准确地说：

- Express / Fastify 更适合先理解 Node.js Web 服务本身在解决什么
- NestJS 更适合在团队工程里进一步强化模块、依赖注入和请求链路治理

如果你想把 NestJS 这套工程骨架单独理顺，继续看：

- [NestJS 实战指南](./nestjs-practice-guide.md)

## 常见坏味道

- route 里直接写数据库和第三方调用
- 中间件里塞满业务逻辑
- 错误处理没有统一出口
- 请求上下文散落在日志和业务里到处透传
- 参数校验不统一，导致接口行为不一致
- 只在 happy path 下能跑，一出错误路径就返回混乱

## 推荐实践项目

### 1. Express 管理后台 API

目标：

- 建立 route/service/repository 分层
- 加统一错误处理中间件
- 加 request id 和结构化日志

### 2. Fastify BFF 聚合服务

目标：

- 用 schema 管理请求响应
- 聚合多个下游服务接口
- 统一处理超时、错误映射和上下文透传

### 3. 旧 Web 服务重构演练

目标：

- 把超重 route 拆薄
- 收口第三方依赖到 adapter
- 给关键路径补集成测试和错误路径测试

## 高频自检题

- 为什么 route 层应该尽量薄
- 中间件更适合放哪些能力，哪些能力不该放进去
- 为什么错误处理应该有统一出口
- Express 和 Fastify 的核心差别，工程上真正影响什么
- 为什么很多导出、通知、补偿不该直接塞进 HTTP 请求里

## 一句话收尾

Express / Fastify 真正难的，不是“会不会起一个服务”，而是能不能把路由、中间件、错误、上下文和依赖边界一起收住。  
只要这条线立住，Node.js Web 服务才会从“能跑”走到“能长期维护”。
