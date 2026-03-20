<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind = 'double-m-switch' | 'reliability-first-switch' | 'crash-unavailable' | 'delay-angle' | 'three-node-loop'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'double-m-switch': '580px',
  'reliability-first-switch': '580px',
  'crash-unavailable': '580px',
  'delay-angle': '580px',
  'three-node-loop': '580px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'double-m-switch'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 200" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="ha1-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,4 L0,8z" fill="var(--d-blue)"/></marker>
      </defs>
      <text x="210" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图 1 — MySQL 主备切换流程（双 M 结构）</text>
      <!-- Client -->
      <rect x="160" y="44" width="100" height="36" rx="6" fill="var(--d-client-bg)" stroke="var(--d-client-border)"/>
      <text x="210" y="67" text-anchor="middle" font-size="12" fill="var(--d-client-text)">Client</text>
      <!-- Node A -->
      <rect x="50" y="120" width="120" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2"/>
      <text x="110" y="150" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">节点 A</text>
      <!-- Node B -->
      <rect x="250" y="120" width="120" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2"/>
      <text x="310" y="150" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">节点 B</text>
      <!-- Client -> A -->
      <line x1="190" y1="80" x2="130" y2="118" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#ha1-arrow)"/>
      <!-- Client -> B (dashed) -->
      <line x1="230" y1="80" x2="290" y2="118" stroke="var(--d-blue)" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#ha1-arrow)"/>
      <!-- A <-> B bidirectional -->
      <line x1="172" y1="138" x2="248" y2="138" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#ha1-arrow)"/>
      <line x1="248" y1="155" x2="172" y2="155" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#ha1-arrow)"/>
      <text x="210" y="133" text-anchor="middle" font-size="9" fill="var(--d-orange)">binlog</text>
      <text x="210" y="175" text-anchor="middle" font-size="9" fill="var(--d-orange)">binlog</text>
      <text x="155" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">读写</text>
      <text x="265" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">切换后</text>
    </svg>

    <svg
          v-else-if="kind === 'reliability-first-switch'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="ha2-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,4 L0,8z" fill="var(--d-blue)"/></marker>
      </defs>
      <text x="270" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图 2 — 可靠性优先主备切换流程</text>
      <!-- Step boxes -->
      <rect x="30" y="48" width="460" height="42" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)"/>
      <text x="50" y="73" font-size="12" fill="var(--d-blue)" font-weight="bold">Step 1</text>
      <text x="130" y="73" font-size="11" fill="var(--d-text)">判断 SBM &lt; 5s，否则持续重试</text>

      <line x1="260" y1="90" x2="260" y2="104" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#ha2-arrow)"/>

      <rect x="30" y="106" width="460" height="42" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)"/>
      <text x="50" y="131" font-size="12" fill="var(--d-engine-text)" font-weight="bold">Step 2</text>
      <text x="130" y="131" font-size="11" fill="var(--d-text)">主库 A 设置 readonly = true</text>

      <line x1="260" y1="148" x2="260" y2="162" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#ha2-arrow)"/>

      <rect x="30" y="164" width="460" height="42" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)"/>
      <text x="50" y="189" font-size="12" fill="var(--d-blue)" font-weight="bold">Step 3</text>
      <text x="130" y="189" font-size="11" fill="var(--d-text)">等待备库 B 的 SBM = 0</text>

      <line x1="260" y1="206" x2="260" y2="220" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#ha2-arrow)"/>

      <rect x="30" y="222" width="460" height="42" rx="6" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)"/>
      <text x="50" y="247" font-size="12" fill="var(--d-engine-text)" font-weight="bold">Step 4</text>
      <text x="130" y="247" font-size="11" fill="var(--d-text)">备库 B 设置 readonly = false</text>

      <line x1="260" y1="264" x2="260" y2="278" stroke="var(--d-blue)" stroke-width="1.5" marker-end="url(#ha2-arrow)"/>

      <rect x="30" y="280" width="460" height="42" rx="6" fill="var(--d-green)" stroke="var(--d-green)" fill-opacity="0.12"/>
      <text x="50" y="305" font-size="12" fill="var(--d-green)" font-weight="bold">Step 5</text>
      <text x="130" y="305" font-size="11" fill="var(--d-text)">业务请求切换到备库 B</text>

      <!-- Unavailable window annotation -->
      <rect x="500" y="106" width="4" height="168" rx="2" fill="var(--d-orange)"/>
      <text x="514" y="194" font-size="10" fill="var(--d-orange)" transform="rotate(90,514,194)">不可用时间</text>
    </svg>

    <svg
          v-else-if="kind === 'crash-unavailable'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 220" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <text x="240" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图 5 — 可靠性优先策略，主库不可用</text>
      <!-- Timeline -->
      <line x1="40" y1="60" x2="450" y2="60" stroke="var(--d-border)" stroke-width="1"/>
      <!-- Master A - crashed -->
      <rect x="40" y="80" width="120" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="2" stroke-dasharray="5,3"/>
      <text x="100" y="105" text-anchor="middle" font-size="12" fill="var(--d-orange)">主库 A 掉电</text>
      <line x1="100" y1="60" x2="100" y2="78" stroke="var(--d-orange)" stroke-width="1.5"/>
      <text x="100" y="55" text-anchor="middle" font-size="9" fill="var(--d-orange)">T</text>
      <!-- Unavailable window -->
      <rect x="160" y="44" width="200" height="32" rx="4" fill="var(--d-orange)" fill-opacity="0.12" stroke="var(--d-orange)" stroke-dasharray="4,2"/>
      <text x="260" y="65" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-orange)">系统完全不可用</text>
      <!-- Slave B applying -->
      <rect x="200" y="80" width="180" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)"/>
      <text x="290" y="105" text-anchor="middle" font-size="11" fill="var(--d-blue)">备库 B 应用 relay log</text>
      <!-- SBM = 0 -->
      <rect x="200" y="140" width="180" height="30" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)"/>
      <text x="290" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">等待 SBM = 0（最长 30 min）</text>
      <!-- Recovery -->
      <rect x="380" y="80" width="80" height="40" rx="6" fill="var(--d-green)" fill-opacity="0.15" stroke="var(--d-green)"/>
      <text x="420" y="105" text-anchor="middle" font-size="11" fill="var(--d-green)">切换完成</text>
      <line x1="360" y1="60" x2="360" y2="78" stroke="var(--d-green)" stroke-width="1.5"/>
      <text x="385" y="55" text-anchor="middle" font-size="9" fill="var(--d-green)">SBM=0</text>
      <!-- Note -->
      <text x="240" y="200" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">主库掉电后，系统处于完全不可用状态直到 SBM=0</text>
    </svg>

    <svg
          v-else-if="kind === 'delay-angle'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <text x="200" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图 6 — 备库延迟（45 度斜线）</text>
      <!-- Axes -->
      <line x1="60" y1="200" x2="370" y2="200" stroke="var(--d-text-sub)" stroke-width="1.5"/>
      <line x1="60" y1="200" x2="60" y2="40" stroke="var(--d-text-sub)" stroke-width="1.5"/>
      <!-- Axis labels -->
      <text x="215" y="225" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">时间</text>
      <text x="30" y="120" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" transform="rotate(-90,30,120)">SBM (seconds)</text>
      <!-- 45 degree line -->
      <line x1="80" y1="190" x2="320" y2="60" stroke="var(--d-orange)" stroke-width="2.5"/>
      <!-- Arrow tip -->
      <polygon points="324,56 316,56 320,46" fill="var(--d-orange)"/>
      <!-- Annotation -->
      <text x="230" y="100" font-size="11" fill="var(--d-orange)" font-weight="bold" transform="rotate(-45,230,100)">delay &uarr;</text>
      <!-- Grid hints -->
      <line x1="60" y1="150" x2="370" y2="150" stroke="var(--d-border-dash)" stroke-width="0.5" stroke-dasharray="4,4"/>
      <line x1="60" y1="100" x2="370" y2="100" stroke="var(--d-border-dash)" stroke-width="0.5" stroke-dasharray="4,4"/>
      <text x="55" y="154" text-anchor="end" font-size="9" fill="var(--d-text-dim)">n</text>
      <text x="55" y="104" text-anchor="end" font-size="9" fill="var(--d-text-dim)">2n</text>
    </svg>

    <svg
          v-else-if="kind === 'three-node-loop'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 280" style="max-width:580px;width:100%;height:auto;font-family:system-ui,sans-serif">
      <defs>
        <marker id="ha7-arrow" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,4 L0,8z" fill="var(--d-blue)"/></marker>
        <marker id="ha7-arrow-o" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,4 L0,8z" fill="var(--d-orange)"/></marker>
      </defs>
      <text x="210" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图 7 — 三节点循环复制</text>
      <!-- Node B (top) -->
      <rect x="150" y="50" width="120" height="50" rx="8" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="2"/>
      <text x="210" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-engine-text)">节点 B</text>
      <!-- Node A (bottom-left) -->
      <rect x="30" y="170" width="120" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2"/>
      <text x="90" y="200" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">节点 A</text>
      <!-- Node A' (bottom-right) -->
      <rect x="270" y="170" width="120" height="50" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2"/>
      <text x="330" y="200" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-blue)">节点 A'</text>
      <!-- B -> A -->
      <line x1="165" y1="100" x2="110" y2="168" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#ha7-arrow-o)"/>
      <text x="120" y="130" font-size="9" fill="var(--d-orange)">trx1 (server_id=B)</text>
      <!-- A <-> A' bidirectional -->
      <line x1="152" y1="188" x2="268" y2="188" stroke="var(--d-blue)" stroke-width="2" marker-end="url(#ha7-arrow)"/>
      <line x1="268" y1="204" x2="152" y2="204" stroke="var(--d-blue)" stroke-width="2" marker-end="url(#ha7-arrow)"/>
      <text x="210" y="183" text-anchor="middle" font-size="9" fill="var(--d-blue)">双 M 结构</text>
      <!-- Cycle annotation -->
      <text x="210" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">trx1 的 server_id=B，A 和 A' 都不会丢弃 &rarr; 循环复制</text>
    </svg>
  </DiagramFrame>
</template>
