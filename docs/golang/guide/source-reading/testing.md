---
title: testing 包源码精读
description: 精读 Go testing 包的 T/B/F 结构体实现，理解表驱动测试、Benchmark、Fuzz 的底层机制与最佳实践。
---

# testing：测试框架源码精读

> 核心源码：`src/testing/testing.go`、`src/testing/benchmark.go`、`src/testing/fuzz.go`

## 包结构图

```
testing 包架构
══════════════════════════════════════════════════════════════════

  测试类型
  ├── testing.T    ← 单元测试（Test*）
  ├── testing.B    ← 性能测试（Benchmark*）
  ├── testing.F    ← 模糊测试（Fuzz*）
  └── testing.M    ← 控制测试主函数（TestMain 用）

  辅助机制
  ├── testing.TB        ← 公共接口（T/B/F 都实现）
  ├── testing.Helper()  ← 标记辅助函数（错误行号准确）
  ├── testing.Cleanup() ← 测试结束时回调（类似 defer）
  └── testing.TempDir() ← 自动清理的临时目录

  执行控制
  ├── go test -run PATTERN    ← 过滤测试函数
  ├── go test -bench PATTERN  ← 运行 Benchmark
  ├── go test -fuzz FuzzXxx   ← 运行 Fuzzer
  ├── go test -count N        ← 重复运行 N 次
  ├── go test -parallel N     ← 最大并行数
  └── go test -timeout D      ← 超时时间

══════════════════════════════════════════════════════════════════
```

---

## 一、testing.T 结构

```go
// src/testing/testing.go（简化）
type common struct {
    mu          sync.RWMutex
    output      []byte         // 测试输出缓冲（父测试 Failed 时打印）
    w           io.Writer      // 输出目标
    ran         bool           // 是否执行过
    failed      bool           // 是否失败
    skipped     bool           // 是否跳过
    done        bool           // 是否完成（含子测试）

    start       time.Time      // 开始时间
    duration    time.Duration  // 执行时长

    parent      *common        // 父测试（子测试时有效）
    level       int            // 嵌套层级
    cleanups    []func()       // Cleanup 注册的回调
    cleanupName string

    ctx         context.Context    // 测试上下文（Done 时测试结束）
    cancelCtx   context.CancelFunc
}

type T struct {
    common
    isParallel bool           // 是否并行（t.Parallel() 后）
    isEnvSet   bool
    context    *testContext   // 控制并行度的调度器
}
```

---

## 二、子测试机制（t.Run）

```
t.Run 执行流程
══════════════════════════════════════════════════════════════════

  t.Run("subtest", func(t *testing.T) { ... })
       │
       ├── 创建子 T（parent=&t.common）
       │
       ├── 不含 t.Parallel()：同步执行（内嵌运行）
       │       → 子测试直接在当前 goroutine 运行
       │       → 返回时子测试已完成
       │
       └── 含 t.Parallel()：并行执行
               → t.Parallel() 挂起当前 goroutine（释放调度位）
               → 父测试继续运行其他 t.Run
               → 父测试所有同步代码跑完后
               → 等待所有并行子测试完成（WaitGroup 机制）
               → 最后合并失败状态

══════════════════════════════════════════════════════════════════
```

```go
// 示例：并行子测试正确写法
func TestParallel(t *testing.T) {
    tests := []struct{ name, input, want string }{
        {"empty", "", ""},
        {"basic", "hello", "HELLO"},
    }

    for _, tc := range tests {
        tc := tc // ⚠️ Go 1.22 之前必须捕获循环变量
        t.Run(tc.name, func(t *testing.T) {
            t.Parallel() // 声明并行
            got := strings.ToUpper(tc.input)
            if got != tc.want {
                t.Errorf("got %q, want %q", got, tc.want)
            }
        })
    }
}
```

---

## 三、Benchmark 实现

```go
// src/testing/benchmark.go
type B struct {
    common
    importPath    string
    context       *benchContext
    N             int           // 迭代次数（框架自动调整）
    previousN     int
    previousDuration time.Duration
    benchFunc     func(b *B)
    benchTime     durationOrCountFlag // -benchtime
    bytes         int64         // SetBytes 设置的数据量
    timerOn       bool
    showAllocResult bool
    result        BenchmarkResult
    parallelism   int           // RunParallel 的 goroutine 数
    memStats      MemStats      // b.ReportAllocs 用
}
```

```
Benchmark 自动调整 N 的算法
══════════════════════════════════════════════════════════════════

  第一次运行：N=1，测量耗时
       │
       ▼
  耗时 < benchtime（默认 1s）？
       │
       ├── 是 → 估算需要多少次才能达到 benchtime
       │        N = benchtime / 单次耗时
       │        取整到 1,2,5,10,20... 的整数倍
       │        重新运行
       │
       └── 否 → 完成，计算 ns/op = 总时间 / N

  典型输出：
  BenchmarkFoo-8    1000000    1234 ns/op    512 B/op    3 allocs/op

══════════════════════════════════════════════════════════════════
```

---

## 四、Fuzzing（模糊测试）

```go
// src/testing/fuzz.go
type F struct {
    common
    fuzzContext *fuzzContext
    corpus      []corpusEntry // 语料库
    result      FuzzResult
    fuzzCalled  bool
}
```

```
Fuzz 执行模式
══════════════════════════════════════════════════════════════════

  go test（普通模式）：
  └── 只运行 f.Add() 提供的种子语料库（确定性，快速）

  go test -fuzz FuzzXxx（模糊模式）：
  └── 用种子初始化语料库
      → 变异引擎生成新输入（比特翻转/追加/截断）
      → 并行运行 fuzz 函数
      → 发现 panic/crash → 保存到 testdata/fuzz/FuzzXxx/
      → 发现覆盖率增加的输入 → 加入语料库

══════════════════════════════════════════════════════════════════
```

---

## 五、代码示例

### 表驱动测试（标准范式）

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name    string
        a, b    int
        want    int
    }{
        {"both zero", 0, 0, 0},
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
        {"mixed", -1, 1, 0},
    }

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            got := Add(tc.a, tc.b)
            if got != tc.want {
                t.Errorf("Add(%d, %d) = %d, want %d", tc.a, tc.b, got, tc.want)
            }
        })
    }
}
```

### testing.Helper()：准确定位错误行

```go
// 辅助函数必须调用 t.Helper()，否则错误会指向辅助函数内部而非调用处
func assertEqual(t *testing.T, got, want any) {
    t.Helper() // ← 关键！标记本函数为辅助函数
    if got != want {
        t.Errorf("got %v, want %v", got, want)
    }
}

func TestSomething(t *testing.T) {
    assertEqual(t, compute(), 42) // 错误会指向这一行（而非 assertEqual 内部）
}
```

### testing.Cleanup：自动资源清理

```go
func TestWithDB(t *testing.T) {
    db := setupTestDB(t)
    t.Cleanup(func() {
        db.Close()
        os.Remove(db.Path())
    })
    // 测试代码，无需手动清理
    // t.Cleanup 在测试结束（含子测试）后按注册逆序执行
}

func setupTestDB(t *testing.T) *TestDB {
    t.Helper()
    db, err := openTestDB()
    if err != nil {
        t.Fatalf("setup db: %v", err) // Fatal 会调用 runtime.Goexit()
    }
    t.Cleanup(db.Close) // 注册在 Helper 内部，更内聚
    return db
}
```

### Benchmark：基准测试规范写法

```go
func BenchmarkMarshal(b *testing.B) {
    data := generateTestData()

    b.ReportAllocs()       // 报告内存分配
    b.SetBytes(int64(len(data))) // 设置每次操作的数据量（影响 MB/s 计算）
    b.ResetTimer()         // 重置计时（排除 setup 时间）

    for i := 0; i < b.N; i++ {
        _, err := json.Marshal(data)
        if err != nil {
            b.Fatal(err)
        }
    }
}

// 并行 Benchmark（模拟并发场景）
func BenchmarkConcurrent(b *testing.B) {
    cache := NewCache()
    b.RunParallel(func(pb *testing.PB) {
        for pb.Next() { // pb.Next() 等价于 i < b.N，但线程安全
            cache.Get("key")
        }
    })
}
```

### Fuzz 测试

```go
// 测试 JSON 往返（Marshal/Unmarshal 一致性）
func FuzzJSON(f *testing.F) {
    // 添加种子语料库
    f.Add(`{"name":"Alice","age":30}`)
    f.Add(`{}`)
    f.Add(`{"arr":[1,2,3]}`)

    f.Fuzz(func(t *testing.T, input string) {
        var v any
        if err := json.Unmarshal([]byte(input), &v); err != nil {
            return // 无效输入，跳过
        }
        // 重新编码后应能解码回同样的值
        out, err := json.Marshal(v)
        if err != nil {
            t.Errorf("Marshal failed after Unmarshal: %v", err)
        }
        var v2 any
        if err := json.Unmarshal(out, &v2); err != nil {
            t.Errorf("second Unmarshal failed: %v", err)
        }
    })
}
```

### TestMain：全局 setup/teardown

```go
func TestMain(m *testing.M) {
    // 全局 setup
    db := setupGlobalDB()

    // 运行所有测试
    code := m.Run()

    // 全局 teardown（即使测试失败也执行）
    db.Close()
    os.Exit(code) // 必须调用，否则程序不退出
}
```

### 使用 -cover 和 -cpuprofile

```bash
# 查看覆盖率
go test ./... -cover

# 生成 HTML 覆盖率报告
go test -coverprofile=cover.out ./...
go tool cover -html=cover.out -o cover.html

# CPU 性能分析
go test -bench=BenchmarkMarshal -cpuprofile=cpu.out
go tool pprof cpu.out

# 内存分析
go test -bench=. -memprofile=mem.out
go tool pprof mem.out
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| t.Fatal 和 t.Error 的区别？ | Fatal 调用 runtime.Goexit() 立即终止当前 goroutine（不影响 Cleanup）；Error 标记失败但继续 |
| t.Parallel() 如何工作？ | 挂起当前子测试 goroutine，父测试继续；父测试同步代码跑完后并行子测试才开始争夺调度 |
| Benchmark 的 N 如何确定？ | 框架自动调整：先 N=1 试跑，根据耗时估算 N，重复直到总时间 ≥ benchtime（默认 1s） |
| b.ResetTimer() 何时调用？ | setup 耗时较长时，在 setup 完成后调用，排除 setup 时间对 ns/op 的影响 |
| t.Helper() 有什么作用？ | 标记辅助函数，使 t.Errorf 报告的行号指向调用者而非辅助函数内部 |
| Fuzz 测试在 CI 中如何运行？ | CI 通常只跑种子语料库（go test）；长时间 Fuzz 单独运行或用 -fuzztime 限制时长 |
| testing.Cleanup 和 defer 的区别？ | Cleanup 回调在测试结束后执行（含子测试收集完成后），defer 在函数返回时执行；Cleanup 对子测试更友好 |
