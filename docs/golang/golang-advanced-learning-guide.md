# 高级 Golang 学习资料

## 快速导航

- [适合人群](#适合人群)
- [学习目标](#学习目标)
- [知识地图](#知识地图)
- [学习大纲](#学习大纲)
- [推荐实践项目](#推荐实践项目)
- [推荐学习顺序与资料](#推荐学习顺序与资料)
- [高频题目与原理复习](#高频题目与原理复习)
- [系统设计结合 Go](#系统设计结合-go)

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

### 一、语言基础深化 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [语言基础深化详解](./guide/01-language-fundamentals.md)

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

### 二、底层原理 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [底层原理详解](./guide/02-underlying-principles.md)

- Slice 底层结构与扩容机制
- Map 底层实现原理
- Channel 底层实现
- Interface 的 `itab` 和动态类型
- 内存逃逸分析
- 栈与堆
- GC 垃圾回收机制
- 内存分配器
- Go Memory Model

### 三、并发编程 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [并发编程详解](./guide/03-concurrency.md)

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

### 四、网络编程与标准库 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [网络编程与标准库详解](./guide/04-network-stdlib.md)

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

### 五、工程实践 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [工程实践详解](./guide/05-engineering-practices.md)

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

### 六、数据库与缓存 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [数据库与缓存详解](./guide/06-database-cache.md)

- `database/sql` 使用
- MySQL 连接池
- 事务处理
- SQL 优化
- ORM 使用经验
- Redis 在 Go 中的实践
- 缓存穿透、击穿、雪崩
- 缓存一致性
- 分库分表后的处理方式

### 七、性能优化与排障 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [性能优化与排障详解](./guide/07-performance-troubleshooting.md)

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

### 八、微服务与分布式 <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [微服务与分布式详解](./guide/08-microservices-distributed.md)

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

### 九、源码与 Runtime <Badge type="tip" text="详解" />

> 详细答案与代码示例见 [源码与 Runtime 详解](./guide/09-runtime-source.md)

- `runtime` 包核心机制
- Goroutine 调度源码
- Channel 源码
- Map 源码
- `sync` 包源码
- `net/http` 源码
- Context 源码
- GC 相关源码入口

## 推荐实践项目

- 高并发 HTTP 服务：重点练连接池、超时、限流、日志、压测
- 带缓存的数据服务：重点练 Redis、缓存一致性、数据库连接池
- gRPC 微服务：重点练 Context、链路传递、重试、幂等
- 性能排障练习：用 `pprof`、`trace`、Benchmark 定位瓶颈

## 推荐学习顺序与资料

> 详细书单、博客、视频资源见 [Go 推荐书单、博客与视频资料](./golang-recommended-resources.md)

1. 先补语言基础与常见坑
2. 再学 Slice、Map、Channel、Interface 等底层原理
3. 再学并发模型、Context、锁与原子操作
4. 再学 GC、逃逸分析、Pprof、性能优化
5. 再学 `net/http`、数据库、缓存、微服务实践
6. 最后读 `runtime`、`sync`、`net/http` 等源码

## 高频题目与原理复习

> 高频能力自检题目、标准回答与源码原理线索见 [30+ 高频 Golang 能力自检题](./go-top-30-interview-questions.md)

## 系统设计结合 Go

- 用 Go 设计高并发接口
- 用 Go 设计秒杀系统
- 用 Go 设计订单系统
- Go 在微服务架构中的角色
- 如何做服务拆分
- 如何保证稳定性与可观测性
