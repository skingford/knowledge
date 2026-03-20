<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'interface-itab'
  | 'stack-vs-heap'
  | 'escape-scenarios'
  | 'gc-tricolor'
  | 'allocator-hierarchy'
  | 'timer-heap'
  | 'happens-before'
  | 'concurrent-append'
  | 'slice-safe-patterns'
  | 'channel-manager'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'interface-itab': '760px',
  'stack-vs-heap': '760px',
  'escape-scenarios': '760px',
  'gc-tricolor': '760px',
  'allocator-hierarchy': '760px',
  'timer-heap': '760px',
  'happens-before': '760px',
  'concurrent-append': '760px',
  'slice-safe-patterns': '760px',
  'channel-manager': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 底层原理专题概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">底层原理主线：数据结构、分配位置、回收机制、并发可见性</text>

      <rect x="20" y="46" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="105" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">数据结构</text>
      <text x="105" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">slice：ptr / len / cap</text>
      <text x="105" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">map：hmap + buckets</text>
      <text x="105" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">channel：hchan + sendq / recvq</text>
      <text x="105" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先理解“值长什么样”</text>

      <rect x="205" y="46" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="290" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">分配位置</text>
      <text x="290" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">接口装箱</text>
      <text x="290" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">闭包捕获</text>
      <text x="290" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">返回局部变量地址</text>
      <text x="290" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">决定落栈还是堆</text>
      <text x="290" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本质上是在争 GC 成本</text>

      <rect x="390" y="46" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="475" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">回收与分配</text>
      <text x="475" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">三色标记 + 写屏障</text>
      <text x="475" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">mcache → mcentral → mheap</text>
      <text x="475" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">减少锁竞争和碎片</text>
      <text x="475" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">理解吞吐、延迟和内存的权衡</text>

      <rect x="575" y="46" width="170" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="660" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">并发可见性</text>
      <text x="660" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">channel send → recv</text>
      <text x="660" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">unlock → lock</text>
      <text x="660" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">Done → Wait 返回</text>
      <text x="660" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">没同步就可能 data race</text>
      <text x="660" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最后回到“写入什么时候可见”</text>
    </svg>

    <svg
      v-else-if="kind === 'interface-itab'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="eface、iface 与 itab 结构图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">接口值本质上是“类型信息 + 数据指针”，非空接口再多一个 itab</text>

      <rect x="18" y="44" width="220" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="128" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">eface</text>
      <text x="128" y="84" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">interface{} / any</text>
      <rect x="54" y="108" width="148" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="128" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">_type</text>
      <rect x="54" y="158" width="148" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="128" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">data</text>
      <text x="128" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">空接口直接知道“是什么类型 + 数据在哪”</text>

      <rect x="270" y="44" width="220" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">iface</text>
      <text x="380" y="84" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">非空接口</text>
      <rect x="306" y="108" width="148" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">tab</text>
      <rect x="306" y="158" width="148" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="182" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">data</text>
      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">tab 指向 itab，里面带方法表</text>

      <rect x="522" y="44" width="220" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="632" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">itab</text>
      <rect x="556" y="96" width="152" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="632" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">inter：接口类型</text>
      <rect x="556" y="138" width="152" height="34" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="632" y="159" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">_type：具体类型</text>
      <rect x="556" y="180" width="152" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="632" y="201" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">fun[]：方法表</text>
      <text x="632" y="232" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">同一组 (接口, 类型) 会缓存复用</text>
    </svg>

    <svg
      v-else-if="kind === 'stack-vs-heap'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="栈与堆分配示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">编译器真正关心的只有一件事：函数返回后，这个值还会不会被引用</text>

      <rect x="18" y="44" width="320" height="212" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="178" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">栈 Stack</text>
      <rect x="54" y="96" width="248" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="178" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">函数栈帧里的局部变量</text>
      <text x="178" y="152" text-anchor="middle" font-size="10" fill="var(--d-text)">优点：分配快，回收只要移动栈指针</text>
      <text x="178" y="172" text-anchor="middle" font-size="10" fill="var(--d-text)">缺点：生命周期只能跟着当前调用链</text>
      <text x="178" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">函数返回，整段栈帧一起失效</text>

      <rect x="422" y="44" width="320" height="212" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="582" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">堆 Heap</text>
      <rect x="458" y="96" width="248" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="582" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">返回后还要活着的对象</text>
      <text x="582" y="152" text-anchor="middle" font-size="10" fill="var(--d-text)">优点：生命周期灵活，可跨函数 / goroutine 保留</text>
      <text x="582" y="172" text-anchor="middle" font-size="10" fill="var(--d-text)">代价：走分配器，并给 GC 增加扫描和回收负担</text>
      <text x="582" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">逃逸越多，HeapObjects 和 GC 压力通常越高</text>

      <text x="380" y="124" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">逃逸条件满足时 →</text>
      <text x="380" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">例如返回地址、接口装箱、闭包捕获、Channel 发送</text>
    </svg>

    <svg
      v-else-if="kind === 'escape-scenarios'"
      viewBox="0 0 760 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="常见逃逸场景图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">常见逃逸场景：变量本来在当前栈帧里，但被带到了更长生命周期的地方</text>

      <rect x="20" y="44" width="720" height="224" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="44" y="92" width="112" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="100" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">局部变量 v</text>

      <line x1="156" y1="113" x2="258" y2="76" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="156" y1="113" x2="258" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="156" y1="113" x2="258" y2="160" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="156" y1="113" x2="258" y2="202" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="266" y="56" width="192" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="362" y="80" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">return &amp;v</text>
      <rect x="266" y="98" width="192" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="362" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">装箱进 interface{} / any / fmt.Println</text>
      <rect x="266" y="140" width="192" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="362" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">被闭包捕获，闭包可能晚于外层函数结束</text>
      <rect x="266" y="182" width="192" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="362" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">被发送到 channel / 大对象 / 动态 size slice</text>

      <text x="490" y="122" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="548" y="96" width="146" height="54" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="621" y="118" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">编译器倾向放到堆上</text>
      <text x="621" y="136" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">moved to heap / escapes</text>

      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">不是所有装箱和 make 都 100% 逃逸，但这些写法会显著提高逃逸概率</text>
    </svg>

    <svg
      v-else-if="kind === 'gc-tricolor'"
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="三色标记与写屏障示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">三色标记核心是：把“还活着”的对象标黑，最后剩下的白对象就是垃圾</text>

      <rect x="20" y="44" width="720" height="236" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="52" y="92" width="118" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="111" y="113" text-anchor="middle" font-size="10" fill="var(--d-text)">Roots</text>
      <text x="111" y="129" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">全局变量 / 栈 / 寄存器</text>

      <text x="190" y="120" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="228" y="86" width="128" height="60" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="292" y="108" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">灰色集合</text>
      <text x="292" y="126" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">对象已找到</text>
      <text x="292" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">引用还没扫完</text>

      <text x="376" y="120" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="414" y="86" width="128" height="60" rx="8" fill="#333" stroke="#555" stroke-width="1.2" />
      <text x="478" y="108" text-anchor="middle" font-size="11" fill="#fff">黑色集合</text>
      <text x="478" y="126" text-anchor="middle" font-size="10" fill="#ddd">对象已扫描完成</text>
      <text x="478" y="140" text-anchor="middle" font-size="10" fill="#ddd">其引用也已处理</text>

      <text x="562" y="120" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="600" y="86" width="108" height="60" rx="8" fill="#fff" stroke="#bbb" stroke-width="1.2" />
      <text x="654" y="108" text-anchor="middle" font-size="11" fill="#333">白色对象</text>
      <text x="654" y="126" text-anchor="middle" font-size="10" fill="#333">未标记</text>
      <text x="654" y="140" text-anchor="middle" font-size="10" fill="#333">GC 后回收</text>

      <line x1="292" y1="168" x2="292" y2="198" stroke="var(--d-border-dash)" stroke-dasharray="5 5" />
      <rect x="160" y="198" width="264" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="292" y="221" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">扫描灰对象时：把它指向的白对象继续染灰，自己转黑</text>

      <rect x="458" y="188" width="228" height="56" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="572" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">写屏障</text>
      <text x="572" y="226" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">并发标记期间，用户代码改引用时把相关对象重新染灰</text>
      <text x="572" y="242" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">避免漏标活对象</text>
    </svg>

    <svg
      v-else-if="kind === 'allocator-hierarchy'"
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="mcache、mcentral、mheap 分配层级图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">分配器的主线是：先走本地缓存，再走中央缓存，最后才向全局堆甚至 OS 要内存</text>

      <rect x="18" y="44" width="724" height="236" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="44" y="98" width="136" height="70" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="112" y="122" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">P 上的 mcache</text>
      <text x="112" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">本地缓存</text>
      <text x="112" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">分配小对象无锁</text>

      <text x="204" y="136" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="238" y="88" width="146" height="90" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="311" y="112" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">mcentral</text>
      <text x="311" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按 size class 管理</text>
      <text x="311" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">给 mcache 补新的 span</text>
      <text x="311" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">需要加锁，但粒度更细</text>

      <text x="408" y="136" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="442" y="88" width="146" height="90" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="515" y="112" text-anchor="middle" font-size="11" fill="var(--d-text)">mheap</text>
      <text x="515" y="130" text-anchor="middle" font-size="10" fill="var(--d-text)">全局堆</text>
      <text x="515" y="146" text-anchor="middle" font-size="10" fill="var(--d-text)">管理 arena / span / page</text>
      <text x="515" y="162" text-anchor="middle" font-size="10" fill="var(--d-text)">必要时向 OS 申请大块内存</text>

      <text x="612" y="136" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="636" y="98" width="80" height="70" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="676" y="122" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">OS</text>
      <text x="676" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">mmap</text>
      <text x="676" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">sysAlloc</text>

      <rect x="64" y="196" width="150" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="139" y="218" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">tiny / 小对象</text>
      <text x="139" y="234" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">优先走 mcache</text>

      <rect x="304" y="196" width="150" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="379" y="218" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">size class</text>
      <text x="379" y="234" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">用固定槽位换更快分配</text>

      <rect x="544" y="196" width="150" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="619" y="218" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">大对象（&gt; 32KB）</text>
      <text x="619" y="234" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">更接近直接走 mheap</text>
    </svg>

    <svg
      v-else-if="kind === 'timer-heap'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="runtime timer heap 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">定时器的主线是：time 包创建 timer，挂到某个 P 的最小堆里，再由调度器或 netpoll 按最近到期时间触发</text>

      <rect x="28" y="92" width="138" height="68" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">time.NewTimer</text>
      <text x="97" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Ticker / After / Sleep</text>
      <text x="97" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">构造 runtime.timer</text>

      <line x1="166" y1="126" x2="256" y2="126" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="256" y="70" width="176" height="112" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="344" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">per-P timers heap</text>
      <text x="344" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 when 排序的最小堆</text>
      <text x="344" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">堆顶就是最近到期的 timer</text>
      <text x="344" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">addtimer / deltimer / runtimer</text>
      <text x="344" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Stop 通常是惰性删除标记</text>

      <line x1="432" y1="126" x2="532" y2="126" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="532" y="62" width="120" height="128" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="592" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">触发者</text>
      <text x="592" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">schedule()</text>
      <text x="592" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">netpoll timeout</text>
      <text x="592" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">sysmon 托底</text>
      <text x="592" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">now >= when 时执行</text>
      <text x="592" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Ticker 还会重排下次 when</text>

      <line x1="652" y1="126" x2="732" y2="96" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="652" y1="126" x2="732" y2="156" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <rect x="620" y="74" width="116" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="678" y="95" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">向 C 发送时间值</text>
      <rect x="620" y="144" width="116" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="678" y="165" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">执行 AfterFunc 回调</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Timer 是“一次性”；Ticker 是“触发后按 period 重新入堆”。理解这一点，Stop / Reset / 泄漏问题就容易串起来</text>
    </svg>

    <svg
      v-else-if="kind === 'happens-before'"
      viewBox="0 0 760 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="happens-before 规则图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">happens-before 的意义是：前面的写，对后面的读可见</text>

      <rect x="20" y="44" width="720" height="222" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />

      <rect x="44" y="76" width="202" height="56" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="145" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Channel</text>
      <text x="145" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ch &lt;- v  happens-before  &lt;-ch 完成</text>

      <rect x="278" y="76" width="202" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="379" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Mutex</text>
      <text x="379" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Unlock happens-before 下一次 Lock</text>

      <rect x="512" y="76" width="202" height="56" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="613" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">WaitGroup / Once</text>
      <text x="613" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Done → Wait 返回，Do(f) → 其他 Do 返回</text>

      <rect x="130" y="164" width="220" height="56" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="240" y="186" text-anchor="middle" font-size="10" fill="var(--d-text)">close(ch) happens-before</text>
      <text x="240" y="204" text-anchor="middle" font-size="10" fill="var(--d-text)">接收方观察到关闭并拿到零值</text>

      <rect x="410" y="164" width="220" height="56" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="520" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">没有同步关系</text>
      <text x="520" y="204" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">读写同一变量就可能 data race</text>

      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点：不是“两个 goroutine 都跑完就安全”，而是写入和读取之间必须有明确同步边界</text>
    </svg>

    <svg
      v-else-if="kind === 'concurrent-append'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="并发 append 竞态图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">并发 append 的危险不只在“写同一格”，还在于 len / cap / 底层数组指针都可能同时变化</text>

      <rect x="20" y="44" width="720" height="214" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="286" y="68" width="188" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="89" text-anchor="middle" font-size="10" fill="var(--d-text)">共享 slice header</text>
      <text x="380" y="105" text-anchor="middle" font-size="10" fill="var(--d-text)">array / len / cap</text>

      <rect x="74" y="146" width="174" height="58" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="161" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">G1: append(s, 1)</text>
      <text x="161" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">读 len/cap，写元素，回写新 len</text>

      <rect x="512" y="146" width="174" height="58" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="599" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">G2: append(s, 2)</text>
      <text x="599" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">也在同时读写 header 和数组</text>

      <line x1="248" y1="174" x2="286" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="512" y1="174" x2="474" y2="108" stroke="var(--d-rv-b-border)" stroke-width="1.4" />

      <rect x="240" y="224" width="280" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="240" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">结果可能是：丢数据、覆盖、扩容后写进旧数组、header 竞争被 race detector 报警</text>
    </svg>

    <svg
      v-else-if="kind === 'slice-safe-patterns'"
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="并发切片的三种更稳妥模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">更稳妥的并发结果收集模式</text>

      <rect x="20" y="44" width="220" height="230" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="130" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">预分配 + 按索引写</text>
      <text x="130" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">results[i] = work(i)</text>
      <text x="130" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">适合任务数固定</text>
      <text x="130" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">每个 goroutine 知道写哪一格</text>
      <text x="130" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">优先级通常最高：结构简单，性能最好</text>

      <rect x="270" y="44" width="220" height="230" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">加锁保护共享切片</text>
      <text x="380" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">mu.Lock(); append(...); mu.Unlock()</text>
      <text x="380" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">适合必须共享同一个容器</text>
      <text x="380" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">改造成本低</text>
      <text x="380" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本质是在保护状态所有权</text>

      <rect x="520" y="44" width="220" height="230" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="630" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Channel 汇总</text>
      <text x="630" y="96" text-anchor="middle" font-size="10" fill="var(--d-text)">worker → ch → aggregator</text>
      <text x="630" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">适合结果流式到达</text>
      <text x="630" y="136" text-anchor="middle" font-size="10" fill="var(--d-text)">或需要 select / 超时 / 取消</text>
      <text x="630" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本质是在传递数据流，不是在直接共享内存</text>
    </svg>

    <svg
      v-else-if="kind === 'channel-manager'"
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Channel 管理器与 monitor goroutine 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Monitor Goroutine 模式：把切片所有权交给唯一一个 manager goroutine</text>

      <rect x="20" y="44" width="720" height="236" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="44" y="84" width="92" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">worker 1</text>
      <rect x="44" y="138" width="92" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">worker 2</text>
      <rect x="44" y="192" width="92" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="216" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">worker N</text>

      <line x1="136" y1="104" x2="248" y2="104" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="136" y1="158" x2="248" y2="158" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="136" y1="212" x2="248" y2="212" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="248" y="84" width="88" height="148" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="292" y="106" text-anchor="middle" font-size="10" fill="var(--d-text)">addCh</text>
      <text x="292" y="126" text-anchor="middle" font-size="10" fill="var(--d-text)">getCh</text>
      <text x="292" y="146" text-anchor="middle" font-size="10" fill="var(--d-text)">quitCh</text>
      <text x="292" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">所有请求都先过 channel</text>

      <line x1="336" y1="158" x2="414" y2="158" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="414" y="74" width="174" height="168" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="501" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">managerLoop()</text>
      <text x="501" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">唯一拥有 items</text>
      <text x="501" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">append / snapshot / stop</text>
      <text x="501" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">都在这里串行执行</text>
      <rect x="448" y="176" width="106" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.1" />
      <text x="501" y="198" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">items []T</text>

      <line x1="588" y1="158" x2="676" y2="158" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="630" y="124" width="92" height="68" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="676" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">调用方</text>
      <text x="676" y="164" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">收到快照</text>
      <text x="676" y="180" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不能直接拿内部切片本体</text>

      <text x="380" y="266" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">强项是状态所有权清晰；风险是模型复杂度和背压处理会迅速上升</text>
    </svg>
  </DiagramFrame>
</template>
