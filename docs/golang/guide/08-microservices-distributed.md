---
title: 微服务与分布式
description: Go 微服务与分布式学习总览，按通信基础、容错治理、高并发系统设计和高可用架构拆分为 4 个专题页。
search: false
---

# 微服务与分布式

## 适合人群

- 已有 Go Web 开发经验，想系统学习微服务架构与分布式设计
- 需要在生产环境中构建高可用、可观测的分布式系统
- 希望掌握服务治理、容错、消息驱动等核心能力

## 学习目标

- 掌握 gRPC + Protobuf 的服务通信方式
- 理解服务注册发现、配置中心、链路追踪等基础设施
- 能设计和实现熔断、限流、重试、幂等等容错机制
- 了解分布式事务、消息队列、高可用架构设计
- 能从 Go 服务视角设计高并发系统，而不是只停留在组件罗列

## 阅读方式

原来的长文已拆成 4 个子页，保留当前页面作为总览入口。建议按下面顺序阅读：

1. [RPC、注册发现与配置](./08-rpc-discovery-config)
2. [追踪、容错与重试](./08-observability-resilience)
3. [Go 高并发系统设计](./08-go-high-concurrency-system-design)
4. [消息队列、事务、治理与高可用](./08-mq-transaction-governance-ha)

<GoMicroserviceDiagram kind="overview" />

## 主题拆分

### 1. RPC、注册发现与配置

适合先搭基础设施认知，覆盖：

- gRPC 原理与服务端/客户端实现
- Protobuf 语法和代码生成
- 基于 etcd 的服务注册与发现
- 配置中心和热更新边界

入口：[开始阅读](./08-rpc-discovery-config)

### 2. 追踪、容错与重试

适合理解系统稳定性手段，覆盖：

- OpenTelemetry 链路追踪
- 熔断、限流、降级
- 幂等设计
- 指数退避与重试预算

入口：[开始阅读](./08-observability-resilience)

### 3. Go 高并发系统设计

适合把 Go 服务、缓存、队列、数据库和稳定性治理串成一张完整架构图，覆盖：

- 审题与容量估算
- 接入层、服务层、数据层和治理层拆分
- Go 里的有界并发、连接池和锁竞争控制
- 缓存、MQ、数据库一致性和压测观测

入口：[开始阅读](./08-go-high-concurrency-system-design)

### 4. 消息队列、事务、治理与高可用

适合进入分布式协作和治理阶段，覆盖：

- Kafka 生产与消费模式
- Saga 与 Outbox
- 负载均衡、健康检查、优雅启停
- 高可用设计与舱壁隔离

入口：[开始阅读](./08-mq-transaction-governance-ha)

## 对照关系

- 原第 1-4 节 -> [RPC、注册发现与配置](./08-rpc-discovery-config)
- 原第 5-8 节 -> [追踪、容错与重试](./08-observability-resilience)
- 新增独立专题 -> [Go 高并发系统设计](./08-go-high-concurrency-system-design)
- 原第 9-12 节 -> [消息队列、事务、治理与高可用](./08-mq-transaction-governance-ha)
