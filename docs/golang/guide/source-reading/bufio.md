---
title: bufio 包源码精读
description: 精读 bufio.Reader/Writer/Scanner 的缓冲策略与 SplitFunc 机制，涵盖 ReadLine vs ReadString 选择、Peek 高级用法、ReadWriter 双向缓冲与高性能 I/O 最佳实践。
---

# bufio：缓冲 I/O 源码精读

> 核心源码：`src/bufio/bufio.go`、`src/bufio/scan.go`
>
> 图例参考：复用 IO 组合图例，把 `Reader` / `Writer` / `bufio` 放到同一条链上看，先理解“缓冲层插在 Reader/Writer 中间”这件事，再回头读 `r/w` 指针和 `Flush` 约束。

## 包结构图

<GoNetworkDiagram kind="io-primitives" />

```
bufio 包全景
══════════════════════════════════════════════════════════════════

  读缓冲
  ├── bufio.Reader      ← 带缓冲的 io.Reader（默认 4096 字节）
  │     ├── Read / ReadByte / ReadRune
  │     ├── ReadLine / ReadString / ReadBytes
  │     └── Peek（预读不消费）/ Discard（跳过 N 字节）
  └── bufio.Scanner     ← 逐 token 扫描（更高层抽象）
        ├── Scan() → 推进到下一个 token
        ├── Text() / Bytes() → 当前 token
        └── Split(SplitFunc) → 自定义分隔逻辑

  写缓冲
  └── bufio.Writer      ← 带缓冲的 io.Writer（默认 4096 字节）
        ├── Write / WriteByte / WriteRune / WriteString
        └── Flush() → 强制刷新到底层 Writer

  双向缓冲
  └── bufio.ReadWriter  ← *Reader + *Writer 的组合

══════════════════════════════════════════════════════════════════
```

---

## 一、bufio.Reader 结构

::: details 点击展开代码：一、bufio.Reader 结构
```go
// src/bufio/bufio.go
type Reader struct {
    buf          []byte        // 缓冲区（默认 4096 字节）
    rd           io.Reader     // 底层 Reader
    r, w         int           // r=读指针，w=写指针（buf[r:w] 为可读数据）
    err          error         // 上次读取的错误（延迟返回）
    lastByte     int           // 上次读取的字节（用于 UnreadByte）
    lastRuneSize int           // 上次读取的 rune 大小（用于 UnreadRune）
}
```
:::

```
Reader 缓冲区状态示意
══════════════════════════════════════════════════════════════════

  初始状态（r=0, w=0）：
  ┌─────────────────────────────────────────────────┐
  │           buf（4096 字节）                       │
  └─────────────────────────────────────────────────┘

  填充一次后（r=0, w=512）：
  ┌──────────────────────┬──────────────────────────┐
  │ 可读数据 buf[0:512]  │       空闲空间            │
  └──────────────────────┴──────────────────────────┘
   ↑r                    ↑w

  读取 100 字节后（r=100, w=512）：
  ┌──────┬───────────────┬──────────────────────────┐
  │ 已读  │ 可读 buf[100:512] │    空闲             │
  └──────┴───────────────┴──────────────────────────┘
          ↑r              ↑w

  空间不足时：compact（把 buf[r:w] 移到 buf[0:]，r=0）

══════════════════════════════════════════════════════════════════
```

### Read 策略

```
bufio.Reader.Read 三条路径
══════════════════════════════════════════════════════════════════

  Read(p []byte)
       │
       ├── 缓冲区有数据（w > r）
       │       → copy(p, buf[r:w])，更新 r
       │       → 不触发系统调用（最快路径）
       │
       ├── p 很大（len(p) >= len(buf)）
       │       → 跳过缓冲，直接 rd.Read(p)（大 I/O 避免额外拷贝）
       │
       └── 缓冲区空，p 较小
               → rd.Read(buf) 填充整个缓冲区
               → copy(p, buf[r:w])

  关键设计：小 I/O 走缓冲，大 I/O 绕过缓冲，最小化系统调用次数

══════════════════════════════════════════════════════════════════
```

---

## 二、bufio.Scanner 与 SplitFunc

::: details 点击展开代码：二、bufio.Scanner 与 SplitFunc
```go
// src/bufio/scan.go
type Scanner struct {
    r            io.Reader
    split        SplitFunc     // token 分割函数
    maxTokenSize int           // 最大 token 大小（默认 64KB）
    token        []byte        // 当前 token
    buf          []byte        // 读缓冲
    start        int           // 未处理数据起始位置
    end          int           // 未处理数据结束位置
    err          error
    done         bool
}

// SplitFunc 签名：
type SplitFunc func(
    data []byte,   // 当前缓冲中的数据
    atEOF bool,    // 是否到达文件末尾
) (
    advance int,   // 消费多少字节（推进读指针）
    token []byte,  // 返回的 token（nil 表示需要更多数据）
    err error,
)
```
:::

```
内置 SplitFunc
══════════════════════════════════════════════════════════════════

  ScanLines    ← 按行扫描（处理 \n / \r\n / \r）← 默认
  ScanWords    ← 按空白分词
  ScanRunes    ← 按 UTF-8 rune 扫描
  ScanBytes    ← 按字节扫描

══════════════════════════════════════════════════════════════════
```

### ScanLines 实现原理

::: details 点击展开代码：ScanLines 实现原理
```go
// src/bufio/scan.go
func ScanLines(data []byte, atEOF bool) (advance int, token []byte, err error) {
    if atEOF && len(data) == 0 {
        return 0, nil, nil // 空输入
    }
    if i := bytes.IndexByte(data, '\n'); i >= 0 {
        // 找到换行符，返回这一行（去掉 \r\n 或 \n）
        return i + 1, dropCR(data[0:i]), nil
    }
    if atEOF {
        // EOF 但还有剩余数据，作为最后一行返回
        return len(data), dropCR(data), nil
    }
    // 还没找到换行，请求更多数据
    return 0, nil, nil
}
```
:::

---

## 三、bufio.Writer

::: details 点击展开代码：三、bufio.Writer
```go
type Writer struct {
    err error
    buf []byte    // 写缓冲区
    n   int       // 已写入 buf 的字节数
    wr  io.Writer // 底层 Writer
}
```
:::

```
Writer.Write 策略
══════════════════════════════════════════════════════════════════

  Write(p []byte)
       │
       ├── p 能放入剩余缓冲（n + len(p) <= len(buf)）
       │       → copy(buf[n:], p)，n += len(p)（不触发系统调用）
       │
       ├── 缓冲区空且 p 大（len(p) >= len(buf)）
       │       → 直接 wr.Write(p)（跳过缓冲，避免额外拷贝）
       │
       └── 先 Flush（把 buf 写出），再处理 p
               → 保证 buf 中没有旧数据

  Flush()：把 buf[0:n] 写入 wr，重置 n=0

  ⚠️ 常见 Bug：忘记 Flush → 最后几个字节留在 buf 中未写出
     ✅ 正确用法：defer w.Flush() 或在 Close 前 Flush

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 逐行读取文件（Scanner 最佳实践）

::: details 点击展开代码：逐行读取文件（Scanner 最佳实践）
```go
func countLines(path string) (int, error) {
    f, err := os.Open(path)
    if err != nil {
        return 0, err
    }
    defer f.Close()

    scanner := bufio.NewScanner(f)
    // 大文件调大 buf，避免 "bufio.Scanner: token too long"
    scanner.Buffer(make([]byte, 1024*1024), 1024*1024)

    var count int
    for scanner.Scan() {
        count++
        // scanner.Text() 返回当前行（不含换行符）
        // scanner.Bytes() 返回 []byte（零拷贝，下次 Scan 后失效）
    }
    return count, scanner.Err() // 注意：检查迭代错误
}
```
:::

### 自定义 SplitFunc（按逗号分割）

::: details 点击展开代码：自定义 SplitFunc（按逗号分割）
```go
func scanCSVFields(data []byte, atEOF bool) (advance int, token []byte, err error) {
    if atEOF && len(data) == 0 {
        return 0, nil, nil
    }
    if i := bytes.IndexByte(data, ','); i >= 0 {
        return i + 1, bytes.TrimSpace(data[:i]), nil
    }
    if atEOF {
        return len(data), bytes.TrimSpace(data), nil
    }
    return 0, nil, nil // 需要更多数据
}

func parseCSVLine(line string) []string {
    scanner := bufio.NewScanner(strings.NewReader(line))
    scanner.Split(scanCSVFields)

    var fields []string
    for scanner.Scan() {
        fields = append(fields, scanner.Text())
    }
    return fields
}

// "Alice, 30, alice@example.com" → ["Alice", "30", "alice@example.com"]
```
:::

### 自定义 SplitFunc：按固定字节边界分割

::: details 点击展开代码：自定义 SplitFunc：按固定字节边界分割
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
:::

### ReadLine vs ReadString：正确选择

::: details 点击展开代码：ReadLine vs ReadString：正确选择
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
:::

### 高效写入日志（Writer + Flush）

::: details 点击展开代码：高效写入日志（Writer + Flush）
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
:::

### Peek：预读不消费（协议解析）

::: details 点击展开代码：Peek：预读不消费（协议解析）
```go
// 判断数据格式（JSON 或 MsgPack）而不消费数据
func detectFormat(r io.Reader) string {
    br := bufio.NewReader(r)
    // Peek 预读 1 字节，不影响后续 Read
    first, err := br.Peek(1)
    if err != nil {
        return "unknown"
    }
    if first[0] == '{' || first[0] == '[' {
        return "json"
    }
    return "msgpack"
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
:::

### ReadWriter：双向缓冲（网络协议实现）

::: details 点击展开代码：ReadWriter：双向缓冲（网络协议实现）
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
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| bufio.Reader 什么时候绕过缓冲？ | 请求的 p 大于等于缓冲区大小时，直接调用底层 Read，避免多余拷贝 |
| Scanner 默认最大 token 大小是多少？ | 64KB（`bufio.MaxScanTokenSize`）；超出会报 `bufio.ErrTooLong` |
| Flush 忘了调用会怎样？ | 缓冲区中的数据不会写出；使用 `defer bw.Flush()` 保证写出 |
| Scanner.Bytes() 和 Text() 的区别？ | Bytes() 返回引用底层 buf 的切片（下次 Scan 失效）；Text() 返回独立 string（分配新内存） |
| SplitFunc 返回 advance=0, token=nil 是什么意思？ | 需要更多数据，Scanner 会扩展缓冲后重新调用 SplitFunc |
| bufio.Writer 适合哪些场景？ | 频繁小写操作（如逐字节/逐行写日志）；减少系统调用次数 |
| `Scanner.Scan()` 和 `Reader.ReadString()` 的区别？ | Scanner 自动处理缓冲扩容，接口简洁，但有 token 大小上限；ReadString 返回完整行（含分段拼接），内存分配更可控 |
| `ReadLine` 返回 `isPrefix=true` 时如何处理？ | 表示行超过缓冲区，需循环调用 ReadLine 并拼接 segment，直到 `isPrefix=false` |
| `Peek(n)` 与 `ReadByte` + `UnreadByte` 的区别？ | Peek 可预读多字节且不消耗；UnreadByte 只能回退 1 字节；二者都不分配额外内存 |
