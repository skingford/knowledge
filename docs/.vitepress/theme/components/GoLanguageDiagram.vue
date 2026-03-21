<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'iota-bitmask'
  | 'value-semantics'
  | 'slice-append-trap'
  | 'string-byte-rune'
  | 'defer-panic'
  | 'closure-capture'
  | 'interface-nil'
  | 'reflect-settable'
  | 'generics-constraint'
  | 'error-chain'
  | 'builder-flow'
  | 'fmt-printf-flow'
  | 'strconv-append'
  | 'utf8-decode'
  | 'regexp-engine'
  | 'pdqsort-flow'
  | 'generic-stdlib-trio'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'iota-bitmask': '680px',
  'value-semantics': '760px',
  'slice-append-trap': '760px',
  'string-byte-rune': '760px',
  'defer-panic': '760px',
  'closure-capture': '760px',
  'interface-nil': '760px',
  'reflect-settable': '760px',
  'generics-constraint': '720px',
  'error-chain': '760px',
  'builder-flow': '760px',
  'fmt-printf-flow': '760px',
  'strconv-append': '760px',
  'utf8-decode': '760px',
  'regexp-engine': '760px',
  'pdqsort-flow': '760px',
  'generic-stdlib-trio': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'iota-bitmask'"
      viewBox="0 0 680 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="iota 递增与位掩码示意图"
      role="img"
    >
      <text x="340" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">iota：按 const 块递增，可用于枚举和位掩码</text>

      <rect x="16" y="38" width="300" height="176" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="166" y="60" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">枚举模式</text>
      <rect x="34" y="76" width="264" height="110" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="56" y="102" font-size="11" fill="var(--d-text)">const (</text>
      <text x="82" y="124" font-size="11" fill="var(--d-text)">Sunday = iota  // 0</text>
      <text x="82" y="144" font-size="11" fill="var(--d-text)">Monday          // 1</text>
      <text x="82" y="164" font-size="11" fill="var(--d-text)">Tuesday         // 2</text>
      <text x="56" y="184" font-size="11" fill="var(--d-text)">)</text>
      <text x="166" y="205" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点：每个 const 块从 0 重新开始</text>

      <rect x="364" y="38" width="300" height="176" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="514" y="60" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">位掩码模式</text>
      <rect x="382" y="76" width="264" height="110" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="404" y="102" font-size="11" fill="var(--d-rv-c-text)">const (</text>
      <text x="430" y="124" font-size="11" fill="var(--d-rv-c-text)">Read    = 1 &lt;&lt; iota  // 001</text>
      <text x="430" y="144" font-size="11" fill="var(--d-rv-c-text)">Write                   // 010</text>
      <text x="430" y="164" font-size="11" fill="var(--d-rv-c-text)">Execute                 // 100</text>
      <text x="404" y="184" font-size="11" fill="var(--d-rv-c-text)">)</text>
      <text x="514" y="205" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点：`1 << iota` 适合权限和标志位</text>
    </svg>

    <svg
      v-else-if="kind === 'value-semantics'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="值语义与共享底层数据示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 只有值拷贝，但有些值里带指针，所以会共享底层数据</text>

      <rect x="16" y="40" width="352" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="192" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">数组 / 纯值 struct：拷贝后各走各的</text>
      <rect x="36" y="84" width="120" height="54" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="96" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">a = [1 2 3]</text>
      <text x="96" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">完整拷贝</text>
      <text x="180" y="112" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="228" y="84" width="120" height="54" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="288" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">b = [1 2 3]</text>
      <text x="288" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">改 b 不影响 a</text>
      <line x1="96" y1="154" x2="96" y2="204" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <line x1="288" y1="154" x2="288" y2="204" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <rect x="48" y="208" width="96" height="22" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="96" y="223" text-anchor="middle" font-size="9" fill="var(--d-text)">a[0] 仍是 1</text>
      <rect x="240" y="208" width="96" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="288" y="223" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">b[0] 改成 99</text>

      <rect x="392" y="40" width="352" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="568" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">slice / map / chan：拷贝的是描述符，底层数据仍共享</text>
      <rect x="420" y="84" width="110" height="54" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="475" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">u1.Roles</text>
      <text x="475" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">ptr len cap</text>
      <text x="548" y="112" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="588" y="84" width="110" height="54" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="643" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">u2.Roles</text>
      <text x="643" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ptr len cap</text>
      <text x="568" y="154" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓ 都指向同一底层数组 ↓</text>
      <rect x="474" y="172" width="188" height="38" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="568" y="188" text-anchor="middle" font-size="10" fill="var(--d-text)">["user"]</text>
      <text x="568" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">改 u2.Roles[0]，u1 也会看到变化</text>
      <text x="568" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">重点：不是“引用传递”，而是“值里带了共享指针”</text>
    </svg>

    <svg
      v-else-if="kind === 'slice-append-trap'"
      viewBox="0 0 760 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="slice append 污染原数组与三指切片保护图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">append 只有在容量不够时才分配新内存</text>

      <rect x="16" y="40" width="352" height="230" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="192" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">二下标切片：append 可能污染原数组</text>
      <rect x="46" y="88" width="50" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="71" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">0</text>
      <rect x="98" y="88" width="50" height="32" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="123" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">1</text>
      <rect x="150" y="88" width="50" height="32" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="175" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">2</text>
      <rect x="202" y="88" width="50" height="32" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="227" y="108" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">3</text>
      <rect x="254" y="88" width="50" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="279" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">4</text>
      <text x="192" y="140" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">s := original[1:3]  => len=2, cap=4</text>
      <line x1="123" y1="124" x2="123" y2="154" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="175" y1="124" x2="175" y2="154" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="112" y="156" width="126" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="175" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">s = [1 2]</text>
      <text x="175" y="206" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">append(s, 99)</text>
      <text x="175" y="224" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
      <rect x="112" y="232" width="126" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="175" y="248" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">直接把 99 写进原数组尾部可见区域</text>

      <rect x="392" y="40" width="352" height="230" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="568" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">三指切片：锁死 cap，逼迫 append 扩容</text>
      <rect x="422" y="88" width="50" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="447" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">0</text>
      <rect x="474" y="88" width="50" height="32" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="499" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">1</text>
      <rect x="526" y="88" width="50" height="32" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="551" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">2</text>
      <rect x="578" y="88" width="50" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="603" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">3</text>
      <rect x="630" y="88" width="50" height="32" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="655" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">4</text>
      <text x="568" y="140" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">safe := original[1:3:3]  => len=2, cap=2</text>
      <rect x="488" y="156" width="126" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="551" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">safe = [1 2]</text>
      <text x="551" y="206" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">append(safe, 100)</text>
      <text x="551" y="224" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
      <rect x="458" y="232" width="186" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="551" y="248" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">分配新数组后再追加，original 保持不变</text>
    </svg>

    <svg
      v-else-if="kind === 'string-byte-rune'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="string、[]byte 与 []rune 的关系图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">string / []byte / []rune：语义不同，适用场景也不同</text>

      <rect x="16" y="40" width="230" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="131" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">string</text>
      <rect x="42" y="80" width="178" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="131" y="101" text-anchor="middle" font-size="11" fill="var(--d-text)">只读字节序列</text>
      <text x="131" y="117" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合标签、键值、日志、最终输出</text>
      <text x="131" y="150" text-anchor="middle" font-size="11" fill="var(--d-text)">"你" 在 UTF-8 下占 3 个字节</text>
      <rect x="56" y="166" width="44" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="78" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">e4</text>
      <rect x="108" y="166" width="44" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="130" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">bd</text>
      <rect x="160" y="166" width="44" height="24" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="182" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">a0</text>
      <text x="131" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`len(s)` 返回字节数，不是字符数</text>

      <rect x="264" y="40" width="230" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="379" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">[]byte</text>
      <rect x="290" y="80" width="178" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="379" y="101" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">可变字节切片</text>
      <text x="379" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">适合协议、文件、网络流、编码结果</text>
      <text x="379" y="152" text-anchor="middle" font-size="11" fill="var(--d-text)">可以按字节追加</text>
      <text x="379" y="170" text-anchor="middle" font-size="11" fill="var(--d-text)">`append(dst, s...)` 可直接复制 string 字节</text>
      <text x="379" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">适合“按字节处理”，不适合按中文字符索引修改</text>

      <rect x="512" y="40" width="230" height="210" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="627" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">[]rune</text>
      <rect x="538" y="80" width="178" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="627" y="101" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Unicode 码点切片</text>
      <text x="627" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">适合按“第几个字符”改中文文本</text>
      <text x="627" y="152" text-anchor="middle" font-size="11" fill="var(--d-text)">[]rune("你") => ['你']</text>
      <text x="627" y="170" text-anchor="middle" font-size="11" fill="var(--d-text)">长度是 1 个 rune</text>
      <text x="627" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`for range string` 也是按 rune 解码，但 index 是字节偏移</text>
    </svg>

    <svg
      v-else-if="kind === 'defer-panic'"
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="defer、panic 和 recover 示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">defer 是栈，panic 会沿调用栈展开，recover 只能在 defer 中生效</text>

      <rect x="16" y="40" width="230" height="240" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="131" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">defer：后进先出</text>
      <rect x="78" y="90" width="106" height="28" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="131" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">defer #1</text>
      <rect x="78" y="124" width="106" height="28" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="131" y="142" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">defer #2</text>
      <rect x="78" y="158" width="106" height="28" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="131" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">defer #3</text>
      <text x="131" y="204" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">函数返回时</text>
      <text x="131" y="224" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
      <text x="131" y="244" text-anchor="middle" font-size="11" fill="var(--d-text)">执行顺序：#3 → #2 → #1</text>

      <rect x="264" y="40" width="230" height="240" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="379" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">panic：沿调用栈向上展开</text>
      <rect x="316" y="92" width="126" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="379" y="113" text-anchor="middle" font-size="10" fill="var(--d-text)">main()</text>
      <rect x="316" y="140" width="126" height="34" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="379" y="161" text-anchor="middle" font-size="10" fill="var(--d-text)">service()</text>
      <rect x="316" y="188" width="126" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="379" y="209" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">panic()</text>
      <text x="464" y="210" font-size="14" fill="var(--d-text-sub)">↑</text>
      <text x="464" y="194" font-size="14" fill="var(--d-text-sub)">↑</text>
      <text x="464" y="178" font-size="14" fill="var(--d-text-sub)">↑</text>
      <text x="379" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">展开过程中会先执行当前栈帧里的 defer</text>

      <rect x="512" y="40" width="232" height="240" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="628" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">recover：只能写在 defer 里</text>
      <rect x="544" y="100" width="168" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="628" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">defer func() {</text>
      <text x="628" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">  if r := recover(); r != nil { ... }</text>
      <text x="628" y="168" text-anchor="middle" font-size="11" fill="var(--d-text)">命中后：拦下 panic，当前 goroutine 继续</text>
      <text x="628" y="190" text-anchor="middle" font-size="11" fill="var(--d-text)">没写在 defer 里：recover() 返回 nil</text>
      <text x="628" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">recover 也只能恢复当前 goroutine，不能跨 goroutine 抓 panic</text>
    </svg>

    <svg
      v-else-if="kind === 'closure-capture'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="闭包捕获循环变量示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">闭包捕获的是变量，不是值快照</text>

      <rect x="16" y="40" width="352" height="220" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="192" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">经典陷阱：多个闭包共享同一个 i</text>
      <rect x="144" y="84" width="96" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="192" y="100" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">循环变量 i</text>
      <text x="192" y="116" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最终变成 5</text>
      <line x1="192" y1="124" x2="92" y2="162" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <line x1="192" y1="124" x2="192" y2="162" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <line x1="192" y1="124" x2="292" y2="162" stroke="var(--d-warn-border)" stroke-width="1.3" />
      <rect x="42" y="162" width="100" height="34" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="92" y="183" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">func() { fmt.Println(i) }</text>
      <rect x="142" y="162" width="100" height="34" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="192" y="183" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">func() { fmt.Println(i) }</text>
      <rect x="242" y="162" width="100" height="34" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="292" y="183" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">func() { fmt.Println(i) }</text>
      <text x="192" y="228" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">Go 1.22 之前尤其容易在 goroutine / defer 里踩中</text>

      <rect x="392" y="40" width="352" height="220" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="568" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">修复：参数传值，给每次迭代一个独立副本</text>
      <rect x="426" y="104" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="471" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">go func(n int)</text>
      <rect x="524" y="104" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="569" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">go func(n int)</text>
      <rect x="622" y="104" width="90" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="667" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">go func(n int)</text>
      <text x="471" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">n = 0</text>
      <text x="569" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">n = 1</text>
      <text x="667" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">n = 2</text>
      <text x="568" y="206" text-anchor="middle" font-size="11" fill="var(--d-text)">每个闭包读自己的参数副本，而不是共享外部 i</text>
    </svg>

    <svg
      v-else-if="kind === 'interface-nil'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="interface nil 陷阱示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">interface 是否为 nil，要看“类型指针”和“数据指针”是否都为空</text>

      <rect x="16" y="40" width="352" height="200" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="192" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">真正的 nil interface</text>
      <rect x="74" y="96" width="100" height="54" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="124" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">type = nil</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">data = nil</text>
      <text x="192" y="126" font-size="14" fill="var(--d-text-sub)">+</text>
      <rect x="210" y="96" width="100" height="54" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="260" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">两者都空</text>
      <text x="260" y="132" text-anchor="middle" font-size="10" fill="var(--d-text)">i == nil</text>
      <text x="192" y="198" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">空接口 eface、非空接口 iface 都遵守这个判断本质</text>

      <rect x="392" y="40" width="352" height="200" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="568" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">陷阱：把“具体类型的 nil 指针”装进接口</text>
      <rect x="430" y="96" width="100" height="54" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="480" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">type = *MyError</text>
      <text x="480" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">非空</text>
      <text x="548" y="126" font-size="14" fill="var(--d-text-sub)">+</text>
      <rect x="566" y="96" width="100" height="54" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="616" y="116" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">data = nil</text>
      <text x="616" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">指针为空</text>
      <text x="568" y="182" text-anchor="middle" font-size="11" fill="var(--d-text)">结果：error 接口本身不为 nil</text>
      <text x="568" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此 error 返回值里不要返回“带类型信息的 nil 指针”，直接 return nil</text>
    </svg>

    <svg
      v-else-if="kind === 'reflect-settable'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="reflect 可设置性示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">反射能不能改值，关键看：是不是指针，Elem() 之后 CanSet() 是否为 true</text>

      <rect x="20" y="44" width="720" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="36" y="92" width="110" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="91" y="117" text-anchor="middle" font-size="10" fill="var(--d-text)">obj</text>
      <text x="166" y="117" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="196" y="92" width="130" height="42" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="261" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">reflect.ValueOf(obj)</text>
      <text x="261" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">先拿到反射值</text>
      <text x="346" y="117" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="376" y="80" width="138" height="66" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="445" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">如果 obj 是指针</text>
      <text x="445" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">v.Elem()</text>
      <text x="445" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">进入真正的 struct 值</text>
      <text x="534" y="117" font-size="14" fill="var(--d-text-sub)">→</text>
      <rect x="564" y="80" width="148" height="66" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="638" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">FieldByName / Index</text>
      <text x="638" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">CanSet() == true ?</text>
      <text x="638" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">true 才能 Set</text>
      <text x="380" y="184" text-anchor="middle" font-size="10" fill="var(--d-text)">传值而不是指针：拿到的是副本，只能读，不能改</text>
      <text x="380" y="204" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">TypeOf 看类型与 tag，ValueOf 看值；修改必须沿着“指针 → Elem → 可设置字段”走</text>
    </svg>

    <svg
      v-else-if="kind === 'generics-constraint'"
      viewBox="0 0 720 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="泛型类型参数与约束示意图"
      role="img"
    >
      <text x="360" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">泛型 = 类型参数 + 约束，编译期检查，不是运行时反射替代品</text>

      <rect x="20" y="42" width="680" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="46" y="90" width="164" height="58" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="128" y="112" text-anchor="middle" font-size="10" fill="var(--d-text)">func Sum[T Number](nums []T) T</text>
      <text x="128" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">T 是类型参数</text>

      <text x="230" y="118" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="270" y="78" width="180" height="82" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="360" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">constraint：Number</text>
      <text x="360" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">~int | ~int64 | ~float64 ...</text>
      <text x="360" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">只有满足约束的类型才能代入</text>

      <text x="470" y="118" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="510" y="78" width="164" height="82" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="592" y="102" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">调用点实例化</text>
      <text x="592" y="120" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Sum([]int{1,2,3})</text>
      <text x="592" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Sum([]float64{1.1,2.2})</text>

      <text x="360" y="198" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`comparable` 适合 map key / set；泛型更适合容器和算法，业务多态仍常用接口</text>
    </svg>

    <svg
      v-else-if="kind === 'error-chain'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="错误链与分层处理示意图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">错误处理的主线：底层产出错误，中间层加上下文，上层用 Is/As 做决策</text>

      <rect x="20" y="44" width="720" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="46" y="94" width="150" height="54" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="121" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">底层</text>
      <text x="121" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">ErrNotFound / *ValidationError</text>

      <text x="216" y="122" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="256" y="82" width="190" height="78" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="351" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">中间层包装</text>
      <text x="351" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">fmt.Errorf("getUserProfile: %w", err)</text>
      <text x="351" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保留原错误链 + 新上下文</text>

      <text x="466" y="122" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="506" y="82" width="208" height="78" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="610" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">上层决策</text>
      <text x="610" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">errors.Is(err, ErrNotFound)</text>
      <text x="610" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">errors.As(err, &ve)</text>

      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text)">不要每一层都打日志；真正做用户响应或告警的边界层再统一处理</text>
      <text x="380" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Sentinel error 适合已知状态，自定义错误适合携带结构化信息</text>
    </svg>

    <svg
      v-else-if="kind === 'builder-flow'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="strings.Builder 构建流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">strings.Builder：内部先积累 []byte，String() 再把这段内容作为只读字符串暴露</text>

      <rect x="20" y="44" width="720" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <rect x="44" y="86" width="150" height="54" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="119" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">WriteString / WriteByte</text>
      <text x="119" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不断追加</text>

      <text x="214" y="118" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="254" y="72" width="206" height="82" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="357" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Builder 内部 buf []byte</text>
      <text x="357" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">['u' 's' 'e' 'r' '=' 'a' 'l' 'i' 'c' 'e']</text>
      <text x="357" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">尽量在同一块缓冲区上增长</text>

      <text x="480" y="118" font-size="14" fill="var(--d-text-sub)">→</text>

      <rect x="520" y="86" width="196" height="54" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="618" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">String()</text>
      <text x="618" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">返回最终 string 视图</text>

      <text x="380" y="184" text-anchor="middle" font-size="10" fill="var(--d-text)">重点 1：适合“最终结果就是字符串”的高频拼接</text>
      <text x="380" y="202" text-anchor="middle" font-size="10" fill="var(--d-text)">重点 2：不要复制一个非零值 Builder，否则会共享内部状态</text>
      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果主要处理的是字节流和 I/O 缓冲，更通用的工具仍然是 bytes.Buffer</text>
    </svg>

    <svg
      v-else-if="kind === 'fmt-printf-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="fmt Printf 格式化流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`fmt.Printf/Fprintf/Sprintf` 的主线是：拿到一个 `pp`，扫描格式串，优先走接口方法，再退回到反射分派</text>

      <rect x="28" y="90" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">fmt.Fprintf</text>
      <text x="87" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">w, format, args</text>

      <line x1="146" y1="114" x2="240" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="240" y="70" width="150" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="315" y="92" text-anchor="middle" font-size="11" fill="var(--d-text)">pp from sync.Pool</text>
      <text x="315" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内部带 `buf []byte`</text>
      <text x="315" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免每次都新建状态机</text>
      <text x="315" y="142" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">开始 doPrintf</text>

      <line x1="390" y1="114" x2="486" y2="114" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="486" y="58" width="132" height="112" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="552" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">扫描格式串</text>
      <text x="552" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">普通字节直接写 buf</text>
      <text x="552" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">遇到 `%` 解析 verb</text>
      <text x="552" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">取下一个参数</text>
      <text x="552" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">检查 flags/width/precision</text>

      <line x1="618" y1="114" x2="714" y2="96" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="618" y1="114" x2="714" y2="132" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="614" y="74" width="118" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="673" y="95" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Formatter/Stringer/error</text>
      <rect x="614" y="118" width="118" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="673" y="139" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">否则走 reflect.Kind 分支</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`Fprintf` 直接写 `io.Writer`；`Sprintf` 最后还要把内部缓冲转成 string，所以热路径里常被 `strconv.AppendXxx` 和手工拼接替代</text>
    </svg>

    <svg
      v-else-if="kind === 'strconv-append'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="strconv AppendXxx 零分配图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`strconv.AppendXxx` 的价值在于：直接把格式化结果追加到现有 `[]byte`，绕开 `fmt.Sprintf` 的反射和中间字符串分配</text>

      <rect x="28" y="84" width="170" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="113" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">预分配 buf</text>
      <text x="113" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">make([]byte, 0, 64)</text>
      <text x="113" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">持续复用同一块切片</text>

      <line x1="198" y1="119" x2="308" y2="119" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="308" y="68" width="146" height="102" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="381" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">AppendInt / Float / Bool</text>
      <text x="381" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">直接把字符写进 buf</text>
      <text x="381" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合 CSV / JSON / 日志 ID</text>
      <text x="381" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">热路径零中间字符串</text>
      <text x="381" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最后再一次 `string(buf)`</text>

      <line x1="454" y1="119" x2="564" y2="100" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="454" y1="119" x2="564" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="564" y="76" width="168" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="648" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">高频场景：批量拼接数字字段</text>
      <rect x="564" y="122" width="168" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="648" y="144" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">低频场景：可读性优先仍可用 Format/Itoa</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">不是所有地方都要抠这点分配，但一旦你已经在 `[]byte` 链路里，就没必要再绕去 `Sprintf` 造临时 string</text>
    </svg>

    <svg
      v-else-if="kind === 'utf8-decode'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="UTF-8 解码与校验图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">UTF-8 解码的核心是：先看首字节决定宽度，再验证后续字节是否都是 `10xxxxxx`；非法序列立刻退化成 `RuneError`</text>

      <rect x="28" y="78" width="132" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="94" y="99" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">首字节</text>
      <text x="94" y="117" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">0xxxxxxx / 110xxxxx / ...</text>

      <line x1="160" y1="105" x2="276" y2="105" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="276" y="58" width="208" height="94" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">utf8.DecodeRune</text>
      <text x="380" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">查表决定预期宽度 1/2/3/4</text>
      <text x="380" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">验证续字节是否 `10xxxxxx`</text>
      <text x="380" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">合法则拼成 rune，非法则返回 RuneError</text>

      <line x1="484" y1="105" x2="594" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="484" y1="105" x2="594" y2="124" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="594" y="66" width="138" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="663" y="88" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">合法：返回 (rune, size)</text>
      <rect x="594" y="110" width="138" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="663" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">非法：返回 (RuneError, 1)</text>

      <rect x="142" y="184" width="476" height="28" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`for range string` 本质上就是不断调用这套逻辑；而按字节截断时，`RuneStart` 的作用就是帮你回退到一个合法起始边界</text>
    </svg>

    <svg
      v-else-if="kind === 'regexp-engine'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="regexp 编译与执行流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 正则的主线是：先把模式编译成语法树和指令流，再由 onepass / backtrack / Thompson NFA 中最合适的执行器去跑</text>

      <rect x="24" y="88" width="126" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">regexp.Compile</text>
      <text x="87" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">"a(b|c)+d"</text>

      <line x1="150" y1="112" x2="250" y2="112" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="250" y="66" width="172" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="336" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">regexp/syntax</text>
      <text x="336" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Parse -> AST</text>
      <text x="336" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Compile -> Prog 指令流</text>
      <text x="336" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">顺便预计算 prefix / onepass 条件</text>

      <line x1="422" y1="112" x2="520" y2="112" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="520" y="56" width="212" height="112" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="626" y="80" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">执行器选择</text>
      <text x="626" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">onepass：无歧义时最快</text>
      <text x="626" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">backtrack：短输入优化</text>
      <text x="626" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Thompson NFA：通用兜底</text>
      <text x="626" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">保证线性时间，不做 PCRE 式指数回溯</text>

      <rect x="154" y="194" width="452" height="30" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="213" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">这也是 Go 不支持反向引用和 lookaround 的原因之一：换来的是可证明的线性时间上界，而不是更花哨但可被 ReDoS 打爆的能力集</text>
    </svg>

    <svg
      v-else-if="kind === 'pdqsort-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="pdqsort 选择流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">pdqsort 不是“永远快排”，而是一个带退化检测的混合排序器：小数组走插入排序，正常路径走快排，退化时切到堆排保底</text>

      <rect x="34" y="90" width="116" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">pdqsort(x)</text>
      <text x="92" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">sort / slices.Sort</text>

      <line x1="150" y1="114" x2="250" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="250" y="60" width="140" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="320" y="82" text-anchor="middle" font-size="11" fill="var(--d-text)">分支判断</text>
      <text x="320" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">len <= 小阈值</text>
      <text x="320" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">选主元：median / ninther</text>
      <text x="320" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">三路 partition</text>
      <text x="320" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录 bad pivot 次数</text>

      <line x1="390" y1="114" x2="500" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="390" y1="114" x2="500" y2="114" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="390" y1="114" x2="500" y2="142" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="500" y="68" width="190" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="595" y="89" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">小切片：插入排序，缓存更友好</text>
      <rect x="500" y="106" width="190" height="32" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="595" y="127" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">正常：快排递归，平均 O(n log n)</text>
      <rect x="500" y="144" width="190" height="32" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="595" y="165" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">退化太多次：切堆排，最坏 O(n log n)</text>

      <rect x="152" y="194" width="456" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="213" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">所以 Go 里的默认不稳定排序既保住了快排的平均速度，也避免了“几乎有序 / 重复值很多 / 恶意输入”把复杂度拖成 O(n²)</text>
    </svg>

    <svg
      v-else-if="kind === 'generic-stdlib-trio'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="slices maps cmp 泛型标准库三件套图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 1.21 之后的 `slices / maps / cmp` 是一套配合使用的泛型工具链：容器操作、比较规则和排序搜索语义终于在标准库里对齐了</text>

      <rect x="24" y="64" width="220" height="144" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="134" y="88" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">slices</text>
      <text x="134" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Sort / SortFunc / BinarySearch</text>
      <text x="134" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Delete / Insert / Compact / Clip</text>
      <text x="134" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">类型安全，替代 sort.Slice 反射风格</text>

      <rect x="270" y="64" width="220" height="144" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="88" text-anchor="middle" font-size="12" fill="var(--d-text)">maps</text>
      <text x="380" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Keys / Values / Clone / Copy</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Equal / DeleteFunc</text>
      <text x="380" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">把常见样板逻辑拉回标准库</text>

      <rect x="516" y="64" width="220" height="144" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="626" y="88" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">cmp</text>
      <text x="626" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Compare / Less / Or</text>
      <text x="626" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">为排序、二分、三目式兜底提供统一比较语义</text>
      <text x="626" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">和泛型约束 `cmp.Ordered` 配套</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">新代码优先用这套泛型 API；只有在兼容老版本或必须走 `sort.Interface`/自定义容器接口时，才回到旧写法</text>
    </svg>

    <svg
      v-else
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="默认语言图例占位"
      role="img"
    >
      <rect x="20" y="20" width="720" height="220" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="132" text-anchor="middle" font-size="14" fill="var(--d-text)">Unknown diagram kind</text>
    </svg>
  </DiagramFrame>
</template>
