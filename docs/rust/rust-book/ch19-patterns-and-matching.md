---
title: "第 19 章：模式与匹配"
description: 模式可以出现的所有位置、可反驳性与不可反驳性、模式语法全集。
---

# 第 19 章：模式与匹配

> 原文：[Chapter 19: Patterns and Matching](https://doc.rust-lang.org/book/ch19-00-patterns.html)

## 本章要点

模式（pattern）是 Rust 中用于匹配值的结构的特殊语法。一个模式由以下元素的组合构成：

- **字面量**（literals）：如 `1`、`'a'`、`true`
- **解构的数组、枚举、结构体或元组**（destructured arrays, enums, structs, or tuples）
- **变量**（variables）
- **通配符**（wildcards）：`_`
- **占位符**（placeholders）：`..`

模式的工作流程：将一个模式与某个值进行比较 -> 若匹配成功，则将值的各部分绑定到变量并执行关联代码 -> 若不匹配，则跳过该分支。

本章三大主题：
1. **模式可以出现的所有位置** -- `match`、`let`、`if let`、`while let`、`for`、函数参数
2. **可反驳性（refutability）** -- 模式是否可能匹配失败，以及这如何决定哪些语法构造接受哪种模式
3. **模式语法全集** -- 字面量、变量、多模式、范围、解构、忽略值、匹配守卫、`@` 绑定

---

## 19.1 所有可以使用模式的位置

Rust 中模式并非只出现在 `match` 里，它广泛存在于语言的各个角落。理解这些位置有助于写出更地道的 Rust 代码。

### 19.1.1 `match` 分支

`match` 是最常见的模式使用场景。语法形式：

```rust
match VALUE {
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
    PATTERN => EXPRESSION,
}
```

**关键约束：穷尽性（exhaustiveness）** -- 编译器要求 `match` 的所有分支必须覆盖被匹配值的全部可能情况。常用通配符 `_` 作为最后一个分支兜底：

```rust
match x {
    None => None,
    Some(i) => Some(i + 1),
}
```

> 深度解读：穷尽性检查是 Rust 类型安全的基石之一。它在编译期就消灭了"忘记处理某种情况"这类 bug，这在处理 `Option`、`Result` 及自定义枚举时尤其有价值。

### 19.1.2 `if let` 条件表达式

`if let` 是只关心一个分支时 `match` 的语法糖，减少样板代码：

```rust
fn main() {
    let favorite_color: Option<&str> = None;
    let is_tuesday = false;
    let age: Result<u8, _> = "34".parse();

    if let Some(color) = favorite_color {
        println!("Using your favorite color, {color}, as the background");
    } else if is_tuesday {
        println!("Tuesday is green day!");
    } else if let Ok(age) = age {
        if age > 30 {
            println!("Using purple as the background color");
        } else {
            println!("Using orange as the background color");
        }
    } else {
        println!("Using blue as the background color");
    }
}
// 输出：Using purple as the background color
```

**注意事项**：
- `if let` **不要求穷尽性**，编译器不会检查你是否遗漏了某些情况。
- `if let Ok(age) = age` 中引入了一个新的 `age` 变量（shadowing），这个新变量仅在 `if let` 块内可见。

### 19.1.3 `while let` 条件循环

只要模式持续匹配就一直循环：

```rust
fn main() {
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        for val in [1, 2, 3] {
            tx.send(val).unwrap();
        }
    });

    while let Ok(value) = rx.recv() {
        println!("{value}");
    }
}
// 输出：1 2 3（各占一行）
```

当 `rx.recv()` 返回 `Err`（发送端断开连接）时，模式不匹配，循环退出。

### 19.1.4 `for` 循环

`for` 关键字后面紧跟的就是一个模式：

```rust
fn main() {
    let v = vec!['a', 'b', 'c'];

    for (index, value) in v.iter().enumerate() {
        println!("{value} is at index {index}");
    }
}
```

`enumerate()` 产生 `(usize, &T)` 元组，`(index, value)` 正是解构该元组的模式。

### 19.1.5 `let` 语句

每一条 `let` 语句都在使用模式，只是太自然以至于我们常常忽略：

```rust
let PATTERN = EXPRESSION;
```

```rust
let x = 5;           // x 是一个模式，匹配任何值
let (x, y, z) = (1, 2, 3);  // 解构元组
```

如果元素数量不匹配，编译器会报错：

```rust
let (x, y) = (1, 2, 3);  // 错误！模式期望 2 个元素，实际是 3 个
```

可以用 `_` 或 `..` 忽略不需要的值：

```rust
let (x, y, _) = (1, 2, 3);  // OK
```

### 19.1.6 函数参数

函数参数本身就是模式，可以直接解构：

```rust
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("Current location: ({x}, {y})");
}

fn main() {
    let point = (3, 5);
    print_coordinates(&point);
}
// 输出：Current location: (3, 5)
```

闭包（closure）的参数列表同样支持模式解构。

### 各位置对比汇总

| 使用位置 | 是否要求穷尽性 | 备注 |
|---------|:-----------:|------|
| `match` 分支 | 是 | 编译期检查，最后一个分支可用 `_` 兜底 |
| `if let` | 否 | 只关心一个分支，适合简单场景 |
| `while let` | 否 | 模式不匹配时循环退出 |
| `for` 循环 | -- | 迭代中自动解构 |
| `let` 语句 | -- | 要求不可反驳模式（irrefutable） |
| 函数/闭包参数 | -- | 要求不可反驳模式（irrefutable） |

---

## 19.2 可反驳性：模式是否会匹配失败

这是理解 Rust 模式系统的核心概念。

### 两种模式

| 类型 | 英文 | 含义 | 示例 |
|------|------|------|------|
| **不可反驳模式** | irrefutable pattern | 对任何可能的值都能匹配成功 | `x`、`(a, b, c)` |
| **可反驳模式** | refutable pattern | 对某些值可能匹配失败 | `Some(x)`、`Ok(v)`、`3` |

### 位置与模式类型的对应关系

| 语法构造 | 接受的模式类型 | 原因 |
|---------|:-----------:|------|
| `let` 语句 | 仅不可反驳 | 匹配失败时无法继续执行，语义不完整 |
| 函数参数 | 仅不可反驳 | 同上 |
| `for` 循环 | 仅不可反驳 | 迭代中每个元素都必须被处理 |
| `if let` / `while let` | 两种皆可 | 设计目的就是处理"可能失败"的匹配 |
| `match` 分支 | 可反驳（最后一个分支须不可反驳） | 需覆盖所有可能 |

### 错误示例：在 `let` 中使用可反驳模式

```rust
let some_option_value: Option<i32> = None;
let Some(x) = some_option_value;  // 编译错误！
```

编译器报错：

```
error[E0005]: refutable pattern in local binding
 --> src/main.rs:3:9
  |
3 |     let Some(x) = some_option_value;
  |         ^^^^^^^ pattern `None` not covered
```

`None` 的情况没有被覆盖。修正方法有两种：

**方法一：使用 `if let`**

```rust
if let Some(x) = some_option_value {
    println!("{x}");
}
```

**方法二：使用 `let...else`（Rust 1.65+）**

```rust
let Some(x) = some_option_value else {
    return;  // 必须发散（diverge）：return、break、continue 或 panic!
};
// 此处可以使用 x
```

`let...else` 是处理"提前返回"模式的利器，比 `if let` 减少了嵌套层级。

### 警告示例：在 `if let` 中使用不可反驳模式

```rust
if let x = 5 {
    println!("{x}");
}
```

编译器会发出警告：这个模式永远匹配，`if let` 没有意义，直接用 `let` 即可。

> 深度解读：可反驳性概念是 Rust 编译器进行安全检查的理论基础。它确保了"可能失败的匹配"必须出现在能够处理失败的上下文中，而"必须成功的绑定"不会悄悄引入运行时错误。

---

## 19.3 模式语法

这一节是模式系统的"词典"，涵盖所有可用的模式语法。

### 19.3.1 匹配字面量（Matching Literals）

直接与具体值比较：

```rust
let x = 1;
match x {
    1 => println!("one"),
    2 => println!("two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

### 19.3.2 匹配命名变量（Matching Named Variables）

命名变量是不可反驳模式，匹配任何值。**在 `match` 内部会创建新的作用域，可能产生变量遮蔽（shadowing）**：

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(y) => println!("Matched, y = {y}"),  // 这里的 y 是新变量，值为 5
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");  // y 仍然是 10
}
// 输出：
// Matched, y = 5
// at the end: x = Some(5), y = 10
```

> 深度解读：`match` 分支中的 `Some(y)` 不是在"检查 y 是否等于外部的 10"，而是创建了一个新的变量 `y` 并绑定 `Some` 内部的值。若要与外部变量比较，需使用匹配守卫（match guard），见 19.3.7。

### 19.3.3 多模式（Multiple Patterns）

使用 `|` 语法匹配多个模式（相当于"或"）：

```rust
let x = 1;
match x {
    1 | 2 => println!("one or two"),
    3 => println!("three"),
    _ => println!("anything"),
}
```

### 19.3.4 范围匹配（Matching Ranges with `..=`）

`..=` 匹配一个闭区间（inclusive range），适用于数字和 `char` 类型：

```rust
let x = 5;
match x {
    1..=5 => println!("one through five"),
    _ => println!("something else"),
}
```

```rust
let x = 'c';
match x {
    'a'..='j' => println!("early ASCII letter"),
    'k'..='z' => println!("late ASCII letter"),
    _ => println!("something else"),
}
```

> 编译器会在编译期检查范围是否为空（如 `5..=1` 会报错）。范围模式只适用于数字类型（整数、浮点数）和 `char`。

### 19.3.5 解构（Destructuring）

#### 解构结构体（Structs）

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let p = Point { x: 0, y: 7 };

    // 完整写法：字段名 : 绑定变量名
    let Point { x: a, y: b } = p;
    assert_eq!(0, a);
    assert_eq!(7, b);

    // 简写：变量名与字段名相同时可省略
    let Point { x, y } = p;
    assert_eq!(0, x);
    assert_eq!(7, y);
}
```

在 `match` 中混合使用字面量和变量绑定：

```rust
match p {
    Point { x, y: 0 } => println!("On the x axis at {x}"),
    Point { x: 0, y } => println!("On the y axis at {y}"),
    Point { x, y } => println!("On neither axis: ({x}, {y})"),
}
```

#### 解构枚举（Enums）

模式的形状必须与枚举变体的数据结构一致：

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn main() {
    let msg = Message::ChangeColor(0, 160, 255);

    match msg {
        Message::Quit => {
            println!("The Quit variant has no data to destructure.");
        }
        Message::Move { x, y } => {
            println!("Move in the x direction {x} and in the y direction {y}");
        }
        Message::Write(text) => {
            println!("Text message: {text}");
        }
        Message::ChangeColor(r, g, b) => {
            println!("Change color to red {r}, green {g}, and blue {b}");
        }
    }
}
```

#### 解构嵌套结构（Nested Structs and Enums）

模式可以任意深度嵌套：

```rust
enum Color {
    Rgb(i32, i32, i32),
    Hsv(i32, i32, i32),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}

fn main() {
    let msg = Message::ChangeColor(Color::Hsv(0, 160, 255));

    match msg {
        Message::ChangeColor(Color::Rgb(r, g, b)) => {
            println!("Change color to red {r}, green {g}, and blue {b}");
        }
        Message::ChangeColor(Color::Hsv(h, s, v)) => {
            println!("Change color to hue {h}, saturation {s}, value {v}");
        }
        _ => (),
    }
}
```

#### 解构结构体与元组的混合

```rust
struct Point {
    x: i32,
    y: i32,
}

let ((feet, inches), Point { x, y }) = ((3, 10), Point { x: 3, y: -10 });
```

> 深度解读：Rust 的模式解构支持任意组合嵌套，这是其表达力的重要来源。在实际项目中，解构常用于从复杂的返回值或配置结构中提取所需字段，显著减少中间变量。

### 19.3.6 忽略模式中的值

#### 用 `_` 忽略整个值

```rust
fn foo(_: i32, y: i32) {
    println!("This code only uses the y parameter: {y}");
}
fn main() {
    foo(3, 4);  // 第一个参数被完全忽略
}
```

这在实现 trait 时特别有用 -- trait 定义了参数签名，但你的实现不需要某个参数时，用 `_` 替代即可避免"未使用变量"警告。

#### 用嵌套的 `_` 忽略部分值

```rust
let mut setting_value = Some(5);
let new_setting_value = Some(10);

match (setting_value, new_setting_value) {
    (Some(_), Some(_)) => {
        println!("Can't overwrite an existing customized value");
    }
    _ => {
        setting_value = new_setting_value;
    }
}

// 忽略元组中的某些位置
let numbers = (2, 4, 8, 16, 32);
match numbers {
    (first, _, third, _, fifth) => {
        println!("Some numbers: {first}, {third}, {fifth}");
    }
}
```

#### `_x` 与 `_` 的关键区别

`_x` **会**绑定值（影响所有权），`_` **不会**绑定值：

```rust
// 错误！s 的所有权转移给了 _s
let s = Some(String::from("Hello!"));
if let Some(_s) = s {
    println!("found a string");
}
println!("{s:?}");  // 编译错误：s 已被移动

// 正确！_ 不绑定值，s 的所有权未转移
let s = Some(String::from("Hello!"));
if let Some(_) = s {
    println!("found a string");
}
println!("{s:?}");  // OK
```

> 深度解读：这个区别在处理非 `Copy` 类型（如 `String`、`Vec`）时至关重要。`_` 是真正的"丢弃"，而 `_x` 只是"我不打算用，但编译器别警告我"。

#### 用 `..` 忽略剩余部分

```rust
struct Point { x: i32, y: i32, z: i32 }

let origin = Point { x: 0, y: 0, z: 0 };
match origin {
    Point { x, .. } => println!("x is {x}"),
}
```

```rust
let numbers = (2, 4, 8, 16, 32);
match numbers {
    (first, .., last) => {
        println!("Some numbers: {first}, {last}");
    }
}
```

**`..` 必须无歧义**，每个模式中最多使用一次：

```rust
let numbers = (2, 4, 8, 16, 32);
match numbers {
    (.., second, ..) => {  // 编译错误！无法确定 second 的位置
        println!("Some numbers: {second}");
    }
}
```

### 19.3.7 匹配守卫（Match Guards）

匹配守卫是 `match` 分支模式后面附加的 `if` 条件，提供超出模式本身的额外过滤能力：

```rust
let num = Some(4);
match num {
    Some(x) if x % 2 == 0 => println!("The number {x} is even"),
    Some(x) => println!("The number {x} is odd"),
    None => (),
}
```

**解决变量遮蔽问题**：当需要在 `match` 内与外部变量比较时，匹配守卫是正确的做法：

```rust
fn main() {
    let x = Some(5);
    let y = 10;

    match x {
        Some(50) => println!("Got 50"),
        Some(n) if n == y => println!("Matched, n = {n}"),  // 这里的 y 是外部变量
        _ => println!("Default case, x = {x:?}"),
    }

    println!("at the end: x = {x:?}, y = {y}");
}
// 输出：
// Default case, x = Some(5)
// at the end: x = Some(5), y = 10
```

**匹配守卫与 `|` 的优先级**：守卫应用于 `|` 连接的所有模式，即 `(4 | 5 | 6) if y` 而非 `4 | 5 | (6 if y)`：

```rust
let x = 4;
let y = false;

match x {
    4 | 5 | 6 if y => println!("yes"),  // 等价于 (4 | 5 | 6) if y
    _ => println!("no"),
}
// 输出：no（因为 y 为 false）
```

> 深度解读：匹配守卫不参与穷尽性检查。编译器无法判断守卫条件是否覆盖了所有可能，因此通常需要一个兜底分支 `_`。

### 19.3.8 `@` 绑定（At Bindings）

`@` 运算符允许在测试一个值是否匹配模式的同时将其绑定到变量：

```rust
enum Message {
    Hello { id: i32 },
}

let msg = Message::Hello { id: 5 };

match msg {
    Message::Hello { id: id @ 3..=7 } => {
        println!("Found an id in range: {id}");  // id = 5
    }
    Message::Hello { id: 10..=12 } => {
        println!("Found an id in another range");  // 这里无法访问 id 的值
    }
    Message::Hello { id } => {
        println!("Found some other id: {id}");
    }
}
```

对比三个分支：
- **第一个分支**：`id @ 3..=7` -- 既检查 `id` 是否在 3..=7 范围内，又将值绑定到变量 `id`，可以在分支体中使用。
- **第二个分支**：`10..=12` -- 只检查范围，但没有绑定变量，无法在分支体中引用具体的 `id` 值。
- **第三个分支**：`id` -- 只绑定变量，不做范围检查，匹配所有剩余情况。

> 深度解读：`@` 绑定解决了"既要检验又要使用"的问题。没有 `@` 时，范围模式 `3..=7` 能做检查但拿不到值，命名变量 `id` 能拿到值但做不了范围检查。`@` 将两者合一。

---

## 小结

本章全面梳理了 Rust 的模式系统：

1. **模式无处不在** -- 从 `match`、`if let`、`while let` 到 `for`、`let` 语句和函数参数，模式贯穿 Rust 的表达式和语句体系。

2. **可反驳性是编译期安全的核心机制** -- 不可反驳模式（irrefutable）用于必须成功的绑定场景（`let`、函数参数），可反驳模式（refutable）用于可能失败的条件场景（`if let`、`while let`）。`let...else` 是桥接两者的实用工具。

3. **模式语法丰富而精确** -- 字面量匹配、多模式 `|`、范围 `..=`、解构（结构体/枚举/嵌套/混合）、忽略值（`_`、`..`）、匹配守卫（match guard）、`@` 绑定，每种语法各有适用场景。

掌握模式系统是写出地道 Rust 代码的关键。模式让你以声明式的方式表达"数据的形状"，配合编译器的穷尽性检查，在编译期就消灭了大量潜在 bug。
