---
title: 错误处理、Cargo 与测试
description: 理解 Rust 的错误处理哲学、Cargo 工程组织方式，以及测试、格式化和 lint 的基本工作流。
---

# 错误处理、Cargo 与测试

Rust 工程体验的关键，不只在语言本身，也在它把“错误处理、构建、测试、格式化、lint”都收进了一条统一工作流。

如果你把这部分补齐，Rust 的可维护性优势才会真正体现出来。

## 错误处理先分三类

### 1. 预期内失败

例如：

- 输入格式错误
- 文件不存在
- 数据库查询失败
- 网络请求超时

这类错误通常应该用 `Result<T, E>` 返回给调用方。

### 2. 缺失值或未命中

例如：

- 根据 ID 没查到记录
- 可选配置不存在
- 缓存没有命中

这类情况常用 `Option<T>` 表达。

### 3. 不可恢复错误

例如：

- 明显违反内部不变量
- 程序启动阶段关键配置缺失
- 绝对不该发生却发生了的分支

这类场景才考虑 `panic!`，而不是把 `panic!` 当日常控制流。

## `Result` 是工程代码的主干

```rust
fn read_port(input: &str) -> Result<u16, std::num::ParseIntError> {
    input.parse::<u16>()
}
```

调用方必须显式处理：

```rust
fn run() -> Result<(), Box<dyn std::error::Error>> {
    let port = read_port("8080")?;
    println!("{port}");
    Ok(())
}
```

`?` 的意义是：

- 如果是 `Ok`，取出值继续执行
- 如果是 `Err`，立即向上传播

这让错误处理链路非常线性。

## `Option` 和 `Result` 不要混用职责

### 用 `Option` 表达“没有”

```rust
fn find_user_name(id: u64) -> Option<String> {
    if id == 1 {
        Some("rust".to_string())
    } else {
        None
    }
}
```

### 用 `Result` 表达“失败原因”

```rust
fn parse_positive(input: &str) -> Result<u32, String> {
    let value = input.parse::<u32>().map_err(|_| "invalid number".to_string())?;

    if value == 0 {
        return Err("must be positive".to_string());
    }

    Ok(value)
}
```

如果你需要告诉调用方“为什么失败”，就不要只返回 `Option`。

## 什么时候可以 `panic!`

经验上，下面几类场景可以接受：

- 测试代码里的断言失败
- 程序启动时关键配置缺失，继续运行没有意义
- 内部不变量被破坏，说明代码本身有 bug

一般业务流程里，不要用 `panic!` 代替错误返回。

## 库代码和应用代码的错误风格通常不同

### 库代码

更适合：

- 定义清晰的错误类型
- 暴露明确的 `Result<T, E>`
- 尽量保留结构化错误信息

### 应用代码

更适合：

- 在边界层统一收口错误
- 在日志和监控里携带上下文
- 在最外层决定退出码、HTTP 响应、告警等行为

很多团队会在库层用结构化错误，在应用层做统一转换。

## Cargo 是工程主入口

常见工作流基本围绕 Cargo 展开：

| 命令 | 用途 |
| --- | --- |
| `cargo new demo` | 新建项目 |
| `cargo check` | 只做编译检查，速度快 |
| `cargo build` | 构建项目 |
| `cargo build --release` | 生成优化版本 |
| `cargo test` | 跑单元测试、集成测试、文档测试 |
| `cargo fmt` | 格式化代码 |
| `cargo clippy` | 运行 lint 检查 |
| `cargo run` | 构建并执行 |

实操里最常用的循环往往是：

1. 写代码
2. `cargo check`
3. `cargo test`
4. `cargo fmt`
5. `cargo clippy`

## crate、module、workspace 怎么理解

### crate

Rust 的编译单元。可以是：

- 二进制 crate
- 库 crate

### module

crate 内部的代码组织方式，用来拆命名空间和文件结构。

### workspace

多个 crate 组成的大项目管理方式，适合：

- 一个库 + 一个 CLI
- 多个服务共享公共 crate
- 核心领域模型、基础设施和应用拆分

## 一个常见的项目结构

```text
myapp/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── config.rs
│   ├── error.rs
│   ├── service.rs
│   └── model.rs
└── tests/
    └── api_test.rs
```

如果项目再变大，可以继续拆：

- `src/lib.rs` 作为库入口
- `src/bin/` 放多个可执行入口
- workspace 管多个 crate

如果你想把这里的错误处理、Cargo 命令流和测试真正落到一个完整项目里，继续看：

- [Rust CLI 工具实践](./cli-tool-practice.md)

## 测试分三类最常见

### 1. 单元测试

通常写在同文件里：

```rust
fn add(left: i32, right: i32) -> i32 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn add_works() {
        assert_eq!(add(1, 2), 3);
    }
}
```

适合测试：

- 私有函数
- 小范围逻辑
- 边界条件

### 2. 集成测试

通常放在 `tests/` 目录，按外部调用者视角测试 crate 对外接口。

### 3. 文档测试

文档里的示例代码也可以被 `cargo test` 执行，这会倒逼示例保持可运行。

## `rustfmt` 和 `clippy` 不要等到最后再跑

### `cargo fmt`

解决的是统一格式问题，避免代码风格争论。

### `cargo clippy`

解决的是一批常见代码味道和可改进点，例如：

- 多余 clone
- 可以更 idiomatic 的写法
- 潜在性能问题

Rust 团队常见做法是把它们放进 CI，而不是靠人工提醒。

## 关于第三方错误库的使用边界

工程里常见会接触到：

- `thiserror`：更适合定义结构化错误类型
- `anyhow`：更适合应用层快速收口和附加上下文

一个简单判断方式：

- 面向库或公共组件时，更偏结构化错误
- 面向应用主流程时，更偏方便传播和补上下文

## 交付前检查清单

一个 Rust 小项目在提交前，至少应该满足：

1. `cargo check` 通过。
2. `cargo test` 通过。
3. `cargo fmt --check` 通过。
4. `cargo clippy` 没有明显高价值警告。
5. 错误返回路径和 `panic!` 边界清楚。

## 自检

你至少应该能回答：

1. `Option` 和 `Result` 的职责边界是什么？
2. `?` 运算符到底做了什么？
3. 为什么库代码和应用代码的错误设计通常不同？
4. crate、module、workspace 三者分别解决什么组织问题？
5. 为什么 `cargo fmt` 和 `cargo clippy` 应该进入日常循环而不是最后补？

这部分补齐后，你就不只是“会写语法”，而是开始具备 Rust 工程化能力。
