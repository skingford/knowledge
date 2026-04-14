---
title: crypto/tls 源码精读
description: 精读 crypto/tls 的握手流程、证书验证、客户端/服务端配置，掌握 mTLS、会话复用与 HTTPS 安全最佳实践。
---

# crypto/tls：TLS 实现源码精读

> 核心源码：`src/crypto/tls/conn.go`、`src/crypto/tls/handshake_client.go`
>
> 图例参考：
> - `GoSecurityDiagram`：`tls-mtls`
> - `GoSecurityDiagram`：`certificate-chain-verify`

## 包结构图

```
crypto/tls 体系
══════════════════════════════════════════════════════════════════

  TLS 1.3 握手流程（简化）：
  Client                              Server
  ─────                              ──────
  ClientHello (支持的套件/版本)  →
                                ← ServerHello (选定套件)
                                ← Certificate (服务端证书)
                                ← CertificateVerify
                                ← Finished (MAC)
  Finished (MAC)               →
  ══ 握手完成，开始加密通信 ══

  核心类型：
  ├── *tls.Config           ← 连接配置（复用，goroutine 安全）
  │    ├── Certificates     ← 服务端/客户端证书列表
  │    ├── RootCAs          ← 信任的 CA（客户端验证服务端）
  │    ├── ClientCAs        ← 信任的 CA（服务端验证客户端，mTLS）
  │    ├── ClientAuth       ← 客户端认证策略
  │    ├── InsecureSkipVerify ← ⚠️ 跳过证书验证（仅测试）
  │    ├── MinVersion       ← 最低 TLS 版本（建议 TLS 1.2）
  │    └── SessionTicketsDisabled ← 关闭会话票据复用
  │
  ├── *tls.Conn             ← 包装 net.Conn，实现加密读写
  │    ├── Handshake()      ← 显式触发握手（否则首次 Read/Write 触发）
  │    ├── ConnectionState() ← 获取握手后的状态（证书、版本等）
  │    └── VerifyHostname() ← 验证主机名（Handshake 后可用）
  │
  └── 证书加载：
       tls.LoadX509KeyPair(certFile, keyFile)  ← 从文件加载
       tls.X509KeyPair(certPEM, keyPEM)        ← 从内存加载

  会话复用机制：
  TLS 1.2 → Session ID / Session Ticket（服务端加密状态）
  TLS 1.3 → PSK（Pre-Shared Key）+ 0-RTT（早期数据）

══════════════════════════════════════════════════════════════════
```

<GoSecurityDiagram kind="tls-mtls" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/crypto/tls/conn.go（简化）

type Conn struct {
    conn     net.Conn        // 底层连接
    config   *Config
    isClient bool
    // 握手状态
    handshakeComplete atomic.Bool
    // 加密状态
    in, out  halfConn        // 读写各有独立的密钥和序列号
    input    bytes.Reader    // 解密后数据缓冲
}

// Read：解密 TLS 记录层数据
func (c *Conn) Read(b []byte) (int, error) {
    if !c.handshakeComplete.Load() {
        if err := c.Handshake(); err != nil {
            return 0, err
        }
    }
    // 从解密缓冲读取；不足则从 conn 读取新的 TLS record
    return c.input.Read(b)
}

// 证书验证（客户端握手）：
// 1. 解析服务端 Certificate 消息
// 2. 构建证书链，验证签名
// 3. 检查 ServerName（SNI）与证书 CN/SAN 匹配
// 4. 检查证书有效期和吊销状态（OCSP）
```
:::

<GoSecurityDiagram kind="certificate-chain-verify" />

---

## 二、代码示例

### HTTPS 服务端

::: details 点击展开代码：HTTPS 服务端
```go
import (
    "crypto/tls"
    "net/http"
)

func startHTTPS() {
    cert, err := tls.LoadX509KeyPair("server.crt", "server.key")
    if err != nil {
        log.Fatal(err)
    }

    cfg := &tls.Config{
        Certificates: []tls.Certificate{cert},
        MinVersion:   tls.VersionTLS12,       // 禁止 TLS 1.0/1.1
        CipherSuites: []uint16{               // 指定安全套件
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305,
        },
        // TLS 1.3 自动选择最佳套件，无需手动配置
    }

    server := &http.Server{
        Addr:      ":443",
        TLSConfig: cfg,
        // 生产建议设置超时
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // ListenAndServeTLS 内部使用 tls.NewListener 包装
    log.Fatal(server.ListenAndServeTLS("", "")) // 证书已在 Config 中
}
```
:::

### HTTPS 客户端（自定义 CA）

::: details 点击展开代码：HTTPS 客户端（自定义 CA）
```go
import (
    "crypto/tls"
    "crypto/x509"
    "net/http"
    "os"
)

// 信任自签名证书（内网服务）
func newHTTPSClient(caCertFile string) *http.Client {
    caCert, err := os.ReadFile(caCertFile)
    if err != nil {
        log.Fatal(err)
    }

    pool := x509.NewCertPool()
    pool.AppendCertsFromPEM(caCert)

    tlsCfg := &tls.Config{
        RootCAs: pool, // 仅信任指定 CA，不信任系统 CA
    }

    return &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: tlsCfg,
        },
        Timeout: 10 * time.Second,
    }
}
```
:::

### mTLS：双向证书认证

::: details 点击展开代码：mTLS：双向证书认证
```go
// 服务端：要求客户端提供证书
func mTLSServer(serverCert, caCert string) *http.Server {
    // 加载服务端证书
    cert, _ := tls.LoadX509KeyPair(serverCert+".crt", serverCert+".key")

    // 加载信任的客户端 CA
    caCertPEM, _ := os.ReadFile(caCert)
    clientCAs := x509.NewCertPool()
    clientCAs.AppendCertsFromPEM(caCertPEM)

    return &http.Server{
        TLSConfig: &tls.Config{
            Certificates: []tls.Certificate{cert},
            ClientCAs:    clientCAs,
            ClientAuth:   tls.RequireAndVerifyClientCert, // 强制 mTLS
        },
    }
}

// 客户端：携带证书
func mTLSClient(clientCert, caCert string) *http.Client {
    cert, _ := tls.LoadX509KeyPair(clientCert+".crt", clientCert+".key")

    caCertPEM, _ := os.ReadFile(caCert)
    rootCAs := x509.NewCertPool()
    rootCAs.AppendCertsFromPEM(caCertPEM)

    return &http.Client{
        Transport: &http.Transport{
            TLSClientConfig: &tls.Config{
                Certificates: []tls.Certificate{cert}, // 客户端证书
                RootCAs:      rootCAs,
            },
        },
    }
}
```
:::

### 从内存加载证书（embed + 热更新）

::: details 点击展开代码：从内存加载证书（embed + 热更新）
```go
//go:embed certs/server.crt certs/server.key
var certFS embed.FS

// 从 embed 加载证书（适合单二进制部署）
func loadEmbeddedCert() tls.Certificate {
    certPEM, _ := certFS.ReadFile("certs/server.crt")
    keyPEM, _ := certFS.ReadFile("certs/server.key")
    cert, err := tls.X509KeyPair(certPEM, keyPEM)
    if err != nil {
        log.Fatal(err)
    }
    return cert
}

// 动态加载证书（支持热更新，无需重启）
func dynamicCertConfig(getCert func(*tls.ClientHelloInfo) (*tls.Certificate, error)) *tls.Config {
    return &tls.Config{
        // GetCertificate 在每次握手时调用，可返回不同证书
        GetCertificate: getCert,
    }
}
```
:::

### 检查握手结果

::: details 点击展开代码：检查握手结果
```go
// 验证连接的 TLS 状态（审计、日志）
func inspectTLS(conn *tls.Conn) {
    // Handshake() 显式触发（否则第一次 Read/Write 触发）
    if err := conn.Handshake(); err != nil {
        log.Fatal(err)
    }

    state := conn.ConnectionState()
    fmt.Printf("TLS 版本: %x\n", state.Version)          // 0x0304 = TLS 1.3
    fmt.Printf("加密套件: %x\n", state.CipherSuite)
    fmt.Printf("服务端证书颁发者: %s\n",
        state.PeerCertificates[0].Issuer.CommonName)
    fmt.Printf("证书过期时间: %s\n",
        state.PeerCertificates[0].NotAfter)

    // 检查证书即将过期（监控告警）
    expiry := state.PeerCertificates[0].NotAfter
    if time.Until(expiry) < 30*24*time.Hour {
        log.Printf("⚠️ 证书将在 %v 后过期", time.Until(expiry))
    }
}
```
:::

### 原始 TLS 连接（非 HTTP）

::: details 点击展开代码：原始 TLS 连接（非 HTTP）
```go
// TCP + TLS 服务端（自定义协议）
func rawTLSServer() {
    cert, _ := tls.LoadX509KeyPair("server.crt", "server.key")
    cfg := &tls.Config{Certificates: []tls.Certificate{cert}}

    ln, err := tls.Listen("tcp", ":8443", cfg)
    if err != nil {
        log.Fatal(err)
    }

    for {
        conn, _ := ln.Accept()
        go handleTLSConn(conn.(*tls.Conn))
    }
}

// 客户端连接
func rawTLSClient(host string) {
    conn, err := tls.Dial("tcp", host+":8443", &tls.Config{
        ServerName: host, // SNI
    })
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    conn.Write([]byte("hello\n"))
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| TLS 1.3 相比 TLS 1.2 的主要改进？ | 握手轮次从 2-RTT 减为 1-RTT；移除不安全套件（RSA 密钥交换、RC4 等）；支持 0-RTT 早期数据 |
| `InsecureSkipVerify: true` 的风险？ | 完全跳过证书验证，极易遭受中间人攻击；仅允许用于本地测试，生产禁止 |
| 如何实现证书热更新不重启？ | 使用 `GetCertificate` 函数替代静态 `Certificates`，每次握手动态返回最新证书 |
| mTLS 的适用场景？ | 微服务间认证（服务网格）、零信任网络、B2B API 访问控制；比 Token 认证更强（私钥无法伪造） |
| TLS 会话复用的原理？ | TLS 1.2 用 Session Ticket（服务端加密保存状态给客户端）；TLS 1.3 用 PSK + NewSessionTicket 消息 |
| `tls.Config` 可以复用吗？ | 可以且应该；Config 是 goroutine 安全的；每次创建 Config 有开销，应全局复用 |
