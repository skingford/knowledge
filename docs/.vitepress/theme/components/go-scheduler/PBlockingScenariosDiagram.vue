<template>
  <svg viewBox="0 0 760 660" xmlns="http://www.w3.org/2000/svg" aria-label="P 阻塞场景运行时时序图" role="img">
    <defs>
      <marker id="p-block-seq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-arrow)" />
      </marker>
      <marker id="p-block-seq-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-rv-a-text)" />
      </marker>
      <marker id="p-block-seq-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-rv-b-text)" />
      </marker>
      <marker id="p-block-seq-warn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-warn-text)" />
      </marker>
      <marker id="p-block-seq-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-rv-c-text)" />
      </marker>
    </defs>

    <rect x="10" y="10" width="740" height="640" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="380" y="32" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">P 阻塞场景运行时时序图</text>
    <text x="380" y="48" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">时间从上到下；重点是分清阻塞的是 G、M、P，还是 runtime 主动全局暂停</text>

    <rect x="30" y="64" width="96" height="40" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="78" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">当前 G</text>

    <rect x="170" y="64" width="96" height="40" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="218" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">M</text>

    <rect x="310" y="64" width="96" height="40" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="358" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">P</text>

    <rect x="450" y="64" width="96" height="40" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="498" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">runtime /</text>
    <text x="498" y="100" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">sysmon / GC</text>

    <rect x="590" y="64" width="120" height="40" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="650" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">其他 G / 其他 M/P</text>
    <text x="650" y="96" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">runq / idle M / 全部 P</text>

    <line x1="78" y1="104" x2="78" y2="608" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="218" y1="104" x2="218" y2="608" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="358" y1="104" x2="358" y2="608" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="498" y1="104" x2="498" y2="608" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />
    <line x1="650" y1="104" x2="650" y2="608" stroke="var(--d-border-dash)" stroke-width="1.2" stroke-dasharray="5 5" />

    <text x="22" y="126" font-size="10" fill="var(--d-text-muted)">time ↓</text>

    <rect x="22" y="118" width="706" height="108" rx="10" fill="var(--d-bg)" opacity="0.56" />
    <text x="30" y="138" font-size="11" font-weight="700" fill="var(--d-text-sub)">① G 阻塞（channel / mutex / select）</text>
    <line x1="78" y1="160" x2="218" y2="160" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#p-block-seq-arrow)" />
    <text x="148" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">当前 G 进入等待队列</text>
    <line x1="218" y1="186" x2="358" y2="186" stroke="var(--d-rv-a-text)" stroke-width="1.8" marker-end="url(#p-block-seq-green)" />
    <text x="288" y="178" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">M 继续持有 P</text>
    <line x1="358" y1="206" x2="650" y2="206" stroke="var(--d-rv-a-text)" stroke-width="1.8" marker-end="url(#p-block-seq-green)" />
    <text x="504" y="198" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">schedule next runnable G</text>
    <text x="30" y="218" font-size="10" fill="var(--d-rv-a-text)">=&gt; 阻塞的是 G，不是 P</text>

    <rect x="22" y="238" width="706" height="116" rx="10" fill="var(--d-bg)" opacity="0.56" />
    <text x="30" y="258" font-size="11" font-weight="700" fill="var(--d-text-sub)">② syscall 阻塞</text>
    <line x1="78" y1="282" x2="218" y2="282" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#p-block-seq-arrow)" />
    <text x="148" y="274" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">当前 G 发起阻塞 syscall</text>
    <path d="M218 296 H252 V320 H218" fill="none" stroke="var(--d-rv-c-text)" stroke-width="1.6" marker-end="url(#p-block-seq-orange)" />
    <text x="280" y="312" font-size="10" fill="var(--d-rv-c-text)">M blocked in syscall</text>
    <line x1="498" y1="330" x2="358" y2="330" stroke="var(--d-rv-b-text)" stroke-width="1.8" marker-end="url(#p-block-seq-blue)" />
    <text x="428" y="322" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">runtime / sysmon 尝试 retake P</text>
    <line x1="358" y1="346" x2="650" y2="346" stroke="var(--d-rv-b-text)" stroke-width="1.8" marker-end="url(#p-block-seq-blue)" />
    <text x="504" y="338" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">交给 idle M / new M 跑别的 G</text>
    <text x="30" y="346" font-size="10" fill="var(--d-rv-b-text)">=&gt; P 通常不阻塞</text>

    <rect x="22" y="366" width="706" height="132" rx="10" fill="var(--d-bg)" opacity="0.56" />
    <text x="30" y="386" font-size="11" font-weight="700" fill="var(--d-text-sub)">③ 长时间 CPU 计算 / 死循环</text>
    <line x1="78" y1="410" x2="218" y2="410" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#p-block-seq-arrow)" />
    <text x="148" y="402" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">当前 G 持续计算，不主动让出</text>
    <line x1="218" y1="434" x2="358" y2="434" stroke="var(--d-warn-text)" stroke-width="1.8" marker-end="url(#p-block-seq-warn)" />
    <text x="288" y="426" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">M 长时间持有 P</text>
    <line x1="650" y1="456" x2="358" y2="456" stroke="var(--d-warn-text)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#p-block-seq-warn)" />
    <text x="504" y="448" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">local runq 堆积，无法及时消费</text>
    <line x1="498" y1="480" x2="218" y2="480" stroke="var(--d-rv-c-text)" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#p-block-seq-orange)" />
    <text x="358" y="472" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">若抢占不及时，看起来就像 P 被卡住</text>
    <text x="30" y="492" font-size="10" fill="var(--d-rv-c-text)">=&gt; 现象最像 “P 阻塞”，本质更接近 G 长时间独占执行</text>

    <rect x="22" y="510" width="706" height="84" rx="10" fill="var(--d-bg)" opacity="0.56" />
    <text x="30" y="530" font-size="11" font-weight="700" fill="var(--d-text-sub)">④ STW</text>
    <line x1="498" y1="554" x2="358" y2="554" stroke="var(--d-warn-text)" stroke-width="1.8" marker-end="url(#p-block-seq-warn)" />
    <line x1="498" y1="572" x2="650" y2="572" stroke="var(--d-warn-text)" stroke-width="1.8" marker-end="url(#p-block-seq-warn)" />
    <text x="428" y="546" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">GC: stopTheWorld -&gt; stop 当前 P</text>
    <text x="574" y="564" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">同时 stop 其他 P</text>
    <text x="30" y="586" font-size="10" fill="var(--d-warn-text)">=&gt; 这是 runtime 主动全局暂停，不是单个 P 异常阻塞</text>
  </svg>
</template>
