---
title: 支付系统回调幂等与补偿设计
description: 围绕支付回调、签名校验、状态机收口、主动查询与对账补偿，系统讲清支付结果一致性设计。
---

# 支付系统回调幂等与补偿设计

## 适合人群

- 正在设计支付、退款、清结算等资金链路的后端工程师
- 想把“收支付回调”升级成完整一致性方案的开发者
- 准备支付系统相关面试或架构评审的人

## 学习目标

- 理解为什么支付回调天然要求幂等、补偿和状态机收口
- 掌握签名校验、重复通知处理、终态不可逆等核心原则
- 能设计一条更适合生产环境的支付结果确认链路

## 快速导航

- [为什么支付回调比普通回调更敏感](#为什么支付回调比普通回调更敏感)
- [先分清同步返回和异步通知](#先分清同步返回和异步通知)
- [支付回调到底会出什么问题](#支付回调到底会出什么问题)
- [核心原则](#核心原则)
- [推荐处理链路](#推荐处理链路)
- [为什么状态机收口是关键](#为什么状态机收口是关键)
- [为什么不能只相信回调](#为什么不能只相信回调)
- [主动查询与对账补偿怎么配合](#主动查询与对账补偿怎么配合)
- [数据模型建议](#数据模型建议)
- [常见反模式](#常见反模式)
- [面试回答模板](#面试回答模板)
- [落地检查清单](#落地检查清单)
- [结论](#结论)

## 为什么支付回调比普通回调更敏感

很多系统都有回调，但支付回调和普通业务 Webhook 最大的区别在于：

- 回调结果直接影响资金和订单状态
- 错一次不是“通知发重了”，而是可能出现资损

支付回调如果处理不好，常见后果包括：

- 已支付订单没有入账
- 未支付订单被误标记为成功
- 同一笔支付被重复处理
- 已退款订单又被当成成功支付
- 对账时发现渠道和本地记录长期不一致

所以支付回调的本质从来不是“接个 HTTP 请求”，而是：

> 用一条不完全可靠的外部通知，去驱动本地状态机正确收敛。

## 先分清同步返回和异步通知

支付系统里有两个很容易被混淆的结果来源：

- 同步返回
- 异步通知

### 1. 同步返回

同步返回通常来自：

- 用户支付完成后浏览器跳转
- 收银台或 SDK 的即时返回

它的特点是：

- 快
- 方便前端展示
- 但不适合作为最终资金状态依据

因为：

- 用户可能中途断网
- 页面可能没有成功跳转
- 返回结果可能只是“提交成功”，不代表清算成功

### 2. 异步通知

异步通知是渠道主动推送给商户系统的后台结果。

它通常更接近真正的支付结果，但也仍然不是“绝对完美”的：

- 通知可能重复
- 通知可能乱序
- 通知可能丢失
- 通知内容可能需要再次验签和验真

所以一个很稳的原则是：

- 同步返回用于优化体验
- 异步通知用于驱动主状态收口
- 主动查询和对账用于补偿兜底

## 支付回调到底会出什么问题

支付回调最常见的问题通常有五类。

### 1. 重复通知

渠道为了保证通知尽量送达，通常会多次重试。

所以：

- 同一笔支付成功通知到 2 次、3 次、5 次都很常见

### 2. 乱序通知

在退款、支付失败重试、关闭订单等场景中，不同事件的到达顺序不一定等于真实业务顺序。

### 3. 假通知

如果没有做好：

- 签名校验
- 商户号校验
- 金额校验
- 订单号匹配

那么系统可能被伪造请求攻击。

### 4. 通知丢失

渠道即使提供重试，也不能假设永远送达成功。

所以不能把“是否收到通知”当成唯一真相来源。

### 5. 本地处理半成功

例如：

- 本地已经把支付单改成成功
- 但后续订单更新、库存确认、通知下游失败

这时还需要依赖事件化、补偿和对账继续收敛。

## 核心原则

如果把支付回调设计浓缩成几条最值得记住的原则，大概就是：

- 回调先验签，不通过直接拒绝
- 回调先幂等，再处理业务
- 支付状态必须通过状态机收口
- 终态不可逆，不能随意覆盖
- 不能只靠被动通知，还要有主动查询和对账

可以把它收成一句话：

> 支付回调设计的本质，是“通知优先、状态机收口、主动查询补偿、对账兜底”。

## 推荐处理链路

一条更稳妥的支付回调处理链路通常如下：

<div class="mermaid-svg-wrapper">

<svg id="m17758337939330" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 492.5390625px;" viewBox="0 0 492.5390625 1222" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337939330{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337939330 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337939330 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337939330 .error-icon{fill:#552222;}#m17758337939330 .error-text{fill:#552222;stroke:#552222;}#m17758337939330 .edge-thickness-normal{stroke-width:1px;}#m17758337939330 .edge-thickness-thick{stroke-width:3.5px;}#m17758337939330 .edge-pattern-solid{stroke-dasharray:0;}#m17758337939330 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337939330 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337939330 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337939330 .marker{fill:#666;stroke:#666;}#m17758337939330 .marker.cross{stroke:#666;}#m17758337939330 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337939330 p{margin:0;}#m17758337939330 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337939330 .cluster-label text{fill:#333;}#m17758337939330 .cluster-label span{color:#333;}#m17758337939330 .cluster-label span p{background-color:transparent;}#m17758337939330 .label text,#m17758337939330 span{fill:#000000;color:#000000;}#m17758337939330 .node rect,#m17758337939330 .node circle,#m17758337939330 .node ellipse,#m17758337939330 .node polygon,#m17758337939330 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337939330 .rough-node .label text,#m17758337939330 .node .label text,#m17758337939330 .image-shape .label,#m17758337939330 .icon-shape .label{text-anchor:middle;}#m17758337939330 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337939330 .rough-node .label,#m17758337939330 .node .label,#m17758337939330 .image-shape .label,#m17758337939330 .icon-shape .label{text-align:center;}#m17758337939330 .node.clickable{cursor:pointer;}#m17758337939330 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337939330 .arrowheadPath{fill:#333333;}#m17758337939330 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337939330 .flowchart-link{stroke:#666;fill:none;}#m17758337939330 .edgeLabel{background-color:white;text-align:center;}#m17758337939330 .edgeLabel p{background-color:white;}#m17758337939330 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337939330 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337939330 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337939330 .cluster text{fill:#333;}#m17758337939330 .cluster span{color:#333;}#m17758337939330 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337939330 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337939330 rect.text{fill:none;stroke-width:0;}#m17758337939330 .icon-shape,#m17758337939330 .image-shape{background-color:white;text-align:center;}#m17758337939330 .icon-shape p,#m17758337939330 .image-shape p{background-color:white;padding:2px;}#m17758337939330 .icon-shape .label rect,#m17758337939330 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337939330 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337939330 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337939330 .node .neo-node{stroke:#999;}#m17758337939330 [data-look="neo"].node rect,#m17758337939330 [data-look="neo"].cluster rect,#m17758337939330 [data-look="neo"].node polygon{stroke:url(#m17758337939330-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337939330 [data-look="neo"].node path{stroke:url(#m17758337939330-gradient);stroke-width:1px;}#m17758337939330 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337939330 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337939330 [data-look="neo"].node circle{stroke:url(#m17758337939330-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337939330 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337939330 [data-look="neo"].icon-shape .icon{fill:url(#m17758337939330-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337939330 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337939330-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337939330 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337939330_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337939330_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337939330_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337939330_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337939330_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337939330_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337939330_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337939330_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337939330_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337939330_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337939330_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337939330_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M128.031,62L128.031,66.167C128.031,70.333,128.031,78.667,128.031,86.333C128.031,94,128.031,101,128.031,104.5L128.031,108" id="m17758337939330-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTI4LjAzMTI1LCJ5Ijo2Mn0seyJ4IjoxMjguMDMxMjUsInkiOjg3fSx7IngiOjEyOC4wMzEyNSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M128.031,166L128.031,170.167C128.031,174.333,128.031,182.667,128.031,190.333C128.031,198,128.031,205,128.031,208.5L128.031,212" id="m17758337939330-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTI4LjAzMTI1LCJ5IjoxNjZ9LHsieCI6MTI4LjAzMTI1LCJ5IjoxOTF9LHsieCI6MTI4LjAzMTI1LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M128.031,270L128.031,274.167C128.031,278.333,128.031,286.667,134.713,294.668C141.394,302.67,154.757,310.339,161.438,314.174L168.12,318.009" id="m17758337939330-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6MTI4LjAzMTI1LCJ5IjoyNzB9LHsieCI6MTI4LjAzMTI1LCJ5IjoyOTV9LHsieCI6MTcxLjU4ODk4OTI1NzgxMjUsInkiOjMyMH1d" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M239.539,398L239.539,402.167C239.539,406.333,239.539,414.667,239.539,422.333C239.539,430,239.539,437,239.539,440.5L239.539,444" id="m17758337939330-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6MjM5LjUzOTA2MjUsInkiOjM5OH0seyJ4IjoyMzkuNTM5MDYyNSwieSI6NDIzfSx7IngiOjIzOS41MzkwNjI1LCJ5Ijo0NDh9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M239.539,502L239.539,506.167C239.539,510.333,239.539,518.667,239.539,526.333C239.539,534,239.539,541,239.539,544.5L239.539,548" id="m17758337939330-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6MjM5LjUzOTA2MjUsInkiOjUwMn0seyJ4IjoyMzkuNTM5MDYyNSwieSI6NTI3fSx7IngiOjIzOS41MzkwNjI1LCJ5Ijo1NTJ9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M184.608,775.069L174.596,790.391C164.585,805.712,144.562,836.356,134.551,857.178C124.539,878,124.539,889,124.539,894.5L124.539,900" id="m17758337939330-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MTg0LjYwNzc5MTAyMjMzNjc4LCJ5Ijo3NzUuMDY4NzI4NTIyMzM2OH0seyJ4IjoxMjQuNTM5MDYyNSwieSI6ODY3fSx7IngiOjEyNC41MzkwNjI1LCJ5Ijo5MDR9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M294.47,775.069L304.482,790.391C314.493,805.712,334.516,836.356,344.528,857.178C354.539,878,354.539,889,354.539,894.5L354.539,900" id="m17758337939330-L_F_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_H_0" data-points="W3sieCI6Mjk0LjQ3MDMzMzk3NzY2MzI0LCJ5Ijo3NzUuMDY4NzI4NTIyMzM2OH0seyJ4IjozNTQuNTM5MDYyNSwieSI6ODY3fSx7IngiOjM1NC41MzkwNjI1LCJ5Ijo5MDR9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M354.539,958L354.539,962.167C354.539,966.333,354.539,974.667,354.539,982.333C354.539,990,354.539,997,354.539,1000.5L354.539,1004" id="m17758337939330-L_H_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_I_0" data-points="W3sieCI6MzU0LjUzOTA2MjUsInkiOjk1OH0seyJ4IjozNTQuNTM5MDYyNSwieSI6OTgzfSx7IngiOjM1NC41MzkwNjI1LCJ5IjoxMDA4fV0=" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M354.539,1086L354.539,1090.167C354.539,1094.333,354.539,1102.667,354.539,1110.333C354.539,1118,354.539,1125,354.539,1128.5L354.539,1132" id="m17758337939330-L_I_J_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_J_0" data-points="W3sieCI6MzU0LjUzOTA2MjUsInkiOjEwODZ9LHsieCI6MzU0LjUzOTA2MjUsInkiOjExMTF9LHsieCI6MzU0LjUzOTA2MjUsInkiOjExMzZ9XQ==" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path><path d="M351.047,270L351.047,274.167C351.047,278.333,351.047,286.667,344.365,294.668C337.684,302.67,324.321,310.339,317.64,314.174L310.958,318.009" id="m17758337939330-L_K_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_K_D_0" data-points="W3sieCI6MzUxLjA0Njg3NSwieSI6MjcwfSx7IngiOjM1MS4wNDY4NzUsInkiOjI5NX0seyJ4IjozMDcuNDg5MTM1NzQyMTg3NSwieSI6MzIwfV0=" data-look="classic" marker-end="url(#m17758337939330_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(124.5390625, 867)"><g class="label" data-id="L_F_G_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(354.5390625, 867)"><g class="label" data-id="L_F_H_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_H_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_I_J_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_K_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337939330-flowchart-A-0" data-look="classic" transform="translate(128.03125, 35)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>渠道异步通知</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-B-1" data-look="classic" transform="translate(128.03125, 139)"><rect class="basic label-container" style="" x="-120.03125" y="-27" width="240.0625" height="54"></rect><g class="label" style="" transform="translate(-90.03125, -12)"><rect></rect><foreignObject width="180.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>签名 / 商户号 / 金额校验</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-C-3" data-look="classic" transform="translate(128.03125, 243)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写回调日志</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-D-5" data-look="classic" transform="translate(239.5390625, 359)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>根据 business_id / order_id 查支付单</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-E-7" data-look="classic" transform="translate(239.5390625, 475)"><rect class="basic label-container" style="" x="-94" y="-27" width="188" height="54"></rect><g class="label" style="" transform="translate(-64, -12)"><rect></rect><foreignObject width="128" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>幂等与状态机校验</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-F-9" data-look="classic" transform="translate(239.5390625, 691)"><polygon points="139,0 278,-139 139,-278 0,-139" class="label-container" transform="translate(-138.5, 139)"></polygon><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>是否允许流转到 SUCCESS / FAIL?</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-G-11" data-look="classic" transform="translate(124.5390625, 931)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>直接幂等返回</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-H-13" data-look="classic" transform="translate(354.5390625, 931)"><rect class="basic label-container" style="" x="-102" y="-27" width="204" height="54"></rect><g class="label" style="" transform="translate(-72, -12)"><rect></rect><foreignObject width="144" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>条件更新支付单状态</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-I-15" data-look="classic" transform="translate(354.5390625, 1047)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>写 Outbox / 发送 PaymentSucceeded 事件</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-J-17" data-look="classic" transform="translate(354.5390625, 1175)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>订单、库存、通知等下游异步处理</p></span></div></foreignObject></g></g><g class="node default" id="m17758337939330-flowchart-K-18" data-look="classic" transform="translate(351.046875, 243)"><rect class="basic label-container" style="" x="-103.015625" y="-27" width="206.03125" height="54"></rect><g class="label" style="" transform="translate(-73.015625, -12)"><rect></rect><foreignObject width="146.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>主动查询 / 对账任务</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337939330-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337939330-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337939330-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

这个流程背后的核心思想是：

1. 外部通知先做安全校验
2. 再统一进入本地支付状态机
3. 再由支付状态驱动订单、库存、通知等下游
4. 主动查询和对账负责补齐漏通知或异常状态

## 为什么状态机收口是关键

支付回调最怕的不是“收不到”，而是“收到了很多次、很多种、很多顺序”。

所以真正稳定的设计不是：

- 每种来源都各自改一遍状态

而是：

- 无论同步返回、异步通知、主动查询还是对账结果，最终都走同一套状态流转逻辑

例如支付单状态可以设计为：

- `INIT`
- `PAYING`
- `SUCCESS`
- `FAIL`
- `CLOSED`

其中：

- `SUCCESS` 是终态
- `FAIL` 或 `CLOSED` 也通常应视为终态

典型更新 SQL 仍然应该是条件更新：

```sql
UPDATE payment_order
SET status = 'SUCCESS',
    channel_trade_no = ?,
    paid_at = ?,
    update_time = NOW()
WHERE payment_id = ?
  AND status IN ('INIT', 'PAYING');
```

这样做的意义是：

- 重复通知不会重复改状态
- 已终态不会被随意覆盖
- 并发到达时天然收敛到一个结果

## 为什么不能只相信回调

即使你已经有：

- 签名校验
- 幂等
- 状态机

也仍然不能把回调当成唯一结果来源。

原因很简单：

- 渠道通知可能丢
- 网络可能中断
- 商户系统可能短时不可用

这时候如果没有主动查询，系统就会出现：

- 用户已经付款成功
- 本地订单却一直显示未支付

这就是支付系统里最危险的一种“假失败”。

所以比较稳妥的做法通常是：

- 通知优先
- 查询补偿
- 对账兜底

## 主动查询与对账补偿怎么配合

### 1. 主动查询

主动查询通常用于处理短周期未确认状态，例如：

- 支付单长时间停留在 `PAYING`
- 渠道通知迟迟没来

此时系统主动调用渠道查询接口，确认这笔交易的真实状态。

这类查询更适合：

- 分钟级
- 准实时补偿

### 2. 对账

对账是最后一道资金安全防线。

它通常不是为了“替代通知”，而是为了处理：

- 极端漏通知
- 长时间未收敛状态
- 渠道和本地账实不一致

对账的输出通常包括：

- 渠道成功、本地失败 -> 补记成功
- 本地成功、渠道无单 -> 人工复核或补偿回滚
- 金额不一致 -> 风险告警

一句话记忆：

- 主动查询处理“短时间没等到”
- 对账处理“长时间还不一致”

## 数据模型建议

支付系统里建议至少拆出：

- 支付单表
- 回调日志表

### 1. 支付单表

```sql
CREATE TABLE payment_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id VARCHAR(64) NOT NULL UNIQUE,
  biz_order_id VARCHAR(64) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  channel_trade_no VARCHAR(128) NULL,
  paid_at DATETIME NULL,
  update_time DATETIME NOT NULL,
  create_time DATETIME NOT NULL,
  KEY idx_biz_order_id (biz_order_id)
);
```

### 2. 回调日志表

```sql
CREATE TABLE payment_callback_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  callback_id VARCHAR(64) NOT NULL UNIQUE,
  payment_id VARCHAR(64) NOT NULL,
  channel VARCHAR(32) NOT NULL,
  raw_payload JSON NOT NULL,
  verify_result VARCHAR(16) NOT NULL,
  process_result VARCHAR(16) NOT NULL,
  error_message VARCHAR(512) NULL,
  create_time DATETIME NOT NULL,
  KEY idx_payment_id (payment_id)
);
```

回调日志表的意义非常大：

- 便于排障
- 便于追溯某次通知是否真的到过
- 便于后续重放和人工分析

## 常见反模式

### 1. 只靠前端同步返回改订单状态

这是最危险的简化之一。

同步返回只能改善用户体验，不能当最终资金结果依据。

### 2. 收到通知就直接覆盖状态

这样会让：

- 已终态被重复覆盖
- 乱序通知导致回退
- 并发场景变得不可控

### 3. 没有回调日志

没有日志时，一旦用户说“我明明付了钱”，系统排障会非常被动。

### 4. 只有被动通知，没有主动查询

这会让漏通知场景变成长期不一致。

### 5. 只有通知和查询，没有对账

支付系统最终一定要有对账闭环，否则极端资损问题没有最后一道防线。

## 面试回答模板

如果面试官问“支付回调怎么保证幂等和一致性”，可以用下面这版回答：

> 支付回调处理我会抓四件事：安全校验、幂等、状态机收口和补偿兜底。  
> 首先回调请求必须先做签名、商户号、金额和订单号校验，防止伪造通知。  
> 然后无论通知来多少次，最终都要走同一套支付状态机，例如只允许 `INIT/PAYING -> SUCCESS` 这样的条件更新，已终态直接幂等返回。  
> 支付状态更新成功后，我不会在回调接口里同步串行处理所有下游，而是通过 Outbox 或 MQ 发出支付成功事件，让订单、库存、通知等服务异步收敛。  
> 另外我不会只依赖被动通知，还会对长时间处于 `PAYING` 的订单做主动查询，最终再通过对账兜底。  
> 所以整个方案可以概括为：通知优先、状态机收口、查询补偿、对账兜底。

如果继续追问，可以顺着讲：

1. 为什么同步返回不能作为最终依据
2. 为什么回调接口必须幂等
3. 为什么终态不可逆
4. 主动查询和对账分别解决什么问题

## 落地检查清单

### 1. 安全

- 是否做了签名校验
- 是否校验商户号、订单号、金额、渠道流水号
- 是否记录原始回调报文

### 2. 幂等

- 是否有回调日志去重
- 是否有支付单条件更新
- 是否对重复通知返回一致结果

### 3. 状态机

- 是否定义了清晰的支付状态流转
- 是否禁止终态回退
- 是否让所有结果来源统一收口到同一套状态更新逻辑

### 4. 补偿

- 是否有对 `PAYING` 状态的主动查询任务
- 是否有对账机制
- 是否有异常订单人工介入通道

### 5. 下游影响

- 支付成功事件是否通过 MQ / Outbox 异步化
- 订单、库存、通知等下游是否也具备幂等
- 是否有全链路监控和告警

## 结论

支付回调设计最容易被低估的地方在于：

- 它看起来只是一个接口
- 实际上却是整个支付结果收口的入口

所以最值得记住的一句话是：

> 支付回调不是“收到结果就改状态”，而是“把不完全可靠的外部通知，收敛成可验证、可幂等、可补偿的本地终态”。

## 相关阅读

- [订单状态机设计实战](/architecture/order-state-machine-design)
- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
- [高并发支付系统专题整理](/architecture/case-studies/high-concurrency-payment-system-practice-notes)
