<template>
  <svg viewBox="0 0 760 460" xmlns="http://www.w3.org/2000/svg" aria-label="sysmon 工作流程图" role="img">
    <defs>
      <marker id="sysmon-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 Z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <rect x="10" y="10" width="740" height="440" rx="14" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
    <text x="380" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">sysmon：不绑定 P 的运行时巡检线程</text>

    <rect x="260" y="64" width="240" height="88" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="380" y="92" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-rv-b-text)">sysmon</text>
    <text x="380" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">特殊 M，不绑定任何 P</text>
    <text x="380" y="132" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">循环巡视 P / M / G、netpoll 与 GC 时间线</text>

    <line x1="320" y1="152" x2="180" y2="214" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-arrow)" />
    <line x1="440" y1="152" x2="580" y2="214" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-arrow)" />
    <line x1="320" y1="152" x2="180" y2="338" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-arrow)" />
    <line x1="440" y1="152" x2="580" y2="338" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#sysmon-arrow)" />

    <rect x="40" y="210" width="280" height="84" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="180" y="236" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">长时间运行的 G</text>
    <text x="180" y="256" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">同一个 G 持续占用 CPU 超过约 10ms</text>
    <text x="180" y="274" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">标记抢占并向对应 M 发送 SIGURG</text>
    <text x="180" y="292" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">在安全点注入 asyncPreempt</text>

    <rect x="440" y="210" width="280" height="84" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="580" y="236" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">阻塞 syscall 的 M</text>
    <text x="580" y="256" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">发现 M 长时间卡在内核态</text>
    <text x="580" y="274" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">触发 handoff，把 P 剥离出来</text>
    <text x="580" y="292" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">交给空闲 M 或新建 M 继续执行其他 G</text>

    <rect x="40" y="334" width="280" height="84" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="180" y="360" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">netpoll 就绪事件</text>
    <text x="180" y="380" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">询问 netpoller 是否有网络 I/O 返回</text>
    <text x="180" y="398" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">把等待 I/O 的 G 重新唤醒</text>
    <text x="180" y="416" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">放回本地 runq 或全局队列</text>

    <rect x="440" y="334" width="280" height="84" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
    <text x="580" y="360" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">GC 保底触发</text>
    <text x="580" y="380" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">长时间没有达到分配阈值也没触发 GC</text>
    <text x="580" y="398" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">距离上一次 GC 过久时触发 forcegc</text>
    <text x="580" y="416" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">避免低分配程序长期不回收</text>

    <rect x="170" y="426" width="420" height="16" rx="8" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />
    <text x="380" y="438" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">sysmon 不直接执行普通 G；它负责发现问题、触发抢占/交接/唤醒/保底回收</text>
  </svg>
</template>
