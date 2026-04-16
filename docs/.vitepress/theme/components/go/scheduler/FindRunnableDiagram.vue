<template>
  <svg viewBox="0 0 520 690" xmlns="http://www.w3.org/2000/svg" aria-label="findrunnable 调度流程图" role="img">
    <rect x="170" y="10" width="180" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="260" y="33" text-anchor="middle" font-size="13" fill="var(--d-text)">① M 进入 schedule()</text>
    <text x="260" y="58" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>

    <rect x="170" y="68" width="180" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="260" y="91" text-anchor="middle" font-size="13" fill="var(--d-rv-a-text)">② findrunnable()</text>
    <text x="260" y="116" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>

    <rect x="125" y="126" width="270" height="42" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="151" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">③ 公平性检查：schedtick % 61 == 0 时先看全局队列</text>
    <text x="420" y="151" font-size="12" fill="var(--d-green)">有活 →</text>
    <text x="260" y="180" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>

    <rect x="145" y="190" width="230" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="213" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">④ runnext / 本地 runq?</text>
    <text x="395" y="213" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="238" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>

    <rect x="145" y="248" width="230" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="271" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">⑤ 全局 runq 里还有任务?</text>
    <text x="395" y="271" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="296" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>

    <rect x="145" y="306" width="230" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="329" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">⑥ netpoll 有就绪事件?</text>
    <text x="395" y="329" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="354" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>

    <rect x="145" y="364" width="230" height="36" rx="18" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="387" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">⑦ 随机偷其他 P 的本地 runq?</text>
    <text x="395" y="387" font-size="12" fill="var(--d-green)">yes →</text>
    <text x="260" y="412" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓ no</text>

    <rect x="120" y="422" width="280" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="260" y="446" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">⑧ 处理 idle GC / timer / 阻塞式 netpoll</text>
    <text x="260" y="461" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">仍无任务时 stopm 休眠，等新工作唤醒</text>

    <rect x="420" y="136" width="90" height="270" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="465" y="260" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">执行</text>
    <text x="465" y="280" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">该 G</text>

    <text x="260" y="492" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="120" y="502" width="280" height="36" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="260" y="525" text-anchor="middle" font-size="12" fill="var(--d-text)">G 运行、阻塞、让步或被抢占</text>

    <text x="260" y="564" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
      重点：偷其他 P 不是第一步，而是本地、全局、NetPoller 都没活之后的最后兜底
    </text>

    <text x="50" y="590" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↗</text>
    <text x="20" y="350" text-anchor="middle" font-size="13" fill="var(--d-text-muted)" transform="rotate(-90,20,350)">循环回到 ①</text>
  </svg>
</template>
