---
title: 高并发支付系统专题整理
description: 围绕高并发支付系统的 Go 性能、分布式事务、资金安全、清结算、跨境支付、热点账户与稳定性治理做系统梳理，适合用作架构设计和实战复盘参考。
vocabulary:
  - idempotent
  - throughput
  - latency
  - settlement
  - reconciliation
  - distributed-transaction
  - circuit-breaker
  - rate-limiting
  - hot-account
  - consistency
---

# 高并发支付系统专题整理

这份材料聚焦高并发支付系统，核心目标不是泛泛复习 Go 或分布式基础，而是围绕以下几个高频考点做针对性整理：

- 高可用：春节、双十一、大促峰值下系统不能垮。
- 资金安全：幂等、一致性、对账、补偿必须讲清楚。
- 跨境支付：多币种、汇率、清结算链路要有业务理解。
- 工程能力：不仅会写代码，还要会治理复杂系统、推动架构演进。

建议把这份文档当作速查手册，优先结合自己的项目案例、压测数据和事故处理经历一起使用。

## 复习主线

可以拆成五条主线来理解：

1. Go 底层与性能优化
2. 支付系统分布式架构与高可用
3. MySQL / PostgreSQL / Redis / Kafka 等关键中间件实战
4. 安全、合规与资损防控
5. 业务理解、AI 提效与架构演进

---

## 一、Go 硬核技术栈

支付场景下，Go 不只是“写接口快”，更关键的是你是否真的理解高并发服务的底层行为。

### 对应资料导航

- [runtime：GMP 调度器](/golang/guide/source-reading/runtime-scheduler)
- [channel：底层实现](/golang/guide/source-reading/channel)
- [context：上下文传播源码精读](/golang/guide/source-reading/context)
- [Context 使用边界](/golang/context-usage-boundaries)
- [runtime：GC 垃圾回收](/golang/guide/source-reading/runtime-gc)
- [runtime/pprof：性能剖析](/golang/guide/source-reading/runtime-pprof)
- [runtime/trace：执行追踪](/golang/guide/source-reading/runtime-trace)
- [sync.Pool：对象池](/golang/guide/source-reading/sync-pool)
- [Go 内存调优](/golang/guide/source-reading/go-memory-tuning)
- [Pprof 故障排查指南](/golang/pprof-troubleshooting-guide)

### 1. 并发模型

重点要能讲明白这些点：

- **GMP 调度模型**：G（goroutine）、M（OS 线程）、P（逻辑处理器）。P 绑定本地队列，M 从 P 获取 G 执行；当 M 阻塞时，P 会转移给空闲 M，保证并发度不降。
- **Channel 底层实现**：底层是带锁的环形缓冲区 + 发送/接收等待队列。无缓冲 channel 是同步交换，有缓冲是异步队列。关闭后读取返回零值。
- **`context` 超时与取消传播**：`context.WithTimeout` 创建定时取消上下文，子 context 会随父 context 一起取消，实现链路级超时传播；`cancel()` 仍然要主动调用，避免 timer 和子节点引用滞留。
- **请求上下文边界**：支付请求内的数据库、Redis、RPC、HTTP 下游调用应继续透传 `r.Context()`；但审计日志、通知补发、异步补偿这类离线任务，不应直接复用请求 `ctx`，否则 Handler 一返回就可能收到 `context canceled`。
- **离线任务治理**：Go 1.21+ 可用 `context.WithoutCancel()` 保留请求元数据但切断父级取消信号；同时要重新设置独立超时，防止后台任务无限运行。
- **goroutine 泄漏识别与治理**：`pprof` 查看 goroutine 数量趋势；常见原因是 channel 无人读/写、HTTP 请求未设超时。治理靠 `context` 控制生命周期 + `select` 监听 `ctx.Done()`。

结合支付语境理解时，可以这样表述：

> 支付链路里最怕长事务、慢下游和超时扩散，所以 `context` 不是为了代码优雅，而是为了控制整条资金链路的超时边界；请求内任务要跟着请求一起收敛，离线任务则要显式重建自己的生命周期，避免资源泄漏和雪崩。

### 2. 内存与性能

建议重点复习：

- **GC 三色标记**：白色（未扫描）、灰色（已发现、待扫描子引用）、黑色（已扫描完成）。并发标记阶段通过写屏障维护三色不变式，避免漏标。
- **STW 对尾延迟的影响**：GC 的 Mark Termination 阶段会短暂 STW，高频 GC 导致 P99 抖动。优化方向：减少堆分配 → 降低 GC 频率 → 缩短 STW。
- **逃逸分析**：编译器决定变量分配在栈还是堆。`go build -gcflags="-m"` 查看逃逸情况，避免不必要的堆分配（如返回局部变量指针、interface 装箱）。
- **`pprof` / `trace`**：`pprof` 用于 CPU/内存/goroutine 采样分析；`trace` 用于可视化调度延迟、GC 暂停、goroutine 阻塞等运行时行为。
- **`sync.Pool` 适用边界**：适合高频创建/销毁的临时对象（如 buffer、编解码器），不适合有状态的对象。Pool 中的对象可能在任意 GC 后被回收，不保证持久性。

### 3. 优化实战要点

准备一个“如何降低 P99 延迟”的案例，最好包含：

- 问题现象：例如支付网关接口高峰时延明显抖动
- 定位方法：`pprof`、火焰图、trace、GC 日志
- 优化动作：减少内存分配、对象复用、字符串拼接优化、热点锁拆分
- 结果数据：QPS、P99、GC 次数、CPU 使用率变化

### 4. 工程化能力

复杂系统实践里通常还会关注这些：

- 复杂配置管理能力，例如 Yaml 模板和环境隔离
- 微服务框架理解，如 Go-Zero、Go-Kratos 的扩展机制
- 可测试性、可观测性、错误处理规范

---

## 二、分布式架构与支付高可用

### 对应资料导航

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [架构师学习路线](/architecture/architect-learning-roadmap)
- [Go 微服务可观测性与稳定性专题](/golang/guide/08-observability-resilience)

支付系统的核心不是“吞吐高”，而是“钱不能错，系统不能死”。

### 1. 核心高可用能力

| 维度 | 关键技术点 | 解决的问题 |
| --- | --- | --- |
| 流量控制 | 令牌桶、漏桶限流，熔断降级 | 防止核心交易链路被突发流量击穿 |
| 一致性保障 | TCC、SAGA、事务消息、本地消息表 | 保证订单、账务、渠道状态最终一致 |
| 容灾能力 | 异地多活、单元化部署 | 应对机房故障、区域故障 |
| 可观测性 | Metrics、Logging、Tracing | 快速发现和定位异常 |

### 2. 支付特有逻辑

#### 幂等性

必须重点准备。典型表达方式：

- 使用 `OrderNo` / `BusinessID` 做全局唯一标识
- 在 Redis 或数据库唯一索引层做重复拦截
- 所有重试必须保证结果只执行一次

#### 状态机设计

支付单常见状态流转：

```text
初始化 -> 支付中 -> 成功 / 失败 / 掉单
```

要能回答这些追问：

<details>
<summary><strong>追问一：如何处理渠道异步通知与主动轮询并存？</strong></summary>

> 核心思路是”通知优先，轮询兜底，幂等收口”。渠道通知是推模式，延迟低但可能丢；主动轮询是拉模式，可靠但有延迟。两者并存时，必须通过幂等状态机保证无论哪条路径先到达，最终状态一致。

<div class="mermaid-svg-wrapper">

<svg id="m17758337932090" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 883.90625px;" viewBox="0 0 883.90625 532" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337932090{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337932090 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337932090 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337932090 .error-icon{fill:#552222;}#m17758337932090 .error-text{fill:#552222;stroke:#552222;}#m17758337932090 .edge-thickness-normal{stroke-width:1px;}#m17758337932090 .edge-thickness-thick{stroke-width:3.5px;}#m17758337932090 .edge-pattern-solid{stroke-dasharray:0;}#m17758337932090 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337932090 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337932090 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337932090 .marker{fill:#666;stroke:#666;}#m17758337932090 .marker.cross{stroke:#666;}#m17758337932090 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337932090 p{margin:0;}#m17758337932090 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337932090 .cluster-label text{fill:#333;}#m17758337932090 .cluster-label span{color:#333;}#m17758337932090 .cluster-label span p{background-color:transparent;}#m17758337932090 .label text,#m17758337932090 span{fill:#000000;color:#000000;}#m17758337932090 .node rect,#m17758337932090 .node circle,#m17758337932090 .node ellipse,#m17758337932090 .node polygon,#m17758337932090 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337932090 .rough-node .label text,#m17758337932090 .node .label text,#m17758337932090 .image-shape .label,#m17758337932090 .icon-shape .label{text-anchor:middle;}#m17758337932090 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337932090 .rough-node .label,#m17758337932090 .node .label,#m17758337932090 .image-shape .label,#m17758337932090 .icon-shape .label{text-align:center;}#m17758337932090 .node.clickable{cursor:pointer;}#m17758337932090 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337932090 .arrowheadPath{fill:#333333;}#m17758337932090 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337932090 .flowchart-link{stroke:#666;fill:none;}#m17758337932090 .edgeLabel{background-color:white;text-align:center;}#m17758337932090 .edgeLabel p{background-color:white;}#m17758337932090 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337932090 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337932090 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337932090 .cluster text{fill:#333;}#m17758337932090 .cluster span{color:#333;}#m17758337932090 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337932090 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337932090 rect.text{fill:none;stroke-width:0;}#m17758337932090 .icon-shape,#m17758337932090 .image-shape{background-color:white;text-align:center;}#m17758337932090 .icon-shape p,#m17758337932090 .image-shape p{background-color:white;padding:2px;}#m17758337932090 .icon-shape .label rect,#m17758337932090 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337932090 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337932090 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337932090 .node .neo-node{stroke:#999;}#m17758337932090 [data-look="neo"].node rect,#m17758337932090 [data-look="neo"].cluster rect,#m17758337932090 [data-look="neo"].node polygon{stroke:url(#m17758337932090-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932090 [data-look="neo"].node path{stroke:url(#m17758337932090-gradient);stroke-width:1px;}#m17758337932090 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932090 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337932090 [data-look="neo"].node circle{stroke:url(#m17758337932090-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932090 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337932090 [data-look="neo"].icon-shape .icon{fill:url(#m17758337932090-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932090 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337932090-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932090 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337932090_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337932090_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337932090_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337932090_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337932090_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337932090_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337932090_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337932090_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337932090_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337932090_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337932090_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337932090_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M132,266L136.167,266C140.333,266,148.667,266,156.333,266C164,266,171,266,174.5,266L178,266" id="m17758337932090-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTMyLCJ5IjoyNjZ9LHsieCI6MTU3LCJ5IjoyNjZ9LHsieCI6MTgyLCJ5IjoyNjZ9XQ==" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path><path d="M306,239.632L310.167,237.86C314.333,236.088,322.667,232.544,330.333,230.772C338,229,345,229,348.5,229L352,229" id="m17758337932090-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MzA2LCJ5IjoyMzkuNjMyMTgzOTA4MDQ2fSx7IngiOjMzMSwieSI6MjI5fSx7IngiOjM1NiwieSI6MjI5fV0=" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path><path d="M488.391,229L500.517,229C512.643,229,536.896,229,560.494,231.191C584.091,233.381,607.034,237.762,618.506,239.953L629.977,242.144" id="m17758337932090-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6NDg4LjM5MDYyNSwieSI6MjI5fSx7IngiOjU2MS4xNDg0Mzc1LCJ5IjoyMjl9LHsieCI6NjMzLjkwNjI1LCJ5IjoyNDIuODkzODM0OTI2MDExMDR9XQ==" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path><path d="M306,292.368L310.167,294.14C314.333,295.912,322.667,299.456,342.033,301.228C361.398,303,391.797,303,430.155,303C468.513,303,514.831,303,549.461,300.809C584.091,298.619,607.034,294.238,618.506,292.047L629.977,289.856" id="m17758337932090-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MzA2LCJ5IjoyOTIuMzY3ODE2MDkxOTU0fSx7IngiOjMzMSwieSI6MzAzfSx7IngiOjQyMi4xOTUzMTI1LCJ5IjozMDN9LHsieCI6NTYxLjE0ODQzNzUsInkiOjMwM30seyJ4Ijo2MzMuOTA2MjUsInkiOjI4OS4xMDYxNjUwNzM5ODg5Nn1d" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(561.1484375, 229)"><g class="label" data-id="L_C_D_0" transform="translate(-47.7578125, -12)"><foreignObject width="95.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>异步通知 - 推</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(422.1953125, 303)"><g class="label" data-id="L_B_D_0" transform="translate(-47.7578125, -12)"><foreignObject width="95.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>主动轮询 - 拉</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="root" transform="translate(625.90625, 0)"><g class="clusters"><g class="cluster" id="m17758337932090-D" data-look="classic"><rect style="" x="8" y="8" width="242" height="516"></rect><g class="cluster-label" transform="translate(49.2421875, 8)"><foreignObject width="159.515625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5;"><span class="nodeLabel"><p>幂等状态机 - 统一收口</p></span></div></foreignObject></g></g></g><g class="edgePaths"><path d="M129,99.5L129,105.75C129,112,129,124.5,129,136.333C129,148.167,129,159.333,129,164.917L129,170.5" id="m17758337932090-L_D1_D2_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D1_D2_0" data-points="W3sieCI6MTI5LCJ5Ijo5OS41fSx7IngiOjEyOSwieSI6MTM3fSx7IngiOjEyOSwieSI6MTc0LjV9XQ==" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path><path d="M129,228.5L129,234.75C129,241,129,253.5,129,265.333C129,277.167,129,288.333,129,293.917L129,299.5" id="m17758337932090-L_D2_D3_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D2_D3_0" data-points="W3sieCI6MTI5LCJ5IjoyMjguNX0seyJ4IjoxMjksInkiOjI2Nn0seyJ4IjoxMjksInkiOjMwMy41fV0=" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path><path d="M129,357.5L129,363.75C129,370,129,382.5,129,394.333C129,406.167,129,417.333,129,422.917L129,428.5" id="m17758337932090-L_D3_D4_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D3_D4_0" data-points="W3sieCI6MTI5LCJ5IjozNTcuNX0seyJ4IjoxMjksInkiOjM5NX0seyJ4IjoxMjksInkiOjQzMi41fV0=" data-look="classic" marker-end="url(#m17758337932090_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_D1_D2_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D2_D3_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D3_D4_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337932090-flowchart-D1-7" data-look="classic" transform="translate(129, 72.5)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>查当前状态</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932090-flowchart-D2-8" data-look="classic" transform="translate(129, 201.5)"><rect class="basic label-container" style="" x="-86" y="-27" width="172" height="54"></rect><g class="label" style="" transform="translate(-56, -12)"><rect></rect><foreignObject width="112" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>校验流转合法性</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932090-flowchart-D3-10" data-look="classic" transform="translate(129, 330.5)"><rect class="basic label-container" style="" x="-85.765625" y="-27" width="171.53125" height="54"></rect><g class="label" style="" transform="translate(-55.765625, -12)"><rect></rect><foreignObject width="111.53125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CAS 乐观锁更新</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932090-flowchart-D4-12" data-look="classic" transform="translate(129, 459.5)"><rect class="basic label-container" style="" x="-86" y="-27" width="172" height="54"></rect><g class="label" style="" transform="translate(-56, -12)"><rect></rect><foreignObject width="112" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>重复到达则忽略</p></span></div></foreignObject></g></g></g></g><g class="node default" id="m17758337932090-flowchart-A-0" data-look="classic" transform="translate(70, 266)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>支付请求</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932090-flowchart-B-1" data-look="classic" transform="translate(244, 266)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>支付渠道</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932090-flowchart-C-2" data-look="classic" transform="translate(422.1953125, 229)"><rect class="basic label-container" style="" x="-66.1953125" y="-27" width="132.390625" height="54"></rect><g class="label" style="" transform="translate(-36.1953125, -12)"><rect></rect><foreignObject width="72.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>银行/三方</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337932090-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337932090-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337932090-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

**具体实现策略：**

- **通知优先**：渠道回调到达后立即处理，更新订单状态
- **轮询兜底**：对超过 T 秒（如 30s）仍处于”支付中”的订单，启动定时轮询任务主动查询渠道
- **幂等收口**：无论通知还是轮询，最终都走同一个状态更新方法，使用乐观锁（版本号）防止重复更新

```go
func (s *PaymentService) HandlePaymentResult(ctx context.Context, orderID string, channelResult *ChannelResult) error {
    // 1. 查询当前订单状态
    order, err := s.orderRepo.GetByOrderID(ctx, orderID)
    if err != nil {
        return err
    }

    // 2. 幂等检查：已终态直接返回
    if order.Status == StatusSuccess || order.Status == StatusFailed {
        return nil // 幂等，直接忽略
    }

    // 3. 状态流转合法性校验
    if !order.CanTransitTo(channelResult.Status) {
        return ErrInvalidStateTransition
    }

    // 4. CAS 更新，防止并发覆盖
    affected, err := s.orderRepo.UpdateStatusWithVersion(ctx, orderID, channelResult.Status, order.Version)
    if err != nil {
        return err
    }
    if affected == 0 {
        return ErrConcurrentUpdate // 被其他线程抢先更新，可重试
    }

    return nil
}
```

</details>

<details>
<summary><strong>追问二：如何避免并发通知导致状态乱序？</strong></summary>

> 核心方案是”版本号 + 状态机 + 数据库行锁”三道防线，确保即使多条通知并发到达，状态也只能沿着合法方向前进，不会回退或跳跃。

**图 1：支付单状态流转**

<div class="mermaid-svg-wrapper">

<svg id="m17758337932661" width="100%" xmlns="http://www.w3.org/2000/svg" class="statediagram" style="max-width: 420px;" viewBox="0 0 420 146" role="graphics-document document" aria-roledescription="stateDiagram"><style>#m17758337932661{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337932661 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337932661 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337932661 .error-icon{fill:#552222;}#m17758337932661 .error-text{fill:#552222;stroke:#552222;}#m17758337932661 .edge-thickness-normal{stroke-width:1px;}#m17758337932661 .edge-thickness-thick{stroke-width:3.5px;}#m17758337932661 .edge-pattern-solid{stroke-dasharray:0;}#m17758337932661 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337932661 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337932661 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337932661 .marker{fill:#666;stroke:#666;}#m17758337932661 .marker.cross{stroke:#666;}#m17758337932661 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337932661 p{margin:0;}#m17758337932661 defs [id$="-barbEnd"]{fill:#000;stroke:#000;}#m17758337932661 g.stateGroup text{fill:#999;stroke:none;font-size:10px;}#m17758337932661 g.stateGroup text{fill:#000000;stroke:none;font-size:10px;}#m17758337932661 g.stateGroup .state-title{font-weight:bolder;fill:#111111;}#m17758337932661 g.stateGroup rect{fill:#eee;stroke:#999;}#m17758337932661 g.stateGroup line{stroke:#666;stroke-width:1;}#m17758337932661 .transition{stroke:#000;stroke-width:1;fill:none;}#m17758337932661 .stateGroup .composit{fill:#ffffff;border-bottom:1px;}#m17758337932661 .stateGroup .alt-composit{fill:#e0e0e0;border-bottom:1px;}#m17758337932661 .state-note{stroke:#999;fill:#666;}#m17758337932661 .state-note text{fill:#fff;stroke:none;font-size:10px;}#m17758337932661 .stateLabel .box{stroke:none;stroke-width:0;fill:#eee;opacity:0.5;}#m17758337932661 .edgeLabel .label rect{fill:#eee;opacity:0.5;}#m17758337932661 .edgeLabel{background-color:white;text-align:center;}#m17758337932661 .edgeLabel p{background-color:white;}#m17758337932661 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337932661 .edgeLabel .label text{fill:#000000;}#m17758337932661 .label div .edgeLabel{color:#000000;}#m17758337932661 .stateLabel text{fill:#111111;font-size:10px;font-weight:bold;}#m17758337932661 .node circle.state-start{fill:#222;stroke:#222;}#m17758337932661 .node .fork-join{fill:#222;stroke:#222;}#m17758337932661 .node circle.state-end{fill:hsl(0, 0%, 83.3333333333%);stroke:#ffffff;stroke-width:1.5;}#m17758337932661 .end-state-inner{fill:#ffffff;stroke-width:1.5;}#m17758337932661 .node rect{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337932661 .node polygon{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337932661 [id$="-barbEnd"]{fill:#666;}#m17758337932661 .statediagram-cluster rect{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337932661 .cluster-label,#m17758337932661 .nodeLabel{color:#111111;}#m17758337932661 .statediagram-cluster rect.outer{rx:5px;ry:5px;}#m17758337932661 .statediagram-state .divider{stroke:#000;}#m17758337932661 .statediagram-state .title-state{rx:5px;ry:5px;}#m17758337932661 .statediagram-cluster.statediagram-cluster .inner{fill:#ffffff;}#m17758337932661 .statediagram-cluster.statediagram-cluster-alt .inner{fill:#f4f4f4;}#m17758337932661 .statediagram-cluster .inner{rx:0;ry:0;}#m17758337932661 .statediagram-state rect.basic{rx:5px;ry:5px;}#m17758337932661 .statediagram-state rect.divider{stroke-dasharray:10,10;fill:#f4f4f4;}#m17758337932661 .note-edge{stroke-dasharray:5;}#m17758337932661 .statediagram-note rect{fill:#666;stroke:#999;stroke-width:1px;rx:0;ry:0;}#m17758337932661 .statediagram-note rect{fill:#666;stroke:#999;stroke-width:1px;rx:0;ry:0;}#m17758337932661 .statediagram-note text{fill:#fff;}#m17758337932661 .statediagram-note .nodeLabel{color:#fff;}#m17758337932661 .statediagram .edgeLabel{color:red;}#m17758337932661 [id$="-dependencyStart"],#m17758337932661 [id$="-dependencyEnd"]{fill:#666;stroke:#666;stroke-width:1;}#m17758337932661 .statediagramTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337932661 [data-look="neo"].statediagram-cluster rect{fill:#eee;stroke:url(#m17758337932661-gradient);stroke-width:1;}#m17758337932661 [data-look="neo"].statediagram-cluster rect.outer{rx:5px;ry:5px;filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 .node .neo-node{stroke:#999;}#m17758337932661 [data-look="neo"].node rect,#m17758337932661 [data-look="neo"].cluster rect,#m17758337932661 [data-look="neo"].node polygon{stroke:url(#m17758337932661-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 [data-look="neo"].node path{stroke:url(#m17758337932661-gradient);stroke-width:1px;}#m17758337932661 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337932661 [data-look="neo"].node circle{stroke:url(#m17758337932661-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337932661 [data-look="neo"].icon-shape .icon{fill:url(#m17758337932661-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337932661-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337932661 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><defs><marker id="m17758337932661_stateDiagram-barbEnd" refX="19" refY="7" markerWidth="20" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M 19,7 L9,13 L14,7 L9,1 Z"></path></marker></defs><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M22,73L26.167,73C30.333,73,38.667,73,47,73C55.333,73,63.667,73,67.833,73L72,73" id="m17758337932661-edge0" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge0" data-points="W3sieCI6MjIsInkiOjczfSx7IngiOjQ3LCJ5Ijo3M30seyJ4Ijo3MiwieSI6NzN9XQ==" data-look="classic" marker-end="url(#m17758337932661_stateDiagram-barbEnd)"></path><path d="M136,73L140.167,73C144.333,73,152.667,73,161,73C169.333,73,177.667,73,181.833,73L186,73" id="m17758337932661-edge1" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge1" data-points="W3sieCI6MTM2LCJ5Ijo3M30seyJ4IjoxNjEsInkiOjczfSx7IngiOjE4NiwieSI6NzN9XQ==" data-look="classic" marker-end="url(#m17758337932661_stateDiagram-barbEnd)"></path><path d="M243.333,53L248.611,48.833C253.889,44.667,264.444,36.333,273.889,32.167C283.333,28,291.667,28,295.833,28L300,28" id="m17758337932661-edge2" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge2" data-points="W3sieCI6MjQzLjMzMzMzMzMzMzMzMzM0LCJ5Ijo1M30seyJ4IjoyNzUsInkiOjI4fSx7IngiOjMwMCwieSI6Mjh9XQ==" data-look="classic" marker-end="url(#m17758337932661_stateDiagram-barbEnd)"></path><path d="M243.333,93L248.611,97.167C253.889,101.333,264.444,109.667,273.889,113.833C283.333,118,291.667,118,295.833,118L300,118" id="m17758337932661-edge3" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge3" data-points="W3sieCI6MjQzLjMzMzMzMzMzMzMzMzM0LCJ5Ijo5M30seyJ4IjoyNzUsInkiOjExOH0seyJ4IjozMDAsInkiOjExOH1d" data-look="classic" marker-end="url(#m17758337932661_stateDiagram-barbEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="edge0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge1" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge2" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge3" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node statediagram-state" id="m17758337932661-state-Success-2" data-look="classic" transform="translate(356, 28)"><rect class="basic label-container" style="" rx="5" ry="5" x="-56" y="-20" width="112" height="40"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>成功（终态）</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337932661-state-Failure-3" data-look="classic" transform="translate(356, 118)"><rect class="basic label-container" style="" rx="5" ry="5" x="-56" y="-20" width="112" height="40"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>失败（终态）</p></span></div></foreignObject></g></g><g class="node default" id="m17758337932661-state-root_start-0" data-look="classic" transform="translate(15, 73)"><circle class="state-start" r="7" width="14" height="14"></circle></g><g class="node statediagram-state" id="m17758337932661-state-初始化-1" data-look="classic" transform="translate(104, 73)"><rect class="basic label-container" style="" rx="5" ry="5" x="-32" y="-20" width="64" height="40"></rect><g class="label" style="" transform="translate(-24, -12)"><rect></rect><foreignObject width="48" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>初始化</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337932661-state-支付中-3" data-look="classic" transform="translate(218, 73)"><rect class="basic label-container" style="" rx="5" ry="5" x="-32" y="-20" width="64" height="40"></rect><g class="label" style="" transform="translate(-24, -12)"><rect></rect><foreignObject width="48" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>支付中</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337932661-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337932661-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337932661-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

上图只描述“状态允许如何流转”，不描述通知处理顺序。

**图 2：并发通知下的幂等处理流程**

<div class="mermaid-svg-wrapper">

<svg id="m17758337933352" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 850px;" viewBox="-50 -10 850 585" role="graphics-document document" aria-roledescription="sequence"><g><rect x="600" y="499" fill="#eaeaea" stroke="#666" width="150" height="65" name="DB" rx="3" ry="3" class="actor actor-bottom"></rect><text x="675" y="531.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="675" dy="0">数据库</tspan></text></g><g><rect x="400" y="499" fill="#eaeaea" stroke="#666" width="150" height="65" name="N3" rx="3" ry="3" class="actor actor-bottom"></rect><text x="475" y="531.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="475" dy="0">通知3</tspan></text></g><g><rect x="200" y="499" fill="#eaeaea" stroke="#666" width="150" height="65" name="N2" rx="3" ry="3" class="actor actor-bottom"></rect><text x="275" y="531.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="275" dy="0">通知2</tspan></text></g><g><rect x="0" y="499" fill="#eaeaea" stroke="#666" width="150" height="65" name="N1" rx="3" ry="3" class="actor actor-bottom"></rect><text x="75" y="531.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="75" dy="0">通知1</tspan></text></g><g><line id="actor3" x1="675" y1="65" x2="675" y2="499" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="DB" data-et="life-line" data-id="DB"></line><g id="root-3" data-et="participant" data-type="participant" data-id="DB"><rect x="600" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="DB" rx="3" ry="3" class="actor actor-top"></rect><text x="675" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="675" dy="0">数据库</tspan></text></g></g><g><line id="actor2" x1="475" y1="65" x2="475" y2="499" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="N3" data-et="life-line" data-id="N3"></line><g id="root-2" data-et="participant" data-type="participant" data-id="N3"><rect x="400" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="N3" rx="3" ry="3" class="actor actor-top"></rect><text x="475" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="475" dy="0">通知3</tspan></text></g></g><g><line id="actor1" x1="275" y1="65" x2="275" y2="499" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="N2" data-et="life-line" data-id="N2"></line><g id="root-1" data-et="participant" data-type="participant" data-id="N2"><rect x="200" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="N2" rx="3" ry="3" class="actor actor-top"></rect><text x="275" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="275" dy="0">通知2</tspan></text></g></g><g><line id="actor0" x1="75" y1="65" x2="75" y2="499" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="N1" data-et="life-line" data-id="N1"></line><g id="root-0" data-et="participant" data-type="participant" data-id="N1"><rect x="0" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="N1" rx="3" ry="3" class="actor actor-top"></rect><text x="75" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="75" dy="0">通知1</tspan></text></g></g><style>#m17758337933352{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337933352 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337933352 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337933352 .error-icon{fill:#552222;}#m17758337933352 .error-text{fill:#552222;stroke:#552222;}#m17758337933352 .edge-thickness-normal{stroke-width:1px;}#m17758337933352 .edge-thickness-thick{stroke-width:3.5px;}#m17758337933352 .edge-pattern-solid{stroke-dasharray:0;}#m17758337933352 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337933352 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337933352 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337933352 .marker{fill:#666;stroke:#666;}#m17758337933352 .marker.cross{stroke:#666;}#m17758337933352 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337933352 p{margin:0;}#m17758337933352 .actor{stroke:hsl(0, 0%, 83%);fill:#eee;stroke-width:1;}#m17758337933352 rect.actor.outer-path[data-look="neo"]{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 rect.note[data-look="neo"]{stroke:#999;fill:#666;filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 text.actor&gt;tspan{fill:#333;stroke:none;}#m17758337933352 .actor-line{stroke:hsl(0, 0%, 83%);}#m17758337933352 .innerArc{stroke-width:1.5;stroke-dasharray:none;}#m17758337933352 .messageLine0{stroke-width:1.5;stroke-dasharray:none;stroke:#333;}#m17758337933352 .messageLine1{stroke-width:1.5;stroke-dasharray:2,2;stroke:#333;}#m17758337933352 [id$="-arrowhead"] path{fill:#333;stroke:#333;}#m17758337933352 .sequenceNumber{fill:white;}#m17758337933352 [id$="-sequencenumber"]{fill:#333;}#m17758337933352 [id$="-crosshead"] path{fill:#333;stroke:#333;}#m17758337933352 .messageText{fill:#333;stroke:none;}#m17758337933352 .labelBox{stroke:hsl(0, 0%, 83%);fill:#eee;filter:none;}#m17758337933352 .labelText,#m17758337933352 .labelText&gt;tspan{fill:#333;stroke:none;}#m17758337933352 .loopText,#m17758337933352 .loopText&gt;tspan{fill:#333;stroke:none;}#m17758337933352 .loopLine{stroke-width:2px;stroke-dasharray:2,2;stroke:hsl(0, 0%, 83%);fill:hsl(0, 0%, 83%);}#m17758337933352 .note{stroke:#999;fill:#666;}#m17758337933352 .noteText,#m17758337933352 .noteText&gt;tspan{fill:#fff;stroke:none;font-weight:normal;}#m17758337933352 .activation0{fill:#f4f4f4;stroke:#666;}#m17758337933352 .activation1{fill:#f4f4f4;stroke:#666;}#m17758337933352 .activation2{fill:#f4f4f4;stroke:#666;}#m17758337933352 .actorPopupMenu{position:absolute;}#m17758337933352 .actorPopupMenuPanel{position:absolute;fill:#eee;box-shadow:0px 8px 16px 0px rgba(0,0,0,0.2);filter:drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));}#m17758337933352 .actor-man circle,#m17758337933352 line{fill:#eee;stroke-width:2px;}#m17758337933352 g rect.rect{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));stroke:#999;}#m17758337933352 .node .neo-node{stroke:#999;}#m17758337933352 [data-look="neo"].node rect,#m17758337933352 [data-look="neo"].cluster rect,#m17758337933352 [data-look="neo"].node polygon{stroke:url(#m17758337933352-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 [data-look="neo"].node path{stroke:url(#m17758337933352-gradient);stroke-width:1px;}#m17758337933352 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337933352 [data-look="neo"].node circle{stroke:url(#m17758337933352-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337933352 [data-look="neo"].icon-shape .icon{fill:url(#m17758337933352-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337933352-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933352 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g></g><defs><symbol id="m17758337933352-computer" width="24" height="24"><path transform="scale(.5)" d="M2 2v13h20v-13h-20zm18 11h-16v-9h16v9zm-10.228 6l.466-1h3.524l.467 1h-4.457zm14.228 3h-24l2-6h2.104l-1.33 4h18.45l-1.297-4h2.073l2 6zm-5-10h-14v-7h14v7z"></path></symbol></defs><defs><symbol id="m17758337933352-database" fill-rule="evenodd" clip-rule="evenodd"><path transform="scale(.5)" d="M12.258.001l.256.004.255.005.253.008.251.01.249.012.247.015.246.016.242.019.241.02.239.023.236.024.233.027.231.028.229.031.225.032.223.034.22.036.217.038.214.04.211.041.208.043.205.045.201.046.198.048.194.05.191.051.187.053.183.054.18.056.175.057.172.059.168.06.163.061.16.063.155.064.15.066.074.033.073.033.071.034.07.034.069.035.068.035.067.035.066.035.064.036.064.036.062.036.06.036.06.037.058.037.058.037.055.038.055.038.053.038.052.038.051.039.05.039.048.039.047.039.045.04.044.04.043.04.041.04.04.041.039.041.037.041.036.041.034.041.033.042.032.042.03.042.029.042.027.042.026.043.024.043.023.043.021.043.02.043.018.044.017.043.015.044.013.044.012.044.011.045.009.044.007.045.006.045.004.045.002.045.001.045v17l-.001.045-.002.045-.004.045-.006.045-.007.045-.009.044-.011.045-.012.044-.013.044-.015.044-.017.043-.018.044-.02.043-.021.043-.023.043-.024.043-.026.043-.027.042-.029.042-.03.042-.032.042-.033.042-.034.041-.036.041-.037.041-.039.041-.04.041-.041.04-.043.04-.044.04-.045.04-.047.039-.048.039-.05.039-.051.039-.052.038-.053.038-.055.038-.055.038-.058.037-.058.037-.06.037-.06.036-.062.036-.064.036-.064.036-.066.035-.067.035-.068.035-.069.035-.07.034-.071.034-.073.033-.074.033-.15.066-.155.064-.16.063-.163.061-.168.06-.172.059-.175.057-.18.056-.183.054-.187.053-.191.051-.194.05-.198.048-.201.046-.205.045-.208.043-.211.041-.214.04-.217.038-.22.036-.223.034-.225.032-.229.031-.231.028-.233.027-.236.024-.239.023-.241.02-.242.019-.246.016-.247.015-.249.012-.251.01-.253.008-.255.005-.256.004-.258.001-.258-.001-.256-.004-.255-.005-.253-.008-.251-.01-.249-.012-.247-.015-.245-.016-.243-.019-.241-.02-.238-.023-.236-.024-.234-.027-.231-.028-.228-.031-.226-.032-.223-.034-.22-.036-.217-.038-.214-.04-.211-.041-.208-.043-.204-.045-.201-.046-.198-.048-.195-.05-.19-.051-.187-.053-.184-.054-.179-.056-.176-.057-.172-.059-.167-.06-.164-.061-.159-.063-.155-.064-.151-.066-.074-.033-.072-.033-.072-.034-.07-.034-.069-.035-.068-.035-.067-.035-.066-.035-.064-.036-.063-.036-.062-.036-.061-.036-.06-.037-.058-.037-.057-.037-.056-.038-.055-.038-.053-.038-.052-.038-.051-.039-.049-.039-.049-.039-.046-.039-.046-.04-.044-.04-.043-.04-.041-.04-.04-.041-.039-.041-.037-.041-.036-.041-.034-.041-.033-.042-.032-.042-.03-.042-.029-.042-.027-.042-.026-.043-.024-.043-.023-.043-.021-.043-.02-.043-.018-.044-.017-.043-.015-.044-.013-.044-.012-.044-.011-.045-.009-.044-.007-.045-.006-.045-.004-.045-.002-.045-.001-.045v-17l.001-.045.002-.045.004-.045.006-.045.007-.045.009-.044.011-.045.012-.044.013-.044.015-.044.017-.043.018-.044.02-.043.021-.043.023-.043.024-.043.026-.043.027-.042.029-.042.03-.042.032-.042.033-.042.034-.041.036-.041.037-.041.039-.041.04-.041.041-.04.043-.04.044-.04.046-.04.046-.039.049-.039.049-.039.051-.039.052-.038.053-.038.055-.038.056-.038.057-.037.058-.037.06-.037.061-.036.062-.036.063-.036.064-.036.066-.035.067-.035.068-.035.069-.035.07-.034.072-.034.072-.033.074-.033.151-.066.155-.064.159-.063.164-.061.167-.06.172-.059.176-.057.179-.056.184-.054.187-.053.19-.051.195-.05.198-.048.201-.046.204-.045.208-.043.211-.041.214-.04.217-.038.22-.036.223-.034.226-.032.228-.031.231-.028.234-.027.236-.024.238-.023.241-.02.243-.019.245-.016.247-.015.249-.012.251-.01.253-.008.255-.005.256-.004.258-.001.258.001zm-9.258 20.499v.01l.001.021.003.021.004.022.005.021.006.022.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.023.018.024.019.024.021.024.022.025.023.024.024.025.052.049.056.05.061.051.066.051.07.051.075.051.079.052.084.052.088.052.092.052.097.052.102.051.105.052.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.048.144.049.147.047.152.047.155.047.16.045.163.045.167.043.171.043.176.041.178.041.183.039.187.039.19.037.194.035.197.035.202.033.204.031.209.03.212.029.216.027.219.025.222.024.226.021.23.02.233.018.236.016.24.015.243.012.246.01.249.008.253.005.256.004.259.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.021.224-.024.22-.026.216-.027.212-.028.21-.031.205-.031.202-.034.198-.034.194-.036.191-.037.187-.039.183-.04.179-.04.175-.042.172-.043.168-.044.163-.045.16-.046.155-.046.152-.047.148-.048.143-.049.139-.049.136-.05.131-.05.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.053.083-.051.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.05.023-.024.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.023.01-.022.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.127l-.077.055-.08.053-.083.054-.085.053-.087.052-.09.052-.093.051-.095.05-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.045-.118.044-.12.043-.122.042-.124.042-.126.041-.128.04-.13.04-.132.038-.134.038-.135.037-.138.037-.139.035-.142.035-.143.034-.144.033-.147.032-.148.031-.15.03-.151.03-.153.029-.154.027-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.01-.179.008-.179.008-.181.006-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.006-.179-.008-.179-.008-.178-.01-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.027-.153-.029-.151-.03-.15-.03-.148-.031-.146-.032-.145-.033-.143-.034-.141-.035-.14-.035-.137-.037-.136-.037-.134-.038-.132-.038-.13-.04-.128-.04-.126-.041-.124-.042-.122-.042-.12-.044-.117-.043-.116-.045-.113-.045-.112-.046-.109-.047-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.05-.093-.052-.09-.051-.087-.052-.085-.053-.083-.054-.08-.054-.077-.054v4.127zm0-5.654v.011l.001.021.003.021.004.021.005.022.006.022.007.022.009.022.01.022.011.023.012.023.013.023.015.024.016.023.017.024.018.024.019.024.021.024.022.024.023.025.024.024.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.052.11.051.114.051.119.052.123.05.127.051.131.05.135.049.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.044.171.042.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.022.23.02.233.018.236.016.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.012.241-.015.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.048.139-.05.136-.049.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.051.051-.049.023-.025.023-.024.021-.025.02-.024.019-.024.018-.024.017-.024.015-.023.014-.023.013-.024.012-.022.01-.023.01-.023.008-.022.006-.022.006-.022.004-.021.004-.022.001-.021.001-.021v-4.139l-.077.054-.08.054-.083.054-.085.052-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.044-.118.044-.12.044-.122.042-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.035-.143.033-.144.033-.147.033-.148.031-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.009-.179.009-.179.007-.181.007-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.007-.179-.007-.179-.009-.178-.009-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.031-.146-.033-.145-.033-.143-.033-.141-.035-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.04-.126-.041-.124-.042-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.051-.093-.051-.09-.051-.087-.053-.085-.052-.083-.054-.08-.054-.077-.054v4.139zm0-5.666v.011l.001.02.003.022.004.021.005.022.006.021.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.024.018.023.019.024.021.025.022.024.023.024.024.025.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.051.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.043.171.043.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.021.23.02.233.018.236.017.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.013.241-.014.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.049.139-.049.136-.049.131-.051.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.049.023-.025.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.022.01-.023.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.153l-.077.054-.08.054-.083.053-.085.053-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.048-.105.048-.106.048-.109.046-.111.046-.114.046-.115.044-.118.044-.12.043-.122.043-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.034-.143.034-.144.033-.147.032-.148.032-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.024-.161.024-.162.023-.163.023-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.01-.178.01-.179.009-.179.007-.181.006-.182.006-.182.004-.184.003-.184.001-.185.001-.185-.001-.184-.001-.184-.003-.182-.004-.182-.006-.181-.006-.179-.007-.179-.009-.178-.01-.176-.01-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.023-.162-.023-.161-.024-.159-.024-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.032-.146-.032-.145-.033-.143-.034-.141-.034-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.041-.126-.041-.124-.041-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.048-.105-.048-.102-.048-.1-.05-.097-.049-.095-.051-.093-.051-.09-.052-.087-.052-.085-.053-.083-.053-.08-.054-.077-.054v4.153zm8.74-8.179l-.257.004-.254.005-.25.008-.247.011-.244.012-.241.014-.237.016-.233.018-.231.021-.226.022-.224.023-.22.026-.216.027-.212.028-.21.031-.205.032-.202.033-.198.034-.194.036-.191.038-.187.038-.183.04-.179.041-.175.042-.172.043-.168.043-.163.045-.16.046-.155.046-.152.048-.148.048-.143.048-.139.049-.136.05-.131.05-.126.051-.123.051-.118.051-.114.052-.11.052-.106.052-.101.052-.096.052-.092.052-.088.052-.083.052-.079.052-.074.051-.07.052-.065.051-.06.05-.056.05-.051.05-.023.025-.023.024-.021.024-.02.025-.019.024-.018.024-.017.023-.015.024-.014.023-.013.023-.012.023-.01.023-.01.022-.008.022-.006.023-.006.021-.004.022-.004.021-.001.021-.001.021.001.021.001.021.004.021.004.022.006.021.006.023.008.022.01.022.01.023.012.023.013.023.014.023.015.024.017.023.018.024.019.024.02.025.021.024.023.024.023.025.051.05.056.05.06.05.065.051.07.052.074.051.079.052.083.052.088.052.092.052.096.052.101.052.106.052.11.052.114.052.118.051.123.051.126.051.131.05.136.05.139.049.143.048.148.048.152.048.155.046.16.046.163.045.168.043.172.043.175.042.179.041.183.04.187.038.191.038.194.036.198.034.202.033.205.032.21.031.212.028.216.027.22.026.224.023.226.022.231.021.233.018.237.016.241.014.244.012.247.011.25.008.254.005.257.004.26.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.022.224-.023.22-.026.216-.027.212-.028.21-.031.205-.032.202-.033.198-.034.194-.036.191-.038.187-.038.183-.04.179-.041.175-.042.172-.043.168-.043.163-.045.16-.046.155-.046.152-.048.148-.048.143-.048.139-.049.136-.05.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.05.051-.05.023-.025.023-.024.021-.024.02-.025.019-.024.018-.024.017-.023.015-.024.014-.023.013-.023.012-.023.01-.023.01-.022.008-.022.006-.023.006-.021.004-.022.004-.021.001-.021.001-.021-.001-.021-.001-.021-.004-.021-.004-.022-.006-.021-.006-.023-.008-.022-.01-.022-.01-.023-.012-.023-.013-.023-.014-.023-.015-.024-.017-.023-.018-.024-.019-.024-.02-.025-.021-.024-.023-.024-.023-.025-.051-.05-.056-.05-.06-.05-.065-.051-.07-.052-.074-.051-.079-.052-.083-.052-.088-.052-.092-.052-.096-.052-.101-.052-.106-.052-.11-.052-.114-.052-.118-.051-.123-.051-.126-.051-.131-.05-.136-.05-.139-.049-.143-.048-.148-.048-.152-.048-.155-.046-.16-.046-.163-.045-.168-.043-.172-.043-.175-.042-.179-.041-.183-.04-.187-.038-.191-.038-.194-.036-.198-.034-.202-.033-.205-.032-.21-.031-.212-.028-.216-.027-.22-.026-.224-.023-.226-.022-.231-.021-.233-.018-.237-.016-.241-.014-.244-.012-.247-.011-.25-.008-.254-.005-.257-.004-.26-.001-.26.001z"></path></symbol></defs><defs><symbol id="m17758337933352-clock" width="24" height="24"><path transform="scale(.5)" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.848 12.459c.202.038.202.333.001.372-1.907.361-6.045 1.111-6.547 1.111-.719 0-1.301-.582-1.301-1.301 0-.512.77-5.447 1.125-7.445.034-.192.312-.181.343.014l.985 6.238 5.394 1.011z"></path></symbol></defs><defs><marker id="m17758337933352-arrowhead" refX="7.9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M -1 0 L 10 5 L 0 10 z"></path></marker></defs><defs><marker id="m17758337933352-crosshead" markerWidth="15" markerHeight="8" orient="auto" refX="4" refY="4.5"><path fill="none" stroke="#000000" stroke-width="1pt" d="M 1,2 L 6,7 M 6,2 L 1,7" style="stroke-dasharray: 0, 0;"></path></marker></defs><defs><marker id="m17758337933352-filled-head" refX="15.5" refY="7" markerWidth="20" markerHeight="28" orient="auto"><path d="M 18,7 L9,13 L14,7 L9,1 Z"></path></marker></defs><defs><marker id="m17758337933352-sequencenumber" refX="15" refY="15" markerWidth="60" markerHeight="40" orient="auto"><circle cx="15" cy="15" r="6"></circle></marker></defs><defs><marker id="m17758337933352-solidTopArrowHead" refX="7.9" refY="7.25" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 10 8 L 0 8 z"></path></marker></defs><defs><marker id="m17758337933352-solidBottomArrowHead" refX="7.9" refY="0.75" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 10 0 L 0 8 z"></path></marker></defs><defs><marker id="m17758337933352-stickTopArrowHead" refX="7.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 7 7" stroke="black" stroke-width="1.5" fill="none"></path></marker></defs><defs><marker id="m17758337933352-stickBottomArrowHead" refX="7.5" refY="0" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 7 L 7 0" stroke="black" stroke-width="1.5" fill="none"></path></marker></defs><text x="374" y="80" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">CAS v1, 更新为支付中</text><line x1="76" y1="111" x2="671" y2="111" class="messageLine0" data-et="message" data-id="i0" data-from="N1" data-to="DB" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="fill: none;"></line><text x="377" y="126" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">OK, v2</text><line x1="674" y1="157" x2="79" y2="157" class="messageLine1" data-et="message" data-id="i1" data-from="DB" data-to="N1" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="stroke-dasharray: 3, 3; fill: none;"></line><text x="474" y="172" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">CAS v1, 更新为成功</text><line x1="276" y1="203" x2="671" y2="203" class="messageLine0" data-et="message" data-id="i2" data-from="N2" data-to="DB" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="fill: none;"></line><text x="477" y="218" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">失败, 版本已变</text><line x1="674" y1="249" x2="279" y2="249" class="messageLine1" data-et="message" data-id="i3" data-from="DB" data-to="N2" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="stroke-dasharray: 3, 3; fill: none;"></line><text x="474" y="264" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">重读 v2</text><line x1="276" y1="295" x2="671" y2="295" class="messageLine0" data-et="message" data-id="i4" data-from="N2" data-to="DB" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="fill: none;"></line><text x="474" y="310" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">CAS v2, 更新为成功</text><line x1="276" y1="341" x2="671" y2="341" class="messageLine0" data-et="message" data-id="i5" data-from="N2" data-to="DB" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="fill: none;"></line><text x="477" y="356" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">OK, v3</text><line x1="674" y1="387" x2="279" y2="387" class="messageLine1" data-et="message" data-id="i6" data-from="DB" data-to="N2" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="stroke-dasharray: 3, 3; fill: none;"></line><text x="574" y="402" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">读取 status</text><line x1="476" y1="433" x2="671" y2="433" class="messageLine0" data-et="message" data-id="i7" data-from="N3" data-to="DB" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="fill: none;"></line><text x="577" y="448" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">已终态, 幂等返回</text><line x1="674" y1="479" x2="479" y2="479" class="messageLine1" data-et="message" data-id="i8" data-from="DB" data-to="N3" stroke-width="2" stroke="none" marker-end="url(#m17758337933352-arrowhead)" style="stroke-dasharray: 3, 3; fill: none;"></line></svg>

</div>

上图只描述“多条通知并发到达时，数据库如何通过版本号和 CAS 保证幂等”。

**三道防线：**

| 防线 | 机制 | 作用 |
| --- | --- | --- |
| 第一道 | 状态机白名单 | 只允许合法方向流转，终态不可变 |
| 第二道 | 乐观锁版本号 | 数据库 `WHERE version = ?` 防止并发覆盖 |
| 第三道 | 分布式锁（可选） | 对同一 OrderID 加锁串行化处理，降低冲突概率 |

```go
// 状态流转白名单
var validTransitions = map[Status][]Status{
    StatusInit:   {StatusPaying},
    StatusPaying: {StatusSuccess, StatusFailed},
    // StatusSuccess 和 StatusFailed 是终态，无合法后续状态
}

func (o *Order) CanTransitTo(target Status) bool {
    allowed, ok := validTransitions[o.Status]
    if !ok {
        return false
    }
    for _, s := range allowed {
        if s == target {
            return true
        }
    }
    return false
}

// 数据库层 CAS 更新
// UPDATE orders SET status = ?, version = version + 1
//   WHERE order_id = ? AND version = ?
func (r *OrderRepo) UpdateStatusWithVersion(ctx context.Context, orderID string, status Status, version int64) (int64, error) {
    result := r.db.WithContext(ctx).
        Model(&Order{}).
        Where("order_id = ? AND version = ?", orderID, version).
        Updates(map[string]interface{}{
            "status":  status,
            "version": gorm.Expr("version + 1"),
        })
    return result.RowsAffected, result.Error
}
```

</details>

<details>
<summary><strong>追问三：如何处理”成功通知晚于失败结果”的反转场景？</strong></summary>

> 这是支付系统最棘手的场景之一。核心原则是”终态不可逆 + 渠道结果为准 + 对账兜底”。

<div class="mermaid-svg-wrapper">

<svg id="m17758337933923" width="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 671px;" viewBox="-50 -10 671 559" role="graphics-document document" aria-roledescription="sequence"><g><rect x="414" y="473" fill="#eaeaea" stroke="#666" width="150" height="65" name="C" rx="3" ry="3" class="actor actor-bottom"></rect><text x="489" y="505.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="489" dy="0">支付渠道</tspan></text></g><g><rect x="200" y="473" fill="#eaeaea" stroke="#666" width="150" height="65" name="S" rx="3" ry="3" class="actor actor-bottom"></rect><text x="275" y="505.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="275" dy="0">支付服务</tspan></text></g><g><rect x="0" y="473" fill="#eaeaea" stroke="#666" width="150" height="65" name="U" rx="3" ry="3" class="actor actor-bottom"></rect><text x="75" y="505.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="75" dy="0">用户</tspan></text></g><g><line id="actor6" x1="489" y1="65" x2="489" y2="473" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="C" data-et="life-line" data-id="C"></line><g id="root-6" data-et="participant" data-type="participant" data-id="C"><rect x="414" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="C" rx="3" ry="3" class="actor actor-top"></rect><text x="489" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="489" dy="0">支付渠道</tspan></text></g></g><g><line id="actor5" x1="275" y1="65" x2="275" y2="473" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="S" data-et="life-line" data-id="S"></line><g id="root-5" data-et="participant" data-type="participant" data-id="S"><rect x="200" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="S" rx="3" ry="3" class="actor actor-top"></rect><text x="275" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="275" dy="0">支付服务</tspan></text></g></g><g><line id="actor4" x1="75" y1="65" x2="75" y2="473" class="actor-line 200" stroke-width="0.5px" stroke="#999" name="U" data-et="life-line" data-id="U"></line><g id="root-4" data-et="participant" data-type="participant" data-id="U"><rect x="0" y="0" fill="#eaeaea" stroke="#666" width="150" height="65" name="U" rx="3" ry="3" class="actor actor-top"></rect><text x="75" y="32.5" dominant-baseline="central" alignment-baseline="central" class="actor actor-box" style="text-anchor: middle; font-size: 16px; font-weight: 400;"><tspan x="75" dy="0">用户</tspan></text></g></g><style>#m17758337933923{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337933923 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337933923 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337933923 .error-icon{fill:#552222;}#m17758337933923 .error-text{fill:#552222;stroke:#552222;}#m17758337933923 .edge-thickness-normal{stroke-width:1px;}#m17758337933923 .edge-thickness-thick{stroke-width:3.5px;}#m17758337933923 .edge-pattern-solid{stroke-dasharray:0;}#m17758337933923 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337933923 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337933923 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337933923 .marker{fill:#666;stroke:#666;}#m17758337933923 .marker.cross{stroke:#666;}#m17758337933923 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337933923 p{margin:0;}#m17758337933923 .actor{stroke:hsl(0, 0%, 83%);fill:#eee;stroke-width:1;}#m17758337933923 rect.actor.outer-path[data-look="neo"]{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 rect.note[data-look="neo"]{stroke:#999;fill:#666;filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 text.actor&gt;tspan{fill:#333;stroke:none;}#m17758337933923 .actor-line{stroke:hsl(0, 0%, 83%);}#m17758337933923 .innerArc{stroke-width:1.5;stroke-dasharray:none;}#m17758337933923 .messageLine0{stroke-width:1.5;stroke-dasharray:none;stroke:#333;}#m17758337933923 .messageLine1{stroke-width:1.5;stroke-dasharray:2,2;stroke:#333;}#m17758337933923 [id$="-arrowhead"] path{fill:#333;stroke:#333;}#m17758337933923 .sequenceNumber{fill:white;}#m17758337933923 [id$="-sequencenumber"]{fill:#333;}#m17758337933923 [id$="-crosshead"] path{fill:#333;stroke:#333;}#m17758337933923 .messageText{fill:#333;stroke:none;}#m17758337933923 .labelBox{stroke:hsl(0, 0%, 83%);fill:#eee;filter:none;}#m17758337933923 .labelText,#m17758337933923 .labelText&gt;tspan{fill:#333;stroke:none;}#m17758337933923 .loopText,#m17758337933923 .loopText&gt;tspan{fill:#333;stroke:none;}#m17758337933923 .loopLine{stroke-width:2px;stroke-dasharray:2,2;stroke:hsl(0, 0%, 83%);fill:hsl(0, 0%, 83%);}#m17758337933923 .note{stroke:#999;fill:#666;}#m17758337933923 .noteText,#m17758337933923 .noteText&gt;tspan{fill:#fff;stroke:none;font-weight:normal;}#m17758337933923 .activation0{fill:#f4f4f4;stroke:#666;}#m17758337933923 .activation1{fill:#f4f4f4;stroke:#666;}#m17758337933923 .activation2{fill:#f4f4f4;stroke:#666;}#m17758337933923 .actorPopupMenu{position:absolute;}#m17758337933923 .actorPopupMenuPanel{position:absolute;fill:#eee;box-shadow:0px 8px 16px 0px rgba(0,0,0,0.2);filter:drop-shadow(3px 5px 2px rgb(0 0 0 / 0.4));}#m17758337933923 .actor-man circle,#m17758337933923 line{fill:#eee;stroke-width:2px;}#m17758337933923 g rect.rect{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));stroke:#999;}#m17758337933923 .node .neo-node{stroke:#999;}#m17758337933923 [data-look="neo"].node rect,#m17758337933923 [data-look="neo"].cluster rect,#m17758337933923 [data-look="neo"].node polygon{stroke:url(#m17758337933923-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 [data-look="neo"].node path{stroke:url(#m17758337933923-gradient);stroke-width:1px;}#m17758337933923 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337933923 [data-look="neo"].node circle{stroke:url(#m17758337933923-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337933923 [data-look="neo"].icon-shape .icon{fill:url(#m17758337933923-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337933923-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337933923 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g></g><defs><symbol id="m17758337933923-computer" width="24" height="24"><path transform="scale(.5)" d="M2 2v13h20v-13h-20zm18 11h-16v-9h16v9zm-10.228 6l.466-1h3.524l.467 1h-4.457zm14.228 3h-24l2-6h2.104l-1.33 4h18.45l-1.297-4h2.073l2 6zm-5-10h-14v-7h14v7z"></path></symbol></defs><defs><symbol id="m17758337933923-database" fill-rule="evenodd" clip-rule="evenodd"><path transform="scale(.5)" d="M12.258.001l.256.004.255.005.253.008.251.01.249.012.247.015.246.016.242.019.241.02.239.023.236.024.233.027.231.028.229.031.225.032.223.034.22.036.217.038.214.04.211.041.208.043.205.045.201.046.198.048.194.05.191.051.187.053.183.054.18.056.175.057.172.059.168.06.163.061.16.063.155.064.15.066.074.033.073.033.071.034.07.034.069.035.068.035.067.035.066.035.064.036.064.036.062.036.06.036.06.037.058.037.058.037.055.038.055.038.053.038.052.038.051.039.05.039.048.039.047.039.045.04.044.04.043.04.041.04.04.041.039.041.037.041.036.041.034.041.033.042.032.042.03.042.029.042.027.042.026.043.024.043.023.043.021.043.02.043.018.044.017.043.015.044.013.044.012.044.011.045.009.044.007.045.006.045.004.045.002.045.001.045v17l-.001.045-.002.045-.004.045-.006.045-.007.045-.009.044-.011.045-.012.044-.013.044-.015.044-.017.043-.018.044-.02.043-.021.043-.023.043-.024.043-.026.043-.027.042-.029.042-.03.042-.032.042-.033.042-.034.041-.036.041-.037.041-.039.041-.04.041-.041.04-.043.04-.044.04-.045.04-.047.039-.048.039-.05.039-.051.039-.052.038-.053.038-.055.038-.055.038-.058.037-.058.037-.06.037-.06.036-.062.036-.064.036-.064.036-.066.035-.067.035-.068.035-.069.035-.07.034-.071.034-.073.033-.074.033-.15.066-.155.064-.16.063-.163.061-.168.06-.172.059-.175.057-.18.056-.183.054-.187.053-.191.051-.194.05-.198.048-.201.046-.205.045-.208.043-.211.041-.214.04-.217.038-.22.036-.223.034-.225.032-.229.031-.231.028-.233.027-.236.024-.239.023-.241.02-.242.019-.246.016-.247.015-.249.012-.251.01-.253.008-.255.005-.256.004-.258.001-.258-.001-.256-.004-.255-.005-.253-.008-.251-.01-.249-.012-.247-.015-.245-.016-.243-.019-.241-.02-.238-.023-.236-.024-.234-.027-.231-.028-.228-.031-.226-.032-.223-.034-.22-.036-.217-.038-.214-.04-.211-.041-.208-.043-.204-.045-.201-.046-.198-.048-.195-.05-.19-.051-.187-.053-.184-.054-.179-.056-.176-.057-.172-.059-.167-.06-.164-.061-.159-.063-.155-.064-.151-.066-.074-.033-.072-.033-.072-.034-.07-.034-.069-.035-.068-.035-.067-.035-.066-.035-.064-.036-.063-.036-.062-.036-.061-.036-.06-.037-.058-.037-.057-.037-.056-.038-.055-.038-.053-.038-.052-.038-.051-.039-.049-.039-.049-.039-.046-.039-.046-.04-.044-.04-.043-.04-.041-.04-.04-.041-.039-.041-.037-.041-.036-.041-.034-.041-.033-.042-.032-.042-.03-.042-.029-.042-.027-.042-.026-.043-.024-.043-.023-.043-.021-.043-.02-.043-.018-.044-.017-.043-.015-.044-.013-.044-.012-.044-.011-.045-.009-.044-.007-.045-.006-.045-.004-.045-.002-.045-.001-.045v-17l.001-.045.002-.045.004-.045.006-.045.007-.045.009-.044.011-.045.012-.044.013-.044.015-.044.017-.043.018-.044.02-.043.021-.043.023-.043.024-.043.026-.043.027-.042.029-.042.03-.042.032-.042.033-.042.034-.041.036-.041.037-.041.039-.041.04-.041.041-.04.043-.04.044-.04.046-.04.046-.039.049-.039.049-.039.051-.039.052-.038.053-.038.055-.038.056-.038.057-.037.058-.037.06-.037.061-.036.062-.036.063-.036.064-.036.066-.035.067-.035.068-.035.069-.035.07-.034.072-.034.072-.033.074-.033.151-.066.155-.064.159-.063.164-.061.167-.06.172-.059.176-.057.179-.056.184-.054.187-.053.19-.051.195-.05.198-.048.201-.046.204-.045.208-.043.211-.041.214-.04.217-.038.22-.036.223-.034.226-.032.228-.031.231-.028.234-.027.236-.024.238-.023.241-.02.243-.019.245-.016.247-.015.249-.012.251-.01.253-.008.255-.005.256-.004.258-.001.258.001zm-9.258 20.499v.01l.001.021.003.021.004.022.005.021.006.022.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.023.018.024.019.024.021.024.022.025.023.024.024.025.052.049.056.05.061.051.066.051.07.051.075.051.079.052.084.052.088.052.092.052.097.052.102.051.105.052.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.048.144.049.147.047.152.047.155.047.16.045.163.045.167.043.171.043.176.041.178.041.183.039.187.039.19.037.194.035.197.035.202.033.204.031.209.03.212.029.216.027.219.025.222.024.226.021.23.02.233.018.236.016.24.015.243.012.246.01.249.008.253.005.256.004.259.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.021.224-.024.22-.026.216-.027.212-.028.21-.031.205-.031.202-.034.198-.034.194-.036.191-.037.187-.039.183-.04.179-.04.175-.042.172-.043.168-.044.163-.045.16-.046.155-.046.152-.047.148-.048.143-.049.139-.049.136-.05.131-.05.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.053.083-.051.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.05.023-.024.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.023.01-.022.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.127l-.077.055-.08.053-.083.054-.085.053-.087.052-.09.052-.093.051-.095.05-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.045-.118.044-.12.043-.122.042-.124.042-.126.041-.128.04-.13.04-.132.038-.134.038-.135.037-.138.037-.139.035-.142.035-.143.034-.144.033-.147.032-.148.031-.15.03-.151.03-.153.029-.154.027-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.01-.179.008-.179.008-.181.006-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.006-.179-.008-.179-.008-.178-.01-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.027-.153-.029-.151-.03-.15-.03-.148-.031-.146-.032-.145-.033-.143-.034-.141-.035-.14-.035-.137-.037-.136-.037-.134-.038-.132-.038-.13-.04-.128-.04-.126-.041-.124-.042-.122-.042-.12-.044-.117-.043-.116-.045-.113-.045-.112-.046-.109-.047-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.05-.093-.052-.09-.051-.087-.052-.085-.053-.083-.054-.08-.054-.077-.054v4.127zm0-5.654v.011l.001.021.003.021.004.021.005.022.006.022.007.022.009.022.01.022.011.023.012.023.013.023.015.024.016.023.017.024.018.024.019.024.021.024.022.024.023.025.024.024.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.052.11.051.114.051.119.052.123.05.127.051.131.05.135.049.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.044.171.042.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.022.23.02.233.018.236.016.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.012.241-.015.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.048.139-.05.136-.049.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.051.051-.049.023-.025.023-.024.021-.025.02-.024.019-.024.018-.024.017-.024.015-.023.014-.023.013-.024.012-.022.01-.023.01-.023.008-.022.006-.022.006-.022.004-.021.004-.022.001-.021.001-.021v-4.139l-.077.054-.08.054-.083.054-.085.052-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.049-.105.048-.106.047-.109.047-.111.046-.114.045-.115.044-.118.044-.12.044-.122.042-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.035-.143.033-.144.033-.147.033-.148.031-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.025-.161.024-.162.023-.163.022-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.011-.178.009-.179.009-.179.007-.181.007-.182.005-.182.004-.184.003-.184.002h-.37l-.184-.002-.184-.003-.182-.004-.182-.005-.181-.007-.179-.007-.179-.009-.178-.009-.176-.011-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.022-.162-.023-.161-.024-.159-.025-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.031-.146-.033-.145-.033-.143-.033-.141-.035-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.04-.126-.041-.124-.042-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.047-.105-.048-.102-.049-.1-.049-.097-.05-.095-.051-.093-.051-.09-.051-.087-.053-.085-.052-.083-.054-.08-.054-.077-.054v4.139zm0-5.666v.011l.001.02.003.022.004.021.005.022.006.021.007.022.009.023.01.022.011.023.012.023.013.023.015.023.016.024.017.024.018.023.019.024.021.025.022.024.023.024.024.025.052.05.056.05.061.05.066.051.07.051.075.052.079.051.084.052.088.052.092.052.097.052.102.052.105.051.11.052.114.051.119.051.123.051.127.05.131.05.135.05.139.049.144.048.147.048.152.047.155.046.16.045.163.045.167.043.171.043.176.042.178.04.183.04.187.038.19.037.194.036.197.034.202.033.204.032.209.03.212.028.216.027.219.025.222.024.226.021.23.02.233.018.236.017.24.014.243.012.246.01.249.008.253.006.256.003.259.001.26-.001.257-.003.254-.006.25-.008.247-.01.244-.013.241-.014.237-.016.233-.018.231-.02.226-.022.224-.024.22-.025.216-.027.212-.029.21-.03.205-.032.202-.033.198-.035.194-.036.191-.037.187-.039.183-.039.179-.041.175-.042.172-.043.168-.044.163-.045.16-.045.155-.047.152-.047.148-.048.143-.049.139-.049.136-.049.131-.051.126-.05.123-.051.118-.052.114-.051.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.052.07-.051.065-.051.06-.051.056-.05.051-.049.023-.025.023-.025.021-.024.02-.024.019-.024.018-.024.017-.024.015-.023.014-.024.013-.023.012-.023.01-.022.01-.023.008-.022.006-.022.006-.022.004-.022.004-.021.001-.021.001-.021v-4.153l-.077.054-.08.054-.083.053-.085.053-.087.053-.09.051-.093.051-.095.051-.097.05-.1.049-.102.048-.105.048-.106.048-.109.046-.111.046-.114.046-.115.044-.118.044-.12.043-.122.043-.124.042-.126.041-.128.04-.13.039-.132.039-.134.038-.135.037-.138.036-.139.036-.142.034-.143.034-.144.033-.147.032-.148.032-.15.03-.151.03-.153.028-.154.028-.156.027-.158.026-.159.024-.161.024-.162.023-.163.023-.165.021-.166.02-.167.019-.169.018-.169.017-.171.016-.173.015-.173.014-.175.013-.175.012-.177.01-.178.01-.179.009-.179.007-.181.006-.182.006-.182.004-.184.003-.184.001-.185.001-.185-.001-.184-.001-.184-.003-.182-.004-.182-.006-.181-.006-.179-.007-.179-.009-.178-.01-.176-.01-.176-.012-.175-.013-.173-.014-.172-.015-.171-.016-.17-.017-.169-.018-.167-.019-.166-.02-.165-.021-.163-.023-.162-.023-.161-.024-.159-.024-.157-.026-.156-.027-.155-.028-.153-.028-.151-.03-.15-.03-.148-.032-.146-.032-.145-.033-.143-.034-.141-.034-.14-.036-.137-.036-.136-.037-.134-.038-.132-.039-.13-.039-.128-.041-.126-.041-.124-.041-.122-.043-.12-.043-.117-.044-.116-.044-.113-.046-.112-.046-.109-.046-.106-.048-.105-.048-.102-.048-.1-.05-.097-.049-.095-.051-.093-.051-.09-.052-.087-.052-.085-.053-.083-.053-.08-.054-.077-.054v4.153zm8.74-8.179l-.257.004-.254.005-.25.008-.247.011-.244.012-.241.014-.237.016-.233.018-.231.021-.226.022-.224.023-.22.026-.216.027-.212.028-.21.031-.205.032-.202.033-.198.034-.194.036-.191.038-.187.038-.183.04-.179.041-.175.042-.172.043-.168.043-.163.045-.16.046-.155.046-.152.048-.148.048-.143.048-.139.049-.136.05-.131.05-.126.051-.123.051-.118.051-.114.052-.11.052-.106.052-.101.052-.096.052-.092.052-.088.052-.083.052-.079.052-.074.051-.07.052-.065.051-.06.05-.056.05-.051.05-.023.025-.023.024-.021.024-.02.025-.019.024-.018.024-.017.023-.015.024-.014.023-.013.023-.012.023-.01.023-.01.022-.008.022-.006.023-.006.021-.004.022-.004.021-.001.021-.001.021.001.021.001.021.004.021.004.022.006.021.006.023.008.022.01.022.01.023.012.023.013.023.014.023.015.024.017.023.018.024.019.024.02.025.021.024.023.024.023.025.051.05.056.05.06.05.065.051.07.052.074.051.079.052.083.052.088.052.092.052.096.052.101.052.106.052.11.052.114.052.118.051.123.051.126.051.131.05.136.05.139.049.143.048.148.048.152.048.155.046.16.046.163.045.168.043.172.043.175.042.179.041.183.04.187.038.191.038.194.036.198.034.202.033.205.032.21.031.212.028.216.027.22.026.224.023.226.022.231.021.233.018.237.016.241.014.244.012.247.011.25.008.254.005.257.004.26.001.26-.001.257-.004.254-.005.25-.008.247-.011.244-.012.241-.014.237-.016.233-.018.231-.021.226-.022.224-.023.22-.026.216-.027.212-.028.21-.031.205-.032.202-.033.198-.034.194-.036.191-.038.187-.038.183-.04.179-.041.175-.042.172-.043.168-.043.163-.045.16-.046.155-.046.152-.048.148-.048.143-.048.139-.049.136-.05.131-.05.126-.051.123-.051.118-.051.114-.052.11-.052.106-.052.101-.052.096-.052.092-.052.088-.052.083-.052.079-.052.074-.051.07-.052.065-.051.06-.05.056-.05.051-.05.023-.025.023-.024.021-.024.02-.025.019-.024.018-.024.017-.023.015-.024.014-.023.013-.023.012-.023.01-.023.01-.022.008-.022.006-.023.006-.021.004-.022.004-.021.001-.021.001-.021-.001-.021-.001-.021-.004-.021-.004-.022-.006-.021-.006-.023-.008-.022-.01-.022-.01-.023-.012-.023-.013-.023-.014-.023-.015-.024-.017-.023-.018-.024-.019-.024-.02-.025-.021-.024-.023-.024-.023-.025-.051-.05-.056-.05-.06-.05-.065-.051-.07-.052-.074-.051-.079-.052-.083-.052-.088-.052-.092-.052-.096-.052-.101-.052-.106-.052-.11-.052-.114-.052-.118-.051-.123-.051-.126-.051-.131-.05-.136-.05-.139-.049-.143-.048-.148-.048-.152-.048-.155-.046-.16-.046-.163-.045-.168-.043-.172-.043-.175-.042-.179-.041-.183-.04-.187-.038-.191-.038-.194-.036-.198-.034-.202-.033-.205-.032-.21-.031-.212-.028-.216-.027-.22-.026-.224-.023-.226-.022-.231-.021-.233-.018-.237-.016-.241-.014-.244-.012-.247-.011-.25-.008-.254-.005-.257-.004-.26-.001-.26.001z"></path></symbol></defs><defs><symbol id="m17758337933923-clock" width="24" height="24"><path transform="scale(.5)" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.848 12.459c.202.038.202.333.001.372-1.907.361-6.045 1.111-6.547 1.111-.719 0-1.301-.582-1.301-1.301 0-.512.77-5.447 1.125-7.445.034-.192.312-.181.343.014l.985 6.238 5.394 1.011z"></path></symbol></defs><defs><marker id="m17758337933923-arrowhead" refX="7.9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M -1 0 L 10 5 L 0 10 z"></path></marker></defs><defs><marker id="m17758337933923-crosshead" markerWidth="15" markerHeight="8" orient="auto" refX="4" refY="4.5"><path fill="none" stroke="#000000" stroke-width="1pt" d="M 1,2 L 6,7 M 6,2 L 1,7" style="stroke-dasharray: 0, 0;"></path></marker></defs><defs><marker id="m17758337933923-filled-head" refX="15.5" refY="7" markerWidth="20" markerHeight="28" orient="auto"><path d="M 18,7 L9,13 L14,7 L9,1 Z"></path></marker></defs><defs><marker id="m17758337933923-sequencenumber" refX="15" refY="15" markerWidth="60" markerHeight="40" orient="auto"><circle cx="15" cy="15" r="6"></circle></marker></defs><defs><marker id="m17758337933923-solidTopArrowHead" refX="7.9" refY="7.25" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 10 8 L 0 8 z"></path></marker></defs><defs><marker id="m17758337933923-solidBottomArrowHead" refX="7.9" refY="0.75" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 10 0 L 0 8 z"></path></marker></defs><defs><marker id="m17758337933923-stickTopArrowHead" refX="7.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 0 L 7 7" stroke="black" stroke-width="1.5" fill="none"></path></marker></defs><defs><marker id="m17758337933923-stickBottomArrowHead" refX="7.5" refY="0" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M 0 7 L 7 0" stroke="black" stroke-width="1.5" fill="none"></path></marker></defs><g data-et="note" data-id="i2"><rect x="250" y="167" fill="#EDF2AE" stroke="#666" width="264" height="39" class="note"></rect><text x="382" y="172" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="noteText" dy="1em" style="font-size: 16px; font-weight: 400;"><tspan x="382">t1 超时未响应</tspan></text></g><g data-et="note" data-id="i4"><rect x="407" y="292" fill="#EDF2AE" stroke="#666" width="164" height="39" class="note"></rect><text x="489" y="297" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="noteText" dy="1em" style="font-size: 16px; font-weight: 400;"><tspan x="489">t2 渠道实际处理成功</tspan></text></g><text x="174" y="80" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">t0 发起支付</text><line x1="76" y1="111" x2="271" y2="111" class="messageLine0" data-et="message" data-id="i0" data-from="U" data-to="S" stroke-width="2" stroke="none" marker-end="url(#m17758337933923-arrowhead)" style="fill: none;"></line><text x="381" y="126" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">调用渠道</text><line x1="276" y1="157" x2="485" y2="157" class="messageLine0" data-et="message" data-id="i1" data-from="S" data-to="C" stroke-width="2" stroke="none" marker-end="url(#m17758337933923-arrowhead)" style="fill: none;"></line><text x="276" y="221" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">标记失败待确认</text><path d="M 276,252 C 336,242 336,282 276,272" class="messageLine0" data-et="message" data-id="i3" data-from="S" data-to="S" stroke-width="2" stroke="none" marker-end="url(#m17758337933923-arrowhead)" style="fill: none;"></path><text x="384" y="346" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">t3 异步通知成功到达</text><line x1="488" y1="377" x2="279" y2="377" class="messageLine1" data-et="message" data-id="i5" data-from="C" data-to="S" stroke-width="2" stroke="none" marker-end="url(#m17758337933923-arrowhead)" style="stroke-dasharray: 3, 3; fill: none;"></line><text x="276" y="392" text-anchor="middle" dominant-baseline="middle" alignment-baseline="middle" class="messageText" dy="1em" style="font-size: 16px; font-weight: 400;">检测到反转, 进入决策树</text><path d="M 276,423 C 336,413 336,453 276,443" class="messageLine0" data-et="message" data-id="i6" data-from="S" data-to="S" stroke-width="2" stroke="none" marker-end="url(#m17758337933923-arrowhead)" style="fill: none;"></path></svg>

</div>

**关键设计策略：**

**1. 区分”本地判定失败”和”渠道明确拒绝”**

<div class="mermaid-svg-wrapper">

<svg id="m17758337934254" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 800px;" viewBox="0 0 800 174" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337934254{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337934254 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337934254 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337934254 .error-icon{fill:#552222;}#m17758337934254 .error-text{fill:#552222;stroke:#552222;}#m17758337934254 .edge-thickness-normal{stroke-width:1px;}#m17758337934254 .edge-thickness-thick{stroke-width:3.5px;}#m17758337934254 .edge-pattern-solid{stroke-dasharray:0;}#m17758337934254 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337934254 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337934254 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337934254 .marker{fill:#666;stroke:#666;}#m17758337934254 .marker.cross{stroke:#666;}#m17758337934254 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337934254 p{margin:0;}#m17758337934254 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337934254 .cluster-label text{fill:#333;}#m17758337934254 .cluster-label span{color:#333;}#m17758337934254 .cluster-label span p{background-color:transparent;}#m17758337934254 .label text,#m17758337934254 span{fill:#000000;color:#000000;}#m17758337934254 .node rect,#m17758337934254 .node circle,#m17758337934254 .node ellipse,#m17758337934254 .node polygon,#m17758337934254 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337934254 .rough-node .label text,#m17758337934254 .node .label text,#m17758337934254 .image-shape .label,#m17758337934254 .icon-shape .label{text-anchor:middle;}#m17758337934254 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337934254 .rough-node .label,#m17758337934254 .node .label,#m17758337934254 .image-shape .label,#m17758337934254 .icon-shape .label{text-align:center;}#m17758337934254 .node.clickable{cursor:pointer;}#m17758337934254 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337934254 .arrowheadPath{fill:#333333;}#m17758337934254 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337934254 .flowchart-link{stroke:#666;fill:none;}#m17758337934254 .edgeLabel{background-color:white;text-align:center;}#m17758337934254 .edgeLabel p{background-color:white;}#m17758337934254 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337934254 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337934254 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337934254 .cluster text{fill:#333;}#m17758337934254 .cluster span{color:#333;}#m17758337934254 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337934254 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337934254 rect.text{fill:none;stroke-width:0;}#m17758337934254 .icon-shape,#m17758337934254 .image-shape{background-color:white;text-align:center;}#m17758337934254 .icon-shape p,#m17758337934254 .image-shape p{background-color:white;padding:2px;}#m17758337934254 .icon-shape .label rect,#m17758337934254 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337934254 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337934254 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337934254 .node .neo-node{stroke:#999;}#m17758337934254 [data-look="neo"].node rect,#m17758337934254 [data-look="neo"].cluster rect,#m17758337934254 [data-look="neo"].node polygon{stroke:url(#m17758337934254-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934254 [data-look="neo"].node path{stroke:url(#m17758337934254-gradient);stroke-width:1px;}#m17758337934254 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934254 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337934254 [data-look="neo"].node circle{stroke:url(#m17758337934254-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934254 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337934254 [data-look="neo"].icon-shape .icon{fill:url(#m17758337934254-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934254 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337934254-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934254 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337934254_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337934254_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337934254_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337934254_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337934254_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337934254_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337934254_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337934254_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337934254_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337934254_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337934254_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337934254_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M164,87L168.167,87C172.333,87,180.667,87,188.333,87C196,87,203,87,206.5,87L210,87" id="m17758337934254-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTY0LCJ5Ijo4N30seyJ4IjoxODksInkiOjg3fSx7IngiOjIxNCwieSI6ODd9XQ==" data-look="classic" marker-end="url(#m17758337934254_flowchart-v2-pointEnd)"></path><path d="M313.738,68.738L326.282,63.115C338.825,57.492,363.913,46.246,385.29,40.623C406.667,35,424.333,35,433.167,35L442,35" id="m17758337934254-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MzEzLjczODA5NTIzODA5NTI0LCJ5Ijo2OC43MzgwOTUyMzgwOTUyNH0seyJ4IjozODksInkiOjM1fSx7IngiOjQ0NiwieSI6MzV9XQ==" data-look="classic" marker-end="url(#m17758337934254_flowchart-v2-pointEnd)"></path><path d="M586,35L590.167,35C594.333,35,602.667,35,611.667,35C620.667,35,630.333,35,635.167,35L640,35" id="m17758337934254-L_C_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_E_0" data-points="W3sieCI6NTg2LCJ5IjozNX0seyJ4Ijo2MTEsInkiOjM1fSx7IngiOjY0NCwieSI6MzV9XQ==" data-look="classic" marker-end="url(#m17758337934254_flowchart-v2-pointEnd)"></path><path d="M313.738,105.262L326.282,110.885C338.825,116.508,363.913,127.754,385.29,133.377C406.667,139,424.333,139,433.167,139L442,139" id="m17758337934254-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MzEzLjczODA5NTIzODA5NTI0LCJ5IjoxMDUuMjYxOTA0NzYxOTA0NzZ9LHsieCI6Mzg5LCJ5IjoxMzl9LHsieCI6NDQ2LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337934254_flowchart-v2-pointEnd)"></path><path d="M586,139L590.167,139C594.333,139,602.667,139,610.333,139C618,139,625,139,628.5,139L632,139" id="m17758337934254-L_D_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_F_0" data-points="W3sieCI6NTg2LCJ5IjoxMzl9LHsieCI6NjExLCJ5IjoxMzl9LHsieCI6NjM2LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337934254_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(389, 35)"><g class="label" data-id="L_B_C_0" transform="translate(-16, -12)"><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>超时</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(389, 139)"><g class="label" data-id="L_B_D_0" transform="translate(-32, -12)"><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>明确拒绝</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337934254-flowchart-A-0" data-look="classic" transform="translate(86, 87)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>收到成功通知</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934254-flowchart-B-1" data-look="classic" transform="translate(273, 87)"><polygon points="59,0 118,-59 59,-118 0,-59" class="label-container" transform="translate(-58.5, 59)"></polygon><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>失败原因</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934254-flowchart-C-3" data-look="classic" transform="translate(516, 35)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>以渠道为准</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934254-flowchart-E-4" data-look="classic" transform="translate(714, 35)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>修正为成功</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934254-flowchart-D-6" data-look="classic" transform="translate(516, 139)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>以本地为准</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934254-flowchart-F-7" data-look="classic" transform="translate(714, 139)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>生成异常工单</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337934254-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337934254-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337934254-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

| 失败类型 | 原因 | 是否可被渠道修正 |
| --- | --- | --- |
| 失败待确认 | 超时/网络异常，本地主动标记 | 可修正，以渠道结果为准 |
| 真实失败 | 渠道明确返回拒绝码 | 不可修正 |

**2. 引入”失败待确认”中间态**

<div class="mermaid-svg-wrapper">

<svg id="m17758337934615" width="100%" xmlns="http://www.w3.org/2000/svg" class="statediagram" style="max-width: 425.5323791503906px;" viewBox="0 0 425.5323791503906 502" role="graphics-document document" aria-roledescription="stateDiagram"><style>#m17758337934615{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337934615 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337934615 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337934615 .error-icon{fill:#552222;}#m17758337934615 .error-text{fill:#552222;stroke:#552222;}#m17758337934615 .edge-thickness-normal{stroke-width:1px;}#m17758337934615 .edge-thickness-thick{stroke-width:3.5px;}#m17758337934615 .edge-pattern-solid{stroke-dasharray:0;}#m17758337934615 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337934615 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337934615 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337934615 .marker{fill:#666;stroke:#666;}#m17758337934615 .marker.cross{stroke:#666;}#m17758337934615 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337934615 p{margin:0;}#m17758337934615 defs [id$="-barbEnd"]{fill:#000;stroke:#000;}#m17758337934615 g.stateGroup text{fill:#999;stroke:none;font-size:10px;}#m17758337934615 g.stateGroup text{fill:#000000;stroke:none;font-size:10px;}#m17758337934615 g.stateGroup .state-title{font-weight:bolder;fill:#111111;}#m17758337934615 g.stateGroup rect{fill:#eee;stroke:#999;}#m17758337934615 g.stateGroup line{stroke:#666;stroke-width:1;}#m17758337934615 .transition{stroke:#000;stroke-width:1;fill:none;}#m17758337934615 .stateGroup .composit{fill:#ffffff;border-bottom:1px;}#m17758337934615 .stateGroup .alt-composit{fill:#e0e0e0;border-bottom:1px;}#m17758337934615 .state-note{stroke:#999;fill:#666;}#m17758337934615 .state-note text{fill:#fff;stroke:none;font-size:10px;}#m17758337934615 .stateLabel .box{stroke:none;stroke-width:0;fill:#eee;opacity:0.5;}#m17758337934615 .edgeLabel .label rect{fill:#eee;opacity:0.5;}#m17758337934615 .edgeLabel{background-color:white;text-align:center;}#m17758337934615 .edgeLabel p{background-color:white;}#m17758337934615 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337934615 .edgeLabel .label text{fill:#000000;}#m17758337934615 .label div .edgeLabel{color:#000000;}#m17758337934615 .stateLabel text{fill:#111111;font-size:10px;font-weight:bold;}#m17758337934615 .node circle.state-start{fill:#222;stroke:#222;}#m17758337934615 .node .fork-join{fill:#222;stroke:#222;}#m17758337934615 .node circle.state-end{fill:hsl(0, 0%, 83.3333333333%);stroke:#ffffff;stroke-width:1.5;}#m17758337934615 .end-state-inner{fill:#ffffff;stroke-width:1.5;}#m17758337934615 .node rect{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337934615 .node polygon{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337934615 [id$="-barbEnd"]{fill:#666;}#m17758337934615 .statediagram-cluster rect{fill:#eee;stroke:#000;stroke-width:1px;}#m17758337934615 .cluster-label,#m17758337934615 .nodeLabel{color:#111111;}#m17758337934615 .statediagram-cluster rect.outer{rx:5px;ry:5px;}#m17758337934615 .statediagram-state .divider{stroke:#000;}#m17758337934615 .statediagram-state .title-state{rx:5px;ry:5px;}#m17758337934615 .statediagram-cluster.statediagram-cluster .inner{fill:#ffffff;}#m17758337934615 .statediagram-cluster.statediagram-cluster-alt .inner{fill:#f4f4f4;}#m17758337934615 .statediagram-cluster .inner{rx:0;ry:0;}#m17758337934615 .statediagram-state rect.basic{rx:5px;ry:5px;}#m17758337934615 .statediagram-state rect.divider{stroke-dasharray:10,10;fill:#f4f4f4;}#m17758337934615 .note-edge{stroke-dasharray:5;}#m17758337934615 .statediagram-note rect{fill:#666;stroke:#999;stroke-width:1px;rx:0;ry:0;}#m17758337934615 .statediagram-note rect{fill:#666;stroke:#999;stroke-width:1px;rx:0;ry:0;}#m17758337934615 .statediagram-note text{fill:#fff;}#m17758337934615 .statediagram-note .nodeLabel{color:#fff;}#m17758337934615 .statediagram .edgeLabel{color:red;}#m17758337934615 [id$="-dependencyStart"],#m17758337934615 [id$="-dependencyEnd"]{fill:#666;stroke:#666;stroke-width:1;}#m17758337934615 .statediagramTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337934615 [data-look="neo"].statediagram-cluster rect{fill:#eee;stroke:url(#m17758337934615-gradient);stroke-width:1;}#m17758337934615 [data-look="neo"].statediagram-cluster rect.outer{rx:5px;ry:5px;filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 .node .neo-node{stroke:#999;}#m17758337934615 [data-look="neo"].node rect,#m17758337934615 [data-look="neo"].cluster rect,#m17758337934615 [data-look="neo"].node polygon{stroke:url(#m17758337934615-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 [data-look="neo"].node path{stroke:url(#m17758337934615-gradient);stroke-width:1px;}#m17758337934615 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337934615 [data-look="neo"].node circle{stroke:url(#m17758337934615-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337934615 [data-look="neo"].icon-shape .icon{fill:url(#m17758337934615-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337934615-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337934615 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><defs><marker id="m17758337934615_stateDiagram-barbEnd" refX="19" refY="7" markerWidth="20" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto"><path d="M 19,7 L9,13 L14,7 L9,1 Z"></path></marker></defs><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M187,22L187,26.167C187,30.333,187,38.667,187,47C187,55.333,187,63.667,187,67.833L187,72" id="m17758337934615-edge0" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge0" data-points="W3sieCI6MTg3LCJ5IjoyMn0seyJ4IjoxODcsInkiOjQ3fSx7IngiOjE4NywieSI6NzJ9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M187,112L187,116.167C187,120.333,187,128.667,187,137C187,145.333,187,153.667,187,157.833L187,162" id="m17758337934615-edge1" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge1" data-points="W3sieCI6MTg3LCJ5IjoxMTJ9LHsieCI6MTg3LCJ5IjoxMzd9LHsieCI6MTg3LCJ5IjoxNjJ9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M155,195.924L138.5,203.103C122,210.282,89,224.641,72.5,241.321C56,258,56,277,56,296C56,315,56,334,63.086,349.667C70.173,365.333,84.345,377.667,91.431,383.833L98.518,390" id="m17758337934615-edge2" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge2" data-points="W3sieCI6MTU1LCJ5IjoxOTUuOTIzNjY0MTIyMTM3NH0seyJ4Ijo1NiwieSI6MjM5fSx7IngiOjU2LCJ5IjoyOTZ9LHsieCI6NTYsInkiOjM1M30seyJ4Ijo5OC41MTc1NDM4NTk2NDkxMiwieSI6MzkwfV0=" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M219,195.924L235.5,203.103C252,210.282,285,224.641,301.5,241.321C318,258,318,277,318,296C318,315,318,334,322.977,349.667C327.953,365.333,337.906,377.667,342.883,383.833L347.86,390" id="m17758337934615-edge3" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge3" data-points="W3sieCI6MjE5LCJ5IjoxOTUuOTIzNjY0MTIyMTM3NH0seyJ4IjozMTgsInkiOjIzOX0seyJ4IjozMTgsInkiOjI5Nn0seyJ4IjozMTgsInkiOjM1M30seyJ4IjozNDcuODU5NjQ5MTIyODA3LCJ5IjozOTB9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M187,202L187,208.167C187,214.333,187,226.667,187,239C187,251.333,187,263.667,187,269.833L187,276" id="m17758337934615-edge4" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge4" data-points="W3sieCI6MTg3LCJ5IjoyMDJ9LHsieCI6MTg3LCJ5IjoyMzl9LHsieCI6MTg3LCJ5IjoyNzZ9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M187,316L187,322.167C187,328.333,187,340.667,179.914,353C172.827,365.333,158.655,377.667,151.569,383.833L144.482,390" id="m17758337934615-edge5" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge5" data-points="W3sieCI6MTg3LCJ5IjozMTZ9LHsieCI6MTg3LCJ5IjozNTN9LHsieCI6MTQ0LjQ4MjQ1NjE0MDM1MDg4LCJ5IjozOTB9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M235,308.269L264.167,315.724C293.333,323.179,351.667,338.09,375.857,351.712C400.047,365.333,390.094,377.667,385.117,383.833L380.14,390" id="m17758337934615-edge6" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge6" data-points="W3sieCI6MjM1LCJ5IjozMDguMjY5MDU4Mjk1OTY0MX0seyJ4Ijo0MTAsInkiOjM1M30seyJ4IjozODAuMTQwMzUwODc3MTkzLCJ5IjozOTB9XQ==" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M121.5,430L121.5,434.167C121.5,438.333,121.5,446.667,138.961,455.845C156.422,465.022,191.343,475.045,208.804,480.056L226.265,485.067" id="m17758337934615-edge7" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge7" data-points="W3sieCI6MTIxLjUsInkiOjQzMH0seyJ4IjoxMjEuNSwieSI6NDU1fSx7IngiOjIyNi4yNjUyMjU0OTcxNTg0NCwieSI6NDg1LjA2NzE0OTkxODQ2N31d" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path><path d="M364,430L364,434.167C364,438.333,364,446.667,343.301,455.89C322.602,465.112,281.204,475.225,260.505,480.281L239.807,485.337" id="m17758337934615-edge8" class="edge-thickness-normal edge-pattern-solid transition" style="fill:none;;;fill:none" data-edge="true" data-et="edge" data-id="edge8" data-points="W3sieCI6MzY0LCJ5Ijo0MzB9LHsieCI6MzY0LCJ5Ijo0NTV9LHsieCI6MjM5LjgwNjUxNTgxODkyNzkyLCJ5Ijo0ODUuMzM3MzM5NjQ3Mjg0OH1d" data-look="classic" marker-end="url(#m17758337934615_stateDiagram-barbEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="edge0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge1" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(56, 296)"><g class="label" data-id="edge2" transform="translate(-48, -12)"><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>渠道返回成功</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(318, 296)"><g class="label" data-id="edge3" transform="translate(-48, -12)"><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>渠道明确拒绝</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(187, 239)"><g class="label" data-id="edge4" transform="translate(-52.1953125, -12)"><foreignObject width="104.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>超时/网络异常</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(187, 353)"><g class="label" data-id="edge5" transform="translate(-68.1953125, -12)"><foreignObject width="136.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>渠道通知/轮询修正</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(345.53238, 336.52173)"><g class="label" data-id="edge6" transform="translate(-72, -12)"><foreignObject width="144" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>对账确认无此笔交易</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge7" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="edge8" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337934615-state-root_start-0" data-look="classic" transform="translate(187, 15)"><circle class="state-start" r="7" width="14" height="14"></circle></g><g class="node statediagram-state" id="m17758337934615-state-初始化-1" data-look="classic" transform="translate(187, 92)"><rect class="basic label-container" style="" rx="5" ry="5" x="-32" y="-20" width="64" height="40"></rect><g class="label" style="" transform="translate(-24, -12)"><rect></rect><foreignObject width="48" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>初始化</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337934615-state-支付中-4" data-look="classic" transform="translate(187, 182)"><rect class="basic label-container" style="" rx="5" ry="5" x="-32" y="-20" width="64" height="40"></rect><g class="label" style="" transform="translate(-24, -12)"><rect></rect><foreignObject width="48" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>支付中</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337934615-state-成功-7" data-look="classic" transform="translate(121.5, 410)"><rect class="basic label-container" style="" rx="5" ry="5" x="-24" y="-20" width="48" height="40"></rect><g class="label" style="" transform="translate(-16, -12)"><rect></rect><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>成功</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337934615-state-失败-8" data-look="classic" transform="translate(364, 410)"><rect class="basic label-container" style="" rx="5" ry="5" x="-24" y="-20" width="48" height="40"></rect><g class="label" style="" transform="translate(-16, -12)"><rect></rect><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>失败</p></span></div></foreignObject></g></g><g class="node statediagram-state" id="m17758337934615-state-失败待确认-6" data-look="classic" transform="translate(187, 296)"><rect class="basic label-container" style="" rx="5" ry="5" x="-48" y="-20" width="96" height="40"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel markdown-node-label"><p>失败待确认</p></span></div></foreignObject></g></g><g class="node default" id="m17758337934615-state-root_end-8" data-look="classic" transform="translate(233, 487)"><g class="outer-path"><path d="M7 0 C7 0.40517908122283747, 6.964012880168563 0.816513743121899, 6.893654271085456 1.2155372436685123 C6.823295662002349 1.6145607442151257, 6.716427752933756 2.013397210557766, 6.5778483455013586 2.394141003279681 C6.439268938068961 2.7748847960015954, 6.26476736710249 3.149104622578984, 6.062177826491071 3.4999999999999996 C5.859588285879653 3.8508953774210153, 5.622755194947063 4.189128084166967, 5.362311101832846 4.499513267805774 C5.10186700871863 4.809898451444582, 4.809898451444583 5.10186700871863, 4.499513267805775 5.362311101832846 C4.189128084166968 5.622755194947063, 3.8508953774210166 5.859588285879652, 3.500000000000001 6.06217782649107 C3.149104622578985 6.264767367102489, 2.7748847960015963 6.439268938068961, 2.3941410032796817 6.5778483455013586 C2.013397210557767 6.716427752933756, 1.6145607442151264 6.823295662002349, 1.2155372436685128 6.893654271085456 C0.8165137431218992 6.964012880168563, 0.4051790812228379 7, 4.286263797015736e-16 7 C-0.405179081222837 7, -0.8165137431218985 6.964012880168563, -1.2155372436685121 6.893654271085456 C-1.6145607442151257 6.823295662002349, -2.0133972105577667 6.716427752933756, -2.394141003279681 6.5778483455013586 C-2.774884796001595 6.439268938068961, -3.149104622578983 6.26476736710249, -3.4999999999999982 6.062177826491071 C-3.8508953774210135 5.859588285879653, -4.189128084166966 5.6227551949470636, -4.499513267805773 5.362311101832848 C-4.809898451444581 5.101867008718632, -5.101867008718628 4.809898451444586, -5.3623111018328435 4.499513267805779 C-5.622755194947059 4.189128084166971, -5.859588285879649 3.8508953774210206, -6.062177826491068 3.5000000000000053 C-6.264767367102486 3.14910462257899, -6.439268938068958 2.774884796001602, -6.577848345501356 2.394141003279688 C-6.716427752933754 2.0133972105577738, -6.823295662002347 1.614560744215134, -6.893654271085454 1.215537243668521 C-6.9640128801685615 0.816513743121908, -6.999999999999999 0.4051790812228472, -7 1.0183126166254463e-14 C-7.000000000000001 -0.40517908122282686, -6.964012880168565 -0.8165137431218878, -6.893654271085459 -1.215537243668501 C-6.823295662002352 -1.6145607442151142, -6.716427752933759 -2.0133972105577542, -6.577848345501363 -2.394141003279669 C-6.439268938068967 -2.7748847960015834, -6.264767367102496 -3.149104622578972, -6.062177826491078 -3.4999999999999876 C-5.859588285879661 -3.8508953774210033, -5.6227551949470715 -4.1891280841669545, -5.362311101832856 -4.499513267805763 C-5.10186700871864 -4.809898451444571, -4.809898451444594 -5.10186700871862, -4.499513267805787 -5.362311101832836 C-4.189128084166979 -5.622755194947053, -3.850895377421028 -5.859588285879643, -3.5000000000000133 -6.062177826491062 C-3.1491046225789985 -6.264767367102482, -2.774884796001611 -6.439268938068954, -2.3941410032796973 -6.577848345501353 C-2.0133972105577835 -6.716427752933752, -1.6145607442151435 -6.823295662002345, -1.2155372436685306 -6.893654271085453 C-0.8165137431219176 -6.9640128801685615, -0.40517908122285695 -6.999999999999999, -1.9937625952807352e-14 -7 C0.4051790812228171 -7.000000000000001, 0.8165137431218781 -6.964012880168565, 1.2155372436684913 -6.89365427108546 C1.6145607442151044 -6.823295662002354, 2.013397210557745 -6.716427752933763, 2.3941410032796595 -6.5778483455013665 C2.774884796001574 -6.43926893806897, 3.149104622578963 -6.2647673671025, 3.499999999999979 -6.062177826491083 C3.8508953774209953 -5.859588285879665, 4.189128084166947 -5.622755194947077, 4.499513267805756 -5.362311101832862 C4.809898451444564 -5.1018670087186475, 5.101867008718613 -4.809898451444602, 5.362311101832829 -4.499513267805796 C5.622755194947046 -4.189128084166989, 5.859588285879637 -3.8508953774210393, 6.062177826491056 -3.500000000000025 C6.2647673671024755 -3.1491046225790105, 6.439268938068949 -2.774884796001623, 6.577848345501348 -2.3941410032797092 C6.716427752933747 -2.0133972105577955, 6.823295662002342 -1.6145607442151562, 6.893654271085451 -1.2155372436685434 C6.96401288016856 -0.8165137431219307, 6.982275711847575 -0.2025895406114567, 7 -3.2800750208310675e-14 C7.017724288152425 0.2025895406113911, 7.017724288152424 -0.2025895406114242, 7 0" stroke="none" stroke-width="0" fill="#eee" style=""></path><path d="M7 0 C7 0.40517908122283747, 6.964012880168563 0.816513743121899, 6.893654271085456 1.2155372436685123 C6.823295662002349 1.6145607442151257, 6.716427752933756 2.013397210557766, 6.5778483455013586 2.394141003279681 C6.439268938068961 2.7748847960015954, 6.26476736710249 3.149104622578984, 6.062177826491071 3.4999999999999996 C5.859588285879653 3.8508953774210153, 5.622755194947063 4.189128084166967, 5.362311101832846 4.499513267805774 C5.10186700871863 4.809898451444582, 4.809898451444583 5.10186700871863, 4.499513267805775 5.362311101832846 C4.189128084166968 5.622755194947063, 3.8508953774210166 5.859588285879652, 3.500000000000001 6.06217782649107 C3.149104622578985 6.264767367102489, 2.7748847960015963 6.439268938068961, 2.3941410032796817 6.5778483455013586 C2.013397210557767 6.716427752933756, 1.6145607442151264 6.823295662002349, 1.2155372436685128 6.893654271085456 C0.8165137431218992 6.964012880168563, 0.4051790812228379 7, 4.286263797015736e-16 7 C-0.405179081222837 7, -0.8165137431218985 6.964012880168563, -1.2155372436685121 6.893654271085456 C-1.6145607442151257 6.823295662002349, -2.0133972105577667 6.716427752933756, -2.394141003279681 6.5778483455013586 C-2.774884796001595 6.439268938068961, -3.149104622578983 6.26476736710249, -3.4999999999999982 6.062177826491071 C-3.8508953774210135 5.859588285879653, -4.189128084166966 5.6227551949470636, -4.499513267805773 5.362311101832848 C-4.809898451444581 5.101867008718632, -5.101867008718628 4.809898451444586, -5.3623111018328435 4.499513267805779 C-5.622755194947059 4.189128084166971, -5.859588285879649 3.8508953774210206, -6.062177826491068 3.5000000000000053 C-6.264767367102486 3.14910462257899, -6.439268938068958 2.774884796001602, -6.577848345501356 2.394141003279688 C-6.716427752933754 2.0133972105577738, -6.823295662002347 1.614560744215134, -6.893654271085454 1.215537243668521 C-6.9640128801685615 0.816513743121908, -6.999999999999999 0.4051790812228472, -7 1.0183126166254463e-14 C-7.000000000000001 -0.40517908122282686, -6.964012880168565 -0.8165137431218878, -6.893654271085459 -1.215537243668501 C-6.823295662002352 -1.6145607442151142, -6.716427752933759 -2.0133972105577542, -6.577848345501363 -2.394141003279669 C-6.439268938068967 -2.7748847960015834, -6.264767367102496 -3.149104622578972, -6.062177826491078 -3.4999999999999876 C-5.859588285879661 -3.8508953774210033, -5.6227551949470715 -4.1891280841669545, -5.362311101832856 -4.499513267805763 C-5.10186700871864 -4.809898451444571, -4.809898451444594 -5.10186700871862, -4.499513267805787 -5.362311101832836 C-4.189128084166979 -5.622755194947053, -3.850895377421028 -5.859588285879643, -3.5000000000000133 -6.062177826491062 C-3.1491046225789985 -6.264767367102482, -2.774884796001611 -6.439268938068954, -2.3941410032796973 -6.577848345501353 C-2.0133972105577835 -6.716427752933752, -1.6145607442151435 -6.823295662002345, -1.2155372436685306 -6.893654271085453 C-0.8165137431219176 -6.9640128801685615, -0.40517908122285695 -6.999999999999999, -1.9937625952807352e-14 -7 C0.4051790812228171 -7.000000000000001, 0.8165137431218781 -6.964012880168565, 1.2155372436684913 -6.89365427108546 C1.6145607442151044 -6.823295662002354, 2.013397210557745 -6.716427752933763, 2.3941410032796595 -6.5778483455013665 C2.774884796001574 -6.43926893806897, 3.149104622578963 -6.2647673671025, 3.499999999999979 -6.062177826491083 C3.8508953774209953 -5.859588285879665, 4.189128084166947 -5.622755194947077, 4.499513267805756 -5.362311101832862 C4.809898451444564 -5.1018670087186475, 5.101867008718613 -4.809898451444602, 5.362311101832829 -4.499513267805796 C5.622755194947046 -4.189128084166989, 5.859588285879637 -3.8508953774210393, 6.062177826491056 -3.500000000000025 C6.2647673671024755 -3.1491046225790105, 6.439268938068949 -2.774884796001623, 6.577848345501348 -2.3941410032797092 C6.716427752933747 -2.0133972105577955, 6.823295662002342 -1.6145607442151562, 6.893654271085451 -1.2155372436685434 C6.96401288016856 -0.8165137431219307, 6.982275711847575 -0.2025895406114567, 7 -3.2800750208310675e-14 C7.017724288152425 0.2025895406113911, 7.017724288152424 -0.2025895406114242, 7 0" stroke="#666" stroke-width="2" fill="none" stroke-dasharray="0 0" style=""></path><g><path d="M2.5 0 C2.5 0.14470681472244193, 2.487147457203058 0.29161205111496386, 2.46201938253052 0.4341204441673258 C2.436891307857982 0.5766288372196877, 2.3987241974763416 0.7190704323420595, 2.3492315519647713 0.8550503583141718 C2.299738906453201 0.991030284286284, 2.2374169168223177 1.124680222349637, 2.165063509461097 1.2499999999999998 C2.092710102099876 1.3753197776503625, 2.0081268553382365 1.496117172916774, 1.915111107797445 1.6069690242163481 C1.8220953602566536 1.7178208755159223, 1.7178208755159226 1.8220953602566536, 1.6069690242163484 1.915111107797445 C1.4961171729167742 2.0081268553382365, 1.375319777650363 2.0927101020998755, 1.2500000000000002 2.1650635094610964 C1.1246802223496375 2.2374169168223172, 0.9910302842862845 2.2997389064532, 0.8550503583141721 2.349231551964771 C0.7190704323420597 2.3987241974763416, 0.576628837219688 2.436891307857982, 0.43412044416732604 2.46201938253052 C0.291612051114964 2.487147457203058, 0.14470681472244212 2.5, 1.5308084989341916e-16 2.5 C-0.1447068147224418 2.5, -0.2916120511149638 2.487147457203058, -0.43412044416732576 2.46201938253052 C-0.5766288372196877 2.436891307857982, -0.7190704323420595 2.3987241974763416, -0.8550503583141718 2.3492315519647713 C-0.991030284286284 2.299738906453201, -1.124680222349637 2.2374169168223177, -1.2499999999999996 2.165063509461097 C-1.375319777650362 2.092710102099876, -1.4961171729167733 2.008126855338237, -1.6069690242163475 1.9151111077974459 C-1.7178208755159217 1.8220953602566548, -1.822095360256653 1.7178208755159234, -1.9151111077974443 1.6069690242163495 C-2.0081268553382357 1.4961171729167755, -2.0927101020998746 1.3753197776503645, -2.1650635094610955 1.250000000000002 C-2.2374169168223164 1.1246802223496395, -2.2997389064531992 0.9910302842862865, -2.34923155196477 0.8550503583141743 C-2.3987241974763407 0.7190704323420621, -2.436891307857981 0.5766288372196907, -2.4620193825305194 0.434120444167329 C-2.487147457203058 0.29161205111496724, -2.5 0.14470681472244545, -2.5 3.636830773662308e-15 C-2.5 -0.14470681472243818, -2.4871474572030587 -0.2916120511149599, -2.4620193825305208 -0.4341204441673218 C-2.436891307857983 -0.5766288372196837, -2.398724197476343 -0.7190704323420553, -2.3492315519647726 -0.8550503583141675 C-2.2997389064532023 -0.9910302842862798, -2.23741691682232 -1.1246802223496328, -2.165063509461099 -1.2499999999999956 C-2.092710102099878 -1.3753197776503583, -2.00812685533824 -1.4961171729167695, -1.9151111077974488 -1.606969024216344 C-1.8220953602566576 -1.7178208755159183, -1.7178208755159263 -1.82209536025665, -1.6069690242163523 -1.9151111077974416 C-1.4961171729167784 -2.0081268553382334, -1.3753197776503672 -2.0927101020998724, -1.2500000000000047 -2.1650635094610937 C-1.1246802223496422 -2.237416916822315, -0.9910302842862897 -2.299738906453198, -0.8550503583141776 -2.3492315519647686 C-0.7190704323420656 -2.3987241974763394, -0.5766288372196942 -2.4368913078579806, -0.43412044416733236 -2.462019382530519 C-0.29161205111497057 -2.4871474572030574, -0.1447068147224489 -2.4999999999999996, -7.120580697431198e-15 -2.5 C0.14470681472243463 -2.5000000000000004, 0.29161205111495647 -2.487147457203059, 0.4341204441673183 -2.4620193825305217 C0.5766288372196802 -2.436891307857984, 0.7190704323420518 -2.3987241974763442, 0.8550503583141642 -2.349231551964774 C0.9910302842862766 -2.2997389064532037, 1.1246802223496295 -2.2374169168223212, 1.2499999999999925 -2.165063509461101 C1.3753197776503554 -2.0927101020998804, 1.4961171729167668 -2.008126855338242, 1.6069690242163412 -1.915111107797451 C1.7178208755159157 -1.82209536025666, 1.8220953602566472 -1.7178208755159294, 1.915111107797439 -1.6069690242163557 C2.0081268553382308 -1.496117172916782, 2.09271010209987 -1.3753197776503712, 2.1650635094610915 -1.2500000000000089 C2.237416916822313 -1.1246802223496466, 2.299738906453196 -0.9910302842862939, 2.3492315519647673 -0.855050358314182 C2.3987241974763385 -0.71907043234207, 2.4368913078579792 -0.5766288372196986, 2.462019382530518 -0.4341204441673369 C2.487147457203057 -0.29161205111497523, 2.4936698970884197 -0.07235340736123454, 2.5 -1.1714553645825241e-14 C2.5063301029115803 0.07235340736121111, 2.50633010291158 -0.07235340736122292, 2.5 0" stroke="none" stroke-width="0" fill="#000" style=""></path><path d="M2.5 0 C2.5 0.14470681472244193, 2.487147457203058 0.29161205111496386, 2.46201938253052 0.4341204441673258 C2.436891307857982 0.5766288372196877, 2.3987241974763416 0.7190704323420595, 2.3492315519647713 0.8550503583141718 C2.299738906453201 0.991030284286284, 2.2374169168223177 1.124680222349637, 2.165063509461097 1.2499999999999998 C2.092710102099876 1.3753197776503625, 2.0081268553382365 1.496117172916774, 1.915111107797445 1.6069690242163481 C1.8220953602566536 1.7178208755159223, 1.7178208755159226 1.8220953602566536, 1.6069690242163484 1.915111107797445 C1.4961171729167742 2.0081268553382365, 1.375319777650363 2.0927101020998755, 1.2500000000000002 2.1650635094610964 C1.1246802223496375 2.2374169168223172, 0.9910302842862845 2.2997389064532, 0.8550503583141721 2.349231551964771 C0.7190704323420597 2.3987241974763416, 0.576628837219688 2.436891307857982, 0.43412044416732604 2.46201938253052 C0.291612051114964 2.487147457203058, 0.14470681472244212 2.5, 1.5308084989341916e-16 2.5 C-0.1447068147224418 2.5, -0.2916120511149638 2.487147457203058, -0.43412044416732576 2.46201938253052 C-0.5766288372196877 2.436891307857982, -0.7190704323420595 2.3987241974763416, -0.8550503583141718 2.3492315519647713 C-0.991030284286284 2.299738906453201, -1.124680222349637 2.2374169168223177, -1.2499999999999996 2.165063509461097 C-1.375319777650362 2.092710102099876, -1.4961171729167733 2.008126855338237, -1.6069690242163475 1.9151111077974459 C-1.7178208755159217 1.8220953602566548, -1.822095360256653 1.7178208755159234, -1.9151111077974443 1.6069690242163495 C-2.0081268553382357 1.4961171729167755, -2.0927101020998746 1.3753197776503645, -2.1650635094610955 1.250000000000002 C-2.2374169168223164 1.1246802223496395, -2.2997389064531992 0.9910302842862865, -2.34923155196477 0.8550503583141743 C-2.3987241974763407 0.7190704323420621, -2.436891307857981 0.5766288372196907, -2.4620193825305194 0.434120444167329 C-2.487147457203058 0.29161205111496724, -2.5 0.14470681472244545, -2.5 3.636830773662308e-15 C-2.5 -0.14470681472243818, -2.4871474572030587 -0.2916120511149599, -2.4620193825305208 -0.4341204441673218 C-2.436891307857983 -0.5766288372196837, -2.398724197476343 -0.7190704323420553, -2.3492315519647726 -0.8550503583141675 C-2.2997389064532023 -0.9910302842862798, -2.23741691682232 -1.1246802223496328, -2.165063509461099 -1.2499999999999956 C-2.092710102099878 -1.3753197776503583, -2.00812685533824 -1.4961171729167695, -1.9151111077974488 -1.606969024216344 C-1.8220953602566576 -1.7178208755159183, -1.7178208755159263 -1.82209536025665, -1.6069690242163523 -1.9151111077974416 C-1.4961171729167784 -2.0081268553382334, -1.3753197776503672 -2.0927101020998724, -1.2500000000000047 -2.1650635094610937 C-1.1246802223496422 -2.237416916822315, -0.9910302842862897 -2.299738906453198, -0.8550503583141776 -2.3492315519647686 C-0.7190704323420656 -2.3987241974763394, -0.5766288372196942 -2.4368913078579806, -0.43412044416733236 -2.462019382530519 C-0.29161205111497057 -2.4871474572030574, -0.1447068147224489 -2.4999999999999996, -7.120580697431198e-15 -2.5 C0.14470681472243463 -2.5000000000000004, 0.29161205111495647 -2.487147457203059, 0.4341204441673183 -2.4620193825305217 C0.5766288372196802 -2.436891307857984, 0.7190704323420518 -2.3987241974763442, 0.8550503583141642 -2.349231551964774 C0.9910302842862766 -2.2997389064532037, 1.1246802223496295 -2.2374169168223212, 1.2499999999999925 -2.165063509461101 C1.3753197776503554 -2.0927101020998804, 1.4961171729167668 -2.008126855338242, 1.6069690242163412 -1.915111107797451 C1.7178208755159157 -1.82209536025666, 1.8220953602566472 -1.7178208755159294, 1.915111107797439 -1.6069690242163557 C2.0081268553382308 -1.496117172916782, 2.09271010209987 -1.3753197776503712, 2.1650635094610915 -1.2500000000000089 C2.237416916822313 -1.1246802223496466, 2.299738906453196 -0.9910302842862939, 2.3492315519647673 -0.855050358314182 C2.3987241974763385 -0.71907043234207, 2.4368913078579792 -0.5766288372196986, 2.462019382530518 -0.4341204441673369 C2.487147457203057 -0.29161205111497523, 2.4936698970884197 -0.07235340736123454, 2.5 -1.1714553645825241e-14 C2.5063301029115803 0.07235340736121111, 2.50633010291158 -0.07235340736122292, 2.5 0" stroke="#000" stroke-width="2" fill="none" stroke-dasharray="0 0" style=""></path></g></g></g></g></g></g><defs><filter id="m17758337934615-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337934615-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337934615-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

**3. Go 伪代码实现**

```go
func (s *PaymentService) HandleChannelTimeout(ctx context.Context, orderID string) error {
    // 超时不直接标记失败，而是标记”失败待确认”
    return s.orderRepo.UpdateStatus(ctx, orderID, StatusFailPending)
}

func (s *PaymentService) HandlePaymentResult(ctx context.Context, orderID string, result *ChannelResult) error {
    order, err := s.orderRepo.GetByOrderID(ctx, orderID)
    if err != nil {
        return err
    }

    switch {
    // 正常终态，幂等返回
    case order.Status == StatusSuccess:
        return nil

    // “失败待确认”状态收到成功通知 → 修正为成功
    case order.Status == StatusFailPending && result.Status == StatusSuccess:
        log.Warn("状态反转修正", "orderID", orderID, "from", order.Status, "to", StatusSuccess)
        return s.correctToSuccess(ctx, order, result)

    // 真正的终态失败，收到成功通知 → 异常告警，人工介入
    case order.Status == StatusFailed && result.Status == StatusSuccess:
        log.Error("终态失败后收到成功通知，需人工处理", "orderID", orderID)
        return s.createExceptionOrder(ctx, order, result)

    default:
        return s.normalStateTransit(ctx, order, result)
    }
}

func (s *PaymentService) correctToSuccess(ctx context.Context, order *Order, result *ChannelResult) error {
    // 1. 修正订单状态
    if err := s.orderRepo.UpdateStatus(ctx, order.OrderID, StatusSuccess); err != nil {
        return err
    }
    // 2. 触发后续流程（通知商户、记账等）
    return s.triggerPostPayment(ctx, order)
}
```

**4. 对账兜底**

> 无论技术方案多完善，”失败待确认”的订单最终都必须通过对账确认。日终对账时，拉取渠道侧的交易明细，逐笔比对：渠道有而本地没有的，补充入账；本地有而渠道没有的，确认为真实失败并关闭。

<div class="mermaid-svg-wrapper">

<svg id="m17758337935276" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 720px;" viewBox="0 0 720 278" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337935276{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337935276 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337935276 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337935276 .error-icon{fill:#552222;}#m17758337935276 .error-text{fill:#552222;stroke:#552222;}#m17758337935276 .edge-thickness-normal{stroke-width:1px;}#m17758337935276 .edge-thickness-thick{stroke-width:3.5px;}#m17758337935276 .edge-pattern-solid{stroke-dasharray:0;}#m17758337935276 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337935276 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337935276 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337935276 .marker{fill:#666;stroke:#666;}#m17758337935276 .marker.cross{stroke:#666;}#m17758337935276 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337935276 p{margin:0;}#m17758337935276 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337935276 .cluster-label text{fill:#333;}#m17758337935276 .cluster-label span{color:#333;}#m17758337935276 .cluster-label span p{background-color:transparent;}#m17758337935276 .label text,#m17758337935276 span{fill:#000000;color:#000000;}#m17758337935276 .node rect,#m17758337935276 .node circle,#m17758337935276 .node ellipse,#m17758337935276 .node polygon,#m17758337935276 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337935276 .rough-node .label text,#m17758337935276 .node .label text,#m17758337935276 .image-shape .label,#m17758337935276 .icon-shape .label{text-anchor:middle;}#m17758337935276 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337935276 .rough-node .label,#m17758337935276 .node .label,#m17758337935276 .image-shape .label,#m17758337935276 .icon-shape .label{text-align:center;}#m17758337935276 .node.clickable{cursor:pointer;}#m17758337935276 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337935276 .arrowheadPath{fill:#333333;}#m17758337935276 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337935276 .flowchart-link{stroke:#666;fill:none;}#m17758337935276 .edgeLabel{background-color:white;text-align:center;}#m17758337935276 .edgeLabel p{background-color:white;}#m17758337935276 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337935276 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337935276 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337935276 .cluster text{fill:#333;}#m17758337935276 .cluster span{color:#333;}#m17758337935276 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337935276 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337935276 rect.text{fill:none;stroke-width:0;}#m17758337935276 .icon-shape,#m17758337935276 .image-shape{background-color:white;text-align:center;}#m17758337935276 .icon-shape p,#m17758337935276 .image-shape p{background-color:white;padding:2px;}#m17758337935276 .icon-shape .label rect,#m17758337935276 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337935276 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337935276 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337935276 .node .neo-node{stroke:#999;}#m17758337935276 [data-look="neo"].node rect,#m17758337935276 [data-look="neo"].cluster rect,#m17758337935276 [data-look="neo"].node polygon{stroke:url(#m17758337935276-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337935276 [data-look="neo"].node path{stroke:url(#m17758337935276-gradient);stroke-width:1px;}#m17758337935276 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337935276 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337935276 [data-look="neo"].node circle{stroke:url(#m17758337935276-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337935276 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337935276 [data-look="neo"].icon-shape .icon{fill:url(#m17758337935276-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337935276 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337935276-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337935276 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337935276_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337935276_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337935276_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337935276_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337935276_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337935276_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337935276_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337935276_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337935276_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337935276_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337935276_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337935276_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M164,139L168.167,139C172.333,139,180.667,139,188.333,139C196,139,203,139,206.5,139L210,139" id="m17758337935276-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTY0LCJ5IjoxMzl9LHsieCI6MTg5LCJ5IjoxMzl9LHsieCI6MjE0LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337935276_flowchart-v2-pointEnd)"></path><path d="M338,139L342.167,139C346.333,139,354.667,139,362.333,139C370,139,377,139,380.5,139L384,139" id="m17758337935276-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MzM4LCJ5IjoxMzl9LHsieCI6MzYzLCJ5IjoxMzl9LHsieCI6Mzg4LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337935276_flowchart-v2-pointEnd)"></path><path d="M475.922,108.922L487.768,96.601C499.614,84.281,523.307,59.641,542.654,47.32C562,35,577,35,584.5,35L592,35" id="m17758337935276-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6NDc1LjkyMTU2ODYyNzQ1MSwieSI6MTA4LjkyMTU2ODYyNzQ1MDk4fSx7IngiOjU0NywieSI6MzV9LHsieCI6NTk2LCJ5IjozNX1d" data-look="classic" marker-end="url(#m17758337935276_flowchart-v2-pointEnd)"></path><path d="M506,139L512.833,139C519.667,139,533.333,139,546.333,139C559.333,139,571.667,139,577.833,139L584,139" id="m17758337935276-L_C_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_E_0" data-points="W3sieCI6NTA2LCJ5IjoxMzl9LHsieCI6NTQ3LCJ5IjoxMzl9LHsieCI6NTg4LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337935276_flowchart-v2-pointEnd)"></path><path d="M475.922,169.078L487.768,181.399C499.614,193.719,523.307,218.359,543.987,230.68C564.667,243,582.333,243,591.167,243L600,243" id="m17758337935276-L_C_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_F_0" data-points="W3sieCI6NDc1LjkyMTU2ODYyNzQ1MSwieSI6MTY5LjA3ODQzMTM3MjU0OTAzfSx7IngiOjU0NywieSI6MjQzfSx7IngiOjYwNCwieSI6MjQzfV0=" data-look="classic" marker-end="url(#m17758337935276_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(547, 35)"><g class="label" data-id="L_C_D_0" transform="translate(-16, -12)"><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>长款</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(547, 139)"><g class="label" data-id="L_C_E_0" transform="translate(-16, -12)"><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>短款</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(547, 243)"><g class="label" data-id="L_C_F_0" transform="translate(-16, -12)"><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>一致</p></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337935276-flowchart-A-0" data-look="classic" transform="translate(86, 139)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>拉取渠道账单</p></span></div></foreignObject></g></g><g class="node default" id="m17758337935276-flowchart-B-1" data-look="classic" transform="translate(276, 139)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>逐笔比对</p></span></div></foreignObject></g></g><g class="node default" id="m17758337935276-flowchart-C-3" data-look="classic" transform="translate(447, 139)"><polygon points="59,0 118,-59 59,-118 0,-59" class="label-container" transform="translate(-58.5, 59)"></polygon><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>比对结果</p></span></div></foreignObject></g></g><g class="node default" id="m17758337935276-flowchart-D-5" data-look="classic" transform="translate(650, 35)"><rect class="basic label-container" style="" x="-54" y="-27" width="108" height="54"></rect><g class="label" style="" transform="translate(-24, -12)"><rect></rect><foreignObject width="48" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>补入账</p></span></div></foreignObject></g></g><g class="node default" id="m17758337935276-flowchart-E-7" data-look="classic" transform="translate(650, 139)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>确认失败</p></span></div></foreignObject></g></g><g class="node default" id="m17758337935276-flowchart-F-9" data-look="classic" transform="translate(650, 243)"><rect class="basic label-container" style="" x="-46" y="-27" width="92" height="54"></rect><g class="label" style="" transform="translate(-16, -12)"><rect></rect><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>正常</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337935276-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337935276-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337935276-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

> 长款：渠道有、本地无；短款：渠道无、本地有。

</details>

### 3. 资金安全答题顺序

凡是涉及资金修改，建议始终按这个顺序回答：

1. 先谈幂等
2. 再谈日志与审计
3. 最后谈离线对账和补偿

---

## 三、存储与中间件

### 对应资料导航

- [database/sql：连接池与事务](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入](/golang/guide/source-reading/database-sql-advanced)
- [pgx：PostgreSQL 原生驱动](/golang/guide/source-reading/pgx-driver)
- [go-redis：客户端与分布式锁](/golang/guide/source-reading/go-redis)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)

### 专题拆分导航

MySQL、Redis、Kafka 已经从主文档中单独拆出，便于按中间件维度复习：

- [MySQL 专题：索引、事务、死锁、热点更新、分库分表](/mysql/)
- [PostgreSQL 专题：MVCC、索引、批量写入、分区表、高可用](/postgresql/)
- [Redis 专题：缓存穿透/击穿/雪崩、分布式锁、Lua、滑动窗口](/redis/)
- [Kafka 专题：可靠性、顺序性、积压治理、重试与死信](/kafka/)

建议的复习顺序：

1. 先看 MySQL / PostgreSQL，夯实存储与事务基本盘
2. 再看 Redis，补并发控制与缓存治理
3. 最后看 Kafka，串起异步解耦与削峰填谷

### 四个中间件专题总览

| MySQL | PostgreSQL |
| --- | --- |
| 适合先补事务、锁、热点更新这些 OLTP 基本盘。 | 适合先补 MVCC、分区表、批量写入、高可用这些 PostgreSQL 特色能力。 |
| 重点：B+ 树与最左前缀、大事务拆分、死锁重试、热点更新、分库分表。 | 重点：MVCC、索引类型、`CopyFrom`、分区表、WAL 与流复制。 |
| [进入 MySQL 专题](/mysql/) | [进入 PostgreSQL 专题](/postgresql/) |

| Redis | Kafka |
| --- | --- |
| 适合先补缓存治理、并发控制和请求级幂等。 | 适合先补异步链路里不丢、不乱、不堵的治理。 |
| 重点：穿透/击穿/雪崩、分布式锁、Lua、滑动窗口、幂等控制。 | 重点：消息可靠性、顺序性、积压处理、重试与死信。 |
| [进入 Redis 专题](/redis/) | [进入 Kafka 专题](/kafka/) |

### 四篇重点速览

| 专题 | 适合先看什么 | 重点题目 |
| --- | --- | --- |
| MySQL | 支付链路为什么容易被事务和锁拖慢 | B+ 树与最左前缀、大事务拆分、死锁重试、热点更新、分库分表 |
| PostgreSQL | 什么时候更适合用 PostgreSQL 做账务、流水、审计 | MVCC、索引类型、批量写入、分区表、WAL 与高可用 |
| Redis | 缓存与并发控制怎么守住核心链路 | 穿透/击穿/雪崩、分布式锁安全性、Lua 原子性、滑动窗口、请求级幂等 |
| Kafka | 异步链路如何保证不丢、不乱、不堵 | 消息可靠性、同单顺序、消息积压、重试与死信 |

如果只够冲刺一轮：

- 偏数据库基础薄弱，先看 [MySQL 专题](/mysql/)
- 偏 PostgreSQL / 账务流水治理薄弱，先看 [PostgreSQL 专题](/postgresql/)
- 偏高并发治理薄弱，先看 [Redis 专题](/redis/)
- 偏异步架构和削峰填谷薄弱，先看 [Kafka 专题](/kafka/)

---

## 四、安全与合规

### 对应资料导航

- [crypto/aes：对称加密](/golang/guide/source-reading/crypto-aes)
- [crypto/rsa：RSA 非对称加密](/golang/guide/source-reading/crypto-rsa)
- [golang.org/x/oauth2：OAuth2 客户端](/golang/guide/source-reading/golang-x-oauth2)
- [Go 安全编程专题](/golang/guide/10-security-practices)

这是支付系统与普通后端系统的明显分水岭。

### 1. 数据安全

- 卡号、身份证、账户号等敏感信息必须加密存储
- CVV 这类高敏感字段原则上不落库
- 传输链路必须启用 TLS
- 密钥必须托管，不要明文配置

### 2. 防御机制

重点防御手段：

<details>
<summary><strong>如何防御重放攻击？</strong></summary>

> 每个请求带随机 Nonce 和时间戳，服务端校验时间窗口（如 5 分钟），同时记录已用 Nonce 防重复。

```go
func (g *Gateway) AntiReplay(nonce string, ts int64) error {
    if abs(time.Now().Unix()-ts) > 300 {
        return ErrTimestampExpired // 超过 5 分钟窗口
    }
    if !g.redis.SetNX(ctx, "nonce:"+nonce, "1", 5*time.Minute).Val() {
        return ErrNonceReused // Nonce 已使用
    }
    return nil
}
```

</details>

<details>
<summary><strong>数字签名怎么答？</strong></summary>

> 请求参数按 key 排序拼接后用 RSA/HMAC 签名，服务端用公钥/密钥验签。防止参数被中间人篡改。

```go
// 签名：参数排序 + HMAC-SHA256
func Sign(params map[string]string, secret string) string {
    keys := sortedKeys(params)
    var buf strings.Builder
    for _, k := range keys {
        buf.WriteString(k + "=" + params[k] + "&")
    }
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(buf.Bytes())
    return hex.EncodeToString(mac.Sum(nil))
}
```

</details>

<details>
<summary><strong>如何防止金额篡改？</strong></summary>

> 前端传的金额仅用于展示，后端下单时以订单中心/商品中心的价格为准，同时验签防止请求参数被篡改。

</details>

<details>
<summary><strong>如何防御 SQL 注入？</strong></summary>

> 全部使用预编译语句（`?` 占位符），严禁字符串拼接 SQL。Go 的 `database/sql` 原生支持参数绑定。

```go
// 正例：参数绑定
db.Query("SELECT * FROM orders WHERE id = ?", orderID)

// 反例：字符串拼接（严禁）
db.Query("SELECT * FROM orders WHERE id = '" + orderID + "'")
```

</details>

### 3. 鉴权与身份校验

<details>
<summary><strong>OAuth 2.0 常见授权模式怎么答？</strong></summary>

| 模式 | 适用场景 |
| --- | --- |
| 授权码模式 | 第三方 Web 应用，安全性最高 |
| 客户端凭证模式 | 服务间调用，无用户参与 |
| 密码模式 | 自有客户端（不推荐给三方） |

</details>

<details>
<summary><strong>JWT 在分布式环境下的优缺点怎么答？</strong></summary>

> **优点**：无状态，不依赖集中式 Session 存储，网关层解析后即可鉴权。**缺点**：无法主动失效（需配合黑名单或短有效期 + Refresh Token）；Token 体积大，每次请求都携带。

</details>

<details>
<summary><strong>网关层鉴权与服务内鉴权的边界怎么答？</strong></summary>

> 网关层负责身份认证（Authentication）：验 Token、解析用户身份。服务层负责权限校验（Authorization）：判断该用户是否有权操作该资源。两者不能混在一起，也不能只做一层。

</details>

### 4. 安全问题速记表

| 风险点 | 典型防御手段 |
| --- | --- |
| SQL 注入 | 预编译语句、参数绑定 |
| 支付金额篡改 | 后端以订单中心价格为准，验签防篡改 |
| 重复支付 | RequestID + 幂等键 + 分布式锁 |
| 重放攻击 | Nonce + Timestamp + 签名 |
| 敏感数据泄漏 | 加密、脱敏、密钥托管 |

---

## 五、业务理解与加分项

### 对应资料导航

- [架构师学习路线](/architecture/architect-learning-roadmap)
- [Go 学习路径与资料导航](/golang/learning-path)

### 1. 跨境支付链路

要能完整讲出跨境支付全链路：

```text
用户下单 -> 收银台 -> 支付路由 -> 银行 / 三方渠道 -> 清算 -> 结算 -> 财务对账
```

### 2. AI 辅助开发

这类系统实践越来越关注工程效率，建议准备 2 到 3 个真实例子：

- 用 AI 生成表驱动测试，补边界场景
- 用 AI 辅助理解和重构老旧清分逻辑
- 用 AI 辅助分析 SQL 执行计划和死锁风险

答法重点不是“我会用 Copilot”，而是：

> AI 对我来说不是代码补全工具，而是测试生成、重构辅助和质量把关工具。

---

## 六、标准表达模板

这部分适合直接朗读和演练。

### 1. Go 性能调优

**示例问题：你在项目中如何发现并解决 Go 程序的性能瓶颈？**

可参考以下结构作答。

<details>
<summary><strong>第一步：先讲原则</strong></summary>

> 我遵循“测量驱动优化”的原则，不会先拍脑袋改代码。通常会先通过 `pprof` 采集 CPU 和 Heap Profile。如果是长连接服务，我会重点看 goroutine 泄漏；如果是高吞吐接口，我会重点看 `allocs/op` 和 GC 压力。

</details>

<details>
<summary><strong>第二步：再讲案例</strong></summary>

> 例如在支付网关的加签逻辑里，我发现高峰期 CPU 占用异常。通过火焰图定位到频繁创建大对象，导致 GC 压力过大，STW 时间拉长。然后我结合逃逸分析，发现一些本该在栈上分配的对象逃逸到了堆上。

</details>

<details>
<summary><strong>第三步：最后讲结果</strong></summary>

> 优化上我主要做了三件事：第一，用 `sync.Pool` 复用对象；第二，把频繁字符串拼接从 `+` 改成 `strings.Builder`；第三，减少中间临时对象分配。优化后单机 QPS 提升约 30%，GC 频率下降约 50%，P99 延迟明显收敛。

</details>

<details>
<summary><strong>第四步：升华到底层理解</strong></summary>

> 这让我进一步确认，在支付这种低延迟场景中，减少内存分配往往比单纯加机器更有效。我也会持续关注 Go Runtime 版本更新，例如 Soft Memory Limit 对 GC 控制的帮助。

</details>

### 2. 清结算系统设计

**示例问题：如何设计一个高可用的清结算系统，保证资金一致性？**

建议按以下逻辑回答：

<details>
<summary><strong>核心模型</strong></summary>

> 清结算的核心不是“更新余额”，而是“保证账务准确”。我会基于复式记账模型设计系统，确保每笔资金流动都有对应借贷分录，借贷恒等。

</details>

<details>
<summary><strong>系统拆分</strong></summary>

```text
清算：计算谁欠谁多少钱
结算：实际打款和资金划转
```

</details>

<details>
<summary><strong>一致性保障</strong></summary>

> 我会采用“事务消息 + 幂等状态机”的组合方案。所有结算请求都必须带全局唯一 BusinessID，数据库层用唯一索引做去重。核心账务落库后，再异步触发下游结算流程。

</details>

<details>
<summary><strong>异常处理</strong></summary>

> 如果下游结算失败，可以根据场景选择 TCC 补偿，或者通过准实时 / 日终对账任务进行兜底，保证最终一致。

</details>

<details>
<summary><strong>峰值场景</strong></summary>

> 针对双十一这类场景，我会设计分布式对账引擎，支持并发拉取渠道账单并做分片比对，确保 T+1 之前完成资金核对。

</details>

---

## 七、分布式事务方案

### 对应资料导航

- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [架构能力自检准备清单](/architecture/architect-interview-prep-checklist)

支付分布式事务里，最常被问的是本地消息表和 TCC。

### 1. 本地消息表

这是支付系统里最实用、最常见的最终一致性方案。

<details>
<summary><strong>核心思路</strong></summary>

把业务数据变更和消息记录放在同一个本地事务里提交，保证：

- 业务成功，消息一定落库
- 消息没发出去，可以靠异步任务重试

</details>

<details>
<summary><strong>流程</strong></summary>

1. 在本地事务中更新订单状态
2. 同时写入消息表，状态为 `PENDING`
3. 提交事务
4. 后台任务扫描消息表并投递 MQ
5. 消费成功后更新消息状态

</details>

<details>
<summary><strong>Go 伪代码</strong></summary>

```go
func (s *PaymentService) CreatePayment(ctx context.Context, req *PaymentReq) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		order := &Order{
			OrderID: req.ID,
			Status:  "PAYING",
			Amount:  req.Amount,
		}
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		msg := &LocalMessage{
			BusinessID: req.ID,
			Payload:    Marshal(req),
			Status:     "PENDING",
		}
		return tx.Create(msg).Error
	})
}

func (s *PaymentService) RetryMessages() {
	msgs := s.db.Find("status = ?", "PENDING")
	for _, m := range msgs {
		if err := s.mq.Publish("payment_topic", m.Payload); err == nil {
			s.db.Model(m).Update("status", "SUCCESS")
		}
	}
}
```

</details>

### 2. TCC

适用于实时性要求更高、强一致性要求更强的业务场景。

<details>
<summary><strong>流程</strong></summary>

1. Try：预留资源，例如冻结余额
2. Confirm：正式提交，例如扣减冻结金额
3. Cancel：回滚资源，例如解冻余额

</details>

<details>
<summary><strong>账户表设计</strong></summary>

```sql
CREATE TABLE account (
    id          BIGINT PRIMARY KEY,
    balance     BIGINT NOT NULL DEFAULT 0,  -- 可用余额（分）
    frozen      BIGINT NOT NULL DEFAULT 0,  -- 冻结金额（分）
    version     BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT chk_balance CHECK (balance >= 0),
CONSTRAINT chk_frozen CHECK (frozen >= 0)
);
```

</details>

<details>
<summary><strong>Go 伪代码</strong></summary>

```go
type PaymentTCC interface {
	Try(ctx context.Context, orderID string, amount int64) error
	Confirm(ctx context.Context, orderID string, amount int64) error
	Cancel(ctx context.Context, orderID string, amount int64) error
}

// Try：检查余额充足，将 amount 从可用余额转入冻结
func (a *AccountService) Try(ctx context.Context, orderID string, amount int64) error {
	result := a.db.ExecContext(ctx,
		`UPDATE account SET balance = balance - ?, frozen = frozen + ?, version = version + 1
		 WHERE id = ? AND balance >= ?`,
		amount, amount, a.accountID, amount,
	)
	if result.RowsAffected == 0 {
		return ErrInsufficientBalance
	}
	return nil
}

// Confirm：扣减冻结金额，交易完成
func (a *AccountService) Confirm(ctx context.Context, orderID string, amount int64) error {
	result := a.db.ExecContext(ctx,
		`UPDATE account SET frozen = frozen - ?, version = version + 1
		 WHERE id = ? AND frozen >= ?`,
		amount, a.accountID, amount,
	)
	if result.RowsAffected == 0 {
		return ErrConfirmFailed
	}
	return nil
}

// Cancel：将冻结金额退回可用余额
func (a *AccountService) Cancel(ctx context.Context, orderID string, amount int64) error {
	result := a.db.ExecContext(ctx,
		`UPDATE account SET balance = balance + ?, frozen = frozen - ?, version = version + 1
		 WHERE id = ? AND frozen >= ?`,
		amount, amount, a.accountID, amount,
	)
	if result.RowsAffected == 0 {
		return ErrCancelFailed
	}
	return nil
}
```

> 关键点：Try 阶段只冻结不扣减，Confirm 只操作冻结列，Cancel 把冻结退回可用。三个操作都必须做幂等校验（通常用 TCC 事务日志表记录阶段状态）。

</details>

### 3. 三个必须说出的关键词

<details>
<summary><strong>幂等性</strong></summary>

> 分布式事务里重试是常态，必须通过 `business_id`、唯一索引或幂等表保证结果只执行一次。

</details>

<details>
<summary><strong>空回滚与悬挂</strong></summary>

> TCC 中要支持空回滚，也要防止 Cancel 执行完之后 Try 才到达造成悬挂。

</details>

<details>
<summary><strong>对账</strong></summary>

> 再完美的技术方案也不能替代对账。对账是支付系统最后一道资金安全防线。

</details>

---

## 八、MySQL 高并发与热点更新

### 对应资料导航

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [database/sql：连接池与事务](/golang/guide/source-reading/database-sql)
- [database/sql：高级事务与批量插入](/golang/guide/source-reading/database-sql-advanced)

热点账户是支付场景里的典型难题，例如大商户、直播间、平台主账户。

### 1. 常见挑战

- 大量并发更新同一行
- 行锁竞争严重
- 长事务导致锁持有时间过长
- 死锁和回滚重试频繁

### 2. 常见答法

可以按以下逻辑组织：

- 把余额更新放在事务后段，缩短锁持有时间
- 中低并发场景下用乐观锁
- 极高并发场景下引入热点拆分
- 通过分库分表和冷热分离降低单表压力

### 3. 热点账户的高阶方案

<details>
<summary><strong>缓冲入账</strong></summary>

先把入账请求写入高性能队列（Redis List / Kafka），再微批异步更新余额。核心是"流水先落盘，余额后更新"。

```go
// 1. 入账写入 Redis（毫秒级）
func (s *AccountService) BufferedCredit(ctx context.Context, accountID string, amount int64) error {
    return s.redis.RPush(ctx, "credit_buf:"+accountID, amount).Err()
}

// 2. 定时微批聚合（每 50ms 或满 100 笔触发）
func (s *AccountService) FlushCredits(ctx context.Context, accountID string) error {
    vals, _ := s.redis.LRange(ctx, "credit_buf:"+accountID, 0, 99).Result()
    if len(vals) == 0 {
        return nil
    }
    total := sumAmounts(vals)
    s.db.Exec("UPDATE account SET balance = balance + ? WHERE id = ?", total, accountID)
    s.redis.LTrim(ctx, "credit_buf:"+accountID, int64(len(vals)), -1)
    return nil
}
```

</details>

<details>
<summary><strong>影子账户拆分</strong></summary>

拆成 N 个子账户，写入时哈希打散，查询时 SUM 聚合。

```sql
-- 写入：hash 打散
UPDATE account_sub SET balance = balance + 100
WHERE parent_id = ? AND sub_index = #{orderID % 16};

-- 查询：聚合总余额
SELECT SUM(balance) FROM account_sub WHERE parent_id = ?;
```

> 拆分数量根据并发峰值决定，通常 8~64 个子账户即可。

</details>

<details>
<summary><strong>指令合并</strong></summary>

应用层短窗口聚合，10ms 内多笔合并为一次 UPDATE。

```go
type Merger struct {
    mu      sync.Mutex
    pending map[string]int64 // accountID -> 累计金额
}

func (m *Merger) Enqueue(accountID string, amount int64) {
    m.mu.Lock()
    m.pending[accountID] += amount
    m.mu.Unlock()
}

// 每 10ms 刷盘一次
func (m *Merger) Run(ctx context.Context) {
    ticker := time.NewTicker(10 * time.Millisecond)
    for range ticker.C {
        m.mu.Lock()
        batch := m.pending
        m.pending = make(map[string]int64)
        m.mu.Unlock()
        for id, total := range batch {
            db.Exec("UPDATE account SET balance = balance + ? WHERE id = ?", total, id)
        }
    }
}
```

</details>

---

## 九、Kafka 可靠性与顺序性

支付链路里 Kafka 承担异步解耦、削峰填谷和失败补偿的核心角色。关键考点包括消息不丢失（Producer/Broker/Consumer 三层兜底）、同一订单顺序性（Partition Key + 状态机）、积压治理（先止血再优化）。

> 完整展开请阅读 → [Kafka 专题](/kafka/)

---

## 十、支付网关与安全防御

### 1. 必备能力

- 所有支付请求加签验签
- 使用 `Nonce + Timestamp` 防重放
- 卡号脱敏、CVV 不落库
- 敏感密钥托管在 KMS 一类服务中

### 2. 常见追问

<details>
<summary><strong>如何防重放攻击？</strong></summary>

> 每个请求带随机 `Nonce` 和时间戳。服务端维护时间窗口校验，超时拒绝；同时记录已使用的 Nonce，重复直接拦截。

标准答题时建议补上“三层校验”：

1. 网关验签，确保请求体没有被篡改
2. 校验 `Timestamp` 是否在允许窗口内，例如 5 分钟
3. 用 Redis 记录 `Nonce`，`SET NX EX` 成功才放行

```go
func (g *Gateway) VerifyReplay(ctx context.Context, nonce string, ts int64, sign string, body []byte) error {
    if !g.verifySignature(sign, body) {
        return ErrInvalidSignature
    }
    if abs(time.Now().Unix()-ts) > 300 {
        return ErrTimestampExpired
    }
    ok, err := g.redis.SetNX(ctx, "replay:"+nonce, "1", 5*time.Minute).Result()
    if err != nil {
        return err
    }
    if !ok {
        return ErrReplayAttack
    }
    return nil
}
```

> 追问时可以再补一句：`Nonce` 要和商户号、请求路径一起组成幂等维度，避免不同接口之间误判冲突。

</details>

<details>
<summary><strong>如何防止并发重复支付？</strong></summary>

> 在网关层根据 `RequestID` 做幂等控制，结合 Redis 锁、订单状态机和数据库唯一键形成多层防线。

可以按“前端防抖 -> 网关拦截 -> 交易落库 -> 订单状态机”这个顺序展开：

- 前端按钮置灰，避免用户连续点击
- 网关按 `RequestID` 或 `BusinessID` 做短周期幂等
- 订单表对 `merchant_id + order_id + pay_action` 建唯一索引
- 状态机只允许 `INIT -> PAYING -> SUCCESS/FAILED` 单向流转

```sql
ALTER TABLE payment_order
ADD UNIQUE KEY uk_pay_req (merchant_id, order_id, pay_action);
```

> 重点要说明：Redis 锁负责挡高并发洪峰，数据库唯一键和状态机负责最终正确性。

</details>

---

## 十一、云原生与 AWS 实践

如果 JD 明确提到 AWS，可以补充以下内容：

- 用 ELB 做流量接入
- 用 Auto Scaling 应对突发流量
- 用 AWS KMS 管理密钥
- 用 Terraform 管理基础设施
- 用多可用区架构提高容灾能力

示例表达：

> 在 AWS 环境里，我会把支付系统的弹性和安全分开看。弹性上通过 ELB 和 Auto Scaling 吃住突发流量，安全上通过 KMS 做密钥管理，避免敏感密钥散落在配置文件中。

---

## 十二、全链路压测与可观测性

### 对应资料导航

- [Prometheus Go 客户端](/golang/guide/source-reading/prometheus-go)
- [OpenTelemetry Go：分布式追踪](/golang/guide/source-reading/opentelemetry-go)
- [log/slog：结构化日志](/golang/guide/source-reading/log-slog)
- [runtime/pprof：性能剖析](/golang/guide/source-reading/runtime-pprof)

### 1. 全链路压测

可以这样表达：

> 大促场景不能只做接口压测，而要做全链路压测。核心是生产环境采样、流量染色和影子资源隔离，确保压测流量能完整穿透网关、服务、缓存和数据库，但又不污染真实账务数据。

回答时最好把实施步骤也补全：

1. 按真实流量模型准备压测脚本，覆盖下单、支付、回调、查询全链路
2. 给压测请求打统一流量标记，例如 Header、TraceTag、影子商户号
3. 缓存、MQ、数据库全部隔离到影子资源池，绝不混写真实账务
4. 指标看四类：成功率、P99、下游超时率、数据库锁等待
5. 压测结束后做容量回归，得到单机极限、集群极限和安全冗余

> 如果是支付系统，必须强调“压测流量不落真实账、不触发真实结算、不触发真实通知”。

### 2. 可观测性

建议从三位一体来讲：

- Metrics：QPS、成功率、P99、CPU、内存
- Logging：全生命周期业务日志
- Tracing：跨服务耗时定位

关键词可带上：

- Prometheus
- Grafana
- OpenTelemetry
- ELK
- Jaeger

补充一个更完整的答题模板：

> 我的可观测性设计会围绕“先发现、再定位、能追责”三件事。发现靠指标告警，定位靠 Trace 和结构化日志，追责靠完整审计链路。对支付链路，我会给每笔交易打统一 `trace_id`、`order_id`、`merchant_id`，确保一笔单从网关到渠道到账务可以串起来看。

---

## 十三、零停机数据迁移

支付系统重构中，数据迁移是高频考题。

### 双写迁移四步法

1. 双写：新老库同时写
2. 历史迁移：迁存量数据
3. 数据校验：核对一致性
4. 灰度切流：逐步切读、切写

<details>
<summary><strong>高频追问：双写期间如何防止新老库不一致？</strong></summary>

> 不能假设双写天然一致，必须把“双写失败”视为常态来设计。我的做法是“主链路单写成功 + 异步补偿双写 + 对账校验兜底”。

建议从三层回答：

- 主事实源只能有一个，通常先写主库，副库失败记补偿任务
- 双写必须带同一个 `BusinessID`，副库也做幂等，避免补偿重放
- 定时校验新老库行数、金额、状态差异，发现偏差自动修复或人工介入

```text
写主库成功 -> 写新库失败 -> 记录补偿任务 -> 异步重试 -> 校验脚本对比 -> 修复闭环
```

</details>

<details>
<summary><strong>高频追问：切流时怎么回滚？</strong></summary>

> 切流必须是可逆的。读流量先灰度，写流量最后切；每一步都保留回滚开关。如果新链路指标异常，立刻把读写切回老链路，补偿期间产生的数据再通过校验脚本回补。

示例表达：

> 支付系统的数据迁移不能靠一次性切换完成，我通常采用双写迁移法，先让增量数据同时进入新老链路，再迁历史数据，最后通过校验脚本和灰度放量完成切换。

</details>

---

## 十四、支付业务中台化

### 对应资料导航

- [架构师学习路线](/architecture/architect-learning-roadmap)
- [架构能力自检准备清单](/architecture/architect-interview-prep-checklist)

这部分能明显拉开和普通后端的差距。

### 核心思路

能力下沉，配置外置，共性抽象。

### 中台常见模块

- 收银台服务
- 支付路由
- 账务中心
- 清结算中心
- 风控中心

### 表达示例

> 支付业务中台化的目标不是把所有逻辑堆到一起，而是抽离稳定的共性能力，让业务场景快速接入。比如交易域变化快，账务域必须极稳，两者之间通过领域事件解耦。

---

## 十五、支付领域 DDD 与领域拆分

### 对应资料导航

- [架构师学习路线](/architecture/architect-learning-roadmap)
- [架构能力自检准备清单](/architecture/architect-interview-prep-checklist)

如果讨论深入到架构层，可以从限界上下文切入：

| 领域 | 主要职责 |
| --- | --- |
| 交易域 | 支付意图、收银台、订单状态 |
| 账务域 | 记账、余额、资产变动 |
| 清算域 | 与外部渠道做资金核对与映射 |
| 风控域 | 交易风险判断与拦截 |

表达示例：

> 我会坚持动静分离。交易域是变化快的，支撑活动、营销、支付方式扩展；账务域是变化慢的，必须极度稳定。支付成功后由交易域发出领域事件，账务域异步订阅并完成记账，从而解耦主流程。

---

## 十六、风控规则引擎

### 对应资料导航

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [go-redis：客户端与分布式锁](/golang/guide/source-reading/go-redis)
- [net/http 限流与熔断](/golang/guide/source-reading/net-http-ratelimit)

支付系统必须具备“免疫系统”。

### 常见风控能力

| 能力 | 说明 |
| --- | --- |
| 滑动窗口频控 | 用 Redis ZSET 按时间戳统计窗口内事件数，超阈值拦截 |
| 黑白名单 | 用户/设备/IP/卡号维度，命中黑名单直接拒绝，白名单跳过风控 |
| 风险评分 | 综合用户画像、交易特征等多维度计算风险分，高分触发人审或拦截 |
| 设备指纹 | 采集设备硬件/软件特征生成唯一 ID，识别换设备、模拟器等异常行为 |
| 实时规则脚本 | 用 Lua/Groovy/CEL 等脚本引擎执行动态规则，支持热更新无需发版 |

### 高频答法

<details>
<summary><strong>如何统计“用户过去 10 分钟支付频次”？</strong></summary>

> 我会用 Redis ZSET 维护时间窗口内的事件，按时间戳清理窗口外数据，再做实时计数，满足低延迟风控判断需求。

```go
func (r *RiskService) CountUserPayments(ctx context.Context, userID string, now int64) (int64, error) {
    key := "risk:payfreq:" + userID
    minScore := "0"
    maxScore := strconv.FormatInt(now-600, 10)

    pipe := r.redis.TxPipeline()
    pipe.ZRemRangeByScore(ctx, key, minScore, maxScore)
    pipe.ZAdd(ctx, key, redis.Z{
        Score:  float64(now),
        Member: strconv.FormatInt(now, 10) + ":" + uuid.NewString(),
    })
    countCmd := pipe.ZCard(ctx, key)
    pipe.Expire(ctx, key, 15*time.Minute)
    if _, err := pipe.Exec(ctx); err != nil {
        return 0, err
    }
    return countCmd.Val(), nil
}
```

> 如果问题升级到“分商户、分设备、分 IP 联合频控”，就把 key 设计成不同维度组合，并统一走规则引擎判定阈值。

</details>

<details>
<summary><strong>如何兼顾复杂规则和低延迟？</strong></summary>

> 规则执行分层处理，简单规则走内存或 Redis 快速判断，复杂规则通过规则引擎或脚本执行，但必须限定单次执行成本。

一个更完整的回答是：

- 第一层是同步硬规则，例如黑名单、支付频次、单笔限额，要求毫秒级返回
- 第二层是同步评分规则，例如设备风险、IP 信誉、历史拒付率，要求几十毫秒内完成
- 第三层是异步策略，例如机器学习模型、人审、事后稽核，不阻塞主支付链路

> 这样拆层以后，主链路只承载“必须当场拦”的判断，复杂但不强依赖实时性的策略放到异步侧做，既能保证时延，也能保证风控覆盖。

</details>

---

## 十七、Go 网络编程与低延迟优化

### 对应资料导航

- [net/http：HTTP 实现](/golang/guide/source-reading/net-http)
- [net/http 服务端高级模式](/golang/guide/source-reading/net-http-server)
- [net/http Transport：连接池调优](/golang/guide/source-reading/net-http-transport)
- [net/http/httptrace：请求追踪](/golang/guide/source-reading/net-http-trace)
- [HTTP/2：多路复用与 Server Push](/golang/guide/source-reading/net-http2)

### 1. Netpoller

高频问法：

**Go 为什么能处理大量并发连接？**

可参考回答：

> Go 通过 Netpoller 把非阻塞 IO 与 goroutine 调度结合起来。协程发起 IO 后不会一直占用线程，而是挂起并由 epoll 监听。数据到达后再唤醒对应 goroutine，从而显著降低线程资源消耗。

如果要答得更深入，可以补这三点：

- 一个线程可以复用处理大量连接，避免“一连接一线程”的高切换成本
- goroutine 初始栈很小，连接数上来时内存模型更轻
- Runtime 会把网络事件、定时器和调度器协同起来，减少空转和阻塞传播

> 支付网关里大量请求都在等下游渠道响应，这类 IO 密集场景特别适合 Go 的这套模型。

### 2. 更深入的优化点

- **减少 Context Switch**：控制 goroutine 数量（用 worker pool），避免过多 goroutine 竞争 P，减少调度开销。`GOMAXPROCS` 设为 CPU 核数。
- **关注 false sharing**：多核 CPU 中，不同核心修改同一 cache line 内的不同变量会导致缓存行反复失效。解决方案是用 padding 对齐，让热点变量独占 cache line（通常 64 字节）。
- **合理做内存对齐**：Go struct 字段按类型大小从大到小排列可减少 padding 浪费。用 `unsafe.Sizeof` 验证。高频访问的字段放在 struct 开头，利用 CPU 缓存局部性。
- **大包场景下考虑零拷贝**：传统 IO 需要内核态 → 用户态 → 内核态多次拷贝。大文件/大包场景下用 `sendfile` / `splice` 系统调用减少拷贝次数，Go 中 `io.Copy` 在底层已优化支持。

---

## 十八、跨境支付与汇率风险

这部分是跨境支付体系里的业务深水区。

### 1. 常见挑战

<details>
<summary><strong>动态货币转换（DCC）怎么答？</strong></summary>

> 用户用本币支付，商户以目标币种结算。关键是在收银台展示汇率和转换后金额，用户确认后锁定汇率。DCC 的利润来自汇率加点，合规要求必须明示。

</details>

<details>
<summary><strong>汇率锁定怎么答？</strong></summary>

> 从用户确认支付到渠道实际扣款之间有时间差，汇率可能波动。方案是"支付瞬间锁定汇率快照"，记录汇率 ID + 有效期（通常 15~30 分钟），过期需重新获取。

</details>

<details>
<summary><strong>汇损归属怎么答？</strong></summary>

> 锁定汇率与实际清算汇率之间的差异产生汇损。需要明确约定：谁承担汇损？通常平台侧承担锁汇期内的波动风险，超出锁汇期的由业务方承担。汇损计入财务报表的"汇兑损益"科目。

</details>

<details>
<summary><strong>多币种账务模型怎么答？</strong></summary>

> 账务系统必须支持多币种。每笔流水同时记录：原币种金额、目标币种金额、汇率 ID。账户余额按币种隔离，不同币种不能直接加减。

```sql
-- 多币种流水表
CREATE TABLE payment_flow (
    id            BIGINT PRIMARY KEY,
    order_id      VARCHAR(64) NOT NULL,
    src_currency  CHAR(3) NOT NULL,     -- 原币种 USD
    src_amount    BIGINT NOT NULL,       -- 原币种金额（最小单位）
    dst_currency  CHAR(3) NOT NULL,     -- 目标币种 CNY
    dst_amount    BIGINT NOT NULL,       -- 目标币种金额
    exchange_rate_id VARCHAR(32),        -- 汇率快照 ID
    rate_value    DECIMAL(18,8),         -- 锁定汇率值
    created_at    TIMESTAMP NOT NULL
);
```

</details>

### 2. 表达示例

> 跨境支付的难点不只是技术链路，而是汇率和账务的复杂性。我会在支付瞬间做汇率锁定，并在资金流水里同时记录原币种金额、目标币种金额和汇率 ID，方便后续审计和汇损分析。

---

## 十九、热点账户与高并发账务处理

这是复杂支付系统讨论中的深水区。

### 常见高阶方案

- 缓冲入账
- 微批处理
- 子账户打散
- 应用层指令合并

### 表达示例

> 对极端热点账户，我不会执着于每一笔实时更新总余额，而是优先保证流水持久化，再通过异步聚合更新余额，减少数据库热点行冲突。

---

## 二十、复式记账与对账体系

支付核心不是“改余额”，而是“记账和核账”。

### 1. 复式记账

关键原则：

- 每一笔交易都有完整分录
- 借贷必须平衡
- 余额是流水累加结果，而不是单独事实源

### 2. 三级对账体系

| 层级 | 目标 |
| --- | --- |
| 实时对账 | 支付回调即刻校验 |
| 准实时对账 | 每小时或更短周期做渠道比对 |
| 日终全量对账 | 用渠道账单和内部流水做最终核账 |

### 3. 表达示例

> 我会把对账视为最后一道防线。技术上可以尽可能降低不一致概率，但支付系统最终还是要靠对账发现长款、短款和掉单问题，再通过补账流程闭环。

---

## 二十一、常见压力问题

### 1. 数据库事务提交成功，但 MQ 发送失败怎么办？

建议答法：

> 这是典型的一致性问题。我会优先采用本地消息表方案，让事务提交和消息记录同库原子化。如果追求更高性能，也可以基于 Binlog CDC 订阅业务变更，再异步触发下游流程，实现业务逻辑与消息发送解耦。

进一步展开时，建议把处理闭环讲完整：

1. 本地事务里同时写业务表和消息表
2. 投递失败不回滚业务，而是把消息保留在 `PENDING`
3. 后台任务按重试次数、退避时间扫描补发
4. 超过阈值进入死信或告警，由人工排查

> 关键点不是“立刻发出去”，而是“业务成功后消息不能永久丢失”。

### 2. 大促期间系统扛不住了，报错给用户和资金可能不一致二选一，你怎么选？

建议答法：

> 我两个都不选。我会通过降级和异步化守住资金底线。非核心逻辑先降级，核心账务链路优先保活；如果实时入账压力过大，就先保证流水持久化，再异步平账。支付行业里，资损是底线，可用性是生命线，两者都不能轻易放弃。

面试里再往下讲，可以补一个处置优先级：

1. 先限流和熔断非核心能力，例如营销、推荐、画像
2. 核心链路只保留下单、扣款、订单查询、回调处理
3. 对外提示“支付结果确认中”，避免直接误报失败
4. 启动轮询、对账和补偿任务，把不确定订单收口

> 这道题真正考的是取舍能力。标准答案不是牺牲一致性，而是把不确定状态显式化，先保住资金正确，再恢复用户体验。

---

## 二十二、速查 Check-list

### 1. 项目经历

- 准备一个架构重构案例
- 准备一个线上事故处理案例
- 准备一个性能优化案例
- 准备一个大促保障案例

### 2. 技术点速记

- 2PC、TCC、本地消息表优缺点
- Kafka 消息不丢失和顺序性方案
- MySQL 热点更新与死锁处理
- `context`、`sync.Mutex`、`RWMutex` 源码要点
- Go Runtime 的 GC 和 GMP 机制

### 3. 业务点速记

- **清算和结算的区别**
  清算是“算账”，核心是确认交易结果、轧差和应收应付；结算是“打钱”，核心是实际资金划拨和账户余额变化。面试里一句话就够：清算解决“谁该给谁多少钱”，结算解决“钱什么时候真正转过去”。
- **长款、短款、掉单含义**
  长款是渠道有、本地无，说明外部已扣款但本地没记账；短款是本地有、渠道无，说明本地记成功但外部其实没扣到；掉单通常是订单长时间停在中间态，渠道和本地状态不一致。处理上都不能靠人工猜，最终要靠对账 + 补账流程闭环。
- **跨境支付汇率锁定**
  用户确认支付到渠道实际扣款之间存在时间差，所以要在支付时锁定汇率快照，并记录汇率 ID、有效期、原币种金额和目标币种金额。这样后面即使汇率波动，也能明确谁承担汇损，并保证审计可追溯。
- **单元化与异地多活**
  单元化是把用户或商户按规则路由到固定单元，目标是“流量就近、故障隔离、局部扩容”；异地多活是多个机房同时提供服务，目标是“机房故障时业务不停”。一句话区分：单元化更强调日常流量治理和隔离，异地多活更强调跨机房容灾和连续性。

如果想答得更像业务架构师，可以再补一句：

- 清算 / 结算考的是账务理解
- 长款 / 短款 / 掉单考的是异常闭环
- 汇率锁定考的是跨境支付和财务合规
- 单元化 / 异地多活考的是流量治理和容灾架构

常见追问可以直接这样答：

- **如果面试官追问：长款和短款怎么处理？**
  先对账确认事实，再按资金方向走补账或冲正流程。长款通常要补记本地账务，短款通常要确认是否需要冲正、退款或人工核查，核心原则是先保证资金事实清楚，再推进状态修复。
- **如果追问：掉单为什么危险？**
  因为掉单最大的问题不是“失败了”，而是“结果不确定”。用户可能已经扣钱，但系统还显示支付中。如果处理不好，会同时伤害资金正确性和用户体验，所以一定要靠通知、轮询、对账、补偿一起收口。
- **如果追问：汇率锁定为什么不能只存一个金额？**
  因为跨境支付后续要做清算、结算、对账、审计和汇损分析，只存一个金额无法还原当时的业务事实。至少要保留原币种金额、目标币种金额、汇率值、汇率快照 ID 和锁定时间。
- **如果追问：单元化和异地多活怎么结合？**
  我的理解是单元化负责把流量尽量固定在本地单元内，平时就减少跨机房调用；异地多活负责在单元或机房故障时接住流量。前者偏日常治理，后者偏故障切换，两者结合才能既稳又省。

如果要把这 4 个点压缩成 30 秒回答，可以直接说：

> 业务侧我会重点补四块认知：第一是清算和结算，一个是算账，一个是打钱；第二是长款、短款、掉单，这些都要靠对账和补账闭环；第三是跨境支付的汇率锁定，要保留汇率快照和多币种流水；第四是单元化和异地多活，一个解决日常流量隔离，一个解决跨机房容灾。

---

## 二十三、最后建议

### 1. 准备一个“战役故事”

最好是下面这类：

- 双十一 / 春节保障
- 线上支付故障恢复
- 交易链路性能治理
- 数据迁移零故障切换

建议按 STAR 结构表达：

1. 背景
2. 任务
3. 行动
4. 结果

### 2. 练习手画架构图

至少要能快速画出：

```text
网关 -> 交易中心 -> 账务中心 -> 清结算中心 -> 渠道网关 -> 银行 / 三方
```

### 3. 可继续延展的问题

这个问题比较加分：

> 目前公司的跨境支付链路中，多币种实时汇率结算和掉单自动补偿机制，主要依赖分布式事务框架，还是已经建设了专门的风险运营或清结算中台能力？

这个问题能体现你对业务复杂度和体系化建设的理解。

---

## 二十四、冲刺阅读建议

如果时间只够冲刺，建议按优先级看：

| 优先级 | 建议内容 |
| --- | --- |
| 高 | `context` 源码、GMP、GC、MySQL 锁、Kafka 可靠性 |
| 中 | TCC、本地消息表、对账体系、热点账户治理 |
| 中 | OpenTelemetry、Prometheus、压测体系 |
| 低 | AWS 细节、DynamoDB、Aurora、多可用区 |

如果还有精力，可以补看：

- `runtime/proc.go`
- `runtime/mgc.go`
- MySQL InnoDB 锁机制
- Raft 基本原理
- AWS Shared Responsibility Model

---

## 延伸阅读导航

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [架构师学习路线](/architecture/architect-learning-roadmap)
- [架构能力自检准备清单](/architecture/architect-interview-prep-checklist)
- [Go 学习路径与资料导航](/golang/learning-path)
- [Go 微服务可观测性与稳定性专题](/golang/guide/08-observability-resilience)
- [Go 安全编程专题](/golang/guide/10-security-practices)

---

## 总结

这类高并发支付系统讨论里，真正决定深度的通常不是背了多少八股，而是能不能同时体现三种能力：

- 技术深度：懂 Go、懂中间件、懂分布式一致性
- 业务深度：懂支付、懂账务、懂清结算、懂跨境
- 工程深度：懂大促保障、架构演进、风险控制和效率提升

如果只能记住一句话，那就是：

> 资损不能发生，状态可以延迟；流水必须可信，账务必须可追；系统必须可降级，但核心链路必须可恢复。
