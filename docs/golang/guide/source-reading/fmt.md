---
title: fmt 包源码精读
description: 精读 fmt.Fprintf/Sprintf 的反射驱动实现，理解 Stringer/GoStringer/Formatter 接口与格式化性能优化。
---

# fmt：格式化 I/O 源码精读

> 核心源码：`src/fmt/format.go`、`src/fmt/print.go`、`src/fmt/scan.go`
>
> 图例参考：这里补了 `Printf` 主流程图，并复用错误链图解释 `fmt.Errorf("%w", err)` 的包装语义，先看格式化分派顺序，再回头读 `print.go` / `errors.go`。

## 包结构图

<GoLanguageDiagram kind="fmt-printf-flow" />

```
fmt 包功能分层
══════════════════════════════════════════════════════════════════

  输出函数
  ├── fmt.Print / Println / Printf      ← 写到 os.Stdout
  ├── fmt.Fprint / Fprintln / Fprintf   ← 写到 io.Writer
  ├── fmt.Sprint / Sprintln / Sprintf   ← 返回 string
  └── fmt.Errorf                        ← 创建格式化错误（支持 %w）

  扫描函数
  ├── fmt.Scan / Scanf / Scanln         ← 从 os.Stdin 读
  └── fmt.Sscan / Sscanf / Fscan...    ← 从 string/io.Reader 读

  可实现的接口（用户自定义格式化）
  ├── fmt.Stringer       ← String() string          （%v/%s）
  ├── fmt.GoStringer     ← GoString() string        （%#v）
  ├── fmt.Formatter      ← Format(f State, verb rune)（完全控制）
  └── error              ← Error() string           （%v/%s/%q）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心格式化引擎

```go
// src/fmt/print.go（简化）
type pp struct {
    buf buffer      // 输出缓冲（[]byte，来自 sync.Pool）
    arg any         // 当前格式化的参数
    value reflect.Value
    fmt  fmtFlags   // 格式标志（#、+、-、空格、零填充等）
    ...
}

// pp 从 sync.Pool 获取，用完归还（减少堆分配）
var ppFree = sync.Pool{
    New: func() any { return new(pp) },
}
```

```
Fprintf 执行流程
══════════════════════════════════════════════════════════════════

  fmt.Fprintf(w, "name=%s age=%d", name, age)
       │
       ▼
  p := ppFree.Get()    ← 从 pool 取 pp（避免分配）
       │
       ▼
  p.doPrintf(format, args)
       │
       ├── 扫描格式字符串（字节级，无正则）
       │
       ├── 遇到普通字节 → 直接写 p.buf
       │
       └── 遇到 % verb：
               ├── 解析 flags/width/precision
               ├── 取下一个 arg
               │
               ├── 检查 arg 是否实现接口：
               │       Formatter → 调用 arg.Format(p, verb)
               │       Stringer（%v/%s）→ 调用 arg.String()
               │       error（%v/%s）→ 调用 arg.Error()
               │       GoStringer（%#v）→ 调用 arg.GoString()
               │
               └── 否则 → reflect 获取 Kind → 对应格式化函数
                       │  （Int/Uint/Float/String/Bool/Slice...）
                       └── 写 p.buf

  p.buf → w.Write(p.buf)    ← 一次性输出
  ppFree.Put(p)             ← 归还 pool

══════════════════════════════════════════════════════════════════
```

---

## 二、常用格式化动词

```
格式化动词速查
══════════════════════════════════════════════════════════════════

  通用
  %v   默认格式         {Alice 30}（struct）
  %+v  含字段名         {Name:Alice Age:30}
  %#v  Go 语法表示      main.Person{Name:"Alice", Age:30}
  %T   类型名           main.Person
  %%   字面百分号        %

  整数
  %d   十进制           42
  %b   二进制           101010
  %o   八进制           52
  %x   十六进制小写     2a
  %X   十六进制大写     2A
  %05d 宽度5零填充      00042
  %-5d 左对齐           42···

  浮点
  %f   小数             3.141593
  %e   科学计数         3.141593e+00
  %g   最短表示         3.141593（自动选 %f 或 %e）
  %.2f 精度2位          3.14

  字符串
  %s   原始字符串       hello
  %q   带双引号转义     "hello\nworld"
  %x   十六进制编码     68656c6c6f

  指针
  %p   十六进制地址     0xc000018050

══════════════════════════════════════════════════════════════════
```

---

## 三、自定义格式化接口

### Stringer（最常用）

```go
type Duration struct {
    hours, minutes, seconds int
}

// 实现 fmt.Stringer，%v / %s 时自动调用
func (d Duration) String() string {
    return fmt.Sprintf("%02d:%02d:%02d", d.hours, d.minutes, d.seconds)
}

d := Duration{1, 30, 0}
fmt.Println(d)          // 01:30:00
fmt.Printf("%v\n", d)  // 01:30:00
fmt.Printf("%s\n", d)  // 01:30:00
```

### Formatter（完全控制输出）

```go
type Matrix [][]float64

func (m Matrix) Format(f fmt.State, verb rune) {
    switch verb {
    case 'v', 's':
        for i, row := range m {
            if i > 0 {
                f.Write([]byte("\n"))
            }
            f.Write([]byte("["))
            for j, v := range row {
                if j > 0 {
                    f.Write([]byte(", "))
                }
                fmt.Fprintf(f, "%.2f", v)
            }
            f.Write([]byte("]"))
        }
    default:
        fmt.Fprintf(f, "%%!%c(Matrix)", verb)
    }
}

m := Matrix{{1.1, 2.2}, {3.3, 4.4}}
fmt.Printf("%v\n", m)
// [1.10, 2.20]
// [3.30, 4.40]
```

---

## 四、fmt.Errorf 与 %w

<GoLanguageDiagram kind="error-chain" />

```go
// src/fmt/errors.go
// %w 是 Errorf 的特殊动词，将 err 包装到返回的 error 中
func Errorf(format string, a ...any) error {
    p := newPrinter()
    p.wrapErrs = true   // 开启 %w 支持
    p.doPrintf(format, a)
    s := string(p.buf)
    var err error
    switch len(p.wrappedErrs) {
    case 0:
        err = errors.New(s)
    case 1:
        w := &wrapError{msg: s}
        w.err, _ = a[p.wrappedErrs[0]].(error)
        err = w
    default:
        // 多个 %w（Go 1.20+）：返回 *wrapErrors，实现 Unwrap() []error
        ...
    }
    return err
}

// 使用
if err := db.Query(sql); err != nil {
    return fmt.Errorf("query users: %w", err) // 保留 err 用于 errors.Is/As
}
```

---

## 五、性能：sync.Pool 复用 pp

```
fmt 包的性能优化设计
══════════════════════════════════════════════════════════════════

  ① sync.Pool 复用 pp 结构体
    → 减少 GC 压力（高频格式化场景）
    → 每次 Printf 不分配新 pp

  ② buffer（[]byte）随 pp 一起复用
    → 避免 strings.Builder 的二次分配

  ③ 格式字符串字节级扫描
    → 无正则、无 tokenize，极快

  ⚠️ 注意：Sprintf 最终 string(buf) 仍有 1 次分配（string 不可变）
           Fprintf 直接写 io.Writer，无 string 分配

  生产建议：
  ├── 高频热路径：用 strconv.AppendXxx 代替 Sprintf
  ├── 日志构建：用 slog 或 zap（内部也用 sync.Pool）
  └── 一般格式化：Sprintf 可读性好，开销可接受

══════════════════════════════════════════════════════════════════
```

---

## 六、代码示例

### 格式化输出对比

```go
type User struct {
    Name  string
    Age   int
    Email string
}

u := User{"Alice", 30, "alice@example.com"}

fmt.Printf("%v\n",  u) // {Alice 30 alice@example.com}
fmt.Printf("%+v\n", u) // {Name:Alice Age:30 Email:alice@example.com}
fmt.Printf("%#v\n", u) // main.User{Name:"Alice", Age:30, Email:"alice@example.com"}
fmt.Printf("%T\n",  u) // main.User
```

### Sprintf vs 手动拼接性能

```go
// ❌ Sprintf：反射 + 格式解析，适合可读性优先
id := fmt.Sprintf("user:%d", userID)

// ✅ 手动：零反射，适合热路径
id := "user:" + strconv.Itoa(userID)

// ✅ AppendXxx：零分配热路径
buf := make([]byte, 0, 16)
buf = append(buf, "user:"...)
buf = strconv.AppendInt(buf, int64(userID), 10)
id := string(buf)
```

### 格式化宽度与对齐

```go
// 对齐表格输出
headers := []string{"Name", "Age", "Score"}
fmt.Printf("%-10s %-5s %-8s\n", headers[0], headers[1], headers[2])
// Name       Age   Score

rows := [][3]any{{"Alice", 30, 98.5}, {"Bob", 25, 87.3}}
for _, r := range rows {
    fmt.Printf("%-10s %-5d %-8.1f\n", r[0], r[1], r[2])
}
// Alice      30    98.5
// Bob        25    87.3
```

### fmt.Sscanf 解析结构化文本

```go
// 解析日志行："2024-01-01 12:00:00 INFO server started"
line := "2024-01-01 12:00:00 INFO server started"
var date, time_, level, msg string
n, err := fmt.Sscanf(line, "%s %s %s %s", &date, &time_, &level, &msg)
// n=4, err=nil（注意 Sscanf 按空格分词，msg 只取第一个词）

// 解析固定格式
var year, month, day int
fmt.Sscanf("2024-01-15", "%d-%d-%d", &year, &month, &day)
// year=2024, month=1, day=15
```

### 实现 Stringer 的常见模式

```go
// 枚举类型的 Stringer
type Status int

const (
    StatusPending Status = iota
    StatusRunning
    StatusDone
    StatusFailed
)

var statusNames = map[Status]string{
    StatusPending: "pending",
    StatusRunning: "running",
    StatusDone:    "done",
    StatusFailed:  "failed",
}

func (s Status) String() string {
    if name, ok := statusNames[s]; ok {
        return name
    }
    return fmt.Sprintf("Status(%d)", int(s))
}

fmt.Println(StatusRunning) // running
fmt.Printf("%v\n", StatusFailed) // failed
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| fmt.Printf 如何识别类型？ | 先检查接口（Formatter/Stringer/error），再用 reflect.TypeOf 获取 Kind 分发 |
| fmt.Sprintf 为什么比 strconv 慢？ | 格式字符串扫描 + 反射类型识别 + 多次接口检查；strconv 直接调用专用函数 |
| sync.Pool 在 fmt 中的作用？ | 复用 pp 结构体（含 buffer）；每次 Printf 不需要分配新对象 |
| %w 和 %v 包装 error 的区别？ | %v 只展开字符串；%w 额外在返回的 error 中保存原始 error，支持 errors.Is/As 穿透 |
| Formatter 接口的适用场景？ | 需要完全控制格式化输出（如矩阵、自定义进制、带颜色的终端输出）时实现 |
| Fprintf 比 Sprintf 快在哪？ | Fprintf 直接写 io.Writer 无需最终 string 转换；Sprintf 末尾有 string(buf) 分配 |
