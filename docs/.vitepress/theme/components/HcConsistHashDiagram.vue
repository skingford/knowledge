<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 380"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="一致性哈希"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">一致性哈希 · 哈希环与虚拟节点</text>

      <!-- Left: Problem with modulo -->
      <rect x="30" y="48" width="250" height="110" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="155" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">普通取模的问题</text>
      <text x="155" y="92" text-anchor="middle" font-size="9" fill="var(--d-text)">hash(key) % N</text>
      <text x="155" y="110" text-anchor="middle" font-size="9" fill="var(--d-text)">N→N+1 时，约 N/(N+1)</text>
      <text x="155" y="126" text-anchor="middle" font-size="9" fill="var(--d-text)">的 key 需迁移</text>
      <text x="155" y="146" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">10 → 11 节点：91% 数据重分布</text>

      <!-- Right: Hash ring -->
      <text x="580" y="50" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">一致性哈希环（0 ~ 2³²-1）</text>

      <!-- Ring -->
      <circle cx="580" cy="170" r="100" fill="none" stroke="var(--d-border)" stroke-width="2" />

      <!-- Nodes on ring -->
      <circle cx="580" cy="70" r="12" fill="var(--d-blue)" />
      <text x="580" y="74" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">A</text>
      <text x="602" y="62" font-size="8" fill="var(--d-blue)">Node A</text>

      <circle cx="680" cy="170" r="12" fill="var(--d-rv-a-border)" />
      <text x="680" y="174" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">B</text>
      <text x="702" y="166" font-size="8" fill="var(--d-rv-a-text)">Node B</text>

      <circle cx="580" cy="270" r="12" fill="var(--d-rv-b-border)" />
      <text x="580" y="274" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">C</text>
      <text x="560" y="292" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">Node C</text>

      <circle cx="480" cy="170" r="12" fill="var(--d-warn-border)" />
      <text x="480" y="174" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">D</text>
      <text x="456" y="166" text-anchor="end" font-size="8" fill="var(--d-warn-text)">Node D</text>

      <!-- Keys on ring -->
      <circle cx="620" cy="80" r="5" fill="var(--d-rv-c-border)" />
      <text x="636" y="84" font-size="7" fill="var(--d-rv-c-text)">k1→B</text>

      <circle cx="660" cy="240" r="5" fill="var(--d-rv-c-border)" />
      <text x="676" y="244" font-size="7" fill="var(--d-rv-c-text)">k2→C</text>

      <circle cx="510" cy="100" r="5" fill="var(--d-rv-c-border)" />
      <text x="496" y="96" text-anchor="end" font-size="7" fill="var(--d-rv-c-text)">k3→A</text>

      <!-- Clockwise arrow hint -->
      <text x="580" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">顺时针</text>
      <text x="580" y="183" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">找最近节点</text>

      <!-- Advantage note -->
      <rect x="310" y="76" width="200" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="410" y="96" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">节点增删时</text>
      <text x="410" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">只影响相邻区间 · 迁移最小化</text>

      <!-- Virtual nodes -->
      <rect x="30" y="180" width="250" height="100" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="155" y="202" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-blue)">虚拟节点解决数据倾斜</text>

      <text x="155" y="224" text-anchor="middle" font-size="9" fill="var(--d-text)">物理节点少 → 分布不均</text>
      <text x="155" y="242" text-anchor="middle" font-size="9" fill="var(--d-text)">每个物理节点映射 100~200 个</text>
      <text x="155" y="258" text-anchor="middle" font-size="9" fill="var(--d-text)">虚拟节点到环上</text>
      <text x="155" y="274" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">数据分布更均匀</text>

      <!-- Applications -->
      <text x="430" y="316" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">实际应用</text>

      <rect x="30" y="330" width="190" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="125" y="348" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Redis Cluster</text>
      <text x="125" y="362" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">16384 固定槽位</text>

      <rect x="240" y="330" width="190" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="335" y="348" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Nginx 负载均衡</text>
      <text x="335" y="362" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">consistent_hash</text>

      <rect x="450" y="330" width="190" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="545" y="348" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">分库分表路由</text>
      <text x="545" y="362" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">分片键 → 槽位 → 物理库</text>

      <rect x="660" y="330" width="190" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="755" y="348" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Memcached</text>
      <text x="755" y="362" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">客户端一致性哈希</text>
    </svg>
  </DiagramFrame>
</template>
