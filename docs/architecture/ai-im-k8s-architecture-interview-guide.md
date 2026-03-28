---
title: AI、IM/直播与云原生架构
description: 围绕 Go、MySQL、Redis、Kafka、AI 工程化、IM/直播高并发和 Kubernetes，整理一套适合高级后端岗位准备的架构面试专题。
---

# AI、IM/直播与云原生架构

这篇专题原本是一篇超长长文。为了更适合分段阅读、复习和跳转，我把它拆成了 6 个分册，当前页面保留为总览入口。

如果你更想一次性阅读全文，也可以直接看归档版：

- [完整长文归档](./ai-im-k8s-architecture-interview-guide-full.md)

## 适合人群

- 正在准备高级后端、架构师、技术负责人候选面试的工程师
- 目标岗位同时要求 Go、缓存、消息队列、分布式和云原生能力
- 需要把 AI 工程化和传统后端架构能力整合成一套回答体系的人

## 学习目标

- 明确这类岗位真正考察的是“底层理解 + 架构取舍 + 事故处理能力”
- 建立一套围绕 Go、存储、消息队列、AI、IM/直播、K8s 的复习骨架
- 形成可以直接口述的标准回答模板，而不是零散背八股

## 图例速览

这套专题最容易先断掉的是三条线：系统主链路怎么拆、消息与异步怎么讲、K8s 问题怎么按层回答。下面三张 SVG 图例建议先看骨架，再按分册阅读。

### 1. 系统主链路

<GoHighConcurrencySystemDesignDiagram kind="core-path" />

### 2. 消息与异步治理

<KafkaDiagram kind="interview-questions" />

### 3. K8s 答题阶梯

<K8sDiagram kind="interview-ladder" />

## 分册导航

### 1. 基础认知与核心技术栈

- [基础认知与核心技术栈](./ai-im-k8s-architecture-interview-guide-foundation-and-core-stack.md)
- 内容：岗位到底在筛什么、Go 调度与并发、MySQL、Redis、Kafka 等基础设施主线

### 2. 专项场景突破、架构与云原生

- [专项场景突破、架构与云原生](./ai-im-k8s-architecture-interview-guide-special-scenarios-and-cloud-native.md)
- 内容：AI 工程化、IM/直播场景、微服务治理、K8s 与工程交付

### 3. 软实力与高频追问题库

- [软实力与高频追问题库](./ai-im-k8s-architecture-interview-guide-soft-skills-and-question-bank.md)
- 内容：项目复盘、事故处理、技术负责人视角，以及高频追问参考答案

### 4. 场景题一：AI Agent 编排服务

- [场景题一：AI Agent 编排服务](./ai-im-k8s-architecture-interview-guide-scenario-ai-agent.md)
- 内容：高并发调度、图编排、流式输出、失败补偿和稳定性设计

### 5. 场景题二与三：一致性、热点治理与 Kafka

- [场景题二与三：一致性、热点治理与 Kafka](./ai-im-k8s-architecture-interview-guide-scenarios-consistency-and-kafka.md)
- 内容：Redis 热点治理、资金强一致性、Kafka 削峰、防丢失与严格防乱序

### 6. 名词详解与考前速查

- [名词详解与考前速查](./ai-im-k8s-architecture-interview-guide-glossary-and-cheatsheet.md)
- 内容：术语表、考前速查卡片、面试题到底层原理的对照表、推荐复习顺序

## 推荐阅读顺序

如果你是第一次系统准备这类岗位，建议按下面顺序读：

1. 先看 [基础认知与核心技术栈](./ai-im-k8s-architecture-interview-guide-foundation-and-core-stack.md)
2. 再看 [专项场景突破、架构与云原生](./ai-im-k8s-architecture-interview-guide-special-scenarios-and-cloud-native.md)
3. 然后看 [软实力与高频追问题库](./ai-im-k8s-architecture-interview-guide-soft-skills-and-question-bank.md)
4. 最后刷三类场景题和 [名词详解与考前速查](./ai-im-k8s-architecture-interview-guide-glossary-and-cheatsheet.md)

## 关联阅读

- Go 能力自检导航：[../golang/interview-prep.md](../golang/interview-prep.md)
- 高并发系统设计清单：[./high-concurrency-system-checklist.md](./high-concurrency-system-checklist.md)
- Tool Calling 设计清单：[../ai/tool-calling-design-checklist.md](../ai/tool-calling-design-checklist.md)
- Agent 学习综合指南：[../ai/agent-learning-guide.md](../ai/agent-learning-guide.md)
- K8s 自动扩缩容与容量控制：[../k8s/autoscaling-and-capacity-control-chain.md](../k8s/autoscaling-and-capacity-control-chain.md)
- K8s 固定入口、固定出口与白名单：[../k8s/fixed-ip-and-whitelist.md](../k8s/fixed-ip-and-whitelist.md)
