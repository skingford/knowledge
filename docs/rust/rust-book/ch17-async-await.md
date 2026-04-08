---
title: "第 17 章：Async 与 Await"
description: Future trait、async/await 语法、异步并发、Stream、异步相关 trait 和运行时模型。
---

# 第 17 章：Async 与 Await

> 原文：[Chapter 17: Async and Await](https://doc.rust-lang.org/book/ch17-00-async-await.html)
>
> 本章是 2024 Edition 新增的核心章节，系统讲解 Rust 异步编程的心智模型。

## 本章要点

- **Future** 是 Rust 异步的核心抽象：一个"现在可能还没有值，但将来会有"的计算单元。
- **async/await** 是编写 Future 的语法糖——编译器将其转换为状态机（state machine）。
- Future 是 **惰性的（lazy）**：不 `.await` 就不会执行。
- Rust **没有内置运行时（runtime）**，需要第三方 crate（如 `tokio`）驱动 Future 的执行。
- **并发 vs 并行**：async 天然支持并发（concurrency），是否并行取决于运行时和硬件。
- **Stream** 是 Future 的序列化版本，类比 Iterator 之于同步世界。
- **Pin/Unpin** 解决自引用 Future 在内存中移动导致悬垂指针的问题。
- Thread、Task、Future 三者是互补关系，不是非此即彼。

---

## 17.1 Future 与 async 语法

> 原文：[Futures and the Async Syntax](https://doc.rust-lang.org/book/ch17-01-futures-and-syntax.html)

### 什么是 Future

**Future** 是实现了 `std::future::Future` trait 的类型，表示一个"最终会产出值"的异步计算。它的核心特征：

1. **惰性（Lazy）**——创建 Future 不会执行任何操作，必须被 `.await` 或交给运行时 poll 才会推进。
2. **可轮询（Pollable）**——运行时通过不断调用 `poll()` 检查 Future 是否就绪。
3. 每个 Future 内部维护自己的 **进度信息** 和 "就绪"的定义。

### async 与 await 关键字

**`async`** 用于标记 block 或 function，表示"这段代码可以被暂停和恢复"。编译器会将其编译为一个实现了 `Future` 的匿名状态机。

**`await`** 是 **后缀关键字（postfix keyword）**——写在表达式后面，这是 Rust 的独特设计：

```rust
// Rust：后缀 await，支持链式调用
let text = trpl::get(url).await.text().await;

// 对比 JS/C#：前缀 await，链式调用需要括号
// let text = (await (await fetch(url)).text());
```

每个 `.await` 点都是一个 **让出点（yield point）**——运行时可以在此暂停当前 Future 并切换到其他任务。

### async fn 的编译等价形式

```rust
// 写法一：async fn
async fn page_title(url: &str) -> Option<String> {
    let text = trpl::get(url).await.text().await;
    Html::parse(&text)
        .select_first("title")
        .map(|title| title.inner_html())
}

// 写法二：等价的手动形式
fn page_title(url: &str) -> impl Future<Output = Option<String>> + '_ {
    async move {
        let text = trpl::get(url).await.text().await;
        Html::parse(&text)
            .select_first("title")
            .map(|title| title.inner_html())
    }
}
```

理解这层等价关系至关重要：`async fn` 并不返回 `Option<String>`，它返回的是 `impl Future<Output = Option<String>>`。

### 编译器生成的状态机

编译器为每个 async block 生成类似下面的枚举：

```rust
enum PageTitleFuture<'a> {
    Initial { url: &'a str },
    GetAwaitPoint { url: &'a str },
    TextAwaitPoint { response: trpl::Response },
}
```

每个 await 点对应一个状态变体。编译器自动管理状态转换，并在每个变体上应用正常的借用和所有权规则。

### 运行时与 block_on

`main` 函数 **不能** 标记为 `async`——因为 async 代码需要运行时驱动，而 `main` 本身是程序的入口点。

```rust
fn main() {
    trpl::block_on(async {
        // 异步代码在这里
        let url = "https://www.rust-lang.org";
        match page_title(url).await {
            Some(title) => println!("Title: {title}"),
            None => println!("No title found"),
        }
    });
}
```

`trpl::block_on` 会阻塞当前线程直到 Future 完成，底层使用 `tokio` 运行时。

### 实战：用 select 竞速两个请求

```rust
use trpl::{Either, Html};

fn main() {
    let args: Vec<String> = std::env::args().collect();
    trpl::block_on(async {
        let title_fut_1 = page_title(&args[1]);
        let title_fut_2 = page_title(&args[2]);

        let (url, maybe_title) =
            match trpl::select(title_fut_1, title_fut_2).await {
                Either::Left(left) => left,
                Either::Right(right) => right,
            };

        println!("{url} returned first");
        match maybe_title {
            Some(title) => println!("Title: '{title}'"),
            None => println!("No title"),
        }
    });
}
```

`trpl::select` 接受两个 Future，谁先完成就返回谁的结果（通过 `Either` 枚举区分来源）。

**核心心智模型**：创建 Future 只是"注册意图"，只有 `.await` 才真正推动执行。这与 JavaScript 的 Promise（创建即执行）有本质区别。

---

## 17.2 用 async 实现并发

> 原文：[Concurrency with Async](https://doc.rust-lang.org/book/ch17-02-concurrency-with-async.html)

### spawn_task：异步世界的 thread::spawn

```rust
fn main() {
    trpl::block_on(async {
        let handle = trpl::spawn_task(async {
            for i in 1..10 {
                println!("hi number {i} from the first task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        });

        for i in 1..5 {
            println!("hi number {i} from the second task!");
            trpl::sleep(Duration::from_millis(500)).await;
        }

        handle.await.unwrap();
    });
}
```

与线程类似，如果不 `.await` 返回的 handle，spawn 出的 task 会在 `main` 结束时被丢弃。

### join：公平调度多个 Future

```rust
fn main() {
    trpl::block_on(async {
        let fut1 = async {
            for i in 1..10 {
                println!("hi number {i} from the first task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let fut2 = async {
            for i in 1..5 {
                println!("hi number {i} from the second task!");
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        trpl::join(fut1, fut2).await;
    });
}
```

**关键区别**：`join` 保证公平交替轮询两个 Future，输出顺序是确定性的；而线程由 OS 调度，输出顺序不可预测。

输出：
```
hi number 1 from the first task!
hi number 1 from the second task!
hi number 2 from the first task!
hi number 2 from the second task!
...
```

### 消息传递（Message Passing）

异步 channel 的 API 与同步版本几乎一致，但有两个关键差异：

1. **`rx` 需要 `mut`**——接收端在每次 `recv()` 时修改内部状态。
2. **`recv()` 返回 Future**——需要 `.await`。

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();

        let tx_fut = async move {
            let vals = vec!["hi", "from", "the", "future"];
            for val in vals {
                tx.send(val.to_string()).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received '{value}'");
            }
        };

        trpl::join(tx_fut, rx_fut).await;
    });
}
```

### async move 与所有权转移

上面的 `tx_fut` 必须使用 `async move`，原因是一条关键链路：

1. `trpl::join` 要等两个 Future 都完成才返回。
2. `rx_fut` 的 `while let` 循环要等 `rx.recv()` 返回 `None` 才结束。
3. `recv()` 返回 `None` 的前提是 channel 关闭。
4. channel 关闭的前提是所有 `tx` 被 drop。
5. 如果不用 `async move`，`tx` 的所有权留在外层 block，直到 `join` 结束才 drop——**形成循环依赖**。

`async move` 将 `tx` 的所有权移入 block，当 `tx_fut` 完成时 `tx` 自动 drop，channel 关闭，`rx_fut` 随之结束。

### 多生产者 + join! 宏

```rust
fn main() {
    trpl::block_on(async {
        let (tx, mut rx) = trpl::channel();

        let tx1 = tx.clone();
        let tx1_fut = async move {
            let vals = vec!["hi", "from", "the", "future"];
            for val in vals {
                tx1.send(val.to_string()).unwrap();
                trpl::sleep(Duration::from_millis(500)).await;
            }
        };

        let tx_fut = async move {
            let vals = vec!["more", "messages", "for", "you"];
            for val in vals {
                tx.send(val.to_string()).unwrap();
                trpl::sleep(Duration::from_millis(1500)).await;
            }
        };

        let rx_fut = async {
            while let Some(value) = rx.recv().await {
                println!("received '{value}'");
            }
        };

        trpl::join!(tx1_fut, tx_fut, rx_fut);
    });
}
```

`join!` 宏接受任意数量的 Future（编译期确定），所有 Future 完成后才返回。

**Async vs Thread 对比**：

| 维度 | Async Task | OS Thread |
|------|-----------|-----------|
| 资源开销 | 极低（无需 OS 线程） | 较高（每线程约 8MB 栈） |
| 调度 | 运行时控制 | OS 调度器控制 |
| 确定性 | `join` 保证公平调度 | 输出顺序不确定 |
| 适用场景 | I/O 密集 | CPU 密集 |

---

## 17.3 处理更多 Future

> 原文：[Working With Any Number of Futures](https://doc.rust-lang.org/book/ch17-03-more-futures.html)

### await 点与饥饿（Starvation）

**核心规则**：Rust 只在 await 点让出控制权，两个 await 点之间的代码是同步执行的。

如果一个 Future 在两个 await 点之间做了大量工作，其他 Future 就无法推进——这叫 **饥饿（starvation）**。

```rust
fn slow(name: &str, ms: u64) {
    thread::sleep(Duration::from_millis(ms));
    println!("'{name}' ran for {ms}ms");
}

// 错误示范：大段同步工作之间没有 await 点
let a = async {
    println!("'a' started.");
    slow("a", 30);   // 阻塞！
    slow("a", 10);   // 阻塞！
    slow("a", 20);   // 阻塞！
    trpl::sleep(Duration::from_millis(50)).await;  // 这里才让出
    println!("'a' finished.");
};
```

结果：Future `a` 的全部 `slow()` 调用完成后，`b` 才有机会执行。

### yield_now：主动让出

```rust
let a = async {
    println!("'a' started.");
    slow("a", 30);
    trpl::yield_now().await;  // 主动让出
    slow("a", 10);
    trpl::yield_now().await;
    slow("a", 20);
    trpl::yield_now().await;
    println!("'a' finished.");
};
```

**`yield_now` vs `sleep`**：
- `yield_now` 语义明确："我主动让出 CPU"。
- `sleep` 引入不必要的延迟（定时器精度通常 >= 1ms）。
- `yield_now` 更快、意图更清晰。

这就是 **协作式多任务（cooperative multitasking）**——每个 Future 自己决定何时让出控制权。某些嵌入式 Rust OS 完全依赖这种模型。

**性能权衡**：yield 本身有开销。过于频繁的 yield 会拖慢计算密集型任务。建议先 benchmark 再优化。

### 构建自定义异步抽象：timeout

```rust
use std::time::Duration;
use trpl::Either;

async fn timeout<F: Future>(
    future_to_try: F,
    max_time: Duration,
) -> Result<F::Output, Duration> {
    match trpl::select(future_to_try, trpl::sleep(max_time)).await {
        Either::Left(output) => Ok(output),
        Either::Right(_) => Err(max_time),
    }
}
```

使用方式：

```rust
fn main() {
    trpl::block_on(async {
        let slow = async {
            trpl::sleep(Duration::from_secs(5)).await;
            "Finally finished"
        };

        match timeout(slow, Duration::from_secs(2)).await {
            Ok(message) => println!("Succeeded with '{message}'"),
            Err(duration) => {
                println!("Failed after {} seconds", duration.as_secs())
            }
        }
    });
}
// 输出：Failed after 2 seconds
```

这展示了 Future 的 **可组合性（composability）**——用 `select` + `sleep` 组合出 `timeout`，再用 `timeout` 组合出 `timeout_with_retry`，层层叠加。

---

## 17.4 Stream

> 原文：[Streams](https://doc.rust-lang.org/book/ch17-04-streams.html)

### Stream = 异步 Iterator

**Iterator** 同步地产出序列：调用 `next()` 立即得到 `Option<Item>`。
**Stream** 异步地产出序列：调用 `next()` 得到一个 Future，`.await` 后得到 `Option<Item>`。

典型场景：
- 消息队列中逐个到达的消息
- 文件系统逐块读取的数据
- 网络上随时间到达的数据包

### 从 Iterator 创建 Stream

```rust
use trpl::StreamExt;

fn main() {
    trpl::block_on(async {
        let values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        let iter = values.iter().map(|n| n * 2);
        let mut stream = trpl::stream_from_iter(iter);

        while let Some(value) = stream.next().await {
            println!("The value was: {value}");
        }
    });
}
```

### StreamExt trait

`Stream` trait 本身只定义了底层的 `poll_next` 方法。实际使用中需要导入 **`StreamExt`** 扩展 trait 才能获得 `next()`、`filter()`、`map()` 等高级方法：

```rust
use trpl::StreamExt; // 必须导入！
```

这遵循 Rust 生态的 **Ext pattern**——核心 trait 保持最小化，便捷方法通过扩展 trait 提供。

### Stream 与 Future 的组合

Stream 本身就是 Future，因此可以与其他 Future 自由组合：
- 批量收集事件后一次性发送（减少网络调用）
- 为 stream 操作设置超时
- 节流 UI 事件（throttle）

> 注意：`Stream` 和 `StreamExt` 目前不在标准库中，而是由 `futures` crate 等生态库提供。

---

## 17.5 深入理解异步 Trait

> 原文：[A Closer Look at the Traits for Async](https://doc.rust-lang.org/book/ch17-05-traits-for-async.html)

### Future trait 定义

```rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
```

- **`Output`** —— 关联类型，类比 `Iterator::Item`。
- **`poll`** —— 运行时调用此方法推进 Future。

### Poll 枚举

```rust
pub enum Poll<T> {
    Ready(T),   // 计算完成，值可用
    Pending,    // 尚未完成，稍后再问
}
```

`.await` 在编译后本质上是一个循环调用 `poll()` 的过程。但运行时不会忙等——它会通过 `Context` 中的 **Waker** 机制实现"就绪时通知"。

### Pin 与 Unpin

这是本章最"烧脑"的部分，但日常开发中很少需要直接处理。

**问题根源**：async block 编译为状态机，状态机的不同变体之间可能存在 **自引用（self-referential）**——某个字段是指向自身另一个字段的指针。如果这个结构体在内存中移动（move），指针就会变成悬垂引用。

**Pin 的作用**：`Pin<P>` 是一个零成本包装器，保证被包装的值 **不会在内存中移动**。

```
Pin<Box<Future>>
  │
  └── Box ─────→ Future { data, ref → data }
      (Box 可移动)    (Future 被钉住，不可移动)
```

**Unpin trait**：标记 trait（marker trait），表示"这个类型即使被 Pin 包装也可以安全移动"。

- 大多数类型都实现了 `Unpin`（如 `String`、`i32`）。
- async block 生成的 Future 可能是 `!Unpin`（不实现 Unpin）。

### 实战：join_all 与 Pin

当你需要在运行时动态收集多个 Future 时，需要用到 `join_all`，此时会遇到 Pin 约束：

```rust
// 编译失败：dyn Future 不满足 Unpin
let futures: Vec<Box<dyn Future<Output = ()>>> =
    vec![Box::new(fut1), Box::new(fut2), Box::new(fut3)];
trpl::join_all(futures).await;
```

**解决方案：使用 `pin!` 宏**

```rust
use std::pin::pin;

let tx1_fut = pin!(async move { /* ... */ });
let rx_fut  = pin!(async { /* ... */ });
let tx_fut  = pin!(async move { /* ... */ });

let futures: Vec<Pin<&mut dyn Future<Output = ()>>> =
    vec![tx1_fut, rx_fut, tx_fut];

trpl::join_all(futures).await;
```

**日常实践建议**：
- 当编译器报 `Pin` 或 `Unpin` 错误时，用 `pin!()` 宏或 `Box::pin()` 解决。
- `.await` 会隐式处理 pinning，大多数情况下你不需要手动操作。
- 深入理解 Pin 主要在编写自定义 Future 或运行时时需要。

### Stream trait 定义

```rust
trait Stream {
    type Item;
    fn poll_next(
        self: Pin<&mut Self>,
        cx: &mut Context<'_>,
    ) -> Poll<Option<Self::Item>>;
}
```

**三个 trait 的统一视角**：

| Trait | 产出 | 返回类型 | 语义 |
|-------|------|---------|------|
| `Iterator` | 同步序列 | `Option<Self::Item>` | 立即取下一个 |
| `Future` | 异步单值 | `Poll<Self::Output>` | 轮询直到就绪 |
| `Stream` | 异步序列 | `Poll<Option<Self::Item>>` | 轮询取下一个 |

Stream 的返回类型 `Poll<Option<Item>>`：外层 `Poll` 处理时间维度（就绪/未就绪），内层 `Option` 处理序列维度（有值/结束）。

---

## 17.6 Future、Task 与线程

> 原文：[Futures, Tasks, and Threads](https://doc.rust-lang.org/book/ch17-06-futures-tasks-threads.html)

### 三层并发模型

```
Runtime（Executor）
  └── Task（运行时管理的轻量级"线程"）
        └── Future（最细粒度的并发单元，可嵌套）
```

- **Thread**：OS 级别，每个线程有独立栈（通常 8MB），由 OS 调度。
- **Task**：运行时级别，不需要 OS 线程，可在单线程上运行多个 task。
- **Future**：最细粒度，每个 Future 内部可能是一棵 Future 树。

### 何时用什么

| 场景 | 推荐 | 原因 |
|------|------|------|
| CPU 密集型（如视频编码） | Thread | 需要真正的并行计算 |
| I/O 密集型（如处理网络请求） | Async | 大量等待，不需要占用 OS 线程 |
| 两者兼有 | Thread + Async 混合 | 各取所长 |

### 混合使用 Thread 与 Async

```rust
use std::{thread, time::Duration};

fn main() {
    let (tx, mut rx) = trpl::channel();

    // 线程：适合阻塞型/CPU 密集型工作
    thread::spawn(move || {
        for i in 1..11 {
            tx.send(i).unwrap();
            thread::sleep(Duration::from_secs(1));
        }
    });

    // async：适合等待和响应消息
    trpl::block_on(async {
        while let Some(message) = rx.recv().await {
            println!("{message}");
        }
    });
}
```

这个模式在实际生产中非常常见：用线程做计算密集型工作，用 async channel 通知其他部分。

### 工作窃取（Work Stealing）

许多异步运行时（包括 tokio）默认是 **多线程** 的，使用 **work stealing** 策略：

- 动态地在线程之间迁移 task
- 根据当前线程的负载情况分配工作
- 兼顾了 thread 的并行能力和 task 的轻量级

这意味着 thread 和 async 并非对立——运行时本身就在底层协调两者。

### 核心洞察

> Rust 不强迫你在 thread 和 async 之间二选一。能够自由地混合使用两者，让各自发挥所长，是 Rust 在并发编程中的核心优势——无论是高吞吐 Web 服务器还是嵌入式系统。

---

## 小结

本章建立了 Rust 异步编程的完整心智模型：

1. **Future 是惰性的**——创建不执行，`.await` 才推进。这是与 JavaScript Promise 最大的区别。
2. **await 点 = 让出点**——编译器在此处切割状态机，运行时在此处调度。两个 await 之间的代码不会被打断。
3. **运行时是可插拔的**——Rust 不内置运行时，`tokio`/`async-std` 等 crate 提供执行器（executor）。
4. **async move** 转移所有权进 Future，解决生命周期和 channel 关闭问题。
5. **join 保证公平**，**select 竞速取快**——这是组合 Future 的两个基本操作。
6. **Stream = 异步 Iterator**，通过 `StreamExt` 获得丰富的组合子。
7. **Pin 保证自引用 Future 不被移动**——日常用 `pin!()` 或 `Box::pin()` 解决编译器报错即可。
8. **Thread + Task + Future 三层互补**——CPU 密集用 thread，I/O 密集用 async，混合使用是最佳实践。
