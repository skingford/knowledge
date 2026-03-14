---
title: 高并发支付系统专题整理：Kafka 篇
description: 聚焦支付系统里的 Kafka 高频考点，覆盖消息可靠性、顺序性、积压治理与死信处理。
vocabulary:
  - message-queue
  - decoupling
  - absorb-traffic-spikes
  - asynchronous-processing
  - producer
  - consumer
  - consumer-group
  - broker
  - topic
  - partition
  - partition-key
  - acknowledgment
  - idempotent-producer
  - offset
  - manual-offset-commit
  - message-loss
  - duplicate-consumption
  - idempotency
  - ordering
  - ordering-within-a-partition
  - state-machine
  - replica
  - in-sync-replicas
  - backlog
  - hot-partition
  - scale-out-consumers
  - degradation
  - retry
  - backoff
  - bounded-retries
  - dead-letter-queue
  - delay-queue
  - rebalance
  - alerting
  - audit-log
  - reconciliation
  - risk-control
  - rate-limiting
---

# 高并发支付系统专题整理：Kafka 篇

- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [上一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [参考：MySQL 篇](./high-concurrency-payment-mysql.md)
- [Go 代码实现参考](../../golang/guide/08-mq-transaction-governance-ha.md)

## 适合谁看

- 对消息系统的可靠性、顺序性、消费治理答得还不够完整
- 想把支付系统里的异步链路、削峰填谷、失败补偿讲清楚
- 需要一套更偏实战的 Kafka 高频题模板

## 你会得到什么

- 一套围绕消息不丢、不乱、不堵的答题框架
- Producer、Broker、Consumer 三层视角的可靠性梳理
- 面向支付系统的积压、重试、死信治理思路

## 建议复习顺序

1. 先看 [核心概念层](#一核心概念层)，建立基本盘
2. 再看 [支付实战层](#二支付实战层)，把知识落到业务链路
3. 最后看 [面试追问层](#三面试追问层)，快速过高频题

---

# 一、核心概念层

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

Rebalance 期间所有 Consumer 暂停消费，对支付链路意味着 RT 抖动和超时风险。优化策略见 [再平衡优化](#2-再平衡优化)。

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

## 高性能秘籍：为什么 Kafka 这么快

Kafka 的高性能是一组设计共同作用的结果：

1. **顺序写磁盘**：append-only 方式连续写入日志文件
2. **Page Cache**：大量利用操作系统页缓存，生产消费很多时候不直接打磁盘
3. **零拷贝**：`sendfile` 机制把数据从内核缓冲区直接发到网卡
4. **批量发送与压缩**：多条消息打包发送 + 压缩，减少网络 IO 次数和传输体积

> Kafka 快不是因为"磁盘比内存快"，而是因为它把磁盘顺序写、操作系统缓存、零拷贝和批处理都用到了极致。

---

# 二、支付实战层

## TCC 为什么要配合 Kafka

标准 TCC 的 Confirm / Cancel 失败需要持续重试。高并发场景下同步重试会长时间占住线程、连接和下游资源。

引入 Kafka 的目的是把 Confirm / Cancel 异步化：

- TCC 负责定义状态流转
- Kafka 负责驱动最终执行
- Offset 负责记录"补偿任务到底处理到哪里了"

### 典型场景

以"支付扣款（Try）→ 增加余额（Confirm）"为例：

1. Try 阶段在本地数据库事务里完成冻结或预扣
2. 同一个事务中写入事务消息表
3. 可靠投递组件把消息发送到 `PAY_CONFIRM` Topic
4. 下游消费者异步执行 Confirm

Kafka 的价值：消息有持久化、消费失败可重试、宕机后能从上次位点继续恢复。

## 本地消息表 + Kafka 配合模式

本地消息表是"业务操作和消息发送的原子性"的经典解法，与 TCC 互补。

### 核心流程

1. 在同一个数据库事务中：执行业务操作 + 写入本地消息表（状态为 `PENDING`）
2. 事务提交后，由后台线程或定时任务扫描 `PENDING` 消息，发送到 Kafka
3. 发送成功后更新消息状态为 `SENT`
4. 下游消费者处理成功后回调或由对账确认，更新为 `CONFIRMED`

### 适用场景

- 支付成功后异步通知商户
- 扣款后触发清结算
- 退款审批通过后异步执行退款

### 与 TCC 的关系

| 模式 | 一致性保证 | 复杂度 | 典型场景 |
| --- | --- | --- | --- |
| TCC + Kafka | 强一致（多方协调） | 高 | 多服务间资金流转 |
| 本地消息表 + Kafka | 最终一致 | 中 | 单服务发起的异步通知和补偿 |

> 详细的事务消息 Go 实现见 [消息队列、事务、治理与高可用](../../golang/guide/08-mq-transaction-governance-ha.md)，总览文档第七章也有相关讨论。

## 基于 Offset 的补偿机制设计

### Exactly-Once 风格的消费补偿

金融场景逼近精确一次消费的关键思路：

1. 消费者拉到消息后，开启数据库事务
2. 执行业务逻辑
3. 把当前 offset 记录到业务库的 `offset_manager` 表
4. 提交数据库事务
5. 重启恢复时，从数据库读取 offset，通过 `consumer.seek()` 定位

本质是把"业务结果"和"消费进度"绑定成同一个原子单元。

## 补偿机制的三道防线

### 第一道防线：Kafka 重试 + 死信队列

Confirm 执行失败时：

- 不提交 offset
- 让消息进入重试流程（带退避策略）
- 超过阈值后投入死信队列（DLQ）
- DLQ 消息由人工或定时任务处理，资损相关必须告警

这层解决短期故障和瞬时抖动。

### 第二道防线：基于 Offset 的位移追溯

消费者集群整体宕机或 offset 提交失败后的恢复策略：

- 用业务库里的 offset 作为可信进度
- 和 Kafka 当前消费进度、lag 指标比对
- 必要时通过 `seek()` 回到未完成位点重新扫描

适合做"对账式恢复"，尤其是清结算、账务修复、资损排查。

### 第三道防线：状态机 + 定时对账

Kafka 推进状态流转，但最终保障不能只靠 MQ：

- TCC 事务日志表记录全局事务状态
- 定时任务扫描长时间停留在 `TRYING` 的记录
- 重新投递 Kafka 消息，或直接触发 Confirm / Cancel

> Offset 还可结合处理时间戳快速定位积压段，缩小对账扫描范围。

## 消息不丢失的全链路闭环

消息不丢失是 Producer → Broker → Consumer 三端共同协作的结果。

### 1. Producer：确保"送达"

- 使用金融级配置（`acks=all` + `enable.idempotence=true`）
- `retries` 设置足够大，兜住网络抖动
- `max.in.flight.requests.per.connection=5`：配合幂等生产兼顾顺序和可靠性
- 不能"发后即忘"，必须在 Callback 中捕获异常
- 多次重试仍失败，记录日志、告警、投入补偿队列

> Producer 不只是"把消息发出去"，而是要知道"到底有没有发成功"。

### 2. Broker：确保"持久"

使用金融级配置，重点理解 `min.insync.replicas` 和 `acks=all` 的联动：

- ISR 可用副本数低于阈值时，Broker 直接拒绝写入
- 短期牺牲可用性，避免"只剩 Leader 还继续写，Leader 一挂数据全没"

### 3. Consumer：确保"处理"

- `enable.auto.commit=false`
- 业务逻辑真正成功后再手动提交 offset
- 天然引入 At-Least-Once 语义："宁可重复，不可漏处理"

下游必须具备幂等能力、唯一约束、状态机校验。

> Kafka 负责把消息尽量不丢地送到你面前，真正把重复消费风险兜住的是业务侧幂等。

## 极小概率回滚：已确认但新 Leader 看不到

这是高可用里非常细但有区分度的追问。

### 根因

即使配置了 `acks=all`，ACK 返回与 HW 推进之间存在极短时间差：

1. Producer 收到 `acks=all`
2. Leader 还没来得及把新 HW 同步给所有副本
3. Leader 瞬间宕机
4. 新 Leader 的 LEO 略低于旧 Leader
5. "已确认"的消息被截断

本质是副本切换时的日志截断问题。

### 应对方案

**Broker 侧**：使用金融级配置把概率压到理论最低。

**架构层状态对齐**：把 `topic + partition + offset + business_id` 四元组原子性写入业务数据库。恢复时对比 Kafka 当前位点，发现回跳则告警、挂起受影响 Partition、按 `business_id` 补发。

**事务生产者**：使用 `initTransactions()` → `beginTransaction()` → `commitTransaction()`，配合 `isolation.level=read_committed`，未完成事务的消息对消费者不可见。

> Kafka 能把这类问题压到极小概率，但金融系统还必须通过事务日志、外部位点映射和定时对账把极端场景闭环掉。

## 架构避坑指南

### 1. 幂等性是补偿前提

Offset 提交失败、消费者重启、重复拉取，都会导致重复消费。金融场景下必须先有幂等再谈补偿：

- 用 `transaction_id` 做唯一索引
- 用状态字段约束合法流转
- 更新时带条件，比如只允许 `INIT -> SUCCESS`

### 2. 顺序性陷阱

TCC 链路典型坑是空回滚（Cancel 先到，Try 后到）：

- 先检查全局事务状态
- Cancel 先到就记下"该事务已取消"
- 后续 Try 再到时直接丢弃或转异常处理

### 3. 分区倾斜导致延迟

某个 Partition 长期积压时，一部分用户很快收到结果，另一部分长时间等待。重点看：

- Partition 级别的 offset lag
- Key 哈希策略是否均匀
- 是否存在热点商户/账户/订单号

极端情况下可采用二级分发（先从 Kafka 拉消息再放入进程内队列并行处理），但会显著提高 offset 提交和并发控制的复杂度。

## 延迟队列

支付系统中有大量需要"延迟执行"的场景：超时未支付自动关单、延迟通知商户、分级重试退避等。

### 多级 Retry Topic 方案

这是 Kafka 生态中最常见的延迟队列实现方式：

| Topic | 延迟 | 用途 |
| --- | --- | --- |
| `retry-1s` | 1 秒 | 瞬时抖动快速重试 |
| `retry-10s` | 10 秒 | 短暂故障重试 |
| `retry-60s` | 1 分钟 | 下游恢复窗口 |
| `retry-300s` | 5 分钟 | 长恢复窗口 |
| `dlq` | - | 最终死信，人工介入 |

消费者从主 Topic 消费失败后，根据已重试次数投入对应级别的 retry topic。每个 retry topic 的消费者在拉取消息后检查时间戳，未到延迟时间则暂停消费或重新投递。

### 时间轮方案

对延迟精度要求更高的场景（如精确到秒的关单），可以结合进程内时间轮：

1. 消费者从 Kafka 拉取"待延迟"消息
2. 放入进程内时间轮（如 Hierarchical Timing Wheel）
3. 到期后执行业务逻辑或投递到执行 Topic

代价是进程重启时需要从 Kafka 重新加载未到期消息，适合延迟时间较短（< 30 分钟）的场景。

### 典型支付场景

- **定时关单**：下单后 30 分钟未支付 → 投入 `order-close-delay` Topic → 到期后检查订单状态 → 未支付则关闭
- **延迟通知**：支付成功后延迟 N 秒通知商户（等待银行回调确认）
- **分级重试**：调用银行接口失败后按 1s → 10s → 60s → 300s 逐级退避

## 生产治理：流量风暴、重平衡与多活

### 1. 流量风暴与多级限流

营销活动、账务批处理、银行回调抖动都可能让 Kafka 短时间内承受极高流量。

| 层级 | 手段 | 作用 |
| --- | --- | --- |
| Broker 侧 | Client-side Quotas | 限制特定 `client-id` 或 `user-principal` 的生产/消费速率 |
| Consumer 侧 | Backpressure | 本地处理队列满时停止拉取，避免 OOM |

**Client-side Quotas** 适合分级治理：核心交易链路优先保资源，对账/报表/风控回放链路限速。

**Backpressure**：维护本地内存队列或 worker 池长度，接近上限时暂停拉取，利用 Kafka 自身 Partition 积压能力做"外部缓冲池"。

> Kafka 可以积压，但应用进程不能先 OOM。

### 2. 再平衡优化

Rebalance 是消费组抖动的核心来源，对金融场景意味着消费停顿、RT 抖动、下游超时放大。

**避免频繁 Rebalance**：业务处理慢（调银行接口、清结算 RPC）时，`max.poll.interval.ms` 不能设得过小，否则消费者被误判卡死并踢出消费组。

**Static Membership**：配置 `group.instance.id` 启用静态成员制。K8s Pod 滚动更新时，只要实例在 `session.timeout.ms` 内回来，不会触发完整 Rebalance。

**Incremental Cooperative Rebalancing**（Kafka 2.4+）：不再做全组 Stop-The-World 式重平衡，只对受影响的分区做局部迁移，显著降低消费中断时间。

### 3. 分区平衡与数据倾斜治理

**自定义分区器**：某个 Key 流量极大时，在 Key 后增加随机后缀（如 `merchant_123#1`），把超热点 Key 打散到多个分区，再由消费端逻辑聚合。代价是顺序性管理更复杂，只适合确实存在热点倾斜的场景。

**Leader 自动平衡**：开启 `auto.leader.rebalance.enable=true`，避免热点 Leader 集中在同一台机器。

### 4. 可观测性

**Lag 监控**：不要只看 Topic 总 Lag，至少下钻到 Partition 级别。单个 Partition 积压往往对应特定商户或业务逻辑异常。

**Trace**：把 `trace_id`、`order_id`、`merchant_id` 写入消息 Header，串起完整链路：下单 → 支付事件写 Kafka → 清结算消费 → 账务入账 → 对账补偿。

**JMX 重点指标**：

| 指标 | 含义 | 建议 |
| --- | --- | --- |
| `UnderReplicatedPartitions` | 不完全同步副本数 | > 0 就关注，持续上升要告警 |
| `IsrShrinksPerSec` / `IsrExpandsPerSec` | ISR 缩扩容频率 | 频繁抖动说明集群不稳定 |

### 5. 灾备与多活

**跨集群复制**：MirrorMaker 2.0 或 Confluent Replicator。架构模式分 Active-Passive（主集群写，从集群热备）和 Active-Active（双活写入，一致性复杂）。

**Offset 不一致问题**：不同集群的 offset 不天然一致。故障切换后依赖消息头中的业务时间戳或全局唯一业务 ID 在新集群重新定位消费起点。

> 单集群里 offset 是消费位点，跨集群时真正可信的锚点是业务 ID 和业务时间。

---

# 三、面试追问层

> 以下为高频追问的精简口径和代码示例。每个知识点的完整展开见上文对应章节。

### 消息如何做到尽量不丢

<details>
<summary><strong>消息如何做到尽量不丢？</strong></summary>

> Producer/Broker/Consumer 三层同时兜底。详见 [全链路闭环](#消息不丢失的全链路闭环) 和 [金融级配置](#金融级推荐配置完整展开)。

- Producer：金融级配置 + Callback 异常捕获
- Broker：三副本 + `min.insync.replicas=2`
- Consumer：业务成功后再 commit offset

```go
func (c *Consumer) HandleMessage(msg *kafka.Message) error {
    if err := c.processPayment(msg); err != nil {
        return err
    }
    c.consumer.CommitMessages(context.Background(), msg)
    return nil
}
```

</details>

### 如何保证同一订单的消息顺序

<details>
<summary><strong>如何保证同一订单的消息顺序？</strong></summary>

> 以 `OrderID` 作为 Partition Key，同一订单进入同一分区，由同一消费者顺序处理。详见 [分区路由策略](#分区路由策略)。

三件事：上游按订单维度路由 → 分区内单线程顺序消费 → 下游状态机做幂等和合法流转校验。

```go
msg := &kafka.Message{
    Topic: "payment_events",
    Key:   []byte(order.OrderID),
    Value: payload,
}
producer.Produce(msg)
```

</details>

### 如何处理消息积压

<details>
<summary><strong>如何处理消息积压？</strong></summary>

> 分紧急止血和长期治理两层。详见 [流量风暴与多级限流](#1-流量风暴与多级限流)。

| 阶段 | 动作 |
| --- | --- |
| 紧急止血 | 扩容 Consumer 至分区数上限，临时跳过非核心消息 |
| 短期优化 | 排查慢消费（DB 慢查询、RPC 超时），批量消费替代逐条 |
| 长期治理 | 热点 Topic 拆分，按业务优先级设不同 Topic 和消费组 |

注意：Consumer 数量超过 Partition 数量后，新增实例不会继续提升吞吐。

</details>

### 如何做消费重试和死信处理

<details>
<summary><strong>如何做消费重试和死信处理？</strong></summary>

> 有限重试 + 死信闭环。详见 [第一道防线](#第一道防线kafka-重试--死信队列) 和 [延迟队列](#延迟队列)。

1. 有限次重试，带退避
2. 超过阈值进入死信队列
3. DLQ 由人工或后台任务处理
4. 资损相关必须告警和审计

```go
func (c *Consumer) HandleWithRetry(msg *kafka.Message) {
    for i := 0; i <= 3; i++ {
        if err := c.processPayment(msg); err == nil {
            c.consumer.CommitMessages(context.Background(), msg)
            return
        }
        time.Sleep(time.Duration(i+1) * time.Second)
    }
    c.producer.Produce(&kafka.Message{
        Topic: "payment_events_dlq",
        Key:   msg.Key,
        Value: msg.Value,
    })
    c.consumer.CommitMessages(context.Background(), msg)
    log.Error("消息投入死信队列", "key", string(msg.Key))
}
```

</details>

### 消息丢失 vs 重复消费

<details>
<summary><strong>消息丢失和重复消费的区别？</strong></summary>

| 问题 | 常见原因 | 解法 |
| --- | --- | --- |
| 消息丢失 | `acks=1` 时 Leader 宕机；先提交 offset 再处理业务失败 | 金融级配置；业务成功后再提交 offset |
| 重复消费 | 业务成功但提交 offset 前消费者宕机 | 下游幂等；唯一约束；状态机校验 |

支付系统更怕"重复扣款"，一定要强调业务幂等。

</details>

### 幂等性与事务

<details>
<summary><strong>幂等性和事务的区别？</strong></summary>

- **幂等性**：解决生产者重试导致的重复写入，适合单分区语义
- **事务**：解决跨 Partition 或跨 Topic 的原子提交

> 幂等性解决"别重复写"，事务解决"要么一起成，要么一起不成"。

</details>

---

## English Vocabulary Notes

适合面试前快速过一遍这篇 Kafka 文档里出现的核心英文术语。仓库里没有现成的 `high-concurrency-payment-kafka.html`，这里按当前源文档里的有效术语做了去重整理，不包含代码变量名、文件路径和低价值噪音词。

### 1. 核心架构

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 消息队列 | message queue | 常缩写为 MQ |
| 解耦 | decoupling | 服务之间不要强依赖 |
| 削峰填谷 | absorb traffic spikes | 高峰期先入队，低峰期再消费 |
| 异步处理 | asynchronous processing | 非核心链路异步化 |
| 生产者 | producer | 负责发送消息 |
| 消费者 | consumer | 负责拉取和处理消息 |
| 消费组 | consumer group | 分区消费的基本单位 |
| 代理节点 | broker | Kafka 服务节点 |
| 集群 | cluster | 多个 Broker 组成集群 |
| 主题 | topic | 消息的逻辑分类 |
| 分区 | partition | Kafka 并发和顺序的基本单位 |
| 分区键 | partition key | 常用 `order_id` 做路由 |
| 分段日志 | segment | Partition 内部的日志分段 |
| 偏移量 | offset | 消费进度标记 |
| 拉取 | poll | 消费者主动拉消息 |

### 2. 可靠性与一致性

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 副本 | replica | 用于提高可靠性 |
| 领导副本 | leader partition | 负责读写请求 |
| 跟随副本 | follower partition | 负责同步，不直接提供写 |
| 同步副本集 | in-sync replicas (ISR) | 和 Leader 保持同步的副本 |
| 确认机制 | acknowledgment | 常见表达是 `acks=all` |
| 幂等生产 | idempotent producer | 防止重复发送 |
| 幂等性 | idempotency | 重复执行结果一致 |
| 手动提交偏移量 | manual offset commit | 业务成功后再提交 |
| 自动提交 | auto commit | 简单但风险高 |
| 高水位线 | high watermark (HW) | 消费者最多读到这里 |
| 日志末端位移 | log end offset (LEO) | 副本当前写到哪里 |
| 事务生产者 | transactional producer | 用于更强一致性 |
| 已提交可见 | read committed | 只消费已提交事务 |
| 控制消息批次 | control batch | 事务提交标记的一部分 |
| 提交标记 | commit marker | 事务提交的可见性依据 |

### 3. 顺序、积压与补偿

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 顺序性 | ordering | 也可用 message order |
| 分区内有序 | ordering within a partition | Kafka 只保证分区内顺序 |
| 状态机 | state machine | 防止状态乱序流转 |
| 再平衡 | rebalance | 分区重新分配给消费者 |
| 静态成员制 | static membership | 减少 Pod 重启触发重平衡 |
| 增量协同重平衡 | incremental cooperative rebalancing | 局部重平衡，降低 STW |
| 消息积压 | message backlog | 生产快于消费时出现 |
| 积压延迟 | lag | 监控消费落后程度 |
| 热点分区 | hot partition | 某个分区负载过高 |
| 扩容消费者 | scale out consumers | 常见止血动作 |
| 重试 | retry | 失败后再次处理 |
| 退避 | backoff | 控制重试节奏 |
| 有限重试 | bounded retries | 避免无限重试 |
| 死信队列 | dead-letter queue | 常写作 DLQ |
| 延迟队列 | delay queue | 定时关单、延迟通知 |
| 补偿 | compensation | 异常后的业务修复 |

### 4. 性能与生产治理

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 页缓存 | page cache | 利用操作系统缓存磁盘数据 |
| 零拷贝 | zero-copy | 常结合 `sendfile` 理解 |
| 背压 | backpressure | 缓冲区满时暂停继续拉取 |
| 客户端配额 | client-side quotas | 限制某类客户端速率 |
| 限流 | rate limiting | 防止链路被打爆 |
| 降级 | degradation | 非核心能力先降级 |
| 文件句柄 | file handle | Partition 太多时成本上升 |
| 发送回调 | callback | 发送结果不能发后即忘 |
| 吞吐量 | throughput | 高频性能指标 |
| 延迟 | latency | 高频稳定性指标 |
| OOM | out of memory | 本地拉太猛的典型后果 |
| Stop-The-World | stop-the-world | 全局停顿式影响 |

### 5. 可观测性与多活

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 全链路追踪 | trace | 串起订单全链路 |
| 追踪 ID | trace_id | 建议放在消息 Header |
| 消息头 | header | 传递上下文信息 |
| 告警 | alerting | 资损类问题必须告警 |
| 审计日志 | audit log | 关键链路留痕 |
| 对账 | reconciliation | 支付结果核对 |
| 风控 | risk control | 常见异步消费场景 |
| 不完全同步副本数 | under replicated partitions | 大于 0 就该关注 |
| ISR 缩容频率 | IsrShrinksPerSec | 高频波动通常说明抖动 |
| ISR 扩容频率 | IsrExpandsPerSec | 和 Shrink 一起看 |
| 主备模式 | active-passive | 主集群写，从集群热备 |
| 双活模式 | active-active | 两边都可写，但复杂度高 |
| 跨集群复制 | MirrorMaker 2.0 | 常见跨机房复制方案 |
| 跨集群复制 | Confluent Replicator | 商业化复制方案 |

### 6. TCC 与金融补偿

| 中文 | 英文 | 速记 |
| --- | --- | --- |
| 尝试 | Try | TCC 第一阶段 |
| 确认 | Confirm | 成功后正式提交 |
| 取消 | Cancel | 失败后释放资源 |
| 事务日志 | transaction log | 记录全局事务状态 |
| 本地消息表 | local message table | 常见可靠投递模式 |
| 精确一次 | exactly-once | 更强的一致性目标 |
| 至少一次 | at-least-once | 宁可重复，不可漏处理 |
| 事务 ID | transaction_id | 幂等和去重的重要主键 |
| 业务 ID | business_id | 补偿和对账的关键锚点 |
| 位点管理表 | offset manager | 把业务结果和 offset 绑定 |

### Quick Phrases

- The producer sends payment events to Kafka brokers.
- We use the order ID as the partition key.
- Kafka only guarantees ordering within a partition.
- The consumer commits the offset only after the business logic succeeds.
- If retries still fail, the message is sent to the dead-letter queue.
- Consumers in the same group share partitions; different groups consume independently.

## 继续阅读

- [上一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [返回专题总览](./high-concurrency-payment-system-practice-notes.md)
- [Go 代码实现：消息队列、事务、治理与高可用](../../golang/guide/08-mq-transaction-governance-ha.md)
- [案例总览](./index.md)
