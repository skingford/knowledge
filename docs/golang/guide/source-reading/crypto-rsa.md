---
title: crypto/rsa 源码精读
description: 精读 crypto/rsa 的 RSA 算法实现，掌握密钥生成、PKCS1v15/OAEP 加解密、PSS 签名验证与 JWT/TLS 场景最佳实践。
---

# crypto/rsa：RSA 非对称加密源码精读

> 核心源码：`src/crypto/rsa/rsa.go`、`src/crypto/rsa/pkcs1v15.go`
>
> 图例参考：
> - `GoSecurityDiagram`：`hybrid-encryption`
> - `GoSecurityDiagram`：`public-key-sign-verify`

## 包结构图

```
crypto/rsa 体系
══════════════════════════════════════════════════════════════════

  RSA 密钥结构：
  PrivateKey
  ├── PublicKey
  │    ├── N *big.Int   ← 模数（公开，N = p × q）
  │    └── E int        ← 公钥指数（通常 65537）
  ├── D *big.Int        ← 私钥指数（保密，D×E ≡ 1 mod λ(N)）
  ├── Primes []*big.Int ← 质因数（通常 [p, q]）
  └── Precomputed       ← CRT 预计算值（加速解密）

  加解密模式对比：
  ┌──────────────────┬──────────────────────────────────────────┐
  │ 模式             │ 适用场景                                 │
  ├──────────────────┼──────────────────────────────────────────┤
  │ PKCS1v15（加密） │ 向后兼容，不推荐新系统使用（有攻击风险）│
  │ OAEP             │ 现代加密推荐，含随机 label，抵抗选择密文│
  │ PKCS1v15（签名） │ TLS 1.2、旧 JWT RS256（兼容性好）       │
  │ PSS              │ 现代签名推荐，TLS 1.3、新 JWT 推荐       │
  └──────────────────┴──────────────────────────────────────────┘

  密钥序列化：
  ├── x509.MarshalPKCS1PrivateKey(key)    → DER → PEM
  ├── x509.MarshalPKCS8PrivateKey(key)    → PKCS#8（推荐，算法无关）
  ├── x509.MarshalPKIXPublicKey(pub)      → DER → PEM
  └── x509.ParsePKCS1PrivateKey(der)      → 解析

══════════════════════════════════════════════════════════════════
```

<GoSecurityDiagram kind="hybrid-encryption" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/crypto/rsa/rsa.go（简化）

// RSA 解密（私钥操作）：m = c^d mod N
// 使用 CRT（中国剩余定理）加速：分别对 p、q 计算后合并
func decrypt(priv *PrivateKey, c *big.Int) (*big.Int, error) {
    // CRT：m1 = c^dP mod p, m2 = c^dQ mod q
    m1 := new(big.Int).Exp(c, priv.Precomputed.Dp, priv.Primes[0])
    m2 := new(big.Int).Exp(c, priv.Precomputed.Dq, priv.Primes[1])
    // 合并：m = m2 + p×(qInv×(m1-m2) mod p)
    // CRT 使解密速度约是直接 c^d mod N 的 4 倍
    return m, nil
}

// OAEP 加密：添加随机 padding 防止确定性攻击
// 同一明文每次加密结果不同（随机 seed）
```
:::

<GoSecurityDiagram kind="public-key-sign-verify" />

---

## 二、代码示例

### 密钥生成与序列化

::: details 点击展开代码：密钥生成与序列化
```go
import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/x509"
    "encoding/pem"
)

// 生成 RSA 密钥对
func generateRSAKeyPair(bits int) (*rsa.PrivateKey, error) {
    // bits 推荐：2048（最低）、3072、4096
    return rsa.GenerateKey(rand.Reader, bits)
}

// 私钥 → PEM 文件
func marshalPrivateKey(key *rsa.PrivateKey) []byte {
    // PKCS#8 格式（算法无关，推荐）
    der, _ := x509.MarshalPKCS8PrivateKey(key)
    return pem.EncodeToMemory(&pem.Block{
        Type:  "PRIVATE KEY",
        Bytes: der,
    })
}

// 公钥 → PEM 文件
func marshalPublicKey(key *rsa.PublicKey) []byte {
    der, _ := x509.MarshalPKIXPublicKey(key)
    return pem.EncodeToMemory(&pem.Block{
        Type:  "PUBLIC KEY",
        Bytes: der,
    })
}

// 从 PEM 加载私钥
func loadPrivateKey(pemData []byte) (*rsa.PrivateKey, error) {
    block, _ := pem.Decode(pemData)
    if block == nil {
        return nil, fmt.Errorf("无效 PEM")
    }
    key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
    if err != nil {
        return nil, err
    }
    rsaKey, ok := key.(*rsa.PrivateKey)
    if !ok {
        return nil, fmt.Errorf("非 RSA 私钥")
    }
    return rsaKey, nil
}
```
:::

### OAEP 加解密（推荐）

::: details 点击展开代码：OAEP 加解密（推荐）
```go
import (
    "crypto/rand"
    "crypto/rsa"
    "crypto/sha256"
)

// OAEP 加密（用公钥）：适合加密小数据（如对称密钥）
func encryptOAEP(pubKey *rsa.PublicKey, plaintext []byte) ([]byte, error) {
    // 可加密的最大长度：keyLen - 2*hashLen - 2
    // 2048bit 密钥：256 - 2*32 - 2 = 190 字节
    return rsa.EncryptOAEP(
        sha256.New(),    // 哈希函数
        rand.Reader,     // 随机源
        pubKey,
        plaintext,
        nil,             // label（可选，增加上下文绑定）
    )
}

// OAEP 解密（用私钥）
func decryptOAEP(privKey *rsa.PrivateKey, ciphertext []byte) ([]byte, error) {
    return rsa.DecryptOAEP(
        sha256.New(),
        rand.Reader,
        privKey,
        ciphertext,
        nil,
    )
}

// 实际应用：混合加密（RSA + AES）
func hybridEncrypt(pubKey *rsa.PublicKey, plaintext []byte) (encryptedKey, ciphertext []byte, err error) {
    // 1. 生成随机 AES-256 密钥
    aesKey := make([]byte, 32)
    rand.Read(aesKey)

    // 2. 用 RSA-OAEP 加密 AES 密钥
    encryptedKey, err = encryptOAEP(pubKey, aesKey)
    if err != nil {
        return nil, nil, err
    }

    // 3. 用 AES-GCM 加密实际数据（大数据高效）
    ciphertext, err = aesGCMEncrypt(aesKey, plaintext)
    return
}
```
:::

### PSS 签名与验证（推荐）

::: details 点击展开代码：PSS 签名与验证（推荐）
```go
import (
    "crypto"
    "crypto/rand"
    "crypto/rsa"
    "crypto/sha256"
)

// PSS 签名（用私钥）：现代 RSA 签名标准
func signPSS(privKey *rsa.PrivateKey, message []byte) ([]byte, error) {
    // 计算消息哈希
    h := sha256.New()
    h.Write(message)
    digest := h.Sum(nil)

    return rsa.SignPSS(
        rand.Reader,
        privKey,
        crypto.SHA256,
        digest,
        &rsa.PSSOptions{
            SaltLength: rsa.PSSSaltLengthAuto, // 最大 salt 长度
            Hash:       crypto.SHA256,
        },
    )
}

// PSS 验证（用公钥）
func verifyPSS(pubKey *rsa.PublicKey, message, signature []byte) error {
    h := sha256.New()
    h.Write(message)
    digest := h.Sum(nil)

    return rsa.VerifyPSS(
        pubKey,
        crypto.SHA256,
        digest,
        signature,
        &rsa.PSSOptions{
            SaltLength: rsa.PSSSaltLengthAuto,
            Hash:       crypto.SHA256,
        },
    )
}
```
:::

### PKCS1v15 签名（JWT RS256 兼容）

::: details 点击展开代码：PKCS1v15 签名（JWT RS256 兼容）
```go
// PKCS1v15 签名（兼容 JWT RS256/RS384/RS512）
func signPKCS1v15(privKey *rsa.PrivateKey, message []byte) ([]byte, error) {
    h := sha256.New()
    h.Write(message)
    digest := h.Sum(nil)
    return rsa.SignPKCS1v15(rand.Reader, privKey, crypto.SHA256, digest)
}

func verifyPKCS1v15(pubKey *rsa.PublicKey, message, sig []byte) error {
    h := sha256.New()
    h.Write(message)
    digest := h.Sum(nil)
    return rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, digest, sig)
}
```
:::

### 简易 JWT 实现（RS256）

::: details 点击展开代码：简易 JWT 实现（RS256）
```go
import (
    "encoding/base64"
    "encoding/json"
    "strings"
)

type JWTClaims struct {
    Sub string `json:"sub"`
    Exp int64  `json:"exp"`
    Iat int64  `json:"iat"`
}

func createJWT(privKey *rsa.PrivateKey, claims JWTClaims) (string, error) {
    // Header
    header := base64.RawURLEncoding.EncodeToString(
        []byte(`{"alg":"RS256","typ":"JWT"}`),
    )
    // Payload
    payloadJSON, _ := json.Marshal(claims)
    payload := base64.RawURLEncoding.EncodeToString(payloadJSON)

    // 签名 header.payload
    signingInput := header + "." + payload
    sig, err := signPKCS1v15(privKey, []byte(signingInput))
    if err != nil {
        return "", err
    }

    return signingInput + "." + base64.RawURLEncoding.EncodeToString(sig), nil
}

func verifyJWT(pubKey *rsa.PublicKey, token string) (*JWTClaims, error) {
    parts := strings.Split(token, ".")
    if len(parts) != 3 {
        return nil, fmt.Errorf("无效 JWT 格式")
    }

    signingInput := parts[0] + "." + parts[1]
    sig, err := base64.RawURLEncoding.DecodeString(parts[2])
    if err != nil {
        return nil, err
    }

    if err := verifyPKCS1v15(pubKey, []byte(signingInput), sig); err != nil {
        return nil, fmt.Errorf("JWT 签名验证失败: %w", err)
    }

    payloadJSON, _ := base64.RawURLEncoding.DecodeString(parts[1])
    var claims JWTClaims
    json.Unmarshal(payloadJSON, &claims)

    if claims.Exp < time.Now().Unix() {
        return nil, fmt.Errorf("JWT 已过期")
    }
    return &claims, nil
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| PKCS1v15 加密和 OAEP 的区别？ | PKCS1v15 加密是确定性的（同一明文每次密文相同），有 Bleichenbacher 攻击风险；OAEP 含随机 seed，每次密文不同，现代系统推荐 |
| RSA 密钥长度选择建议？ | 2048 位是当前最低要求；3072 位提供 128 位安全强度（推荐新系统）；4096 位性能较差，通常无必要 |
| 为什么 RSA 只能加密小数据？ | RSA 直接加密限制：最大明文 = keyBytes - 2×hashLen - 2（OAEP），2048 位约 190 字节；大数据用混合加密（RSA + AES） |
| PSS 相比 PKCS1v15 签名的优势？ | PSS 含随机 salt，提供可证明安全性；PKCS1v15 签名是确定性的（泄漏信息风险）；新协议（TLS 1.3）要求使用 PSS |
| CRT 如何加速 RSA 解密？ | 将 mod N 计算分解为 mod p 和 mod q 两个小数字的计算，速度约提升 4 倍；`rsa.GenerateKey` 自动预计算 CRT 参数 |
| 如何判断 RSA 密钥文件格式？ | PEM 头：`BEGIN RSA PRIVATE KEY` = PKCS#1；`BEGIN PRIVATE KEY` = PKCS#8（推荐，算法无关）；`BEGIN PUBLIC KEY` = PKIX 公钥 |
