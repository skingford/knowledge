import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { h } from 'vue'
import './custom.css'
import QuickNav from './components/QuickNav.vue'
import ClaudeHome from './components/ClaudeHome.vue'
import SectionLanding from './components/SectionLanding.vue'
import OverviewLanding from './components/OverviewLanding.vue'
import GoSchedulerDiagram from './components/GoSchedulerDiagram.vue'
import GoLanguageDiagram from './components/GoLanguageDiagram.vue'
import GoRuntimeDiagram from './components/GoRuntimeDiagram.vue'
import GoLeakRaceDiagram from './components/GoLeakRaceDiagram.vue'
import GoChannelDiagram from './components/GoChannelDiagram.vue'
import GoNetworkDiagram from './components/GoNetworkDiagram.vue'
import GoEngineeringDiagram from './components/GoEngineeringDiagram.vue'
import GoDataCacheDiagram from './components/GoDataCacheDiagram.vue'
import GoPerformanceDiagram from './components/GoPerformanceDiagram.vue'
import GoMicroserviceDiagram from './components/GoMicroserviceDiagram.vue'
import GoAdvancedTopicDiagram from './components/GoAdvancedTopicDiagram.vue'
import GoSecurityDiagram from './components/GoSecurityDiagram.vue'
import GoCloudNativeDiagram from './components/GoCloudNativeDiagram.vue'
import GoCodegenDiagram from './components/GoCodegenDiagram.vue'
import GoInternalsDiagram from './components/GoInternalsDiagram.vue'
import GoAdvancedConcurrencyDiagram from './components/GoAdvancedConcurrencyDiagram.vue'
import GoSyncPrimitiveDiagram from './components/GoSyncPrimitiveDiagram.vue'
import MySQLDurabilityDiagram from './components/MySQLDurabilityDiagram.vue'
import MySQLTransactionIsolationDiagram from './components/MySQLTransactionIsolationDiagram.vue'
import MySQLHighAvailabilityDiagram from './components/MySQLHighAvailabilityDiagram.vue'
import MySQLReplicaDelayDiagram from './components/MySQLReplicaDelayDiagram.vue'
import MySQLLargeQueryMemoryDiagram from './components/MySQLLargeQueryMemoryDiagram.vue'
import MySQLInsertLocksDiagram from './components/MySQLInsertLocksDiagram.vue'
import MySQLInternalTempTableDiagram from './components/MySQLInternalTempTableDiagram.vue'
import MySQLJoinUsageDiagram from './components/MySQLJoinUsageDiagram.vue'
import MySQLJoinOptimizationDiagram from './components/MySQLJoinOptimizationDiagram.vue'
import MySQLInnoDBVsMemoryDiagram from './components/MySQLInnoDBVsMemoryDiagram.vue'
import MySQLAutoIncrementGapsDiagram from './components/MySQLAutoIncrementGapsDiagram.vue'
import WechatQrNotice from './components/WechatQrNotice.vue'
import DocAfterSlot from './components/DocAfterSlot.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h('div', null, [
      h(DefaultTheme.Layout, null, {
        'doc-after': () => h(DocAfterSlot),
      }),
      h(WechatQrNotice),
    ])
  },
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
    app.component('QuickNav', QuickNav)
    app.component('ClaudeHome', ClaudeHome)
    app.component('SectionLanding', SectionLanding)
    app.component('OverviewLanding', OverviewLanding)
    app.component('GoSchedulerDiagram', GoSchedulerDiagram)
    app.component('GoLanguageDiagram', GoLanguageDiagram)
    app.component('GoRuntimeDiagram', GoRuntimeDiagram)
    app.component('GoLeakRaceDiagram', GoLeakRaceDiagram)
    app.component('GoChannelDiagram', GoChannelDiagram)
    app.component('GoNetworkDiagram', GoNetworkDiagram)
    app.component('GoEngineeringDiagram', GoEngineeringDiagram)
    app.component('GoDataCacheDiagram', GoDataCacheDiagram)
    app.component('GoPerformanceDiagram', GoPerformanceDiagram)
    app.component('GoMicroserviceDiagram', GoMicroserviceDiagram)
    app.component('GoAdvancedTopicDiagram', GoAdvancedTopicDiagram)
    app.component('GoSecurityDiagram', GoSecurityDiagram)
    app.component('GoCloudNativeDiagram', GoCloudNativeDiagram)
    app.component('GoCodegenDiagram', GoCodegenDiagram)
    app.component('GoInternalsDiagram', GoInternalsDiagram)
    app.component('GoAdvancedConcurrencyDiagram', GoAdvancedConcurrencyDiagram)
    app.component('GoSyncPrimitiveDiagram', GoSyncPrimitiveDiagram)
    app.component('MySQLDurabilityDiagram', MySQLDurabilityDiagram)
    app.component('MySQLTransactionIsolationDiagram', MySQLTransactionIsolationDiagram)
    app.component('MySQLHighAvailabilityDiagram', MySQLHighAvailabilityDiagram)
    app.component('MySQLReplicaDelayDiagram', MySQLReplicaDelayDiagram)
    app.component('MySQLLargeQueryMemoryDiagram', MySQLLargeQueryMemoryDiagram)
    app.component('MySQLInsertLocksDiagram', MySQLInsertLocksDiagram)
    app.component('MySQLInternalTempTableDiagram', MySQLInternalTempTableDiagram)
    app.component('MySQLJoinUsageDiagram', MySQLJoinUsageDiagram)
    app.component('MySQLJoinOptimizationDiagram', MySQLJoinOptimizationDiagram)
    app.component('MySQLInnoDBVsMemoryDiagram', MySQLInnoDBVsMemoryDiagram)
    app.component('MySQLAutoIncrementGapsDiagram', MySQLAutoIncrementGapsDiagram)
  },
}
