---
title: log 源码精读
description: 精读 Go 标准库 log 包的实现，掌握 Logger 的锁机制、输出格式化、Fatal/Panic 行为与 log/slog 的演进关系。
---

# log：标准日志库源码精读

> 核心源码：`src/log/log.go`
>
> 图例参考：
> - `GoEngineeringDiagram`：`log-output-flow`、`slog-pipeline`

## 包结构图

```
log 包体系
══════════════════════════════════════════════════════════════════

  log.Logger（核心结构）
  ├── mu     sync.Mutex  ← 保护 buf 的并发写
  ├── prefix string      ← 每行日志前缀
  ├── flag   int         ← 控制时间/文件信息输出（位掩码）
  ├── out    io.Writer   ← 输出目标（默认 os.Stderr）
  └── buf    []byte      ← 格式化缓冲区（复用，减少 GC）

  Flag 位掩码（控制输出格式）：
  ├── Ldate         = 1 << 0  → 2009/11/10
  ├── Ltime         = 1 << 1  → 23:00:00
  ├── Lmicroseconds = 1 << 2  → 23:00:00.000000
  ├── Llongfile     = 1 << 3  → /full/path/to/file.go:23
  ├── Lshortfile    = 1 << 4  → file.go:23
  ├── LUTC          = 1 << 5  → 时间使用 UTC
  ├── Lmsgprefix    = 1 << 6  → prefix 移到 message 前
  └── LstdFlags     = Ldate | Ltime  ← 默认值

  包级函数（使用全局 std Logger）：
  ├── log.Print/Printf/Println  ← 普通日志
  ├── log.Fatal/Fatalf/Fatalln ← 打印后调用 os.Exit(1)
  └── log.Panic/Panicf/Panicln ← 打印后调用 panic(msg)

  演进：
  log（基础，无结构化）→ log/slog（结构化，Go 1.21+）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/log/log.go（简化）
type Logger struct {
    mu     sync.Mutex // 保护 buf 的并发安全
    prefix string
    flag   int
    out    io.Writer
    buf    []byte     // 复用 buffer，避免频繁分配
}

// 核心输出方法
func (l *Logger) Output(calldepth int, s string) error {
    now := time.Now()

    l.mu.Lock()
    defer l.mu.Unlock()

    l.buf = l.buf[:0] // 重置 buffer（不释放内存）

    // 1. 格式化 flag 信息（时间、文件名）
    l.formatHeader(&l.buf, now, file, line)

    // 2. 写入实际消息
    l.buf = append(l.buf, s...)
    if len(s) == 0 || s[len(s)-1] != '\n' {
        l.buf = append(l.buf, '\n') // 自动补换行
    }

    // 3. 一次性写入（减少系统调用次数）
    _, err := l.out.Write(l.buf)
    return err
}

// Fatal 的实现
func (l *Logger) Fatal(v ...any) {
    l.Output(2, fmt.Sprint(v...))
    os.Exit(1) // ← 直接退出，defer 不执行！
}

// Panic 的实现
func (l *Logger) Panic(v ...any) {
    s := fmt.Sprint(v...)
    l.Output(2, s)
    panic(s) // ← 触发 panic，defer 会执行
}
```
:::

<GoEngineeringDiagram kind="log-output-flow" />

---

## 二、代码示例

### 基础用法与 Flag 控制

::: details 点击展开代码：基础用法与 Flag 控制
```go
import "log"

func basics() {
    // 使用包级全局 logger（默认输出 os.Stderr）
    log.Println("这是普通日志")
    // 输出：2009/11/10 23:00:00 这是普通日志

    // 修改全局 flag
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
    log.Println("带文件信息")
    // 输出：2009/11/10 23:00:00 main.go:12: 带文件信息

    // 设置前缀
    log.SetPrefix("[APP] ")
    log.Println("带前缀")
    // 输出：[APP] 2009/11/10 23:00:00 带文件信息

    // 仅显示微秒时间（高频日志）
    log.SetFlags(log.Ltime | log.Lmicroseconds)
}
```
:::

### 自定义 Logger（多目标输出）

::: details 点击展开代码：自定义 Logger（多目标输出）
```go
func setupLoggers() (*log.Logger, *log.Logger, *log.Logger) {
    // 信息日志 → 标准输出
    infoLog := log.New(os.Stdout, "INFO  ", log.Ldate|log.Ltime|log.Lshortfile)

    // 错误日志 → 标准错误
    errorLog := log.New(os.Stderr, "ERROR ", log.Ldate|log.Ltime|log.Llongfile)

    // 写入文件
    f, _ := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
    fileLog := log.New(f, "FILE  ", log.LstdFlags)

    return infoLog, errorLog, fileLog
}

// 同时写入多个目标
func setupMultiWriter() *log.Logger {
    f, _ := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)

    // io.MultiWriter：同时写入 stdout 和文件
    multi := io.MultiWriter(os.Stdout, f)
    return log.New(multi, "", log.LstdFlags)
}
```
:::

### Fatal vs Panic 的使用场景

::: details 点击展开代码：Fatal vs Panic 的使用场景
```go
func useFatal() {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        // Fatal：致命错误，程序无法继续
        // ⚠️ os.Exit(1) 不会执行 defer，慎用！
        log.Fatalf("无法连接数据库: %v", err)
    }

    // defer db.Close() 在 Fatal 后不会执行！
    // 应该在 Fatal 之前做清理
    defer db.Close()
}

func usePanic() {
    // Panic：程序状态不一致，但允许 recover
    // defer 会执行（可以做清理）
    data := loadConfig()
    if data == nil {
        log.Panicf("配置文件为空，无法启动")
    }
}

// 最佳实践：main 函数中尽早处理 Fatal，其他地方返回 error
func main() {
    logger := log.New(os.Stderr, "", log.LstdFlags)

    cfg, err := loadConfig()
    if err != nil {
        logger.Fatalf("加载配置失败: %v", err) // 启动阶段可用
    }

    srv := newServer(cfg)
    if err := srv.Start(); err != nil {
        logger.Fatalf("启动服务失败: %v", err)
    }
}
```
:::

### 在 HTTP 中间件中集成

::: details 点击展开代码：在 HTTP 中间件中集成
```go
// 请求日志中间件
func loggingMiddleware(logger *log.Logger, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // 包装 ResponseWriter 以捕获状态码
        lrw := &loggingResponseWriter{ResponseWriter: w, statusCode: 200}
        next.ServeHTTP(lrw, r)

        logger.Printf("%s %s %d %v",
            r.Method, r.URL.Path, lrw.statusCode, time.Since(start))
    })
}

type loggingResponseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
    lrw.statusCode = code
    lrw.ResponseWriter.WriteHeader(code)
}
```
:::

### 从 log 迁移到 log/slog（Go 1.21+）

<GoEngineeringDiagram kind="slog-pipeline" />

::: details 点击展开代码：从 log 迁移到 log/slog（Go 1.21+）
```go
// 旧代码（log）
log.Printf("user login: id=%d name=%s", user.ID, user.Name)

// 新代码（log/slog）— 结构化，机器可读
slog.Info("user login",
    "user_id", user.ID,
    "name", user.Name,
)

// log/slog 完整配置
func setupSlog() {
    handler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
        // AddSource: true, // 添加文件/行信息
    })
    slog.SetDefault(slog.New(handler))
}

// 输出：{"time":"2024-01-01T00:00:00Z","level":"INFO","msg":"user login","user_id":42,"name":"Alice"}
```
:::

### 测试中捕获日志

::: details 点击展开代码：测试中捕获日志
```go
func TestMyFunc(t *testing.T) {
    // 将日志重定向到测试输出
    var buf bytes.Buffer
    logger := log.New(&buf, "", 0) // flag=0，无时间戳（方便断言）

    myFunc(logger)

    if !strings.Contains(buf.String(), "expected message") {
        t.Errorf("日志不含期望内容: %q", buf.String())
    }
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| log.Logger 为什么用 Mutex 而不是 channel？ | 日志写入是短暂同步操作；Mutex 比 channel 开销更低，且避免了额外的 goroutine |
| log.Fatal 和 log.Panic 的区别？ | Fatal → `os.Exit(1)`，defer 不执行；Panic → `panic()`，defer 执行，可被 recover |
| log.Logger 内部的 buf 有什么作用？ | 复用 `[]byte` 减少 GC 分配；每次 Output 重置 buf（`buf[:0]`）而不是重新分配 |
| 为什么 log 包默认输出到 os.Stderr？ | 日志是诊断信息，不是程序输出；分离标准输出（业务数据）和标准错误（诊断日志），方便运维管道处理 |
| 什么时候用 log，什么时候用 log/slog？ | 小工具/脚本用 `log`（简单）；生产服务用 `slog`（结构化、可接入 ELK/Loki 等日志系统） |
| log.SetOutput 线程安全吗？ | `SetOutput` 本身加锁（安全）；但并发调用 `SetOutput` 和 `Print` 会导致行为不确定（建议程序启动时一次性配置）|
