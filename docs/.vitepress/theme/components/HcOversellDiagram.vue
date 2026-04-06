<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 440"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="超卖问题与库存扣减"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc8-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
        <marker id="hc8-arr-red" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-rv-c-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">超卖问题 · 竞态条件与三种解决方案</text>

      <!-- Race condition timeline -->
      <text x="430" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">竞态条件：Check-Then-Act</text>

      <!-- Timeline -->
      <line x1="80" y1="80" x2="780" y2="80" stroke="var(--d-border)" stroke-width="1" />
      <text x="60" y="84" text-anchor="end" font-size="9" fill="var(--d-text-sub)">时间 →</text>

      <!-- Thread A -->
      <rect x="100" y="66" width="14" height="14" rx="3" fill="var(--d-blue)" />
      <text x="120" y="77" font-size="9" fill="var(--d-blue)" font-weight="600">线程 A</text>

      <rect x="200" y="90" width="120" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="260" y="106" text-anchor="middle" font-size="9" fill="var(--d-text)">读库存 = 1</text>

      <rect x="440" y="90" width="120" height="24" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="500" y="106" text-anchor="middle" font-size="9" fill="var(--d-text)">扣减 → 库存=0</text>

      <!-- Thread B -->
      <rect x="100" y="120" width="14" height="14" rx="3" fill="var(--d-rv-a-border)" />
      <text x="120" y="131" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">线程 B</text>

      <rect x="280" y="120" width="120" height="24" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="340" y="136" text-anchor="middle" font-size="9" fill="var(--d-text)">读库存 = 1</text>

      <rect x="520" y="120" width="140" height="24" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="590" y="136" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">扣减 → 库存=-1 !</text>

      <text x="700" y="110" font-size="10" fill="var(--d-rv-c-text)" font-weight="700">超卖！</text>

      <!-- Three solutions -->
      <text x="430" y="176" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">三种解决方案</text>

      <!-- Solution 1: DB Optimistic Lock -->
      <rect x="30" y="192" width="250" height="230" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="70" y="200" width="170" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="155" y="215" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">方案一：数据库乐观锁</text>

      <text x="155" y="244" text-anchor="middle" font-size="9" fill="var(--d-text)">UPDATE stock</text>
      <text x="155" y="258" text-anchor="middle" font-size="9" fill="var(--d-text)">SET count = count - 1</text>
      <text x="155" y="272" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">WHERE id=? AND count > 0</text>

      <line x1="70" y1="286" x2="240" y2="286" stroke="var(--d-border)" stroke-width="0.8" />

      <text x="80" y="304" font-size="9" fill="var(--d-green)">+ 实现简单</text>
      <text x="80" y="320" font-size="9" fill="var(--d-green)">+ 强一致性</text>
      <text x="80" y="340" font-size="9" fill="var(--d-rv-c-text)">- 高并发大量失败</text>
      <text x="80" y="356" font-size="9" fill="var(--d-rv-c-text)">- 数据库压力大</text>

      <rect x="60" y="370" width="190" height="22" rx="11" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="155" y="385" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适用：并发量不高的常规业务</text>

      <rect x="220" y="400" width="40" height="16" rx="4" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="240" y="412" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-c-text)">性能低</text>

      <!-- Solution 2: Redis Lua -->
      <rect x="305" y="192" width="250" height="230" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="345" y="200" width="170" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="430" y="215" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">方案二：Redis Lua 原子</text>

      <text x="430" y="244" text-anchor="middle" font-size="9" fill="var(--d-text)">if redis.get(key) > 0 then</text>
      <text x="430" y="258" text-anchor="middle" font-size="9" fill="var(--d-text)">  redis.decr(key)</text>
      <text x="430" y="272" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">单线程保证原子性</text>

      <line x1="345" y1="286" x2="515" y2="286" stroke="var(--d-border)" stroke-width="0.8" />

      <text x="355" y="304" font-size="9" fill="var(--d-green)">+ 性能极高 10万+ QPS</text>
      <text x="355" y="320" font-size="9" fill="var(--d-green)">+ 原子操作</text>
      <text x="355" y="340" font-size="9" fill="var(--d-rv-c-text)">- Redis 与 DB 最终一致</text>
      <text x="355" y="356" font-size="9" fill="var(--d-rv-c-text)">- 需要补偿机制</text>

      <rect x="335" y="370" width="190" height="22" rx="11" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="430" y="385" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">适用：秒杀、抢购</text>

      <rect x="495" y="400" width="40" height="16" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="515" y="412" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-a-text)">性能高</text>

      <!-- Solution 3: Pre-deduct + Async -->
      <rect x="580" y="192" width="250" height="230" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="610" y="200" width="190" height="22" rx="11" fill="var(--d-warn-border)" />
      <text x="705" y="215" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">方案三：预扣 + 异步落库</text>

      <rect x="630" y="234" width="150" height="20" rx="4" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="705" y="248" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis 预扣库存</text>

      <line x1="705" y1="254" x2="705" y2="264" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc8-arr)" />

      <rect x="630" y="268" width="150" height="20" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="705" y="282" text-anchor="middle" font-size="9" fill="var(--d-text)">MQ 异步下单</text>

      <line x1="705" y1="288" x2="705" y2="298" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc8-arr)" />

      <rect x="630" y="302" width="150" height="20" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="705" y="316" text-anchor="middle" font-size="9" fill="var(--d-text)">DB 扣减真实库存</text>

      <text x="705" y="342" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">超时未支付 → 回补库存</text>

      <rect x="610" y="370" width="190" height="22" rx="11" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="705" y="385" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">适用：大促、高并发电商</text>

      <rect x="770" y="400" width="50" height="16" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="795" y="412" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-warn-text)">推荐</text>

      <!-- Bottom -->
      <text x="430" y="438" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">核心：把「先检查后执行」变成「原子操作」— 数据库行锁、Redis Lua、预扣队列</text>
    </svg>
  </DiagramFrame>
</template>
