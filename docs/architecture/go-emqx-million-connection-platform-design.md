---
title: Go + EMQX 百万长连接平台架构设计
description: 以 EMQX 5.x 为连接层核心，Go 微服务为业务层，覆盖 IM、IoT 和通用长连接平台的完整架构设计，包含集群部署、规则引擎、数据集成与容量规划。
vocabulary:
  - emqx
  - mqtt
  - broker
  - gateway
  - erlang
  - webhook
  - grpc
  - rule-engine
  - qos
  - session
  - replicant
  - exhook
---

# Go + EMQX 百万长连接平台架构设计

## 适合人群

- 需要快速搭建百万级长连接平台，不想从零实现 MQTT 协议栈的后端工程师
- 正在做 IoT 设备接入或 IM 系统技术选型的架构师
- 想了解 EMQX 5.x 在生产环境中如何与 Go 微服务协同工作的开发者

## 学习目标

- 理解 EMQX 5.x 的 Core-Replicant 集群架构和 Mria 数据库原理
- 掌握 Go 与 EMQX 的四种集成模式（Paho Client / REST API / ExHook / WebHook）及各自适用场景
- 能针对 IM、IoT、通用平台三种场景设计完整的 Topic 结构和消息流转链路
- 了解 EMQX Rule Engine 的数据集成能力（Kafka / Redis / ClickHouse 等）
- 能输出一份基于 EMQX 的百万连接平台技术方案

## 快速导航

- [方案定位：自研网关 vs EMQX 平台](#方案定位-自研网关-vs-emqx-平台)
- [系统架构总览](#系统架构总览)
- [EMQX 5.x 核心架构解析](#emqx-5x-核心架构解析)
- [集群设计](#集群设计)
- [Go 与 EMQX 的四种集成模式](#go-与-emqx-的四种集成模式)
- [三大场景架构设计](#三大场景架构设计)
- [认证与鉴权](#认证与鉴权)
- [规则引擎与数据集成](#规则引擎与数据集成)
- [Go 项目目录结构](#go-项目目录结构)
- [核心 Go 代码示例](#核心-go-代码示例)
- [部署架构](#部署架构)
- [性能基准与容量规划](#性能基准与容量规划)
- [监控体系](#监控体系)
- [分阶段实施计划](#分阶段实施计划)
- [风险评估](#风险评估)
- [与自研网关方案对比总结](#与自研网关方案对比总结)
- [参考资源](#参考资源)
- [高频问题](#高频问题)

---

## 方案定位：自研网关 vs EMQX 平台

| 维度 | 自研网关（Go + epoll） | EMQX 平台（Go + EMQX） |
|---|---|---|
| **开发周期** | 3-6 个月（含 MQTT 协议栈） | 1-2 个月（EMQX 开箱即用） |
| **团队要求** | 需要网络编程、协议解析经验 | 需要 EMQX 运维 + Go 业务开发 |
| **协议完整度** | 需逐步实现 QoS / Will / Retain | MQTT 3.1.1 / 5.0 完整支持 |
| **数据集成** | 需自建桥接层 | 50+ 原生 Connector（Kafka / Redis / PG 等） |
| **运维复杂度** | 纯 Go，团队熟悉 | Erlang/OTP 运维有学习曲线 |
| **性能天花板** | 极致可控（epoll + 零分配） | 单节点 5M 连接 / 2M msg/s |
| **定制灵活性** | 完全可控 | ExHook / Rule Engine 可扩展 |
| **许可证** | 无限制 | v5.9.0+ 集群需 License（BSL 1.1） |

**选型建议：**

- **选自研网关**：团队有网络编程经验，需要极致性能控制，或者协议定制需求强烈
- **选 EMQX 平台**：需要快速上线，MQTT 功能完整度要求高，数据集成场景多，团队更擅长业务开发

---

## 系统架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Client Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Mobile   │  │ Web      │  │ IoT      │  │ Desktop  │               │
│  │ App      │  │ Browser  │  │ Device   │  │ Client   │               │
│  │ (MQTT)   │  │ (WS/WSS) │  │ (MQTT)   │  │ (MQTT)   │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
└───────┼──────────────┼──────────────┼──────────────┼────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Load Balancer (L4 TCP/TLS)                          │
│                     HAProxy / NLB / MetalLB                             │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  EMQX Core 1  │──│  EMQX Core 2  │──│  EMQX Core 3  │  ← Full Mesh
│  (Mria ACID)  │  │  (Mria ACID)  │  │  (Mria ACID)  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │ async RLOG       │ async RLOG       │ async RLOG
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Replicant 1  │  │  Replicant 2  │  │  Replicant N  │  ← Star Topology
│  (Read-Only)  │  │  (Read-Only)  │  │  (Read-Only)  │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────────────────┐
        │                  │                              │
        ▼                  ▼                              ▼
┌───────────────┐  ┌───────────────┐              ┌───────────────┐
│  Rule Engine  │  │ ExHook(gRPC)  │              │  WebHook      │
│  SQL Filter   │  │               │              │  HTTP POST    │
└───────┬───────┘  └───────┬───────┘              └───────┬───────┘
        │                  │                              │
        ▼                  ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Go Microservices Layer                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ API     │  │ ExHook   │  │ Consumer │  │ Push Service     │  │
│  │ Server  │  │ Server   │  │ Service  │  │ (REST API/Paho)  │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────┼─────────────────┼────────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                         │
│  ┌───────┐  ┌───────┐  ┌────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Kafka │  │ Redis │  │ MySQL/ │  │ ClickHouse │  │ Prome-  │ │
│  │       │  │       │  │ PG     │  │ /InfluxDB  │  │ theus   │ │
│  └───────┘  └───────┘  └────────┘  └────────────┘  └─────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**核心设计原则：EMQX 只做连接和消息，Go 只做业务。**

- **EMQX** 负责：TCP/TLS 接入、MQTT 协议处理、连接管理、消息路由、QoS 保证、Topic 匹配
- **Go** 负责：业务逻辑、用户认证、消息持久化、离线推送、API 网关

---

## EMQX 5.x 核心架构解析

### Erlang/OTP 异步架构

EMQX 基于 Erlang/OTP 构建，天然适合海量并发连接：

- 每个 MQTT 连接映射到一个 Erlang 进程（初始堆 ~2 KB）
- Erlang 进程之间完全隔离，单个连接异常不影响其他连接
- 全异步架构：异步 TCP 处理、异步 Topic 订阅、异步消息发布

### 4 层内部架构

```
┌──────────────────────────────────────────┐
│  Connection Layer                        │
│  TCP/TLS/WebSocket 接入，MQTT 报文编解码    │
├──────────────────────────────────────────┤
│  Session Layer                           │
│  PUBLISH/SUBSCRIBE 处理，QoS 状态机        │
├──────────────────────────────────────────┤
│  PubSub Layer                            │
│  本地订阅分发，Subscription Table 匹配      │
├──────────────────────────────────────────┤
│  Router Layer                            │
│  集群级 Topic Trie + Route Table          │
│  跨节点消息转发                            │
└──────────────────────────────────────────┘
```

| 层级 | 职责 | 关键数据结构 |
|---|---|---|
| Connection | TCP 连接管理、报文编解码 | Socket、Parser |
| Session | QoS 握手、重传队列、Will Message | Inflight Queue、Message Queue |
| PubSub | 单节点内订阅匹配和消息分发 | Subscription Table（ETS） |
| Router | 集群范围 Topic 路由和跨节点转发 | Topic Trie + Route Table（Mria） |

### Mria 数据库 + RLOG

EMQX 5.0 引入 Mria 数据库，替代 Erlang 原生的 Mnesia：

- **问题**：Mnesia 使用全网状拓扑（N² 连接），节点数增加时写入性能急剧下降
- **解决**：Mria 采用 Mesh + Star 混合拓扑，数据分为 RLOG Shards 并行复制
- **原理**：EMQ 团队 fork 了 OTP，优化了 Mnesia 事务日志捕获，消除重复写入

```
Mnesia (旧):                    Mria (新):

  N1 ──── N2                      Core1 ── Core2 ── Core3
  │ \  / │                          │         │        │
  │  \/  │     →                    ▼         ▼        ▼
  │  /\  │                      Replicant1  Rep2 ... RepN
  │ /  \ │                      (async RLOG replication)
  N3 ──── N4
  (N² full mesh)                (Mesh + Star hybrid)
```

---

## 集群设计

### Core 节点 vs Replicant 节点

| 特性 | Core 节点 | Replicant 节点 |
|---|---|---|
| **数据写入** | 参与 ACID 事务写入 | 只读，写操作代理到 Core |
| **数据存储** | 完整集群数据（路由、Session、配置） | 通过 RLOG 异步复制的完整数据副本 |
| **网络拓扑** | Core 之间全网状（Full Mesh） | Star 拓扑连接到 Core |
| **可用性要求** | 必须持久化部署，不可随意重启 | 无状态，可随时销毁和扩缩容 |
| **客户端连接** | 可以接受客户端连接 | 主要的客户端连接承载节点 |
| **扩缩容影响** | 增减 Core 影响写入性能 | 增减 Replicant 不影响写入延迟 |

### 推荐集群拓扑

```
百万连接推荐配置：3 Core + 3~6 Replicant

Core 节点（3 台）：
- CPU: 8 核
- 内存: 16 GB
- 磁盘: SSD 100 GB
- 网络: Core 之间延迟 <10 ms
- 职责: 集群元数据写入、路由表维护

Replicant 节点（3~6 台）：
- CPU: 16 核
- 内存: 32 GB
- 磁盘: SSD 50 GB
- 职责: 承载客户端连接
- 每节点目标: 15~30 万连接
```

### 扩缩容策略

- **扩容**：新增 Replicant 节点 → 自动发现 Core → RLOG 同步数据 → LB 开始分配新连接
- **缩容**：标记 Replicant 为 draining → 停止接受新连接 → 等待现有连接超时或迁移 → 移除节点
- **Core 变更**：需要滚动重启，建议在低峰期操作

---

## Go 与 EMQX 的四种集成模式

### 模式一：Paho MQTT Client

Go 服务作为 MQTT 客户端连接 EMQX，订阅 Topic 消费消息或发布消息。

**适用场景**：实时消息消费、消息转发、在线状态监听

```go
import mqtt "github.com/eclipse/paho.mqtt.golang"

func NewMQTTConsumer(broker string) mqtt.Client {
    opts := mqtt.NewClientOptions().
        AddBroker(broker).
        SetClientID("go-consumer-01").
        SetCleanSession(false).
        SetAutoReconnect(true).
        SetMaxReconnectInterval(30 * time.Second).
        SetConnectionLostHandler(func(c mqtt.Client, err error) {
            log.Printf("connection lost: %v", err)
        })

    client := mqtt.NewClient(opts)
    if token := client.Connect(); token.Wait() && token.Error() != nil {
        log.Fatal(token.Error())
    }

    // 订阅消息
    client.Subscribe("im/+/inbox", 1, func(c mqtt.Client, msg mqtt.Message) {
        handleMessage(msg.Topic(), msg.Payload())
    })

    return client
}
```

### 模式二：REST API

通过 EMQX 的 HTTP API 进行管理操作和服务端消息推送。

**适用场景**：服务端主动推送、客户端管理（踢出 / 查询）、集群监控

```go
// 服务端推送消息
func PublishMessage(emqxAPI, topic string, payload []byte) error {
    body := map[string]interface{}{
        "topic":   topic,
        "qos":     1,
        "payload": base64.StdEncoding.EncodeToString(payload),
        "encoding": "base64",
    }
    jsonBody, _ := json.Marshal(body)

    req, _ := http.NewRequest("POST", emqxAPI+"/api/v5/publish", bytes.NewReader(jsonBody))
    req.SetBasicAuth("admin", "your-api-key")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return nil
}

// 批量推送
func PublishBatch(emqxAPI string, messages []PublishRequest) error {
    jsonBody, _ := json.Marshal(messages)
    req, _ := http.NewRequest("POST", emqxAPI+"/api/v5/publish/bulk", bytes.NewReader(jsonBody))
    req.SetBasicAuth("admin", "your-api-key")
    req.Header.Set("Content-Type", "application/json")

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return nil
}
```

### 模式三：ExHook（gRPC）

EMQX 作为 gRPC 客户端，在连接/消息生命周期的关键节点调用 Go gRPC 服务。

**适用场景**：自定义认证、消息拦截/修改、连接审计、业务规则注入

```
EMQX 支持的 ExHook 钩子（15+）：

连接生命周期：
  on_client_connect       → 客户端发起连接
  on_client_connack       → 连接应答
  on_client_connected     → 连接建立
  on_client_disconnected  → 连接断开
  on_client_authenticate  → 认证（可修改结果）
  on_client_authorize     → 鉴权（可修改结果）

会话生命周期：
  on_session_created      → 会话创建
  on_session_subscribed   → 订阅成功
  on_session_unsubscribed → 取消订阅
  on_session_terminated   → 会话终止

消息生命周期：
  on_message_publish      → 消息发布（可修改/拒绝）
  on_message_delivered    → 消息投递
  on_message_acked        → 消息确认
  on_message_dropped      → 消息丢弃
```

```go
// ExHook gRPC Server 实现（认证示例）
type ExHookServer struct {
    exhook.UnimplementedHookProviderServer
    authService *service.AuthService
}

func (s *ExHookServer) OnProviderLoaded(ctx context.Context,
    req *exhook.ProviderLoadedRequest) (*exhook.LoadedResponse, error) {
    return &exhook.LoadedResponse{
        Hooks: []*exhook.HookSpec{
            {Name: "client.authenticate"},
            {Name: "client.authorize"},
            {Name: "message.publish"},
        },
    }, nil
}

func (s *ExHookServer) OnClientAuthenticate(ctx context.Context,
    req *exhook.ClientAuthenticateRequest) (*exhook.ValuedResponse, error) {
    clientInfo := req.GetClientinfo()
    username := clientInfo.GetUsername()
    password := string(clientInfo.GetPassword())

    ok, err := s.authService.Verify(ctx, username, password)
    if err != nil || !ok {
        return &exhook.ValuedResponse{
            Type:  exhook.ValuedResponse_STOP_AND_RETURN,
            Value: &exhook.ValuedResponse_BoolResult{BoolResult: false},
        }, nil
    }
    return &exhook.ValuedResponse{
        Type:  exhook.ValuedResponse_STOP_AND_RETURN,
        Value: &exhook.ValuedResponse_BoolResult{BoolResult: true},
    }, nil
}
```

### 模式四：WebHook（Rule Engine Sink）

通过 Rule Engine 将匹配的消息以 HTTP POST 发送到 Go 服务。

**适用场景**：简单的消息通知、事件触发、对延迟不敏感的异步处理

```
Rule Engine SQL:
  SELECT clientid, topic, payload, now_timestamp() as ts
  FROM "device/+/telemetry"
  WHERE payload.temperature > 50

Action: HTTP POST → http://go-service:8080/webhook/device-alert
```

### 集成模式选型决策表

| 场景 | 推荐模式 | 原因 |
|---|---|---|
| 自定义认证/鉴权 | ExHook | 在 EMQX 内部拦截，延迟最低 |
| 消息内容审查/修改 | ExHook | 可以修改或拒绝消息 |
| 服务端主动推送 | REST API | 简单直接，支持批量 |
| 实时消息消费 | Paho Client | 标准 MQTT 订阅，自动重连 |
| 设备事件通知 | WebHook | 简单配置，无需编码 |
| 数据持久化（Kafka/DB） | Rule Engine | 原生 Connector，高性能 |
| 在线用户列表查询 | REST API | `/api/v5/clients` 接口 |
| 连接/断开审计 | ExHook + Kafka | ExHook 捕获事件 → Kafka 异步写入 |

---

## 三大场景架构设计

### 场景一：IM 即时通讯

#### Topic 设计

```
im/{userId}/inbox          → 个人收件箱（私聊消息投递）
im/{userId}/notify         → 系统通知（公告、提醒）
im/group/{groupId}/msg     → 群聊消息
im/group/{groupId}/status  → 群成员在线状态
im/{userId}/sync           → 多端同步（已读/撤回/删除同步）
```

#### 消息流转

```
发送私聊消息：
  Sender App
    │ MQTT PUBLISH → im/{receiverId}/inbox
    ▼
  EMQX
    ├─→ Receiver 在线 → 直接投递（QoS 1 保证至少一次）
    │
    ├─→ Rule Engine
    │     SELECT * FROM "im/+/inbox"
    │     Action 1: Kafka Sink → topic: im-messages（持久化）
    │     Action 2: Redis Sink → HSET user:{receiverId}:unread（未读计数）
    │
    └─→ ExHook on_message_publish
          → Go 服务检查黑名单、敏感词过滤
          → 返回 allow / deny

离线消息处理：
  Kafka Consumer (Go)
    │ 消费 im-messages topic
    ├─→ 写入 MySQL/PG（消息持久化）
    ├─→ 检查 Receiver 是否离线
    └─→ 离线 → 调用 APNs/FCM 推送
```

#### 群聊广播

```
方案 A：Topic 广播（推荐，适合中小群）
  Publisher → EMQX PUBLISH → im/group/{groupId}/msg
  所有群成员订阅 im/group/{groupId}/msg
  EMQX 内部 PubSub 层自动分发

方案 B：共享订阅 + 服务端扇出（适合万人大群）
  Publisher → EMQX PUBLISH → $share/group/{groupId}/im/group/{groupId}/msg
  Go 服务通过共享订阅消费 → 查询群成员列表 → 逐一 REST API 推送
  优点：可控制推送速率，避免 EMQX 内部广播风暴
```

#### 特殊功能

| 功能 | 实现方式 |
|---|---|
| 已读回执 | 接收方 PUBLISH → `im/{senderId}/sync`，payload 含 msgId + read |
| 消息撤回 | 发送方 PUBLISH → `im/{receiverId}/sync`，payload 含 msgId + revoke |
| @提醒 | ExHook `on_message_publish` 解析 payload → 额外推送到被 @ 用户 |
| 输入中状态 | QoS 0 PUBLISH → `im/{userId}/typing`，低优先级不持久化 |
| 多端同步 | 同一用户多设备用不同 ClientID 订阅 `im/{userId}/sync` |

---

### 场景二：IoT 设备接入

#### Topic 设计

```
device/{deviceId}/telemetry     → 设备遥测数据上报（温度、湿度、GPS 等）
device/{deviceId}/event         → 设备事件上报（告警、状态变更）
device/{deviceId}/command       → 云端下发指令（服务端 → 设备）
device/{deviceId}/command/resp  → 设备回复指令执行结果
device/{deviceId}/ota           → OTA 固件升级通知
device/{deviceId}/shadow        → 设备影子（期望状态 + 实际状态）
sys/device/connected            → 系统主题：设备上线通知（EMQX 内置）
sys/device/disconnected         → 系统主题：设备离线通知（EMQX 内置）
```

#### 数据上报链路

```
IoT Device
  │ MQTT PUBLISH → device/{deviceId}/telemetry
  │ QoS 1, payload: {"temp": 25.3, "humidity": 60, "ts": 1711756800}
  ▼
EMQX Rule Engine:
  SELECT
    clientid as device_id,
    payload.temp as temperature,
    payload.humidity as humidity,
    payload.ts as timestamp
  FROM "device/+/telemetry"

  Action 1: ClickHouse Sink → 时序数据存储
    INSERT INTO device_telemetry(device_id, temperature, humidity, timestamp)
    VALUES (${device_id}, ${temperature}, ${humidity}, ${timestamp})

  Action 2: Redis Sink → 设备最新状态缓存
    HSET device:${device_id}:latest temp ${temperature} humidity ${humidity}

  Action 3: Kafka Sink（温度告警）
    WHERE temperature > 50
    → topic: device-alerts
```

#### 指令下发

```go
// Go 服务下发指令到设备
func SendCommand(emqxAPI, deviceID string, cmd Command) error {
    payload, _ := json.Marshal(cmd)
    return PublishMessage(emqxAPI, fmt.Sprintf("device/%s/command", deviceID), payload)
}

// 设备影子：设置期望状态
func SetDesiredState(emqxAPI, deviceID string, desired map[string]interface{}) error {
    payload, _ := json.Marshal(map[string]interface{}{
        "method": "update",
        "state":  map[string]interface{}{"desired": desired},
    })
    return PublishMessage(emqxAPI, fmt.Sprintf("device/%s/shadow", deviceID), payload)
}
```

#### 设备认证

```
认证链（按顺序执行）：

1. X.509 证书认证（TLS 双向认证）
   - 设备内置客户端证书
   - EMQX 验证证书链
   - 适合高安全性场景

2. JWT Token 认证（备选）
   - 设备通过 HTTP API 获取 JWT
   - EMQX 验证 JWT 签名和过期时间
   - 适合资源受限的设备

3. EMQX 内置数据库（兜底）
   - ClientID + Username + Password
   - 适合开发测试
```

#### Will Message（设备离线通知）

```
设备连接时声明 Will Message：
  CONNECT Packet:
    Will Topic: sys/device/status
    Will Payload: {"device_id": "dev-001", "status": "offline"}
    Will QoS: 1
    Will Retain: true

设备异常断开 → EMQX 自动发布 Will Message
Go 服务订阅 sys/device/status → 更新设备在线状态
```

---

### 场景三：通用长连接平台

#### 多租户 Topic 隔离

```
{tenantId}/im/{userId}/inbox           → 租户级 IM
{tenantId}/device/{deviceId}/telemetry → 租户级 IoT
{tenantId}/notify/broadcast            → 租户广播

ACL 规则（EMQX 鉴权）：
  - 租户 A 的客户端只能订阅 tenantA/# 下的 Topic
  - ExHook on_client_authorize 中注入租户 ID 校验
```

#### WebSocket + MQTT 双协议接入

```
EMQX 原生支持 WebSocket 传输：

  MQTT over TCP:       端口 1883（设备、后端服务）
  MQTT over TLS:       端口 8883（加密传输）
  MQTT over WebSocket: 端口 8083（Web 浏览器）
  MQTT over WSS:       端口 8084（Web 浏览器加密）

Web 前端连接示例（MQTT.js）：
  const client = mqtt.connect('wss://emqx.example.com:8084/mqtt', {
    clientId: 'web-' + userId,
    username: userId,
    password: jwtToken
  })
```

#### 统一消息格式

```json
{
  "version": "1.0",
  "msg_id": "snowflake-id",
  "type": "im.text | im.image | iot.telemetry | notify.system",
  "from": "user-123 | device-456",
  "to": "user-789 | group-001 | broadcast",
  "payload": {},
  "timestamp": 1711756800,
  "tenant_id": "tenant-001"
}
```

---

## 认证与鉴权

### 认证链设计

```
EMQX 支持认证链，按顺序执行，命中即停止：

┌─────────────────┐
│ 1. X.509 证书    │ ← TLS 握手时自动执行，优先级最高
│    (IoT 设备)    │
└────────┬────────┘
         │ 未匹配
         ▼
┌─────────────────┐
│ 2. JWT Token    │ ← 验证签名 + 过期时间 + claims
│    (Mobile/Web) │    支持 JWKS 自动轮换
└────────┬────────┘
         │ 未匹配
         ▼
┌─────────────────┐
│ 3. Redis 查询    │ ← HGET mqtt_user:{username} password_hash
│    (缓存层)      │    高性能，适合高并发认证
└────────┬────────┘
         │ 未匹配
         ▼
┌─────────────────┐
│ 4. MySQL/PG 查询 │ ← SELECT password_hash FROM mqtt_users WHERE username = ?
│    (持久化层)    │    Redis 未命中时兜底
└─────────────────┘
```

### ACL 鉴权规则

```
EMQX ACL 规则示例（基于 Redis）：

Key: mqtt_acl:{username}
Value: [
  {"permission": "allow", "action": "subscribe", "topic": "im/${username}/inbox"},
  {"permission": "allow", "action": "publish",   "topic": "im/${username}/+"},
  {"permission": "allow", "action": "subscribe", "topic": "im/group/+/msg"},
  {"permission": "deny",  "action": "all",       "topic": "#"}
]
```

### ExHook 自定义鉴权

```go
func (s *ExHookServer) OnClientAuthorize(ctx context.Context,
    req *exhook.ClientAuthorizeRequest) (*exhook.ValuedResponse, error) {
    clientInfo := req.GetClientinfo()
    username := clientInfo.GetUsername()
    topic := req.GetTopic()
    action := req.GetType() // PUBLISH or SUBSCRIBE

    // 自定义业务逻辑：检查租户隔离
    tenantID := extractTenantID(topic)
    userTenant := s.userService.GetTenant(ctx, username)

    if tenantID != userTenant {
        return denyResponse(), nil
    }
    return allowResponse(), nil
}
```

---

## 规则引擎与数据集成

### Rule Engine SQL 语法

```sql
-- 基本语法
SELECT <fields> FROM <topic-filter> [WHERE <conditions>]

-- 示例：设备温度超过阈值时触发告警
SELECT
  clientid as device_id,
  payload.temperature as temp,
  payload.humidity as hum,
  topic,
  now_timestamp('millisecond') as ts
FROM
  "device/+/telemetry"
WHERE
  payload.temperature > 50

-- 示例：用户消息统计
SELECT
  clientid,
  topic,
  payload,
  now_timestamp('millisecond') as ts
FROM
  "im/#"

-- 系统事件：客户端连接/断开
SELECT * FROM "$events/client_connected"
SELECT * FROM "$events/client_disconnected"

-- 消息确认事件
SELECT * FROM "$events/message_acked"

-- 消息投递事件
SELECT * FROM "$events/message_delivered"
```

### 核心数据桥接配置

#### Kafka Sink

```
Connector:
  bootstrap_hosts: "kafka1:9092,kafka2:9092,kafka3:9092"
  connect_timeout: 5s
  min_metadata_refresh_interval: 3s

Rule:
  SELECT clientid, topic, payload, now_timestamp() as ts
  FROM "im/#"

Action (Kafka Sink):
  topic: im-messages
  key: ${clientid}
  value: ${payload}
  partition_strategy: key_dispatch
  compression: snappy
  max_batch_bytes: 1MB
```

#### Redis Sink

```
Connector:
  server: "redis-cluster:6379"
  pool_size: 8

Rule:
  SELECT clientid, payload FROM "device/+/telemetry"

Action (Redis Sink):
  command: HSET device:${clientid}:latest data ${payload}
```

#### ClickHouse Sink

```
Connector:
  url: "http://clickhouse:8123"
  database: iot_data
  pool_size: 8

Rule:
  SELECT clientid as device_id, payload.temp as temperature,
         payload.humidity as humidity, now_timestamp() as ts
  FROM "device/+/telemetry"

Action (ClickHouse Sink):
  sql: >
    INSERT INTO device_telemetry(device_id, temperature, humidity, created_at)
    VALUES ('${device_id}', ${temperature}, ${humidity}, now())
  batch_size: 1000
  batch_time: 1s
```

### Sink / Source 分离（v5.4.0+）

```
Sink（出站）：EMQX → 外部系统
  消息发布 → Rule Engine → Kafka/Redis/ClickHouse/HTTP

Source（入站）：外部系统 → EMQX
  Kafka/MQTT Bridge → EMQX → 发布到指定 Topic
  用途：跨集群消息同步、外部数据注入
```

---

## Go 项目目录结构

```
go-emqx-platform/
├── cmd/
│   ├── api-server/          # HTTP API 服务（用户管理、消息查询等）
│   │   └── main.go
│   ├── exhook-server/       # ExHook gRPC 服务（认证、消息拦截）
│   │   └── main.go
│   └── consumer/            # Kafka 消费者（离线消息处理、数据落库）
│       └── main.go
├── internal/
│   ├── handler/             # HTTP 路由处理器
│   │   ├── message.go       # 消息相关 API
│   │   ├── user.go          # 用户管理 API
│   │   └── device.go        # 设备管理 API
│   ├── service/             # 业务逻辑层
│   │   ├── auth.go          # 认证服务
│   │   ├── message.go       # 消息服务
│   │   ├── push.go          # 推送服务（APNs/FCM）
│   │   └── device.go        # 设备管理服务
│   ├── repository/          # 数据访问层
│   │   ├── user.go
│   │   ├── message.go
│   │   └── device.go
│   ├── mqtt/                # MQTT 客户端封装
│   │   ├── client.go        # Paho Client 封装
│   │   └── publisher.go     # EMQX REST API 推送封装
│   ├── exhook/              # ExHook gRPC 实现
│   │   ├── server.go        # gRPC Server
│   │   ├── auth_hook.go     # 认证钩子
│   │   ├── acl_hook.go      # 鉴权钩子
│   │   └── message_hook.go  # 消息钩子
│   └── consumer/            # Kafka Consumer
│       ├── im_consumer.go   # IM 消息消费
│       └── iot_consumer.go  # IoT 数据消费
├── pkg/
│   ├── auth/                # JWT 工具
│   ├── emqxapi/             # EMQX REST API Client
│   └── proto/               # ExHook gRPC proto 文件
│       └── exhook.proto
├── configs/
│   ├── config.yaml          # 应用配置
│   └── emqx.conf            # EMQX 配置模板
├── deployments/
│   ├── docker-compose.yaml  # 本地开发环境
│   └── k8s/
│       ├── emqx-operator.yaml
│       ├── emqx-cluster.yaml
│       ├── go-services.yaml
│       └── monitoring.yaml
├── scripts/
│   ├── benchmark.sh         # 压测脚本
│   └── setup-emqx.sh        # EMQX 初始化脚本
├── go.mod
└── go.sum
```

---

## 核心 Go 代码示例

### ExHook gRPC Server 完整实现

```go
package exhook

import (
    "context"
    "log"
    "net"

    pb "go-emqx-platform/pkg/proto"
    "go-emqx-platform/internal/service"
    "google.golang.org/grpc"
)

type Server struct {
    pb.UnimplementedHookProviderServer
    authSvc    *service.AuthService
    messageSvc *service.MessageService
}

func NewServer(authSvc *service.AuthService, msgSvc *service.MessageService) *Server {
    return &Server{authSvc: authSvc, messageSvc: msgSvc}
}

// 注册需要拦截的钩子
func (s *Server) OnProviderLoaded(ctx context.Context,
    req *pb.ProviderLoadedRequest) (*pb.LoadedResponse, error) {
    return &pb.LoadedResponse{
        Hooks: []*pb.HookSpec{
            {Name: "client.authenticate"},
            {Name: "client.authorize"},
            {Name: "message.publish"},
            {Name: "client.connected"},
            {Name: "client.disconnected"},
        },
    }, nil
}

// 认证：验证用户名密码或 Token
func (s *Server) OnClientAuthenticate(ctx context.Context,
    req *pb.ClientAuthenticateRequest) (*pb.ValuedResponse, error) {
    info := req.GetClientinfo()

    ok, err := s.authSvc.Verify(ctx, info.GetUsername(), string(info.GetPassword()))
    if err != nil {
        log.Printf("auth error: clientId=%s, err=%v", info.GetClientid(), err)
        return boolResponse(false), nil
    }
    return boolResponse(ok), nil
}

// 鉴权：检查 Topic 权限
func (s *Server) OnClientAuthorize(ctx context.Context,
    req *pb.ClientAuthorizeRequest) (*pb.ValuedResponse, error) {
    info := req.GetClientinfo()
    topic := req.GetTopic()
    username := info.GetUsername()

    allowed, err := s.authSvc.CheckACL(ctx, username, topic, req.GetType().String())
    if err != nil {
        log.Printf("acl error: user=%s, topic=%s, err=%v", username, topic, err)
        return boolResponse(false), nil
    }
    return boolResponse(allowed), nil
}

// 消息拦截：敏感词过滤
func (s *Server) OnMessagePublish(ctx context.Context,
    req *pb.MessagePublishRequest) (*pb.ValuedResponse, error) {
    msg := req.GetMessage()

    filtered, err := s.messageSvc.Filter(ctx, msg.GetTopic(), msg.GetPayload())
    if err != nil {
        return &pb.ValuedResponse{
            Type:  pb.ValuedResponse_STOP_AND_RETURN,
            Value: &pb.ValuedResponse_Message{Message: msg}, // 原样放行
        }, nil
    }

    if filtered.Blocked {
        // 拒绝发布
        msg.Payload = []byte(`{"error":"message blocked"}`)
        msg.Topic = "" // 空 Topic 阻止投递
    } else if filtered.Modified {
        msg.Payload = filtered.Payload
    }

    return &pb.ValuedResponse{
        Type:  pb.ValuedResponse_STOP_AND_RETURN,
        Value: &pb.ValuedResponse_Message{Message: msg},
    }, nil
}

// 连接事件：更新在线状态
func (s *Server) OnClientConnected(ctx context.Context,
    req *pb.ClientConnectedRequest) (*pb.EmptySuccess, error) {
    info := req.GetClientinfo()
    s.authSvc.SetOnline(ctx, info.GetUsername())
    return &pb.EmptySuccess{}, nil
}

func (s *Server) OnClientDisconnected(ctx context.Context,
    req *pb.ClientDisconnectedRequest) (*pb.EmptySuccess, error) {
    info := req.GetClientinfo()
    s.authSvc.SetOffline(ctx, info.GetUsername())
    return &pb.EmptySuccess{}, nil
}

func boolResponse(result bool) *pb.ValuedResponse {
    return &pb.ValuedResponse{
        Type:  pb.ValuedResponse_STOP_AND_RETURN,
        Value: &pb.ValuedResponse_BoolResult{BoolResult: result},
    }
}

func Start(addr string, srv *Server) error {
    lis, err := net.Listen("tcp", addr)
    if err != nil {
        return err
    }
    grpcServer := grpc.NewServer()
    pb.RegisterHookProviderServer(grpcServer, srv)
    log.Printf("ExHook gRPC server listening on %s", addr)
    return grpcServer.Serve(lis)
}
```

### Paho MQTT Consumer

```go
package mqtt

import (
    "log"
    "time"

    pahomqtt "github.com/eclipse/paho.mqtt.golang"
)

type Consumer struct {
    client  pahomqtt.Client
    handler MessageHandler
}

type MessageHandler func(topic string, payload []byte) error

func NewConsumer(broker, clientID string, handler MessageHandler) *Consumer {
    opts := pahomqtt.NewClientOptions().
        AddBroker(broker).
        SetClientID(clientID).
        SetCleanSession(false).
        SetAutoReconnect(true).
        SetMaxReconnectInterval(30 * time.Second).
        SetKeepAlive(60 * time.Second).
        SetOnConnectHandler(func(c pahomqtt.Client) {
            log.Println("MQTT connected, resubscribing...")
        }).
        SetConnectionLostHandler(func(c pahomqtt.Client, err error) {
            log.Printf("MQTT connection lost: %v", err)
        })

    c := &Consumer{handler: handler}
    c.client = pahomqtt.NewClient(opts)
    return c
}

func (c *Consumer) Connect() error {
    token := c.client.Connect()
    token.Wait()
    return token.Error()
}

func (c *Consumer) Subscribe(topics ...string) error {
    filters := make(map[string]byte)
    for _, t := range topics {
        filters[t] = 1 // QoS 1
    }

    token := c.client.SubscribeMultiple(filters, func(client pahomqtt.Client, msg pahomqtt.Message) {
        if err := c.handler(msg.Topic(), msg.Payload()); err != nil {
            log.Printf("handle message error: topic=%s, err=%v", msg.Topic(), err)
        }
    })
    token.Wait()
    return token.Error()
}

func (c *Consumer) Close() {
    c.client.Disconnect(5000)
}
```

### EMQX REST API 客户端

```go
package emqxapi

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type Client struct {
    baseURL  string
    apiKey   string
    secret   string
    http     *http.Client
}

func NewClient(baseURL, apiKey, secret string) *Client {
    return &Client{
        baseURL: baseURL,
        apiKey:  apiKey,
        secret:  secret,
        http:    &http.Client{Timeout: 10 * time.Second},
    }
}

type PublishRequest struct {
    Topic    string `json:"topic"`
    QoS      int    `json:"qos"`
    Payload  string `json:"payload"`
    Encoding string `json:"encoding,omitempty"` // plain | base64
    Retain   bool   `json:"retain,omitempty"`
}

// 发布单条消息
func (c *Client) Publish(req PublishRequest) error {
    return c.post("/api/v5/publish", req)
}

// 批量发布
func (c *Client) PublishBatch(reqs []PublishRequest) error {
    return c.post("/api/v5/publish/bulk", reqs)
}

// 查询在线客户端
func (c *Client) GetClient(clientID string) (*ClientInfo, error) {
    var info ClientInfo
    err := c.get(fmt.Sprintf("/api/v5/clients/%s", clientID), &info)
    return &info, err
}

// 踢出客户端
func (c *Client) KickClient(clientID string) error {
    return c.delete(fmt.Sprintf("/api/v5/clients/%s", clientID))
}

// 获取集群指标
func (c *Client) GetMetrics() (*Metrics, error) {
    var m Metrics
    err := c.get("/api/v5/metrics", &m)
    return &m, err
}

func (c *Client) post(path string, body interface{}) error {
    jsonBody, err := json.Marshal(body)
    if err != nil {
        return err
    }
    req, err := http.NewRequest("POST", c.baseURL+path, bytes.NewReader(jsonBody))
    if err != nil {
        return err
    }
    req.SetBasicAuth(c.apiKey, c.secret)
    req.Header.Set("Content-Type", "application/json")

    resp, err := c.http.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode >= 400 {
        return fmt.Errorf("EMQX API error: %d", resp.StatusCode)
    }
    return nil
}

func (c *Client) get(path string, result interface{}) error {
    req, err := http.NewRequest("GET", c.baseURL+path, nil)
    if err != nil {
        return err
    }
    req.SetBasicAuth(c.apiKey, c.secret)

    resp, err := c.http.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return json.NewDecoder(resp.Body).Decode(result)
}

func (c *Client) delete(path string) error {
    req, err := http.NewRequest("DELETE", c.baseURL+path, nil)
    if err != nil {
        return err
    }
    req.SetBasicAuth(c.apiKey, c.secret)

    resp, err := c.http.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    return nil
}

type ClientInfo struct {
    ClientID    string `json:"clientid"`
    Username    string `json:"username"`
    IPAddress   string `json:"ip_address"`
    Port        int    `json:"port"`
    ConnectedAt string `json:"connected_at"`
    Keepalive   int    `json:"keepalive"`
}

type Metrics struct {
    ConnectionsCount int64 `json:"connections.count"`
    TopicsCount      int64 `json:"topics.count"`
    MessagesReceived int64 `json:"messages.received"`
    MessagesSent     int64 `json:"messages.sent"`
}
```

---

## 部署架构

### Docker Compose 开发环境

```yaml
version: '3.8'

services:
  emqx:
    image: emqx/emqx:5.8.6
    container_name: emqx
    ports:
      - "1883:1883"     # MQTT
      - "8083:8083"     # MQTT over WebSocket
      - "8084:8084"     # MQTT over WSS
      - "8883:8883"     # MQTT over TLS
      - "18083:18083"   # EMQX Dashboard
    environment:
      EMQX_NAME: emqx
      EMQX_HOST: 127.0.0.1
      # ExHook 配置
      EMQX_EXHOOK__SERVERS__1__NAME: go-exhook
      EMQX_EXHOOK__SERVERS__1__URL: "http://exhook-server:9000"
      EMQX_EXHOOK__SERVERS__1__ENABLE: "true"
    volumes:
      - emqx-data:/opt/emqx/data
      - emqx-log:/opt/emqx/log
    healthcheck:
      test: ["CMD", "emqx", "ctl", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  exhook-server:
    build:
      context: .
      dockerfile: Dockerfile.exhook
    container_name: exhook-server
    ports:
      - "9000:9000"
    depends_on:
      - redis
      - mysql
    environment:
      REDIS_ADDR: redis:6379
      MYSQL_DSN: root:password@tcp(mysql:3306)/emqx_platform

  api-server:
    build:
      context: .
      dockerfile: Dockerfile.api
    container_name: api-server
    ports:
      - "8080:8080"
    depends_on:
      emqx:
        condition: service_healthy
    environment:
      EMQX_API: http://emqx:18083
      EMQX_BROKER: tcp://emqx:1883
      KAFKA_BROKERS: kafka:9092
      REDIS_ADDR: redis:6379

  consumer:
    build:
      context: .
      dockerfile: Dockerfile.consumer
    container_name: consumer
    depends_on:
      - kafka
      - mysql
    environment:
      KAFKA_BROKERS: kafka:9092
      MYSQL_DSN: root:password@tcp(mysql:3306)/emqx_platform

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: emqx_platform
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

  kafka:
    image: bitnami/kafka:3.7
    ports:
      - "9092:9092"
    environment:
      KAFKA_CFG_NODE_ID: 0
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 0@kafka:9093
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER

volumes:
  emqx-data:
  emqx-log:
  mysql-data:
```

### K8s 生产部署（EMQX Operator）

```yaml
# 1. 安装 EMQX Operator
# kubectl apply -f https://github.com/emqx/emqx-operator/releases/latest/download/emqx-operator-controller.yaml

# 2. EMQX 集群配置
apiVersion: apps.emqx.io/v2beta1
kind: EMQX
metadata:
  name: emqx-cluster
  namespace: emqx
spec:
  image: emqx/emqx-enterprise:5.8.6
  config:
    data: |
      listeners.tcp.default {
        bind = "0.0.0.0:1883"
        max_connections = 1024000
      }
      listeners.ws.default {
        bind = "0.0.0.0:8083"
        max_connections = 512000
      }
      exhook {
        servers = [
          {
            name = "go-exhook"
            enable = true
            url = "http://exhook-server.emqx.svc:9000"
            request_timeout = "5s"
            failed_action = "ignore"
            pool_size = 16
            auto_reconnect = "60s"
          }
        ]
      }
  coreTemplate:
    metadata:
      name: emqx-core
    spec:
      replicas: 3
      resources:
        requests:
          cpu: "4"
          memory: "8Gi"
        limits:
          cpu: "8"
          memory: "16Gi"
      volumeClaimTemplates:
        storageClassName: gp3
        resources:
          requests:
            storage: 100Gi
        accessModes:
          - ReadWriteOnce
  replicantTemplate:
    metadata:
      name: emqx-replicant
    spec:
      replicas: 3
      resources:
        requests:
          cpu: "8"
          memory: "16Gi"
        limits:
          cpu: "16"
          memory: "32Gi"

---
# 3. Replicant HPA 自动扩缩
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: emqx-replicant-hpa
  namespace: emqx
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: emqx-cluster-replicant
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 75
```

---

## 性能基准与容量规划

### EMQX 性能基准

| 指标 | 数值 | 条件 |
|---|---|---|
| 单节点最大连接数 | **5,000,000** | 64C128G，QoS 0 |
| 单节点最大吞吐 | **2,000,000 msg/s** | 64C128G，128B payload |
| 集群最大连接数 | **100,000,000** | 23 节点（3 Core + 20 Replicant） |
| 每连接内存 | **~14-17 KB** | 含 TCP 缓冲区 + Session |
| 连接建立速率 | **~20,000/s** | 含认证 |
| 端到端延迟（单节点） | **~2.93 ms** | QoS 0 |
| 端到端延迟（集群） | **<5 ms P99** | QoS 0，跨节点 |

### 百万连接容量估算

```
目标：1,000,000 并发连接

EMQX 集群规划：
  Core 节点: 3 台 × (8C, 16GB)
  Replicant 节点: 6 台 × (16C, 32GB)
  每 Replicant 承载: ~170,000 连接

内存估算：
  每连接: ~16 KB
  100 万连接: ~16 GB（分布在 6 个 Replicant 上，每节点 ~2.7 GB）
  含 EMQX 运行时开销: 每节点总计 ~8 GB

文件描述符：
  每 Replicant: ulimit -n 500000
  每 Core: ulimit -n 100000

网络带宽估算（假设 10 msg/s，1 KB/msg）：
  入站: 1M × 10 × 1KB = 10 GB/s（扇入后再扇出到订阅者）
  实际取决于订阅关系，1:1 私聊场景约 2× 入站
```

### Linux 内核调优

```bash
# /etc/sysctl.conf

# 文件描述符
fs.file-max = 2097152
fs.nr_open = 2097152

# TCP 连接数
net.core.somaxconn = 32768
net.ipv4.tcp_max_syn_backlog = 16384
net.core.netdev_max_backlog = 16384

# TCP 缓冲区（百万连接场景需要减小默认值）
net.core.rmem_default = 4096
net.core.wmem_default = 4096
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 1024 4096 16777216
net.ipv4.tcp_wmem = 1024 4096 16777216
net.ipv4.tcp_mem = 786432 1048576 1572864

# TCP 优化
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_tw_buckets = 1048576

# 端口范围
net.ipv4.ip_local_port_range = 1024 65535
```

### 部署规模参考

| 连接数 | Core | Replicant | Go 服务实例 | Kafka Partition |
|---|---|---|---|---|
| 10 万 | 1 节点 | 1 节点 | 2 实例 | 6 |
| 50 万 | 3 节点 | 3 节点 | 4 实例 | 12 |
| 100 万 | 3 节点 | 6 节点 | 6 实例 | 24 |
| 500 万 | 3 节点 | 12 节点 | 12 实例 | 48 |

---

## 监控体系

### EMQX 指标采集

```
EMQX Prometheus 端点（Pull 模式，推荐）：

1. /api/v5/prometheus/stats      ← 基础指标（无需认证）
   连接数、Topic 数、消息收发、订阅数等

2. /api/v5/prometheus/auth       ← 认证指标
   认证成功/失败次数、延迟分布

3. /api/v5/prometheus/data_integration ← 数据集成指标
   Rule Engine 命中数、Sink 写入速率、错误率
```

### Prometheus 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'emqx'
    metrics_path: /api/v5/prometheus/stats
    static_configs:
      - targets:
        - emqx-core-1:18083
        - emqx-core-2:18083
        - emqx-core-3:18083
        - emqx-replicant-1:18083
        - emqx-replicant-2:18083
        - emqx-replicant-3:18083
    scrape_interval: 15s

  - job_name: 'emqx-auth'
    metrics_path: /api/v5/prometheus/auth
    basic_auth:
      username: admin
      password: your-api-key
    static_configs:
      - targets: ['emqx-core-1:18083']

  - job_name: 'go-services'
    static_configs:
      - targets:
        - api-server:2112
        - exhook-server:2112
        - consumer:2112
```

### 核心监控指标

| 分类 | 指标 | 告警阈值 |
|---|---|---|
| **连接** | emqx_connections_count | >800,000（百万容量 80%） |
| **连接** | emqx_live_connections_count | 与 connections_count 偏差 >5% |
| **消息** | emqx_messages_received / emqx_messages_sent | 下降 >30% |
| **消息** | emqx_messages_dropped | >0 且持续增长 |
| **订阅** | emqx_suboptions_count | >5,000,000 |
| **系统** | emqx_vm_used_memory | >80% 节点内存 |
| **系统** | emqx_vm_process_count | >500,000 |
| **Rule Engine** | emqx_rule_matched | 与预期消息量偏差 >20% |
| **Rule Engine** | emqx_rule_failed | >0 |
| **ExHook** | gRPC 延迟 P99 | >50 ms |
| **ExHook** | gRPC 错误率 | >1% |

### Grafana Dashboard

```
EMQX 官方 Grafana Dashboard:
  Template ID: 15012
  导入方式: Grafana → Import → 输入 15012

自定义 Dashboard 需包含：
  1. 集群总览面板（连接数、消息速率、节点状态）
  2. 单节点详情（CPU、内存、Erlang 进程数、GC 频率）
  3. Rule Engine 面板（规则命中率、Sink 延迟、错误率）
  4. Go 服务面板（QPS、延迟、错误率、Goroutine 数）
```

---

## 分阶段实施计划

### Phase 1：单节点 + Go ExHook + 基础 IM（1-2 周）

**目标：** 跑通 EMQX + Go 核心链路，验证 ExHook 可行性。

| 任务 | 输出 |
|---|---|
| Docker Compose 搭建 EMQX + Redis + MySQL | `deployments/docker-compose.yaml` |
| 实现 ExHook gRPC Server（认证 + 鉴权） | `internal/exhook/` |
| 实现基础 IM Topic 设计和消息流转 | Topic 文档 |
| 实现 API Server（用户注册、登录、获取 Token） | `cmd/api-server/` |
| EMQX Dashboard 配置 Rule Engine → Redis | EMQX 配置 |

**验收标准：**
- 两个用户通过 MQTT 客户端完成私聊消息收发
- ExHook 认证拦截工作正常
- 未读消息计数通过 Rule Engine 写入 Redis

### Phase 2：Rule Engine + Kafka + IoT 场景（1-2 周）

**目标：** 打通数据集成链路，支持 IoT 设备接入。

| 任务 | 输出 |
|---|---|
| 配置 Rule Engine → Kafka Sink | EMQX Rule 配置 |
| 实现 Kafka Consumer（消息持久化） | `cmd/consumer/` |
| 实现 IoT Topic 设计和数据上报链路 | Topic 文档 |
| 配置 Rule Engine → ClickHouse Sink | EMQX Rule 配置 |
| 实现设备管理 API（注册、指令下发） | `internal/handler/device.go` |
| 实现 EMQX REST API 客户端 | `pkg/emqxapi/` |

**验收标准：**
- IoT 设备数据通过 Rule Engine 写入 ClickHouse
- Go 服务通过 REST API 向设备下发指令
- Kafka 消息消费和持久化链路正常

### Phase 3：EMQX 集群 + K8s 部署 + 高可用（1-2 周）

**目标：** 部署生产级 EMQX 集群，验证高可用。

| 任务 | 输出 |
|---|---|
| 安装 EMQX Operator | K8s 资源文件 |
| 部署 3 Core + 3 Replicant 集群 | `deployments/k8s/emqx-cluster.yaml` |
| 配置 Replicant HPA 自动扩缩 | `deployments/k8s/hpa.yaml` |
| 部署 Go 微服务到 K8s | `deployments/k8s/go-services.yaml` |
| 配置 Prometheus + Grafana 监控 | `deployments/k8s/monitoring.yaml` |
| Session 持久化配置 | EMQX 配置 |

**验收标准：**
- 杀掉一个 Replicant 后，客户端 5s 内重连到其他节点
- HPA 在 CPU >70% 时自动扩容 Replicant
- Grafana Dashboard 展示集群全貌

### Phase 4：百万连接压测 + 监控 + 生产化（1-2 周）

**目标：** 百万连接压测通过，监控告警完备。

| 任务 | 输出 |
|---|---|
| Linux 内核参数调优 | sysctl.conf |
| EMQX 连接参数调优 | EMQX 配置 |
| 百万连接压测（emqtt-bench） | 压测报告 |
| 告警规则配置 | Prometheus AlertManager |
| 故障注入演练（杀 Core / 杀 Replicant / 网络分区） | 演练报告 |
| 文档整理和运维手册 | 运维手册 |

**验收标准：**
- 6 Replicant 节点承载 100 万连接
- 单节点内存 <16 GB
- 节点故障后 10s 内客户端恢复连接
- 消息端到端延迟 P99 <10 ms

---

## 风险评估

| 风险 | 等级 | 描述 | 缓解措施 |
|---|---|---|---|
| **EMQX 许可证** | 🔴 高 | v5.9.0+ 采用 BSL 1.1，集群（>1 节点）需要 License Key | 使用 v5.8.x 开源版；或申请商业 License；或评估 EMQX Cloud |
| **Erlang 运维门槛** | 🟡 中 | Erlang/OTP 运行时调优和故障排查需要专门知识 | 依赖 EMQX Dashboard + Prometheus 监控；建立 Erlang 运维知识库 |
| **ExHook gRPC 延迟** | 🟡 中 | ExHook 在连接认证路径上，gRPC 延迟直接影响连接速率 | ExHook Server 与 EMQX 同机房部署；gRPC 连接池；认证结果缓存 |
| **Core 节点故障** | 🟡 中 | Core 节点宕机影响写入（路由表更新、Session 创建） | 3 Core 节点容忍 1 个故障；Core 使用持久化存储；自动故障转移 |
| **Topic 爆炸** | 🟡 中 | IoT 场景每设备独立 Topic，百万设备 = 百万 Topic | 监控 Topic 数量；设置 Topic 上限；定期清理无订阅 Topic |
| **惊群效应** | 🟡 中 | Replicant 节点宕机后客户端集中重连 | 客户端指数退避 + 随机抖动；LB 限流新连接速率 |
| **Rule Engine 性能** | 🟠 低 | 复杂 SQL 规则在高吞吐下可能成为瓶颈 | 简化 Rule SQL；分拆高频和低频规则；监控规则执行延迟 |

---

## 与自研网关方案对比总结

| 维度 | 自研网关（Go + epoll） | EMQX 平台（Go + EMQX） | 胜出 |
|---|---|---|---|
| **上线速度** | 3-6 个月 | 1-2 个月 | EMQX |
| **MQTT 完整度** | 需逐步实现 | 完整 MQTT 3.1.1 / 5.0 | EMQX |
| **数据集成** | 需自建 | 50+ 原生 Connector | EMQX |
| **性能极限** | Go epoll 可做到极致 | 单节点 5M 连接 | 自研（略优） |
| **内存效率** | ~14 KB/conn（Go 优化后） | ~14-17 KB/conn | 自研（略优） |
| **定制灵活性** | 完全可控 | ExHook + Rule Engine | 自研 |
| **运维复杂度** | Go 二进制，团队熟悉 | Erlang/OTP，需学习曲线 | 自研 |
| **团队要求** | 网络编程 + 协议经验 | 业务开发为主 | EMQX |
| **社区生态** | 自维护 | 活跃社区 + 商业支持 | EMQX |

**总结：**

- 如果团队以业务开发为主，且需要快速上线 → **选 EMQX**
- 如果团队有深厚的网络编程经验，且对性能和定制有极致要求 → **选自研网关**
- 两者不互斥：可以先用 EMQX 快速验证业务，后期按需将热点路径替换为自研组件

---

## 参考资源

| 资源 | 说明 |
|---|---|
| [EMQX 官方文档](https://docs.emqx.com/en/emqx/latest/) | 最权威的配置和 API 参考 |
| [EMQX GitHub](https://github.com/emqx/emqx) | 源码和 Issue 追踪 |
| [EMQX 100M 连接博客](https://www.emqx.com/en/blog/how-emqx-5-0-achieves-100-million-mqtt-connections) | 1 亿连接基准测试详解 |
| [EMQX 5M 单节点](https://www.emqx.com/en/blog/emqx-single-node-supports-5m-connections) | 单节点性能基准 |
| [EMQX Operator](https://github.com/emqx/emqx-operator) | K8s 部署最佳实践 |
| [ExHook Proto](https://github.com/emqx/emqx/blob/master/apps/emqx_exhook/priv/protos/exhook.proto) | gRPC 接口定义 |
| [eclipse/paho.mqtt.golang](https://github.com/eclipse/paho.mqtt.golang) | Go MQTT 客户端库 |
| [emqtt-bench](https://github.com/emqx/emqtt-bench) | MQTT 压测工具 |
| [Grafana Dashboard 15012](https://grafana.com/grafana/dashboards/15012) | EMQX Grafana 监控模板 |
| [自研网关方案](/architecture/go-million-connection-gateway-design) | 本知识库自研网关架构文档 |

---

## 高频问题

### 为什么选 EMQX 而不是 Mosquitto 或 VerneMQ？

| Broker | 语言 | 集群 | 单节点连接 | Rule Engine | 数据集成 |
|---|---|---|---|---|---|
| **EMQX** | Erlang | Core-Replicant | 5M | SQL-based | 50+ Connector |
| Mosquitto | C | 不支持原生集群 | ~10 万 | 无 | 无 |
| VerneMQ | Erlang | 支持 | ~50 万 | 有限 | 有限 |
| HiveMQ | Java | 支持 | ~数百万 | 有限 | 扩展机制 |

EMQX 在集群能力、数据集成和生态完整度上显著领先，是百万级连接场景的首选。

### ExHook 延迟会不会成为瓶颈？

ExHook 是同步调用（EMQX 等待 gRPC 响应），关键路径上的延迟直接影响：

- **认证**：每个新连接都会触发，建议 P99 <10 ms
- **消息发布**：每条消息都会触发，建议 P99 <5 ms

缓解策略：
1. ExHook Server 与 EMQX 同节点或同机房部署
2. gRPC 连接池，避免频繁建连
3. 认证结果在 Go 侧用 Redis 缓存，减少数据库查询
4. 消息过滤规则尽量简单，重逻辑放到 Kafka 异步处理

### EMQX 集群需要 License 吗？

- **v5.8.x 及以下**：Apache 2.0 开源，集群免费
- **v5.9.0+**：BSL 1.1，单节点免费，集群（>1 节点）需要 License
- **EMQX Enterprise**：商业版，附加企业级功能
- **EMQX Cloud**：全托管服务，按连接数计费

建议：生产环境先用 v5.8.x 开源版，评估后再决定是否升级到商业版。

### 如何从自研网关迁移到 EMQX？

1. **并行运行**：EMQX 和自研网关同时接受连接，通过 LB 按比例分流
2. **Topic 兼容**：EMQX Topic 设计与自研网关保持一致，或通过 Rule Engine 做 Topic 映射
3. **认证兼容**：ExHook 对接同一套认证服务
4. **灰度切换**：逐步增加 EMQX 流量比例，观察指标
5. **完全切换**：所有流量切到 EMQX，下线自研网关

### 群聊万人大群怎么处理？

普通 Topic 广播在万人群场景下，EMQX 需要向 10,000 个订阅者逐一投递，可能造成延迟尖峰。

推荐方案：
1. 群成员 <500：直接用 Topic 广播（`im/group/{groupId}/msg`）
2. 群成员 500-10,000：共享订阅 + Go 服务分批推送
3. 群成员 >10,000：消息写入 Kafka → Go 服务按在线状态分批推送 + APNs/FCM 离线推送
