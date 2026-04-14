---
title: os/signal 源码精读
description: 精读 os/signal 的信号处理实现，掌握优雅关闭、SIGHUP 配置重载、信号转发与 K8s Pod 终止流程最佳实践。
---

# os/signal：信号处理源码精读

> 核心源码：`src/os/signal/signal.go`、`src/os/signal/signal_unix.go`
>
> 图例参考：
> - `GoEngineeringDiagram`：`signal-notify-flow`
> - `GoNetworkDiagram`：`graceful-shutdown`

## 包结构图

```
os/signal 体系
══════════════════════════════════════════════════════════════════

  信号流转：
  OS Kernel → runtime 信号处理器 → signal.Notify → chan os.Signal

  核心 API：
  ├── signal.Notify(c chan<- os.Signal, sig ...os.Signal)
  │    └── 将指定信号路由到 channel c
  ├── signal.Stop(c chan<- os.Signal)
  │    └── 停止向 c 发送信号（取消 Notify）
  ├── signal.Reset(sig ...os.Signal)
  │    └── 恢复信号的默认行为（如 SIGPIPE 默认退出）
  ├── signal.Ignore(sig ...os.Signal)
  │    └── 忽略指定信号（SIGPIPE 常用）
  └── signal.NotifyContext(ctx, sig...) (ctx, cancel)
       └── 信号触发 context 取消（Go 1.16+，推荐）

  常用信号（Unix）：
  ├── syscall.SIGINT   ← Ctrl+C（2）
  ├── syscall.SIGTERM  ← kill 命令默认（15，K8s Pod 终止）
  ├── syscall.SIGHUP   ← 终端挂起（1，常用于触发配置重载）
  ├── syscall.SIGQUIT  ← Ctrl+\（3，带 goroutine dump 退出）
  └── syscall.SIGUSR1/2 ← 用户自定义信号

  内部机制：
  channel 必须有缓冲（建议 1）：
  └── 信号发送到 channel 时不阻塞，丢弃超出缓冲的信号

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/os/signal/signal.go（简化）

var handlers struct {
    mu      sync.Mutex
    m       map[os.Signal]*handler  // 信号 → 处理器映射
    ref     [numSig]int64           // 每个信号的订阅计数
    stopping []stopping
}

func Notify(c chan<- os.Signal, sig ...os.Signal) {
    handlers.mu.Lock()
    defer handlers.mu.Unlock()

    for _, s := range sig {
        h := handlers.m[s]
        if h == nil {
            h = new(handler)
            handlers.m[s] = h
            // 通知 runtime 开始捕获此信号（而非默认处理）
            if handlers.ref[signum(s)] == 0 {
                enableSignal(signum(s))
            }
            handlers.ref[signum(s)]++
        }
        h.set(c) // 将 channel 加入此信号的订阅列表
    }
}

// runtime 信号处理器收到信号后调用
func process(sig os.Signal) {
    h := handlers.m[sig]
    if h == nil { return }
    for _, c := range h.channels {
        select {
        case c <- sig:  // 非阻塞发送
        default:        // channel 满则丢弃（不阻塞 signal handler）
        }
    }
}
```
:::

<GoEngineeringDiagram kind="signal-notify-flow" />

---

## 二、代码示例

### 优雅关闭 HTTP 服务器

<GoNetworkDiagram kind="graceful-shutdown" />

::: details 点击展开代码：优雅关闭 HTTP 服务器
```go
import (
    "context"
    "net/http"
    "os"
    "os/signal"
    "syscall"
)

func gracefulServer() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", handler)

    server := &http.Server{
        Addr:    ":8080",
        Handler: mux,
    }

    // 在后台启动服务
    go func() {
        log.Println("服务启动在 :8080")
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("服务启动失败: %v", err)
        }
    }()

    // 等待终止信号（推荐方式：NotifyContext，Go 1.16+）
    ctx, stop := signal.NotifyContext(context.Background(),
        syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    <-ctx.Done() // 阻塞直到收到信号

    log.Println("收到关闭信号，开始优雅退出...")

    // 给存量请求 30 秒完成
    shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := server.Shutdown(shutdownCtx); err != nil {
        log.Printf("优雅关闭超时: %v", err)
    }
    log.Println("服务已关闭")
}
```
:::

### SIGHUP 触发配置热重载

::: details 点击展开代码：SIGHUP 触发配置热重载
```go
type Config struct {
    mu      sync.RWMutex
    current atomic.Pointer[AppConfig]
}

func (c *Config) Load(path string) error {
    var cfg AppConfig
    data, err := os.ReadFile(path)
    if err != nil {
        return err
    }
    if err := json.Unmarshal(data, &cfg); err != nil {
        return err
    }
    c.current.Store(&cfg)
    log.Printf("配置已重载: %+v", cfg)
    return nil
}

func (c *Config) Get() *AppConfig {
    return c.current.Load()
}

func watchConfig(cfg *Config, path string) {
    // ⚠️ channel 必须有缓冲
    sighup := make(chan os.Signal, 1)
    signal.Notify(sighup, syscall.SIGHUP)
    defer signal.Stop(sighup)

    for {
        <-sighup
        log.Println("收到 SIGHUP，重载配置...")
        if err := cfg.Load(path); err != nil {
            log.Printf("配置重载失败: %v", err)
        }
    }
}

// 触发：kill -HUP <pid>
```
:::

### 多信号处理（完整生产模板）

::: details 点击展开代码：多信号处理（完整生产模板）
```go
func runWithSignals(ctx context.Context, server *http.Server) error {
    // 启动服务
    errCh := make(chan error, 1)
    go func() {
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            errCh <- err
        }
    }()

    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh,
        syscall.SIGINT,   // Ctrl+C
        syscall.SIGTERM,  // K8s Pod 终止
        syscall.SIGQUIT,  // 带 goroutine dump 退出
        syscall.SIGHUP,   // 配置重载
    )
    defer signal.Stop(sigCh)

    for {
        select {
        case err := <-errCh:
            return fmt.Errorf("服务错误: %w", err)

        case sig := <-sigCh:
            switch sig {
            case syscall.SIGHUP:
                log.Println("重载配置...")
                reloadConfig()

            case syscall.SIGQUIT:
                // 打印所有 goroutine 堆栈后退出（调试用）
                buf := make([]byte, 1<<20)
                n := runtime.Stack(buf, true)
                log.Printf("Goroutine dump:\n%s", buf[:n])
                fallthrough

            case syscall.SIGINT, syscall.SIGTERM:
                log.Printf("收到 %s，优雅退出...", sig)
                shutCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
                defer cancel()
                return server.Shutdown(shutCtx)
            }

        case <-ctx.Done():
            return ctx.Err()
        }
    }
}
```
:::

### K8s Pod 终止流程（最佳实践）

::: details 点击展开代码：K8s Pod 终止流程（最佳实践）
```go
// K8s 终止流程：
// 1. Pod 状态 → Terminating
// 2. preStop hook 执行（可选 sleep）
// 3. SIGTERM 发送给进程（terminationGracePeriodSeconds=30）
// 4. 等待进程退出（最多 30s）
// 5. SIGKILL 强制终止

func k8sGracefulShutdown(server *http.Server) {
    // 在 /healthz 立即返回 503（让 LB 停止发流量）
    isShutdown := atomic.Bool{}

    mux := server.Handler.(*http.ServeMux)
    mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
        if isShutdown.Load() {
            http.Error(w, "shutting down", http.StatusServiceUnavailable)
            return
        }
        w.WriteHeader(http.StatusOK)
    })

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit

    // 立即标记为不健康（让 LB 摘除）
    isShutdown.Store(true)

    // 等待 LB 刷新（preStop 的作用）
    time.Sleep(5 * time.Second)

    // 优雅关闭（给存量请求完成时间）
    ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
    defer cancel()
    server.Shutdown(ctx)
}
```
:::

### 忽略 SIGPIPE（网络服务常用）

::: details 点击展开代码：忽略 SIGPIPE（网络服务常用）
```go
func init() {
    // 网络服务中，客户端断开连接时会产生 SIGPIPE
    // 默认行为是进程退出，应忽略并在 Write 时返回错误
    signal.Ignore(syscall.SIGPIPE)
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 为什么 `signal.Notify` 的 channel 必须有缓冲？ | 信号处理在非阻塞发送；channel 满则丢弃信号，不阻塞信号处理器；建议缓冲大小 1 |
| `signal.NotifyContext` 相比 `signal.Notify` 的优势？ | 与 context 深度集成，context 取消后自动 Stop；无需手动管理 channel 生命周期；推荐 Go 1.16+ 使用 |
| K8s 中 SIGTERM 后为什么要 sleep？ | Endpoints 控制器摘除 Pod IP 和 SIGTERM 不同步；sleep 5s 确保 LB 停止发新请求后再关闭处理存量请求 |
| SIGKILL 能被捕获吗？ | 不能。SIGKILL 和 SIGSTOP 是内核级别的，进程无法捕获、忽略或阻塞；其他信号均可用 signal.Notify 捕获 |
| SIGQUIT 的特殊用途？ | 默认行为是终止进程并生成 core dump；在 Go 中常用于触发 goroutine dump（runtime.Stack），调试 goroutine 泄漏 |
| `signal.Stop` 什么时候必须调用？ | 每次 `signal.Notify` 后，当不再需要接收信号时调用 Stop，防止 channel 未被消费导致 goroutine 泄漏 |
