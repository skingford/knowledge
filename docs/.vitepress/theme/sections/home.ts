import type { SectionConfig } from './types'

import { aiSection } from './ai'
import { architectureSection } from './architecture'
import { networkSection } from './network'
import { algorithmSection } from './algorithm'
import { golangSection } from './golang'
import { pythonSection } from './python'
import { reactSection } from './react'
import { vueSection } from './vue'
import { svelteSection } from './svelte'
import { nodejsSection } from './nodejs'
import { rustSection } from './rust'
import { mysqlSection } from './mysql'
import { redisSection } from './redis'
import { kafkaSection } from './kafka'
import { etcdSection } from './etcd'
import { dockerSection } from './docker'
import { nginxSection } from './nginx'
import { k8sSection } from './k8s'
import { postgresqlSection } from './postgresql'
import { opsSection } from './ops'
import { gitSection } from './git'
import { toolsSection } from './tools'
import { frontendEcosystemSection } from './frontend-ecosystem'

const sections: SectionConfig[] = [
  aiSection,
  architectureSection,
  opsSection,
  networkSection,
  algorithmSection,
  golangSection,
  rustSection,
  pythonSection,
  nodejsSection,
  reactSection,
  vueSection,
  svelteSection,
  frontendEcosystemSection,
  mysqlSection,
  redisSection,
  kafkaSection,
  etcdSection,
  dockerSection,
  nginxSection,
  k8sSection,
  postgresqlSection,
  gitSection,
  toolsSection,
]

export const learningOverviewTracks = sections.map((section) => ({
  title: `${section.navText}方向`.replace('AI / Agent方向', 'AI / Agent 方向'),
  href: section.base,
  description: section.overviewDescription,
}))

export const learningOverviewGoals = [
  { title: '想先看路线图', href: '/architecture/architect-learning-roadmap', description: '先从架构路线开始，再延伸到 AI 或 Go 的专题。' },
  { title: '想补网络基础', href: '/network/essential-knowledge', description: '从分层模型、TCP/IP、HTTP/HTTPS 到 DNS 和负载均衡，先把网络主线补完整。' },
  { title: '想快速入门 Agent 开发', href: '/ai/agent-learning-guide', description: '先建立 Agent 全局认知，再展开 Tool Calling 和 RAG。' },
  { title: '想强化 Go 高级能力', href: '/golang/guide/source-reading/learning-path', description: '从源码阅读主线切入，再补性能、排障和高频题。' },
  { title: '想系统补 Python 基础', href: '/python/essential-knowledge', description: '从语法、函数、对象模型到工程化和并发，把 Python 基本盘补扎实。' },
  { title: '想系统补 React', href: '/react/react-technical-guide', description: '从组件、状态、Effect 到渲染性能，把 React 主线补完整。' },
  { title: '想系统补 Vue', href: '/vue/technical-guide', description: '从组合式 API、响应式系统到组件边界，把 Vue 3 主线补完整。' },
  { title: '想系统补 Svelte', href: '/svelte/technical-guide', description: '从 runes、组件通信到更新模型，把 Svelte 5 主线补完整。' },
  { title: '想补 Node.js / NestJS 后端实践', href: '/nodejs/nestjs-practice-guide', description: '从运行时、模块分层到校验、鉴权、事务和部署，把 Node.js 服务端主线串起来。' },
  { title: '想补 Rust 学习主线', href: '/rust/learning-path', description: '按阶段补所有权、类型系统、工程化与 async，不必在专题之间来回跳。' },
  { title: '想专项读 Go 源码', href: '/golang/guide/source-reading/', description: '直接进入独立源码阅读模块，按 runtime、网络、编码等主题深挖。' },
  { title: '想做能力自检准备', href: '/architecture/architect-interview-prep-checklist', description: '架构和 Go 都提供适合阶段复盘或面试准备的清单和题目。' },
]

const homeTrackDescriptions: Record<string, string> = {
  ai: '从 Agent 模式、Tool Calling 到 RAG 与 workflow，把概念、设计和可落地实现串成完整路径。',
  architecture: '围绕系统设计、高并发与分布式治理，构建能复用到真实业务的判断框架与清单。',
  network: '从分层模型、传输层到 HTTP、DNS、CDN 和负载均衡，把网络知识整理成适合工程实践的主线。',
  algorithm: '从分布式共识（Raft / Paxos）到一致性哈希、限流与经典数据结构，把工程高频算法讲透原理和选型。',
  golang: '覆盖语言机制、并发、性能与工程实践，把 Go 进阶学习从点状资料整理成面。',
  python: '从语法、函数、对象模型到 typing、asyncio 与工程化，把 Python 学习主线整理成一套清晰入口。',
  react: '以 React 为主线，围绕组件拆分、状态建模、Effect 边界、高频问题和性能优化建立工程判断。',
  vue: '围绕 Vue 3 的组合式 API、响应式系统、组件通信和性能优化，建立稳定的组件与响应式心智模型。',
  svelte: '围绕 Svelte 5 的 runes、组件通信、snippet 和细粒度更新模型，建立稳定的前端工程判断。',
  nodejs: '围绕 Node.js 运行时、工程化与 NestJS 实战，串起异步模型、模块边界和后端交付主线。',
  rust: '聚焦所有权、类型系统、错误处理、Cargo 工程化与并发 async，建立 Rust 的核心能力主线。',
  mysql: '围绕 MySQL 的事务、索引、锁与查询优化，串起高并发场景下的设计与治理实践。',
  redis: '系统整理 Redis 核心知识，涵盖缓存治理、分布式锁、高并发集群与支付场景实战。',
  kafka: '系统整理 Kafka 核心知识，涵盖消息可靠性、顺序性、积压治理与支付场景实战。',
  etcd: '围绕 Etcd 的 Raft、多数派、MVCC、Lease/Watch 与运维边界，串起一致性存储主线。',
  docker: '围绕 Docker 的镜像构建、仓库治理、容器运行、Compose 与排障，串起交付主线。',
  nginx: '围绕 Nginx 的请求匹配、反向代理、HTTPS、性能与排障，串起入口治理主线。',
  k8s: '系统整理 Kubernetes 必备知识，涵盖核心对象、调度与资源、发布治理、网络存储与控制面机制。',
  postgresql: '围绕 PostgreSQL 的 MVCC、索引、事务、分区与高可用，串起核心设计与治理主线。',
  ops: '将日常运维中反复用到的排障命令、清理流程和管理技巧，整理成可复用的操作指南。',
  git: '集中整理 Git 工作流、PR 与 Code Review、GitHub Actions 排障、发布与回滚实践。',
  'frontend-ecosystem': '整理 React、Vue、Svelte 共用的前端基础设施——Vite 构建、Axios HTTP 客户端、Alova 请求策略。',
}

const defaultTrackDescription = '按主题整理路线图、专题和能力自检入口，方便持续学习和回查。'

export const homeTracks = sections
  .filter((section) => section.key !== 'tools')
  .map((section) => ({
    title: section.navText,
    description: homeTrackDescriptions[section.key] ?? defaultTrackDescription,
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
  {
    eyebrow: 'Source reading',
    title: 'Go 源码精读模块',
    description: '把 runtime、标准库和工程主题拆开管理，避免在主菜单里滚动超长目录。',
    href: '/golang/guide/source-reading/',
  },
]

export const homePrinciples = [
  '按主题组织，不把知识堆成时间线式日志。',
  '优先给出路线和框架，再补专题和资料。',
  '兼顾系统学习、实践落地与能力自检。',
]
