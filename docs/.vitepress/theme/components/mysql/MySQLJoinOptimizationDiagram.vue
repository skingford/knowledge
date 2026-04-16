<script setup lang="ts">
type DiagramKind = 'basic-back-to-table-flow' | 'mrr-flow' | 'mrr-explain' | 'nlj-flow' | 'bka-flow'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'basic-back-to-table-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 220" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="b1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
      <marker id="b1o" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-orange)"/></marker>
    </defs>
    <!-- Index a -->
    <rect x="20" y="30" width="140" height="130" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="90" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">索引 a</text>
    <text x="90" y="50" text-anchor="middle" font-size="10" fill="var(--d-text)">a=1 → id=100</text>
    <text x="90" y="68" text-anchor="middle" font-size="10" fill="var(--d-text)">a=2 → id=30</text>
    <text x="90" y="86" text-anchor="middle" font-size="10" fill="var(--d-text)">a=3 → id=78</text>
    <text x="90" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">a=4 → id=12</text>
    <text x="90" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
    <text x="90" y="135" text-anchor="middle" font-size="10" fill="var(--d-text)">a=100 → id=55</text>
    <text x="90" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">顺序扫描</text>
    <!-- Arrows to primary key (random) -->
    <line x1="160" y1="45" x2="230" y2="120" stroke="var(--d-orange)" stroke-width="1" marker-end="url(#b1o)" stroke-dasharray="4"/>
    <line x1="160" y1="63" x2="230" y2="55" stroke="var(--d-orange)" stroke-width="1" marker-end="url(#b1o)" stroke-dasharray="4"/>
    <line x1="160" y1="81" x2="230" y2="95" stroke="var(--d-orange)" stroke-width="1" marker-end="url(#b1o)" stroke-dasharray="4"/>
    <line x1="160" y1="99" x2="230" y2="40" stroke="var(--d-orange)" stroke-width="1" marker-end="url(#b1o)" stroke-dasharray="4"/>
    <text x="200" y="165" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-orange)">随机 IO</text>
    <!-- Primary key index -->
    <rect x="235" y="30" width="140" height="130" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="305" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">主键索引</text>
    <text x="305" y="48" text-anchor="middle" font-size="10" fill="var(--d-text)">id=12 → row</text>
    <text x="305" y="65" text-anchor="middle" font-size="10" fill="var(--d-text)">id=30 → row</text>
    <text x="305" y="82" text-anchor="middle" font-size="10" fill="var(--d-text)">id=55 → row</text>
    <text x="305" y="99" text-anchor="middle" font-size="10" fill="var(--d-text)">id=78 → row</text>
    <text x="305" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">id=100 → row</text>
    <text x="305" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
    <line x1="375" y1="80" x2="410" y2="80" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#b1)"/>
    <rect x="415" y="50" width="90" height="60" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="460" y="75" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-green)">结果集</text>
    <text x="460" y="95" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">整行数据</text>
    <text x="260" y="210" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 1 基本回表流程 — id 值随机，磁盘随机读</text>
  </svg>
  </div>

  <div v-else-if="kind === 'mrr-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 230" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="b2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
      <marker id="b2g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-green)"/></marker>
    </defs>
    <!-- Step 1: Index a -->
    <rect x="10" y="30" width="110" height="80" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="65" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-blue)">1. 索引 a</text>
    <text x="65" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">范围扫描</text>
    <text x="65" y="68" text-anchor="middle" font-size="10" fill="var(--d-text)">a∈[1,100]</text>
    <text x="65" y="85" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">取出 id 值</text>
    <!-- Arrow -->
    <line x1="120" y1="70" x2="155" y2="70" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#b2)"/>
    <!-- Step 2: read_rnd_buffer -->
    <rect x="160" y="30" width="130" height="80" rx="6" fill="var(--d-orange)" fill-opacity="0.1" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="225" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">2. read_rnd_buffer</text>
    <text x="225" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">收集 id 值</text>
    <text x="225" y="70" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">排序 id ↑</text>
    <text x="225" y="88" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">12,30,55,78,100…</text>
    <!-- Arrow -->
    <line x1="290" y1="70" x2="325" y2="70" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#b2g)"/>
    <!-- Step 3: Primary key -->
    <rect x="330" y="30" width="110" height="80" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="385" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">3. 主键索引</text>
    <text x="385" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">按排序后 id</text>
    <text x="385" y="70" text-anchor="middle" font-size="10" fill="var(--d-green)">顺序访问</text>
    <text x="385" y="88" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">接近顺序读盘</text>
    <!-- Arrow -->
    <line x1="440" y1="70" x2="470" y2="70" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#b2g)"/>
    <rect x="475" y="45" width="55" height="50" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1"/>
    <text x="502" y="70" text-anchor="middle" font-size="10" fill="var(--d-green)">结果</text>
    <text x="502" y="85" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">按 id 序</text>
    <!-- Comparison -->
    <rect x="60" y="130" width="180" height="40" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4"/>
    <text x="150" y="148" text-anchor="middle" font-size="9" fill="var(--d-orange)">对比: 排序前 = 随机 IO</text>
    <text x="150" y="162" text-anchor="middle" font-size="9" fill="var(--d-orange)">排序后 = 顺序 IO (快)</text>
    <rect x="300" y="130" width="180" height="40" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1" stroke-dasharray="4"/>
    <text x="390" y="148" text-anchor="middle" font-size="9" fill="var(--d-green)">结果集按主键 id 递增</text>
    <text x="390" y="162" text-anchor="middle" font-size="9" fill="var(--d-green)">与基本回表顺序相反</text>
    <text x="270" y="215" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 2 MRR 执行流程 — 先排序 id，再顺序回表</text>
  </svg>
  </div>

  <div v-else-if="kind === 'mrr-explain'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 80" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="5" y="5" width="550" height="70" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="15" y="22" font-size="10" font-weight="bold" fill="var(--d-text)">explain select * from t1 where a>=1 and a<=100;</text>
    <text x="15" y="40" font-size="9" fill="var(--d-text-muted)">|id|table|type |key|rows|Extra                          |</text>
    <text x="15" y="55" font-size="9" fill="var(--d-green)">| 1|t1   |range|a  | 100|Using index condition; Using MRR|</text>
    <text x="15" y="68" font-size="9" fill="var(--d-text-muted)">                                        ↑ MRR 优化已启用</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 3 MRR 执行流程的 explain 结果 — Extra 显示 Using MRR</div>
  </div>

  <div v-else-if="kind === 'nlj-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" style="max-width:600px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="a4" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue-border)"/></marker>
      <marker id="a4o" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-orange)"/></marker>
    </defs>
    <!-- Driver table t1 -->
    <rect x="20" y="30" width="120" height="90" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="80" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-blue-border)">驱动表 t1</text>
    <text x="80" y="55" text-anchor="middle" font-size="10" fill="var(--d-text)">全表扫描</text>
    <text x="80" y="73" text-anchor="middle" font-size="10" fill="var(--d-text)">取出一行 R</text>
    <text x="80" y="91" text-anchor="middle" font-size="9" fill="var(--d-text)">取字段 a 的值</text>
    <!-- Arrow to driven table -->
    <line x1="140" y1="75" x2="220" y2="75" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#a4)"/>
    <text x="180" y="67" text-anchor="middle" font-size="9" fill="var(--d-blue-border)">a 的值</text>
    <!-- Driven table t2 -->
    <rect x="225" y="30" width="140" height="90" rx="6" fill="var(--d-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="295" y="22" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">被驱动表 t2</text>
    <text x="295" y="52" text-anchor="middle" font-size="10" fill="var(--d-text)">索引 a 上查找</text>
    <text x="295" y="70" text-anchor="middle" font-size="10" fill="var(--d-text)">匹配 t2.a = R.a</text>
    <text x="295" y="88" text-anchor="middle" font-size="10" fill="var(--d-text)">回表取整行</text>
    <text x="295" y="108" text-anchor="middle" font-size="9" fill="var(--d-green)">一行一行地查</text>
    <!-- Arrow to result -->
    <line x1="365" y1="75" x2="430" y2="75" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#a4)"/>
    <!-- Result -->
    <rect x="435" y="45" width="100" height="60" rx="6" fill="var(--d-bg)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="485" y="72" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-green)">结果集</text>
    <text x="485" y="90" text-anchor="middle" font-size="9" fill="var(--d-text)">合并返回</text>
    <!-- Loop arrow -->
    <path d="M80,120 L80,155 L295,155 L295,120" fill="none" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4" marker-end="url(#a4o)"/>
    <text x="187" y="150" text-anchor="middle" font-size="9" fill="var(--d-orange)">循环：t1 的每一行都去 t2 查一次</text>
    <!-- Note box -->
    <rect x="60" y="180" width="420" height="65" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4"/>
    <text x="270" y="200" text-anchor="middle" font-size="10" fill="var(--d-text)">NLJ 流程：逐行从 t1 取值，到 t2 索引查找</text>
    <text x="270" y="218" text-anchor="middle" font-size="10" fill="var(--d-text)">每次只传一个值给 t2，无法利用 MRR 顺序读优化</text>
    <text x="270" y="236" text-anchor="middle" font-size="9" fill="var(--d-orange)">优化方向 → 批量传值 → BKA 算法</text>
    <text x="280" y="280" text-anchor="middle" font-size="12" fill="var(--d-text)">图 4 Index Nested-Loop Join 流程图</text>
  </svg>
  </div>

  <div v-else-if="kind === 'bka-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 270" style="max-width:620px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="a5" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue-border)"/></marker>
      <marker id="a5g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-green)"/></marker>
      <marker id="a5o" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-orange)"/></marker>
    </defs>
    <!-- Step 1: Driver table t1 -->
    <rect x="10" y="40" width="110" height="80" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="65" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-blue-border)">1. 驱动表 t1</text>
    <text x="65" y="62" text-anchor="middle" font-size="10" fill="var(--d-text)">扫描多行</text>
    <text x="65" y="80" text-anchor="middle" font-size="10" fill="var(--d-text)">取 P1~P100</text>
    <text x="65" y="98" text-anchor="middle" font-size="9" fill="var(--d-text)">批量取出</text>
    <!-- Arrow 1->2 -->
    <line x1="120" y1="80" x2="155" y2="80" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#a5)"/>
    <!-- Step 2: join_buffer -->
    <rect x="160" y="40" width="120" height="80" rx="6" fill="var(--d-orange)" fill-opacity="0.1" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="220" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">2. join_buffer</text>
    <text x="220" y="62" text-anchor="middle" font-size="10" fill="var(--d-text)">暂存批量数据</text>
    <text x="220" y="80" text-anchor="middle" font-size="10" fill="var(--d-text)">P1, P2 … P100</text>
    <text x="220" y="98" text-anchor="middle" font-size="9" fill="var(--d-orange)">批量 key</text>
    <!-- Arrow 2->3 -->
    <line x1="280" y1="80" x2="315" y2="80" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#a5o)"/>
    <!-- Step 3: MRR sort -->
    <rect x="320" y="40" width="100" height="80" rx="6" fill="var(--d-green)" fill-opacity="0.1" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="370" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">3. MRR 排序</text>
    <text x="370" y="62" text-anchor="middle" font-size="10" fill="var(--d-text)">对 key 排序</text>
    <text x="370" y="80" text-anchor="middle" font-size="10" fill="var(--d-green)">顺序化</text>
    <text x="370" y="98" text-anchor="middle" font-size="9" fill="var(--d-text)">减少随机 IO</text>
    <!-- Arrow 3->4 -->
    <line x1="420" y1="80" x2="450" y2="80" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#a5g)"/>
    <!-- Step 4: Driven table t2 -->
    <rect x="455" y="40" width="110" height="80" rx="6" fill="var(--d-bg)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="510" y="32" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">4. 被驱动表 t2</text>
    <text x="510" y="62" text-anchor="middle" font-size="10" fill="var(--d-text)">索引查找</text>
    <text x="510" y="80" text-anchor="middle" font-size="10" fill="var(--d-green)">顺序回表</text>
    <text x="510" y="98" text-anchor="middle" font-size="9" fill="var(--d-text)">返回匹配行</text>
    <!-- Arrow to result -->
    <path d="M510,120 L510,150 L300,150" fill="none" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#a5g)"/>
    <rect x="210" y="140" width="85" height="30" rx="5" fill="var(--d-bg)" stroke="var(--d-green)" stroke-width="1"/>
    <text x="252" y="160" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-green)">结果集</text>
    <!-- Comparison note -->
    <rect x="50" y="190" width="480" height="40" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4"/>
    <text x="290" y="207" text-anchor="middle" font-size="10" fill="var(--d-text)">BKA = NLJ + join_buffer(批量) + MRR(排序)</text>
    <text x="290" y="223" text-anchor="middle" font-size="9" fill="var(--d-orange)">对比 NLJ：一次传多个值给被驱动表，利用 MRR 顺序读优化</text>
    <text x="290" y="256" text-anchor="middle" font-size="12" fill="var(--d-text)">图 5 Batched Key Access 流程</text>
  </svg>
  </div>

</template>
