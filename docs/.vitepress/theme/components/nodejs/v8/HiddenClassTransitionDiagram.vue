<!-- matches: V8 12.x / Node 22 LTS -->
<template>
  <svg viewBox="0 0 780 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HiddenClass 转换链：对象属性添加引发的 Map 转换，以及 delete 造成的 Dictionary 降级">
    <defs>
      <marker id="v8-hc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="390" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">HiddenClass（Map）转换链</text>
    <text x="390" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">同路径加字段共享 Map · delete / 字段顺序不同会分裂</text>

    <!-- 路径 A：正常初始化 a 再 b -->
    <text x="20" y="82" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">路径 A：o.a=1; o.b=2 （推荐）</text>

    <rect x="30" y="94" width="90" height="56" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="75" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">M0</text>
    <text x="75" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ }</text>
    <text x="75" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">empty</text>

    <rect x="170" y="94" width="90" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="215" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">M1</text>
    <text x="215" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ a }</text>
    <text x="215" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">+a(Smi) @16</text>

    <rect x="310" y="94" width="90" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="2" />
    <text x="355" y="116" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">M2 ★</text>
    <text x="355" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ a, b }</text>
    <text x="355" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">+b(Smi) @24</text>

    <!-- 路径 A 箭头 -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <line x1="120" y1="122" x2="168" y2="122" marker-end="url(#v8-hc-ah)" />
      <line x1="260" y1="122" x2="308" y2="122" marker-end="url(#v8-hc-ah)" />
    </g>
    <text x="144" y="114" font-size="9" fill="var(--d-text-muted)">+a</text>
    <text x="284" y="114" font-size="9" fill="var(--d-text-muted)">+b</text>

    <!-- 路径 A：第 2 个对象复用 -->
    <text x="430" y="110" font-size="10" fill="var(--d-rv-a-text)" font-weight="bold">第 2 个对象走同一路径</text>
    <text x="430" y="126" font-size="9" fill="var(--d-text-sub)">const o2 = {};</text>
    <text x="430" y="140" font-size="9" fill="var(--d-text-sub)">o2.a = 1; o2.b = 2;</text>
    <rect x="620" y="98" width="100" height="48" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="670" y="118" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">共享 M2</text>
    <text x="670" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IC 保持 Mono</text>
    <path d="M 560 134 Q 600 134 620 130" fill="none" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-hc-ah)" />

    <!-- 路径 B：顺序不同 -->
    <text x="20" y="186" font-size="11" font-weight="bold" fill="var(--d-warn-text)">路径 B：o.b=2; o.a=1 （字段顺序不同 → HiddenClass 分裂）</text>

    <rect x="30" y="200" width="90" height="56" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="75" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">M0</text>
    <text x="75" y="238" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ }</text>

    <rect x="170" y="200" width="90" height="56" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="215" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">M1'</text>
    <text x="215" y="238" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ b }</text>
    <text x="215" y="250" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">+b(Smi) @16</text>

    <rect x="310" y="200" width="90" height="56" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="355" y="222" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">M2'</text>
    <text x="355" y="238" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ b, a }</text>
    <text x="355" y="250" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">≠ M2</text>

    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <line x1="120" y1="228" x2="168" y2="228" marker-end="url(#v8-hc-ah)" />
      <line x1="260" y1="228" x2="308" y2="228" marker-end="url(#v8-hc-ah)" />
    </g>
    <text x="144" y="220" font-size="9" fill="var(--d-text-muted)">+b</text>
    <text x="284" y="220" font-size="9" fill="var(--d-text-muted)">+a</text>

    <text x="430" y="218" font-size="10" fill="var(--d-warn-text)" font-weight="bold">M2' ≠ M2</text>
    <text x="430" y="234" font-size="9" fill="var(--d-text-sub)">同样字段同样值</text>
    <text x="430" y="248" font-size="9" fill="var(--d-text-sub)">但 IC 升到 Polymorphic</text>

    <!-- 路径 C：delete 降级 -->
    <text x="20" y="292" font-size="11" font-weight="bold" fill="var(--d-cur-text)">路径 C：delete o.a （降级为 Dictionary Mode）</text>

    <rect x="30" y="306" width="90" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="75" y="328" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">M2</text>
    <text x="75" y="344" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">{ a, b }</text>
    <text x="75" y="356" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Fast Mode</text>

    <rect x="170" y="306" width="170" height="56" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="2" stroke-dasharray="4,2" />
    <text x="255" y="328" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">Dictionary Mode</text>
    <text x="255" y="344" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">HashTable · 不走 Map</text>
    <text x="255" y="356" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">属性访问慢 10×</text>

    <line x1="120" y1="334" x2="168" y2="334" stroke="var(--d-cur-border)" stroke-width="1.5" marker-end="url(#v8-hc-ah)" />
    <text x="144" y="326" font-size="9" fill="var(--d-cur-text)">delete</text>

    <text x="360" y="326" font-size="10" fill="var(--d-cur-text)" font-weight="bold">不可逆！</text>
    <text x="360" y="342" font-size="9" fill="var(--d-text-sub)">替代：o.a = undefined</text>
    <text x="360" y="356" font-size="9" fill="var(--d-text-sub)">或 new Map()</text>

    <!-- 底部对象内存布局示意 -->
    <text x="20" y="398" font-size="11" font-weight="bold" fill="var(--d-text-sub)">Fast Mode 对象内存布局</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="var(--d-text-sub)">
      <rect x="30" y="406" width="100" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="80" y="420" text-anchor="middle">Map *</text>
      <rect x="134" y="406" width="80" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="174" y="420" text-anchor="middle">a = 1</text>
      <rect x="218" y="406" width="80" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="258" y="420" text-anchor="middle">b = 2</text>
    </g>
    <text x="320" y="422" font-size="9" fill="var(--d-text-muted)">→ obj.a 编译为 load [obj+16]</text>
  </svg>
</template>
