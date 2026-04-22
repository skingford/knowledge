<!-- matches: Node 22 LTS · 运行时四大组件分层 -->
<template>
  <svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Node.js 运行时四大组件分层：Node Std Lib / C++ Bindings / V8 / libuv">
    <defs>
      <marker id="lu-rtc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="360" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">Node.js 运行时 · 四大组件分层</text>
    <text x="360" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">上层依赖下层 · C++ Bindings 同时桥接 V8 和 libuv</text>

    <!-- 顶层：用户应用（上下文入口） -->
    <rect x="230" y="62" width="260" height="32" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="360" y="82" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">你的应用代码 · require('fs') · http.createServer</text>

    <!-- 第 1 层：Node Standard Library（JavaScript） -->
    <rect x="60" y="108" width="600" height="64" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
    <rect x="586" y="116" width="66" height="20" rx="4" fill="var(--d-rv-b-border)" />
    <text x="619" y="130" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-bg)">JavaScript</text>
    <text x="80" y="132" font-size="13" font-weight="bold" fill="var(--d-rv-b-text)">Node Standard Library</text>
    <text x="80" y="150" font-size="10" fill="var(--d-text-sub)">提供给开发者使用的 API：fs · http · net · stream · crypto · events · path · ...</text>
    <text x="80" y="164" font-size="9" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">lib/*.js · 纯 JavaScript 实现（大量薄封装）</text>

    <!-- 第 2 层：C++ Bindings（胶水） -->
    <rect x="60" y="188" width="600" height="64" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <rect x="618" y="196" width="34" height="20" rx="4" fill="var(--d-rv-c-border)" />
    <text x="635" y="210" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-bg)">C++</text>
    <text x="80" y="212" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">C++ Bindings（胶水层）</text>
    <text x="80" y="230" font-size="10" fill="var(--d-text-sub)">把 JS 对象/函数与原生 C/C++ 实现对接，完成参数拆包、回调注册、资源生命周期管理</text>
    <text x="80" y="244" font-size="9" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">src/*.cc · node::Environment · AsyncWrap · HandleWrap</text>

    <!-- 第 3 层：V8 + libuv 并列 -->
    <!-- 左：V8 -->
    <rect x="60" y="268" width="288" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="2" />
    <rect x="286" y="276" width="54" height="20" rx="4" fill="var(--d-blue-border)" />
    <text x="313" y="290" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-bg)">C++</text>
    <text x="80" y="292" font-size="13" font-weight="bold" fill="var(--d-text)">V8 Engine</text>
    <text x="80" y="310" font-size="10" fill="var(--d-text-sub)">JavaScript 解析、编译（Ignition + TurboFan）、执行</text>
    <text x="80" y="324" font-size="10" fill="var(--d-text-sub)">GC、Isolate 隔离、Microtask 队列（Promise）</text>
    <text x="80" y="340" font-size="9" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">deps/v8 · 与 Chrome 共享</text>
    <text x="80" y="355" font-size="9" fill="var(--d-text-muted)">职责：运行 JS · 不懂网络 / 文件</text>

    <!-- 右：libuv -->
    <rect x="372" y="268" width="288" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="2" />
    <rect x="598" y="276" width="54" height="20" rx="4" fill="var(--d-rv-a-border)" />
    <text x="625" y="290" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-bg)">C / C++</text>
    <text x="392" y="292" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">libuv</text>
    <text x="392" y="310" font-size="10" fill="var(--d-text-sub)">异步 I/O 抽象层（epoll/kqueue/iocp）</text>
    <text x="392" y="324" font-size="10" fill="var(--d-text-sub)">事件循环 · 线程池 · timer · async</text>
    <text x="392" y="340" font-size="9" fill="var(--d-text-muted)" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">deps/uv · 跨平台统一接口</text>
    <text x="392" y="355" font-size="9" fill="var(--d-text-muted)">职责：派发 I/O · 不执行任何 JS</text>

    <!-- 底层说明 -->
    <rect x="60" y="382" width="600" height="28" rx="6" fill="none" stroke="var(--d-border-dash)" stroke-width="1" stroke-dasharray="4,3" />
    <text x="360" y="400" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">操作系统 · 内核系统调用（read / write / epoll_wait / kevent / ...）</text>

    <!-- 调用箭头：应用 → Std Lib -->
    <line x1="360" y1="94" x2="360" y2="106" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-rtc-ah)" />
    <!-- Std Lib → Bindings -->
    <line x1="360" y1="172" x2="360" y2="186" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#lu-rtc-ah)" />
    <!-- Bindings → V8（左下） -->
    <path d="M 300 252 Q 290 258 240 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#lu-rtc-ah)" />
    <!-- Bindings → libuv（右下） -->
    <path d="M 420 252 Q 430 258 480 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5,3" marker-end="url(#lu-rtc-ah)" />
    <!-- V8 / libuv → OS -->
    <line x1="200" y1="364" x2="200" y2="380" stroke="var(--d-arrow-light)" stroke-width="1.2" marker-end="url(#lu-rtc-ah)" />
    <line x1="520" y1="364" x2="520" y2="380" stroke="var(--d-arrow-light)" stroke-width="1.2" marker-end="url(#lu-rtc-ah)" />

    <!-- 侧标注：Bindings 同时桥接 -->
    <text x="360" y="258" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Bindings 同时下探 V8 与 libuv</text>
  </svg>
</template>
