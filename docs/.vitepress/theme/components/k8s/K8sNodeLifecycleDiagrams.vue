<script setup lang="ts">
type DiagramKind =
  | 'node-heartbeat-eviction-chain'
  | 'node-condition-taint-eviction-boundary-map'
  | 'deletion-finalizer-gc-chain'
  | 'terminating-stuck-boundary-map'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div>
    <svg
      v-if="kind === 'node-heartbeat-eviction-chain'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 节点心跳到失联驱逐链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-node-heartbeat" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 66 - 节点失联后不是“立刻迁走”，而是沿着心跳、Lease、节点条件、自动 taint、Pod 容忍时间和 API 发起驱逐逐层收敛
      </text>

      <rect x="24" y="114" width="126" height="88" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">kubelet</text>
      <text x="87" y="162" text-anchor="middle" font-size="9" fill="var(--d-client-text)">发节点心跳</text>
      <text x="87" y="178" text-anchor="middle" font-size="9" fill="var(--d-client-text)">状态和 Lease</text>

      <rect x="178" y="100" width="148" height="116" rx="14" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="252" y="128" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">NodeStatus + Lease</text>
      <text x="252" y="148" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Lease` 默认更频繁</text>
      <text x="252" y="164" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">`Node.status` 更像状态快照</text>
      <rect x="210" y="180" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="252" y="195" text-anchor="middle" font-size="9" fill="var(--d-text)">控制面听心跳</text>

      <rect x="354" y="88" width="150" height="140" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="429" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">node controller</text>
      <text x="429" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">判断 `Ready=True/False/Unknown`</text>
      <text x="429" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">默认几十秒听不到会变 `Unknown`</text>
      <text x="429" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">不会一失联就立刻清场</text>
      <rect x="389" y="184" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="429" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">状态判断</text>

      <rect x="532" y="88" width="150" height="140" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="607" y="116" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">自动 taint</text>
      <text x="607" y="136" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`not-ready` / `unreachable`</text>
      <text x="607" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">scheduler 不再往坏节点放新 Pod</text>
      <text x="607" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`NoExecute` 参与存量处理</text>
      <rect x="567" y="184" width="80" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="607" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">调度收口</text>

      <rect x="710" y="74" width="126" height="168" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="773" y="102" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-warn-text)">Pod toleration</text>
      <text x="773" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">默认多为 300s</text>
      <text x="773" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">DaemonSet 常常无限忍</text>
      <text x="773" y="154" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">等到时间到了才继续驱逐</text>
      <rect x="731" y="184" width="84" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="773" y="199" text-anchor="middle" font-size="9" fill="var(--d-text)">忍多久</text>

      <line x1="150" y1="158" x2="178" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="326" y1="158" x2="354" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="504" y1="158" x2="532" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="682" y1="158" x2="710" y2="158" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />

      <rect x="208" y="278" width="186" height="86" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="301" y="306" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">API 发起驱逐</text>
      <text x="301" y="326" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">时间到了才会继续提交 eviction</text>
      <text x="301" y="342" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">而且控制器本身也会限速</text>

      <rect x="466" y="264" width="218" height="114" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="575" y="292" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">最难的边界</text>
      <text x="575" y="312" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">API 已经想删，不等于旧节点进程已停</text>
      <text x="575" y="328" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">网络分区时原进程可能还在跑</text>
      <text x="575" y="344" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">Stateful 服务还要考虑 fencing / 双活风险</text>

      <path d="M773 242 C773 272, 338 248, 301 278" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-heartbeat)" />
      <line x1="394" y1="321" x2="466" y2="321" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-node-heartbeat)" />
    </svg>

    <svg
      v-else-if="kind === 'node-condition-taint-eviction-boundary-map'"
      viewBox="0 0 860 396"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 节点条件 taint 与失联驱逐边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-node-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 67 - 回答节点故障时，先分清人工维护、健康判断、调度约束和存量驱逐四层边界，不要把 `cordon`、`Unknown`、`NoExecute` 混成一句话
      </text>

      <rect x="30" y="86" width="188" height="244" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">`cordon / drain`</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">人工维护流程</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`cordon`: 只禁止新调度</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`drain`: 主动迁走旧 Pod</text>
      <text x="124" y="210" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">运维是不是在做维护</text>
      <rect x="76" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">人工动作</text>

      <rect x="234" y="86" width="188" height="244" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Node Condition</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Ready=False`</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`Ready=Unknown`</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">是健康判断，不是迁移动作</text>
      <text x="328" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">控制面怎么看节点</text>
      <rect x="280" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">健康事实</text>

      <rect x="438" y="86" width="188" height="244" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">自动 taint</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`not-ready` / `unreachable`</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">让 scheduler 不再继续放新 Pod</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`NoExecute` 影响存量去留</text>
      <text x="532" y="210" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">调度和驱逐的约束信号是什么</text>
      <rect x="484" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">约束信号</text>

      <rect x="642" y="86" width="188" height="244" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">`NoExecute` + toleration</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">默认普通 Pod 常见 300 秒</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">DaemonSet 常常无限容忍</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">控制存量 Pod 何时被驱逐</text>
      <text x="736" y="210" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">存量什么时候才走</text>
      <rect x="688" y="286" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="305" text-anchor="middle" font-size="9" fill="var(--d-text)">走得多快</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-node-boundary)" />

      <rect x="120" y="350" width="620" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="369" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先分维护动作、健康事实、约束信号、驱逐时机，再去判断原节点上的进程是否真的停了
      </text>
    </svg>

    <svg
      v-else-if="kind === 'deletion-finalizer-gc-chain'"
      viewBox="0 0 860 390"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s 删除 finalizer 与垃圾回收链路图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-delete-chain" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 68 - K8s 的 delete 不是立刻物理删除，而是沿着 `deletionTimestamp`、finalizer、优雅退出和垃圾回收逐步收敛
      </text>

      <rect x="24" y="126" width="126" height="82" rx="14" fill="var(--d-client-bg)" stroke="var(--d-client-border)" />
      <text x="87" y="154" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-client-text)">DELETE 请求</text>
      <text x="87" y="174" text-anchor="middle" font-size="9" fill="var(--d-client-text)">`kubectl delete`</text>
      <text x="87" y="190" text-anchor="middle" font-size="9" fill="var(--d-client-text)">或 API DELETE</text>

      <rect x="180" y="104" width="164" height="126" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="262" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-text)">apiserver 标记删除</text>
      <text x="262" y="152" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">写 `deletionTimestamp`</text>
      <text x="262" y="168" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">对象进入删除中</text>
      <text x="262" y="184" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">很多 CLI 会显示 `Terminating`</text>
      <rect x="218" y="196" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="262" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">先打标记</text>

      <rect x="374" y="84" width="190" height="166" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="469" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-c-text)">删除阻塞层</text>
      <text x="469" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">`metadata.finalizers` 还没清空</text>
      <text x="469" y="148" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">controller 先做外部资源清理</text>
      <text x="469" y="164" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">Pod 还可能要走 `preStop / SIGTERM / grace`</text>
      <text x="469" y="180" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">节点失联时，API 和节点进程不一定同步</text>
      <rect x="421" y="204" width="96" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="469" y="219" text-anchor="middle" font-size="9" fill="var(--d-text)">先收尾</text>

      <rect x="594" y="104" width="166" height="126" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="677" y="132" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-rv-b-text)">GC + ownerReferences</text>
      <text x="677" y="152" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">看 dependents 怎么收敛</text>
      <text x="677" y="168" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">`Background / Foreground / Orphan`</text>
      <text x="677" y="184" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">前台删除时 owner 会继续等 child</text>
      <rect x="633" y="196" width="88" height="22" rx="11" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="677" y="211" text-anchor="middle" font-size="9" fill="var(--d-text)">再级联</text>

      <line x1="150" y1="167" x2="180" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />
      <line x1="344" y1="167" x2="374" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />
      <line x1="564" y1="167" x2="594" y2="167" stroke="var(--d-arrow)" stroke-width="1.7" marker-end="url(#k8s-arrow-delete-chain)" />

      <rect x="268" y="286" width="324" height="74" rx="16" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="var(--d-cur-text)">真正删除</text>
      <text x="430" y="334" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">`finalizers` 为空、阻塞依赖已清、删除流程收口</text>
      <text x="430" y="350" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">对象这时才会真正从 API 里消失</text>

      <path d="M677 230 C677 266, 548 286, 592 323" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-delete-chain)" />
      <path d="M469 250 C469 274, 408 278, 356 286" fill="none" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-delete-chain)" />
      <rect x="110" y="334" width="112" height="26" rx="13" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="166" y="351" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">别把 delete 当瞬时动作</text>
    </svg>

    <svg
      v-else-if="kind === 'terminating-stuck-boundary-map'"
      viewBox="0 0 860 404"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="K8s Terminating 卡死边界图"
      role="img"
    >
      <defs>
        <marker id="k8s-arrow-terminating-boundary" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <text x="430" y="26" text-anchor="middle" font-size="15" font-weight="700" fill="var(--d-text)">
        图 69 - 资源卡 `Terminating` 时，先分清 Pod 退出、Finalizer、GC 级联和人工强删四层边界，不要把所有现场混成一句话
      </text>

      <rect x="30" y="86" width="188" height="246" rx="16" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" />
      <text x="124" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-text)">Pod 退出链路</text>
      <text x="124" y="140" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`preStop`</text>
      <text x="124" y="158" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`SIGTERM`</text>
      <text x="124" y="176" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">`terminationGracePeriodSeconds`</text>
      <text x="124" y="194" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">卷卸载、kubelet、节点可达性</text>
      <text x="124" y="228" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">回答的问题：</text>
      <text x="124" y="246" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">进程和节点侧到底退干净没有</text>
      <rect x="76" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="124" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">退出没走完？</text>

      <rect x="234" y="86" width="188" height="246" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" />
      <text x="328" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-c-text)">Finalizer 清理</text>
      <text x="328" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`deletionTimestamp` 已写入</text>
      <text x="328" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">`metadata.finalizers` 还不为空</text>
      <text x="328" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">Operator / controller 在清外部资源</text>
      <text x="328" y="194" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">也可能是 controller 已下线</text>
      <text x="328" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">回答的问题：</text>
      <text x="328" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">是不是还有人声明“先别删完”</text>
      <rect x="280" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="328" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">谁在拦删除？</text>

      <rect x="438" y="86" width="188" height="246" rx="16" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" />
      <text x="532" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-rv-b-text)">GC / ownerReferences</text>
      <text x="532" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">`Foreground / Background / Orphan`</text>
      <text x="532" y="158" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">owner 在等 child，还是 child 被保留</text>
      <text x="532" y="176" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">child 自己也可能卡着 finalizer</text>
      <text x="532" y="194" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">别只盯 owner 本身</text>
      <text x="532" y="228" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">回答的问题：</text>
      <text x="532" y="246" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">下游依赖是不是还没收口</text>
      <rect x="484" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="532" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">是谁在等谁</text>

      <rect x="642" y="86" width="188" height="246" rx="16" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" />
      <text x="736" y="114" text-anchor="middle" font-size="13" font-weight="700" fill="var(--d-warn-text)">人工强删</text>
      <text x="736" y="140" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">`--force --grace-period=0`</text>
      <text x="736" y="158" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">patch 清空 `finalizers`</text>
      <text x="736" y="176" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">能清现场，不等于清后果</text>
      <text x="736" y="194" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">风险是 orphan、漏清理、双活</text>
      <text x="736" y="228" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">回答的问题：</text>
      <text x="736" y="246" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">你是不是只在消症状</text>
      <rect x="688" y="288" width="96" height="28" rx="14" fill="var(--vp-c-bg-elv)" stroke="var(--d-border)" />
      <text x="736" y="307" text-anchor="middle" font-size="9" fill="var(--d-text)">风险自负</text>

      <line x1="218" y1="206" x2="234" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />
      <line x1="422" y1="206" x2="438" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />
      <line x1="626" y1="206" x2="642" y2="206" stroke="var(--d-arrow)" stroke-width="1.5" marker-end="url(#k8s-arrow-terminating-boundary)" />

      <rect x="116" y="352" width="628" height="28" rx="14" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" />
      <text x="430" y="371" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">
        口诀：先看 `deletionTimestamp`，再看 `finalizers`、`ownerReferences`、节点与 kubelet，最后才考虑强删
      </text>
    </svg>
  </div>
</template>
