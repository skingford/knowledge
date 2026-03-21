---
title: encoding/base64 源码精读
description: 精读 encoding/base64 的编码实现，掌握标准/URL-safe/原始编码的差异、流式编码器与 padding 处理机制。
---

# encoding/base64：Base64 编码源码精读

> 核心源码：`src/encoding/base64/base64.go`
>
> 图例参考：这里补了 Base64 的 `3 bytes -> 4 chars` 编码图和流式编码图，先把 6 bit 查表、padding 和 `NewEncoder` 的角色看清，再回头读 `base64.go`。

## 包结构图

<GoNetworkDiagram kind="base64-encoding-flow" />

```
encoding/base64 编码体系
══════════════════════════════════════════════════════════════════

  预定义编码器（Encoding）：
  ├── StdEncoding    ← RFC 4648 标准（+/，有 padding =）
  ├── URLEncoding    ← URL-safe（-_，有 padding =）
  ├── RawStdEncoding ← 标准字母表，无 padding
  └── RawURLEncoding ← URL-safe，无 padding（JWT 使用此）

  编码原理（3字节 → 4字符）：
  ┌────────┬────────┬────────┐
  │ byte 0 │ byte 1 │ byte 2 │   原始 3 字节（24 bits）
  └────────┴────────┴────────┘
       │         │         │
  ┌──┬──┬──┬──┬──┬──┬──┬──┐  分成 4 组，每组 6 bits
  │c0│c1│c2│c3│                   ↓ 查 64 字符表
  └──┴──┴──┴──┘
  每个 6-bit 值 → ASCII 字符（A-Z a-z 0-9 + /）

  Padding（填充）：
  ├── 输入 1 字节 → 输出 2 字符 + ==
  ├── 输入 2 字节 → 输出 3 字符 + =
  └── 输入 3 字节 → 输出 4 字符（无 padding）

  编码长度公式：
  ├── 编码后长度 = ceil(n/3) * 4  （有 padding）
  └── 编码后长度 = ceil(n*4/3)    （无 padding）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/encoding/base64/base64.go（简化）
type Encoding struct {
    encode    [64]byte   // 6-bit 值 → 字符表
    decodeMap [256]byte  // 字符 → 6-bit 值（反查表）
    padChar   rune       // 填充字符（默认 '='，-1 表示无填充）
    strict    bool       // 严格模式：不允许多余 padding
}

// 核心编码循环（每次处理 3 字节）
func (enc *Encoding) encode(dst, src []byte) {
    for len(src) > 0 {
        // 取 3 字节
        b0 := src[0]; b1 := src[1]; b2 := src[2]

        // 分成 4 个 6-bit 组
        dst[0] = enc.encode[b0>>2]
        dst[1] = enc.encode[(b0&0x3)<<4 | b1>>4]
        dst[2] = enc.encode[(b1&0xf)<<2 | b2>>6]
        dst[3] = enc.encode[b2&0x3f]

        src = src[3:]; dst = dst[4:]
    }
}
```

---

## 二、代码示例

### 基础编解码

```go
import "encoding/base64"

func basics() {
    data := []byte("Hello, 世界!")

    // 标准 Base64
    encoded := base64.StdEncoding.EncodeToString(data)
    fmt.Println(encoded) // SGVsbG8sIOS4lueVjCE=

    decoded, err := base64.StdEncoding.DecodeString(encoded)
    fmt.Println(string(decoded), err) // Hello, 世界! <nil>

    // URL-safe Base64（不含 + / 字符，适合放 URL 中）
    urlEncoded := base64.URLEncoding.EncodeToString(data)

    // Raw Base64（无 padding，适合 JWT、短链接）
    raw := base64.RawURLEncoding.EncodeToString(data)
    fmt.Println(urlEncoded, raw)
}
```

### 四种编码对比

```go
func compareEncodings() {
    data := []byte{0xFF, 0xFE, 0xFD} // 包含 +/- 差异的字节

    fmt.Printf("StdEncoding:    %s\n", base64.StdEncoding.EncodeToString(data))
    fmt.Printf("URLEncoding:    %s\n", base64.URLEncoding.EncodeToString(data))
    fmt.Printf("RawStdEncoding: %s\n", base64.RawStdEncoding.EncodeToString(data))
    fmt.Printf("RawURLEncoding: %s\n", base64.RawURLEncoding.EncodeToString(data))
    // StdEncoding:    //79
    // URLEncoding:    __79 (- 替代 +, _ 替代 /)
    // RawStdEncoding: //79 (无 =)
    // RawURLEncoding: __79 (无 =)
}
```

### 流式编码器（大文件）

<GoNetworkDiagram kind="base64-streaming" />

```go
// 编码大文件时使用流式 API，避免全量内存加载
func encodeFileToBase64(src, dst string) error {
    in, err := os.Open(src)
    if err != nil {
        return err
    }
    defer in.Close()

    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    // NewEncoder 返回 io.WriteCloser
    // ⚠️ 必须 Close，否则末尾 padding 不会被写入
    encoder := base64.NewEncoder(base64.StdEncoding, out)
    defer encoder.Close()

    _, err = io.Copy(encoder, in)
    return err
}

// 流式解码
func decodeBase64File(src, dst string) error {
    in, _ := os.Open(src)
    defer in.Close()

    out, _ := os.Create(dst)
    defer out.Close()

    decoder := base64.NewDecoder(base64.StdEncoding, in)
    _, err := io.Copy(out, decoder)
    return err
}
```

### HTTP Basic Auth 解析

```go
// HTTP Authorization: Basic <base64(user:password)>
func parseBasicAuth(authHeader string) (user, pass string, ok bool) {
    const prefix = "Basic "
    if !strings.HasPrefix(authHeader, prefix) {
        return
    }

    decoded, err := base64.StdEncoding.DecodeString(authHeader[len(prefix):])
    if err != nil {
        return
    }

    parts := strings.SplitN(string(decoded), ":", 2)
    if len(parts) != 2 {
        return
    }
    return parts[0], parts[1], true
}

// 生成 Basic Auth header
func makeBasicAuth(user, pass string) string {
    creds := base64.StdEncoding.EncodeToString([]byte(user + ":" + pass))
    return "Basic " + creds
}
```

### JWT 载荷解析（RawURLEncoding）

```go
// JWT = header.payload.signature（均用 RawURLEncoding，无 padding）
func parseJWTPayload(token string) (map[string]any, error) {
    parts := strings.Split(token, ".")
    if len(parts) != 3 {
        return nil, fmt.Errorf("invalid JWT format")
    }

    // JWT 使用 RawURLEncoding（无 = padding，URL-safe 字母表）
    payload, err := base64.RawURLEncoding.DecodeString(parts[1])
    if err != nil {
        return nil, fmt.Errorf("decode payload: %w", err)
    }

    var claims map[string]any
    if err := json.Unmarshal(payload, &claims); err != nil {
        return nil, err
    }
    return claims, nil
}
```

### 内嵌二进制到 Go 代码（常用于测试）

```go
// 将图片/证书等二进制嵌入 Go 代码
func embedBinary(data []byte) string {
    return base64.StdEncoding.EncodeToString(data)
}

// 在测试代码中使用（go:embed 是更好的选择，但有时需要运行时解码）
const testCert = `MIIBkTCB+wIJAJFgSICp...` // base64 编码的 PEM

func loadTestCert() []byte {
    data, _ := base64.StdEncoding.DecodeString(testCert)
    return data
}
```

### 编码长度预计算

```go
// 提前分配正确大小的 buffer，避免 EncodeToString 的内存分配
func encodeNoCopy(data []byte) []byte {
    dst := make([]byte, base64.StdEncoding.EncodedLen(len(data)))
    base64.StdEncoding.Encode(dst, data)
    return dst
}

func decodeNoCopy(encoded []byte) ([]byte, error) {
    dst := make([]byte, base64.StdEncoding.DecodedLen(len(encoded)))
    n, err := base64.StdEncoding.Decode(dst, encoded)
    if err != nil {
        return nil, err
    }
    return dst[:n], nil // DecodedLen 是上界，n 是实际长度
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Base64 编码后大小增加多少？ | 约 33%（3字节 → 4字符）；有 padding 时 `ceil(n/3)*4`，无 padding 时 `ceil(n*4/3)` |
| URLEncoding 和 StdEncoding 的区别？ | URLEncoding 用 `-_` 替换 `+/`（这两个字符在 URL 中有特殊含义）；padding 规则相同 |
| JWT 为何用 RawURLEncoding？ | JWT 放在 HTTP Header 和 URL 参数中；RawURLEncoding 无 `+/=` 字符，避免 URL 编码问题 |
| 流式 Encoder 为什么必须 Close？ | Base64 每 3 字节一组；Close 会将末尾不足 3 字节的数据加 padding 写入 |
| DecodedLen 为什么不是精确值？ | padding `=` 字符会减少实际字节数，DecodedLen 返回上界；实际长度由 Decode 返回的 n 确定 |
| Base64 可以用于加密吗？ | 不能！Base64 是编码（可逆），不是加密；只是将二进制转为可打印 ASCII，无安全性保障 |
