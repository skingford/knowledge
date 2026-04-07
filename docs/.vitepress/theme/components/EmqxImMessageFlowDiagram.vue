<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="920px">
    <svg
      viewBox="0 0 880 520"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IM 私聊消息流转图"
      role="img"
    >
      <defs>
        <marker id="im-flow-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="440" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        IM 私聊消息流转
      </text>

      <!-- Sender App -->
      <rect x="60" y="50" width="140" height="44" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="130" y="76" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Sender App</text>
      <text x="130" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">PUBLISH → im/{receiverId}/inbox</text>

      <!-- Arrow: Sender → EMQX -->
      <line x1="200" y1="72" x2="310" y2="72" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#im-flow-arrow)" />
      <text x="255" y="64" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MQTT</text>

      <!-- EMQX -->
      <rect x="320" y="44" width="160" height="56" rx="16" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.6" />
      <text x="400" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-engine-text)">EMQX</text>
      <text x="400" y="88" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消息路由 · QoS 保证</text>

      <!-- Branch 1: Receiver Online (right) -->
      <line x1="480" y1="62" x2="580" y2="62" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#im-flow-arrow)" />
      <rect x="590" y="42" width="220" height="44" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="700" y="62" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Receiver 在线 → 直接投递</text>
      <text x="700" y="78" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">QoS 1 保证至少一次</text>

      <!-- Branch 2: Rule Engine (down-right) -->
      <line x1="440" y1="100" x2="440" y2="152" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#im-flow-arrow)" />

      <!-- Rule Engine Box -->
      <rect x="300" y="158" width="280" height="110" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-engine-border)" stroke-width="1.4" />
      <text x="440" y="182" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-engine-text)">Rule Engine</text>
      <text x="440" y="200" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">SELECT * FROM "im/+/inbox"</text>

      <!-- Action 1: Kafka -->
      <rect x="316" y="214" width="120" height="36" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="376" y="230" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Kafka Sink</text>
      <text x="376" y="244" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">im-messages 持久化</text>

      <!-- Action 2: Redis -->
      <rect x="444" y="214" width="120" height="36" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="504" y="230" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Redis Sink</text>
      <text x="504" y="244" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">未读计数 HSET</text>

      <!-- Branch 3: ExHook (down-left) -->
      <line x1="360" y1="100" x2="180" y2="152" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#im-flow-arrow)" />

      <!-- ExHook Box -->
      <rect x="60" y="158" width="240" height="64" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="180" y="182" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">ExHook (gRPC)</text>
      <text x="180" y="200" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">on_message_publish</text>
      <text x="180" y="214" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">黑名单 · 敏感词过滤 → allow / deny</text>

      <!-- Offline Message Path -->
      <text x="440" y="310" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">
        离线消息处理
      </text>

      <!-- Kafka Consumer -->
      <rect x="160" y="330" width="180" height="48" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="250" y="352" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Kafka Consumer (Go)</text>
      <text x="250" y="368" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消费 im-messages topic</text>

      <!-- Arrow from Kafka Sink to Consumer -->
      <line x1="376" y1="250" x2="376" y2="290" stroke="var(--d-arrow)" stroke-width="1.2" stroke-dasharray="5,3" />
      <line x1="376" y1="290" x2="290" y2="330" stroke="var(--d-arrow)" stroke-width="1.2" stroke-dasharray="5,3" marker-end="url(#im-flow-arrow)" />

      <!-- Branch: Write to DB -->
      <line x1="250" y1="378" x2="160" y2="420" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#im-flow-arrow)" />
      <rect x="60" y="420" width="200" height="44" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="160" y="440" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">MySQL / PostgreSQL</text>
      <text x="160" y="456" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消息持久化</text>

      <!-- Branch: Check offline → Push -->
      <line x1="250" y1="378" x2="250" y2="420" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#im-flow-arrow)" />
      <rect x="280" y="420" width="120" height="44" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="340" y="440" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">检查在线状态</text>
      <text x="340" y="456" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Receiver 是否离线?</text>

      <line x1="400" y1="442" x2="480" y2="442" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#im-flow-arrow)" />
      <text x="440" y="434" text-anchor="middle" font-size="8.5" fill="var(--d-text-muted)">离线</text>

      <!-- Push Service -->
      <rect x="490" y="420" width="200" height="44" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="590" y="440" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">APNs / FCM 推送</text>
      <text x="590" y="456" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">离线消息推送通知</text>

      <!-- Bottom label -->
      <rect x="240" y="484" width="400" height="28" rx="14" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1" />
      <text x="440" y="502" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-engine-text)">
        EMQX 负责在线投递 · Go 负责离线消息和推送闭环
      </text>
    </svg>
  </DiagramFrame>
</template>
