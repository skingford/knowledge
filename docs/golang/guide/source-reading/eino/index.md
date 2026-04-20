---
title: Eino 源码阅读总览
description: CloudWeGo eino（Go LLM 应用框架）源码精读模块总览，串起组件抽象、图编排、流处理与回调机制的阅读路线。
---

# Eino 源码阅读总览

> 核心仓库：`github.com/cloudwego/eino@v0.8.10`
>
> 扩展仓库：`github.com/cloudwego/eino-ext@v0.8.10`
>
> 🚧 本模块整体处于施工中，骨架已就位，内容按路线逐篇回填。

这是对 [CloudWeGo eino](https://github.com/cloudwego/eino) 的**源码精读**，不是使用教程。目标是把 eino 框架的抽象设计、图编排机制、流处理模型、回调体系从源码层面读透。

## 这是什么

eino 是字节跳动 CloudWeGo 团队开源的 **Go 语言 LLM 应用开发框架**，在目标上对标 Python 的 LangChain / LangGraph，但充分利用 Go 的类型系统与并发原语，提供：

- 模块化的组件抽象（ChatModel / Tool / Retriever / Embedding / Indexer / Document / Lambda 等）
- 强类型的图编排（Graph / Chain / Workflow）
- 原生流式处理
- 统一的回调机制
- 编译期类型校验

## 术语约定

| 英文 | 中文 | 说明 |
| --- | --- | --- |
| Component | 组件 | eino 中所有可编排单元的抽象 |
| Runnable | 可运行体 | `Runnable[I, O]`，编排产物 |
| Graph | 图 | 最核心的编排容器，支持节点、边、分支 |
| Chain | 链 | 线性编排的语法糖，最终降级为 Graph |
| Workflow | 工作流 | 支持字段级数据映射的编排 |
| Lambda | 函数组件 | 把任意函数包成组件 |
| Stream | 流 | 基于 channel 的流式数据通道 |
| Callback | 回调 | 贯穿编排执行的观测点 |

## 推荐阅读顺序

1. [架构与仓库结构](./architecture.md) — 先摸清包布局与依赖关系
2. [schema：消息与流](./schema.md) — 最底层的数据抽象
3. [components：组件抽象总览](./components-overview.md) — Runnable 与四种交互模式
4. 各个组件深度阅读（任选感兴趣的）：
   - [ChatModel](./chatmodel.md) / [ChatTemplate](./chattemplate.md) / [Tool](./tool.md)
   - [Retriever](./retriever.md) / [Embedding](./embedding.md) / [Indexer](./indexer.md)
   - [Document](./document.md) / [Lambda](./lambda.md)
5. [compose：编排总览](./compose-overview.md) — 进入 eino 的心脏
6. [Graph：图编排核心](./graph.md) ⭐ — 必读
7. [Chain](./chain.md) / [Workflow](./workflow.md) — Graph 之上的两种语法糖
8. [Stream：流处理内部](./stream.md) — 流式数据如何自动转换与合并
9. [Callback：回调机制](./callback.md)
10. [类型检查机制](./type-check.md) / [State：共享状态](./state.md)
11. [eino-ext 适配器模式](./ext-adapters.md)
12. [从源码提炼的最佳实践](./best-practices.md) — 综合收尾

## 与其他模块的关系

- **AI 方向**：eino 用于构建 LLM 应用，阅读前建议先对 LangChain 相关概念有基本认知
- **Go 源码精读主线**：eino 大量使用泛型、`reflect`、channel，读之前对 [`reflect`](../reflect.md)、[`channel`](../channel.md)、[context](../context.md) 应先熟悉
- **compose 内部**：编排逻辑用到了 DAG、拓扑排序、类型推导，偏向编译器视角

## 版本刷新说明

本模块钉版本为 **v0.8.10**（2026-04-17 发布）。eino 仍处于活跃迭代期，每次升级版本需：

1. 对照新版本 CHANGELOG 差异
2. 重新校对每篇文章的源码行号引用
3. 更新本页与各子页 frontmatter 中的版本标注
