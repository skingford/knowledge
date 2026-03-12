---
title: compress/gzip 源码精读
description: 精读 compress/gzip 的流式压缩实现、DEFLATE 算法结构与 HTTP 压缩传输的最佳实践。
---

# compress/gzip：压缩 I/O 源码精读

> 核心源码：`src/compress/gzip/gzip.go`、`src/compress/flate/`

## 包结构图

```
compress 包生态
══════════════════════════════════════════════════════════════════

  compress/gzip         ← gzip 格式（含文件头/CRC32/大小校验）
  compress/zlib         ← zlib 格式（含 Adler-32 校验，HTTP deflate 实际是这个）
  compress/flate        ← 核心 DEFLATE 算法（LZ77 + Huffman）
  compress/bzip2        ← bzip2（只读，无写实现）
  compress/lzw          ← LZW（GIF/TIFF 使用）

  gzip 文件格式：
  ┌──────────────────────────────────────────────────────────────┐
  │  Header（10字节）                                             │
  │  ├── Magic: 1f 8b                                            │
  │  ├── Method: 08（DEFLATE）                                   │
  │  ├── Flags: FNAME/FCOMMENT/FHCRC/FEXTRA                     │
  │  ├── ModTime: 4字节                                          │
  │  ├── ExtraFlags + OS                                         │
  │  └── 可选：文件名（\0 结尾）/注释/Extra 字段                 │
  │  Body: DEFLATE 压缩数据                                      │
  │  Footer（8字节）                                             │
  │  ├── CRC32: 4字节（原始数据校验）                            │
  │  └── Size:  4字节（原始数据大小 mod 2^32）                   │
  └──────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心结构

```go
// src/compress/gzip/gzip.go
type Writer struct {
    Header                          // gzip 头部信息
    w          io.Writer            // 底层输出
    level      int                  // 压缩级别
    compressor *flate.Writer        // DEFLATE 压缩器
    digest     crc32.Hash           // CRC32 校验
    size       uint32               // 已写入原始字节数
    closed     bool
    buf        [10]byte             // 临时缓冲
    err        error
}

// src/compress/gzip/gunzip.go
type Reader struct {
    Header                          // 读取到的 gzip 头部
    r            flate.Reader       // 底层字节读取器
    decompressor io.ReadCloser      // DEFLATE 解压器
    digest       uint32             // 累计 CRC32
    size         uint32             // 已读取字节数
    buf          [512]byte
    err          error
    multistream  bool               // 是否支持多流（默认 true）
}
```

---

## 二、DEFLATE 算法原理

```
DEFLATE = LZ77 + Huffman 编码
══════════════════════════════════════════════════════════════════

  阶段一：LZ77 压缩（消除重复字节序列）
  ──────────────────────────────────────
  输入：abcabcabc
  扫描：abc 在距离 0 出现；再次发现 abc 在距离 3 前
  编码：abc + (distance=3, length=6) ← "回引"指针
  输出：abc + <back-ref>

  阶段二：Huffman 编码（消除统计冗余）
  ──────────────────────────────────────
  对 LZ77 的符号（literal/length/distance）建 Huffman 树
  高频符号 → 短编码
  低频符号 → 长编码
  → 进一步压缩编码长度

  压缩级别（flate 包）：
  ├── flate.NoCompression       = 0（只封装，不压缩，最快）
  ├── flate.BestSpeed           = 1（速度优先）
  ├── flate.DefaultCompression  = -1（平衡，约 level 6）
  └── flate.BestCompression     = 9（压缩率最高，最慢）

══════════════════════════════════════════════════════════════════
```

---

## 三、流式压缩设计

```
gzip.Writer 写入流程
══════════════════════════════════════════════════════════════════

  gzip.NewWriter(w)
       │
       └── 首次 Write 时写 gzip Header（懒写入）

  writer.Write(data)
       │
       ├── 更新 CRC32：digest.Write(data)
       ├── 更新 size += len(data)
       └── 调用 flate.Writer.Write(data)
               → LZ77 压缩 + Huffman 编码
               → 写入底层 w

  writer.Close()
       │
       ├── flate.Writer.Close()（flush 剩余数据 + 结束块）
       ├── 写 Footer：CRC32（4字节）+ Size（4字节）
       └── 关闭底层 w（若实现了 io.Closer）

  ⚠️ 必须调用 Close()，否则：
     ├── flate 内部缓冲未 flush
     └── gzip Footer 未写入 → 接收方 CRC 校验失败

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 压缩文件

```go
func compressFile(src, dst string) error {
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

    // 带 bufio 减少系统调用次数
    bw := bufio.NewWriterSize(out, 64*1024)
    gz, err := gzip.NewWriterLevel(bw, gzip.BestSpeed)
    if err != nil {
        return err
    }

    if _, err := io.Copy(gz, in); err != nil {
        return err
    }
    if err := gz.Close(); err != nil { // ← 关键：Flush + 写 Footer
        return err
    }
    return bw.Flush()
}
```

### 解压文件

```go
func decompressFile(src, dst string) error {
    in, err := os.Open(src)
    if err != nil {
        return err
    }
    defer in.Close()

    gr, err := gzip.NewReader(in)
    if err != nil {
        return err
    }
    defer gr.Close()

    // 读取 gzip 头中的元信息
    fmt.Printf("original file: %s, modified: %v\n",
        gr.Name, gr.ModTime)

    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    _, err = io.Copy(out, gr)
    return err
}
```

### HTTP 响应压缩（gzip 中间件）

```go
type gzipResponseWriter struct {
    http.ResponseWriter
    gz *gzip.Writer
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
    return w.gz.Write(b)
}

func GzipMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 检查客户端是否支持 gzip
        if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
            next.ServeHTTP(w, r)
            return
        }

        gz, err := gzip.NewWriterLevel(w, gzip.BestSpeed)
        if err != nil {
            next.ServeHTTP(w, r)
            return
        }
        defer gz.Close()

        w.Header().Set("Content-Encoding", "gzip")
        w.Header().Del("Content-Length") // 压缩后长度未知
        next.ServeHTTP(&gzipResponseWriter{w, gz}, r)
    })
}
```

### 内存压缩（bytes.Buffer）

```go
// 压缩到内存
func compress(data []byte) ([]byte, error) {
    var buf bytes.Buffer
    gz, _ := gzip.NewWriterLevel(&buf, gzip.BestCompression)
    if _, err := gz.Write(data); err != nil {
        return nil, err
    }
    if err := gz.Close(); err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// 从内存解压
func decompress(data []byte) ([]byte, error) {
    gr, err := gzip.NewReader(bytes.NewReader(data))
    if err != nil {
        return nil, err
    }
    defer gr.Close()
    return io.ReadAll(gr)
}
```

### 压缩 JSON API 响应

```go
func writeJSONGzip(w http.ResponseWriter, data any) error {
    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Content-Encoding", "gzip")

    gz := gzip.NewWriter(w)
    defer gz.Close()

    return json.NewEncoder(gz).Encode(data) // 流式：边 JSON 编码边压缩
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| DEFLATE 算法由哪两部分组成？ | LZ77（消除重复序列，用回引指针）+ Huffman 编码（消除统计冗余）|
| gzip 和 zlib 的区别？ | gzip 有文件头（魔数/文件名/时间）和 CRC32 校验；zlib 头更轻量（Adler-32）；DEFLATE 是共同的压缩内核 |
| 忘记 Close 会导致什么？ | flate 缓冲区未 flush + gzip Footer 未写入 → 接收方 CRC 校验失败，数据被认为损坏 |
| 如何选择压缩级别？ | 网络传输：BestSpeed（1）；存储归档：BestCompression（9）；通用：DefaultCompression（-1） |
| HTTP gzip 压缩时为什么要删 Content-Length？ | 压缩后大小未知（流式压缩），若保留原始大小会导致客户端接收错误字节数 |
| gzip.Reader 的 Multistream 是什么？ | 允许读取多个 gzip 流拼接的文件（如 .tar.gz 中多个流）；默认开启 |
