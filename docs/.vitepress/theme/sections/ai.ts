import type { SectionConfig } from './types'

export const aiSection: SectionConfig = {
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
}
