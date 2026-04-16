<script setup lang="ts">
type DiagramKind = 'query-result-compare' | 'innodb-btree-layout' | 'memory-hash-layout' | 'memory-with-btree-layout' | 'btree-vs-hash-query-compare' | 'memory-table-lock-steps' | 'processlist-table-lock' | 'master-slave-architecture' | 'dual-master-architecture' | 'memory-temp-table-benefit'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'query-result-compare'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 200" style="max-width:520px;width:100%;font-family:monospace">
    <rect width="520" height="200" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <!-- t1 Memory -->
    <text x="130" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">select * from t1</text>
    <rect x="30" y="38" width="200" height="26" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="80" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">id</text>
    <text x="180" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">c</text>
    <g font-size="11" fill="var(--d-text)">
      <text x="80" y="78" text-anchor="middle">1</text><text x="180" y="78" text-anchor="middle">1</text>
      <text x="80" y="93" text-anchor="middle">2</text><text x="180" y="93" text-anchor="middle">2</text>
      <text x="80" y="108" text-anchor="middle">...</text><text x="180" y="108" text-anchor="middle">...</text>
      <text x="80" y="123" text-anchor="middle">9</text><text x="180" y="123" text-anchor="middle">9</text>
      <rect x="30" y="128" width="200" height="18" rx="2" fill="var(--d-orange)" opacity="0.15"/>
      <text x="80" y="141" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text>
      <text x="180" y="141" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text>
    </g>
    <text x="130" y="165" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">0 在最后一行</text>
    <!-- t2 InnoDB -->
    <text x="390" y="28" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">select * from t2</text>
    <rect x="290" y="38" width="200" height="26" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="340" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">id</text>
    <text x="440" y="55" text-anchor="middle" font-size="12" fill="var(--d-th-text)">c</text>
    <g font-size="11" fill="var(--d-text)">
      <rect x="290" y="62" width="200" height="18" rx="2" fill="var(--d-green)" opacity="0.15"/>
      <text x="340" y="76" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text>
      <text x="440" y="76" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text>
      <text x="340" y="93" text-anchor="middle">1</text><text x="440" y="93" text-anchor="middle">1</text>
      <text x="340" y="108" text-anchor="middle">2</text><text x="440" y="108" text-anchor="middle">2</text>
      <text x="340" y="123" text-anchor="middle">...</text><text x="440" y="123" text-anchor="middle">...</text>
      <text x="340" y="141" text-anchor="middle">9</text><text x="440" y="141" text-anchor="middle">9</text>
    </g>
    <text x="390" y="165" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">0 在第一行</text>
    <text x="260" y="188" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 1  两个查询结果 — 0 的位置不同</text>
  </svg>
  </div>

  <div v-else-if="kind === 'innodb-btree-layout'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 260" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="260" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">InnoDB — B+ 树主键索引（表 t2）</text>
    <!-- Root node -->
    <rect x="240" y="40" width="100" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="290" y="60" text-anchor="middle" font-size="12" fill="var(--d-blue)">5</text>
    <!-- Left child -->
    <rect x="100" y="100" width="160" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="180" y="120" text-anchor="middle" font-size="12" fill="var(--d-blue)">1 | 3</text>
    <!-- Right child -->
    <rect x="320" y="100" width="160" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="400" y="120" text-anchor="middle" font-size="12" fill="var(--d-blue)">5 | 7</text>
    <!-- Lines root to children -->
    <line x1="265" y1="70" x2="180" y2="100" stroke="var(--d-blue-border)" stroke-width="1.2"/>
    <line x1="315" y1="70" x2="400" y2="100" stroke="var(--d-blue-border)" stroke-width="1.2"/>
    <!-- Leaf nodes -->
    <g font-size="10" fill="var(--d-text)">
      <rect x="20" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="60" y="176" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text><text x="60" y="196" text-anchor="middle">(0,0)</text>
      <rect x="110" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="150" y="176" text-anchor="middle" font-weight="bold">1</text><text x="150" y="196" text-anchor="middle">(1,1)</text>
      <rect x="200" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="240" y="176" text-anchor="middle" font-weight="bold">2</text><text x="240" y="196" text-anchor="middle">(2,2)</text>
      <text x="290" y="186" text-anchor="middle" fill="var(--d-text-muted)">…</text>
      <rect x="310" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="350" y="176" text-anchor="middle" font-weight="bold">8</text><text x="350" y="196" text-anchor="middle">(8,8)</text>
      <rect x="400" y="160" width="80" height="44" rx="4" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="440" y="176" text-anchor="middle" font-weight="bold">9</text><text x="440" y="196" text-anchor="middle">(9,9)</text>
    </g>
    <!-- Leaf links -->
    <line x1="100" y1="182" x2="110" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="190" y1="182" x2="200" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="390" y1="182" x2="400" y2="182" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,2"/>
    <!-- Lines to leaves -->
    <line x1="140" y1="130" x2="60" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
    <line x1="165" y1="130" x2="150" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
    <line x1="195" y1="130" x2="240" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
    <line x1="365" y1="130" x2="350" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
    <line x1="435" y1="130" x2="440" y2="160" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="290" y="230" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">叶子节点按主键有序存储，数据就在主键索引上</text>
    <text x="290" y="250" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 2  InnoDB B+ 树数据组织</text>
  </svg>
  </div>

  <div v-else-if="kind === 'memory-hash-layout'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 280" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="280" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Memory — 数据数组 + Hash 索引（表 t1）</text>
    <!-- Data array -->
    <text x="60" y="55" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">数据数组</text>
    <g font-size="11">
      <rect x="20" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="45" y="80" text-anchor="middle" fill="var(--d-engine-text)">1,1</text>
      <rect x="75" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="100" y="80" text-anchor="middle" fill="var(--d-engine-text)">2,2</text>
      <rect x="130" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="155" y="80" text-anchor="middle" fill="var(--d-engine-text)">3,3</text>
      <rect x="185" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="210" y="80" text-anchor="middle" fill="var(--d-engine-text)">4,4</text>
      <rect x="240" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="265" y="80" text-anchor="middle" fill="var(--d-engine-text)">5,5</text>
      <rect x="295" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="320" y="80" text-anchor="middle" fill="var(--d-engine-text)">6,6</text>
      <rect x="350" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="375" y="80" text-anchor="middle" fill="var(--d-engine-text)">7,7</text>
      <rect x="405" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="430" y="80" text-anchor="middle" fill="var(--d-engine-text)">8,8</text>
      <rect x="460" y="64" width="50" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="485" y="80" text-anchor="middle" fill="var(--d-engine-text)">9,9</text>
      <rect x="515" y="64" width="50" height="24" rx="3" fill="var(--d-orange)" opacity="0.2" stroke="var(--d-orange)" stroke-width="1.5"/>
      <text x="540" y="80" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">0,0</text>
    </g>
    <g font-size="9" fill="var(--d-text-muted)">
      <text x="45" y="102" text-anchor="middle">pos0</text>
      <text x="100" y="102" text-anchor="middle">pos1</text>
      <text x="155" y="102" text-anchor="middle">pos2</text>
      <text x="540" y="102" text-anchor="middle">pos9</text>
    </g>
    <!-- Hash Index -->
    <text x="290" y="130" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">主键 Hash 索引</text>
    <g font-size="10">
      <rect x="60" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="105" y="156" text-anchor="middle" fill="var(--d-blue)">hash(1)→pos0</text>
      <rect x="160" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="205" y="156" text-anchor="middle" fill="var(--d-blue)">hash(3)→pos2</text>
      <rect x="260" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="305" y="156" text-anchor="middle" fill="var(--d-blue)">hash(5)→pos4</text>
      <rect x="360" y="140" width="90" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="405" y="156" text-anchor="middle" fill="var(--d-blue)">hash(0)→pos9</text>
    </g>
    <text x="290" y="185" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">… hash 桶无序 — key 不按大小排列 …</text>
    <!-- Arrows -->
    <line x1="105" y1="164" x2="45" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
    <line x1="205" y1="164" x2="155" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
    <line x1="305" y1="164" x2="265" y2="88" stroke="var(--d-blue-border)" stroke-width="1" marker-end="url(#ah3)"/>
    <line x1="405" y1="164" x2="540" y2="88" stroke="var(--d-orange)" stroke-width="1.2" marker-end="url(#ah3o)"/>
    <defs>
      <marker id="ah3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
      <marker id="ah3o" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-orange)" stroke-width="1"/></marker>
    </defs>
    <!-- Note -->
    <rect x="80" y="200" width="420" height="44" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
    <text x="290" y="218" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">数据按写入顺序存放 → select * 顺序扫描数组</text>
    <text x="290" y="234" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">id=0 最后写入 → 在数组末尾(pos9) → 结果集最后一行</text>
    <text x="290" y="268" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 3  Memory 引擎数据组织（hash 索引 + 数据数组）</text>
  </svg>
  </div>

  <div v-else-if="kind === 'memory-with-btree-layout'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 300" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="300" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Memory 引擎 — 增加 B-Tree 索引后</text>
    <!-- Data array at top -->
    <text x="290" y="46" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">数据数组（按写入顺序）</text>
    <g font-size="10">
      <rect x="30" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="52" y="69" text-anchor="middle" fill="var(--d-engine-text)">1,1</text>
      <rect x="78" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="100" y="69" text-anchor="middle" fill="var(--d-engine-text)">2,2</text>
      <rect x="126" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="148" y="69" text-anchor="middle" fill="var(--d-engine-text)">3,3</text>
      <rect x="174" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="196" y="69" text-anchor="middle" fill="var(--d-engine-text)">4,4</text>
      <text x="232" y="69" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
      <rect x="248" y="54" width="44" height="22" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
      <text x="270" y="69" text-anchor="middle" fill="var(--d-engine-text)">9,9</text>
      <rect x="296" y="54" width="44" height="22" rx="3" fill="var(--d-orange)" opacity="0.2" stroke="var(--d-orange)" stroke-width="1.2"/>
      <text x="318" y="69" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">0,0</text>
    </g>
    <!-- Hash index (left) -->
    <text x="150" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">Hash 索引（主键 id）</text>
    <g font-size="9">
      <rect x="40" y="113" width="80" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="80" y="127" text-anchor="middle" fill="var(--d-blue)">hash(0)→pos9</text>
      <rect x="130" y="113" width="80" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="170" y="127" text-anchor="middle" fill="var(--d-blue)">hash(1)→pos0</text>
      <text x="230" y="127" text-anchor="middle" fill="var(--d-text-muted)">…</text>
    </g>
    <!-- B-Tree index (right) -->
    <text x="430" y="105" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">B-Tree 索引（id）</text>
    <!-- B-Tree root -->
    <rect x="395" y="115" width="70" height="24" rx="5" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.2"/>
    <text x="430" y="131" text-anchor="middle" font-size="11" fill="var(--d-green)" font-weight="bold">5</text>
    <!-- B-Tree left -->
    <rect x="355" y="158" width="60" height="22" rx="4" fill="var(--d-green)" opacity="0.12" stroke="var(--d-green)" stroke-width="1"/>
    <text x="385" y="173" text-anchor="middle" font-size="10" fill="var(--d-text)">0 1 2 3 4</text>
    <!-- B-Tree right -->
    <rect x="435" y="158" width="60" height="22" rx="4" fill="var(--d-green)" opacity="0.12" stroke="var(--d-green)" stroke-width="1"/>
    <text x="465" y="173" text-anchor="middle" font-size="10" fill="var(--d-text)">5 6 7 8 9</text>
    <line x1="415" y1="139" x2="385" y2="158" stroke="var(--d-green)" stroke-width="1"/>
    <line x1="445" y1="139" x2="465" y2="158" stroke="var(--d-green)" stroke-width="1"/>
    <!-- Arrows from B-Tree leaves to data array -->
    <line x1="365" y1="180" x2="318" y2="76" stroke="var(--d-green)" stroke-width="0.8" stroke-dasharray="3,2"/>
    <line x1="375" y1="180" x2="52" y2="76" stroke="var(--d-green)" stroke-width="0.8" stroke-dasharray="3,2"/>
    <text x="290" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">B-Tree 叶子节点有序 → 范围查询走 B-Tree 索引</text>
    <text x="290" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">叶子存的仍然是数据在数组中的位置（pos）</text>
    <!-- Summary box -->
    <rect x="80" y="240" width="420" height="30" rx="5" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="290" y="260" text-anchor="middle" font-size="11" fill="var(--d-deep-blue)">同一份数据可同时拥有 Hash 和 B-Tree 两种索引</text>
    <text x="290" y="290" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 4  Memory 引擎增加 B-Tree 索引后的数据组织</text>
  </svg>
  </div>

  <div v-else-if="kind === 'btree-vs-hash-query-compare'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 220" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="220" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">B-Tree 索引 vs Hash 索引查询对比</text>
    <!-- Left: B-Tree -->
    <rect x="20" y="36" width="260" height="140" rx="6" fill="var(--d-bg)" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="150" y="54" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-green)">select * from t1 where id&lt;5</text>
    <text x="150" y="70" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优化器选择 B-Tree 索引</text>
    <rect x="40" y="78" width="220" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="100" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">id</text>
    <text x="200" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">c</text>
    <g font-size="10" fill="var(--d-text)">
      <text x="100" y="112" text-anchor="middle" font-weight="bold" fill="var(--d-green)">0</text><text x="200" y="112" text-anchor="middle">0</text>
      <text x="100" y="127" text-anchor="middle">1</text><text x="200" y="127" text-anchor="middle">1</text>
      <text x="100" y="142" text-anchor="middle">2</text><text x="200" y="142" text-anchor="middle">2</text>
      <text x="100" y="157" text-anchor="middle">3</text><text x="200" y="157" text-anchor="middle">3</text>
      <text x="100" y="172" text-anchor="middle">4</text><text x="200" y="172" text-anchor="middle">4</text>
    </g>
    <!-- Right: Hash -->
    <rect x="300" y="36" width="260" height="140" rx="6" fill="var(--d-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="430" y="54" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">select * from t1 force index(PRIMARY)</text>
    <text x="430" y="70" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">强制使用 Hash 主键索引 → 全表扫描</text>
    <rect x="320" y="78" width="220" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="380" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">id</text>
    <text x="480" y="92" text-anchor="middle" font-size="10" fill="var(--d-th-text)">c</text>
    <g font-size="10" fill="var(--d-text)">
      <text x="380" y="112" text-anchor="middle">1</text><text x="480" y="112" text-anchor="middle">1</text>
      <text x="380" y="127" text-anchor="middle">2</text><text x="480" y="127" text-anchor="middle">2</text>
      <text x="380" y="142" text-anchor="middle">3</text><text x="480" y="142" text-anchor="middle">3</text>
      <text x="380" y="157" text-anchor="middle">4</text><text x="480" y="157" text-anchor="middle">4</text>
      <text x="380" y="172" text-anchor="middle" font-weight="bold" fill="var(--d-orange)">0</text><text x="480" y="172" text-anchor="middle">0</text>
    </g>
    <!-- Annotation -->
    <text x="150" y="196" text-anchor="middle" font-size="10" fill="var(--d-green)">有序返回 0-4</text>
    <text x="430" y="196" text-anchor="middle" font-size="10" fill="var(--d-orange)">0 在最后（写入顺序）</text>
    <text x="290" y="214" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 5  B-Tree 索引 vs Hash 索引查询结果对比</text>
  </svg>
  </div>

  <div v-else-if="kind === 'memory-table-lock-steps'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 200" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="200" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">内存表的表锁 — 复现步骤</text>
    <!-- Header -->
    <rect x="20" y="34" width="80" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="60" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">时刻</text>
    <rect x="105" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="180" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session A</text>
    <rect x="260" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="335" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session B</text>
    <rect x="415" y="34" width="150" height="24" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="490" y="50" text-anchor="middle" font-size="11" fill="var(--d-th-text)">session C</text>
    <!-- T1 -->
    <text x="60" y="80" text-anchor="middle" font-size="11" fill="var(--d-text)">T1</text>
    <rect x="105" y="65" width="150" height="24" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="180" y="81" text-anchor="middle" font-size="9" fill="var(--d-blue)">update t1 set id=</text>
    <text x="180" y="91" text-anchor="middle" font-size="9" fill="var(--d-blue)">sleep(50)...</text>
    <!-- T2 -->
    <text x="60" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">T2</text>
    <rect x="260" y="100" width="150" height="24" rx="3" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.2"/>
    <text x="335" y="116" text-anchor="middle" font-size="9" fill="var(--d-orange)">select * from t1</text>
    <text x="335" y="134" text-anchor="middle" font-size="9" fill="var(--d-orange)">(Blocked - 锁等待)</text>
    <!-- T3 -->
    <text x="60" y="156" text-anchor="middle" font-size="11" fill="var(--d-text)">T3</text>
    <rect x="415" y="142" width="150" height="24" rx="3" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1"/>
    <text x="490" y="158" text-anchor="middle" font-size="9" fill="var(--d-engine-text)">show processlist</text>
    <text x="290" y="190" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 6  内存表的表锁 — 复现步骤</text>
  </svg>
  </div>

  <div v-else-if="kind === 'processlist-table-lock'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 130" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="130" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">show processlist 输出</text>
    <rect x="20" y="34" width="540" height="70" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
    <g font-size="10" fill="var(--d-text)" font-family="monospace">
      <text x="30" y="50">Id  Command  State              Info</text>
      <text x="30" y="66" fill="var(--d-blue)">1   Query    User sleep         update t1 set id=sleep(50)</text>
      <text x="30" y="82" fill="var(--d-orange)">2   Query    <tspan font-weight="bold">Waiting for table</tspan>  select * from t1</text>
      <text x="30" y="98" fill="var(--d-text-sub)">3   Query    init               show processlist</text>
    </g>
    <text x="290" y="122" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 7  session C 的 show processlist 结果</text>
  </svg>
  </div>

  <div v-else-if="kind === 'master-slave-architecture'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" style="max-width:480px;width:100%;font-family:monospace">
    <rect width="480" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">M-S 基本架构</text>
    <!-- Client -->
    <rect x="20" y="55" width="80" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="60" y="79" text-anchor="middle" font-size="12" fill="var(--d-blue)">客户端</text>
    <!-- Proxy -->
    <rect x="140" y="55" width="80" height="40" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.5"/>
    <text x="180" y="79" text-anchor="middle" font-size="12" fill="var(--d-engine-text)">Proxy</text>
    <!-- Master -->
    <rect x="270" y="35" width="90" height="36" rx="6" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="315" y="57" text-anchor="middle" font-size="12" fill="var(--d-green)" font-weight="bold">主库 M</text>
    <!-- Slave -->
    <rect x="270" y="85" width="90" height="36" rx="6" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="315" y="107" text-anchor="middle" font-size="12" fill="var(--d-orange)" font-weight="bold">备库 S</text>
    <!-- Arrows -->
    <line x1="100" y1="75" x2="138" y2="75" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
    <line x1="220" y1="65" x2="268" y2="53" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
    <line x1="220" y1="85" x2="268" y2="97" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a8)"/>
    <line x1="360" y1="63" x2="395" y2="80" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a8b)"/>
    <line x1="395" y1="80" x2="360" y2="97" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a8b)"/>
    <text x="430" y="84" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">binlog</text>
    <defs>
      <marker id="a8" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-text-sub)" stroke-width="1"/></marker>
      <marker id="a8b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
    </defs>
    <text x="240" y="150" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 8  M-S 基本架构（含 Proxy）</text>
  </svg>
  </div>

  <div v-else-if="kind === 'dual-master-architecture'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160" style="max-width:480px;width:100%;font-family:monospace">
    <rect width="480" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="240" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">双 M 结构</text>
    <!-- Client -->
    <rect x="20" y="55" width="80" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="60" y="79" text-anchor="middle" font-size="12" fill="var(--d-blue)">客户端</text>
    <!-- Proxy -->
    <rect x="140" y="55" width="80" height="40" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.5"/>
    <text x="180" y="79" text-anchor="middle" font-size="12" fill="var(--d-engine-text)">Proxy</text>
    <!-- M1 -->
    <rect x="270" y="35" width="90" height="36" rx="6" fill="var(--d-green)" opacity="0.18" stroke="var(--d-green)" stroke-width="1.5"/>
    <text x="315" y="57" text-anchor="middle" font-size="12" fill="var(--d-green)" font-weight="bold">M1</text>
    <!-- M2 -->
    <rect x="270" y="85" width="90" height="36" rx="6" fill="var(--d-orange)" opacity="0.18" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="315" y="107" text-anchor="middle" font-size="12" fill="var(--d-orange)" font-weight="bold">M2</text>
    <!-- Arrows -->
    <line x1="100" y1="75" x2="138" y2="75" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
    <line x1="220" y1="65" x2="268" y2="53" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
    <line x1="220" y1="85" x2="268" y2="97" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#a9)"/>
    <!-- Dual binlog arrows -->
    <path d="M370,53 Q420,53 420,78 Q420,97 370,97" fill="none" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a9b)"/>
    <path d="M370,103 Q440,103 440,78 Q440,53 370,53" fill="none" stroke="var(--d-blue-border)" stroke-width="1.2" stroke-dasharray="4,3" marker-end="url(#a9c)"/>
    <text x="455" y="64" text-anchor="start" font-size="9" fill="var(--d-text-muted)">binlog</text>
    <text x="455" y="100" text-anchor="start" font-size="9" fill="var(--d-text-muted)">binlog</text>
    <defs>
      <marker id="a9" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-text-sub)" stroke-width="1"/></marker>
      <marker id="a9b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
      <marker id="a9c" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="var(--d-blue-border)" stroke-width="1"/></marker>
    </defs>
    <text x="240" y="150" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 9  双 M 结构 — 互为主备</text>
  </svg>
  </div>

  <div v-else-if="kind === 'memory-temp-table-benefit'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 160" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="160" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">使用内存临时表的执行效果</text>
    <rect x="30" y="36" width="520" height="90" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
    <g font-size="10" fill="var(--d-text)" font-family="monospace">
      <text x="40" y="54" fill="var(--d-text-muted)">mysql&gt;</text>
      <text x="95" y="54">create temporary table temp_t(...) engine=<tspan fill="var(--d-green)" font-weight="bold">memory</tspan>;</text>
      <text x="40" y="72" fill="var(--d-text-muted)">mysql&gt;</text>
      <text x="95" y="72">insert into temp_t select ... from t2 where b&gt;=1 and b&lt;=2000;</text>
      <text x="40" y="90" fill="var(--d-text-muted)">mysql&gt;</text>
      <text x="95" y="90">select * from t1 join temp_t on (t1.b=temp_t.b);</text>
      <text x="40" y="112" fill="var(--d-blue)">-- 导入速度更快（无需写磁盘）</text>
      <text x="40" y="124" fill="var(--d-blue)">-- hash 索引查找更快，join 性能更优</text>
    </g>
    <text x="290" y="152" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 10  使用内存临时表优化 join 查询</text>
  </svg>
  </div>

</template>
