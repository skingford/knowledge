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
