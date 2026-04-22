<!-- matches: V8 12.x / Node 22 LTS -->
<template>
  <svg viewBox="0 0 780 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="InlineCache 四态状态机：Uninitialized → Monomorphic → Polymorphic → Megamorphic">
    <defs>
      <marker id="v8-ic-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="390" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">InlineCache 四态状态机</text>
    <text x="390" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">每次属性访问 / 函数调用都有一个 IC 槽 · 进 Mega 不可回</text>

    <!-- 4 个状态横向排列 -->
    <!-- Uninitialized -->
    <rect x="30" y="100" width="150" height="90" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border-dash)" stroke-width="1.5" stroke-dasharray="4,2" />
    <text x="105" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Uninitialized</text>
    <text x="105" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IC 槽空</text>
    <text x="105" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">未执行过</text>
    <text x="105" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">—</text>

    <!-- Monomorphic -->
    <rect x="210" y="100" width="150" height="90" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="2" />
    <text x="285" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">Monomorphic ★</text>
    <text x="285" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1 种 HiddenClass</text>
    <text x="285" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">直接 load [obj+offset]</text>
    <text x="285" y="178" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">最快 · 可完全 inline</text>

    <!-- Polymorphic -->
    <rect x="390" y="100" width="150" height="90" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="465" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">Polymorphic</text>
    <text x="465" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">2 ~ 4 种 HiddenClass</text>
    <text x="465" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">走小 jumptable</text>
    <text x="465" y="178" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">次快</text>

    <!-- Megamorphic -->
    <rect x="570" y="100" width="180" height="90" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="2" />
    <text x="660" y="124" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-cur-text)">Megamorphic</text>
    <text x="660" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">&gt; 4 种 HiddenClass</text>
    <text x="660" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">退回全局 hash 表查</text>
    <text x="660" y="178" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">慢 · 不可回！</text>

    <!-- 状态转换箭头 -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <line x1="180" y1="145" x2="208" y2="145" marker-end="url(#v8-ic-ah)" />
      <line x1="360" y1="145" x2="388" y2="145" marker-end="url(#v8-ic-ah)" />
      <line x1="540" y1="145" x2="568" y2="145" marker-end="url(#v8-ic-ah)" />
    </g>

    <!-- 状态转换条件 -->
    <text x="194" y="137" font-size="9" fill="var(--d-text-muted)">第一次调用</text>
    <text x="194" y="160" font-size="9" fill="var(--d-text-sub)">见到 Map_A</text>
    <text x="374" y="137" font-size="9" fill="var(--d-text-muted)">见到第 2 种</text>
    <text x="374" y="160" font-size="9" fill="var(--d-text-sub)">Map_B</text>
    <text x="554" y="137" font-size="9" fill="var(--d-text-muted)">见到第 5 种</text>
    <text x="554" y="160" font-size="9" fill="var(--d-text-sub)">Map</text>

    <!-- 单态保持箭头（自循环） -->
    <path d="M 260 100 Q 260 75 285 75 Q 310 75 310 100" fill="none" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-ic-ah)" />
    <text x="285" y="70" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">同 Map 反复命中</text>

    <!-- 不可回退提示 -->
    <path d="M 570 165 L 540 165" fill="none" stroke="var(--d-cur-border)" stroke-width="1.5" stroke-dasharray="4,2" />
    <text x="555" y="178" text-anchor="middle" font-size="12" fill="var(--d-cur-text)" font-weight="bold">✘</text>

    <!-- 下半部分：示例代码 -->
    <rect x="30" y="220" width="720" height="160" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="390" y="244" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">示例：function read(o) { return o.x }</text>

    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="var(--d-text-sub)">
      <text x="50" y="270">① read({ x: 1 })                   // 第 1 次调用</text>
      <text x="480" y="270" fill="var(--d-rv-a-text)" font-weight="bold">→ Uninitialized → Monomorphic</text>

      <text x="50" y="288">② read({ x: 2 })                   // 同形状 {x}</text>
      <text x="480" y="288" fill="var(--d-rv-a-text)" font-weight="bold">→ 仍然 Monomorphic</text>

      <text x="50" y="306">③ read({ x: 1, y: 2 })             // 新形状</text>
      <text x="480" y="306" fill="var(--d-warn-text)" font-weight="bold">→ Monomorphic → Polymorphic(2)</text>

      <text x="50" y="324">④ read({ x: 1, z: 3 })             // 第 3 种</text>
      <text x="480" y="324" fill="var(--d-warn-text)" font-weight="bold">→ Polymorphic(3)</text>

      <text x="50" y="342">⑤ read({ x: 1, q: 4 })             // 第 4 种</text>
      <text x="480" y="342" fill="var(--d-warn-text)" font-weight="bold">→ Polymorphic(4)</text>

      <text x="50" y="360">⑥ read({ x: 1, p: 5 })             // 第 5 种</text>
      <text x="480" y="360" fill="var(--d-cur-text)" font-weight="bold">→ Megamorphic · 不可回</text>
    </g>

    <text x="390" y="378" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">诊断：node --trace-ic script.js</text>
  </svg>
</template>
