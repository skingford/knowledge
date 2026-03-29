<script setup lang="ts">
type DiagramKind =
  | 'config-injection-update-chain'
  | 'config-consumption-boundary-map'
  | 'image-supply-chain-chain'
  | 'image-trust-boundary-map'
  | 'secret-security-governance-chain'
  | 'external-secret-delivery-boundary-map'
  | 'api-audit-event-chain'
  | 'audit-policy-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'config-injection-update-chain'"
      viewBox="0 0 860 386"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 配置注入与更新传播链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-config-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 50 - 改了 `ConfigMap` / `Secret` 不等于应用立刻吃到新配置；真正要分清的是注入路径、更新传播路径和应用加载模型
      </text>

      <rect x="38" y="118" width="148" height="90" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="112" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">ConfigMap / Secret</text>
      <text x="112" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象被更新</text>
      <text x="112" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">apiserver / kubelet watch</text>

      <rect x="220" y="88" width="176" height="66" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="308" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">env / envFrom</text>
      <text x="308" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">容器启动时注入进程环境</text>

      <rect x="220" y="176" width="176" height="66" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="308" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">volume / projected</text>
      <text x="308" y="220" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">kubelet 逐步同步文件</text>

      <rect x="440" y="88" width="176" height="66" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="528" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod 不重建</text>
      <text x="528" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">环境变量通常仍是旧值</text>

      <rect x="440" y="176" width="176" height="66" rx="14" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="528" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">文件可能已更新</text>
      <text x="528" y="220" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">但应用未必重新加载</text>

      <rect x="660" y="88" width="156" height="66" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="738" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">需要 rollout</text>
      <text x="738" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">重建 Pod 才拿到新 env</text>

      <rect x="660" y="176" width="156" height="66" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="738" y="202" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">需要 reload</text>
      <text x="738" y="220" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或应用主动 watch 文件</text>

      <line x1="186" y1="136" x2="220" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="186" y1="190" x2="220" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="396" y1="121" x2="440" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="396" y1="209" x2="440" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="616" y1="121" x2="660" y2="121" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />
      <line x1="616" y1="209" x2="660" y2="209" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-config-chain)" />

      <rect x="170" y="286" width="520" height="56" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">真正的边界不是“配置对象改了没有”，而是“新值走哪条路径进入进程，以及应用会不会重新读它”</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">另一个常见断点是 `subPath`：它会打断普通目录挂载的后续更新传播</text>
    </svg>

    <svg
      v-else-if="kind === 'config-consumption-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 配置消费方式边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 51 - 配置消费方式的重点不是“哪种更方便”，而是“更新传播、暴露面、可读性和是否适合热更新”这几条边界
      </text>

      <rect x="30" y="76" width="188" height="238" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">env</text>
      <text x="124" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：显式、代码读取简单</text>
      <text x="124" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">更新：通常要重建 Pod</text>
      <text x="124" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">适合：少量开关、连接串</text>
      <text x="124" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">注意：敏感值暴露面较大</text>

      <rect x="234" y="76" width="188" height="238" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">envFrom</text>
      <text x="328" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：批量导入省事</text>
      <text x="328" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">更新：同样通常要重建 Pod</text>
      <text x="328" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：简单环境变量集合</text>
      <text x="328" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">注意：最小暴露面和可读性较弱</text>

      <rect x="438" y="76" width="188" height="238" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">volume</text>
      <text x="532" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：适合配置文件和证书</text>
      <text x="532" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">更新：文件会逐步同步</text>
      <text x="532" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">适合：文件式配置、TLS 密钥</text>
      <text x="532" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">注意：应用自己决定是否 reload</text>

      <rect x="642" y="76" width="188" height="238" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">projected / subPath</text>
      <text x="736" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">projected：组合多来源挂载</text>
      <text x="736" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">subPath：挂单文件很方便</text>
      <text x="736" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合：汇总目录、固定路径挂载</text>
      <text x="736" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">注意：`subPath` 常打断后续更新</text>

      <rect x="86" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="145" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="145" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">进程环境更像启动时快照</text>

      <rect x="290" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="349" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="349" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">方便，但容易一把梭过量注入</text>

      <rect x="494" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="553" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="553" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">文件进来了，不代表服务已生效</text>

      <rect x="698" y="226" width="118" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="757" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="757" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`projected` 是组合，`subPath` 是断点</text>

      <rect x="96" y="340" width="668" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：少量显式配置用 `env`，批量简化用 `envFrom`，文件和证书用 `volume`，多来源汇总用 `projected`，一旦用了 `subPath` 就别默认它还能热更新
      </text>
    </svg>

    <svg
      v-else-if="kind === 'image-supply-chain-chain'"
      viewBox="0 0 860 398"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 镜像供应链主线图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-image-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 60 - 镜像供应链治理不是只盯着 registry，而是从构建、签名、准入验证到节点拉取和运行时最小权限串成一条链
      </text>

      <rect x="34" y="110" width="110" height="88" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="89" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">开发 / CI</text>
      <text x="89" y="158" text-anchor="middle" font-size="9" fill="var(--d-client-text)">提交代码</text>
      <text x="89" y="174" text-anchor="middle" font-size="9" fill="var(--d-client-text)">触发构建流水线</text>

      <rect x="172" y="96" width="132" height="116" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="238" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">构建镜像</text>
      <text x="238" y="144" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Dockerfile / base image</text>
      <text x="238" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">产出 tag 与 digest</text>
      <rect x="198" y="176" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="238" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">固定引用</text>

      <rect x="332" y="96" width="148" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="406" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">签名 / Attestation</text>
      <text x="406" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">cosign / provenance</text>
      <text x="406" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">扫描结果 / SBOM</text>
      <rect x="362" y="176" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="406" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">可信证明</text>

      <rect x="508" y="96" width="124" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="570" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Registry</text>
      <text x="570" y="144" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">私有仓库</text>
      <text x="570" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">tag / digest 存放点</text>
      <rect x="530" y="176" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="570" y="191" text-anchor="middle" font-size="9" fill="var(--d-text)">谁能拉</text>

      <rect x="660" y="84" width="166" height="140" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="743" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Admission 验证</text>
      <text x="743" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">来源限制 / 禁 `latest`</text>
      <text x="743" y="148" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">digest / 签名 / attestation</text>
      <text x="743" y="164" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">SBOM / 流水线证明</text>
      <rect x="690" y="182" width="106" height="24" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="743" y="198" text-anchor="middle" font-size="9" fill="var(--d-text)">能不能进集群</text>

      <line x1="144" y1="154" x2="172" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="304" y1="154" x2="332" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="480" y1="154" x2="508" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="632" y1="154" x2="660" y2="154" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />

      <rect x="220" y="266" width="176" height="88" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="308" y="294" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">kubelet / runtime 拉取</text>
      <text x="308" y="314" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">按 `imagePullPolicy` 判断</text>
      <text x="308" y="330" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">读取 `imagePullSecrets`</text>

      <rect x="464" y="254" width="176" height="112" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="552" y="282" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">容器真正运行</text>
      <text x="552" y="302" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`securityContext`</text>
      <text x="552" y="318" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">Pod Security / 最小权限</text>
      <rect x="490" y="332" width="124" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="552" y="347" text-anchor="middle" font-size="9" fill="var(--d-text)">跑起来后权限多大</text>

      <path d="M743 224 C743 256, 382 244, 308 266" fill="none" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-image-chain)" />
      <line x1="396" y1="310" x2="464" y2="310" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-image-chain)" />

      <rect x="92" y="334" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="140" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">引用稳定性</text>

      <rect x="92" y="364" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="140" y="380" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">拉取认证</text>

      <rect x="668" y="334" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="716" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">准入验证</text>

      <rect x="668" y="364" width="96" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="716" y="380" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">运行时权限</text>
    </svg>

    <svg
      v-else-if="kind === 'image-trust-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 镜像治理边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-image-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 61 - 回答镜像治理时，先把引用、拉取认证、准入验证、运行时权限四层边界拆开，别把所有问题都塞给私有仓库
      </text>

      <rect x="30" y="84" width="188" height="236" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">引用稳定性</text>
      <text x="124" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">tag vs digest</text>
      <text x="124" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">禁 `latest`</text>
      <text x="124" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">显式写 `imagePullPolicy`</text>
      <text x="124" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">拉的是不是固定内容</text>
      <rect x="74" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">先收口引用</text>

      <rect x="234" y="84" width="188" height="236" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">拉取认证</text>
      <text x="328" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`imagePullSecrets`</text>
      <text x="328" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">私有 registry 凭证</text>
      <text x="328" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`AlwaysPullImages`</text>
      <text x="328" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">谁有资格拉这个镜像</text>
      <rect x="278" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">再收口凭证</text>

      <rect x="438" y="84" width="188" height="236" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">准入验证</text>
      <text x="532" y="138" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">来源前缀 / registry 白名单</text>
      <text x="532" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">签名 / attestation / SBOM</text>
      <text x="532" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">VAP / Kyverno / Sigstore</text>
      <text x="532" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">这个镜像能不能进集群</text>
      <rect x="482" y="266" width="100" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">最后做验证</text>

      <rect x="642" y="84" width="188" height="236" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="112" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">运行时权限</text>
      <text x="736" y="138" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`securityContext`</text>
      <text x="736" y="156" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Pod Security</text>
      <text x="736" y="174" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">non-root / no privilege escalation</text>
      <text x="736" y="206" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="224" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">就算可信也别超权</text>
      <rect x="674" y="266" width="124" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="285" text-anchor="middle" font-size="9" fill="var(--d-text)">别忘最小权限</text>

      <line x1="218" y1="202" x2="234" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />
      <line x1="422" y1="202" x2="438" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />
      <line x1="626" y1="202" x2="642" y2="202" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-image-boundary)" />

      <rect x="114" y="344" width="632" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="363" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先固定引用，再收敛来源，再做验证，最后别忘运行时最小权限
      </text>
    </svg>

    <svg
      v-else-if="kind === 'secret-security-governance-chain'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Secret 安全治理链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-secret-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 62 - Secret 安全不是“放进 Secret 对象”就结束，而是要把对象表达、etcd 加密、RBAC、节点分发和应用消费串成一整条链
      </text>

      <rect x="26" y="112" width="122" height="86" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Secret 真源</text>
      <text x="87" y="160" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Git / 外部 Manager</text>
      <text x="87" y="176" text-anchor="middle" font-size="9" fill="var(--d-client-text)">真正的密码来源</text>

      <rect x="176" y="98" width="132" height="114" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="242" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">apiserver</text>
      <text x="242" y="146" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RBAC / Admission</text>
      <text x="242" y="162" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁能读</text>
      <text x="242" y="178" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁能创建引用 Secret 的 Pod</text>

      <rect x="336" y="98" width="136" height="114" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="404" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">etcd</text>
      <text x="404" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">at-rest encryption</text>
      <text x="404" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">provider 顺序</text>
      <text x="404" y="178" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">旧数据要 rewrite</text>

      <rect x="500" y="98" width="136" height="114" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="568" y="126" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">kubelet / 节点</text>
      <text x="568" y="146" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">只拿本节点使用到的 Secret</text>
      <text x="568" y="162" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">tmpfs 挂载</text>
      <text x="568" y="178" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">仍怕高权限容器</text>

      <rect x="664" y="86" width="170" height="138" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="749" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod / 应用进程</text>
      <text x="749" y="134" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">env / volume / projected</text>
      <text x="749" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">应用是否 reload</text>
      <text x="749" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志 / debug 是否泄露</text>
      <rect x="706" y="184" width="86" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="749" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">真正暴露面</text>

      <line x1="148" y1="155" x2="176" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="308" y1="155" x2="336" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="472" y1="155" x2="500" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />
      <line x1="636" y1="155" x2="664" y2="155" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-secret-chain)" />

      <rect x="68" y="276" width="206" height="86" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="171" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">控制面边界</text>
      <text x="171" y="324" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Secret` 不等于加密</text>
      <text x="171" y="340" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">RBAC 和 Pod create 都会影响读取边界</text>

      <rect x="326" y="276" width="206" height="86" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="429" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">节点执行边界</text>
      <text x="429" y="324" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">kubelet 分发只是中间环节</text>
      <text x="429" y="340" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">`privileged` 容器会打穿收益</text>

      <rect x="584" y="276" width="208" height="86" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="688" y="304" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">应用消费边界</text>
      <text x="688" y="324" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">平台完成同步，不等于业务完成收敛</text>
      <text x="688" y="340" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">是否 reload 才决定轮转是否真正生效</text>
    </svg>

    <svg
      v-else-if="kind === 'external-secret-delivery-boundary-map'"
      viewBox="0 0 860 398"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 原生 Secret ESO 与 Secrets Store CSI Driver 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-secret-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 63 - 选 Secret 交付方案时，先分清谁是真源、Secret 会不会落回 API、应用是读环境变量还是读文件
      </text>

      <rect x="34" y="86" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="128" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">原生 Secret</text>
      <text x="128" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">真源常在 Git / CI / 人工脚本</text>
      <text x="128" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">直接写进 apiserver / etcd</text>
      <text x="128" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">env / volume 都兼容</text>
      <text x="128" y="206" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：</text>
      <text x="128" y="224" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">最简单、最通用</text>
      <text x="128" y="250" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">边界：</text>
      <text x="128" y="268" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">真源和轮转体系通常比较弱</text>
      <rect x="74" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="128" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：最兼容</text>

      <rect x="248" y="86" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="342" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">ESO</text>
      <text x="342" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">外部 Secret Manager 为真源</text>
      <text x="342" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">controller 同步成 K8s Secret</text>
      <text x="342" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">现有工作负载几乎无感接入</text>
      <text x="342" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：</text>
      <text x="342" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">轮转与审计可回外部系统</text>
      <text x="342" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">边界：</text>
      <text x="342" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Secret 仍会落回 API / etcd</text>
      <rect x="288" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="342" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：真源外置</text>

      <rect x="462" y="86" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="556" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Secrets Store CSI Driver</text>
      <text x="556" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">外部 Secret Manager 为真源</text>
      <text x="556" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">通过 CSI volume 直接挂文件</text>
      <text x="556" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">可选 sync 回 K8s Secret</text>
      <text x="556" y="206" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：</text>
      <text x="556" y="224" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">可以减少 API / etcd 落地</text>
      <text x="556" y="250" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">边界：</text>
      <text x="556" y="268" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">应用最好支持文件读取与 reload</text>
      <rect x="502" y="292" width="108" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="556" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：文件交付</text>

      <rect x="676" y="86" width="150" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="751" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">真正的选择题</text>
      <text x="751" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">应用只会读 env</text>
      <text x="751" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">还是能读文件</text>
      <text x="751" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">是否一定要避免</text>
      <text x="751" y="202" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Secret 落回 API / etcd</text>
      <text x="751" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">轮转后业务能不能</text>
      <text x="751" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">自动 reload</text>
      <rect x="703" y="292" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="751" y="311" text-anchor="middle" font-size="9" fill="var(--d-text)">关键词：消费模型</text>

      <line x1="222" y1="208" x2="248" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />
      <line x1="436" y1="208" x2="462" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />
      <line x1="650" y1="208" x2="676" y2="208" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-secret-boundary)" />

      <rect x="144" y="350" width="572" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先决定真源，再决定 Secret 是否必须落回 K8s，最后决定应用走 env 还是文件
      </text>
    </svg>

    <svg
      v-else-if="kind === 'api-audit-event-chain'"
      viewBox="0 0 860 402"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s API 审计事件链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-audit-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 64 - Audit 是 `kube-apiserver` 在请求执行各阶段生成的证据链，不是替 RBAC 或 Admission 做放行决策
      </text>

      <rect x="26" y="116" width="110" height="84" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="81" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client</text>
      <text x="81" y="164" text-anchor="middle" font-size="9" fill="var(--d-client-text)">kubectl / CI / Controller</text>

      <rect x="164" y="102" width="128" height="112" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="228" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authn / Authz</text>
      <text x="228" y="150" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">你是谁</text>
      <text x="228" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能做</text>

      <rect x="320" y="102" width="128" height="112" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="384" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Admission</text>
      <text x="384" y="150" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">mutation / validation</text>
      <text x="384" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">决定能否进集群</text>

      <rect x="476" y="88" width="164" height="140" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="558" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Audit Event</text>
      <text x="558" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`RequestReceived`</text>
      <text x="558" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`ResponseStarted` for long-running</text>
      <text x="558" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`ResponseComplete` / `Panic`</text>
      <rect x="516" y="184" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="558" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">留证据</text>

      <rect x="668" y="102" width="166" height="112" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="751" y="130" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Audit Policy</text>
      <text x="751" y="150" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">first match wins</text>
      <text x="751" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">Metadata / Request / RequestResponse</text>

      <line x1="136" y1="158" x2="164" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="292" y1="158" x2="320" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="448" y1="158" x2="476" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />
      <line x1="640" y1="158" x2="668" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-audit-chain)" />

      <rect x="172" y="274" width="186" height="90" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="265" y="302" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">log backend</text>
      <text x="265" y="322" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">本地文件</text>
      <text x="265" y="338" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">后续再汇聚到日志系统</text>

      <rect x="502" y="260" width="186" height="118" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="595" y="288" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">webhook backend</text>
      <text x="595" y="308" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">实时送外部审计 API</text>
      <text x="595" y="324" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`batch / blocking / blocking-strict`</text>
      <text x="595" y="340" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">模式越硬，可用性耦合越强</text>

      <path d="M751 214 C751 244, 265 242, 265 274" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-chain)" />
      <path d="M751 214 C751 244, 595 228, 595 260" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-chain)" />

      <rect x="142" y="382" width="576" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="397" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">关键边界：Audit 解决“留下什么证据”，Admission 解决“让不让过”，Event 解决“对象后来怎么样”</text>
    </svg>

    <svg
      v-else-if="kind === 'audit-policy-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Audit Policy 边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-audit-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 65 - 设计 Audit Policy 时，先分清规则顺序、级别成本、后端耦合和数据源边界，不要把所有请求都提到 `RequestResponse`
      </text>

      <rect x="30" y="86" width="188" height="240" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">规则匹配</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`rules` 按顺序匹配</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">首个命中生效</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">catch-all 别放太前面</text>
      <text x="124" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">附加边界：</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`omitStages` 全局 + 局部并集</text>
      <text x="124" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`omitManagedFields` 也有全局默认</text>
      <rect x="76" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">先看顺序</text>

      <rect x="234" y="86" width="188" height="240" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">审计级别</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Metadata` 最常用</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Request` 带请求体</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`RequestResponse` 带请求体和响应体</text>
      <text x="328" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">风险：</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`secrets`、token、patch 容易二次泄露</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">级别越高，成本和暴露面越大</text>
      <rect x="280" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">默认 Metadata</text>

      <rect x="438" y="86" width="188" height="240" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">后端选择</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">log backend: 简单直接</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">webhook backend: 便于集中汇聚</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`blocking-strict` 会放大耦合</text>
      <text x="532" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">排障关键词：</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">轮转、缓冲、重试、后端 SLA</text>
      <text x="532" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">别让审计反噬 API 可用性</text>
      <rect x="484" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">再看耦合</text>

      <rect x="642" y="86" width="188" height="240" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">边界辨析</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Audit != Admission</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Audit != Event</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">Webhook mutation 可带 audit annotations</text>
      <text x="736" y="210" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">谁做了什么</text>
      <text x="736" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不回答对象后来是否运行异常</text>
      <rect x="688" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">别混数据源</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-audit-boundary)" />

      <rect x="116" y="350" width="628" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分证据链和门禁，再用 Metadata 为主，最后只对少量高价值对象谨慎提高级别
      </text>
    </svg>
  </div>
</template>
