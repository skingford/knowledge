---
title: net 包源码精读
description: 精读 net.Conn/Listener 接口设计、TCP 拨号流程与 netpoller（epoll/kqueue）集成机制。
---

# net：网络层源码精读

> 核心源码：`src/net/net.go`、`src/net/dial.go`、`src/net/tcpsock.go`、`src/internal/poll/`

## 包结构图

```
net 包架构分层
══════════════════════════════════════════════════════════════════

  用户 API 层
  ├── net.Dial / net.DialContext    ← 客户端连接建立
  ├── net.Listen                   ← 服务端监听
  ├── net.Conn                     ← 连接通用接口
  ├── net.Listener                 ← 监听器通用接口
  └── net.Resolver                 ← DNS 解析（Go 自实现 + 系统 cgo）

  具体实现层
  ├── TCPConn / TCPListener        ← TCP
  ├── UDPConn                      ← UDP
  ├── UnixConn / UnixListener      ← Unix Domain Socket
  └── IPConn                       ← 原始 IP

  核心运行时层（非公开）
  ├── internal/poll.FD             ← fd 包装（读写/关闭/超时）
  ├── internal/poll.pollDesc       ← 与 runtime netpoller 的绑定点
  └── runtime.netpoll（per-OS）    ← epoll(Linux) / kqueue(macOS)

══════════════════════════════════════════════════════════════════
```

---

## 一、核心接口

```go
// src/net/net.go
type Conn interface {
    Read(b []byte) (n int, err error)
    Write(b []byte) (n int, err error)
    Close() error
    LocalAddr() Addr
    RemoteAddr() Addr
    SetDeadline(t time.Time) error      // 同时设置读写 deadline
    SetReadDeadline(t time.Time) error
    SetWriteDeadline(t time.Time) error
}

type Listener interface {
    Accept() (Conn, error)
    Close() error
    Addr() Addr
}

type Addr interface {
    Network() string // "tcp", "udp", "unix"...
    String() string  // "127.0.0.1:8080"
}
```

---

## 二、netpoller：异步 I/O 核心

```
Go 网络 I/O 事件驱动模型
══════════════════════════════════════════════════════════════════

  goroutine
  │  conn.Read(buf)
  │       │
  │       ▼
  │  poll.FD.Read()
  │       │
  │       ├── syscall.Read(fd) → EAGAIN（数据未就绪）
  │       │
  │       ├── pollDesc.waitRead()
  │       │       → runtime.gopark()   ← goroutine 挂起（非阻塞线程 M）
  │       │
  │       │   ┌─── 系统线程继续调度其他 goroutine ───────────────────┐
  │       │   │                                                      │
  │       │   │  netpoller（sysmon 或 findrunnable 时检查）          │
  │       │   │  └── epoll_wait / kqueue → fd 就绪事件               │
  │       │   │          → netpollunblock(pd)                        │
  │       │   │          → 对应 goroutine 放入可运行队列              │
  │       │   └──────────────────────────────────────────────────────┘
  │       │
  │       └── goroutine 唤醒 → 重新 syscall.Read(fd) → 读到数据
  │
  关键：Read 阻塞的是 goroutine，不是系统线程（M）
       → M 可去运行其他 goroutine → 极高的 I/O 并发能力

══════════════════════════════════════════════════════════════════
```

---

## 三、TCP 连接建立流程

```
net.DialContext("tcp", "host:port") 完整流程
══════════════════════════════════════════════════════════════════

  net.DialContext(ctx, "tcp", "example.com:80")
       │
       ▼
  resolver.resolveAddrList()    ← DNS 解析（并发 A + AAAA）
       │
       ▼
  sysDialer.dialParallel()      ← Happy Eyeballs（RFC 6555）
       │                           IPv6 先发，300ms 后 IPv4 并发
       │
       ├── sysDialer.dialSerial(ipv6 addrs)
       │       └── sysDialer.dialTCP(ctx, laddr, raddr)
       │               ├── socket(AF_INET6, SOCK_STREAM, ...)
       │               ├── setNonblock(fd)
       │               ├── connect(fd, addr)  ← 非阻塞，立即返回
       │               ├── poll.FD.Init() → 注册到 netpoller
       │               └── waitWrite() → 等 connect 完成事件
       │
       └── sysDialer.dialSerial(ipv4 addrs)（300ms 后若 v6 未成功）

  返回：*net.TCPConn（实现 net.Conn 接口）

══════════════════════════════════════════════════════════════════
```

---

## 四、net.Listen 与 Accept 流程

```
服务端监听流程
══════════════════════════════════════════════════════════════════

  net.Listen("tcp", ":8080")
       │
       ├── socket(AF_INET, SOCK_STREAM, ...)
       ├── setsockopt SO_REUSEADDR / SO_REUSEPORT
       ├── bind(fd, addr)
       ├── listen(fd, backlog)    ← backlog 控制 SYN 队列大小
       └── 返回 *net.TCPListener

  listener.Accept()
       │
       ├── poll.FD.Accept()
       │       ├── syscall.Accept4(lfd, ...) → EAGAIN（无新连接）
       │       └── waitRead() → gopark 等待
       │
       ├── 新连接到达 → epoll 通知 → goroutine 唤醒
       ├── Accept4 返回新 fd（connfd）
       ├── setNonblock(connfd)
       ├── poll.FD.Init(connfd) → 注册到 netpoller
       └── 返回 *net.TCPConn

══════════════════════════════════════════════════════════════════
```

---

## 五、Deadline 实现原理

```go
// SetDeadline 的底层实现
func (c *conn) SetDeadline(t time.Time) error {
    return c.fd.SetDeadline(t)
}

// poll.FD.SetDeadline → poll.setDeadlineImpl
// 内部机制：
// 1. 计算距 deadline 的纳秒数
// 2. 在 runtime 定时器堆中注册一个 timer
// 3. timer 到期时调用 runtime_pollSetDeadline
// 4. 将 poll.pollDesc 标记为超时
// 5. 唤醒等待该 fd 的 goroutine（返回 ErrDeadlineExceeded）
```

---

## 六、代码示例

### TCP 服务端（标准范式）

```go
func runServer(addr string) error {
    ln, err := net.Listen("tcp", addr)
    if err != nil {
        return fmt.Errorf("listen: %w", err)
    }
    defer ln.Close()

    for {
        conn, err := ln.Accept()
        if err != nil {
            // 判断是否是 listener 被关闭
            if errors.Is(err, net.ErrClosed) {
                return nil
            }
            log.Printf("accept error: %v", err)
            continue
        }
        go handleConn(conn) // 每个连接一个 goroutine
    }
}

func handleConn(conn net.Conn) {
    defer conn.Close()

    // 设置连接级别超时
    conn.SetDeadline(time.Now().Add(30 * time.Second))

    buf := make([]byte, 4096)
    for {
        conn.SetReadDeadline(time.Now().Add(10 * time.Second))
        n, err := conn.Read(buf)
        if err != nil {
            if errors.Is(err, os.ErrDeadlineExceeded) {
                log.Println("read timeout")
            }
            return
        }
        if _, err := conn.Write(buf[:n]); err != nil {
            return
        }
    }
}
```

### TCP 客户端（带超时与重试）

```go
func dialWithRetry(ctx context.Context, addr string, maxRetries int) (net.Conn, error) {
    dialer := &net.Dialer{
        Timeout:   5 * time.Second,    // 建连超时
        KeepAlive: 30 * time.Second,   // TCP keepalive
    }

    var lastErr error
    for i := range maxRetries {
        conn, err := dialer.DialContext(ctx, "tcp", addr)
        if err == nil {
            return conn, nil
        }
        lastErr = err
        backoff := time.Duration(1<<uint(i)) * 100 * time.Millisecond
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-time.After(backoff):
        }
    }
    return nil, fmt.Errorf("dial %s after %d retries: %w", addr, maxRetries, lastErr)
}
```

### UDP 收发

```go
// UDP 服务端
func udpServer(addr string) error {
    pc, err := net.ListenPacket("udp", addr)
    if err != nil {
        return err
    }
    defer pc.Close()

    buf := make([]byte, 65535)
    for {
        n, from, err := pc.ReadFrom(buf)
        if err != nil {
            return err
        }
        log.Printf("recv %d bytes from %s: %s", n, from, buf[:n])
        pc.WriteTo(buf[:n], from) // echo
    }
}
```

### 控制 SO_REUSEPORT（多进程监听同一端口）

```go
import "golang.org/x/net/netutil"

lc := net.ListenConfig{
    Control: func(network, address string, c syscall.RawConn) error {
        return c.Control(func(fd uintptr) {
            syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET,
                syscall.SO_REUSEPORT, 1)
        })
    },
}

ln, err := lc.Listen(ctx, "tcp", ":8080")
```

### 连接状态检测

```go
// 检测连接是否存活（TCP keepalive 之外的应用层心跳）
func isConnAlive(conn net.Conn) bool {
    // 设置极短的读超时，非阻塞地检测连接状态
    conn.SetReadDeadline(time.Now().Add(time.Millisecond))
    _, err := conn.Read(make([]byte, 1))
    conn.SetReadDeadline(time.Time{}) // 清除 deadline

    if err == nil {
        return true
    }
    if errors.Is(err, os.ErrDeadlineExceeded) {
        return true // 超时说明连接正常，只是没数据
    }
    return false // io.EOF 或其他错误说明连接已断
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Go 网络 I/O 为什么不阻塞系统线程？ | 底层用非阻塞 fd + netpoller（epoll/kqueue），I/O 未就绪时挂起 goroutine 而非线程 |
| net.Dial 的 Happy Eyeballs 是什么？ | 先尝试 IPv6，300ms 后若未成功并发尝试 IPv4，取先成功的连接（RFC 6555） |
| SetDeadline 和 SetTimeout 的区别？ | Go 用 deadline（绝对时间），没有 timeout（相对时间）概念；每次 I/O 前需重置 deadline |
| Accept 为什么不阻塞线程？ | listener fd 也注册到 netpoller，无新连接时 goroutine 挂起，新连接到来时 epoll 事件唤醒 |
| 如何处理 "too many open files"？ | 调大 ulimit -n；检查是否 Close() 泄漏；考虑连接池复用 |
| listen backlog 的作用？ | 控制 SYN 队列（半连接）+ accept 队列大小，队列满后新连接被丢弃或发 RST |
