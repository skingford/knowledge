<!-- matches: Node 22 LTS · InternalCallbackScope::Close -->
<template>
  <svg viewBox="0 0 820 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="process.nextTick 与 Promise microtask 在 libuv 宏任务阶段之间的清理时序">
    <defs>
      <marker id="lu-ntm-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="410" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">阶段间的 processTicksAndRejections</text>
    <text x="410" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">nextTick 队列整段先清空，每个 tick 执行后立即 microtask checkpoint</text>

    <!-- 三条泳道 -->
    <rect x="20" y="62" width="780" height="66" rx="6" fill="var(--d-blue-bg)" opacity="0.4" />
    <rect x="20" y="136" width="780" height="66" rx="6" fill="var(--d-warn-bg)" opacity="0.45" />
    <rect x="20" y="210" width="780" height="66" rx="6" fill="var(--d-rv-a-bg)" opacity="0.45" />

    <text x="30" y="82" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">libuv 宏任务阶段</text>
    <text x="30" y="96" font-size="9" fill="var(--d-text-sub)">timers / pending / poll / check …</text>

    <text x="30" y="156" font-size="11" font-weight="bold" fill="var(--d-warn-text)">process.nextTick 队列</text>
    <text x="30" y="170" font-size="9" fill="var(--d-text-sub)">先整段清空（同优先级）</text>

    <text x="30" y="230" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">Promise microtask</text>
    <text x="30" y="244" font-size="9" fill="var(--d-text-sub)">每个 nextTick 后逐个清</text>

    <!-- 时间轴 -->
    <g font-size="10" fill="var(--d-text-muted)">
      <text x="200" y="296" text-anchor="middle">t1 · timers 跑完</text>
      <text x="410" y="296" text-anchor="middle">t2 · 全部 tick/microtask 清空</text>
      <text x="620" y="296" text-anchor="middle">t3 · 进入 pending</text>
    </g>
    <line x1="30" y1="302" x2="800" y2="302" stroke="var(--d-arrow)" stroke-width="1" marker-end="url(#lu-ntm-ah)" />

    <!-- 宏任务段 A：timers -->
    <rect x="50" y="70" width="180" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="140" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">uv__run_timers</text>
    <text x="140" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">若干 setTimeout 回调</text>
    <text x="140" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">每个 cb 可能 nextTick() 或 new Promise()</text>

    <!-- nextTick 块 -->
    <rect x="240" y="144" width="70" height="50" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="275" y="164" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">tick 1</text>
    <text x="275" y="180" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">shift</text>

    <rect x="320" y="218" width="70" height="50" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="355" y="238" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">micro 1</text>
    <text x="355" y="254" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Promise.then</text>

    <rect x="400" y="144" width="70" height="50" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="435" y="164" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">tick 2</text>

    <rect x="480" y="218" width="70" height="50" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="515" y="238" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">micro 2</text>
    <text x="515" y="254" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">await 恢复</text>

    <!-- 宏任务段 B：pending -->
    <rect x="580" y="70" width="200" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="680" y="90" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">uv__run_pending</text>
    <text x="680" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">下一个宏任务阶段</text>
    <text x="680" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（I/O 回调等）</text>

    <!-- 连线：timers → tick1 → micro1 → tick2 → micro2 → pending -->
    <g stroke="var(--d-arrow)" stroke-width="1.3" fill="none">
      <path d="M 230 114 Q 250 130 250 144" marker-end="url(#lu-ntm-ah)" />
      <path d="M 310 182 Q 325 200 330 220" marker-end="url(#lu-ntm-ah)" />
      <path d="M 390 240 Q 410 220 408 194" marker-end="url(#lu-ntm-ah)" />
      <path d="M 470 184 Q 485 200 488 218" marker-end="url(#lu-ntm-ah)" />
      <path d="M 550 244 Q 580 200 590 120" marker-end="url(#lu-ntm-ah)" />
    </g>

    <!-- 警示：无限 nextTick -->
    <g>
      <rect x="240" y="106" width="310" height="22" rx="4" fill="none" stroke="var(--d-warn-border)" stroke-width="1" stroke-dasharray="3,2" />
      <text x="395" y="121" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">⚠ 无限 nextTick 循环 → 永远返回不到 libuv 下一阶段</text>
    </g>
  </svg>
</template>
