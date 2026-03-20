<template>
  <svg viewBox="0 0 680 260" xmlns="http://www.w3.org/2000/svg" aria-label="Work Stealing 与 Hand-off 示意图" role="img">
    <rect x="5" y="5" width="320" height="250" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="165" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Work Stealing · 工作窃取</text>
    <rect x="30" y="50" width="120" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="90" y="75" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">P1 · 空闲</text>
    <text x="165" y="75" font-size="14" fill="var(--d-text-sub)">→ 偷取一半 G →</text>
    <rect x="260" y="50" width="50" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="285" y="68" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">P2·繁忙</text>
    <text x="285" y="82" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">[G3-G6]</text>
    <text x="90" y="112" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <text x="90" y="128" font-size="11" text-anchor="middle" fill="var(--d-text-muted)">也可从全局队列取</text>
    <text x="90" y="148" font-size="14" text-anchor="middle" fill="var(--d-text-sub)">↓</text>
    <rect x="30" y="158" width="120" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="90" y="181" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">Global Queue</text>

    <rect x="355" y="5" width="320" height="250" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="515" y="30" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">Hand-off · P 交接</text>
    <rect x="380" y="50" width="130" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="445" y="68" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">M1 · syscall</text>
    <text x="445" y="82" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">阻塞</text>
    <text x="445" y="108" font-size="12" text-anchor="middle" fill="var(--d-text-sub)">↓ 交出 P</text>
    <rect x="415" y="120" width="60" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="445" y="143" text-anchor="middle" font-size="13" fill="var(--d-rv-b-text)">P</text>
    <text x="445" y="174" font-size="12" text-anchor="middle" fill="var(--d-text-sub)">↓ 绑定到</text>
    <rect x="380" y="186" width="130" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="445" y="204" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">M2 · 空闲或新建</text>
    <text x="445" y="218" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">→ 继续执行 G</text>
  </svg>
</template>
