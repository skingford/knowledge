<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 400"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="数据库优化：读写分离与分库分表"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc3-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">数据库优化 · 读写分离与分库分表</text>

      <!-- Left: Read-write split -->
      <text x="210" y="58" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue)">读写分离</text>

      <rect x="140" y="70" width="140" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="210" y="91" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">应用服务</text>

      <!-- Write arrow -->
      <line x1="160" y1="102" x2="110" y2="132" stroke="var(--d-rv-c-border)" stroke-width="1.4" marker-end="url(#hc3-arr)" />
      <text x="118" y="118" font-size="8" fill="var(--d-rv-c-text)">写</text>

      <!-- Read arrows -->
      <line x1="260" y1="102" x2="280" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" marker-end="url(#hc3-arr)" />
      <text x="282" y="118" font-size="8" fill="var(--d-blue)">读</text>
      <line x1="240" y1="102" x2="350" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" marker-end="url(#hc3-arr)" />

      <!-- Master -->
      <rect x="50" y="136" width="120" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="110" y="159" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Master 主库</text>

      <!-- Slaves -->
      <rect x="220" y="136" width="110" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="275" y="159" text-anchor="middle" font-size="10" fill="var(--d-text)">Slave 从库-1</text>

      <rect x="340" y="136" width="110" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="395" y="159" text-anchor="middle" font-size="10" fill="var(--d-text)">Slave 从库-2</text>

      <!-- Replication arrows -->
      <line x1="170" y1="154" x2="220" y2="154" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#hc3-arr)" />
      <text x="195" y="148" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">复制</text>
      <line x1="170" y1="158" x2="340" y2="158" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,3" />

      <!-- Right: Sharding -->
      <text x="660" y="58" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-blue)">分库分表</text>

      <rect x="590" y="70" width="140" height="32" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="660" y="91" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">应用服务</text>

      <line x1="660" y1="102" x2="660" y2="125" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc3-arr)" />

      <!-- Sharding middleware -->
      <rect x="570" y="128" width="180" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="660" y="147" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">ShardingSphere / 分片路由</text>

      <!-- Sharded DBs -->
      <line x1="600" y1="156" x2="560" y2="180" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc3-arr)" />
      <line x1="660" y1="156" x2="660" y2="180" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc3-arr)" />
      <line x1="720" y1="156" x2="760" y2="180" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc3-arr)" />

      <rect x="500" y="183" width="100" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="550" y="200" text-anchor="middle" font-size="9" fill="var(--d-text)">DB_0</text>
      <text x="550" y="210" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">user_0~3</text>

      <rect x="610" y="183" width="100" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="660" y="200" text-anchor="middle" font-size="9" fill="var(--d-text)">DB_1</text>
      <text x="660" y="210" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">user_4~7</text>

      <rect x="720" y="183" width="100" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="770" y="200" text-anchor="middle" font-size="9" fill="var(--d-text)">DB_2</text>
      <text x="770" y="210" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">user_8~B</text>

      <!-- Middleware comparison -->
      <text x="430" y="256" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">中间件与 NewSQL 选型</text>

      <rect x="60" y="270" width="180" height="56" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="150" y="290" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">ShardingSphere-JDBC</text>
      <text x="150" y="304" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">客户端分片</text>
      <text x="150" y="318" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Java 生态 · 无代理开销</text>

      <rect x="260" y="270" width="180" height="56" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="350" y="290" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">ShardingSphere-Proxy</text>
      <text x="350" y="304" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">代理层分片</text>
      <text x="350" y="318" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">多语言 · DBA 友好</text>

      <rect x="460" y="270" width="180" height="56" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="550" y="290" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">TiDB</text>
      <text x="550" y="304" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">NewSQL · 兼容 MySQL</text>
      <text x="550" y="318" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">原生水平扩展</text>

      <rect x="660" y="270" width="180" height="56" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="750" y="290" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">CockroachDB</text>
      <text x="750" y="304" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">强一致分布式</text>
      <text x="750" y="318" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">兼容 PostgreSQL</text>

      <!-- Decision note -->
      <rect x="160" y="346" width="540" height="28" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="430" y="365" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">数据量 &lt; 5 亿行 → 分库分表中间件 | 更大规模 → TiDB 等 NewSQL</text>

      <!-- Bottom guideline -->
      <text x="430" y="396" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">单表建议控制在千万行以内 · 索引覆盖 · 避免回表 · 慢查询监控</text>
    </svg>
  </DiagramFrame>
</template>
