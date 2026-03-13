import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { h } from 'vue'
import './custom.css'
import QuickNav from './components/QuickNav.vue'
import ClaudeHome from './components/ClaudeHome.vue'
import SectionLanding from './components/SectionLanding.vue'
import OverviewLanding from './components/OverviewLanding.vue'
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
  },
}
