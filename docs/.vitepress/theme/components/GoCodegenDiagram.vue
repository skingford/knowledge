<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from './DiagramFrame.vue'

type DiagramKind =
  | 'go-generate'
  | 'stringer-flow'
  | 'mockgen-modes'
  | 'wire-di'
  | 'ast-pipeline'
  | 'template-codegen'
  | 'go-embed'
  | 'meta-choice'
  | 'analyzer-pipeline'
  | 'build-tags'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'go-generate': '760px',
  'stringer-flow': '760px',
  'mockgen-modes': '760px',
  'wire-di': '760px',
  'ast-pipeline': '760px',
  'template-codegen': '760px',
  'go-embed': '760px',
  'meta-choice': '760px',
  'analyzer-pipeline': '760px',
  'build-tags': '760px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'go-generate'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="go generate 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`go generate` 的本质是把生成命令绑定到源码旁边，让“先跑哪个脚本”不再靠口头记忆</text>
      <rect x="34" y="86" width="150" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="109" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">//go:generate ...</text>
      <line x1="184" y1="108" x2="292" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="292" y="64" width="174" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="379" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">go generate ./...</text>
      <text x="379" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读取指令</text>
      <text x="379" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">执行生成器命令</text>
      <text x="379" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">输出生成文件</text>
      <line x1="466" y1="108" x2="574" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="574" y="64" width="152" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="650" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">generated.go</text>
      <text x="650" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">可提交或可再生</text>
      <text x="650" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">取决于团队规范</text>
      <text x="650" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">CI 需统一执行</text>
      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">它不会在 `go build` 时自动运行，所以生成步骤必须被文档化并纳入 CI</text>
    </svg>

    <svg
      v-else-if="kind === 'stringer-flow'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="stringer 流程图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`stringer` 的价值是把枚举值到字符串的映射自动生成，避免手写 switch 漏分支或拼错字面量</text>
      <rect x="36" y="86" width="126" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="99" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">type Status int</text>
      <line x1="162" y1="108" x2="270" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="270" y="64" width="180" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="360" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">stringer -type=Status</text>
      <text x="360" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">解析 const 枚举</text>
      <text x="360" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">生成 String() 方法</text>
      <text x="360" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">调试和日志更友好</text>
      <line x1="450" y1="108" x2="558" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="558" y="64" width="168" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="642" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">status_string.go</text>
      <text x="642" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Status(1).String()</text>
      <text x="642" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不再手写 switch</text>
      <text x="642" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">加新枚举要重新生成</text>
    </svg>

    <svg
      v-else-if="kind === 'mockgen-modes'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="mockgen 两种模式图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">mock 生成工具的本质是把接口契约转成可编程假对象，重点在于“接口边界是否合理”，不是工具本身多花哨</text>
      <rect x="40" y="82" width="140" height="96" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="110" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">source 模式</text>
      <text x="110" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读取 repository.go</text>
      <text x="110" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">依赖源码路径</text>
      <text x="110" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">简单直接</text>
      <rect x="310" y="82" width="140" height="96" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="380" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">reflect 模式</text>
      <text x="380" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">加载已编译包</text>
      <text x="380" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">按接口名生成</text>
      <text x="380" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">更灵活</text>
      <rect x="580" y="82" width="140" height="96" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="650" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">输出 mock</text>
      <text x="650" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">mock_repository.go</text>
      <text x="650" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">测试中注入</text>
      <text x="650" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">验证行为</text>
      <line x1="180" y1="130" x2="310" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="450" y1="130" x2="580" y2="130" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="380" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">如果接口太宽，生成再多 mock 也不好测；可测试性的根子仍然在接口设计本身</text>
    </svg>

    <svg
      v-else-if="kind === 'wire-di'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Wire 依赖注入图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">Wire 的关键是把依赖关系分析放到编译期，最终生成普通 Go 构造代码，而不是运行时魔法容器</text>
      <rect x="34" y="86" width="146" height="88" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="107" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-c-text)">ProviderSet</text>
      <text x="107" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewDB</text>
      <text x="107" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewRepo</text>
      <text x="107" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">NewService</text>
      <line x1="180" y1="130" x2="294" y2="130" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="294" y="72" width="172" height="116" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="380" y="94" text-anchor="middle" font-size="11" fill="var(--d-text)">wire injector</text>
      <text x="380" y="112" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">wire.Build(...)</text>
      <text x="380" y="128" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">分析参数和返回值</text>
      <text x="380" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">生成依赖装配代码</text>
      <text x="380" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">编译期发现缺失依赖</text>
      <line x1="466" y1="130" x2="580" y2="130" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="580" y="86" width="146" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="653" y="108" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">wire_gen.go</text>
      <text x="653" y="126" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">普通函数调用链</text>
      <text x="653" y="142" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">没有运行时反射成本</text>
      <text x="653" y="158" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">可直接读生成代码</text>
    </svg>

    <svg
      v-else-if="kind === 'ast-pipeline'"
      viewBox="0 0 760 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="go/ast 管道图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">AST 工具链的价值在于先把源码变成结构化语法树，再在结构上做分析和生成，而不是靠正则表达式硬抠文本</text>
      <rect x="26" y="92" width="110" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="81" y="117" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">.go source</text>
      <line x1="136" y1="114" x2="244" y2="114" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="244" y="64" width="168" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="328" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">parser + ast</text>
      <text x="328" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">解析 package / file / decl</text>
      <text x="328" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">inspect struct / interface / tag</text>
      <text x="328" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">携带位置信息</text>
      <line x1="412" y1="114" x2="520" y2="90" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="412" y1="114" x2="520" y2="138" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="520" y="68" width="206" height="40" rx="8" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="623" y="92" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">分析器：查找模式、验证约束、收集元数据</text>
      <rect x="520" y="120" width="206" height="40" rx="8" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="623" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">生成器：输出 handler / validator / mapper 代码</text>
      <text x="380" y="196" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">AST 是代码生成和自定义静态分析的共同底座，正则只能临时演示，做不成稳定工具</text>
    </svg>

    <svg
      v-else-if="kind === 'template-codegen'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="模板代码生成图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">模板代码生成的核心是“结构化数据 + 模板规则 + 格式化输出”，而不是在字符串里随手拼 Go 代码</text>
      <rect x="32" y="86" width="122" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="93" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Data model</text>
      <line x1="154" y1="108" x2="262" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="262" y="64" width="176" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="350" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">text/template</text>
      <text x="350" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">FuncMap</text>
      <text x="350" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Execute 到 bytes.Buffer</text>
      <text x="350" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">避免手拼转义地狱</text>
      <line x1="438" y1="108" x2="546" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="546" y="64" width="180" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="636" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">输出文件</text>
      <text x="636" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">goimports / gofmt</text>
      <text x="636" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">处理 import 和格式</text>
      <text x="636" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">最终可编译</text>
      <text x="380" y="192" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">模板适合批量重复结构；如果逻辑太复杂，说明可能已经超出模板生成的舒适边界</text>
    </svg>

    <svg
      v-else-if="kind === 'go-embed'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="go:embed 图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">`go:embed` 把静态资源打进二进制，让部署时不用再额外挂一堆文件，但资源更新必须重新构建发布</text>
      <rect x="34" y="86" width="140" height="48" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="104" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">templates/ static/ sql/</text>
      <line x1="174" y1="110" x2="284" y2="110" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="284" y="64" width="172" height="92" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="370" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">//go:embed</text>
      <text x="370" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">embed.FS / string / []byte</text>
      <text x="370" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">编译时打包进 binary</text>
      <text x="370" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">运行时像文件系统读取</text>
      <line x1="456" y1="110" x2="566" y2="110" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="566" y="64" width="160" height="92" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="646" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">单个二进制</text>
      <text x="646" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">部署更简单</text>
      <text x="646" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">但开发热更新更弱</text>
      <text x="646" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合静态资源稳定场景</text>
    </svg>

    <svg
      v-else-if="kind === 'meta-choice'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="代码生成 反射 泛型 取舍图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">代码生成、反射、泛型不是替代关系，而是针对“性能、类型安全、灵活性”三角不同取点的工具</text>
      <rect x="34" y="74" width="204" height="128" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="136" y="98" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">代码生成</text>
      <text x="136" y="118" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">性能高</text>
      <text x="136" y="134" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">类型安全高</text>
      <text x="136" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">维护模板成本高</text>
      <text x="136" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">适合 ORM / API client</text>
      <rect x="278" y="74" width="204" height="128" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" />
      <text x="380" y="98" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">反射</text>
      <text x="380" y="118" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">运行时最灵活</text>
      <text x="380" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">性能和可读性较弱</text>
      <text x="380" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">适合 JSON / 配置映射</text>
      <text x="380" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">热路径谨慎使用</text>
      <rect x="522" y="74" width="204" height="128" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="624" y="98" text-anchor="middle" font-size="11" fill="var(--d-text)">泛型</text>
      <text x="624" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">编译时类型安全</text>
      <text x="624" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合集合与容器抽象</text>
      <text x="624" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">不适合任意结构体元编程</text>
      <text x="624" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">比反射更稳</text>
      <text x="380" y="226" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">默认优先级通常是：手写 > 泛型 > 代码生成 > 反射，除非业务场景明确要求别的取舍</text>
    </svg>

    <svg
      v-else-if="kind === 'analyzer-pipeline'"
      viewBox="0 0 760 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="自定义分析器图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">自定义 linter 的核心是把团队规则自动化成“可批量检查的语义约束”，而不是靠 code review 人肉记忆</text>
      <rect x="28" y="86" width="118" height="44" rx="8" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <text x="87" y="111" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Go packages</text>
      <line x1="146" y1="108" x2="256" y2="108" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="256" y="64" width="188" height="88" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="350" y="86" text-anchor="middle" font-size="11" fill="var(--d-text)">analysis.Analyzer</text>
      <text x="350" y="104" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">检查 AST / types</text>
      <text x="350" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">发现违规模式</text>
      <text x="350" y="136" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">输出诊断信息</text>
      <line x1="444" y1="108" x2="554" y2="108" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="554" y="64" width="172" height="88" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="640" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">golangci-lint / CI</text>
      <text x="640" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">统一执行</text>
      <text x="640" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">PR 级别阻断违规</text>
      <text x="640" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">团队规则变成机器规则</text>
    </svg>

    <svg
      v-else-if="kind === 'build-tags'"
      viewBox="0 0 760 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="构建标签图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">构建标签的关键是让一整份文件按条件被包含或排除，从而安全地管理平台差异、调试代码和工具依赖</text>
      <rect x="30" y="82" width="204" height="100" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.2" />
      <text x="132" y="104" text-anchor="middle" font-size="11" fill="var(--d-text)">debug_log.go</text>
      <text x="132" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">//go:build debug</text>
      <text x="132" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">仅 debug 构建进入编译</text>
      <text x="132" y="154" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">生产构建完全排除</text>
      <line x1="234" y1="132" x2="352" y2="132" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="352" y="64" width="156" height="136" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.2" />
      <text x="430" y="86" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">go build -tags ...</text>
      <text x="430" y="104" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">选择 cgo / tools / linux</text>
      <text x="430" y="120" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">整文件参与或不参与</text>
      <text x="430" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">比 C 宏安全得多</text>
      <text x="430" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不会留下半截条件代码</text>
      <line x1="508" y1="132" x2="626" y2="132" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="626" y="82" width="104" height="100" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="678" y="104" text-anchor="middle" font-size="11" fill="var(--d-rv-a-text)">常见场景</text>
      <text x="678" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">debug 日志</text>
      <text x="678" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">平台差异</text>
      <text x="678" y="154" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">tools.go</text>
    </svg>
  </DiagramFrame>
</template>
