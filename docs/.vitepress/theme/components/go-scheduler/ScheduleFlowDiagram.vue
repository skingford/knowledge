<template>
  <svg viewBox="0 0 520 340" xmlns="http://www.w3.org/2000/svg" aria-label="GMP 调度流程图" role="img">
    <rect x="160" y="10" width="200" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="260" y="35" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Global Queue</text>
    <text x="110" y="68" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="260" y="68" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="410" y="68" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="40" y="80" width="140" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="110" y="105" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-c-text)">P0</text>
    <rect x="60" y="115" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="110" y="134" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Local Queue</text>
    <rect x="190" y="80" width="140" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="260" y="105" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-c-text)">P1</text>
    <rect x="210" y="115" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="260" y="134" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Local Queue</text>
    <rect x="340" y="80" width="140" height="90" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="410" y="105" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-c-text)">P2</text>
    <rect x="360" y="115" width="100" height="28" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="410" y="134" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">Local Queue</text>
    <text x="110" y="192" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="260" y="192" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="410" y="192" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="40" y="200" width="140" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="110" y="223" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-b-text)">M0</text>
    <text x="110" y="240" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">(线程)</text>
    <rect x="190" y="200" width="140" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="260" y="223" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-b-text)">M1</text>
    <text x="260" y="240" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">(线程)</text>
    <rect x="340" y="200" width="140" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="410" y="223" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-rv-b-text)">M2</text>
    <text x="410" y="240" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">(线程)</text>
  </svg>
</template>
