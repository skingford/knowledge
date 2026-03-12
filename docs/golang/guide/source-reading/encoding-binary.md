---
title: encoding/binary 源码精读
description: 精读 encoding/binary 的字节序处理与定长类型编解码，掌握网络协议帧解析、文件格式读写与高性能二进制序列化。
---

# encoding/binary：二进制编解码源码精读

> 核心源码：`src/encoding/binary/binary.go`、`src/encoding/binary/varint.go`

## 包结构图

```
encoding/binary 体系
══════════════════════════════════════════════════════════════════

  字节序（Byte Order）：
  ┌────────────────────────────────────────────────────────┐
  │  大端（Big Endian / Network Order）                    │
  │  int32(0x01020304) → [0x01, 0x02, 0x03, 0x04]         │
  │  高位字节在低地址（网络协议、Java、大多数文件格式）     │
  │                                                        │
  │  小端（Little Endian）                                  │
  │  int32(0x01020304) → [0x04, 0x03, 0x02, 0x01]         │
  │  低位字节在低地址（x86/x64 CPU、Windows、Go 内存布局）  │
  └────────────────────────────────────────────────────────┘

  API 分类：
  ├── binary.BigEndian / binary.LittleEndian
  │    ├── .Uint16(b []byte) uint16       ← 读：4行代码实现
  │    ├── .PutUint16(b []byte, v uint16) ← 写
  │    ├── .Uint32 / .PutUint32
  │    └── .Uint64 / .PutUint64
  │
  ├── binary.Read(r io.Reader, order, data any)  ← 反射版（慢）
  ├── binary.Write(w io.Writer, order, data any) ← 反射版（慢）
  └── binary.Size(data any) int                 ← 计算编码大小

  变长整数（varint）：
  ├── binary.PutVarint / binary.Varint    ← 有符号 zigzag 编码
  └── binary.PutUvarint / binary.Uvarint  ← 无符号 LEB128 编码
       每字节低7位存数据，最高位=1表示后续还有字节

  适用场景：
  ├── 网络协议解析（TCP 帧头、自定义协议）
  ├── 文件格式读写（PNG/BMP/ELF 头部）
  ├── 数据库存储格式（RocksDB key 编码）
  └── 高性能序列化（避免 JSON/gob 反射开销）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/encoding/binary/binary.go（简化）

// BigEndian 实现（无反射，极快）
type bigEndian struct{}

func (bigEndian) Uint32(b []byte) uint32 {
    _ = b[3] // 边界检查（编译器提示）
    return uint32(b[3]) | uint32(b[2])<<8 | uint32(b[1])<<16 | uint32(b[0])<<24
}

func (bigEndian) PutUint32(b []byte, v uint32) {
    _ = b[3]
    b[0] = byte(v >> 24)
    b[1] = byte(v >> 16)
    b[2] = byte(v >> 8)
    b[3] = byte(v)
}

// Varint 编码（Protocol Buffers 格式）
// 每字节7位存数据，最高位1=继续，0=结束
func PutUvarint(buf []byte, x uint64) int {
    i := 0
    for x >= 0x80 {
        buf[i] = byte(x) | 0x80  // 设置最高位=1（后续还有字节）
        x >>= 7
        i++
    }
    buf[i] = byte(x)             // 最后一字节，最高位=0
    return i + 1
}
```

---

## 二、代码示例

### 直接字节序操作（推荐，零反射）

```go
import "encoding/binary"

// 写入：构建 4 字节大端 uint32
func writeUint32BE(w io.Writer, v uint32) error {
    var buf [4]byte
    binary.BigEndian.PutUint32(buf[:], v)
    _, err := w.Write(buf[:])
    return err
}

// 读取：解析 4 字节大端 uint32
func readUint32BE(r io.Reader) (uint32, error) {
    var buf [4]byte
    if _, err := io.ReadFull(r, buf[:]); err != nil {
        return 0, err
    }
    return binary.BigEndian.Uint32(buf[:]), nil
}

// 批量操作：解析固定格式头部
func parseHeader(data []byte) (magic uint32, version uint16, length uint32) {
    magic   = binary.BigEndian.Uint32(data[0:4])
    version = binary.BigEndian.Uint16(data[4:6])
    length  = binary.BigEndian.Uint32(data[6:10])
    return
}
```

### 自定义协议帧解析

```go
// 协议格式：[Magic:4][Version:2][Type:1][Reserved:1][Length:4][Payload:N]
const (
    MagicNumber = 0xDEADBEEF
    HeaderSize  = 12
)

type FrameHeader struct {
    Magic    uint32
    Version  uint16
    Type     uint8
    Reserved uint8
    Length   uint32
}

// 序列化（写）
func (h FrameHeader) Marshal() []byte {
    buf := make([]byte, HeaderSize)
    binary.BigEndian.PutUint32(buf[0:4], h.Magic)
    binary.BigEndian.PutUint16(buf[4:6], h.Version)
    buf[6] = h.Type
    buf[7] = h.Reserved
    binary.BigEndian.PutUint32(buf[8:12], h.Length)
    return buf
}

// 反序列化（读）
func ParseHeader(buf []byte) (FrameHeader, error) {
    if len(buf) < HeaderSize {
        return FrameHeader{}, fmt.Errorf("数据不足 %d 字节", HeaderSize)
    }
    h := FrameHeader{
        Magic:   binary.BigEndian.Uint32(buf[0:4]),
        Version: binary.BigEndian.Uint16(buf[4:6]),
        Type:    buf[6],
        Length:  binary.BigEndian.Uint32(buf[8:12]),
    }
    if h.Magic != MagicNumber {
        return FrameHeader{}, fmt.Errorf("无效 magic: 0x%X", h.Magic)
    }
    return h, nil
}

// 完整帧读取
func ReadFrame(r io.Reader) (header FrameHeader, payload []byte, err error) {
    var hbuf [HeaderSize]byte
    if _, err = io.ReadFull(r, hbuf[:]); err != nil {
        return
    }
    if header, err = ParseHeader(hbuf[:]); err != nil {
        return
    }
    if header.Length > 4*1024*1024 { // 4MB 上限防攻击
        err = fmt.Errorf("payload 过大: %d", header.Length)
        return
    }
    payload = make([]byte, header.Length)
    _, err = io.ReadFull(r, payload)
    return
}
```

### binary.Read/Write（反射版，适合结构体）

```go
// 结构体必须包含固定大小类型（不支持 string/slice）
type BinaryHeader struct {
    Magic   [4]byte
    Width   uint32
    Height  uint32
    Depth   uint16
    Flags   uint16
}

// 读取 BMP/PNG 文件头（大端格式）
func readBinaryHeader(r io.Reader) (*BinaryHeader, error) {
    var h BinaryHeader
    // binary.Read 用反射遍历字段，比手动解析慢但代码简洁
    if err := binary.Read(r, binary.BigEndian, &h); err != nil {
        return nil, err
    }
    return &h, nil
}

func writeBinaryHeader(w io.Writer, h *BinaryHeader) error {
    return binary.Write(w, binary.BigEndian, h)
}

// ⚠️ binary.Read/Write 使用反射，比直接操作字节慢 3-5 倍
// 高性能场景（>1MB/s 或紧循环）应使用直接字节操作
```

### Varint：变长整数（Protocol Buffers 风格）

```go
// 场景：高效存储大量整数（小数字占 1 字节，大数字占多字节）
func encodeVarint(values []int64) []byte {
    buf := make([]byte, 0, len(values)*2)
    tmp := make([]byte, binary.MaxVarintLen64)

    for _, v := range values {
        n := binary.PutVarint(tmp, v) // zigzag 编码（负数也高效）
        buf = append(buf, tmp[:n]...)
    }
    return buf
}

func decodeVarints(data []byte) ([]int64, error) {
    var values []int64
    for len(data) > 0 {
        v, n := binary.Varint(data)
        if n <= 0 {
            return nil, fmt.Errorf("varint 解码失败")
        }
        values = append(values, v)
        data = data[n:]
    }
    return values, nil
}

// varint 大小对比：
// int64(1)     → 1 字节（vs 定长 8 字节）
// int64(127)   → 1 字节
// int64(128)   → 2 字节
// int64(16383) → 2 字节
// int64(-1)    → 10 字节（zigzag 后为 1 → 1 字节）
```

### 检测系统字节序

```go
import (
    "encoding/binary"
    "unsafe"
)

// 运行时检测（用于需要匹配 C 结构体的场景）
func nativeByteOrder() binary.ByteOrder {
    var i int32 = 1
    b := (*[4]byte)(unsafe.Pointer(&i))
    if b[0] == 1 {
        return binary.LittleEndian // x86/x64
    }
    return binary.BigEndian // MIPS/SPARC/网络序
}

// 读取与 C 内存布局相同的数据（cgo 对接）
func readNativeInt32(r io.Reader) (int32, error) {
    var buf [4]byte
    if _, err := io.ReadFull(r, buf[:]); err != nil {
        return 0, err
    }
    return int32(nativeByteOrder().Uint32(buf[:])), nil
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| 大端 vs 小端的区别和应用场景？ | 大端：高位字节在低地址，用于网络协议（TCP/IP）、文件格式（PNG/BMP）；小端：x86/x64 CPU 原生，Windows 文件格式 |
| `binary.Read` 和直接字节操作的性能差距？ | `binary.Read` 用反射，比直接操作慢 3-5 倍；高性能协议解析应用 `BigEndian.Uint32()` 等直接操作 |
| Varint 相比定长整数的优势？ | 小数字（0-127）只占 1 字节；适合存储大量小整数（如 protobuf 字段编号、计数器）；最坏情况 int64 占 10 字节 |
| `io.ReadFull` 在协议解析中为什么必要？ | 普通 `Read` 可能返回少于请求的字节数；`ReadFull` 循环读取直到填满 buffer 或遇到 EOF/错误 |
| `binary.Size` 的限制？ | 只支持固定大小类型（bool/int*/uint*/float*/复数/数组）；string/slice/map 不支持，返回 -1 |
| 如何防止协议帧解析中的内存炸弹？ | 读取 Length 字段后立即检查上限（如 4MB），拒绝超大 payload；否则攻击者可发送 `Length=MaxUint32` 耗尽内存 |
