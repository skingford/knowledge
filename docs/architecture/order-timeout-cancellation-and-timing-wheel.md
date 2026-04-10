---
title: 订单超时取消与时间轮设计
description: 从 30 分钟未支付自动取消切入，系统梳理延时消息、时间轮、状态机幂等与补偿兜底的分布式架构设计。
---

# 订单超时取消与时间轮设计

## 适合人群

- 需要设计订单、支付、库存等交易链路的后端工程师
- 准备系统设计面试或架构评审的开发者
- 想把“延时任务”从定时扫表升级为工程化架构方案的人

## 学习目标

- 理解“30 分钟未支付自动取消”背后的真实架构问题
- 能区分延时消息、Redis ZSet、时间轮在工程中的边界
- 掌握多机环境下防重、幂等、补偿和状态机设计

## 快速导航

- [问题背景：为什么不能靠扫表](#问题背景为什么不能靠扫表)
- [主流方案对比](#主流方案对比)
- [方案怎么选](#方案怎么选)
- [什么是时间轮](#什么是时间轮)
- [时间轮、最小堆、延时消息怎么区分](#时间轮最小堆延时消息怎么区分)
- [推荐的生产级架构](#推荐的生产级架构)
- [真正决定正确性的关键：数据库状态机](#真正决定正确性的关键数据库状态机)
- [多机环境下如何保证不重复取消](#多机环境下如何保证不重复取消)
- [时间轮在分布式订单场景中的正确定位](#时间轮在分布式订单场景中的正确定位)
- [工程风险与最佳实践](#工程风险与最佳实践)
- [Go 版实现骨架](#go-版实现骨架)
- [面试回答模板](#面试回答模板)
- [落地检查清单](#落地检查清单)
- [结论](#结论)

## 问题背景：为什么不能靠扫表

在电商、外卖、票务等系统中，“订单创建后 30 分钟未支付自动取消”是一个非常典型的延时任务场景。

很多系统在早期都会采用最直接的实现方式：写一个定时任务，每隔几秒扫一次订单表，把 `status = PENDING_PAY` 且 `expire_at < now()` 的订单找出来逐个关闭。这个方案在低并发阶段可以工作，但一旦订单量上来，问题会非常明显：

- 数据库需要承受高频轮询带来的额外 IO 和 CPU 压力
- 大部分扫描都是无效查询，只是在不断确认“还没到时间”
- 扫描频率越高，系统越重；扫描频率越低，过期精度越差
- 多机部署后还会遇到重复扫描、重复关闭和竞争更新问题

所以，这个问题的本质并不是“怎么更快扫表”，而是：

- 如何在未来某个时间点高效触发一条任务
- 如何保证任务结果正确，不误取消已经支付的订单
- 如何在节点重启、消息丢失、消费失败后恢复任务
- 如何在分布式环境里避免同一订单被重复处理

从这个角度看，“订单超时关闭”本质上是一个**延时事件触发 + 状态机校验 + 幂等执行 + 补偿恢复**的问题。

## 主流方案对比

工程上常见的实现路径大致有四种。

| 方案 | 实现方式 | 优点 | 缺点 | 适用场景 |
| --- | --- | --- | --- | --- |
| 定时扫表 | 周期查询超时未支付订单 | 实现最简单 | 数据库压力大、扩展性差 | 低并发或临时方案 |
| Redis ZSet | 用过期时间作为 score，轮询最早到期任务 | 性能优于扫表，实现灵活 | 需要自己处理恢复、防重和主从切换 | 中小规模系统 |
| 延时消息 | RocketMQ 延时消息、RabbitMQ TTL + DLX | 天然异步、适合分布式、链路清晰 | 依赖中间件能力，仍需幂等和补偿 | 主流生产方案 |
| 时间轮 | 用环形槽位管理未来任务 | 调度吞吐高，适合海量定时任务 | 只解决调度效率，不解决业务一致性 | 自研调度器、中间件内部 |

如果从业务系统落地角度来做推荐，通常结论会比较明确：

- 主方案优先选择 `延时消息`
- 如果需要自研高性能调度层，可以在内部使用 `时间轮`
- 无论采用哪种触发方式，最终都必须依赖 `数据库状态机 + 幂等控制 + 补偿机制`
- 定时扫表不适合作为主路径，但非常适合作为兜底路径

一句话概括就是：

> 延时触发负责效率，数据库状态机负责正确，补偿任务负责可靠。

## 方案怎么选

如果把这个问题放进真实业务里，选型通常不是“哪个技术最强”，而是“哪个组合最稳”。

<div class="mermaid-svg-wrapper">

<svg id="m17758337937540" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 1727.15625px;" viewBox="0 0 1727.15625 494" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337937540{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337937540 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337937540 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337937540 .error-icon{fill:#552222;}#m17758337937540 .error-text{fill:#552222;stroke:#552222;}#m17758337937540 .edge-thickness-normal{stroke-width:1px;}#m17758337937540 .edge-thickness-thick{stroke-width:3.5px;}#m17758337937540 .edge-pattern-solid{stroke-dasharray:0;}#m17758337937540 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337937540 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337937540 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337937540 .marker{fill:#666;stroke:#666;}#m17758337937540 .marker.cross{stroke:#666;}#m17758337937540 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337937540 p{margin:0;}#m17758337937540 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337937540 .cluster-label text{fill:#333;}#m17758337937540 .cluster-label span{color:#333;}#m17758337937540 .cluster-label span p{background-color:transparent;}#m17758337937540 .label text,#m17758337937540 span{fill:#000000;color:#000000;}#m17758337937540 .node rect,#m17758337937540 .node circle,#m17758337937540 .node ellipse,#m17758337937540 .node polygon,#m17758337937540 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337937540 .rough-node .label text,#m17758337937540 .node .label text,#m17758337937540 .image-shape .label,#m17758337937540 .icon-shape .label{text-anchor:middle;}#m17758337937540 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337937540 .rough-node .label,#m17758337937540 .node .label,#m17758337937540 .image-shape .label,#m17758337937540 .icon-shape .label{text-align:center;}#m17758337937540 .node.clickable{cursor:pointer;}#m17758337937540 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337937540 .arrowheadPath{fill:#333333;}#m17758337937540 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337937540 .flowchart-link{stroke:#666;fill:none;}#m17758337937540 .edgeLabel{background-color:white;text-align:center;}#m17758337937540 .edgeLabel p{background-color:white;}#m17758337937540 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337937540 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337937540 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337937540 .cluster text{fill:#333;}#m17758337937540 .cluster span{color:#333;}#m17758337937540 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337937540 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337937540 rect.text{fill:none;stroke-width:0;}#m17758337937540 .icon-shape,#m17758337937540 .image-shape{background-color:white;text-align:center;}#m17758337937540 .icon-shape p,#m17758337937540 .image-shape p{background-color:white;padding:2px;}#m17758337937540 .icon-shape .label rect,#m17758337937540 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337937540 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337937540 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337937540 .node .neo-node{stroke:#999;}#m17758337937540 [data-look="neo"].node rect,#m17758337937540 [data-look="neo"].cluster rect,#m17758337937540 [data-look="neo"].node polygon{stroke:url(#m17758337937540-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937540 [data-look="neo"].node path{stroke:url(#m17758337937540-gradient);stroke-width:1px;}#m17758337937540 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937540 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337937540 [data-look="neo"].node circle{stroke:url(#m17758337937540-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937540 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337937540 [data-look="neo"].icon-shape .icon{fill:url(#m17758337937540-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937540 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337937540-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937540 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337937540_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937540_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937540_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937540_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337937540_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937540_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937540_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937540_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937540_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937540_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937540_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337937540_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M196,209L200.167,209C204.333,209,212.667,209,220.333,209C228,209,235,209,238.5,209L242,209" id="m17758337937540-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTk2LCJ5IjoyMDl9LHsieCI6MjIxLCJ5IjoyMDl9LHsieCI6MjQ2LCJ5IjoyMDl9XQ==" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M436.106,145.106L452.255,128.755C468.404,112.404,500.702,79.702,545.518,63.351C590.333,47,647.667,47,705,47C762.333,47,819.667,47,872.333,47C925,47,973,47,1021,47C1069,47,1117,47,1145.833,47C1174.667,47,1184.333,47,1189.167,47L1194,47" id="m17758337937540-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6NDM2LjEwNTU5MDA2MjExMTgsInkiOjE0NS4xMDU1OTAwNjIxMTE4fSx7IngiOjUzMywieSI6NDd9LHsieCI6NzA1LCJ5Ijo0N30seyJ4Ijo4NzcsInkiOjQ3fSx7IngiOjEwMjEsInkiOjQ3fSx7IngiOjExNjUsInkiOjQ3fSx7IngiOjExOTgsInkiOjQ3fV0=" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M455.267,253.733L468.223,260.777C481.178,267.822,507.089,281.911,524.878,288.955C542.667,296,552.333,296,557.167,296L562,296" id="m17758337937540-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6NDU1LjI2NzIwNjQ3NzczMjc3LCJ5IjoyNTMuNzMyNzkzNTIyMjY3Mn0seyJ4Ijo1MzMsInkiOjI5Nn0seyJ4Ijo1NjYsInkiOjI5Nn1d" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M791.623,243.623L805.853,235.019C820.082,226.415,848.541,209.208,886.771,200.604C925,192,973,192,1021,192C1069,192,1117,192,1148.26,192C1179.521,192,1194.042,192,1201.302,192L1208.563,192" id="m17758337937540-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6NzkxLjYyMzE4ODQwNTc5NzEsInkiOjI0My42MjMxODg0MDU3OTcxfSx7IngiOjg3NywieSI6MTkyfSx7IngiOjEwMjEsInkiOjE5Mn0seyJ4IjoxMTY1LCJ5IjoxOTJ9LHsieCI6MTIxMi41NjI1LCJ5IjoxOTJ9XQ==" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M800.251,339.749L813.042,345.624C825.834,351.499,851.417,363.25,869.042,369.125C886.667,375,896.333,375,901.167,375L906,375" id="m17758337937540-L_D_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_F_0" data-points="W3sieCI6ODAwLjI1MDk5NjAxNTkzNjMsInkiOjMzOS43NDkwMDM5ODQwNjM3M30seyJ4Ijo4NzcsInkiOjM3NX0seyJ4Ijo5MTAsInkiOjM3NX1d" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1102.551,345.551L1112.959,341.793C1123.367,338.034,1144.184,330.517,1166.374,326.759C1188.565,323,1212.13,323,1223.913,323L1235.695,323" id="m17758337937540-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MTEwMi41NTEwMjA0MDgxNjM0LCJ5IjozNDUuNTUxMDIwNDA4MTYzMjV9LHsieCI6MTE2NSwieSI6MzIzfSx7IngiOjEyMzkuNjk1MzEyNSwieSI6MzIzfV0=" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1102.551,404.449L1112.959,408.207C1123.367,411.966,1144.184,419.483,1161.852,423.241C1179.521,427,1194.042,427,1201.302,427L1208.563,427" id="m17758337937540-L_F_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_H_0" data-points="W3sieCI6MTEwMi41NTEwMjA0MDgxNjM0LCJ5Ijo0MDQuNDQ4OTc5NTkxODM2NzV9LHsieCI6MTE2NSwieSI6NDI3fSx7IngiOjEyMTIuNTYyNSwieSI6NDI3fV0=" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1415.125,47L1419.292,47C1423.458,47,1431.792,47,1457.415,74.806C1483.037,102.611,1525.95,158.222,1547.406,186.028L1568.862,213.833" id="m17758337937540-L_C_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_I_0" data-points="W3sieCI6MTQxNS4xMjUsInkiOjQ3fSx7IngiOjE0NDAuMTI1LCJ5Ijo0N30seyJ4IjoxNTcxLjMwNTk5NjE5Mjg5MzQsInkiOjIxN31d" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1400.563,192L1407.156,192C1413.75,192,1426.938,192,1445.081,195.951C1463.225,199.902,1486.325,207.804,1497.875,211.754L1509.425,215.705" id="m17758337937540-L_E_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_I_0" data-points="W3sieCI6MTQwMC41NjI1LCJ5IjoxOTJ9LHsieCI6MTQ0MC4xMjUsInkiOjE5Mn0seyJ4IjoxNTEzLjIwOTQzNTA5NjE1MzgsInkiOjIxN31d" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1373.43,323L1384.546,323C1395.661,323,1417.893,323,1445.094,314.641C1472.296,306.282,1504.466,289.563,1520.551,281.204L1536.637,272.845" id="m17758337937540-L_G_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_I_0" data-points="W3sieCI6MTM3My40Mjk2ODc1LCJ5IjozMjN9LHsieCI6MTQ0MC4xMjUsInkiOjMyM30seyJ4IjoxNTQwLjE4NTkxNzcyMTUxOSwieSI6MjcxfV0=" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path><path d="M1400.563,427L1407.156,427C1413.75,427,1426.938,427,1454.703,401.513C1482.469,376.026,1524.812,325.051,1545.984,299.564L1567.156,274.077" id="m17758337937540-L_H_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_I_0" data-points="W3sieCI6MTQwMC41NjI1LCJ5Ijo0Mjd9LHsieCI6MTQ0MC4xMjUsInkiOjQyN30seyJ4IjoxNTY5LjcxMjA5MDE2MzkzNDQsInkiOjI3MX1d" data-look="classic" marker-end="url(#m17758337937540_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(877, 47)"><g class="label" data-id="L_B_C_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(533, 296)"><g class="label" data-id="L_B_D_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1021, 192)"><g class="label" data-id="L_D_E_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(877, 375)"><g class="label" data-id="L_D_F_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1165, 323)"><g class="label" data-id="L_F_G_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(1165, 427)"><g class="label" data-id="L_F_H_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_G_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_H_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337937540-flowchart-A-0" data-look="classic" transform="translate(102, 209)"><rect class="basic label-container" style="" x="-94" y="-27" width="188" height="54"></rect><g class="label" style="" transform="translate(-64, -12)"><rect></rect><foreignObject width="128" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单超时任务选型</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-B-1" data-look="classic" transform="translate(373, 209)"><polygon points="127,0 254,-127 127,-254 0,-127" class="label-container" transform="translate(-126.5, 127)"></polygon><g class="label" style="" transform="translate(-88, -24)"><rect></rect><foreignObject width="176" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>是否已有成熟 MQ<br>且希望天然支持分布式？</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-C-3" data-look="classic" transform="translate(1306.5625, 47)"><rect class="basic label-container" style="" x="-108.5625" y="-39" width="217.125" height="78"></rect><g class="label" style="" transform="translate(-78.5625, -24)"><rect></rect><foreignObject width="157.125" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>优先延时消息<br>RocketMQ / RabbitMQ</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-D-5" data-look="classic" transform="translate(705, 296)"><polygon points="139,0 278,-139 139,-278 0,-139" class="label-container" transform="translate(-138.5, 139)"></polygon><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>是否需要自研高吞吐调度层？</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-E-7" data-look="classic" transform="translate(1306.5625, 192)"><rect class="basic label-container" style="" x="-94" y="-27" width="188" height="54"></rect><g class="label" style="" transform="translate(-64, -12)"><rect></rect><foreignObject width="128" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>调度层使用时间轮</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-F-9" data-look="classic" transform="translate(1021, 375)"><polygon points="111,0 222,-111 111,-222 0,-111" class="label-container" transform="translate(-110.5, 111)"></polygon><g class="label" style="" transform="translate(-72, -24)"><rect></rect><foreignObject width="144" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>规模是否中等<br>且更看重实现简单？</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-G-11" data-look="classic" transform="translate(1306.5625, 323)"><rect class="basic label-container" style="" x="-66.8671875" y="-27" width="133.734375" height="54"></rect><g class="label" style="" transform="translate(-36.8671875, -12)"><rect></rect><foreignObject width="73.734375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Redis ZSet</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-H-13" data-look="classic" transform="translate(1306.5625, 427)"><rect class="basic label-container" style="" x="-94" y="-27" width="188" height="54"></rect><g class="label" style="" transform="translate(-64, -12)"><rect></rect><foreignObject width="128" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>定时扫表只做兜底</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937540-flowchart-I-15" data-look="classic" transform="translate(1592.140625, 244)"><rect class="basic label-container" style="" x="-127.015625" y="-27" width="254.03125" height="54"></rect><g class="label" style="" transform="translate(-97.015625, -12)"><rect></rect><foreignObject width="194.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>数据库条件更新 + 补偿扫描</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337937540-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337937540-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337937540-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

可以直接按下面的经验法则来判断：

- 如果系统已经有成熟 MQ 体系，优先用 `延时消息`
- 如果要自研一个高吞吐延时调度器，优先考虑 `时间轮`
- 如果规模中等、团队更重视实现简单，可以选择 `Redis ZSet`
- 如果只是兜底恢复，不要抗拒 `低频扫表`

对多数订单系统来说，最推荐的组合不是单选，而是：

- 主路径：`延时消息`
- 核心一致性：`数据库条件更新`
- 兜底恢复：`补偿扫表`

## 时间轮、最小堆、延时消息怎么区分

很多人第一次接触这个话题时，容易把“时间轮”“最小堆”“延时消息”放在同一个层面比较。实际上，这三者的定位并不完全相同：

| 方案 | 核心定位 | 典型复杂度 | 是否天然持久化 | 是否天然支持分布式 | 典型适用场景 |
| --- | --- | --- | --- | --- | --- |
| 时间轮 | 高性能调度算法 | 插入和调度均摊成本低 | 否 | 否 | 中间件内部、自研调度器、海量短周期任务 |
| 最小堆 | 通用定时任务数据结构 | 插入/删除通常为 `O(logN)` | 否 | 否 | 任务量中等、时间精度要求高的本地调度 |
| 延时消息 | 业务层异步触发方案 | 依赖中间件实现 | 一般较强 | 是 | 订单超时、通知、异步解耦、跨服务事件 |

可以把它们理解成两层：

- 算法层：`时间轮`、`最小堆`
- 架构层：`延时消息`

它们之间并不是完全替代关系。例如，一个延时消息系统的内部实现，也完全可能采用时间轮或最小堆来管理到期任务。

因此更准确的理解应该是：

- 如果你在设计“业务系统怎么触发订单超时”，你在做的是架构选型
- 如果你在设计“调度器内部怎么管理百万级定时任务”，你在做的是算法与数据结构选型

## 什么是时间轮

时间轮（Timing Wheel）是一种高性能定时任务调度算法，可以把它想象成一个时钟。

- 整个轮盘被划分为多个槽位（Bucket）
- 每个槽位代表一个时间单位，例如 1 秒
- 指针按固定频率向前移动
- 每个槽位下面挂着一组任务
- 指针扫到槽位时，就触发该槽位上的任务

例如，一个 60 槽的时间轮、每个槽位表示 1 秒，那么一圈就是 60 秒。如果一个任务需要在 10 秒后执行，就可以挂到当前槽位前方第 10 个位置，等指针转到那里时触发。

### 跨圈问题

如果任务延时超过一圈，例如轮盘一圈 60 秒，但任务 30 分钟后才执行，常见做法有两种：

- `Round 计数法`
  - 任务除了记录落槽位置外，还记录剩余圈数
  - 指针每次扫到对应槽位时，先把圈数减一
  - 只有 `round == 0` 时才真正执行
- `分层时间轮`
  - 用秒轮、分轮、时轮分层管理任务
  - 长延时任务先放高层轮盘，接近触发时间时再逐层下沉

### 时间轮的优势

相较于反复扫描整个任务集合，时间轮最大的价值在于把“按时间查找任务”转化成“按槽位触发任务”，因此：

- 不需要全量遍历待执行任务
- 任务插入和调度的均摊成本低
- 非常适合海量短期延时任务
- 调度层可以主要依赖内存完成，吞吐很高

### 时间轮的边界

时间轮解决的是“如何高效找到到期任务”，而不是“如何保证业务执行一定正确”。它并不天然解决：

- 任务持久化
- 服务重启后的任务恢复
- 多机环境下重复执行
- 支付与取消并发竞争
- 下游子流程失败后的补偿

因此在业务系统里，时间轮更准确的定位应该是：

> 时间轮是一种高性能调度结构，不是分布式一致性方案。

## 推荐的生产级架构

对于“订单 30 分钟未支付自动取消”这个场景，一个比较稳妥的生产级架构通常如下：

<div class="mermaid-svg-wrapper">

<svg id="m17758337938161" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 731.6953125px;" viewBox="0 0 731.6953125 1254" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337938161{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337938161 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337938161 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337938161 .error-icon{fill:#552222;}#m17758337938161 .error-text{fill:#552222;stroke:#552222;}#m17758337938161 .edge-thickness-normal{stroke-width:1px;}#m17758337938161 .edge-thickness-thick{stroke-width:3.5px;}#m17758337938161 .edge-pattern-solid{stroke-dasharray:0;}#m17758337938161 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337938161 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337938161 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337938161 .marker{fill:#666;stroke:#666;}#m17758337938161 .marker.cross{stroke:#666;}#m17758337938161 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337938161 p{margin:0;}#m17758337938161 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337938161 .cluster-label text{fill:#333;}#m17758337938161 .cluster-label span{color:#333;}#m17758337938161 .cluster-label span p{background-color:transparent;}#m17758337938161 .label text,#m17758337938161 span{fill:#000000;color:#000000;}#m17758337938161 .node rect,#m17758337938161 .node circle,#m17758337938161 .node ellipse,#m17758337938161 .node polygon,#m17758337938161 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337938161 .rough-node .label text,#m17758337938161 .node .label text,#m17758337938161 .image-shape .label,#m17758337938161 .icon-shape .label{text-anchor:middle;}#m17758337938161 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337938161 .rough-node .label,#m17758337938161 .node .label,#m17758337938161 .image-shape .label,#m17758337938161 .icon-shape .label{text-align:center;}#m17758337938161 .node.clickable{cursor:pointer;}#m17758337938161 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337938161 .arrowheadPath{fill:#333333;}#m17758337938161 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337938161 .flowchart-link{stroke:#666;fill:none;}#m17758337938161 .edgeLabel{background-color:white;text-align:center;}#m17758337938161 .edgeLabel p{background-color:white;}#m17758337938161 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337938161 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337938161 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337938161 .cluster text{fill:#333;}#m17758337938161 .cluster span{color:#333;}#m17758337938161 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337938161 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337938161 rect.text{fill:none;stroke-width:0;}#m17758337938161 .icon-shape,#m17758337938161 .image-shape{background-color:white;text-align:center;}#m17758337938161 .icon-shape p,#m17758337938161 .image-shape p{background-color:white;padding:2px;}#m17758337938161 .icon-shape .label rect,#m17758337938161 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337938161 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337938161 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337938161 .node .neo-node{stroke:#999;}#m17758337938161 [data-look="neo"].node rect,#m17758337938161 [data-look="neo"].cluster rect,#m17758337938161 [data-look="neo"].node polygon{stroke:url(#m17758337938161-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938161 [data-look="neo"].node path{stroke:url(#m17758337938161-gradient);stroke-width:1px;}#m17758337938161 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938161 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337938161 [data-look="neo"].node circle{stroke:url(#m17758337938161-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938161 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337938161 [data-look="neo"].icon-shape .icon{fill:url(#m17758337938161-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938161 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337938161-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938161 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337938161_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938161_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938161_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938161_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337938161_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938161_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938161_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938161_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938161_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938161_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938161_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337938161_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M249.492,62L249.492,66.167C249.492,70.333,249.492,78.667,249.492,86.333C249.492,94,249.492,101,249.492,104.5L249.492,108" id="m17758337938161-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MjQ5LjQ5MjE4NzUsInkiOjYyfSx7IngiOjI0OS40OTIxODc1LCJ5Ijo4N30seyJ4IjoyNDkuNDkyMTg3NSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M187.492,162.328L174.792,167.107C162.091,171.885,136.69,181.443,123.99,189.721C111.289,198,111.289,205,111.289,208.5L111.289,212" id="m17758337938161-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTg3LjQ5MjE4NzUsInkiOjE2Mi4zMjc5ODE5MTA2ODR9LHsieCI6MTExLjI4OTA2MjUsInkiOjE5MX0seyJ4IjoxMTEuMjg5MDYyNSwieSI6MjE2fV0=" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M311.492,162.328L324.193,167.107C336.893,171.885,362.294,181.443,374.995,193.721C387.695,206,387.695,221,387.695,228.5L387.695,236" id="m17758337938161-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MzExLjQ5MjE4NzUsInkiOjE2Mi4zMjc5ODE5MTA2ODR9LHsieCI6Mzg3LjY5NTMxMjUsInkiOjE5MX0seyJ4IjozODcuNjk1MzEyNSwieSI6MjQwfV0=" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M387.695,294L387.695,302.167C387.695,310.333,387.695,326.667,387.695,338.333C387.695,350,387.695,357,387.695,360.5L387.695,364" id="m17758337938161-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6Mzg3LjY5NTMxMjUsInkiOjI5NH0seyJ4IjozODcuNjk1MzEyNSwieSI6MzQzfSx7IngiOjM4Ny42OTUzMTI1LCJ5IjozNjh9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M387.695,470L387.695,474.167C387.695,478.333,387.695,486.667,397.414,494.751C407.132,502.835,426.568,510.67,436.286,514.587L446.005,518.505" id="m17758337938161-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6Mzg3LjY5NTMxMjUsInkiOjQ3MH0seyJ4IjozODcuNjk1MzEyNSwieSI6NDk1fSx7IngiOjQ0OS43MTQ1NDMyNjkyMzA4LCJ5Ijo1MjB9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M516.695,574L516.695,578.167C516.695,582.333,516.695,590.667,516.695,598.333C516.695,606,516.695,613,516.695,616.5L516.695,620" id="m17758337938161-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6NTE2LjY5NTMxMjUsInkiOjU3NH0seyJ4Ijo1MTYuNjk1MzEyNSwieSI6NTk5fSx7IngiOjUxNi42OTUzMTI1LCJ5Ijo2MjR9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M516.695,702L516.695,706.167C516.695,710.333,516.695,718.667,516.695,726.333C516.695,734,516.695,741,516.695,744.5L516.695,748" id="m17758337938161-L_G_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_H_0" data-points="W3sieCI6NTE2LjY5NTMxMjUsInkiOjcwMn0seyJ4Ijo1MTYuNjk1MzEyNSwieSI6NzI3fSx7IngiOjUxNi42OTUzMTI1LCJ5Ijo3NTJ9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M516.695,806L516.695,810.167C516.695,814.333,516.695,822.667,516.695,830.333C516.695,838,516.695,845,516.695,848.5L516.695,852" id="m17758337938161-L_H_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_I_0" data-points="W3sieCI6NTE2LjY5NTMxMjUsInkiOjgwNn0seyJ4Ijo1MTYuNjk1MzEyNSwieSI6ODMxfSx7IngiOjUxNi42OTUzMTI1LCJ5Ijo4NTZ9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M482.372,955.677L469.886,967.564C457.401,979.451,432.429,1003.226,419.943,1020.613C407.457,1038,407.457,1049,407.457,1054.5L407.457,1060" id="m17758337938161-L_I_J_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_J_0" data-points="W3sieCI6NDgyLjM3MjM3MTk4MDg0NzgsInkiOjk1NS42NzcwNTk0ODA4NDc4fSx7IngiOjQwNy40NTcwMzEyNSwieSI6MTAyN30seyJ4Ijo0MDcuNDU3MDMxMjUsInkiOjEwNjR9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M551.018,955.677L563.504,967.564C575.99,979.451,600.962,1003.226,613.448,1020.613C625.934,1038,625.934,1049,625.934,1054.5L625.934,1060" id="m17758337938161-L_I_K_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_K_0" data-points="W3sieCI6NTUxLjAxODI1MzAxOTE1MjIsInkiOjk1NS42NzcwNTk0ODA4NDc4fSx7IngiOjYyNS45MzM1OTM3NSwieSI6MTAyN30seyJ4Ijo2MjUuOTMzNTkzNzUsInkiOjEwNjR9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M407.457,1118L407.457,1122.167C407.457,1126.333,407.457,1134.667,407.457,1142.333C407.457,1150,407.457,1157,407.457,1160.5L407.457,1164" id="m17758337938161-L_J_L_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_J_L_0" data-points="W3sieCI6NDA3LjQ1NzAzMTI1LCJ5IjoxMTE4fSx7IngiOjQwNy40NTcwMzEyNSwieSI6MTE0M30seyJ4Ijo0MDcuNDU3MDMxMjUsInkiOjExNjh9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path><path d="M645.695,446L645.695,454.167C645.695,462.333,645.695,478.667,635.977,490.751C626.259,502.835,606.822,510.67,597.104,514.587L587.386,518.505" id="m17758337938161-L_M_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_M_F_0" data-points="W3sieCI6NjQ1LjY5NTMxMjUsInkiOjQ0Nn0seyJ4Ijo2NDUuNjk1MzEyNSwieSI6NDk1fSx7IngiOjU4My42NzYwODE3MzA3NjkzLCJ5Ijo1MjB9XQ==" data-look="classic" marker-end="url(#m17758337938161_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_G_H_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_H_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(407.45703125, 1027)"><g class="label" data-id="L_I_J_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(625.93359375, 1027)"><g class="label" data-id="L_I_K_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_J_L_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_M_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337938161-flowchart-A-0" data-look="classic" transform="translate(249.4921875, 35)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>用户下单</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-B-1" data-look="classic" transform="translate(249.4921875, 139)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单服务</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-C-3" data-look="classic" transform="translate(111.2890625, 267)"><rect class="basic label-container" style="" x="-103.2890625" y="-51" width="206.578125" height="102"></rect><g class="label" style="" transform="translate(-73.2890625, -36)"><rect></rect><foreignObject width="146.578125" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写订单表<br>status=PENDING_PAY<br>expire_at=now+30m</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-D-5" data-look="classic" transform="translate(387.6953125, 267)"><rect class="basic label-container" style="" x="-123.1171875" y="-27" width="246.234375" height="54"></rect><g class="label" style="" transform="translate(-93.1171875, -12)"><rect></rect><foreignObject width="186.234375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写 Outbox / 发送延时事件</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-E-7" data-look="classic" transform="translate(387.6953125, 419)"><rect class="basic label-container" style="" x="-130" y="-51" width="260" height="102"></rect><g class="label" style="" transform="translate(-100, -36)"><rect></rect><foreignObject width="200" height="72"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>延时触发层<br>RocketMQ / RabbitMQ / Redis / 自研调度器</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-F-9" data-look="classic" transform="translate(516.6953125, 547)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>过期消费者</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-G-11" data-look="classic" transform="translate(516.6953125, 663)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>可选：获取订单维度分布式锁</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-H-13" data-look="classic" transform="translate(516.6953125, 779)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>执行条件更新</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-I-15" data-look="classic" transform="translate(516.6953125, 923)"><polygon points="67,0 134,-67 67,-134 0,-67" class="label-container" transform="translate(-66.5, 67)"></polygon><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>更新成功？</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-J-17" data-look="classic" transform="translate(407.45703125, 1091)"><rect class="basic label-container" style="" x="-122.4765625" y="-27" width="244.953125" height="54"></rect><g class="label" style="" transform="translate(-92.4765625, -12)"><rect></rect><foreignObject width="184.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>发布 OrderCancelled 事件</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-K-19" data-look="classic" transform="translate(625.93359375, 1091)"><rect class="basic label-container" style="" x="-46" y="-27" width="92" height="54"></rect><g class="label" style="" transform="translate(-16, -12)"><rect></rect><foreignObject width="32" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>结束</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-L-21" data-look="classic" transform="translate(407.45703125, 1207)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>异步回滚库存 / 退券 / 通知 / 审计</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938161-flowchart-M-22" data-look="classic" transform="translate(645.6953125, 419)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>补偿调度任务</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337938161-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337938161-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337938161-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

这套架构的关键点在于职责划分清晰。

### 1. 订单服务

下单时负责两件事：

- 在订单表写入 `status = PENDING_PAY`
- 同时写入 `expire_at = create_time + 30m`

此外，还需要通过事务消息或 Outbox 机制，把“订单到期事件”可靠地交给延时触发层。这样可以避免“订单落库成功，但延时消息没发出去”的问题。

### 2. 延时触发层

这一层只负责“在合适的时间提醒系统某个订单到期了”，可以由多种技术实现：

- RocketMQ 延时消息
- RabbitMQ `TTL + DLX`
- Redis ZSet
- 自研调度服务（内部使用时间轮）

无论技术选型是什么，这一层都只是**触发器**，不是最终状态裁决者。

### 3. 过期消费者

消费者收到到期事件后，不应该直接认为订单必然要关闭，而应该执行如下流程：

1. 可选地获取订单维度分布式锁，减少重复打库
2. 执行数据库条件更新，尝试把 `PENDING_PAY` 改为 `CANCELLED`
3. 如果更新成功，再发布 `OrderCancelled` 事件
4. 由下游服务异步完成库存、优惠券、通知等后置动作

### 4. 补偿调度器

为了应对节点重启、消息丢失、消费失败等极端情况，系统还需要一个低频补偿任务，例如每 5 分钟执行一次：

```sql
SELECT order_id
FROM orders
WHERE status = 'PENDING_PAY'
  AND expire_at < NOW()
LIMIT 1000;
```

补偿任务扫描到的订单，不是直接关闭，而是重新触发一遍标准的取消流程。这样就形成了典型的：

- 快路径：延时消息或时间轮处理 99.9% 的正常任务
- 慢路径：补偿调度处理极少数漏单和异常任务

## 真正决定正确性的关键：数据库状态机

无论你的上层是 MQ、Redis、时间轮还是定时任务，最终决定“这个订单能不能被取消”的关键都不是调度器，而是数据库状态机。

取消订单的核心 SQL 应该像这样：

```sql
UPDATE orders
SET status = 'CANCELLED',
    cancel_time = NOW(),
    update_time = NOW()
WHERE order_id = ?
  AND status = 'PENDING_PAY';
```

支付成功的核心 SQL 同样如此：

```sql
UPDATE orders
SET status = 'PAID',
    pay_time = NOW(),
    update_time = NOW()
WHERE order_id = ?
  AND status = 'PENDING_PAY';
```

这种写法的意义非常大：

- 判断和更新被合并为一个原子操作
- 支付与取消并发发生时，谁先更新成功，谁赢
- 失败的一方看到 `affected_rows = 0` 后自然退出
- 即使消息被重复投递，也不会把已支付订单错误改成已取消

这也是这个场景里最重要的一条工程原则：

> 不要用“先查再改”决定最终状态，最终一定要靠带条件的更新语句。

错误写法通常是：

```text
SELECT status FROM orders WHERE order_id = ?
if status == 'PENDING_PAY':
    UPDATE orders SET status = 'CANCELLED' WHERE order_id = ?
```

在高并发环境下，两台机器可能同时查到 `PENDING_PAY`，再同时进入更新逻辑，从而制造竞争窗口。真正安全的方式，是由数据库来完成最终裁决。

## 多机环境下如何保证不重复取消

在分布式环境下，同一订单的过期任务可能因为消息重投、消费重试、节点重启、消费者 Rebalance 等原因被多次处理。要保证“不重复取消”，通常会采用多层防护。

### 1. 路由层：让同一订单尽量落到同一消费者

如果使用 Kafka，可以把 `order_id` 作为 partition key。这样相同订单的消息会尽量固定到同一个分区，从而降低多机同时处理的概率。

需要注意的是，Kafka 更擅长高吞吐消息流转，并不是开箱即用的业务延时消息系统。如果业务层选择 Kafka 来承接延时任务，通常需要额外设计 delay topic、调度服务或 Streams/State Store 方案。

### 2. 锁层：用分布式锁做减压

在真正执行取消逻辑前，可以尝试获取一把订单维度的 Redis 锁，例如：

```text
SET lock:order:cancel:{orderId} token NX EX 10
```

它的主要作用是：

- 减少多个节点同时打数据库
- 把大部分冲突提前在 Redis 层过滤掉

但需要强调的是，分布式锁只是减压层，不是最终一致性层。锁可能过期、误删或异常失效，不能把“最终正确性”完全建立在锁之上。

### 3. 存储层：数据库条件更新做最终屏障

真正防止误取消的最后一道防线，仍然是：

```sql
WHERE status = 'PENDING_PAY'
```

只要这条条件更新存在，即使锁失效、消息重复、消费者重试，也不会把已支付订单改成已取消。

### 4. 后置动作：幂等日志保证子流程不重复

在真实业务里，取消订单通常不只是改一条状态，还会带出一串后续动作：

- 回滚库存
- 退优惠券
- 恢复营销资格
- 通知用户
- 记录审计日志

这时候，即使订单状态只更新成功一次，下游多个动作仍然可能因为消息重投而被触发多次。常见的解决方式是使用幂等日志表：

```sql
CREATE TABLE idempotent_log (
  biz_id VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  create_time DATETIME NOT NULL,
  PRIMARY KEY (biz_id, action)
);
```

下游处理前先尝试插入唯一记录，插入成功再继续，插入失败说明已经处理过，直接返回。

## 时间轮在分布式订单场景中的正确定位

如果系统确实需要自研调度服务，时间轮仍然是非常值得采用的核心算法。但它更适合放在**调度层内部**，而不是直接承载完整业务处理逻辑。

更推荐的方式是：

- 时间轮到期后，只负责投递一条“订单到期”事件
- 真正的取消逻辑由独立消费者异步执行

而不建议：

- 在时间轮的槽位线程里直接查库、调库存、发通知

原因很简单：

- 某个槽位可能瞬间堆积成千上万个任务
- 如果调度线程直接做重 IO，会把时间轮自身拖慢
- 调度器应该追求“快触发”，而不是“做完所有业务”

所以，时间轮在这里更像是“延时触发内核”，不是“业务执行引擎”。

## 工程风险与最佳实践

### 1. 任务持久化与恢复

时间轮、Redis、内存队列本质上都不是业务真相来源。服务重启后，如果没有持久化和补偿机制，任务就可能丢失。

因此：

- 订单超时时间必须落库到 `expire_at`
- 最好使用 Outbox 或 WAL 保障事件恢复
- 必须有低频补偿扫表

### 2. 时钟漂移

在多机系统中，不同节点的时间不可能绝对一致。为了避免提前取消或延迟取消：

- 所有机器都应接入 NTP
- 执行取消时仍以数据库中的 `expire_at` 和当前订单状态为准
- 不要因为“本地定时器到点了”就直接改业务状态

### 3. 惊群效应

大促开始时，可能会在同一秒产生 10 万个订单，这意味着 30 分钟后也会在同一秒集中到期。此时无论是时间轮槽位，还是 MQ 消费端，都会遭遇瞬时尖峰。

常见优化手段包括：

- 给过期时间增加少量随机抖动（jitter）
- 到期后只发异步事件，不在主链路同步执行复杂逻辑
- 对下游消费做限流、隔离和批处理

### 4. 支付与取消并发竞争

用户可能恰好在订单即将过期的最后一秒完成支付，而取消任务也在同一时刻触发。解决方式不是“赌顺序”，而是用数据库状态机竞争：

- 支付和取消都必须从 `PENDING_PAY` 出发
- 谁先更新成功，谁获得最终状态
- 另一方更新失败后退出即可

### 5. 后置动作全部异步化

取消订单后通常还要回库存、退券、通知用户。推荐做法是：

- 先把订单状态改成 `CANCELLED`
- 再发布 `OrderCancelled` 事件
- 让库存、券、通知等服务独立订阅并幂等消费

这样能避免主链路过长、RPC 串行依赖过多、回滚复杂度过高等问题。

## Go 版实现骨架

下面是一版比较贴近生产思路的实现骨架。它保留了订单维度分布式锁，但真正保证正确性的仍然是数据库条件更新。

```go
type OrderService struct {
    db  *sql.DB
    rdb RedisClient
    bus EventBus
}

func (s *OrderService) CancelExpiredOrder(ctx context.Context, orderID string) error {
    lockKey := "lock:order:cancel:" + orderID
    lockVal := uuid.NewString()

    ok, err := s.rdb.SetNX(ctx, lockKey, lockVal, 10*time.Second)
    if err != nil {
        return err
    }
    if !ok {
        return nil
    }
    defer s.rdb.ReleaseLock(ctx, lockKey, lockVal)

    res, err := s.db.ExecContext(ctx, `
        UPDATE orders
        SET status = 'CANCELLED',
            cancel_time = NOW(),
            update_time = NOW()
        WHERE order_id = ?
          AND status = 'PENDING_PAY'
    `, orderID)
    if err != nil {
        return err
    }

    rows, err := res.RowsAffected()
    if err != nil {
        return err
    }
    if rows == 0 {
        return nil
    }

    return s.bus.Publish(ctx, OrderCancelledEvent{OrderID: orderID})
}
```

上面的实现体现了三层思想：

- Redis 锁：减少多节点同时冲击数据库
- 条件更新：保证最终状态流转正确
- 领域事件：把库存、优惠券、通知等副作用异步化

## 面试回答模板

如果在面试里被问到“30 分钟未支付自动取消怎么设计”，可以用下面这版口径来回答：

> 这个问题本质上不是一个简单的定时任务问题，而是一个延时任务 + 分布式一致性问题。  
> 在低并发场景下可以用定时扫表，但生产环境里我更倾向于用延时消息做主路径，比如 RocketMQ 延时消息，或者 RabbitMQ 的 TTL + 死信队列。  
> 如果需要自研高性能调度层，我会考虑时间轮，因为它适合管理大量定时任务，能把全量扫描转换成按槽位触发。  
> 但时间轮只解决调度效率，不解决业务正确性，所以真正防止重复取消和误取消的关键还是数据库状态机。也就是说，取消订单时必须执行 `UPDATE ... WHERE status = 'PENDING_PAY'` 这样的条件更新。  
> 在多机环境下，我会再加两层保障：第一层是用 Redis 锁或按 `order_id` 做分区路由，减少并发竞争；第二层是补偿扫表，防止节点重启、消息丢失或消费失败导致漏单。  
> 整体上就是：延时触发负责效率，数据库条件更新负责正确，补偿任务负责可靠。

如果面试官继续追问，可以按下面的顺序展开：

1. 先讲为什么不用高频扫表
2. 再讲延时消息、时间轮、Redis ZSet 的取舍
3. 再讲 `WHERE status = 'PENDING_PAY'` 为什么是最终屏障
4. 再讲支付与取消并发时如何靠状态机竞争收敛
5. 最后补 Redis 锁、幂等日志、补偿扫描和惊群优化

## 落地检查清单

如果你要把这套方案真正落到生产环境，至少要检查下面这些点。

### 1. 数据模型

- 订单表里是否有 `expire_at`
- 是否对 `status, expire_at` 建了合适索引
- 状态流转是否清晰定义为状态机

### 2. 触发层

- 是否已经选定延时消息、Redis ZSet 或自研调度器
- 如果是自研时间轮，是否明确了 tick、槽位数和跨圈策略
- 是否避免在调度线程里直接做重 IO

### 3. 一致性

- 取消 SQL 是否使用了条件更新
- 支付 SQL 是否同样从 `PENDING_PAY` 出发
- 是否避免了“先查再改”这种高竞争写法

### 4. 幂等与防重

- 是否有订单维度分布式锁或分区路由
- 下游库存、优惠券、通知是否也做了幂等
- 是否需要单独的幂等日志表

### 5. 恢复与补偿

- 是否有 Outbox、本地消息表或其他可靠投递机制
- 是否有低频补偿扫表任务
- 系统重启后是否能恢复漏掉的超时订单

### 6. 稳定性

- 是否考虑了大促时同秒到期带来的惊群
- 是否引入了 jitter、限流、隔离、批量处理等手段
- 是否对取消链路和补偿链路都做了监控、告警和可观测性埋点

### 7. 工程实现

- Redis 锁释放是否采用 token 校验，避免误删
- 消费重试是否有退避，不会无限打爆下游
- 领域事件是否和主事务合理解耦

可以把这份清单理解成一句话：

> 方案评审时不要只问“能不能定时关闭订单”，而要问“任务会不会丢、会不会重、会不会误取消、失败后能不能恢复”。

## 结论

“订单 30 分钟未支付自动取消”并不是一个简单的定时器问题，而是一个典型的分布式延时任务架构问题。

真正可靠的生产方案，通常不是某一个技术点单独解决，而是多层机制组合：

- 用延时消息或时间轮解决高效触发问题
- 用数据库状态机解决状态一致性问题
- 用幂等控制解决重复执行问题
- 用补偿调度解决极端情况下的遗漏问题

因此，对这个场景最值得记住的一句话是：

> 时间轮解决的是调度效率问题，数据库状态机解决的是业务正确性问题，补偿机制解决的是分布式系统的不完美问题。

## 相关阅读

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [延时任务方案对比](/architecture/delayed-task-solution-comparison)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [Kafka 核心概念](/kafka/core-concepts)
- [Redis 高并发、集群与锁](/redis/high-concurrency-cluster-locks)
