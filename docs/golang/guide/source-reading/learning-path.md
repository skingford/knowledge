---
title: Go 源码阅读学习主线
description: 统一收敛 Go 源码阅读的路线、方法、runtime 导读与推荐资料，作为 guide/source-reading 模块的主入口。
search: false
---

# Go 源码阅读学习主线

这页现在是 `guide/source-reading/` 的统一主入口。

原来分散在 `learning-path`、`guide/09-runtime-source`、`golang-advanced-learning-guide`、`golang-recommended-resources` 里的源码阅读路线、runtime 导读和资料清单，统一收口到这里维护。`docs/golang` 根目录继续保留通用专题导航，但源码阅读相关内容以后以本页和 [Go 源码精读总览](./index.md) 为准。

## 怎么使用这页

- **想先抓主线**：直接看“推荐阅读路线”
- **想先掌握读法**：先看“开始之前：怎么读 Go 源码”
- **想按包查文章**：跳到 [Go 源码精读总览](./index.md)
- **想准备 runtime / 调度 / GC 面试**：优先读 runtime 主线，再回题库和排障页

## 开始之前：怎么读 Go 源码

在深入 runtime 之前，先把版本、目录和入口找法对齐，不然后面容易迷路。

### 源码版本怎么选

- 先看本机 `go version`
- 阅读时尽量选择与你运行环境一致的大版本
- 如果是看历史行为或兼容性，再切换到对应 release tag

常见入口：

```bash
git clone https://github.com/golang/go
cd go
git checkout go1.25.3
```

在线阅读可以直接用：

- `https://cs.opensource.google/go`
- `https://github.com/golang/go/tree/master/src`

### 目录先看什么

```text
src/
├── runtime/      调度器、GC、内存分配、channel、map
├── sync/         Mutex、WaitGroup、Once、Pool、Cond
├── net/          连接抽象、poller、TCP/UDP
├── net/http/     Server、Transport、HTTP/2、测试工具
├── context/      取消树、deadline、value 传播
├── encoding/     json、xml、gob、binary 等编解码
└── internal/     标准库内部实现细节
```

### 入口怎么反查

当你想知道一段 Go 代码最终落到了哪个 runtime 函数，优先反查编译结果。

```bash
go build -gcflags="-S" main.go 2>&1 | head -80
go tool objdump -s "main.main" ./your-binary
go tool compile -S main.go
```

典型例子：

- `go f()` 往往会落到 `runtime.newproc`
- `ch <- v` 会落到 `runtime.chansend`
- `<-ch` 会落到 `runtime.chanrecv`
- `make(map[K]V)`、`m[k]` 会落到 `runtime.makemap`、`runtime.mapaccess*`

### 调试工具怎么配合

```bash
go install github.com/go-delve/delve/cmd/dlv@latest
dlv debug --check-go-version=false main.go
```

进入 `dlv` 之后，常用操作：

- `break runtime.newproc1`
- `break runtime.chansend`
- `goroutines`
- `goroutine 1 bt`

### 阅读时的几个原则

- 先读包注释、文件头注释和关键不变量，再追调用链
- 先建立状态机和数据结构，再读细节分支
- 第一次读 runtime 不要陷进汇编和平台分支
- 读到工程问题时，要回到对应的 `pprof`、`trace`、`context`、`net/http` 文章串起来看

## 推荐阅读路线

### 路线一：runtime 主线

适合：想把 goroutine、调度、内存、GC 和排障串成一条线的人。

1. [Goroutine 生命周期](./goroutine.md)
2. [GMP 调度器](./runtime-scheduler.md)
3. [Channel 底层实现](./channel.md)
4. [内存分配器](./runtime-memory.md)
5. [GC 垃圾回收](./runtime-gc.md)
6. [runtime/pprof](./runtime-pprof.md)
7. [runtime/trace](./runtime-trace.md)

### 路线二：并发与服务治理

适合：想把 `context`、`sync`、`x/sync`、`net/http` 放到真实工程里理解的人。

1. [context 包](./context.md)
2. [sync 包](./sync-primitives.md)
3. [sync/atomic](./sync-atomic.md)
4. [golang.org/x/sync](./golang-x-sync.md)
5. [net/http 总览](./net-http.md)
6. [net/http Transport](./net-http-transport.md)

### 路线三：网络与 API 服务

适合：做 Web、RPC、网关、代理和客户端连接治理的人。

1. [net 包](./net.md)
2. [net/http 总览](./net-http.md)
3. [net/http Server](./net-http-server.md)
4. [net/http Transport](./net-http-transport.md)
5. [net/http/httputil](./net-httputil.md)
6. [gRPC-Go](./grpc-go.md)

### 路线四：排障与观测

适合：线上先看告警、指标、profile，再反推源码执行路径的人。

1. [Go 性能优化与排障](../07-performance-troubleshooting.md)
2. [Pprof 排障指南](../../pprof-troubleshooting-guide.md)
3. [runtime/pprof](./runtime-pprof.md)
4. [runtime/trace](./runtime-trace.md)
5. [runtime/metrics](./runtime-metrics.md)
6. [OpenTelemetry Go](./opentelemetry-go.md)

## 先看哪几篇最划算

如果只打算先读 8 篇，建议按下面顺序：

1. [Goroutine 生命周期](./goroutine.md)
2. [GMP 调度器](./runtime-scheduler.md)
3. [Channel 底层实现](./channel.md)
4. [GC 垃圾回收](./runtime-gc.md)
5. [context 包](./context.md)
6. [net/http 总览](./net-http.md)
7. [database/sql](./database-sql.md)
8. [runtime/trace](./runtime-trace.md)

## 配套入口

- 包索引总览：[Go 源码精读总览](./index.md)
- Go 通用学习导航：[Go 学习路径与资料导航](../../learning-path.md)
- 面试与自检入口：[Go 能力自检与面试准备导航](../../interview-prep.md)
- Context 工程边界：[Context 使用边界](../../context-usage-boundaries.md)
- Pprof 实操排障：[Pprof 排障指南](../../pprof-troubleshooting-guide.md)

## 推荐资料

### 官方资料

- [Go 官方博客](https://go.dev/blog/)
- [语言规范](https://go.dev/ref/spec)
- [标准库文档](https://pkg.go.dev/std)
- [Go Memory Model](https://go.dev/ref/mem)
- [Go Release Notes](https://go.dev/doc/devel/release)

### 推荐书单

- `The Go Programming Language`
- `Learning Go, 2nd Edition`
- `Concurrency in Go`
- `100 Go Mistakes and How to Avoid Them`
- `Let's Go Further`

### 推荐演讲

- `The Scheduler Saga` — Kavya Joshi
- `Understanding Channels` — Kavya Joshi
- `Profiling Go Programs` — Rhys Hiltner
- `Concurrency Is Not Parallelism` — Rob Pike
- `Go Proverbs` — Rob Pike

### 值得长期关注的博客

- [Dave Cheney](https://dave.cheney.net/)
- [Russ Cox](https://research.swtch.com/)
- [Eli Bendersky](https://eli.thegreenplace.net/tag/go)
- [Ardan Labs Blog](https://www.ardanlabs.com/blog/)

### 值得阅读的项目

- [golang/go](https://github.com/golang/go)
- [etcd](https://github.com/etcd-io/etcd)
- [minio](https://github.com/minio/minio)
- [gin](https://github.com/gin-gonic/gin)
- [cobra](https://github.com/spf13/cobra)

## 本次收口后的分工

- `golang/learning-path`：保留 Go 总体专题导航
- `golang/guide/source-reading/learning-path`：统一维护源码阅读路线、方法与资料
- `golang/guide/source-reading/index`：统一维护源码精读索引
- 历史重复入口：保留原 URL，但改为归档说明页

如果你是第一次进 `source-reading/`，建议先读本页，再进入 [Go 源码精读总览](./index.md) 按主题挑文章。
