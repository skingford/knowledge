---
title: Rust GraphQL 与 async-graphql 实践
description: 以 async-graphql 为核心，覆盖 Schema 定义、Query/Mutation、DataLoader、Subscription、Axum 集成、分页与复杂度控制，串成 Rust GraphQL 服务的工程主线。
search: false
---

# Rust GraphQL 与 async-graphql 实践

> 这页不是 async-graphql API 手册，而是帮你把 Schema、Query、Mutation、DataLoader、订阅和 Axum 集成串成一条可落地的工程主线。

## 什么时候该选 GraphQL

REST 在大多数场景下足够好。GraphQL 值得考虑的场景通常是：

- 前端需要灵活裁剪返回字段，后端不想为每个页面写一个专用接口
- 一个页面需要聚合多个资源，REST 要打多个请求
- 移动端和 Web 端对同一份数据的字段需求差异大
- 实时数据推送场景较多，Subscription 比轮询更自然

如果你的服务是内部微服务间通信、接口稳定且调用方固定，REST 通常更简单直接。

## async-graphql 在 Rust 生态中的位置

Rust GraphQL 生态主要有两个库：

| 维度 | async-graphql | juniper |
|---|---|---|
| 定义方式 | derive 宏 + code-first | 宏 + schema-first/code-first |
| async 支持 | 原生 async/await | 后期加入 |
| 特性覆盖 | Subscription、DataLoader、Federation、复杂度限制 | 基础 Query/Mutation |
| 维护活跃度 | 持续活跃 | 维护节奏较慢 |

如果你需要 Subscription、DataLoader 或 Apollo Federation，async-graphql 基本是唯一选择。

## Schema 与类型系统

async-graphql 的核心思路是：用 Rust struct + derive 宏定义 GraphQL 类型，编译期检查类型安全。

### SimpleObject -- 纯数据类型

字段直接从 struct 暴露，不需要手写 resolver：

```rust
use async_graphql::*;

#[derive(SimpleObject)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub display_name: Option<String>,
}
```

### ComplexObject -- 数据 + 计算字段

当一个 SimpleObject 需要额外的计算字段或关联查询时：

```rust
#[derive(SimpleObject)]
#[graphql(complex)]
pub struct Post {
    pub id: i64,
    pub title: String,
    pub author_id: i64,
}

#[ComplexObject]
impl Post {
    async fn author(&self, ctx: &Context<'_>) -> Result<User> {
        let loader = ctx.data_unchecked::<DataLoader<UserLoader>>();
        let user = loader.load_one(self.author_id).await?;
        user.ok_or_else(|| Error::new("Author not found"))
    }
}
```

### InputObject -- 输入参数

```rust
#[derive(InputObject)]
pub struct CreatePostInput {
    pub title: String,
    pub content: String,
    #[graphql(default)]
    pub published: bool,
}
```

`#[graphql(default)]` 对应 GraphQL schema 里的默认值，`#[graphql(default = "some_value")]` 可以指定具体默认值。

### Enum

```rust
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum PostStatus {
    Draft,
    Published,
    Archived,
}
```

### Schema 构建

Schema 是 Query + Mutation + Subscription 的组合：

```rust
use async_graphql::*;

pub type AppSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

pub fn build_schema(pool: PgPool) -> AppSchema {
    Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
        .data(pool)
        .data(DataLoader::new(UserLoader::new(), tokio::spawn))
        .limit_depth(10)
        .limit_complexity(200)
        .finish()
}
```

`Schema::build` 接受三个根类型。如果不需要 Mutation 或 Subscription，用 `EmptyMutation` / `EmptySubscription` 占位。

## Query 与 Mutation

### 基本 resolver

```rust
pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn user(&self, ctx: &Context<'_>, id: i64) -> Result<Option<User>> {
        let pool = ctx.data_unchecked::<PgPool>();
        let user = sqlx::query_as!(User, "SELECT id, email, display_name FROM users WHERE id = $1", id)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }
}
```

### Context 注入

`ctx.data::<T>()` 获取通过 `Schema::build().data()` 或请求级 `.data()` 注入的共享状态。常见注入对象：

- 数据库连接池（`PgPool`）
- 当前认证用户信息
- DataLoader 实例
- 配置对象

```rust
// 请求级注入（每个请求不同的数据，比如当前用户）
let request = Request::new(query)
    .data(current_user);
```

### Mutation

```rust
pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn create_post(&self, ctx: &Context<'_>, input: CreatePostInput) -> Result<Post> {
        let pool = ctx.data_unchecked::<PgPool>();
        let current_user = ctx.data::<CurrentUser>()?;

        let post = sqlx::query_as!(
            Post,
            "INSERT INTO posts (title, content, author_id, published) VALUES ($1, $2, $3, $4) RETURNING *",
            input.title,
            input.content,
            current_user.id,
            input.published,
        )
        .fetch_one(pool)
        .await?;

        Ok(post)
    }
}
```

### 错误处理

async-graphql 的错误体系基于 `async_graphql::Error`，支持通过 extensions 携带结构化信息：

```rust
use async_graphql::ErrorExtensions;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Resource not found")]
    NotFound,
    #[error("Permission denied")]
    Forbidden,
    #[error("Validation failed: {0}")]
    Validation(String),
}

impl ErrorExtensions for AppError {
    fn extend(&self) -> Error {
        Error::new(format!("{}", self)).extend_with(|_err, e| match self {
            AppError::NotFound => e.set("code", "NOT_FOUND"),
            AppError::Forbidden => e.set("code", "FORBIDDEN"),
            AppError::Validation(msg) => {
                e.set("code", "VALIDATION_ERROR");
                e.set("detail", msg.as_str());
            }
        })
    }
}
```

在 resolver 里使用：

```rust
async fn post(&self, ctx: &Context<'_>, id: i64) -> Result<Post> {
    let pool = ctx.data_unchecked::<PgPool>();
    let post = sqlx::query_as!(Post, "SELECT * FROM posts WHERE id = $1", id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound.extend())?;
    Ok(post)
}
```

## DataLoader

### N+1 问题

假设查询 10 篇文章，每篇文章的 `author` 字段各发一次 SQL，总共 1 + 10 次查询。DataLoader 的作用是把这 10 次 author 查询合并成一次批量查询。

### 实现 Loader trait

```rust
use async_graphql::dataloader::Loader;
use std::collections::HashMap;

pub struct UserLoader {
    pool: PgPool,
}

impl UserLoader {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

impl Loader<i64> for UserLoader {
    type Value = User;
    type Error = async_graphql::Error;

    async fn load(&self, keys: &[i64]) -> Result<HashMap<i64, Self::Value>, Self::Error> {
        let users = sqlx::query_as!(
            User,
            "SELECT id, email, display_name FROM users WHERE id = ANY($1)",
            keys
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(users.into_iter().map(|u| (u.id, u)).collect())
    }
}
```

### 注册 DataLoader

```rust
let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
    .data(DataLoader::new(UserLoader::new(pool.clone()), tokio::spawn))
    .finish();
```

### 缓存边界

DataLoader 的缓存是请求级别的，同一个 GraphQL 请求内相同 key 不会重复查询，但跨请求不共享。如果你需要跨请求缓存，应该在 DataLoader 下层加 Redis 或内存缓存，而不是依赖 DataLoader 自身。

## 订阅（Subscription）

### 基本定义

```rust
use async_graphql::*;
use futures_util::stream::Stream;
use tokio::sync::broadcast;
use tokio_stream::wrappers::BroadcastStream;

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn post_created(&self, ctx: &Context<'_>) -> impl Stream<Item = Post> {
        let rx = ctx.data_unchecked::<broadcast::Sender<Post>>().subscribe();
        BroadcastStream::new(rx).filter_map(|result| result.ok())
    }
}
```

### 与 WebSocket 集成

async-graphql 支持 `graphql-ws` 协议（GraphQL over WebSocket）。和 Axum 集成时通常这样挂载：

```rust
use async_graphql_axum::GraphQLSubscription;

let app = Router::new()
    .route("/ws", GraphQLSubscription::new(schema.clone()));
```

### 背压和连接管理

- 用 `broadcast::channel` 时注意 `capacity`，消费太慢的客户端会收到 `Lagged` 错误
- 生产环境建议对 WebSocket 连接数设上限
- 考虑用 `tokio::time::timeout` 包装心跳，及时清理僵尸连接

## 与 Axum 集成

### 路由挂载

```rust
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use axum::{extract::State, routing::post, Router};

async fn graphql_handler(
    State(schema): State<AppSchema>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

pub fn graphql_router(schema: AppSchema) -> Router {
    Router::new()
        .route("/graphql", post(graphql_handler))
        .route("/ws", GraphQLSubscription::new(schema.clone()))
        .with_state(schema)
}
```

### GraphQL Playground

开发环境通常会挂一个 GraphiQL 页面：

```rust
use async_graphql::http::GraphiQLSource;
use axum::response::{Html, IntoResponse};

async fn graphiql() -> impl IntoResponse {
    Html(GraphiQLSource::build().endpoint("/graphql").subscription_endpoint("/ws").finish())
}

// 只在开发环境启用
let app = Router::new()
    .route("/graphql", post(graphql_handler))
    .route("/graphiql", get(graphiql))
    .route("/ws", GraphQLSubscription::new(schema.clone()))
    .with_state(schema);
```

### 认证 middleware 与 GraphQL context

常见做法是在 Axum middleware 层解析 token，把用户信息注入到 GraphQL 请求的 context 中：

```rust
async fn graphql_handler(
    State(schema): State<AppSchema>,
    Extension(current_user): Extension<Option<CurrentUser>>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let mut request = req.into_inner();
    if let Some(user) = current_user {
        request = request.data(user);
    }
    schema.execute(request).await.into()
}
```

这样 resolver 里就可以通过 `ctx.data::<CurrentUser>()` 获取当前用户，而认证逻辑完全由 Axum middleware 处理。

## 分页与复杂查询

### Cursor-based pagination

async-graphql 内置了 Relay Connection 规范支持：

```rust
use async_graphql::types::connection::*;

#[Object]
impl QueryRoot {
    async fn posts(
        &self,
        ctx: &Context<'_>,
        after: Option<String>,
        before: Option<String>,
        first: Option<i32>,
        last: Option<i32>,
    ) -> Result<Connection<i64, Post, EmptyFields, EmptyFields>> {
        query(after, before, first, last, |after, before, first, last| async move {
            let pool = ctx.data_unchecked::<PgPool>();
            // 根据 after/before cursor 构建 WHERE 条件，用 id 做 cursor
            let posts = fetch_posts_by_cursor(pool, after, before, first).await?;

            let has_previous = after.is_some();
            let has_next = posts.len() as i32 == first.unwrap_or(20);
            let mut connection = Connection::new(has_previous, has_next);
            connection.edges.extend(posts.into_iter().map(|p| Edge::new(p.id, p)));
            Ok::<_, async_graphql::Error>(connection)
        })
        .await
    }
}
```

cursor 通常用主键或时间戳，不要用 offset。具体设计参考 [分页与排序实践](./pagination-filter-and-sorting-practice.md)。

### 查询复杂度限制

不做限制的 GraphQL 服务等于给客户端一个可以任意构造昂贵查询的入口。

```rust
let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
    .limit_depth(10)          // 最大嵌套深度
    .limit_complexity(200)    // 最大复杂度分数
    .finish();
```

也可以对单个字段标注复杂度权重：

```rust
#[Object]
impl QueryRoot {
    #[graphql(complexity = "first * child_complexity")]
    async fn posts(&self, first: usize) -> Vec<Post> {
        // ...
        todo!()
    }
}
```

这样 `posts(first: 100) { author { name } }` 的复杂度是 `100 * 1 = 100`，超出限制的查询会被直接拒绝。

## 工程实践

### Schema 文件导出与版本管理

```rust
// 构建脚本或 CLI 命令中导出 SDL
fn export_schema() {
    let schema = build_schema(/* ... */);
    std::fs::write("schema.graphql", schema.sdl()).unwrap();
}
```

把 `schema.graphql` 纳入版本控制，CI 中检查 SDL 变更是否有对应的 changelog 或迁移说明。

### code-first vs schema-first

async-graphql 是 code-first 路线 -- 类型定义在 Rust 代码里，SDL 是导出产物。这意味着：

- 类型安全由 Rust 编译器保证
- 前端拿到的 schema 总是和后端代码一致
- 缺点是前端无法先行定义 schema 然后后端去实现

如果团队需要 schema-first 协作，可以用导出的 SDL 做 breaking change 检测（比如 `graphql-inspector`），但源头仍然在 Rust 代码。

### 性能：字段级 tracing

async-graphql 支持 Apollo Tracing 扩展，可以看到每个字段的解析耗时：

```rust
use async_graphql::extensions::ApolloTracing;

let schema = Schema::build(QueryRoot, MutationRoot, EmptySubscription)
    .extension(ApolloTracing)
    .finish();
```

生产环境建议按需开启，或者改用 OpenTelemetry 集成做更细粒度的链路追踪。

### 与 REST 并存

GraphQL 不需要替代所有 REST 接口。常见的并存模式：

- 文件上传、Webhook 回调、健康检查等用 REST
- 前端数据聚合、灵活查询用 GraphQL
- 内部服务间调用用 REST 或 gRPC
- 在同一个 Axum 应用里同时挂载 REST 路由和 GraphQL 路由

```rust
let app = Router::new()
    .route("/health", get(health_check))
    .route("/api/webhooks/:provider", post(webhook_handler))
    .route("/graphql", post(graphql_handler))
    .route("/ws", GraphQLSubscription::new(schema.clone()))
    .with_state(app_state);
```

## 常见误区

### "GraphQL 就该取代 REST"

GraphQL 解决的是"前端灵活查询"问题，不是"所有 API 通信"问题。文件上传、简单 CRUD、服务间通信，REST 往往更直接。强行全部 GraphQL 化只会增加复杂度。

### "所有数据都应该暴露到 GraphQL"

GraphQL schema 是面向客户端的 API 契约，不是数据库的镜像。内部字段（密码哈希、内部状态码、审计字段）不应该出现在 schema 里。设计 schema 时应该从"客户端需要什么"出发，而不是"数据库有什么"。

### 忽略查询深度和复杂度限制

没有 `limit_depth` 和 `limit_complexity` 的 GraphQL 服务，等于允许客户端构造任意复杂的查询把服务打挂。这不是可选优化，而是基本安全措施。

### DataLoader 不等于缓存

DataLoader 解决的是同一请求内的 N+1 问题，它的"缓存"是请求级别的。跨请求的缓存需要在更低层（Redis、内存缓存）实现。把 DataLoader 当缓存层用会导致：

- 每个请求仍然打数据库
- 缓存失效逻辑混乱
- 性能提升远不如预期

### 不导出 SDL 就上线

没有 SDL 文件，前端无法提前生成类型，CI 无法检测 breaking change。`schema.sdl()` 导出 + 版本控制是基本工程纪律。

## 自检问题

1. 你能说清 `SimpleObject`、`ComplexObject`、`Object` 三个宏的适用场景区别吗？
2. DataLoader 的缓存边界是什么？跨请求的缓存应该放在哪一层？
3. 如果不设置 `limit_depth` 和 `limit_complexity`，会有什么后果？你的服务设了吗？
4. 认证信息是在哪一层注入到 GraphQL context 的？resolver 里应该怎么拿？
5. Cursor-based pagination 和 offset pagination 的核心区别是什么？为什么 GraphQL 社区更推荐 cursor？
6. 你的 GraphQL 服务导出了 SDL 文件并纳入版本控制了吗？CI 能检测 breaking change 吗？
7. 什么场景应该用 REST 而不是 GraphQL？你的项目里 GraphQL 和 REST 的边界划在哪里？

## 交叉引用

- [Axum Web 服务实践](./axum-web-service-practice.md) -- Axum 路由、State、Middleware 等基础，GraphQL 集成的前置知识
- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md) -- 分页设计的通用主线，cursor vs offset 的深入讨论
