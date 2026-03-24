---
title: Rust Workspace 与 Monorepo 实践
description: 从单 crate 何时升级到 workspace，到 members、default-members、workspace.dependencies、resolver 与依赖治理，整理 Rust 多 crate 项目的工程主线。
search: false
---

# Rust Workspace 与 Monorepo 实践

很多 Rust 项目在单 crate 阶段都还算清楚，但一旦开始出现：

- 一个共享库 + 一个 CLI
- 一个 HTTP 服务 + 一个 worker
- 多个内部工具共用一批基础模块

很快就会碰到一个新问题：

什么时候该上 workspace，以及上了之后怎么不把复杂度放大。

这页讲的不是 Cargo 语法速查，而是 Rust 多 crate 项目真正会遇到的工程问题。

## 先给一个结论

**workspace 解决的是多个 crate 的协作，不是单个 crate 的文件组织。**

如果你当前的问题只是：

- `src/` 太大
- 模块太多
- `main.rs` 太胖

先想 module、`lib.rs`、分层和 API 边界，不要直接跳到 workspace。

workspace 真正适合的，是已经出现多个独立产物或明确复用边界的项目。

## 什么信号说明该从单 crate 升级

比较常见的信号有这些：

1. 一个库 crate 和一个二进制 crate 已经明显分层
2. HTTP 服务和 CLI / worker 共享一批公共能力
3. 领域模型、配置、观测或 repo 抽象开始被多个入口复用
4. 你想统一依赖版本、构建和测试入口
5. 单 crate 虽然还能塞，但边界已经越来越模糊

如果还没到这个阶段，单 crate 保持清楚通常更划算。

## 什么情况不该急着上 workspace

- 只是因为“看起来更架构化”
- 现在只有一个二进制入口
- 边界还在频繁变化
- 团队还没想清依赖方向

过早拆 workspace，最容易出现的结果是：

- crate 数量变多
- 公共接口变虚
- 修改一个小点要跨很多目录跳

Rust 不是 crate 越多越高级。

## 先分清 3 个层次

### 1. module

解决单个 crate 内部的文件和命名空间组织。

### 2. crate

解决编译产物、依赖单元和 API 边界。

### 3. workspace

解决多个 crate 的依赖、构建、测试和版本协同。

很多项目的问题其实卡在 crate 边界，误以为要靠 workspace 解决。

## 一个务实的 workspace 目录

```text
workspace/
├── Cargo.toml
├── crates/
│   ├── domain/
│   ├── config/
│   └── infra/
└── apps/
    ├── server/
    ├── worker/
    └── cli/
```

这种结构适合：

- `crates/` 放公共库
- `apps/` 放具体入口
- 每个入口依赖公共库，但尽量不要反过来

关键不是名字，而是边界清楚。

## 最小根清单长什么样

Cargo 官方文档说明，workspace 的根清单由 `[workspace]` 管理 members；如果是 virtual workspace，还应该在 `[workspace]` 下显式设置 `resolver`。

一个最小可用例子：

```toml
[workspace]
members = [
  "apps/server",
  "apps/worker",
  "crates/domain",
  "crates/infra",
]
resolver = "3"
default-members = ["apps/server"]
```

这里几件事很重要：

- `members` 明确哪些 crate 属于 workspace
- `resolver` 是 workspace 级别设置
- `default-members` 决定在根目录默认操作哪些成员

## `default-members` 很实用

Cargo 官方命令文档明确提到，在 workspace 根目录运行 `cargo build`、`cargo check`、`cargo package` 这类命令时，默认选中的包和 `default-members` 有关。

它的工程价值很直接：

- 让根目录默认只检查最常开发的入口
- 避免每次无脑把整个 monorepo 都拉起来

特别是当 workspace 里既有服务，又有 CLI、工具、实验 crate 时，`default-members` 很值。

## `workspace.dependencies` 是统一依赖版本的关键

Cargo 官方依赖文档说明：

- 可以在 `[workspace.dependencies]` 里统一声明依赖
- 各成员再通过 `workspace = true` 继承

一个常见写法：

```toml
[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
tracing = "0.1"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }

# apps/server/Cargo.toml
[dependencies]
serde.workspace = true
tracing.workspace = true
tokio.workspace = true
```

它带来的收益：

- 版本统一
- 升级点集中
- review 时更容易发现依赖变化

但也要注意两个边界：

- workspace 依赖适合统一版本，不等于所有 feature 都要统一开
- feature 是加法，不是减法

## feature 联合是 workspace 里最容易踩的坑

Cargo 解析器会对依赖 feature 做联合。

这意味着：

- 一个成员开了某个 feature
- 另一个成员没开
- 最终构建时可能还是会统一启用

典型风险包括：

- 某个成员想保持轻量，却被服务端成员带重
- CLI 只想 blocking HTTP，却被别的成员把 async 相关特性一并放大
- TLS、数据库驱动、序列化 feature 被整个 workspace 污染

比较稳的做法：

1. 先把真正值得统一的依赖放进 `workspace.dependencies`
2. 不要把所有重量级 feature 都提前开在根上
3. 对重量级依赖保留成员级决策空间

## `resolver` 不是装饰项

Cargo 官方文档说明：

- `resolver` 是 workspace 级别选项
- virtual workspace 需要在 `[workspace]` 里显式设置
- Rust 2024 默认是 `resolver = "3"`

工程上你至少要知道：

- `resolver` 会影响 feature 和依赖解析行为
- 这个值只看顶层 workspace，不看成员 crate

如果你在多 crate 项目里忽略它，后面处理 feature 和 MSRV 问题会很被动。

## 一套够用的依赖方向

一个比较稳的依赖方向通常是：

- `apps/*` 依赖 `crates/*`
- 公共库之间尽量单向依赖
- 入口 crate 不要被反向依赖

例如：

- `apps/server` -> `crates/domain`、`crates/infra`
- `apps/cli` -> `crates/domain`
- `crates/domain` 不依赖 `apps/*`

如果依赖箭头开始乱飞，workspace 只会让混乱放大。

## 哪些东西适合拆成公共 crate

更适合拆的通常是：

- 领域模型
- 配置加载与校验
- 错误类型
- repo trait 或公共协议对象
- CLI / worker / server 都会用的工具模块

不太适合过早拆的通常是：

- 还在频繁改动的业务逻辑
- 只是暂时有两个文件重复
- 目前只有一个入口会用的代码

“能复用”不等于“现在就值得独立成 crate”。

## 根目录常用命令要会用

Cargo 在 workspace 根目录下，很多命令都能直接针对多个成员工作。

最常用的几类：

```bash
cargo check
cargo check --workspace
cargo check -p server
cargo test --workspace
cargo build -p cli --release
cargo tree -d
```

几个关键点：

- `-p` 很适合只针对一个成员操作
- `--workspace` 适合全量检查
- `cargo tree -d` 很适合找重复依赖版本

## `Cargo.lock` 只有一份是正常的

Rust Book 的 workspace 章节明确提到：

- workspace 顶层只有一个 `Cargo.lock`

它的工程意义是：

- 所有成员共享同一套解析结果
- 兼容版本更容易统一
- CI 结果更稳定

## 一个逐步升级的顺序

不要从第一天就搭完整 monorepo。更稳的顺序通常是：

1. 先做单 crate
2. 把可复用逻辑先收进 `lib.rs`
3. 再拆出一个公共库 crate
4. 出现第二个入口后再拉 workspace
5. 最后才考虑 `crates/`、`apps/`、shared infra 这些更长期结构

这样做的好处是：

- 边界来自真实演进
- 不会因为预设计过多而卡住开发

## 常见误区

### 1. 以为 workspace 能自动带来好架构

它只是让多个 crate 更好协作，不会自动给你清晰边界。

### 2. 公共 crate 过多过细

会导致：

- 改一点要跨很多包
- 公共 API 过早固化
- review 成本上升

### 3. 根 workspace 把 feature 开太满

结果通常是：

- CLI 被服务依赖带重
- 编译时间拉长
- 二进制体积膨胀

### 4. 不会用 `-p`、`default-members`、`cargo tree -d`

最后所有命令都变成“全仓构建”，开发体验会越来越差。

## 一个够用的 workspace 清单

每次准备引入或重构 workspace 时，先过一遍：

1. 我现在是不是已经有多个独立入口或公共库边界？
2. 这个问题是 crate 边界问题，还是 module 组织问题？
3. `workspace.dependencies` 里哪些依赖真的值得统一？
4. `default-members` 应该默认选哪些成员？
5. 有没有 feature 被 workspace 放大或污染？

这 5 个问题想清楚，workspace 基本不会走偏太多。

## 推荐回查入口

- 项目结构：[项目结构、crate 组织与 API 设计](./project-structure-and-api-design.md)
- 依赖治理：[Rust 常用 crate 选型与工程边界](./crate-selection-and-boundaries.md)
- CLI 工具实践：[Rust CLI 工具实践](./cli-tool-practice.md)
- 配置管理：[Rust 配置管理实践](./configuration-management-practice.md)
- 后台任务：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 后端骨架：[Rust 后端项目骨架](./backend-project-skeleton.md)

如果你已经从单 crate 走到多入口项目，这页应该作为工程化阶段的下一步必读页。
