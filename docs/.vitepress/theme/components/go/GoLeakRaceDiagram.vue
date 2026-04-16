<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind = 'leak-scenarios' | 'data-race' | 'map-concurrent-write'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'leak-scenarios': '620px',
  'data-race': '520px',
  'map-concurrent-write': '620px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'leak-scenarios'"
      viewBox="0 0 620 190"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="三种常见 Goroutine 泄漏场景图"
      role="img"
    >
      <text x="310" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">三种常见 Goroutine 泄漏场景</text>
      <rect x="10" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="105" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景一 · 发送阻塞</text>
      <rect x="30" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="70" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ch &lt;- data</text>
      <rect x="120" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="150" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无接收者</text>
      <text x="150" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">永远阻塞</text>
      <rect x="22" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="106" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: select + ctx.Done()</text>
      <text x="106" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或确保有接收者</text>
      <text x="106" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>

      <rect x="215" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="310" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景二 · 接收阻塞</text>
      <rect x="235" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="275" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">&lt;- ch</text>
      <rect x="325" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="355" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无发送者</text>
      <text x="355" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">永远阻塞</text>
      <rect x="227" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="311" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: 确保 close(ch)</text>
      <text x="311" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或用 ctx 超时控制</text>
      <text x="311" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>

      <rect x="420" y="32" width="190" height="140" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="515" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">场景三 · 死循环</text>
      <rect x="440" y="62" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="480" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">for { ... }</text>
      <rect x="530" y="62" width="60" height="30" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="560" y="76" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">无退出</text>
      <text x="560" y="87" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">条件</text>
      <rect x="432" y="102" width="168" height="28" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="516" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">修复: select + done Chan</text>
      <text x="516" y="126" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">或 ctx 取消信号</text>
      <text x="516" y="155" text-anchor="middle" font-size="18" fill="var(--d-rv-c-border)">⚠</text>
    </svg>

    <svg
      v-else-if="kind === 'data-race'"
      viewBox="0 0 520 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Data Race 两个 Goroutine 竞争 counter 图"
      role="img"
    >
      <text x="260" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Data Race: 两个 Goroutine 竞争 counter</text>
      <rect x="200" y="32" width="120" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="260" y="51" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">counter = 0</text>
      <text x="20" y="82" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">G1</text>
      <line x1="50" y1="78" x2="470" y2="78" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="20" y="122" font-size="10" font-weight="bold" fill="var(--d-rv-b-text)">G2</text>
      <line x1="50" y1="118" x2="470" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <line x1="50" y1="150" x2="470" y2="150" stroke="var(--d-text-muted)" stroke-width="1" marker-end="url(#aDR)" />
      <text x="480" y="154" font-size="8" fill="var(--d-text-muted)">时间</text>
      <rect x="70" y="64" width="70" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="105" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">read: 0</text>
      <rect x="110" y="106" width="70" height="22" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="145" y="121" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">read: 0</text>
      <rect x="160" y="64" width="70" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="195" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">0 + 1 = 1</text>
      <rect x="200" y="106" width="70" height="22" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="235" y="121" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)">0 + 1 = 1</text>
      <rect x="260" y="64" width="80" height="22" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="300" y="79" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">write: 1</text>
      <rect x="310" y="106" width="80" height="22" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="350" y="121" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">write: 1 !</text>
      <rect x="420" y="82" width="80" height="28" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="460" y="100" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-c-text)">counter=1</text>
      <text x="260" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">预期: counter = 2，实际: counter = 1（丢失更新）</text>
      <rect x="110" y="190" width="300" height="22" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="260" y="205" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">修复: Mutex 保护 或 atomic.AddInt64</text>
      <defs>
        <marker id="aDR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-muted)" /></marker>
      </defs>
    </svg>

    <svg
      v-else
      viewBox="0 0 620 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="并发 map 写入 panic 图"
      role="img"
    >
      <text x="310" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">普通 map 并发写不是“结果不对”，而是 runtime 可能直接 panic</text>
      <rect x="20" y="34" width="580" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="256" y="60" width="108" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="310" y="85" text-anchor="middle" font-size="10" fill="var(--d-text)">map[int]int</text>
      <rect x="70" y="124" width="130" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="135" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">G1: m[1] = 1</text>
      <rect x="420" y="124" width="130" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="485" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">G2: m[2] = 2</text>
      <line x1="200" y1="144" x2="256" y2="102" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="420" y1="144" x2="364" y2="102" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="220" y="176" width="180" height="20" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="310" y="190" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">fatal error: concurrent map writes</text>
    </svg>
  </DiagramFrame>
</template>
