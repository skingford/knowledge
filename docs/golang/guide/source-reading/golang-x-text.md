---
title: golang.org/x/text 源码精读
description: 精读 Go x/text Unicode 文本处理库，掌握字符规范化、字符集转换、语言标签、文本变换与国际化最佳实践。
---

# golang.org/x/text：Unicode 文本处理源码精读

> 核心源码：`golang.org/x/text/unicode/norm`、`transform`、`encoding`、`language`
>
> 图例参考：这里补了 `x/text` 的文本变换流水线图，先把“解码 -> 规范化 -> 语言协商/排序”看成一条链，再回头读 `transform`、`norm` 和 `language` 各自负责哪一段。

## 包结构图

<GoLanguageDiagram kind="xtext-transform" />

```
golang.org/x/text 体系
══════════════════════════════════════════════════════════════════

  transform（变换接口，核心抽象）
  └── Transformer 接口
       ├── Transform(dst, src []byte, atEOF bool) (nDst, nSrc int, err error)
       └── Reset()
       使用：transform.NewReader(r, t) / transform.NewWriter(w, t)

  unicode/norm（Unicode 规范化）
  ├── NFC  ← 组合形式（最常用，URL/文件名比较）
  ├── NFD  ← 分解形式（将 é 分解为 e + 组合符）
  ├── NFKC ← 兼容组合（ﬁ→fi，全角→半角）★ 搜索推荐
  └── NFKD ← 兼容分解

  encoding（字符集编码转换）
  ├── encoding/charmap    ← Latin-1、Windows-1252 等
  ├── encoding/japanese   ← Shift-JIS、EUC-JP
  ├── encoding/korean     ← EUC-KR
  ├── encoding/simplifiedchinese ← GBK、GB2312、GB18030
  └── encoding/traditionalchinese← Big5

  language（BCP-47 语言标签）
  ├── language.Make("zh-Hans-CN") ← 解析语言标签
  ├── language.Matcher            ← 语言协商（Accept-Language）
  └── language.Tag.Base/Script/Region

  collate（语言感知排序）
  └── collate.New(language.Chinese) → 按中文拼音排序

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// transform 包核心接口
type Transformer interface {
    // Transform 转换 src→dst，返回消耗和产生的字节数
    // err=ErrShortDst：dst 空间不足，需扩大
    // err=ErrShortSrc：src 数据不完整（跨块边界），需更多数据
    Transform(dst, src []byte, atEOF bool) (nDst, nSrc int, err error)
    Reset()
}

// transform.Chain：串联多个 Transformer（流水线）
// 例：GBK → UTF-8 → NFC 规范化
chain := transform.Chain(
    simplifiedchinese.GBK.NewDecoder(), // GBK → UTF-8
    norm.NFC,                           // 规范化
)
```
:::

---

## 二、代码示例

### 字符集转换：GBK/Big5 ↔ UTF-8

::: details 点击展开代码：字符集转换：GBK/Big5 ↔ UTF-8
```go
import (
    "golang.org/x/text/encoding/simplifiedchinese"
    "golang.org/x/text/encoding/traditionalchinese"
    "golang.org/x/text/transform"
    "io"
)

// GBK → UTF-8
func gbkToUTF8(r io.Reader) io.Reader {
    return transform.NewReader(r, simplifiedchinese.GBK.NewDecoder())
}

// UTF-8 → GBK
func utf8ToGBK(w io.Writer) io.Writer {
    return transform.NewWriter(w, simplifiedchinese.GBK.NewEncoder())
}

// 字节切片转换（小数据）
func convertGBKToUTF8(gbkBytes []byte) ([]byte, error) {
    decoder := simplifiedchinese.GBK.NewDecoder()
    utf8Bytes, _, err := transform.Bytes(decoder, gbkBytes)
    return utf8Bytes, err
}

func convertUTF8ToGBK(utf8Bytes []byte) ([]byte, error) {
    encoder := simplifiedchinese.GBK.NewEncoder()
    gbkBytes, _, err := transform.Bytes(encoder, utf8Bytes)
    return gbkBytes, err
}

// 字符串转换
func convertStringGBKToUTF8(s string) (string, error) {
    result, _, err := transform.String(simplifiedchinese.GBK.NewDecoder(), s)
    return result, err
}

// Big5（繁体中文）→ UTF-8
func big5ToUTF8(r io.Reader) io.Reader {
    return transform.NewReader(r, traditionalchinese.Big5.NewDecoder())
}
```
:::

### Unicode 规范化：NFC/NFKC

::: details 点击展开代码：Unicode 规范化：NFC/NFKC
```go
import "golang.org/x/text/unicode/norm"

// NFC：组合形式（相等的字符序列 → 统一表示）
// 用于：字符串相等比较、文件名规范化、数据库存储
func normalizeNFC(s string) string {
    return norm.NFC.String(s)
}

// 判断两个字符串 Unicode 等价（视觉上相同但编码不同）
func unicodeEqual(a, b string) bool {
    return norm.NFC.String(a) == norm.NFC.String(b)
}

// NFKC：兼容规范化（推荐用于搜索、比较）
// 将 ﬁ→fi，Ａ→A（全角→半角），① → 1，² → 2
func normalizeForSearch(s string) string {
    return norm.NFKC.String(s)
}

// 实际示例：
func unicodeNormDemo() {
    // é 可以是 U+00E9（预组合）或 U+0065 U+0301（分解）
    precomposed := "\u00e9"     // é（预组合）
    decomposed := "e\u0301"    // e + 组合符（分解）

    fmt.Println(precomposed == decomposed)           // false（字节不同）
    fmt.Println(normalizeNFC(precomposed) == normalizeNFC(decomposed)) // true

    // 全角数字规范化（搜索场景）
    fullWidth := "ＡＢＣ１２３" // 全角
    fmt.Println(normalizeForSearch(fullWidth)) // ABC123（半角）
}
```
:::

### 语言标签与 Accept-Language 协商

::: details 点击展开代码：语言标签与 Accept-Language 协商
```go
import (
    "golang.org/x/text/language"
    "net/http"
)

// 支持的语言列表
var supported = []language.Tag{
    language.Chinese,       // zh
    language.SimplifiedChinese, // zh-Hans
    language.English,       // en
    language.Japanese,      // ja
}

var matcher = language.NewMatcher(supported)

// HTTP Accept-Language 协商
func detectLanguage(r *http.Request) language.Tag {
    accept := r.Header.Get("Accept-Language")
    tags, _, err := language.ParseAcceptLanguage(accept)
    if err != nil {
        return language.English // 默认
    }

    tag, _, _ := matcher.Match(tags...)
    return tag
}

func languageHandler(w http.ResponseWriter, r *http.Request) {
    lang := detectLanguage(r)

    switch lang {
    case language.SimplifiedChinese:
        w.Write([]byte("你好，世界！"))
    case language.Chinese:
        w.Write([]byte("你好！"))
    case language.Japanese:
        w.Write([]byte("こんにちは！"))
    default:
        w.Write([]byte("Hello!"))
    }
}

// 解析和操作语言标签
func parseLanguageTags() {
    tag := language.MustParse("zh-Hans-CN")
    base, _ := tag.Base()     // zh
    script, _ := tag.Script() // Hans
    region, _ := tag.Region() // CN

    fmt.Printf("语言=%s 文字=%s 地区=%s\n", base, script, region)

    // 规范化
    canonical, _ := language.Compose(base, script, region)
    fmt.Println(canonical) // zh-Hans-CN
}
```
:::

### 语言感知排序（中文按拼音排序）

::: details 点击展开代码：语言感知排序（中文按拼音排序）
```go
import (
    "golang.org/x/text/collate"
    "golang.org/x/text/language"
    "sort"
)

// 中文按拼音排序
func sortChinesePinyin(strs []string) []string {
    c := collate.New(language.Chinese, collate.Loose)
    sort.Slice(strs, func(i, j int) bool {
        return c.CompareString(strs[i], strs[j]) < 0
    })
    return strs
}

// 使用
func main() {
    names := []string{"张三", "李四", "王五", "赵六", "陈七"}
    sorted := sortChinesePinyin(names)
    fmt.Println(sorted) // [陈七 李四 王五 张三 赵六]（拼音顺序）

    // 英文大小写不敏感排序
    english := []string{"Banana", "apple", "Cherry"}
    c := collate.New(language.English, collate.IgnoreCase)
    sort.Slice(english, func(i, j int) bool {
        return c.CompareString(english[i], english[j]) < 0
    })
    fmt.Println(english) // [apple Banana Cherry]
}
```
:::

### 自动检测文件编码

::: details 点击展开代码：自动检测文件编码
```go
import "golang.org/x/text/encoding/charmap"

// 根据 BOM 或启发式规则检测编码（简化版）
func detectAndConvert(data []byte) (string, error) {
    // UTF-8 BOM
    if len(data) >= 3 && data[0] == 0xEF && data[1] == 0xBB && data[2] == 0xBF {
        return string(data[3:]), nil
    }

    // UTF-16 LE BOM
    if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xFE {
        dec := unicode.UTF16(unicode.LittleEndian, unicode.UseBOM).NewDecoder()
        result, _, err := transform.Bytes(dec, data)
        return string(result), err
    }

    // 尝试 GBK（中文环境）
    dec := simplifiedchinese.GBK.NewDecoder()
    result, _, err := transform.Bytes(dec, data)
    if err == nil {
        return string(result), nil
    }

    // 回退到 ISO-8859-1（Latin-1）
    dec2 := charmap.ISO8859_1.NewDecoder()
    result, _, err = transform.Bytes(dec2, data)
    return string(result), err
}

// 流式处理大文件（避免全量读取）
func processLargeGBKFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()

    // 流式转换：GBK → UTF-8 → bufio.Scanner
    reader := transform.NewReader(f, simplifiedchinese.GBK.NewDecoder())
    scanner := bufio.NewScanner(reader)

    for scanner.Scan() {
        line := scanner.Text() // 已是 UTF-8 字符串
        fmt.Println(line)
    }
    return scanner.Err()
}
```
:::

### 文本清洗：去除控制字符与规范化空格

::: details 点击展开代码：文本清洗：去除控制字符与规范化空格
```go
import (
    "golang.org/x/text/transform"
    "golang.org/x/text/unicode/norm"
    "golang.org/x/text/runes"
    "unicode"
)

// 组合变换：规范化 + 去除控制字符 + NFKC
func cleanText(s string) string {
    // 链式变换：
    // 1. NFKC 规范化（全角→半角，兼容字符分解）
    // 2. 去除 Unicode 控制字符（\x00-\x1F 等）
    t := transform.Chain(
        norm.NFKC,
        runes.Remove(runes.In(unicode.Cc)), // 去控制字符
        runes.Remove(runes.In(unicode.Co)), // 去私用区字符
    )

    result, _, _ := transform.String(t, s)
    return result
}

// 规范化空格（将各种 Unicode 空格统一为 ASCII 空格）
func normalizeSpaces(s string) string {
    t := runes.Map(func(r rune) rune {
        if unicode.Is(unicode.Z, r) { // Unicode 空格类
            return ' '
        }
        return r
    })
    result, _, _ := transform.String(t, s)
    return result
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Unicode NFC 和 NFKC 的区别？ | NFC 做规范组合（等价字符统一表示，保留特殊字符如 ①）；NFKC 做兼容组合（将 ① → 1、ﬁ → fi、全角 → 半角）；搜索用 NFKC，存储用 NFC |
| `transform.Transformer` 接口为什么返回两个整数？ | `nDst` 和 `nSrc` 分别是写入 dst 和消耗 src 的字节数；因为编码转换不是字节对字节的（GBK 双字节 → UTF-8 三字节），需要精确记录边界 |
| `ErrShortDst` 和 `ErrShortSrc` 怎么处理？ | ErrShortDst：dst 不够大，扩大 dst 后继续；ErrShortSrc：src 末尾有不完整的多字节序列，等待更多数据（流式场景中正常）；用 `transform.NewReader` 会自动处理 |
| 为什么 `é` 有两种 UTF-8 编码？ | Unicode 允许预组合字符（U+00E9 直接表示 é）和分解序列（e + U+0301 组合符）；两者视觉相同但字节不同；NFC 规范化后二者相等 |
| 中文 GBK 转 UTF-8 时为何推荐 GB18030 而不是 GBK？ | GB18030 是 GBK 的超集，覆盖全部 Unicode 字符（包括表情符号）；GBK 只覆盖部分汉字；现代中文场景应使用 GB18030 |
| `language.Matcher` 如何实现 Accept-Language 协商？ | 将客户端偏好列表与服务端支持列表做 BCP-47 标签匹配（语言+地区+脚本层级协商）；返回最佳匹配 tag 和置信度 |
