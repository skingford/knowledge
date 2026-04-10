---
title: 秒杀系统库存设计专题
description: 围绕秒杀资格过滤、Redis 预扣减、异步下单、热点库存分散与补偿回补，系统梳理秒杀系统库存设计主线。
---

# 秒杀系统库存设计专题

## 适合人群

- 需要设计秒杀、抢购、限量券等高并发活动系统的后端工程师
- 想把普通库存扣减方案升级成“抗热点、抗峰值”的开发者
- 准备高并发系统设计面试或活动架构评审的人

## 学习目标

- 理解为什么秒杀库存问题比普通交易库存问题更难
- 掌握资格过滤、Redis 预扣减、异步下单和回补补偿之间的关系
- 能设计一条更适合高峰流量场景的秒杀库存链路

## 快速导航

- [为什么秒杀库存问题和普通下单不一样](#为什么秒杀库存问题和普通下单不一样)
- [先明确秒杀系统真正要扛的是什么](#先明确秒杀系统真正要扛的是什么)
- [秒杀库存设计的总体目标](#秒杀库存设计的总体目标)
- [一条推荐的秒杀链路](#一条推荐的秒杀链路)
- [第一层：先挡掉不该进来的流量](#第一层先挡掉不该进来的流量)
- [第二层：用 Redis 做预扣减](#第二层用-redis-做预扣减)
- [第三层：异步下单而不是同步打库](#第三层异步下单而不是同步打库)
- [热点库存怎么打散](#热点库存怎么打散)
- [为什么还要回源数据库校准](#为什么还要回源数据库校准)
- [下单失败或超时怎么回补库存](#下单失败或超时怎么回补库存)
- [常见误区](#常见误区)
- [面试回答模板](#面试回答模板)
- [落地检查清单](#落地检查清单)
- [结论](#结论)

## 为什么秒杀库存问题和普通下单不一样

普通电商库存问题已经不简单，但秒杀场景会把所有问题一起放大：

- 流量极端集中
- 商品热点极强
- 用户请求短时间爆发
- 大量请求天然无效
- 业务容忍度通常更低

例如一场秒杀里，可能会出现：

- 1 个 SKU
- 1000 件库存
- 几十万甚至上百万请求在几秒内打进来

如果你还按普通链路去做：

- 查库存
- 扣库存
- 写订单
- 同步返回

很快就会出现：

- 数据库热点行打爆
- Redis 热 Key 被打满
- 大量无效请求把系统压垮
- 最终库存状态和订单状态不一致

所以秒杀系统库存设计的关键，不只是“别超卖”，而是：

> 在极端热点流量下，让有限库存以尽量低成本、尽量高成功率、尽量可恢复的方式被正确分配出去。

## 先明确秒杀系统真正要扛的是什么

秒杀设计经常容易一上来就讨论：

- 库存怎么扣？

但更应该先明确的是，秒杀系统真正要处理至少四类压力：

- `入口压力`
  - 请求太多，很多人根本没有资格进来
- `库存压力`
  - 同一个 SKU 极度热点
- `订单压力`
  - 真正抢到资格的人也不能全同步打数据库
- `恢复压力`
  - 失败、超时、重复请求、回补都必须可收敛

如果只解决其中一个，系统仍然会在别的地方崩掉。

## 秒杀库存设计的总体目标

一个更成熟的秒杀库存方案，通常同时追求下面这些目标：

- 不超卖
- 不被热点行打爆
- 尽量快地拒绝无效请求
- 尽量异步化主链路
- 下单失败后能补回库存
- 活动结束后能做账实校准

这里有一个很重要的认知：

- 秒杀系统不一定追求“每一步都强一致”
- 但一定追求“最终收敛且不会资损”

## 一条推荐的秒杀链路

比较典型的秒杀库存链路可以这样理解：

<div class="mermaid-svg-wrapper">

<svg id="m17758337943310" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 577.5078125px;" viewBox="0 0 577.5078125 1257.75" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337943310{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337943310 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337943310 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337943310 .error-icon{fill:#552222;}#m17758337943310 .error-text{fill:#552222;stroke:#552222;}#m17758337943310 .edge-thickness-normal{stroke-width:1px;}#m17758337943310 .edge-thickness-thick{stroke-width:3.5px;}#m17758337943310 .edge-pattern-solid{stroke-dasharray:0;}#m17758337943310 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337943310 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337943310 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337943310 .marker{fill:#666;stroke:#666;}#m17758337943310 .marker.cross{stroke:#666;}#m17758337943310 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337943310 p{margin:0;}#m17758337943310 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337943310 .cluster-label text{fill:#333;}#m17758337943310 .cluster-label span{color:#333;}#m17758337943310 .cluster-label span p{background-color:transparent;}#m17758337943310 .label text,#m17758337943310 span{fill:#000000;color:#000000;}#m17758337943310 .node rect,#m17758337943310 .node circle,#m17758337943310 .node ellipse,#m17758337943310 .node polygon,#m17758337943310 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337943310 .rough-node .label text,#m17758337943310 .node .label text,#m17758337943310 .image-shape .label,#m17758337943310 .icon-shape .label{text-anchor:middle;}#m17758337943310 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337943310 .rough-node .label,#m17758337943310 .node .label,#m17758337943310 .image-shape .label,#m17758337943310 .icon-shape .label{text-align:center;}#m17758337943310 .node.clickable{cursor:pointer;}#m17758337943310 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337943310 .arrowheadPath{fill:#333333;}#m17758337943310 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337943310 .flowchart-link{stroke:#666;fill:none;}#m17758337943310 .edgeLabel{background-color:white;text-align:center;}#m17758337943310 .edgeLabel p{background-color:white;}#m17758337943310 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337943310 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337943310 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337943310 .cluster text{fill:#333;}#m17758337943310 .cluster span{color:#333;}#m17758337943310 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337943310 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337943310 rect.text{fill:none;stroke-width:0;}#m17758337943310 .icon-shape,#m17758337943310 .image-shape{background-color:white;text-align:center;}#m17758337943310 .icon-shape p,#m17758337943310 .image-shape p{background-color:white;padding:2px;}#m17758337943310 .icon-shape .label rect,#m17758337943310 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337943310 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337943310 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337943310 .node .neo-node{stroke:#999;}#m17758337943310 [data-look="neo"].node rect,#m17758337943310 [data-look="neo"].cluster rect,#m17758337943310 [data-look="neo"].node polygon{stroke:url(#m17758337943310-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337943310 [data-look="neo"].node path{stroke:url(#m17758337943310-gradient);stroke-width:1px;}#m17758337943310 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337943310 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337943310 [data-look="neo"].node circle{stroke:url(#m17758337943310-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337943310 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337943310 [data-look="neo"].icon-shape .icon{fill:url(#m17758337943310-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337943310 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337943310-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337943310 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337943310_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337943310_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337943310_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337943310_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337943310_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337943310_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337943310_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337943310_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337943310_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337943310_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337943310_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337943310_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M249.762,62L249.762,66.167C249.762,70.333,249.762,78.667,249.762,86.333C249.762,94,249.762,101,249.762,104.5L249.762,108" id="m17758337943310-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MjQ5Ljc2MTcxODc1LCJ5Ijo2Mn0seyJ4IjoyNDkuNzYxNzE4NzUsInkiOjg3fSx7IngiOjI0OS43NjE3MTg3NSwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M249.762,166L249.762,170.167C249.762,174.333,249.762,182.667,249.762,190.333C249.762,198,249.762,205,249.762,208.5L249.762,212" id="m17758337943310-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MjQ5Ljc2MTcxODc1LCJ5IjoxNjZ9LHsieCI6MjQ5Ljc2MTcxODc1LCJ5IjoxOTF9LHsieCI6MjQ5Ljc2MTcxODc1LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M249.762,270L249.762,274.167C249.762,278.333,249.762,286.667,249.762,294.333C249.762,302,249.762,309,249.762,312.5L249.762,316" id="m17758337943310-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6MjQ5Ljc2MTcxODc1LCJ5IjoyNzB9LHsieCI6MjQ5Ljc2MTcxODc1LCJ5IjoyOTV9LHsieCI6MjQ5Ljc2MTcxODc1LCJ5IjozMjB9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M211.472,437.585L199.354,450.134C187.235,462.682,162.999,487.778,150.88,505.827C138.762,523.875,138.762,534.875,138.762,540.375L138.762,545.875" id="m17758337943310-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6MjExLjQ3MjA5MjE5Mzk4MzQsInkiOjQzNy41ODUzNzM0NDM5ODM0fSx7IngiOjEzOC43NjE3MTg3NSwieSI6NTEyLjg3NX0seyJ4IjoxMzguNzYxNzE4NzUsInkiOjU0OS44NzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M288.051,437.585L300.17,450.134C312.288,462.682,336.525,487.778,348.643,505.827C360.762,523.875,360.762,534.875,360.762,540.375L360.762,545.875" id="m17758337943310-L_D_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_F_0" data-points="W3sieCI6Mjg4LjA1MTM0NTMwNjAxNjYsInkiOjQzNy41ODUzNzM0NDM5ODM0fSx7IngiOjM2MC43NjE3MTg3NSwieSI6NTEyLjg3NX0seyJ4IjozNjAuNzYxNzE4NzUsInkiOjU0OS44NzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M360.762,603.875L360.762,608.042C360.762,612.208,360.762,620.542,360.762,628.208C360.762,635.875,360.762,642.875,360.762,646.375L360.762,649.875" id="m17758337943310-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MzYwLjc2MTcxODc1LCJ5Ijo2MDMuODc1fSx7IngiOjM2MC43NjE3MTg3NSwieSI6NjI4Ljg3NX0seyJ4IjozNjAuNzYxNzE4NzUsInkiOjY1My44NzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M360.762,707.875L360.762,712.042C360.762,716.208,360.762,724.542,360.762,732.208C360.762,739.875,360.762,746.875,360.762,750.375L360.762,753.875" id="m17758337943310-L_G_H_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_G_H_0" data-points="W3sieCI6MzYwLjc2MTcxODc1LCJ5Ijo3MDcuODc1fSx7IngiOjM2MC43NjE3MTg3NSwieSI6NzMyLjg3NX0seyJ4IjozNjAuNzYxNzE4NzUsInkiOjc1Ny44NzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M320.432,873.421L306.612,886.309C292.791,899.197,265.149,924.974,251.329,943.362C237.508,961.75,237.508,972.75,237.508,978.25L237.508,983.75" id="m17758337943310-L_H_I_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_I_0" data-points="W3sieCI6MzIwLjQzMjM4MjQ4Mzg2NjksInkiOjg3My40MjA2NjM3MzM4NjY4fSx7IngiOjIzNy41MDc4MTI1LCJ5Ijo5NTAuNzV9LHsieCI6MjM3LjUwNzgxMjUsInkiOjk4Ny43NX1d" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M401.091,873.421L414.912,886.309C428.733,899.197,456.374,924.974,470.195,943.362C484.016,961.75,484.016,972.75,484.016,978.25L484.016,983.75" id="m17758337943310-L_H_J_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_H_J_0" data-points="W3sieCI6NDAxLjA5MTA1NTAxNjEzMzEsInkiOjg3My40MjA2NjM3MzM4NjY4fSx7IngiOjQ4NC4wMTU2MjUsInkiOjk1MC43NX0seyJ4Ijo0ODQuMDE1NjI1LCJ5Ijo5ODcuNzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M171.302,1041.75L161.085,1045.917C150.868,1050.083,130.434,1058.417,120.217,1066.083C110,1073.75,110,1080.75,110,1084.25L110,1087.75" id="m17758337943310-L_I_K_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_K_0" data-points="W3sieCI6MTcxLjMwMTgzMjkzMjY5MjMyLCJ5IjoxMDQxLjc1fSx7IngiOjExMCwieSI6MTA2Ni43NX0seyJ4IjoxMTAsInkiOjEwOTEuNzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M303.714,1041.75L313.931,1045.917C324.148,1050.083,344.582,1058.417,354.799,1066.083C365.016,1073.75,365.016,1080.75,365.016,1084.25L365.016,1087.75" id="m17758337943310-L_I_L_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_I_L_0" data-points="W3sieCI6MzAzLjcxMzc5MjA2NzMwNzcsInkiOjEwNDEuNzV9LHsieCI6MzY1LjAxNTYyNSwieSI6MTA2Ni43NX0seyJ4IjozNjUuMDE1NjI1LCJ5IjoxMDkxLjc1fV0=" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path><path d="M365.016,1145.75L365.016,1149.917C365.016,1154.083,365.016,1162.417,365.016,1170.083C365.016,1177.75,365.016,1184.75,365.016,1188.25L365.016,1191.75" id="m17758337943310-L_L_M_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_L_M_0" data-points="W3sieCI6MzY1LjAxNTYyNSwieSI6MTE0NS43NX0seyJ4IjozNjUuMDE1NjI1LCJ5IjoxMTcwLjc1fSx7IngiOjM2NS4wMTU2MjUsInkiOjExOTUuNzV9XQ==" data-look="classic" marker-end="url(#m17758337943310_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(138.76171875, 512.875)"><g class="label" data-id="L_D_E_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(360.76171875, 512.875)"><g class="label" data-id="L_D_F_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_G_H_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(237.5078125, 950.75)"><g class="label" data-id="L_H_I_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>是</p></span></div></foreignObject></g></g><g class="edgeLabel" transform="translate(484.015625, 950.75)"><g class="label" data-id="L_H_J_0" transform="translate(-8, -12)"><foreignObject width="16" height="24"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"><p>否</p></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_I_K_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_I_L_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_L_M_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337943310-flowchart-A-0" data-look="classic" transform="translate(249.76171875, 35)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>用户请求秒杀</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-B-1" data-look="classic" transform="translate(249.76171875, 139)"><rect class="basic label-container" style="" x="-112.03125" y="-27" width="224.0625" height="54"></rect><g class="label" style="" transform="translate(-82.03125, -12)"><rect></rect><foreignObject width="164.0625" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>资格过滤 / 限流 / 防刷</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-C-3" data-look="classic" transform="translate(249.76171875, 243)"><rect class="basic label-container" style="" x="-91.0859375" y="-27" width="182.171875" height="54"></rect><g class="label" style="" transform="translate(-61.0859375, -12)"><rect></rect><foreignObject width="122.171875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>Redis 预扣减库存</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-D-5" data-look="classic" transform="translate(249.76171875, 397.9375)"><polygon points="77.9375,0 155.875,-77.9375 77.9375,-155.875 0,-77.9375" class="label-container" transform="translate(-77.4375, 77.9375)"></polygon><g class="label" style="" transform="translate(-50.9375, -12)"><rect></rect><foreignObject width="101.875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>是否抢到资格?</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-E-7" data-look="classic" transform="translate(138.76171875, 576.875)"><rect class="basic label-container" style="" x="-78" y="-27" width="156" height="54"></rect><g class="label" style="" transform="translate(-48, -12)"><rect></rect><foreignObject width="96" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>快速失败返回</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-F-9" data-look="classic" transform="translate(360.76171875, 576.875)"><rect class="basic label-container" style="" x="-94" y="-27" width="188" height="54"></rect><g class="label" style="" transform="translate(-64, -12)"><rect></rect><foreignObject width="128" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写入异步下单队列</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-G-11" data-look="classic" transform="translate(360.76171875, 680.875)"><rect class="basic label-container" style="" x="-126" y="-27" width="252" height="54"></rect><g class="label" style="" transform="translate(-96, -12)"><rect></rect><foreignObject width="192" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单服务消费队列创建订单</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-H-13" data-look="classic" transform="translate(360.76171875, 835.8125)"><polygon points="77.9375,0 155.875,-77.9375 77.9375,-155.875 0,-77.9375" class="label-container" transform="translate(-77.4375, 77.9375)"></polygon><g class="label" style="" transform="translate(-50.9375, -12)"><rect></rect><foreignObject width="101.875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>订单创建成功?</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-I-15" data-look="classic" transform="translate(237.5078125, 1014.75)"><rect class="basic label-container" style="" x="-111.015625" y="-27" width="222.03125" height="54"></rect><g class="label" style="" transform="translate(-81.015625, -12)"><rect></rect><foreignObject width="162.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>写订单成功 / 等待支付</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-J-17" data-look="classic" transform="translate(484.015625, 1014.75)"><rect class="basic label-container" style="" x="-85.4921875" y="-27" width="170.984375" height="54"></rect><g class="label" style="" transform="translate(-55.4921875, -12)"><rect></rect><foreignObject width="110.984375" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>回补 Redis 库存</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-K-19" data-look="classic" transform="translate(110, 1118.75)"><rect class="basic label-container" style="" x="-102" y="-27" width="204" height="54"></rect><g class="label" style="" transform="translate(-72, -12)"><rect></rect><foreignObject width="144" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>支付成功后确认占用</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-L-21" data-look="classic" transform="translate(365.015625, 1118.75)"><rect class="basic label-container" style="" x="-103.015625" y="-27" width="206.03125" height="54"></rect><g class="label" style="" transform="translate(-73.015625, -12)"><rect></rect><foreignObject width="146.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>超时取消 / 支付失败</p></span></div></foreignObject></g></g><g class="node default" id="m17758337943310-flowchart-M-23" data-look="classic" transform="translate(365.015625, 1222.75)"><rect class="basic label-container" style="" x="-103.015625" y="-27" width="206.03125" height="54"></rect><g class="label" style="" transform="translate(-73.015625, -12)"><rect></rect><foreignObject width="146.03125" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>释放库存 / 补偿校准</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337943310-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337943310-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337943310-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

这条链路的关键点是：

- 热点库存不在第一时间直接压数据库
- 大部分无效请求在入口或 Redis 层就被挡掉
- 只有少量“抢到资格”的请求才进入异步下单阶段
- 订单失败和超时取消都要有回补和校准机制

## 第一层：先挡掉不该进来的流量

秒杀系统的一个共识是：

- 不是每个请求都值得进入库存扣减逻辑

所以第一层通常会做资格过滤。

### 常见过滤项

- 用户是否登录
- 用户是否有活动资格
- 是否超过单人限购次数
- 是否命中风控规则
- 是否重复请求

### 为什么这一层重要

因为很多请求其实从业务上就不应该进入秒杀主链路。

越早挡掉它们：

- 后面库存层压力越小
- 异步队列越干净
- 数据库越安全

在极端场景下，这一层的价值甚至比“库存怎么扣”还大。

## 第二层：用 Redis 做预扣减

秒杀里最常见的一步是：

- 不先打数据库
- 先在 Redis 里做库存预扣减

原因非常现实：

- Redis 更适合承接高频热点读写
- 单线程原子操作更适合做快速资格判定

### 一个常见模型

Redis 中维护：

- `seckill:stock:{sku_id}`
- `seckill:user:{activity_id}:{user_id}`

处理逻辑通常是：

1. 先检查用户是否已抢过
2. 再检查库存是否大于 0
3. 原子扣减库存
4. 记录用户已抢资格

这类逻辑一般适合放进 Lua 脚本里原子执行。

### 为什么这里说“预扣减”

因为这一步通常并不意味着：

- 订单一定已经创建成功

更准确地说，它代表：

- 这个请求已经抢到“继续往后走”的资格

所以 Redis 预扣减本质上是：

- 资格分配
- 热点拦截
- 快速减压

而不是最终业务落账。

## 第三层：异步下单而不是同步打库

秒杀系统里非常重要的一条经验是：

> Redis 扣减成功后，不应该立刻把所有请求同步打到订单数据库。

因为这样会把热点从 Redis 转移到订单库、库存库、支付库，最后整条链路一起抖。

更稳妥的方式通常是：

- Redis 预扣减成功
- 只返回“抢购资格已拿到”或“排队中”
- 然后写入 MQ / 队列
- 后台 worker 异步创建订单

### 这样做的价值

- 把峰值请求变成可消费队列
- 限制数据库并发写入速度
- 更容易做失败重试和补偿

所以秒杀场景里，“异步下单”往往比“同步成功返回订单结果”更稳。

## 热点库存怎么打散

即使库存先放在 Redis，热点问题也不会自动消失。

一个超级热点 SKU 仍然可能把某个 Key 打成瓶颈。

### 常见打散方式

#### 1. 库存分桶

把同一个商品库存拆成多个桶：

- `stock:sku:1001:bucket:1`
- `stock:sku:1001:bucket:2`
- `stock:sku:1001:bucket:3`

请求进入时随机或按规则落到某个桶，减少单 Key 热点。

#### 2. 请求打散

通过网关、队列、工作线程池，把突发请求均匀铺开。

#### 3. 分层限流

在：

- 网关层
- 活动服务层
- Redis 扣减层
- 异步消费层

分别限流，避免某一层瞬时被打穿。

### 但要注意

热点打散的代价通常是：

- 统计更复杂
- 回补更复杂
- 账实校准更复杂

所以不能为了“更炫的架构”盲目分桶，必须根据压力级别来决定。

## 为什么还要回源数据库校准

秒杀库存如果完全只靠 Redis，是不够的。

因为 Redis 更适合做：

- 高速资格控制
- 热点削峰

但最终业务真相仍然通常要落到数据库里，例如：

- 最终订单是否创建成功
- 最终库存是否真的被占用
- 超时取消后是否真的释放

所以成熟系统通常会保留一条“账实校准”主线：

- Redis 负责快
- 数据库负责准

活动结束后，或者在运行中周期性地，都需要去校准：

- Redis 预扣减数
- 成功订单数
- 取消回补数
- 实际库存余量

## 下单失败或超时怎么回补库存

这是秒杀系统里最容易出事故的地方之一。

### 常见回补场景

- Redis 预扣减成功，但订单创建失败
- 订单创建成功，但支付超时取消
- 订单创建成功，但后续链路异常需要关闭

### 回补原则

- 回补必须幂等
- 回补必须可重试
- 回补最好事件化

比较稳妥的做法通常是：

- 订单创建失败 -> 发 `OrderCreateFailed` 事件 -> 回补库存
- 订单超时取消 -> 发 `OrderCancelled` 事件 -> 回补库存
- 活动结束后再跑兜底校准任务

这里和普通库存系统的共同点是：

- 最终都需要补偿收敛

不同点在于秒杀系统更强调：

- 高峰下先快分配资格
- 事后再持续校准

## 常见误区

### 1. 误区一：秒杀库存只要放 Redis 就够了

不够。

Redis 只能帮你解决热点和快速资格分配问题，最终业务状态仍然要靠订单、数据库和补偿去收口。

### 2. 误区二：只要异步下单，就天然不会超卖

不对。

异步下单只是削峰，不替代库存原子扣减和回补设计。

### 3. 误区三：秒杀系统只看成功率，不看回补

如果失败链路和回补没设计好，活动结束后很容易出现：

- 账实对不上
- 库存被吞
- 用户资格错误

### 4. 误区四：所有场景都要做复杂分桶

热点分桶有价值，但也有代价。不是所有秒杀系统都必须一上来就做最复杂的拆分。

### 5. 误区五：只有秒杀前半段重要

很多系统只关注：

- 用户能不能抢到

但真正的线上问题往往出在后半段：

- 订单没创建
- 库存没回补
- 支付超时没释放

## 面试回答模板

如果面试官问“秒杀库存怎么设计”，可以用下面这版口径来回答：

> 秒杀库存设计和普通下单最大的区别在于流量极度集中、热点 SKU 极强，所以我不会让所有请求直接打数据库。  
> 通常我会分三层处理：第一层做资格过滤、限流和防刷，把明显无效请求挡在外面；第二层用 Redis 做预扣减库存，最好通过 Lua 脚本原子判断库存和用户资格；第三层把抢到资格的请求写入异步队列，由后台 worker 慢慢创建订单。  
> 这样做的核心目的是把热点库存从数据库前移到 Redis，把同步写库流量削成可消费队列。  
> 但 Redis 预扣减不等于最终业务完成，所以订单创建失败、支付超时取消时都必须有库存回补，而且活动结束后还要有账实校准任务。  
> 所以秒杀库存设计的关键不只是防超卖，还包括热点打散、异步削峰、失败回补和最终校准。

如果继续追问，可以顺着讲：

1. 为什么不能直接查库扣库存
2. 为什么 Redis 扣减只是预占，不是最终真相
3. 异步下单如何削峰
4. 下单失败和超时取消如何回补库存
5. 热点 SKU 什么时候需要分桶

## 落地检查清单

### 1. 入口治理

- 是否做了资格过滤
- 是否有限流、防刷、重复请求治理
- 是否把明显无效流量挡在库存层之前

### 2. 库存预扣减

- 是否通过原子脚本处理库存和用户资格
- 是否明确 Redis 预扣减只是资格分配，不是最终落账
- 是否定义了库存不足和重复抢购的返回语义

### 3. 异步化

- 是否通过 MQ / 队列异步创建订单
- 是否限制了后台 worker 的消费速率
- 是否避免同步把流量打爆数据库

### 4. 热点治理

- 是否识别热点 SKU
- 是否需要分桶库存或请求打散
- 是否有多层限流和线程池隔离

### 5. 回补与校准

- 订单创建失败是否回补库存
- 超时取消是否回补库存
- 是否有活动后账实校准任务
- 回补逻辑是否幂等可重试

## 结论

秒杀库存设计真正难的地方，不是“怎么扣掉一件库存”，而是：

- 怎么在极端热点下快速挡掉无效请求
- 怎么把热点从数据库前移出去
- 怎么在异步化后仍然不超卖
- 怎么把失败和超时场景补回来

所以最值得记住的一句话是：

> 秒杀库存设计的本质，是“用 Redis 和异步化抗住峰值，用补偿和校准守住最终一致”。 

## 相关阅读

- [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- [秒杀系统风控、防刷与资格校验设计](/architecture/seckill-risk-control-and-eligibility-design)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
- [秒杀系统限流、削峰与降级设计](/architecture/seckill-system-rate-limiting-and-degradation)
- [秒杀结果查询、排队态与用户体验设计](/architecture/seckill-result-query-and-queueing-ux-design)
- [抢券系统设计专题：与秒杀系统的异同](/architecture/coupon-claim-system-design-and-comparison)
- [交易系统一致性设计总览](/architecture/transaction-system-consistency-overview)
- [Redis 高并发、集群与锁](/redis/high-concurrency-cluster-locks)
