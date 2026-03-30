---
title: Go 百万长连接网关架构设计
description: 基于 Go 设计支持百万级 WebSocket 与 MQTT 长连接的高可用网关系统，覆盖架构分层、核心组件命名解析、目录结构、技术选型、分阶段实施与性能调优。
vocabulary:
  - websocket
  - mqtt
  - broker
  - gateway
  - epoll
  - codec
  - heartbeat
  - session
  - consistent-hashing
  - goroutine
  - concurrency
---

# Go 百万长连接网关架构设计

## 适合人群

- 需要设计 IM、直播、IoT 等长连接系统的后端工程师
- 准备系统设计面试，需要拆解百万连接核心问题的候选人
- 想了解 Go 在高并发网络编程中的工程实践

## 学习目标

- 理解百万长连接系统的核心挑战：内存、文件描述符、消息路由
- 掌握分层架构中每一层的职责与命名含义
- 能解释 Bucket / Channel / Connector / Broker / Router 等核心抽象的设计意图
- 了解 epoll 模型替代 goroutine-per-conn 的必要性和实现思路
- 能输出一份可落地的百万连接系统技术方案

## 快速导航

- [系统架构总览](#系统架构总览)
- [核心术语与命名解析](#核心术语与命名解析)
- [架构分层详解](#架构分层详解)
- [Go 项目目录结构](#go-项目目录结构)
- [关键技术选型](#关键技术选型)
- [核心数据结构](#核心数据结构)
- [连接生命周期](#连接生命周期)
- [WebSocket 专项设计](#websocket-专项设计)
- [MQTT 专项设计](#mqtt-专项设计)
- [水平扩展策略](#水平扩展策略)
- [性能优化策略](#性能优化策略)
- [容量规划](#容量规划)
- [分阶段实施计划](#分阶段实施计划)
- [风险评估](#风险评估)
- [参考项目](#参考项目)

---

## 系统架构总览

下面是整个系统的拓扑结构图，展示了从客户端到存储层的完整数据通路。

```
                            ┌─────────────────────────────────────┐
                            │          Load Balancer (LB)          │
                            │      Nginx / HAProxy, L4 TCP 转发    │
                            └──────────┬──────────┬───────────────┘
                                       │          │
                         ┌─────────────┘          └─────────────┐
                         ▼                                      ▼
              ┌─────────────────────┐                ┌─────────────────────┐
              │   Gateway Node #1   │                │   Gateway Node #N   │
              │  ┌───────────────┐  │                │  ┌───────────────┐  │
              │  │Protocol Adapter│  │                │  │Protocol Adapter│  │
              │  │ ┌─────┬─────┐ │  │                │  │ ┌─────┬─────┐ │  │
              │  │ │ WS  │MQTT │ │  │                │  │ │ WS  │MQTT │ │  │
              │  │ │Codec│Codec│ │  │                │  │ │Codec│Codec│ │  │
              │  │ └─────┴─────┘ │  │                │  │ └─────┴─────┘ │  │
              │  └───────────────┘  │                │  └───────────────┘  │
              │  ┌───────────────┐  │                │  ┌───────────────┐  │
              │  │  Connector     │  │                │  │  Connector     │  │
              │  │ ┌────────────┐│  │                │  │ ┌────────────┐│  │
              │  │ │ Bucket [0] ││  │                │  │ │ Bucket [0] ││  │
              │  │ │ Channel[]  ││  │                │  │ │ Channel[]  ││  │
              │  │ ├────────────┤│  │                │  │ ├────────────┤│  │
              │  │ │ Bucket [1] ││  │                │  │ │ Bucket [1] ││  │
              │  │ │ Channel[]  ││  │                │  │ │ Channel[]  ││  │
              │  │ ├────────────┤│  │                │  │ ├────────────┤│  │
              │  │ │ Bucket [N] ││  │                │  │ │ Bucket [N] ││  │
              │  │ │ Channel[]  ││  │                │  │ │ Channel[]  ││  │
              │  │ └────────────┘│  │                │  │ └────────────┘│  │
              │  └───────────────┘  │                │  └───────────────┘  │
              │  ┌───────────────┐  │                │  ┌───────────────┐  │
              │  │Heartbeat Mgr  │  │                │  │Heartbeat Mgr  │  │
              │  └───────────────┘  │                │  └───────────────┘  │
              └────────┬────────────┘                └────────┬────────────┘
                       │                                      │
                       ▼                                      ▼
              ┌──────────────────────────────────────────────────────────┐
              │                Internal Message Broker                   │
              │            (NATS / Redis Pub-Sub / Kafka)                │
              │  ┌────────────┐  ┌──────────┐  ┌───────────────────┐   │
              │  │  Router     │  │Dispatcher│  │ Room/Topic Manager│   │
              │  │(uid→node)   │  │          │  │                   │   │
              │  └────────────┘  └──────────┘  └───────────────────┘   │
              └──────────────────────────────────────────────────────────┘
                       │              │                    │
            ┌──────────┘    ┌─────────┘          ┌─────────┘
            ▼               ▼                    ▼
     ┌────────────┐  ┌────────────┐     ┌──────────────┐
     │  Registry   │  │  Storage   │     │  Monitoring   │
     │(etcd/Consul)│  │            │     │               │
     │             │  │┌──────────┐│     │ ┌───────────┐ │
     │ · 节点注册   │  ││ Redis    ││     │ │Prometheus │ │
     │ · 服务发现   │  ││ (Session)││     │ │ + Grafana │ │
     │ · 健康检查   │  │├──────────┤│     │ ├───────────┤ │
     │             │  ││ MySQL/PG ││     │ │  Jaeger   │ │
     │             │  ││ (离线消息) ││     │ │ (Tracing) │ │
     │             │  │├──────────┤│     │ ├───────────┤ │
     │             │  ││ Kafka    ││     │ │  Alerting │ │
     │             │  ││ (消息持久) ││     │ │           │ │
     │             │  │└──────────┘│     │ └───────────┘ │
     └────────────┘  └────────────┘     └──────────────┘
```

### 数据流说明

1. 客户端通过 **LB** 接入，LB 做 L4 转发（不解析应用协议，保持长连接透传）
2. **Gateway Node** 完成协议握手（WebSocket Upgrade / MQTT CONNECT），建立长连接
3. **Connector** 将连接按 hash 分配到不同 **Bucket**，每个连接封装为一个 **Channel**
4. 消息通过 **Internal Broker** 在节点间路由，**Router** 负责查找目标用户所在节点
5. **Dispatcher** 将消息投递到目标 Connector 节点的对应 Channel

---

## 核心术语与命名解析

下表解释系统中每一个关键抽象的名称来源和设计意图。

### 接入层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Load Balancer (LB)** | 负载均衡器 | 流量入口，通常使用 L4（传输层）转发，不终结长连接。选择 L4 而非 L7 是因为长连接不需要 HTTP 层的路由能力，L4 吞吐更高、延迟更低。 |
| **Gateway** | 网关 | 每个 Gateway 是一个独立进程，负责监听端口、接受 TCP 连接、完成协议握手。命名来源于网络设备中"入口关卡"的概念——所有客户端连接必须经过网关进入系统。 |
| **Protocol Adapter** | 协议适配器 | 抽象层，屏蔽 WebSocket 和 MQTT 的协议差异，向上游提供统一的 `ReadMessage()` / `WriteMessage()` 接口。命名遵循 GoF 适配器模式（Adapter Pattern）。 |

### 协议层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Codec** | 编解码器 | Coder + Decoder 的缩写。WebSocket Codec 负责帧解析（Frame Parsing），MQTT Codec 负责报文解析（Packet Parsing）。每种协议有自己的 Codec 实现。 |
| **Frame** | 帧 | WebSocket 协议的最小传输单元。一个消息可能由多个帧组成（分片传输），Codec 负责将帧组装为完整消息。 |
| **Packet** | 报文 / 数据包 | MQTT 协议的传输单元。包括 CONNECT、PUBLISH、SUBSCRIBE、PINGREQ 等 14 种报文类型。 |
| **Topic Tree** | 主题树 | MQTT 特有的数据结构，支持通配符匹配（`+` 单层，`#` 多层）。例如 `sensor/+/temperature` 匹配 `sensor/room1/temperature` 和 `sensor/room2/temperature`。 |

### 连接管理层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Connector** | 连接器 | 每个 Gateway 进程内的核心模块，管理所有长连接的生命周期。命名强调其核心职责：建立、维持和销毁客户端与服务器之间的连接。 |
| **Bucket** | 连接桶 | Connector 内部的分片单元。将所有连接按 hash 分散到多个 Bucket 中，每个 Bucket 有独立的锁，从而将锁竞争从全局降低到分片级别。命名类比 HashMap 中的 Bucket 概念——按 hash 将元素分桶。典型配置：1024 个 Bucket，每个 Bucket 管理约 1000 条连接。 |
| **Channel** | 通道 | 单个客户端连接的抽象封装。包含：原始 TCP 连接（net.Conn）、发送缓冲区（Ring Buffer）、心跳状态、用户 ID。命名来自 Go 的 channel 概念——数据在其中流动的管道。与 Netty 的 Channel 概念类似。 |
| **Session** | 会话 | 逻辑连接，生命周期长于物理连接。当客户端断开后重连，只要 Session 未过期，就能恢复之前的状态（如 MQTT 的 Clean Session=false）。命名来自 HTTP Session 的概念——代表一段用户交互过程。 |
| **Heartbeat Manager** | 心跳管理器 | 检测死连接（Dead Connection）的组件。WebSocket 使用 Ping/Pong 帧，MQTT 使用 PINGREQ/PINGRESP 报文。定期扫描所有连接的最后活跃时间，超时则关闭。 |

### I/O 层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Epoll / Kqueue Poller** | I/O 多路复用器 | 操作系统级别的事件循环。epoll（Linux）/ kqueue（macOS）是解决 C10M 问题的关键——用少量线程监听大量文件描述符的读写就绪事件，替代传统的一连接一协程（goroutine-per-conn）模型。 |
| **Ring Buffer** | 环形缓冲区 | 固定大小的循环队列，用于 Channel 的发送缓冲区。写入时只需移动写指针，无需内存分配，读取后自动回收空间。无锁设计（单生产者单消费者场景），吞吐极高。 |
| **Goroutine Pool** | 协程池 | 复用 goroutine，避免百万连接场景下创建百万 goroutine 导致的内存膨胀和调度压力。类似 Java 的线程池概念，但粒度更细。 |
| **Buffer Pool** | 缓冲池 | 基于 `sync.Pool` 的内存复用机制。读写操作频繁申请和释放 `[]byte` 缓冲区，Pool 避免了反复的堆分配和 GC 压力。 |

### 消息路由层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Broker** | 消息代理 | 节点间消息传递的总线。当用户 A 在 Node1，用户 B 在 Node2，A 发消息给 B 时，消息通过 Broker 从 Node1 路由到 Node2。命名源自消息中间件术语（如 Kafka Broker、MQTT Broker）。 |
| **Router** | 路由器 | 维护"用户 ID → 所在节点"映射表的组件。当需要向某用户推送消息时，Router 查表确定目标节点。通常基于 Redis 存储映射关系，支持 O(1) 查找。 |
| **Dispatcher** | 分发器 | 接收来自 Broker 的消息，根据 Router 的查询结果，将消息投递到目标节点的目标 Channel。如果目标是一个 Room，则展开为多个 Channel 逐一投递。 |
| **Room / Topic** | 房间 / 主题 | 消息广播的逻辑分组。IM 场景下的群聊对应 Room，IoT 场景下的设备主题对应 Topic。一条消息发到 Room，所有 Room 成员的 Channel 都会收到。 |

### 基础设施层组件

| 名称 | 中文 | 解释 |
|---|---|---|
| **Registry** | 注册中心 | 服务发现基础设施。每个 Gateway 节点启动时向 Registry 注册自己的地址和容量，其他节点通过 Watch 机制感知集群变化。常用 etcd 或 Consul。 |
| **Consistent Hashing** | 一致性哈希 | 将用户分配到 Gateway 节点的算法。相比简单取模，一致性哈希在节点增减时只需迁移少量连接，避免"雪崩式重连"。 |
| **Snowflake ID** | 雪花 ID | 分布式唯一 ID 生成算法。用于消息 ID、连接 ID 的全局唯一标识，时间有序、不依赖中心化服务。 |

---

## 架构分层详解

整个系统从外到内分为 7 层，每层职责清晰、可独立扩展。

### 第 1 层：接入层（Access Layer）

**职责：** 对外暴露端口，接受 TCP 连接，完成 TLS 终结和协议识别。

```
客户端 → LB (L4) → Gateway:8080 (WebSocket)
                  → Gateway:1883 (MQTT)
```

- LB 配置 L4 模式（TCP 代理），不解析 HTTP/MQTT 协议
- 同一个 Gateway 进程可以监听多个端口，分别处理 WebSocket 和 MQTT
- TLS 可在 LB 层终结（推荐）或在 Gateway 层终结

### 第 2 层：协议层（Protocol Layer）

**职责：** 解析具体协议，将不同协议的消息转换为统一的内部格式。

```go
// Protocol Adapter 接口 —— 屏蔽协议差异
type ProtocolAdapter interface {
    // Upgrade 完成协议握手，返回 Channel
    Upgrade(conn net.Conn) (Channel, error)
    // ReadMessage 从连接读取一条消息
    ReadMessage(ch Channel) (Message, error)
    // WriteMessage 向连接写入一条消息
    WriteMessage(ch Channel, msg Message) error
    // Close 优雅关闭连接
    Close(ch Channel) error
}
```

WebSocket 和 MQTT 各自实现此接口，上层代码完全感知不到协议差异。

### 第 3 层：连接管理层（Connection Management Layer）

**职责：** 管理连接生命周期，实现 Bucket 分片、心跳检测、Session 维护。

这一层是整个系统最核心的部分，直接决定单节点能承载多少连接。关键设计：

| 设计点 | 说明 |
|---|---|
| Bucket 分片 | 将全局锁拆为 N 个分片锁，并发性能提升 N 倍 |
| epoll 代替 goroutine-per-conn | 1M 连接只需约 100 个 goroutine，内存从 8GB 降到 <100MB |
| Ring Buffer 发送队列 | 避免为每个连接分配动态缓冲区，减少 GC 压力 |
| Session 与 Channel 分离 | 物理连接断开不影响逻辑会话，支持重连恢复 |

### 第 4 层：消息路由层（Message Routing Layer）

**职责：** 跨节点消息路由，解决"用户 A 在 Node1，用户 B 在 Node2"的消息传递问题。

```
Node1: UserA.send(msg) → Broker.Publish("user:B", msg)
                                    ↓
                         Broker 通过 NATS 投递到 Node2
                                    ↓
Node2: Router.Lookup("B") → Dispatcher → Bucket → Channel → UserB
```

### 第 5 层：业务逻辑层（Business Logic Layer）

**职责：** 处理具体业务——消息存储、群聊管理、用户状态、消息回执。

这一层在长连接网关中通常是独立服务（微服务拆分），通过 gRPC 与 Gateway 交互。网关本身不处理业务，只负责消息的接收和投递。

### 第 6 层：存储层（Storage Layer）

**职责：** 持久化数据。

| 存储 | 用途 | 为什么选它 |
|---|---|---|
| Redis Cluster | Session 映射（uid → node）、在线状态 | O(1) 查找，支持 TTL 自动过期 |
| MySQL / PostgreSQL | 离线消息、消息历史、用户关系 | 关系型数据，ACID 保证 |
| Kafka | 消息持久化、审计日志、消息回放 | 高吞吐、持久化、支持回放 |

### 第 7 层：监控层（Monitoring Layer）

**职责：** 可观测性——指标采集、链路追踪、告警。

| 组件 | 职责 |
|---|---|
| Prometheus + Grafana | 连接数、消息 QPS、延迟分位数、Bucket 负载 |
| Jaeger | 消息链路追踪（从发送到接收的完整路径） |
| Alerting | 连接数超阈值、消息积压、节点宕机告警 |

---

## Go 项目目录结构

```
million-conn/
├── cmd/                          # Command — 入口命令
│   ├── gateway/                  # 网关服务入口
│   │   └── main.go
│   ├── connector/                # 连接器服务入口（可与 gateway 合并部署）
│   │   └── main.go
│   ├── dispatcher/               # 消息分发器入口
│   │   └── main.go
│   └── api/                      # HTTP API 服务入口（管理接口）
│       └── main.go
│
├── internal/                     # Internal — 内部包，不对外暴露
│   ├── gateway/                  # 网关层实现
│   │   ├── server.go             # TCP/HTTP Server 启动与监听
│   │   ├── upgrader.go           # WebSocket 升级器
│   │   └── mqtt_acceptor.go      # MQTT 连接接受器
│   │
│   ├── connector/                # 连接管理层核心
│   │   ├── connector.go          # Connector 主结构，管理所有 Bucket
│   │   ├── bucket.go             # Bucket 连接桶实现
│   │   ├── channel.go            # Channel 连接通道封装
│   │   ├── session.go            # Session 会话管理
│   │   ├── room.go               # Room 房间（广播分组）
│   │   └── poller.go             # epoll/kqueue I/O 多路复用封装
│   │
│   ├── protocol/                 # 协议层
│   │   ├── adapter.go            # ProtocolAdapter 接口定义
│   │   ├── websocket/            # WebSocket 协议实现
│   │   │   ├── codec.go          #   帧编解码
│   │   │   ├── frame.go          #   帧结构定义
│   │   │   └── upgrader.go       #   HTTP → WebSocket 升级
│   │   └── mqtt/                 # MQTT 协议实现
│   │       ├── codec.go          #   报文编解码
│   │       ├── packet.go         #   14 种报文类型定义
│   │       ├── topic_tree.go     #   主题树与通配符匹配
│   │       └── qos.go            #   QoS 0/1/2 服务质量处理
│   │
│   ├── broker/                   # 消息代理层
│   │   ├── broker.go             # Broker 接口定义
│   │   ├── nats_broker.go        # NATS 实现（推荐，低延迟）
│   │   ├── redis_broker.go       # Redis Pub/Sub 实现（简单场景）
│   │   └── kafka_broker.go       # Kafka 实现（持久化场景）
│   │
│   ├── router/                   # 路由层
│   │   ├── router.go             # Router 接口（uid → node 查找）
│   │   ├── dispatcher.go         # Dispatcher 消息分发
│   │   └── consistent_hash.go    # 一致性哈希算法
│   │
│   ├── registry/                 # 注册中心
│   │   ├── registry.go           # Registry 接口
│   │   ├── etcd.go               # etcd 实现
│   │   └── consul.go             # Consul 实现
│   │
│   ├── pool/                     # 对象池与缓冲池
│   │   ├── goroutine_pool.go     # 协程池（复用 goroutine）
│   │   ├── buffer_pool.go        # 缓冲池（sync.Pool）
│   │   └── ring_buffer.go        # 环形缓冲区（Channel 发送队列）
│   │
│   └── metrics/                  # 监控指标
│       ├── collector.go          # 指标采集器
│       └── prometheus.go         # Prometheus 指标导出
│
├── pkg/                          # Public — 公共包，可被外部引用
│   ├── packet/                   # 通用消息包定义
│   │   └── message.go            # Message 结构体
│   ├── auth/                     # 认证模块
│   │   └── token.go              # Token 校验
│   └── utils/                    # 工具函数
│       ├── snowflake.go          # 雪花 ID 生成器
│       └── ip.go                 # IP 解析工具
│
├── configs/                      # 配置文件
│   ├── gateway.yaml
│   ├── connector.yaml
│   └── sysctl.conf               # Linux 内核参数调优模板
│
├── deployments/                  # 部署配置
│   ├── docker-compose.yaml
│   └── k8s/
│       ├── connector-statefulset.yaml  # 有状态部署（连接有状态）
│       ├── gateway-deployment.yaml
│       └── hpa.yaml                    # 水平自动扩缩容
│
├── scripts/
│   ├── benchmark.sh              # 压测脚本
│   └── tune_kernel.sh            # 内核调优脚本
│
├── go.mod
├── go.sum
└── Makefile
```

### 目录命名说明

| 目录 | 命名含义 |
|---|---|
| `cmd/` | Go 社区标准——可执行文件入口，每个子目录编译为一个二进制 |
| `internal/` | Go 编译器强制保护——该目录下的包只能被本模块内的代码引用 |
| `pkg/` | 可被外部项目引用的公共代码，如 SDK 或工具类 |
| `configs/` | 配置文件模板，不含敏感信息 |
| `deployments/` | 容器化和编排配置 |

---

## 关键技术选型

### I/O 模型：epoll vs goroutine-per-conn

| 对比项 | goroutine-per-conn | epoll/kqueue |
|---|---|---|
| 1M 连接 goroutine 数 | 1,000,000 | ~100（poller 线程数） |
| 栈内存（每个 goroutine 最小 8KB） | ~8 GB | ~1 MB |
| 调度开销 | 高（runtime 调度 1M goroutine） | 低（OS 内核事件通知） |
| 编程复杂度 | 低（Go 原生模型） | 高（需要手动管理事件循环） |
| 适用场景 | 连接数 <10 万 | 连接数 >10 万 |

**结论：** 百万连接必须使用 epoll 模型。Go 标准库的 `net` 包底层已使用 epoll，但每次 Read 仍会阻塞一个 goroutine。解决方案是使用 `gobwas/ws` + `easygo/netpoll` 或类似的非阻塞 I/O 库。

### WebSocket 库选型

| 库 | 内存/连接 | 特点 | 适用场景 |
|---|---|---|---|
| `gorilla/websocket` | ~12 KB | 最流行，API 简单 | 连接数 <10K |
| `gobwas/ws` | ~3.5 KB | 零分配升级，支持 epoll | 百万连接 ✅ |
| `nhooyr.io/websocket` | ~8 KB | 现代 API，支持 context | 连接数 <100K |

**结论：** 选择 `gobwas/ws`，内存占用仅为 gorilla 的 1/3，且原生支持 epoll 集成。

### 内部消息总线选型

| 组件 | 延迟 | 吞吐 | 持久化 | 适用场景 |
|---|---|---|---|---|
| NATS | 亚毫秒 | 1000 万+ msg/s | 可选（JetStream） | 实时路由 ✅ |
| Redis Pub/Sub | 亚毫秒 | 100 万+ msg/s | 不支持 | 简单场景 |
| Kafka | 毫秒级 | 100 万+ msg/s | 持久化 | 消息存储、回放 |

**结论：** 实时消息路由用 NATS（低延迟、内置集群），消息持久化用 Kafka。

### 注册中心选型

| 组件 | 一致性 | Watch | 适用场景 |
|---|---|---|---|
| etcd | 强一致（Raft） | 支持 | K8s 生态，节点数 <1000 ✅ |
| Consul | 最终一致（Gossip） | 支持 | 多数据中心 |
| ZooKeeper | 强一致（ZAB） | 支持 | Java 生态 |

**结论：** 选择 etcd，与 K8s 生态天然集成，Watch 机制适合节点变更感知。

---

## 核心数据结构

### Channel — 连接通道

```go
// Channel 封装单个客户端连接
// 命名来源：数据在其中流动的管道，类比 Go channel 和 Netty Channel
type Channel struct {
    conn      net.Conn       // 底层 TCP 连接
    uid       int64          // 用户 ID
    writeBuf  *RingBuffer    // 发送缓冲区（环形缓冲区，无锁写入）
    lastActive time.Time     // 最后活跃时间（心跳检测用）
    protocol  ProtocolType   // 协议类型：WebSocket / MQTT
    session   *Session       // 关联的逻辑会话
    closed    int32          // 原子标记，防止重复关闭
}
```

### Bucket — 连接桶

```go
// Bucket 是连接的分片容器
// 命名来源：HashMap 中的桶概念——按 hash 将连接分散存储
// 设计意图：将全局锁拆为 N 个分片锁，降低并发竞争
type Bucket struct {
    mu        sync.RWMutex          // 分片锁（只锁当前桶内的连接）
    channels  map[int64]*Channel    // uid → Channel 映射
    rooms     map[string]*Room      // roomID → Room 映射
    routines  int                   // 当前桶的工作协程数
    index     int                   // 桶索引，用于日志和监控
}
```

### Connector — 连接器

```go
// Connector 是连接管理层的顶层结构
// 管理所有 Bucket，提供连接的注册、查找和广播能力
type Connector struct {
    buckets   []*Bucket           // Bucket 数组，大小为 2^n（方便取模）
    bucketNum int                 // Bucket 数量，典型值 1024
    poller    Poller              // I/O 多路复用器
    heartbeat *HeartbeatManager   // 心跳管理器
}

// 根据 uid 计算所属 Bucket（位运算取模，性能优于 %）
func (c *Connector) GetBucket(uid int64) *Bucket {
    return c.buckets[uid&int64(c.bucketNum-1)]
}
```

### Session — 会话

```go
// Session 代表一段用户交互过程
// 生命周期长于物理连接——断开重连后可恢复
type Session struct {
    sid       string          // 会话 ID（全局唯一）
    uid       int64           // 用户 ID
    channel   *Channel        // 当前关联的物理连接（可为 nil 表示离线）
    created   time.Time       // 创建时间
    expires   time.Time       // 过期时间
    metadata  map[string]any  // 扩展数据（如 MQTT clean session 标记）
}
```

### Room — 房间

```go
// Room 是消息广播的逻辑分组
// IM 场景 = 群聊，IoT 场景 = 设备主题
type Room struct {
    id        string                // 房间 ID
    mu        sync.RWMutex
    channels  map[int64]*Channel    // 房间内所有成员的 Channel
}

// Broadcast 向房间内所有成员广播消息
func (r *Room) Broadcast(msg *Message) {
    r.mu.RLock()
    defer r.mu.RUnlock()
    for _, ch := range r.channels {
        // 异步写入 Channel 的 Ring Buffer，不阻塞广播
        ch.writeBuf.Put(msg)
    }
}
```

### Broker — 消息代理接口

```go
// Broker 定义节点间消息传递的能力
type Broker interface {
    // Publish 发布消息到指定主题
    Publish(topic string, msg *Message) error
    // Subscribe 订阅主题，收到消息时调用 handler
    Subscribe(topic string, handler MessageHandler) error
    // Unsubscribe 取消订阅
    Unsubscribe(topic string) error
    // Close 关闭 Broker 连接
    Close() error
}

type MessageHandler func(topic string, msg *Message) error
```

### Router — 路由器接口

```go
// Router 维护用户到节点的映射
type Router interface {
    // Register 注册用户所在节点
    Register(uid int64, nodeAddr string) error
    // Lookup 查找用户所在节点
    Lookup(uid int64) (nodeAddr string, err error)
    // Unregister 取消注册（用户断开时）
    Unregister(uid int64) error
}
```

---

## 连接生命周期

### WebSocket 连接流程

```
1. TCP 三次握手
   Client ──SYN──→ Gateway
   Client ←SYN+ACK── Gateway
   Client ──ACK──→ Gateway

2. HTTP Upgrade 握手
   Client ──GET /ws HTTP/1.1──→ Gateway
           Upgrade: websocket
           Sec-WebSocket-Key: ...
   Client ←HTTP 101 Switching Protocols── Gateway
           Upgrade: websocket
           Sec-WebSocket-Accept: ...

3. 连接注册
   Gateway: conn = accept()
   Gateway: channel = newChannel(conn, WS)
   Gateway: bucket = connector.GetBucket(uid)
   Gateway: bucket.Put(uid, channel)
   Gateway: router.Register(uid, nodeAddr)

4. 消息收发循环
   poller.Wait() → 有数据可读的 fd 列表
   → goroutinePool.Submit(func() {
       msg = codec.ReadMessage(channel)
       dispatcher.Dispatch(msg)
   })

5. 心跳检测
   HeartbeatManager: 每 30s 扫描一次
   → if now - channel.lastActive > 90s:
       channel.Close()
       bucket.Remove(uid)
       router.Unregister(uid)

6. 优雅关闭
   Client ──Close Frame──→ Gateway
   Gateway: channel.Close()
   Gateway: bucket.Remove(uid)
   Gateway: router.Unregister(uid)
   Gateway: session.Detach() // Session 保留，Channel 销毁
```

### MQTT 连接流程

```
1. TCP 三次握手（同上）

2. MQTT CONNECT 握手
   Client ──CONNECT Packet──→ Gateway
           ClientID: "device-001"
           CleanSession: false
           KeepAlive: 60
   Client ←CONNACK Packet── Gateway
           ReturnCode: 0 (accepted)

3. 连接注册（同上，增加 MQTT 特有逻辑）
   → 如果 CleanSession=false 且存在旧 Session：
     恢复 Session，重新投递未确认消息
   → 如果有遗嘱消息（Will Message）：
     注册 Will Topic 和 Will Payload

4. 订阅主题
   Client ──SUBSCRIBE──→ Gateway
           Topic: "sensor/+/temperature"
           QoS: 1
   Gateway: topicTree.Add("sensor/+/temperature", channel)
   Client ←SUBACK── Gateway

5. 心跳检测
   Client ──PINGREQ──→ Gateway（每 KeepAlive/2 秒）
   Client ←PINGRESP── Gateway
   → 如果 1.5 * KeepAlive 内没有收到任何报文：
     断开连接，触发 Will Message

6. 断开
   Client ──DISCONNECT──→ Gateway
   → 如果 CleanSession=true：清除 Session
   → 如果 CleanSession=false：保留 Session，等待重连
```

---

## WebSocket 专项设计

### 帧解析

WebSocket 帧结构：

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |          (16/64 bits)         |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+-------------------------------+
|     Masking-key (32 bits)     |         Payload Data          |
| (if MASK set)                 |                               |
+-------------------------------+-------------------------------+
```

| 字段 | 说明 |
|---|---|
| FIN | 是否为消息的最后一帧（支持分片传输） |
| opcode | 帧类型：0x1=文本, 0x2=二进制, 0x8=关闭, 0x9=Ping, 0xA=Pong |
| MASK | 客户端→服务器必须为 1（安全要求） |
| Payload len | 负载长度：≤125 直接表示，126 用后续 2 字节，127 用后续 8 字节 |

### 压缩（permessage-deflate）

百万连接场景下**不建议**开启压缩：

- 压缩需要为每个连接维护 LZ77 滑动窗口（~32 KB/连接）
- 1M 连接 × 32 KB = 32 GB 额外内存
- CPU 消耗高，延迟增加

如果带宽紧张，建议在应用层使用 Protocol Buffers 或 MessagePack 减小消息体积。

---

## MQTT 专项设计

### QoS 等级

| 等级 | 名称 | 投递语义 | 实现成本 | 适用场景 |
|---|---|---|---|---|
| QoS 0 | At most once | 最多一次（可能丢失） | 低 | 传感器定期上报（丢一次无所谓） |
| QoS 1 | At least once | 至少一次（可能重复） | 中 | 消息通知（接收方做幂等） |
| QoS 2 | Exactly once | 恰好一次 | 高 | 支付指令（不允许重复） |

### QoS 1 流程

```
Publisher ──PUBLISH(QoS1, msgId=1)──→ Broker
Broker ──PUBACK(msgId=1)──→ Publisher

Broker ──PUBLISH(QoS1, msgId=1)──→ Subscriber
Subscriber ──PUBACK(msgId=1)──→ Broker
```

如果 Broker 未收到 PUBACK，会定期重传（通常间隔 5s，最多重传 3 次）。

### QoS 2 流程（四次握手）

```
Publisher ──PUBLISH(QoS2, msgId=1)──→ Broker
Broker ──PUBREC(msgId=1)──→ Publisher        # 已接收
Publisher ──PUBREL(msgId=1)──→ Broker         # 请释放
Broker ──PUBCOMP(msgId=1)──→ Publisher        # 已完成
```

### 主题树（Topic Tree）

MQTT 主题支持两种通配符：

- `+`：匹配**单层**，例如 `sensor/+/temp` 匹配 `sensor/room1/temp` 但不匹配 `sensor/room1/sub/temp`
- `#`：匹配**多层**（必须在末尾），例如 `sensor/#` 匹配 `sensor/room1/temp` 和 `sensor/room1/sub/temp`

数据结构设计：

```go
// TopicTree 使用 Trie（前缀树）实现高效匹配
type TopicTree struct {
    root *TopicNode
}

type TopicNode struct {
    children    map[string]*TopicNode  // 子节点
    subscribers []*Channel             // 该节点的订阅者
}

// Match 返回匹配给定主题的所有订阅者
// 例如 Match("sensor/room1/temp") 会匹配：
//   - "sensor/room1/temp"（精确匹配）
//   - "sensor/+/temp"（单层通配）
//   - "sensor/#"（多层通配）
//   - "#"（全匹配）
func (t *TopicTree) Match(topic string) []*Channel {
    // ... Trie 遍历 + 通配符展开
}
```

### 遗嘱消息（Will Message）

客户端在 CONNECT 时可以声明一条遗嘱消息：当客户端**非正常断开**（没有发送 DISCONNECT）时，Broker 自动将遗嘱消息发布到指定主题。

用途：
- IoT 设备离线通知：`device/001/status` → `{"status":"offline"}`
- IM 用户离线通知：`user/001/presence` → `{"online":false}`

### 保留消息（Retained Message）

每个主题可以有一条保留消息。新的订阅者订阅该主题时，会**立即收到**保留消息（无需等到下次发布）。

用途：
- 设备状态快照：新订阅者立即知道设备当前状态
- 配置下发：订阅即获得最新配置

---

## 水平扩展策略

### 扩展模型

```
                    ┌─── Gateway Node 1 (50 万连接)
                    │
LB ─── 一致性哈希 ──├─── Gateway Node 2 (50 万连接)
                    │
                    └─── Gateway Node 3 (新增节点, 接收迁移的连接)
```

### 节点扩容流程

1. 新节点启动，向 **Registry (etcd)** 注册自己
2. 其他节点通过 etcd Watch 感知新节点加入
3. LB 更新后端列表，新连接自然分配到新节点
4. **已有连接不迁移**（等待自然断线重连即可，重连时 LB 会将其路由到新节点）

### 节点缩容 / 宕机流程

1. 节点从 Registry 注销（或 etcd lease 过期）
2. 其他节点感知节点下线
3. 客户端检测到连接断开，触发自动重连
4. 重连请求通过 LB 路由到存活节点
5. **关键：客户端必须实现指数退避重连**，防止"惊群效应"（Thundering Herd）

### 一致性哈希用途

一致性哈希**不用于 LB 分配连接**（LB 用 Round Robin 或 Least Connection），而是用于：

- **Router 查找**：快速定位用户可能在哪个节点
- **Session 存储分片**：将 Session 分散到 Redis Cluster 的不同分片

---

## 性能优化策略

### 1. 内存优化

| 策略 | 效果 | 实现方式 |
|---|---|---|
| `sync.Pool` 缓冲池 | 减少 80%+ 的 `[]byte` 分配 | 读写操作共享缓冲区池 |
| Ring Buffer | 每个 Channel 固定大小发送队列 | 避免动态扩容和 GC |
| gobwas/ws 零分配升级 | 每连接节省 ~8 KB | 替代 gorilla/websocket |
| 小对象内联 | 减少指针追踪和 GC 扫描 | Channel 结构体使用值类型 |

### 2. CPU 优化

| 策略 | 效果 | 实现方式 |
|---|---|---|
| epoll 事件批处理 | 一次系统调用处理多个就绪事件 | `epoll_wait` 返回 N 个事件 |
| Goroutine Pool | 复用 goroutine，避免创建销毁开销 | ants 或自研协程池 |
| 位运算取模 | Bucket 索引计算 `uid & (n-1)` | n 取 2 的幂次 |
| 批量写入 | 合并多条消息为一次 Write 系统调用 | writev / 缓冲区合并 |

### 3. 网络优化

| 策略 | 效果 | 实现方式 |
|---|---|---|
| TCP_NODELAY | 禁用 Nagle 算法，降低延迟 | `conn.SetNoDelay(true)` |
| SO_REUSEPORT | 多个进程绑定同一端口，内核级负载均衡 | `syscall.SetsockoptInt` |
| 读写分离 goroutine | 读和写使用独立 goroutine，互不阻塞 | Channel 内部分离读写路径 |

### 4. GC 优化

```go
// 使用 sync.Pool 减少 GC 压力
var bufferPool = sync.Pool{
    New: func() any {
        buf := make([]byte, 4096)
        return &buf
    },
}

// 读取消息时从 Pool 借用缓冲区
func readMessage(conn net.Conn) ([]byte, error) {
    bufp := bufferPool.Get().(*[]byte)
    defer bufferPool.Put(bufp)
    buf := *bufp
    n, err := conn.Read(buf)
    if err != nil {
        return nil, err
    }
    // 复制数据到新切片（因为 buf 会被归还到 Pool）
    data := make([]byte, n)
    copy(data, buf[:n])
    return data, nil
}
```

---

## 容量规划

### 单连接内存预算

| 组件 | 内存 | 说明 |
|---|---|---|
| TCP 连接内核缓冲区 | ~6 KB | 读 4KB + 写 2KB（调小默认值） |
| Channel 结构体 | ~0.5 KB | 指针、状态、元数据 |
| gobwas/ws 缓冲区 | ~3.5 KB | 升级后保留的最小缓冲 |
| Ring Buffer | ~4 KB | 发送队列（固定 4KB） |
| Session 结构体 | ~0.3 KB | 会话元数据 |
| **合计** | **~14 KB/连接** | |

### 百万连接资源需求

| 资源 | 计算 | 数值 |
|---|---|---|
| 内存 | 1M × 14 KB | **~14 GB**（预留 2x = 28 GB） |
| 文件描述符 | 1M + 系统预留 | **~1,100,000** |
| CPU | epoll 模型下主要瓶颈在消息处理 | **16-32 核** |
| 网络带宽 | 假设 1KB/msg, 10 万 msg/s | **~800 Mbps** |

### Linux 内核调优（sysctl.conf）

```bash
# ===== 文件描述符 =====
# 系统级文件描述符上限
fs.file-max = 2000000
# 单进程文件描述符上限（需配合 ulimit -n）
# 在 /etc/security/limits.conf 中设置

# ===== TCP 连接数 =====
# 本地端口范围（用于出站连接）
net.ipv4.ip_local_port_range = 1024 65535
# TIME_WAIT 快速回收
net.ipv4.tcp_tw_reuse = 1
# TCP 连接队列（半连接 + 全连接）
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535

# ===== TCP 缓冲区（降低每连接内存占用） =====
# 最小值 4KB，默认值 4KB，最大值 16KB（比默认值小得多）
net.ipv4.tcp_rmem = 4096 4096 16384
net.ipv4.tcp_wmem = 4096 4096 16384

# ===== TCP Keepalive =====
# 应用层已有心跳，内核 keepalive 作为兜底
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3

# ===== 内存 =====
# 允许系统使用更多内存作为网络缓冲
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 4096
net.core.wmem_default = 4096

# ===== epoll 优化 =====
# 增大 epoll 实例可监听的最大 fd 数
fs.epoll.max_user_watches = 2000000
```

### 部署推荐

| 规模 | 节点数 | 单节点配置 | 连接分布 |
|---|---|---|---|
| 10 万连接 | 2 节点 | 8C16G | 5 万/节点 |
| 50 万连接 | 4 节点 | 16C32G | 12.5 万/节点 |
| 100 万连接 | 8 节点 | 16C32G | 12.5 万/节点 |
| 500 万连接 | 20 节点 | 32C64G | 25 万/节点 |

> 建议单节点不超过 25 万连接，预留 50% 容量应对突发和节点故障。

---

## 分阶段实施计划

### Phase 1：单节点原型（2-3 周）

**目标：** 验证核心模型，单机承载 10 万连接。

| 任务 | 输出 |
|---|---|
| 实现 Channel + Bucket + Connector | `internal/connector/` |
| 实现 WebSocket Codec（基于 gobwas/ws） | `internal/protocol/websocket/` |
| 实现 epoll Poller | `internal/connector/poller.go` |
| 实现 HeartbeatManager | `internal/connector/connector.go` |
| 编写压测脚本 | `scripts/benchmark.sh` |
| 内核调优 | `configs/sysctl.conf` |

**验收标准：**
- 单机 10 万 WebSocket 连接，内存 <2 GB
- 消息广播延迟 P99 <10 ms

### Phase 2：多协议 + 消息路由（2-3 周）

**目标：** 支持 MQTT 协议，实现跨节点消息路由。

| 任务 | 输出 |
|---|---|
| 实现 MQTT Codec（CONNECT/PUBLISH/SUBSCRIBE） | `internal/protocol/mqtt/` |
| 实现 Protocol Adapter 接口 | `internal/protocol/adapter.go` |
| 实现 NATS Broker | `internal/broker/nats_broker.go` |
| 实现 Router（Redis） | `internal/router/router.go` |
| 实现 Dispatcher | `internal/router/dispatcher.go` |
| 实现 Room 广播 | `internal/connector/room.go` |

**验收标准：**
- WebSocket 和 MQTT 客户端能互发消息
- 跨节点消息投递延迟 P99 <20 ms

### Phase 3：集群化 + 高可用（2-3 周）

**目标：** 支持节点动态扩缩容，优雅处理节点故障。

| 任务 | 输出 |
|---|---|
| 实现 etcd Registry | `internal/registry/etcd.go` |
| 实现节点注册 / 发现 / Watch | `internal/registry/registry.go` |
| 实现 Session 持久化（Redis） | `internal/connector/session.go` |
| 实现客户端重连恢复逻辑 | `internal/connector/session.go` |
| K8s 部署配置 | `deployments/k8s/` |
| HPA 自动扩缩 | `deployments/k8s/hpa.yaml` |

**验收标准：**
- 杀掉一个节点后，客户端在 5s 内重连到其他节点
- Session 信息不丢失（CleanSession=false 场景）

### Phase 4：生产化（2-4 周）

**目标：** 百万连接压测通过，监控告警完备。

| 任务 | 输出 |
|---|---|
| 实现 Prometheus 指标导出 | `internal/metrics/` |
| 接入 Grafana 监控大盘 | Grafana Dashboard JSON |
| 接入 Jaeger 链路追踪 | 消息投递全链路 trace |
| MQTT QoS 1/2 完整实现 | `internal/protocol/mqtt/qos.go` |
| 遗嘱消息 / 保留消息 | `internal/protocol/mqtt/` |
| 百万连接压测 | 压测报告 |
| 混沌工程（节点故障注入） | 演练报告 |

**验收标准：**
- 8 节点集群承载 100 万连接
- 单节点内存 <16 GB
- 节点故障后 10s 内所有客户端恢复连接
- 消息投递成功率 >99.99%

---

## 风险评估

| 风险 | 等级 | 描述 | 缓解措施 |
|---|---|---|---|
| **惊群效应** | 🔴 高 | 节点宕机后，其上所有客户端（几十万）同时重连，瞬间压垮其他节点 | 客户端实现指数退避 + 随机抖动重连；LB 限流新连接速率 |
| **内存泄漏** | 🔴 高 | Channel 未正确关闭导致 goroutine 和缓冲区泄漏，长时间运行后 OOM | pprof 定期采样；Channel.Close() 使用 sync.Once 保证只执行一次；设置 Session TTL |
| **消息堆积** | 🟡 中 | 消费者处理慢导致 Ring Buffer 满，新消息被丢弃 | Ring Buffer 满时丢弃最旧消息（覆盖写）；监控 Buffer 使用率；告警阈值 80% |
| **脑裂** | 🟡 中 | etcd 集群网络分区导致部分节点看到不一致的服务列表 | etcd 3 节点或 5 节点部署；设置合理的选举超时；客户端侧缓存最后已知的服务列表 |
| **消息乱序** | 🟡 中 | 异步投递 + 跨节点路由可能导致消息到达顺序与发送顺序不同 | 消息携带序列号（Sequence Number）；客户端侧排序窗口 |
| **连接风暴** | 🟡 中 | 大促或活动开始时瞬间涌入大量新连接 | 连接接受速率限制（Accept Rate Limiting）；预扩容节点 |
| **MQTT Topic 爆炸** | 🟠 低 | IoT 场景下大量设备注册独立 Topic，Topic Tree 膨胀 | Topic 数量监控；设置 Topic 上限；定期清理无订阅者的 Topic |

---

## 参考项目

| 项目 | 说明 | 参考价值 |
|---|---|---|
| [goim](https://github.com/Terry-Mao/goim) | B 站开源的 IM 框架 | Bucket/Channel 模型、Kafka 集成 |
| [gim](https://github.com/alberliu/gim) | 轻量级 Go IM | 项目结构、Session 管理 |
| [gobwas/ws](https://github.com/gobwas/ws) | 零分配 WebSocket 库 | epoll 集成、内存优化 |
| [gnet](https://github.com/panjf2000/gnet) | 高性能 Go 网络框架 | 事件驱动模型、Ring Buffer |
| [ants](https://github.com/panjf2000/ants) | Go 协程池 | Goroutine Pool 实现 |
| [eclipse/paho.mqtt.golang](https://github.com/eclipse/paho.mqtt.golang) | MQTT 客户端库 | MQTT 协议实现参考 |
| [mochi-mqtt](https://github.com/mochi-mqtt/server) | Go MQTT Broker | Topic Tree、QoS 实现 |
| [NATS](https://github.com/nats-io/nats-server) | 高性能消息系统 | 内部 Broker 选型参考 |

---

## 高频问题

### 为什么不直接用 goroutine-per-conn？

Go 的 goroutine 虽然轻量（初始栈 ~8 KB），但百万连接意味着百万 goroutine：

- **内存**：1M × 8 KB = 8 GB（仅栈空间，不含应用数据）
- **调度**：Go runtime 需要调度 1M goroutine，上下文切换成本不可忽略
- **GC**：1M goroutine 的栈是 GC root，扫描时间显著增加

使用 epoll 模型后，只需 ~100 个 goroutine 处理 I/O 事件，内存降到 <100 MB。

### 为什么选择 NATS 而不是 Redis Pub/Sub 做内部 Broker？

- Redis Pub/Sub **不持久化**，消息发出后如果没有订阅者就丢失了
- Redis 是**单线程**模型，高吞吐场景下容易成为瓶颈
- NATS 原生支持**集群模式**，内置高可用
- NATS 延迟更低（<1 ms vs Redis ~2 ms）
- 如果需要持久化，NATS JetStream 提供了类 Kafka 的能力

### Bucket 数量怎么选？

经验公式：`Bucket 数量 = 预期最大连接数 / 1000`，取最近的 2 的幂次。

- 10 万连接 → 128 Buckets
- 50 万连接 → 512 Buckets
- 100 万连接 → 1024 Buckets

Bucket 太少导致锁竞争激烈，太多导致内存浪费。1024 是大多数场景的合理默认值。

### WebSocket 和 MQTT 能共存在同一个进程吗？

可以。通过 Protocol Adapter 模式，同一个 Connector 可以管理两种协议的 Channel。它们共享 Bucket、Router、Broker 等基础设施，只有 Codec 和握手逻辑不同。

这样做的好处是运维复杂度低（一个二进制），坏处是协议 bug 可能影响另一种协议的连接。生产环境建议**分端口监听**，必要时可以拆分为独立进程。
