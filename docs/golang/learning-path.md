---
title: Go 学习路径与资料导航
description: Go 通用学习导航，负责串联专题入口；源码阅读相关路线、方法与资料已统一收口到 guide/source-reading。
search: false
---

# Go 学习路径与资料导航

这页现在只负责 `docs/golang` 的通用专题导航：先定阶段，再进专题，最后回到自检与源码阅读模块。源码阅读相关的路线、方法、runtime 导读和资料清单，已经统一收口到 [Go 源码阅读学习主线](./guide/source-reading/learning-path.md)。

## 怎么使用这页

- **想系统学一遍**：按“阶段学习路径”从上往下走
- **想补薄弱项**：直接跳到对应专题入口
- **想系统读源码**：直接去 [Go 源码阅读学习主线](./guide/source-reading/learning-path.md)
- **想准备能力自检或面试**：直接看“练习与复盘入口”

## 阶段学习路径

### 第一阶段：语言与底层

目标：补齐值语义、切片、Map、接口、反射、泛型、逃逸分析和内存模型。

- 语言基础：[语言基础深化](./guide/01-language-fundamentals.md)
- Slice 典型坑：[Slice 的坑：append 污染原底层数组与三指切片](./guide/01-slice-append-pitfalls.md)
- String / `[]byte` 实践：[String 与 \[\]byte：转换、构建与数据流最佳实践](./guide/01-string-byte-best-practices.md)
- 底层原理总览：[底层原理](./guide/02-underlying-principles.md)
- 逃逸分析：[逃逸分析、栈与堆：Go 编译器如何决定内存分配](./guide/02-escape-analysis.md)

### 第二阶段：并发与调度

目标：建立 Goroutine、Channel、Context、Mutex 和调度器的完整心智模型。

- 并发编程总览：[并发编程](./guide/03-concurrency.md)
- 高级并发模式：[高级并发模式](./guide/03-advanced-concurrency-patterns.md)
- Context 使用边界：[Context 使用边界](./context-usage-boundaries.md)
- GMP / 调度源码：[GMP 调度器源码精读](./guide/source-reading/runtime-scheduler.md)
- Goroutine 生命周期：[Goroutine 生命周期源码精读](./guide/source-reading/goroutine.md)

### 第三阶段：网络、工程与服务治理

目标：把语言能力落到服务端开发、连接治理、错误处理、测试和交付流程中。

- 网络编程与标准库：[网络编程与标准库](./guide/04-network-stdlib.md)
- 工程实践总览：[工程实践](./guide/05-engineering-practices.md)
- 数据库与缓存：[数据库与缓存](./guide/06-database-cache.md)
- 微服务与分布式：[微服务与分布式](./guide/08-microservices-distributed.md)

### 第四阶段：性能、排障与运行时

目标：能从指标异常走到根因定位，并读懂 runtime 关键执行路径。

- 性能优化与排障：[性能优化与排障](./guide/07-performance-troubleshooting.md)
- Pprof 排障指南：[Pprof 排障指南](./pprof-troubleshooting-guide.md)
- 源码阅读主线：[Go 源码阅读学习主线](./guide/source-reading/learning-path.md)
- `runtime/pprof`：[runtime/pprof + net/http/pprof 源码精读](./guide/source-reading/runtime-pprof.md)
- `runtime/trace`：[runtime/trace 源码精读](./guide/source-reading/runtime-trace.md)

### 第五阶段：进阶专题

目标：补齐设计模式、安全、容器化、代码生成和版本演进。

- 设计模式与惯用法：[设计模式与惯用法](./guide/10-design-patterns-idioms.md)
- 安全编程实践：[安全编程实践](./guide/10-security-practices.md)
- 容器化与云原生：[容器化与云原生实践](./guide/10-containerization-cloud-native.md)
- 代码生成与元编程：[代码生成与元编程](./guide/10-codegen-metaprogramming.md)
- Go 版本特性：[Go 版本特性总结（1.21 ~ 1.24）](./go-version-features.md)

## 按目标选入口

| 你的目标 | 建议先看 |
| --- | --- |
| 快速建立 Go 全景认知 | `guide/01` → `guide/03` → `guide/05` |
| 想把并发讲清楚 | `guide/03-concurrency` → `guide/03-advanced-concurrency-patterns` → `runtime-scheduler` |
| 想提升排障能力 | `guide/07-performance-troubleshooting` → `pprof-troubleshooting-guide` → `runtime-trace` |
| 想准备能力自检/面试 | `go-top-30-interview-questions` → `go-interview-code-snippets` → 对应 guide 专题 |
| 想系统读源码 | `guide/source-reading/learning-path` → `guide/source-reading/index` |

## 练习与复盘入口

- 自检导航：[Go 能力自检与面试准备导航](./interview-prep.md)
- 高频题总览：[30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)
- 题目示例代码：[Golang 能力自检高频题示例代码片段](./go-interview-code-snippets.md)
- 源码阅读主线：[Go 源码阅读学习主线](./guide/source-reading/learning-path.md)
- 源码精读总览：[Go 源码精读总览](./guide/source-reading/index.md)

建议的使用顺序：

1. 先用题库暴露薄弱项
2. 再回到对应专题页补原理和实践
3. 最后用源码精读页补“为什么”

## 源码阅读与资料入口

- 路线、方法、资料统一入口：[Go 源码阅读学习主线](./guide/source-reading/learning-path.md)
- 按包索引：[Go 源码精读总览](./guide/source-reading/index.md)

这样处理之后，根目录导航页不再重复维护书单、博客、runtime 导读等内容，源码模块相关信息只在 `guide/source-reading/` 下更新。

## 当前整理原则

为减少 `docs/golang` 内的碎片化，后续按下面的规则组织：

- **通用专题留在根目录**：语言、并发、性能、工程实践继续在 `guide/*`
- **源码阅读统一收口**：路线、方法、资料和 runtime 导读统一放到 `guide/source-reading/`
- **专题页负责讲清楚**：例如并发、性能、工程实践、runtime
- **深度页负责补细节**：例如 `context-usage-boundaries`、`pprof-troubleshooting-guide`
- **历史重复入口只保留归档说明**：避免再维护两份相同内容

如果你是第一次进入这个目录，建议直接从本页开始，再进入具体专题。
