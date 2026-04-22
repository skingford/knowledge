---
title: Node.js 源码剖析：I/O 多路复用与 net/http 底层 Binding
description: 深入 libuv 与 Node.js C++ 层，讲清 epoll / kqueue / IOCP 三平台 I/O 多路复用如何被统一抽象，TCP socket 从内核事件到 JS 回调的完整调用栈，以及 http.Server 背后的 llhttp 解析器。
search: false
---

# Node.js 源码剖析：I/O 多路复用与 net/http 底层 Binding

Node.js 能单进程扛住 C10K，甚至在合理调优下扛到 C100K，靠的不是"单线程 + async 就快"，而是：

- **I/O 多路复用**让一个线程能同时监听上万个 fd
- **libuv 把三平台的 epoll / kqueue / IOCP 抽象成统一接口**
- **Node.js C++ Binding 把内核事件一路喂回 JS**
- **llhttp 解析器**把字节流按 HTTP 协议切成 `req` / `res` 对象

这四层是"Node.js 为什么快"真正的原因。本篇从内核一路向上走，直到你在 `http.createServer((req, res) => ...)` 里拿到的那个 `req`。

## 版本口径与前置阅读

**源码版本**：Node.js 22 LTS / libuv 1.48+ / llhttp 9.x。

**前置阅读**：

- 强烈建议先读 [libuv 事件循环与线程池](./source-libuv-event-loop-and-thread-pool.md)，这里会直接引用 `uv__io_poll`、`uv__io_t`、`uv_tcp_t` 等概念，不再复述
- [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md) 讲的是 **应用层** 分层，本篇讲 **内核到 JS 这段** binding；两篇互不重复

**与 Web 框架文档的边界**：

- Web 框架文档：中间件、错误处理、分层，面向应用工程师
- 本篇：TCP socket / HTTP 解析 / C++ Binding，面向想回答"http.Server 到底是怎么工作的"的读者

## I/O 多路复用三平台对比

"多路复用"本质是：**把 N 个 fd 托管给内核，内核告诉你哪个 fd 可读/可写**。

三大平台实现不同，但语义一致：

| 平台 | 机制 | 核心 syscall | 边缘触发？ | libuv 用到 |
| --- | --- | --- | --- | --- |
| Linux | epoll | `epoll_create1` / `epoll_ctl` / `epoll_wait` | 支持 ET/LT，libuv 用 LT | `src/unix/linux.c` |
| macOS / BSD | kqueue | `kqueue` / `kevent` | 边缘触发 | `src/unix/kqueue.c` |
| Windows | IOCP | `CreateIoCompletionPort` / `GetQueuedCompletionStatusEx` | 完成端口模型 | `src/win/iocp.c` |

**epoll 和 kqueue 是"就绪通知"模型**：内核告诉你 fd 可读，你去读。
**IOCP 是"完成通知"模型**：你先发起读，内核读完了通知你。

libuv 的巧妙之处在于：它把 IOCP 包装成和前两者一样的接口，对上层代码透明。所以你读 Node.js 上层代码时，会发现它不关心跑在什么平台。

## libuv 的统一抽象：uv__io_t 与 uv__io_poll

libuv 对三平台的统一接口：

```c
// src/unix/internal.h (libuv)
struct uv__io_s {
  uv__io_cb cb;
  void* pending_queue[2];
  void* watcher_queue[2];
  unsigned int pevents;   // 想监听的事件
  unsigned int events;    // 当前实际发生的事件
  int fd;
};

void uv__io_init(uv__io_t* w, uv__io_cb cb, int fd);
void uv__io_start(uv_loop_t* loop, uv__io_t* w, unsigned int events);
void uv__io_stop(uv_loop_t* loop, uv__io_t* w, unsigned int events);
void uv__io_close(uv_loop_t* loop, uv__io_t* w);
void uv__io_feed(uv_loop_t* loop, uv__io_t* w);
```

**Linux 的 `uv__io_poll`（简化）**：

```c
// src/unix/linux.c
void uv__io_poll(uv_loop_t* loop, int timeout) {
  struct epoll_event events[1024];
  int nfds;

  // 1. 把 watcher_queue 里累积的 ADD/MOD 刷进 epoll
  while (!QUEUE_EMPTY(&loop->watcher_queue)) {
    q = QUEUE_HEAD(&loop->watcher_queue);
    QUEUE_REMOVE(q);
    w = QUEUE_DATA(q, uv__io_t, watcher_queue);
    epoll_ctl(loop->backend_fd,
              w->events ? EPOLL_CTL_MOD : EPOLL_CTL_ADD,
              w->fd, &e);
    w->events = w->pevents;
  }

  // 2. 陷入 epoll_wait
  nfds = epoll_wait(loop->backend_fd, events, ARRAY_SIZE(events), timeout);
  uv__update_time(loop);

  // 3. 把就绪事件分发到每个 watcher 的 cb
  for (i = 0; i < nfds; i++) {
    uv__io_t* w = loop->watchers[events[i].data.fd];
    if (w == NULL) { epoll_ctl(..., EPOLL_CTL_DEL, ...); continue; }
    w->cb(loop, w, events[i].events);
  }
}
```

**macOS 的 `uv__io_poll`（简化）**：

```c
// src/unix/kqueue.c
void uv__io_poll(uv_loop_t* loop, int timeout) {
  struct kevent events[1024];
  int nfds;

  // 把 watcher 注册到 kqueue（EV_ADD / EV_DISABLE / EV_DELETE）
  for (...) EV_SET(&ev, w->fd, filter, flags, 0, 0, 0);

  nfds = kevent(loop->backend_fd, changes, nchanges, events, ARRAY_SIZE(events),
                timeout == -1 ? NULL : &ts);
  uv__update_time(loop);

  for (i = 0; i < nfds; i++) {
    w = (uv__io_t*) events[i].udata;
    // 过滤并回调
    w->cb(loop, w, events[i].filter == EVFILT_READ ? POLLIN : POLLOUT);
  }
}
```

三平台差异被挡在 `src/unix/linux.c` / `src/unix/kqueue.c` / `src/win/iocp.c` 里，上层 `uv_tcp_t` / `uv_udp_t` / `uv_pipe_t` 只看 `uv__io_start` 这个统一接口。

**工程上最重要的一条推论**：

> TCP/HTTP 连接数的上限不取决于 `UV_THREADPOOL_SIZE`，而取决于：
> - 进程打开 fd 的上限（`ulimit -n`）
> - 内核 `nf_conntrack` / `somaxconn` / `tcp_max_syn_backlog`
> - 应用层内存（每个 socket 都要分配读写 buffer）

## TCP socket 从内核到 JS 的完整链路

以"客户端发来一段数据，服务器读到并回调 `socket.on('data')`"为例：

### 第 1 步：建立 socket，绑定 uv_tcp_t

JS 层：

```js
const server = net.createServer(socket => {
  socket.on('data', chunk => { /* ... */ });
});
server.listen(3000);
```

C++ 层（`src/tcp_wrap.cc`）：

```cpp
// 概念版
class TCPWrap : public ConnectionWrap<TCPWrap, uv_tcp_t> {
  static void Listen(const FunctionCallbackInfo<Value>& args) {
    TCPWrap* wrap = ...;
    int err = uv_listen(reinterpret_cast<uv_stream_t*>(&wrap->handle_),
                        backlog,
                        OnConnection);
    args.GetReturnValue().Set(err);
  }
};
```

libuv 层（`uv_tcp_init` → 内部 `socket(AF_INET, SOCK_STREAM, 0)` → `uv__io_init`）：

此时 fd 已经被挂在 `uv_tcp_t` 上，`uv__io_t.cb = uv__server_io`。

### 第 2 步：新连接到达

客户端 `connect` 过来，内核三次握手完成后：

1. 服务 fd 可读（有新 accept）
2. `epoll_wait` 返回，事件进入 `uv__io_poll` 循环
3. 分发到 `uv__server_io`：

```c
// src/unix/stream.c (概念)
static void uv__server_io(uv_loop_t* loop, uv__io_t* w, unsigned int events) {
  uv_stream_t* stream = container_of(w, uv_stream_t, io_watcher);
  while (uv__stream_fd(stream) != -1) {
    int fd = accept(uv__stream_fd(stream), NULL, NULL);
    if (fd < 0) break;
    stream->accepted_fd = fd;
    stream->connection_cb(stream, 0);   // 进 C++
  }
}
```

4. C++ 的 `OnConnection` 被调用 → new 一个子 `TCPWrap` → 回到 JS 的 `net.Server` → emit `'connection'`

### 第 3 步：数据到达

客户端 `write('hello')` → 数据进内核缓冲区 → 服务端 fd 可读：

1. `uv__io_poll` 拿到 `POLLIN`
2. 进入 `uv__read`：

```c
// src/unix/stream.c (简化)
static void uv__read(uv_stream_t* stream) {
  uv_buf_t buf;
  ssize_t nread;

  while (stream->read_cb && (stream->flags & UV_HANDLE_READING)) {
    stream->alloc_cb((uv_handle_t*)stream, 64 * 1024, &buf);  // 回 JS 要 buffer
    nread = read(uv__stream_fd(stream), buf.base, buf.len);
    if (nread < 0) {
      if (errno == EAGAIN) break;                              // 没更多数据了
      stream->read_cb(stream, UV__ERR(errno), &buf);
      return;
    }
    stream->read_cb(stream, nread, &buf);                      // 把数据送回
  }
}
```

3. `read_cb` 是 C++ 的 `StreamBase::EmitRead`，把字节 buffer 转成 `ArrayBuffer`
4. 通过 `MakeCallback` 一路回到 JS 的 `socket.on('data', cb)`
5. **完成后**，V8 microtask checkpoint → Node.js nextTick queue → 回到 libuv 下一阶段

### 小结：关键调用链

```
内核 fd 可读
  ↓ epoll_wait 返回
libuv: uv__io_poll
  ↓
libuv: uv__read (read syscall → EAGAIN 止损)
  ↓
C++: StreamBase::EmitRead (字节 → JS ArrayBuffer)
  ↓
C++: MakeCallback(onread)
  ↓
JS:   lib/net.js → socket.emit('data', chunk)
  ↓
C++: InternalCallbackScope::Close
  ↓
JS:   processTicksAndRejections (nextTick + microtask)
  ↓
回到 libuv 下一阶段
```

这就是每一个 Node.js HTTP 请求数据到来时发生的全流程。

## Node.js C++ Binding 机制

C 代码不会凭空暴露给 JS。Node.js 提供了三代 Binding 机制：

| 机制 | 特点 | 典型使用者 |
| --- | --- | --- |
| `process.binding()` | 最早的形式，已 deprecated | 老代码、极少数 core 模块 |
| `internalBinding()` | 只允许 core 代码使用 | `lib/internal/**` 几乎都用这个 |
| `NAPI`（`node-api`） | ABI 稳定，给 native module 用 | 第三方 addon（如 `better-sqlite3`） |

### internalBinding 如何注册

```cpp
// src/node_binding.cc (概念)
void RegisterBuiltinModule(const char* name, node_module_register_func func) {
  modlist_internal->AddBuiltin(name, func);
}

// 在 tcp_wrap.cc 的末尾：
NODE_BINDING_CONTEXT_AWARE_INTERNAL(tcp_wrap, node::TCPWrap::Initialize)
```

JS 侧使用：

```js
// lib/net.js
const { TCP, constants: TCPConstants } = internalBinding('tcp_wrap');
```

这一行就让 JS 拿到了 C++ 暴露的 `TCP` 构造器；`new TCP()` 在 C++ 就是 `new TCPWrap()`，直接持有 `uv_tcp_t`。

### 一个完整的 Binding 生命周期

1. **进程启动**：`node::RegisterBuiltinModule` 把每个 `_wrap.cc` 文件的 `Initialize` 函数注册到一个全局模块表
2. **Isolate 创建**：每个 `Environment` 创建时拿到这个表的副本
3. **JS 首次调用 `internalBinding('tcp_wrap')`**：懒加载对应 `Initialize`，建立 JS-side binding object
4. **`new TCP()`**：JS 的 V8 调 C++ 构造函数，分配 `uv_tcp_t` 并调 `uv_tcp_init`
5. **进程退出**：`Environment::CleanupHandles` 逐个 `uv_close` 所有 handle

## HTTP Server：llhttp 解析器的接入

`http.createServer()` 在 C++ 里并不是一个独立的"HTTP server"handle——它本质是一个 TCP server + HTTP 解析器。

Node.js 内置了 **llhttp** 作为 HTTP 解析器（Node.js 12 之后替代老的 `http_parser`）：

```cpp
// src/node_http_parser.cc (概念)
class Parser : public AsyncWrap, public StreamListener {
  llhttp_t parser_;
  llhttp_settings_t settings_;

  void OnStreamRead(ssize_t nread, const uv_buf_t& buf) override {
    enum llhttp_errno err = llhttp_execute(&parser_, buf.base, nread);
    if (err != HPE_OK) { /* 400 bad request */ }
  }
};
```

### 生命周期

1. `net.Server` 的 `connection` 事件触发 → JS 层 `_http_server.js` 创建一个 `HTTPParser`
2. C++ 侧 `new Parser()`、`llhttp_init(&parser_, HTTP_REQUEST, &settings_)`
3. 把 parser 作为 `StreamListener` 挂到 socket 上——此后每次 `uv__read` 的数据都先喂给 parser
4. llhttp 识别出：
   - `on_message_begin` → 新请求开始
   - `on_url` / `on_header_field` / `on_header_value` → 攒 URL 与 header
   - `on_headers_complete` → 触发 JS 的 `parserOnHeadersComplete`，创建 `IncomingMessage` (`req`)
   - `on_body` → 每读到 body chunk 往 `req` push
   - `on_message_complete` → emit `req.end()`
5. 用户写的 handler `(req, res) => {}` 才在这时被调用

### 为什么 llhttp 换掉老的 http_parser

- 老 `http_parser` 是手写 C 状态机，代码难维护，CVE 频发
- llhttp 用 TypeScript 写协议描述，编译成 C——**更安全、可生成、性能相当**
- 仓库在 `https://github.com/nodejs/llhttp`

工程上你感知到的唯一变化是：**某些畸形请求在新版会 400，老版可能放行**——这是好事，别"回滚解析器"。

## http.Server 一个请求的完整调用栈

```
客户端 TCP SYN
  ↓ 三次握手完成，accept 队列有项
libuv: uv__server_io → accept
  ↓
C++: TCPWrap::OnConnection → new child TCPWrap
  ↓
JS:   net.Server emit 'connection'
  ↓
JS:   _http_server.js: new HTTPParser(REQUEST)
  ↓ parser 作为 StreamListener 挂到 socket

客户端 write(GET / HTTP/1.1\r\nHost:...\r\n\r\n)
  ↓
libuv: uv__io_poll → uv__read → StreamBase::EmitRead
  ↓
C++: Parser::OnStreamRead → llhttp_execute
  ↓ llhttp 依次回调 on_url / on_headers_complete
C++: parserOnHeadersComplete → MakeCallback
  ↓
JS:   new IncomingMessage(req), new ServerResponse(res)
  ↓
JS:   server.emit('request', req, res)
  ↓
JS:   用户的 (req, res) => { res.end('hi') }
  ↓
JS:   res.end → socket.write
  ↓
C++: StreamBase::WriteBuffer → uv_write
  ↓
libuv: uv__io_start(POLLOUT) → 下一轮 uv__io_poll 写出
```

能把这个链在白板上画出来，就彻底理解了 Node.js Web 服务的底层。

## 重点治理清单

回到应用工程，源码视角能帮你做的判断：

- **TCP 连接数瓶颈看 fd / 内核参数，不看线程池**——`ulimit -n`、`net.core.somaxconn`、`net.ipv4.tcp_max_syn_backlog` 是真正的天花板
- **每个连接都要分配 read buffer**——默认 64KB，10 万连接就是 6GB，别忽视
- **`server.listen(port, backlog)` 的 backlog 要和内核 `somaxconn` 配合**——调一个不调另一个等于没调
- **keep-alive 连接复用效果巨大**——复用节省的不只是 TCP 握手，还有 parser 创建/销毁
- **不要在 `data` 回调里做 CPU 密集工作**——会阻塞 `uv__io_poll`，拖慢所有其他连接
- **Windows 下 IOCP 行为与 epoll 不同**——大并发场景建议统一 Linux 部署
- **畸形请求 llhttp 会 400，不要关严格检查**——松绑检查等于打开攻击面
- **IPv4/IPv6 dual-stack**：`listen('::')` 比 `listen('0.0.0.0')` 覆盖更全，但要关闭 `IPV6_V6ONLY` 才能收 v4

## 下一步

- 想看"JS 回调进 V8 之后如何被 Ignition / TurboFan 执行"，读 [V8 执行管线、Ignition 字节码与 TurboFan 优化](./source-v8-pipeline-ignition-turbofan-and-ic.md)
- 想看"每个连接的 buffer / parser 对象被 V8 怎么管理"，读 [V8 内存布局与分代 GC](./source-v8-memory-and-gc.md)
- 想看"CPU 密集任务如何在 Worker Threads 里跑"，读 [Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md)
- 想看"事件循环六阶段和线程池源码"，读 [libuv 事件循环与线程池](./source-libuv-event-loop-and-thread-pool.md)
- 想回到应用层看"HTTP 服务分层与错误处理"，读 [Express / Fastify Web 服务实践](./express-fastify-web-service-practice.md)
