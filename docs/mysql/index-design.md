---
title: MySQL 索引设计与执行计划
description: 系统梳理 InnoDB B+ 树、聚簇索引、回表、最左前缀、索引下推、EXPLAIN、JOIN 优化与索引设计法则。
---

# MySQL 索引设计与执行计划

> MySQL InnoDB 的主键索引和二级索引底层都是 B+ 树。B+ 树适合磁盘场景，因为高度低、范围查询稳定，叶子节点有序，天然支持区间扫描。支付系统里大量查询都是按商户、订单号、时间范围过滤，这正是 B+ 树擅长的场景。

## 阅读地图

这篇文章建议按 `结构 → 命中 → 验证 → 落地` 四步读。先搞清楚 B+ 树和回表，再理解联合索引怎么命中，之后用 `EXPLAIN` 验证，最后落到 `JOIN / GROUP / ORDER` 和索引设计法则上。

<div style="display:flex;justify-content:center;padding:16px 0 24px;">
<div style="font-family:system-ui,sans-serif;max-width:860px;width:100%;">
<svg viewBox="0 0 860 190" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="idx-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
    </marker>
  </defs>

  <text x="430" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">索引设计阅读路径</text>

  <rect x="20" y="50" width="185" height="86" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="112" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">1. 结构</text>
  <text x="112" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">B+ 树 / 页分裂</text>
  <text x="112" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">聚簇索引 / 回表</text>

  <rect x="235" y="50" width="185" height="86" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="327" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-cur-text)">2. 命中</text>
  <text x="327" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">最左前缀 / 联合索引</text>
  <text x="327" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">ICP / 覆盖索引</text>

  <rect x="450" y="50" width="185" height="86" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5"/>
  <text x="542" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">3. 验证</text>
  <text x="542" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">EXPLAIN / ANALYZE</text>
  <text x="542" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">type / key / rows / Extra</text>

  <rect x="665" y="50" width="175" height="86" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="752" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">4. 落地</text>
  <text x="752" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">JOIN / GROUP / ORDER</text>
  <text x="752" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">索引失效 / 设计法则</text>

  <line x1="205" y1="93" x2="235" y2="93" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#idx-map-arrow)"/>
  <line x1="420" y1="93" x2="450" y2="93" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#idx-map-arrow)"/>
  <line x1="635" y1="93" x2="665" y2="93" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#idx-map-arrow)"/>

  <rect x="185" y="150" width="490" height="24" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="430" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先理解“为什么能快”，再分析“为什么这条 SQL 还不够快”</text>
</svg>
</div>
</div>

## 一、B+ 树为什么适合做索引

先把底层结构搞清楚，后面的聚簇索引、回表、最左前缀、页分裂才不会散。

**B+ 树示意图（3 层，千万级数据典型高度）**

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:640px;width:100%;">
<svg viewBox="0 0 640 310" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="bpt-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
    </marker>
    <marker id="bpt-ah2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-border-dash)"/>
    </marker>
  </defs>
  <!-- 标题 -->
  <text x="320" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">B+ 树示意图（3 层）</text>
  <!-- 根节点 -->
  <rect x="240" y="40" width="160" height="38" rx="8" fill="var(--d-indigo)" fill-opacity="0.12" stroke="var(--d-indigo)" stroke-width="1.5"/>
  <text x="320" y="56" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">根节点（非叶）</text>
  <text x="320" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">30 | 60</text>
  <!-- 根 → 中间节点连线 -->
  <line x1="280" y1="78" x2="120" y2="115" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="320" y1="78" x2="320" y2="115" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="360" y1="78" x2="520" y2="115" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <!-- 中间节点 -->
  <rect x="55" y="115" width="130" height="34" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="120" y="137" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">10 | 20</text>
  <rect x="255" y="115" width="130" height="34" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="320" y="137" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">40 | 50</text>
  <rect x="455" y="115" width="130" height="34" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="520" y="137" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">70 | 80</text>
  <!-- 中间节点注释 -->
  <text x="635" y="136" text-anchor="end" font-size="9" fill="var(--d-text-muted)">← 中间节点</text>
  <text x="635" y="148" text-anchor="end" font-size="9" fill="var(--d-text-muted)">只存索引键+页指针</text>
  <!-- 中间 → 叶子连线 -->
  <line x1="88" y1="149" x2="50" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="152" y1="149" x2="170" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="288" y1="149" x2="290" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="352" y1="149" x2="390" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="488" y1="149" x2="470" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <line x1="552" y1="149" x2="570" y2="188" stroke="var(--d-blue-border)" stroke-width="1"/>
  <!-- 叶子节点 -->
  <rect x="15" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="50" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">10</text>
  <text x="50" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <rect x="135" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="170" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">20</text>
  <text x="170" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <text x="240" y="214" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">…</text>
  <rect x="255" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="290" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">40</text>
  <text x="290" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <rect x="355" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="390" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">60</text>
  <text x="390" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <rect x="435" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="470" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">70</text>
  <text x="470" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <rect x="535" y="188" width="70" height="52" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="570" y="207" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">80</text>
  <text x="570" y="222" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">数据</text>
  <!-- 叶子节点双向链表箭头 -->
  <line x1="85" y1="214" x2="135" y2="214" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="135" y1="210" x2="85" y2="210" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="205" y1="214" x2="255" y2="214" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="255" y1="210" x2="205" y2="210" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="325" y1="214" x2="355" y2="214" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="355" y1="210" x2="325" y2="210" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="425" y1="214" x2="435" y2="214" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="435" y1="210" x2="425" y2="210" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="505" y1="214" x2="535" y2="214" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <line x1="535" y1="210" x2="505" y2="210" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-ah2)"/>
  <!-- 叶子节点注释 -->
  <text x="320" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">↑ 叶子节点（双向链表，有序连接，存完整数据）</text>
  <!-- 层级标注 -->
  <rect x="180" y="280" width="280" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="320" y="297" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">3 层即可支撑千万级数据，IO 次数 ≤ 3</text>
</svg>
</div>
</div>

B+ 树三个关键特征：

| 特征 | 含义 | 对查询的价值 |
| --- | --- | --- |
| 非叶子节点只存索引键和页指针 | 单页容纳更多索引项 | 树更矮（3~4 层支撑千万级数据），IO 次数少 |
| 叶子节点存全量数据 | 聚簇索引存整行，二级索引存主键值 | 所有实际数据访问最终落在叶子节点 |
| 叶子节点双向链表有序连接 | 叶子节点按 key 有序排列 | 范围查询、排序、顺序扫描效率高且稳定 |

### B+ 树关键性质速记

可以直接记住这 5 条：

- **性质 1：多路平衡搜索树**。它不是二叉树，而是多叉树，单个节点能容纳更多 key，所以树高更低。
- **性质 2：所有数据都在叶子节点**。内部节点只保存索引键和页指针，主要负责导航，不直接存放完整数据。
- **性质 3：叶子节点按顺序相连**。叶子页通常通过链表有序连接，所以范围查询、排序扫描很高效。
- **性质 4：所有叶子节点在同一层**。任意一次查找走过的层数接近一致，所以查询性能更稳定。
- **性质 5：插入删除通过分裂、合并、借位保持平衡**。树在更新过程中会自我调整，不容易退化成高瘦结构。

### 一句话理解 B+ 树

可以把 B+ 树记成：

> **上层做目录，底层存数据，叶子连成表。**

<div style="display:flex;justify-content:center;padding:12px 0 20px;">
<div style="font-family:system-ui,sans-serif;max-width:720px;width:100%;">
<svg viewBox="0 0 720 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="bpt-memory-link" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-border-dash)"/>
    </marker>
  </defs>

  <text x="360" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">上层做目录，底层存数据，叶子连成表</text>

  <rect x="250" y="42" width="220" height="46" rx="10" fill="var(--d-indigo)" fill-opacity="0.12" stroke="var(--d-indigo)" stroke-width="1.5"/>
  <text x="360" y="61" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">目录层（非叶子节点）</text>
  <text x="360" y="79" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">K1 | K2 | K3</text>

  <line x1="285" y1="88" x2="110" y2="136" stroke="var(--d-blue-border)" stroke-width="1.3"/>
  <line x1="335" y1="88" x2="270" y2="136" stroke="var(--d-blue-border)" stroke-width="1.3"/>
  <line x1="385" y1="88" x2="450" y2="136" stroke="var(--d-blue-border)" stroke-width="1.3"/>
  <line x1="435" y1="88" x2="610" y2="136" stroke="var(--d-blue-border)" stroke-width="1.3"/>

  <rect x="45" y="136" width="130" height="58" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="110" y="159" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">数据页 A</text>
  <text x="110" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">主键范围 1~99</text>

  <rect x="205" y="136" width="130" height="58" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="270" y="159" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">数据页 B</text>
  <text x="270" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">主键范围 100~199</text>

  <rect x="385" y="136" width="130" height="58" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="450" y="159" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">数据页 C</text>
  <text x="450" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">主键范围 200~299</text>

  <rect x="545" y="136" width="130" height="58" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="610" y="159" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">数据页 D</text>
  <text x="610" y="178" text-anchor="middle" font-size="10" fill="var(--d-text)">主键范围 300~399</text>

  <line x1="175" y1="165" x2="205" y2="165" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>
  <line x1="205" y1="161" x2="175" y2="161" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>
  <line x1="335" y1="165" x2="385" y2="165" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>
  <line x1="385" y1="161" x2="335" y2="161" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>
  <line x1="515" y1="165" x2="545" y2="165" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>
  <line x1="545" y1="161" x2="515" y2="161" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#bpt-memory-link)"/>

  <rect x="200" y="206" width="320" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="360" y="221" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">上层负责导航，真正数据落在叶子页，叶子页之间按 key 有序连接</text>
</svg>
</div>
</div>

**为什么不用二叉树或普通 B 树？**

| 结构 | 问题 | 不如 B+ 树的原因 |
| --- | --- | --- |
| 二叉树 | 树高容易很高 | 每次查询走更多层，磁盘 IO 成本高 |
| B 树 | 非叶子节点也存数据 | 单页能放的索引更少，树更高，范围查询也不如 B+ 树稳定 |
| B+ 树 | 非叶子节点只存索引 | 高度低、范围查询快，专为磁盘场景设计 |

### B+ 树页分裂例子

为了把“页分裂”讲清楚，先做一个简化假设：**一个叶子页最多只能放 4 条记录**。

完整示意如下，左侧是分裂前，右侧是分裂后：

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:820px;width:100%;">
<svg viewBox="0 0 820 390" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="split-ah-orange" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/>
    </marker>
    <marker id="split-ah-gray" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-border-dash)"/>
    </marker>
  </defs>

  <text x="410" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">页分裂前后示意（插入主键 400）</text>
  <line x1="400" y1="34" x2="400" y2="350" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- Before -->
  <text x="200" y="46" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">分裂前</text>
  <rect x="125" y="58" width="150" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="200" y="75" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">父节点</text>
  <text x="200" y="92" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">[700]</text>

  <line x1="170" y1="100" x2="115" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="230" y1="100" x2="302" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2"/>

  <rect x="20" y="145" width="190" height="150" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-warn-border)" stroke-width="1.5"/>
  <rect x="20" y="145" width="190" height="26" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="115" y="162" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">P1（已满）</text>
  <rect x="45" y="181" width="140" height="20" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1"/>
  <text x="115" y="195" text-anchor="middle" font-size="10" fill="var(--d-cur-text)" font-weight="bold">100</text>
  <rect x="45" y="207" width="140" height="20" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1"/>
  <text x="115" y="221" text-anchor="middle" font-size="10" fill="var(--d-cur-text)" font-weight="bold">200</text>
  <rect x="45" y="233" width="140" height="20" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1"/>
  <text x="115" y="247" text-anchor="middle" font-size="10" fill="var(--d-cur-text)" font-weight="bold">500</text>
  <rect x="45" y="259" width="140" height="20" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1"/>
  <text x="115" y="273" text-anchor="middle" font-size="10" fill="var(--d-cur-text)" font-weight="bold">600</text>
  <text x="115" y="315" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">插入点在 200 和 500 之间</text>

  <rect x="230" y="145" width="145" height="126" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <rect x="230" y="145" width="145" height="26" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="302" y="162" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">P2</text>
  <rect x="252" y="183" width="100" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="302" y="197" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">700</text>
  <rect x="252" y="209" width="100" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="302" y="223" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">800</text>
  <rect x="252" y="235" width="100" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="302" y="249" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">900</text>

  <!-- Middle action -->
  <text x="410" y="170" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-orange)">插入 ID = 400</text>
  <line x1="340" y1="188" x2="480" y2="188" stroke="var(--d-orange)" stroke-width="1.8" marker-end="url(#split-ah-orange)"/>
  <text x="410" y="212" text-anchor="middle" font-size="10" fill="var(--d-orange)">P1 已满，触发页分裂</text>

  <!-- After -->
  <text x="615" y="46" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">分裂后</text>
  <rect x="520" y="58" width="190" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
  <text x="615" y="75" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">父节点</text>
  <text x="615" y="92" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">[500 | 700]</text>
  <rect x="548" y="108" width="134" height="22" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="615" y="123" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">新增分隔键 500</text>

  <line x1="570" y1="130" x2="480" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="615" y1="130" x2="610" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <line x1="660" y1="130" x2="740" y2="145" stroke="var(--d-blue-border)" stroke-width="1.2"/>

  <rect x="425" y="145" width="110" height="136" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <rect x="425" y="145" width="110" height="26" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="480" y="162" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">P1</text>
  <rect x="445" y="181" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="480" y="195" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">100</text>
  <rect x="445" y="207" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="480" y="221" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">200</text>
  <rect x="445" y="233" width="70" height="20" rx="4" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="480" y="247" text-anchor="middle" font-size="10" fill="var(--d-cur-text)" font-weight="bold">400</text>

  <rect x="550" y="145" width="120" height="120" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <rect x="550" y="145" width="120" height="26" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
  <text x="610" y="162" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">P3（新页）</text>
  <rect x="575" y="185" width="70" height="20" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
  <text x="610" y="199" text-anchor="middle" font-size="10" fill="var(--d-warn-text)" font-weight="bold">500</text>
  <rect x="575" y="211" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="610" y="225" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">600</text>

  <rect x="685" y="145" width="110" height="136" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <rect x="685" y="145" width="110" height="26" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
  <text x="740" y="162" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">P2</text>
  <rect x="705" y="181" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="740" y="195" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">700</text>
  <rect x="705" y="207" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="740" y="221" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">800</text>
  <rect x="705" y="233" width="70" height="20" rx="4" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="740" y="247" text-anchor="middle" font-size="10" fill="var(--d-text)" font-weight="bold">900</text>

  <line x1="535" y1="298" x2="550" y2="298" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#split-ah-gray)"/>
  <line x1="670" y1="298" x2="685" y2="298" stroke="var(--d-border-dash)" stroke-width="1.2" marker-end="url(#split-ah-gray)"/>
  <text x="610" y="320" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">叶子页仍按顺序相连</text>

  <rect x="470" y="338" width="290" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="615" y="354" text-anchor="middle" font-size="10" fill="var(--d-warn-text)" font-weight="bold">上推的是新右页边界值 500，不是新插入值 400</text>
</svg>
</div>
</div>

插入的本质可以记成：

> **找到叶子页 → 插入记录 → 页满则分裂 → 向上调整索引**

现在插入主键 `400`，过程是：

1. `400` 应该插在 `200` 和 `500` 之间
2. 但 `P1` 已满，无法直接塞进去
3. InnoDB 会申请一个新页，把 `P1` 的部分记录搬过去
4. 父节点新增一个分隔键，指向新页

这里有两个面试里很容易答错的点：

- **页分裂不是简单机械地对半分**。中间插入时，结果通常接近对半；顺序插入时，InnoDB 会更偏向给未来写入留空间，目的是提升页利用率并减少后续分裂次数。
- **上推的通常不是中位数，也不是新插入值本身**，而是**右子节点的最小值**。在这个例子里就是 `500`，你可以把它理解成父节点新增的一条“分隔路标”。

也就是说，真正“上推”到父节点的，通常不是新插入的 `400`，而是**新右页的边界值**（这里可近似理解为 `500`）。你可以把它理解成：“父节点多记了一条路标，用来告诉查询该往哪一页走”。

这件事为什么影响性能：

- 需要申请新页，并移动部分记录，写放大更明显
- 父节点也要更新；如果父节点也满了，分裂可能继续向上递归
- 原来一个页能放下的数据，被拆成两个页，空间利用率会下降

这也是为什么 **自增主键通常优于随机主键**：

- 自增主键大多只会往最右侧叶子页追加，写入更顺
- 随机主键更容易插到中间位置，更容易触发页内挪动和页分裂

> 核心结论：**高性能 MySQL 的核心是让查询尽可能在内存中结束，让磁盘操作尽可能顺序化**。B+ 树的矮胖结构和有序叶子节点正好满足这两点。

搞清楚了 B+ 树为什么快之后，下一步要区分聚簇索引和二级索引——这决定了查询是直接命中数据，还是需要回表。

---

## 二、聚簇索引、回表与主键设计

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:680px;width:100%;">
<svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="idx-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/>
    </marker>
  </defs>
  <!-- 左侧标题 -->
  <text x="165" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">聚簇索引（主键索引）</text>
  <text x="165" y="38" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">叶子节点存完整行数据</text>
  <!-- 右侧标题 -->
  <text x="515" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-green)">二级索引（name 字段）</text>
  <text x="515" y="38" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">叶子节点只存索引字段 + 主键</text>
  <!-- 中间分隔线 -->
  <line x1="340" y1="10" x2="340" y2="200" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,4"/>
  <!-- 聚簇索引叶子节点 -->
  <rect x="18" y="55" width="195" height="42" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="115" y="72" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">id=1 | name=张三 | amt=100</text>
  <text x="115" y="88" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">完整行数据</text>
  <rect x="18" y="103" width="195" height="42" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="115" y="120" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">id=2 | name=李四 | amt=200</text>
  <text x="115" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">完整行数据</text>
  <rect x="18" y="151" width="195" height="42" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
  <text x="115" y="168" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">id=3 | name=王五 | amt=300</text>
  <text x="115" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">完整行数据</text>
  <!-- 左侧注释箭头 -->
  <text x="265" y="125" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">↑</text>
  <text x="265" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按主键有序</text>
  <!-- 二级索引叶子节点 -->
  <rect x="380" y="55" width="160" height="42" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="460" y="72" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">name=李四 | id=2</text>
  <text x="460" y="88" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">索引字段 + 主键</text>
  <rect x="380" y="103" width="160" height="42" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="460" y="120" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">name=王五 | id=3</text>
  <text x="460" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">索引字段 + 主键</text>
  <rect x="380" y="151" width="160" height="42" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="460" y="168" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">name=张三 | id=1</text>
  <text x="460" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">索引字段 + 主键</text>
  <!-- 右侧注释箭头 -->
  <text x="595" y="125" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">↑</text>
  <text x="595" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 name 有序</text>
  <!-- 回表箭头 -->
  <path d="M 460,193 C 460,230 115,230 115,195" fill="none" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="6,3" marker-end="url(#idx-ah)"/>
  <text x="290" y="240" text-anchor="middle" font-size="10" fill="var(--d-orange)" font-weight="bold">回表：通过主键回聚簇索引取完整行</text>
</svg>
</div>
</div>

先把两个容易混淆的概念拆开：

| 类型 | 物理含义 | 叶子节点存什么 | 常见代价 |
| --- | --- | --- | --- |
| 聚簇索引 | 表数据本身按主键组织成一棵 B+ 树 | 完整行记录 | 主键变长会让整棵树更胖 |
| 二级索引 | 按非主键列额外维护的 B+ 树 | 索引列值 + 主键值 | 命中后常常还要回表 |

在 InnoDB 里，**表本身就是按主键组织的一棵 B+ 树**。所以”聚簇索引”不是”额外多建了一个特殊索引”，而是”数据本身就放在主键索引的叶子节点里”。

这会带来三个设计结论：

- **主键越长，所有二级索引越大**：因为二级索引叶子节点保存的不是行地址，而是主键值。
- **主键越随机，插入越容易页分裂**：UUID 这类离散主键更容易打乱页内顺序，自增主键更利于顺序写入。
- **最好显式定义一个短小稳定的主键**：如果没有主键，InnoDB 会优先选第一个 `NOT NULL UNIQUE` 索引；再没有时才会生成隐藏行 ID。

| 概念 | 含义 | 性能影响 |
| --- | --- | --- |
| 回表 | 先通过二级索引拿到主键，再回主键索引树查完整行 | 多一次 IO |
| 覆盖索引 | 查询字段都包含在索引里，直接返回，无需回表 | 性能最优 |

```sql
-- 需要回表（SELECT * 包含了索引外的字段）
SELECT * FROM payment_order WHERE merchant_id = ?;

-- 覆盖索引（order_id、status 都在联合索引里，无需回表）
SELECT order_id, status FROM payment_order WHERE merchant_id = ?;
```

> 优化 SQL 时，除了”能不能走索引”，还要追问一句”走了索引之后要不要回表”。

### 为什么不建议 UUID 做主键

如果面试里被问到这个问题，可以直接答：

> **因为 InnoDB 的主键就是聚簇索引，随机 UUID 会让 B+ 树插入变成随机写。**

本质链路是：

- 插入位置随机，容易打到中间叶子页
- 中间写更容易触发页分裂和记录搬移
- 页分裂会带来更多磁盘 IO 和脏页刷写
- 数据页局部性变差，Buffer Pool 命中率下降
- 页之间顺序性被破坏后，范围扫描和顺序扫描也会更慢

所以常说“UUID 会拖垮 B+ 树性能”，真正的底层原因并不是 UUID 这个类型本身，而是**主键完全随机**。这在随机 UUID，尤其 UUID v4 上最明显。

相比之下，自增主键的插入几乎总是落在最右侧叶子页，基本是顺序追加：

- 更少页分裂
- 更少数据移动
- 更好的缓存局部性
- 更稳定的写入吞吐

理解了 B+ 树结构和回表之后，下一步要弄清楚联合索引到底怎么命中——这决定了你的 SQL 能不能真正利用索引。

---

## 三、联合索引怎么命中

这一部分只回答一个问题：一条 SQL 到底是真的命中了联合索引，还是只是“看起来写了索引列”。

假设创建了联合索引 `INDEX(merchant_id, created_at, status)`，可以把它理解为一本电话簿：先按 `merchant_id` 排序，相同再按 `created_at`，相同再按 `status`。

**命中规则示意**

<div style="display:flex;justify-content:center;padding:20px 0;">
<div style="font-family:system-ui,sans-serif;max-width:680px;width:100%;">
<svg viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <!-- 标题 -->
  <text x="340" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">联合索引：INDEX(merchant_id, created_at, status)</text>
  <!-- 索引列标题栏 -->
  <rect x="30" y="38" width="140" height="24" rx="4" fill="var(--d-indigo)" fill-opacity="0.12" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="100" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-indigo)">merchant_id</text>
  <rect x="175" y="38" width="130" height="24" rx="4" fill="var(--d-indigo)" fill-opacity="0.12" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="240" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-indigo)">created_at</text>
  <rect x="310" y="38" width="100" height="24" rx="4" fill="var(--d-indigo)" fill-opacity="0.12" stroke="var(--d-indigo)" stroke-width="1"/>
  <text x="360" y="55" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-indigo)">status</text>
  <text x="470" y="55" text-anchor="start" font-size="10" font-weight="bold" fill="var(--d-text-sub)">查询条件</text>
  <text x="645" y="55" text-anchor="end" font-size="10" font-weight="bold" fill="var(--d-text-sub)">结果</text>
  <!-- 分隔线 -->
  <line x1="30" y1="68" x2="650" y2="68" stroke="var(--d-border)" stroke-width="1"/>

  <!-- 行1: merchant_id = 1001 → 命中第1列 ✅ -->
  <rect x="30" y="78" width="140" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="100" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">= 1001</text>
  <rect x="175" y="78" width="130" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <rect x="310" y="78" width="100" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="470" y="98" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE merchant_id = 1001</text>
  <text x="645" y="98" text-anchor="end" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">命中 1 列</text>

  <!-- 行2: merchant_id = 1001 AND created_at > X → 命中前2列 ✅ -->
  <rect x="30" y="118" width="140" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="100" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">= 1001</text>
  <rect x="175" y="118" width="130" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="240" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">> X</text>
  <rect x="310" y="118" width="100" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="470" y="138" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE merchant_id = 1001 AND created_at > X</text>
  <text x="645" y="138" text-anchor="end" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">命中 2 列</text>

  <!-- 行3: 三列都有，但 status 利用率弱 ⚠️ -->
  <rect x="30" y="158" width="140" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="100" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">= 1001</text>
  <rect x="175" y="158" width="130" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="240" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">> X</text>
  <rect x="310" y="158" width="100" height="30" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="360" y="178" text-anchor="middle" font-size="10" fill="var(--d-warn-text)" font-weight="bold">= 1</text>
  <text x="470" y="178" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE ... AND status = 1</text>
  <text x="645" y="178" text-anchor="end" font-size="10" fill="var(--d-warn-text)" font-weight="bold">2 列 + 弱</text>

  <!-- 分隔线 -->
  <line x1="30" y1="198" x2="650" y2="198" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,3"/>

  <!-- 行4: 跳过最左列 ❌ -->
  <rect x="30" y="208" width="140" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <rect x="175" y="208" width="130" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
  <text x="240" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)" font-weight="bold">> X</text>
  <rect x="310" y="208" width="100" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="470" y="228" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE created_at > X</text>
  <text x="645" y="228" text-anchor="end" font-size="10" fill="var(--d-rv-c-text)" font-weight="bold">全表扫描</text>

  <!-- 行5: merchant_id + status 断层 ⚠️ -->
  <rect x="30" y="248" width="140" height="30" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
  <text x="100" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">= 1001</text>
  <rect x="175" y="248" width="130" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <rect x="310" y="248" width="100" height="30" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
  <text x="360" y="268" text-anchor="middle" font-size="10" fill="var(--d-warn-text)" font-weight="bold">= 1</text>
  <text x="470" y="268" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE merchant_id = 1001 AND status = 1</text>
  <text x="645" y="268" text-anchor="end" font-size="10" fill="var(--d-warn-text)" font-weight="bold">1 列 + 断层</text>

  <!-- 行6: 缺少最左列 ❌ -->
  <rect x="30" y="288" width="140" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="3,3"/>
  <rect x="175" y="288" width="130" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
  <text x="240" y="308" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)" font-weight="bold">> X</text>
  <rect x="310" y="288" width="100" height="30" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
  <text x="360" y="308" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)" font-weight="bold">= 1</text>
  <text x="470" y="308" text-anchor="start" font-size="9" fill="var(--d-text-sub)">WHERE created_at > X AND status = 1</text>
  <text x="645" y="308" text-anchor="end" font-size="10" fill="var(--d-rv-c-text)" font-weight="bold">全表扫描</text>
</svg>
</div>
</div>

| 规则 | 含义 | 原因 |
| --- | --- | --- |
| 必须从最左列开始 | 缺少最左列，索引通常不生效 | 整棵树按最左列全局有序 |
| 不能跳过中间列 | 跳过后，后续列利用率明显下降 | 跳过列后的列不是全局有序的 |
| 范围查询会减弱后续列命中 | 某列做范围扫描后，后续列利用率下降 | 范围内部有序，但跨范围后续列不保证有序 |

> 联合索引的有序性是层层展开的，不满足前一层，后一层的顺序性就无法独立利用。

### WHERE 条件顺序会影响索引吗

不会。`WHERE` 里的条件书写顺序通常**不影响** MySQL 是否使用联合索引，优化器会自己分析谓词并选择执行计划。

假设有索引：

```sql
INDEX idx_user_status_time (user_id, status, create_time)
```

下面两种写法，对优化器来说是等价的：

```sql
SELECT ...
FROM orders
WHERE user_id = ? AND status = ?
ORDER BY create_time DESC;

SELECT ...
FROM orders
WHERE status = ? AND user_id = ?
ORDER BY create_time DESC;
```

只要 `user_id`、`status` 都是等值条件，且命中了联合索引的最左前缀，`ORDER BY create_time DESC` 也有机会直接利用索引顺序，避免额外排序。

真正影响索引利用率的，不是 `WHERE` 条件的书写顺序，而是下面这些情况：

| 场景 | 示例 | 影响 |
| --- | --- | --- |
| 缺少最左列 | `WHERE status = ? ORDER BY create_time DESC` | 跳过 `user_id`，联合索引通常无法按预期命中 |
| 跳过中间列 | `WHERE user_id = ? AND create_time > ? AND status = ?` | `status` 被隔开，后续列利用率下降 |
| 中间列是范围查询 | `WHERE user_id = ? AND status > ? ORDER BY create_time DESC` | `status` 范围扫描后，`create_time` 的顺序优势通常无法继续利用 |
| 对索引列做函数/计算 | `WHERE DATE(create_time) = ?` | 破坏索引有序性，容易退化为扫描 |

一句话记忆：

- `WHERE` 条件写在前还是写在后，不重要
- 联合索引列有没有从左到右连续命中，很重要
- 一旦中间出现范围查询，后续列通常就很难继续同时服务过滤和排序

### 索引下推（ICP，MySQL 5.6+）

假设有联合索引 `INDEX(merchant_id, created_at, status)`，查询：

```sql
SELECT *
FROM payment_order
WHERE merchant_id = 1001
  AND created_at >= '2026-01-01'
  AND status = 1;
```

这条 SQL 里：

- `merchant_id`、`created_at` 用来定位索引范围
- `status` 虽然在范围列后面，不能继续缩小扫描起点，但仍可以在扫描二级索引叶子节点时先做过滤
- 只有通过过滤的记录，才需要回表取完整行

| 场景 | 执行过程 | 回表次数 |
| --- | --- | --- |
| 无 ICP | 根据前两列扫描出一批主键，逐条回表后再判断 `status = 1` | 多 |
| 有 ICP | 先在二级索引叶子节点判断 `status = 1`，只有命中的主键才回表 | 少 |

ICP 本质上不是“让后续列继续完整命中联合索引”，而是**把原本在 Server 层做的部分过滤，下推到存储引擎的索引遍历阶段完成**。它常见于“前面列已经用于定位，后面列继续参与过滤”的查询。

`EXPLAIN` 里看到 `Using index condition` 就说明 ICP 生效；如果看到的是 `Using index`，那通常是覆盖索引，两者不是一回事。

规则讲完了，怎么验证你的 SQL 真的走了索引？用 EXPLAIN。

---

## 四、用 EXPLAIN 验证优化是否真的生效

一句话理解：

> **`EXPLAIN` 的核心就是看访问方式（`type`）、是否用索引（`key`）、扫描行数（`rows`）、以及是否有额外开销（`Extra`），然后针对性优化索引或 SQL。**

`EXPLAIN` 里最重要的几个字段：

**`type`（扫描类型）**

| type | 说明 | 判断 |
| --- | --- | --- |
| `system` / `const` | 主键或唯一索引命中，返回一行 | 非常好 |
| `eq_ref` | 多表关联时命中主键或唯一索引 | 很好 |
| `ref` | 普通索引或联合索引前缀 | 一般不错 |
| `range` | 索引范围扫描（`BETWEEN`、`>`、`IN`） | 常见且可接受 |
| `index` | 全索引扫描 | 可能是覆盖索引，也可能过滤性不足 |
| `ALL` | 全表扫描 | 需要重点优化 |

**`key` 和 `key_len`**

- `key`：实际选择的索引名；`NULL` 意味着没走索引
- `key_len`：实际使用的索引长度；可判断联合索引命中了几列（不是越大越好）

**`Extra`**

- `Using index`：覆盖索引，无需回表
- `Using index condition`：索引下推（ICP）生效
- `Using filesort`：需要额外排序，关注排序字段和索引设计
- `Using temporary`：使用了临时表，常见于 `GROUP BY`、`DISTINCT` 设计不合理

这里最容易混淆的是：

- `Using index` 重点在**结果列都在索引里**，通常意味着覆盖索引
- `Using index condition` 重点在**过滤条件提前到索引遍历阶段执行**，仍然可能回表

### EXPLAIN 和 EXPLAIN ANALYZE 的区别

一句话记忆：

> **`EXPLAIN` 是“预判”，`EXPLAIN ANALYZE` 是“真实执行 + 耗时分析”，用于定位 SQL 性能瓶颈。**

如果只看 `EXPLAIN`，你拿到的是**优化器的预估执行计划**；如果看 `EXPLAIN ANALYZE`，你拿到的是**语句真实跑了一遍之后的实际执行信息**。

| 维度 | `EXPLAIN` | `EXPLAIN ANALYZE` |
| --- | --- | --- |
| 是否真正执行 SQL | 通常不执行，只展示计划 | 会真实执行 SQL |
| 看到的内容 | 访问路径、预估行数、预估代价 | 实际耗时、实际行数、loops、迭代器树 |
| 常见输出 | 表格（`TRADITIONAL`）或 `JSON` / `TREE` | `TREE` 格式 |
| 适合场景 | 先快速判断是否走索引、是否有 filesort / temporary | 验证优化器估算是否靠谱，定位真正慢在哪一层 |
| 使用风险 | 很低 | 会跑 SQL，重查询不要在高峰期直接乱跑 |

在 MySQL 8.0.18+，`EXPLAIN ANALYZE` 可用于对比“估算”和“实际”是否一致。它会真正执行查询，然后输出每个迭代器的：

- 预估成本（`cost`）
- 预估返回行数
- 实际耗时（`actual time`）
- 实际返回行数（`rows`）
- 循环次数（`loops`）

例如：

```sql
EXPLAIN ANALYZE
SELECT *
FROM payment_order
WHERE merchant_id = 1001
  AND created_at >= '2026-01-01'
  AND status = 1;
```

你通常会看到类似这种树状输出：

<div style="display:flex;justify-content:center;padding:10px 0 18px;">
<div style="font-family:system-ui,sans-serif;max-width:860px;width:100%;">
<svg viewBox="0 0 860 240" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
  <defs>
    <marker id="explain-tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
    </marker>
  </defs>

  <text x="430" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">EXPLAIN ANALYZE 输出重点</text>

  <rect x="40" y="52" width="520" height="92" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
  <text x="66" y="85" font-size="13" font-family="ui-monospace,SFMono-Regular,Consolas,Monaco,monospace" fill="var(--d-text)">-&gt; Index range scan on payment_order using idx_mch_time_status</text>
  <text x="66" y="108" font-size="13" font-family="ui-monospace,SFMono-Regular,Consolas,Monaco,monospace" fill="var(--d-text)">   (cost=12.40 rows=820)</text>
  <text x="66" y="131" font-size="13" font-family="ui-monospace,SFMono-Regular,Consolas,Monaco,monospace" fill="var(--d-text)">   (actual time=0.120..3.450 rows=820 loops=1)</text>

  <line x1="390" y1="108" x2="620" y2="70" stroke="var(--d-blue-border)" stroke-width="1.3" marker-end="url(#explain-tree-arrow)"/>
  <rect x="620" y="52" width="190" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.3"/>
  <text x="715" y="65" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">优化器预估</text>
  <text x="715" y="79" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">`cost` / 预估 `rows`</text>

  <line x1="340" y1="131" x2="620" y2="114" stroke="var(--d-blue-border)" stroke-width="1.3" marker-end="url(#explain-tree-arrow)"/>
  <rect x="620" y="98" width="190" height="34" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.3"/>
  <text x="715" y="111" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真实执行</text>
  <text x="715" y="125" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">`actual time` / 实际 `rows`</text>

  <line x1="480" y1="131" x2="620" y2="158" stroke="var(--d-blue-border)" stroke-width="1.3" marker-end="url(#explain-tree-arrow)"/>
  <rect x="620" y="144" width="190" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.3"/>
  <text x="715" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">嵌套循环重点</text>
  <text x="715" y="171" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">`loops` 越大越要警惕放大效应</text>

  <rect x="150" y="192" width="560" height="24" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
  <text x="430" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先看估算，再看实际；估算和实际差得越大，越要怀疑统计信息、索引设计或谓词选择性</text>
</svg>
</div>
</div>

这里要重点看三件事：

- **预估行数和实际行数差多少**：如果优化器估 100 行，实际扫了 10 万行，统计信息或谓词选择性判断可能有问题
- **哪一层 actual time 特别高**：能看出慢在回表、排序、临时表，还是某个 join 节点
- **loops 是否异常大**：嵌套循环里某个子节点 loops 很高，往往意味着 join 顺序或索引设计不合理

一个很实用的排查顺序是：

1. 先用 `EXPLAIN` 看 `type / key / rows / Extra`
2. 如果计划看起来“像是能跑快”，但实际还是慢，再用 `EXPLAIN ANALYZE`
3. 如果 `EXPLAIN` 的 `rows` 和 `EXPLAIN ANALYZE` 的实际行数差距很大，优先怀疑统计信息失真、数据分布倾斜、隐式转换、函数计算或联合索引设计不匹配

补一句经验：

- `EXPLAIN` 适合回答“优化器打算怎么跑”
- `EXPLAIN ANALYZE` 适合回答”数据库实际上是怎么慢的”

单表索引优化搞定之后，还要把索引能力延伸到多表 JOIN、GROUP BY 和 ORDER BY 的场景里。

---

## 五、把索引能力放到 JOIN / GROUP / ORDER 里

### JOIN 的本质与驱动顺序

一句话理解：

> **JOIN 的本质不是”把两张表自动拼起来”，而是”先从一张表拿行，再拿这些行里的关联键去另一张表做匹配”。**

从执行器视角看，最常见的思路依然是”嵌套循环”：

1. 先选一张表作为**驱动表**
2. 从驱动表取出一行或一批行
3. 用其中的关联键去另一张表查找匹配行
4. 把两边匹配到的行拼成结果集
5. 重复这个过程直到驱动表遍历结束

因此，JOIN 性能最关键的问题通常不是”能不能写 JOIN”，而是：

- **被驱动表的关联列能不能高效匹配**
- **驱动表经过过滤后是不是足够小**

| 角色 | 做什么 | 性能关键点 |
| --- | --- | --- |
| 驱动表 | 先被扫描，向外层循环提供数据 | 过滤后越小越好 |
| 被驱动表 | 根据驱动表给出的关联键去匹配 | 关联列最好有索引 |

为什么常说”小表做驱动表”？

- 驱动表每多一行，被驱动表就要多做一次匹配
- 外层循环次数通常由驱动表决定，所以驱动表越小，总成本越低
- 这里的”小”不是物理总行数小，而是**经过 `WHERE` 过滤后参与 JOIN 的结果集更小**

### 被驱动表索引与常见慢场景

假设有 SQL：

```sql
SELECT *
FROM orders o
JOIN payment p ON o.order_id = p.order_id
WHERE o.merchant_id = 1001;
```

如果 `p.order_id` 上有索引，过程通常是：

- 先从 `orders` 中找出 `merchant_id = 1001` 的那批行
- 对每一行 `o.order_id`，去 `payment` 的索引里做快速查找
- 这种 JOIN 本质上是”外层循环 + 内层索引查找”，成本通常可控

如果 `p.order_id` 上没有索引，问题就来了：

- 每拿到一行 `o.order_id`，都可能要扫描 `payment` 的大量行甚至全表
- 结果会退化成”驱动表行数 × 被驱动表扫描代价”
- 这就是为什么无索引 JOIN 很容易指数级变慢

所以索引设计里有一条非常硬的经验：

> **JOIN 要快，被驱动表的关联列必须有索引。**

| 场景 | 本质 | 常见现象 |
| --- | --- | --- |
| 被驱动表索引命中 | 外层循环 + 内层索引查找 | `type=ref` / `eq_ref`，性能通常较稳 |
| 被驱动表无可用索引 | 只能走 Join Buffer / 大量扫描 | `rows` 很大，`Extra` 出现 `Using join buffer` |
| 驱动表选错 | 外层循环次数过多 | 明明有索引，实际仍然很慢 |
| 关联列类型不一致 | 索引无法按预期命中 | `key` 异常、`rows` 偏大、隐式转换 |

补一个版本细节：

- 在较老的资料里，你会经常看到 `Block Nested Loop`
- 在 **MySQL 8.0.20+**，很多原先 BNL 出现的场景会改为 `hash join`
- 所以现在在 `EXPLAIN` 的 `Extra` 里，更常见的是 `Using join buffer (hash join)` 这类提示

### 用 EXPLAIN 诊断 JOIN

`EXPLAIN` 里每个表通常对应一行。看 JOIN 时，重点不是只盯一行，而是看整条链路：

1. **谁先被访问**：这反映了驱动表顺序
2. **被驱动表的 `type` 是不是 `ref` / `eq_ref`**：这是 JOIN 是否用上索引的核心信号
3. **`key` 是否是关联列上的索引**：没有索引或索引选错，JOIN 通常就会慢
4. **`rows` 是否异常大**：尤其是被驱动表扫描行数很大时，要警惕放大效应
5. **`Extra` 是否出现 `Using join buffer`**：通常意味着没走到理想的索引匹配路径

一个经验判断：

- **好 JOIN**：驱动表先过滤，被驱动表 `type=ref/eq_ref`，`key` 明确，`rows` 可控
- **坏 JOIN**：被驱动表 `ALL` / `index`，`key=NULL` 或 `Extra=Using join buffer (...)`

如果一条 JOIN SQL 很慢，排查顺序通常是：

1. 先确认驱动表是不是过滤后的”小结果集”
2. 再确认被驱动表的关联列上有没有索引
3. 再看关联列类型、字符集、排序规则是否一致，避免隐式转换
4. 如果还是慢，用 `EXPLAIN ANALYZE` 看哪一层节点的 `actual time / rows / loops` 异常

JOIN 优化原则速记：

- **`JOIN ON` 字段必须有索引**：尤其是被驱动表的关联列，不能让匹配退化成全表扫描
- **小表驱动大表**：黄金原则是让过滤后更小的结果集做驱动表，减少外层循环次数
- **减少数据量，过滤前置**：能在 JOIN 前先过滤的条件，尽量先过滤，别把大结果集带进 JOIN
- **尽量做覆盖索引**：如果被驱动表查到索引就能直接返回需要的列，可以减少回表成本
- **不要让被驱动表全表扫描**：一旦被驱动表 `ALL` 或 `Using join buffer (...)`，放大效应通常会很明显

把这几条压成一句话就是：

> **JOIN 的性能核心在于：减少循环次数 + 让每次查找更快，而”每次查找更快”本质上依赖索引。**

### JOIN + GROUP + ORDER 三件套

如果一条 SQL 既有 `JOIN`，又有 `GROUP BY`、`ORDER BY`，优化思路可以再压成 5 条：

- **先减少 JOIN 数据量**：先用 `WHERE` 把驱动表过滤小，再去做关联，别把大结果集带进聚合和排序
- **`GROUP BY` 想要快，通常要尽量走索引**：否则很容易出现 `Using temporary`
- **`GROUP BY` 和 `ORDER BY` 尽量保持一致**：列一致、方向一致时，更容易复用同一段索引顺序，减少额外排序
- **联合索引按 `WHERE → GROUP BY → ORDER BY` 设计**：尤其是等值过滤列放前面，后面再接分组列和排序列
- **尽量避免 `Using temporary` 和 `Using filesort`**：这两个信号通常意味着聚合或排序没吃到理想索引

可以把这段理解成一个更完整的优化目标：

> **先把参与 JOIN 的数据量压小，再让分组和排序尽量复用索引顺序。**

举个很典型的例子：

```sql
SELECT o.merchant_id, COUNT(*) AS cnt
FROM orders o
JOIN payment p ON p.order_id = o.id
WHERE o.created_at >= '2026-01-01'
  AND p.status = 1
GROUP BY o.merchant_id
ORDER BY o.merchant_id;
```

这类 SQL 的排查顺序通常是：

1. 先看 `p.order_id`、`p.status`、`o.created_at` 这些过滤和关联列有没有可用索引
2. 再看 `GROUP BY o.merchant_id` 能不能复用索引顺序，避免临时表
3. 再看 `ORDER BY o.merchant_id` 是否和 `GROUP BY` 一致，避免额外 `filesort`
4. 最后用 `EXPLAIN` / `EXPLAIN ANALYZE` 确认 `Extra` 里有没有 `Using temporary`、`Using filesort`

如果要把这段压成一句面试回答，可以这么说：

> **JOIN 的本质是嵌套匹配。性能好不好，核心看两件事：驱动表要尽量小，被驱动表关联列要有索引。**

JOIN、GROUP、ORDER 都讲完了，最后收束到实际设计——哪些写法会让索引失效，以及设计索引时应该遵循什么法则。

---

## 六、索引失效与设计法则

### 最常见的索引失效场景

先记住一个总原则：

> **索引失效 / 不走索引，本质上通常只有两种情况：**
>
> 1. **无法利用 B+ 树的有序性**
> 2. **优化器判断使用索引的成本更高**

B+ 树的优势，不只是“有索引”，而是 key 在树里按顺序组织。只要 SQL 写法让 MySQL 不能顺着这个顺序去定位起点、缩小扫描范围、复用排序结果，索引价值就会明显下降。再往下拆，实战里几乎都可以记成三类：

| 类型 | 本质 | 典型场景 |
| --- | --- | --- |
| 破坏有序性 | 索引里存的是原始值，但比较前先被加工了 | 函数、表达式、隐式类型转换 |
| 无法形成连续区间 | 不能从 B+ 树里快速圈定一段连续叶子区间 | 不符合最左前缀、跳过中间列、范围查询截断、`LIKE '%abc'` |
| 优化器觉得不划算 | 即使能走索引，扫描和回表总成本也可能更高 | `OR`、`!=` / `<>`、低选择性、回表太多 |

把这张表翻译成人话，就是两句：

- **无法定位连续区间**
- **或者必须对每一行做计算**

再加上第三种现实情况：**优化器觉得走索引不划算**。

下面把常见写法按这个思路展开。

#### 1. 不符合最左前缀

假设有联合索引：

```sql
CREATE INDEX idx_abc ON t(a, b, c);
```

下面这两种写法通常无法高效利用这个联合索引：

```sql
SELECT * FROM t WHERE b = 2;
SELECT * FROM t WHERE c = 3;
```

原因很简单：这棵 B+ 树是按 `(a, b, c)` 的顺序组织的。没有 `a`，就找不到入口，也就无法快速定位某个连续区间。

#### 2. 跳过中间列

```sql
SELECT * FROM t WHERE a = 1 AND c = 3;
```

这里 `a = 1` 可以先圈定一段范围，但 `b` 没有限定，`c` 在这段范围内就不是连续有序的，所以通常不能继续用于索引定位。

一句话记忆：**`a` 确定了，但 `b` 不确定，`c` 就不再连续。**

#### 3. 范围查询导致后续列难继续利用

```sql
SELECT * FROM t WHERE a = 1 AND b > 2 AND c = 3;
```

这条 SQL 里：

- `a` 可以命中
- `b` 也可以命中，但它已经从“点查找”变成了“范围扫描”
- `c` 往往就不能继续参与索引定位了

原因是 `b > 2` 会把扫描范围扩成一段区间，`c` 失去“连续区间”上的顺序优势。更准确地说，`c` 可能仍能通过 ICP 在索引叶子节点中过滤，但通常不能继续缩小扫描起点和终点。

#### 4. 对索引列做函数或运算

```sql
SELECT * FROM t WHERE YEAR(create_time) = 2024;
SELECT * FROM t WHERE a + 1 = 10;
```

原因是 B+ 树里存的是原始值，不是计算后的值。列一旦先经过函数或表达式加工，就等于把原本的有序性打散了，优化器很难直接利用索引里的顺序。

更好的写法是把计算放到常量一侧：

```sql
SELECT * FROM t
WHERE create_time >= '2024-01-01'
  AND create_time < '2025-01-01';
```

#### 5. 隐式类型转换

更常见的坑是：**列是字符串类型，参数却按数字传入**。

```sql
-- phone 是 VARCHAR
SELECT * FROM user WHERE phone = 13800138000;
```

这类情况下，MySQL 可能需要在比较时做类型转换，等价于“先加工列值再比较”，索引就可能失效。

更稳妥的写法是保证比较两边类型一致：

```sql
SELECT * FROM user WHERE phone = '13800138000';
```

#### 6. `LIKE` 以 `%` 开头

```sql
SELECT * FROM user WHERE name LIKE '%abc';
```

原因是前缀不确定，优化器不知道应该从哪一段索引开始找，也就无法利用 B+ 树的前缀有序性。

下面这种前缀匹配通常可以利用索引：

```sql
SELECT * FROM user WHERE name LIKE 'abc%';
```

#### 7. `OR` 条件

```sql
SELECT * FROM t WHERE a = 1 OR b = 2;
```

如果两个条件不能落到同一条清晰的索引访问路径上，或者其中一边没有合适索引，优化器就可能认为合并成本太高，直接放弃索引。

在语义允许的情况下，可以考虑拆成两条再合并：

```sql
SELECT * FROM t WHERE a = 1
UNION ALL
SELECT * FROM t WHERE b = 2;
```

如果两部分结果可能重复，就要自行去重，或者改用 `UNION`。

#### 8. 使用 `!=` 或 `<>`

```sql
SELECT * FROM t WHERE a <> 10;
```

这类条件往往会命中非常大的结果集。即使理论上可以走索引，优化器也常常会判断“扫索引 + 大量回表”不如直接全表扫描。

#### 9. 低选择性条件

```sql
SELECT * FROM user WHERE gender = '男';
```

如果某个值能匹配到表里很大一部分数据，索引的筛选能力就很弱。此时走索引并不能明显减少扫描行数，反而可能增加随机 IO，优化器就容易放弃。

#### 10. 非覆盖查询回表成本过高

```sql
-- 只有 idx_name(name)
SELECT * FROM user WHERE name = 'Alice';
```

即使 `name` 上有索引，如果匹配行数较多，或者每次都要回表取整行，总代价也可能高于全表扫描。于是优化器会判断“不如直接扫表”。

如果查询字段本身都在索引里，就更容易走覆盖索引：

```sql
SELECT name FROM user WHERE name = 'Alice';
```

> 真正要记的不是 10 条零散规则，而是这 3 类根因：
>
> - **破坏有序性**：函数、表达式、类型转换
> - **无法形成连续区间**：不符合最左前缀、跳列、范围后续列失效、前导 `%`
> - **优化器觉得不划算**：`OR`、`!=`、低选择性、回表太多

### 索引设计黄金法则

- **区分度优先**：高区分度字段放联合索引左边
- **覆盖索引优先**：查询字段尽量包含在联合索引里，减少回表
- **禁止对索引列做函数操作**：`WHERE YEAR(created_at)=2026` 会让索引失效
- **自增主键优先**：减少 B+ 树页分裂，保证插入顺序性
- **控制索引数量**：单表索引不宜超过 5~6 个，`INSERT/UPDATE/DELETE` 都要维护 B+ 树

每次看慢 SQL，先问自己三个问题：

1. `WHERE` 条件命中最左前缀了吗？
2. `SELECT` 字段能不能做成覆盖索引，减少回表？
3. SQL 里有没有函数、计算、类型转换导致索引失效？

**支付场景索引示例**

```sql
CREATE INDEX idx_mch_time_status
ON payment_order (merchant_id, created_at, status);

-- ✅ 命中前两列 + ICP 过滤 status
SELECT * FROM payment_order
WHERE merchant_id = ? AND created_at >= ? AND status = ?;

-- ❌ 跳过 merchant_id，索引失效
SELECT order_id, status FROM payment_order
WHERE created_at >= ? AND status = ?;

-- ✅ 覆盖索引，无需回表
SELECT order_id, status FROM payment_order
WHERE merchant_id = ?;
```

---

## 继续阅读

- [索引（上）：InnoDB 索引模型](./04-index-part1.md)
- [索引（下）：覆盖索引与索引下推](./05-index-part2.md)
- [优化器为什么选错索引](./10-wrong-index-selection.md)
- [ORDER BY 工作原理](./16-order-by.md)
- [JOIN 语句怎么用](./34-join-usage.md)
- [JOIN 语句怎么优化](./35-join-optimization.md)
- [大事务拆分](./transaction-and-optimization.md#大事务拆分)
- [死锁检测与回滚重试](./deadlock-and-retry.md)
- [返回 MySQL 专题总览](./index.md)
