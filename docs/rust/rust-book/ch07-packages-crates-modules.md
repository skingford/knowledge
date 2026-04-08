---
title: "第 7 章：使用包、Crate 和模块管理项目"
description: 包与 crate 的关系、模块系统、路径引用、use 关键字和文件拆分。
---

# 第 7 章：使用包、Crate 和模块管理项目

> 原文：[Chapter 7: Managing Growing Projects with Packages, Crates, and Modules](https://doc.rust-lang.org/book/ch07-00-managing-growing-projects-with-packages-crates-and-modules.html)

## 本章要点

Rust 的模块系统（module system）由四个核心概念组成：

| 概念 | 作用 |
|------|------|
| **Package（包）** | Cargo 的构建单元，包含 `Cargo.toml`，可含多个 crate |
| **Crate（板条箱）** | 编译器一次处理的最小代码单元，产出 library 或 executable |
| **Module（模块）** | 控制代码组织、作用域（scope）和私有性（privacy） |
| **Path（路径）** | 命名 struct、function、module 等条目的方式 |

**设计动机**：随着项目规模增长，代码需要按功能分组、按职责隔离。模块系统让你：

- 将相关功能聚合到一起，方便查找和复用
- 通过 public / private 边界封装实现细节，限制外部代码可见的接口
- 避免命名冲突——同一 scope 内不允许两个同名条目

---

## 7.1 包与 Crate

> 原文：[Packages and Crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html)

### Crate 的两种形态

| 类型 | 特征 | 典型场景 |
|------|------|----------|
| **Binary crate** | 有 `main` 函数，编译为可执行文件 | CLI 工具、Web 服务器 |
| **Library crate** | 无 `main` 函数，不产出可执行文件 | 共享库，如 `rand` |

每个 crate 都有一个 **crate root**（crate 根）：编译器以此为起点，构建出 crate 的根模块。

### Package 的约束规则

一个 package（通过 `Cargo.toml` 描述）必须满足：

- 至少包含 **一个** crate（library 或 binary）
- 最多包含 **一个** library crate
- 可以包含 **任意多个** binary crate

### Cargo 的约定优于配置

Cargo 不需要你在 `Cargo.toml` 里显式指定 crate root，而是通过文件位置推断：

| 文件路径 | 含义 |
|----------|------|
| `src/main.rs` | 与包同名的 **binary crate** 的 crate root |
| `src/lib.rs` | 与包同名的 **library crate** 的 crate root |
| `src/bin/*.rs` | 每个文件各自成为一个独立的 binary crate |

```bash
$ cargo new my-project
     Created binary (application) `my-project` package
$ ls my-project/src
main.rs
```

此时 package `my-project` 只有一个 binary crate，其 crate root 是 `src/main.rs`。

如果同时存在 `src/main.rs` 和 `src/lib.rs`，则 package 拥有两个 crate：一个 binary、一个 library，二者与包同名。若在 `src/bin/` 下放置更多 `.rs` 文件，则每个文件都是额外的 binary crate。

> **精读提示**：这种"约定优于配置"的设计让大多数项目零配置即可运行。理解这些约定是看懂任何 Rust 项目目录结构的基础。

---

## 7.2 定义模块来控制作用域和私有性

> 原文：[Defining Modules to Control Scope and Privacy](https://doc.rust-lang.org/book/ch07-02-defining-modules-to-control-scope-and-privacy.html)

### 模块速查表

以下规则覆盖了模块系统的核心机制：

1. **从 crate root 开始**：编译器从 `src/lib.rs`（library）或 `src/main.rs`（binary）开始解析。
2. **声明模块**：在 crate root 中使用 `mod garden;`，编译器依次在以下位置查找模块体：
   - 行内：`mod garden { ... }`
   - 文件：`src/garden.rs`
   - 文件：`src/garden/mod.rs`（旧风格）
3. **声明子模块**：在非 root 文件中使用 `mod vegetables;`，编译器在以下位置查找：
   - 行内：`mod vegetables { ... }`
   - 文件：`src/garden/vegetables.rs`
   - 文件：`src/garden/vegetables/mod.rs`（旧风格）
4. **路径引用**：模块一旦成为 crate 的一部分，就可以通过路径引用，如 `crate::garden::vegetables::Asparagus`。
5. **默认私有**：模块内的条目对父模块私有，需用 `pub` 显式公开。
6. **use 快捷方式**：`use crate::garden::vegetables::Asparagus;` 创建本地快捷名。

### 完整示例：backyard crate

目录结构：

```
backyard
├── Cargo.lock
├── Cargo.toml
└── src
    ├── garden
    │   └── vegetables.rs
    ├── garden.rs
    └── main.rs
```

`src/main.rs`：

```rust
use crate::garden::vegetables::Asparagus;

pub mod garden;

fn main() {
    let plant = Asparagus {};
    println!("I'm growing {plant:?}!");
}
```

`src/garden.rs`：

```rust
pub mod vegetables;
```

`src/garden/vegetables.rs`：

```rust
#[derive(Debug)]
pub struct Asparagus {}
```

### 模块树（Module Tree）

模块形成一棵树，crate root（`src/lib.rs` 或 `src/main.rs`）对应隐式的 `crate` 根模块。以经典的餐厅示例为例：

```rust
// src/lib.rs
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}
```

对应的模块树：

```
crate
 └── front_of_house
     ├── hosting
     │   ├── add_to_waitlist
     │   └── seat_at_table
     └── serving
         ├── take_order
         ├── serve_order
         └── take_payment
```

> **精读提示**：模块树与文件系统的目录树高度相似，这是有意为之的设计——降低学习成本，让开发者用管理文件的直觉来管理代码。同级模块（sibling modules）之间、子模块访问祖先模块都有明确的可见性规则（见 7.3 节）。

---

## 7.3 引用模块项的路径

> 原文：[Paths for Referring to an Item in the Module Tree](https://doc.rust-lang.org/book/ch07-03-paths-for-referring-to-an-item-in-the-module-tree.html)

### 两种路径形式

| 路径类型 | 起点 | 类比 |
|----------|------|------|
| **绝对路径（Absolute path）** | `crate` 关键字（当前 crate）或 crate 名（外部 crate） | 文件系统的 `/` 开头路径 |
| **相对路径（Relative path）** | 当前模块，可用 `self`、`super` 或当前模块中的标识符 | 文件系统的 `./` 或 `../` |

路径各段之间用 `::` 分隔。

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 绝对路径
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径
    front_of_house::hosting::add_to_waitlist();
}
```

> **何时选绝对、何时选相对？** 官方建议优先使用绝对路径。原因是代码的定义和调用更可能被独立移动，绝对路径在重构时更稳定。相对路径在模块内部紧密耦合的场景下更简洁。

### 私有性规则（Privacy Rules）

Rust 的核心原则：**所有条目默认私有**。

- 父模块 **不能** 访问子模块的私有条目
- 子模块 **可以** 访问所有祖先模块的条目（因为子模块在祖先的上下文中定义）

这一不对称设计的动机是：子模块封装实现细节，对外隐藏内部；但子模块需要知道自己所处的上下文。

```rust
mod front_of_house {
    mod hosting {  // 未标记 pub，对外部私有
        fn add_to_waitlist() {}
    }
}

pub fn eat_at_restaurant() {
    // 编译错误！module `hosting` is private
    crate::front_of_house::hosting::add_to_waitlist();
}
```

修复：需要同时将模块和函数标记为 `pub`：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}  // 模块和函数都需要 pub
    }
}
```

> **精读提示**：`pub mod` 只是让模块本身可被访问，并不会自动公开其内容。这是初学者常见的困惑点——必须逐层标记 `pub`。

### 用 `super` 访问父模块

`super` 相当于文件系统中的 `..`，指向当前模块的父模块：

```rust
fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();
        super::deliver_order();  // 访问父模块（crate root）中的函数
    }

    fn cook_order() {}
}
```

`super` 的好处：如果 `back_of_house` 和 `deliver_order` 将来一起移动到另一个模块下，`super` 路径无需修改。

### struct 与 enum 的公开性差异

**struct**：字段默认私有，需逐个标记 `pub`。若有私有字段，必须提供公有构造函数：

```rust
mod back_of_house {
    pub struct Breakfast {
        pub toast: String,          // 公有字段，外部可读写
        seasonal_fruit: String,     // 私有字段，外部不可访问
    }

    impl Breakfast {
        // 必须提供构造函数，因为外部无法直接构造含私有字段的 struct
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }
}

pub fn eat_at_restaurant() {
    let mut meal = back_of_house::Breakfast::summer("Rye");
    meal.toast = String::from("Wheat");  // OK：公有字段
    // meal.seasonal_fruit = String::from("blueberries");  // 编译错误：私有字段
}
```

**enum**：一旦 enum 本身为 `pub`，**所有变体自动公有**：

```rust
mod back_of_house {
    pub enum Appetizer {
        Soup,   // 自动公有
        Salad,  // 自动公有
    }
}
```

> **设计动机**：struct 的字段常包含实现细节（如内部缓存、验证状态），应默认隐藏。而 enum 的语义要求调用者能匹配所有变体，若变体私有则 enum 几乎不可用，因此全部公开。

---

## 7.4 用 use 将路径引入作用域

> 原文：[Bringing Paths into Scope with the use Keyword](https://doc.rust-lang.org/book/ch07-04-bringing-paths-into-scope-with-the-use-keyword.html)

### 基本用法

`use` 在当前作用域中创建一个快捷方式，类似文件系统的符号链接（symlink）：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();  // 无需写完整路径
}
```

### 惯用风格（Idiomatic Conventions）

| 条目类型 | 惯用做法 | 原因 |
|----------|----------|------|
| **函数** | 引入父模块（如 `use ...::hosting`） | 调用时写 `hosting::add_to_waitlist()`，一眼看出非本地函数 |
| **struct / enum / 其他** | 引入完整路径（如 `use std::collections::HashMap`） | 惯例如此，直接用 `HashMap::new()` 更自然 |
| **同名条目** | 引入父模块以区分，或用 `as` 别名 | 避免歧义 |

**反面示例——直接引入函数**：

```rust
use crate::front_of_house::hosting::add_to_waitlist;

pub fn eat_at_restaurant() {
    add_to_waitlist();  // 不清楚这个函数来自哪里
}
```

### 处理命名冲突

方式一：引入到父模块层级

```rust
use std::fmt;
use std::io;

fn function1() -> fmt::Result { Ok(()) }
fn function2() -> io::Result<()> { Ok(()) }
```

方式二：用 `as` 关键字取别名

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result { Ok(()) }
fn function2() -> IoResult<()> { Ok(()) }
```

### 用 `pub use` 重导出

`pub use` 不仅把路径引入当前作用域，还让外部代码也能通过当前模块路径访问它：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

pub use crate::front_of_house::hosting;
```

- **重导出前**：外部代码需写 `restaurant::front_of_house::hosting::add_to_waitlist()`
- **重导出后**：外部代码只需写 `restaurant::hosting::add_to_waitlist()`

> **精读提示**：`pub use` 是设计公有 API 的利器。它允许内部组织结构与对外暴露的 API 结构不同。你可以按实现逻辑组织模块，再通过 `pub use` 在 crate 根部提供扁平、直觉的 API 层次。标准库和很多流行 crate（如 `serde`）大量使用这一模式。

### 使用外部包

1. 在 `Cargo.toml` 中声明依赖：

```toml
[dependencies]
rand = "0.8.5"
```

2. 在代码中引入：

```rust
use rand::Rng;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
}
```

注意：标准库 `std` 不需要在 `Cargo.toml` 中声明（它随 Rust 一起分发），但仍需 `use` 引入：

```rust
use std::collections::HashMap;
```

### 嵌套路径（Nested Paths）

合并共同前缀的 `use` 语句，减少行数：

```rust
// 合并前
use std::cmp::Ordering;
use std::io;

// 合并后
use std::{cmp::Ordering, io};
```

当需要同时引入模块本身和其子条目时，用 `self`：

```rust
// 合并前
use std::io;
use std::io::Write;

// 合并后
use std::io::{self, Write};
```

### Glob 运算符 `*`

将路径下所有公有条目引入作用域：

```rust
use std::collections::*;
```

> **慎用 glob**：它会让"哪些名称在作用域中"变得不透明，增加调试和维护难度。常见的合理用途：测试代码中引入被测模块的所有内容（`use super::*;`），以及 prelude 模式。

---

## 7.5 将模块拆分到不同文件

> 原文：[Separating Modules into Different Files](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html)

当模块体量增大时，应将其拆分到独立文件中。关键原则：**模块树不变，文件位置变**。

### 拆分步骤

**第一步**：在 crate root 中将模块体替换为声明：

```rust
// src/lib.rs
mod front_of_house;  // 编译器去找 src/front_of_house.rs

pub use crate::front_of_house::hosting;

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

**第二步**：创建模块文件 `src/front_of_house.rs`：

```rust
pub mod hosting {
    pub fn add_to_waitlist() {}
}
```

**第三步**：进一步拆分子模块。将 `hosting` 也提取为独立文件：

`src/front_of_house.rs`（只保留声明）：

```rust
pub mod hosting;
```

`src/front_of_house/hosting.rs`（子模块文件）：

```rust
pub fn add_to_waitlist() {}
```

### 两种文件风格

| 风格 | 模块文件 | 子模块文件 | 备注 |
|------|----------|------------|------|
| **新风格（推荐）** | `src/front_of_house.rs` | `src/front_of_house/hosting.rs` | 清晰，文件名即模块名 |
| **旧风格（仍支持）** | `src/front_of_house/mod.rs` | `src/front_of_house/hosting/mod.rs` | 会导致大量 `mod.rs`，不易区分 |

> **注意**：同一模块不能同时使用两种风格（编译器会报错），但不同模块可以各自选择不同风格。

### 核心规则

- `mod` 声明只需出现一次（在模块树中的父模块里）。其他地方通过路径引用，而非再次 `mod`。
- `mod` 不是 `#include`——它声明模块并告诉编译器去哪里找代码，而非文本替换。
- 拆分文件不影响模块树结构和路径，调用代码无需任何改动。

> **精读提示**：理解"模块树与文件树是两棵不同的树"是关键。`mod` 声明建立的是模块树中的父子关系，文件位置只是编译器查找模块体的策略。你可以把整个模块树写在一个文件里（行内模块），也可以每个模块一个文件，模块树的逻辑结构不变。

---

## 小结

Rust 模块系统的设计哲学可以归纳为几个核心原则：

1. **默认私有，显式公开**：所有条目默认私有，通过 `pub` 逐层打开。这迫使开发者有意识地设计 API 边界，而非不经意地暴露内部实现。

2. **模块树与文件树解耦**：模块的逻辑层次由 `mod` 声明建立，文件布局只是存储策略。这给了开发者灵活性——小项目可以单文件多模块，大项目可以每模块一文件。

3. **约定优于配置**：`src/main.rs`、`src/lib.rs`、`src/bin/` 等约定让项目结构一目了然，减少样板配置。

4. **pub use 分离内部结构与公共 API**：内部可以按实现逻辑组织深层嵌套，对外则通过 `pub use` 提供扁平、友好的接口。这是 Rust 生态中高质量 crate 的标志性实践。

5. **路径系统类比文件系统**：`crate::` 对应 `/`，`super::` 对应 `../`，`self::` 对应 `./`。这种类比降低了学习门槛。

掌握本章内容后，你就具备了阅读和组织任意规模 Rust 项目的基础能力。后续章节的 `HashMap`、`Result`、trait 等都建立在这套模块系统之上。
