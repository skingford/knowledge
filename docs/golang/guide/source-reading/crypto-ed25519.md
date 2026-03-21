---
title: crypto/ed25519 源码精读
description: 精读 crypto/ed25519 的 EdDSA 实现，掌握 Ed25519 密钥生成、签名验证、SSH 密钥、JWT EdDSA 与 TLS 证书的现代密码学实践。
---

# crypto/ed25519：EdDSA 签名源码精读

> 核心源码：`src/crypto/ed25519/ed25519.go`、`src/crypto/internal/edwards25519/`
>
> 图例参考：
> - `GoSecurityDiagram`：`public-key-sign-verify`

## 包结构图

```
crypto/ed25519 体系
══════════════════════════════════════════════════════════════════

  Ed25519 算法（Curve25519 上的 EdDSA）
  ├── 曲线：Edwards 25519（y² = x³ + 486662x² + x mod 2²⁵⁵-19）
  ├── 密钥长度：私钥 64B（seed 32B + 公钥 32B），公钥 32B
  ├── 签名长度：64 字节（固定）
  └── 安全级别：≈ RSA-3072 / ECDSA P-256

  与 RSA/ECDSA 对比：
  ┌───────────┬──────────┬──────────┬───────────┐
  │ 算法       │ 密钥生成  │ 签名     │ 验证      │
  ├───────────┼──────────┼──────────┼───────────┤
  │ RSA-2048  │ 极慢      │ 慢       │ 快        │
  │ ECDSA P-256│ 中       │ 中       │ 中        │
  │ Ed25519   │ 极快      │ 极快     │ 极快      │
  └───────────┴──────────┴──────────┴───────────┘
  Ed25519 优势：
  - 确定性签名（无需 CSPRNG 随机数，无 k 值泄漏风险）
  - 常数时间实现（抗时序攻击）
  - 密钥和签名最短（节省存储/传输）

  使用场景：
  ├── SSH 密钥（-t ed25519，OpenSSH 默认推荐）
  ├── JWT：EdDSA 算法（RFC 8037）
  ├── TLS 证书签名（替代 RSA/ECDSA）
  └── 区块链签名（Solana/Cosmos）

══════════════════════════════════════════════════════════════════
```

<GoSecurityDiagram kind="public-key-sign-verify" />

---

## 一、核心实现

```go
// src/crypto/ed25519/ed25519.go（简化）

const (
    PublicKeySize  = 32  // 公钥字节数
    PrivateKeySize = 64  // 私钥字节数（seed + 公钥）
    SignatureSize  = 64  // 签名字节数
    SeedSize       = 32  // 种子字节数
)

// Sign 核心流程：
// 1. 对 seed 做 SHA-512：(r_scalar, prefix) = SHA-512(seed)
// 2. r = SHA-512(prefix || message) 作为随机量（确定性！）
// 3. R = r·B（基点标量乘）
// 4. S = (r + SHA-512(R||A||message) × a) mod L
// 签名 = R(32B) || S(32B)

// Verify 核心流程：
// 1. 解码 R, S, A（公钥）
// 2. k = SHA-512(R || A || message)
// 3. 验证 S·B == R + k·A（批量验证可加速）
```

---

## 二、代码示例

### 基础：密钥生成与签名验证

```go
import (
    "crypto/ed25519"
    "crypto/rand"
    "fmt"
)

func basicEdDSA() {
    // 生成密钥对（耗时 < 1ms，极快）
    pub, priv, err := ed25519.GenerateKey(rand.Reader)
    if err != nil {
        panic(err)
    }

    fmt.Printf("公钥（32B）: %x\n", pub)
    fmt.Printf("私钥（64B）: %x\n", priv)

    // 签名（确定性：相同消息+私钥永远生成相同签名）
    message := []byte("Hello, Ed25519!")
    sig := ed25519.Sign(priv, message)
    fmt.Printf("签名（64B）: %x\n", sig)

    // 验证签名
    if ed25519.Verify(pub, message, sig) {
        fmt.Println("签名验证成功")
    }

    // 篡改消息后验证失败
    tampered := []byte("Hello, Ed25519?")
    fmt.Println("篡改后验证:", ed25519.Verify(pub, tampered, sig)) // false
}
```

### 密钥序列化（PEM 格式）

```go
import (
    "crypto/ed25519"
    "crypto/rand"
    "crypto/x509"
    "encoding/pem"
    "os"
)

// 保存密钥对到文件
func saveKeyPair(privFile, pubFile string) error {
    pub, priv, err := ed25519.GenerateKey(rand.Reader)
    if err != nil {
        return err
    }

    // 私钥 → PKCS#8 DER → PEM
    privDER, err := x509.MarshalPKCS8PrivateKey(priv)
    if err != nil {
        return err
    }
    privPEM := pem.EncodeToMemory(&pem.Block{
        Type:  "PRIVATE KEY",
        Bytes: privDER,
    })
    if err := os.WriteFile(privFile, privPEM, 0600); err != nil {
        return err
    }

    // 公钥 → PKIX DER → PEM
    pubDER, err := x509.MarshalPKIXPublicKey(pub)
    if err != nil {
        return err
    }
    pubPEM := pem.EncodeToMemory(&pem.Block{
        Type:  "PUBLIC KEY",
        Bytes: pubDER,
    })
    return os.WriteFile(pubFile, pubPEM, 0644)
}

// 从 PEM 文件加载密钥
func loadPrivateKey(privFile string) (ed25519.PrivateKey, error) {
    data, err := os.ReadFile(privFile)
    if err != nil {
        return nil, err
    }

    block, _ := pem.Decode(data)
    if block == nil {
        return nil, fmt.Errorf("no PEM block found")
    }

    key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
    if err != nil {
        return nil, err
    }

    edKey, ok := key.(ed25519.PrivateKey)
    if !ok {
        return nil, fmt.Errorf("not an Ed25519 key")
    }
    return edKey, nil
}
```

### JWT EdDSA（RFC 8037 - OKP 密钥）

```go
// 手动实现 EdDSA JWT（alg: EdDSA, crv: Ed25519）
import (
    "crypto/ed25519"
    "crypto/rand"
    "encoding/base64"
    "encoding/json"
    "strings"
)

type JWTHeader struct {
    Alg string `json:"alg"`
    Typ string `json:"typ"`
}

type JWTClaims struct {
    Sub string `json:"sub"`
    Iss string `json:"iss"`
    Exp int64  `json:"exp"`
    Iat int64  `json:"iat"`
}

func b64url(data []byte) string {
    return base64.RawURLEncoding.EncodeToString(data)
}

func signJWT(priv ed25519.PrivateKey, claims JWTClaims) (string, error) {
    header, _ := json.Marshal(JWTHeader{Alg: "EdDSA", Typ: "JWT"})
    payload, _ := json.Marshal(claims)

    // header.payload（未签名部分）
    unsigned := b64url(header) + "." + b64url(payload)

    // Ed25519 签名
    sig := ed25519.Sign(priv, []byte(unsigned))

    return unsigned + "." + b64url(sig), nil
}

func verifyJWT(pub ed25519.PublicKey, token string) (*JWTClaims, error) {
    parts := strings.Split(token, ".")
    if len(parts) != 3 {
        return nil, fmt.Errorf("invalid token format")
    }

    // 验签
    unsigned := parts[0] + "." + parts[1]
    sig, err := base64.RawURLEncoding.DecodeString(parts[2])
    if err != nil {
        return nil, fmt.Errorf("decode sig: %w", err)
    }

    if !ed25519.Verify(pub, []byte(unsigned), sig) {
        return nil, fmt.Errorf("invalid signature")
    }

    // 解析 claims
    payload, err := base64.RawURLEncoding.DecodeString(parts[1])
    if err != nil {
        return nil, err
    }

    var claims JWTClaims
    if err := json.Unmarshal(payload, &claims); err != nil {
        return nil, err
    }

    // 验证过期时间
    if claims.Exp < time.Now().Unix() {
        return nil, fmt.Errorf("token expired")
    }
    return &claims, nil
}

// 使用
func jwtExample() {
    pub, priv, _ := ed25519.GenerateKey(rand.Reader)

    token, _ := signJWT(priv, JWTClaims{
        Sub: "user123",
        Iss: "myapp",
        Iat: time.Now().Unix(),
        Exp: time.Now().Add(1 * time.Hour).Unix(),
    })
    fmt.Println("JWT:", token)

    claims, err := verifyJWT(pub, token)
    fmt.Printf("Claims: %+v, err: %v\n", claims, err)
}
```

### 用 Ed25519 签发 TLS 证书

```go
import (
    "crypto/ed25519"
    "crypto/rand"
    "crypto/tls"
    "crypto/x509"
    "crypto/x509/pkix"
    "math/big"
    "net"
    "time"
)

// 生成自签名 Ed25519 TLS 证书（适合内网服务）
func generateSelfSignedCert() (tls.Certificate, error) {
    pub, priv, err := ed25519.GenerateKey(rand.Reader)
    if err != nil {
        return tls.Certificate{}, err
    }

    template := &x509.Certificate{
        SerialNumber: big.NewInt(1),
        Subject: pkix.Name{
            Organization: []string{"My Internal Service"},
            CommonName:   "internal.example.com",
        },
        DNSNames:  []string{"internal.example.com", "localhost"},
        IPAddresses: []net.IP{net.ParseIP("127.0.0.1")},
        NotBefore: time.Now(),
        NotAfter:  time.Now().Add(365 * 24 * time.Hour),
        KeyUsage:  x509.KeyUsageDigitalSignature,
        ExtKeyUsage: []x509.ExtKeyUsage{
            x509.ExtKeyUsageTLSWebServerAuth,
        },
        IsCA:                  true,
        BasicConstraintsValid: true,
    }

    // 自签名（用自身私钥签）
    certDER, err := x509.CreateCertificate(rand.Reader, template, template, pub, priv)
    if err != nil {
        return tls.Certificate{}, err
    }

    return tls.X509KeyPair(
        pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER}),
        func() []byte {
            privDER, _ := x509.MarshalPKCS8PrivateKey(priv)
            return pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER})
        }(),
    )
}
```

### 从 Seed 派生密钥（确定性密钥）

```go
// Ed25519 支持从 32 字节 seed 确定性派生密钥对
// 用途：HD 钱包（分层确定性）、密钥备份恢复
func deriveKeyFromSeed(seed []byte) (ed25519.PublicKey, ed25519.PrivateKey, error) {
    if len(seed) != ed25519.SeedSize {
        return nil, nil, fmt.Errorf("seed must be %d bytes", ed25519.SeedSize)
    }

    priv := ed25519.NewKeyFromSeed(seed)
    pub := priv.Public().(ed25519.PublicKey)
    return pub, priv, nil
}

// 从主密钥派生子密钥（使用 HKDF）
func deriveChildKey(masterSeed []byte, index uint32) (ed25519.PrivateKey, error) {
    hkdf := hkdf.New(sha256.New, masterSeed,
        []byte("ed25519-child-key"),
        binary.BigEndian.AppendUint32(nil, index),
    )

    childSeed := make([]byte, ed25519.SeedSize)
    if _, err := io.ReadFull(hkdf, childSeed); err != nil {
        return nil, err
    }
    return ed25519.NewKeyFromSeed(childSeed), nil
}

// API 请求签名（类似 AWS Signature）
type SignedRequest struct {
    Method    string
    Path      string
    Body      []byte
    Timestamp int64
    KeyID     string
    Signature string
}

func signRequest(priv ed25519.PrivateKey, keyID, method, path string, body []byte) SignedRequest {
    ts := time.Now().Unix()
    // 待签数据：method + path + timestamp + SHA256(body)
    h := sha256.Sum256(body)
    msg := fmt.Sprintf("%s\n%s\n%d\n%x", method, path, ts, h)
    sig := ed25519.Sign(priv, []byte(msg))

    return SignedRequest{
        Method:    method,
        Path:      path,
        Body:      body,
        Timestamp: ts,
        KeyID:     keyID,
        Signature: base64.StdEncoding.EncodeToString(sig),
    }
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Ed25519 相比 ECDSA P-256 的核心优势？ | 确定性签名（无 k 值泄漏风险）；常数时间实现（抗时序攻击）；密钥/签名更短；性能更快（Go 汇编优化）|
| 为什么 Ed25519 签名是"确定性的"？ | 随机量 r 由 SHA-512(seed_prefix \|\| message) 派生，不依赖外部 CSPRNG；相同私钥+消息永远生成相同签名 |
| `NewKeyFromSeed` 和 `GenerateKey` 的区别？ | `GenerateKey` 用 `rand.Reader` 生成随机 seed 再派生；`NewKeyFromSeed` 从固定 seed 确定性派生，适合密钥备份和 HD 钱包 |
| Ed25519 私钥为什么是 64 字节？ | 前 32B 是 seed（真正的私钥材料），后 32B 是对应公钥的缓存；`priv.Seed()` 只返回前 32B |
| JWT 中使用 EdDSA 和 ES256 如何选择？ | EdDSA（Ed25519）：更快、密钥/签名更小、实现更安全；ES256（P-256）：兼容性更广（老库支持好）；新项目推荐 EdDSA |
| Ed25519 有没有已知弱点？ | 若在多个不同上下文重用私钥（签名 + DH），理论上存在交叉协议攻击；实践中签名用 Ed25519、密钥交换用 X25519（不同密钥） |
