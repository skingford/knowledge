---
title: Kafka 核心概念
description: Kafka 核心概念：Producer/Consumer/Broker、Topic/Partition/Offset、Consumer Group、高可用机制与高性能秘籍。
vocabulary:
  - message-queue
  - producer
  - consumer
  - consumer-group
  - broker
  - topic
  - partition
  - offset
  - replica
  - in-sync-replicas
  - acknowledgment
---

# Kafka 核心概念

<KafkaDiagram kind="core-concepts" />

## Producer / Consumer / Broker

- **Producer**：生产者，负责把业务事件写入 Kafka
- **Consumer**：消费者，从 Broker 拉取消息并执行业务处理
- **Broker**：Kafka 节点，多个 Broker 组成一个 Cluster

支付语境下，Producer 往往来自下单、支付、风控、通知等服务；Consumer 则可能是清结算、账务、通知、对账等下游系统。

## Topic / Partition / Offset

- **Topic**：逻辑上的消息分类
- **Partition**：物理上的分区，一个 Topic 会拆到多个 Partition 中
- **Offset**：消息在 Partition 内的唯一序号，消费者靠它记录消费进度

核心理解：

- Topic 解决的是业务分类
- Partition 解决的是水平扩展和并发消费
- Offset 解决的是"我消费到哪里了"

> 面试里如果被问到 Kafka 为什么能支撑高并发，通常就要顺着 Partition 和 Offset 往下讲。

<KafkaDiagram kind="partition-routing" />

## Consumer Group

Consumer Group 是 Kafka 消费模型的核心抽象，理解它才能正确回答扩容、Rebalance、消费并行度等问题。

### 基本规则

- 同一个 Consumer Group 内，一个 Partition 只会分配给一个 Consumer 实例
- 不同 Consumer Group 之间互不影响，各自维护独立的消费进度
- Consumer 数量 > Partition 数量时，多余的 Consumer 处于空闲状态

### Rebalance 触发条件

| 事件 | 说明 |
| --- | --- |
| Consumer 加入或离开 Group | 新实例上线、旧实例崩溃或超时被踢出 |
| 订阅的 Topic 分区数变化 | 新增 Partition 后需要重新分配 |
| `session.timeout.ms` 超时 | 消费者未在超时时间内发送心跳 |
| `max.poll.interval.ms` 超时 | 消费者两次 `poll()` 间隔过长 |

### 对支付系统的影响

Rebalance 期间所有 Consumer 暂停消费，对支付链路意味着 RT 抖动和超时风险。优化策略见 [支付实战：再平衡优化](./payment-practice.md#2-再平衡优化)。

<KafkaDiagram kind="consumer-group-rebalance" />

## Partition 详解

Partition 是 Kafka 实现高吞吐和水平扩展的物理基石。

### 物理存储

每个 Partition 在 Broker 磁盘上对应一组日志文件，内部由多个 Segment 组成：

- `.log`：存储消息数据
- `.index`：偏移量索引
- `.timeindex`：时间索引

顺序追加写 + Segment 切分 = 高吞吐 + 过期清理简单。

### 分区路由策略

| 策略 | 说明 | 典型用途 |
| --- | --- | --- |
| 指定 Partition | 直接发到固定分区 | 特殊业务定向写入 |
| Key 哈希 | 对 Key 做哈希后落分区 | 用 `order_id` 保证同单局部有序 |
| 轮询 | 默认均匀分发 | 没有强顺序诉求时做负载均衡 |
| 粘性分区 | 小消息短时间内尽量发往同一分区 | 批量发送减少网络开销 |

支付场景最常见的是 **Key 哈希**，因为订单状态流转、支付回调、退款事件通常要求同一业务实体局部有序。

### Partition 数量不是越多越好

| 问题 | 原因 |
| --- | --- |
| 文件句柄开销大 | 每个 Partition 对应多组日志和索引文件 |
| Controller 管理压力增大 | 元数据膨胀，Leader 切换变慢 |
| 副本同步压力变大 | ISR 同步延迟上升 |
| 故障恢复变慢 | 宕机后要恢复的 Partition 更多 |

> Partition 要和吞吐目标、消费者并行度、Broker 资源、运维复杂度一起平衡。

## Offset 与消费位点管理

Offset 是消费进度的锚点。答深一点时，要把 LEO、HW 和 offset 存储一起讲。

### LEO 和 HW

| 概念 | 含义 | 作用 |
| --- | --- | --- |
| LEO | Log End Offset | 副本"写到哪里了" |
| HW | High Watermark | 所有 ISR 副本都已同步完成的位置 |

消费者最多只能读到 HW。这样做是为了避免 Leader 切换后，消费者读到尚未被 ISR 全体确认的数据。

### Offset 管理方式

| 方式 | 场景 | 特点 |
| --- | --- | --- |
| 自动提交 | 非核心业务 | 简单，但容易丢数据或重复消费 |
| 同步手动提交 | 核心业务、处理量较小 | 阻塞线程但可靠性高 |
| 异步手动提交 | 追求吞吐量 | 性能好但失败补偿更复杂 |
| 自定义存储 | 极强一致性诉求 | 把 offset 和业务数据一起落库，最稳但最复杂 |

> 支付/账务/清结算核心链路：最稳的做法是把业务结果和消费位点放在同一个事务里。

## 高可用机制：副本、ISR 与 ACK

这是"Kafka 挂了一个节点，数据还在吗？"的标准答法。

### 副本机制

- **Leader Partition**：负责所有读写请求
- **Follower Partition**：同步 Leader 数据，不直接对外提供读写

### ISR（In-Sync Replicas）

和 Leader 保持同步的副本集合。Leader 挂了优先从 ISR 中选新 Leader，减少数据丢失。

### ACK 应答机制

| 配置 | 含义 | 可靠性 |
| --- | --- | --- |
| `acks=0` | 发出去就算成功 | 最低 |
| `acks=1` | Leader 收到就确认 | 中等 |
| `acks=all` | Leader + 所有 ISR 副本都确认 | 最高 |

### 金融级推荐配置（完整展开）

支付系统里强调可靠性，建议默认组合：

| 配置 | 作用 |
| --- | --- |
| `acks=all` | 等 ISR 全部确认后再返回 |
| `min.insync.replicas >= 2` | 保证至少两个副本参与确认 |
| `replication.factor >= 3` | 单节点宕机不丢数据 |
| `unclean.leader.election.enable=false` | 禁止脏副本上位 |
| `enable.idempotence=true` | 生产端防重复写 |

> **宁可短暂不可用，也不要为了可用性让脏数据上位。**

本文后续涉及这组配置时，统一简称"金融级配置"，不再重复展开。

<KafkaDiagram kind="replication-hw" />

## 高性能秘籍：为什么 Kafka 这么快

Kafka 的高性能是一组设计共同作用的结果：

1. **顺序写磁盘**：append-only 方式连续写入日志文件
2. **Page Cache**：大量利用操作系统页缓存，生产消费很多时候不直接打磁盘
3. **零拷贝**：`sendfile` 机制把数据从内核缓冲区直接发到网卡
4. **批量发送与压缩**：多条消息打包发送 + 压缩，减少网络 IO 次数和传输体积

> Kafka 快不是因为"磁盘比内存快"，而是因为它把磁盘顺序写、操作系统缓存、零拷贝和批处理都用到了极致。

---

## 继续阅读

- [支付实战](./payment-practice.md)
- [深入追问与词汇](./interview-questions.md)
- [返回 Kafka 专题总览](./index.md)
