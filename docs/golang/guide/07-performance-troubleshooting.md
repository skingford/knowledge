---
title: 性能优化与排障
description: Go 性能优化与排障专题，系统整理 pprof、trace、内存、CPU 与线上问题定位方法。
search: false
---

# 性能优化与排障

## 适合人群

- 需要系统掌握 Go 性能分析工具链的工程师
- 线上服务出现 CPU 飙高、内存泄漏、延迟抖动等问题需要快速定位的开发者
- 希望在面试中能完整讲清性能排障思路的候选人

## 学习目标

- 熟练使用 pprof、trace、benchmark 等工具定位性能瓶颈
- 掌握 GC 调优、内存分配优化、对象池等实战技巧
- 建立从指标异常到根因定位的系统化排障思路

> 更详细的 pprof 排障实操流程，参考 [Pprof 排障指南](../pprof-troubleshooting-guide.md)

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [Pprof、Trace 与 Benchmark](./07-pprof-trace-and-benchmark.md) | CPU/内存 Pprof、runtime/trace 事件追踪、Benchmark 与 benchstat 对比 |
| [GC 调优与内存优化](./07-gc-tuning-and-memory-optimization.md) | GOGC/GOMEMLIMIT、逃逸分析、预分配、strings.Builder、sync.Pool |
| [锁竞争分析与慢请求排查](./07-lock-contention-and-slow-requests.md) | mutex profile、分片 Map、请求链路追踪、分段计时 |
| [Goroutine 泄漏与线上问题定位](./07-goroutine-leak-and-production-debugging.md) | 泄漏模式与修复、四步排障法、运行时自检、指标/日志/Trace 三件套 |
