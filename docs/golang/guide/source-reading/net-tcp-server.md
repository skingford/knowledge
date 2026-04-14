---
title: 自定义 TCP 协议服务器源码精读
description: 精读 net 包的 TCP 服务器实现，掌握二进制帧协议设计、连接生命周期管理、优雅关闭与高并发连接池最佳实践。
---

# 自定义 TCP 协议服务器：源码精读

> 核心源码：`src/net/net.go`、`src/net/tcpsock.go`、`src/net/server.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`tcp-frame-lifecycle`

## 包结构图

```
net TCP 服务器体系
══════════════════════════════════════════════════════════════════

  net.Listener（监听器）
  ├── net.Listen("tcp", ":8080")   ← 创建 TCP 监听
  ├── Accept() (Conn, error)        ← 阻塞等待新连接
  └── Close()                       ← 停止监听（触发 Accept 返回 error）

  net.Conn（连接接口）
  ├── Read(b []byte) (n int, err)   ← 读字节流
  ├── Write(b []byte) (n int, err)  ← 写字节流
  ├── Close()                       ← 关闭连接
  ├── SetDeadline(t time.Time)      ← 设置读写超时
  ├── SetReadDeadline(t time.Time)  ← 仅设读超时
  └── SetWriteDeadline(t time.Time) ← 仅设写超时

  二进制帧协议（Length-Prefix Framing）：
  ┌─────────────────────────────────────────┐
  │ Magic(2B) │ Type(1B) │ Len(4B) │ Payload │
  └─────────────────────────────────────────┘
  magic=0xDEAD  type=请求/响应/心跳  len=payload 字节数

  连接生命周期：
  Accept → TLS握手 → 认证 → 请求循环 → 超时/错误 → Close

  优雅关闭流程：
  1. listener.Close()  ← 停止接受新连接
  2. 等待现有 goroutine 完成（sync.WaitGroup）
  3. 超时强制关闭（context.WithTimeout）

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="tcp-frame-lifecycle" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// 二进制帧协议定义
// Header = Magic(2) + Type(1) + Reserved(1) + Length(4) = 8 字节
const (
    Magic       = uint16(0xDEAD)
    HeaderSize  = 8

    TypeRequest   = byte(0x01)
    TypeResponse  = byte(0x02)
    TypeHeartbeat = byte(0x03)
    TypeError     = byte(0xFF)
)

type Frame struct {
    Type    byte
    Payload []byte
}

// 编码帧（写入网络）
func encodeFrame(f Frame) []byte {
    buf := make([]byte, HeaderSize+len(f.Payload))
    binary.BigEndian.PutUint16(buf[0:2], Magic)
    buf[2] = f.Type
    buf[3] = 0 // reserved
    binary.BigEndian.PutUint32(buf[4:8], uint32(len(f.Payload)))
    copy(buf[8:], f.Payload)
    return buf
}

// 解码帧（从网络读取）
func readFrame(r io.Reader) (Frame, error) {
    header := make([]byte, HeaderSize)
    if _, err := io.ReadFull(r, header); err != nil {
        return Frame{}, err
    }

    magic := binary.BigEndian.Uint16(header[0:2])
    if magic != Magic {
        return Frame{}, fmt.Errorf("invalid magic: %x", magic)
    }

    frameType := header[2]
    payloadLen := binary.BigEndian.Uint32(header[4:8])

    // 防止超大帧攻击
    const maxPayload = 4 << 20 // 4MB
    if payloadLen > maxPayload {
        return Frame{}, fmt.Errorf("payload too large: %d", payloadLen)
    }

    payload := make([]byte, payloadLen)
    if _, err := io.ReadFull(r, payload); err != nil {
        return Frame{}, err
    }

    return Frame{Type: frameType, Payload: payload}, nil
}
```
:::

---

## 二、代码示例

### 基础 TCP 服务器

::: details 点击展开代码：基础 TCP 服务器
```go
import (
    "bufio"
    "context"
    "encoding/binary"
    "fmt"
    "io"
    "log"
    "net"
    "sync"
    "time"
)

type Server struct {
    addr     string
    listener net.Listener
    wg       sync.WaitGroup
    ctx      context.Context
    cancel   context.CancelFunc

    // 处理器映射（请求类型 → 处理函数）
    handlers map[byte]HandlerFunc
}

type HandlerFunc func(payload []byte) ([]byte, error)

func NewServer(addr string) *Server {
    ctx, cancel := context.WithCancel(context.Background())
    return &Server{
        addr:     addr,
        ctx:      ctx,
        cancel:   cancel,
        handlers: make(map[byte]HandlerFunc),
    }
}

func (s *Server) Register(msgType byte, h HandlerFunc) {
    s.handlers[msgType] = h
}

func (s *Server) Start() error {
    ln, err := net.Listen("tcp", s.addr)
    if err != nil {
        return fmt.Errorf("listen: %w", err)
    }
    s.listener = ln
    log.Printf("TCP server listening on %s", s.addr)

    s.wg.Add(1)
    go s.acceptLoop()
    return nil
}

func (s *Server) acceptLoop() {
    defer s.wg.Done()
    for {
        conn, err := s.listener.Accept()
        if err != nil {
            // listener 关闭时正常退出
            select {
            case <-s.ctx.Done():
                return
            default:
                log.Printf("Accept error: %v", err)
                return
            }
        }

        s.wg.Add(1)
        go s.handleConn(conn)
    }
}

func (s *Server) handleConn(conn net.Conn) {
    defer s.wg.Done()
    defer conn.Close()

    remoteAddr := conn.RemoteAddr().String()
    log.Printf("New connection from %s", remoteAddr)
    defer log.Printf("Connection closed: %s", remoteAddr)

    // 使用 bufio 减少系统调用
    br := bufio.NewReaderSize(conn, 64*1024)

    for {
        // 每次读取前重设超时（idle timeout = 30s）
        conn.SetReadDeadline(time.Now().Add(30 * time.Second))

        frame, err := readFrame(br)
        if err != nil {
            if err != io.EOF {
                log.Printf("Read error from %s: %v", remoteAddr, err)
            }
            return
        }

        // 检查是否需要关闭
        select {
        case <-s.ctx.Done():
            return
        default:
        }

        if err := s.processFrame(conn, frame); err != nil {
            log.Printf("Process error from %s: %v", remoteAddr, err)
            return
        }
    }
}

func (s *Server) processFrame(conn net.Conn, frame Frame) error {
    switch frame.Type {
    case TypeHeartbeat:
        // 心跳直接回复
        resp := encodeFrame(Frame{Type: TypeHeartbeat, Payload: []byte("pong")})
        conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
        _, err := conn.Write(resp)
        return err

    case TypeRequest:
        handler, ok := s.handlers[frame.Payload[0]] // 第一字节为子命令
        if !ok {
            return s.sendError(conn, "unknown command")
        }

        result, err := handler(frame.Payload[1:])
        if err != nil {
            return s.sendError(conn, err.Error())
        }

        resp := encodeFrame(Frame{Type: TypeResponse, Payload: result})
        conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
        _, err = conn.Write(resp)
        return err

    default:
        return fmt.Errorf("unknown frame type: %x", frame.Type)
    }
}

func (s *Server) sendError(conn net.Conn, msg string) error {
    resp := encodeFrame(Frame{Type: TypeError, Payload: []byte(msg)})
    conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
    _, err := conn.Write(resp)
    return err
}

// Shutdown 优雅关闭
func (s *Server) Shutdown(timeout time.Duration) error {
    // 1. 停止接受新连接
    s.cancel()
    s.listener.Close()

    // 2. 等待现有连接完成（带超时）
    done := make(chan struct{})
    go func() {
        s.wg.Wait()
        close(done)
    }()

    select {
    case <-done:
        log.Println("Server gracefully stopped")
        return nil
    case <-time.After(timeout):
        return fmt.Errorf("shutdown timeout after %v", timeout)
    }
}
```
:::

### 完整使用示例（服务端）

::: details 点击展开代码：完整使用示例（服务端）
```go
func main() {
    srv := NewServer(":9090")

    // 注册业务处理器
    srv.Register(0x01, func(payload []byte) ([]byte, error) {
        // 命令 0x01: echo
        return payload, nil
    })
    srv.Register(0x02, func(payload []byte) ([]byte, error) {
        // 命令 0x02: 查询
        return []byte("query result: " + string(payload)), nil
    })

    if err := srv.Start(); err != nil {
        log.Fatal(err)
    }

    // 等待退出信号
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    if err := srv.Shutdown(10 * time.Second); err != nil {
        log.Printf("Shutdown error: %v", err)
    }
}
```
:::

### TCP 客户端（连接池版本）

::: details 点击展开代码：TCP 客户端（连接池版本）
```go
// 连接池：复用 TCP 连接（减少三次握手开销）
type ConnPool struct {
    addr    string
    pool    chan net.Conn
    maxConn int
    mu      sync.Mutex
}

func NewConnPool(addr string, maxConn int) *ConnPool {
    return &ConnPool{
        addr:    addr,
        pool:    make(chan net.Conn, maxConn),
        maxConn: maxConn,
    }
}

func (p *ConnPool) Get() (net.Conn, error) {
    // 优先从池中取
    select {
    case conn := <-p.pool:
        // 快速检查连接是否存活（设 0 超时读取）
        conn.SetReadDeadline(time.Now())
        buf := make([]byte, 1)
        _, err := conn.Read(buf)
        conn.SetReadDeadline(time.Time{}) // 重置
        if err == nil || isTimeout(err) {
            return conn, nil // 连接健康
        }
        conn.Close() // 连接已断开，丢弃
        return p.dial()
    default:
        return p.dial()
    }
}

func (p *ConnPool) Put(conn net.Conn) {
    select {
    case p.pool <- conn:
        // 放回池中
    default:
        conn.Close() // 池已满，直接关闭
    }
}

func (p *ConnPool) dial() (net.Conn, error) {
    return net.DialTimeout("tcp", p.addr, 5*time.Second)
}

func isTimeout(err error) bool {
    netErr, ok := err.(net.Error)
    return ok && netErr.Timeout()
}

// 客户端发送请求
type Client struct {
    pool *ConnPool
}

func (c *Client) Send(msgType byte, payload []byte) ([]byte, error) {
    conn, err := c.pool.Get()
    if err != nil {
        return nil, fmt.Errorf("get conn: %w", err)
    }

    req := encodeFrame(Frame{Type: TypeRequest, Payload: append([]byte{msgType}, payload...)})
    conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
    if _, err := conn.Write(req); err != nil {
        conn.Close()
        return nil, fmt.Errorf("write: %w", err)
    }

    conn.SetReadDeadline(time.Now().Add(10 * time.Second))
    resp, err := readFrame(bufio.NewReader(conn))
    if err != nil {
        conn.Close()
        return nil, fmt.Errorf("read: %w", err)
    }

    c.pool.Put(conn) // 读取完成后放回池
    if resp.Type == TypeError {
        return nil, fmt.Errorf("server error: %s", resp.Payload)
    }
    return resp.Payload, nil
}
```
:::

### TLS 加密 TCP 服务器

::: details 点击展开代码：TLS 加密 TCP 服务器
```go
// TLS 版本（生产推荐）
func StartTLSServer(addr, certFile, keyFile string) error {
    cert, err := tls.LoadX509KeyPair(certFile, keyFile)
    if err != nil {
        return err
    }

    tlsCfg := &tls.Config{
        Certificates: []tls.Certificate{cert},
        MinVersion:   tls.VersionTLS13, // 强制 TLS 1.3
        // 指定允许的 ALPN 协议
        NextProtos: []string{"myproto/1.0"},
    }

    ln, err := tls.Listen("tcp", addr, tlsCfg)
    if err != nil {
        return err
    }
    defer ln.Close()

    for {
        conn, err := ln.Accept()
        if err != nil {
            return err
        }
        go handleTLSConn(conn.(*tls.Conn))
    }
}

func handleTLSConn(conn *tls.Conn) {
    defer conn.Close()

    // 完成 TLS 握手（显式调用确保错误可见）
    conn.SetDeadline(time.Now().Add(10 * time.Second))
    if err := conn.Handshake(); err != nil {
        log.Printf("TLS handshake failed: %v", err)
        return
    }
    conn.SetDeadline(time.Time{}) // 握手后重置

    // 验证客户端协议
    state := conn.ConnectionState()
    log.Printf("Client connected: protocol=%s, cipher=%s",
        state.NegotiatedProtocol,
        tls.CipherSuiteName(state.CipherSuite),
    )

    // 后续同 TCP 处理
}
```
:::

### 心跳检测机制

::: details 点击展开代码：心跳检测机制
```go
// 服务端：检测僵尸连接（TCP KeepAlive + 应用层心跳双保险）
func setupKeepAlive(conn net.Conn) {
    if tc, ok := conn.(*net.TCPConn); ok {
        tc.SetKeepAlive(true)
        tc.SetKeepAlivePeriod(30 * time.Second) // 30s 无数据则发 TCP 探针
    }
}

// 客户端：定期发送应用层心跳
type HeartbeatClient struct {
    conn     net.Conn
    interval time.Duration
    done     chan struct{}
}

func (h *HeartbeatClient) Start() {
    go func() {
        ticker := time.NewTicker(h.interval)
        defer ticker.Stop()
        for {
            select {
            case <-ticker.C:
                req := encodeFrame(Frame{Type: TypeHeartbeat, Payload: []byte("ping")})
                h.conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
                if _, err := h.conn.Write(req); err != nil {
                    log.Printf("Heartbeat failed, reconnecting: %v", err)
                    return
                }
            case <-h.done:
                return
            }
        }
    }()
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| TCP 粘包/拆包如何解决？ | 使用 Length-Prefix 帧：先读固定长度 Header 获取 payload 长度，再 `io.ReadFull` 读取完整 payload；禁止直接用 `Read` 期望读满 |
| `io.ReadFull` 和 `Read` 的区别？ | `Read` 返回任意正数字节即可（最少 1 字节）；`ReadFull` 保证读满 n 字节或返回 error，TCP 服务必须用 `ReadFull` |
| 如何防止慢连接/空闲连接耗尽资源？ | 双保险：TCP KeepAlive（OS 层）+ 应用层 SetReadDeadline idle timeout；每次 Read 前重置 deadline |
| 连接池中如何判断连接是否存活？ | 设 0 超时执行非阻塞 Read：若返回 timeout 则连接存活；若返回 EOF/reset 则连接已断；放入池前和取出后各检查一次 |
| 优雅关闭的正确步骤？ | ① `listener.Close()` 停止 Accept → ② `context.Cancel()` 通知 handler 停止 → ③ `WaitGroup.Wait()` 等待现有连接处理完 → ④ 超时强制退出 |
| 为什么用 `bufio.Reader` 包装 `net.Conn`？ | TCP 每次 Read 可能是系统调用；`bufio` 将小片读取批量化到用户空间缓冲区，减少系统调用次数；不影响 deadline 语义 |
