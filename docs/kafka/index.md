---
title: Kafka 专题
description: 系统整理 Kafka 核心知识，并收录《深入拆解消息队列 47 讲》章节笔记，覆盖消息模型、可靠性、顺序性、延时、事务、架构升级与运维运营。
---

# Kafka 专题

这个专题把两类内容收敛到一个入口：

- Kafka 的快速上手资料，适合先建立 Producer、Broker、Consumer、分区、副本和支付场景的基本盘
- 《深入拆解消息队列 47 讲》的章节笔记，适合按消息队列架构主线做系统精读

> 说明：47 讲中不只有 Kafka，也覆盖 RabbitMQ、RocketMQ、Pulsar 和通用 MQ 设计。这里统一收进 Kafka 专题，是为了把消息队列这条学习主线放在一个地方持续维护。

<KafkaDiagram kind="overview" />

## 适合谁看

- 想先把 Kafka 核心概念、可靠性和支付场景答清楚的人
- 不满足于只会用 Kafka，还想系统理解消息队列共性设计的人
- 准备面试或做架构选型，需要把顺序性、幂等、延时、事务、积压、容灾讲完整的人
- 希望从“会接入 MQ”进阶到“能评估和拆解 MQ 架构”的工程师

## 你会得到什么

- 一条围绕“不丢、不乱、不堵”的 Kafka 快速上手路径
- 一套按章节分组的消息队列系统化笔记目录
- 关键 Kafka 章节补充的站内 SVG 图例，便于后续持续维护

<KafkaDiagram kind="topic-goals-map" />

## 快速上手

| 文档 | 覆盖内容 |
| --- | --- |
| [核心概念](./core-concepts.md) | Producer / Consumer / Broker、Topic / Partition / Offset、Consumer Group、高可用机制、高性能原理 |
| [支付实战](./payment-practice.md) | TCC + Kafka、本地消息表、Offset 补偿、重试 / 死信、延迟队列、生产治理 |
| [深入追问与词汇](./interview-questions.md) | 高频追问、答题口径、英语术语速查 |

## 消息队列 47 讲

### 预习篇

| # | 标题 |
| --- | --- |
| 00 | [开篇导读](./00-preface.md) |
| 01 | [发展脉络](./01-mq-evolution.md) |
| 02 | [核心概念](./02-mq-concepts.md) |

### 基础篇

| # | 标题 |
| --- | --- |
| 03 | [通信协议](./03-protocol-design.md) |
| 04 | [网络模块](./04-network-module.md) |
| 05 | [存储设计](./05-storage-model.md) |
| 06 | [存储优化](./06-storage-reliability.md) |
| 07 | [生产者 SDK](./07-producer-sdk.md) |
| 08 | [消费者 SDK（上）](./08-consumer-sdk-part1.md) |
| 09 | [消费者 SDK（下）](./09-consumer-sdk-part2.md) |
| 10 | [RabbitMQ 基础架构](./10-rabbitmq-basic-architecture.md) |
| 11 | [RocketMQ 基础架构](./11-rocketmq-basic-architecture.md) |
| 12 | [Kafka 基础架构](./12-kafka-basic-architecture.md) |
| 13 | [Pulsar 基础架构](./13-pulsar-basic-architecture.md) |

### 进阶篇

| # | 标题 |
| --- | --- |
| 14 | [集群瓶颈与风险](./14-cluster-bottlenecks.md) |
| 15 | [集群构建（上）](./15-cluster-construction-part1.md) |
| 16 | [集群构建（下）](./16-cluster-construction-part2.md) |
| 17 | [一致性方案](./17-consistency-patterns.md) |
| 18 | [编码技巧](./18-java-performance-techniques.md) |
| 19 | [认证鉴权加密](./19-auth-authz-encryption.md) |
| 20 | [限流方案](./20-rate-limiting.md) |
| 21 | [监控体系](./21-monitoring-system.md) |
| 22 | [消息轨迹](./22-message-trace.md) |
| 23 | [RabbitMQ 集群架构](./23-rabbitmq-cluster-architecture.md) |
| 24 | [RocketMQ 集群架构](./24-rocketmq-cluster-architecture.md) |
| 25 | [Kafka 集群架构](./25-kafka-cluster-architecture.md) |
| 26 | [Pulsar 集群架构](./26-pulsar-cluster-architecture.md) |

### 功能篇

| # | 标题 |
| --- | --- |
| 27 | [Topic / 分区 / 订阅](./27-topic-partition-subscription.md) |
| 28 | [顺序与幂等](./28-ordering-and-idempotency.md) |
| 29 | [延时消息](./29-delay-messages.md) |
| 30 | [事务消息](./30-transaction-messages.md) |
| 31 | [死信与优先级](./31-dlq-and-priority-queue.md) |
| 32 | [消息查询](./32-message-query.md) |
| 33 | [Schema 模块](./33-schema-module.md) |
| 34 | [WebSocket 支持](./34-websocket-support.md) |
| 35 | [高级功能对比](./35-advanced-features-comparison.md) |

### 架构升级篇

| # | 标题 |
| --- | --- |
| 36 | [存算分离](./36-cloud-native-compute-storage-separation.md) |
| 37 | [分层存储](./37-tiered-storage.md) |
| 38 | [Serverless 流处理](./38-serverless-stream-processing.md) |
| 39 | [Serverless 事件驱动](./39-serverless-event-driven.md) |
| 40 | [连接器与数据集成](./40-connectors-and-data-integration.md) |
| 41 | [跨地域容灾](./41-cross-region-disaster-recovery.md) |
| 42 | [消息中台](./42-message-platform.md) |

### 经验总结篇

| # | 标题 |
| --- | --- |
| 43 | [未来演进](./43-future-architecture.md) |
| 44 | [商业化](./44-commercialization.md) |
| 45 | [成为领域专家](./45-becoming-a-domain-expert.md) |
| 46 | [产品思维](./46-product-mindset.md) |
| 47 | [大规模集群运营](./47-large-scale-mq-operations.md) |
| 48 | [结束语](./48-conclusion.md) |

## 建议阅读顺序

1. 先看 [核心概念](./core-concepts.md) 和 [支付实战](./payment-practice.md)，快速建立 Kafka 基本盘
2. 再读 47 讲的 `00-02`，把消息队列的整体框架和学习方法对齐
3. 按 `03-13` → `14-26` → `27-35` → `36-42` → `43-48` 的顺序系统精读
4. 最后用 [深入追问与词汇](./interview-questions.md) 压缩成自己的面试口径

## 关联资料

- [Go 代码实现：消息队列、事务、治理与高可用](/golang/guide/08-mq-transaction-governance-ha)
- [Rust 消息队列与事件驱动实践](/rust/message-queue-and-event-driven-practice)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
- [MySQL 专题](/mysql/)
- [Redis 专题](/redis/)
