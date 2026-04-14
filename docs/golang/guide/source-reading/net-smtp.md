---
title: net/smtp 源码精读
description: 精读 net/smtp 的邮件发送实现，掌握 SMTP 握手流程、AUTH 认证、TLS 加密与现代邮件发送最佳实践。
---

# net/smtp：邮件发送源码精读

> 核心源码：`src/net/smtp/smtp.go`
>
> 图例参考：
> - `GoNetworkDiagram`：`smtp-session-flow`

## 包结构图

```
net/smtp 协议层次
══════════════════════════════════════════════════════════════════

  SMTP 会话流程（RFC 5321）：
  ┌────────────────────────────────────────────────────────┐
  │  Client                    Server                      │
  │    │                          │                        │
  │    │◄── 220 ready ────────────│  连接建立               │
  │    │─── EHLO client.example ──►│  协商扩展能力           │
  │    │◄── 250-AUTH LOGIN PLAIN ──│                        │
  │    │◄── 250-STARTTLS ──────────│                        │
  │    │─── STARTTLS ─────────────►│  （可选）升级 TLS      │
  │    │─── AUTH LOGIN ───────────►│  身份认证               │
  │    │─── MAIL FROM:<> ─────────►│  发件人                 │
  │    │─── RCPT TO:<> ───────────►│  每个收件人一条         │
  │    │─── DATA ─────────────────►│  开始传输邮件内容       │
  │    │─── <headers>\r\n\r\n<body>►│                        │
  │    │─── . ────────────────────►│  单行 . 结束正文        │
  │    │◄── 250 OK ────────────────│                        │
  │    │─── QUIT ─────────────────►│                        │
  └────────────────────────────────────────────────────────┘

  smtp.Client 核心方法：
  ├── Hello(localName)       ← 发送 EHLO
  ├── StartTLS(config)       ← 升级到 TLS
  ├── Auth(auth)             ← 身份认证
  ├── Mail(from)             ← MAIL FROM
  ├── Rcpt(to)               ← RCPT TO（可多次调用）
  ├── Data()                 ← 返回 io.WriteCloser（写邮件体）
  └── Quit()                 ← 发送 QUIT，关闭连接

  便捷函数：
  └── smtp.SendMail(addr, auth, from, to, msg) ← 一步发送

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="smtp-session-flow" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/net/smtp/smtp.go（简化）
type Client struct {
    Text *textproto.Conn  // 文本协议读写器
    conn net.Conn         // 底层连接（可能是 TLS 包装）
    tls  bool             // 是否已升级 TLS
    ext  map[string]string // 服务器支持的扩展（EHLO 响应）
}

// SendMail 内部流程
func SendMail(addr string, a Auth, from string, to []string, msg []byte) error {
    c, _ := Dial(addr)           // 1. TCP 连接
    c.Hello("localhost")          // 2. EHLO
    if ok, _ := c.Extension("STARTTLS"); ok {
        c.StartTLS(nil)           // 3. 升级 TLS（如果服务器支持）
    }
    if a != nil {
        c.Auth(a)                 // 4. 认证
    }
    c.Mail(from)                  // 5. MAIL FROM
    for _, addr := range to {
        c.Rcpt(addr)              // 6. RCPT TO
    }
    w, _ := c.Data()              // 7. DATA 命令
    w.Write(msg)                  // 8. 写邮件内容
    w.Close()                     // 9. 发送 "." 结束
    return c.Quit()               // 10. QUIT
}
```
:::

---

## 二、代码示例

### 基础邮件发送（Gmail）

::: details 点击展开代码：基础邮件发送（Gmail）
```go
import (
    "net/smtp"
    "fmt"
)

func sendSimpleEmail() error {
    // Gmail SMTP 配置
    smtpHost := "smtp.gmail.com"
    smtpPort := "587" // STARTTLS 端口（465 是直接 TLS）
    username := "your@gmail.com"
    password := "your-app-password" // Gmail 需要应用专用密码

    // 构建邮件内容（RFC 2822 格式）
    from := username
    to := []string{"recipient@example.com"}
    subject := "测试邮件"
    body := "这是一封测试邮件。"

    msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
        from, to[0], subject, body)

    // PLAIN 认证
    auth := smtp.PlainAuth("", username, password, smtpHost)

    return smtp.SendMail(
        smtpHost+":"+smtpPort,
        auth,
        from,
        to,
        []byte(msg),
    )
}
```
:::

### 完整邮件（含 HTML、CC、BCC、附件）

::: details 点击展开代码：完整邮件（含 HTML、CC、BCC、附件）
```go
import (
    "bytes"
    "encoding/base64"
    "fmt"
    "mime/multipart"
    "net/smtp"
    "net/textproto"
    "os"
    "path/filepath"
)

type EmailMessage struct {
    From        string
    To          []string
    CC          []string
    Subject     string
    TextBody    string
    HTMLBody    string
    Attachments []string // 文件路径列表
}

func (e *EmailMessage) Build() ([]byte, error) {
    var buf bytes.Buffer
    writer := multipart.NewWriter(&buf)

    // 邮件头
    buf.WriteString(fmt.Sprintf("From: %s\r\n", e.From))
    buf.WriteString(fmt.Sprintf("To: %s\r\n", joinAddrs(e.To)))
    if len(e.CC) > 0 {
        buf.WriteString(fmt.Sprintf("CC: %s\r\n", joinAddrs(e.CC)))
    }
    buf.WriteString(fmt.Sprintf("Subject: %s\r\n", e.Subject))
    buf.WriteString("MIME-Version: 1.0\r\n")
    buf.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=%s\r\n\r\n",
        writer.Boundary()))

    // 文本部分
    if e.TextBody != "" {
        part, _ := writer.CreatePart(textproto.MIMEHeader{
            "Content-Type": {"text/plain; charset=utf-8"},
        })
        part.Write([]byte(e.TextBody))
    }

    // HTML 部分
    if e.HTMLBody != "" {
        part, _ := writer.CreatePart(textproto.MIMEHeader{
            "Content-Type": {"text/html; charset=utf-8"},
        })
        part.Write([]byte(e.HTMLBody))
    }

    // 附件
    for _, filePath := range e.Attachments {
        data, err := os.ReadFile(filePath)
        if err != nil {
            return nil, err
        }
        part, _ := writer.CreatePart(textproto.MIMEHeader{
            "Content-Type":              {"application/octet-stream"},
            "Content-Disposition":       {fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(filePath))},
            "Content-Transfer-Encoding": {"base64"},
        })
        encoder := base64.NewEncoder(base64.StdEncoding, part)
        encoder.Write(data)
        encoder.Close()
    }

    writer.Close()
    return buf.Bytes(), nil
}

func joinAddrs(addrs []string) string {
    result := ""
    for i, a := range addrs {
        if i > 0 {
            result += ", "
        }
        result += a
    }
    return result
}
```
:::

### 直接 TLS 连接（465 端口）

::: details 点击展开代码：直接 TLS 连接（465 端口）
```go
import (
    "crypto/tls"
    "net/smtp"
)

func sendWithTLS(host, user, pass string, to []string, msg []byte) error {
    // 465 端口：直接 TLS（不用 STARTTLS）
    tlsConfig := &tls.Config{
        ServerName: host,
    }

    conn, err := tls.Dial("tcp", host+":465", tlsConfig)
    if err != nil {
        return err
    }

    client, err := smtp.NewClient(conn, host)
    if err != nil {
        return err
    }
    defer client.Quit()

    auth := smtp.PlainAuth("", user, pass, host)
    if err := client.Auth(auth); err != nil {
        return err
    }

    if err := client.Mail(user); err != nil {
        return err
    }
    for _, addr := range to {
        if err := client.Rcpt(addr); err != nil {
            return err
        }
    }

    w, err := client.Data()
    if err != nil {
        return err
    }
    if _, err := w.Write(msg); err != nil {
        return err
    }
    return w.Close()
}
```
:::

### 邮件发送服务（含重试）

::: details 点击展开代码：邮件发送服务（含重试）
```go
type MailService struct {
    host     string
    port     string
    username string
    password string
    maxRetry int
}

func (s *MailService) Send(ctx context.Context, msg EmailMessage) error {
    body, err := msg.Build()
    if err != nil {
        return fmt.Errorf("build email: %w", err)
    }

    auth := smtp.PlainAuth("", s.username, s.password, s.host)
    addr := s.host + ":" + s.port

    var lastErr error
    for i := 0; i < s.maxRetry; i++ {
        if ctx.Err() != nil {
            return ctx.Err()
        }

        if err := smtp.SendMail(addr, auth, msg.From, msg.To, body); err != nil {
            lastErr = err
            // 指数退避
            select {
            case <-ctx.Done():
                return ctx.Err()
            case <-time.After(time.Duration(1<<i) * time.Second):
            }
            continue
        }
        return nil // 发送成功
    }
    return fmt.Errorf("send email after %d retries: %w", s.maxRetry, lastErr)
}
```
:::

### 测试：本地 SMTP 服务器模拟

::: details 点击展开代码：测试：本地 SMTP 服务器模拟
```go
// 测试时用 mailhog 或 smtp4dev 启动本地 SMTP 服务器
// docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog

func TestSendEmail(t *testing.T) {
    // 连接本地测试 SMTP（无认证）
    err := smtp.SendMail(
        "localhost:1025",
        nil, // 无认证
        "sender@test.com",
        []string{"receiver@test.com"},
        []byte("Subject: Test\r\n\r\nHello from test"),
    )
    if err != nil {
        t.Fatal(err)
    }
    // 在 http://localhost:8025 查看收到的邮件
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| STARTTLS 和直接 TLS 的区别？ | STARTTLS：先明文连接（587端口），再升级到 TLS；直接 TLS（SMTPS）：从建立连接起就是 TLS（465端口）|
| `smtp.SendMail` 是否支持 HTML？ | 支持，但需手动构建 MIME 头（Content-Type: text/html）；`SendMail` 只是透传 msg 字节 |
| PlainAuth 在没有 TLS 时安全吗？ | 不安全！PlainAuth 源码中会检查 TLS，若非 TLS 连接会拒绝发送凭据（Go 1.1+ 保护） |
| 如何发送附件？ | 使用 `mime/multipart` 构建 multipart/mixed 格式，附件部分用 base64 编码 |
| 生产环境建议用标准库 smtp 吗？ | 不建议。推荐 `gopkg.in/mail.v2` 或 `github.com/sendgrid/sendgrid-go`（支持模板、批量、追踪） |
| 如何避免邮件被标记为垃圾邮件？ | 配置 SPF/DKIM/DMARC DNS 记录；使用合法 SMTP 服务商（SendGrid/SES/Mailgun）而非自建服务器 |
