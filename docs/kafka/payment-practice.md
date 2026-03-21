---
title: Kafka 支付实战
description: Kafka 在支付系统中的实战应用：TCC 配合、本地消息表、全链路可靠性、补偿机制、延迟队列与生产治理。
vocabulary:
  - idempotent-producer
  - dead-letter-queue
  - delay-queue
  - rebalance
  - backpressure
---

# Kafka 支付实战

<KafkaDiagram kind="payment-practice" />

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

> 详细的事务消息 Go 实现见 [消息队列、事务、治理与高可用](/golang/guide/08-mq-transaction-governance-ha)，总览文档第七章也有相关讨论。

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

- 使用[金融级配置](./core-concepts.md#金融级推荐配置完整展开)（`acks=all` + `enable.idempotence=true`）
- `retries` 设置足够大，兜住网络抖动
- `max.in.flight.requests.per.connection=5`：配合幂等生产兼顾顺序和可靠性
- 不能"发后即忘"，必须在 Callback 中捕获异常
- 多次重试仍失败，记录日志、告警、投入补偿队列

> Producer 不只是"把消息发出去"，而是要知道"到底有没有发成功"。

### 2. Broker：确保"持久"

使用[金融级配置](./core-concepts.md#金融级推荐配置完整展开)，重点理解 `min.insync.replicas` 和 `acks=all` 的联动：

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

**Broker 侧**：使用[金融级配置](./core-concepts.md#金融级推荐配置完整展开)把概率压到理论最低。

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

## 继续阅读

- [核心概念](./core-concepts.md)
- [深入追问与词汇](./interview-questions.md)
- [返回 Kafka 专题总览](./index.md)
