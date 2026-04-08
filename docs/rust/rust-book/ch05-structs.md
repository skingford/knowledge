---
title: "第 5 章：使用结构体组织数据"
description: 定义结构体、使用元组结构体和单元结构体、为结构体实现方法和关联函数。
---

# 第 5 章：使用结构体组织数据

> 原文：[Chapter 5: Using Structs to Structure Related Data](https://doc.rust-lang.org/book/ch05-00-structs.html)

## 本章要点

- **struct（结构体）** 是 Rust 中将多个相关值打包并命名的自定义数据类型，类似于面向对象语言中对象的"数据属性"部分。
- 结构体与元组（tuple）的核心区别：结构体的每个字段都有名字，访问时不依赖顺序，代码语义更清晰。
- Rust 通过 `impl` 块为结构体定义 **方法（method）** 和 **关联函数（associated function）**，将数据与行为绑定在一起。
- 结构体（配合第 6 章的枚举）是在 Rust 中构建领域类型、充分利用编译期类型检查的基石。

> **设计动机**：Rust 没有 class，但通过 struct + impl + trait 实现了数据与行为分离的组合式设计，比传统 OOP 的继承更灵活、更安全。

---

## 5.1 定义并实例化结构体

> 原文：[Defining and Instantiating Structs](https://doc.rust-lang.org/book/ch05-01-defining-structs.html)

### 5.1.1 基本定义与实例化

使用 `struct` 关键字定义结构体，花括号内列出 **字段名（field name）** 和 **字段类型（field type）**：

```rust
struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}
```

创建实例时用 `key: value` 的形式，**字段顺序无关**：

```rust
fn main() {
    let user1 = User {
        active: true,
        username: String::from("someusername123"),
        email: String::from("someone@example.com"),
        sign_in_count: 1,
    };
}
```

用点号（`.`）访问字段。若要修改字段，**整个实例必须声明为 `mut`**——Rust 不允许仅标记某些字段为可变：

```rust
let mut user1 = User {
    active: true,
    username: String::from("someusername123"),
    email: String::from("someone@example.com"),
    sign_in_count: 1,
};

user1.email = String::from("anotheremail@example.com");
```

> **设计动机**：Rust 要求可变性（mutability）在绑定级别声明，而非字段级别。这与所有权系统一致——借用检查器（borrow checker）以整个值为单位追踪借用，字段级可变性会让借用分析变得极其复杂。

### 5.1.2 字段初始化简写（Field Init Shorthand）

当函数参数名与结构体字段名相同时，可以省略冒号后的重复部分：

```rust
fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,           // 等价于 username: username
        email,              // 等价于 email: email
        sign_in_count: 1,
    }
}
```

这与 JavaScript/ES6 的对象属性简写如出一辙，减少样板代码。

### 5.1.3 结构体更新语法（Struct Update Syntax）

用 `..` 语法从已有实例复制未显式指定的字段，创建新实例：

```rust
let user2 = User {
    email: String::from("another@example.com"),
    ..user1    // 其余字段取自 user1
};
```

`..user1` 必须放在最后。

> **所有权陷阱**：更新语法在底层使用 `=` 赋值，对于 `String` 等不实现 `Copy` trait 的类型会发生 **移动（move）**。上例中 `user1.username` 被移动到 `user2`，之后 `user1` 整体不能再使用。但 `bool`、`u64` 等实现了 `Copy` 的类型只是复制。如果你为所有非 `Copy` 字段都显式指定了新值，则原实例仍然有效。

```rust
// user1.active 和 user1.sign_in_count 仍可使用（Copy 类型）
// user1.username 已被移走，不可使用
// user1 整体也不可使用（因为部分字段已失效）
```

### 5.1.4 元组结构体（Tuple Struct）

有名字但字段无名，适用于"给整个元组一个语义类型名"的场景：

```rust
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

fn main() {
    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

**关键点**：`Color` 和 `Point` 虽然字段类型完全相同，但它们是**不同的类型**，不能互相替代。这就是 Rust 的 **newtype pattern** 的基础——通过类型系统在编译期防止语义错误。

访问字段使用点号加索引（`origin.0`），或通过解构：

```rust
let Point(x, y, z) = origin;
```

### 5.1.5 类单元结构体（Unit-Like Struct）

没有任何字段的结构体，行为类似于单元类型 `()`：

```rust
struct AlwaysEqual;

fn main() {
    let subject = AlwaysEqual;
}
```

> **设计动机**：类单元结构体本身不存储数据，但可以为其实现 trait。例如你可以让 `AlwaysEqual` 实现 `PartialEq`，使其与任何值"相等"。这在泛型编程和标记类型（marker type）中非常有用。

### 5.1.6 结构体数据的所有权

结构体通常使用自有类型（owned type）如 `String`，确保数据生命周期与结构体一致：

```rust
struct User {
    active: bool,
    username: String,    // 自有数据
    email: String,       // 自有数据
    sign_in_count: u64,
}
```

如果想在结构体中存储引用（如 `&str`），必须使用 **生命周期（lifetime）** 标注，否则编译器会报错：

```rust
// 编译失败！缺少生命周期标注
struct User {
    active: bool,
    username: &str,  // error: missing lifetime specifier
    email: &str,     // error: missing lifetime specifier
    sign_in_count: u64,
}
```

生命周期确保结构体引用的数据在结构体存活期间始终有效，这是 Rust 内存安全的核心保障之一。生命周期的详细讨论见第 10 章；在那之前，建议使用 `String` 而非 `&str`。

---

## 5.2 结构体示例程序

> 原文：[An Example Program Using Structs](https://doc.rust-lang.org/book/ch05-02-example-structs.html)

本节通过一个计算矩形面积的程序，演示从"裸变量"到"结构体"的逐步重构，体现结构体的实际价值。

### 5.2.1 第一版：独立变量

```rust
fn main() {
    let width1 = 30;
    let height1 = 50;

    println!(
        "The area of the rectangle is {} square pixels.",
        area(width1, height1)
    );
}

fn area(width: u32, height: u32) -> u32 {
    width * height
}
```

**问题**：`area` 的签名无法表达 `width` 和 `height` 是相关联的。随着参数增多，调用者容易搞混顺序。

### 5.2.2 第二版：用元组分组

```rust
fn main() {
    let rect1 = (30, 50);

    println!(
        "The area of the rectangle is {} square pixels.",
        area(rect1)
    );
}

fn area(dimensions: (u32, u32)) -> u32 {
    dimensions.0 * dimensions.1
}
```

**改进**：参数变成一个整体。  
**问题**：`dimensions.0` 和 `dimensions.1` 没有语义，宽和高容易搞混，且编译器无法帮你检查。

### 5.2.3 第三版：用结构体重构

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        area(&rect1)
    );
}

fn area(rectangle: &Rectangle) -> u32 {
    rectangle.width * rectangle.height
}
```

**优势**：
- 字段有名字，语义明确。
- 函数签名一目了然："计算一个 `Rectangle` 的面积"。
- 使用不可变借用 `&Rectangle`，函数不会夺走调用者的所有权。

> **设计洞察**：`area` 目前是一个独立函数，但在概念上它属于 `Rectangle` 的行为。5.3 节会将其改为方法。

### 5.2.4 派生 trait 与调试输出

直接用 `{}` 打印结构体会报错，因为结构体没有实现 `Display` trait——输出格式有歧义（用逗号？用括号？显示哪些字段？）。

Rust 的解决方案是派生 `Debug` trait：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    // 紧凑格式
    println!("rect1 is {rect1:?}");
    // 输出: rect1 is Rectangle { width: 30, height: 50 }

    // 美化格式（适合字段较多的结构体）
    println!("rect1 is {rect1:#?}");
    // 输出:
    // rect1 is Rectangle {
    //     width: 30,
    //     height: 50,
    // }
}
```

- `#[derive(Debug)]` 是一个属性宏（attribute macro），自动生成 `Debug` trait 的实现。
- `{:?}` 使用 Debug 格式，`{:#?}` 使用美化的 Debug 格式。

### 5.2.5 `dbg!` 宏

`dbg!` 是比 `println!` 更强大的调试工具：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

fn main() {
    let scale = 2;
    let rect1 = Rectangle {
        width: dbg!(30 * scale),  // 打印表达式及其结果，并返回该值
        height: 50,
    };

    dbg!(&rect1);  // 传引用避免移动所有权
}
```

输出（注意是 **stderr** 而非 stdout）：

```
[src/main.rs:10:16] 30 * scale = 60
[src/main.rs:14:5] &rect1 = Rectangle {
    width: 60,
    height: 50,
}
```

**`dbg!` 的三个特点**：
1. 输出到 **stderr**，不会污染程序的正常输出。
2. 显示文件名和行号，方便定位。
3. **取得所有权后返回值**——所以可以嵌入表达式中（如 `width: dbg!(30 * scale)`）。传 `&rect1` 可避免所有权转移。

---

## 5.3 方法语法

> 原文：[Method Syntax](https://doc.rust-lang.org/book/ch05-03-method-syntax.html)

### 5.3.1 定义方法

方法（method）与函数类似，但定义在 `impl` 块中，第一个参数始终是 `self`（代表调用该方法的实例）：

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    let rect1 = Rectangle {
        width: 30,
        height: 50,
    };

    println!(
        "The area of the rectangle is {} square pixels.",
        rect1.area()
    );
}
```

`&self` 是 `self: &Self` 的语法糖，其中 `Self` 是 `impl` 块对应的类型别名。

### 5.3.2 `self` 的三种形式

| 形式 | 含义 | 使用场景 |
|------|------|----------|
| `&self` | 不可变借用（`self: &Self`） | 只读访问，最常用 |
| `&mut self` | 可变借用（`self: &mut Self`） | 需要修改实例的字段 |
| `self` | 获取所有权（`self: Self`） | 罕见；通常用于"消耗"自身并转换为另一个类型 |

> **设计动机**：方法的 `self` 参数遵循与普通参数完全相同的所有权规则。这保持了 Rust 所有权模型的一致性——方法不是特殊的魔法，只是第一个参数恰好是 `self`。

### 5.3.3 方法名与字段名可以相同

Rust 通过是否带括号来区分：

```rust
impl Rectangle {
    fn width(&self) -> bool {
        self.width > 0
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };

    if rect1.width() {     // 调用方法
        println!("The rectangle has a nonzero width; it is {}", rect1.width); // 访问字段
    }
}
```

仅返回同名字段值的方法被称为 **getter**。Rust 不会自动生成 getter——你需要显式定义。这在需要将字段设为私有（private）但提供只读公开访问时非常有用。

### 5.3.4 自动引用和解引用（Automatic Referencing and Dereferencing）

当你用 `object.method()` 调用方法时，Rust 会自动为 `object` 添加 `&`、`&mut` 或 `*`，使其匹配方法签名：

```rust
p1.distance(&p2);
// 编译器自动转换为等价形式：
(&p1).distance(&p2);
```

> **设计动机**：C/C++ 中对指针调用方法需要用 `->` 运算符（如 `ptr->method()`），Rust 没有 `->` 运算符。方法的接收者类型是明确的（`&self` / `&mut self` / `self`），编译器可以无歧义地推断出正确的借用方式。这使得方法调用的所有权语义始终清晰，同时保持了简洁的语法。

### 5.3.5 带更多参数的方法

`self` 之后可以有任意多个额外参数：

```rust
impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

fn main() {
    let rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("Can rect1 hold rect2? {}", rect1.can_hold(&rect2)); // true
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3)); // false
}
```

### 5.3.6 关联函数（Associated Function）

定义在 `impl` 块中但**第一个参数不是 `self`** 的函数称为关联函数。它们通过 `::` 语法调用，常用作构造器：

```rust
impl Rectangle {
    fn square(size: u32) -> Self {
        Self {
            width: size,
            height: size,
        }
    }
}

fn main() {
    let sq = Rectangle::square(3);
}
```

- `Self` 是 `impl` 后面类型的别名（这里即 `Rectangle`）。
- 关联函数不是方法（因为没有 `self`），用 `::` 而非 `.` 调用。
- `String::from()` 就是一个典型的关联函数。

> **设计动机**：Rust 没有构造函数（constructor）的概念。关联函数充当"命名构造器"，可以有多个，名字自文档化（如 `square`、`from`、`new`、`with_capacity` 等），比重载构造函数的方式更清晰。

### 5.3.7 多个 `impl` 块

同一类型可以有多个 `impl` 块，效果等价于写在一起：

```rust
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}
```

通常没有必要拆分，但在泛型和 trait 实现中（第 10 章），多个 `impl` 块会变得有用——例如为不同的泛型参数约束提供不同的方法集。

---

## 小结

| 概念 | 说明 |
|------|------|
| **struct** | 将相关字段打包为自定义类型 |
| **元组结构体（tuple struct）** | 有类型名但字段无名，适用于 newtype 模式 |
| **类单元结构体（unit-like struct）** | 无字段，用于标记类型或 trait 实现 |
| **字段初始化简写** | 变量名与字段名相同时省略 `field: field` |
| **结构体更新语法 `..`** | 从已有实例复制字段，注意 move 语义 |
| **方法（method）** | `impl` 块中第一个参数为 `self` 的函数 |
| **关联函数（associated function）** | `impl` 块中无 `self` 参数的函数，用 `::` 调用 |
| **自动引用/解引用** | 调用方法时编译器自动匹配 `&` / `&mut` / `*` |
| **`#[derive(Debug)]`** | 派生宏，自动实现 Debug trait 用于调试输出 |
| **`dbg!` 宏** | 输出到 stderr，显示文件/行号，返回值不消耗所有权 |

**核心设计哲学**：Rust 的 struct + impl 模式将数据定义与行为实现分离，通过 trait 实现多态，避免了继承带来的紧耦合。结构体的所有权规则与普通变量完全一致——没有例外、没有魔法——这是 Rust "零成本抽象"理念的体现。

> 下一章（第 6 章）将介绍枚举（enum），它是 Rust 类型系统的另一大支柱。结构体用于"且"关系（一个值同时拥有多个字段），枚举用于"或"关系（一个值是多个变体之一）。
