---
title: "第 2 章：猜数游戏"
description: 通过一个完整的猜数游戏项目，初步体验 Rust 的变量、类型、标准库和错误处理。
---

# 第 2 章：猜数游戏

> 原文：[Chapter 2: Programming a Guessing Game](https://doc.rust-lang.org/book/ch02-00-guessing-game-tutorial.html)

## 本章要点

- **变量默认不可变**：Rust 中 `let` 声明的变量默认是 immutable 的，需要 `mut` 关键字才能修改
- **类型推断与类型转换**：Rust 是强类型语言，但编译器能自动推断大部分类型；跨类型比较需要显式转换
- **所有权初体验**：`&mut guess` 传递可变引用，避免数据拷贝，这是 Rust 所有权系统的冰山一角
- **`Result` 枚举与错误处理**：Rust 没有异常机制，用 `Result<T, E>` 枚举表达可能失败的操作
- **`match` 表达式**：Rust 最强大的控制流结构之一，要求穷举所有可能的模式
- **Shadowing（变量遮蔽）**：允许用相同名字重新声明变量，常用于类型转换场景
- **Cargo 生态**：通过 Cargo.toml 声明依赖，`Cargo.lock` 保证可重复构建

## 2.1 创建新项目

```bash
$ cargo new guessing_game
$ cd guessing_game
```

Cargo 生成的项目结构包含 `Cargo.toml`（项目元数据和依赖声明）和 `src/main.rs`（入口文件）。

```toml
[package]
name = "guessing_game"
version = "0.1.0"
edition = "2024"

[dependencies]
```

> **设计思考**：Cargo 同时充当包管理器和构建系统的角色，这与 Go 的 `go mod` 理念类似。`edition` 字段允许在不破坏向后兼容的前提下引入新的语言特性。

## 2.2 处理用户输入

### Listing 2-1：读取用户猜测

```rust
use std::io;

fn main() {
    println!("Guess the number!");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

### 核心知识点拆解

**1. `use std::io` —— 导入标准库模块**

Rust 的 prelude 只自动引入最常用的类型。`io` 模块需要显式导入。如果不写 `use std::io`，也可以在调用时写全路径 `std::io::stdin()`。

**2. `let mut guess = String::new()` —— 可变变量**

```rust
let apples = 5;       // 不可变
let mut bananas = 5;  // 可变
```

> **为什么默认不可变？** 这是 Rust 的核心设计哲学之一。不可变变量让编译器可以做更多优化，也让代码更容易推理。当你需要可变性时，`mut` 关键字是一个显式的信号，告诉读代码的人"这个值会被修改"。

`String::new()` 是 `String` 类型的关联函数（associated function），类似其他语言中的静态方法。`String` 是标准库提供的可增长的 UTF-8 编码字符串类型。

**3. `io::stdin().read_line(&mut guess)` —— 引用与可变引用**

- `&` 表示引用（reference），让多处代码访问同一份数据而无需拷贝
- `&mut` 表示可变引用，允许通过引用修改数据
- 引用默认也是不可变的，所以需要写 `&mut guess` 而非 `&guess`

> **设计思考**：引用是 Rust 所有权系统的基础构件。这里只是初步接触，第 4 章会深入展开。关键理解：Rust 通过编译期检查引用的生命周期和可变性，从根本上消除数据竞争。

**4. `.expect("Failed to read line")` —— 处理 `Result`**

`read_line` 返回 `Result<usize, io::Error>`，这是一个枚举类型：
- `Ok(值)` —— 操作成功，包含结果
- `Err(错误)` —— 操作失败，包含错误信息

`.expect()` 在 `Ok` 时解包返回值，在 `Err` 时带着自定义消息触发 panic（程序崩溃）。如果不调用 `.expect()`，编译器会给出 warning，提醒你没有处理可能的错误。

> **为什么不用 try-catch？** Rust 认为异常机制的问题在于"不可见的控制流"。`Result` 类型让错误成为返回值的一部分，迫使调用者明确处理。这在大型项目中极大减少了被忽略的错误。

**5. `println!("You guessed: {guess}")` —— 字符串插值**

`{}` 是占位符。可以直接在花括号中放变量名，也可以用位置参数：

```rust
let x = 5;
let y = 10;
println!("x = {x} and y + 2 = {}", y + 2);
```

## 2.3 生成随机数

### 引入外部 crate

在 `Cargo.toml` 中添加依赖：

```toml
[dependencies]
rand = "0.8.5"
```

版本号 `"0.8.5"` 实际上是 `^0.8.5` 的简写，表示兼容 0.8.5 及以上但低于 0.9.0 的版本（遵循 SemVer 语义版本控制）。

> **`Cargo.lock` 的作用**：首次 `cargo build` 时，Cargo 解析依赖树并将确切版本写入 `Cargo.lock`。后续构建都使用锁定的版本，保证可重复构建。只有运行 `cargo update` 才会在兼容范围内升级版本。

### Listing 2-3：生成随机数

```rust
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}
```

- `rand::Rng` 是一个 trait（特征），定义了随机数生成器的方法。必须将其引入作用域，才能调用 `gen_range`
- `rand::thread_rng()` 返回当前线程本地的随机数生成器
- `1..=100` 是 Rust 的范围语法：`..=` 表示闭区间（包含两端），`..` 表示左闭右开区间

> **Trait 初探**：`use rand::Rng` 这一行非常关键。Rust 的 trait 类似接口，但方法调用要求 trait 在作用域内。这是 Rust "显式优于隐式" 设计哲学的体现。

## 2.4 比较猜测值与目标值

### Listing 2-4：引入比较逻辑

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    let guess: u32 = guess.trim().parse().expect("Please type a number!");

    println!("You guessed: {guess}");

    match guess.cmp(&secret_number) {
        Ordering::Less => println!("Too small!"),
        Ordering::Greater => println!("Too big!"),
        Ordering::Equal => println!("You win!"),
    }
}
```

### `Ordering` 枚举与 `match`

`std::cmp::Ordering` 是标准库中的枚举，有三个变体：`Less`、`Greater`、`Equal`。

`match` 表达式是 Rust 的模式匹配核心机制：

- 将一个值与一系列模式逐一比较
- 执行第一个匹配的分支
- **编译器强制穷举**：必须覆盖所有可能的情况，否则编译报错

> **为什么 `match` 比 `if-else` 强大？** `match` 不仅仅是值比较，它可以解构枚举、元组、结构体等复合类型，是 Rust 中处理枚举（尤其是 `Result` 和 `Option`）的惯用方式。编译器的穷举检查消除了遗漏分支的 bug。

### 类型不匹配与 Shadowing

直接比较 `String` 和整数会导致编译错误：

```
error[E0308]: mismatched types
   expected `&String`, found `&{integer}`
```

Rust 是强类型语言，不会隐式转换类型。需要显式解析：

```rust
let guess: u32 = guess.trim().parse().expect("Please type a number!");
```

这里发生了 **Shadowing（变量遮蔽）**：

- 第一个 `guess` 是 `String` 类型
- 第二个 `guess` 是 `u32` 类型，**遮蔽**了前一个同名变量
- `.trim()` 去除字符串首尾空白（包括 `read_line` 附带的换行符 `\n`）
- `.parse()` 将字符串解析为目标类型，类型由 `let guess: u32` 的注解推断

> **为什么允许 Shadowing？** 这在类型转换场景中特别有用。变量从"字符串形式的猜测"变为"数字形式的猜测"，语义上仍是同一个东西，用同一个名字更自然。避免了像 `guess_str` / `guess_num` 这样的命名冗余。注意 Shadowing 与 `mut` 不同——Shadowing 创建的是全新的变量，可以改变类型。

编译器根据 `u32` 类型注解，也能反向推断出 `secret_number` 的类型为 `u32`（默认整数类型是 `i32`）。

## 2.5 循环与退出

### 添加 `loop` 允许多次猜测

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    println!("The secret number is: {secret_number}");

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = guess.trim().parse().expect("Please type a number!");

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

- `loop` 创建无限循环，比 `while true` 更地道
- `break` 跳出循环，放在 `Ordering::Equal` 分支中实现猜对后退出

> **设计思考**：`loop` 是 Rust 的专用无限循环关键字。与 `while true` 相比，`loop` 让编译器知道这是有意的无限循环，可以做更好的控制流分析（例如 `loop` 可以有返回值：`let result = loop { break 42; };`）。

## 2.6 处理无效输入

当用户输入非数字时，`.expect()` 会导致 panic。更优雅的做法是用 `match` 处理 `Result`：

### Listing 2-5：优雅处理错误输入

```rust
let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,
};
```

- `Ok(num)` —— 解析成功，将结果绑定到 `num` 并作为 `match` 表达式的值返回
- `Err(_)` —— 解析失败，`_` 是通配符，表示不关心具体错误内容；`continue` 跳到下一次循环迭代

> **从 `expect` 到 `match` 的演进**：这是本章最重要的设计模式转变。`expect` 适合快速原型（fail-fast），而 `match` 是生产代码中处理 `Result` 的惯用方式。这种从粗糙到精细的错误处理演进，是 Rust 开发的典型工作流。

## 2.7 最终完整代码

### Listing 2-6：猜数游戏完整实现

```rust
use std::cmp::Ordering;
use std::io;

use rand::Rng;

fn main() {
    println!("Guess the number!");

    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();

        io::stdin()
            .read_line(&mut guess)
            .expect("Failed to read line");

        let guess: u32 = match guess.trim().parse() {
            Ok(num) => num,
            Err(_) => continue,
        };

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
```

运行效果：

```bash
$ cargo run
Guess the number!
Please input your guess.
10
You guessed: 10
Too small!
Please input your guess.
99
You guessed: 99
Too big!
Please input your guess.
foo
Please input your guess.
61
You guessed: 61
You win!
```

注意输入 `foo` 时程序没有崩溃，而是静默跳过并重新提示输入。

## 小结

本章通过一个 40 行的猜数游戏，覆盖了 Rust 的大量核心概念：

| 概念 | 本章体现 | 深入章节 |
|------|----------|----------|
| `let` / `mut` | 变量声明与可变性 | 第 3 章 |
| `String` / `u32` | 基础类型与类型系统 | 第 3 章 |
| `&` / `&mut` | 引用与借用 | 第 4 章 |
| `Result` / `Option` | 枚举与错误处理 | 第 6、9 章 |
| `match` | 模式匹配 | 第 6、18 章 |
| Shadowing | 变量遮蔽 | 第 3 章 |
| Trait (`Rng`) | 特征与方法调用 | 第 10 章 |
| Cargo / crates | 包管理与依赖 | 第 14 章 |

**核心设计哲学总结**：

1. **显式优于隐式**：需要 `mut` 才能修改变量，需要 `use` 才能调用 trait 方法，需要显式处理 `Result`
2. **编译期安全**：类型不匹配、未处理的 `Result`、`match` 未穷举 —— 都在编译期被捕获
3. **零成本抽象**：`match`、枚举、trait 等抽象机制在运行时没有额外开销
4. **渐进式错误处理**：从 `expect`（快速原型）到 `match`（生产代码），Rust 允许逐步提升代码的健壮性
