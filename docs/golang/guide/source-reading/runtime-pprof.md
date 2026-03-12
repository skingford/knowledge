---
title: runtime/pprof + net/http/pprof 源码精读
description: 精读 Go 性能剖析工具链，掌握 CPU/内存/goroutine Profile 采集、火焰图分析与生产环境持续剖析最佳实践。
---

# runtime/pprof + net/http/pprof：性能剖析源码精读

> 核心源码：`src/runtime/pprof/pprof.go`、`src/net/http/pprof/pprof.go`

## 包结构图

```
Go 性能剖析工具链
══════════════════════════════════════════════════════════════════

  Profile 类型（runtime/pprof）：
  ┌──────────────────┬────────────────────────────────────────┐
  │ Profile 名称     │ 内容                                   │
  ├──────────────────┼────────────────────────────────────────┤
  │ cpu              │ CPU 时间采样（每10ms一次，SIGPROF）    │
  │ heap             │ 堆内存分配（in-use/alloc，采样率512B） │
  │ goroutine        │ 所有 goroutine 的当前堆栈              │
  │ allocs           │ 所有内存分配（历史，含已回收）         │
  │ threadcreate     │ OS 线程创建堆栈                        │
  │ block            │ 阻塞事件（channel/mutex/syscall）      │
  │ mutex            │ mutex 竞争堆栈                         │
  └──────────────────┴────────────────────────────────────────┘

  采集方式：
  ├── 文件采集（runtime/pprof）
  │    pprof.StartCPUProfile(f) → ... → pprof.StopCPUProfile()
  │    pprof.WriteHeapProfile(f)
  │
  └── HTTP 接口（net/http/pprof）
       _ "net/http/pprof"  ← 仅需 import，自动注册路由
       GET /debug/pprof/           ← 总览页面
       GET /debug/pprof/goroutine  ← goroutine dump
       GET /debug/pprof/heap       ← 堆内存
       GET /debug/pprof/profile?seconds=30 ← CPU 30秒采样

  分析工具：
  go tool pprof cpu.prof              ← 交互式分析
  go tool pprof -http=:8081 cpu.prof  ← 浏览器火焰图
  go tool pprof http://host/debug/pprof/heap  ← 远程分析

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/runtime/pprof/pprof.go（简化）

// CPU Profile：通过 SIGPROF 信号定时采样
func StartCPUProfile(w io.Writer) error {
    // 写入 pprof 格式头部
    // 通知 runtime 开启 SIGPROF 定时器（默认 100Hz = 每10ms）
    // runtime 在 SIGPROF 中断时记录当前 goroutine 的调用栈
    return runtime.SetCPUProfileRate(100) // 100 次/秒
}

// Heap Profile：基于采样的内存分析
// runtime 在每分配 MemProfileRate（默认512KB）字节时记录一次调用栈
// WriteHeapProfile 输出当前内存 in-use 对象的聚合调用栈
func WriteHeapProfile(w io.Writer) error {
    return writeHeapProto(w, memProfile(), defaultSampleRate)
}
```

---

## 二、代码示例

### HTTP pprof 端点（生产最常用）

```go
import (
    "net/http"
    _ "net/http/pprof" // 副作用：自动注册 /debug/pprof/ 路由
)

func main() {
    // pprof 单独监听（避免暴露给公网）
    go func() {
        log.Println("pprof 监听 :6060")
        log.Fatal(http.ListenAndServe("localhost:6060", nil))
    }()

    // 正常业务服务
    http.ListenAndServe(":8080", businessHandler())
}

// 使用：
// CPU 剖析（30秒）：
//   go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
// 堆内存：
//   go tool pprof http://localhost:6060/debug/pprof/heap
// Goroutine dump：
//   curl http://localhost:6060/debug/pprof/goroutine?debug=2
```

### 文件采集 CPU Profile

```go
import (
    "os"
    "runtime/pprof"
)

func profileCPU(duration time.Duration, fn func()) error {
    f, err := os.Create("cpu.prof")
    if err != nil {
        return err
    }
    defer f.Close()

    if err := pprof.StartCPUProfile(f); err != nil {
        return err
    }
    defer pprof.StopCPUProfile() // ⚠️ 必须调用，否则 prof 文件不完整

    // 运行待分析的函数
    timer := time.NewTimer(duration)
    done := make(chan struct{})
    go func() {
        fn()
        close(done)
    }()

    select {
    case <-timer.C:
    case <-done:
    }
    return nil
}

// 使用：
// profileCPU(30*time.Second, func() { heavyWork() })
// go tool pprof -http=:8081 cpu.prof
```

### 堆内存与 Allocs Profile

```go
func captureHeapProfile(path string) error {
    f, err := os.Create(path)
    if err != nil {
        return err
    }
    defer f.Close()

    // 强制 GC 后采集（排除垃圾对象干扰）
    runtime.GC()
    return pprof.WriteHeapProfile(f)
}

// allocs profile：记录所有历史分配（包含已被 GC 回收的）
func captureAllocsProfile(path string) error {
    f, err := os.Create(path)
    if err != nil {
        return err
    }
    defer f.Close()

    return pprof.Lookup("allocs").WriteTo(f, 0)
}

// 分析差值：发现内存泄漏
// go tool pprof -base before.prof after.prof http://...
```

### 开启 Block 和 Mutex Profile

```go
func enableBlockMutexProfile() {
    // Block profile：记录 goroutine 阻塞事件
    // 参数=1：采样每个阻塞事件（生产中建议 100 以降低开销）
    runtime.SetBlockProfileRate(100)

    // Mutex profile：记录 mutex 竞争
    runtime.SetMutexProfileFraction(100)

    // 采集：
    // go tool pprof http://localhost:6060/debug/pprof/block
    // go tool pprof http://localhost:6060/debug/pprof/mutex
}
```

### 自定义 Profile（业务 Profile）

```go
// 自定义 Profile：追踪业务特定资源（如 DB 连接）
var dbConnProfile = pprof.NewProfile("db_connections")

func trackDBConn(conn *sql.Conn) {
    // 记录获取连接时的调用栈（skip=1 跳过本函数）
    dbConnProfile.Add(conn, 1)
}

func releaseDBConn(conn *sql.Conn) {
    dbConnProfile.Remove(conn)
}

// 查看：http://localhost:6060/debug/pprof/db_connections?debug=1
```

### 生产持续剖析（Continuous Profiling）

```go
// 定期采集并上传（用于 Pyroscope/Parca 等持续剖析平台）
func continuousProfiling(ctx context.Context, uploadFn func(name string, data []byte)) {
    ticker := time.NewTicker(60 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            // 采集 30s CPU profile
            var buf bytes.Buffer
            pprof.StartCPUProfile(&buf)
            time.Sleep(30 * time.Second)
            pprof.StopCPUProfile()
            uploadFn("cpu", buf.Bytes())

            // 采集当前堆 profile
            buf.Reset()
            runtime.GC()
            pprof.WriteHeapProfile(&buf)
            uploadFn("heap", buf.Bytes())
        }
    }
}
```

### pprof 分析工作流

```bash
# 1. 采集 CPU profile（30秒）
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 2. 交互式分析命令
(pprof) top10          # 按 CPU 时间排序前10
(pprof) top10 -cum     # 按累计时间排序（含被调函数）
(pprof) list funcName  # 查看具体函数行级耗时
(pprof) web            # 生成调用图（需 graphviz）

# 3. 火焰图（推荐）
go tool pprof -http=:8081 cpu.prof
# 浏览器访问 :8081，选择 Flame Graph 视图

# 4. 内存泄漏对比分析
go tool pprof -base heap_before.prof heap_after.prof
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| CPU Profile 的采样原理？ | runtime 设置 SIGPROF 定时信号（默认 100Hz），每次信号触发时记录当前运行 goroutine 的调用栈；采集时间越长数据越准确 |
| Heap Profile 和 Allocs Profile 的区别？ | Heap 只看当前存活对象（in-use 内存，GC 后有效）；Allocs 记录所有历史分配（含已回收），用于发现高分配率函数 |
| 为什么 pprof 应在独立端口暴露？ | `/debug/pprof` 会暴露内存数据、goroutine 堆栈等敏感信息；应仅监听 `localhost:6060`，禁止公网访问 |
| Block Profile 和 Mutex Profile 的开销？ | 默认不开启（rate=0）；Block rate=1 记录所有阻塞（开销大），rate=100 采样 1%（生产推荐）；Mutex 类似 |
| `top` 和 `top -cum` 的区别？ | `top` 按 flat 时间排序（函数自身执行时间，不含子调用）；`-cum` 按 cumulative 排序（含全部子调用时间，适合找调用链瓶颈） |
| 如何找内存泄漏？ | 间隔采集两次 heap profile → `go tool pprof -base before.prof after.prof` 查看增量 → 找增长的分配点 |
