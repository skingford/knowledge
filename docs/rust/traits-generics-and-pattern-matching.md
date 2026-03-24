---
title: Trait、泛型与模式匹配
description: 理解 Rust 类型系统里的核心抽象，包括 struct、enum、match、trait、泛型、impl Trait 与 dyn Trait。
---

# Trait、泛型与模式匹配

Rust 的表达力，很大一部分来自类型系统。

如果说所有权解决的是“资源怎么安全地活着”，那这一篇解决的就是“状态怎么表达、行为怎么抽象、通用逻辑怎么复用”。

## 先建立一个判断框架

你可以把 Rust 常见抽象按下面方式理解：

- `struct`：表达“数据长什么样”
- `enum`：表达“数据可能是哪几种状态”
- `match`：表达“不同状态怎么处理”
- `trait`：表达“这个类型具备什么行为”
- 泛型：表达“这段逻辑适用于一类类型”

## `struct` 和 `enum` 的分工

### `struct` 适合稳定字段集合

```rust
struct User {
    id: u64,
    name: String,
    active: bool,
}
```

### `enum` 适合互斥状态

```rust
enum JobState {
    Pending,
    Running { worker_id: u64 },
    Failed(String),
    Finished,
}
```

很多别的语言会把这些状态塞成：

- 多个布尔字段
- 一个整数状态码
- 一个字符串字段加注释

Rust 更鼓励你把状态直接建模成 enum。

## `match` 不是语法糖，而是强制穷尽检查

```rust
fn describe(state: JobState) -> String {
    match state {
        JobState::Pending => "pending".to_string(),
        JobState::Running { worker_id } => format!("running on {worker_id}"),
        JobState::Failed(reason) => format!("failed: {reason}"),
        JobState::Finished => "finished".to_string(),
    }
}
```

Rust 要求你处理所有分支，这能显著减少遗漏状态的 bug。

## `Option` 和 `Result` 是最常见的 enum

### `Option<T>` 表示“有或没有”

```rust
fn find_name(id: u64) -> Option<String> {
    if id == 1 {
        Some("rust".to_string())
    } else {
        None
    }
}
```

### `Result<T, E>` 表示“成功或失败”

```rust
fn parse_port(input: &str) -> Result<u16, std::num::ParseIntError> {
    input.parse::<u16>()
}
```

Rust 倾向于把失败作为类型系统的一部分，而不是依赖空值和异常到处漂。

## trait 到底是什么

trait 可以先理解成“行为契约”。

```rust
trait Summary {
    fn summary(&self) -> String;
}

struct Article {
    title: String,
}

impl Summary for Article {
    fn summary(&self) -> String {
        self.title.clone()
    }
}
```

但它不只是接口，还承担了更多角色。

## trait 的几个常见用途

### 1. 作为行为抽象

不同类型实现同一个 trait，就能共享调用方式。

### 2. 作为泛型约束

```rust
fn print_summary<T: Summary>(item: &T) {
    println!("{}", item.summary());
}
```

这表示：`T` 可以是任意类型，但必须实现 `Summary`。

### 3. 提供默认实现

```rust
trait Named {
    fn name(&self) -> &str;

    fn greet(&self) -> String {
        format!("hello, {}", self.name())
    }
}
```

### 4. 表达标准能力

很多常用能力其实来自标准 trait：

- `Debug`
- `Clone`
- `Copy`
- `Default`
- `PartialEq` / `Eq`
- `PartialOrd` / `Ord`
- `Hash`
- `Iterator`
- `Display`

## 先学会使用 `derive`

业务结构体经常先从这些派生开始：

```rust
#[derive(Debug, Clone, PartialEq, Eq)]
struct Task {
    id: u64,
    name: String,
}
```

`derive` 的意义不只是省代码，它也在帮助你明确“这个类型支持哪些默认能力”。

## 泛型的核心目标是复用，而不是炫技

```rust
fn first<T>(items: &[T]) -> Option<&T> {
    items.first()
}
```

这里的重点不是语法，而是：

- 这段逻辑不关心具体元素类型
- 只要求输入是切片
- 返回值继续遵循借用关系

## trait bound 是 Rust 泛型真正常见的形态

```rust
fn max_of_two<T: Ord>(left: T, right: T) -> T {
    if left >= right { left } else { right }
}
```

泛型本身只表示“类型可变”，trait bound 才表示“这个类型必须具备什么能力”。

常见写法：

```rust
fn render<T: std::fmt::Display>(value: T) -> String {
    format!("{value}")
}
```

也可以写成：

```rust
fn render(value: impl std::fmt::Display) -> String {
    format!("{value}")
}
```

## `impl Trait` 和 `dyn Trait` 的区别

这是 Rust 初学阶段经常混的点。

| 写法 | 典型含义 | 分发方式 | 适合场景 |
| --- | --- | --- | --- |
| `impl Trait` | 某个具体类型实现了某 trait，但调用方不关心具体类型名 | 静态分发 | 返回单一具体类型、简化签名 |
| `dyn Trait` | 运行时通过 trait object 调用 | 动态分发 | 需要异构集合或运行时多态 |

### `impl Trait` 例子

```rust
fn make_label() -> impl std::fmt::Display {
    "rust"
}
```

### `dyn Trait` 例子

```rust
fn print_all(items: &[Box<dyn Summary>]) {
    for item in items {
        println!("{}", item.summary());
    }
}
```

经验上可以先记住：

- 默认优先静态分发
- 只有确实需要运行时多态时，再上 `dyn Trait`

## 迭代器是 Rust 风格代码的重要组成

Rust 的集合操作，经常围绕 iterator 展开。

```rust
fn even_squares(input: &[i32]) -> Vec<i32> {
    input
        .iter()
        .filter(|value| **value % 2 == 0)
        .map(|value| value * value)
        .collect()
}
```

这里值得注意的不是链式调用本身，而是：

- `iter()` 产生借用迭代
- `into_iter()` 往往拿走所有权
- `iter_mut()` 产生可变借用迭代

很多“为什么这里又 move 了”的问题，最后都和你选了哪种迭代方式有关。

## 模式匹配不只出现在 `match`

Rust 很多语法位置都支持模式：

- `if let`
- `while let`
- `let Some(x) = value else { ... };`
- 函数参数解构

例如：

```rust
fn print_error(result: Result<u32, String>) {
    if let Err(err) = result {
        println!("error: {err}");
    }
}
```

这使得 Rust 在处理状态分支时非常统一。

## 一个更接近工程的例子

```rust
trait Validate {
    fn validate(&self) -> Result<(), String>;
}

#[derive(Debug)]
struct RegisterUser {
    name: String,
    age: u8,
}

impl Validate for RegisterUser {
    fn validate(&self) -> Result<(), String> {
        if self.name.trim().is_empty() {
            return Err("name is empty".to_string());
        }

        if self.age < 18 {
            return Err("age must be >= 18".to_string());
        }

        Ok(())
    }
}
```

这段代码同时体现了几件事：

- 用 `struct` 表达输入
- 用 trait 表达行为能力
- 用 `Result` 表达校验结果
- 用 `String` 持有错误消息的所有权

## 工程建议

### 优先用 enum 表达明确状态

能用 enum 明确建模的状态，不要轻易退回：

- 布尔值组合
- `Option<String>` + 注释
- 字符串状态码

### trait 名称尽量表达能力，而不是抽象层级

一般来说：

- `Validate`
- `Encode`
- `Store`
- `Load`

会比：

- `BaseService`
- `ManagerInterface`

这种名字更贴近 Rust 风格。

### 泛型要为复用服务，不要为了“写得通用”

如果泛型让函数签名和报错都变得更难读，而实际只有一个调用点，就先别抽。

## 自检

你至少应该能清楚回答：

1. 什么场景更适合 `enum` 而不是多个字段拼状态？
2. `Option` 和 `Result` 为什么是 Rust 编码风格的中心？
3. trait 除了“像接口”，还承担了哪些职责？
4. `T: Display`、`impl Display`、`dyn Display` 的区别是什么？
5. `iter()`、`iter_mut()`、`into_iter()` 会怎样影响所有权？

这些问题通了，Rust 类型系统的主骨架就差不多立住了。
