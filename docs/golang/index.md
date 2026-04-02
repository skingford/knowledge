---
title: Go 文档导航
description: Go 文档总入口，按学习主线、源码精读、能力自检、进阶专题与实战补充统一整理。
search: false
aside: false
outline: false
---

# Go 文档导航

`docs/golang` 现在不再把所有内容平铺成一层，而是按下面几类入口组织：

- **学习主线**：从语言基础、并发、工程实践一路走到性能、分布式与进阶专题
- **源码精读**：标准库与 runtime 的独立阅读主线
- **能力自检**：题库、代码片段、面试回查入口
- **进阶专题**：设计模式、安全、容器化与代码生成等深水区主题
- **实战补充**：`context`、`pprof`、`database/sql`、版本特性这类高频单点专题

如果你刚进这个目录，先不要直接翻文件名，先按目标选入口。

## 你现在应该去哪里

| 目标 | 入口 | 说明 |
| --- | --- | --- |
| 想系统学 Go 主线 | [Go 学习路径与资料导航](./learning-path.md) | 从阶段学习路径切入，按 01-10 大纲推进 |
| 想找靠谱的 Go 第三方库 | [Go 优秀第三方库专题](./excellent-open-source.md) | 按并发、Web、数据访问、CLI、日志和测试分类整理 |
| 想直接读 runtime / 标准库源码 | [Go 源码阅读学习主线](./guide/source-reading/learning-path.md) | 统一收口源码阅读路线、方法和资料 |
| 想准备面试或做能力自检 | [Go 能力自检与面试准备导航](./interview-prep.md) | 题库、代码片段、专题回查集中在这里 |
| 想补 `database/sql` 与连接池 | [database/sql 与连接池](./guide/06-database-sql-and-connection.md) | Go 标准库数据库接入与池化配置 |
| 想补设计、安全、容器化和代码生成 | [进阶专题](./guide/10-advanced-topics.md) | 统一收口 `10-*` 系列专题入口 |
| 想补线上排障 | [Pprof 排障指南](./pprof-troubleshooting-guide.md) | 先从 profile 和 trace 的实操路径开始 |
| 想看工程边界问题 | [Context 使用边界](./context-usage-boundaries.md) | 适合补服务治理、取消传播和值传递边界 |
| 想从源码看懂 `context` | [context 包源码精读](./guide/source-reading/context.md) | 适合补取消树、`WithoutCancel` 和 `net/http` 请求生命周期 |

## 目录结构

```text
golang/
├── index.md                        目录总入口
├── learning-path.md                通用学习主线
├── excellent-open-source.md        优秀第三方库专题
├── interview-prep.md               能力自检与面试导航
├── context-usage-boundaries.md     Context 边界专题
├── pprof-troubleshooting-guide.md  性能排障专题
├── go-version-features.md          Go 版本特性汇总
├── legacy/                         旧入口兼容页（源码层已归档，路由保持不变）
├── guide/
│   ├── 01-10-*                     主线专题
│   ├── 06-database-sql-and-connection.md
│   ├── legacy/                     旧 runtime 入口兼容页
│   └── source-reading/             源码精读模块
```

## 先看哪几类文档

### 1. 主线专题

适合系统推进的人，重点看 `guide/01` 到 `guide/10`。

- [语言基础深化](./guide/01-language-fundamentals.md)
- [并发编程](./guide/03-concurrency.md)
- [工程实践](./guide/05-engineering-practices.md)
- [数据库与缓存](./guide/06-database-cache.md)
- [性能优化与排障](./guide/07-performance-troubleshooting.md)
- [微服务与分布式](./guide/08-microservices-distributed.md)
- [进阶专题](./guide/10-advanced-topics.md)
- [Go 优秀第三方库专题](./excellent-open-source.md)

### 2. 源码精读模块

适合已经在做 Go 服务，想直接补 runtime、`net/http`、`database/sql`、`sync` 实现的人。

- [Go 源码阅读学习主线](./guide/source-reading/learning-path.md)
- [Go 源码精读总览](./guide/source-reading/index.md)
- [context 包源码精读](./guide/source-reading/context.md)

### 3. 实战补充页

这些页不属于“大纲章节”，但在工程里会被频繁回查。

- [Context 使用边界](./context-usage-boundaries.md)
- [context 包源码精读](./guide/source-reading/context.md)
- [Pprof 排障指南](./pprof-troubleshooting-guide.md)
- [database/sql 与连接池](./guide/06-database-sql-and-connection.md)
- [Go 版本特性总结](./go-version-features.md)
- [Go 优秀第三方库专题](./excellent-open-source.md)

### 4. 能力自检模块

适合面试准备、阶段复盘和知识盲区扫描。

- [Go 能力自检与面试准备导航](./interview-prep.md)
- [30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)
- [Golang 能力自检高频题示例代码片段](./go-interview-code-snippets.md)

## 当前整理原则

- 根目录只保留少量高价值入口页，不再继续堆“重复导航页”
- `guide/*` 负责系统专题
- `guide/source-reading/*` 负责源码精读
- 高频单点问题保留独立专题页，避免硬塞回长篇大纲里
- 旧入口只做兼容，不再作为正式起点维护

如果你只想记住一个入口，先从 [Go 学习路径与资料导航](./learning-path.md) 开始；如果你本来就是冲着源码来的，直接进 [Go 源码阅读学习主线](./guide/source-reading/learning-path.md)。
