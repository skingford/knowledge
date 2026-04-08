---
title: "The Rust Programming Language 精读"
description: 按章节精读 Rust 官方教材，覆盖从入门到高级特性的完整学习路径。
---

# The Rust Programming Language 精读

> 原书：[The Rust Programming Language](https://doc.rust-lang.org/book/)（Rust 1.90.0，2024 edition）

这个系列是对 Rust 官方教材的逐章精读笔记，保留原书代码示例，用中文提炼核心概念，补充设计动机和工程视角的理解。

## 阅读建议

- **零基础入门**：按 1 → 21 的顺序线性推进
- **有其他语言经验**：可以跳过第 1-2 章，从第 3 章开始，第 4 章（所有权）必读
- **想快速补某个主题**：直接跳到对应章节

## 章节目录

### 第一部分：基础（第 1-6 章）

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| [第 1 章](./ch01-getting-started) | 入门 | 安装 Rust、Hello World、Cargo 基础 |
| [第 2 章](./ch02-guessing-game) | 猜数游戏 | 通过完整项目体验 Rust 的变量、类型和错误处理 |
| [第 3 章](./ch03-common-concepts) | 通用编程概念 | 变量、数据类型、函数、控制流 |
| [第 4 章](./ch04-ownership) | 认识所有权 | 所有权规则、引用与借用、切片——Rust 最核心的概念 |
| [第 5 章](./ch05-structs) | 使用结构体组织数据 | struct 定义、方法语法、关联函数 |
| [第 6 章](./ch06-enums-and-matching) | 枚举与模式匹配 | enum、Option、match、if let |

### 第二部分：工程化（第 7-11 章）

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| [第 7 章](./ch07-packages-crates-modules) | 包、Crate 和模块 | 模块系统、路径、use、文件拆分 |
| [第 8 章](./ch08-common-collections) | 常用集合 | Vec、String、HashMap 和所有权边界 |
| [第 9 章](./ch09-error-handling) | 错误处理 | panic!、Result、? 运算符 |
| [第 10 章](./ch10-generics-traits-lifetimes) | 泛型、Trait 与生命周期 | 类型系统三大支柱和它们的协作方式 |
| [第 11 章](./ch11-testing) | 编写自动化测试 | 测试编写、运行和组织 |

### 第三部分：实战与函数式（第 12-14 章）

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| [第 12 章](./ch12-io-project) | I/O 项目：minigrep | 综合运用前面知识构建完整 CLI 程序 |
| [第 13 章](./ch13-iterators-closures) | 闭包与迭代器 | Fn trait 三兄弟、迭代器适配器、零开销抽象 |
| [第 14 章](./ch14-cargo-and-crates-io) | 进一步认识 Cargo | 发布配置、Workspace、crate 发布 |

### 第四部分：并发与 OOP（第 15-18 章）

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| [第 15 章](./ch15-smart-pointers) | 智能指针 | Box、Deref、Drop、Rc、RefCell |
| [第 16 章](./ch16-fearless-concurrency) | 无畏并发 | 线程、消息传递、Mutex、Send/Sync |
| [第 17 章](./ch17-async-await) | Async 与 Await | Future、async/await、Stream、运行时模型 |
| [第 18 章](./ch18-oop-features) | 面向对象编程特性 | trait 对象、动态分发、状态模式 |

### 第五部分：高级特性（第 19-21 章）

| 章节 | 标题 | 核心内容 |
| --- | --- | --- |
| [第 19 章](./ch19-patterns-and-matching) | 模式与匹配 | 模式语法全集、可反驳性 |
| [第 20 章](./ch20-advanced-features) | 高级特性 | unsafe、高级 trait/类型、宏 |
| [第 21 章](./ch21-final-project) | 终极项目：多线程 Web 服务器 | 线程池、优雅关闭——综合全书知识 |

## 与现有专题的关系

这个精读系列是对原书的系统梳理，适合作为 Rust 的第一遍学习材料。学完后可以进入更深入的专题：

- 所有权想深入 → [所有权、借用与生命周期](../ownership-borrowing-and-lifetimes)
- 错误处理想深入 → [错误处理、Cargo 与测试](../error-handling-cargo-and-testing)
- 想进入工程实践 → [Rust 后端开发路线图](../rust-backend-learning-roadmap)
- 想做能力自检 → [Rust 能力自检与面试准备](../interview-prep)
