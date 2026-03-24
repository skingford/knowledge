---
title: Rust 能力自检与面试准备导航
description: 统一整理 Rust 必备问题清单、学习路径和核心专题入口，减少总览、专题和自检之间的碎片化跳转。
search: false
---

# Rust 能力自检与面试准备导航

这页负责把 Rust 的自检和复盘入口收起来，避免你在总览页、专题页和问题清单之间来回跳。

## 你应该怎么用

- 先暴露盲区：看问题清单，判断哪些题你只能背结论，还不能讲清
- 再回专题：去所有权、类型系统、工程化、并发 async 等专题补原理
- 最后做结构化复盘：把每个知识点讲到“结论 + 原理 + 场景 + 误区”

## 核心入口

- 问题清单：[Rust 必备问题清单](./essential-questions.md)
- 代码片段：[Rust 能力自检高频题示例代码片段](./interview-code-snippets.md)
- 学习主线：[Rust 学习路径与资料导航](./learning-path.md)
- 总览页：[Rust 必备知识总览](./essential-knowledge.md)

## 题目和专题怎么配合

| 复习目标 | 先看问题 | 配套代码 | 最后回专题 |
| --- | --- | --- | --- |
| 所有权、借用、生命周期 | `essential-questions` 基础部分 | `interview-code-snippets` 前 3 段 | `ownership-borrowing-and-lifetimes` |
| trait、泛型、enum、match | `essential-questions` 类型系统部分 | `interview-code-snippets` 的 trait bound + 泛型函数 | `traits-generics-and-pattern-matching` |
| `String`、`Vec`、迭代器、HashMap | `essential-questions` 数据结构部分 | `interview-code-snippets` 集合部分 | `collections-strings-and-iterators` |
| 错误处理、Cargo、crate、workspace | `essential-questions` 工程化部分 | `interview-code-snippets` 的 `Result + ?` | `error-handling-cargo-and-testing` + `project-structure-and-api-design` |
| `Arc`、`Mutex`、async、Tokio | `essential-questions` 并发部分 | `interview-code-snippets` 的共享状态和 `tokio::spawn` | `concurrency-and-async` + `tokio-and-async-practice` |
| `serde`、宏、unsafe、FFI | `essential-questions` 进阶部分 | 先口述结论，再回专项 | 对应进阶专题页 |

## 建议练习方式

### 第一轮：快答

- 一题用 30 到 60 秒说结论
- 不展开细节，只看自己是不是能立刻抓住重点

### 第二轮：结构化表达

每题尽量按这个顺序回答：

1. 它解决什么问题
2. Rust 怎么做
3. 为什么这样设计
4. 常见误区或代价是什么

### 第三轮：回专题补薄弱项

不要一开始就把所有专题重新读一遍。先用问题暴露盲区，再定点补。

## 建议顺序

1. [Rust 必备问题清单](./essential-questions.md)
2. [Rust 能力自检高频题示例代码片段](./interview-code-snippets.md)
3. [Rust 必备知识总览](./essential-knowledge.md)
4. [Rust 学习路径与资料导航](./learning-path.md)
5. 对应专题页

如果你的目标是准备面试或做阶段复盘，这页比直接进长文更高效。
