---
title: AI、IM/直播与云原生架构：名词详解与考前速查
description: 汇总专题中的核心术语、考前速查卡片、底层原理对照表与复习顺序，适合冲刺阶段快速回看。
---

# AI、IM/直播与云原生架构：名词详解与考前速查

> 返回总览：[AI、IM/直播与云原生架构](./ai-im-k8s-architecture-interview-guide.md)
>
> 上一篇：[场景题二与三：一致性、热点治理与 Kafka](./ai-im-k8s-architecture-interview-guide-scenarios-consistency-and-kafka.md)
>
> 归档版：[完整长文归档](./ai-im-k8s-architecture-interview-guide-full.md)

## 名词详解

本文涉及大量技术缩写和专业术语，按场景分组整理如下。遇到不熟悉的名词可以随时回来查。

### 通用基础概念

| 术语 | 全称 / 含义 |
|------|------------|
| **IO** | Input/Output，输入输出。程序与外部（磁盘、网络、设备）交换数据的操作。网络 IO 指通过网络收发数据，磁盘 IO 指读写文件。IO 密集型任务的瓶颈在等待外部响应，CPU 密集型任务的瓶颈在计算本身 |
| **syscall** | System Call，系统调用。用户程序请求操作系统内核执行特权操作（如读写文件、创建进程、网络通信）的接口。执行时从用户态切换到内核态，有一定开销 |
| **P50 / P95 / P99** | 延迟分位数。P99 表示 99% 的请求在该时间内完成，只有 1% 的请求比它慢。P50 是中位数。"P99 < 200ms"意味着绝大多数请求能在 200ms 内响应 |
| **QPS** | Queries Per Second，每秒查询数。衡量系统吞吐能力的核心指标 |
| **API** | Application Programming Interface，应用编程接口。系统之间约定的调用规范 |
| **RPC** | Remote Procedure Call，远程过程调用。像调用本地函数一样调用远程服务的协议，常见实现有 gRPC、Thrift |
| **SSE** | Server-Sent Events，服务器发送事件。基于 HTTP 的单向服务端推送协议，客户端通过 `EventSource` 接收流式数据。AI 对话场景中用于流式输出 token |
| **DAG** | Directed Acyclic Graph，有向无环图。用节点和有向边描述任务依赖关系，常用于编排多步骤工作流 |
| **RPO** | Recovery Point Objective，恢复点目标。故障后最多允许丢失多久的数据。RPO = 0 表示不允许丢任何数据 |
| **RTO** | Recovery Time Objective，恢复时间目标。从故障发生到系统恢复可用所需的最长时间 |
| **状态机** | Finite State Machine。用有限个状态和转换规则描述系统行为。例如订单：待支付 → 已支付 → 已发货 → 已完成。保证每次状态流转都是合法的 |
| **幂等** | 同一操作执行一次和执行多次效果完全相同。网络重试不可避免，幂等保证重复请求不会产生副作用（如重复扣费） |

### Go 运行时与并发

| 术语 | 全称 / 含义 |
|------|------------|
| **GMP 模型** | Go 调度器的三个核心角色：**G**（goroutine，轻量线程）、**M**（Machine，OS 线程）、**P**（Processor，逻辑处理器，持有本地运行队列）。P 数量默认 = CPU 核数 |
| **goroutine** | Go 的轻量级协程，初始栈仅 2-8 KB（OS 线程 1-8 MB）。数十万 goroutine 共享少量 OS 线程，切换成本纳秒级 |
| **netpoller** | Go 运行时内置的网络轮询器，底层封装 epoll/kqueue。goroutine 做网络 IO 时被挂起并释放 P，不阻塞 OS 线程 |
| **epoll / kqueue** | OS 级 IO 多路复用。一个线程监听成千上万个连接，有事件时才唤醒处理。epoll 是 Linux 的，kqueue 是 macOS 的 |
| **work stealing** | 工作窃取。P 的本地队列空了时，从其他 P 偷一半 G 来执行，避免负载不均 |
| **GOMAXPROCS** | 控制 P 的数量，即最大并行度，默认 = CPU 核数 |
| **GC** | Garbage Collection，垃圾回收。Go 的 GC 是并发三色标记清除，自动回收不再使用的堆内存 |
| **STW** | Stop The World。GC 在标记开始和结束时短暂暂停所有 goroutine，现代 Go 通常 < 1ms |
| **三色标记** | GC 标记算法。白 = 未访问（可能是垃圾），灰 = 已发现未完全扫描，黑 = 已完全扫描。标记结束后白色被回收 |
| **写屏障** | Write Barrier。并发标记期间，应用修改指针引用时将目标标灰，防止活跃对象被误回收 |
| **逃逸分析** | Escape Analysis。编译期分析变量是否超出函数栈帧的生命周期。逃逸到堆 → 需要 GC → 增加 GC 压力 |
| **GOGC** | 控制 GC 触发频率，默认 100（堆增长 100% 时触发）。调大 = 少 GC 多内存 |
| **GOMEMLIMIT** | Go 1.19+ 的软内存上界，防 OOM 同时让 GC 更智能地触发 |
| **pprof** | Go 内置性能分析工具，可分析 CPU 热点、堆内存分配、goroutine 数量、阻塞情况 |
| **火焰图** | Flame Graph。性能可视化，横轴 = 调用栈占用时间比例，纵轴 = 调用深度。快速定位热点 |
| **hchan** | Go channel 的内部结构体。包含环形缓冲区、互斥锁、发送等待队列 sendq、接收等待队列 recvq |
| **context** | Go 标准库的请求上下文。核心能力是取消树：父 cancel 递归取消所有子 context，实现超时/断连级联传播 |
| **sync.Pool** | 临时对象池，复用频繁创建销毁的对象，减少堆分配和 GC 压力 |
| **饥饿模式** | Mutex 的一种状态。等锁超 1ms 切换，锁直接给队首等待者，避免长尾延迟 |
| **atomic** | 原子操作，CPU 级保证读写不可分割，无需加锁。适合计数器、标志位 |
| **分片锁** | 将一把大锁拆为多个小锁，每个分片独立加锁，降低竞争 |

### MySQL 与存储

| 术语 | 全称 / 含义 |
|------|------------|
| **B+ Tree** | 多路平衡搜索树。非叶节点只存 key（fan-out 大），叶子存数据并用双向链表串联（支持范围查询）。3-4 层可索引数千万行 |
| **聚簇索引** | Clustered Index。InnoDB 主键索引，叶子节点存完整行数据，数据按主键顺序物理存储 |
| **回表** | 通过二级索引查到主键后，再到聚簇索引查完整行数据的过程 |
| **覆盖索引** | Covering Index。查询字段全在索引中，无需回表。最重要的查询优化手段 |
| **MVCC** | Multi-Version Concurrency Control，多版本并发控制。保存数据历史版本，读不阻塞写 |
| **ReadView** | MVCC 的可见性快照，记录活跃事务列表。RR 级别整个事务复用同一个 ReadView |
| **undo log** | 回滚日志，记录修改前旧值，用于事务回滚和 MVCC 多版本读取 |
| **RC / RR** | Read Committed / Repeatable Read，MySQL 两种常用事务隔离级别。RR 是 InnoDB 默认 |
| **间隙锁** | Gap Lock。InnoDB 在 RR 下对索引记录间的"间隙"加锁，防止幻读，也是死锁常见原因 |
| **binlog** | Binary Log，记录所有数据修改，用于主从复制和数据恢复 |
| **深分页** | `LIMIT 1000000, 10` 扫描前 100 万行再丢弃，性能极差 |
| **游标翻页** | `WHERE id > last_seen_id LIMIT 10`，利用主键索引跳过已读数据 |
| **乐观锁** | 不加锁，更新时用 version 字段检测冲突 |
| **悲观锁** | `SELECT ... FOR UPDATE` 显式加行锁 |

### Redis 与缓存

| 术语 | 全称 / 含义 |
|------|------------|
| **穿透** | 查不存在的数据，每次穿透缓存打到 DB。治理：布隆过滤器 + 缓存空值 |
| **击穿** | 热点 key 过期瞬间大量请求打到 DB。治理：singleflight + 互斥锁重建 |
| **雪崩** | 大量 key 同时过期或集群故障。治理：TTL 随机抖动 + 多级缓存 + 限流 |
| **singleflight** | Go 的并发请求合并模式，同 key 并发请求只执行一次实际调用，其余共享结果 |
| **布隆过滤器** | Bloom Filter。概率型结构，能判断"一定不存在"，可能误报"存在" |
| **多级缓存** | L1（进程本地）→ L2（Redis）→ L3（数据库），读请求逐级穿透 |
| **RDB / AOF** | Redis 持久化。RDB = 定时全量快照（恢复快），AOF = 追加写命令日志（更安全） |
| **COW** | Copy-On-Write。RDB fork 子进程时父子共享内存，只有修改的页才复制 |
| **slot** | Redis Cluster 的 16384 个槽，`CRC16(key) % 16384` 路由 |
| **Redlock** | Redis 分布式锁算法，存在时钟假设争议 |
| **热点 key** | 极高频访问的 key，可能打满单节点 CPU。治理：本地缓存 + key 分片 |
| **LRU** | Least Recently Used，最近最少使用，缓存淘汰策略 |

### Kafka 与消息队列

| 术语 | 全称 / 含义 |
|------|------------|
| **Topic** | Kafka 消息主题，逻辑上的消息分类 |
| **Partition** | Topic 的物理分片，分区内有序，分区间无序。是 Kafka 并行度的单位 |
| **Consumer Group** | 消费者组，组内每个消费者负责不同 Partition，实现并行消费 |
| **ISR** | In-Sync Replicas，同步副本集。`min.insync.replicas` 设定最少同步副本数 |
| **offset** | 消息在 Partition 内的位置偏移量，Consumer 提交 offset 记录消费进度 |
| **lag** | 消费延迟 = 最新 offset - 已消费 offset。持续增大说明在积压 |
| **acks** | Producer 确认等级。0=不等，1=Leader 写入确认，all=所有 ISR 写入确认 |
| **顺序写** | Sequential Write。消息追加写入，不修改旧数据，对磁盘极友好 |
| **Page Cache** | OS 页缓存。Kafka 写入先进内存，异步刷盘。读热数据直接从缓存命中 |
| **零拷贝** | 用 `sendfile` 数据直接从页缓存到网卡，跳过用户态拷贝，降低 CPU 开销 |
| **rebalance** | Partition 重新分配。消费者上下线时触发，期间消费暂停 |
| **积压** | lag 持续增大，本质是生产速率 > 消费速率 |
| **死信队列** | DLQ，消费多次失败的消息被隔离，避免阻塞正常消费 |

### AI 工程化

| 术语 | 全称 / 含义 |
|------|------------|
| **LLM** | Large Language Model，大语言模型 |
| **token** | LLM 处理的最小单位。一个中文字 ≈ 1-2 token，一个英文单词 ≈ 1 token |
| **embedding** | 向量化表示，将文本转为高维向量，距离反映语义相似度 |
| **RAG** | Retrieval-Augmented Generation，先检索再生成，减少幻觉 |
| **Agent** | 智能体，能理解意图、制定计划、循环调用工具、根据反馈调整 |
| **ReAct** | Reasoning + Acting，推理 → 行动 → 观察 → 再推理的循环模式 |
| **prompt** | 提示词，发给 LLM 的输入文本 |
| **幻觉** | Hallucination，LLM 生成看似合理但不正确的内容 |
| **向量库** | 存储 embedding 的专用数据库（Milvus、Pinecone、pgvector 等） |
| **chunk** | 文档分块，切分为适合 embedding 的小段落 |
| **reranker** | 重排序模型，对检索结果精排提升相关性 |

### IM / 直播架构

| 术语 | 全称 / 含义 |
|------|------------|
| **长连接** | 持续保持的 TCP 连接（如 WebSocket），支持双向随时通信 |
| **写扩散** | Fanout-on-Write，发送时为每个接收者写一份副本。读快写慢，适合小群 |
| **读扩散** | Fanout-on-Read，消息只写一份，读取时拉取。写快读慢，适合大群 |
| **fan-out** | 扇出，一对多消息分发 |
| **背压** | Backpressure，下游处理不过来时向上游反馈"慢下来" |
| **限流** | Rate Limiting，控制请求速率。常见算法：令牌桶、滑动窗口 |
| **熔断** | Circuit Breaker，故障率超阈值自动切断请求。Closed → Open → Half-Open |
| **降级** | 压力过大时关闭非核心功能，保证核心链路 |
| **舱壁隔离** | Bulkhead Pattern，按下游依赖拆独立资源池，故障互不影响 |

### Kubernetes 与云原生

| 术语 | 全称 / 含义 |
|------|------------|
| **Pod** | K8s 最小调度单位，包含一个或多个共享网络/存储的容器 |
| **requests** | 资源保底量，调度器据此决定 Pod 放哪个节点 |
| **limits** | 资源硬上界。CPU 超限被 throttle，内存超限被 OOMKill |
| **HPA** | Horizontal Pod Autoscaler，按指标自动调整 Pod 副本数 |
| **VPA** | Vertical Pod Autoscaler，自动调整单 Pod 的 requests/limits |
| **KEDA** | Event-Driven Autoscaling，支持 Kafka lag 等自定义指标触发 HPA |
| **throttle** | CPU 限流，超 limit 时被 CFS 带宽控制降速，延迟升高 |
| **OOMKilled** | 内存超 limit 被内核杀掉。查看：`kubectl describe pod` |
| **探针** | **startupProbe**（启动）、**readinessProbe**（就绪，决定是否接流量）、**livenessProbe**（存活，失败重启） |
| **SIGTERM / SIGKILL** | 优雅关闭信号 / 强杀信号。K8s 先 SIGTERM，超时后 SIGKILL |
| **preStop** | 终止前钩子，用于注销服务发现、排空连接 |
| **taint / toleration** | 节点污点 / Pod 容忍，用于专用节点池隔离（如 GPU 节点） |
| **NAT 网关** | 将 Pod 出口流量转为固定 IP，解决第三方白名单问题 |
| **Ingress** | 七层流量入口，支持域名/路径路由、TLS 终止 |

### 分布式与微服务

| 术语 | 全称 / 含义 |
|------|------------|
| **TCC** | Try-Confirm-Cancel。Try 预留资源 → Confirm 确认 → Cancel 回滚 |
| **Saga** | 长事务拆为本地事务序列，失败时反向补偿 |
| **Outbox** | 本地消息表，在事务内同时写业务数据和 outbox 消息，异步投递 MQ |
| **最终一致性** | 不保证实时一致，保证最终收敛。通过重试、补偿、对账实现 |
| **对账** | 定时比对多系统数据，发现不一致自动生成补偿工单 |
| **服务发现** | 服务实例动态注册和发现。K8s 通过 Service + DNS 提供 |
| **链路追踪** | TraceID + SpanID 串联请求经过的所有服务。标准：OpenTelemetry |
| **灰度发布** | Canary Release，小比例流量验证新版本，异常立即回滚 |
| **防腐层** | Anti-Corruption Layer，在不同系统间加适配和校验，防止异常传播 |

## 考前速查卡片

考前 30 分钟快速过一遍，每张卡片只保留核心结论和关键数字。

### Go 速查

| 考点 | 一句话答案 |
|------|-----------|
| GMP 模型 | G=goroutine（几KB），M=OS线程，P=逻辑处理器（默认=CPU核数）。P 持有本地队列，work stealing 负载均衡 |
| 网络 IO 不阻塞线程 | netpoller（epoll）挂起 G 释放 P，活跃线程数始终 = GOMAXPROCS |
| syscall 阻塞 | 运行时把 P 摘给空闲 M，阻塞 M 独立等待。大量文件 IO 会创建新线程 |
| 抢占 | Go 1.14+ 基于信号的异步抢占，CPU 密集 G 也能被打断 |
| GC | 并发三色标记清除，STW < 1ms。混合写屏障防漏标 |
| 逃逸分析 | 返回指针、闭包引用、interface{}、发 channel → 逃逸到堆 → 增加 GC 压力 |
| GOGC | 默认 100，堆翻倍触发 GC。调大 = 少 GC 多内存，配合 GOMEMLIMIT 防 OOM |
| channel | 带锁环形缓冲 + sendq/recvq 等待队列。语义清晰但非无锁 |
| context | 取消树，父 cancel 递归取消所有子节点。请求入口必须创建根 context |
| Mutex 饥饿 | 等锁 > 1ms 切饥饿模式，锁直接给队首。热点数据优先用分片锁/atomic |

### MySQL 速查

| 考点 | 一句话答案 |
|------|-----------|
| B+ Tree | 多路平衡树，树高 3-4 层 = 3-4 次 IO。叶子双向链表支持范围查询 |
| 聚簇索引 | InnoDB 主键索引 = 聚簇索引，叶子存完整行。二级索引叶子存主键，查数据需回表 |
| 覆盖索引 | 查询字段全在索引里，不需回表，最重要的优化手段 |
| MVCC | 每行 trx_id + roll_pointer 指向 undo log。RR 级别整个事务复用同一个 ReadView |
| 深分页 | `LIMIT 1000000,10` 扫前 100 万行。优化：游标翻页 / 延迟关联 / 禁跳页 |
| 高并发扣费 | `UPDATE SET balance=balance-? WHERE balance>=?` 原子操作，不做 read-modify-write |
| 分布式事务 | 单库本地事务 > TCC > Outbox+MQ。资金用状态机+幂等+对账兜底 |

### Redis 速查

| 考点 | 一句话答案 |
|------|-----------|
| 穿透 | 查不存在的数据穿透到 DB。治理：布隆过滤器 + 缓存空值 |
| 击穿 | 热点 key 过期瞬间大量请求打到 DB。治理：singleflight + 互斥锁重建 + 永不过期 |
| 雪崩 | 大量 key 同时过期 / 集群故障。治理：TTL 加随机抖动 + 多级缓存 + 限流降级 |
| RDB vs AOF | RDB 恢复快但可能丢数据；AOF 更安全但恢复慢。生产用混合持久化 |
| Cluster | 16384 槽，CRC16(key)%16384 定位。MOVED 重定向，slot 迁移时 ASK 重定向 |
| Redlock 争议 | 依赖时钟假设，GC pause 可能导致双持锁。资金场景用数据库约束兜底 |
| 热点 key | 多级缓存（本地 L1 + Redis L2）+ 热点探测 + key 分片 + 动态降级 |

### Kafka 速查

| 考点 | 一句话答案 |
|------|-----------|
| 为什么快 | 顺序写 + Page Cache + 零拷贝 + 批量 + Pull 模型 + Partition 并行 |
| 不丢消息 | Producer: acks=all+幂等；Broker: 副本≥3, min.insync.replicas=2；Consumer: 处理成功再提交 offset |
| 顺序性 | 只在单 Partition 内保证。业务级顺序：同 key → 同 Partition → 同 Worker 串行处理 |
| 积压排查 | Producer 放量 → Broker 资源 → 分区倾斜 → Rebalance → 单条耗时 → 下游依赖 |
| 消费提速 | 拉处分离：fetch 线程快速拉取，worker pool 异步处理。扩分区+扩消费者 |

### AI 工程化速查

| 考点 | 一句话答案 |
|------|-----------|
| 流式输出 | SSE，首 token 延迟几百 ms 就开始返回。客户端断连通过 ctx 级联取消 |
| 多模型调度 | 按模型/租户/接口限流。失败快速 fallback，不无限重试 |
| RAG vs Agent | RAG = 检索+生成（单次管道）；Agent = 规划+执行+反馈（多步循环）|
| 防腐层 | LLM 到核心系统之间：参数校验 + 权限校验 + 幂等 + 拒绝越权调用 |

### IM/直播速查

| 考点 | 一句话答案 |
|------|-----------|
| 长连接架构 | 接入层（网关）→ 路由层 → 业务层 → 存储层。网关无状态，不做业务逻辑 |
| 单机连接数 | Go 单机 10 万连接，内存 2-4 GB。瓶颈在内存和 fd，不在 CPU |
| 写扩散 vs 读扩散 | 私聊小群用写扩散（读快写多）；大群直播用读扩散（写少读聚合） |
| 限流降级 | 入口/房间/用户/下游多层限流。熔断防慢依赖拖死线程池 |

### K8s 速查

| 考点 | 一句话答案 |
|------|-----------|
| Pod 生命周期 | Pending → Running（startup → readiness → liveness）→ Terminating（SIGTERM → preStop → SIGKILL）|
| requests vs limits | requests=调度保底，limits=硬上界。CPU 超 limit 被 throttle，内存超 limit 被 OOMKill |
| HPA | AI 服务不只看 CPU，看并发数/队列长度/P95。KEDA 支持自定义指标 |
| 固定出口 IP | NAT 网关统一出口，不是固定 Pod IP。Istio Egress Gateway 做细粒度控制 |
| CI/CD | 提交 → 测试+构建+扫描 → 版本化镜像 → Helm/GitOps 发布 → 探针+灰度+回滚 |

## 最后收束

如果前面内容已经很多，最后可以把整页压回三条主线：

- 数据面：数据库、缓存、一致性和热点治理
- 异步面：消息系统里的不丢、不乱、不堵
- 平台面：K8s 从会用到会稳、会排障、会讲机制

### 1. 数据与缓存收束

图例参考：数据库和缓存题，最后几乎都会落回“连接模型、缓存异常、一致性与分片复杂度”这条主线。把这张图记住，很多零散问题都能重新挂回去。

<GoDataCacheDiagram kind="overview" />

### 2. 消息与异步收束

图例参考：Kafka 真正的答题主线，不是参数清单，而是“不丢、不乱、不堵”。把这三个目标和对应手段压成一张图，追问时不容易散。

<KafkaDiagram kind="topic-goals-map" />

### 3. 云原生与交付收束

图例参考：K8s 题如果只停在 Deployment 和 Service，深度不够。把“会用对象 -> 会做治理 -> 会定位问题 -> 会讲机制”这条阶梯记住，答题会更有层次。

<K8sDiagram kind="depth-map" />

## 面试题 → 底层原理对照表

用这张表反向学习：从面试题出发，追溯到底层原理，建立知识连接。

| 面试题 | 考察的底层原理 | 核心答案（一句话） | 深入方向 |
|--------|---------------|-------------------|----------|
| Go 大量并发调用外部 API，线程会不会打满？ | GMP 调度 + netpoller | 不会，网络 IO 走 netpoller 挂起 G 释放 P，活跃线程 = GOMAXPROCS | syscall 阻塞才会创建新线程 |
| Go GC 暂停太长怎么优化？ | 三色标记 + 逃逸分析 | 减少堆分配（sync.Pool/减逃逸）+ 调 GOGC/GOMEMLIMIT | pprof heap profile 找分配热点 |
| channel 是高性能的吗？ | hchan 结构 | 不是无锁的，底层有互斥锁 + 等待队列。优势在语义清晰 | 高并发热点用 atomic / 分片锁 |
| MySQL 为什么用 B+ Tree？ | 磁盘 IO 模型 | 多路平衡树 fan-out 大，3 层可存千万行，范围查询靠叶子链表 | 和 B Tree / Hash / LSM Tree 对比 |
| MVCC 怎么实现可重复读？ | ReadView + undo log | 事务首次 SELECT 时生成 ReadView，后续读取复用，只看见已提交的旧版本 | RC 每次 SELECT 生成新 ReadView |
| 高并发扣费怎么防超扣？ | 数据库原子操作 | 条件更新 `balance >= amount`，不做应用层 read-modify-write | 乐观锁 version / 悲观锁 for update |
| Redis 热点 key 怎么办？ | 缓存分层 + 负载分散 | L1 本地缓存扛读 + L2 Redis 做协调 + key 分片分散压力 | 热点探测 + 动态降级 |
| Redlock 安全吗？ | 分布式系统时钟假设 | 不完全安全，GC pause / 时钟跳变可能双持锁。资金场景用 DB 约束 | Kleppmann vs Antirez 论战 |
| Kafka 为什么快？ | 存储与网络模型 | 顺序写 + Page Cache + 零拷贝 + 批量 + Partition 并行 | 快不等于每条都持久化，可靠性另外保证 |
| Kafka 怎么保证顺序？ | Partition 局部有序 | 同 key → 同 Partition → 消费端同 key 同 Worker 串行 | 全局有序需单 Partition，牺牲吞吐 |
| Kafka 积压怎么处理？ | 生产消费速率平衡 | 先止血限流 → 按链路定位瓶颈 → 拉处分离提速 | 积压本质是容量问题不是 MQ 问题 |
| SSE 流式输出怎么设计？ | HTTP 长连接 + 事件流 | text/event-stream + 分类事件（token/tool/error/done）+ ctx 取消 | 断连恢复用 Last-Event-ID |
| K8s Pod 被 OOMKill 怎么排查？ | cgroups 内存限制 | memory limit 设太低，或应用内存泄漏。requests ≈ limits 防 OOM | 看 dmesg / kubectl describe |
| K8s 怎么做固定出口 IP？ | VPC 网络与 NAT | NAT 网关统一出口，不是固定 Pod IP。和白名单是同一问题 | Istio Egress Gateway 做细粒度 |
| 微服务怎么做灰度？ | 流量路由 + 指标对比 | Istio VirtualService / Ingress canary annotation 按比例分流 | 关键是灰度指标自动对比和自动回滚 |
| 分布式事务选什么方案？ | CAP / BASE | 单库本地事务 > TCC > Outbox+MQ。按业务等级选，不是统一方案 | 资金用状态机+幂等+对账兜底 |

## 推荐复习顺序

如果你要在较短时间内准备这类岗位，建议按这个顺序：

1. 先补 Go 调度、GC、并发控制，把 runtime 层面讲顺
2. 再补 MySQL、Redis、Kafka，把一致性、缓存、消息治理讲顺
3. 再把 AI 工程化、IM/直播和 K8s 这几个场景题串起来
4. 最后准备 1 到 2 个项目故事，把方案、事故、指标和复盘讲顺

## 关联阅读

- Go 能力自检导航：[../golang/interview-prep.md](../golang/interview-prep.md)
- Go 调度器与并发主线：[../golang/guide/03-goroutine-and-scheduler.md](../golang/guide/03-goroutine-and-scheduler.md)
- Go GC 与内存模型：[../golang/guide/02-gc-allocator-and-memory-model.md](../golang/guide/02-gc-allocator-and-memory-model.md)
- Go 逃逸分析：[../golang/guide/02-escape-analysis.md](../golang/guide/02-escape-analysis.md)
- Go 高并发系统设计：[../golang/guide/08-go-high-concurrency-system-design.md](../golang/guide/08-go-high-concurrency-system-design.md)
- Redis 与缓存模式：[../redis/redis-and-cache-patterns.md](../redis/redis-and-cache-patterns.md)
- Redis 高并发、集群与锁：[../redis/high-concurrency-cluster-locks.md](../redis/high-concurrency-cluster-locks.md)
- MySQL 高频问题整理：[../mysql/high-frequency-questions.md](../mysql/high-frequency-questions.md)
- 分布式事务方案对比：[./distributed-transaction-comparison.md](./distributed-transaction-comparison.md)
- 高并发系统设计清单：[./high-concurrency-system-checklist.md](./high-concurrency-system-checklist.md)
- Tool Calling 设计清单：[../ai/tool-calling-design-checklist.md](../ai/tool-calling-design-checklist.md)
- Agent 学习综合指南：[../ai/agent-learning-guide.md](../ai/agent-learning-guide.md)
- K8s 自动扩缩容与容量控制：[../k8s/autoscaling-and-capacity-control-chain.md](../k8s/autoscaling-and-capacity-control-chain.md)
- K8s 固定入口、固定出口与白名单：[../k8s/fixed-ip-and-whitelist.md](../k8s/fixed-ip-and-whitelist.md)
