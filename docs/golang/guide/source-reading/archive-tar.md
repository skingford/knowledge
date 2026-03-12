---
title: archive/tar 源码精读
description: 精读 archive/tar 的 TAR 归档实现，掌握 Header 结构、流式读写、目录打包与 Docker 镜像层构建原理。
---

# archive/tar：TAR 归档源码精读

> 核心源码：`src/archive/tar/reader.go`、`src/archive/tar/writer.go`、`src/archive/tar/common.go`

## 包结构图

```
archive/tar 体系
══════════════════════════════════════════════════════════════════

  TAR 文件格式（POSIX ustar）：
  ┌──────────────────────────────────────────────────────┐
  │  [ Header Block (512字节) ][ 文件内容 (N×512字节) ]  │
  │  [ Header Block (512字节) ][ 文件内容 (N×512字节) ]  │
  │  ...                                                 │
  │  [ 两个全零 512字节块 ]  ← 结束标志                  │
  └──────────────────────────────────────────────────────┘

  Header Block 关键字段（512 字节，固定位置）：
  ├── Name[100]      ← 文件名（GNU tar 扩展支持更长名）
  ├── Mode[8]        ← 文件权限（八进制字符串）
  ├── Uid/Gid[8]     ← 用户/组 ID
  ├── Size[12]       ← 文件大小（八进制）
  ├── Mtime[12]      ← 修改时间（Unix 时间戳，八进制）
  ├── Typeflag[1]    ← 文件类型
  │    '0'/'\\0' 普通文件，'2' 符号链接，'5' 目录
  │    '3' 字符设备，'4' 块设备，'6' FIFO
  └── Linkname[100]  ← 符号链接目标

  tar.Header 结构体（Go 表示）：
  ├── Typeflag byte
  ├── Name, Linkname string
  ├── Size int64
  ├── Mode int64       ← fs.FileMode
  ├── Uid, Gid int
  ├── Uname, Gname string
  ├── ModTime time.Time
  ├── AccessTime, ChangeTime time.Time
  └── Xattrs map[string]string  ← 扩展属性（PAX 格式）

  核心 API：
  ├── tar.NewReader(r io.Reader) *Reader
  │   └── NextHeader() (*Header, error) + io.Reader（读取内容）
  └── tar.NewWriter(w io.Writer) *Writer
      ├── WriteHeader(hdr *Header) error
      ├── Write(b []byte) (int, error)  ← 写文件内容
      └── Close() error

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/archive/tar/writer.go（简化）
type Writer struct {
    w    io.Writer
    pad  int64        // 当前文件还需填充的字节数（对齐到512字节块）
    curr fileWriter   // 当前文件写入器
    hdr  Header       // 当前 Header 缓存
    err  error
}

// WriteHeader：将 Header 序列化为 512 字节块写入
func (tw *Writer) WriteHeader(hdr *Header) error {
    // 1. 填充上一个文件（补全到 512 字节边界）
    // 2. 格式化 hdr 字段为八进制字符串
    // 3. 写入 512 字节 header block
    // 4. 设置 tw.curr 为文件写入器（限制写入 Size 字节）
}

// src/archive/tar/reader.go
// Next：跳过当前文件剩余内容，读取下一个 Header
func (tr *Reader) Next() (*Header, error) {
    // 1. 跳过未读完的文件内容 + 填充块
    // 2. 读取 512 字节 header block
    // 3. 检查是否为结束块（全零）
    // 4. 解析字段（八进制字符串 → 整数/时间）
    // 5. 处理 GNU tar/PAX 扩展头
    return hdr, nil
}
```

---

## 二、代码示例

### 创建 TAR 归档

```go
import (
    "archive/tar"
    "compress/gzip"
    "os"
    "io"
)

// 创建 .tar.gz 归档
func createTarGz(output string, files []string) error {
    f, err := os.Create(output)
    if err != nil {
        return err
    }
    defer f.Close()

    // tar.gz = gzip 压缩 + tar 格式
    gw := gzip.NewWriter(f)
    defer gw.Close()

    tw := tar.NewWriter(gw)
    defer tw.Close()

    for _, filePath := range files {
        if err := addFileToTar(tw, filePath); err != nil {
            return err
        }
    }
    return nil
}

func addFileToTar(tw *tar.Writer, filePath string) error {
    info, err := os.Stat(filePath)
    if err != nil {
        return err
    }

    // 从 os.FileInfo 生成 Header（自动填充 Size/Mode/ModTime）
    hdr, err := tar.FileInfoHeader(info, "")
    if err != nil {
        return err
    }
    hdr.Name = filePath // 保留相对路径

    if err := tw.WriteHeader(hdr); err != nil {
        return err
    }

    // 目录不需要写内容
    if info.IsDir() {
        return nil
    }

    f, err := os.Open(filePath)
    if err != nil {
        return err
    }
    defer f.Close()

    _, err = io.Copy(tw, f)
    return err
}
```

### 打包整个目录（递归）

```go
func tarDirectory(srcDir, outputPath string) error {
    f, _ := os.Create(outputPath)
    defer f.Close()

    gw := gzip.NewWriter(f)
    defer gw.Close()

    tw := tar.NewWriter(gw)
    defer tw.Close()

    return filepath.WalkDir(srcDir, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }

        info, err := d.Info()
        if err != nil {
            return err
        }

        // 处理符号链接
        var linkTarget string
        if info.Mode()&os.ModeSymlink != 0 {
            linkTarget, err = os.Readlink(path)
            if err != nil {
                return err
            }
        }

        hdr, err := tar.FileInfoHeader(info, linkTarget)
        if err != nil {
            return err
        }

        // 使用相对路径（去掉 srcDir 前缀）
        relPath, _ := filepath.Rel(srcDir, path)
        hdr.Name = filepath.ToSlash(relPath) // 统一用 / 分隔符

        if err := tw.WriteHeader(hdr); err != nil {
            return err
        }

        // 只有普通文件需要写内容
        if !d.IsDir() && info.Mode()&os.ModeSymlink == 0 {
            f, err := os.Open(path)
            if err != nil {
                return err
            }
            defer f.Close()
            io.Copy(tw, f)
        }
        return nil
    })
}
```

### 解压 TAR 归档（安全版）

```go
// 安全解压：防止 Zip Slip（路径穿越）攻击
func extractTarGz(src, dstDir string) error {
    f, err := os.Open(src)
    if err != nil {
        return err
    }
    defer f.Close()

    gr, err := gzip.NewReader(f)
    if err != nil {
        return err
    }
    defer gr.Close()

    tr := tar.NewReader(gr)

    for {
        hdr, err := tr.Next()
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }

        // ⚠️ 安全检查：防止路径穿越
        target := filepath.Join(dstDir, hdr.Name)
        if !strings.HasPrefix(filepath.Clean(target)+string(os.PathSeparator),
            filepath.Clean(dstDir)+string(os.PathSeparator)) {
            return fmt.Errorf("非法路径: %s", hdr.Name)
        }

        switch hdr.Typeflag {
        case tar.TypeDir:
            os.MkdirAll(target, hdr.FileInfo().Mode())

        case tar.TypeReg:
            os.MkdirAll(filepath.Dir(target), 0755)
            f, err := os.OpenFile(target, os.O_CREATE|os.O_WRONLY|os.O_TRUNC,
                hdr.FileInfo().Mode())
            if err != nil {
                return err
            }
            // 限制单文件大小（防止解压炸弹）
            if _, err := io.Copy(f, io.LimitReader(tr, 512<<20)); err != nil {
                f.Close()
                return err
            }
            f.Close()

        case tar.TypeSymlink:
            os.Symlink(hdr.Linkname, target)
        }
    }
    return nil
}
```

### Docker 镜像层（in-memory tar）

```go
// Docker 镜像层本质上是 tar 流，可以在内存中构建
func buildDockerLayer() ([]byte, error) {
    var buf bytes.Buffer
    tw := tar.NewWriter(&buf)

    // 添加配置文件
    config := []byte(`{"version": "1.0"}`)
    tw.WriteHeader(&tar.Header{
        Name:    "etc/app/config.json",
        Mode:    0644,
        Size:    int64(len(config)),
        ModTime: time.Now(),
    })
    tw.Write(config)

    // 添加二进制文件
    binary, _ := os.ReadFile("/usr/local/bin/myapp")
    tw.WriteHeader(&tar.Header{
        Name:    "usr/local/bin/myapp",
        Mode:    0755,
        Size:    int64(len(binary)),
        ModTime: time.Now(),
    })
    tw.Write(binary)

    tw.Close()
    return buf.Bytes(), nil
}
```

### 流式处理大型 TAR（不解压到磁盘）

```go
// 扫描 tar 文件，仅读取特定文件内容（不全量解压）
func extractSpecificFile(tarPath, targetName string) ([]byte, error) {
    f, _ := os.Open(tarPath)
    defer f.Close()

    tr := tar.NewReader(f)
    for {
        hdr, err := tr.Next()
        if err == io.EOF {
            return nil, fmt.Errorf("文件 %s 不存在", targetName)
        }
        if err != nil {
            return nil, err
        }

        if hdr.Name == targetName {
            // 找到目标文件，只读取这一个
            return io.ReadAll(io.LimitReader(tr, 100<<20)) // 最大 100MB
        }
        // 跳过其他文件（Next() 会自动跳过）
    }
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| TAR 格式的基本单位是什么？ | 512 字节 Block；Header 占 1 个 block（512B），文件内容向上对齐到 512B 边界；结束标志是 2 个全零 block |
| `tar.FileInfoHeader` 的 `link` 参数何时有值？ | 仅当 `os.FileInfo.Mode()` 包含 `os.ModeSymlink` 时（符号链接），此时 link 应传入 `os.Readlink()` 的结果 |
| 如何防止 TAR 解压时的路径穿越攻击？ | 用 `filepath.Join(dstDir, hdr.Name)` 生成目标路径，再用 `filepath.Clean` + `HasPrefix` 验证目标在 dstDir 内 |
| `.tar.gz` 和 `.tar.bz2` 的关系？ | TAR 只是归档（打包），不压缩；gzip/bzip2/xz 是压缩层；`.tar.gz` = `io.Reader` 链：`os.File → gzip.Reader → tar.Reader` |
| Docker 镜像层为什么用 TAR？ | TAR 格式简单、流式、跨平台；每层是一个 TAR 流，包含该层相对文件系统根的所有变更（新增/修改）|
| `tar.Writer` 的 `Close()` 不调用会怎样？ | 结束标志（两个全零 block）不写入，解压工具可能报错或忽略最后一个文件；应始终 `defer tw.Close()` |
