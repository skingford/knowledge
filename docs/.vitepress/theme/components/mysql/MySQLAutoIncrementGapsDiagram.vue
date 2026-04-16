<script setup lang="ts">
type DiagramKind =
  | 'show-create-auto-increment'
  | 'duplicate-key-gap-flow'
  | 'non-continuous-id-demo'
  | 'batch-insert-auto-inc-lock'

defineProps<{
  kind: DiagramKind
}>()
</script>

<template>
  <div v-if="kind === 'show-create-auto-increment'" style="text-align:center;margin:1.5em 0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 120" style="max-width:580px;width:100%;font-family:monospace">
      <rect width="580" height="120" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">show create table 输出</text>
      <rect x="30" y="34" width="520" height="56" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <g font-size="10" fill="var(--d-text)" font-family="monospace">
        <text x="40" y="52">CREATE TABLE `t` (</text>
        <text x="60" y="66">`id` int(11) NOT NULL AUTO_INCREMENT,</text>
        <text x="60" y="80">... ) ENGINE=InnoDB <tspan fill="var(--d-orange)" font-weight="bold">AUTO_INCREMENT=2</tspan></text>
      </g>
      <text x="290" y="110" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 1  插入一行后 AUTO_INCREMENT 值变为 2</text>
    </svg>
  </div>

  <div v-else-if="kind === 'duplicate-key-gap-flow'" style="text-align:center;margin:1.5em 0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 240" style="max-width:580px;width:100%;font-family:monospace">
      <rect width="580" height="240" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">insert(null, 1, 1) 唯一键冲突流程</text>
      <g font-size="11">
        <rect x="30" y="36" width="30" height="24" rx="12" fill="var(--d-blue)" opacity="0.9"/>
        <text x="45" y="52" text-anchor="middle" fill="var(--d-bg)" font-weight="bold" font-size="10">1</text>
        <text x="70" y="52" fill="var(--d-text)">执行器传入 (0, 1, 1)，id=0 表示未指定自增值</text>

        <rect x="30" y="66" width="30" height="24" rx="12" fill="var(--d-blue)" opacity="0.9"/>
        <text x="45" y="82" text-anchor="middle" fill="var(--d-bg)" font-weight="bold" font-size="10">2</text>
        <text x="70" y="82" fill="var(--d-text)">InnoDB 获取当前自增值 AUTO_INCREMENT = <tspan font-weight="bold" fill="var(--d-blue)">2</tspan></text>

        <rect x="30" y="96" width="30" height="24" rx="12" fill="var(--d-blue)" opacity="0.9"/>
        <text x="45" y="112" text-anchor="middle" fill="var(--d-bg)" font-weight="bold" font-size="10">3</text>
        <text x="70" y="112" fill="var(--d-text)">将行值改为 (<tspan font-weight="bold" fill="var(--d-blue)">2</tspan>, 1, 1)</text>

        <rect x="30" y="126" width="30" height="24" rx="12" fill="var(--d-green)" opacity="0.9"/>
        <text x="45" y="142" text-anchor="middle" fill="var(--d-bg)" font-weight="bold" font-size="10">4</text>
        <text x="70" y="142" fill="var(--d-text)">将 AUTO_INCREMENT 改为 <tspan font-weight="bold" fill="var(--d-green)">3</tspan></text>

        <rect x="30" y="156" width="30" height="24" rx="12" fill="var(--d-orange)" opacity="0.9"/>
        <text x="45" y="172" text-anchor="middle" fill="var(--d-bg)" font-weight="bold" font-size="10">5</text>
        <text x="70" y="172" fill="var(--d-text)">执行插入 → c=1 冲突 → <tspan font-weight="bold" fill="var(--d-orange)">Duplicate key error</tspan></text>
      </g>
      <rect x="60" y="190" width="460" height="24" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <text x="290" y="206" text-anchor="middle" font-size="11" fill="var(--d-warn-text)">id=2 未插入成功，但 AUTO_INCREMENT 已变为 3，不会回退</text>
      <text x="290" y="232" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 2  唯一键冲突导致自增值"空洞"</text>
    </svg>
  </div>

  <div v-else-if="kind === 'non-continuous-id-demo'" style="text-align:center;margin:1.5em 0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 220" style="max-width:580px;width:100%;font-family:monospace">
      <rect width="580" height="220" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">自增主键不连续 — 复现步骤</text>
      <rect x="30" y="36" width="520" height="150" rx="6" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="1"/>
      <g font-size="10" font-family="monospace">
        <text x="40" y="54" fill="var(--d-text-muted)">-- 已有 (1,1,1)，AUTO_INCREMENT=2</text>
        <text x="40" y="72" fill="var(--d-text)">mysql&gt; insert into t values(null, 1, 1);</text>
        <text x="40" y="86" fill="var(--d-orange)">ERROR 1062: Duplicate entry '1' for key 'c'</text>
        <text x="40" y="104" fill="var(--d-text-muted)">-- AUTO_INCREMENT 已变为 3，id=2 被跳过</text>
        <text x="40" y="122" fill="var(--d-text)">mysql&gt; insert into t values(null, 2, 2);</text>
        <text x="40" y="136" fill="var(--d-green)">Query OK, 1 row affected</text>
        <text x="40" y="154" fill="var(--d-text)">mysql&gt; select * from t;</text>
        <text x="40" y="168" fill="var(--d-text)">+----+---+---+</text>
        <text x="40" y="180" fill="var(--d-text)">| <tspan fill="var(--d-blue)">1</tspan>  | 1 | 1 |    ← id=2 不存在（空洞）</text>
      </g>
      <text x="268" y="180" font-size="10" font-family="monospace" fill="var(--d-text)">| <tspan fill="var(--d-orange)" font-weight="bold">3</tspan>  | 2 | 2 |    ← 直接跳到 id=3</text>
      <text x="290" y="210" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 3  复现自增主键 id 不连续</text>
    </svg>
  </div>

  <div v-else-if="kind === 'batch-insert-auto-inc-lock'" style="text-align:center;margin:1.5em 0">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 580 240" style="max-width:580px;width:100%;font-family:monospace">
      <rect width="580" height="240" rx="8" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.5"/>
      <text x="290" y="22" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--d-text)">批量插入数据的自增锁</text>
      <rect x="20" y="36" width="60" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="50" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">时刻</text>
      <rect x="85" y="36" width="240" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="205" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session A</text>
      <rect x="330" y="36" width="230" height="22" rx="4" fill="var(--d-th-bg)" stroke="var(--d-th-border)" stroke-width="1"/>
      <text x="445" y="51" text-anchor="middle" font-size="10" fill="var(--d-th-text)">session B</text>
      <g font-size="9" fill="var(--d-text)" font-family="monospace">
        <text x="50" y="78" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">T0</text>
        <rect x="85" y="64" width="240" height="22" rx="3" fill="var(--d-bg)" stroke="var(--d-border)" stroke-width="0.8"/>
        <text x="95" y="79">insert t1 values(1..4)</text>
        <text x="95" y="79" fill="var(--d-text-muted)"><tspan dx="145">create t2 like t1</tspan></text>

        <text x="50" y="108" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">T1</text>
        <rect x="85" y="94" width="240" height="22" rx="3" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1"/>
        <text x="95" y="109" fill="var(--d-blue)">insert into t2(c,d)</text>
        <text x="235" y="109" fill="var(--d-blue)">select c,d from t1</text>

        <text x="50" y="138" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">T2</text>
        <rect x="330" y="124" width="230" height="22" rx="3" fill="var(--d-orange)" opacity="0.15" stroke="var(--d-orange)" stroke-width="1"/>
        <text x="340" y="139" fill="var(--d-orange)">insert into t2 values</text>
        <text x="340" y="139" fill="var(--d-orange)"><tspan dx="120">(null,5,5)</tspan></text>
      </g>
      <rect x="40" y="160" width="500" height="50" rx="5" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1"/>
      <g font-size="10" fill="var(--d-warn-text)">
        <text x="290" y="177" text-anchor="middle">若 session B 的 insert 与 session A 交叉申请自增 id</text>
        <text x="290" y="193" text-anchor="middle">→ binlog_format=statement 重放时，id 分配不同 → 主备不一致</text>
      </g>
      <text x="290" y="232" text-anchor="middle" font-size="11" fill="var(--d-text-muted)">图 4  批量插入的自增锁场景</text>
    </svg>
  </div>
</template>
