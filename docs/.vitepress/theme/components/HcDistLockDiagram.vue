<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 380"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分布式锁"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc9-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">分布式锁 · Redis (Redisson) 流程与续期机制</text>

      <!-- Main flow -->
      <!-- Step 1: Acquire -->
      <rect x="40" y="52" width="140" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="110" y="70" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">请求加锁</text>
      <text x="110" y="84" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">SET key uuid NX EX 30</text>

      <line x1="180" y1="72" x2="220" y2="72" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc9-arr)" />

      <!-- Step 2: Check -->
      <!-- Diamond shape for decision -->
      <polygon points="310,48 370,72 310,96 250,72" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="310" y="76" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">获取成功?</text>

      <!-- Yes path -->
      <line x1="370" y1="72" x2="420" y2="72" stroke="var(--d-green)" stroke-width="1.4" marker-end="url(#hc9-arr)" />
      <text x="395" y="64" text-anchor="middle" font-size="8" fill="var(--d-green)">是</text>

      <!-- Step 3: Business logic -->
      <rect x="424" y="52" width="140" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="494" y="70" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">执行业务逻辑</text>
      <text x="494" y="84" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">临界区代码</text>

      <line x1="564" y1="72" x2="610" y2="72" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc9-arr)" />

      <!-- Step 4: Release -->
      <rect x="614" y="52" width="200" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="714" y="70" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">Lua 原子释放</text>
      <text x="714" y="84" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">if value==uuid then DEL key</text>

      <!-- No path (retry/wait) -->
      <line x1="310" y1="96" x2="310" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.2" marker-end="url(#hc9-arr)" />
      <text x="322" y="112" font-size="8" fill="var(--d-rv-c-text)">否</text>

      <rect x="250" y="124" width="120" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="310" y="143" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">tryLock 等待/重试</text>

      <!-- Watchdog section -->
      <rect x="360" y="120" width="340" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="530" y="140" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-blue)">Watchdog 看门狗自动续期</text>
      <text x="530" y="158" text-anchor="middle" font-size="9" fill="var(--d-text)">每 10s 检查锁是否还持有</text>
      <text x="530" y="174" text-anchor="middle" font-size="9" fill="var(--d-text)">持有则续期 30s → 防止业务未完成锁已过期</text>

      <!-- Arrow from business to watchdog -->
      <path d="M494,92 L494,108 L530,108 L530,120" stroke="var(--d-blue-border)" stroke-width="1.2" fill="none" stroke-dasharray="4,3" marker-end="url(#hc9-arr)" />

      <!-- Comparison: Redis vs ZK -->
      <text x="430" y="220" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">Redis 锁 vs ZooKeeper 锁</text>

      <rect x="60" y="236" width="340" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="230" y="256" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">Redis (Redisson)</text>
      <text x="230" y="274" text-anchor="middle" font-size="9" fill="var(--d-text)">AP 模型 · 性能高 · 主从异步复制可能丢锁</text>
      <text x="230" y="290" text-anchor="middle" font-size="9" fill="var(--d-text)">RedLock 缓解但有争议 · 大多数场景够用</text>

      <rect x="460" y="236" width="340" height="70" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="630" y="256" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-b-text)">ZooKeeper</text>
      <text x="630" y="274" text-anchor="middle" font-size="9" fill="var(--d-text)">CP 模型 · 临时有序节点 + Watch</text>
      <text x="630" y="290" text-anchor="middle" font-size="9" fill="var(--d-text)">可靠性高 · 性能低于 Redis · 强一致场景推荐</text>

      <!-- Common pitfalls -->
      <text x="430" y="332" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">常见陷阱</text>

      <rect x="40" y="344" width="185" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="132" y="363" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">锁过期业务未完成 → Watchdog</text>

      <rect x="240" y="344" width="185" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="332" y="363" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">主从切换丢锁 → RedLock/ZK</text>

      <rect x="440" y="344" width="185" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="532" y="363" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">线程堆积 → tryLock 超时</text>

      <rect x="640" y="344" width="185" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="732" y="363" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">误删他人锁 → UUID + Lua</text>
    </svg>
  </DiagramFrame>
</template>
