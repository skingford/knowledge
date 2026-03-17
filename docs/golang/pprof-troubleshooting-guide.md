---
title: Pprof 排障指南
description: 作为性能专题的深度补充页，聚焦 pprof 的排障流程、组合分析方法、案例化判断与常见误区，减少与主线性能文档的重复。
search: false
---

# Pprof 排障指南

这页不再重复讲 `pprof` 的基础接入和每个 profile 的入门概念，而是作为 [性能优化与排障](./guide/07-performance-troubleshooting.md) 的深度补充页，专门解决“拿到一个线上性能问题，怎么系统排”的问题。

## 先看主线，再看这页

- 性能主线：[性能优化与排障](./guide/07-performance-troubleshooting.md)
- `runtime/pprof` 源码：[runtime/pprof + net/http/pprof 源码精读](./guide/source-reading/runtime-pprof.md)
- `runtime/trace` 源码：[runtime/trace 源码精读](./guide/source-reading/runtime-trace.md)

如果你还在学“CPU profile 是什么、heap profile 看什么”，先看性能主线；如果你已经会抓 profile，但不知道怎么形成排障闭环，再看这页。

## 一套够用的排障流程

很多人用 `pprof` 的问题，不是不会命令，而是不会把现象、指标、profile 和业务语义串起来。一个更稳的顺序是：

1. **先定问题类型**：CPU 高、内存涨、Goroutine 堆积、延迟抖动、锁竞争，先分型
2. **再选 profile**：CPU 用 `profile`，泄漏看 `heap/goroutine`，竞争看 `mutex/block`
3. **先看趋势再看单点**：先确认增长或抖动是否持续，再抓现场
4. **从热点回到代码和流量**：热点函数不是结论，必须回到具体请求和业务路径
5. **最后验证修复**：优化后重新对比 profile，而不是靠“感觉快了”

## 现象到 profile 的映射

| 现象 | 先看什么 | 常见根因 |
| --- | --- | --- |
| CPU 持续高 | `profile` | 热循环、JSON 编解码、压缩、锁竞争外溢 |
| RSS 持续涨 | `heap` + 对比基线 | 缓存无上限、对象持有、Goroutine 泄漏 |
| Goroutine 数量持续涨 | `goroutine` | channel 阻塞、下游超时失控、任务不退出 |
| P99 飙高但 CPU 不高 | `block` / `mutex` / `trace` | 锁等待、外部依赖慢、调度延迟 |
| 偶发卡顿 | `trace` + `profile` | GC、syscall、网络阻塞、尖峰流量 |

关键点在于：不要一上来就只抓 CPU profile。很多“性能问题”本质上是等待问题，不是计算问题。

## 组合看，比单个 profile 更重要

### CPU 高时

建议组合：

- `profile`：看谁在吃 CPU
- `trace`：看是不是 runnable 太多或调度延迟
- `mutex`：看是不是锁竞争把 CPU 时间碎掉了

常见误判：

- 看到 `runtime.*` 热点就以为是 runtime 有问题
- 实际上很多时候是业务代码制造了大量对象、锁竞争或小任务切换，最终把热点推到 runtime 上

### 内存涨时

建议组合：

- `heap`：看当前谁持有内存
- `alloc_space`：看谁分配得最猛
- `goroutine`：看是不是协程泄漏导致对象一直被引用

常见误判：

- 只看一次 `heap` 就下结论说“泄漏”
- 正确做法通常是拿两个时点做对比，确认增长路径是否持续

### 延迟抖动时

建议组合：

- `block`：看阻塞等待
- `mutex`：看锁竞争
- `trace`：看调度延迟、网络阻塞、GC 停顿

常见误判：

- 平均延迟还行，就以为系统没问题
- 实际上调度、锁和下游依赖的问题，往往最先出现在 P99 / P999

## 一个更实用的分析顺序

拿到 profile 后，不要直接开始“猜”。建议按这个顺序看：

### 第一步：先看 top

目的：快速找到最高占比函数和模块。

看什么：

- 头部函数是否集中在单一模块
- 是业务函数热，还是编码/压缩/序列化热
- 热点是直接热点（flat）还是路径热点（cum）

### 第二步：再看调用链

目的：确认热点是谁调用出来的。

很多时候真正该优化的不是热点函数本身，而是：

- 调用了它太多次
- 在错误的位置调用它
- 用了错误的数据结构或并发模式

### 第三步：回到业务现场

必须补三类上下文：

- 哪类请求触发的
- 哪个时间窗口触发的
- 是否与流量峰值、下游超时、发布变更同步出现

没有现场上下文的 profile，常常只能告诉你“哪里热”，不能告诉你“为什么热”。

## 常用命令只保留最实用的一组

```bash
# CPU
go tool pprof http://127.0.0.1:6060/debug/pprof/profile?seconds=30

# Heap
go tool pprof http://127.0.0.1:6060/debug/pprof/heap

# Goroutine
go tool pprof http://127.0.0.1:6060/debug/pprof/goroutine

# 锁竞争
go tool pprof http://127.0.0.1:6060/debug/pprof/mutex

# 阻塞
go tool pprof http://127.0.0.1:6060/debug/pprof/block

# Web UI
go tool pprof -http=:8080 cpu.prof
```

进入交互模式后，优先用这几个：

- `top`
- `top -cum`
- `list <func>`
- `web`

如果你平时很少用，先把这 4 个练熟，比记一堆命令更值。

## 三类典型排障场景

### 场景一：CPU 高

判断顺序：

1. `profile` 看热点是否集中
2. `top -cum` 看热路径
3. `list` 定位到具体行
4. 结合请求日志确认是哪类流量打满

高频根因：

- 大量 JSON 编解码
- 正则、模板、压缩、加密
- 小对象频繁分配
- 锁竞争导致自旋和调度开销

### 场景二：内存涨

判断顺序：

1. 看 `inuse_space`
2. 对比两个时间点的 heap
3. 看对象是否被缓存、slice、map 或 Goroutine 长期持有

高频根因：

- 缓存没有上限
- 切片保留大底层数组
- Goroutine 不退出
- 请求结果被意外长期引用

### 场景三：Goroutine 数量上升

判断顺序：

1. 看 goroutine profile 是否集中在某几个等待点
2. 看这些等待点是否与 channel、锁、下游 I/O 相关
3. 回到代码找退出条件、取消路径和超时边界

高频根因：

- `select` 没监听 `ctx.Done()`
- 下游阻塞但没有超时
- 生产者还在写，消费者已经不读
- 后台任务没有停机和取消机制

## 代码层面的排障前提

如果下面这些没开，很多问题根本看不清：

```go
import "runtime"

func init() {
	runtime.SetMutexProfileFraction(1)
	runtime.SetBlockProfileRate(1)
}
```

同时建议保留这些运行时指标：

- `runtime.NumGoroutine()`
- 线程数量
- GC 暂停时间
- P99 / P999 延迟
- 请求量和错误率

## 常见误区

### 1. 把 profile 当答案

profile 只能告诉你“症状落在哪”，不能自动告诉你“为什么会这样设计”。

### 2. 只看一次快照

很多内存、Goroutine 和延迟问题，必须看趋势和对比，单点截图很容易误判。

### 3. 看到 runtime 热点就甩锅 runtime

runtime 热点往往是业务模式放大的结果，比如：

- 分配太多
- runnable G 太多
- 锁竞争太重
- syscall 太频繁

### 4. 只盯平均值

线上服务真正要命的，通常是尾延迟、尖峰时段和少数异常请求。

## 一个够用的排障闭环

可以把性能排障归纳成下面这套闭环：

1. 监控发现异常
2. 先按现象分型
3. 抓对应 profile
4. 看热点与调用链
5. 回到业务现场验证
6. 修复后重新抓 profile 对比

做到这一步，`pprof` 才真正从“会用工具”变成“能稳定排障”。

## 延伸阅读

- 性能主线：[性能优化与排障](./guide/07-performance-troubleshooting.md)
- `runtime/pprof` 源码：[runtime/pprof + net/http/pprof 源码精读](./guide/source-reading/runtime-pprof.md)
- `runtime/trace` 源码：[runtime/trace 源码精读](./guide/source-reading/runtime-trace.md)
- 高频题：[30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)
