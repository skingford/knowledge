---
title: Channel 源码精读
description: 精读 runtime/chan.go，理解 hchan 结构、有缓冲与无缓冲 channel 的发送/接收机制及 sudog 等待队列。
---

# Channel：runtime/chan.go 源码精读

> 核心源码：`src/runtime/chan.go`（约 1000 行）
>
> 图例参考：复用 [Channel、Select 与 Context](../03-channel-select-context.md) 和已有内部结构图，把 `hchan`、缓冲区、中断唤醒、`select` 先看成流程，再回到 `runtime/chan.go` 里的分支判断。

## 包结构图

<GoInternalsDiagram kind="channel-hchan" />

```
Channel 内部结构概览
══════════════════════════════════════════════════════════════════

  make(chan T, N) 创建的 hchan
  ┌─────────────────────────────────────────────────────────────┐
  │                        hchan                                │
  │                                                             │
  │  qcount   uint   ← 当前缓冲区元素数                         │
  │  dataqsiz uint   ← 缓冲区容量（make 时的 N）                │
  │  buf      *[]T   ← 环形缓冲区（dataqsiz==0 时为 nil）       │
  │  elemsize uint16 ← 元素大小（字节）                         │
  │  closed   uint32 ← 0=开放，1=已关闭                         │
  │  elemtype *_type ← 元素类型信息                             │
  │  sendx    uint   ← 发送索引（环形队列写指针）               │
  │  recvx    uint   ← 接收索引（环形队列读指针）               │
  │  recvq    waitq  ← 阻塞中的接收方 goroutine 队列            │
  │  sendq    waitq  ← 阻塞中的发送方 goroutine 队列            │
  │  lock     mutex  ← 保护所有字段的互斥锁                     │
  │                                                             │
  │  waitq = { first *sudog; last *sudog }                      │
  └─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、sudog：等待者节点

```
┌──────────────────────────────────────────────────────┐
│                      sudog                           │
│                                                      │
│  g        *g       ← 被阻塞的 goroutine              │
│  elem     ptr      ← 发送/接收的数据地址             │
│  c        *hchan   ← 关联的 channel                  │
│  next/prev *sudog  ← 等待队列双向链表指针             │
│  isSelect bool     ← 是否在 select 语句中            │
│  success  bool     ← 是否因数据完成（vs 关闭）唤醒  │
│                                                      │
│  池化：sudog 从 acquireSudog() 取，用完 releaseSudog()│
└──────────────────────────────────────────────────────┘
```

---

## 二、发送（chansend）流程

```
c <- v  的底层流程（chansend）
══════════════════════════════════════════════════════════════════

  chansend(c, ep, block=true)
       │
       ├─ c == nil ─────────────────────────────→ 永久阻塞（block=true）
       │                                           直接 return false（block=false）
       ├─ c.closed != 0 ─────────────────────────→ panic: send on closed channel
       │
       ├─ 快速路径：recvq 非空（有等待的接收方）
       │       └── 直接将数据拷贝到等待方的栈/地址
       │           唤醒等待的 goroutine → 返回
       │           （绕过缓冲区，零拷贝传递）
       │
       ├─ 缓冲区有空间（qcount < dataqsiz）
       │       └── 数据写入 buf[sendx]
       │           sendx = (sendx+1) % dataqsiz
       │           qcount++  → 返回
       │
       └─ 缓冲区满（或无缓冲）
               └── block=false → 返回 false（非阻塞模式）
                   block=true  →
                   1. 构造 sudog，elem 指向发送数据
                   2. 将 sudog 入 sendq
                   3. gopark()：挂起当前 goroutine
                   4. 被接收方唤醒后继续

══════════════════════════════════════════════════════════════════
```

---

## 三、接收（chanrecv）流程

```
v = <-c  /  v, ok = <-c  的底层流程（chanrecv）
══════════════════════════════════════════════════════════════════

  chanrecv(c, ep, block=true)
       │
       ├─ c == nil ─────────────────────────────→ 永久阻塞（block=true）
       │
       ├─ 快速路径：c 已关闭且缓冲区为空
       │       └── 返回零值，ok=false
       │
       ├─ sendq 非空（有等待的发送方）
       │       ├── 无缓冲 channel：直接从发送方栈拷贝数据，唤醒发送方
       │       └── 有缓冲且满：从 buf[recvx] 读数据，将发送方数据写入 buf，唤醒发送方
       │
       ├─ 缓冲区有数据（qcount > 0）
       │       └── 从 buf[recvx] 读取
       │           recvx = (recvx+1) % dataqsiz
       │           qcount--  → 返回
       │
       └─ 缓冲区空
               └── block=false → 返回 false
                   block=true  →
                   1. 构造 sudog，elem 指向接收目标地址
                   2. 将 sudog 入 recvq
                   3. gopark()：挂起当前 goroutine
                   4. 被发送方唤醒后继续

══════════════════════════════════════════════════════════════════
```

---

## 四、关闭（closechan）流程

<GoChannelDiagram kind="channel-close" />

```
close(c) 流程
══════════════════════════════════════════════════════

  closechan(c)
       │
       ├─ c == nil    → panic: close of nil channel
       ├─ c.closed != 0 → panic: close of closed channel
       │
       ▼
  lock(&c.lock)
  c.closed = 1
       │
       ▼
  收集 recvq 中所有等待接收的 sudog
  ├── 将这些 goroutine 的接收结果设为零值
  └── ok = false
       │
       ▼
  收集 sendq 中所有等待发送的 sudog
  └── 这些 goroutine 会 panic（发送到已关闭 channel）
       │
       ▼
  unlock → 批量 goready() 唤醒所有阻塞的 goroutine

══════════════════════════════════════════════════════
```

---

## 五、无缓冲 vs 有缓冲对比

<GoChannelDiagram kind="buffered-vs-unbuffered" />

```
┌────────────────────────────────────────────────────────────┐
│           无缓冲 channel（make(chan T)）                    │
│                                                            │
│  发送方和接收方必须同时就绪（同步握手）                     │
│  数据直接从发送方栈复制到接收方栈（零拷贝，无 buf 中转）   │
│  适合：同步信号、goroutine 协调                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│           有缓冲 channel（make(chan T, N)）                 │
│                                                            │
│  发送方：缓冲未满时不阻塞                                   │
│  接收方：缓冲非空时不阻塞                                   │
│  数据经 buf 中转（环形队列）                                │
│  适合：生产者消费者解耦、限流（令牌桶）                     │
└────────────────────────────────────────────────────────────┘
```

---

## 六、select 的实现原理

<GoChannelDiagram kind="select-flow" />

```
select 内部（runtime/select.go）
══════════════════════════════════════════════════════

  编译器将 select 转换为 selectgo() 调用

  selectgo() 流程：
  1. 对所有 case 涉及的 channel 按地址排序并加锁（防死锁）
  2. 遍历所有 case，检查是否有立即可执行的（ready 状态）
     ├── 有 ready case → 随机选一个执行 → 解锁所有 → 返回
  3. 无 ready case：
     ├── 在所有 channel 上注册 sudog（等待队列）
     ├── gopark() 挂起当前 goroutine
  4. 被某个 channel 唤醒后：
     ├── 从其他 channel 的等待队列撤出 sudog
     └── 执行对应 case

  default 关键字：跳过步骤3，没有 ready 则走 default

══════════════════════════════════════════════════════
```

---

## 七、代码示例

### 超时控制

::: details 点击展开代码：超时控制
```go
func doWork(ctx context.Context) (string, error) {
    resultCh := make(chan string, 1)

    go func() {
        result := heavyCompute()
        resultCh <- result // 有缓冲，即使超时也不泄漏 goroutine
    }()

    select {
    case result := <-resultCh:
        return result, nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func heavyCompute() string { return "done" }
```
:::

### 信号量限流

::: details 点击展开代码：信号量限流
```go
// channel 作信号量：最多 N 个并发
func parallelLimit(tasks []func(), limit int) {
    sem := make(chan struct{}, limit)
    var wg sync.WaitGroup

    for _, task := range tasks {
        wg.Add(1)
        sem <- struct{}{} // 占槽（满了会阻塞）
        go func(t func()) {
            defer wg.Done()
            defer func() { <-sem }() // 释放槽
            t()
        }(task)
    }
    wg.Wait()
}
```
:::

### 广播关闭

::: details 点击展开代码：广播关闭
```go
type Server struct {
    quit chan struct{}
}

func (s *Server) Shutdown() {
    close(s.quit) // 关闭：所有接收方同时感知到
}

func (s *Server) worker() {
    for {
        select {
        case <-s.quit:
            return // 被广播关闭
        default:
            s.doWork()
        }
    }
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 发送到 nil channel 会怎样？ | 永久阻塞（block=true），非阻塞模式直接返回 false |
| 关闭 nil channel 会怎样？ | panic |
| 接收已关闭且空的 channel？ | 立即返回零值，ok=false |
| 无缓冲 channel 数据如何传递？ | 直接从发送方栈拷贝到接收方栈，不经过 buf |
| select 多个 case 都 ready？ | 随机选择一个（伪随机，防饥饿） |
| 有缓冲 channel 缓冲区是什么？ | 环形队列，sendx/recvx 是读写指针 |
