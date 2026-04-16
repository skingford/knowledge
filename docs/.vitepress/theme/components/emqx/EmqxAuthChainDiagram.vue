<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="640px">
    <svg
      viewBox="0 0 600 520"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EMQX 认证链设计图"
      role="img"
    >
      <defs>
        <marker id="auth-chain-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="300" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">
        EMQX 认证链（按顺序执行，命中即停止）
      </text>

      <!-- Step 1: X.509 -->
      <rect x="100" y="48" width="400" height="72" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="116" y="56" width="32" height="20" rx="8" fill="var(--d-blue-border)" />
      <text x="132" y="70" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">1</text>
      <text x="300" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">X.509 证书认证</text>
      <text x="300" y="94" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">TLS 握手时自动执行，优先级最高</text>
      <text x="300" y="110" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">适合 IoT 设备</text>

      <!-- Arrow 1→2 -->
      <line x1="300" y1="120" x2="300" y2="148" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#auth-chain-arrow)" />
      <text x="320" y="138" font-size="9" fill="var(--d-text-muted)">未匹配</text>

      <!-- Step 2: JWT -->
      <rect x="100" y="154" width="400" height="72" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="116" y="162" width="32" height="20" rx="8" fill="var(--d-rv-a-border)" />
      <text x="132" y="176" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">2</text>
      <text x="300" y="180" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">JWT Token 认证</text>
      <text x="300" y="200" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">验证签名 + 过期时间 + claims，支持 JWKS 自动轮换</text>
      <text x="300" y="216" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">适合 Mobile / Web</text>

      <!-- Arrow 2→3 -->
      <line x1="300" y1="226" x2="300" y2="254" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#auth-chain-arrow)" />
      <text x="320" y="244" font-size="9" fill="var(--d-text-muted)">未匹配</text>

      <!-- Step 3: Redis -->
      <rect x="100" y="260" width="400" height="72" rx="16" fill="var(--d-engine-bg)" stroke="var(--d-engine-border)" stroke-width="1.6" />
      <rect x="116" y="268" width="32" height="20" rx="8" fill="var(--d-engine-border)" />
      <text x="132" y="282" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">3</text>
      <text x="300" y="286" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Redis 查询</text>
      <text x="300" y="306" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">HGET mqtt_user:{username} password_hash</text>
      <text x="300" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">高性能缓存层，适合高并发认证</text>

      <!-- Arrow 3→4 -->
      <line x1="300" y1="332" x2="300" y2="360" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#auth-chain-arrow)" />
      <text x="320" y="350" font-size="9" fill="var(--d-text-muted)">未匹配</text>

      <!-- Step 4: MySQL/PG -->
      <rect x="100" y="366" width="400" height="72" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <rect x="116" y="374" width="32" height="20" rx="8" fill="var(--d-rv-c-border)" />
      <text x="132" y="388" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">4</text>
      <text x="300" y="392" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">MySQL / PostgreSQL 查询</text>
      <text x="300" y="412" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">SELECT password_hash FROM mqtt_users WHERE username = ?</text>
      <text x="300" y="428" text-anchor="middle" font-size="9" fill="var(--d-text-muted)">持久化兜底，Redis 未命中时查询</text>

      <!-- Bottom principle -->
      <rect x="140" y="462" width="320" height="36" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="300" y="484" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">
        认证链：高性能优先 → 逐级降级 → 命中即停
      </text>
    </svg>
  </DiagramFrame>
</template>
