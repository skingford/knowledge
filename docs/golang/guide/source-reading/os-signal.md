---
title: os/signal 源码精读
description: 精读 os/signal 的信号分发机制，理解 Notify/Stop/NotifyContext 实现与优雅关闭的最佳实践。
---

# os/signal：信号处理源码精读

> 核心源码：`src/os/signal/signal.go`、`src/os/signal/signal_unix.go`、`src/runtime/signal_*.go`

## 包结构图

```
os/signal 信号处理全景
══════════════════════════════════════════════════════════════════

  操作系统
  ├── SIGINT  (Ctrl+C，2)      ← 用户中断
  ├── SIGTERM (kill，15)       ← 优雅终止（Docker/K8s 停止容器）
  ├── SIGKILL (kill -9，9)     ← 强制终止（无法捕获/忽略）
  ├── SIGHUP  (1)              ← 终端关闭/重载配置
  ├── SIGUSR1/SIGUSR2 (10/12) ← 用户自定义信号
  └── SIGPIPE (13)             ← 写入断开的管道

  Go runtime 信号处理层：
  ├── 内部信号（不可拦截）：SIGSEGV, SIGBUS, SIGFPE ← 触发 panic
  └── 可转发信号 → os/signal 分发

  os/signal API：
  ├── signal.Notify(ch, sig...)       ← 注册：信号→channel
  ├── signal.Stop(ch)                 ← 取消注册
  ├── signal.Reset(sig...)            ← 恢复默认处理
  ├── signal.Ignore(sig...)           ← 忽略信号
  └── signal.NotifyContext(ctx, sig.) ← Go 1.16+，推荐

  内部分发机制：
  OS Signal → runtime sighandler
                    │
                    ▼
             signal_recv()（运行时循环）
                    │
                    ▼
             process()（os/signal 层）
                    │
               遍历 handlers 表
                    │
             → 向注册的 channel 发送

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/os/signal/signal.go（简化）

// 全局处理器注册表（signal.Notify 写入，process 读取）
var handlers struct {
    mu       sync.Mutex
    m        map[chan<- os.Signal]*handler // channel → 信号集合
    ref      [numSig]int64                // 每个信号的引用计数
    stopping []stopping                   // 待停止的 channel
}

func Notify(c chan<- os.Signal, sig ...os.Signal) {
    if cap(c) == 0 {
        panic("os/signal: channel not buffered")
    }
    handlers.mu.Lock()
    defer handlers.mu.Unlock()
    h := handlers.m[c]
    if h == nil {
        h = new(handler)
        handlers.m[c] = h
    }
    for _, s := range sig {
        // 引用计数 +1，首次注册时通知 runtime 开始转发
        if handlers.ref[s]++ == 0 {
            enableSignal(s) // → runtime.signal_enable
        }
        h.set(s)
    }
}

// 分发循环（独立 goroutine）
func loop() {
    for {
        process(recv()) // recv() 阻塞等待 runtime 送来的信号
    }
}

func process(sig os.Signal) {
    handlers.mu.Lock()
    defer handlers.mu.Unlock()
    for c, h := range handlers.m {
        if h.want(sig) {
            // 非阻塞发送：丢弃而非阻塞（channel 必须有缓冲！）
            select {
            case c <- sig:
            default: // ← 丢弃：consumer 太慢时不阻塞分发
            }
        }
    }
}
```

---

## 二、NotifyContext 实现（Go 1.16+）

```go
// src/os/signal/signal.go
func NotifyContext(parent context.Context, signals ...os.Signal) (
    ctx context.Context, stop context.CancelFunc) {

    c := newSignalCtx(parent, signals...)
    c.ch = make(chan os.Signal, 1) // 内部缓冲 channel
    Notify(c.ch, signals...)

    go func() {
        select {
        case <-c.ch:
            c.cancel() // 收到信号 → 取消 context
        case <-c.Done():
        }
    }()

    return c, func() {
        Stop(c.ch)   // 取消注册
        c.cancel()   // 取消 context
    }
}
```

---

## 三、代码示例

### 优雅关闭（经典写法）

```go
func main() {
    srv := &http.Server{Addr: ":8080"}

    // 启动服务
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    // 等待终止信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    log.Println("正在关闭服务器...")

    // 30 秒超时优雅关闭
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("强制关闭:", err)
    }
    log.Println("服务器已退出")
}
```

### NotifyContext（推荐，Go 1.16+）

```go
func main() {
    // 一行替代 make chan + signal.Notify
    ctx, stop := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer stop() // 确保注册被取消

    srv := &http.Server{Addr: ":8080"}
    go srv.ListenAndServe()

    // 阻塞直到信号或父 context 取消
    <-ctx.Done()
    stop() // 立即释放信号资源（可选，defer 也会执行）

    log.Println("收到信号:", ctx.Err())

    shutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(shutCtx)
}
```

### 多信号差异化处理

```go
func main() {
    sigs := make(chan os.Signal, 1)
    signal.Notify(sigs,
        syscall.SIGINT,
        syscall.SIGTERM,
        syscall.SIGHUP,  // 热重载配置
        syscall.SIGUSR1, // 触发 pprof dump
    )

    for sig := range sigs {
        switch sig {
        case syscall.SIGHUP:
            log.Println("热重载配置...")
            reloadConfig()
        case syscall.SIGUSR1:
            log.Println("触发 goroutine dump...")
            dumpGoroutines()
        case syscall.SIGINT, syscall.SIGTERM:
            log.Println("开始优雅关闭...")
            gracefulShutdown()
            return
        }
    }
}
```

### 带超时的优雅关闭（生产级）

```go
type Server struct {
    http    *http.Server
    grpc    *grpc.Server
    cleanup []func() error // 数据库连接、消息队列等
}

func (s *Server) Run() error {
    ctx, stop := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    errCh := make(chan error, 1)
    go func() { errCh <- s.http.ListenAndServe() }()

    select {
    case err := <-errCh:
        return err
    case <-ctx.Done():
        return s.shutdown()
    }
}

func (s *Server) shutdown() error {
    log.Println("开始优雅关闭，超时 30s")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    var eg errgroup.Group
    eg.Go(func() error { return s.http.Shutdown(ctx) })
    eg.Go(func() error {
        s.grpc.GracefulStop()
        return nil
    })
    for _, fn := range s.cleanup {
        fn := fn
        eg.Go(fn)
    }
    return eg.Wait()
}
```

### 单测中重置信号处理

```go
func TestGracefulShutdown(t *testing.T) {
    // 测试完成后恢复默认处理
    defer signal.Reset(syscall.SIGTERM)

    done := make(chan struct{})
    go func() {
        ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM)
        defer stop()
        <-ctx.Done()
        close(done)
    }()

    // 向自身发送信号
    syscall.Kill(syscall.Getpid(), syscall.SIGTERM)

    select {
    case <-done:
        // ok
    case <-time.After(time.Second):
        t.Fatal("timeout waiting for signal")
    }
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| signal.Notify 为什么要求 buffered channel？ | 分发采用非阻塞 send（`select default`），无缓冲会导致信号丢弃；建议 cap=1 |
| SIGKILL 能被捕获吗？ | 不能，内核直接终止进程，Go 无法注册处理器 |
| NotifyContext 和 Notify 的区别？ | NotifyContext 将信号转为 context 取消，与 context 生态无缝集成，是 Go 1.16+ 推荐写法 |
| 优雅关闭的超时应该设多少？ | 通常 15~30s；K8s 默认 terminationGracePeriodSeconds=30，要低于这个值 |
| signal.Stop 和 signal.Reset 的区别？ | Stop 取消 channel 注册（不影响其他 channel）；Reset 恢复信号默认行为（所有处理器） |
| 多个 goroutine 同时 Notify 同一 channel 会怎样？ | 安全；内部有锁；但建议每个 channel 只在一处 Notify |
