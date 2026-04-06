<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 380"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="限流与熔断"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc5-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">限流与熔断 · 四种策略对比</text>

      <!-- Token Bucket -->
      <rect x="30" y="48" width="186" height="170" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="123" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-blue)">令牌桶</text>

      <!-- Bucket visual -->
      <rect x="78" y="82" width="90" height="60" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <circle cx="96" cy="100" r="6" fill="var(--d-blue)" />
      <circle cx="112" cy="100" r="6" fill="var(--d-blue)" />
      <circle cx="128" cy="100" r="6" fill="var(--d-blue)" />
      <circle cx="144" cy="100" r="6" fill="var(--d-blue)" />
      <circle cx="104" cy="118" r="6" fill="var(--d-blue)" opacity="0.5" />
      <circle cx="120" cy="118" r="6" fill="var(--d-blue)" opacity="0.5" />
      <circle cx="136" cy="118" r="6" fill="var(--d-blue)" opacity="0.5" />
      <text x="123" y="136" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">匀速补充令牌</text>

      <text x="123" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">允许突发流量</text>
      <text x="123" y="176" text-anchor="middle" font-size="9" fill="var(--d-text)">桶满则丢弃令牌</text>
      <rect x="56" y="190" width="134" height="18" rx="9" fill="var(--d-blue-border)" />
      <text x="123" y="203" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">适用：API 网关限流</text>

      <!-- Leaky Bucket -->
      <rect x="236" y="48" width="186" height="170" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="329" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">漏桶</text>

      <!-- Bucket visual -->
      <rect x="284" y="82" width="90" height="60" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="329" y="108" text-anchor="middle" font-size="18" fill="var(--d-rv-a-text)">~~~</text>
      <!-- Drip -->
      <line x1="329" y1="142" x2="329" y2="148" stroke="var(--d-rv-a-border)" stroke-width="2" />
      <circle cx="329" cy="152" r="3" fill="var(--d-rv-a-border)" />

      <text x="329" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">恒定速率输出</text>
      <text x="329" y="176" text-anchor="middle" font-size="9" fill="var(--d-text)">溢出则拒绝</text>
      <rect x="262" y="190" width="134" height="18" rx="9" fill="var(--d-rv-a-border)" />
      <text x="329" y="203" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">适用：调用第三方接口</text>

      <!-- Sliding Window -->
      <rect x="442" y="48" width="186" height="170" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="535" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-b-text)">滑动窗口</text>

      <!-- Window visual -->
      <rect x="472" y="84" width="30" height="40" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="487" y="109" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">3</text>
      <rect x="504" y="84" width="30" height="40" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="519" y="109" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">5</text>
      <rect x="536" y="84" width="30" height="40" rx="4" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="551" y="109" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-rv-b-text)">7</text>
      <rect x="568" y="84" width="30" height="40" rx="4" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="583" y="109" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">2</text>

      <text x="535" y="140" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">窗口随时间滑动</text>

      <text x="535" y="162" text-anchor="middle" font-size="9" fill="var(--d-text)">精确计数</text>
      <text x="535" y="176" text-anchor="middle" font-size="9" fill="var(--d-text)">避免边界突刺</text>
      <rect x="468" y="190" width="134" height="18" rx="9" fill="var(--d-rv-b-border)" />
      <text x="535" y="203" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">适用：用户维度限频</text>

      <!-- Circuit Breaker -->
      <rect x="648" y="48" width="186" height="170" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="741" y="70" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">熔断器</text>

      <!-- State machine -->
      <rect x="680" y="84" width="56" height="24" rx="4" fill="var(--d-green)" />
      <text x="708" y="100" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">Closed</text>

      <line x1="736" y1="96" x2="756" y2="96" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc5-arr)" />

      <rect x="760" y="84" width="56" height="24" rx="4" fill="var(--d-rv-c-border)" />
      <text x="788" y="100" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">Open</text>

      <path d="M788,108 L788,120 L741,120" stroke="var(--d-border)" stroke-width="1" fill="none" marker-end="url(#hc5-arr)" />

      <rect x="713" y="114" width="56" height="24" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1" />
      <text x="741" y="130" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-warn-text)">Half</text>

      <path d="M713,126 L694,126 L694,108 L708,108" stroke="var(--d-border)" stroke-width="1" fill="none" marker-end="url(#hc5-arr)" />

      <text x="741" y="156" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">错误率超阈值→Open</text>
      <text x="741" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">快速失败</text>
      <text x="741" y="182" text-anchor="middle" font-size="9" fill="var(--d-text)">防止雪崩扩散</text>
      <rect x="674" y="190" width="134" height="18" rx="9" fill="var(--d-rv-c-border)" />
      <text x="741" y="203" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">适用：微服务防雪崩</text>

      <!-- Integration -->
      <text x="430" y="248" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">多层限流协同</text>

      <rect x="60" y="262" width="120" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="120" y="285" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">客户端限频</text>

      <line x1="180" y1="280" x2="220" y2="280" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc5-arr)" />

      <rect x="224" y="262" width="120" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="284" y="278" text-anchor="middle" font-size="10" fill="var(--d-text)">网关限流</text>
      <text x="284" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">令牌桶 / 漏桶</text>

      <line x1="344" y1="280" x2="384" y2="280" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc5-arr)" />

      <rect x="388" y="262" width="120" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="448" y="278" text-anchor="middle" font-size="10" fill="var(--d-text)">服务端限流</text>
      <text x="448" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">滑动窗口 / Sentinel</text>

      <line x1="508" y1="280" x2="548" y2="280" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc5-arr)" />

      <rect x="552" y="262" width="120" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="612" y="278" text-anchor="middle" font-size="10" fill="var(--d-text)">熔断降级</text>
      <text x="612" y="292" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Resilience4j</text>

      <line x1="672" y1="280" x2="712" y2="280" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc5-arr)" />

      <rect x="716" y="262" width="120" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="776" y="278" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">降级兜底</text>
      <text x="776" y="292" text-anchor="middle" font-size="8" fill="var(--d-warn-text)">静态 / 缓存数据</text>

      <!-- Bottom -->
      <text x="430" y="326" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">层层拦截：越靠前拦截成本越低 · 越靠后拦截精度越高</text>

      <!-- Visual traffic flow -->
      <rect x="60" y="340" width="740" height="10" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="0.8" />
      <rect x="60" y="340" width="740" height="10" rx="5" fill="var(--d-rv-c-bg)" opacity="0.3" />
      <rect x="60" y="340" width="520" height="10" rx="5" fill="var(--d-blue-bg)" opacity="0.4" />
      <rect x="60" y="340" width="320" height="10" rx="5" fill="var(--d-rv-a-bg)" opacity="0.4" />
      <rect x="60" y="340" width="140" height="10" rx="5" fill="var(--d-green)" opacity="0.3" />

      <text x="60" y="366" font-size="8" fill="var(--d-rv-c-text)">100% 请求</text>
      <text x="240" y="366" font-size="8" fill="var(--d-rv-a-text)">~30% 过网关</text>
      <text x="460" y="366" font-size="8" fill="var(--d-blue)">~10% 过服务限流</text>
      <text x="680" y="366" font-size="8" fill="var(--d-green)">~1% 到 DB</text>
    </svg>
  </DiagramFrame>
</template>
