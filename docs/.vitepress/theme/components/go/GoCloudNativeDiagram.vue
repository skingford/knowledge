<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'multistage-docker'
  | 'signal-lifecycle'
  | 'kubernetes-workload'
  | 'twelve-factor'
  | 'container-debugging'
  | 'config-sources'
  | 'compose-dev'
  | 'cloud-ci-cd'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'multistage-docker': '760px',
  'signal-lifecycle': '760px',
  'kubernetes-workload': '760px',
  'twelve-factor': '760px',
  'container-debugging': '760px',
  'config-sources': '760px',
  'compose-dev': '760px',
  'cloud-ci-cd': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'multistage-docker'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="多阶段 Docker 构建图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">多阶段构建的核心是把“编译环境”和“运行环境”切开，让最终镜像只带二进制和最少的运行依赖</text>
      <rect x="34" y="74" width="176" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="122" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">builder stage</text>
      <text x="122" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">golang image</text>
      <text x="122" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">下载依赖 / 编译 / test</text>
      <text x="122" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">输出静态二进制</text>
      <line x1="210" y1="122" x2="322" y2="122" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="322" y="74" width="116" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">COPY --from</text>
      <text x="380" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只复制 binary</text>
      <text x="380" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">和必要证书</text>
      <text x="380" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不复制源码</text>
      <line x1="438" y1="122" x2="550" y2="122" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="550" y="74" width="176" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="638" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">runtime stage</text>
      <text x="638" y="114" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">distroless / scratch / alpine</text>
      <text x="638" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">镜像更小，攻击面更小</text>
      <text x="638" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">启动更快</text>
      <text x="380" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">生产镜像里最不该留下的是编译工具链、源码和调试垃圾文件</text>
    </svg>

    <svg
      v-else-if="kind === 'signal-lifecycle'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="信号生命周期图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">信号处理的关键不是收到 SIGTERM 本身，而是把收到信号后的状态变更、取消上下文和资源释放都串起来</text>
      <rect x="48" y="86" width="126" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="111" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">OS / 容器</text>
      <text x="111" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">SIGTERM / SIGHUP</text>
      <line x1="174" y1="110" x2="292" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="292" y="64" width="176" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">signal.Notify / NotifyContext</text>
      <text x="380" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">接收退出信号</text>
      <text x="380" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">cancel context</text>
      <text x="380" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">触发重载或关闭流程</text>
      <line x1="468" y1="110" x2="584" y2="86" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="468" y1="110" x2="584" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="584" y="68" width="144" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="656" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">SIGTERM: 进入优雅关闭</text>
      <rect x="584" y="120" width="144" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="656" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">SIGHUP: 重载配置或日志</text>
      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">容器里 PID 1、信号转发和 shutdown timeout 都会影响结果，不能只在本地测试里看起来“能退出”</text>
    </svg>

    <svg
      v-else-if="kind === 'kubernetes-workload'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Kubernetes 工作负载图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Kubernetes 部署配置的核心，是把副本、探针、资源限制和暴露方式一起定义成可重复发布的工作负载</text>
      <rect x="46" y="78" width="182" height="108" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="137" y="100" text-anchor="middle" font-size="11" fill="var(--d-text)">Deployment</text>
      <text x="137" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">replicas</text>
      <text x="137" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">resources requests / limits</text>
      <text x="137" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">readiness / liveness</text>
      <text x="137" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">rolling update strategy</text>
      <line x1="228" y1="132" x2="350" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="350" y="92" width="120" height="80" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="410" y="114" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Pods</text>
      <text x="410" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">运行 Go 容器</text>
      <text x="410" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">版本可滚动替换</text>
      <line x1="470" y1="132" x2="592" y2="132" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="592" y="78" width="122" height="108" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="653" y="100" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Service</text>
      <text x="653" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">稳定入口</text>
      <text x="653" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">selector 绑定 Pod</text>
      <text x="653" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">ClusterIP / LB / Ingress</text>
      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">YAML 的价值不只是能跑起来，而是让部署参数、资源约束和运维策略都可审计、可复现</text>
    </svg>

    <svg
      v-else-if="kind === 'twelve-factor'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="12-Factor 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">12-Factor 在 Go 里的落点不是背原则，而是把配置、进程、日志和环境差异都做成可替换、可自动化的约定</text>
      <rect x="34" y="64" width="148" height="120" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="108" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Config</text>
      <text x="108" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">环境变量</text>
      <text x="108" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">而不是写死配置文件路径</text>
      <rect x="214" y="64" width="148" height="120" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="288" y="88" text-anchor="middle" font-size="11" fill="var(--d-text)">Processes</text>
      <text x="288" y="108" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">无状态</text>
      <text x="288" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">水平扩展</text>
      <rect x="394" y="64" width="148" height="120" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="468" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Logs</text>
      <text x="468" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">stdout/stderr</text>
      <text x="468" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">交给平台收集</text>
      <rect x="574" y="64" width="148" height="120" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="648" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">Parity</text>
      <text x="648" y="108" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">开发 / 测试 / 生产尽量一致</text>
      <text x="648" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">不要三套运行逻辑</text>
      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最常见的问题不是“不懂 12-Factor”，而是配置和运行时假设太依赖本地环境，导致一上云就变形</text>
    </svg>

    <svg
      v-else-if="kind === 'container-debugging'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="容器内调试图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">容器内调试的关键不是把工具全塞进生产镜像，而是把 pprof、日志和可选调试层分开设计</text>
      <rect x="28" y="86" width="128" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="92" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">生产容器</text>
      <text x="92" y="127" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">最小化镜像</text>
      <line x1="156" y1="110" x2="268" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="268" y="64" width="198" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="367" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">调试入口</text>
      <text x="367" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">暴露 pprof 独立端口</text>
      <text x="367" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">kubectl port-forward / ssh tunnel</text>
      <text x="367" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">必要时启用可选调试层</text>
      <line x1="466" y1="110" x2="576" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="466" y1="110" x2="576" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="576" y="68" width="150" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="651" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">正常场景：远程抓 pprof</text>
      <rect x="576" y="120" width="150" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="651" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">极端场景：带调试工具的专用镜像</text>
      <text x="380" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">默认生产镜像应最小化，调试能力通过旁路入口和单独镜像补，不要长期把 shell 和调试包留在生产里</text>
    </svg>

    <svg
      v-else-if="kind === 'config-sources'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="配置源图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">容器环境里的配置管理重点不是“用了 viper”，而是要把默认值、文件、环境变量和热更边界的优先级讲清楚</text>
      <rect x="32" y="96" width="96" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="80" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">defaults</text>
      <line x1="128" y1="116" x2="208" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="208" y="96" width="96" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="256" y="120" text-anchor="middle" font-size="9" fill="var(--d-text)">config file</text>
      <line x1="304" y1="116" x2="384" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="384" y="96" width="116" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="442" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">env overrides</text>
      <line x1="500" y1="116" x2="580" y2="116" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="580" y="96" width="148" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="654" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">validated runtime config</text>
      <rect x="254" y="164" width="252" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="186" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">端口、监听地址这类启动期配置通常不能热更；连接池、日志级别等可以</text>
    </svg>

    <svg
      v-else-if="kind === 'compose-dev'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Docker Compose 开发环境图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Compose 在 Go 项目里的价值是快速拼出一致的本地依赖环境，不是把它原样搬进生产</text>
      <rect x="48" y="74" width="160" height="104" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="128" y="96" text-anchor="middle" font-size="11" fill="var(--d-text)">go-app</text>
      <text x="128" y="114" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Dockerfile.dev</text>
      <text x="128" y="130" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">air 热重载</text>
      <text x="128" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">挂载源码目录</text>
      <line x1="208" y1="126" x2="320" y2="98" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="208" y1="126" x2="320" y2="154" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="320" y="74" width="120" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="99" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">postgres / mysql</text>
      <rect x="320" y="134" width="120" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="159" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">redis / mq / 其他依赖</text>
      <line x1="440" y1="126" x2="566" y2="126" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="566" y="74" width="146" height="104" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="639" y="96" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">注意</text>
      <text x="639" y="114" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">depends_on + healthcheck</text>
      <text x="639" y="130" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">命名卷保留数据</text>
      <text x="639" y="146" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">开发文件别用于生产</text>
    </svg>

    <svg
      v-else-if="kind === 'cloud-ci-cd'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="云原生 CI/CD 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">云原生 CI/CD 的关键是把测试、构建、镜像发布和安全扫描串成同一条流水线，而不是靠手工发布补洞</text>
      <rect x="26" y="96" width="96" height="40" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="74" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">PR / push</text>
      <line x1="122" y1="116" x2="214" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="214" y="96" width="96" height="40" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="262" y="120" text-anchor="middle" font-size="9" fill="var(--d-text)">test / race / lint</text>
      <line x1="310" y1="116" x2="402" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="402" y="96" width="96" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="450" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">docker buildx</text>
      <line x1="498" y1="116" x2="590" y2="116" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="590" y="96" width="136" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="658" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">push image + versioned tags</text>
      <rect x="214" y="164" width="296" height="36" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="362" y="186" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">并行插入：gosec / 依赖扫描 / 镜像扫描，失败即阻断发布</text>
    </svg>
  </DiagramFrame>
</template>
