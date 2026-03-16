---
title: Kafka 深入追问与词汇
description: Kafka 高频深入追问精简口径与代码示例，附英语词汇速查表。
vocabulary:
  - idempotency
  - dead-letter-queue
  - ordering
  - backlog
  - retry
  - reconciliation
---

# Kafka 深入追问与词汇

> 以下为高频追问的精简口径和代码示例。每个知识点的完整展开见 [核心概念](./core-concepts.md) 和 [支付实战](./payment-practice.md)。

## 消息如何做到尽量不丢

<details>
<summary><strong>消息如何做到尽量不丢？</strong></summary>

> Producer/Broker/Consumer 三层同时兜底。详见 [全链路闭环](./payment-practice.md#消息不丢失的全链路闭环) 和 [金融级配置](./core-concepts.md#金融级推荐配置完整展开)。

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

## 如何保证同一订单的消息顺序

<details>
<summary><strong>如何保证同一订单的消息顺序？</strong></summary>

> 以 `OrderID` 作为 Partition Key，同一订单进入同一分区，由同一消费者顺序处理。详见 [分区路由策略](./core-concepts.md#分区路由策略)。

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

## 如何处理消息积压

<details>
<summary><strong>如何处理消息积压？</strong></summary>

> 分紧急止血和长期治理两层。详见 [流量风暴与多级限流](./payment-practice.md#1-流量风暴与多级限流)。

| 阶段 | 动作 |
| --- | --- |
| 紧急止血 | 扩容 Consumer 至分区数上限，临时跳过非核心消息 |
| 短期优化 | 排查慢消费（DB 慢查询、RPC 超时），批量消费替代逐条 |
| 长期治理 | 热点 Topic 拆分，按业务优先级设不同 Topic 和消费组 |

注意：Consumer 数量超过 Partition 数量后，新增实例不会继续提升吞吐。

</details>

## 如何做消费重试和死信处理

<details>
<summary><strong>如何做消费重试和死信处理？</strong></summary>

> 有限重试 + 死信闭环。详见 [第一道防线](./payment-practice.md#第一道防线kafka-重试--死信队列) 和 [延迟队列](./payment-practice.md#延迟队列)。

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

## 消息丢失 vs 重复消费

<details>
<summary><strong>消息丢失和重复消费的区别？</strong></summary>

| 问题 | 常见原因 | 解法 |
| --- | --- | --- |
| 消息丢失 | `acks=1` 时 Leader 宕机；先提交 offset 再处理业务失败 | 金融级配置；业务成功后再提交 offset |
| 重复消费 | 业务成功但提交 offset 前消费者宕机 | 下游幂等；唯一约束；状态机校验 |

支付系统更怕"重复扣款"，一定要强调业务幂等。

</details>

## 幂等性与事务

<details>
<summary><strong>幂等性和事务的区别？</strong></summary>

- **幂等性**：解决生产者重试导致的重复写入，适合单分区语义
- **事务**：解决跨 Partition 或跨 Topic 的原子提交

> 幂等性解决"别重复写"，事务解决"要么一起成，要么一起不成"。

</details>

---

## English Vocabulary Notes

适合面试前快速过一遍 Kafka 相关的核心英文术语。

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

---

## 继续阅读

- [核心概念](./core-concepts.md)
- [支付实战](./payment-practice.md)
- [返回 Kafka 专题总览](./index.md)
