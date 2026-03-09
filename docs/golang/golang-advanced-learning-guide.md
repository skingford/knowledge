# 高级 Golang 学习资料

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [知识地图](#知识地图)
- [学习大纲](#学习大纲)
- [能力自检高频专题](#能力自检高频专题)
- [推荐实践项目](#推荐实践项目)
- [推荐学习顺序](#推荐学习顺序)
- [推荐资料组合](#推荐资料组合)
- [高频问答](#高频问答)
- [系统设计结合 Go](#系统设计结合-go)
- [推荐整理模板](#推荐整理模板)

## 适合人群

- 已能写 Go 项目，想补齐底层、并发、性能和工程能力
- 需要准备 Go 高级开发、后端或能力自检
- 想系统整理 Go 的源码阅读与排障能力

## 学习目标

- 理解 Go 的核心运行机制和常见坑
- 能定位常见并发、性能、内存问题
- 能把 Go 用到可维护、可观测的生产场景

## 知识地图

### 语言与底层

- Slice、Map、Channel 底层原理
- Defer、Panic、Recover
- Interface、反射、泛型
- 内存逃逸、值传递与引用语义

### 并发与性能

- Goroutine 调度模型
- GMP 模型
- Context 使用
- Mutex、RWMutex、Atomic、Sync.Map
- GC 原理、内存分配机制、Pprof

### 工程与服务端

- `net/http`、TCP/UDP、连接池、超时、重试、限流
- 项目结构设计、错误处理规范、日志、配置、测试、CI/CD
- 数据库与缓存、微服务与分布式

## 学习大纲

### 一、语言基础深化

- 变量、常量、`iota`
- 值类型 vs 引用语义
- 数组、Slice、Map
- String 与 `[]byte` 转换
- `defer` / `panic` / `recover`
- 函数闭包
- Interface 底层原理
- 反射 `reflect`
- 泛型 `generics`
- 错误处理设计

### 二、底层原理

- Slice 底层结构与扩容机制
- Map 底层实现原理
- Channel 底层实现
- Interface 的 `itab` 和动态类型
- 内存逃逸分析
- 栈与堆
- GC 垃圾回收机制
- 内存分配器
- Go Memory Model

### 三、并发编程

- Goroutine 基础
- GMP 调度模型
- Channel 使用场景与原理
- `select` 机制
- Context 的取消、超时、传递
- `sync.Mutex` / `sync.RWMutex`
- Atomic 原子操作
- `WaitGroup` / `Once` / `Cond` / `Pool`
- `sync.Map`
- Goroutine 泄漏与排查
- 并发安全常见问题

### 四、网络编程与标准库

- `net/http` 服务端原理
- `http.Client` 使用与坑点
- TCP/UDP 编程基础
- 连接池
- 超时控制
- 重试机制
- 限流
- 中间件设计
- JSON 编解码
- 文件与 IO

### 五、工程实践

- 项目结构设计
- 依赖管理 `go mod`
- 日志规范
- 配置管理
- 错误码设计
- 中间件封装
- 代码规范
- 单元测试
- Mock 测试
- 集成测试
- Benchmark
- CI/CD

### 六、数据库与缓存

- `database/sql` 使用
- MySQL 连接池
- 事务处理
- SQL 优化
- ORM 使用经验
- Redis 在 Go 中的实践
- 缓存穿透、击穿、雪崩
- 缓存一致性
- 分库分表后的处理方式

### 七、性能优化与排障

- Pprof CPU 分析
- Pprof 内存分析
- Trace 跟踪
- Benchmark 性能测试
- GC 调优
- 减少内存分配
- 对象池 `sync.Pool`
- 锁竞争分析
- 接口慢请求排查
- Goroutine 泄漏排查
- 线上问题定位思路

### 八、微服务与分布式

- gRPC 原理与实践
- Protobuf
- 服务注册与发现
- 配置中心
- 链路追踪
- 熔断、限流、降级
- 幂等设计
- 重试策略
- 消息队列
- 分布式事务
- 服务治理
- 高可用设计

### 九、源码与 Runtime

- `runtime` 包核心机制
- Goroutine 调度源码
- Channel 源码
- Map 源码
- `sync` 包源码
- `net/http` 源码
- Context 源码
- GC 相关源码入口

## 能力自检高频专题

- Slice 扩容机制
- Map 为什么并发不安全
- Channel 和 Mutex 怎么选
- Context 的使用原则
- defer 的执行顺序
- panic recover 的正确姿势
- GMP 调度原理
- GC 如何影响延迟
- 逃逸分析是什么
- Go 如何排查内存泄漏和 Goroutine 泄漏
- Go 服务如何做高并发优化

## 推荐实践项目

- 高并发 HTTP 服务：重点练连接池、超时、限流、日志、压测
- 带缓存的数据服务：重点练 Redis、缓存一致性、数据库连接池
- gRPC 微服务：重点练 Context、链路传递、重试、幂等
- 性能排障练习：用 `pprof`、`trace`、Benchmark 定位瓶颈

## 推荐学习顺序

1. 先补语言基础与常见坑
2. 再学 Slice、Map、Channel、Interface 等底层原理
3. 再学并发模型、Context、锁与原子操作
4. 再学 GC、逃逸分析、Pprof、性能优化
5. 再学 `net/http`、数据库、缓存、微服务实践
6. 最后读 `runtime`、`sync`、`net/http` 等源码

## 推荐资料组合

官方资料：

- Go 语言规范
- Effective Go
- Go Memory Model
- Go Blog 的并发与性能相关文章

实践资料：

- 极客时间或高质量中文专栏
- GitHub 上成熟 Go 服务项目
- 面向源码分析的博客和分享

练习方式：

- 每个专题都补一个最小示例
- 对并发、性能、排障题做口述复盘
- 用 Benchmark 和 Pprof 验证“优化”是否真的有效

## 适合能力自检的资料来源

- Go 官方文档：语言规范、Memory Model、Effective Go
- Go Blog：并发、错误处理、性能相关经典文章
- Go 源码：重点看 `runtime`、`sync`、`net/http`
- 极客时间、掘金、高质量博客：补中文实战讲解
- GitHub 开源项目：学习成熟 Go 服务如何组织代码

## 最值得精读的方向

- Go Memory Model
- Effective Go
- Go Concurrency Patterns
- GMP 调度模型
- GC 与逃逸分析
- `pprof` 性能分析

## 高频问答

### Slice 的底层结构是什么？

底层是一个结构体，包含 `pointer`、`len`、`cap`，分别指向底层数组、当前长度和容量。

### Slice 扩容机制是怎样的？

追加元素超过容量时会扩容。通常小容量按倍数扩，大容量按更平滑的比例增长，具体实现和 Go 版本有关。

### Map 为什么并发不安全？

因为 Map 的读写过程可能触发扩容和迁移，并发访问会破坏内部状态，所以原生 Map 不保证并发安全。

### Channel 的底层原理是什么？

Channel 内部维护循环队列、发送等待队列、接收等待队列和锁，用于在 Goroutine 之间安全通信与同步。

### Channel 和 Mutex 怎么选？

共享状态保护优先考虑 Mutex；Goroutine 间传递任务或数据优先考虑 Channel。不要为了“看起来优雅”而滥用 Channel。

### Goroutine 为什么轻量？

初始栈很小、按需扩缩，调度由 Go Runtime 管理，不直接对应系统线程，所以创建和切换成本更低。

### 什么是 GMP 模型？

G 是 Goroutine，M 是系统线程，P 是调度上下文；P 负责把 G 调度到 M 上执行。

### Go 中的抢占式调度是什么？

Runtime 会在适当时机中断长时间运行的 Goroutine，避免其独占 CPU，提高调度公平性。

### Context 有什么用？

Context 用于在请求链路中传递取消信号、超时控制和少量上下文数据，是并发控制、资源回收和服务协作的基础机制。

## 系统设计结合 Go

- 用 Go 设计高并发接口
- 用 Go 设计秒杀系统
- 用 Go 设计订单系统
- Go 在微服务架构中的角色
- 如何做服务拆分
- 如何保证稳定性与可观测性

## 推荐整理模板

每个主题统一成 8 列：

- 知识点
- 原理解析
- 常见坑
- 高频能力自检题
- 标准回答要点
- 示例代码
- 排障手段
- 延伸阅读
