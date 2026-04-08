---
title: "第 21 章：终极项目：构建多线程 Web 服务器"
description: 从单线程 HTTP 服务器到线程池，再到优雅关闭——综合运用全书知识的完整项目。
---

# 第 21 章：终极项目：构建多线程 Web 服务器

> 原文：[Chapter 21: Final Project: Building a Multithreaded Web Server](https://doc.rust-lang.org/book/ch21-00-final-project-a-web-server.html)

本章是全书的收官之作。我们将从零构建一个真实可运行的多线程 Web 服务器，把前面 20 章学到的所有核心概念——所有权（ownership）、借用（borrowing）、trait、生命周期（lifetime）、闭包（closure）、智能指针（smart pointer）、并发（concurrency）、错误处理等——串联到一个完整项目中。

## 本章要点

| 知识点 | 涉及章节回顾 |
|--------|-------------|
| `TcpListener` / `TcpStream` | 标准库 I/O |
| `BufReader` + iterator 链式调用 | 迭代器（ch13） |
| `match` 模式匹配 | 枚举与模式匹配（ch06/ch19） |
| `thread::spawn` + `move` 闭包 | 并发（ch16） |
| `mpsc::channel` 消息传递 | 并发（ch16） |
| `Arc<Mutex<T>>` 共享状态 | 并发（ch16） |
| `Box<dyn FnOnce()>` trait 对象 | trait 对象与动态分派（ch18） |
| `Drop` trait 实现 | trait（ch10） |
| `Option::take()` 所有权转移 | 枚举（ch06） |
| 编译器驱动开发（compiler-driven development） | 贯穿全书 |

**项目计划**：

1. 学习 TCP 和 HTTP 基础
2. 在 socket 上监听 TCP 连接
3. 解析 HTTP 请求
4. 构造 HTTP 响应
5. 用线程池（thread pool）提升吞吐量
6. 实现优雅关闭（graceful shutdown）

> 书中特别说明：本项目**不使用 async/await**，而是手动实现线程池。这是为了深入理解底层机制——实际上很多 async 运行时内部也是用线程池管理工作的。生产环境请使用 crates.io 上更成熟的 crate。

---

## 21.1 构建单线程 Web 服务器

### 21.1.1 两个关键协议

- **TCP（Transmission Control Protocol）**：传输层协议，定义信息如何从一端到达另一端，但不规定信息内容。
- **HTTP（Hypertext Transfer Protocol）**：应用层协议，建立在 TCP 之上，定义请求（request）和响应（response）的内容格式。它是一个"请求-响应"协议——客户端发起请求，服务器返回响应。

### 21.1.2 监听 TCP 连接

```bash
$ cargo new hello
$ cd hello
```

```rust
// src/main.rs
use std::net::TcpListener;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        println!("Connection established!");
    }
}
```

**精读要点**：

- `TcpListener::bind("127.0.0.1:7878")`：在本地 `127.0.0.1` 的 7878 端口上监听。选择 7878 是因为它在电话键盘上对应 "rust"。
- `bind` 返回 `Result<T, E>`——绑定可能失败（例如端口已被占用，或非管理员绑定 80 端口）。
- `incoming()` 返回一个迭代器，每次产出一个 `Result<TcpStream, Error>`。一个 **stream**（流）代表客户端与服务器之间的一个打开的连接。一个完整的 **connection**（连接）包括：客户端发送请求 -> 服务器处理 -> 服务器发送响应 -> 关闭连接。
- 浏览器可能会产生多次连接（请求页面本身 + favicon.ico + 预连接等）。

### 21.1.3 读取 HTTP 请求

```rust
use std::{
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        handle_connection(stream);
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    println!("Request: {http_request:#?}");
}
```

**精读要点**：

- `BufReader` 包裹 `&stream`，提供缓冲读取能力，并通过实现 `std::io::BufRead` trait 提供 `lines()` 方法。
- `lines()` 返回 `Iterator<Item = Result<String, io::Error>>`，以换行符分割。
- `take_while(|line| !line.is_empty())` 读到空行为止——HTTP 协议规定请求头以一个空行（连续两个 `\r\n`）结束。
- 这里展示了 **iterator adapter 链式调用**的威力：`lines() -> map() -> take_while() -> collect()`，简洁且高效。

**HTTP 请求格式**：

```
Method Request-URI HTTP-Version CRLF
Header1: Value1 CRLF
Header2: Value2 CRLF
CRLF
[message-body]
```

示例请求行：`GET / HTTP/1.1`——方法是 `GET`，URI 是 `/`，版本是 `HTTP/1.1`。

### 21.1.4 编写 HTTP 响应

**HTTP 响应格式**：

```
HTTP-Version Status-Code Reason-Phrase CRLF
Header1: Value1 CRLF
CRLF
[message-body]
```

最简响应：

```rust
fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let response = "HTTP/1.1 200 OK\r\n\r\n";
    stream.write_all(response.as_bytes()).unwrap();
}
```

- `write_all()` 将字节写入流。`as_bytes()` 将字符串转为 `&[u8]`。
- `\r\n\r\n`：第一个 `\r\n` 结束状态行，第二个 `\r\n` 表示响应头为空（直接结束）。

### 21.1.5 返回真正的 HTML

创建 `hello.html`：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello!</title>
  </head>
  <body>
    <h1>Hello!</h1>
    <p>Hi from Rust</p>
  </body>
</html>
```

更新 `handle_connection`：

```rust
fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let http_request: Vec<_> = buf_reader
        .lines()
        .map(|result| result.unwrap())
        .take_while(|line| !line.is_empty())
        .collect();

    let status_line = "HTTP/1.1 200 OK";
    let contents = fs::read_to_string("hello.html").unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

- `fs::read_to_string()` 将文件内容一次性读入 `String`。
- `Content-Length` 头是合法 HTTP 响应必须的，告诉客户端响应体的字节数。

### 21.1.6 请求校验与 404 响应

只读取请求行的第一行（`next()`），根据路径分别响应：

```rust
fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = if request_line == "GET / HTTP/1.1" {
        ("HTTP/1.1 200 OK", "hello.html")
    } else {
        ("HTTP/1.1 404 NOT FOUND", "404.html")
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

**精读要点**：

- `buf_reader.lines().next().unwrap().unwrap()`：两层 unwrap——外层解 `Option`（迭代器可能为空），内层解 `Result`（读取可能失败）。
- 使用 **`if` 表达式返回元组** `(status_line, filename)`，然后通过 `let` 解构赋值——这是 Rust 的惯用模式，消除了 `if/else` 两个分支中的重复代码。
- 404 页面需要单独创建一个 `404.html` 文件。

> 这里仅用约 40 行 Rust 代码就完成了一个能返回 HTML、区分路由、返回 404 的单线程 Web 服务器。

---

## 21.2 将单线程服务器变为多线程

### 21.2.1 单线程的问题

在单线程模型下，请求被串行处理。如果有一个慢请求，后续所有请求都必须等待。

通过添加一个 `/sleep` 路由来模拟慢请求：

```rust
use std::{thread, time::Duration};

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

**现象**：先打开 `/sleep`，再打开 `/`——第二个请求会被阻塞 5 秒，直到第一个请求处理完毕。这就是单线程服务器的根本缺陷。

> 注意这里从 `if/else` 重构为 `match &request_line[..]`——`&request_line[..]` 将 `String` 转为 `&str` 切片，以便与字符串字面量比较。这也是一种常见的 Rust 惯用法。

### 21.2.2 线程池（Thread Pool）方案

**什么是线程池？** 一组预先创建好的线程，等待接收并处理任务。

**为什么不是每个请求一个线程？** 如果每个连接都 `thread::spawn`，恶意用户可以发起大量连接导致资源耗尽（DoS 攻击）。线程池通过**固定数量的线程**来限制并发度，在吞吐量和资源保护之间取得平衡。

### 21.2.3 编译器驱动开发：先写接口

这是本章最重要的开发方法论之一——**先写出理想的 API，让编译器告诉你缺什么**：

```rust
// src/main.rs
use hello::ThreadPool;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}
```

此时编译会失败——`ThreadPool` 还不存在。但我们已经定义了清晰的接口：
- `ThreadPool::new(4)`：创建一个包含 4 个线程的池
- `pool.execute(|| { ... })`：提交一个闭包作为任务执行

### 21.2.4 逐步构建 ThreadPool

**第一步：骨架**

```rust
// src/lib.rs
pub struct ThreadPool;

impl ThreadPool {
    /// 创建一个新的 ThreadPool。
    ///
    /// `size` 是池中线程的数量。
    ///
    /// # Panics
    ///
    /// 如果 size 为零则 panic。
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);
        ThreadPool
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
    }
}
```

**`execute` 的 trait bound 深度解读**：

- `FnOnce()`：闭包只需执行一次（每个请求处理一次就够了）。
- `Send`：闭包需要从主线程**发送**到 worker 线程——`Send` trait 标记类型可以安全跨线程转移所有权。
- `'static`：我们不知道 worker 线程会运行多久，所以闭包不能包含任何有限生命周期的引用。

这三个 bound 的组合与 `thread::spawn` 的签名完全一致——因为底层逻辑是相同的。

**第二步：引入 Worker 模式**

线程池不是直接存储 `JoinHandle`，而是引入一个中间抽象——`Worker`：

```rust
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
}

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id));
        }

        ThreadPool { workers }
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize) -> Worker {
        let thread = thread::spawn(|| {});
        Worker { id, thread }
    }
}
```

- `Vec::with_capacity(size)` 预分配容量，避免扩容开销。
- `Worker` 封装了 `id`（用于日志/调试）和 `JoinHandle`（线程句柄）。
- 此时 worker 线程什么也不做——接下来要让它们接收任务。

**第三步：通过 Channel 分发任务**

使用 `mpsc::channel`（多生产者，单消费者）作为任务队列。但这里有个问题——`mpsc` 的 receiver 是**单消费者**的，而我们有多个 worker 线程需要共享同一个 receiver。

解决方案：`Arc<Mutex<mpsc::Receiver<Job>>>`

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.send(job).unwrap();
    }
}
```

**精读要点**：

- `type Job = Box<dyn FnOnce() + Send + 'static>` —— 这是一个 **trait 对象**（trait object），用 `Box` 装箱以获得固定大小。`dyn` 表示动态分派（dynamic dispatch）。这里综合运用了闭包、trait 对象、智能指针三大概念。
- `Arc<Mutex<Receiver<Job>>>`——三层嵌套，每层都有明确职责：
  - `Arc`（Atomic Reference Counting）：允许多个 worker 共享 receiver 的所有权。
  - `Mutex`（互斥锁）：确保同一时刻只有一个 worker 从 channel 取任务。
  - `Receiver<Job>`：channel 的接收端。
- `Arc::clone(&receiver)` 增加引用计数，不会深拷贝数据。

**第四步：Worker 的工作循环**

```rust
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || {
            loop {
                let job = receiver.lock().unwrap().recv().unwrap();

                println!("Worker {id} got a job; executing.");

                job();
            }
        });

        Worker { id, thread }
    }
}
```

- `move` 将 `receiver` 的所有权转移到闭包内（转移的是 `Arc` 的一个克隆）。
- `receiver.lock().unwrap()` 获取互斥锁。
- `.recv().unwrap()` 阻塞等待任务到来。
- `job()` 执行闭包。

### 21.2.5 关键陷阱：`while let` vs `let`

你可能会想用 `while let` 简化：

```rust
// 有问题的写法！
while let Ok(job) = receiver.lock().unwrap().recv() {
    println!("Worker {id} got a job; executing.");
    job();
}
```

**这会导致严重的并发问题！** 原因在于 Rust 的临时值生存期规则：

- 在 `while let` 中，`receiver.lock().unwrap()` 产生的 `MutexGuard` 是一个临时值，其生命周期延续到**整个 `while let` 块结束**。
- 这意味着 `job()` 执行期间，锁一直被持有，其他 worker 无法获取新任务。
- 结果：线程池退化为"串行执行"，完全失去了并发优势。

而使用 `let` 语句：

```rust
let job = receiver.lock().unwrap().recv().unwrap();
```

`MutexGuard` 在 `let` 语句结束时就被 drop，锁立即释放。`job()` 执行时锁已经释放，其他 worker 可以自由获取任务。

> 这是 Rust 所有权系统中一个精妙但容易踩坑的地方——**临时值的 drop 时机取决于语句结构**。

### 21.2.6 完整的多线程服务器

**src/lib.rs**（线程池库）：

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: mpsc::Sender<Job>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: thread::JoinHandle<()>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let job = receiver.lock().unwrap().recv().unwrap();
            println!("Worker {id} got a job; executing.");
            job();
        });

        Worker { id, thread }
    }
}
```

**src/main.rs**（服务器主程序）：

```rust
use hello::ThreadPool;
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming() {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

**验证效果**：同时访问 `/sleep` 和 `/`，后者不再被阻塞！

---

## 21.3 优雅关闭与清理

当前的服务器有一个严重问题：worker 线程在无限循环中运行，程序退出时线程会被强制终止，正在处理的请求可能中断。我们需要实现**优雅关闭**（graceful shutdown）——让每个 worker 完成当前任务后再退出。

### 21.3.1 为 ThreadPool 实现 Drop trait

第一步，为 `ThreadPool` 实现 `Drop` trait，在池被销毁时等待所有线程完成：

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        for worker in self.workers.drain(..) {
            println!("Shutting down worker {}", worker.id);
            worker.thread.join().unwrap();
        }
    }
}
```

**精读要点**：

- `drain(..)` 方法将 `Vec` 中所有元素移出并返回一个拥有所有权的迭代器，与 `&mut self.workers` 的普通遍历不同——后者只能借用，而 `join()` 需要**消费**（take ownership of）`JoinHandle`。
- `join()` 会阻塞当前线程，直到目标线程运行结束。

但仅有 `Drop` 还不够：worker 线程在 `loop` 中无限等待 `recv()`，`join()` 会永远阻塞。我们需要一种方式告诉 worker "没有更多任务了，可以退出了"。

### 21.3.2 通过关闭 Channel 发送停止信号

核心思路：**drop sender -> channel 关闭 -> recv() 返回 Err -> worker 退出循环**。

将 `sender` 包装为 `Option`，以便在 `drop` 时显式销毁：

```rust
pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

impl ThreadPool {
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}
```

**精读要点**：

- `sender: Option<mpsc::Sender<Job>>`——用 `Option` 包裹是为了能在 `drop` 中通过 `take()` 取走所有权。这是 Rust 中从 `&mut self` 中移出值的经典模式。
- `self.sender.as_ref().unwrap()`：`as_ref()` 将 `&Option<T>` 转为 `Option<&T>`，避免移动整个 `Option`。

### 21.3.3 Worker 优雅退出

更新 Worker 的工作循环，处理 channel 关闭的情况：

```rust
impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let message = receiver.lock().unwrap().recv();

            match message {
                Ok(job) => {
                    println!("Worker {id} got a job; executing.");
                    job();
                }
                Err(_) => {
                    println!("Worker {id} disconnected; shutting down.");
                    break;
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

- 不再对 `recv()` 直接 unwrap，而是用 `match` 处理两种情况：
  - `Ok(job)`：正常收到任务，执行。
  - `Err(_)`：sender 已被 drop，channel 已关闭，`break` 退出循环。

### 21.3.4 完整的 Drop 实现

```rust
impl Drop for ThreadPool {
    fn drop(&mut self) {
        // 第一步：关闭 channel
        drop(self.sender.take());

        // 第二步：等待所有 worker 完成
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}
```

**关键顺序**：必须**先** drop sender，**再** join 线程。如果反过来——先 join 第一个 worker，但 channel 还没关闭，worker 还在等待任务，`join` 会永远阻塞。

`worker.thread` 也需要改为 `Option<thread::JoinHandle<()>>`，使用 `take()` 取出所有权后调用 `join()`。

### 21.3.5 完整的最终代码

**src/lib.rs**：

```rust
use std::{
    sync::{Arc, Mutex, mpsc},
    thread,
};

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// Create a new ThreadPool.
    ///
    /// The size is the number of threads in the pool.
    ///
    /// # Panics
    ///
    /// The `new` function will panic if the size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);

        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool {
            workers,
            sender: Some(sender),
        }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

impl Drop for ThreadPool {
    fn drop(&mut self) {
        drop(self.sender.take());

        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);

            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            let message = receiver.lock().unwrap().recv();

            match message {
                Ok(job) => {
                    println!("Worker {id} got a job; executing.");
                    job();
                }
                Err(_) => {
                    println!("Worker {id} disconnected; shutting down.");
                    break;
                }
            }
        });

        Worker {
            id,
            thread: Some(thread),
        }
    }
}
```

**src/main.rs**（使用 `take(2)` 限制请求数以演示关闭）：

```rust
use hello::ThreadPool;
use std::{
    fs,
    io::{BufReader, prelude::*},
    net::{TcpListener, TcpStream},
    thread,
    time::Duration,
};

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();
    let pool = ThreadPool::new(4);

    for stream in listener.incoming().take(2) {
        let stream = stream.unwrap();

        pool.execute(|| {
            handle_connection(stream);
        });
    }

    println!("Shutting down.");
}

fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1" => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            thread::sleep(Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response =
        format!("{status_line}\r\nContent-Length: {length}\r\n\r\n{contents}");

    stream.write_all(response.as_bytes()).unwrap();
}
```

**运行输出**：

```
$ cargo run
Worker 0 got a job; executing.
Shutting down.
Shutting down worker 0
Worker 3 got a job; executing.
Worker 1 disconnected; shutting down.
Worker 2 disconnected; shutting down.
Worker 3 disconnected; shutting down.
Worker 0 disconnected; shutting down.
Shutting down worker 1
Shutting down worker 2
Shutting down worker 3
```

注意输出的**非确定性顺序**——这是并发程序的正常特征。

---

## 小结

### 本章综合运用的 Rust 核心概念

| 概念 | 在项目中的体现 |
|------|---------------|
| **所有权与借用** | `TcpStream` 的所有权从 `main` 转移到闭包再到 worker 线程 |
| **闭包** | `pool.execute(\|\| { handle_connection(stream) })` 捕获环境变量 |
| **trait** | `FnOnce + Send + 'static` 约束、`Drop` trait 实现 |
| **trait 对象** | `Box<dyn FnOnce() + Send + 'static>` 动态分派 |
| **泛型** | `execute<F>` 接受任何满足约束的闭包类型 |
| **智能指针** | `Box`（堆分配）、`Arc`（原子引用计数）、`Mutex`（互斥锁） |
| **并发** | `thread::spawn`、`mpsc::channel`、`Arc<Mutex<T>>` |
| **模式匹配** | `match` 分发路由、`if let` / `let` 解构 |
| **Option 模式** | `Option::take()` 从 `&mut self` 中安全移出值 |
| **迭代器** | `lines()` + `map()` + `take_while()` + `collect()` |
| **错误处理** | `Result` 的 `unwrap()` 与 `match` |
| **模块系统** | `src/lib.rs`（库）+ `src/main.rs`（二进制）的项目结构 |

### 进一步提升建议

书中建议的改进方向：

1. **完善文档**：为 `ThreadPool` 及其公共方法添加更详细的 doc comment。
2. **添加测试**：为线程池库编写单元测试和集成测试。
3. **改进错误处理**：将 `unwrap()` 替换为更健壮的错误处理（如 `?` 运算符 + 自定义错误类型）。
4. **泛化用途**：将 `ThreadPool` 用于 Web 服务以外的并发场景。
5. **对比社区方案**：与 [crates.io](https://crates.io/) 上的线程池 crate（如 `rayon`、`threadpool`）进行对比学习。

### 核心收获

这个项目最深刻的启示是：**Rust 的类型系统和所有权模型不是在阻碍你编写并发代码，而是在帮助你正确地编写并发代码。** 编译器在 `while let` 与 `let` 的细微差异中捕获了一个在其他语言中可能导致极难调试的死锁问题；`Send` trait 确保闭包可以安全跨线程传递；`Arc<Mutex<T>>` 的类型签名让共享状态的线程安全保证从"文档约定"变成了"编译期检查"。

这不只是一个 Web 服务器项目——它是对 Rust 哲学的一次完整实践："如果它能编译，它大概率是正确的。"
