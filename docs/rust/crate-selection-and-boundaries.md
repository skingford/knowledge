---
title: Rust 常用 crate 选型与工程边界
description: 从 CLI、错误处理、序列化、async、HTTP、数据库到 tracing，整理 Rust 工程里高频 crate 的选型思路、适用场景和边界。
search: false
---

# Rust 常用 crate 选型与工程边界

Rust 项目很容易出现一种表面繁荣、实际混乱的状态：

- `cargo add` 很快
- crate 很多
- feature 很满
- 代码也能跑

但过一段时间就会发现：

- 编译越来越慢
- 错误边界越来越乱
- 同步 / async 混在一起
- 二进制体积和依赖树都失控

这页的目标不是列一个“Rust 必装依赖大全”，而是整理一个更稳的判断顺序：

什么时候该引 crate，为什么选它，它应该停在哪条边界上。

## 先立一条总原则

**先问职责，再选 crate。**

不要先问：

- “大家都在用什么？”
- “这个 crate 星星多不多？”
- “这是不是最流行？”

先问：

1. 这个问题标准库能不能先解决？
2. 我需要的是应用层便利，还是库层抽象？
3. 这个 crate 会不会把同步 / async、错误模型或宏复杂度带进来？
4. 我真的需要它的全部能力，还是只需要其中一小块？

Rust 生态里很多 crate 都很好，但“好”不等于“你的项目现在就该上”。

## 选型时至少看 5 件事

### 1. 维护和文档质量

优先看：

- 官方文档是否完整
- README / docs.rs 是否清楚
- feature flag 是否明确
- 常见用法是否有稳定示例

### 2. 职责边界

好 crate 应该有明确职责，例如：

- `clap` 做 CLI 参数解析
- `serde` 做数据编解码
- `tracing` 做结构化观测

如果一个 crate 想把配置、注入、运行时、反射、宏魔法全包进来，就要更谨慎。

### 3. feature flag 粒度

很多 Rust 工程问题，不是 crate 本身有问题，而是 feature 开太满。

要特别注意：

- 是否默认 feature 很重
- 是否能只开你要的能力
- 是否会顺手把 TLS、native 依赖、宏和 runtime 一起拉进来

### 4. 错误模型

选型时要看它更适合：

- 应用层快速收口
- 还是库层精确表达错误

如果一个 crate 的错误接口让你很难补上下文、很难映射边界，后面会很难维护。

### 5. 同步 / async 边界

Rust 项目里很多复杂度都来自这里。

要先搞清楚：

- 这个 crate 是同步还是异步
- 是否要求 Tokio runtime
- 能不能和你现有调用链自然衔接

不要为了一个 HTTP 请求，就把整个 CLI 改成 async；也不要在 async 服务里偷偷塞 blocking API。

## 先别急着加依赖：标准库已经够用的场景

下面这些能力，优先考虑标准库：

- 文件读写：`std::fs`
- 路径处理：`std::path`
- 环境变量：`std::env`
- 错误 trait：`std::error::Error`
- 时间和持续时间：`std::time`
- 线程和同步原语：`std::thread`、`std::sync`

如果你只是写一个小工具，不需要一上来就找第三方 crate 替代所有标准库能力。

## 一组够用的高频 crate

### 1. CLI 参数解析：`clap`

适合场景：

- 命令树清晰
- 需要 `--help`、`--version`、子命令、默认值、校验
- 想快速做出一个可用 CLI

为什么常用：

- docs.rs 文档完整
- derive 和 builder 两套用法都比较成熟
- 帮助信息、错误提示和子命令能力比较完整

什么时候适合：

- 命令行工具
- 本地自动化脚本升级成正式二进制工具
- 内部运维命令

什么时候别过度：

- 只是一个一次性 demo，参数极少
- 项目对编译速度和二进制体积极端敏感，且不需要丰富 CLI 能力

工程建议：

- 大多数业务 CLI 先用 derive
- 先把命令树设计清楚，再写实现
- 不要把业务逻辑塞进参数定义模块

### 2. 应用层错误收口：`anyhow`

适合场景：

- 二进制程序最外层
- CLI / service startup / job runner
- 需要快速把错误传播起来，同时补充上下文

为什么常用：

- 官方文档明确把它定位为应用中的易用错误处理
- `anyhow::Result<T>` 很适合边界层
- `Context` / `with_context` 对排障很实用

什么时候适合：

- `main`、`run()`、任务入口
- 应用装配层
- 内部工具和脚本型项目

什么时候别过度：

- 公共库 crate 的核心 API
- 你需要调用方精确判断错误种类的地方

工程建议：

- `anyhow` 停在应用层
- 往上补上下文，不要只是原样透传底层错误

### 3. 结构化错误：`thiserror`

适合场景：

- 库层或模块层需要稳定错误类型
- 你希望错误是 enum / struct，而不是直接抹平成动态错误

为什么常用：

- 自动生成 `Error` 和 `Display` 实现
- `#[from]` 很适合错误转换
- 官方文档明确说明它不会出现在你的公共 API 中

什么时候适合：

- config / parser / domain / repo 这类模块
- 需要让上层按错误种类做映射

什么时候别过度：

- 应用层所有函数都强行定义细颗粒错误
- 只是为了“更架构”，但没有实际判断需求

工程建议：

- 模块层用 `thiserror`
- 应用层用 `anyhow`
- 两者配合通常比单独只用一个更稳

### 4. 数据编解码：`serde`

适合场景：

- JSON、TOML、YAML、Query 参数、配置文件
- DTO、配置结构体、协议对象

为什么常用：

- 它几乎是 Rust 编解码生态的共同基础
- 很多格式 crate 都围绕 `Serialize` / `Deserialize`
- DTO、配置和 API 边界很容易收敛成结构体

什么时候适合：

- 配置文件
- HTTP 请求 / 响应
- 文件格式处理
- 测试数据装配

什么时候别过度：

- 领域模型和外部 DTO 强行完全复用
- 为了少写一个映射函数，把协议细节污染进核心模型

工程建议：

- 把 `serde` 视为边界层能力
- 不要默认让所有业务结构体都直接承担外部协议语义

如果你想把请求 DTO、领域模型和数据库模型的分层展开成一条完整主线，继续看：

- [Rust DTO、领域模型与存储模型分层实践](./dto-domain-and-persistence-model-practice.md)

### 5. Async 运行时：`tokio`

适合场景：

- 网络服务
- 大量并发等待
- channel、timeout、signal、task 调度

为什么常用：

- 文档和生态成熟
- async I/O、runtime、task、time、signal 能力完整
- 很多服务端 crate 直接围绕 Tokio 构建

什么时候适合：

- Web 服务
- 异步 worker
- 需要同时等多个 I/O 的程序

什么时候别过度：

- 单次文件处理 CLI
- 少量同步请求
- 没有明显并发等待的脚本型工具

工程建议：

- 先判断是不是真的需要 async
- 不要因为生态流行就把所有项目都上 Tokio
- 上 Tokio 后，明确 blocking 边界和 feature 范围

### 6. HTTP 客户端：`reqwest`

适合场景：

- CLI 调 API
- 服务调用外部 HTTP
- 需要常见 HTTP client 能力

为什么常用：

- 同时提供同步和异步用法
- 文档清楚
- 和常见 Rust 服务栈衔接自然

什么时候适合：

- CLI 用 `reqwest::blocking`
- 服务里用异步 `reqwest::Client`

什么时候别过度：

- 在 async runtime 里直接调用 blocking API
- 每次请求都新建 `Client`

工程建议：

- CLI 优先同步客户端
- 服务优先复用异步 `Client`
- TLS、JSON、blocking 等 feature 只开需要的

### 7. Web 服务：`axum`

适合场景：

- Rust HTTP API
- 需要 Router、extractor、state、middleware 的服务

为什么常用：

- 围绕 Tokio / tower 生态
- Router 和 extractor 模型清晰
- 在 Rust 服务里工程感比较强

什么时候适合：

- HTTP API
- 内部服务
- 需要比较清楚的中间件和状态注入边界

什么时候别过度：

- 你只是写一个本地 CLI
- 你还没理清 async 和状态边界，就先堆框架

工程建议：

- 先把错误边界、状态结构和 DTO 分层想清楚
- 框架不会自动替你解决项目结构问题

### 8. 数据库访问：`sqlx`

适合场景：

- 想保留显式 SQL
- 需要连接池、事务、迁移
- 希望查询宏和类型映射足够直接

为什么常用：

- 提供连接池和事务边界
- `query!` / `query_as!` 宏适合明确 SQL 路线
- 文档里对 prepared statement、pool、transaction 的能力比较完整

什么时候适合：

- 你愿意显式写 SQL
- 你不想一开始就引入重量级 ORM

什么时候别过度：

- 想用它同时兼容所有数据库而不接受能力折中
- 为了偷懒直接到处散落 SQL，不做 repo 或访问边界

工程建议：

- feature 只开当前数据库驱动和你要的能力
- `query!` 系列宏和迁移一起设计
- repo 层只负责数据访问，不要吞掉业务语义

### 9. 观测：`tracing` + `tracing-subscriber`

适合场景：

- 服务日志
- 请求链路
- task / async 调用路径
- 结构化事件记录

为什么常用：

- `tracing` 本身就是结构化、作用域化诊断系统
- `tracing-subscriber` 提供 subscriber、layer、filter 组合能力
- 很适合服务和异步程序

什么时候适合：

- 后端服务
- worker
- 需要 span / event 语义的程序

什么时候别过度：

- 一个很短命的小脚本，只有几行输出
- 把 `tracing` 写成另一个 `println!`

工程建议：

- `tracing` 放在应用观测边界
- 初始化尽量靠前
- 先把 event / span 字段设计清楚，再谈 exporter 和平台接入

## 两组高频组合

### 组合一：CLI 工具

一个务实的最小组合通常是：

- `clap`
- `anyhow`
- `thiserror`
- `serde` + `toml` / `serde_json`
- `assert_cmd`

如果还要调 HTTP：

- `reqwest` 的 blocking client

### 组合二：后端服务

一个务实的最小组合通常是：

- `tokio`
- `axum`
- `serde`
- `thiserror`
- `tracing` + `tracing-subscriber`
- `sqlx`

如果还要调用外部 HTTP：

- 异步 `reqwest::Client`

这两组组合并不是标准答案，但足够覆盖大多数第一版项目。

## feature flag 比 crate 名字更重要

很多依赖治理问题，最后不是选错 crate，而是：

- 默认 feature 开太多
- async / blocking 一起开
- 数据库驱动全开
- TLS 后端重复

几个很实用的原则：

- 先看 docs.rs 的 feature flags
- 能不开 `full` 就不开
- 一次只开当前项目真正需要的能力
- 把 TLS、数据库驱动、宏 feature 当成显式决策

## 常见误区

### 1. 只看流行度，不看边界

别人项目里适合，不代表你当前项目就适合。

### 2. 一开始就上很重的组合

比如：

- 小 CLI 上 Tokio + async HTTP + 一堆 middleware
- 单库项目过早拆很多 crate
- 配置问题还没复杂，就先上多层抽象

### 3. 应用层和库层用同一套错误策略

这通常会导致：

- 应用层过重
- 库层过虚
- 错误链路难看懂

### 4. 忽略 feature 和编译成本

Rust 工程里，依赖治理不只是能不能跑，还包括：

- 编译时长
- 二进制体积
- 依赖树复杂度
- 平台兼容性

## 一个够用的依赖选型清单

每次准备 `cargo add` 之前，先过一遍：

1. 标准库能不能先解决？
2. 这是应用层依赖，还是库层依赖？
3. 这个 crate 会不会强行把我带进 async / 宏 / 重 feature？
4. 我只需要它的哪几个 feature？
5. 如果后面要换掉它，边界会不会很疼？

如果这 5 个问题都答得清楚，再加依赖，通常不会太差。

## 推荐回查入口

- 工程基础：[错误处理、Cargo 与测试](./error-handling-cargo-and-testing.md)
- 项目结构：[项目结构、crate 组织与 API 设计](./project-structure-and-api-design.md)
- CLI 实践：[Rust CLI 工具实践](./cli-tool-practice.md)
- Web 服务：[Axum Web 服务实践](./axum-web-service-practice.md)
- 数据库访问：[SQLx 数据库访问实践](./sqlx-database-practice.md)
- 可观测性：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)

如果你已经会写 Rust，但每次新项目都在“依赖怎么选、feature 怎么开、边界怎么收”上反复返工，这页应该放进工程化阶段的必读列表。
