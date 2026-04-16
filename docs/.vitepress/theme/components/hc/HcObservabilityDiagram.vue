<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 380"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="可观测性三大支柱"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc16-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">可观测性 · 三大支柱与关联</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">出了问题不可怕，可怕的是找不到原因</text>

      <!-- Three pillars -->
      <!-- Metrics -->
      <rect x="30" y="60" width="250" height="160" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="90" y="68" width="130" height="24" rx="12" fill="var(--d-blue-border)" />
      <text x="155" y="85" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">Metrics 指标</text>

      <text x="155" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">量化系统状态</text>
      <text x="155" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">触发告警</text>

      <rect x="50" y="140" width="210" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="155" y="154" text-anchor="middle" font-size="9" fill="var(--d-text)">Prometheus + Grafana</text>

      <text x="155" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">RED 方法（面向服务）</text>
      <text x="155" y="196" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Rate · Errors · Duration</text>

      <text x="155" y="214" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">USE 方法（面向资源）</text>

      <!-- Tracing -->
      <rect x="305" y="60" width="250" height="160" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="365" y="68" width="130" height="24" rx="12" fill="var(--d-rv-a-border)" />
      <text x="430" y="85" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">Tracing 链路追踪</text>

      <text x="430" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">追踪请求在微服务间</text>
      <text x="430" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">的完整调用链</text>

      <rect x="325" y="140" width="210" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="430" y="154" text-anchor="middle" font-size="9" fill="var(--d-text)">SkyWalking / Zipkin / Jaeger</text>

      <text x="430" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">跨 10 个微服务</text>
      <text x="430" y="196" text-anchor="middle" font-size="9" fill="var(--d-text)">哪个环节慢了一目了然</text>

      <!-- Span visualization -->
      <rect x="330" y="204" width="60" height="10" rx="3" fill="var(--d-rv-a-border)" />
      <rect x="396" y="204" width="40" height="10" rx="3" fill="var(--d-blue-border)" />
      <rect x="442" y="204" width="80" height="10" rx="3" fill="var(--d-rv-c-border)" />

      <!-- Logging -->
      <rect x="580" y="60" width="250" height="160" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.6" />
      <rect x="640" y="68" width="130" height="24" rx="12" fill="var(--d-rv-b-border)" />
      <text x="705" y="85" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">Logging 日志</text>

      <text x="705" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">记录详细的</text>
      <text x="705" y="128" text-anchor="middle" font-size="10" fill="var(--d-text)">运行时信息</text>

      <rect x="600" y="140" width="210" height="20" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="705" y="154" text-anchor="middle" font-size="9" fill="var(--d-text)">ELK (ES + Logstash + Kibana)</text>

      <text x="705" y="180" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-b-text)">结构化日志</text>
      <text x="705" y="196" text-anchor="middle" font-size="9" fill="var(--d-text)">JSON 格式 + 字段索引</text>
      <text x="705" y="212" text-anchor="middle" font-size="9" fill="var(--d-text)">按 TraceId 聚合</text>

      <!-- TraceId correlation -->
      <rect x="200" y="234" width="460" height="32" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="255" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">TraceId 全链路透传 — 三者通过 TraceId 关联</text>

      <!-- Correlation arrows -->
      <line x1="155" y1="220" x2="310" y2="245" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="4,3" />
      <line x1="430" y1="220" x2="430" y2="234" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="4,3" />
      <line x1="705" y1="220" x2="550" y2="245" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="4,3" />

      <!-- Alert design -->
      <text x="430" y="290" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">告警分级</text>

      <rect x="80" y="304" width="200" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="180" y="322" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">P0 立即响应</text>
      <text x="180" y="338" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">核心服务不可用</text>

      <rect x="310" y="304" width="200" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="410" y="322" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">P1 15分钟内</text>
      <text x="410" y="338" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">性能严重下降</text>

      <rect x="540" y="304" width="200" height="40" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="640" y="322" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">P2 工作时间处理</text>
      <text x="640" y="338" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">非核心异常</text>

      <!-- Bottom -->
      <text x="430" y="370" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免告警疲劳：合理阈值 + 沉默期 · 告警必须可操作（收到后知道该做什么）</text>
    </svg>
  </DiagramFrame>
</template>
