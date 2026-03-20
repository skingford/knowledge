<template>
  <svg viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" aria-label="runnext、本地队列与全局队列关系图" role="img">
    <rect x="10" y="10" width="700" height="250" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="360" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">runnext、本地队列与全局队列</text>

    <rect x="36" y="62" width="150" height="48" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="111" y="82" text-anchor="middle" font-size="12" fill="var(--d-text)">当前 G 创建新 goroutine</text>
    <text x="111" y="98" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">go f() / goready()</text>

    <text x="210" y="90" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="250" y="56" width="120" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="310" y="79" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">runnext</text>
    <text x="310" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优先被下一次调度</text>

    <text x="387" y="90" font-size="14" fill="var(--d-text-sub)">否则 →</text>

    <rect x="430" y="46" width="150" height="76" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="505" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">P.runq</text>
    <text x="505" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">本地无锁环形队列</text>
    <text x="505" y="104" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">命中成本最低</text>

    <text x="605" y="82" font-size="12" fill="var(--d-text-sub)">满了 →</text>

    <rect x="610" y="46" width="72" height="76" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="646" y="70" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">Global</text>
    <text x="646" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">Queue</text>
    <text x="646" y="102" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">转移一部分 G</text>

    <line x1="111" y1="138" x2="646" y2="138" stroke="var(--d-border-dash)" stroke-dasharray="5 5" />
    <text x="360" y="160" text-anchor="middle" font-size="12" fill="var(--d-text)">调度器查找优先级</text>

    <rect x="60" y="176" width="120" height="38" rx="19" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="120" y="199" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">① runnext</text>

    <text x="196" y="200" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="230" y="176" width="140" height="38" rx="19" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="300" y="199" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">② 本地 runq</text>

    <text x="386" y="200" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="420" y="176" width="140" height="38" rx="19" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="490" y="199" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">③ 全局队列</text>

    <text x="576" y="200" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="590" y="176" width="90" height="38" rx="19" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="635" y="199" text-anchor="middle" font-size="12" fill="var(--d-text)">④ netpoll / steal</text>

    <text x="360" y="238" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">重点：本地优先是为了缓存局部性，全局兜底是为了公平性，偷任务是为了负载均衡</text>
  </svg>
</template>
