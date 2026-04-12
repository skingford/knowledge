---
title: 安全编程实践
description: Go 安全编程专题，涵盖密码哈希、JWT、TLS、SQL 注入防护、XSS/CSRF 防护、输入验证、安全 Header、Secret 管理、gosec 扫描与速率限制。
search: false
---

# 安全编程实践

## 适合人群

- 正在开发 Web API 或微服务、需要系统性了解安全最佳实践的 Go 工程师
- 需要通过安全审计或渗透测试、希望提前加固代码的后端开发
- 关注 OWASP Top 10，希望在 Go 项目中落地安全防护的团队负责人

## 学习目标

- 掌握密码哈希、JWT、TLS 等认证与加密基础设施的正确实现方式
- 理解 SQL 注入、XSS、CSRF 等常见 Web 攻击的原理及 Go 中的防护手段
- 能够配置安全 HTTP Header、管理 Secret、集成 gosec 静态扫描
- 实现速率限制与防暴力破解机制，保护 API 端点

## 快速导航

- [1. 密码哈希与验证](#_1-密码哈希与验证)
- [2. JWT 签发与验证](#_2-jwt-签发与验证)
- [3. TLS/HTTPS 配置](#_3-tls-https-配置)
- [4. SQL 注入防护](#_4-sql-注入防护)
- [5. XSS 防护](#_5-xss-防护)
- [6. CSRF 防护](#_6-csrf-防护)
- [7. 输入验证与 Sanitization](#_7-输入验证与-sanitization)
- [8. 安全的 HTTP Header 配置](#_8-安全的-http-header-配置)
- [9. Secret 管理](#_9-secret-管理)
- [10. gosec 静态安全扫描](#_10-gosec-静态安全扫描)
- [11. 速率限制与防暴力破解](#_11-速率限制与防暴力破解)

---

## 1. 密码哈希与验证

<GoSecurityDiagram kind="password-storage" />

::: danger 警告
将密码以明文或简单哈希（MD5/SHA256）存储是极其危险的做法——一旦数据库泄露，攻击者可以通过彩虹表在数秒内还原明文密码。
:::

密码存储是 Web 应用最基础的安全需求。正确的做法是使用专为密码设计的自适应哈希算法（bcrypt、argon2），它们内置盐值和可调节的计算成本，能有效抵御暴力破解。

### bcrypt 哈希与验证

```go
package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "MyS3cureP@ssw0rd"

	// ========== 注册：哈希密码 ==========
	// cost 参数控制计算复杂度，推荐 10~14，越大越安全但越慢
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("哈希失败:", err)
	}
	fmt.Println("哈希结果:", string(hashedPassword))
	// 输出类似: $2a$10$N9qo8uLOickgx2ZMRZoMye...
	// 格式: $算法版本$cost$22位盐值+31位哈希值

	// ========== 登录：验证密码 ==========
	// 正确密码
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	if err != nil {
		fmt.Println("密码验证失败:", err)
	} else {
		fmt.Println("密码验证成功")
	}

	// 错误密码
	err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrong_password"))
	if err != nil {
		fmt.Println("密码验证失败:", err) // crypto/bcrypt: hashedPassword is not the hash of the given password
	}
}
```

### 为什么 MD5/SHA256 不适合密码存储

```go
package main

import (
	"crypto/md5"
	"crypto/sha256"
	"fmt"
)

func main() {
	password := "123456"

	// MD5：速度极快，GPU 每秒可算数十亿次，极易被彩虹表破解
	md5Hash := md5.Sum([]byte(password)) // [!code error]
	fmt.Printf("MD5:    %x\n", md5Hash)

	// SHA256：速度同样极快，没有盐值，同一密码总是产生相同哈希
	sha256Hash := sha256.Sum256([]byte(password)) // [!code error]
	fmt.Printf("SHA256: %x\n", sha256Hash)

	// 问题1: 没有盐值 —— 相同密码产生相同哈希，容易被彩虹表攻击
	// 问题2: 速度太快 —— 现代 GPU 每秒可计算数十亿次 MD5/SHA256
	// 问题3: 不可调节 —— 无法随硬件升级增加计算成本

	// bcrypt/argon2 的优势:
	// - 内置随机盐值，每次哈希结果不同
	// - 可调节的 cost 参数，随硬件升级可增加计算难度
	// - 故意设计为慢速，抵御暴力破解
}
```

### argon2 替代方案

```go
package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"

	"golang.org/x/crypto/argon2"
)

// Argon2Params 定义 argon2 的参数
type Argon2Params struct {
	Time    uint32 // 迭代次数
	Memory  uint32 // 内存使用量（KB）
	Threads uint8  // 并行线程数
	KeyLen  uint32 // 输出哈希长度
	SaltLen uint32 // 盐值长度
}

// 推荐的默认参数（OWASP 推荐）
var defaultParams = &Argon2Params{
	Time:    3,
	Memory:  64 * 1024, // 64 MB
	Threads: 4,
	KeyLen:  32,
	SaltLen: 16,
}

// HashPassword 使用 argon2id 哈希密码
func HashPassword(password string, p *Argon2Params) (string, error) {
	salt := make([]byte, p.SaltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}

	// argon2id 是推荐变体，兼具抗侧信道攻击和抗 GPU 攻击的优势
	hash := argon2.IDKey([]byte(password), salt, p.Time, p.Memory, p.Threads, p.KeyLen)

	// 将盐值和哈希一起编码存储
	saltB64 := base64.RawStdEncoding.EncodeToString(salt)
	hashB64 := base64.RawStdEncoding.EncodeToString(hash)

	// 格式: $argon2id$v=19$m=65536,t=3,p=4$盐值$哈希
	encoded := fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, p.Memory, p.Time, p.Threads, saltB64, hashB64)
	return encoded, nil
}

func main() {
	hash, err := HashPassword("MyS3cureP@ssw0rd", defaultParams)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Argon2id 哈希:", hash)

	// bcrypt vs argon2:
	// bcrypt: 成熟稳定，广泛支持，足够应对大多数场景
	// argon2: 更现代，可调节内存使用，抗 GPU/ASIC 攻击能力更强
	// 推荐: 新项目优先考虑 argon2id，老项目继续使用 bcrypt 即可
}
```

### 讲解重点

- **常见错误做法（反模式）**：使用 MD5/SHA256 存储密码；不加盐或使用固定盐值；cost 设置过低（如 bcrypt cost=4）。
- **OWASP 安全风险**：对应 OWASP A02:2021 - Cryptographic Failures（加密失败），属于高危等级。密码明文存储或使用弱哈希是数据泄露后造成大规模账户接管的首要原因。
- **Go 社区最佳实践**：优先使用 `golang.org/x/crypto/bcrypt`（cost >= 10）；新项目可选 `argon2id`；永远不要自己实现密码哈希逻辑；密码验证使用 `CompareHashAndPassword` 而非手动比较（防止时序攻击）。

---

## 2. JWT 签发与验证

<GoSecurityDiagram kind="jwt-lifecycle" />

JSON Web Token（JWT）是无状态认证的主流方案，适用于微服务架构中的身份传递。服务端签发包含用户信息的 token，客户端在后续请求中携带该 token，服务端通过验证签名来确认身份，无需查询 session 存储。

### 完整 JWT 流程

```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// 密钥（生产环境应从 Secret Manager 获取，不要硬编码）
var jwtSecret = []byte("your-256-bit-secret-key-change-in-production") // [!code error]

// CustomClaims 自定义 Claims 结构
type CustomClaims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken 生成 JWT token
func GenerateToken(userID int64, username, role string) (string, error) {
	claims := CustomClaims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "my-app",
			Subject:   fmt.Sprintf("%d", userID),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)), // 短期 access token
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// GenerateRefreshToken 生成 refresh token（较长有效期）
func GenerateRefreshToken(userID int64) (string, error) {
	claims := jwt.RegisteredClaims{
		Subject:   fmt.Sprintf("%d", userID),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 天
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// ParseToken 解析并验证 JWT token
func ParseToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		// 验证签名算法，防止算法替换攻击
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok { // [!code highlight]
			return nil, fmt.Errorf("不支持的签名算法: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*CustomClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("无效的 token")
	}
	return claims, nil
}

// AuthMiddleware JWT 认证中间件
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从 Authorization 头获取 token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"缺少认证头"}`, http.StatusUnauthorized)
			return
		}

		// 格式: Bearer <token>
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error":"认证头格式错误"}`, http.StatusUnauthorized)
			return
		}

		claims, err := ParseToken(parts[1])
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"token 无效: %s"}`, err.Error()), http.StatusUnauthorized)
			return
		}

		// 将用户信息注入请求头，供下游 handler 使用
		r.Header.Set("X-User-ID", fmt.Sprintf("%d", claims.UserID))
		r.Header.Set("X-Username", claims.Username)
		r.Header.Set("X-Role", claims.Role)

		next(w, r)
	}
}

func main() {
	// 模拟登录：生成 token
	accessToken, err := GenerateToken(1001, "zhangsan", "admin")
	if err != nil {
		log.Fatal("生成 token 失败:", err)
	}
	fmt.Println("Access Token:", accessToken)

	refreshToken, err := GenerateRefreshToken(1001)
	if err != nil {
		log.Fatal("生成 refresh token 失败:", err)
	}
	fmt.Println("Refresh Token:", refreshToken)

	// 模拟验证
	claims, err := ParseToken(accessToken)
	if err != nil {
		log.Fatal("解析 token 失败:", err)
	}
	fmt.Printf("用户: %s, 角色: %s, 过期时间: %v\n",
		claims.Username, claims.Role, claims.ExpiresAt.Time)

	// 启动 HTTP 服务器（示例）
	http.HandleFunc("/api/profile", AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		userID := r.Header.Get("X-User-ID")
		username := r.Header.Get("X-Username")
		fmt.Fprintf(w, `{"user_id":"%s","username":"%s"}`, userID, username)
	}))

	fmt.Println("\n服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### HS256 vs RS256 的选择

```go
package main

import (
	"crypto/rand"
	"crypto/rsa"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	// ========== HS256（对称加密）==========
	// 签发和验证使用同一个密钥
	// 适合: 单体应用、签发和验证在同一服务内
	// 优势: 简单、性能好
	// 劣势: 密钥需要在所有验证方共享，密钥泄露风险高
	hmacSecret := []byte("shared-secret-key")
	hsToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "1001",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	})
	hsTokenString, _ := hsToken.SignedString(hmacSecret)
	fmt.Println("HS256 Token:", hsTokenString)

	// ========== RS256（非对称加密）==========
	// 私钥签发，公钥验证
	// 适合: 微服务架构，认证服务签发、各业务服务只需公钥验证
	// 优势: 公钥可以公开分发，私钥只在签发端保存
	// 劣势: 性能略低于 HS256，密钥管理稍复杂
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatal(err)
	}
	rsToken := jwt.NewWithClaims(jwt.SigningMethodRS256, jwt.RegisteredClaims{
		Subject:   "1001",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
	})
	rsTokenString, err := rsToken.SignedString(privateKey)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("RS256 Token:", rsTokenString)

	// 使用公钥验证（任何服务都可以验证，无需持有私钥）
	parsed, err := jwt.Parse(rsTokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("不支持的签名算法: %v", token.Header["alg"])
		}
		return &privateKey.PublicKey, nil
	})
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("RS256 验证结果:", parsed.Valid)

	// 选择建议:
	// - 单体应用 → HS256
	// - 微服务 / 多方验证 → RS256
	// - 需要 JWKS（公钥轮转）→ RS256 / ES256
}
```

### 讲解重点

- **常见错误做法（反模式）**：将密钥硬编码在代码中；不验证签名算法（alg 字段），导致算法替换攻击（如将 RS256 篡改为 none）；access token 有效期过长（如设置为永不过期）；在 JWT 中存储敏感信息（JWT payload 仅 base64 编码，不是加密）。
- **OWASP 安全风险**：对应 OWASP A07:2021 - Identification and Authentication Failures（身份识别和认证失败），属于高危等级。
- **Go 社区最佳实践**：使用 `github.com/golang-jwt/jwt/v5`（原 `dgrijalva/jwt-go` 的活跃维护分支）；始终在 `ParseWithClaims` 的 `keyFunc` 中验证算法；access token 设置 15 分钟有效期，配合 refresh token 实现续签；微服务架构选择 RS256，通过 JWKS endpoint 分发公钥。

---

## 3. TLS/HTTPS 配置

<GoSecurityDiagram kind="tls-mtls" />

::: warning 注意
所有生产环境的 HTTP 服务都必须启用 TLS 加密。切勿在生产环境使用 `InsecureSkipVerify: true` 跳过证书验证，最低版本应设置为 TLS 1.2。
:::

Go 标准库内置了完整的 TLS 支持，无需依赖 Nginx 等反向代理即可直接提供 HTTPS 服务。正确的 TLS 配置需要禁用过时的协议版本和弱密码套件，防止降级攻击。

### HTTPS 服务器配置

```go
package main

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "你好，这是 HTTPS 安全连接！TLS 版本: %d", r.TLS.Version)
	})

	// TLS 安全配置
	tlsConfig := &tls.Config{
		// 最低 TLS 版本设置为 1.2（TLS 1.0 和 1.1 已被弃用）
		MinVersion: tls.VersionTLS12, // [!code highlight]

		// 优先使用服务端的密码套件顺序
		PreferServerCipherSuites: true,

		// 指定安全的密码套件（仅 TLS 1.2 需要手动配置，TLS 1.3 自动选择安全套件）
		CipherSuites: []uint16{
			// TLS 1.3 密码套件（自动启用，无需列出）

			// TLS 1.2 推荐密码套件（仅保留 AEAD 模式）
			tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
			tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
			tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
			tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
		},

		// 支持的椭圆曲线
		CurvePreferences: []tls.CurveID{
			tls.X25519, // 最快最安全
			tls.CurveP256,
		},
	}

	server := &http.Server{
		Addr:      ":8443",
		Handler:   mux,
		TLSConfig: tlsConfig,
	}

	fmt.Println("HTTPS 服务器启动在 :8443")
	// 需要提供证书和私钥文件
	// 开发环境可使用 mkcert 生成本地信任的证书
	log.Fatal(server.ListenAndServeTLS("server.crt", "server.key"))
}
```

### mTLS（双向 TLS）认证

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"log"
	"net/http"
	"os"
)

func main() {
	// 加载 CA 证书（用于验证客户端证书）
	caCert, err := os.ReadFile("ca.crt")
	if err != nil {
		log.Fatal("读取 CA 证书失败:", err)
	}
	caCertPool := x509.NewCertPool()
	if !caCertPool.AppendCertsFromPEM(caCert) {
		log.Fatal("无法解析 CA 证书")
	}

	// mTLS 配置
	tlsConfig := &tls.Config{
		// 要求客户端提供证书并验证
		ClientAuth: tls.RequireAndVerifyClientCert,
		// 用于验证客户端证书的 CA 证书池
		ClientCAs:  caCertPool,
		MinVersion: tls.VersionTLS12,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// 获取客户端证书信息
		if len(r.TLS.PeerCertificates) > 0 {
			clientCert := r.TLS.PeerCertificates[0]
			fmt.Fprintf(w, "客户端身份: %s\n", clientCert.Subject.CommonName)
			fmt.Fprintf(w, "颁发机构: %s\n", clientCert.Issuer.CommonName)
		}
	})

	server := &http.Server{
		Addr:      ":8443",
		Handler:   mux,
		TLSConfig: tlsConfig,
	}

	fmt.Println("mTLS 服务器启动在 :8443（需要客户端证书）")
	log.Fatal(server.ListenAndServeTLS("server.crt", "server.key"))
}
```

### 讲解重点

- **常见错误做法（反模式）**：允许 TLS 1.0/1.1 连接；使用 `InsecureSkipVerify: true` 跳过证书验证（仅限开发调试）；未设置 HSTS 头部导致 HTTP 降级攻击；证书过期未设置自动续期。
- **OWASP 安全风险**：对应 OWASP A02:2021 - Cryptographic Failures。未加密的通信可被中间人攻击窃取凭据和数据。
- **Go 社区最佳实践**：最低版本设置为 TLS 1.2；生产环境使用 Let's Encrypt 自动证书（推荐 `autocert` 包）；微服务间通信使用 mTLS 进行双向认证；定期使用 [SSL Labs](https://www.ssllabs.com/ssltest/) 检测 TLS 配置等级。

---

## 4. SQL 注入防护

<GoSecurityDiagram kind="sql-injection" />

::: danger 警告
永远使用参数化查询，绝不拼接 SQL 字符串。SQL 注入可导致数据泄露、数据篡改、权限提升甚至远程命令执行，属于 OWASP A03 最高危级别。
:::

SQL 注入是 Web 应用最经典的安全漏洞之一。攻击者通过在用户输入中嵌入 SQL 语句片段，篡改查询逻辑，可以窃取数据、删除表甚至获取系统权限。

### 错误做法 vs 正确做法

```go
package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	db, err := sql.Open("mysql", "user:password@tcp(127.0.0.1:3306)/mydb")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	username := "admin' OR '1'='1" // 模拟恶意输入

	// ========== 错误做法：字符串拼接 SQL（严重漏洞！）==========
	// 攻击者输入 admin' OR '1'='1 将绕过认证
	query := fmt.Sprintf("SELECT id, username FROM users WHERE username = '%s'", username) // [!code error]
	fmt.Println("危险的 SQL:", query)
	// 实际执行: SELECT id, username FROM users WHERE username = 'admin' OR '1'='1'
	// 这会返回所有用户！

	// ========== 正确做法 1：使用占位符参数化查询 ==========
	row := db.QueryRow("SELECT id, username FROM users WHERE username = ?", username) // [!code highlight]
	var id int
	var name string
	if err := row.Scan(&id, &name); err != nil {
		fmt.Println("查询结果: 未找到用户（注入被阻止）")
	}

	// ========== 正确做法 2：使用 Prepare 预编译语句 ==========
	stmt, err := db.Prepare("SELECT id, username FROM users WHERE username = ? AND status = ?")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	// 预编译语句可复用，且参数始终被安全转义
	rows, err := stmt.Query(username, "active")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		if err := rows.Scan(&id, &name); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("用户: %d - %s\n", id, name)
	}
}
```

### GORM 中的安全查询

```go
package main

import (
	"fmt"
	"log"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type User struct {
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"size:100;uniqueIndex"`
	Email    string `gorm:"size:255"`
	Status   string `gorm:"size:20;default:active"`
}

func main() {
	dsn := "user:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	username := "admin' OR '1'='1" // 恶意输入

	// ========== 安全：GORM 的 Where 方法自动参数化 ==========
	var user User
	result := db.Where("username = ?", username).First(&user)
	if result.Error != nil {
		fmt.Println("GORM 查询: 未找到用户（注入被阻止）")
	}

	// ========== 安全：使用结构体条件查询 ==========
	result = db.Where(&User{Username: username, Status: "active"}).First(&user)
	if result.Error != nil {
		fmt.Println("结构体查询: 未找到用户")
	}

	// ========== 危险：GORM 中的 Raw SQL 也要使用参数 ==========
	// 正确
	db.Raw("SELECT * FROM users WHERE username = ?", username).Scan(&user)

	// 错误！直接拼接字符串同样会导致 SQL 注入
	// db.Raw(fmt.Sprintf("SELECT * FROM users WHERE username = '%s'", username)).Scan(&user)

	// ========== 安全：模糊查询也要参数化 ==========
	var users []User
	searchTerm := "admin"
	db.Where("username LIKE ?", "%"+searchTerm+"%").Find(&users)
	fmt.Printf("搜索结果: %d 条\n", len(users))
}
```

### 讲解重点

- **常见错误做法（反模式）**：使用 `fmt.Sprintf` 拼接 SQL 查询；信任前端已做过的输入过滤；在 ORM 的 Raw 方法中拼接字符串；对 LIKE 查询中的通配符未转义。
- **OWASP 安全风险**：对应 OWASP A03:2021 - Injection（注入攻击），属于最高危级别。SQL 注入可导致数据泄露、数据篡改、权限提升甚至远程命令执行。
- **Go 社区最佳实践**：始终使用 `?`（MySQL）或 `$1`（PostgreSQL）占位符；高频查询使用 `db.Prepare` 预编译；ORM 层面使用结构体条件或 `Where("col = ?", val)` 语法；开启 gosec 的 G201 规则扫描 SQL 拼接。

---

## 5. XSS 防护

<GoSecurityDiagram kind="xss-csp" />

::: danger 警告
在 HTML 输出场景中，严禁使用 `text/template` 代替 `html/template`，也不要使用 `template.HTML()` 强制将用户输入标记为安全来绕过自动转义。
:::

跨站脚本攻击（XSS）是指攻击者将恶意脚本注入到 Web 页面中，当其他用户浏览该页面时，脚本会在其浏览器中执行，从而窃取 Cookie、会话信息或执行恶意操作。Go 的 `html/template` 内置了自动转义机制，是防护 XSS 的第一道防线。

### html/template 自动转义 vs text/template 风险

```go
package main

import (
	"html/template"
	"net/http"
	"log"
	texttemplate "text/template"
)

// 模拟用户输入（含恶意脚本）
var userInput = `<script>alert('XSS攻击！你的Cookie: '+document.cookie)</script>`

// 安全模板（html/template 自动转义）
var safeTemplate = template.Must(template.New("safe").Parse(` // [!code highlight]
<!DOCTYPE html>
<html>
<head><title>安全页面</title></head>
<body>
	<h1>用户评论</h1>
	<p>{{.Comment}}</p>
</body>
</html>
`))

// 危险模板（text/template 不做转义）
var unsafeTemplate = texttemplate.Must(texttemplate.New("unsafe").Parse(` // [!code error]
<!DOCTYPE html>
<html>
<head><title>不安全页面</title></head>
<body>
	<h1>用户评论</h1>
	<p>{{.Comment}}</p>
</body>
</html>
`))

func main() {
	data := map[string]string{
		"Comment": userInput,
	}

	// 安全路由：html/template 会自动将 <script> 转义为 &lt;script&gt;
	http.HandleFunc("/safe", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		safeTemplate.Execute(w, data)
		// 输出: &lt;script&gt;alert(&#39;XSS攻击...&#39;)&lt;/script&gt;
		// 浏览器会显示为纯文本，脚本不会执行
	})

	// 危险路由：text/template 原样输出，脚本会执行！
	http.HandleFunc("/unsafe", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		unsafeTemplate.Execute(w, data)
		// 输出: <script>alert('XSS攻击...')</script>
		// 浏览器会执行这段脚本！
	})

	log.Println("服务器启动在 :8080")
	log.Println("安全页面: http://localhost:8080/safe")
	log.Println("不安全页面: http://localhost:8080/unsafe")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### Content-Security-Policy 头设置

```go
package main

import (
	"fmt"
	"log"
	"net/http"
)

// CSPMiddleware 设置 Content-Security-Policy 头
func CSPMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Content-Security-Policy 指令说明：
		// default-src 'self'      — 默认只允许同源资源
		// script-src 'self'       — 脚本只允许同源（禁止 inline 和 eval）
		// style-src 'self'        — 样式只允许同源
		// img-src 'self' data:    — 图片允许同源和 data: URI
		// font-src 'self'         — 字体只允许同源
		// connect-src 'self'      — AJAX/WebSocket 只允许同源
		// frame-ancestors 'none'  — 禁止被 iframe 嵌入（防止点击劫持）
		// form-action 'self'      — 表单提交只允许同源
		csp := "default-src 'self'; " +
			"script-src 'self'; " +
			"style-src 'self'; " +
			"img-src 'self' data:; " +
			"font-src 'self'; " +
			"connect-src 'self'; " +
			"frame-ancestors 'none'; " +
			"form-action 'self'"

		w.Header().Set("Content-Security-Policy", csp)

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "CSP 已启用，检查响应头")
	})

	// 包装中间件
	handler := CSPMiddleware(mux)

	log.Println("服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### 讲解重点

- **常见错误做法（反模式）**：在 HTML 输出场景使用 `text/template` 代替 `html/template`；使用 `template.HTML()` 强制将用户输入标记为安全（绕过自动转义）；忘记对 JavaScript 上下文、URL 上下文中的输出做上下文相关的转义；未设置 CSP 头。
- **OWASP 安全风险**：对应 OWASP A03:2021 - Injection（注入攻击）中的 XSS 子类。存储型 XSS 尤其危险，可长期影响所有访问该页面的用户。
- **Go 社区最佳实践**：始终使用 `html/template` 处理 HTML 输出；避免使用 `template.HTML` / `template.JS` 等类型绕过转义（除非内容来源完全可信）；配合 CSP 头实现纵深防御；API 服务设置 `Content-Type: application/json` 防止浏览器将 JSON 响应解析为 HTML。

---

## 6. CSRF 防护

<GoSecurityDiagram kind="csrf-protection" />

::: warning 注意
仅依赖 `Referer` / `Origin` 头判断请求来源是不够的（可被伪造）。如果你的 API 使用 Cookie 认证，即使是 JSON API 也需要 CSRF 防护。纯 JWT Bearer Token 认证（不使用 Cookie）的 API 天然免疫 CSRF。
:::

跨站请求伪造（CSRF）是指攻击者诱导已登录用户的浏览器向目标网站发送伪造请求，利用用户的身份执行非授权操作（如转账、修改密码）。防护的核心是在表单中嵌入服务端生成的随机 token，并在提交时验证该 token。

### 使用 gorilla/csrf 实现 CSRF 防护

```go
package main

import (
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/gorilla/csrf"
	"github.com/gorilla/mux"
)

var formTemplate = template.Must(template.New("form").Parse(`
<!DOCTYPE html>
<html>
<head><title>CSRF 防护示例</title></head>
<body>
	<h1>修改密码</h1>
	<form method="POST" action="/change-password">
		<!-- CSRF token 隐藏字段，由中间件自动生成 -->
		<input type="hidden" name="gorilla.csrf.Token" value="{{.CSRFToken}}">
		<label>新密码: <input type="password" name="password"></label><br><br>
		<label>确认密码: <input type="password" name="confirm"></label><br><br>
		<button type="submit">修改密码</button>
	</form>
</body>
</html>
`))

func showForm(w http.ResponseWriter, r *http.Request) {
	formTemplate.Execute(w, map[string]interface{}{
		// csrf.Token(r) 生成当前请求的 CSRF token
		"CSRFToken": csrf.Token(r),
	})
}

func changePassword(w http.ResponseWriter, r *http.Request) {
	// 如果 CSRF token 验证失败，gorilla/csrf 中间件会自动返回 403
	// 代码执行到这里说明 token 验证通过
	password := r.FormValue("password")
	fmt.Fprintf(w, "密码修改成功（长度: %d）", len(password))
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/change-password", showForm).Methods("GET")
	r.HandleFunc("/change-password", changePassword).Methods("POST")

	// CSRF 中间件配置
	// 32 字节的认证密钥（生产环境应从 Secret Manager 获取）
	csrfKey := []byte("32-byte-long-auth-key-1234567890")
	csrfMiddleware := csrf.Protect(
		csrfKey,
		csrf.Secure(true),                 // 生产环境设为 true（仅 HTTPS）
		csrf.HttpOnly(true),               // Cookie 不可被 JavaScript 访问
		csrf.SameSite(csrf.SameSiteStrict), // 严格的 SameSite 策略
		csrf.Path("/"),                     // Cookie 路径
	)

	fmt.Println("服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", csrfMiddleware(r)))
}
```

### 手动实现 CSRF 防护（适用于 API 场景）

```go
package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// CSRFStore 简单的 CSRF token 存储
type CSRFStore struct {
	mu     sync.RWMutex
	tokens map[string]time.Time // token -> 过期时间
}

func NewCSRFStore() *CSRFStore {
	return &CSRFStore{tokens: make(map[string]time.Time)}
}

// GenerateToken 生成 CSRF token
func (s *CSRFStore) GenerateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)

	s.mu.Lock()
	s.tokens[token] = time.Now().Add(1 * time.Hour) // 1 小时有效期
	s.mu.Unlock()

	return token, nil
}

// ValidateToken 验证并消费 CSRF token（一次性使用）
func (s *CSRFStore) ValidateToken(token string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	expiry, exists := s.tokens[token]
	if !exists || time.Now().After(expiry) {
		return false
	}
	delete(s.tokens, token) // 一次性 token，验证后立即删除
	return true
}

func main() {
	store := NewCSRFStore()

	http.HandleFunc("/api/csrf-token", func(w http.ResponseWriter, r *http.Request) {
		token, err := store.GenerateToken()
		if err != nil {
			http.Error(w, "生成 token 失败", http.StatusInternalServerError)
			return
		}
		// 同时设置 Cookie 和返回 header
		http.SetCookie(w, &http.Cookie{
			Name:     "csrf_token",
			Value:    token,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
			Path:     "/",
		})
		w.Header().Set("X-CSRF-Token", token)
		fmt.Fprintf(w, `{"csrf_token":"%s"}`, token)
	})

	http.HandleFunc("/api/transfer", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "仅支持 POST", http.StatusMethodNotAllowed)
			return
		}

		// 从请求头获取 token
		token := r.Header.Get("X-CSRF-Token")
		if token == "" {
			http.Error(w, "缺少 CSRF token", http.StatusForbidden)
			return
		}

		if !store.ValidateToken(token) {
			http.Error(w, "CSRF token 无效或已过期", http.StatusForbidden)
			return
		}

		fmt.Fprintf(w, `{"message":"转账成功"}`)
	})

	log.Println("服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### 讲解重点

- **常见错误做法（反模式）**：仅依赖 `Referer` / `Origin` 头判断请求来源（可被伪造）；CSRF token 可复用（未做一次性消费）；未对 Cookie 设置 `SameSite` 属性；JSON API 认为自己不需要 CSRF 防护（如果使用 Cookie 认证仍需防护）。
- **OWASP 安全风险**：CSRF 在 OWASP 2021 中被归入 A01:2021 - Broken Access Control（访问控制缺陷），属于最高危等级。
- **Go 社区最佳实践**：表单类应用使用 `gorilla/csrf` 中间件；API 服务使用 `X-CSRF-Token` 头 + `SameSite=Strict` Cookie 的双重验证；SPA 应用可使用 Double Submit Cookie 模式；纯 JWT Bearer Token 认证（不使用 Cookie）的 API 天然免疫 CSRF。

---

## 7. 输入验证与 Sanitization

<GoSecurityDiagram kind="input-validation" />

::: warning 注意
永远不要信任来自客户端的任何输入。只在前端做输入验证而后端不验证是常见的安全反模式，所有注入攻击的入口都是未经验证的用户输入。
:::

输入验证是安全的第一道防线，需要在服务端对所有用户输入进行格式、长度、范围和业务规则的校验。Go 社区广泛使用 `go-playground/validator` 库，支持声明式的结构体标签验证。

### 完整的用户注册验证

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"unicode"

	"github.com/go-playground/validator/v10"
)

// RegisterRequest 用户注册请求
type RegisterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=20,alphanum"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8,max=128,strong_password"`
	Phone    string `json:"phone" validate:"required,cn_phone"`
	Age      int    `json:"age" validate:"required,gte=1,lte=150"`
	Website  string `json:"website" validate:"omitempty,url"`
}

var validate *validator.Validate

func init() {
	validate = validator.New()

	// 注册自定义验证器：强密码
	validate.RegisterValidation("strong_password", validateStrongPassword)

	// 注册自定义验证器：中国大陆手机号
	validate.RegisterValidation("cn_phone", validateCNPhone)
}

// validateStrongPassword 验证密码强度
// 要求至少包含：一个大写字母、一个小写字母、一个数字、一个特殊字符
func validateStrongPassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasDigit = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSpecial = true
		}
	}
	return hasUpper && hasLower && hasDigit && hasSpecial
}

// validateCNPhone 验证中国大陆手机号（1 开头的 11 位数字）
func validateCNPhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	matched, _ := regexp.MatchString(`^1[3-9]\d{9}$`, phone)
	return matched
}

// formatValidationErrors 将验证错误转换为友好的中文提示
func formatValidationErrors(err error) map[string]string {
	errors := make(map[string]string)
	for _, e := range err.(validator.ValidationErrors) {
		field := e.Field()
		switch e.Tag() {
		case "required":
			errors[field] = fmt.Sprintf("%s 不能为空", field)
		case "email":
			errors[field] = "邮箱格式不正确"
		case "min":
			errors[field] = fmt.Sprintf("%s 长度至少为 %s", field, e.Param())
		case "max":
			errors[field] = fmt.Sprintf("%s 长度不能超过 %s", field, e.Param())
		case "alphanum":
			errors[field] = fmt.Sprintf("%s 只能包含字母和数字", field)
		case "strong_password":
			errors[field] = "密码必须包含大写字母、小写字母、数字和特殊字符"
		case "cn_phone":
			errors[field] = "请输入正确的手机号"
		case "url":
			errors[field] = "URL 格式不正确"
		case "gte":
			errors[field] = fmt.Sprintf("%s 不能小于 %s", field, e.Param())
		case "lte":
			errors[field] = fmt.Sprintf("%s 不能大于 %s", field, e.Param())
		default:
			errors[field] = fmt.Sprintf("%s 验证失败: %s", field, e.Tag())
		}
	}
	return errors
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "请求体格式错误"})
		return
	}

	// 执行验证
	if err := validate.Struct(req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "输入验证失败",
			"fields": formatValidationErrors(err),
		})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "注册成功"})
}

func main() {
	// 测试验证
	testCases := []RegisterRequest{
		{Username: "ab", Email: "bad", Password: "123", Phone: "123", Age: 0},                               // 全部失败
		{Username: "zhangsan", Email: "test@example.com", Password: "Abc@1234", Phone: "13800138000", Age: 25}, // 全部通过
	}

	for i, tc := range testCases {
		err := validate.Struct(tc)
		if err != nil {
			fmt.Printf("测试 %d: 验证失败\n", i+1)
			for field, msg := range formatValidationErrors(err) {
				fmt.Printf("  - %s: %s\n", field, msg)
			}
		} else {
			fmt.Printf("测试 %d: 验证通过\n", i+1)
		}
	}

	// 启动服务
	http.HandleFunc("/api/register", registerHandler)
	log.Println("服务器启动在 :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### 讲解重点

- **常见错误做法（反模式）**：只在前端做输入验证而后端不验证；验证错误消息暴露内部实现细节（如 "SQL 语法错误"）；未限制字符串最大长度导致内存消耗攻击；使用黑名单过滤而非白名单验证。
- **OWASP 安全风险**：输入验证不足是 OWASP A03:2021 - Injection 的根本原因。所有注入攻击（SQL、XSS、命令注入等）的入口都是未经验证的用户输入。
- **Go 社区最佳实践**：使用 `go-playground/validator` 做结构体级别的声明式验证；自定义验证器封装业务规则（密码强度、手机号格式等）；验证错误返回友好的用户提示，不暴露内部信息；对 JSON 请求体限制大小（`http.MaxBytesReader`）。

---

## 8. 安全的 HTTP Header 配置

<GoSecurityDiagram kind="security-headers" />

::: tip 建议
建议在中间件层统一设置安全头，确保覆盖所有响应。API 服务至少设置 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security` 三个头。
:::

HTTP 安全头是 Web 安全的重要防线，通过指示浏览器启用或禁用特定行为，可以有效防护 XSS、点击劫持、MIME 嗅探等攻击。

### 安全头中间件

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

// SecurityHeadersMiddleware 统一设置安全 HTTP 头
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. X-Content-Type-Options: nosniff
		// 防止浏览器 MIME 类型嗅探，确保浏览器严格按照 Content-Type 解析响应
		// 防护: 阻止浏览器将非脚本文件当作脚本执行
		w.Header().Set("X-Content-Type-Options", "nosniff")

		// 2. X-Frame-Options: DENY
		// 禁止页面被 iframe 嵌入，防止点击劫持攻击
		// DENY: 完全禁止 | SAMEORIGIN: 仅允许同源 | ALLOW-FROM uri: 指定来源
		w.Header().Set("X-Frame-Options", "DENY")

		// 3. Strict-Transport-Security (HSTS)
		// 告知浏览器仅通过 HTTPS 访问，防止 SSL 剥离攻击
		// max-age=31536000: 一年有效期
		// includeSubDomains: 覆盖所有子域名
		// preload: 允许加入浏览器 HSTS 预加载列表
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")

		// 4. Content-Security-Policy (CSP)
		// 最强大的 XSS 防护头，控制页面可以加载哪些资源
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; "+
				"script-src 'self'; "+
				"style-src 'self' 'unsafe-inline'; "+
				"img-src 'self' data: https:; "+
				"font-src 'self'; "+
				"connect-src 'self'; "+
				"frame-ancestors 'none'; "+
				"base-uri 'self'; "+
				"form-action 'self'")

		// 5. X-XSS-Protection
		// 旧版浏览器的 XSS 过滤器（现代浏览器已内置更好的防护）
		// 注意: 在有 CSP 的情况下此头可省略，部分安全专家甚至建议设为 0
		w.Header().Set("X-XSS-Protection", "1; mode=block")

		// 6. Referrer-Policy
		// 控制 Referer 头在跨域请求时泄露多少信息
		// strict-origin-when-cross-origin: 同源发送完整路径，跨域仅发送源
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// 7. Permissions-Policy（原 Feature-Policy）
		// 控制浏览器功能的使用权限（摄像头、麦克风、地理位置等）
		w.Header().Set("Permissions-Policy",
			"camera=(), microphone=(), geolocation=(), payment=()")

		// 8. Cache-Control（针对包含敏感数据的响应）
		// 防止敏感数据被浏览器或中间代理缓存
		if r.URL.Path == "/api/profile" || r.URL.Path == "/api/settings" {
			w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
			w.Header().Set("Pragma", "no-cache")
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "安全头已设置，请查看响应头")
	})

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	})

	// 应用安全头中间件
	handler := SecurityHeadersMiddleware(mux)

	log.Println("服务器启动在 :8080")
	log.Println("使用 curl -I http://localhost:8080 查看安全头")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### 讲解重点

- **常见错误做法（反模式）**：不设置任何安全头；CSP 设置 `unsafe-inline` 和 `unsafe-eval`（大幅削弱 XSS 防护）；HSTS 的 `max-age` 设置过短；不同路由使用不同的安全头配置导致遗漏。
- **OWASP 安全风险**：对应 OWASP A05:2021 - Security Misconfiguration（安全配置错误）。缺少安全头是安全扫描工具最常报告的问题之一。
- **Go 社区最佳实践**：在中间件层统一设置安全头，确保覆盖所有响应；使用 [securityheaders.com](https://securityheaders.com) 在线检测评分；API 服务至少设置 `X-Content-Type-Options`、`X-Frame-Options`、`Strict-Transport-Security`；根据业务需求逐步收紧 CSP 策略。

---

## 9. Secret 管理

<GoSecurityDiagram kind="secret-lifecycle" />

::: danger 警告
硬编码的 secret 一旦提交到 Git 仓库，几乎无法彻底清除——即使删除文件，历史提交中仍然存在。严禁在代码中硬编码数据库密码或 API Key。
:::

Secret（密钥、数据库密码、API Key 等）的管理是应用安全的基础。正确的做法是将 secret 与代码分离，通过环境变量或专用的 Secret Manager 注入。

### 环境变量与 .env 文件管理

```go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// AppConfig 应用配置
type AppConfig struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	APIKey     string
}

// LoadConfig 从环境变量加载配置
func LoadConfig() (*AppConfig, error) {
	// 开发环境加载 .env 文件，生产环境通过系统环境变量注入
	// .env 文件不会覆盖已存在的环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("未找到 .env 文件，将使用系统环境变量")
	}

	config := &AppConfig{
		DBHost:     getEnvOrDefault("DB_HOST", "localhost"),
		DBPort:     getEnvOrDefault("DB_PORT", "3306"),
		DBUser:     getEnvRequired("DB_USER"),
		DBPassword: getEnvRequired("DB_PASSWORD"),
		DBName:     getEnvRequired("DB_NAME"),
		JWTSecret:  getEnvRequired("JWT_SECRET"),
		APIKey:     getEnvRequired("API_KEY"),
	}

	return config, nil
}

// getEnvRequired 获取必需的环境变量，缺失则 panic
func getEnvRequired(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("必需的环境变量 %s 未设置", key)
	}
	return value
}

// getEnvOrDefault 获取环境变量，缺失则使用默认值
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	config, err := LoadConfig()
	if err != nil {
		log.Fatal("加载配置失败:", err)
	}

	fmt.Printf("数据库连接: %s:%s@%s:%s/%s\n",
		config.DBUser, "****", config.DBHost, config.DBPort, config.DBName)

	// 重要：日志中永远不要打印 secret 的值
	// 错误: log.Printf("JWT Secret: %s", config.JWTSecret)
	// 正确: log.Printf("JWT Secret: [已设置, 长度=%d]", len(config.JWTSecret))
	fmt.Printf("JWT Secret: [已设置, 长度=%d]\n", len(config.JWTSecret))
}
```

### .gitignore 与 Secret 防泄露

```bash
# .env 文件示例（不要提交到 Git！）
# 文件名: .env.example（提交此模板文件，供团队参考）

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your-jwt-secret-at-least-32-chars
API_KEY=your-api-key
```

```txt
# .gitignore 必须包含以下规则

# 环境变量文件
.env
.env.local
.env.*.local

# 密钥文件
*.pem
*.key
*.p12
*.jks

# 凭据文件
credentials.json
service-account.json
```

```go
package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
)

// CheckGitSecrets 检查 Git 仓库中是否存在 secret 泄露
func CheckGitSecrets() {
	// 检查 .gitignore 是否包含常见的 secret 文件模式
	patterns := []string{".env", "*.pem", "*.key", "credentials.json"}

	gitignore, err := os.ReadFile(".gitignore")
	if err != nil {
		fmt.Println("警告: 未找到 .gitignore 文件！")
		return
	}

	content := string(gitignore)
	for _, pattern := range patterns {
		if !strings.Contains(content, pattern) {
			fmt.Printf("警告: .gitignore 中缺少 '%s' 规则\n", pattern)
		}
	}

	// 使用 git log 检查历史中是否有敏感文件
	cmd := exec.Command("git", "log", "--all", "--diff-filter=A", "--name-only", "--format=", "--", "*.env", "*.pem", "*.key")
	output, err := cmd.Output()
	if err == nil && len(output) > 0 {
		fmt.Println("危险: Git 历史中发现以下敏感文件:")
		fmt.Println(string(output))
		fmt.Println("请使用 git filter-branch 或 BFG Repo Cleaner 清理历史")
	} else {
		fmt.Println("检查通过: Git 历史中未发现敏感文件")
	}
}

func main() {
	CheckGitSecrets()

	// Secret 管理最佳实践汇总:
	// 1. 开发环境: .env 文件 + godotenv
	// 2. CI/CD: Pipeline 的 Secret Variables（GitHub Secrets, GitLab CI Variables）
	// 3. 生产环境: Secret Manager（AWS Secrets Manager, HashiCorp Vault, K8s Secrets）
	// 4. 代码审查: 使用 git-secrets 或 gitleaks 扫描提交
	fmt.Println("\n推荐工具:")
	fmt.Println("  - gitleaks: 扫描 Git 仓库中的硬编码 secret")
	fmt.Println("  - git-secrets: AWS 出品的 secret 扫描工具")
	fmt.Println("  - sops: 加密的 secret 文件管理")
}
```

### 讲解重点

- **常见错误做法（反模式）**：在代码中硬编码数据库密码或 API Key；将 `.env` 文件提交到 Git；在日志中打印 secret 值；在 Docker 镜像中嵌入 secret（应通过环境变量或 Secret Volume 挂载）。
- **OWASP 安全风险**：对应 OWASP A02:2021 - Cryptographic Failures 和 A07:2021 - Identification and Authentication Failures。硬编码凭据是最常见的安全审计发现之一。
- **Go 社区最佳实践**：开发环境使用 `godotenv` 加载 `.env` 文件；生产环境使用 Secret Manager（Vault、AWS Secrets Manager）；CI 中集成 `gitleaks` 扫描每次提交；提供 `.env.example` 模板文件供团队参考，但永远不提交真实的 `.env` 文件。

---

## 10. gosec 静态安全扫描

<GoSecurityDiagram kind="gosec-pipeline" />

::: tip 建议
将 gosec 集成到 CI/CD 流水线中，在代码合并前自动拦截安全问题。配合 `golangci-lint`（内置 gosec 规则）可统一代码质量和安全检查。
:::

gosec 是 Go 社区最主流的静态安全分析工具，能够在编译前发现代码中的安全隐患，包括硬编码凭据、SQL 注入风险、弱加密算法、不安全的文件权限等。

### 安装和基本使用

```bash
# 安装 gosec
go install github.com/securego/gosec/v2/cmd/gosec@latest

# 扫描当前项目
gosec ./...

# 以 JSON 格式输出结果（适合 CI 集成）
gosec -fmt=json -out=gosec-results.json ./...

# 以 SARIF 格式输出（GitHub Code Scanning 支持）
gosec -fmt=sarif -out=gosec-results.sarif ./...

# 仅扫描特定规则
gosec -include=G101,G201,G401 ./...

# 排除特定规则
gosec -exclude=G104 ./...

# 扫描指定目录
gosec -r /path/to/project/...
```

### 常见 gosec 规则及示例

```go
package main

import (
	"crypto/md5"  // gosec G401: 使用弱加密哈希函数
	"crypto/rand"
	"database/sql"
	"fmt"
	"math/big"
	"net/http"
	"os"
	"os/exec"
)

// ========== G101: 硬编码凭据 ==========
// gosec 会检测变量名中包含 password, secret, token, key 等关键词的字符串赋值

// 错误：硬编码密码（gosec 会报 G101）
var dbPassword = "super_secret_password_123" //nolint:gosec // 仅用于示例 // [!code error]

// 正确：从环境变量获取
var dbPasswordSafe = os.Getenv("DB_PASSWORD") // [!code highlight]

// ========== G201: SQL 注入 ==========
func unsafeQuery(db *sql.DB, username string) {
	// 错误：字符串拼接 SQL（gosec 会报 G201）
	query := "SELECT * FROM users WHERE username = '" + username + "'" //nolint:gosec // 仅用于示例 // [!code error]
	db.Query(query)                                                    //nolint:gosec

	// 正确：参数化查询
	db.Query("SELECT * FROM users WHERE username = ?", username) // [!code highlight]
}

// ========== G401: 弱加密哈希 ==========
func weakHash(data []byte) {
	// 错误：使用 MD5（gosec 会报 G401）
	hash := md5.Sum(data) //nolint:gosec // 仅用于示例
	fmt.Printf("%x\n", hash)

	// 正确：使用 SHA-256 或更强的算法
	// hash := sha256.Sum256(data)
}

// ========== G104: 未检查的错误 ==========
func uncheckedError() {
	f, _ := os.Open("file.txt") //nolint:gosec // 仅用于示例
	defer f.Close()

	// 正确：始终检查错误
	// f, err := os.Open("file.txt")
	// if err != nil { ... }
}

// ========== G204: 命令注入 ==========
func commandInjection(userInput string) {
	// 错误：直接将用户输入作为命令参数（gosec 会报 G204）
	cmd := exec.Command("sh", "-c", userInput) //nolint:gosec // 仅用于示例
	cmd.Run()                                   //nolint:gosec

	// 正确：使用白名单或严格验证输入
}

// ========== G301/G302: 不安全的文件权限 ==========
func unsafeFilePerms() {
	// 错误：0777 权限（gosec 会报 G301）
	os.Mkdir("data", 0777) //nolint:gosec // 仅用于示例 // [!code error]

	// 正确：使用最小权限
	os.Mkdir("data", 0750) // [!code highlight]

	// 错误：0666 文件权限（gosec 会报 G302）
	os.WriteFile("config.txt", []byte("data"), 0666) //nolint:gosec

	// 正确
	os.WriteFile("config.txt", []byte("data"), 0600)
}

// ========== G114: 使用 net/http 默认的 ServeMux ==========
func unsafeHTTPServer() {
	// 错误：http.ListenAndServe 使用空 handler 会使用 DefaultServeMux
	// 这在某些场景下会引入安全风险（gosec G114）
	http.ListenAndServe(":8080", nil) //nolint:gosec

	// 正确：显式创建 ServeMux
	mux := http.NewServeMux()
	server := &http.Server{Addr: ":8080", Handler: mux}
	server.ListenAndServe() //nolint:gosec
}

func main() {
	// 使用 crypto/rand 生成安全随机数（而不是 math/rand）
	n, _ := rand.Int(rand.Reader, big.NewInt(100))
	fmt.Println("安全随机数:", n)
}
```

### CI 集成示例

```yaml
# GitHub Actions 集成 gosec
# 文件: .github/workflows/security.yml

name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  gosec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run gosec
        uses: securego/gosec@master
        with:
          args: '-fmt sarif -out gosec-results.sarif ./...'

      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: gosec-results.sarif
```

### 处理误报

```go
package main

import (
	"fmt"
	"os"
)

func main() {
	// 方法 1: 行级别忽略（推荐，精确控制）
	password := os.Getenv("DB_PASSWORD") //nolint:gosec // 变量名含 password，但值来自环境变量，非硬编码
	fmt.Println("密码已从环境变量加载, 长度:", len(password))

	// 方法 2: 使用 #nosec 注释（gosec 原生语法）
	testToken := "test-token-for-unit-test" // #nosec G101 -- 仅用于单元测试，非生产凭据

	// 方法 3: 在 gosec 配置文件中排除特定路径
	// gosec -exclude-dir=test -exclude-dir=vendor ./...

	// 方法 4: 创建 .gosec.config 配置文件
	// 可全局排除某些规则或路径

	fmt.Println(testToken)
}
```

### 讲解重点

- **常见错误做法（反模式）**：项目中完全不做静态安全扫描；滥用 `#nosec` 注释忽略所有告警；仅在本地偶尔手动运行 gosec 而不集成到 CI；忽略 gosec 报告的低危问题（低危问题组合可能构成高危漏洞）。
- **OWASP 安全风险**：gosec 覆盖了 OWASP Top 10 中的多个类别，包括 A02（加密失败）、A03（注入）、A05（安全配置错误）、A07（身份认证失败）等。
- **Go 社区最佳实践**：在 CI/CD 中强制运行 gosec，PR 级别拦截安全问题；配合 `golangci-lint`（内置 gosec 规则）统一代码质量和安全检查；误报使用 `#nosec` 注释时必须附加原因说明；定期更新 gosec 版本以获取最新规则。

---

## 11. 速率限制与防暴力破解

<GoSecurityDiagram kind="brute-force-protection" />

::: warning 注意
没有速率限制的登录接口可以被暴力破解工具在数分钟内尝试数百万个密码组合。应同时按用户名和 IP 双维度进行限制，仅按 IP 限制可被代理池绕过。
:::

速率限制是保护 API 端点免受滥用的关键机制。Go 标准扩展库 `golang.org/x/time/rate` 提供了基于令牌桶算法的速率限制器，适用于大多数场景。

### API 速率限制中间件

```go
package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// IPRateLimiter 基于 IP 的速率限制器
type IPRateLimiter struct {
	mu       sync.RWMutex
	limiters map[string]*rateLimiterEntry
	rate     rate.Limit // 每秒允许的请求数
	burst    int        // 突发容量
}

type rateLimiterEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

func NewIPRateLimiter(r rate.Limit, burst int) *IPRateLimiter {
	rl := &IPRateLimiter{
		limiters: make(map[string]*rateLimiterEntry),
		rate:     r,
		burst:    burst,
	}

	// 后台清理过期的限制器（防止内存泄漏）
	go rl.cleanup()

	return rl
}

// GetLimiter 获取指定 IP 的限制器
func (rl *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	entry, exists := rl.limiters[ip]
	if !exists {
		limiter := rate.NewLimiter(rl.rate, rl.burst)
		rl.limiters[ip] = &rateLimiterEntry{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	entry.lastSeen = time.Now()
	return entry.limiter
}

// cleanup 定期清理过期的限制器
func (rl *IPRateLimiter) cleanup() {
	for {
		time.Sleep(time.Minute)

		rl.mu.Lock()
		for ip, entry := range rl.limiters {
			if time.Since(entry.lastSeen) > 3*time.Minute {
				delete(rl.limiters, ip)
			}
		}
		rl.mu.Unlock()
	}
}

// RateLimitMiddleware 速率限制中间件
func RateLimitMiddleware(limiter *IPRateLimiter) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// 提取客户端 IP（考虑反向代理）
			ip := r.Header.Get("X-Real-IP")
			if ip == "" {
				ip = r.Header.Get("X-Forwarded-For")
			}
			if ip == "" {
				ip, _, _ = net.SplitHostPort(r.RemoteAddr)
			}

			rl := limiter.GetLimiter(ip)
			if !rl.Allow() {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "1") // 建议客户端等待 1 秒后重试
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "请求过于频繁，请稍后再试",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func main() {
	// 每秒 10 个请求，突发容量 20
	limiter := NewIPRateLimiter(10, 20)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]string{"message": "请求成功"})
	})

	handler := RateLimitMiddleware(limiter)(mux)

	log.Println("服务器启动在 :8080（速率限制: 10 req/s）")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
```

### 登录防暴力破解（失败次数限制 + 渐进延迟）

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// LoginAttempt 登录尝试记录
type LoginAttempt struct {
	FailCount  int       // 连续失败次数
	LastFail   time.Time // 最后一次失败时间
	LockedUtil time.Time // 锁定到什么时候
}

// BruteForceProtector 暴力破解防护器
type BruteForceProtector struct {
	mu       sync.RWMutex
	attempts map[string]*LoginAttempt // key: username 或 IP
	// 配置
	maxAttempts    int           // 最大失败次数
	lockDuration   time.Duration // 基础锁定时长
	cleanupPeriod  time.Duration // 清理周期
}

func NewBruteForceProtector(maxAttempts int, lockDuration time.Duration) *BruteForceProtector {
	bp := &BruteForceProtector{
		attempts:      make(map[string]*LoginAttempt),
		maxAttempts:   maxAttempts,
		lockDuration:  lockDuration,
		cleanupPeriod: 10 * time.Minute,
	}

	go bp.cleanup()
	return bp
}

// IsBlocked 检查是否被锁定
func (bp *BruteForceProtector) IsBlocked(key string) (bool, time.Duration) {
	bp.mu.RLock()
	defer bp.mu.RUnlock()

	attempt, exists := bp.attempts[key]
	if !exists {
		return false, 0
	}

	if time.Now().Before(attempt.LockedUtil) {
		remaining := time.Until(attempt.LockedUtil)
		return true, remaining
	}

	return false, 0
}

// RecordFailure 记录登录失败
func (bp *BruteForceProtector) RecordFailure(key string) (int, time.Duration) {
	bp.mu.Lock()
	defer bp.mu.Unlock()

	attempt, exists := bp.attempts[key]
	if !exists {
		attempt = &LoginAttempt{}
		bp.attempts[key] = attempt
	}

	attempt.FailCount++
	attempt.LastFail = time.Now()

	// 渐进延迟：每次失败锁定时间翻倍
	// 第 3 次: 30 秒，第 4 次: 60 秒，第 5 次: 120 秒 ...
	if attempt.FailCount >= bp.maxAttempts {
		multiplier := 1 << (attempt.FailCount - bp.maxAttempts) // 2 的幂次
		lockTime := bp.lockDuration * time.Duration(multiplier)

		// 最大锁定 30 分钟
		if lockTime > 30*time.Minute {
			lockTime = 30 * time.Minute
		}

		attempt.LockedUtil = time.Now().Add(lockTime)
		return attempt.FailCount, lockTime
	}

	return attempt.FailCount, 0
}

// RecordSuccess 记录登录成功（重置计数器）
func (bp *BruteForceProtector) RecordSuccess(key string) {
	bp.mu.Lock()
	defer bp.mu.Unlock()
	delete(bp.attempts, key)
}

// cleanup 清理过期记录
func (bp *BruteForceProtector) cleanup() {
	for {
		time.Sleep(bp.cleanupPeriod)

		bp.mu.Lock()
		for key, attempt := range bp.attempts {
			// 清理超过 1 小时没有新失败的记录
			if time.Since(attempt.LastFail) > time.Hour {
				delete(bp.attempts, key)
			}
		}
		bp.mu.Unlock()
	}
}

func main() {
	// 3 次失败后开始锁定，基础锁定 30 秒
	protector := NewBruteForceProtector(3, 30*time.Second)

	http.HandleFunc("/api/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "仅支持 POST", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}
		json.NewDecoder(r.Body).Decode(&req)

		// 检查账号是否被锁定
		blocked, remaining := protector.IsBlocked(req.Username)
		if blocked {
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":       "账号已被临时锁定",
				"retry_after": fmt.Sprintf("%.0f秒", remaining.Seconds()),
			})
			return
		}

		// 模拟密码验证（实际应使用 bcrypt.CompareHashAndPassword）
		if req.Username == "admin" && req.Password == "correct_password" {
			// 登录成功，重置失败计数
			protector.RecordSuccess(req.Username)
			json.NewEncoder(w).Encode(map[string]string{"message": "登录成功"})
			return
		}

		// 登录失败，记录失败
		failCount, lockTime := protector.RecordFailure(req.Username)

		resp := map[string]interface{}{
			"error":      "用户名或密码错误",
			"fail_count": failCount,
		}

		if lockTime > 0 {
			resp["locked"]     = true
			resp["lock_until"] = fmt.Sprintf("%.0f秒后解锁", lockTime.Seconds())
			w.WriteHeader(http.StatusTooManyRequests)
		} else {
			resp["remaining_attempts"] = 3 - failCount
			w.WriteHeader(http.StatusUnauthorized)
		}

		json.NewEncoder(w).Encode(resp)
	})

	log.Println("服务器启动在 :8080")
	log.Println("测试: curl -X POST -d '{\"username\":\"admin\",\"password\":\"wrong\"}' http://localhost:8080/api/login")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### 讲解重点

- **常见错误做法（反模式）**：登录接口无任何频率限制；使用全局共享的速率限制器而非按 IP/用户隔离；锁定策略无上限导致合法用户被永久锁定；仅按 IP 限制（攻击者可使用代理池绕过），应同时按用户名和 IP 双维度限制。
- **OWASP 安全风险**：对应 OWASP A07:2021 - Identification and Authentication Failures。缺乏暴力破解防护使弱密码账户极易被攻破。
- **Go 社区最佳实践**：使用 `golang.org/x/time/rate` 实现令牌桶限流；API 网关层（如 Nginx、Kong）做全局速率限制，应用层做业务级限制；登录失败采用渐进延迟策略（exponential backoff）；返回 `429 Too Many Requests` 状态码并附带 `Retry-After` 头；分布式环境下使用 Redis 存储限流计数器，确保多实例一致。
