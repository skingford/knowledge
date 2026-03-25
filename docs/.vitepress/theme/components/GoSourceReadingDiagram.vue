<script setup lang="ts">
import { computed } from 'vue'
import DiagramFrame from '@docs-components/DiagramFrame.vue'

type DiagramKind =
  | 'entry-map'
  | 'reading-method'
  | 'runtime-route'
  | 'archive-redirect'

const props = defineProps<{
  kind: DiagramKind
}>()

const maxWidthByKind: Record<DiagramKind, string> = {
  'entry-map': '760px',
  'reading-method': '760px',
  'runtime-route': '760px',
  'archive-redirect': '620px',
}

const maxWidth = computed(() => maxWidthByKind[props.kind])
</script>

<template>
  <DiagramFrame :max-width="maxWidth">
    <svg
      v-if="kind === 'entry-map'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="源码精读入口关系图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">先分清入口页职责，再进入单篇源码文章，阅读路径会稳定很多</text>

      <rect x="30" y="58" width="220" height="140" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.5" />
      <text x="140" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-text)">learning-path</text>
      <text x="140" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">主线、方法、版本、资料</text>
      <text x="140" y="126" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">解决“先读什么、怎么读”</text>
      <text x="140" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入口 1：先建立路线感</text>

      <rect x="270" y="58" width="220" height="140" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.5" />
      <text x="380" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-b-text)">source-reading/index</text>
      <text x="380" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">按主题找包</text>
      <text x="380" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">runtime / 并发 / 网络 / I/O / 工程化</text>
      <text x="380" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入口 2：按问题检索文章</text>

      <rect x="510" y="58" width="220" height="140" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.5" />
      <text x="620" y="86" text-anchor="middle" font-size="12" font-weight="bold" fill="var(--d-rv-a-text)">单篇精读文章</text>
      <text x="620" y="108" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">goroutine / chan / gc / net/http ...</text>
      <text x="620" y="126" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">源码结构、状态机、示例、排障线索</text>
      <text x="620" y="160" text-anchor="middle" font-size="10" fill="var(--d-text-muted)">入口 3：落到具体包实现</text>

      <line x1="250" y1="128" x2="270" y2="128" stroke="var(--d-blue-border)" stroke-width="1.8" marker-end="url(#srcEntryA)" />
      <line x1="490" y1="128" x2="510" y2="128" stroke="var(--d-rv-b-border)" stroke-width="1.8" marker-end="url(#srcEntryB)" />

      <rect x="166" y="214" width="428" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="380" y="230" text-anchor="middle" font-size="9" fill="var(--d-text)">推荐顺序：先用主线页确定阅读顺序，再用索引页定位文章，最后回到单篇里看数据结构和状态机</text>

      <defs>
        <marker id="srcEntryA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" />
        </marker>
        <marker id="srcEntryB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-b-border)" />
        </marker>
      </defs>
    </svg>

    <svg
      v-else-if="kind === 'reading-method'"
      viewBox="0 0 760 280"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="源码阅读方法图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">源码阅读不要一上来就钻实现细枝末节，先把版本、入口、状态机和验证手段串成闭环</text>

      <rect x="24" y="78" width="118" height="76" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="83" y="104" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-text)">1. 对齐版本</text>
      <text x="83" y="122" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">go version</text>
      <text x="83" y="138" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">release tag / cs</text>

      <rect x="170" y="78" width="118" height="76" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="229" y="104" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-b-text)">2. 找入口</text>
      <text x="229" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">包注释 / 文件头</text>
      <text x="229" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">关键 API / 调用链</text>

      <rect x="316" y="78" width="118" height="76" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="375" y="104" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-rv-c-text)">3. 画状态机</text>
      <text x="375" y="122" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">G 状态</text>
      <text x="375" y="138" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">队列 / 生命周期</text>

      <rect x="462" y="78" width="118" height="76" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.4" />
      <text x="521" y="104" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-cur-text)">4. 看数据结构</text>
      <text x="521" y="122" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">hchan / mcache</text>
      <text x="521" y="138" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">字段职责</text>

      <rect x="608" y="78" width="128" height="76" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="672" y="104" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">5. 反向验证</text>
      <text x="672" y="122" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">-gcflags=-S</text>
      <text x="672" y="138" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">dlv / pprof / trace</text>

      <line x1="142" y1="116" x2="170" y2="116" stroke="var(--d-blue-border)" stroke-width="1.6" marker-end="url(#srcMethodA)" />
      <line x1="288" y1="116" x2="316" y2="116" stroke="var(--d-rv-b-border)" stroke-width="1.6" marker-end="url(#srcMethodB)" />
      <line x1="434" y1="116" x2="462" y2="116" stroke="var(--d-rv-c-border)" stroke-width="1.6" marker-end="url(#srcMethodC)" />
      <line x1="580" y1="116" x2="608" y2="116" stroke="var(--d-cur-border)" stroke-width="1.6" marker-end="url(#srcMethodD)" />

      <rect x="94" y="188" width="572" height="58" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="380" y="210" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--d-text-sub)">稳定节奏</text>
      <text x="380" y="228" text-anchor="middle" font-size="9" fill="var(--d-text)">版本对齐后先抓“入口 + 状态机”，再补“字段 + 分支”，最后用编译输出、调试器或 profile 验证理解是否和运行时一致</text>

      <defs>
        <marker id="srcMethodA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" />
        </marker>
        <marker id="srcMethodB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-b-border)" />
        </marker>
        <marker id="srcMethodC" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-c-border)" />
        </marker>
        <marker id="srcMethodD" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-cur-border)" />
        </marker>
      </defs>
    </svg>

    <svg
      v-else-if="kind === 'runtime-route'"
      viewBox="0 0 760 250"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="runtime 主线阅读路线图"
      role="img"
    >
      <text x="380" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">runtime 主线建议按“创建与调度 → 同步 → 分配 → 回收 → 观测”推进，后面的理解会建立在前面之上</text>

      <rect x="26" y="94" width="88" height="54" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="70" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">goroutine</text>
      <text x="70" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">创建 / 栈 / 退出</text>

      <rect x="128" y="94" width="88" height="54" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="172" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">scheduler</text>
      <text x="172" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">G / M / P</text>

      <rect x="230" y="94" width="88" height="54" rx="10" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="274" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-c-text)">channel</text>
      <text x="274" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-c-text)">hchan / sudog</text>

      <rect x="332" y="94" width="88" height="54" rx="10" fill="var(--d-cur-bg)" stroke="var(--d-cur-border)" stroke-width="1.4" />
      <text x="376" y="116" text-anchor="middle" font-size="10" fill="var(--d-cur-text)">memory</text>
      <text x="376" y="132" text-anchor="middle" font-size="9" fill="var(--d-cur-text)">mcache → mheap</text>

      <rect x="434" y="94" width="88" height="54" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <text x="478" y="116" text-anchor="middle" font-size="10" fill="var(--d-rv-a-text)">gc</text>
      <text x="478" y="132" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)">三色标记 / 屏障</text>

      <rect x="536" y="94" width="88" height="54" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="580" y="116" text-anchor="middle" font-size="10" fill="var(--d-warn-text)">pprof</text>
      <text x="580" y="132" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">聚合热点</text>

      <rect x="638" y="94" width="96" height="54" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="686" y="116" text-anchor="middle" font-size="10" fill="var(--d-text)">trace</text>
      <text x="686" y="132" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">时间线行为</text>

      <line x1="114" y1="121" x2="128" y2="121" stroke="var(--d-blue-border)" stroke-width="1.6" marker-end="url(#srcRoute1)" />
      <line x1="216" y1="121" x2="230" y2="121" stroke="var(--d-rv-b-border)" stroke-width="1.6" marker-end="url(#srcRoute2)" />
      <line x1="318" y1="121" x2="332" y2="121" stroke="var(--d-rv-c-border)" stroke-width="1.6" marker-end="url(#srcRoute3)" />
      <line x1="420" y1="121" x2="434" y2="121" stroke="var(--d-cur-border)" stroke-width="1.6" marker-end="url(#srcRoute4)" />
      <line x1="522" y1="121" x2="536" y2="121" stroke="var(--d-rv-a-border)" stroke-width="1.6" marker-end="url(#srcRoute5)" />
      <line x1="624" y1="121" x2="638" y2="121" stroke="var(--d-warn-border)" stroke-width="1.6" marker-end="url(#srcRoute6)" />

      <rect x="92" y="186" width="576" height="24" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="380" y="202" text-anchor="middle" font-size="9" fill="var(--d-text)">前半段解释运行时为什么这么跑，后半段解释这些行为如何被观测到；顺序反了，排障结论通常会很碎</text>

      <defs>
        <marker id="srcRoute1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" />
        </marker>
        <marker id="srcRoute2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-b-border)" />
        </marker>
        <marker id="srcRoute3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-c-border)" />
        </marker>
        <marker id="srcRoute4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-cur-border)" />
        </marker>
        <marker id="srcRoute5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-a-border)" />
        </marker>
        <marker id="srcRoute6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-warn-border)" />
        </marker>
      </defs>
    </svg>

    <svg
      v-else
      viewBox="0 0 620 220"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="归档入口跳转图"
      role="img"
    >
      <text x="310" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--d-text)">旧入口现在只负责分流：主线看 learning-path，按主题查文章看 source-reading/index</text>

      <rect x="36" y="74" width="150" height="72" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.4" />
      <text x="111" y="100" text-anchor="middle" font-size="11" font-weight="bold" fill="var(--d-warn-text)">旧入口</text>
      <text x="111" y="118" text-anchor="middle" font-size="9" fill="var(--d-warn-text)">09-runtime-source</text>

      <line x1="186" y1="96" x2="288" y2="96" stroke="var(--d-blue-border)" stroke-width="1.8" marker-end="url(#srcArchiveA)" />
      <line x1="186" y1="124" x2="288" y2="124" stroke="var(--d-rv-b-border)" stroke-width="1.8" marker-end="url(#srcArchiveB)" />

      <rect x="292" y="48" width="140" height="54" rx="10" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="362" y="70" text-anchor="middle" font-size="10" fill="var(--d-text)">learning-path</text>
      <text x="362" y="86" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">路线 / 方法 / 资料</text>

      <rect x="292" y="118" width="140" height="54" rx="10" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <text x="362" y="140" text-anchor="middle" font-size="10" fill="var(--d-rv-b-text)">source-reading/index</text>
      <text x="362" y="156" text-anchor="middle" font-size="9" fill="var(--d-rv-b-text)">按主题找文章</text>

      <rect x="460" y="74" width="124" height="72" rx="10" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.4" />
      <text x="522" y="100" text-anchor="middle" font-size="10" fill="var(--d-text)">精读正文</text>
      <text x="522" y="118" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">scheduler / gc / http</text>
      <text x="522" y="134" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">database/sql ...</text>

      <line x1="432" y1="75" x2="460" y2="98" stroke="var(--d-blue-border)" stroke-width="1.5" marker-end="url(#srcArchiveA)" />
      <line x1="432" y1="145" x2="460" y2="122" stroke="var(--d-rv-b-border)" stroke-width="1.5" marker-end="url(#srcArchiveB)" />

      <defs>
        <marker id="srcArchiveA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-blue-border)" />
        </marker>
        <marker id="srcArchiveB" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--d-rv-b-border)" />
        </marker>
      </defs>
    </svg>
  </DiagramFrame>
</template>
