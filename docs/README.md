# Docs 目录说明

这个目录收纳按主题整理的学习资料与路线图，优先使用语义化文件名，避免使用无含义的短文件名。

## 首页入口

- [学习导航总览](./learning-overview.md)
- [通用文档模板](./TEMPLATE.md)

## 统一模板

每篇文档尽量按下面的顺序组织：

- 适合人群
- 学习目标
- 学习路线或知识地图
- 推荐实践项目
- 推荐资料
- 能力自检题或复盘模板

## 当前文档

- [架构方向](./architecture/)
- [架构案例实战](./architecture/case-studies/)
- [AI / Agent 方向](./ai/)
- [Golang 方向](./golang/)

## 推荐入口

### 想看总览

- [学习导航总览](./learning-overview.md)

### 想从路线开始

- [架构师学习路线](./architecture/architect-learning-roadmap.md)
- [Agent 学习综合指南](./ai/agent-learning-guide.md)
- [高级 Golang 学习资料](./golang/golang-advanced-learning-guide.md)

### 想从能力自检准备开始

- [架构能力自检准备清单](./architecture/architect-interview-prep-checklist.md)
- [高级 Golang 学习资料](./golang/golang-advanced-learning-guide.md)
- [30 个高频 Golang 能力自检题 + 简答](./golang/go-top-30-interview-questions.md)

## 当前规模

- `architecture/`：路线、分阶段书单、能力自检清单、分布式与高并发专题、案例实战
- `ai/`：学习地图、路线、资料清单、Tool Calling、RAG
- `golang/`：学习资料、能力自检资料、大纲、题库、模板、源码、代码片段、资源清单

## 整理规则

- 文件名使用英文语义化 kebab-case
- 文档标题使用中文，便于直接阅读
- 优先按“概览 -> 路线 -> 资料 -> 实践/能力自检”组织结构
- 相近内容尽量合并，避免同一主题在多个文件中重复堆叠
- 优先按主题归档到子目录，例如 `architecture/`、`ai/`、`golang/`
- 如果文档使用 `vocabulary` frontmatter，统一使用 `phoneticUs` / `phoneticUk` 字段；默认以 `phoneticUs` 为主，旧 `phonetic` 字段仅兼容历史内容

## 目录结构

- `architecture/`：系统设计、架构方法、分布式与治理、案例实战
- `ai/`：Agent、LLM 应用、RAG、工作流
- `golang/`：Go 语言进阶、并发、性能、工程实践
