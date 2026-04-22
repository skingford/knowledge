<!-- matches: V8 12.x / Node 22 LTS -->
<template>
  <svg viewBox="0 0 780 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="V8 堆布局：New Space（From/To）+ Old Space + Large Object Space + Code Space + Read-only Space">
    <defs>
      <marker id="v8-heap-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="390" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">V8 堆空间划分 · 5 大 Space</text>
    <text x="390" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">每 Isolate 一套堆 · 每个 Space 独立分配/GC · Page 按 1MB 分块</text>

    <!-- 外框：Heap（一个 Isolate） -->
    <rect x="20" y="64" width="740" height="320" rx="10" fill="none" stroke="var(--d-border-dash)" stroke-width="1.5" stroke-dasharray="5,3" />
    <text x="32" y="60" font-size="10" fill="var(--d-text-muted)">Isolate Heap（一个 Isolate 一份）</text>

    <!-- New Space -->
    <rect x="40" y="88" width="300" height="100" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="190" y="108" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">New Space（新生代）</text>
    <text x="190" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">短命对象 · Scavenge &lt; 1ms · --max-semi-space-size</text>

    <!-- From / To -->
    <rect x="60" y="134" width="130" height="42" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="125" y="152" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">From-Space</text>
    <text x="125" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">当前分配半区</text>
    <rect x="200" y="134" width="130" height="42" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="3,2" />
    <text x="265" y="152" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text-sub)">To-Space</text>
    <text x="265" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">GC 拷贝目标</text>

    <!-- Old Space -->
    <rect x="360" y="88" width="380" height="100" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="2" />
    <text x="550" y="108" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">Old Space（老生代）★</text>
    <text x="550" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">晋升对象 · Mark-Compact · --max-old-space-size (默认 ~1.4 ~ 2GB)</text>

    <!-- Old Space 内的 page -->
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="8" fill="var(--d-text-sub)">
      <rect x="376" y="136" width="52" height="42" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" />
      <text x="402" y="151" text-anchor="middle">Page 1</text>
      <text x="402" y="164" text-anchor="middle">1MB</text>
      <rect x="436" y="136" width="52" height="42" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" />
      <text x="462" y="151" text-anchor="middle">Page 2</text>
      <text x="462" y="164" text-anchor="middle">1MB</text>
      <rect x="496" y="136" width="52" height="42" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" />
      <text x="522" y="151" text-anchor="middle">Page 3</text>
      <rect x="556" y="136" width="52" height="42" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" />
      <text x="582" y="151" text-anchor="middle">Page 4</text>
      <rect x="616" y="136" width="52" height="42" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" />
      <text x="642" y="151" text-anchor="middle">Page 5</text>
      <text x="702" y="158" text-anchor="middle" fill="var(--d-text-muted)">…</text>
    </g>

    <!-- Large Object Space -->
    <rect x="40" y="204" width="360" height="80" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="220" y="224" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">Large Object Space</text>
    <text x="220" y="240" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">&gt; ~512KB 大对象 · 直接分配在此 · Mark but never compact</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="var(--d-text-sub)">
      <rect x="60" y="252" width="90" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" />
      <text x="105" y="267" text-anchor="middle">ArrayBuffer 2MB</text>
      <rect x="158" y="252" width="90" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" />
      <text x="203" y="267" text-anchor="middle">字符串 5MB</text>
      <rect x="256" y="252" width="90" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" />
      <text x="301" y="267" text-anchor="middle">JIT BytecodeArray</text>
    </g>

    <!-- Code Space -->
    <rect x="420" y="204" width="150" height="80" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="495" y="224" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">Code Space</text>
    <text x="495" y="242" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">JIT 生成的原生码</text>
    <text x="495" y="256" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Sparkplug / Maglev</text>
    <text x="495" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">TurboFan 输出</text>

    <!-- Read-only Space -->
    <rect x="590" y="204" width="150" height="80" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="665" y="224" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Read-only Space</text>
    <text x="665" y="242" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">启动期常量</text>
    <text x="665" y="256" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">undefined · null</text>
    <text x="665" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内置 string · 不 GC</text>

    <!-- 晋升箭头：New → Old -->
    <path d="M 340 128 Q 360 128 360 128" stroke="none" />
    <line x1="340" y1="128" x2="360" y2="128" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#v8-heap-ah)" />
    <text x="350" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">活过 2 轮 Scavenge → 晋升</text>

    <!-- GC 策略小结 -->
    <rect x="40" y="302" width="700" height="72" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="56" y="320" font-size="11" font-weight="bold" fill="var(--d-text)">GC 策略对应：</text>
    <g font-size="10" fill="var(--d-text-sub)">
      <circle cx="66" cy="337" r="4" fill="var(--d-rv-a-border)" />
      <text x="78" y="340">New Space → Scavenge（半空间拷贝，&lt; 1ms，无碎片）</text>
      <circle cx="66" cy="355" r="4" fill="var(--d-rv-b-border)" />
      <text x="78" y="358">Old Space → Mark-Compact（可 Incremental / Concurrent，典型 50~200ms）</text>
      <circle cx="450" cy="337" r="4" fill="var(--d-rv-c-border)" />
      <text x="462" y="340">Large Object Space → Mark，不 compact</text>
      <circle cx="450" cy="355" r="4" fill="var(--d-blue-border)" />
      <text x="462" y="358">Read-only Space → 从不 GC</text>
    </g>

    <!-- 调整 flag -->
    <rect x="40" y="394" width="700" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
    <text x="390" y="412" text-anchor="middle" font-size="10" fill="var(--d-warn-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">node --max-old-space-size=4096 · --max-semi-space-size=128</text>
  </svg>
</template>
