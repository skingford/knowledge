<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'ai-coding-stack'
  | 'terminal-editor-loop'
  | 'automation-context'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'ai-coding-stack': '860px',
  'terminal-editor-loop': '860px',
  'automation-context': '860px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'ai-coding-stack'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="AI 编码工具栈图"
    >
      <defs>
        <marker id="tools-ai-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        工具方向最值得先建立的，不是某个快捷键，而是“代码仓库 + CLI / IDE / App + 上下文文件 + 自动化”的整套工作台视角
      </text>

      <rect x="52" y="96" width="156" height="92" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="130" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">代码仓库</text>
      <text x="130" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">工作区 / 项目约定</text>
      <text x="130" y="162" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">上下文和改动历史</text>

      <rect x="262" y="80" width="156" height="124" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="340" y="110" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">CLI / IDE / App</text>
      <text x="340" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Claude Code / Codex</text>
      <text x="340" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Gemini CLI / Cursor</text>
      <text x="340" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">终端、本地 IDE、桌面工作台</text>

      <rect x="472" y="96" width="156" height="92" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="550" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">项目上下文</text>
      <text x="550" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">CLAUDE.md / AGENTS.md</text>
      <text x="550" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">GEMINI.md / Rules</text>

      <rect x="682" y="96" width="126" height="92" rx="18" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.5" />
      <text x="745" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">自动化</text>
      <text x="745" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">MCP / skills</text>
      <text x="745" y="162" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">hooks / jobs</text>

      <line x1="208" y1="142" x2="262" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-ai-arrow)" />
      <line x1="418" y1="142" x2="472" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-ai-arrow)" />
      <line x1="628" y1="142" x2="682" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-ai-arrow)" />

      <rect x="186" y="226" width="488" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        真正提升效率的不是单个 AI 工具，而是让仓库上下文、入口形态和自动化扩展彼此能接上
      </text>
    </svg>

    <svg
      v-else-if="kind === 'terminal-editor-loop'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="终端编辑器效率闭环图"
    >
      <defs>
        <marker id="tools-loop-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        终端与编辑器的效率提升，不是把工具堆满，而是让命令执行、代码编辑、结果反馈和再次迭代形成稳定闭环
      </text>

      <rect x="84" y="98" width="150" height="88" rx="18" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.5" />
      <text x="159" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">iTerm2 / Shell</text>
      <text x="159" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">执行命令</text>
      <text x="159" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">tmux / 快捷键 / 历史</text>

      <rect x="356" y="98" width="150" height="88" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="431" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">编辑器</text>
      <text x="431" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Vim / Cursor / IDE</text>
      <text x="431" y="164" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">编辑、跳转、重构</text>

      <rect x="628" y="98" width="150" height="88" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="703" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">反馈面板</text>
      <text x="703" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">lint / test / review</text>
      <text x="703" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">终端输出 / CI 结果</text>

      <line x1="234" y1="142" x2="356" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-loop-arrow)" />
      <line x1="506" y1="142" x2="628" y2="142" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-loop-arrow)" />
      <path d="M 703 186 C 703 240, 159 240, 159 186" fill="none" stroke="var(--d-orange)" stroke-width="2" marker-end="url(#tools-loop-arrow)" />
      <text x="430" y="244" text-anchor="middle" font-size="10" fill="var(--d-orange)">看见反馈后立刻回到终端或编辑器继续迭代，而不是在多个窗口间频繁丢上下文</text>
    </svg>

    <svg
      v-else-if="kind === 'automation-context'"
      viewBox="0 0 860 300"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="自动化与长期上下文图"
    >
      <defs>
        <marker id="tools-auto-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        工具真正变成工作台，靠的不是会用一次会话，而是把长期上下文、权限边界和自动化任务都沉淀下来
      </text>

      <rect x="56" y="96" width="172" height="94" rx="18" fill="var(--d-client-bg)" stroke="var(--d-client-border)" stroke-width="1.5" />
      <text x="142" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-client-text)">长期上下文</text>
      <text x="142" y="146" text-anchor="middle" font-size="10" fill="var(--d-client-text)">项目规范 / 约定</text>
      <text x="142" y="162" text-anchor="middle" font-size="10" fill="var(--d-client-text)">目录结构 / 习惯做法</text>

      <rect x="344" y="78" width="172" height="130" rx="18" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="430" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">权限与边界</text>
      <text x="430" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">approval / sandbox</text>
      <text x="430" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">命令执行 / 文件修改 / 网络</text>
      <text x="430" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">本地与云端任务切分</text>

      <rect x="632" y="96" width="172" height="94" rx="18" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="718" y="126" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">自动化任务</text>
      <text x="718" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">定时检查 / 批量修复</text>
      <text x="718" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">技能、MCP、hooks</text>

      <line x1="228" y1="143" x2="344" y2="143" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-auto-arrow)" />
      <line x1="516" y1="143" x2="632" y2="143" stroke="var(--d-arrow)" stroke-width="1.8" marker-end="url(#tools-auto-arrow)" />

      <rect x="168" y="228" width="524" height="34" rx="17" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="430" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">
        一句话记法：先把项目上下文沉淀好，再把权限边界看清，最后才让自动化稳定接手重复劳动
      </text>
    </svg>
  </DiagramFrame>
</template>
