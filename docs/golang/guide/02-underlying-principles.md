---
title: 底层原理
description: Go 底层原理专题，涵盖 Slice、Map、Channel、内存逃逸、GC、分配器与内存模型。
search: false
---

# 底层原理

## 适合人群

- 已掌握 Go 基本语法，想深入理解运行时机制的工程师
- 准备技术面试，需要回答"底层原理"类问题的开发者
- 希望写出高性能 Go 代码、能做性能调优的后端工程师
- 想从"会用"提升到"知道为什么"的进阶学习者

## 学习目标

- 理解 Slice、Map、Channel、Interface 的运行时数据结构
- 掌握内存逃逸分析的规则和优化方法
- 了解 Go GC 三色标记算法与并发回收流程
- 理解 Go 内存分配器的多级缓存架构
- 掌握 Go Memory Model 的 happens-before 规则

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [Slice、Map、Channel 底层实现](./02-slice-map-channel-internals.md) | SliceHeader 三字段、Map hmap 结构与渐进式搬迁、Channel hchan 与发送接收流程 |
| [Interface itab、逃逸分析与栈堆分配](./02-interface-escape-and-stack.md) | eface/iface/itab 结构、逃逸分析规则、goroutine 栈动态增长 |
| [GC、内存分配器与 Memory Model](./02-gc-allocator-and-memory-model.md) | 三色标记与写屏障、mcache/mcentral/mheap 三级缓存、happens-before 与 data race |
| [逃逸分析、栈与堆](./02-escape-analysis.md) | 编译器逃逸决策深度解析、栈堆对比、优化实战 |
| [切片并发陷阱与工程化取舍](./02-concurrent-slice-patterns.md) | Append 竞态、锁 vs Channel、并发安全容器设计 |
