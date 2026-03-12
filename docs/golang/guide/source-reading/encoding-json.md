---
title: encoding/json 源码精读
description: 精读 encoding/json 编解码实现，理解反射驱动、性能瓶颈与优化方案。
---

# encoding/json 包：编解码源码精读

> 核心源码：`src/encoding/json/encode.go`、`src/encoding/json/decode.go`

## 包结构图

```
encoding/json 包结构
══════════════════════════════════════════════════════════════════

  encode.go
  ├── Marshal(v any) ([]byte, error)     ← 值 → JSON 字节
  ├── Encoder.Encode(v any) error         ← 流式编码（写 Writer）
  ├── encoderFunc                         ← 类型对应的编码函数
  └── encodeState                         ← 编码上下文（bytes.Buffer）

  decode.go
  ├── Unmarshal(data []byte, v any) error ← JSON 字节 → 值
  ├── Decoder.Decode(v any) error         ← 流式解码（读 Reader）
  ├── decodeState                         ← 解码状态机
  └── indirect()                          ← 指针解引用

  核心机制：
  ├── 反射（reflect）驱动类型分析
  ├── sync.Map 缓存类型的编码器（避免重复反射）
  └── Tag 解析（json:"field,omitempty"）

══════════════════════════════════════════════════════════════════
```

---

## 一、Marshal 编码流程

```
Marshal(v) 流程
══════════════════════════════════════════════════════

  Marshal(v any)
       │
       ▼
  reflect.TypeOf(v)  ← 获取类型
       │
       ▼
  typeEncoder(t)     ← 从 encoderCache 查（sync.Map）
       │
  ├── 命中 → 直接使用缓存的 encoderFunc
       │
  └── 未命中 → 根据 Kind 构造编码函数并缓存
               ├── struct → newStructEncoder（解析 tag，构建字段列表）
               ├── map    → mapEncoder
               ├── slice  → sliceEncoder
               ├── ptr    → ptrEncoder（处理 nil）
               └── 基础类型 → 直接写值
       │
       ▼
  encoderFunc(buf, v, opts)  ← 执行编码，写入 encodeState

══════════════════════════════════════════════════════
```

### 结构体字段解析

```
struct 编码器构建（仅首次，后续走缓存）
══════════════════════════════════════════════════════

  type User struct {
      Name string `json:"name"`
      Age  int    `json:"age,omitempty"`
      Pass string `json:"-"`           ← 忽略
  }

  解析结果（structFields）：
  ┌─────────────────────────────────────────────────┐
  │  fields = [                                     │
  │    {name:"name", index:[0], omitempty:false},   │
  │    {name:"age",  index:[1], omitempty:true},    │
  │  ]                                              │
  │  Pass 字段因 "-" 被排除                         │
  └─────────────────────────────────────────────────┘
```

---

## 二、Unmarshal 解码流程

```
Unmarshal(data, v) 流程
══════════════════════════════════════════════════════

  Unmarshal(data []byte, v any)
       │
       ▼
  checkValid(data)   ← 预验证 JSON 格式（快速扫描）
       │
       ▼
  indirect(v)        ← 解引用指针，处理 nil 指针（自动 new）
       │
       ▼
  d.unmarshal(v)
       │
       ▼
  状态机扫描 JSON token：
  ├── '{' → object → 逐字段匹配 struct field（大小写不敏感）
  ├── '[' → array  → 逐元素填充 slice
  ├── '"' → string → 赋值 string/[]byte
  └── 数字/bool/null → 对应 Go 类型

══════════════════════════════════════════════════════
```

---

## 三、性能分析与优化

```
标准库 json 性能瓶颈
══════════════════════════════════════════════════════

  1. 反射开销（reflect.Value 创建）
     → 每次 Marshal/Unmarshal 都需要 reflect 类型操作

  2. 内存分配
     → encodeState 使用 bytes.Buffer，有动态扩容

  3. 逐字节扫描
     → JSON 解析是状态机，逐字节处理

  高性能替代方案对比：
  ┌───────────────────────────────────────────────────┐
  │  库             原理              适用场景         │
  ├───────────────────────────────────────────────────┤
  │  encoding/json  反射             通用，无额外依赖  │
  │  jsoniter       反射+优化缓存    兼容标准库，快2x  │
  │  sonic(字节)    汇编+JIT         极致性能，快5-10x │
  │  easyjson       代码生成         避免反射，需gen   │
  └───────────────────────────────────────────────────┘
```

---

## 四、代码示例

### 基本用法

```go
type Order struct {
    ID     int64   `json:"id"`
    Amount float64 `json:"amount"`
    Status string  `json:"status,omitempty"` // 空值不输出
    secret string  // 未导出字段，自动忽略
}

// 编码
o := Order{ID: 1, Amount: 99.9}
data, _ := json.Marshal(o)
// {"id":1,"amount":99.9}  ← status 为空被 omitempty 省略

// 解码
var o2 Order
_ = json.Unmarshal(data, &o2)
```

### 流式处理（大文件场景）

```go
// 流式编码：直接写 ResponseWriter，无需全量 buffer
func writeJSON(w http.ResponseWriter, v any) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(v)
}

// 流式解码：逐条处理大 JSON 数组
func processJSONLines(r io.Reader) {
    dec := json.NewDecoder(r)
    for dec.More() {
        var item map[string]any
        if err := dec.Decode(&item); err != nil {
            break
        }
        process(item)
    }
}
```

### 自定义序列化

```go
type Time struct{ time.Time }

// 实现 json.Marshaler 接口
func (t Time) MarshalJSON() ([]byte, error) {
    return json.Marshal(t.Format("2006-01-02"))
}

// 实现 json.Unmarshaler 接口
func (t *Time) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    parsed, err := time.Parse("2006-01-02", s)
    t.Time = parsed
    return err
}
```

### RawMessage：延迟/按需解码

```go
type Response struct {
    Code int             `json:"code"`
    Data json.RawMessage `json:"data"` // 暂不解码，保留原始 JSON
}

var resp Response
json.Unmarshal(body, &resp)

// 根据业务类型再解码 Data
var user User
json.Unmarshal(resp.Data, &user)
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| json.Marshal 的字段顺序？ | 按结构体字段定义顺序（嵌套字段展开后按深度优先） |
| omitempty 对哪些类型生效？ | 零值（0、""、false、nil、空slice/map） |
| 未导出字段能被 json 序列化吗？ | 不能，即使有 tag 也忽略 |
| number 精度问题？ | 大整数用 `json.Number` 或 string 类型接收，避免 float64 精度丢失 |
| 如何处理未知字段？ | `json.Decoder.DisallowUnknownFields()` 严格模式 |
| 为什么标准库 json 慢？ | 反射、每次 encode 都需类型解析（首次后缓存，但仍有开销） |
