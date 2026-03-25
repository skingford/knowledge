<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'cpu-pprof'
  | 'heap-profile'
  | 'trace-timeline'
  | 'benchmark-benchstat'
  | 'gc-control'
  | 'allocation-optimization'
  | 'sync-pool-lifecycle'
  | 'mutex-profile'
  | 'sharded-map'
  | 'slow-request-breakdown'
  | 'goroutine-leak-patterns'
  | 'goroutine-context-exit'
  | 'incident-workflow'
  | 'runtime-selfcheck'
  | 'telemetry-triad'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'cpu-pprof': '760px',
  'heap-profile': '760px',
  'trace-timeline': '760px',
  'benchmark-benchstat': '760px',
  'gc-control': '760px',
  'allocation-optimization': '760px',
  'sync-pool-lifecycle': '760px',
  'mutex-profile': '760px',
  'sharded-map': '760px',
  'slow-request-breakdown': '760px',
  'goroutine-leak-patterns': '760px',
  'goroutine-context-exit': '760px',
  'incident-workflow': '760px',
  'runtime-selfcheck': '760px',
  'telemetry-triad': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 性能排障专题概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">性能排障主线：先会采集和读图，再减少分配与锁竞争，最后把线上问题定位流程串成闭环</text>

      <rect x="22" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="136" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">采集与观察</text>
      <text x="136" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">CPU / Heap Pprof</text>
      <text x="136" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">runtime/trace</text>
      <text x="136" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">benchmark / benchstat</text>
      <text x="136" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先确认瓶颈在哪，不靠猜</text>

      <rect x="266" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">优化与治理</text>
      <text x="380" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">GOGC / GOMEMLIMIT</text>
      <text x="380" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">逃逸 / 预分配 / Builder</text>
      <text x="380" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">sync.Pool / 锁分片</text>
      <text x="380" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">减少分配、缩小临界区、控制尾延迟</text>

      <rect x="510" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="624" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">线上闭环</text>
      <text x="624" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">goroutine 泄漏</text>
      <text x="624" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">指标 / 日志 / Trace</text>
      <text x="624" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">运行时自检 / 复盘</text>
      <text x="624" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">问题发现、定位、修复、验证要串起来</text>
    </svg>

    <svg
      v-else-if="kind === 'cpu-pprof'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CPU Pprof 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CPU Pprof 的关键不是“抓到一个文件”，而是把采样结果顺着 hot path 读到真正耗时的函数上</text>

      <rect x="28" y="96" width="108" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="82" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务程序</text>
      <text x="82" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">hotFunction()</text>

      <line x1="136" y1="120" x2="242" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="242" y="72" width="166" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="325" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">runtime/pprof</text>
      <text x="325" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">StartCPUProfile()</text>
      <text x="325" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">默认 100Hz 采样</text>
      <text x="325" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录当时调用栈</text>

      <line x1="408" y1="120" x2="504" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="504" y="72" width="108" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="558" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">cpu.prof</text>
      <text x="558" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">go tool pprof</text>
      <text x="558" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">top / list</text>
      <text x="558" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">-http flame graph</text>

      <rect x="638" y="72" width="94" height="96" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="685" y="94" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">读图顺序</text>
      <text x="685" y="112" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">先看 cum</text>
      <text x="685" y="128" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">再看 flat</text>
      <text x="685" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">最后回源码</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最宽的火焰平顶是热点，`cum` 帮你找热路径，`flat` 帮你找真正消耗 CPU 的那一层</text>
    </svg>

    <svg
      v-else-if="kind === 'heap-profile'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Heap Pprof 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Heap Pprof 要分清“谁还持有内存”和“谁在疯狂分配”，排查泄漏和优化分配看的是两套视角</text>

      <rect x="26" y="82" width="132" height="96" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">业务分配</text>
      <text x="92" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">make([]byte)</text>
      <text x="92" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">slice / map / object</text>
      <text x="92" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">持续增长时再抓</text>

      <line x1="158" y1="130" x2="260" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="260" y="72" width="166" height="116" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="343" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">heap profile</text>
      <text x="343" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">runtime.GC()</text>
      <text x="343" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WriteHeapProfile()</text>
      <text x="343" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">http /debug/pprof/heap</text>
      <text x="343" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">-base 比较两个时间点</text>

      <line x1="426" y1="130" x2="520" y2="106" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="426" y1="130" x2="520" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="520" y="82" width="104" height="48" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="572" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">inuse_space</text>
      <text x="572" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看谁还在占用</text>
      <rect x="520" y="140" width="104" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="572" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">alloc_space</text>
      <text x="572" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">看谁分配最多</text>

      <rect x="646" y="82" width="88" height="106" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="690" y="104" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">核心动作</text>
      <text x="690" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">看增长</text>
      <text x="690" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不是看单点</text>
      <text x="690" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">用 -base</text>
      <text x="690" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">找持续上涨</text>

      <text x="380" y="216" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">泄漏排查优先看 `inuse_*`，频繁分配优化优先看 `alloc_*`，单次 heap 快照很难说明趋势</text>
    </svg>

    <svg
      v-else-if="kind === 'trace-timeline'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="runtime trace 时间线图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Trace 解决的是“这一刻到底发生了什么”，适合看调度等待、网络阻塞、GC 停顿和抖动来源</text>

      <rect x="28" y="82" width="126" height="96" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="91" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">业务任务</text>
      <text x="91" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">trace.NewTask()</text>
      <text x="91" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">trace.WithRegion()</text>
      <text x="91" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">给逻辑阶段打标签</text>

      <line x1="154" y1="130" x2="260" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="260" y="64" width="178" height="132" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="349" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">runtime/trace</text>
      <text x="349" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">goroutine runnable / running</text>
      <text x="349" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">network wait / syscall</text>
      <text x="349" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">mutex wait / GC assist / STW</text>
      <text x="349" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录时间顺序，不是采样统计</text>
      <text x="349" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">trace.out</text>

      <line x1="438" y1="130" x2="542" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="542" y="64" width="186" height="132" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="635" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">go tool trace</text>
      <text x="635" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">时间线</text>
      <text x="635" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Goroutine Analysis</text>
      <text x="635" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">User regions / tasks</text>
      <text x="635" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看到抖动发生在哪一段</text>
      <text x="635" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">线上只短时开启</text>

      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Pprof 告诉你“总共花了多少”，Trace 告诉你“按时间顺序发生了什么”，两者是互补关系</text>
    </svg>

    <svg
      v-else-if="kind === 'benchmark-benchstat'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Benchmark 与 benchstat 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Benchmark 的目标不是跑出一个漂亮数字，而是稳定地比较“优化前后到底有没有变好”</text>

      <rect x="26" y="90" width="116" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">旧实现</text>
      <text x="84" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">old.txt</text>

      <rect x="26" y="154" width="116" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="84" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">新实现</text>
      <text x="84" y="190" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">new.txt</text>

      <line x1="142" y1="116" x2="264" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="142" y1="180" x2="264" y2="180" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="264" y="74" width="190" height="148" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="359" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">go test -bench=. -benchmem -count=5</text>
      <text x="359" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">b.N 自动调节</text>
      <text x="359" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">b.ResetTimer() 排除初始化</text>
      <text x="359" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">ReportAllocs() 看分配</text>
      <text x="359" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">多跑几次压低波动</text>
      <text x="359" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">再用 benchstat 比较</text>

      <line x1="454" y1="148" x2="560" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="560" y="82" width="172" height="132" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="646" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">benchstat</text>
      <text x="646" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ns/op 是否下降</text>
      <text x="646" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">B/op 是否下降</text>
      <text x="646" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">allocs/op 是否下降</text>
      <text x="646" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">变化百分比和置信度</text>
      <text x="646" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">避免被偶然波动骗到</text>

      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">单次 benchmark 结果可参考但不可靠，工程上真正该看的是多次样本后的对比结论</text>
    </svg>

    <svg
      v-else-if="kind === 'gc-control'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GC 调优图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">GC 调优的本质是控制“下一次回收何时触发”，但最终上限仍由分配速度和存活对象决定</text>

      <rect x="28" y="80" width="156" height="110" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="106" y="102" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">当前存活堆</text>
      <text x="106" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">live heap = 500MB</text>
      <text x="106" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">GOGC=100 -> goal 1GB</text>
      <text x="106" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">GOGC=200 -> goal 1.5GB</text>
      <text x="106" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">越大越少 GC，但更吃内存</text>

      <line x1="184" y1="135" x2="296" y2="135" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="296" y="64" width="176" height="142" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="384" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">运行期控制</text>
      <text x="384" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">debug.SetGCPercent()</text>
      <text x="384" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">debug.SetMemoryLimit()</text>
      <text x="384" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">容器场景更依赖 GOMEMLIMIT</text>
      <text x="384" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GOGC=off 也会受 memory limit 约束</text>
      <text x="384" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MemStats / GCStats 做观察</text>

      <line x1="472" y1="135" x2="576" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="472" y1="135" x2="576" y2="162" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="576" y="80" width="156" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="654" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">gctrace</text>
      <text x="654" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看 gc 占比、频率、goal、存活量</text>
      <rect x="576" y="148" width="156" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="654" y="170" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">根治方式</text>
      <text x="654" y="186" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">减少堆分配，而不只是调参</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">参数决定触发节奏，分配行为决定压力上限。只调 GOGC 不降分配，往往只是把问题往后推</text>
    </svg>

    <svg
      v-else-if="kind === 'allocation-optimization'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="减少分配图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">减少分配要抓四件事：少逃逸、少扩容、少字符串复制、少无意义类型转换</text>

      <rect x="24" y="52" width="160" height="190" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="104" y="76" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">容易增压的写法</text>
      <text x="104" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">返回局部变量指针</text>
      <text x="104" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">热路径传 interface{}</text>
      <text x="104" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">result += item</text>
      <text x="104" y="158" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">append 时反复扩容</text>
      <text x="104" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">[]byte <-> string 来回转</text>
      <text x="104" y="206" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">结果：堆分配增多</text>
      <text x="104" y="222" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">GC 压力升高</text>

      <rect x="300" y="52" width="160" height="190" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="76" text-anchor="middle" font-size="12" fill="var(--d-text)">更好的写法</text>
      <text x="380" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">值尽量留在栈上</text>
      <text x="380" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">make([]T, 0, n) 预分配</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">strings.Builder + Grow</text>
      <text x="380" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">直接操作 []byte</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">map 预估容量</text>
      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text)">结果：更少分配</text>
      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text)">更稳的延迟</text>

      <rect x="576" y="52" width="160" height="190" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="656" y="76" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">验证手段</text>
      <text x="656" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">go build -gcflags=&quot;-m&quot;</text>
      <text x="656" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看变量是否 escape</text>
      <text x="656" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">benchmark + benchmem</text>
      <text x="656" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">pprof alloc_space</text>
      <text x="656" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看 B/op 和 allocs/op</text>
      <text x="656" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">先证据</text>
      <text x="656" y="222" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">再优化</text>

      <line x1="184" y1="146" x2="300" y2="146" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <line x1="460" y1="146" x2="576" y2="146" stroke="var(--d-blue-border)" stroke-width="1.4" />
    </svg>

    <svg
      v-else-if="kind === 'sync-pool-lifecycle'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="sync.Pool 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`sync.Pool` 只是一种“可能复用”的临时对象仓，不是可靠缓存，GC 随时会把它清掉</text>

      <rect x="34" y="92" width="104" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">pool.Get()</text>
      <text x="86" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">借一个 Buffer</text>

      <line x1="138" y1="114" x2="240" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="240" y="70" width="154" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="317" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">业务使用</text>
      <text x="317" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">buf.WriteString(...)</text>
      <text x="317" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">处理完后必须 Reset()</text>
      <text x="317" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免脏数据泄漏</text>

      <line x1="394" y1="114" x2="496" y2="114" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="496" y="70" width="120" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="556" y="92" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">pool.Put()</text>
      <text x="556" y="110" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">放回复用</text>
      <text x="556" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">下次 Get 可能拿到</text>
      <text x="556" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">也可能拿不到</text>

      <rect x="646" y="70" width="88" height="88" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="690" y="92" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">GC</text>
      <text x="690" y="110" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">可能清空 Pool</text>
      <text x="690" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不能当缓存</text>
      <text x="690" y="142" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">只当优化手段</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">适合高频短命对象，如 Buffer、编解码器、临时切片。放回前不重置，性能问题会直接变成数据污染问题</text>
    </svg>

    <svg
      v-else-if="kind === 'mutex-profile'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mutex Profile 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">锁竞争排查的关键是把“CPU 空转或请求变慢”翻译成“哪些 goroutine 在等哪把锁”</text>

      <rect x="26" y="82" width="128" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">高并发 goroutine</text>
      <text x="90" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">频繁 Lock()</text>
      <text x="90" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">临界区过大</text>
      <text x="90" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">锁等待堆积</text>

      <line x1="154" y1="127" x2="260" y2="127" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="260" y="70" width="176" height="114" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="348" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">runtime.SetMutexProfileFraction()</text>
      <text x="348" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1 = 全采样</text>
      <text x="348" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">5-10 = 线上降低开销</text>
      <text x="348" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">/debug/pprof/mutex</text>
      <text x="348" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录锁等待时间</text>

      <line x1="436" y1="127" x2="542" y2="127" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="542" y="70" width="188" height="114" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="636" y="92" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">go tool pprof .../mutex</text>
      <text x="636" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">top 找热点函数</text>
      <text x="636" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">list 找具体临界区</text>
      <text x="636" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再决定缩锁、分片或改原子操作</text>
      <text x="636" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不要先拍脑袋重构</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">CPU 高不一定是算得多，也可能是锁等得多。Mutex profile 看的不是占用 CPU，而是等待锁造成的时间浪费</text>
    </svg>

    <svg
      v-else-if="kind === 'sharded-map'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分片 Map 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">分片的核心不是“更高级的数据结构”，而是把一把大锁拆成多把局部锁，让无关 key 不再互相阻塞</text>

      <rect x="26" y="96" width="120" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">key -> hash(key)</text>
      <text x="86" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">选择 shard</text>

      <line x1="146" y1="120" x2="256" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="256" y="64" width="188" height="112" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="350" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">32 shards</text>
      <text x="350" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">shard[0] -> RWMutex + map</text>
      <text x="350" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">shard[1] -> RWMutex + map</text>
      <text x="350" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">...</text>
      <text x="350" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不同 key 打到不同锁</text>

      <line x1="444" y1="120" x2="544" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="444" y1="120" x2="544" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="544" y="68" width="184" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="636" y="90" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">好处</text>
      <text x="636" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">降低热点范围，读写可并行分布</text>
      <rect x="544" y="132" width="184" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="636" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">代价</text>
      <text x="636" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">遍历、扩容、跨 shard 操作会更复杂</text>

      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先缩小临界区，再考虑分片；只有单锁确实成为瓶颈时，分片带来的复杂度才值得引入</text>
    </svg>

    <svg
      v-else-if="kind === 'slow-request-breakdown'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="慢请求排查图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">慢请求排查最有效的方式，是让同一个 Trace ID 把入口日志、分段耗时和尾延迟指标串到一起</text>

      <rect x="22" y="92" width="114" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="79" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">HTTP 请求进入</text>
      <text x="79" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">生成 trace_id</text>

      <line x1="136" y1="118" x2="228" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="228" y="64" width="182" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="319" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">分段计时</text>
      <text x="319" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">validate_input</text>
      <text x="319" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">query_db</text>
      <text x="319" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">call_downstream</text>
      <text x="319" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">serialize / respond</text>

      <line x1="410" y1="118" x2="500" y2="92" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="410" y1="118" x2="500" y2="144" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="500" y="66" width="110" height="52" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="555" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">结构化日志</text>
      <text x="555" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">每段都带 trace_id</text>
      <rect x="500" y="128" width="110" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="555" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">延迟指标</text>
      <text x="555" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">P50 / P95 / P99</text>

      <rect x="636" y="66" width="96" height="114" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="684" y="88" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">定位方式</text>
      <text x="684" y="106" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">先看尾延迟</text>
      <text x="684" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">再用 trace_id</text>
      <text x="684" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">回放阶段耗时</text>
      <text x="684" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">锁定 DB 还是 RPC</text>
      <text x="684" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不要只看平均值</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">平均值会掩盖尾部问题，真正把用户打疼的常常是 P99 上升和某一阶段偶发卡顿</text>
    </svg>

    <svg
      v-else-if="kind === 'goroutine-leak-patterns'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="goroutine 泄漏模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Goroutine 泄漏的本质是“任务已经失去业务价值，但 goroutine 还在阻塞或循环”，所以数量只涨不回</text>

      <rect x="22" y="58" width="150" height="150" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="97" y="82" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">典型泄漏点</text>
      <text x="97" y="108" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">send 无人接收</text>
      <text x="97" y="126" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">recv 无人发送</text>
      <text x="97" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">range 等不到 close</text>
      <text x="97" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">for + Sleep 永不退出</text>
      <text x="97" y="180" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">context 忘记 cancel</text>

      <line x1="172" y1="133" x2="296" y2="133" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <rect x="296" y="70" width="176" height="126" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="384" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">运行时表现</text>
      <text x="384" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">runtime.NumGoroutine 持续上涨</text>
      <text x="384" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">大量 goroutine 卡在同一行</text>
      <text x="384" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">堆和 FD 也可能被连带拖高</text>
      <text x="384" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最终变慢、OOM 或服务卡死</text>

      <line x1="472" y1="133" x2="596" y2="133" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="596" y="70" width="136" height="126" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="664" y="92" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">排查入口</text>
      <text x="664" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">/debug/pprof/goroutine</text>
      <text x="664" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">debug=2 看堆栈</text>
      <text x="664" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">go tool pprof</text>
      <text x="664" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">traces 看创建路径</text>

      <text x="380" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">泄漏排查不是数 goroutine，而是找“为什么这批 goroutine 没有退出条件”</text>
    </svg>

    <svg
      v-else-if="kind === 'goroutine-context-exit'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="context 控制 goroutine 退出图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">修复 goroutine 泄漏最稳的模式，是让 worker 同时监听业务输入和 `ctx.Done()`，退出条件必须外显</text>

      <rect x="28" y="92" width="114" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">main / request</text>
      <text x="85" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">WithTimeout()</text>

      <line x1="142" y1="114" x2="248" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="68" width="166" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="331" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">worker select</text>
      <text x="331" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">case val := &lt;-ch</text>
      <text x="331" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">case &lt;-ctx.Done()</text>
      <text x="331" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">处理完就 return</text>

      <line x1="414" y1="114" x2="514" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="414" y1="114" x2="514" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="514" y="68" width="104" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="566" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">channel close</text>
      <text x="566" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自然退出</text>
      <rect x="514" y="124" width="104" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="566" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">timeout / cancel</text>
      <text x="566" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">强制退出</text>

      <rect x="646" y="68" width="86" height="100" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="689" y="90" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">关键动作</text>
      <text x="689" y="108" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">defer cancel()</text>
      <text x="689" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">close(ch)</text>
      <text x="689" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不要依赖退出侥幸</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">凡是后台 goroutine，都该回答一个问题：它在什么条件下退出，谁来负责触发这个条件</text>
    </svg>

    <svg
      v-else-if="kind === 'incident-workflow'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="线上问题定位流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">线上排障不要跳步骤，先从监控判断问题类型，再选对工具，最后回到代码和请求场景确认根因</text>

      <rect x="286" y="42" width="188" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="67" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">指标告警触发</text>

      <line x1="380" y1="84" x2="380" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="246" y="112" width="268" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">先分类：CPU / 内存 / 延迟 / 错误率 / goroutine</text>

      <line x1="380" y1="156" x2="380" y2="184" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="38" y="184" width="126" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="101" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">CPU 高</text>
      <text x="101" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">pprof CPU</text>

      <rect x="182" y="184" width="126" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="245" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">内存涨</text>
      <text x="245" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">heap / alloc pprof</text>

      <rect x="326" y="184" width="126" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="389" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">延迟抖动</text>
      <text x="389" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Trace + 慢日志</text>

      <rect x="470" y="184" width="126" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="533" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">错误率升</text>
      <text x="533" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">错误日志 + 健康检查</text>

      <rect x="614" y="184" width="108" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="668" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">goroutine 堆积</text>
      <text x="668" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">goroutine profile</text>

      <line x1="380" y1="236" x2="380" y2="262" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="380" y="276" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最后一定要回到业务代码、请求样本和时间线，完成修复、验证和复盘，不要只停留在“看到图了”</text>
    </svg>

    <svg
      v-else-if="kind === 'runtime-selfcheck'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="运行时自检图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">运行时自检的目标不是替代监控，而是在实例级别快速回答“它现在到底健康不健康”</text>

      <rect x="26" y="82" width="160" height="112" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="106" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">采集运行时状态</text>
      <text x="106" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NumGoroutine()</text>
      <text x="106" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ReadMemStats()</text>
      <text x="106" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ReadGCStats()</text>
      <text x="106" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">runtime.Version()</text>

      <line x1="186" y1="138" x2="294" y2="138" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="294" y="70" width="178" height="136" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="383" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">实例内接口</text>
      <text x="383" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">/debug/runtime</text>
      <text x="383" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">/health</text>
      <text x="383" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">JSON 输出关键指标</text>
      <text x="383" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本地排障和巡检都能复用</text>
      <text x="383" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可加阈值做 warning</text>

      <line x1="472" y1="138" x2="574" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="472" y1="138" x2="574" y2="164" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="574" y="82" width="160" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="654" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">排障价值</text>
      <text x="654" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">快速看单实例有没有异常积压</text>
      <rect x="574" y="150" width="160" height="56" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="654" y="172" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">注意</text>
      <text x="654" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">要限流、鉴权，别直接裸露公网</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">监控大盘负责全局，自检接口负责单点。两者组合起来，才能既看趋势又看实例细节</text>
    </svg>

    <svg
      v-else-if="kind === 'telemetry-triad'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="指标日志Trace 三件套图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">指标、日志、Trace 的价值不在于三套系统并存，而在于用同一个 Trace ID 把它们关联成一条证据链</text>

      <rect x="26" y="98" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="85" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">请求 / 任务</text>
      <text x="85" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">trace_id=abc-123</text>

      <line x1="144" y1="122" x2="244" y2="92" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="144" y1="122" x2="244" y2="122" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="144" y1="122" x2="244" y2="152" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="244" y="66" width="140" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="314" y="88" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Metrics</text>
      <text x="314" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">latency / error / QPS</text>

      <rect x="244" y="122" width="140" height="52" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="314" y="144" text-anchor="middle" font-size="10" fill="var(--d-text)">Logs</text>
      <text x="314" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">阶段日志 + fields</text>

      <rect x="244" y="178" width="140" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="314" y="200" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Trace</text>
      <text x="314" y="216" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">span / region / timeline</text>

      <line x1="384" y1="148" x2="516" y2="148" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="516" y="82" width="216" height="132" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="624" y="104" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">关联后的价值</text>
      <text x="624" y="124" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">指标先发现“哪里不正常”</text>
      <text x="624" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志补充“具体发生了什么”</text>
      <text x="624" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Trace 还原“卡在第几段”</text>
      <text x="624" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">最终回到根因与修复动作</text>
      <text x="624" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">而不是只盯某一个系统</text>

      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">工程上最怕的是三套系统各说各话，所以入口就要把 trace_id、request_id 这样的关联字段打通</text>
    </svg>
  </DiagramFrame>
</template>
