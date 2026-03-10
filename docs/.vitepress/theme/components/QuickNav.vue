<script setup lang="ts">
interface Site {
  name: string
  desc: string
  domain: string
  fallback: string
  url: string
  lightBg?: boolean
}

interface Category {
  title: string
  emoji: string
  sites: Site[]
}

const getFavicon = (domain: string) =>
  `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`

const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.nextElementSibling as HTMLElement
  if (fallback) fallback.style.display = 'inline'
}

const categories: Category[] = [
  {
    title: 'AI 对话助手',
    emoji: '🤖',
    sites: [
      { name: 'Claude', desc: 'Anthropic 出品，擅长分析与长文本理解', domain: 'claude.ai', fallback: '🟠', url: 'https://claude.ai' },
      { name: 'ChatGPT', desc: 'OpenAI 旗舰模型，生态最广泛', domain: 'chat.openai.com', fallback: '🟢', url: 'https://chat.openai.com' },
      { name: 'Gemini', desc: 'Google 多模态大模型，深度集成 Google 服务', domain: 'gemini.google.com', fallback: '🔵', url: 'https://gemini.google.com' },
      { name: 'DeepSeek', desc: '国产顶级推理模型，性价比极高', domain: 'chat.deepseek.com', fallback: '🌊', url: 'https://chat.deepseek.com' },
      { name: 'Grok', desc: 'xAI 出品，实时联网，内嵌 X 平台', domain: 'grok.com', fallback: '⚡', url: 'https://grok.com' },
      { name: 'Kimi', desc: 'Moonshot AI，长文本处理能力强', domain: 'kimi.moonshot.cn', fallback: '🌙', url: 'https://kimi.moonshot.cn' },
      { name: '豆包', desc: '字节跳动出品，中文场景优化', domain: 'www.doubao.com', fallback: '🫘', url: 'https://www.doubao.com' },
    ],
  },
  {
    title: 'AI 编码工具',
    emoji: '💻',
    sites: [
      { name: 'Claude Code', desc: 'Anthropic 官方 CLI 编码助手，终端原生体验', domain: 'claude.ai', fallback: '⌨️', url: 'https://claude.ai/code' },
      { name: 'OpenAI Codex', desc: 'OpenAI 云端软件工程 Agent，异步并行执行任务', domain: 'openai.com', fallback: '🤖', url: 'https://openai.com/codex' },
      { name: 'OpenCode', desc: 'SST 出品的开源终端 AI 编码助手，多模型支持', domain: 'opencode.ai', fallback: '🖥️', url: 'https://opencode.ai' },
      { name: 'Cursor', desc: 'AI 原生代码编辑器，基于 VSCode 深度改造', domain: 'cursor.sh', fallback: '🖱️', url: 'https://cursor.sh' },
      { name: 'Antigravity', desc: 'Google 出品的 AI 编码 Agent，深度集成 Google 生态', domain: 'antigravity.google', fallback: '🪐', url: 'https://antigravity.google/' },
      { name: 'GitHub Copilot', desc: 'GitHub 官方 AI 编程助手，IDE 集成最广', domain: 'github.com', fallback: '🐙', url: 'https://github.com/features/copilot' },
      { name: 'Windsurf', desc: 'Codeium 出品，流式 AI 编码体验', domain: 'windsurf.com', fallback: '🏄', url: 'https://windsurf.com' },
      { name: 'Devin', desc: 'Cognition 出品，首个自主 AI 软件工程师', domain: 'cognition.ai', fallback: '🤖', url: 'https://cognition.ai/devin' },
      { name: 'v0', desc: 'Vercel 出品，基于提示生成 React / Tailwind UI', domain: 'v0.dev', fallback: '▲', url: 'https://v0.dev' },
      { name: 'Bolt', desc: 'StackBlitz 出品，浏览器内全栈 AI 开发', domain: 'bolt.new', fallback: '⚡', url: 'https://bolt.new' },
      { name: 'Aider', desc: '终端 AI 结对编程工具，Git 感知自动提交', domain: 'aider.chat', fallback: '🖥️', url: 'https://aider.chat' },
      { name: 'Continue', desc: '开源 AI 编码扩展，支持 VSCode / JetBrains', domain: 'continue.dev', fallback: '🔌', url: 'https://continue.dev' },
    ],
  },
  {
    title: 'AI 研究工具',
    emoji: '🔍',
    sites: [
      { name: 'NotebookLM', desc: 'Google 出品，基于文档的 AI 问答与播客生成', domain: 'notebooklm.google.com', fallback: '📓', url: 'https://notebooklm.google.com' },
      { name: 'Perplexity', desc: 'AI 搜索引擎，实时联网并引用来源', domain: 'www.perplexity.ai', fallback: '🔎', url: 'https://www.perplexity.ai' },
      { name: 'Hugging Face', desc: '开源 AI 模型、数据集与 Space 社区', domain: 'huggingface.co', fallback: '🤗', url: 'https://huggingface.co' },
      { name: 'Arena', desc: 'AI 模型能力对比与排行榜平台', domain: 'arena.ai', fallback: '🏆', url: 'https://arena.ai/', lightBg: true },
    ],
  },
  {
    title: '开发者工具',
    emoji: '🛠️',
    sites: [
      { name: 'GitHub', desc: '代码托管与协作开发平台', domain: 'github.com', fallback: '🐱', url: 'https://github.com' },
      { name: 'MDN Web Docs', desc: 'Web 技术权威参考文档', domain: 'developer.mozilla.org', fallback: '📚', url: 'https://developer.mozilla.org' },
      { name: 'Can I Use', desc: '浏览器特性兼容性查询', domain: 'caniuse.com', fallback: '✅', url: 'https://caniuse.com' },
      { name: 'Regex101', desc: '正则表达式在线测试与调试', domain: 'regex101.com', fallback: '🧪', url: 'https://regex101.com' },
      { name: 'DevDocs', desc: '多语言 / 框架 API 文档聚合', domain: 'devdocs.io', fallback: '📖', url: 'https://devdocs.io' },
    ],
  },
  {
    title: 'Skill 资源',
    emoji: '🧩',
    sites: [
      { name: 'skills.sh', desc: 'Skill 目录与发现平台，适合查找 AI Agent / Codex 可复用技能', domain: 'skills.sh', fallback: '🧠', url: 'https://skills.sh/' },
    ],
  },
  {
    title: 'AI 设计',
    emoji: '🎨',
    sites: [
      { name: 'Stitch', desc: 'Google 出品的 AI UI 设计工具，适合快速生成界面草图与页面结构', domain: 'stitch.withgoogle.com', fallback: '🪡', url: 'https://stitch.withgoogle.com/' },
      { name: 'Figma', desc: '主流协作式界面设计平台，支持设计、原型与开发交付', domain: 'figma.com', fallback: '🎯', url: 'https://www.figma.com/' },
      { name: 'Pencil', desc: '开源界面设计与原型工具，适合快速画线框和流程页面', domain: 'pencil.evolus.vn', fallback: '✏️', url: 'https://pencil.evolus.vn/' },
    ],
  },
  {
    title: 'AI 音频',
    emoji: '🎵',
    sites: [
      { name: 'Seedance 2.0', desc: '字节 Seed 团队的多模态生成工具，支持音频输入并生成带原生音频的视频内容', domain: 'seed.bytedance.com', fallback: '🌊', url: 'https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0' },
      { name: 'Suno', desc: '主流 AI 音乐生成平台，可通过提示词快速生成歌曲、配乐与音频素材', domain: 'suno.com', fallback: '🎤', url: 'https://suno.com/' },
      { name: 'Udio', desc: 'AI 音乐生成平台，擅长生成高完成度歌曲与旋律片段', domain: 'udio.com', fallback: '🎶', url: 'https://www.udio.com/home' },
      { name: 'ElevenLabs', desc: 'AI 语音与音频生成平台，适合配音、旁白、语音克隆与播客场景', domain: 'elevenlabs.io', fallback: '🗣️', url: 'https://elevenlabs.io/' },
    ],
  },
]
</script>

<template>
  <div class="quick-nav">
    <div v-for="cat in categories" :key="cat.title" class="nav-category">
      <h2 class="cat-title">
        <span class="cat-emoji">{{ cat.emoji }}</span>
        {{ cat.title }}
      </h2>
      <div class="sites-grid">
        <a
          v-for="site in cat.sites"
          :key="site.name"
          :href="site.url"
          target="_blank"
          rel="noopener noreferrer"
          class="site-card"
        >
          <div class="site-icon-wrap" :class="{ 'light-bg': site.lightBg }">
            <img
              :src="getFavicon(site.domain)"
              :alt="site.name"
              class="site-favicon"
              @error="onImgError"
            />
            <span class="site-icon-fallback">{{ site.fallback }}</span>
          </div>
          <span class="site-name">{{ site.name }}</span>
          <span class="site-desc">{{ site.desc }}</span>
          <span class="site-link-icon">↗</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-nav {
  padding: 16px 0 48px;
}

.nav-category {
  margin-bottom: 40px;
}

.cat-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  border-top: none;
  letter-spacing: -0.01em;
}

.cat-emoji {
  font-size: 20px;
  line-height: 1;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.site-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.site-card:hover {
  transform: translateY(-2px);
  border-color: #c46849;
  box-shadow: 0 4px 24px rgba(196, 104, 73, 0.1);
}

.dark .site-card {
  background: #121212;
  border-color: #262626;
}

.dark .site-card:hover {
  border-color: #c46849;
  box-shadow: 0 4px 24px rgba(196, 104, 73, 0.15);
}

.site-icon-wrap {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}

.site-favicon {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
}

.dark .site-icon-wrap.light-bg {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 8px;
  padding: 3px;
}

.site-icon-fallback {
  display: none;
  font-size: 24px;
  line-height: 1;
}

.site-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: -0.01em;
}

.site-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  line-height: 1.5;
  flex: 1;
}

.site-link-icon {
  position: absolute;
  top: 12px;
  right: 14px;
  font-size: 14px;
  color: var(--vp-c-text-3);
  transition: color 0.2s ease, transform 0.2s ease;
}

.site-card:hover .site-link-icon {
  color: #c46849;
  transform: translate(1px, -1px);
}

@media (max-width: 640px) {
  .sites-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 380px) {
  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
