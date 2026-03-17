---
title: Go 能力自检与面试准备导航
description: 统一整理 Go 高频题、自检代码片段与专题回查入口，减少题库、示例代码和主线专题之间的碎片化跳转。
search: false
---

# Go 能力自检与面试准备导航

这页用于收敛 Go 能力自检相关的几个入口，避免“题库一页、代码一页、专题一页”来回跳转时过于碎片化。

## 你应该怎么用

- **先暴露盲区**：看题库，判断哪些题你只能“知道”，还不能“讲清”
- **再补最小代码**：用示例代码把抽象结论落到可运行片段
- **最后回专题**：去并发、性能、runtime 等主线页补完整原理

## 核心入口

- 高频题题库：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-top-30-interview-questions.md`](./go-top-30-interview-questions.md)
- 高频题代码片段：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-interview-code-snippets.md`](./go-interview-code-snippets.md)
- Go 学习路径总入口：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/learning-path.md`](./learning-path.md)

## 题目、代码、专题怎么配合

| 复习目标 | 先看题目 | 再看代码 | 最后回专题 |
| --- | --- | --- | --- |
| 切片、接口、逃逸 | `go-top-30-interview-questions` 基础与底层 | `go-interview-code-snippets` 基础与底层 | `guide/01-*`、`guide/02-*` |
| Channel、Context、WaitGroup、Mutex | `go-top-30-interview-questions` 并发与调度 | `go-interview-code-snippets` 并发与调度 | `guide/03-concurrency` |
| Pprof、sync.Pool、http.Client | `go-top-30-interview-questions` 工程与性能 | `go-interview-code-snippets` 性能与工程 | `guide/07-performance-troubleshooting` |
| 调度器、GMP、runtime | `go-top-30-interview-questions` 并发与调度 | 代码片段只做辅助 | `guide/09-runtime-source` + `guide/source-reading/` |

## 推荐练习方式

### 第一轮：快答

- 用题库里的“简答”做 1 分钟口述
- 能说结论即可，不追求完整展开

### 第二轮：结构化表达

- 用题库里的“标准回答模板”练“结论 -> 原理 -> 场景 -> 注意点”
- 对答不顺的题，马上去看对应代码片段

### 第三轮：代码解释

- 不必每题都手写整段代码
- 至少要能解释 5 到 10 个最常见片段：
  - slice 扩容
  - nil interface
  - channel 同步
  - context 取消
  - waitgroup / mutex
  - sync.Pool
  - pprof 接入

### 第四轮：专题回查

- 只在需要时回主线专题，不要一开始就陷进长文档
- 目标是从“会背题”升级到“能解释为什么”

## 什么时候看题库，什么时候看代码页

### 优先看题库

适合下面几种情况：

- 你在准备面试或自检，需要大量覆盖题目
- 你想练表达，而不是先读长篇原理
- 你要快速判断自己的知识盲区

### 优先看代码页

适合下面几种情况：

- 你对结论知道，但说不出例子
- 你要准备手写代码或现场读代码
- 你想把“为什么会这样”讲得更自然

## 与主线文档的关系

为了减少重复，当前分工是：

- `go-top-30-interview-questions`：负责题目和回答模板
- `go-interview-code-snippets`：负责最小示例代码
- `guide/*`：负责系统原理和工程实践
- `guide/source-reading/*`：负责源码实现

也就是说，题库和代码页不再追求“大而全”，而是做能力自检入口。

## 建议顺序

1. [`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-top-30-interview-questions.md`](./go-top-30-interview-questions.md)
2. [`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-interview-code-snippets.md`](./go-interview-code-snippets.md)
3. [`/Users/kingford/workspace/github.com/knowledge/docs/golang/learning-path.md`](./learning-path.md) 里对应专题

如果你的目标是“压缩准备时间”，直接从这页开始最合适。
