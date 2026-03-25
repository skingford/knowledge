---
title: 并发与 Async 基础
description: 理解 Rust 中线程并发、Send/Sync、Arc/Mutex、channel 与 async/await 的基本模型和边界。
---

# 并发与 Async 基础

Rust 的并发模型并不是一套和语言主体割裂的东西。它仍然建立在所有权、借用和类型系统之上。

所以你会发现：很多并发问题，Rust 不靠“约定大家小心点”，而是尽量在编译期就阻止掉。

## 先分清两个概念

### 并发

关注“多件事能不能独立推进”，不一定同时跑在多个 CPU 上。

### 并行

关注“多件事是否真的同时执行”。

async/await 更偏并发组织方式，不自动等于并行。

## 线程并发先看所有权怎么过边界

```rust
use std::thread;

fn main() {
    let name = String::from("rust");

    let handle = thread::spawn(move || {
        println!("{name}");
    });

    handle.join().unwrap();
}
```

这里闭包前面的 `move` 很关键。因为新线程可能比当前栈帧活得更久，所以需要把所有权带进去。

## `Send` 和 `Sync` 是并发安全的基础标记

可以先这样理解：

- `Send`：值的所有权可以安全地在线程之间转移
- `Sync`：类型的共享引用可以安全地在线程之间共享

很多标准库类型会根据内部实现自动具备或不具备这些能力。

经验上不需要一开始就手写这些 trait，但你要知道它们解释了“为什么这个类型能跨线程传，那个不行”。

## channel 适合转移数据，不适合共享一切

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        tx.send(String::from("hello")).unwrap();
    });

    let msg = rx.recv().unwrap();
    println!("{msg}");
}
```

channel 的优点是边界清晰：

- 发送方交出数据
- 接收方获得数据

它天然贴近 Rust 的所有权模型。

## 共享状态通常要显式包裹

最常见组合是 `Arc<Mutex<T>>`。

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..4 {
        let counter = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("{}", *counter.lock().unwrap());
}
```

这里每个组件都有明确职责：

- `Arc`：多所有者共享
- `Mutex`：保证同一时刻只有一个线程能修改
- `lock()`：把“修改这段共享数据”变成显式临界区

## `Arc<Mutex<T>>` 不是默认答案

| 场景 | 更常见选择 |
| --- | --- |
| 消息传递、所有权转移 | channel |
| 只读共享配置 | `Arc<T>` |
| 少量共享可变状态 | `Arc<Mutex<T>>` |
| 读多写少 | `Arc<RwLock<T>>` |

很多初学者一遇到跨线程共享，就先上 `Arc<Mutex<T>>`。这不是错，但它通常意味着你在共享状态设计上还有优化空间。

## async/await 解决的是“等待期间不要卡住执行流”

```rust
async fn fetch_data() -> Result<String, String> {
    Ok("ok".to_string())
}
```

`async fn` 返回的是一个 future。future 本身不是立即执行的线程，它描述的是“一段可被调度执行的异步任务”。

要真正跑起来，通常还需要 runtime。

## async 代码为什么容易让人误会

### 误区 1：用了 async 就自动更快

不对。async 更擅长处理大量 I/O 等待场景，不代表 CPU 密集任务会变快。

### 误区 2：async 就是多线程

不对。async 可以跑在单线程 runtime 上，也可以配合多线程调度器。

### 误区 3：async 里就没有所有权问题

不对。future 依然要遵守所有权和借用规则，而且因为任务可能被挂起，很多借用边界会更敏感。

## async 工程里最重要的几个边界

### 1. 不要在 async 任务里长时间阻塞线程

例如：

- 长时间 CPU 计算
- 阻塞式文件 I/O
- 阻塞式数据库驱动

如果 runtime 工作线程被长时间占住，整个异步系统的吞吐都会受影响。

### 2. 注意共享状态的锁持有时间

即使用的是异步锁，持锁跨 await 也通常意味着更高风险：

- 更容易形成长时间占用
- 更难推断调度行为
- 更容易卡住其他任务

### 3. 取消往往表现为 future 被丢弃

Rust async 里常见的“取消”不是强行中断线程，而是：

- 上层不再等待这个 future
- future 被 drop
- 清理逻辑通过 drop 或显式收尾执行

## 一个务实的学习顺序

如果你要补并发和 async，不建议直接跳到复杂 runtime API。更稳的顺序是：

1. 先写线程 + channel。
2. 再写 `Arc` + `Mutex` 的共享状态代码。
3. 再理解 `Send` / `Sync` 在解释什么。
4. 最后进入 async/await 和 runtime。

这样你能先把“共享与转移”的边界理顺，再去理解异步任务调度。

## 工程建议

### 优先消息传递，少量共享状态

能通过 channel 传递任务和结果的场景，通常比大家一起抢一把锁更清晰。

### 先想清楚数据归属，再决定用什么同步原语

同步原语是手段，不是起点。先问：

- 这个数据是谁拥有？
- 是转移，还是共享？
- 共享时是只读还是可写？

### async 不是所有服务的默认起点

如果你只是写一个简单 CLI、小工具或低并发任务，先把同步代码写清楚往往更划算。

## 自检

你至少应该能解释：

1. 为什么 `thread::spawn` 的闭包经常配合 `move` 使用？
2. `Send` 和 `Sync` 各自在表达什么能力？
3. `Arc` 和 `Mutex` 分别解决了什么问题？
4. 为什么 async/await 不等于自动并行？
5. 为什么在 async 代码里长时间阻塞线程会出问题？

这些问题打通后，再往上补 runtime、网络框架和高性能优化，才会比较稳。
