---
title: "第 15 章：智能指针"
description: Box、Deref trait、Drop trait、Rc、RefCell 和引用循环防范。
---

# 第 15 章：智能指针

> 原文：[Chapter 15: Smart Pointers](https://doc.rust-lang.org/book/ch15-00-smart-pointers.html)

## 本章要点

Rust 中最常见的指针是 **引用（reference）**，用 `&` 表示，只借用数据，没有额外开销。**智能指针（smart pointer）** 则是一种数据结构，既像指针一样持有内存地址，又携带额外的元数据和能力——最关键的区别在于，智能指针往往 **拥有（own）** 它所指向的数据，而引用只是借用。

`String` 和 `Vec<T>` 本质上也是智能指针：它们拥有一块内存并允许你操纵它。智能指针通常用 struct 实现，并实现两个核心 trait：

| Trait | 作用 |
|-------|------|
| `Deref` | 让智能指针实例可以像引用一样使用 `*` 解引用 |
| `Drop` | 自定义值离开作用域时的清理逻辑 |

本章覆盖标准库中最常用的智能指针：

| 类型 | 所有权模型 | 借用检查时机 | 线程安全 | 核心场景 |
|------|-----------|-------------|---------|---------|
| `Box<T>` | 单一所有权 | 编译期 | 是 | 堆分配、递归类型、trait object |
| `Rc<T>` | 多所有权（引用计数） | 编译期（只读） | 否（单线程） | 图/DAG 等共享数据结构 |
| `RefCell<T>` | 单一所有权 | **运行期** | 否（单线程） | 内部可变性、mock 测试 |
| `Weak<T>` | 非拥有引用 | — | 否（单线程） | 打破引用循环 |

**选型口诀**：能用 `Box` 不用 `Rc`，能用 `Rc` 不加 `RefCell`，需要可变共享时再组合 `Rc<RefCell<T>>`，跨线程则换 `Arc<Mutex<T>>`。

---

## 15.1 用 `Box<T>` 指向堆上的数据

> 原文：[Using Box\<T\> to Point to Data on the Heap](https://doc.rust-lang.org/book/ch15-01-box.html)

### 是什么

`Box<T>` 是最简单的智能指针——把数据放到堆上，栈上只留一个固定大小的指针。除了间接访问（indirection）和堆分配之外，没有额外性能开销。

```rust
fn main() {
    let b = Box::new(5);
    println!("b = {b}"); // b = 5
}
// b 离开作用域，堆上的 5 被自动释放
```

### 三大使用场景

1. **编译期大小未知的类型** —— 最典型的是递归类型（recursive type）。
2. **大数据转移所有权时避免拷贝** —— 只传指针，不深拷贝。
3. **Trait Object** —— `Box<dyn SomeTrait>` 持有实现了某 trait 的任意类型。

### 用 Box 实现递归类型：Cons List

函数式语言中经典的 cons list `(1, (2, (3, Nil)))` 在 Rust 中直接写会报错：

```rust
// 编译失败！
enum List {
    Cons(i32, List), // recursive without indirection
    Nil,
}
```

编译器无法计算 `List` 的大小，因为 `Cons` 嵌套了自身，形成无限递归。

**解决方案**：用 `Box<List>` 引入一层间接引用，指针大小固定，打破无限递归：

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use crate::List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));
}
```

**为什么 Box 能解决问题？** `Box<T>` 是一个指针，大小恒定（通常 8 字节），不管 `T` 有多大。所以编译器可以精确计算：

```
Cons 的大小 = sizeof(i32) + sizeof(Box<List>)  // 确定值
```

### 深度理解

- `Box<T>` 实现了 `Deref`，所以 `*box_val` 直接得到内部值。
- `Box<T>` 实现了 `Drop`，离开作用域时自动释放堆内存。
- `Box` 的 "零成本" 体现在：没有引用计数、没有运行时借用检查、没有额外元数据，只有一个裸指针 + 堆分配。

---

## 15.2 通过 Deref trait 将智能指针当作常规引用

> 原文：[Treating Smart Pointers Like Regular References with the Deref Trait](https://doc.rust-lang.org/book/ch15-02-deref.html)

### `*` 运算符的本质

```rust
fn main() {
    let x = 5;
    let y = &x;
    assert_eq!(5, *y); // 解引用，拿到 y 指向的值
}
```

`Box<T>` 也可以同样使用：

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);
    assert_eq!(5, *y); // Box 实现了 Deref，所以 * 生效
}
```

### 自定义智能指针实现 Deref

`Deref` trait 只需实现一个方法 `deref(&self) -> &Self::Target`：

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

fn main() {
    let x = 5;
    let y = MyBox::new(x);
    assert_eq!(5, *y); // 实际执行 *(y.deref())
}
```

**关键细节**：`deref` 返回的是 **引用** 而不是值本身。如果直接返回值，所有权会被移出，这违反了借用语义。编译器看到 `*y` 时实际展开为 `*(y.deref())`——先拿引用，再解引用。

### Deref Coercion（解引用强制转换）

这是 Rust 最优雅的人体工学设计之一。当函数参数类型不匹配但存在 Deref 链时，编译器会自动插入转换：

```rust
fn hello(name: &str) {
    println!("Hello, {name}!");
}

fn main() {
    let m = MyBox::new(String::from("Rust"));
    hello(&m); // MyBox<String> -> &String -> &str，自动完成！
}
```

**转换链**：`&MyBox<String>` → `&String`（通过 `MyBox` 的 `Deref`）→ `&str`（通过 `String` 的 `Deref`）。

如果没有 Deref Coercion，你需要这样写：

```rust
hello(&(*m)[..]); // 手动解引用 + 取切片，可读性极差
```

### Deref Coercion 的三条规则

| 转换方向 | 条件 |
|---------|------|
| `&T` → `&U` | `T: Deref<Target=U>` |
| `&mut T` → `&mut U` | `T: DerefMut<Target=U>` |
| `&mut T` → `&U` | `T: Deref<Target=U>`（可变降级为不可变） |

**注意**：`&T` **永远不会**自动转换为 `&mut U`，因为这违反了借用规则——不能从不可变引用凭空获得可变引用。

Deref Coercion 在编译期完成，**零运行时开销**。

---

## 15.3 用 Drop trait 运行清理代码

> 原文：[Running Code on Cleanup with the Drop Trait](https://doc.rust-lang.org/book/ch15-03-drop.html)

### Drop trait 基础

`Drop` trait 让你自定义值离开作用域时执行的清理逻辑——释放文件句柄、关闭网络连接、释放堆内存等。它在 prelude 中，无需手动导入。

```rust
struct CustomSmartPointer {
    data: String,
}

impl Drop for CustomSmartPointer {
    fn drop(&mut self) {
        println!("Dropping CustomSmartPointer with data `{}`!", self.data);
    }
}

fn main() {
    let c = CustomSmartPointer { data: String::from("my stuff") };
    let d = CustomSmartPointer { data: String::from("other stuff") };
    println!("CustomSmartPointers created.");
}
```

输出：

```
CustomSmartPointers created.
Dropping CustomSmartPointer with data `other stuff`!
Dropping CustomSmartPointer with data `my stuff`!
```

**变量按创建的逆序销毁**（栈的 LIFO 特性）：`d` 先于 `c` 被 drop。

### 不能手动调用 `drop` 方法

```rust
c.drop(); // 编译错误！explicit use of destructor method
```

如果允许手动调用，加上作用域结束时自动调用，就会造成 **double free**。

### 提前释放：`std::mem::drop`

有时你需要在作用域结束前提前释放资源（例如锁）。Rust 提供了 `std::mem::drop` 函数（也在 prelude 中）：

```rust
fn main() {
    let c = CustomSmartPointer { data: String::from("some data") };
    println!("CustomSmartPointer created.");
    drop(c); // 立即释放
    println!("CustomSmartPointer dropped before end of main.");
}
```

输出：

```
CustomSmartPointer created.
Dropping CustomSmartPointer with data `some data`!
CustomSmartPointer dropped before end of main.
```

### 深度理解

- `Drop` + 所有权系统确保每个值的清理代码 **恰好执行一次**，不多不少。
- `drop(c)` 本质上是取得 `c` 的所有权然后在函数结尾让它离开作用域——通过所有权转移实现了 "提前释放"。
- 对于智能指针来说，`Drop` 是 RAII（Resource Acquisition Is Initialization）的 Rust 实现。

---

## 15.4 `Rc<T>`：引用计数智能指针

> 原文：[Rc\<T\>, the Reference Counted Smart Pointer](https://doc.rust-lang.org/book/ch15-04-rc.html)

### 为什么需要多所有权

大多数场景下，一个值只有一个所有者。但在图结构、DAG 等数据结构中，一个节点可能被多条边指向——需要多个所有者共同持有。`Rc<T>`（Reference Counting）就是为这个场景设计的。

**类比**：客厅里的电视，第一个人进来打开，其他人也可以看。只有最后一个人离开时才关掉。如果有人在别人还在看的时候关了电视，就会引发 "投诉"。

### Box 无法共享所有权

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}

fn main() {
    let a = Cons(5, Box::new(Cons(10, Box::new(Nil))));
    let b = Cons(3, Box::new(a));
    let c = Cons(4, Box::new(a)); // 编译错误！a 已经被 move 到 b 中
}
```

### Rc 实现共享所有权

```rust
enum List {
    Cons(i32, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};
use std::rc::Rc;

fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    let b = Cons(3, Rc::clone(&a));  // 引用计数 +1
    let c = Cons(4, Rc::clone(&a));  // 引用计数 +1
}
```

`b` 和 `c` 共享了 `a` 的数据，`a` 没有被 move。

### `Rc::clone` vs `.clone()`

**惯例**：始终使用 `Rc::clone(&a)` 而非 `a.clone()`。

- `Rc::clone` 仅递增引用计数，O(1) 操作，几乎零开销。
- 大多数类型的 `.clone()` 做深拷贝，开销可能很大。
- 在代码审查时，`Rc::clone` 一眼就知道是增加引用计数，不会误解为深拷贝。

### 观察引用计数变化

```rust
fn main() {
    let a = Rc::new(Cons(5, Rc::new(Cons(10, Rc::new(Nil)))));
    println!("count after creating a = {}", Rc::strong_count(&a));       // 1

    let b = Cons(3, Rc::clone(&a));
    println!("count after creating b = {}", Rc::strong_count(&a));       // 2

    {
        let c = Cons(4, Rc::clone(&a));
        println!("count after creating c = {}", Rc::strong_count(&a));   // 3
    }

    println!("count after c goes out of scope = {}", Rc::strong_count(&a)); // 2
}
```

当计数降为 0 时，`Drop` 自动释放堆上的数据。

### 核心限制

1. **只允许不可变引用**：`Rc<T>` 只提供共享读取，不能通过它获得 `&mut T`。如果允许多个可变引用，就违反了借用规则，会导致数据竞争。
2. **仅限单线程**：`Rc` 的引用计数不是原子操作，多线程场景请使用 `Arc<T>`（Atomic Reference Counting）。

---

## 15.5 `RefCell<T>` 与内部可变性模式

> 原文：[RefCell\<T\> and the Interior Mutability Pattern](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html)

### 什么是内部可变性（Interior Mutability）

内部可变性是一种设计模式：即使你只有一个不可变引用，也能修改其内部数据。它在底层使用 `unsafe` 代码绕过编译器的借用检查，但对外暴露安全的 API。

**核心权衡**：

| 类型 | 所有权 | 借用检查 | 违规后果 |
|------|--------|---------|---------|
| `Box<T>` | 单一 | **编译期** | 编译错误（更安全，零运行时开销） |
| `Rc<T>` | 多个 | 编译期（只读） | 编译错误 |
| `RefCell<T>` | 单一 | **运行期** | panic!（灵活但有运行时开销） |

**什么时候用 RefCell？** 当你确信代码遵守借用规则，但编译器由于静态分析的保守性（涉及停机问题的本质限制）无法验证时。

### 运行时借用检查 API

| 方法 | 返回类型 | 等价于 |
|------|---------|--------|
| `borrow()` | `Ref<T>`（实现了 `Deref`） | `&T` |
| `borrow_mut()` | `RefMut<T>`（实现了 `Deref` + `DerefMut`） | `&mut T` |

`RefCell<T>` 在运行时追踪活跃的 `Ref<T>` 和 `RefMut<T>` 数量，执行与编译期相同的规则：任意多个不可变借用 **或者** 恰好一个可变借用。违反规则时，程序 panic。

```rust
// 运行时 panic 示例
let mut one = self.sent_messages.borrow_mut();
let mut two = self.sent_messages.borrow_mut(); // panic: already borrowed
```

### 实战场景：Mock Object 测试

假设有一个 trait 要求 `&self`（不可变引用）：

```rust
pub trait Messenger {
    fn send(&self, msg: &str);
}
```

你想写一个 mock 对象来记录发送的消息，但 `send` 的签名是 `&self`——你无法直接修改 `self` 的字段。

**RefCell 解决方案**：

```rust
use std::cell::RefCell;

struct MockMessenger {
    sent_messages: RefCell<Vec<String>>,
}

impl MockMessenger {
    fn new() -> MockMessenger {
        MockMessenger {
            sent_messages: RefCell::new(vec![]),
        }
    }
}

impl Messenger for MockMessenger {
    fn send(&self, message: &str) {
        // 通过 RefCell 的 borrow_mut() 在 &self 下修改内部数据
        self.sent_messages.borrow_mut().push(String::from(message));
    }
}

#[test]
fn it_sends_an_over_75_percent_warning_message() {
    let mock_messenger = MockMessenger::new();
    let mut limit_tracker = LimitTracker::new(&mock_messenger, 100);

    limit_tracker.set_value(80);

    assert_eq!(mock_messenger.sent_messages.borrow().len(), 1);
}
```

### 组合拳：`Rc<RefCell<T>>` —— 多所有权 + 可变性

单独的 `Rc<T>` 只能共享不可变数据，单独的 `RefCell<T>` 只能单一所有权。两者组合就能实现 **多个所有者共享可变数据**：

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(Rc<RefCell<i32>>, Rc<List>),
    Nil,
}

use crate::List::{Cons, Nil};

fn main() {
    let value = Rc::new(RefCell::new(5));

    let a = Rc::new(Cons(Rc::clone(&value), Rc::new(Nil)));
    let b = Cons(Rc::new(RefCell::new(3)), Rc::clone(&a));
    let c = Cons(Rc::new(RefCell::new(4)), Rc::clone(&a));

    *value.borrow_mut() += 10;

    println!("a after = {a:?}");  // Cons(RefCell { value: 15 }, Nil)
    println!("b after = {b:?}");  // Cons(RefCell { value: 3 }, Cons(RefCell { value: 15 }, Nil))
    println!("c after = {c:?}");  // Cons(RefCell { value: 4 }, Cons(RefCell { value: 15 }, Nil))
}
```

三个列表共享 `value`，通过 `borrow_mut()` 修改后，所有列表都看到更新后的值 15。

### 选型决策树

```
需要堆分配？
├── 是，且只有一个所有者
│   ├── 编译期可确定借用安全 → Box<T>
│   └── 编译期无法确定，需运行时检查 → RefCell<T>（或 Box<RefCell<T>>）
└── 是，且需要多个所有者
    ├── 只读共享 → Rc<T>
    └── 需要共享可变 → Rc<RefCell<T>>
```

---

## 15.6 引用循环与内存泄漏

> 原文：[Reference Cycles Can Leak Memory](https://doc.rust-lang.org/book/ch15-06-reference-cycles.html)

### Rust 能发生内存泄漏吗？

能。Rust 的安全保证防止的是 **未定义行为**（use-after-free、double free、数据竞争等），但 **内存泄漏在 Rust 中被视为内存安全的**。`Rc<T>` + `RefCell<T>` 组合可以构造引用循环，导致引用计数永远无法归零。

### 引用循环示例

```rust
use std::cell::RefCell;
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(i32, RefCell<Rc<List>>),
    Nil,
}

impl List {
    fn tail(&self) -> Option<&RefCell<Rc<List>>> {
        match self {
            Cons(_, item) => Some(item),
            Nil => None,
        }
    }
}

use crate::List::{Cons, Nil};

fn main() {
    let a = Rc::new(Cons(5, RefCell::new(Rc::new(Nil))));
    println!("a initial rc count = {}", Rc::strong_count(&a)); // 1

    let b = Rc::new(Cons(10, RefCell::new(Rc::clone(&a))));
    println!("a rc count after b creation = {}", Rc::strong_count(&a)); // 2
    println!("b initial rc count = {}", Rc::strong_count(&b)); // 1

    // 制造循环：a -> b -> a -> b -> ...
    if let Some(link) = a.tail() {
        *link.borrow_mut() = Rc::clone(&b);
    }

    println!("b rc count after changing a = {}", Rc::strong_count(&b)); // 2
    println!("a rc count after changing a = {}", Rc::strong_count(&a)); // 2

    // 如果取消注释下面这行，会因为无限循环打印而栈溢出
    // println!("a next item = {:?}", a.tail());
}
```

**泄漏机制**：

1. `a` 和 `b` 的强引用计数都是 2。
2. `b` 离开作用域 → 计数 2→1（`a` 仍引用 `b`）。
3. `a` 离开作用域 → 计数 2→1（`b` 仍引用 `a`）。
4. 两者计数都无法归零 → 永远不会被释放 → **内存泄漏**。

### 解决方案：`Weak<T>` 弱引用

| 引用类型 | 创建方式 | 影响计数 | 影响释放 |
|---------|---------|---------|---------|
| 强引用 `Rc<T>` | `Rc::clone(&x)` | `strong_count` +1 | 归零时释放 |
| 弱引用 `Weak<T>` | `Rc::downgrade(&x)` | `weak_count` +1 | **不影响释放** |

弱引用不拥有数据。使用前必须通过 `upgrade()` 尝试获取 `Option<Rc<T>>`——如果数据已被释放，返回 `None`。

```rust
let weak_ref = Rc::downgrade(&strong_ref);

match weak_ref.upgrade() {
    Some(rc) => { /* 数据还在 */ },
    None     => { /* 数据已释放 */ },
}
```

### 实战：树结构中用 Weak 避免循环

在树（tree）中，父节点拥有子节点，子节点需要引用父节点。如果子节点也用强引用持有父节点，就会形成循环。

**设计原则**：所有权关系用强引用（`Rc<T>`），非所有权关系用弱引用（`Weak<T>`）。

```rust
use std::cell::RefCell;
use std::rc::{Rc, Weak};

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,       // 子→父：弱引用，不拥有
    children: RefCell<Vec<Rc<Node>>>,   // 父→子：强引用，拥有
}

fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade()); // None

    let branch = Rc::new(Node {
        value: 5,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![Rc::clone(&leaf)]),
    });

    // 设置 leaf 的父节点为 branch（弱引用）
    *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade()); // Some(Node { value: 5, ... })
}
```

### 引用计数追踪

```rust
fn main() {
    let leaf = Rc::new(Node {
        value: 3,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    println!("leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf), Rc::weak_count(&leaf)); // 1, 0

    {
        let branch = Rc::new(Node {
            value: 5,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(vec![Rc::clone(&leaf)]),
        });

        *leaf.parent.borrow_mut() = Rc::downgrade(&branch);

        println!("branch strong = {}, weak = {}",
            Rc::strong_count(&branch), Rc::weak_count(&branch)); // 1, 1

        println!("leaf strong = {}, weak = {}",
            Rc::strong_count(&leaf), Rc::weak_count(&leaf)); // 2, 0
    }
    // branch 离开作用域，strong_count 归零 → 释放
    // leaf.parent 的 Weak 引用自动失效

    println!("leaf parent = {:?}", leaf.parent.borrow().upgrade()); // None
    println!("leaf strong = {}, weak = {}",
        Rc::strong_count(&leaf), Rc::weak_count(&leaf)); // 1, 0
}
```

| 时间点 | branch strong | branch weak | leaf strong | leaf weak |
|-------|--------------|-------------|-------------|-----------|
| leaf 创建后 | — | — | 1 | 0 |
| branch 创建后 | 1 | 1 | 2 | 0 |
| branch 离开作用域 | 0（释放） | — | 1 | 0 |

`branch` 的 `strong_count` 归零时立即释放，`weak_count` 不影响释放决策。`leaf.parent` 中的 `Weak` 引用自动失效，`upgrade()` 返回 `None`。

### 防范循环引用的最佳实践

1. **明确所有权方向**：用强引用表达 "拥有" 关系，弱引用表达 "引用" 关系。
2. **父→子用 `Rc`，子→父用 `Weak`**：这是树结构的标准模式。
3. **`upgrade()` 始终处理 `None`**：弱引用指向的数据随时可能已被释放。
4. **设计数据结构时消除循环**：尽量用 DAG 替代循环图。
5. **测试和代码审查**：Rust 编译器无法自动检测逻辑层面的引用循环。

---

## 小结

本章覆盖了 Rust 最核心的智能指针体系，它们是构建复杂数据结构的基石。

### 速查对比表

| 智能指针 | 所有权 | 可变性 | 借用检查 | 线程安全 | 典型用途 |
|---------|--------|--------|---------|---------|---------|
| `Box<T>` | 单一 | 与普通变量相同 | 编译期 | 是 | 堆分配、递归类型、trait object |
| `Rc<T>` | 多个（引用计数） | 不可变 | 编译期 | 否 | 单线程共享只读数据 |
| `RefCell<T>` | 单一 | 内部可变 | **运行期** | 否 | Mock 测试、编译器无法验证的借用 |
| `Rc<RefCell<T>>` | 多个 | 内部可变 | 运行期 | 否 | 多所有者共享可变数据 |
| `Weak<T>` | 非拥有 | — | — | 否 | 打破引用循环、缓存 |

### 多线程对应关系

| 单线程 | 多线程 |
|--------|--------|
| `Rc<T>` | `Arc<T>`（Atomic Reference Counting） |
| `RefCell<T>` | `Mutex<T>` / `RwLock<T>` |
| `Rc<RefCell<T>>` | `Arc<Mutex<T>>` |

### 核心思维模型

1. **所有权是第一性原则**：能用单一所有权（`Box`）就不引入引用计数（`Rc`）。
2. **编译期优于运行期**：能让编译器检查就不要推迟到运行时（`RefCell` 是最后手段）。
3. **强弱引用分离关注点**：强引用 = 所有权 = 生命周期控制；弱引用 = 观察 = 不干预生命周期。
4. **组合优于继承**：`Rc<RefCell<T>>` 是通过组合两个正交能力（多所有权 + 内部可变性）得到的，而非一个庞大的万能类型。
