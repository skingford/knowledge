<template>
  <svg viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" aria-label="Go 抢占式调度演进图" role="img">
    <rect x="10" y="10" width="330" height="260" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="175" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 1.13 及以前：协作式抢占</text>
    <rect x="38" y="58" width="120" height="46" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="98" y="84" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">G 长时间计算</text>
    <text x="175" y="84" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="210" y="58" width="98" height="46" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="259" y="78" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">没有函数调用</text>
    <text x="259" y="94" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">难以被抢占</text>
    <text x="175" y="126" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
    <rect x="70" y="142" width="210" height="54" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="175" y="166" text-anchor="middle" font-size="12" fill="var(--d-text)">通常要等到函数调用处检查</text>
    <text x="175" y="184" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">stackguard0 / morestack 路径</text>
    <text x="175" y="226" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">问题：纯 CPU 死循环可能长期霸占 M，拖慢调度与 STW</text>

    <rect x="380" y="10" width="330" height="260" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="545" y="34" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 1.14+：异步抢占</text>
    <rect x="404" y="58" width="78" height="46" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="443" y="84" text-anchor="middle" font-size="12" fill="var(--d-rv-b-text)">sysmon</text>
    <text x="499" y="84" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="520" y="58" width="86" height="46" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="563" y="78" text-anchor="middle" font-size="11" fill="var(--d-text)">运行超 10ms</text>
    <text x="563" y="94" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">标记抢占</text>
    <text x="626" y="84" font-size="14" fill="var(--d-text-sub)">→</text>
    <rect x="620" y="58" width="62" height="46" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="651" y="84" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">SIGURG</text>
    <text x="545" y="124" text-anchor="middle" font-size="14" fill="var(--d-text-sub)">↓</text>
    <rect x="440" y="140" width="210" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="545" y="163" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">在安全点注入 asyncPreempt</text>
    <text x="545" y="181" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">切回调度器，让其他 G 获得执行机会</text>
    <text x="545" y="226" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">重点：不是任意位置硬切，而是在 runtime 认定的安全点暂停</text>
  </svg>
</template>
