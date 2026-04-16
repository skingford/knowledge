<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'

type DiagramKind =
  | 'overview'
  | 'functional-options'
  | 'builder'
  | 'dependency-injection'
  | 'layered-architecture'
  | 'strategy'
  | 'singleton'
  | 'table-driven-tests'
  | 'iterator-range-func'
  | 'middleware-decorator'
  | 'error-types'
  | 'math-big-layout'
  | 'bits-intrinsics'
  | 'rand-source-modes'
  | 'crc32-update-flow'
  | 'unique-interning'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  overview: '760px',
  'functional-options': '760px',
  builder: '760px',
  'dependency-injection': '760px',
  'layered-architecture': '760px',
  strategy: '760px',
  singleton: '760px',
  'table-driven-tests': '760px',
  'iterator-range-func': '760px',
  'middleware-decorator': '760px',
  'error-types': '760px',
  'math-big-layout': '760px',
  'bits-intrinsics': '760px',
  'rand-source-modes': '760px',
  'crc32-update-flow': '760px',
  'unique-interning': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'overview'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Go 进阶专题概览图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">进阶专题主线：先学抽象与模式，再补安全与交付，最后掌握代码生成和工具链自动化</text>

      <rect x="22" y="44" width="172" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="108" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">设计与抽象</text>
      <text x="108" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Options / Builder</text>
      <text x="108" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">DI / 分层 / Strategy</text>
      <text x="108" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Singleton / Middleware</text>
      <text x="108" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先学怎么把代码组织对</text>

      <rect x="206" y="44" width="172" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="292" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">安全</text>
      <text x="292" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">密码 / JWT / TLS</text>
      <text x="292" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">SQLi / XSS / CSRF</text>
      <text x="292" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Secret / gosec / 防暴力破解</text>
      <text x="292" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">再学怎么把系统做安全</text>

      <rect x="390" y="44" width="172" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="476" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">容器与交付</text>
      <text x="476" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">Docker / K8s / 12-Factor</text>
      <text x="476" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">信号 / 健康检查 / 调试</text>
      <text x="476" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">Compose / CI/CD</text>
      <text x="476" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">把代码稳定交付出去</text>

      <rect x="574" y="44" width="164" height="190" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="656" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">生成与工具链</text>
      <text x="656" y="98" text-anchor="middle" font-size="10" fill="var(--d-text)">go generate / stringer</text>
      <text x="656" y="118" text-anchor="middle" font-size="10" fill="var(--d-text)">wire / AST / template</text>
      <text x="656" y="138" text-anchor="middle" font-size="10" fill="var(--d-text)">embed / analyzer / build tags</text>
      <text x="656" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">最后提高自动化密度</text>
    </svg>

    <svg
      v-else-if="kind === 'functional-options'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Functional Options 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Functional Options 把“很多可选参数”拆成一个个配置函数，新增选项不需要改构造函数签名</text>

      <rect x="34" y="86" width="114" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="91" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">NewServer(...)</text>
      <text x="91" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">可变 Option 列表</text>

      <line x1="148" y1="108" x2="256" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="256" y="64" width="170" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="341" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Option funcs</text>
      <text x="341" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WithTimeout()</text>
      <text x="341" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WithTLS()</text>
      <text x="341" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">WithLogger()</text>

      <line x1="426" y1="108" x2="530" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="530" y="64" width="194" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="627" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Server config</text>
      <text x="627" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">默认值先初始化</text>
      <text x="627" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再依次应用 option</text>
      <text x="627" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">最后返回完整实例</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">适合参数多且会扩展的构造场景；如果对象很简单，直接传结构体或普通参数更直白</text>
    </svg>

    <svg
      v-else-if="kind === 'builder'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Builder 模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Builder 适合“构造过程本身有步骤感”的对象，让调用链按顺序逐步装配最终结果</text>

      <rect x="32" y="86" width="114" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="89" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">NewQueryBuilder()</text>
      <text x="89" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">空初始状态</text>

      <line x1="146" y1="108" x2="258" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="258" y="64" width="232" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="374" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">链式构造</text>
      <text x="374" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Select(...).Where(...)</text>
      <text x="374" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">OrderBy(...).Limit(...)</text>
      <text x="374" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每一步都修改内部状态</text>

      <line x1="490" y1="108" x2="594" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="594" y="64" width="132" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="660" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Build()</text>
      <text x="660" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">输出 SQL / Request</text>
      <text x="660" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">校验缺失字段</text>
      <text x="660" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">返回最终对象</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Builder 更适合步骤相关和状态相关的构造；但它通常不是线程安全的，不该被并发共享</text>
    </svg>

    <svg
      v-else-if="kind === 'dependency-injection'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="依赖注入图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 的依赖注入核心是显式构造依赖图，让 handler、service、repository 的关系在启动期就清楚可见</text>

      <rect x="48" y="86" width="146" height="104" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="121" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">main()</text>
      <text x="121" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">创建 DB / Redis / Logger</text>
      <text x="121" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">组装 Repository</text>
      <text x="121" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">组装 Service / Handler</text>

      <line x1="194" y1="138" x2="300" y2="138" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="300" y="72" width="158" height="132" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="379" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">依赖图</text>
      <text x="379" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Handler -> Service</text>
      <text x="379" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Service -> Repository</text>
      <text x="379" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Repository -> DB</text>
      <text x="379" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">每层只依赖下一层接口</text>
      <text x="379" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">测试时可注入 mock</text>

      <line x1="458" y1="138" x2="566" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="86" width="146" height="104" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="639" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">工具选择</text>
      <text x="639" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">手写组装：默认优先</text>
      <text x="639" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">wire：编译期生成</text>
      <text x="639" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">fx：运行时容器</text>

      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">依赖注入的价值不是“框架更高级”，而是依赖关系被显式化，初始化和测试都更可控</text>
    </svg>

    <svg
      v-else-if="kind === 'layered-architecture'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="分层架构图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Repository / Service / Handler 分层的核心，不是目录分三层，而是让职责边界稳定下来</text>

      <rect x="74" y="70" width="612" height="44" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="96" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">Handler: HTTP / gRPC 协议适配、参数解析、响应编码</text>

      <line x1="380" y1="114" x2="380" y2="134" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="74" y="134" width="612" height="44" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="160" text-anchor="middle" font-size="11" fill="var(--d-text)">Service: 业务规则、事务边界、跨资源编排</text>

      <line x1="380" y1="178" x2="380" y2="198" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="74" y="198" width="612" height="44" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="224" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Repository: DB / Cache / 外部资源访问细节</text>

      <text x="380" y="248" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">协议逻辑别落进 service，业务逻辑也别塞进 repository。真正的问题通常不是层数，而是跨层越界</text>
    </svg>

    <svg
      v-else-if="kind === 'strategy'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Strategy 模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Strategy 把可替换算法抽成统一接口，让调用方在运行时切换实现，而不是堆满 if/switch</text>

      <rect x="34" y="86" width="128" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="98" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">CheckoutService</text>
      <text x="98" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">持有 PaymentStrategy</text>

      <line x1="162" y1="110" x2="282" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="282" y="64" width="174" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="369" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">Strategy interface</text>
      <text x="369" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pay(order) error</text>
      <text x="369" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">也可以直接用 func 类型</text>
      <text x="369" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">前提是未来有扩展需求</text>

      <line x1="456" y1="110" x2="560" y2="88" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="456" y1="110" x2="560" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="560" y="68" width="164" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="642" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">AliPay / WeChatPay / CreditCard</text>
      <rect x="560" y="120" width="164" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="642" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">切换时不改上层调用代码</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果分支固定且永远只会有一两种实现，直接 switch 更简单，不必为了“模式感”硬抽接口</text>
    </svg>

    <svg
      v-else-if="kind === 'singleton'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Singleton 模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Singleton 在 Go 里最常见的安全实现是 `sync.Once`，重点不是“全局变量”，而是线程安全地只初始化一次</text>

      <rect x="42" y="86" width="128" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="106" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">多个 goroutine</text>
      <text x="106" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">调用 GetLogger()</text>

      <line x1="170" y1="110" x2="288" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="288" y="64" width="170" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="373" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">sync.Once.Do()</text>
      <text x="373" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">第一次执行 init()</text>
      <text x="373" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">后续直接返回已存在实例</text>
      <text x="373" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免并发重复创建</text>

      <line x1="458" y1="110" x2="566" y2="110" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="64" width="160" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="646" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">唯一实例</text>
      <text x="646" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">DB pool / logger / config</text>
      <text x="646" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">全局唯一且线程安全</text>
      <text x="646" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">但要小心测试隔离</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">单例常常让测试和复位更难，所以只在“确实全局唯一”的资源上使用，而不是把一切都做成全局对象</text>
    </svg>

    <svg
      v-else-if="kind === 'table-driven-tests'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Table-Driven Tests 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Table-Driven Tests 的价值是把“越来越多的输入输出组合”压成一张用例表，而不是一堆重复测试函数</text>

      <rect x="32" y="76" width="214" height="116" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="139" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">cases := []struct{...}</text>
      <text x="139" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">name</text>
      <text x="139" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">input</text>
      <text x="139" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">want</text>
      <text x="139" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">wantErr</text>

      <line x1="246" y1="134" x2="356" y2="134" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="356" y="76" width="154" height="116" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="433" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">for _, tc := range cases</text>
      <text x="433" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">t.Run(tc.name, ...)</text>
      <text x="433" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">执行目标函数</text>
      <text x="433" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">断言结果</text>
      <text x="433" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">必要时 t.Parallel()</text>

      <line x1="510" y1="134" x2="620" y2="134" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="620" y="90" width="108" height="88" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="674" y="112" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">扩展方式</text>
      <text x="674" y="130" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">加一行 case</text>
      <text x="674" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">而不是复制一份测试</text>

      <text x="380" y="212" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">这是 Go 测试里最稳的默认模式，但要注意循环变量捕获和并行子测试共享状态的问题</text>
    </svg>

    <svg
      v-else-if="kind === 'iterator-range-func'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Iterator 模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Go 1.23 的 range over func 把 Iterator 从“先构造切片”变成“边生成边消费”的惰性遍历</text>

      <rect x="34" y="86" width="146" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="107" y="106" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Iter(func(yield) bool)</text>
      <text x="107" y="122" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">按需生成下一个值</text>

      <line x1="180" y1="110" x2="300" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="300" y="64" width="168" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="384" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">for v := range iter()</text>
      <text x="384" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消费一个值</text>
      <text x="384" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">可提前 break</text>
      <text x="384" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">生成方收到 false 就停止</text>

      <line x1="468" y1="110" x2="570" y2="110" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="570" y="64" width="158" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="649" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">结果</text>
      <text x="649" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不必先分配完整切片</text>
      <text x="649" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合流式和大集合遍历</text>
      <text x="649" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">但要注意可读性门槛</text>

      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Iterator 的优势是惰性和少分配，但如果普通切片遍历已经足够清楚，就没必要为了新语法而新语法</text>
    </svg>

    <svg
      v-else-if="kind === 'middleware-decorator'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="中间件装饰器图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">中间件 / 装饰器模式本质上是把横切逻辑一层层包在 handler 外面，而不是把日志、鉴权、限流写进业务函数</text>

      <rect x="46" y="86" width="108" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="100" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Auth</text>

      <line x1="154" y1="108" x2="248" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="248" y="86" width="108" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="302" y="111" text-anchor="middle" font-size="10" fill="var(--d-text)">Logging</text>

      <line x1="356" y1="108" x2="450" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="450" y="86" width="108" height="44" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="504" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">RateLimit</text>

      <line x1="558" y1="108" x2="652" y2="108" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="652" y="86" width="72" height="44" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="688" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Handler</text>

      <text x="380" y="170" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">请求进入时从外到内执行，响应返回时从内到外退出</text>
      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">中间件链越长越要控制顺序，因为鉴权、日志、恢复 panic 的先后会直接影响行为</text>
    </svg>

    <svg
      v-else-if="kind === 'error-types'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="错误哨兵与自定义错误类型图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">错误设计的关键是让调用方能稳定判断错误类别，同时保留足够上下文，而不是到处比较字符串</text>

      <rect x="40" y="86" width="144" height="84" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="112" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">sentinel error</text>
      <text x="112" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">var ErrNotFound</text>
      <text x="112" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">errors.Is 判断类别</text>

      <line x1="184" y1="128" x2="306" y2="128" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="306" y="72" width="152" height="112" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="382" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">wrap context</text>
      <text x="382" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">fmt.Errorf(\"query user: %w\", err)</text>
      <text x="382" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保留调用链语义</text>
      <text x="382" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不破坏 errors.Is / As</text>
      <text x="382" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">高层再决定响应方式</text>

      <line x1="458" y1="128" x2="582" y2="128" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="582" y="86" width="144" height="84" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="654" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">custom type</text>
      <text x="654" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">type ValidationError</text>
      <text x="654" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">errors.As 取字段</text>

      <text x="380" y="214" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">哨兵适合稳定类别，自定义类型适合携带结构化信息，二者可以组合，但都别退化成比较 `err.Error()`</text>
    </svg>

    <svg
      v-else-if="kind === 'math-big-layout'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="math big 数据布局与运算流图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">math/big 的核心是把大数拆成 `[]Word` 来做运算，再把结果写回接收者复用内存</text>

      <rect x="20" y="46" width="224" height="184" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="132" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">big.Int</text>
      <rect x="44" y="88" width="176" height="30" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="132" y="107" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">neg bool</text>
      <rect x="44" y="126" width="176" height="44" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="132" y="145" text-anchor="middle" font-size="10" fill="var(--d-text)">abs nat = []Word</text>
      <text x="132" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">小端序：低位 Word 在前</text>
      <rect x="56" y="184" width="44" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="78" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">w0</text>
      <rect x="108" y="184" width="44" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="130" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">w1</text>
      <rect x="160" y="184" width="44" height="24" rx="6" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1" />
      <text x="182" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">w2</text>
      <text x="132" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">真正的大数加减乘除都落在 nat 上</text>

      <rect x="268" y="46" width="224" height="184" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">类型家族</text>
      <rect x="292" y="88" width="176" height="32" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Int = 符号 + nat</text>
      <rect x="292" y="128" width="176" height="32" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Rat = 分子 Int + 分母 nat</text>
      <rect x="292" y="168" width="176" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="187" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Float = prec + mant + exp</text>
      <text x="380" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">尾数仍然是 nat</text>
      <text x="380" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">统一复用 nat，外层只是在语义上包了一层</text>

      <rect x="516" y="46" width="224" height="184" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="628" y="68" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">运算流</text>
      <rect x="538" y="88" width="66" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="571" y="106" text-anchor="middle" font-size="9" fill="var(--d-text)">x.abs</text>
      <rect x="652" y="88" width="66" height="28" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="685" y="106" text-anchor="middle" font-size="9" fill="var(--d-text)">y.abs</text>
      <line x1="604" y1="102" x2="646" y2="102" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="562" y="130" width="132" height="48" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="628" y="149" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">add / mul / div / expNN</text>
      <text x="628" y="165" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">小数 O(n²)，大数切 Karatsuba</text>
      <line x1="628" y1="178" x2="628" y2="196" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="548" y="196" width="160" height="24" rx="6" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="628" y="212" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">z.Add(x, y) 把结果写回 z，减少分配</text>
    </svg>

    <svg
      v-else-if="kind === 'bits-intrinsics'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="math bits intrinsic 与软件回退图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">math/bits 提供的是“语义稳定的位操作 API”，编译器再决定走单条指令还是软件回退</text>

      <rect x="20" y="52" width="182" height="168" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="111" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">源码层 API</text>
      <rect x="42" y="90" width="138" height="28" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="111" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">OnesCount64</text>
      <rect x="42" y="126" width="138" height="28" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="111" y="144" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">LeadingZeros64 / Len64</text>
      <rect x="42" y="162" width="138" height="28" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="111" y="180" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Add64 / Sub64 / Mul64</text>
      <text x="111" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">调用方只写 Go 代码，不碰汇编</text>

      <line x1="202" y1="136" x2="308" y2="136" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="308" y="84" width="144" height="104" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="106" text-anchor="middle" font-size="11" fill="var(--d-text)">compiler intrinsic</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">识别 bits.* 调用</text>
      <text x="380" y="140" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按目标架构挑实现</text>
      <text x="380" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">支持则直接替换成 CPU 指令</text>

      <line x1="452" y1="136" x2="540" y2="96" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="452" y1="136" x2="540" y2="176" stroke="var(--d-blue-border)" stroke-width="1.4" />

      <rect x="540" y="56" width="188" height="74" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="634" y="78" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">硬件路径</text>
      <text x="634" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">POPCNT / LZCNT / TZCNT</text>
      <text x="634" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ADCQ / SBBQ / MULQ</text>

      <rect x="540" y="146" width="188" height="74" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="634" y="168" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">软件路径</text>
      <text x="634" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">parallel bit hacks / 查表</text>
      <text x="634" y="202" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">手动进位链与高低位拆分</text>

      <text x="380" y="240" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此 bits 同时适合写“可移植代码”和“接近硬件极限”的多精度算术、bitmap、哈希下标计算</text>
    </svg>

    <svg
      v-else-if="kind === 'rand-source-modes'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="math rand 随机源与并发选择图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">math/rand/v2 要同时考虑三件事：默认算法、是否可重现、以及并发下怎么减少锁竞争</text>

      <rect x="20" y="50" width="220" height="186" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="130" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">包级全局</text>
      <rect x="44" y="90" width="172" height="38" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="130" y="112" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">rand.N / rand.Float64 / Shuffle</text>
      <rect x="44" y="138" width="172" height="48" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="130" y="158" text-anchor="middle" font-size="10" fill="var(--d-text)">globalRand</text>
      <text x="130" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">init 时从 OS 熵源拿种子</text>
      <text x="130" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">低并发最省事，但本质仍是共享实例</text>

      <rect x="270" y="50" width="220" height="186" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">本地实例</text>
      <rect x="294" y="90" width="172" height="42" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">rand.New(rand.NewChaCha8(seed))</text>
      <text x="380" y="124" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">确定性强，适合测试与模拟</text>
      <rect x="294" y="142" width="172" height="42" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="160" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">rand.New(rand.NewPCG(seed1, seed2))</text>
      <text x="380" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">状态更小，纯性能场景更快</text>
      <text x="380" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">测试里传 `*rand.Rand`，比到处改全局状态更稳</text>

      <rect x="520" y="50" width="220" height="186" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="630" y="72" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">选择策略</text>
      <text x="630" y="102" text-anchor="middle" font-size="10" fill="var(--d-text)">低并发：包级全局</text>
      <text x="630" y="122" text-anchor="middle" font-size="10" fill="var(--d-text)">中并发：`sync.Pool` 复用 `*rand.Rand`</text>
      <text x="630" y="142" text-anchor="middle" font-size="10" fill="var(--d-text)">高并发：每 worker 持有独立实例</text>
      <rect x="542" y="162" width="176" height="42" rx="8" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="630" y="180" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">安全场景不要用 math/rand</text>
      <text x="630" y="196" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">token / key / salt 一律走 crypto/rand</text>
      <text x="630" y="222" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">算法质量、锁竞争、是否可重现，要分开判断</text>
    </svg>

    <svg
      v-else-if="kind === 'crc32-update-flow'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="CRC32 流式更新图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">CRC32 的关键不是“一次算完”，而是把旧 crc 当状态反复 Update，天然适合流式校验</text>

      <rect x="20" y="52" width="180" height="166" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="110" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">多项式与查表</text>
      <rect x="42" y="92" width="136" height="28" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="110" y="110" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">IEEE / Castagnoli</text>
      <rect x="42" y="130" width="136" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="110" y="150" text-anchor="middle" font-size="10" fill="var(--d-text)">MakeTable(poly)</text>
      <text x="110" y="182" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">先固定规则，再反复更新</text>

      <line x1="200" y1="135" x2="306" y2="135" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="306" y="70" width="148" height="130" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="92" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">状态推进</text>
      <rect x="328" y="108" width="104" height="28" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">crc = 0 / oldCRC</text>
      <rect x="328" y="144" width="104" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">Update(crc, tab, chunk)</text>
      <text x="380" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">Write 一次，状态就向前推进一次</text>

      <line x1="454" y1="135" x2="560" y2="96" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <line x1="454" y1="135" x2="560" y2="174" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <rect x="560" y="56" width="176" height="72" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="648" y="78" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">软件路径</text>
      <text x="648" y="96" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">slicing-by-8</text>
      <text x="648" y="112" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">8 个查表并行吃掉 8 字节</text>

      <rect x="560" y="144" width="176" height="72" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="648" y="166" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">硬件路径</text>
      <text x="648" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">SSE4.2 / ARM64 指令</text>
      <text x="648" y="200" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">runtime 启动时探测后切换</text>

      <text x="380" y="240" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">文件校验、网络分块、ZIP 验证都只是同一个状态机的不同喂数方式</text>
    </svg>

    <svg
      v-else-if="kind === 'unique-interning'"
      viewBox="0 0 760 260"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="unique 驻留与弱引用图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">unique.Make 做的是“规范化句柄”：相同值只保留一份底层对象，比较时直接比句柄指针</text>

      <rect x="20" y="52" width="170" height="170" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="105" y="74" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">调用入口</text>
      <rect x="42" y="96" width="126" height="36" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="105" y="118" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">Make("content-type")</text>
      <rect x="42" y="146" width="126" height="36" rx="8" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="105" y="168" text-anchor="middle" font-size="10" fill="var(--d-text)">按类型找到 intern 表</text>
      <text x="105" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">`T comparable` 才能做规范化键</text>

      <line x1="190" y1="136" x2="292" y2="136" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="292" y="70" width="176" height="132" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="380" y="92" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">intern map[T]weakPtr</text>
      <rect x="316" y="108" width="128" height="28" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="380" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">命中：复用已存在对象</text>
      <rect x="316" y="144" width="128" height="28" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="380" y="162" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">未命中：分配新对象后登记</text>
      <text x="380" y="188" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">并发目标是“只让一份真实值存活”</text>

      <line x1="468" y1="136" x2="570" y2="100" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <line x1="468" y1="136" x2="570" y2="176" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <rect x="570" y="66" width="166" height="64" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="653" y="88" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">Handle[T]{ptr}</text>
      <text x="653" y="106" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`==` 变成 O(1) 指针比较</text>

      <rect x="570" y="148" width="166" height="70" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="653" y="170" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">弱引用 + GC</text>
      <text x="653" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">最后一个 Handle 消失后</text>
      <text x="653" y="204" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">条目可被回收，下次再惰性重建</text>

      <text x="380" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">因此 unique 适合“重复值很多、唯一值不多”的 tag、header、枚举型 key，而不是无限增长的原始业务数据</text>
    </svg>
  </DiagramFrame>
</template>
