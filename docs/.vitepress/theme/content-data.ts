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

const golangSourceReadingSidebar: SidebarGroup[] = [
  {
    text: '源码阅读入口',
    items: [
      { text: '模块总览', link: '/golang/guide/source-reading/' },
      { text: 'Go 主方向入口', link: '/golang/' },
      { text: '源码与 Runtime 大纲', link: '/golang/guide/09-runtime-source' },
    ],
  },
  {
    text: '先读这几篇',
    items: [
      { text: 'runtime：GMP 调度器', link: '/golang/guide/source-reading/runtime-scheduler' },
      { text: 'runtime：GC 垃圾回收', link: '/golang/guide/source-reading/runtime-gc' },
      { text: 'channel：底层实现', link: '/golang/guide/source-reading/channel' },
      { text: 'map：Swiss Table', link: '/golang/guide/source-reading/map' },
      { text: 'net/http：HTTP 实现', link: '/golang/guide/source-reading/net-http' },
      { text: 'database/sql：连接池', link: '/golang/guide/source-reading/database-sql' },
    ],
  },
  {
    text: '运行时与并发',
    collapsed: true,
    items: [
      { text: 'sync：同步原语', link: '/golang/guide/source-reading/sync-primitives' },
      { text: 'sync/atomic：原子操作', link: '/golang/guide/source-reading/sync-atomic' },
      { text: 'sync.Pool：对象池', link: '/golang/guide/source-reading/sync-pool' },
      { text: 'sync.Cond：条件变量', link: '/golang/guide/source-reading/sync-cond' },
      { text: 'context：上下文传播', link: '/golang/guide/source-reading/context' },
      { text: 'channel：底层实现', link: '/golang/guide/source-reading/channel' },
      { text: 'map：Swiss Table', link: '/golang/guide/source-reading/map' },
      { text: 'goroutine：生命周期', link: '/golang/guide/source-reading/goroutine' },
      { text: 'timer：定时器实现', link: '/golang/guide/source-reading/timer' },
      { text: 'runtime：GMP 调度器', link: '/golang/guide/source-reading/runtime-scheduler' },
      { text: 'runtime：GC 垃圾回收', link: '/golang/guide/source-reading/runtime-gc' },
      { text: 'runtime：内存分配', link: '/golang/guide/source-reading/runtime-memory' },
      { text: 'runtime/debug：调试工具', link: '/golang/guide/source-reading/runtime-debug' },
      { text: 'runtime/pprof：性能剖析', link: '/golang/guide/source-reading/runtime-pprof' },
      { text: 'runtime/trace：执行追踪', link: '/golang/guide/source-reading/runtime-trace' },
      { text: 'runtime/metrics：运行时指标', link: '/golang/guide/source-reading/runtime-metrics' },
      { text: 'runtime.SetFinalizer：GC 终结器', link: '/golang/guide/source-reading/runtime-finalizer' },
      { text: 'go-memory-tuning：内存调优', link: '/golang/guide/source-reading/go-memory-tuning' },
    ],
  },
  {
    text: '标准库基础',
    collapsed: true,
    items: [
      { text: 'errors：错误链', link: '/golang/guide/source-reading/errors' },
      { text: 'strings/bytes：字符串处理', link: '/golang/guide/source-reading/strings-bytes' },
      { text: 'fmt：格式化 I/O', link: '/golang/guide/source-reading/fmt' },
      { text: 'strconv：字符串转换', link: '/golang/guide/source-reading/strconv' },
      { text: 'sort/slices：排序算法', link: '/golang/guide/source-reading/sort' },
      { text: 'math/rand：随机数生成', link: '/golang/guide/source-reading/math-rand' },
      { text: 'math/rand/v2：现代随机数', link: '/golang/guide/source-reading/math-rand-v2' },
      { text: 'math/big：任意精度算术', link: '/golang/guide/source-reading/math-big' },
      { text: 'math/bits：位操作', link: '/golang/guide/source-reading/math-bits' },
      { text: 'time：时间处理', link: '/golang/guide/source-reading/time-pkg' },
      { text: 'unsafe：内存操作', link: '/golang/guide/source-reading/unsafe' },
      { text: 'unsafe：底层指针操作', link: '/golang/guide/source-reading/unsafe-pkg' },
      { text: 'reflect：反射原理', link: '/golang/guide/source-reading/reflect' },
      { text: 'iter（Go 1.23+）：迭代器协议', link: '/golang/guide/source-reading/iter-pkg' },
      { text: 'unique（Go 1.23+）：字符串驻留', link: '/golang/guide/source-reading/unique-pkg' },
      { text: 'maps/cmp/slices：泛型工具', link: '/golang/guide/source-reading/maps-cmp' },
      { text: 'slices/maps/cmp：泛型标准库', link: '/golang/guide/source-reading/slices-maps-cmp' },
    ],
  },
  {
    text: 'I/O、系统与网络',
    collapsed: true,
    items: [
      { text: 'io：接口体系', link: '/golang/guide/source-reading/io-interfaces' },
      { text: 'io 高级组合：TeeReader/Pipe', link: '/golang/guide/source-reading/io-advanced' },
      { text: 'bufio：缓冲 I/O', link: '/golang/guide/source-reading/bufio' },
      { text: 'bufio 高级模式：Scanner/ReadLine', link: '/golang/guide/source-reading/bufio-advanced' },
      { text: 'io/fs：文件系统抽象', link: '/golang/guide/source-reading/io-fs' },
      { text: 'os：文件与进程', link: '/golang/guide/source-reading/os' },
      { text: 'os/exec：命令执行', link: '/golang/guide/source-reading/os-exec' },
      { text: 'os/signal：信号处理', link: '/golang/guide/source-reading/os-signal' },
      { text: 'os/user：用户信息', link: '/golang/guide/source-reading/os-user' },
      { text: 'path/filepath：路径处理', link: '/golang/guide/source-reading/path-filepath' },
      { text: 'unicode/utf8：字符编码', link: '/golang/guide/source-reading/unicode-utf8' },
      { text: 'text/tabwriter：列对齐输出', link: '/golang/guide/source-reading/text-tabwriter' },
      { text: 'net：TCP/UDP 底层', link: '/golang/guide/source-reading/net' },
      { text: 'net/url：URL 解析', link: '/golang/guide/source-reading/net-url' },
      { text: 'net/http：HTTP 实现', link: '/golang/guide/source-reading/net-http' },
      { text: 'net/http 服务端高级模式', link: '/golang/guide/source-reading/net-http-server' },
      { text: 'net/http RESTful API 设计模式', link: '/golang/guide/source-reading/net-http-api' },
      { text: 'net/http Transport：连接池调优', link: '/golang/guide/source-reading/net-http-transport' },
      { text: 'net/http/httptrace：请求追踪', link: '/golang/guide/source-reading/net-http-trace' },
      { text: 'net/http/httptest：HTTP 测试', link: '/golang/guide/source-reading/net-http-test' },
      { text: 'net/http/httputil：反向代理', link: '/golang/guide/source-reading/net-httputil' },
      { text: 'net/http 限流与熔断', link: '/golang/guide/source-reading/net-http-ratelimit' },
      { text: 'HTTP/2：多路复用与 Server Push', link: '/golang/guide/source-reading/net-http2' },
      { text: 'net/http/cookiejar：Cookie 管理', link: '/golang/guide/source-reading/net-cookiejar' },
      { text: 'net/netip：现代 IP 地址', link: '/golang/guide/source-reading/net-netip' },
      { text: 'net/rpc：远程过程调用', link: '/golang/guide/source-reading/net-rpc' },
      { text: 'net/smtp：邮件发送', link: '/golang/guide/source-reading/net-smtp' },
      { text: '自定义 TCP 协议服务器', link: '/golang/guide/source-reading/net-tcp-server' },
      { text: 'WebSocket 服务器实现', link: '/golang/guide/source-reading/websocket' },
      { text: 'gRPC-Go：微服务通信', link: '/golang/guide/source-reading/grpc-go' },
      { text: 'Prometheus Go 客户端', link: '/golang/guide/source-reading/prometheus-go' },
      { text: 'OpenTelemetry Go：分布式追踪', link: '/golang/guide/source-reading/opentelemetry-go' },
      { text: 'golang.org/x/sync：并发工具包', link: '/golang/guide/source-reading/golang-x-sync' },
      { text: 'golang.org/x/oauth2：OAuth2 客户端', link: '/golang/guide/source-reading/golang-x-oauth2' },
      { text: 'go-redis：Redis 客户端', link: '/golang/guide/source-reading/go-redis' },
      { text: 'pgx：PostgreSQL 原生驱动', link: '/golang/guide/source-reading/pgx-driver' },
    ],
  },
  {
    text: '数据、编码与模板',
    collapsed: true,
    items: [
      { text: 'encoding/json：编解码', link: '/golang/guide/source-reading/encoding-json' },
      { text: 'encoding/xml：XML 编解码', link: '/golang/guide/source-reading/encoding-xml' },
      { text: 'encoding/csv：CSV 处理', link: '/golang/guide/source-reading/encoding-csv' },
      { text: 'encoding/gob：Go 原生序列化', link: '/golang/guide/source-reading/encoding-gob' },
      { text: 'encoding/base64：Base64 编码', link: '/golang/guide/source-reading/encoding-base64' },
      { text: 'encoding/hex：十六进制编解码', link: '/golang/guide/source-reading/encoding-hex' },
      { text: 'encoding/binary：字节序与协议', link: '/golang/guide/source-reading/encoding-binary' },
      { text: 'compress/gzip：流式压缩', link: '/golang/guide/source-reading/compress-gzip' },
      { text: 'archive/zip：ZIP 归档', link: '/golang/guide/source-reading/archive-zip' },
      { text: 'archive/tar：TAR 归档', link: '/golang/guide/source-reading/archive-tar' },
      { text: 'regexp：正则引擎', link: '/golang/guide/source-reading/regexp' },
      { text: 'container/heap：优先队列', link: '/golang/guide/source-reading/container-heap' },
      { text: 'container/list：双向链表', link: '/golang/guide/source-reading/container-list' },
      { text: 'text/template：模板引擎', link: '/golang/guide/source-reading/text-template' },
      { text: 'html/template：安全模板引擎', link: '/golang/guide/source-reading/html-template' },
      { text: 'database/sql：连接池', link: '/golang/guide/source-reading/database-sql' },
      { text: 'database/sql：高级事务与批量插入', link: '/golang/guide/source-reading/database-sql-advanced' },
    ],
  },
  {
    text: '安全与密码学',
    collapsed: true,
    items: [
      { text: 'crypto/tls：TLS 实现', link: '/golang/guide/source-reading/crypto-tls' },
      { text: 'crypto/x509：证书与 PKI', link: '/golang/guide/source-reading/crypto-x509' },
      { text: 'crypto/aes：对称加密', link: '/golang/guide/source-reading/crypto-aes' },
      { text: 'crypto/cipher：分组密码模式', link: '/golang/guide/source-reading/crypto-cipher' },
      { text: 'crypto/rand：密码学随机数', link: '/golang/guide/source-reading/crypto-rand' },
      { text: 'crypto/hmac：哈希与消息认证', link: '/golang/guide/source-reading/crypto-hmac' },
      { text: 'crypto/sha256：hash 接口体系', link: '/golang/guide/source-reading/crypto-sha' },
      { text: 'crypto/rsa：RSA 非对称加密', link: '/golang/guide/source-reading/crypto-rsa' },
      { text: 'crypto/ecdsa：椭圆曲线签名', link: '/golang/guide/source-reading/crypto-ecdsa' },
      { text: 'crypto/ed25519：EdDSA 签名', link: '/golang/guide/source-reading/crypto-ed25519' },
      { text: '密码散列：bcrypt/Argon2id/scrypt', link: '/golang/guide/source-reading/crypto-password' },
    ],
  },
  {
    text: '工程实践与工具链',
    collapsed: true,
    items: [
      { text: 'log/slog：结构化日志', link: '/golang/guide/source-reading/log-slog' },
      { text: 'log/slog：深度解析', link: '/golang/guide/source-reading/log-slog-deep' },
      { text: 'log：标准日志库', link: '/golang/guide/source-reading/log-pkg' },
      { text: 'testing：测试框架', link: '/golang/guide/source-reading/testing' },
      { text: 'testing 高级模式', link: '/golang/guide/source-reading/testing-advanced' },
      { text: 'testing/fstest：虚拟文件系统测试', link: '/golang/guide/source-reading/testing-fstest' },
      { text: 'go:generate 代码生成工具链', link: '/golang/guide/source-reading/go-generate' },
      { text: 'go/format：代码格式化', link: '/golang/guide/source-reading/go-format' },
      { text: 'go/ast + go/parser：AST 解析', link: '/golang/guide/source-reading/go-ast' },
      { text: 'go/types：类型检查器', link: '/golang/guide/source-reading/go-types' },
      { text: 'go/analysis：自定义 Linter', link: '/golang/guide/source-reading/go-analysis' },
      { text: 'embed：静态资源嵌入', link: '/golang/guide/source-reading/embed' },
      { text: 'flag：命令行解析', link: '/golang/guide/source-reading/flag' },
      { text: 'expvar：可导出变量', link: '/golang/guide/source-reading/expvar' },
      { text: 'debug/buildinfo：构建信息', link: '/golang/guide/source-reading/debug-buildinfo' },
      { text: 'cgo：C/Go 互操作', link: '/golang/guide/source-reading/cgo-basics' },
      { text: 'cobra+viper：CLI 工具框架', link: '/golang/guide/source-reading/cobra-viper' },
      { text: 'wire：编译期依赖注入', link: '/golang/guide/source-reading/wire' },
      { text: 'golang.org/x/text：Unicode 文本', link: '/golang/guide/source-reading/golang-x-text' },
    ],
  },
]

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
        '案例实战',
        'MySQL 深入学习',
      ],
      docs: [
        { title: '架构师学习路线', href: '/architecture/architect-learning-roadmap', description: '适合作为主入口，先看清楚各阶段该补什么。' },
        { title: '架构师分阶段书单', href: '/architecture/architect-booklist-by-level', description: '按成长阶段筛选更合适的资料。' },
        { title: '架构能力自检准备清单', href: '/architecture/architect-interview-prep-checklist', description: '用判断项梳理系统设计和架构治理能力。' },
        { title: '高并发系统设计清单', href: '/architecture/high-concurrency-system-checklist', description: '把常见高并发设计问题拆成一组可检查项。' },
        { title: '分布式事务方案对比', href: '/architecture/distributed-transaction-comparison', description: '快速对比常见事务方案的边界与取舍。' },
        { title: 'PostgreSQL 高可用集群整理', href: '/postgresql/ha-cluster', description: 'PG 高可用方案选型、Patroni 部署、WAL 流复制与故障恢复速查。' },
        { title: '架构案例实战', href: '/architecture/case-studies/', description: '收录偏业务落地的组织设计、PostgreSQL 高可用、支付系统与出海架构案例。' },
        { title: 'MySQL 实战 45 讲', href: '/architecture/mysql45/', description: '极客时间《MySQL 实战 45 讲》学习笔记，按主题分类整理。' },
        { title: '待补主题清单', href: '/architecture/todo-topics', description: '查看后续计划补充的专题。' },
      ],
      order: [
        '架构师学习路线',
        '架构师分阶段书单',
        '高并发系统设计清单',
        '分布式事务方案对比',
        '架构能力自检准备清单',
        'PostgreSQL 高可用集群整理',
        '架构案例实战',
      ],
    },
    sidebar: [
      {
        text: '架构主线',
        items: [
          { text: '方向概览', link: '/architecture/' },
          { text: '架构师学习路线', link: '/architecture/architect-learning-roadmap' },
          { text: '架构师分阶段书单', link: '/architecture/architect-booklist-by-level' },
          { text: '架构能力自检准备清单', link: '/architecture/architect-interview-prep-checklist' },
          { text: '高并发系统设计清单', link: '/architecture/high-concurrency-system-checklist' },
          { text: '分布式事务方案对比', link: '/architecture/distributed-transaction-comparison' },
          { text: 'PostgreSQL 高可用集群整理', link: '/postgresql/ha-cluster' },
          { text: '待补主题清单', link: '/architecture/todo-topics' },
        ],
      },
      {
        text: '案例实战',
        items: [
          { text: '案例概览', link: '/architecture/case-studies/' },
          { text: '组织架构与业务系统设计方案', link: '/architecture/case-studies/organization-structure-and-business-system-design' },
          { text: 'PostgreSQL 高可用集群整理', link: '/postgresql/ha-cluster' },
          { text: '高并发支付系统专题整理', link: '/architecture/case-studies/high-concurrency-payment-system-practice-notes' },
          { text: '高并发支付系统：MySQL 篇', link: '/mysql/' },
          { text: '高并发支付系统：PostgreSQL 篇', link: '/postgresql/' },
          { text: '高并发支付系统：Redis 篇', link: '/architecture/case-studies/high-concurrency-payment-redis' },
          { text: '高并发支付系统：Kafka 篇', link: '/kafka/' },
          { text: '运动 APP 出海架构与管理完全指南', link: '/architecture/case-studies/global-fitness-app-architecture-and-management-guide' },
        ],
      },
      {
        text: 'MySQL 实战 45 讲',
        collapsed: true,
        items: [
          { text: '专题概览', link: '/architecture/mysql45/' },
          { text: '基础架构与日志', link: '/architecture/mysql45/basics' },
          { text: '索引原理与优化', link: '/architecture/mysql45/index-chapter' },
          { text: '锁与事务', link: '/architecture/mysql45/lock-transaction' },
          { text: '数据页与 IO', link: '/architecture/mysql45/flush-io' },
          { text: 'SQL 查询优化', link: '/architecture/mysql45/query-optimization' },
          { text: '高可用与主从复制', link: '/architecture/mysql45/high-availability' },
          { text: '运维与故障处理', link: '/architecture/mysql45/operation-maintenance' },
          { text: '引擎与进阶', link: '/architecture/mysql45/engine-advanced' },
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
      scope: ['Go 语言底层', '并发模型', '性能优化与排障', '服务端工程实践', '能力自检准备', '设计模式与安全', '容器化与云原生', '代码生成与元编程'],
      docs: [
        { title: '高级 Golang 学习资料', href: '/golang/golang-advanced-learning-guide', description: '主入口文档，覆盖语言、并发、性能和工程实践。' },
        { title: '30+ 高频 Golang 能力自检题', href: '/golang/go-top-30-interview-questions', description: '用问题驱动回顾知识盲区和底层理解。' },
        { title: 'Golang 高频题代码片段', href: '/golang/go-interview-code-snippets', description: '配套示例代码，方便把抽象概念落到实现。' },
        { title: 'Go 推荐书单与资料', href: '/golang/golang-recommended-resources', description: '补充阅读清单，便于继续深挖。' },
        { title: 'Pprof 排障指南', href: '/golang/pprof-troubleshooting-guide', description: '针对性能定位和排障建立实操路径。' },
        { title: 'Context 使用边界', href: '/golang/context-usage-boundaries', description: '厘清在 Go 服务里使用 Context 的边界和误区。' },
        { title: 'Go 源码精读模块', href: '/golang/guide/source-reading/', description: '把标准库与 runtime 源码阅读作为独立模块来学。' },
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
          { text: 'Go 源码精读模块', link: '/golang/guide/source-reading/' },
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
    key: 'mysql',
    base: '/mysql/',
    navText: 'MySQL',
    overviewDescription:
      '系统整理 MySQL 核心知识，涵盖 database/sql、连接池、事务、SQL 优化、ORM，以及高并发场景下的索引设计、大事务拆分、死锁治理、热点更新与分库分表。',
    landing: {
      eyebrow: 'MySQL',
      title: 'MySQL 专题',
      intro:
        '把散落在 Go 学习大纲和支付系统案例中的 MySQL 相关内容统一收敛，涵盖日常开发基础和高并发场景实战。',
      primary: { title: '专题总览', href: '/mysql/', description: '从总览页开始，按主题查阅。' },
      secondary: { title: '索引设计', href: '/mysql/index-design', description: '从 B+ 树和最左前缀开始。' },
      scope: [
        'database/sql 与连接池',
        '事务处理与 SQL 优化',
        'ORM 使用经验',
        'B+ 树索引设计',
        '大事务拆分与死锁治理',
        '热点更新与分库分表',
      ],
      docs: [
        { title: 'database/sql 与连接池', href: '/mysql/database-sql-and-connection', description: 'Go 标准库操作 MySQL 的核心用法与连接池配置。' },
        { title: '事务处理与 SQL 优化', href: '/mysql/transaction-and-optimization', description: '事务模式、EXPLAIN 分析、批量操作与游标分页。' },
        { title: 'ORM 使用经验（GORM）', href: '/mysql/orm-gorm', description: 'GORM 基础用法、N+1 问题与何时用原生 SQL。' },
        { title: 'B+ 树索引与最左前缀', href: '/mysql/index-design', description: '索引结构、回表原理、最左前缀与索引失效场景。' },
        { title: '大事务拆分', href: '/mysql/large-transaction-splitting', description: '大事务来源、拆分原则与正反例代码。' },
        { title: '死锁检测与回滚重试', href: '/mysql/deadlock-and-retry', description: '死锁排查、根因治理与幂等回滚重试。' },
        { title: '热点账户更新', href: '/mysql/hot-account-update', description: '从乐观锁到子账户拆分的分层治理方案。' },
        { title: '分库分表与迁移', href: '/mysql/sharding-and-migration', description: '拆分策略、数据迁移流程与核心原则。' },
        { title: '高频追问', href: '/mysql/high-frequency-questions', description: 'SELECT *、深分页、锁持有时间等落地细节。' },
      ],
      order: [
        'database/sql 与连接池',
        '事务处理与 SQL 优化',
        'ORM 使用经验（GORM）',
        'B+ 树索引与最左前缀',
        '大事务拆分',
        '死锁检测与回滚重试',
        '热点账户更新',
        '分库分表与迁移',
        '高频追问',
      ],
    },
    sidebar: [
      {
        text: 'MySQL 基础',
        items: [
          { text: '专题总览', link: '/mysql/' },
          { text: 'database/sql 与连接池', link: '/mysql/database-sql-and-connection' },
          { text: '事务处理与 SQL 优化', link: '/mysql/transaction-and-optimization' },
          { text: 'ORM 使用经验（GORM）', link: '/mysql/orm-gorm' },
        ],
      },
      {
        text: '高并发场景',
        items: [
          { text: 'B+ 树索引与最左前缀', link: '/mysql/index-design' },
          { text: '大事务拆分', link: '/mysql/large-transaction-splitting' },
          { text: '死锁检测与回滚重试', link: '/mysql/deadlock-and-retry' },
          { text: '热点账户更新', link: '/mysql/hot-account-update' },
          { text: '分库分表与迁移', link: '/mysql/sharding-and-migration' },
          { text: '高频追问', link: '/mysql/high-frequency-questions' },
        ],
      },
    ],
  },
  {
    key: 'kafka',
    base: '/kafka/',
    navText: 'Kafka',
    overviewDescription:
      '系统整理 Kafka 核心知识，涵盖 Producer/Consumer/Broker、分区与副本、消息可靠性、顺序性、积压治理与支付实战。',
    landing: {
      eyebrow: 'Kafka',
      title: 'Kafka 专题',
      intro:
        '把散落在支付系统案例中的 Kafka 相关内容统一收敛，涵盖核心概念、支付实战和高频深入追问。',
      primary: { title: '专题总览', href: '/kafka/', description: '从总览页开始，按主题查阅。' },
      secondary: { title: '核心概念', href: '/kafka/core-concepts', description: '从 Producer/Broker/Consumer 开始。' },
      scope: [
        'Producer/Consumer/Broker',
        'Topic/Partition/Offset',
        'Consumer Group 与 Rebalance',
        '高可用与副本机制',
        '支付场景消息可靠性',
        '顺序性、积压治理与死信',
      ],
      docs: [
        { title: '核心概念', href: '/kafka/core-concepts', description: 'Producer/Consumer/Broker、Topic/Partition、Consumer Group、高可用机制与性能原理。' },
        { title: '支付实战', href: '/kafka/payment-practice', description: 'TCC+Kafka、本地消息表、Offset 补偿、全链路闭环、延迟队列与生产治理。' },
        { title: '深入追问与词汇', href: '/kafka/interview-questions', description: '消息不丢失、顺序性、积压处理、重试与死信、幂等与事务、英语术语速查。' },
      ],
      order: [
        '核心概念',
        '支付实战',
        '深入追问与词汇',
      ],
    },
    sidebar: [
      {
        text: 'Kafka 专题',
        items: [
          { text: '专题总览', link: '/kafka/' },
          { text: '核心概念', link: '/kafka/core-concepts' },
          { text: '支付实战', link: '/kafka/payment-practice' },
          { text: '深入追问与词汇', link: '/kafka/interview-questions' },
        ],
      },
    ],
  },
  {
    key: 'postgresql',
    base: '/postgresql/',
    navText: 'PostgreSQL',
    overviewDescription:
      '系统整理 PostgreSQL 核心知识，涵盖 MVCC、索引、锁与事务、批量写入、分区表、高可用集群部署与故障恢复。',
    landing: {
      eyebrow: 'PostgreSQL',
      title: 'PostgreSQL 专题',
      intro:
        '把散落在支付系统案例和架构文档中的 PostgreSQL 相关内容统一收敛，方便按主题查阅和持续更新。',
      primary: { title: '专题总览', href: '/postgresql/', description: '从总览页开始，按主题查阅。' },
      secondary: { title: '高可用集群', href: '/postgresql/ha-cluster', description: '从 Patroni + etcd + HAProxy 开始。' },
      scope: [
        'MVCC 与可见性',
        '索引与查询计划',
        '锁与事务',
        '批量写入与分区表',
        '高可用集群部署',
        'WAL 流复制与故障恢复',
      ],
      docs: [
        { title: '核心概念与高频考点', href: '/postgresql/core-concepts', description: 'MVCC、索引类型、锁与事务、批量写入、分区表、高可用与复制。' },
        { title: '支付场景追问', href: '/postgresql/payment-practice', description: '长事务问题、流水表分区、CopyFrom 使用时机、复制延迟监控。' },
        { title: '高可用集群整理', href: '/postgresql/ha-cluster', description: 'Patroni + etcd + HAProxy 部署、WAL 流复制、同步策略、故障恢复。' },
      ],
      order: [
        '核心概念与高频考点',
        '支付场景追问',
        '高可用集群整理',
      ],
    },
    sidebar: [
      {
        text: 'PostgreSQL 专题',
        items: [
          { text: '专题总览', link: '/postgresql/' },
          { text: '核心概念与高频考点', link: '/postgresql/core-concepts' },
          { text: '支付场景追问', link: '/postgresql/payment-practice' },
          { text: '高可用集群整理', link: '/postgresql/ha-cluster' },
        ],
      },
    ],
  },
  {
    key: 'go-source-reading',
    base: '/golang/guide/source-reading/',
    navText: 'Go 源码阅读',
    overviewDescription:
      '独立整理 Go 标准库、runtime 与工程周边源码精读，适合按专题深入阅读而不是在 Golang 主菜单里翻长列表。',
    landing: {
      eyebrow: 'Go Source Reading',
      title: 'Go 源码阅读模块',
      intro:
        '把 runtime、标准库、网络栈、数据编码、安全与工程工具链拆成独立模块，方便按专题深挖 Go 的实现细节。',
      primary: { title: '总览入口', href: '/golang/guide/source-reading/', description: '先看全景图与精读索引。' },
      secondary: { title: 'Runtime 主线', href: '/golang/guide/source-reading/runtime-scheduler', description: '先走调度、GC、内存分配三件套。' },
      scope: [
        'runtime 与调度',
        '并发原语',
        'I/O 与网络栈',
        '数据结构与编码',
        '安全与密码学',
        '工程实践与工具链',
      ],
      docs: [
        { title: 'Go 源码精读总览', href: '/golang/guide/source-reading/', description: '从包全景图进入，再按主题选择。' },
        { title: 'runtime：GMP 调度器', href: '/golang/guide/source-reading/runtime-scheduler', description: '理解 G、M、P 关系和调度主线。' },
        { title: 'runtime：GC 垃圾回收', href: '/golang/guide/source-reading/runtime-gc', description: '建立三色标记、写屏障和调优视角。' },
        { title: 'runtime：内存分配', href: '/golang/guide/source-reading/runtime-memory', description: '厘清 mcache、mcentral、mheap 分层。' },
        { title: 'channel：底层实现', href: '/golang/guide/source-reading/channel', description: '看懂发送、接收、阻塞与唤醒。' },
        { title: 'net/http：HTTP 实现', href: '/golang/guide/source-reading/net-http', description: '把服务端和客户端主路径串起来。' },
      ],
      order: [
        'Go 源码精读总览',
        'runtime：GMP 调度器',
        'runtime：GC 垃圾回收',
        'runtime：内存分配',
        'channel：底层实现',
        'net/http：HTTP 实现',
      ],
    },
    sidebar: golangSourceReadingSidebar,
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
  { title: '想专项读 Go 源码', href: '/golang/guide/source-reading/', description: '直接进入独立源码阅读模块，按 runtime、网络、编码等主题深挖。' },
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
            : section.key === 'mysql'
              ? '系统整理 MySQL 核心知识，从 database/sql 基础到高并发场景下的索引、事务、锁与分库分表。'
              : section.key === 'kafka'
                ? '系统整理 Kafka 核心知识，涵盖消息可靠性、顺序性、积压治理与支付场景实战。'
                : section.key === 'postgresql'
                  ? '系统整理 PostgreSQL 核心知识，涵盖 MVCC、索引、事务、分区表与高可用集群部署。'
                  : section.key === 'go-source-reading'
                ? '把 runtime、标准库和工程周边源码拆成独立阅读模块，适合按主题持续深挖实现细节。'
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
