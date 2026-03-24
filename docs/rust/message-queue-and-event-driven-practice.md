---
title: Rust 消息队列与事件驱动实践
description: 从 producer、consumer、事件契约、at-least-once、重试、死信、顺序性、幂等消费到观测与测试，整理 Rust 服务里的消息队列主线。
search: false
---

# Rust 消息队列与事件驱动实践

Rust 服务做到一定阶段，很多关键链路都会从“同步调用”走向“异步消息”：

- 下单后异步发通知
- 支付成功后推送积分、发票、营销事件
- 上游系统把状态变更以事件方式推过来
- worker 持续消费任务并回写本地状态
- 某个业务流拆成多个服务协同推进

这时候最容易出现几类误解：

- 以为“上了 Kafka / RabbitMQ”就天然可靠了
- 以为 Outbox 已经解决了全部一致性问题
- 以为消息系统可以直接做到 exactly-once
- 以为 consumer 只要 `spawn` 一下就算写完了

真正要处理的是另一组问题：

- 消息到底表示命令、任务还是事件
- 生产侧如何避免“写库成功但消息没发”
- 消费侧如何承受至少一次投递
- 重试、死信、人工介入边界怎么设计
- 顺序性、并发度和吞吐怎么权衡

这页补的就是 Rust 消息队列与事件驱动主线。

## 先分清：命令、任务、事件不是一回事

很多项目把所有消息都叫“事件”，这会让边界越来越糊。

一个更稳的区分通常是：

### 1. command

更像：

- “请帮我做这件事”

特点通常是：

- 目标消费者更明确
- 更像面向动作
- 常见于系统间编排

### 2. job

更像：

- “有个任务等着被执行”

特点通常是：

- 一条消息通常只希望被一个 worker 成功处理
- 更像任务队列
- 常见于发邮件、生成报表、同步索引

### 3. event

更像：

- “某件事实已经发生了”

特点通常是：

- 语义更偏事实通知
- 可以有多个下游订阅者
- 常见于领域事件、集成事件

如果这三种语义不分清，后面很容易把：

- 重试策略
- 消费方式
- 顺序要求
- 失败处理

全部混成一锅。

## Outbox 解决的是生产侧一致性，不是整个消息系统

很多人第一次接触消息队列时，最怕的问题是：

- 本地事务已经提交
- 但消息没发出去

这正是 Outbox 在解决的核心问题。

更稳的主线通常是：

1. 本地事务里同时写业务状态和 outbox 记录
2. relay / publisher 进程把 outbox 记录投到 broker
3. broker 再把消息分发给 consumer

也就是说：

- Outbox 解决的是“写库和待发送消息一起提交”
- broker 解决的是“消息如何分发和存储”
- consumer 解决的是“消息收到后如何安全处理”

如果你想先把 Outbox 和幂等主线理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 不要迷信 exactly-once，先按 at-least-once 设计

消息系统里最常见也最危险的误解之一，就是“我们要 exactly-once”。

务实一点的结论通常是：

- 大多数跨系统业务最终都要按 at-least-once 来承受
- 然后靠幂等消费、状态机和去重把副作用收住

三个常见语义可以这样理解：

### at-most-once

- 最多投一次
- 可能丢
- 不会重复

### at-least-once

- 至少投一次
- 不容易丢
- 可能重复

### exactly-once

- 在某个局部链路、某套特定基础设施里也许能做到
- 但一旦跨数据库、外部系统、多服务边界，业务上通常还是要自己兜幂等

所以更稳的原则通常是：

1. 先假设消息会重复
2. 再设计消费方幂等
3. 然后补重试和死信策略

## 事件契约要稳定、可版本化、可追踪

消息体不要只是一坨匿名 JSON。

更稳的方向通常是有一个统一 envelope：

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct EventEnvelope<T> {
    pub event_id: Uuid,
    pub event_type: String,
    pub event_version: u32,
    pub aggregate_id: String,
    pub occurred_at: DateTime<Utc>,
    pub trace_id: Option<String>,
    pub payload: T,
}
```

这个 envelope 至少在解决几件事：

- `event_id`：去重和排障
- `event_type`：路由和消费分发
- `event_version`：演进兼容
- `aggregate_id`：顺序性和业务定位
- `occurred_at`：时间语义
- `trace_id`：观测串联

一个高频坏味道是：

- 直接把内部领域对象序列化后扔进队列

这会导致：

- 内部结构改动直接影响下游
- 缺少显式版本控制
- 排障时看不到事件元数据

如果你想把消息编解码和 DTO 边界单独理顺，继续看：

- [Serde 与数据序列化实践](./serde-and-data-serialization.md)
- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

如果你想把 HTTP API versioning、弃用窗口和外部契约演进单独理顺，继续看：

- [Rust API Versioning、兼容演进与弃用治理实践](./api-versioning-and-compatibility-governance-practice.md)

## producer 不要直接把 broker SDK 散落到业务里

更稳的做法通常是把“发布消息”当成清晰边界。

例如：

```rust
use async_trait::async_trait;

#[derive(Debug, thiserror::Error)]
pub enum PublishError {
    #[error("transport error: {0}")]
    Transport(String),
}

#[async_trait]
pub trait EventPublisher {
    async fn publish_order_paid(
        &self,
        event: EventEnvelope<OrderPaidEvent>,
    ) -> Result<(), PublishError>;
}
```

这样做的价值是：

- service 层依赖语义化接口
- broker 选型可以压在基础设施层
- fake publisher 和集成测试更容易写

不要让每个业务 use case 都自己决定：

- topic 名称
- serialization 方式
- key 选什么
- 遇到失败是重试、返回错误还是忽略

这些都应该收敛在发布边界里。

## consumer 主线通常是：解析 -> 去重 -> 业务处理 -> 确认

一个更稳的 consumer 骨架通常不是“拿到消息就直接执行业务”，而是：

1. 反序列化 envelope
2. 校验事件类型和版本
3. 用 `event_id` 或业务键做去重判断
4. 执行业务处理
5. 成功后再 ack / commit offset / 标记完成

一个抽象示意：

```rust
#[derive(Debug, thiserror::Error)]
pub enum ConsumeError {
    #[error("retryable: {0}")]
    Retryable(String),
    #[error("permanent: {0}")]
    Permanent(String),
}

pub async fn handle_message(
    message: &[u8],
    service: &OrderProjectionService,
    deduper: &ProcessedEventStore,
) -> Result<(), ConsumeError> {
    let event: EventEnvelope<OrderPaidEvent> =
        serde_json::from_slice(message).map_err(|err| ConsumeError::Permanent(err.to_string()))?;

    if deduper
        .already_processed(event.event_id)
        .await
        .map_err(|err| ConsumeError::Retryable(err.to_string()))?
    {
        return Ok(());
    }

    service
        .apply_order_paid(&event)
        .await
        .map_err(|err| err.classify())?;

    deduper
        .mark_processed(event.event_id)
        .await
        .map_err(|err| ConsumeError::Retryable(err.to_string()))?;

    Ok(())
}
```

这里最关键的不是具体 trait 名字，而是：

- 解析失败通常是 permanent
- 临时依赖故障通常是 retryable
- 去重和业务处理边界要清楚

## 幂等消费必须落在“本地状态变更”边界上

消费幂等不等于“收到重复消息时打印一句日志”。

更稳的做法通常是：

- 用 `event_id` 建 processed_events 表
- 或把事件业务键落进本地唯一约束
- 或通过条件更新让状态只推进一次

关键点在于：

- 去重标记
- 本地状态变更

最好要么同事务完成，要么能用条件更新收住。

否则很容易出现：

1. 业务更新成功
2. 但 dedupe 标记没写成功
3. 消息再次重试
4. 副作用被放大

如果你想把幂等键、条件更新和状态推进细节单独理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 重试策略要先分“临时失败”和“永久失败”

消息系统里最容易把故障放大的地方，就是无差别重试。

更稳的分类通常是：

### retryable

例如：

- 数据库短暂不可用
- broker ack 失败
- 下游 HTTP 503 / timeout
- 临时锁冲突

### permanent

例如：

- payload 无法解析
- 事件版本不支持
- 必填字段缺失
- 明确违反业务前置条件且重试无意义

这两类问题的处理不应该一样。

更实用的策略通常是：

1. retryable 走有限次退避重试
2. permanent 直接进死信或人工介入
3. 超过最大重试次数也进死信

不要让“反正先重试”成为默认策略。

## 死信不是“失败就扔掉”，而是人工介入出口

DLQ / 死信队列真正的价值是：

- 不让坏消息无限阻塞主消费链
- 不让不可恢复的问题在主队列里反复打转
- 给排障和补偿留一个稳定出口

死信记录至少值得包含：

- 原始消息内容
- event_id / aggregate_id
- topic / queue / partition
- 最后一次错误
- attempt 次数
- 首次和最后一次失败时间

更稳的原则通常是：

- 死信消息可查询
- 可人工重放
- 可标记忽略
- 可按事件类型聚合排障

## 顺序性通常只能按 key 局部保证，不能全局保证

业务很容易要求：

- “事件必须按顺序消费”

但如果不先说清是“谁的顺序”，系统很快会失控。

更稳的问法通常是：

- 是同一个 `order_id` 的事件必须有序？
- 还是整个 topic 所有消息都要绝对有序？

大多数场景真正要的是：

- 同一业务主键局部有序

而不是：

- 整个系统全局串行

所以很常见的做法是：

- 用 `aggregate_id` 作为 partition key / routing key
- 保证同一资源落在同一顺序通道
- 不同资源之间允许并发消费

这比“所有 consumer 都只开 1 个并发”更现实。

## 吞吐和顺序是要交换的，不是能同时白拿

如果你追求更高吞吐，通常会做：

- 更多 partition
- 更多 consumer 并发
- 批量拉取和批量提交

但对应代价往往是：

- 顺序粒度变粗
- 重试更复杂
- 失败时回放范围更大

所以不要只问：

- 怎么把消费速度提上去

还要问：

- 哪些消息真的需要强顺序
- 哪些消息允许最终一致

## 观测至少要覆盖积压、延迟、重试和死信

消息系统如果没有观测，很容易变成“线上默默坏掉但没人知道”。

至少值得有这些指标：

- `messages_published_total`
- `messages_consumed_total`
- `message_consume_failures_total`
- `message_retry_total`
- `message_dead_letter_total`
- `queue_depth`
- `consumer_lag`

很实用的标签包括：

- `topic`
- `consumer_group`
- `event_type`
- `result`
- `retryable`

如果你想把指标、标签基数和 exporter 主线单独理顺，继续看：

- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)

## tracing 字段要能把消息从 producer 串到 consumer

在消息系统里，只记录“消费失败了”基本不够。

更值得保留的字段通常包括：

- `event_id`
- `event_type`
- `aggregate_id`
- `topic`
- `partition`
- `offset`
- `attempt`
- `trace_id`

这样在排障时你才能回答：

- 这条消息是谁发的
- 发出来多久后才被消费
- 为什么被重试了 5 次
- 是哪类消息在反复进死信

如果你想把 span、event 和结构化字段单独理顺，继续看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)

## 测试要分生产侧、消费侧和契约演进

消息系统测试如果只留集成环境验证，反馈会非常慢。

一个更稳的拆法通常是：

### 1. producer 测试

验证：

- 是否生成正确 envelope
- event_type / version / key 是否正确
- 序列化是否符合契约

### 2. consumer 纯逻辑测试

验证：

- 重复消息是否被安全跳过
- retryable / permanent 分类是否正确
- 状态推进是否只发生一次

### 3. broker 集成测试

验证：

- 真正 topic / queue 配置
- ack / nack / offset 行为
- 序列化兼容性

### 4. 兼容性测试

验证：

- 新版本 consumer 是否还能读旧事件
- 新增字段是否不破坏旧逻辑

如果你想把 fake、stub、mock 和边界隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 一个很实用的工程拆法

如果项目已经明显进入事件驱动阶段，比较稳的组织通常是：

```text
src/
├── application/
│   └── services/
├── domain/
├── events/
│   ├── envelope.rs
│   ├── order_paid.rs
│   └── publisher.rs
├── consumers/
│   ├── order_projection_consumer.rs
│   └── email_job_consumer.rs
├── infra/
│   ├── broker/
│   ├── outbox/
│   └── dedupe_store/
└── workers/
    └── run_consumers.rs
```

重点不是目录名字，而是：

- 事件契约独立
- producer / consumer 边界独立
- broker 适配层独立

不要把：

- 事件定义
- broker SDK
- 业务处理
- ack / retry 策略

全塞在同一个 handler 或 worker 文件里。

## 常见误区

### 误区 1：把 Outbox 当成消息系统的全部

Outbox 只解决生产侧一致性，不解决消费方幂等、重试和死信。

### 误区 2：默认所有错误都无限重试

这通常只会把坏消息放大成事故。

### 误区 3：消息体直接复用内部领域对象

这会让内部结构变化直接破坏下游兼容性。

### 误区 4：要求全局严格顺序

很多时候真正需要的是同一业务键局部有序。

### 误区 5：consumer 处理成功了再慢慢补去重

重复投递场景下，这很容易造成副作用已经发生，但去重状态没跟上。

## 推荐回查入口

- 后台任务主线：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 幂等与 Outbox：[Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- DTO 与事件契约：[Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- 外部回调入口：[Rust Webhook、回调与签名校验实践](./webhook-and-callback-practice.md)
- 审计记录边界：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- 序列化边界：[Serde 与数据序列化实践](./serde-and-data-serialization.md)
- 观测与日志：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 指标闭环：[Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)
- 测试隔离：[Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 推荐资料

- [Tokio Topics: Channels](https://tokio.rs/tokio/tutorial/channels)
- [Serde Attributes](https://serde.rs/attributes.html)

## 自检

你至少应该能回答：

1. command、job、event 三种消息语义分别更适合什么场景？
2. 为什么大多数跨系统业务最终都要按 at-least-once 设计？
3. Outbox 真正解决了什么，又没有解决什么？
4. 为什么消息 envelope 里最好显式带 `event_id`、`event_version` 和 `aggregate_id`？
5. 为什么 consumer 的重试策略必须先分 retryable 和 permanent？
6. 为什么顺序性通常只能围绕业务 key 局部保证？

这些问题理顺后，Rust 服务里的消息系统才会从“能收发消息”进入“能稳定演进、能抗重复、能定位问题”的状态。
