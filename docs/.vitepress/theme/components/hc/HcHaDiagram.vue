<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 440"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="高可用架构"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc14-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">高可用架构 · 挂了怎么办，用户能不能无感</text>

      <!-- Availability levels -->
      <text x="430" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">可用性等级</text>

      <rect x="100" y="66" width="180" height="40" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="190" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">3 个 9 — 99.9%</text>
      <text x="190" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">年停机 8.76 小时</text>

      <rect x="310" y="66" width="180" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="400" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">4 个 9 — 99.99%</text>
      <text x="400" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">年停机 52.6 分钟</text>

      <rect x="520" y="66" width="200" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="620" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">5 个 9 — 99.999%</text>
      <text x="620" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">年停机 5.26 分钟</text>

      <!-- Service HA -->
      <rect x="30" y="122" width="390" height="130" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="130" y="130" width="190" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="225" y="145" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">服务层高可用</text>

      <rect x="50" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="105" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">无状态设计</text>
      <text x="105" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Session 外置</text>

      <rect x="172" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="227" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">健康检查</text>
      <text x="227" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">自动摘除故障节点</text>

      <rect x="294" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="349" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">优雅关机</text>
      <text x="349" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Graceful Shutdown</text>

      <text x="225" y="236" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">任意节点可被替换 · 停机前处理完存量请求</text>

      <!-- Data HA -->
      <rect x="440" y="122" width="390" height="130" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="540" y="130" width="190" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="635" y="145" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">数据层高可用</text>

      <rect x="460" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="515" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">MySQL</text>
      <text x="515" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">MHA / 半同步</text>

      <rect x="582" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="637" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Redis</text>
      <text x="637" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Sentinel / Cluster</text>

      <rect x="704" y="162" width="110" height="36" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="759" y="178" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Kafka</text>
      <text x="759" y="192" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">ISR 多副本</text>

      <text x="635" y="236" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">主从复制 · 自动故障切换 · 数据多副本</text>

      <!-- Multi-datacenter -->
      <text x="430" y="280" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">异地多活拓扑</text>

      <!-- DC A -->
      <rect x="60" y="294" width="300" height="80" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="210" y="314" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-blue)">机房 A（北京）</text>

      <rect x="80" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="120" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">App 集群</text>
      <rect x="170" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="210" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">DB 主</text>
      <rect x="260" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="300" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">Redis 主</text>

      <!-- DC B -->
      <rect x="500" y="294" width="300" height="80" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="650" y="314" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-a-text)">机房 B（上海）</text>

      <rect x="520" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="560" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">App 集群</text>
      <rect x="610" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="650" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">DB 从</text>
      <rect x="700" y="326" width="80" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="740" y="342" text-anchor="middle" font-size="8" fill="var(--d-text)">Redis 从</text>

      <!-- Sync arrows -->
      <line x1="360" y1="334" x2="500" y2="334" stroke="var(--d-warn-border)" stroke-width="1.4" stroke-dasharray="6,3" marker-end="url(#hc14-arr)" />
      <text x="430" y="328" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">异步同步</text>

      <!-- GSLB -->
      <rect x="360" y="292" width="140" height="24" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="430" y="308" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">DNS / GSLB 调度</text>

      <!-- Degrade section -->
      <rect x="100" y="392" width="660" height="34" rx="17" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="430" y="414" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">降级兜底：大促关闭非核心功能 · 缓存失效返回兜底数据 · 预案平台一键切换</text>
    </svg>
  </DiagramFrame>
</template>
