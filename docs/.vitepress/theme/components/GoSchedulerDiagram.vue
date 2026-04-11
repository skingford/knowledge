<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'
import ThreadVsGoroutineDiagram from './go-scheduler/ThreadVsGoroutineDiagram.vue'
import LifecycleDiagram from './go-scheduler/LifecycleDiagram.vue'
import RolesDiagram from './go-scheduler/RolesDiagram.vue'
import ScheduleFlowDiagram from './go-scheduler/ScheduleFlowDiagram.vue'
import WorkStealingDiagram from './go-scheduler/WorkStealingDiagram.vue'
import FindRunnableDiagram from './go-scheduler/FindRunnableDiagram.vue'
import RunQueueDiagram from './go-scheduler/RunQueueDiagram.vue'
import HandoffDiagram from './go-scheduler/HandoffDiagram.vue'
import PreemptionDiagram from './go-scheduler/PreemptionDiagram.vue'
import SpinningDiagram from './go-scheduler/SpinningDiagram.vue'
import StackGrowthDiagram from './go-scheduler/StackGrowthDiagram.vue'
import GoexitDiagram from './go-scheduler/GoexitDiagram.vue'
import PBlockingScenariosDiagram from './go-scheduler/PBlockingScenariosDiagram.vue'

type DiagramKind =
  | 'thread-vs-goroutine'
  | 'lifecycle'
  | 'roles'
  | 'schedule-flow'
  | 'work-stealing'
  | 'findrunnable'
  | 'run-queue'
  | 'handoff'
  | 'preemption'
  | 'spinning'
  | 'stack-growth'
  | 'goexit'
  | 'p-blocking-scenarios'

const props = defineProps<{
  kind: DiagramKind
}>()

const diagramByKind: Record<DiagramKind, { component: Component; maxWidth: string }> = {
  'thread-vs-goroutine': { component: ThreadVsGoroutineDiagram, maxWidth: '680px' },
  lifecycle: { component: LifecycleDiagram, maxWidth: '520px' },
  roles: { component: RolesDiagram, maxWidth: '560px' },
  'schedule-flow': { component: ScheduleFlowDiagram, maxWidth: '520px' },
  'work-stealing': { component: WorkStealingDiagram, maxWidth: '680px' },
  findrunnable: { component: FindRunnableDiagram, maxWidth: '520px' },
  'run-queue': { component: RunQueueDiagram, maxWidth: '720px' },
  handoff: { component: HandoffDiagram, maxWidth: '680px' },
  preemption: { component: PreemptionDiagram, maxWidth: '720px' },
  spinning: { component: SpinningDiagram, maxWidth: '640px' },
  'stack-growth': { component: StackGrowthDiagram, maxWidth: '680px' },
  goexit: { component: GoexitDiagram, maxWidth: '680px' },
  'p-blocking-scenarios': { component: PBlockingScenariosDiagram, maxWidth: '760px' },
}

const currentDiagram = computed(() => diagramByKind[props.kind])
</script>

<template>
  <DiagramFrame v-if="currentDiagram" :max-width="currentDiagram.maxWidth">
    <component :is="currentDiagram.component" />
  </DiagramFrame>
</template>
