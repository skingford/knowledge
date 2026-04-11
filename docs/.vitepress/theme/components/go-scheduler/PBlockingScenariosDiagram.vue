<template>
  <svg viewBox="0 0 760 600" xmlns="http://www.w3.org/2000/svg" aria-label="P 阻塞场景对比图" role="img">
    <rect x="10" y="10" width="740" height="580" rx="18" fill="var(--vp-code-block-bg)" stroke="var(--vp-code-block-divider-color)" stroke-width="1.5" />
    <rect x="10" y="10" width="740" height="42" rx="18" fill="var(--vp-code-bg)" />
    <rect x="10" y="34" width="740" height="18" fill="var(--vp-code-bg)" />

    <circle cx="34" cy="31" r="5.5" fill="var(--d-rv-c-border)" opacity="0.85" />
    <circle cx="52" cy="31" r="5.5" fill="var(--d-warn-border)" opacity="0.85" />
    <circle cx="70" cy="31" r="5.5" fill="var(--d-rv-a-border)" opacity="0.85" />

    <text x="380" y="36" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">
      GMP: P 阻塞场景速记
    </text>

    <g transform="translate(30 72)">
      <rect x="0" y="0" width="700" height="110" rx="14" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <rect x="18" y="18" width="8" height="74" rx="4" fill="var(--d-rv-a-border)" />
      <text x="42" y="34" font-size="14" font-weight="700" fill="var(--d-text)">1) G 阻塞（channel / mutex / select）</text>
      <text x="42" y="60" font-size="12.5" fill="var(--vp-code-block-color)" font-family="var(--vp-font-family-mono)">
        <tspan x="42" dy="0">G blocked</tspan>
        <tspan x="42" dy="22">M + P 继续调度别的 G</tspan>
        <tspan x="42" dy="24" fill="var(--d-rv-a-text)">=&gt; P 不阻塞</tspan>
      </text>
    </g>

    <g transform="translate(30 196)">
      <rect x="0" y="0" width="700" height="110" rx="14" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <rect x="18" y="18" width="8" height="74" rx="4" fill="var(--d-rv-b-border)" />
      <text x="42" y="34" font-size="14" font-weight="700" fill="var(--d-text)">2) syscall 阻塞</text>
      <text x="42" y="60" font-size="12.5" fill="var(--vp-code-block-color)" font-family="var(--vp-font-family-mono)">
        <tspan x="42" dy="0">M blocked in syscall</tspan>
        <tspan x="42" dy="22">runtime 尝试剥离 P 给别的 M</tspan>
        <tspan x="42" dy="24" fill="var(--d-rv-b-text)">=&gt; P 通常不阻塞</tspan>
      </text>
    </g>

    <g transform="translate(30 320)">
      <rect x="0" y="0" width="700" height="126" rx="14" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <rect x="18" y="18" width="8" height="90" rx="4" fill="var(--d-warn-border)" />
      <text x="42" y="34" font-size="14" font-weight="700" fill="var(--d-text)">3) 长时间 CPU 计算 / 死循环</text>
      <text x="42" y="60" font-size="12.5" fill="var(--vp-code-block-color)" font-family="var(--vp-font-family-mono)">
        <tspan x="42" dy="0">M 持有 P 跑一个 G 很久</tspan>
        <tspan x="42" dy="22">local runq 无法及时消费</tspan>
        <tspan x="42" dy="22">本质更接近: 抢占不及时 / G 长时间独占执行</tspan>
        <tspan x="42" dy="24" fill="var(--d-warn-text)">=&gt; 现象上最像 “P 阻塞”</tspan>
      </text>
    </g>

    <g transform="translate(30 460)">
      <rect x="0" y="0" width="700" height="110" rx="14" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1.2" />
      <rect x="18" y="18" width="8" height="74" rx="4" fill="var(--d-rv-c-border)" />
      <text x="42" y="34" font-size="14" font-weight="700" fill="var(--d-text)">4) STW</text>
      <text x="42" y="60" font-size="12.5" fill="var(--vp-code-block-color)" font-family="var(--vp-font-family-mono)">
        <tspan x="42" dy="0">所有 P 被 stop</tspan>
        <tspan x="42" dy="22">这是 runtime 主动全局暂停</tspan>
        <tspan x="42" dy="24" fill="var(--d-rv-c-text)">=&gt; 不是单个 P 异常阻塞</tspan>
      </text>
    </g>
  </svg>
</template>
