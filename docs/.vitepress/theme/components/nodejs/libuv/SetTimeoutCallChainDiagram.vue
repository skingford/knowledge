<!-- matches: libuv v1.48 / Node 22 LTS -->
<template>
  <svg viewBox="0 0 720 760" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="setTimeout 全链路调用栈 · JS / C++ / libuv / Kernel 四层">
    <defs>
      <marker id="lu-st-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="360" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">setTimeout(fn, 10) 的完整 C 层调用链</text>
    <text x="360" y="46" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">跨 JS / Node C++ / libuv / Kernel 四层，回来前先清 nextTick + microtask</text>

    <!-- 四条泳道竖线 -->
    <g stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3">
      <line x1="175" y1="72" x2="175" y2="740" />
      <line x1="355" y1="72" x2="355" y2="740" />
      <line x1="535" y1="72" x2="535" y2="740" />
    </g>

    <!-- 四个层标签 -->
    <g font-size="11" font-weight="bold">
      <rect x="10" y="70" width="160" height="24" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="90" y="86" text-anchor="middle" fill="var(--d-rv-b-text)">JS</text>
      <rect x="180" y="70" width="170" height="24" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="265" y="86" text-anchor="middle" fill="var(--d-rv-c-text)">Node C++</text>
      <rect x="360" y="70" width="170" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="445" y="86" text-anchor="middle" fill="var(--d-rv-a-text)">libuv (C)</text>
      <rect x="540" y="70" width="170" height="24" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="625" y="86" text-anchor="middle" fill="var(--d-warn-text)">Linux Kernel</text>
    </g>

    <!-- 步骤 1：JS setTimeout -->
    <rect x="14" y="108" width="152" height="48" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="90" y="128" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">setTimeout(fn, 10)</text>
    <text x="90" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">lib/internal/timers.js</text>

    <!-- 步骤 2：C++ TimerWrap.Start -->
    <rect x="184" y="170" width="162" height="48" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="265" y="190" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">TimerWrap::Start</text>
    <text x="265" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">src/timers.cc</text>

    <!-- 步骤 3：uv_timer_start -->
    <rect x="364" y="232" width="162" height="48" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="445" y="252" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv_timer_start</text>
    <text x="445" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">heap_insert(timer_heap)</text>

    <!-- 步骤 4：uv__io_poll -->
    <rect x="364" y="300" width="162" height="50" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="445" y="320" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__io_poll(t=10)</text>
    <text x="445" y="336" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">挂起 ≤ 10ms</text>

    <!-- 步骤 5：Kernel timer 到期 -->
    <rect x="544" y="364" width="162" height="50" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="625" y="384" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-warn-text)">timer 到期</text>
    <text x="625" y="400" text-anchor="middle" font-size="9" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">epoll_wait 返回</text>

    <!-- 步骤 6：uv__run_timers -->
    <rect x="364" y="428" width="162" height="48" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="445" y="448" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv__run_timers</text>
    <text x="445" y="464" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">handle-&gt;timer_cb(h)</text>

    <!-- 步骤 7：C++ OnTimeout -->
    <rect x="184" y="490" width="162" height="48" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="265" y="510" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">TimerWrap::OnTimeout</text>
    <text x="265" y="526" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MakeCallback → JS</text>

    <!-- 步骤 8：JS fn() -->
    <rect x="14" y="550" width="152" height="48" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="90" y="570" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-b-text)">fn()</text>
    <text x="90" y="586" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">用户 setTimeout 回调</text>

    <!-- 步骤 9：C++ InternalCallbackScope::Close -->
    <rect x="184" y="614" width="162" height="52" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="265" y="634" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">InternalCallbackScope</text>
    <text x="265" y="648" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">::Close（回收前钩子）</text>
    <text x="265" y="662" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">node_task_queue.cc</text>

    <!-- 步骤 10：JS nextTick + microtask -->
    <rect x="14" y="680" width="152" height="52" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="90" y="698" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-b-text)">processTicksAnd</text>
    <text x="90" y="711" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-b-text)">Rejections</text>
    <text x="90" y="724" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">nextTick → microtask</text>

    <!-- 步骤 11：libuv 下一阶段 -->
    <rect x="364" y="696" width="162" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" />
    <text x="445" y="714" text-anchor="middle" font-size="10" fill="var(--d-text)">uv__run_check / 下一轮</text>
    <text x="445" y="728" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">继续循环 ↻</text>

    <!-- 箭头连线（跨层） -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <path d="M 90 156 L 90 170 Q 90 172 180 194" marker-end="url(#lu-st-ah)" />
      <path d="M 346 194 Q 360 200 360 232 L 362 256" marker-end="url(#lu-st-ah)" />
      <path d="M 445 280 L 445 300" marker-end="url(#lu-st-ah)" />
      <path d="M 526 326 Q 550 345 542 364" marker-end="url(#lu-st-ah)" />
      <path d="M 625 414 Q 630 425 526 450" marker-end="url(#lu-st-ah)" />
      <path d="M 364 452 Q 360 470 346 502" marker-end="url(#lu-st-ah)" />
      <path d="M 184 514 Q 170 530 166 562" marker-end="url(#lu-st-ah)" />
      <path d="M 90 598 Q 90 608 184 636" marker-end="url(#lu-st-ah)" />
      <path d="M 184 640 Q 160 672 166 696" marker-end="url(#lu-st-ah)" />
      <path d="M 166 708 L 360 714" marker-end="url(#lu-st-ah)" />
    </g>

    <!-- 步骤序号 -->
    <g font-size="10" font-weight="bold" fill="var(--d-warn-text)">
      <circle cx="26" cy="120" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="26" y="124" text-anchor="middle">1</text>
      <circle cx="196" cy="182" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="196" y="186" text-anchor="middle">2</text>
      <circle cx="376" cy="244" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="376" y="248" text-anchor="middle">3</text>
      <circle cx="376" cy="312" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="376" y="316" text-anchor="middle">4</text>
      <circle cx="556" cy="376" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="556" y="380" text-anchor="middle">5</text>
      <circle cx="376" cy="440" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="376" y="444" text-anchor="middle">6</text>
      <circle cx="196" cy="502" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="196" y="506" text-anchor="middle">7</text>
      <circle cx="26" cy="562" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="26" y="566" text-anchor="middle">8</text>
      <circle cx="196" cy="626" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="196" y="630" text-anchor="middle">9</text>
      <circle cx="26" cy="692" r="9" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="26" y="696" text-anchor="middle">10</text>
    </g>
  </svg>
</template>
