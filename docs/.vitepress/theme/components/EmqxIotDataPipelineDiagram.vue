<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 840 440"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="IoT 数据上报链路图"
      role="img"
    >
      <defs>
        <marker id="iot-pipe-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="420" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        IoT 数据上报链路
      </text>

      <!-- IoT Device -->
      <rect x="40" y="50" width="160" height="56" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="120" y="74" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">IoT Device</text>
      <text x="120" y="92" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MQTT PUBLISH · QoS 1</text>

      <!-- Arrow: Device → EMQX -->
      <line x1="200" y1="78" x2="300" y2="78" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#iot-pipe-arrow)" />
      <text x="250" y="68" text-anchor="middle" font-size="8.5" fill="var(--d-text-muted)">device/{id}/telemetry</text>

      <!-- EMQX Rule Engine -->
      <rect x="310" y="42" width="220" height="200" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-engine-border)" stroke-width="1.6" />
      <text x="420" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-engine-text)">EMQX Rule Engine</text>

      <!-- SQL Box -->
      <rect x="326" y="82" width="188" height="60" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="420" y="100" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--d-text)">SQL Filter</text>
      <text x="420" y="116" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">SELECT device_id, temperature,</text>
      <text x="420" y="130" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">humidity, timestamp FROM "device/+/telemetry"</text>

      <!-- Action labels -->
      <text x="420" y="160" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">3 个 Action</text>

      <!-- Action 1 indicator -->
      <rect x="330" y="172" width="56" height="22" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="358" y="187" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Action 1</text>

      <!-- Action 2 indicator -->
      <rect x="392" y="172" width="56" height="22" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="420" y="187" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Action 2</text>

      <!-- Action 3 indicator -->
      <rect x="454" y="172" width="56" height="22" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="482" y="187" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Action 3</text>

      <!-- Arrow to Action 1: ClickHouse -->
      <line x1="358" y1="242" x2="180" y2="300" stroke="var(--d-blue-border)" stroke-width="1.4" marker-end="url(#iot-pipe-arrow)" />

      <!-- ClickHouse Sink -->
      <rect x="60" y="306" width="240" height="64" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="180" y="330" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">ClickHouse Sink</text>
      <text x="180" y="348" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">时序数据存储</text>
      <text x="180" y="362" text-anchor="middle" font-size="8.5" fill="var(--d-text-muted)">INSERT INTO device_telemetry(...)</text>

      <!-- Arrow to Action 2: Redis -->
      <line x1="420" y1="242" x2="420" y2="300" stroke="var(--d-rv-a-border)" stroke-width="1.4" marker-end="url(#iot-pipe-arrow)" />

      <!-- Redis Sink -->
      <rect x="320" y="306" width="200" height="64" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="420" y="330" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Redis Sink</text>
      <text x="420" y="348" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">设备最新状态缓存</text>
      <text x="420" y="362" text-anchor="middle" font-size="8.5" fill="var(--d-text-muted)">HSET device:{id}:latest ...</text>

      <!-- Arrow to Action 3: Kafka -->
      <line x1="482" y1="242" x2="660" y2="300" stroke="var(--d-warn-border)" stroke-width="1.4" marker-end="url(#iot-pipe-arrow)" />

      <!-- Kafka Sink (with WHERE condition) -->
      <rect x="560" y="306" width="240" height="64" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="680" y="330" text-anchor="middle" font-size="12" font-weight="600" fill="var(--d-text)">Kafka Sink（告警）</text>
      <text x="680" y="348" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WHERE temperature > 50</text>
      <text x="680" y="362" text-anchor="middle" font-size="8.5" fill="var(--d-text-muted)">→ topic: device-alerts</text>

      <!-- Payload example -->
      <rect x="40" y="394" width="280" height="36" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="180" y="416" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">
        payload: {"temp": 25.3, "humidity": 60, "ts": ...}
      </text>

      <!-- Bottom banner -->
      <rect x="360" y="394" width="440" height="36" rx="12" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1" />
      <text x="580" y="416" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-engine-text)">
        Rule Engine 原生 Connector · 无需编写 Go 代码即可完成数据分流
      </text>
    </svg>
  </DiagramFrame>
</template>
