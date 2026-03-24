---
title: 集合、字符串与迭代器
description: 理解 Rust 中 String、&str、Vec、HashMap 与迭代器体系的常见用法、所有权边界和工程陷阱。
---

# 集合、字符串与迭代器

很多人以为 Rust 真正难的是生命周期，其实日常编码里更高频的问题往往出在：

- `String` 和 `&str` 到底怎么选
- 为什么 `iter()`、`iter_mut()`、`into_iter()` 总把所有权搞乱
- `Vec`、`HashMap` 修改时为什么老遇到借用冲突

这一页讲的是 Rust 里最常用的一层数据操作能力。

## `String` 和 `&str` 的分工

先记一句最实用的：

- `String`：拥有字符串数据
- `&str`：借用一段 UTF-8 字符串切片

### 参数设计上优先 `&str`

```rust
fn greet(name: &str) {
    println!("hello, {name}");
}
```

这样函数既能接 `String`，也能接字符串字面量：

```rust
let owned = String::from("rust");
greet(&owned);
greet("world");
```

### 返回值如果要脱离当前上下文，优先 `String`

```rust
fn build_name(first: &str, last: &str) -> String {
    format!("{first} {last}")
}
```

因为这里产生了新数据，让调用方拿 `String` 会更自然。

## 字符串不是按字符随机访问的数组

Rust 的字符串是 UTF-8 编码，所以不能把“第几个字节”直接等同于“第几个字符”。

下面这种写法不允许：

```rust
let s = String::from("你好");
// let ch = s[0];
```

如果你需要按“字符”处理，通常有几种方式：

- `chars()`
- `char_indices()`
- 明确知道自己在按字节处理时，用切片并保证边界合法

## `Vec<T>` 是最常用集合

### 基本使用

```rust
fn main() {
    let mut values = vec![1, 2, 3];
    values.push(4);
    println!("{values:?}");
}
```

### 读写冲突是最常见坑

```rust
let mut values = vec![1, 2, 3];
let first = &values[0];
values.push(4); // 可能触发重新分配
println!("{first}");
```

这个报错的本质不是 Rust 太严格，而是：

- `first` 借用了 `Vec` 里的元素
- `push` 可能让底层数组搬家
- 那之前的引用就可能失效

正确思路通常是：

1. 先把需要的值复制出来。
2. 缩小借用作用域。
3. 重新设计操作顺序。

## `HashMap<K, V>` 的高频边界

### 插入和读取

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("rust".to_string(), 100);

    if let Some(score) = scores.get("rust") {
        println!("{score}");
    }
}
```

### `entry` API 很重要

```rust
use std::collections::HashMap;

fn count_words(words: &[&str]) -> HashMap<String, usize> {
    let mut counts = HashMap::new();

    for word in words {
        *counts.entry((*word).to_string()).or_insert(0) += 1;
    }

    counts
}
```

`entry` 的价值在于：把“存在则修改，不存在则初始化”收敛成一套统一写法。

## 迭代器三兄弟一定要分清

### `iter()`

产生不可变借用迭代器。

```rust
let items = vec![1, 2, 3];
for item in items.iter() {
    println!("{item}");
}
```

### `iter_mut()`

产生可变借用迭代器。

```rust
let mut items = vec![1, 2, 3];
for item in items.iter_mut() {
    *item *= 2;
}
```

### `into_iter()`

消耗原集合，转移所有权。

```rust
let items = vec![1, 2, 3];
let doubled: Vec<i32> = items.into_iter().map(|n| n * 2).collect();
```

这三者几乎决定了后面代码还能不能继续使用原集合。

## `collect()` 不是魔法，它依赖目标类型

```rust
let nums = vec![1, 2, 3];
let strings: Vec<String> = nums.iter().map(|n| n.to_string()).collect();
```

`collect()` 需要知道“收集成什么类型”，所以很多时候要靠变量类型或 turbofish 指定：

```rust
let strings = nums.iter().map(|n| n.to_string()).collect::<Vec<_>>();
```

## 常见链式操作

```rust
fn even_squares(input: &[i32]) -> Vec<i32> {
    input
        .iter()
        .filter(|n| **n % 2 == 0)
        .map(|n| n * n)
        .collect()
}
```

这里要注意：

- `filter` 看到的是借用
- `map` 的输入类型受上一步影响
- 迭代器默认是惰性的，直到 `collect`、`sum`、`count` 等终止操作才真正执行

## 什么时候写 `for`，什么时候写 iterator 链

### 更适合 iterator 链的场景

- 明显的过滤、映射、聚合
- 不需要复杂控制流
- 变换过程是线性的

### 更适合 `for` 的场景

- 逻辑分支较多
- 需要中途提前退出
- 有复杂副作用

Rust 工程里不是“越链式越高级”，而是越清楚越好。

## 闭包和借用也会相互影响

例如：

```rust
let suffix = String::from("!");
let words = ["rust", "lang"];
let results: Vec<String> = words.iter().map(|w| format!("{w}{suffix}")).collect();
```

这里闭包借用了 `suffix`。如果你后面还想 move 它到别处，就要重新检查作用域和所有权关系。

## 工程建议

### 参数优先 `&str`、`&[T]`

这通常会让 API 更泛化，也更贴近借用模型。

### 尽量避免边借用集合元素边修改集合本体

这类代码最容易碰到借用冲突，也最容易掩盖底层重新分配风险。

### 先写清楚，再追求 iterator 风格

如果一条 iterator 链已经让类型推断和借用关系都很难读，就拆成多步。

## 自检

你至少应该能解释：

1. 为什么参数通常更适合 `&str` 而不是 `&String`？
2. 为什么 Rust 不能直接按索引读取字符串里的“字符”？
3. `iter()`、`iter_mut()`、`into_iter()` 各自如何影响所有权？
4. 为什么边持有 `Vec` 元素引用边 `push` 会出问题？
5. `entry` API 解决了什么常见模式？

这些问题打通后，Rust 日常开发会顺很多。
