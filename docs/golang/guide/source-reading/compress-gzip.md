---
title: compress/gzip 源码精读
description: 精读 compress/gzip 的流式压缩实现，掌握 DEFLATE 算法封装、HTTP 响应压缩、压缩等级权衡与并发压缩最佳实践。
---

# compress/gzip：流式压缩源码精读

> 核心源码：`src/compress/gzip/gzip.go`、`src/compress/flate/deflate.go`
>
> 图例参考：这里补了 gzip 流式压缩图和 `sync.Pool` 复用图，先看 `Write / Flush / Close / Reset` 在数据流里各自负责什么，再回头读 `gzip.go`。

## 包结构图

<GoNetworkDiagram kind="gzip-stream" />

```
compress/gzip 体系
══════════════════════════════════════════════════════════════════

  gzip 文件格式（RFC 1952）：
  ┌──────┬──────────┬─────────┬──────────┬──────┬───────┐
  │ 头部 │  Extra   │ 文件名  │  注释    │ 数据 │ 尾部  │
  │ 10B  │ (可选)   │ (可选)  │ (可选)   │DEFLATE│CRC32+│
  │      │          │         │          │ 压缩  │ Size  │
  └──────┴──────────┴─────────┴──────────┴──────┴───────┘
  Header: {Name, Comment, OS, ModTime, Extra}

  API：
  ├── gzip.NewWriter(w io.Writer) *gzip.Writer
  │    ├── Write(p []byte) (n int, err error)  ← 流式压缩写入
  │    ├── Flush()  ← 刷新（生成可解压的完整块，不关闭）
  │    └── Close()  ← 必须调用（写入尾部 CRC32 + 原始大小）
  │
  ├── gzip.NewReader(r io.Reader) (*gzip.Reader, error)
  │    ├── Read(p []byte) (n int, err error)  ← 流式解压读取
  │    ├── Reset(r io.Reader)  ← 复用 Reader（避免重新分配）
  │    └── Header  ← 文件元信息（Name/ModTime 等）
  │
  └── 压缩等级（flate.BestSpeed ~ flate.BestCompression）：
       BestSpeed(1)        → 速度优先（~400MB/s，压缩率低）
       DefaultCompression(-1) → 默认平衡（等级6）
       BestCompression(9)  → 压缩率优先（~30MB/s，体积最小）

  相关包：
  ├── compress/flate    ← DEFLATE 算法底层实现
  ├── compress/zlib     ← zlib 格式（gzip 去掉文件头）
  ├── compress/lzw      ← LZW 算法（GIF 使用）
  └── compress/bzip2    ← bzip2（只有解压，无压缩）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/compress/gzip/gzip.go（简化）

type Writer struct {
    Header                // gzip 文件头元信息
    w          io.Writer  // 底层 Writer
    level      int        // 压缩等级
    compressor *flate.Writer  // DEFLATE 压缩器
    digest     crc32.Hash    // CRC32 校验（边压缩边计算）
    size       uint32        // 原始数据大小
}

func (z *Writer) Close() error {
    if z.closed { return nil }
    z.closed = true
    // 1. 刷新 DEFLATE 压缩器（写入最后一块）
    z.compressor.Close()
    // 2. 写入尾部：CRC32（4字节）+ 原始大小（4字节，mod 2^32）
    var buf [8]byte
    binary.LittleEndian.PutUint32(buf[:4], z.digest.Sum32())
    binary.LittleEndian.PutUint32(buf[4:], z.size)
    _, err := z.w.Write(buf[:])
    return err
}
```
:::

---

## 二、代码示例

### 基础压缩与解压

::: details 点击展开代码：基础压缩与解压
```go
import "compress/gzip"

// 压缩字节切片
func compress(data []byte) ([]byte, error) {
    var buf bytes.Buffer
    gz := gzip.NewWriter(&buf)
    // ⚠️ Close() 写入尾部 CRC32，必须调用
    defer gz.Close()

    if _, err := gz.Write(data); err != nil {
        return nil, err
    }
    if err := gz.Close(); err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// 解压字节切片
func decompress(data []byte) ([]byte, error) {
    gz, err := gzip.NewReader(bytes.NewReader(data))
    if err != nil {
        return nil, err
    }
    defer gz.Close()
    return io.ReadAll(gz)
}
```
:::

### HTTP 响应 gzip 压缩中间件

::: details 点击展开代码：HTTP 响应 gzip 压缩中间件
```go
type gzipResponseWriter struct {
    http.ResponseWriter
    gz *gzip.Writer
}

func (w *gzipResponseWriter) Write(b []byte) (int, error) {
    return w.gz.Write(b)
}

// gzip 中间件：对支持的客户端压缩响应
func GzipMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // 检查客户端是否接受 gzip
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
        w.Header().Del("Content-Length") // 压缩后大小未知

        next.ServeHTTP(&gzipResponseWriter{
            ResponseWriter: w,
            gz:             gz,
        }, r)
    })
}
```
:::

### 文件压缩（带元信息）

::: details 点击展开代码：文件压缩（带元信息）
```go
// 压缩文件并保留元信息
func compressFile(srcPath, dstPath string) error {
    src, err := os.Open(srcPath)
    if err != nil {
        return err
    }
    defer src.Close()

    fi, _ := src.Stat()

    dst, err := os.Create(dstPath)
    if err != nil {
        return err
    }
    defer dst.Close()

    gz, _ := gzip.NewWriterLevel(dst, gzip.DefaultCompression)
    gz.Header = gzip.Header{
        Name:    fi.Name(),
        ModTime: fi.ModTime(),
        OS:      255, // 未知操作系统
    }
    defer gz.Close()

    _, err = io.Copy(gz, src)
    return err
}

// 读取 gzip 文件元信息（不解压全部内容）
func readGzipHeader(path string) (*gzip.Header, error) {
    f, err := os.Open(path)
    if err != nil {
        return nil, err
    }
    defer f.Close()

    gz, err := gzip.NewReader(f)
    if err != nil {
        return nil, err
    }
    defer gz.Close()

    header := gz.Header // 仅读头部，不解压数据
    return &header, nil
}
```
:::

### sync.Pool 复用 gzip.Writer（高并发优化）

<GoNetworkDiagram kind="gzip-writer-pool" />

::: details 点击展开代码：sync.Pool 复用 gzip.Writer（高并发优化）
```go
// gzip.Writer 初始化有内存分配开销，高并发场景用 Pool 复用
var gzipWriterPool = sync.Pool{
    New: func() any {
        gz, _ := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
        return gz
    },
}

func compressWithPool(w io.Writer, data []byte) error {
    gz := gzipWriterPool.Get().(*gzip.Writer)
    defer func() {
        gz.Reset(io.Discard) // 重置状态
        gzipWriterPool.Put(gz)
    }()

    gz.Reset(w) // 复用 Writer 写到新目标
    if _, err := gz.Write(data); err != nil {
        return err
    }
    return gz.Close()
}
```
:::

### 流式 gzip（大文件不占用内存）

::: details 点击展开代码：流式 gzip（大文件不占用内存）
```go
// 场景：边读取数据库记录边压缩输出（不缓冲全部数据）
func streamingExport(db *sql.DB, w http.ResponseWriter) {
    w.Header().Set("Content-Type", "application/gzip")
    w.Header().Set("Content-Disposition", `attachment; filename="export.json.gz"`)

    gz := gzip.NewWriter(w)
    defer gz.Close()

    enc := json.NewEncoder(gz)

    rows, _ := db.Query("SELECT id, data FROM records")
    defer rows.Close()

    gz.Write([]byte("["))
    first := true
    for rows.Next() {
        var rec Record
        rows.Scan(&rec.ID, &rec.Data)
        if !first {
            gz.Write([]byte(","))
        }
        enc.Encode(rec)
        first = false
    }
    gz.Write([]byte("]"))
}

// 转码：gzip → zlib（不解压到内存）
func gzipToZlib(gzReader io.Reader, zlibWriter io.Writer) error {
    gr, err := gzip.NewReader(gzReader)
    if err != nil {
        return err
    }
    defer gr.Close()

    zw := zlib.NewWriter(zlibWriter)
    defer zw.Close()

    _, err = io.Copy(zw, gr) // 流式转换，内存占用 = 缓冲区大小
    return err
}
```
:::

### 压缩等级基准选择

::: details 点击展开代码：压缩等级基准选择
```go
// 根据场景选择压缩等级
func chooseLevel(scenario string) int {
    switch scenario {
    case "api-response":
        // API 响应：速度优先，减少延迟
        return gzip.BestSpeed // 等级1
    case "static-file":
        // 静态文件：离线压缩，最大化压缩率
        return gzip.BestCompression // 等级9
    case "log-archive":
        // 日志归档：平衡（默认等级6）
        return gzip.DefaultCompression
    case "real-time-stream":
        // 实时流：最快速度
        return 1
    default:
        return gzip.DefaultCompression
    }
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `gzip.Writer.Close()` 为什么必须调用？ | Close 写入 gzip 尾部（CRC32 校验值 + 原始大小），没有尾部的 gzip 文件会导致解压失败或数据验证错误 |
| `Flush()` 和 `Close()` 的区别？ | Flush 将压缩数据刷新到底层 Writer（使接收方可以部分解压），但不关闭流；Close 写尾部并关闭，不可再写入 |
| 如何优化高并发 HTTP gzip 压缩？ | 用 `sync.Pool` 复用 `gzip.Writer`，通过 `Reset(w)` 切换到新目标；避免每次请求都 `New()` 分配内存 |
| gzip 和 deflate 的关系？ | gzip = deflate 压缩数据 + gzip 文件头（魔数/CRC32/文件名等）；zlib = deflate + adler32 校验；HTTP Content-Encoding 的 gzip 就是标准 gzip |
| HTTP 响应压缩为什么要删除 `Content-Length`？ | 压缩后大小未知（流式压缩），必须删除；否则浏览器按原始大小读取数据会截断或报错 |
| `BestSpeed` vs `BestCompression` 的性能差距？ | BestSpeed（等级1）约 300-500MB/s，压缩率约 60%；BestCompression（等级9）约 30-50MB/s，压缩率约 70%；API 场景通常用等级 1-3 |
