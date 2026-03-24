---
title: Rust 后台任务与 Worker 实践
description: 从进程内 task、定时任务到独立 worker 服务，整理队列、取消、重试、幂等、背压与观测这些后台执行边界。
---

# Rust 后台任务与 Worker 实践

很多 Rust 服务写到一定阶段，都会遇到一个明显拐点：

- 发邮件、发通知
- 同步外部系统
- 批量刷缓存或索引
- 定时清理数据
- 延迟关闭订单
- 消费 MQ / job queue

这些工作和 HTTP 请求生命周期并不一样。

如果继续把它们硬塞进 handler，常见结果就是：

- 请求超时和后台工作耦在一起
- `tokio::spawn` 到处都是，但没人知道谁负责收尾
- 重试、幂等、背压和失败补偿都不清楚
- 服务关闭时任务直接被截断

这页要补的，就是 Rust 后台执行主线。

## 先分清 3 种后台执行模型

### 1. 请求内并发子任务

典型场景：

- 一个请求里并发查多个下游
- 并发跑几个独立计算分支
- 聚合多个结果后再返回响应

这种任务仍然属于“请求生命周期的一部分”。

特点是：

- 结果直接影响当前响应
- 任务结束点和请求结束点一致
- 更适合 `join!`、`JoinSet` 或显式等待 `JoinHandle`

这不应该被理解成“真正的后台任务”。

### 2. 进程内后台 worker

典型场景：

- 周期刷新本地缓存
- 同进程内串行处理一批轻量任务
- 启动后常驻的定时同步
- 从内存队列中消费工作项

如果这些后台任务要把消息继续广播给长连接客户端，也可以继续看：

- [Rust WebSocket 与 SSE 实践](./websocket-and-sse-practice.md)

这种方式适合：

- 任务和当前服务强相关
- 允许进程重启后重新触发
- 不要求跨重启持久化
- 可以接受“单实例内排队”

如果这些后台任务的目标是周期刷新本地缓存、预热热点 key 或异步回填 Redis，缓存边界继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

如果你想把补跑策略、单实例执行、租约选主和分布式调度边界单独理顺，继续看：

- [Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)

### 3. 独立 worker 服务

典型场景：

- 任务执行时间明显长于 HTTP 请求
- 需要跨进程、跨实例扩缩容
- 需要失败重试、死信、审计和积压治理
- 需要服务重启后继续处理未完成任务

到了这一步，通常就不该再把任务只放在内存 `channel` 里了，而是应该上：

- 数据库任务表 / outbox
- Redis Stream / list
- Kafka / RabbitMQ / SQS 这类外部队列

一个很实用的判断标准是：

**如果任务需要跨进程重试、跨实例接力、跨重启保留，那它就已经不是简单的 `tokio::spawn` 问题了。**

## `tokio::spawn` 不是任务系统

很多 Rust 初学者一看到后台任务，就会下意识这么写：

```rust
tokio::spawn(async move {
    do_something().await;
});
```

这段代码本身没错，但它解决的只是“把 future 放到 runtime 上执行”，并没有自动解决这些问题：

- 谁负责保存 `JoinHandle`
- 出错后谁记录、谁重试
- 服务退出时谁通知它结束
- 任务积压时谁做背压
- 任务是否允许丢失
- 任务是否要求幂等

所以更稳的原则是：

- 请求内任务就明确等待结果
- 进程内后台任务就显式建队列、取消信号和等待机制
- 跨重启任务就上持久化队列或独立 worker

不要把“能 spawn”误当成“任务系统已经设计好了”。

## 什么时候还适合进程内 worker

下面这些情况，进程内 worker 通常是合理的：

- 刷新本地只读缓存
- 异步写埋点、批量刷缓冲
- 低价值、可重建的派生数据
- 和当前服务部署、扩容、关闭都强绑定的辅助任务

但前提通常是：

- 任务丢失成本可接受
- 可以通过重新扫描或再次触发恢复
- 不需要独立扩容
- 不需要跨实例严格去重

如果这些前提不成立，就别再坚持“放进服务里顺手跑一下”。

## 什么时候应该升级成独立 worker

出现下面这些信号时，单进程后台任务通常已经不够了：

1. 一个任务可能跑几十秒甚至几分钟。
2. 失败后必须重试，而且不能因为服务重启就丢。
3. 任务吞吐和 API 吞吐需要分开扩缩容。
4. 需要积压长度、消费延迟、死信数量这些运行指标。
5. 需要按业务键去重、限流或做幂等保护。

很多项目最开始都只是“先用内存队列顶一下”，但只要进入“可靠执行”范畴，就应该尽快补持久化队列。

## 队列设计先于 handler 设计

后台任务真正先要想清楚的，通常不是 handler 里那几行业务逻辑，而是队列边界。

### 1. 优先用有界队列

在单进程场景里，`tokio::sync::mpsc::channel(n)` 往往比 `unbounded_channel()` 更稳。

原因很直接：

- 有界队列能把背压显式暴露出来
- 上游能在积压时降级、拒绝或等待
- 你更容易看出系统真实吞吐上限

`unbounded_channel()` 更适合控制消息，不适合承接可能无限堆积的业务任务。

### 2. payload 要尽量用拥有所有权的最小数据

后台任务跨 `.await`、跨线程、甚至跨进程以后，更稳的 payload 往往是：

- 业务主键
- 幂等键
- 最小必要参数
- 明确的 attempt / trace 信息

而不是一整个巨大的可变结构体或一堆引用。

一个很实用的原则是：

- 同进程任务：传拥有所有权的最小业务数据
- 跨进程任务：传可序列化、可持久化、可重放的 DTO

如果 DTO、领域模型和存储模型的分层你还没完全理顺，可以继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- [Serde 与数据序列化实践](./serde-and-data-serialization.md)
- [Rust 后端项目骨架](./backend-project-skeleton.md)

### 3. 并发限制要显式建模

不要默认认为“开更多 task 就更快”。

更稳的做法通常是：

- 固定 worker 数量
- 或者用 `Semaphore` 控制并发度
- 再结合有界队列限制系统总在途量

这样才能避免：

- 瞬时把数据库连接池打满
- 把外部 API 打爆
- 把 CPU 密集工作全塞进 Tokio worker 线程

## 一个够用的进程内 worker 骨架

Tokio 官方 graceful shutdown 主线强调三件事：

1. 什么时候开始关闭
2. 如何通知各部分关闭
3. 如何等待它们真正结束

放到后台任务场景里，一个够用骨架通常就是：

- 一个有界队列
- 一个 `CancellationToken`
- 一个 `TaskTracker`

```rust
use anyhow::Result;
use tokio::{select, signal, sync::mpsc};
use tokio_util::{sync::CancellationToken, task::TaskTracker};

#[derive(Debug)]
struct Job {
    user_id: i64,
}

async fn handle_job(job: Job) -> Result<()> {
    tracing::info!(user_id = job.user_id, "job started");
    Ok(())
}

async fn worker_loop(mut rx: mpsc::Receiver<Job>, shutdown: CancellationToken) {
    loop {
        select! {
            _ = shutdown.cancelled() => break,
            maybe_job = rx.recv() => {
                let Some(job) = maybe_job else { break; };

                if let Err(err) = handle_job(job).await {
                    tracing::error!(error = ?err, "job failed");
                }
            }
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let shutdown = CancellationToken::new();
    let tracker = TaskTracker::new();
    let (tx, rx) = mpsc::channel(1024);

    tracker.spawn(worker_loop(rx, shutdown.child_token()));

    tx.send(Job { user_id: 42 }).await?;

    signal::ctrl_c().await?;

    drop(tx);
    shutdown.cancel();
    tracker.close();
    tracker.wait().await;

    Ok(())
}
```

这段骨架里最重要的不是 API 名字，而是几个边界：

- 任务入口是显式队列，不是到处散落的 `spawn`
- 关闭信号是统一广播，不是每个模块自己猜
- 收尾要 `wait` 到任务真正退出，而不是收到 Ctrl+C 就直接返回

如果你要做分层更复杂的关闭流程，也可以结合：

- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)

## `JoinSet`、`CancellationToken` 和 `TaskTracker` 怎么分工

这三个工具经常一起出现，但职责不一样。

### `JoinSet`

更适合：

- 一组生命周期明确的并发任务
- 你需要逐个收集结果或错误
- 任务集合由当前调用方直接拥有

例如：

- 一个批处理里并发跑 20 个任务
- 一个请求里 fan-out 多个下游调用

### `CancellationToken`

更适合：

- 广播“该停了”
- 把关闭信号传进多个 task
- 让任务自己在合适的 `.await` 边界收尾

如果你需要子任务跟随父任务关闭，但又不希望子任务反向取消父级，`child_token()` 很有用。

### `TaskTracker`

更适合：

- 要等待后台任务全部退出
- 任务会分散在多个模块里生成
- 不希望每个地方都自己保管 `JoinHandle`

Tokio 官方资料也明确把 `TaskTracker` 和 `CancellationToken` 作为 graceful shutdown 的常见组合。

一个经验判断是：

- 要收结果，用 `JoinSet`
- 要广播关闭，用 `CancellationToken`
- 要等待一组后台任务收尾，用 `TaskTracker`

## 重试不是补个 `loop` 就够了

后台任务最容易被低估的，是失败语义。

更稳的拆法通常是：

### 1. 先分临时错误和永久错误

例如：

- 网络抖动、下游 5xx、连接超时：更像临时错误
- 参数非法、数据缺失、业务约束不满足：更像永久错误

这两类错误不该共用同一套重试策略。

### 2. 重试必须配幂等

如果 handler 不幂等，重试次数越多，副作用越混乱。

常见做法包括：

- 用业务唯一键防重
- 用状态机限制重复推进
- 调外部 API 时带幂等键
- 先写本地状态，再做 outbox / queue 投递

如果你想把幂等键、状态机、条件更新和 Outbox 这条一致性主线单独理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

### 3. 退避策略要显式

通常至少要有：

- 最大重试次数
- 指数退避
- jitter
- 死信或人工介入出口

不要把失败任务永远原地打转。

## 阻塞和 CPU 密集工作不要直接塞进 async worker

Rust 后台任务还有一个高频误区：

- 文件压缩
- 大量 JSON 编解码
- 图像处理
- 调同步 SDK
- 跑外部命令

这些如果直接放在 Tokio worker 线程里，很容易把 runtime 卡住。

更稳的边界是：

- 短暂阻塞：`spawn_blocking`
- 长时间 CPU / 阻塞工作：独立线程池或独立 worker 进程
- 真正的重任务：和 API 服务分进程部署

如果你已经碰到 Tokio worker 被阻塞、任务取消不及时或延迟飙升，继续看：

- [Tokio 与 Async 工程实践](./tokio-and-async-practice.md)
- [Rust 性能分析与 Profiling 指南](./performance-and-profiling-guide.md)

## 观测要把“请求视角”切换成“任务视角”

后台任务如果仍然只打普通日志，排障会很困难。

至少建议补这些字段：

- `job_type`
- `job_id`
- `attempt`
- `queue_name`
- `scheduled_at`
- `started_at`
- `trace_id` / `request_id`

至少建议看这些指标：

- 入队速率
- 成功数 / 失败数
- 重试数
- 积压长度
- 最老任务延迟
- 单任务耗时

如果任务里还会调外部 API、数据库或别的服务，最好继续串上：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

## 测试要拆成 3 层

### 1. 业务 handler 单测

把真正的业务逻辑尽量收进：

- `handle_job`
- service
- repo / gateway trait

这样大多数测试都不需要 runtime 协调。

### 2. worker loop 集成测试

验证这些行为：

- 任务能被消费
- 失败会进入预期分支
- 关闭信号能让 loop 收尾
- 队列关闭后 worker 能退出

如果你要测定时和退避，Tokio 也提供了暂停和推进测试时间的能力。

如果你想把 fake、stub、本地 HTTP server 和 Tokio 异步测试这条隔离主线系统展开，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

### 3. 端到端可靠性测试

这层主要验证：

- 服务退出时有没有丢任务
- 重启后任务是否能恢复
- 重试和幂等是否真的成立
- 积压时系统是否会背压而不是直接打爆下游

## 常见误区

### 误区 1：把 detached `spawn` 当成后台任务方案

如果任务没有被统一跟踪，它大概率也不会被统一关闭、统一观测和统一补偿。

### 误区 2：业务任务默认用无界队列

无界队列通常只是把问题藏起来，不是解决吞吐问题。

### 误区 3：失败就无限重试

没有上限、没有退避、没有幂等的重试，只会把故障放大。

### 误区 4：所有 worker 都和 API 服务绑在一个进程里

只要任务特征和 API 生命周期明显不同，就该考虑拆分部署。

### 误区 5：优雅关闭只停 HTTP，不停后台任务

很多数据不一致和重复执行问题，就是在这里留下来的。

## 推荐回查入口

- Async 主线：[Tokio 与 Async 工程实践](./tokio-and-async-practice.md)
- 外部调用：[Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)
- 调度与选主：[Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- 消息系统边界：[Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)
- 文件后处理边界：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 导出与报表边界：[Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- 审计记录边界：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- 观测与日志：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 生命周期管理：[服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)
- 服务组织：[Rust 后端项目骨架](./backend-project-skeleton.md)
- 多入口工程：[Rust Workspace 与 Monorepo 实践](./workspace-and-monorepo-practice.md)

## 推荐资料

- [Tokio Graceful Shutdown](https://tokio.rs/tokio/topics/shutdown)
- [tokio-util `CancellationToken`](https://docs.rs/tokio-util/latest/tokio_util/sync/struct.CancellationToken.html)
- [tokio-util `TaskTracker`](https://docs.rs/tokio-util/latest/tokio_util/task/struct.TaskTracker.html)

## 自检

你至少应该能回答：

1. 请求内并发子任务和真正后台任务的边界是什么？
2. 为什么 `tokio::spawn` 不能直接等同于任务系统？
3. 什么信号说明内存队列已经该升级成独立 worker 或持久化队列？
4. 为什么后台任务的重试策略一定要和幂等一起设计？
5. 为什么优雅关闭必须覆盖任务生产端、worker 和底层依赖，而不只是 HTTP listener？

这些问题理顺后，Rust 后台任务才算从“能跑”进入“能稳定运行”。
