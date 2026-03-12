---
title: gRPC-Go 源码精读
description: 精读 gRPC-Go 的实现机制，掌握 Unary/Stream RPC、拦截器链、健康检查、连接管理与生产级 gRPC 服务最佳实践。
---

# gRPC-Go：源码精读

> 核心包：`google.golang.org/grpc`、`google.golang.org/protobuf`

## 包结构图

```
gRPC-Go 体系
══════════════════════════════════════════════════════════════════

  RPC 类型：
  ┌───────────────────┬──────────────────────────────────────┐
  │ 类型               │ 说明                                 │
  ├───────────────────┼──────────────────────────────────────┤
  │ Unary             │ 请求/响应（最常用）                   │
  │ Server Streaming  │ 一个请求，流式响应（如实时日志）       │
  │ Client Streaming  │ 流式请求，一个响应（如文件上传）       │
  │ Bidirectional     │ 双向流（如实时聊天）                  │
  └───────────────────┴──────────────────────────────────────┘

  gRPC 核心组件：
  ├── grpc.NewServer(opts...)          ← 服务端
  │    ├── pb.RegisterXxxServer(s, impl)
  │    └── s.Serve(listener)
  ├── grpc.Dial(target, opts...)       ← 客户端连接（Deprecated: NewClient）
  │    └── pb.NewXxxClient(conn)
  ├── 拦截器（中间件）：
  │    ├── UnaryServerInterceptor     ← 服务端 Unary 拦截
  │    ├── StreamServerInterceptor    ← 服务端 Stream 拦截
  │    └── grpc.ChainUnaryInterceptor ← 链式拦截器
  └── 元数据：metadata.NewOutgoingContext / metadata.FromIncomingContext

  负载均衡：
  grpc.Dial("dns:///svc:50051", grpc.WithDefaultServiceConfig(
      `{"loadBalancingPolicy":"round_robin"}`))

══════════════════════════════════════════════════════════════════
```

---

## 一、核心示例（.proto → Go）

```protobuf
// user.proto
syntax = "proto3";
package user;
option go_package = "github.com/example/app/pb;pb";

service UserService {
    rpc GetUser(GetUserRequest) returns (GetUserResponse);
    rpc ListUsers(ListUsersRequest) returns (stream ListUsersResponse);
    rpc UpdateUsers(stream UpdateUserRequest) returns (UpdateUsersResponse);
    rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message GetUserRequest  { int64 id = 1; }
message GetUserResponse { int64 id = 1; string name = 2; string email = 3; }
message ListUsersRequest  { int32 page_size = 1; }
message ListUsersResponse { int64 id = 1; string name = 2; }
message UpdateUserRequest { int64 id = 1; string name = 2; }
message UpdateUsersResponse { int32 updated = 1; }
message ChatMessage { string user_id = 1; string content = 2; }
```

---

## 二、代码示例

### 服务端：实现四种 RPC 类型

```go
package main

import (
    "context"
    "io"
    "net"
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    pb "github.com/example/app/pb"
)

type userServer struct {
    pb.UnimplementedUserServiceServer // 嵌入保证向前兼容
    repo UserRepository
}

// Unary RPC：最简单，一来一回
func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, err := s.repo.GetByID(ctx, req.Id)
    if err != nil {
        // 使用 gRPC 状态码（映射到 HTTP 状态码）
        return nil, status.Errorf(codes.NotFound, "user %d not found: %v", req.Id, err)
    }
    return &pb.GetUserResponse{Id: user.ID, Name: user.Name, Email: user.Email}, nil
}

// Server Streaming RPC：服务端分批推送数据
func (s *userServer) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    pageSize := int(req.PageSize)
    if pageSize <= 0 || pageSize > 100 {
        pageSize = 20
    }

    var offset int
    for {
        // 检查客户端是否取消
        select {
        case <-stream.Context().Done():
            return status.Error(codes.Canceled, "client canceled")
        default:
        }

        users, err := s.repo.List(stream.Context(), offset, pageSize)
        if err != nil {
            return status.Errorf(codes.Internal, "list users: %v", err)
        }
        if len(users) == 0 {
            return nil // 数据发送完毕
        }

        for _, u := range users {
            if err := stream.Send(&pb.ListUsersResponse{Id: u.ID, Name: u.Name}); err != nil {
                return err // 客户端断开
            }
        }
        offset += len(users)
    }
}

// Client Streaming RPC：客户端批量发送，服务端聚合
func (s *userServer) UpdateUsers(stream pb.UserService_UpdateUsersServer) error {
    var updated int32
    for {
        req, err := stream.Recv()
        if err == io.EOF {
            // 客户端发送完毕，返回汇总结果
            return stream.SendAndClose(&pb.UpdateUsersResponse{Updated: updated})
        }
        if err != nil {
            return status.Errorf(codes.Internal, "recv: %v", err)
        }

        if err := s.repo.UpdateName(stream.Context(), req.Id, req.Name); err != nil {
            return status.Errorf(codes.Internal, "update %d: %v", req.Id, err)
        }
        updated++
    }
}

// Bidirectional Streaming RPC：实时双向通信
func (s *userServer) Chat(stream pb.UserService_ChatServer) error {
    for {
        msg, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        // Echo 回客户端（实际场景中会广播给其他用户）
        reply := &pb.ChatMessage{
            UserId:  "server",
            Content: "Echo: " + msg.Content,
        }
        if err := stream.Send(reply); err != nil {
            return err
        }
    }
}

func main() {
    lis, _ := net.Listen("tcp", ":50051")
    srv := grpc.NewServer(
        grpc.ChainUnaryInterceptor(
            loggingInterceptor,
            recoveryInterceptor,
            authInterceptor,
        ),
    )
    pb.RegisterUserServiceServer(srv, &userServer{repo: newUserRepo()})

    // 注册健康检查
    healthpb.RegisterHealthServer(srv, health.NewServer())

    srv.Serve(lis)
}
```

### 拦截器（中间件）

```go
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/metadata"
    "google.golang.org/grpc/status"
)

// 日志拦截器
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    st, _ := status.FromError(err)
    log.Printf("method=%s duration=%v code=%s",
        info.FullMethod, time.Since(start), st.Code())
    return resp, err
}

// Panic 恢复拦截器
func recoveryInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (resp interface{}, err error) {
    defer func() {
        if p := recover(); p != nil {
            log.Printf("panic in %s: %v\n%s", info.FullMethod, p, debug.Stack())
            err = status.Errorf(codes.Internal, "internal server error")
        }
    }()
    return handler(ctx, req)
}

// 认证拦截器（从 metadata 读取 token）
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // 跳过健康检查
    if info.FullMethod == "/grpc.health.v1.Health/Check" {
        return handler(ctx, req)
    }

    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }

    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing authorization")
    }

    token := strings.TrimPrefix(tokens[0], "Bearer ")
    userID, err := validateToken(token)
    if err != nil {
        return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
    }

    // 将用户信息注入 ctx
    ctx = context.WithValue(ctx, ctxKeyUserID, userID)
    return handler(ctx, req)
}
```

### 客户端：连接管理与调用

```go
// 客户端连接（生产配置）
func newGRPCClient(target string) (pb.UserServiceClient, func(), error) {
    conn, err := grpc.NewClient(target,
        grpc.WithTransportCredentials(insecure.NewCredentials()), // 开发用
        // 生产：grpc.WithTransportCredentials(credentials.NewTLS(tlsCfg))
        grpc.WithDefaultServiceConfig(`{
            "loadBalancingPolicy": "round_robin",
            "methodConfig": [{
                "name": [{"service": "user.UserService"}],
                "retryPolicy": {
                    "maxAttempts": 3,
                    "initialBackoff": "0.1s",
                    "maxBackoff": "1s",
                    "backoffMultiplier": 2,
                    "retryableStatusCodes": ["UNAVAILABLE", "DEADLINE_EXCEEDED"]
                }
            }]
        }`),
        // 连接保活（防止被防火墙/LB 断开）
        grpc.WithKeepaliveParams(keepalive.ClientParameters{
            Time:                10 * time.Second,
            Timeout:             3 * time.Second,
            PermitWithoutStream: true,
        }),
    )
    if err != nil {
        return nil, nil, err
    }
    client := pb.NewUserServiceClient(conn)
    return client, func() { conn.Close() }, nil
}

// 带超时的 Unary 调用
func getUser(client pb.UserServiceClient, userID int64) (*pb.GetUserResponse, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // 发送认证 token
    ctx = metadata.AppendToOutgoingContext(ctx,
        "authorization", "Bearer "+getCurrentToken())

    resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: userID})
    if err != nil {
        // 解析 gRPC 错误
        if st, ok := status.FromError(err); ok {
            switch st.Code() {
            case codes.NotFound:
                return nil, fmt.Errorf("user not found")
            case codes.DeadlineExceeded:
                return nil, fmt.Errorf("request timeout")
            }
        }
        return nil, err
    }
    return resp, nil
}

// Server Streaming 客户端消费
func listAllUsers(client pb.UserServiceClient) ([]*pb.ListUsersResponse, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    stream, err := client.ListUsers(ctx, &pb.ListUsersRequest{PageSize: 50})
    if err != nil {
        return nil, err
    }

    var users []*pb.ListUsersResponse
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            return users, nil
        }
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| gRPC 相比 REST 的优势？ | 二进制 protobuf（体积小 3-10x）；强类型契约（.proto 文件）；双向流；内置 deadline/cancel 传播；HTTP/2 多路复用 |
| `UnimplementedXxxServer` 为什么必须嵌入？ | 保证向前兼容：新增 RPC 方法时，未实现的方法返回 `Unimplemented`；不嵌入则编译时报错（缺少接口方法） |
| gRPC 拦截器和 HTTP 中间件的区别？ | 本质相同（责任链模式）；gRPC 分 Unary 和 Stream 两种；`grpc.ChainUnaryInterceptor` 保证 LIFO 调用顺序；Stream 拦截器需用 `grpc_middleware` 包装 |
| `metadata` 和 HTTP Header 的对应关系？ | gRPC metadata 是键值对（类似 HTTP Header）；客户端用 `metadata.AppendToOutgoingContext` 发送；服务端用 `metadata.FromIncomingContext` 读取 |
| gRPC 如何实现重试？ | Service Config 中配置 `retryPolicy`（Go 1.8+ 支持）；指定 `retryableStatusCodes`；客户端自动按 `initialBackoff × backoffMultiplier^n` 退避重试 |
| gRPC 健康检查如何实现？ | 实现 `grpc.health.v1.Health` 服务（`health.NewServer()`）；Kubernetes readinessProbe 可直接调用；`grpc_health_probe` CLI 工具测试 |
