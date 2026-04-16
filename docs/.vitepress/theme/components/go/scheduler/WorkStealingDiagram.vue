<template>
  <svg viewBox="0 0 680 300" xmlns="http://www.w3.org/2000/svg" aria-label="Work Stealing 查找顺序图" role="img">
    <defs>
      <marker id="ws-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-text-sub)" />
      </marker>
      <marker id="ws-steal-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-warn-text)" />
      </marker>
    </defs>

    <rect x="10" y="10" width="660" height="280" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="340" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">
      Work Stealing：先查公共区，再随机偷其他 P
    </text>

    <rect x="42" y="58" width="170" height="46" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="127" y="80" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">P1 本地队列空</text>
    <text x="127" y="96" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">runnext / runq 都没活</text>

    <line x1="127" y1="104" x2="127" y2="128" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#ws-arrow)" />

    <rect x="42" y="132" width="170" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="127" y="154" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">1. 先查 Global Queue</text>
    <text x="127" y="171" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">有活就拿一批回来执行</text>

    <line x1="127" y1="184" x2="127" y2="208" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#ws-arrow)" />

    <rect x="42" y="212" width="170" height="52" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="127" y="234" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">2. 再查 NetPoller</text>
    <text x="127" y="251" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">网络 I/O 就绪则直接唤醒 G</text>

    <text x="250" y="120" font-size="11" fill="var(--d-green)">找到任务 → 直接执行</text>
    <line x1="214" y1="118" x2="336" y2="118" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#ws-arrow)" />
    <line x1="214" y1="238" x2="336" y2="238" stroke="var(--d-green)" stroke-width="1.5" marker-end="url(#ws-arrow)" />

    <rect x="360" y="92" width="124" height="48" rx="10" fill="var(--d-green-bg, color-mix(in srgb, var(--d-green) 14%, white 86%))" stroke="var(--d-green)" stroke-width="1.5" />
    <text x="422" y="114" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-green)">P1 继续运行</text>
    <text x="422" y="130" text-anchor="middle" font-size="11" fill="var(--d-green)">不用偷别人</text>

    <line x1="212" y1="264" x2="268" y2="264" stroke="var(--d-text-sub)" stroke-width="1.5" marker-end="url(#ws-arrow)" />
    <rect x="278" y="240" width="168" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="362" y="261" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-warn-text)">3. 公共区域也没活</text>
    <text x="362" y="277" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">这时才进入 Work Stealing</text>

    <rect x="510" y="62" width="126" height="56" rx="10" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="573" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">随机探测其他 P</text>
    <text x="573" y="100" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">P2 / P3 / P4 ...</text>
    <text x="573" y="113" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">避免大家同时冲向同一个 P</text>

    <rect x="510" y="164" width="126" height="56" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="573" y="186" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">命中繁忙的 P2</text>
    <text x="573" y="202" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">本地 runq: [G3 G4 G5 G6]</text>
    <text x="573" y="215" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">通常偷走后半段任务</text>

    <line x1="446" y1="264" x2="510" y2="192" stroke="var(--d-warn-text)" stroke-width="1.8" marker-end="url(#ws-steal-arrow)" />
    <text x="470" y="218" font-size="11" fill="var(--d-warn-text)">随机选中后再偷</text>

    <line x1="510" y1="220" x2="214" y2="220" stroke="var(--d-rv-b-text)" stroke-width="1.8" marker-end="url(#ws-arrow)" />
    <text x="360" y="206" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">把一半任务搬回 P1，本地重新变忙</text>
  </svg>
</template>
