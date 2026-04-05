---
title: Rust 数据库生态与 ORM 选型对比
description: 从 SQLx、Diesel、SeaORM 三条主线出发，对比 Rust 数据库访问层的设计哲学、async 支持、类型安全、迁移工具与选型判断。
search: false
---

# Rust 数据库生态与 ORM 选型对比

Rust 的数据库访问层选择，比多数语言更有分歧。

Go 的生态基本收敛到 `database/sql` + `sqlc` 或 GORM；Node.js 大多围绕 Prisma、TypeORM、Drizzle 做选择；Python 几乎默认 SQLAlchemy。

但 Rust 没有这种"默认选项"。原因有几个：

- 所有权模型使得传统 ORM 的 Active Record 模式很难照搬
- 编译期能力很强，社区倾向用编译期而不是运行时来保证安全
- async 生态分裂（tokio vs async-std）曾经影响了 crate 的设计方向
- 社区对"抽象到什么程度"的审美差异很大

结果就是：三条路径各有明确的设计哲学和适用人群。

- **原始 SQL 路径** — 以 SQLx 为代表
- **查询构建器路径** — 以 Diesel 为代表
- **ORM 路径** — 以 SeaORM 为代表

这页的目标不是告诉你"用哪个"，而是帮你理解每种方案的设计取舍和适用边界，从而做出适合项目阶段的判断。

## 生态全景

### SQLx — SQL-first，编译期校验

SQLx 的核心理念是：**SQL 是第一公民，Rust 只负责类型映射和安全校验。**

关键特征：

- 编译期 SQL 校验（`query!` 宏连接真实数据库检查语法和类型）
- 纯 async，原生支持 tokio 和 async-std
- 零 DSL 开销 — 你写的就是 SQL
- 连接池、事务、迁移一体化
- 支持 PostgreSQL、MySQL、SQLite

适合的人：喜欢写 SQL、想要编译期校验、不想学额外 DSL 的工程师。

### Diesel — 类型安全查询构建器

Diesel 的核心理念是：**用 Rust 类型系统来表达查询，错误在编译期暴露。**

关键特征：

- 基于 Rust 类型的查询 DSL（不写 SQL 字符串）
- 通过 `table!` 宏生成 schema 类型
- 原本只支持同步，现在有 `diesel-async` 扩展
- 自带迁移工具 `diesel_cli`
- 支持 PostgreSQL、MySQL、SQLite

适合的人：偏好强类型查询表达、团队 Rust 经验较深、愿意投入学习 DSL 的工程师。

### SeaORM — Active Record 风格的 async ORM

SeaORM 的核心理念是：**提供类似传统 ORM 的开发体验，同时保持 async 原生。**

关键特征：

- Active Record 模式 — Entity 定义、关系声明、CRUD 一体
- 底层基于 SeaQuery（独立的查询构建器 crate）
- async 原生，支持 tokio 和 async-std
- 支持动态查询构建（运行时条件拼接）
- 自带 `sea-orm-cli` 迁移工具和代码生成
- 支持 PostgreSQL、MySQL、SQLite

适合的人：从 Node.js/Python ORM 背景迁移过来、想要快速上手、需要动态查询构建的工程师。

### NoSQL 方向

简要提及：

- **SurrealDB** — Rust 原生的多模型数据库，自带 Rust SDK，适合需要图 + 文档 + 关系混合模型的场景。生态尚在早期。
- **MongoDB Rust Driver** — 官方维护的 async 驱动，API 设计偏底层，类型映射通过 `serde` + `bson` 完成。适合已经确定 MongoDB 的团队。

本文后续重点对比 SQLx、Diesel、SeaORM 三者。

## 核心维度对比

| 维度 | SQLx | Diesel | SeaORM |
|---|---|---|---|
| **设计哲学** | SQL-first，保留原始 SQL | DSL-first，用类型系统表达查询 | ORM，Active Record 模式 |
| **async 支持** | 原生 async | 同步为主，diesel-async 扩展 | 原生 async |
| **编译期校验** | `query!` 宏连真实数据库校验 | 通过类型系统静态校验 | 无编译期 SQL 校验 |
| **迁移工具** | `sqlx migrate` | `diesel_cli` | `sea-orm-cli migrate` |
| **多数据库** | Postgres / MySQL / SQLite | Postgres / MySQL / SQLite | Postgres / MySQL / SQLite |
| **类型安全** | 高（编译期校验 SQL） | 很高（类型系统级保证） | 中（运行时校验为主） |
| **学习曲线** | 低（会 SQL 就能上手） | 高（需要理解 DSL 和 schema 宏） | 中（有传统 ORM 经验可迁移） |
| **社区活跃度** | 高，最多用户 | 高，历史最久 | 中高，增长较快 |
| **查询灵活性** | 写 SQL，极度灵活 | DSL 覆盖面广，极端场景需 `sql_literal` | 动态构建能力强 |
| **性能** | 接近裸驱动 | 接近裸驱动 | 有 ORM 层开销，但可控 |

一些补充说明：

- SQLx 的编译期校验需要在编译时能连接到数据库（或使用离线模式 `sqlx prepare`）
- Diesel 的类型安全是最"Rust 原生"的 — 如果查询写错，编译器直接报类型错误
- SeaORM 的灵活性主要体现在运行时动态构建查询，这在后台管理、报表等场景很有价值

## 代码风格对比

同一个场景：查询 `users` 表，按 `email` 过滤，返回用户记录。

### SQLx

```rust
#[derive(sqlx::FromRow)]
struct User {
    id: i64,
    name: String,
    email: String,
}

async fn find_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as!(
        User,
        "SELECT id, name, email FROM users WHERE email = $1",
        email
    )
    .fetch_optional(pool)
    .await
}
```

特点：SQL 直接可见，编译期校验参数类型和返回列。

### Diesel

```rust
// schema.rs（由 diesel print-schema 生成）
diesel::table! {
    users (id) {
        id -> Int8,
        name -> Varchar,
        email -> Varchar,
    }
}

#[derive(Queryable, Selectable)]
#[diesel(table_name = users)]
struct User {
    id: i64,
    name: String,
    email: String,
}

fn find_by_email(conn: &mut PgConnection, email_addr: &str) -> QueryResult<Option<User>> {
    use self::users::dsl::*;

    users
        .filter(email.eq(email_addr))
        .select(User::as_select())
        .first(conn)
        .optional()
}
```

特点：没有 SQL 字符串，查询通过类型链式调用表达。`schema.rs` 是额外的维护对象。

### SeaORM

```rust
// entity/user.rs（由 sea-orm-cli generate entity 生成）
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i64,
    pub name: String,
    pub email: String,
}

// 查询
async fn find_by_email(db: &DatabaseConnection, email: &str) -> Result<Option<Model>, DbErr> {
    Entity::find()
        .filter(Column::Email.eq(email))
        .one(db)
        .await
}
```

特点：Active Record 风格，Entity 定义承载了表结构和查询入口。对有 ORM 经验的人很熟悉。

### 三者差异总结

| 方面 | SQLx | Diesel | SeaORM |
|---|---|---|---|
| SQL 可见性 | 直接看到 SQL | SQL 被 DSL 抽象 | SQL 被 ORM 抽象 |
| 额外生成文件 | 无 | `schema.rs` | `entity/*.rs` |
| 编译期安全来源 | 连接数据库校验 | 类型系统 | 无编译期校验 |
| 代码量 | 最少 | 中等 | 中等 |
| 复杂查询表达 | 直接写 SQL | DSL 组合 | 方法链 + SeaQuery |

## 迁移工具对比

迁移工具的选择往往比查询层更影响长期维护成本。

### sqlx migrate

```bash
# 创建迁移
sqlx migrate add create_users_table

# 运行迁移
sqlx migrate run

# 检查状态
sqlx migrate info
```

特点：

- 纯 SQL 文件（`.sql`），支持可逆（`up.sql` / `down.sql`）和不可逆
- 迁移状态记录在 `_sqlx_migrations` 表
- CI 集成简单 — 只需要数据库连接字符串
- `sqlx prepare` 可以生成离线校验文件，CI 不需要真实数据库

### diesel migration

```bash
# 创建迁移
diesel migration generate create_users_table

# 运行迁移
diesel migration run

# 回滚
diesel migration revert

# 重新生成 schema.rs
diesel print-schema > src/schema.rs
```

特点：

- 必须有 `up.sql` 和 `down.sql`（强制可逆）
- 运行迁移后自动更新 `schema.rs`
- `schema.rs` 必须与数据库保持同步，否则编译报错
- CI 需要数据库连接来生成 schema，或者把 `schema.rs` 提交进版本控制

### sea-orm-cli migrate

```bash
# 创建迁移
sea-orm-cli migrate generate create_users_table

# 运行迁移
sea-orm-cli migrate up

# 回滚
sea-orm-cli migrate down

# 生成 Entity
sea-orm-cli generate entity -o src/entity
```

特点：

- 迁移用 Rust 代码编写（基于 SeaQuery 的 `MigrationTrait`）
- 可以在迁移中写复杂的数据回填逻辑
- Entity 代码生成是独立步骤，需要手动执行
- CI 集成时需要编译迁移 crate

### 迁移工具对比表

| 方面 | sqlx migrate | diesel migration | sea-orm-cli migrate |
|---|---|---|---|
| 迁移格式 | SQL 文件 | SQL 文件 | Rust 代码 |
| 可逆性要求 | 可选 | 强制 | 可选 |
| 代码生成 | 无 | schema.rs | entity/*.rs |
| CI 依赖 | 数据库或离线模式 | 数据库 | 编译迁移 crate |
| 数据回填 | 需要额外脚本 | 需要额外脚本 | 可在迁移中直接写 |
| 学习成本 | 最低 | 中等 | 中等 |

## 选型决策指南

没有"最好的"方案，只有最适合当前项目阶段和团队情况的选择。

### 如果你喜欢写 SQL 且要编译期校验 → SQLx

- 你对 SQL 很熟，不想被 DSL 限制表达能力
- 你的查询模式相对固定，不需要大量动态拼接
- 你希望代码量最小、依赖最轻
- 你愿意在开发时保持数据库连接（或使用离线模式）

### 如果你要强类型查询构建且团队有 Rust 经验 → Diesel

- 你的团队对 Rust 类型系统很熟悉
- 你希望查询错误全部在编译期暴露
- 你接受 `schema.rs` 的额外维护成本
- 你的项目以同步为主，或者愿意引入 diesel-async

### 如果你从传统 ORM 迁移且需要快速上手 → SeaORM

- 团队有 Node.js/Python/Ruby 的 ORM 使用经验
- 你需要大量动态查询构建（后台管理、报表筛选）
- 你希望有代码生成来减少样板代码
- 你接受放弃编译期 SQL 校验

### 如果你的查询模式固定且性能敏感 → SQLx

- 查询基本都是提前确定的 CRUD + 少量复杂查询
- 你需要接近裸驱动的性能
- 你希望 SQL 可读、可审计
- 你不需要运行时动态构建查询

### 如果你需要运行时动态构建查询 → SeaORM 或 SeaQuery

- 用户可以自定义筛选条件、排序、分页
- 查询条件在编译期无法确定
- SeaORM 的 `Condition` 和 `QuerySelect` 支持灵活拼接
- 也可以单独使用 SeaQuery 作为查询构建器，配合 SQLx 执行

## 混合使用策略

实际项目中，纯用一种方案未必是最优解。

### SQLx + SeaQuery 组合

最常见的混合策略是：

- **SQLx 做主要数据访问** — 固定查询用 `query!` / `query_as!`
- **SeaQuery 做动态查询构建** — 后台筛选、动态报表等场景

```rust
use sea_query::{Expr, PostgresQueryBuilder, Query};

// 动态构建查询
let mut query = Query::select();
query.from(Users::Table).columns([Users::Id, Users::Name, Users::Email]);

if let Some(email) = filter.email {
    query.and_where(Expr::col(Users::Email).eq(email));
}
if let Some(name) = filter.name {
    query.and_where(Expr::col(Users::Name).like(format!("%{name}%")));
}

let (sql, values) = query.build(PostgresQueryBuilder);

// 用 SQLx 执行
let rows = sqlx::query_as::<_, User>(&sql)
    .fetch_all(&pool)
    .await?;
```

这样做的好处：

- 固定查询保留编译期校验
- 动态查询有类型安全的构建器
- 不引入完整 ORM 的开销

### 何时混合是合理的

- 项目中 80% 的查询是固定的，20% 需要动态构建
- 团队对 SQL 很熟悉，但确实有动态查询的需求
- 你希望保持 SQLx 的轻量，同时获得查询构建的灵活性

### 何时混合是技术债

- 同一个 Entity 在 SQLx struct 和 SeaORM Entity 中重复定义
- 团队对两套工具都不熟悉，维护时认知负担翻倍
- 为了"以防万一"引入，实际只用了一小部分
- 迁移工具混用（一部分用 sqlx migrate，一部分用 sea-orm-cli）

**原则：混合使用的前提是职责边界清晰。如果两套工具的覆盖范围大量重叠，说明选型有问题。**

## 常见误区

### 误区 1："ORM 一定比原始 SQL 安全"

ORM 防止的是 SQL 注入，但不防止逻辑错误。用 SeaORM 写出"查了不该查的表""漏了 WHERE 条件"和用原始 SQL 犯这些错的概率差不多。

SQLx 的 `query!` 宏在编译期校验 SQL 语法和类型绑定，在很多场景下反而比 ORM 的运行时校验更安全。

### 误区 2："Diesel 不支持 async"

这在早期是事实，但 `diesel-async` crate 已经提供了基于 `bb8` 和 `deadpool` 的 async 连接池和查询执行。虽然不是 Diesel 核心团队维护（由社区核心贡献者 weiznich 维护），但已经在生产环境中被广泛使用。

不过需要注意：diesel-async 的 API 与原版 Diesel 有差异，迁移成本不为零。

### 误区 3："SQLx 不能做复杂查询"

SQLx 能写的查询 = 数据库能执行的查询。你用 SQL 能表达的，SQLx 都支持。CTE、窗口函数、子查询、JSON 操作，全都可以。

`query!` 宏的限制是不能做动态拼接（因为 SQL 必须是字面量）。但可以配合 `query_as` + 手动拼接，或者用 SeaQuery 构建。

### 误区 4："选最流行的就对了"

SQLx 在 GitHub stars 和 crates.io 下载量上领先，但这不意味着它适合所有场景。

- 如果你的团队更擅长类型化查询而不是写 SQL → Diesel 可能更合适
- 如果你需要大量动态查询 → SeaORM 可能省很多工作量
- 如果你的项目以同步为主 → Diesel 原生体验更好

### 误区 5：忽视迁移工具的长期维护成本

很多团队在选型时只看查询层，不看迁移工具。但迁移工具会伴随项目整个生命周期：

- `schema.rs` 需要持续同步
- Entity 代码生成需要在 CI 中集成
- 迁移文件的格式决定了回滚策略
- 离线模式的支持影响 CI 流水线设计

**建议：把迁移工具的工作流跑一遍再做最终决定。**

### 误区 6："先用 ORM，后面再优化"

Rust 不像动态语言那样容易在 ORM 和原始 SQL 之间切换。一旦选择了 SeaORM，你的 Entity 定义、关系声明、查询模式都会与它深度耦合。迁移到 SQLx 意味着重写大量代码。

反过来也一样：从 SQLx 迁移到 Diesel 意味着所有 SQL 字符串要改写成 DSL。

**选型决策应该在项目早期认真做，而不是"先凑合后面再说"。**

## 自检问题

在做数据库访问层选型之前，用这些问题检验一下你的判断：

1. **你的查询模式是固定的还是动态的？** 如果 90% 的查询在编译期就能确定，SQLx 的 `query!` 宏是最轻量的选择。如果需要大量运行时拼接，考虑 SeaORM 或 SeaQuery。

2. **你的团队对 SQL 熟悉程度如何？** 如果团队更擅长写 SQL 而不是学 DSL，强推 Diesel 会增加不必要的学习成本。

3. **你的项目是 async-first 还是有大量同步代码？** 如果是纯 async 服务（axum / actix-web），SQLx 和 SeaORM 体验更好。如果有同步场景，Diesel 原生同步可能更自然。

4. **你能否在开发环境保持数据库连接？** SQLx 的编译期校验需要真实数据库（或离线模式）。如果团队的开发环境无法保证数据库可用，这会成为摩擦点。

5. **你对迁移工具的要求是什么？** 纯 SQL 迁移文件最简单，但不能在迁移中写复杂逻辑。Rust 代码迁移更灵活，但 CI 集成更复杂。

6. **你是否有从其他语言 ORM 迁移的团队成员？** 如果团队大多有 Rails / Django / TypeORM 背景，SeaORM 的 Active Record 模式会降低适应成本。

7. **你的性能要求有多严格？** 三者在大多数场景下性能差异不大。但在高频查询（每秒万级）场景下，SQLx 和 Diesel 的零抽象优势会更明显。

8. **你是否已经把迁移工具的完整工作流跑过一遍？** 包括创建迁移、运行、回滚、CI 集成、多人协作冲突处理。

## 交叉引用

- [SQLx 数据库访问实践](./sqlx-database-practice.md) — SQLx 的详细用法、连接池配置、事务处理和分层模式
- [Rust 常用 crate 选型与工程边界](./crate-selection-and-boundaries.md) — 更广泛的 crate 选型方法论和判断原则
- [数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md) — 迁移的工程实践，包括 expand/contract、回填、兼容发布
