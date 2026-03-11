export interface LandingLink {
  title: string
  href: string
  description: string
}

export interface SectionLandingContent {
  eyebrow: string
  title: string
  intro: string
  primary: LandingLink
  secondary?: LandingLink
  scope: string[]
  docs: LandingLink[]
  order: string[]
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items: Array<{ text: string; link: string }>
}

export interface SectionConfig {
  key: string
  base: string
  navText: string
  overviewDescription: string
  landing: SectionLandingContent
  sidebar: SidebarGroup[]
}

export const quickNavLink = { text: '快速导航', link: '/nav' }

export const sections: SectionConfig[] = [
  {
    key: 'ai',
    base: '/ai/',
    navText: 'AI / Agent',
    overviewDescription:
      '适合希望系统入门 Agent 和 LLM 应用开发的工程师，重点是 Agent、Tool Calling、RAG 与 workflow。',
    landing: {
      eyebrow: 'AI / Agent',
      title: 'AI / Agent 方向',
      intro:
        '从 Agent 模式、Tool Calling、RAG 到 workflow 设计，把零散资料收敛成一条更适合工程师持续推进的学习路径。',
      primary: { title: '知识地图', href: '/ai/knowledge-map', description: '先建立全局地图。' },
      secondary: { title: '综合指南', href: '/ai/agent-learning-guide', description: '再进入系统学习。' },
      scope: [
        'Agent 开发',
        'Tool Calling',
        'Workflow 与状态机',
        'RAG 与知识库',
        'Eval、安全、观测',
        'LLM 基础与学习路径',
      ],
      docs: [
        { title: 'LLM Agent 必学知识地图', href: '/ai/knowledge-map', description: '先搭整体认知框架，明确主题之间的关系。' },
        { title: 'Agent 学习综合指南', href: '/ai/agent-learning-guide', description: '用一篇长文把核心概念、资料和实践建议串起来。' },
        { title: '7 天 Agent 学习路线', href: '/ai/agent-learning-roadmap', description: '适合短周期起步，先把路径跑通。' },
        { title: 'Tool Calling 设计清单', href: '/ai/tool-calling-design-checklist', description: '关注接口设计、容错和运行边界。' },
        { title: 'RAG 基础与工作流', href: '/ai/rag-basics-and-workflow', description: '把检索、切分、召回和生成串成一个可理解的流程。' },
        { title: '待补主题清单', href: '/ai/todo-topics', description: '查看还未展开的补充主题。' },
      ],
      order: [
        'LLM Agent 必学知识地图',
        'Agent 学习综合指南',
        '7 天 Agent 学习路线',
        'Tool Calling 设计清单',
        'RAG 基础与工作流',
      ],
    },
    sidebar: [
      {
        text: 'AI / Agent',
        items: [
          { text: '方向概览', link: '/ai/' },
          { text: 'Agent 学习综合指南', link: '/ai/agent-learning-guide' },
          { text: '7 天 Agent 学习路线', link: '/ai/agent-learning-roadmap' },
          { text: 'Tool Calling 设计清单', link: '/ai/tool-calling-design-checklist' },
          { text: 'RAG 基础与工作流', link: '/ai/rag-basics-and-workflow' },
          { text: '待补主题清单', link: '/ai/todo-topics' },
        ],
      },
      {
        text: '7 天学习路线详解',
        collapsed: true,
        items: [
          { text: 'Day 1: 理解 Agent 是什么', link: '/ai/roadmap/day1-what-is-agent' },
          { text: 'Day 2: 学会调用 LLM API', link: '/ai/roadmap/day2-llm-api' },
          { text: 'Day 3: 学会 Tool Calling', link: '/ai/roadmap/day3-tool-calling' },
          { text: 'Day 4: 学习 Workflow', link: '/ai/roadmap/day4-workflow' },
          { text: 'Day 5: RAG 和 Memory', link: '/ai/roadmap/day5-rag-memory' },
          { text: 'Day 6: 评测与安全', link: '/ai/roadmap/day6-eval-safety' },
          { text: 'Day 7: 完整项目', link: '/ai/roadmap/day7-full-project' },
        ],
      },
    ],
  },
  {
    key: 'architecture',
    base: '/architecture/',
    navText: '架构',
    overviewDescription:
      '适合后端开发、技术负责人候选人和架构岗准备，主线是系统设计、治理和分布式能力。',
    landing: {
      eyebrow: 'Architecture',
      title: '架构方向',
      intro:
        '围绕系统设计、高并发、分布式事务与治理方法，把架构学习整理成适合长期复用的框架、清单和路线。',
      primary: { title: '学习路线', href: '/architecture/architect-learning-roadmap', description: '先搭主线。' },
      secondary: { title: '能力自检', href: '/architecture/architect-interview-prep-checklist', description: '再用清单校验。' },
      scope: [
        '系统设计',
        '核心基础',
        '分布式系统',
        '微服务与中间件',
        '数据架构',
        '云原生与 DevOps',
        '高可用与稳定性治理',
        '架构方法论与技术规划',
      ],
      docs: [
        { title: '架构师学习路线', href: '/architecture/architect-learning-roadmap', description: '适合作为主入口，先看清楚各阶段该补什么。' },
        { title: '架构师分阶段书单', href: '/architecture/architect-booklist-by-level', description: '按成长阶段筛选更合适的资料。' },
        { title: '架构能力自检准备清单', href: '/architecture/architect-interview-prep-checklist', description: '用判断项梳理系统设计和架构治理能力。' },
        { title: '高并发系统设计清单', href: '/architecture/high-concurrency-system-checklist', description: '把常见高并发设计问题拆成一组可检查项。' },
        { title: '分布式事务方案对比', href: '/architecture/distributed-transaction-comparison', description: '快速对比常见事务方案的边界与取舍。' },
        { title: '组织架构与业务系统设计方案', href: '/architecture/organization-structure-and-business-system-design', description: '闭包表原理、PG ltree、CTE 递归等替代方案对比，覆盖权限过滤、聚合查询与工程化落地。' },
        { title: '运动 APP 出海架构与管理完全指南', href: '/architecture/global-fitness-app-architecture-and-management-guide', description: '覆盖全球化运动 App 的架构、合规、支付、运维与面试准备。' },
        { title: '待补主题清单', href: '/architecture/todo-topics', description: '查看后续计划补充的专题。' },
      ],
      order: [
        '架构师学习路线',
        '架构师分阶段书单',
        '组织架构与业务系统设计方案',
        '高并发系统设计清单',
        '分布式事务方案对比',
        '运动 APP 出海架构与管理完全指南',
        '架构能力自检准备清单',
      ],
    },
    sidebar: [
      {
        text: '架构',
        items: [
          { text: '方向概览', link: '/architecture/' },
          { text: '架构师学习路线', link: '/architecture/architect-learning-roadmap' },
          { text: '架构师分阶段书单', link: '/architecture/architect-booklist-by-level' },
          { text: '架构能力自检准备清单', link: '/architecture/architect-interview-prep-checklist' },
          { text: '组织架构与业务系统设计方案', link: '/architecture/organization-structure-and-business-system-design' },
          { text: '高并发系统设计清单', link: '/architecture/high-concurrency-system-checklist' },
          { text: '分布式事务方案对比', link: '/architecture/distributed-transaction-comparison' },
          { text: '运动 APP 出海架构与管理完全指南', link: '/architecture/global-fitness-app-architecture-and-management-guide' },
          { text: '待补主题清单', link: '/architecture/todo-topics' },
        ],
      },
    ],
  },
  {
    key: 'golang',
    base: '/golang/',
    navText: 'Golang',
    overviewDescription:
      '适合 Go 后端和高级开发，重点覆盖语言机制、并发、性能和工程实践。',
    landing: {
      eyebrow: 'Golang',
      title: 'Golang 方向',
      intro:
        '从语言机制、并发与性能，到服务端工程实践和能力自检，把 Go 进阶学习从零散资料整理成一条连续路径。',
      primary: { title: '高级资料', href: '/golang/golang-advanced-learning-guide', description: '先走主线。' },
      secondary: { title: '高频题', href: '/golang/go-top-30-interview-questions', description: '再做自检。' },
      scope: ['Go 语言底层', '并发模型', '性能优化与排障', '服务端工程实践', '源码阅读与能力自检准备', '设计模式与安全', '容器化与云原生', '代码生成与元编程'],
      docs: [
        { title: '高级 Golang 学习资料', href: '/golang/golang-advanced-learning-guide', description: '主入口文档，覆盖语言、并发、性能和工程实践。' },
        { title: '30+ 高频 Golang 能力自检题', href: '/golang/go-top-30-interview-questions', description: '用问题驱动回顾知识盲区和底层理解。' },
        { title: 'Golang 高频题代码片段', href: '/golang/go-interview-code-snippets', description: '配套示例代码，方便把抽象概念落到实现。' },
        { title: 'Go 推荐书单与资料', href: '/golang/golang-recommended-resources', description: '补充阅读清单，便于继续深挖。' },
        { title: 'Pprof 排障指南', href: '/golang/pprof-troubleshooting-guide', description: '针对性能定位和排障建立实操路径。' },
        { title: 'Context 使用边界', href: '/golang/context-usage-boundaries', description: '厘清在 Go 服务里使用 Context 的边界和误区。' },
      ],
      order: [
        '高级 Golang 学习资料',
        'Go 推荐书单、博客与视频资料',
        '30+ 高频 Golang 能力自检题',
        'Golang 高频题代码片段',
        'Pprof 排障指南',
        'Context 使用边界',
      ],
    },
    sidebar: [
      {
        text: 'Golang',
        items: [
          { text: '方向概览', link: '/golang/' },
          { text: '高级 Golang 学习资料', link: '/golang/golang-advanced-learning-guide' },
          { text: '30+ 高频能力自检题', link: '/golang/go-top-30-interview-questions' },
          { text: '能力自检高频题代码片段', link: '/golang/go-interview-code-snippets' },
          { text: '推荐书单与资源', link: '/golang/golang-recommended-resources' },
          { text: 'Pprof 排障指南', link: '/golang/pprof-troubleshooting-guide' },
          { text: 'Context 使用边界', link: '/golang/context-usage-boundaries' },
          { text: 'Go 版本特性总结', link: '/golang/go-version-features' },
        ],
      },
      {
        text: '学习大纲详解',
        collapsed: true,
        items: [
          { text: '一、语言基础深化', link: '/golang/guide/01-language-fundamentals' },
          { text: '二、底层原理', link: '/golang/guide/02-underlying-principles' },
          { text: '三、并发编程', link: '/golang/guide/03-concurrency' },
          { text: '四、网络编程与标准库', link: '/golang/guide/04-network-stdlib' },
          { text: '五、工程实践', link: '/golang/guide/05-engineering-practices' },
          { text: '六、数据库与缓存', link: '/golang/guide/06-database-cache' },
          { text: '七、性能优化与排障', link: '/golang/guide/07-performance-troubleshooting' },
          { text: '八、微服务与分布式', link: '/golang/guide/08-microservices-distributed' },
          { text: '九、源码与 Runtime', link: '/golang/guide/09-runtime-source' },
        ],
      },
      {
        text: '并发编程拆分专题',
        collapsed: true,
        items: [
          { text: '高级并发模式', link: '/golang/guide/03-advanced-concurrency-patterns' },
        ],
      },
      {
        text: '语言基础拆分专题',
        collapsed: true,
        items: [
          { text: 'Slice 的坑与三指切片', link: '/golang/guide/01-slice-append-pitfalls' },
          { text: 'String 与 []byte 最佳实践', link: '/golang/guide/01-string-byte-best-practices' },
        ],
      },
      {
        text: '底层原理拆分专题',
        collapsed: true,
        items: [
          { text: '逃逸分析、栈与堆', link: '/golang/guide/02-escape-analysis' },
          { text: '切片并发陷阱与工程化取舍', link: '/golang/guide/02-concurrent-slice-patterns' },
        ],
      },
      {
        text: '网络编程与标准库拆分专题',
        collapsed: true,
        items: [
          { text: 'HTTP 服务端、客户端与 TCP/UDP', link: '/golang/guide/04-http-server-client-tcp-udp' },
          { text: '连接池、超时、重试与限流', link: '/golang/guide/04-connection-timeout-retry-rate-limit' },
          { text: '中间件、JSON 编解码与文件 IO', link: '/golang/guide/04-middleware-json-io' },
        ],
      },
      {
        text: '工程实践拆分专题',
        collapsed: true,
        items: [
          { text: '项目结构、依赖管理、日志与配置', link: '/golang/guide/05-project-layout-deps-logging-config' },
          { text: '错误码、中间件与代码规范', link: '/golang/guide/05-error-middleware-code-style' },
          { text: '测试、Benchmark 与 CI/CD', link: '/golang/guide/05-testing-benchmark-cicd' },
        ],
      },
      {
        text: '进阶专题',
        collapsed: true,
        items: [
          { text: '设计模式与惯用法', link: '/golang/guide/10-design-patterns-idioms' },
          { text: '安全编程实践', link: '/golang/guide/10-security-practices' },
          { text: '容器化与云原生', link: '/golang/guide/10-containerization-cloud-native' },
          { text: '代码生成与元编程', link: '/golang/guide/10-codegen-metaprogramming' },
        ],
      },
      {
        text: '微服务与分布式拆分专题',
        collapsed: true,
        items: [
          { text: 'RPC、注册发现与配置', link: '/golang/guide/08-rpc-discovery-config' },
          { text: '追踪、容错与重试', link: '/golang/guide/08-observability-resilience' },
          { text: 'MQ、事务、治理与高可用', link: '/golang/guide/08-mq-transaction-governance-ha' },
        ],
      },
    ],
  },
  {
    key: 'ops',
    base: '/ops/',
    navText: '运维',
    overviewDescription:
      '适合需要日常运维能力的开发和运维工程师，重点覆盖磁盘排查、日志管理、进程管理等实操技能。',
    landing: {
      eyebrow: 'Ops',
      title: '运维方向',
      intro:
        '将日常运维中反复用到的排障命令、清理流程和管理技巧，从零散笔记整理成可复用的操作指南。',
      primary: {
        title: 'Linux 磁盘清理与进程管理',
        href: '/ops/linux-disk-cleanup',
        description: '从磁盘排查到进程管理的实战指南。',
      },
      scope: [
        '磁盘空间排查与清理',
        '日志管理与轮转',
        '缓存清理（Go / Node / Docker）',
        'PM2 进程管理',
        '用户管理与权限（chmod / chown / umask）',
        '常用运维工具',
      ],
      docs: [
        { title: 'Linux 磁盘清理与进程管理', href: '/ops/linux-disk-cleanup', description: '磁盘排查、日志清理、缓存管理、PM2 进程管理的实战操作指南。' },
        { title: 'Linux 用户管理与权限', href: '/ops/linux-user-permissions', description: '用户切换、chmod、chown、umask、用户目录管理的实战指南。' },
        { title: '待补主题清单', href: '/ops/todo-topics', description: '查看运维方向后续计划补充的主题。' },
      ],
      order: ['Linux 磁盘清理与进程管理', 'Linux 用户管理与权限'],
    },
    sidebar: [
      {
        text: '运维',
        items: [
          { text: '方向概览', link: '/ops/' },
          { text: 'Linux 磁盘清理与进程管理', link: '/ops/linux-disk-cleanup' },
          { text: 'Linux 用户管理与权限', link: '/ops/linux-user-permissions' },
          { text: '待补主题清单', link: '/ops/todo-topics' },
        ],
      },
    ],
  },
  {
    key: 'tools',
    base: '/tools/',
    navText: '工具',
    overviewDescription:
      '收录 Vim、iTerm2、Git、Mac 等日常开发工具的实用配置和技巧。',
    landing: {
      eyebrow: 'Tools',
      title: '工具方向',
      intro: '收录 Vim、iTerm2、Git、Mac 等日常开发工具的实用配置和技巧，提升开发效率。',
      primary: { title: 'Vim 实用方案', href: '/tools/vim', description: '从基础操作到进阶配置的 Vim 实用指南。' },
      scope: [
        'Vim 编辑器配置与技巧',
        'iTerm2 终端美化与效率',
        'Git 工作流与常用命令',
        'Mac 开发环境与效率工具',
      ],
      docs: [
        { title: 'Vim 实用方案', href: '/tools/vim', description: 'Vim 编辑器的实用配置、快捷键和插件推荐。' },
        { title: 'iTerm2 配置指南', href: '/tools/iterm2', description: 'iTerm2 终端的美化配置、快捷操作和效率提升。' },
        { title: 'Git 常用技巧', href: '/tools/git', description: 'Git 日常工作流、分支管理和常用命令速查。' },
        { title: 'Mac 效率工具', href: '/tools/mac', description: 'Mac 开发环境搭建和效率工具推荐。' },
      ],
      order: ['Vim 实用方案', 'iTerm2 配置指南', 'Git 常用技巧', 'Mac 效率工具'],
    },
    sidebar: [
      {
        text: '工具',
        items: [
          { text: '方向概览', link: '/tools/' },
          { text: 'Vim 实用方案', link: '/tools/vim' },
          { text: 'iTerm2 配置指南', link: '/tools/iterm2' },
          { text: 'Git 常用技巧', link: '/tools/git' },
          { text: 'Mac 效率工具', link: '/tools/mac' },
        ],
      },
    ],
  },
]

export const learningOverviewTracks = sections.map((section) => ({
  title: `${section.navText}方向`.replace('AI / Agent方向', 'AI / Agent 方向'),
  href: section.base,
  description: section.overviewDescription,
}))

export const learningOverviewGoals = [
  { title: '想先看路线图', href: '/architecture/architect-learning-roadmap', description: '先从架构路线开始，再延伸到 AI 或 Go 的专题。' },
  { title: '想快速入门 Agent 开发', href: '/ai/agent-learning-guide', description: '先建立 Agent 全局认知，再展开 Tool Calling 和 RAG。' },
  { title: '想强化 Go 高级能力', href: '/golang/golang-advanced-learning-guide', description: '从主线资料切入，再补性能、排障和高频题。' },
  { title: '想做能力自检准备', href: '/architecture/architect-interview-prep-checklist', description: '架构和 Go 都提供适合阶段复盘或面试准备的清单和题目。' },
]

export const homeTracks = sections
  .filter((section) => section.key !== 'tools')
  .map((section) => ({
    title: section.navText,
    description:
      section.key === 'ai'
        ? '从 Agent 模式、Tool Calling 到 RAG 与 workflow，把概念、设计和可落地实现串成完整路径。'
        : section.key === 'architecture'
          ? '围绕系统设计、高并发与分布式治理，构建能复用到真实业务的判断框架与清单。'
          : section.key === 'golang'
            ? '覆盖语言机制、并发、性能与工程实践，把 Go 进阶学习从点状资料整理成面。'
            : '将日常运维中反复用到的排障命令、清理流程和管理技巧，整理成可复用的操作指南。',
    href: section.base,
  }))

export const homeHighlights = [
  {
    eyebrow: 'Start here',
    title: '学习导航总览',
    description: '先看总览，再决定从路线、专题还是自检开始，避免在目录里来回跳转。',
    href: '/learning-overview',
  },
  {
    eyebrow: 'AI focus',
    title: 'Agent 学习综合指南',
    description: '适合先搭整体地图，再逐步展开 Tool Calling、RAG 和 workflow 细节。',
    href: '/ai/agent-learning-guide',
  },
  {
    eyebrow: 'System thinking',
    title: '架构能力自检准备清单',
    description: '把架构问题拆到能力项和判断项，适合准备面试或做阶段性复盘。',
    href: '/architecture/architect-interview-prep-checklist',
  },
  {
    eyebrow: 'Go depth',
    title: '30+ 高频能力自检题',
    description: '用题目拉通语言细节、并发模型和工程经验，快速发现知识盲区。',
    href: '/golang/go-top-30-interview-questions',
  },
]

export const homePrinciples = [
  '按主题组织，不把知识堆成时间线式日志。',
  '优先给出路线和框架，再补专题和资料。',
  '兼顾系统学习、实践落地与能力自检。',
]
