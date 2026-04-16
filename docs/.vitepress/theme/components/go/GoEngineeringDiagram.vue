<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'project-layout'
  | 'go-mod-lifecycle'
  | 'flag-parse-flow'
  | 'expvar-http-flow'
  | 'buildinfo-read-flow'
  | 'fstest-mapfs'
  | 'os-user-backends'
  | 'cgo-call-bridge'
  | 'cobra-viper-flow'
  | 'go-generate-pipeline'
  | 'slog-pipeline'
  | 'os-file-open'
  | 'exec-cmd-lifecycle'
  | 'signal-notify-flow'
  | 'log-output-flow'
  | 'config-priority'
  | 'error-code-system'
  | 'middleware-stack'
  | 'code-style-principles'
  | 'unit-test-patterns'
  | 'testing-run-flow'
  | 'mock-boundary'
  | 'integration-lifecycle'
  | 'benchmark-reading'
  | 'fuzz-lifecycle'
  | 'ci-pipeline'
  | 'prometheus-scrape-flow'
  | 'zapcore-pipeline'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'project-layout': '760px',
  'go-mod-lifecycle': '760px',
  'flag-parse-flow': '760px',
  'expvar-http-flow': '760px',
  'buildinfo-read-flow': '760px',
  'fstest-mapfs': '760px',
  'os-user-backends': '760px',
  'cgo-call-bridge': '760px',
  'cobra-viper-flow': '760px',
  'go-generate-pipeline': '760px',
  'slog-pipeline': '760px',
  'os-file-open': '760px',
  'exec-cmd-lifecycle': '760px',
  'signal-notify-flow': '760px',
  'log-output-flow': '760px',
  'config-priority': '760px',
  'error-code-system': '760px',
  'middleware-stack': '760px',
  'code-style-principles': '760px',
  'unit-test-patterns': '760px',
  'testing-run-flow': '760px',
  'mock-boundary': '760px',
  'integration-lifecycle': '760px',
  'benchmark-reading': '760px',
  'fuzz-lifecycle': '760px',
  'ci-pipeline': '760px',
  'prometheus-scrape-flow': '760px',
  'zapcore-pipeline': '760px',
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
      v-else-if="kind === 'flag-parse-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="flag 解析流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">flag 的主线是：先把所有定义注册进 formal，再按顺序扫描参数，把出现过的项记进 actual，剩下的留给位置参数或子命令</text>

      <rect x="24" y="94" width="124" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">os.Args[1:]</text>
      <text x="86" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">-v -port=8080 file</text>

      <line x1="148" y1="118" x2="242" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="242" y="74" width="156" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="320" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">FlagSet</text>
      <text x="320" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">formal: 所有已定义 flag</text>
      <text x="320" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">parseOne() 逐个消费参数</text>
      <text x="320" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">bool flag 可直接设 true</text>

      <line x1="398" y1="118" x2="494" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="494" y="62" width="136" height="112" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="562" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Value.Set(string)</text>
      <text x="562" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">String / Int / Bool</text>
      <text x="562" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Duration / TextVar</text>
      <text x="562" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自定义 Value</text>
      <text x="562" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">类型转换失败则报错</text>

      <line x1="630" y1="118" x2="726" y2="86" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="630" y1="118" x2="726" y2="150" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="614" y="64" width="122" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="675" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">actual</text>
      <text x="675" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">本次命令里出现过的 flag</text>
      <rect x="614" y="132" width="122" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="675" y="152" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">args</text>
      <text x="675" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">非 flag 参数或 `--` 之后的部分</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">子命令模式本质上只是为每个命令各自建一个 FlagSet，再把分发后的参数切片交给它继续解析</text>
    </svg>

    <svg
      v-else-if="kind === 'expvar-http-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="expvar HTTP 暴露流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">expvar 的关键是把进程内变量挂进全局注册表，再通过 `/debug/vars` 按 JSON 一次性导出来</text>

      <rect x="24" y="92" width="138" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="93" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">业务代码</text>
      <text x="93" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewInt / NewMap / Publish(Func)</text>

      <line x1="162" y1="120" x2="258" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="72" width="154" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="335" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">expvar registry</text>
      <text x="335" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">vars sync.Map</text>
      <text x="335" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">varKeys 保持稳定输出顺序</text>
      <text x="335" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内置 cmdline / memstats</text>

      <line x1="412" y1="120" x2="510" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="510" y="72" width="136" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="578" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">/debug/vars</text>
      <text x="578" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">import _ &quot;expvar&quot;</text>
      <text x="578" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">handler 遍历 Do()</text>
      <text x="578" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">每个 Var.String() 输出 JSON</text>

      <line x1="646" y1="120" x2="736" y2="88" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="646" y1="120" x2="736" y2="152" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="618" y="66" width="118" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="677" y="86" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">curl / 调试脚本</text>
      <text x="677" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">直接看进程内部状态</text>
      <rect x="618" y="134" width="118" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="677" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">轻量观测</text>
      <text x="677" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">不是替代 Prometheus 的多维指标系统</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Int/Float 适合主动累计，Func 适合请求时再现算；两者都只是 `/debug/vars` 输出源，不带拉取频率和告警语义</text>
    </svg>

    <svg
      v-else-if="kind === 'buildinfo-read-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="debug/buildinfo 读取流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">buildinfo 的主线是：链接器把版本和 VCS 信息写进二进制，运行时或离线工具再把它读出来做版本暴露和制品审计</text>

      <rect x="28" y="88" width="132" height="56" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="94" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">go build</text>
      <text x="94" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">module + deps + vcs.*</text>

      <line x1="160" y1="116" x2="260" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="260" y="68" width="170" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="345" y="90" text-anchor="middle" font-size="11" fill="var(--d-text)">binary + .go_buildinfo</text>
      <text x="345" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">GoVersion / Main / Deps</text>
      <text x="345" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">vcs.revision / vcs.time</text>
      <text x="345" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">vcs.modified / GOOS / GOARCH</text>

      <line x1="430" y1="116" x2="520" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="430" y1="116" x2="520" y2="150" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="520" y="62" width="108" height="48" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="574" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">runtime/debug</text>
      <text x="574" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ReadBuildInfo()</text>

      <rect x="520" y="126" width="108" height="48" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="574" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">debug/buildinfo</text>
      <text x="574" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ReadFile(path)</text>

      <line x1="628" y1="86" x2="730" y2="86" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="628" y1="150" x2="730" y2="150" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="610" y="62" width="126" height="48" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="673" y="82" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">版本端点</text>
      <text x="673" y="98" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">/version / healthz header</text>
      <rect x="610" y="126" width="126" height="48" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="673" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">制品审计</text>
      <text x="673" y="162" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">漏洞依赖扫描 / 集群排查</text>

      <text x="380" y="220" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以 buildinfo 解决的是“制品自己说明自己是谁”，而不是靠 CI 额外塞一组 ldflags 字符串去赌构建流程没漏掉</text>
    </svg>

    <svg
      v-else-if="kind === 'fstest-mapfs'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="testing/fstest MapFS 测试图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">MapFS 的价值是把“文件系统依赖”换成内存实现，让模板、配置、静态资源逻辑在测试里不碰磁盘也能完整验证</text>

      <rect x="24" y="86" width="150" height="78" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="99" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">fstest.MapFS</text>
      <text x="99" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">map[path]*MapFile</text>
      <text x="99" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Data / Mode / ModTime</text>
      <text x="99" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">目录可自动推断</text>

      <line x1="174" y1="125" x2="274" y2="125" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="274" y="74" width="178" height="102" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="363" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">被测代码只依赖 fs.FS</text>
      <text x="363" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">fs.ReadFile / fs.Sub / template.ParseFS</text>
      <text x="363" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">生产可换 embed.FS / os.DirFS</text>
      <text x="363" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">测试直接注入 MapFS</text>
      <text x="363" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">逻辑完全不改</text>

      <line x1="452" y1="125" x2="550" y2="125" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="550" y="86" width="92" height="78" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="596" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">fstest.TestFS</text>
      <text x="596" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">规范校验</text>
      <text x="596" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Open / Stat / ReadDir</text>
      <text x="596" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">路径和排序</text>

      <line x1="642" y1="125" x2="732" y2="125" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="622" y="194" width="114" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="679" y="215" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">零磁盘 I/O、易并行、跨平台稳定</text>

      <rect x="118" y="194" width="360" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="298" y="215" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">MapFS 适合验证“文件内容和路径语义”；要测真实权限、符号链接、大小写差异，还得回到 `t.TempDir()` + OS 文件系统</text>
    </svg>

    <svg
      v-else-if="kind === 'os-user-backends'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="os/user 后端选择图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">os/user 的关键不是 API 本身，而是查询到底走 libc/NSS 还是纯 Go 解析本地文件，这决定了它能不能看到 LDAP、NIS 或容器里的动态用户</text>

      <rect x="28" y="96" width="112" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="84" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">user.Current /</text>
      <text x="84" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Lookup / GroupIds</text>

      <line x1="140" y1="120" x2="244" y2="88" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="140" y1="120" x2="244" y2="152" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <rect x="244" y="62" width="172" height="58" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="330" y="84" text-anchor="middle" font-size="11" fill="var(--d-text)">CGO backend</text>
      <text x="330" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">getpwnam / getpwuid / NSS</text>
      <text x="330" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可见 LDAP / NIS / 企业目录</text>

      <rect x="244" y="136" width="172" height="58" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="330" y="158" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">pure Go backend</text>
      <text x="330" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">解析 /etc/passwd / /etc/group</text>
      <text x="330" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">CGO_ENABLED=0 或 -tags osusergo</text>

      <line x1="416" y1="91" x2="520" y2="91" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="416" y1="165" x2="520" y2="165" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="520" y="62" width="118" height="58" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="579" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">User / Group</text>
      <text x="579" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Uid / Gid / HomeDir</text>
      <text x="579" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">可能来自远程目录服务</text>

      <rect x="520" y="136" width="118" height="58" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="579" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">User / Group</text>
      <text x="579" y="174" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">只能看本地条目</text>
      <text x="579" y="190" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">容器缺失条目时会失败</text>

      <rect x="646" y="96" width="90" height="48" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="691" y="116" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">实战建议</text>
      <text x="691" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">只是判断 root 时直接用 os.Getuid()</text>

      <text x="380" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以 `os/user` 更适合做“展示和查询用户元信息”，不适合在启动主路径里当成一定可靠的权限判断基础设施</text>
    </svg>

    <svg
      v-else-if="kind === 'cgo-call-bridge'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CGO 调用桥接图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CGO 的核心代价不只是语法，而是每次都要跨 Go/C 边界：运行时让出调度、桥接参数、进入 C 世界，再安全地回到 Go</text>

      <rect x="22" y="96" width="118" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="81" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Go caller</text>
      <text x="81" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">C.add / C.sqlite3_*</text>

      <line x1="140" y1="121" x2="236" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="236" y="74" width="154" height="94" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="313" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">cgo generated wrapper</text>
      <text x="313" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">类型转换</text>
      <text x="313" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">unsafe.Pointer / C.int / *C.char</text>
      <text x="313" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调用 runtime.cgocall</text>

      <line x1="390" y1="121" x2="488" y2="121" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="488" y="66" width="136" height="110" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="556" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">runtime bridge</text>
      <text x="556" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">entersyscall / cgocall</text>
      <text x="556" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">让当前 G 脱离普通调度</text>
      <text x="556" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">防止把 M 长时间绑死</text>
      <text x="556" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回后 exitsyscall</text>

      <line x1="624" y1="121" x2="720" y2="121" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="622" y="96" width="114" height="50" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="679" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">C function</text>
      <text x="679" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">malloc / free / callback</text>

      <rect x="122" y="198" width="516" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="219" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">边界规则：C 内存要手动释放；C 不能长期持有 Go 指针；频繁小调用要尽量批量化，否则调度与边界开销会盖过业务逻辑</text>
    </svg>

    <svg
      v-else-if="kind === 'cobra-viper-flow'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="cobra 与 viper 流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">cobra 负责“命令树和执行顺序”，viper 负责“把 flag、环境变量、配置文件合并成最终配置”</text>

      <rect x="24" y="96" width="116" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="82" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">rootCmd.Execute()</text>
      <text x="82" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">os.Args</text>

      <line x1="140" y1="121" x2="234" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="234" y="66" width="166" height="110" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="317" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">cobra command tree</text>
      <text x="317" y="106" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">匹配 root / serve / migrate ...</text>
      <text x="317" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">PersistentPreRunE</text>
      <text x="317" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">PreRunE -> RunE -> PostRunE</text>
      <text x="317" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">PersistentPostRunE</text>

      <line x1="400" y1="121" x2="496" y2="121" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="496" y="66" width="150" height="110" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="571" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">viper bindings</text>
      <text x="571" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">BindPFlag</text>
      <text x="571" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">AutomaticEnv + key replacer</text>
      <text x="571" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ReadInConfig + SetDefault</text>
      <text x="571" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Unmarshal 到结构体</text>

      <line x1="646" y1="121" x2="736" y2="121" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="618" y="198" width="118" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="677" y="219" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">typed Config + business run</text>

      <rect x="120" y="198" width="420" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="330" y="219" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">command tree 和配置优先级要分开理解：cobra 决定“执行谁”，viper 决定“值从哪来”，混在一起最容易让 CLI 变成隐式状态机</text>
    </svg>

    <svg
      v-else-if="kind === 'go-generate-pipeline'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="go generate 流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">go generate 本质上是“扫描注释并调用外部工具”，它不参与编译依赖分析，也不替你保证生成结果最新</text>

      <rect x="26" y="94" width="124" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="88" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">go generate ./...</text>
      <text x="88" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">遍历包</text>

      <line x1="150" y1="118" x2="246" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="246" y="72" width="166" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="329" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">扫描 .go 文件</text>
      <text x="329" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">找 `//go:generate ...`</text>
      <text x="329" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">注入 GOFILE / GOPACKAGE 等环境变量</text>
      <text x="329" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">在包目录执行</text>

      <line x1="412" y1="118" x2="508" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="508" y="62" width="132" height="112" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="574" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">os/exec tools</text>
      <text x="574" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">stringer</text>
      <text x="574" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">mockgen / protoc / sqlc</text>
      <text x="574" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自定义生成器</text>
      <text x="574" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">输出 .go / 资源文件</text>

      <line x1="640" y1="118" x2="734" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="612" y="198" width="122" height="34" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="673" y="219" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">生成文件进仓库 + CI 检查 diff</text>

      <rect x="124" y="198" width="380" height="34" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="314" y="219" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">它不是 shell，也不是自动增量构建系统；忘了跑 generate，编译照样可能成功，但生成代码会悄悄过期</text>
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
      v-else-if="kind === 'os-file-open'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="os.File 打开流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">os.Open 的主线是：系统调用拿到 fd，再包成 poll.FD 和 *os.File，Close 才是常规释放路径，finalizer 只是兜底</text>

      <rect x="24" y="94" width="124" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="86" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">os.Open /</text>
      <text x="86" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">os.OpenFile</text>

      <line x1="148" y1="118" x2="242" y2="118" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="242" y="84" width="160" height="68" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="322" y="106" text-anchor="middle" font-size="11" fill="var(--d-text)">syscall.Open</text>
      <text x="322" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">flag | O_CLOEXEC</text>
      <text x="322" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">返回真实 fd</text>

      <line x1="402" y1="118" x2="496" y2="118" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="496" y="72" width="148" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="570" y="94" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">newFile + poll.FD.Init</text>
      <text x="570" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">记录 name / mode</text>
      <text x="570" y="128" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">初始化 pollDesc</text>
      <text x="570" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">让阻塞 I/O 可挂起 G</text>

      <line x1="644" y1="118" x2="736" y2="118" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="612" y="186" width="124" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="674" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">*os.File</text>
      <text x="674" y="222" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Read / Write / Close</text>

      <line x1="674" y1="164" x2="674" y2="186" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <rect x="110" y="186" width="230" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="225" y="206" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">正常释放：defer f.Close()</text>
      <text x="225" y="222" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">finalizer 触发时机不确定，不能拿来代替 Close</text>

      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">看到 fd 泄漏时，首先查遗漏的 Close，不要指望 GC 替你回收文件描述符</text>
    </svg>

    <svg
      v-else-if="kind === 'exec-cmd-lifecycle'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="os/exec Cmd 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">exec.Cmd 的关键是把“进程生命周期”和“管道复制 goroutine”绑在一起：Start 负责启动，Wait 负责收尾</text>

      <rect x="24" y="96" width="118" height="50" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">exec.Command</text>
      <text x="83" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">组装 Path / Args</text>

      <line x1="142" y1="121" x2="236" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="236" y="82" width="154" height="78" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="313" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">Start()</text>
      <text x="313" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">os.StartProcess</text>
      <text x="313" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">构造 0/1/2 号 fd 重定向</text>
      <text x="313" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">填充 Process</text>

      <line x1="390" y1="121" x2="486" y2="121" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="486" y="66" width="142" height="110" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="557" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">I/O goroutines</text>
      <text x="557" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">stdin copy</text>
      <text x="557" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">stdout copy</text>
      <text x="557" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">stderr copy</text>
      <text x="557" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Pipe 用完要 Close 送 EOF</text>

      <line x1="628" y1="121" x2="720" y2="121" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="596" y="194" width="140" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="666" y="214" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Wait()</text>
      <text x="666" y="230" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">等子进程 + 等拷贝 goroutine + 关管道</text>

      <line x1="666" y1="176" x2="666" y2="194" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <rect x="154" y="194" width="236" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="272" y="214" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">CommandContext 取消路径</text>
      <text x="272" y="230" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ctx 超时后终止子进程；Go 1.20+ 可用 WaitDelay 留一点优雅退出时间</text>
    </svg>

    <svg
      v-else-if="kind === 'signal-notify-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="os/signal 通知流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">os/signal 的主线是：runtime 先接住信号，再按订阅关系把信号非阻塞地分发给 channel 或 NotifyContext</text>

      <rect x="28" y="96" width="104" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="80" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Kernel</text>
      <text x="80" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">SIGTERM / HUP</text>

      <line x1="132" y1="120" x2="222" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="222" y="84" width="150" height="72" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="297" y="106" text-anchor="middle" font-size="11" fill="var(--d-text)">runtime signal handler</text>
      <text x="297" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">enableSignal 之后开始捕获</text>
      <text x="297" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">交给 os/signal.process</text>

      <line x1="372" y1="120" x2="468" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="468" y="74" width="142" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="539" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">handlers map</text>
      <text x="539" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">signal -> channels</text>
      <text x="539" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">ref 计数决定是否继续捕获</text>
      <text x="539" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">满缓冲时直接丢弃，不阻塞</text>

      <line x1="610" y1="120" x2="706" y2="88" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="610" y1="120" x2="706" y2="152" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="618" y="66" width="118" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="677" y="86" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">signal.Notify</text>
      <text x="677" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">缓冲 channel</text>
      <rect x="618" y="134" width="118" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="677" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">NotifyContext</text>
      <text x="677" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">收到后 cancel()</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">要么自己 Stop(channel)，要么让 NotifyContext 的 cancel 回收订阅；缓冲通常给 1 就够用</text>
    </svg>

    <svg
      v-else-if="kind === 'log-output-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="log.Logger 输出流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">log.Logger 的关键不是“功能多”，而是持锁复用缓冲、一次性写出，尽量把每条日志压成一次 out.Write</text>

      <rect x="24" y="96" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="83" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Print / Printf /</text>
      <text x="83" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Println</text>

      <line x1="142" y1="120" x2="236" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="236" y="76" width="156" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="314" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">Logger.Output</text>
      <text x="314" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">mu.Lock()</text>
      <text x="314" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">buf = buf[:0] 复用</text>
      <text x="314" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保证并发安全</text>

      <line x1="392" y1="120" x2="486" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="486" y="76" width="148" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="560" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">formatHeader</text>
      <text x="560" y="116" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">prefix / date / time</text>
      <text x="560" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">shortfile / longfile</text>
      <text x="560" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自动补换行</text>

      <line x1="634" y1="120" x2="726" y2="120" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="614" y="188" width="122" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="675" y="208" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">out.Write(buf)</text>
      <text x="675" y="224" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">尽量一次系统调用</text>

      <line x1="675" y1="164" x2="675" y2="188" stroke="var(--d-rv-a-border)" stroke-width="1.2" />

      <rect x="128" y="188" width="250" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="253" y="208" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Fatal / Panic 是分叉行为</text>
      <text x="253" y="224" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">写完日志后分别走 os.Exit(1) 或 panic(s)</text>
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
      v-else-if="kind === 'testing-run-flow'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="testing t.Run 执行流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">t.Run 的关键是父测试和子测试共享一棵执行树：同步子测试直接跑，并行子测试先挂起，等父测试同步部分结束后再一起跑</text>

      <rect x="28" y="98" width="118" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">parent T</text>
      <text x="87" y="134" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">for _, tc := range ...</text>

      <line x1="146" y1="122" x2="240" y2="122" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="240" y="84" width="144" height="76" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="312" y="106" text-anchor="middle" font-size="11" fill="var(--d-text)">t.Run(name, fn)</text>
      <text x="312" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">创建 child T</text>
      <text x="312" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">记录 parent / cleanup / output</text>

      <line x1="384" y1="122" x2="486" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="384" y1="122" x2="486" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="486" y="62" width="120" height="54" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="546" y="84" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">同步子测试</text>
      <text x="546" y="100" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">当前 goroutine 直接执行</text>

      <rect x="486" y="132" width="120" height="54" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="546" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">t.Parallel()</text>
      <text x="546" y="170" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">先挂起，进入并行队列</text>

      <line x1="606" y1="159" x2="716" y2="159" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="616" y="196" width="120" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="676" y="216" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">父测试同步代码结束后</text>
      <text x="676" y="232" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">统一等待并行子测试 + Cleanup</text>

      <text x="380" y="238" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">所以并行子测试里最容易踩坑的是共享循环变量和共享可变状态，而不是 t.Run 这个 API 本身</text>
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
      v-else-if="kind === 'fuzz-lifecycle'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go Fuzz 生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Fuzz 的主线是：种子语料起步，变异输入扩大覆盖率，发现崩溃或有价值样本后落到语料库里复现</text>

      <rect x="24" y="94" width="132" height="52" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="90" y="114" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">f.Add()</text>
      <text x="90" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">seed corpus</text>

      <line x1="156" y1="120" x2="248" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="82" width="154" height="76" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="325" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">mutation engine</text>
      <text x="325" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">翻转 / 截断 / 追加 / 组合</text>
      <text x="325" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">优先保留增加覆盖率的输入</text>

      <line x1="402" y1="120" x2="494" y2="120" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="494" y="82" width="132" height="76" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="560" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Fuzz func</text>
      <text x="560" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Unmarshal / Parse /</text>
      <text x="560" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">业务不变量断言</text>

      <line x1="626" y1="120" x2="714" y2="88" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <line x1="626" y1="120" x2="714" y2="152" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="620" y="66" width="116" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="678" y="86" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">有价值输入</text>
      <text x="678" y="102" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">加入 corpus</text>
      <rect x="620" y="134" width="116" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="678" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">panic / crash</text>
      <text x="678" y="170" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">落盘到 testdata/fuzz</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">日常 CI 常只跑种子；长时间 fuzz 搜索通常单独跑，并把新语料提交回仓库，保证问题可复现</text>
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

    <svg
      v-else-if="kind === 'prometheus-scrape-flow'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Prometheus 抓取流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Prometheus Go 客户端的关键不是“把值存起来”，而是把指标注册到 registry，再在抓取瞬间统一编码成 exposition 格式给 Prometheus 拉走</text>

      <rect x="28" y="84" width="164" height="92" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="110" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">应用代码</text>
      <text x="110" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Counter.Inc / Gauge.Set</text>
      <text x="110" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Histogram.Observe</text>
      <text x="110" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Collector.Collect()</text>

      <line x1="192" y1="130" x2="300" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="300" y="62" width="174" height="136" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="387" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Registry + promhttp.Handler</text>
      <text x="387" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">注册 Desc / Metric</text>
      <text x="387" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">抓取时 Gather()</text>
      <text x="387" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">编码为 /metrics 文本格式</text>
      <text x="387" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">标签决定时序数量</text>
      <text x="387" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">高基数标签会直接把成本拉爆</text>

      <line x1="474" y1="130" x2="582" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="582" y="84" width="150" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="657" y="106" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Prometheus server</text>
      <text x="657" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">定时 GET /metrics</text>
      <text x="657" y="140" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">写入 TSDB</text>
      <text x="657" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">后续再做查询和告警</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此 Counter / Gauge / Histogram 的差异体现在导出形态和查询方式上，而不是“采集入口不同”；真正先炸掉系统的往往是标签设计而不是指标类型</text>
    </svg>

    <svg
      v-else-if="kind === 'zapcore-pipeline'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="zapcore 日志流水线图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`zap` 的核心不是 Logger 壳子，而是 `zapcore.Core` 把级别判断、编码和输出目标拼成一条高性能流水线</text>

      <rect x="28" y="96" width="128" height="60" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="118" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Logger / Sugar</text>
      <text x="92" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Info(...fields)</text>

      <line x1="156" y1="126" x2="258" y2="126" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="64" width="178" height="124" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="347" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">zapcore.Core</text>
      <text x="347" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Check(level) 先判是否值得记</text>
      <text x="347" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">With(...) 预挂固定字段</text>
      <text x="347" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Write(entry, fields) 才真正落日志</text>
      <text x="347" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">NewTee 可把多条 Core 合成一条</text>
      <text x="347" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">AtomicLevel 运行时可调级别</text>

      <line x1="436" y1="126" x2="546" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="436" y1="126" x2="546" y2="126" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="436" y1="126" x2="546" y2="164" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="546" y="68" width="186" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="639" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Encoder：JSON / Console，把 Entry + Fields 编成字节</text>

      <rect x="546" y="110" width="186" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="639" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">WriteSyncer：stdout / stderr / 文件 / lumberjack</text>

      <rect x="546" y="152" width="186" height="40" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="639" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Error+ 走堆栈、Fatal/Panic 写完后再分叉退出</text>

      <text x="380" y="236" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">性能差异主要来自字段构造和编码路径：`Logger` 更偏零分配字段流，`SugaredLogger` 则拿易用性换少量额外开销</text>
    </svg>
  </DiagramFrame>
</template>
