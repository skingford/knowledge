import type { SectionConfig } from './types'

export const algorithmSection: SectionConfig = {
  key: 'algorithm',
  base: '/algorithm/',
  navText: '算法',
  overviewDescription:
    '系统整理分布式共识、分布式锁、限流算法与 LeetCode 高频题型，先从 Raft、Redlock 等工程高频算法切入，再延伸到回溯、双指针、矩阵模拟、树与动态规划。',
  landing: {
    eyebrow: 'Algorithm',
    title: '算法专题',
    intro:
      '不追求刷题数量，而是把工程中真正会用到的算法和高频题型讲透，先从分布式共识（Raft / Paxos）、分布式锁（Redlock）等系统设计高频算法开始，再补 LeetCode 常见题型（回溯 / 双指针 / 矩阵模拟 / 树 / 动态规划），建立"能讲清原理、能写出代码、能判断选型"的能力。',
    primary: { title: 'Raft 共识算法详解', href: '/algorithm/raft', description: '从选举、日志复制到安全性，把 Raft 讲成一条完整链路。' },
    secondary: { title: 'LeetCode 高频题专题', href: '/algorithm/leetcode/', description: '按题型收纳高频题，先从回溯入门题开始。' },
    scope: [
      '分布式共识（Raft / Paxos / ZAB）',
      '分布式锁（Redis Lock / Redlock / Fencing Token）',
      '一致性哈希与虚拟节点',
      '分布式 ID 生成（Snowflake 等）',
      '限流算法（令牌桶 / 滑动窗口）',
      'LeetCode 高频题型（回溯 / 双指针 / 矩阵模拟 / 二叉树 / 动态规划）',
      '布隆过滤器与 HyperLogLog',
      '排序与搜索经典算法',
      '树、图与动态规划',
      '工程算法选型与复杂度分析',
    ],
    docs: [
      { title: 'Raft 共识算法详解', href: '/algorithm/raft', description: '从 Leader Election、Log Replication 到 Safety，完整拆解 Raft 协议。' },
      { title: 'Redlock 分布式锁算法详解', href: '/algorithm/redlock', description: '从多数派租约、有效期计算到争议点，讲清 Redlock 的原理与边界。' },
      { title: '限流算法详解', href: '/algorithm/rate-limiting', description: '从固定窗口、滑动窗口到漏桶和令牌桶，拆解四种限流算法的原理与选型。' },
      { title: 'LeetCode 高频题专题', href: '/algorithm/leetcode/', description: '按题型沉淀高频题，优先整理可复用模板和思路。' },
      { title: 'LeetCode 17. 电话号码的字母组合', href: '/algorithm/leetcode/letter-combinations-of-a-phone-number', description: '用回溯和 DFS 讲清多叉搜索树展开、path 回退与复杂度分析。' },
      { title: 'LeetCode 11. 盛最多水的容器', href: '/algorithm/leetcode/container-with-most-water', description: '用双指针和反证思路讲清为什么每次只移动短板。' },
      { title: 'LeetCode 289. 生命游戏', href: '/algorithm/leetcode/game-of-life', description: '用原地状态编码讲清矩阵模拟、两轮遍历与邻居统计。' },
    ],
    order: [
      'Raft 共识算法详解',
      'Redlock 分布式锁算法详解',
      '限流算法详解',
      'LeetCode 高频题专题',
      'LeetCode 17. 电话号码的字母组合',
      'LeetCode 11. 盛最多水的容器',
      'LeetCode 289. 生命游戏',
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
    {
      text: '分布式锁',
      items: [
        { text: 'Redlock 详解', link: '/algorithm/redlock' },
      ],
    },
    {
      text: '限流算法',
      items: [
        { text: '限流算法详解', link: '/algorithm/rate-limiting' },
      ],
    },
    {
      text: 'LeetCode',
      items: [
        { text: '专题总览', link: '/algorithm/leetcode/' },
        { text: '17. 电话号码的字母组合', link: '/algorithm/leetcode/letter-combinations-of-a-phone-number' },
        { text: '11. 盛最多水的容器', link: '/algorithm/leetcode/container-with-most-water' },
        { text: '289. 生命游戏', link: '/algorithm/leetcode/game-of-life' },
      ],
    },
  ],
}
