<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'errgroup'
  | 'singleflight'
  | 'semaphore'
  | 'bounded-concurrency'
  | 'worker-pool'
  | 'fan-in-advanced'
  | 'rate-limiter'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  errgroup: '700px',
  singleflight: '700px',
  semaphore: '700px',
  'bounded-concurrency': '700px',
  'worker-pool': '580px',
  'fan-in-advanced': '560px',
  'rate-limiter': '700px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'errgroup'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">ErrGroup：等待一组任务，并在首个错误后取消其余任务</text>
      <rect x="20" y="34" width="660" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="42" y="76" width="136" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="110" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">errgroup.WithContext</text>
      <line x1="178" y1="98" x2="266" y2="98" stroke="var(--d-blue-border)" stroke-width="1.4"/>
      <rect x="266" y="50" width="104" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="318" y="71" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">task 1</text>
      <rect x="266" y="92" width="104" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="318" y="113" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">task 2</text>
      <rect x="266" y="134" width="104" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="318" y="155" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">task 3 返回 error</text>
      <line x1="370" y1="151" x2="472" y2="151" stroke="var(--d-warn-border)" stroke-width="1.4"/>
      <rect x="472" y="126" width="146" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="545" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ctx 被取消</text>
      <text x="545" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">其余任务应检查 ctx.Done()</text>
      <text x="350" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Wait() 只返回第一个错误；如果要收集全部错误，要额外设计结果通道或 multi-error</text>
    </svg>

    <svg
          v-else-if="kind === 'singleflight'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Singleflight：同一个 key 的并发请求只让一个真正下探</text>
      <rect x="20" y="34" width="660" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="44" y="82" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="88" y="103" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">req A</text>
      <rect x="44" y="122" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="88" y="143" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">req B</text>
      <rect x="44" y="162" width="88" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="88" y="183" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">req C</text>
      <line x1="132" y1="99" x2="236" y2="99" stroke="var(--d-rv-a-border)" stroke-width="1.4"/>
      <line x1="132" y1="139" x2="236" y2="139" stroke="var(--d-rv-a-border)" stroke-width="1.4"/>
      <line x1="132" y1="179" x2="236" y2="179" stroke="var(--d-rv-a-border)" stroke-width="1.4"/>
      <rect x="236" y="82" width="144" height="114" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="308" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">singleflight.Group</text>
      <text x="308" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">key = user:123</text>
      <text x="308" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只有第一个调用真正执行</text>
      <text x="308" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">其余等待共享结果</text>
      <line x1="380" y1="139" x2="462" y2="139" stroke="var(--d-blue-border)" stroke-width="1.4"/>
      <rect x="462" y="114" width="112" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="518" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">query DB / 下游 API</text>
      <text x="518" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">只执行一次</text>
      <text x="350" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">注意：错误也会被共享；必要时可在错误后 Forget(key) 让下一次重新执行</text>
    </svg>

    <svg
          v-else-if="kind === 'semaphore'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Semaphore：先拿令牌再做事，做完归还令牌</text>
      <rect x="20" y="34" width="660" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="260" y="60" width="180" height="54" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="350" y="82" text-anchor="middle" font-size="10" fill="var(--d-text)">semaphore(3)</text>
      <text x="350" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可同时运行 3 个任务</text>
      <rect x="74" y="142" width="86" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="117" y="163" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">task 1</text>
      <rect x="176" y="142" width="86" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="219" y="163" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">task 2</text>
      <rect x="278" y="142" width="86" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="321" y="163" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">task 3</text>
      <rect x="380" y="142" width="86" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="423" y="163" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">task 4 等待</text>
      <line x1="423" y1="142" x2="423" y2="114" stroke="var(--d-warn-border)" stroke-width="1.3"/>
      <text x="350" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Acquire 失败可立刻返回或因 ctx 超时取消；本质上是把“并发数”变成显式资源配额</text>
    </svg>

    <svg
          v-else-if="kind === 'bounded-concurrency'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">有界并发：不是把任务都并发跑，而是让“同时在跑的任务数”有上限</text>
      <rect x="20" y="34" width="660" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="48" y="88" width="100" height="56" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="98" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">100 个待处理任务</text>
      <text x="98" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不是 100 个都同时跑</text>
      <line x1="148" y1="116" x2="248" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4"/>
      <rect x="248" y="74" width="208" height="84" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="352" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">限制器</text>
      <text x="352" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">errgroup.SetLimit / semaphore / token chan</text>
      <text x="352" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">允许最多 N 个任务同时处于 running</text>
      <line x1="456" y1="116" x2="556" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4"/>
      <rect x="556" y="60" width="96" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="604" y="81" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">running 1</text>
      <rect x="556" y="102" width="96" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="604" y="123" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">running 2</text>
      <rect x="556" y="144" width="96" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="604" y="165" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">其余等待槽位</text>
    </svg>

    <svg
          v-else-if="kind === 'worker-pool'" viewBox="0 0 580 180" xmlns="http://www.w3.org/2000/svg">
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
          v-else-if="kind === 'rate-limiter'" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Rate Limiter：限制“单位时间内能过多少请求”，不是限制当前并发数</text>
      <rect x="20" y="34" width="660" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="92" y="74" width="132" height="86" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="158" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Token Bucket</text>
      <text x="158" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按速率补充令牌</text>
      <text x="158" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">有 burst 容量</text>
      <line x1="224" y1="117" x2="332" y2="117" stroke="var(--d-blue-border)" stroke-width="1.4"/>
      <rect x="332" y="82" width="144" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="404" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">请求到达</text>
      <text x="404" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">拿到令牌 → 放行</text>
      <text x="404" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">没令牌 → 等待 / 拒绝</text>
      <line x1="476" y1="117" x2="590" y2="117" stroke="var(--d-rv-c-border)" stroke-width="1.4"/>
      <rect x="590" y="92" width="74" height="50" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="627" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">下游服务</text>
      <text x="627" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">收到平滑流量</text>
      <text x="350" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Semaphore 控的是“同时多少个”，Rate Limiter 控的是“每秒多少个”</text>
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
