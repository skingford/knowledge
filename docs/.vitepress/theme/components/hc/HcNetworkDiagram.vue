<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="网络层优化"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc23-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">网络层优化 · 连接策略与协议选型</text>

      <!-- Connection strategies -->
      <text x="215" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">连接策略</text>

      <rect x="30" y="68" width="90" height="60" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="75" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">短连接</text>
      <text x="75" y="104" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">每次新建</text>
      <text x="75" y="118" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">低频调用</text>

      <line x1="120" y1="98" x2="140" y2="98" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc23-arr)" />

      <rect x="144" y="68" width="90" height="60" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="189" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">Keep-Alive</text>
      <text x="189" y="104" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">连接复用</text>
      <text x="189" y="118" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">减少握手</text>

      <line x1="234" y1="98" x2="254" y2="98" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc23-arr)" />

      <rect x="258" y="68" width="90" height="60" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="303" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">连接池</text>
      <text x="303" y="104" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">预建 + 复用</text>
      <text x="303" y="118" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">DB / Redis</text>

      <line x1="348" y1="98" x2="368" y2="98" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc23-arr)" />

      <rect x="372" y="68" width="90" height="60" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="417" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">多路复用</text>
      <text x="417" y="104" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">单连接并发</text>
      <text x="417" y="118" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">HTTP/2 · gRPC</text>

      <!-- Protocol selection -->
      <text x="680" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">协议选型</text>

      <rect x="510" y="68" width="150" height="48" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="585" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">HTTP/1.1 + JSON</text>
      <text x="585" y="106" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">对外 API · 兼容优先</text>

      <rect x="680" y="68" width="150" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="755" y="88" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">gRPC + Protobuf</text>
      <text x="755" y="106" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">内部通信首选 · 高性能</text>

      <!-- Serialization performance -->
      <rect x="30" y="146" width="400" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="230" y="168" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">序列化性能差异（同一对象）</text>

      <text x="100" y="186" font-size="9" fill="var(--d-text)">JSON</text>
      <text x="150" y="186" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">~500ns</text>
      <text x="220" y="186" font-size="9" fill="var(--d-text)">Protobuf</text>
      <text x="280" y="186" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">~100ns</text>
      <text x="330" y="186" font-size="9" fill="var(--d-text)">Kryo</text>
      <text x="370" y="186" font-size="9" font-weight="600" fill="var(--d-green)">~80ns</text>

      <!-- TCP tuning -->
      <rect x="450" y="146" width="380" height="48" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="640" y="166" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">关键网络参数</text>
      <text x="640" y="186" text-anchor="middle" font-size="8" fill="var(--d-text)">TCP_NODELAY · SO_REUSEPORT · somaxconn=65535 · 缓冲区调优</text>

      <!-- CDN -->
      <rect x="140" y="212" width="580" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="430" y="230" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">CDN + 边缘计算</text>
      <text x="430" y="244" text-anchor="middle" font-size="8" fill="var(--d-text)">静态资源走 CDN · 参数校验下沉到边缘节点（Cloudflare Workers）</text>
    </svg>
  </DiagramFrame>
</template>
