---
title: crypto/x509 源码精读
description: 精读 crypto/x509 的证书解析与验证实现，掌握证书链验证、自签名证书生成、CSR 流程与 OCSP 最佳实践。
---

# crypto/x509：证书与 PKI 源码精读

> 核心源码：`src/crypto/x509/x509.go`、`src/crypto/x509/verify.go`

## 包结构图

```
crypto/x509 体系
══════════════════════════════════════════════════════════════════

  证书结构（X.509 v3）：
  Certificate
  ├── Subject / Issuer  ← 主体/颁发者（CN/O/OU/C）
  ├── SerialNumber      ← 唯一序列号
  ├── NotBefore/NotAfter ← 有效期
  ├── PublicKey         ← 公钥（RSA/ECDSA/Ed25519）
  ├── Extensions        ← v3 扩展（SAN/KeyUsage/BasicConstraints）
  │    ├── SubjectAltName (SAN) ← DNS 名称/IP 地址
  │    ├── KeyUsage            ← 密钥用途（签名/加密/CA）
  │    └── BasicConstraints    ← 是否是 CA 证书
  └── Signature         ← CA 私钥签名

  证书链验证流程：
  叶证书 → 中间 CA → 根 CA（在系统/自定义 CertPool 中）
  ├── 签名验证（每级证书由上级 CA 签名）
  ├── 有效期验证（NotBefore ≤ now ≤ NotAfter）
  ├── 密钥用途验证（KeyUsage/ExtKeyUsage）
  └── SAN 验证（ServerName 在 DNS Names/IP Addrs 中）

  核心函数：
  ├── x509.ParseCertificate(der []byte) (*Certificate, error)
  ├── x509.ParseCertificateRequest(der []byte) (*CertificateRequest, error)
  ├── x509.CreateCertificate(rand, template, parent, pub, priv)
  ├── x509.CreateCertificateRequest(rand, template, priv)
  ├── cert.Verify(opts VerifyOptions) (chains [][]*Certificate, error)
  └── x509.SystemCertPool()  ← 加载系统根 CA 证书池

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/crypto/x509/verify.go（简化）

func (c *Certificate) Verify(opts VerifyOptions) (chains [][]*Certificate, err error) {
    // 1. 检查有效期
    now := opts.CurrentTime
    if now.Before(c.NotBefore) || now.After(c.NotAfter) {
        return nil, CertificateInvalidError{c, Expired, ""}
    }

    // 2. 检查密钥用途（ExtKeyUsage）
    if err := c.isValid(leafCertificate, nil, &opts); err != nil {
        return nil, err
    }

    // 3. 构建证书链：从叶证书向上找到根 CA
    return c.buildChains(nil, []*Certificate{c}, nil, &opts)
}

// buildChains：递归构建证书链
// 对每个可能的中间 CA，验证其是否签署了当前证书
// 最终到达 opts.Roots 中的根 CA
```

---

## 二、代码示例

### 解析和检查证书

```go
import (
    "crypto/x509"
    "encoding/pem"
)

func parseCertificate(pemData []byte) (*x509.Certificate, error) {
    block, _ := pem.Decode(pemData)
    if block == nil || block.Type != "CERTIFICATE" {
        return nil, fmt.Errorf("非法 PEM 格式")
    }
    return x509.ParseCertificate(block.Bytes)
}

func inspectCertificate(cert *x509.Certificate) {
    fmt.Printf("主体: %s\n", cert.Subject.CommonName)
    fmt.Printf("颁发者: %s\n", cert.Issuer.CommonName)
    fmt.Printf("有效期: %s → %s\n", cert.NotBefore.Format("2006-01-02"), cert.NotAfter.Format("2006-01-02"))
    fmt.Printf("序列号: %s\n", cert.SerialNumber)
    fmt.Printf("SAN DNS: %v\n", cert.DNSNames)
    fmt.Printf("SAN IP: %v\n", cert.IPAddresses)
    fmt.Printf("是否 CA: %v\n", cert.IsCA)

    // 检查过期时间
    remaining := time.Until(cert.NotAfter)
    if remaining < 30*24*time.Hour {
        fmt.Printf("⚠️ 证书将在 %.0f 天后过期\n", remaining.Hours()/24)
    }
}
```

### 验证证书链

```go
// 验证服务端证书（自定义 CA）
func verifyCertChain(cert *x509.Certificate, caCertPEM []byte) error {
    roots := x509.NewCertPool()
    roots.AppendCertsFromPEM(caCertPEM)

    opts := x509.VerifyOptions{
        DNSName:     "api.example.com",
        Roots:       roots,
        CurrentTime: time.Now(),
        KeyUsages:   []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
    }

    chains, err := cert.Verify(opts)
    if err != nil {
        return fmt.Errorf("证书验证失败: %w", err)
    }
    fmt.Printf("验证成功，证书链长度: %d\n", len(chains[0]))
    return nil
}

// 验证客户端证书（mTLS 场景，服务端验证）
func verifyClientCert(cert *x509.Certificate, clientCAs *x509.CertPool) error {
    opts := x509.VerifyOptions{
        Roots:     clientCAs,
        KeyUsages: []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth},
    }
    _, err := cert.Verify(opts)
    return err
}
```

### 生成自签名证书（开发/测试）

```go
import (
    "crypto/ecdsa"
    "crypto/elliptic"
    "crypto/rand"
    "crypto/x509"
    "crypto/x509/pkix"
    "encoding/pem"
    "math/big"
)

func generateSelfSignedCert(domain string) (certPEM, keyPEM []byte, err error) {
    // 1. 生成 ECDSA 私钥（比 RSA 更快、更短）
    key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
    if err != nil {
        return nil, nil, err
    }

    // 2. 构建证书模板
    template := &x509.Certificate{
        SerialNumber: big.NewInt(time.Now().UnixNano()),
        Subject: pkix.Name{
            CommonName:   domain,
            Organization: []string{"My Org"},
        },
        DNSNames:    []string{domain, "localhost"},
        IPAddresses: []net.IP{net.ParseIP("127.0.0.1")},
        NotBefore:   time.Now(),
        NotAfter:    time.Now().Add(365 * 24 * time.Hour), // 1年有效期
        KeyUsage:    x509.KeyUsageDigitalSignature,
        ExtKeyUsage: []x509.ExtKeyUsage{
            x509.ExtKeyUsageServerAuth,
            x509.ExtKeyUsageClientAuth,
        },
        BasicConstraintsValid: true,
    }

    // 3. 自签名（parent = template，用自己的私钥签）
    certDER, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
    if err != nil {
        return nil, nil, err
    }

    // 4. 编码为 PEM
    certPEM = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})

    keyDER, err := x509.MarshalECPrivateKey(key)
    if err != nil {
        return nil, nil, err
    }
    keyPEM = pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})

    return certPEM, keyPEM, nil
}
```

### 搭建完整 CA（本地 PKI）

```go
type LocalCA struct {
    cert *x509.Certificate
    key  *ecdsa.PrivateKey
}

// 创建根 CA
func NewLocalCA(org string) (*LocalCA, []byte, error) {
    key, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)

    template := &x509.Certificate{
        SerialNumber:          big.NewInt(1),
        Subject:               pkix.Name{CommonName: org + " Root CA", Organization: []string{org}},
        NotBefore:             time.Now(),
        NotAfter:              time.Now().Add(10 * 365 * 24 * time.Hour), // 10年
        IsCA:                  true,
        KeyUsage:              x509.KeyUsageCertSign | x509.KeyUsageCRLSign,
        BasicConstraintsValid: true,
    }

    certDER, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
    if err != nil {
        return nil, nil, err
    }

    cert, _ := x509.ParseCertificate(certDER)
    certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER})

    return &LocalCA{cert: cert, key: key}, certPEM, nil
}

// CA 签发叶证书
func (ca *LocalCA) Sign(csrDER []byte) ([]byte, error) {
    csr, err := x509.ParseCertificateRequest(csrDER)
    if err != nil {
        return nil, err
    }
    if err := csr.CheckSignature(); err != nil {
        return nil, fmt.Errorf("CSR 签名验证失败: %w", err)
    }

    template := &x509.Certificate{
        SerialNumber: big.NewInt(time.Now().UnixNano()),
        Subject:      csr.Subject,
        DNSNames:     csr.DNSNames,
        IPAddresses:  csr.IPAddresses,
        NotBefore:    time.Now(),
        NotAfter:     time.Now().Add(90 * 24 * time.Hour), // 90天（推荐短周期）
        KeyUsage:     x509.KeyUsageDigitalSignature,
        ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
    }

    certDER, err := x509.CreateCertificate(rand.Reader, template, ca.cert, csr.PublicKey, ca.key)
    if err != nil {
        return nil, err
    }
    return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certDER}), nil
}
```

### 生成 CSR（证书签名请求）

```go
// 生成 CSR（发送给 CA 签名，不暴露私钥）
func generateCSR(domain string) (csrPEM, keyPEM []byte, err error) {
    key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
    if err != nil {
        return nil, nil, err
    }

    template := &x509.CertificateRequest{
        Subject:  pkix.Name{CommonName: domain},
        DNSNames: []string{domain},
    }

    csrDER, err := x509.CreateCertificateRequest(rand.Reader, template, key)
    if err != nil {
        return nil, nil, err
    }

    csrPEM = pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE REQUEST", Bytes: csrDER})
    keyDER, _ := x509.MarshalECPrivateKey(key)
    keyPEM = pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDER})
    return
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| X.509 证书链验证的步骤？ | 签名验证（每级由上级 CA 签名）→ 有效期检查 → KeyUsage 验证 → SAN 验证（DNS/IP 匹配）→ 到达信任根 CA |
| SAN（SubjectAltName）和 CN 的区别？ | 现代浏览器/Go 只看 SAN 中的 DNS Names；CN 已被废弃（RFC 6125）；证书必须在 SAN 中包含 DNSNames |
| 为什么建议使用 ECDSA 而非 RSA？ | P-256 密钥 256 位 vs RSA 2048 位；ECDSA 签名/验证更快；TLS 握手延迟更低；密钥更短便于存储 |
| 证书有效期为什么建议 90 天而非 1 年？ | 短周期减少私钥泄漏的暴露窗口；Let's Encrypt 强制 90 天；自动化续期（ACME）消除了长周期的必要性 |
| `x509.SystemCertPool()` 在 Linux 和 macOS 的差异？ | Linux：读取 `/etc/ssl/certs/` 目录；macOS：调用 `security` 命令访问钥匙串；容器镜像中常需要安装 `ca-certificates` |
| 自签名证书如何用于内网服务？ | 创建本地 CA → 签发服务证书 → 将 CA 证书加入客户端 `RootCAs`（`x509.NewCertPool`）；不要使用 `InsecureSkipVerify` |
