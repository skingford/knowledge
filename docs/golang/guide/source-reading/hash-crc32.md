---
title: hash/crc32 源码精读
description: 精读 hash/crc32 的校验和实现，掌握 IEEE/Castagnoli 多项式、查表法加速、硬件指令优化与数据完整性校验实践。
---

# hash/crc32：循环冗余校验源码精读

> 核心源码：`src/hash/crc32/crc32.go`、`src/hash/crc32/crc32_amd64.go`
>
> 图例参考：
> - `GoAdvancedTopicDiagram`：`crc32-update-flow`
> - `GoNetworkDiagram`：`zip-central-directory`

## 包结构图

```
hash/crc32 体系
══════════════════════════════════════════════════════════════════

  多项式（预定义）：
  ├── IEEE      = 0xedb88320  ← 最常用（ZIP/gzip/Ethernet）
  ├── Castagnoli = 0x82f63b78 ← 更好错误检测（iSCSI/ext4/btrfs）
  └── Koopman   = 0xeb31d82e  ← 较少用

  Table（多项式对应的查表）：
  ├── IEEETable      ← IEEE 多项式的查表（包级预计算）
  └── MakeTable(poly) ← 自定义多项式的查表

  核心算法（slicing-by-8 / 硬件加速）：
  ┌────────────────────────────────────────────────┐
  │  软件实现：slicing-by-8                         │
  │  一次处理 8 字节，使用 8 个 256 项查表并行       │
  │  吞吐量：≈ 2 GB/s（纯软件）                    │
  │                                                │
  │  硬件实现（x86 SSE4.2 / ARM64）                 │
  │  CLMUL 指令（无进位乘法）                        │
  │  吞吐量：≈ 10+ GB/s（CPU 级别）                 │
  └────────────────────────────────────────────────┘

  hash.Hash32 接口实现：
  ├── Write(p []byte) (int, error)  ← 流式写入数据
  ├── Sum32() uint32                ← 返回当前校验和
  ├── Sum(b []byte) []byte          ← 追加到 b
  ├── Reset()                       ← 重置状态
  └── Size() int                    ← 4（字节）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// src/hash/crc32/crc32.go（简化）
type digest struct {
    crc uint32    // 当前累积校验和
    tab *Table    // 多项式查表
}

// 软件查表实现（IEEE 多项式）
func updateSlicingBy8(crc uint32, tab *slicing8Table, p []byte) uint32 {
    // 每次处理 8 字节，使用 8 个独立查表并行计算
    for len(p) >= 8 {
        crc ^= uint32(p[0]) | uint32(p[1])<<8 | uint32(p[2])<<16 | uint32(p[3])<<24
        // 8 次查表并行
        crc = tab[7][crc&0xff] ^ tab[6][(crc>>8)&0xff] ^
              tab[5][(crc>>16)&0xff] ^ tab[4][crc>>24] ^
              tab[3][p[4]] ^ tab[2][p[5]] ^ tab[1][p[6]] ^ tab[0][p[7]]
        p = p[8:]
    }
    // 处理剩余字节
    for _, v := range p {
        crc = tab[0][0][byte(crc)^v] ^ (crc >> 8)
    }
    return crc
}

// 硬件加速（x86 SSE4.2，Go 汇编实现）
// 使用 PCMPESTRI 或 CLMUL 指令
// func iEEEUpdate(crc uint32, p []byte) uint32  ← 汇编
```
:::

<GoAdvancedTopicDiagram kind="crc32-update-flow" />

---

## 二、代码示例

### 基础校验和计算

::: details 点击展开代码：基础校验和计算
```go
import (
    "hash/crc32"
    "fmt"
)

func basics() {
    data := []byte("Hello, World!")

    // 方式一：直接计算（最简单）
    checksum := crc32.ChecksumIEEE(data)
    fmt.Printf("CRC32-IEEE: %08X\n", checksum) // CRC32-IEEE: EC4AC3D0

    // 方式二：指定多项式
    castagnoliTable := crc32.MakeTable(crc32.Castagnoli)
    checksum2 := crc32.Checksum(data, castagnoliTable)
    fmt.Printf("CRC32-C:    %08X\n", checksum2)

    // 方式三：流式（hash.Hash32 接口）
    h := crc32.NewIEEE()
    h.Write([]byte("Hello, "))
    h.Write([]byte("World!"))
    fmt.Printf("Stream CRC: %08X\n", h.Sum32())
}
```
:::

### 文件完整性校验

::: details 点击展开代码：文件完整性校验
```go
// 计算文件 CRC32，用于传输完整性验证
func fileCRC32(path string) (uint32, error) {
    f, err := os.Open(path)
    if err != nil {
        return 0, err
    }
    defer f.Close()

    h := crc32.NewIEEE()
    if _, err := io.Copy(h, f); err != nil {
        return 0, err
    }
    return h.Sum32(), nil
}

// 校验文件传输完整性
func verifyTransfer(srcPath, dstPath string) error {
    srcCRC, err := fileCRC32(srcPath)
    if err != nil {
        return fmt.Errorf("src: %w", err)
    }

    dstCRC, err := fileCRC32(dstPath)
    if err != nil {
        return fmt.Errorf("dst: %w", err)
    }

    if srcCRC != dstCRC {
        return fmt.Errorf("CRC32 mismatch: src=%08X dst=%08X", srcCRC, dstCRC)
    }
    return nil
}
```
:::

### 分片传输：增量 CRC 更新

::: details 点击展开代码：分片传输：增量 CRC 更新
```go
// 大文件分块传输，逐块更新 CRC（避免全量重新计算）
type ChunkedTransfer struct {
    crc   uint32
    table *crc32.Table
    total int64
}

func NewChunkedTransfer() *ChunkedTransfer {
    return &ChunkedTransfer{
        // Castagnoli（CRC-32C）用于现代存储系统
        table: crc32.MakeTable(crc32.Castagnoli),
        crc:   0,
    }
}

func (t *ChunkedTransfer) Write(chunk []byte) {
    // Update 接受前一次 CRC，实现增量计算
    t.crc = crc32.Update(t.crc, t.table, chunk)
    t.total += int64(len(chunk))
}

func (t *ChunkedTransfer) Checksum() uint32 {
    return t.crc
}

// 使用
func transferLargeFile(src io.Reader, dst io.Writer) (uint32, error) {
    transfer := NewChunkedTransfer()
    buf := make([]byte, 64*1024) // 64KB chunks

    for {
        n, err := src.Read(buf)
        if n > 0 {
            chunk := buf[:n]
            transfer.Write(chunk)
            dst.Write(chunk)
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            return 0, err
        }
    }
    return transfer.Checksum(), nil
}
```
:::

### 哈希分片（一致性哈希 / 分库分表路由）

::: details 点击展开代码：哈希分片（一致性哈希 / 分库分表路由）
```go
// 用 CRC32 做快速哈希路由（比 MD5/SHA1 快 10 倍以上）
type ShardRouter struct {
    shards int
    table  *crc32.Table
}

func NewShardRouter(shards int) *ShardRouter {
    return &ShardRouter{
        shards: shards,
        table:  crc32.MakeTable(crc32.Castagnoli), // Castagnoli 更均匀
    }
}

func (r *ShardRouter) Shard(key string) int {
    checksum := crc32.Checksum([]byte(key), r.table)
    return int(checksum) % r.shards
}

// 使用
router := NewShardRouter(16)
fmt.Println(router.Shard("user:12345")) // 0-15 的分片编号
```
:::

### CRC32 vs 其他哈希性能对比

::: details 点击展开代码：CRC32 vs 其他哈希性能对比
```go
func BenchmarkHashFunctions(b *testing.B) {
    data := make([]byte, 1024*1024) // 1MB
    rand.Read(data)

    b.Run("CRC32-IEEE", func(b *testing.B) {
        b.SetBytes(int64(len(data)))
        for i := 0; i < b.N; i++ {
            crc32.ChecksumIEEE(data)
        }
    })

    b.Run("CRC32-Castagnoli", func(b *testing.B) {
        b.SetBytes(int64(len(data)))
        tab := crc32.MakeTable(crc32.Castagnoli)
        for i := 0; i < b.N; i++ {
            crc32.Checksum(data, tab)
        }
    })

    b.Run("SHA256", func(b *testing.B) {
        b.SetBytes(int64(len(data)))
        for i := 0; i < b.N; i++ {
            sha256.Sum256(data)
        }
    })

    // 典型结果（x86_64 with SSE4.2）：
    // CRC32-IEEE:       ~10 GB/s （硬件加速）
    // CRC32-Castagnoli: ~12 GB/s （SSE4.2 原生支持）
    // SHA256:           ~0.5 GB/s（相对较慢）
}
```
:::

### ZIP 文件中的 CRC32 验证

<GoNetworkDiagram kind="zip-central-directory" />

::: details 点击展开代码：ZIP 文件中的 CRC32 验证
```go
// archive/zip 包内部使用 CRC32-IEEE 验证文件完整性
import "archive/zip"

func verifyZipIntegrity(zipPath string) error {
    r, err := zip.OpenReader(zipPath)
    if err != nil {
        return err
    }
    defer r.Close()

    for _, f := range r.File {
        rc, err := f.Open()
        if err != nil {
            return fmt.Errorf("open %s: %w", f.Name, err)
        }

        // 读取时 zip 包自动验证 CRC32
        h := crc32.NewIEEE()
        if _, err := io.Copy(h, rc); err != nil {
            rc.Close()
            return fmt.Errorf("read %s: %w", f.Name, err)
        }
        rc.Close()

        if got, want := h.Sum32(), f.CRC32; got != want {
            return fmt.Errorf("%s: CRC mismatch got=%08X want=%08X",
                f.Name, got, want)
        }
    }
    return nil
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| CRC32 为什么比 MD5/SHA256 快得多？ | CRC 是线性反馈移位寄存器（查表法），无密码学混淆；现代 CPU 有 SSE4.2 的 CRC32 指令，硬件原生支持 |
| IEEE 和 Castagnoli 多项式的选择？ | 传统场景（ZIP/gzip/Ethernet）用 IEEE；现代存储（iSCSI/ext4/btrfs/NVMe）用 Castagnoli（错误检测更均匀，x86 SSE4.2 硬件支持）|
| CRC32 可以用于安全场景吗？ | 不能。CRC32 不抗碰撞攻击（攻击者可构造不同内容但 CRC 相同的数据）；安全场景用 SHA256 + HMAC |
| `crc32.Update` 和重新计算的区别？ | Update 接受旧 CRC 值继续计算（增量更新）；适合流式处理大文件，无需全量重新 `io.Copy` |
| Go 如何实现 CRC32 硬件加速？ | Go 汇编（`_amd64.s`）中调用 SSE4.2 的 `PCMPESTRI`/`CRC32` 指令；runtime 在初始化时探测 CPU 能力并选择实现 |
| slicing-by-8 算法原理？ | 将输入按 8 字节分组，用 8 个独立查表（每个 256 项）并行计算，然后 XOR 合并结果；比逐字节查表快约 4-8 倍 |
