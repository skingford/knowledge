---
title: Rust 软删除、恢复与删除语义实践
description: 从 deleted_at 查询边界、恢复窗口、唯一约束到延迟物理删除，整理 Rust 服务里的删除生命周期主线。
search: false
---

# Rust 软删除、恢复与删除语义实践

很多 Rust 服务一开始把“删除”理解成下面两种之一：

- 直接 `DELETE FROM ...`
- 表里加个 `deleted_at`

但业务一复杂，真正难的通常不是“删掉这一行”，而是：

- 列表、搜索和导出默认要不要看到已删数据
- 管理后台能不能恢复
- 同一个邮箱、手机号、外部账号在软删除后能不能重新创建
- 删除后缓存、搜索索引、对象存储和审计记录要不要一起更新
- 删除 30 天后再物理清理时，恢复窗口和法律保留应该怎么处理

这页补的就是 Rust 服务里软删除、恢复与删除语义的工程主线。

## 先分清：软删除、归档、硬删除、恢复不是一回事

很多系统把这几个动作混成“删数据”，后面一定会乱。

### 1. 软删除

更像：

- 业务上不再默认可见
- 热路径查询默认过滤
- 数据还保留在主库或事实源里

重点是：

- 可见性切换
- 恢复可能性
- 下游一致性

### 2. 归档

更像：

- 热路径不再直接查
- 数据转到归档表、冷存储或独立查询路径
- 仍然可能保留恢复或异步导出能力

重点是：

- 访问语义切换
- 成本分层
- 生命周期延长

### 3. 硬删除

更像：

- 事实源里真正物理移除
- 不再支持业务恢复
- 只能依赖备份或灾难恢复手段

重点是：

- 生命周期终点
- 合规清理
- 不可逆

### 4. 恢复

更像：

- 把已软删除资源重新变成活跃资源
- 重新接回搜索、缓存、导出和对象引用

重点是：

- 状态回滚
- 唯一约束重校验
- 下游投影重建

一个务实原则通常是：

- 软删除不是归档
- 归档不是备份
- 恢复不是灾难恢复
- 硬删除不该伪装成软删除

如果你想把热冷分层、保留窗口和归档恢复单独理顺，继续看：

- [Rust 数据归档、保留策略与冷热分层实践](./data-archiving-retention-and-hot-cold-tiering-practice.md)

## 为什么只有 `deleted_at IS NULL` 还不够

`deleted_at` 很有用，但它只是删除语义里的一个字段，不是完整设计。

如果系统里只有：

- 查询时手写 `WHERE deleted_at IS NULL`

通常还缺这些问题的答案：

- 谁删的，为什么删
- 还能恢复多久
- 已删数据占用的唯一键什么时候释放
- 搜索索引和缓存什么时候同步失效
- 管理后台怎样显式查已删数据
- 延迟物理删除由谁执行、怎么补跑

所以更稳的理解通常是：

- `deleted_at` 负责表达一个状态事实
- 删除语义还需要查询边界、写路径条件、审计留痕、清理策略和下游一致性

## 删除状态最好显式建模，不要只靠散落字段猜语义

一个够用的模型通常至少要表达：

- 当前是否活跃
- 删除发生时间
- 删除 actor
- 删除原因
- 何时允许物理删除
- 是否被法律保留或人工冻结

例如：

```rust
use chrono::{DateTime, Utc};

#[derive(Debug, Clone)]
pub struct DeleteMeta {
    pub deleted_at: DateTime<Utc>,
    pub deleted_by: String,
    pub reason: String,
    pub purge_after: Option<DateTime<Utc>>,
    pub legal_hold: bool,
}

#[derive(Debug, Clone)]
pub enum DeletionState {
    Active,
    SoftDeleted(DeleteMeta),
}
```

真正重要的不是结构体名字，而是这些语义不要散成：

- 表里一个 `deleted_at`
- worker 里一个 `purge_before`
- 审计表里另一个 `action=remove`
- 搜索同步里再额外猜一次是否应该隐藏

如果业务更复杂，还可以显式拆成：

- `Active`
- `SoftDeleted`
- `ArchivedPendingPurge`

但无论怎么拆，状态定义都应该是系统共识，而不是每条链路自己推断。

## 查询边界最好分层，不要指望每个调用方手写过滤条件

软删除最常见的事故入口之一，是所有查询都靠调用方自己记得加：

- `deleted_at IS NULL`

这在规模一大后几乎一定会漏。

更稳的做法通常是把可见性做成显式参数：

```rust
#[derive(Debug, Clone, Copy)]
pub enum DeletedVisibility {
    ActiveOnly,
    IncludeDeleted,
    DeletedOnly,
}

#[derive(Debug, Clone)]
pub struct UserListQuery {
    pub tenant_id: String,
    pub keyword: Option<String>,
    pub visibility: DeletedVisibility,
}
```

然后把 repo 边界拆清楚：

### 1. 面向线上业务接口的默认查询

- 默认只看 `ActiveOnly`
- 不允许前台接口隐式带出已删数据

### 2. 面向管理后台的显式查询

- 由调用方明确选择 `IncludeDeleted` 或 `DeletedOnly`
- 响应里可以带删除时间、删除人、恢复入口

### 3. 面向恢复和物理清理的专用查询

- restore worker 只扫已删且可恢复的数据
- purge worker 只扫已到 `purge_after` 的数据

一个非常实用的判断是：

- 对用户开放的列表接口，默认不讨论已删数据
- 对运营和治理后台，显式讨论“是否含已删”
- 对系统任务，不走通用查询，走专用状态扫描

如果你想把列表过滤、排序、分页和查询对象分层单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

## 唯一约束必须提前设计，不然软删除会把“恢复”和“重建”一起搞乱

软删除最容易被低估的问题，不是查询，而是唯一键。

典型例子：

- 用户 `alice@example.com` 被软删除
- 又新建了一个同邮箱的新用户
- 这时旧用户还能不能恢复

如果这件事没有提前定义，系统后面一定会出现：

- 恢复失败但原因不清楚
- 新建成功但旧数据永远无法恢复
- 查询里同时出现两个看起来“逻辑上同一个人”的实体

如果数据库支持部分唯一索引，一个很常见的做法是：

```sql
CREATE UNIQUE INDEX uq_users_tenant_email_active
ON users (tenant_id, email)
WHERE deleted_at IS NULL;
```

这类设计表达的是：

- 活跃数据必须唯一
- 已软删除数据不再占用活跃唯一键

如果底层数据库不支持部分唯一索引，更稳的替代通常是：

- 维护一列只给活跃数据使用的 shadow key
- 或者在删除时显式释放唯一键占位

但不管用哪种实现，都要先定义恢复语义：

### 1. 恢复优先

- 删除后不允许新建同键资源

适合：

- 恢复比重建更重要

### 2. 重建优先

- 删除后允许新建
- 旧资源恢复时如遇唯一键冲突则拒绝恢复

适合：

- 用户重新注册、重新建档比恢复旧对象更符合产品语义

很多业务更适合第二种，但前提是错误语义要稳定，不能到 restore 时才第一次发现冲突。

如果你想把唯一索引演进和兼容发布单独理顺，继续看：

- [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)

## 删除、恢复和重建写路径要先讲清状态推进

删除语义如果没有写路径规则，最后一定会落成“谁先写进去算谁赢”。

更稳的主线通常是：

### 1. 软删除

步骤通常是：

1. 校验权限和当前状态
2. 用条件更新把活跃记录推进到已删状态
3. 写审计记录 / outbox
4. 触发搜索、缓存、对象引用等下游更新
5. 计算 `purge_after`

一个典型条件更新更像：

```sql
UPDATE users
SET deleted_at = now(),
    deleted_by = $1,
    delete_reason = $2,
    purge_after = now() + interval '30 days'
WHERE id = $3
  AND deleted_at IS NULL;
```

### 2. 恢复

步骤通常是：

1. 只读取已删记录
2. 校验恢复窗口、法律保留和当前唯一键冲突
3. 用条件更新恢复到活跃状态
4. 重建缓存和搜索投影
5. 记录恢复 actor 与原因

### 3. 物理删除

步骤通常是：

1. 扫描 `purge_after <= now()` 的记录
2. 再次确认没有法律保留、没有待恢复窗口
3. 处理附件、索引、缓存和引用清理
4. 真正硬删除事实源记录
5. 保留不可变审计痕迹

这里最关键的是：

- 删除不是单一 SQL
- 恢复不是简单把 `deleted_at = NULL`
- 物理删除更不该挂在用户请求同步路径里

如果删除和恢复会与并发重建、条件更新或唯一键冲突交织，继续看：

- [Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)
- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## 删除后的下游系统也要一起推进，不然“数据库删了”不等于“系统删了”

软删除一旦进入真实系统，最容易出事故的地方通常是派生系统。

至少要显式考虑下面 5 条线：

### 1. 搜索索引

更稳的做法通常是：

- 删除后移除索引文档，或者把文档显式标成已删且默认不可见
- 恢复后重新投影
- 重建索引时沿用同一套删除可见性规则

不要出现：

- 数据库已删
- 搜索还搜得到

如果你想把搜索同步和重建切换单独理顺，继续看：

- [Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)

### 2. 缓存

更稳的做法通常是：

- 删单条资源缓存
- 删列表缓存
- 恢复后重建热点缓存

不要只删：

- `user:{id}`

却忘了：

- `tenant:{tenant_id}:users:list:*`

### 3. 导出与报表

更稳的做法通常是：

- 默认导出只看活跃数据
- 管理后台导出显式区分“含已删”还是“仅已删”
- 对长时间运行的导出任务，冻结任务创建时的删除可见性语义

### 4. 审计与历史留痕

- 删除
- 恢复
- 到期物理删除

这三类动作通常都要独立留痕，不能互相替代。

### 5. 对象存储与附件

如果一条业务记录关联文件，更稳的做法通常是：

- 先切换元数据状态
- 再异步处理附件删除或归档

不要在用户请求里同步删大对象，否则恢复窗口会被直接抹掉。

如果你想把缓存、导出、附件和异步事件边界单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- [Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

## 延迟物理删除通常更适合批处理，不适合同步请求

很多系统会有这样的需求：

- 先允许用户撤回
- 保留 7 天、30 天或 180 天
- 到期后再真正删除

这类需求更像生命周期治理，不像普通 Web handler。

一个够用的主线通常是：

1. 删除时只打软删除标记并计算 `purge_after`
2. scheduler 定时触发 purge job
3. worker 分批扫描候选数据
4. 对每批数据做再校验、审计和清理
5. 失败可重试，成功可回查

如果删除前还要先归档，则顺序通常更像：

1. 软删除
2. 归档或转冷
3. 校验恢复路径
4. 到窗口后硬删除热副本

这比“用户点删除时顺手全删完”稳得多。

如果你想把批量扫描、补跑和归档窗口单独理顺，继续看：

- [Rust 批处理、回填与历史数据修复实践](./batch-processing-backfill-and-historical-repair-practice.md)
- [Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- [Rust 数据归档、保留策略与冷热分层实践](./data-archiving-retention-and-hot-cold-tiering-practice.md)

## 审计和 actor 不能靠 `deleted_at` 一列替代

很多系统把：

- `deleted_by`
- `deleted_at`

当成全部删除审计，这通常不够。

真正值得单独记录的通常还包括：

- `tenant_id`
- `resource_type`
- `resource_id`
- `request_id`
- `reason`
- `action`
- `result`
- `source`

其中 `source` 往往至少要区分：

- 人工操作
- API 请求
- 系统保留策略清理
- 后台批处理修复

因为：

- 用户发起删除
- 管理员恢复
- system worker 到期 purge

本质上是三类不同责任动作。

而且一旦物理删除完成，很多字段会随主记录一起消失，所以不可变审计记录通常要在硬删除前就已经独立落库。

如果你想把 actor、request id 和不可变审计记录单独理顺，继续看：

- [Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)

## 测试至少要覆盖 6 条线

### 1. 重复删除与重复恢复

验证：

- 同一请求重试不会把状态推进两次
- 已删记录再次删除时返回稳定结果
- 已活跃记录再次恢复时返回稳定结果

### 2. 恢复与重建冲突

验证：

- 旧资源删除后允许新建新资源
- 旧资源恢复时唯一键冲突会被明确拒绝

### 3. 查询可见性

验证：

- 公共列表默认排除已删
- 管理接口显式 `DeletedOnly` 才能看到已删
- 恢复后重新出现在默认列表

### 4. 下游一致性

验证：

- 搜索结果在删除后不可见
- 缓存在删除后正确失效
- 恢复后搜索和缓存正确回补

### 5. 延迟 purge 与法律保留

验证：

- `purge_after` 未到时不会误删
- `legal_hold` 打开时不会被清理

### 6. 审计与附件边界

验证：

- 删除、恢复、purge 都有独立审计记录
- 关联文件不会在软删除阶段被直接物理清掉

如果你想把 fake、stub、本地测试 server 和异步测试隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 一个够用的工程拆法

```text
src/
├── deletion/
│   ├── model.rs
│   ├── query.rs
│   ├── service.rs
│   ├── restore.rs
│   ├── purge.rs
│   └── projection.rs
├── workers/
│   └── purge_deleted_resources.rs
└── application/
    └── user_service.rs
```

重点不是目录名字，而是：

- 查询可见性和写路径语义分开
- 恢复和 purge 分开
- 搜索、缓存和事件投影不要散在 handler 里

## 常见误区

### 误区 1：软删除就是加个 `deleted_at`

如果没有查询边界、唯一约束和下游同步，这只是半个设计。

### 误区 2：所有查询都靠开发者自己记得补 `deleted_at IS NULL`

只要系统足够大，这件事迟早会漏。

### 误区 3：软删除后唯一键问题不大，等恢复时再说

等恢复时才发现冲突，通常意味着产品语义根本没定义清楚。

### 误区 4：恢复一定能成功

如果资源已经被重建、被归档到不同层，或者过了恢复窗口，恢复本来就应该失败。

### 误区 5：删除只影响数据库一张表

搜索、缓存、导出、对象存储和审计如果没跟上，用户看到的系统状态就不一致。

### 误区 6：软删除后马上顺手物理删除更省事

这通常会把恢复窗口、审计追踪和合规清理一起做坏。

## 推荐回查入口

- 列表与查询边界：[Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- 搜索索引与可见性：[Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)
- 事务、条件更新与并发冲突：[Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)
- 唯一键演进与兼容发布：[Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
- 批处理与延迟 purge：[Rust 批处理、回填与历史数据修复实践](./batch-processing-backfill-and-historical-repair-practice.md)
- 归档与恢复窗口：[Rust 数据归档、保留策略与冷热分层实践](./data-archiving-retention-and-hot-cold-tiering-practice.md)
- 缓存失效与重建：[Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- 审计与操作留痕：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- 对象附件与清理链路：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 测试隔离：[Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 自检

你至少应该能回答：

1. 为什么 `deleted_at` 本身不能代表完整的删除语义设计？
2. 为什么软删除一旦允许恢复，就必须提前定义唯一约束和恢复冲突策略？
3. 为什么公共查询、管理查询和 purge / restore 任务最好用不同可见性边界？
4. 为什么数据库已经标记删除，不代表搜索、缓存和导出一定已经删干净？
5. 为什么延迟物理删除更适合走 scheduler + worker，而不是同步请求链路？
6. 为什么真正的删除治理通常要把软删除、恢复、归档和硬删除一起放进同一条生命周期主线？

这些问题理顺后，Rust 服务里的删除链路才会从“表里有个 `deleted_at`”进入“可恢复、可治理、可清理、可长期演进”的状态。
