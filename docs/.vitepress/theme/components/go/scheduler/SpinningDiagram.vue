<template>
  <svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" aria-label="Spinning 线程示意图" role="img">
    <rect x="10" y="10" width="620" height="200" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="320" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Spinning：先短暂找活，再决定休眠</text>

    <rect x="32" y="78" width="120" height="48" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="92" y="98" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">M + P</text>
    <text x="92" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">没找到可运行 G</text>

    <text x="172" y="106" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="212" y="66" width="160" height="72" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="292" y="90" text-anchor="middle" font-size="12" fill="var(--d-text)">短暂 spinning</text>
    <text x="292" y="108" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">继续看全局队列 / netpoll / steal</text>
    <text x="292" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">避免立刻睡眠带来的内核唤醒成本</text>

    <text x="394" y="86" font-size="12" fill="var(--d-green)">发现新任务</text>
    <text x="394" y="104" font-size="14" fill="var(--d-text-sub)">↗</text>
    <rect x="470" y="58" width="130" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="535" y="84" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">立刻执行 G</text>

    <text x="394" y="128" font-size="12" fill="var(--d-warn-text)">仍然没任务</text>
    <text x="394" y="146" font-size="14" fill="var(--d-text-sub)">↘</text>
    <rect x="470" y="116" width="130" height="46" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="535" y="142" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">park / 休眠</text>

    <text x="320" y="188" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">重点：runtime 只保留有限数量的 spinning 线程，目标是降低延迟，而不是让所有线程空转</text>
  </svg>
</template>
