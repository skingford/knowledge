import DefaultTheme from 'vitepress/theme-without-fonts'
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client'
import { h } from 'vue'
import { useData } from 'vitepress'
import './custom.css'
import QuickNav from './components/QuickNav.vue'
import ClaudeHome from './components/ClaudeHome.vue'
import SectionLanding from './components/SectionLanding.vue'
import OverviewLanding from './components/OverviewLanding.vue'
import WechatQrNotice from './components/WechatQrNotice.vue'
import VocabularyCard from './components/VocabularyCard.vue'

function DocAfterSlot() {
  const { frontmatter } = useData()
  const vocab = frontmatter.value?.vocabulary
  if (!vocab?.length) return null
  return h(VocabularyCard, { items: vocab })
}

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
