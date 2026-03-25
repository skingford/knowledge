<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind = 'core-path' | 'activity-registration'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'core-path': '860px',
  'activity-registration': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'core-path'"
      viewBox="0 0 860 306"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 高并发系统核心链路图"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="ghcsd-arrow-core" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <text x="430" y="24" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">图 1 Go 高并发系统核心链路</text>
      <text x="430" y="44" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">入口先挡流量，Go 服务层做有界并发和超时控制</text>
      <text x="430" y="58" text-anchor="middle" font-size="9.5" fill="var(--d-text-sub)">读走缓存，写按同步 / 异步边界拆开</text>

      <rect x="36" y="126" width="86" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="79" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Client</text>
      <text x="79" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">突发流量</text>

      <rect x="154" y="116" width="128" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="218" y="140" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">CDN / LB / Gateway</text>
      <text x="218" y="158" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">鉴权 / 限流 / 防刷</text>
      <text x="218" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">快速失败</text>

      <rect x="324" y="104" width="174" height="92" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="411" y="130" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">Go API Service</text>
      <text x="411" y="150" text-anchor="middle" font-size="9" fill="var(--d-text)">context / timeout / semaphore</text>
      <text x="411" y="166" text-anchor="middle" font-size="9" fill="var(--d-text)">连接池 / worker pool / backpressure</text>
      <text x="411" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同步链路只做必须立刻确定的动作</text>

      <rect x="552" y="64" width="122" height="54" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="613" y="84" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">Local Cache</text>
      <text x="613" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">热点配置 / 字典</text>

      <rect x="552" y="134" width="122" height="54" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="613" y="154" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Redis</text>
      <text x="613" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">共享缓存 / 计数 / 锁</text>

      <rect x="552" y="204" width="122" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="613" y="224" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">DB</text>
      <text x="613" y="240" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">唯一索引 / 条件更新</text>

      <rect x="730" y="120" width="94" height="54" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="777" y="140" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">Downstream</text>
      <text x="777" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">RPC / 三方</text>

      <rect x="730" y="198" width="94" height="54" rx="10" fill="var(--d-green-bg)" stroke="var(--d-green)" stroke-width="1.4" />
      <text x="777" y="218" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-green)">MQ</text>
      <text x="777" y="234" text-anchor="middle" font-size="9" fill="var(--d-green)">削峰 / 异步</text>

      <rect x="730" y="264" width="94" height="30" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="777" y="283" text-anchor="middle" font-size="9" fill="var(--d-text)">Worker / 补偿</text>

      <line x1="122" y1="150" x2="154" y2="150" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="282" y1="150" x2="324" y2="150" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-core)" />

      <line x1="498" y1="130" x2="552" y2="91" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="498" y1="150" x2="552" y2="161" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="498" y1="170" x2="552" y2="231" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="498" y1="146" x2="730" y2="147" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="498" y1="182" x2="730" y2="225" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />
      <line x1="777" y1="252" x2="777" y2="264" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-core)" />

      <rect x="34" y="206" width="454" height="84" rx="12" fill="var(--d-bg-alt)" stroke="var(--d-blue-border)" stroke-width="1.3" />
      <rect x="50" y="218" width="72" height="20" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1" />
      <text x="86" y="232" text-anchor="middle" font-size="9.5" font-weight="700" fill="var(--d-blue)">设计重点</text>

      <circle cx="64" cy="248" r="8" fill="var(--d-blue)" />
      <text x="64" y="251" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">1</text>
      <text x="80" y="251" font-size="9" fill="var(--d-text)">入口限流、鉴权前置，垃圾流量别放进 Go 服务</text>

      <circle cx="64" cy="266" r="8" fill="var(--d-green)" />
      <text x="64" y="269" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">2</text>
      <text x="80" y="269" font-size="9" fill="var(--d-text)">Go 层做有界并发、连接池治理和超时取消</text>

      <circle cx="64" cy="282" r="8" fill="var(--d-orange)" />
      <text x="64" y="285" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">3</text>
      <text x="80" y="285" font-size="9" fill="var(--d-text)">Redis / MQ 提升吞吐，数据库约束兜底最终正确性</text>
    </svg>

    <svg
      v-else
      viewBox="0 0 860 290"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 活动报名系统高并发链路图"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="ghcsd-arrow-activity" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
      </defs>

      <text x="430" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">图 2 活动报名系统的更稳链路</text>
      <text x="430" y="42" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">先限流，再幂等，再热点拦截，最终由数据库条件更新和唯一约束做正确性兜底</text>

      <rect x="28" y="108" width="88" height="48" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="72" y="128" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Client</text>
      <text x="72" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">抢报名</text>

      <rect x="150" y="98" width="118" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="209" y="122" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Gateway Limit</text>
      <text x="209" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">活动级 / 用户级限流</text>
      <text x="209" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">过载快速拒绝</text>

      <rect x="308" y="98" width="128" height="68" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="372" y="122" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Go Register API</text>
      <text x="372" y="140" text-anchor="middle" font-size="9" fill="var(--d-text)">context / timeout</text>
      <text x="372" y="156" text-anchor="middle" font-size="9" fill="var(--d-text)">bounded concurrency</text>

      <rect x="474" y="98" width="120" height="68" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="534" y="122" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-b-text)">Idempotency</text>
      <text x="534" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">请求号 / user+activity</text>
      <text x="534" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">重复请求先拦住</text>

      <rect x="632" y="98" width="104" height="68" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="684" y="122" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-a-text)">Redis</text>
      <text x="684" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">名额热点拦截</text>
      <text x="684" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">配置 / 去重</text>

      <rect x="632" y="198" width="104" height="68" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="684" y="222" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-rv-c-text)">DB</text>
      <text x="684" y="240" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">条件更新 / 唯一键</text>
      <text x="684" y="256" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">最终兜底</text>

      <rect x="770" y="98" width="62" height="68" rx="10" fill="var(--d-green-bg)" stroke="var(--d-green)" stroke-width="1.4" />
      <text x="801" y="122" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-green)">OK</text>
      <text x="801" y="140" text-anchor="middle" font-size="9" fill="var(--d-green)">同步返回</text>
      <text x="801" y="156" text-anchor="middle" font-size="9" fill="var(--d-green)">是否成功</text>

      <rect x="770" y="198" width="62" height="68" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="801" y="222" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-warn-text)">MQ</text>
      <text x="801" y="240" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">短信 / 审计</text>
      <text x="801" y="256" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">分析异步化</text>

      <line x1="116" y1="132" x2="150" y2="132" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="268" y1="132" x2="308" y2="132" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="436" y1="132" x2="474" y2="132" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="594" y1="132" x2="632" y2="132" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="736" y1="132" x2="770" y2="132" stroke="var(--d-border)" stroke-width="1.6" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="684" y1="166" x2="684" y2="198" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-activity)" />
      <line x1="736" y1="232" x2="770" y2="232" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#ghcsd-arrow-activity)" />

      <rect x="28" y="204" width="566" height="62" rx="10" fill="var(--d-bg-soft)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="52" y="225" font-size="10" font-weight="600" fill="var(--d-text)">这条链路为什么更稳</text>
      <text x="52" y="244" font-size="9" fill="var(--d-text)">1. 限流和幂等都前置，避免无效请求进入数据库</text>
      <text x="52" y="259" font-size="9" fill="var(--d-text)">2. Redis 负责热点拦截，数据库条件更新负责“不超卖、不重复”</text>
      <text x="322" y="244" font-size="9" fill="var(--d-text)">3. 短信、审计、分析放异步链路，同步返回只给“是否报名成功”</text>
    </svg>
  </DiagramFrame>
</template>
