---
title: 订单状态机设计实战
description: 围绕订单创建、支付、超时取消、退款等链路，讲清状态机设计、条件更新、幂等与并发竞争处理。
---

# 订单状态机设计实战

## 适合人群

- 正在设计订单、支付、库存、退款等交易链路的后端工程师
- 想把“状态字段”升级成“状态机设计”的开发者
- 准备系统设计面试或做交易系统评审的人

## 学习目标

- 理解为什么订单系统必须用状态机约束状态流转
- 掌握条件更新、幂等、并发竞争与补偿之间的关系
- 能设计出更适合生产环境的订单状态模型

## 快速导航

- [为什么订单系统必须有状态机](#为什么订单系统必须有状态机)
- [先区分状态字段和状态机](#先区分状态字段和状态机)
- [订单状态怎么设计](#订单状态怎么设计)
- [合法流转关系怎么定义](#合法流转关系怎么定义)
- [为什么条件更新是核心](#为什么条件更新是核心)
- [支付与取消并发时怎么处理](#支付与取消并发时怎么处理)
- [后置动作为什么要异步化](#后置动作为什么要异步化)
- [数据模型建议](#数据模型建议)
- [常见反模式](#常见反模式)
- [面试回答模板](#面试回答模板)
- [落地检查清单](#落地检查清单)
- [结论](#结论)

## 为什么订单系统必须有状态机

订单系统最大的特点，不是字段多，而是状态变化复杂。

一个真实订单通常要经历这些阶段：

- 创建订单
- 待支付
- 支付成功
- 超时取消
- 发货中
- 已完成
- 退款中
- 已退款

如果系统只是简单存一个 `status` 字段，但没有明确规定：

- 哪些状态能互相转换
- 哪些状态永远不能回退
- 哪些动作需要幂等
- 哪些动作需要串行化处理

那么随着业务增长，系统很快就会出现这些问题：

- 已支付订单被超时任务误取消
- 已取消订单又被支付回调改成已支付
- 同一订单被重复退款
- 下游库存、优惠券、通知链路多次触发

所以订单系统真正需要的，不是“一个状态值”，而是“一个清晰、可执行、可校验的状态机”。

## 先区分状态字段和状态机

这是很多设计讨论里最容易混淆的地方。

### 1. 只有状态字段

如果系统只是有一列：

```text
status = PENDING_PAY / PAID / CANCELLED / FINISHED
```

但没有定义转移规则，那么这更像是：

- 一个枚举字段
- 一个展示用标签
- 一个方便查询的状态快照

它不能天然防止错误流转。

### 2. 真正的状态机

状态机不只是“有哪些状态”，而是还要明确：

- 初始状态是什么
- 哪些状态可以转到哪些状态
- 每次转换由什么事件触发
- 转换是否需要条件校验
- 转换失败后怎么处理

所以更准确的理解应该是：

- `status` 是状态机的载体
- `转移规则 + 原子更新 + 幂等控制` 才构成真正的状态机

## 订单状态怎么设计

订单状态不要一开始就设计得过多、过细，但也不能过于粗糙。比较实用的设计方式是先围绕业务主线分层。

### 1. 最小可用状态集

对于大多数电商或外卖场景，一套最小可用状态通常包括：

- `PENDING_PAY`
- `PAID`
- `CANCELLED`
- `DELIVERING`
- `FINISHED`
- `REFUNDING`
- `REFUNDED`

### 2. 为什么不要把一切都塞进一个状态字段

有些系统会尝试把所有业务细节都堆在一个字段里，例如：

- 待支付
- 已支付待审核
- 已支付待拆单
- 已支付待锁库
- 已支付待风控
- 已支付待发货

这种设计的问题是：

- 状态数会爆炸
- 业务语义变得混乱
- 一个状态字段同时承担主状态、流程状态、外部依赖状态三种职责

更好的做法通常是：

- 主状态机负责订单生命周期主线
- 子状态或扩展字段负责补充局部流程信息

例如：

- `status`：订单主状态
- `pay_status`：支付状态
- `refund_status`：退款状态
- `delivery_status`：履约状态

这样主线会更稳定，扩展也更容易。

## 合法流转关系怎么定义

设计状态机时，最关键的不是列出状态，而是明确“合法流转”。

<div class="mermaid-svg-wrapper">

<svg id="m17758337937110" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 742.109375px;" viewBox="0 0 742.109375 226" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337937110{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337937110 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337937110 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337937110 .error-icon{fill:#552222;}#m17758337937110 .error-text{fill:#552222;stroke:#552222;}#m17758337937110 .edge-thickness-normal{stroke-width:1px;}#m17758337937110 .edge-thickness-thick{stroke-width:3.5px;}#m17758337937110 .edge-pattern-solid{stroke-dasharray:0;}#m17758337937110 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337937110 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337937110 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337937110 .marker{fill:#666;stroke:#666;}#m17758337937110 .marker.cross{stroke:#666;}#m17758337937110 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337937110 p{margin:0;}#m17758337937110 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337937110 .cluster-label text{fill:#333;}#m17758337937110 .cluster-label span{color:#333;}#m17758337937110 .cluster-label span p{background-color:transparent;}#m17758337937110 .label text,#m17758337937110 span{fill:#000000;color:#000000;}#m17758337937110 .node rect,#m17758337937110 .node circle,#m17758337937110 .node ellipse,#m17758337937110 .node polygon,#m17758337937110 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337937110 .rough-node .label text,#m17758337937110 .node .label text,#m17758337937110 .image-shape .label,#m17758337937110 .icon-shape .label{text-anchor:middle;}#m17758337937110 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337937110 .rough-node .label,#m17758337937110 .node .label,#m17758337937110 .image-shape .label,#m17758337937110 .icon-shape .label{text-align:center;}#m17758337937110 .node.clickable{cursor:pointer;}#m17758337937110 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337937110 .arrowheadPath{fill:#333333;}#m17758337937110 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337937110 .flowchart-link{stroke:#666;fill:none;}#m17758337937110 .edgeLabel{background-color:white;text-align:center;}#m17758337937110 .edgeLabel p{background-color:white;}#m17758337937110 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337937110 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337937110 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337937110 .cluster text{fill:#333;}#m17758337937110 .cluster span{color:#333;}#m17758337937110 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337937110 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337937110 rect.text{fill:none;stroke-width:0;}#m17758337937110 .icon-shape,#m17758337937110 .image-shape{background-color:white;text-align:center;}#m17758337937110 .icon-shape p,#m17758337937110 .image-shape p{background-color:white;padding:2px;}#m17758337937110 .icon-shape .label rect,#m17758337937110 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337937110 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337937110 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337937110 .node .neo-node{stroke:#999;}#m17758337937110 [data-look="neo"].node rect,#m17758337937110 [data-look="neo"].cluster rect,#m17758337937110 [data-look="neo"].node polygon{stroke:url(#m17758337937110-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937110 [data-look="neo"].node path{stroke:url(#m17758337937110-gradient);stroke-width:1px;}#m17758337937110 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937110 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337937110 [data-look="neo"].node circle{stroke:url(#m17758337937110-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937110 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337937110 [data-look="neo"].icon-shape .icon{fill:url(#m17758337937110-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937110 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337937110-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337937110 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337937110_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937110_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937110_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937110_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337937110_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937110_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937110_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937110_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337937110_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937110_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337937110_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337937110_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M139.018,112L147.247,107.833C155.475,103.667,171.933,95.333,187.921,91.167C203.909,87,219.427,87,227.186,87L234.945,87" id="m17758337937110-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTM5LjAxNzg3ODYwNTc2OTIzLCJ5IjoxMTJ9LHsieCI6MTg4LjM5MDYyNSwieSI6ODd9LHsieCI6MjM4Ljk0NTMxMjUsInkiOjg3fV0=" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path><path d="M139.018,166L147.247,170.167C155.475,174.333,171.933,182.667,183.662,186.833C195.391,191,202.391,191,205.891,191L209.391,191" id="m17758337937110-L_A_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_C_0" data-points="W3sieCI6MTM5LjAxNzg3ODYwNTc2OTIzLCJ5IjoxNjZ9LHsieCI6MTg4LjM5MDYyNSwieSI6MTkxfSx7IngiOjIxMy4zOTA2MjUsInkiOjE5MX1d" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path><path d="M329.789,62.39L338.215,57.825C346.641,53.26,363.492,44.13,375.418,39.565C387.344,35,394.344,35,397.844,35L401.344,35" id="m17758337937110-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MzI5Ljc4OTA2MjUsInkiOjYyLjM5MDQ3NjE5MDQ3NjE5fSx7IngiOjM4MC4zNDM3NSwieSI6MzV9LHsieCI6NDA1LjM0Mzc1LCJ5IjozNX1d" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path><path d="M549.047,35L553.214,35C557.38,35,565.714,35,574.297,35C582.88,35,591.714,35,596.13,35L600.547,35" id="m17758337937110-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6NTQ5LjA0Njg3NSwieSI6MzV9LHsieCI6NTc0LjA0Njg3NSwieSI6MzV9LHsieCI6NjA0LjU0Njg3NSwieSI6MzV9XQ==" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path><path d="M329.789,111.61L338.215,116.175C346.641,120.74,363.492,129.87,375.546,134.435C387.599,139,394.854,139,398.482,139L402.109,139" id="m17758337937110-L_B_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_F_0" data-points="W3sieCI6MzI5Ljc4OTA2MjUsInkiOjExMS42MDk1MjM4MDk1MjM4MX0seyJ4IjozODAuMzQzNzUsInkiOjEzOX0seyJ4Ijo0MDYuMTA5Mzc1LCJ5IjoxMzl9XQ==" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path><path d="M548.281,139L552.576,139C556.87,139,565.458,139,573.253,139C581.047,139,588.047,139,591.547,139L595.047,139" id="m17758337937110-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6NTQ4LjI4MTI1LCJ5IjoxMzl9LHsieCI6NTc0LjA0Njg3NSwieSI6MTM5fSx7IngiOjU5OS4wNDY4NzUsInkiOjEzOX1d" data-look="classic" marker-end="url(#m17758337937110_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_A_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337937110-flowchart-A-0" data-look="classic" transform="translate(85.6953125, 139)"><rect class="basic label-container" style="" x="-77.6953125" y="-27" width="155.390625" height="54"></rect><g class="label" style="" transform="translate(-47.6953125, -12)"><rect></rect><foreignObject width="95.390625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PENDING_PAY</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-B-1" data-look="classic" transform="translate(284.3671875, 87)"><rect class="basic label-container" style="" x="-45.421875" y="-27" width="90.84375" height="54"></rect><g class="label" style="" transform="translate(-15.421875, -12)"><rect></rect><foreignObject width="30.84375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>PAID</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-C-3" data-look="classic" transform="translate(284.3671875, 191)"><rect class="basic label-container" style="" x="-70.9765625" y="-27" width="141.953125" height="54"></rect><g class="label" style="" transform="translate(-40.9765625, -12)"><rect></rect><foreignObject width="81.953125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>CANCELLED</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-D-5" data-look="classic" transform="translate(477.1953125, 35)"><rect class="basic label-container" style="" x="-71.8515625" y="-27" width="143.703125" height="54"></rect><g class="label" style="" transform="translate(-41.8515625, -12)"><rect></rect><foreignObject width="83.703125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>DELIVERING</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-E-7" data-look="classic" transform="translate(666.578125, 35)"><rect class="basic label-container" style="" x="-62.03125" y="-27" width="124.0625" height="54"></rect><g class="label" style="" transform="translate(-32.03125, -12)"><rect></rect><foreignObject width="64.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>FINISHED</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-F-9" data-look="classic" transform="translate(477.1953125, 139)"><rect class="basic label-container" style="" x="-71.0859375" y="-27" width="142.171875" height="54"></rect><g class="label" style="" transform="translate(-41.0859375, -12)"><rect></rect><foreignObject width="82.171875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>REFUNDING</p></span></div></foreignObject></g></g><g class="node default" id="m17758337937110-flowchart-G-11" data-look="classic" transform="translate(666.578125, 139)"><rect class="basic label-container" style="" x="-67.53125" y="-27" width="135.0625" height="54"></rect><g class="label" style="" transform="translate(-37.53125, -12)"><rect></rect><foreignObject width="75.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>REFUNDED</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337937110-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337937110-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337937110-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

这张图的意义不是画流程，而是强调：

- `PENDING_PAY -> PAID` 合法
- `PENDING_PAY -> CANCELLED` 合法
- `PAID -> CANCELLED` 通常不合法
- `CANCELLED -> PAID` 更不应该合法

如果后续业务真有“支付后撤单”这种需求，那通常也不应该直接走 `PAID -> CANCELLED`，而应当设计为：

- `PAID -> REFUNDING -> REFUNDED`

这能更清楚地保留业务语义和资金链路。

## 为什么条件更新是核心

订单状态机真正落地时，最关键的一点是：

> 状态流转不能只靠代码里的 `if` 判断，必须靠数据库条件更新来做最终裁决。

例如支付成功：

```sql
UPDATE orders
SET status = 'PAID',
    pay_time = NOW(),
    update_time = NOW()
WHERE order_id = ?
  AND status = 'PENDING_PAY';
```

例如超时取消：

```sql
UPDATE orders
SET status = 'CANCELLED',
    cancel_time = NOW(),
    update_time = NOW()
WHERE order_id = ?
  AND status = 'PENDING_PAY';
```

这种写法本质上就是把状态机规则落到了数据库里：

- 只有 `PENDING_PAY` 才能被改成 `PAID`
- 只有 `PENDING_PAY` 才能被改成 `CANCELLED`

一旦状态已经变了，后续重复请求自然会失败。

## 支付与取消并发时怎么处理

订单系统里最经典的竞争场景就是：

- 超时任务正在取消订单
- 用户刚好在最后一秒支付成功

如果你写的是：

```text
SELECT status ...
if status == PENDING_PAY:
    UPDATE ...
```

那两边都有可能同时看到 `PENDING_PAY`，从而产生竞争窗口。

正确做法是：

- 支付和取消都只尝试从 `PENDING_PAY` 出发
- 谁先更新成功，谁获得最终状态
- 另一方看到 `affected_rows = 0` 后退出

这也是订单状态机最核心的收敛方式：

- 不靠猜测顺序
- 不靠本地内存判断
- 不靠单机锁假设
- 直接依赖数据库原子状态流转

## 后置动作为什么要异步化

订单状态变化之后，往往还会触发很多后续动作：

- 回滚库存
- 退优惠券
- 发站内信或短信
- 更新营销资格
- 写审计日志

这里很容易犯一个错误：

- 把状态更新和所有后置动作放在一条长链路里串行执行

这样做的问题是：

- 主链路变长
- 超时概率上升
- 一旦部分下游失败，回滚很复杂
- 很难保证多个下游动作都具备同样的事务边界

更合理的做法通常是：

1. 先完成订单主状态更新
2. 再发布领域事件，例如 `OrderPaid` 或 `OrderCancelled`
3. 由库存、营销、通知等服务独立消费
4. 每个下游服务自己做好幂等

所以主状态机负责的是“主事实”，下游动作负责的是“副作用”。

## 数据模型建议

下面是一版更贴近生产环境的订单表设计思路：

```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  status VARCHAR(32) NOT NULL,
  pay_status VARCHAR(32) NOT NULL,
  refund_status VARCHAR(32) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  create_time DATETIME NOT NULL,
  expire_at DATETIME NULL,
  pay_time DATETIME NULL,
  cancel_time DATETIME NULL,
  finish_time DATETIME NULL,
  update_time DATETIME NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  KEY idx_status_expire_at (status, expire_at)
);
```

这个模型背后的思路是：

- `status` 负责订单生命周期主线
- `pay_status` 和 `refund_status` 拆出支付与退款维度
- `expire_at` 支持超时任务和补偿任务
- `version` 可以作为额外乐观锁字段，但不能替代状态条件更新

## 常见反模式

### 1. 先查后改

这是最经典的问题。

- 两个线程都查到旧状态
- 再各自执行更新
- 竞争窗口天然存在

### 2. 只靠分布式锁，不靠条件更新

锁可以减压，但不能替代最终一致性屏障。

因为锁可能：

- 过期
- 误删
- 重入不当
- 在异常网络下表现不稳定

### 3. 一个状态字段塞进所有语义

这会导致：

- 状态爆炸
- 语义不清
- 流转规则难以维护

### 4. 状态更新成功后同步串行调用所有下游

这会让主链路过长，也会把副作用和主事实强耦合在一起。

### 5. 只做主状态幂等，不做下游幂等

即使订单主状态只更新一次，下游库存、优惠券、通知仍然可能因为消息重投被处理多次。

## 面试回答模板

如果面试官问“订单状态机怎么设计”，可以按下面的思路回答：

> 订单系统里的状态字段不能只是一个展示枚举，而应该设计成真正的状态机。  
> 核心不只是有哪些状态，而是要定义清楚哪些状态可以合法流转、哪些动作触发流转，以及如何保证并发下流转仍然正确。  
> 工程上最关键的是把状态机规则落到数据库条件更新里，比如支付成功和超时取消都只能从 `PENDING_PAY` 出发。这样支付与取消并发时，谁先更新成功谁赢，另一方自然失败退出。  
> 对于库存回滚、退券、通知这些后置动作，我会放到状态更新成功之后，通过领域事件异步处理，并在下游分别做幂等。  
> 所以订单状态机的核心不是“状态字段怎么命名”，而是“状态流转规则 + 原子更新 + 幂等补偿”。

如果继续追问，可以顺着讲：

1. 为什么不建议先查后改
2. 为什么分布式锁不能替代条件更新
3. 为什么要把主状态和支付、退款等子状态拆开
4. 为什么后置动作应事件化异步处理

## 落地检查清单

### 1. 状态设计

- 主状态是否足够少而稳定
- 是否避免把所有局部流程都塞进一个状态字段
- 是否区分了主状态和支付、退款、履约等子状态

### 2. 流转规则

- 是否明确列出合法流转关系
- 是否禁止了不应发生的回退或跨跳
- 是否把异常场景也纳入了流转设计

### 3. 一致性

- 是否所有关键流转都采用条件更新
- 是否避免了“先查后改”
- 是否对支付、取消、退款并发做了竞争收敛设计

### 4. 副作用处理

- 库存、优惠券、通知是否通过事件异步化
- 下游是否具备幂等能力
- 是否有失败重试与补偿机制

### 5. 可恢复性

- 是否有状态变更日志或事件表
- 是否能对异常状态做补偿收敛
- 是否具备对账或回查能力

## 结论

订单状态机设计的核心，从来都不是状态名字取什么，而是：

- 状态是否足够清晰
- 流转是否足够严格
- 并发下是否能正确收敛
- 副作用是否被合理解耦

对于订单系统来说，最值得记住的一句话是：

> 真正可靠的订单状态机，不是代码里写了几个 `if`，而是把业务规则落成了可校验的状态流转和原子更新。

## 相关阅读

- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
- [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
- [分布式事务方案对比](/architecture/distributed-transaction-comparison)
- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
