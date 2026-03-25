---
title: Rust 列表查询、过滤、排序与分页实践
description: 从 Query DTO、过滤条件、排序白名单、offset 与 cursor 分页到 total 成本与索引约束，整理 Rust 列表接口的设计主线。
search: false
---

# Rust 列表查询、过滤、排序与分页实践

Rust 服务里最常见的接口之一，不是“创建资源”，而是“查一批东西”。

真正把列表接口做稳后，你很快会发现它远不是：

- `SELECT * FROM ... LIMIT 20`
- `Query<HashMap<String, String>>`
- `sort_by` 直接拼进 SQL

真正麻烦的地方通常是：

- query 参数一多，边界就开始乱
- 排序一旦不稳定，翻页就会重复或漏数据
- `count(*)` 一旦默认做，接口会越来越慢
- offset 在大表上会越来越贵
- `sort_by` / `filter` 如果不做白名单，很容易把安全和维护性一起拖垮

这页补的就是 Rust 列表查询、过滤、排序与分页主线。

## 先分清：列表接口通常至少有 4 层对象

一个更稳的拆法通常是：

1. HTTP query DTO
2. 应用层标准化后的查询对象
3. repo 层真正落到 SQL 的过滤/排序参数
4. 响应 DTO

一个最小示意：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct UserListQueryDto {
    pub keyword: Option<String>,
    pub status: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

#[derive(Debug, Clone, Copy)]
pub enum UserSortField {
    CreatedAt,
    Email,
}

#[derive(Debug, Clone, Copy)]
pub enum SortOrder {
    Asc,
    Desc,
}

#[derive(Debug)]
pub struct UserListQuery {
    pub keyword: Option<String>,
    pub status: Option<UserStatus>,
    pub page: u32,
    pub page_size: u32,
    pub sort_field: UserSortField,
    pub sort_order: SortOrder,
}

#[derive(Debug, Serialize)]
pub struct UserListItemDto {
    pub id: i64,
    pub email: String,
    pub status: String,
}
```

这几层的职责不同：

- DTO 承接协议输入
- 标准化查询对象负责默认值、白名单和约束
- repo 参数负责贴近 SQL
- 响应 DTO 负责对外契约

如果把这几层混成一个结构体，后面通常会同时遇到：

- `serde` 注解越来越多
- SQL 约束越来越多
- 默认值和业务语义越搅越乱

## 过滤条件要先做标准化，再进入 repo

列表接口最容易失控的第一步，就是把原始字符串一路往下传。

更稳的方向通常是：

- `trim`
- 空字符串转 `None`
- 枚举值做显式解析
- `page_size` 做上限保护
- 默认排序在应用层固定下来

例如：

```rust
use std::str::FromStr;

#[derive(Debug, Clone, Copy)]
pub enum UserStatus {
    Active,
    Disabled,
}

impl FromStr for UserStatus {
    type Err = &'static str;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "active" => Ok(Self::Active),
            "disabled" => Ok(Self::Disabled),
            _ => Err("invalid status"),
        }
    }
}

impl TryFrom<UserListQueryDto> for UserListQuery {
    type Error = ListQueryError;

    fn try_from(dto: UserListQueryDto) -> Result<Self, Self::Error> {
        let page = dto.page.unwrap_or(1);
        let page_size = dto.page_size.unwrap_or(20).min(100);

        let keyword = dto
            .keyword
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        let status = dto
            .status
            .as_deref()
            .map(UserStatus::from_str)
            .transpose()
            .map_err(|_| ListQueryError::BadRequest("invalid status"))?;

        let sort_field = match dto.sort_by.as_deref().unwrap_or("created_at") {
            "created_at" => UserSortField::CreatedAt,
            "email" => UserSortField::Email,
            _ => return Err(ListQueryError::BadRequest("invalid sort_by")),
        };

        let sort_order = match dto.sort_order.as_deref().unwrap_or("desc") {
            "asc" => SortOrder::Asc,
            "desc" => SortOrder::Desc,
            _ => return Err(ListQueryError::BadRequest("invalid sort_order")),
        };

        Ok(Self {
            keyword,
            status,
            page,
            page_size,
            sort_field,
            sort_order,
        })
    }
}
```

重点不是“代码写在哪个文件”，而是：

- 输入正规化发生在边界
- repo 层不再接原始协议字符串

## 排序字段必须白名单，不能让客户端直拼 SQL

一个高频坏味道是：

- `?sort_by=created_at desc, id desc`
- 后端直接 `format!("ORDER BY {}", sort_by)`

这至少有三个问题：

- 安全风险
- 可维护性很差
- 你根本无法保证排序语义稳定

更稳的原则通常是：

- 排序字段用 enum 白名单
- 排序方向也用 enum 白名单
- repo 层只把白名单映射成固定 SQL 片段

尤其要记住：

**绑定参数能绑定值，不能绑定 SQL 标识符。**

也就是说：

- `WHERE status = $1` 可以
- `ORDER BY $1` 不行

所以排序列名一定要手工映射。

## 稳定排序必须有 tiebreaker

这一点是分页接口的核心，不是实现细节。

如果你只按：

- `created_at DESC`

排序，而很多记录时间相同，翻页时就可能出现：

- 重复数据
- 漏数据
- 上一页和下一页边界漂移

更稳的做法通常是：

- 主排序字段 + 唯一 tiebreaker

例如：

```sql
ORDER BY created_at DESC, id DESC
```

或：

```sql
ORDER BY score DESC, id DESC
```

只要排序字段不是天然唯一，就应该补一个稳定唯一键兜底。

## offset 分页什么时候够用

offset 分页最适合：

- 后台管理系统
- 数据量不大
- 需要跳页
- 排序相对简单

一个最小公式：

```text
offset = (page - 1) * page_size
limit = page_size
```

最小 repo 示例：

```rust
pub async fn list_users_offset(
    pool: &sqlx::PgPool,
    query: &UserListQuery,
) -> Result<Vec<UserRow>, sqlx::Error> {
    let offset = (query.page.saturating_sub(1) * query.page_size) as i64;
    let limit = query.page_size as i64;

    let rows = sqlx::query_as!(
        UserRow,
        r#"
        SELECT id, email, status, created_at
        FROM users
        ORDER BY created_at DESC, id DESC
        LIMIT $1 OFFSET $2
        "#,
        limit,
        offset,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows)
}
```

offset 分页的优点是：

- 简单
- 易懂
- 前端常见组件容易接

它的缺点也很明确：

- 深分页会越来越贵
- 大 offset 会让数据库先跳过很多行
- 数据持续插入时，翻页稳定性更差

## cursor 分页更适合大表和持续写入场景

如果列表有这些特征，通常更适合 cursor：

- 数据量大
- 写入频繁
- 只需要“下一页”
- 更关注连续翻页性能

一个很常见的思路是：

1. 固定排序为 `created_at DESC, id DESC`
2. cursor 记录上一页最后一条记录的 `(created_at, id)`
3. 下一页用这个边界继续往后查

cursor 结构可以先在服务内部明确表达：

```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct UserListCursor {
    pub created_at: DateTime<Utc>,
    pub id: i64,
}
```

SQL 条件示意：

```sql
WHERE (created_at, id) < ($1, $2)
ORDER BY created_at DESC, id DESC
LIMIT $3
```

repo 示例：

```rust
pub async fn list_users_cursor(
    pool: &sqlx::PgPool,
    cursor: Option<&UserListCursor>,
    limit: i64,
) -> Result<Vec<UserRow>, sqlx::Error> {
    if let Some(cursor) = cursor {
        sqlx::query_as!(
            UserRow,
            r#"
            SELECT id, email, status, created_at
            FROM users
            WHERE (created_at, id) < ($1, $2)
            ORDER BY created_at DESC, id DESC
            LIMIT $3
            "#,
            cursor.created_at,
            cursor.id,
            limit,
        )
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as!(
            UserRow,
            r#"
            SELECT id, email, status, created_at
            FROM users
            ORDER BY created_at DESC, id DESC
            LIMIT $1
            "#,
            limit,
        )
        .fetch_all(pool)
        .await
    }
}
```

真实项目里，cursor 往往不会直接裸露成 JSON 结构，而会：

- base64 编码
- 加版本号
- 作为 opaque token 返回

重点不是编码方式，而是：

- cursor 语义稳定
- 可以向后兼容
- 不让客户端依赖内部实现细节

## 动态过滤可以用 `QueryBuilder`，但边界仍然要清楚

当过滤条件是可选组合时，`sqlx::QueryBuilder` 会很实用。

例如：

```rust
use sqlx::{Postgres, QueryBuilder};

pub async fn list_users(
    pool: &sqlx::PgPool,
    query: &UserListQuery,
) -> Result<Vec<UserRow>, sqlx::Error> {
    let mut qb = QueryBuilder::<Postgres>::new(
        "SELECT id, email, status, created_at FROM users WHERE deleted_at IS NULL",
    );

    if let Some(keyword) = query.keyword.as_deref() {
        qb.push(" AND email ILIKE ");
        qb.push_bind(format!("%{keyword}%"));
    }

    if let Some(status) = query.status {
        qb.push(" AND status = ");
        qb.push_bind(match status {
            UserStatus::Active => "active",
            UserStatus::Disabled => "disabled",
        });
    }

    qb.push(" ORDER BY ");
    qb.push(match query.sort_field {
        UserSortField::CreatedAt => "created_at",
        UserSortField::Email => "email",
    });
    qb.push(match query.sort_order {
        SortOrder::Asc => " ASC",
        SortOrder::Desc => " DESC",
    });
    qb.push(", id DESC");

    qb.push(" LIMIT ");
    qb.push_bind(query.page_size as i64);

    let rows = qb.build_query_as::<UserRow>().fetch_all(pool).await?;
    Ok(rows)
}
```

这里最重要的仍然不是 builder 本身，而是：

- 值用绑定参数
- 标识符靠白名单映射
- 默认排序固定

## `total` 不是每个列表接口都必须返回

很多团队会默认：

- 每个列表接口都返回 `items + total`

但 `total` 的代价不一定低，尤其在：

- 条件复杂
- 联表多
- 数据量大
- 实时性要求高

更务实的选择通常有三种：

1. offset 接口返回 `total`
2. cursor 接口只返回 `next_cursor` 或 `has_more`
3. `total` 改成可选字段，只在明确需要时返回

一个 offset 响应示意：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 183
}
```

一个 cursor 响应示意：

```json
{
  "items": [],
  "next_cursor": "eyJ2IjoxLCJjcmVhdGVkX2F0IjoiLi4uIiwiaWQiOjEyM30="
}
```

更稳的原则通常是：

- 一个接口选一种主语义
- 不要一会儿 page，一会儿 cursor
- 不要让前端猜哪些字段何时存在

## 输入边界要明确哪些是 400，哪些是 422

列表接口最常见的边界错误包括：

- `page=0`
- `page_size=100000`
- `sort_by=drop_table`
- `cursor=abc` 无法解析
- 过滤条件组合互相冲突

一个实用原则是：

- 协议格式错误、参数无法解析：400
- 字段值超出允许集合：400 或 422
- 业务上不允许的过滤组合：422 更贴近语义

重点不是状态码宗教，而是：

- 同类问题映射一致
- 错误体结构稳定
- 调用方能区分“不会解析”和“语义不允许”

如果你想把错误体、状态码和 request id 响应边界单独理顺，继续看：

- [Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)

## 索引要围绕过滤列和排序列一起想

列表查询是否稳定，不只取决于 Rust 代码，还取决于索引设计。

常见思路是：

- 先看高频过滤条件
- 再看主排序字段
- 再看 tiebreaker

例如一个多租户用户列表，常见查询可能是：

- `tenant_id = ?`
- `status = ?`
- `ORDER BY created_at DESC, id DESC`

那就应该优先思考类似：

```text
(tenant_id, status, created_at DESC, id DESC)
```

这类复合索引是否值得建立。

如果索引只照着单字段建，最后很可能出现：

- 查询能跑
- 排序也能做
- 但数据库被迫回表或 filesort

## 深分页和大 `count(*)` 往往是性能问题，不是语法问题

很多列表接口慢，不是因为 Rust 慢，而是因为：

- offset 太深
- 过滤条件没索引
- `count(*)` 每次都做
- 排序字段不能命中索引

如果你在压测或排障时发现：

- 列表第一页很快
- 第 200 页突然变慢
- 不带 `total` 明显更快

那优先怀疑的应该是查询策略，而不是先去怀疑 Tokio。

## 测试要覆盖“不会重复、不会漏、不会失控”

列表接口很适合做场景测试。

至少值得覆盖：

### 1. 排序稳定性

- 同一秒创建多条数据
- 翻页后不重复、不漏项

### 2. 边界保护

- `page_size` 超上限会被拒绝或钳制
- 非法 `sort_by` 会稳定报错
- 非法 cursor 会稳定报错

### 3. 过滤组合

- 有关键词时结果集正确
- status + keyword 组合行为正确

### 4. 响应契约

- offset 接口是否总有 `page` / `page_size`
- cursor 接口是否总有 `next_cursor` 语义

## 常见误区

### 误区 1：直接把 query 参数做成 `HashMap<String, String>`

短期快，长期会让边界、默认值和校验全部散掉。

### 误区 2：排序字段直接拼 SQL

这是安全和维护性同时失控的起点。

### 误区 3：分页只按一个非唯一字段排序

很容易导致翻页重复或漏数。

### 误区 4：默认所有接口都返回 `total`

这会让很多本可以很轻的列表查询白白背上额外成本。

### 误区 5：大表还坚持深 offset

这不是“前端页码体验更好”，而是数据库在替产品复杂度买单。

## 推荐回查入口

- Web 输入边界：[Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)
- Web 服务主线：[Axum Web 服务实践](./axum-web-service-practice.md)
- API 错误边界：[Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)
- 多租户隔离：[Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)
- 数据访问边界：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- 搜索与检索边界：[Rust 搜索、索引与检索实践](./search-index-and-retrieval-practice.md)
- 删除语义边界：[Rust 软删除、恢复与删除语义实践](./soft-delete-restore-and-deletion-semantics-practice.md)
- 导出与报表边界：[Rust 导出、报表与大结果集实践](./export-report-and-large-result-practice.md)
- DTO 分层：[Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- 性能排障：[Rust 性能分析与 Profiling 指南](./performance-and-profiling-guide.md)

## 推荐资料

- [axum `Query`](https://docs.rs/axum/latest/axum/extract/struct.Query.html)
- [SQLx `QueryBuilder`](https://docs.rs/sqlx/latest/sqlx/struct.QueryBuilder.html)

## 自检

你至少应该能回答：

1. 为什么排序字段和排序方向都应该做白名单？
2. 为什么稳定分页几乎总要补一个唯一 tiebreaker？
3. offset 和 cursor 分页分别更适合什么场景？
4. 为什么很多列表接口不应该默认返回 `total`？
5. 为什么 query DTO、标准化查询对象和 repo 参数最好分层？

这些问题理顺后，Rust 服务里的列表接口才会从“能查出来”进入“能长期演进、能抗流量、能稳定翻页”的状态。
