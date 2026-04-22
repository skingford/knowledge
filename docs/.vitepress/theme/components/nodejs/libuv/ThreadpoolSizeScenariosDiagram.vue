<!-- matches: libuv v1.48 / Node 22 LTS -->
<template>
  <svg viewBox="0 0 800 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="UV_THREADPOOL_SIZE 场景对比：fs.readFile 走线程池 vs TCP 走 epoll">
    <defs>
      <marker id="lu-tps-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="400" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">UV_THREADPOOL_SIZE 到底能不能救？</text>
    <text x="400" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">同样是异步，但 fs / TCP 的底层路径完全不同 — 改线程池只对前者有效</text>

    <!-- 左：fs.readFile -->
    <rect x="20" y="62" width="370" height="360" rx="10" fill="var(--d-rv-a-bg)" opacity="0.3" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="205" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">(A) fs.readFile × 1000 并发</text>
    <text x="205" y="100" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">走线程池 · 改 UV_THREADPOOL_SIZE 有效</text>

    <!-- JS 调用栈 -->
    <rect x="44" y="118" width="322" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="205" y="134" text-anchor="middle" font-size="10" fill="var(--d-text)">1000 次 fs.readFile()</text>
    <text x="205" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">每个都 uv__work_submit 进 wq</text>

    <!-- wq 队列 -->
    <rect x="44" y="172" width="322" height="50" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="205" y="190" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">work queue · 堆积 996 个</text>
    <text x="205" y="206" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只有 4 个能同时跑，其余等 worker 释放</text>
    <text x="205" y="218" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（默认 UV_THREADPOOL_SIZE=4）</text>

    <!-- 4 个 worker -->
    <g>
      <rect x="54" y="246" width="72" height="56" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="90" y="262" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">W1</text>
      <text x="90" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">busy</text>
      <text x="90" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">read()</text>
    </g>
    <g>
      <rect x="136" y="246" width="72" height="56" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="172" y="262" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">W2</text>
      <text x="172" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">busy</text>
      <text x="172" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">read()</text>
    </g>
    <g>
      <rect x="218" y="246" width="72" height="56" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="254" y="262" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">W3</text>
      <text x="254" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">busy</text>
      <text x="254" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">read()</text>
    </g>
    <g>
      <rect x="300" y="246" width="72" height="56" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="336" y="262" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">W4</text>
      <text x="336" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">busy</text>
      <text x="336" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">read()</text>
    </g>

    <!-- 瓶颈提示 -->
    <rect x="44" y="318" width="322" height="40" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5" />
    <text x="205" y="335" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">瓶颈：4 线程 · 吞吐 = 单文件读 / 4</text>
    <text x="205" y="350" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">↑ UV_THREADPOOL_SIZE=32 能显著提升（受 CPU / 磁盘 IOPS 限制）</text>

    <!-- 连线 -->
    <g stroke="var(--d-arrow)" stroke-width="1.2" fill="none">
      <line x1="205" y1="158" x2="205" y2="170" marker-end="url(#lu-tps-ah)" />
      <line x1="150" y1="224" x2="98" y2="244" marker-end="url(#lu-tps-ah)" />
      <line x1="190" y1="224" x2="180" y2="244" marker-end="url(#lu-tps-ah)" />
      <line x1="220" y1="224" x2="246" y2="244" marker-end="url(#lu-tps-ah)" />
      <line x1="260" y1="224" x2="328" y2="244" marker-end="url(#lu-tps-ah)" />
    </g>

    <!-- 结论 -->
    <rect x="44" y="376" width="322" height="34" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="205" y="394" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">✔ 改 UV_THREADPOOL_SIZE 有效</text>
    <text x="205" y="406" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">容器核 N → 2N~4N 是常见经验值</text>

    <!-- 右：TCP 连接 -->
    <rect x="410" y="62" width="370" height="360" rx="10" fill="var(--d-rv-c-bg)" opacity="0.3" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="595" y="84" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">(B) 10000 个 TCP / HTTP 连接</text>
    <text x="595" y="100" text-anchor="middle" font-size="10" fill="var(--d-text-sub)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">走 epoll · UV_THREADPOOL_SIZE 无效</text>

    <!-- JS 调用 -->
    <rect x="434" y="118" width="322" height="40" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="595" y="134" text-anchor="middle" font-size="10" fill="var(--d-text)">10000 个 socket / http 连接</text>
    <text x="595" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">只向 watcher_queue 挂 fd，不进线程池</text>

    <!-- epoll_wait -->
    <rect x="434" y="172" width="322" height="70" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="595" y="192" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">uv__io_poll · epoll_wait(backend_fd)</text>
    <text x="595" y="210" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内核维护 10000 个 fd 兴趣集</text>
    <text x="595" y="224" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可读 / 可写事件才回主线程</text>
    <text x="595" y="236" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">单线程也扛 C10K+</text>

    <!-- worker 泳道：空闲 -->
    <rect x="434" y="256" width="322" height="62" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="595" y="274" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">worker pool</text>
    <g>
      <circle cx="498" cy="296" r="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="498" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">idle</text>
      <circle cx="548" cy="296" r="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="548" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">idle</text>
      <circle cx="598" cy="296" r="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="598" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">idle</text>
      <circle cx="648" cy="296" r="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" />
      <text x="648" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">idle</text>
      <text x="695" y="300" font-size="9" fill="var(--d-text-muted)">← 没人用</text>
    </g>

    <!-- 瓶颈提示 -->
    <rect x="434" y="334" width="322" height="38" rx="6" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.5" />
    <text x="595" y="351" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-cur-text)">瓶颈：文件描述符上限 · kernel CPU</text>
    <text x="595" y="365" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调 ulimit -n / somaxconn 远比改 UV_THREADPOOL_SIZE 有用</text>

    <!-- 连线 -->
    <line x1="595" y1="158" x2="595" y2="170" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#lu-tps-ah)" />

    <!-- 结论 -->
    <rect x="434" y="388" width="322" height="30" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="595" y="408" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-c-text)">✘ 改 UV_THREADPOOL_SIZE 无用</text>
  </svg>
</template>
