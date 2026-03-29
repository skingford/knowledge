<script setup lang="ts">
type DiagramKind =
  | 'api-security-chain'
  | 'workload-isolation-boundary'
  | 'serviceaccount-token-identity-chain'
  | 'serviceaccount-token-boundary-map'
  | 'rbac-evaluation-chain'
  | 'rbac-binding-boundary-map'
  | 'pod-security-enforcement-chain'
  | 'security-context-boundary-map'
  | 'admission-policy-chain'
  | 'policy-engine-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'api-security-chain'"
      viewBox="0 0 860 338"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s API 安全链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-api-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 17 - 访问集群 API 的安全链路是：身份先被认证，再做授权，最后再经过准入控制
      </text>

      <rect x="36" y="112" width="140" height="70" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="106" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubectl / CI / Pod</text>
      <text x="106" y="156" text-anchor="middle" font-size="9" fill="var(--d-client-text)">用户证书 / OIDC / SA Token</text>

      <rect x="212" y="112" width="138" height="70" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="281" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authentication</text>
      <text x="281" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先回答“你是谁”</text>

      <rect x="386" y="112" width="138" height="70" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="455" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Authorization</text>
      <text x="455" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">RBAC 回答“你能做什么”</text>

      <rect x="560" y="112" width="138" height="70" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="629" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Admission</text>
      <text x="629" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">校验 / 变更请求内容</text>

      <rect x="724" y="112" width="100" height="70" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="774" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">etcd</text>
      <text x="774" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">状态落盘</text>

      <line x1="176" y1="147" x2="212" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="350" y1="147" x2="386" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="524" y1="147" x2="560" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />
      <line x1="698" y1="147" x2="724" y2="147" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-api-security)" />

      <rect x="96" y="228" width="668" height="68" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键区分</text>
      <text x="430" y="272" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">ServiceAccount 提供身份，不直接提供权限；RBAC 提供 API 权限；Admission 提供策略兜底</text>
    </svg>

    <svg
      v-else-if="kind === 'workload-isolation-boundary'"
      viewBox="0 0 860 352"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 工作负载隔离边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-workload-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 18 - 工作负载侧要把 API 权限、敏感数据和网络连通性看成三条不同边界
      </text>

      <rect x="312" y="118" width="236" height="100" rx="18" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.5" />
      <text x="430" y="146" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Workload Pod</text>
      <text x="430" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">运行应用容器</text>
      <text x="430" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">挂 ServiceAccount Token / Secret</text>
      <text x="430" y="202" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">受 NetworkPolicy 和命名空间边界影响</text>

      <rect x="76" y="86" width="168" height="72" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="160" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">ServiceAccount + RBAC</text>
      <text x="160" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">控制 Pod 调 API 时能做什么</text>

      <rect x="76" y="212" width="168" height="72" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="160" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Secret</text>
      <text x="160" y="258" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">注入敏感数据</text>

      <rect x="616" y="86" width="168" height="72" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="700" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">NetworkPolicy</text>
      <text x="700" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">控制 Pod 与 Pod / 外部的流量</text>

      <rect x="616" y="212" width="168" height="72" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="700" y="240" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Admission / Policy</text>
      <text x="700" y="258" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">限制镜像、标签、SecurityContext</text>

      <line x1="244" y1="122" x2="312" y2="150" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="244" y1="248" x2="312" y2="186" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="548" y1="150" x2="616" y2="122" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />
      <line x1="548" y1="186" x2="616" y2="248" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-workload-security)" />

      <rect x="112" y="308" width="636" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="325" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        RBAC 不是网络隔离，NetworkPolicy 也不是 API 权限控制，Secret 更不是天然加密保险箱
      </text>
    </svg>

    <svg
      v-else-if="kind === 'serviceaccount-token-identity-chain'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s ServiceAccount token 身份链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-sa-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 52 - Pod 能访问 `kube-apiserver`，不是因为它“天然有权限”，而是因为它绑定了 `ServiceAccount`，Kubernetes 再把对应身份凭证投射进容器
      </text>

      <rect x="34" y="118" width="134" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="101" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod spec</text>
      <text x="101" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">serviceAccountName</text>
      <text x="101" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">automountServiceAccountToken</text>

      <rect x="200" y="118" width="148" height="88" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="274" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">ServiceAccount</text>
      <text x="274" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">身份对象</text>
      <text x="274" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不直接等于权限</text>

      <rect x="380" y="118" width="156" height="88" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="458" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">TokenRequest / kubelet</text>
      <text x="458" y="166" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">申请短期 token</text>
      <text x="458" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">投射进 Pod</text>

      <rect x="568" y="118" width="136" height="88" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="636" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">projected token</text>
      <text x="636" y="166" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">短期 / 可轮转</text>
      <text x="636" y="182" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">可指定 audience</text>

      <rect x="736" y="118" width="94" height="88" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="783" y="146" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">API 调用</text>
      <text x="783" y="166" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">apiserver</text>
      <text x="783" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">或目标受众系统</text>

      <line x1="168" y1="162" x2="200" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="348" y1="162" x2="380" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="536" y1="162" x2="568" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />
      <line x1="704" y1="162" x2="736" y2="162" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-sa-chain)" />

      <rect x="160" y="264" width="540" height="64" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="290" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：`ServiceAccount` 是身份对象，token 是认证凭证，RBAC 才决定这个身份到底能做什么</text>
      <text x="430" y="310" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">如果 Pod 根本不需要调 API，最稳的做法通常是显式关闭自动挂载，而不是默认把凭证发进去</text>
    </svg>

    <svg
      v-else-if="kind === 'serviceaccount-token-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s ServiceAccount token 边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 53 - 回答 Pod 身份问题时，先分清“身份对象”“是否自动挂凭证”“凭证长什么样”“权限是谁给的”，不要把这几层混成一句“SA 就是权限”
      </text>

      <rect x="30" y="78" width="188" height="236" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">ServiceAccount</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">解决：Pod 以谁的身份出现</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不解决：具体能做哪些动作</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把它直接当权限</text>

      <rect x="234" y="78" width="188" height="236" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">automount</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：默认是否自动挂 API 凭证</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不解决：Pod 是否有 `serviceAccountName`</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：关掉自动挂载就等于没身份</text>

      <rect x="438" y="78" width="188" height="236" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">projected token</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">解决：短期、可轮转、可指定 audience</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不解决：应用是否会 reload 新 token</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">误区：以为 kubelet 轮转后应用自然无感</text>

      <rect x="642" y="78" width="188" height="236" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">RBAC / serviceaccounts/token</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">解决：身份具体拥有什么权限</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">敏感点：可为 SA 申请 token 的权限</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">误区：把认证失败和授权失败混一起</text>

      <rect x="78" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">身份名片</text>

      <rect x="282" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">是否发凭证</text>

      <rect x="486" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">短期工作负载 token</text>

      <rect x="690" y="228" width="92" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="250" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="268" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最终权限边界</text>

      <rect x="102" y="340" width="656" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先问 Pod 要不要 API 凭证，再问凭证该不该默认挂、受众是谁、会不会轮转，最后才看 RBAC 是否放对
      </text>
    </svg>

    <svg
      v-else-if="kind === 'rbac-evaluation-chain'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s RBAC 授权判断链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-rbac-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 54 - RBAC 真正判断的不是“你是不是开发”，而是“这个身份在这个作用域里，对这个资源和动作有没有被某条绑定规则放行”
      </text>

      <rect x="34" y="122" width="128" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="98" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">请求属性</text>
      <text x="98" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">subject / verb</text>
      <text x="98" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">resource / subresource / namespace</text>

      <rect x="194" y="108" width="156" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="272" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Binding 查找</text>
      <text x="272" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">RoleBinding</text>
      <text x="272" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ClusterRoleBinding</text>
      <text x="272" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">找到主体关联的规则集</text>

      <rect x="382" y="108" width="156" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="460" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">规则匹配</text>
      <text x="460" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">apiGroup / resource</text>
      <text x="460" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">verb / subresource</text>
      <text x="460" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">resourceNames / nonResourceURLs</text>

      <rect x="570" y="108" width="120" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="630" y="136" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">授权结果</text>
      <text x="630" y="156" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">allow / no opinion</text>
      <text x="630" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">没有显式 deny</text>

      <rect x="722" y="122" width="108" height="88" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="776" y="150" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Admission</text>
      <text x="776" y="170" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">授权通过后</text>
      <text x="776" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">还可能再被策略拦</text>

      <line x1="162" y1="166" x2="194" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="350" y1="166" x2="382" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="538" y1="166" x2="570" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />
      <line x1="690" y1="166" x2="722" y2="166" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rbac-chain)" />

      <rect x="138" y="286" width="584" height="58" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">重点别答错：RBAC 关注的是 allow 判断，不是全功能策略引擎；真正排障时还得继续区分认证、授权和准入三层</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`RoleBinding` 引用 `ClusterRole` 不会自动变成全集群授权，作用域仍受绑定位置约束</text>
    </svg>

    <svg
      v-else-if="kind === 'rbac-binding-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s RBAC 绑定与高危权限边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 55 - RBAC 最容易出事故的，不是字段写错，而是把“规则模板”“最终作用域”和“高危特殊 verb”混成一层
      </text>

      <rect x="30" y="78" width="188" height="238" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Role / ClusterRole</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">解决：定义权限规则</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把 `ClusterRole` 等同全集群权限</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">关键：它也可以只是复用模板</text>

      <rect x="234" y="78" width="188" height="238" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">RoleBinding / ClusterRoleBinding</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决：把规则绑给主体</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">关键：最终作用域由绑定决定</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：忽略 namespace 与 cluster 的差别</text>

      <rect x="438" y="78" width="188" height="238" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">高危资源与规则</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`secrets`、`pods/exec`、`roles`</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`rolebindings`、`serviceaccounts/token`</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">风险：横向移动与提权</text>

      <rect x="642" y="78" width="188" height="238" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">特殊 verbs</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`bind`：把权限发给别人</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`escalate`：定义更高权限规则</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`impersonate`：借别的身份发请求</text>

      <rect x="74" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">规则长什么样</text>

      <rect x="278" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">到底给到谁、多大范围</text>

      <rect x="482" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">高风险资源别轻放</text>

      <rect x="686" y="230" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="252" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="270" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">特殊 verb 更像提权手柄</text>

      <rect x="94" y="340" width="672" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="359" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：规则先做小，绑定先做窄，高危资源先质疑，`bind / escalate / impersonate` 先默认高危，再决定是否必须存在
      </text>
    </svg>

    <svg
      v-else-if="kind === 'pod-security-enforcement-chain'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod Security 与 SecurityContext 执行链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-security" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 56 - 容器运行权限真正要分两层：Pod spec 里声明怎么跑，Namespace 侧 Pod Security Admission 决定这样的 spec 能不能被放进集群
      </text>

      <rect x="30" y="124" width="132" height="92" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="96" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pod spec</text>
      <text x="96" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">securityContext</text>
      <text x="96" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">hostNetwork / hostPID / hostPath</text>

      <rect x="196" y="124" width="154" height="92" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="273" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Pod Security Admission</text>
      <text x="273" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">namespace labels</text>
      <text x="273" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">enforce / audit / warn</text>

      <rect x="384" y="124" width="148" height="92" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="458" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">准入结果</text>
      <text x="458" y="172" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">允许 / 告警 / 审计 / 拒绝</text>
      <text x="458" y="188" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">不会自动修复 spec</text>

      <rect x="566" y="124" width="124" height="92" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="628" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">kubelet / runtime</text>
      <text x="628" y="172" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">runAs / seccomp</text>
      <text x="628" y="188" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">capabilities / no_new_privs</text>

      <rect x="724" y="124" width="106" height="92" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="777" y="152" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">容器进程</text>
      <text x="777" y="172" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">最终以什么权限跑</text>
      <text x="777" y="188" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">真正落在这里</text>

      <line x1="162" y1="170" x2="196" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="350" y1="170" x2="384" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="532" y1="170" x2="566" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />
      <line x1="690" y1="170" x2="724" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-security)" />

      <rect x="150" y="286" width="560" height="62" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：PSA 决定能不能进，`securityContext` 决定进来后怎么跑；两者都不替应用修镜像、修目录权限或自动补安全字段</text>
      <text x="430" y="330" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">所以真正的落地顺序通常是镜像先支持，再写 spec，最后再在 namespace 维度逐步收紧准入</text>
    </svg>

    <svg
      v-else-if="kind === 'security-context-boundary-map'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s SecurityContext 边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 57 - 回答运行权限问题时，先分清“进程身份”“提权能力”“内核约束”“宿主机接触面”四层，不要只背一条 `runAsNonRoot`
      </text>

      <rect x="30" y="78" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">进程身份</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`runAsNonRoot`</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`runAsUser` / `runAsGroup`</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`fsGroup`</text>
      <text x="124" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">风险：镜像与卷权限不匹配</text>

      <rect x="234" y="78" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">提权能力</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`allowPrivilegeEscalation`</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`privileged`</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`capabilities`</text>
      <text x="328" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">风险：一旦 `privileged`，很多约束直接失效</text>

      <rect x="438" y="78" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">内核约束</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`seccompProfile`</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`appArmorProfile`</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`seLinuxOptions`</text>
      <text x="532" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">风险：只在 Linux 且受 runtime 支持影响</text>

      <rect x="642" y="78" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">宿主机接触面</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`hostNetwork` / `hostPID` / `hostIPC`</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`hostPath`</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险：隔离边界直接变薄</text>
      <text x="736" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">PSA Restricted 会重点限制这里</text>

      <rect x="84" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="124" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">谁在跑</text>

      <rect x="288" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="328" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能变强</text>

      <rect x="492" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="532" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">内核兜底</text>

      <rect x="696" y="238" width="80" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">记忆点</text>
      <text x="736" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">离宿主机多近</text>

      <rect x="88" y="342" width="684" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先让进程非 root，再禁提权、减能力、开内核约束，最后尽量远离宿主机；宿主机相关字段通常要先假定为高风险
      </text>
    </svg>

    <svg
      v-else-if="kind === 'admission-policy-chain'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Admission 与策略治理链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-admission" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 58 - Admission 发生在认证和授权之后、对象真正落库之前；内建插件、VAP、webhook 和策略引擎都在争夺这条入口，但职责并不一样
      </text>

      <rect x="24" y="126" width="118" height="88" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="83" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Authn / Authz</text>
      <text x="83" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">你是谁</text>
      <text x="83" y="190" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">能不能做</text>

      <rect x="172" y="112" width="136" height="116" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="240" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">内建 admission</text>
      <text x="240" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">LimitRanger</text>
      <text x="240" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ResourceQuota / PodSecurity</text>
      <text x="240" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">ServiceAccount</text>

      <rect x="338" y="112" width="136" height="116" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="406" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Mutating</text>
      <text x="406" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">内建 mutating</text>
      <text x="406" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">MutatingAdmissionWebhook</text>
      <text x="406" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">自动补字段</text>

      <rect x="504" y="112" width="136" height="116" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="572" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Validating</text>
      <text x="572" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ValidatingAdmissionPolicy</text>
      <text x="572" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">ValidatingAdmissionWebhook</text>
      <text x="572" y="192" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">最终拍板</text>

      <rect x="670" y="112" width="166" height="116" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="753" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">落库 / 控制循环</text>
      <text x="753" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象写入 etcd</text>
      <text x="753" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">controller 再继续 watch / reconcile</text>
      <text x="753" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">没过准入就到不了这一步</text>

      <line x1="142" y1="170" x2="172" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="308" y1="170" x2="338" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="474" y1="170" x2="504" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />
      <line x1="640" y1="170" x2="670" y2="170" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-admission)" />

      <rect x="142" y="286" width="576" height="58" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="310" text-anchor="middle" font-size="11" fill="var(--d-cur-text)">关键边界：mutating 先执行、validating 后拍板；对象一旦进不了 Admission，调度、运行时、控制器这几层都无从谈起</text>
      <text x="430" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">如果只是声明式校验，优先考虑内建 validating；真要 mutation、外部依赖或策略平台化，再考虑 webhook / policy engine</text>
    </svg>

    <svg
      v-else-if="kind === 'policy-engine-boundary-map'"
      viewBox="0 0 860 394"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 策略引擎边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 59 - 选治理工具时，先分清内建能力、内建 validating、外部 webhook 和完整策略平台，不要把 Gatekeeper、Kyverno、VAP 混成同一层
      </text>

      <rect x="30" y="78" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">内建 admission plugins</text>
      <text x="124" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">LimitRanger / ResourceQuota / PodSecurity</text>
      <text x="124" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">优点：最稳定、无额外组件</text>
      <text x="124" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">边界：只覆盖内建能力</text>

      <rect x="234" y="78" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">ValidatingAdmissionPolicy</text>
      <text x="328" y="132" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">优点：CEL、内建 validating、无外部 callout</text>
      <text x="328" y="150" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">边界：只能校验，不能 mutation</text>
      <text x="328" y="168" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">适合：简单到中等复杂度约束</text>

      <rect x="438" y="78" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Webhook / Gatekeeper</text>
      <text x="532" y="132" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">优点：扩展强、可模板化、可审计</text>
      <text x="532" y="150" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">边界：要养 webhook、高可用、超时治理</text>
      <text x="532" y="168" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">适合：复杂策略、OPA/Rego 体系</text>

      <rect x="642" y="78" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="106" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">Kyverno / 策略平台</text>
      <text x="736" y="132" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">优点：validate / mutate / generate / scan</text>
      <text x="736" y="150" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">边界：组件更多、治理面更大</text>
      <text x="736" y="168" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">适合：平台统一治理与后台报告</text>

      <rect x="74" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">先看内建是否够用</text>

      <rect x="278" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只校验就优先 VAP</text>

      <rect x="482" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">复杂约束才上 OPA 体系</text>

      <rect x="686" y="238" width="100" height="56" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="260" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">需要治理平台时再上</text>

      <rect x="94" y="342" width="672" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：先内建、再 VAP、后 webhook、最后策略平台；能力越强，治理面和运维成本通常也越大
      </text>
    </svg>
  </div>
</template>
