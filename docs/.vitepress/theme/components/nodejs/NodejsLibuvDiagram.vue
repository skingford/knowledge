<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
import ArchitectureOverviewDiagram from './libuv/ArchitectureOverviewDiagram.vue'
import UvRunPhasesDiagram from './libuv/UvRunPhasesDiagram.vue'
import IoPollFlowDiagram from './libuv/IoPollFlowDiagram.vue'
import ThreadpoolDispatchDiagram from './libuv/ThreadpoolDispatchDiagram.vue'
import SetTimeoutCallChainDiagram from './libuv/SetTimeoutCallChainDiagram.vue'
import TimerHeapDiagram from './libuv/TimerHeapDiagram.vue'
import NextTickMicrotaskDiagram from './libuv/NextTickMicrotaskDiagram.vue'
import ThreadpoolSizeScenariosDiagram from './libuv/ThreadpoolSizeScenariosDiagram.vue'
import RuntimeComponentsDiagram from './libuv/RuntimeComponentsDiagram.vue'
import V8ExecutionPipelineDiagram from './v8/V8ExecutionPipelineDiagram.vue'
import HiddenClassTransitionDiagram from './v8/HiddenClassTransitionDiagram.vue'
import IcStatesDiagram from './v8/IcStatesDiagram.vue'
import V8HeapLayoutDiagram from './v8/V8HeapLayoutDiagram.vue'
import MarkCompactPhasesDiagram from './v8/MarkCompactPhasesDiagram.vue'

type DiagramKind =
  | 'runtime-components'
  | 'architecture-overview'
  | 'uv-run-phases'
  | 'io-poll-flow'
  | 'threadpool-dispatch'
  | 'settimeout-call-chain'
  | 'timer-heap'
  | 'nexttick-microtask'
  | 'threadpool-size-scenarios'
  | 'v8-execution-pipeline'
  | 'hidden-class-transition'
  | 'ic-states'
  | 'v8-heap-layout'
  | 'mark-compact-phases'

const props = defineProps<{
  kind: DiagramKind
}>()

const diagramByKind: Record<DiagramKind, { component: Component; maxWidth: string }> = {
  'runtime-components': { component: RuntimeComponentsDiagram, maxWidth: '720px' },
  'architecture-overview': { component: ArchitectureOverviewDiagram, maxWidth: '760px' },
  'uv-run-phases': { component: UvRunPhasesDiagram, maxWidth: '720px' },
  'io-poll-flow': { component: IoPollFlowDiagram, maxWidth: '760px' },
  'threadpool-dispatch': { component: ThreadpoolDispatchDiagram, maxWidth: '800px' },
  'settimeout-call-chain': { component: SetTimeoutCallChainDiagram, maxWidth: '720px' },
  'timer-heap': { component: TimerHeapDiagram, maxWidth: '640px' },
  'nexttick-microtask': { component: NextTickMicrotaskDiagram, maxWidth: '820px' },
  'threadpool-size-scenarios': { component: ThreadpoolSizeScenariosDiagram, maxWidth: '800px' },
  'v8-execution-pipeline': { component: V8ExecutionPipelineDiagram, maxWidth: '780px' },
  'hidden-class-transition': { component: HiddenClassTransitionDiagram, maxWidth: '780px' },
  'ic-states': { component: IcStatesDiagram, maxWidth: '780px' },
  'v8-heap-layout': { component: V8HeapLayoutDiagram, maxWidth: '780px' },
  'mark-compact-phases': { component: MarkCompactPhasesDiagram, maxWidth: '820px' },
}

const currentDiagram = computed(() => diagramByKind[props.kind])
</script>

<template>
  <DiagramFrame v-if="currentDiagram" :max-width="currentDiagram.maxWidth">
    <component :is="currentDiagram.component" />
  </DiagramFrame>
</template>
