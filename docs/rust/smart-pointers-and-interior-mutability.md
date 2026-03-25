---
title: 智能指针与内部可变性
description: 理解 Box、Rc、Arc、Cell、RefCell、Mutex、RwLock 等智能指针与内部可变性工具的职责边界。
---

# 智能指针与内部可变性

Rust 的默认规则是：

- 一个值有明确所有者
- 借用规则尽量在编译期检查
- 可变共享默认不成立

智能指针和内部可变性工具，就是在这套默认规则上提供更灵活的表达方式。

关键不是把它们背下来，而是搞清楚每种工具到底在“放宽哪一层限制”，以及代价是什么。

## 先记住一张图

| 类型 | 解决什么问题 | 代价/限制 |
| --- | --- | --- |
| `Box<T>` | 把数据放到堆上，获得稳定大小的拥有者 | 没有共享所有权 |
| `Rc<T>` | 单线程多所有者共享 | 不是线程安全 |
| `Arc<T>` | 多线程多所有者共享 | 原子计数有成本 |
| `Cell<T>` | 小型 `Copy` 值的内部可变性 | 适用面较窄 |
| `RefCell<T>` | 单线程运行时借用检查 | 借用冲突会 panic |
| `Mutex<T>` | 多线程互斥修改共享数据 | 可能阻塞、死锁 |
| `RwLock<T>` | 多读少写的共享状态 | 锁语义更复杂 |

## `Box<T>`：最基础的智能指针

### 典型用途

- 把大对象放到堆上
- 让递归类型拥有固定大小
- 明确表达“我拥有这块堆数据”

```rust
enum List {
    Cons(i32, Box<List>),
    Nil,
}
```

这里不用 `Box` 就不行，因为递归类型需要一个可确定大小的间接层。

## `Rc<T>`：单线程共享所有权

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("rust"));
    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    println!("{a} {b}");
}
```

`Rc` 解决的是“多个地方都需要持有同一份数据”的问题。

但它只适合单线程。跨线程要用 `Arc`。

## `Arc<T>`：跨线程共享所有权

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let shared = Arc::new(String::from("rust"));
    let cloned = Arc::clone(&shared);

    let handle = thread::spawn(move || {
        println!("{cloned}");
    });

    println!("{shared}");
    handle.join().unwrap();
}
```

`Arc` 只解决“共享所有权”，不自动解决“并发修改”。

如果多个线程都要改里面的数据，通常还需要再包锁。

## `RefCell<T>`：把借用检查推迟到运行时

```rust
use std::cell::RefCell;

fn main() {
    let value = RefCell::new(String::from("rust"));

    value.borrow_mut().push_str(" lang");
    println!("{}", value.borrow());
}
```

`RefCell` 的意义是：

- 编译期先允许你这么写
- 真正借用冲突时，在运行时检查并 panic

所以它适合：

- 单线程环境
- 某些测试替身、缓存、树结构或图结构
- 编译期难以表达但逻辑上能保证安全的场景

不适合当成“绕过 borrow checker 的通用后门”。

## 内部可变性的本质

所谓“内部可变性”，不是说 Rust 忽然允许乱改，而是：

- 外部接口看起来是不可变引用
- 内部通过受控机制实现修改

这在下面场景很常见：

- 缓存延迟初始化
- 统计信息计数器
- Mock 对象记录调用历史

## `Rc<RefCell<T>>`：单线程共享可变状态的常见组合

```rust
use std::cell::RefCell;
use std::rc::Rc;

fn main() {
    let shared = Rc::new(RefCell::new(0));
    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    *a.borrow_mut() += 1;
    *b.borrow_mut() += 2;

    println!("{}", shared.borrow());
}
```

这组组合很常见，但也意味着：

- 共享所有权
- 运行时借用检查
- 代码复杂度上升

如果能用明确的数据流替代，通常更好。

## `Mutex<T>`：跨线程共享可变状态

```rust
use std::sync::{Arc, Mutex};

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let cloned = Arc::clone(&counter);

    std::thread::spawn(move || {
        *cloned.lock().unwrap() += 1;
    })
    .join()
    .unwrap();

    println!("{}", *counter.lock().unwrap());
}
```

这里要分清：

- `Arc` 解决共享所有权
- `Mutex` 解决互斥访问

## `RwLock<T>`：读多写少时的替代

当读远多于写时，`RwLock` 能让多个读操作并发进行，而写操作独占。

但不要一上来就默认它比 `Mutex` 更好，因为：

- 锁策略更复杂
- 实际性能收益要看场景
- 容易引入更难排查的等待问题

## 什么时候该用哪种工具

### 优先级判断

1. 能不能直接拥有数据，不共享？
2. 能不能通过消息传递，而不是共享状态？
3. 共享是单线程还是多线程？
4. 共享后是否需要修改？
5. 修改是编译期可表达，还是需要运行时借用检查？

### 一个简化判断表

| 需求 | 更常见选择 |
| --- | --- |
| 只是把递归结构放到堆上 | `Box<T>` |
| 单线程共享只读数据 | `Rc<T>` |
| 多线程共享只读数据 | `Arc<T>` |
| 单线程共享且需要改 | `Rc<RefCell<T>>` |
| 多线程共享且需要改 | `Arc<Mutex<T>>` / `Arc<RwLock<T>>` |

## 常见误区

### 误区 1：借用报错就上 `RefCell`

这通常是在绕设计问题。优先看：

- 数据流是否能重构
- 作用域是否能缩小
- 是否其实应该返回拥有值

### 误区 2：跨线程共享默认 `Arc<Mutex<T>>`

如果本质是任务传递，channel 往往更清晰。

### 误区 3：`Rc::clone` / `Arc::clone` 等于深拷贝

不是。这里 clone 的通常是引用计数指针，而不是底层数据本身。

## 自检

你至少应该能回答：

1. `Box`、`Rc`、`Arc` 分别在解决什么问题？
2. `RefCell` 为什么只适合单线程？
3. `Rc<RefCell<T>>` 和 `Arc<Mutex<T>>` 的适用场景有什么根本区别？
4. 为什么内部可变性不是“可以随便改”？
5. 什么情况下应该先重构数据流，而不是立刻引入智能指针组合？

这些问题通了，Rust 里很多复杂结构就不再显得像“黑魔法”。
