---
title: Tracing 与可观测性实践
description: 基于 tracing 官方主线整理 Rust 服务的可观测性实践，覆盖 event、span、instrument、subscriber、EnvFilter 与服务观测边界。
---

# Tracing 与可观测性实践

> 本页参考 `tracing` 官方 README 与 `tracing-subscriber` 常见用法整理，重点放在 Rust 服务里如何把“日志”升级成“结构化观测”。

很多语言里，日志只是字符串输出；在 Rust 服务里，如果你已经在写 `axum`、`tokio`、`sqlx` 这类异步系统，单纯的字符串日志很快就不够用。

`tracing` 解决的核心问题是：

- 不只是记录“发生了什么”
- 还要记录“发生在谁的上下文里”
- 并把请求链路、任务边界、字段和值一起带出来

## 先分清 event 和 span

这两个概念是 `tracing` 的核心。

### event

event 更像“某一时刻发生了一件事”。

例如：

- 请求开始
- 数据库查询失败
- 重试发生
- 某个用户登录成功

### span

span 更像“一段有开始和结束边界的上下文”。

例如：

- 一个 HTTP 请求
- 一个业务操作
- 一个批处理任务
- 一次数据库事务

所以可以简单记成：

- event：点
- span：线段/上下文范围

## 为什么 span 在服务里特别重要

因为服务问题很少只是“某条日志发生了”，而通常是：

- 某个请求经历了哪些步骤
- 某个任务卡在了哪里
- 某条数据库操作是哪个业务请求触发的

span 让这些上下文能被串起来。

## 最小 subscriber 初始化

官方和生态里最常见的启动方式之一是：

```rust
use tracing_subscriber::EnvFilter;

fn init_tracing() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();
}
```

它的意义很明确：

- 输出格式化日志
- 允许通过环境变量动态调日志级别

## `EnvFilter` 很重要

官方主线里强调可以用环境变量做动态过滤，例如：

```bash
RUST_LOG=info
RUST_LOG=my_app=debug,my_app::db=trace
```

这点非常适合服务场景，因为它允许你：

- 平时保持较低日志量
- 排障时只放大某些模块
- 不用重新改代码和发版就调整观测粒度

## `#[instrument]` 是最值得先学的入口

官方最推荐的新手入口之一就是 `#[instrument]`。

它会在函数调用时自动创建并进入一个 span，并把参数记录成字段。

```rust
use tracing::instrument;

#[instrument]
fn calculate_total(items: usize, price_per_item: f64) -> f64 {
    items as f64 * price_per_item
}
```

在服务代码里，这非常适合：

- handler 外层业务函数
- service 层用例
- repository 层关键操作

## 不是什么参数都该记录

官方示例也强调了可以用 `skip(...)` 避免敏感或巨大参数被自动记录。

```rust
use tracing::instrument;

#[instrument(skip(password))]
fn authenticate_user(username: &str, password: &str) -> bool {
    password == "secret"
}
```

工程里这点必须重视。不要因为图方便，把下面这些数据直接记录进去：

- 密码
- token
- 敏感证件号
- 大体积请求体

## 结构化字段比纯字符串更重要

官方示例里一个关键风格是：

- 字段和值分开记录
- 消息只是附加语义

例如：

```rust
use tracing::{info, error};

let user_id = 42;
info!(user_id, action = "login", "user action recorded");

let err = "connection refused";
error!(%err, "db request failed");
```

这类写法的价值是：

- 机器更容易检索和聚合
- 人也更容易按字段看上下文

## `?` 和 `%` 的区别要会用

在 `tracing` 里常见两种字段格式：

- `?value`：用 `Debug`
- `%value`：用 `Display`

经验上：

- 调试复杂结构体时常用 `?`
- 错误消息或字符串展示常用 `%`

## 哪些位置最值得加 tracing

### 1. 请求入口

例如 HTTP handler、消息消费入口、定时任务入口。

### 2. 关键业务用例

例如：

- 下单
- 支付
- 发送通知
- 批处理

### 3. 外部依赖调用边界

例如：

- 数据库
- Redis
- HTTP client
- MQ

外部 HTTP 调用怎样组织 timeout、重试、认证和 tracing 字段，继续看：

- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

Redis keyspace、命中率、回源和缓存字段该怎么观测，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

消息消费入口、`event_id`、`aggregate_id`、重试次数和死信排障字段该怎么组织，继续看：

- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

### 4. 重试、超时、降级、失败路径

因为排障时最重要的往往不是成功链路，而是失败和异常路径。

## 不要把 tracing 写成“更花哨的 println”

这是最常见误区之一。

如果你只写：

```rust
info!("starting request");
info!("finished request");
```

但没有：

- request id
- user id
- path
- latency
- error kind

那它的诊断价值仍然很有限。

## HTTP 服务里要和中间件观测配合

如果你已经在 `axum` 里用了 `tower-http::trace::TraceLayer`，那通常会有请求层观测。

但这不等于业务层就不用记录。

比较稳的分工是：

- 中间件层：统一记录 HTTP 请求基础信息
- 业务层：记录领域动作和关键字段
- 基础设施层：记录数据库、外部调用、错误边界

## subscriber 初始化要尽早、统一

一个很实用的原则是：

- 在 `main` 启动最早阶段初始化 tracing
- 整个进程只走一条统一初始化路径

不要在多个模块各自乱 init，否则很容易出现行为不一致。

## 可观测性不只是日志

虽然本页聚焦 `tracing`，但服务观测通常至少还包括：

- metrics
- tracing / spans
- logs

工程上更好的目标是让这三者能相互对照，而不是各自孤立。

如果你想把 counter、gauge、histogram、OTLP exporter、标签基数和 metrics / trace 协同单独理顺，继续看：

- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)

## tracing 不能直接替代审计日志

`tracing` 很适合回答：

- 某个请求卡在哪
- 某个 worker 为什么失败
- 某次数据库调用花了多久

但审计更关注：

- 谁操作了哪个资源
- 属于哪个租户
- 操作结果是什么
- 事后怎样稳定查询和导出

所以更稳的关系通常是：

- tracing 负责运行时诊断
- audit 负责操作追溯

它们可以通过 `request_id`、`trace_id` 关联，但不要把 tracing event 直接当成审计系统本身。

如果你想把 actor、tenant、resource、request id、脱敏和异步审计落库边界单独理顺，继续看：

- [Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)

## 常见误区

### 误区 1：什么都打日志，结果什么都看不见

日志量过大时，真正有价值的信息会被淹没。

### 误区 2：只有错误才打日志

如果没有关键路径上的正常事件和上下文，很多错误日志也无法定位根因。

### 误区 3：把敏感字段直接记进去

这会直接把观测系统变成数据泄漏面。

### 误区 4：只在 HTTP 层加 tracing

那你仍然看不到业务层和依赖层发生了什么。

## 自检

你至少应该能回答：

1. `event` 和 `span` 分别在表达什么？
2. 为什么 `#[instrument]` 很适合作为 Rust 服务 tracing 的起点？
3. `EnvFilter` 在服务排障里为什么很有价值？
4. 为什么结构化字段比纯字符串消息更重要？
5. tracing 和中间件请求日志为什么不能互相替代？

这些问题理顺后，Rust 服务的日志体系才会开始变成真正的可观测体系。
