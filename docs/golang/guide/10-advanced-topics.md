---
title: 进阶专题
description: Go 进阶专题总览页，按设计模式、安全、容器化与代码生成拆分为 4 个专题入口。
search: false
---

# 进阶专题

## 适合人群

- 已经掌握 Go 基础与服务端开发，希望补齐“工程深水区”专题的开发者
- 正在准备高级面试或技术晋升，需要系统梳理设计、安全、交付与工具链能力的工程师
- 想把 Go 项目从“能跑”推进到“可维护、可交付、可治理”的团队成员

## 学习目标

- 补齐 Go 代码设计、惯用法和工程抽象能力
- 建立安全开发的基础清单，减少常见漏洞和误用
- 形成容器化部署、云原生交付和运行治理的基本方法
- 理解 Go 的代码生成、元编程和工具链扩展思路

## 建议阅读顺序

1. [设计模式与惯用法](./10-design-patterns-idioms)
2. [安全编程实践](./10-security-practices)
3. [容器化与云原生实践](./10-containerization-cloud-native)
4. [代码生成与元编程](./10-codegen-metaprogramming)

<GoAdvancedTopicDiagram kind="overview" />

## 主题拆分

### 1. 设计模式与惯用法

适合先补代码组织能力，覆盖：

- Functional Options、Builder、Strategy 等常见模式
- Repository / Service / Handler 分层
- 依赖注入与中间件装饰器写法
- 错误处理、Table-Driven Tests、Iterator 等 Go 惯用法

入口：[开始阅读](./10-design-patterns-idioms)

### 2. 安全编程实践

适合补线上风险防护清单，覆盖：

- 密码哈希、JWT、TLS 等认证与加密基础
- SQL 注入、XSS、CSRF 等常见攻击防护
- Secret 管理、安全 Header 与输入校验
- `gosec`、速率限制与暴力破解防护

入口：[开始阅读](./10-security-practices)

### 3. 容器化与云原生实践

适合补交付与部署能力，覆盖：

- 多阶段 Docker 构建与镜像瘦身
- 优雅关闭、健康检查、信号处理
- Kubernetes 部署与 12-Factor App 实践
- 本地开发环境与 CI/CD 流水线

入口：[开始阅读](./10-containerization-cloud-native)

### 4. 代码生成与元编程

适合补工具链与自动化能力，覆盖：

- `go generate`、`stringer`、`mockgen`、`wire`
- `go/ast`、`go/parser` 与模板代码生成
- `go:embed`、构建标签与条件编译
- 代码生成、反射与泛型之间的取舍

入口：[开始阅读](./10-codegen-metaprogramming)

## 对照关系

- 设计与抽象 -> [设计模式与惯用法](./10-design-patterns-idioms)
- 安全与防护 -> [安全编程实践](./10-security-practices)
- 交付与部署 -> [容器化与云原生实践](./10-containerization-cloud-native)
- 工具链与自动化 -> [代码生成与元编程](./10-codegen-metaprogramming)
