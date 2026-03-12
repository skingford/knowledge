---
title: crypto/tls 源码精读
description: 精读 Go crypto/tls 的 TLS 1.3 握手流程、证书验证链与 HTTPS 客户端/服务端的底层实现。
---

# crypto/tls：TLS 实现源码精读

> 核心源码：`src/crypto/tls/conn.go`、`src/crypto/tls/handshake_client_tls13.go`、`src/crypto/tls/handshake_server_tls13.go`

## 包结构图

```
crypto/tls 架构
══════════════════════════════════════════════════════════════════

  用户 API 层
  ├── tls.Dial(network, addr, config)     ← 客户端建立 TLS 连接
  ├── tls.Listen(network, laddr, config)  ← 服务端监听
  ├── tls.NewClientConn(conn, config)     ← 在已有连接上升级 TLS
  └── tls.NewServerConn(conn, config)     ← 服务端 TLS 升级

  核心类型
  ├── tls.Config    ← TLS 配置（证书、版本、密码套件等）
  ├── tls.Conn      ← TLS 连接（实现 net.Conn）
  ├── tls.Certificate ← 证书与私钥
  └── tls.ConnectionState ← 连接完成后的状态信息

  密码原语层（crypto 子包）
  ├── crypto/aes    ← AES 加密（GCM 模式）
  ├── crypto/ecdh   ← 椭圆曲线 Diffie-Hellman
  ├── crypto/ecdsa  ← 椭圆曲线数字签名
  ├── crypto/rsa    ← RSA 加解密/签名
  ├── crypto/sha256 ← 哈希
  └── crypto/x509   ← 证书解析与验证

══════════════════════════════════════════════════════════════════
```

---

## 一、tls.Conn 结构

```go
// src/crypto/tls/conn.go（简化）
type Conn struct {
    conn        net.Conn          // 底层 TCP 连接
    isClient    bool

    // 握手状态
    handshakeMutex sync.Mutex
    handshakeErr   error
    handshakes     int            // 握手次数（含 renegotiation）
    handshakeComplete atomic.Bool

    // 密钥材料（握手后生效）
    in, out  halfConn             // 读/写方向各自的加密状态
    buffering bool                // 是否正在缓冲记录
    sendBuf  []byte

    // 配置
    config   *Config
    vers     uint16               // 协商的 TLS 版本

    // 会话
    didResume bool                // 是否会话复用
    cipherSuite uint16            // 协商的密码套件
}

type halfConn struct {
    mu     sync.Mutex
    cipher interface{}   // 加密器（实现 cipher.AEAD）
    mac    hash.Hash     // 早期 TLS 版本的 MAC（TLS 1.3 不用）
    seq    [8]byte       // 序列号（防重放）
    scratchBuf [13]byte
}
```

---

## 二、TLS 1.3 握手流程

```
TLS 1.3 握手（1-RTT）
══════════════════════════════════════════════════════════════════

  客户端                                    服务端
  ─────────────────────────────────────────────────────────────

  → ClientHello
    (版本, 随机数, 支持的密码套件,
     KeyShare[X25519], SessionTicket)
                                         ← ServerHello
                                           (选定密码套件, KeyShare)
                                         ← EncryptedExtensions
                                         ← Certificate（服务端证书）
                                         ← CertificateVerify（签名）
                                         ← Finished（HMAC 验证）

  → （此时已可发送应用数据，称为 0.5-RTT 数据）
  → Certificate（若需客户端认证）
  → CertificateVerify
  → Finished
  ⇌ Application Data（AES-GCM 加密）

  关键改进（vs TLS 1.2）：
  ├── 1-RTT 完成握手（vs 1.2 的 2-RTT）
  ├── 默认前向保密（X25519 ECDH）
  ├── 废弃 RSA 密钥交换（无前向保密）
  ├── 废弃 CBC 和 RC4
  └── 支持 0-RTT 早期数据（会话恢复时）

══════════════════════════════════════════════════════════════════
```

### 密钥推导（HKDF）

```
TLS 1.3 密钥推导树
══════════════════════════════════════════════════════════════════

  PSK（或 0）
       │  HKDF-Extract
       ▼
  Early Secret
       │  Derive-Secret("ext binder" / "res binder")
       │
       │  HKDF-Extract（加入 (EC)DHE 共享密钥）
       ▼
  Handshake Secret
       ├── client_handshake_traffic_secret  ← 握手阶段客户端密钥
       └── server_handshake_traffic_secret  ← 握手阶段服务端密钥
       │
       │  HKDF-Extract（加入 0）
       ▼
  Master Secret
       ├── client_application_traffic_secret_0  ← 应用数据客户端密钥
       └── server_application_traffic_secret_0  ← 应用数据服务端密钥

  每个 traffic_secret → HKDF-Expand → key + IV（AES-GCM 使用）

══════════════════════════════════════════════════════════════════
```

---

## 三、证书验证链

```
x509 证书验证流程
══════════════════════════════════════════════════════════════════

  服务端发来证书链：[leaf → intermediate → root]

  tls.Conn.verifyServerCertificate()
       │
       ├── x509.Certificate.Verify(opts)
       │       ├── 检查有效期（NotBefore/NotAfter）
       │       ├── 检查 CN/SAN 是否匹配目标主机名
       │       ├── 检查 KeyUsage（服务端需 KeyUsageDigitalSignature）
       │       ├── 验证签名链：leaf.Issuer == intermediate.Subject
       │       │       → intermediate 签名 leaf
       │       │       → root（trust anchor）签名 intermediate
       │       └── root 在 config.RootCAs 或系统根证书池中
       │
       └── 返回验证错误（如过期/域名不匹配/不受信任的 CA）

  config.InsecureSkipVerify = true → 跳过验证（⚠️ 仅测试用）

══════════════════════════════════════════════════════════════════
```

---

## 四、会话复用（Session Resumption）

```
TLS 1.3 会话复用机制
══════════════════════════════════════════════════════════════════

  首次握手完成后：
  服务端 → NewSessionTicket（含 PSK）→ 客户端缓存

  再次连接（0-RTT 或 1-RTT 复用）：
  客户端 ClientHello + SessionTicket + early_data（0-RTT）
       │
       └── 服务端验证 ticket → 恢复会话密钥
               → 跳过证书交换（节省 ~0.5-RTT）

  Go 实现：
  ├── client: config.ClientSessionCache（接口，可自定义）
  │     默认实现：tls.NewLRUClientSessionCache(N)（LRU 缓存）
  └── server: 每次握手发 NewSessionTicket（自动启用）

══════════════════════════════════════════════════════════════════
```

---

## 五、代码示例

### HTTPS 服务端（生产配置）

```go
func newTLSServer(certFile, keyFile string) (*http.Server, error) {
    cert, err := tls.LoadX509KeyPair(certFile, keyFile)
    if err != nil {
        return nil, fmt.Errorf("load cert: %w", err)
    }

    tlsCfg := &tls.Config{
        Certificates: []tls.Certificate{cert},
        MinVersion:   tls.VersionTLS12,       // 禁用 TLS 1.0/1.1
        CurvePreferences: []tls.CurveID{       // 首选 X25519
            tls.X25519,
            tls.CurveP256,
        },
        CipherSuites: []uint16{               // 限制只用 AEAD 套件（TLS 1.2）
            tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
            tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305,
        },
        // TLS 1.3 套件由 Go 自动配置，无需手动指定
        ClientSessionCache: tls.NewLRUClientSessionCache(256), // 会话复用
    }

    return &http.Server{
        Addr:      ":443",
        TLSConfig: tlsCfg,
        // 超时配置（防 Slowloris 攻击）
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  120 * time.Second,
    }, nil
}
```

### HTTPS 客户端（自定义根证书）

```go
func newHTTPSClient(caCertFile string) (*http.Client, error) {
    caCert, err := os.ReadFile(caCertFile)
    if err != nil {
        return nil, err
    }

    pool := x509.NewCertPool()
    if !pool.AppendCertsFromPEM(caCert) {
        return nil, errors.New("failed to parse CA cert")
    }

    transport := &http.Transport{
        TLSClientConfig: &tls.Config{
            RootCAs:    pool,             // 自定义根证书（私有 CA）
            MinVersion: tls.VersionTLS12,
            ClientSessionCache: tls.NewLRUClientSessionCache(64),
        },
        TLSHandshakeTimeout: 10 * time.Second,
        MaxIdleConns:        100,
        IdleConnTimeout:     90 * time.Second,
    }

    return &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }, nil
}
```

### 双向 TLS（mTLS）

```go
// mTLS：服务端也验证客户端证书
serverCfg := &tls.Config{
    ClientAuth: tls.RequireAndVerifyClientCert, // 要求客户端证书
    ClientCAs:  clientCAPool,                    // 可信的客户端 CA
    Certificates: []tls.Certificate{serverCert},
}

// 客户端配置：携带客户端证书
clientCfg := &tls.Config{
    Certificates: []tls.Certificate{clientCert}, // 客户端证书
    RootCAs:      serverCAPool,
}
```

### 查看连接信息

```go
conn, err := tls.Dial("tcp", "example.com:443", nil)
if err != nil {
    log.Fatal(err)
}
defer conn.Close()

state := conn.ConnectionState()
fmt.Printf("TLS Version:    %s\n", tls.VersionName(state.Version))
fmt.Printf("Cipher Suite:   %s\n", tls.CipherSuiteName(state.CipherSuite))
fmt.Printf("Did Resume:     %v\n", state.DidResume)
fmt.Printf("Server Certs:   %d\n", len(state.PeerCertificates))
if len(state.PeerCertificates) > 0 {
    cert := state.PeerCertificates[0]
    fmt.Printf("Common Name:    %s\n", cert.Subject.CommonName)
    fmt.Printf("Expiry:         %s\n", cert.NotAfter.Format(time.DateOnly))
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| TLS 1.3 和 1.2 握手的区别？ | 1.3 是 1-RTT（1.2 是 2-RTT）；1.3 默认前向保密；1.3 废弃 RSA 密钥交换和 CBC |
| 前向保密（PFS）是什么？ | 每次连接生成临时密钥（ECDH），私钥泄漏不影响历史流量解密 |
| InsecureSkipVerify 有什么风险？ | 不验证服务端证书，易受中间人攻击；只能用于测试 |
| 如何实现会话复用？ | 客户端设置 ClientSessionCache，服务端自动发 NewSessionTicket；复用 PSK 跳过密钥交换 |
| mTLS 的应用场景？ | 微服务间互信（service mesh）、客户端证书认证（zero trust 架构） |
| Go crypto/tls 支持 QUIC/TLS 1.3 吗？ | 支持 TLS 1.3（Go 1.12+）；QUIC 通过 crypto/tls 的扩展接口支持（net/quic）|
