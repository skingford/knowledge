---
title: Outbox 本地消息表设计实战
description: 围绕订单创建、状态变更与消息投递，讲清 Outbox 模式的核心流程、表设计、重试补偿、幂等与工程边界。
---

# Outbox 本地消息表设计实战

## 适合人群

- 正在设计订单、支付、库存、通知等跨服务一致性链路的后端工程师
- 想把“库里改状态 + 发 MQ”升级成可恢复方案的开发者
- 准备系统设计面试或做交易链路架构评审的人

## 学习目标

- 理解为什么“写库成功但消息没发出去”是经典一致性问题
- 掌握 Outbox 模式的核心流程、表结构与投递策略
- 能把 Outbox 和幂等、补偿、状态机串成完整闭环

## 快速导航

- [为什么需要 Outbox](#为什么需要-outbox)
- [最常见的问题：写库和发消息不是一个原子动作](#最常见的问题写库和发消息不是一个原子动作)
- [Outbox 到底是什么](#outbox-到底是什么)
- [核心流程怎么走](#核心流程怎么走)
- [表结构怎么设计](#表结构怎么设计)
- [投递器怎么设计](#投递器怎么设计)
- [消费端为什么仍然要幂等](#消费端为什么仍然要幂等)
- [重试、补偿和归档怎么做](#重试补偿和归档怎么做)
- [Outbox 和事务消息、TCC 怎么区分](#outbox-和事务消息tcc-怎么区分)
- [什么时候不一定要用 Outbox](#什么时候不一定要用-outbox)
- [面试回答模板](#面试回答模板)
- [落地检查清单](#落地检查清单)
- [结论](#结论)

## 为什么需要 Outbox

在分布式业务里，有一类操作非常常见：

- 先修改本地数据库
- 再发送一条 MQ 消息给下游

比如：

- 创建订单后发送 `OrderCreated`
- 支付成功后发送 `OrderPaid`
- 订单取消后发送 `OrderCancelled`
- 库存扣减成功后发送 `StockDeducted`

看起来这只是“改库后顺手发个消息”，但问题恰恰就出在这个“顺手”上。

因为数据库事务和消息发送通常不在同一个原子事务里。只要这两步分开，就一定存在中间状态。

## 最常见的问题：写库和发消息不是一个原子动作

最典型的错误写法通常像这样：

```text
1. begin tx
2. insert order
3. commit
4. send MQ message
```

这个流程有一个致命窗口：

- 如果第 3 步提交成功
- 第 4 步因为网络抖动、MQ 故障、进程崩溃而失败

就会出现：

- 数据库里已经有订单
- 下游却完全不知道这件事

于是系统进入“不一致但无人感知”的状态。

反过来，如果你先发消息再提交事务，也会遇到另一个问题：

- 消息已经发出去了
- 但数据库事务最终回滚了

这会导致下游收到一条“根本不存在”的业务事件。

所以核心矛盾非常明确：

> 单机数据库事务无法天然覆盖“发消息”这个外部动作，但业务链路又要求两者最终一致。

## Outbox 到底是什么

Outbox 模式本质上是一种“先把消息当成业务数据一起落库，再异步投递出去”的设计。

它的核心思想是：

- 不直接在主流程里依赖“发 MQ 一定成功”
- 而是在本地事务里把“待发送消息”也写进数据库
- 后续再由独立投递器把这条消息可靠发送出去

所以 Outbox 模式的关键不是“多一张表”，而是：

- 把消息发送问题转化成了数据库里的可恢复任务问题

也就是说，数据库不只是存业务事实，还临时承担了一部分“可靠待投递事件存储”的职责。

## 核心流程怎么走

Outbox 最标准的一条链路可以这样理解：

<div class="mermaid-svg-wrapper">

<svg id="m17758337938840" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 276px;" viewBox="0 0 276 926" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337938840{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337938840 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337938840 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337938840 .error-icon{fill:#552222;}#m17758337938840 .error-text{fill:#552222;stroke:#552222;}#m17758337938840 .edge-thickness-normal{stroke-width:1px;}#m17758337938840 .edge-thickness-thick{stroke-width:3.5px;}#m17758337938840 .edge-pattern-solid{stroke-dasharray:0;}#m17758337938840 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337938840 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337938840 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337938840 .marker{fill:#666;stroke:#666;}#m17758337938840 .marker.cross{stroke:#666;}#m17758337938840 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337938840 p{margin:0;}#m17758337938840 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337938840 .cluster-label text{fill:#333;}#m17758337938840 .cluster-label span{color:#333;}#m17758337938840 .cluster-label span p{background-color:transparent;}#m17758337938840 .label text,#m17758337938840 span{fill:#000000;color:#000000;}#m17758337938840 .node rect,#m17758337938840 .node circle,#m17758337938840 .node ellipse,#m17758337938840 .node polygon,#m17758337938840 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337938840 .rough-node .label text,#m17758337938840 .node .label text,#m17758337938840 .image-shape .label,#m17758337938840 .icon-shape .label{text-anchor:middle;}#m17758337938840 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337938840 .rough-node .label,#m17758337938840 .node .label,#m17758337938840 .image-shape .label,#m17758337938840 .icon-shape .label{text-align:center;}#m17758337938840 .node.clickable{cursor:pointer;}#m17758337938840 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337938840 .arrowheadPath{fill:#333333;}#m17758337938840 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337938840 .flowchart-link{stroke:#666;fill:none;}#m17758337938840 .edgeLabel{background-color:white;text-align:center;}#m17758337938840 .edgeLabel p{background-color:white;}#m17758337938840 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337938840 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337938840 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337938840 .cluster text{fill:#333;}#m17758337938840 .cluster span{color:#333;}#m17758337938840 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337938840 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337938840 rect.text{fill:none;stroke-width:0;}#m17758337938840 .icon-shape,#m17758337938840 .image-shape{background-color:white;text-align:center;}#m17758337938840 .icon-shape p,#m17758337938840 .image-shape p{background-color:white;padding:2px;}#m17758337938840 .icon-shape .label rect,#m17758337938840 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337938840 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337938840 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337938840 .node .neo-node{stroke:#999;}#m17758337938840 [data-look="neo"].node rect,#m17758337938840 [data-look="neo"].cluster rect,#m17758337938840 [data-look="neo"].node polygon{stroke:url(#m17758337938840-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938840 [data-look="neo"].node path{stroke:url(#m17758337938840-gradient);stroke-width:1px;}#m17758337938840 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938840 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337938840 [data-look="neo"].node circle{stroke:url(#m17758337938840-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938840 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337938840 [data-look="neo"].icon-shape .icon{fill:url(#m17758337938840-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938840 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337938840-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337938840 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337938840_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938840_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938840_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938840_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337938840_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938840_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938840_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938840_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337938840_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938840_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337938840_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337938840_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M138,62L138,66.167C138,70.333,138,78.667,138,86.333C138,94,138,101,138,104.5L138,108" id="m17758337938840-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTM4LCJ5Ijo2Mn0seyJ4IjoxMzgsInkiOjg3fSx7IngiOjEzOCwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,166L138,170.167C138,174.333,138,182.667,138,190.333C138,198,138,205,138,208.5L138,212" id="m17758337938840-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTM4LCJ5IjoxNjZ9LHsieCI6MTM4LCJ5IjoxOTF9LHsieCI6MTM4LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,270L138,274.167C138,278.333,138,286.667,138,294.333C138,302,138,309,138,312.5L138,316" id="m17758337938840-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6MTM4LCJ5IjoyNzB9LHsieCI6MTM4LCJ5IjoyOTV9LHsieCI6MTM4LCJ5IjozMjB9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,374L138,378.167C138,382.333,138,390.667,138,398.333C138,406,138,413,138,416.5L138,420" id="m17758337938840-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6MTM4LCJ5IjozNzR9LHsieCI6MTM4LCJ5IjozOTl9LHsieCI6MTM4LCJ5Ijo0MjR9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,478L138,482.167C138,486.333,138,494.667,138,502.333C138,510,138,517,138,520.5L138,524" id="m17758337938840-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6MTM4LCJ5Ijo0Nzh9LHsieCI6MTM4LCJ5Ijo1MDN9LHsieCI6MTM4LCJ5Ijo1Mjh9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,606L138,610.167C138,614.333,138,622.667,138,630.333C138,638,138,645,138,648.5L138,652" id="m17758337938840-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MTM4LCJ5Ijo2MDZ9LHsieCI6MTM4LCJ5Ijo2MzF9LHsieCI6MTM4LCJ5Ijo2NTZ9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,710L138,714.167C138,718.333,138,726.667,138,734.333C138,742,138,749,138,752.5L138,756" id="m17758337938840-L_G_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_H_0" data-points="W3sieCI6MTM4LCJ5Ijo3MTB9LHsieCI6MTM4LCJ5Ijo3MzV9LHsieCI6MTM4LCJ5Ijo3NjB9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path><path d="M138,814L138,818.167C138,822.333,138,830.667,138,838.333C138,846,138,853,138,856.5L138,860" id="m17758337938840-L_H_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_I_0" data-points="W3sieCI6MTM4LCJ5Ijo4MTR9LHsieCI6MTM4LCJ5Ijo4Mzl9LHsieCI6MTM4LCJ5Ijo4NjR9XQ==" data-look="classic" marker-end="url(#m17758337938840_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_G_H_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_H_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337938840-flowchart-A-0" data-look="classic" transform="translate(138, 35)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>业务请求</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-B-1" data-look="classic" transform="translate(138, 139)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>开启本地事务</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-C-3" data-look="classic" transform="translate(138, 243)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写业务表</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-D-5" data-look="classic" transform="translate(138, 347)"><rect class="basic label-container" style="" x="-92.515625" y="-27" width="185.03125" height="54"></rect><g class="label" style="" transform="translate(-62.515625, -12)"><rect></rect><foreignObject width="125.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写 Outbox 事件表</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-E-7" data-look="classic" transform="translate(138, 451)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>提交事务</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-F-9" data-look="classic" transform="translate(138, 567)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>Outbox 投递器扫描待发送事件</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-G-11" data-look="classic" transform="translate(138, 683)"><rect class="basic label-container" style="" x="-67.4921875" y="-27" width="134.984375" height="54"></rect><g class="label" style="" transform="translate(-37.4921875, -12)"><rect></rect><foreignObject width="74.984375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>发送到 MQ</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-H-13" data-look="classic" transform="translate(138, 787)"><rect class="basic label-container" style="" x="-124.515625" y="-27" width="249.03125" height="54"></rect><g class="label" style="" transform="translate(-94.515625, -12)"><rect></rect><foreignObject width="189.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>更新 Outbox 状态为已发送</p></span></div></foreignObject></g></g><g class="node default" id="m17758337938840-flowchart-I-15" data-look="classic" transform="translate(138, 891)"><rect class="basic label-container" style="" x="-102" y="-27" width="204" height="54"></rect><g class="label" style="" transform="translate(-72, -12)"><rect></rect><foreignObject width="144" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>下游消费者幂等消费</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337938840-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337938840-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337938840-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

拆成步骤就是：

1. 业务服务在一个本地事务里同时写两份数据
   - 业务表
   - Outbox 表
2. 事务提交成功，说明：
   - 业务事实已落库
   - 待发送事件也已落库
3. 独立投递器扫描 Outbox 表里的待发送事件
4. 成功发到 MQ 后，把这条记录标记为已发送
5. 如果发送失败，后续继续重试

这就解决了：

- “业务成功了，但消息丢了”时如何恢复

因为只要 Outbox 记录还在，投递器就总能继续把它补发出去。

## 表结构怎么设计

下面是一版比较常见、也比较实用的 Outbox 表结构：

```sql
CREATE TABLE outbox_event (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_id VARCHAR(64) NOT NULL UNIQUE,
  biz_type VARCHAR(64) NOT NULL,
  biz_key VARCHAR(64) NOT NULL,
  topic VARCHAR(128) NOT NULL,
  payload JSON NOT NULL,
  headers JSON NULL,
  status VARCHAR(16) NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_time DATETIME NULL,
  last_error VARCHAR(512) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  sent_at DATETIME NULL,
  KEY idx_status_next_retry_time (status, next_retry_time),
  KEY idx_biz_type_biz_key (biz_type, biz_key)
);
```

### 关键字段说明

- `event_id`
  - 全局唯一事件 ID
  - 用于去重和下游幂等追踪
- `biz_type + biz_key`
  - 业务类型和业务主键
  - 例如 `order + order_12345`
- `topic`
  - 投递目标主题
- `payload`
  - 事件内容
- `status`
  - 例如 `NEW / SENDING / SENT / FAILED`
- `retry_count`
  - 记录已重试次数
- `next_retry_time`
  - 用于控制退避重试
- `last_error`
  - 留给排障定位

## 投递器怎么设计

Outbox 的关键不只是写表，还要有一个可靠投递器。

### 1. 最朴素的思路

投递器定期扫描：

```sql
SELECT *
FROM outbox_event
WHERE status IN ('NEW', 'FAILED')
  AND (next_retry_time IS NULL OR next_retry_time <= NOW())
ORDER BY id
LIMIT 100;
```

拿到事件后：

1. 发送到 MQ
2. 成功则更新为 `SENT`
3. 失败则增加 `retry_count`，并设置新的 `next_retry_time`

### 2. 为什么不能多个投递器直接无脑扫同一批数据

如果多实例都在扫，最容易出现的问题是：

- 同一条事件被多个实例同时拿到
- 然后被重复发送到 MQ

这类重复通常不能完全避免，所以工程上一般会做两层保护：

- 扫描时加抢占或状态跃迁
- 下游消费继续做幂等

例如先把记录从 `NEW` 改为 `SENDING`，谁改成功谁拿到处理权。

### 3. 一个更稳的状态流转

比较常见的状态流转是：

- `NEW`
- `SENDING`
- `SENT`
- `FAILED`

其中：

- `NEW`：刚写入，尚未投递
- `SENDING`：某个投递器已抢到，正在投递
- `SENT`：已成功投递
- `FAILED`：投递失败，等待重试

这样做的目的不是绝对杜绝重复，而是：

- 降低并发重复发送概率
- 让排障和恢复状态更清晰

## 消费端为什么仍然要幂等

Outbox 可以显著降低“业务成功但消息没发出去”的问题，但它不能把消息系统变成严格意义上的“只消费一次”。

因为真实系统里仍然会出现：

- 投递成功了，但更新 `SENT` 状态失败
- 网络超时导致发送结果不明确
- MQ 重试导致重复投递
- 下游消费失败后再次投递

所以正确理解应该是：

- Outbox 解决的是“消息最终一定能发出去”
- 但不承诺“下游只会收到一次”

因此消费端仍然必须保证幂等。

最常见做法包括：

- 以 `event_id` 做幂等去重
- 以业务主键 + 动作名做唯一约束
- 继续依赖数据库条件更新

## 重试、补偿和归档怎么做

### 1. 重试

重试建议不要无脑固定间隔，而应该带退避，例如：

- 第 1 次失败：10 秒后
- 第 2 次失败：30 秒后
- 第 3 次失败：2 分钟后
- 第 4 次失败：10 分钟后

这样可以避免下游持续故障时把系统打得更重。

### 2. 补偿

如果一条消息长时间投递失败，通常需要有人工或自动补偿手段：

- 告警
- 管理后台重试
- 定时补偿任务

### 3. 归档

Outbox 表不能无限增长。常见做法包括：

- 已发送数据保留 N 天后归档
- 已完成数据转冷表
- 大批量清理历史 `SENT` 事件

否则 Outbox 表会逐渐成为新的热点和负担。

## Outbox 和事务消息、TCC 怎么区分

这是面试和评审里很容易追问的地方。

### 1. Outbox

核心特点：

- 基于本地事务
- 主业务和待发送消息一起落库
- 后续异步投递

适合：

- 最终一致性链路
- 订单、营销、通知、库存等互联网业务

### 2. 事务消息

核心特点：

- 由消息中间件提供更强的事务协同能力
- 业务方不一定要自己维护 Outbox 表

适合：

- 团队已经成熟使用支持事务消息的中间件
- 想降低自建投递器复杂度

### 3. TCC

核心特点：

- 强业务侵入
- 通过 Try / Confirm / Cancel 显式建模
- 一致性更强，但复杂度也明显更高

适合：

- 资金、核心库存等强一致场景

所以大致可以这样理解：

- `Outbox`：最常见的最终一致性工程方案
- `事务消息`：借助 MQ 能力简化一部分 Outbox 问题
- `TCC`：更强控制力，但复杂度高得多

## 什么时候不一定要用 Outbox

Outbox 很有用，但也不是所有场景都必须引入。

下面几种情况要谨慎：

### 1. 业务根本不需要发消息

如果链路里没有真正的异步事件需求，就不要为了“模式正确”硬加 Outbox。

### 2. 同库内本地事务就能解决

如果只是单服务、单库、多表联动，优先用本地事务，不要过早引入消息一致性方案。

### 3. 中间件已经提供更合适的事务消息能力

如果团队已有成熟事务消息落地，并且配套监控与治理完善，那么没有必要再重复造一套 Outbox。

### 4. 业务规模过小，维护成本反而更高

对于小型系统，Outbox 的收益可能还不如“可接受的简化方案 + 定时补偿”。

## 面试回答模板

如果面试官问“Outbox 模式是什么，为什么要用”，一个比较稳的回答可以这样说：

> Outbox 模式主要解决的是本地数据库事务和消息发送不是一个原子动作的问题。  
> 比如订单创建成功后要发一条消息给下游，如果数据库提交成功了，但发 MQ 失败，就会出现业务数据和消息链路不一致。  
> Outbox 的做法是在一个本地事务里同时写业务表和 Outbox 表，事务提交后由独立投递器去扫描 Outbox 记录并发送 MQ。这样即使服务当时崩溃，后面也还能根据 Outbox 记录继续补发。  
> 它本质上是把“发消息”转换成了一个数据库里可恢复的待处理任务。  
> 当然 Outbox 也不能替代消费端幂等，因为投递和消费链路里仍然可能出现重复消息，所以最终还是要和幂等、补偿、状态机一起使用。

如果继续追问，可以顺着讲：

1. 为什么不能简单地“提交后直接发消息”
2. 投递器如何避免多实例重复处理
3. 为什么 Outbox 解决不了消费端重复消费
4. Outbox 和事务消息、TCC 的边界差异

## 落地检查清单

### 1. 事务边界

- 业务表和 Outbox 表是否在同一个本地事务里提交
- 是否避免了“业务成功后再临时补写 Outbox”

### 2. 表设计

- 是否有 `event_id` 唯一约束
- 是否有状态字段、重试次数、下次重试时间
- 是否有便于扫描的索引

### 3. 投递器

- 是否支持多实例安全抢占
- 是否有失败退避重试
- 是否有投递失败告警

### 4. 消费幂等

- 下游是否以 `event_id` 或业务键做幂等
- 是否假设 MQ 会天然保证 exactly once

### 5. 生命周期治理

- 是否有已发送事件归档清理策略
- 是否有异常消息人工介入方案
- 是否有链路指标和审计日志

## 结论

Outbox 模式的核心价值，不是“多建一张表”，而是：

- 把消息发送从一次脆弱的即时动作
- 变成一个可恢复、可重试、可观测的本地持久化过程

所以它最值得记住的一句话是：

> Outbox 不是为了让消息一次就发成功，而是为了让“消息最终能发出去”这件事变得可恢复、可补偿、可治理。

## 相关阅读

- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
- [延时任务方案对比](/architecture/delayed-task-solution-comparison)
