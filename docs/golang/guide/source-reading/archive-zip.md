---
title: archive/zip 源码精读
description: 精读 archive/zip 的 ZIP 格式解析与创建，理解中央目录、流式写入与 archive/tar 的区别。
---

# archive/zip：ZIP 归档源码精读

> 核心源码：`src/archive/zip/reader.go`、`src/archive/zip/writer.go`、`src/archive/zip/struct.go`
>
> 图例参考：这里补了 ZIP 中央目录图，并在 `.tar.gz` 对比段复用了 TAR 顺序归档图，先把“为什么 ZIP 需要从文件尾回读”这件事搞明白，再看 `reader.go`。

## 包结构图

<GoNetworkDiagram kind="zip-central-directory" />

```
archive 包生态
══════════════════════════════════════════════════════════════════

  archive/zip（ZIP 格式）
  ├── zip.NewReader(r, size)    ← 读取（需要 io.ReaderAt + 大小）
  ├── zip.OpenReader(path)      ← 读取文件
  ├── zip.NewWriter(w)          ← 创建 ZIP
  └── zip.Reader.File           ← []*zip.File 文件列表

  archive/tar（TAR 格式，Linux/Docker 常用）
  ├── tar.NewReader(r)          ← 流式读取（不需要 seek）
  └── tar.NewWriter(w)          ← 流式写入

  ZIP vs TAR 关键区别：
  ┌────────────────────────┬───────────────────────────────────┐
  │ ZIP                    │ TAR                               │
  ├────────────────────────┼───────────────────────────────────┤
  │ 每个文件单独压缩       │ 整体压缩（.tar.gz）               │
  │ 支持随机访问           │ 只支持顺序访问                    │
  │ 需要 io.ReaderAt       │ 只需 io.Reader                    │
  │ 中央目录在末尾         │ 无中央目录，逐条 Header+Data      │
  │ Windows/跨平台常用     │ Linux/Docker 镜像层               │
  └────────────────────────┴───────────────────────────────────┘

  ZIP 文件结构：
  ┌─────────────────────────────────────────────────────────────┐
  │  Local File Header 1 + Data 1                               │
  │  Local File Header 2 + Data 2                               │
  │  ...                                                         │
  │  [Data Descriptor（可选）]                                   │
  │  Central Directory（所有文件的元数据汇总）                   │
  │  End of Central Directory Record（末尾固定结构）             │
  └─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、核心数据结构

::: details 点击展开代码：一、核心数据结构
```go
// src/archive/zip/struct.go
type File struct {
    FileHeader
    zip          *Reader
    headerOffset int64   // 本地文件头偏移量
    zip64        bool    // 是否 ZIP64 扩展
}

type FileHeader struct {
    Name               string    // 文件路径（/ 分隔）
    Comment            string    // 注释
    NonUTF8            bool
    CreatorVersion     uint16
    ReaderVersion      uint16
    Flags              uint16
    Method             uint16    // 0=Store, 8=Deflate
    Modified           time.Time
    CRC32              uint32
    CompressedSize64   uint64
    UncompressedSize64 uint64
    Extra              []byte
    ExternalAttrs      uint32    // Unix 权限/文件类型
}

// Reader 结构
type Reader struct {
    File    []*File   // 按中央目录顺序排列
    Comment string
    r       io.ReaderAt  // 支持随机访问
}

// Writer 结构
type Writer struct {
    cw     *countWriter
    dir    []*header    // 暂存文件头，Close 时写入中央目录
    closed bool
    compressors map[uint16]Compressor
}
```
:::

---

## 二、代码示例

### 读取 ZIP 文件

::: details 点击展开代码：读取 ZIP 文件
```go
// 打开并遍历 ZIP
r, err := zip.OpenReader("archive.zip")
if err != nil {
    log.Fatal(err)
}
defer r.Close()

for _, f := range r.File {
    fmt.Printf("%-40s %10d → %d bytes (%.1f%%)\n",
        f.Name,
        f.CompressedSize64,
        f.UncompressedSize64,
        100*(1-float64(f.CompressedSize64)/float64(f.UncompressedSize64)),
    )

    // 读取文件内容
    rc, err := f.Open()
    if err != nil {
        log.Fatal(err)
    }
    content, _ := io.ReadAll(rc)
    rc.Close()
    _ = content
}
```
:::

### 解压 ZIP（安全版）

::: details 点击展开代码：解压 ZIP（安全版）
```go
func unzip(src, dst string) error {
    r, err := zip.OpenReader(src)
    if err != nil {
        return err
    }
    defer r.Close()

    for _, f := range r.File {
        // 🔐 安全：防止 Zip Slip 路径穿越攻击
        // 恶意 ZIP 可能包含 "../../../etc/passwd" 这样的路径
        targetPath := filepath.Join(dst, filepath.FromSlash(f.Name))
        cleanDst, _ := filepath.Abs(dst)
        cleanTarget, _ := filepath.Abs(targetPath)
        if !strings.HasPrefix(cleanTarget, cleanDst+string(filepath.Separator)) {
            return fmt.Errorf("zip slip: 非法路径 %q", f.Name)
        }

        if f.FileInfo().IsDir() {
            os.MkdirAll(targetPath, 0755)
            continue
        }

        // 创建父目录
        if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
            return err
        }

        rc, err := f.Open()
        if err != nil {
            return err
        }

        outFile, err := os.OpenFile(targetPath,
            os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
        if err != nil {
            rc.Close()
            return err
        }

        // 限制解压大小（防 Zip Bomb）
        const maxSize = 100 * 1024 * 1024 // 100 MB
        _, err = io.Copy(outFile, io.LimitReader(rc, maxSize))
        outFile.Close()
        rc.Close()
        if err != nil {
            return err
        }
    }
    return nil
}
```
:::

### 创建 ZIP（写入文件）

::: details 点击展开代码：创建 ZIP（写入文件）
```go
func createZip(dst string, files map[string][]byte) error {
    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    w := zip.NewWriter(out)
    defer w.Close() // 关键！写入中央目录

    for name, data := range files {
        // 使用 CreateHeader 可控制压缩方式和元数据
        hdr := &zip.FileHeader{
            Name:   name,
            Method: zip.Deflate, // 或 zip.Store（不压缩）
        }
        hdr.SetModTime(time.Now())
        hdr.SetMode(0644)

        fw, err := w.CreateHeader(hdr)
        if err != nil {
            return err
        }
        if _, err := fw.Write(data); err != nil {
            return err
        }
    }
    return nil
}
```
:::

### 打包目录为 ZIP

::: details 点击展开代码：打包目录为 ZIP
```go
func zipDir(dir, dst string) error {
    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    zw := zip.NewWriter(out)
    defer zw.Close()

    return filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }

        // 计算 ZIP 内的相对路径
        relPath, err := filepath.Rel(dir, path)
        if err != nil {
            return err
        }
        // ZIP 路径用 / 分隔
        zipPath := filepath.ToSlash(relPath)

        if d.IsDir() {
            // 目录条目末尾加 /
            if zipPath != "." {
                _, err = zw.Create(zipPath + "/")
            }
            return err
        }

        info, err := d.Info()
        if err != nil {
            return err
        }

        hdr, err := zip.FileInfoHeader(info)
        if err != nil {
            return err
        }
        hdr.Name = zipPath
        hdr.Method = zip.Deflate

        fw, err := zw.CreateHeader(hdr)
        if err != nil {
            return err
        }

        f, err := os.Open(path)
        if err != nil {
            return err
        }
        defer f.Close()
        _, err = io.Copy(fw, f)
        return err
    })
}
```
:::

### 内存 ZIP（bytes.Buffer）

::: details 点击展开代码：内存 ZIP（bytes.Buffer）
```go
// 在内存中创建 ZIP（适合 HTTP 响应直接下载）
func zipInMemory(files map[string][]byte) ([]byte, error) {
    var buf bytes.Buffer
    zw := zip.NewWriter(&buf)

    for name, data := range files {
        fw, err := zw.Create(name)
        if err != nil {
            return nil, err
        }
        fw.Write(data)
    }

    if err := zw.Close(); err != nil {
        return nil, err
    }
    return buf.Bytes(), nil
}

// HTTP 下载接口
func downloadHandler(w http.ResponseWriter, r *http.Request) {
    files := map[string][]byte{
        "report.csv":  generateCSV(),
        "summary.txt": generateSummary(),
    }

    zipData, err := zipInMemory(files)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    w.Header().Set("Content-Type", "application/zip")
    w.Header().Set("Content-Disposition", `attachment; filename="export.zip"`)
    w.Header().Set("Content-Length", strconv.Itoa(len(zipData)))
    w.Write(zipData)
}
```
:::

### TAR + GZIP（.tar.gz）

<GoNetworkDiagram kind="tar-archive-layout" />

::: details 点击展开代码：TAR + GZIP（.tar.gz）
```go
// 对比：archive/tar 流式压缩（Linux 常用）
func createTarGz(dir, dst string) error {
    out, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer out.Close()

    gzw := gzip.NewWriter(out)
    defer gzw.Close()

    tw := tar.NewWriter(gzw)
    defer tw.Close()

    return filepath.WalkDir(dir, func(path string, d fs.DirEntry, err error) error {
        if err != nil || d.IsDir() {
            return err
        }
        info, _ := d.Info()
        hdr, _ := tar.FileInfoHeader(info, "")
        relPath, _ := filepath.Rel(dir, path)
        hdr.Name = filepath.ToSlash(relPath)

        tw.WriteHeader(hdr)
        f, _ := os.Open(path)
        defer f.Close()
        io.Copy(tw, f)
        return nil
    })
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| ZIP 的中央目录在哪？其作用是什么？ | 文件末尾；记录所有文件的元数据和偏移量，支持随机访问（不需从头读）|
| 为什么 zip.NewReader 需要 io.ReaderAt 和文件大小？ | 需要从末尾找中央目录；ReaderAt 支持随机跳转到任意偏移 |
| Zip Slip 攻击是什么？如何防御？ | 恶意 ZIP 含 `../` 路径穿越条目；防御：Abs + HasPrefix 检查解压目标在预期目录内 |
| Zip Bomb 是什么？ | 高压缩比文件（如 42KB → 4.5PB）耗尽磁盘/内存；防御：io.LimitReader 限制解压大小 |
| ZIP 和 TAR 应该如何选择？ | ZIP：跨平台、需随机访问单文件；TAR(.tar.gz)：Linux、Docker、流式处理大文件、更高压缩率 |
| zip.Writer.Close 必须调用吗？ | 必须！Close 写入中央目录记录，缺少则 ZIP 文件损坏无法打开 |
