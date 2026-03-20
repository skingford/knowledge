<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind = 'worker-pool' | 'fan-in-advanced'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'worker-pool': '580px',
  'fan-in-advanced': '560px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'worker-pool'" viewBox="0 0 580 180" xmlns="http://www.w3.org/2000/svg">
      <text x="290" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Worker Pool 架构</text>
      <!-- Submit -->
      <rect x="10" y="56" width="80" height="36" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
      <text x="50" y="70" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-c-text)">Submit()</text>
      <text x="50" y="82" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">提交任务</text>
      <line x1="90" y1="74" x2="118" y2="74" stroke="var(--d-rv-c-border)" stroke-width="1.5" marker-end="url(#aWP)"/>
      <!-- Task Channel -->
      <rect x="122" y="38" width="100" height="72" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="172" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">Task Chan</text>
      <rect x="132" y="68" width="26" height="16" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8"/>
      <text x="145" y="80" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">T1</text>
      <rect x="160" y="68" width="26" height="16" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8"/>
      <text x="173" y="80" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">T2</text>
      <rect x="188" y="68" width="26" height="16" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8"/>
      <text x="201" y="80" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">T3</text>
      <text x="172" y="102" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">带缓冲</text>
      <!-- Arrows to workers -->
      <line x1="222" y1="58" x2="268" y2="44" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aWPb)"/>
      <line x1="222" y1="74" x2="268" y2="74" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aWPb)"/>
      <line x1="222" y1="90" x2="268" y2="104" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aWPb)"/>
      <!-- Workers -->
      <rect x="272" y="28" width="90" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="317" y="47" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Worker 1</text>
      <rect x="272" y="62" width="90" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="317" y="81" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Worker 2</text>
      <rect x="272" y="96" width="90" height="28" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="317" y="115" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Worker N</text>
      <text x="317" y="140" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">固定数量</text>
      <!-- Arrows to result -->
      <line x1="362" y1="42" x2="408" y2="58" stroke="var(--d-rv-a-border)" stroke-width="1.2" marker-end="url(#aWPg)"/>
      <line x1="362" y1="76" x2="408" y2="74" stroke="var(--d-rv-a-border)" stroke-width="1.2" marker-end="url(#aWPg)"/>
      <line x1="362" y1="110" x2="408" y2="90" stroke="var(--d-rv-a-border)" stroke-width="1.2" marker-end="url(#aWPg)"/>
      <!-- Result Channel -->
      <rect x="412" y="38" width="100" height="72" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="462" y="58" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">Result Chan</text>
      <rect x="422" y="68" width="26" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
      <text x="435" y="80" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">R1</text>
      <rect x="450" y="68" width="26" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
      <text x="463" y="80" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">R2</text>
      <rect x="478" y="68" width="26" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8"/>
      <text x="491" y="80" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">R3</text>
      <!-- Collect -->
      <line x1="512" y1="74" x2="528" y2="74" stroke="var(--d-rv-a-border)" stroke-width="1.5" marker-end="url(#aWPg)"/>
      <rect x="532" y="56" width="40" height="36" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2"/>
      <text x="552" y="72" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--d-rv-b-text)">收集</text>
      <text x="552" y="84" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">结果</text>
      <!-- Note -->
      <rect x="120" y="152" width="340" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="290" y="167" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Task Chan 满时 Submit 阻塞 → 天然背压（backpressure）</text>
      <defs>
        <marker id="aWP" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-c-border)"/></marker>
        <marker id="aWPb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/></marker>
        <marker id="aWPg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)"/></marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'fan-in-advanced'" viewBox="0 0 560 210" xmlns="http://www.w3.org/2000/svg">
      <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Fan-Out / Fan-In 进阶模式</text>
      <!-- Source -->
      <rect x="10" y="72" width="80" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5"/>
      <text x="50" y="97" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">Source</text>
      <!-- Fan-out label -->
      <text x="130" y="42" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-orange)">Fan-Out</text>
      <!-- Fan-out arrows -->
      <line x1="90" y1="82" x2="158" y2="52" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFI)"/>
      <line x1="90" y1="92" x2="158" y2="92" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFI)"/>
      <line x1="90" y1="102" x2="158" y2="132" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFI)"/>
      <!-- Workers -->
      <rect x="162" y="34" width="100" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
      <text x="212" y="54" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 1 (快)</text>
      <rect x="162" y="76" width="100" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
      <text x="212" y="96" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 2</text>
      <rect x="162" y="118" width="100" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="212" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Worker 3 (慢)</text>
      <!-- Per-worker channels -->
      <line x1="262" y1="49" x2="310" y2="49" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aFIb)"/>
      <text x="286" y="42" font-size="7" fill="var(--d-blue)">ch1</text>
      <line x1="262" y1="91" x2="310" y2="91" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aFIb)"/>
      <text x="286" y="84" font-size="7" fill="var(--d-blue)">ch2</text>
      <line x1="262" y1="133" x2="310" y2="133" stroke="var(--d-blue-border)" stroke-width="1.2" marker-end="url(#aFIb)"/>
      <text x="286" y="126" font-size="7" fill="var(--d-blue)">ch3</text>
      <!-- Fan-In merge -->
      <rect x="314" y="46" width="100" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="364" y="82" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-blue)">Fan-In</text>
      <text x="364" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">select 合并</text>
      <text x="364" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">多路 Channel</text>
      <!-- Output -->
      <line x1="414" y1="92" x2="448" y2="92" stroke="var(--d-rv-a-border)" stroke-width="2" marker-end="url(#aFIg)"/>
      <rect x="452" y="72" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5"/>
      <text x="497" y="88" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-a-text)">merged</text>
      <text x="497" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">output</text>
      <!-- Backpressure note -->
      <rect x="80" y="170" width="400" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="280" y="184" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">背压机制: 无缓冲 channel → 慢 worker 自动减速，不影响快 worker</text>
      <text x="280" y="195" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">1 → N → 1: 分发工作，合并结果</text>
      <defs>
        <marker id="aFI" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
        <marker id="aFIb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/></marker>
        <marker id="aFIg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)"/></marker>
      </defs>
    </svg>
  </DiagramFrame>
</template>
