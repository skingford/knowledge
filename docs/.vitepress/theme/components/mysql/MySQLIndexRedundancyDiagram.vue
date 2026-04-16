<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="820px">
    <svg
      viewBox="0 0 820 540"
      xmlns="http://www.w3.org/2000/svg"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <text x="410" y="20" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">图5 联合主键下 c / ca / cb 索引组织对比</text>

      <!-- Source data -->
      <rect x="20" y="40" width="240" height="204" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <rect x="20" y="40" width="240" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="140" y="58" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">示例数据（按主键 a,b 排序）</text>

      <line x1="20" y1="94" x2="260" y2="94" stroke="var(--d-border)" stroke-width="1"/>
      <text x="70" y="84" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">a</text>
      <text x="140" y="84" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">b</text>
      <text x="210" y="84" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">c</text>
      <line x1="95" y1="68" x2="95" y2="244" stroke="var(--d-border)" stroke-width="0.8"/>
      <line x1="165" y1="68" x2="165" y2="244" stroke="var(--d-border)" stroke-width="0.8"/>

      <text x="70" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="140" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="210" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <text x="70" y="138" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="140" y="138" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="210" y="138" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="70" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="140" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>
      <text x="210" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <text x="70" y="186" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="140" y="186" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="210" y="186" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <text x="70" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="140" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="210" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="70" y="234" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="140" y="234" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="210" y="234" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>

      <!-- Explanation -->
      <rect x="280" y="40" width="520" height="92" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
      <text x="300" y="64" font-size="10" font-weight="600" fill="var(--d-text)">主键是 (a, b)，二级索引叶子项会补上“还没出现的主键列”</text>
      <text x="300" y="88" font-size="10" fill="var(--d-blue)">KEY c：显式 c，隐含 a,b，最终顺序是 (c, a, b)</text>
      <text x="300" y="108" font-size="10" fill="var(--d-orange)">KEY ca：显式 c,a，隐含 b，最终顺序仍然是 (c, a, b)</text>
      <text x="300" y="128" font-size="10" fill="var(--d-green)">KEY cb：显式 c,b，隐含 a，最终顺序才会变成 (c, b, a)</text>

      <text x="275" y="260" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-orange)">KEY c 与 KEY ca 的叶子项完全相同</text>

      <!-- KEY c -->
      <rect x="20" y="280" width="240" height="204" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <rect x="20" y="280" width="240" height="28" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2"/>
      <text x="140" y="298" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">KEY c</text>
      <text x="140" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">显式 c，隐含 a,b，最终是 (c,a,b)</text>
      <text x="70" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">c</text>
      <text x="140" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">a</text>
      <text x="210" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">b</text>
      <line x1="20" y1="350" x2="260" y2="350" stroke="var(--d-border)" stroke-width="1"/>
      <line x1="95" y1="330" x2="95" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>
      <line x1="165" y1="330" x2="165" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>

      <text x="70" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="140" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="210" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <text x="70" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="140" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="210" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="70" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="140" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="210" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="70" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="140" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="210" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>

      <text x="70" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="140" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="210" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>

      <text x="70" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>
      <text x="140" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="210" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <!-- KEY ca -->
      <rect x="290" y="280" width="240" height="204" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.2"/>
      <rect x="290" y="280" width="240" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-orange)" stroke-width="1.2"/>
      <rect x="462" y="286" width="54" height="16" rx="8" fill="var(--d-orange)"/>
      <text x="489" y="297" text-anchor="middle" font-size="8" font-weight="600" fill="white">冗余</text>
      <text x="410" y="298" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-orange)">KEY ca</text>
      <text x="410" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">显式 c,a，隐含 b，最终仍是 (c,a,b)</text>
      <text x="340" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">c</text>
      <text x="410" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">a</text>
      <text x="480" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">b</text>
      <line x1="290" y1="350" x2="530" y2="350" stroke="var(--d-border)" stroke-width="1"/>
      <line x1="365" y1="330" x2="365" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>
      <line x1="435" y1="330" x2="435" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>

      <text x="340" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="410" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="480" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <text x="340" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="410" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="480" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="340" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="410" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="480" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="340" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="410" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="480" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>

      <text x="340" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="410" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="480" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>

      <text x="340" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>
      <text x="410" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="480" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>

      <!-- KEY cb -->
      <rect x="560" y="280" width="240" height="204" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.2"/>
      <rect x="560" y="280" width="240" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-green)" stroke-width="1.2"/>
      <rect x="724" y="286" width="62" height="16" rx="8" fill="var(--d-green)"/>
      <text x="755" y="297" text-anchor="middle" font-size="8" font-weight="600" fill="white">顺序不同</text>
      <text x="680" y="298" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-green)">KEY cb</text>
      <text x="680" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">显式 c,b，隐含 a，最终变成 (c,b,a)</text>
      <text x="610" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">c</text>
      <text x="680" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">b</text>
      <text x="750" y="342" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">a</text>
      <line x1="560" y1="350" x2="800" y2="350" stroke="var(--d-border)" stroke-width="1"/>
      <line x1="635" y1="330" x2="635" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>
      <line x1="705" y1="330" x2="705" y2="484" stroke="var(--d-border)" stroke-width="0.8"/>

      <text x="610" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="680" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="750" y="370" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="610" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="680" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="750" y="392" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>

      <text x="610" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="680" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>
      <text x="750" y="414" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <text x="610" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="680" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>
      <text x="750" y="436" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>

      <text x="610" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="680" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>
      <text x="750" y="458" text-anchor="middle" font-size="9" fill="var(--d-text)">1</text>

      <text x="610" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">4</text>
      <text x="680" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">3</text>
      <text x="750" y="480" text-anchor="middle" font-size="9" fill="var(--d-text)">2</text>

      <!-- Summary -->
      <rect x="20" y="500" width="780" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2"/>
      <text x="410" y="516" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">结论：KEY c 足以支持 where c = ? order by a；只有 where c = ? order by b 才需要额外考虑 KEY cb</text>
    </svg>
  </DiagramFrame>
</template>
