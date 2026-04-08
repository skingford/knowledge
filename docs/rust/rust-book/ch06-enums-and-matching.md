---
title: "第 6 章：枚举与模式匹配"
description: 定义枚举、Option 类型、match 控制流和 if let 简洁语法。
---

# 第 6 章：枚举与模式匹配

> 原文：[Chapter 6: Enums and Pattern Matching](https://doc.rust-lang.org/book/ch06-00-enums.html)

## 本章要点

- **枚举 (enum)** 通过列举所有可能的变体 (variant) 来定义类型，比 struct 更适合表达"多选一"的语义。
- 每个 variant 可以携带不同类型、不同数量的关联数据 (associated data)，这使得 enum 远比 C/Java 的枚举强大。
- 标准库的 **`Option<T>`** 用 `Some(T)` / `None` 两个 variant 取代了其他语言中的 `null`，从类型系统层面消除空指针错误。
- **`match`** 表达式对枚举做穷尽匹配 (exhaustive matching)，编译器强制你处理所有 variant，杜绝遗漏。
- **`if let`** 是 `match` 的语法糖，适用于只关心一个 variant 的简单场景。

---

## 6.1 定义枚举

### 6.1.1 基本语法

当一个值只能是若干可能中的一种时，enum 是最自然的建模手段。以 IP 地址为例：

```rust
enum IpAddrKind {
    V4,
    V6,
}

fn main() {
    let four = IpAddrKind::V4;
    let six = IpAddrKind::V6;

    route(IpAddrKind::V4);
    route(IpAddrKind::V6);
}

fn route(ip_kind: IpAddrKind) {}
```

**关键理解**：`IpAddrKind::V4` 和 `IpAddrKind::V6` 是同一类型 `IpAddrKind` 的两个值，都可以传给接受 `IpAddrKind` 的函数。variant 通过双冒号 `::` 在 enum 命名空间下访问。

> **设计动机**：struct 表达"A 且 B"（字段组合），enum 表达"A 或 B"（互斥选择）。两者正交配合，构成 Rust 的代数数据类型 (Algebraic Data Type, ADT) 体系。

### 6.1.2 variant 携带关联数据

enum 真正强大之处在于：每个 variant 可以直接携带数据，不需要额外的 struct。

```rust
enum IpAddr {
    V4(String),
    V6(String),
}

let home = IpAddr::V4(String::from("127.0.0.1"));
let loopback = IpAddr::V6(String::from("::1"));
```

此时，variant 名称自动成为**构造函数** (constructor function)：`IpAddr::V4(...)` 既是一个函数签名 `fn(String) -> IpAddr`，也是一个值。

更进一步，不同 variant 可以携带**不同类型和数量**的数据：

```rust
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));
```

> **对比 struct**：如果用 struct 来表达同样的语义，需要定义多个 struct + 一个 enum 来包装，代码量和复杂度都更高。enum 的关联数据机制让"类型 + 数据"一步到位。

### 6.1.3 复杂 enum 示例

一个 enum 的 variant 可以混用各种数据形式：

```rust
enum Message {
    Quit,                       // 无关联数据（类似 unit struct）
    Move { x: i32, y: i32 },   // 命名字段（类似普通 struct）
    Write(String),              // 单元组形式
    ChangeColor(i32, i32, i32), // 多值元组形式
}
```

这四个 variant 如果用 struct 分别定义，会分散成四个独立类型，无法用一个类型统一表示。而 enum 把它们聚合在 `Message` 类型下，便于统一处理（如传参、存入容器）。

### 6.1.4 为 enum 定义方法

与 struct 一样，enum 也可以通过 `impl` 块定义方法：

```rust
impl Message {
    fn call(&self) {
        // 方法体：通常内部用 match 分派到各 variant
    }
}

let m = Message::Write(String::from("hello"));
m.call();
```

> **实践建议**：enum 的方法内部几乎总是要 `match self` 来区分 variant，这是 Rust 处理多态的惯用模式（代替面向对象中的虚函数/接口）。

### 6.1.5 `Option<T>` -- 用类型系统消灭 null

这是本章最重要的设计理念。

#### null 的问题

Tony Hoare（null 的发明者）称 null 为"十亿美元的错误"（billion-dollar mistake）。null 的核心问题是：**当你把一个 null 值当作非 null 值使用时，就会引发运行时错误**。而在 C/Java/Python 等语言中，编译器/解释器无法帮你检查这个错误。

#### Rust 的解决方案

Rust **没有 null**。取而代之的是标准库中的 `Option<T>`：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`Option<T>` 已被纳入 prelude（预导入），因此可以直接使用 `Some` 和 `None`，无需 `Option::` 前缀。

```rust
let some_number = Some(5);        // 类型推断为 Option<i32>
let some_char = Some('e');        // 类型推断为 Option<char>
let absent_number: Option<i32> = None;  // None 必须显式标注类型
```

#### 为什么 `Option<T>` 优于 null

核心在于：**`Option<T>` 和 `T` 是不同的类型，编译器不允许混用。**

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);

let sum = x + y;  // 编译错误！
```

编译器报错：

```
error[E0277]: cannot add `Option<i8>` to `i8`
```

这意味着：

| 场景 | null 语言 | Rust |
|------|----------|------|
| 值一定存在 | `T`（但实际可能是 null） | `T`（编译器保证非空） |
| 值可能不存在 | `T`（可能是 null，无编译检查） | `Option<T>`（必须显式处理） |
| 使用前是否检查 | 程序员自觉（易遗漏） | 编译器强制（无法跳过） |

**关键洞见**：

1. 当你持有一个 `T` 类型的值时，它**一定**是有效的，可以放心使用。
2. 只有当你显式选择使用 `Option<T>` 时，才需要考虑"值可能不存在"的情况。
3. 编译器**强制**你在使用 `Option<T>` 之前处理 `None` 的情况，这从根本上杜绝了空指针/空引用错误。

> **设计哲学**：Rust 把"值可能不存在"这一信息编码到了**类型系统**中，而不是作为运行时的隐式行为。这就是所谓"making illegal states unrepresentable"（让非法状态不可表达）——Rust 类型系统设计的核心原则之一。

要从 `Option<T>` 中取出 `T`，最常用的方式就是下一节介绍的 `match` 表达式。

---

## 6.2 match 控制流

### 6.2.1 基本用法

`match` 将一个值与一系列模式 (pattern) 逐一比较，执行第一个匹配的分支 (arm)。

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

**结构解析**：

- `match` 关键字后跟一个表达式（可以是任意类型，不像 `if` 只能是 `bool`）。
- 每个**分支 (arm)** 由 `模式 => 表达式` 组成。
- 模式按顺序匹配，第一个匹配成功的分支执行其代码。
- 整个 `match` 表达式返回匹配分支的值（是表达式，不是语句）。

多行代码的分支使用花括号：

```rust
fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
```

### 6.2.2 模式绑定 (Patterns That Bind to Values)

match 的分支可以**绑定**匹配值的内部数据，从 variant 中提取信息：

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
    // --snip--
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {state:?}!");
            25
        }
    }
}

fn main() {
    value_in_cents(Coin::Quarter(UsState::Alaska));
}
```

当 `Coin::Quarter(UsState::Alaska)` 与模式 `Coin::Quarter(state)` 匹配时，变量 `state` 绑定到 `UsState::Alaska`，可以在分支代码中使用。

> **精读**：模式绑定是 Rust 模式匹配的核心能力。它不仅能匹配结构，还能同时解构 (destructure) 出内部的值。这比 C 的 switch-case 强大得多——switch 只能比较整数，而 match 可以解构任意嵌套的 enum/struct/tuple。

### 6.2.3 匹配 `Option<T>`

`match` 是处理 `Option<T>` 最地道的方式：

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

let five = Some(5);
let six = plus_one(five);    // Some(6)
let none = plus_one(None);   // None
```

执行流程：

- `plus_one(Some(5))`：匹配 `Some(i)`，`i` 绑定到 `5`，返回 `Some(6)`。
- `plus_one(None)`：匹配 `None`，直接返回 `None`。

### 6.2.4 穷尽匹配 (Exhaustive Matching)

**match 必须穷尽所有可能**，否则编译失败。

```rust
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        Some(i) => Some(i + 1),
        // 缺少 None 分支！
    }
}
```

编译器报错：

```
error[E0004]: non-exhaustive patterns: `None` not covered
```

> **设计动机**：穷尽匹配是 Rust 安全性的基石之一。当你给 enum 新增一个 variant 时，所有 match 该 enum 的地方都会编译报错，迫使你处理新增的情况。这在大型代码库中极其宝贵——编译器充当了"遗漏检测器"。这也是 `Option<T>` 比 null 更安全的根本原因：编译器不会让你"忘记"处理 `None`。

### 6.2.5 通配模式与 `_` 占位符

#### 使用变量捕获剩余值

```rust
let dice_roll = 9;
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    other => move_player(other),  // other 绑定到实际值
}
```

`other` 捕获所有未被前面分支匹配的值，且可以在分支代码中使用。

#### 使用 `_` 忽略值

当你不需要使用通配匹配到的值时，用 `_`：

```rust
let dice_roll = 9;
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => reroll(),  // 不需要知道具体是什么值
}
```

#### 什么都不做

```rust
match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => (),  // 单元值 (unit value)，表示"什么都不做"
}
```

> **注意**：通配分支必须放在最后。Rust 按顺序匹配，如果通配分支在前面，后续分支永远不会执行，编译器会发出警告。

---

## 6.3 if let 简洁控制流

### 6.3.1 问题场景

当你只关心一个 variant 时，`match` 的写法显得冗余：

```rust
let config_max = Some(3u8);
match config_max {
    Some(max) => println!("The maximum is configured to be {max}"),
    _ => (),  // 必须写但没有意义
}
```

### 6.3.2 if let 语法

`if let` 是上述 `match` 的语法糖：

```rust
let config_max = Some(3u8);
if let Some(max) = config_max {
    println!("The maximum is configured to be {max}");
}
```

**语法**：`if let <模式> = <表达式> { ... }`

- 等号左边是模式，右边是被匹配的表达式。
- 仅当值匹配模式时执行代码块。
- 匹配的值可以绑定到变量（如 `max`）。

### 6.3.3 if let ... else

`if let` 可以搭配 `else` 处理不匹配的情况：

```rust
let coin = Coin::Penny;
let mut count = 0;
if let Coin::Quarter(state) = coin {
    println!("State quarter from {state:?}!");
} else {
    count += 1;
}
```

等价于：

```rust
match coin {
    Coin::Quarter(state) => println!("State quarter from {state:?}!"),
    _ => count += 1,
}
```

### 6.3.4 取舍

| | `match` | `if let` |
|--|---------|----------|
| 穷尽检查 | 编译器强制覆盖所有 variant | 不检查，可能遗漏 |
| 代码量 | 较多（需要 `_ => ()` 等） | 较少，更简洁 |
| 适用场景 | 需要处理多个 variant | 只关心一个 variant |

> **实践建议**：当你只关心一个 variant 时用 `if let`；当你需要处理两个及以上 variant，或者需要编译器帮你检查穷尽性时，用 `match`。安全优先的场合，优先选择 `match`。

---

## 小结

本章核心是 Rust 的**代数数据类型 (ADT)** 与**模式匹配**体系：

1. **enum** 是 Rust 表达"多选一"的核心工具，variant 可以携带任意类型的关联数据，远比 C/Java 的枚举强大。

2. **`Option<T>`** 是 Rust 最重要的设计决策之一。通过在类型系统中显式编码"有值/无值"，Rust 从根本上消除了空指针错误。理解 `Option<T>` 是理解 Rust 哲学的关键——"如果你想表达'可能没有值'，你必须用 `Option<T>`，编译器会强制你处理 `None`"。

3. **`match`** 提供穷尽的模式匹配，支持解构和值绑定。编译器保证你不会遗漏任何 variant，这在 enum 新增 variant 时尤为重要。

4. **`if let`** 是 `match` 的简化版，适用于只关心单个模式的场景，牺牲穷尽检查换取简洁。

**与后续章节的关联**：

- 第 17 章将介绍 `match` 的更多高级模式语法（守卫条件、`@` 绑定、`|` 多模式等）。
- `Option<T>` 的方法（如 `unwrap()`、`map()`、`and_then()`、`unwrap_or_default()` 等）在标准库文档中有详细说明，是日常 Rust 编程的高频 API。
- `Result<T, E>` 是 `Option<T>` 的"兄弟" enum，用于错误处理（第 9 章），设计理念完全一致。
