---
title: sync.Pool 源码精读
description: 精读 sync.Pool 的对象复用机制，理解 per-P 本地池、victim cache 设计与 GC 交互，掌握正确的 Pool 使用模式。
---

# sync.Pool：对象池源码精读

> 核心源码：`src/sync/pool.go`、`src/sync/poolqueue.go`
>
> 图例参考：复用 [性能优化与排障](../07-performance-troubleshooting.md) 和前面的 [内存分配器源码精读](./runtime-memory.md) 里的 `sync.Pool` 生命周期图，先看 `Get/Put/victim` 的流转，再对照 `poolLocal` 与 GC 清理逻辑。

这篇聚焦对象复用与 GC 交互，不再承担 `sync` 总览页的职责。

如果你还在补锁、等待、Once、Map 这些基础同步原语，先看：

- 总览：[sync 包源码精读](./sync-primitives.md)

更适合带着这些问题来读：

- `sync.Pool` 为什么不能当缓存用
- 为什么对象最多只会跨两轮 GC
- 为什么它和 per-P、本地性、性能热点密切相关

::: tip 阅读方式
这页优先讲原理、边界和使用判断，代码示例默认收起；先顺着正文理解，再按需展开代码对照实现。
:::

## 包结构图

<GoPerformanceDiagram kind="sync-pool-lifecycle" />

```
sync.Pool 内部结构（Go 1.13+ victim cache 设计）
══════════════════════════════════════════════════════════════════

  Pool
  ├── New func() any       ← 池空时的构造函数
  ├── local *poolLocal     ← per-P 本地池数组（len=GOMAXPROCS）
  └── victim *poolLocal    ← 上一轮 GC 前的本地池（victim cache）

  poolLocal（每个 P 独占）
  ├── poolLocalInternal
  │   ├── private any          ← 单个对象（无锁，当前 P 独享）
  │   └── shared  poolChain    ← 双端队列（可被其他 P 窃取）
  └── pad [128-unsafe.Sizeof]byte  ← 填充，避免 false sharing

  Get 查找顺序（从快到慢）：
  1. 当前 P 的 private（无锁，O(1)）
  2. 当前 P 的 shared 队列头部（无锁 CAS）
  3. 其他 P 的 shared 队列尾部（work stealing，加锁）
  4. victim cache（上一 GC 周期的对象）
  5. New()（新建）

  Put 存储顺序：
  1. 若 private 为空 → 存入 private
  2. 否则 → 推入 shared 队列头部

  GC 交互：
  ├── 每次 GC 前：local → victim（旧 victim 清空）
  └── 两轮 GC 后对象必然被回收（不能依赖 Pool 长期保存对象）

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

::: details 点击展开代码：sync.Pool 核心实现（简化）
```go
// src/sync/pool.go（简化）
type Pool struct {
    noCopy  noCopy       // go vet 检测禁止拷贝
    local   unsafe.Pointer // *[P]poolLocal
    localSize uintptr
    victim     unsafe.Pointer
    victimSize uintptr
    New func() any       // 对象构造函数
}

func (p *Pool) Get() any {
    // 1. 禁止 GC 抢占（pin 当前 goroutine 到 P）
    l, pid := p.pin()

    // 2. 尝试取 private（最快路径）
    x := l.private
    l.private = nil

    if x == nil {
        // 3. 从本地 shared 取头部（popHead）
        x, _ = l.shared.popHead()
        if x == nil {
            // 4. 从其他 P 的 shared 或 victim 偷取
            x = p.getSlow(pid)
        }
    }
    runtime_procUnpin()

    // 5. 都没有 → 调用 New
    if x == nil && p.New != nil {
        x = p.New()
    }
    return x
}

func (p *Pool) Put(x any) {
    if x == nil { return }
    l, _ := p.pin()
    if l.private == nil {
        l.private = x // 优先存 private
        x = nil
    }
    if x != nil {
        l.shared.pushHead(x) // 存入 shared 队列
    }
    runtime_procUnpin()
}

// GC 时触发（runtime 注册的清理函数）
func poolCleanup() {
    // victim = local（保留一轮）
    // local = 新分配（清空）
}
```
:::

---

## 二、代码示例

### 基础用法：bytes.Buffer 复用

::: details 点击展开代码：bytes.Buffer 复用
```go
var bufPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func processData(data []byte) string {
    buf := bufPool.Get().(*bytes.Buffer)
    defer func() {
        buf.Reset()       // ⚠️ 归还前必须重置！
        bufPool.Put(buf)  // 归还到池
    }()

    buf.Write(data)
    buf.WriteString(" processed")
    return buf.String()
}
```
:::

### fmt 包中的实际用法（标准库参考）

::: details 点击展开代码：fmt 包中的 sync.Pool 用法
```go
// src/fmt/print.go 使用 sync.Pool 复用 pp 对象
var ppFree = sync.Pool{
    New: func() any { return new(pp) }, // pp 是 fmt 内部打印状态对象
}

func Fprintf(w io.Writer, format string, a ...any) (n int, err error) {
    p := ppFree.Get().(*pp)  // 从池取
    p.init()
    // ... 格式化 ...
    n, err = w.Write(p.buf)
    ppFree.Put(p)            // 归还（不需要 Reset，因为 init 会重置）
    return
}
```
:::

### JSON 编码器复用（减少 GC 压力）

::: details 点击展开代码：JSON 编码器复用
```go
// 复用 json.Encoder（避免每次 HTTP 请求都分配）
var encoderPool = sync.Pool{
    New: func() any {
        // 注意：encoder 内部包含 writer，每次 Get 后需重新绑定
        return &pooledEncoder{}
    },
}

type pooledEncoder struct {
    buf bytes.Buffer
    enc *json.Encoder
}

func (pe *pooledEncoder) reset() {
    pe.buf.Reset()
    pe.enc = json.NewEncoder(&pe.buf)
}

func writeJSON(w http.ResponseWriter, v any) error {
    pe := encoderPool.Get().(*pooledEncoder)
    pe.reset()
    defer encoderPool.Put(pe)

    if err := pe.enc.Encode(v); err != nil {
        return err
    }
    w.Header().Set("Content-Type", "application/json")
    _, err := w.Write(pe.buf.Bytes())
    return err
}
```
:::

### 固定大小 byte slice 池

::: details 点击展开代码：固定大小 byte slice 池
```go
// 按大小分档的 byte slice 池（类似 sync.Pool + bucket）
const (
    size4K  = 4 * 1024
    size64K = 64 * 1024
)

var (
    pool4K  = &sync.Pool{New: func() any { s := make([]byte, size4K);  return &s }}
    pool64K = &sync.Pool{New: func() any { s := make([]byte, size64K); return &s }}
)

func getBuf(size int) *[]byte {
    switch {
    case size <= size4K:
        return pool4K.Get().(*[]byte)
    case size <= size64K:
        return pool64K.Get().(*[]byte)
    default:
        s := make([]byte, size)
        return &s
    }
}

func putBuf(buf *[]byte, size int) {
    *buf = (*buf)[:size] // 重置 len（保留 cap）
    switch {
    case size <= size4K:
        pool4K.Put(buf)
    case size <= size64K:
        pool64K.Put(buf)
    }
    // 超大 buf 不归还，让 GC 回收
}
```
:::

### 验证 Pool 效果（Benchmark）

::: details 点击展开代码：Benchmark 对比
```go
// 对比：不用 Pool vs 用 Pool
func BenchmarkWithoutPool(b *testing.B) {
    for i := 0; i < b.N; i++ {
        buf := new(bytes.Buffer)
        buf.WriteString("hello world")
        _ = buf.String()
        // buf 在此处被 GC（每次都分配）
    }
}

func BenchmarkWithPool(b *testing.B) {
    pool := sync.Pool{New: func() any { return new(bytes.Buffer) }}
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        buf := pool.Get().(*bytes.Buffer)
        buf.WriteString("hello world")
        _ = buf.String()
        buf.Reset()
        pool.Put(buf)
    }
}
// 典型结果：WithPool 分配次数减少 ~90%，ns/op 降低 30-50%
```
:::

### 常见错误

::: details 点击展开代码：sync.Pool 常见错误
```go
// ❌ 错误1：归还前忘记重置状态
buf := pool.Get().(*bytes.Buffer)
buf.Write(sensitiveData)
pool.Put(buf) // 下一个 Get 的调用者会看到 sensitiveData！

// ✅ 正确：归还前重置
buf.Reset()
pool.Put(buf)

// ❌ 错误2：依赖 Pool 长期保存对象（两轮 GC 后必然清空）
pool.Put(expensiveConn)
time.Sleep(time.Minute)
conn := pool.Get() // 可能返回 nil（已被 GC 回收）

// ❌ 错误3：Pool 中存储带锁对象（锁状态可能不一致）
// 归还 mutex 未解锁的对象 → 下次 Get 死锁

// ❌ 错误4：Pool 中存储 *sync.Mutex（sync.Pool 本身不能被拷贝）
var p sync.Pool
p2 := p // ← go vet 会检测到 noCopy 违规
```
:::

### 使用注意事项

| 维度 | 注意事项 |
|------|----------|
| 持久性 | 对象不保证一直存在，GC 会清理；`sync.Pool` 只能做临时复用，不能做持久存储 |
| 并发安全 | `sync.Pool` 本身是并发安全的，但 `Get` 和 `Put` 之间不保证原子性，不能把它当成带事务语义的资源池 |
| 内存重置 | 必须手动 `Reset` 或清理对象状态，否则会发生数据交叉、脏数据复用 |
| 对象大小 | 警惕大对象扩容后长期留在池中；必要时在 `Put` 前截断，或直接丢弃让 GC 回收 |
| 适用场景 | 适合高频、高成本临时对象的复用，例如 JSON 编解码中的 `Buffer`、临时 `[]byte`、短生命周期结构体 |

---

## 核心要点

| 问题 | 要点 |
|------|------|
| sync.Pool 的对象在 GC 后一定被清空吗？ | 不是立即，而是经过两轮 GC。victim cache 机制让对象存活一轮 GC，第二轮 GC 才真正清空 |
| victim cache 解决了什么问题？ | 旧版本每次 GC 全部清空，高 GC 频率时命中率极低；victim 保留一轮，提高 GC 后的命中率 |
| per-P 设计解决了什么？ | 避免多 goroutine 竞争同一把锁；每个 P 有独立的 private 和 shared，大幅减少锁争用 |
| Get 到的对象一定是 New 创建的吗？ | 不是！可能是其他 goroutine 归还的对象，**不能假设状态是干净的**，归还前必须重置 |
| Pool 适合什么场景？ | 短期、频繁分配的临时对象（bytes.Buffer、[]byte、临时结构体）；不适合长期持有的资源（连接） |
| sync.Pool 和 sync.Pool 里的对象都不能被拷贝吗？ | Pool 本身不能拷贝（含 noCopy）；池中对象能否拷贝取决于其自身设计 |
