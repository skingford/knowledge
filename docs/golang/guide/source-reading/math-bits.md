---
title: math/bits 源码精读
description: 精读 math/bits 的位操作实现，掌握硬件指令映射、位计数、前导零检测与高性能位运算技巧。
---

# math/bits：位操作源码精读

> 核心源码：`src/math/bits/bits.go`、`src/math/bits/bits_tables.go`
>
> 图例参考：
> - `GoAdvancedTopicDiagram`：`bits-intrinsics`

## 包结构图

```
math/bits 函数体系
══════════════════════════════════════════════════════════════════

  位计数：
  ├── OnesCount(x uint) int      ← popcount（置位数）
  ├── OnesCount8/16/32/64        ← 各尺寸版本
  └── 实现：POPCNT 指令（x86） / 查表（其他平台）

  前导零 / 尾随零：
  ├── LeadingZeros(x uint) int   ← 最高有效位前的 0 个数
  ├── TrailingZeros(x uint) int  ← 最低有效位后的 0 个数
  └── 实现：BSR/BSF 指令（x86）、CLZ/CTZ 指令（ARM）

  位长度：
  └── Len(x uint) int            ← ⌊log₂(x)⌋ + 1（0的位长为0）

  旋转：
  ├── RotateLeft(x uint, k int) uint  ← 循环左移 k 位
  └── RotateLeft8/16/32/64

  反转：
  └── Reverse(x uint) uint        ← 位序反转

  高性能算术：
  ├── Add(x, y, carry uint) (sum, carryOut uint)  ← 带进位加
  ├── Sub(x, y, borrow uint) (diff, borrowOut uint)
  ├── Mul(x, y uint) (hi, lo uint)                ← 128 位乘法结果
  └── Div(hi, lo, y uint) (quo, rem uint)          ← 128 位除法

  编译器内联（//go:linkname）：
  └── 所有函数都有对应的编译器 intrinsic
      → 直接映射到单条 CPU 指令

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/math/bits/bits.go
// OnesCount64：计算 uint64 中 1 的个数（popcount）
func OnesCount64(x uint64) int {
    // 如果编译器支持 POPCNT 指令，此函数被 intrinsic 替换
    // 否则使用分治算法（8步并行计算）
    const m0 = 0x5555555555555555 // 01010101...
    const m1 = 0x3333333333333333 // 00110011...
    const m2 = 0x0f0f0f0f0f0f0f0f // 00001111...
    const m3 = 0x00ff00ff00ff00ff
    const m4 = 0x0000ffff0000ffff

    x = x>>1&m0 + x&m0         // 2-bit 组：计算各组中1的个数
    x = x>>2&m1 + x&m1         // 4-bit 组
    x = x>>4&m2 + x&m2         // 8-bit 组
    x = x>>8&m3 + x&m3         // 16-bit 组
    x = x>>16&m4 + x&m4        // 32-bit 组
    x = x>>32 + x              // 64-bit
    return int(x & 0x7f)
}

// LeadingZeros64：前导零（等价于 64-Len64(x)）
func LeadingZeros64(x uint64) int {
    return 64 - Len64(x)
}

// Len64：位长度（编译器 intrinsic 映射到 BSR+1 或 CLZ）
func Len64(x uint64) (n int) {
    if x >= 1<<32 { x >>= 32; n = 32 }
    if x >= 1<<16 { x >>= 16; n += 16 }
    if x >= 1<<8  { x >>= 8;  n += 8  }
    return n + int(len8tab[x])
}
```

<GoAdvancedTopicDiagram kind="bits-intrinsics" />

---

## 二、代码示例

### 基础位操作

```go
import (
    "math/bits"
    "fmt"
)

func basics() {
    x := uint(0b1010_1100) // 172

    fmt.Println(bits.OnesCount(x))   // 4（有4个1）
    fmt.Println(bits.LeadingZeros(x)) // 56（64位系统）
    fmt.Println(bits.TrailingZeros(x))// 2（末尾2个0）
    fmt.Println(bits.Len(x))          // 8（最高有效位是第8位）

    // 旋转（循环移位）
    fmt.Printf("%08b\n", bits.RotateLeft8(0b10110001, 3))
    // 10001101（左移3位，高位移到低位）

    // 位反转
    fmt.Printf("%08b\n", bits.Reverse8(0b10110001))
    // 10001101（位序完全反转）
}
```

### 快速幂（利用位运算）

```go
// x^n，利用 bits.Len 计算需要的迭代次数
func fastPow(x, n uint64) uint64 {
    result := uint64(1)
    for n > 0 {
        if n&1 == 1 {
            result *= x
        }
        x *= x
        n >>= 1
    }
    return result
}

// bits.Len 用于确定最高有效位（跳过前导零）
func nextPowerOf2(n uint) uint {
    if n == 0 {
        return 1
    }
    if bits.OnesCount(n) == 1 {
        return n // 已经是 2 的幂
    }
    return 1 << bits.Len(n) // 上取整到 2 的幂
}

fmt.Println(nextPowerOf2(5))  // 8
fmt.Println(nextPowerOf2(8))  // 8
fmt.Println(nextPowerOf2(9))  // 16
```

### 高性能 128 位乘法

```go
// bits.Mul64 返回 128 位乘法结果（hi, lo）
// 无需 big.Int，直接使用 MULQ 指令
func multiply128(a, b uint64) (hi, lo uint64) {
    return bits.Mul64(a, b)
}

// 应用：大数乘法（每次处理 64 位）
func mul128Add(a, b, c uint64) (hi, lo uint64) {
    hi, lo = bits.Mul64(a, b)
    var carry uint64
    lo, carry = bits.Add64(lo, c, 0)
    hi, _ = bits.Add64(hi, 0, carry)
    return
}

// 带进位加法（用于多精度算术）
func add256(a, b [4]uint64) [4]uint64 {
    var result [4]uint64
    var carry uint64
    result[0], carry = bits.Add64(a[0], b[0], 0)
    result[1], carry = bits.Add64(a[1], b[1], carry)
    result[2], carry = bits.Add64(a[2], b[2], carry)
    result[3], carry = bits.Add64(a[3], b[3], carry)
    // carry 为 1 表示溢出
    _ = carry
    return result
}
```

### 哈希表桶索引（取模的位运算替代）

```go
// 当桶数是 2 的幂时，用 & 替代 % （快一倍）
type FastHashMap struct {
    buckets [][]int
    mask    uint // buckets长度 - 1（要求是2的幂-1）
}

func NewFastHashMap(capacity int) *FastHashMap {
    // 上取整到 2 的幂
    size := int(nextPowerOf2(uint(capacity)))
    return &FastHashMap{
        buckets: make([][]int, size),
        mask:    uint(size - 1),
    }
}

func (m *FastHashMap) index(key int) int {
    // & m.mask 等价于 % len(m.buckets)（位运算更快）
    return int(uint(key) & m.mask)
}
```

### 位图（Bitmap）操作

```go
// 用 uint64 数组实现高性能位图
type Bitmap struct {
    data []uint64
}

func NewBitmap(size int) *Bitmap {
    return &Bitmap{data: make([]uint64, (size+63)/64)}
}

func (b *Bitmap) Set(i int) {
    b.data[i/64] |= 1 << uint(i%64)
}

func (b *Bitmap) Clear(i int) {
    b.data[i/64] &^= 1 << uint(i%64)
}

func (b *Bitmap) Test(i int) bool {
    return b.data[i/64]&(1<<uint(i%64)) != 0
}

// 计算总置位数（OnesCount 加速）
func (b *Bitmap) Count() int {
    total := 0
    for _, word := range b.data {
        total += bits.OnesCount64(word)
    }
    return total
}

// 两个位图的交集大小（用于 Jaccard 相似度）
func (b *Bitmap) And(other *Bitmap) int {
    count := 0
    n := min(len(b.data), len(other.data))
    for i := 0; i < n; i++ {
        count += bits.OnesCount64(b.data[i] & other.data[i])
    }
    return count
}
```

### 对齐与填充计算

```go
// 计算内存对齐（编译器/协议实现中常用）
func alignUp(n, align uintptr) uintptr {
    // align 必须是 2 的幂
    return (n + align - 1) &^ (align - 1)
    // 等价于：(n + align - 1) / align * align
}

func alignDown(n, align uintptr) uintptr {
    return n &^ (align - 1)
}

// 判断是否 2 的幂（面试高频题）
func isPowerOf2(n uint) bool {
    return n != 0 && bits.OnesCount(n) == 1
    // 等价于：n != 0 && n&(n-1) == 0
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `bits.OnesCount64` 为什么不需要循环？ | 使用分治（parallel prefix）算法，6 步位运算处理 64 位；编译器将其替换为单条 POPCNT 指令（如果 CPU 支持）|
| `bits.Len(x)` 和 `bits.LeadingZeros(x)` 的关系？ | `Len(x) = 64 - LeadingZeros64(x)`（64位系统）；Len 等价于 ⌊log₂(x)⌋+1，LeadingZeros 则是 BSR 指令的直接映射 |
| `bits.Mul64` 如何实现 128 位结果？ | 在 amd64 上映射到 `MULQ` 指令（单指令 64×64→128bit）；其他平台用 4 次 32 位乘法模拟 |
| 为什么 `bits.RotateLeft` 比手写移位安全？ | Go 规范要求移位量必须是无符号整数；`bits.RotateLeft` 内部处理负数旋转（右移），且编译为单条 `ROLQ`/`RORQ` 指令 |
| 用 `&` 代替 `%` 的前提条件？ | 除数必须是 2 的幂；`n % (1<<k) == n & (1<<k - 1)`；常用于哈希表桶索引、环形 buffer 下标 |
| `bits.Add64` 相比手写加法的优势？ | 自动处理进位传播；编译器将其映射到 `ADDQ`+`ADCQ`（带进位加）指令对，实现精确的多精度算术 |
