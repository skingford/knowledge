---
title: encoding/xml 源码精读
description: 精读 encoding/xml 的标签驱动编解码机制，理解 XML 与 JSON 的关键差异、命名空间处理与流式解析。
---

# encoding/xml：XML 编解码源码精读

> 核心源码：`src/encoding/xml/xml.go`、`src/encoding/xml/marshal.go`

## 包结构图

```
encoding/xml 核心组件
══════════════════════════════════════════════════════════════════

  编码（Marshal）：
  xml.Marshal(v)           → []byte（带 XML 声明）
  xml.MarshalIndent(v,...)  → 格式化输出
  xml.NewEncoder(w).Encode(v)  → 流式编码

  解码（Unmarshal）：
  xml.Unmarshal(data, v)    → 解析到结构体
  xml.NewDecoder(r).Decode(v)  → 流式解码

  低级 Token 流（流式解析大文件）：
  Decoder.Token() → Token（StartElement/EndElement/CharData/...）

  struct 标签语法（xml:"..."）：
  ├── xml:"name"           ← 元素名
  ├── xml:"ns name"        ← 带命名空间
  ├── xml:",attr"          ← 映射为 XML 属性
  ├── xml:",chardata"      ← 映射为文本内容
  ├── xml:",innerxml"      ← 原始 XML 字符串
  ├── xml:",omitempty"     ← 零值时省略
  ├── xml:"-"              ← 忽略字段
  └── xml:"a>b>c"          ← 嵌套路径

  Token 类型：
  ├── StartElement  { Name xml.Name; Attr []xml.Attr }
  ├── EndElement    { Name xml.Name }
  ├── CharData      []byte （文本内容）
  ├── Comment       []byte
  ├── ProcInst      { Target, Inst []byte }（处理指令）
  └── Directive     []byte（<!DOCTYPE...>）

══════════════════════════════════════════════════════════════════
```

---

## 一、JSON vs XML 标签对比

```
struct 标签差异速查
══════════════════════════════════════════════════════════════════

  特性              JSON                    XML
  ─────────────────────────────────────────────────────────────
  字段名            json:"name"             xml:"name"
  忽略零值          json:"name,omitempty"   xml:"name,omitempty"
  忽略字段          json:"-"                xml:"-"
  属性（无对应）    ✗                       xml:"id,attr"
  文本内容（无对应）✗                       xml:",chardata"
  嵌套路径（无对应）✗                       xml:"root>child"
  命名空间（无对应）✗                       xml:"http://ns name"
  内联嵌套          json 直接嵌套           xml:">" 或 XMLName

══════════════════════════════════════════════════════════════════
```

---

## 二、代码示例

### 基础编解码

```go
type Person struct {
    XMLName xml.Name `xml:"person"`           // 根元素名
    ID      int      `xml:"id,attr"`           // 属性
    Name    string   `xml:"name"`              // 子元素
    Age     int      `xml:"age"`
    Email   string   `xml:"contact>email"`     // 嵌套路径
    Bio     string   `xml:",chardata"`         // 文本内容（不能与子元素同时用）
}

// 编码
p := Person{
    ID:    1,
    Name:  "Alice",
    Age:   30,
    Email: "alice@example.com",
}
data, err := xml.MarshalIndent(p, "", "  ")
// 输出:
// <person id="1">
//   <name>Alice</name>
//   <age>30</age>
//   <contact>
//     <email>alice@example.com</email>
//   </contact>
// </person>

// 解码
xmlStr := `<person id="2"><name>Bob</name><age>25</age></person>`
var p2 Person
xml.Unmarshal([]byte(xmlStr), &p2)
fmt.Println(p2.Name, p2.ID) // Bob 2
```

### XML 属性处理

```go
type Config struct {
    XMLName xml.Name `xml:"config"`
    Version string   `xml:"version,attr"`
    Env     string   `xml:"env,attr"`
    DB      struct {
        Host string `xml:"host,attr"`
        Port int    `xml:"port,attr"`
        Name string `xml:",chardata"`
    } `xml:"database"`
}

// 对应 XML:
// <config version="1.0" env="prod">
//   <database host="localhost" port="5432">mydb</database>
// </config>
```

### 流式解析大 XML 文件（Token 流）

```go
// 不需要将整个 XML 加载到内存
func parseProducts(r io.Reader) ([]Product, error) {
    decoder := xml.NewDecoder(r)
    decoder.CharsetReader = charset.NewReaderLabel // 处理非 UTF-8 编码

    var products []Product
    var inProduct bool
    var current Product

    for {
        tok, err := decoder.Token()
        if err == io.EOF {
            break
        }
        if err != nil {
            return nil, err
        }

        switch t := tok.(type) {
        case xml.StartElement:
            if t.Name.Local == "product" {
                inProduct = true
                // 解析属性
                for _, attr := range t.Attr {
                    if attr.Name.Local == "id" {
                        current.ID, _ = strconv.Atoi(attr.Value)
                    }
                }
            } else if inProduct && t.Name.Local == "name" {
                // 读取下一个 CharData
                if inner, err := decoder.Token(); err == nil {
                    if cd, ok := inner.(xml.CharData); ok {
                        current.Name = string(cd)
                    }
                }
            }
        case xml.EndElement:
            if t.Name.Local == "product" {
                products = append(products, current)
                current = Product{}
                inProduct = false
            }
        }
    }
    return products, nil
}
```

### 流式解码（Decode 方法）

```go
// 比 Token 更高级：自动映射到结构体
func streamDecode(r io.Reader) error {
    decoder := xml.NewDecoder(r)

    for {
        // 找到下一个目标元素
        t, err := decoder.Token()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }

        start, ok := t.(xml.StartElement)
        if !ok || start.Name.Local != "item" {
            continue
        }

        // 将该元素解码为结构体（高效）
        var item Item
        if err := decoder.DecodeElement(&item, &start); err != nil {
            return err
        }
        process(item)
    }
}
```

### 命名空间

```go
type SOAPEnvelope struct {
    XMLName xml.Name `xml:"http://schemas.xmlsoap.org/soap/envelope/ Envelope"`
    Body    SOAPBody `xml:"http://schemas.xmlsoap.org/soap/envelope/ Body"`
}

type SOAPBody struct {
    Content []byte `xml:",innerxml"` // 保留内部原始 XML
}

// 手动构建带命名空间的元素
env := SOAPEnvelope{}
data, _ := xml.MarshalIndent(env, "", "  ")
// <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">...</Envelope>
```

### 实现 Marshaler/Unmarshaler 接口

```go
// 自定义编码（实现 xml.Marshaler）
type Duration time.Duration

func (d Duration) MarshalXML(e *xml.Encoder, start xml.StartElement) error {
    e.EncodeElement(time.Duration(d).String(), start)
    return nil
}

func (d *Duration) UnmarshalXML(dec *xml.Decoder, start xml.StartElement) error {
    var s string
    if err := dec.DecodeElement(&s, &start); err != nil {
        return err
    }
    dur, err := time.ParseDuration(s)
    if err != nil {
        return err
    }
    *d = Duration(dur)
    return nil
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| xml:",chardata" 和 xml:",innerxml" 的区别？ | chardata 获取纯文本内容（自动去转义）；innerxml 获取原始 XML 字节（含子标签） |
| 如何解析 XML 属性？ | 字段标签加 `,attr`：`xml:"id,attr"`；对应 `<elem id="...">` |
| xml:"a>b>c" 的含义？ | 嵌套路径，Marshal 时生成 `<a><b><c>value</c></b></a>`；Unmarshal 时从该路径取值 |
| 大 XML 文件如何高效解析？ | 用 Decoder.Token() 流式读取；或用 Decoder.DecodeElement 按需映射，避免全量加载 |
| XML 和 JSON 解码在 Go 中的主要差异？ | XML 支持属性（attr）、文本内容（chardata）、命名空间、嵌套路径；JSON 无对应概念 |
| CharsetReader 的作用？ | XML 支持多种字符集（GBK/ISO-8859）；CharsetReader 将非 UTF-8 转为 UTF-8 再解析 |
