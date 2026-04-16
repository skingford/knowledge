<script setup lang="ts">
type DiagramKind = 'query-result-flow' | 'sending-to-client-state' | 'sending-data-lock-wait' | 'sending-data-processlist' | 'buffer-pool-hit-rate' | 'basic-lru' | 'improved-lru'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'query-result-flow'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 370" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="arrow1" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
    </defs>
    <!-- Server box -->
    <rect x="30" y="20" width="180" height="260" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="120" y="45" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">MySQL Server</text>
    <!-- InnoDB -->
    <rect x="55" y="60" width="130" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="120" y="83" text-anchor="middle" font-size="11" fill="var(--d-blue)">InnoDB 引擎</text>
    <!-- Arrow down -->
    <line x1="120" y1="96" x2="120" y2="118" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#arrow1)"/>
    <text x="155" y="112" font-size="9" fill="var(--d-text-sub)">获取一行</text>
    <!-- net_buffer -->
    <rect x="55" y="120" width="130" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="120" y="138" text-anchor="middle" font-size="11" fill="var(--d-blue)">net_buffer</text>
    <text x="120" y="151" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">默认 16k</text>
    <!-- Arrow down -->
    <line x1="120" y1="156" x2="120" y2="178" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#arrow1)"/>
    <text x="155" y="172" font-size="9" fill="var(--d-text-sub)">写满后发送</text>
    <!-- socket send buffer -->
    <rect x="45" y="180" width="150" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="120" y="198" text-anchor="middle" font-size="10" fill="var(--d-blue)">socket send buffer</text>
    <text x="120" y="211" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">网络栈</text>
    <!-- Arrow to network -->
    <line x1="195" y1="198" x2="278" y2="198" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#arrow1)"/>
    <text x="237" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">网络</text>
    <!-- EAGAIN note -->
    <rect x="45" y="230" width="150" height="40" rx="4" fill="none" stroke="var(--d-orange)" stroke-width="1" stroke-dasharray="4"/>
    <text x="120" y="248" text-anchor="middle" font-size="9" fill="var(--d-orange)">若写满返回 EAGAIN</text>
    <text x="120" y="261" text-anchor="middle" font-size="9" fill="var(--d-orange)">→ 进入等待</text>
    <!-- Client box -->
    <rect x="280" y="140" width="170" height="140" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
    <text x="365" y="170" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Client</text>
    <!-- socket recv buffer -->
    <rect x="300" y="185" width="130" height="36" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="365" y="203" text-anchor="middle" font-size="10" fill="var(--d-blue)">socket recv buffer</text>
    <!-- Result -->
    <rect x="300" y="235" width="130" height="30" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="365" y="255" text-anchor="middle" font-size="10" fill="var(--d-blue)">结果文件 / 内存</text>
    <!-- Arrow down in client -->
    <line x1="365" y1="221" x2="365" y2="233" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#arrow1)"/>
    <!-- Caption -->
    <text x="240" y="350" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 1 查询结果发送流程</text>
  </svg>
  </div>

  <div v-else-if="kind === 'sending-to-client-state'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 110" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="10" y="10" width="480" height="90" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="20" y="32" font-size="11" font-weight="bold" fill="var(--d-text)">mysql> show processlist;</text>
    <text x="20" y="52" font-size="10" fill="var(--d-text-muted)">+----+------+-----------+------+---------+------+-------------------+----------+</text>
    <text x="20" y="65" font-size="10" fill="var(--d-text-muted)">| Id | User | Host      | db   | Command | Time | State             | Info     |</text>
    <text x="20" y="78" font-size="10" fill="var(--d-text-muted)">+----+------+-----------+------+---------+------+-------------------+----------+</text>
    <text x="20" y="91" font-size="10" fill="var(--d-orange)">|  1 | root | localhost | db1  | Query   |   15 | Sending to client | select…  |</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 2 服务端发送阻塞 — State 显示 "Sending to client"</div>
  </div>

  <div v-else-if="kind === 'sending-data-lock-wait'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="10" y="10" width="480" height="120" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="20" y="30" font-size="11" font-weight="bold" fill="var(--d-text)">Session A</text>
    <text x="260" y="30" font-size="11" font-weight="bold" fill="var(--d-text)">Session B</text>
    <line x1="245" y1="15" x2="245" y2="125" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4"/>
    <text x="20" y="52" font-size="10" fill="var(--d-blue)">begin;</text>
    <text x="20" y="68" font-size="10" fill="var(--d-blue)">select * from t lock</text>
    <text x="20" y="81" font-size="10" fill="var(--d-blue)">  in share mode;</text>
    <text x="20" y="97" font-size="9" fill="var(--d-text-muted)">(持有读锁不提交)</text>
    <text x="260" y="68" font-size="10" fill="var(--d-orange)">select * from t;</text>
    <text x="260" y="84" font-size="9" fill="var(--d-orange)">→ 被阻塞，等待锁</text>
    <text x="260" y="100" font-size="9" fill="var(--d-orange)">State: Sending data</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 3 读全表被锁 — Session A 持有读锁，Session B 等待</div>
  </div>

  <div v-else-if="kind === 'sending-data-processlist'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 90" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="10" y="10" width="480" height="70" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="20" y="32" font-size="11" font-weight="bold" fill="var(--d-text)">mysql> show processlist;  -- Session B</text>
    <text x="20" y="52" font-size="10" fill="var(--d-text-muted)">| Id | Command | Time | State        | Info              |</text>
    <text x="20" y="68" font-size="10" fill="var(--d-orange)">|  2 | Query   |   10 | Sending data | select * from t   |</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 4 Sending data 状态 — 实际在等锁，而非发送数据</div>
  </div>

  <div v-else-if="kind === 'buffer-pool-hit-rate'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 120" style="max-width:580px;width:100%;height:auto;font-family:'Courier New',monospace">
    <rect x="10" y="10" width="480" height="100" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
    <text x="20" y="32" font-size="11" font-weight="bold" fill="var(--d-text)">show engine innodb status\G</text>
    <text x="20" y="52" font-size="10" fill="var(--d-text-muted)">----------------------</text>
    <text x="20" y="66" font-size="10" fill="var(--d-text-muted)">BUFFER POOL AND MEMORY</text>
    <text x="20" y="80" font-size="10" fill="var(--d-text-muted)">----------------------</text>
    <text x="20" y="98" font-size="10.5" fill="var(--d-green)">Buffer pool hit rate 990 / 1000</text>
    <rect x="340" y="86" width="130" height="20" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
    <text x="405" y="100" text-anchor="middle" font-size="10" fill="var(--d-blue)">命中率 99.0%</text>
  </svg>
  <div style="font-size:12px;color:var(--d-text-sub);margin-top:0.3em">图 5 Buffer pool hit rate 显示命中率 99.0%</div>
  </div>

  <div v-else-if="kind === 'basic-lru'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="arr6" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
    </defs>
    <!-- State 1 -->
    <text x="30" y="20" font-size="11" font-weight="bold" fill="var(--d-text)">状态 1</text>
    <g transform="translate(30,30)">
      <rect x="0" y="0" width="40" height="28" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="20" y="18" text-anchor="middle" font-size="10" fill="var(--d-blue)">P1</text>
      <rect x="44" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="64" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <rect x="88" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="108" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">P3</text>
      <rect x="132" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="152" y="18" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>
      <rect x="176" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="196" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">Pm</text>
      <text x="-5" y="18" text-anchor="end" font-size="9" fill="var(--d-text-muted)">head</text>
      <text x="230" y="18" font-size="9" fill="var(--d-text-muted)">tail</text>
    </g>
    <!-- Arrow -->
    <line x1="260" y1="55" x2="260" y2="80" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arr6)"/>
    <text x="275" y="73" font-size="9" fill="var(--d-text-sub)">访问 P3</text>
    <!-- State 2 -->
    <text x="30" y="100" font-size="11" font-weight="bold" fill="var(--d-text)">状态 2</text>
    <g transform="translate(30,110)">
      <rect x="0" y="0" width="40" height="28" rx="3" fill="var(--d-green)" stroke="var(--d-green)" stroke-width="1" fill-opacity="0.15"/>
      <text x="20" y="18" text-anchor="middle" font-size="10" fill="var(--d-green)">P3</text>
      <rect x="44" y="0" width="40" height="28" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="64" y="18" text-anchor="middle" font-size="10" fill="var(--d-blue)">P1</text>
      <rect x="88" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="108" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">P2</text>
      <rect x="132" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="152" y="18" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>
      <rect x="176" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="196" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">Pm</text>
    </g>
    <!-- Arrow -->
    <line x1="260" y1="148" x2="260" y2="170" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arr6)"/>
    <text x="275" y="165" font-size="9" fill="var(--d-text-sub)">访问 Px (新页)</text>
    <!-- State 3 -->
    <text x="30" y="190" font-size="11" font-weight="bold" fill="var(--d-text)">状态 3</text>
    <g transform="translate(30,200)">
      <rect x="0" y="0" width="40" height="28" rx="3" fill="var(--d-orange)" stroke="var(--d-orange)" stroke-width="1" fill-opacity="0.15"/>
      <text x="20" y="18" text-anchor="middle" font-size="10" fill="var(--d-orange)">Px</text>
      <rect x="44" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="64" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">P3</text>
      <rect x="88" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="108" y="18" text-anchor="middle" font-size="10" fill="var(--d-text)">P1</text>
      <rect x="132" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="152" y="18" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>
      <rect x="176" y="0" width="40" height="28" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4"/>
      <text x="196" y="18" text-anchor="middle" font-size="10" fill="var(--d-text-dim)">Pm</text>
      <text x="196" y="44" text-anchor="middle" font-size="9" fill="var(--d-orange)">淘汰</text>
    </g>
    <text x="260" y="275" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 6 基本 LRU 算法</text>
  </svg>
  </div>

  <div v-else-if="kind === 'improved-lru'" style="text-align:center;margin:1.5em 0">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 310" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
    <defs>
      <marker id="arr7" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6Z" fill="var(--d-blue)"/></marker>
    </defs>
    <!-- State 1 -->
    <text x="30" y="20" font-size="11" font-weight="bold" fill="var(--d-text)">状态 1</text>
    <g transform="translate(20,30)">
      <!-- Young 5/8 -->
      <rect x="0" y="0" width="260" height="34" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="130" y="14" text-anchor="middle" font-size="9" fill="var(--d-blue)">young 区域 (5/8)</text>
      <text x="20" y="28" font-size="10" fill="var(--d-text)">P1  P2  P3  P4  P5</text>
      <!-- Old 3/8 -->
      <rect x="268" y="0" width="200" height="34" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="368" y="14" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">old 区域 (3/8)</text>
      <text x="288" y="28" font-size="10" fill="var(--d-text-muted)">P6  P7  …  Pm</text>
      <!-- LRU_old pointer -->
      <line x1="268" y1="-4" x2="268" y2="40" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="4"/>
      <text x="268" y="-8" text-anchor="middle" font-size="9" fill="var(--d-orange)">LRU_old</text>
    </g>
    <!-- Arrow -->
    <line x1="260" y1="72" x2="260" y2="92" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arr7)"/>
    <text x="275" y="88" font-size="9" fill="var(--d-text-sub)">访问 P3 (在 young 区)</text>
    <!-- State 2 -->
    <text x="30" y="110" font-size="11" font-weight="bold" fill="var(--d-text)">状态 2</text>
    <g transform="translate(20,120)">
      <rect x="0" y="0" width="260" height="34" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="20" y="22" font-size="10" fill="var(--d-green)">P3</text>
      <text x="55" y="22" font-size="10" fill="var(--d-text)">P1  P2  P4  P5</text>
      <rect x="268" y="0" width="200" height="34" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="288" y="22" font-size="10" fill="var(--d-text-muted)">P6  P7  …  Pm</text>
      <line x1="268" y1="-4" x2="268" y2="40" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="4"/>
    </g>
    <!-- Arrow -->
    <line x1="260" y1="162" x2="260" y2="182" stroke="var(--d-blue)" stroke-width="1.2" marker-end="url(#arr7)"/>
    <text x="275" y="178" font-size="9" fill="var(--d-text-sub)">访问 Px (新页)</text>
    <!-- State 3 -->
    <text x="30" y="200" font-size="11" font-weight="bold" fill="var(--d-text)">状态 3</text>
    <g transform="translate(20,210)">
      <rect x="0" y="0" width="260" height="34" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="20" y="22" font-size="10" fill="var(--d-text)">P3  P1  P2  P4  P5</text>
      <rect x="268" y="0" width="200" height="34" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="288" y="22" font-size="10" fill="var(--d-orange)">Px</text>
      <text x="318" y="22" font-size="10" fill="var(--d-text-muted)">P6  …</text>
      <text x="440" y="22" font-size="10" fill="var(--d-text-dim)">Pm</text>
      <line x1="268" y1="-4" x2="268" y2="40" stroke="var(--d-orange)" stroke-width="1.5" stroke-dasharray="4"/>
      <text x="268" y="-8" text-anchor="middle" font-size="9" fill="var(--d-orange)">LRU_old</text>
      <!-- Note: Px inserted at old head -->
      <text x="288" y="50" font-size="9" fill="var(--d-orange)">↑ 新页插入 old 区头部</text>
      <text x="410" y="50" font-size="9" fill="var(--d-text-dim)">↑ 淘汰 Pm</text>
    </g>
    <!-- Explanation -->
    <g transform="translate(20,280)">
      <text x="0" y="0" font-size="9" fill="var(--d-text-sub)">old 区页面存在 &gt;1s 再被访问 → 移至 young 头部</text>
      <text x="0" y="14" font-size="9" fill="var(--d-text-sub)">old 区页面存在 &lt;1s → 保持不动 (innodb_old_blocks_time=1000ms)</text>
    </g>
    <text x="260" y="308" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">图 7 改进的 LRU 算法</text>
  </svg>
  </div>

</template>
