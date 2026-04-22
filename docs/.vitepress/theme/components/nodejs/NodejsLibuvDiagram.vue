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
}

const currentDiagram = computed(() => diagramByKind[props.kind])
</script>

<template>
  <DiagramFrame v-if="currentDiagram" :max-width="currentDiagram.maxWidth">
    <component :is="currentDiagram.component" />
  </DiagramFrame>
</template>
