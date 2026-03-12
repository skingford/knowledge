---
title: encoding/binary 源码精读
description: 精读 encoding/binary 包的字节序处理、定长编解码原理与网络协议手工实现，理解 Go 二进制 I/O 的核心机制。
---

# encoding/binary：二进制编解码源码精读

> 核心源码：`src/encoding/binary/binary.go`、`src/encoding/binary/varint.go`

## 包结构图

```
encoding/binary 包全景
══════════════════════════════════════════════════════════════════

  字节序（Byte Order）
  ├── binary.BigEndian       ← 大端（网络字节序，Motorola）
  ├── binary.LittleEndian    ← 小端（x86/ARM，Intel）
  └── binary.NativeEndian    ← 本机字节序（Go 1.21+）

  定长编解码（固定大小类型）
  ├── binary.Read(r, order, data)   ← io.Reader → struct/基础类型
  ├── binary.Write(w, order, data)  ← struct/基础类型 → io.Writer
  ├── binary.Size(v)                ← 计算编码后字节数（无分配）
  └── binary.Append(dst, order, v)  ← 追加到 []byte（Go 1.23+）

  变长整数（Varint，Protocol Buffers 风格）
  ├── binary.PutVarint(buf, int64)  ← 有符号变长编码（ZigZag）
  ├── binary.PutUvarint(buf, uint64)← 无符号变长编码
  ├── binary.Varint(buf) int64      ← 解码有符号 varint
  ├── binary.Uvarint(buf) uint64    ← 解码无符号 uvarint
  ├── binary.AppendVarint           ← Go 1.19+
  └── binary.ReadVarint(r)          ← 从 io.Reader 读 varint

══════════════════════════════════════════════════════════════════
```

---

## 一、字节序原理

```
大端 vs 小端存储 uint32(0x01020304)
══════════════════════════════════════════════════════════════════

  内存地址    低 ←──────────────────────→ 高

  大端（BigEndian）：
  ┌────────┬────────┬────────┬────────┐
  │  0x01  │  0x02  │  0x03  │  0x04  │
  └────────┴────────┴────────┴────────┘
  高位字节在低地址（符合人类阅读习惯）
  → 用于：网络协议（TCP/IP）、Java、PowerPC

  小端（LittleEndian）：
  ┌────────┬────────┬────────┬────────┐
  │  0x04  │  0x03  │  0x02  │  0x01  │
  └────────┴────────┴────────┴────────┘
  低位字节在低地址（与 CPU 运算方向一致）
  → 用于：x86/x86-64/ARM（默认）、Go runtime

  转换：binary.BigEndian.Uint32(b) 从 4 字节读大端 uint32
        = uint32(b[0])<<24 | uint32(b[1])<<16 | ...

══════════════════════════════════════════════════════════════════
```

---

## 二、Read/Write 实现原理

```go
// src/encoding/binary/binary.go（简化）
func Read(r io.Reader, order ByteOrder, data any) error {
    // 快速路径：基础类型（uint8/uint16/...）直接读
    if n := intDataSize(data); n != 0 {
        bs := make([]byte, n)
        if _, err := io.ReadFull(r, bs); err != nil {
            return err
        }
        // 根据 data 类型和 order 解码
        switch v := data.(type) {
        case *uint16: *v = order.Uint16(bs)
        case *uint32: *v = order.Uint32(bs)
        // ...
        }
        return nil
    }
    // 慢速路径：struct → 反射递归处理每个字段
    return read(r, order, reflect.ValueOf(data))
}
```

```
binary.Read 的两条路径
══════════════════════════════════════════════════════════════════

  基础类型（uint8/16/32/64/int8/16/32/64/float32/64）：
  ├── intDataSize() 计算大小
  ├── io.ReadFull 读字节
  └── ByteOrder.Uint32(bs) 直接位运算（极快）

  struct / slice：
  ├── reflect.ValueOf(data) 获取反射值
  ├── 遍历每个字段（递归）
  ├── 每个字段调用基础类型路径
  └── ⚠️ 有反射开销，且字段必须是固定大小类型
        （string/slice 等不定长类型会报错）

  性能建议：
  ├── 高频路径：手动位操作（order.Uint32/PutUint32）
  └── 简单场景：binary.Read/Write 足够，反射开销通常可接受

══════════════════════════════════════════════════════════════════
```

---

## 三、Varint 变长编码

```
Uvarint 编码规则（Protocol Buffers 格式）
══════════════════════════════════════════════════════════════════

  每个字节：
  ├── 高位 bit = 1 → 后面还有字节
  └── 高位 bit = 0 → 最后一个字节
  低 7 位存储数据（小端顺序）

  示例：
  300 = 0b100101100
  分组：0b10 | 0b0101100
  编码：[10101100 00000010]（0xAC 0x02）

  数值       字节数    编码
  ─────────────────────────────────────
  [0, 127]      1     原值
  [128, 16383]  2     两字节
  uint64 最大   10    10字节

  有符号 Varint（ZigZag 编码）：
  0  → 0,  -1 → 1,  1 → 2,  -2 → 3 ...
  n → n<<1（n≥0），n → (-n)<<1-1（n<0）
  → 小绝对值的负数也能用少字节表示

══════════════════════════════════════════════════════════════════
```

---

## 四、代码示例

### 手写网络协议帧（定长头部）

```go
// 协议：4字节魔数 + 2字节版本 + 4字节长度 + N字节数据
const magic = uint32(0xDEADBEEF)

type FrameHeader struct {
    Magic   uint32
    Version uint16
    Length  uint32
}

func writeFrame(w io.Writer, version uint16, payload []byte) error {
    hdr := FrameHeader{
        Magic:   magic,
        Version: version,
        Length:  uint32(len(payload)),
    }
    if err := binary.Write(w, binary.BigEndian, hdr); err != nil {
        return err
    }
    _, err := w.Write(payload)
    return err
}

func readFrame(r io.Reader) (uint16, []byte, error) {
    var hdr FrameHeader
    if err := binary.Read(r, binary.BigEndian, &hdr); err != nil {
        return 0, nil, err
    }
    if hdr.Magic != magic {
        return 0, nil, fmt.Errorf("invalid magic: %08X", hdr.Magic)
    }
    payload := make([]byte, hdr.Length)
    if _, err := io.ReadFull(r, payload); err != nil {
        return 0, nil, err
    }
    return hdr.Version, payload, nil
}
```

### 手动位操作（高性能，避免反射）

```go
// 直接使用 ByteOrder 方法，零反射
func encodeUint32(b []byte, v uint32) {
    binary.BigEndian.PutUint32(b, v)
    // 等价于：b[0]=byte(v>>24); b[1]=byte(v>>16); b[2]=byte(v>>8); b[3]=byte(v)
}

func decodeUint32(b []byte) uint32 {
    return binary.BigEndian.Uint32(b)
}

// 批量编码（零分配，使用 binary.Append）
func buildPacket(cmd uint16, seq uint32, data []byte) []byte {
    buf := make([]byte, 0, 6+len(data))
    buf = binary.BigEndian.AppendUint16(buf, cmd)
    buf = binary.BigEndian.AppendUint32(buf, seq)
    buf = append(buf, data...)
    return buf
}
```

### Varint 编码（消息长度前缀）

```go
// 变长长度前缀协议（比固定 4 字节更节省空间）
func writeVarMessage(w io.Writer, data []byte) error {
    var buf [binary.MaxVarintLen64]byte
    n := binary.PutUvarint(buf[:], uint64(len(data)))
    if _, err := w.Write(buf[:n]); err != nil {
        return err
    }
    _, err := w.Write(data)
    return err
}

func readVarMessage(r io.ByteReader) ([]byte, error) {
    length, err := binary.ReadUvarint(r)
    if err != nil {
        return nil, err
    }
    if length > 64*1024*1024 { // 防止超大消息
        return nil, fmt.Errorf("message too large: %d bytes", length)
    }
    data := make([]byte, length)
    // io.ReadFull 需要 io.Reader，需包装 r
    return data, err
}
```

### 读取 ELF 文件头（真实应用）

```go
// ELF 文件魔数检测（前 4 字节）
func isELF(r io.Reader) (bool, error) {
    var magic [4]byte
    if err := binary.Read(r, binary.LittleEndian, &magic); err != nil {
        return false, err
    }
    return magic[0] == 0x7f && magic[1] == 'E' &&
        magic[2] == 'L' && magic[3] == 'F', nil
}
```

### binary.Size 预计算大小

```go
type Packet struct {
    Type    uint8
    Seq     uint32
    Payload [256]byte
}

// 无需分配即可知道编码大小
size := binary.Size(Packet{}) // 261 = 1 + 4 + 256
buf := make([]byte, size)
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| 大端和小端的区别？ | 大端高位字节在低地址（网络协议标准）；小端低位字节在低地址（x86/ARM 默认）|
| binary.Read 对 struct 有什么限制？ | 所有字段必须是固定大小类型（不支持 string/slice/interface/map）|
| Varint 和固定长度编码怎么选？ | 数值分布偏小时用 Varint（节省空间）；固定大小时用定长（解析更简单）|
| NativeEndian 什么时候用？ | 与 C 代码共享内存结构体（mmap/cgo）时，确保字节序一致 |
| binary.Append 和 binary.Write 的区别？ | Append 追加到 []byte（无 I/O，Go 1.23+）；Write 写入 io.Writer |
| ZigZag 编码解决什么问题？ | 有符号负数二进制补码高位都是 1，Varint 编码需要多字节；ZigZag 映射后小负数也用少字节 |
