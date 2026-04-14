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
- 掌握 Go 内存模型里的 happens-before 规则

## 图例速览

底层原理里最容易断开的，是“数据结构、分配位置、GC、并发可见性”这四条线。先看这张总览图，再按顺序拆进每篇文章会更稳。

<GoRuntimeDiagram kind="overview" />

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [Slice、Map、Channel 底层实现](./02-slice-map-channel-internals.md) | SliceHeader 三字段、Map hmap 结构与渐进式搬迁、Channel hchan 与发送接收流程 |
| [运行时内存主线](./02-runtime-memory-lifecycle.md) | 主文：把接口表示（itab）、接口装箱、栈与堆、分配器、GC 与 happens-before 串成一条线 |
| [逃逸分析、栈与堆](./02-escape-analysis.md) | 深入页：专门讲逃逸判定、编译器输出、热点排查与优化取舍 |
| [切片并发陷阱与工程化取舍](./02-concurrent-slice-patterns.md) | Append 竞态、锁 vs Channel、并发安全容器设计 |
