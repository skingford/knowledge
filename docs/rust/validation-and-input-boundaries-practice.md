---
title: Rust 输入校验与边界建模实践
description: 从 serde 解析、DTO 字段校验、领域不变量、axum 输入边界到错误映射与测试，整理 Rust 服务的输入校验主线。
search: false
---

# Rust 输入校验与边界建模实践

Rust 服务里有一类问题很容易被低估：

- 请求能解析，但业务上根本不合法
- 字段类型对了，值却明显越界
- handler 里到处 `if x.is_empty()` 和 `if y < 0`
- 错误不是太少，而是全混成一句 `"invalid request"`

这类问题的共同点是：

**输入边界没有被清晰建模。**

这页补的就是 Rust 服务里“输入从协议进入业务时，应该怎么分层校验”的主线。

## 先分清：解析成功，不等于业务合法

一个最常见误区是：

- `serde` 反序列化成功了
- 所以请求就算合法了

这并不成立。

更稳的拆法通常是：

1. 先解析协议结构
2. 再做字段和值约束
3. 再做领域不变量校验
4. 最后让数据库约束做最终兜底

所以你要区分至少四类问题：

- 结构不对
- 字段值不对
- 业务规则不对
- 持久化约束不对

## 输入校验通常有 4 层

### 1. 协议 / 传输层

回答的是：

- 这个输入能不能被解析

典型问题：

- JSON 结构不匹配
- query 参数类型不对
- path 参数解析失败
- 必填字段缺失

这层通常由：

- `serde`
- `axum` extractor

来承担。

### 2. DTO 层

回答的是：

- 字段格式是否基本合理

典型问题：

- 字符串为空
- 长度超限
- 邮箱格式不对
- 枚举值不在允许集合

### 3. 领域层

回答的是：

- 这个输入转成业务对象后，是否满足业务不变量

典型问题：

- 开始时间不能晚于结束时间
- 订单不能取消已完成状态
- 金额必须大于 0
- 用户不能给自己转账

### 4. 存储层

回答的是：

- 最终能不能安全落库

典型问题：

- unique constraint
- foreign key
- 条件更新失败
- 版本冲突

不要把所有校验都堆到同一层。

## 更务实的分工

一个很稳的原则通常是：

- `serde` 负责结构和类型
- DTO 负责基础格式
- 领域对象负责业务不变量
- 数据库负责最终一致性兜底

这样错误暴露会更早，边界也更清楚。

如果你想把 DTO、领域模型和存储模型的职责边界系统理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## 不要把 handler 变成巨型校验器

坏味道通常像这样：

- `Json<T>` 进来以后
- handler 里先写十几个 `if`
- 再拼几条字符串错误
- 然后继续调 service

短期看似直接，长期通常会带来：

- 校验逻辑散落
- 复用困难
- 错误风格不一致
- 单测越来越难写

更稳的做法通常是：

1. handler 只承接输入和错误映射
2. DTO 做基础校验
3. `TryFrom` / smart constructor 进入领域对象
4. service 只消费已经合法的输入

## `TryFrom` 和值对象是很实用的组合

Rust 很适合把“可能失败的创建”显式表达出来。

例如一个邮箱字段，与其到处传 `String`，不如先收成一个值对象：

```rust
use std::convert::TryFrom;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Email(String);

#[derive(Debug)]
pub enum EmailError {
    Empty,
    TooLong,
    InvalidFormat,
}

impl TryFrom<String> for Email {
    type Error = EmailError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim().to_lowercase();

        if value.is_empty() {
            return Err(EmailError::Empty);
        }

        if value.len() > 254 {
            return Err(EmailError::TooLong);
        }

        if !value.contains('@') {
            return Err(EmailError::InvalidFormat);
        }

        Ok(Self(value))
    }
}
```

这个方向的价值在于：

- 非法值根本进不了领域层
- 合法性约束只写一处
- service 不必反复判断同一字段

## DTO 更适合承接“输入长什么样”，不适合承接所有业务语义

一个很常见组合是：

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub nickname: String,
}

#[derive(Debug)]
pub struct CreateUserCommand {
    pub email: Email,
    pub nickname: Nickname,
}

impl TryFrom<CreateUserRequest> for CreateUserCommand {
    type Error = ValidationError;

    fn try_from(value: CreateUserRequest) -> Result<Self, Self::Error> {
        Ok(Self {
            email: value.email.try_into().map_err(ValidationError::Email)?,
            nickname: value.nickname.try_into().map_err(ValidationError::Nickname)?,
        })
    }
}
```

这个分层里：

- `CreateUserRequest` 负责协议输入
- `CreateUserCommand` 负责进入业务前的合法命令
- 失败通过 `TryFrom` 显式表达

## 基础格式校验和领域规则不要混成一锅

一个很实用的判断方式：

### 更像基础格式校验

- 不能为空
- 长度范围
- 数字范围
- 时间格式
- 邮箱 / 手机号基本格式

### 更像领域规则

- 用户名在当前租户下必须唯一
- 折扣不能超过订单总额
- 当前状态不允许执行该操作
- 生效时间必须早于失效时间

前者通常可以更早失败，后者更适合进入领域层或 service 层判断。

## `serde` 负责映射，不负责兜底全部合法性

一个更稳的心智模型是：

- `serde` 解决“长得像不像”
- 领域校验解决“能不能用”

例如：

- `age: i32` 能成功解析
- 但 `age = -10` 仍然可能是非法业务值

如果你想把编解码错误和业务校验错误的分层再细化，继续看：

- [Serde 与数据序列化实践](./serde-and-data-serialization.md)

## `axum` 输入边界建议

在 `axum` 里，一个更稳的顺序通常是：

1. extractor 先把 path/query/body 解析出来
2. DTO 承接协议结构
3. DTO 再转成领域命令
4. handler 只做错误映射和调用 service

不要让 handler 同时承担：

- 解析
- 格式校验
- 领域校验
- 业务执行
- 响应映射

如果你想把 Router、Extractor 和 Middleware 的整体主线先理一遍，继续看：

- [Axum Web 服务实践](./axum-web-service-practice.md)

## `ValidateRequestHeaderLayer` 只适合很简单的前置检查

像 header 是否存在、固定 token demo 这类简单前置检查，可以放在 layer。

但更复杂的输入校验，通常不该全塞到 middleware：

- 它缺少业务上下文
- 跨字段规则不容易表达
- 错误收口也容易分散

所以更稳的原则通常是：

- middleware 做非常基础的入口检查
- DTO / 领域层做真正的输入校验

如果你想把认证、header 校验和 request context 单独理顺，继续看：

- [Rust 认证、授权与请求上下文实践](./auth-authorization-and-request-context-practice.md)

## 错误映射要回答“哪里错了”，不要只说“无效请求”

一个很务实的分层是：

- 解析错误：400
- 基础输入校验错误：400 或 422
- 领域规则错误：更贴近业务语义的 422 / 409 / 403

这里重点不是所有团队都必须用同一套状态码，而是：

- 同类问题要有一致映射
- 调用方能区分“格式不对”和“业务不允许”

更重要的是：

- 不要直接把底层 parser / SQL / regex 全部细节原样暴露给外部

## 一个最小错误收口示意

```rust
use axum::{http::StatusCode, response::IntoResponse, Json};
use serde::Serialize;

#[derive(Debug)]
pub enum AppError {
    BadRequest(&'static str),
    Validation(String),
}

#[derive(Serialize)]
struct ErrorBody {
    code: &'static str,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        match self {
            AppError::BadRequest(message) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorBody {
                    code: "bad_request",
                    message: message.to_string(),
                }),
            )
                .into_response(),
            AppError::Validation(message) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                Json(ErrorBody {
                    code: "validation_error",
                    message,
                }),
            )
                .into_response(),
        }
    }
}
```

这里最重要的不是状态码宗教，而是：

- 协议错误和业务校验错误已经被分层
- handler 已经开始向稳定错误响应契约收口

如果你想把统一错误体、request id、状态码分层和中间件错误也一起收成一页，继续看：

- [Rust API 错误响应与响应体设计实践](./api-error-and-response-design-practice.md)

## 正规化要在合适边界做

很多输入不是单纯“校验通过或失败”，还需要先做正规化：

- `trim`
- 小写化
- 去掉多余空白
- 统一时间单位

更稳的建议通常是：

- 不改变业务语义的正规化，可以放在值对象构造前
- 会改变业务解释的“修正”，不要悄悄做

例如：

- 邮箱转小写通常合理
- 金额自动四舍五入就需要非常谨慎

## 长度和大小限制不要漏

很多系统一开始只校验“格式对不对”，却忘了：

- body 可能特别大
- 字段可能极长
- 错误消息可能把日志打爆

所以输入边界至少要考虑：

- 字符串长度
- 数组长度
- 上传大小
- query 参数数量

这不仅是业务问题，也是资源保护问题。

如果你想把 query 参数、排序字段白名单、page size 上限和 cursor 解析错误系统收成一页，继续看：

- [Rust 列表查询、过滤、排序与分页实践](./pagination-filter-and-sorting-practice.md)

如果你想把 multipart、预签名上传、对象 key 和对象存储边界系统收成一页，继续看：

- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)

如果你想把 timeout、并发限制和过载保护单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

## 不要让数据库约束变成第一道错误提示

数据库唯一约束很重要，但它更适合：

- 最终兜底

而不是：

- 第一时间告诉用户输入是否合理

更稳的做法通常是：

1. 应用层尽早做基础校验
2. 领域层做不变量校验
3. 数据库约束处理并发和最终一致性边界

如果你正在处理条件更新、唯一约束和副作用推进，也可以继续看：

- [Rust 幂等、状态机与 Outbox 实践](./idempotency-state-machine-and-outbox-practice.md)

## `validator` 这类库可以用，但不要把它当银弹

这类库适合：

- 一些重复字段规则
- 常见长度、邮箱、范围检查

但更复杂的业务里，真正关键的仍然是：

- 分层是否清楚
- 值对象是否存在
- 领域不变量是否显式

所以更稳的态度通常是：

- 库可以减少样板
- 但不要用库替代边界设计

## 测试要覆盖“解析失败”“格式非法”“业务不合法”三层

至少值得覆盖：

### 单元测试

- 值对象构造成功 / 失败
- `TryFrom` 转换错误
- 跨字段规则

### handler / 集成测试

- 非法 JSON
- 缺字段
- 值越界
- 业务规则冲突

### 回归测试

- 某次线上出现的非法输入
- 某次边界 case 触发的错误映射问题

如果你想把测试策略、fake 和边界隔离单独理顺，继续看：

- [测试与质量实践](./testing-and-quality-practice.md)
- [Rust 测试替身与依赖隔离实践](./test-doubles-and-dependency-isolation-practice.md)

## 常见误区

### 误区 1：一个结构体既当 DTO 又当领域对象

短期省事，后面通常边界越来越糊。

### 误区 2：把 `serde` 反序列化成功当成业务合法

这会让领域不变量长期缺位。

### 误区 3：所有校验都堆进 handler

这样最容易失去复用和可测性。

### 误区 4：所有错误都返回 `"invalid request"`

调用方和排障方都会很痛苦。

### 误区 5：完全依赖数据库报错来提示输入非法

这会让错误暴露太晚，也不利于业务语义表达。

## 一组很实用的落地原则

1. 先分清解析错误、格式错误、领域错误和持久化约束错误。
2. DTO 负责协议结构，领域对象负责业务不变量。
3. 有失败创建语义时，优先考虑 `TryFrom` 和值对象。
4. 正规化可以做，但不要悄悄改变业务语义。
5. 数据库约束是最终防线，不是第一道用户提示。
6. 错误映射要稳定、一致、可测试。

## 自检问题

你至少应该能回答：

1. 为什么 `serde` 成功反序列化不等于业务合法？
2. DTO 层、领域层、存储层各更适合做什么校验？
3. 为什么 `TryFrom` 很适合承接输入进入业务前的失败转换？
4. 为什么不能把所有输入校验都堆在 handler 里？
5. 为什么数据库约束更适合兜底，而不是第一道输入校验？

把这些问题讲清楚，你才算真正把 Rust 服务的输入边界收住了，而不是“能把 JSON 读进来”。 
