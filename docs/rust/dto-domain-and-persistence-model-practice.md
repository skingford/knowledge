---
title: Rust DTO、领域模型与存储模型分层实践
description: 从 HTTP DTO、外部 API DTO、领域模型到数据库存储模型，整理 Rust 服务里最容易混乱的数据边界与映射方式。
---

# Rust DTO、领域模型与存储模型分层实践

Rust 后端和工具项目写到一定阶段，经常会出现一种“前期很省事，后面越来越乱”的结构：

- 一个结构体既当请求体
- 又当数据库行映射
- 又当业务领域对象
- 最后还直接拿去做响应体

小 demo 当然可以先这么写，但项目一大，这种“一个结构体包打天下”的模式通常会带来一串问题：

- HTTP 字段命名把内部模型拖偏
- 数据库字段和业务语义绑死
- 外部 API 协议细节渗进核心逻辑
- 改一个字段要联动很多层
- 测试很难只测某一层边界

这页讲的就是：Rust 里怎么把 DTO、领域模型和存储模型拆清楚。

## 先给一个结论

更稳的分层通常是：

- DTO：负责协议输入输出
- 领域模型：负责业务语义和规则
- 存储模型：负责数据库映射

如果还有外部第三方集成，通常再补一层：

- 外部 API DTO：负责和上游 / 下游系统通信

这几层不是为了“架构感”，而是因为它们的变化来源根本不同。

## 为什么一个结构体不该默认承担所有角色

### DTO 的变化来自协议

例如：

- JSON 字段名变了
- 某个字段改成可选
- 响应里要隐藏内部字段
- 对外接口要兼容旧版本

这些变化是“接口契约变化”。

### 领域模型的变化来自业务

例如：

- 状态机新增状态
- 某条业务规则变严格
- 一个值必须先校验后创建
- 某些字段在业务里绝不能缺失

这些变化是“业务语义变化”。

### 存储模型的变化来自数据库和持久化

例如：

- 表结构拆分
- 列名变化
- join 结果变了
- 某些字段要冗余存储

这些变化是“存储实现变化”。

如果把三者硬塞进一个结构体里，任何一层变化都会把另外两层拖着一起动。

## 一个务实的数据流

大多数 Rust 服务更稳的数据流通常是：

1. route 层接收请求 DTO
2. service 层把 DTO 转成领域命令或领域模型
3. repo 层把领域模型或命令映射成存储模型 / SQL 参数
4. repo 层读出存储模型
5. service 层把结果整理成领域对象
6. route 层再映射成响应 DTO

如果还会调用外部 API，通常是：

1. service 生成外部请求 DTO
2. gateway / client 发请求
3. 解析外部响应 DTO
4. 再映射成内部领域对象

一个很重要的原则是：

**跨边界时可以映射，核心规则不要被边界协议反向污染。**

## 先分清 4 类常见模型

### 1. 请求 DTO

例如：

- `CreateUserRequest`
- `UpdateProfileRequest`
- `SearchUsersQuery`

职责通常是：

- 承接 HTTP body / query / path
- 做协议层结构反序列化
- 表达“请求里长什么样”

它更关注：

- `serde` 注解
- 字段兼容性
- 可选字段
- 默认值

### 2. 响应 DTO

例如：

- `UserResponse`
- `OrderDetailResponse`

职责通常是：

- 控制对外字段暴露
- 做响应结构序列化
- 维持对外协议稳定

它更关注：

- 字段命名
- 脱敏
- 兼容性
- 嵌套结构形态

### 3. 领域模型

例如：

- `User`
- `Order`
- `Payment`

职责通常是：

- 承接业务语义
- 承接状态机和领域规则
- 保证“合法对象才能进入核心逻辑”

它更关注：

- 构造约束
- 状态转换
- 业务不变量
- 方法和行为

### 4. 存储模型

例如：

- `UserRow`
- `OrderRecord`
- `PaymentEntity`

职责通常是：

- 对接数据库列
- 适配 `sqlx::FromRow` 这类持久化映射
- 表达“数据库长什么样”

它更关注：

- 列名
- 空值形态
- join 结果
- 查询返回结构

## 一个最小例子

下面是一个比较典型的拆法：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone)]
pub struct User {
    pub id: UserId,
    pub email: Email,
    pub display_name: String,
    pub status: UserStatus,
}

#[derive(Debug, sqlx::FromRow)]
pub struct UserRow {
    pub id: i64,
    pub email: String,
    pub display_name: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UserResponse {
    pub id: i64,
    pub email: String,
    pub display_name: String,
}
```

这四个结构体看起来像“字段重复”，但它们表达的是四种不同语义：

- 请求长什么样
- 业务对象长什么样
- 数据库结果长什么样
- 对外响应长什么样

重复字段本身不是问题，边界不清才是问题。

## 映射代码不要怕“多写一层”

Rust 项目里经常有人为了少写几个 `From` / `TryFrom`，硬把模型合并。

但映射代码的价值很高，因为它让边界变得显式。

### 请求 DTO -> 领域命令

```rust
pub struct CreateUser {
    pub email: Email,
    pub display_name: String,
}

impl TryFrom<CreateUserRequest> for CreateUser {
    type Error = CreateUserValidationError;

    fn try_from(value: CreateUserRequest) -> Result<Self, Self::Error> {
        Ok(Self {
            email: Email::parse(value.email)?,
            display_name: value.display_name.trim().to_owned(),
        })
    }
}
```

这一步的重点不是“搬字段”，而是：

- 把字符串邮箱解析成领域值对象
- 在进入核心逻辑前做规则校验
- 把协议层的宽松输入收敛成领域层的严格输入

### 存储模型 -> 领域模型

```rust
impl TryFrom<UserRow> for User {
    type Error = UserDataError;

    fn try_from(row: UserRow) -> Result<Self, Self::Error> {
        Ok(Self {
            id: UserId::new(row.id),
            email: Email::parse(row.email)?,
            display_name: row.display_name,
            status: UserStatus::parse(row.status)?,
        })
    }
}
```

这一步的重点是：

- 不直接信任数据库里的字符串一定是合法领域状态
- 把持久化世界和业务世界之间的转换写清楚

### 领域模型 -> 响应 DTO

```rust
impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id.value(),
            email: user.email.as_str().to_owned(),
            display_name: user.display_name,
        }
    }
}
```

这一步的重点是：

- 控制对外暴露字段
- 不把内部状态或实现细节直接抛出去

## `From`、`TryFrom` 还是手写函数

没有唯一答案，但一个务实建议是：

- 无失败映射：优先 `From`
- 有校验或解析：优先 `TryFrom`
- 上下文很多、转换不直观：用显式函数

例如这些场景更适合手写函数而不是 trait：

- 需要注入当前时间
- 需要查数据库补字段
- 需要组合多个对象
- 需要补 trace / actor / tenant 上下文

不要为了“所有映射都统一用 trait”而把转换逻辑写得难懂。

## 哪一层该做什么校验

一个高频混乱点是：校验到底放哪一层？

### DTO 层

更适合做：

- 字段结构解析
- 基本格式约束
- `serde` 默认值
- query / path / body 反序列化

它回答的是：

- 这个请求“能不能被解析”

### 领域层

更适合做：

- 业务不变量
- 状态机合法性
- 值对象构造
- 跨字段规则

它回答的是：

- 这个对象“在业务上是否合法”

### 存储层

更适合做：

- 唯一约束
- 外键约束
- 查询结果映射
- 持久化错误分类

它回答的是：

- 这个数据“能不能被正确存取”

如果把所有校验都扔到 DTO 层，领域规则通常会越来越薄弱；如果把所有校验都拖到 repo 层，错误又会太晚暴露。

如果你想把 serde 解析、DTO 基础校验、领域不变量和错误映射这条输入边界单独理顺，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## `serde` 派生不要默认加满所有内部类型

很多项目会顺手给领域模型也加上：

- `Serialize`
- `Deserialize`
- `sqlx::FromRow`

短期方便，长期却容易让边界糊掉。

更稳的原则通常是：

- DTO：优先承担 `Serialize` / `Deserialize`
- 存储模型：优先承担 `FromRow`
- 领域模型：优先承担业务方法和规则

不是说领域模型永远不能派生这些 trait，而是不要把它当默认配置。

## 外部 API DTO 要单独想

调用第三方系统时，最容易犯的错误之一是：

- 直接把第三方响应结构当成内部领域模型

这会带来几个问题：

- 上游字段命名污染内部语义
- 上游新增噪音字段影响内部结构
- 某些“能解析成功”的值并不满足内部规则

更稳的拆法通常是：

1. `provider_dto.rs` 定义第三方请求 / 响应 DTO
2. `gateway.rs` 只负责通信和协议映射
3. `service` 再把外部 DTO 转成内部领域对象

如果你正在处理 `reqwest`、认证、超时和外部响应 DTO，可以继续看：

- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

## route、service、repo 三层里的模型边界

### route

更适合出现：

- request DTO
- response DTO
- extractor 类型

### service

更适合出现：

- 领域命令
- 领域模型
- 业务错误

### repo

更适合出现：

- row / entity / record
- 查询参数对象
- 持久化错误

如果 route 直接操作 `UserRow`，或 repo 直接返回 HTTP 响应 DTO，通常说明边界开始乱了。

## 一个够用的目录结构

```text
src/
├── dto/
│   ├── request.rs
│   └── response.rs
├── domain/
│   ├── mod.rs
│   ├── user.rs
│   └── value_objects.rs
├── repo/
│   ├── mod.rs
│   └── user_row.rs
├── routes/
├── service/
└── mapper/
    └── user_mapper.rs
```

不一定非要有 `mapper/` 目录。

如果项目还小，也可以把映射逻辑放在：

- `impl From`
- `impl TryFrom`
- `service` 内部
- `dto` / `repo` 模块附近

关键不是目录名，而是映射责任别四处散落。

## 什么时候可以先复用一个结构体

不是所有项目一开始都要拆满四层。

如果你同时满足下面这些条件，可以暂时局部复用：

- 项目很小
- 结构稳定
- 没有复杂业务规则
- 没有多入口或多协议边界
- 数据库模型和对外模型几乎一致

但更稳的做法是：

- 一开始允许局部复用
- 一旦边界开始分叉，就尽快拆开

不要等一个结构体已经挂满：

- `serde` 注解
- 数据库注解
- 校验逻辑
- 业务方法
- 响应裁剪

再来重构，那时成本通常会高很多。

## 常见误区

### 误区 1：为了省事，把请求 DTO、领域模型、数据库模型合成一个

这通常只是在把未来重构成本前置成“暂时看不见的复杂度”。

### 误区 2：为了抽象感，映射层拆得过碎

映射要显式，但不需要一开始就为每个结构体单独建一堆空模块。

### 误区 3：把 `serde` 规则直接带进所有内部类型

`rename_all = "camelCase"` 这类协议细节不应该默认统治整个核心模型。

### 误区 4：数据库能查出来，就当成领域上一定合法

历史脏数据、迁移中状态和多版本兼容都可能打破这个假设。

### 误区 5：响应 DTO 直接把内部对象完整透出

这往往会泄露不该暴露的字段，也会让后续兼容性越来越难维护。

## 推荐回查入口

- 序列化边界：[Serde 与数据序列化实践](./serde-and-data-serialization.md)
- Web 输入输出：[Axum Web 服务实践](./axum-web-service-practice.md)
- API 版本治理：[Rust API Versioning、兼容演进与弃用治理实践](./api-versioning-and-compatibility-governance-practice.md)
- 字段暴露与日志脱敏：[Rust 数据脱敏、隐私字段与日志安全实践](./data-masking-privacy-and-log-safety-practice.md)
- 数据访问边界：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- Schema 演进主线：[Rust 数据库迁移、Schema 演进与兼容发布实践](./database-migration-and-schema-evolution-practice.md)
- 列表查询边界：[Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)
- 文件元数据边界：[Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)
- 项目骨架：[Rust 后端项目骨架](./backend-project-skeleton.md)
- 外部调用 DTO：[Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)
- 工程组织：[项目结构、crate 组织与 API 设计](./project-structure-and-api-design.md)

## 推荐资料

- [Serde Attributes](https://serde.rs/attributes.html)
- [axum `Json`](https://docs.rs/axum/latest/axum/struct.Json.html)
- [SQLx `FromRow`](https://docs.rs/sqlx/latest/sqlx/trait.FromRow.html)

## 自检

你至少应该能回答：

1. 为什么请求 DTO、领域模型和存储模型的变化来源不同？
2. 什么情况下 `TryFrom` 比 `From` 更适合承接映射？
3. 为什么外部 API 响应结构不应该直接等同于内部领域模型？
4. 为什么数据库能读出来的数据不一定已经满足业务不变量？
5. 什么时候可以先局部复用一个结构体，什么时候应该尽快拆层？

这些问题理顺后，Rust 服务的数据边界通常会清楚很多。
