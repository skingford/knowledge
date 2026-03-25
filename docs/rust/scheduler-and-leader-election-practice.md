---
title: Rust 定时任务、调度与 Leader Election 实践
description: 从 interval、cron、补跑策略、单实例执行到租约选主、关闭交接和观测测试，整理 Rust 服务里的定时调度主线。
search: false
---

# Rust 定时任务、调度与 Leader Election 实践

很多 Rust 服务到了真实业务阶段，很快都会遇到这些问题：

- 每 5 分钟刷一次本地配置
- 每天凌晨跑一次对账或清理
- 每小时补一次报表或索引
- 多副本部署后，到底谁来跑这类任务
- 实例重启、滚动发布、网络抖动后，会不会重复跑、漏跑或并发跑

这些问题说明：

**定时任务不是一个 `tokio::time::interval()`，而是一套调度和执行治理边界。**

这页补的就是 Rust 服务里的定时任务、调度与 Leader Election 主线。

## 先分清：interval、cron、延迟任务、队列消费、Leader Election 不是一回事

很多项目最容易混掉的，是下面这几类东西：

### interval / 周期轮询

例如：

- 每 30 秒刷新一次本地只读配置
- 每 1 分钟扫描一次过期 key

它更像：

- 固定周期触发

### cron / 日历型调度

例如：

- 每天 02:00 跑一次账单汇总
- 每周一 08:30 生成周报

它更像：

- 基于日历时间点触发

### 延迟任务

例如：

- 订单 30 分钟未支付则自动关闭
- 5 分钟后重试回调

它更像：

- 某条业务记录在特定未来时刻执行

### 队列消费

例如：

- MQ consumer
- 数据库任务表 worker

它更像：

- 被动拿任务执行

### Leader Election

例如：

- 多副本里只允许一个实例跑全局定时清理
- 周期 job 需要单实例执行

它解决的是：

- 多实例之间“谁有资格跑”

一个务实原则通常是：

- interval / cron 解决“什么时候触发”
- 队列 / 任务表解决“任务怎么执行和持久化”
- leader election 解决“多实例里谁来调度”

如果你想把后台任务、MQ 和独立 worker 主线单独理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

## 不是所有定时任务都需要 Leader Election

很多团队一想到多副本，就立刻想上选主。

但更稳的第一步通常是：

- 先判断这个任务到底能不能多实例都跑

下面这些场景通常不一定需要选主：

- 每个实例各自刷新自己的本地缓存
- 每个实例各自上报自身心跳
- 任务天然按分片或按租户隔离
- 重复执行成本很低，而且结果幂等

更需要单实例执行的，通常是这些场景：

- 全局清理任务
- 全局账单 / 报表汇总
- 全局索引回填
- 扫全表找超时任务
- 定期补偿某类全局副作用

一个很实用的判断标准通常是：

- 如果任务作用范围是“整个系统的一份全局状态”，先考虑 singleton
- 如果任务作用范围是“每实例私有状态”，往往不必选主

## 先选调度语义：fixed delay、fixed rate、cron、补跑还是跳过

调度系统最容易被忽略的问题不是“怎么触发”，而是：

- 错过了怎么办

比较常见的语义通常有这些：

### fixed delay

特点通常是：

- 上一次执行结束后，再等一段时间触发下一次

适合：

- 希望任务不要重叠
- 每次执行时长波动明显

### fixed rate / interval

特点通常是：

- 按固定周期推进

适合：

- 频率要求稳定
- 任务本身比较轻

### cron / 日历时间

特点通常是：

- 关心“每天几点”而不是“间隔多久”

适合：

- 日报、周报、日切、归档

### misfire / catch-up / skip

必须提前回答：

- 服务停机 2 小时后，错过的 12 个周期要不要补跑

更常见的策略通常是：

- `skip`: 只跑当前这次
- `catch_up`: 把错过的窗口逐个补跑
- `coalesce`: 把错过的多次合并成一次

不同任务答案不一样：

- 刷缓存更适合 `skip`
- 财务对账、账期汇总更可能需要 `catch_up`
- 派生统计有时适合 `coalesce`

不要把这件事留到线上出事故时再临场决定。

## 时间边界要先定：优先 UTC，不要让 DST 和本地时区偷偷进来

一旦进入 cron 或按自然日结算，就要先想清：

- 调度时间按哪个时区算
- 夏令时切换怎么办
- 补跑窗口按自然日、小时还是绝对时间区间算

更稳的做法通常是：

- 统一用 UTC 存储和比较时间
- 只有在“业务定义自然日”的地方才显式换时区
- 调度系统明确输出本次处理的时间窗口

例如：

- `window_start`
- `window_end`
- `scheduled_for`

而不是只知道：

- “大概凌晨跑过一次”

## 调度器更适合“发任务”，不要在选主 loop 里直接跑重活

很多系统最危险的写法通常是：

- 选主成功
- 然后在 leader loop 里直接跑一个 30 分钟的大任务

这样会很容易把：

- 选主续租
- 关闭交接
- 重试和补偿

全部耦死。

更稳的做法通常是：

1. scheduler 只负责判断“该不该触发”
2. 触发后把任务写进任务表、队列或 worker channel
3. 真正执行由下游 worker 完成

也就是说：

- scheduler 决定“何时发单”
- worker 决定“如何执行”

如果一个任务需要：

- 跨重启保留
- 失败后重试
- 跨实例接力

那更不应该只靠内存里的 scheduler loop。

## 单实例执行不要靠内存 bool，要靠可过期的租约

多副本下最常见的错误通常是：

- `if is_leader { ... }`

但这个 `is_leader` 只是内存状态，不是协调机制。

更稳的 singleton 执行通常需要：

- 可抢占或可过期的 lease
- 显式的 owner
- 显式的 `lease_until`

常见实现通常有这些：

### 数据库租约

适合：

- 已经强依赖数据库
- job 数量不大
- 想把调度状态和业务状态放一起管理

常见做法：

- 一张 `scheduler_leases` 表
- 条件更新 `lease_until`
- 持有者定期续租

### Redis 租约

适合：

- Redis 已经是可靠基础设施之一
- 需要较轻量的快速选主

但要明确：

- token 校验
- 续租
- 过期后的并发切换

### Kubernetes Lease

适合：

- 服务明确跑在 K8s
- 想把 leader 协调交给集群控制面对象

一个务实原则通常是：

- 先选你已经可靠依赖的协调介质
- 再围绕它补续租、过期、交接和观测

## 任务身份要显式建模：job key、schedule slot、run id、attempt

定时任务真正可靠的关键，往往不是“有没有触发”，而是：

- 这次触发到底代表哪个时间窗口

一个够用的调度触发模型通常至少值得带：

```rust
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct ScheduledTrigger {
    pub trigger_id: Uuid,
    pub job_key: String,
    pub scheduled_for: DateTime<Utc>,
    pub window_start: DateTime<Utc>,
    pub window_end: DateTime<Utc>,
    pub attempt: u32,
}
```

这些字段在解决几件事：

- `job_key`：是哪类任务
- `scheduled_for`：这次本来该什么时候跑
- `window_start/window_end`：到底处理哪段数据
- `attempt`：第几次尝试

这样你才能回答：

- 这是今天 02:00 那次任务
- 还是补跑昨天漏掉的窗口

如果任务是有副作用的，`job_key + scheduled_for` 往往就该进入幂等设计。

如果你想把幂等、条件更新和状态推进单独理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## Leader Election 失效时，最重要的是“不并发跑”和“能接力”

选主最常见的事故，不是完全没有 leader，而是：

- 短时间内出现两个 leader

所以更稳的系统通常会围绕两件事设计：

### 1. lease 过期后，新 leader 才能接手

不要只看：

- “我觉得自己还是 leader”

而要看：

- 当前租约是不是还有效

### 2. 真正执行时还要二次幂等

即使发生：

- 续租抖动
- 网络分区
- 双实例短暂重叠

也不应该把副作用直接放大。

也就是说：

- leader election 解决“尽量只有一个调度者”
- 幂等和条件更新解决“万一重叠时别出事”

这两层不能互相替代。

## 关闭和发布时，要先停调度，再让在途任务收尾

定时调度最容易在发布期出事故的地方是：

- 老实例还没完全退出
- 新实例已经起来抢任务

更稳的关闭顺序通常是：

1. 先停新的调度触发
2. 释放或停止续租 lease
3. 让已发出的任务继续收尾
4. 等 worker 和底层依赖退出

不要让发布变成：

- 旧实例最后一秒发出一批任务
- 新实例上线后又发一批同样的任务

如果你想把关闭协调和上线清单单独理顺，继续看：

- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)
- [Rust 服务部署与发布清单](./deployment-and-release-checklist.md)

## 缓存刷新、报表、导出、索引回填都要先选“调度层”还是“执行层”

很多看起来像“定时任务”的业务，其实最好分成两层：

- 调度层：决定何时触发、是否补跑、谁来发任务
- 执行层：真正读库、写缓存、发消息、生成文件

例如这些场景都很适合这样拆：

- 周期刷新热点缓存
- 每小时生成统计报表
- 定时归档历史文件
- 周期重建搜索索引

拆开之后的好处通常是：

- scheduler 可以保持轻
- 执行重试更容易持久化
- 观测和审计也更清楚

如果你想把缓存刷新、导出报表和文件后处理边界单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- [Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)

## 观测要能直接回答“今天这次任务到底跑了没有”

定时调度相关指标至少值得有：

- `job_trigger_total`
- `job_success_total`
- `job_failure_total`
- `job_schedule_lag_seconds`
- `job_duration_seconds`
- `leader_lease_renew_total`
- `leader_lease_lost_total`
- `job_misfire_total`

很值得带的日志 / trace 字段通常包括：

- `job_key`
- `scheduled_for`
- `window_start`
- `window_end`
- `attempt`
- `leader_owner`
- `trigger_source`

很多排障问题最终都要回答：

- 今天 02:00 那次到底有没有发
- 发了几次
- 是谁发的
- 补跑还是正常触发

如果这些字段都不在，后面基本只能靠猜。

## 测试要覆盖时钟、补跑、租约交接和关闭

定时任务最容易漏测的，不是：

- 业务逻辑本身对不对

而是：

- 调度边界在异常时会不会坏

至少建议补这些测试：

### 1. 时钟推进测试

验证：

- interval / cron 到点后是否触发
- 错过窗口后的 `skip / catch_up / coalesce` 是否符合设计

### 2. 单 leader 测试

验证：

- 两个实例竞争时，是否只有一个持有租约

### 3. lease 过期接力测试

验证：

- leader 崩溃或不再续租后，新实例能否接手

### 4. 幂等测试

验证：

- 同一 `job_key + scheduled_for` 重复触发时不会放大副作用

### 5. 关闭测试

验证：

- 调度循环能先停发新任务
- 在途任务还能收尾

如果你想把异步测试隔离和 fake / stub 工具单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 常见误区

### 误区 1：直接拿 `interval()` 当完整调度系统

它只能解决“周期到了”，解决不了多实例协同、补跑和持久化。

### 误区 2：所有定时任务都做成全局 singleton

很多本地缓存刷新或实例私有辅助任务根本没必要选主。

### 误区 3：leader election 做了，就以为副作用一定不会重复

网络抖动和续租竞争时，幂等仍然是最后防线。

### 误区 4：调度器直接跑重活，不做任务下发

最后调度、续租、重试和关闭全耦在一起。

### 误区 5：只记录“任务跑过”，不记录具体 schedule slot

一旦补跑或重复执行，马上就说不清到底是哪次任务。

### 误区 6：发布时只停 HTTP，不停 scheduler

这会把重复触发和双实例重叠带到上线窗口里。

## 推荐回查入口

- 后台任务主线：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 批处理与历史修复：[Rust 批处理、回填与历史数据修复实践](./batch-processing-backfill-and-historical-repair-practice.md)
- 消息和异步消费：[Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)
- 幂等与状态推进：[Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- 缓存后台刷新：[Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- 导出与报表边界：[Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- 归档与冷热分层：[Rust 数据归档、保留策略与冷热分层实践](./data-archiving-retention-and-hot-cold-tiering-practice.md)
- 搜索索引重建：[Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)
- 文件和后处理任务：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 生命周期与关闭：[服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)
- 上线与发布窗口：[Rust 服务部署与发布清单](./deployment-and-release-checklist.md)
- tracing 与指标：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 测试隔离：[Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 自检

你至少应该能回答：

1. 为什么 interval、cron、延迟任务、队列消费和 leader election 不能混成一个概念？
2. 哪些任务更适合多实例都跑，哪些任务更适合单实例 singleton 调度？
3. 为什么定时任务必须显式设计 `skip / catch_up / coalesce` 语义？
4. 为什么 leader election 不能替代幂等和条件更新？
5. 为什么 scheduler 更适合发任务，而不是直接在选主 loop 里跑重活？

这些问题理顺后，Rust 服务里的定时任务才会从“写个 interval 先跑起来”进入“能调度、能接力、能关闭、能长期治理”的状态。
