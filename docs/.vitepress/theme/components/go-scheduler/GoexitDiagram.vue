<template>
  <svg viewBox="0 0 680 230" xmlns="http://www.w3.org/2000/svg" aria-label="goexit 与 G 复用流程图" role="img">
    <rect x="10" y="10" width="660" height="210" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="340" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">goexit：G 退出与复用</text>

    <rect x="34" y="76" width="126" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="97" y="102" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">goroutine 函数返回</text>

    <text x="178" y="102" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="210" y="70" width="118" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="269" y="94" text-anchor="middle" font-size="12" fill="var(--d-text)">跳到 goexit</text>
    <text x="269" y="112" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">sched.pc 预先指向这里</text>

    <text x="346" y="102" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="378" y="58" width="148" height="82" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="452" y="82" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">执行 defer</text>
    <text x="452" y="100" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">更新统计 / 清理状态</text>
    <text x="452" y="118" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">G → _Gdead</text>

    <text x="544" y="102" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="566" y="70" width="78" height="58" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="605" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">放回</text>
    <text x="605" y="110" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">gfree 池</text>

    <text x="340" y="164" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
    <rect x="226" y="176" width="228" height="26" rx="13" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />
    <text x="340" y="193" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">下一次 newproc / gfget 可以直接复用 G 对象和栈，减少分配开销</text>
  </svg>
</template>
