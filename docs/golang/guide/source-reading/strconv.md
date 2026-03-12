---
title: strconv 包源码精读
description: 精读 strconv 包的 ParseInt/FormatFloat 实现，理解零分配 AppendXxx 模式与字符串数字转换的性能优化。
---

# strconv：字符串转换源码精读

> 核心源码：`src/strconv/atoi.go`、`src/strconv/ftoa.go`、`src/strconv/itoa.go`

## 包结构图

```
strconv 包功能全景
══════════════════════════════════════════════════════════════════

  字符串 → 数字（Parse）
  ├── strconv.ParseInt(s, base, bitSize)   ← 整数解析
  ├── strconv.ParseUint(...)               ← 无符号整数
  ├── strconv.ParseFloat(s, bitSize)       ← 浮点解析（精准）
  ├── strconv.ParseBool(s)                 ← "true"/"false"/"1"/"0"
  └── strconv.Atoi(s)                      ← ParseInt(s, 10, 0) 的快捷方式

  数字 → 字符串（Format）
  ├── strconv.FormatInt(i, base)           ← 整数格式化
  ├── strconv.FormatUint(...)
  ├── strconv.FormatFloat(f, fmt, prec, bitSize) ← 浮点格式化
  ├── strconv.FormatBool(b)
  └── strconv.Itoa(i)                      ← FormatInt(i, 10) 的快捷方式

  零分配追加（Append，推荐高频路径）
  ├── strconv.AppendInt(dst []byte, i int64, base int)
  ├── strconv.AppendFloat(dst, f, fmt, prec, bitSize)
  └── strconv.AppendBool(dst, b)

  字符串引用
  ├── strconv.Quote(s)        ← 加 Go 风格引号（转义控制字符）
  ├── strconv.Unquote(s)      ← 去引号
  └── strconv.CanBackquote(s) ← 是否可用反引号表示

══════════════════════════════════════════════════════════════════
```

---

## 一、ParseInt 实现

```go
// src/strconv/atoi.go（简化）
func ParseInt(s string, base int, bitSize int) (int64, error) {
    // 处理符号位
    neg := false
    if s[0] == '-' {
        neg = true
        s = s[1:]
    }

    // 调用 ParseUint 做实际解析
    un, err := ParseUint(s, base, bitSize)
    ...
}

func ParseUint(s string, base int, bitSize int) (uint64, error) {
    // 自动检测进制前缀（0x/0o/0b）
    // 核心：字节级循环，无正则，无反射
    var n uint64
    for _, c := range []byte(s) {
        var d byte
        switch {
        case c == '_':         continue  // Go 1.13+ 数字分隔符
        case '0' <= c && c <= '9': d = c - '0'
        case 'a' <= c && c <= 'z': d = c - 'a' + 10
        case 'A' <= c && c <= 'Z': d = c - 'A' + 10
        default: return 0, ErrSyntax
        }
        // 检查溢出
        n1 := n*uint64(base) + uint64(d)
        if n1 < n { return 0, ErrRange } // 溢出
        n = n1
    }
    return n, nil
}
```

```
ParseInt 快速路径优化（Atoi）
══════════════════════════════════════════════════════════════════

  Atoi(s) 内部调用 ParseInt(s, 10, 0)

  编译器会对十进制整数解析做特殊优化：
  ├── 无进制检测分支
  ├── 直接字节级减法（c - '0'）
  └── 溢出用乘法前检查（避免溢出后检查）

  基准测试（解析 "12345678"）：
  ┌─────────────────────────────────┐
  │  strconv.Atoi     ~5 ns/op      │
  │  fmt.Sscanf       ~250 ns/op    │
  │  strconv.ParseInt ~7 ns/op      │
  └─────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 二、FormatFloat 原理

```
浮点数格式化的难点：Ryu 算法（Go 1.15+）
══════════════════════════════════════════════════════════════════

  挑战：如何用最短的十进制精确表示 IEEE 754 浮点数？

  例：0.1 的 float64 实际值是 0.1000000000000000055511151231257827021181583404541015625
       最短精确表示是 "0.1"（往返转换不损失精度）

  Ryu 算法（Go 1.15+ 引入）：
  ├── 时间复杂度：O(1)，与数字大小无关
  ├── 比 Grisu3 更快（无需 fallback）
  ├── 基于区间分析：找使转换可逆的最短十进制表示
  └── 实现：src/strconv/ftoaryu.go

  与旧算法对比（格式化 float64，近似值）：
  ┌──────────────────────────────────────┐
  │  Ryu          ~15 ns/op    Go 1.15+  │
  │  Grisu3       ~20 ns/op    Go 1.14-  │
  │  fmt.Sprintf  ~100 ns/op             │
  └──────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 三、AppendXxx 零分配模式

```
AppendInt vs FormatInt 的内存对比
══════════════════════════════════════════════════════════════════

  // FormatInt：每次调用分配新字符串（1次堆分配）
  s := strconv.FormatInt(123, 10)  // 堆分配

  // AppendInt：追加到已有 []byte，复用内存（0次分配）
  buf := make([]byte, 0, 64)       // 预分配缓冲区
  buf = strconv.AppendInt(buf, 123, 10)
  buf = strconv.AppendByte(buf, ',')
  buf = strconv.AppendInt(buf, 456, 10)
  s := string(buf) // 最后一次转换

  适合场景：
  ├── 热路径中频繁格式化数字
  ├── 构建 CSV/JSON/日志的字节流
  └── 与 bytes.Buffer 配合使用

══════════════════════════════════════════════════════════════════
```

---

## 四、常见错误类型

```go
// strconv 的两种错误
var ErrRange = errors.New("value out of range")
var ErrSyntax = errors.New("invalid syntax")

// 错误包装在 *NumError 中
type NumError struct {
    Func string // 函数名（如 "ParseInt"）
    Num  string // 输入字符串
    Err  error  // ErrRange 或 ErrSyntax
}

// 正确的错误判断
_, err := strconv.ParseInt("abc", 10, 64)
if err != nil {
    var numErr *strconv.NumError
    if errors.As(err, &numErr) {
        if errors.Is(numErr.Err, strconv.ErrSyntax) {
            fmt.Println("syntax error:", numErr.Num)
        }
    }
}
```

---

## 五、代码示例

### 基础转换

```go
// 字符串 → int（最常用）
n, err := strconv.Atoi("42")       // 42, nil
n, err = strconv.Atoi("abc")       // 0, &NumError{...ErrSyntax}

// int → 字符串
s := strconv.Itoa(42)              // "42"

// 不同进制
n64, _ := strconv.ParseInt("FF", 16, 64)  // 255
n64, _ = strconv.ParseInt("0xFF", 0, 64)  // 255（自动检测进制）
n64, _ = strconv.ParseInt("0b1010", 0, 64) // 10（二进制）

hex := strconv.FormatInt(255, 16) // "ff"
bin := strconv.FormatInt(10, 2)   // "1010"
oct := strconv.FormatInt(8, 8)    // "10"

// 浮点数
f, _ := strconv.ParseFloat("3.14159", 64)
s = strconv.FormatFloat(3.14159, 'f', 2, 64) // "3.14"（2位小数）
s = strconv.FormatFloat(3.14159, 'g', -1, 64) // "3.14159"（最短）
s = strconv.FormatFloat(3.14159, 'e', 4, 64) // "3.1416e+00"

// bool
b, _ := strconv.ParseBool("true")  // true, nil
b, _ = strconv.ParseBool("1")      // true, nil
b, _ = strconv.ParseBool("false")  // false, nil
```

### AppendXxx 高性能拼接

```go
// 构建 CSV 行（无中间字符串分配）
func formatCSVRow(fields []int64) string {
    buf := make([]byte, 0, len(fields)*8) // 预估容量
    for i, v := range fields {
        if i > 0 {
            buf = append(buf, ',')
        }
        buf = strconv.AppendInt(buf, v, 10)
    }
    return string(buf)
}

// 构建 JSON 数字数组（手动）
func formatJSONNumbers(nums []float64) string {
    buf := make([]byte, 0, len(nums)*16)
    buf = append(buf, '[')
    for i, v := range nums {
        if i > 0 {
            buf = append(buf, ',')
        }
        buf = strconv.AppendFloat(buf, v, 'f', 4, 64)
    }
    buf = append(buf, ']')
    return string(buf)
}
```

### 字符串引用处理

```go
// Quote：为字符串加 Go 风格双引号（转义特殊字符）
s := strconv.Quote("Hello\nWorld")  // "\"Hello\\nWorld\""
fmt.Println(s)                       // "Hello\nWorld"（含引号）

// QuoteToASCII：非 ASCII 字符转为 \uXXXX
s = strconv.QuoteToASCII("中文")    // "\"\\u4e2d\\u6587\""

// Unquote：去掉引号，处理转义
original, err := strconv.Unquote(`"Hello\nWorld"`)
// original = "Hello\nWorld"（含真正换行符）

// 用于解析配置文件中的带引号字符串
```

### 性能对比（避免 fmt.Sprintf 的场景）

```go
// ❌ 低效：fmt.Sprintf 有反射和格式解析开销
func slowConcat(n int) string {
    return fmt.Sprintf("%d", n)
}

// ✅ 高效：strconv.Itoa 直接操作
func fastConcat(n int) string {
    return strconv.Itoa(n)
}

// ✅ 更高效（批量无分配）：AppendInt
func batchConcat(ns []int) string {
    buf := make([]byte, 0, len(ns)*4)
    for _, n := range ns {
        buf = strconv.AppendInt(buf, int64(n), 10)
        buf = append(buf, ' ')
    }
    return string(buf)
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| strconv.Atoi 和 fmt.Sscanf 哪个快？ | Atoi 快约 50 倍；fmt.Sscanf 有反射+格式解析开销 |
| FormatFloat 用什么算法？ | Go 1.15+ 用 Ryu 算法，O(1)，比 Grisu3 更快且无 fallback |
| AppendInt 和 FormatInt 的区别？ | FormatInt 每次分配新字符串；AppendInt 追加到已有 []byte，热路径零分配 |
| 如何处理 ParseInt 的溢出错误？ | errors.As(err, &numErr) + errors.Is(numErr.Err, strconv.ErrRange) |
| ParseFloat 精度如何保证？ | 解析结果是最近的 IEEE 754 float64，往返 Format/Parse 不损失精度 |
| Go 数字字面量分隔符（1_000_000）ParseInt 支持吗？ | 支持（Go 1.13+）；`_` 被跳过，但不能在开头/结尾/连续出现 |
