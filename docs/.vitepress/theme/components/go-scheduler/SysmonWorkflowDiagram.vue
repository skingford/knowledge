<template>
  <svg viewBox="0 0 760 520" xmlns="http://www.w3.org/2000/svg" aria-label="sysmon 运行时时序图" role="img">
    <defs>
      <marker id="sysmon-seq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-arrow)" />
      </marker>
      <marker id="sysmon-seq-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-warn-text)" />
      </marker>
      <marker id="sysmon-seq-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-rv-a-text)" />
      </marker>
      <marker id="sysmon-seq-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-rv-b-text)" />
      </marker>
    </defs>

    <rect x="10" y="10" width="740" height="500" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="380" y="32" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">sysmon 运行时时序图</text>
    <text x="380" y="48" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">特殊 M，不绑定 P；时间从上到下推进，负责巡检并触发 runtime 机制</text>

    <rect x="30" y="64" width="110" height="40" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="85" y="88" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">sysmon</text>

    <rect x="170" y="64" width="110" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="225" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">运行中的</text>
    <text x="225" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">M + P + G</text>

    <rect x="310" y="64" width="110" height="40" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="365" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">阻塞 syscall</text>
    <text x="365" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">的 M</text>

    <rect x="450" y="64" width="110" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="505" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">NetPoller</text>

    <rect x="590" y="64" width="110" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="645" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">GC / forcegc</text>
    <text x="645" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">时间阈值兜底</text>

    <line x1="85" y1="104" x2="85" y2="468" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="225" y1="104" x2="225" y2="468" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="365" y1="104" x2="365" y2="468" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="505" y1="104" x2="505" y2="468" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="645" y1="104" x2="645" y2="468" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />

    <text x="20" y="126" font-size="10" fill="var(--d-text-muted)">time ↓</text>

    <rect x="22" y="116" width="706" height="96" rx="10" fill="var(--d-bg)" opacity="0.55" />
    <text x="30" y="136" font-size="11" font-weight="700" fill="var(--d-text-sub)">① 超时抢占</text>
    <line x1="85" y1="154" x2="225" y2="154" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-seq-arrow)" />
    <text x="155" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">scan schedtick / running G</text>
    <line x1="85" y1="182" x2="225" y2="182" stroke="var(--d-warn-text)" stroke-width="1.8" marker-end="url(#sysmon-seq-warn)" />
    <text x="155" y="174" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">同一 G &gt; 10ms: preemptone + SIGURG</text>
    <path d="M225 198 H265 V222 H225" fill="none" stroke="var(--d-warn-text)" stroke-width="1.6" marker-end="url(#sysmon-seq-warn)" />
    <text x="293" y="212" font-size="10" fill="var(--d-warn-text)">安全点注入 asyncPreempt，切回 schedule()</text>

    <rect x="22" y="228" width="706" height="86" rx="10" fill="var(--d-bg)" opacity="0.55" />
    <text x="30" y="248" font-size="11" font-weight="700" fill="var(--d-text-sub)">② syscall handoff</text>
    <line x1="85" y1="270" x2="365" y2="270" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-seq-arrow)" />
    <text x="225" y="262" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">发现 M 长时间卡在 syscall</text>
    <line x1="365" y1="294" x2="225" y2="294" stroke="var(--d-rv-c-text)" stroke-width="1.8" marker-end="url(#sysmon-seq-warn)" />
    <text x="295" y="286" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">handoff: 剥离 P 给 idle/new M，继续跑别的 G</text>

    <rect x="22" y="330" width="706" height="74" rx="10" fill="var(--d-bg)" opacity="0.55" />
    <text x="30" y="350" font-size="11" font-weight="700" fill="var(--d-text-sub)">③ netpoll 唤醒</text>
    <line x1="85" y1="372" x2="505" y2="372" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-seq-arrow)" />
    <text x="295" y="364" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">轮询网络事件是否就绪</text>
    <line x1="505" y1="394" x2="225" y2="394" stroke="var(--d-rv-a-text)" stroke-width="1.8" marker-end="url(#sysmon-seq-green)" />
    <text x="365" y="386" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">ready G -&gt; local runq / global runq</text>

    <rect x="22" y="420" width="706" height="58" rx="10" fill="var(--d-bg)" opacity="0.55" />
    <text x="30" y="440" font-size="11" font-weight="700" fill="var(--d-text-sub)">④ GC 保底触发</text>
    <line x1="85" y1="458" x2="645" y2="458" stroke="var(--d-rv-b-text)" stroke-width="1.8" marker-end="url(#sysmon-seq-blue)" />
    <text x="365" y="450" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">长时间未触发 GC 时执行 forcegc，避免低分配程序长期不回收</text>
  </svg>
</template>
