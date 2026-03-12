---
title: container/heap 源码精读
description: 精读 container/heap 的接口驱动堆实现，理解优先队列、堆排序与 heap.Fix 的使用场景。
---

# container/heap：堆与优先队列源码精读

> 核心源码：`src/container/heap/heap.go`（仅约 100 行）

## 包结构图

```
container 包全景
══════════════════════════════════════════════════════════════════

  container/heap  ← 堆（优先队列底层）
  ├── heap.Interface（内嵌 sort.Interface + Push + Pop）
  ├── heap.Init(h)          ← O(n) 建堆
  ├── heap.Push(h, x)       ← O(log n) 插入
  ├── heap.Pop(h)           ← O(log n) 取最小元素
  ├── heap.Fix(h, i)        ← O(log n) 元素值变更后修复
  └── heap.Remove(h, i)     ← O(log n) 删除任意位置元素

  container/list   ← 双向链表（O(1) 插入/删除）
  container/ring   ← 循环链表（固定长度环形缓冲）

  堆的物理结构（数组实现二叉树）：
  索引:    0    1    2    3    4    5    6
  值:      1    3    2    7    5    8    4
  树形:
               1(0)
              /    \
           3(1)    2(2)
          /   \   /   \
        7(3) 5(4) 8(5) 4(6)

  父子关系：parent(i) = (i-1)/2
            left(i)  = 2*i+1
            right(i) = 2*i+2

══════════════════════════════════════════════════════════════════
```

---

## 一、heap.Interface

```go
// src/container/heap/heap.go
// heap.Interface 需要实现：
type Interface interface {
    sort.Interface          // Len() int; Less(i, j int) bool; Swap(i, j int)
    Push(x any)            // 在末尾追加元素（底层 slice append）
    Pop() any              // 移除并返回末尾元素（底层 slice 缩减）
}

// ⚠️ heap 包自己调用 sort.Interface 和 Push/Pop
// 使用者实现 Less(i, j)：
// - Min-Heap（最小堆）：return h[i] < h[j]   ← 默认
// - Max-Heap（最大堆）：return h[i] > h[j]
```

---

## 二、核心算法

```go
// src/container/heap/heap.go（完整实现，约 100 行）

// Init 建堆：从最后一个非叶节点向上 sift-down，O(n)
func Init(h Interface) {
    n := h.Len()
    for i := n/2 - 1; i >= 0; i-- {
        down(h, i, n)
    }
}

// Push：追加到末尾 → sift-up 恢复堆序，O(log n)
func Push(h Interface, x any) {
    h.Push(x)          // 追加到末尾（用户实现）
    up(h, h.Len()-1)   // 向上冒泡
}

// Pop：将根与末尾交换 → 缩减 → sift-down 恢复，O(log n)
func Pop(h Interface) any {
    n := h.Len() - 1
    h.Swap(0, n)       // 根（最小值）换到末尾
    down(h, 0, n)      // 新根向下调整
    return h.Pop()     // 取出末尾（原根）
}

// Fix：某元素值改变后修复堆序（先 up 再 down），O(log n)
func Fix(h Interface, i int) {
    if !down(h, i, h.Len()) {
        up(h, i)
    }
}

// down：向下调整（与最小子节点交换）
func down(h Interface, i0, n int) bool {
    i := i0
    for {
        j1 := 2*i + 1      // 左子节点
        if j1 >= n || j1 < 0 { break }
        j := j1
        if j2 := j1 + 1; j2 < n && h.Less(j2, j1) {
            j = j2          // 取更小的子节点
        }
        if !h.Less(j, i) { break } // 父 ≤ 子，堆序已满足
        h.Swap(i, j)
        i = j
    }
    return i > i0
}
```

---

## 三、代码示例

### 最小整数堆

```go
// 最简单的整数最小堆
type MinHeap []int

func (h MinHeap) Len() int            { return len(h) }
func (h MinHeap) Less(i, j int) bool  { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x any)         { *h = append(*h, x.(int)) }
func (h *MinHeap) Pop() any {
    old := *h
    n := len(old)
    x := old[n-1]
    *h = old[:n-1]
    return x
}

func main() {
    h := &MinHeap{5, 2, 8, 1, 3}
    heap.Init(h)                    // [1 2 8 5 3]

    heap.Push(h, 0)                 // 插入 0
    fmt.Println(heap.Pop(h))        // 0（最小值）
    fmt.Println(heap.Pop(h))        // 1
    fmt.Println(heap.Pop(h))        // 2
}
```

### 优先队列（带优先级的任务调度）

```go
type Task struct {
    name     string
    priority int // 数值越小优先级越高
    index    int // 在堆中的索引（heap.Fix 需要）
}

type PriorityQueue []*Task

func (pq PriorityQueue) Len() int            { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool  { return pq[i].priority < pq[j].priority }
func (pq PriorityQueue) Swap(i, j int) {
    pq[i], pq[j] = pq[j], pq[i]
    pq[i].index, pq[j].index = i, j // 维护 index
}
func (pq *PriorityQueue) Push(x any) {
    n := len(*pq)
    task := x.(*Task)
    task.index = n
    *pq = append(*pq, task)
}
func (pq *PriorityQueue) Pop() any {
    old := *pq
    n := len(old)
    task := old[n-1]
    old[n-1] = nil   // 防止内存泄漏
    task.index = -1  // 标记已出队
    *pq = old[:n-1]
    return task
}

// 修改优先级（heap.Fix 核心用法）
func (pq *PriorityQueue) update(task *Task, priority int) {
    task.priority = priority
    heap.Fix(pq, task.index) // O(log n) 修复
}

func main() {
    pq := &PriorityQueue{
        {name: "低优先级任务", priority: 10},
        {name: "高优先级任务", priority: 1},
        {name: "中优先级任务", priority: 5},
    }
    for i, t := range *pq { t.index = i }
    heap.Init(pq)

    heap.Push(pq, &Task{name: "紧急任务", priority: 0})

    for pq.Len() > 0 {
        task := heap.Pop(pq).(*Task)
        fmt.Printf("[%d] %s\n", task.priority, task.name)
    }
    // [0] 紧急任务
    // [1] 高优先级任务
    // [5] 中优先级任务
    // [10] 低优先级任务
}
```

### 最大堆（Top-K 问题）

```go
// 求数组中最大的 K 个数（用最小堆维护大小为 K 的窗口）
func topK(nums []int, k int) []int {
    h := MinHeap(nums[:k])
    heap.Init(&h)

    for _, n := range nums[k:] {
        if n > h[0] { // 比堆顶（最小值）大，替换
            h[0] = n
            heap.Fix(&h, 0)
        }
    }
    return []int(h) // 堆中即为 top-k 个最大值
}

// 另一种：直接用最大堆
type MaxHeap []int
func (h MaxHeap) Less(i, j int) bool { return h[i] > h[j] } // 反转

// 合并 K 个有序链表（经典堆应用）
type NodeHeap []*ListNode
func (h NodeHeap) Less(i, j int) bool { return h[i].Val < h[j].Val }
// ... 其余实现 ...

func mergeKLists(lists []*ListNode) *ListNode {
    h := NodeHeap{}
    for _, l := range lists {
        if l != nil { h = append(h, l) }
    }
    heap.Init(&h)
    dummy := &ListNode{}
    cur := dummy
    for h.Len() > 0 {
        node := heap.Pop(&h).(*ListNode)
        cur.Next = node
        cur = cur.Next
        if node.Next != nil {
            heap.Push(&h, node.Next)
        }
    }
    return dummy.Next
}
```

### 时间轮（定时任务调度）

```go
// 用最小堆实现简易定时器（按触发时间排序）
type Timer struct {
    at      time.Time
    fn      func()
    index   int
}

type TimerHeap []*Timer
func (h TimerHeap) Less(i, j int) bool { return h[i].at.Before(h[j].at) }
// ... 其余 heap.Interface 实现 ...

type Scheduler struct {
    mu   sync.Mutex
    heap *TimerHeap
}

func (s *Scheduler) After(d time.Duration, fn func()) {
    s.mu.Lock()
    defer s.mu.Unlock()
    heap.Push(s.heap, &Timer{at: time.Now().Add(d), fn: fn})
}

func (s *Scheduler) Run(ctx context.Context) {
    for {
        s.mu.Lock()
        if s.heap.Len() == 0 {
            s.mu.Unlock()
            time.Sleep(time.Millisecond)
            continue
        }
        top := (*s.heap)[0]
        delay := time.Until(top.at)
        s.mu.Unlock()

        if delay <= 0 {
            s.mu.Lock()
            t := heap.Pop(s.heap).(*Timer)
            s.mu.Unlock()
            go t.fn()
        } else {
            select {
            case <-ctx.Done(): return
            case <-time.After(delay):
            }
        }
    }
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| heap.Init 的时间复杂度为什么是 O(n)？ | 从 n/2-1 向上 sift-down，底层节点 sift 距离短；数学推导 O(n) 而非 O(n log n) |
| heap 包为什么要用户实现 Push/Pop？ | 解耦存储（slice/数组/其他结构）与堆逻辑；避免 interface{} 装箱，保持类型安全 |
| heap.Fix 的使用场景？ | 元素的优先级在堆中改变后调用；O(log n) 比 Remove+Push 更高效 |
| 如何实现最大堆？ | Less 返回 `h[i] > h[j]`（反转比较）|
| heap.Pop 取出的是下标 0 的元素吗？ | 不直接取！先 Swap(0, n-1) 再 down，最后调用用户的 Pop() 取末尾 |
| container/heap 线程安全吗？ | 不安全，并发访问需自己加 sync.Mutex |
