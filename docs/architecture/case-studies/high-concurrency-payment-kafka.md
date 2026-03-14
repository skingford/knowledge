---
title: 高并发支付系统专题整理：Kafka 篇
description: 聚焦支付系统里的 Kafka 高频考点，覆盖消息可靠性、顺序性、积压治理与死信处理。
---

# 高并发支付系统专题整理：Kafka 篇

- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [MySQL 篇](./high-concurrency-payment-mysql.md)
- [Redis 篇](./high-concurrency-payment-redis.md)

## 适合谁看

- 对消息系统的可靠性、顺序性、消费治理答得还不够完整
- 想把支付系统里的异步链路、削峰填谷、失败补偿讲清楚
- 需要一套更偏实战的 Kafka 高频题模板

## 你会得到什么

- 一套围绕消息不丢、不乱、不堵的答题框架
- Producer、Broker、Consumer 三层视角的可靠性梳理
- 面向支付系统的积压、重试、死信治理思路

## 建议复习顺序

1. 先看消息可靠性，建立基本盘
2. 再看顺序性和积压处理，补高并发链路问题
3. 最后看重试与死信，补异常闭环能力

支付链路里，MQ 不只是削峰工具，更是保证异步解耦和系统恢复能力的重要组件。

## 先建立答题框架

### 不丢失怎么讲

从三个层面回答：

- Producer：`acks=all`，幂等生产
- Broker：多副本，`min.insync.replicas > 1`
- Consumer：业务成功后再提交 offset

### 顺序性怎么讲

同一订单的消息必须顺序消费，常见方案：

- 以 `OrderID` 做分区键
- 单分区内单线程顺序消费
- 下游状态机本身也要幂等和防乱序

### 消息积压怎么讲

建议从以下角度展开：

- 扩容 consumer
- 拆分热点 topic
- 优化慢消费逻辑
- 增加降级和削峰措施

## Kafka 高频追问

<details>
<summary><strong>消息如何做到尽量不丢？</strong></summary>

> 从 Producer、Broker、Consumer 三层同时兜底。

| 层级 | 配置 | 作用 |
| --- | --- | --- |
| Producer | `acks=all` + `enable.idempotence=true` | 写入所有 ISR 副本后才确认，防止重复 |
| Broker | `min.insync.replicas=2`, `replication.factor=3` | 单节点宕机不丢数据 |
| Consumer | 手动提交 offset | 业务成功后再 commit |

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

<details>
<summary><strong>如何保证同一订单的消息顺序？</strong></summary>

> 以 `OrderID` 作为 Partition Key，同一订单的消息进入同一分区，由同一消费者顺序处理。下游状态机也要做防乱序校验。

```go
msg := &kafka.Message{
    Topic: "payment_events",
    Key:   []byte(order.OrderID),
    Value: payload,
}
producer.Produce(msg)
```

</details>

<details>
<summary><strong>如何处理消息积压？</strong></summary>

> 分紧急止血和长期治理两层看：先扩容、跳过非核心，再排查慢消费和拆热点 Topic。

| 阶段 | 动作 |
| --- | --- |
| 紧急止血 | 扩容 Consumer 至分区数上限，临时跳过非核心消息 |
| 短期优化 | 排查慢消费（DB 慢查询、RPC 超时），批量消费替代逐条 |
| 长期治理 | 热点 Topic 拆分，按业务优先级设不同 Topic 和消费组 |

</details>

<details>
<summary><strong>如何做消费重试和死信处理？</strong></summary>

> 核心策略是重试 N 次，投入死信队列，再由人工或定时任务处理，避免无限重试阻塞主队列。

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

---

## 继续阅读

- [上一篇：Redis 篇](./high-concurrency-payment-redis.md)
- [返回高并发支付系统专题整理](./high-concurrency-payment-system-practice-notes.md)
- [案例总览](./index.md)
