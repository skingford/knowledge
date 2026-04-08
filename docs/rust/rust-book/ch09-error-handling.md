---
title: "第 9 章：错误处理"
description: 不可恢复错误 panic!、可恢复错误 Result、何时该 panic 何时该返回 Result。
---

# 第 9 章：错误处理

> 原文：[Chapter 9: Error Handling](https://doc.rust-lang.org/book/ch09-00-error-handling.html)

## 本章要点

- Rust **没有异常 (exception)** 机制。它将错误分为两大类，分别用不同的类型来处理：
  - **不可恢复错误 (unrecoverable error)**：使用 `panic!` 宏，立即终止程序。
  - **可恢复错误 (recoverable error)**：使用 `Result<T, E>` 枚举，让调用者自行决定如何处理。
- `?` 运算符是错误传播 (error propagation) 的语法糖，极大地简化了 `Result` 和 `Option` 的链式处理。
- 利用类型系统 (type system) 在编译期杜绝非法状态，是 Rust 错误处理哲学的核心延伸。

---

## 9.1 用 `panic!` 处理不可恢复错误

> 原文：[Unrecoverable Errors with panic!](https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html)

### 9.1.1 什么时候会 panic

panic 的触发方式有两种：

1. **显式调用** `panic!` 宏。
2. **隐式触发**：执行了导致 panic 的操作（如越界访问数组）。

默认行为：打印错误信息 -> **栈展开 (unwinding)** -> 逐帧清理数据 -> 退出进程。

### 9.1.2 Unwinding vs. Aborting

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| **Unwinding（默认）** | 逆序遍历调用栈，逐帧 drop 数据 | 开发/调试，需要 backtrace |
| **Aborting** | 立即终止进程，由操作系统回收内存 | 需要最小二进制体积的 release 构建 |

切换为 abort 模式：

```toml
[profile.release]
panic = 'abort'
```

> **精读笔记**：unwinding 会在二进制中插入大量的"着陆垫 (landing pad)"代码，用于析构。切换为 abort 可显著减小产物体积，常见于嵌入式和 WebAssembly 场景。

### 9.1.3 基本示例

```rust
fn main() {
    panic!("crash and burn");
}
```

输出：

```
thread 'main' panicked at src/main.rs:2:5:
crash and burn
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
```

关键信息：`src/main.rs:2:5` 指明了 panic 发生的文件、行号和列号。

### 9.1.4 隐式 panic：越界访问

```rust
fn main() {
    let v = vec![1, 2, 3];
    v[99]; // index out of bounds: the len is 3 but the index is 99
}
```

> **精读笔记**：在 C 语言中，越界读取是未定义行为 (undefined behavior)，可能导致**缓冲区过读 (buffer overread)** 漏洞。Rust 选择立即 panic，这是**安全性 (safety)** 高于性能的设计取舍。

### 9.1.5 使用 `RUST_BACKTRACE` 阅读 backtrace

```bash
RUST_BACKTRACE=1 cargo run
```

backtrace 的阅读方法：

1. **从顶部向下看**，找到第一行属于自己项目的文件（如 `panic::main at ./src/main.rs:4:6`）。
2. 该行之上是你的代码调用的标准库 / 第三方库代码。
3. 该行之下是调用你代码的运行时入口。

使用 `RUST_BACKTRACE=full` 可以获取更详细的信息。注意，debug symbols 仅在不带 `--release` 时默认开启。

---

## 9.2 用 `Result` 处理可恢复错误

> 原文：[Recoverable Errors with Result](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)

### 9.2.1 `Result<T, E>` 的定义

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

- `T`：操作成功时返回的值的类型。
- `E`：操作失败时返回的错误类型。

`Result` 及其变体 `Ok` / `Err` 被 prelude 自动引入，无需手动 `use`。

### 9.2.2 用 `match` 处理 `Result`

**基础模式：**

```rust
use std::fs::File;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {error:?}"),
    };
}
```

**按错误类型分别处理（嵌套 match）：**

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file_result = File::open("hello.txt");

    let greeting_file = match greeting_file_result {
        Ok(file) => file,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => match File::create("hello.txt") {
                Ok(fc) => fc,
                Err(e) => panic!("Problem creating the file: {e:?}"),
            },
            _ => {
                panic!("Problem opening the file: {error:?}");
            }
        },
    };
}
```

> **精读笔记**：`io::Error` 提供了 `kind()` 方法，返回 `io::ErrorKind` 枚举，让你可以针对不同的 I/O 错误类型（`NotFound`、`PermissionDenied` 等）做不同处理。这是 Rust 错误处理的精细之处。

### 9.2.3 用闭包 (closure) 替代嵌套 match

`unwrap_or_else` 接收一个闭包，代码更扁平、更易读：

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let greeting_file = File::open("hello.txt").unwrap_or_else(|error| {
        if error.kind() == ErrorKind::NotFound {
            File::create("hello.txt").unwrap_or_else(|error| {
                panic!("Problem creating the file: {error:?}");
            })
        } else {
            panic!("Problem opening the file: {error:?}");
        }
    });
}
```

### 9.2.4 快捷方法：`unwrap()` 与 `expect()`

| 方法 | 行为 | 推荐度 |
|------|------|--------|
| `unwrap()` | `Ok` 时返回值，`Err` 时 panic（使用默认错误信息） | 原型/示例代码 |
| `expect("msg")` | 同上，但 panic 时使用自定义信息 | **生产代码首选** |

```rust
// unwrap：panic 信息不够明确
let f = File::open("hello.txt").unwrap();

// expect：panic 信息清晰，便于定位
let f = File::open("hello.txt")
    .expect("hello.txt should be included in this project");
```

> **精读笔记**：`expect` 优于 `unwrap` 的根本原因在于——当你看到 panic 日志时，`expect` 的自定义信息能直接告诉你**程序员的意图**（即"为什么认为这里不应该出错"），而非仅仅"这里出错了"。

### 9.2.5 错误传播 (Error Propagation)

当函数内部遇到错误，通常不在本层处理，而是将错误**向上传播**给调用方，让调用方有更多上下文来决定如何处理。

**手动传播（用 match）：**

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let username_file_result = File::open("hello.txt");

    let mut username_file = match username_file_result {
        Ok(file) => file,
        Err(e) => return Err(e),
    };

    let mut username = String::new();

    match username_file.read_to_string(&mut username) {
        Ok(_) => Ok(username),
        Err(e) => Err(e),
    }
}
```

> **精读笔记**：注意第一个 match 中使用了 `return Err(e)` 提前返回，而第二个 match 是函数最后一个表达式，不需要 `return`。这种"提前返回错误、正常路径继续"的模式正是 `?` 运算符要自动化的。

### 9.2.6 `?` 运算符：错误传播的核心机制 (重点)

#### 基本用法

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut username_file = File::open("hello.txt")?;
    let mut username = String::new();
    username_file.read_to_string(&mut username)?;
    Ok(username)
}
```

#### `?` 运算符的工作原理（展开）

`expression?` 等价于：

```rust
match expression {
    Ok(value) => value,             // 成功：解包，继续执行
    Err(e) => return Err(From::from(e)),  // 失败：转换类型，提前返回
}
```

**关键步骤分解：**

1. **`Ok(value)`**：提取 `Ok` 中的值，赋给左侧变量，程序继续执行下一行。
2. **`Err(e)`**：
   - 调用 `From::from(e)` 将错误类型 `e` 转换为函数签名中声明的错误类型 `E`。
   - 使用 `return` 将 `Err(converted_error)` **立即从当前函数返回**给调用者。

> **精读笔记：`From` trait 的隐式转换是 `?` 运算符的灵魂。** 这意味着：
>
> - 如果你的函数返回 `Result<T, MyError>`，且你为 `MyError` 实现了 `impl From<io::Error> for MyError`，那么所有返回 `io::Error` 的操作都可以直接用 `?`，错误会自动转换。
> - 这构成了一条**错误转换链路 (error conversion chain)**：底层库错误 -> 中间层错误 -> 应用层错误，每一层只需实现 `From`，`?` 负责串联。

#### 错误传播链路图解

```
read_username_from_file() -> Result<String, io::Error>
    |
    |-- File::open("hello.txt")?
    |       |
    |       |-- Ok(file)  => file （继续执行）
    |       |-- Err(e)    => return Err(From::from(e))  （立即返回）
    |
    |-- file.read_to_string(&mut username)?
    |       |
    |       |-- Ok(_)     => _  （继续执行）
    |       |-- Err(e)    => return Err(From::from(e))  （立即返回）
    |
    |-- Ok(username)  （全部成功，返回 Ok）
```

#### 链式调用

```rust
fn read_username_from_file() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("hello.txt")?.read_to_string(&mut username)?;
    Ok(username)
}
```

每个 `?` 都是一个潜在的"提前返回点"。调用链上任何一步失败，错误都会沿着调用栈向上传播。

#### 终极简化：`fs::read_to_string`

```rust
use std::fs;
use std::io;

fn read_username_from_file() -> Result<String, io::Error> {
    fs::read_to_string("hello.txt")
}
```

标准库为极其常见的"读文件到字符串"操作提供了一步到位的 API。

### 9.2.7 `?` 运算符与自定义错误类型

```rust
use std::io;
use std::num::ParseIntError;

// 定义应用级错误枚举
enum AppError {
    Io(io::Error),
    Parse(ParseIntError),
}

// 为每种底层错误实现 From
impl From<io::Error> for AppError {
    fn from(e: io::Error) -> Self {
        AppError::Io(e)
    }
}

impl From<ParseIntError> for AppError {
    fn from(e: ParseIntError) -> Self {
        AppError::Parse(e)
    }
}

// 现在可以在同一个函数中对 io 操作和 parse 操作都使用 ?
fn read_and_parse() -> Result<i32, AppError> {
    let content = std::fs::read_to_string("number.txt")?;  // io::Error -> AppError
    let number = content.trim().parse::<i32>()?;            // ParseIntError -> AppError
    Ok(number)
}
```

> **精读笔记**：这就是 `?` + `From` 构成的**错误传播链路**的完整模式。社区中的 `thiserror` crate 可以用 derive 宏自动生成这些 `From` 实现和 `Display` 格式化。

### 9.2.8 `?` 运算符用于 `Option<T>`

`?` 不仅适用于 `Result`，也适用于 `Option`：

```rust
fn last_char_of_first_line(text: &str) -> Option<char> {
    text.lines().next()?.chars().last()
}
```

- `next()` 返回 `Option<&str>`。如果为 `None`，`?` 立即返回 `None`。
- 如果为 `Some(line)`，继续调用 `.chars().last()`。

**重要限制**：不能在同一个函数中混用 `Result` 的 `?` 和 `Option` 的 `?`，除非手动转换：

- `Option` -> `Result`：`.ok_or(error)` 或 `.ok_or_else(|| error)`
- `Result` -> `Option`：`.ok()`

### 9.2.9 在 `main()` 中使用 `?`

`main()` 默认返回 `()`，不能直接使用 `?`。解决方案是将返回类型改为 `Result`：

```rust
use std::error::Error;
use std::fs::File;

fn main() -> Result<(), Box<dyn Error>> {
    let greeting_file = File::open("hello.txt")?;
    Ok(())
}
```

- `Box<dyn Error>` 是一个 trait object，可以容纳**任何**实现了 `Error` trait 的类型。
- `main` 返回 `Ok(())` 时进程退出码为 `0`；返回 `Err` 时退出码为非零值。
- 这与 C 语言的 `EXIT_SUCCESS` / `EXIT_FAILURE` 约定兼容。

> **精读笔记**：`Box<dyn Error>` 在小型程序和脚本中非常方便，但在大型项目中通常会用具体的错误枚举或 `anyhow::Error`（来自 `anyhow` crate）来获得更好的类型安全和上下文信息。

### 9.2.10 错误处理方法总览

| 方法 | 适用场景 | 特点 |
|------|----------|------|
| `match` | 需要精细控制不同错误类型 | 最灵活，但冗长 |
| `unwrap()` | 确信结果一定是 `Ok` | 简洁但 panic 信息不友好 |
| `expect("msg")` | 确信结果一定是 `Ok`，需留下说明 | **推荐**替代 `unwrap` |
| `unwrap_or_else(\|e\| ...)` | 需要闭包处理错误逻辑 | 比嵌套 match 更扁平 |
| `?` 运算符 | 函数返回 `Result` / `Option` 时传播错误 | **最常用**，简洁优雅 |
| `map_err(\|e\| ...)` | 需要在传播前转换错误类型/添加上下文 | 常与 `?` 配合使用 |

---

## 9.3 要不要 `panic!`

> 原文：[To panic! or Not to panic!](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)

### 9.3.1 决策框架

| 场景 | 选择 | 原因 |
|------|------|------|
| 示例代码 / 原型 / 测试 | `unwrap` / `expect` | 简洁明了，标记"此处需要错误处理" |
| 硬编码的已知安全值 | `expect` | 编译器无法推断值一定合法 |
| 违反函数契约 (contract) | `panic!` | 调用者的 bug，不应被"恢复" |
| 安全关键操作 | `panic!` | 继续执行可能导致安全漏洞 |
| 预期内的失败（网络、I/O、用户输入） | `Result` | 让调用者决定恢复策略 |
| 库函数 | `Result`（默认） | 给调用者最大灵活性 |

### 9.3.2 "坏状态 (bad state)"判断标准

当代码进入**坏状态**时（假设、保证、契约或不变量被打破），应当 panic，前提是满足以下任一条件：

1. 该坏状态是**意料之外**的（不是用户输入格式错误这种正常情况）。
2. 后续代码**依赖于不处于坏状态**，而不是每一步都检查。
3. **无法用类型系统编码**这个约束。

### 9.3.3 当你比编译器知道得更多

```rust
use std::net::IpAddr;

let home: IpAddr = "127.0.0.1"
    .parse()
    .expect("Hardcoded IP address should be valid");
```

`parse()` 返回 `Result`，因为编译器无法在编译期验证字符串是否是合法 IP。但程序员知道 `"127.0.0.1"` 一定合法，所以用 `expect` 并附上解释是合理的。

### 9.3.4 用类型系统进行验证（newtype 模式）

与其在每个使用点做运行时检查，不如创建一个自定义类型，在构造时一次性验证：

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }

        Guess { value }
    }

    pub fn value(&self) -> i32 {
        self.value
    }
}
```

**设计要点：**

- `value` 字段是 **private** 的，外部代码无法绕过 `Guess::new` 直接构造。
- 验证逻辑集中在 `new` 中，后续所有接受 `Guess` 的函数自动获得"值在 1..=100"的保证。
- 这是 **"使非法状态不可表示 (make illegal states unrepresentable)"** 原则的实践。

> **精读笔记**：这种模式在 Rust 社区被称为 **newtype pattern**。更进一步，可以让 `new` 返回 `Result<Guess, GuessError>` 而非 panic，这样调用者可以自行处理无效输入。选择 panic 还是 Result 取决于"无效值是 bug 还是用户可能提供的数据"。

### 9.3.5 库代码 vs. 应用代码

- **库代码**：默认返回 `Result`，让调用者决定策略。panic 应仅用于真正的"不可能发生"场景。
- **应用代码**：可以更自由地使用 `unwrap` / `expect`，因为你掌控整个调用链。

---

## 小结

Rust 的错误处理体系围绕两个核心类型展开：

1. **`panic!`**：适用于程序进入无法恢复的状态（bug、契约违反、安全问题）。
2. **`Result<T, E>`**：适用于可预期的失败，将决策权交给调用者。

**`?` 运算符是日常 Rust 编程中最重要的错误处理工具**，其本质是：
- 对 `Ok(v)` 解包取值继续执行。
- 对 `Err(e)` 调用 `From::from(e)` 转换错误类型后提前返回。
- 通过 `From` trait 实现的隐式转换，串联起从底层到顶层的完整错误传播链路。

最佳实践速查：

| 你的情况 | 推荐做法 |
|----------|----------|
| 快速原型 | `unwrap()` / `expect()` |
| 可恢复失败 | 返回 `Result`，用 `?` 传播 |
| 不可恢复 bug | `panic!` |
| 多种底层错误 | 定义错误枚举 + `impl From` + `?` |
| 需要上下文信息 | `map_err` 添加上下文，或使用 `anyhow` / `thiserror` |
| 约束验证 | newtype pattern，构造时验证 |
| `main` 函数 | `fn main() -> Result<(), Box<dyn Error>>` |
