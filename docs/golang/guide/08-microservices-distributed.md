# 微服务与分布式

## 适合人群

- 已有 Go Web 开发经验，想系统学习微服务架构与分布式设计
- 需要在生产环境中构建高可用、可观测的分布式系统
- 希望掌握服务治理、容错、消息驱动等核心能力

## 学习目标

- 掌握 gRPC + Protobuf 的服务通信方式
- 理解服务注册发现、配置中心、链路追踪等基础设施
- 能设计和实现熔断、限流、重试、幂等等容错机制
- 了解分布式事务、消息队列、高可用架构设计

## 快速导航

- [1. gRPC 原理与实践](#_1-grpc-原理与实践)
- [2. Protobuf](#_2-protobuf)
- [3. 服务注册与发现](#_3-服务注册与发现)
- [4. 配置中心](#_4-配置中心)
- [5. 链路追踪](#_5-链路追踪)
- [6. 熔断、限流、降级](#_6-熔断、限流、降级)
- [7. 幂等设计](#_7-幂等设计)
- [8. 重试策略](#_8-重试策略)
- [9. 消息队列](#_9-消息队列)
- [10. 分布式事务](#_10-分布式事务)
- [11. 服务治理](#_11-服务治理)
- [12. 高可用设计](#_12-高可用设计)

---

## 1. gRPC 原理与实践

gRPC 是 Google 开源的高性能 RPC 框架，基于 HTTP/2 和 Protobuf，广泛用于微服务间通信。

### 1.1 Protobuf 服务定义

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

### 1.2 服务端实现

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

### 1.3 客户端调用

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

### 1.4 拦截器（Interceptor）

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

### 讲解重点

- **gRPC 四种模式**：一元（Unary）、服务端流（Server Streaming）、客户端流（Client Streaming）、双向流（Bidirectional Streaming），按业务需要选择。
- **拦截器链**：拦截器是 gRPC 中间件机制，常用于日志、鉴权、限流、链路追踪注入。生产中推荐使用 `grpc-middleware` 库组合多个拦截器。
- **错误处理**：gRPC 使用 `status.Errorf` + `codes.Code`，不要直接返回 Go 原生 error，否则客户端无法正确解析错误类型。

---

## 2. Protobuf

Protocol Buffers（Protobuf）是 Google 的高效序列化协议，是 gRPC 的默认数据格式。

### 2.1 Proto3 核心语法

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

### 2.2 代码生成

```bash
# 安装工具
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# 生成 Go 代码
protoc --go_out=. --go_opt=paths=source_relative \
       --go-grpc_out=. --go-grpc_opt=paths=source_relative \
       proto/order.proto
```

### 2.3 在 Go 中使用生成的代码

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

### 3.3 服务发现与 Watch

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

### 讲解重点

- **租约与 TTL**：注册时绑定 Lease，服务挂掉后 Lease 过期，key 自动删除，实现"被动健康检查"。KeepAlive 保持心跳续约。
- **Watch 机制**：消费者通过 Watch 实时感知服务上下线，避免定时轮询的延迟和开销。etcd 的 Watch 基于 Revision，不会丢失事件。
- **多注册中心选型**：etcd 适合 K8s 生态；Consul 自带健康检查和 DNS 接口；Nacos 在阿里系使用广泛。选型取决于团队技术栈。

---

## 4. 配置中心

配置中心实现配置的集中管理和动态更新，避免每次修改配置都需要重启服务。

### 4.1 基于 etcd 的动态配置

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

### 4.2 使用示例

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

### 讲解重点

- **读写分离保护**：配置对象使用 RWMutex 保护，多 goroutine 安全读取。更新时替换整个指针，而非逐字段修改，避免读到半更新状态。
- **热更新边界**：不是所有配置都适合热更新。数据库连接池大小可以热更，但端口号变更需要重启。设计时应区分"可热更配置"和"启动时配置"。
- **配置中心选型**：etcd 轻量适合 K8s 环境；Apollo 有完善的灰度发布和审计功能；Nacos 同时支持配置和注册发现。

---

## 5. 链路追踪

链路追踪帮助在分布式系统中追踪一个请求经过的所有服务，是可观测性的关键组成部分。

### 5.1 OpenTelemetry 基础设置

```go
package tracing

import (
    "context"
    "log"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

// InitTracer 初始化 OpenTelemetry Tracer
func InitTracer(ctx context.Context, serviceName string) (func(), error) {
    // 创建 OTLP exporter（发送到 Jaeger/Tempo 等后端）
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // 设置资源信息
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceNameKey.String(serviceName),
            semconv.ServiceVersionKey.String("1.0.0"),
            attribute.String("environment", "production"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // 创建 TracerProvider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.TraceIDRatioBased(0.1)), // 采样 10%
    )

    otel.SetTracerProvider(tp)

    // 设置上下文传播器（W3C TraceContext）
    otel.SetTextMapPropagator(
        propagation.NewCompositeTextMapPropagator(
            propagation.TraceContext{},
            propagation.Baggage{},
        ),
    )

    // 返回清理函数
    cleanup := func() {
        if err := tp.Shutdown(ctx); err != nil {
            log.Printf("shutdown tracer: %v", err)
        }
    }

    return cleanup, nil
}
```

### 5.2 创建 Span 与上下文传播

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

var tracer = otel.Tracer("order-service")

// handleCreateOrder HTTP 处理函数中使用追踪
func handleCreateOrder(w http.ResponseWriter, r *http.Request) {
    // 从请求头提取 trace context
    ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

    // 创建 span
    ctx, span := tracer.Start(ctx, "CreateOrder",
        trace.WithAttributes(
            attribute.String("http.method", r.Method),
            attribute.String("http.url", r.URL.String()),
        ),
    )
    defer span.End()

    // 业务逻辑
    orderID, err := processOrder(ctx)
    if err != nil {
        span.SetStatus(codes.Error, err.Error())
        span.RecordError(err)
        http.Error(w, err.Error(), 500)
        return
    }

    span.SetAttributes(attribute.String("order.id", orderID))
    fmt.Fprintf(w, "Order created: %s", orderID)
}

func processOrder(ctx context.Context) (string, error) {
    // 子 span：校验库存
    ctx, span := tracer.Start(ctx, "CheckInventory")
    time.Sleep(50 * time.Millisecond) // 模拟调用
    span.SetAttributes(attribute.Bool("inventory.available", true))
    span.End()

    // 子 span：扣减库存
    ctx, span = tracer.Start(ctx, "DeductInventory")
    time.Sleep(30 * time.Millisecond)
    span.End()

    // 子 span：创建支付单
    _, span = tracer.Start(ctx, "CreatePayment")
    time.Sleep(80 * time.Millisecond)
    span.End()

    return "ORD-20240101-001", nil
}
```

### 5.3 gRPC 拦截器集成追踪

```go
import (
    "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
    "google.golang.org/grpc"
)

// 服务端自动追踪
func newTracedGRPCServer() *grpc.Server {
    return grpc.NewServer(
        grpc.StatsHandler(otelgrpc.NewServerHandler()),
    )
}

// 客户端自动追踪
func newTracedGRPCConn(addr string) (*grpc.ClientConn, error) {
    return grpc.Dial(addr,
        grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
}
```

### 讲解重点

- **Context 传播是核心**：Trace 信息通过 `context.Context` 在进程内传递，通过 HTTP Header / gRPC Metadata 跨进程传递。丢失 context 就断链。
- **采样策略**：生产环境不能 100% 采样（性能开销大），常用 `TraceIDRatioBased` 按比例采样或 `ParentBased` 跟随上游决策。
- **Span 命名规范**：Span name 应体现操作语义（如 `CreateOrder`、`QueryDB`），不要包含动态参数（如订单号），动态数据放 attributes。

---

## 6. 熔断、限流、降级

这三种机制是微服务容错的核心手段，防止局部故障扩散到整个系统。

### 6.1 熔断器（Circuit Breaker）

```go
package circuitbreaker

import (
    "errors"
    "sync"
    "time"
)

type State int

const (
    StateClosed   State = iota // 正常，请求正常通过
    StateOpen                  // 熔断，请求直接拒绝
    StateHalfOpen              // 半开，允许少量试探请求
)

var ErrCircuitOpen = errors.New("circuit breaker is open")

type CircuitBreaker struct {
    mu sync.Mutex

    state           State
    failureCount    int
    successCount    int
    failureThreshold int
    successThreshold int     // 半开状态需要连续成功几次才恢复
    timeout          time.Duration // 熔断持续时间
    lastFailureTime  time.Time
}

func NewCircuitBreaker(failureThreshold, successThreshold int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:            StateClosed,
        failureThreshold: failureThreshold,
        successThreshold: successThreshold,
        timeout:          timeout,
    }
}

// Execute 通过熔断器执行函数
func (cb *CircuitBreaker) Execute(fn func() error) error {
    cb.mu.Lock()

    switch cb.state {
    case StateOpen:
        // 判断是否超过冷却时间，进入半开
        if time.Since(cb.lastFailureTime) > cb.timeout {
            cb.state = StateHalfOpen
            cb.successCount = 0
            cb.mu.Unlock()
        } else {
            cb.mu.Unlock()
            return ErrCircuitOpen
        }

    case StateClosed, StateHalfOpen:
        cb.mu.Unlock()
    }

    // 执行业务函数
    err := fn()

    cb.mu.Lock()
    defer cb.mu.Unlock()

    if err != nil {
        cb.failureCount++
        cb.lastFailureTime = time.Now()

        if cb.failureCount >= cb.failureThreshold {
            cb.state = StateOpen
        }
        return err
    }

    // 成功
    if cb.state == StateHalfOpen {
        cb.successCount++
        if cb.successCount >= cb.successThreshold {
            cb.state = StateClosed
            cb.failureCount = 0
        }
    } else {
        cb.failureCount = 0 // 重置失败计数
    }

    return nil
}

func (cb *CircuitBreaker) State() State {
    cb.mu.Lock()
    defer cb.mu.Unlock()
    return cb.state
}
```

### 6.2 限流器（Rate Limiter）

```go
package ratelimit

import (
    "net/http"
    "sync"
    "time"

    "golang.org/x/time/rate"
)

// 单机限流：基于令牌桶
func NewRateLimitMiddleware(rps int, burst int) func(http.Handler) http.Handler {
    limiter := rate.NewLimiter(rate.Limit(rps), burst)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// 按用户/IP 限流
type PerClientLimiter struct {
    mu       sync.Mutex
    limiters map[string]*rate.Limiter
    rps      rate.Limit
    burst    int
}

func NewPerClientLimiter(rps int, burst int) *PerClientLimiter {
    pcl := &PerClientLimiter{
        limiters: make(map[string]*rate.Limiter),
        rps:      rate.Limit(rps),
        burst:    burst,
    }

    // 定期清理不活跃的 limiter，防止内存泄漏
    go func() {
        for range time.Tick(10 * time.Minute) {
            pcl.mu.Lock()
            pcl.limiters = make(map[string]*rate.Limiter)
            pcl.mu.Unlock()
        }
    }()

    return pcl
}

func (pcl *PerClientLimiter) GetLimiter(clientID string) *rate.Limiter {
    pcl.mu.Lock()
    defer pcl.mu.Unlock()

    if l, ok := pcl.limiters[clientID]; ok {
        return l
    }
    l := rate.NewLimiter(pcl.rps, pcl.burst)
    pcl.limiters[clientID] = l
    return l
}

func (pcl *PerClientLimiter) Allow(clientID string) bool {
    return pcl.GetLimiter(clientID).Allow()
}
```

### 6.3 降级策略

```go
package degradation

import (
    "context"
    "log"
    "time"
)

// 降级：当依赖不可用时，返回兜底数据
type ProductService struct {
    cb *circuitbreaker.CircuitBreaker
}

func (s *ProductService) GetRecommendations(ctx context.Context, userID string) ([]Product, error) {
    var result []Product

    err := s.cb.Execute(func() error {
        // 尝试调用推荐服务
        var err error
        result, err = s.callRecommendationService(ctx, userID)
        return err
    })

    if err != nil {
        log.Printf("recommendation service degraded: %v", err)
        // 降级：返回热门商品兜底
        return s.getHotProducts(ctx)
    }

    return result, nil
}

func (s *ProductService) getHotProducts(ctx context.Context) ([]Product, error) {
    // 从缓存读取热门商品，这是预先准备好的兜底数据
    return []Product{
        {ID: "1", Name: "热门商品A", Price: 99.0},
        {ID: "2", Name: "热门商品B", Price: 199.0},
    }, nil
}

type Product struct {
    ID    string
    Name  string
    Price float64
}
```

### 讲解重点

- **三态转换**：熔断器的 Closed -> Open -> HalfOpen -> Closed 状态机是核心。Open 状态直接 fail-fast，避免资源浪费；HalfOpen 通过试探请求判断下游是否恢复。
- **限流算法选择**：令牌桶（Token Bucket）允许突发流量，适合大多数场景；漏桶（Leaky Bucket）严格匀速，适合保护下游。`golang.org/x/time/rate` 实现的是令牌桶。
- **降级要提前准备**：降级数据（兜底数据、缓存快照）要在系统正常时预热好，不能等到出问题再临时准备。

---

## 7. 幂等设计

幂等性保证同一操作执行一次和执行多次的效果相同，在网络不可靠的分布式环境中至关重要。

### 7.1 基于幂等 Key 的方案

```go
package idempotent

import (
    "context"
    "crypto/sha256"
    "database/sql"
    "encoding/hex"
    "errors"
    "fmt"
    "time"
)

var (
    ErrDuplicateRequest = errors.New("duplicate request")
    ErrIdempotencyKeyRequired = errors.New("idempotency key is required")
)

// IdempotencyStore 幂等性存储
type IdempotencyStore struct {
    db *sql.DB
}

// IdempotencyRecord 幂等记录
type IdempotencyRecord struct {
    Key        string
    Status     string // pending, success, failed
    Response   []byte
    CreatedAt  time.Time
    ExpiresAt  time.Time
}

func NewIdempotencyStore(db *sql.DB) *IdempotencyStore {
    return &IdempotencyStore{db: db}
}

/*
 建表 SQL:
 CREATE TABLE idempotency_keys (
     key VARCHAR(64) PRIMARY KEY,
     status VARCHAR(16) NOT NULL DEFAULT 'pending',
     response BLOB,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     expires_at TIMESTAMP NOT NULL,
     INDEX idx_expires (expires_at)
 );
*/

// Execute 幂等执行
func (s *IdempotencyStore) Execute(
    ctx context.Context,
    idempotencyKey string,
    ttl time.Duration,
    fn func(ctx context.Context) ([]byte, error),
) ([]byte, error) {
    if idempotencyKey == "" {
        return nil, ErrIdempotencyKeyRequired
    }

    // 1. 尝试插入幂等记录（利用主键唯一约束）
    expiresAt := time.Now().Add(ttl)
    _, err := s.db.ExecContext(ctx,
        `INSERT INTO idempotency_keys (key_id, status, expires_at)
         VALUES (?, 'pending', ?)
         ON DUPLICATE KEY UPDATE key_id=key_id`, // MySQL
        idempotencyKey, expiresAt,
    )

    if err != nil {
        return nil, fmt.Errorf("insert idempotency key: %w", err)
    }

    // 2. 查询已有记录
    var record IdempotencyRecord
    err = s.db.QueryRowContext(ctx,
        `SELECT key_id, status, response FROM idempotency_keys WHERE key_id = ?`,
        idempotencyKey,
    ).Scan(&record.Key, &record.Status, &record.Response)

    if err != nil {
        return nil, fmt.Errorf("query idempotency key: %w", err)
    }

    // 3. 如果已成功，直接返回缓存的响应
    if record.Status == "success" {
        return record.Response, nil
    }

    // 4. 执行实际业务逻辑
    response, err := fn(ctx)
    if err != nil {
        // 标记失败，允许重试
        s.db.ExecContext(ctx,
            `UPDATE idempotency_keys SET status = 'failed' WHERE key_id = ?`,
            idempotencyKey,
        )
        return nil, err
    }

    // 5. 标记成功，缓存响应
    s.db.ExecContext(ctx,
        `UPDATE idempotency_keys SET status = 'success', response = ? WHERE key_id = ?`,
        response, idempotencyKey,
    )

    return response, nil
}
```

### 7.2 基于 Token 的防重提交

```go
package idempotent

import (
    "context"
    "crypto/rand"
    "encoding/hex"
    "fmt"
    "time"

    "github.com/redis/go-redis/v9"
)

type TokenDedup struct {
    rdb *redis.Client
}

func NewTokenDedup(rdb *redis.Client) *TokenDedup {
    return &TokenDedup{rdb: rdb}
}

// GenerateToken 生成唯一 Token（表单渲染时下发给前端）
func (t *TokenDedup) GenerateToken(ctx context.Context) (string, error) {
    b := make([]byte, 16)
    if _, err := rand.Read(b); err != nil {
        return "", err
    }
    token := hex.EncodeToString(b)

    // 存入 Redis，设置过期时间
    key := fmt.Sprintf("dedup:token:%s", token)
    err := t.rdb.Set(ctx, key, "1", 10*time.Minute).Err()
    if err != nil {
        return "", err
    }

    return token, nil
}

// ConsumeToken 消费 Token（提交时验证并删除）
// 利用 Redis 的原子性，确保只有一个请求能消费成功
func (t *TokenDedup) ConsumeToken(ctx context.Context, token string) (bool, error) {
    key := fmt.Sprintf("dedup:token:%s", token)

    // DEL 返回删除的 key 数量，>0 表示首次消费
    result, err := t.rdb.Del(ctx, key).Result()
    if err != nil {
        return false, err
    }

    return result > 0, nil
}
```

### 7.3 数据库唯一约束方案

```go
// 利用数据库唯一索引实现自然幂等
// 场景：创建订单时，使用 业务流水号 作为唯一约束

func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderRequest) error {
    // 生成幂等性业务键：用户ID + 商品ID + 日期（防止同一天重复下单）
    bizKey := fmt.Sprintf("%s:%s:%s",
        req.UserID, req.ProductID, time.Now().Format("2006-01-02"))
    hash := sha256.Sum256([]byte(bizKey))
    orderNo := hex.EncodeToString(hash[:16])

    _, err := s.db.ExecContext(ctx,
        `INSERT INTO orders (order_no, user_id, product_id, amount)
         VALUES (?, ?, ?, ?)`,
        orderNo, req.UserID, req.ProductID, req.Amount,
    )

    if err != nil {
        // 唯一约束冲突 -> 重复请求，视为成功
        if isDuplicateKeyError(err) {
            return nil // 幂等返回
        }
        return err
    }
    return nil
}
```

### 讲解重点

- **幂等 Key 设计**：Key 应由客户端生成并在请求头传递（如 `X-Idempotency-Key`）。Key 要有过期时间，过期后允许重新执行。
- **数据库唯一约束是最简单的幂等方案**：对于 INSERT 操作，利用唯一索引天然防重复，无需额外组件。核心是设计好业务唯一键。
- **Token 方案适合表单提交**：服务端下发 Token，提交时原子消费（Redis DEL），保证"一个 Token 只能用一次"。

---

## 8. 重试策略

合理的重试策略能提高分布式系统的容错能力，但不当的重试会加剧故障（重试风暴）。

### 8.1 指数退避重试

```go
package retry

import (
    "context"
    "errors"
    "fmt"
    "math"
    "math/rand"
    "time"

    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

type Config struct {
    MaxRetries  int
    BaseDelay   time.Duration
    MaxDelay    time.Duration
    Multiplier  float64
    JitterRatio float64 // 0~1，抖动比例
}

var DefaultConfig = Config{
    MaxRetries:  3,
    BaseDelay:   100 * time.Millisecond,
    MaxDelay:    10 * time.Second,
    Multiplier:  2.0,
    JitterRatio: 0.3,
}

// RetryableFunc 可重试的函数
type RetryableFunc func(ctx context.Context) error

// Do 执行带重试的函数
func Do(ctx context.Context, cfg Config, fn RetryableFunc) error {
    var lastErr error

    for attempt := 0; attempt <= cfg.MaxRetries; attempt++ {
        lastErr = fn(ctx)
        if lastErr == nil {
            return nil // 成功
        }

        // 判断是否可重试
        if !IsRetryable(lastErr) {
            return lastErr // 不可重试的错误，直接返回
        }

        // 最后一次重试失败，不再等待
        if attempt == cfg.MaxRetries {
            break
        }

        // 计算退避时间
        delay := calcDelay(cfg, attempt)

        select {
        case <-ctx.Done():
            return fmt.Errorf("retry cancelled: %w", ctx.Err())
        case <-time.After(delay):
            // 继续重试
        }
    }

    return fmt.Errorf("max retries (%d) exceeded: %w", cfg.MaxRetries, lastErr)
}

// calcDelay 计算带抖动的指数退避延迟
func calcDelay(cfg Config, attempt int) time.Duration {
    delay := float64(cfg.BaseDelay) * math.Pow(cfg.Multiplier, float64(attempt))

    if delay > float64(cfg.MaxDelay) {
        delay = float64(cfg.MaxDelay)
    }

    // 添加随机抖动，避免重试风暴（thundering herd）
    jitter := delay * cfg.JitterRatio * (rand.Float64()*2 - 1) // [-jitter, +jitter]
    delay += jitter

    return time.Duration(delay)
}

// IsRetryable 判断错误是否可重试
func IsRetryable(err error) bool {
    // 网络超时、临时错误可重试
    if errors.Is(err, context.DeadlineExceeded) {
        return true
    }

    // gRPC 错误码判断
    if s, ok := status.FromError(err); ok {
        switch s.Code() {
        case codes.Unavailable,     // 服务不可用
            codes.ResourceExhausted, // 资源耗尽（限流）
            codes.Aborted,           // 事务冲突
            codes.DeadlineExceeded:  // 超时
            return true
        case codes.InvalidArgument,  // 参数错误
            codes.NotFound,          // 未找到
            codes.PermissionDenied,  // 权限不足
            codes.Unauthenticated:   // 未认证
            return false             // 重试无意义
        }
    }

    return false
}
```

### 8.2 重试预算（Retry Budget）

```go
package retry

import (
    "sync/atomic"
    "time"
)

// RetryBudget 防止重试风暴
// 限制一段时间窗口内的重试次数占总请求的比例
type RetryBudget struct {
    totalRequests  atomic.Int64
    retryRequests  atomic.Int64
    maxRetryRatio  float64
    window         time.Duration
}

func NewRetryBudget(maxRetryRatio float64, window time.Duration) *RetryBudget {
    rb := &RetryBudget{
        maxRetryRatio: maxRetryRatio,
        window:        window,
    }

    // 定期重置计数器
    go func() {
        ticker := time.NewTicker(window)
        defer ticker.Stop()
        for range ticker.C {
            rb.totalRequests.Store(0)
            rb.retryRequests.Store(0)
        }
    }()

    return rb
}

// AllowRetry 判断是否允许重试
func (rb *RetryBudget) AllowRetry() bool {
    total := rb.totalRequests.Load()
    retries := rb.retryRequests.Load()

    if total == 0 {
        return true
    }

    ratio := float64(retries) / float64(total)
    return ratio < rb.maxRetryRatio
}

// RecordRequest 记录一次请求
func (rb *RetryBudget) RecordRequest() {
    rb.totalRequests.Add(1)
}

// RecordRetry 记录一次重试
func (rb *RetryBudget) RecordRetry() {
    rb.retryRequests.Add(1)
}
```

### 8.3 使用示例

```go
func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    budget := NewRetryBudget(0.2, 1*time.Minute) // 重试率不超过 20%

    err := Do(ctx, DefaultConfig, func(ctx context.Context) error {
        budget.RecordRequest()

        err := callRemoteService(ctx)
        if err != nil && IsRetryable(err) {
            if !budget.AllowRetry() {
                return fmt.Errorf("retry budget exhausted: %w", err)
            }
            budget.RecordRetry()
        }
        return err
    })

    if err != nil {
        log.Printf("request failed after retries: %v", err)
    }
}
```

### 讲解重点

- **指数退避 + 抖动**：退避时间 = BaseDelay * Multiplier^attempt + Jitter。抖动（Jitter）是关键，防止多个客户端在同一时刻集体重试（thundering herd 问题）。
- **只重试可重试的错误**：参数错误、权限不足等重试无意义；超时、服务不可用、限流等才应该重试。错误分类是重试策略的基础。
- **重试预算防雪崩**：全局限制重试比例（如不超过 20%），防止下游故障时大量重试请求加剧故障。这是 Google SRE 推荐的实践。

---

## 9. 消息队列

消息队列实现服务间的异步通信和解耦，是分布式系统的核心基础设施。

### 9.1 Kafka 生产者模式

```go
package mq

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaProducer Kafka 生产者
type KafkaProducer struct {
    writer *kafka.Writer
}

func NewKafkaProducer(brokers []string, topic string) *KafkaProducer {
    writer := &kafka.Writer{
        Addr:         kafka.TCP(brokers...),
        Topic:        topic,
        Balancer:     &kafka.LeastBytes{}, // 负载均衡策略
        BatchSize:    100,                 // 批量发送
        BatchTimeout: 10 * time.Millisecond,
        RequiredAcks: kafka.RequireAll,    // 所有副本确认（最高可靠性）
        Async:        false,               // 同步写入
    }

    return &KafkaProducer{writer: writer}
}

// OrderEvent 订单事件
type OrderEvent struct {
    EventID   string    `json:"event_id"`
    OrderID   string    `json:"order_id"`
    UserID    string    `json:"user_id"`
    Action    string    `json:"action"` // created, paid, shipped
    Amount    float64   `json:"amount"`
    Timestamp time.Time `json:"timestamp"`
}

// Publish 发布消息
func (p *KafkaProducer) Publish(ctx context.Context, event OrderEvent) error {
    data, err := json.Marshal(event)
    if err != nil {
        return fmt.Errorf("marshal event: %w", err)
    }

    msg := kafka.Message{
        // Key 保证同一订单的消息发到同一分区（保序）
        Key:   []byte(event.OrderID),
        Value: data,
        Headers: []kafka.Header{
            {Key: "event_type", Value: []byte(event.Action)},
        },
    }

    if err := p.writer.WriteMessages(ctx, msg); err != nil {
        return fmt.Errorf("write message: %w", err)
    }

    log.Printf("published event: %s for order: %s", event.Action, event.OrderID)
    return nil
}

func (p *KafkaProducer) Close() error {
    return p.writer.Close()
}
```

### 9.2 Kafka 消费者模式

```go
package mq

import (
    "context"
    "encoding/json"
    "errors"
    "log"
    "time"

    "github.com/segmentio/kafka-go"
)

// KafkaConsumer Kafka 消费者
type KafkaConsumer struct {
    reader *kafka.Reader
}

func NewKafkaConsumer(brokers []string, topic, groupID string) *KafkaConsumer {
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers:        brokers,
        Topic:          topic,
        GroupID:        groupID,           // 消费者组
        MinBytes:       10e3,              // 10KB
        MaxBytes:       10e6,              // 10MB
        MaxWait:        1 * time.Second,
        CommitInterval: 1 * time.Second,   // 自动提交间隔
        StartOffset:    kafka.LastOffset,  // 从最新开始
    })

    return &KafkaConsumer{reader: reader}
}

// MessageHandler 消息处理函数
type MessageHandler func(ctx context.Context, event OrderEvent) error

// Consume 消费消息（at-least-once 语义）
func (c *KafkaConsumer) Consume(ctx context.Context, handler MessageHandler) error {
    for {
        // 读取消息
        msg, err := c.reader.ReadMessage(ctx)
        if err != nil {
            if errors.Is(err, context.Canceled) {
                return nil
            }
            log.Printf("read message error: %v", err)
            continue
        }

        // 反序列化
        var event OrderEvent
        if err := json.Unmarshal(msg.Value, &event); err != nil {
            log.Printf("unmarshal error (offset=%d): %v", msg.Offset, err)
            continue // 跳过无法解析的消息，避免阻塞
        }

        // 处理消息
        if err := handler(ctx, event); err != nil {
            log.Printf("handle event error (eventID=%s): %v", event.EventID, err)
            // at-least-once：处理失败不提交 offset，下次会重新消费
            // 实际生产中应结合死信队列和重试次数限制
            continue
        }

        log.Printf("processed event: %s offset: %d", event.EventID, msg.Offset)
    }
}

func (c *KafkaConsumer) Close() error {
    return c.reader.Close()
}
```

### 9.3 使用示例

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    brokers := []string{"localhost:9092"}
    topic := "order-events"

    // 生产者
    producer := NewKafkaProducer(brokers, topic)
    defer producer.Close()

    event := OrderEvent{
        EventID:   "evt_001",
        OrderID:   "ord_123",
        UserID:    "user_456",
        Action:    "created",
        Amount:    299.99,
        Timestamp: time.Now(),
    }
    producer.Publish(ctx, event)

    // 消费者
    consumer := NewKafkaConsumer(brokers, topic, "order-processor")
    defer consumer.Close()

    // 消费处理
    consumer.Consume(ctx, func(ctx context.Context, event OrderEvent) error {
        log.Printf("Processing order %s: action=%s, amount=%.2f",
            event.OrderID, event.Action, event.Amount)

        switch event.Action {
        case "created":
            return notifyWarehouse(ctx, event)
        case "paid":
            return updateInventory(ctx, event)
        default:
            return nil
        }
    })
}
```

### 讲解重点

- **分区与消息顺序**：Kafka 只保证分区内有序。用 Message Key（如订单 ID）将同一实体的消息路由到同一分区，确保该实体的事件按序处理。
- **at-least-once 语义**：消费者先处理再提交 offset，可能重复消费（处理成功但提交失败时）。因此消费端必须做幂等处理（结合第 7 节）。
- **死信队列**：对于多次处理失败的消息，应转入死信队列（DLQ）人工介入，避免毒消息（Poison Message）无限阻塞消费进度。

---

## 10. 分布式事务

分布式事务解决跨服务数据一致性问题，核心思路是放弃强一致性，追求最终一致性。

### 10.1 Saga 模式

```go
package saga

import (
    "context"
    "fmt"
    "log"
)

// Step Saga 中的每一步
type Step struct {
    Name       string
    Action     func(ctx context.Context) error // 正向操作
    Compensate func(ctx context.Context) error // 补偿操作（回滚）
}

// Saga 编排器
type Saga struct {
    steps []Step
}

func NewSaga() *Saga {
    return &Saga{}
}

func (s *Saga) AddStep(step Step) *Saga {
    s.steps = append(s.steps, step)
    return s
}

// Execute 按顺序执行所有步骤，失败时反向补偿
func (s *Saga) Execute(ctx context.Context) error {
    executed := make([]int, 0, len(s.steps))

    for i, step := range s.steps {
        log.Printf("[Saga] executing step %d: %s", i, step.Name)

        if err := step.Action(ctx); err != nil {
            log.Printf("[Saga] step %d failed: %v, starting compensation", i, err)
            // 反向补偿已执行的步骤
            s.compensate(ctx, executed)
            return fmt.Errorf("saga failed at step '%s': %w", step.Name, err)
        }

        executed = append(executed, i)
    }

    log.Println("[Saga] all steps completed successfully")
    return nil
}

// compensate 反向补偿
func (s *Saga) compensate(ctx context.Context, executed []int) {
    // 从最后一个已执行步骤开始反向补偿
    for i := len(executed) - 1; i >= 0; i-- {
        stepIdx := executed[i]
        step := s.steps[stepIdx]

        log.Printf("[Saga] compensating step %d: %s", stepIdx, step.Name)

        if err := step.Compensate(ctx); err != nil {
            // 补偿失败需要告警 + 人工介入
            log.Printf("[Saga] CRITICAL: compensation failed for step '%s': %v", step.Name, err)
        }
    }
}
```

### 10.2 Saga 使用示例（订单流程）

```go
func CreateOrderSaga(ctx context.Context, order Order) error {
    saga := NewSaga()

    // 步骤1：创建订单
    saga.AddStep(Step{
        Name: "CreateOrder",
        Action: func(ctx context.Context) error {
            return orderService.Create(ctx, order)
        },
        Compensate: func(ctx context.Context) error {
            return orderService.Cancel(ctx, order.ID)
        },
    })

    // 步骤2：扣减库存
    saga.AddStep(Step{
        Name: "DeductInventory",
        Action: func(ctx context.Context) error {
            return inventoryService.Deduct(ctx, order.Items)
        },
        Compensate: func(ctx context.Context) error {
            return inventoryService.Restore(ctx, order.Items)
        },
    })

    // 步骤3：扣减余额
    saga.AddStep(Step{
        Name: "DeductBalance",
        Action: func(ctx context.Context) error {
            return paymentService.Deduct(ctx, order.UserID, order.TotalAmount)
        },
        Compensate: func(ctx context.Context) error {
            return paymentService.Refund(ctx, order.UserID, order.TotalAmount)
        },
    })

    // 步骤4：发送通知
    saga.AddStep(Step{
        Name: "SendNotification",
        Action: func(ctx context.Context) error {
            return notificationService.Send(ctx, order.UserID, "Order created")
        },
        Compensate: func(ctx context.Context) error {
            return nil // 通知不需要补偿
        },
    })

    return saga.Execute(ctx)
}
```

### 10.3 基于消息的最终一致性

```go
package transaction

import (
    "context"
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "time"
)

// OutboxMessage 事务消息表（Outbox Pattern）
type OutboxMessage struct {
    ID        int64
    Topic     string
    Key       string
    Payload   []byte
    Status    string // pending, published
    CreatedAt time.Time
}

// TransactionalOutbox 事务性发件箱
type TransactionalOutbox struct {
    db *sql.DB
}

/*
 建表 SQL:
 CREATE TABLE outbox_messages (
     id BIGINT AUTO_INCREMENT PRIMARY KEY,
     topic VARCHAR(128) NOT NULL,
     msg_key VARCHAR(128),
     payload BLOB NOT NULL,
     status VARCHAR(16) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     INDEX idx_status (status)
 );
*/

// ExecuteWithOutbox 在同一个数据库事务中完成业务操作和消息写入
func (o *TransactionalOutbox) ExecuteWithOutbox(
    ctx context.Context,
    bizFn func(tx *sql.Tx) error,
    topic, key string,
    payload interface{},
) error {
    tx, err := o.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // 执行业务逻辑
    if err := bizFn(tx); err != nil {
        return fmt.Errorf("business logic: %w", err)
    }

    // 写入 outbox 表（同一个事务）
    data, err := json.Marshal(payload)
    if err != nil {
        return fmt.Errorf("marshal payload: %w", err)
    }

    _, err = tx.ExecContext(ctx,
        `INSERT INTO outbox_messages (topic, msg_key, payload) VALUES (?, ?, ?)`,
        topic, key, data,
    )
    if err != nil {
        return fmt.Errorf("insert outbox: %w", err)
    }

    return tx.Commit()
}

// PublishPendingMessages 定时轮询发布待发送消息
func (o *TransactionalOutbox) PublishPendingMessages(ctx context.Context, publisher MessagePublisher) {
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            o.publishBatch(ctx, publisher)
        }
    }
}

func (o *TransactionalOutbox) publishBatch(ctx context.Context, publisher MessagePublisher) {
    rows, err := o.db.QueryContext(ctx,
        `SELECT id, topic, msg_key, payload FROM outbox_messages
         WHERE status = 'pending' ORDER BY id LIMIT 100`)
    if err != nil {
        log.Printf("query outbox: %v", err)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var msg OutboxMessage
        if err := rows.Scan(&msg.ID, &msg.Topic, &msg.Key, &msg.Payload); err != nil {
            continue
        }

        if err := publisher.Publish(ctx, msg.Topic, msg.Key, msg.Payload); err != nil {
            log.Printf("publish message %d failed: %v", msg.ID, err)
            continue
        }

        // 标记已发布
        o.db.ExecContext(ctx,
            `UPDATE outbox_messages SET status = 'published' WHERE id = ?`, msg.ID)
    }
}

type MessagePublisher interface {
    Publish(ctx context.Context, topic, key string, payload []byte) error
}
```

### 讲解重点

- **Saga 的两种编排方式**：编排式（Orchestration，有中央协调者）和协作式（Choreography，事件驱动无中心）。上面实现的是编排式，适合流程清晰的场景。
- **补偿操作必须幂等**：补偿可能被重复执行（如补偿过程中系统崩溃后重试），因此每个 Compensate 函数本身也要做幂等处理。
- **Outbox 模式解决"写库+发消息"原子性**：业务数据和消息在同一个数据库事务中写入，再由后台任务异步发布消息到 MQ，保证不会出现"写库成功但消息丢失"。

---

## 11. 服务治理

服务治理涵盖服务的全生命周期管理，包括负载均衡、健康检查、优雅启停和流量管理。

### 11.1 自定义负载均衡

```go
package lb

import (
    "math/rand"
    "sync"
    "sync/atomic"
)

// Balancer 负载均衡器接口
type Balancer interface {
    Pick(endpoints []string) string
}

// RoundRobin 轮询
type RoundRobin struct {
    counter atomic.Uint64
}

func (rr *RoundRobin) Pick(endpoints []string) string {
    if len(endpoints) == 0 {
        return ""
    }
    idx := rr.counter.Add(1) - 1
    return endpoints[idx%uint64(len(endpoints))]
}

// WeightedRoundRobin 加权轮询
type WeightedEndpoint struct {
    Addr   string
    Weight int
}

type WeightedRoundRobin struct {
    mu       sync.Mutex
    current  int
    gcd      int
    maxW     int
    endpoints []WeightedEndpoint
}

func NewWeightedRoundRobin(endpoints []WeightedEndpoint) *WeightedRoundRobin {
    wrr := &WeightedRoundRobin{
        endpoints: endpoints,
        current:   -1,
    }

    // 计算权重的最大公约数
    wrr.gcd = endpoints[0].Weight
    wrr.maxW = endpoints[0].Weight
    for _, ep := range endpoints[1:] {
        wrr.gcd = gcd(wrr.gcd, ep.Weight)
        if ep.Weight > wrr.maxW {
            wrr.maxW = ep.Weight
        }
    }
    return wrr
}

func gcd(a, b int) int {
    for b != 0 {
        a, b = b, a%b
    }
    return a
}

// RandomBalancer 随机
type RandomBalancer struct{}

func (r *RandomBalancer) Pick(endpoints []string) string {
    if len(endpoints) == 0 {
        return ""
    }
    return endpoints[rand.Intn(len(endpoints))]
}
```

### 11.2 健康检查

```go
package health

import (
    "context"
    "encoding/json"
    "net/http"
    "sync"
    "time"
)

type Status string

const (
    StatusUp   Status = "UP"
    StatusDown Status = "DOWN"
)

// Checker 健康检查接口
type Checker interface {
    Name() string
    Check(ctx context.Context) error
}

// HealthEndpoint 健康检查端点
type HealthEndpoint struct {
    mu       sync.RWMutex
    checkers []Checker
}

func NewHealthEndpoint() *HealthEndpoint {
    return &HealthEndpoint{}
}

func (h *HealthEndpoint) Register(checker Checker) {
    h.mu.Lock()
    defer h.mu.Unlock()
    h.checkers = append(h.checkers, checker)
}

type HealthResponse struct {
    Status  Status                   `json:"status"`
    Details map[string]ComponentHealth `json:"details"`
}

type ComponentHealth struct {
    Status  Status `json:"status"`
    Message string `json:"message,omitempty"`
}

func (h *HealthEndpoint) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    h.mu.RLock()
    checkers := h.checkers
    h.mu.RUnlock()

    resp := HealthResponse{
        Status:  StatusUp,
        Details: make(map[string]ComponentHealth),
    }

    for _, checker := range checkers {
        err := checker.Check(ctx)
        if err != nil {
            resp.Status = StatusDown
            resp.Details[checker.Name()] = ComponentHealth{
                Status:  StatusDown,
                Message: err.Error(),
            }
        } else {
            resp.Details[checker.Name()] = ComponentHealth{Status: StatusUp}
        }
    }

    w.Header().Set("Content-Type", "application/json")
    if resp.Status == StatusDown {
        w.WriteHeader(http.StatusServiceUnavailable)
    }
    json.NewEncoder(w).Encode(resp)
}

// 示例：数据库健康检查
type DBChecker struct {
    db interface{ PingContext(ctx context.Context) error }
}

func (c *DBChecker) Name() string { return "database" }
func (c *DBChecker) Check(ctx context.Context) error {
    return c.db.PingContext(ctx)
}

// 示例：Redis 健康检查
type RedisChecker struct {
    rdb interface{ Ping(ctx context.Context) error }
}

func (c *RedisChecker) Name() string { return "redis" }
func (c *RedisChecker) Check(ctx context.Context) error {
    return c.rdb.Ping(ctx)
}
```

### 11.3 优雅启停

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type Application struct {
    httpServer *http.Server
    grpcServer interface{ GracefulStop() }

    // 启动和关闭的钩子
    onStart []func(ctx context.Context) error
    onStop  []func(ctx context.Context) error
}

func (app *Application) RegisterOnStart(fn func(ctx context.Context) error) {
    app.onStart = append(app.onStart, fn)
}

func (app *Application) RegisterOnStop(fn func(ctx context.Context) error) {
    app.onStop = append(app.onStop, fn)
}

func (app *Application) Run() error {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // ========== 启动阶段 ==========

    // 执行启动钩子（注册服务、预热缓存等）
    for _, fn := range app.onStart {
        if err := fn(ctx); err != nil {
            return err
        }
    }

    // 启动 HTTP 服务器
    go func() {
        log.Println("HTTP server starting on :8080")
        if err := app.httpServer.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatalf("HTTP server error: %v", err)
        }
    }()

    // ========== 等待退出信号 ==========

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    sig := <-quit
    log.Printf("received signal: %v, shutting down...", sig)

    // ========== 优雅关闭 ==========

    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer shutdownCancel()

    var wg sync.WaitGroup

    // 1. 先从注册中心注销（停止接收新流量）
    // 2. 等待一段时间让负载均衡器感知（给上游时间）
    time.Sleep(5 * time.Second)

    // 3. 停止 HTTP 服务器（等待正在处理的请求完成）
    wg.Add(1)
    go func() {
        defer wg.Done()
        if err := app.httpServer.Shutdown(shutdownCtx); err != nil {
            log.Printf("HTTP shutdown error: %v", err)
        }
        log.Println("HTTP server stopped")
    }()

    // 4. 停止 gRPC 服务器
    wg.Add(1)
    go func() {
        defer wg.Done()
        if app.grpcServer != nil {
            app.grpcServer.GracefulStop()
        }
        log.Println("gRPC server stopped")
    }()

    wg.Wait()

    // 5. 执行关闭钩子（关闭数据库连接、刷新缓冲区等）
    for _, fn := range app.onStop {
        if err := fn(shutdownCtx); err != nil {
            log.Printf("stop hook error: %v", err)
        }
    }

    log.Println("application stopped gracefully")
    return nil
}
```

### 讲解重点

- **优雅关闭的顺序很重要**：先从注册中心注销 -> 等待流量切走 -> 停止接收新请求 -> 等待处理中的请求完成 -> 关闭资源连接。顺序反了会导致请求失败。
- **健康检查分层**：Liveness（存活检查，进程是否活着）和 Readiness（就绪检查，是否能处理请求）要分开。K8s 据此决定重启还是暂停流量。
- **负载均衡策略选择**：轮询适合实例性能均等；加权轮询适合混合部署；一致性哈希适合有状态场景（如缓存亲和性）。

---

## 12. 高可用设计

高可用设计的目标是让系统在部分组件故障时仍能正常提供服务。

### 12.1 冗余与故障转移

```go
package ha

import (
    "context"
    "errors"
    "log"
    "sync"
    "time"
)

// MultiEndpointClient 多节点客户端，支持自动故障转移
type MultiEndpointClient struct {
    mu        sync.RWMutex
    endpoints []Endpoint
    primary   int
}

type Endpoint struct {
    Addr    string
    Healthy bool
    Weight  int
    Zone    string // 可用区
}

func NewMultiEndpointClient(endpoints []Endpoint) *MultiEndpointClient {
    return &MultiEndpointClient{
        endpoints: endpoints,
        primary:   0,
    }
}

// Execute 带故障转移的执行
func (c *MultiEndpointClient) Execute(ctx context.Context, fn func(addr string) error) error {
    c.mu.RLock()
    endpoints := make([]Endpoint, len(c.endpoints))
    copy(endpoints, c.endpoints)
    primary := c.primary
    c.mu.RUnlock()

    // 先尝试主节点
    if endpoints[primary].Healthy {
        if err := fn(endpoints[primary].Addr); err == nil {
            return nil
        }
        // 主节点失败，标记不健康
        c.markUnhealthy(primary)
    }

    // 尝试其他节点（故障转移）
    for i, ep := range endpoints {
        if i == primary || !ep.Healthy {
            continue
        }

        log.Printf("failover: trying %s (zone: %s)", ep.Addr, ep.Zone)

        if err := fn(ep.Addr); err == nil {
            c.mu.Lock()
            c.primary = i // 切换主节点
            c.mu.Unlock()
            return nil
        }

        c.markUnhealthy(i)
    }

    return errors.New("all endpoints unavailable")
}

func (c *MultiEndpointClient) markUnhealthy(idx int) {
    c.mu.Lock()
    c.endpoints[idx].Healthy = false
    c.mu.Unlock()
}

// HealthProbe 后台健康探测，恢复不健康的节点
func (c *MultiEndpointClient) HealthProbe(ctx context.Context, probe func(addr string) error) {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case <-ticker.C:
            c.mu.Lock()
            for i := range c.endpoints {
                if !c.endpoints[i].Healthy {
                    if err := probe(c.endpoints[i].Addr); err == nil {
                        log.Printf("endpoint recovered: %s", c.endpoints[i].Addr)
                        c.endpoints[i].Healthy = true
                    }
                }
            }
            c.mu.Unlock()
        }
    }
}
```

### 12.2 多可用区部署策略

```go
package ha

import (
    "math/rand"
    "sort"
)

// ZoneAwareBalancer 可用区感知的负载均衡
type ZoneAwareBalancer struct {
    localZone string
}

func NewZoneAwareBalancer(localZone string) *ZoneAwareBalancer {
    return &ZoneAwareBalancer{localZone: localZone}
}

// Pick 优先选择本区节点，本区不可用时跨区
func (b *ZoneAwareBalancer) Pick(endpoints []Endpoint) *Endpoint {
    healthy := make([]Endpoint, 0)
    for _, ep := range endpoints {
        if ep.Healthy {
            healthy = append(healthy, ep)
        }
    }

    if len(healthy) == 0 {
        return nil
    }

    // 优先选择本可用区的节点
    var localEps, remoteEps []Endpoint
    for _, ep := range healthy {
        if ep.Zone == b.localZone {
            localEps = append(localEps, ep)
        } else {
            remoteEps = append(remoteEps, ep)
        }
    }

    // 本区有可用节点则随机选择
    if len(localEps) > 0 {
        ep := localEps[rand.Intn(len(localEps))]
        return &ep
    }

    // 本区无可用节点，跨区访问
    if len(remoteEps) > 0 {
        ep := remoteEps[rand.Intn(len(remoteEps))]
        return &ep
    }

    return nil
}
```

### 12.3 高可用设计清单

```go
package ha

/*
高可用架构设计清单（代码之外的关键实践）

1. 冗余设计
   - 服务至少 2 个实例，跨可用区部署
   - 数据库主从复制，Redis Sentinel/Cluster
   - 负载均衡器本身也要冗余（DNS 多 A 记录 / 双活 LB）

2. 故障隔离
   - 核心链路与非核心链路隔离（不同集群/连接池）
   - 按租户或业务线隔离资源（Bulkhead 舱壁模式）
   - 数据库读写分离，读请求走从库

3. 容错机制
   - 超时：每个 RPC/HTTP 调用都要设置超时
   - 重试：参考第 8 节，带退避和重试预算
   - 熔断：参考第 6 节，快速失败保护上游
   - 降级：核心功能不可降级，非核心功能可降级
   - 限流：入口限流 + 下游限流双重保护

4. 可观测性
   - 日志：结构化日志 + 请求 ID 关联
   - 指标：QPS、延迟（P99）、错误率、饱和度
   - 追踪：参考第 5 节，全链路追踪
   - 告警：基于 SLO（如 99.9% 可用性）触发告警

5. 容灾策略
   - 定期演练故障场景（Chaos Engineering）
   - 数据定期备份 + 恢复演练
   - 多活架构：同城双活 > 两地三中心 > 异地多活
   - Runbook：常见故障的标准处理流程

6. 发布安全
   - 灰度发布 / 金丝雀发布
   - 快速回滚能力（版本 < 5 分钟回滚）
   - Feature Flag 控制新功能灰度范围
*/
```

### 12.4 Bulkhead 舱壁隔离模式

```go
package ha

import (
    "context"
    "errors"
    "time"
)

var ErrBulkheadFull = errors.New("bulkhead: max concurrent requests reached")

// Bulkhead 舱壁隔离器，限制对某个下游的并发调用数
type Bulkhead struct {
    sem     chan struct{}
    timeout time.Duration
}

func NewBulkhead(maxConcurrent int, timeout time.Duration) *Bulkhead {
    return &Bulkhead{
        sem:     make(chan struct{}, maxConcurrent),
        timeout: timeout,
    }
}

func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
    // 尝试获取信号量
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return fn()
    case <-time.After(b.timeout):
        return ErrBulkheadFull
    case <-ctx.Done():
        return ctx.Err()
    }
}
```

### 使用示例

```go
func main() {
    // 对支付服务的调用限制并发 20
    paymentBulkhead := NewBulkhead(20, 2*time.Second)

    // 对推荐服务的调用限制并发 50
    recommendBulkhead := NewBulkhead(50, 1*time.Second)

    // 支付服务故障时，不会影响推荐服务的调用
    err := paymentBulkhead.Execute(ctx, func() error {
        return callPaymentService(ctx, order)
    })
    if errors.Is(err, ErrBulkheadFull) {
        log.Println("payment service overloaded, try later")
    }
}
```

### 讲解重点

- **冗余是高可用的基础**：没有冗余就没有高可用。但冗余不只是"多部署几个实例"，还要跨故障域（机架、可用区、地域）分布。
- **舱壁隔离防止级联故障**：为每个下游服务分配独立的资源池（连接数、goroutine 数），某个下游慢或挂掉时不会把调用方的全部资源耗尽。
- **故障演练比设计更重要**：再好的高可用设计，不经过实际演练都是纸上谈兵。Netflix 的 Chaos Monkey 就是这一理念的实践，定期随机杀进程来验证容错能力。
