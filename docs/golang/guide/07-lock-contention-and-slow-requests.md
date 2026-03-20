---
title: 锁竞争分析与慢请求排查
description: Go mutex profile 锁竞争分析、分片降低锁粒度、请求链路追踪中间件与分段计时。
head:
  - - meta
    - name: keywords
      content: Go锁竞争,mutex profile,分片Map,慢请求排查,Trace ID,分段计时,P99
---

# 锁竞争分析与慢请求排查

## 8. 锁竞争分析

当多个 goroutine 频繁竞争同一把锁时，程序的并发性能会严重下降。Go 提供了 mutex profile 来定位锁竞争热点。

### 开启 Mutex Profile

```go
package main

import (
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"sync"
)

func main() {
	// 开启 mutex profile，采样比例 1（全采样）
	runtime.SetMutexProfileFraction(1)

	var mu sync.Mutex
	counter := 0

	// 模拟高并发锁竞争
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < 10000; j++ {
				mu.Lock()
				counter++
				mu.Unlock()
			}
		}()
	}

	go func() {
		fmt.Println("pprof on :6060")
		http.ListenAndServe(":6060", nil)
	}()

	wg.Wait()
	fmt.Println("counter:", counter)
}
```

### 分析锁竞争

```bash
# 采集 mutex profile
go tool pprof http://localhost:6060/debug/pprof/mutex

# 交互模式下查看竞争热点
# (pprof) top
# (pprof) list funcName
```

<GoPerformanceDiagram kind="mutex-profile" />

### 分片降低锁粒度

```go
package main

import (
	"fmt"
	"hash/fnv"
	"sync"
)

const shardCount = 32

type ShardedMap struct {
	shards [shardCount]struct {
		sync.RWMutex
		data map[string]interface{}
	}
}

func NewShardedMap() *ShardedMap {
	m := &ShardedMap{}
	for i := range m.shards {
		m.shards[i].data = make(map[string]interface{})
	}
	return m
}

func (m *ShardedMap) getShard(key string) int {
	h := fnv.New32a()
	h.Write([]byte(key))
	return int(h.Sum32()) % shardCount
}

func (m *ShardedMap) Set(key string, val interface{}) {
	idx := m.getShard(key)
	m.shards[idx].Lock()
	m.shards[idx].data[key] = val
	m.shards[idx].Unlock()
}

func (m *ShardedMap) Get(key string) (interface{}, bool) {
	idx := m.getShard(key)
	m.shards[idx].RLock()
	val, ok := m.shards[idx].data[key]
	m.shards[idx].RUnlock()
	return val, ok
}

func main() {
	m := NewShardedMap()
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			key := fmt.Sprintf("key-%d", id)
			m.Set(key, id)
			val, _ := m.Get(key)
			fmt.Println(key, val)
		}(i)
	}
	wg.Wait()
}
```

<GoPerformanceDiagram kind="sharded-map" />

### 讲解重点

- **SetMutexProfileFraction**：该值控制采样比例。设为 1 表示记录每次锁竞争，线上建议设为 5-10，降低开销。设为 0 关闭采样。
- **降低锁粒度的三个层次**：（1）缩小临界区，锁内只做最小操作；（2）分片，将一把大锁拆成多把小锁；（3）用 `sync/atomic` 或 lock-free 结构替代锁。
- **读写锁的适用条件**：读多写少的场景用 `sync.RWMutex` 替代 `sync.Mutex`，允许多个读并发。但如果写操作频繁，`RWMutex` 可能比 `Mutex` 更差（写锁需要等所有读锁释放）。

---

## 9. 接口慢请求排查

线上服务的慢请求通常涉及多个环节，需要结合 Trace、日志和指标进行关联分析。

### 请求链路追踪中间件

```go
package main

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"
)

type contextKey string

const traceIDKey contextKey = "trace_id"

// 生成 Trace ID 的中间件
func traceMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		traceID := fmt.Sprintf("trace-%d", rand.Int63())
		ctx := context.WithValue(r.Context(), traceIDKey, traceID)

		start := time.Now()
		next.ServeHTTP(w, r.WithContext(ctx))
		duration := time.Since(start)

		// 记录请求耗时
		log.Printf("[%s] %s %s %v", traceID, r.Method, r.URL.Path, duration)

		// 慢请求告警
		if duration > 500*time.Millisecond {
			log.Printf("[SLOW] [%s] %s took %v", traceID, r.URL.Path, duration)
		}
	})
}

// 模拟业务处理
func handleOrder(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	traceID := ctx.Value(traceIDKey).(string)

	// 模拟数据库查询
	dbStart := time.Now()
	time.Sleep(time.Duration(50+rand.Intn(200)) * time.Millisecond)
	log.Printf("[%s] DB query took %v", traceID, time.Since(dbStart))

	// 模拟下游服务调用
	rpcStart := time.Now()
	time.Sleep(time.Duration(100+rand.Intn(400)) * time.Millisecond)
	log.Printf("[%s] RPC call took %v", traceID, time.Since(rpcStart))

	fmt.Fprintf(w, "order processed, trace: %s", traceID)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/order", handleOrder)
	log.Fatal(http.ListenAndServe(":8080", traceMiddleware(mux)))
}
```

### 分段计时工具

```go
package main

import (
	"fmt"
	"time"
)

// Span 记录一个操作的耗时
type Span struct {
	Name     string
	Duration time.Duration
}

// Timer 收集多个 Span
type Timer struct {
	spans []Span
}

func (t *Timer) Track(name string) func() {
	start := time.Now()
	return func() {
		t.spans = append(t.spans, Span{
			Name:     name,
			Duration: time.Since(start),
		})
	}
}

func (t *Timer) Report() {
	for _, s := range t.spans {
		fmt.Printf("  %-20s %v\n", s.Name, s.Duration)
	}
}

func main() {
	t := &Timer{}

	// 模拟各阶段
	end := t.Track("validate_input")
	time.Sleep(10 * time.Millisecond)
	end()

	end = t.Track("query_db")
	time.Sleep(150 * time.Millisecond)
	end()

	end = t.Track("call_payment")
	time.Sleep(300 * time.Millisecond)
	end()

	end = t.Track("send_notification")
	time.Sleep(50 * time.Millisecond)
	end()

	fmt.Println("Request breakdown:")
	t.Report()
}
```

<GoPerformanceDiagram kind="slow-request-breakdown" />

### 讲解重点

- **Trace ID 是关联一切的线索**：一个请求从入口到数据库、到下游服务，所有日志都带上同一个 Trace ID，排查慢请求时可以快速串联整条链路。生产环境建议使用 OpenTelemetry 等标准方案。
- **分段计时定位瓶颈**：将请求处理拆分为多个阶段（验证、查数据库、调下游、序列化等），各段独立计时。慢请求出现时，日志直接告诉你是哪个阶段慢了。
- **P99 比平均值更重要**：平均耗时可能看不出问题，P99（第 99 百分位）才能暴露尾部延迟。监控系统应同时记录 P50、P95、P99。
