---
title: Rust CLI 工具实践
description: 从参数解析、配置加载、错误处理、文件 I/O、HTTP 调用到集成测试，整理 Rust 命令行工具的最小工程主线。
search: false
---

# Rust CLI 工具实践

CLI 是很适合拿来练 Rust 的第一类工程项目。

原因很直接：

- 能覆盖参数解析、文件 I/O、错误处理、配置加载这些高频基础能力
- 不需要一开始就进入 async runtime、Web 框架和数据库
- 很容易做成一个完整、可运行、可测试、可发布的成品

如果你已经学过所有权、`Result`、Cargo 和模块组织，但还没把这些能力真正串成一个能用的小项目，这页就是下一步。

## 适合用 Rust 写 CLI 的场景

- 本地自动化工具
- 日志、配置、CSV、JSON 等文件处理工具
- 内部运维命令
- API 调试和批量调用工具
- 需要一个单文件二进制分发给同事的内部小工具

如果你还在 Rust 入门阶段，CLI 往往比 Web 服务更适合作为第一批实践项目。

## 不要一上来就把 CLI 写成大工程

一个更稳的顺序是：

1. 先做单二进制工具
2. 再把纯逻辑从 `main.rs` 拆到 `lib.rs` 或模块
3. 真有多个命令入口或可复用库之后，再考虑 workspace

不要因为 Rust 能拆得很细，就在第一天把 CLI 拆成 5 个 crate。

## 一个够用的目录结构

```text
feedctl/
├── Cargo.toml
├── src/
│   ├── main.rs
│   ├── cli.rs
│   ├── app.rs
│   ├── config.rs
│   ├── error.rs
│   └── output.rs
└── tests/
    └── smoke.rs
```

各部分职责可以先这样分：

- `main.rs`：启动、错误收口、退出码
- `cli.rs`：参数和子命令定义
- `config.rs`：配置文件和默认值加载
- `app.rs`：真正的业务流程
- `error.rs`：领域或基础设施错误
- `output.rs`：文本 / JSON 输出格式

如果后面命令越来越多，再考虑：

- `src/bin/` 放多个可执行入口
- `src/lib.rs` 导出可测试逻辑
- workspace 管共享库和多个工具

## 依赖怎么选，先求稳别求全

对于一个典型 CLI，下面这组就够用了：

- `clap`：参数解析和帮助信息
- `anyhow`：应用层错误收口
- `thiserror`：库层或模块层的结构化错误
- `serde` + `toml`：配置文件编解码
- `reqwest`：需要调 HTTP API 时使用
- `assert_cmd`：CLI 集成测试

如果你想更系统地理解为什么这里选这些依赖，而不是随手继续 `cargo add`，继续看：

- [Rust 常用 crate 选型与工程边界](./crate-selection-and-boundaries.md)
- [Rust 配置管理实践](./configuration-management-practice.md)

如果你想快速搭起一个最小项目，可以按需添加：

```bash
cargo add clap --features derive
cargo add anyhow thiserror
cargo add serde --features derive
cargo add toml
cargo add reqwest --no-default-features --features blocking,rustls-tls
cargo add --dev assert_cmd predicates tempfile
```

几点务实建议：

- `clap` 的 derive 写法更适合大多数业务 CLI
- `anyhow` 更适合二进制程序最外层
- `thiserror` 更适合库层错误枚举
- 如果 CLI 只是同步工作流，优先用同步模型，不要默认上 Tokio

## 参数解析：先把命令树收清楚

`clap` 的 derive API 很适合先把命令树表达清楚。官方文档也明确说明，派生 `Parser` 需要启用 `derive` feature。

```rust
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Debug, Parser)]
#[command(name = "feedctl", version, about = "本地 feed 处理工具")]
pub struct Cli {
    #[arg(long)]
    pub config: Option<PathBuf>,

    #[command(subcommand)]
    pub command: Command,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    Fetch {
        url: String,
    },
    PrintConfig,
}
```

设计命令行接口时，优先做这几件事：

- 把公共参数提升成全局参数
- 把互斥能力做成子命令，而不是堆很多布尔参数
- 让帮助信息能直接表达工具职责

好的 CLI 先是命令结构清楚，再是实现细节清楚。

## `main.rs` 保持薄，真正逻辑放进 `run()`

很实用的一种写法是：

```rust
use anyhow::Result;
use clap::Parser;

use crate::app::run_command;
use crate::cli::Cli;
use crate::config::Config;

fn main() {
    if let Err(err) = run() {
        eprintln!("{err:#}");
        std::process::exit(1);
    }
}

fn run() -> Result<()> {
    let cli = Cli::parse();
    let config = Config::load(cli.config.as_deref())?;
    run_command(cli.command, config)?;
    Ok(())
}
```

这样做的好处：

- 错误出口统一
- 测试时更容易直接调 `run_command`
- `main.rs` 不会膨胀成一坨流程脚本

## 错误处理：应用层和库层分开

很多 CLI 项目一开始就会遇到这个问题：

- 要不要全都 `anyhow`？
- 要不要每层都定义很重的错误类型？

更稳的分法通常是：

- 应用层：`anyhow::Result<T>`
- 库层 / 模块层：`thiserror` 定义结构化错误

`thiserror` 官方文档本身也提到，应用代码里常见的搭配是 `anyhow`。

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("failed to read config file: {0}")]
    Read(#[from] std::io::Error),

    #[error("invalid config format: {0}")]
    Parse(#[from] toml::de::Error),
}
```

这套分法的好处是：

- 对内模块边界清晰
- 对外应用入口不用把错误类型传满整条链路
- 日后要给用户输出更友好的错误信息也更容易收口

## 配置加载：先定优先级，再写代码

CLI 常见的配置来源有三类：

- 默认值
- 配置文件
- 命令行参数

一个实用顺序通常是：

1. 默认值
2. 配置文件覆盖默认值
3. CLI 参数覆盖配置文件

不要把“命令行解析”和“配置合并”写成一锅。更稳的是：

- `cli.rs` 只负责拿到用户输入
- `config.rs` 只负责加载和合并配置
- `app.rs` 只消费已经整理好的配置对象

## 文件 I/O：优先用标准库，把边界写清楚

CLI 的很多价值都落在文件读写上。这里最容易犯的错不是 API 不会用，而是边界没收好。

几个简单原则：

- 参数里优先用 `PathBuf`
- 真正读写时再转成 `&Path`
- 大文件优先流式处理，不要默认一次性全读进内存
- 把解析和 I/O 拆开，不要混在一个函数里

例如：

```rust
use std::fs;
use std::path::Path;

fn load_text(path: &Path) -> std::io::Result<String> {
    fs::read_to_string(path)
}
```

如果后面要支持 CSV、JSON、压缩文件，继续沿这个边界往下拆就行。

## HTTP 调用：同步 CLI 优先同步客户端

很多 CLI 工具会顺手调一个 HTTP API。这时不要条件反射地把整个项目改成 async。

如果你的工具是：

- 单次请求
- 少量串行请求
- 没有长生命周期连接管理

那么同步 CLI 往往更合适。`reqwest` 官方文档明确写了：

- `reqwest::blocking` 是阻塞式客户端
- 需要启用 `blocking` feature
- 不能在 async runtime 里直接调用

如果你想把 timeout、认证、错误分层、幂等和测试边界真正收成完整主线，继续看：

- [Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)

最小示例：

```rust
fn fetch_text(url: &str) -> Result<String, reqwest::Error> {
    let client = reqwest::blocking::Client::new();
    let response = client.get(url).send()?.error_for_status()?;
    response.text()
}
```

这里最关键的判断不是“会不会写请求”，而是：

- CLI 真的需要 async 吗
- 是不是应该复用 `Client`
- 错误是不是应该在边界层补上下文

如果后面真的进入：

- 高并发请求
- 长连接
- streaming
- 多个 I/O 同时等待

再把这一层切到 Tokio 和异步 `reqwest::Client`，会更自然。

## 输出设计：stdout 给结果，stderr 给错误

CLI 工具输出边界要尽量稳定，因为：

- 人要看
- shell 脚本也要消费

一个务实做法是同时支持两种输出：

- 默认文本输出：给人看
- `--json`：给脚本或其他程序接

不要让业务逻辑函数直接 `println!` 到处飞。更稳的是：

- `app.rs` 返回结构化结果
- `output.rs` 决定怎么渲染到 stdout

## 测试：CLI 不只测库逻辑，还要测命令本身

一个 Rust CLI 至少建议补两层测试：

### 1. 单元测试

测纯逻辑：

- 参数转换
- 配置合并
- 文本解析
- 错误路径

### 2. 集成测试

直接跑二进制，测命令行为。`assert_cmd` 的主价值就是把这件事变简单。

```rust
use assert_cmd::Command;

#[test]
fn help_works() {
    let mut cmd = Command::cargo_bin("feedctl").unwrap();
    cmd.arg("--help").assert().success();
}
```

这类测试很适合验证：

- 退出码
- stdout / stderr
- 子命令行为
- 配置文件路径和参数解析

如果工具会读写文件，再配合 `tempfile` 做临时目录，基本就够用了。

## 一个很稳的第一版实践路线

如果你想真的做一个 Rust CLI，不要一开始就追求“大而全”。建议按这个顺序：

1. 做一个本地文件处理工具，只练参数、I/O 和错误处理
2. 给它补一个配置文件加载能力
3. 再补一个调用 HTTP API 的子命令
4. 最后补集成测试和 `cargo install --path .`

这一轮走完，你会把这些主题真正串起来：

- 所有权和借用
- `Result` 和错误边界
- Cargo 命令流
- 模块组织
- 测试
- CLI 与同步 I/O 的工程判断

## 什么时候该继续升级

下面这些信号出现时，再继续升级架构：

- 逻辑已经可复用，值得拆 `lib.rs`
- 有多个命令入口，适合上 `src/bin/`
- 有多个工具共享一批基础模块，适合上 workspace
- HTTP 调用和并发等待明显增多，值得进入 async

不要为了“未来可能会复杂”提前做所有复杂度。

如果你已经从一个工具走向多个入口，继续看：

- [Rust Workspace 与 Monorepo 实践](./workspace-and-monorepo-practice.md)

## 推荐回查入口

- 工程基础：[错误处理、Cargo 与测试](./error-handling-cargo-and-testing.md)
- 项目结构：[项目结构、crate 组织与 API 设计](./project-structure-and-api-design.md)
- 数据编解码：[Serde 与数据序列化实践](./serde-and-data-serialization.md)
- Async 判断：[Tokio 与 Async 工程实践](./tokio-and-async-practice.md)
- 质量闭环：[测试与质量实践](./testing-and-quality-practice.md)

如果你想把 Rust 从“会看示例”推进到“能做出一个完整工具”，CLI 往往是成本最低、收益最高的一步。
