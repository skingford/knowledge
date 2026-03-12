---
title: regexp 包源码精读
description: 精读 Go regexp 包的 NFA 引擎设计、编译流程与性能特性，理解为什么 Go 正则保证线性时间复杂度。
---

# regexp：正则引擎源码精读

> 核心源码：`src/regexp/regexp.go`、`src/regexp/syntax/`、`src/regexp/exec.go`

## 包结构图

```
regexp 包架构
══════════════════════════════════════════════════════════════════

  用户 API 层（regexp 包）
  ├── regexp.Compile(expr)         ← 编译正则（返回 *Regexp）
  ├── regexp.MustCompile(expr)     ← 编译失败则 panic
  ├── regexp.MatchString(pat, s)   ← 一次性匹配（内部编译）
  └── *Regexp 方法集
        ├── Match / MatchString     ← 是否匹配
        ├── Find / FindString       ← 找第一个匹配
        ├── FindAll / FindAllString ← 找所有匹配（-1=全部）
        ├── FindSubmatch            ← 含捕获组
        ├── ReplaceAll / ReplaceAllString
        └── Split

  语法层（regexp/syntax 包）
  ├── syntax.Parse(expr, flags)    ← 词法/语法分析 → AST
  └── syntax.Compile(re)           ← AST → Prog（字节码指令集）

  执行引擎层（regexp 内部）
  ├── exec.go: machine struct      ← NFA 模拟执行器
  ├── backtrack.go                 ← 短字符串的回溯引擎（优化）
  └── onepass.go                   ← 单程（DFA-like）引擎（无歧义时）

══════════════════════════════════════════════════════════════════
```

---

## 一、Go 正则的核心承诺：线性时间

```
Go regexp vs PCRE 的根本区别
══════════════════════════════════════════════════════════════════

  PCRE（PHP/Python/Perl）              Go regexp
  ┌─────────────────────────────────────────────────────────────┐
  │  回溯 NFA（支持反向引用）            Thompson NFA（无反向引用）│
  │  最坏 O(2^n) 时间                   保证 O(n) 时间           │
  │  可能被 ReDoS 攻击                  不会被 ReDoS             │
  │  支持: (?P<name>) \1 lookahead      不支持: 反向引用/零宽断言 │
  └─────────────────────────────────────────────────────────────┘

  代价：不支持反向引用（\1）和 lookahead/lookbehind

  ReDoS 示例（Go 安全）：
  r := regexp.MustCompile(`^(a+)+$`)  // Go 仍是 O(n)
  r.MatchString(strings.Repeat("a", 50) + "!")
  // PCRE: 指数级时间（可挂死服务器）
  // Go:   线性时间（安全）

══════════════════════════════════════════════════════════════════
```

---

## 二、编译流程

```
regexp.Compile("a(b|c)+d") 编译流程
══════════════════════════════════════════════════════════════════

  ① syntax.Parse("a(b|c)+d", flags)
       → 词法分析（rune 级扫描）
       → 构建 AST：
           Concat[
             Literal('a'),
             Repeat(+)[
               Capture(1)[
                 Alternate[Literal('b'), Literal('c')]
               ]
             ],
             Literal('d')
           ]

  ② syntax.Compile(re *syntax.Regexp)
       → AST → NFA 字节码 Prog
       → 指令集（inst）：
           OpLiteral / OpAlt / OpCapture
           OpStar / OpPlus / OpMatch ...

  ③ regexp.compile(prog *syntax.Prog)
       → 包装为 *Regexp
       → 预计算 prefix（固定前缀，用于快速跳过）
       → 预计算 onepass（是否可用单程引擎）

══════════════════════════════════════════════════════════════════
```

---

## 三、Thompson NFA 执行

```go
// src/regexp/exec.go
type machine struct {
    re       *Regexp
    prog     *syntax.Prog
    op       *onePassProg  // 单程引擎（如适用）
    maxBitStateLen int

    // NFA 并行状态集
    q0, q1  queue          // 当前/下一个状态集合
    pool    []*thread       // 线程池
    matched bool
    matchcap []int          // 捕获组结果
}
```

```
Thompson NFA 并行模拟原理
══════════════════════════════════════════════════════════════════

  传统回溯 NFA：            Thompson NFA（Go）：
  ─────────────────────      ─────────────────────────────────
  逐个尝试路径               所有可能路径同时推进
  失败则回溯                 不回溯，状态集并行前进

  示例：匹配 "ab|ac" 对 "ac"
  ─────────────────────────────────────────────────────────────
  回溯：尝试 ab → 'b'≠'c' → 回退 → 尝 ac → 'c'='c' → 成功
  Thompson：{ s0, s1_ab, s1_ac } → 输入'a' → { s2_ab, s2_ac }
            → 输入'c' → { s3_ac(match) }

  时间复杂度：O(n × m)，n=输入长度，m=NFA 状态数（即正则复杂度）
  空间复杂度：O(m)（状态集大小）

══════════════════════════════════════════════════════════════════
```

---

## 四、三种执行引擎的选择策略

```
regexp 引擎选择（自动）
══════════════════════════════════════════════════════════════════

  编译时分析正则，选择最优引擎：

  ① onepass 引擎（最快）
    └── 条件：正则无歧义（任意状态只有一条前进路径）
          例：`^[a-z]+$`、`\d+\.\d+`
          → DFA-like，无状态集管理开销

  ② backtrack 引擎（短字符串）
    └── 条件：输入短（< 512 字节）+ 有捕获组
          → 回溯，但对短输入是 O(1) 实践
          → 避免 Thompson NFA 的状态集开销

  ③ Thompson NFA（通用）
    └── 条件：长字符串 / 复杂正则
          → 保证 O(n×m) 时间

══════════════════════════════════════════════════════════════════
```

---

## 五、Regexp 方法族

```
Find 方法族说明
══════════════════════════════════════════════════════════════════

  方法命名规律：
  Find[All][String][Submatch][Index]

  Find        → 找第一个匹配的 []byte
  FindString  → 找第一个匹配的 string
  FindAll     → 找所有匹配（n=-1 表示全部）
  Submatch    → 含捕获组（返回 [][]byte）
  Index       → 返回匹配的字节位置 [start, end]

  示例：
  r := regexp.MustCompile(`(\w+)@(\w+)\.(\w+)`)
  s := "alice@example.com bob@test.org"

  r.FindString(s)           // "alice@example.com"
  r.FindAllString(s, -1)    // ["alice@example.com", "bob@test.org"]
  r.FindStringSubmatch(s)   // ["alice@example.com","alice","example","com"]
  r.FindAllStringSubmatch(s, -1) // 所有匹配的捕获组

══════════════════════════════════════════════════════════════════
```

---

## 六、代码示例

### 编译与复用（生产关键）

```go
// ✅ 正确：包级变量，编译一次
var emailRegex = regexp.MustCompile(
    `^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`,
)

// ❌ 错误：每次调用都编译，性能极差
func validateEmail(email string) bool {
    r := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@...`)
    return r.MatchString(email)
}

// ✅ 正确用法
func validateEmail(email string) bool {
    return emailRegex.MatchString(email)
}
```

### 捕获组提取

```go
var logLine = regexp.MustCompile(
    `(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) (\w+) (.+)`,
)

func parseLog(line string) (date, time_, level, msg string, ok bool) {
    m := logLine.FindStringSubmatch(line)
    if m == nil {
        return "", "", "", "", false
    }
    // m[0]=完整匹配，m[1..4]=捕获组
    return m[1], m[2], m[3], m[4], true
}
```

### 命名捕获组

```go
var dateRe = regexp.MustCompile(
    `(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})`,
)

func extractDate(s string) map[string]string {
    match := dateRe.FindStringSubmatch(s)
    if match == nil {
        return nil
    }
    result := make(map[string]string)
    for i, name := range dateRe.SubexpNames() {
        if i > 0 && name != "" {
            result[name] = match[i]
        }
    }
    return result
}
// "2024-01-15" → {"year":"2024","month":"01","day":"15"}
```

### 替换

```go
// ReplaceAll：将所有匹配替换
r := regexp.MustCompile(`\b\d{4}-\d{4}-\d{4}-\d{4}\b`)
masked := r.ReplaceAllString(text, "****-****-****-****")

// ReplaceAllFunc：动态替换
r2 := regexp.MustCompile(`\$\{(\w+)\}`)
result := r2.ReplaceAllStringFunc(template, func(match string) string {
    key := match[2 : len(match)-1] // 去掉 ${ 和 }
    if val, ok := vars[key]; ok {
        return val
    }
    return match
})
```

### 大文本扫描（FindReaderIndex）

```go
// 对大文件用 FindReaderIndex 避免加载全文到内存
func countMatches(r io.RuneReader, pattern string) int {
    re := regexp.MustCompile(pattern)
    var count int
    // FindReaderIndex 从 RuneReader 读取，流式处理
    for re.FindReaderIndex(r) != nil {
        count++
    }
    return count
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| Go regexp 为什么不会 ReDoS？ | 用 Thompson NFA，所有路径并行推进，时间 O(n×m)，不回溯 |
| Thompson NFA 的代价是什么？ | 不支持反向引用（\1）和 lookahead/lookbehind；状态集需要 O(m) 空间 |
| MustCompile 和 Compile 的区别？ | MustCompile 编译失败则 panic，适合包级变量；Compile 返回 error |
| 为什么正则要编译为包级变量？ | Compile 耗时较高（词法解析+NFA构建）；*Regexp 并发安全，可复用 |
| Go 正则支持 lookahead 吗？ | 不支持；需要 lookahead 的场景用 strings 手动处理 |
| FindSubmatch 返回的 m[0] 是什么？ | 完整匹配（等价于 FindString）；m[1]..m[n] 是各捕获组 |
