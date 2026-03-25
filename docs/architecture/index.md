---
layout: page
title: false
description: 架构方向学习入口，覆盖系统设计路线、书单、自检清单、高并发与分布式事务专题。
search: false
aside: false
outline: false
pageClass: claude-home-page
---

<script setup lang="ts">
import { sections } from '@docs-content'

const { landing } = sections.find((section) => section.key === 'architecture')!
</script>

<SectionLanding
  :eyebrow="landing.eyebrow"
  :title="landing.title"
  :intro="landing.intro"
  :primary="landing.primary"
  :secondary="landing.secondary"
  :scope="landing.scope"
  :docs="landing.docs"
  :order="landing.order"
/>

## 交易系统一致性主线

- [交易系统一致性设计总览](/architecture/transaction-system-consistency-overview)
- [订单状态机设计实战](/architecture/order-state-machine-design)
- [订单超时取消与时间轮设计](/architecture/order-timeout-cancellation-and-timing-wheel)
- [延时任务方案对比](/architecture/delayed-task-solution-comparison)
- [Outbox 本地消息表设计实战](/architecture/outbox-pattern-design)
- [库存扣减与订单创建一致性设计](/architecture/order-and-inventory-consistency-design)
- [秒杀系统库存设计专题](/architecture/seckill-system-inventory-design)
- [支付系统回调幂等与补偿设计](/architecture/payment-callback-idempotency-and-compensation)

## 高并发活动系统专题

- [大促活动预热、压测与开关治理手册](/architecture/promotion-readiness-pressure-test-and-switch-governance)
- [秒杀系统压测脚本、容量估算与演练方法论](/architecture/seckill-pressure-testing-capacity-estimation-and-drills)
- [活动复盘模板与容量回归手册](/architecture/activity-postmortem-and-capacity-regression-playbook)
- [营销活动平台设计：模板、规则、发放、核销的一体化架构](/architecture/marketing-activity-platform-architecture)
- [秒杀系统风控、防刷与资格校验设计](/architecture/seckill-risk-control-and-eligibility-design)
- [秒杀系统库存设计专题](/architecture/seckill-system-inventory-design)
- [秒杀系统限流、削峰与降级设计](/architecture/seckill-system-rate-limiting-and-degradation)
- [秒杀结果查询、排队态与用户体验设计](/architecture/seckill-result-query-and-queueing-ux-design)
- [秒杀系统监控、告警与应急响应设计](/architecture/seckill-monitoring-alerting-and-incident-response)
- [抢券系统设计专题：与秒杀系统的异同](/architecture/coupon-claim-system-design-and-comparison)
- [高并发系统设计清单](/architecture/high-concurrency-system-checklist)

## 岗位面试专题

- [AI、IM/直播与云原生架构](/architecture/ai-im-k8s-architecture-interview-guide)
