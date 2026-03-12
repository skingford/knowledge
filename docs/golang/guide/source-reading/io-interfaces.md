---
title: io 包源码精读
description: 精读 io.Reader/Writer 核心接口体系，理解 Go I/O 的设计哲学与组合模式。
---

# io 包：I/O 接口体系源码精读

> 核心源码：`src/io/io.go`、`src/bufio/bufio.go`

## 包结构图

```
Go I/O 接口层次
══════════════════════════════════════════════════════════════════

  基础接口（io 包）
  ├── Reader          { Read(p []byte) (n int, err error) }
  ├── Writer          { Write(p []byte) (n int, err error) }
  ├── Closer          { Close() error }
  ├── Seeker          { Seek(offset int64, whence int) (int64, error) }
  └── ReadWriter      = Reader + Writer（组合接口）

  扩展接口
  ├── ReadCloser      = Reader + Closer
  ├── WriteCloser     = Writer + Closer
  ├── ReadWriteCloser = Reader + Writer + Closer
  ├── ReaderAt        { ReadAt(p []byte, off int64) (n int, err error) }
  ├── WriterAt        { WriteAt(p []byte, off int64) (n int, err error) }
  ├── ByteReader      { ReadByte() (byte, error) }
  └── StringWriter    { WriteString(s string) (n int, err error) }

  实现层（标准库）
  ├── os.File         ← 实现 ReadWriteCloser + Seeker
  ├── bytes.Buffer    ← 实现 ReadWriter（内存缓冲）
  ├── strings.Reader  ← 实现 Reader（字符串读取）
  ├── bufio.Reader    ← 包装 Reader，添加缓冲层
  ├── bufio.Writer    ← 包装 Writer，添加缓冲层
  ├── net.Conn        ← 实现 ReadWriteCloser（网络连接）
  └── http.Response.Body ← 实现 ReadCloser

══════════════════════════════════════════════════════════════════
```

---

## 一、核心接口设计

### Reader 接口

```go
// src/io/io.go
type Reader interface {
    // 读取数据到 p，返回读取字节数 n 和可能的错误
    // 规则：
    //   n > 0 时，即使 err != nil 也要先处理数据
    //   err == io.EOF 表示正常结束（不是真正的错误）
    //   n == 0, err == nil 不应该出现（但允许）
    Read(p []byte) (n int, err error)
}
```

```
Read 调用约定（重要！）
══════════════════════════════════════════════

  ┌──────────────────────────────────────────┐
  │  读取循环的正确写法：                    │
  │                                          │
  │  for {                                   │
  │      n, err := r.Read(buf)               │
  │      // 先处理数据，再处理错误           │
  │      process(buf[:n])                    │
  │      if err == io.EOF {                  │
  │          break    // 正常结束            │
  │      }                                   │
  │      if err != nil {                     │
  │          return err  // 真正的错误       │
  │      }                                   │
  │  }                                       │
  └──────────────────────────────────────────┘

  常见错误：先判断 err 再处理数据
  → 会丢失最后一次同时返回数据和 EOF 的数据
```

---

## 二、bufio：缓冲 I/O

### 结构图

```
bufio.Reader 结构
══════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │                  bufio.Reader                   │
  │                                                 │
  │  rd      io.Reader  ← 底层 Reader               │
  │  buf     []byte     ← 缓冲区（默认 4096 字节）  │
  │  r, w    int        ← 读/写指针                 │
  │  err     error      ← 缓存的错误                │
  │                                                 │
  │  ReadByte():  从 buf[r] 读1字节，r++            │
  │  ReadLine():  读到 \n 为止                      │
  │  ReadString(): 读到分隔符为止                   │
  │                                                 │
  │  buf 为空时 → 从 rd 批量读取 → 填充 buf         │
  │                                                 │
  └─────────────────────────────────────────────────┘

  性能优势：
  ├── 减少系统调用次数（批量读 vs 逐字节读）
  └── 适合行处理、协议解析等场景
```

---

## 三、io 工具函数

```
常用工具函数一览
══════════════════════════════════════════════════════

  io.Copy(dst Writer, src Reader) (n int64, err error)
  └── 内部使用 32KB 缓冲，零拷贝时走 WriteTo/ReadFrom

  io.ReadAll(r Reader) ([]byte, error)
  └── 读取所有数据，内部使用 bytes.Buffer 动态扩容

  io.LimitReader(r Reader, n int64) Reader
  └── 限制读取字节数，超过返回 EOF

  io.TeeReader(r Reader, w Writer) Reader
  └── 读取时同时写入 w（调试/日志场景）

  io.Pipe() (*PipeReader, *PipeWriter)
  └── 同步管道，Write 阻塞直到 Read 消费

  io.MultiReader(readers ...Reader) Reader
  └── 顺序串联多个 Reader

  io.MultiWriter(writers ...Writer) Writer
  └── 广播写入多个 Writer（如同时写文件和标准输出）
```

---

## 四、代码示例

### 复制文件

```go
func copyFile(dst, src string) error {
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

    _, err = io.Copy(out, in) // 高效复制
    return err
}
```

### 流式处理大文件

```go
func countLines(path string) (int, error) {
    f, err := os.Open(path)
    if err != nil {
        return 0, err
    }
    defer f.Close()

    scanner := bufio.NewScanner(f) // 默认 64KB 行缓冲
    count := 0
    for scanner.Scan() {
        count++
    }
    return count, scanner.Err()
}
```

### TeeReader 调试

```go
func debugRequest(r io.Reader) {
    var buf bytes.Buffer
    // 读取时同时写入 buf，不影响后续处理
    tee := io.TeeReader(r, &buf)

    data, _ := io.ReadAll(tee)
    fmt.Println("body:", string(data))
    fmt.Println("copy:", buf.String()) // 与 data 相同
}
```

### 实现 Writer 接口

```go
// 实现 io.Writer，统计写入字节数
type CountWriter struct {
    w     io.Writer
    total int64
}

func (cw *CountWriter) Write(p []byte) (n int, err error) {
    n, err = cw.w.Write(p)
    cw.total += int64(n)
    return
}
```

---

## 五、接口组合设计哲学

```
Go I/O 设计精髓：小接口 + 组合
══════════════════════════════════════════════════════

  每个接口只有 1-2 个方法（单一职责）
       ↓
  通过组合构成复杂接口（ReadWriteCloser 等）
       ↓
  实现者只需实现需要的方法（不强制实现所有）
       ↓
  使用者面向接口编程，不依赖具体类型
       ↓
  可轻松替换：文件→网络→内存→压缩流→加密流

  典型应用链：
  net.Conn → bufio.Reader → gzip.Reader → json.Decoder
                读取          解压         反序列化
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Read 返回 0, nil 合法吗？ | 合法但不建议，调用方应重试 |
| io.EOF 是错误吗？ | 是 error 类型，但语义是"正常结束" |
| bufio vs 直接 Read？ | bufio 减少系统调用，适合高频小量读 |
| io.Copy 零拷贝？ | 实现了 WriteTo/ReadFrom 时，底层走 sendfile |
| bytes.Buffer 线程安全吗？ | 不安全，并发需加锁 |
