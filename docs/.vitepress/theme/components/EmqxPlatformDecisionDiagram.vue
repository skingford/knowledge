<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="920px">
    <svg
      viewBox="0 0 880 500"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="自研网关与 EMQX 平台选型对比图"
      role="img"
    >
      <defs>
        <marker id="emqx-decision-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="440" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        选型核心不是谁更“先进”，而是谁更匹配你的团队能力、交付速度和扩展方式
      </text>

      <rect x="24" y="52" width="300" height="372" rx="22" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" stroke-width="1.8" />
      <rect x="72" y="68" width="204" height="32" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="174" y="89" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">自研网关（Go + epoll）</text>

      <rect x="48" y="120" width="252" height="56" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="174" y="143" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">适合团队画像</text>
      <text x="174" y="160" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">网络编程强、协议定制重、愿意长期打磨底层</text>

      <rect x="48" y="188" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="174" y="211" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">优势</text>
      <text x="174" y="228" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">性能上限高、内存可极致压缩、协议与链路完全可控</text>
      <text x="174" y="244" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">适合热点路径深度优化</text>

      <rect x="48" y="264" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="174" y="287" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">代价</text>
      <text x="174" y="304" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">MQTT 协议栈、QoS、Will、Retain、桥接能力都要自建</text>
      <text x="174" y="320" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">开发与验收周期更长</text>

      <rect x="48" y="340" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="174" y="363" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">典型结论</text>
      <text x="174" y="380" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">当业务差异化来自连接层本身，或你必须掌控每个细节时</text>
      <text x="174" y="396" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">自研更值</text>

      <rect x="556" y="52" width="300" height="372" rx="22" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-a-border)" stroke-width="1.8" />
      <rect x="604" y="68" width="204" height="32" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="706" y="89" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">EMQX 平台（Go + EMQX）</text>

      <rect x="580" y="120" width="252" height="56" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="706" y="143" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">适合团队画像</text>
      <text x="706" y="160" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">业务开发强、希望先快速上线、需要标准 MQTT 能力</text>

      <rect x="580" y="188" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="706" y="211" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">优势</text>
      <text x="706" y="228" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">协议完整、Connector 丰富、集群与规则引擎开箱即用</text>
      <text x="706" y="244" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">更快形成业务闭环</text>

      <rect x="580" y="264" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="706" y="287" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">代价</text>
      <text x="706" y="304" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">需要学习 Erlang/OTP 运维、License 边界和插件扩展方式</text>
      <text x="706" y="320" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">连接层可控性弱于自研</text>

      <rect x="580" y="340" width="252" height="64" rx="16" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="706" y="363" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">典型结论</text>
      <text x="706" y="380" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">当业务差异化主要在应用层、数据集成与交付速度时</text>
      <text x="706" y="396" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">EMQX 更划算</text>

      <line x1="324" y1="156" x2="556" y2="156" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#emqx-decision-arrow)" />
      <line x1="324" y1="220" x2="556" y2="220" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#emqx-decision-arrow)" />
      <line x1="324" y1="296" x2="556" y2="296" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#emqx-decision-arrow)" />
      <line x1="324" y1="372" x2="556" y2="372" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#emqx-decision-arrow)" />

      <rect x="344" y="104" width="192" height="268" rx="24" fill="var(--d-blue-light)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <text x="440" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">决策中轴</text>
      <text x="440" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">先问团队更擅长什么</text>
      <text x="440" y="192" text-anchor="middle" font-size="10" fill="var(--d-text)">再问 MVP 要多快落地</text>
      <text x="440" y="222" text-anchor="middle" font-size="10" fill="var(--d-text)">再问 MQTT 能力是否必须一次到位</text>
      <text x="440" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">再问是否要大量现成数据集成</text>
      <text x="440" y="282" text-anchor="middle" font-size="10" fill="var(--d-text)">最后再看连接层极限性能与长期控制权</text>
      <rect x="376" y="306" width="128" height="42" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="440" y="323" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-text)">判断原则</text>
      <text x="440" y="339" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">连接层差异化强 → 自研</text>
      <text x="440" y="352" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">业务闭环优先 → EMQX</text>

      <rect x="166" y="442" width="548" height="36" rx="18" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.2" />
      <text x="440" y="465" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-engine-text)">
        实战建议：先用 EMQX 验证业务，再把真正的性能热点或协议差异化部分逐步替换为自研组件
      </text>
    </svg>
  </DiagramFrame>
</template>
