<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="安全防护——防刷与风控"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc21-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">安全防护 · 多层防线与风控引擎</text>

      <!-- Multi-layer defense -->
      <text x="430" y="56" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">接口防刷多层防线</text>

      <!-- Layer 1: Client -->
      <rect x="40" y="70" width="180" height="70" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <rect x="70" y="78" width="120" height="20" rx="10" fill="var(--d-border)" />
      <text x="130" y="92" text-anchor="middle" font-size="9" font-weight="700" fill="var(--d-bg-alt)">客户端</text>
      <text x="130" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">按钮防重</text>
      <text x="130" y="128" text-anchor="middle" font-size="9" fill="var(--d-text)">前端加密签名</text>

      <line x1="220" y1="105" x2="260" y2="105" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc21-arr)" />

      <!-- Layer 2: Gateway -->
      <rect x="264" y="70" width="180" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="294" y="78" width="120" height="20" rx="10" fill="var(--d-blue-border)" />
      <text x="354" y="92" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">网关层</text>
      <text x="354" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">IP 限频 / 用户限频</text>
      <text x="354" y="128" text-anchor="middle" font-size="9" fill="var(--d-text)">Nginx limit_req</text>

      <line x1="444" y1="105" x2="484" y2="105" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc21-arr)" />

      <!-- Layer 3: Business -->
      <rect x="488" y="70" width="180" height="70" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="518" y="78" width="120" height="20" rx="10" fill="var(--d-rv-a-border)" />
      <text x="578" y="92" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">业务层</text>
      <text x="578" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">设备指纹</text>
      <text x="578" y="128" text-anchor="middle" font-size="9" fill="var(--d-text)">行为分析</text>

      <line x1="668" y1="105" x2="708" y2="105" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc21-arr)" />

      <!-- Layer 4: Risk engine -->
      <rect x="712" y="70" width="120" height="70" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <rect x="724" y="78" width="96" height="20" rx="10" fill="var(--d-rv-c-border)" />
      <text x="772" y="92" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">风控引擎</text>
      <text x="772" y="114" text-anchor="middle" font-size="9" fill="var(--d-text)">规则 + 模型</text>
      <text x="772" y="128" text-anchor="middle" font-size="9" fill="var(--d-text)">实时评分</text>

      <!-- CAPTCHA escalation -->
      <text x="430" y="170" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">验证码体系（安全性递增）</text>

      <rect x="40" y="184" width="180" height="48" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="130" y="206" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">图形验证码</text>
      <text x="130" y="222" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">基础防护 · 易被 OCR 破解</text>

      <line x1="220" y1="208" x2="248" y2="208" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc21-arr)" />

      <rect x="252" y="184" width="180" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="342" y="206" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">滑块验证</text>
      <text x="342" y="222" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">增加破解成本</text>

      <line x1="432" y1="208" x2="460" y2="208" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc21-arr)" />

      <rect x="464" y="184" width="180" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="554" y="206" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">行为验证（无感）</text>
      <text x="554" y="222" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">鼠标轨迹 · 体验最好</text>

      <line x1="644" y1="208" x2="672" y2="208" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hc21-arr)" />

      <rect x="676" y="184" width="160" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="756" y="206" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">风险自适应</text>
      <text x="756" y="222" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">正常无感 · 可疑加强</text>

      <!-- Anti-replay -->
      <text x="430" y="262" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">防重放攻击</text>

      <rect x="100" y="276" width="140" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="170" y="293" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-blue)">timestamp</text>
      <text x="170" y="306" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">超 5 分钟拒绝</text>

      <text x="256" y="298" text-anchor="middle" font-size="12" fill="var(--d-text)">+</text>

      <rect x="270" y="276" width="140" height="36" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="340" y="293" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-a-text)">nonce</text>
      <text x="340" y="306" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Redis 判重</text>

      <text x="426" y="298" text-anchor="middle" font-size="12" fill="var(--d-text)">+</text>

      <rect x="440" y="276" width="300" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="590" y="293" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-rv-b-text)">sign = HMAC(params + timestamp + nonce, secret)</text>
      <text x="590" y="306" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">参数排序后签名 · 防篡改</text>

      <!-- Risk engine detail -->
      <rect x="140" y="328" width="580" height="24" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="430" y="344" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-warn-text)">风控引擎：Drools 规则 + Flink 实时特征 + 风险评分模型 → 高风险拦截或增加验证</text>
    </svg>
  </DiagramFrame>
</template>
