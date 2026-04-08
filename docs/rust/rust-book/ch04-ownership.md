---
title: "第 4 章：认识所有权"
description: Rust 最核心的概念——所有权规则、引用与借用、切片类型。
---

# 第 4 章：认识所有权

> 原文：[Chapter 4: Understanding Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)

所有权（Ownership）是 Rust 最独特的特性，也是整个语言设计的基石。它让 Rust 在**不需要垃圾回收器（Garbage Collector）**的前提下，实现了编译期内存安全保证。理解所有权是掌握 Rust 的关键一步。

## 本章要点

- **所有权三规则**：每个值有且仅有一个 owner；owner 离开作用域时值被 drop
- **Move 语义**：赋值或传参默认转移所有权，而非复制；实现 `Copy` trait 的类型除外
- **引用与借用**：通过 `&` 和 `&mut` 在不转移所有权的前提下访问数据
- **借用规则**：任意时刻，要么有一个可变引用，要么有任意数量的不可变引用——二者不可共存
- **切片（Slice）**：对集合中连续元素序列的引用，将索引与数据状态绑定，杜绝"过期索引"问题
- **设计动机**：通过编译期静态检查，消灭数据竞争、悬垂指针、double free 等内存错误，零运行时开销

---

## 4.1 什么是所有权

> 原文：[What is Ownership?](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html)

### 为什么 Rust 需要所有权？

所有程序都必须管理内存。主流方案有三种：

| 方案 | 代表语言 | 优点 | 缺点 |
|------|----------|------|------|
| 垃圾回收（GC） | Java, Go, Python | 开发者无需手动管理 | 运行时开销、GC 停顿 |
| 手动分配/释放 | C, C++（传统风格） | 精确控制 | 容易出错：内存泄漏、double free、悬垂指针 |
| **所有权系统** | **Rust** | **编译期检查、零运行时开销** | 学习曲线较陡 |

Rust 选择了第三条路：通过一套**编译器在编译期检查**的规则来管理内存。如果违反规则，程序根本无法编译。这意味着所有权机制**不会拖慢你的程序运行速度**。

### Stack 与 Heap

理解所有权之前，必须区分栈（Stack）和堆（Heap）：

- **Stack**：后进先出（LIFO），所有数据必须是编译期已知的固定大小。分配和访问都非常快（位置总在栈顶）。
- **Heap**：存放编译期大小未知或大小可变的数据。分配时需要向 allocator 请求空间，返回一个指针（pointer）。访问速度较慢（需要跟随指针跳转）。

> 类比：Stack 像一叠盘子，只能从顶部放取；Heap 像餐厅领位——服务员需要找到一张够大的空桌。

当函数被调用时，传入的参数（包括指向堆数据的指针）和局部变量被压入栈；函数结束时这些值被弹出。**所有权系统的核心职责之一，就是追踪哪些代码在使用堆上的数据、最小化堆上的重复数据、清理不再使用的堆数据。**

### 所有权三规则

这三条规则是整个系统的基础，务必牢记：

> 1. Rust 中每一个值都有一个**所有者**（owner）。
> 2. 同一时刻，值**有且仅有一个** owner。
> 3. 当 owner 离开作用域（scope），值将被**丢弃**（dropped）。

### 变量作用域（Scope）

作用域是一个变量在程序中有效的范围：

```rust
fn main() {
    {                      // s 在此处无效——尚未声明
        let s = "hello";   // 从此处开始 s 有效

        // 使用 s
    }                      // 作用域结束，s 不再有效
}
```

关键点：变量从声明处开始有效，直到其所在作用域（花括号 `{}`）结束。

### `String` 类型

字符串字面量（string literal）是硬编码到程序中的、不可变的、编译期已知大小的值。但很多时候我们需要可变、可增长的字符串——这就是 `String` 类型：

```rust
let s = String::from("hello");
```

`String` 与字符串字面量的区别：

| 特性 | 字符串字面量 `&str` | `String` |
|------|---------------------|----------|
| 存储位置 | 程序二进制文件中 | 堆上 |
| 可变性 | 不可变 | 可变（`mut`） |
| 大小 | 编译期已知 | 运行时可变 |

```rust
fn main() {
    let mut s = String::from("hello");
    s.push_str(", world!"); // push_str() 向 String 追加字面量
    println!("{s}");        // 输出 "hello, world!"
}
```

### 内存与分配

对于 `String` 这类堆上数据：

1. 运行时必须向 allocator **请求内存**（`String::from` 做的事）
2. 使用完毕后必须**归还内存**

Rust 的方案：**当拥有堆数据的变量离开作用域时，Rust 自动调用一个特殊函数 `drop` 来释放内存。**

```rust
fn main() {
    {
        let s = String::from("hello"); // 从此处起 s 有效，堆上分配内存

        // 使用 s
    }                                  // 作用域结束，自动调用 drop，内存被释放
}
```

> 这个模式在 C++ 中称为 **RAII**（Resource Acquisition Is Initialization）。Rust 在语言层面将其作为核心机制。

### Move 语义：所有权转移

这是所有权系统中最需要深入理解的概念之一。

**栈上数据——直接复制：**

```rust
fn main() {
    let x = 5;
    let y = x; // 整数大小固定且在栈上，直接复制值
    // x 和 y 都有效，各自持有值 5
}
```

**堆上数据——Move（转移所有权）：**

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    // 从此处起 s1 不再有效！所有权已转移给 s2
}
```

`String` 在栈上存储三个字段：**指针**（指向堆上内容）、**长度**（len）、**容量**（capacity）。当 `s2 = s1` 时：

- 栈上的三个字段被复制给 `s2`（浅拷贝）
- **堆上的数据没有被复制**
- **`s1` 被立即失效**（invalidated）

为什么要让 `s1` 失效？因为如果两者都有效，当它们离开作用域时会各自调用 `drop`，导致**双重释放（double free）**——这是严重的内存安全漏洞。

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;

    println!("{s1}, world!"); // 编译错误！
}
```

编译器报错：

```
error[E0382]: borrow of moved value: `s1`
 --> src/main.rs:5:16
  |
2 |     let s1 = String::from("hello");
  |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
3 |     let s2 = s1;
  |              -- value moved here
5 |     println!("{s1}, world!");
  |                ^^ value borrowed here after move
```

> **设计哲学**：Rust 永远不会自动创建数据的"深拷贝"（deep copy）。因此，任何自动发生的复制操作在运行时开销上都可以被认为是廉价的。

### 重新赋值时的 drop

当给一个已持有堆数据的变量重新赋值时，Rust 会先 `drop` 掉旧值：

```rust
fn main() {
    let mut s = String::from("hello");
    s = String::from("ahoy");    // 旧值 "hello" 立即被 drop
    println!("{s}, world!");      // 输出 "ahoy, world!"
}
```

### Clone：显式深拷贝

如果你确实需要深拷贝堆上的数据，使用 `clone()` 方法：

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // 深拷贝：堆上数据也被复制

    println!("s1 = {s1}, s2 = {s2}"); // 两者都有效
}
```

> 当你看到 `clone()` 调用时，就知道这里可能有昂贵的操作——这是一个有意的视觉信号。

### Copy trait：栈上类型的自动复制

对于完全存储在栈上的类型，Rust 提供了 `Copy` trait。实现了 `Copy` 的类型在赋值时自动复制值，原变量仍然有效：

```rust
fn main() {
    let x = 5;
    let y = x;
    println!("x = {x}, y = {y}"); // 两者都有效
}
```

实现了 `Copy` 的常见类型：

- 所有整数类型：`i32`、`u64` 等
- 布尔类型：`bool`
- 所有浮点类型：`f32`、`f64`
- 字符类型：`char`
- 元组（仅当所有元素都实现 `Copy` 时）：`(i32, i32)` 可以，`(i32, String)` 不行

> **约束**：如果一个类型或其任何部分实现了 `Drop` trait，就不能再实现 `Copy`。这是因为需要特殊清理逻辑的类型不适合简单的按位复制。

### 所有权与函数

将值传递给函数，语义与变量赋值相同——要么 move，要么 copy：

```rust
fn main() {
    let s = String::from("hello");  // s 进入作用域

    takes_ownership(s);             // s 的值 move 进函数
                                    // 从此 s 不再有效

    let x = 5;                      // x 进入作用域

    makes_copy(x);                  // i32 实现了 Copy，x 被复制
                                    // x 之后仍然有效

} // x 离开作用域。s 已被 move，无特殊操作。

fn takes_ownership(some_string: String) { // some_string 进入作用域
    println!("{some_string}");
} // some_string 离开作用域，drop 被调用，内存被释放

fn makes_copy(some_integer: i32) { // some_integer 进入作用域
    println!("{some_integer}");
} // some_integer 离开作用域，无特殊操作
```

### 返回值与所有权

返回值同样会转移所有权：

```rust
fn main() {
    let s1 = gives_ownership();         // 返回值的所有权 move 给 s1

    let s2 = String::from("hello");     // s2 进入作用域

    let s3 = takes_and_gives_back(s2);  // s2 move 进函数，返回值 move 给 s3
} // s3 被 drop；s2 已 move 无操作；s1 被 drop

fn gives_ownership() -> String {
    let some_string = String::from("yours");
    some_string                         // 返回并 move 给调用者
}

fn takes_and_gives_back(a_string: String) -> String {
    a_string                            // 返回并 move 给调用者
}
```

用元组返回多个值的变通方式：

```rust
fn main() {
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{s2}' is {len}.");
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len();
    (s, length)
}
```

但是这种"把所有权传进去再传出来"的方式太繁琐了。幸运的是，Rust 提供了更优雅的方案——**引用与借用**。

---

## 4.2 引用与借用

> 原文：[References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)

### 引用的基本概念

**引用**（reference）就像一个指针，让你能够访问某个值而**不取得其所有权**。与裸指针不同，Rust 保证引用在其生命周期内始终指向有效的值。

```rust
fn main() {
    let s1 = String::from("hello");

    let len = calculate_length(&s1);  // &s1 创建一个指向 s1 的引用

    println!("The length of '{s1}' is {len}."); // s1 仍然有效！
}

fn calculate_length(s: &String) -> usize { // s 是对 String 的引用
    s.len()
} // s 离开作用域，但因为它不拥有所引用的值，所以不会 drop
```

- `&s1` 创建一个引用，指向 `s1` 的值但不取得所有权
- 函数参数 `s: &String` 表示接受一个 `String` 的引用
- 引用离开作用域时，其指向的值**不会被 drop**

> 创建引用的行为称为**借用**（borrowing）。就像现实生活中：别人拥有的东西你可以借来用，用完归还，所有权不变。

### 不可变引用（默认）

默认情况下引用是不可变的——你不能修改借来的值：

```rust
fn main() {
    let s = String::from("hello");
    change(&s);
}

fn change(some_string: &String) {
    some_string.push_str(", world"); // 编译错误！不能修改不可变引用
}
```

```
error[E0596]: cannot borrow `*some_string` as mutable, as it is behind a `&` reference
```

### 可变引用（`&mut`）

要修改借来的值，需要使用**可变引用**：

```rust
fn main() {
    let mut s = String::from("hello");  // 1. 变量本身必须声明为 mut
    change(&mut s);                     // 2. 传递可变引用 &mut
}

fn change(some_string: &mut String) {   // 3. 参数类型为 &mut String
    some_string.push_str(", world");
}
```

三个条件缺一不可：变量声明为 `mut`、创建 `&mut` 引用、函数签名接受 `&mut`。

### 可变引用的核心限制

**同一时刻，对同一数据只能有一个可变引用：**

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &mut s;
    let r2 = &mut s; // 编译错误！

    println!("{r1}, {r2}");
}
```

```
error[E0499]: cannot borrow `s` as mutable more than once at a time
```

**为什么有这个限制？** 为了在编译期杜绝**数据竞争**（data race）。数据竞争发生在以下三个条件同时满足时：

1. 两个或多个指针同时访问同一数据
2. 至少一个指针用于写入
3. 没有同步机制来协调访问

数据竞争会导致未定义行为，在运行时极难调试。Rust 的策略是**让带有数据竞争的代码根本无法通过编译**。

**解决方案：用作用域分隔**

```rust
fn main() {
    let mut s = String::from("hello");

    {
        let r1 = &mut s;
    } // r1 在此离开作用域，之后可以创建新的可变引用

    let r2 = &mut s; // 没问题
}
```

### 可变引用与不可变引用不能共存

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;     // 没问题
    let r2 = &s;     // 没问题
    let r3 = &mut s; // 编译错误！

    println!("{r1}, {r2}, and {r3}");
}
```

```
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```

**原因**：持有不可变引用的人不期望值会被突然改变。多个不可变引用之间没有问题（都只是读取），但读写不能同时存在。

### NLL：Non-Lexical Lifetimes

引用的作用域从声明处开始，到**最后一次使用**处结束（而不是到花括号结束）。这称为 Non-Lexical Lifetimes（NLL）：

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;     // 没问题
    let r2 = &s;     // 没问题
    println!("{r1} and {r2}");
    // r1 和 r2 在此之后不再使用，它们的作用域到此结束

    let r3 = &mut s;  // 没问题！r1、r2 的作用域已结束
    println!("{r3}");
}
```

### 悬垂引用（Dangling References）

悬垂引用指向已被释放的内存。Rust 编译器保证这种情况不会发生：

```rust
fn main() {
    let reference_to_nothing = dangle();
}

fn dangle() -> &String {      // 编译错误！
    let s = String::from("hello");
    &s                         // 返回对局部变量的引用
}  // s 在此被 drop，引用将指向无效内存
```

```
error[E0106]: missing lifetime specifier
  = help: this function's return type contains a borrowed value,
          but there is no value for it to be borrowed from
```

**解决方案：直接返回所有权**

```rust
fn no_dangle() -> String {
    let s = String::from("hello");
    s  // 所有权 move 给调用者，不会被 drop
}
```

### 引用规则总结

> 1. 在任意给定时刻，你可以拥有**以下两者之一**（不能同时）：
>    - **一个**可变引用（`&mut T`）
>    - **任意数量**的不可变引用（`&T`）
> 2. 引用**必须始终有效**（不能悬垂）

这两条规则是 Rust 内存安全的核心保障。第一条防止数据竞争，第二条防止悬垂指针。

---

## 4.3 切片类型

> 原文：[The Slice Type](https://doc.rust-lang.org/book/ch04-03-slices.html)

### 切片要解决什么问题？

切片（Slice）让你引用集合中的一段连续元素序列，而不需要获取整个集合的所有权。

考虑一个场景：写一个函数找到字符串中第一个单词。如果不用切片，只能返回一个索引：

```rust
fn first_word(s: &String) -> usize {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return i;
        }
    }

    s.len()
}
```

问题在于：返回的索引与字符串的状态**完全脱节**。如果字符串后来被修改了，索引就失去了意义：

```rust
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s); // word = 5

    s.clear(); // 清空字符串！

    // word 仍然是 5，但 s 已经是空的了——word 完全失效！
    // 编译器对此毫无察觉。
}
```

这种"索引与数据脱节"的 bug 非常常见且难以发现。切片从根本上解决了这个问题。

### 字符串切片（String Slice）

字符串切片是对 `String` 中部分内容的引用，类型为 `&str`：

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];   // "hello"
    let world = &s[6..11];  // "world"
}
```

切片在内部存储两个值：**起始位置的引用**和**长度**。

**Range 语法简写：**

```rust
let s = String::from("hello");

let slice = &s[0..2];  // 等价于
let slice = &s[..2];   // 从头开始可省略 0

let slice = &s[3..s.len()];  // 等价于
let slice = &s[3..];         // 到末尾可省略末端

let slice = &s[0..s.len()];  // 等价于
let slice = &s[..];          // 整个字符串
```

> **注意**：字符串切片的范围索引必须落在有效的 UTF-8 字符边界上。如果切在多字节字符中间，程序会 panic。

### 用切片重写 `first_word`

```rust
fn first_word(s: &String) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}
```

现在返回的切片与底层数据绑定在一起。如果有人试图在切片仍然存活时修改字符串，编译器会阻止：

```rust
fn main() {
    let mut s = String::from("hello world");

    let word = first_word(&s);  // 不可变借用

    s.clear();                  // 编译错误！需要可变借用，但不可变借用仍在使用

    println!("the first word is: {word}");
}
```

```
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```

**切片把索引与数据状态绑定在了一起**，编译器强制保证二者的一致性。之前那种"数据已改但索引过期"的 bug 在编译期就被彻底消灭了。

### 字符串字面量就是切片

```rust
let s = "Hello, world!";
```

`s` 的类型是 `&str`——一个指向程序二进制文件中特定位置的切片。这就解释了为什么字符串字面量是不可变的：`&str` 本身就是一个不可变引用。

### 更好的函数签名：`&str` 优于 `&String`

将参数类型从 `&String` 改为 `&str`，函数会更通用：

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }

    &s[..]
}

fn main() {
    let my_string = String::from("hello world");

    // 对 String 的切片
    let word = first_word(&my_string[0..6]);
    let word = first_word(&my_string[..]);
    // 对 String 的引用（等价于整个字符串的切片）
    let word = first_word(&my_string);

    let my_string_literal = "hello world";

    // 对字符串字面量的切片
    let word = first_word(&my_string_literal[0..6]);
    let word = first_word(&my_string_literal[..]);
    // 字符串字面量本身就是 &str，直接传入
    let word = first_word(my_string_literal);
}
```

> 这种灵活性来自 Rust 的 **deref coercion**（解引用强制转换），将在第 15 章详细介绍。经验法则：**如果函数不需要获取 `String` 的所有权，参数类型优先使用 `&str`。**

### 其他类型的切片

切片不仅适用于字符串，也适用于数组等集合：

```rust
let a = [1, 2, 3, 4, 5];

let slice = &a[1..3]; // 类型为 &[i32]

assert_eq!(slice, &[2, 3]);
```

`&[i32]` 切片的内部结构与字符串切片相同：一个指向首元素的引用加一个长度。

---

## 小结

### 所有权系统的设计哲学

所有权、借用和切片三个概念共同构成了 Rust 的内存安全体系。它们背后的设计哲学可以归纳为：

1. **编译期 > 运行时**：所有检查都在编译期完成，零运行时开销。
2. **显式 > 隐式**：需要深拷贝时必须调用 `clone()`，让程序员对性能开销有明确感知。
3. **独占 > 共享**：默认情况下值只有一个 owner，共享必须通过引用明确表达。
4. **不变 > 可变**：引用默认不可变，可变引用需要显式声明且受到严格限制。

### 核心规则速查

| 规则 | 说明 | 防止的问题 |
|------|------|-----------|
| 一个值只有一个 owner | 离开作用域时自动 drop | 内存泄漏、double free |
| 赋值默认 move | 原变量失效，除非类型实现 Copy | 悬垂指针、use-after-free |
| 一个 `&mut` 或多个 `&` | 可变引用与不可变引用不能共存 | 数据竞争 |
| 引用必须始终有效 | 编译器通过生命周期（lifetime）检查 | 悬垂引用 |
| 切片绑定数据状态 | 切片存活期间不允许修改底层数据 | 过期索引 |

### 常见心智模型

- **Move** = 浅拷贝 + 让原变量失效。不是"搬走"数据，而是转移"访问权"。
- **借用（`&`）** = "我看看，不拿走"。可以同时有多个人看。
- **可变借用（`&mut`）** = "借我改改"。一次只能借给一个人改，改的时候别人不能看。
- **切片** = "给我看这一段"。切片活着的时候，原数据不能被改。

掌握这些概念后，你就拥有了理解 Rust 后续所有高级特性（生命周期、智能指针、并发等）的基础。
