---
title: time 包源码精读
description: 精读 time 包的时间表示、格式化解析、Duration 计算与单调时钟机制，掌握 Go 时间处理的完整知识体系。
---

# time：时间处理源码精读

> 核心源码：`src/time/time.go`、`src/time/format.go`、`src/time/zoneinfo.go`
>
> 图例参考：
> - `GoRuntimeDiagram`：`time-dual-clock`、`timer-heap`
> - `GoEngineeringDiagram`：`benchmark-reading`

## 包结构图

```
time 包全景
══════════════════════════════════════════════════════════════════

  核心类型：
  ├── time.Time     ← 时刻（wall + mono + loc）
  ├── time.Duration ← 时间段（int64 纳秒）
  └── time.Location ← 时区（*zoneinfo.Location）

  时刻操作：
  ├── time.Now()              ← 当前时间（含单调时钟）
  ├── time.Since(t) / Until   ← 经过/剩余时间
  ├── t.Add(d) / t.Sub(t2)    ← 加减运算
  ├── t.Equal / Before / After ← 比较（忽略单调时钟）
  └── t.Truncate / Round       ← 对齐到 Duration 边界

  格式化与解析：
  ├── t.Format("2006-01-02 15:04:05")  ← 参考时间
  ├── t.Format(time.RFC3339)           ← 标准格式常量
  └── time.Parse("layout", "value")   ← 解析字符串

  定时器（用户层）：
  ├── time.After(d)          ← 一次性 channel（易泄漏，慎用）
  ├── time.NewTimer(d)       ← 可复用定时器
  └── time.NewTicker(d)      ← 周期定时器

  时区：
  ├── time.Local             ← 本地时区
  ├── time.UTC               ← UTC 时区
  └── time.LoadLocation("Asia/Shanghai") ← 加载 IANA 时区

══════════════════════════════════════════════════════════════════
```

---

## 一、Time 内存结构

```go
// src/time/time.go
type Time struct {
    wall uint64  // 高位 1: hasMonotonic; 低位: wall 秒/纳秒
    ext  int64   // hasMonotonic=1: 单调时钟（纳秒，相对进程启动）
                 // hasMonotonic=0: 完整 Unix 秒数偏移
    loc  *Location
}

// 双时钟设计：
// ┌─────────────────────────────────────────────────────┐
// │  Wall Clock（挂钟时间）                              │
// │  → 受 NTP、闰秒、系统时钟调整影响                  │
// │  → 用于显示、格式化、存储                           │
// │                                                     │
// │  Monotonic Clock（单调时钟）                         │
// │  → 只增不减，不受系统时间调整影响                  │
// │  → 用于计时、超时、间隔测量                         │
// │  → time.Now() 自动携带                             │
// │  → t.Round/Equal/Format 会丢弃单调时钟              │
// └─────────────────────────────────────────────────────┘

// time.Since 使用单调时钟（更准确）
start := time.Now()       // 含单调时钟
time.Sleep(time.Second)
elapsed := time.Since(start) // 用 mono 计算，不受 NTP 影响
```

<GoRuntimeDiagram kind="time-dual-clock" />

---

## 二、参考时间（格式化关键）

```
Go 时间格式化参考时间
══════════════════════════════════════════════════════════════════

  参考时刻：Mon Jan 2 15:04:05 MST 2006
  对应数字： 1   2  3  4  5   6  7（年份末尾）

  各组件记忆法：
  ├── 年：2006
  ├── 月：01（数字） / Jan（缩写） / January（全名）
  ├── 日：02（数字） / _2（空格填充）
  ├── 时：15（24小时） / 3（12小时）
  ├── 分：04
  ├── 秒：05
  ├── 毫秒：.000 / .999（去除末尾零）
  ├── 时区：MST / -0700 / -07:00 / Z0700 / Z07:00
  └── 星期：Mon / Monday

  常用标准格式（预定义常量）：
  ├── time.RFC3339     = "2006-01-02T15:04:05Z07:00"
  ├── time.RFC3339Nano = "2006-01-02T15:04:05.999999999Z07:00"
  ├── time.RFC822      = "02 Jan 06 15:04 MST"
  ├── time.DateTime    = "2006-01-02 15:04:05"  （Go 1.20+）
  ├── time.DateOnly    = "2006-01-02"           （Go 1.20+）
  └── time.TimeOnly    = "15:04:05"             （Go 1.20+）

══════════════════════════════════════════════════════════════════
```

---

## 三、Duration 设计

```go
// time.Duration = int64（单位：纳秒）
type Duration int64

const (
    Nanosecond  Duration = 1
    Microsecond          = 1000 * Nanosecond
    Millisecond          = 1000 * Microsecond
    Second               = 1000 * Millisecond
    Minute               = 60 * Second
    Hour                 = 60 * Minute
)

// Duration 可读性极强
timeout := 5 * time.Second + 500 * time.Millisecond // 5500ms
d.Hours()     // float64
d.Minutes()   // float64
d.Seconds()   // float64
d.Milliseconds() // int64（Go 1.13+）
d.String()    // "5.5s"（自动单位）
```

---

## 四、代码示例

### 时间格式化与解析

```go
now := time.Now()

// 格式化
fmt.Println(now.Format("2006-01-02 15:04:05"))       // 2026-03-12 10:30:00
fmt.Println(now.Format(time.RFC3339))                 // 2026-03-12T10:30:00+08:00
fmt.Println(now.Format("01/02/2006"))                 // 03/12/2026
fmt.Println(now.Format("Monday, January 2, 2006"))    // Thursday, March 12, 2026

// 解析
t, err := time.Parse("2006-01-02", "2026-03-12")
if err != nil {
    log.Fatal(err)
}

// 带时区解析（time.ParseInLocation）
loc, _ := time.LoadLocation("Asia/Shanghai")
t2, _ := time.ParseInLocation("2006-01-02 15:04:05", "2026-03-12 10:30:00", loc)

// Unix 时间戳转换
unix := now.Unix()                          // 秒级时间戳
unixMilli := now.UnixMilli()               // 毫秒（Go 1.17+）
unixNano := now.UnixNano()                 // 纳秒
t3 := time.Unix(unix, 0)                   // 时间戳 → Time
t4 := time.UnixMilli(unixMilli)            // Go 1.17+
```

### 时间计算

```go
now := time.Now()

// 加减
tomorrow := now.Add(24 * time.Hour)
lastWeek := now.Add(-7 * 24 * time.Hour)

// 差值
diff := tomorrow.Sub(now) // time.Duration
fmt.Println(diff.Hours()) // 24

// 日期操作
year, month, day := now.Date()
hour, min, sec  := now.Clock()

// 月初/月末
firstDay := time.Date(year, month, 1, 0, 0, 0, 0, loc)
lastDay  := firstDay.AddDate(0, 1, -1) // 下月1号 - 1天

// 对齐（Truncate / Round）
// 对齐到小时整点
hourStart := now.Truncate(time.Hour)
// 四舍五入到最近分钟
rounded := now.Round(time.Minute)

// 比较
if t1.Before(t2) { /* t1 < t2 */ }
if t1.Equal(t2)  { /* t1 == t2（考虑时区） */ }
```

### 时区处理

```go
// 加载时区（需要 tzdata）
loc, err := time.LoadLocation("Asia/Shanghai")
if err != nil {
    log.Fatal(err)
}

now := time.Now().In(loc)
fmt.Println(now.Format("2006-01-02 15:04:05 MST"))

// UTC ↔ 本地转换
utcTime := time.Now().UTC()
localTime := utcTime.In(loc)
fmt.Println(utcTime.Equal(localTime)) // true（同一时刻，不同表示）

// Docker/K8s 中嵌入时区数据
import _ "time/tzdata" // Go 1.15+，不依赖系统 tzdata 文件

// 时区偏移量
name, offset := now.Zone() // "CST", 28800（+8h 的秒数）
```

### 定时器正确用法

<GoRuntimeDiagram kind="timer-heap" />

```go
// ✅ NewTimer（可复用、可取消）
timer := time.NewTimer(5 * time.Second)
select {
case <-timer.C:
    fmt.Println("定时触发")
case <-ctx.Done():
    timer.Stop() // 必须 Stop，否则 goroutine 泄漏
}

// ✅ NewTicker（周期执行）
ticker := time.NewTicker(time.Second)
defer ticker.Stop() // 必须 Stop！

for {
    select {
    case t := <-ticker.C:
        doWork(t)
    case <-ctx.Done():
        return
    }
}

// ⚠️ time.After 在 select 中的泄漏问题
for {
    select {
    case <-ch:
        process()
    case <-time.After(30 * time.Second): // ❌ 每次循环都新建 timer，旧 timer 不会被 GC
        timeout()
    }
}

// ✅ 正确写法：循环外创建 timer 并 Reset
timer := time.NewTimer(30 * time.Second)
for {
    timer.Reset(30 * time.Second)
    select {
    case <-ch:
        process()
    case <-timer.C:
        timeout()
    }
}
```

### 性能计时（Benchmark 精确测量）

<GoEngineeringDiagram kind="benchmark-reading" />

```go
func BenchmarkProcess(b *testing.B) {
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        process()
    }
}

// 手动计时（更灵活）
func measure(name string, fn func()) {
    start := time.Now()
    fn()
    elapsed := time.Since(start) // 使用单调时钟，更准确
    fmt.Printf("%s 耗时: %v\n", name, elapsed)
}

// 高精度计时（纳秒级）
start := time.Now()
// ... 操作 ...
ns := time.Since(start).Nanoseconds()
```

### 超时控制（time + context 组合）

```go
// context.WithTimeout 内部就是用 time.AfterFunc 实现的
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

// 自定义带重试的超时
func withRetry(ctx context.Context, maxAttempts int, fn func() error) error {
    backoff := 100 * time.Millisecond
    for i := 0; i < maxAttempts; i++ {
        if err := fn(); err == nil {
            return nil
        }
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(backoff):
            backoff = min(backoff*2, 30*time.Second) // 指数退避，最大 30s
        }
    }
    return fmt.Errorf("超过最大重试次数 %d", maxAttempts)
}
```

---

## 核心要点

| 问题 | 要点 |
|------|------|
| Go 为何用 "2006-01-02 15:04:05" 作为参考时间？ | 这是一个特殊时刻（2006年1月2日 15时04分05秒），数字依次为 1 2 3 4 5 6 7，便于记忆各位置的含义 |
| wall clock 和 monotonic clock 的区别？ | wall clock 受 NTP 和系统调整影响；mono clock 只增不减，用于精确计时。time.Now() 同时携带两者 |
| time.After 为什么可能泄漏？ | time.After 创建 Timer，若 channel 收到值之前 goroutine 退出，Timer 资源不会被立即释放；用 NewTimer + Stop 代替 |
| time.Equal 和 == 的区别？ | time.Equal 比较时刻（考虑时区），忽略单调时钟；== 比较结构体所有字段包括 loc 指针 |
| LoadLocation 需要什么？ | 需要系统 tzdata 或嵌入 `time/tzdata` 包；Docker 镜像 scratch 中常见问题 |
| time.Duration 的零值是什么含义？ | 0（纳秒），即瞬间；`time.After(0)` 立即触发 |
