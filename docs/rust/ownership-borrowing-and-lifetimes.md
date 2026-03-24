---
title: 所有权、借用与生命周期
description: 理解 Rust 最核心的资源模型，包括 move、Copy、Clone、借用规则、切片和生命周期标注。
---

# 所有权、借用与生命周期

Rust 学习曲线最陡的部分，基本都集中在这里。

你真正要掌握的不是几条语法规则，而是一套判断流程：

- 这个值归谁？
- 现在是读它、改它，还是把它交出去？
- 我返回的是值本身，还是某个值的引用？

## 先抓住三个结论

### 1. 一个值同一时刻只有一个所有者

大部分值在 Rust 里都有“唯一归属”。当所有权转移后，原变量默认失效。

```rust
fn main() {
    let s1 = String::from("rust");
    let s2 = s1;

    println!("{s2}");
    // println!("{s1}"); // 编译错误：s1 的所有权已经移动
}
```

`String` 持有堆内存，不适合隐式复制，所以赋值默认是 move。

### 2. 借用是“临时使用权”，不是所有权转移

如果只是想读取一个值，不想拿走所有权，就传引用：

```rust
fn print_len(s: &String) {
    println!("{}", s.len());
}

fn main() {
    let name = String::from("rust");
    print_len(&name);
    println!("{name}");
}
```

### 3. 生命周期标注通常是在描述“引用之间的关系”

生命周期不是让引用“活更久”，而是告诉编译器：返回值引用的有效期，不能超过输入引用里较短的那个。

```rust
fn longest<'a>(left: &'a str, right: &'a str) -> &'a str {
    if left.len() >= right.len() {
        left
    } else {
        right
    }
}
```

这里的 `'a` 不是创建了一个新寿命，而是在表达约束。

## move、Copy、Clone 怎么区分

| 概念 | 含义 | 常见类型 | 成本 |
| --- | --- | --- | --- |
| move | 转移所有权 | `String`、`Vec<T>`、大多数自定义结构体 | 通常不复制底层数据，只转移控制权 |
| `Copy` | 按位复制，复制后原值还能继续使用 | 整数、布尔、字符、固定大小简单组合类型 | 很低 |
| `Clone` | 显式深拷贝或自定义复制逻辑 | `String`、`Vec<T>`、`HashMap<K, V>` | 可能较高 |

看一个最常见的例子：

```rust
fn main() {
    let n1 = 42;
    let n2 = n1; // i32 实现了 Copy

    let s1 = String::from("hello");
    let s2 = s1.clone(); // 显式复制堆数据

    println!("{n1} {n2}");
    println!("{s2}");
}
```

工程上要避免两个极端：

- 一遇到报错就无脑 `clone`
- 明明应该返回拥有所有权的数据，却硬要返回引用

## 借用规则到底在限制什么

Rust 的核心借用规则可以压缩成一句话：

同一时刻，要么有任意多个只读引用，要么只有一个可写引用。

### 多个不可变借用可以同时存在

```rust
fn main() {
    let value = String::from("rust");
    let a = &value;
    let b = &value;

    println!("{a} {b}");
}
```

### 可变借用必须唯一

```rust
fn main() {
    let mut value = String::from("rust");
    let r = &mut value;
    r.push_str(" lang");
    println!("{r}");
}
```

下面这种写法会报错：

```rust
fn main() {
    let mut value = String::from("rust");
    let r1 = &value;
    let r2 = &mut value;

    println!("{r1} {r2}");
}
```

因为读和写重叠了。Rust 要保证：你在读一个值时，别人不能偷偷改它。

## 可变性到底属于谁

Rust 的“可变”不是对象天然属性，而是绑定和借用关系的一部分。

### 绑定本身要可变

```rust
let mut count = 0;
count += 1;
```

### 借用也要显式可变

```rust
fn append_suffix(s: &mut String) {
    s.push_str("-ok");
}
```

这和很多语言不同。Rust 不允许“看起来只是传了个引用，结果函数里把值改了”这种默认行为。

## 切片是最常见的借用形式

`&str` 是字符串切片，`&[T]` 是数组或 `Vec<T>` 的切片。它们都只是对已有数据的一段借用视图。

```rust
fn first_word(s: &str) -> &str {
    match s.find(' ') {
        Some(index) => &s[..index],
        None => s,
    }
}
```

这类设计很重要，因为它通常比“把整块数据复制一份再返回”更自然。

工程里常见选择：

- 参数优先写成 `&str`，而不是 `&String`
- 参数优先写成 `&[T]`，而不是 `&Vec<T>`

这样函数能接受的输入范围更广。

## 生命周期为什么老是卡人

很多人第一次接触生命周期，会误以为“需要手动管理对象寿命”。其实大多数情况下，Rust 会自动推断；你只会在“多个引用关系需要描述”时显式写标注。

### 最常见的场景：返回引用

```rust
fn pick_prefix<'a>(input: &'a str) -> &'a str {
    &input[..1]
}
```

返回值借用了 `input`，所以返回值不可能活得比 `input` 更久。

### 容易踩坑的场景：返回局部变量引用

```rust
fn bad_ref() -> &String {
    let s = String::from("bad");
    &s
}
```

这段代码一定不成立，因为 `s` 在函数结束时就被释放了。

修法通常是两种：

1. 直接返回拥有所有权的值。
2. 让调用方传入缓冲区或传入被借用的数据。

```rust
fn good_value() -> String {
    String::from("ok")
}
```

## 初学阶段尽量少在结构体里保存引用

下面这种结构体会迅速把问题带进生命周期：

```rust
struct UserView<'a> {
    name: &'a str,
}
```

这不是不能用，而是它要求你同时管理结构体实例和被引用数据的寿命关系。

初学或一般业务代码里，更常见的做法是：

- 直接持有 `String`
- 直接持有 `Vec<T>`
- 把结构体设计成拥有数据，而不是到处借数据

等你真的需要零拷贝或高性能视图对象时，再引入带引用的结构体。

## 常见报错的正确思路

如果你需要的是更系统的报错诊断顺序和修法模板，直接看：

- [Rust Borrow Checker 常见报错排障指南](./borrow-checker-troubleshooting-guide.md)

### 报错：borrow of moved value

优先检查：

1. 是不是发生了 move？
2. 这里应该借用还是复制？
3. 这个函数是不是没必要拿走所有权？

### 报错：cannot borrow as mutable because it is also borrowed as immutable

优先检查：

1. 读引用和写引用是不是作用域重叠了？
2. 能不能先把只读逻辑做完，再开始可变借用？
3. 能不能把读取结果提前保存成普通值？

### 报错：lifetime may not live long enough

优先检查：

1. 你是不是在返回局部变量的引用？
2. 你是不是把多个引用混在一起，返回关系没法推断？
3. 这里是否应该返回拥有所有权的数据，而不是引用？

## 工程上的实用建议

### 参数优先借用，返回值优先拥有

这是很多 Rust API 比较稳的默认设计：

- 入参尽量 `&str`、`&[T]`、`&Foo`
- 返回值如果会离开当前上下文，优先 `String`、`Vec<T>`、自定义拥有型结构体

### `clone` 不是原罪，但必须知道为什么 clone

下面几种场景 clone 往往是合理的：

- 跨线程传递时需要独立所有权
- 缓存数据时需要脱离原生命周期
- API 边界要求拥有数据

不合理的场景是：

- 你没理解所有权问题，只想先让编译通过

### 先缩小作用域，再处理复杂借用问题

有时不需要改类型设计，只需要减少借用重叠时间：

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    let first = data[0];
    data.push(4);

    println!("{first}");
}
```

把只读结果先拷出来，后面再改 `data`，问题就消失了。

## 自检

你至少应该能独立解释下面这些问题：

1. 为什么 `String` 赋值后默认会 move，而 `i32` 不会？
2. `&String` 和 `&str` 的设计差别是什么？
3. 为什么同一时间不能同时有可变借用和不可变借用？
4. 生命周期标注到底在表达什么关系？
5. 为什么很多函数“参数借用，返回拥有值”会更省心？
6. borrow checker 报错时，为什么应该先看所有权边界，再决定要不要 `clone`？

如果这些问题已经说得清楚，再去看 trait、泛型、并发和 async，会轻松很多。
