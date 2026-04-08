---
title: "第 12 章：I/O 项目：构建命令行程序"
description: 通过构建一个 minigrep 程序，综合运用前面学到的知识。
---

# 第 12 章：I/O 项目：构建命令行程序

> 原文：[Chapter 12: An I/O Project](https://doc.rust-lang.org/book/ch12-00-an-io-project.html)

## 本章要点

本章是一个 **综合实战章**，通过构建一个简化版的 `grep` 命令行工具（称为 `minigrep`），将前面 11 章学到的知识融会贯通。这个项目涵盖：

- **代码组织**（第 7 章）：将二进制 crate 拆分为 `main.rs` + `lib.rs`
- **集合类型**（第 8 章）：使用 `Vec<String>` 存储参数和搜索结果
- **错误处理**（第 9 章）：从 `panic!` 逐步演进到 `Result<T, E>` + `?` 运算符
- **泛型与生命周期**（第 10 章）：在 `search` 函数签名中用生命周期标注表达引用关系
- **自动化测试**（第 11 章）：用 TDD 驱动核心搜索逻辑的实现
- **闭包**（第 13 章）：`unwrap_or_else` 中的闭包用于优雅的错误处理
- **Trait 对象**（第 18 章）：`Box<dyn Error>` 作为通用错误类型

最终产出是一个能够：接受命令行参数、读取文件、按关键词搜索行、支持大小写不敏感搜索、将错误信息输出到 stderr 的完整命令行工具。

> Andrew Gallant 基于类似思路创建了 `ripgrep`，一个全功能、极高性能的 grep 替代品。本章的 minigrep 可以帮助你理解此类真实项目的基础架构。

---

## 12.1 接受命令行参数

> 原文：[Accepting Command Line Arguments](https://doc.rust-lang.org/book/ch12-01-accepting-command-line-arguments.html)

### 目标用法

```bash
$ cargo run -- searchstring example-filename.txt
```

`--` 用于分隔 cargo 自身的参数和传递给程序的参数。

### 读取参数：`std::env::args`

`std::env::args()` 返回一个命令行参数的 **迭代器（iterator）**，调用 `collect()` 将其收集为 `Vec<String>`：

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();
    dbg!(args);
}
```

**关键细节：**

- `collect()` 需要显式的类型标注 `Vec<String>`，因为 Rust 无法自动推断要收集成何种集合类型。
- `args[0]` 始终是二进制文件的路径（如 `"target/debug/minigrep"`），真正的用户参数从 `args[1]` 开始。

运行 `cargo run -- needle haystack` 的输出：

```
[src/main.rs:5:5] args = [
    "target/debug/minigrep",
    "needle",
    "haystack",
]
```

### 保存参数到变量

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query}");
    println!("In file {file_path}");
}
```

### Unicode 处理

`std::env::args` 在参数包含非法 Unicode 时会 **panic**。如果需要处理非法 Unicode 参数，应使用 `std::env::args_os`，它返回 `OsString` 而非 `String`。`OsString` 是平台相关的，处理起来比 `String` 更复杂，但覆盖面更广。

---

## 12.2 读取文件

> 原文：[Reading a File](https://doc.rust-lang.org/book/ch12-02-reading-a-file.html)

### 测试数据

在项目根目录创建 `poem.txt`：

```
I'm nobody! Who are you?
Are you nobody, too?
Then there's a pair of us - don't tell!
They'd banish us, you know.

How dreary to be somebody!
How public, like a frog
To tell your name the livelong day
To an admiring bog!
```

### 使用 `fs::read_to_string` 读取文件

```rust
use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query}");
    println!("In file {file_path}");

    let contents = fs::read_to_string(file_path)
        .expect("Should have been able to read the file");

    println!("With text:\n{contents}");
}
```

**核心 API：**

- `std::fs::read_to_string(path)` 打开文件并返回 `std::io::Result<String>`。
- 这里使用 `.expect()` 做初步的错误处理——文件不存在时直接 panic 并给出提示。

### 当前代码的问题

虽然能工作，但存在明显的设计缺陷：

1. **`main` 函数职责过多**：参数解析、文件读取、打印输出全堆在一起。
2. **配置变量散落各处**：`query` 和 `file_path` 是独立变量，没有表达它们的关联性。
3. **错误处理粗糙**：所有错误都用 `expect`，信息模糊。
4. **不可测试**：逻辑全在 `main` 中，无法编写单元测试。

> **最佳实践**：尽早重构。代码量小的时候重构成本最低，等问题积累再改就困难多了。

---

## 12.3 重构以改进模块化和错误处理

> 原文：[Refactoring to Improve Modularity and Error Handling](https://doc.rust-lang.org/book/ch12-03-improving-error-handling-and-modularity.html)

这是本章最核心的一节，展示了 Rust 项目的 **渐进式重构** 方法论。一共经历 8 个步骤，从"一坨代码"演变为"结构清晰的双 crate 架构"。

### Rust 二进制项目的推荐结构

| 文件 | 职责 |
|------|------|
| `main.rs` | 程序入口：解析参数、配置、调用逻辑、处理错误 |
| `lib.rs` | 所有业务逻辑（可测试、可复用） |

`main` 函数应当足够小，小到"看一眼就能验证正确性"。

### 第一步：提取参数解析函数

```rust
fn main() {
    let args: Vec<String> = env::args().collect();
    let (query, file_path) = parse_config(&args);
    // ...
}

fn parse_config(args: &[String]) -> (&str, &str) {
    let query = &args[1];
    let file_path = &args[2];
    (query, file_path)
}
```

这一步虽然简单，但建立了"参数解析是独立关注点"的意识。

### 第二步：用 struct 聚合配置

返回元组 `(&str, &str)` 的问题在于：调用者需要记住哪个是 query、哪个是 file_path。用 struct 让语义更明确：

```rust
struct Config {
    query: String,
    file_path: String,
}

fn parse_config(args: &[String]) -> Config {
    let query = args[1].clone();
    let file_path = args[2].clone();
    Config { query, file_path }
}
```

**为什么用 `.clone()` 而不是引用？**

这是一个 **性能与简洁性的权衡**。使用引用需要管理生命周期（`Config` 的生命周期必须短于 `args`），而 `clone()` 虽然有一次内存拷贝，但：
- 配置只在启动时解析一次
- 字符串很短（文件路径、搜索词）
- 代码简洁得多

> 在 Rust 社区中，这种"为了简洁性牺牲微小性能"的做法是被广泛接受的。过度优化反而是 anti-pattern。

### 第三步：将 `parse_config` 变为关联函数（constructor）

```rust
impl Config {
    fn new(args: &[String]) -> Config {
        let query = args[1].clone();
        let file_path = args[2].clone();
        Config { query, file_path }
    }
}

// 调用方式
let config = Config::new(&args);
```

这更符合 Rust 的惯用法（idiomatic），类似 `String::new()`。

### 第四步：改进错误信息

当用户不传参数时，原始错误信息是：

```
index out of bounds: the len is 1 but the index is 1
```

这对终端用户毫无意义。改进方案：

```rust
impl Config {
    fn new(args: &[String]) -> Config {
        if args.len() < 3 {
            panic!("not enough arguments");
        }
        // ...
    }
}
```

但 `panic!` 适合 **编程错误**（programmer error），不适合 **使用错误**（usage error）。

### 第五步：返回 `Result` 替代 `panic!`（关键转折）

将 `new` 重命名为 `build`（因为它可能失败，而 `new` 在 Rust 中通常暗示不会失败），返回 `Result`：

```rust
impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        Ok(Config { query, file_path })
    }
}
```

**命名哲学**：`new` vs `build`

- `new` 暗示"一定能创建成功"（如 `Vec::new()`）
- `build` 暗示"构建过程可能失败"（如 Builder 模式）

### 第六步：在 `main` 中优雅处理错误

```rust
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    // ...
}
```

**`unwrap_or_else` 的精妙之处：**

- 成功时：自动解包 `Ok` 中的值，行为和 `unwrap` 一样。
- 失败时：调用闭包（closure），闭包参数 `err` 是 `Err` 中的值。
- 闭包内调用 `process::exit(1)` 以非零状态码退出，这是命令行工具的惯例。

输出变成了用户友好的：

```
Problem parsing arguments: not enough arguments
```

没有 `thread 'main' panicked` 的噪音。

### 第七步：提取 `run` 函数并返回 `Result`

将业务逻辑从 `main` 中抽出：

```rust
use std::error::Error;

fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    println!("With text:\n{contents}");

    Ok(())
}
```

**深入理解 `Box<dyn Error>`：**

- `dyn Error` 是一个 **trait 对象**（trait object），表示"任何实现了 `Error` trait 的类型"。
- `Box<dyn Error>` 将其放在堆上，因为 trait 对象的大小在编译期未知（unsized）。
- 这让 `run` 可以返回不同类型的错误（I/O 错误、解析错误等），而无需在签名中逐一列出。
- `?` 运算符自动将具体错误类型转换为 `Box<dyn Error>`。

在 `main` 中处理 `run` 的错误时，使用 `if let` 而非 `unwrap_or_else`：

```rust
if let Err(e) = run(config) {
    println!("Application error: {e}");
    process::exit(1);
}
```

为什么不用 `unwrap_or_else`？因为 `run` 成功时返回 `()`，我们不需要"解包"一个空值。`if let` 只关心错误情况，语义更清晰。

### 第八步：拆分为 lib.rs 和 main.rs

将 `Config` struct、`Config::build`、`run` 函数以及 `search` 函数全部移入 `src/lib.rs`，并标记为 `pub`：

**src/lib.rs**（核心逻辑，可测试）：

```rust
use std::error::Error;
use std::fs;

pub struct Config {
    pub query: String,
    pub file_path: String,
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        Ok(Config { query, file_path })
    }
}

pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    for line in search(&config.query, &contents) {
        println!("{line}");
    }

    Ok(())
}

pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    // 将在 12.4 中实现
    vec![]
}
```

**src/main.rs**（入口，尽可能精简）：

```rust
use std::env;
use std::process;

use minigrep::Config;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        println!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        println!("Application error: {e}");
        process::exit(1);
    }
}
```

### 重构总结

| 步骤 | 改进 |
|------|------|
| 1. 提取 `parse_config` | 分离关注点 |
| 2. 引入 `Config` struct | 语义化配置 |
| 3. 改为 `Config::new` | 符合 Rust 惯用法 |
| 4. 添加输入校验 | 改善错误信息 |
| 5. 返回 `Result` | 让调用者决定如何处理错误 |
| 6. `unwrap_or_else` + `process::exit` | 用户友好的错误输出 |
| 7. 提取 `run` 函数 | 业务逻辑独立 |
| 8. 拆分 lib.rs / main.rs | 可测试、可复用 |

---

## 12.4 用测试驱动开发完善功能

> 原文：[Developing the Library's Functionality with Test-Driven Development](https://doc.rust-lang.org/book/ch12-04-testing-the-librarys-functionality.html)

架构就绪后，用 **TDD（Test-Driven Development）** 实现核心搜索逻辑。TDD 流程：

1. **编写一个会失败的测试**（明确期望行为）
2. **编写刚好足够的代码让测试通过**
3. **重构**（保持测试通过）
4. 重复

### 编写失败的测试

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }
}
```

对应的 `search` 函数签名：

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    unimplemented!();
}
```

**生命周期标注 `'a` 的深层含义：**

函数签名 `search<'a>(query: &str, contents: &'a str) -> Vec<&'a str>` 告诉编译器：返回的 `Vec` 中的字符串切片（`&str`）与 `contents` 参数的生命周期绑定，而非与 `query` 绑定。这完全合理——返回的是 `contents` 中匹配行的引用，它们的有效期自然不能超过 `contents` 本身。

如果省略生命周期标注，Rust 无法推断返回值引用的是 `query` 还是 `contents`，编译会失败。这正是生命周期系统的价值：**在编译期保证引用的有效性**。

### 逐步实现 `search`

**第一步：遍历每一行**

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    for line in contents.lines() {
        // ...
    }
}
```

`lines()` 方法返回一个按行分割的迭代器，是 `str` 类型的内置方法。

**第二步：检查每行是否包含查询字符串**

```rust
for line in contents.lines() {
    if line.contains(query) {
        // ...
    }
}
```

**第三步：收集匹配行并返回**

```rust
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }

    results
}
```

运行 `cargo test`：

```
running 1 test
test tests::one_result ... ok
```

### 实际运行效果

```bash
$ cargo run -- frog poem.txt
How public, like a frog

$ cargo run -- body poem.txt
I'm nobody! Who are you?
Are you nobody, too?
How dreary to be somebody!

$ cargo run -- monomorphization poem.txt
# （无输出——没有匹配行）
```

---

## 12.5 使用环境变量

> 原文：[Working with Environment Variables](https://doc.rust-lang.org/book/ch12-05-working-with-environment-variables.html)

### 需求

添加 **大小写不敏感搜索**（case-insensitive search）功能，通过环境变量 `IGNORE_CASE` 控制。环境变量的好处是用户可以设置一次，对整个终端会话生效，而无需每次运行时传参。

### 用 TDD 驱动实现

先写测试。将原有测试重命名为 `case_sensitive`，新增 `case_insensitive`：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn case_sensitive() {
        let query = "duct";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Duct tape.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }

    #[test]
    fn case_insensitive() {
        let query = "rUsT";
        let contents = "\
Rust:
safe, fast, productive.
Pick three.
Trust me.";

        assert_eq!(
            vec!["Rust:", "Trust me."],
            search_case_insensitive(query, contents)
        );
    }
}
```

注意 `case_sensitive` 测试中新增了 `"Duct tape."` 行——它以大写 D 开头，不应被小写 `"duct"` 匹配。

### 实现 `search_case_insensitive`

```rust
pub fn search_case_insensitive<'a>(
    query: &str,
    contents: &'a str,
) -> Vec<&'a str> {
    let query = query.to_lowercase();
    let mut results = Vec::new();

    for line in contents.lines() {
        if line.to_lowercase().contains(&query) {
            results.push(line);
        }
    }

    results
}
```

**关键细节：**

- `to_lowercase()` 返回一个新的 `String`（不是 `&str`），因为大小写转换可能改变字节长度（如德语的 `ß` 转大写变成 `SS`）。
- 因此 `query` 从 `&str` 变成了 `String`，传给 `contains` 时需要 `&query`（取引用）。
- 返回的仍然是 **原始行**（未转换大小写的），只有比较时才做转换。

### 集成到 `Config` 和 `run`

**扩展 Config：**

```rust
pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    pub fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }

        let query = args[1].clone();
        let file_path = args[2].clone();

        let ignore_case = env::var("IGNORE_CASE").is_ok();

        Ok(Config {
            query,
            file_path,
            ignore_case,
        })
    }
}
```

**`env::var("IGNORE_CASE").is_ok()` 的工作原理：**

- `env::var()` 返回 `Result<String, VarError>`。
- 如果环境变量存在（无论值是什么），返回 `Ok(value)`，`.is_ok()` 为 `true`。
- 如果环境变量不存在，返回 `Err`，`.is_ok()` 为 `false`。
- 我们不关心变量的值，只关心它是否被设置了。

**更新 run 函数：**

```rust
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(config.file_path)?;

    let results = if config.ignore_case {
        search_case_insensitive(&config.query, &contents)
    } else {
        search(&config.query, &contents)
    };

    for line in results {
        println!("{line}");
    }

    Ok(())
}
```

### 使用演示

**区分大小写（默认）：**

```bash
$ cargo run -- to poem.txt
Are you nobody, too?
How dreary to be somebody!
```

**不区分大小写：**

```bash
$ IGNORE_CASE=1 cargo run -- to poem.txt
Are you nobody, too?
How dreary to be somebody!
To tell your name the livelong day
To an admiring bog!
```

在 PowerShell 中：

```powershell
PS> $Env:IGNORE_CASE=1; cargo run -- to poem.txt
PS> Remove-Item Env:IGNORE_CASE  # 取消设置
```

> **设计思考**：当命令行参数和环境变量都可以控制同一行为时，需要定义优先级。常见做法是命令行参数优先于环境变量，因为命令行参数更"局部"。

---

## 12.6 将错误消息写入标准错误

> 原文：[Writing Error Messages to Standard Error Instead of Standard Output](https://doc.rust-lang.org/book/ch12-06-writing-to-stderr-instead-of-stdout.html)

### 问题

目前所有输出（包括错误信息）都通过 `println!` 写入 **stdout**。当用户用重定向将输出保存到文件时：

```bash
$ cargo run > output.txt
```

错误信息也被写入了 `output.txt`，而不是显示在屏幕上。这违反了命令行工具的惯例：

- **stdout**：程序的正常输出（数据），可以被管道（pipe）或重定向。
- **stderr**：错误信息、诊断信息，始终显示在终端上。

### 解决方案：`eprintln!`

Rust 标准库提供 `eprintln!` 宏，语法和 `println!` 完全一样，但输出到 **stderr**：

```rust
use std::env;
use std::process;

use minigrep::Config;

fn main() {
    let args: Vec<String> = env::args().collect();

    let config = Config::build(&args).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    }
}
```

只需将错误处理中的 `println!` 替换为 `eprintln!`，正常的搜索结果输出仍然用 `println!`。

### 验证效果

**触发错误（不传参数），重定向 stdout：**

```bash
$ cargo run > output.txt
Problem parsing arguments: not enough arguments
```

错误信息显示在终端上，`output.txt` 为空。

**正常运行，重定向 stdout：**

```bash
$ cargo run -- to poem.txt > output.txt
```

终端无输出（一切正常），`output.txt` 包含搜索结果：

```
Are you nobody, too?
How dreary to be somebody!
```

### stdout vs stderr 速查

| 宏 | 输出目标 | 用途 |
|-----|---------|------|
| `println!` | stdout | 程序正常输出（数据） |
| `eprintln!` | stderr | 错误信息、诊断信息 |
| `print!` | stdout | 同 `println!`，不换行 |
| `eprint!` | stderr | 同 `eprintln!`，不换行 |

---

## 小结

通过构建 `minigrep`，本章展示了一个 Rust 命令行程序从原型到生产级代码的完整演进过程：

### 架构演进路径

```
一坨代码（all in main）
    ↓ 提取函数
分离参数解析
    ↓ 引入 struct
语义化配置
    ↓ Result + 闭包
优雅错误处理
    ↓ 提取 run 函数
业务逻辑独立
    ↓ 拆分 crate
lib.rs（可测试） + main.rs（入口）
    ↓ TDD
搜索功能完善
    ↓ 环境变量
可配置行为
    ↓ stderr
符合命令行惯例
```

### 核心 Rust 知识点回顾

| 知识点 | 在 minigrep 中的体现 |
|--------|---------------------|
| **所有权与借用** | `&args[1]` 借用参数，`args[1].clone()` 获取所有权 |
| **生命周期** | `search<'a>` 标注返回值与 `contents` 的生命周期关系 |
| **Result 与 ?** | `Config::build` 返回 `Result`，`run` 使用 `?` 传播错误 |
| **Trait 对象** | `Box<dyn Error>` 作为通用错误返回类型 |
| **闭包** | `unwrap_or_else(\|err\| { ... })` 处理构建失败 |
| **迭代器** | `env::args()` 返回迭代器，`lines()` 按行遍历 |
| **模块系统** | `lib.rs` / `main.rs` 分离，`pub` 可见性控制 |
| **测试** | `#[cfg(test)]` 模块，`assert_eq!` 断言，TDD 流程 |
| **环境变量** | `std::env::var` 读取，`is_ok()` 判断是否设置 |
| **标准输出/错误** | `println!` vs `eprintln!` 的正确使用场景 |

### 最终项目结构

```
minigrep/
├── Cargo.toml
├── poem.txt
└── src/
    ├── main.rs    # 入口：参数解析、错误处理、调用 lib
    └── lib.rs     # 核心逻辑：Config、run、search、search_case_insensitive
```

> 第 13 章将介绍 **闭包和迭代器** 的高级用法，并回到 minigrep 项目中用迭代器重构 `search` 函数和 `Config::build`，使代码更简洁、更 Rust 化。
