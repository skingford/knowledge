<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="880px">
    <svg
      viewBox="0 0 860 340"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="连接与资源耗尽防护"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <!-- Title -->
      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">连接与资源耗尽防护 · 四大资源瓶颈</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">高并发下最常见的故障不是逻辑错误，而是资源耗尽</text>

      <!-- Four resource panels -->
      <!-- DB Connection Pool -->
      <rect x="30" y="60" width="190" height="200" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.6" />
      <rect x="58" y="68" width="134" height="22" rx="11" fill="var(--d-blue-border)" />
      <text x="125" y="83" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">数据库连接池</text>

      <!-- Pool visualization -->
      <rect x="50" y="100" width="150" height="60" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <rect x="58" y="108" width="26" height="10" rx="3" fill="var(--d-green)" />
      <rect x="88" y="108" width="26" height="10" rx="3" fill="var(--d-green)" />
      <rect x="118" y="108" width="26" height="10" rx="3" fill="var(--d-green)" />
      <rect x="148" y="108" width="26" height="10" rx="3" fill="var(--d-rv-c-border)" />
      <rect x="58" y="122" width="26" height="10" rx="3" fill="var(--d-green)" />
      <rect x="88" y="122" width="26" height="10" rx="3" fill="var(--d-warn-border)" />
      <rect x="118" y="122" width="26" height="10" rx="3" fill="var(--d-warn-border)" />
      <rect x="148" y="122" width="26" height="10" rx="3" fill="var(--d-border)" opacity="0.4" />
      <rect x="58" y="136" width="26" height="10" rx="3" fill="var(--d-border)" opacity="0.4" />
      <rect x="88" y="136" width="26" height="10" rx="3" fill="var(--d-border)" opacity="0.4" />
      <rect x="118" y="136" width="26" height="10" rx="3" fill="var(--d-border)" opacity="0.4" />
      <rect x="148" y="136" width="26" height="10" rx="3" fill="var(--d-border)" opacity="0.4" />

      <text x="60" y="156" font-size="7" fill="var(--d-green)">活跃</text>
      <text x="100" y="156" font-size="7" fill="var(--d-warn-text)">慢查询</text>
      <text x="148" y="156" font-size="7" fill="var(--d-rv-c-text)">满</text>

      <text x="125" y="178" text-anchor="middle" font-size="9" fill="var(--d-text)">HikariCP 推荐公式：</text>
      <text x="125" y="192" text-anchor="middle" font-size="8" font-weight="600" fill="var(--d-blue)">CPU×2 + spindles</text>

      <text x="125" y="214" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">陷阱：慢查询占连接</text>
      <text x="125" y="228" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">事务未提交/未关闭</text>

      <rect x="50" y="236" width="150" height="16" rx="8" fill="var(--d-green)" />
      <text x="125" y="248" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">设置 statement timeout</text>

      <!-- Thread Pool -->
      <rect x="240" y="60" width="190" height="200" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.6" />
      <rect x="278" y="68" width="114" height="22" rx="11" fill="var(--d-rv-a-border)" />
      <text x="335" y="83" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">线程池</text>

      <!-- Thread pool viz -->
      <rect x="260" y="100" width="150" height="50" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />

      <text x="275" y="116" font-size="8" fill="var(--d-text-sub)">core:</text>
      <text x="305" y="116" font-size="8" font-weight="600" fill="var(--d-rv-a-text)">20</text>

      <text x="340" y="116" font-size="8" fill="var(--d-text-sub)">max:</text>
      <text x="367" y="116" font-size="8" font-weight="600" fill="var(--d-rv-a-text)">50</text>

      <text x="275" y="134" font-size="8" fill="var(--d-text-sub)">queue:</text>
      <text x="315" y="134" font-size="8" font-weight="600" fill="var(--d-rv-a-text)">200</text>

      <text x="350" y="134" font-size="8" fill="var(--d-text-sub)">reject:</text>
      <text x="395" y="134" font-size="8" font-weight="600" fill="var(--d-rv-c-text)">Abort</text>

      <text x="335" y="170" text-anchor="middle" font-size="9" fill="var(--d-text)">不同业务独立线程池</text>
      <text x="335" y="186" text-anchor="middle" font-size="9" fill="var(--d-text)">互不影响</text>

      <text x="335" y="210" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">陷阱：CallerRunsPolicy</text>
      <text x="335" y="224" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">看似安全实则阻塞上游</text>

      <rect x="260" y="236" width="150" height="16" rx="8" fill="var(--d-green)" />
      <text x="335" y="248" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">合理配置 + 隔离</text>

      <!-- FD -->
      <rect x="450" y="60" width="190" height="200" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.6" />
      <rect x="478" y="68" width="134" height="22" rx="11" fill="var(--d-rv-b-border)" />
      <text x="545" y="83" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">文件描述符 (FD)</text>

      <text x="545" y="110" text-anchor="middle" font-size="9" fill="var(--d-text)">默认 ulimit -n</text>
      <text x="545" y="128" text-anchor="middle" font-size="24" font-weight="700" fill="var(--d-rv-c-text)">1024</text>
      <text x="545" y="146" text-anchor="middle" font-size="9" fill="var(--d-text)">生产环境需调大至</text>
      <text x="545" y="164" text-anchor="middle" font-size="24" font-weight="700" fill="var(--d-green)">65535+</text>

      <text x="545" y="192" text-anchor="middle" font-size="8" fill="var(--d-rv-c-text)">TIME_WAIT 堆积</text>
      <text x="545" y="206" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tcp_tw_reuse</text>
      <text x="545" y="220" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">tcp_fin_timeout</text>

      <rect x="470" y="236" width="150" height="16" rx="8" fill="var(--d-green)" />
      <text x="545" y="248" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">调大 + TCP 参数调优</text>

      <!-- Memory -->
      <rect x="660" y="60" width="190" height="200" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.6" />
      <rect x="698" y="68" width="114" height="22" rx="11" fill="var(--d-warn-border)" />
      <text x="755" y="83" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">内存 / GC</text>

      <text x="755" y="110" text-anchor="middle" font-size="9" fill="var(--d-text)">大对象分配</text>
      <text x="755" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)" font-weight="600">→ Full GC → STW</text>
      <text x="755" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)" font-weight="600">→ 超时雪崩</text>

      <text x="755" y="168" text-anchor="middle" font-size="9" fill="var(--d-text)">堆外内存泄漏</text>
      <text x="755" y="184" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">Netty ByteBuf 未释放</text>

      <text x="755" y="210" text-anchor="middle" font-size="9" fill="var(--d-text)">JVM 各区域监控</text>
      <text x="755" y="224" text-anchor="middle" font-size="8" fill="var(--d-text-sub)">合理 GC 参数</text>

      <rect x="680" y="236" width="150" height="16" rx="8" fill="var(--d-green)" />
      <text x="755" y="248" text-anchor="middle" font-size="8" font-weight="600" fill="#fff">监控 + GC 调优</text>

      <!-- Bottom principle -->
      <rect x="140" y="280" width="580" height="34" rx="17" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="430" y="302" text-anchor="middle" font-size="10" font-weight="700" fill="var(--d-rv-c-text)">核心原则：连接数、线程数、FD、内存使用率必须有监控和阈值告警</text>

      <text x="430" y="336" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">在耗尽之前预警 — 不要等崩了才发现</text>
    </svg>
  </DiagramFrame>
</template>
