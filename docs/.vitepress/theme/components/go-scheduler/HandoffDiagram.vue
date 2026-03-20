<template>
  <svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" aria-label="阻塞 syscall 时的 P 交接图" role="img">
    <rect x="10" y="10" width="660" height="260" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="340" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Hand-off：阻塞 syscall 时的 P 交接</text>

    <rect x="40" y="60" width="150" height="52" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="115" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">G1 运行中</text>
    <text x="115" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">绑定在 M1 + P1</text>

    <text x="220" y="92" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="250" y="60" width="170" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="335" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-warn-text)">G1 发起阻塞 syscall</text>
    <text x="335" y="98" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">entersyscall()</text>

    <text x="450" y="92" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="480" y="60" width="160" height="52" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="560" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">P1 与 M1 解绑</text>
    <text x="560" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">M1 继续卡在内核态</text>

    <text x="340" y="136" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>

    <rect x="90" y="152" width="120" height="44" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="150" y="178" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">P1 空出来</text>

    <text x="228" y="178" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="270" y="146" width="150" height="56" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="345" y="170" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">空闲 M2 或新建 M</text>
    <text x="345" y="188" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">接管 P1，继续跑其他 G</text>

    <text x="440" y="178" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="470" y="146" width="160" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="550" y="170" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">P1 不闲置</text>
    <text x="550" y="188" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">服务继续并发推进</text>

    <line x1="335" y1="220" x2="335" y2="244" stroke="var(--d-border-dash)" stroke-dasharray="5 5" />
    <rect x="215" y="244" width="240" height="18" rx="9" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />
    <text x="335" y="257" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">M1 syscall 返回后，exitsyscall() 会尝试重新拿回 P；失败则把 G1 放回可运行队列</text>
  </svg>
</template>
