<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind = 'buffered-vs-unbuffered' | 'pipeline' | 'fan-in-out' | 'context-tree'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'buffered-vs-unbuffered': '620px',
  pipeline: '560px',
  'fan-in-out': '580px',
  'context-tree': '500px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'buffered-vs-unbuffered'"
      viewBox="0 0 620 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="无缓冲与有缓冲 Channel 对比图"
      role="img"
    >
      <text x="310" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">无缓冲 vs 有缓冲 Channel</text>
      <rect x="10" y="34" width="280" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="150" y="54" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">无缓冲 · 同步</text>
      <rect x="30" y="68" width="80" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="70" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sender</text>
      <rect x="190" y="68" width="80" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="230" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Receiver</text>
      <line x1="110" y1="78" x2="188" y2="78" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#aCH1)" />
      <text x="150" y="72" text-anchor="middle" font-size="8" fill="var(--d-orange)">data</text>
      <line x1="188" y1="92" x2="110" y2="92" stroke="var(--d-rv-a-border)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#aCH1g)" />
      <text x="150" y="108" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">同步确认</text>
      <line x1="70" y1="118" x2="70" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="230" y1="118" x2="230" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <rect x="38" y="126" width="64" height="18" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8" />
      <text x="70" y="139" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">send 阻塞…</text>
      <rect x="198" y="148" width="64" height="18" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8" />
      <text x="230" y="161" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">recv 就绪</text>
      <line x1="102" y1="158" x2="196" y2="158" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#aCH1gr)" />
      <text x="150" y="176" text-anchor="middle" font-size="8" fill="var(--d-green)">双方同时就绪才完成</text>

      <rect x="320" y="34" width="290" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="465" y="54" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">有缓冲 · 异步</text>
      <rect x="336" y="68" width="68" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="370" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Sender</text>
      <rect x="422" y="64" width="90" height="38" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="467" y="78" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-blue)">buf</text>
      <rect x="428" y="86" width="22" height="12" rx="2" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8" />
      <text x="439" y="96" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">d1</text>
      <rect x="452" y="86" width="22" height="12" rx="2" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="0.8" />
      <text x="463" y="96" text-anchor="middle" font-size="7" fill="var(--d-cur-text)">d2</text>
      <rect x="476" y="86" width="22" height="12" rx="2" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8" />
      <text x="487" y="96" text-anchor="middle" font-size="7" fill="var(--d-text-muted)">—</text>
      <rect x="530" y="68" width="68" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="564" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Receiver</text>
      <line x1="404" y1="83" x2="420" y2="83" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCH1)" />
      <line x1="512" y1="83" x2="528" y2="83" stroke="var(--d-rv-a-border)" stroke-width="1.5" marker-end="url(#aCH1g)" />
      <line x1="370" y1="118" x2="370" y2="186" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <line x1="564" y1="118" x2="564" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <rect x="338" y="124" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8" />
      <text x="370" y="136" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">send d1 ✓</text>
      <rect x="338" y="142" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8" />
      <text x="370" y="154" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">send d2 ✓</text>
      <rect x="338" y="160" width="64" height="16" rx="3" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="0.8" />
      <text x="370" y="172" text-anchor="middle" font-size="7" fill="var(--d-warn-text)">send d3 阻塞</text>
      <rect x="532" y="152" width="64" height="16" rx="3" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="0.8" />
      <text x="564" y="164" text-anchor="middle" font-size="7" fill="var(--d-rv-a-text)">recv d1</text>
      <text x="465" y="198" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">buf 未满时发送不阻塞</text>
      <defs>
        <marker id="aCH1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)" /></marker>
        <marker id="aCH1g" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)" /></marker>
        <marker id="aCH1gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)" /></marker>
      </defs>
    </svg>

    <svg
      v-else-if="kind === 'pipeline'"
      viewBox="0 0 560 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pipeline 流水线模式图"
      role="img"
    >
      <text x="280" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Pipeline 流水线模式</text>
      <rect x="20" y="34" width="130" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="85" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">generator()</text>
      <text x="85" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">2, 3, 4, 5</text>
      <line x1="150" y1="58" x2="200" y2="58" stroke="var(--d-blue-border)" stroke-width="2" marker-end="url(#aPL)" />
      <text x="175" y="50" text-anchor="middle" font-size="8" fill="var(--d-blue)">ch1</text>
      <rect x="205" y="34" width="130" height="48" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5" />
      <text x="270" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">square()</text>
      <text x="270" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">n × n</text>
      <line x1="335" y1="58" x2="385" y2="58" stroke="var(--d-blue-border)" stroke-width="2" marker-end="url(#aPL)" />
      <text x="360" y="50" text-anchor="middle" font-size="8" fill="var(--d-blue)">ch2</text>
      <rect x="390" y="34" width="150" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="465" y="54" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">main Println</text>
      <text x="465" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">4, 9, 16, 25</text>
      <text x="280" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">每个阶段一个 goroutine，通过 Channel 连接</text>
      <defs>
        <marker id="aPL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" /></marker>
      </defs>
    </svg>

    <svg
      v-else-if="kind === 'fan-in-out'"
      viewBox="0 0 580 180"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Fan-out 与 Fan-in 模式图"
      role="img"
    >
      <text x="290" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Fan-out / Fan-in 模式</text>
      <rect x="20" y="62" width="90" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="65" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">数据源</text>
      <line x1="110" y1="72" x2="168" y2="52" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)" />
      <line x1="110" y1="82" x2="168" y2="82" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)" />
      <line x1="110" y1="92" x2="168" y2="112" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aFO)" />
      <text x="140" y="44" font-size="8" fill="var(--d-orange)">fan-out</text>
      <rect x="172" y="34" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" />
      <text x="217" y="54" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 1</text>
      <rect x="172" y="70" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" />
      <text x="217" y="90" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 2</text>
      <rect x="172" y="106" width="90" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" />
      <text x="217" y="126" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Worker 3</text>
      <line x1="262" y1="49" x2="320" y2="72" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)" />
      <line x1="262" y1="85" x2="320" y2="82" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)" />
      <line x1="262" y1="121" x2="320" y2="92" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#aFOb)" />
      <text x="292" y="62" font-size="8" fill="var(--d-blue)">ch</text>
      <rect x="324" y="58" width="110" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="379" y="78" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">Fan-in</text>
      <text x="379" y="96" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">合并 Channel</text>
      <line x1="434" y1="82" x2="464" y2="82" stroke="var(--d-rv-a-border)" stroke-width="1.5" marker-end="url(#aFOg)" />
      <rect x="468" y="62" width="90" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="513" y="87" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">消费者</text>
      <text x="290" y="165" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">1 → N → 1：分发工作，合并结果</text>
      <defs>
        <marker id="aFO" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)" /></marker>
        <marker id="aFOb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" /></marker>
        <marker id="aFOg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)" /></marker>
      </defs>
    </svg>

    <svg
      v-else
      viewBox="0 0 500 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Context 取消传播树图"
      role="img"
    >
      <text x="250" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Context 取消传播树</text>
      <rect x="170" y="32" width="160" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="250" y="52" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">context.Background()</text>
      <line x1="250" y1="62" x2="250" y2="78" stroke="var(--d-text-sub)" stroke-width="1.2" marker-end="url(#aCTX)" />
      <rect x="155" y="80" width="190" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="250" y="96" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">WithTimeout · 5s</text>
      <text x="250" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">main</text>
      <line x1="250" y1="114" x2="250" y2="130" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCTXo)" />
      <text x="295" y="126" font-size="8" fill="var(--d-orange)">取消信号向下传播</text>
      <rect x="155" y="132" width="190" height="34" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5" />
      <text x="250" y="148" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">WithTimeout · 2s</text>
      <text x="250" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">serviceA</text>
      <line x1="250" y1="166" x2="250" y2="182" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#aCTXo)" />
      <rect x="130" y="184" width="240" height="30" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="250" y="203" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">serviceB · 继承 2s 超时，3s 任务将被取消</text>
      <defs>
        <marker id="aCTX" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-sub)" /></marker>
        <marker id="aCTXo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)" /></marker>
      </defs>
    </svg>
  </DiagramFrame>
</template>
