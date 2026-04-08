---
title: "第 1 章：入门"
description: 安装 Rust 工具链、编写 Hello World、使用 Cargo 创建和管理项目。
---

# 第 1 章：入门

> 原文：[Chapter 1: Getting Started](https://doc.rust-lang.org/book/ch01-00-getting-started.html)

## 本章要点

- Rust 通过 **rustup** 进行安装和版本管理，这是官方推荐的唯一方式
- Rust 是**提前编译（ahead-of-time compiled）**语言，编译产物是独立的二进制文件，运行时不需要安装 Rust
- **Cargo** 是 Rust 的构建系统 + 包管理器，几乎所有 Rust 项目都通过 Cargo 管理
- Rust 用 `fn main()` 作为程序入口，用 `println!` 宏（注意 `!`，不是函数）输出文本
- Cargo 项目有严格的目录约定：源码放 `src/`，配置写 `Cargo.toml`

---

## 1.1 安装

> 原文：[Installation](https://doc.rust-lang.org/book/ch01-01-installation.html)

### 核心工具：rustup

Rust 的安装、更新、卸载全部通过 **rustup** 完成。rustup 不仅管理 Rust 编译器版本，还管理相关工具链（如 `cargo`、`rustfmt`、`clippy`）。

**Linux / macOS 安装：**

```bash
$ curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

安装成功后会看到：`Rust is installed now. Great!`

**Windows 安装：**

前往 [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install) 下载安装程序，安装时需要选择安装 Visual Studio（提供 linker 和 Windows 原生库）。

### 为什么需要 linker？

Rust 编译器自身只负责生成目标代码，最终链接成可执行文件需要一个 **linker**。在 macOS 上通过 Xcode 命令行工具获取，在 Linux 上通过 GCC 或 Clang 获取：

```bash
# macOS
$ xcode-select --install

# Ubuntu/Debian
$ sudo apt-get install build-essential
```

> **设计思考：** Rust 不自带 linker，而是复用系统已有的 C 工具链。这样做的好处是减少安装体积，同时天然支持与 C 库的互操作（FFI）。

### 验证安装

```bash
$ rustc --version
# 输出格式：rustc x.y.z (abcabcabc yyyy-mm-dd)
```

### 常用维护命令

```bash
# 更新到最新版本
$ rustup update

# 卸载 Rust 和 rustup
$ rustup self uninstall

# 打开本地离线文档（非常实用！）
$ rustup doc
```

> **实用技巧：** `rustup doc` 会在浏览器中打开本地安装的完整 Rust 文档，包括标准库 API、The Rust Programming Language 全书等。在没有网络的环境下非常有用。

### 离线开发准备

如果需要在离线环境工作，可以提前下载依赖：

```bash
$ cargo new get-dependencies
$ cd get-dependencies
$ cargo add rand@0.8.5 trpl@0.2.0
```

之后使用 `--offline` 标志运行 `cargo` 命令即可。

---

## 1.2 Hello, World!

> 原文：[Hello, World!](https://doc.rust-lang.org/book/ch01-02-hello-world.html)

### 项目结构

```bash
$ mkdir ~/projects
$ cd ~/projects
$ mkdir hello_world
$ cd hello_world
```

> **命名约定：** Rust 文件使用 `.rs` 扩展名，文件名中多个单词用下划线分隔（snake_case），如 `hello_world.rs`。

### 第一个 Rust 程序

**文件：main.rs**

```rust
fn main() {
    println!("Hello, world!");
}
```

### 编译与运行

```bash
$ rustc main.rs
$ ./main          # Linux/macOS
# 或
> .\main.exe      # Windows
```

输出：`Hello, world!`

### 程序解剖

**1. `fn main()` — 程序入口**

- `fn` 关键字声明函数
- `main` 是特殊函数名，是每个可执行 Rust 程序的入口点
- 无参数、无返回值（此处）
- 函数体用 `{}` 包裹

**2. `println!("Hello, world!");` — 宏调用**

- `println!` 是一个**宏（macro）**，不是普通函数。`!` 是宏调用的标志
- 如果去掉 `!`，写成 `println()`，那就是调用一个名为 `println` 的普通函数（并不存在）
- 语句以分号 `;` 结尾，表示一个表达式的结束

> **为什么用宏而不是函数？** `println!` 是宏因为它需要支持**可变参数**和**编译期格式字符串检查**。Rust 的函数不支持可变参数（variadic arguments），但宏可以在编译期展开为任意数量的代码。这让 `println!("{} + {} = {}", 1, 2, 3)` 这样的调用在编译时就能检查参数数量是否匹配格式占位符。

### 编译 vs 运行：两步分离

```
源码 (.rs) → rustc 编译 → 二进制可执行文件 → 运行
```

**Rust 是提前编译（ahead-of-time compiled）语言。** 这意味着：

- 编译产物是**独立的二进制文件**，运行时不需要安装 Rust
- 可以把编译好的二进制文件交给任何人运行
- 这与 Python、Ruby、JavaScript 等解释型语言不同，后者需要运行时环境

> **设计思考：** 提前编译带来了更好的运行时性能和更简单的部署模型（一个二进制文件即可），但代价是编译时间较长，以及开发时的反馈循环比脚本语言慢。Rust 用 `cargo check`（后面会讲）来缓解这个问题。

### 代码格式化

Rust 官方提供了 `rustfmt` 工具（随 Rust 一起安装），可以自动按照社区标准格式化代码：

```bash
$ rustfmt main.rs
```

---

## 1.3 Hello, Cargo!

> 原文：[Hello, Cargo!](https://doc.rust-lang.org/book/ch01-03-hello-cargo.html)

### 什么是 Cargo？

**Cargo** 是 Rust 的构建系统和包管理器，承担三个角色：

1. **构建代码** — 编译项目
2. **下载依赖** — 从 [crates.io](https://crates.io) 拉取第三方库
3. **构建依赖** — 编译所有依赖库

> **设计思考：** 在 C/C++ 世界中，构建系统（Make/CMake）和包管理器（Conan/vcpkg）是分离的，配置复杂且碎片化。Rust 从一开始就把两者统一为 Cargo，极大降低了项目管理的心智负担。这也是 Rust 开发体验好于 C++ 的重要原因之一。

### 创建 Cargo 项目

```bash
$ cargo new hello_cargo
$ cd hello_cargo
```

该命令自动生成：

```
hello_cargo/
├── Cargo.toml          # 项目配置文件
├── .gitignore          # Git 忽略规则
└── src/
    └── main.rs         # 源代码入口
```

> Cargo 默认会初始化一个 **Git 仓库**（含 `.gitignore`）。如果在已有 Git 仓库内执行，则不会重复初始化。

### Cargo.toml 详解

```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
```

- **TOML**（Tom's Obvious, Minimal Language）是 Cargo 的配置格式
- `[package]` — 包的元信息
  - `name` — 包名
  - `version` — 版本号，遵循 SemVer（语义化版本）
  - `edition` — 使用的 Rust 版本（edition），不是编译器版本。Edition 机制让语言可以演进而不破坏向后兼容
- `[dependencies]` — 依赖列表。Rust 中把第三方库称为 **crate**

### 生成的 main.rs

```rust
fn main() {
    println!("Hello, world!");
}
```

Cargo 约定：**所有源码都放在 `src/` 目录中**，项目根目录只放配置文件、README、LICENSE 等非代码文件。

> 如果你有一个非 Cargo 项目想迁移，只需把代码移入 `src/`，然后运行 `cargo init` 生成 `Cargo.toml`。

### 构建与运行

**构建（debug 模式）：**

```bash
$ cargo build
   Compiling hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 2.85 secs
```

产物路径：`target/debug/hello_cargo`

首次构建还会生成 **Cargo.lock**，记录依赖的精确版本。这个文件由 Cargo 自动管理，不需要手动编辑。

**运行产物：**

```bash
$ ./target/debug/hello_cargo
Hello, world!
```

**编译 + 运行一步到位：**

```bash
$ cargo run
    Finished dev [unoptimized + debuginfo] target(s) in 0.0 secs
     Running `target/debug/hello_cargo`
Hello, world!
```

> `cargo run` 是开发中最常用的命令。如果代码没有修改，它会跳过编译直接运行。

### cargo check — 快速检查

```bash
$ cargo check
   Checking hello_cargo v0.1.0 (file:///projects/hello_cargo)
    Finished dev [unoptimized + debuginfo] target(s) in 0.32 secs
```

`cargo check` 只做编译检查，**不生成可执行文件**，因此速度比 `cargo build` 快得多。在开发过程中，推荐频繁使用 `cargo check` 来验证代码是否能编译通过。

> **实用建议：** 典型的开发工作流是：写代码 → `cargo check` → 修复错误 → 重复。只有在需要实际运行程序时才用 `cargo run` 或 `cargo build`。

### 发布构建

```bash
$ cargo build --release
```

- 产物路径从 `target/debug/` 变为 `target/release/`
- 开启编译优化，运行速度更快，但编译时间更长
- 做性能基准测试（benchmark）时务必使用 `--release`

### Cargo 命令速查表

| 命令 | 用途 | 产物路径 |
|------|------|----------|
| `cargo new <name>` | 创建新项目 | — |
| `cargo init` | 在已有目录初始化 Cargo 项目 | — |
| `cargo build` | 构建（debug） | `target/debug/` |
| `cargo build --release` | 构建（release，含优化） | `target/release/` |
| `cargo run` | 编译并运行 | `target/debug/` |
| `cargo check` | 仅检查编译，不生成二进制 | — |

### 克隆已有项目

```bash
$ git clone example.org/someproject
$ cd someproject
$ cargo build
```

更多 Cargo 详细文档：[Cargo 官方文档](https://doc.rust-lang.org/cargo/)

---

## 小结

本章核心收获：

1. **工具链管理：** rustup 是 Rust 生态的入口，负责安装、更新、管理编译器和工具链版本。`rustup doc` 可以随时打开离线文档。

2. **编译模型：** Rust 是提前编译语言，`rustc` 将源码编译为独立的原生二进制文件。这带来了零运行时依赖的部署优势和接近 C 的性能表现。

3. **宏 vs 函数：** `println!` 中的 `!` 标记它是宏调用。宏在编译期展开，支持可变参数和编译期检查，这是 Rust 类型系统和函数签名无法覆盖的能力。

4. **Cargo 是标准：** 几乎没有人直接用 `rustc` 编译项目。Cargo 统一了构建、依赖管理、测试、发布的全流程。它的 `check` 命令提供了快速的编译反馈，是日常开发的核心命令。

5. **约定优于配置：** Cargo 对项目结构有明确约定（`src/` 放代码，`Cargo.toml` 放配置），减少了决策成本。这种理念贯穿 Rust 生态。
