<!-- matches: V8 12.x / Node 22 LTS -->
<template>
  <svg viewBox="0 0 820 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="V8 Mark-Compact 三阶段：Marking → Sweeping → Compaction">
    <defs>
      <marker id="v8-mc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
      </marker>
    </defs>

    <!-- 标题 -->
    <text x="410" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="var(--d-text)">Old Space GC · Mark-Compact 三阶段</text>
    <text x="410" y="44" text-anchor="middle" font-size="11" fill="var(--d-text-sub)">三色标记 · 惰性 sweep · 按需 compact</text>

    <!-- 阶段 1: Marking -->
    <rect x="20" y="70" width="260" height="200" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="2" />
    <text x="150" y="92" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-warn-text)">① Marking（标记）</text>
    <text x="150" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">从 roots BFS · 三色标记</text>

    <!-- 三色对象示意 -->
    <g>
      <!-- 根 -->
      <circle cx="60" cy="142" r="12" fill="var(--d-text)" stroke="var(--d-text)" stroke-width="1" />
      <text x="60" y="146" text-anchor="middle" font-size="8" fill="var(--d-bg)">root</text>
      <!-- 黑 -->
      <circle cx="120" cy="142" r="12" fill="var(--d-text)" stroke="var(--d-text)" stroke-width="1" />
      <text x="120" y="146" text-anchor="middle" font-size="8" fill="var(--d-bg)">B</text>
      <!-- 灰 -->
      <circle cx="180" cy="142" r="12" fill="var(--d-text-muted)" stroke="var(--d-text-sub)" stroke-width="1" />
      <text x="180" y="146" text-anchor="middle" font-size="8" fill="var(--d-bg)">G</text>
      <!-- 白 -->
      <circle cx="240" cy="142" r="12" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1" />
      <text x="240" y="146" text-anchor="middle" font-size="8" fill="var(--d-text)">W</text>

      <line x1="72" y1="142" x2="108" y2="142" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#v8-mc-ah)" />
      <line x1="132" y1="142" x2="168" y2="142" stroke="var(--d-arrow)" stroke-width="1.2" marker-end="url(#v8-mc-ah)" />
      <line x1="192" y1="142" x2="228" y2="142" stroke="var(--d-arrow-light)" stroke-width="1" stroke-dasharray="3,2" marker-end="url(#v8-mc-ah)" />
    </g>

    <!-- 图例 -->
    <g font-size="9" fill="var(--d-text-sub)">
      <circle cx="50" cy="188" r="6" fill="var(--d-text)" stroke="var(--d-text)" />
      <text x="62" y="191">B · 黑 · 自身与字段全扫完</text>
      <circle cx="50" cy="208" r="6" fill="var(--d-text-muted)" stroke="var(--d-text-sub)" />
      <text x="62" y="211">G · 灰 · 自身访问 · 字段未扫</text>
      <circle cx="50" cy="228" r="6" fill="var(--d-bg)" stroke="var(--d-border)" />
      <text x="62" y="231">W · 白 · 未访问 · 标记结束仍白 = 垃圾</text>
    </g>

    <text x="150" y="256" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">典型耗时 100~300ms（大堆）</text>

    <!-- 阶段 2: Sweeping -->
    <rect x="300" y="70" width="260" height="200" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
    <text x="430" y="92" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-c-text)">② Sweeping（清除）</text>
    <text x="430" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">白对象加入 free list · 惰性执行</text>

    <!-- 一个 page 的 slot 布局 -->
    <g>
      <text x="312" y="132" font-size="9" fill="var(--d-text-sub)">清前：</text>
      <rect x="355" y="122" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="385" y="122" width="28" height="18" fill="var(--d-bg)" stroke="var(--d-border)" />
      <rect x="415" y="122" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="445" y="122" width="28" height="18" fill="var(--d-bg)" stroke="var(--d-border)" />
      <rect x="475" y="122" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="505" y="122" width="28" height="18" fill="var(--d-bg)" stroke="var(--d-border)" />

      <text x="312" y="170" font-size="9" fill="var(--d-text-sub)">清后：</text>
      <rect x="355" y="160" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="385" y="160" width="28" height="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
      <rect x="415" y="160" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="445" y="160" width="28" height="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
      <rect x="475" y="160" width="28" height="18" fill="var(--d-text)" stroke="var(--d-text)" />
      <rect x="505" y="160" width="28" height="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
    </g>

    <!-- 图例 -->
    <g font-size="9" fill="var(--d-text-sub)">
      <rect x="312" y="196" width="14" height="10" fill="var(--d-text)" stroke="var(--d-text)" />
      <text x="332" y="205">存活对象</text>
      <rect x="400" y="196" width="14" height="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
      <text x="420" y="205">加入 free list 的空闲槽</text>
    </g>

    <text x="430" y="232" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">注意：碎片存在（交替的 free slot）</text>
    <text x="430" y="256" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">Lazy：下次分配时逐 page 推进</text>

    <!-- 阶段 3: Compaction -->
    <rect x="580" y="70" width="220" height="200" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
    <text x="690" y="92" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-rv-a-text)">③ Compaction（整理）</text>
    <text x="690" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按需 · 碎片率高才触发</text>

    <!-- 整理前后 -->
    <g>
      <text x="592" y="132" font-size="9" fill="var(--d-text-sub)">碎片 page：</text>
      <rect x="660" y="122" width="20" height="18" fill="var(--d-text)" />
      <rect x="682" y="122" width="20" height="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
      <rect x="704" y="122" width="20" height="18" fill="var(--d-text)" />
      <rect x="726" y="122" width="20" height="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-dasharray="2,1" />
      <rect x="748" y="122" width="20" height="18" fill="var(--d-text)" />

      <path d="M 690 150 L 690 168" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#v8-mc-ah)" />

      <text x="592" y="190" font-size="9" fill="var(--d-text-sub)">新 page：</text>
      <rect x="660" y="180" width="20" height="18" fill="var(--d-text)" />
      <rect x="682" y="180" width="20" height="18" fill="var(--d-text)" />
      <rect x="704" y="180" width="20" height="18" fill="var(--d-text)" />
      <rect x="726" y="180" width="20" height="18" fill="var(--d-bg)" stroke="var(--d-border)" />
      <rect x="748" y="180" width="20" height="18" fill="var(--d-bg)" stroke="var(--d-border)" />
    </g>

    <text x="690" y="224" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">活对象集中 · 所有指针更新</text>
    <text x="690" y="240" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">最贵 · 50~200ms</text>

    <!-- 横向箭头连三段 -->
    <g stroke="var(--d-arrow)" stroke-width="1.5" fill="none">
      <line x1="280" y1="170" x2="298" y2="170" marker-end="url(#v8-mc-ah)" />
      <line x1="560" y1="170" x2="578" y2="170" marker-end="url(#v8-mc-ah)" />
    </g>

    <!-- 底部：Incremental / Concurrent 说明 -->
    <rect x="20" y="290" width="780" height="110" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
    <text x="410" y="312" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">避免 stop-the-world 的两把刀</text>

    <rect x="40" y="322" width="360" height="66" rx="6" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
    <text x="220" y="340" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">Incremental Marking（增量标记）</text>
    <text x="220" y="356" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">把 Mark 切成 ~5ms 小片 · 中间让 JS 跑</text>
    <text x="220" y="370" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">配合 write barrier 保持三色不变式</text>
    <text x="220" y="382" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">代价：每次赋值都要执行 barrier</text>

    <rect x="420" y="322" width="360" height="66" rx="6" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
    <text x="600" y="340" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-a-text)">Concurrent Marking（并发标记）</text>
    <text x="600" y="356" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">大部分 Mark 放后台线程 · 不占主线程</text>
    <text x="600" y="370" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">主线程只扫栈根 + 处理 barrier 的 gray</text>
    <text x="600" y="382" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">效果：p99 GC pause 下降一个数量级</text>
  </svg>
</template>
