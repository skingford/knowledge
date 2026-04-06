<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分布式 ID 生成"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc19-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">分布式 ID 生成 · 雪花算法 64 位结构</text>

      <!-- Snowflake 64-bit structure -->
      <rect x="60" y="48" width="740" height="60" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />

      <!-- Sign bit -->
      <rect x="62" y="50" width="20" height="56" rx="0" fill="var(--d-border)" opacity="0.3" />
      <text x="72" y="82" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-text)">0</text>
      <text x="72" y="120" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">符号</text>
      <text x="72" y="132" text-anchor="middle" font-size="7" fill="var(--d-text-sub)">1bit</text>

      <!-- Timestamp 41 bits -->
      <rect x="84" y="50" width="380" height="56" rx="0" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="274" y="74" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-blue)">时间戳（毫秒）</text>
      <text x="274" y="92" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">41 bit — 支持约 69 年</text>
      <text x="274" y="132" text-anchor="middle" font-size="8" fill="var(--d-blue)" font-weight="600">当前时间 - 起始时间</text>

      <!-- Machine ID 10 bits -->
      <rect x="466" y="50" width="150" height="56" rx="0" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1" />
      <text x="541" y="74" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-a-text)">机器 ID</text>
      <text x="541" y="92" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">10 bit — 1024 个节点</text>
      <text x="541" y="132" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)" font-weight="600">5bit 数据中心 + 5bit 机器</text>

      <!-- Sequence 12 bits -->
      <rect x="618" y="50" width="180" height="56" rx="0" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="708" y="74" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-rv-c-text)">序列号</text>
      <text x="708" y="92" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">12 bit — 每毫秒 4096 个</text>
      <text x="708" y="132" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)" font-weight="600">单机 QPS 理论 409.6万/秒</text>

      <!-- Clock drift problem -->
      <rect x="60" y="152" width="360" height="80" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="240" y="174" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-warn-text)">关键问题：时钟回拨</text>
      <text x="240" y="194" text-anchor="middle" font-size="9" fill="var(--d-text)">机器时间回退 → ID 重复</text>
      <text x="240" y="212" text-anchor="middle" font-size="9" fill="var(--d-text)">小幅：等待追上 · 大幅：报错拒绝</text>
      <text x="240" y="226" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">美团 Leaf 用 ZK 检测 · 百度用环形缓冲区预生成</text>

      <!-- Segment mode -->
      <rect x="440" y="152" width="360" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="620" y="174" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-blue)">号段模式（Leaf-segment）</text>
      <text x="620" y="194" text-anchor="middle" font-size="9" fill="var(--d-text)">DB 维护 max_id → 批量取号段缓存</text>
      <text x="620" y="212" text-anchor="middle" font-size="9" fill="var(--d-text)">用完再取下一段（如一次取 1000 个）</text>
      <text x="620" y="226" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">双 Buffer 预加载避免短暂阻塞</text>

      <!-- Comparison cards -->
      <text x="430" y="260" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">方案选型</text>

      <rect x="30" y="274" width="190" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="125" y="294" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">UUID</text>
      <text x="125" y="310" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">无序 · 不适合做 DB 主键</text>
      <text x="125" y="322" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">适合日志 TraceId</text>

      <rect x="240" y="274" width="190" height="52" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="335" y="294" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">数据库自增</text>
      <text x="335" y="310" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">有序 · 单点瓶颈</text>
      <text x="335" y="322" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">小规模系统</text>

      <rect x="450" y="274" width="190" height="52" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="545" y="294" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-blue)">号段模式</text>
      <text x="545" y="310" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">趋势递增 · 性能高</text>
      <text x="545" y="322" text-anchor="middle" font-size="8" fill="var(--d-blue)">通用业务 ID</text>

      <rect x="660" y="274" width="190" height="52" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="755" y="294" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">雪花算法</text>
      <text x="755" y="310" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">趋势递增 · 极高性能</text>
      <text x="755" y="322" text-anchor="middle" font-size="8" fill="var(--d-rv-a-text)">高并发场景首选</text>
    </svg>
  </DiagramFrame>
</template>
