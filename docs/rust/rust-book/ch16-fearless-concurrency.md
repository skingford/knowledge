---
title: "第 16 章：无畏并发"
description: 线程创建、消息传递、共享状态 Mutex、Send 和 Sync trait。
---

# 第 16 章：无畏并发

> 原文：[Chapter 16: Fearless Concurrency](https://doc.rust-lang.org/book/ch16-00-concurrency.html)

## 本章要点

- Rust 的**所有权系统（ownership system）**和**类型系统（type system）**将大量并发错误从运行时提前到了**编译期**，这就是 "fearless concurrency" 的核心含义
- Rust 标准库使用 **1:1 线程模型**（一个语言线程对应一个操作系统线程），通过 `thread::spawn` 创建线程，`JoinHandle::join` 等待线程结束
- **消息传递（message passing）**通过 `mpsc::channel` 实现，遵循 "通过通信来共享内存" 的理念；发送端可以 `clone` 实现多生产者
- **共享状态（shared state）**通过 `Arc<Mutex<T>>` 实现——`Mutex<T>` 提供互斥访问，`Arc<T>` 提供线程安全的引用计数
- `Send` trait 标记类型的**所有权**可以在线程间转移；`Sync` trait 标记类型的**引用**可以在线程间共享。二者由编译器自动推导，手动实现需要 `unsafe`
- Rust **无法在编译期防止死锁（deadlock）**，但能在编译期防止**数据竞争（data race）**——这是区分两者的关键

---

## 16.1 使用线程同时运行代码

> 原文：[Using Threads to Run Code Simultaneously](https://doc.rust-lang.org/book/ch16-01-threads.html)

### 线程模型：1:1

Rust 标准库采用 **1:1 模型**：每个 `thread::spawn` 调用都会创建一个真正的操作系统线程。这与 Go 的 M:N 模型（goroutine）或 Erlang 的轻量级进程不同。Rust 选择 1:1 是因为它的运行时开销最小，符合 Rust "零成本抽象" 的设计哲学。

> **深度理解：** 1:1 模型意味着线程切换由操作系统内核调度，创建和销毁成本较高（栈分配、系统调用）。如果需要大量轻量级任务，应使用异步运行时（如 Tokio）而非裸线程。

### 创建线程：`thread::spawn`

```rust
use std::thread;
use std::time::Duration;

fn main() {
    thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }
}
```

**关键行为：** 主线程结束时，所有子线程都会被强制终止，无论是否执行完毕。因此上面的子线程大概率无法打印到 `9`。输出顺序每次运行都可能不同，因为线程调度由操作系统决定。

### 等待线程完成：`JoinHandle::join`

`thread::spawn` 返回 `JoinHandle<T>`，调用其 `.join()` 方法会**阻塞当前线程**，直到目标线程运行结束。

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap(); // 主线程在此阻塞，等待子线程完成
}
```

`join()` 的调用位置至关重要。如果把 `handle.join().unwrap()` 放在主线程循环**之前**，就会先等子线程全部执行完再运行主线程循环，失去并发效果：

```rust
fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    handle.join().unwrap(); // 这里先等子线程跑完...

    for i in 1..5 {
        println!("hi number {i} from the main thread!"); // ...再跑主线程
    }
}
```

### `move` 闭包：转移所有权到线程

当闭包需要使用外部变量时，必须使用 `move` 关键字将所有权转移给线程闭包。这是 Rust **编译期防止数据竞争**的第一道防线。

**不加 `move` 会怎样？**

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(|| {
        println!("Here's a vector: {v:?}");
    });

    handle.join().unwrap();
}
```

编译器报错：

```
error[E0373]: closure may outlive the current function, but it borrows `v`
```

**原因分析：** Rust 无法保证子线程的生命周期短于 `v`。如果主线程在子线程使用 `v` 之前就 `drop` 了它，就会产生悬垂引用（dangling reference）。编译器拒绝编译这种代码。

**正确写法——使用 `move`：**

```rust
use std::thread;

fn main() {
    let v = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        println!("Here's a vector: {v:?}");
    });

    // drop(v); // 编译错误：v 已经被 move 进闭包了
    handle.join().unwrap();
}
```

`move` 之后，`v` 的所有权转移给了闭包，主线程不再拥有 `v`。如果在 `move` 之后尝试使用 `v`（例如 `drop(v)`），编译器会报 `use of moved value` 错误。

> **编译期安全保证：** Rust 通过所有权转移（move semantics）确保同一时刻只有一个线程拥有数据，从根本上消除了数据竞争的可能性。这不是运行时检查，而是编译期保证。

---

## 16.2 使用消息传递在线程间传输数据

> 原文：[Using Message Passing to Transfer Data Between Threads](https://doc.rust-lang.org/book/ch16-02-message-passing.html)

### 核心理念

> "Do not communicate by sharing memory; instead, share memory by communicating."
> —— Go 语言格言

消息传递的核心思想：线程之间不共享内存，而是通过发送消息来交换数据。Rust 通过 **channel（通道）** 实现这一模式。

### Channel 的基本结构

一个 channel 由两部分组成：

| 组件 | 类型 | 角色 |
|------|------|------|
| 发送端 Transmitter（tx） | `Sender<T>` | 上游，往通道里发数据 |
| 接收端 Receiver（rx） | `Receiver<T>` | 下游，从通道里收数据 |

**MPSC** = Multiple Producer, Single Consumer（多生产者，单消费者）。即可以有多个发送端，但只有一个接收端。

当发送端或接收端任何一个被 `drop`，channel 就关闭了。

### 基本用法

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

接收端有两个方法：

- **`recv()`**：阻塞当前线程，直到收到消息。返回 `Result<T, RecvError>`；当所有发送端都被 drop 后返回 `Err`
- **`try_recv()`**：非阻塞，立即返回。有消息返回 `Ok(T)`，没消息返回 `Err`。适合线程还有其他工作要做的场景（可以在循环中反复调用）

### 所有权转移：编译期安全的关键

`send()` 会**转移**值的所有权。发送后不能再使用该值：

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let val = String::from("hi");
        tx.send(val).unwrap();
        // println!("val is {val}"); // 编译错误！val 已经被 move 了
    });

    let received = rx.recv().unwrap();
    println!("Got: {received}");
}
```

> **深度理解：** 这是 Rust 防止数据竞争的第二道防线。`send` 转移了所有权，发送线程不再持有数据，接收线程成为唯一所有者。这在编译期保证了不会有两个线程同时访问同一数据——根本不需要锁。

### 发送多个值 & 迭代器模式

`Receiver<T>` 实现了 `Iterator` trait，可以直接用 `for` 循环接收，直到 channel 关闭（所有发送端被 drop）：

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];

        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
        // tx 在此被 drop，channel 关闭
    });

    for received in rx {  // 迭代器模式：channel 关闭后循环自动结束
        println!("Got: {received}");
    }
}
```

输出（每行间隔 1 秒）：

```
Got: hi
Got: from
Got: the
Got: thread
```

### 多生产者（Multiple Producers）

通过 `clone` 发送端来创建多个生产者：

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    let tx1 = tx.clone(); // 克隆出第二个发送端
    thread::spawn(move || {
        let vals = vec![
            String::from("hi"),
            String::from("from"),
            String::from("the"),
            String::from("thread"),
        ];
        for val in vals {
            tx1.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    thread::spawn(move || {
        let vals = vec![
            String::from("more"),
            String::from("messages"),
            String::from("for"),
            String::from("you"),
        ];
        for val in vals {
            tx.send(val).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    // 只有当 tx 和 tx1 都被 drop 后，迭代才会结束
    for received in rx {
        println!("Got: {received}");
    }
}
```

输出顺序不确定，取决于操作系统的线程调度。两个线程的消息会交错出现。

---

## 16.3 共享状态并发

> 原文：[Shared-State Concurrency](https://doc.rust-lang.org/book/ch16-03-shared-state.html)

### 从消息传递到共享内存

消息传递是 "通过通信来共享"，而共享状态则是 "通过共享来通信"。共享内存就像多所有权——多个线程同时访问同一块内存。Rust 通过 `Mutex<T>` 和 `Arc<T>` 的组合来安全地实现这一模式。

### Mutex（互斥锁）的工作原理

**Mutex** = Mutual Exclusion（互斥）。核心规则：

1. 使用数据前**必须获取锁**（`lock()`）
2. 使用完毕后**必须释放锁**

> **类比：** 会议中只有一个麦克风。要发言必须先请求使用麦克风，发言结束后必须归还，让其他人使用。

### 单线程中的 `Mutex<T>`

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5);

    {
        let mut num = m.lock().unwrap();
        *num = 6;
    } // MutexGuard 在此被 drop，锁自动释放

    println!("m = {m:?}");  // 输出：m = Mutex { data: 6, .. }
}
```

**API 要点：**

- `Mutex::new(value)` 创建互斥锁，包裹要保护的数据
- `m.lock()` 获取锁，返回 `LockResult<MutexGuard<T>>`。如果持有锁的线程 panic 了，`lock()` 返回 `Err`（锁中毒 / poisoned lock）
- `MutexGuard<T>` 实现了 `Deref`，可以像操作 `&mut T` 一样操作内部数据
- `MutexGuard<T>` 实现了 `Drop`，离开作用域时自动释放锁——**不会忘记解锁**

> **编译期安全保证：** `Mutex<i32>` 内部的 `i32` **无法直接访问**。类型系统强制你必须先调用 `lock()` 获取 `MutexGuard`，才能访问数据。编译器在类型层面就保证了 "先加锁再访问" 的规则。

### 多线程共享 Mutex——问题演进

**第一次尝试：直接 `move`（失败）**

```rust
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Mutex::new(0);
    let mut handles = vec![];

    for _ in 0..10 {
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

```
error[E0382]: borrow of moved value: `counter`
```

**问题：** `counter` 在第一次循环迭代中被 `move` 进了闭包，第二次循环时它已经不存在了。我们需要多个线程共同拥有 `counter`——这需要多所有权。

**第二次尝试：用 `Rc<T>`（还是失败）**

```rust
use std::rc::Rc;
use std::sync::Mutex;
use std::thread;

fn main() {
    let counter = Rc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Rc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

```
error[E0277]: `Rc<Mutex<i32>>` cannot be sent between threads safely
   = help: the trait `Send` is not implemented for `Rc<Mutex<i32>>`
```

**问题：** `Rc<T>` 的引用计数操作**不是原子的**。多线程同时修改引用计数会导致计数错误，进而引发内存泄漏或提前释放。编译器通过 `Send` trait 在编译期拦截了这个错误。

> **深度理解：** 这里体现了 Rust 类型系统的精妙。`Rc<T>` 没有实现 `Send` trait，而 `thread::spawn` 要求闭包捕获的所有值都是 `Send` 的。编译器自动检查这个约束，不需要任何运行时开销。

### 正确方案：`Arc<T>`（Atomic Reference Counted）

**`Arc<T>`** 是 `Rc<T>` 的线程安全版本。"A" 代表 **Atomic**（原子操作）。它使用原子操作来增减引用计数，保证多线程下的正确性。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap());
}
```

输出：`Result: 10`

> **为什么不默认全用 `Arc<T>`？** 原子操作有性能开销。单线程场景下用 `Rc<T>` 更快。Rust 让你自己选择是否需要线程安全的性能代价——这是零成本抽象哲学的体现。

### `RefCell<T>`/`Rc<T>` vs `Mutex<T>`/`Arc<T>` 对照

| 特性 | 单线程版 | 多线程版 |
|------|---------|---------|
| 内部可变性（interior mutability） | `RefCell<T>` | `Mutex<T>` |
| 共享所有权（shared ownership） | `Rc<T>` | `Arc<T>` |
| 借用检查时机 | 运行时（panic） | 运行时（阻塞/poison） |

`Mutex<T>` 提供**内部可变性（interior mutability）**，类似 `Cell` 家族：即使 `counter` 是不可变绑定，也能通过 `lock()` 获得内部数据的可变引用。

### 死锁（Deadlock）

Rust 编译器**无法**在编译期检测死锁。死锁是逻辑错误，而非类型安全问题。

**经典死锁场景：**

- 线程 A 持有锁 X，等待锁 Y
- 线程 B 持有锁 Y，等待锁 X
- 两个线程永远等待对方释放锁

**避免死锁的策略：**

1. **固定加锁顺序**：所有线程按照相同的顺序获取多把锁
2. **尽量减少锁的持有时间**：在锁的作用域内只做最少的工作
3. **避免嵌套锁**：尽量不要在持有一把锁的情况下去获取另一把锁
4. **使用 `try_lock()`**：非阻塞获取，获取失败时可以选择放弃或重试

---

## 16.4 使用 Send 和 Sync trait 的可扩展并发

> 原文：[Extensible Concurrency with the Sync and Send Traits](https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html)

### Rust 并发安全的基石

`Send` 和 `Sync` 是 Rust 语言内置的两个 **marker trait**（标记 trait）。它们没有任何方法需要实现，纯粹是给编译器看的"标签"。正是这两个 trait 使得 Rust 能在编译期保证线程安全。

### `Send` trait：所有权可以跨线程转移

**定义：** 实现了 `Send` 的类型，其值的所有权可以安全地从一个线程转移到另一个线程。

**要点：**

- **几乎所有 Rust 类型**都实现了 `Send`，包括所有基本类型
- 由全部 `Send` 类型组成的复合类型**自动**实现 `Send`
- 典型的**不实现 `Send`** 的类型：`Rc<T>`——因为多线程同时 clone 和 drop `Rc<T>` 会导致引用计数竞争
- 裸指针（raw pointer）也不实现 `Send`

```
// Rc<T> 不能跨线程发送
error[E0277]: `Rc<Mutex<i32>>` cannot be sent between threads safely
   = help: the trait `Send` is not implemented for `Rc<Mutex<i32>>`
```

### `Sync` trait：引用可以被多线程共享

**定义：** 如果 `&T`（T 的不可变引用）实现了 `Send`，那么 `T` 就实现了 `Sync`。换言之：**`T` 是 `Sync` 的，当且仅当从多个线程通过引用访问 `T` 是安全的。**

**要点：**

- 所有基本类型都是 `Sync`
- 由全部 `Sync` 类型组成的复合类型自动实现 `Sync`
- `Mutex<T>` **是** `Sync` 的（这正是它存在的意义——允许多线程通过引用安全访问）
- **不实现 `Sync`** 的典型类型：
  - `Rc<T>`——与不实现 `Send` 的原因相同
  - `RefCell<T>` 和 `Cell<T>` 家族——它们的运行时借用检查不是线程安全的

### `Send` 和 `Sync` 的关系

| 类型 | `Send` | `Sync` | 适用场景 |
|------|--------|--------|---------|
| `i32`, `String`, `Vec<T>` | Y | Y | 任意场景 |
| `Rc<T>` | **N** | **N** | 仅单线程 |
| `Arc<T>` | Y | Y | 多线程共享所有权 |
| `Mutex<T>` | Y | Y | 多线程互斥访问 |
| `RefCell<T>` | Y | **N** | 仅单线程内部可变性 |
| `Cell<T>` | Y | **N** | 仅单线程内部可变性 |
| `MutexGuard<T>` | **N** | Y | 不能跨线程发送锁守卫 |

### 手动实现 `Send` 和 `Sync` 需要 `unsafe`

由全 `Send`/`Sync` 类型组成的复合类型会**自动**获得这些 trait。只有在构建包含非 `Send`/`Sync` 部件的新并发原语时，才需要手动实现，而这需要 `unsafe` 代码块。

手动实现意味着你在向编译器做出安全承诺——编译器不再替你检查，你必须自己保证正确性。错误的手动实现会导致未定义行为。

> **设计哲学：** Rust 把并发安全分成了两层。自动推导层（Send/Sync auto trait）覆盖了绝大多数场景，让普通开发者无需关心底层细节。`unsafe` 层则留给少数编写底层并发原语的库作者，把复杂性封装在安全的 API 背后。

---

## 小结

### Rust 如何在编译期防止数据竞争——四道防线

Rust 的 "fearless concurrency" 不是一个单一机制，而是**所有权系统、类型系统、trait 系统**协同作用的结果：

1. **所有权转移（move semantics）**：`thread::spawn(move || {...})` 将数据的所有权转移给线程闭包。转移后原线程无法再访问该数据——从根本上避免了两个线程同时拥有同一数据

2. **Channel 发送转移所有权**：`tx.send(val)` 将 `val` 的所有权转移给接收端。发送后 `val` 不可用——保证同一时刻只有一个线程持有数据

3. **`Send`/`Sync` trait 编译期检查**：`thread::spawn` 要求闭包及其捕获的值满足 `Send` 约束。不满足的类型（如 `Rc<T>`）在编译期就被拒绝——类型系统自动阻止线程不安全的操作

4. **`Mutex<T>` 类型系统强制加锁**：`Mutex<i32>` 内部的 `i32` 无法绕过 `lock()` 直接访问。编译器在类型层面保证了 "先加锁，再访问" 的不变量（invariant）

### 核心类型速查

| 需求 | 方案 | 说明 |
|------|------|------|
| 创建线程 | `thread::spawn(move \|\| {...})` | 返回 `JoinHandle<T>` |
| 等待线程 | `handle.join().unwrap()` | 阻塞直到线程结束 |
| 线程间单向通信 | `mpsc::channel()` | 多生产者单消费者 |
| 线程间共享可变数据 | `Arc<Mutex<T>>` | 原子引用计数 + 互斥锁 |
| 线程安全的共享所有权 | `Arc<T>` | `Rc<T>` 的线程安全版 |
| 标记可跨线程转移 | `Send` trait | 自动推导 |
| 标记可跨线程引用 | `Sync` trait | 自动推导 |

### 记住

- **数据竞争（data race）**：编译器能防止 -> Rust 的核心优势
- **死锁（deadlock）**：编译器无法防止 -> 需要开发者自行设计避免
- **竞态条件（race condition）**：编译器能防止数据层面的竞态，但无法防止逻辑层面的竞态（例如检查-then-行动的 TOCTOU 问题）
