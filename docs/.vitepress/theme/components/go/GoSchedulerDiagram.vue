<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
import ThreadVsGoroutineDiagram from './scheduler/ThreadVsGoroutineDiagram.vue'
import LifecycleDiagram from './scheduler/LifecycleDiagram.vue'
import RolesDiagram from './scheduler/RolesDiagram.vue'
import ScheduleFlowDiagram from './scheduler/ScheduleFlowDiagram.vue'
import WorkStealingDiagram from './scheduler/WorkStealingDiagram.vue'
import FindRunnableDiagram from './scheduler/FindRunnableDiagram.vue'
import RunQueueDiagram from './scheduler/RunQueueDiagram.vue'
import HandoffDiagram from './scheduler/HandoffDiagram.vue'
import PreemptionDiagram from './scheduler/PreemptionDiagram.vue'
import SpinningDiagram from './scheduler/SpinningDiagram.vue'
import StackGrowthDiagram from './scheduler/StackGrowthDiagram.vue'
import GoexitDiagram from './scheduler/GoexitDiagram.vue'
import PBlockingScenariosDiagram from './scheduler/PBlockingScenariosDiagram.vue'
import SysmonWorkflowDiagram from './scheduler/SysmonWorkflowDiagram.vue'

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
  | 'sysmon-workflow'

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
  'sysmon-workflow': { component: SysmonWorkflowDiagram, maxWidth: '760px' },
}

const currentDiagram = computed(() => diagramByKind[props.kind])
</script>

<template>
  <DiagramFrame v-if="currentDiagram" :max-width="currentDiagram.maxWidth">
    <component :is="currentDiagram.component" />
  </DiagramFrame>
</template>
