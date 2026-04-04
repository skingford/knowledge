---
title: sync 同步原语与 Atomic
description: Go sync.Mutex、RWMutex、Atomic、WaitGroup、Once、Cond、Pool 与 sync.Map 使用详解与选型决策。
search: false
---

# sync 同步原语与 Atomic

## 6. sync.Mutex / sync.RWMutex

互斥锁用于保护共享资源的并发访问，是最基础的同步原语。

### Mutex 基本用法

::: details 点击查看代码：Mutex 基本用法
```go
package main

import (
	"fmt"
	"sync"
)

type SafeCounter struct {
	mu sync.Mutex
	v  map[string]int
}

func (c *SafeCounter) Inc(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.v[key]++
}

func (c *SafeCounter) Value(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.v[key]
}

func main() {
	counter := SafeCounter{v: make(map[string]int)}
	var wg sync.WaitGroup

	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			counter.Inc("key")
		}()
	}

	wg.Wait()
	fmt.Println("final count:", counter.Value("key")) // 1000
}
```
:::

### RWMutex 读写锁

::: details 点击查看代码：RWMutex 读写锁
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

type Cache struct {
	mu   sync.RWMutex
	data map[string]string
}

func (c *Cache) Get(key string) (string, bool) {
	c.mu.RLock() // 读锁，多个读者可同时持有
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}

func (c *Cache) Set(key, value string) {
	c.mu.Lock() // 写锁，排斥所有读者和写者
	defer c.mu.Unlock()
	c.data[key] = value
}

func main() {
	cache := &Cache{data: make(map[string]string)}
	cache.Set("name", "Go")

	var wg sync.WaitGroup

	// 多个并发读
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			if val, ok := cache.Get("name"); ok {
				fmt.Printf("reader %d: %s\n", id, val)
			}
		}(i)
	}

	// 偶尔写
	wg.Add(1)
	go func() {
		defer wg.Done()
		time.Sleep(5 * time.Millisecond)
		cache.Set("name", "Golang")
		fmt.Println("writer: updated")
	}()

	wg.Wait()
}
```
:::

### Mutex 的两种模式

`sync.Mutex` 内部实现了正常模式和饥饿模式的自动切换，理解这两种模式有助于分析锁竞争场景下的性能表现：

- **正常模式**：Goroutine 尝试获取锁失败后会进入等待队列。锁释放时唤醒队头的 Goroutine，但新到达的 Goroutine 会与被唤醒的 Goroutine 竞争锁。由于新到达的 Goroutine 已经在 CPU 上运行，通常会抢赢刚被唤醒的（需要上下文恢复），这提高了整体吞吐但可能造成尾延迟。
- **饥饿模式**：当某个 Goroutine 等待锁的时间超过 **1ms** 时触发。此时锁直接交给等待队列的队头，新来的 Goroutine 不参与竞争，直接排到队尾。这保证了公平性和尾延迟可控。

> 正常模式吞吐更高，饥饿模式延迟更均匀。运行时会根据等待时间自动切换，无需开发者干预。

### 讲解重点

<GoSyncPrimitiveDiagram kind="mutex-vs-rwmutex" />

- **Mutex vs RWMutex**：读多写少用 `RWMutex`，读写频率接近时 `RWMutex` 因内部开销反而可能更慢，直接用 `Mutex` 即可。
- **不要复制锁**：`sync.Mutex` 和 `sync.RWMutex` 不能被复制。包含锁的结构体应通过指针传递。可用 `go vet` 检查。
- **避免死锁**：不要在持有锁的情况下再去获取同一把锁（Go 的 Mutex 不可重入）；多把锁时统一加锁顺序。
- **defer Unlock**：建议用 `defer mu.Unlock()` 确保异常路径也能释放锁，但注意 defer 在函数返回时才执行，如果临界区很小，可以手动 Unlock 缩小锁范围。


---

## 7. Atomic 原子操作

`sync/atomic` 提供无锁的原子操作，适用于简单的计数器、标志位等场景，性能优于互斥锁。

如果说 Channel 是工厂里的传送带，Mutex 是房间门上的实体挂锁，那么 atomic 就是直接对 CPU 下达的**"微观魔法指令"**——完全绕开操作系统层面的阻塞和等待，直接在硬件级别保证数据一致性。

#### 为什么 atomic 这么快？

`i++` 在 CPU 眼里其实是三步：读（Load）→ 改（Add）→ 写（Store）。多 Goroutine 同时做这三步就会互相覆盖。

| 方案 | 机制 | 代价 |
| --- | --- | --- |
| **Mutex（悲观锁）** | 抢到锁的 Goroutine 独占，其他被操作系统挂起（睡眠），完成后唤醒下一个 | 频繁上下文切换，极耗资源 |
| **atomic（无锁/乐观锁）** | 直接调用 CPU 特殊指令（如 x86 的 `LOCK CMPXCHG`），在硬件总线或缓存行级别上锁，三步打包为不可分割的原子 | 极低，零上下文切换 |

### 基本原子操作

::: details 点击查看代码：基本原子操作
```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	var counter int64

	var wg sync.WaitGroup
	for i := 0; i < 1000; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			atomic.AddInt64(&counter, 1) // 原子自增
		}()
	}
	wg.Wait()

	fmt.Println("counter:", atomic.LoadInt64(&counter)) // 1000
}
```
:::

### CompareAndSwap (CAS)

::: details 点击查看代码：CompareAndSwap (CAS)
```go
package main

import (
	"fmt"
	"sync/atomic"
)

func main() {
	var val int64 = 100

	// CAS：如果当前值是 100，就替换成 200
	swapped := atomic.CompareAndSwapInt64(&val, 100, 200)
	fmt.Println("swapped:", swapped, "val:", val) // true, 200

	// 当前值是 200 而不是 100，交换失败
	swapped = atomic.CompareAndSwapInt64(&val, 100, 300)
	fmt.Println("swapped:", swapped, "val:", val) // false, 200
}
```
:::

### CAS 自旋：无锁编程的基石

CAS（Compare And Swap）是整个无锁编程（Lock-free）的基石，逻辑极其"乐观"：

> "我预期当前值是 A。如果确实是 A（没人动过），立刻改成 B，返回 true。如果不是 A（被人截胡了），不改，返回 false。"

典型的 CAS 自旋写法——失败就重试，直到成功：

::: details 点击查看代码：CAS 自旋无锁编程
```go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

func main() {
	var count int32 = 0
	var wg sync.WaitGroup

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				old := atomic.LoadInt32(&count)        // 1. 看一眼当前值
				newVal := old + 1                      // 2. 计算新值
				if atomic.CompareAndSwapInt32(&count, old, newVal) {
					break // 3. CAS 成功，跳出；否则重试
				}
			}
		}()
	}

	wg.Wait()
	fmt.Println("最终结果:", count) // 一定是 100
}
```
:::

> 对于简单加法，直接用 `atomic.AddInt32(&count, 1)` 一步搞定。上面是为了演示 CAS "失败重试"的自旋原理。

### Go 1.19+ 泛型原子类型

Go 1.19 引入了基于泛型的原子类型，让无锁编程更优雅、更安全：

::: details 点击查看代码：Go 1.19+ 泛型原子类型
```go
package main

import (
	"fmt"
	"sync/atomic"
)

func main() {
	var counter atomic.Int64
	var isReady atomic.Bool

	counter.Add(1)          // 加法
	isReady.Store(true)     // 覆盖写入
	fmt.Println(counter.Load()) // 安全读取

	// CAS 操作
	swapped := isReady.CompareAndSwap(true, false)
	fmt.Println("swapped:", swapped)
}
```
:::

相比旧 API（`atomic.LoadInt64(&val)`），泛型类型彻底杜绝了用普通方式读写原子变量的低级错误，保证了内存对齐和类型安全。

### atomic.Pointer[T]：无锁热更新配置

`atomic.Pointer[T]`（Go 1.19+）是比 `atomic.Value` 更类型安全的替代，常用于高并发框架的**配置热加载（Hot Reload）**：

::: details 点击查看代码：atomic.Pointer[T] 无锁热更新配置
```go
package main

import (
	"fmt"
	"sync/atomic"
	"time"
)

type Config struct {
	DBConnString string
	MaxRetries   int
}

func main() {
	var globalConfig atomic.Pointer[Config]

	// 初始化配置
	globalConfig.Store(&Config{
		DBConnString: "mysql://localhost:3306",
		MaxRetries:   3,
	})

	// 大量协程并发读取配置（无锁快路径，性能极高）
	for i := 0; i < 5; i++ {
		go func(id int) {
			for j := 0; j < 5; j++ {
				cfg := globalConfig.Load()
				fmt.Printf("协程 %d: MaxRetries=%d\n", id, cfg.MaxRetries)
				time.Sleep(200 * time.Millisecond)
			}
		}(i)
	}

	time.Sleep(500 * time.Millisecond)

	// 管理员触发热更新——原子替换指针
	globalConfig.Store(&Config{
		DBConnString: "mysql://remote:3306",
		MaxRetries:   10,
	})
	fmt.Println("配置已热更新")

	time.Sleep(500 * time.Millisecond)
}
```
:::

> 为什么热更新用 `atomic.Pointer` 而不是 `RWMutex`？配置绝大多数时候是"读"。`atomic.Pointer.Load()` 在底层只是一条机器指令，零阻塞，读取性能达到极致。

### atomic.Value 存取任意类型

::: details 点击查看代码：atomic.Value 存取任意类型
```go
package main

import (
	"fmt"
	"sync/atomic"
	"time"
)

type Config struct {
	Timeout  time.Duration
	MaxRetry int
}

func main() {
	var configStore atomic.Value

	// 初始配置
	configStore.Store(Config{
		Timeout:  5 * time.Second,
		MaxRetry: 3,
	})

	// 模拟热更新配置
	go func() {
		time.Sleep(100 * time.Millisecond)
		configStore.Store(Config{
			Timeout:  10 * time.Second,
			MaxRetry: 5,
		})
		fmt.Println("config updated")
	}()

	// 读取配置（无锁）
	cfg := configStore.Load().(Config)
	fmt.Printf("current config: timeout=%v, maxRetry=%d\n", cfg.Timeout, cfg.MaxRetry)

	time.Sleep(200 * time.Millisecond)
	cfg = configStore.Load().(Config)
	fmt.Printf("updated config: timeout=%v, maxRetry=%d\n", cfg.Timeout, cfg.MaxRetry)
}
```
:::

<GoSyncPrimitiveDiagram kind="atomic-cas" />

### 讲解重点

- **适用场景**：计数器、标志位、配置热加载等简单共享状态。复杂逻辑（多个字段需一致性更新）仍应使用 Mutex。
- **CAS 的自旋**：CAS 可能因竞争失败，通常需要在循环中重试。高竞争场景下自旋会浪费 CPU，此时 Mutex 更合适。
- **atomic.Value 类型一致**：存入 `atomic.Value` 后，后续 Store 的值类型必须一致，否则 panic。推荐使用 Go 1.19+ 的 `atomic.Pointer[T]` 获得编译期类型安全。
- **内存序**：Go 的 atomic 操作提供顺序一致性保证，能正确建立 happens-before 关系。

#### atomic vs Mutex 选型

| 场景 | 选择 | 比喻 |
| --- | --- | --- |
| 保护单个简单变量（计数器、标志位、配置指针替换） | `atomic` | 手术刀——极快极精准，但切面有限 |
| 保护一段复杂逻辑，或同时修改多个互相依赖的变量（转账：A 扣钱 + B 加钱） | `Mutex` | 防爆盾——笨重但防守严密 |

> atomic 极其高效但也危险（CAS 死循环、ABA 问题）。大多数业务场景下 Mutex 更安全直接，只有明确识别到热点路径的单变量瓶颈时才值得切换到 atomic。


---

## 8. WaitGroup / Once / Cond / Pool

`sync` 包提供了多种同步原语，覆盖常见的并发协调场景。

### WaitGroup：等待一组 Goroutine 完成

::: details 点击查看代码：WaitGroup 等待一组 Goroutine 完成
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var wg sync.WaitGroup

	for i := 1; i <= 5; i++ {
		wg.Add(1) // 必须在 go 之前调用
		go func(id int) {
			defer wg.Done()
			time.Sleep(time.Duration(id) * 100 * time.Millisecond)
			fmt.Printf("task %d done\n", id)
		}(i)
	}

	wg.Wait() // 阻塞直到计数器归零
	fmt.Println("all tasks completed")
}
```
:::

### Once：保证只执行一次

::: details 点击查看代码：Once 保证只执行一次
```go
package main

import (
	"fmt"
	"sync"
)

type Singleton struct {
	Name string
}

var (
	instance *Singleton
	once     sync.Once
)

func GetInstance() *Singleton {
	once.Do(func() {
		fmt.Println("initializing singleton...")
		instance = &Singleton{Name: "only-one"}
	})
	return instance
}

func main() {
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s := GetInstance()
			fmt.Println("got:", s.Name)
		}()
	}
	wg.Wait()
	// "initializing singleton..." 只打印一次
}
```
:::

### Cond：条件变量

::: details 点击查看代码：Cond 条件变量
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	var mu sync.Mutex
	cond := sync.NewCond(&mu)

	ready := false

	// 等待方
	go func() {
		mu.Lock()
		for !ready { // 必须在循环中检查条件，防止虚假唤醒
			cond.Wait() // 释放锁 + 等待通知 + 重新获取锁
		}
		fmt.Println("consumer: condition met, proceeding")
		mu.Unlock()
	}()

	// 通知方
	time.Sleep(500 * time.Millisecond)
	mu.Lock()
	ready = true
	cond.Signal() // 唤醒一个等待者；Broadcast() 唤醒所有
	mu.Unlock()

	time.Sleep(100 * time.Millisecond)
}
```
:::

### Pool：对象池复用

::: details 点击查看代码：Pool 对象池复用
```go
package main

import (
	"bytes"
	"fmt"
	"sync"
)

func main() {
	pool := &sync.Pool{
		New: func() interface{} {
			fmt.Println("creating new buffer")
			return new(bytes.Buffer)
		},
	}

	// 获取 -> 使用 -> 归还
	buf := pool.Get().(*bytes.Buffer)
	buf.WriteString("hello pool")
	fmt.Println(buf.String())

	buf.Reset() // 归还前清理状态
	pool.Put(buf)

	// 再次获取，复用刚才归还的对象
	buf2 := pool.Get().(*bytes.Buffer)
	fmt.Println("reused buffer, len:", buf2.Len()) // 0，已 Reset
}
```
:::

<GoSyncPrimitiveDiagram kind="coordination-primitives" />

### 讲解重点

- **WaitGroup.Add 的时机**：`Add` 必须在启动 Goroutine 之前调用，否则 `Wait` 可能在 `Add` 之前返回。不要在 Goroutine 内部调用 `Add`。
- **Once 的 panic 语义**：如果 `once.Do(f)` 中的 `f` 发生 panic，`once` 仍然被标记为已执行，后续调用不会重试。Go 1.21+ 提供 `sync.OnceFunc` / `sync.OnceValue` 可以更优雅地处理。
- **Cond 不常用**：实际开发中 Channel 能覆盖绝大多数条件等待场景，`sync.Cond` 通常只在需要 `Broadcast` 唤醒多个等待者且不方便用 Channel 时使用。
- **Pool 的 GC 行为**：`sync.Pool` 中的对象可能在任意 GC 周期被回收，不要把它当缓存用。典型场景是高频分配的临时对象（如 `bytes.Buffer`、编解码器）。


---

## 9. sync.Map

`sync.Map` 是 Go 标准库提供的并发安全 Map，针对两种场景做了优化：key 写入一次后多次读取，以及多个 Goroutine 读写不相交的 key 集合。

### 基本用法

::: details 点击查看代码：sync.Map 基本用法
```go
package main

import (
	"fmt"
	"sync"
)

func main() {
	var m sync.Map

	// Store 写入
	m.Store("name", "Go")
	m.Store("version", 21)

	// Load 读取
	if val, ok := m.Load("name"); ok {
		fmt.Println("name:", val)
	}

	// LoadOrStore 不存在就写入
	actual, loaded := m.LoadOrStore("name", "Rust")
	fmt.Println("actual:", actual, "loaded:", loaded) // Go, true（已存在）

	// Delete 删除
	m.Delete("version")

	// Range 遍历
	m.Store("lang", "Go")
	m.Store("year", 2009)
	m.Range(func(key, value interface{}) bool {
		fmt.Printf("  %v: %v\n", key, value)
		return true // 返回 false 停止遍历
	})
}
```
:::

### 并发读写对比

::: details 点击查看代码：并发读写对比
```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func benchSyncMap() time.Duration {
	var m sync.Map
	var wg sync.WaitGroup
	start := time.Now()

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				if j%10 == 0 {
					m.Store(id, j) // 10% 写
				} else {
					m.Load(id) // 90% 读
				}
			}
		}(i)
	}

	wg.Wait()
	return time.Since(start)
}

func benchMutexMap() time.Duration {
	mu := &sync.RWMutex{}
	data := make(map[int]int)
	var wg sync.WaitGroup
	start := time.Now()

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < 1000; j++ {
				if j%10 == 0 {
					mu.Lock()
					data[id] = j
					mu.Unlock()
				} else {
					mu.RLock()
					_ = data[id]
					mu.RUnlock()
				}
			}
		}(i)
	}

	wg.Wait()
	return time.Since(start)
}

func main() {
	fmt.Println("sync.Map:", benchSyncMap())
	fmt.Println("RWMutex+map:", benchMutexMap())
}
```
:::

<GoSyncPrimitiveDiagram kind="sync-map-read-dirty" />

### 底层黑魔法：双盘账本（read/dirty）

`sync.Map` 的核心设计哲学是**空间换时间**——内部维护两本账，实现读写分离：

| 账本 | 比喻 | 特点 |
| --- | --- | --- |
| **read** | 前台展示柜 | 使用 `atomic.Value` 存储，所有人可**无锁查看**，不能直接新增原本不存在的 key |
| **dirty** | 后台保险柜 | 需要 `Mutex` 加锁才能打开查看或修改，专门存放新增数据 |

> 关键细节：如果某个 key 在 read 和 dirty 里都存在，它们指向**同一个底层数据指针**（`entry`）。修改已存在的旧数据时，两本账看到的结果同步更新。

#### 增删改查的真实流程

**查询（Load）**：先去 read 无锁找 → 没找到且 `amended=true` → 加锁查 dirty → 未命中计数器 `misses` +1。

**新增（Store - New Key）**：read 里没有 → 加锁写入 dirty → 设置 `amended=true`（告诉大家"后台有新货"）。

**修改（Store - Existing Key）**：read 里有 → **不需要加锁**！直接通过 `atomic.CAS` 把底层指针指向新值，dirty 也同步更新。

**删除（Delete）**：延迟删除——用原子操作把指针置 `nil`（逻辑删除），等特定时机才物理清理。

#### 最精彩的设计：Promotion（状态升级）与 Rebuild（账本重建）

如果新数据都在 dirty 里，读者岂不是每次都走加锁慢路径？

**Promotion（提拔）**：当 `misses` 次数 **≥ dirty 中数据数量**时，sync.Map 判断"去后台找的次数太多了"，触发提拔——**直接把 dirty 变成新的 read**，原 dirty 清空，misses 清零。大量锁竞争瞬间转化为无锁读取。

**Rebuild（重建）**：提拔后 dirty 为空，再有新增时，sync.Map 加锁遍历 read，把有效数据拷贝到新 dirty 里，再写入新 key。这是一个 **O(N)** 操作，也是 sync.Map 在频繁新增场景下的性能瓶颈。

### 讲解重点

- **适用场景**：key 稳定（写少读多）或各 Goroutine 操作不同 key 集合。这两种场景下 `sync.Map` 内部的 read-only 快路径能避免加锁。
- **不适用场景**：key 频繁增删、写入比例高的场景。此时 dirty 频繁重建产生巨大性能损耗，不如 `RWMutex` + 普通 map，或使用分段锁方案（如 `concurrent-map`）。
- **类型安全**：`sync.Map` 的 key 和 value 都是 `interface{}`/`any`，没有泛型约束。如果需要类型安全，可以自己封装或使用第三方库。
- **无法获取长度**：`sync.Map` 没有 `Len()` 方法，只能通过 `Range` 遍历计数，这本身就说明它不适合需要频繁统计大小的场景。

### sync 原语选择决策图

回顾 Section 6-9 的各种同步原语，可以按以下决策树选择：

<GoSyncPrimitiveDiagram kind="primitive-decision-tree" />
