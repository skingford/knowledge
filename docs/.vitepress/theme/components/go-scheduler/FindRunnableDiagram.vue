<template>
  <svg viewBox="0 0 520 620" xmlns="http://www.w3.org/2000/svg" aria-label="findrunnable 调度流程图" role="img">
    <rect x="170" y="10" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="260" y="33" text-anchor="middle" font-size="13" fill="var(--d-text)">① M 进入 schedule()</text>
    <text x="260" y="58" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="170" y="68" width="180" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="260" y="91" text-anchor="middle" font-size="13" fill="var(--d-rv-a-text)">② findrunnable()</text>
    <text x="260" y="116" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="155" y="126" width="210" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="149" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">③ runnext / 本地 runq?</text>
    <text x="395" y="149" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="174" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>
    <rect x="135" y="184" width="250" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="207" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">④ 全局队列检查时机到?</text>
    <text x="415" y="207" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="232" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>
    <rect x="135" y="242" width="250" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="265" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">⑤ netpoll 有就绪事件?</text>
    <text x="415" y="265" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="290" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>
    <rect x="135" y="300" width="250" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="323" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">⑥ 其他 P 可偷到任务?</text>
    <text x="415" y="323" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="348" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>
    <rect x="145" y="358" width="230" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="260" y="381" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">短暂 spinning / 必要时休眠</text>
    <rect x="420" y="136" width="90" height="200" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="465" y="220" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">执行</text>
    <text x="465" y="240" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">该 G</text>
    <text x="260" y="418" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="120" y="428" width="280" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="260" y="451" text-anchor="middle" font-size="12" fill="var(--d-text)">G 运行、阻塞、让步或被抢占</text>
    <text x="50" y="480" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↗</text>
    <text x="20" y="300" text-anchor="middle" font-size="13" fill="var(--d-text-muted)" transform="rotate(-90,20,300)">循环回到 ①</text>
  </svg>
</template>
