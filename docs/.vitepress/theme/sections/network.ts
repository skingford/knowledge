import type { SectionConfig } from './types'

export const networkSection: SectionConfig = {
  key: 'network',
  base: '/network/',
  navText: '网络',
  overviewDescription:
    '系统整理网络必须掌握的核心知识，覆盖分层模型、TCP/IP、HTTP/HTTPS、DNS、CDN、负载均衡与常见排障方法。',
  landing: {
    eyebrow: 'Network',
    title: '网络专题',
    intro:
      '把网络从“会背三次握手”提升到“能解释一次请求怎么经过 DNS、TCP、TLS、HTTP、CDN、负载均衡，并能按层定位问题”的层面，先建立全局链路，再补协议细节和排障动作。',
    primary: { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '先按 Go 后端和实战排障主线定学习顺序。' },
    secondary: { title: '网络必备知识', href: '/network/essential-knowledge', description: '再用一篇总览文把协议、链路和排障框架搭起来。' },
    scope: [
      'OSI / TCP/IP 分层模型',
      'IP、路由与 NAT',
      'TCP / UDP 与可靠传输',
      'HTTP/1.1、HTTP/2、HTTP/3',
      'HTTPS / TLS 握手与证书',
      'DNS 解析与缓存',
      'CDN、反向代理与负载均衡',
      '网络排障命令与抓包思路',
    ],
    docs: [
      { title: 'Go 后端学习清单', href: '/network/learning-checklist', description: '按 Go 后端和实战场景排一条可打勾推进的网络学习主线。' },
      { title: '网络必备知识', href: '/network/essential-knowledge', description: '从分层模型、关键协议到排障方法，建立一张网络知识总地图。' },
      { title: 'TCP/IP、HTTP 与 HTTPS 主线', href: '/network/tcp-ip-http-and-https', description: '系统讲清 IP、TCP、TLS、HTTP 版本演进和一次请求的完整链路。' },
      { title: 'DNS、CDN 与负载均衡', href: '/network/dns-cdn-and-load-balancing', description: '把域名解析、边缘缓存、回源和 L4/L7 负载均衡串成同一条访问链路。' },
      { title: 'NAT、防火墙、内网穿透与 VPN', href: '/network/nat-firewall-and-vpn', description: '把地址转换、访问控制、内外网打通和远程接入放回同一条网络访问路径里理解。' },
      { title: '网络排障与常用命令', href: '/network/troubleshooting-and-commands', description: '整理 ping、traceroute、dig、curl、ss、tcpdump 等命令的使用场景和排查顺序。' },
      { title: '网络高频问题与自检清单', href: '/network/essential-questions', description: '按面试和排障高频问题整理网络答题口径，顺手附一份可落地的自检清单。' },
    ],
    order: [
      'Go 后端学习清单',
      '网络必备知识',
      'TCP/IP、HTTP 与 HTTPS 主线',
      'DNS、CDN 与负载均衡',
      'NAT、防火墙、内网穿透与 VPN',
      '网络排障与常用命令',
      '网络高频问题与自检清单',
    ],
  },
  sidebar: [
    {
      text: '核心入口',
      items: [
        { text: '专题总览', link: '/network/' },
        { text: '学习清单', link: '/network/learning-checklist' },
        { text: '必备知识', link: '/network/essential-knowledge' },
        { text: '协议主线', link: '/network/tcp-ip-http-and-https' },
        { text: '高频问题', link: '/network/essential-questions' },
      ],
    },
    {
      text: '基础设施链路',
      collapsed: true,
      items: [
        { text: 'DNS / CDN / LB', link: '/network/dns-cdn-and-load-balancing' },
        { text: 'NAT / 防火墙 / VPN', link: '/network/nat-firewall-and-vpn' },
      ],
    },
    {
      text: '排障实践',
      collapsed: true,
      items: [
        { text: '排障与命令', link: '/network/troubleshooting-and-commands' },
        { text: '自检清单', link: '/network/essential-questions' },
      ],
    },
  ],
}
