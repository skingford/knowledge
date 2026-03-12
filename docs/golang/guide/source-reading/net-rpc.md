---
title: net/rpc 源码精读
description: 精读 net/rpc 的远程过程调用实现，掌握 gob 编解码、并发调用、服务注册机制与现代 gRPC 的对比演进。
---

# net/rpc：远程过程调用源码精读

> 核心源码：`src/net/rpc/server.go`、`src/net/rpc/client.go`

## 包结构图

```
net/rpc 体系
══════════════════════════════════════════════════════════════════

  服务端架构：
  Server
  ├── serviceMap sync.Map         ← 注册的服务（name → *service）
  └── service
       ├── name   string          ← 服务名（结构体类型名）
       ├── rcvr   reflect.Value   ← 服务实例（接收者）
       └── method map[string]*methodType  ← 导出方法表

  方法注册条件（4 条缺一不可）：
  ├── 1. 方法必须是导出的（大写字母开头）
  ├── 2. 恰好 2 个参数（args, reply）
  ├── 3. 第二个参数必须是指针
  └── 4. 返回值只有 1 个（error）

  客户端架构：
  Client
  ├── codec ClientCodec  ← 编解码器（gob/json/自定义）
  ├── mutex sync.Mutex
  ├── seq   uint64       ← 递增请求序列号
  └── pending map[uint64]*Call  ← 等待响应的调用

  Call（单次 RPC 调用）：
  ├── ServiceMethod string  ← "Service.Method"
  ├── Args   any            ← 请求参数
  ├── Reply  any            ← 响应（指针）
  ├── Error  error
  └── Done   chan *Call      ← 完成信号

  请求/响应编码（默认 gob）：
  ┌─────────────────────────────────────────────────┐
  │  Request{ServiceMethod, Seq}                    │
  │  + Args（用户参数）                              │
  │  ──────────────── 发送 ─────────────────────►   │
  │  ◄─────────────── 接收 ──────────────────────   │
  │  Response{ServiceMethod, Seq, Error}            │
  │  + Reply（用户响应）                             │
  └─────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/net/rpc/server.go（简化）
type Server struct {
    serviceMap sync.Map // map[string]*service
}

// Register：注册服务（反射提取导出方法）
func (server *Server) Register(rcvr any) error {
    s := new(service)
    s.rcvr = reflect.ValueOf(rcvr)
    s.typ = reflect.TypeOf(rcvr)
    s.name = s.typ.Elem().Name() // 结构体名

    // 遍历所有方法，筛选符合条件的
    s.method = suitableMethods(s.typ, true)
    server.serviceMap.Store(s.name, s)
    return nil
}

// ServeConn：处理单个连接（每条消息一个 goroutine）
func (server *Server) ServeConn(conn io.ReadWriteCloser) {
    codec := gob.NewCodec(conn) // 默认 gob 编解码
    server.ServeCodec(codec)
}

func (server *Server) ServeCodec(codec ServerCodec) {
    for {
        req, svc, mtype, _ := server.readRequest(codec)
        go svc.call(server, req, mtype, codec) // 每个请求独立 goroutine
    }
}

// src/net/rpc/client.go
// Go：异步调用
func (client *Client) Go(sm string, args, reply any, done chan *Call) *Call {
    call := &Call{ServiceMethod: sm, Args: args, Reply: reply, Done: done}
    client.send(call) // 编码并发送请求
    return call
}

// Call：同步调用（等待 Go 完成）
func (client *Client) Call(sm string, args, reply any) error {
    call := <-client.Go(sm, args, reply, make(chan *Call, 1)).Done
    return call.Error
}
```

---

## 二、代码示例

### 定义服务并注册

```go
// 服务必须满足：导出方法、两个参数（args + *reply）、返回 error
type MathService struct{}

type AddArgs struct {
    A, B int
}

// ✅ 符合 net/rpc 要求：导出方法、正确签名
func (s *MathService) Add(args *AddArgs, reply *int) error {
    *reply = args.A + args.B
    return nil
}

func (s *MathService) Divide(args *AddArgs, reply *float64) error {
    if args.B == 0 {
        return errors.New("除数不能为零")
    }
    *reply = float64(args.A) / float64(args.B)
    return nil
}

// ❌ 不符合：未导出方法（小写）
func (s *MathService) hidden(args *AddArgs, reply *int) error { return nil }

// ❌ 不符合：reply 不是指针
func (s *MathService) Bad(args *AddArgs, reply int) error { return nil }
```

### 服务端启动

```go
func startServer(addr string) {
    server := rpc.NewServer()

    // 注册服务
    if err := server.Register(&MathService{}); err != nil {
        log.Fatal(err)
    }

    // TCP 监听
    listener, err := net.Listen("tcp", addr)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("RPC 服务启动在 %s", addr)

    for {
        conn, err := listener.Accept()
        if err != nil {
            log.Println(err)
            continue
        }
        go server.ServeConn(conn) // 每个连接独立 goroutine
    }
}

// 使用包级默认 Server（更简单）
func startDefaultServer() {
    rpc.Register(&MathService{})
    rpc.HandleHTTP() // 注册到默认 HTTP Mux（支持 /debug/rpc）
    log.Fatal(http.ListenAndServe(":1234", nil))
}
```

### 客户端同步调用

```go
func syncClient(addr string) {
    client, err := rpc.Dial("tcp", addr)
    if err != nil {
        log.Fatal("连接失败:", err)
    }
    defer client.Close()

    // 同步调用
    args := &AddArgs{A: 10, B: 3}
    var result int
    if err := client.Call("MathService.Add", args, &result); err != nil {
        log.Fatal(err)
    }
    fmt.Printf("10 + 3 = %d\n", result)

    var quotient float64
    if err := client.Call("MathService.Divide", args, &quotient); err != nil {
        fmt.Printf("错误: %v\n", err) // 0 除以 3
    }
}
```

### 客户端异步调用（批量并发）

```go
func asyncClient(addr string) {
    client, _ := rpc.Dial("tcp", addr)
    defer client.Close()

    // 并发发起多个 RPC 调用
    type result struct {
        val int
        err error
    }

    calls := make([]*rpc.Call, 10)
    results := make([]int, 10)

    // 发起所有调用（不等待）
    for i := 0; i < 10; i++ {
        args := &AddArgs{A: i, B: i * 2}
        calls[i] = client.Go("MathService.Add", args, &results[i], nil)
    }

    // 等待所有调用完成
    for i, call := range calls {
        <-call.Done // 阻塞直到完成
        if call.Error != nil {
            fmt.Printf("调用 %d 失败: %v\n", i, call.Error)
        } else {
            fmt.Printf("结果 %d: %d\n", i, results[i])
        }
    }
}
```

### 使用 JSON 编解码（替代 gob）

```go
// net/rpc/jsonrpc 子包：使用 JSON-RPC 2.0 协议
import "net/rpc/jsonrpc"

// 服务端
func startJSONServer() {
    rpc.Register(&MathService{})
    listener, _ := net.Listen("tcp", ":1235")
    for {
        conn, _ := listener.Accept()
        go jsonrpc.ServeConn(conn) // 使用 JSON 编码
    }
}

// 客户端
func jsonClient() {
    client, _ := jsonrpc.Dial("tcp", "localhost:1235")
    defer client.Close()

    var result int
    client.Call("MathService.Add", &AddArgs{A: 5, B: 3}, &result)
    fmt.Println(result) // 8
}

// JSON-RPC 协议格式：
// 请求：{"method":"MathService.Add","params":[{"A":5,"B":3}],"id":1}
// 响应：{"id":1,"result":8,"error":null}
```

### 连接池（生产环境）

```go
// net/rpc 每次 Dial 建立新连接，生产环境需要连接池
type RPCPool struct {
    mu      sync.Mutex
    clients []*rpc.Client
    addr    string
    maxSize int
}

func NewRPCPool(addr string, size int) (*RPCPool, error) {
    pool := &RPCPool{addr: addr, maxSize: size}
    for i := 0; i < size; i++ {
        c, err := rpc.Dial("tcp", addr)
        if err != nil {
            return nil, err
        }
        pool.clients = append(pool.clients, c)
    }
    return pool, nil
}

func (p *RPCPool) Get() *rpc.Client {
    p.mu.Lock()
    defer p.mu.Unlock()
    if len(p.clients) == 0 {
        c, _ := rpc.Dial("tcp", p.addr)
        return c
    }
    c := p.clients[0]
    p.clients = p.clients[1:]
    return c
}

func (p *RPCPool) Put(c *rpc.Client) {
    p.mu.Lock()
    defer p.mu.Unlock()
    if len(p.clients) >= p.maxSize {
        c.Close()
        return
    }
    p.clients = append(p.clients, c)
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| net/rpc 方法注册的四个条件？ | ① 方法导出（大写）② 恰好 2 个参数（args + reply）③ reply 必须是指针 ④ 只返回 error |
| net/rpc 如何处理并发请求？ | 服务端每个请求启动独立 goroutine；客户端用 `seq` 序列号区分响应，用 `pending` map + Mutex 管理在途调用 |
| net/rpc 默认用什么序列化格式？ | encoding/gob（Go 特有，高效但不跨语言）；可用 `jsonrpc` 子包换成 JSON（跨语言但较慢）|
| net/rpc 和 gRPC 的主要区别？ | net/rpc：简单、gob 编码、不跨语言、无流式支持；gRPC：protobuf 跨语言、支持双向流、HTTP/2、有服务发现集成 |
| `client.Go` 返回的 `*Call.Done` 是什么？ | 容量为 1 的 buffered channel；调用完成时写入 `*Call` 本身；`<-call.Done` 阻塞等待完成 |
| 为什么生产环境不推荐 net/rpc？ | 无负载均衡、无服务发现、无超时控制（需手动实现）、不跨语言；推荐 gRPC 或 Twirp |
