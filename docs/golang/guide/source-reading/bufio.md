---
title: bufio 包源码精读
description: 精读 bufio.Reader/Writer/Scanner 的缓冲策略与 SplitFunc 机制，理解行扫描与高性能 I/O 的底层实现。
---

# bufio：缓冲 I/O 源码精读

> 核心源码：`src/bufio/bufio.go`、`src/bufio/scan.go`

## 包结构图

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

---

## 三、bufio.Writer

```go
type Writer struct {
    err error
    buf []byte    // 写缓冲区
    n   int       // 已写入 buf 的字节数
    wr  io.Writer // 底层 Writer
}
```

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

### 自定义 SplitFunc（按逗号分割）

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

### 高效写入日志（Writer + Flush）

```go
func writeLog(w io.Writer, entries []LogEntry) error {
    bw := bufio.NewWriterSize(w, 64*1024) // 64KB 写缓冲
    defer bw.Flush() // 确保最终刷新

    for _, e := range entries {
        fmt.Fprintf(bw, "%s\t%s\t%s\n",
            e.Time.Format(time.RFC3339),
            e.Level,
            e.Message,
        )
        if bw.Buffered() >= 60*1024 { // 接近满时主动 Flush
            if err := bw.Flush(); err != nil {
                return err
            }
        }
    }
    return nil
}
```

### Peek：预读不消费（协议解析）

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
```

### ReadString vs Scanner 对比

```go
// ❌ ReadString：每行分配新字符串（大文件内存压力大）
br := bufio.NewReader(f)
for {
    line, err := br.ReadString('\n') // 每次分配 string
    if err == io.EOF { break }
    process(strings.TrimRight(line, "\n"))
}

// ✅ Scanner：内部复用 buf（大文件首选）
scanner := bufio.NewScanner(f)
for scanner.Scan() {
    process(scanner.Text()) // Text() 分配新 string，但 Bytes() 可零拷贝
}
```

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
