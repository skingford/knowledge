<script setup lang="ts">
import DiagramFrame from '@docs-components/common/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="920px">
    <svg
      viewBox="0 0 900 620"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="生产级分层架构与请求链路"
      role="img"
      style="width:100%;font-family:system-ui,sans-serif"
    >
      <defs>
        <marker id="hc1-arr" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-border)" />
        </marker>
        <marker id="hc1-arr-sub" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--d-text-muted)" />
        </marker>
      </defs>

      <!-- Title -->
      <text x="450" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">生产级分层架构与请求链路</text>
      <text x="450" y="40" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">DNS → CDN → L4/L7 负载均衡 → 网关 → 无状态服务集群 → 数据层</text>

      <!-- ======== Row 0: User + Static path ======== -->
      <rect x="350" y="56" width="200" height="32" rx="16" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="450" y="77" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-rv-c-text)">用户请求（浏览器 / App / API）</text>

      <!-- Arrow down to DNS -->
      <line x1="450" y1="88" x2="450" y2="108" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- ======== Row 1: DNS + CDN ======== -->
      <rect x="310" y="112" width="120" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="370" y="132" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">DNS / GSLB</text>

      <line x1="430" y1="127" x2="460" y2="127" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc1-arr)" />

      <rect x="465" y="112" width="120" height="30" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1.2" />
      <text x="525" y="132" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">CDN 边缘节点</text>

      <!-- CDN annotation -->
      <text x="640" y="123" font-size="9" fill="var(--d-text-muted)">静态资源直接返回</text>
      <text x="640" y="135" font-size="9" fill="var(--d-text-muted)">JS / CSS / 图片 / 视频</text>

      <!-- Arrow down -->
      <line x1="450" y1="142" x2="450" y2="162" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- ======== Row 2: Load Balancing Layer ======== -->
      <rect x="80" y="166" width="740" height="64" rx="12" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <rect x="92" y="174" width="110" height="18" rx="9" fill="var(--d-blue-border)" />
      <text x="147" y="187" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">负载均衡层</text>

      <!-- L4 -->
      <rect x="100" y="198" width="140" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="170" y="215" text-anchor="middle" font-size="10" fill="var(--d-text)">L4: LVS / 云 SLB</text>

      <line x1="240" y1="211" x2="268" y2="211" stroke="var(--d-border)" stroke-width="1" marker-end="url(#hc1-arr)" />

      <!-- L7 instances -->
      <rect x="273" y="198" width="140" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="343" y="215" text-anchor="middle" font-size="10" fill="var(--d-text)">L7: Nginx-1</text>

      <rect x="423" y="198" width="140" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="493" y="215" text-anchor="middle" font-size="10" fill="var(--d-text)">L7: Nginx-2</text>

      <rect x="573" y="198" width="140" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="643" y="215" text-anchor="middle" font-size="10" fill="var(--d-text)">L7: Nginx-N</text>

      <!-- SSL / Health check annotations -->
      <text x="770" y="210" font-size="8" fill="var(--d-blue-text)" font-weight="600">SSL 卸载</text>
      <text x="770" y="221" font-size="8" fill="var(--d-blue-text)" font-weight="600">健康检查</text>

      <!-- Arrow down -->
      <line x1="450" y1="230" x2="450" y2="250" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- ======== Row 3: API Gateway Layer ======== -->
      <rect x="80" y="254" width="740" height="64" rx="12" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <rect x="92" y="262" width="110" height="18" rx="9" fill="var(--d-rv-c-border)" />
      <text x="147" y="275" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">API 网关层</text>

      <rect x="100" y="286" width="110" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="155" y="303" text-anchor="middle" font-size="10" fill="var(--d-text)">路由 / 转发</text>

      <rect x="222" y="286" width="110" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="277" y="303" text-anchor="middle" font-size="10" fill="var(--d-text)">限流 / 熔断</text>

      <rect x="344" y="286" width="110" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="399" y="303" text-anchor="middle" font-size="10" fill="var(--d-text)">鉴权 / JWT</text>

      <rect x="466" y="286" width="110" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="521" y="303" text-anchor="middle" font-size="10" fill="var(--d-text)">WAF / 防刷</text>

      <rect x="588" y="286" width="120" height="26" rx="6" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="648" y="303" text-anchor="middle" font-size="10" fill="var(--d-text)">协议转换</text>

      <!-- Gateway annotation -->
      <text x="770" y="298" font-size="8" fill="var(--d-rv-c-text)" font-weight="600">APISIX / Kong</text>
      <text x="770" y="309" font-size="8" fill="var(--d-rv-c-text)" font-weight="600">无状态扩展</text>

      <!-- Arrow down -->
      <line x1="450" y1="318" x2="450" y2="338" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- ======== Row 4: Service Layer ======== -->
      <rect x="80" y="342" width="740" height="80" rx="12" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />
      <rect x="92" y="350" width="110" height="18" rx="9" fill="var(--d-rv-a-border)" />
      <text x="147" y="363" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">业务服务层</text>

      <!-- Service Group A -->
      <text x="180" y="380" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">订单服务</text>
      <rect x="110" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="142" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-1</text>
      <rect x="180" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="212" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-2</text>
      <rect x="250" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="282" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-N</text>

      <!-- Service Group B -->
      <text x="420" y="380" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">库存服务</text>
      <rect x="360" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="392" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-1</text>
      <rect x="430" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="462" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-2</text>

      <!-- Service Group C -->
      <text x="600" y="380" text-anchor="middle" font-size="9" fill="var(--d-rv-a-text)" font-weight="600">支付服务</text>
      <rect x="540" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="572" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-1</text>
      <rect x="610" y="386" width="64" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="642" y="403" text-anchor="middle" font-size="9" fill="var(--d-text)">Pod-2</text>

      <!-- More services hint -->
      <text x="720" y="400" text-anchor="middle" font-size="12" fill="var(--d-text-sub)">…</text>

      <!-- Scale out annotation -->
      <text x="775" y="390" font-size="8" fill="var(--d-rv-a-text)" font-weight="600">无状态</text>
      <text x="775" y="401" font-size="8" fill="var(--d-rv-a-text)" font-weight="600">K8s HPA</text>
      <text x="775" y="412" font-size="8" fill="var(--d-rv-a-text)" font-weight="600">弹性伸缩</text>

      <!-- Arrow down -->
      <line x1="450" y1="422" x2="450" y2="442" stroke="var(--d-border)" stroke-width="1.4" marker-end="url(#hc1-arr)" />

      <!-- ======== Row 5: Data Layer ======== -->
      <rect x="80" y="446" width="740" height="80" rx="12" fill="var(--d-rv-b-bg)" stroke="var(--d-rv-b-border)" stroke-width="1.4" />
      <rect x="92" y="454" width="110" height="18" rx="9" fill="var(--d-rv-b-border)" />
      <text x="147" y="467" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">数据层</text>

      <!-- Data sub groups -->
      <!-- DB -->
      <text x="147" y="484" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">持久化</text>
      <rect x="100" y="490" width="95" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="147" y="507" text-anchor="middle" font-size="9" fill="var(--d-text)">MySQL 主从</text>

      <!-- Cache -->
      <text x="272" y="484" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">缓存</text>
      <rect x="215" y="490" width="115" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="272" y="507" text-anchor="middle" font-size="9" fill="var(--d-text)">Redis Cluster</text>

      <!-- MQ -->
      <text x="400" y="484" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">消息队列</text>
      <rect x="350" y="490" width="100" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="400" y="507" text-anchor="middle" font-size="9" fill="var(--d-text)">Kafka / RMQ</text>

      <!-- Search -->
      <text x="520" y="484" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">搜索</text>
      <rect x="470" y="490" width="100" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="520" y="507" text-anchor="middle" font-size="9" fill="var(--d-text)">Elasticsearch</text>

      <!-- Object Storage -->
      <text x="640" y="484" text-anchor="middle" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">对象存储</text>
      <rect x="590" y="490" width="100" height="26" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="640" y="507" text-anchor="middle" font-size="9" fill="var(--d-text)">OSS / S3</text>

      <!-- Annotation -->
      <text x="755" y="498" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">分片 / 集群</text>
      <text x="755" y="509" font-size="8" fill="var(--d-rv-b-text)" font-weight="600">主从 / 多副本</text>

      <!-- ======== Right side: Cross-cutting infrastructure ======== -->
      <!-- Vertical dashed box for infrastructure -->
      <rect x="80" y="544" width="740" height="64" rx="10" fill="var(--d-warn-bg)" stroke="var(--d-warn-border)" stroke-width="1.2" stroke-dasharray="6,3" />
      <rect x="92" y="551" width="130" height="18" rx="9" fill="var(--d-warn-border)" />
      <text x="157" y="564" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">基础设施（贯穿全链路）</text>

      <rect x="100" y="576" width="115" height="24" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="157" y="592" text-anchor="middle" font-size="9" fill="var(--d-text)">注册中心 Nacos</text>

      <rect x="228" y="576" width="115" height="24" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="285" y="592" text-anchor="middle" font-size="9" fill="var(--d-text)">配置中心 Apollo</text>

      <rect x="356" y="576" width="120" height="24" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="416" y="592" text-anchor="middle" font-size="9" fill="var(--d-text)">链路追踪 Jaeger</text>

      <rect x="489" y="576" width="135" height="24" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="556" y="592" text-anchor="middle" font-size="9" fill="var(--d-text)">监控 Prometheus</text>

      <rect x="637" y="576" width="105" height="24" rx="5" fill="var(--d-bg-alt)" stroke="var(--d-border)" stroke-width="1" />
      <text x="689" y="592" text-anchor="middle" font-size="9" fill="var(--d-text)">日志 ELK</text>

      <!-- Key callout at bottom -->
      <text x="450" y="618" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text-sub)">Session / 文件 / 定时任务 / 配置全部外置 → 业务服务完全无状态 → 任意节点可被替换或弹性伸缩</text>
    </svg>
  </DiagramFrame>
</template>
