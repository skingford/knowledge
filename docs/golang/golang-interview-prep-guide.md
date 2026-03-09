# 高级 Golang 面试学习资料

## 适合人群

- 正在准备 Go 高级开发、后端、架构相关面试的工程师
- 想把 Go 知识按面试模块系统整理的人
- 希望从“知道概念”升级到“能系统回答”的人

## 学习目标

- 按面试最常见的模块建立复习框架
- 把语言原理、并发、工程、系统设计串成一套资料
- 沉淀成适合背诵和复盘的 Go 面试资料库

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [完整大纲文档](#完整大纲文档)
- [推荐目录](#推荐目录)
- [面试高频专题](#面试高频专题)
- [适合面试的资料来源](#适合面试的资料来源)
- [最值得精读的方向](#最值得精读的方向)
- [推荐整理方式](#推荐整理方式)

## 完整大纲文档

- 详细版本见：[高级 Golang 面试资料完整大纲](./golang-interview-outline.md)

## 推荐目录

### Golang 基础深化

- Slice、Map、Channel 底层原理
- `defer`、`panic`、`recover`
- Interface、反射、泛型
- 内存逃逸、值传递 / 引用语义

### 并发编程

- Goroutine 调度模型
- GMP 模型
- Channel 原理
- Context 使用
- Mutex、RWMutex、Atomic、`sync.Map`
- 并发安全与常见坑

### 内存与性能

- GC 原理
- 内存分配机制
- 对象逃逸分析
- `pprof` 性能分析
- 常见性能优化手段

### 网络编程与标准库

- `net/http`
- TCP/UDP
- HTTP Client / Server
- 超时、连接池、重试、限流

### 工程能力

- 项目结构设计
- Error 处理规范
- 日志、配置、测试
- Mock、单测、集成测试
- CI/CD

### 数据库与缓存

- Go 连接 MySQL / Redis 的常见实践
- 连接池
- ORM 与 SQL 优化
- 缓存一致性

### 微服务与分布式

- gRPC
- 服务注册发现
- 熔断、限流、重试
- 消息队列
- 分布式事务

## 面试高频专题

- Channel 和 Mutex 怎么选
- Slice 扩容机制
- Map 为什么并发不安全
- GMP 调度原理
- GC 如何影响延迟
- Context 为什么重要
- Go 如何排查内存泄漏和 Goroutine 泄漏

## 适合面试的资料来源

- Go 官方文档：语言规范、Memory Model、Effective Go
- Go Blog：并发、错误处理、性能相关经典文章
- Go 源码：重点看 `runtime`、`sync`、`net/http`
- 极客时间 / 掘金 / 高质量博客：补中文实战讲解
- GitHub 开源项目：看成熟 Go 服务如何组织代码

## 最值得精读的方向

- Go Memory Model
- Effective Go
- Go Concurrency Patterns
- GMP 调度模型
- GC 与逃逸分析
- `pprof` 性能分析

## 推荐整理方式

每个知识点都按 4 列整理：

- 知识点
- 原理
- 高频面试题
- 标准回答要点

这样最后会形成一份更适合背诵和复盘的资料。
