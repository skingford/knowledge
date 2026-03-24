---
title: Rust 能力自检高频题示例代码片段
description: 作为 Rust 问题清单的配套代码页，聚焦最小、可讲解、可手写的示例，覆盖所有权、借用、迭代器、错误处理和 async。
search: false
---

# Rust 能力自检高频题示例代码片段

这页只做一件事：给 Rust 高频题配上**最小、可讲解、可手写**的代码片段。

它不重复承担“题目清单”和“主线总览”的职责。想先看题目或复习路径，请到：

- 自检导航：[Rust 能力自检与面试准备导航](./interview-prep.md)
- 问题清单：[Rust 必备问题清单](./essential-questions.md)
- 主线总览：[Rust 必备知识总览](./essential-knowledge.md)

## 怎么使用这页

- 准备手写代码：优先看这页
- 准备口述表达：先看问题清单，再回这页补最小例子
- 准备补专题：从这页跳回对应主题，不在这里展开长篇原理

## 快速索引

| 主题 | 代码片段 | 对应专题 |
| --- | --- | --- |
| 所有权基础 | move / `Copy` / `Clone` | `ownership-borrowing-and-lifetimes` |
| 借用规则 | 缩小借用作用域 | `ownership-borrowing-and-lifetimes` |
| 生命周期 | 返回引用 | `ownership-borrowing-and-lifetimes` |
| 类型系统 | trait bound + 泛型函数 | `traits-generics-and-pattern-matching` |
| 字符串边界 | `String` 到 `&str` | `collections-strings-and-iterators` |
| 迭代器 | `iter` / `iter_mut` / `into_iter` | `collections-strings-and-iterators` |
| 集合修改 | `HashMap::entry` | `collections-strings-and-iterators` |
| 错误处理 | `Result` + `?` | `error-handling-cargo-and-testing` |
| 共享状态 | `Rc<RefCell<T>>` 与 `Arc<Mutex<T>>` | `smart-pointers-and-interior-mutability` |
| Async | `tokio::spawn` 的所有权边界 | `tokio-and-async-practice` |

## 所有权与借用

### move、`Copy` 和 `Clone`

```rust
fn main() {
    let s1 = String::from("rust");
    let s2 = s1; // move
    // println!("{s1}"); // 编译错误：s1 已被移动

    let n1 = 42;
    let n2 = n1; // i32 实现了 Copy

    let s3 = s2.clone(); // 显式复制堆数据

    println!("{n1} {n2} {s2} {s3}");
}
```

讲解重点：

- `String` 这类拥有堆资源的类型默认发生 move
- `Copy` 类型赋值后原值还能继续用
- `Clone` 代表“我要付出复制成本”

### 缩小借用作用域

```rust
fn main() {
    let mut name = String::from("rust");

    {
        let view = &name;
        println!("{view}");
    } // 不可变借用在这里结束

    name.push_str(" language");
    println!("{name}");
}
```

讲解重点：

- 报借用冲突时，先看能不能缩小引用的作用域
- 很多问题不需要 `clone`，而是要重排代码顺序

### 返回引用时的生命周期关系

```rust
fn longer<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}

fn main() {
    let a = String::from("rust");
    let b = String::from("ownership");

    let result = longer(a.as_str(), b.as_str());
    println!("{result}");
}
```

讲解重点：

- 生命周期标注是在描述返回引用不能活得比输入更久
- 它不是“把引用延长到更长时间”

## 类型系统

### trait bound 和泛型函数

```rust
trait Summary {
    fn summary(&self) -> String;
}

struct Post {
    title: String,
}

impl Summary for Post {
    fn summary(&self) -> String {
        format!("post: {}", self.title)
    }
}

fn print_summary<T: Summary>(item: &T) {
    println!("{}", item.summary());
}

fn main() {
    let post = Post {
        title: "Rust trait".to_string(),
    };

    print_summary(&post);
}
```

讲解重点：

- 泛型只表示“类型可变”，trait bound 才表示“这个类型必须具备什么能力”
- `impl Summary for Post` 是把行为实现到具体类型上

## 字符串、集合与迭代器

### `String` 和 `&str` 的常见边界

```rust
fn greet(name: &str) -> String {
    format!("hello, {name}")
}

fn main() {
    let owned = String::from("rust");
    let msg = greet(&owned);

    println!("{msg}");
    println!("{owned}");
}
```

讲解重点：

- 参数优先借用，降低调用方成本
- 返回拥有所有权的数据，减少生命周期复杂度

### `iter()`、`iter_mut()`、`into_iter()`

```rust
fn main() {
    let nums = vec![1, 2, 3];
    for n in nums.iter() {
        println!("{n}");
    }

    let mut nums = vec![1, 2, 3];
    for n in nums.iter_mut() {
        *n *= 2;
    }

    let consumed: Vec<_> = nums.into_iter().map(|n| n + 1).collect();
    println!("{consumed:?}");
}
```

讲解重点：

- `iter()` 产生不可变借用
- `iter_mut()` 产生可变借用
- `into_iter()` 消耗集合并转移元素所有权

### `HashMap::entry`

```rust
use std::collections::HashMap;

fn main() {
    let words = ["rust", "go", "rust", "rust"];
    let mut counts = HashMap::new();

    for word in words {
        *counts.entry(word).or_insert(0) += 1;
    }

    println!("{counts:?}");
}
```

讲解重点：

- `entry` 把“存在则修改，不存在则初始化”收敛成一个入口
- 这比先 `get` 再 `insert` 更自然，也更少借用冲突

## 错误处理与共享状态

### `Result` + `?`

```rust
use std::num::ParseIntError;

fn parse_port(raw: &str) -> Result<u16, ParseIntError> {
    let port = raw.trim().parse::<u16>()?;
    Ok(port)
}

fn main() {
    let port = parse_port("8080").unwrap();
    println!("{port}");
}
```

讲解重点：

- `?` 会在出错时提前返回
- 它不是吞掉错误，而是把错误按函数返回类型往上传递

### `Rc<RefCell<T>>`：单线程共享可变状态

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let counter = Rc::new(RefCell::new(0));

    let a = Rc::clone(&counter);
    let b = Rc::clone(&counter);

    *a.borrow_mut() += 1;
    *b.borrow_mut() += 1;

    println!("{}", counter.borrow());
}
```

讲解重点：

- `Rc` 解决单线程共享所有权
- `RefCell` 用运行时借用检查换取内部可变性
- 这套组合不适合跨线程

### `Arc<Mutex<T>>`：多线程共享状态

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for _ in 0..2 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut value = counter.lock().unwrap();
            *value += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", *counter.lock().unwrap());
}
```

讲解重点：

- `Arc` 负责跨线程共享所有权
- `Mutex` 负责共享可变状态的同步
- 它能解决问题，但也引入锁竞争和阻塞代价

## Async 与 Tokio

### `tokio::spawn` 的所有权边界

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let worker_name = String::from("sync-cache");

    let handle = task::spawn(async move {
        println!("running: {worker_name}");
    });

    handle.await.unwrap();
}
```

讲解重点：

- 被 `spawn` 的任务可能比当前作用域活得更久
- 所以传给任务的数据通常要直接拥有所有权
- 这和线程里的 `move` 闭包是同一类边界问题

## 面试时怎么讲这些代码

看到一道代码题，建议按下面顺序讲：

1. 先说这段代码的所有权和借用关系
2. 再说编译器为什么允许或拒绝它
3. 最后补一句更适合落地项目的写法

如果你能把这页的例子都讲到“代码行为 + 原理 + 代价 + 适用场景”，Rust 面试里的大部分基础追问就很难把你打乱。
