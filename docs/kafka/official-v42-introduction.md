---
title: Kafka 4.2 官方介绍
description: 基于 Apache Kafka 4.2 官方文档整理的中文版介绍，涵盖事件流概念、Kafka 架构、核心术语（Event / Topic / Partition / Replication）与五大 API。
vocabulary:
  - event-streaming
  - producer
  - consumer
  - broker
  - topic
  - partition
  - replication
  - kafka-streams
  - kafka-connect
---

# Kafka 4.2 官方介绍

> 本文基于 [Apache Kafka 4.2 官方文档](https://kafka.apache.org/42/getting-started/introduction/) 整理，适合作为入门第一篇阅读。更深入的核心概念详见 [核心概念](./core-concepts.md)。

## 什么是事件流（Event Streaming）

**事件流**（Event Streaming）是从数据库、传感器、移动设备、云服务和软件应用等事件源实时捕获数据的实践。它确保数据的持续流动和解读，使得：

- 数据可以被**持久化存储**，供事后检索
- 数据可以被**实时处理和响应**
- 数据可以被**路由到不同的目标**系统

事件流是数据实时运动的数字化等价物——从"信息产生"到"信息被消费"，全程连续、有序。

## 事件流的应用场景

| 场景 | 说明 |
| --- | --- |
| 金融交易 | 实时处理交易、支付、保险理赔、投资组合监控 |
| 物流追踪 | 实时跟踪和监控车队、货运、订单状态 |
| IoT 数据采集 | 持续捕获和分析传感器数据，用于智能设备和工业监控 |
| 零售与电商 | 实时处理客户交互、订单流转 |
| 医疗健康 | 患者监护和状态预测，及时触发治疗流程变更 |
| 企业数据连通 | 连接不同部门的数据平台，打通数据孤岛 |
| 微服务基础设施 | 作为数据平台、事件驱动架构和微服务的底层通信基础 |

## Kafka 是什么

Apache Kafka 是一个**事件流平台**（Event Streaming Platform），融合了三大核心能力：

1. **发布 / 订阅**（Publish / Subscribe）——向事件流写入和读取数据，支持与外部系统的持续集成
2. **持久化存储**（Durable Storage）——以可靠、容错的方式长期存储事件流
3. **流处理**（Stream Processing）——在事件产生时实时处理，也支持对历史事件的回溯处理

这三大能力以分布式、高可用、弹性伸缩、安全的方式提供，可部署在裸金属、虚拟机、容器，也可运行在本地或云端。

## 工作原理概览

### 服务端（Servers）

Kafka 以集群形式运行，可跨越多个数据中心或云区域：

- **Broker**：构成存储层，负责消息的持久化和分发
- **Kafka Connect**：以连接器形式持续导入/导出数据，与外部系统（数据库、其他 Kafka 集群等）集成

集群具备高度容错性——任意服务器故障时，其他服务器自动接管，确保数据不丢失。

### 客户端（Clients）

客户端负责分布式读写和处理事件流，即使在网络故障或服务器宕机时也能容错地工作。

- 官方提供 **Java** 和 **Scala** 客户端
- 社区提供 **Go、Python、C/C++** 等语言客户端及 **REST API**
- 高级流处理可使用 **Kafka Streams** 库

## 核心概念与术语

### 事件（Event）

事件（也称 Record 或 Message）记录了"世界上发生了某件事"。一个事件包含：

| 字段 | 说明 |
| --- | --- |
| **Key** | 事件的键，用于决定写入哪个 Partition |
| **Value** | 事件的值，承载业务数据 |
| **Timestamp** | 时间戳 |
| **Headers** | 可选的元数据头信息 |

示例事件：

> - Key: "Alice"
> - Value: "向 Bob 支付了 200 元"
> - Timestamp: 2020-06-25T06:00:00

### 生产者与消费者（Producer & Consumer）

- **Producer**：向 Kafka Topic 发布（写入）事件
- **Consumer**：订阅（读取和处理）这些事件

两者**完全解耦、互不感知**，这是 Kafka 实现高可伸缩性的关键设计。Kafka 提供多种投递语义保证，包括 **Exactly-once**（精确一次）。

> 与传统消息系统不同，事件在消费后**不会被删除**。可以通过 Topic 级别的保留策略配置事件的保存时长。

更多 Producer/Consumer 细节参见 [核心概念 → Producer / Consumer / Broker](./core-concepts.md#producer-consumer-broker)。

### 主题（Topic）

Topic 是事件的逻辑分类，类似文件系统中的文件夹：

- 一个 Topic 可以有 **零到多个** Producer 和 Consumer
- 多个 Producer 可以同时写入同一个 Topic
- 多个 Consumer 可以独立消费同一个 Topic

更多 Topic 细节参见 [核心概念 → Topic / Partition / Offset](./core-concepts.md#topic-partition-offset)。

### 分区（Partition）

Topic 被分散到多个 **Partition**（分区）中，分布在不同的 Broker 上：

- 拥有相同 Key 的事件会被写入**同一个 Partition**
- Kafka 保证同一 Partition 内的消费者**按写入顺序读取事件**
- Partition 是 Kafka 实现水平扩展和并发消费的物理基石

更多 Partition 细节参见 [核心概念 → Partition 详解](./core-concepts.md#partition-详解)。

### 副本（Replication）

Topic 的每个 Partition 会被**复制到多个 Broker** 上，实现容错和高可用：

- 生产环境常见配置：**Replication Factor = 3**（即每份数据存 3 个副本）
- 任意 Broker 故障时，其他副本自动接管服务
- 副本机制支持跨地域部署

更多副本机制参见 [核心概念 → 高可用机制](./core-concepts.md#高可用机制)。

## Kafka 五大 API

| API | 用途 |
| --- | --- |
| **Admin API** | 管理和检查 Topic、Broker 及其他 Kafka 对象 |
| **Producer API** | 向一个或多个 Topic 发布事件流 |
| **Consumer API** | 订阅一个或多个 Topic 并处理事件流 |
| **Kafka Streams API** | 实现流处理应用，提供转换、聚合、Join、窗口等高级操作 |
| **Kafka Connect API** | 构建和运行可复用的数据导入/导出连接器，与外部系统（数据库、文件系统、搜索引擎等）集成 |

## 延伸阅读

- [核心概念](./core-concepts.md)——深入 Producer/Consumer/Broker、Partition、Consumer Group 与高可用原理
- [支付实战](./payment-practice.md)——TCC + Kafka、本地消息表、Offset 补偿与延迟队列
- [Kafka 基础架构（47 讲）](./12-kafka-basic-architecture.md)——从消息队列通用架构视角拆解 Kafka
