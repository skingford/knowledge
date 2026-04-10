---
title: 交易系统一致性设计总览
description: 从订单、库存、支付、延时任务、Outbox 与补偿出发，系统梳理交易系统里最核心的一致性设计主线。
---

# 交易系统一致性设计总览

## 适合人群

- 正在搭建交易系统知识体系的后端工程师
- 想把零散的一致性话题串成完整主线的开发者
- 准备系统设计面试、架构评审或技术分享的人

## 学习目标

- 建立交易系统一致性问题的统一认知框架
- 理解订单、库存、支付、消息与补偿之间如何协同
- 知道遇到不同一致性问题时应该优先看哪一类方案

## 快速导航

- [为什么交易系统的一致性问题总是成组出现](#为什么交易系统的一致性问题总是成组出现)
- [先建立一个总框架](#先建立一个总框架)
- [交易系统里最常见的六类一致性问题](#交易系统里最常见的六类一致性问题)
- [核心设计原则](#核心设计原则)
- [主流问题和对应专题怎么关联](#主流问题和对应专题怎么关联)
- [一个推荐的学习顺序](#一个推荐的学习顺序)
- [系统设计时的回答框架](#系统设计时的回答框架)
- [常见误区](#常见误区)
- [结论](#结论)

## 为什么交易系统的一致性问题总是成组出现

很多人第一次接触交易系统时，容易把问题拆得很散：

- 订单超时取消是一个问题
- 库存扣减是一个问题
- 支付回调是一个问题
- 消息发送是一个问题
- 对账补偿又是另一个问题

但真实系统里，这些问题很少单独出现。

例如一笔最普通的电商交易，背后往往会经过：

- 创建订单
- 预占或扣减库存
- 发起支付
- 接收支付回调
- 更新订单状态
- 超时取消未支付订单
- 释放库存
- 给下游发通知
- 最后靠补偿和对账收口

所以交易系统里的一致性问题，几乎总是成组出现的。你不太可能只解决其中一个，就让整个链路自动稳定下来。

一句话概括：

> 交易系统的一致性，从来不是某一个技术点决定的，而是订单状态机、库存规则、支付结果确认、消息可靠投递和补偿机制共同作用的结果。

## 先建立一个总框架

如果把交易系统里最重要的一致性问题放到一张图里，大致可以这样理解：

<div class="mermaid-svg-wrapper">

<svg id="m17758337945170" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 520.03125px;" viewBox="0 0 520.03125 926" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337945170{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337945170 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337945170 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337945170 .error-icon{fill:#552222;}#m17758337945170 .error-text{fill:#552222;stroke:#552222;}#m17758337945170 .edge-thickness-normal{stroke-width:1px;}#m17758337945170 .edge-thickness-thick{stroke-width:3.5px;}#m17758337945170 .edge-pattern-solid{stroke-dasharray:0;}#m17758337945170 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337945170 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337945170 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337945170 .marker{fill:#666;stroke:#666;}#m17758337945170 .marker.cross{stroke:#666;}#m17758337945170 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337945170 p{margin:0;}#m17758337945170 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337945170 .cluster-label text{fill:#333;}#m17758337945170 .cluster-label span{color:#333;}#m17758337945170 .cluster-label span p{background-color:transparent;}#m17758337945170 .label text,#m17758337945170 span{fill:#000000;color:#000000;}#m17758337945170 .node rect,#m17758337945170 .node circle,#m17758337945170 .node ellipse,#m17758337945170 .node polygon,#m17758337945170 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337945170 .rough-node .label text,#m17758337945170 .node .label text,#m17758337945170 .image-shape .label,#m17758337945170 .icon-shape .label{text-anchor:middle;}#m17758337945170 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337945170 .rough-node .label,#m17758337945170 .node .label,#m17758337945170 .image-shape .label,#m17758337945170 .icon-shape .label{text-align:center;}#m17758337945170 .node.clickable{cursor:pointer;}#m17758337945170 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337945170 .arrowheadPath{fill:#333333;}#m17758337945170 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337945170 .flowchart-link{stroke:#666;fill:none;}#m17758337945170 .edgeLabel{background-color:white;text-align:center;}#m17758337945170 .edgeLabel p{background-color:white;}#m17758337945170 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337945170 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337945170 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337945170 .cluster text{fill:#333;}#m17758337945170 .cluster span{color:#333;}#m17758337945170 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337945170 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337945170 rect.text{fill:none;stroke-width:0;}#m17758337945170 .icon-shape,#m17758337945170 .image-shape{background-color:white;text-align:center;}#m17758337945170 .icon-shape p,#m17758337945170 .image-shape p{background-color:white;padding:2px;}#m17758337945170 .icon-shape .label rect,#m17758337945170 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337945170 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337945170 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337945170 .node .neo-node{stroke:#999;}#m17758337945170 [data-look="neo"].node rect,#m17758337945170 [data-look="neo"].cluster rect,#m17758337945170 [data-look="neo"].node polygon{stroke:url(#m17758337945170-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337945170 [data-look="neo"].node path{stroke:url(#m17758337945170-gradient);stroke-width:1px;}#m17758337945170 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337945170 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337945170 [data-look="neo"].node circle{stroke:url(#m17758337945170-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337945170 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337945170 [data-look="neo"].icon-shape .icon{fill:url(#m17758337945170-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337945170 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337945170-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337945170 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337945170_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337945170_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337945170_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337945170_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337945170_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337945170_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337945170_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337945170_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337945170_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337945170_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337945170_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337945170_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M217.031,62L217.031,66.167C217.031,70.333,217.031,78.667,217.031,86.333C217.031,94,217.031,101,217.031,104.5L217.031,108" id="m17758337945170-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MjE3LjAzMTI1LCJ5Ijo2Mn0seyJ4IjoyMTcuMDMxMjUsInkiOjg3fSx7IngiOjIxNy4wMzEyNSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M217.031,166L217.031,170.167C217.031,174.333,217.031,182.667,217.031,195.5C217.031,208.333,217.031,225.667,217.031,243C217.031,260.333,217.031,277.667,217.031,295C217.031,312.333,217.031,329.667,217.031,347C217.031,364.333,217.031,381.667,217.031,401C217.031,420.333,217.031,441.667,217.031,463C217.031,484.333,217.031,505.667,217.031,525C217.031,544.333,217.031,561.667,217.031,579C217.031,596.333,217.031,613.667,223.078,626.145C229.124,638.622,241.218,646.245,247.264,650.056L253.311,653.867" id="m17758337945170-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MjE3LjAzMTI1LCJ5IjoxNjZ9LHsieCI6MjE3LjAzMTI1LCJ5IjoxOTF9LHsieCI6MjE3LjAzMTI1LCJ5IjoyNDN9LHsieCI6MjE3LjAzMTI1LCJ5IjoyOTV9LHsieCI6MjE3LjAzMTI1LCJ5IjozNDd9LHsieCI6MjE3LjAzMTI1LCJ5IjozOTl9LHsieCI6MjE3LjAzMTI1LCJ5Ijo0NjN9LHsieCI6MjE3LjAzMTI1LCJ5Ijo1Mjd9LHsieCI6MjE3LjAzMTI1LCJ5Ijo1Nzl9LHsieCI6MjE3LjAzMTI1LCJ5Ijo2MzF9LHsieCI6MjU2LjY5NDcxMTUzODQ2MTU1LCJ5Ijo2NTZ9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M155.031,165.423L145.029,169.686C135.026,173.949,115.021,182.474,105.018,190.237C95.016,198,95.016,205,95.016,208.5L95.016,212" id="m17758337945170-L_B_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_D_0" data-points="W3sieCI6MTU1LjAzMTI1LCJ5IjoxNjUuNDIyODQ1NDM0NzU0Nzh9LHsieCI6OTUuMDE1NjI1LCJ5IjoxOTF9LHsieCI6OTUuMDE1NjI1LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M279.031,158.539L296.198,163.949C313.365,169.36,347.698,180.18,364.865,189.09C382.031,198,382.031,205,382.031,208.5L382.031,212" id="m17758337945170-L_B_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_E_0" data-points="W3sieCI6Mjc5LjAzMTI1LCJ5IjoxNTguNTM5MzkzOTM5MzkzOTN9LHsieCI6MzgyLjAzMTI1LCJ5IjoxOTF9LHsieCI6MzgyLjAzMTI1LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M382.031,270L382.031,274.167C382.031,278.333,382.031,286.667,382.031,294.333C382.031,302,382.031,309,382.031,312.5L382.031,316" id="m17758337945170-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6MzgyLjAzMTI1LCJ5IjoyNzB9LHsieCI6MzgyLjAzMTI1LCJ5IjoyOTV9LHsieCI6MzgyLjAzMTI1LCJ5IjozMjB9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M382.031,374L382.031,378.167C382.031,382.333,382.031,390.667,382.031,398.333C382.031,406,382.031,413,382.031,416.5L382.031,420" id="m17758337945170-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MzgyLjAzMTI1LCJ5IjozNzR9LHsieCI6MzgyLjAzMTI1LCJ5IjozOTl9LHsieCI6MzgyLjAzMTI1LCJ5Ijo0MjR9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M382.031,502L382.031,506.167C382.031,510.333,382.031,518.667,382.031,526.333C382.031,534,382.031,541,382.031,544.5L382.031,548" id="m17758337945170-L_G_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_H_0" data-points="W3sieCI6MzgyLjAzMTI1LCJ5Ijo1MDJ9LHsieCI6MzgyLjAzMTI1LCJ5Ijo1Mjd9LHsieCI6MzgyLjAzMTI1LCJ5Ijo1NTJ9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M382.031,606L382.031,610.167C382.031,614.333,382.031,622.667,375.985,630.645C369.938,638.622,357.845,646.245,351.798,650.056L345.752,653.867" id="m17758337945170-L_H_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_C_0" data-points="W3sieCI6MzgyLjAzMTI1LCJ5Ijo2MDZ9LHsieCI6MzgyLjAzMTI1LCJ5Ijo2MzF9LHsieCI6MzQyLjM2Nzc4ODQ2MTUzODQ1LCJ5Ijo2NTZ9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M299.531,710L299.531,714.167C299.531,718.333,299.531,726.667,299.531,734.333C299.531,742,299.531,749,299.531,752.5L299.531,756" id="m17758337945170-L_C_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_I_0" data-points="W3sieCI6Mjk5LjUzMTI1LCJ5Ijo3MTB9LHsieCI6Mjk5LjUzMTI1LCJ5Ijo3MzV9LHsieCI6Mjk5LjUzMTI1LCJ5Ijo3NjB9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path><path d="M299.531,814L299.531,818.167C299.531,822.333,299.531,830.667,299.531,838.333C299.531,846,299.531,853,299.531,856.5L299.531,860" id="m17758337945170-L_I_J_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_J_0" data-points="W3sieCI6Mjk5LjUzMTI1LCJ5Ijo4MTR9LHsieCI6Mjk5LjUzMTI1LCJ5Ijo4Mzl9LHsieCI6Mjk5LjUzMTI1LCJ5Ijo4NjR9XQ==" data-look="classic" marker-end="url(#m17758337945170_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_G_H_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_H_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_I_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_I_J_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337945170-flowchart-A-0" data-look="classic" transform="translate(217.03125, 35)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>用户下单</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-B-1" data-look="classic" transform="translate(217.03125, 139)"><rect class="basic label-container" style="" x="-62" y="-27" width="124" height="54"></rect><g class="label" style="" transform="translate(-32, -12)"><rect></rect><foreignObject width="64" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单服务</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-C-3" data-look="classic" transform="translate(299.53125, 683)"><rect class="basic label-container" style="" x="-70" y="-27" width="140" height="54"></rect><g class="label" style="" transform="translate(-40, -12)"><rect></rect><foreignObject width="80" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单状态机</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-D-5" data-look="classic" transform="translate(95.015625, 243)"><rect class="basic label-container" style="" x="-87.015625" y="-27" width="174.03125" height="54"></rect><g class="label" style="" transform="translate(-57.015625, -12)"><rect></rect><foreignObject width="114.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>库存冻结 / 扣减</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-E-7" data-look="classic" transform="translate(382.03125, 243)"><rect class="basic label-container" style="" x="-96.7109375" y="-27" width="193.421875" height="54"></rect><g class="label" style="" transform="translate(-66.7109375, -12)"><rect></rect><foreignObject width="133.421875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Outbox / 事件投递</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-F-9" data-look="classic" transform="translate(382.03125, 347)"><rect class="basic label-container" style="" x="-111.015625" y="-27" width="222.03125" height="54"></rect><g class="label" style="" transform="translate(-81.015625, -12)"><rect></rect><foreignObject width="162.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>消息队列 / 延时触发层</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-G-11" data-look="classic" transform="translate(382.03125, 463)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>支付、库存、通知等下游服务</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-H-13" data-look="classic" transform="translate(382.03125, 579)"><rect class="basic label-container" style="" x="-103.015625" y="-27" width="206.03125" height="54"></rect><g class="label" style="" transform="translate(-73.015625, -12)"><rect></rect><foreignObject width="146.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>支付回调 / 异步结果</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-I-17" data-look="classic" transform="translate(299.53125, 787)"><rect class="basic label-container" style="" x="-128.03125" y="-27" width="256.0625" height="54"></rect><g class="label" style="" transform="translate(-98.03125, -12)"><rect></rect><foreignObject width="196.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>超时取消 / 退款 / 释放库存</p></span></div></foreignObject></g></g><g class="node default" id="m17758337945170-flowchart-J-19" data-look="classic" transform="translate(299.53125, 891)"><rect class="basic label-container" style="" x="-128.03125" y="-27" width="256.0625" height="54"></rect><g class="label" style="" transform="translate(-98.03125, -12)"><rect></rect><foreignObject width="196.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>补偿任务 / 主动查询 / 对账</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337945170-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337945170-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337945170-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

这张图想表达的核心不是“组件清单”，而是几层分工：

- `状态机层`
  - 决定本地业务状态能不能合法流转
- `资源控制层`
  - 负责库存冻结、扣减、释放等资源动作
- `事件传播层`
  - 负责把本地事实可靠传播到下游
- `结果收口层`
  - 负责把支付通知、主动查询、对账结果统一收敛
- `补偿恢复层`
  - 负责在主路径不完美时把系统拉回一致

## 交易系统里最常见的六类一致性问题

### 1. 本地状态怎么合法流转

最基础的问题是：

- 订单什么时候能从待支付变成已支付
- 什么时候能从待支付变成已取消
- 已支付后还能不能直接改成取消

这类问题的核心是：

- `状态机设计`
- `条件更新`
- `终态不可逆`

对应专题：

- [订单状态机设计实战](/architecture/order-state-machine-design)

### 2. 延时任务怎么可靠触发

例如：

- 30 分钟未支付自动取消
- 10 分钟未回调主动查询
- 订单超时释放库存

这类问题的核心是：

- `延时触发效率`
- `到期后回库校验`
- `补偿扫表`

对应专题：

- [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
- [延时任务方案对比](/architecture/delayed-task-solution-comparison)

### 3. 本地写库和发消息怎么保证最终一致

例如：

- 订单创建成功后要发 `OrderCreated`
- 支付成功后要发 `PaymentSucceeded`
- 订单取消后要发 `OrderCancelled`

这类问题的核心是：

- `Outbox`
- `事务消息`
- `重试与幂等`

对应专题：

- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)

### 4. 订单和库存如何协同

例如：

- 订单创建成功但库存没扣
- 库存冻结成功但订单创建失败
- 超时取消后库存没释放
- 秒杀高峰下热点 SKU 被打爆

这类问题的核心是：

- `防超卖`
- `冻结库存 / 预扣减`
- `订单与库存的补偿收敛`

对应专题：

- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)

### 5. 支付结果如何最终确认

例如：

- 渠道通知重复
- 渠道通知丢失
- 同步返回和异步通知不一致
- 本地显示未支付，但渠道已经成功扣款

这类问题的核心是：

- `回调验签`
- `幂等处理`
- `状态机收口`
- `主动查询`
- `对账补偿`

对应专题：

- [支付系统回调幂等与补偿设计](/architecture/payment-callback-idempotency-and-compensation)

### 6. 整体链路如何在失败后恢复

交易系统不可能假设：

- 消息永远不丢
- 回调永远能到
- 网络永远稳定
- 服务永远不重启

所以所有交易系统最终都会回到两个问题：

- 失败后怎么补偿
- 长时间不一致时怎么对账

这也是为什么几乎所有高质量交易架构最终都会包含：

- `补偿任务`
- `主动查询`
- `对账系统`

## 核心设计原则

如果把交易系统一致性设计浓缩成几条原则，最值得记住的大致是下面这些。

### 1. 数据库状态机负责本地正确性

无论上层来自：

- 支付回调
- MQ 事件
- 延时任务
- 主动查询
- 对账结果

最终落到本地时，都应该经过数据库状态机条件更新。

### 2. 资源修改必须有原子屏障

例如库存扣减，不能：

- 先查再扣

而必须：

- 用一条带条件的更新做原子扣减

### 3. 消息传播必须假设会失败

所以“写库后顺手发消息”不够，必须考虑：

- Outbox
- 事务消息
- 重试
- 补偿

### 4. 所有外部通知都必须假设会重复

支付回调、库存事件、延时触发消息都一样：

- 默认会重复
- 默认可能乱序
- 默认可能丢

因此幂等不是“优化项”，而是主设计的一部分。

### 5. 补偿不是兜底附件，而是主方案组成部分

交易链路一旦跨服务，补偿就必须被前置考虑，而不是出事故后才想起来补。

## 主流问题和对应专题怎么关联

下面这张表可以直接当作这组专题的导航图。

| 问题类型 | 最核心的问题 | 优先看哪篇 |
| --- | --- | --- |
| 交易平台全景 | 多活、限流、订单、库存、支付和发布治理怎么串成一套生产方案 | [电商交易平台生产级架构深度设计](/architecture/ecommerce-transaction-platform-production-architecture) |
| 订单状态流转 | 怎么防止状态被乱改、回退、并发覆盖 | [订单状态机设计实战](/architecture/order-state-machine-design) |
| 订单超时关闭 | 延时任务怎么可靠触发、丢了怎么办 | [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel) |
| 延时方案选型 | MQ、Redis、时间轮分别适合什么 | [延时任务方案对比](/architecture/delayed-task-solution-comparison) |
| 写库发消息一致性 | 业务成功了消息没发出去怎么办 | [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design) |
| 库存和订单协同 | 超卖、冻结、补偿和高并发怎么处理 | [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design) |
| 活动洪峰治理 | 秒杀入口怎么限流、排队、背压和降级 | [秒杀系统限流、削峰与降级设计](/architecture/seckill-system-rate-limiting-and-degradation) |
| 支付结果收口 | 回调、查询、对账怎么统一收敛 | [支付系统回调幂等与补偿设计](/architecture/payment-callback-idempotency-and-compensation) |

## 一个推荐的学习顺序

如果你想把这条线系统补起来，建议按下面顺序读：

1. 先看 [电商交易平台生产级架构深度设计](/architecture/ecommerce-transaction-platform-production-architecture)
   - 先把多活、限流、订单、库存、支付、数据层和发布治理放进同一张全景图
2. 再看 [订单状态机设计实战](/architecture/order-state-machine-design)
   - 先把“本地状态怎么合法流转”搞清楚
3. 再看 [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
   - 理解延时任务和订单状态机怎么配合
4. 然后看 [延时任务方案对比](/architecture/delayed-task-solution-comparison)
   - 把 RocketMQ、RabbitMQ、Redis ZSet、时间轮的边界区分清楚
5. 再看 [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
   - 把“本地事实怎么可靠发给下游”讲清楚
6. 再看 [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
   - 把订单、库存和补偿收口到交易主链路里
7. 再看 [秒杀系统限流、削峰与降级设计](/architecture/seckill-system-rate-limiting-and-degradation)
   - 把热点活动里的限流、排队、背压和降级策略串进高并发主链路
8. 最后看 [支付系统回调幂等与补偿设计](/architecture/payment-callback-idempotency-and-compensation)
   - 把外部支付结果、主动查询和对账补齐

按这个顺序读，比较容易形成一个从本地一致性到分布式一致性的完整闭环。

## 系统设计时的回答框架

如果在面试或评审中被问到“怎么设计一个交易系统的一致性方案”，可以按下面结构回答：

### 第一步：先讲业务主链路

- 下单
- 扣库存
- 支付
- 更新订单
- 通知下游

### 第二步：再讲本地状态收口

- 订单状态机
- 支付状态机
- 条件更新

### 第三步：再讲跨服务传播

- Outbox / MQ
- 延时任务
- 事件驱动

### 第四步：再讲失败恢复

- 补偿任务
- 主动查询
- 对账兜底

### 第五步：最后讲高并发问题

- 防超卖
- 热点行竞争
- 幂等
- 限流与削峰
- 背压与降级

这个结构的好处是：

- 不会一上来就陷入某个技术细节
- 能让面试官看到你有全链路一致性视角

## 常见误区

### 1. 只谈消息，不谈状态机

消息只是传播手段，最终状态是否能正确落地，还是取决于本地状态机。

### 2. 只谈本地事务，不谈补偿

一旦跨服务，本地事务就不够了，补偿必须前置设计。

### 3. 只谈延时触发，不谈回库校验

时间到了不代表一定能执行，最终还是要回库确认真实状态。

### 4. 只谈支付回调，不谈主动查询和对账

支付结果收口不能把所有正确性都压在“通知一定到达”这个假设上。

### 5. 只谈正常路径，不谈失败路径

交易系统最值钱的设计，通常都在异常和失败分支里。

## 结论

交易系统一致性设计，不是几个分散问题的堆砌，而是一整套相互配合的机制：

- 状态机负责本地正确性
- 条件更新负责并发收敛
- Outbox 和 MQ 负责可靠传播
- 延时任务负责时间驱动
- 库存方案负责资源控制
- 回调、查询、对账负责结果收口
- 补偿任务负责把不完美系统拉回一致

所以最值得记住的一句话是：

> 交易系统的一致性，不是某一层单独保证出来的，而是状态机、消息、资源控制和补偿机制共同收敛出来的。

## 相关阅读

- [电商交易平台生产级架构深度设计](/architecture/ecommerce-transaction-platform-production-architecture)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
- [延时任务方案对比](/architecture/delayed-task-solution-comparison)
- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
- [秒杀系统库存设计专题](/architecture/seckill-system-inventory-design)
- [秒杀系统限流、削峰与降级设计](/architecture/seckill-system-rate-limiting-and-degradation)
- [支付系统回调幂等与补偿设计](/architecture/payment-callback-idempotency-and-compensation)
