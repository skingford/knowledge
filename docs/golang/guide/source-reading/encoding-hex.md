---
title: encoding/hex 源码精读
description: 精读 encoding/hex 的十六进制编解码实现，掌握密钥/哈希值表示、流式编码、调试转储与常见陷阱。
---

# encoding/hex：十六进制编解码源码精读

> 核心源码：`src/encoding/hex/hex.go`

## 包结构图

```
encoding/hex 体系
══════════════════════════════════════════════════════════════════

  API 全览：
  ├── hex.EncodeToString(src []byte) string       ← []byte → hex 字符串
  ├── hex.DecodeString(s string) ([]byte, error)  ← hex 字符串 → []byte
  ├── hex.Encode(dst, src []byte) int             ← 写入已分配的 dst
  ├── hex.Decode(dst, src []byte) (int, error)    ← 写入已分配的 dst
  ├── hex.EncodedLen(n int) int                   ← 编码后长度 = n*2
  ├── hex.DecodedLen(n int) int                   ← 解码后长度 = n/2
  ├── hex.NewEncoder(w io.Writer) io.WriteCloser  ← 流式编码器
  ├── hex.NewDecoder(r io.Reader) io.Reader       ← 流式解码器
  └── hex.Dump(data []byte) string                ← hexdump 格式（含地址+ASCII）

  编码规则：
  每字节 → 2 个小写十六进制字符
  0x00 → "00"   0xFF → "ff"   0xAB → "ab"
  大写需用 strings.ToUpper 或 fmt.Sprintf("%X", ...)

  常用场景：
  ├── 密钥/密文/哈希值的人类可读表示
  ├── 调试：打印二进制数据（hex.Dump 含 ASCII 预览）
  ├── 数据库存储：BINARY 字段转 VARCHAR 存储
  └── 网络协议：MAC 地址、设备 ID 等

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/encoding/hex/hex.go（简化）

const hextable = "0123456789abcdef"

func Encode(dst, src []byte) int {
    j := 0
    for _, v := range src {
        // 每字节拆为高4位和低4位，各查表得到一个十六进制字符
        dst[j] = hextable[v>>4]
        dst[j+1] = hextable[v&0x0f]
        j += 2
    }
    return len(src) * 2
}

func DecodeString(s string) ([]byte, error) {
    src := []byte(s)
    // 长度必须是偶数
    if len(src)%2 != 0 {
        return nil, ErrLength
    }
    dst := make([]byte, len(src)/2)
    _, err := Decode(dst, src)
    return dst, err
}
```

---

## 二、代码示例

### 基础编解码

```go
import (
    "crypto/sha256"
    "encoding/hex"
)

func basicHex() {
    // []byte → hex 字符串
    data := []byte{0xDE, 0xAD, 0xBE, 0xEF}
    encoded := hex.EncodeToString(data)
    fmt.Println(encoded) // "deadbeef"

    // hex 字符串 → []byte
    decoded, err := hex.DecodeString("deadbeef")
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(decoded) // [222 173 190 239]

    // ⚠️ 常见错误：奇数长度
    _, err = hex.DecodeString("abc") // encoding/hex: odd length hex string
    fmt.Println(err)

    // ⚠️ 常见错误：非十六进制字符
    _, err = hex.DecodeString("zz") // encoding/hex: invalid byte 'z' in hex string
    fmt.Println(err)
}

// SHA256 哈希转 hex（最常见用法）
func sha256Hex(data []byte) string {
    h := sha256.Sum256(data)
    return hex.EncodeToString(h[:])
}

// 使用
fmt.Println(sha256Hex([]byte("hello")))
// "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
```

### 大写 hex（兼容某些系统要求）

```go
import (
    "encoding/hex"
    "strings"
    "fmt"
)

// 方式1：用 strings.ToUpper
func encodeUpperHex(data []byte) string {
    return strings.ToUpper(hex.EncodeToString(data))
}

// 方式2：用 fmt（小数据量）
func encodeUpperHexFmt(data []byte) string {
    return fmt.Sprintf("%X", data)
}

// 方式3：手动查表（高性能大数据量）
const upperHexTable = "0123456789ABCDEF"

func encodeUpperFast(dst, src []byte) {
    for i, v := range src {
        dst[i*2] = upperHexTable[v>>4]
        dst[i*2+1] = upperHexTable[v&0x0f]
    }
}
```

### 流式 hex 编码（大文件）

```go
// 场景：边读文件边生成 hex 输出（不占满内存）
func fileToHex(srcPath, dstPath string) error {
    src, err := os.Open(srcPath)
    if err != nil {
        return err
    }
    defer src.Close()

    dst, err := os.Create(dstPath)
    if err != nil {
        return err
    }
    defer dst.Close()

    // hex.NewEncoder：写入的字节自动编码为 hex
    enc := hex.NewEncoder(dst)
    defer enc.Close() // ⚠️ Close 刷新最后的字节

    _, err = io.Copy(enc, src)
    return err
}

// 流式解码（将 hex 文件还原为二进制）
func hexToFile(srcPath, dstPath string) error {
    src, err := os.Open(srcPath)
    if err != nil {
        return err
    }
    defer src.Close()

    dst, err := os.Create(dstPath)
    if err != nil {
        return err
    }
    defer dst.Close()

    // hex.NewDecoder：读取 hex 字符流自动解码为字节
    dec := hex.NewDecoder(src)
    _, err = io.Copy(dst, dec)
    return err
}
```

### hex.Dump：调试二进制数据

```go
// hex.Dump 输出类似 xxd/hexdump 工具的格式
func debugBinary() {
    data := []byte("Hello, 世界!\x00\x01\x02\x03")
    fmt.Print(hex.Dump(data))
    // 输出：
    // 00000000  48 65 6c 6c 6f 2c 20 e4  b8 96 e7 95 8c 21 00 01  |Hello, ...... !..|
    // 00000010  02 03                                              |..|
}

// 自定义 Dumper（写入 io.Writer）
func dumpToLogger(data []byte) {
    dumper := hex.Dumper(os.Stderr)
    defer dumper.Close()
    dumper.Write(data)
}
```

### 实际场景：Token 生成与验证

```go
import (
    "crypto/rand"
    "encoding/hex"
)

// 生成安全随机 token（API Key、会话 token 等）
func generateToken(length int) (string, error) {
    bytes := make([]byte, length)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil // length*2 个十六进制字符
}

// 常量时间比较（防止时序攻击）
func verifyToken(provided, expected string) bool {
    p, err1 := hex.DecodeString(provided)
    e, err2 := hex.DecodeString(expected)
    if err1 != nil || err2 != nil {
        return false
    }
    return hmac.Equal(p, e) // 常量时间比较
}

// MAC 地址格式化
func formatMAC(mac []byte) string {
    if len(mac) != 6 {
        return ""
    }
    return fmt.Sprintf("%02x:%02x:%02x:%02x:%02x:%02x",
        mac[0], mac[1], mac[2], mac[3], mac[4], mac[5])
}
```

### 预分配版本（性能优化）

```go
// 避免字符串分配：写入已有 buffer
func encodeToBuffer(dst []byte, src []byte) []byte {
    needed := hex.EncodedLen(len(src))
    if cap(dst) < needed {
        dst = make([]byte, needed)
    }
    dst = dst[:needed]
    hex.Encode(dst, src)
    return dst
}

// 使用 sync.Pool 复用 buffer
var hexBufPool = sync.Pool{
    New: func() any { return make([]byte, 64) },
}

func encodeWithPool(src []byte) string {
    needed := hex.EncodedLen(len(src))
    buf := hexBufPool.Get().([]byte)
    if cap(buf) < needed {
        buf = make([]byte, needed)
    }
    buf = buf[:needed]
    hex.Encode(buf, src)
    result := string(buf)
    hexBufPool.Put(buf[:0])
    return result
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `hex.EncodeToString` 和 `fmt.Sprintf("%x", b)` 的区别？ | 结果相同（小写 hex）；`EncodeToString` 更快（直接查表，无格式解析开销）；大数据量应优先用 `EncodeToString` |
| hex 解码为什么要求偶数长度？ | 每 2 个 hex 字符才能还原 1 个字节；奇数长度意味着最后一个字节不完整，返回 `ErrLength` |
| `hex.Dump` 和 `hex.Encode` 的适用场景？ | Dump 用于调试（含地址偏移 + ASCII 预览，适合人眼阅读）；Encode 用于数据传输/存储（纯 hex，机器解析） |
| 如何生成大写 hex？ | `strings.ToUpper(hex.EncodeToString(b))` 或 `fmt.Sprintf("%X", b)`；没有内置大写选项 |
| Token 比较为什么不能用 `==`？ | 字符串 `==` 是短路比较，不同位置越早终止越快，暴露长度和前缀信息；应用 `hmac.Equal` 或 `subtle.ConstantTimeCompare` 等常量时间函数 |
| `hex.NewEncoder` 的 `Close` 为什么必要？ | Encoder 内部可能缓冲最后的半字节；Close 确保所有数据被刷出；但 hex 是按字节处理，通常 Close 是空操作，仍应调用保持接口一致性 |
