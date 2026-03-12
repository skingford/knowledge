---
title: encoding/gob 源码精读
description: 精读 encoding/gob 的 Go 原生二进制序列化机制，理解自描述编码、类型注册与跨版本兼容的设计哲学。
---

# encoding/gob：Go 原生序列化源码精读

> 核心源码：`src/encoding/gob/encode.go`、`src/encoding/gob/decode.go`、`src/encoding/gob/type.go`

## 包结构图

```
encoding/gob 核心设计
══════════════════════════════════════════════════════════════════

  核心组件：
  ├── gob.NewEncoder(w) → *Encoder   ← 编码器（写入流）
  ├── gob.NewDecoder(r) → *Decoder   ← 解码器（读取流）
  ├── gob.Register(v)               ← 注册接口实现类型
  └── gob.RegisterName(name, v)     ← 带名注册

  编码特性：
  ├── 自描述：编码中嵌入类型描述（首次传输时）
  ├── 流式：一次 Encoder/Decoder 可传输多个值
  ├── 字段匹配：按名称匹配（不是位置），缺失字段=零值
  ├── 向前兼容：接收方字段多于发送方 → 零值填充
  └── 向后兼容：接收方字段少于发送方 → 忽略多余字段

  vs JSON/XML/protobuf 对比：
  ┌──────────────┬────────┬────────┬──────────┬──────────┐
  │ 特性         │ gob    │ JSON   │ XML      │ protobuf │
  ├──────────────┼────────┼────────┼──────────┼──────────┤
  │ 格式         │ 二进制 │ 文本   │ 文本     │ 二进制   │
  │ 跨语言       │ ✗ Go only│ ✓    │ ✓        │ ✓        │
  │ 自描述       │ ✓      │ ✓      │ ✓        │ ✗（需.proto）│
  │ 速度         │ 快     │ 中等   │ 慢       │ 最快     │
  │ 接口类型支持 │ ✓(注册)│ 有限   │ 有限     │ ✗        │
  │ 适合场景     │ Go内部 │跨语言API│文档/配置│大规模RPC │
  └──────────────┴────────┴────────┴──────────┴──────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、编码机制

```go
// src/encoding/gob/type.go（简化）
// gob 使用"wireType"描述结构体布局，首次发送时随数据一起传输

// 类型传输流程：
// 1. Encoder 发送 typeId → wireType（结构描述）
// 2. 接收方 Decoder 建立 typeId → 本地类型的映射
// 3. 后续数据按 typeId 匹配字段名称解码

// 字段编码：只编码非零值字段（稀疏编码）
// → 减少传输数据量
// → 与 JSON omitempty 类似，但对所有字段自动生效
```

---

## 二、代码示例

### 基础编解码

```go
import (
    "bytes"
    "encoding/gob"
    "fmt"
)

type Point struct {
    X, Y int
}

type Circle struct {
    Center Point
    Radius float64
    Label  string
}

func main() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)
    dec := gob.NewDecoder(&buf)

    // 编码
    c := Circle{Center: Point{3, 4}, Radius: 5.0, Label: "origin"}
    if err := enc.Encode(c); err != nil {
        panic(err)
    }
    fmt.Printf("编码后字节数: %d\n", buf.Len())

    // 解码
    var c2 Circle
    if err := dec.Decode(&c2); err != nil {
        panic(err)
    }
    fmt.Printf("解码结果: %+v\n", c2)
}
```

### 流式传输（多值序列）

```go
// gob 设计为流式——一个 Encoder 发送多个值，一个 Decoder 按序接收
func streamExample() {
    var buf bytes.Buffer
    enc := gob.NewEncoder(&buf)

    // 连续编码多个值（同类型）
    records := []Point{{1, 2}, {3, 4}, {5, 6}}
    for _, p := range records {
        enc.Encode(p) // 每次 Encode 追加到流
    }

    // 解码端按序读取
    dec := gob.NewDecoder(&buf)
    for {
        var p Point
        err := dec.Decode(&p)
        if err != nil {
            break // io.EOF
        }
        fmt.Println(p)
    }
}
```

### 接口类型（需要 Register）

```go
type Shape interface {
    Area() float64
}

type Rect struct{ W, H float64 }
type Tri  struct{ Base, Height float64 }

func (r Rect) Area() float64 { return r.W * r.H }
func (t Tri)  Area() float64 { return 0.5 * t.Base * t.Height }

func init() {
    // ⚠️ 必须注册接口的所有实现类型
    // gob 需要知道具体类型才能正确编解码接口值
    gob.Register(Rect{})
    gob.Register(Tri{})
}

type Canvas struct {
    Shapes []Shape // 接口切片
}

func encodeCanvas() []byte {
    canvas := Canvas{
        Shapes: []Shape{
            Rect{W: 3, H: 4},
            Tri{Base: 6, Height: 8},
        },
    }
    var buf bytes.Buffer
    gob.NewEncoder(&buf).Encode(canvas)
    return buf.Bytes()
}

func decodeCanvas(data []byte) Canvas {
    var canvas Canvas
    gob.NewDecoder(bytes.NewReader(data)).Decode(&canvas)
    return canvas
}
```

### 进程间通信（net.Conn + gob）

```go
// Server：接收并处理消息
func server(conn net.Conn) {
    dec := gob.NewDecoder(conn)
    enc := gob.NewEncoder(conn)
    defer conn.Close()

    for {
        var req Request
        if err := dec.Decode(&req); err != nil {
            return
        }
        resp := handleRequest(req)
        if err := enc.Encode(resp); err != nil {
            return
        }
    }
}

// Client：发送请求并接收响应
func client(conn net.Conn) {
    enc := gob.NewEncoder(conn)
    dec := gob.NewDecoder(conn)

    req := Request{Method: "GET", Path: "/api/users"}
    enc.Encode(req)

    var resp Response
    dec.Decode(&resp)
    fmt.Println(resp.Status, resp.Body)
}
```

### 向前兼容演示（版本升级）

```go
// v1 发送的数据
type UserV1 struct {
    Name string
    Age  int
}

// v2 新增字段（向后兼容）
type UserV2 struct {
    Name    string
    Age     int
    Email   string // 新字段：接收 v1 数据时填零值 ""
    Premium bool   // 新字段：填零值 false
}

func compatExample() {
    var buf bytes.Buffer
    // 发送 v1 格式
    gob.NewEncoder(&buf).Encode(UserV1{Name: "Alice", Age: 30})

    // 用 v2 接收（新增字段得到零值，不报错）
    var u2 UserV2
    gob.NewDecoder(&buf).Decode(&u2)
    fmt.Println(u2) // {Alice 30  false}
}
```

### GobEncoder/GobDecoder 自定义

```go
// 实现自定义编解码逻辑
type SecretString struct {
    val string
}

func (s SecretString) GobEncode() ([]byte, error) {
    // 存储时加密
    return encrypt([]byte(s.val)), nil
}

func (s *SecretString) GobDecode(data []byte) error {
    decrypted, err := decrypt(data)
    if err != nil {
        return err
    }
    s.val = string(decrypted)
    return nil
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| gob 为什么只适合 Go 内部通信？ | 编码格式与 Go 类型系统强绑定，其他语言没有对应的解码实现 |
| gob 的零值优化是什么？ | 编码时自动跳过零值字段（稀疏编码），类似 JSON omitempty 但对所有字段自动生效 |
| 接口类型为什么要 gob.Register？ | gob 需要根据类型名找到具体类型进行反序列化；不注册则解码时不知道实例化哪个具体类型 |
| gob 如何实现字段兼容？ | 按字段**名称**匹配（非位置）；接收方多余字段得零值，多余的发送字段被忽略 |
| 为什么 Encoder/Decoder 要复用（而非每次 New）？ | 首次传输包含类型描述信息；复用同一对象可避免重复发送类型信息，减少开销 |
| gob vs protobuf 选哪个？ | 纯 Go 内部、快速开发用 gob；跨语言、高性能 RPC、需要严格 schema 用 protobuf |
