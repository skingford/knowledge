<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="配置中心与动态配置"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc26-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">配置中心 · 高并发系统的遥控器</text>

      <!-- Push flow -->
      <text x="430" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">配置推送流程</text>

      <rect x="40" y="70" width="140" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="110" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">运维 / 开发</text>
      <text x="110" y="102" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">修改配置</text>

      <line x1="180" y1="90" x2="220" y2="90" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc26-arr)" />

      <rect x="224" y="70" width="180" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <text x="314" y="88" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-a-text)">配置中心</text>
      <text x="314" y="102" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">Nacos / Apollo</text>

      <!-- Push to multiple instances -->
      <line x1="404" y1="82" x2="470" y2="72" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc26-arr)" />
      <line x1="404" y1="90" x2="470" y2="90" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc26-arr)" />
      <line x1="404" y1="98" x2="470" y2="108" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc26-arr)" />

      <text x="440" y="64" font-size="7" fill="var(--d-text-sub)">秒级推送</text>

      <rect x="474" y="60" width="120" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="534" y="76" text-anchor="middle" font-size="8" fill="var(--d-text)">实例 A-1</text>
      <rect x="474" y="78" width="120" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="534" y="94" text-anchor="middle" font-size="8" fill="var(--d-text)">实例 A-2</text>
      <rect x="474" y="96" width="120" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="534" y="112" text-anchor="middle" font-size="8" fill="var(--d-text)">实例 A-3</text>

      <line x1="594" y1="90" x2="640" y2="90" stroke="var(--d-green)" stroke-width="1.4" marker-end="url(#hc26-arr)" />
      <text x="617" y="82" text-anchor="middle" font-size="7" fill="var(--d-green)">即时生效</text>

      <rect x="644" y="76" width="180" height="28" rx="6" fill="var(--d-green)" />
      <text x="734" y="95" text-anchor="middle" font-size="9" font-weight="600" fill="#fff">限流阈值 / 降级开关 / 线程池</text>

      <!-- Dynamic use cases -->
      <text x="430" y="146" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">典型动态配置场景</text>

      <rect x="30" y="160" width="250" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="155" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">动态线程池</text>
      <text x="155" y="200" text-anchor="middle" font-size="8" fill="var(--d-text)">运行时调整 core/max/queue · 无需重启</text>

      <rect x="305" y="160" width="250" height="50" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="430" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">动态限流阈值</text>
      <text x="430" y="200" text-anchor="middle" font-size="8" fill="var(--d-text)">Sentinel 读取 Nacos 规则 · 秒级生效</text>

      <rect x="580" y="160" width="250" height="50" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="705" y="182" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">降级开关矩阵</text>
      <text x="705" y="200" text-anchor="middle" font-size="8" fill="var(--d-text)">大促预案一键切换 · 关闭非核心功能</text>

      <!-- Best practice -->
      <rect x="100" y="228" width="660" height="24" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="430" y="244" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">配置变更 ≈ 代码发布：必须有审批 · 灰度 · 回滚 · 操作日志</text>
    </svg>
  </DiagramFrame>
</template>
