<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'project-layout'
  | 'go-mod-lifecycle'
  | 'slog-pipeline'
  | 'config-priority'
  | 'error-code-system'
  | 'middleware-stack'
  | 'code-style-principles'
  | 'unit-test-patterns'
  | 'mock-boundary'
  | 'integration-lifecycle'
  | 'benchmark-reading'
  | 'ci-pipeline'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'project-layout': '760px',
  'go-mod-lifecycle': '760px',
  'slog-pipeline': '760px',
  'config-priority': '760px',
  'error-code-system': '760px',
  'middleware-stack': '760px',
  'code-style-principles': '760px',
  'unit-test-patterns': '760px',
  'mock-boundary': '760px',
  'integration-lifecycle': '760px',
  'benchmark-reading': '760px',
  'ci-pipeline': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 工程实践概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">工程实践主线：先把项目搭好，再规范错误和中间件，最后用测试与流水线把质量锁住</text>

      <rect x="22" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="136" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">基础设施</text>
      <text x="136" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">cmd / internal / pkg</text>
      <text x="136" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">go.mod / go.sum</text>
      <text x="136" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">slog / config</text>
      <text x="136" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先让项目能稳定启动、观测、配置</text>

      <rect x="266" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">可维护性</text>
      <text x="380" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">错误码体系</text>
      <text x="380" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">请求中间件栈</text>
      <text x="380" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">代码规范 / lint</text>
      <text x="380" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">再让团队能长期协作，而不是靠记忆维持一致性</text>

      <rect x="510" y="44" width="228" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="624" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">质量闭环</text>
      <text x="624" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">unit / mock / integration</text>
      <text x="624" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">benchmark</text>
      <text x="624" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">CI / release / Docker</text>
      <text x="624" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最后把正确性、性能和发布流程自动化</text>
    </svg>

    <svg
      v-else-if="kind === 'project-layout'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 项目结构图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">项目结构的核心不是目录多，而是让“入口、业务、公共库、部署物”各待在自己的位置</text>

      <rect x="22" y="48" width="150" height="194" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="97" y="72" text-anchor="middle" font-size="12" fill="var(--d-rv-c-text)">cmd/</text>
      <text x="97" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">api-server main.go</text>
      <text x="97" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">worker main.go</text>
      <text x="97" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">只做依赖组装</text>
      <text x="97" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">启动与退出</text>

      <rect x="192" y="48" width="178" height="194" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="281" y="72" text-anchor="middle" font-size="12" fill="var(--d-text)">internal/</text>
      <text x="281" y="98" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">handler -> service -> repository</text>
      <text x="281" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">middleware / model / shared</text>
      <text x="281" y="146" text-anchor="middle" font-size="10" fill="var(--d-text)">业务核心放这里</text>
      <text x="281" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">编译器限制外部 import</text>

      <rect x="390" y="48" width="150" height="194" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="465" y="72" text-anchor="middle" font-size="12" fill="var(--d-rv-a-text)">pkg/</text>
      <text x="465" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">logger</text>
      <text x="465" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">httputil</text>
      <text x="465" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">errcode</text>
      <text x="465" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">给外部项目复用</text>

      <rect x="560" y="48" width="178" height="194" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="649" y="72" text-anchor="middle" font-size="12" fill="var(--d-warn-text)">外围资源</text>
      <text x="649" y="98" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">configs / scripts / api</text>
      <text x="649" y="114" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">docs / deployments</text>
      <text x="649" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">配置模板、脚本、文档、部署清单</text>
      <text x="649" y="182" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">跟代码分层一起管理</text>
    </svg>

    <svg
      v-else-if="kind === 'go-mod-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go Modules 依赖流转图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go Modules 的主线是：import 决定依赖，go.mod 锁版本，go.sum 校验内容，代理和缓存负责分发</text>

      <rect x="28" y="96" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">源码 import</text>
      <text x="87" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">github.com/x/y</text>

      <line x1="146" y1="120" x2="238" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="238" y="78" width="148" height="84" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="312" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">go.mod</text>
      <text x="312" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">module / require</text>
      <text x="312" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">replace / exclude</text>
      <text x="312" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">go mod tidy 整理它</text>

      <line x1="386" y1="120" x2="474" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="474" y="78" width="122" height="84" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="535" y="100" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">go.sum</text>
      <text x="535" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">校验哈希</text>
      <text x="535" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">必须提交</text>
      <text x="535" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">go mod verify</text>

      <line x1="596" y1="120" x2="688" y2="120" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="688" y="62" width="44" height="116" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="710" y="86" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">proxy</text>
      <text x="710" y="104" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">cache</text>
      <text x="710" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">vendor</text>
      <text x="710" y="140" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">GOPRIVATE</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`replace` 适合临时本地调试，`GOPRIVATE` 解决企业私有仓库拉取和校验路径，发布前要清理不该留下的 replace</text>
    </svg>

    <svg
      v-else-if="kind === 'slog-pipeline'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="slog 结构化日志流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">slog 的关键不是打印字符串，而是把字段化日志通过 handler 送到文本或 JSON 输出端</text>

      <rect x="28" y="94" width="110" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务代码</text>
      <text x="83" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">InfoContext(...)</text>

      <line x1="138" y1="119" x2="232" y2="119" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="232" y="72" width="154" height="94" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="309" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">Logger</text>
      <text x="309" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">With 固定字段</text>
      <text x="309" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Group 分组字段</text>
      <text x="309" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">LevelVar 动态调级别</text>

      <line x1="386" y1="119" x2="482" y2="119" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="482" y="72" width="148" height="94" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="556" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Handler</text>
      <text x="556" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">JSONHandler / TextHandler</text>
      <text x="556" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ContextHandler 提取 request_id</text>
      <text x="556" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">可做脱敏和过滤</text>

      <line x1="630" y1="119" x2="714" y2="119" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="714" y="94" width="18" height="50" rx="4" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="706" y="84" text-anchor="end" font-size="9" fill="var(--d-rv-a-text)">stdout / file / collector</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">本地开发常看文本，生产常落 JSON。真正的价值是字段化检索、上下文关联和动态调试，而不是把日志拼成一整句字符串</text>
    </svg>

    <svg
      v-else-if="kind === 'config-priority'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="配置优先级图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">配置管理的关键不是“从哪读”，而是要有清晰优先级、统一结构和启动期校验</text>

      <rect x="26" y="102" width="112" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="82" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">默认值</text>

      <line x1="138" y1="123" x2="222" y2="123" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="222" y="102" width="112" height="42" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="278" y="127" text-anchor="middle" font-size="10" fill="var(--d-text)">config.yaml</text>

      <line x1="334" y1="123" x2="418" y2="123" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="418" y="102" width="112" height="42" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="474" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">环境变量</text>

      <line x1="530" y1="123" x2="614" y2="123" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="614" y="102" width="112" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="670" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">命令行参数</text>

      <rect x="224" y="176" width="312" height="52" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="198" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">最终 Config struct</text>
      <text x="380" y="214" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">validate() 失败就启动即退出，敏感值优先走 env / secret，不进仓库</text>

      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Viper 只是读配置的工具，真正重要的是统一 mapstructure、优先级规则、以及 fail fast 的校验过程</text>
    </svg>

    <svg
      v-else-if="kind === 'error-code-system'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="错误码体系图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">错误码体系要解决三件事：模块归类、防重复注册，以及把 HTTP 状态和业务码分开表达</text>

      <rect x="34" y="86" width="154" height="84" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="111" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">ErrCode</text>
      <text x="111" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Code: 20001</text>
      <text x="111" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Message: user not found</text>
      <text x="111" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">HTTPStatus: 404</text>

      <line x1="188" y1="128" x2="296" y2="128" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="296" y="74" width="164" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="378" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">registry</text>
      <text x="378" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">init() -> Register()</text>
      <text x="378" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">重复 code 直接 panic</text>
      <text x="378" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Lookup(code) 查询</text>
      <text x="378" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1xxxx / 2xxxx / 3xxxx 分模块</text>

      <line x1="460" y1="128" x2="572" y2="128" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="572" y="74" width="154" height="108" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="649" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">API Response</text>
      <text x="649" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">HTTP 404 / 500</text>
      <text x="649" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">body.code = 20001</text>
      <text x="649" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">body.message = ...</text>
      <text x="649" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">data 可选</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">网关和监控看 HTTP 状态，前端和客户端看业务码。把两层语义混在一起，后续排障和兼容都会很痛苦</text>
    </svg>

    <svg
      v-else-if="kind === 'middleware-stack'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="工程化中间件栈图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">工程化中间件栈通常固定成几层：Recovery 兜底，请求 ID 建上下文，Logger 采样，CORS/鉴权决定是否放行</text>

      <rect x="26" y="116" width="90" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="71" y="136" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">request</text>
      <text x="71" y="152" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">进入</text>

      <line x1="116" y1="138" x2="188" y2="138" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="188" y="92" width="104" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="240" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Recovery</text>
      <text x="240" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">panic -> 500</text>
      <text x="240" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">记录 stack</text>

      <line x1="292" y1="138" x2="364" y2="138" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="364" y="92" width="104" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="416" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">RequestID</text>
      <text x="416" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写入 ctx</text>
      <text x="416" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">回写响应头</text>

      <line x1="468" y1="138" x2="540" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="540" y="92" width="104" height="92" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="592" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Logger</text>
      <text x="592" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">status / latency</text>
      <text x="592" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">带 request_id</text>

      <line x1="644" y1="138" x2="704" y2="138" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="704" y="92" width="28" height="92" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="698" y="112" text-anchor="end" font-size="9" fill="var(--d-warn-text)">CORS</text>
      <text x="698" y="130" text-anchor="end" font-size="9" fill="var(--d-warn-text)">Auth</text>
      <text x="698" y="148" text-anchor="end" font-size="9" fill="var(--d-warn-text)">Handler</text>

      <text x="380" y="228" text-anchor="middle" font-size="10" fill="var(--d-text)">Chain 从后往前包，所以写在前面的 middleware 最终在最外层执行</text>
      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">无状态中间件最容易复用；需要配置时通过闭包传入，而不是把请求期状态塞进全局变量</text>
    </svg>

    <svg
      v-else-if="kind === 'code-style-principles'"
      viewBox="0 0 760 270"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 代码规范图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 代码规范真正想守住的是三件事：命名自然、接口解耦、工具自动兜底</text>

      <rect x="22" y="50" width="220" height="192" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="132" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">命名</text>
      <text x="132" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">包名小写短词</text>
      <text x="132" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">user.Service 而不是 UserService</text>
      <text x="132" y="144" text-anchor="middle" font-size="10" fill="var(--d-text)">userID / httpClient</text>
      <text x="132" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">ErrNotFound</text>

      <rect x="270" y="50" width="220" height="192" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">设计</text>
      <text x="380" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">零值可用</text>
      <text x="380" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">NewXxx + Option</text>
      <text x="380" y="144" text-anchor="middle" font-size="10" fill="var(--d-text)">接口在消费方定义</text>
      <text x="380" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">实现方不必提前声明自己实现了谁</text>

      <rect x="518" y="50" width="220" height="192" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="628" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">工具</text>
      <text x="628" y="104" text-anchor="middle" font-size="10" fill="var(--d-text)">gofmt / goimports</text>
      <text x="628" y="124" text-anchor="middle" font-size="10" fill="var(--d-text)">govet / staticcheck</text>
      <text x="628" y="144" text-anchor="middle" font-size="10" fill="var(--d-text)">golangci-lint 聚合执行</text>
      <text x="628" y="164" text-anchor="middle" font-size="10" fill="var(--d-text)">让规范进入 CI，而不是靠人提醒</text>
    </svg>

    <svg
      v-else-if="kind === 'unit-test-patterns'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 单元测试模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 单测最常见的套路是：表驱动组织输入，t.Run 分子用例，Helper/require/assert 提升可读性</text>

      <rect x="30" y="92" width="144" height="86" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="102" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">tests := []struct{...}</text>
      <text x="102" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">name / input / want</text>
      <text x="102" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">新增用例只加一行</text>

      <line x1="174" y1="135" x2="274" y2="135" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="274" y="92" width="144" height="86" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="346" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">for _, tt := range tests</text>
      <text x="346" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">t.Run(tt.name, ...)</text>
      <text x="346" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每个用例独立报告</text>

      <line x1="418" y1="135" x2="518" y2="135" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="518" y="92" width="212" height="86" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="624" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">断言层</text>
      <text x="624" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">t.Helper() 指向真实报错行</text>
      <text x="624" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">require 失败即停，assert 继续收集问题</text>

      <text x="380" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这套模式的价值在于低重复和高可扩展，而不是“看起来像社区范式”本身</text>
    </svg>

    <svg
      v-else-if="kind === 'mock-boundary'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mock 边界图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Mock 的边界应该卡在“外部依赖”上，而不是把业务内部每一层都假掉</text>

      <rect x="46" y="86" width="138" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="115" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">service under test</text>
      <text x="115" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">依赖接口，不依赖实现</text>

      <line x1="184" y1="116" x2="292" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="292" y="76" width="176" height="80" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">UserRepository interface</text>
      <text x="380" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">FindByID / Create</text>
      <text x="380" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消费方定义它</text>

      <line x1="468" y1="116" x2="566" y2="98" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="468" y1="116" x2="566" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="76" width="150" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="641" y="96" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">真实 repo</text>
      <text x="641" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">DB / RPC / MQ</text>
      <rect x="566" y="124" width="150" height="44" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="641" y="144" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">mock repo</text>
      <text x="641" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">手写 / testify / gomock</text>

      <text x="380" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">手写 mock 适合简单接口；需要校验调用次数、顺序、参数匹配时，再上 gomock 或 testify/mock</text>
    </svg>

    <svg
      v-else-if="kind === 'integration-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="集成测试生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">集成测试的成本高，所以要把环境准备、数据清理、执行和销毁压进一条稳定生命周期里</text>

      <rect x="34" y="96" width="112" height="46" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">TestMain</text>
      <text x="90" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">setup</text>

      <line x1="146" y1="119" x2="238" y2="119" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="238" y="76" width="146" height="86" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="311" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">真实依赖</text>
      <text x="311" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本地测试 DB</text>
      <text x="311" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或 Testcontainers 容器</text>
      <text x="311" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">run migrations</text>

      <line x1="384" y1="119" x2="476" y2="119" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="476" y="76" width="150" height="86" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="551" y="98" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">each test</text>
      <text x="551" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">clean table</text>
      <text x="551" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">执行真实 SQL / HTTP / repo</text>
      <text x="551" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">断言协作结果</text>

      <line x1="626" y1="119" x2="718" y2="119" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="718" y="96" width="16" height="46" rx="4" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="708" y="88" text-anchor="end" font-size="9" fill="var(--d-warn-text)">teardown</text>

      <text x="380" y="208" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`-short` 和 build tags 用来把“快反馈单测”和“慢但真实的集成测试”拆开，避免开发期每次都背完整成本</text>
    </svg>

    <svg
      v-else-if="kind === 'benchmark-reading'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Benchmark 指标图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Benchmark 不只是看快慢，还要看分配；真正做前后对比时要用 benchstat，而不是盯单次结果</text>

      <rect x="36" y="82" width="688" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="108" text-anchor="middle" font-size="10" fill="var(--d-text)">BenchmarkConcatWithBuilder-8   5000   300000 ns/op   500000 B/op   99 allocs/op</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">N 次迭代 | 每次耗时 | 每次分配字节数 | 每次分配次数</text>

      <rect x="72" y="182" width="180" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="162" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">b.ResetTimer()</text>
      <text x="162" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">排除初始化成本</text>

      <rect x="290" y="182" width="180" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">b.ReportAllocs()</text>
      <text x="380" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">发现 GC 压力来源</text>

      <rect x="508" y="182" width="180" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="598" y="202" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">benchstat old.txt new.txt</text>
      <text x="598" y="218" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">多次采样后再比较</text>
    </svg>

    <svg
      v-else-if="kind === 'ci-pipeline'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CI/CD 流水线图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CI/CD 的重点是把质量门禁排成一条流水线，让失败尽早暴露，发布尽量自动化</text>

      <rect x="28" y="104" width="92" height="46" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="74" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">lint</text>
      <text x="74" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">gofmt / lints</text>

      <line x1="120" y1="127" x2="212" y2="127" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="212" y="92" width="112" height="70" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="268" y="114" text-anchor="middle" font-size="10" fill="var(--d-text)">test</text>
      <text x="268" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">unit / integration</text>
      <text x="268" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">-race / coverage</text>

      <line x1="324" y1="127" x2="416" y2="127" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="416" y="104" width="92" height="46" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="462" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">build</text>
      <text x="462" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">二进制 / Docker</text>

      <line x1="508" y1="127" x2="600" y2="127" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="600" y="104" width="132" height="46" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="666" y="124" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">release</text>
      <text x="666" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">tag -> GoReleaser -> artifact</text>

      <rect x="224" y="196" width="312" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="216" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">前一阶段失败就停止后续阶段。越早拦截，越省 CI 时间，也越快给开发者反馈</text>
    </svg>
  </DiagramFrame>
</template>
