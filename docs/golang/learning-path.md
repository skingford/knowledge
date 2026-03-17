---
title: Go 学习路径与资料导航
description: 合并 Go 学习路线、专题入口与推荐资料，减少入口碎片化，帮助按阶段组织语言、并发、性能、工程实践与源码阅读。
search: false
---

# Go 学习路径与资料导航

这页用于合并原来的“进阶学习指南”和“推荐资料清单”两类入口，减少同一主题在多个页面重复出现。你可以把它当成 `docs/golang` 的总导航页：先定阶段，再进专题，最后补资料和练习。

## 怎么使用这页

- **想系统学一遍**：按“阶段学习路径”从上往下走
- **想补薄弱项**：直接跳到对应专题入口
- **想找书、博客、演讲和源码项目**：看文末“推荐资料”
- **想准备能力自检或面试**：直接看“练习与复盘入口”

## 阶段学习路径

### 第一阶段：语言与底层

目标：补齐值语义、切片、Map、接口、反射、泛型、逃逸分析和内存模型。

- 语言基础：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/01-language-fundamentals.md`](./guide/01-language-fundamentals.md)
- Slice 典型坑：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/01-slice-append-pitfalls.md`](./guide/01-slice-append-pitfalls.md)
- String / `[]byte` 实践：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/01-string-byte-best-practices.md`](./guide/01-string-byte-best-practices.md)
- 底层原理总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/02-underlying-principles.md`](./guide/02-underlying-principles.md)
- 逃逸分析：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/02-escape-analysis.md`](./guide/02-escape-analysis.md)

### 第二阶段：并发与调度

目标：建立 Goroutine、Channel、Context、Mutex 和调度器的完整心智模型。

- 并发编程总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/03-concurrency.md`](./guide/03-concurrency.md)
- 高级并发模式：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/03-advanced-concurrency-patterns.md`](./guide/03-advanced-concurrency-patterns.md)
- Context 使用边界：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/context-usage-boundaries.md`](./context-usage-boundaries.md)
- GMP / 调度源码：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/source-reading/runtime-scheduler.md`](./guide/source-reading/runtime-scheduler.md)
- Goroutine 生命周期：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/source-reading/goroutine.md`](./guide/source-reading/goroutine.md)

### 第三阶段：网络、工程与服务治理

目标：把语言能力落到服务端开发、连接治理、错误处理、测试和交付流程中。

- 网络编程与标准库：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/04-network-stdlib.md`](./guide/04-network-stdlib.md)
- 工程实践总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/05-engineering-practices.md`](./guide/05-engineering-practices.md)
- 数据库与缓存：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/06-database-cache.md`](./guide/06-database-cache.md)
- 微服务与分布式：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/08-microservices-distributed.md`](./guide/08-microservices-distributed.md)

### 第四阶段：性能、排障与运行时

目标：能从指标异常走到根因定位，并读懂 runtime 关键执行路径。

- 性能优化与排障：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/07-performance-troubleshooting.md`](./guide/07-performance-troubleshooting.md)
- Pprof 排障指南：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/pprof-troubleshooting-guide.md`](./pprof-troubleshooting-guide.md)
- 源码与 Runtime 总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/09-runtime-source.md`](./guide/09-runtime-source.md)
- `runtime/pprof`：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/source-reading/runtime-pprof.md`](./guide/source-reading/runtime-pprof.md)
- `runtime/trace`：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/source-reading/runtime-trace.md`](./guide/source-reading/runtime-trace.md)

### 第五阶段：进阶专题

目标：补齐设计模式、安全、容器化、代码生成和版本演进。

- 设计模式与惯用法：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/10-design-patterns-idioms.md`](./guide/10-design-patterns-idioms.md)
- 安全编程实践：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/10-security-practices.md`](./guide/10-security-practices.md)
- 容器化与云原生：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/10-containerization-cloud-native.md`](./guide/10-containerization-cloud-native.md)
- 代码生成与元编程：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/10-codegen-metaprogramming.md`](./guide/10-codegen-metaprogramming.md)
- Go 版本特性：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-version-features.md`](./go-version-features.md)

## 按目标选入口

| 你的目标 | 建议先看 |
| --- | --- |
| 快速建立 Go 全景认知 | `guide/01` → `guide/03` → `guide/05` |
| 想把并发讲清楚 | `guide/03-concurrency` → `guide/03-advanced-concurrency-patterns` → `runtime-scheduler` |
| 想提升排障能力 | `guide/07-performance-troubleshooting` → `pprof-troubleshooting-guide` → `runtime-trace` |
| 想准备能力自检/面试 | `go-top-30-interview-questions` → `go-interview-code-snippets` → 对应 guide 专题 |
| 想系统读源码 | `guide/09-runtime-source` → `guide/source-reading/index` |

## 练习与复盘入口

- 自检导航：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/interview-prep.md`](./interview-prep.md)
- 高频题总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-top-30-interview-questions.md`](./go-top-30-interview-questions.md)
- 题目示例代码：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/go-interview-code-snippets.md`](./go-interview-code-snippets.md)
- 源码精读总览：[`/Users/kingford/workspace/github.com/knowledge/docs/golang/guide/source-reading/index.md`](./guide/source-reading/index.md)

建议的使用顺序：

1. 先用题库暴露薄弱项
2. 再回到对应专题页补原理和实践
3. 最后用源码精读页补“为什么”

## 推荐资料

### 官方资料

- [Go 官方博客](https://go.dev/blog/)
- [语言规范](https://go.dev/ref/spec)
- [标准库文档](https://pkg.go.dev/std)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go Memory Model](https://go.dev/ref/mem)
- [Release Notes](https://go.dev/doc/devel/release)

### 推荐书单

#### 基础到进阶

- `The Go Programming Language`
- `Learning Go, 2nd Edition`
- `Go in Action`

#### 并发与底层

- `Concurrency in Go`
- `100 Go Mistakes and How to Avoid Them`

#### 工程与系统设计

- `Let's Go`
- `Let's Go Further`
- `Cloud Native Go`

### 推荐演讲

- `Concurrency Is Not Parallelism` — Rob Pike
- `Go Proverbs` — Rob Pike
- `Understanding Channels` — Kavya Joshi
- `The Scheduler Saga` — Kavya Joshi
- `Profiling Go Programs` — Rhys Hiltner

### 值得长期关注的博客

- [Dave Cheney](https://dave.cheney.net/)
- [Russ Cox](https://research.swtch.com/)
- [Eli Bendersky](https://eli.thegreenplace.net/tag/go)
- [Ardan Labs Blog](https://www.ardanlabs.com/blog/)

### 值得阅读的开源项目

- [gin](https://github.com/gin-gonic/gin)
- [etcd](https://github.com/etcd-io/etcd)
- [minio](https://github.com/minio/minio)
- [cobra](https://github.com/spf13/cobra)
- [wire](https://github.com/google/wire)

## 当前整理原则

为减少 `docs/golang` 内的碎片化，后续按下面的规则组织：

- **入口型内容尽量合并**：同类“路线/书单/资料导航”优先收敛到本页
- **专题页负责讲清楚**：例如并发、性能、工程实践、runtime
- **深度页负责补细节**：例如 `context-usage-boundaries`、`pprof-troubleshooting-guide`
- **源码页负责解释实现**：统一放在 `guide/source-reading/`

如果你是第一次进入这个目录，建议直接从本页开始，再进入具体专题。
