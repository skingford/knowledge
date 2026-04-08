---
title: "第 11 章：编写自动化测试"
description: 测试函数编写、运行测试的方式、测试组织——单元测试与集成测试。
---

# 第 11 章：编写自动化测试

> 原文：[Chapter 11: Writing Automated Tests](https://doc.rust-lang.org/book/ch11-00-testing.html)

## 本章要点

- Rust 的类型系统（type system）和借用检查器（borrow checker）能在编译期拦截大量错误，但无法验证**逻辑正确性**——这正是自动化测试的职责。
- 测试在 Rust 中是**一等公民**：标准工具链内置了测试框架，无需额外依赖。
- 本章覆盖三大主题：
  1. 如何编写测试——`#[test]`、断言宏（assertion macros）、`#[should_panic]`、`Result<T, E>` 测试。
  2. 如何控制测试运行——并行/串行、输出捕获、按名称过滤、`#[ignore]`。
  3. 测试组织——单元测试（unit tests）与集成测试（integration tests）的目录约定和最佳实践。

---

## 11.1 如何编写测试

> 原文：[How to Write Tests](https://doc.rust-lang.org/book/ch11-01-writing-tests.html)

### 11.1.1 测试函数的本质

测试函数遵循"三步走"模式（Arrange-Act-Assert）：

1. **准备**（Arrange）：构造所需数据或状态。
2. **执行**（Act）：调用被测代码。
3. **断言**（Assert）：验证结果符合预期。

在 Rust 里，只需要给函数加上 `#[test]` attribute，`cargo test` 就会自动发现并运行它们。Rust 会编译出一个专门的 **test runner binary**，逐一执行所有标注了 `#[test]` 的函数，并汇报通过/失败结果。

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

运行 `cargo test` 后的典型输出：

```
running 1 test
test tests::it_works ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

输出中各字段含义：

| 字段 | 说明 |
|------|------|
| `passed` | 通过的测试数 |
| `failed` | 失败的测试数 |
| `ignored` | 被 `#[ignore]` 标记而跳过的测试数 |
| `measured` | 基准测试（benchmark），仅 nightly 可用 |
| `filtered out` | 被命令行过滤掉的测试数 |

此外，`cargo test` 还会运行**文档测试**（Doc-tests），即 API 文档中的代码示例，确保文档与实现保持一致。

### 11.1.2 断言宏（Assertion Macros）

#### `assert!` —— 布尔断言

接受一个布尔表达式，为 `true` 时通过，为 `false` 时 panic 导致测试失败。

```rust
#[derive(PartialEq, Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }
}

#[test]
fn larger_can_hold_smaller() {
    let larger = Rectangle { width: 8, height: 7 };
    let smaller = Rectangle { width: 5, height: 1 };
    assert!(larger.can_hold(&smaller));
}

#[test]
fn smaller_cannot_hold_larger() {
    let larger = Rectangle { width: 8, height: 7 };
    let smaller = Rectangle { width: 5, height: 1 };
    assert!(!smaller.can_hold(&larger));
}
```

#### `assert_eq!` / `assert_ne!` —— 相等/不等断言

比 `assert!` 更好用的地方在于：**失败时会打印出左右两个值**，极大地方便调试。

```rust
pub fn add_two(a: u64) -> u64 {
    a + 2
}

#[test]
fn it_adds_two() {
    let result = add_two(2);
    assert_eq!(result, 4);
}
```

失败时的输出：

```
assertion `left == right` failed
  left: 5
 right: 4
```

> **关键约束**：被比较的类型必须实现 `PartialEq` 和 `Debug` trait。对于自定义 struct/enum，通常用 `#[derive(PartialEq, Debug)]` 即可。

`assert_eq!` 的参数叫 `left` 和 `right`，Rust 不区分哪个是"期望值"哪个是"实际值"——这与某些其他语言（如 JUnit 的 `assertEquals(expected, actual)`）不同。

#### 自定义失败消息

所有断言宏都支持在必选参数之后追加格式化字符串，语法与 `format!` 一致：

```rust
pub fn greeting(name: &str) -> String {
    format!("Hello {name}!")
}

#[test]
fn greeting_contains_name() {
    let result = greeting("Carol");
    assert!(
        result.contains("Carol"),
        "Greeting did not contain name, value was `{result}`"
    );
}
```

当断言失败时输出：

```
Greeting did not contain name, value was `Hello!`
```

自定义消息在测试矩阵或参数化场景中尤其有价值——能让你一眼看出**哪条路径**出了问题。

### 11.1.3 用 `#[should_panic]` 检测 panic

有些代码在非法输入时**应该** panic，`#[should_panic]` 正是为此设计：只要函数体内发生了 panic，测试就通过；反之失败。

```rust
pub struct Guess {
    value: i32,
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess value must be between 1 and 100, got {value}.");
        }
        Guess { value }
    }
}

#[test]
#[should_panic]
fn greater_than_100() {
    Guess::new(200);
}
```

#### `expected` 参数——精确匹配 panic 消息

裸 `#[should_panic]` 有一个问题：**任何** panic 都会让测试通过，包括你没预料到的 bug。加上 `expected` 可以要求 panic 消息**包含**指定子串：

```rust
impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 {
            panic!("Guess value must be greater than or equal to 1, got {value}.");
        } else if value > 100 {
            panic!("Guess value must be less than or equal to 100, got {value}.");
        }
        Guess { value }
    }
}

#[test]
#[should_panic(expected = "less than or equal to 100")]
fn greater_than_100() {
    Guess::new(200);
}
```

这样就能区分"上溢 panic"和"下溢 panic"，避免假阳性。`expected` 的值是**子串匹配**，不需要完整写出整条 panic 消息。

### 11.1.4 用 `Result<T, E>` 编写测试

除了让 panic 驱动失败，测试函数还可以返回 `Result<T, E>`：

```rust
#[test]
fn it_works() -> Result<(), String> {
    let result = add(2, 2);
    if result == 4 {
        Ok(())
    } else {
        Err(String::from("two plus two does not equal four"))
    }
}
```

**优势**：可以在测试体中使用 `?` 运算符，使得调用链中任何一步返回 `Err` 都能自动传播并导致测试失败，代码更简洁。

**限制**：返回 `Result` 的测试**不能**搭配 `#[should_panic]`。如果需要断言某个操作返回 `Err`，使用 `assert!(value.is_err())`。

> **选型建议**：
> - 需要验证 panic 行为 -> `#[should_panic]`
> - 需要链式 `?` 操作 -> `Result<T, E>` 返回值
> - 简单的值比较 -> `assert_eq!` / `assert_ne!`

---

## 11.2 控制测试运行方式

> 原文：[Controlling How Tests Are Run](https://doc.rust-lang.org/book/ch11-02-running-tests.html)

`cargo test` 编译出的测试二进制接受自己的命令行参数。`cargo test` 本身的参数和测试二进制的参数之间用 `--` 分隔：

```bash
cargo test --help            # cargo test 自身的选项
cargo test -- --help         # 测试二进制的选项
```

### 11.2.1 并行与串行

默认情况下测试**并行**运行（使用线程），速度更快但要求测试之间**无共享状态**（文件、环境变量、工作目录等）。

如果测试互相干扰，可以强制串行：

```bash
cargo test -- --test-threads=1
```

> **深度提示**：并行测试是 Rust 初学者常踩的坑。典型场景：多个测试读写同一个临时文件，并行时会出现竞态条件（race condition）。解决方案有三种：
> 1. `--test-threads=1` 强制串行（最简单，但最慢）。
> 2. 每个测试使用独立的临时目录（推荐，如 `tempfile` crate）。
> 3. 用 mutex 或文件锁做同步（复杂度最高）。

### 11.2.2 显示输出（stdout）

默认行为：通过的测试的 `println!` 输出会被**捕获并隐藏**；只有失败的测试才会在错误报告中展示其 stdout。

```rust
fn prints_and_returns_10(a: i32) -> i32 {
    println!("I got the value {a}");
    10
}

#[test]
fn this_test_will_pass() {
    let value = prints_and_returns_10(4);
    assert_eq!(value, 10);
}

#[test]
fn this_test_will_fail() {
    let value = prints_and_returns_10(8);
    assert_eq!(value, 5);
}
```

默认运行时你只会看到失败测试的 `I got the value 8`，而不会看到通过测试的 `I got the value 4`。

要查看所有测试的输出：

```bash
cargo test -- --show-output
```

### 11.2.3 按名称过滤测试

假设有三个测试函数：

```rust
#[test]
fn add_two_and_two() { assert_eq!(4, add_two(2)); }

#[test]
fn add_three_and_two() { assert_eq!(5, add_two(3)); }

#[test]
fn one_hundred() { assert_eq!(102, add_two(100)); }
```

#### 运行单个测试

```bash
cargo test one_hundred
# running 1 test
# test tests::one_hundred ... ok
# 2 filtered out
```

#### 模糊过滤

参数是子串匹配，会匹配**测试的完整路径**（包括模块名）：

```bash
cargo test add
# running 2 tests
# test tests::add_two_and_two ... ok
# test tests::add_three_and_two ... ok
# 1 filtered out
```

因为模块名也是路径的一部分，所以可以用模块名来过滤一整组测试：

```bash
cargo test tests::add    # 只运行 tests 模块中名字含 "add" 的测试
```

### 11.2.4 `#[ignore]` —— 忽略耗时测试

```rust
#[test]
#[ignore]
fn expensive_test() {
    // 运行耗时很长的代码...
}
```

| 命令 | 行为 |
|------|------|
| `cargo test` | 跳过 `#[ignore]` 测试 |
| `cargo test -- --ignored` | **只**运行被忽略的测试 |
| `cargo test -- --include-ignored` | 运行**全部**测试（包括被忽略的） |

> **实践建议**：把耗时测试标记为 `#[ignore]`，日常开发只跑快速测试，CI 流水线中用 `--include-ignored` 跑全量。

### 11.2.5 常用命令速查表

| 命令 | 用途 |
|------|------|
| `cargo test` | 并行运行全部测试 |
| `cargo test -- --test-threads=1` | 串行运行（避免竞态） |
| `cargo test -- --show-output` | 显示通过测试的 stdout |
| `cargo test <name>` | 运行名称匹配的测试 |
| `cargo test -- --ignored` | 只运行被忽略的测试 |
| `cargo test -- --include-ignored` | 运行全部测试（含 ignored） |
| `cargo test --test <file>` | 只运行指定集成测试文件 |

---

## 11.3 测试组织

> 原文：[Test Organization](https://doc.rust-lang.org/book/ch11-03-test-organization.html)

Rust 社区把测试分为两大类：

| 类型 | 位置 | 测试对象 | 能否访问私有接口 |
|------|------|----------|------------------|
| **单元测试**（Unit Tests） | `src/` 目录，与源码同文件 | 单个模块，隔离测试 | **能** |
| **集成测试**（Integration Tests） | 项目根目录下的 `tests/` 目录 | 公共 API，跨模块协作 | **不能** |

### 11.3.1 单元测试（Unit Tests）

#### `#[cfg(test)]` 的作用

单元测试放在与被测代码相同的 `.rs` 文件中，约定创建一个 `tests` 子模块并加上 `#[cfg(test)]`：

```rust
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}
```

`#[cfg(test)]` 是一个**条件编译**（conditional compilation）attribute：
- `cargo test` 时编译并运行。
- `cargo build` 时**完全跳过**，不会出现在最终产物中。

这意味着测试代码不会增大发布二进制的体积，也不会拖慢正常编译。

> **注意**：集成测试文件不需要 `#[cfg(test)]`，因为 Cargo 对 `tests/` 目录有专门处理——只在 `cargo test` 时才编译。

#### 测试私有函数

Rust 的模块可见性规则允许子模块访问父模块的所有项（包括私有的）。因此 `tests` 模块通过 `use super::*` 可以直接调用私有函数：

```rust
pub fn add_two(a: u64) -> u64 {
    internal_adder(a, 2)
}

fn internal_adder(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn internal() {
        let result = internal_adder(2, 2);
        assert_eq!(result, 4);
    }
}
```

> **哲学之争**：是否应该测试私有函数？社区观点不一。Rust 不强制你怎么做，但**允许**你这么做。如果某个私有函数逻辑复杂且关键，为它写单元测试是完全合理的。

### 11.3.2 集成测试（Integration Tests）

集成测试完全独立于你的 library——它们和外部消费者一样，只能使用 `pub` API。

#### 目录结构

```
my_project/
├── Cargo.lock
├── Cargo.toml
├── src/
│   └── lib.rs
└── tests/
    ├── common/
    │   └── mod.rs          # 共享辅助代码
    └── integration_test.rs  # 每个文件是一个独立 crate
```

#### 编写集成测试

```rust
// tests/integration_test.rs
use adder::add_two;

#[test]
fn it_adds_two() {
    let result = add_two(2);
    assert_eq!(result, 4);
}
```

关键区别：
1. **无需** `#[cfg(test)]`——`tests/` 目录下的文件只在 `cargo test` 时编译。
2. **必须** 用 `use` 导入库 crate 的公共接口。
3. `tests/` 下的**每个 `.rs` 文件**都被编译为一个**独立 crate**。

#### 运行集成测试

```bash
# 运行全部测试（单元 + 集成 + 文档）
cargo test

# 只运行某个集成测试文件
cargo test --test integration_test
```

`cargo test` 的输出分三个区段（section）：

1. **Unit tests** —— 来自 `src/` 内的 `#[test]`
2. **Integration tests** —— `tests/` 目录下每个文件各一节
3. **Doc-tests** —— 文档中的代码示例

如果某个区段内有测试失败，**后续区段不会运行**。

#### 共享辅助代码——`tests/common/mod.rs`

如果你在 `tests/` 下创建一个 `common.rs`，Cargo 会把它当作一个独立的测试 crate 编译并尝试运行，这不是你想要的。

正确做法是使用**子目录 + `mod.rs`** 的旧式模块命名约定：

```
tests/
├── common/
│   └── mod.rs      # 辅助函数，不会被当作测试文件
└── integration_test.rs
```

`tests/common/mod.rs`：

```rust
pub fn setup() {
    // 测试前的公共初始化逻辑
}
```

在集成测试中使用：

```rust
// tests/integration_test.rs
use adder::add_two;

mod common;

#[test]
fn it_adds_two() {
    common::setup();
    let result = add_two(2);
    assert_eq!(result, 4);
}
```

> **原理**：Cargo 只会把 `tests/` 下的**顶层** `.rs` 文件编译为测试 crate；子目录中的文件遵循普通模块规则，不会被独立编译。

#### 二进制 crate 的集成测试

如果项目只有 `src/main.rs` 而没有 `src/lib.rs`，则**无法编写集成测试**——因为集成测试需要通过 `use` 导入 library crate。

**最佳实践**：

```
my_project/
├── src/
│   ├── lib.rs    # 核心逻辑放在这里（可被 use 导入）
│   └── main.rs   # 薄薄的入口，调用 lib.rs
└── tests/
    └── ...       # 集成测试针对 lib.rs
```

`main.rs` 只负责组装和调用 `lib.rs` 的公共接口，逻辑尽量少，少到"一看就能确认正确"，无需专门测试。

---

## 小结

| 概念 | 关键点 |
|------|--------|
| `#[test]` | 标记测试函数，`cargo test` 自动发现并运行 |
| `assert!` / `assert_eq!` / `assert_ne!` | 三大断言宏，失败时 panic |
| 自定义消息 | 断言宏支持追加 `format!` 风格的格式化字符串 |
| `#[should_panic]` | 验证代码在预期情况下 panic；加 `expected` 匹配子串更安全 |
| `Result<T, E>` 测试 | 允许用 `?` 运算符简化错误传播，但不能与 `#[should_panic]` 共用 |
| 并行 vs 串行 | 默认并行；`--test-threads=1` 串行；注意共享状态的竞态问题 |
| 输出捕获 | 通过测试的 stdout 被隐藏；`--show-output` 显示全部 |
| 名称过滤 | `cargo test <substring>` 子串匹配测试路径 |
| `#[ignore]` | 跳过耗时测试；`--ignored` 只跑它们；`--include-ignored` 全跑 |
| 单元测试 | 与源码同文件，`#[cfg(test)] mod tests`，可测私有函数 |
| 集成测试 | `tests/` 目录，每个文件独立 crate，只能用公共 API |
| 辅助模块 | `tests/common/mod.rs` 避免被当作测试文件 |
| 二进制 crate | 无法写集成测试，应将逻辑放入 `lib.rs` |

**核心理念**：Rust 的测试系统与编译器深度集成——`#[cfg(test)]` 实现零成本条件编译，`cargo test` 统一驱动单元/集成/文档三类测试，类型系统保证断言宏的类型安全。写好测试是 Rust 工程实践中不可或缺的一环。
