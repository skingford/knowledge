---
title: SQLx 数据库访问实践
description: 基于 sqlx 0.8 的 Rust 数据库访问实践，覆盖连接池、编译期 SQL 校验、事务、迁移、错误边界与项目分层。
---

# SQLx 数据库访问实践

> 本页按 `sqlx 0.8` 官方文档主线整理，重点放在 Rust 服务项目里最常见的数据库访问边界。

Rust 做后端时，数据库访问很快会碰到两条路线：

- 用 ORM
- 用更接近 SQL 本体的工具

`sqlx` 常被喜欢，是因为它保持了几个 Rust 工程里很有价值的点：

- 不强迫你进入 DSL
- 保留 SQL 原样表达
- 支持编译期查询校验
- 与 async runtime 配合自然

## `sqlx` 在解决什么

它主要负责：

- 异步数据库驱动
- 连接池
- 参数绑定
- 行结果映射
- 编译期 SQL 检查
- 事务
- 迁移

如果你想保留 SQL 可见性，又不想放弃一部分类型安全，这是它的核心吸引力。

## 连接池是第一步

官方最常见的入口是各数据库自己的 `PoolOptions`：

```rust
use sqlx::postgres::PgPoolOptions;

let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect("postgres://postgres:password@localhost/test")
    .await?;
```

这类池通常应该挂进应用状态里，而不是每个请求现建连接。

## 池应该放在应用 State 里

在 Rust Web 服务里，数据库池最常见的归宿就是共享应用状态，例如：

- `AppState`
- repository 层装配对象
- service 层依赖注入

重点不是“放哪一个文件”，而是：

- 池应作为长期共享依赖
- 初始化通常在应用启动阶段完成
- 生命周期跟随整个服务，而不是单个请求

## `query!` / `query_as!` 是 `sqlx` 的关键能力

官方 README 最强调的一条主线就是编译期校验。

### `query!`

适合直接返回匿名记录：

```rust
let rec = sqlx::query!(
    r#"
    INSERT INTO todos (description)
    VALUES ($1)
    RETURNING id
    "#,
    description
)
.fetch_one(pool)
.await?;
```

### `query_as!`

适合映射到明确结构体：

```rust
struct Todo {
    id: i64,
    description: String,
    done: bool,
}

let todos = sqlx::query_as!(
    Todo,
    r#"
    SELECT id, description, done
    FROM todos
    ORDER BY id
    "#
)
.fetch_all(&pool)
.await?;
```

## 为什么编译期 SQL 校验有价值

它能尽早发现一批高价值问题：

- SQL 语法错误
- 参数类型不匹配
- 字段名或返回列不匹配

这比“服务跑起来后第一次打到这里才发现错”稳很多。

## 但也要知道它的前提

官方文档明确指出，编译期校验通常依赖：

- 构建时能拿到数据库 schema 信息
- 或使用离线准备数据的方式

这也是为什么 `sqlx` 实践里经常会出现：

- `DATABASE_URL`
- `cargo sqlx prepare`
- `cargo sqlx prepare --check`

工程上要提前把这件事纳入 CI，而不是等到发布前才想起来。

## `query_as` 和宏并不是二选一宗教战

可以简单理解：

- 宏更强调编译期检查和静态映射
- 非宏 API 更灵活，适合某些动态场景

默认情况下，如果查询稳定、结构明确，优先考虑带校验的宏路径通常更稳。

## 事务要显式管理

`sqlx` 官方文档给出的主线是：

```rust
use sqlx::{PgPool, Postgres, Transaction};

async fn transfer(
    pool: &PgPool,
    from_id: i64,
    to_id: i64,
    amount: i64,
) -> Result<(), sqlx::Error> {
    let mut tx: Transaction<Postgres> = pool.begin().await?;

    sqlx::query!("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query!("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(())
}
```

这里要注意：

- 事务对象本身就是执行器
- 没有 `commit` 时，drop 通常意味着回滚
- 但工程上不要过度依赖“隐式回滚”作为主路径，最好写清边界

## 事务设计不要只看 API，要看边界

真正需要想清楚的是：

- 一个事务到底包住哪些语句
- 事务里是否夹杂外部 RPC
- 锁持有时间会不会过长
- 重试和幂等策略怎么做

如果你想把幂等键、条件更新、状态推进和 Outbox 为什么要围绕事务边界设计单独理顺，继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

不要因为 `sqlx` 让事务 API 看起来顺手，就把所有业务流程都塞进一个大事务里。

## 迁移是数据库工程的一部分，不是附属脚本

官方支持：

- `migrate` feature
- `sqlx::migrate!()`
- `cargo sqlx migrate ...`

最常见主线是：

```rust
sqlx::migrate!("./migrations").run(&pool).await?;
```

这意味着：

- migration 目录应进入工程管理
- 启动阶段或发布流程要明确何时跑迁移
- 迁移本身要纳入版本控制和回滚策略

## 常见 CLI 动作

官方文档主线里常见这些命令：

```bash
cargo sqlx migrate add create_users_table
cargo sqlx migrate run --database-url postgres://localhost/mydb
cargo sqlx prepare --database-url postgres://localhost/mydb
cargo sqlx prepare --check --database-url postgres://localhost/mydb
```

实操里最有价值的是：

- `migrate add`
- `migrate run`
- `prepare --check`

## repository/service 分层很重要

不要把 SQL 全写进 HTTP handler。

更稳的结构通常是：

```text
src/
├── state.rs
├── error.rs
├── dto/
├── service/
└── repo/
```

常见分工：

- `repo/*`：只关心 SQL 和数据库映射
- `service/*`：负责业务规则和事务边界
- `routes/*`：只关心 HTTP 输入输出

如果你想把请求 DTO、领域对象、数据库 row 和响应 DTO 的分层边界单独理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

如果你想把列表查询里的过滤、排序、offset / cursor 和 `count(*)` 成本单独理顺，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

如果你想把 tenant scope、租户内唯一约束和多租户共享表隔离边界单独理顺，继续看：

- [Rust 多租户与数据隔离实践](./multi-tenant-and-data-isolation-practice.md)

如果你想把事务边界、条件更新、乐观锁、`FOR UPDATE` 和锁冲突排障单独理顺，继续看：

- [Rust 事务、锁与并发更新实践](./transaction-locking-and-concurrent-update-practice.md)

如果你想把 expand / contract、历史数据回填、双读双写和兼容发布单独理顺，继续看：

- [Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)

## 错误边界要分层

数据库访问最容易混成一团的地方，是错误处理。

比较稳的原则：

1. `sqlx::Error` 先留在 repo 层或基础设施边界。
2. service 层补业务语义。
3. HTTP 层决定状态码和响应体。

否则你很快会出现：

- 所有错误都是 500
- 所有错误都只剩字符串
- 业务冲突和数据库故障分不清

## 连接池配置不要只抄默认值

至少要根据服务特点思考：

- 最大连接数
- 建连超时
- 池大小和数据库实例限制
- 并发量和事务时长

Rust 本身不会替你解决数据库容量问题，连接池只是边界控制的一部分。

## 常见误区

### 误区 1：所有 SQL 都直接写在 handler 里

短期快，长期会让测试、复用和事务边界都变糊。

### 误区 2：用了 `sqlx` 就不需要理解数据库

不是。事务、锁、索引、连接池、慢查询这些问题并不会消失。

### 误区 3：编译期检查等于运行时不会出错

编译期能发现结构和类型问题，但发现不了：

- 数据库宕机
- 超时
- 锁冲突
- 业务约束冲突

### 误区 4：迁移只是开发阶段临时动作

真实项目里，迁移是发布与演进的一部分，必须进入标准流程。

## 自检

你至少应该能回答：

1. 为什么数据库池应该作为共享状态，而不是每请求新建？
2. `query!` 和 `query_as!` 的核心价值是什么？
3. 为什么编译期 SQL 校验仍然不能替代运行时错误处理？
4. 事务边界为什么应该放在 service 层思考，而不是只在 repo 层看语句？
5. `migrate!` 和 `cargo sqlx prepare --check` 分别在工程里解决什么问题？

这些问题理顺后，`sqlx` 才能真正成为 Rust 服务工程的一部分，而不是“会连数据库”的演示代码。
