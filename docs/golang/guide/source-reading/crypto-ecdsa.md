---
title: crypto/ecdsa 源码精读
description: 精读 Go crypto/ecdsa 椭圆曲线数字签名实现，掌握 P-256/P-384 密钥生成、ECDSA 签名验证、JWT ES256 与 TLS 证书最佳实践。
---

# crypto/ecdsa：椭圆曲线数字签名源码精读

> 核心源码：`src/crypto/ecdsa/ecdsa.go`、`src/crypto/elliptic/elliptic.go`
>
> 图例参考：
> - `GoSecurityDiagram`：`public-key-sign-verify`

## 包结构图

```
crypto/ecdsa 体系
══════════════════════════════════════════════════════════════════

  椭圆曲线（crypto/elliptic）：
  ├── P224()   ← NIST P-224（历史遗留，不推荐）
  ├── P256()   ← NIST P-256（secp256r1）★ 最常用，硬件加速
  ├── P384()   ← NIST P-384（高安全等级）
  └── P521()   ← NIST P-521（最高安全）

  ECDSA 密钥结构：
  PrivateKey
  ├── PublicKey
  │    ├── Curve  elliptic.Curve  ← 选择的曲线
  │    ├── X, Y   *big.Int        ← 公钥点坐标
  │    └── Equal()/ECDH()
  └── D      *big.Int             ← 私钥标量（随机整数）

  与 RSA 对比：
  ┌──────────────┬────────────────┬────────────────────────────┐
  │ 算法         │ 安全级别       │ 特点                       │
  ├──────────────┼────────────────┼────────────────────────────┤
  │ RSA-2048     │ 112 位安全     │ 密钥大，运算慢             │
  │ RSA-4096     │ 140 位安全     │ 签名极慢                   │
  │ ECDSA P-256  │ 128 位安全     │ 密钥小（32B），速度快 ★   │
  │ ECDSA P-384  │ 192 位安全     │ 适合高安全政府/金融场景    │
  └──────────────┴────────────────┴────────────────────────────┘

  ECDSA 签名流程：
  1. 生成随机数 k ∈ [1, n-1]（k 必须每次不同！重用 k 会泄漏私钥）
  2. 计算点 R = k·G，取 r = R.x mod n
  3. 计算 s = k⁻¹(hash + r·d) mod n
  4. 签名 = (r, s)

══════════════════════════════════════════════════════════════════
```

<GoSecurityDiagram kind="public-key-sign-verify" />

---

## 一、核心实现

```go
// src/crypto/ecdsa/ecdsa.go（简化）

// GenerateKey：从 OS 熵源生成私钥
func GenerateKey(c elliptic.Curve, rand io.Reader) (*PrivateKey, error) {
    k, err := randFieldElement(c, rand) // 随机私钥标量 d
    if err != nil {
        return nil, err
    }
    priv := &PrivateKey{
        PublicKey: PublicKey{Curve: c},
        D:         k,
    }
    // 公钥 = d·G（椭圆曲线点乘法）
    priv.PublicKey.X, priv.PublicKey.Y = c.ScalarBaseMult(k.Bytes())
    return priv, nil
}

// SignASN1：签名并以 ASN.1 DER 格式返回 (r,s)
// ⚠️ 每次调用 rand 必须是密码学安全的 io.Reader（不能是 math/rand）
func SignASN1(rand io.Reader, priv *PrivateKey, hash []byte) ([]byte, error) {
    // 内部自动处理 k 的随机生成和 DER 编码
}

// VerifyASN1：验证签名
func VerifyASN1(pub *PublicKey, hash, sig []byte) bool {
    // 仅验证签名数学正确性，不验证证书链
}
```

---

## 二、代码示例

### 基础：密钥生成与签名验证

```go
import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "crypto/rand"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
)

func basicECDSA() {
    // 1. 生成 P-256 私钥
    privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
    if err != nil {
        panic(err)
    }
    publicKey := &privateKey.PublicKey

    // 2. 签名（先哈希再签名）
    message := []byte("hello, ecdsa")
    hash := sha256.Sum256(message)

    sig, err := ecdsa.SignASN1(rand.Reader, privateKey, hash[:])
    if err != nil {
        panic(err)
    }
    fmt.Printf("签名 (%d bytes): %s\n", len(sig), hex.EncodeToString(sig))

    // 3. 验证
    valid := ecdsa.VerifyASN1(publicKey, hash[:], sig)
    fmt.Printf("验证结果: %v\n", valid) // true

    // 篡改消息后验证失败
    hash2 := sha256.Sum256([]byte("tampered"))
    fmt.Printf("篡改后: %v\n", ecdsa.VerifyASN1(publicKey, hash2[:], sig)) // false
}
```

### 密钥序列化与反序列化

```go
import (
    "crypto/x509"
    "encoding/pem"
    "os"
)

// 保存私钥为 PEM 文件（PKCS#8 格式，推荐）
func savePrivateKey(path string, key *ecdsa.PrivateKey) error {
    der, err := x509.MarshalPKCS8PrivateKey(key)
    if err != nil {
        return err
    }
    block := &pem.Block{Type: "PRIVATE KEY", Bytes: der}
    return os.WriteFile(path, pem.EncodeToMemory(block), 0600)
}

// 保存公钥为 PEM 文件
func savePublicKey(path string, key *ecdsa.PublicKey) error {
    der, err := x509.MarshalPKIXPublicKey(key)
    if err != nil {
        return err
    }
    block := &pem.Block{Type: "PUBLIC KEY", Bytes: der}
    return os.WriteFile(path, pem.EncodeToMemory(block), 0644)
}

// 加载私钥
func loadPrivateKey(path string) (*ecdsa.PrivateKey, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    block, _ := pem.Decode(data)
    key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
    if err != nil {
        return nil, err
    }
    return key.(*ecdsa.PrivateKey), nil
}

// 加载公钥
func loadPublicKey(path string) (*ecdsa.PublicKey, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }
    block, _ := pem.Decode(data)
    pub, err := x509.ParsePKIXPublicKey(block.Bytes)
    if err != nil {
        return nil, err
    }
    return pub.(*ecdsa.PublicKey), nil
}
```

### JWT ES256（ECDSA P-256 签名）

```go
import (
    "crypto/ecdsa"
    "crypto/rand"
    "crypto/sha256"
    "encoding/base64"
    "encoding/json"
    "math/big"
    "strings"
)

// 简化版 ES256 JWT（生产用 github.com/golang-jwt/jwt）
type JWTHeader struct {
    Alg string `json:"alg"`
    Typ string `json:"typ"`
}

type JWTClaims struct {
    Sub string `json:"sub"`
    Exp int64  `json:"exp"`
    Iat int64  `json:"iat"`
}

func b64url(data []byte) string {
    return base64.RawURLEncoding.EncodeToString(data)
}

func createES256JWT(key *ecdsa.PrivateKey, claims JWTClaims) (string, error) {
    header, _ := json.Marshal(JWTHeader{Alg: "ES256", Typ: "JWT"})
    payload, _ := json.Marshal(claims)

    signingInput := b64url(header) + "." + b64url(payload)

    // SHA-256 哈希后用 P-256 签名
    hash := sha256.Sum256([]byte(signingInput))
    r, s, err := ecdsa.Sign(rand.Reader, key, hash[:])
    if err != nil {
        return "", err
    }

    // ES256 签名格式：r||s（各 32 字节，big-endian）
    sig := make([]byte, 64)
    r.FillBytes(sig[:32])
    s.FillBytes(sig[32:])

    return signingInput + "." + b64url(sig), nil
}

func verifyES256JWT(token string, pub *ecdsa.PublicKey) (*JWTClaims, error) {
    parts := strings.Split(token, ".")
    if len(parts) != 3 {
        return nil, errors.New("invalid token")
    }

    signingInput := parts[0] + "." + parts[1]
    hash := sha256.Sum256([]byte(signingInput))

    sig, err := base64.RawURLEncoding.DecodeString(parts[2])
    if err != nil || len(sig) != 64 {
        return nil, errors.New("invalid signature")
    }

    r := new(big.Int).SetBytes(sig[:32])
    s := new(big.Int).SetBytes(sig[32:])

    if !ecdsa.Verify(pub, hash[:], r, s) {
        return nil, errors.New("signature verification failed")
    }

    payload, _ := base64.RawURLEncoding.DecodeString(parts[1])
    var claims JWTClaims
    json.Unmarshal(payload, &claims)
    return &claims, nil
}
```

### ECDH 密钥交换（派生共享密钥）

```go
import "crypto/ecdh"

// ECDH（Elliptic-curve Diffie-Hellman）密钥交换
// 两端各持私钥，可计算出相同的共享密钥（用于加密通信）
func ecdhKeyExchange() {
    // Alice 生成密钥对
    aliceKey, _ := ecdh.P256().GenerateKey(rand.Reader)
    alicePub := aliceKey.PublicKey()

    // Bob 生成密钥对
    bobKey, _ := ecdh.P256().GenerateKey(rand.Reader)
    bobPub := bobKey.PublicKey()

    // Alice 用自己的私钥 + Bob 的公钥计算共享密钥
    aliceShared, _ := aliceKey.ECDH(bobPub)

    // Bob 用自己的私钥 + Alice 的公钥计算共享密钥
    bobShared, _ := bobKey.ECDH(alicePub)

    // aliceShared == bobShared（双方得到相同的 32 字节共享密钥）
    fmt.Printf("密钥匹配: %v\n", bytes.Equal(aliceShared, bobShared))

    // 从共享密钥派生 AES-256 密钥（HKDF）
    hkdf := hkdf.New(sha256.New, aliceShared, nil, []byte("app-v1"))
    aesKey := make([]byte, 32)
    io.ReadFull(hkdf, aesKey)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| ECDSA 为什么 k 值必须每次唯一？ | 若两次签名使用相同 k，攻击者可从两个签名中解方程组直接还原私钥 d；必须用 `crypto/rand.Reader` 保证每次随机 |
| P-256 vs P-384 如何选择？ | P-256 适合 TLS/HTTPS/JWT（128 位安全，有硬件加速）；P-384 适合政府/金融高安全场景（192 位安全）；日常用 P-256 即可 |
| ECDSA 的 `SignASN1` 和 `Sign` 有什么区别？ | `SignASN1`（Go 1.15+）返回 DER 编码的 `(r,s)`；旧版 `Sign` 分别返回 `r, s *big.Int`；优先用 `SignASN1`，兼容性更好 |
| `crypto/ecdsa` 与 `crypto/ecdh` 的区别？ | `ecdsa` 用于签名验证；`ecdh` 用于密钥交换（生成共享密钥）；TLS 1.3 使用 ECDHE = ECDH + Ephemeral（每次会话临时密钥） |
| 为什么 JWT 用 ES256（ECDSA P-256）而不是 RS256（RSA）？ | ES256 签名只有 64 字节，RS256 需要 256 字节；P-256 密钥只有 32 字节，RSA-2048 需要 256 字节；ES256 生成速度也快 5-10 倍 |
| ECDSA 签名是否可以批量验证？ | 单个 ECDSA 验证需要两次点乘（开销较大）；批量验证可以摊薄开销（如 Schnorr 签名支持批量，但标准 ECDSA 不支持）|
