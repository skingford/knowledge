<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'roadmap'
  | 'mvcc-chain'
  | 'ha-answer-frame'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  roadmap: '860px',
  'mvcc-chain': '860px',
  'ha-answer-frame': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'roadmap'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PostgreSQL 核心概念学习路线图"
    >
      <defs>
        <marker id="pg-core-roadmap-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        PostgreSQL 核心概念最好按“先单机机制，再性能与扩展，最后集群治理”的顺序来准备
      </text>

      <rect x="34" y="88" width="120" height="80" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="94" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">MVCC</text>
      <text x="94" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">可见性</text>
      <text x="94" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">版本回收</text>

      <rect x="172" y="88" width="120" height="80" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="232" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">索引</text>
      <text x="232" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">B-Tree / GIN</text>
      <text x="232" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">BRIN / 计划</text>

      <rect x="310" y="88" width="120" height="80" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="370" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">锁事务</text>
      <text x="370" y="136" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">长事务</text>
      <text x="370" y="152" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">死锁 / 热点</text>

      <rect x="448" y="88" width="120" height="80" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="508" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">批量写入</text>
      <text x="508" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Batch</text>
      <text x="508" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">COPY / CopyFrom</text>

      <rect x="586" y="88" width="120" height="80" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="646" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">分区表</text>
      <text x="646" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">时间 / 商户</text>
      <text x="646" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">热冷分离</text>

      <rect x="724" y="88" width="102" height="80" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="775" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">高可用</text>
      <text x="775" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">WAL</text>
      <text x="775" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Patroni</text>

      <line x1="154" y1="128" x2="172" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-roadmap-arrow)" />
      <line x1="292" y1="128" x2="310" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-roadmap-arrow)" />
      <line x1="430" y1="128" x2="448" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-roadmap-arrow)" />
      <line x1="568" y1="128" x2="586" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-roadmap-arrow)" />
      <line x1="706" y1="128" x2="724" y2="128" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-roadmap-arrow)" />

      <rect x="188" y="222" width="484" height="36" rx="18" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="244" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        主线记法：先回答“数据为什么这样可见”，再回答“为什么快 / 为什么会堵”，最后回答“为什么切主后还稳”
      </text>
    </svg>

    <svg
      v-else-if="kind === 'mvcc-chain'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PostgreSQL MVCC 版本链图"
    >
      <defs>
        <marker id="pg-core-mvcc-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        MVCC 的核心不是“更新覆盖旧值”，而是保留版本链，再由事务快照决定当前读能看到哪一个版本
      </text>

      <rect x="54" y="96" width="180" height="92" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="144" y="124" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">事务快照</text>
      <text x="144" y="144" text-anchor="middle" font-size="10" fill="var(--d-client-text)">决定哪些事务已提交</text>
      <text x="144" y="160" text-anchor="middle" font-size="10" fill="var(--d-client-text)">哪些版本对当前读可见</text>

      <rect x="320" y="82" width="166" height="118" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="403" y="110" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">旧版本 V1</text>
      <text x="403" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">xmin = 已提交事务</text>
      <text x="403" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">xmax = 更新它的事务</text>
      <text x="403" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">仍可能被旧快照看到</text>

      <rect x="560" y="82" width="166" height="118" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="643" y="110" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">新版本 V2</text>
      <text x="643" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">UPDATE 产生新 tuple</text>
      <text x="643" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">对新快照可见</text>
      <text x="643" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">成为当前有效版本</text>

      <line x1="234" y1="142" x2="320" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-mvcc-arrow)" />
      <line x1="486" y1="142" x2="560" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-mvcc-arrow)" />
      <text x="523" y="128" text-anchor="middle" font-size="10" fill="var(--d-orange)">UPDATE 生成新版本</text>

      <rect x="258" y="228" width="344" height="34" rx="17" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="430" y="250" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">
        只有当旧版本再也不会被任何快照看到时，VACUUM 才能把它安全回收
      </text>
    </svg>

    <svg
      v-else-if="kind === 'ha-answer-frame'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="PostgreSQL 高可用回答框架图"
    >
      <defs>
        <marker id="pg-core-ha-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        面试里回答 PostgreSQL 高可用，最好按“复制基础 → 同步策略 → 故障切换与恢复”的顺序来讲
      </text>

      <rect x="76" y="90" width="210" height="110" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="181" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">复制基础</text>
      <text x="181" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">WAL + Streaming Replication</text>
      <text x="181" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">LSN / 复制槽 / 追平机制</text>

      <rect x="324" y="90" width="210" height="110" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="429" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">同步策略</text>
      <text x="429" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">异步 / ANY 1 / ANY 2</text>
      <text x="429" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">RPO / 延迟 / 可用性权衡</text>

      <rect x="572" y="90" width="210" height="110" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="677" y="120" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">故障切换与恢复</text>
      <text x="677" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Patroni / etcd / HAProxy</text>
      <text x="677" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">pg_rewind / 旧主回收 / 备份</text>

      <line x1="286" y1="145" x2="324" y2="145" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-ha-arrow)" />
      <line x1="534" y1="145" x2="572" y2="145" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#pg-core-ha-arrow)" />

      <rect x="188" y="228" width="484" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        这条线的重点不是只会说“主从切换”，而是把复制延迟、脑裂防护、旧主回收和连接切换一起讲完整
      </text>
    </svg>
  </DiagramFrame>
</template>
