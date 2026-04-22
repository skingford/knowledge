<!-- matches: libuv v1.48 / Node 22 LTS · uv__run_timers -->
<template>
  <svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="定时器最小堆结构 · 堆顶为最早到期">
    <defs>
      <marker id="lu-heap-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="320" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">uv_loop_t.timer_heap · 最小堆</text>
    <text x="320" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">堆顶总是最早到期的 timer · O(log n) 插入 / 弹出</text>

    <!-- 堆顶（高亮） -->
    <circle cx="320" cy="100" r="34" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="2" />
    <text x="320" y="96" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">5ms</text>
    <text x="320" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">heap_min</text>

    <!-- 第二层 -->
    <circle cx="180" cy="180" r="30" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="180" y="184" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">12ms</text>

    <circle cx="460" cy="180" r="30" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="460" y="184" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">18ms</text>

    <!-- 第三层 -->
    <circle cx="100" cy="268" r="26" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="100" y="272" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">25ms</text>

    <circle cx="230" cy="268" r="26" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="230" y="272" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">40ms</text>

    <circle cx="390" cy="268" r="26" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="390" y="272" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">22ms</text>

    <circle cx="530" cy="268" r="26" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="530" y="272" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">60ms</text>

    <!-- 连线 -->
    <g stroke="var(--d-arrow)" stroke-width="1.2" fill="none">
      <line x1="299" y1="128" x2="198" y2="156" />
      <line x1="341" y1="128" x2="442" y2="156" />
      <line x1="165" y1="205" x2="115" y2="244" />
      <line x1="195" y1="205" x2="215" y2="244" />
      <line x1="445" y1="205" x2="405" y2="244" />
      <line x1="475" y1="205" x2="515" y2="244" />
    </g>

    <!-- 右侧说明 -->
    <rect x="20" y="310" width="600" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="320" y="326" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">for (;;) { h = heap_min(); if (h-&gt;timeout &gt; loop-&gt;time) break; pop &amp; timer_cb(h); }</text>
    <text x="320" y="342" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">遇到第一个未到期就停 · 单轮复杂度 O(k log n) · k = 到期数</text>

    <!-- 弹出标识 -->
    <path d="M 360 82 Q 415 50 420 92" fill="none" stroke="var(--d-warn-border)" stroke-width="1.5" stroke-dasharray="4,2" marker-end="url(#lu-heap-ah)" />
    <text x="430" y="78" font-size="10" fill="var(--d-warn-text)" font-weight="bold">pop &amp; callback</text>
    <text x="444" y="96" font-size="9" fill="var(--d-text-muted)">触发 timer_cb</text>

    <!-- loop->time 指针 -->
    <rect x="20" y="88" width="110" height="38" rx="6" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
    <text x="75" y="104" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text)">loop-&gt;time</text>
    <text x="75" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">= 4ms (now)</text>
    <line x1="130" y1="107" x2="282" y2="100" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#lu-heap-ah)" />
  </svg>
</template>
