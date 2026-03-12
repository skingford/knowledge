---
title: bufio 高级模式源码精读
description: 精读 bufio 的缓冲 IO 实现，掌握 Scanner 自定义分割、ReadLine vs ReadString 选择、Writer 刷新策略与高性能 IO 最佳实践。
---

# bufio 高级模式：源码精读

> 核心源码：`src/bufio/bufio.go`、`src/bufio/scan.go`

## 包结构图

```
bufio 体系
══════════════════════════════════════════════════════════════════

  bufio.Reader（读缓冲）
  ├── buf []byte              ← 内部缓冲区（默认 4096 字节）
  ├── r, w int               ← 读写游标（有效数据区间 [r,w)）
  ├── ReadLine()             ← 返回单行（不含 \n，可能返回分段）
  ├── ReadString('\n')       ← 返回完整行（含 \n，自动拼接分段）
  ├── ReadBytes('\n')        ← 同 ReadString，返回 []byte
  ├── ReadRune()             ← 读取 UTF-8 字符（带 1 字符 UnreadRune 缓存）
  └── Peek(n)               ← 预读 n 字节（不消耗）

  bufio.Writer（写缓冲）
  ├── buf []byte              ← 内部缓冲区（默认 4096 字节）
  ├── n int                  ← 已写字节数
  ├── Write → 写入 buf → 满时 Flush
  ├── WriteByte / WriteRune / WriteString
  └── Flush()               ← 将 buf 刷到底层 Writer（⚠️ 必须调用）

  bufio.Scanner（行/词扫描）
  ├── SplitFunc             ← 自定义分割函数（核心扩展点）
  │    ├── ScanLines        ← 按行（默认）
  │    ├── ScanWords        ← 按空白分词
  │    ├── ScanBytes        ← 逐字节
  │    └── ScanRunes        ← 逐 UTF-8 字符
  ├── Scan() bool           ← 推进到下一个 token
  ├── Text() string         ← 当前 token（string）
  ├── Bytes() []byte        ← 当前 token（[]byte，零拷贝，不持久）
  └── Buffer(buf, max)      ← 自定义最大 token 大小（默认 64KB）

  性能对比：
  ┌───────────────┬──────────────────────────────────────────┐
  │ 方式          │ 特点                                     │
  ├───────────────┼──────────────────────────────────────────┤
  │ Scanner       │ 简洁，自动处理分段，max token 有上限     │
  │ ReadString    │ 完整行，内存拷贝（分配新 string）        │
  │ ReadLine      │ 零拷贝（返回内部 buf 引用），需处理分段  │
  │ ReadBytes     │ 完整行，返回 []byte（有内存分配）        │
  └───────────────┴──────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/bufio/scan.go（简化）
type Scanner struct {
    r            io.Reader
    split        SplitFunc     // 分割函数
    maxTokenSize int           // 最大 token 大小（默认 64KB）
    token        []byte        // 当前 token（指向 buf 内部）
    buf          []byte        // 读取缓冲区（按需扩容）
    start        int           // buf 中有效数据起始位置
    end          int           // buf 中有效数据结束位置
    err          error
    done         bool
}

// SplitFunc 签名：
// data: 待分析数据（可能是 buf 的一部分）
// atEOF: 是否已到文件末尾
// 返回：advance（消耗字节数）、token（本次 token）、err
type SplitFunc func(data []byte, atEOF bool) (advance int, token []byte, err error)

// Scan 核心循环
func (s *Scanner) Scan() bool {
    for {
        // 1. 尝试用当前缓冲数据分割
        if s.end > s.start || s.err != nil {
            advance, token, err := s.split(s.buf[s.start:s.end], s.err != nil)
            if err != nil { /* 处理错误 */ }
            if token != nil {
                s.token = token
                s.start += advance
                return true  // 找到 token，返回
            }
            if s.err != nil { return false } // EOF 或错误
        }
        // 2. 缓冲数据不足，从 Reader 读取更多
        // 如果 buf 已满且无法 advance，扩容
        s.buf = append(s.buf[:s.start], s.buf[s.start:s.end]...)
        n, err := s.r.Read(s.buf[s.end:cap(s.buf)])
        s.end += n
        s.err = err
    }
}
```

---

## 二、代码示例

### Scanner 基础用法

```go
import (
    "bufio"
    "fmt"
    "strings"
)

func basicScanner() {
    input := "apple\nbanana\ncherry\n"
    scanner := bufio.NewScanner(strings.NewReader(input))

    // 默认 ScanLines
    for scanner.Scan() {
        fmt.Println(scanner.Text()) // apple / banana / cherry
    }
    if err := scanner.Err(); err != nil {
        fmt.Println("读取错误:", err)
    }
}

// 按词扫描
func wordScanner() {
    input := "hello world  foo   bar"
    scanner := bufio.NewScanner(strings.NewReader(input))
    scanner.Split(bufio.ScanWords)

    var words []string
    for scanner.Scan() {
        words = append(words, scanner.Text())
    }
    fmt.Println(words) // [hello world foo bar]
}
```

### 自定义 SplitFunc：按逗号分割 CSV

```go
// 自定义：按逗号分割（简化 CSV 解析）
func scanCSVField(data []byte, atEOF bool) (advance int, token []byte, err error) {
    // 跳过行首逗号
    if len(data) > 0 && data[0] == ',' {
        return 1, nil, nil
    }

    // 查找下一个逗号或换行
    for i, b := range data {
        if b == ',' || b == '\n' {
            return i + 1, data[:i], nil
        }
    }

    // 没找到分隔符
    if atEOF && len(data) > 0 {
        return len(data), data, nil // 最后一个字段
    }
    return 0, nil, nil // 需要更多数据
}

func parseCSVLine(line string) []string {
    scanner := bufio.NewScanner(strings.NewReader(line))
    scanner.Split(scanCSVField)

    var fields []string
    for scanner.Scan() {
        fields = append(fields, scanner.Text())
    }
    return fields
}

// 使用
// fields := parseCSVLine("alice,30,engineer")
// → ["alice", "30", "engineer"]
```

### 自定义 SplitFunc：按固定字节边界分割

```go
// 场景：网络协议，每个消息以 4 字节长度头开头
func scanLengthPrefixed(data []byte, atEOF bool) (advance int, token []byte, err error) {
    if len(data) < 4 {
        return 0, nil, nil // 等待长度头
    }

    // 读取消息长度
    msgLen := int(data[0])<<24 | int(data[1])<<16 | int(data[2])<<8 | int(data[3])
    if len(data) < 4+msgLen {
        return 0, nil, nil // 等待完整消息体
    }

    return 4 + msgLen, data[4 : 4+msgLen], nil
}

// 解析长度前缀协议
func readMessages(conn net.Conn) {
    // ⚠️ 大消息需要扩大 Buffer
    scanner := bufio.NewScanner(conn)
    scanner.Buffer(make([]byte, 1<<20), 1<<20) // 最大 1MB
    scanner.Split(scanLengthPrefixed)

    for scanner.Scan() {
        msg := scanner.Bytes()
        processMessage(msg)
    }
}
```

### ReadLine vs ReadString：正确选择

```go
// ReadLine：零拷贝，但需处理超长行（isPrefix=true 时行未读完）
func readLargeLines(r io.Reader) {
    br := bufio.NewReaderSize(r, 64*1024) // 64KB 缓冲

    for {
        var line []byte
        var isPrefix bool
        var err error

        // 循环读取直到完整行
        for {
            var segment []byte
            segment, isPrefix, err = br.ReadLine()
            line = append(line, segment...) // ⚠️ 有内存拷贝
            if !isPrefix || err != nil {
                break
            }
        }

        if len(line) > 0 {
            process(line)
        }
        if err != nil {
            break
        }
    }
}

// ReadString：简洁，自动处理超长行，有内存分配（推荐日常使用）
func readLines(r io.Reader) {
    br := bufio.NewReader(r)

    for {
        line, err := br.ReadString('\n')
        if len(line) > 0 {
            line = strings.TrimRight(line, "\n\r")
            process([]byte(line))
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatal(err)
        }
    }
}

// Scanner：最简洁，适合大多数场景（注意默认 64KB token 限制）
func scanLines(r io.Reader) {
    scanner := bufio.NewScanner(r)
    // 大文件需要扩大 buffer
    scanner.Buffer(make([]byte, 512*1024), 512*1024)

    for scanner.Scan() {
        process([]byte(scanner.Text()))
    }
}
```

### bufio.Writer：高性能批量写入

```go
// 场景：批量写入日志文件（减少系统调用）
type BufferedLogger struct {
    w   *bufio.Writer
    mu  sync.Mutex
}

func NewBufferedLogger(f *os.File) *BufferedLogger {
    return &BufferedLogger{
        w: bufio.NewWriterSize(f, 256*1024), // 256KB 缓冲
    }
}

func (l *BufferedLogger) Log(msg string) {
    l.mu.Lock()
    defer l.mu.Unlock()
    l.w.WriteString(time.Now().Format("2006-01-02 15:04:05"))
    l.w.WriteByte(' ')
    l.w.WriteString(msg)
    l.w.WriteByte('\n')
}

// ⚠️ 必须定期 Flush，否则数据停在缓冲区
func (l *BufferedLogger) Flush() error {
    l.mu.Lock()
    defer l.mu.Unlock()
    return l.w.Flush()
}

// 定时刷盘（生产中常用）
func (l *BufferedLogger) StartAutoFlush(interval time.Duration) {
    go func() {
        ticker := time.NewTicker(interval)
        for range ticker.C {
            l.Flush()
        }
    }()
}
```

### Peek：预读不消耗（协议嗅探）

```go
// 场景：根据前几字节判断协议类型（HTTP/HTTPS/其他）
func detectProtocol(conn net.Conn) string {
    br := bufio.NewReader(conn)

    // Peek 预读 3 字节（不影响后续 Read）
    header, err := br.Peek(3)
    if err != nil {
        return "unknown"
    }

    switch {
    case string(header) == "GET" || string(header) == "POS":
        return "http"
    case header[0] == 0x16: // TLS ClientHello
        return "tls"
    default:
        return "unknown"
    }
}

// 场景：自动检测文件编码（BOM 检测）
func detectBOM(r io.Reader) (io.Reader, string) {
    br := bufio.NewReader(r)
    bom, _ := br.Peek(3)

    switch {
    case len(bom) >= 3 && bom[0] == 0xEF && bom[1] == 0xBB && bom[2] == 0xBF:
        br.Discard(3) // 消耗 BOM
        return br, "UTF-8"
    case len(bom) >= 2 && bom[0] == 0xFF && bom[1] == 0xFE:
        br.Discard(2)
        return br, "UTF-16LE"
    default:
        return br, "UTF-8" // 假设 UTF-8
    }
}
```

### ReadWriter：双向缓冲（网络协议实现）

```go
// 场景：实现简单文本协议客户端（如 Redis RESP 协议）
type ProtocolConn struct {
    rw *bufio.ReadWriter
}

func NewProtocolConn(conn net.Conn) *ProtocolConn {
    return &ProtocolConn{
        rw: bufio.NewReadWriter(
            bufio.NewReaderSize(conn, 32*1024),  // 32KB 读缓冲
            bufio.NewWriterSize(conn, 32*1024),  // 32KB 写缓冲
        ),
    }
}

func (c *ProtocolConn) SendCommand(cmd string, args ...string) error {
    // 写入命令（缓冲）
    fmt.Fprintf(c.rw, "*%d\r\n", 1+len(args))
    fmt.Fprintf(c.rw, "$%d\r\n%s\r\n", len(cmd), cmd)
    for _, arg := range args {
        fmt.Fprintf(c.rw, "$%d\r\n%s\r\n", len(arg), arg)
    }
    // ⚠️ 必须 Flush 才会发送
    return c.rw.Flush()
}

func (c *ProtocolConn) ReadLine() (string, error) {
    line, err := c.rw.ReadString('\n')
    return strings.TrimRight(line, "\r\n"), err
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `Scanner.Scan()` 和 `Reader.ReadString()` 的区别？ | Scanner 自动处理缓冲扩容，接口简洁，但有 token 大小上限；ReadString 返回完整行（含分段拼接），内存分配更可控 |
| `ReadLine` 返回 `isPrefix=true` 时如何处理？ | 表示行超过缓冲区，需循环调用 ReadLine 并拼接 segment，直到 `isPrefix=false` |
| 为什么 `Scanner.Bytes()` 不应持久化保存？ | 返回的是内部 buf 切片，下次 `Scan()` 后会被覆盖；需要持久化时用 `scanner.Text()` 或 `append([]byte{}, scanner.Bytes()...)` 复制 |
| `bufio.Writer.Flush()` 何时必须调用？ | 程序结束前、切换写目标前、需要数据立即到达对端时；否则数据留在缓冲区丢失 |
| `Peek(n)` 与 `ReadByte` + `UnreadByte` 的区别？ | Peek 可预读多字节且不消耗；UnreadByte 只能回退 1 字节；二者都不分配额外内存 |
| 自定义 `SplitFunc` 返回 `(0, nil, nil)` 表示什么？ | 告诉 Scanner 当前数据不足以分割，需要读取更多数据；Scanner 会扩大缓冲区后重试 |
