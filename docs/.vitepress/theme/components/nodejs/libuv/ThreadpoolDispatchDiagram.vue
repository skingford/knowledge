<!-- matches: libuv v1.48 / Node 22 LTS · src/threadpool.c -->
<template>
  <svg viewBox="0 0 800 440" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="线程池派发与主线程回落：JS 主线程 / worker 线程池 / 主 loop 三条泳道">
    <defs>
      <marker id="lu-tp-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="400" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">线程池派发生命周期 · uv_queue_work</text>
    <text x="400" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">JS 回调永远在主线程跑，worker 完成后通过 uv_async_send 回落</text>

    <!-- 泳道背景 -->
    <rect x="20" y="66" width="760" height="108" rx="6" fill="var(--d-rv-b-bg)" opacity="0.35" />
    <rect x="20" y="182" width="760" height="158" rx="6" fill="var(--d-rv-a-bg)" opacity="0.35" />
    <rect x="20" y="348" width="760" height="70" rx="6" fill="var(--d-rv-c-bg)" opacity="0.35" />

    <!-- 泳道标签 -->
    <text x="32" y="88" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">JS 主线程</text>
    <text x="32" y="102" font-size="9" fill="var(--d-text-sub)">（V8 · event loop thread）</text>
    <text x="32" y="204" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">Worker 线程池</text>
    <text x="32" y="218" font-size="9" fill="var(--d-text-sub)">（N 个 pthread · 共享 wq）</text>
    <text x="32" y="370" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">主 loop 回落</text>
    <text x="32" y="384" font-size="9" fill="var(--d-text-sub)">（同一条主线程）</text>

    <!-- 时间轴 -->
    <line x1="130" y1="60" x2="130" y2="420" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,3" />
    <line x1="780" y1="60" x2="780" y2="420" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="3,3" />
    <text x="160" y="432" font-size="9" fill="var(--d-text-muted)">time →</text>

    <!-- JS 泳道：发起调用 -->
    <rect x="150" y="108" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="235" y="128" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">fs.readFile(path, cb)</text>
    <text x="235" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">C++: uv__work_submit</text>
    <text x="235" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">入队 + uv_cond_signal</text>

    <!-- JS 泳道：继续跑，不阻塞 -->
    <rect x="340" y="108" width="170" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="425" y="128" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text-sub)">主线程返回 JS</text>
    <text x="425" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">继续处理其它事件</text>
    <text x="425" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">（不阻塞在 fs 上）</text>

    <!-- JS 泳道：最终回调（在主 loop 泳道对齐后） -->
    <rect x="600" y="108" width="170" height="52" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <text x="685" y="128" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">cb(err, data)</text>
    <text x="685" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">MakeCallback</text>
    <text x="685" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">JS 回调执行</text>

    <!-- worker 泳道：wq 队列 -->
    <rect x="150" y="196" width="140" height="90" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="220" y="214" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-rv-a-text)">work queue (wq)</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="var(--d-text-sub)">
      <rect x="162" y="224" width="116" height="16" rx="3" fill="var(--d-blue-bg)" />
      <text x="220" y="235" text-anchor="middle">FAST_IO fs_read</text>
      <rect x="162" y="244" width="116" height="16" rx="3" fill="var(--d-blue-bg)" />
      <text x="220" y="255" text-anchor="middle">CPU    pbkdf2</text>
      <rect x="162" y="264" width="116" height="16" rx="3" fill="var(--d-warn-bg)" />
      <text x="220" y="275" text-anchor="middle">SLOW_IO dns</text>
    </g>

    <!-- worker 泳道：worker 执行 -->
    <rect x="320" y="196" width="240" height="130" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="440" y="216" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">worker loop · N 线程并行</text>
    <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="var(--d-text-sub)">
      <rect x="334" y="228" width="64" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="366" y="243" text-anchor="middle">W1 work()</text>
      <rect x="404" y="228" width="64" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="436" y="243" text-anchor="middle">W2 work()</text>
      <rect x="474" y="228" width="64" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="506" y="243" text-anchor="middle">W3 wait</text>
      <rect x="334" y="256" width="134" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="401" y="271" text-anchor="middle">W4 真正阻塞系统调用</text>
      <rect x="474" y="256" width="64" height="22" rx="3" fill="var(--d-bg-alt)" stroke="var(--d-rv-a-border)" />
      <text x="506" y="271" text-anchor="middle">W5 wait</text>
    </g>
    <text x="440" y="300" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">uv_mutex_lock(&amp;mutex) · uv_cond_wait 挂起等任务</text>
    <text x="440" y="315" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">work() 执行 fs/crypto 等阻塞操作</text>

    <!-- worker 完成 -->
    <rect x="580" y="196" width="190" height="90" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-warn-border)" stroke-width="1.5" />
    <text x="675" y="216" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">uv_async_send</text>
    <text x="675" y="234" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">w-&gt;done 不在 worker 跑</text>
    <text x="675" y="248" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">结果挂到 loop-&gt;wq</text>
    <text x="675" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写 async_wfd</text>
    <text x="675" y="280" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">唤醒主线程 epoll_wait</text>

    <!-- 主 loop 回落泳道 -->
    <rect x="580" y="360" width="190" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="675" y="378" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">uv__io_poll 醒</text>
    <text x="675" y="394" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">发现 wq_async 可读</text>
    <text x="675" y="406" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调 w-&gt;done → JS cb</text>

    <!-- 连线 -->
    <!-- JS submit → wq -->
    <path d="M 235 160 Q 235 180 225 194" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-tp-ah)" />
    <!-- wq → worker -->
    <line x1="290" y1="244" x2="320" y2="244" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-tp-ah)" />
    <!-- worker → async_send -->
    <line x1="560" y1="240" x2="580" y2="240" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-tp-ah)" />
    <!-- async_send → 主 loop -->
    <path d="M 675 286 L 675 358" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-tp-ah)" />
    <!-- 主 loop → JS cb（斜向上） -->
    <path d="M 675 358 Q 735 260 685 162" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#lu-tp-ah)" />
    <text x="748" y="252" font-size="9" fill="var(--d-text-muted)">同</text>
    <text x="748" y="266" font-size="9" fill="var(--d-text-muted)">一</text>
    <text x="748" y="280" font-size="9" fill="var(--d-text-muted)">线</text>
    <text x="748" y="294" font-size="9" fill="var(--d-text-muted)">程</text>
  </svg>
</template>
