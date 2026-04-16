<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 480"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="秒杀系统综合实战"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc18-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">秒杀系统 · 端到端流量漏斗</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">层层拦截，到达数据库的请求 &lt; 1%</text>

      <!-- Funnel visualization -->
      <!-- Level 1: Users -->
      <polygon points="130,60 730,60 680,110 180,110" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="430" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">用户请求 100万</text>
      <text x="430" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">CDN 缓存静态页面</text>

      <!-- Level 2: Frontend -->
      <polygon points="180,114 680,114 640,164 220,164" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="430" y="136" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">前端拦截 50万</text>
      <text x="430" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">按钮置灰 + 随机丢弃 + 验证码</text>

      <!-- Level 3: Gateway -->
      <polygon points="220,168 640,168 600,218 260,218" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="430" y="190" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-blue)">网关层 10万</text>
      <text x="430" y="208" text-anchor="middle" font-size="9" fill="var(--d-blue)">限流（令牌桶）+ 黑名单 + 风控</text>

      <!-- Level 4: Redis -->
      <polygon points="260,222 600,222 570,272 290,272" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="430" y="244" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">Redis 预扣库存 1万</text>
      <text x="430" y="262" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Lua 原子扣减 · 库存不足直接拒绝</text>

      <!-- Level 5: MQ -->
      <polygon points="290,276 570,276 548,326 312,326" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="430" y="298" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">MQ 异步下单 1000</text>
      <text x="430" y="316" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">消费者按能力消费 · 削峰填谷</text>

      <!-- Level 6: DB -->
      <polygon points="312,330 548,330 530,370 330,370" fill="var(--d-green)" />
      <text x="430" y="350" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">数据库落单 1000</text>
      <text x="430" y="366" text-anchor="middle" font-size="8" fill="#fff">扣减真实库存 + 创建订单</text>

      <!-- Right side: chapter mapping -->
      <text x="770" y="88" font-size="8" fill="var(--d-text-sub)">CDN / 静态化</text>
      <text x="770" y="142" font-size="8" fill="var(--d-text-sub)">客户端限流</text>
      <text x="770" y="196" font-size="8" fill="var(--d-text-sub)">§5 限流熔断</text>
      <text x="770" y="250" font-size="8" fill="var(--d-text-sub)">§2+§8 缓存+库存</text>
      <text x="770" y="304" font-size="8" fill="var(--d-text-sub)">§4 异步削峰</text>
      <text x="770" y="354" font-size="8" fill="var(--d-text-sub)">§3+§8 DB+乐观锁</text>

      <!-- Left side: percentages -->
      <text x="100" y="88" text-anchor="end" font-size="9" fill="var(--d-rv-c-text)" font-weight="600">100%</text>
      <text x="100" y="142" text-anchor="end" font-size="9" fill="var(--d-warn-text)" font-weight="600">50%</text>
      <text x="100" y="196" text-anchor="end" font-size="9" fill="var(--d-blue)" font-weight="600">10%</text>
      <text x="100" y="250" text-anchor="end" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">1%</text>
      <text x="100" y="304" text-anchor="end" font-size="9" fill="var(--d-rv-b-text)" font-weight="600">0.1%</text>
      <text x="100" y="354" text-anchor="end" font-size="9" fill="var(--d-green)" font-weight="600">0.1%</text>

      <!-- Design principles -->
      <text x="430" y="400" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">秒杀设计口诀</text>

      <rect x="40" y="412" width="150" height="28" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="115" y="431" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-c-text)">前端能拦的绝不到后端</text>

      <rect x="210" y="412" width="150" height="28" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="285" y="431" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">能缓存扛的绝不查库</text>

      <rect x="380" y="412" width="130" height="28" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="445" y="431" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-a-text)">能异步的绝不同步</text>

      <rect x="530" y="412" width="150" height="28" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1" />
      <text x="605" y="431" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-b-text)">库存扣减必须原子</text>

      <rect x="700" y="412" width="140" height="28" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="770" y="431" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-warn-text)">全链路降级兜底</text>

      <!-- Cross-reference -->
      <text x="430" y="468" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">秒杀 = 高并发期末考试 — 串联前面所有章节知识点</text>
    </svg>
  </DiagramFrame>
</template>
