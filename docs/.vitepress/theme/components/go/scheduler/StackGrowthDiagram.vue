<template>
  <svg viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" aria-label="Goroutine 栈扩缩容图" role="img">
    <rect x="10" y="10" width="660" height="230" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="340" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Goroutine 栈扩缩容</text>

    <rect x="40" y="60" width="120" height="120" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="100" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">当前栈</text>
    <line x1="58" y1="102" x2="142" y2="102" stroke="var(--d-border-dash)" stroke-dasharray="4 4" />
    <text x="100" y="118" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">stackguard0</text>
    <text x="100" y="146" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">函数继续压栈</text>
    <text x="100" y="164" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">SP 接近 guard</text>

    <text x="186" y="122" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="220" y="88" width="110" height="64" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="275" y="114" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">触发 morestack()</text>
    <text x="275" y="132" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">准备扩容</text>

    <text x="354" y="122" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="390" y="56" width="160" height="128" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="470" y="82" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">新栈 = 旧栈 x 2</text>
    <text x="470" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">copystack 复制内容</text>
    <text x="470" y="122" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">修复指向旧栈的指针</text>
    <text x="470" y="140" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">回到触发扩容的函数继续执行</text>

    <text x="574" y="122" font-size="14" fill="var(--d-text-sub)">→</text>

    <rect x="590" y="88" width="54" height="64" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="617" y="114" text-anchor="middle" font-size="11" fill="var(--d-text)">GC</text>
    <text x="617" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">空闲很多时</text>
    <text x="617" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">可再缩容</text>

    <text x="340" y="214" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">重点：Goroutine 栈不是一开始就给很大，而是按需增长；因此海量 G 的初始成本很低</text>
  </svg>
</template>
