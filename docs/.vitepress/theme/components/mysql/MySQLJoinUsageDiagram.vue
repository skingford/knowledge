<script setup lang="ts">
type DiagramKind = 'indexed-join-explain' | 'index-nested-loop-join-flow' | 'block-nested-loop-join-flow' | 'non-indexed-join-explain' | 'segmented-bnl-flow'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'indexed-join-explain'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 100" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="5" y="5" width="550" height="88" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="15" y="22" font-size="10" font-weight="bold" fill="var(--d-text)">mysql> explain select * from t1 straight_join t2 on (t1.a=t2.a);</text>
    <text x="15" y="40" font-size="9" fill="var(--d-text-muted)">+--+-----------+-----+------+-------------+-----+-------+--------+----+--------+-------+</text>
    <text x="15" y="52" font-size="9" fill="var(--d-text-muted)">|id|select_type|table|type  |possible_keys|key  |key_len|ref     |rows|filtered|Extra  |</text>
    <text x="15" y="64" font-size="9" fill="var(--d-text-muted)">+--+-----------+-----+------+-------------+-----+-------+--------+----+--------+-------+</text>
    <text x="15" y="76" font-size="9" fill="var(--d-blue)">| 1|SIMPLE     |t1   |ALL   |a            |NULL |NULL   |NULL    | 100|  100.00|NULL   |</text>
    <text x="15" y="88" font-size="9" fill="var(--d-green)">| 1|SIMPLE     |t2   |ref   |a            |a    |5      |db1.t1.a|   1|  100.00|NULL   |</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 1 使用索引字段 join 的 explain 结果 — t2 走索引 a</div>
  </div>

  <div v-else-if="kind === 'index-nested-loop-join-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 260" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="a2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
      <marker id="a2g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-green)"/></marker>
    </defs>
    <!-- t1 driving table -->
    <rect x="20" y="30" width="140" height="170" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="90" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">t1 (驱动表)</text>
    <text x="90" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">全表扫描</text>
    <text x="90" y="68" text-anchor="middle" font-size="10" fill="var(--d-text)">100 行</text>
    <!-- Rows in t1 -->
    <rect x="40" y="80" width="100" height="18" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
    <text x="90" y="93" text-anchor="middle" font-size="9" fill="var(--d-text)">R1: a=1</text>
    <rect x="40" y="102" width="100" height="18" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
    <text x="90" y="115" text-anchor="middle" font-size="9" fill="var(--d-text)">R2: a=2</text>
    <rect x="40" y="124" width="100" height="18" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
    <text x="90" y="137" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
    <rect x="40" y="146" width="100" height="18" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
    <text x="90" y="159" text-anchor="middle" font-size="9" fill="var(--d-text)">R100: a=100</text>
    <!-- Arrow: t1 → index lookup -->
    <line x1="160" y1="90" x2="230" y2="90" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#a2)"/>
    <text x="195" y="84" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">取出 a 值</text>
    <!-- t2 index -->
    <rect x="235" y="30" width="120" height="80" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="295" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">t2 索引 a</text>
    <text x="295" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">B+ 树搜索</text>
    <text x="295" y="68" text-anchor="middle" font-size="10" fill="var(--d-text)">O(log2M)</text>
    <text x="295" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">找到主键 id</text>
    <!-- Arrow: index → primary key -->
    <line x1="295" y1="110" x2="295" y2="140" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#a2)"/>
    <!-- t2 primary index -->
    <rect x="235" y="142" width="120" height="50" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="295" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">t2 主键索引</text>
    <text x="295" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">取整行数据</text>
    <!-- Arrow: primary → result -->
    <line x1="355" y1="167" x2="400" y2="167" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#a2g)"/>
    <!-- Result -->
    <rect x="405" y="30" width="100" height="170" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="455" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">结果集</text>
    <text x="455" y="52" text-anchor="middle" font-size="9" fill="var(--d-text)">(R, t2_row)</text>
    <text x="455" y="70" text-anchor="middle" font-size="9" fill="var(--d-text)">组成一行</text>
    <text x="455" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">总扫描行数</text>
    <text x="455" y="138" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-green)">200</text>
    <text x="455" y="155" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">(100+100)</text>
    <!-- Caption -->
    <text x="260" y="245" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 2 Index Nested-Loop Join 流程</text>
  </svg>
  </div>

  <div v-else-if="kind === 'block-nested-loop-join-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 230" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="a3" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
      <marker id="a3g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-green)"/></marker>
    </defs>
    <!-- t1 -->
    <rect x="20" y="30" width="120" height="100" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="80" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">t1 (驱动表)</text>
    <text x="80" y="55" text-anchor="middle" font-size="10" fill="var(--d-text)">全表扫描</text>
    <text x="80" y="75" text-anchor="middle" font-size="10" fill="var(--d-text)">100 行</text>
    <text x="80" y="95" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">select *</text>
    <text x="80" y="115" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">全部字段</text>
    <!-- Arrow to join_buffer -->
    <line x1="140" y1="75" x2="180" y2="75" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#a3)"/>
    <text x="160" y="68" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">读入</text>
    <!-- join_buffer -->
    <rect x="185" y="30" width="130" height="100" rx="6" fill="var(--d-orange)" fill-opacity="0.1" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="250" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-orange)">join_buffer</text>
    <text x="250" y="55" text-anchor="middle" font-size="10" fill="var(--d-text)">存放 t1 全部</text>
    <text x="250" y="75" text-anchor="middle" font-size="10" fill="var(--d-text)">100 行数据</text>
    <text x="250" y="95" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">无序数组</text>
    <!-- t2 -->
    <rect x="20" y="155" width="120" height="55" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="80" y="175" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">t2 (被驱动表)</text>
    <text x="80" y="195" text-anchor="middle" font-size="10" fill="var(--d-text)">全表扫描 1000 行</text>
    <!-- Arrow: t2 → compare -->
    <line x1="140" y1="182" x2="230" y2="145" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#a3)"/>
    <text x="170" y="155" font-size="8" fill="var(--d-text-sub)">逐行对比</text>
    <!-- Compare -->
    <rect x="335" y="60" width="80" height="40" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="375" y="85" text-anchor="middle" font-size="9" fill="var(--d-text)">匹配?</text>
    <line x1="315" y1="80" x2="333" y2="80" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#a3)"/>
    <!-- Result -->
    <rect x="435" y="50" width="70" height="60" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="470" y="75" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-green)">结果集</text>
    <text x="470" y="95" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">返回</text>
    <line x1="415" y1="80" x2="433" y2="80" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#a3g)"/>
    <!-- Stats -->
    <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">扫描行数: 1100</text>
    <text x="380" y="155" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">内存判断: 10 万次</text>
    <!-- Caption -->
    <text x="260" y="225" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 3 Block Nested-Loop Join 流程</text>
  </svg>
  </div>

  <div v-else-if="kind === 'non-indexed-join-explain'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 100" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="5" y="5" width="550" height="90" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="15" y="22" font-size="10" font-weight="bold" fill="var(--d-text)">mysql> explain select * from t1 straight_join t2 on (t1.a=t2.b);</text>
    <text x="15" y="40" font-size="9" fill="var(--d-text-muted)">+--+-----------+-----+------+-------------+----+-------+----+----+--------+----------------------------+</text>
    <text x="15" y="52" font-size="9" fill="var(--d-text-muted)">|id|select_type|table|type  |possible_keys|key |key_len|ref |rows|filtered|Extra                       |</text>
    <text x="15" y="64" font-size="9" fill="var(--d-text-muted)">+--+-----------+-----+------+-------------+----+-------+----+----+--------+----------------------------+</text>
    <text x="15" y="76" font-size="9" fill="var(--d-blue)">| 1|SIMPLE     |t1   |ALL   |a            |NULL|NULL   |NULL| 100|  100.00|NULL                        |</text>
    <text x="15" y="88" font-size="9" fill="var(--d-orange)">| 1|SIMPLE     |t2   |ALL   |NULL         |NULL|NULL   |NULL|1000|  100.00|Using where; Using join buffer (BNL)|</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 4 不使用索引字段 join 的 explain 结果 — Extra 显示 Block Nested Loop</div>
  </div>

  <div v-else-if="kind === 'segmented-bnl-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="a5" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
      <marker id="a5o" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-orange)"/></marker>
    </defs>
    <!-- Phase 1 label -->
    <text x="20" y="18" font-size="11" font-weight="bold" fill="var(--d-text)">第 1 段 (88行)</text>
    <!-- t1 phase 1 -->
    <rect x="20" y="25" width="110" height="50" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="75" y="45" text-anchor="middle" font-size="10" fill="var(--d-blue)">t1: 行 1~88</text>
    <text x="75" y="60" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">扫描读入</text>
    <!-- Arrow -->
    <line x1="130" y1="50" x2="165" y2="50" stroke="var(--d-blue)" stroke-width="1.3" marker-end="url(#a5)"/>
    <!-- join_buffer phase 1 -->
    <rect x="170" y="25" width="120" height="50" rx="5" fill="var(--d-orange)" fill-opacity="0.1" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="230" y="45" text-anchor="middle" font-size="10" fill="var(--d-orange)">join_buffer</text>
    <text x="230" y="60" text-anchor="middle" font-size="9" fill="var(--d-text)">88 行 (满)</text>
    <!-- Arrow to t2 scan 1 -->
    <line x1="290" y1="50" x2="325" y2="50" stroke="var(--d-orange)" stroke-width="1.3" marker-end="url(#a5o)"/>
    <!-- t2 scan 1 -->
    <rect x="330" y="25" width="160" height="50" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="410" y="45" text-anchor="middle" font-size="10" fill="var(--d-text)">扫描 t2 全表 (第1次)</text>
    <text x="410" y="60" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">逐行对比 → 结果集</text>
    <!-- Step 3: clear -->
    <line x1="230" y1="75" x2="230" y2="98" stroke="var(--d-orange)" stroke-width="1.3" marker-end="url(#a5o)"/>
    <text x="270" y="92" font-size="9" fill="var(--d-orange)">清空</text>
    <!-- Phase 2 label -->
    <text x="20" y="118" font-size="11" font-weight="bold" fill="var(--d-text)">第 2 段 (12行)</text>
    <!-- t1 phase 2 -->
    <rect x="20" y="125" width="110" height="50" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="75" y="145" text-anchor="middle" font-size="10" fill="var(--d-blue)">t1: 行 89~100</text>
    <text x="75" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">继续读入</text>
    <!-- Arrow -->
    <line x1="130" y1="150" x2="165" y2="150" stroke="var(--d-blue)" stroke-width="1.3" marker-end="url(#a5)"/>
    <!-- join_buffer phase 2 -->
    <rect x="170" y="125" width="120" height="50" rx="5" fill="var(--d-orange)" fill-opacity="0.1" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="230" y="145" text-anchor="middle" font-size="10" fill="var(--d-orange)">join_buffer</text>
    <text x="230" y="160" text-anchor="middle" font-size="9" fill="var(--d-text)">12 行</text>
    <!-- Arrow to t2 scan 2 -->
    <line x1="290" y1="150" x2="325" y2="150" stroke="var(--d-orange)" stroke-width="1.3" marker-end="url(#a5o)"/>
    <!-- t2 scan 2 -->
    <rect x="330" y="125" width="160" height="50" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="410" y="145" text-anchor="middle" font-size="10" fill="var(--d-text)">扫描 t2 全表 (第2次)</text>
    <text x="410" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">逐行对比 → 结果集</text>
    <!-- Summary box -->
    <rect x="100" y="200" width="320" height="75" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4"/>
    <text x="260" y="222" text-anchor="middle" font-size="10" fill="var(--d-text)">t2 被扫描 2 次 (因 join_buffer 不够大)</text>
    <text x="260" y="240" text-anchor="middle" font-size="10" fill="var(--d-text)">判断次数: (88+12) x 1000 = 10 万次</text>
    <text x="260" y="258" text-anchor="middle" font-size="10" fill="var(--d-text)">扫描行数: N + λ*N*M</text>
    <!-- Caption -->
    <text x="260" y="305" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 5 Block Nested-Loop Join 分段执行流程</text>
  </svg>
  </div>

</template>
