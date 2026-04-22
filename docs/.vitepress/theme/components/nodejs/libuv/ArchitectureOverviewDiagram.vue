<!-- matches: libuv v1.48 / Node 22 LTS -->
<template>
  <svg viewBox="0 0 760 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="libuv 架构全图 — uv_loop_t 四类对象关系">
    <defs>
      <marker id="lu-arch-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 中央 uv_loop_t 容器 -->
    <rect x="180" y="90" width="400" height="280" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2" />
    <text x="380" y="116" text-anchor="middle" font-size="16" font-weight="bold" fill="var(--d-text)">uv_loop_t</text>
    <text x="380" y="134" text-anchor="middle" font-size="11" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">struct uv_loop_s</text>

    <!-- 内部字段 -->
    <rect x="204" y="150" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="287" y="168" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">timer_heap</text>
    <text x="287" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">min-heap · 定时器</text>

    <rect x="390" y="150" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="473" y="168" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">handle_queue</text>
    <text x="473" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">长期存活 handle 链</text>

    <rect x="204" y="206" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="287" y="224" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">watcher_queue</text>
    <text x="287" y="240" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">待 epoll_ctl 的 fd</text>

    <rect x="390" y="206" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="473" y="224" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">pending_queue</text>
    <text x="473" y="240" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">延迟到本轮的 I/O cb</text>

    <rect x="204" y="262" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="287" y="280" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">closing_handles</text>
    <text x="287" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">待执行 close_cb</text>

    <rect x="390" y="262" width="166" height="44" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="473" y="280" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">backend_fd</text>
    <text x="473" y="296" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">epoll / kqueue / iocp</text>

    <rect x="204" y="318" width="352" height="38" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
    <text x="380" y="342" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">active_handles · stop_flag · 其他运行时字段</text>

    <!-- 左侧 handles -->
    <rect x="20" y="100" width="130" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="85" y="122" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">Handles</text>
    <text x="85" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv_handle_t</text>
    <text x="85" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">uv_tcp_t · uv_timer_t</text>
    <text x="85" y="172" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">uv_idle_t · uv_async_t</text>
    <text x="85" y="189" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">长期存活 · 可反复触发</text>

    <!-- 左侧 requests -->
    <rect x="20" y="220" width="130" height="96" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="85" y="242" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">Requests</text>
    <text x="85" y="260" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">uv_req_t</text>
    <text x="85" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">uv_work_t · uv_fs_t</text>
    <text x="85" y="292" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">uv_write_t · uv_getaddrinfo_t</text>
    <text x="85" y="309" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">一次性 · 完成即释放</text>

    <!-- 右侧 threadpool -->
    <rect x="610" y="150" width="140" height="166" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="680" y="172" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">Threadpool</text>
    <text x="680" y="190" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">全进程共享</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10" fill="var(--d-text-sub)">
      <circle cx="640" cy="216" r="10" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="640" y="220" text-anchor="middle">W1</text>
      <circle cx="680" cy="216" r="10" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="680" y="220" text-anchor="middle">W2</text>
      <circle cx="720" cy="216" r="10" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="720" y="220" text-anchor="middle">W3</text>
      <circle cx="660" cy="244" r="10" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="660" y="248" text-anchor="middle">W4</text>
      <circle cx="700" cy="244" r="10" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="700" y="248" text-anchor="middle">…</text>
    </g>
    <text x="680" y="278" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">UV_THREADPOOL_SIZE</text>
    <text x="680" y="294" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">默认 4 · 上限 1024</text>
    <text x="680" y="310" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">fs / dns / crypto / zlib</text>

    <!-- 箭头连线 -->
    <line x1="150" y1="148" x2="200" y2="172" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#lu-arch-ah)" />
    <line x1="150" y1="268" x2="200" y2="228" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#lu-arch-ah)" />
    <line x1="610" y1="232" x2="560" y2="228" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#lu-arch-ah)" />

    <!-- 标题 -->
    <text x="380" y="40" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">libuv 架构：loop / handle / request / threadpool</text>
    <text x="380" y="60" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">全进程一个 uv_loop_t · 三类对象挂在 loop 上，线程池跨 loop 共享</text>

    <!-- 进程边界虚线框 -->
    <rect x="10" y="78" width="740" height="372" rx="6" fill="none" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="5,3" />
    <text x="18" y="74" font-size="10" fill="var(--d-text-muted)">Node.js 进程</text>
  </svg>
</template>
