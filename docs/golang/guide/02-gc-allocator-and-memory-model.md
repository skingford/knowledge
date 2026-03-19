---
title: GC、内存分配器与 Memory Model
description: Go 并发三色标记 GC、TCMalloc 风格内存分配器（mcache/mcentral/mheap）、happens-before 与 data race。
head:
  - - meta
    - name: keywords
      content: Go GC,三色标记,写屏障,内存分配器,mcache,mcentral,mheap,Memory Model,happens-before
---

# GC、内存分配器与 Memory Model

## 7. GC 垃圾回收机制

Go 使用**并发三色标记清除**（Concurrent Tri-color Mark and Sweep）算法，核心目标是在保证正确性的同时，最小化 STW（Stop The World）时间。

### 三色标记

- **白色**：未被访问的对象，GC 结束后会被回收
- **灰色**：已被访问但其引用的对象尚未全部扫描
- **黑色**：已被访问且其引用的对象已全部扫描完成

标记过程：从根对象（全局变量、栈上变量、寄存器）出发，将根对象标灰 → 取出灰色对象，将其引用的白色对象标灰，自身标黑 → 重复直到没有灰色对象 → 剩余白色对象即为垃圾。

### 写屏障（Write Barrier）

并发标记期间，用户代码（mutator）可能修改引用关系。Go 使用**混合写屏障**（Hybrid Write Barrier，Go 1.8+）：

- 被覆盖的旧引用标灰（删除屏障语义）
- 新创建的对象直接标黑（插入屏障语义）

这样栈上的对象不需要重新扫描，大幅减少了 STW。

### GC 阶段

1. **Mark Setup（STW）**：开启写屏障，很短（通常 < 0.1ms）
2. **Marking（并发）**：与用户代码并发执行，扫描标记所有可达对象
3. **Mark Termination（STW）**：关闭写屏障，完成最终标记，很短
4. **Sweeping（并发）**：回收白色对象的内存，与用户代码并发执行

### GC 触发条件

- 堆内存增长到上次 GC 后的 2 倍（由 `GOGC` 环境变量控制，默认 100 即 100% 增长）
- 超过 2 分钟没有触发 GC 时，强制触发
- 手动调用 `runtime.GC()`

```go
package main

import (
	"fmt"
	"runtime"
	"runtime/debug"
	"time"
)

func main() {
	// 设置 GOGC：100 表示堆增长 100% 后触发 GC
	debug.SetGCPercent(100)

	// 打印 GC 统计信息
	printGCStats := func(label string) {
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		fmt.Printf("[%s] HeapAlloc=%dKB, NumGC=%d, PauseTotalNs=%dns\n",
			label, m.HeapAlloc/1024, m.NumGC, m.PauseTotalNs)
	}

	printGCStats("初始")

	// 分配大量内存触发 GC
	var s [][]byte
	for i := 0; i < 100; i++ {
		s = append(s, make([]byte, 1024*1024)) // 每次 1MB
	}
	printGCStats("分配后")

	// 释放引用，让 GC 回收
	s = nil
	runtime.GC() // 手动触发 GC
	printGCStats("GC后")

	_ = time.Now() // 防止 s 被编译器优化掉
}
```

使用 `GODEBUG=gctrace=1` 查看 GC 详细日志：

```bash
GODEBUG=gctrace=1 go run main.go
```

输出格式：

```
gc 1 @0.012s 2%: 0.011+1.2+0.003 ms clock, 0.089+0.3/1.0/0+0.024 ms cpu, 4->4->0 MB, 5 MB goal, 8 P
```

各字段含义：`STW1时间 + 并发标记时间 + STW2时间`，`标记前堆大小 -> 标记后堆大小 -> 存活对象大小`。

**讲解重点：**

- Go GC 的 STW 时间通常在亚毫秒级（< 1ms），大部分工作与用户代码并发执行
- `GOGC=100` 表示堆增长 100% 触发 GC；降低 GOGC 会更频繁 GC（延迟更低但吞吐降低），Go 1.19+ 可用 `debug.SetMemoryLimit` 设置内存上限
- 减少 GC 压力的手段：减少逃逸、复用对象（`sync.Pool`）、减少短生命周期的堆分配、使用值类型代替指针类型
- 写屏障只在 GC 标记阶段开启，对正常执行的性能影响非常小

---

## 8. 内存分配器

Go 的内存分配器基于 TCMalloc 设计思想，采用多级缓存架构减少锁竞争：

### 三级结构

- **mcache**：每个 P（处理器）持有一个本地缓存，分配时无需加锁。包含各种 size class 的 `mspan` 链表
- **mcentral**：全局的中央缓存，每个 size class 一个 mcentral。当 mcache 耗尽时从 mcentral 获取新的 mspan（需要加锁，但粒度小）
- **mheap**：全局的堆管理器，向操作系统申请大块内存（arena，64MB 对齐）。mcentral 耗尽时从 mheap 获取

### Size Class

Go 将对象按大小分为约 70 个 size class（8B, 16B, 24B, 32B, ..., 32KB），每个 class 对应一种固定大小的内存块。这种设计减少了内存碎片。

### 分配策略

- **Tiny 对象（< 16B 且无指针）**：使用 tiny allocator，将多个 tiny 对象合并到一个 16B 的块中，减少内存浪费
- **小对象（16B - 32KB）**：从 mcache 对应 size class 的 mspan 中分配
- **大对象（> 32KB）**：直接从 mheap 分配，不经过 mcache/mcentral

### mspan

mspan 是内存管理的基本单位，一个 mspan 是连续的若干内存页（page，8KB），被切割成固定大小的对象槽位，通过位图（allocBits）跟踪哪些槽位已分配。

```go
package main

import (
	"fmt"
	"runtime"
	"unsafe"
)

func main() {
	// 查看不同大小对象的实际分配大小
	// Go 会向上取整到对应的 size class
	sizes := []int{1, 8, 16, 24, 32, 48, 64, 128, 256, 512, 1024}
	for _, size := range sizes {
		s := make([]byte, size)
		fmt.Printf("请求 %4d bytes, cap=%4d bytes\n", size, cap(s))
	}

	// tiny 对象合并演示
	type tinyStruct struct {
		a byte
		b byte
	}

	var ptrs [10]*tinyStruct
	for i := range ptrs {
		v := new(tinyStruct)
		ptrs[i] = v
	}

	// 打印地址，观察 tiny 对象的紧凑分配
	for i, p := range ptrs {
		fmt.Printf("tiny[%d] addr=%p (size=%d)\n", i, p, unsafe.Sizeof(*p))
	}

	// 大对象分配
	big := make([]byte, 64*1024) // 64KB > 32KB，直接从 mheap 分配
	_ = big

	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("\nMallocs=%d, Frees=%d, HeapObjects=%d\n", m.Mallocs, m.Frees, m.HeapObjects)
	fmt.Printf("HeapInuse=%dKB, HeapSys=%dKB\n", m.HeapInuse/1024, m.HeapSys/1024)
}
```

**讲解重点：**

- 三级缓存 mcache → mcentral → mheap 的核心目的是减少锁竞争：mcache 完全无锁，mcentral 按 size class 分锁，mheap 使用全局锁但访问频率低
- Tiny allocator 可以将多个微小无指针对象（bool、byte 等）打包到同一个 16B 块中，大幅减少分配次数和内存浪费
- size class 设计以空间换效率：分配 17 字节的对象实际会用 24 字节的槽位，浪费约 30%，但分配和回收速度极快
- `runtime.MemStats` 是诊断内存问题的重要工具，关注 `HeapInuse`（堆使用量）、`HeapObjects`（堆对象数）、`Mallocs/Frees`（累计分配/释放次数）

---

## 9. Go Memory Model

Go Memory Model 定义了在多 goroutine 环境下，一个 goroutine 的写操作何时对另一个 goroutine 的读操作可见。核心概念是 **happens-before** 关系。

### Happens-Before 规则

如果事件 A happens-before 事件 B，那么 A 的内存写入对 B 可见。以下是 Go 保证的 happens-before 关系：

1. **单 goroutine 内**：按程序顺序执行
2. **Channel**：
   - `ch <- v` happens-before 对应的 `<-ch` 完成
   - `close(ch)` happens-before 从 ch 接收到零值
   - 无缓冲 Channel 的接收 happens-before 发送完成
3. **sync.Mutex**：第 n 次 `Unlock()` happens-before 第 n+1 次 `Lock()`
4. **sync.Once**：`once.Do(f)` 中 f 的执行 happens-before 任何 `Do` 调用返回
5. **sync.WaitGroup**：`wg.Done()` happens-before 对应的 `wg.Wait()` 返回
6. **goroutine 创建**：`go f()` 语句 happens-before f 开始执行

### Data Race

当两个 goroutine 并发访问同一个变量，且至少一个是写操作，并且没有 happens-before 关系保证顺序时，就构成 Data Race。Data Race 是未定义行为（undefined behavior），可能导致任意结果。

```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	// 错误示例：data race
	// 取消注释用 go run -race main.go 检测
	/*
		counter := 0
		var wg sync.WaitGroup
		for i := 0; i < 1000; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				counter++ // DATA RACE!
			}()
		}
		wg.Wait()
		fmt.Println("counter:", counter) // 结果不确定
	*/

	// 正确方式 1：Mutex
	var mu sync.Mutex
	counter1 := 0
	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			mu.Lock()
			counter1++
			mu.Unlock()
		}()
	}
	wg.Wait()
	fmt.Println("Mutex counter:", counter1)

	// 正确方式 2：atomic
	var counter2 int64
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			atomic.AddInt64(&counter2, 1)
		}()
	}
	wg.Wait()
	fmt.Println("Atomic counter:", counter2)

	// 正确方式 3：Channel 收集结果
	results := make(chan int, 1000)
	for i := 0; i < 1000; i++ {
		go func() {
			results <- 1
		}()
	}
	counter3 := 0
	for i := 0; i < 1000; i++ {
		counter3 += <-results
	}
	fmt.Println("Channel counter:", counter3)
}
```

使用 Race Detector 检测数据竞争：

```bash
go run -race main.go
go test -race ./...
```

**讲解重点：**

- Go Memory Model 不保证没有 happens-before 关系时的可见性；即使在 x86 这种强一致性架构上，编译器也可能做指令重排导致问题
- `-race` 是开发和测试阶段必须使用的工具，它能检测到大多数 data race；但有约 2-10 倍的性能开销，不建议在生产环境使用
- `sync/atomic` 提供了无锁的原子操作，适合简单计数器场景；复杂的共享状态建议用 Mutex
- Channel 不仅是通信工具，更是同步工具——利用其 happens-before 保证来协调 goroutine 之间的内存可见性
