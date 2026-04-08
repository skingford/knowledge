---
title: "第 3 章：通用编程概念"
description: 变量与可变性、数据类型、函数、注释与控制流——Rust 的基础编程构件。
---

# 第 3 章：通用编程概念

> 原文：[Chapter 3: Common Programming Concepts](https://doc.rust-lang.org/book/ch03-00-common-programming-concepts.html)

本章覆盖几乎所有编程语言都拥有的基础概念，但全部从 Rust 的视角重新审视。Rust 在这些"看似平凡"的基础概念上做了大量有意的设计取舍（trade-off），理解这些取舍是掌握 Rust 思维模型的第一步。

## 本章要点

- Rust 变量默认不可变（immutable），通过 `mut` 显式声明可变性——这是"安全优先"哲学的直接体现
- Rust 是静态类型语言，所有类型在编译期确定；标量类型包括整数、浮点、布尔、字符，复合类型包括元组和数组
- 函数参数必须标注类型；Rust 严格区分语句（statement）和表达式（expression），函数体最后一个表达式即为返回值
- `if` 是表达式而非语句，可以出现在 `let` 赋值的右侧
- 三种循环结构：`loop`（无限循环）、`while`（条件循环）、`for`（迭代循环），其中 `for` 是最常用、最安全的方式

---

## 3.1 变量与可变性

> 原文：[Variables and Mutability](https://doc.rust-lang.org/book/ch03-01-variables-and-mutability.html)

### 3.1.1 默认不可变

Rust 中用 `let` 声明的变量默认是不可变的。尝试对不可变变量重新赋值会导致编译错误：

```rust
fn main() {
    let x = 5;
    println!("The value of x is: {x}");
    x = 6; // 编译错误！
    println!("The value of x is: {x}");
}
```

编译器报错：

```
error[E0384]: cannot assign twice to immutable variable `x`
 --> src/main.rs:4:5
  |
2 |     let x = 5;
  |         - first assignment to `x`
4 |     x = 6;
  |     ^^^^^ cannot assign twice to immutable variable
```

**为什么默认不可变？** 这是 Rust 安全并发设计的基石。如果代码的一部分假设某值不会变化，而另一部分却修改了它，这类 bug 极难追踪。编译器在编译期就替你拦住这类问题。不可变是"零成本的正确性保证"。

### 3.1.2 使用 `mut` 声明可变变量

加上 `mut` 关键字即可让变量可变：

```rust
fn main() {
    let mut x = 5;
    println!("The value of x is: {x}");
    x = 6;
    println!("The value of x is: {x}");
}
```

输出：

```
The value of x is: 5
The value of x is: 6
```

`mut` 不仅是功能开关，更是**意图声明**——它告诉阅读代码的人"这个变量后续会被修改"。

### 3.1.3 常量（Constants）

常量与不可变变量有本质区别：

| 特性 | 不可变变量 (`let`) | 常量 (`const`) |
|------|-------------------|----------------|
| 是否可用 `mut` | 可以加 `mut` 变为可变 | 永远不可变 |
| 类型标注 | 可选（编译器推断） | **必须标注** |
| 赋值来源 | 可以是运行时计算的值 | **只能是编译期常量表达式** |
| 作用域 | 局部作用域 | 可在全局作用域声明 |
| 生命周期 | 所在作用域 | 程序运行的整个期间（在其声明的作用域内） |

```rust
const THREE_HOURS_IN_SECONDS: u32 = 60 * 60 * 3;
```

命名规范：全大写字母，单词之间用下划线分隔。

**设计意图：** 常量适合表达那些"在整个程序生命周期中都不会变"的值，如物理常数、业务规则上限等。把这些值集中声明为常量，方便维护且语义清晰。

### 3.1.4 变量遮蔽（Shadowing）

Rust 允许用 `let` 重新声明同名变量，新变量会"遮蔽"旧变量：

```rust
fn main() {
    let x = 5;

    let x = x + 1;

    {
        let x = x * 2;
        println!("The value of x in the inner scope is: {x}");
    }

    println!("The value of x is: {x}");
}
```

输出：

```
The value of x in the inner scope is: 12
The value of x is: 6
```

### Shadowing 与 `mut` 的关键区别

**1. 编译期安全性：** shadowing 要求写 `let`，如果你忘了写 `let` 就会触发编译错误，这可以防止意外赋值。

**2. 允许改变类型：** 这是 shadowing 最强大的特性——你可以复用变量名但改变其类型：

```rust
// Shadowing：可以改变类型 -- 合法
let spaces = "   ";
let spaces = spaces.len();
```

```rust
// mut：不能改变类型 -- 编译错误
let mut spaces = "   ";
spaces = spaces.len(); // error[E0308]: mismatched types
```

**设计洞察：** Shadowing 让你在执行数据转换时不必发明新变量名（如 `spaces_str`、`spaces_len`），代码更简洁。同时，转换完成后变量仍然是不可变的，保持了安全性。

---

## 3.2 数据类型

> 原文：[Data Types](https://doc.rust-lang.org/book/ch03-02-data-types.html)

Rust 是**静态类型语言**（statically typed），编译器必须在编译期知道每个变量的类型。大多数情况下编译器可以推断类型，但在存在歧义时需要手动标注：

```rust
let guess: u32 = "42".parse().expect("Not a number!");
```

如果去掉 `: u32`，编译器无法确定 `parse()` 应该解析成什么类型，会报错。

### 3.2.1 标量类型（Scalar Types）

标量类型表示单个值，Rust 有四种基本标量类型。

#### 整数类型

| 长度 | 有符号 | 无符号 |
|------|--------|--------|
| 8-bit | `i8` | `u8` |
| 16-bit | `i16` | `u16` |
| 32-bit | `i32` | `u32` |
| 64-bit | `i64` | `u64` |
| 128-bit | `i128` | `u128` |
| 平台相关 | `isize` | `usize` |

- **有符号（signed）** 使用二补码（two's complement）存储，范围 -(2^(n-1)) 到 2^(n-1)-1
- **无符号（unsigned）** 范围 0 到 2^n - 1
- **默认类型：`i32`**，在大多数场景下是最佳选择
- `isize` / `usize` 取决于目标平台架构（32 位或 64 位），主要用于集合索引

**整数字面量格式：**

| 格式 | 示例 |
|------|------|
| 十进制 | `98_222` |
| 十六进制 | `0xff` |
| 八进制 | `0o77` |
| 二进制 | `0b1111_0000` |
| 字节（仅 `u8`） | `b'A'` |

下划线 `_` 是视觉分隔符，`1_000` 等价于 `1000`，提升可读性。

**整数溢出处理：**

- **Debug 模式：** 溢出会触发 panic（程序崩溃）
- **Release 模式（`--release`）：** 使用二补码回绕（wrapping），如 `u8` 的 256 变成 0

Rust 标准库提供了四组方法来显式处理溢出：

| 方法族 | 行为 |
|--------|------|
| `wrapping_*` | 所有模式下都回绕 |
| `checked_*` | 溢出时返回 `None` |
| `overflowing_*` | 返回值 + 是否溢出的布尔值 |
| `saturating_*` | 饱和到类型最大/最小值 |

**设计洞察：** Debug 模式 panic 而 Release 模式回绕，看似不一致，实则兼顾了"开发期严格检查"和"生产环境性能"。如果你需要确定性的溢出行为，应该显式使用上述方法。

#### 浮点类型

```rust
fn main() {
    let x = 2.0;      // f64（默认）
    let y: f32 = 3.0;  // f32（显式标注）
}
```

- `f64` 是默认类型，在现代 CPU 上与 `f32` 速度相当但精度更高
- 遵循 IEEE-754 标准
- 所有浮点类型都是有符号的

#### 数值运算

```rust
fn main() {
    let sum = 5 + 10;           // 加法
    let difference = 95.5 - 4.3; // 减法
    let product = 4 * 30;        // 乘法
    let quotient = 56.7 / 32.2;  // 浮点除法
    let truncated = -5 / 3;      // 整数除法，结果为 -1（向零截断）
    let remainder = 43 % 5;      // 取余
}
```

**注意：** 整数除法向零截断（truncate toward zero），`-5 / 3` 结果是 `-1` 而非 `-2`。

#### 布尔类型

```rust
fn main() {
    let t = true;
    let f: bool = false;
}
```

大小为 1 字节，主要用于条件判断。

#### 字符类型

```rust
fn main() {
    let c = 'z';
    let z: char = 'Z';
    let heart_eyed_cat = '😻';
}
```

- 大小：**4 字节**
- 使用**单引号**（字符串用双引号）
- 表示 Unicode 标量值（Unicode scalar value），范围 U+0000 到 U+D7FF 以及 U+E000 到 U+10FFFF
- 支持中文、日文、韩文、emoji 等

**设计洞察：** `char` 固定 4 字节是因为它表示的是 Unicode 标量值而非 UTF-8 编码单元。这与 `String` 中的字符概念不同，第 8 章会深入讨论。

### 3.2.2 复合类型（Compound Types）

#### 元组（Tuple）

元组将多个**不同类型**的值组合在一起，长度固定：

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

**解构（destructuring）：**

```rust
fn main() {
    let tup = (500, 6.4, 1);
    let (x, y, z) = tup;
    println!("The value of y is: {y}"); // 输出: 6.4
}
```

**索引访问：** 使用 `.` 加索引号：

```rust
fn main() {
    let x: (i32, f64, u8) = (500, 6.4, 1);
    let five_hundred = x.0;
    let six_point_four = x.1;
    let one = x.2;
}
```

**单元类型（Unit Type）：** 空元组 `()` 称为 unit type，表示"空值"或"无返回值"。不显式返回值的表达式隐式返回 `()`。

#### 数组（Array）

数组中所有元素**必须同一类型**，长度固定：

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
}
```

**类型标注语法：** `[类型; 长度]`

```rust
let a: [i32; 5] = [1, 2, 3, 4, 5];
```

**初始化相同值：**

```rust
let a = [3; 5]; // 等价于 [3, 3, 3, 3, 3]
```

**索引访问：**

```rust
fn main() {
    let a = [1, 2, 3, 4, 5];
    let first = a[0];  // 1
    let second = a[1]; // 2
}
```

**越界访问会 panic：**

```rust
use std::io;

fn main() {
    let a = [1, 2, 3, 4, 5];

    println!("Please enter an array index.");
    let mut index = String::new();
    io::stdin()
        .read_line(&mut index)
        .expect("Failed to read line");

    let index: usize = index
        .trim()
        .parse()
        .expect("Index entered was not a number");

    let element = a[index];
    println!("The value of the element at index {index} is: {element}");
}
```

如果输入索引 10：

```
thread 'main' panicked at src/main.rs:19:19:
index out of bounds: the len is 5 but the index is 10
```

**设计洞察：** Rust 在运行时检查数组边界，越界时立即 panic 而不是允许访问无效内存。这是 Rust 内存安全原则的直接体现——与 C/C++ 中的未定义行为形成鲜明对比。这个检查的代价很小，但收益巨大。

**数组 vs 向量（Vector）：** 数组大小固定、分配在栈上；向量（`Vec<T>`）大小可变、分配在堆上。不确定选哪个时，优先使用向量。

---

## 3.3 函数

> 原文：[How Functions Work](https://doc.rust-lang.org/book/ch03-03-how-functions-work.html)

### 3.3.1 基本语法

Rust 使用 `fn` 关键字定义函数，命名规范为 **snake_case**：

```rust
fn main() {
    println!("Hello, world!");
    another_function();
}

fn another_function() {
    println!("Another function.");
}
```

**关键点：** Rust 不关心函数定义的顺序——你可以在调用之后才定义函数。这与 C 语言需要前向声明不同。

### 3.3.2 参数（Parameters）

函数参数**必须声明类型**，这是 Rust 的有意设计：

```rust
fn main() {
    print_labeled_measurement(5, 'h');
}

fn print_labeled_measurement(value: i32, unit_label: char) {
    println!("The measurement is: {value}{unit_label}");
}
```

输出：`The measurement is: 5h`

**设计洞察：** 强制参数类型标注看似繁琐，实则带来两个好处：(1) 编译器能提供更精确的错误信息；(2) 函数签名本身就是文档，减少了对注释的依赖。编译器几乎不需要你在代码其他地方再标注类型。

### 3.3.3 语句与表达式（Statements vs Expressions）

这是 Rust 中一个**极其重要**的概念区分：

- **语句（Statement）：** 执行某个动作，**不返回值**
- **表达式（Expression）：** 计算并产生一个值

**语句示例：**

```rust
fn main() {
    let y = 6; // let 绑定是语句
}
```

语句不返回值，因此不能这样写：

```rust
fn main() {
    let x = (let y = 6); // 错误！let 是语句，没有返回值
}
```

这与 C 或 Ruby 不同——在那些语言中赋值会返回值（`x = y = 6` 合法），而 Rust 不允许。

**表达式示例：**

几乎所有其他东西都是表达式：数学运算、函数调用、宏调用、用花括号创建的作用域块：

```rust
fn main() {
    let y = {
        let x = 3;
        x + 1  // 注意：没有分号！这是一个表达式，值为 4
    };

    println!("The value of y is: {y}"); // 输出: 4
}
```

**核心规则：表达式末尾加分号就变成了语句，不再返回值。** 这条规则贯穿整个 Rust。

### 3.3.4 返回值

用 `->` 声明返回类型，函数体最后一个表达式自动作为返回值：

```rust
fn five() -> i32 {
    5  // 没有分号，这是返回值
}

fn main() {
    let x = five();
    println!("The value of x is: {x}"); // 输出: 5
}
```

带参数的返回值：

```rust
fn plus_one(x: i32) -> i32 {
    x + 1
}

fn main() {
    let x = plus_one(5);
    println!("The value of x is: {x}"); // 输出: 6
}
```

**经典错误——多余的分号：**

```rust
fn plus_one(x: i32) -> i32 {
    x + 1; // 加了分号！变成语句，返回 ()
}
```

```
error[E0308]: mismatched types
 --> src/main.rs:7:24
  |
7 | fn plus_one(x: i32) -> i32 {
  |    --------            ^^^ expected `i32`, found `()`
8 |     x + 1;
  |          - help: remove this semicolon to return this value
```

分号把表达式 `x + 1` 变成了语句，函数返回 `()`（unit type），与声明的 `i32` 不匹配。

**提前返回（early return）：** 使用 `return` 关键字可以提前退出函数，但大多数函数依靠最后一个表达式隐式返回：

```rust
fn example(x: i32) -> i32 {
    if x > 10 {
        return 100; // 提前返回
    }
    x * 2 // 隐式返回
}
```

---

## 3.4 注释

> 原文：[Comments](https://doc.rust-lang.org/book/ch03-04-comments.html)

Rust 的注释使用 `//`，从 `//` 到行尾的内容被编译器忽略：

```rust
// 这是一行注释
```

多行注释每行都需要 `//`：

```rust
// 这里我们做了一些复杂的操作，
// 需要多行注释来解释。
// 希望这段注释能说清楚。
```

注释可以放在代码行末：

```rust
let lucky_number = 7; // 今天手气不错
```

但更常见的 Rust 风格是把注释放在**代码上方**：

```rust
// 今天手气不错
let lucky_number = 7;
```

Rust 还有**文档注释**（documentation comments），使用 `///` 和 `//!`，支持 Markdown 格式，可以通过 `cargo doc` 生成 HTML 文档。文档注释在第 14 章详细介绍。

---

## 3.5 控制流

> 原文：[Control Flow](https://doc.rust-lang.org/book/ch03-05-control-flow.html)

### 3.5.1 `if` 表达式

基本用法：

```rust
fn main() {
    let number = 3;

    if number < 5 {
        println!("condition was true");
    } else {
        println!("condition was false");
    }
}
```

**条件必须是 `bool` 类型**——Rust 不会做隐式类型转换：

```rust
fn main() {
    let number = 3;

    if number { // 错误！expected `bool`, found integer
        println!("number was three");
    }
}

// 正确写法：
if number != 0 {
    println!("number was something other than zero");
}
```

**设计洞察：** 拒绝隐式类型转换（如 C 语言中非零即真）消除了一大类隐蔽 bug。代码意图更加显式和清晰。

#### `else if` 多条件分支

```rust
fn main() {
    let number = 6;

    if number % 4 == 0 {
        println!("number is divisible by 4");
    } else if number % 3 == 0 {
        println!("number is divisible by 3");
    } else if number % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
}
```

输出：`number is divisible by 3`（只执行第一个匹配的分支）

当 `else if` 过多时，应该考虑用 `match`（第 6 章介绍）来替代。

#### `if` 作为表达式

`if` 是表达式，可以用在 `let` 语句右侧：

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };

    println!("The value of number is: {number}"); // 输出: 5
}
```

**类型必须一致**——两个分支的返回类型必须相同：

```rust
let number = if condition { 5 } else { "six" }; // 错误！类型不匹配
```

**设计洞察：** `if` 是表达式而非语句，这使得 Rust 可以用 `let x = if ... { } else { }` 替代 C 风格的三元运算符 `? :`，语法更统一。但代价是两个分支必须返回同一类型，因为编译器必须在编译期确定变量类型。

### 3.5.2 循环

Rust 提供三种循环：`loop`、`while`、`for`。

#### `loop`：无限循环

```rust
fn main() {
    loop {
        println!("again!");
    }
}
```

用 `break` 退出，用 `continue` 跳过当次迭代。

**从 `loop` 返回值：** 在 `break` 后跟表达式即可：

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2;
        }
    };

    println!("The result is {result}"); // 输出: 20
}
```

**设计洞察：** `loop` 能返回值这一特性非常强大，它让"重试直到成功"的模式可以优雅地表达，而无需在循环外声明可变变量。

#### 循环标签（Loop Labels）

嵌套循环中，`break` 和 `continue` 默认作用于最内层循环。用标签（以 `'` 开头）可以指定作用于哪一层：

```rust
fn main() {
    let mut count = 0;
    'counting_up: loop {
        println!("count = {count}");
        let mut remaining = 10;

        loop {
            println!("remaining = {remaining}");
            if remaining == 9 {
                break; // 退出内层循环
            }
            if count == 2 {
                break 'counting_up; // 退出外层循环
            }
            remaining -= 1;
        }

        count += 1;
    }
    println!("End count = {count}");
}
```

输出：

```
count = 0
remaining = 10
remaining = 9
count = 1
remaining = 10
remaining = 9
count = 2
remaining = 10
End count = 2
```

#### `while`：条件循环

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{number}!");
        number -= 1;
    }

    println!("LIFTOFF!!!");
}
```

`while` 是 `loop` + `if` + `break` 的语法糖，减少了嵌套层级。

#### `for`：迭代循环（最常用）

遍历集合：

```rust
fn main() {
    let a = [10, 20, 30, 40, 50];

    for element in a {
        println!("the value is: {element}");
    }
}
```

**`for` 相比 `while` 索引遍历的优势：**

- **更安全**：不会出现索引越界
- **更高效**：编译器可以做更好的优化，不需要每次迭代检查边界条件
- **更易维护**：集合大小变化时不需要修改循环条件

使用 Range 实现计数循环：

```rust
fn main() {
    for number in (1..4).rev() {
        println!("{number}!");
    }
    println!("LIFTOFF!!!");
}
```

输出：

```
3!
2!
1!
LIFTOFF!!!
```

`(1..4)` 是左闭右开区间 [1, 4)，`.rev()` 将其反转。`for` + Range 是 Rust 中做计数循环的惯用方式，替代了其他语言中的 `for (i = 0; i < n; i++)`。

---

## 小结

本章覆盖的概念构成了 Rust 程序的基础骨架。回顾核心设计理念：

1. **显式优于隐式**：变量默认不可变，需要 `mut` 声明可变性；`if` 条件必须是 `bool`，不做隐式转换；函数参数必须标注类型。

2. **表达式优先**：`if`、`loop`、花括号块都是表达式，可以产生值。这使得代码更加函数式，减少了可变状态的使用。

3. **安全第一**：数组越界 panic 而非未定义行为；整数溢出在 debug 模式下 panic；分号 vs 无分号的区别在编译期就能捕获返回值类型错误。

4. **零成本抽象**：`for` 循环遍历迭代器编译后与手写索引循环性能一致，但更安全更简洁。

这些基础概念的设计选择，为后续章节中所有权（ownership）、借用（borrowing）、生命周期（lifetime）等 Rust 独有特性奠定了思维基础。
