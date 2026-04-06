import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import type { Theme } from 'vitepress'
import { defineAsyncComponent, h } from 'vue'
import './custom.css'
import QuickNav from '@docs-components/QuickNav.vue'
import ClaudeHome from '@docs-components/ClaudeHome.vue'
import SectionLanding from '@docs-components/SectionLanding.vue'
import OverviewLanding from '@docs-components/OverviewLanding.vue'
import Mermaid from '@docs-components/Mermaid.vue'
import WechatQrNotice from '@docs-components/WechatQrNotice.vue'
import DocAfterSlot from '@docs-components/DocAfterSlot.vue'
import SvgPreview from '@docs-components/SvgPreview.vue'

const staticGlobalComponents = {
  QuickNav,
  ClaudeHome,
  SectionLanding,
  OverviewLanding,
  Mermaid,
}

const asyncGlobalComponents = {
  GoSchedulerDiagram: () => import('@docs-components/GoSchedulerDiagram.vue'),
  GoLanguageDiagram: () => import('@docs-components/GoLanguageDiagram.vue'),
  GoRuntimeDiagram: () => import('@docs-components/GoRuntimeDiagram.vue'),
  GoLeakRaceDiagram: () => import('@docs-components/GoLeakRaceDiagram.vue'),
  GoChannelDiagram: () => import('@docs-components/GoChannelDiagram.vue'),
  GoNetworkDiagram: () => import('@docs-components/GoNetworkDiagram.vue'),
  GoEngineeringDiagram: () => import('@docs-components/GoEngineeringDiagram.vue'),
  GoDataCacheDiagram: () => import('@docs-components/GoDataCacheDiagram.vue'),
  GoPerformanceDiagram: () => import('@docs-components/GoPerformanceDiagram.vue'),
  GoMicroserviceDiagram: () => import('@docs-components/GoMicroserviceDiagram.vue'),
  GoHighConcurrencySystemDesignDiagram: () => import('@docs-components/GoHighConcurrencySystemDesignDiagram.vue'),
  HighConcurrencyOverviewDiagram: () => import('@docs-components/HighConcurrencyOverviewDiagram.vue'),
  GoAdvancedTopicDiagram: () => import('@docs-components/GoAdvancedTopicDiagram.vue'),
  GoSecurityDiagram: () => import('@docs-components/GoSecurityDiagram.vue'),
  GoCloudNativeDiagram: () => import('@docs-components/GoCloudNativeDiagram.vue'),
  GoCodegenDiagram: () => import('@docs-components/GoCodegenDiagram.vue'),
  GoInternalsDiagram: () => import('@docs-components/GoInternalsDiagram.vue'),
  GoAdvancedConcurrencyDiagram: () => import('@docs-components/GoAdvancedConcurrencyDiagram.vue'),
  GoSyncPrimitiveDiagram: () => import('@docs-components/GoSyncPrimitiveDiagram.vue'),
  GoSourceReadingDiagram: () => import('@docs-components/GoSourceReadingDiagram.vue'),
  GitDiagram: () => import('@docs-components/GitDiagram.vue'),
  KafkaDiagram: () => import('@docs-components/KafkaDiagram.vue'),
  K8sDiagram: () => import('@docs-components/K8sDiagram.vue'),
  MySQLDurabilityDiagram: () => import('@docs-components/MySQLDurabilityDiagram.vue'),
  MySQLTransactionIsolationDiagram: () => import('@docs-components/MySQLTransactionIsolationDiagram.vue'),
  MySQLHighAvailabilityDiagram: () => import('@docs-components/MySQLHighAvailabilityDiagram.vue'),
  MySQLReplicaDelayDiagram: () => import('@docs-components/MySQLReplicaDelayDiagram.vue'),
  MySQLLargeQueryMemoryDiagram: () => import('@docs-components/MySQLLargeQueryMemoryDiagram.vue'),
  MySQLInsertLocksDiagram: () => import('@docs-components/MySQLInsertLocksDiagram.vue'),
  MySQLInternalTempTableDiagram: () => import('@docs-components/MySQLInternalTempTableDiagram.vue'),
  MySQLJoinUsageDiagram: () => import('@docs-components/MySQLJoinUsageDiagram.vue'),
  MySQLJoinOptimizationDiagram: () => import('@docs-components/MySQLJoinOptimizationDiagram.vue'),
  MySQLInnoDBVsMemoryDiagram: () => import('@docs-components/MySQLInnoDBVsMemoryDiagram.vue'),
  MySQLAutoIncrementGapsDiagram: () => import('@docs-components/MySQLAutoIncrementGapsDiagram.vue'),
  MySQLIndexRedundancyDiagram: () => import('@docs-components/MySQLIndexRedundancyDiagram.vue'),
  PostgreSQLCoreDiagram: () => import('@docs-components/PostgreSQLCoreDiagram.vue'),
  PostgreSQLHaDiagram: () => import('@docs-components/PostgreSQLHaDiagram.vue'),
  PostgreSQLPaymentDiagram: () => import('@docs-components/PostgreSQLPaymentDiagram.vue'),
  NginxDiagram: () => import('@docs-components/NginxDiagram.vue'),
  ToolsDiagram: () => import('@docs-components/ToolsDiagram.vue'),
  RedisCourseDiagram: () => import('@docs-components/RedisCourseDiagram.vue'),
  RedisCourseFigure: () => import('@docs-components/RedisCourseFigure.vue'),
}

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h('div', null, [
      h(DefaultTheme.Layout, null, {
        'doc-after': () => h(DocAfterSlot),
      }),
      h(SvgPreview),
      h(WechatQrNotice),
    ])
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
    for (const [name, component] of Object.entries(staticGlobalComponents)) {
      app.component(name, component)
    }

    // Heavy diagram components only load on pages that actually render them.
    for (const [name, loader] of Object.entries(asyncGlobalComponents)) {
      app.component(name, defineAsyncComponent(loader))
    }
  },
}

export default theme
