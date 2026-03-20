<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind = 'mutex-vs-rwmutex' | 'primitive-decision-tree'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'mutex-vs-rwmutex': '600px',
  'primitive-decision-tree': '560px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'mutex-vs-rwmutex'" viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Mutex vs RWMutex 并发时间线</text>
      <!-- Mutex (left) -->
      <rect x="10" y="30" width="270" height="156" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="145" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">Mutex — 全部串行</text>
      <!-- Timeline bars -->
      <text x="20" y="76" font-size="9" fill="var(--d-text-muted)">G1</text>
      <rect x="50" y="64" width="70" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="85" y="77" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">Read</text>
      <text x="20" y="100" font-size="9" fill="var(--d-text-muted)">G2</text>
      <rect x="120" y="88" width="70" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="155" y="101" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">Read</text>
      <text x="20" y="124" font-size="9" fill="var(--d-text-muted)">G3</text>
      <rect x="190" y="112" width="70" height="18" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
      <text x="225" y="125" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">Write</text>
      <!-- Wait indicators -->
      <rect x="50" y="88" width="70" height="18" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8" opacity="0.6"/>
      <text x="85" y="101" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">等待…</text>
      <rect x="50" y="112" width="140" height="18" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8" opacity="0.6"/>
      <text x="120" y="125" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">等待…</text>
      <!-- Time arrow -->
      <line x1="50" y1="148" x2="260" y2="148" stroke="var(--d-text-muted)" stroke-width="1" marker-end="url(#aSYN)"/>
      <text x="155" y="164" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">时间 →  所有操作排队</text>
      <!-- RWMutex (right) -->
      <rect x="310" y="30" width="280" height="156" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="450" y="50" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">RWMutex — 多读并行</text>
      <text x="320" y="76" font-size="9" fill="var(--d-text-muted)">G1</text>
      <rect x="350" y="64" width="70" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="385" y="77" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">RLock</text>
      <text x="320" y="100" font-size="9" fill="var(--d-text-muted)">G2</text>
      <rect x="350" y="88" width="70" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1"/>
      <text x="385" y="101" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">RLock</text>
      <text x="320" y="124" font-size="9" fill="var(--d-text-muted)">G3</text>
      <rect x="420" y="112" width="70" height="18" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1"/>
      <text x="455" y="125" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">Lock(W)</text>
      <rect x="350" y="112" width="70" height="18" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8" opacity="0.6"/>
      <text x="385" y="125" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">等 R 释放</text>
      <!-- Parallel indicator -->
      <rect x="420" y="64" width="4" height="42" rx="2" fill="var(--d-green)"/>
      <text x="432" y="88" font-size="7" fill="var(--d-green)">并行</text>
      <line x1="350" y1="148" x2="560" y2="148" stroke="var(--d-text-muted)" stroke-width="1" marker-end="url(#aSYN)"/>
      <text x="455" y="164" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">时间 →  读可并行，写需独占</text>
      <defs>
        <marker id="aSYN" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)"/></marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'primitive-decision-tree'" viewBox="0 0 560 340" xmlns="http://www.w3.org/2000/svg">
      <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">同步原语选择决策树</text>
      <!-- Q: 需要保护共享状态? -->
      <rect x="170" y="30" width="180" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="49" text-anchor="middle" font-size="10" fill="var(--d-text)">需要保护共享状态?</text>
      <!-- No -->
      <line x1="350" y1="44" x2="430" y2="44" stroke="var(--d-text-muted)" stroke-width="1.2" marker-end="url(#aDT)"/>
      <text x="386" y="38" font-size="8" fill="var(--d-text-muted)">No</text>
      <rect x="434" y="32" width="80" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="474" y="49" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">无需同步</text>
      <!-- Yes -->
      <line x1="260" y1="58" x2="260" y2="74" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="272" y="68" font-size="8" fill="var(--d-green)">Yes</text>
      <!-- Q: 多字段一致性? -->
      <rect x="160" y="76" width="200" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="95" text-anchor="middle" font-size="10" fill="var(--d-text)">多字段需一致性更新?</text>
      <line x1="360" y1="90" x2="410" y2="90" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="380" y="84" font-size="8" fill="var(--d-green)">Yes</text>
      <rect x="414" y="78" width="120" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="474" y="95" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-a-text)">Mutex / RWMutex</text>
      <!-- No -->
      <line x1="260" y1="104" x2="260" y2="120" stroke="var(--d-text-muted)" stroke-width="1.2" marker-end="url(#aDT)"/>
      <!-- Q: 简单计数器? -->
      <rect x="160" y="122" width="200" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="141" text-anchor="middle" font-size="10" fill="var(--d-text)">简单计数器或标志位?</text>
      <line x1="360" y1="136" x2="410" y2="136" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="380" y="130" font-size="8" fill="var(--d-green)">Yes</text>
      <rect x="414" y="124" width="120" height="24" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
      <text x="474" y="141" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-cur-text)">sync/atomic</text>
      <line x1="260" y1="150" x2="260" y2="166" stroke="var(--d-text-muted)" stroke-width="1.2" marker-end="url(#aDT)"/>
      <!-- Q: 读多写少 key 稳定? -->
      <rect x="140" y="168" width="240" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="187" text-anchor="middle" font-size="10" fill="var(--d-text)">读多写少、key 集合稳定?</text>
      <line x1="380" y1="182" x2="410" y2="182" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="392" y="176" font-size="8" fill="var(--d-green)">Yes</text>
      <rect x="414" y="170" width="120" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2"/>
      <text x="474" y="187" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-b-text)">sync.Map</text>
      <line x1="260" y1="196" x2="260" y2="212" stroke="var(--d-text-muted)" stroke-width="1.2" marker-end="url(#aDT)"/>
      <!-- Q: goroutine 间传数据? -->
      <rect x="130" y="214" width="260" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="233" text-anchor="middle" font-size="10" fill="var(--d-text)">需要在 Goroutine 间传递数据?</text>
      <line x1="390" y1="228" x2="410" y2="228" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="398" y="222" font-size="8" fill="var(--d-green)">Yes</text>
      <rect x="414" y="216" width="120" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="474" y="233" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-c-text)">Channel</text>
      <line x1="260" y1="242" x2="260" y2="258" stroke="var(--d-text-muted)" stroke-width="1.2" marker-end="url(#aDT)"/>
      <!-- Q: 读写比例 -->
      <rect x="170" y="260" width="180" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="260" y="279" text-anchor="middle" font-size="10" fill="var(--d-text)">读写比例?</text>
      <!-- 读远多于写 → RWMutex -->
      <line x1="170" y1="274" x2="80" y2="304" stroke="var(--d-green)" stroke-width="1.2" marker-end="url(#aDTg)"/>
      <text x="110" y="286" font-size="8" fill="var(--d-green)">读 >> 写</text>
      <rect x="20" y="306" width="120" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="80" y="323" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-a-text)">sync.RWMutex</text>
      <!-- 读写接近 → Mutex -->
      <line x1="350" y1="274" x2="440" y2="304" stroke="var(--d-orange)" stroke-width="1.2" marker-end="url(#aDTo)"/>
      <text x="406" y="286" font-size="8" fill="var(--d-orange)">读 ≈ 写</text>
      <rect x="400" y="306" width="120" height="24" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="460" y="323" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-a-text)">sync.Mutex</text>
      <defs>
        <marker id="aDT" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)"/></marker>
        <marker id="aDTg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/></marker>
        <marker id="aDTo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/></marker>
      </defs>
    </svg>
  </DiagramFrame>
</template>
