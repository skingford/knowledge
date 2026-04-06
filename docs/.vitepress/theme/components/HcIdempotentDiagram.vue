<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="幂等性设计"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc10-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">幂等性设计 · f(f(x)) = f(x)</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">同一操作执行一次和多次效果相同</text>

      <!-- Main flow: Token-based idempotency -->
      <text x="430" y="72" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">唯一请求 ID 防重流程</text>

      <rect x="40" y="86" width="110" height="36" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="95" y="101" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-c-text)">客户端</text>
      <text x="95" y="115" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">携带 requestId</text>

      <line x1="150" y1="104" x2="196" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc10-arr)" />

      <rect x="200" y="86" width="140" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="270" y="101" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Redis SETNX</text>
      <text x="270" y="115" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">requestId → 判重</text>

      <!-- Decision -->
      <line x1="340" y1="104" x2="380" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc10-arr)" />

      <polygon points="440,80 500,104 440,128 380,104" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="440" y="108" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">首次?</text>

      <!-- Yes -->
      <line x1="500" y1="104" x2="546" y2="104" stroke="var(--d-green)" stroke-width="1.4" marker-end="url(#hc10-arr)" />
      <text x="523" y="96" text-anchor="middle" font-size="8" fill="var(--d-green)">是</text>

      <rect x="550" y="86" width="120" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="610" y="101" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">执行业务</text>
      <text x="610" y="115" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">创建订单 / 扣款</text>

      <line x1="670" y1="104" x2="716" y2="104" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc10-arr)" />

      <rect x="720" y="86" width="110" height="36" rx="8" fill="var(--d-green)" stroke="var(--d-green)" stroke-width="1" />
      <text x="775" y="109" text-anchor="middle" font-size="10" font-weight="600" fill="#fff">返回结果</text>

      <!-- No: duplicate -->
      <line x1="440" y1="128" x2="440" y2="150" stroke="var(--d-rv-c-border)" stroke-width="1.2" marker-end="url(#hc10-arr)" />
      <text x="452" y="142" font-size="8" fill="var(--d-rv-c-text)">否（重复）</text>

      <rect x="370" y="154" width="140" height="28" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="440" y="173" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">直接返回上次结果</text>

      <!-- Four approaches -->
      <text x="430" y="210" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">四种幂等实现方案</text>

      <rect x="30" y="226" width="190" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="125" y="246" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">唯一请求 ID</text>
      <text x="125" y="264" text-anchor="middle" font-size="9" fill="var(--d-text)">前端生成 Token</text>
      <text x="125" y="278" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis SETNX 判重</text>
      <text x="125" y="296" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">表单提交 · 创建类接口</text>

      <rect x="240" y="226" width="190" height="80" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="335" y="246" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">数据库唯一约束</text>
      <text x="335" y="264" text-anchor="middle" font-size="9" fill="var(--d-text)">业务唯一键防重</text>
      <text x="335" y="278" text-anchor="middle" font-size="9" fill="var(--d-text)">INSERT 冲突直接返回</text>
      <text x="335" y="296" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">订单创建 · 支付记录</text>

      <rect x="450" y="226" width="190" height="80" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="545" y="246" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">状态机控制</text>
      <text x="545" y="264" text-anchor="middle" font-size="9" fill="var(--d-text)">状态单向流转</text>
      <text x="545" y="278" text-anchor="middle" font-size="9" fill="var(--d-text)">重复请求检查状态</text>
      <text x="545" y="296" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">订单状态变更</text>

      <rect x="660" y="226" width="190" height="80" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="755" y="246" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">乐观锁版本号</text>
      <text x="755" y="264" text-anchor="middle" font-size="9" fill="var(--d-text)">WHERE version = ?</text>
      <text x="755" y="278" text-anchor="middle" font-size="9" fill="var(--d-text)">SET version = version+1</text>
      <text x="755" y="296" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">更新类操作</text>

      <!-- MQ note -->
      <rect x="200" y="318" width="460" height="20" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="430" y="332" text-anchor="middle" font-size="9" fill="var(--d-text)">MQ 消费幂等：消费前查 Redis/DB 是否已处理 messageId，处理完毕后记录</text>
    </svg>
  </DiagramFrame>
</template>
