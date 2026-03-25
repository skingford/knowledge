---
title: Rust 批处理、回填与历史数据修复实践
description: 从分批扫描、checkpoint、限速、幂等、dry-run 到补跑、重放和历史数据修复，整理 Rust 服务里的批处理工程主线。
search: false
---

# Rust 批处理、回填与历史数据修复实践

很多 Rust 服务真正开始变复杂，不是从第一个 HTTP handler 开始，而是从第一次做这些事开始：

- 给老数据补一个新字段
- 扫全表重算统计值
- 把数据库数据重新投影到缓存、搜索或对象存储
- 修历史脏数据
- 重放失败事件或补跑漏掉的任务

这些事情表面看起来都像“写个脚本跑一下”，但真实线上里通常会马上碰到：

- 扫描太猛把数据库打抖
- 任务跑一半中断，不知道从哪里继续
- 一批失败后没法安全重跑
- 新旧代码混跑时，修复逻辑把线上数据写乱
- 没有 dry-run、审计和进度观测，结果谁也不敢点执行

这页补的就是 Rust 服务里批处理、回填与历史数据修复的工程主线。

## 先分清：批处理、回填、重放、历史修复不是一回事

虽然它们都长得像“离线跑一堆数据”，但目标不同。

### 1. 批处理

更像：

- 周期重算报表
- 扫描大结果集生成文件
- 定时汇总统计

重点是：

- 吞吐
- 成本控制
- 调度与执行拆分

### 2. 回填

更像：

- 给历史数据补新列
- 把旧结构映射到新结构
- 把数据库主数据补投影到缓存或搜索索引

重点是：

- 与线上新写入共存
- 可中断、可续跑
- 新旧版本兼容

### 3. 重放 / replay

更像：

- 重新消费死信消息
- 重放一段时间内的事件
- 对漏掉的下游副作用做补发

重点是：

- 幂等
- 顺序与版本
- 是否允许副作用再次发生

### 4. 历史数据修复

更像：

- 修状态机卡死的数据
- 修错误 tenant 归属
- 修一批被错误规则污染的字段

重点是：

- 修复条件精确
- 变更范围可核对
- 支持 dry-run 和审计回查

## 这类任务更像“服务能力”，不是一次性脚本

很多事故都来自把批处理任务当成：

- 一段临时 SQL
- 一次性 shell 脚本
- 本地手工跑的 ad-hoc 工具

更稳的思路通常是把它做成受控能力：

- 有明确输入
- 有执行记录
- 有 checkpoint
- 有失败重试
- 有 dry-run
- 有审计和观测

不是说所有批处理都必须做成复杂平台，而是至少别让关键批处理停留在：

- 只有写作者自己看得懂
- 中断后无法续跑
- 执行后没有可回查记录

## 先选模型：扫描型、事件型、任务表型

批处理主流上通常有 3 类模型。

### 1. 扫描型

例如：

- 按主键范围扫全表
- 按时间窗口扫变更数据
- 按 `updated_at` 增量扫

适合：

- 数据库里已经有完整事实源
- 可以接受批量遍历
- 不依赖历史事件日志

### 2. 事件型

例如：

- 重放 MQ 事件
- 按 Outbox 重新投影
- 从 CDC / append-only log 回放

适合：

- 已经有稳定事件流
- 需要按变更顺序恢复下游投影
- 想复用在线增量同步逻辑

### 3. 任务表型

例如：

- 先把待处理资源写进任务表
- worker 按状态抓取并执行
- 每个任务有状态、重试次数和最后错误

适合：

- 需要精确回查每条执行结果
- 需要人工重跑失败项
- 任务可以离散成许多独立 work item

一个务实原则通常是：

- 全量历史回填优先扫描型
- 增量投影与重放优先事件型
- 需要精细治理和人工介入时优先任务表型

## 分批扫描不要只想“批大小”，要一起想扫描轴

最常见错误是只写一个：

```text
LIMIT 1000 OFFSET N
```

然后觉得这就算分批了。

真实系统里更稳的做法通常是按稳定扫描轴分批：

- 主键范围
- 时间窗口
- 租户分片
- hash 分桶

例如主键范围扫描通常比深 offset 更稳，因为它更容易：

- 续跑
- 并行切片
- 减少扫描放大

最小思路通常是：

1. 固定一个扫描轴
2. 每批只处理有限区间
3. 每批提交自己的结果
4. 单独记录该区间是否完成

如果你想把列表分页、cursor 和深分页成本单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

## checkpoint 必须显式设计，不要靠“记得上次跑到哪”

批处理一旦会中断，就必须回答：

- 现在跑到哪里了
- 哪一批成功了
- 哪一批失败了
- 哪些批可以安全重跑

checkpoint 常见做法通常有：

- 记录最后成功主键
- 记录时间窗口起止
- 记录分片 + offset
- 为每个任务项单独落状态

一个够用的 checkpoint 结构通常至少包括：

```rust
#[derive(Debug, Clone)]
pub struct BatchCheckpoint {
    pub job_name: String,
    pub shard_key: String,
    pub cursor: String,
    pub processed_count: u64,
    pub failed_count: u64,
    pub last_error: Option<String>,
}
```

这里重点不是结构体长什么样，而是：

- checkpoint 要能支持续跑
- checkpoint 要能支持核对进度
- checkpoint 不应该只存在进程内内存

## dry-run 和 apply 必须分开

历史修复类任务最危险的地方，不是“修得慢”，而是“修错了”。

所以更稳的模式通常是：

1. `dry-run` 先算出将被影响的数据集合
2. 输出样本、数量和变更摘要
3. 人工确认后再执行 apply

如果一上来就直接做：

- 扫描
- 更新
- 提交

那往往等你发现条件写错时，已经来不及了。

对历史修复尤其值得有：

- 命中总数
- 样本预览
- 变更前后摘要
- 按租户 / 按分片执行范围

如果你想把审计留痕和操作回查单独理顺，继续看：

- [Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)

## 幂等不是可选项，特别是回填和重放

批处理很容易因为这些情况重复执行：

- 进程崩溃后重启
- 网络抖动导致提交结果不明确
- 某一批失败后人工重跑
- 调度层误触发两次

所以更稳的执行语义通常是：

- 同一数据多处理一次也不会放大副作用
- 同一批次多执行一次结果一致
- 写入侧有条件更新或版本保护

例如回填 `normalized_email` 时，比起“盲写覆盖”，通常更稳的是：

- 只更新仍为空或版本较旧的数据
- 带 `updated_at` / version 条件
- 先比对再更新

如果你想把条件更新和幂等边界单独理顺，继续看：

- [Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)
- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 限速、并发和错峰决定你是不是在“边修边打生产”

批处理最常见的线上风险之一，不是逻辑错误，而是资源打爆。

至少要一起想这些问题：

- 每批多大
- 并发 worker 几个
- 批间是否 sleep / 限速
- 是否避开业务高峰
- 是否按租户或按分片错峰

更稳的原则通常是：

- 先保守，再逐步放大
- 每批单独提交，避免大事务
- 对数据库、Redis、搜索引擎、对象存储分别看承压能力

如果你需要把限流、超时和过载保护单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## 调度层和执行层最好分开

很多批处理都不该由 scheduler 直接跑重活。

更稳的拆法通常是：

- 调度层：决定何时触发、是否补跑、生成哪批任务
- 执行层：真正扫描、计算、写库、写缓存、发消息

例如这些都很适合这样拆：

- 搜索索引回填
- 导出生成
- 缓存预热
- 历史文件清理
- 脏数据修复

这样可以让：

- scheduler 保持轻量
- worker 可以独立扩缩容
- 失败重试和人工重跑更可控

如果你想把调度和 worker 边界单独理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- [Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)

## 回填要和线上新写入共存，不是“停机后一次跑完”

真实系统里很少有机会停机后慢慢修。

所以回填类任务通常要显式设计：

- 新写入路径是否同时写新结构
- 回填期间旧读路径是否仍可工作
- 回填完成前是否双读 / 双写
- 回填失败是否影响正常请求

更务实的主线通常是：

1. 新代码先兼容新旧结构
2. 新写入先写新结构
3. 后台慢慢回填历史数据
4. 验证完成后再删旧逻辑

如果你想把 schema 演进和兼容发布单独理顺，继续看：

- [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)

## 历史修复要先定义“真相源”

很多修复任务会遇到一个根问题：

- 到底以数据库为准
- 还是以事件流为准
- 还是以搜索索引 / 缓存 / 外部系统为准

如果真相源没定义清楚，最后就会变成：

- 从错误投影再反向修正主数据

这通常会让错误继续扩散。

务实原则通常是：

- 主数据修复先围绕事实源
- 缓存、搜索、导出文件这类派生数据优先重建，不优先手改
- 外部副作用优先做补偿而不是直接“假设成功”

如果你想把搜索投影和重建单独理顺，继续看：

- [Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)

## 多租户批处理不要做成“全局扫完再说”

多租户系统里，批处理更要显式带租户维度。

至少值得显式考虑：

- 是否按 tenant 分片
- checkpoint 是否带 tenant 维度
- 是否允许单租户单独重跑
- 失败是否只影响某个 tenant

更稳的模式通常是：

- 任务参数显式带 tenant scope
- 每个 tenant 的进度和错误可独立查看
- 不同租户可独立暂停、重跑或限速

如果你想把租户隔离边界单独理顺，继续看：

- [Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)

## 批处理常常不是“写库”而是“投影到别的系统”

很多任务真正做的不是改主表，而是：

- 回填 Redis
- 重建搜索索引
- 重新生成导出文件
- 归档旧对象到冷存储

所以工程上不要只盯数据库。

更稳的原则通常是：

- 把目标系统当成明确依赖
- 每个目标系统分别设 timeout、重试和失败策略
- 失败批次可重跑，不要求“一次全成”

例如两级缓存回填通常更适合：

1. 扫描事实源
2. 分批写 Redis
3. 再回填本地缓存

而不是在一次热路径请求里顺手扫全量。

如果你想把缓存预热和回填单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

如果你想把导出生成和对象存储交付单独理顺，继续看：

- [Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)

## 观测要先回答 4 个问题

一个批处理系统至少要能回答：

1. 今天有没有跑
2. 跑到哪里了
3. 哪一批失败了
4. 重跑会不会出事

至少值得有这些指标：

- `batch_job_started_total`
- `batch_job_completed_total`
- `batch_job_failed_total`
- `batch_item_processed_total`
- `batch_item_failed_total`
- `batch_job_duration_seconds`
- `batch_checkpoint_lag`

日志和 trace 里更值得记录：

- `job_name`
- `job_run_id`
- `shard_key`
- `tenant_id`（如果适用）
- `batch_size`
- `attempt`
- `dry_run`

如果你想把 tracing 和 metrics 单独理顺，继续看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)

## 测试至少要覆盖 5 类

### 1. 扫描边界测试

验证：

- 是否会漏数据
- 是否会重复扫数据
- checkpoint 续跑是否正确

### 2. 幂等测试

验证：

- 同一批重复执行不会放大副作用
- 中途失败后重跑不会写乱

### 3. dry-run 测试

验证：

- dry-run 只出计划、不做真实写入
- apply 和 dry-run 命中集合一致

### 4. 资源保护测试

验证：

- batch size 上限是否生效
- 并发数和限速是否可配置
- 超时和取消是否能及时生效

### 5. 回归与修复测试

验证：

- 已知坏样本能被修好
- 正常样本不会被误伤

如果你想把 fake、stub、本地依赖和异步测试隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 一个够用的工程拆法

```text
src/
├── batch/
│   ├── jobs/
│   │   ├── reindex_users.rs
│   │   ├── backfill_normalized_email.rs
│   │   └── repair_order_status.rs
│   ├── checkpoint.rs
│   ├── scanner.rs
│   ├── executor.rs
│   ├── dry_run.rs
│   └── metrics.rs
├── workers/
│   └── run_batch_jobs.rs
└── application/
    └── batch_service.rs
```

重点不是目录名字，而是：

- 扫描、执行、checkpoint、dry-run 分开
- job 定义和调度入口分开
- 事实源修复和派生数据重建分开

## 常见误区

### 误区 1：把批处理理解成“一条 SQL 跑完”

真实问题往往不在 SQL 能不能写，而在能不能控流、续跑、回查。

### 误区 2：中断后直接从头重跑

数据量一大，这通常意味着更高成本和更高重复副作用风险。

### 误区 3：没有 dry-run 就直接修历史数据

一旦条件写错，事故范围通常比线上请求 bug 更大。

### 误区 4：scheduler 直接跑重活，不拆调度层和执行层

最后补跑、重试、关闭和观测会全部耦在一起。

### 误区 5：回填期间只看数据库，不看缓存、搜索和对象存储

很多“修好了主表却还是读到旧数据”的问题，本质上都在派生系统没一起处理。

### 误区 6：批处理默认全局扫，不带 tenant、分片和范围参数

这会让治理、重跑和问题隔离都非常痛苦。

## 推荐回查入口

- 后台任务主线：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 调度与选主：[Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- Schema 演进与回填：[Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
- 搜索索引回填：[Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)
- 删除窗口与延迟 purge：[Rust 软删除、恢复与删除语义实践](./soft-delete-restore-and-deletion-semantics-practice.md)
- 导出与报表边界：[Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- 归档与冷热分层：[Rust 数据归档、保留策略与冷热分层实践](./data-archiving-retention-and-hot-cold-tiering-practice.md)
- 缓存预热与回填：[Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- 事务与并发写路径：[Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)
- 幂等与状态推进：[Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- 多租户隔离：[Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)
- 审计记录边界：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- tracing 与指标：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 测试隔离：[Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 自检

你至少应该能回答：

1. 批处理、回填、重放和历史数据修复为什么不能混成一个概念？
2. 为什么稳定扫描通常优先考虑主键范围、时间窗口或分片，而不是深 offset？
3. 为什么 checkpoint、dry-run 和幂等是批处理的基础设施，不是可选增强？
4. 为什么回填任务必须和线上新写入共存，而不是默认停机一次跑完？
5. 为什么缓存、搜索、导出文件这类派生数据通常更适合重建，而不是直接手改？
6. 为什么多租户批处理最好支持按 tenant 独立执行、限速和重跑？

这些问题理顺后，Rust 服务里的批处理链路才会从“写个脚本先跑一下”进入“能控流、能续跑、能修复、能长期治理”的状态。
