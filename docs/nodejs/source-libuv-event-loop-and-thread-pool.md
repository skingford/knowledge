---
title: Node.js 源码剖析：libuv 事件循环与线程池
description: 深入 libuv 源码，从 uv_run 入口逐阶段走读事件循环六个阶段、线程池调度、nextTick 与 microtask 的 C++ 落点，把 Node.js 高并发背后的 C 层调用链讲清楚。
search: false
---

# Node.js 源码剖析：libuv 事件循环与线程池

这篇不是再讲一遍"事件循环有六个阶段"。
这篇要回答的是：

- `setTimeout(fn, 0)` 在 C 层到底走到了哪几行代码
- `process.nextTick` 为什么"比 Promise 还快"，它们在 Node.js C++ 层是怎么交接的
- 为什么 `fs.readFile` 会占用 libuv 线程池，而 TCP socket 不会
- `UV_THREADPOOL_SIZE` 改大就一定能提升高并发吗，上限在哪
- 为什么 `uv__io_poll` 是整个 Node.js 高并发的真正心脏

读完这篇，你应该能够对着 libuv 源码指出任意一段 Node.js 异步调用的完整 C 层调用栈，而不是只能说"这东西扔给 libuv 了"。

## 版本口径与前置阅读

**源码版本**：

- Node.js 22 LTS（2026-04 在用版本）
- libuv 1.48+（Node.js 22 自带）
- V8 12.x

所有文件路径以 `node-v22.x` 源码根和 libuv tag `v1.48.0` 为准。

**前置阅读**：

- 先读 [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)，应用层已经讲过事件循环六阶段、microtask 和线上排障；这里不再复述"应用层怎么用"，只讲"C 层怎么实现"。
- 读过 [Node.js 队列、定时任务与 Worker 实战](./queue-scheduler-and-worker-practice.md) 更好，后面讲线程池压测时会直接引用。

**与 runtime-event-loop 文档的边界**：

- runtime-event-loop：应用层视角，"事件循环被谁拖慢了、怎么定位"
- 本篇：C 层视角，"`uv_run` 内部做了什么、`uv__io_poll` 如何挑 fd、线程池怎么派发 work"

两篇互补，线上排障优先看 runtime-event-loop，想解释"为什么会这样"回到本篇。

## libuv 架构全图

libuv 给 Node.js 提供的核心对象只有四类：

| 对象 | 对应 C 类型 | 生命周期 | 例子 |
| --- | --- | --- | --- |
| loop | `uv_loop_t` | 整个进程一个 | Node.js 主线程的 `Environment::event_loop()` |
| handle | `uv_handle_t` 及其子类 | 长期存活，可多次触发 | `uv_tcp_t`、`uv_timer_t`、`uv_idle_t` |
| request | `uv_req_t` 及其子类 | 一次性，完成即释放 | `uv_work_t`、`uv_fs_t`、`uv_write_t` |
| threadpool | 一组 worker 线程 | 全进程共享 | 处理 `uv_queue_work` / `fs` / `dns` / `crypto` |

这四类对象都挂在 `uv_loop_t` 上。源码里 loop 的定义大致是：

```c
// src/uv-common.h (libuv)
struct uv_loop_s {
  /* Active handles */
  unsigned int active_handles;
  void* handle_queue[2];
  /* Pending callbacks */
  void* pending_queue[2];
  /* Active I/O requests */
  void* watcher_queue[2];
  /* Closing handles */
  uv_handle_t* closing_handles;
  /* Timer heap */
  struct heap timer_heap;
  /* ...平台相关：epoll_fd / kqueue_fd / iocp_port */
};
```

一轮事件循环，就是依次扫描这几个队列并把"到期 / 可读 / 可写 / 可关闭"的 handle 回调拉起来执行。

## uv_run：事件循环总入口

Node.js 启动后，主线程最终会落到 libuv 的 `uv_run`（`src/unix/core.c` 或 `src/win/core.c`）：

```c
// src/unix/core.c (简化自 libuv v1.48)
int uv_run(uv_loop_t* loop, uv_run_mode mode) {
  int timeout;
  int r;

  r = uv__loop_alive(loop);
  if (!r) uv__update_time(loop);

  while (r != 0 && loop->stop_flag == 0) {
    uv__update_time(loop);
    uv__run_timers(loop);                 // 1. 到期定时器
    ran_pending = uv__run_pending(loop);  // 2. 延迟到下一轮的 I/O 回调
    uv__run_idle(loop);                   // 3. idle handle
    uv__run_prepare(loop);                // 4. prepare handle（polling 前）

    timeout = 0;
    if ((mode == UV_RUN_ONCE && !ran_pending) || mode == UV_RUN_DEFAULT)
      timeout = uv_backend_timeout(loop);

    uv__io_poll(loop, timeout);           // 5. I/O 多路复用（真正会挂起线程的地方）
    uv__run_check(loop);                  // 6. check handle（polling 后）
    uv__run_closing_handles(loop);        // 7. 关闭 handle 的回调

    if (mode == UV_RUN_ONCE) break;
    r = uv__loop_alive(loop);
  }
  return r;
}
```

这就是"事件循环六阶段"真正的样子（加上 idle 和 closing 实际是 7 个阶段，应用层通常合并讲）。

下面逐阶段走读。

### 阶段 1：uv__run_timers — 到期定时器

```c
void uv__run_timers(uv_loop_t* loop) {
  struct heap_node* heap_node;
  uv_timer_t* handle;

  for (;;) {
    heap_node = heap_min(timer_heap(loop));
    if (heap_node == NULL) break;
    handle = container_of(heap_node, uv_timer_t, heap_node);
    if (handle->timeout > loop->time) break;

    uv_timer_stop(handle);
    uv_timer_again(handle);               // repeat > 0 则自动重启
    handle->timer_cb(handle);             // 进入 JS 回调
  }
}
```

关键点：

- 用**最小堆**存定时器，堆顶是"最早到期"的那个
- 遇到第一个没到期的就停，时间复杂度是 `O(k log n)`，k 是本轮到期数量
- `handle->timer_cb` 回调其实是 Node.js C++ 层注册的 trampoline，进去后会一路跳回 JS 的 `setTimeout` 回调

这也是为什么"成百上千个 setTimeout 并发"不会把 Node.js 打死，堆结构让插入和弹出都是 log 级。

### 阶段 2：uv__run_pending — 延迟到本轮执行的 I/O 回调

上一轮 `uv__io_poll` 里如果某个 I/O 回调执行过程中抛了 `EAGAIN`，libuv 会把它推到 `pending_queue`，本阶段统一消费。

```c
static int uv__run_pending(uv_loop_t* loop) {
  QUEUE* q;
  uv__io_t* w;
  if (QUEUE_EMPTY(&loop->pending_queue)) return 0;
  QUEUE_MOVE(&loop->pending_queue, &pq);
  while (!QUEUE_EMPTY(&pq)) {
    q = QUEUE_HEAD(&pq);
    QUEUE_REMOVE(q);
    w = QUEUE_DATA(q, uv__io_t, pending_queue);
    w->cb(loop, w, POLLOUT);
  }
  return 1;
}
```

这里最常触发的是"上轮写没写完 / socket 刚连上"类回调。

### 阶段 3~4：uv__run_idle、uv__run_prepare

`idle` / `prepare` 两个阶段是给 libuv 自己和 embedder 用的钩子。应用层一般接触不到，但 Node.js 会用 `prepare` 做一些"polling 前收尾"的事情。

### 阶段 5：uv__io_poll — 真正的心脏

这一步是 Node.js 能扛住 C10K 的根本原因。它对应 Linux 的 `epoll_wait` / macOS 的 `kevent` / Windows 的 `GetQueuedCompletionStatusEx`。

简化版（Linux）：

```c
// src/unix/linux.c (概念版)
void uv__io_poll(uv_loop_t* loop, int timeout) {
  struct epoll_event events[1024];
  int nfds;

  // 把 watcher_queue 里新增的 fd 注册 / 更新到 epoll
  while (!QUEUE_EMPTY(&loop->watcher_queue)) { /* epoll_ctl ADD/MOD */ }

  nfds = epoll_wait(loop->backend_fd, events, 1024, timeout);
  uv__update_time(loop);

  for (int i = 0; i < nfds; i++) {
    uv__io_t* w = loop->watchers[events[i].data.fd];
    if (w == NULL) { epoll_ctl(..., EPOLL_CTL_DEL, ...); continue; }
    w->cb(loop, w, events[i].events);    // 进入具体 handle 的回调
  }
}
```

这里有几条经常被问到的细节：

1. **`timeout` 是 `uv_backend_timeout` 算出来的**——它会综合"最近一个定时器还有多久、是否有 pending、是否有 idle"来决定事件循环愿意挂起多久
2. **fd 注册不是在 watcher 创建时立刻发生**——是攒到本轮 `uv__io_poll` 开头统一刷进 `epoll`
3. **主线程就卡在 `epoll_wait`**——这解释了为什么 "idle Node.js 进程 CPU 几乎 0"
4. **一次 `epoll_wait` 最多拉 1024 个事件**——单轮极端爆发时会分多轮处理

### 阶段 6：uv__run_check — polling 后钩子

与 `prepare` 对称，但执行在 I/O 回调之后。Node.js 的 `setImmediate` 就是用 `check` handle 实现的，所以"`setImmediate` 发生在 I/O 之后"这条口诀背后就是这段代码。

### 阶段 7：uv__run_closing_handles — 关闭 handle

```c
static void uv__run_closing_handles(uv_loop_t* loop) {
  uv_handle_t* p;
  uv_handle_t* q;
  p = loop->closing_handles;
  loop->closing_handles = NULL;
  while (p) {
    q = p->next_closing;
    uv__finish_close(p);                  // 调用用户传入的 close_cb
    p = q;
  }
}
```

任何 `uv_close()` 都不会立刻执行 `close_cb`，而是挂到 `closing_handles` 链表，本阶段统一回调。这保证了"我调 close 的时候还在自己的 I/O 回调里"不会导致栈崩。

## process.nextTick 与 Promise microtask 的 C++ 落点

这是最容易在面试里翻车的部分，因为它**不在 libuv 源码里**，而是在 Node.js C++ 层 + JS 层。

Node.js 22 在 libuv 每个宏任务阶段之间都会插一段：

```cpp
// src/node_task_queue.cc (概念版)
void InternalCallbackScope::Close() {
  ...
  // 清空 nextTick 队列
  if (tick_info->has_tick_scheduled()) {
    env->ProcessTick();                   // 调 JS 的 processTicksAndRejections()
  }
  // 清空 microtask 队列（V8）
  if (can_call_into_js) {
    MicrotasksScope::PerformCheckpoint(env->isolate());
  }
}
```

对应的 JS 入口是 `lib/internal/process/task_queues.js` 里的 `processTicksAndRejections`：

```js
// lib/internal/process/task_queues.js (简化)
function processTicksAndRejections() {
  let tock;
  do {
    while ((tock = queue.shift()) !== null) {
      const asyncId = tock[async_id_symbol];
      // ... AsyncHook trigger
      Reflect.apply(tock.callback, undefined, tock.args);
      // 每次 nextTick 执行完后立刻清 microtask
      runMicrotasks();
    }
    runMicrotasks();
  } while (!queue.isEmpty() || processPromiseRejections());
}
```

所以顺序其实是：

1. libuv 跑一个宏任务阶段（比如 `uv__run_timers`）
2. 该阶段的某个 handler 返回到 C++ → `InternalCallbackScope::Close`
3. 先清空本次累积的 `nextTick` 队列（**nextTick 永远先于 Promise**）
4. 每个 `nextTick` 回调跑完再 `MicrotasksScope::PerformCheckpoint` 清 Promise microtask
5. 回到 libuv 下一阶段

这解释了三件事：

- 为什么"无限 `process.nextTick` 会饿死 I/O"——永远跑不到下一阶段
- 为什么 `await` 后的代码比 `setImmediate` 的回调快——它是 microtask，不等下一轮循环
- 为什么 Node.js 22 之后 `nextTick` 和 microtask 在阶段间被明确分开清理——早期版本这里有过顺序 bug

## 线程池：uv_queue_work 与 worker 线程

libuv 线程池是给 JS 层"假装同步调用"的 backbone：`fs.readFile`、`dns.lookup`、`crypto.pbkdf2`、`zlib` 的某些操作，最终都会走它。

### 线程池初始化

```c
// src/threadpool.c (libuv)
static uv_once_t once = UV_ONCE_INIT;
static unsigned int nthreads;
static uv_thread_t* threads;
static uv_thread_t default_threads[4];    // 默认 4 个

static void init_threads(void) {
  unsigned int i;
  const char* val;

  nthreads = ARRAY_SIZE(default_threads);
  val = getenv("UV_THREADPOOL_SIZE");
  if (val != NULL) nthreads = atoi(val);
  if (nthreads == 0) nthreads = 1;
  if (nthreads > MAX_THREADPOOL_SIZE) nthreads = MAX_THREADPOOL_SIZE;  // 1024

  for (i = 0; i < nthreads; i++)
    if (uv_thread_create(&threads[i], worker, &sem))
      abort();
}
```

关键点：

- 默认 **4 个**线程
- `UV_THREADPOOL_SIZE` 环境变量可以改，**硬上限 1024**
- 线程池是**全进程共享**，不是每个 loop 一份

### 提交任务：uv__work_submit

```c
// src/threadpool.c (简化)
void uv__work_submit(uv_loop_t* loop,
                     struct uv__work* w,
                     enum uv__work_kind kind,
                     void (*work)(struct uv__work*),
                     void (*done)(struct uv__work*, int)) {
  uv_once(&once, init_once);
  w->loop = loop;
  w->work = work;
  w->done = done;
  post(&w->wq, kind);                      // 入队并唤醒一个 worker
}
```

任务分三档：`UV__WORK_CPU`（crypto / zlib 这类）、`UV__WORK_FAST_IO`（fs 常规）、`UV__WORK_SLOW_IO`（dns 等），worker 线程按档位调度避免互相挤兑。

### worker 主循环

```c
static void worker(void* arg) {
  for (;;) {
    uv_mutex_lock(&mutex);
    while (QUEUE_EMPTY(&wq) && /* 没 slow_io 能跑 */) {
      uv_cond_wait(&cond, &mutex);         // 挂起等待
    }
    q = QUEUE_HEAD(&wq);
    QUEUE_REMOVE(q);
    uv_mutex_unlock(&mutex);

    w = QUEUE_DATA(q, struct uv__work, wq);
    w->work(w);                            // 执行 fs / crypto / 用户的 work

    uv_mutex_lock(&w->loop->wq_mutex);
    w->work = NULL;
    QUEUE_INSERT_TAIL(&w->loop->wq, &w->wq);
    uv_async_send(&w->loop->wq_async);     // 通知主 loop 本任务完成
    uv_mutex_unlock(&w->loop->wq_mutex);
  }
}
```

关键点：

- worker 完成后**不直接回调 JS**，而是通过 `uv_async_send` 通知主 loop
- 主 loop 下一轮 `uv__io_poll` 会接到这个 async handle，然后在主线程调 `done`（也就是最终的 JS 回调）
- 这样保证所有 JS 代码永远在主线程跑，避免并发问题

### UV_THREADPOOL_SIZE 到底改不改？

常见的错误认知是"改大到 128 就能扛 128 并发 fs.readFile"。实际上：

| 场景 | 改 `UV_THREADPOOL_SIZE` 有没有用 |
| --- | --- |
| 大量 `fs.readFile` 小文件并发 | **有用**，默认 4 常是瓶颈 |
| 大量 `crypto.pbkdf2` | **有用**，但要看 CPU 核数 |
| 大量 TCP/HTTP 连接 | **没用**——TCP 是 `uv__io_poll` 走 epoll，不进线程池 |
| 大量 `dns.lookup` | 有用但建议切换到 `dns.resolve*`（后者走异步不占线程池） |
| CPU 核数 2 核，改到 128 | **反而变慢**——线程切换开销大于收益 |

经验值：

- 容器里物理核 `N`，一般开到 `2N ~ 4N`
- 真正被 crypto 打爆的场景，先考虑把 crypto 挪到 Worker Threads 或独立服务

## 回到 Node.js：一个 setTimeout 的完整调用链

这是一份能在面试里当"压轴答案"的调用栈：

```
JS:   setTimeout(fn, 10)
  ↓
JS:   lib/internal/timers.js → insert(timer, msecs)
  ↓
C++:  src/timers.cc → TimerWrap::Start
  ↓
libuv: uv_timer_start → heap_insert(timer_heap)
  ↓
libuv: uv_run → uv__io_poll(timeout=10)  // 挂起最多 10ms
  ↓
内核: timer 到期，epoll_wait 返回
  ↓
libuv: uv__run_timers → handle->timer_cb
  ↓
C++:  TimerWrap::OnTimeout → MakeCallback
  ↓
JS:   processTimers → fn()
  ↓
C++:  InternalCallbackScope::Close
  ↓
JS:   processTicksAndRejections (nextTick + microtask)
  ↓
libuv: 进入 uv__run_check / 下一轮
```

这条链能说清楚，事件循环的故事基本就完整了。

## 重点治理清单

落到工程里，源码视角能帮你做的判断：

- **`fs.*` 吃线程池，不要在主循环里串行 `readFile`**——预读或走流式更稳
- **TCP/HTTP 不吃线程池**——单进程扛几万连接靠的是 epoll，改 `UV_THREADPOOL_SIZE` 解决不了
- **`crypto` 是线程池杀手**——敏感路径（登录 pbkdf2、RSA 签名）建议预热 worker 池或提交到 Worker Threads
- **无限 `process.nextTick` 会饿死 I/O**——排障看到"CPU 不高但 HTTP 延迟高"时，优先查 nextTick 环
- **`setImmediate` vs `setTimeout(0)`**——前者走 check 阶段，后者走 timer 阶段；在 I/O 回调里用 `setImmediate` 更快
- **`dns.lookup` 会吃线程池；`dns.resolve*` 不会**——高并发出站选 `resolve`
- **改 `UV_THREADPOOL_SIZE` 之前先 profile**——绝大多数高并发瓶颈不在线程池

## 下一步

- 想继续看"I/O 多路复用到底怎么把 socket 事件转成 JS 回调"，读 [I/O 多路复用与 net/http 底层 Binding](./source-io-multiplexing-and-net-http-binding.md)
- 想继续看"Worker Threads 在 V8 层怎么隔离"，读 [Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md)
- 想回到应用层看"线上事件循环延迟怎么排"，回到 [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)
