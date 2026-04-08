---
title: "第 8 章：常用集合"
description: Vec、String 和 HashMap 三大集合类型的使用方式和所有权边界。
---

# 第 8 章：常用集合

> 原文：[Chapter 8: Common Collections](https://doc.rust-lang.org/book/ch08-00-common-collections.html)

Rust 标准库提供了一系列基于**堆（heap）**分配的数据结构，统称为**集合（collections）**。与编译期大小固定的数组和元组不同，集合的容量可以在运行时动态增减。本章聚焦三种最常用的集合：

| 类型 | 用途 | 底层存储 |
|------|------|----------|
| `Vec<T>` | 按序存储同类型值的可变长列表 | 连续堆内存 |
| `String` | UTF-8 编码的可增长文本 | 内部就是 `Vec<u8>` |
| `HashMap<K, V>` | 键值对映射 | 哈希表 |

---

## 本章要点

1. **所有权是集合操作的核心约束**：向集合插入值时会发生 move 或 copy；持有集合元素的引用时不能同时修改集合。
2. **String 不是 `Vec<char>`**：Rust 的 `String` 是 UTF-8 字节流，不支持按索引随机访问字符，这是有意为之的设计。
3. **HashMap 的 Entry API** 是"查找-插入"模式的惯用写法，比手动 `if-else` 更安全也更高效。
4. **借用检查器（borrow checker）在集合场景下尤为活跃**：理解"为什么持有元素引用时不能 push"是理解 Rust 内存安全的关键。

---

## 8.1 使用 Vec\<T\> 存储列表

> 原文：[Storing Lists of Values with Vectors](https://doc.rust-lang.org/book/ch08-01-vectors.html)

### 8.1.1 创建 Vector

**方式一：`Vec::new()`** -- 需要显式标注类型，因为没有初始值供推断。

```rust
let v: Vec<i32> = Vec::new();
```

**方式二：`vec!` 宏** -- 从字面量推断类型，更简洁，日常首选。

```rust
let v = vec![1, 2, 3]; // 推断为 Vec<i32>
```

### 8.1.2 更新 Vector

```rust
let mut v = Vec::new(); // mut 才能修改
v.push(5);
v.push(6);
v.push(7);
v.push(8);
// Rust 从 push 的值推断出 v 的类型为 Vec<i32>
```

> **注意**：必须声明为 `mut`，否则编译器拒绝任何修改操作。

### 8.1.3 读取元素：索引 vs. `get`

Rust 提供两种访问方式，它们的**错误处理策略截然不同**：

```rust
let v = vec![1, 2, 3, 4, 5];

// 方式 1：索引 -- 越界直接 panic
let third: &i32 = &v[2];
println!("The third element is {third}");

// 方式 2：get -- 越界返回 None，不会 panic
let third: Option<&i32> = v.get(2);
match third {
    Some(val) => println!("The third element is {val}"),
    None => println!("There is no third element."),
}
```

| 方式 | 返回类型 | 越界行为 | 适用场景 |
|------|----------|----------|----------|
| `&v[index]` | `&T` | **panic** | 越界意味着 bug，应尽早暴露 |
| `v.get(index)` | `Option<&T>` | 返回 `None` | 越界是正常业务逻辑（如用户输入索引） |

### 8.1.4 借用规则与 Vector（重点）

这是初学者最容易踩坑的地方：

```rust
let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];   // 不可变借用

v.push(6);            // 尝试可变借用 --> 编译错误！

println!("The first element is: {first}");
```

编译器报错：

```
error[E0502]: cannot borrow `v` as mutable because it is also borrowed as immutable
```

**为什么 push 会让已有引用失效？** 因为 `Vec` 内部是连续内存。当容量不足时，`push` 会重新分配更大的内存并复制所有元素，此时 `first` 指向的旧内存已被释放——这就是典型的**悬垂引用（dangling reference）**。Rust 的借用检查器在编译期就阻止了这种未定义行为。

> **深度理解**：即使当前容量足够不需要重新分配，编译器也会拒绝——因为它做的是**静态分析**，不会在编译期模拟运行时容量。这是"宁可误杀、不可放过"的安全哲学。

### 8.1.5 遍历 Vector

**不可变遍历：**

```rust
let v = vec![100, 32, 57];
for i in &v {
    println!("{i}");
}
```

**可变遍历：**

```rust
let mut v = vec![100, 32, 57];
for i in &mut v {
    *i += 50; // 必须用解引用运算符 * 来修改值
}
```

> 遍历期间，借用检查器同样禁止对 vector 进行插入或删除操作。

### 8.1.6 用 Enum 存储多类型数据

`Vec<T>` 要求所有元素类型相同。如果需要在一个 vector 中存储不同类型的数据，可以用 enum 包装：

```rust
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

所有变体都是 `SpreadsheetCell` 类型，因此满足 `Vec` 的同质性要求。配合 `match` 进行穷举处理，编译器会确保你不遗漏任何变体。

> 如果在编译期无法枚举所有可能的类型，可以使用 trait object（第 18 章）。

### 8.1.7 Vector 的 Drop

Vector 离开作用域时会被自动释放，其**所有元素**一并被 drop：

```rust
{
    let v = vec![1, 2, 3, 4];
    // 使用 v ...
} // <- v 离开作用域，内部整型值一同被清理
```

这对包含 `String` 等堆分配类型的 vector 尤为重要——每个元素的堆内存都会被正确释放。

---

## 8.2 使用 String 存储 UTF-8 文本

> 原文：[Storing UTF-8 Encoded Text with Strings](https://doc.rust-lang.org/book/ch08-02-strings.html)

String 是本章中最令初学者困惑的部分。Rust 在字符串处理上的"严格"源于对 UTF-8 正确性的坚持——很多其他语言掩盖了这一复杂性，导致 bug 在运行时才暴露。

### 8.2.1 String 与 &str 的区别（核心概念）

| 特性 | `String` | `&str` |
|------|----------|--------|
| 所有权 | **拥有**数据 | **借用**数据 |
| 可变性 | 可增长、可修改 | 不可变 |
| 存储位置 | 堆上（内部是 `Vec<u8>`） | 可指向堆、栈、甚至二进制的只读段 |
| 大小 | 运行时确定（胖指针：ptr + len + capacity） | 编译期或运行时（胖指针：ptr + len） |
| 编码 | UTF-8 | UTF-8 |

**关键洞察**：`String` 本质上是 `Vec<u8>` 的包装器（wrapper），附加了 UTF-8 合法性保证。字符串字面量 `"hello"` 的类型是 `&str`，它被硬编码在程序二进制中。

### 8.2.2 创建 String

```rust
// 空字符串
let mut s = String::new();

// 从字面量创建 -- 两种等价写法
let s = "initial contents".to_string();
let s = String::from("initial contents");

// 支持任何 UTF-8 文本
let hello = String::from("你好");
let hello = String::from("こんにちは");
let hello = String::from("Здравствуйте");
```

`String::from()` 和 `.to_string()` 功能完全相同，选择哪个纯属风格偏好。

### 8.2.3 更新 String

**追加字符串切片 -- `push_str(&str)`**

```rust
let mut s = String::from("foo");
s.push_str("bar"); // s = "foobar"
```

`push_str` 接受 `&str`（借用），**不获取所有权**：

```rust
let mut s1 = String::from("foo");
let s2 = "bar";
s1.push_str(s2);
println!("s2 is {s2}"); // s2 依然有效！
```

**追加单个字符 -- `push(char)`**

```rust
let mut s = String::from("lo");
s.push('l'); // s = "lol"
```

**拼接 -- `+` 运算符**

```rust
let s1 = String::from("Hello, ");
let s2 = String::from("world!");
let s3 = s1 + &s2; // 注意：s1 被 move 了，s2 被借用
```

`+` 运算符背后调用的方法签名类似于：

```rust
fn add(self, s: &str) -> String
```

- 第一个参数是 `self`（非引用），所以 `s1` 的所有权被转移，`s1` 之后不可用。
- 第二个参数是 `&str`，但我们传的是 `&String`——编译器会自动执行 **deref coercion**，将 `&String` 转为 `&str`。
- 返回的 `String` 实际上复用了 `s1` 的堆内存（追加 `s2` 的内容），因此效率高于"创建新字符串 + 复制两边"。

**多字符串拼接推荐用 `format!` 宏：**

```rust
let s1 = String::from("tic");
let s2 = String::from("tac");
let s3 = String::from("toe");

let s = format!("{s1}-{s2}-{s3}"); // "tic-tac-toe"
```

`format!` 只使用引用，**不夺取任何参数的所有权**，可读性也远胜连续的 `+`。

### 8.2.4 为什么 String 不支持索引（重点）

```rust
let s1 = String::from("hello");
let h = s1[0]; // 编译错误！
```

```
error[E0277]: the type `str` cannot be indexed by `{integer}`
```

**三层原因：**

**1. UTF-8 是变长编码**

```
"Hola"         --> 4 字节（每个拉丁字母 1 字节）
"Здравствуйте" --> 24 字节（每个西里尔字母 2 字节）
"你好"         --> 6 字节（每个汉字 3 字节）
```

`s[0]` 返回什么？第一个**字节**？第一个 **Unicode scalar value**？第一个**字素簇（grapheme cluster）**？三者可能完全不同。

**2. 看看西里尔字母的内存布局**

```rust
let hello = "Здравствуйте";
// 第一个字符 З 的 UTF-8 编码是 [208, 151]
// 如果 &hello[0] 返回 208，这是一个无效的字符——毫无意义
```

**3. 索引应当是 O(1)，但 UTF-8 字符串做不到**

因为每个字符长度不同，要找到第 n 个字符必须从头扫描，时间复杂度是 O(n)。Rust 拒绝给一个 O(n) 操作伪装成 O(1) 的 API。

### 8.2.5 字符串的三种视图

以印地语 "नमस्ते" 为例：

| 视图 | 内容 | 数量 |
|------|------|------|
| 字节（bytes） | `[224, 164, 168, 224, 164, 174, 224, 164, 184, 224, 165, 141, 224, 164, 164, 224, 165, 135]` | 18 |
| Unicode scalar values（chars） | `['न', 'म', 'स', '्', 'त', 'े']` | 6 |
| 字素簇（grapheme clusters） | `["न", "म", "स्", "ते"]` | 4 |

同一个字符串，三种视角给出完全不同的"长度"。Rust 不替你做选择，而是提供明确的 API 让你自己决定。

### 8.2.6 字符串切片（小心使用）

虽然不能索引，但可以用范围切片——前提是你**必须对齐字符边界**：

```rust
let hello = "Здравствуйте";
let s = &hello[0..4]; // "Зд" -- 每个西里尔字母 2 字节，4 字节 = 2 个字符
```

如果切在字符中间：

```rust
let s = &hello[0..1]; // panic!
// byte index 1 is not a char boundary;
// it is inside 'З' (bytes 0..2)
```

> **实践建议**：除非你明确知道字节边界，否则不要对 `String` 做范围切片。更安全的做法是用 `chars()` 或 `bytes()` 迭代。

### 8.2.7 遍历字符串

**按 Unicode scalar value 遍历 -- `chars()`**

```rust
for c in "Зд".chars() {
    println!("{c}");
}
// З
// д
```

**按字节遍历 -- `bytes()`**

```rust
for b in "Зд".bytes() {
    println!("{b}");
}
// 208
// 151
// 208
// 180
```

**按字素簇遍历**：标准库不提供，需要使用 crates.io 上的第三方库（如 `unicode-segmentation`）。

### 8.2.8 String 的所有权总结

```
                    +-----------+
  let s1 = "hello"; |  &str     |  --> 指向二进制只读段
                    +-----------+

  let s2 = String::from("hello");
                    +-----------+      +---+---+---+---+---+
                    |  String   | ---> | h | e | l | l | o |  堆上
                    | ptr       |      +---+---+---+---+---+
                    | len: 5    |
                    | cap: 5    |
                    +-----------+

  let s3: &str = &s2;  // s3 借用 s2 的堆数据，类型是 &str
```

- `String` -> `&str`：零成本（deref coercion），随时可借。
- `&str` -> `String`：需要堆分配 + 拷贝，用 `.to_string()` 或 `String::from()`。

---

## 8.3 使用 HashMap\<K, V\> 存储键值对

> 原文：[Storing Keys with Associated Values in Hash Maps](https://doc.rust-lang.org/book/ch08-03-hash-maps.html)

`HashMap<K, V>` 通过**哈希函数**将键映射到值，适合按键查找数据。在其他语言中也叫 hash、map、dictionary、associative array。

### 8.3.1 创建 HashMap

```rust
use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);
```

**注意事项：**
- `HashMap` 不在 prelude 中，需要 `use std::collections::HashMap`。
- 没有内置宏（不像 `vec!`）。
- 所有键必须同类型，所有值必须同类型。
- 数据存储在堆上。

### 8.3.2 访问值

```rust
let team_name = String::from("Blue");
let score = scores.get(&team_name).copied().unwrap_or(0);
```

调用链解析：
- `get(&key)` -> `Option<&V>` -- 键不存在返回 `None`
- `.copied()` -> `Option<V>` -- 将 `Option<&i32>` 转为 `Option<i32>`（拷贝内部值）
- `.unwrap_or(0)` -> `V` -- `None` 时返回默认值 0

**遍历：**

```rust
for (key, value) in &scores {
    println!("{key}: {value}");
}
```

> 遍历顺序是**不确定的**（哈希表本质）。

### 8.3.3 HashMap 与所有权（重点）

```rust
use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);

// field_name 和 field_value 在此处已失效！所有权已转移给 map
```

**所有权规则：**

| 类型特征 | 插入行为 | 示例类型 |
|----------|----------|----------|
| 实现了 `Copy` trait | **拷贝**进 map | `i32`, `f64`, `bool` |
| 未实现 `Copy` trait | **移动**进 map，原变量失效 | `String`, `Vec<T>` |
| 插入引用 | map 不拥有数据，引用必须在 map 有效期内保持有效 | `&str` |

> 如果你希望 HashMap 不夺走 `String` 的所有权，可以插入 `&str` 引用或者 `.clone()` 一份副本（但要注意生命周期约束）。

### 8.3.4 更新 HashMap

HashMap 的更新有三种常见模式：

**模式一：直接覆盖**

```rust
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Blue"), 25); // 覆盖旧值
println!("{scores:?}"); // {"Blue": 25}
```

**模式二：仅在键不存在时插入 -- Entry API**

```rust
scores.entry(String::from("Yellow")).or_insert(50);
scores.entry(String::from("Blue")).or_insert(50); // Blue 已存在，不覆盖

println!("{scores:?}"); // {"Yellow": 50, "Blue": 10}
```

`entry()` 返回 `Entry` 枚举，代表"可能存在也可能不存在的值"。`or_insert()` 在键不存在时插入默认值，并返回该值的**可变引用**。

**模式三：基于旧值更新 -- 经典的词频统计**

```rust
use std::collections::HashMap;

let text = "hello world wonderful world";
let mut map = HashMap::new();

for word in text.split_whitespace() {
    let count = map.entry(word).or_insert(0);
    *count += 1; // 解引用后 +1
}

println!("{map:?}"); // {"world": 2, "hello": 1, "wonderful": 1}
```

这段代码的精妙之处：
- `or_insert(0)` 返回 `&mut V`（可变引用）。
- 如果键已存在，返回的是已有值的可变引用；如果不存在，插入 0 后返回新值的可变引用。
- `*count += 1` 通过解引用直接修改 map 内部的值。
- 可变引用在每次循环迭代结束时离开作用域，因此不违反借用规则。

### 8.3.5 哈希函数

默认哈希算法是 **SipHash**，它能有效抵御哈希洪泛（HashDoS）攻击，但不是速度最快的算法。如果性能分析表明哈希函数是瓶颈，可以通过指定实现了 `BuildHasher` trait 的类型来切换哈希器。crates.io 上有多种替代实现可供选择。

---

## 小结

### 三大集合对比

| 维度 | `Vec<T>` | `String` | `HashMap<K, V>` |
|------|----------|----------|------------------|
| 底层结构 | 连续堆内存数组 | `Vec<u8>` + UTF-8 约束 | 哈希表 |
| 元素访问 | O(1) 索引 | **不支持索引** | O(1) 平均查找 |
| 增长策略 | 容量不足时 2x 扩容 | 同 Vec | 负载因子触发扩容 |
| 所有权 | 拥有所有元素 | 拥有字节数据 | 拥有所有键和值 |
| 需要 use | 不需要（prelude） | 不需要（prelude） | 需要 `use std::collections::HashMap` |

### 核心思维模型

1. **所有权优先**：向集合"放入"数据时，想清楚是 move 还是 copy。如果是 move，原变量就废了。
2. **借用 = 锁定**：持有集合元素的不可变引用期间，不能修改集合。这不是语言的缺陷，而是对内存安全的保障。
3. **String 的复杂性是特性，不是 bug**：Rust 迫使你在编译期面对 UTF-8 的复杂性，而非在运行时遇到乱码才发现问题。
4. **Entry API 是惯用法**：遇到"查找后可能插入"的场景，优先用 `entry().or_insert()`，而非先 `get()` 再 `insert()`。

### 练习题（来自原书）

1. 给定一个整数列表，用 vector 求中位数（median）和众数（mode）——HashMap 在求众数时很有用。
2. 将字符串转为 Pig Latin：辅音开头的单词把首辅音移到末尾加 "ay"（first -> irstfay）；元音开头的加 "hay"（apple -> applehay）。注意 UTF-8 编码细节。
3. 用 HashMap 和 Vec 构建一个文本界面的员工目录系统：支持 "Add Sally to Engineering" 这样的命令，能按部门或全公司查询并按字母序排列。
