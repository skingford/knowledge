<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'branch-pr-flow'
  | 'review-loop'
  | 'actions-troubleshooting'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'branch-pr-flow': '860px',
  'review-loop': '860px',
  'actions-troubleshooting': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'branch-pr-flow'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Git 分支到 PR 流程图"
    >
      <defs>
        <marker id="git-branch-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Git 协作最稳的主线通常不是“改完就 push”，而是 feature branch → PR → review → merge 这一整条可追踪链路
      </text>

      <rect x="46" y="96" width="120" height="84" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="106" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">main</text>
      <text x="106" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">稳定主干</text>
      <text x="106" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">保护分支</text>

      <rect x="214" y="78" width="144" height="120" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="286" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">feature branch</text>
      <text x="286" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">按主题提交 commit</text>
      <text x="286" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">rebase / fixup / 补测试</text>
      <text x="286" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">保持 PR 可读</text>

      <rect x="406" y="78" width="144" height="120" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="478" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">Pull Request</text>
      <text x="478" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">背景 / 改动 / 风险</text>
      <text x="478" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">CI 检查 / review</text>
      <text x="478" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">评论与修改闭环</text>

      <rect x="598" y="78" width="216" height="120" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="706" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">merge / tag / release</text>
      <text x="706" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Squash / Merge commit / Rebase</text>
      <text x="706" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">版本发布、回滚、变更追踪</text>
      <text x="706" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">始终能追到来源 PR</text>

      <line x1="166" y1="138" x2="214" y2="138" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-branch-arrow)" />
      <line x1="358" y1="138" x2="406" y2="138" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-branch-arrow)" />
      <line x1="550" y1="138" x2="598" y2="138" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-branch-arrow)" />

      <rect x="174" y="226" width="512" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        Git 本身管版本，团队协作真正稳定靠的是“分支命名、PR 描述、CI 绿灯、合并策略和回滚链路”一起成立
      </text>
    </svg>

    <svg
      v-else-if="kind === 'review-loop'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Git Review 闭环图"
    >
      <defs>
        <marker id="git-review-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        Code Review 最怕的不是有意见，而是意见不收口；高效协作的关键是把“提交、评论、修改、复审、通过”做成闭环
      </text>

      <rect x="76" y="98" width="144" height="88" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="148" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">提交者</text>
      <text x="148" y="148" text-anchor="middle" font-size="10" fill="var(--d-client-text)">描述清背景</text>
      <text x="148" y="164" text-anchor="middle" font-size="10" fill="var(--d-client-text)">标清风险和验证</text>

      <rect x="290" y="70" width="172" height="144" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="376" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Reviewer</text>
      <text x="376" y="124" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优先看正确性</text>
      <text x="376" y="142" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">行为变化 / 风险 / 测试</text>
      <text x="376" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">评论分清阻断与建议</text>
      <text x="376" y="178" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">必要时本地 checkout 验证</text>

      <rect x="532" y="98" width="144" height="88" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="604" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">修改与回复</text>
      <text x="604" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">commit 修复</text>
      <text x="604" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">逐条回应评论</text>

      <rect x="726" y="98" width="96" height="88" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="774" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Approve</text>
      <text x="774" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">CI 绿灯</text>
      <text x="774" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">可合并</text>

      <line x1="220" y1="142" x2="290" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-review-arrow)" />
      <line x1="462" y1="142" x2="532" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-review-arrow)" />
      <line x1="676" y1="142" x2="726" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-review-arrow)" />
      <path d="M 604 186 C 604 236, 376 236, 376 214" fill="none" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#git-review-arrow)" />
      <text x="502" y="238" text-anchor="middle" font-size="10" fill="var(--d-orange)">有新评论或新风险时继续迭代，不要丢掉上下文</text>

      <rect x="168" y="248" width="524" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="267" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Review 的目标不是挑风格，而是尽早发现行为回归、边界条件、测试缺口和协作盲区</text>
    </svg>

    <svg
      v-else-if="kind === 'actions-troubleshooting'"
      viewBox="0 0 860 310"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="GitHub Actions 排障主线图"
    >
      <defs>
        <marker id="git-actions-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        排查 GitHub Actions 不要上来就改 YAML，最稳的顺序通常是：先看触发条件，再看权限与 secrets，再看 runner、缓存和工件链路
      </text>

      <rect x="34" y="110" width="150" height="74" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="109" y="138" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">1. 是否触发</text>
      <text x="109" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`push` / `pull_request`</text>
      <text x="109" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`workflow_dispatch` / tag</text>

      <rect x="228" y="92" width="168" height="110" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="312" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">2. 权限与 Secrets</text>
      <text x="312" y="144" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`permissions:`</text>
      <text x="312" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">fork PR 限制</text>
      <text x="312" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">repo / env secrets</text>

      <rect x="440" y="92" width="168" height="110" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="524" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">3. Runner / Cache</text>
      <text x="524" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">依赖安装</text>
      <text x="524" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">缓存命中</text>
      <text x="524" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">版本与平台差异</text>

      <rect x="652" y="92" width="174" height="110" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="739" y="122" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">4. Artifact / Deploy</text>
      <text x="739" y="144" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">上传下载工件</text>
      <text x="739" y="160" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">environment 审批</text>
      <text x="739" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">发布脚本与目标环境</text>

      <line x1="184" y1="147" x2="228" y2="147" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-actions-arrow)" />
      <line x1="396" y1="147" x2="440" y2="147" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-actions-arrow)" />
      <line x1="608" y1="147" x2="652" y2="147" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#git-actions-arrow)" />

      <rect x="136" y="232" width="588" height="42" rx="21" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">经验法则：workflow 没触发先看事件和分支；跑起来后缺权限看 token / secrets；只在某平台挂多半是 runner 或缓存差异</text>
      <text x="430" y="266" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">值班时优先保留失败日志、job 链路和触发上下文，不要边猜边删 workflow 历史</text>
    </svg>
  </DiagramFrame>
</template>
