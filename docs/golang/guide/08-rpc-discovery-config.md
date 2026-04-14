---
title: RPC、注册发现与配置
description: Go 微服务通信基础专题，涵盖 gRPC、Protobuf、服务注册发现和配置中心。
search: false
---

# 微服务与分布式：RPC、注册发现与配置

[返回总览](./08-microservices-distributed)

## 适合人群

- 想先搭起微服务通信和基础设施认知
- 需要理解 RPC、注册中心、配置中心在 Go 项目中的落地方式

## 快速导航

- [1. gRPC 原理与实践](#_1-grpc-原理与实践)
- [2. Protobuf](#_2-protobuf)
- [3. 服务注册与发现](#_3-服务注册与发现)
- [4. 配置中心](#_4-配置中心)

## 1. gRPC 原理与实践

gRPC 是 Google 开源的高性能 RPC 框架，基于 HTTP/2 和 Protobuf，广泛用于微服务间通信。

### 1.1 Protobuf 服务定义

::: details 点击展开代码：1.1 Protobuf 服务定义
```protobuf
// user.proto
syntax = "proto3";

package user;
option go_package = "pb/user";

service UserService {
  // 一元 RPC
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  // 服务端流
  rpc ListUsers(ListUsersRequest) returns (stream User);
  // 客户端流
  rpc UploadAvatar(stream AvatarChunk) returns (UploadResponse);
  // 双向流
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest {
  int64 id = 1;
}

message GetUserResponse {
  User user = 1;
}

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
}

message ListUsersRequest {
  int32 page_size = 1;
}

message AvatarChunk {
  bytes data = 1;
}

message UploadResponse {
  string url = 1;
}

message ChatMessage {
  string content = 1;
  int64 timestamp = 2;
}
```
:::

### 1.2 服务端实现

::: details 点击展开代码：1.2 服务端实现
```go
package main

import (
    "context"
    "fmt"
    "log"
    "net"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"

    pb "yourmodule/pb/user"
)

// server 实现 UserServiceServer 接口
type server struct {
    pb.UnimplementedUserServiceServer
}

func (s *server) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    if req.Id <= 0 {
        return nil, status.Errorf(codes.InvalidArgument, "invalid user id: %d", req.Id)
    }

    // 模拟数据库查询
    user := &pb.User{
        Id:    req.Id,
        Name:  "Alice",
        Email: "alice@example.com",
    }
    return &pb.GetUserResponse{User: user}, nil
}

// 服务端流式 RPC
func (s *server) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    users := []*pb.User{
        {Id: 1, Name: "Alice", Email: "alice@example.com"},
        {Id: 2, Name: "Bob", Email: "bob@example.com"},
        {Id: 3, Name: "Charlie", Email: "charlie@example.com"},
    }

    for _, u := range users {
        if err := stream.Send(u); err != nil {
            return err
        }
        time.Sleep(500 * time.Millisecond) // 模拟逐条发送
    }
    return nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer()
    pb.RegisterUserServiceServer(s, &server{})

    log.Println("gRPC server listening on :50051")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```
:::

### 1.3 客户端调用

::: details 点击展开代码：1.3 客户端调用
```go
package main

import (
    "context"
    "io"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"

    pb "yourmodule/pb/user"
)

func main() {
    conn, err := grpc.Dial("localhost:50051",
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatalf("failed to connect: %v", err)
    }
    defer conn.Close()

    client := pb.NewUserServiceClient(conn)

    // 一元调用
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: 1})
    if err != nil {
        log.Fatalf("GetUser failed: %v", err)
    }
    log.Printf("User: %v", resp.User)

    // 服务端流调用
    stream, err := client.ListUsers(ctx, &pb.ListUsersRequest{PageSize: 10})
    if err != nil {
        log.Fatalf("ListUsers failed: %v", err)
    }

    for {
        user, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatalf("stream recv error: %v", err)
        }
        log.Printf("Received user: %v", user)
    }
}
```
:::

### 1.4 拦截器（Interceptor）

::: details 点击展开代码：1.4 拦截器（Interceptor）
```go
// 一元拦截器：日志 + 耗时统计
func loggingUnaryInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    log.Printf("[gRPC] method=%s start", info.FullMethod)

    resp, err := handler(ctx, req)

    duration := time.Since(start)
    code := codes.OK
    if err != nil {
        code = status.Code(err)
    }
    log.Printf("[gRPC] method=%s duration=%v code=%s", info.FullMethod, duration, code)

    return resp, err
}

// 流式拦截器
func loggingStreamInterceptor(
    srv interface{},
    ss grpc.ServerStream,
    info *grpc.StreamServerInfo,
    handler grpc.StreamHandler,
) error {
    log.Printf("[gRPC Stream] method=%s start", info.FullMethod)
    err := handler(srv, ss)
    log.Printf("[gRPC Stream] method=%s done, err=%v", info.FullMethod, err)
    return err
}

// 注册拦截器
func newGRPCServer() *grpc.Server {
    return grpc.NewServer(
        grpc.UnaryInterceptor(loggingUnaryInterceptor),
        grpc.StreamInterceptor(loggingStreamInterceptor),
    )
}
```
:::

<GoMicroserviceDiagram kind="grpc-request-lifecycle" />

### 讲解重点

- **gRPC 四种模式**：一元（Unary）、服务端流（Server Streaming）、客户端流（Client Streaming）、双向流（Bidirectional Streaming），按业务需要选择。
- **拦截器链**：拦截器是 gRPC 中间件机制，常用于日志、鉴权、限流、链路追踪注入。生产中推荐使用 `grpc-middleware` 库组合多个拦截器。
- **错误处理**：gRPC 使用 `status.Errorf` + `codes.Code`，不要直接返回 Go 原生 error，否则客户端无法正确解析错误类型。

---

## 2. Protobuf

Protocol Buffers（Protobuf）是 Google 的高效序列化协议，是 gRPC 的默认数据格式。

### 2.1 Proto3 核心语法

::: details 点击展开代码：2.1 Proto3 核心语法
```protobuf
syntax = "proto3";

package order;
option go_package = "pb/order";

import "google/protobuf/timestamp.proto";

// 枚举类型
enum OrderStatus {
  ORDER_STATUS_UNSPECIFIED = 0;  // 必须有零值
  ORDER_STATUS_PENDING = 1;
  ORDER_STATUS_PAID = 2;
  ORDER_STATUS_SHIPPED = 3;
  ORDER_STATUS_CANCELLED = 4;
}

// 消息定义
message Order {
  int64 id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;       // 列表
  OrderStatus status = 4;
  google.protobuf.Timestamp created_at = 5;

  // oneof：互斥字段，同一时间只有一个有值
  oneof payment {
    CreditCard credit_card = 10;
    BankTransfer bank_transfer = 11;
    WeChatPay wechat_pay = 12;
  }

  map<string, string> metadata = 15;  // map 类型
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
  double price = 3;                   // 浮点数用 double
}

message CreditCard {
  string card_number = 1;
  string expiry = 2;
}

message BankTransfer {
  string bank_name = 1;
  string account = 2;
}

message WeChatPay {
  string open_id = 1;
}
```
:::

### 2.2 代码生成

::: details 点击展开代码：2.2 代码生成
```bash
# 安装工具
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 生成 Go 代码
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/order.proto
```
:::

### 2.3 在 Go 中使用生成的代码

::: details 点击展开代码：2.3 在 Go 中使用生成的代码
```go
package main

import (
    "fmt"
    "log"

    "google.golang.org/protobuf/encoding/protojson"
    "google.golang.org/protobuf/proto"
    "google.golang.org/protobuf/types/known/timestamppb"

    pb "yourmodule/pb/order"
)

func main() {
    order := &pb.Order{
        Id:     1001,
        UserId: "u_123",
        Items: []*pb.OrderItem{
            {ProductId: "p_1", Quantity: 2, Price: 29.99},
            {ProductId: "p_2", Quantity: 1, Price: 59.99},
        },
        Status:    pb.OrderStatus_ORDER_STATUS_PENDING,
        CreatedAt: timestamppb.Now(),
        Payment: &pb.Order_WechatPay{
            WechatPay: &pb.WeChatPay{OpenId: "wx_abc123"},
        },
        Metadata: map[string]string{
            "source": "mobile_app",
        },
    }

    // 二进制序列化
    data, err := proto.Marshal(order)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Binary size: %d bytes\n", len(data))

    // 反序列化
    var decoded pb.Order
    if err := proto.Unmarshal(data, &decoded); err != nil {
        log.Fatal(err)
    }

    // JSON 序列化（调试/API 网关常用）
    jsonData, _ := protojson.Marshal(order)
    fmt.Printf("JSON: %s\n", jsonData)

    // oneof 类型判断
    switch p := order.Payment.(type) {
    case *pb.Order_CreditCard:
        fmt.Println("Credit card:", p.CreditCard.CardNumber)
    case *pb.Order_WechatPay:
        fmt.Println("WeChat pay:", p.WechatPay.OpenId)
    default:
        fmt.Println("Unknown payment method")
    }
}
```
:::

<GoMicroserviceDiagram kind="protobuf-codegen" />

### 讲解重点

- **字段编号不可更改**：Protobuf 的字段编号一旦分配就不能修改或复用，删除字段应用 `reserved` 标记。这是向后兼容的核心机制。
- **oneof 的使用场景**：当多种类型互斥时使用 oneof（如支付方式），Go 中生成为 interface 类型，通过 type switch 判断。
- **JSON 与 Binary 双模式**：`protojson` 用于 HTTP 网关或调试场景，`proto.Marshal` 用于高性能 RPC 通信，两者性能差异显著。

---

## 3. 服务注册与发现

服务注册与发现是微服务架构的基石，解决"如何找到目标服务实例"的问题。

### 3.1 核心概念

```
┌──────────────┐     注册      ┌─────────────────┐
│  Service A   │ ──────────>  │  Registry        │
│  (Provider)  │              │  (etcd/Consul)   │
│  :8081       │ <──────────  │                  │
└──────────────┘    健康检查   └─────────────────┘
                                      │
                                      │ 发现
                                      ▼
                              ┌──────────────┐
                              │  Service B   │
                              │  (Consumer)  │
                              └──────────────┘
```

### 3.2 基于 etcd 的服务注册

::: details 点击展开代码：3.2 基于 etcd 的服务注册
```go
package registry

import (
    "context"
    "fmt"
    "log"
    "time"

    clientv3 "go.etcd.io/etcd/client/v3"
)

type ServiceRegistry struct {
    client  *clientv3.Client
    leaseID clientv3.LeaseID
    prefix  string
}

func NewServiceRegistry(endpoints []string, prefix string) (*ServiceRegistry, error) {
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        return nil, fmt.Errorf("connect etcd: %w", err)
    }
    return &ServiceRegistry{client: client, prefix: prefix}, nil
}

// Register 注册服务并自动续约
func (r *ServiceRegistry) Register(ctx context.Context, serviceName, addr string, ttl int64) error {
    // 创建租约
    lease, err := r.client.Grant(ctx, ttl)
    if err != nil {
        return fmt.Errorf("grant lease: %w", err)
    }
    r.leaseID = lease.ID

    // 注册 key: /services/user-service/192.168.1.10:8081
    key := fmt.Sprintf("%s/%s/%s", r.prefix, serviceName, addr)
    _, err = r.client.Put(ctx, key, addr, clientv3.WithLease(lease.ID))
    if err != nil {
        return fmt.Errorf("put key: %w", err)
    }

    // 自动续约（KeepAlive）
    ch, err := r.client.KeepAlive(ctx, lease.ID)
    if err != nil {
        return fmt.Errorf("keep alive: %w", err)
    }

    // 消费续约响应，防止 channel 阻塞
    go func() {
        for {
            select {
            case resp, ok := <-ch:
                if !ok {
                    log.Println("keepalive channel closed, re-registering...")
                    return
                }
                _ = resp
            case <-ctx.Done():
                return
            }
        }
    }()

    log.Printf("service registered: %s -> %s (lease=%d)", key, addr, lease.ID)
    return nil
}

// Deregister 注销服务
func (r *ServiceRegistry) Deregister(ctx context.Context, serviceName, addr string) error {
    key := fmt.Sprintf("%s/%s/%s", r.prefix, serviceName, addr)
    _, err := r.client.Delete(ctx, key)
    if err != nil {
        return fmt.Errorf("delete key: %w", err)
    }

    // 撤销租约
    if r.leaseID != 0 {
        r.client.Revoke(ctx, r.leaseID)
    }
    return nil
}
```
:::

<GoMicroserviceDiagram kind="service-registry" />

### 3.3 服务发现与 Watch

::: details 点击展开代码：3.3 服务发现与 Watch
```go
package registry

import (
    "context"
    "fmt"
    "log"
    "sync"

    clientv3 "go.etcd.io/etcd/client/v3"
)

type ServiceDiscovery struct {
    client *clientv3.Client
    prefix string

    mu       sync.RWMutex
    services map[string][]string // serviceName -> []addr
}

func NewServiceDiscovery(client *clientv3.Client, prefix string) *ServiceDiscovery {
    return &ServiceDiscovery{
        client:   client,
        prefix:   prefix,
        services: make(map[string][]string),
    }
}

// Discover 获取某个服务的所有实例地址
func (d *ServiceDiscovery) Discover(ctx context.Context, serviceName string) ([]string, error) {
    key := fmt.Sprintf("%s/%s/", d.prefix, serviceName)

    resp, err := d.client.Get(ctx, key, clientv3.WithPrefix())
    if err != nil {
        return nil, fmt.Errorf("get services: %w", err)
    }

    addrs := make([]string, 0, len(resp.Kvs))
    for _, kv := range resp.Kvs {
        addrs = append(addrs, string(kv.Value))
    }

    d.mu.Lock()
    d.services[serviceName] = addrs
    d.mu.Unlock()

    return addrs, nil
}

// Watch 监听服务变更
func (d *ServiceDiscovery) Watch(ctx context.Context, serviceName string) {
    key := fmt.Sprintf("%s/%s/", d.prefix, serviceName)
    watchCh := d.client.Watch(ctx, key, clientv3.WithPrefix())

    for resp := range watchCh {
        for _, event := range resp.Events {
            switch event.Type {
            case clientv3.EventTypePut:
                log.Printf("service added: %s -> %s", event.Kv.Key, event.Kv.Value)
            case clientv3.EventTypeDelete:
                log.Printf("service removed: %s", event.Kv.Key)
            }
        }

        // 重新拉取完整列表
        d.Discover(ctx, serviceName)
    }
}
```
:::

<GoMicroserviceDiagram kind="service-discovery-watch" />

### 讲解重点

- **租约与 TTL**：注册时绑定 Lease，服务挂掉后 Lease 过期，key 自动删除，实现"被动健康检查"。KeepAlive 保持心跳续约。
- **Watch 机制**：消费者通过 Watch 实时感知服务上下线，避免定时轮询的延迟和开销。etcd 的 Watch 基于 Revision，不会丢失事件。
- **多注册中心选型**：etcd 适合 K8s 生态；Consul 自带健康检查和 DNS 接口；Nacos 在阿里系使用广泛。选型取决于团队技术栈。

---

## 4. 配置中心

配置中心实现配置的集中管理和动态更新，避免每次修改配置都需要重启服务。

### 4.1 基于 etcd 的动态配置

::: details 点击展开代码：4.1 基于 etcd 的动态配置
```go
package config

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "sync"
    "time"

    clientv3 "go.etcd.io/etcd/client/v3"
)

// AppConfig 应用配置结构
type AppConfig struct {
    Database struct {
        Host     string `json:"host"`
        Port     int    `json:"port"`
        MaxConns int    `json:"max_conns"`
    } `json:"database"`
    Redis struct {
        Addr     string `json:"addr"`
        Password string `json:"password"`
    } `json:"redis"`
    Feature struct {
        EnableNewUI    bool `json:"enable_new_ui"`
        MaxUploadSize  int  `json:"max_upload_size"`
    } `json:"feature"`
}

// ConfigCenter 配置中心客户端
type ConfigCenter struct {
    client    *clientv3.Client
    configKey string

    mu     sync.RWMutex
    config *AppConfig

    onChange []func(*AppConfig)
}

func NewConfigCenter(endpoints []string, configKey string) (*ConfigCenter, error) {
    client, err := clientv3.New(clientv3.Config{
        Endpoints:   endpoints,
        DialTimeout: 5 * time.Second,
    })
    if err != nil {
        return nil, err
    }

    cc := &ConfigCenter{
        client:    client,
        configKey: configKey,
        config:    &AppConfig{},
    }
    return cc, nil
}

// Load 首次加载配置
func (cc *ConfigCenter) Load(ctx context.Context) error {
    resp, err := cc.client.Get(ctx, cc.configKey)
    if err != nil {
        return fmt.Errorf("get config: %w", err)
    }
    if len(resp.Kvs) == 0 {
        return fmt.Errorf("config key not found: %s", cc.configKey)
    }

    return cc.updateConfig(resp.Kvs[0].Value)
}

func (cc *ConfigCenter) updateConfig(data []byte) error {
    var newConfig AppConfig
    if err := json.Unmarshal(data, &newConfig); err != nil {
        return fmt.Errorf("unmarshal config: %w", err)
    }

    cc.mu.Lock()
    cc.config = &newConfig
    cc.mu.Unlock()

    // 通知所有监听者
    for _, fn := range cc.onChange {
        fn(&newConfig)
    }

    return nil
}

// Watch 监听配置变更（热更新）
func (cc *ConfigCenter) Watch(ctx context.Context) {
    watchCh := cc.client.Watch(ctx, cc.configKey)

    for resp := range watchCh {
        for _, event := range resp.Events {
            if event.Type == clientv3.EventTypePut {
                log.Println("config changed, reloading...")
                if err := cc.updateConfig(event.Kv.Value); err != nil {
                    log.Printf("reload config error: %v", err)
                }
            }
        }
    }
}

// Get 获取当前配置（线程安全）
func (cc *ConfigCenter) Get() *AppConfig {
    cc.mu.RLock()
    defer cc.mu.RUnlock()
    return cc.config
}

// OnChange 注册配置变更回调
func (cc *ConfigCenter) OnChange(fn func(*AppConfig)) {
    cc.onChange = append(cc.onChange, fn)
}
```
:::

### 4.2 使用示例

::: details 点击展开代码：4.2 使用示例
```go
func main() {
    cc, err := NewConfigCenter(
        []string{"localhost:2379"},
        "/config/myapp/production",
    )
    if err != nil {
        log.Fatal(err)
    }

    ctx := context.Background()

    // 首次加载
    if err := cc.Load(ctx); err != nil {
        log.Fatal(err)
    }

    // 注册变更回调
    cc.OnChange(func(cfg *AppConfig) {
        log.Printf("database max_conns changed to: %d", cfg.Database.MaxConns)
        // 可以在这里重建连接池等
    })

    // 后台 Watch
    go cc.Watch(ctx)

    // 业务代码使用配置
    cfg := cc.Get()
    log.Printf("DB host: %s, Feature enabled: %v",
        cfg.Database.Host, cfg.Feature.EnableNewUI)

    // 阻塞主线程
    select {}
}
```
:::

<GoMicroserviceDiagram kind="config-hot-reload" />

### 讲解重点

- **读写分离保护**：配置对象使用 RWMutex 保护，多 goroutine 安全读取。更新时替换整个指针，而非逐字段修改，避免读到半更新状态。
- **热更新边界**：不是所有配置都适合热更新。数据库连接池大小可以热更，但端口号变更需要重启。设计时应区分"可热更配置"和"启动时配置"。
- **配置中心选型**：etcd 轻量适合 K8s 环境；Apollo 有完善的灰度发布和审计功能；Nacos 同时支持配置和注册发现。

延伸阅读：如果你想把 `etcd` 本身单独系统梳理，而不是只停留在注册发现用法，可以继续看 [etcd 专题](/etcd/)。
