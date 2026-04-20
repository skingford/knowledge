---
title: Eino Stream：流处理内部
description: 精读 eino v0.8.10 的流处理内部机制。从 schema.StreamReader 到 compose 中的流适配、拼接、扇出与背压，串起整条流水线。
---

# Eino Stream：流处理内部

> 源码路径：
> - [`schema/stream.go`](https://github.com/cloudwego/eino/blob/v0.8.10/schema/stream.go)（23 KB，底层流类型）
> - [`compose/stream_reader.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/stream_reader.go)（3 KB，图用流包装）
> - [`compose/stream_concat.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/stream_concat.go)（2 KB，流→值拼接）
> - [`compose/runnable.go`](https://github.com/cloudwego/eino/blob/v0.8.10/compose/runnable.go)（流适配器路径）

本页是流处理主题的**工程视角**：数据层底层实现请看 [schema](./schema.md)，这里重点讲 `compose` **怎么用**流来把不同模式的节点粘起来。

## 一、四种交互模式与 2×2 矩阵

`Runnable[I, O]` 的 4 个方法对应 2×2 矩阵：

|  | 输入：单值 I | 输入：流 `*StreamReader[I]` |
| --- | --- | --- |
| 输出：单值 O | **Invoke** | **Collect** |
| 输出：流 `*StreamReader[O]` | **Stream** | **Transform** |

这四种模式不是 "只挑一个"——一个好的组件可能**需要几种都实现**。eino 的设计：

- **组件只要实现自己擅长的一种**
- 其他三种由框架自动合成
- 合成路径有代价（内部起 goroutine 或 buffer），**实现多种可得性能**

## 二、上下游四种组合的自动适配

当上游实现 X 模式、下游实现 Y 模式时，框架如何衔接？12 种组合：

```
          下游 Invoke   下游 Stream    下游 Collect   下游 Transform
上游 Invoke    直连        Invoke→Stream   Invoke→Collect   Invoke→Transform
上游 Stream    Stream→Invoke    直连       Stream→Collect   Stream→Transform
上游 Collect   Collect→Invoke   Collect→Stream    直连      Collect→Transform
上游 Transform Transform→Invoke Transform→Stream  Transform→Collect  直连
```

对应到 `compose/runnable.go` 里 12 个适配函数：

```
// 把输出单值的转成流：本质是 "把结果塞进单元素流"
streamByInvoke       invokeByCollect      （实际不存在这组）

// 把输出流的转成单值：本质是 "用 ConcatMessages 把所有 chunk 合一"
invokeByStream       invokeByTransform
collectByTransform   collectByStream

// 把输入单值的转成流：本质是 "把入参包成单元素流"
collectByInvoke      transformByInvoke

// 把输入流的转成单值：本质是 "Recv 直到 EOF，再 Concat"
streamByCollect      streamByTransform
invokeByCollect      invokeByTransform
```

（以上列表是按 "用谁补谁" 的命名规则列的，具体函数名参考 [components-overview](./components-overview.md) 第四节的 4×3 矩阵）

## 三、StreamReader 内部实现回顾

详见 [schema](./schema.md#四-streamreader--streamwriter-详解)，这里只列关键点：

- 基于 buffered channel 的 `Pipe`
- 内部分 5 种 `readerType`，`Recv` 按类型分派（避免虚调用）
- `Copy(n)` 用链表缓冲做扇出——每个孩子独立游标
- `MergeStreamReaders` / `MergeNamedStreamReaders` 用于扇入
- `StreamReaderWithConvert` 支持 `ErrNoValue` 过滤
- Close 是 `sync.Once`，幂等

## 四、compose 中的流包装（`compose/stream_reader.go`）

compose 用一层薄薄的包装扩展流能力。这个文件只有 3 KB，主要职责：

- 把 `*schema.StreamReader[T]` 转成**泛型擦除**（`any`）版本，以便在图执行引擎里按 interface 统一处理
- 暴露一个 `streamReaderPacker` 类型，把流、错误、元信息打包在一起
- 提供给 `graph_run.go` 调度时的抽象

在节点的视角，流是强类型的 `*schema.StreamReader[具体类型]`；在引擎视角，流是类型擦除的通用 pipe。

## 五、流→值的拼接（`compose/stream_concat.go`）

当框架需要把一个流 "合一" 成单值（`Invoke` 补 `Stream`、`Collect` 补 `Transform`），它要知道"怎么合"。

`schema/message.go` init 阶段注册了三个拼接器：

```go
internal.RegisterStreamChunkConcatFunc(ConcatMessages)       // *Message
internal.RegisterStreamChunkConcatFunc(ConcatMessageArray)   // []*Message
internal.RegisterStreamChunkConcatFunc(ConcatToolResults)    // []*ToolResult
```

`compose/stream_concat.go` 在需要合流时按**类型查表**找到对应的 Concat 函数执行。若类型没注册拼接器，框架退化为 "取最后一个元素" 或 "切片 append"（依 concrete 实现）。

### 5.1 ConcatMessages 的要点

拼接两个 `*schema.Message` 的规则：

- `Content` 字符串拼接
- `ToolCalls` 按 `Index` 分组合并（每个 Index 单独拼 Name 与 Arguments）
- `ResponseMeta.Usage` 取最后一条的 Usage
- 多模态部件 `MultiContent` 按 `MessageStreamingMeta.Index` 分组

这就是 "LLM 把一整句话拆成多个 SSE chunk 时，如何重新拼回完整消息"——**规范由 eino 框架定义**。

## 六、多节点扇入扇出

### 6.1 扇出（一流多订阅）

在 Graph 里，一个节点的输出流可能被多个下游订阅。Compile 时为该节点插入 `StreamReader.Copy(n)`，每个下游拿一个 child reader，独立消费，互不阻塞。

### 6.2 扇入（多流合并）

多个上游都指向同一个下游时，`MergeNamedStreamReaders` 把所有源命名合并：

```go
merged := schema.MergeNamedStreamReaders(map[string]*schema.StreamReader[T]{
    "branchA": readerA,
    "branchB": readerB,
})
for {
    chunk, err := merged.Recv()
    switch {
    case errors.Is(err, io.EOF):
        return
    case err != nil && chunk == nil:
        if srcEOF, ok := schema.AsSourceEOF(err); ok {
            log.Printf("source %s ended", srcEOF.Source)
            continue
        }
        return err
    // 正常 chunk
    }
}
```

`SourceEOF` 是关键：下游由此得知 "哪一路已经结束"。

## 七、背压与 Close 语义

### 7.1 背压机制

- `Pipe(cap)` 容量满时 `w.Send` 阻塞——这就是背压：下游消费慢，上游自动放缓
- 如果下游已关，`w.Send` 返回 `true`（closed signal），上游应立即退出生产循环

### 7.2 Close 责任分工

| 流的来源 | Close 责任方 |
| --- | --- |
| 用户调 `Pipe()` 产出的 | 用户两端都要 Close |
| 组件从 `Stream/Transform` 方法返回的 | 调用方 Close |
| 框架在 Graph 执行中创建的中间流 | 框架负责 Close |
| `Copy(n)` 的子流 | **每个子流都要 Close**，全关后父流自动关 |

### 7.3 取消链路

`ctx.Cancel()` 发生后：

1. Graph 调度器收到 ctx.Done 信号
2. 所有正在运行的节点 goroutine 收到 ctx
3. 所有中间流被 Close，`Recv` 立即返回 err
4. 上游生产者收到 closed signal，停止生产
5. goroutine 全部退出，无泄漏

## 八、常见陷阱

### 8.1 流未消费导致 goroutine 泄漏

```go
reader, _ := m.Stream(ctx, messages)
// ❌ 忘了 Close，也没 Recv 到 EOF
if something { return nil }
```

生产侧的 goroutine 永远卡在 `Send`。**规范**：永远 `defer reader.Close()`。

### 8.2 共享流导致 race

`schema.StreamReader` **只能被消费一次**（这是注释里的硬约束）。如果多个消费者要消费同一流，必须先 `Copy(n)`。

### 8.3 把 Close 留给 GC finalizer

`SetAutomaticClose` 是兜底，不是常态。依赖它意味着内存压力下流才释放，可能几秒到几分钟。生产代码必须显式 Close。

### 8.4 大 chunk 堆积

`Pipe(cap=1000)` 让消费者慢慢追——但如果消费者真的追不上，这 1000 个 chunk 就一直占内存。设置 cap 时要考虑单 chunk 大小与期望的消费速率。

### 8.5 convert 函数里做重逻辑

`StreamReaderWithConvert` 的 convert 在每次 `Recv` 时执行。如果 convert 里做 I/O 或重计算，会把流的吞吐卡在 convert 速率。**规范**：convert 只做纯函数式转换；需要 I/O 就造一个中间节点。

## 九、流式 Callback 的陷阱

流式场景下，默认的 `OnStart / OnEnd` 一般只在**方法调用前后**触发——但对流来说 "方法返回" 只是 "造好了一根管道"，真正的数据还没到。

所以流式组件应当：

1. 实现 `components.Checker.IsCallbacksEnabled() bool = true`，让框架放弃自动触发
2. 自己在合适时机（首 token、每个 chunk、最终 EOF）触发 `callbacks.OnXxxWithStreamOutput`

见 [Callback：回调机制](./callback.md)。

## 十、性能建议

1. **热路径上的组件把 4 种模式都实现**，避免自动补齐的转换开销
2. **单 chunk 大小适中**——太小 Recv 次数多、context 切换多；太大背压颗粒粗
3. **Close 总是 defer**——别省，goroutine 泄漏比性能重要得多
4. **扇出前想清楚用户数**——`Copy(100)` 的 buffer 叠加可能很可观
5. **把 Concat 自定义类型注册到 internal**——否则自动补齐会退化

## 延伸阅读

- [schema：消息与流](./schema.md)
- [components：组件抽象总览](./components-overview.md)
- [Graph：图编排核心](./graph.md)
- [Callback：回调机制](./callback.md)
- [ChatModel：模型调用](./chatmodel.md)（流式 LLM 的典型消费方）
