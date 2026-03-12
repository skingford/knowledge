---
title: 内存分配源码精读
description: 精读 Go 内存分配器 tcmalloc 变体，理解 mcache/mcentral/mheap 三级结构。
---

# Go 内存分配：runtime 源码精读

> 核心源码：`src/runtime/malloc.go`、`src/runtime/mheap.go`、`src/runtime/mcache.go`

## 内存分配器全景图

```
Go 内存分配器（tcmalloc 变体）
══════════════════════════════════════════════════════════════════

  对象大小分类：
  ├── Tiny   对象：< 16B（合并存储，无指针）
  ├── Small  对象：16B ~ 32KB（走 mcache/mcentral）
  └── Large  对象：> 32KB（直接从 mheap 分配 span）

  三层结构：
  ┌─────────────────────────────────────────────────────────────┐
  │  mcache（每个 P 独享，无锁）                                │
  │  ├── alloc [numSpanClasses]*mspan  ← 67种size class        │
  │  └── tiny  uintptr                ← tiny 对象当前块        │
  └───────────────┬─────────────────────────────────────────────┘
                  │ 用完 → 从 mcentral 补充
  ┌───────────────▼─────────────────────────────────────────────┐
  │  mcentral（每种 size class 一个，加锁访问）                  │
  │  ├── partial []spanSet  ← 有空闲槽的 span                  │
  │  └── full    []spanSet  ← 无空闲槽的 span                  │
  └───────────────┬─────────────────────────────────────────────┘
                  │ 无 span → 从 mheap 申请
  ┌───────────────▼─────────────────────────────────────────────┐
  │  mheap（全局堆，加锁）                                      │
  │  ├── free   []spanSet   ← 空闲 span（按大小管理）          │
  │  ├── busy   []spanSet   ← 使用中 span                      │
  │  └── 向 OS 申请内存（mmap/VirtualAlloc）                   │
  └─────────────────────────────────────────────────────────────┘

══════════════════════════════════════════════════════════════════
```

---

## 一、Size Class 设计

```
Size Class（span 规格）
══════════════════════════════════════════════════════

  Go 定义了 67 种 size class（0~66），覆盖 0~32768 字节

  部分示例：
  ┌────────────────────────────────────────┐
  │  class │ bytes/obj │ span大小 │ 对象数  │
  ├────────┼───────────┼──────────┼────────┤
  │    1   │       8   │    8KB   │  1024  │
  │    2   │      16   │    8KB   │   512  │
  │    3   │      24   │    8KB   │   341  │
  │   10   │     144   │    8KB   │    56  │
  │   20   │     512   │   16KB   │    32  │
  │   40   │    4096   │    8KB   │     2  │
  │   66   │   32768   │   32KB   │     1  │
  └────────────────────────────────────────┘

  设计原则：
  ├── 相邻 class 大小比约 1.125x（减少碎片）
  └── 每个 span 包含固定数量的同规格对象

══════════════════════════════════════════════════════
```

---

## 二、分配路径

```
newobject(size) 分配流程
══════════════════════════════════════════════════════

  size == 0
  └── 返回 zerobase（全局零大小对象地址）

  size < 16B（且无指针）
  └── tiny 分配器：在当前 tiny block 切割
       ├── 有空间 → 直接返回偏移地址（极快，无需对齐到 class）
       └── 无空间 → 从 mcache 取一个 class=2(16B) 的新 block

  16B ≤ size ≤ 32KB
  ├── 计算 size class（sizeclass）
  ├── 从 mcache.alloc[spc] 取空闲槽（无锁）
  ├── mcache 无空闲 → refill：从 mcentral 获取新 span
  └── mcentral 无 span → mheap.alloc()

  size > 32KB
  └── 直接 mheap.allocLarge()（加全局锁）

══════════════════════════════════════════════════════
```

---

## 三、sync.Pool 与内存复用

```
┌──────────────────────────────────────────────────────────────┐
│                      sync.Pool                               │
│                                                              │
│  local    [P]poolLocal   ← 每个 P 一个本地池（无锁访问）     │
│  victim   [P]poolLocal   ← GC 前的旧池（两轮 GC 才清除）    │
│                                                              │
│  Get() 路径：                                                │
│  1. 从当前 P 的 local.private 取（最快，无需加锁）           │
│  2. 从当前 P 的 local.shared 取                             │
│  3. 从其他 P 的 shared 偷（work stealing）                   │
│  4. 从 victim 池取                                           │
│  5. 调用 New() 新建                                          │
│                                                              │
│  Put() → 放入 local.private（或 shared）                     │
│                                                              │
│  注意：Pool 中对象在 GC 时会被清除（非永久缓存）             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 四、代码示例

### sync.Pool 复用 buffer

```go
var bufPool = sync.Pool{
    New: func() any {
        return new(bytes.Buffer)
    },
}

func encode(v any) ([]byte, error) {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset() // 重置，复用底层数组
    defer bufPool.Put(buf)

    if err := json.NewEncoder(buf).Encode(v); err != nil {
        return nil, err
    }
    // 注意：返回前复制，因为 buf 归还池后会被复用
    result := make([]byte, buf.Len())
    copy(result, buf.Bytes())
    return result, nil
}
```

### 减少逃逸（栈分配）

```go
// 逃逸到堆（慢）
func badAlloc() *[1024]int {
    arr := [1024]int{} // 返回指针 → 逃逸到堆
    return &arr
}

// 不逃逸（快，栈分配）
func goodAlloc(buf []int) {
    var arr [1024]int // 局部变量，不逃逸
    copy(buf, arr[:])
}

// 验证逃逸
// go build -gcflags='-m' ./...
```

### 内存统计

```go
func printMemUsage() {
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    fmt.Printf("Alloc      = %v MB\n", m.Alloc>>20)       // 当前堆分配
    fmt.Printf("TotalAlloc = %v MB\n", m.TotalAlloc>>20)  // 累计分配
    fmt.Printf("HeapSys    = %v MB\n", m.HeapSys>>20)     // 从 OS 申请
    fmt.Printf("NumGC      = %v\n", m.NumGC)              // GC 次数
    fmt.Printf("HeapObjects= %v\n", m.HeapObjects)        // 存活对象数
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| Go 内存分配器原型？ | tcmalloc（Thread-Caching Malloc）变体 |
| mcache 和 mcentral 的关系？ | mcache 无锁（每P独享），用完从 mcentral（有锁）补充 |
| 大对象（>32KB）怎么分配？ | 直接从 mheap 分配 span，跳过 mcache/mcentral |
| sync.Pool 对象会永久保留吗？ | 不会，每次 GC 后 pool 被清除（victim 机制保留两轮） |
| 如何减少 GC 压力？ | sync.Pool 复用对象、减少堆逃逸、预分配 slice/map |
| Tiny 对象怎么优化？ | 多个 <16B 无指针对象合并到一个16B块，减少分配次数 |
