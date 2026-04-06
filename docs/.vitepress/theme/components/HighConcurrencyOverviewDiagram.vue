<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="900px">
    <svg
      viewBox="0 0 880 640"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="高并发系统设计四层架构总览"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hco-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
        <marker id="hco-arrow-white" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-text-sub)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="440" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">高并发系统设计 · 漏斗型四层架构总览</text>
      <text x="440" y="46" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">从流量进入到数据落盘，每一层都在做两件事：拦截无效流量 + 加速有效处理</text>

      <!-- ===== Left funnel numbers ===== -->
      <text x="46" y="108" text-anchor="middle" font-size="22" font-weight="700" fill="var(--d-rv-c-text)">100万</text>
      <text x="46" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">用户请求</text>
      <line x1="46" y1="130" x2="46" y2="190" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hco-arrow)" />
      <text x="46" y="218" text-anchor="middle" font-size="18" font-weight="700" fill="var(--d-blue)">10万</text>
      <text x="46" y="232" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">过网关</text>
      <line x1="46" y1="240" x2="46" y2="300" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hco-arrow)" />
      <text x="46" y="328" text-anchor="middle" font-size="16" font-weight="700" fill="var(--d-rv-a-text)">1万</text>
      <text x="46" y="342" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">到业务层</text>
      <line x1="46" y1="350" x2="46" y2="410" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hco-arrow)" />
      <text x="46" y="438" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-green)">1000</text>
      <text x="46" y="452" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">到数据库</text>

      <!-- ===== Layer 1: Infrastructure (chapters 1-7) ===== -->
      <rect x="92" y="68" width="770" height="120" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="104" y="76" width="130" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="169" y="91" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">第一层：扛住流量</text>
      <text x="760" y="91" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">章节 1 – 7</text>

      <!-- Layer 1 boxes -->
      <rect x="112" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="160" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">CDN / 静态化</text>
      <text x="160" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">边缘缓存</text>

      <rect x="228" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="276" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">LB / Gateway</text>
      <text x="276" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">限流 / 鉴权</text>

      <rect x="344" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="392" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">多级缓存</text>
      <text x="392" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Caffeine → Redis</text>

      <rect x="460" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="508" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">消息队列</text>
      <text x="508" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">异步削峰</text>

      <rect x="576" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="624" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">限流熔断</text>
      <text x="624" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">令牌桶 / 滑窗</text>

      <rect x="692" y="106" width="96" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="740" y="123" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">读写分离</text>
      <text x="740" y="138" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">分库分表</text>

      <!-- Layer 1 arrows -->
      <line x1="208" y1="127" x2="228" y2="127" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="324" y1="127" x2="344" y2="127" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="440" y1="127" x2="460" y2="127" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="556" y1="127" x2="576" y2="127" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="672" y1="127" x2="692" y2="127" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />

      <!-- Layer 1 → 2 connector -->
      <line x1="477" y1="188" x2="477" y2="206" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#hco-arrow)" />
      <text x="500" y="202" font-size="8.5" fill="var(--d-text-sub)">流量已过滤</text>

      <!-- ===== Layer 2: Business Correctness (chapters 8-13) ===== -->
      <rect x="92" y="210" width="770" height="120" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="104" y="218" width="148" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="178" y="233" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">第二层：保证不出错</text>
      <text x="760" y="233" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">章节 8 – 13</text>

      <!-- Layer 2 boxes -->
      <rect x="112" y="248" width="112" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="168" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">超卖防护</text>
      <text x="168" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">乐观锁 / Redis Lua</text>

      <rect x="242" y="248" width="112" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="298" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">分布式锁</text>
      <text x="298" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Redisson / ZK</text>

      <rect x="372" y="248" width="112" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="428" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">幂等设计</text>
      <text x="428" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Token / 状态机</text>

      <rect x="502" y="248" width="112" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="558" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">分布式事务</text>
      <text x="558" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">TCC / Saga / Outbox</text>

      <rect x="632" y="248" width="100" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="682" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">热点治理</text>
      <text x="682" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">分桶 / 打散</text>

      <rect x="750" y="248" width="100" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="800" y="265" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">资源防护</text>
      <text x="800" y="280" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">连接池 / FD</text>

      <!-- Layer 2 arrows -->
      <line x1="224" y1="269" x2="242" y2="269" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="354" y1="269" x2="372" y2="269" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="484" y1="269" x2="502" y2="269" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="614" y1="269" x2="632" y2="269" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="732" y1="269" x2="750" y2="269" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />

      <!-- Layer 2 → 3 connector -->
      <line x1="477" y1="330" x2="477" y2="348" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#hco-arrow)" />
      <text x="500" y="344" font-size="8.5" fill="var(--d-text-sub)">业务正确</text>

      <!-- ===== Layer 3: HA & Ops (chapters 14-17) ===== -->
      <rect x="92" y="352" width="770" height="100" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.6" />
      <rect x="104" y="360" width="166" height="22" rx="11" fill="var(--d-rv-b-border)" />
      <text x="187" y="375" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">第三层：挂了能恢复</text>
      <text x="760" y="375" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">章节 14 – 17</text>

      <!-- Layer 3 boxes -->
      <rect x="112" y="390" width="148" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="186" y="407" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">高可用架构</text>
      <text x="186" y="422" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">故障转移 / 异地多活</text>

      <rect x="280" y="390" width="148" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="354" y="407" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">全链路压测</text>
      <text x="354" y="422" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">容量规划 / 影子库</text>

      <rect x="448" y="390" width="148" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="522" y="407" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">可观测性</text>
      <text x="522" y="422" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Metrics / Tracing / Log</text>

      <rect x="616" y="390" width="148" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="690" y="407" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">灰度发布</text>
      <text x="690" y="422" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">金丝雀 / 蓝绿 / 滚动</text>

      <!-- Layer 3 arrows -->
      <line x1="260" y1="411" x2="280" y2="411" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="428" y1="411" x2="448" y2="411" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="596" y1="411" x2="616" y2="411" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />

      <!-- Layer 3 → 4 connector -->
      <line x1="477" y1="452" x2="477" y2="470" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#hco-arrow)" />

      <!-- ===== Layer 4: Distributed Infrastructure (chapters 19-27) ===== -->
      <rect x="92" y="474" width="770" height="100" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.6" />
      <rect x="104" y="482" width="172" height="22" rx="11" fill="var(--d-rv-c-border)" />
      <text x="190" y="497" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">第四层：分布式基石</text>
      <text x="760" y="497" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">章节 19 – 27</text>

      <!-- Layer 4 boxes -->
      <rect x="112" y="512" width="120" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="172" y="529" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">分布式 ID</text>
      <text x="172" y="544" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Snowflake / 号段</text>

      <rect x="250" y="512" width="120" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="310" y="529" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">一致性哈希</text>
      <text x="310" y="544" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">虚拟节点 / 槽位</text>

      <rect x="388" y="512" width="120" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="448" y="529" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">服务治理</text>
      <text x="448" y="544" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">注册发现 / 网关</text>

      <rect x="526" y="512" width="120" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="586" y="529" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">配置中心</text>
      <text x="586" y="544" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">Nacos / Apollo</text>

      <rect x="664" y="512" width="120" height="42" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="724" y="529" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">弹性伸缩</text>
      <text x="724" y="544" text-anchor="middle" font-size="8.5" fill="var(--d-text-sub)">K8s HPA / KEDA</text>

      <!-- Layer 4 arrows -->
      <line x1="232" y1="533" x2="250" y2="533" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="370" y1="533" x2="388" y2="533" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="508" y1="533" x2="526" y2="533" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />
      <line x1="646" y1="533" x2="664" y2="533" stroke="var(--d-border)" stroke-width="1.2" marker-end="url(#hco-arrow)" />

      <!-- ===== Center: Seckill system banner ===== -->
      <rect x="176" y="590" width="528" height="36" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <text x="440" y="613" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-warn-text)">秒杀系统 · 综合实战（第 18 章）—— 串联以上全部四层</text>

      <!-- Bottom design points -->
      <circle cx="130" cy="636" r="6" fill="var(--d-blue)" />
      <text x="142" y="639" font-size="9" fill="var(--d-text)">前端能拦的绝不到后端</text>
      <circle cx="318" cy="636" r="6" fill="var(--d-green)" />
      <text x="330" y="639" font-size="9" fill="var(--d-text)">能用缓存扛的绝不查库</text>
      <circle cx="502" cy="636" r="6" fill="var(--d-orange)" />
      <text x="514" y="639" font-size="9" fill="var(--d-text)">能异步的绝不同步</text>
      <circle cx="668" cy="636" r="6" fill="var(--d-rv-c-border)" />
      <text x="680" y="639" font-size="9" fill="var(--d-text)">全链路都要有降级兜底</text>
    </svg>
  </DiagramFrame>
</template>
