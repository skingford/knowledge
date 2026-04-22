<!-- matches: V8 12.x / Node 22 LTS -->
<template>
  <svg viewBox="0 0 780 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="V8 执行管线五层：Scanner → Parser → Ignition → Sparkplug/Maglev/TurboFan">
    <defs>
      <marker id="v8-pl-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="390" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">V8 执行管线 · 从源码到机器码的五层形态</text>
    <text x="390" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">冷代码停在 Ignition · 热代码一路 tier-up 到 TurboFan · deopt 时回退</text>

    <!-- 输入：源码 -->
    <rect x="20" y="80" width="120" height="56" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="80" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">Source Code</text>
    <text x="80" y="118" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">.js 字符串</text>
    <text x="80" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">function foo(x) {...}</text>

    <!-- 阶段 1: Scanner -->
    <rect x="170" y="80" width="110" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="225" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">Scanner</text>
    <text x="225" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">词法分析</text>
    <text x="225" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ Token 流</text>

    <!-- 阶段 2: Parser -->
    <rect x="310" y="80" width="110" height="56" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="365" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">Parser</text>
    <text x="365" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">语法分析</text>
    <text x="365" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ AST · lazy</text>

    <!-- 阶段 3: Ignition -->
    <rect x="450" y="80" width="150" height="56" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="525" y="102" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">Ignition</text>
    <text x="525" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">字节码生成 + 解释执行</text>
    <text x="525" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">→ BytecodeArray + FeedbackVector</text>

    <!-- 阶段 4: Sparkplug -->
    <rect x="120" y="212" width="150" height="66" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="195" y="234" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">Sparkplug</text>
    <text x="195" y="250" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Baseline JIT · 零优化</text>
    <text x="195" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消除解释 dispatch</text>
    <text x="195" y="273" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">+10~30%</text>

    <!-- 阶段 5: Maglev -->
    <rect x="300" y="212" width="150" height="66" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="375" y="234" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">Maglev ★</text>
    <text x="375" y="250" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">V8 12.x 新增中级优化</text>
    <text x="375" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IC + 类型检查 + const fold</text>
    <text x="375" y="273" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">编译快 10× TurboFan</text>

    <!-- 阶段 6: TurboFan -->
    <rect x="480" y="212" width="200" height="66" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="2" />
    <text x="580" y="234" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">TurboFan</text>
    <text x="580" y="250" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">顶级优化 · 并发编译</text>
    <text x="580" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Inline · 类型专化 · 逃逸分析</text>
    <text x="580" y="273" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">编译 100~300ms</text>

    <!-- Deopt 回退 -->
    <rect x="130" y="324" width="540" height="48" rx="8" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5" stroke-dasharray="4,2" />
    <text x="400" y="344" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">⚠ Deoptimization · 推测失败时回退到字节码</text>
    <text x="400" y="360" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IC 从 Mono → Mega · 类型假设被打破 · 连续 deopt 放弃优化</text>

    <!-- CPU 底 -->
    <rect x="20" y="380" width="740" height="26" rx="6" fill="none" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="390" y="397" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">CPU · x86 / arm64 原生码</text>

    <!-- 水平流 -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <line x1="140" y1="108" x2="168" y2="108" marker-end="url(#v8-pl-ah)" />
      <line x1="280" y1="108" x2="308" y2="108" marker-end="url(#v8-pl-ah)" />
      <line x1="420" y1="108" x2="448" y2="108" marker-end="url(#v8-pl-ah)" />
    </g>

    <!-- Ignition → Sparkplug/Maglev/TurboFan（tier-up） -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <path d="M 500 136 Q 350 170 220 210" marker-end="url(#v8-pl-ah)" />
      <path d="M 525 136 L 395 210" marker-end="url(#v8-pl-ah)" />
      <path d="M 550 136 Q 600 170 570 210" marker-end="url(#v8-pl-ah)" />
    </g>
    <text x="260" y="180" font-size="9" fill="var(--d-text-muted)">tier-up · call-count 触发</text>

    <!-- Sparkplug → Maglev → TurboFan 横向 -->
    <g stroke="var(--d-arrow-light)" stroke-width="1.2" fill="none" stroke-dasharray="3,2">
      <line x1="270" y1="245" x2="298" y2="245" marker-end="url(#v8-pl-ah)" />
      <line x1="450" y1="245" x2="478" y2="245" marker-end="url(#v8-pl-ah)" />
    </g>

    <!-- 原生码 → CPU -->
    <line x1="195" y1="278" x2="195" y2="380" stroke="var(--d-arrow-light)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-pl-ah)" />
    <line x1="375" y1="278" x2="375" y2="380" stroke="var(--d-arrow-light)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-pl-ah)" />
    <line x1="580" y1="278" x2="580" y2="380" stroke="var(--d-arrow-light)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-pl-ah)" />
    <line x1="525" y1="136" x2="525" y2="380" stroke="var(--d-arrow-light)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-pl-ah)" />

    <!-- Deopt 箭头（从 TurboFan/Maglev 回 Ignition） -->
    <g stroke="var(--d-cur-border)" stroke-width="1.2" fill="none" stroke-dasharray="5,3">
      <path d="M 580 278 Q 640 300 635 324" marker-end="url(#v8-pl-ah)" />
      <path d="M 375 278 Q 300 300 305 324" marker-end="url(#v8-pl-ah)" />
      <path d="M 200 372 Q 400 170 500 132" marker-end="url(#v8-pl-ah)" />
    </g>
    <text x="695" y="300" font-size="9" fill="var(--d-cur-text)">deopt</text>

    <!-- 前端（Scanner/Parser/Ignition） vs 后端（JIT）分界 -->
    <rect x="160" y="60" width="450" height="96" rx="6" fill="none" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="170" y="56" font-size="9" fill="var(--d-text-muted)">前端（总是做）</text>
    <rect x="100" y="196" width="600" height="96" rx="6" fill="none" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="110" y="192" font-size="9" fill="var(--d-text-muted)">JIT 后端（按热度触发）</text>
  </svg>
</template>
