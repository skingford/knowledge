---
title: "第 20 章：高级特性"
description: unsafe Rust、高级 trait、高级类型、高级函数与闭包、宏。
---

# 第 20 章：高级特性

> 原文：[Chapter 20: Advanced Features](https://doc.rust-lang.org/book/ch20-00-advanced-features.html)

## 本章要点

本章覆盖了 Rust 中那些"不常用但必须知道"的高级特性。它们在特定场景下极为关键：

| 主题 | 核心内容 | 典型场景 |
|------|---------|---------|
| Unsafe Rust | 五种超能力（superpower） | FFI、底层系统编程、绕过借用检查器的安全抽象 |
| 高级 Trait | 关联类型、默认类型参数、完全限定语法、supertrait、newtype | 运算符重载、消歧义、绕过孤儿规则 |
| 高级类型 | 类型别名、never type `!`、DST 与 `Sized` | 减少重复、diverging function、泛型约束 |
| 高级函数与闭包 | 函数指针 `fn`、返回闭包 | 传递已命名函数、工厂模式 |
| 宏 | 声明宏 `macro_rules!` + 三种过程宏 | 元编程、derive 派生、DSL |

---

## 20.1 Unsafe Rust

### 为什么需要 unsafe

Rust 的安全检查是**保守的**（conservative）：宁可误报也不漏报。当编译器无法确认代码安全时，它会直接拒绝。但有些情况下，程序员知道代码是安全的——这时就需要 `unsafe` 来告诉编译器"相信我"。

此外，底层硬件本身就是 unsafe 的。操作系统交互、裸机编程都需要绕过安全检查。

### 五种超能力（Unsafe Superpowers）

使用 `unsafe` 关键字开启一个 unsafe 块，可以执行以下**五种**操作：

1. **解引用裸指针**（Dereference a raw pointer）
2. **调用 unsafe 函数或方法**（Call an unsafe function or method）
3. **访问或修改可变静态变量**（Access or modify a mutable static variable）
4. **实现 unsafe trait**（Implement an unsafe trait）
5. **访问 union 的字段**（Access fields of a `union`）

> 关键认知：`unsafe` **不会**关闭借用检查器或其他安全检查。它只是让你获得上述五种能力。unsafe 块内的引用仍然会被检查。

### 超能力一：解引用裸指针（Raw Pointer）

Rust 有两种裸指针类型：`*const T`（不可变）和 `*mut T`（可变）。注意这里的 `*` 是类型名的一部分，不是解引用运算符。

裸指针与引用/智能指针的区别：

- 可以同时持有不可变和可变指针指向同一位置（忽略借用规则）
- 不保证指向有效内存
- 允许为 null
- 不自动清理

**创建裸指针不需要 unsafe**，只有**解引用**时才需要：

```rust
fn main() {
    let mut num = 5;

    // 使用 raw borrow 运算符创建裸指针——这是安全代码
    let r1 = &raw const num;   // *const i32
    let r2 = &raw mut num;     // *mut i32

    // 解引用裸指针——必须在 unsafe 块中
    unsafe {
        println!("r1 is: {}", *r1);
        println!("r2 is: {}", *r2);
    }
}
```

也可以从任意地址创建裸指针（极度危险，通常没有理由这样做）：

```rust
let address = 0x012345usize;
let r = address as *const i32;
```

裸指针的主要用途：与 C 代码交互（FFI），以及构建借用检查器无法理解的安全抽象。

### 超能力二：调用 unsafe 函数或方法

unsafe 函数在定义前加 `unsafe` 关键字，调用时必须在 `unsafe` 块内：

```rust
unsafe fn dangerous() {}

fn main() {
    unsafe {
        dangerous();
    }
}
```

> 即使在 unsafe 函数体内，执行 unsafe 操作仍然需要 `unsafe` 块，编译器会在你忘记时发出警告。这有助于将 unsafe 块保持尽可能小。

#### 在 unsafe 代码上构建安全抽象

这是 Rust unsafe 编程的核心模式。标准库的 `split_at_mut` 就是典型例子——它在内部使用 unsafe 代码，但对外暴露安全 API：

```rust
// 尝试用纯安全代码实现——编译失败！
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    assert!(mid <= len);
    (&mut values[..mid], &mut values[mid..])
    // 错误：不能同时对 values 进行两次可变借用
}
```

编译器不够"聪明"，无法理解我们借用的是切片的不同部分。解决方案是使用 unsafe：

```rust
use std::slice;

fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();

    assert!(mid <= len);

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
```

注意：函数本身**没有**标记为 `unsafe`。我们用 unsafe 代码实现了一个安全的抽象。这正是 Rust 标准库大量使用的模式。

#### 使用 `extern` 调用外部代码（FFI）

通过 `extern` 关键字定义外部函数接口（Foreign Function Interface）：

```rust
unsafe extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe {
        println!("Absolute value of -3 according to C: {}", abs(-3));
    }
}
```

`"C"` 指定了 ABI（Application Binary Interface）。`unsafe extern` 块内的函数默认都是 unsafe 的。但如果你确信某个 FFI 函数是安全的，可以用 `safe` 关键字标注：

```rust
unsafe extern "C" {
    safe fn abs(input: i32) -> i32;  // 声明为安全，调用时不需要 unsafe 块
}

fn main() {
    println!("Absolute value of -3 according to C: {}", abs(-3));
}
```

反向操作——让其他语言调用 Rust 函数：

```rust
#[unsafe(no_mangle)]
pub extern "C" fn call_from_c() {
    println!("Just called a Rust function from C!");
}
```

`#[unsafe(no_mangle)]` 阻止编译器对函数名进行 name mangling，使其他语言可以通过名字找到它。

### 超能力三：访问或修改可变静态变量

Rust 中全局变量叫做**静态变量**（static variable）。不可变静态变量的访问是安全的：

```rust
static HELLO_WORLD: &str = "Hello, world!";
```

静态变量 vs 常量：

- 静态变量在内存中有**固定地址**，访问总是指向同一数据
- 常量允许在使用时复制数据
- 静态变量可以是可变的（常量不行）

**可变静态变量**的读写都是 unsafe 的，因为多线程场景下可能产生数据竞争：

```rust
static mut COUNTER: u32 = 0;

/// SAFETY: 同一时间只能从单个线程调用
unsafe fn add_to_count(inc: u32) {
    unsafe {
        COUNTER += inc;
    }
}

fn main() {
    unsafe {
        add_to_count(3);
        println!("COUNTER: {}", *(&raw const COUNTER));
    }
}
```

> 惯用做法：编写 unsafe 函数时，写一个以 `SAFETY` 开头的注释，说明调用者需要满足什么条件。执行 unsafe 操作时，同样写 `SAFETY` 注释说明安全规则是如何被满足的。

建议：尽量使用第 16 章介绍的并发技术和线程安全智能指针，而非可变静态变量。

### 超能力四：实现 unsafe trait

当 trait 的某个方法有编译器无法验证的不变量（invariant）时，该 trait 被标记为 `unsafe`：

```rust
unsafe trait Foo {
    // methods go here
}

unsafe impl Foo for i32 {
    // method implementations go here
}
```

典型例子：`Send` 和 `Sync`。如果你的类型包含裸指针等非 `Send`/`Sync` 类型，但你知道它可以安全地跨线程使用，就需要 `unsafe impl Send` / `unsafe impl Sync`。

### 超能力五：访问 union 的字段

`union` 类似 `struct`，但同一时间只使用一个声明字段。主要用于与 C 代码中的 union 交互。访问 union 字段是 unsafe 的，因为 Rust 无法保证当前存储的数据类型。

### 使用 Miri 检查 unsafe 代码

[Miri](https://github.com/rust-lang/miri) 是官方的动态分析工具，能在运行时检测未定义行为：

```bash
rustup +nightly component add miri
cargo +nightly miri run
cargo +nightly miri test
```

Miri 是**动态**工具（运行时检测），与借用检查器这种**静态**工具（编译时检测）互补。它不能覆盖所有情况，但如果 Miri 发现了问题，那一定是 bug。

### unsafe 使用原则

- `unsafe` 不是坏事，但需要更加小心
- 保持 `unsafe` 块尽可能小
- 将 unsafe 代码封装在安全抽象中
- 编写 `SAFETY` 注释
- 使用 Miri 进行检测
- 深入学习：[The Rustonomicon](https://doc.rust-lang.org/nomicon/)

---

## 20.2 高级 Trait

### 关联类型（Associated Types）

关联类型是 trait 定义中的类型占位符，由实现者指定具体类型。最典型的例子是 `Iterator`：

```rust
pub trait Iterator {
    type Item;  // 关联类型

    fn next(&mut self) -> Option<Self::Item>;
}
```

实现时指定具体类型：

```rust
impl Iterator for Counter {
    type Item = u32;  // 指定关联类型为 u32

    fn next(&mut self) -> Option<Self::Item> {
        // ...
    }
}
```

**关联类型 vs 泛型的区别**：

| 特性 | 关联类型 | 泛型 |
|------|---------|------|
| 实现次数 | 每个类型只能实现一次 | 可以多次实现（不同泛型参数） |
| 调用端标注 | 不需要 | 可能需要指定类型参数 |
| 典型场景 | `Iterator`（每种类型只有一种迭代方式） | `From<T>`（可以从多种类型转换） |

如果用泛型定义 `Iterator`，就可以有 `Iterator<String> for Counter`、`Iterator<u32> for Counter` 等多种实现，调用 `next` 时必须指明用哪个。关联类型强制只有一种实现，使用更简洁。

### 默认类型参数与运算符重载

通过 `<PlaceholderType=ConcreteType>` 语法指定泛型的默认类型：

```rust
// 标准库 Add trait 的定义
trait Add<Rhs=Self> {       // Rhs 默认为 Self
    type Output;
    fn add(self, rhs: Rhs) -> Self::Output;
}
```

运算符重载示例——为 `Point` 重载 `+`：

```rust
use std::ops::Add;

#[derive(Debug, Copy, Clone, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}
```

自定义 `Rhs` 类型——不同类型相加：

```rust
use std::ops::Add;

struct Millimeters(u32);
struct Meters(u32);

impl Add<Meters> for Millimeters {
    type Output = Millimeters;

    fn add(self, other: Meters) -> Millimeters {
        Millimeters(self.0 + (other.0 * 1000))
    }
}
```

默认类型参数的两个主要用途：

1. **扩展类型时不破坏现有代码**（给已有 trait 添加泛型参数，提供默认值）
2. **简化常见场景**（大多数时候用默认值，特殊情况才自定义）

### 同名方法消歧义

当一个类型同时实现了多个 trait，且这些 trait 有同名方法时，需要消歧义。

**有 `self` 参数的方法**——用 trait 名前缀：

```rust
trait Pilot {
    fn fly(&self);
}

trait Wizard {
    fn fly(&self);
}

struct Human;

impl Pilot for Human {
    fn fly(&self) { println!("This is your captain speaking."); }
}

impl Wizard for Human {
    fn fly(&self) { println!("Up!"); }
}

impl Human {
    fn fly(&self) { println!("*waving arms furiously*"); }
}

fn main() {
    let person = Human;
    Pilot::fly(&person);   // "This is your captain speaking."
    Wizard::fly(&person);  // "Up!"
    person.fly();          // "*waving arms furiously*"（默认调用直接实现）
}
```

**没有 `self` 参数的关联函数**——必须使用完全限定语法（fully qualified syntax）：

```rust
trait Animal {
    fn baby_name() -> String;
}

struct Dog;

impl Dog {
    fn baby_name() -> String { String::from("Spot") }
}

impl Animal for Dog {
    fn baby_name() -> String { String::from("puppy") }
}

fn main() {
    println!("{}", Dog::baby_name());             // "Spot"
    println!("{}", <Dog as Animal>::baby_name());  // "puppy"
}
```

完全限定语法的通用形式：

```rust
<Type as Trait>::function(receiver_if_method, next_arg, ...);
```

### Supertrait（超 trait）

当一个 trait 依赖另一个 trait 的功能时，使用 supertrait：

```rust
use std::fmt;

trait OutlinePrint: fmt::Display {  // Display 是 OutlinePrint 的 supertrait
    fn outline_print(&self) {
        let output = self.to_string();  // 可以使用 Display 的 to_string
        let len = output.len();
        println!("{}", "*".repeat(len + 4));
        println!("*{}*", " ".repeat(len + 2));
        println!("* {output} *");
        println!("*{}*", " ".repeat(len + 2));
        println!("{}", "*".repeat(len + 4));
    }
}
```

实现 `OutlinePrint` 的类型必须同时实现 `Display`，否则编译失败。

### Newtype 模式绕过孤儿规则

孤儿规则（Orphan Rule）：只有 trait 或类型至少一个是本地 crate 定义的，才能实现 trait。

Newtype 模式用一个 tuple struct 包装外部类型，绕过此限制：

```rust
use std::fmt;

struct Wrapper(Vec<String>);  // 用 Wrapper 包装 Vec<String>

impl fmt::Display for Wrapper {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

fn main() {
    let w = Wrapper(vec![String::from("hello"), String::from("world")]);
    println!("w = {w}");  // w = [hello, world]
}
```

缺点：`Wrapper` 没有内部类型的方法。解决方案：

- 手动委托方法到 `self.0`
- 实现 `Deref` trait，让 `Wrapper` 透明地使用内部类型的方法

Newtype 模式没有运行时开销，wrapper 在编译时被消除。

---

## 20.3 高级类型

### Newtype 的更多用途

除了绕过孤儿规则，newtype 还可以：

- **类型安全**：`Millimeters(u32)` 和 `Meters(u32)` 不会混淆
- **封装实现细节**：用 `People` 包装 `HashMap<i32, String>`，只暴露需要的 API

### 类型别名（Type Alias）

用 `type` 关键字为已有类型创建别名：

```rust
type Kilometers = i32;

let x: i32 = 5;
let y: Kilometers = 5;
println!("x + y = {}", x + y);  // 可以相加，因为是同一类型
```

> 关键区别：类型别名**不是**新类型。`Kilometers` 和 `i32` 完全相同，编译器不会区分。Newtype 模式则创建真正不同的类型。

类型别名的主要用途——**减少重复**：

```rust
// 冗长的类型
type Thunk = Box<dyn Fn() + Send + 'static>;

let f: Thunk = Box::new(|| println!("hi"));

fn takes_long_type(f: Thunk) { /* ... */ }
fn returns_long_type() -> Thunk { Box::new(|| ()) }
```

标准库中的典型应用——`std::io::Result<T>`：

```rust
// std::io 中的定义
type Result<T> = std::result::Result<T, std::io::Error>;

// 使用时更简洁
pub trait Write {
    fn write(&mut self, buf: &[u8]) -> Result<usize>;
    fn flush(&mut self) -> Result<()>;
}
```

### Never 类型 `!`

`!` 是空类型（empty type），表示函数永远不返回（diverging function）：

```rust
fn bar() -> ! {
    panic!();  // panic! 永不返回
}
```

`!` 的核心特性：**可以强制转换为任何类型**。这解释了为什么 `match` 的不同分支可以返回不同"类型"：

```rust
let guess: u32 = match guess.trim().parse() {
    Ok(num) => num,      // 返回 u32
    Err(_) => continue,  // continue 的类型是 !，可以强制转换为 u32
};
```

常见的 `!` 类型表达式：

- `continue` —— 跳回循环顶部
- `panic!()` —— 终止程序
- 无限 `loop {}` —— 永不结束

### 动态大小类型（DST）与 `Sized` Trait

DST（Dynamically Sized Type）/ unsized type 是大小只在运行时才能确定的类型。

`str`（不是 `&str`）就是 DST：

```rust
// 编译失败！str 是 DST，无法直接创建变量
let s1: str = "Hello there!";
let s2: str = "How's it going?";
```

**DST 的黄金规则：必须将 DST 放在某种指针后面**——`&str`、`Box<str>`、`Rc<str>` 等。

Trait 也是 DST，所以 trait object 必须用 `&dyn Trait` 或 `Box<dyn Trait>`。

`Sized` trait 自动为所有编译时已知大小的类型实现。泛型函数默认隐式添加 `Sized` 约束：

```rust
fn generic<T>(t: T) { }
// 等价于
fn generic<T: Sized>(t: T) { }
```

用 `?Sized` 放松约束，允许 DST：

```rust
fn generic<T: ?Sized>(t: &T) { }  // T 可能是 DST，所以必须用引用
```

`?Trait` 语法**只**适用于 `Sized`，不能用于其他 trait。

---

## 20.4 高级函数与闭包

### 函数指针 `fn`

Rust 可以将已命名函数作为参数传递，函数会被强制转换为 `fn` 类型（注意是小写 `fn`，不是 `Fn` trait）：

```rust
fn add_one(x: i32) -> i32 {
    x + 1
}

fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 {
    f(arg) + f(arg)
}

fn main() {
    let answer = do_twice(add_one, 5);
    println!("The answer is: {answer}");  // 12
}
```

`fn` vs `Fn` 的区别：

| `fn` | `Fn` / `FnMut` / `FnOnce` |
|------|---------------------------|
| 具体类型 | trait |
| 函数指针 | 闭包 trait |
| 实现了所有三个闭包 trait | 各自有不同语义 |
| 不能捕获环境 | 可以捕获环境 |

> 最佳实践：用泛型 + 闭包 trait 编写函数参数，这样既能接受函数也能接受闭包。只在与 C 交互等不支持闭包的场景下才使用 `fn`。

函数指针的巧妙用法：

```rust
// 使用闭包
let list_of_strings: Vec<String> =
    list_of_numbers.iter().map(|i| i.to_string()).collect();

// 使用已命名函数（完全限定语法）
let list_of_strings: Vec<String> =
    list_of_numbers.iter().map(ToString::to_string).collect();

// 使用枚举构造器作为函数指针
enum Status { Value(u32), Stop }
let list_of_statuses: Vec<Status> = (0u32..20).map(Status::Value).collect();
```

### 返回闭包

闭包由 trait 表示，不能直接返回。通常有两种方式：

**方式一：`impl Trait`（单一闭包类型时使用）**

```rust
fn returns_closure() -> impl Fn(i32) -> i32 {
    |x| x + 1
}
```

但 `impl Trait` 的每次使用都会产生不同的 opaque type，以下代码无法编译：

```rust
// 编译失败！两个 impl Fn(i32) -> i32 是不同的 opaque type
let handlers = vec![returns_closure(), returns_initialized_closure(123)];
```

**方式二：`Box<dyn Fn>`（需要统一不同闭包类型时使用）**

```rust
fn returns_closure() -> Box<dyn Fn(i32) -> i32> {
    Box::new(|x| x + 1)
}

fn returns_initialized_closure(init: i32) -> Box<dyn Fn(i32) -> i32> {
    Box::new(move |x| x + init)
}

fn main() {
    let handlers = vec![returns_closure(), returns_initialized_closure(123)];
    for handler in handlers {
        let output = handler(5);
        println!("{output}");
    }
}
```

---

## 20.5 宏

### 宏 vs 函数

| 对比维度 | 宏 | 函数 |
|---------|-----|------|
| 执行时机 | 编译时展开 | 运行时调用 |
| 参数数量 | 可变参数 | 固定参数 |
| 能力 | 可以实现 trait、生成代码 | 不能在运行时实现 trait |
| 复杂度 | 更复杂（写 Rust 代码来生成 Rust 代码） | 更简单 |
| 作用域 | 必须在调用前定义或引入 | 可以在任何位置定义 |

Rust 的宏分为**两大类四种**：

```
宏
├── 声明宏（Declarative Macro）
│   └── macro_rules!
└── 过程宏（Procedural Macro）
    ├── 自定义 derive 宏（Custom #[derive] Macro）
    ├── 属性宏（Attribute-like Macro）
    └── 函数式宏（Function-like Macro）
```

### 声明宏 `macro_rules!`

声明宏是 Rust 中最常用的宏形式，工作原理类似 `match` 表达式，但匹配的是**代码结构**而非值。

以 `vec!` 宏的简化实现为例：

```rust
#[macro_export]
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

逐步解析模式 `( $( $x:expr ),* )`：

| 符号 | 含义 |
|------|------|
| `$` | 声明宏变量 |
| `$x:expr` | 匹配任意 Rust 表达式，绑定到 `$x` |
| `$( ... ),*` | 匹配零次或多次，用逗号分隔 |
| `$()*` 在展开侧 | 对每次匹配重复生成代码 |

调用 `vec![1, 2, 3]` 展开为：

```rust
{
    let mut temp_vec = Vec::new();
    temp_vec.push(1);
    temp_vec.push(2);
    temp_vec.push(3);
    temp_vec
}
```

`#[macro_export]` 使宏在 crate 被引入时可用。

### 过程宏：自定义 derive 宏

过程宏接收 `TokenStream` 作为输入，产生 `TokenStream` 作为输出。它不是模式匹配，而是真正的代码操作。

> 过程宏必须定义在独立的 crate 中，且 crate 类型为 `proc-macro`。

完整示例——实现 `#[derive(HelloMacro)]`：

**1. 定义 trait（`hello_macro` crate）：**

```rust
pub trait HelloMacro {
    fn hello_macro();
}
```

**2. 实现过程宏（`hello_macro_derive` crate）：**

`Cargo.toml`：

```toml
[lib]
proc-macro = true

[dependencies]
syn = "2.0"
quote = "1.0"
```

`src/lib.rs`：

```rust
use proc_macro::TokenStream;
use quote::quote;

#[proc_macro_derive(HelloMacro)]
pub fn hello_macro_derive(input: TokenStream) -> TokenStream {
    let ast = syn::parse(input).unwrap();
    impl_hello_macro(&ast)
}

fn impl_hello_macro(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let generated = quote! {
        impl HelloMacro for #name {
            fn hello_macro() {
                println!("Hello, Macro! My name is {}!", stringify!(#name));
            }
        }
    };
    generated.into()
}
```

三个关键 crate：

| Crate | 作用 |
|-------|------|
| `proc_macro` | Rust 内置，编译器 API，读写 Rust 代码 |
| `syn` | 将 `TokenStream` 解析为语法树（`DeriveInput` 等） |
| `quote` | 将语法树转回 `TokenStream`，提供 `quote!` 模板宏 |

**3. 使用：**

```rust
use hello_macro::HelloMacro;
use hello_macro_derive::HelloMacro;

#[derive(HelloMacro)]
struct Pancakes;

fn main() {
    Pancakes::hello_macro();  // "Hello, Macro! My name is Pancakes!"
}
```

### 过程宏：属性宏（Attribute-like Macro）

与 derive 宏类似，但可以创建自定义属性，且不限于 struct/enum，可以应用于函数等任何 item：

```rust
// 使用端（Web 框架示例）
#[route(GET, "/")]
fn index() {
    // ...
}

// 定义端
#[proc_macro_attribute]
pub fn route(attr: TokenStream, item: TokenStream) -> TokenStream {
    // attr: GET, "/"
    // item: fn index() { ... }
    // ...
}
```

属性宏有**两个** `TokenStream` 参数：属性的参数和被注解的 item。

### 过程宏：函数式宏（Function-like Macro）

看起来像函数调用，但在编译时操作 token。比 `macro_rules!` 更灵活，因为可以用完整的 Rust 代码处理输入：

```rust
// 使用端——编译时解析并检查 SQL 语法
let sql = sql!(SELECT * FROM posts WHERE id=1);

// 定义端
#[proc_macro]
pub fn sql(input: TokenStream) -> TokenStream {
    // 解析 SQL，检查语法，生成代码
    // ...
}
```

### 宏分类速查

| 宏类型 | 触发方式 | 输入 | 典型用途 |
|--------|---------|------|---------|
| `macro_rules!` | `name!(...)` | 模式匹配 token | `vec!`、`println!` |
| derive 宏 | `#[derive(Name)]` | 被注解的 struct/enum | `Serialize`、`Debug` |
| 属性宏 | `#[name(...)]` | 属性参数 + 被注解的 item | Web 路由、条件编译 |
| 函数式宏 | `name!(...)` | 括号内的 token | DSL（SQL、HTML 模板等） |

---

## 小结

本章介绍了 Rust 中不常用但关键的高级特性：

1. **Unsafe Rust** 提供五种超能力来处理编译器无法验证的场景。核心原则是将 unsafe 代码封装在安全抽象中，保持 unsafe 块尽可能小，并用 Miri 辅助检测。

2. **高级 Trait** 提供了关联类型、默认类型参数、完全限定语法、supertrait 和 newtype 模式等工具，解决了运算符重载、同名方法消歧义、孤儿规则等实际问题。

3. **高级类型** 中的类型别名减少重复，never type `!` 支持 diverging function，`Sized` trait 和 `?Sized` 约束处理动态大小类型。

4. **高级函数与闭包** 展示了函数指针 `fn` 和返回闭包的两种方式（`impl Trait` vs `Box<dyn Fn>`）。

5. **宏** 分为声明宏和三种过程宏，是 Rust 元编程的核心。声明宏通过模式匹配生成代码，过程宏通过操作 `TokenStream` 实现更复杂的代码生成。

这些特性构成了 Rust 生态系统的基础设施——标准库、Web 框架、序列化库等都大量使用它们。理解这些特性有助于读懂复杂的 Rust 代码和错误信息。
