---
title: io 高级组合模式源码精读
description: 精读 io 包的高级 Reader/Writer 组合工具，掌握 TeeReader、SectionReader、LimitReader、MultiReader/Writer 与 io.Pipe 的设计与应用。
---

# io 高级组合模式：源码精读

> 核心源码：`src/io/io.go`、`src/io/pipe.go`、`src/io/multi.go`

## 包结构图

```
io 包组合工具全览
══════════════════════════════════════════════════════════════════

  读取链路（包装 Reader）：
  ├── io.LimitReader(r, n)      ← 最多读取 n 字节
  ├── io.SectionReader(r, off, n) ← 只读取 [off, off+n) 区间
  ├── io.TeeReader(r, w)        ← 读取同时写入 w（调试/镜像）
  └── io.MultiReader(rs...)     ← 多个 Reader 顺序拼接

  写入链路（包装 Writer）：
  └── io.MultiWriter(ws...)     ← 同时写入多个 Writer（广播）

  同步管道：
  └── io.Pipe()  → (*PipeReader, *PipeWriter)
      ├── 零缓冲（写阻塞直到读取）
      ├── PipeWriter.CloseWithError(err) ← 传递错误给 Reader
      └── 常用于连接两个不兼容的 Reader/Writer 接口

  核心接口层次：
  Reader     → 基础读取
  WriterTo   → 优化：r.WriteTo(w)（避免中间 buffer）
  ReaderFrom → 优化：w.ReadFrom(r)（避免中间 buffer）
  ReadSeeker → Reader + Seeker（可随机定位）
  ReadWriteSeeker → 读写 + 随机定位（os.File）

  io.Copy 内部优化路径：
  1. dst 实现 ReaderFrom → dst.ReadFrom(src)
  2. src 实现 WriterTo   → src.WriteTo(dst)
  3. 否则用 32KB 临时 buffer 循环拷贝

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// TeeReader：读取时同步写入
func TeeReader(r Reader, w Writer) Reader {
    return &teeReader{r, w}
}
type teeReader struct { r Reader; w Writer }
func (t *teeReader) Read(p []byte) (n int, err error) {
    n, err = t.r.Read(p)
    if n > 0 {
        if n, err := t.w.Write(p[:n]); err != nil {
            return n, err
        }
    }
    return
}

// SectionReader：区间读取（实现 ReadAt + Seek + Read）
type SectionReader struct {
    r     ReaderAt
    base  int64  // 起始偏移
    off   int64  // 当前读取位置
    limit int64  // 结束偏移
}

// io.Pipe：同步无缓冲管道
type pipe struct {
    wrMu sync.Mutex    // 序列化写操作
    wrCh chan []byte    // 写者发送数据块
    rdCh chan int       // 读者返回已读字节数
    once sync.Once
    done chan struct{}
    rerr onceError
    werr onceError
}
// 写：发送 buf 到 wrCh → 等待 rdCh 确认
// 读：从 wrCh 接收 → 拷贝数据 → 发送字节数到 rdCh
```

---

## 二、代码示例

### TeeReader：读取同时记录

```go
// 场景：读取 HTTP 响应体，同时记录原始字节（调试/审计）
func readAndLog(resp *http.Response) ([]byte, error) {
    var logBuf bytes.Buffer

    // TeeReader：从 resp.Body 读取的同时写入 logBuf
    tee := io.TeeReader(resp.Body, &logBuf)

    data, err := io.ReadAll(tee)
    if err != nil {
        return nil, err
    }

    // logBuf 和 data 内容相同
    log.Printf("原始响应(%d字节): %s", logBuf.Len(), logBuf.String())
    return data, nil
}

// 场景：计算哈希同时传输数据
func copyWithHash(dst io.Writer, src io.Reader) ([]byte, error) {
    h := sha256.New()
    // 读 src 时同时写入 h（哈希计算）
    tee := io.TeeReader(src, h)
    if _, err := io.Copy(dst, tee); err != nil {
        return nil, err
    }
    return h.Sum(nil), nil
}
```

### LimitReader：防止读取过量

```go
// 限制请求体大小（防止大文件 DoS）
func readLimitedBody(r *http.Request, maxBytes int64) ([]byte, error) {
    // LimitReader：最多读取 maxBytes+1 字节
    limited := io.LimitReader(r.Body, maxBytes+1)
    data, err := io.ReadAll(limited)
    if err != nil {
        return nil, err
    }
    if int64(len(data)) > maxBytes {
        return nil, fmt.Errorf("请求体超过 %d 字节限制", maxBytes)
    }
    return data, nil
}

// 对比：http.MaxBytesReader（功能类似但会设置连接错误）
// r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
```

### SectionReader：随机定位区间读取

```go
// 场景：读取大文件的特定字节范围（HTTP Range 请求实现）
func serveRange(w http.ResponseWriter, f *os.File, start, length int64) {
    // SectionReader 同时实现了 io.ReadSeeker（支持 http.ServeContent）
    section := io.NewSectionReader(f, start, length)

    w.Header().Set("Content-Range",
        fmt.Sprintf("bytes %d-%d/*", start, start+length-1))
    w.Header().Set("Content-Length", fmt.Sprintf("%d", length))
    w.WriteHeader(http.StatusPartialContent)

    io.Copy(w, section)
}

// SectionReader 独立于原 ReadAt，不影响其他读取者
func parallelRead(f *os.File) {
    // 多个 goroutine 并发读取不同区间（无需加锁）
    for i := 0; i < 4; i++ {
        go func(idx int64) {
            section := io.NewSectionReader(f, idx*1024, 1024)
            data, _ := io.ReadAll(section)
            fmt.Printf("区间 %d: %d 字节\n", idx, len(data))
        }(int64(i))
    }
}
```

### MultiReader：拼接多个 Reader

```go
// 场景：HTTP 请求体 = 前置 JSON 头 + 文件内容
func buildCompositeRequest(header []byte, file *os.File) io.Reader {
    // MultiReader 按顺序读完 header 后再读 file
    return io.MultiReader(
        bytes.NewReader(header),
        file,
    )
}

// 场景：在响应体前后各加内容
func wrapResponse(prefix, suffix string, body io.Reader) io.Reader {
    return io.MultiReader(
        strings.NewReader(prefix),
        body,
        strings.NewReader(suffix),
    )
}
```

### MultiWriter：广播写入

```go
// 同时写入文件、控制台和哈希器
func setupMultiWriter(logFile *os.File) io.Writer {
    h := sha256.New()
    return io.MultiWriter(
        os.Stdout,  // 控制台输出
        logFile,    // 文件记录
        h,          // 哈希计算
    )
}

// 场景：构建时同时压缩和计算校验和
func compressWithChecksum(dst *os.File, src io.Reader) (checksum []byte, err error) {
    h := sha256.New()
    mw := io.MultiWriter(dst, h) // 同时写入 dst 和 h

    gw := gzip.NewWriter(mw)
    if _, err = io.Copy(gw, src); err != nil {
        return nil, err
    }
    gw.Close()
    return h.Sum(nil), nil
}
```

### io.Pipe：连接不兼容接口

```go
// 场景：将 json.Encoder（需要 io.Writer）接到 http.Request（需要 io.Reader）
func postJSON(url string, v any) (*http.Response, error) {
    pr, pw := io.Pipe()

    // 在独立 goroutine 中编码（写入 pw）
    go func() {
        err := json.NewEncoder(pw).Encode(v)
        pw.CloseWithError(err) // 编码出错时传递 error 给 Reader
    }()

    // pr 作为请求体（io.Reader）
    req, _ := http.NewRequest("POST", url, pr)
    req.Header.Set("Content-Type", "application/json")
    return http.DefaultClient.Do(req)
}

// 场景：流式转码（gzip → 明文）
func decompressStream(compressed io.Reader) io.Reader {
    pr, pw := io.Pipe()

    go func() {
        gr, err := gzip.NewReader(compressed)
        if err != nil {
            pw.CloseWithError(err)
            return
        }
        defer gr.Close()
        _, err = io.Copy(pw, gr)
        pw.CloseWithError(err)
    }()

    return pr
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `io.Copy` 如何实现零拷贝优化？ | 优先调用 `dst.ReadFrom(src)` 或 `src.WriteTo(dst)`（如 `os.File` 实现了 `WriteTo` 可用 `sendfile` 系统调用），否则用 32KB pool buffer |
| `TeeReader` 和 `MultiWriter` 的区别？ | TeeReader 在**读取**时同时写入第二个目标（一入多出-读端）；MultiWriter 在**写入**时广播到多个目标（一入多出-写端）|
| `io.Pipe` 的内存开销是多少？ | 零缓冲，数据在读写双方之间直接传递；写者阻塞直到读者取走数据，无需额外内存 |
| `SectionReader` 和直接 `Seek` 的区别？ | SectionReader 不影响底层文件指针，可以多个 SectionReader 并发操作同一 ReadAt 源；Seek 会移动全局指针，并发不安全 |
| `io.LimitReader` 超出限制时返回什么？ | 返回 `(0, io.EOF)`；注意它不返回错误，需要调用方检查读取的字节数是否已达上限 |
| `PipeWriter.CloseWithError` 的用途？ | 允许写者将自己的错误传递给读者（读者调用 `Read` 时收到该 error）；普通 `Close` 传递 `io.EOF` |
