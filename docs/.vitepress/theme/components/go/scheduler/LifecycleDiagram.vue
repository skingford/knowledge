<template>
  <svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" aria-label="Goroutine 生命周期图" role="img">
    <text x="260" y="20" text-anchor="middle" font-size="12" fill="var(--d-text-muted)">go func()</text>
    <text x="260" y="36" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="190" y="45" width="140" height="42" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="260" y="71" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Runnable</text>
    <text x="260" y="100" font-size="12" text-anchor="middle" fill="var(--d-text-sub)">↓ 被 P 调度执行</text>
    <rect x="190" y="112" width="140" height="42" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="260" y="138" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-c-text)">Running</text>
    <text x="140" y="100" font-size="11" text-anchor="end" fill="var(--d-text-muted)">被抢占 /</text>
    <text x="140" y="115" font-size="11" text-anchor="end" fill="var(--d-text-muted)">Gosched()</text>
    <text x="155" y="80" font-size="14" fill="var(--d-text-sub)">↗</text>
    <text x="340" y="138" font-size="11" fill="var(--d-text-sub)">→</text>
    <text x="356" y="128" font-size="10" fill="var(--d-text-muted)">I/O / Chan</text>
    <text x="356" y="142" font-size="10" fill="var(--d-text-muted)">Lock / Sleep</text>
    <rect x="420" y="112" width="95" height="42" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="467" y="138" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-warn-text)">Waiting</text>
    <text x="420" y="85" font-size="10" fill="var(--d-text-muted)">I/O 就绪 / 收到数据 / 解锁</text>
    <text x="380" y="70" font-size="14" fill="var(--d-text-sub)">↗</text>
    <text x="260" y="168" font-size="12" text-anchor="middle" fill="var(--d-text-sub)">↓ 函数返回 / panic</text>
    <rect x="205" y="180" width="110" height="42" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="260" y="206" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text-muted)">Dead</text>
  </svg>
</template>
