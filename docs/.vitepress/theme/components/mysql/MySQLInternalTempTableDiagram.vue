<script setup lang="ts">
type DiagramKind = 'union-flow' | 'group-by-flow' | 'memory-temp-sort-flow' | 'ordered-input-group-by' | 'sql-big-result-flow'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'union-flow'" style="display:flex;justify-content:center;padding:20px 0;">
  <svg viewBox="0 0 600 420" style="max-width:600px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah2" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--d-text)"/></marker></defs>
  <text x="300" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图2 union 执行流程</text>
  <!-- Step 1: select 1000 -->
  <rect x="180" y="40" width="240" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="65" text-anchor="middle" font-size="13" fill="var(--d-text)">执行子查询1: select 1000</text>
  <line x1="300" y1="80" x2="300" y2="110" stroke="var(--d-text)" marker-end="url(#ah2)"/>
  <!-- Step 2: insert into temp table -->
  <rect x="150" y="110" width="300" height="40" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="300" y="135" text-anchor="middle" font-size="13" fill="var(--d-text)">插入临时表 (f=1000)，主键唯一约束</text>
  <line x1="300" y1="150" x2="300" y2="180" stroke="var(--d-text)" marker-end="url(#ah2)"/>
  <!-- Step 3: scan t1 -->
  <rect x="150" y="180" width="300" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="205" text-anchor="middle" font-size="13" fill="var(--d-text)">执行子查询2: 扫描t1 (id desc limit 2)</text>
  <line x1="300" y1="220" x2="300" y2="250" stroke="var(--d-text)" marker-end="url(#ah2)"/>
  <!-- Step 4: insert id=1000 fail -->
  <rect x="120" y="250" width="360" height="40" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="300" y="275" text-anchor="middle" font-size="13" fill="var(--d-text)">id=1000 → 插入失败(主键冲突); id=999 → 插入成功</text>
  <line x1="300" y1="290" x2="300" y2="320" stroke="var(--d-text)" marker-end="url(#ah2)"/>
  <!-- Step 5: temp table dedup -->
  <rect x="150" y="320" width="300" height="40" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="300" y="345" text-anchor="middle" font-size="13" fill="var(--d-text)">临时表内容: {1000, 999} (已去重)</text>
  <line x1="300" y1="360" x2="300" y2="390" stroke="var(--d-text)" marker-end="url(#ah2)"/>
  <!-- Step 6: return -->
  <rect x="180" y="390" width="240" height="36" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="300" y="413" text-anchor="middle" font-size="13" fill="var(--d-text)">返回结果集并删除临时表</text>
  </svg>
  </div>

  <div v-else-if="kind === 'group-by-flow'" style="display:flex;justify-content:center;padding:20px 0;">
  <svg viewBox="0 0 620 460" style="max-width:620px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah5" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--d-text)"/></marker></defs>
  <text x="310" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图5 group by 执行流程</text>
  <!-- Step 1 -->
  <rect x="160" y="40" width="300" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="310" y="65" text-anchor="middle" font-size="13" fill="var(--d-text)">创建内存临时表 (字段m, c; 主键m)</text>
  <line x1="310" y1="80" x2="310" y2="110" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <!-- Step 2 -->
  <rect x="140" y="110" width="340" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="310" y="135" text-anchor="middle" font-size="13" fill="var(--d-text)">扫描索引a，依次取出id值</text>
  <line x1="310" y1="150" x2="310" y2="180" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <!-- Step 3 -->
  <rect x="130" y="180" width="360" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="310" y="205" text-anchor="middle" font-size="13" fill="var(--d-text)">计算 x = id % 10</text>
  <line x1="310" y1="220" x2="310" y2="250" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <!-- Step 4: branch -->
  <polygon points="310,250 420,290 310,330 200,290" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="310" y="295" text-anchor="middle" font-size="12" fill="var(--d-text)">临时表有主键=x?</text>
  <!-- No branch -->
  <line x1="200" y1="290" x2="60" y2="290" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <text x="170" y="283" font-size="11" fill="var(--d-text)">否</text>
  <rect x="10" y="310" width="180" height="36" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="100" y="333" text-anchor="middle" font-size="12" fill="var(--d-text)">插入 (x, 1)</text>
  <!-- Yes branch -->
  <line x1="420" y1="290" x2="520" y2="290" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <text x="440" y="283" font-size="11" fill="var(--d-text)">是</text>
  <rect x="430" y="310" width="180" height="36" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="520" y="333" text-anchor="middle" font-size="12" fill="var(--d-text)">将该行 c 值 +1</text>
  <!-- Merge -->
  <line x1="100" y1="346" x2="100" y2="370" stroke="var(--d-text)"/>
  <line x1="520" y1="346" x2="520" y2="370" stroke="var(--d-text)"/>
  <line x1="100" y1="370" x2="520" y2="370" stroke="var(--d-text)"/>
  <line x1="310" y1="370" x2="310" y2="395" stroke="var(--d-text)" marker-end="url(#ah5)"/>
  <!-- Step 5 -->
  <rect x="160" y="395" width="300" height="40" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="310" y="420" text-anchor="middle" font-size="13" fill="var(--d-text)">按字段m排序，返回结果集</text>
  </svg>
  </div>

  <div v-else-if="kind === 'memory-temp-sort-flow'" style="display:flex;justify-content:center;padding:20px 0;">
  <svg viewBox="0 0 600 380" style="max-width:600px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah6" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--d-text)"/></marker></defs>
  <text x="300" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图6 内存临时表排序流程</text>
  <!-- Step 1 -->
  <rect x="160" y="40" width="280" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="65" text-anchor="middle" font-size="13" fill="var(--d-text)">扫描索引a，计算id%10填入临时表</text>
  <line x1="300" y1="80" x2="300" y2="110" stroke="var(--d-text)" marker-end="url(#ah6)"/>
  <!-- Step 2: temp table -->
  <rect x="160" y="110" width="280" height="40" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="300" y="135" text-anchor="middle" font-size="13" fill="var(--d-text)">内存临时表 (m, c)</text>
  <!-- Dashed box start -->
  <rect x="100" y="160" width="400" height="180" rx="8" fill="none" stroke="var(--d-text)" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="120" y="178" font-size="11" fill="var(--d-text)" font-style="italic">排序过程</text>
  <line x1="300" y1="150" x2="300" y2="200" stroke="var(--d-text)" marker-end="url(#ah6)"/>
  <!-- sort_buffer -->
  <rect x="170" y="200" width="260" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="223" text-anchor="middle" font-size="13" fill="var(--d-text)">取出数据放入 sort_buffer</text>
  <line x1="300" y1="236" x2="300" y2="266" stroke="var(--d-text)" marker-end="url(#ah6)"/>
  <!-- sort -->
  <rect x="170" y="266" width="260" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="289" text-anchor="middle" font-size="13" fill="var(--d-text)">对 sort_buffer 中的m字段排序</text>
  <line x1="300" y1="302" x2="300" y2="330" stroke="var(--d-text)"/>
  <!-- Dashed box end -->
  <line x1="300" y1="340" x2="300" y2="365" stroke="var(--d-text)" marker-end="url(#ah6)"/>
  <!-- Return -->
  <rect x="180" y="350" width="240" height="36" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="300" y="373" text-anchor="middle" font-size="13" fill="var(--d-text)">返回有序结果集</text>
  </svg>
  </div>

  <div v-else-if="kind === 'ordered-input-group-by'" style="display:flex;justify-content:center;padding:20px 0;">
  <svg viewBox="0 0 620 300" style="max-width:620px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah10" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--d-text)"/></marker></defs>
  <text x="310" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图10 group by 算法优化 -- 有序输入</text>
  <!-- Ordered data row -->
  <rect x="30" y="50" width="560" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="310" y="67" text-anchor="middle" font-size="12" fill="var(--d-text)">有序输入数据</text>
  <g font-size="12" fill="var(--d-text)">
  <text x="55" y="83">0</text><text x="80" y="83">0</text><text x="105" y="83">0</text><text x="130" y="83">...</text>
  <text x="165" y="83">1</text><text x="190" y="83">1</text><text x="215" y="83">1</text><text x="240" y="83">...</text>
  <text x="275" y="83">2</text><text x="300" y="83">2</text><text x="325" y="83">2</text><text x="350" y="83">...</text>
  <text x="395" y="83">...</text>
  <text x="440" y="83">9</text><text x="465" y="83">9</text><text x="490" y="83">9</text><text x="515" y="83">...</text>
  </g>
  <!-- Arrow down -->
  <line x1="310" y1="90" x2="310" y2="120" stroke="var(--d-text)" marker-end="url(#ah10)"/>
  <!-- Scan process -->
  <rect x="100" y="120" width="420" height="50" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="310" y="142" text-anchor="middle" font-size="12" fill="var(--d-text)">顺序扫描，碰到不同值时输出前一组计数</text>
  <text x="310" y="160" text-anchor="middle" font-size="11" fill="var(--d-text)">碰到第一个1 → 输出(0, X); 碰到第一个2 → 输出(1, Y); ...</text>
  <line x1="310" y1="170" x2="310" y2="200" stroke="var(--d-text)" marker-end="url(#ah10)"/>
  <!-- Result -->
  <rect x="130" y="200" width="360" height="40" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="310" y="225" text-anchor="middle" font-size="13" fill="var(--d-text)">直接输出结果，无需临时表和排序</text>
  <!-- Note -->
  <text x="310" y="270" text-anchor="middle" font-size="12" fill="var(--d-text)" font-style="italic">InnoDB 索引天然满足有序输入条件</text>
  </svg>
  </div>

  <div v-else-if="kind === 'sql-big-result-flow'" style="display:flex;justify-content:center;padding:20px 0;">
  <svg viewBox="0 0 600 420" style="max-width:600px;width:100%;font-family:system-ui,sans-serif;">
  <defs><marker id="ah12" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="var(--d-text)"/></marker></defs>
  <text x="300" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图12 使用 SQL_BIG_RESULT 的执行流程</text>
  <!-- Step 1 -->
  <rect x="140" y="45" width="320" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="70" text-anchor="middle" font-size="13" fill="var(--d-text)">初始化 sort_buffer (整型字段m)</text>
  <line x1="300" y1="85" x2="300" y2="115" stroke="var(--d-text)" marker-end="url(#ah12)"/>
  <!-- Step 2 -->
  <rect x="120" y="115" width="360" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="140" text-anchor="middle" font-size="13" fill="var(--d-text)">扫描索引a，取出id，计算 id%100 存入 sort_buffer</text>
  <line x1="300" y1="155" x2="300" y2="185" stroke="var(--d-text)" marker-end="url(#ah12)"/>
  <!-- Step 3 -->
  <rect x="140" y="185" width="320" height="40" rx="6" fill="var(--d-orange)" fill-opacity="0.15" stroke="var(--d-orange)" stroke-width="1.5"/>
  <text x="300" y="210" text-anchor="middle" font-size="13" fill="var(--d-text)">对 sort_buffer 的字段m做排序</text>
  <line x1="300" y1="225" x2="300" y2="255" stroke="var(--d-text)" marker-end="url(#ah12)"/>
  <!-- Step 4 -->
  <rect x="140" y="255" width="320" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="280" text-anchor="middle" font-size="13" fill="var(--d-text)">得到有序数组</text>
  <line x1="300" y1="295" x2="300" y2="325" stroke="var(--d-text)" marker-end="url(#ah12)"/>
  <!-- Step 5 -->
  <rect x="110" y="325" width="380" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
  <text x="300" y="350" text-anchor="middle" font-size="13" fill="var(--d-text)">顺序遍历有序数组，统计不同值的出现次数</text>
  <line x1="300" y1="365" x2="300" y2="395" stroke="var(--d-text)" marker-end="url(#ah12)"/>
  <!-- Return -->
  <rect x="180" y="390" width="240" height="36" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)" stroke-width="1.5"/>
  <text x="300" y="413" text-anchor="middle" font-size="13" fill="var(--d-text)">返回结果集</text>
  </svg>
  </div>

</template>
