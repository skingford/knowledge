---
title: Node.js 源码剖析：V8 内存布局与分代 GC
description: 深入 V8 堆结构与 GC，讲清 SMI / HeapObject / Tagged Pointer 对象表示、New Space / Old Space / Large Object Space 堆划分、Scavenge 半空间拷贝、Mark-Compact 三阶段、Incremental / Concurrent Marking 与 write barrier，以及 Node.js 内存治理的真正边界。
search: false
---

# Node.js 源码剖析：V8 内存布局与分代 GC

上一篇讲 V8 怎么把 JS **跑起来**。这一篇讲 V8 怎么把 JS 对象**放好、清走**。

读完你应该能回答：

- `--max-old-space-size=4096` 到底改了 V8 内部哪一块
- Scavenge 为什么 1ms 能搞定，Mark-Compact 为什么动辄 50-200ms
- `heap used` 突然抖一下却没真的 OOM，到底发生了什么
- 为什么大对象不进 new space，直接去 old space
- Incremental Marking / Concurrent Marking 是怎么把 stop-the-world 拆成小块的
- Write Barrier 是什么、为什么每次赋值都要付出这个代价

## 版本口径与前置阅读

**源码版本**：Node.js 22 LTS 自带 V8 12.x。GC 核心机制（Scavenge + Mark-Compact + Incremental + Concurrent）从 V8 9.x 起就基本稳定，本篇的代码路径在 13.x / 14.x 依然适用。

**前置阅读**：

- [V8 执行管线、Ignition 字节码与 TurboFan 优化](./source-v8-pipeline-ignition-turbofan-and-ic.md)——里面的 HiddenClass / 对象模型是本篇的前提
- [Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md)——Isolate 是 GC 的边界，**每个 Isolate 有独立堆独立 GC**，跨 Worker 不会互相 stop-the-world

**与 runtime-event-loop 文档的边界**：

- runtime-event-loop：应用层"内存涨了怎么办、heap snapshot 怎么读"
- 本篇：V8 内部"GC 为什么这样设计、这些参数到底改的是什么"

## V8 对象表示：SMI / HeapObject / Tagged Pointer

在看堆布局之前，先理解 V8 **所有 JS 值在内存里长什么样**。

### 所有 JS 值都是指针大小

64 位下是 8 字节（压缩指针模式下是 4 字节）。V8 用这个指针的**低位 tag bit** 区分"立即数"和"堆对象"。

```cpp
// src/objects/tagged.h (概念)
// 64 位：最低位 = 0 → SMI；最低位 = 1 → HeapObject 指针
enum class Tag {
  kSmiTag      = 0,  // 31-bit signed int（压缩模式）
  kHeapObjectTag = 1,
};
```

### SMI（Small Integer）

"小整数"直接存在指针里，不占堆：

```
原值      32         // JS 里 Number
内存位    0b...100000 0   // 左移 1 位，低位标记为 0 = SMI
```

解码就是右移一位。这让 **`a + b` 在两个 SMI 之间不碰堆**——加法直接在寄存器里做。

SMI 的范围：**-2^30 ~ 2^30 - 1**（压缩指针模式下）。超出范围的整数走 **HeapNumber**（堆对象，8 字节 double）。

### HeapObject

所有非 SMI 的值都是堆对象：字符串、对象、函数、`>2^30` 整数、double。它们的布局：

```
+---------------+  ← 指针指向这里（低位为 1）
| Map*          |  ← 指向 HiddenClass
+---------------+
| field 0       |
| field 1       |
| ...           |
+---------------+
```

第一个字段**总是 Map 指针**。GC 正是通过这个 Map 知道"这个对象有多大、有几个指针字段"。

### 为什么这个设计重要

- **GC 扫描快**：不用区分类型，扫到一个指针只看最低位就知道要不要递归
- **内存紧凑**：SMI 不占堆空间
- **tag bit 让 JS 的数值语义统一**：加一个 SMI 和加一个 HeapNumber 走不同分支，但对上层透明

工程启示：**数组里混用 SMI 和 HeapNumber 有代价**——V8 的 `PACKED_SMI_ELEMENTS` → `PACKED_DOUBLE_ELEMENTS` 状态转换会重新分配并重新 box。

## V8 堆布局：5 大空间

V8 把堆切成若干 **Space**，每种按不同策略管理。

<NodejsLibuvDiagram kind="v8-heap-layout" />

| Space | 用途 | GC 策略 | 典型大小 |
| --- | --- | --- | --- |
| **New Space** | 新生代对象（短命） | Scavenge | 1~8 MB（从一个半空间算） |
| **Old Space** | 晋升下来的长命对象 | Mark-Compact | 受 `--max-old-space-size` 限制 |
| **Large Object Space** | 超过阈值（约 512KB）的大对象 | Mark-Compact 但不 compact | 按需分配 |
| **Code Space** | JIT 生成的原生码 | Mark-Compact | 小 |
| **Read-only Space** | 启动期常量（`undefined` / `null` / 内置 string） | 不 GC | 小 |

### 堆上限

- 默认 `--max-old-space-size` 在 64 位 Linux 上约为 **1400MB** ~ **2048MB**（和 Node 版本有关）
- `--max-old-space-size=4096` 指的就是 **Old Space 的上限**
- New Space 大小由 `--max-semi-space-size` 控制（默认约 16MB；实际可用空间 = 它的一半，因为半空间轮换）

### 源码入口

```cpp
// src/heap/heap.h (概念)
class Heap {
  NewSpace*        new_space_;
  PagedSpace*      old_space_;
  LargeObjectSpace* large_object_space_;
  CodeSpace*       code_space_;
  // ...
  GarbageCollector CollectGarbage(AllocationSpace space, ...);
};
```

每个 Space 下面再分成若干 **Page**（1MB 的大页），对象按 page 分配，GC 也按 page 遍历。

## 分代假说与 Scavenge

经验观察：**90% 以上的对象在创建后几毫秒内就死掉**（闭包里的临时变量、迭代器对象、for 循环里的中间结果）。

基于这个假说，V8 把新对象放在 **New Space**，用超快的 **Scavenge** 算法回收；活过几轮的对象"晋升"到 **Old Space**，用更慢但更彻底的 Mark-Compact 回收。

### Scavenge 半空间拷贝

New Space 被切成两半：**From-Space** 和 **To-Space**。任何时刻只有一半在用。

```cpp
// src/heap/scavenger.cc (概念)
void Scavenger::CollectGarbage() {
  // 1. 扫描根集合（栈、全局对象、寄存器）
  for (Object* root : roots) {
    ScavengeObject(root);
  }

  // 2. ScavengeObject：
  //    - 如果对象在 From → 拷到 To，原位置留一个转发指针
  //    - 把指向它的指针更新到新位置
  //    - 递归扫描这个对象的所有字段

  // 3. 交换 From 和 To 角色
  SemiSpace::Swap();
}
```

每次 Scavenge 后：

- **活对象被整齐拷到 To-Space**（自带整理，没有碎片）
- **From-Space 整个丢弃**（不需要逐个 free）
- 晋升：**活过两轮 Scavenge 的对象**被搬到 Old Space

### 为什么 Scavenge 这么快

- **不扫 Old Space**——Old Space 指向 New Space 的引用靠 **Remembered Set** + write barrier 维护
- **只处理活对象**——死对象不动手
- **没碎片**——天然 compact

典型耗时：**< 1ms**。

### Remembered Set

Old Space 对象里可能包含指向 New Space 的指针（`old.someField = newObj`）。如果不记录，Scavenge 就得扫整个 Old Space。

V8 用 **Slot Set**（每个 page 一个 bitset）记录"这个 page 里哪些 slot 指向 New Space"。每次 Old Space 里的赋值都会触发 **write barrier** 更新这个 set。

## 老生代 Mark-Compact 三阶段

Old Space 用的是 **Mark-Compact**——经典的三阶段 GC。

<NodejsLibuvDiagram kind="mark-compact-phases" />

### 阶段 1：Marking（标记）

```cpp
// src/heap/mark-compact.cc (概念)
void MarkCompactCollector::MarkLiveObjects() {
  // 从根集合开始 BFS
  while (!marking_worklist_.IsEmpty()) {
    HeapObject* obj = marking_worklist_.Pop();
    if (!IsMarked(obj)) {
      SetMark(obj);
      // 把所有出边（指针字段）推进 worklist
      VisitObject(obj);
    }
  }
}
```

用三色标记（白 / 灰 / 黑）：

- **白**：还没访问（默认）
- **灰**：已访问但它的引用字段还没扫
- **黑**：本身访问过，所有字段也扫过

结束时还是白色的对象 = 垃圾。

### 阶段 2：Sweeping（清除）

释放白色对象占的内存，加到 free list。

```cpp
void MarkCompactCollector::SweepSpace(PagedSpace* space) {
  for (Page* p : *space) {
    SweepPage(p);  // 遍历 page，白对象加 free list
  }
}
```

Sweep 是 **Lazy** 的——不会一次扫完所有 page，按需在分配时推进。

### 阶段 3：Compaction（整理）

如果空间碎片严重，把活对象搬到新 page，更新所有指针。这一步**最贵**，所以不每次都做：

```cpp
bool MarkCompactCollector::ShouldCompact() {
  // 根据碎片率和最近 GC 历史决定
}
```

### Full GC 的代价

典型 Old Space 1GB、活对象 400MB 的堆，一次 Mark-Compact：

- **Mark**: 100~300ms
- **Sweep + Compact**: 50~200ms

**这就是 Node.js p99 抖的常见来源**。一旦这个数字出现，下面要讲的 Incremental / Concurrent Marking 就派上用场了。

## Incremental Marking：把 stop-the-world 切小

纯 Mark-Compact 的问题：mark 阶段必须 **stop-the-world**，不然 JS 代码会在 mark 中途改指针，导致漏标。

Incremental Marking 的思路：**分多次**，每次 marking 做一小段（~5ms），中间让 JS 代码跑。但 JS 代码改指针时要配合维护一致性——这就是 **write barrier**。

### 三色不变式

纯 stop-the-world 下不需要这个；Incremental 下必须满足：

- **强三色不变式**：**黑色对象不能直接指向白色对象**

如果 JS 代码执行 `black.field = white`，就违反了。V8 有两种做法：

```cpp
// 选 A：把 white 变成 gray（推进它）
// 选 B：把 black 退回 gray（重扫它）
// V8 用 A（Dijkstra 风格）
```

### Write Barrier

每次 Old Space 里的对象赋值一个堆指针字段，编译器都插入一小段代码：

```cpp
// 概念伪码
void WriteBarrier(HeapObject* host, HeapObject* value) {
  if (!InYoungGeneration(value) && IsMarked(host) && !IsMarked(value)) {
    marking_worklist_.Push(value);  // 把 white 变 gray
    SetMark(value);
  }
  // 同时处理 remembered set（如果 value 在 New Space）
  if (InYoungGeneration(value) && InOldGeneration(host)) {
    RememberedSet::Add(host_page, slot);
  }
}
```

每次 object 的指针字段赋值都要付这个代价。TurboFan 优化时会尽量合并和消除，但不能全消。

### 工程启示

- **Node.js 写 `obj.x = somethingOld` 不是免费的**——它触发 write barrier
- **热路径大量 old-to-new 引用**会让 Remembered Set 膨胀，下次 Scavenge 变慢
- **字符串拼接在热路径上代价大**——每次 concat 都在堆上分配 + 触发 barrier，用 `Array.join` 或 template string

## Concurrent Marking：在后台线程跑 mark

Incremental 还是占主线程时间。V8 进一步把大部分 mark 放到**后台线程**：

```cpp
// src/heap/concurrent-marking.cc (概念)
class ConcurrentMarking {
  void Run(WorkerThread* thread) {
    while (!should_stop_) {
      HeapObject* obj = marking_worklist_.Pop();
      if (obj) VisitObject(obj);
    }
  }
};
```

主线程只负责：

- 扫根集合（栈、寄存器——后台线程拿不到）
- 处理 write barrier 产生的 gray 对象
- finalization

典型的 **Minor GC 1ms、Major GC 拆成 ~10ms 小片 + 后台并发 ~200ms 完成**。对应用层表现就是"p99 不再有 100ms+ 的 GC stall"。

### 相关 flag

- `--no-concurrent-marking`：关掉并发标记（debug / 测试用）
- `--no-incremental-marking`：关掉增量标记

关掉看到的抖动会立刻变明显——这是诊断"GC 是不是在拖延"的直接手段。

## Node.js 侧的内存治理

前面讲的全部在 V8 里。Node.js 给你哪些刀把子？

### 查堆用量

```js
const v8 = require('node:v8');
console.log(v8.getHeapStatistics());
// {
//   total_heap_size: 7811072,
//   total_heap_size_executable: 524288,
//   used_heap_size: 5067960,
//   heap_size_limit: 2197815296,   // ← 对应 --max-old-space-size
//   malloced_memory: 8192,
//   external_memory: 1000000,
//   ...
// }
```

`process.memoryUsage()` 比这个简版，但 `external` 字段是它的独占信息：

```js
process.memoryUsage()
// { rss, heapTotal, heapUsed, external, arrayBuffers }
```

- `external`：V8 管不到的堆外内存，比如 Buffer 的 backing store
- `arrayBuffers`：external 里 ArrayBuffer 的部分

### 调整上限

```bash
node --max-old-space-size=4096 index.js   # Old Space 4GB
node --max-semi-space-size=128 index.js   # New Space（半空间）128MB
```

- `max-old-space-size` 影响 Full GC 频率和单次耗时——太大会让 p99 抖得更厉害
- `max-semi-space-size` 太小会让晋升率升高，Old Space 涨得快；太大一次 Scavenge 就慢

经验：不到真的 OOM 不调。调完一定压测 GC pause 分布。

### Heap Snapshot

```js
const v8 = require('node:v8');
v8.writeHeapSnapshot('./snap.heapsnapshot');
```

Chrome DevTools → Memory → Load 进去，能看到：

- 每个对象的 retainer 链
- 每类 Constructor 占用
- Shallow size vs Retained size

**排查内存泄漏的金标准**：取两个快照（基线 + 压测后），对比 retainers。

### GC 触发监控

```js
const { PerformanceObserver } = require('node:perf_hooks');
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    if (e.entryType === 'gc') console.log(e);
  }
}).observe({ entryTypes: ['gc'] });
```

可以抓到每次 GC 的类型、时长、原因。上生产的监控一般接到 Prometheus。

## 与 Worker Threads 的关系

[上一篇讲过](./source-worker-threads-and-v8-isolate.md)：**每个 Worker 有独立 Isolate**。对应到本篇：

- **每个 Worker 有独立堆**，独立的 New Space / Old Space / etc.
- **GC 独立触发，独立 stop-the-world**——主线程 Major GC 不会冻结 Worker
- **`--max-old-space-size` 是每个 Isolate 一份还是进程一份？**——它是"每 Isolate"的默认，但可以通过 `Worker` 的 `resourceLimits.maxOldGenerationSizeMb` 单独限定

```js
new Worker('./w.js', {
  resourceLimits: {
    maxOldGenerationSizeMb: 512,     // Old Space 上限
    maxYoungGenerationSizeMb: 16,    // 半空间上限
    codeRangeSizeMb: 16,
  },
});
```

**高并发开很多 Worker 时一定要设 resourceLimits**——否则一个 Worker OOM 可以拖垮整个进程地址空间。

## 重点治理清单

把源码视角落到内存治理：

- **OOM 排障顺序**：先 `process.memoryUsage()` → 如果 `external` 大就看 Buffer；如果 `heapUsed` 大就做 heap snapshot
- **`heapUsed` 长期只涨不跌** = 泄漏；**短期涨完回落** = 正常 GC 节奏
- **`external` / `arrayBuffers` 涨而 `heapUsed` 平稳** = 大 Buffer 没释放，常见是流没正确 destroy
- **不要在全局 Map 里无限堆 key**——一定加 LRU 或 TTL
- **闭包引用 DOM-like 对象要小心**——Node.js 里常见是闭包 hold 住 request/response 对象
- **大 JSON 解析拆分批处理**——`JSON.parse` 是原子 C++ 调用，几 GB 字符串能直接 OOM
- **大对象（> 512KB）自动进 Large Object Space**——不要指望它们被 Scavenge 处理，生命周期过长会进 Full GC
- **热路径避免临时大对象**——预分配重用
- **Worker 必设 `resourceLimits`**——防止单 Worker 吃光进程内存
- **生产环境抓 GC metrics**——`--trace-gc` 临时看、`perf_hooks` 上报长期监控
- **`--max-old-space-size` 不要盲目调大**——调大 1 倍意味着 Full GC pause 可能也接近翻倍

## 下一步

- 回到 V8 执行视角看"Ignition 字节码 / TurboFan 优化是怎么影响 GC 的"，读 [V8 执行管线、Ignition 字节码与 TurboFan 优化](./source-v8-pipeline-ignition-turbofan-and-ic.md)
- 回到 Worker 层看"每个 Isolate 独立 GC 的实现"，读 [Worker Threads、V8 Isolate 与 C++ 层交互](./source-worker-threads-and-v8-isolate.md)
- 回到应用层看"内存涨了怎么在生产环境排查"，读 [Node.js 运行时、事件循环与性能排障](./runtime-event-loop-and-performance-troubleshooting.md)
