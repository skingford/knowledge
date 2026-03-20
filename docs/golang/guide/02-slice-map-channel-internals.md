---
title: Slice、Map、Channel 底层实现
description: Go Slice 扩容机制、Map hmap 结构与渐进式搬迁、Channel hchan 结构与发送接收流程。
head:
  - - meta
    - name: keywords
      content: Go Slice底层,SliceHeader,Map底层,hmap,Channel底层,hchan,扩容机制
---

# Slice、Map、Channel 底层实现

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

<GoInternalsDiagram kind="slice-header" />

<GoInternalsDiagram kind="slice-shared-array" />

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

<GoInternalsDiagram kind="map-hmap" />

<GoInternalsDiagram kind="map-grow" />

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

<GoInternalsDiagram kind="channel-hchan" />

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
