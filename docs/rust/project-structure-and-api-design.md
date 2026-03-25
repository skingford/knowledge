---
title: 项目结构、crate 组织与 API 设计
description: 理解 Rust 工程中的 crate、module、workspace、pub 暴露面、错误边界和 API 设计原则。
---

# 项目结构、crate 组织与 API 设计

很多人学 Rust 时，前面都花在语言机制上，但真正开始做项目后，很快会碰到另一组问题：

- 代码应该拆成几个 crate？
- 什么应该放 `lib.rs`，什么应该放 `main.rs`？
- `pub` 到底应该暴露多少？
- API 应该返回拥有值、借用值，还是 trait object？

这一页讲的是 Rust 工程真正开始“成型”的部分。

## 先分清三个层次

### 1. module

模块是 crate 内部的命名空间和组织方式。

常见形式：

- `src/config.rs`
- `src/service/mod.rs`
- `src/model/user.rs`

它解决的是“单个 crate 内部怎么拆文件和命名空间”。

### 2. crate

crate 是 Rust 的编译单元。

常见类型：

- 库 crate
- 二进制 crate

它解决的是“哪些代码应该作为一个独立产物和依赖单元存在”。

### 3. workspace

workspace 用来管理多个 crate。

适合场景：

- 一个公共库 + 多个二进制程序
- 多服务共享领域模型或基础能力
- 想统一依赖版本、构建和测试入口

## 一个小型项目常见结构

```text
myapp/
├── Cargo.toml
└── src/
    ├── main.rs
    ├── config.rs
    ├── error.rs
    ├── model.rs
    └── service.rs
```

这种结构适合：

- 项目还不大
- 还没有明显公共复用模块
- 团队想先保持简单

如果你想看这个结构怎么落到一个完整命令行工具上，直接看：

- [Rust CLI 工具实践](./cli-tool-practice.md)
- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)
- [Rust 常用 crate 选型与工程边界](./crate-selection-and-boundaries.md)
- [Rust Workspace 与 Monorepo 实践](./workspace-and-monorepo-practice.md)

## 项目变大后的常见结构

```text
workspace/
├── Cargo.toml
├── crates/
│   ├── domain/
│   ├── storage/
│   └── http-api/
└── apps/
    └── server/
```

这种结构适合：

- 领域模型、存储实现、对外接口已经明显分层
- 存在多个可执行入口
- 需要共享公共 crate

## `lib.rs` 和 `main.rs` 怎么分工

### `main.rs`

更适合放：

- 程序启动入口
- 配置装配
- 日志初始化
- 信号处理
- 调用应用层主流程

### `lib.rs`

更适合放：

- 对外暴露的公共 API
- 领域模型
- 业务逻辑
- 可以被测试和复用的代码

一个非常实用的原则是：

尽量把可测试逻辑放进 `lib.rs` 所在的库层，把 `main.rs` 保持薄。

## `pub` 暴露面要收敛

Rust 默认私有，这不是麻烦，而是在鼓励你控制 API 表面积。

经验上：

- 默认私有
- 只暴露真正稳定、应该给外部用的能力
- 不要为了“别的模块也许会用”就先全 `pub`

### 常见写法

```rust
mod service;
mod model;

pub use service::UserService;
pub use model::User;
```

这类 `pub use` 能把对外 API 收敛在一个清晰入口，而不是让调用方直接依赖内部模块树。

## API 设计几个高频原则

### 1. 参数尽量借用，返回值根据语义决定拥有权

典型例子：

- 入参优先 `&str`、`&[T]`
- 需要脱离当前上下文的返回值优先 `String`、`Vec<T>`

### 2. 用类型表达状态，不用魔法值

不要轻易返回：

- `bool`
- `i32` 状态码
- 含义不清的 `Option<String>`

能用 `enum` 表达业务状态，就尽量明确。

### 3. 错误边界要稳定

一个公共 API 如果对外暴露，就要考虑：

- 错误类型是否清晰
- 是否保留足够上下文
- 后续演进时会不会频繁破坏调用方

### 4. trait 用来表达能力，不是为了制造层级

好的 trait 名字通常像：

- `Store`
- `Load`
- `Encode`
- `Validate`

而不是：

- `BaseManager`
- `AbstractService`

## 什么时候拆 crate

不要过早把项目拆成很多 crate。拆 crate 有收益，也有成本。

### 适合拆的信号

- 某块逻辑已经明显可独立复用
- 领域边界很稳定
- 不同模块依赖差异很大
- 需要独立发布或复用

### 不适合拆的信号

- 只是为了“看起来更架构化”
- 边界还在频繁变化
- 团队还没搞清依赖方向

过早拆 crate 往往会把简单问题复杂化。

## workspace 的核心价值

workspace 不只是“多个目录放一起”，它真正带来的价值是：

- 统一依赖管理
- 统一构建和测试入口
- 明确内部 crate 间依赖关系
- 让大型项目演进更可控

## 一个更务实的分层思路

你可以把 Rust 服务项目先按职责分成：

1. 入口层：配置、日志、启动、信号
2. 应用层：用例、服务编排、事务边界
3. 领域层：核心模型、规则、状态
4. 基础设施层：数据库、HTTP 客户端、消息队列、缓存

这比一上来追求“某种固定架构模板”更实用。

## 设计 API 时最容易踩的坑

### 误区 1：把内部结构直接暴露出去

短期方便，长期会让重构成本极高。

### 误区 2：所有函数都想做成泛型

如果泛型没有带来明确复用价值，只会让签名和报错更复杂。

### 误区 3：把 `main.rs` 写成一大坨业务逻辑

这会让测试、复用和重构都变得困难。

### 误区 4：为了通过编译，把 `pub` 和 `clone` 一路加到底

这通常意味着边界还没设计好。

## 自检

你至少应该能回答：

1. module、crate、workspace 分别解决什么问题？
2. 为什么 `main.rs` 应该尽量薄？
3. `pub use` 在 API 收敛上起什么作用？
4. 什么情况下值得把一块逻辑拆成独立 crate？
5. 为什么 Rust 工程里“默认私有”通常是好事？

这些问题理顺后，Rust 项目会更容易长期维护。
