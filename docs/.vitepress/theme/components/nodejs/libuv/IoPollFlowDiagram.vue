<!-- matches: libuv v1.48 / Node 22 LTS · Linux epoll backend -->
<template>
  <svg viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="uv__io_poll 心脏流程：watcher_queue 注册到 epoll，epoll_wait 挂起线程，再分发回调">
    <defs>
      <marker id="lu-poll-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="380" y="28" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">uv__io_poll · Node.js 高并发的真正心脏</text>
    <text x="380" y="46" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">watcher_queue → epoll_ctl 刷入内核 → epoll_wait 挂起 → 循环分发回调</text>

    <!-- 用户态 / 内核态分界 -->
    <line x1="0" y1="242" x2="760" y2="242" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="5,3" />
    <text x="12" y="236" font-size="10" fill="var(--d-text-muted)">用户态</text>
    <text x="12" y="256" font-size="10" fill="var(--d-text-muted)">内核</text>

    <!-- 左：watcher_queue -->
    <rect x="30" y="70" width="170" height="150" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="115" y="92" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">watcher_queue</text>
    <text x="115" y="107" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本轮新增 / 变更 fd</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="var(--d-text-sub)">
      <rect x="46" y="118" width="138" height="22" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="115" y="133" text-anchor="middle">fd=8 · POLLIN</text>
      <rect x="46" y="144" width="138" height="22" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="115" y="159" text-anchor="middle">fd=12 · POLLOUT</text>
      <rect x="46" y="170" width="138" height="22" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="115" y="185" text-anchor="middle">fd=15 · POLLIN|OUT</text>
      <text x="115" y="208" text-anchor="middle" fill="var(--d-text-muted)">…</text>
    </g>

    <!-- 中：epoll_ctl -->
    <rect x="235" y="88" width="150" height="110" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="310" y="112" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-c-text)">epoll_ctl</text>
    <text x="310" y="128" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">ADD / MOD / DEL</text>
    <text x="310" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">把新 / 改动 fd</text>
    <text x="310" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">统一刷进</text>
    <text x="310" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">backend_fd</text>

    <!-- 右：epoll_wait -->
    <rect x="420" y="70" width="180" height="150" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="2" />
    <text x="510" y="94" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-warn-text)">epoll_wait ★</text>
    <text x="510" y="110" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">主线程挂起</text>
    <text x="510" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">events[1024] 缓冲区</text>
    <text x="510" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">最多一次拉 1024 事件</text>
    <text x="510" y="172" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">timeout ∈ [0, ∞)</text>
    <text x="510" y="192" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">idle Node CPU ≈ 0</text>

    <!-- 最右：timeout 来源 -->
    <rect x="625" y="70" width="120" height="110" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
    <text x="685" y="92" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">timeout</text>
    <text x="685" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv_backend_timeout</text>
    <text x="685" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">· 最近 timer</text>
    <text x="685" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">· 是否有 pending</text>
    <text x="685" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">· 是否有 idle</text>
    <text x="685" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">综合推导出</text>

    <!-- 内核态 epoll 结构 -->
    <rect x="235" y="266" width="365" height="70" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="417" y="286" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">内核 epoll（backend_fd）</text>
    <text x="417" y="304" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">interest list（红黑树） + ready list（双向链表）</text>
    <text x="417" y="322" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">fd 变可读/可写 → 内核挪入 ready list 并唤醒等待线程</text>

    <!-- 下方：循环分发 -->
    <rect x="60" y="358" width="640" height="62" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="380" y="380" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">for (i=0; i&lt;nfds; i++)  w-&gt;cb(loop, w, events[i].events)</text>
    <text x="380" y="398" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">按 events[].data.fd 查 loop-&gt;watchers[]，进入具体 handle 的回调</text>
    <text x="380" y="413" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">回调内抛 EAGAIN 则推入 pending_queue，下轮 uv__run_pending 再消费</text>

    <!-- 连线 -->
    <line x1="200" y1="150" x2="232" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
    <line x1="385" y1="150" x2="417" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
    <line x1="625" y1="150" x2="603" y2="150" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
    <!-- 中段→内核 -->
    <path d="M 310 198 Q 310 240 350 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
    <path d="M 500 220 Q 500 244 490 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
    <path d="M 490 266 Q 490 244 510 220" fill="none" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" marker-end="url(#lu-poll-ah)" />
    <text x="550" y="252" font-size="9" fill="var(--d-text-muted)">ready 事件回传</text>

    <!-- epoll_wait → 分发 -->
    <path d="M 510 220 Q 510 344 400 358" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-poll-ah)" />
  </svg>
</template>
