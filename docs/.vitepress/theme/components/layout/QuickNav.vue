<script setup lang="ts">
import QuickNavCategoryIcon from "./QuickNavCategoryIcon.vue";
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Site {
  name: string;
  desc: string;
  domain: string;
  fallback: string;
  url: string;
  lightBg?: boolean;
}

type CategoryIconName =
  | "talk"
  | "code"
  | "research"
  | "skill"
  | "workflow"
  | "guide"
  | "design"
  | "audio"
  | "tools"
  | "ranking"
  | "pay"
  | "career";

interface Category {
  title: string;
  icon: CategoryIconName;
  sites: Site[];
}

const getFavicon = (domain: string) =>
  `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;

const onImgError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = "none";
  const fallback = img.nextElementSibling as HTMLElement;
  if (fallback) fallback.style.display = "inline";
};

const activeCategory = ref("");
const searchQuery = ref("");

const clearSearch = () => {
  searchQuery.value = "";
};

const getCategoryId = (title: string) =>
  title.replace(/\s+/g, "-").toLowerCase();

let clickLock = "";
let clickTimer = 0;

const scrollToCategory = (title: string) => {
  const id = getCategoryId(title);
  const el = document.getElementById(id);
  if (el) {
    clickLock = id;
    activeCategory.value = id;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      clickLock = "";
    }, 1000);
  }
};

const updateActiveOnScroll = () => {
  if (clickLock) {
    activeCategory.value = clickLock;
    return;
  }
  const sections = Array.from(
    document.querySelectorAll(".nav-category[id]"),
  ) as HTMLElement[];
  if (!sections.length) return;

  const scrollY = window.scrollY;
  const windowHeight = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  const navOffset = 100;

  // Step 1: normal logic — last section whose top scrolled past navOffset
  let current = "";
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= navOffset) {
      current = section.id;
    }
  }

  // Step 2: near bottom — advance one-by-one to sections that can't reach navOffset
  const distToBottom = docHeight - scrollY - windowHeight;
  if (distToBottom < 300) {
    const currentIdx = current
      ? sections.findIndex((s) => s.id === current)
      : -1;
    const ratio = 1 - distToBottom / 300;
    const dynamicThreshold =
      navOffset + ratio * (windowHeight * 0.5 - navOffset);
    for (let i = currentIdx + 1; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= dynamicThreshold) {
        current = sections[i].id;
      }
    }
  }

  activeCategory.value = current || sections[0].id;
};

let rafId = 0;
const onScroll = () => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updateActiveOnScroll);
};

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && searchQuery.value) {
    clearSearch();
  }
};

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("keydown", handleGlobalKeydown);
  updateActiveOnScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("keydown", handleGlobalKeydown);
  cancelAnimationFrame(rafId);
});

const categories: Category[] = [
  {
    title: "AI 对话与模型",
    icon: "talk",
    sites: [
      {
        name: "Claude",
        desc: "Anthropic 出品，擅长分析与长文本理解",
        domain: "claude.ai",
        fallback: "🟠",
        url: "https://claude.ai",
      },
      {
        name: "ChatGPT",
        desc: "OpenAI 旗舰模型，生态最广泛",
        domain: "chat.openai.com",
        fallback: "🟢",
        url: "https://chat.openai.com",
      },
      {
        name: "Gemini",
        desc: "Google 多模态大模型，深度集成 Google 服务",
        domain: "gemini.google.com",
        fallback: "🔵",
        url: "https://gemini.google.com",
      },
      {
        name: "Grok",
        desc: "xAI 出品，实时联网，内嵌 X 平台",
        domain: "grok.com",
        fallback: "⚡",
        url: "https://grok.com",
      },
      {
        name: "DeepSeek",
        desc: "国产顶级推理模型，性价比极高",
        domain: "chat.deepseek.com",
        fallback: "🌊",
        url: "https://chat.deepseek.com",
      },
      {
        name: "Kimi",
        desc: "Moonshot AI，长文本处理能力强",
        domain: "kimi.moonshot.cn",
        fallback: "🌙",
        url: "https://kimi.moonshot.cn",
      },
      {
        name: "豆包",
        desc: "字节跳动出品，中文场景优化",
        domain: "www.doubao.com",
        fallback: "🫘",
        url: "https://www.doubao.com",
      },
    ],
  },
  {
    title: "AI 编程与助手",
    icon: "code",
    sites: [
      {
        name: "Claude Code",
        desc: "Anthropic 官方 CLI 编码助手，终端原生体验",
        domain: "claude.ai",
        fallback: "⌨️",
        url: "https://claude.ai/code",
      },
      {
        name: "Codex",
        desc: "OpenAI 云端软件工程 Agent，异步并行执行任务",
        domain: "openai.com",
        fallback: "🤖",
        url: "https://openai.com/codex",
      },
      {
        name: "Gemini CLI",
        desc: "Google 的终端 AI 编码助手，支持 MCP、skills、subagents 与自动化工作流",
        domain: "geminicli.com",
        fallback: "💎",
        url: "https://geminicli.com/docs/",
      },
      {
        name: "Cursor",
        desc: "AI 原生代码编辑器，基于 VSCode 深度改造",
        domain: "cursor.sh",
        fallback: "🖱️",
        url: "https://cursor.sh",
      },
      {
        name: "OpenCode",
        desc: "SST 出品的开源终端 AI 编码助手，多模型支持",
        domain: "opencode.ai",
        fallback: "🖥️",
        url: "https://opencode.ai",
      },
      {
        name: "GitHub Copilot",
        desc: "GitHub 官方 AI 编程助手，IDE 集成最广",
        domain: "github.com",
        fallback: "🐙",
        url: "https://github.com/features/copilot",
      },
      {
        name: "Antigravity",
        desc: "Google 出品的 AI 编码 Agent，深度集成 Google 生态",
        domain: "antigravity.google",
        fallback: "🪐",
        url: "https://antigravity.google/",
      },
      {
        name: "Clawd on Desk",
        desc: "桌面像素宠物，实时响应 Claude Code、Codex、Cursor 等 AI 编码 Agent 状态",
        domain: "github.com",
        fallback: "🦀",
        url: "https://github.com/rullerzhou-afk/clawd-on-desk",
      },
    ],
  },
  {
    title: "AI 智能体",
    icon: "workflow",
    sites: [
      {
        name: "Hermes Agent",
        desc: "Nous Research 的开源个人 Agent，支持持续学习、技能沉淀与跨会话记忆",
        domain: "hermes-agent.nousresearch.com",
        fallback: "🧠",
        url: "https://hermes-agent.nousresearch.com",
      },
      {
        name: "OpenClaw",
        desc: "把 WhatsApp、Telegram 等聊天应用接到 AI Agent 的个人助理平台",
        domain: "openclaw.ai",
        fallback: "🦾",
        url: "https://openclaw.ai/",
      },
    ],
  },
  {
    title: "AI 搜索与研究",
    icon: "research",
    sites: [
      {
        name: "NotebookLM",
        desc: "Google 出品，基于文档的 AI 问答与播客生成",
        domain: "notebooklm.google.com",
        fallback: "📓",
        url: "https://notebooklm.google.com",
      },
      {
        name: "Perplexity",
        desc: "AI 搜索引擎，实时联网并引用来源",
        domain: "www.perplexity.ai",
        fallback: "🔎",
        url: "https://www.perplexity.ai",
      },
      {
        name: "Hugging Face",
        desc: "开源 AI 模型、数据集与 Space 社区",
        domain: "huggingface.co",
        fallback: "🤗",
        url: "https://huggingface.co",
      },
      {
        name: "Arena",
        desc: "AI 模型能力对比与排行榜平台",
        domain: "arena.ai",
        fallback: "🏆",
        url: "https://arena.ai/",
        lightBg: true,
      },
    ],
  },
  {
    title: "AI 技能与指令",
    icon: "skill",
    sites: [
      {
        name: "skills.sh",
        desc: "AI Skill 发现平台",
        domain: "skills.sh",
        fallback: "🧠",
        url: "https://skills.sh/",
      },
      {
        name: "Tessl",
        desc: "Agent skills 与 context 的注册表与包管理平台",
        domain: "tessl.io",
        fallback: "🧩",
        url: "https://tessl.io/",
      },
      {
        name: "Minimalist Entrepreneur Skills",
        desc: "基于《The Minimalist Entrepreneur》的 Claude Code skills 集",
        domain: "github.com",
        fallback: "📘",
        url: "https://github.com/slavingia/skills",
      },
      {
        name: "Andrej Karpathy Skills",
        desc: "基于 Andrej Karpathy 对 LLM 编码误区观察整理 of Claude Code 行为增强 CLAUDE.md",
        domain: "github.com",
        fallback: "🧭",
        url: "https://github.com/forrestchang/andrej-karpathy-skills",
      },
    ],
  },
  {
    title: "AI 开发与工作流",
    icon: "workflow",
    sites: [
      {
        name: "Everything Claude Code",
        desc: "Claude Code 组合技",
        domain: "github.com",
        fallback: "📦",
        url: "https://github.com/affaan-m/everything-claude-code",
      },
      {
        name: "ccg-workflow",
        desc: "多模型协作开发工作流",
        domain: "github.com",
        fallback: "🧬",
        url: "https://github.com/fengshao1227/ccg-workflow",
      },
      {
        name: "BMAD-METHOD",
        desc: "AI 敏捷开发方法论库",
        domain: "github.com",
        fallback: "🗂️",
        url: "https://github.com/bmad-code-org/BMAD-METHOD",
      },
      {
        name: "Agency Agents",
        desc: "多 Agent 协作项目集",
        domain: "github.com",
        fallback: "🤝",
        url: "https://github.com/msitarzewski/agency-agents",
      },
      {
        name: "DeerFlow",
        desc: "深度研究工作流框架",
        domain: "github.com",
        fallback: "🦌",
        url: "https://github.com/bytedance/deer-flow",
      },
      {
        name: "oh-my-codex",
        desc: "Codex 增强框架",
        domain: "github.com",
        fallback: "🧰",
        url: "https://github.com/Yeachan-Heo/oh-my-codex",
      },
      {
        name: "oh-my-claudecode",
        desc: "Claude Code 增强框架",
        domain: "github.com",
        fallback: "🤖",
        url: "https://github.com/Yeachan-Heo/oh-my-claudecode",
      },
      {
        name: "oh-my-openagent",
        desc: "OpenAgent 增强框架",
        domain: "github.com",
        fallback: "🧩",
        url: "https://github.com/code-yeongyu/oh-my-openagent",
      },
      {
        name: "gstack",
        desc: "Claude Code 虚拟工程团队工作流",
        domain: "github.com",
        fallback: "🏗️",
        url: "https://github.com/garrytan/gstack",
      },
      {
        name: "Superpowers",
        desc: "编码 Agent 技能框架",
        domain: "github.com",
        fallback: "🚀",
        url: "https://github.com/obra/superpowers",
      },
      {
        name: "OpenSpec",
        desc: "AI 规格定义协作工具",
        domain: "github.com",
        fallback: "📐",
        url: "https://github.com/Fission-AI/OpenSpec",
      },
    ],
  },
  {
    title: "AI 实践与指南",
    icon: "guide",
    sites: [
      {
        name: "Learn Claude Code",
        desc: "Claude Code 中文指南",
        domain: "github.com",
        fallback: "📘",
        url: "https://github.com/shareAI-lab/learn-claude-code",
      },
      {
        name: "claude-howto",
        desc: "Claude Code 实践手册",
        domain: "github.com",
        fallback: "🧭",
        url: "https://github.com/luongnv89/claude-howto",
      },
      {
        name: "claude-code-best-practice",
        desc: "Claude Code 最佳实践与经验整理",
        domain: "github.com",
        fallback: "⭐",
        url: "https://github.com/shanraisshan/claude-code-best-practice",
      },
      {
        name: "AgentGuide",
        desc: "AI Agent 开发学习指南",
        domain: "github.com",
        fallback: "🗺️",
        url: "https://github.com/adongwanai/AgentGuide",
      },
    ],
  },
  {
    title: "AI 视觉与设计",
    icon: "design",
    sites: [
      {
        name: "Claude Design",
        desc: "Anthropic 推出的设计工作台，可生成设计稿、交互原型、演示文稿与单页内容",
        domain: "claude.ai",
        fallback: "🪄",
        url: "https://claude.ai/design",
      },
      {
        name: "Stitch",
        desc: "Google 出品的 AI UI 设计工具，适合快速生成界面草图与页面结构",
        domain: "stitch.withgoogle.com",
        fallback: "🪡",
        url: "https://stitch.withgoogle.com/",
      },
      {
        name: "awesome-design-md",
        desc: "DESIGN.md 设计系统仓库集合，适合让 AI Agent 对齐站点风格",
        domain: "github.com",
        fallback: "🧾",
        url: "https://github.com/VoltAgent/awesome-design-md",
      },
      {
        name: "Figma",
        desc: "主流协作式界面设计平台，支持设计、原型与开发交付",
        domain: "figma.com",
        fallback: "🎯",
        url: "https://www.figma.com/",
      },
      {
        name: "Color Hunt",
        desc: "高质量配色灵感站，适合快速挑选 UI 与品牌色板",
        domain: "www.colorhunt.co",
        fallback: "🌈",
        url: "https://www.colorhunt.co/",
      },
      {
        name: "ColorDrop",
        desc: "配色灵感与色板浏览工具，适合快速发现 UI 和品牌用色方案",
        domain: "colordrop.io",
        fallback: "🎨",
        url: "https://colordrop.io/",
      },
      {
        name: "Pencil",
        desc: "开源界面设计与原型工具，适合快速画线框和流程页面",
        domain: "pencil.evolus.vn",
        fallback: "✏️",
        url: "https://pencil.evolus.vn/",
      },
      {
        name: "Lovart",
        desc: "AI 驱动的设计 Agent 平台，支持从文字描述生成品牌、海报、UI 等设计稿",
        domain: "www.lovart.ai",
        fallback: "💜",
        url: "https://www.lovart.ai/",
      },
    ],
  },
  {
    title: "AI 音频与视频",
    icon: "audio",
    sites: [
      {
        name: "Seedance 2.0",
        desc: "字节 Seed 团队的多模态生成工具，支持音频输入并生成带原生音频的视频内容",
        domain: "seed.bytedance.com",
        fallback: "🌊",
        url: "https://seed.bytedance.com/en/blog/official-launch-of-seedance-2-0",
      },
      {
        name: "Suno",
        desc: "主流 AI 音乐生成平台，可通过提示词快速生成歌曲、配乐与音频素材",
        domain: "suno.com",
        fallback: "🎤",
        url: "https://suno.com/",
      },
      {
        name: "Udio",
        desc: "AI 音乐生成平台，擅长生成高完成度歌曲与旋律片段",
        domain: "udio.com",
        fallback: "🎶",
        url: "https://www.udio.com/home",
      },
      {
        name: "ElevenLabs",
        desc: "AI 语音与音频生成平台，适合配音、旁白、语音克隆与播客场景",
        domain: "elevenlabs.io",
        fallback: "🗣️",
        url: "https://elevenlabs.io/",
      },
    ],
  },
  {
    title: "出海与付费订阅",
    icon: "pay",
    sites: [
      {
        name: "土区 ChatGPT 订阅",
        desc: "注册土耳其区 Apple ID 订阅 ChatGPT Plus 详细教程",
        domain: "xiaojun.uk",
        fallback: "🍎",
        url: "https://xiaojun.uk/posts/turkey-apple-id-chatgpt-plus/",
      },
      {
        name: "App Store Price",
        desc: "查看 ChatGPT 全球各地区 App Store 的价格对比与低价渠道",
        domain: "appstoreprice.org",
        fallback: "🏷️",
        url: "https://appstoreprice.org/zh/apps/6448311069",
      },
    ],
  },
  {
    title: "开发者常用工具",
    icon: "tools",
    sites: [
      {
        name: "GitHub",
        desc: "代码托管与协作开发平台",
        domain: "github.com",
        fallback: "🐱",
        url: "https://github.com",
      },
      {
        name: "MDN Web Docs",
        desc: "Web 技术权威参考文档",
        domain: "developer.mozilla.org",
        fallback: "📚",
        url: "https://developer.mozilla.org",
      },
      {
        name: "Can I Use",
        desc: "浏览器特性兼容性查询",
        domain: "caniuse.com",
        fallback: "✅",
        url: "https://caniuse.com",
      },
      {
        name: "Regex101",
        desc: "正则表达式在线测试与调试",
        domain: "regex101.com",
        fallback: "🧪",
        url: "https://regex101.com",
      },
      {
        name: "DevDocs",
        desc: "多语言 / 框架 API 文档聚合",
        domain: "devdocs.io",
        fallback: "📖",
        url: "https://devdocs.io",
      },
      {
        name: "Recompressor",
        desc: "在线图片压缩与优化工具，支持 PNG、JPG、SVG，并可在浏览器内预览压缩效果",
        domain: "recompressor.com",
        fallback: "🗜️",
        url: "https://recompressor.com/",
      },
    ],
  },
  {
    title: "环境与版本管理",
    icon: "tools",
    sites: [
      {
        name: "nvm",
        desc: "Node.js 版本管理工具，适合安装、切换和管理多个 Node 版本",
        domain: "github.com",
        fallback: "⬢",
        url: "https://github.com/nvm-sh/nvm",
      },
      {
        name: "fnm",
        desc: "基于 Rust 的快速 Node.js 版本管理器，启动更快，适合替代 nvm 试用",
        domain: "github.com",
        fallback: "🚀",
        url: "https://github.com/Schniz/fnm",
      },
      {
        name: "g",
        desc: "Go 环境版本管理工具，支持安装、切换与维护多个 Go 版本",
        domain: "github.com",
        fallback: "🛠️",
        url: "https://github.com/voidint/g",
      },
      {
        name: "uv",
        desc: "高性能 Python 包与项目管理工具，可统一处理依赖、虚拟环境和 Python 版本",
        domain: "github.com",
        fallback: "⚡",
        url: "https://github.com/astral-sh/uv",
      },
    ],
  },
  {
    title: "系统与效率工具",
    icon: "tools",
    sites: [
      {
        name: "Mole",
        desc: "开源 Mac 清理与优化工具，支持缓存清理、卸载残留扫描和系统状态检查",
        domain: "github.com",
        fallback: "🐹",
        url: "https://github.com/tw93/mole",
      },
    ],
  },
  {
    title: "求职与系统设计",
    icon: "career",
    sites: [
      {
        name: "Awesome System Design Resources",
        desc: "系统设计学习与面试资源集合",
        domain: "github.com",
        fallback: "🏛️",
        url: "https://github.com/ashishps1/awesome-system-design-resources",
      },
      {
        name: "system-design-notes",
        desc: "《System Design Interview》读书笔记整理",
        domain: "github.com",
        fallback: "📝",
        url: "https://github.com/liquidslr/system-design-notes",
      },
      {
        name: "interview-company-wise-problems",
        desc: "按公司整理的 LeetCode 面试题单",
        domain: "github.com",
        fallback: "🏢",
        url: "https://github.com/liquidslr/interview-company-wise-problems",
      },
      {
        name: "leetcode-master",
        desc: "《代码随想录》LeetCode 刷题攻略",
        domain: "github.com",
        fallback: "📚",
        url: "https://github.com/youngyangyang04/leetcode-master",
      },
    ],
  },
  {
    title: "外语学习与提升",
    icon: "tools",
    sites: [
      {
        name: "新概念英语 NCE",
        desc: "新概念英语在线学习与听力练习工具",
        domain: "nce.ichochy.com",
        fallback: "🎧",
        url: "https://nce.ichochy.com/",
      },
    ],
  },
  {
    title: "趋势与排行榜单",
    icon: "ranking",
    sites: [
      {
        name: "OpenRouter Rankings",
        desc: "OpenRouter 模型排行榜，适合查看模型热度、调用趋势与综合表现",
        domain: "openrouter.ai",
        fallback: "🏅",
        url: "https://openrouter.ai/rankings",
      },
      {
        name: "GitHub Trending",
        desc: "GitHub 热门仓库趋势榜，适合发现近期活跃项目",
        domain: "github.com",
        fallback: "🔥",
        url: "https://github.com/trending",
      },
      {
        name: "Hacker News",
        desc: "Y Combinator 社区热门资讯与技术讨论榜单",
        domain: "news.ycombinator.com",
        fallback: "📰",
        url: "https://news.ycombinator.com/",
      },
      {
        name: "Best of JS",
        desc: "JavaScript 生态项目排行与趋势发现平台",
        domain: "bestofjs.org",
        fallback: "✨",
        url: "https://bestofjs.org/",
      },
    ],
  },
];

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories;
  const query = searchQuery.value.trim().toLowerCase();
  return categories
    .map((cat) => {
      const isTitleMatch = cat.title.toLowerCase().includes(query);
      const matchedSites = cat.sites.filter((site) => {
        return (
          site.name.toLowerCase().includes(query) ||
          site.desc.toLowerCase().includes(query) ||
          site.domain.toLowerCase().includes(query)
        );
      });
      return { ...cat, sites: isTitleMatch ? cat.sites : matchedSites };
    })
    .filter((cat) => cat.sites.length > 0);
});
</script>

<template>
  <div class="quick-nav-layout">
    <div class="quick-nav">
      <!-- Search Input Container -->
      <div class="search-wrapper">
        <div class="search-box">
          <span class="search-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索站点名称、描述或域名... (Esc 清空)"
            class="search-input"
            @keydown.esc="clearSearch"
          />
          <button
            v-if="searchQuery"
            class="search-clear-btn"
            title="清空搜索 (Esc)"
            @click="clearSearch"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Main Sites Loop -->
      <div v-if="filteredCategories.length > 0">
        <div
          v-for="cat in filteredCategories"
          :key="cat.title"
          :id="getCategoryId(cat.title)"
          class="nav-category"
        >
          <h2 class="cat-title">
            <span class="cat-icon" aria-hidden="true">
              <QuickNavCategoryIcon :name="cat.icon" />
            </span>
            <span class="cat-title-text">{{ cat.title }}</span>
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

      <!-- Empty State -->
      <div v-else class="search-empty">
        <div class="empty-icon">🔍</div>
        <p class="empty-title">未找到相关站点</p>
        <p class="empty-desc">尝试输入其他关键词，或按 <kbd>Esc</kbd> 清除过滤</p>
        <button class="empty-reset-btn" @click="clearSearch">重置搜索</button>
      </div>
    </div>

    <!-- Side Navigation -->
    <nav class="side-nav">
      <div class="side-nav-inner">
        <p class="side-nav-title">分类导航</p>
        <a
          v-for="cat in filteredCategories"
          :key="cat.title"
          class="side-nav-item"
          :class="{ active: activeCategory === getCategoryId(cat.title) }"
          href="javascript:void(0)"
          @click="scrollToCategory(cat.title)"
        >
          <span class="side-nav-icon" aria-hidden="true">
            <QuickNavCategoryIcon :name="cat.icon" />
          </span>
          <span class="side-nav-label">{{ cat.title }}</span>
        </a>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.quick-nav-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.quick-nav {
  flex: 1;
  min-width: 0;
  padding: 16px 0 48px;
}

.nav-category {
  margin-bottom: 40px;
  scroll-margin-top: 80px;
}

.cat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  border-top: none;
  letter-spacing: -0.01em;
}

.cat-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #c46849;
  border-radius: 12px;
  border: 1px solid rgba(196, 104, 73, 0.18);
  background:
    linear-gradient(145deg, rgba(196, 104, 73, 0.16), rgba(196, 104, 73, 0.05)),
    color-mix(in srgb, var(--vp-c-bg-elv) 92%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

.cat-icon :deep(svg) {
  width: 19px;
  height: 19px;
}

.dark .cat-icon {
  border-color: rgba(196, 104, 73, 0.24);
  background:
    linear-gradient(145deg, rgba(196, 104, 73, 0.18), rgba(196, 104, 73, 0.04)),
    rgba(255, 255, 255, 0.03);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.cat-title-text {
  line-height: 1.2;
}

.sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 16px;
}

/* Search Wrapper & Box */
.search-wrapper {
  margin-bottom: 32px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.search-box:hover {
  border-color: rgba(196, 104, 73, 0.4);
  box-shadow: 0 4px 12px rgba(196, 104, 73, 0.06);
}

.search-box:focus-within {
  border-color: #c46849;
  box-shadow: 
    0 0 0 3px rgba(196, 104, 73, 0.15),
    0 4px 16px rgba(196, 104, 73, 0.08);
  transform: translateY(-1px);
}

.search-icon {
  display: inline-flex;
  align-items: center;
  color: var(--vp-c-text-3);
  margin-right: 12px;
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-box:focus-within .search-icon {
  color: #c46849;
}

.search-input {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: 15px;
  outline: none;
  padding: 0;
}

.search-input::placeholder {
  color: var(--vp-c-text-3);
}

.search-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: var(--vp-c-text-3);
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s ease;
}

.dark .search-clear-btn {
  background: rgba(255, 255, 255, 0.08);
}

.search-clear-btn:hover {
  background: rgba(196, 104, 73, 0.15);
  color: #c46849;
  transform: scale(1.05);
}

/* Empty State */
.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  text-align: center;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 16px;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 60%, transparent);
  margin: 32px 0 64px;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 16px;
  filter: drop-shadow(0 4px 8px rgba(196, 104, 73, 0.15));
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--vp-c-text-3);
  margin: 0 0 20px;
}

.empty-desc kbd {
  font-family: inherit;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);
}

.empty-reset-btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: #c46849;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(196, 104, 73, 0.2);
}

.empty-reset-btn:hover {
  background: #b3593a;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(196, 104, 73, 0.3);
}

.empty-reset-btn:active {
  transform: translateY(0);
}

/* Site Card Enhancements */
.site-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 160px;
  padding: 16px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.site-card:hover {
  transform: translateY(-4px);
  border-color: #c46849;
  box-shadow: 
    0 12px 28px -8px rgba(196, 104, 73, 0.16),
    0 4px 12px -4px rgba(196, 104, 73, 0.08),
    inset 0 0 12px rgba(196, 104, 73, 0.02);
}

.site-card:hover .site-name {
  color: #c46849;
}

.site-card:focus-visible,
.side-nav-item:focus-visible {
  outline: 2px solid rgba(196, 104, 73, 0.45);
  outline-offset: 3px;
}

.dark .site-card {
  background: #121212;
  border-color: #262626;
}

.dark .site-card:hover {
  border-color: #e08c6f;
  box-shadow: 
    0 16px 36px -12px rgba(196, 104, 73, 0.28),
    0 4px 12px -4px rgba(196, 104, 73, 0.16),
    inset 0 0 16px rgba(196, 104, 73, 0.04);
}

.dark .site-card:hover .site-name {
  color: #e08c6f;
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
  transition: color 0.2s ease;
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
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.site-card:hover .site-link-icon {
  color: #c46849;
  transform: translate(2px, -2px) scale(1.1);
}

.dark .site-card:hover .site-link-icon {
  color: #e08c6f;
}

/* Side Navigation */
.side-nav {
  position: sticky;
  top: 80px;
  width: 176px;
  flex-shrink: 0;
  padding-top: 16px;
}

.side-nav-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 12px;
}

.side-nav-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px;
  padding: 0;
}

.side-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.side-nav-item:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-elv);
}

.side-nav-item.active {
  color: #c46849;
  font-weight: 500;
  background: rgba(196, 104, 73, 0.08);
}

.side-nav-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: color-mix(in srgb, var(--vp-c-text-2) 72%, #c46849);
  border: 1px solid color-mix(in srgb, var(--vp-c-divider) 72%, rgba(196, 104, 73, 0.12));
  background: color-mix(in srgb, var(--vp-c-bg-elv) 86%, transparent);
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.side-nav-icon :deep(svg) {
  width: 14px;
  height: 14px;
}

.side-nav-item:hover .side-nav-icon {
  color: #c46849;
  border-color: rgba(196, 104, 73, 0.2);
  background:
    linear-gradient(145deg, rgba(196, 104, 73, 0.14), rgba(196, 104, 73, 0.04)),
    color-mix(in srgb, var(--vp-c-bg-elv) 90%, transparent);
  transform: translateY(-1px);
}

.side-nav-item.active .side-nav-icon {
  color: #c46849;
  border-color: rgba(196, 104, 73, 0.24);
  background:
    linear-gradient(145deg, rgba(196, 104, 73, 0.16), rgba(196, 104, 73, 0.05)),
    color-mix(in srgb, var(--vp-c-bg-elv) 92%, transparent);
}

.dark .side-nav-icon {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.side-nav-label {
  line-height: 1.3;
}

@media (max-width: 960px) {
  .quick-nav-layout {
    display: block;
  }

  .quick-nav {
    padding-top: 8px;
  }

  .side-nav {
    display: none;
  }
}

@media (max-width: 640px) {
  .sites-grid {
    grid-template-columns: 1fr;
  }

  .site-card {
    min-height: 0;
  }

  .site-name {
    font-size: 16px;
  }

  .site-desc {
    font-size: 14px;
  }

  .cat-title {
    font-size: 17px;
  }
}

@media (max-width: 380px) {
  .sites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
