---
title: "第 14 章：进一步认识 Cargo 和 Crates.io"
description: 发布配置、文档注释、Cargo Workspace、安装二进制和自定义命令。
---

# 第 14 章：进一步认识 Cargo 和 Crates.io

> 原文：[Chapter 14: More about Cargo and Crates.io](https://doc.rust-lang.org/book/ch14-00-more-about-cargo.html)

前面的章节已经使用了 Cargo 最基础的 `build`、`run`、`test` 功能。本章深入探讨 Cargo 的高级特性——从编译优化、文档生成、工作区管理，到 crate 的发布与安装，最后介绍如何扩展 Cargo 自身的命令体系。

## 本章要点

| 主题 | 核心命令/概念 | 一句话总结 |
|------|--------------|-----------|
| Release Profile | `[profile.dev]` / `[profile.release]` | 通过 `Cargo.toml` 控制不同场景下的编译优化级别 |
| 文档注释 | `///`、`//!`、`cargo doc` | 写在代码里的文档，能生成 HTML 且示例自动跑测试 |
| 发布 crate | `cargo publish`、`cargo yank` | 将库共享到 crates.io，版本一经发布不可删除 |
| `pub use` 重导出 | `pub use self::module::Item` | 让内部模块结构与对外 API 解耦 |
| Workspace | `[workspace]` + `members` | 多 crate 共享一份 `Cargo.lock` 和 `target/` |
| 安装二进制 | `cargo install` | 从 crates.io 下载并编译可执行文件到 `~/.cargo/bin` |
| 自定义命令 | `cargo-xxx` 命名约定 | `$PATH` 中任何 `cargo-xxx` 二进制都可用 `cargo xxx` 调用 |

---

## 14.1 发布配置（Release Profiles）

> 原文：[Customizing Builds with Release Profiles](https://doc.rust-lang.org/book/ch14-01-release-profiles.html)

### 什么是 Release Profile

Release Profile 是 Cargo 内置的、可定制的编译配置集。每个 profile 都是独立配置的，Cargo 默认提供两个：

| Profile | 触发方式 | 编译输出标识 | 典型用途 |
|---------|---------|-------------|---------|
| `dev` | `cargo build` | `[unoptimized + debuginfo]` | 日常开发，快速编译 |
| `release` | `cargo build --release` | `[optimized]` | 正式发布，最大优化 |

### opt-level：优化等级

`opt-level` 控制 Rust 编译器对代码施加的优化程度，取值范围 0–3：

```toml
# Cargo 内置默认值（无需手动写，此处仅作说明）
[profile.dev]
opt-level = 0      # 不优化 → 编译快，运行慢

[profile.release]
opt-level = 3      # 最大优化 → 编译慢，运行快
```

**设计哲学**：开发阶段频繁编译，编译速度比运行速度重要；发布只编译一次但运行无数次，因此牺牲编译时间换取运行效率。

### 自定义 Profile

在项目根目录的 `Cargo.toml` 中添加 `[profile.*]` 段即可覆盖默认值：

```toml
[profile.dev]
opt-level = 1   # 比默认的 0 多一点优化，但远不及 release 的 3
```

这在"开发时也需要一定性能"的场景很有用，比如调试一个对性能敏感的算法时。

> 完整配置项参见 [Cargo 官方文档 - Profiles](https://doc.rust-lang.org/cargo/reference/profiles.html)，除 `opt-level` 外还有 `debug`（调试信息）、`overflow-checks`（溢出检查）、`lto`（链接时优化）等数十项可调参数。

---

## 14.2 发布 crate 到 Crates.io

> 原文：[Publishing a Crate to Crates.io](https://doc.rust-lang.org/book/ch14-02-publishing-to-crates-io.html)

本节内容最丰富，涵盖文档注释、API 设计、元数据配置、发布与撤回。

### 14.2.1 文档注释（Documentation Comments）

#### `///` —— 条目文档注释

使用三斜线 `///` 写在函数/结构体/模块等条目之前，支持 Markdown 语法，会被 `cargo doc` 编译为 HTML 文档（底层调用 `rustdoc`）。

```rust
/// 将给定数字加一。
///
/// # Examples
///
/// ```
/// let arg = 5;
/// let answer = my_crate::add_one(arg);
///
/// assert_eq!(6, answer);
/// ```
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

运行 `cargo doc --open` 即可在浏览器中查看生成的文档。

#### 常用文档段落约定

| 段落标题 | 用途 |
|---------|------|
| `# Examples` | 使用示例（最常见，几乎每个公开 API 都应提供） |
| `# Panics` | 说明函数在什么条件下会 panic |
| `# Errors` | 若返回 `Result`，说明可能的错误类型及触发条件 |
| `# Safety` | 若函数是 `unsafe`，说明调用者需要维护的不变量 |

#### 文档测试（Doc-tests）

`cargo test` 会自动把 `///` 中 ` ``` ` 代码块作为测试运行：

```text
Doc-tests my_crate

running 1 test
test src/lib.rs - add_one (line 5) ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

这是 Rust 生态的一大特色：**示例即测试**。文档中的代码示例不会因为 API 变更而过时，因为一旦过时，`cargo test` 就会失败。

#### `//!` —— 包含项文档注释

用于描述"包含这段注释的条目本身"，常见于 `src/lib.rs` 顶部，作为整个 crate 的说明：

```rust
//! # My Crate
//!
//! `my_crate` 是一个让某些计算更方便的工具集合。
```

生成文档时，这段内容会出现在 crate 根页面的最顶部。

### 14.2.2 用 `pub use` 重导出，打造友好的公开 API

#### 问题

crate 的内部模块组织是为开发者服务的，但对用户来说层级可能过深：

```rust
// 内部结构
pub mod kinds {
    pub enum PrimaryColor { Red, Yellow, Blue }
    pub enum SecondaryColor { Orange, Green, Purple }
}

pub mod utils {
    use crate::kinds::*;
    pub fn mix(c1: PrimaryColor, c2: PrimaryColor) -> SecondaryColor {
        SecondaryColor::Orange
    }
}
```

用户被迫写冗长的路径：

```rust
use art::kinds::PrimaryColor;
use art::utils::mix;
```

#### 解决：`pub use` 重导出

在 `src/lib.rs` 顶部重新导出关键类型：

```rust
//! # Art
//!
//! 一个用于建模艺术概念的库。

pub use self::kinds::PrimaryColor;
pub use self::kinds::SecondaryColor;
pub use self::utils::mix;

pub mod kinds { /* ... */ }
pub mod utils { /* ... */ }
```

用户现在可以简洁地引用：

```rust
use art::PrimaryColor;
use art::mix;
```

**关键洞察**：`pub use` 实现了"内部结构"与"外部 API"的解耦。内部可以按逻辑组织模块，对外则提供扁平、直观的接口。生成的文档首页也会显示 "Re-exports" 区域，帮助用户发现这些重导出项。

### 14.2.3 设置 Crates.io 账户

1. 访问 [crates.io](https://crates.io/) 并通过 GitHub 账号登录
2. 访问 [https://crates.io/me/](https://crates.io/me/) 获取 API key
3. 在终端执行：

```bash
cargo login abcdefghijklmnopqrstuvwxyz012345
```

API token 存储在 `~/.cargo/credentials.toml`，务必保密。

### 14.2.4 Crate 元数据（Cargo.toml）

发布到 crates.io 的必填字段：

```toml
[package]
name = "guessing_game"          # 唯一名称，先到先得
version = "0.1.0"               # 语义化版本号
edition = "2024"                # Rust edition
description = "一个猜数字游戏"    # 1-2 句简介，出现在搜索结果中
license = "MIT OR Apache-2.0"   # SPDX 许可证标识符
```

- **name**：全局唯一，一经注册不可更改
- **license**：可用 `OR` 组合多个许可证（如 `MIT OR Apache-2.0`，这也是 Rust 项目最常见的双许可方案）；也可用 `license-file` 指定自定义许可证文件
- 完整许可证标识符列表：[SPDX License List](https://spdx.org/licenses/)

### 14.2.5 发布

```bash
cargo publish
```

输出示例：

```text
    Updating crates.io index
   Packaging guessing_game v0.1.0
   Uploading guessing_game v0.1.0
    Uploaded guessing_game v0.1.0 to registry `crates-io`
```

**发布是永久性的**：已发布的版本不能覆盖、不能删除。Crates.io 的设计目标是成为永久代码存档，确保依赖它的项目永远能构建成功。

### 14.2.6 发布新版本

1. 按 [Semantic Versioning (SemVer)](https://semver.org/) 规则修改 `version`
2. 再次 `cargo publish`

SemVer 简要规则：
- `MAJOR`：不兼容的 API 变更
- `MINOR`：向后兼容的新功能
- `PATCH`：向后兼容的 bug 修复

### 14.2.7 用 `cargo yank` 撤回版本

Yank（撤回）并非删除，而是：
- **新项目**不能再将该版本加入依赖
- **已有项目**的 `Cargo.lock` 中若已锁定该版本，仍可正常使用

```bash
# 撤回
cargo yank --vers 1.0.1

# 撤销撤回
cargo yank --vers 1.0.1 --undo
```

**安全提醒**：yank 不会删除代码。如果不小心上传了密钥或敏感信息，必须立即轮换（rotate）这些凭据。

---

## 14.3 Cargo Workspace

> 原文：[Cargo Workspaces](https://doc.rust-lang.org/book/ch14-03-cargo-workspaces.html)

### 为什么需要 Workspace

当项目增长到一定规模后，单个 crate 会变得难以维护。Workspace 允许将一个大项目拆分为多个协同开发的 crate，同时共享依赖版本和编译产物。

### 创建 Workspace

#### 第 1 步：创建工作区根目录和 `Cargo.toml`

```bash
mkdir add && cd add
```

根目录的 `Cargo.toml` 只有 `[workspace]` 段，没有 `[package]` 段：

```toml
[workspace]
resolver = "3"
```

#### 第 2 步：添加成员 crate

```bash
cargo new adder          # 二进制 crate
cargo new add_one --lib  # 库 crate
```

Cargo 自动将新 crate 注册为 workspace member：

```toml
[workspace]
resolver = "3"
members = ["adder", "add_one"]
```

#### 最终目录结构

```
add/
├── Cargo.lock          # 全局唯一
├── Cargo.toml          # workspace 根配置
├── target/             # 共享编译目录
├── adder/
│   ├── Cargo.toml
│   └── src/main.rs
└── add_one/
    ├── Cargo.toml
    └── src/lib.rs
```

**核心优势**：整个 workspace 只有一份 `Cargo.lock` 和一个 `target/` 目录，避免重复编译、保证依赖版本一致。

### 成员间依赖

Workspace 中的 crate 之间**不会自动**产生依赖关系，必须显式声明：

```toml
# adder/Cargo.toml
[dependencies]
add_one = { path = "../add_one" }
```

库代码：

```rust
// add_one/src/lib.rs
pub fn add_one(x: i32) -> i32 {
    x + 1
}
```

二进制使用库：

```rust
// adder/src/main.rs
fn main() {
    let num = 10;
    println!("Hello, world! {num} plus one is {}!", add_one::add_one(num));
}
```

### 构建与运行

```bash
# 构建整个 workspace
cargo build

# 运行指定 crate（workspace 含多个二进制时必须用 -p 指定）
cargo run -p adder
# 输出：Hello, world! 10 plus one is 11!
```

### 外部依赖管理

每个 crate 在自己的 `Cargo.toml` 中声明依赖：

```toml
# add_one/Cargo.toml
[dependencies]
rand = "0.8.5"
```

**关键细节**：
- 即使多个 crate 都依赖 `rand`，`Cargo.lock` 只会锁定一个版本，确保兼容性
- 一个 crate 声明的依赖不会自动传递给同 workspace 的其他 crate，各自必须显式声明

### 测试

```bash
# 运行所有 crate 的测试
cargo test

# 只测试某个 crate
cargo test -p add_one
```

### 发布

Workspace 中的 crate 需要逐个发布：

```bash
cargo publish -p add_one
cargo publish -p adder
```

发布顺序需要注意依赖关系——被依赖的 crate 必须先发布。

---

## 14.4 用 `cargo install` 安装二进制

> 原文：[Installing Binaries with cargo install](https://doc.rust-lang.org/book/ch14-04-installing-binaries.html)

### 功能与限制

`cargo install` 从 crates.io 下载、编译并安装具有 **binary target**（即 `src/main.rs` 或其他指定二进制文件）的 crate。纯 library crate 无法安装。

### 安装路径

默认安装到 `$HOME/.cargo/bin`（使用 rustup 安装 Rust 时该目录已自动加入 `$PATH`）。

### 示例：安装 ripgrep

```bash
$ cargo install ripgrep
    Updating crates.io index
  Downloaded ripgrep v14.1.1
  Installing ripgrep v14.1.1
   Compiling ...
  Installing ~/.cargo/bin/rg
   Installed package `ripgrep v14.1.1` (executable `rg`)
```

安装完成后即可使用：

```bash
rg --help
```

`ripgrep`（命令名 `rg`）是用 Rust 编写的高性能文件搜索工具，速度远超传统 `grep`。

### 实用提示

- 查看已安装的工具：`ls ~/.cargo/bin`
- 更新已安装的工具：再次 `cargo install <crate>` 即可覆盖
- 常见的值得安装的工具：`ripgrep`（搜索）、`fd-find`（文件查找）、`bat`（cat 替代）、`tokei`（代码统计）、`cargo-edit`（`cargo add`/`cargo rm`）

---

## 14.5 Cargo 自定义扩展命令

> 原文：[Extending Cargo with Custom Commands](https://doc.rust-lang.org/book/ch14-05-extending-cargo.html)

### 命名约定

Cargo 的扩展机制非常简洁：**只要 `$PATH` 中有一个名为 `cargo-something` 的可执行文件，就可以用 `cargo something` 来调用它**。

例如：
- `~/.cargo/bin/cargo-fmt` → `cargo fmt`
- `~/.cargo/bin/cargo-clippy` → `cargo clippy`
- `~/.cargo/bin/cargo-expand` → `cargo expand`

### 发现已安装的扩展

```bash
cargo --list
```

该命令会列出所有内置命令和自定义扩展命令。

### 设计优势

- **无需修改 Cargo 核心**：任何人都可以编写扩展并通过 `cargo install` 分发
- **无缝体验**：用户调用 `cargo xxx` 与内置命令体验完全一致
- **生态繁荣**：crates.io 上有大量实用的 Cargo 扩展工具

### 常见的 Cargo 扩展工具

| 命令 | 说明 |
|------|------|
| `cargo fmt` | 代码格式化（rustfmt） |
| `cargo clippy` | Lint 检查，捕获常见错误和非惯用写法 |
| `cargo expand` | 展开宏，查看宏展开后的代码 |
| `cargo audit` | 检查依赖中的已知安全漏洞 |
| `cargo deny` | 检查许可证合规、依赖重复等 |
| `cargo watch` | 文件变更时自动运行命令 |
| `cargo tarpaulin` | 代码覆盖率统计 |

---

## 小结

本章揭示了 Cargo 远不止一个简单的构建工具——它是 Rust 生态的核心基础设施：

1. **Release Profile** 让你精细控制不同场景的编译行为，dev 求快、release 求优。
2. **文档注释** + **Doc-tests** 实现了"示例即测试"的理念，从根本上解决了文档与代码不同步的顽疾。
3. **`pub use` 重导出**是 Rust API 设计的重要技巧，实现内部结构与外部接口的解耦。
4. **Crates.io** 的"发布不可撤销"设计保证了整个生态的依赖稳定性。
5. **Workspace** 是大型项目的必备组织方式——共享 `Cargo.lock` + `target/` 既省空间又保一致。
6. **`cargo install`** + **自定义命令**的组合让 Cargo 成为一个可无限扩展的工具平台。

> 完整 Cargo 参考：[The Cargo Book](https://doc.rust-lang.org/cargo/)
