---
title: 架构设计方法与评审清单
description: 从业务目标、约束建模、容量估算、边界划分、数据一致性到稳定性与上线治理，系统整理一套可复用的架构设计与评审方法。
---

# 架构设计方法与评审清单

## 适合人群

- 已经能独立做模块开发，想升级到“能讲清整体方案”的后端工程师
- 需要写架构方案、参加方案评审或承担技术规划的人
- 准备系统设计面试、晋升答辩或跨团队设计讨论的开发者

## 学习目标

- 建立一套从业务目标推导技术方案的通用骨架
- 明确架构评审时真正要看的是哪些约束、风险和取舍
- 知道设计输出物至少应该包含哪些内容，避免只停留在组件清单

## 快速导航

- [为什么很多架构方案看起来完整却很难落地](#为什么很多架构方案看起来完整却很难落地)
- [先把输入条件定清楚](#先把输入条件定清楚)
- [一套可复用的架构设计七步法](#一套可复用的架构设计七步法)
- [架构评审时最值得逐项过的清单](#架构评审时最值得逐项过的清单)
- [方案文档至少应该交付什么](#方案文档至少应该交付什么)
- [系统设计面试或评审时的口述模板](#系统设计面试或评审时的口述模板)
- [常见误区](#常见误区)
- [相关阅读](#相关阅读)

## 为什么很多架构方案看起来完整却很难落地

很多方案失败，不是因为团队不知道要上缓存、消息队列、限流或多活，而是因为一开始就漏了几个最关键的问题：

- 业务目标没有量化，最后只能抽象讨论“高并发”“高可用”
- 流量模型没有估算，导致容量、热点和瓶颈都只能靠猜
- 边界没有拆清，最终图里全是服务名，职责却交叉重叠
- 一致性和失败恢复没有提前定义，线上问题只能靠人工兜底
- 发布、观测、回滚、值守没有放进方案，设计和上线是两张皮

所以真正有用的架构方法，不是“先挑技术栈”，而是先把问题边界、输入约束和决策顺序固定下来。

## 先把输入条件定清楚

开始画图之前，至少要把下面几类输入说清楚。

### 1. 业务目标

- 这套系统服务什么核心目标：增长、转化、履约、风控，还是成本优化
- 成功指标是什么：下单成功率、支付成功率、消息送达率、延迟、成本
- 哪条链路是核心主路径，哪条链路允许异步化和最终一致

### 2. 规模与容量

- 日均请求、峰值 QPS、峰值并发连接数、数据规模分别是多少
- 峰值是稳定高峰还是短时突刺，是否存在热点用户、热点商品、热点房间
- 数据增长速度如何，半年和一年后的量级大概到哪里

### 3. 非功能约束

- 可用性目标：例如 `99.9%` 还是 `99.99%`
- 延迟目标：例如接口 `P99 < 200ms`
- 一致性要求：强一致、最终一致、读写分离允许多大延迟
- 安全合规：审计、权限隔离、隐私数据、跨境数据流动

### 4. 组织与交付约束

- 团队规模是多少，是否有专门的平台、SRE、测试或 DBA 支撑
- 现有系统是否必须兼容，是否允许停机迁移或双写过渡
- 时间窗口多大，是两周交付 MVP，还是半年平台化建设

## 一套可复用的架构设计七步法

下面这七步，适合绝大多数业务系统、平台系统和中后台系统设计。

<div class="mermaid-svg-wrapper">

<svg id="m17758337931590" width="100%" xmlns="http://www.w3.org/2000/svg" class="flowchart" style="max-width: 276px;" viewBox="0 0 276 814" role="graphics-document document" aria-roledescription="flowchart-v2"><style>#m17758337931590{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#000000;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#m17758337931590 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#m17758337931590 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#m17758337931590 .error-icon{fill:#552222;}#m17758337931590 .error-text{fill:#552222;stroke:#552222;}#m17758337931590 .edge-thickness-normal{stroke-width:1px;}#m17758337931590 .edge-thickness-thick{stroke-width:3.5px;}#m17758337931590 .edge-pattern-solid{stroke-dasharray:0;}#m17758337931590 .edge-thickness-invisible{stroke-width:0;fill:none;}#m17758337931590 .edge-pattern-dashed{stroke-dasharray:3;}#m17758337931590 .edge-pattern-dotted{stroke-dasharray:2;}#m17758337931590 .marker{fill:#666;stroke:#666;}#m17758337931590 .marker.cross{stroke:#666;}#m17758337931590 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#m17758337931590 p{margin:0;}#m17758337931590 .label{font-family:"trebuchet ms",verdana,arial,sans-serif;color:#000000;}#m17758337931590 .cluster-label text{fill:#333;}#m17758337931590 .cluster-label span{color:#333;}#m17758337931590 .cluster-label span p{background-color:transparent;}#m17758337931590 .label text,#m17758337931590 span{fill:#000000;color:#000000;}#m17758337931590 .node rect,#m17758337931590 .node circle,#m17758337931590 .node ellipse,#m17758337931590 .node polygon,#m17758337931590 .node path{fill:#eee;stroke:#999;stroke-width:1px;}#m17758337931590 .rough-node .label text,#m17758337931590 .node .label text,#m17758337931590 .image-shape .label,#m17758337931590 .icon-shape .label{text-anchor:middle;}#m17758337931590 .node .katex path{fill:#000;stroke:#000;stroke-width:1px;}#m17758337931590 .rough-node .label,#m17758337931590 .node .label,#m17758337931590 .image-shape .label,#m17758337931590 .icon-shape .label{text-align:center;}#m17758337931590 .node.clickable{cursor:pointer;}#m17758337931590 .root .anchor path{fill:#666!important;stroke-width:0;stroke:#666;}#m17758337931590 .arrowheadPath{fill:#333333;}#m17758337931590 .edgePath .path{stroke:#666;stroke-width:1px;}#m17758337931590 .flowchart-link{stroke:#666;fill:none;}#m17758337931590 .edgeLabel{background-color:white;text-align:center;}#m17758337931590 .edgeLabel p{background-color:white;}#m17758337931590 .edgeLabel rect{opacity:0.5;background-color:white;fill:white;}#m17758337931590 .labelBkg{background-color:rgba(255, 255, 255, 0.5);}#m17758337931590 .cluster rect{fill:hsl(0, 0%, 98.9215686275%);stroke:#707070;stroke-width:1px;}#m17758337931590 .cluster text{fill:#333;}#m17758337931590 .cluster span{color:#333;}#m17758337931590 div.mermaidTooltip{position:absolute;text-align:center;max-width:200px;padding:2px;font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:12px;background:hsl(-160, 0%, 93.3333333333%);border:1px solid #707070;border-radius:2px;pointer-events:none;z-index:100;}#m17758337931590 .flowchartTitleText{text-anchor:middle;font-size:18px;fill:#000000;}#m17758337931590 rect.text{fill:none;stroke-width:0;}#m17758337931590 .icon-shape,#m17758337931590 .image-shape{background-color:white;text-align:center;}#m17758337931590 .icon-shape p,#m17758337931590 .image-shape p{background-color:white;padding:2px;}#m17758337931590 .icon-shape .label rect,#m17758337931590 .image-shape .label rect{opacity:0.5;background-color:white;fill:white;}#m17758337931590 .label-icon{display:inline-block;height:1em;overflow:visible;vertical-align:-0.125em;}#m17758337931590 .node .label-icon path{fill:currentColor;stroke:revert;stroke-width:revert;}#m17758337931590 .node .neo-node{stroke:#999;}#m17758337931590 [data-look="neo"].node rect,#m17758337931590 [data-look="neo"].cluster rect,#m17758337931590 [data-look="neo"].node polygon{stroke:url(#m17758337931590-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337931590 [data-look="neo"].node path{stroke:url(#m17758337931590-gradient);stroke-width:1px;}#m17758337931590 [data-look="neo"].node .outer-path{filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337931590 [data-look="neo"].node .neo-line path{stroke:#999;filter:none;}#m17758337931590 [data-look="neo"].node circle{stroke:url(#m17758337931590-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337931590 [data-look="neo"].node circle .state-start{fill:#000000;}#m17758337931590 [data-look="neo"].icon-shape .icon{fill:url(#m17758337931590-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337931590 [data-look="neo"].icon-shape .icon-neo path{stroke:url(#m17758337931590-gradient);filter:drop-shadow( 1px 2px 2px rgba(185,185,185,1));}#m17758337931590 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g><marker id="m17758337931590_flowchart-v2-pointEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337931590_flowchart-v2-pointStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="4.5" refY="5" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto"><path d="M 0 5 L 10 10 L 10 0 z" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337931590_flowchart-v2-pointEnd-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="11.5" refY="7" markerUnits="userSpaceOnUse" markerWidth="10.5" markerHeight="14" orient="auto"><path d="M 0 0 L 11.5 7 L 0 14 z" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337931590_flowchart-v2-pointStart-margin" class="marker flowchart-v2" viewBox="0 0 11.5 14" refX="1" refY="7" markerUnits="userSpaceOnUse" markerWidth="11.5" markerHeight="14" orient="auto"><polygon points="0,7 11.5,14 11.5,0" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></polygon></marker><marker id="m17758337931590_flowchart-v2-circleEnd" class="marker flowchart-v2" viewBox="0 0 10 10" refX="11" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337931590_flowchart-v2-circleStart" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-1" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 1; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337931590_flowchart-v2-circleEnd-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refY="5" refX="12.25" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337931590_flowchart-v2-circleStart-margin" class="marker flowchart-v2" viewBox="0 0 10 10" refX="-2" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><circle cx="5" cy="5" r="5" class="arrowMarkerPath" style="stroke-width: 0; stroke-dasharray: 1, 0;"></circle></marker><marker id="m17758337931590_flowchart-v2-crossEnd" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="12" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337931590_flowchart-v2-crossStart" class="marker cross flowchart-v2" viewBox="0 0 11 11" refX="-1" refY="5.2" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M 1,1 l 9,9 M 10,1 l -9,9" class="arrowMarkerPath" style="stroke-width: 2; stroke-dasharray: 1, 0;"></path></marker><marker id="m17758337931590_flowchart-v2-crossEnd-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="17.7" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5;"></path></marker><marker id="m17758337931590_flowchart-v2-crossStart-margin" class="marker cross flowchart-v2" viewBox="0 0 15 15" refX="-3.5" refY="7.5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M 1,1 L 14,14 M 1,14 L 14,1" class="arrowMarkerPath" style="stroke-width: 2.5; stroke-dasharray: 1, 0;"></path></marker><g class="root"><g class="clusters"></g><g class="edgePaths"><path d="M138,62L138,66.167C138,70.333,138,78.667,138,86.333C138,94,138,101,138,104.5L138,108" id="m17758337931590-L_A_B_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_A_B_0" data-points="W3sieCI6MTM4LCJ5Ijo2Mn0seyJ4IjoxMzgsInkiOjg3fSx7IngiOjEzOCwieSI6MTEyfV0=" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path><path d="M138,166L138,170.167C138,174.333,138,182.667,138,190.333C138,198,138,205,138,208.5L138,212" id="m17758337931590-L_B_C_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_B_C_0" data-points="W3sieCI6MTM4LCJ5IjoxNjZ9LHsieCI6MTM4LCJ5IjoxOTF9LHsieCI6MTM4LCJ5IjoyMTZ9XQ==" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path><path d="M138,294L138,298.167C138,302.333,138,310.667,138,318.333C138,326,138,333,138,336.5L138,340" id="m17758337931590-L_C_D_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_C_D_0" data-points="W3sieCI6MTM4LCJ5IjoyOTR9LHsieCI6MTM4LCJ5IjozMTl9LHsieCI6MTM4LCJ5IjozNDR9XQ==" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path><path d="M138,422L138,426.167C138,430.333,138,438.667,138,446.333C138,454,138,461,138,464.5L138,468" id="m17758337931590-L_D_E_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_D_E_0" data-points="W3sieCI6MTM4LCJ5Ijo0MjJ9LHsieCI6MTM4LCJ5Ijo0NDd9LHsieCI6MTM4LCJ5Ijo0NzJ9XQ==" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path><path d="M138,550L138,554.167C138,558.333,138,566.667,138,574.333C138,582,138,589,138,592.5L138,596" id="m17758337931590-L_E_F_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_E_F_0" data-points="W3sieCI6MTM4LCJ5Ijo1NTB9LHsieCI6MTM4LCJ5Ijo1NzV9LHsieCI6MTM4LCJ5Ijo2MDB9XQ==" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path><path d="M138,678L138,682.167C138,686.333,138,694.667,138,702.333C138,710,138,717,138,720.5L138,724" id="m17758337931590-L_F_G_0" class="edge-thickness-normal edge-pattern-solid edge-thickness-normal edge-pattern-solid flowchart-link" style=";" data-edge="true" data-et="edge" data-id="L_F_G_0" data-points="W3sieCI6MTM4LCJ5Ijo2Nzh9LHsieCI6MTM4LCJ5Ijo3MDN9LHsieCI6MTM4LCJ5Ijo3Mjh9XQ==" data-look="classic" marker-end="url(#m17758337931590_flowchart-v2-pointEnd)"></path></g><g class="edgeLabels"><g class="edgeLabel"><g class="label" data-id="L_A_B_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_B_C_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_C_D_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_D_E_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_E_F_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g><g class="edgeLabel"><g class="label" data-id="L_F_G_0" transform="translate(0, 0)"><foreignObject width="0" height="0"><div xmlns="http://www.w3.org/1999/xhtml" class="labelBkg" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="edgeLabel"></span></div></foreignObject></g></g></g><g class="nodes"><g class="node default" id="m17758337931590-flowchart-A-0" data-look="classic" transform="translate(138, 35)"><rect class="basic label-container" style="" x="-108.609375" y="-27" width="217.21875" height="54"></rect><g class="label" style="" transform="translate(-78.609375, -12)"><rect></rect><foreignObject width="157.21875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>1 明确业务目标与约束</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-B-1" data-look="classic" transform="translate(138, 139)"><rect class="basic label-container" style="" x="-124.609375" y="-27" width="249.21875" height="54"></rect><g class="label" style="" transform="translate(-94.609375, -12)"><rect></rect><foreignObject width="189.21875" height="24"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table-cell; white-space: nowrap; line-height: 1.5; max-width: 200px; text-align: center;"><span class="nodeLabel"><p>2 定义核心链路与系统边界</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-C-3" data-look="classic" transform="translate(138, 255)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>3 设计数据模型与一致性策略</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-D-5" data-look="classic" transform="translate(138, 383)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>4 划分服务、存储与异步边界</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-E-7" data-look="classic" transform="translate(138, 511)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>5 建容量、稳定性与降级方案</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-F-9" data-look="classic" transform="translate(138, 639)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>6 补观测、发布、安全与治理</p></span></div></foreignObject></g></g><g class="node default" id="m17758337931590-flowchart-G-11" data-look="classic" transform="translate(138, 767)"><rect class="basic label-container" style="" x="-130" y="-39" width="260" height="78"></rect><g class="label" style="" transform="translate(-100, -24)"><rect></rect><foreignObject width="200" height="48"><div xmlns="http://www.w3.org/1999/xhtml" style="display: table; white-space: break-spaces; line-height: 1.5; max-width: 200px; text-align: center; width: 200px;"><span class="nodeLabel"><p>7 形成文档、风险清单与演进计划</p></span></div></foreignObject></g></g></g></g></g><defs><filter id="m17758337931590-drop-shadow" height="130%" width="130%"><feDropShadow dx="4" dy="4" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><defs><filter id="m17758337931590-drop-shadow-small" height="150%" width="150%"><feDropShadow dx="2" dy="2" stdDeviation="0" flood-opacity="0.06" flood-color="#000000"></feDropShadow></filter></defs><linearGradient id="m17758337931590-gradient" gradientUnits="objectBoundingBox" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0, 0%, 83.3333333333%)" stop-opacity="1"></stop><stop offset="100%" stop-color="hsl(0, 0%, 88.9215686275%)" stop-opacity="1"></stop></linearGradient></svg>

</div>

### 1. 明确业务目标与约束

这一步不解决技术细节，只回答“为什么做、做到什么程度算够”。

至少要写清：

- 业务场景与核心用户动作
- 主路径成功指标和失败成本
- 峰值流量、数据量、实时性要求
- 可接受的复杂度和交付周期

如果这一步不做，后面所有技术讨论都会默认“无限扩展、无限高可用、无限快”，最终方案只会越来越重。

### 2. 定义核心链路与系统边界

先画主链路，再谈组件。

建议先回答：

- 用户请求从入口到落库的最短路径是什么
- 哪些动作必须同步完成，哪些动作可以异步
- 哪些系统是本次设计范围，哪些是外部依赖
- 哪些地方最容易产生热点、排队、重试和级联故障

这一步的产物通常是：

- 一张主链路时序图
- 一张系统上下游边界图
- 一个“同步 / 异步 / 人工补偿”划分表

### 3. 设计数据模型与一致性策略

很多方案讨论服务拆分很久，却没有先定义数据事实和状态流转，最后一上生产就被订单状态错乱、库存超卖、回调重复打回原形。

这一步建议固定回答四个问题：

- 核心实体是什么，主键和唯一约束是什么
- 状态怎么流转，终态是否可逆
- 哪些地方需要幂等键、防重表、条件更新
- 跨库、跨服务、跨消息时最终靠什么收口

常见手段包括：

- 状态机
- Outbox / 事务消息
- 补偿任务 / 对账
- 分布式锁或乐观并发控制
- 延时任务 / 定时校正

### 4. 划分服务、存储与异步边界

拆分不是越细越好，核心看三件事：

- 领域边界是否清晰
- 数据是否需要独立演进
- 故障、流量和团队责任是否需要隔离

服务划分时可以先问：

- 这个边界是因为业务能力不同，还是因为代码太大了
- 拆出去之后，数据一致性和链路复杂度会不会显著上升
- 这个服务是否有独立 SLA、独立扩缩容和独立发布需求

存储和异步边界也要一起定：

- 事务型数据放哪里
- 检索和分析型数据是否分层
- 异步事件如何命名、重试、幂等、死信和补偿

### 5. 建容量、稳定性与降级方案

架构方案只讲“正常路径”是远远不够的。真正拉开差距的，往往是高峰、故障和慢依赖时怎么保住核心能力。

建议至少覆盖：

- 容量估算：QPS、并发、连接数、磁盘、带宽、缓存命中率
- 流量治理：限流、削峰、排队、背压、热点隔离
- 高可用设计：主从、集群、故障转移、跨机房、重试与超时
- 降级策略：关闭什么能力、保留什么核心路径、用户提示怎么做

一条简单原则：

> 先定义“系统在坏的时候怎么活下来”，再定义“系统在好的时候怎么跑得更快”。

### 6. 补观测、发布、安全与治理

设计如果不包含治理面，最后一定会把问题推给运维、测试或值守同学。

这一层至少要补上：

- 指标、日志、链路追踪、业务审计
- 发布路径、灰度策略、回滚条件、开关矩阵
- 认证、授权、数据脱敏、操作留痕
- 配置治理、限额治理、资源隔离、值班手册

对于面试或评审来说，这一步特别能体现“是不是只会画图”。

### 7. 形成文档、风险清单与演进计划

真正可执行的方案，结尾不应该只剩一句“后续按需优化”，而应该把阶段目标和已知风险摊开。

建议把下面这些写实：

- 第一阶段先上线什么，第二阶段再平台化什么
- 哪些风险本期接受，为什么接受
- 哪些能力先用人工兜底，后续再自动化
- 哪些指标作为上线 gate，哪些告警触发回滚

## 架构评审时最值得逐项过的清单

下面这张表适合方案评审、晋升答辩、系统设计面试前复盘。

| 维度 | 评审重点 | 典型追问 |
| --- | --- | --- |
| 业务目标 | 是否讲清核心链路和成功指标 | 为什么这条链路必须实时？为什么一定要做成微服务？ |
| 流量与容量 | 是否有峰值估算、热点识别和余量设计 | 峰值翻 3 倍会先打爆哪里？ |
| 边界划分 | 服务职责、数据边界、团队责任是否清晰 | 这个能力为什么独立成服务而不是模块？ |
| 数据模型 | 主键、唯一约束、状态机是否定义完整 | 重试、并发更新、重复回调怎么处理？ |
| 一致性 | 强一致与最终一致的边界是否清晰 | 如果消息丢了、回调没到、库存没释放怎么办？ |
| 高可用 | 单点、慢依赖、级联故障是否有兜底 | 数据库故障或缓存雪崩时保留哪些能力？ |
| 性能 | 是否识别关键瓶颈和慢路径 | 为什么瓶颈会出现在这里，怎么验证？ |
| 可观测性 | 指标、日志、Tracing、审计是否齐全 | 线上怎么判断是入口、队列还是下游出了问题？ |
| 发布治理 | 是否有灰度、回滚、开关和应急方案 | 发布后错误率飙升的止血动作是什么？ |
| 安全合规 | 权限、数据隔离、隐私与风控是否考虑 | 多租户、越权、敏感字段泄露怎么防？ |
| 成本与复杂度 | 复杂度是否与业务阶段匹配 | 有没有更便宜、更简单但足够好的方案？ |
| 演进路线 | 是否说明当前解和未来解的切换条件 | 什么时候从单体升级到分布式，触发信号是什么？ |

## 方案文档至少应该交付什么

即使是内部方案，也建议至少有下面这些输出物。

| 输出物 | 作用 |
| --- | --- |
| 背景与目标 | 说明为什么要做、解决什么问题、成功指标是什么 |
| 约束列表 | 记录容量、实时性、成本、团队和兼容约束 |
| 架构图 / 时序图 | 把主链路、边界和异步路径画清楚 |
| 数据与状态设计 | 说明实体、主键、状态机、幂等和一致性策略 |
| 稳定性方案 | 说明限流、降级、容灾、重试、补偿和回滚 |
| 观测与运维方案 | 说明指标、日志、告警、值守和排障入口 |
| 风险清单 | 说明已知风险、接受理由和后续改进项 |
| 分阶段计划 | 说明 MVP、演进阶段和资源投入 |

## 系统设计面试或评审时的口述模板

如果你需要在 3 到 5 分钟内讲一个完整方案，可以按这个顺序。

1. 先说业务目标和约束：用户量级、峰值、SLO、实时性要求。
2. 再说核心主链路：哪些同步完成，哪些异步解耦。
3. 接着说数据模型和一致性：主键、状态机、幂等、补偿怎么做。
4. 再说流量与稳定性：热点、限流、降级、容量余量、故障转移。
5. 最后说治理和演进：观测、发布、回滚，以及什么时候需要升级架构。

一句话模板可以记成：

> 先定目标，再定边界；先保正确性，再谈吞吐；先讲故障时怎么活，再讲正常时怎么快。

## 常见误区

### 1. 用组件名代替设计

“Redis + Kafka + ES + K8s” 不是方案，只是名词列表。真正的方案要回答这些组件分别解决什么问题，以及不用它们会发生什么。

### 2. 过早分布式

很多系统真正的问题不是“单体扛不住”，而是：

- SQL 没优化
- 热点没识别
- 状态机没收口
- 发布没有灰度

在这些基础动作没做之前，拆服务通常只会先增加复杂度。

### 3. 只谈成功路径

真正的线上问题，往往发生在：

- 重试
- 超时
- 重复回调
- 消息积压
- 发布回滚

如果方案里这些地方是空白，评审时一定要补。

### 4. 没有阶段感

MVP、成长期和平台化阶段的最优方案通常不同。当前阶段能接受人工补偿，不等于永远靠人工补偿。

### 5. 把“高可用”理解成“多堆机器”

高可用首先是：

- 正确识别核心链路
- 在坏情况下保住核心功能
- 明确哪些能力可以降级或延后

只有在此基础上，副本数、多机房和多活才有意义。

## 相关阅读

- 想先搭知识主线：读 [架构师学习路线](./architect-learning-roadmap.md)
- 想按能力项复盘：读 [架构能力自检准备清单](./architect-interview-prep-checklist.md)
- 想聚焦高并发设计：读 [高并发系统设计核心要点](/architecture/high-concurrency-system-design-core-points)
- 想补分布式系统底层：读 [分布式系统设计详解](./distributed-system-design.md)
- 想看交易一致性主线：读 [交易系统一致性设计总览](./transaction-system-consistency-overview.md)
- 想补容量和演练方法：读 [秒杀系统压测脚本、容量估算与演练方法论](./seckill-pressure-testing-capacity-estimation-and-drills.md)
- 想补大促保障与回滚：读 [大促活动预热、压测与开关治理手册](./promotion-readiness-pressure-test-and-switch-governance.md)
