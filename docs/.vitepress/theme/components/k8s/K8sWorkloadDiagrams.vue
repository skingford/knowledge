<script setup lang="ts">
type DiagramKind =
  | 'statefulset-stable-identity'
  | 'headless-service-dns'
  | 'zero-downtime-rollout-chain'
  | 'pod-termination-timeline'
  | 'pod-lifecycle-state-flow'
  | 'probe-gating-chain'
  | 'pod-collaboration-chain'
  | 'pod-container-role-map'
  | 'job-cronjob-control-chain'
  | 'workload-controller-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'statefulset-stable-identity'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="StatefulSet 稳定身份图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-stateful" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 11 - StatefulSet 稳定的不是 Pod IP，而是实例身份、DNS 名称和 PVC 绑定
      </text>

      <rect x="48" y="108" width="172" height="86" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="134" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">StatefulSet</text>
      <text x="134" y="156" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">按 ordinal 管理成员</text>
      <text x="134" y="174" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">创建和删除更保守</text>

      <rect x="274" y="108" width="168" height="86" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="358" y="136" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Headless Service</text>
      <text x="358" y="156" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">clusterIP: None</text>
      <text x="358" y="174" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">负责成员 DNS 发现</text>

      <line x1="220" y1="151" x2="274" y2="151" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="506" y="58" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-0</text>
      <text x="568" y="102" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="116" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">IP 可变，名字不变</text>

      <rect x="506" y="138" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="164" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-1</text>
      <text x="568" y="182" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="196" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">成员身份可复用</text>

      <rect x="506" y="218" width="124" height="66" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="568" y="244" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">mysql-2</text>
      <text x="568" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">稳定实例名</text>
      <text x="568" y="276" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">适合主从 / 分片成员</text>

      <line x1="442" y1="151" x2="506" y2="91" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="442" y1="151" x2="506" y2="171" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="442" y1="151" x2="506" y2="251" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="668" y="58" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="84" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-0</text>
      <rect x="668" y="138" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="164" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-1</text>
      <rect x="668" y="218" width="150" height="42" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="743" y="244" text-anchor="middle" font-size="11" fill="var(--d-rv-b-text)">PVC: data-mysql-2</text>

      <line x1="630" y1="91" x2="668" y2="79" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="630" y1="171" x2="668" y2="159" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />
      <line x1="630" y1="251" x2="668" y2="239" stroke="var(--d-arrow)" stroke-width="1.4" marker-end="url(#k8s-arrow-stateful)" />

      <rect x="118" y="298" width="624" height="26" rx="13" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="316" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        关键结论：实例身份稳定靠名称、DNS 和卷绑定，Pod IP 本身仍然可能变化
      </text>
    </svg>

    <svg
      v-else-if="kind === 'headless-service-dns'"
      viewBox="0 0 860 320"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Headless Service DNS 解析图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-headless" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 12 - Headless Service 不给你虚拟 VIP，而是把 DNS 解析直接指向具体成员记录
      </text>

      <rect x="56" y="114" width="170" height="62" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="141" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">Client / Peer</text>
      <text x="141" y="158" text-anchor="middle" font-size="9" fill="var(--d-client-text)">查询 mysql.default.svc</text>

      <rect x="280" y="96" width="176" height="96" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="368" y="124" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">CoreDNS + Headless Service</text>
      <text x="368" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">clusterIP: None</text>
      <text x="368" y="164" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">返回成员记录，不做 VIP 转发</text>
      <text x="368" y="182" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">例如 mysql-0 / mysql-1 / mysql-2</text>

      <line x1="226" y1="145" x2="280" y2="145" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-headless)" />

      <rect x="516" y="58" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="82" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-0.mysql.default.svc.cluster.local</text>
      <text x="650" y="100" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-0 当前 Pod IP</text>

      <rect x="516" y="132" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-1.mysql.default.svc.cluster.local</text>
      <text x="650" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-1 当前 Pod IP</text>

      <rect x="516" y="206" width="268" height="58" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="650" y="230" text-anchor="middle" font-size="11" font-weight="700" fill="var(--d-text)">mysql-2.mysql.default.svc.cluster.local</text>
      <text x="650" y="248" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">指向 mysql-2 当前 Pod IP</text>

      <line x1="456" y1="145" x2="516" y2="87" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />
      <line x1="456" y1="145" x2="516" y2="161" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />
      <line x1="456" y1="145" x2="516" y2="235" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-headless)" />

      <rect x="116" y="280" width="628" height="24" rx="12" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="297" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        普通 Service 稳定的是一组 Pod 的入口；Headless Service 稳定的是成员发现方式
      </text>
    </svg>

    <svg
      v-else-if="kind === 'zero-downtime-rollout-chain'"
      viewBox="0 0 860 334"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 零停机发布链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-rollout-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 13 - 真正的零停机不是一个开关，而是发布控制、流量切换和应用退出时序共同配合
      </text>

      <rect x="42" y="104" width="162" height="78" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="123" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Deployment</text>
      <text x="123" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">maxSurge / maxUnavailable</text>
      <text x="123" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">控制新旧 Pod 切换节奏</text>

      <rect x="242" y="104" width="166" height="78" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="325" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Readiness / EndpointSlice</text>
      <text x="325" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">新 Pod 通过后才进后端池</text>
      <text x="325" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">旧 Pod 失败后先摘流量</text>

      <rect x="446" y="104" width="166" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="529" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">preStop + SIGTERM</text>
      <text x="529" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">先等流量摘除</text>
      <text x="529" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">再处理存量请求并退出</text>

      <rect x="650" y="104" width="166" height="78" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="733" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">PDB + 调度冗余</text>
      <text x="733" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">避免自愿驱逐同时清空副本</text>
      <text x="733" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">兜底发布与维护期可用性</text>

      <line x1="204" y1="143" x2="242" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />
      <line x1="408" y1="143" x2="446" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />
      <line x1="612" y1="143" x2="650" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-rollout-chain)" />

      <rect x="84" y="226" width="692" height="68" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="430" y="250" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">关键判断</text>
      <text x="430" y="270" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">新 Pod 没准备好不能提前接流量，旧 Pod 没摘流量不能立即退出</text>
      <text x="430" y="286" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">只配 Deployment 策略不够，应用、探针、Service 收敛和终止时序必须一起正确</text>
    </svg>

    <svg
      v-else-if="kind === 'pod-termination-timeline'"
      viewBox="0 0 860 344"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Pod 终止时序图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-termination" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 14 - 旧 Pod 正确下线的顺序应是：先摘流量，再收尾，再退出，最后才可能被强杀
      </text>

      <line x1="88" y1="174" x2="788" y2="174" stroke="var(--d-border)" stroke-width="2" />

      <rect x="92" y="130" width="112" height="38" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="148" y="154" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">DeletionTimestamp</text>

      <rect x="230" y="118" width="116" height="50" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="288" y="140" text-anchor="middle" font-size="10" fill="var(--d-text)">preStop</text>
      <text x="288" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等待 LB / Service 收敛</text>

      <rect x="382" y="118" width="124" height="50" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="444" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">SIGTERM</text>
      <text x="444" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">停止接新请求，处理存量</text>

      <rect x="544" y="118" width="132" height="50" rx="10" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="610" y="140" text-anchor="middle" font-size="10" fill="var(--d-text)">Grace Period</text>
      <text x="610" y="156" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">terminationGracePeriodSeconds</text>

      <rect x="712" y="130" width="88" height="38" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="756" y="154" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">SIGKILL</text>

      <line x1="204" y1="149" x2="230" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="346" y1="149" x2="382" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="506" y1="149" x2="544" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />
      <line x1="676" y1="149" x2="712" y2="149" stroke="var(--d-arrow)" stroke-width="1.6" marker-end="url(#k8s-arrow-termination)" />

      <rect x="156" y="234" width="548" height="54" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="256" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">如果 preStop 太短、readiness 摘流量太慢，SIGTERM 后仍可能有新流量打进来</text>
      <text x="430" y="274" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">如果 graceful shutdown 超过 grace period，最终会被 SIGKILL，请求仍然会中断</text>
    </svg>

    <svg
      v-else-if="kind === 'pod-lifecycle-state-flow'"
      viewBox="0 0 860 360"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 生命周期状态流转图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-life" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 26 - Pod 生命周期里最关键的边界不是“进程起来了”，而是“什么时候 Ready、什么时候异常重启、什么时候开始退出”
      </text>

      <rect x="32" y="104" width="124" height="78" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="94" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Pending</text>
      <text x="94" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">等调度 / 等卷 / 等镜像</text>
      <text x="94" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod phase</text>

      <rect x="190" y="104" width="136" height="78" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="258" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">ContainerCreating</text>
      <text x="258" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">网络、卷、镜像、init</text>
      <text x="258" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">CLI 现场状态</text>

      <rect x="360" y="104" width="124" height="78" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="422" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Running</text>
      <text x="422" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">进程已启动</text>
      <text x="422" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">但不一定能接流量</text>

      <rect x="518" y="104" width="124" height="78" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="580" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Ready</text>
      <text x="580" y="152" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">readiness 通过</text>
      <text x="580" y="168" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">允许进入后端池</text>

      <rect x="690" y="104" width="138" height="78" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="759" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Terminating</text>
      <text x="759" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">DeletionTimestamp</text>
      <text x="759" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">preStop / SIGTERM / grace</text>

      <line x1="156" y1="143" x2="190" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="326" y1="143" x2="360" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="484" y1="143" x2="518" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />
      <line x1="642" y1="143" x2="690" y2="143" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />

      <rect x="276" y="236" width="292" height="82" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="422" y="264" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">CrashLoopBackOff</text>
      <text x="422" y="284" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">常见原因：进程退出、配置错误、端口冲突</text>
      <text x="422" y="300" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">或 liveness 太激进、慢启动却没配 startupProbe</text>

      <line x1="422" y1="182" x2="422" y2="236" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-life)" />

      <rect x="88" y="324" width="684" height="22" rx="11" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="339" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        重点区分：Pod phase 很粗，容器状态更细，kubectl STATUS 还会把现场现象像 CrashLoopBackOff、ContainerCreating 直接展示出来
      </text>
    </svg>

    <svg
      v-else-if="kind === 'probe-gating-chain'"
      viewBox="0 0 860 356"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 探针接管链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-probe-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 27 - 三类探针不是并列关系：通常先保护启动，再决定能不能接流量，最后才长期检查是否要重启
      </text>

      <rect x="38" y="112" width="150" height="82" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="113" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">startupProbe</text>
      <text x="113" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">保护慢启动</text>
      <text x="113" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">没成功前别急着判死</text>

      <rect x="236" y="112" width="154" height="82" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="313" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">应用启动完成</text>
      <text x="313" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">配置、缓存、连接池</text>
      <text x="313" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">预热完成</text>

      <rect x="438" y="112" width="154" height="82" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="515" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">readinessProbe</text>
      <text x="515" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">判断能否接流量</text>
      <text x="515" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">失败时摘出 EndpointSlice</text>

      <rect x="640" y="112" width="182" height="82" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="731" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">livenessProbe</text>
      <text x="731" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">运行期长期检查</text>
      <text x="731" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">失败时触发容器重启</text>

      <line x1="188" y1="153" x2="236" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="390" y1="153" x2="438" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="592" y1="153" x2="640" y2="153" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-probe-chain)" />

      <rect x="90" y="242" width="266" height="66" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="223" y="268" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">readiness 失败</text>
      <text x="223" y="288" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">通常是摘流量，不一定重启</text>

      <rect x="504" y="242" width="266" height="66" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="637" y="268" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">liveness 失败</text>
      <text x="637" y="288" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">通常会重启容器，误配会制造 CrashLoop</text>

      <line x1="515" y1="194" x2="278" y2="242" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-probe-chain)" />
      <line x1="731" y1="194" x2="637" y2="242" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-probe-chain)" />
    </svg>

    <svg
      v-else-if="kind === 'pod-collaboration-chain'"
      viewBox="0 0 860 388"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 多容器协作链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-pod-collab" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 25A - Pod 之所以是最小调度单元，不是因为“能装多个容器”，而是因为它定义了共享网络、共享卷和共同调度的协作边界
      </text>

      <rect x="34" y="140" width="118" height="70" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="93" y="166" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">调度 / 绑定</text>
      <text x="93" y="184" text-anchor="middle" font-size="9" fill="var(--d-client-text)">scheduler 选节点</text>
      <text x="93" y="198" text-anchor="middle" font-size="9" fill="var(--d-client-text)">Pod 整体上节点</text>

      <rect x="190" y="74" width="496" height="236" rx="20" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-width="1.6" />
      <text x="438" y="102" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Pod 边界</text>
      <text x="438" y="120" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">同一个 Pod IP、同一个 localhost、同一个端口空间、同一组卷挂载上下文</text>

      <rect x="224" y="144" width="170" height="58" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="309" y="168" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">Init Container</text>
      <text x="309" y="186" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">启动前顺序执行</text>

      <rect x="246" y="232" width="150" height="64" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="321" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">主容器</text>
      <text x="321" y="274" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">真正承载业务流量</text>

      <rect x="464" y="232" width="150" height="64" rx="12" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="539" y="256" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Sidecar</text>
      <text x="539" y="274" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">日志 / 代理 / 同步 / 治理</text>

      <rect x="424" y="144" width="224" height="58" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="536" y="168" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-a-text)">共享资源面</text>
      <text x="536" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">localhost 通信 + emptyDir / config / socket / log</text>

      <rect x="706" y="116" width="122" height="78" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" stroke-dasharray="6 4" />
      <text x="767" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">临时容器</text>
      <text x="767" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">已有 Pod 注入</text>
      <text x="767" y="174" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只用于排障</text>

      <line x1="152" y1="175" x2="190" y2="175" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <line x1="309" y1="202" x2="309" y2="232" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <line x1="394" y1="264" x2="464" y2="264" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-pod-collab)" />
      <path d="M706 194 C676 220, 646 228, 614 240" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-pod-collab)" />

      <rect x="224" y="320" width="462" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="455" y="339" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        一旦需要独立扩缩容、独立发布节奏、独立故障域或独立 Service 暴露，通常就应该拆成独立工作负载
      </text>
    </svg>

    <svg
      v-else-if="kind === 'pod-container-role-map'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Pod 容器角色边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 25B - 多容器 Pod 真正要分清的不是“都在一个 YAML 里”，而是它们在 Pod 生命周期里的职责边界完全不同
      </text>

      <rect x="30" y="72" width="188" height="230" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="124" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">主容器</text>
      <text x="124" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">启动时机：业务正式开始时</text>
      <text x="124" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">生命周期：贯穿 Pod 运行期</text>
      <text x="124" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">职责：真正承载请求或任务</text>
      <text x="124" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">误区：把日志、代理、同步全塞进来</text>
      <rect x="56" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="124" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">它负责业务本身，不负责把一切伴生能力都吞进去</text>

      <rect x="234" y="72" width="188" height="230" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="328" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Init Container</text>
      <text x="328" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">启动时机：主容器之前</text>
      <text x="328" y="146" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">生命周期：顺序执行，成功后退出</text>
      <text x="328" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">职责：依赖检查、配置生成、一次性准备</text>
      <text x="328" y="186" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">误区：拿它做长期同步或日志采集</text>
      <rect x="260" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="328" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">只解决启动前阻塞条件，不解决运行期伴生能力</text>

      <rect x="438" y="72" width="188" height="230" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="532" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">Sidecar</text>
      <text x="532" y="126" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">启动时机：伴随主容器前后接入</text>
      <text x="532" y="146" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">生命周期：与主容器并行常驻</text>
      <text x="532" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">职责：日志、代理、证书/配置热同步</text>
      <text x="532" y="186" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">误区：把独立业务硬塞成第二主服务</text>
      <rect x="464" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="532" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">长期伴生，不等于能替代独立 Deployment / Service</text>

      <rect x="642" y="72" width="188" height="230" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="736" y="100" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">临时容器</text>
      <text x="736" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">启动时机：Pod 运行后人工注入</text>
      <text x="736" y="146" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">生命周期：临时存在，不是正式发布物</text>
      <text x="736" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">职责：线上调试、观察、排障</text>
      <text x="736" y="186" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">误区：把排障容器写成正式架构组成部分</text>
      <rect x="668" y="220" width="136" height="54" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="244" text-anchor="middle" font-size="10" fill="var(--d-text)">一句话</text>
      <text x="736" y="262" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">它解决“怎么查”，不解决“怎么跑”</text>

      <rect x="78" y="328" width="704" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="347" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选择口诀：启动前一次性任务用 Init，运行期伴生能力用 Sidecar，正式流量归主容器，线上排障才用临时容器
      </text>
    </svg>

    <svg
      v-else-if="kind === 'job-cronjob-control-chain'"
      viewBox="0 0 860 382"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Job 与 CronJob 控制链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-job-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 48 - CronJob 自己不直接跑 Pod，它只负责按计划创建 Job；真正决定任务完成、重试和失败收敛的还是 Job 控制链路
      </text>

      <rect x="30" y="128" width="124" height="72" rx="12" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="92" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">schedule</text>
      <text x="92" y="172" text-anchor="middle" font-size="9" fill="var(--d-client-text)">cron 表达式</text>
      <text x="92" y="186" text-anchor="middle" font-size="9" fill="var(--d-client-text)">timeZone</text>

      <rect x="184" y="112" width="152" height="104" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="260" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">CronJob</text>
      <text x="260" y="160" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">concurrencyPolicy</text>
      <text x="260" y="176" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">startingDeadlineSeconds</text>
      <text x="260" y="192" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">suspend / historyLimit</text>

      <rect x="366" y="112" width="138" height="104" rx="14" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="435" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">Job</text>
      <text x="435" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">parallelism / completions</text>
      <text x="435" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">backoffLimit</text>
      <text x="435" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">deadline / TTL</text>

      <rect x="534" y="112" width="138" height="104" rx="14" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="603" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">Pod</text>
      <text x="603" y="160" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">调度 / 拉镜像 / 执行任务</text>
      <text x="603" y="176" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">退出码与日志</text>
      <text x="603" y="192" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">Succeeded / Failed</text>

      <rect x="702" y="112" width="128" height="104" rx="14" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="766" y="140" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">结果</text>
      <text x="766" y="160" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">成功完成</text>
      <text x="766" y="176" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">继续重试</text>
      <text x="766" y="192" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">达到失败上限</text>

      <line x1="154" y1="164" x2="184" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="336" y1="164" x2="366" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="504" y1="164" x2="534" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />
      <line x1="672" y1="164" x2="702" y2="164" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-job-chain)" />

      <path d="M603 216 C603 270, 435 270, 435 216" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#k8s-arrow-job-chain)" />
      <text x="519" y="286" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Pod 的退出结果会回流到 Job 状态，Job 再决定是否继续补 Pod、重试或结束</text>

      <rect x="114" y="322" width="632" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="341" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        排障顺序也该按这条链路看：CronJob 是否触发 -> Job 是否生成 -> Pod 为什么失败 -> 业务是否幂等
      </text>
    </svg>

    <svg
      v-else-if="kind === 'workload-controller-boundary-map'"
      viewBox="0 0 860 392"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 工作负载控制器边界图"
      role="img"
    >
      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 49 - 同样都叫“工作负载”，但五类控制器关心的根本不是同一个目标：在线、稳定身份、每节点驻留、一次性完成、按计划触发
      </text>

      <rect x="34" y="76" width="154" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="111" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Deployment</text>
      <text x="111" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">目标：持续在线</text>
      <text x="111" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">对象：无状态服务</text>
      <text x="111" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">能力：副本、滚动更新、回滚</text>
      <text x="111" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">不适合：一次性任务</text>
      <rect x="54" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="111" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="111" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">API 服务</text>
      <text x="111" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">Web 服务</text>

      <rect x="198" y="76" width="154" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="275" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">StatefulSet</text>
      <text x="275" y="130" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">目标：稳定身份</text>
      <text x="275" y="148" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">对象：有状态副本</text>
      <text x="275" y="166" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">能力：固定名称、稳定 PVC</text>
      <text x="275" y="184" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">不适合：短命批处理</text>
      <rect x="218" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="275" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="275" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">数据库</text>
      <text x="275" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">消息队列成员节点</text>

      <rect x="362" y="76" width="154" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="439" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">DaemonSet</text>
      <text x="439" y="130" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">目标：每节点驻留</text>
      <text x="439" y="148" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">对象：节点级代理</text>
      <text x="439" y="166" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">能力：跟节点数量变化联动</text>
      <text x="439" y="184" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">不适合：按时间调度任务</text>
      <rect x="382" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="439" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="439" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">日志 Agent</text>
      <text x="439" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">监控 Agent</text>

      <rect x="526" y="76" width="154" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="603" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">Job</text>
      <text x="603" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">目标：成功完成</text>
      <text x="603" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">对象：一次性批处理</text>
      <text x="603" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">能力：重试、并发、完成数</text>
      <text x="603" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">不适合：长期常驻服务</text>
      <rect x="546" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="603" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="603" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">数据修复</text>
      <text x="603" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">离线导出 / 对账</text>

      <rect x="690" y="76" width="140" height="244" rx="16" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" />
      <text x="760" y="104" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-a-text)">CronJob</text>
      <text x="760" y="130" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">目标：按计划触发</text>
      <text x="760" y="148" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">对象：周期性 Job</text>
      <text x="760" y="166" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">能力：并发策略、补跑窗口</text>
      <text x="760" y="184" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">不适合：严格一次且绝不重入</text>
      <rect x="703" y="222" width="114" height="68" rx="12" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="760" y="246" text-anchor="middle" font-size="10" fill="var(--d-text)">典型场景</text>
      <text x="760" y="264" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">定时汇总</text>
      <text x="760" y="278" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">周期清理</text>

      <rect x="82" y="342" width="696" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="361" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        选型口诀：在线服务看 Deployment，稳定身份看 StatefulSet，每节点驻留看 DaemonSet，一次性完成看 Job，周期触发看 CronJob
      </text>
    </svg>
  </div>
</template>
