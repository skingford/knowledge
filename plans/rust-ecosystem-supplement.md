# Rust 生态补充计划

## 需求重述

当前 Rust 专题已有 62 篇文章，覆盖语言基础、Axum Web 服务、SQLx 数据库、Tokio 异步、Serde 序列化、可观测性和大量后端工程实践。内容深度很高，但**生态广度**不足——几乎所有内容都围绕 Axum + SQLx + Tokio 这一条后端主线，缺少 Rust 在其他重要领域的生态覆盖。

本次补充目标：**围绕 Rust 生态的多样性，补齐工程师在实际选型和拓展时需要了解的关键生态方向**。

---

## 现有覆盖 vs 空白分析

| 领域 | 现有覆盖 | 空白 |
|------|---------|------|
| Web 框架 | Axum 深度覆盖 | Actix-web、Rocket、Poem 对比缺失 |
| API 协议 | REST 深度覆盖 | gRPC (tonic)、GraphQL (async-graphql) 缺失 |
| ORM/数据库 | SQLx 深度覆盖 | Diesel、SeaORM 对比缺失 |
| 前端/全栈 | 无 | Leptos、Dioxus、Yew (Rust 全栈) 缺失 |
| WebAssembly | 无 | wasm-bindgen、wasm-pack、WASI 缺失 |
| 桌面/GUI | 无 | Tauri、egui、Iced、Dioxus Desktop 缺失 |
| 嵌入式 | 无 | no_std、embedded-hal、probe-rs 缺失 |
| 游戏 | 无 | Bevy、wgpu 缺失 |
| 数据处理 | 无 | Polars、DataFusion、Arrow 缺失 |
| 网络编程 | HTTP 层覆盖 | 底层 TCP/UDP、tonic gRPC、QUIC 缺失 |
| 密码学/安全 | 无 | rustls、ring、RustCrypto 缺失 |
| 云原生/Serverless | 部署清单有 | AWS Lambda Rust、Shuttle、Workers 缺失 |
| 跨平台编译 | 无 | cross、cargo-zigbuild、目标三元组 缺失 |
| Rust 工具链生态 | Cargo 基础有 | cargo 扩展插件、rustup 组件、CI 最佳实践 缺失 |

---

## 计划文章列表（12 篇）

按优先级排序，分 3 个批次：

### 批次一：与后端主线互补的核心生态（4 篇）

#### 1. `rust-web-framework-landscape.md` — Rust Web 框架生态与选型对比
- 覆盖：Axum、Actix-web、Rocket、Poem、Warp
- 重点：架构差异、性能特征、生态兼容性、选型决策树
- 与现有 axum-web-service-practice.md 互补，不重复

#### 2. `grpc-and-tonic-practice.md` — Rust gRPC 与 Tonic 实践
- 覆盖：tonic、prost、proto 定义、服务端/客户端、流式 RPC、拦截器、健康检查
- 补齐 REST 之外最重要的 API 协议

#### 3. `graphql-and-async-graphql-practice.md` — Rust GraphQL 与 async-graphql 实践
- 覆盖：async-graphql、Schema/Query/Mutation、DataLoader、订阅、与 Axum 集成
- 补齐第二个重要的 API 协议

#### 4. `orm-and-database-ecosystem.md` — Rust 数据库生态与 ORM 选型对比
- 覆盖：SQLx vs Diesel vs SeaORM、查询构建器 vs ORM、迁移工具对比
- 与现有 sqlx-database-practice.md 互补

### 批次二：Rust 独特优势领域（4 篇）

#### 5. `webassembly-and-wasm-practice.md` — Rust WebAssembly 实践
- 覆盖：wasm-bindgen、wasm-pack、wasm-opt、WASI、浏览器集成、性能边界
- Rust 最独特的生态优势之一

#### 6. `tauri-and-desktop-practice.md` — Rust 桌面应用与 Tauri 实践
- 覆盖：Tauri 2.0 架构、前后端通信、系统 API、打包分发、与 Electron 对比
- Rust 桌面应用最主流方案

#### 7. `embedded-rust-and-no-std.md` — 嵌入式 Rust 与 no_std 实践
- 覆盖：no_std 基础、embedded-hal、常见 MCU 目标、probe-rs、RTIC
- Rust 系统级编程的核心场景

#### 8. `data-processing-and-polars.md` — Rust 数据处理与 Polars 生态
- 覆盖：Polars、Arrow、DataFusion、与 Python 互操作、性能对比
- 数据工程领域 Rust 增长最快的方向

### 批次三：工程支撑与前沿方向（4 篇）

#### 9. `cross-compilation-and-targets.md` — Rust 跨平台编译与目标管理
- 覆盖：target triple、cross、cargo-zigbuild、musl 静态编译、CI 多平台构建
- 实际部署中的高频需求

#### 10. `cargo-ecosystem-and-toolchain.md` — Cargo 生态与工具链深度
- 覆盖：cargo 扩展（cargo-audit/deny/expand/flamegraph/nextest）、rustup 组件、edition、CI 最佳实践
- 现有 error-handling-cargo-and-testing.md 只涉及基础

#### 11. `rust-fullstack-and-leptos.md` — Rust 全栈与 Leptos 实践
- 覆盖：Leptos、SSR/CSR/Hydration、信号系统、与 Axum 集成、对比 Dioxus/Yew
- Rust 全栈 Web 的代表方向

#### 12. `bevy-and-game-development.md` — Rust 游戏开发与 Bevy 引擎
- 覆盖：Bevy ECS 架构、资源系统、渲染管线、常用插件、与 Unity/Godot 定位对比
- Rust 社区最活跃的应用领域之一

---

## 风险与应对

| 风险 | 级别 | 应对 |
|------|------|------|
| 生态变化快，内容容易过时 | 中 | 聚焦架构思路和选型逻辑，少写版本细节 |
| 部分领域（嵌入式/游戏）距离现有读者群较远 | 低 | 保持"工程师视角"，强调选型边界而非教程 |
| 12 篇内容量较大 | 中 | 分 3 批次，每批独立可交付 |
| 与现有 crate-selection-and-boundaries.md 可能重叠 | 低 | 选型文章侧重深度对比，现有文章侧重判断原则 |

---

## 每篇文章结构

沿用项目现有风格（非 TEMPLATE.md 的入门模板，而是实践文章风格）：

```
---
title: 标题
description: 描述
search: false
---

# 标题

开篇定位：这篇解决什么问题，面向什么场景

## 核心概念 / 生态全景
## 选型对比（表格 + 适用边界）
## 工程实践（代码示例 + 反模式）
## 与现有技术栈的关系（如何与 Axum/SQLx/Tokio 配合）
## 常见误区
## 自检问题
```

---

## 实施步骤

1. **确认计划** — 用户审批文章列表和优先级
2. **批次一实施** — 先写 4 篇与后端主线互补的核心生态文章
3. **更新配置** — 在 rust.ts 中添加 sidebar 分组 "生态与选型"，注册新文章到 docs/order
4. **批次二实施** — 写 4 篇 Rust 独特优势领域文章
5. **批次三实施** — 写 4 篇工程支撑与前沿方向文章
6. **更新入口** — 更新 learning-path.md 和 essential-knowledge.md 添加生态导航

---

## 复杂度评估

- **整体复杂度**：中高（12 篇技术文章，每篇需要准确的生态调研）
- **单篇预计规模**：300-500 行 Markdown
- **配置变更**：rust.ts（sidebar + docs + scope + order）

**等待确认：是否按此计划执行？可调整文章列表、优先级或批次划分。**
