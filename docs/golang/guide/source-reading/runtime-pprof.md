---
title: runtime/pprof 源码精读
description: 精读 Go runtime/pprof 的剖析数据采集机制，理解 CPU/内存/goroutine profile 的实现原理与生产调优实践。
---

# runtime/pprof：性能剖析源码精读

> 核心源码：`src/runtime/pprof/pprof.go`、`src/runtime/cpuprof.go`、`src/net/http/pprof/pprof.go`

## 包结构图

```
pprof 生态全景
══════════════════════════════════════════════════════════════════

  数据采集层
  ├── runtime/pprof        ← 核心采集（写入 pprof 格式）
  │     ├── StartCPUProfile / StopCPUProfile  ← CPU 采样
  │     ├── WriteHeapProfile                  ← 堆内存快照
  │     └── Lookup("goroutine"/"mutex"/...)   ← 其他 profile
  │
  └── net/http/pprof        ← HTTP 接口（import _ 注册）
        ├── /debug/pprof/           ← 列表页
        ├── /debug/pprof/profile    ← CPU profile（30s 采样）
        ├── /debug/pprof/heap       ← 堆内存 profile
        ├── /debug/pprof/goroutine  ← goroutine 栈
        ├── /debug/pprof/mutex      ← 锁竞争
        ├── /debug/pprof/block      ← 阻塞（channel/select）
        └── /debug/pprof/allocs     ← 内存分配（包含已释放）

  分析工具层
  ├── go tool pprof          ← 命令行交互分析
  │     ├── top / top10      ← 热点函数
  │     ├── list <func>      ← 源码行级标注
  │     ├── web              ← 打开火焰图（svg）
  │     └── -http=:8080      ← Web UI 可视化
  └── go tool trace          ← 执行追踪（更细粒度）

══════════════════════════════════════════════════════════════════
```

---

## 一、CPU Profile 采集原理

```
CPU Profile 工作机制（SIGPROF 采样）
══════════════════════════════════════════════════════════════════

  StartCPUProfile(w)
       │
       ├── 设置 ITIMER_PROF（默认 100Hz = 10ms 采样一次）
       ├── 注册 SIGPROF 信号处理器
       └── 启动后台 goroutine 写 pprof 数据

  每 10ms：
       OS 发送 SIGPROF 信号
            ↓
       runtime.sigprofNonGo / sigprofHandler
            ├── 暂停当前 goroutine（采样点）
            ├── 调用 runtime.callers() 获取调用栈
            │       → 最多 64 帧（可配置）
            └── 写入 cpuprof.log（环形缓冲区）

  StopCPUProfile()
       ├── 清除定时器和信号处理
       └── 将 cpuprof.log 编码为 pprof protobuf 格式写入 w

  pprof 格式：
  ├── 调用栈 → 压缩存储（地址 → 函数名 + 行号）
  └── 采样计数（times=出现次数 → 换算为 CPU 时间）

══════════════════════════════════════════════════════════════════
```

---

## 二、Heap Profile 采集原理

```
Heap Profile 数据来源
══════════════════════════════════════════════════════════════════

  runtime.MemProfileRate（默认 512KB）
       │
       └── 每分配 ~512KB，记录一次调用栈 + 已分配/已释放计数

  WriteHeapProfile(w)
       │
       ├── runtime.MemProfile(records, inuseZero)
       │       → 读取 runtime 内部的 MemProfileRecord 表
       │       → 每条记录：调用栈 + AllocBytes/FreeBytes/AllocObjects/FreeObjects
       │
       └── 编码为 pprof 格式输出

  Profile 类型：
  ├── heap（default）   → 当前在用内存（inuse_space）
  ├── allocs           → 所有历史分配（含已释放）
  └── inuse_objects    → 当前在用对象数（不含大小）

══════════════════════════════════════════════════════════════════
```

---

## 三、Goroutine Profile

```go
// 获取所有 goroutine 的调用栈
p := pprof.Lookup("goroutine")
p.WriteTo(w, 1) // debug=1: 文本格式，debug=2: 详细文本，debug=0: pprof 格式

// runtime.Stack（简单版本，无需 pprof）
buf := make([]byte, 1<<20)
n := runtime.Stack(buf, true) // true=所有 goroutine
fmt.Printf("%s", buf[:n])
```

```
Goroutine profile 输出示例
══════════════════════════════════════════════════════════════════

  goroutine 1 [running]:
  main.main()
          /app/main.go:42 +0x5e

  goroutine 6 [chan receive, 30 minutes]:
  main.worker(0xc000018060)
          /app/worker.go:15 +0x8a

  goroutine 8 [select]:
  net.(*netFD).connect(...)
          /usr/local/go/src/net/fd_unix.go:121 +0x1d5

  状态说明：
  ├── running     → 正在运行
  ├── chan receive → 等待 channel 接收
  ├── chan send    → 等待 channel 发送
  ├── select      → 阻塞在 select
  ├── syscall     → 系统调用中
  ├── sleep       → time.Sleep
  └── IO wait     → 等待网络 I/O

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 程序内嵌 pprof（生产推荐）

```go
import (
    "net/http"
    _ "net/http/pprof" // 仅 import，自动注册 /debug/pprof/ 路由
)

func main() {
    // 在独立端口启动 pprof HTTP 服务（不暴露到外网！）
    go func() {
        log.Println(http.ListenAndServe("localhost:6060", nil))
    }()

    // 正常业务逻辑...
    runServer()
}
```

```bash
# 采集 30 秒 CPU profile
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30

# 采集堆内存快照
go tool pprof http://localhost:6060/debug/pprof/heap

# 查看 goroutine 堆栈
curl http://localhost:6060/debug/pprof/goroutine?debug=2

# 采集锁竞争（需先开启）
# runtime.SetMutexProfileFraction(1)
go tool pprof http://localhost:6060/debug/pprof/mutex
```

### 基准测试中的 Profile

```go
// go test -bench=BenchmarkXxx -cpuprofile=cpu.out -memprofile=mem.out
func BenchmarkProcess(b *testing.B) {
    for i := 0; i < b.N; i++ {
        process(data)
    }
}
```

```bash
# 分析 CPU
go tool pprof cpu.out
(pprof) top10        # 查看 top 10 耗时函数
(pprof) list process # 查看 process 函数源码行级耗时
(pprof) web          # 打开 SVG 火焰图（需安装 graphviz）

# Web UI 分析（推荐）
go tool pprof -http=:8080 cpu.out
```

### 手动采集 profile（集成测试 / 脚本）

```go
func profileCPU(duration time.Duration, filename string) error {
    f, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer f.Close()

    if err := pprof.StartCPUProfile(f); err != nil {
        return err
    }
    defer pprof.StopCPUProfile()

    // 执行要分析的代码
    time.Sleep(duration) // 实际应运行业务代码
    return nil
}

func profileHeap(filename string) error {
    f, err := os.Create(filename)
    if err != nil {
        return err
    }
    defer f.Close()

    runtime.GC() // 采集前强制 GC，使结果更准确
    return pprof.WriteHeapProfile(f)
}
```

### 开启锁竞争和阻塞 profile

```go
func init() {
    // 锁竞争 profile（1=100% 采样，N=1/N 采样）
    runtime.SetMutexProfileFraction(1)

    // 阻塞 profile（ns 为采样阈值，1=全部阻塞事件）
    runtime.SetBlockProfileRate(1)
}
```

### 内存泄漏定位流程

```bash
# 1. 采集两次 heap profile（间隔一段时间）
curl -o heap1.out http://localhost:6060/debug/pprof/heap
# ... 等待一段时间 ...
curl -o heap2.out http://localhost:6060/debug/pprof/heap

# 2. 对比两个 profile（找增量）
go tool pprof -base heap1.out heap2.out

# 3. 查看增长最快的分配点
(pprof) top
(pprof) list <函数名>
```

---

## 五、常用 pprof 命令速查

```
go tool pprof 常用命令
══════════════════════════════════════════════════════════════════

  交互模式命令：
  top [N]          ← 热点函数（默认 top10）
  top -cum         ← 按累计时间排序（含调用链）
  list <funcname>  ← 源码行级标注
  web              ← 生成 SVG 调用图（需 graphviz）
  weblist <func>   ← 带源码的 SVG
  disasm <func>    ← 汇编级分析
  peek <func>      ← 查看调用者/被调用者
  tree             ← 文本调用树

  采样类型切换（Heap profile）：
  (pprof) sample_index=inuse_space    ← 当前占用内存（默认）
  (pprof) sample_index=inuse_objects  ← 当前占用对象数
  (pprof) sample_index=alloc_space    ← 历史分配总量
  (pprof) sample_index=alloc_objects  ← 历史分配总对象数

══════════════════════════════════════════════════════════════════
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| CPU profile 是怎么采样的？ | SIGPROF 信号（100Hz），每 10ms 中断当前 goroutine 并记录调用栈 |
| Heap profile 的 MemProfileRate 是什么？ | 控制采样频率；默认每 512KB 分配记录一次；=1 记录所有分配（开销大）|
| net/http/pprof 如何注册路由？ | import _ 时 init() 调用 http.HandleFunc 注册 /debug/pprof/ 系列路由 |
| goroutine profile 的 "chan receive 30 minutes" 说明什么？ | goroutine 等待 channel 已 30 分钟，可能是泄漏（无人发送，goroutine 永远阻塞）|
| -base 参数的作用？ | 对比两个 profile 的差值，用于定位内存泄漏（只看增量部分）|
| pprof 对生产性能影响大吗？ | CPU profile 开启时约 5-10% 开销；heap profile 默认极低；建议仅在需要时开启 |
