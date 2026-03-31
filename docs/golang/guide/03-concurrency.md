---
title: 并发编程
description: Go 并发编程专题，系统整理 Goroutine、Channel、Mutex、Context 与调度模型实践。
search: false
---

# 并发编程

## 适合人群

- 已掌握 Go 基础语法，想系统理解并发模型的开发者
- 在项目中使用过 Goroutine 和 Channel，但对底层机制缺乏体感
- 准备能力自检、希望把并发知识串成体系的工程师

## 学习目标

- 理解 Goroutine 的创建、调度和生命周期管理
- 掌握 GMP 调度模型的核心流程
- 熟练运用 Channel、select、Context 完成常见并发模式
- 掌握 sync 包各同步原语的适用场景与注意事项
- 能够排查 Goroutine 泄漏和并发安全问题

## 图例速览

并发主线里最容易先卡住的是 “G、M、P 到底怎么配合”。下面这张 SVG 图例复用了 [Goroutine 与 GMP 调度模型](./03-goroutine-and-scheduler.md) 一文的组件，建议先看角色分工，再进入具体章节。

<GoSchedulerDiagram kind="roles" />

## 快速导航

| 专题 | 内容 |
| --- | --- |
| [Goroutine 与 GMP 调度模型](./03-goroutine-and-scheduler.md) | Goroutine 基础、生命周期、GMP 调度模型、Work Stealing、Hand-off 与 sysmon |
| [Channel、select 与 Context](./03-channel-select-context.md) | Channel 用法与原理、select 多路复用、Context 取消与超时传播 |
| [sync 同步原语与 Atomic](./03-sync-primitives.md) | Mutex、RWMutex、Atomic、WaitGroup、Once、Cond、Pool、sync.Map 与选型决策 |
| [Goroutine 泄漏与并发安全](./03-goroutine-leak-and-data-race.md) | 泄漏原因与排查、数据竞争检测、Race Detector、闭包陷阱 |
| [高级并发模式](./03-advanced-concurrency-patterns.md) | ErrGroup、Singleflight、Semaphore、Worker Pool、Rate Limiter 等 |
