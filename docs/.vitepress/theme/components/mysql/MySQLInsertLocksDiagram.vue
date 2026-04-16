<script setup lang="ts">
type DiagramKind = 'concurrent-insert-select' | 'slow-log-insert-target-table' | 'slow-log-insert-same-table' | 'explain-using-temporary' | 'innodb-rows-read-change' | 'unique-key-conflict-lock' | 'unique-key-conflict-deadlock' | 'deadlock-state-flow' | 'duplicate-key-update-conflict-order'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'concurrent-insert-select'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 190" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="190" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">并发 insert 场景</text>
    <!-- Header -->
    <rect x="20" y="36" width="60" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="50" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">时刻</text>
    <rect x="85" y="36" width="240" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="205" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session A</text>
    <rect x="330" y="36" width="230" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="445" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session B</text>
    <!-- T1 -->
    <text x="50" y="78" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">T1</text>
    <rect x="330" y="64" width="230" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="340" y="79" font-size="9" fill="var(--d-blue)">insert into t2(c,d) select c,d from t</text>
    <!-- T2 -->
    <text x="50" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">T2</text>
    <rect x="85" y="94" width="240" height="22" rx="3" fill="var(--d-orange)" opacity="0.15" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="95" y="109" font-size="9" fill="var(--d-orange)">insert into t values(-1,-1,-1)</text>
    <!-- Explanation -->
    <rect x="40" y="130" width="500" height="32" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
    <text x="290" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">若无锁保护，session A 可能后写 binlog</text>
    <text x="290" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">备库重放时 id=-1 被 session B 的 select 读到 → 主备不一致</text>
    <text x="290" y="182" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 1  insert ... select 的并发场景</text>
  </svg>
  </div>

  <div v-else-if="kind === 'slow-log-insert-target-table'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 120" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="120" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">慢查询日志 — 插入表 t2</text>
    <rect x="30" y="36" width="520" height="56" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
    <g font-size="10" fill="var(--d-text)" font-family="monospace">
      <text x="40" y="52">Query_time: 0.000  Lock_time: 0.000</text>
      <text x="40" y="66">Rows_sent: 0  <tspan fill="var(--d-green)" font-weight="bold">Rows_examined: 1</tspan></text>
      <text x="40" y="82" fill="var(--d-blue)">insert into t2(c,d) (select c+1,d from t</text>
      <text x="40" y="82" fill="var(--d-blue)"><tspan dx="260">force index(c) order by c desc limit 1)</tspan></text>
    </g>
    <text x="290" y="112" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 2  插入表 t2 时扫描行数 = 1</text>
  </svg>
  </div>

  <div v-else-if="kind === 'slow-log-insert-same-table'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 120" style="max-width:580px;width:100%;font-family:monospace">
    <rect width="580" height="120" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">慢查询日志 — 插入表 t（同一表）</text>
    <rect x="30" y="36" width="520" height="56" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
    <g font-size="10" fill="var(--d-text)" font-family="monospace">
      <text x="40" y="52">Query_time: 0.000  Lock_time: 0.000</text>
      <text x="40" y="66">Rows_sent: 0  <tspan fill="var(--d-orange)" font-weight="bold">Rows_examined: 5</tspan></text>
      <text x="40" y="82" fill="var(--d-blue)">insert into t(c,d) (select c+1,d from t</text>
      <text x="40" y="82" fill="var(--d-blue)"><tspan dx="250">force index(c) order by c desc limit 1)</tspan></text>
    </g>
    <text x="290" y="112" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 3  插入同一表 t 时扫描行数 = 5（需临时表）</text>
  </svg>
  </div>

  <div v-else-if="kind === 'explain-using-temporary'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 130" style="max-width:620px;width:100%;font-family:monospace">
    <rect width="620" height="130" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="310" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">EXPLAIN 结果</text>
    <!-- Header -->
    <g font-size="9" font-weight="bold" fill="var(--d-th-text)">
      <rect x="10" y="34" width="30" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="25" y="48" text-anchor="middle">id</text>
      <rect x="44" y="34" width="70" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="79" y="48" text-anchor="middle">select_type</text>
      <rect x="118" y="34" width="40" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="138" y="48" text-anchor="middle">table</text>
      <rect x="162" y="34" width="40" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="182" y="48" text-anchor="middle">type</text>
      <rect x="206" y="34" width="60" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="236" y="48" text-anchor="middle">key</text>
      <rect x="270" y="34" width="50" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="295" y="48" text-anchor="middle">key_len</text>
      <rect x="324" y="34" width="40" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="344" y="48" text-anchor="middle">rows</text>
      <rect x="368" y="34" width="240" height="20" rx="3" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="488" y="48" text-anchor="middle">Extra</text>
    </g>
    <!-- Row 1 -->
    <g font-size="9" fill="var(--d-text)">
      <rect x="10" y="58" width="30" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="25" y="72" text-anchor="middle">1</text>
      <rect x="44" y="58" width="70" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="79" y="72" text-anchor="middle">INSERT</text>
      <rect x="118" y="58" width="40" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="138" y="72" text-anchor="middle">t</text>
      <rect x="162" y="58" width="40" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="182" y="72" text-anchor="middle">ALL</text>
      <rect x="206" y="58" width="60" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="236" y="72" text-anchor="middle">NULL</text>
      <rect x="270" y="58" width="50" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="295" y="72" text-anchor="middle">NULL</text>
      <rect x="324" y="58" width="40" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="344" y="72" text-anchor="middle">NULL</text>
      <rect x="368" y="58" width="240" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="488" y="72" text-anchor="middle">NULL</text>
    </g>
    <!-- Row 2 -->
    <g font-size="9" fill="var(--d-text)">
      <rect x="10" y="82" width="30" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="25" y="96" text-anchor="middle">1</text>
      <rect x="44" y="82" width="70" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="79" y="96" text-anchor="middle">INSERT</text>
      <rect x="118" y="82" width="40" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="138" y="96" text-anchor="middle">t</text>
      <rect x="162" y="82" width="40" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="182" y="96" text-anchor="middle">index</text>
      <rect x="206" y="82" width="60" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="236" y="96" text-anchor="middle">c</text>
      <rect x="270" y="82" width="50" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="295" y="96" text-anchor="middle">5</text>
      <rect x="324" y="82" width="40" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="344" y="96" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">1</text>
      <rect x="368" y="82" width="240" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
      <text x="488" y="96" text-anchor="middle" fill="var(--d-orange)" font-weight="bold">Using temporary</text>
    </g>
    <text x="310" y="122" text-anchor="middle" font-size="11" fill="var(--d-text)">图 4  explain 结果（rows=1 受 limit 1 影响，实际扫描更多）</text>
  </svg>
  </div>

  <div v-else-if="kind === 'innodb-rows-read-change'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160" style="max-width:520px;width:100%;font-family:monospace">
    <rect width="520" height="160" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="260" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">查看 Innodb_rows_read 变化</text>
    <!-- Before -->
    <rect x="20" y="38" width="480" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="30" y="53" font-size="10" fill="var(--d-th-text)" font-weight="bold">执行前：show status like 'Innodb_rows_read'</text>
    <rect x="20" y="64" width="230" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="30" y="78" font-size="9" fill="var(--d-text)">Variable_name</text>
    <rect x="254" y="64" width="246" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="264" y="78" font-size="9" fill="var(--d-text)">Value</text>
    <rect x="20" y="86" width="230" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="30" y="100" font-size="9" fill="var(--d-text)">Innodb_rows_read</text>
    <rect x="254" y="86" width="246" height="20" rx="3" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="264" y="100" font-size="9" fill="var(--d-green)" font-weight="bold">12</text>
    <!-- After -->
    <rect x="20" y="114" width="230" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="30" y="128" font-size="9" fill="var(--d-text)">执行后：Innodb_rows_read</text>
    <rect x="254" y="114" width="246" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="264" y="128" font-size="9" fill="var(--d-orange)" font-weight="bold">16  （增加了 4，全表扫描表 t）</text>
    <text x="260" y="152" text-anchor="middle" font-size="11" fill="var(--d-text)">图 5  执行前后 Innodb_rows_read 增加 4</text>
  </svg>
  </div>

  <div v-else-if="kind === 'unique-key-conflict-lock'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 200" style="max-width:620px;width:100%;font-family:monospace">
    <rect width="620" height="200" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="310" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">唯一键冲突加锁</text>
    <!-- Header -->
    <rect x="15" y="36" width="50" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="40" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">时刻</text>
    <rect x="70" y="36" width="260" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="200" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session A</text>
    <rect x="335" y="36" width="270" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="470" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session B</text>
    <!-- T1 -->
    <text x="40" y="80" text-anchor="middle" font-size="10" fill="var(--d-text)">T1</text>
    <rect x="70" y="66" width="260" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="80" y="81" font-size="9" fill="var(--d-text)">insert into t values(10,10,10);</text>
    <!-- T2 -->
    <text x="40" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">T2</text>
    <rect x="335" y="96" width="270" height="36" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="345" y="111" font-size="9" fill="var(--d-text)">insert into t values(11,10,10);</text>
    <text x="345" y="125" font-size="9" fill="var(--d-orange)">(Duplicate entry '10' for key 'c')</text>
    <!-- T3 -->
    <text x="40" y="156" text-anchor="middle" font-size="10" fill="var(--d-text)">T3</text>
    <rect x="335" y="142" width="270" height="22" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="345" y="157" font-size="9" fill="var(--d-orange)">insert into t values(12,9,9); -- blocked</text>
    <!-- Note -->
    <rect x="50" y="172" width="520" height="18" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="310" y="185" text-anchor="middle" font-size="9" fill="var(--d-text)">session A 持有索引 c 上 (5,10] 共享 next-key lock（读锁），session B 被阻塞</text>
    <text x="310" y="197" text-anchor="middle" font-size="11" fill="var(--d-text)">图 6  唯一键冲突加锁</text>
  </svg>
  </div>

  <div v-else-if="kind === 'unique-key-conflict-deadlock'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 230" style="max-width:720px;width:100%;font-family:monospace">
    <rect width="720" height="230" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="360" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">唯一键冲突 -- 死锁</text>
    <!-- Header -->
    <rect x="10" y="36" width="40" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="30" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">时刻</text>
    <rect x="54" y="36" width="210" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="159" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session A</text>
    <rect x="268" y="36" width="220" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="378" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session B</text>
    <rect x="492" y="36" width="218" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="601" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session C</text>
    <!-- T1 -->
    <text x="30" y="80" text-anchor="middle" font-size="10" fill="var(--d-text)">T1</text>
    <rect x="54" y="66" width="210" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="64" y="81" font-size="9" fill="var(--d-text)">insert into t values(null,5,5);</text>
    <!-- T2 -->
    <text x="30" y="110" text-anchor="middle" font-size="10" fill="var(--d-text)">T2</text>
    <rect x="268" y="96" width="220" height="22" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="278" y="111" font-size="9" fill="var(--d-orange)">insert into t values(null,5,5);</text>
    <rect x="492" y="96" width="218" height="22" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="502" y="111" font-size="9" fill="var(--d-orange)">insert into t values(null,5,5);</text>
    <!-- T3 -->
    <text x="30" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">T3</text>
    <rect x="54" y="128" width="210" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="64" y="143" font-size="9" fill="var(--d-text)">rollback;</text>
    <rect x="268" y="154" width="220" height="20" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="278" y="168" font-size="9" fill="var(--d-orange)">尝试写锁 → 等待 C</text>
    <rect x="492" y="154" width="218" height="20" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="502" y="168" font-size="9" fill="var(--d-orange)">尝试写锁 → 等待 B</text>
    <!-- Deadlock note -->
    <rect x="100" y="182" width="520" height="20" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="360" y="196" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-orange)">Deadlock! session B 与 session C 互相等待对方释放读锁</text>
    <text x="360" y="224" text-anchor="middle" font-size="11" fill="var(--d-text)">图 7  唯一键冲突 -- 死锁</text>
  </svg>
  </div>

  <div v-else-if="kind === 'deadlock-state-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 340" style="max-width:560px;width:100%;font-family:monospace">
    <rect width="560" height="340" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="280" y="24" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">状态变化图 -- 死锁</text>
    <!-- Session A box -->
    <rect x="200" y="42" width="160" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="280" y="57" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">session A</text>
    <text x="280" y="71" text-anchor="middle" font-size="9" fill="var(--d-text)">持有 c=5 记录写锁(X)</text>
    <!-- Arrow down from A -->
    <line x1="280" y1="78" x2="280" y2="100" stroke="var(--d-text)" stroke-width="1.5" marker-end="url(#arr8)"/>
    <text x="340" y="94" font-size="9" fill="var(--d-text)">rollback</text>
    <!-- T2: B and C get S lock -->
    <rect x="60" y="106" width="180" height="36" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="150" y="121" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">session B</text>
    <text x="150" y="135" text-anchor="middle" font-size="9" fill="var(--d-orange)">唯一键冲突 → 申请 S lock</text>
    <rect x="320" y="106" width="180" height="36" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="410" y="121" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">session C</text>
    <text x="410" y="135" text-anchor="middle" font-size="9" fill="var(--d-orange)">唯一键冲突 → 申请 S lock</text>
    <!-- A rollback releases lock -->
    <rect x="140" y="156" width="280" height="24" rx="5" fill="var(--d-green)" opacity="0.15" stroke="var(--d-green)" stroke-width="1"/>
    <text x="280" y="172" text-anchor="middle" font-size="10" fill="var(--d-green)">A rollback → B、C 均获得 S next-key lock (5,10]</text>
    <!-- B wants X lock -->
    <rect x="60" y="196" width="180" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="150" y="211" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">session B</text>
    <text x="150" y="225" text-anchor="middle" font-size="9" fill="var(--d-text)">继续插入 → 申请 X 写锁</text>
    <rect x="320" y="196" width="180" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="410" y="211" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">session C</text>
    <text x="410" y="225" text-anchor="middle" font-size="9" fill="var(--d-text)">继续插入 → 申请 X 写锁</text>
    <!-- Deadlock arrows -->
    <defs>
      <marker id="arr8" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
        <path d="M0,0 L8,3 L0,6 Z" fill="var(--d-orange)"/>
      </marker>
    </defs>
    <path d="M240,228 C260,270 300,270 320,228" stroke="var(--d-orange)" stroke-width="2" fill="none" marker-end="url(#arr8)"/>
    <text x="280" y="268" text-anchor="middle" font-size="9" fill="var(--d-orange)">B 等待 C 释放 S lock</text>
    <path d="M320,240 C300,280 260,280 240,240" stroke="var(--d-orange)" stroke-width="2" fill="none" marker-end="url(#arr8)"/>
    <text x="280" y="290" text-anchor="middle" font-size="9" fill="var(--d-orange)">C 等待 B 释放 S lock</text>
    <!-- Deadlock label -->
    <rect x="190" y="300" width="180" height="22" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1.5"/>
    <text x="280" y="315" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">DEADLOCK!</text>
    <text x="280" y="336" text-anchor="middle" font-size="11" fill="var(--d-text)">图 8  状态变化图 -- 死锁</text>
  </svg>
  </div>

  <div v-else-if="kind === 'duplicate-key-update-conflict-order'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 220" style="max-width:620px;width:100%;font-family:monospace">
    <rect width="620" height="220" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
    <text x="310" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">两个唯一键同时冲突</text>
    <!-- Table state -->
    <rect x="20" y="36" width="580" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="310" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">表 t 已有数据：(1,1,1) 和 (2,2,2)</text>
    <!-- SQL -->
    <rect x="20" y="66" width="580" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="30" y="84" font-size="10" fill="var(--d-text)">insert into t values(2,1,1) on duplicate key update d=100;</text>
    <!-- Conflict analysis -->
    <rect x="20" y="102" width="280" height="46" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="30" y="118" font-size="9" fill="var(--d-orange)" font-weight="bold">主键冲突：id=2</text>
    <text x="30" y="132" font-size="9" fill="var(--d-text)">主键索引先判断 → 命中 id=2 行</text>
    <text x="30" y="144" font-size="9" fill="var(--d-text)">修改 id=2 这一行</text>
    <rect x="320" y="102" width="280" height="46" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-orange)" stroke-width="1"/>
    <text x="330" y="118" font-size="9" fill="var(--d-orange)" font-weight="bold">唯一键冲突：c=1</text>
    <text x="330" y="132" font-size="9" fill="var(--d-text)">唯一索引 c 也冲突，但主键先判断</text>
    <text x="330" y="144" font-size="9" fill="var(--d-text)">因此不修改 id=1 行</text>
    <!-- Result -->
    <rect x="20" y="158" width="580" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
    <text x="310" y="173" text-anchor="middle" font-size="10" fill="var(--d-th-text)">执行结果</text>
    <rect x="20" y="184" width="290" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="30" y="198" font-size="9" fill="var(--d-text)">id=2 的行变为 (2, 1, <tspan fill="var(--d-green)" font-weight="bold">100</tspan>)</text>
    <rect x="314" y="184" width="286" height="20" rx="3" fill="var(--d-stripe)" stroke="var(--d-blue-border)" stroke-width="0.5"/>
    <text x="324" y="198" font-size="9" fill="var(--d-orange)">affected rows = 2（insert+update 各计 1）</text>
    <text x="310" y="216" text-anchor="middle" font-size="11" fill="var(--d-text)">图 9  两个唯一键同时冲突</text>
  </svg>
  </div>

</template>
