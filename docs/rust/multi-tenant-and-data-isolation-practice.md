---
title: Rust 多租户与数据隔离实践
description: 从 tenant context、认证注入、SQL 过滤、唯一约束、缓存 key、对象 key、配额与观测到跨租户测试，整理 Rust 多租户服务主线。
search: false
---

# Rust 多租户与数据隔离实践

Rust 服务一旦进入 B 端、SaaS 或平台型业务，很快就会碰到一个比“接口能不能跑”更关键的问题：

- 当前请求属于哪个租户
- 这条数据是不是当前租户的
- 唯一约束是全局唯一，还是租户内唯一
- 缓存、对象存储、限流和事件是不是也带租户边界
- 一次漏加 `tenant_id` 会不会直接造成跨租户数据泄露

这些问题的共同点是：

**多租户不是一个字段，而是一整条隔离边界。**

这页补的就是 Rust 服务里的多租户与数据隔离主线。

## 先分清：多租户首先是隔离模型问题，不是 Axum 或 SQLx 技巧

很多项目最早会把多租户理解成：

- 表里多一个 `tenant_id`

这当然是常见做法，但还不够。

更稳的第一步是先明确隔离模型：

### 1. 共享库共享表

特点通常是：

- 所有租户共享同一张表
- 靠 `tenant_id` 做逻辑隔离

优点：

- 成本低
- 运维简单

代价：

- 漏一条过滤条件就可能出事故

### 2. 共享库独立 schema

特点通常是：

- 同一数据库实例
- 每个租户或租户组单独 schema

优点：

- 隔离更强

代价：

- schema 管理和迁移复杂度更高

### 3. 独立数据库

特点通常是：

- 每个租户或租户组单独库

优点：

- 隔离最强
- 资源治理更清晰

代价：

- 运维和成本明显更高

Rust 代码层最常碰到的是第一类或混合模式，所以这页重点放在：

- 共享库共享表下，怎么把租户隔离边界收稳

## tenant context 应该从认证链路进入，不要让 handler 信任任意传入的 tenant_id

多租户服务最常见的入口坏味道之一是：

- header 里有一个 `X-Tenant-Id`
- query 里也能传一个 `tenant_id`
- body 里再带一个 `tenantId`

然后 handler 自己挑一个来信。

更稳的原则通常是：

1. 认证链路产出可信 `CurrentTenant`
2. handler / service 只消费这个上下文
3. 客户端传来的租户字段最多作为校验对象，而不是权限来源

一个最小上下文示意：

```rust
#[derive(Debug, Clone)]
pub struct CurrentTenant {
    pub tenant_id: String,
}

#[derive(Debug, Clone)]
pub struct CurrentUser {
    pub user_id: i64,
    pub tenant_id: String,
    pub roles: Vec<String>,
}
```

这类上下文通常应该来自：

- token claims
- session
- API gateway 注入的可信身份头

而不是任意业务参数。

如果你想把 middleware、extractor、当前用户和请求上下文单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

## 认证、授权和租户隔离是三层不同责任

这三件事经常一起出现，但不要混着写。

### 认证

回答：

- 你是谁

### 授权

回答：

- 你能不能做这件事

### 租户隔离

回答：

- 你访问的资源是不是当前租户范围内的资源

一个很务实的拆法通常是：

- middleware / extractor：拿到 `CurrentUser` 和 `CurrentTenant`
- service：做资源归属和角色权限判断
- repo：把租户边界真正落进 SQL / 存储查询条件

不要把“有管理员角色”直接理解成“可以跨租户读取所有数据”，除非业务明确就是平台管理员语义。

## repo 方法签名要显式带 tenant scope，不要写模糊接口

共享表多租户最危险的坏味道之一是：

- `find_by_id(id)`

这种签名看起来简洁，但它对多租户几乎总是不够安全。

更稳的接口通常是：

```rust
pub struct TenantScope<'a> {
    pub tenant_id: &'a str,
}

pub async fn find_user_by_id(
    &self,
    scope: TenantScope<'_>,
    user_id: i64,
) -> Result<Option<UserRow>, sqlx::Error> {
    sqlx::query_as!(
        UserRow,
        r#"
        SELECT id, tenant_id, email, status
        FROM users
        WHERE tenant_id = $1 AND id = $2
        "#,
        scope.tenant_id,
        user_id,
    )
    .fetch_optional(&self.pool)
    .await
}
```

这样做的价值是：

- 租户条件不能被轻易遗漏
- repo 边界表达更明确
- 代码审查时更容易看出是否漏了隔离条件

如果 repo API 默认不带 tenant scope，后面总会有人漏一条条件。

## `SELECT`、`UPDATE`、`DELETE` 都要带 tenant 条件，不只是查询

很多跨租户事故不是出在：

- 查错数据

而是出在：

- 改错数据
- 删错数据

所以共享表模型里，一个很硬的原则通常是：

- `SELECT` 带 `tenant_id`
- `UPDATE` 带 `tenant_id`
- `DELETE` 带 `tenant_id`

例如：

```sql
UPDATE invoices
SET status = 'paid'
WHERE tenant_id = $1
  AND invoice_id = $2
  AND status = 'pending'
```

这样同一条语句同时在解决：

- 租户隔离
- 状态条件更新

这比“先查出来看一下是不是当前租户的，再单独 update”更稳。

## 唯一约束往往应该是租户内唯一，不是全局唯一

共享表多租户里，一个高频问题是：

- 用户名、邮箱、项目 key、目录名

到底是：

- 全局唯一
- 还是租户内唯一

非常多的业务其实需要的是：

- `(tenant_id, business_key)` 复合唯一

例如：

```sql
CREATE UNIQUE INDEX users_tenant_email_uniq
ON users (tenant_id, email);
```

如果你直接上：

```sql
UNIQUE(email)
```

结果往往是：

- 一个租户注册过的邮箱把另一个租户也锁死

这不是数据库技巧问题，而是业务隔离模型没讲清。

## 索引设计也要围绕 tenant 维度重排

多租户服务里，最常见查询通常会有一个固定前提：

- 当前租户内查数据

所以索引经常要优先考虑把 `tenant_id` 放进前缀。

例如列表查询常见组合：

```text
(tenant_id, status, created_at DESC, id DESC)
```

而不是只看：

```text
(status, created_at DESC)
```

因为真实查询往往不是“全局查所有数据”，而是：

- 当前租户内按状态过滤和排序

如果你想把列表查询、排序和分页的边界单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

## 输入边界要明确：tenant_id 是谁提供的，谁负责校验

很多创建接口会有这类字段：

- `tenant_id`
- `org_id`
- `workspace_id`

这时候要先问清：

1. 这是路径参数里的资源归属信息？
2. 这是客户端自己可选的业务字段？
3. 还是根本应该从认证上下文派生？

更稳的实践通常是：

- 如果当前租户来自认证上下文，就不要允许客户端再自由覆盖
- 如果路径里带 `tenant_id`，那它更多是做路由和一致性校验
- body / query 里的租户字段通常不该直接决定权限边界

否则很容易出现：

- token 属于 A 租户
- 但 body 里传了 B 租户
- handler 一不小心就按 body 写进去了

如果你想把 DTO、领域模型和输入校验边界单独理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## 缓存 key 一定要带 tenant 维度

多租户缓存最常见的事故之一，就是缓存串租户。

坏味道通常像这样：

- `user:42`

如果不同租户里都存在 ID 42，这个 key 几乎必然会撞。

更稳的 key 设计通常至少包含：

- 环境
- tenant_id
- 资源类型
- 业务主键

例如：

```text
prod:tenant:t_123:user:42
```

这点对：

- 本地缓存
- Redis
- 两级缓存

都一样成立。

如果你想把 TTL、Redis 和两级缓存边界单独理顺，继续看：

- [Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)

## 对象存储 key 也应该带 tenant 维度

多租户不只存在于数据库和缓存。

如果你有：

- 文件上传
- 导出报表
- 证据材料
- 用户头像

那对象 key 也应该有显式租户维度。

例如：

```text
tenant/{tenant_id}/resource/{resource_id}/...
```

这既帮助：

- 排障
- 批量清理
- 权限边界梳理

也能降低同名资源冲突。

如果你想把预签名上传、对象 key 和文件状态边界单独理顺，继续看：

- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)

## 配额和限流通常更像租户边界，而不是单实例边界

很多 B 端业务最后要控制的不是：

- 单实例每秒多少请求

而是：

- 某个租户一天能导出多少次
- 某个租户当前并发任务数
- 某个租户每分钟发多少短信

这时本地 `RateLimitLayer` 通常不够。

更稳的思路通常是：

- 网关层做统一租户配额
- 或共享状态方案，例如 Redis 计数 / 令牌桶

不要把：

- 实例级 rate limit

误当成：

- 租户级配额系统

如果你想把 timeout、rate limit、concurrency limit 和共享状态限额单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## tracing 和审计日志适合带 tenant_id，metrics 默认不要直接带高基数租户标签

多租户排障时，最有价值的字段之一往往就是：

- `tenant_id`

在这些地方很值得带：

- tracing span
- 结构化日志
- 审计事件

但指标标签要谨慎。

如果租户数很多，直接给 metrics 打：

- `tenant_id=t_123`

通常会带来：

- 高基数
- 存储和查询成本上升
- 监控系统负担过大

更稳的做法通常是：

- tracing / 审计日志带 tenant_id
- 指标默认只带 plan / tier / region / result 这类低基数标签
- 只有极少数租户级专用指标才做单独维度

这条边界非常重要，因为很多团队第一次做多租户观测时最容易在这里踩坑。

如果你想把 tracing 和 metrics 主线单独理顺，继续看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- [Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)
- [Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)

如果你还要按 tenant、plan 或白名单租户做功能灰度，不要把 rollout 逻辑散在 handler 里临时判断，继续看：

- [Rust Feature Flag、运行时开关与灰度治理实践](./feature-flag-and-runtime-governance-practice.md)

## 跨服务事件也要保留 tenant context

只要系统进入：

- Outbox
- MQ
- 事件驱动

租户边界就不能只存在于 HTTP 请求里。

更稳的事件 envelope 通常要保留：

- `tenant_id`
- `event_id`
- `aggregate_id`

否则消费方很容易遇到：

- 收到了事件
- 但不知道该落到哪个租户上下文里

如果你想把消息驱动和事件契约边界单独理顺，继续看：

- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

## 如果是 Postgres，共享表模型可以考虑 RLS，但不要把它当成唯一防线

RLS（Row Level Security）可以提供额外兜底。

它的价值通常在于：

- 即使应用层某条 SQL 漏了过滤
- 数据库层也仍然有机会拦住

但更稳的原则通常仍然是：

1. 应用层 repo 默认带 tenant scope
2. 数据库约束和索引显式包含 tenant 维度
3. RLS 作为额外安全网，而不是唯一策略

不要因为开了 RLS，就把应用层边界设计完全放弃。

## 引入 tenant_id 往往意味着一次显式迁移和回填工程

如果系统最初不是多租户，后面再补 `tenant_id`，通常不是改几个字段那么简单。

常见工作包括：

- 给核心表补 `tenant_id`
- 回填历史数据
- 重建唯一约束和索引
- 调整 repo 方法签名
- 调整缓存 key
- 调整对象 key
- 调整事件 payload

这里最大的风险通常不是语法，而是：

- 迁移期间新旧逻辑并存
- 一部分链路带 tenant，一部分没带

所以更稳的做法通常是：

- 先梳理所有读写入口
- 再分批推进 schema、代码、缓存、消息和观测

如果你想把 expand / contract、回填、双读双写和兼容发布单独理顺，继续看：

- [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)

## 多租户测试核心不是功能测试，而是“跨租户绝不能串”

至少值得覆盖这些场景：

### 1. repo / service 隔离测试

- A 租户查不到 B 租户资源
- A 租户更新不会影响 B 租户数据

### 2. 唯一约束测试

- 同租户重复 key 被拒绝
- 不同租户相同 key 允许存在

### 3. 缓存测试

- 相同资源 ID、不同 tenant 不会命中同一个 key

### 4. 授权测试

- 管理员角色是否只是租户内管理员
- 平台管理员是否明确拥有跨租户能力

### 5. 回归测试

- 某次新加查询是否漏了 tenant 条件

如果你想把 fake、集成测试和边界隔离单独理顺，继续看：

- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 常见误区

### 误区 1：把 tenant_id 当普通业务字段

它其实是隔离边界，不是随手传一下的元数据。

### 误区 2：只在查询时带 tenant_id，更新和删除忘了带

很多事故真正危险的是误改、误删，而不只是误读。

### 误区 3：唯一约束默认做全局唯一

很多业务其实需要的是租户内唯一。

### 误区 4：缓存和对象存储没带 tenant 维度

这会把隔离问题从数据库层扩散到边缘系统。

### 误区 5：为了查问题，给所有 metrics 都打 tenant_id 标签

高基数指标很容易把观测系统先拖垮。

## 推荐回查入口

- 认证与上下文：[Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)
- 数据访问边界：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- Schema 演进主线：[Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
- 列表查询边界：[Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- 导出与报表边界：[Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- 缓存边界：[Rust 缓存与 Redis 实践](./cache-and-redis-practice.md)
- 服务保护边界：[Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)
- 文件与对象存储：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 审计记录边界：[Rust 审计日志与操作记录实践](./audit-log-and-operation-history-practice.md)
- 观测与日志：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- 指标闭环：[Rust Metrics 与 OpenTelemetry 实践](./metrics-and-opentelemetry-practice.md)

## 自检

你至少应该能回答：

1. 为什么多租户首先是隔离模型问题，而不是单纯加一个 `tenant_id` 字段？
2. 为什么 repo 方法签名最好显式带 tenant scope，而不是默认只传资源 ID？
3. 为什么共享表模型里 `UPDATE` 和 `DELETE` 同样必须带 tenant 条件？
4. 为什么缓存 key、对象 key 和事件 payload 也必须显式考虑 tenant 维度？
5. 为什么 tracing 可以带 tenant_id，而 metrics 默认不应该滥打 tenant 标签？

这些问题理顺后，Rust 多租户服务才会从“看起来支持 tenant”进入“真正能守住隔离边界”。 
