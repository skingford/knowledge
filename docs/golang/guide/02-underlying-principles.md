# 底层原理

## 适合人群

- 已掌握 Go 基本语法，想深入理解运行时机制的工程师
- 准备技术面试，需要回答"底层原理"类问题的开发者
- 希望写出高性能 Go 代码、能做性能调优的后端工程师
- 想从"会用"提升到"知道为什么"的进阶学习者

## 学习目标

- 理解 Slice、Map、Channel、Interface 的运行时数据结构
- 掌握内存逃逸分析的规则和优化方法
- 了解 Go GC 三色标记算法与并发回收流程
- 理解 Go 内存分配器的多级缓存架构
- 掌握 Go Memory Model 的 happens-before 规则

## 快速导航

- [Slice 底层结构与扩容机制](#_1-slice-底层结构与扩容机制)
- [Map 底层实现原理](#_2-map-底层实现原理)
- [Channel 底层实现](#_3-channel-底层实现)
- [Interface 的 itab 和动态类型](#_4-interface-的-itab-和动态类型)
- [内存逃逸分析](#_5-内存逃逸分析)
- [栈与堆](#_6-栈与堆)
- [GC 垃圾回收机制](#_7-gc-垃圾回收机制)
- [内存分配器](#_8-内存分配器)
- [Go Memory Model](#_9-go-memory-model)

---

## 1. Slice 底层结构与扩容机制

Slice 在 Go 运行时对应的结构体是 `reflect.SliceHeader`（实际是 `runtime.slice`），包含三个字段：

- **Data**：指向底层数组的指针
- **Len**：当前切片的长度（已使用元素数）
- **Cap**：当前切片的容量（底层数组从 Data 开始到末尾的元素数）

当 `append` 导致 `len > cap` 时，运行时会调用 `runtime.growslice` 分配新的底层数组并拷贝旧数据。扩容策略（Go 1.18+ 之后）：

- 新容量 < 256 时：新容量 = 旧容量 × 2
- 新容量 ≥ 256 时：新容量 = 旧容量 + 旧容量 / 4 + 192（平滑增长）
- 最终容量还会根据内存对齐做向上取整

多个 Slice 可以共享同一个底层数组，修改其中一个可能影响另一个——这是很多 bug 的根源。

```go
package main

import "fmt"

func main() {
	// 演示 SliceHeader 三字段变化
	s := make([]int, 0, 4)
	fmt.Printf("初始: len=%d cap=%d\n", len(s), cap(s))

	for i := 0; i < 10; i++ {
		s = append(s, i)
		fmt.Printf("append(%d): len=%d cap=%d\n", i, len(s), cap(s))
	}

	// 演示共享底层数组的陷阱
	a := []int{1, 2, 3, 4, 5}
	b := a[1:3] // b = [2, 3]，与 a 共享底层数组
	b[0] = 99
	fmt.Println("a:", a) // a: [1 99 3 4 5]，a 也被修改了

	// append 未扩容时仍共享
	b = append(b, 100)
	fmt.Println("a after append b:", a) // a[3] 被覆盖为 100
}
```

**讲解重点：**

- Slice 是值类型（结构体），但内部的 Data 指针让它表现出"引用"语义；Go 里一切传参都是值传递，传 Slice 传的是结构体副本
- `append` 返回值必须接收，因为扩容后 Data 指针可能已经变了，旧变量还指向旧数组
- 共享底层数组是常见 bug 来源：子切片 append 可能意外覆盖父切片的数据；用 `copy` 或完整切片表达式 `a[1:3:3]` 来隔离
- 高频 append 场景建议用 `make([]T, 0, expectedCap)` 预分配，减少扩容拷贝开销

---

## 2. Map 底层实现原理

Go 的 map 底层结构是 `runtime.hmap`，核心字段：

- **count**：当前元素数量
- **B**：桶数组大小的对数（桶数 = 2^B）
- **buckets**：指向桶数组的指针，每个桶（`bmap`）最多存 8 个 key-value 对
- **oldbuckets**：扩容时指向旧桶数组，用于渐进式搬迁
- **hash0**：哈希种子，每个 map 实例不同，防止哈希碰撞攻击

查找流程：对 key 计算哈希值 → 低位定位桶 → 高 8 位（tophash）在桶内快速比对 → 命中后再精确比较 key。如果桶满了，通过 overflow 指针串联溢出桶。

扩容有两种情况：

- **翻倍扩容**：负载因子（count / 2^B）> 6.5 时触发，桶数翻倍
- **等量扩容**：overflow 桶过多但负载因子不高时触发，重新整理数据，桶数不变

扩容采用渐进式搬迁（evacuation），每次写操作搬迁 1-2 个旧桶，避免一次性停顿。

```go
package main

import "fmt"

func main() {
	// 演示 map 基本操作和容量增长
	m := make(map[string]int, 2) // hint=2，运行时分配足够的桶

	keys := []string{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j"}
	for _, k := range keys {
		m[k] = len(m)
	}
	fmt.Println("map size:", len(m))

	// 演示并发读写会 panic
	// 取消注释下面代码会触发 fatal error: concurrent map read and map write
	/*
		go func() {
			for {
				m["x"] = 1
			}
		}()
		go func() {
			for {
				_ = m["x"]
			}
		}()
		time.Sleep(time.Second)
	*/

	// 遍历顺序随机——因为运行时故意加了随机起始位置
	for i := 0; i < 3; i++ {
		fmt.Print("遍历: ")
		for k, v := range m {
			fmt.Printf("%s=%d ", k, v)
		}
		fmt.Println()
	}
}
```

**讲解重点：**

- map 不支持并发读写，运行时会通过 flags 字段检测并直接 panic；并发场景用 `sync.Mutex` 或 `sync.Map`
- 遍历顺序故意随机化，防止开发者依赖遍历顺序
- key 类型必须可比较（comparable）；使用 string 作为 key 时，短字符串哈希性能更好
- 渐进式搬迁保证单次写操作延迟可控，但扩容期间内存会短暂翻倍

---

## 3. Channel 底层实现

Channel 在运行时对应 `runtime.hchan` 结构体，核心字段：

- **buf**：环形缓冲区指针（有缓冲 Channel 才有）
- **dataqsiz**：缓冲区大小（即 `make(chan T, size)` 的 size）
- **qcount**：当前缓冲区中的元素数量
- **sendx / recvx**：发送和接收的环形缓冲区索引
- **sendq**：发送等待队列（`sudog` 链表，存放阻塞的发送 goroutine）
- **recvq**：接收等待队列（`sudog` 链表，存放阻塞的接收 goroutine）
- **lock**：互斥锁，保护 hchan 所有字段

发送流程：加锁 → 如果 recvq 有等待的接收者，直接将数据拷贝给接收者（不经过 buf）→ 否则如果 buf 未满，数据入队 → 否则将当前 goroutine 封装成 sudog 挂到 sendq，然后 gopark 让出 CPU。

无缓冲 Channel 的 `dataqsiz = 0`，发送和接收必须同时就绪才能完成，天然提供同步语义。

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	// 无缓冲 Channel：发送方和接收方必须同时就绪
	unbuffered := make(chan string)
	go func() {
		fmt.Println("发送前（会阻塞直到有接收方）")
		unbuffered <- "hello"
		fmt.Println("发送完成")
	}()
	time.Sleep(100 * time.Millisecond) // 让发送方先阻塞
	msg := <-unbuffered
	fmt.Println("收到:", msg)

	time.Sleep(50 * time.Millisecond)
	fmt.Println("---")

	// 有缓冲 Channel：缓冲区满之前发送不阻塞
	buffered := make(chan int, 3)
	buffered <- 1
	buffered <- 2
	buffered <- 3
	fmt.Printf("缓冲区已满: len=%d, cap=%d\n", len(buffered), cap(buffered))
	// buffered <- 4 // 这里会阻塞，因为缓冲区已满

	// 关闭后可继续读取剩余数据
	close(buffered)
	for v := range buffered {
		fmt.Println("读取:", v)
	}
}
```

**讲解重点：**

- Channel 操作全程加锁（`lock` 字段），是 goroutine-safe 的；这也意味着高并发下 Channel 可能成为锁竞争瓶颈
- 当 recvq 有等待者时，发送方会直接把数据拷贝到接收方的栈上（`sendDirect`），跳过缓冲区，减少一次拷贝
- 向已关闭的 Channel 发送数据会 panic；从已关闭的 Channel 接收会立即返回零值；用 `v, ok := <-ch` 判断是否已关闭
- `select` 语句的底层实现（`runtime.selectgo`）会对所有 case 的 Channel 加锁后统一判断，避免死锁

---

## 4. Interface 的 itab 和动态类型

Go 的接口在运行时有两种表示：

- **eface**（empty interface `interface{}`）：只有两个字段 `_type` 和 `data`
- **iface**（非空接口）：有 `tab`（指向 itab）和 `data` 两个字段

`itab` 结构体包含：

- **inter**：接口类型描述（有哪些方法）
- **_type**：实际值的类型描述
- **fun[0]**：方法表（函数指针数组），存放实际类型实现接口方法的地址

`itab` 在首次使用时计算并缓存在全局哈希表 `itabTable` 中，后续相同的 (接口类型, 具体类型) 组合直接命中缓存。

类型断言 `v.(T)` 的成本：如果 T 是具体类型，只需比较 `_type` 指针（O(1)）；如果 T 是接口类型，需要查找或构建 itab（首次 O(n)，缓存后 O(1)）。

```go
package main

import (
	"fmt"
	"unsafe"
)

type Speaker interface {
	Speak() string
}

type Dog struct{ Name string }

func (d Dog) Speak() string { return d.Name + ": Woof!" }

type Cat struct{ Name string }

func (c Cat) Speak() string { return c.Name + ": Meow!" }

func main() {
	// iface: 非空接口包含 itab + data
	var s Speaker = Dog{Name: "Buddy"}
	fmt.Println(s.Speak())
	fmt.Printf("iface 大小: %d bytes\n", unsafe.Sizeof(s)) // 16 bytes (2 个指针)

	// eface: 空接口只有 _type + data
	var a interface{} = 42
	fmt.Printf("eface 大小: %d bytes\n", unsafe.Sizeof(a)) // 16 bytes

	// 类型断言
	s = Cat{Name: "Kitty"}
	if dog, ok := s.(Dog); ok {
		fmt.Println("是 Dog:", dog.Name)
	} else {
		fmt.Println("不是 Dog") // 走这里
	}

	// type switch: 编译器优化为连续的类型指针比较
	switch v := s.(type) {
	case Dog:
		fmt.Println("Dog:", v.Name)
	case Cat:
		fmt.Println("Cat:", v.Name) // 走这里
	}

	// 接口值的 nil 陷阱
	var p *Dog = nil
	var s2 Speaker = p
	fmt.Println("s2 == nil:", s2 == nil) // false! 因为 itab 不为 nil
}
```

**讲解重点：**

- `iface` 和 `eface` 都是 16 字节（两个指针）；将值赋给接口时，如果值大于一个指针大小，会发生堆分配来存放数据
- 接口的 nil 陷阱：一个持有 nil 指针的接口值本身不等于 nil，因为 itab/_type 字段非空；函数返回 error 时要直接 `return nil` 而不是返回一个类型化的 nil 指针
- itab 缓存是全局的，相同的 (接口, 类型) 对只计算一次方法表；这意味着方法调用的开销接近直接函数调用（通过函数指针间接调用）
- 小接口（1-2 个方法）的 itab 构建更快，这也是 Go 推崇小接口的底层原因之一

---

## 5. 内存逃逸分析

Go 编译器在编译期通过逃逸分析（Escape Analysis）决定变量分配在栈上还是堆上。栈分配成本极低（移动 SP 指针即可），堆分配需要 GC 参与回收，所以减少逃逸 = 减少 GC 压力 = 提升性能。

常见逃逸场景：

- 函数返回局部变量的指针
- 变量被发送到 Channel
- 变量赋值给接口类型（编译器无法确定大小）
- 闭包引用外部变量
- Slice/Map 的容量在编译期不可知或过大
- `fmt.Println` 等接受 `interface{}` 参数的函数

使用 `-gcflags="-m"` 查看逃逸分析结果。

```go
package main

import "fmt"

// 返回指针 → 逃逸到堆
func newInt(n int) *int {
	v := n // v 逃逸到堆
	return &v
}

// 不返回指针 → 留在栈上
func addOne(n int) int {
	v := n + 1 // v 留在栈上
	return v
}

// 接口参数导致逃逸
func printValue(v interface{}) {
	fmt.Println(v)
}

// 闭包引用导致逃逸
func closure() func() int {
	x := 0 // x 逃逸到堆
	return func() int {
		x++
		return x
	}
}

func main() {
	p := newInt(42)
	fmt.Println(*p)

	r := addOne(10)
	_ = r

	printValue(100) // 100 逃逸到堆（装箱为 interface{}）

	f := closure()
	fmt.Println(f())
}
```

使用逃逸分析命令查看结果：

```bash
go build -gcflags="-m -m" main.go
```

输出示例（关键行）：

```
./main.go:7:2: v escapes to heap:
./main.go:7:2:   flow: ~r0 = &v:
./main.go:25:2: x escapes to heap:
./main.go:25:2:   flow: {storage for x} = &x:
```

**讲解重点：**

- 逃逸分析是编译期行为，不影响运行时语义，只影响分配位置和 GC 压力
- `-gcflags="-m"` 看简要结果，`-gcflags="-m -m"` 看详细逃逸原因；在 CI 中可以用来检测性能敏感路径的意外逃逸
- 减少逃逸的常用手段：避免不必要的指针返回、用具体类型代替 interface{}、预分配 Slice 容量、避免大结构体传指针给逃逸路径
- `sync.Pool` 的设计目的之一就是复用堆对象，减少 GC 压力

---

## 6. 栈与堆

Go 的 goroutine 使用独立的栈，栈的特点：

- **初始大小**：Go 1.4+ 起初始栈大小为 **2KB**（之前是 8KB）
- **动态增长**：函数调用时如果栈空间不够，运行时会分配一个 2 倍大小的新栈，把旧栈内容拷贝过去（连续栈，copystack）
- **自动收缩**：GC 时如果发现栈使用量不到容量的 1/4，会缩小栈
- **最大限制**：默认最大栈大小为 1GB（可通过 `runtime/debug.SetMaxStack` 调整）

栈分配 vs 堆分配：

| 特性 | 栈 | 堆 |
|------|----|----|
| 分配速度 | 极快（移动 SP） | 较慢（需要内存分配器） |
| 回收方式 | 函数返回自动回收 | GC 回收 |
| 生命周期 | 函数作用域内 | 不确定 |
| 碎片化 | 无 | 可能 |

```go
package main

import (
	"fmt"
	"runtime"
)

// 递归函数：会触发栈增长
func recursive(n int) int {
	if n <= 0 {
		// 打印当前 goroutine 栈的使用情况
		var buf [64]byte
		runtime.Stack(buf[:], false)
		return 0
	}
	// 每次递归在栈上分配一些空间
	var padding [128]byte
	_ = padding
	return recursive(n - 1)
}

func main() {
	// 查看初始栈信息
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("初始 - 栈使用: %d bytes, 堆使用: %d bytes\n", m.StackInuse, m.HeapInuse)

	// 触发栈增长
	recursive(1000)

	runtime.ReadMemStats(&m)
	fmt.Printf("递归后 - 栈使用: %d bytes, 堆使用: %d bytes\n", m.StackInuse, m.HeapInuse)

	// 大量 goroutine 的栈内存占用
	done := make(chan struct{})
	for i := 0; i < 10000; i++ {
		go func() {
			<-done // 阻塞，保持 goroutine 存活
		}()
	}

	runtime.ReadMemStats(&m)
	fmt.Printf("10000 goroutines - 栈使用: %d bytes (≈%d KB per goroutine)\n",
		m.StackInuse, m.StackInuse/10000/1024)
	close(done)
}
```

**讲解重点：**

- goroutine 初始栈只有 2KB，这是支持百万级 goroutine 的关键（OS 线程默认栈 1-8MB）
- 栈增长采用连续栈方案（copystack）：分配新栈 → 拷贝旧栈内容 → 更新所有指向旧栈的指针；这个过程对用户透明但有拷贝成本
- 栈上的变量不需要 GC 管理，函数返回时整体回收；所以减少逃逸 = 减少 GC 负担
- 深递归或大量局部变量可能导致频繁栈增长，关键路径要注意控制栈帧大小

---

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
