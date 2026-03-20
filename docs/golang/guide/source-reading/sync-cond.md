---
title: sync.Cond 源码精读
description: 精读 sync.Cond 的条件变量实现，掌握 Wait/Signal/Broadcast 语义、虚假唤醒防护与生产者-消费者模式。
---

# sync.Cond：条件变量源码精读

> 核心源码：`src/sync/cond.go`
>
> 图例参考：复用同步原语图例，并补了 `Cond Wait/Signal/Broadcast` 的专用流程图，先看“释放锁 -> 睡眠 -> 重新拿锁”的顺序，再回头理解为什么条件判断必须写在 `for` 里。

这篇只聚焦条件变量语义：`Wait`、`Signal`、`Broadcast` 以及为什么必须用 `for` 循环守护条件。

如果你还在比较各种同步工具的适用边界，先看：

- 总览：[sync 包源码精读](./sync-primitives.md)

`sync.Cond` 适合解决“等待某个条件成立”的问题，不适合拿来替代所有 channel 或 mutex 场景。

## 包结构图

<GoSyncPrimitiveDiagram kind="cond-wait-signal" />

```
sync.Cond 内部结构
══════════════════════════════════════════════════════════════════

  Cond
  ├── L     Locker         ← 关联的锁（通常是 *sync.Mutex）
  ├── notify notifyList   ← 等待者队列（链表）
  └── checker copyChecker ← go vet 检测禁止拷贝

  notifyList（等待者链表）：
  ├── wait  uint32   ← 下一个等待者的 ticket 号
  ├── notify uint32  ← 已通知到的 ticket 号
  └── head/tail      ← 等待中的 goroutine 链表

  三个核心方法：
  ┌─────────────────────────────────────────────────────────┐
  │  Wait()      ← 原子地：释放 L + 挂起 goroutine         │
  │               被唤醒后重新获取 L                        │
  │                                                         │
  │  Signal()    ← 唤醒一个等待的 goroutine（FIFO 顺序）    │
  │                                                         │
  │  Broadcast() ← 唤醒所有等待的 goroutine                 │
  └─────────────────────────────────────────────────────────┘

  使用模式（条件变量三步法）：
  ┌────────────────────────────────────────────────────────┐
  │  mu.Lock()                                             │
  │  for !condition() {    ← ⚠️ 必须用 for，不能用 if      │
  │      cond.Wait()       ← 释放锁 → 睡眠 → 获取锁        │
  │  }                                                     │
  │  // 条件满足，处理...                                   │
  │  mu.Unlock()                                           │
  └────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/sync/cond.go
type Cond struct {
    noCopy  noCopy       // go vet 禁止拷贝
    L       Locker       // 关联锁
    notify  notifyList   // 等待者队列
    checker copyChecker  // 运行时拷贝检测
}

// Wait：原子地释放锁并挂起
func (c *Cond) Wait() {
    c.checker.check()

    // 1. 分配 ticket（原子自增）
    t := runtime_notifyListAdd(&c.notify)

    // 2. 释放锁（此后其他 goroutine 可修改共享状态）
    c.L.Unlock()

    // 3. 挂起当前 goroutine（等待 ticket 被 notify）
    runtime_notifyListWait(&c.notify, t)

    // 4. 被唤醒后重新获取锁
    c.L.Lock()
}

// Signal：唤醒一个等待者（最先等待的）
func (c *Cond) Signal() {
    c.checker.check()
    runtime_notifyListNotifyOne(&c.notify) // 将 notify 计数+1，唤醒最小 ticket
}

// Broadcast：唤醒所有等待者
func (c *Cond) Broadcast() {
    c.checker.check()
    runtime_notifyListNotifyAll(&c.notify) // 将 notify 计数追上 wait 计数
}

// 关键：Wait 必须在持锁时调用，且用 for 循环检查条件（防虚假唤醒）
```

---

## 二、代码示例

### 经典生产者-消费者

```go
type BoundedQueue struct {
    mu    sync.Mutex
    cond  *sync.Cond
    items []int
    cap   int
}

func NewBoundedQueue(cap int) *BoundedQueue {
    q := &BoundedQueue{cap: cap}
    q.cond = sync.NewCond(&q.mu)
    return q
}

func (q *BoundedQueue) Put(item int) {
    q.mu.Lock()
    defer q.mu.Unlock()

    // ⚠️ for 循环：防止虚假唤醒 + 多消费者竞争
    for len(q.items) >= q.cap {
        q.cond.Wait() // 队列满，等待消费者取出
    }

    q.items = append(q.items, item)
    q.cond.Signal() // 通知一个等待 Get 的消费者
}

func (q *BoundedQueue) Get() int {
    q.mu.Lock()
    defer q.mu.Unlock()

    for len(q.items) == 0 {
        q.cond.Wait() // 队列空，等待生产者放入
    }

    item := q.items[0]
    q.items = q.items[1:]
    q.cond.Signal() // 通知一个等待 Put 的生产者
    return item
}
```

### 一次性事件通知（类似 sync.WaitGroup）

```go
// 等待某个初始化完成
type Initializer struct {
    mu   sync.Mutex
    cond *sync.Cond
    done bool
    err  error
}

func NewInitializer() *Initializer {
    i := &Initializer{}
    i.cond = sync.NewCond(&i.mu)
    return i
}

func (i *Initializer) Complete(err error) {
    i.mu.Lock()
    i.done = true
    i.err = err
    i.mu.Unlock()
    i.cond.Broadcast() // 唤醒所有等待者
}

func (i *Initializer) Wait() error {
    i.mu.Lock()
    defer i.mu.Unlock()
    for !i.done {
        i.cond.Wait()
    }
    return i.err
}

// 使用
init := NewInitializer()

go func() {
    err := doExpensiveInit()
    init.Complete(err) // 初始化完成，通知所有等待者
}()

// 多个 goroutine 等待同一个初始化
go func() { fmt.Println("等待结果:", init.Wait()) }()
go func() { fmt.Println("等待结果:", init.Wait()) }()
```

### Worker Pool：优雅关闭

```go
type WorkerPool struct {
    mu       sync.Mutex
    cond     *sync.Cond
    queue    []func()
    workers  int
    active   int  // 活跃 goroutine 数
    shutdown bool
}

func NewWorkerPool(n int) *WorkerPool {
    p := &WorkerPool{workers: n}
    p.cond = sync.NewCond(&p.mu)

    for i := 0; i < n; i++ {
        go p.worker()
    }
    return p
}

func (p *WorkerPool) worker() {
    p.mu.Lock()
    p.active++
    p.mu.Unlock()

    defer func() {
        p.mu.Lock()
        p.active--
        p.cond.Broadcast() // 通知可能等待 active==0 的关闭逻辑
        p.mu.Unlock()
    }()

    for {
        p.mu.Lock()
        for len(p.queue) == 0 && !p.shutdown {
            p.cond.Wait()
        }

        if p.shutdown && len(p.queue) == 0 {
            p.mu.Unlock()
            return
        }

        task := p.queue[0]
        p.queue = p.queue[1:]
        p.mu.Unlock()

        task()
    }
}

func (p *WorkerPool) Submit(task func()) {
    p.mu.Lock()
    defer p.mu.Unlock()
    if p.shutdown {
        return
    }
    p.queue = append(p.queue, task)
    p.cond.Signal() // 唤醒一个 worker
}

func (p *WorkerPool) Shutdown() {
    p.mu.Lock()
    p.shutdown = true
    p.cond.Broadcast() // 唤醒所有 worker，让它们检查 shutdown 标志

    // 等待所有 worker 退出
    for p.active > 0 {
        p.cond.Wait()
    }
    p.mu.Unlock()
}
```

### 读写顺序控制（写者优先）

```go
// 写者优先的读写锁（比 sync.RWMutex 更灵活的控制）
type WriterPreferredRWLock struct {
    mu       sync.Mutex
    cond     *sync.Cond
    readers  int  // 当前读者数
    writers  int  // 等待写的写者数
    writing  bool // 是否有写者正在写
}

func NewWriterPreferredRWLock() *WriterPreferredRWLock {
    l := &WriterPreferredRWLock{}
    l.cond = sync.NewCond(&l.mu)
    return l
}

func (l *WriterPreferredRWLock) RLock() {
    l.mu.Lock()
    // 有写者等待时，新读者等待（写者优先）
    for l.writing || l.writers > 0 {
        l.cond.Wait()
    }
    l.readers++
    l.mu.Unlock()
}

func (l *WriterPreferredRWLock) RUnlock() {
    l.mu.Lock()
    l.readers--
    if l.readers == 0 {
        l.cond.Broadcast() // 通知等待的写者
    }
    l.mu.Unlock()
}

func (l *WriterPreferredRWLock) Lock() {
    l.mu.Lock()
    l.writers++ // 注册等待
    for l.writing || l.readers > 0 {
        l.cond.Wait()
    }
    l.writers--
    l.writing = true
    l.mu.Unlock()
}

func (l *WriterPreferredRWLock) Unlock() {
    l.mu.Lock()
    l.writing = false
    l.cond.Broadcast()
    l.mu.Unlock()
}
```

### sync.Cond vs Channel 选择

```go
// ✅ 适合用 Cond 的场景：
// - 需要 Broadcast（通知所有等待者）
// - 条件依赖共享状态（需持锁检查）
// - 需要写者优先等复杂调度策略
// - 等待者数量动态变化

// ✅ 适合用 Channel 的场景：
// - 传递数据（不只是信号）
// - 单一消费者（select 多路复用）
// - 需要超时 / context 取消

// 对比：广播通知
// Cond：
cond.Broadcast()  // 唤醒所有等待者（O(n)，精确）

// Channel（模拟广播）：
close(ch)         // 关闭通知（一次性，不可重置）
// 或者每个等待者一个独立 channel（维护复杂）
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 为什么 Wait 必须在 for 循环中使用？ | 防止**虚假唤醒**（spurious wakeup）：OS 可能在条件未满足时唤醒 goroutine；多消费者时其他 goroutine 可能抢先消费 |
| Signal 和 Broadcast 的区别？ | Signal 唤醒一个（FIFO，最先等待的）；Broadcast 唤醒所有；精确通知用 Signal，状态变化可能影响多个等待者用 Broadcast |
| Wait 内部做了什么？ | ① 原子加入等待队列 ② 释放关联锁 ③ 挂起 goroutine ④ 被唤醒后重新获取锁（必须按此顺序） |
| 为什么 sync.Cond 不能拷贝？ | 内部 `notifyList` 包含指针和状态，拷贝会导致两个 Cond 操作不同的等待队列，Signal 无法唤醒正确的 goroutine |
| Cond 和 Channel 如何选择？ | 需要 Broadcast / 条件依赖共享状态 → Cond；传递数据 / 需要 select / context 取消 → Channel |
| `sync.NewCond(&mu)` 和 `cond.L = &mu` 的区别？ | 等价；`sync.NewCond` 是工厂函数，直接设置 `L` 字段也可以（Cond.L 是公开字段）|
