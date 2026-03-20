---
title: context 包源码精读
description: 精读 context.Context 接口与四种实现（emptyCtx、cancelCtx、timerCtx、valueCtx）。
---

# context 包：上下文传播源码精读

> 源码路径：`src/context/context.go`（约 600 行）
>
> 图例参考：复用 [Channel、Select 与 Context](../03-channel-select-context.md) 里的取消树图例，先看 `cancelCtx` 的父子传播关系，再回头理解 `propagateCancel` 和 `Done()`。

## 包结构图

<GoChannelDiagram kind="context-tree" />

```
context 包结构
══════════════════════════════════════════════════════════════

  Context（接口）
  ├── emptyCtx        ← Background() / TODO() 返回值
  ├── cancelCtx       ← WithCancel() 返回值
  │   └── timerCtx    ← WithDeadline() / WithTimeout() 返回值
  └── valueCtx        ← WithValue() 返回值

  取消树结构（cancelCtx 形成树）：
        Background
            │
       cancelCtx(A)
       ╱          ╲
  cancelCtx(B)   timerCtx(C)
       │
  valueCtx(D)  ← 叶节点，不参与取消树

══════════════════════════════════════════════════════════════
```

---

## 一、Context 接口

```go
// src/context/context.go
type Context interface {
    // 返回截止时间（ok=false 表示无截止时间）
    Deadline() (deadline time.Time, ok bool)

    // 取消时关闭的 channel（不可取消则返回 nil）
    Done() <-chan struct{}

    // 取消原因：context.Canceled 或 context.DeadlineExceeded
    Err() error

    // 获取绑定的值（key 用自定义类型防止碰撞）
    Value(key any) any
}
```

---

## 二、四种实现对比

```
┌──────────────────────────────────────────────────────────────────┐
│              四种 Context 实现对比                               │
│                                                                  │
│  emptyCtx   ─── 空实现，Deadline/Done/Err 均返回零值            │
│               └─ Background()、TODO() 底层类型                   │
│                                                                  │
│  cancelCtx  ─── 核心实现，维护子节点引用、done channel          │
│  ┌─────────────────────────────────────────┐                     │
│  │  Context   ← 父节点引用                 │                     │
│  │  mu        Mutex                        │                     │
│  │  done      atomic.Value (chan struct{}) │                     │
│  │  children  map[canceler]struct{}        │← 子节点集合         │
│  │  err       error                        │                     │
│  │  cause     error                        │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  timerCtx   ─── 嵌入 cancelCtx，额外含 timer 和 deadline        │
│  ┌─────────────────────────────────────────┐                     │
│  │  cancelCtx ← 继承取消能力              │                     │
│  │  timer     *time.Timer                  │← 到期自动取消       │
│  │  deadline  time.Time                    │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
│  valueCtx   ─── 链表节点，Value() 沿链向上查找                  │
│  ┌─────────────────────────────────────────┐                     │
│  │  Context   ← 父节点                    │                     │
│  │  key, val  any                          │                     │
│  └─────────────────────────────────────────┘                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 三、取消传播机制

```
WithCancel 创建流程
══════════════════════════════════════════════════════

  WithCancel(parent)
       │
       ▼
  创建 cancelCtx{Context: parent}
       │
       ▼
  propagateCancel(parent, child)
       │
       ├── parent 已取消 → 立即取消 child
       │
       ├── parent 是 cancelCtx → 直接注册到 parent.children
       │
       └── parent 是其他类型 → 启动 goroutine 监听 parent.Done()

  cancel() 调用时：
       │
       ▼
  关闭 done channel（原子操作，只关闭一次）
       │
       ▼
  遍历 children → 递归 cancel() 所有子节点
       │
       ▼
  从 parent.children 移除自身

══════════════════════════════════════════════════════
```

### Value 查找路径

```
valueCtx.Value(key) 查找链
══════════════════════════════════════════════

  valueCtx(D, key="traceID")
      │  Value("userID") → 不匹配，向上
      ▼
  valueCtx(C, key="userID")
      │  Value("userID") → 匹配，返回值
      ▼
  （不继续向上）

  时间复杂度：O(n)，n 为链深度
  → 避免将大量值存 context，影响查找性能

══════════════════════════════════════════════
```

---

## 四、代码示例

### 基本取消

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel() // 确保资源释放

    go worker(ctx)

    time.Sleep(2 * time.Second)
    cancel() // 通知 worker 停止
}

func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("stopped:", ctx.Err())
            return
        default:
            fmt.Println("working...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}
```

### 超时控制

```go
func queryDB(ctx context.Context) error {
    // 覆盖父 ctx，设置最长 500ms
    ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
    defer cancel()

    done := make(chan error, 1)
    go func() {
        done <- db.Query(ctx) // 传 ctx 给 DB 驱动
    }()

    select {
    case err := <-done:
        return err
    case <-ctx.Done():
        return ctx.Err() // context.DeadlineExceeded
    }
}
```

### 安全传值（避免 key 碰撞）

```go
// 用私有类型作 key，防止不同包之间 key 碰撞
type ctxKey string

const traceIDKey ctxKey = "traceID"

func WithTraceID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, traceIDKey, id)
}

func TraceID(ctx context.Context) string {
    v, _ := ctx.Value(traceIDKey).(string)
    return v
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 父 ctx 取消，子会取消吗？ | 会，cancelCtx.cancel() 递归取消所有子节点 |
| 子 ctx 取消，父会取消吗？ | 不会，取消只向下传播 |
| context 可以存大对象吗？ | 不建议，Value 查找是 O(n) 链表遍历 |
| Done() 为什么是 channel 而非回调？ | 支持 select 多路复用，Go 的惯用法 |
| context 线程安全吗？ | 是，cancelCtx 内部有 mutex 保护 |
| WithTimeout vs WithDeadline？ | Timeout=当前时间+duration，Deadline=绝对时间点 |
