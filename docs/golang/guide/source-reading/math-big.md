---
title: math/big 源码精读
description: 精读 math/big 的任意精度算术实现，掌握 Int/Float/Rat 的内存布局、大数运算原理与密码学应用场景。
---

# math/big：任意精度算术源码精读

> 核心源码：`src/math/big/int.go`、`src/math/big/nat.go`、`src/math/big/float.go`
>
> 图例参考：
> - `GoAdvancedTopicDiagram`：`math-big-layout`

## 包结构图

```
math/big 类型体系
══════════════════════════════════════════════════════════════════

  big.Int    ← 任意精度有符号整数
  ├── neg bool        ← 符号位
  └── abs nat         ← 无符号大数（[]Word，小端序）
      Word = uint（64位平台为 uint64）

  big.Float  ← 任意精度浮点数（IEEE 754 扩展）
  ├── prec uint32     ← 精度（位数）
  ├── mode RoundingMode
  ├── acc  Accuracy   ← 上次运算的精度损失
  ├── form form       ← zero/finite/inf
  ├── neg  bool
  └── mant nat        ← 尾数
       exp  int32     ← 指数

  big.Rat    ← 有理数（分数）
  ├── a big.Int       ← 分子
  └── b nat           ← 分母（已约分）

  nat（无符号大数）核心运算：
  ├── add / sub       ← O(n)
  ├── mul             ← O(n²) 或 Karatsuba O(n^1.585)
  ├── div             ← 长除法
  ├── modSqrt         ← 模平方根（密码学）
  └── expNN           ← 快速幂（平方-乘法）O(log e)

══════════════════════════════════════════════════════════════════
```

<GoAdvancedTopicDiagram kind="math-big-layout" />

---

## 一、核心设计

::: details 点击展开代码：一、核心设计
```go
// src/math/big/int.go（简化）
type Int struct {
    neg bool // 正负号
    abs nat  // 绝对值（[]Word）
}

// nat 是 []Word 的别名，小端序存储（低位在前）
// 例：数值 2^64 + 1 在 64 位平台存储为 nat{1, 1}
//      Word[0]=1（低 64 位），Word[1]=1（高 64 位）

// 乘法自动选择算法：
// - 小数：传统 O(n²)
// - 中等：Karatsuba（约 40 Word 以上）
// - 大数：3-way Toom-Cook 或 FFT（未来版本）
```
:::

---

## 二、代码示例

### 基础大数运算

::: details 点击展开代码：基础大数运算
```go
import "math/big"

func basics() {
    // 创建方式
    a := new(big.Int).SetInt64(1000000000000)
    b, _ := new(big.Int).SetString("99999999999999999999999999", 10)

    // 四则运算（结果写入接收者，复用内存）
    sum := new(big.Int).Add(a, b)
    diff := new(big.Int).Sub(b, a)
    prod := new(big.Int).Mul(a, b)
    quot, rem := new(big.Int).DivMod(b, a, new(big.Int))

    fmt.Println(sum, diff, prod, quot, rem)

    // 比较
    cmp := a.Cmp(b) // -1, 0, 1
    fmt.Println(cmp)

    // 位操作
    bits := new(big.Int).And(a, b)
    _ = bits
}
```
:::

### 斐波那契数列（演示大数性能）

::: details 点击展开代码：斐波那契数列（演示大数性能）
```go
// 迭代方式，避免递归栈溢出，复用 big.Int 内存
func fibonacci(n int) *big.Int {
    if n <= 1 {
        return big.NewInt(int64(n))
    }
    a, b := big.NewInt(0), big.NewInt(1)
    tmp := new(big.Int)
    for i := 2; i <= n; i++ {
        tmp.Add(a, b)
        a.Set(b)
        b.Set(tmp)
    }
    return b
}

// Fib(1000) 约有 209 位，Fib(10000) 约有 2090 位
func main() {
    result := fibonacci(10000)
    fmt.Printf("Fib(10000) 位数: %d\n", len(result.String()))
    // 输出：Fib(10000) 位数: 2090
}
```
:::

### 密码学：RSA 模幂运算

::: details 点击展开代码：密码学：RSA 模幂运算
```go
// math/big 最重要的密码学用途：模幂运算 m^e mod n
func rsaEncrypt(m, e, n *big.Int) *big.Int {
    // Exp 内部使用"平方-乘法"算法，O(log e) 次大数乘法
    return new(big.Int).Exp(m, e, n)
}

// 生成大素数（RSA 密钥生成核心）
func generatePrime(bits int) (*big.Int, error) {
    return rand.Prime(rand.Reader, bits)
    // 内部：随机生成 → Miller-Rabin 素性测试（20轮）
}

// 简化 RSA 演示（实际应用请使用 crypto/rsa）
func rsaDemo() {
    // 生成两个 512 位素数（演示用，实际需 2048 位以上）
    p, _ := rand.Prime(rand.Reader, 512)
    q, _ := rand.Prime(rand.Reader, 512)

    n := new(big.Int).Mul(p, q)     // n = p*q
    one := big.NewInt(1)
    pm1 := new(big.Int).Sub(p, one) // p-1
    qm1 := new(big.Int).Sub(q, one) // q-1
    phi := new(big.Int).Mul(pm1, qm1) // φ(n) = (p-1)(q-1)

    e := big.NewInt(65537) // 常用公钥指数

    // 私钥 d = e^(-1) mod φ(n)
    d := new(big.Int).ModInverse(e, phi)

    // 加密: c = m^e mod n
    m := big.NewInt(42)
    c := rsaEncrypt(m, e, n)

    // 解密: m = c^d mod n
    decoded := rsaEncrypt(c, d, n)
    fmt.Println("原文:", m, "解密:", decoded)
}
```
:::

### 精确小数运算（big.Rat）

::: details 点击展开代码：精确小数运算（big.Rat）
```go
// big.Rat 适合需要精确分数的场景（如金融计算）
func rationalArithmetic() {
    // 0.1 + 0.2 的精确结果
    a := new(big.Rat).SetFloat64(0.1)
    b := new(big.Rat).SetFloat64(0.2)
    sum := new(big.Rat).Add(a, b)
    fmt.Println(sum)       // 3/10
    fmt.Println(sum.FloatString(20)) // 0.30000000000000000000

    // 自定义分数
    r := new(big.Rat).SetFrac(
        big.NewInt(1),   // 分子
        big.NewInt(3),   // 分母
    )
    fmt.Println(r.FloatString(30)) // 0.333333333333333333333333333333
}
```
:::

### 高精度浮点（big.Float）

::: details 点击展开代码：高精度浮点（big.Float）
```go
// big.Float 支持可配置精度，适合科学计算
func highPrecisionPi() {
    // 计算 π 到 200 位有效数字（Bailey–Borwein–Plouffe 公式简化版）
    prec := uint(700) // 位精度（约 210 位十进制数）

    // 用 math.Pi 初始化（仅 64 位精度）
    pi := new(big.Float).SetPrec(prec).SetFloat64(math.Pi)

    // Chudnovsky 算法（实际高精度 π 计算）
    // 这里展示 big.Float 基本操作
    two := new(big.Float).SetPrec(prec).SetInt64(2)
    sqrt2 := new(big.Float).SetPrec(prec).Sqrt(two)

    fmt.Printf("√2 ≈ %s\n", sqrt2.Text('f', 50))
    fmt.Printf("π  ≈ %s\n", pi.Text('f', 50))
}

// big.Float 精度控制
func floatPrecision() {
    x := new(big.Float).SetPrec(256).SetFloat64(1.0 / 3.0)
    y := new(big.Float).SetPrec(256).SetFloat64(3.0)

    result := new(big.Float).SetPrec(256).Mul(x, y)
    fmt.Println(result.Text('f', 50)) // 接近但不等于 1.0（精度损失）
    fmt.Println(result.Acc())         // Below / Above / Exact
}
```
:::

### 性能优化：复用 big.Int

::: details 点击展开代码：性能优化：复用 big.Int
```go
// ❌ 低效：每次运算都分配新 big.Int
func slowFactorial(n int) *big.Int {
    result := big.NewInt(1)
    for i := 2; i <= n; i++ {
        result = new(big.Int).Mul(result, big.NewInt(int64(i)))
        // ↑ 每次 Mul 都分配新对象
    }
    return result
}

// ✅ 高效：复用已分配的 big.Int
func fastFactorial(n int) *big.Int {
    result := big.NewInt(1)
    tmp := new(big.Int) // 预分配一个临时对象
    for i := 2; i <= n; i++ {
        tmp.SetInt64(int64(i))
        result.Mul(result, tmp) // result = result * tmp（就地操作）
    }
    return result
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| big.Int 的内存布局是什么？ | `neg bool` 符号位 + `abs nat`（`[]Word`，小端序，Word = uint64 on 64-bit）|
| 大数乘法的时间复杂度？ | 小数：O(n²)；中等（约 40 Word+）：Karatsuba O(n^1.585)；内部自动选择算法 |
| big.Int 操作为什么写成 `z.Add(x, y)`？ | 接收者复用内存（减少分配）；Go 中无运算符重载，链式写法 `z.Add(z, y)` 合法（原地修改）|
| big.Rat 和 big.Float 的区别？ | Rat 是精确有理数（分子/分母，无误差）；Float 是可配置精度浮点（有舍入误差，但精度可调）|
| math/big 在密码学中的核心用途？ | RSA 的模幂 `Exp(m,e,n)` 和模逆 `ModInverse`；内部用 Montgomery 乘法优化 |
| 如何判断 big.Int 是否为素数？ | `big.Int.ProbablyPrime(n)` —— Miller-Rabin 测试 n 轮，n=20 时误判概率 < 4^(-20) |
