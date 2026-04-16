<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'mutex-vs-rwmutex'
  | 'atomic-cas'
  | 'coordination-primitives'
  | 'cond-wait-signal'
  | 'sync-map-read-dirty'
  | 'primitive-decision-tree'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'mutex-vs-rwmutex': '600px',
  'atomic-cas': '660px',
  'coordination-primitives': '700px',
  'cond-wait-signal': '700px',
  'sync-map-read-dirty': '680px',
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
          v-else-if="kind === 'atomic-cas'" viewBox="0 0 660 220" xmlns="http://www.w3.org/2000/svg">
      <text x="330" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Atomic / CAS：在不加锁的前提下做单变量原子更新</text>
      <rect x="20" y="34" width="620" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="42" y="76" width="110" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="97" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">Load old</text>
      <text x="170" y="100" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="206" y="76" width="120" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2"/>
      <text x="266" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">计算 new</text>
      <text x="344" y="100" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="380" y="76" width="150" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="455" y="100" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">CompareAndSwap(old, new)</text>
      <line x1="530" y1="96" x2="610" y2="96" stroke="var(--d-green)" stroke-width="1.4"/>
      <text x="568" y="88" text-anchor="middle" font-size="9" fill="var(--d-green)">success</text>
      <rect x="548" y="56" width="74" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="585" y="76" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">提交成功</text>
      <line x1="455" y1="116" x2="455" y2="152" stroke="var(--d-orange)" stroke-width="1.4"/>
      <line x1="455" y1="152" x2="266" y2="152" stroke="var(--d-orange)" stroke-width="1.4"/>
      <text x="356" y="146" text-anchor="middle" font-size="9" fill="var(--d-orange)">failed → 其他 goroutine 抢先更新，重试</text>
      <text x="330" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">适合计数器、标志位、配置指针切换；复杂多字段一致性更新仍应使用 Mutex</text>
    </svg>

    <svg
          v-else-if="kind === 'coordination-primitives'" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">WaitGroup / Once / Cond / Pool：关注点不是“共享状态”，而是“协作方式”</text>
      <rect x="20" y="34" width="150" height="90" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2"/>
      <text x="95" y="58" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">WaitGroup</text>
      <text x="95" y="76" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Add → goroutine → Done</text>
      <text x="95" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Wait 阻塞到计数归零</text>
      <rect x="190" y="34" width="150" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="265" y="58" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Once</text>
      <text x="265" y="76" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">多个调用者竞争</text>
      <text x="265" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">只有第一次真正执行</text>
      <rect x="360" y="34" width="150" height="90" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="435" y="58" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">Cond</text>
      <text x="435" y="76" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Wait 时释放锁</text>
      <text x="435" y="92" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Signal / Broadcast 唤醒</text>
      <rect x="530" y="34" width="150" height="90" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="605" y="58" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Pool</text>
      <text x="605" y="76" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Get → 使用 → Reset → Put</text>
      <text x="605" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">降低临时对象分配</text>
      <rect x="78" y="156" width="544" height="70" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
      <text x="350" y="182" text-anchor="middle" font-size="10" fill="var(--d-text)">四者分别解决：等待结束、只初始化一次、条件等待、对象复用</text>
      <text x="350" y="200" text-anchor="middle" font-size="10" fill="var(--d-text)">真正要选型时，先问自己是“协调 goroutine 生命周期”，还是“保护共享状态”</text>
    </svg>

    <svg
          v-else-if="kind === 'cond-wait-signal'" viewBox="0 0 700 240" xmlns="http://www.w3.org/2000/svg">
      <text x="350" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">sync.Cond：Wait 会先释放锁再睡眠，被唤醒后重新拿锁，所以条件判断必须放在 for 里</text>
      <rect x="20" y="34" width="660" height="186" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>

      <rect x="48" y="74" width="156" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="126" y="94" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">goroutine A</text>
      <text x="126" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">mu.Lock() -> for !ready</text>

      <line x1="204" y1="96" x2="286" y2="96" stroke="var(--d-rv-c-border)" stroke-width="1.4"/>
      <rect x="286" y="62" width="144" height="68" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="358" y="84" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">cond.Wait()</text>
      <text x="358" y="102" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">释放 mu</text>
      <text x="358" y="118" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">加入等待队列并挂起</text>

      <rect x="48" y="156" width="156" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="126" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">goroutine B</text>
      <text x="126" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">mu.Lock() -> 修改条件</text>

      <line x1="204" y1="178" x2="286" y2="178" stroke="var(--d-rv-a-border)" stroke-width="1.4"/>
      <rect x="286" y="144" width="144" height="68" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="358" y="166" text-anchor="middle" font-size="10" fill="var(--d-text)">Signal / Broadcast</text>
      <text x="358" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">唤醒一个或全部等待者</text>
      <text x="358" y="200" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">但不会替你保证条件仍成立</text>

      <line x1="430" y1="178" x2="516" y2="178" stroke="var(--d-blue-border)" stroke-width="1.4"/>
      <line x1="430" y1="96" x2="516" y2="96" stroke="var(--d-orange)" stroke-width="1.4"/>
      <rect x="516" y="74" width="136" height="44" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2"/>
      <text x="584" y="94" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">被唤醒的 A</text>
      <text x="584" y="110" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">重新获取 mu</text>

      <rect x="516" y="144" width="136" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2"/>
      <text x="584" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">再次检查条件</text>
      <text x="584" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">成立 -> 继续</text>
      <text x="584" y="196" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不成立 -> 再 Wait</text>
    </svg>

    <svg
          v-else-if="kind === 'sync-map-read-dirty'" viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg">
      <text x="340" y="18" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">sync.Map 的优势来自 read-only 快路径，而不是“天然比 map+锁更高级”</text>
      <rect x="20" y="34" width="640" height="176" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <rect x="52" y="70" width="206" height="104" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="155" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">read map</text>
      <text x="155" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">只读快路径</text>
      <text x="155" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Load 常常无需加锁</text>
      <text x="155" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">适合稳定 key、读多写少</text>
      <text x="280" y="122" font-size="14" fill="var(--d-text-sub)">↔</text>
      <rect x="330" y="70" width="206" height="104" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="433" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">dirty map</text>
      <text x="433" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">写入 / 新 key 更常走这里</text>
      <text x="433" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">miss 多了会提升到 read</text>
      <text x="433" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">写频繁时维护成本上升</text>
      <rect x="560" y="82" width="74" height="80" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2"/>
      <text x="597" y="104" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不擅长</text>
      <text x="597" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">高写比例</text>
      <text x="597" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">频繁增删</text>
      <text x="340" y="198" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">如果你需要强类型、频繁统计长度、写入比例高，通常 `RWMutex + map` 更直接</text>
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
