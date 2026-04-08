---
title: "第 10 章：泛型、Trait 与生命周期"
description: 用泛型消除重复代码、用 trait 定义共享行为、用生命周期确保引用有效性。
---

# 第 10 章：泛型、Trait 与生命周期

> 原文：[Chapter 10: Generic Types, Traits, and Lifetimes](https://doc.rust-lang.org/book/ch10-00-generics.html)

本章是 Rust 类型系统的核心。泛型（Generics）、Trait 和生命周期（Lifetime）三者协同工作，共同构成了 Rust "零成本抽象" 的基石：泛型让代码不再重复，Trait 让泛型拥有约束与行为，生命周期让引用在编译期被证明安全。

## 本章要点

- **泛型**：用类型参数代替具体类型，消除重复代码；编译器通过 **单态化（monomorphization）** 将泛型展开为具体类型，运行时零开销。
- **Trait**：定义类型必须实现的行为契约，类似其他语言的 interface；通过 trait bound 约束泛型参数，在编译期保证类型安全。
- **生命周期**：一种特殊的泛型参数，描述引用之间的存活关系；编译器的 **借用检查器（borrow checker）** 据此阻止悬垂引用（dangling reference）。
- 三者可以在同一个函数签名中同时出现：`fn foo<'a, T: Display>(x: &'a str, ann: T) -> &'a str`。

---

## 10.0 从消除重复开始

泛型的思想源自一个朴素的编程原则：**不要重复自己（DRY）**。

### 重复代码的问题

当需要在两个列表中分别找最大值时，代码会出现大段雷同：

```rust
fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let mut largest = &number_list[0];
    for number in &number_list {
        if number > largest {
            largest = number;
        }
    }
    println!("The largest number is {largest}");

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];
    let mut largest = &number_list[0];
    for number in &number_list {
        if number > largest {
            largest = number;
        }
    }
    println!("The largest number is {largest}");
}
```

### 提取函数消除重复

把逻辑抽取为函数，用参数代替具体值：

```rust
fn largest(list: &[i32]) -> &i32 {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("The largest number is {result}");

    let number_list = vec![102, 34, 6000, 89, 54, 2, 43, 8];
    let result = largest(&number_list);
    println!("The largest number is {result}");
}
```

消除重复的步骤：识别重复 -> 提取到函数 -> 用参数替代具体值。**泛型就是这一步骤在类型层面的延伸**——如果 `largest_i32` 和 `largest_char` 逻辑一模一样，只是类型不同，那就用类型参数替代具体类型。

---

## 10.1 泛型数据类型

### 在函数定义中使用泛型

将类型参数 `T` 放在函数名和参数列表之间的尖括号里：

```rust
fn largest<T: std::cmp::PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let number_list = vec![34, 50, 25, 100, 65];
    let result = largest(&number_list);
    println!("The largest number is {result}");

    let char_list = vec!['y', 'm', 'a', 'q'];
    let result = largest(&char_list);
    println!("The largest char is {result}");
}
```

> **关键点**：裸 `T` 无法使用 `>` 运算符，必须加 trait bound `T: PartialOrd` 告诉编译器 "T 支持比较"。这就是 trait bound 的第一个实战场景——泛型天然需要 trait 来约束。

### 在结构体中使用泛型

**单一类型参数**——`x` 与 `y` 必须是相同类型：

```rust
struct Point<T> {
    x: T,
    y: T,
}

fn main() {
    let integer = Point { x: 5, y: 10 };       // Point<i32>
    let float = Point { x: 1.0, y: 4.0 };      // Point<f64>
    // let wont_work = Point { x: 5, y: 4.0 };  // 编译错误：类型不一致
}
```

**多类型参数**——`x` 与 `y` 可以是不同类型：

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

fn main() {
    let both_integer = Point { x: 5, y: 10 };
    let both_float = Point { x: 1.0, y: 4.0 };
    let integer_and_float = Point { x: 5, y: 4.0 }; // OK
}
```

> 实践建议：类型参数不宜过多（超过 2-3 个通常意味着需要重构拆分）。

### 在枚举中使用泛型

标准库中最经典的两个泛型枚举：

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

`Option<T>` 抽象了"可能为空"，`Result<T, E>` 抽象了"可能失败"。当你在自己的代码中发现类似模式——多个枚举只是变体持有的类型不同——就该用泛型枚举。

### 在方法定义中使用泛型

在 `impl` 后声明 `T`，表示为**所有** `Point<T>` 实现方法：

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}
```

也可以只为**特定具体类型**实现方法——这里 `distance_from_origin` 只有 `Point<f32>` 才拥有：

```rust
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

> **深度理解**：`impl<T>` vs `impl Point<f32>` 的区别在于：前者是泛型 impl（对所有 T），后者是特化 impl（仅对 f32）。Rust 会在编译期为每种具体类型选择最匹配的 impl 块。

**方法自身也可以引入额外的泛型参数**：

```rust
struct Point<X1, Y1> {
    x: X1,
    y: Y1,
}

impl<X1, Y1> Point<X1, Y1> {
    fn mixup<X2, Y2>(self, other: Point<X2, Y2>) -> Point<X1, Y2> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point { x: 5, y: 10.4 };
    let p2 = Point { x: "Hello", y: 'c' };
    let p3 = p1.mixup(p2);
    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
    // 输出: p3.x = 5, p3.y = c
}
```

`X1, Y1` 跟随 `impl` 声明（属于结构体），`X2, Y2` 跟随 `fn mixup` 声明（属于方法）。

### 泛型的性能：单态化（Monomorphization）

Rust 在编译时把泛型代码展开成具体类型的代码，这个过程叫 **单态化**。例如：

```rust
let integer = Some(5);
let float = Some(5.0);
```

编译器会生成：

```rust
enum Option_i32 {
    Some(i32),
    None,
}

enum Option_f64 {
    Some(f64),
    None,
}

fn main() {
    let integer = Option_i32::Some(5);
    let float = Option_f64::Some(5.0);
}
```

> **核心结论**：泛型在 Rust 中是**零运行时开销**的。你用泛型写出的代码与手动为每种类型分别写出的代码在性能上完全一致。代价是编译时间略增、二进制体积可能变大（每种类型一份代码副本）。

---

## 10.2 Trait：定义共享行为

Trait 告诉编译器一个类型具有什么行为（方法），可以与其他类型共享。

### 定义 Trait

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}
```

- `trait` 关键字 + 名称
- 方法签名以 `;` 结尾（只声明，不实现）
- 一个 trait 可以有多个方法

### 为类型实现 Trait

```rust
pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location)
    }
}

pub struct SocialPost {
    pub username: String,
    pub content: String,
    pub reply: bool,
    pub repost: bool,
}

impl Summary for SocialPost {
    fn summarize(&self) -> String {
        format!("{}: {}", self.username, self.content)
    }
}
```

### 孤儿规则（Orphan Rule）

实现 trait 的限制——**trait 或 类型至少有一个在当前 crate 内**：

| 场景 | 是否允许 |
|------|----------|
| 为你的类型实现标准库的 `Display` | 允许（类型是本地的） |
| 为任意类型实现你的 `Summary` | 允许（trait 是本地的） |
| 为 `Vec<T>` 实现 `Display` | 不允许（两者都是外部的） |

这条规则也叫 **一致性（coherence）**，防止两个 crate 对同一类型的同一 trait 给出冲突的实现。

### 默认实现

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}
```

- 默认实现可以调用同一 trait 中的其他方法（即使那些方法没有默认实现）。
- 实现者可以选择覆盖默认实现，也可以只实现必需方法而使用默认实现。
- **注意**：在覆盖实现中无法调用同名方法的默认版本。

```rust
impl Summary for SocialPost {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize() 使用默认实现，输出 "(Read more from @horse_ebooks...)"
}
```

### Trait 作为参数：`impl Trait` 语法

```rust
pub fn notify(item: &impl Summary) {
    println!("Breaking news! {}", item.summarize());
}
```

接受任何实现了 `Summary` 的类型。这是 trait bound 的语法糖。

### Trait Bound 语法（完整形式）

```rust
pub fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}
```

两种写法对比：

```rust
// impl Trait 语法 —— 两个参数可以是不同类型
pub fn notify(item1: &impl Summary, item2: &impl Summary) { ... }

// Trait bound 语法 —— 强制两个参数为相同类型
pub fn notify<T: Summary>(item1: &T, item2: &T) { ... }
```

> **选型建议**：简单场景用 `impl Trait` 更简洁；当需要强制多个参数同类型、或约束关系复杂时，用显式 trait bound。

### 多重 Trait Bound：`+` 语法

```rust
pub fn notify(item: &(impl Summary + Display)) { ... }

// 等价的 trait bound 形式
pub fn notify<T: Summary + Display>(item: &T) { ... }
```

### `where` 子句：让复杂约束更可读

```rust
// 约束堆在参数前，不好读
fn some_function<T: Display + Clone, U: Clone + Debug>(t: &T, u: &U) -> i32 { ... }

// 用 where 分离约束，清晰很多
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    unimplemented!()
}
```

### 返回实现了 Trait 的类型

```rust
fn returns_summarizable() -> impl Summary {
    SocialPost {
        username: String::from("horse_ebooks"),
        content: String::from("of course, as you probably already know, people"),
        reply: false,
        repost: false,
    }
}
```

> **限制**：`impl Trait` 作为返回类型时，函数体只能返回**单一具体类型**。不能在 `if/else` 的不同分支返回不同类型——那种情况需要 trait object（`Box<dyn Trait>`，第 18 章介绍）。

### 利用 Trait Bound 有条件地实现方法

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self { x, y }
    }
}

impl<T: Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        } else {
            println!("The largest member is y = {}", self.y);
        }
    }
}
```

`Pair<T>` 所有实例都有 `new`，但只有 `T` 同时实现了 `Display + PartialOrd` 的实例才有 `cmp_display`。

### Blanket Implementation（覆盖实现）

为所有满足某约束的类型统一实现一个 trait：

```rust
impl<T: Display> ToString for T {
    // ...
}
```

标准库中的这条 blanket impl 意味着：任何实现了 `Display` 的类型自动获得 `to_string()` 方法。这就是为什么 `3.to_string()` 能直接使用——因为 `i32` 实现了 `Display`。

> **深度理解**：Blanket implementation 是 Rust trait 系统最强大的机制之一。它使得"只要你满足某个前提，就自动拥有某项能力"成为可能，极大减少样板代码。

---

## 10.3 用生命周期确保引用有效

生命周期是 Rust 最独特的概念。大多数时候生命周期是隐式的、可推断的，但当引用之间的关系存在歧义时，就需要手动标注。

### 悬垂引用与借用检查器

生命周期的首要目标是防止**悬垂引用（dangling reference）**：

```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x;       // x 的生命周期到这里结束
    }
    println!("r: {r}"); // 错误：x 已经被释放，r 成了悬垂引用
}
```

**借用检查器（borrow checker）** 通过比较引用的生命周期来拒绝不安全的代码。用生命周期标注来可视化：

```
let r;                // ---------+-- 'a
{                     //          |
    let x = 5;        // -+-- 'b  |
    r = &x;           //  |       |
}                     // -+       |  'b 结束，x 被释放
println!("r: {r}");   //          |  r 还在用 -> 错误！
                      // ---------+
```

`'b`（被引用者的生命周期）比 `'a`（引用者的生命周期）短，所以编译器拒绝。修复方式是让被引用者活得更久：

```rust
fn main() {
    let x = 5;            // ----------+-- 'b
    let r = &x;           // --+-- 'a  |
    println!("r: {r}");   //   |       |
                           // --+       |
}                          // ----------+
```

现在 `'b` 长于 `'a`，引用始终有效。

### 函数中的泛型生命周期

考虑一个返回两个字符串切片中较长者的函数：

```rust
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

编译失败，因为编译器无法确定返回值是 `x` 还是 `y`，也就无法确定返回引用的生命周期。

### 生命周期标注语法

生命周期参数以 `'` 开头，通常用小写短名（`'a`），放在 `&` 之后：

```rust
&i32        // 普通引用
&'a i32     // 带生命周期标注的引用
&'a mut i32 // 带生命周期标注的可变引用
```

> **关键理解**：生命周期标注**不改变**引用实际活多久，它们只是描述多个引用之间生命周期的关系，供编译器检查。

### 函数签名中的生命周期标注

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

含义：存在某个生命周期 `'a`，函数的两个参数和返回值的引用都至少活 `'a` 那么久。实际上，**`'a` 等于两个输入生命周期中较短的那个**。

有效调用：

```rust
fn main() {
    let string1 = String::from("long string is long");
    {
        let string2 = String::from("xyz");
        let result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is {result}"); // OK: result 在 string2 的作用域内使用
    }
}
```

无效调用：

```rust
fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
    }
    println!("The longest string is {result}"); // 错误！string2 已释放
}
```

编译器以 `'a = min('string1 的生命周期, 'string2 的生命周期)` 来判断 `result` 的可用范围。

### 从行为角度思考生命周期

如果函数**总是**返回第一个参数，那么只需要标注第一个参数的生命周期：

```rust
fn longest<'a>(x: &'a str, y: &str) -> &'a str {
    x
}
```

`y` 的生命周期与返回值无关，不需要标注。生命周期标注的本质是：**告诉编译器返回值的引用与哪些输入参数的引用相关联**。

### 不能返回局部变量的引用

```rust
fn longest<'a>(x: &str, y: &str) -> &'a str {
    let result = String::from("really long string");
    result.as_str() // 错误：result 是局部变量，函数返回后就被释放
}
```

解决方案：返回拥有所有权的类型（如 `String`）而非引用。

### 结构体中的生命周期标注

当结构体持有引用时，必须标注生命周期：

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let i = ImportantExcerpt {
        part: first_sentence,
    };
    // i 的实例不能比 novel 活得更久，因为 part 引用了 novel 的数据
}
```

> `ImportantExcerpt<'a>` 的语义是：此结构体的实例不能比其 `part` 字段所引用的数据活得更久。

### 生命周期省略规则（Lifetime Elision Rules）

早期 Rust 要求所有引用都手动标注生命周期。后来团队发现程序员在大量重复相同的模式，于是将这些模式编码为编译器规则，称为 **生命周期省略规则**。

**术语**：参数上的生命周期叫 **输入生命周期（input lifetime）**，返回值上的叫 **输出生命周期（output lifetime）**。

**三条规则**（编译器按顺序应用，直到所有引用的生命周期都确定）：

| 规则 | 内容 |
|------|------|
| **规则 1** | 每个引用参数各自获得一个生命周期参数。`fn foo(x: &i32, y: &i32)` -> `fn foo<'a, 'b>(x: &'a i32, y: &'b i32)` |
| **规则 2** | 如果恰好只有一个输入生命周期参数，它被赋予所有输出生命周期。`fn foo<'a>(x: &'a i32) -> &'a i32` |
| **规则 3** | 如果有多个输入生命周期参数，但其中一个是 `&self` 或 `&mut self`（即方法），则 `self` 的生命周期被赋予所有输出生命周期。 |

**示例推导 1**：`fn first_word(s: &str) -> &str`

1. 规则 1：`fn first_word<'a>(s: &'a str) -> &str`
2. 规则 2（只有一个输入生命周期）：`fn first_word<'a>(s: &'a str) -> &'a str`
3. 所有生命周期已确定 -> 编译通过，无需手动标注。

**示例推导 2**：`fn longest(x: &str, y: &str) -> &str`

1. 规则 1：`fn longest<'a, 'b>(x: &'a str, y: &'b str) -> &str`
2. 规则 2 不适用（有两个输入生命周期）
3. 规则 3 不适用（不是方法）
4. 输出生命周期仍未确定 -> **编译错误！** 必须手动标注。

> **深度理解**：省略规则的设计目标是覆盖最常见的场景。只有当编译器无法推断时才需要手动标注。随着 Rust 发展，未来可能加入更多省略规则。

### 方法定义中的生命周期标注

```rust
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    // 规则 1 给 &self 分配生命周期；返回值不含引用，不需要输出生命周期
    fn level(&self) -> i32 {
        3
    }

    // 规则 1: &self 和 &announcement 各得一个生命周期
    // 规则 3: 输出生命周期 = &self 的生命周期
    // 因此不需要手动标注
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention please: {announcement}");
        self.part
    }
}
```

### 静态生命周期 `'static`

`'static` 表示引用可以存活于整个程序的运行期间。所有字符串字面量都是 `'static` 的，因为它们被直接编入二进制文件：

```rust
let s: &'static str = "I have a static lifetime.";
```

> **重要警告**：当编译器建议你加 `'static` 时，大多数情况下真正的问题是悬垂引用或生命周期不匹配，应该修复根源而非盲目使用 `'static`。`'static` 是"大锤"，不应轻易使用。

### 泛型类型参数、Trait Bound 与生命周期三者协作

一个综合示例，展示三者如何在同一个函数签名中共存：

```rust
use std::fmt::Display;

fn longest_with_an_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {ann}");
    if x.len() > y.len() { x } else { y }
}
```

分解这个签名：

- `<'a, T>`：在同一个尖括号中声明生命周期参数 `'a` 和类型参数 `T`（生命周期参数按惯例写在前面）。
- `x: &'a str, y: &'a str`：两个参数共享生命周期 `'a`。
- `-> &'a str`：返回值的生命周期与输入参数绑定。
- `where T: Display`：泛型 `T` 必须实现 `Display` trait。

这段代码展现了 Rust 类型系统的表达力：一个函数同时利用泛型消除类型重复、用 trait bound 约束行为、用生命周期确保引用安全。

---

## 小结

| 概念 | 作用 | 编译期 / 运行期 | 核心机制 |
|------|------|-----------------|----------|
| **泛型** | 消除类型重复 | 编译期单态化 | 类型参数 `<T>` |
| **Trait** | 定义共享行为、约束泛型 | 编译期静态分派 | `trait`、`impl Trait for Type`、trait bound |
| **生命周期** | 确保引用有效 | 编译期借用检查 | 生命周期参数 `<'a>`、省略规则 |

三者的关系：
- **泛型**让你写出"对任何类型都适用"的代码。
- **Trait bound**回答了"这个任意类型至少得能做什么？"——给泛型加上行为约束。
- **生命周期**回答了"这些引用能活多久？谁比谁活得长？"——给引用加上时间约束。

三者协同，让 Rust 在**编译期**就能捕获绝大多数类型错误和内存安全问题，同时保持**零运行时开销**。这是 Rust 类型系统最核心的设计哲学。
