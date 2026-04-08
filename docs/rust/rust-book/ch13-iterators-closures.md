---
title: "第 13 章：函数式语言特性：闭包与迭代器"
description: 闭包的捕获方式、Fn/FnMut/FnOnce 三种闭包 trait、迭代器 trait 和适配器、用迭代器改进 I/O 项目、性能对比与零开销抽象。
---

# 第 13 章：函数式语言特性：闭包与迭代器

> 原文：[Chapter 13: Functional Language Features](https://doc.rust-lang.org/book/ch13-00-functional-features.html)

## 本章要点

1. **闭包 (Closure)** 是能捕获定义时所在作用域变量的匿名函数，根据捕获方式自动实现 `Fn` / `FnMut` / `FnOnce` 三种 trait。
2. **迭代器 (Iterator)** 是惰性求值的序列处理抽象，只需实现 `next()` 即可获得标准库提供的几十种适配器方法。
3. 闭包 + 迭代器的组合是 Rust 最常用的函数式编程风格，能消除可变状态、提升可读性。
4. Rust 的迭代器属于 **零开销抽象 (zero-cost abstraction)**——编译后的机器码与手写循环几乎完全一致，甚至更快。

---

## 13.1 闭包：能捕获环境的匿名函数

> 原文：[Closures: Anonymous Functions that Capture Their Environment](https://doc.rust-lang.org/book/ch13-01-closures.html)

### 13.1.1 语法与类型推断

闭包的语法比函数更灵活，参数和返回值的类型注解都可以省略——编译器会根据首次调用进行推断，之后类型就被锁定：

```rust
// 四种等价写法，从最完整到最简洁
fn  add_one_v1   (x: u32) -> u32 { x + 1 }       // 普通函数
let add_one_v2 = |x: u32| -> u32 { x + 1 };      // 完整注解
let add_one_v3 = |x|             { x + 1 };       // 省略类型
let add_one_v4 = |x|               x + 1  ;       // 省略花括号
```

> **精读提示**：类型推断只在首次调用时完成。下面的代码会报错，因为第一次调用把 `x` 锁定为 `String`，第二次传 `i32` 就不兼容了：
>
> ```rust
> let example_closure = |x| x;
> let s = example_closure(String::from("hello"));
> let n = example_closure(5); // ERROR: expected `String`, found integer
> ```

### 13.1.2 三种捕获模式

闭包捕获外部变量的方式与函数参数的传递方式一一对应：

| 捕获方式 | 闭包 trait | 类比 | 特点 |
|----------|-----------|------|------|
| 不可变借用 `&T` | `Fn` | `fn f(x: &T)` | 可多次调用，不改变环境 |
| 可变借用 `&mut T` | `FnMut` | `fn f(x: &mut T)` | 可多次调用，会修改环境 |
| 转移所有权 `T` | `FnOnce` | `fn f(x: T)` | 只能调用一次（值被消耗） |

编译器会自动选择 **最小权限** 的捕获方式——能借用就不会转移所有权。

#### 不可变借用 —— 自动实现 `Fn`

```rust
fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let only_borrows = || println!("From closure: {list:?}");

    println!("Before calling closure: {list:?}"); // OK：不可变借用可以共存
    only_borrows();
    println!("After calling closure: {list:?}");
}
```

`list` 在闭包定义前后都可以正常使用，因为闭包只持有 `&list`。

#### 可变借用 —— 自动实现 `FnMut`

```rust
fn main() {
    let mut list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    let mut borrows_mutably = || list.push(7);

    // 注意：这里不能再使用 list，因为可变借用独占！
    // println!("{list:?}"); // ERROR
    borrows_mutably();
    println!("After calling closure: {list:?}"); // [1, 2, 3, 7]
}
```

> **精读提示**：闭包变量本身也需要声明为 `mut`，因为调用闭包会改变其内部状态（持有的可变引用）。在闭包定义和最后一次调用之间，`list` 不能被再次借用。

#### 转移所有权 —— `move` 关键字强制 `FnOnce`

```rust
use std::thread;

fn main() {
    let list = vec![1, 2, 3];
    println!("Before defining closure: {list:?}");

    thread::spawn(move || println!("From thread: {list:?}"))
        .join()
        .unwrap();
    // list 已被 move 进闭包，这里不能再使用
}
```

`move` 关键字强制闭包获取所有权。这在把闭包传给新线程时尤其必要——新线程可能比创建它的作用域活得更久，必须拥有数据才能保证安全。

### 13.1.3 深入 `Fn` / `FnMut` / `FnOnce` 三种 trait

这三个 trait 构成一个层级关系：

```text
FnOnce          ← 所有闭包都实现
  ↑ (超集)
FnMut           ← 不转移捕获值的闭包也实现
  ↑ (超集)
Fn              ← 不修改也不转移捕获值的闭包还实现
```

换言之：`Fn` 是 `FnMut` 的子 trait，`FnMut` 是 `FnOnce` 的子 trait。一个实现了 `Fn` 的闭包同时也满足 `FnMut` 和 `FnOnce` 约束。

#### `FnOnce` 实例——`Option::unwrap_or_else`

标准库的 `unwrap_or_else` 签名要求 `FnOnce`，因为闭包最多只会被调用一次：

```rust
impl<T> Option<T> {
    pub fn unwrap_or_else<F>(self, f: F) -> T
    where
        F: FnOnce() -> T
    {
        match self {
            Some(x) => x,
            None => f(),
        }
    }
}
```

#### `FnMut` 实例——`slice::sort_by_key`

`sort_by_key` 需要多次调用闭包（为每个元素提取排序键），因此要求 `FnMut`：

```rust
fn main() {
    let mut list = [
        Rectangle { width: 10, height: 1 },
        Rectangle { width: 3, height: 5 },
        Rectangle { width: 7, height: 12 },
    ];

    let mut num_sort_operations = 0;
    list.sort_by_key(|r| {
        num_sort_operations += 1; // 可变借用 num_sort_operations → FnMut
        r.width
    });
    println!("{list:#?}, sorted in {num_sort_operations} operations");
}
```

> **易错点**：如果在 `sort_by_key` 的闭包里把捕获的值 **move 出去**（例如 `sort_operations.push(value)`，其中 `value` 是 `String`），该闭包就只能实现 `FnOnce`，编译器会报错：
>
> ```text
> error[E0507]: cannot move out of `value`, a captured variable in an `FnMut` closure
> ```
>
> 解决办法：改为累加计数器（`+= 1`）等不转移所有权的操作。

#### `Fn` 实例——无副作用的纯计算

```rust
list.sort_by_key(|r| r.width); // 不捕获任何变量，自然满足 Fn
```

### 13.1.4 实际案例：T 恤赠送

一个综合闭包用法的小例子——`unwrap_or_else` 配合闭包提供默认值：

```rust
#[derive(Debug, PartialEq, Copy, Clone)]
enum ShirtColor { Red, Blue }

struct Inventory { shirts: Vec<ShirtColor> }

impl Inventory {
    fn giveaway(&self, user_preference: Option<ShirtColor>) -> ShirtColor {
        user_preference.unwrap_or_else(|| self.most_stocked())
        // 闭包捕获 &self（不可变借用），实现 Fn
    }

    fn most_stocked(&self) -> ShirtColor {
        let mut num_red = 0;
        let mut num_blue = 0;
        for color in &self.shirts {
            match color {
                ShirtColor::Red => num_red += 1,
                ShirtColor::Blue => num_blue += 1,
            }
        }
        if num_red > num_blue { ShirtColor::Red } else { ShirtColor::Blue }
    }
}
```

> **精读提示**：`unwrap_or_else` 的泛型约束是 `FnOnce() -> T`，但传入的闭包只做不可变借用，实际实现了更强的 `Fn`。Rust 的 trait 层级关系让这完全兼容。

---

## 13.2 使用迭代器处理序列

> 原文：[Processing a Series of Items with Iterators](https://doc.rust-lang.org/book/ch13-02-iterators.html)

### 13.2.1 迭代器是惰性的

```rust
let v1 = vec![1, 2, 3];
let v1_iter = v1.iter(); // 创建迭代器，但什么都不会发生
```

只有当你 **消费 (consume)** 迭代器时，它才会真正工作。

### 13.2.2 `Iterator` trait 与 `next()`

所有迭代器实现标准库中的 `Iterator` trait：

```rust
pub trait Iterator {
    type Item;                                    // 关联类型 (associated type)
    fn next(&mut self) -> Option<Self::Item>;     // 唯一必须实现的方法
    // ...几十个有默认实现的方法
}
```

- `next()` 每次返回 `Some(item)`，耗尽后返回 `None`。
- 调用 `next()` 会改变迭代器内部状态，因此迭代器变量必须是 `mut`。

```rust
#[test]
fn iterator_demonstration() {
    let v1 = vec![1, 2, 3];
    let mut v1_iter = v1.iter();

    assert_eq!(v1_iter.next(), Some(&1)); // 注意：iter() 产出 &T
    assert_eq!(v1_iter.next(), Some(&2));
    assert_eq!(v1_iter.next(), Some(&3));
    assert_eq!(v1_iter.next(), None);
}
```

> **三种创建迭代器的方法**：
>
> | 方法 | 产出类型 | 所有权 |
> |------|---------|--------|
> | `iter()` | `&T` | 不可变借用 |
> | `iter_mut()` | `&mut T` | 可变借用 |
> | `into_iter()` | `T` | 转移所有权 |

### 13.2.3 消费适配器 (Consuming Adaptors)

调用 `next()` 消耗元素的方法统称 **消费适配器**，调用后迭代器不可再用。

```rust
#[test]
fn iterator_sum() {
    let v1 = vec![1, 2, 3];
    let v1_iter = v1.iter();

    let total: i32 = v1_iter.sum(); // sum() 获取迭代器所有权
    assert_eq!(total, 6);
    // v1_iter 已被消费，不能再使用
}
```

常见消费适配器：`sum()`、`count()`、`last()`、`nth()`、`collect()`、`for_each()`、`any()`、`all()`、`find()`、`position()`、`max()`、`min()` 等。

### 13.2.4 迭代器适配器 (Iterator Adaptors)

迭代器适配器**不消费**原迭代器，而是返回一个新的迭代器。因为迭代器是惰性的，最终必须调用消费适配器才能触发计算。

```rust
let v1: Vec<i32> = vec![1, 2, 3];

// 仅创建适配器，不触发任何计算
v1.iter().map(|x| x + 1); // 警告：unused `Map` that must be used

// 正确用法：用 collect() 消费
let v2: Vec<_> = v1.iter().map(|x| x + 1).collect();
assert_eq!(v2, vec![2, 3, 4]);
```

### 13.2.5 闭包捕获环境——`filter()` 示例

`filter()` 是最常用的迭代器适配器之一，闭包返回 `true` 的元素被保留：

```rust
#[derive(PartialEq, Debug)]
struct Shoe {
    size: u32,
    style: String,
}

fn shoes_in_size(shoes: Vec<Shoe>, shoe_size: u32) -> Vec<Shoe> {
    shoes.into_iter()                          // 获取所有权
         .filter(|s| s.size == shoe_size)      // 闭包捕获 shoe_size
         .collect()
}
```

> **精读提示**：`into_iter()` 取得 `Vec<Shoe>` 的所有权，`filter()` 的闭包接收 `&&Shoe`（因为 `into_iter` 产出 `Shoe`，`filter` 再加一层引用）。最终 `collect()` 把满足条件的 `Shoe` 收集到新 `Vec` 中。这是 Rust 迭代器链的经典模式。

### 迭代器适配器链式调用要点

- 每个适配器都是惰性的，只有终端的消费适配器才真正驱动计算。
- 链式调用可读性高，每一步意图明确。
- 编译器能对整个链条做内联优化，消除中间分配。

---

## 13.3 改进 I/O 项目

> 原文：[Improving Our I/O Project](https://doc.rust-lang.org/book/ch13-03-improving-our-io-project.html)

### 13.3.1 用迭代器消除 `clone()`

原始版本：`Config::build` 接收 `&[String]`，需要 `clone()` 才能把值"拿出来"：

```rust
// 旧版：需要 clone
impl Config {
    fn build(args: &[String]) -> Result<Config, &'static str> {
        if args.len() < 3 {
            return Err("not enough arguments");
        }
        let query = args[1].clone();     // 不得已的克隆
        let file_path = args[2].clone(); // 不得已的克隆
        let ignore_case = env::var("IGNORE_CASE").is_ok();
        Ok(Config { query, file_path, ignore_case })
    }
}
```

改进方案：直接接收迭代器的所有权，用 `next()` 逐个取出值：

```rust
// 新版：零克隆
impl Config {
    fn build(
        mut args: impl Iterator<Item = String>,
    ) -> Result<Config, &'static str> {
        args.next(); // 跳过程序名（第一个参数）

        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };

        let file_path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file path"),
        };

        let ignore_case = env::var("IGNORE_CASE").is_ok();
        Ok(Config { query, file_path, ignore_case })
    }
}
```

调用方也更简洁——不再需要 `collect()` 成 `Vec`：

```rust
// 旧版
let args: Vec<String> = env::args().collect();
let config = Config::build(&args)?;

// 新版：直接传迭代器
let config = Config::build(env::args())?;
```

> **精读提示**：`impl Iterator<Item = String>` 使用了 `impl Trait` 语法（第 10 章），意味着"任何实现了 `Iterator<Item = String>` 的类型"。`env::args()` 返回的 `std::env::Args` 恰好满足条件。这消除了中间 `Vec` 分配，也消除了两次 `clone()`。

### 13.3.2 用 `filter()` 替代命令式循环

原始版本用 `for` 循环 + 可变 `Vec` 实现搜索：

```rust
// 旧版：命令式风格
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();
    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }
    results
}
```

用迭代器适配器改写：

```rust
// 新版：函数式风格
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents
        .lines()
        .filter(|line| line.contains(query))
        .collect()
}
```

同理，`search_case_insensitive` 也可以改写：

```rust
pub fn search_case_insensitive<'a>(
    query: &str,
    contents: &'a str,
) -> Vec<&'a str> {
    let query = query.to_lowercase();
    contents
        .lines()
        .filter(|line| line.to_lowercase().contains(&query))
        .collect()
}
```

> **精读提示**：函数式风格的优势不仅是更短——它消除了可变状态 (`mut results`)，让代码更容易推理和并行化。在 Rust 的所有权模型下，减少可变绑定就减少了潜在的借用冲突。

---

## 13.4 性能对比：循环 vs 迭代器

> 原文：[Comparing Performance: Loops vs. Iterators](https://doc.rust-lang.org/book/ch13-04-performance.html)

### 基准测试

用《福尔摩斯探案集》全文搜索 "the"，`for` 循环版本与迭代器版本的对比：

```text
test bench_search_for  ... bench:  19,620,300 ns/iter (+/- 915,700)
test bench_search_iter ... bench:  19,234,900 ns/iter (+/- 657,200)
```

**结论：两者性能几乎相同，迭代器版本甚至略快。**

### 零开销抽象 (Zero-Cost Abstraction)

Rust 的迭代器是 **零开销抽象** 的典范——高层抽象在编译后不引入额外运行时开销。这源自 C++ 之父 Bjarne Stroustrup 的零开销原则：

> "What you don't use, you don't pay for. And further: What you do use, you couldn't hand code any better."
>
> 你不用的东西，不需为之付出代价；你用了的东西，手写也写不出更好的。

编译器对迭代器链的优化包括：

1. **内联 (Inlining)**：整个迭代器链的 `next()` 调用被内联到调用点，消除函数调用开销。
2. **循环展开 (Loop Unrolling)**：编译器将循环体展开为多次重复，减少分支跳转。
3. **消除边界检查**：迭代器模式让编译器证明访问不越界，从而移除运行时检查。
4. **向量化 (Vectorization)**：展开后的代码可利用 SIMD 指令并行处理多个数据。

> **精读提示**：这是 Rust 最重要的设计哲学之一——**抽象不应有性能惩罚**。迭代器链编译后生成的汇编代码与手写的 `unsafe` 指针遍历几乎一模一样。这意味着你可以放心使用 `map`、`filter`、`fold` 等高阶函数，不必担心性能损失。这也是 Rust 能同时兼顾安全性和性能的关键所在。

---

## 小结

| 概念 | 要点 |
|------|------|
| **闭包语法** | `\|params\| body`，类型注解可省略，首次调用锁定类型 |
| **捕获模式** | 不可变借用 → `Fn`；可变借用 → `FnMut`；转移所有权 → `FnOnce` |
| **`move` 关键字** | 强制闭包获取捕获变量的所有权，跨线程必备 |
| **trait 层级** | `Fn` ⊂ `FnMut` ⊂ `FnOnce`，编译器自动选最小权限 |
| **Iterator trait** | 只需实现 `next() -> Option<Self::Item>` |
| **惰性求值** | 适配器只描述变换，消费适配器才触发执行 |
| **三种迭代器** | `iter()` → `&T`，`iter_mut()` → `&mut T`，`into_iter()` → `T` |
| **消费适配器** | `sum()`、`collect()`、`count()`、`for_each()` 等 |
| **迭代器适配器** | `map()`、`filter()`、`zip()`、`enumerate()`、`take()`、`skip()` 等 |
| **零开销抽象** | 迭代器链编译后与手写循环性能相同，甚至更快 |
| **实践准则** | 优先使用迭代器风格：更简洁、无可变状态、易并行化、无性能代价 |
