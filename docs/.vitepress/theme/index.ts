import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import './custom.css'
import QuickNav from './components/QuickNav.vue'
import ClaudeHome from './components/ClaudeHome.vue'
import SectionLanding from './components/SectionLanding.vue'
import OverviewLanding from './components/OverviewLanding.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    enhanceAppWithTabs(app)
    app.component('QuickNav', QuickNav)
    app.component('ClaudeHome', ClaudeHome)
    app.component('SectionLanding', SectionLanding)
    app.component('OverviewLanding', OverviewLanding)
  },
}
