---
title: Serde 与数据序列化实践
description: 理解 Rust 中 JSON 与通用数据序列化的常见模式，包括 Serialize/Deserialize、字段映射、错误边界和工程设计。
---

# Serde 与数据序列化实践

Rust 一旦进入真实项目，很快就会碰到序列化问题：

- HTTP 请求和响应要转成 JSON
- 配置文件要从 TOML、YAML 或 JSON 读进来
- 消息队列、缓存、持久化都要做数据编解码

这部分几乎绕不开 `serde`。

## 先记住 `serde` 在解决什么

`serde` 不是单一格式库，而是一套通用序列化/反序列化框架。

它主要解决：

- Rust 类型和外部数据格式之间的映射
- 让同一套类型可以接多种格式后端
- 让编解码逻辑尽量声明式，而不是手写大量样板代码

## 两个最常见 trait

- `Serialize`：把 Rust 值编码成外部格式
- `Deserialize`：把外部格式解码成 Rust 值

最常见用法是 `derive`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
    active: bool,
}
```

## JSON 是最常见入口

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    name: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let input = r#"{"id":1,"name":"rust"}"#;
    let user: User = serde_json::from_str(input)?;

    let output = serde_json::to_string(&user)?;
    println!("{output}");
    Ok(())
}
```

这类代码背后最重要的点不是 API 名字，而是：

- 业务类型本身就是协议映射对象
- 编解码错误是显式 `Result`
- 类型字段和外部格式的关系可以继续细化配置

## 字段映射是高频需求

外部接口不一定完全按 Rust 命名风格来。

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct UserProfile {
    #[serde(rename = "user_id")]
    user_id: u64,
}
```

常见需求包括：

- 字段改名
- 可选字段
- 默认值
- 跳过某些字段

## `Option<T>` 和默认值在反序列化里很常见

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Config {
    host: String,
    #[serde(default = "default_port")]
    port: u16,
    timeout_ms: Option<u64>,
}

fn default_port() -> u16 {
    8080
}
```

这段设计表达了三种不同语义：

- `host`：必填
- `port`：可缺失，但缺失时有默认值
- `timeout_ms`：可以显式不存在

## 反序列化边界要分清“缺字段”和“字段非法”

这是工程里很重要的区分：

- 缺字段：协议契约问题
- 类型不匹配：输入格式问题
- 业务值不合法：业务校验问题

不要把所有错误都混成一句 `"invalid request"`。

更稳的做法是：

1. 先让 `serde` 负责结构和类型映射。
2. 再在业务层做领域校验。

如果你想把 DTO 校验、`TryFrom`、领域不变量和 `axum` 输入错误映射系统收成一页，继续看：

- [Rust 输入校验与边界建模实践](./validation-and-input-boundaries-practice.md)

## DTO 和领域模型不要总是混在一起

初学时常见写法是：一个结构体同时充当

- HTTP 请求体
- 数据库存储对象
- 领域模型
- 对外响应对象

短期可以，但项目稍大后通常会开始出问题。

更稳的分层通常是：

- DTO：负责协议编解码
- 领域模型：负责业务规则
- 持久化模型：负责存储映射

`serde` 主要处理 DTO 这一层。

如果你想把请求 DTO、响应 DTO、领域对象、数据库模型和外部 API DTO 的映射边界系统理顺，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

## `serde_json::Value` 什么时候用

如果结构不稳定或只想透传部分字段，可以用动态 JSON 值：

```rust
use serde_json::Value;
```

但它的代价也很明确：

- 失去静态类型约束
- 下游访问容易变成字符串路径和运行时判断
- 可维护性下降

经验上：

- 能定义明确结构体时，优先结构体
- 只有在半结构化场景里再退回 `Value`

## 枚举序列化要特别注意协议形态

Rust 的 `enum` 很适合表达状态，但外部协议不一定天然支持 Rust 风格的多态结构。

所以设计接口时要考虑：

- 外部协议能不能稳定表示枚举分支
- 前后端或多语言系统是否方便消费
- 版本演进时新增分支是否会破坏兼容性

## 配置文件读取是另一个高频场景

除了 JSON，Rust 工程里也常见：

- `toml`
- `yaml`

模式其实一样：

1. 定义配置结构体
2. 读取文件内容
3. 调对应格式库做反序列化
4. 再补业务校验和默认策略

## 工程建议

### 用结构体承接稳定协议

不要一上来就全用 `Value` 或 map。

### 编解码错误和业务校验错误分层

反序列化成功，不代表业务合法。

### 外部协议字段名不合 Rust 风格时，用注解做映射

不要为了兼容 JSON 字段，把整个内部命名风格都拖偏。

### 对外接口要考虑兼容性

字段新增、字段删除、枚举分支演进，都要先想清楚消费者影响。

如果你想把 HTTP API versioning、兼容新增字段和弃用治理单独理顺，继续看：

- [Rust API Versioning、兼容演进与弃用治理实践](./api-versioning-and-compatibility-governance-practice.md)

## 自检

你至少应该能回答：

1. `Serialize` 和 `Deserialize` 各自负责什么？
2. 为什么 DTO 和领域模型不一定应该合并成一个结构体？
3. `Option<T>`、默认值和必填字段在协议上分别表达什么？
4. 为什么 `serde_json::Value` 不能作为默认建模方式？
5. 编解码错误和业务校验错误为什么应该分层？

这些问题理顺后，Rust 的接口和配置处理会清晰很多。
