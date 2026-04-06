import type { SectionConfig } from './types'

export const algorithmSection: SectionConfig = {
  key: 'algorithm',
  base: '/algorithm/',
  navText: '算法',
  overviewDescription:
    '系统整理分布式共识、经典算法与数据结构核心知识，先从 Raft 等工程高频算法切入，再延伸到排序、图论与动态规划。',
  landing: {
    eyebrow: 'Algorithm',
    title: '算法专题',
    intro:
      '不追求刷题数量，而是把工程中真正会用到的算法讲透——先从分布式共识（Raft / Paxos）和一致性哈希等系统设计高频算法开始，再补经典数据结构与算法基础，建立"能讲清原理、能判断选型"的能力。',
    primary: { title: 'Raft 共识算法详解', href: '/algorithm/raft', description: '从选举、日志复制到安全性，把 Raft 讲成一条完整链路。' },
    scope: [
      '分布式共识（Raft / Paxos / ZAB）',
      '一致性哈希与虚拟节点',
      '分布式 ID 生成（Snowflake 等）',
      '限流算法（令牌桶 / 滑动窗口）',
      '布隆过滤器与 HyperLogLog',
      '排序与搜索经典算法',
      '树、图与动态规划',
      '工程算法选型与复杂度分析',
    ],
    docs: [
      { title: 'Raft 共识算法详解', href: '/algorithm/raft', description: '从 Leader Election、Log Replication 到 Safety，完整拆解 Raft 协议。' },
    ],
    order: [
      'Raft 共识算法详解',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/algorithm/' },
      ],
    },
    {
      text: '分布式共识',
      items: [
        { text: 'Raft 详解', link: '/algorithm/raft' },
      ],
    },
  ],
}
