---
title: unicode/utf8 源码精读
description: 精读 unicode/utf8 的编解码实现，掌握 rune 与字节的转换、字符串遍历、UTF-8 校验与多语言文本处理最佳实践。
---

# unicode/utf8：字符编码源码精读

> 核心源码：`src/unicode/utf8/utf8.go`
>
> 图例参考：这里补了 UTF-8 解码图，并复用 `string/[]byte/[]rune` 图，先把“字节宽度”和“按 rune 遍历”这两层分开，再回头读 `utf8.go` 的查表逻辑。

## 包结构图

<GoLanguageDiagram kind="string-byte-rune" />

```
unicode/utf8 体系
══════════════════════════════════════════════════════════════════

  UTF-8 编码规则：
  ┌────────────────┬──────────────────────────────────────────┐
  │ Unicode 范围   │ UTF-8 字节格式                           │
  ├────────────────┼──────────────────────────────────────────┤
  │ U+0000~007F    │ 0xxxxxxx              （1 字节，ASCII）  │
  │ U+0080~07FF    │ 110xxxxx 10xxxxxx     （2 字节）         │
  │ U+0800~FFFF    │ 1110xxxx 10xxxxxx 10xxxxxx  （3 字节）   │
  │ U+10000~10FFFF │ 11110xxx 10xxxxxx 10xxxxxx 10xxxxxx（4B）│
  └────────────────┴──────────────────────────────────────────┘
  中文字符通常 3 字节；emoji 通常 4 字节

  核心函数：
  ├── RuneLen(r rune) int              ← rune 编码后的字节数
  ├── RuneCount(p []byte) int          ← 字节切片中的 rune 数量
  ├── RuneCountInString(s string) int  ← 字符串中的 rune 数量
  ├── DecodeRune(p []byte) (rune, int) ← 解码第一个 rune + 字节数
  ├── DecodeRuneInString(s) (rune, int)← 从字符串解码第一个 rune
  ├── DecodeLastRune(p []byte) (rune, int) ← 解码最后一个 rune
  ├── EncodeRune(p []byte, r rune) int ← 将 rune 编码写入字节切片
  ├── Valid(p []byte) bool             ← 校验是否合法 UTF-8
  ├── ValidString(s string) bool       ← 校验字符串是否合法 UTF-8
  └── ValidRune(r rune) bool           ← 校验 rune 是否合法 Unicode

  重要常量：
  ├── RuneError = '\uFFFD'   ← 非法字节的替代字符（□）
  ├── MaxRune   = '\U0010FFFF' ← Unicode 最大码点
  └── UTFMax    = 4            ← 单个 rune 最大字节数

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

<GoLanguageDiagram kind="utf8-decode" />

::: details 点击展开代码：一、核心实现
```go
// src/unicode/utf8/utf8.go（简化）

// DecodeRune：解码字节切片的第一个 UTF-8 字符
func DecodeRune(p []byte) (r rune, size int) {
    n := len(p)
    if n < 1 {
        return RuneError, 0
    }
    p0 := p[0]
    x := first[p0]  // 查表：确定字节数和掩码

    if x >= as {    // 单字节（ASCII 0~127）
        return rune(p0), 1
    }

    sz := int(x & 7)  // 提取字节数（低3位）
    if n < sz {
        return RuneError, 1
    }

    // 验证后续字节必须是 10xxxxxx 格式
    b1 := p[1]
    if b1 < locb || hicb < b1 {
        return RuneError, 1
    }
    if sz == 2 {
        return rune(p0&mask2)<<6 | rune(b1&maskx), 2
    }
    // ... 3、4 字节类似
}
```
:::

---

## 二、代码示例

### 字符串遍历：字节 vs rune

::: details 点击展开代码：字符串遍历：字节 vs rune
```go
import "unicode/utf8"

func compareIteration() {
    s := "Hello, 世界! 🌍"

    fmt.Printf("字节数: %d\n", len(s))                        // 22
    fmt.Printf("字符数: %d\n", utf8.RuneCountInString(s))     // 12

    // ❌ 错误：按字节遍历会截断多字节字符
    for i := 0; i < len(s); i++ {
        fmt.Printf("%x ", s[i]) // 原始字节，中文会碎片化
    }

    // ✅ 正确：for range 自动按 rune 迭代
    for i, r := range s {
        fmt.Printf("[%d]%c(%d字节) ", i, r, utf8.RuneLen(r))
    }
    // [0]H(1字节) [1]e(1字节) ... [7]世(3字节) [10]界(3字节) ...

    // ✅ 正确：手动 DecodeRuneInString 遍历
    for i := 0; i < len(s); {
        r, size := utf8.DecodeRuneInString(s[i:])
        fmt.Printf("%c", r)
        i += size
    }
}
```
:::

### 字符串截断（保证不截断多字节字符）

::: details 点击展开代码：字符串截断（保证不截断多字节字符）
```go
// 按字符数截断（不按字节数）
func truncateByRune(s string, maxRunes int) string {
    count := 0
    for i := range s {
        if count == maxRunes {
            return s[:i]
        }
        count++
    }
    return s // 字符数不足 maxRunes
}

// 按字节数截断（但保证 UTF-8 完整性）
func truncateByByte(s string, maxBytes int) string {
    if len(s) <= maxBytes {
        return s
    }
    // 从截断点向前找合法 UTF-8 边界
    for maxBytes > 0 && !utf8.RuneStart(s[maxBytes]) {
        maxBytes--
    }
    return s[:maxBytes]
}

// RuneStart：判断字节是否是 rune 的起始字节
// ASCII(0xxxxxxx) 或 多字节起始(11xxxxxx) 返回 true
// 续字节(10xxxxxx) 返回 false

// 使用
fmt.Println(truncateByRune("Hello世界", 7))   // "Hello世"
fmt.Println(truncateByByte("Hello世界", 8))   // "Hello世"（世=3字节，8字节边界）
```
:::

### UTF-8 校验与修复

::: details 点击展开代码：UTF-8 校验与修复
```go
// 校验输入是否合法 UTF-8（防止乱码写入数据库）
func validateUTF8(s string) error {
    if !utf8.ValidString(s) {
        return fmt.Errorf("非法 UTF-8 编码")
    }
    return nil
}

// 修复非法 UTF-8：将非法字节替换为 RuneError
func sanitizeUTF8(b []byte) []byte {
    if utf8.Valid(b) {
        return b // 已合法，直接返回
    }

    result := make([]byte, 0, len(b))
    for len(b) > 0 {
        r, size := utf8.DecodeRune(b)
        if r == utf8.RuneError && size == 1 {
            // 非法字节：替换为 U+FFFD（Unicode 替代字符）
            result = utf8.AppendRune(result, utf8.RuneError)
        } else {
            result = append(result, b[:size]...)
        }
        b = b[size:]
    }
    return result
}

// strings.ToValidUTF8（Go 1.13+，更简洁）
func cleanUTF8(s string) string {
    return strings.ToValidUTF8(s, "?") // 非法字节替换为 "?"
}
```
:::

### 字符级操作

::: details 点击展开代码：字符级操作
```go
// 反转字符串（正确处理多字节字符）
func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}

// 统计各类字符
func countCharTypes(s string) (ascii, cjk, emoji, other int) {
    for _, r := range s {
        switch {
        case r < 0x80:
            ascii++
        case r >= 0x4E00 && r <= 0x9FFF: // CJK 统一汉字基本区
            cjk++
        case r >= 0x1F600 && r <= 0x1F64F: // Emoji 表情
            emoji++
        default:
            other++
        }
    }
    return
}

// 高效拼接：用 strings.Builder + WriteRune
func buildString(runes []rune) string {
    var sb strings.Builder
    sb.Grow(len(runes) * 3) // 预估每个 rune 平均 3 字节
    for _, r := range runes {
        sb.WriteRune(r)
    }
    return sb.String()
}
```
:::

### 编码转换（GBK → UTF-8）

::: details 点击展开代码：编码转换（GBK → UTF-8）
```go
import "golang.org/x/text/encoding/simplifiedchinese"

// GBK（Windows 中文编码）→ UTF-8
func gbkToUTF8(gbk []byte) ([]byte, error) {
    decoder := simplifiedchinese.GBK.NewDecoder()
    return decoder.Bytes(gbk)
}

// UTF-8 → GBK
func utf8ToGBK(utf8Str string) ([]byte, error) {
    encoder := simplifiedchinese.GBK.NewEncoder()
    return encoder.Bytes([]byte(utf8Str))
}

// 读取 GBK 文件并转换
func readGBKFile(path string) (string, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return "", err
    }
    utf8Data, err := gbkToUTF8(data)
    if err != nil {
        return "", err
    }
    return string(utf8Data), nil
}
```
:::

### 处理包含零宽字符的用户名（安全场景）

::: details 点击展开代码：处理包含零宽字符的用户名（安全场景）
```go
import "unicode"

// 清理用户名：移除控制字符和不可见字符
func sanitizeUsername(name string) string {
    var sb strings.Builder
    for _, r := range name {
        // 跳过控制字符、零宽字符、方向控制字符
        if unicode.IsControl(r) || unicode.Is(unicode.Cf, r) {
            continue
        }
        sb.WriteRune(r)
    }
    return strings.TrimSpace(sb.String())
}

// 判断字符串是否只包含可打印字符
func isPrintable(s string) bool {
    for _, r := range s {
        if !unicode.IsPrint(r) {
            return false
        }
    }
    return true
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `len(s)` 和 `utf8.RuneCountInString(s)` 的区别？ | `len` 返回字节数；`RuneCountInString` 返回 Unicode 字符（rune）数；中文 `len("中")=3`，`RuneCount=1` |
| for range 字符串遍历的底层行为？ | 自动调用 `DecodeRuneInString`，每次迭代返回 `(字节偏移, rune)`；非法 UTF-8 字节返回 `RuneError`，size=1 |
| `string` 和 `[]rune` 转换的内存开销？ | `[]rune(s)` 分配新内存并解码每个字符；对于纯 ASCII 字符串内存翻倍；大文本应用 `for range` 避免整体转换 |
| `utf8.RuneError` 的两种含义？ | 作为返回 rune：表示解码遇到非法字节；作为 Unicode 码点：U+FFFD 替代字符（本身是合法字符） |
| 如何正确按字节截断 UTF-8 字符串？ | 找到截断点后用 `utf8.RuneStart(s[i])` 向前找 rune 起始字节，确保不截断多字节字符中间 |
| Go 字符串内部编码是什么？ | Go string 是任意字节序列（`[]byte` 视图）；Go 源码编译器保证字面量字符串是 UTF-8，但运行时不强制 |
