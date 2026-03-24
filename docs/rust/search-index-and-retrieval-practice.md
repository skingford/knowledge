---
title: Rust 搜索、索引与检索实践
description: 从搜索接口、查询 DSL、索引文档、异步同步、回填重建到零停机切换，整理 Rust 服务里的搜索与检索工程主线。
search: false
---

# Rust 搜索、索引与检索实践

很多 Rust 服务一开始只有列表接口，后面很快就会碰到这些问题：

- 关键词搜索、筛选、排序和分页一加上去，数据库查询越来越重
- 业务表结构还在演进，搜索索引却已经被多个页面依赖
- 写请求成功了，但搜索结果没及时更新，不知道算不算故障
- 大表回填、索引重建和线上切换一做就担心停机
- 搜索词、命中摘要、权限过滤和租户隔离一混在一起，边界开始失控

这页补的就是 Rust 服务里搜索、索引与检索的工程主线。

## 先判断：是不是根本还不需要独立搜索系统

不是所有“带关键词的列表”都该上 Elasticsearch、OpenSearch、Meilisearch 或 Tantivy。

先看需求到底是哪一类：

### 1. 普通过滤列表

更像：

- `status = active`
- `created_at >= ?`
- `ORDER BY id DESC`

这类主线通常优先留在数据库里。

如果你想把过滤、排序、分页和索引约束单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

### 2. 全文搜索 / 模糊匹配 / 高亮 / 聚合筛选

更像：

- 标题、正文、标签一起搜
- 支持拼音、前缀、模糊、分词
- 需要 facet、highlight、相关性排序

这类才真正接近独立搜索系统。

### 3. 自动补全 / 搜索建议

更像：

- 输入两个字就提示候选
- 热门查询词和历史词单独维护

这通常不是“普通列表接口 + `LIKE '%...%'`”能长期扛住的。

## 搜索系统至少要拆成 5 层

比较稳的搜索架构通常至少有这 5 层：

1. 事实源：数据库里的业务主数据
2. 检索投影：给搜索引擎使用的索引文档
3. 查询入口：接住 HTTP query、权限、租户、分页和排序
4. 同步链路：把业务变更投影到索引
5. 重建工具：全量回填、版本切换和坏数据修复

这里最容易搞混的是：

- 数据库行不是搜索文档
- 搜索结果不是最终真相
- 搜索引擎可用不等于业务真相源可用

更务实的认知通常是：

- 写路径先守住数据库一致性
- 搜索系统主要承接读优化和检索能力
- 索引可以重建，所以它更像派生数据，不像主数据

## 查询 DTO、标准化请求和引擎 DSL 要分层

前端 query 参数、服务内部查询对象和搜索引擎 DSL，不应该直接混成一层。

一个够用的拆法通常是：

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct SearchUsersQueryDto {
    pub q: Option<String>,
    pub status: Option<String>,
    pub department_id: Option<i64>,
    pub sort_by: Option<String>,
    pub order: Option<String>,
    pub cursor: Option<String>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone)]
pub enum UserSortField {
    Relevance,
    CreatedAt,
    UpdatedAt,
}

#[derive(Debug, Clone)]
pub enum SortOrder {
    Asc,
    Desc,
}

#[derive(Debug, Clone)]
pub struct SearchUsersRequest {
    pub keyword: Option<String>,
    pub status: Option<UserStatus>,
    pub department_id: Option<i64>,
    pub sort_by: UserSortField,
    pub order: SortOrder,
    pub cursor: Option<SearchCursor>,
    pub page_size: u32,
}
```

工程上最重要的是：

- DTO 负责承接外部输入和默认值
- `SearchUsersRequest` 负责承接业务语义
- 最底层 adapter 再把它翻成 OpenSearch / Meilisearch / Tantivy 的查询 DSL

不要直接做成：

- 前端透传原始 JSON DSL
- 服务端拼字符串 query
- repo 层直接吃 `HashMap<String, String>`

如果你想把输入校验和 Web 边界单独理顺，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## 搜索文档不是数据库行的镜像备份

搜索索引更像“为了检索优化过的读模型”，不是业务表原样复制。

例如用户搜索文档更可能长这样：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSearchDocument {
    pub tenant_id: String,
    pub user_id: String,
    pub name: String,
    pub email: String,
    pub department_name: Option<String>,
    pub status: String,
    pub tags: Vec<String>,
    pub created_at_ts: i64,
    pub updated_at_ts: i64,
    pub visibility: String,
}
```

而不是直接拿数据库行把所有字段全塞进去。

更稳的原则通常是：

- 只保留搜索、过滤、排序和展示真需要的字段
- 把 join 很重的展示信息提前展开成检索投影
- 对高亮、摘要、拼音、分词辅助字段做显式建模
- 不把密码 hash、token、内部状态备注这类字段带进索引

如果你想把 DTO 暴露、字段裁剪和日志脱敏单独理顺，继续看：

- [Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)

如果你想把 DTO、领域对象和读模型分层单独理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## 同步链路主流做法通常是“写库成功，再异步投影到索引”

大多数业务里，更稳的顺序通常是：

1. 请求命中服务
2. 事务写数据库
3. 提交后发布索引事件 / 写 Outbox
4. worker 异步更新搜索索引

这比“请求里同步写数据库 + 同步写搜索引擎”更常见，因为它更容易：

- 守住主事务边界
- 抗搜索引擎短时抖动
- 做重试、死信和补偿
- 在回填或重建时复用同一套投影逻辑

一个够用的事件通常会长这样：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserSearchProjectionEvent {
    pub event_id: String,
    pub tenant_id: String,
    pub user_id: String,
    pub revision: i64,
}
```

这里 `revision` 或 `updated_at` 很重要，因为它能帮助你处理：

- 重复消息
- 乱序消息
- 重放消息

更稳的 upsert 规则通常是：

- 新事件版本小于当前索引版本时直接丢弃
- 相同版本重复写要天然幂等
- 删除事件要显式建模，不要靠“查不到就算了”

如果你想把 Outbox、幂等和消息消费边界单独理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

## 小系统也别把索引同步逻辑散在 handler 里

哪怕还没上 MQ，也不代表应该把搜索同步逻辑直接塞进 HTTP handler。

比较稳的早期方案通常是：

- 事务提交后发一个内部 job
- 或写一张 projection/outbox 表让 worker 扫描

这样至少能保证：

- 搜索投影逻辑集中
- 回填和在线增量复用同一份代码
- 后续从本地 job 升级到 MQ 时，改动面不会太大

如果你想把 worker、内部 job 和独立消费进程的边界单独理顺，继续看：

- [Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)

## 搜索接口的排序、分页和过滤不能交给前端随意透传

搜索接口常见字段很多：

- 关键词
- 过滤条件
- 排序字段
- 排序方向
- page size
- cursor / search_after

但能放开的通常很少。

更稳的约束通常是：

- 排序字段只允许白名单
- 聚合字段只允许白名单
- page size 必须限制上限
- 深分页和导出不能共用同一套查询语义
- 面向用户的实时查询优先用 cursor / search_after，不要无限放大 `from + size`

比较常见的分层是：

- 面向用户的搜索接口：小页、低延迟、可降级
- 面向运营的导出任务：后台跑、批量扫描、对象存储交付
- 面向修复的回填任务：定时或手动触发、可观察、可恢复

如果你想把分页、排序和深分页成本单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

如果你想把导出和大结果集交付单独理顺，继续看：

- [Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)

## 多租户和权限过滤必须在搜索层显式建模

搜索系统最容易出事故的地方之一，不是“搜不到”，而是“搜到了不该看到的东西”。

至少要显式考虑：

- `tenant_id`
- 资源可见性级别
- 部门 / 组织范围
- 软删除状态
- 是否允许高亮原文

更稳的原则通常是：

- 索引文档里就带 tenant 和权限相关字段
- 服务端组装查询时强制补 tenant / scope filter
- 不信任前端自己传的权限过滤条件
- 结果 DTO 再做一层字段裁剪，不把索引文档原样透出

如果你想把 tenant context、租户隔离和跨租户防漏单独理顺，继续看：

- [Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)

## 重建索引不要在热索引上直接改

索引映射、分词器或文档结构一旦变化，很容易需要整库重建。

更稳的主线通常是：

1. 创建新版本索引，例如 `users_v3`
2. 启动全量回填，把数据库数据重新投影进去
3. 校验文档数、抽样结果和关键查询
4. 通过 alias 或路由配置切流到新索引
5. 观察一段时间后再删除旧索引

不要默认做成：

- 在热索引上直接改 mapping
- 一边改字段含义，一边继续写老格式文档
- 没有回填完成度和比对指标就直接切流

如果回填量大，通常还要配：

- 调度器发分片任务
- 进度表或 checkpoint
- 重试和限速
- 失败批次可重跑

如果你想把回填、批处理和调度边界单独理顺，继续看：

- [Rust 批处理、回填与历史数据修复实践](./batch-processing-backfill-and-historical-repair-practice.md)
- [Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)

## 搜索可用性问题，本质上也是服务治理问题

搜索接口经常是：

- 读多
- 计算重
- 聚合重
- 对下游搜索引擎依赖强

所以它天然适合配：

- 明确 timeout
- concurrency limit
- 限流
- load shed
- 结果缓存或建议词缓存

务实判断通常是：

- 搜索超时后，可以接受“快失败 + 调用方重试”时，就别默认无限等
- 热门建议词、热门筛选结果可以缓存，但要接受短时陈旧
- 搜索引擎故障时，要提前决定是否允许降级到数据库窄查，还是直接返回 `503`

如果你想把限流、超时和过载保护单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

如果你想把缓存和热点读路径单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

## 观测重点不是“打了日志”，而是看得见索引延迟和切换风险

搜索系统至少值得有这些观测面：

- 搜索请求耗时
- 搜索错误率
- 搜索超时率
- 索引写入成功率 / 失败率
- projection queue backlog
- 索引延迟，例如“数据库更新到索引可查”的时间差
- 重建任务进度和失败批次数

日志和 trace 里要特别小心：

- 搜索词可能本身就包含手机号、邮箱、姓名
- 高亮片段可能带出敏感原文
- query DSL 全量打印通常噪音大且有泄漏面

更稳的做法通常是：

- 记录 query 模板、过滤维度、页大小、超时与命中数
- 必要时对搜索词做长度限制、摘要化或 hash
- 对索引名、回填批次、切流版本做结构化记录

如果你想把 tracing、metrics 和数据脱敏单独理顺，继续看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)
- [Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)

## 测试至少要覆盖 4 条线

### 1. 查询构建测试

验证：

- 排序白名单是否生效
- 非法 filter 是否被拒绝
- page size 是否被钳制
- tenant filter 是否一定存在

### 2. 投影映射测试

验证：

- 数据库行 / 领域对象能否稳定映射成索引文档
- 删除事件是否会删文档
- revision 较旧的事件不会覆盖新文档

### 3. 回填与切换测试

验证：

- 全量回填可断点续跑
- alias 切换前后关键查询结果一致
- 切换期间增量事件不会丢

### 4. 隔离与降级测试

验证：

- A 租户搜不到 B 租户数据
- 搜索引擎超时时接口是否按预期降级或失败
- 热门查询缓存失效后系统不会被瞬间打穿

如果你想把 fake、stub、本地依赖和异步测试隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 一个够用的工程拆法

```text
src/
├── search/
│   ├── dto.rs
│   ├── query.rs
│   ├── document.rs
│   ├── service.rs
│   ├── engine/
│   │   ├── mod.rs
│   │   ├── opensearch.rs
│   │   └── meilisearch.rs
│   └── projection/
│       ├── mapper.rs
│       ├── consumer.rs
│       └── backfill.rs
├── workers/
│   └── run_search_projection.rs
└── application/
    └── search_service.rs
```

重点不是目录名字，而是：

- 搜索查询和普通 repo 查询分开
- 搜索文档和领域对象分开
- 在线查询、增量投影、全量回填分开
- 引擎 adapter 和业务语义分开

## 常见误区

### 误区 1：前端直接透传搜索引擎 DSL

短期省事，长期一定会把权限、兼容性和升级成本一起放大。

### 误区 2：把搜索索引当最终真相源

索引可以延迟、重建、丢批次，所以它不适合承接关键写路径真相。

### 误区 3：搜索文档直接复用数据库行或领域对象

这样会把内部字段、迁移成本和展示耦合一起带进索引。

### 误区 4：用户实时搜索默认支持深分页

`from + size` 越翻越深通常只会把延迟和资源消耗一起放大。

### 误区 5：需要重建时直接改线上热索引

一旦 mapping 或字段语义变化，很容易把在线读写一起拖进事故。

### 误区 6：只在数据库层做租户过滤，不在搜索层补 tenant 条件

这会让索引本身变成新的跨租户泄漏面。

## 推荐回查入口

- 列表查询边界：[Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- DTO 与读模型分层：[Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- 后台任务主线：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 调度与回填执行：[Rust 定时任务、调度与 Leader Election 实践](./scheduler-and-leader-election-practice.md)
- 幂等与 Outbox：[Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)
- 消息驱动主线：[Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)
- 多租户与隔离：[Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)
- Schema 演进与回填：[Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
- 限流与过载保护：[Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)
- 缓存与热点读路径：[Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- 结构化观测：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 指标闭环：[Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)
- 数据最小暴露：[Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)

## 自检

你至少应该能回答：

1. 什么情况下应该继续留在数据库列表查询，什么情况下值得引入独立搜索系统？
2. 为什么搜索 query DTO、标准化查询对象和引擎 DSL 最好分层？
3. 为什么索引文档不应该直接复用数据库行或领域对象？
4. 为什么大多数搜索同步链路更适合“写库成功，再异步投影到索引”？
5. 为什么搜索重建通常要走“新索引 -> 全量回填 -> 校验 -> alias 切换”的主线？
6. 为什么 tenant 和权限过滤必须在搜索层显式落地，而不是只信任数据库层？

这些问题理顺后，Rust 服务里的搜索链路才会从“先把结果搜出来”进入“能演进、能回填、能切换、能长期治理”的状态。
