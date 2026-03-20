<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind = 'slice-header' | 'slice-shared-array' | 'map-hmap' | 'map-grow' | 'channel-hchan'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'slice-header': '600px',
  'slice-shared-array': '600px',
  'map-hmap': '620px',
  'map-grow': '600px',
  'channel-hchan': '640px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
          v-if="kind === 'slice-header'" viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图1 SliceHeader 与底层数组</text>
      <!-- SliceHeader struct -->
      <rect x="30" y="50" width="160" height="120" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="110" y="44" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">SliceHeader</text>
      <!-- Data field -->
      <rect x="42" y="60" width="136" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="79" text-anchor="middle" font-size="11" fill="var(--d-text)">Data  →</text>
      <!-- Len field -->
      <rect x="42" y="96" width="136" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="115" text-anchor="middle" font-size="11" fill="var(--d-text)">Len = 3</text>
      <!-- Cap field -->
      <rect x="42" y="132" width="136" height="28" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="110" y="151" text-anchor="middle" font-size="11" fill="var(--d-text)">Cap = 5</text>
      <!-- Arrow from Data to array -->
      <line x1="178" y1="74" x2="260" y2="74" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#arrBlueS1)"/>
      <!-- Underlying array -->
      <text x="395" y="44" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">底层数组</text>
      <!-- Used cells (0,1,2) -->
      <rect x="270" y="56" width="60" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="300" y="79" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">10</text>
      <rect x="330" y="56" width="60" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="360" y="79" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">20</text>
      <rect x="390" y="56" width="60" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="420" y="79" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">30</text>
      <!-- Unused cells (3,4) -->
      <rect x="450" y="56" width="60" height="36" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="480" y="79" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">—</text>
      <rect x="510" y="56" width="60" height="36" rx="0" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="540" y="79" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">—</text>
      <!-- Index labels -->
      <text x="300" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[0]</text>
      <text x="360" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[1]</text>
      <text x="420" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[2]</text>
      <text x="480" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[3]</text>
      <text x="540" y="105" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[4]</text>
      <!-- Len bracket -->
      <line x1="270" y1="120" x2="270" y2="130" stroke="var(--d-green)" stroke-width="1.5"/>
      <line x1="270" y1="130" x2="450" y2="130" stroke="var(--d-green)" stroke-width="1.5"/>
      <line x1="450" y1="120" x2="450" y2="130" stroke="var(--d-green)" stroke-width="1.5"/>
      <text x="360" y="146" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-green)">Len = 3</text>
      <!-- Cap bracket -->
      <line x1="270" y1="156" x2="270" y2="166" stroke="var(--d-orange)" stroke-width="1.5"/>
      <line x1="270" y1="166" x2="570" y2="166" stroke="var(--d-orange)" stroke-width="1.5"/>
      <line x1="570" y1="156" x2="570" y2="166" stroke="var(--d-orange)" stroke-width="1.5"/>
      <text x="420" y="182" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-orange)">Cap = 5</text>
      <!-- Note -->
      <rect x="140" y="194" width="340" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="310" y="209" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">append 超过 Cap 时触发 growslice，分配新数组并拷贝</text>
      <defs>
        <marker id="arrBlueS1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
        </marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'slice-shared-array'" viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图2 多个 Slice 共享底层数组</text>
      <!-- Underlying array -->
      <text x="300" y="50" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">底层数组</text>
      <rect x="120" y="58" width="72" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="156" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">1</text>
      <rect x="192" y="58" width="72" height="36" rx="0" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="228" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-cur-text)">2</text>
      <rect x="264" y="58" width="72" height="36" rx="0" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="300" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-cur-text)">3</text>
      <rect x="336" y="58" width="72" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="372" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">4</text>
      <rect x="408" y="58" width="72" height="36" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="444" y="81" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">5</text>
      <!-- Index labels -->
      <text x="156" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[0]</text>
      <text x="228" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[1]</text>
      <text x="300" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[2]</text>
      <text x="372" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[3]</text>
      <text x="444" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">[4]</text>
      <!-- Slice a -->
      <rect x="40" y="140" width="140" height="90" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="110" y="134" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-blue)">a = []int{1,2,3,4,5}</text>
      <text x="110" y="162" text-anchor="middle" font-size="11" fill="var(--d-text)">Data →  [0]</text>
      <text x="110" y="182" text-anchor="middle" font-size="11" fill="var(--d-text)">Len = 5</text>
      <text x="110" y="202" text-anchor="middle" font-size="11" fill="var(--d-text)">Cap = 5</text>
      <!-- Arrow a → array[0] -->
      <path d="M 110,140 L 110,120 L 156,120 L 156,94" fill="none" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#arrBlueS2)"/>
      <!-- Slice b -->
      <rect x="420" y="140" width="140" height="90" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="490" y="134" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-cur-text)">b = a[1:3]</text>
      <text x="490" y="162" text-anchor="middle" font-size="11" fill="var(--d-text)">Data →  [1]</text>
      <text x="490" y="182" text-anchor="middle" font-size="11" fill="var(--d-text)">Len = 2</text>
      <text x="490" y="202" text-anchor="middle" font-size="11" fill="var(--d-text)">Cap = 4</text>
      <!-- Arrow b → array[1] -->
      <path d="M 490,140 L 490,120 L 228,120 L 228,94" fill="none" stroke="var(--d-cur-border)" stroke-width="1.5" marker-end="url(#arrOrangeS2)"/>
      <!-- Shared region highlight label -->
      <text x="264" y="245" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-orange)">b 覆盖区域（橙色）：修改 b[0] 会同时影响 a[1]</text>
      <defs>
        <marker id="arrBlueS2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
        </marker>
        <marker id="arrOrangeS2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-cur-border)"/>
        </marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'map-hmap'" viewBox="0 0 620 340" xmlns="http://www.w3.org/2000/svg">
      <text x="310" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图3 Map hmap 结构与桶</text>
      <!-- hmap struct -->
      <rect x="20" y="40" width="160" height="180" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="100" y="35" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">hmap</text>
      <rect x="32" y="50" width="136" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="100" y="67" text-anchor="middle" font-size="10" fill="var(--d-text)">count = 9</text>
      <rect x="32" y="80" width="136" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="100" y="97" text-anchor="middle" font-size="10" fill="var(--d-text)">B = 2（桶数=4）</text>
      <rect x="32" y="110" width="136" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="100" y="127" text-anchor="middle" font-size="10" fill="var(--d-text)">buckets →</text>
      <rect x="32" y="140" width="136" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="100" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">oldbuckets</text>
      <rect x="32" y="170" width="136" height="24" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="100" y="187" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">hash0（随机种子）</text>
      <!-- Arrow buckets → bucket array -->
      <line x1="168" y1="122" x2="220" y2="122" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#arrBlueM3)"/>
      <!-- Buckets array -->
      <text x="340" y="42" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">buckets（桶数组）</text>
      <!-- Bucket 0 -->
      <rect x="230" y="55" width="220" height="50" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="240" y="72" font-size="9" fill="var(--d-text-muted)">桶0</text>
      <rect x="270" y="62" width="80" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="310" y="74" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tophash[8]</text>
      <rect x="355" y="62" width="85" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="397" y="74" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">keys[8]+vals[8]</text>
      <text x="340" y="97" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">高 8 位快速比对 → 命中再精确比较 key</text>
      <!-- Bucket 1 -->
      <rect x="230" y="112" width="220" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="240" y="133" font-size="9" fill="var(--d-text-muted)">桶1</text>
      <rect x="270" y="119" width="80" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="310" y="131" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tophash[8]</text>
      <rect x="355" y="119" width="85" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="397" y="131" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">keys[8]+vals[8]</text>
      <!-- Bucket 2 (with overflow) -->
      <rect x="230" y="155" width="220" height="36" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="240" y="176" font-size="9" fill="var(--d-cur-text)">桶2</text>
      <rect x="270" y="162" width="80" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="310" y="174" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tophash[8]</text>
      <rect x="355" y="162" width="85" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="397" y="174" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">keys[8]+vals[8]</text>
      <!-- Overflow bucket -->
      <line x1="450" y1="173" x2="490" y2="173" stroke="var(--d-cur-border)" stroke-width="1.5" marker-end="url(#arrOrangeM3)"/>
      <rect x="496" y="155" width="110" height="36" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.2" stroke-dasharray="4,2"/>
      <text x="551" y="170" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">overflow 桶</text>
      <text x="551" y="183" text-anchor="middle" font-size="8" fill="var(--d-text-muted)">tophash + kv</text>
      <!-- Bucket 3 -->
      <rect x="230" y="198" width="220" height="36" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="240" y="219" font-size="9" fill="var(--d-text-muted)">桶3</text>
      <rect x="270" y="205" width="80" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="310" y="217" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tophash[8]</text>
      <rect x="355" y="205" width="85" height="16" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
      <text x="397" y="217" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">keys[8]+vals[8]</text>
      <!-- Lookup flow -->
      <rect x="90" y="260" width="440" height="60" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="310" y="280" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">查找流程</text>
      <text x="310" y="297" text-anchor="middle" font-size="10" fill="var(--d-text)">hash(key) → 低位定位桶（如 hash &amp; 0b11 = 2）→ 高 8 位 tophash 快速比对 → 精确比较 key</text>
      <text x="310" y="312" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">桶满时沿 overflow 指针继续查找</text>
      <defs>
        <marker id="arrBlueM3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)"/>
        </marker>
        <marker id="arrOrangeM3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-cur-border)"/>
        </marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'map-grow'" viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图4 Map 渐进式扩容搬迁</text>
      <!-- oldbuckets (left) -->
      <text x="120" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">oldbuckets（旧）</text>
      <!-- Old bucket 0 - already evacuated -->
      <rect x="40" y="58" width="160" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="120" y="77" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">桶0（已搬迁 ✓）</text>
      <!-- Old bucket 1 - already evacuated -->
      <rect x="40" y="94" width="160" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" stroke-dasharray="4,2"/>
      <text x="120" y="113" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">桶1（已搬迁 ✓）</text>
      <!-- Old bucket 2 - being evacuated -->
      <rect x="40" y="130" width="160" height="30" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="120" y="149" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">桶2（搬迁中…）</text>
      <!-- Old bucket 3 - pending -->
      <rect x="40" y="166" width="160" height="30" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="120" y="185" text-anchor="middle" font-size="10" fill="var(--d-text)">桶3（待搬迁）</text>
      <!-- new buckets (right) -->
      <text x="460" y="48" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">buckets（新，2× 大小）</text>
      <rect x="380" y="58" width="160" height="26" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="460" y="76" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">新桶0</text>
      <rect x="380" y="88" width="160" height="26" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="460" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">新桶1</text>
      <rect x="380" y="118" width="160" height="26" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="460" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">新桶2</text>
      <rect x="380" y="148" width="160" height="26" rx="5" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="460" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">新桶3</text>
      <rect x="380" y="178" width="160" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="460" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">新桶4（空）</text>
      <rect x="380" y="208" width="160" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="460" y="226" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">新桶5（空）</text>
      <!-- 更多新桶 -->
      <text x="460" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">… 新桶6、新桶7</text>
      <!-- Evacuation arrows -->
      <path d="M 200,145 L 375,131" fill="none" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#arrOrangeM4)"/>
      <path d="M 200,145 L 375,161" fill="none" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#arrOrangeM4)"/>
      <!-- Label on arrow -->
      <text x="290" y="128" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-orange)">rehash</text>
      <!-- Bottom note -->
      <rect x="90" y="200" width="240" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="210" y="215" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">每次写操作搬迁 1-2 个旧桶，摊平延迟</text>
      <defs>
        <marker id="arrOrangeM4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-orange)"/>
        </marker>
      </defs>
    </svg>

    <svg
          v-else-if="kind === 'channel-hchan'" viewBox="0 0 640 370" xmlns="http://www.w3.org/2000/svg">
      <text x="320" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">图5 Channel hchan 结构与收发流程</text>
      <!-- sendq (left) -->
      <text x="80" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">sendq</text>
      <text x="80" y="65" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（发送等待队列）</text>
      <rect x="30" y="75" width="100" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="80" y="95" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">sudog (G₁)</text>
      <rect x="30" y="110" width="100" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="80" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">sudog (G₂)</text>
      <text x="80" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>
      <!-- recvq (right) -->
      <text x="560" y="52" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">recvq</text>
      <text x="560" y="65" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（接收等待队列）</text>
      <rect x="510" y="75" width="100" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="560" y="95" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">sudog (G₃)</text>
      <rect x="510" y="110" width="100" height="30" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="560" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">sudog (G₄)</text>
      <text x="560" y="157" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">…</text>
      <!-- hchan center box -->
      <rect x="170" y="45" width="300" height="180" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="320" y="62" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">hchan</text>
      <!-- Ring buffer -->
      <rect x="200" y="72" width="240" height="60" rx="8" fill="var(--d-bg)" stroke="var(--d-blue-border)" stroke-width="1.5"/>
      <text x="320" y="86" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-blue)">buf（环形缓冲区）</text>
      <!-- Buffer slots -->
      <rect x="210" y="96" width="36" height="26" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="228" y="113" text-anchor="middle" font-size="10" fill="var(--d-text)">A</text>
      <rect x="250" y="96" width="36" height="26" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
      <text x="268" y="113" text-anchor="middle" font-size="10" fill="var(--d-text)">B</text>
      <rect x="290" y="96" width="36" height="26" rx="3" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5"/>
      <text x="308" y="113" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">C</text>
      <rect x="330" y="96" width="36" height="26" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="348" y="113" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">—</text>
      <rect x="370" y="96" width="36" height="26" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="388" y="113" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">—</text>
      <rect x="410" y="96" width="24" height="26" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1"/>
      <text x="422" y="113" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">…</text>
      <!-- sendx / recvx labels -->
      <path d="M 326,125 L 326,140" stroke="var(--d-orange)" stroke-width="1.5" marker-end="url(#arrOrangeC5b)"/>
      <text x="326" y="152" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-orange)">sendx</text>
      <path d="M 228,125 L 228,140" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#arrGreenC5)"/>
      <text x="228" y="152" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-green)">recvx</text>
      <!-- Other hchan fields -->
      <text x="320" y="172" text-anchor="middle" font-size="10" fill="var(--d-text)">dataqsiz=6  qcount=3</text>
      <rect x="250" y="196" width="140" height="22" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="320" y="211" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">lock（互斥锁）</text>
      <!-- Arrows sendq → hchan -->
      <line x1="130" y1="90" x2="168" y2="90" stroke="var(--d-rv-c-border)" stroke-width="1.2" stroke-dasharray="4,2"/>
      <!-- Arrows hchan → recvq -->
      <line x1="472" y1="90" x2="508" y2="90" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2"/>
      <!-- Three send paths -->
      <text x="320" y="250" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text-sub)">发送流程（加锁后）</text>
      <!-- Path 1 -->
      <rect x="20" y="264" width="180" height="40" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2"/>
      <text x="110" y="280" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-a-text)">① recvq 有等待者</text>
      <text x="110" y="296" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">直接拷贝给接收方（快路径）</text>
      <!-- Path 2 -->
      <rect x="220" y="264" width="180" height="40" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="310" y="280" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-blue)">② buf 未满</text>
      <text x="310" y="296" text-anchor="middle" font-size="9" fill="var(--d-blue)">数据入队环形缓冲区</text>
      <!-- Path 3 -->
      <rect x="420" y="264" width="200" height="40" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2"/>
      <text x="520" y="280" text-anchor="middle" font-size="9" font-weight="bold" fill="var(--d-rv-c-text)">③ buf 已满</text>
      <text x="520" y="296" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">封装 sudog 挂 sendq，gopark</text>
      <!-- Priority arrows -->
      <text x="207" y="322" text-anchor="middle" font-size="10" fill="var(--d-green)">优先级 ① → ② → ③</text>
      <line x1="115" y1="316" x2="300" y2="316" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#arrGreenC5)"/>
      <!-- Note -->
      <rect x="100" y="338" width="440" height="22" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="320" y="353" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">无缓冲 Channel：dataqsiz=0，必须发送方与接收方同时就绪，① 是唯一路径</text>
      <defs>
        <marker id="arrOrangeC5b" viewBox="0 0 10 10" refX="5" refY="9" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 5 10 L 10 0 z" fill="var(--d-orange)"/>
        </marker>
        <marker id="arrGreenC5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-green)"/>
        </marker>
      </defs>
    </svg>
  </DiagramFrame>
</template>
