<!-- matches: libuv v1.48 / Node 22 LTS -->
<template>
  <svg viewBox="0 0 720 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="uv_run 事件循环七阶段环形流转图">
    <defs>
      <marker id="lu-phases-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="360" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">uv_run 事件循环 · 7 个阶段</text>
    <text x="360" y="46" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">每两阶段之间穿插 processTicksAndRejections（nextTick + microtask）</text>

    <!-- 中心说明圈 -->
    <circle cx="360" cy="248" r="58" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="360" y="240" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">uv_run</text>
    <text x="360" y="256" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">while(alive)</text>
    <text x="360" y="272" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">src/unix/core.c</text>

    <!-- 7 个阶段环形排列（时钟方向） -->
    <!-- 阶段 1: timers 顶部 -->
    <g>
      <rect x="285" y="74" width="150" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="360" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">1 · Timers</text>
      <text x="360" y="110" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_timers</text>
      <text x="360" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">到期 setTimeout / setInterval</text>
    </g>

    <!-- 阶段 2: pending 右上 -->
    <g>
      <rect x="490" y="130" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="575" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">2 · Pending</text>
      <text x="575" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_pending</text>
      <text x="575" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">上轮 EAGAIN 回流</text>
    </g>

    <!-- 阶段 3: idle 右 -->
    <g>
      <rect x="540" y="220" width="150" height="46" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="615" y="240" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">3 · Idle</text>
      <text x="615" y="256" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_idle</text>
    </g>

    <!-- 阶段 4: prepare 右下 -->
    <g>
      <rect x="490" y="300" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="575" y="320" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">4 · Prepare</text>
      <text x="575" y="336" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_prepare</text>
      <text x="575" y="348" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">polling 前钩子</text>
    </g>

    <!-- 阶段 5: io_poll 底部 -->
    <g>
      <rect x="270" y="386" width="180" height="64" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="2" />
      <text x="360" y="408" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">5 · I/O Poll  ★</text>
      <text x="360" y="424" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__io_poll</text>
      <text x="360" y="438" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">epoll_wait · 线程挂起点</text>
    </g>

    <!-- 阶段 6: check 左下 -->
    <g>
      <rect x="60" y="300" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="145" y="320" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">6 · Check</text>
      <text x="145" y="336" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_check</text>
      <text x="145" y="348" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">setImmediate 所在</text>
    </g>

    <!-- 阶段 7: closing 左上 -->
    <g>
      <rect x="60" y="130" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="145" y="150" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">7 · Closing</text>
      <text x="145" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_closing_handles</text>
      <text x="145" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">统一 close_cb</text>
    </g>

    <!-- 环形箭头连线：1→2→3→4→5→6→7→1 -->
    <path d="M 435 106 Q 500 110 505 140" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 620 182 Q 640 200 635 225" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 620 266 Q 635 285 605 302" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 535 352 Q 500 390 455 400" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 268 412 Q 225 400 215 358" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 145 298 L 145 186" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />
    <path d="M 230 140 Q 270 112 282 108" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-phases-ah)" />

    <!-- nextTick/microtask 标签 -->
    <g font-size="9" fill="var(--d-warn-text)">
      <text x="479" y="102" text-anchor="middle">⚡ ticks</text>
      <text x="646" y="198" text-anchor="middle">⚡ ticks</text>
      <text x="658" y="286" text-anchor="middle">⚡ ticks</text>
      <text x="522" y="378" text-anchor="middle">⚡ ticks</text>
      <text x="204" y="376" text-anchor="middle">⚡ ticks</text>
      <text x="168" y="246" text-anchor="middle">⚡ ticks</text>
      <text x="258" y="104" text-anchor="middle">⚡ ticks</text>
    </g>

    <!-- 左下图例 -->
    <g font-size="9" fill="var(--d-text-sub)">
      <rect x="20" y="448" width="10" height="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="36" y="457">仅此阶段会 block</text>
      <text x="160" y="457" fill="var(--d-warn-text)">⚡ ticks</text>
      <text x="200" y="457">nextTick → microtask checkpoint</text>
    </g>
  </svg>
</template>
