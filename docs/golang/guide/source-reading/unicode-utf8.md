---
title: unicode/utf8 源码精读
description: 精读 unicode/utf8 包的 UTF-8 编解码实现，理解 rune/byte 的本质区别与 Go 字符串的内存模型。
---

# unicode/utf8：字符编码源码精读

> 核心源码：`src/unicode/utf8/utf8.go`、`src/unicode/tables.go`

## 包结构图

```
unicode 相关包全景
══════════════════════════════════════════════════════════════════

  unicode/utf8             ← UTF-8 编解码核心
  ├── 解码：DecodeRune / DecodeRuneInString
  ├── 编码：EncodeRune / AppendRune
  ├── 校验：ValidString / Valid
  ├── 统计：RuneCountInString / RuneLen
  └── 常量：RuneError / MaxRune / UTFMax

  unicode                  ← Unicode 字符属性查询
  ├── Is(rangeTab, rune)   ← 判断字符属于哪个 Unicode 类别
  ├── IsLetter / IsDigit / IsSpace / IsPunct ...
  ├── ToUpper / ToLower / ToTitle
  └── 范围表：unicode.Letter / unicode.Digit ...

  unicode/utf16            ← UTF-16 编解码（Windows/Java 常用）

══════════════════════════════════════════════════════════════════
```

---

## 一、UTF-8 编码规则

```
UTF-8 编码表
══════════════════════════════════════════════════════════════════

  Unicode 范围              字节数    编码模板（x 为数据位）
  ─────────────────────────────────────────────────────────────
  U+0000   ~ U+007F        1字节    0xxxxxxx
  U+0080   ~ U+07FF        2字节    110xxxxx 10xxxxxx
  U+0800   ~ U+FFFF        3字节    1110xxxx 10xxxxxx 10xxxxxx
  U+10000  ~ U+10FFFF      4字节    11110xxx 10xxxxxx 10xxxxxx 10xxxxxx

  特征：
  ├── ASCII（0~127）一字节，向后兼容
  ├── 多字节首字节高位决定字节数（110/1110/11110）
  ├── 续字节始终以 10 开头（可自同步，从任意位置扫描）
  └── 最大 4 字节，覆盖全部 Unicode 码点

  示例：'中' = U+4E2D
  0x4E2D = 0100 1110 0010 1101
  3字节：1110xxxx 10xxxxxx 10xxxxxx
        1110 0100  10 111000  10 101101
  = 0xE4 0xB8 0xAD

══════════════════════════════════════════════════════════════════
```

---

## 二、DecodeRune 实现

```go
// src/unicode/utf8/utf8.go（简化）
func DecodeRune(p []byte) (r rune, size int) {
    n := len(p)
    if n < 1 {
        return RuneError, 0
    }
    p0 := p[0]

    // 单字节（ASCII）：最快路径
    if p0 < RuneSelf { // RuneSelf = 0x80
        return rune(p0), 1
    }

    // 确定字节数
    var sz int
    switch {
    case p0 < 0xE0: sz = 2 // 110xxxxx
    case p0 < 0xF0: sz = 3 // 1110xxxx
    default:         sz = 4 // 11110xxx
    }

    // 提取数据位（去掉高位标识位）
    r = rune(p0 & (0xFF >> sz)) // 首字节有效位掩码
    for i := 1; i < sz; i++ {
        if p[i]&0xC0 != 0x80 { // 续字节必须 10xxxxxx
            return RuneError, 1 // 无效 UTF-8
        }
        r = r<<6 | rune(p[i]&0x3F) // 拼接 6 位数据
    }
    return r, sz
}
```

---

## 三、Go 字符串内存模型

```
Go string 与 rune 的关系
══════════════════════════════════════════════════════════════════

  string 底层：
  ┌──────────────┬──────────────┐
  │  ptr *byte   │  len int     │
  └──────────────┴──────────────┘
  → 不可变的字节序列（UTF-8 编码，但不强制校验）
  → len(s) = 字节数，不是字符数！

  rune = int32，代表一个 Unicode 码点

  示例：s := "Hello中文"
  len(s) = 11（5个ASCII字节 + 中=3字节 + 文=3字节）
  utf8.RuneCountInString(s) = 7（7个字符）

  for i, r := range s {
      // i = 字节偏移，r = rune（编译器自动 DecodeRune）
  }

  直接下标访问：
  s[5] = 0xE4（'中'的第一字节，不是 '中' 本身！）
  需要 rune 切片：[]rune(s)[5] = '中'（有额外分配）

══════════════════════════════════════════════════════════════════
```

---

## 四、常用函数速查

```go
import "unicode/utf8"

s := "Hello, 世界"

// 字符数（rune 数）
n := utf8.RuneCountInString(s)       // 9

// 字节数（内置 len，更快）
b := len(s)                           // 13

// 解码第一个 rune
r, size := utf8.DecodeRuneInString(s) // 'H', 1
r, size  = utf8.DecodeRuneInString(s[7:]) // '世', 3

// 编码 rune → []byte
buf := make([]byte, utf8.UTFMax)      // UTFMax = 4
n = utf8.EncodeRune(buf, '世')        // 3, buf=[0xe4,0xb8,0x96]

// 追加编码（Go 1.18+，推荐，零分配）
dst := utf8.AppendRune([]byte{}, '界') // [0xe7,0x95,0x8c]

// 校验
utf8.ValidString("Hello")             // true
utf8.ValidString("Hello\xFF")         // false（\xFF 不是合法 UTF-8）
utf8.Valid([]byte{0xE4, 0xB8, 0xAD})  // true（'中'）

// 单个 rune 的 UTF-8 字节数
utf8.RuneLen('A')   // 1
utf8.RuneLen('中')  // 3
utf8.RuneLen('𝄞')  // 4（U+1D11E，音符）

// 常量
utf8.RuneSelf   // 0x80，>= 此值的字节开始多字节序列
utf8.RuneError  // 0xFFFD，无效 UTF-8 的替代符
utf8.MaxRune    // 0x10FFFF，最大有效 Unicode 码点
utf8.UTFMax     // 4，一个 rune 最多字节数
```

---

## 五、代码示例

### 正确遍历字符串

```go
s := "Hello, 世界"

// ✅ range 遍历（推荐，编译器自动 DecodeRune）
for i, r := range s {
    fmt.Printf("byte[%d] = %c (U+%04X)\n", i, r, r)
}
// byte[0] = H (U+0048)
// byte[7] = 世 (U+4E16)
// byte[10] = 界 (U+754C)

// ✅ 手动 DecodeRune（需要更多控制时）
for i := 0; i < len(s); {
    r, size := utf8.DecodeRuneInString(s[i:])
    fmt.Printf("%c", r)
    i += size
}

// ❌ 按字节索引访问（不安全，可能切断多字节 rune）
for i := 0; i < len(s); i++ {
    fmt.Printf("%c", s[i]) // 乱码！
}
```

### 反转字符串（rune 级别）

```go
// ❌ 错误：按字节反转
func reverseBytes(s string) string {
    b := []byte(s)
    for i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
        b[i], b[j] = b[j], b[i]
    }
    return string(b) // 多字节 rune 内部字节顺序也被反转，乱码
}

// ✅ 正确：转为 rune 切片再反转
func reverseString(s string) string {
    runes := []rune(s)
    for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
        runes[i], runes[j] = runes[j], runes[i]
    }
    return string(runes)
}
// "Hello世界" → "界世olleH"
```

### 截取前 N 个字符（rune 安全）

```go
// 截取字符串前 N 个字符（不截断多字节 rune）
func truncateRunes(s string, n int) string {
    count := 0
    for i := range s { // range 按 rune 迭代
        if count == n {
            return s[:i]
        }
        count++
    }
    return s
}

// 更高效：用 utf8 包直接操作
func truncateRunesEfficient(s string, n int) string {
    i := 0
    for count := 0; count < n && i < len(s); count++ {
        _, size := utf8.DecodeRuneInString(s[i:])
        i += size
    }
    return s[:i]
}
```

### 统计多字节字符比例（检测编码）

```go
func analyzeString(s string) {
    total := utf8.RuneCountInString(s)
    bytes := len(s)

    fmt.Printf("字节数: %d\n", bytes)
    fmt.Printf("字符数: %d\n", total)
    fmt.Printf("平均字节/字符: %.2f\n", float64(bytes)/float64(total))
    fmt.Printf("是否合法 UTF-8: %v\n", utf8.ValidString(s))

    var nonASCII int
    for _, r := range s {
        if r >= utf8.RuneSelf {
            nonASCII++
        }
    }
    fmt.Printf("非 ASCII 字符数: %d\n", nonASCII)
}
```

### unicode 包：字符属性查询

```go
import "unicode"

// 字符类别判断
unicode.IsLetter('A')    // true
unicode.IsLetter('中')   // true（汉字也是 Letter）
unicode.IsDigit('5')     // true
unicode.IsSpace(' ')     // true（还包括 \t \n \r）
unicode.IsPunct('!')     // true
unicode.IsUpper('A')     // true
unicode.IsLower('a')     // true

// 大小写转换
unicode.ToUpper('a')     // 'A'
unicode.ToLower('Ä')     // 'ä'（含变音符号）

// 判断 CJK 字符（中日韩）
func isCJK(r rune) bool {
    return unicode.Is(unicode.Han, r) ||
           unicode.Is(unicode.Hiragana, r) ||
           unicode.Is(unicode.Katakana, r)
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| len(s) 和 utf8.RuneCountInString(s) 的区别？ | len 返回字节数；RuneCountInString 返回 Unicode 字符（rune）数 |
| range string 遍历的单位是什么？ | rune（编译器自动调用 DecodeRune），i 是字节偏移而非字符索引 |
| string 直接下标 s[i] 取到的是什么？ | 第 i 个字节（byte），不是第 i 个字符；多字节字符会被切断 |
| RuneError 是什么？ | U+FFFD（0xFFFD），遇到无效 UTF-8 序列时 DecodeRune 返回此值 |
| 为什么 Go 字符串是不可变的？ | 设计决策：不可变保证并发安全、可安全共享内存（string ↔ []byte 转换时也有保护）|
| 如何安全截取 N 个字符？ | 用 range 或 DecodeRuneInString 按 rune 步进，不能直接用字节切片 |
