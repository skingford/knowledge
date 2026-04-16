import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import type { Theme } from 'vitepress'
import { defineAsyncComponent, h } from 'vue'
import './custom.css'
import QuickNav from '@docs-components/layout/QuickNav.vue'
import ClaudeHome from '@docs-components/layout/ClaudeHome.vue'
import SectionLanding from '@docs-components/layout/SectionLanding.vue'
import OverviewLanding from '@docs-components/layout/OverviewLanding.vue'
import WechatQrNotice from '@docs-components/layout/WechatQrNotice.vue'
import DocAfterSlot from '@docs-components/layout/DocAfterSlot.vue'
import SvgPreview from '@docs-components/common/SvgPreview.vue'
import JdAccessGate from '@docs-components/layout/JdAccessGate.vue'
import DocSidebarToggle from '@docs-components/layout/DocSidebarToggle.vue'

const staticGlobalComponents = {
  QuickNav,
  ClaudeHome,
  SectionLanding,
  OverviewLanding,
}

const asyncGlobalComponents = {
  // Go diagrams
  GoSchedulerDiagram: () => import('@docs-components/go/GoSchedulerDiagram.vue'),
  GoLanguageDiagram: () => import('@docs-components/go/GoLanguageDiagram.vue'),
  GoRuntimeDiagram: () => import('@docs-components/go/GoRuntimeDiagram.vue'),
  GoLeakRaceDiagram: () => import('@docs-components/go/GoLeakRaceDiagram.vue'),
  GoChannelDiagram: () => import('@docs-components/go/GoChannelDiagram.vue'),
  GoNetworkDiagram: () => import('@docs-components/go/GoNetworkDiagram.vue'),
  GoEngineeringDiagram: () => import('@docs-components/go/GoEngineeringDiagram.vue'),
  GoDataCacheDiagram: () => import('@docs-components/go/GoDataCacheDiagram.vue'),
  GoPerformanceDiagram: () => import('@docs-components/go/GoPerformanceDiagram.vue'),
  GoMicroserviceDiagram: () => import('@docs-components/go/GoMicroserviceDiagram.vue'),
  GoHighConcurrencySystemDesignDiagram: () => import('@docs-components/go/GoHighConcurrencySystemDesignDiagram.vue'),
  GoAdvancedTopicDiagram: () => import('@docs-components/go/GoAdvancedTopicDiagram.vue'),
  GoSecurityDiagram: () => import('@docs-components/go/GoSecurityDiagram.vue'),
  GoCloudNativeDiagram: () => import('@docs-components/go/GoCloudNativeDiagram.vue'),
  GoCodegenDiagram: () => import('@docs-components/go/GoCodegenDiagram.vue'),
  GoInternalsDiagram: () => import('@docs-components/go/GoInternalsDiagram.vue'),
  GoAdvancedConcurrencyDiagram: () => import('@docs-components/go/GoAdvancedConcurrencyDiagram.vue'),
  GoSyncPrimitiveDiagram: () => import('@docs-components/go/GoSyncPrimitiveDiagram.vue'),
  GoSourceReadingDiagram: () => import('@docs-components/go/GoSourceReadingDiagram.vue'),
  // High-concurrency diagrams
  HighConcurrencyOverviewDiagram: () => import('@docs-components/hc/HighConcurrencyOverviewDiagram.vue'),
  HcScaleOutDiagram: () => import('@docs-components/hc/HcScaleOutDiagram.vue'),
  HcCacheDiagram: () => import('@docs-components/hc/HcCacheDiagram.vue'),
  HcDatabaseDiagram: () => import('@docs-components/hc/HcDatabaseDiagram.vue'),
  HcAsyncDiagram: () => import('@docs-components/hc/HcAsyncDiagram.vue'),
  HcRateLimitDiagram: () => import('@docs-components/hc/HcRateLimitDiagram.vue'),
  HcMetricsDiagram: () => import('@docs-components/hc/HcMetricsDiagram.vue'),
  HcPrinciplesDiagram: () => import('@docs-components/hc/HcPrinciplesDiagram.vue'),
  HcOversellDiagram: () => import('@docs-components/hc/HcOversellDiagram.vue'),
  HcDistLockDiagram: () => import('@docs-components/hc/HcDistLockDiagram.vue'),
  HcIdempotentDiagram: () => import('@docs-components/hc/HcIdempotentDiagram.vue'),
  HcDistTxDiagram: () => import('@docs-components/hc/HcDistTxDiagram.vue'),
  HcHotspotDiagram: () => import('@docs-components/hc/HcHotspotDiagram.vue'),
  HcResourceDiagram: () => import('@docs-components/hc/HcResourceDiagram.vue'),
  HcHaDiagram: () => import('@docs-components/hc/HcHaDiagram.vue'),
  HcPressureDiagram: () => import('@docs-components/hc/HcPressureDiagram.vue'),
  HcObservabilityDiagram: () => import('@docs-components/hc/HcObservabilityDiagram.vue'),
  HcCanaryDiagram: () => import('@docs-components/hc/HcCanaryDiagram.vue'),
  HcSeckillDiagram: () => import('@docs-components/hc/HcSeckillDiagram.vue'),
  HcDistIdDiagram: () => import('@docs-components/hc/HcDistIdDiagram.vue'),
  HcConsistHashDiagram: () => import('@docs-components/hc/HcConsistHashDiagram.vue'),
  HcAntiCheatDiagram: () => import('@docs-components/hc/HcAntiCheatDiagram.vue'),
  HcMicroserviceDiagram: () => import('@docs-components/hc/HcMicroserviceDiagram.vue'),
  HcNetworkDiagram: () => import('@docs-components/hc/HcNetworkDiagram.vue'),
  HcDelayQueueDiagram: () => import('@docs-components/hc/HcDelayQueueDiagram.vue'),
  HcSkewDiagram: () => import('@docs-components/hc/HcSkewDiagram.vue'),
  HcConfigDiagram: () => import('@docs-components/hc/HcConfigDiagram.vue'),
  HcElasticDiagram: () => import('@docs-components/hc/HcElasticDiagram.vue'),
  // MySQL diagrams
  MySQLDurabilityDiagram: () => import('@docs-components/mysql/MySQLDurabilityDiagram.vue'),
  MySQLTransactionIsolationDiagram: () => import('@docs-components/mysql/MySQLTransactionIsolationDiagram.vue'),
  MySQLHighAvailabilityDiagram: () => import('@docs-components/mysql/MySQLHighAvailabilityDiagram.vue'),
  MySQLReplicaDelayDiagram: () => import('@docs-components/mysql/MySQLReplicaDelayDiagram.vue'),
  MySQLLargeQueryMemoryDiagram: () => import('@docs-components/mysql/MySQLLargeQueryMemoryDiagram.vue'),
  MySQLInsertLocksDiagram: () => import('@docs-components/mysql/MySQLInsertLocksDiagram.vue'),
  MySQLInternalTempTableDiagram: () => import('@docs-components/mysql/MySQLInternalTempTableDiagram.vue'),
  MySQLJoinUsageDiagram: () => import('@docs-components/mysql/MySQLJoinUsageDiagram.vue'),
  MySQLJoinOptimizationDiagram: () => import('@docs-components/mysql/MySQLJoinOptimizationDiagram.vue'),
  MySQLInnoDBVsMemoryDiagram: () => import('@docs-components/mysql/MySQLInnoDBVsMemoryDiagram.vue'),
  MySQLAutoIncrementGapsDiagram: () => import('@docs-components/mysql/MySQLAutoIncrementGapsDiagram.vue'),
  MySQLIndexRedundancyDiagram: () => import('@docs-components/mysql/MySQLIndexRedundancyDiagram.vue'),
  // PostgreSQL diagrams
  PostgreSQLCoreDiagram: () => import('@docs-components/postgresql/PostgreSQLCoreDiagram.vue'),
  PostgreSQLHaDiagram: () => import('@docs-components/postgresql/PostgreSQLHaDiagram.vue'),
  PostgreSQLPaymentDiagram: () => import('@docs-components/postgresql/PostgreSQLPaymentDiagram.vue'),
  // Infrastructure diagrams
  GitDiagram: () => import('@docs-components/infra/GitDiagram.vue'),
  KafkaDiagram: () => import('@docs-components/kafka/KafkaDiagram.vue'),
  K8sDiagram: () => import('@docs-components/k8s/K8sDiagram.vue'),
  NginxDiagram: () => import('@docs-components/infra/NginxDiagram.vue'),
  ToolsDiagram: () => import('@docs-components/infra/ToolsDiagram.vue'),
  // Redis diagrams
  RedisCourseDiagram: () => import('@docs-components/redis/RedisCourseDiagram.vue'),
  RedisCourseFigure: () => import('@docs-components/redis/RedisCourseFigure.vue'),
  // Emqx diagrams
  EmqxPlatformDecisionDiagram: () => import('@docs-components/emqx/EmqxPlatformDecisionDiagram.vue'),
  EmqxPlatformOverviewDiagram: () => import('@docs-components/emqx/EmqxPlatformOverviewDiagram.vue'),
  EmqxInternalArchDiagram: () => import('@docs-components/emqx/EmqxInternalArchDiagram.vue'),
  EmqxMriaDiagram: () => import('@docs-components/emqx/EmqxMriaDiagram.vue'),
  EmqxImMessageFlowDiagram: () => import('@docs-components/emqx/EmqxImMessageFlowDiagram.vue'),
  EmqxIotDataPipelineDiagram: () => import('@docs-components/emqx/EmqxIotDataPipelineDiagram.vue'),
  EmqxAuthChainDiagram: () => import('@docs-components/emqx/EmqxAuthChainDiagram.vue'),
}

const theme: Theme = {
  extends: DefaultTheme,
  Layout() {
    return h(JdAccessGate, null, {
      default: () => h('div', null, [
        h(DefaultTheme.Layout, null, {
          'doc-after': () => h(DocAfterSlot),
        }),
        h(DocSidebarToggle),
        h(SvgPreview),
        h(WechatQrNotice),
      ]),
    })
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
