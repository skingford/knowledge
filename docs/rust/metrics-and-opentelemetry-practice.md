---
title: Rust Metrics 与 OpenTelemetry 实践
description: 从 counter、gauge、histogram 到 OTLP exporter、trace 关联、标签基数和优雅关闭，整理 Rust 服务的指标与 OpenTelemetry 主线。
---

# Rust Metrics 与 OpenTelemetry 实践

很多 Rust 服务补到 `tracing` 以后，会有一种错觉：

- 日志已经结构化了
- span 也打上了
- 好像观测已经差不多完整了

但一到真实发布和排障，很快就会发现还缺一整块：

- 错误率怎么持续看
- 延迟分布怎么聚合看
- 队列积压怎么提前看
- 发布后性能退化怎么第一时间看
- trace 和指标怎么互相对照

这页补的就是这条主线：Rust 服务里的 metrics 和 OpenTelemetry。

## 先分清 trace、log、metric 各自负责什么

可以先把三者看成三种不同视角：

### trace / span

更适合回答：

- 某个请求经过了哪些步骤
- 某个批处理卡在了哪里
- 某次失败发生在什么上下文里

### log / event

更适合回答：

- 某一刻发生了什么
- 有哪些异常细节和值
- 某次故障当时打印了什么信息

### metric

更适合回答：

- 过去 5 分钟错误率是不是变高了
- p95 / p99 延迟是不是恶化了
- 积压长度是不是在持续增长
- 当前 in-flight 请求是不是超预期

一个很实用的原则是：

- trace 看单次链路
- log 看事件细节
- metric 看整体趋势

不要指望只靠日志把所有观测问题都解决。

## Rust 里常见的两条指标路线

### 路线 1：`metrics` facade

这条路线适合：

- 应用和库层统一用一个轻量指标 API
- 导出到 Prometheus 这类系统
- 希望业务代码尽量少感知具体 exporter

`metrics` crate 官方说明得很清楚：它提供统一 API，库只负责发指标，真正用什么实现由可执行程序安装 recorder 决定。

### 路线 2：OpenTelemetry SDK

这条路线适合：

- 需要 OTLP 导出到 Collector
- 需要 trace / metric 统一进入 OpenTelemetry 体系
- 需要 resource、view、propagation 这些能力

这时通常会看到这些 crate：

- `opentelemetry`
- `opentelemetry_sdk`
- `opentelemetry_otlp`
- `tracing-opentelemetry`

## 一个务实选型

很多 Rust 服务里，更稳的做法通常是：

- 日志 / span：`tracing`
- 分布式 trace 导出：`tracing-opentelemetry`
- 指标 API：`metrics` 或 OpenTelemetry metrics 二选一
- 导出器：Prometheus 或 OTLP

真正要避免的是：

- 同一批业务指标同时用两套 API 重复埋点
- collector 里出现两份名字相似、语义略不同的数据

所以更稳的原则通常是：

- trace 主线围绕 `tracing` 组织
- metric 主线选一套指标 API 作为主入口
- exporter 和 collector 只是出口，不要反过来污染业务代码

## 三种基础指标类型怎么选

`metrics` crate 官方把指标分成三类：

- counter
- gauge
- histogram

这三类基本也覆盖了日常服务大部分需求。

### 1. counter：只增不减的累计量

适合：

- 请求总数
- 错误总数
- 重试次数
- 消费消息数

### 2. gauge：可升可降的当前值

适合：

- 当前 in-flight 请求数
- 当前队列长度
- 当前连接池占用
- 当前 worker 数量

### 3. histogram：观测分布

适合：

- 请求延迟
- SQL 耗时
- 外部 API 调用耗时
- 批处理大小
- 响应体大小

一个非常实用的习惯是：

- 数事件：counter
- 看状态：gauge
- 看延迟和大小分布：histogram

## 一个够用的 `metrics` 埋点例子

```rust
use metrics::{counter, describe_counter, describe_histogram, histogram, Unit};
use std::time::Instant;

pub fn init_metrics() {
    describe_counter!("http_requests_total", Unit::Count, "HTTP 请求总数");
    describe_histogram!(
        "http_request_duration_seconds",
        Unit::Seconds,
        "HTTP 请求耗时分布"
    );
}

pub async fn handle_request(route: &str) -> anyhow::Result<()> {
    let start = Instant::now();
    counter!("http_requests_total", "route" => route, "method" => "GET").increment(1);

    do_work().await?;

    histogram!(
        "http_request_duration_seconds",
        "route" => route,
        "method" => "GET"
    )
    .record(start.elapsed());

    Ok(())
}
```

这个例子里最重要的不是宏本身，而是语义：

- 描述信息通常在启动阶段注册
- counter 表示请求发生了多少次
- histogram 表示请求耗时分布
- label 只保留有限、高复用、可聚合的维度

## 标签设计比埋点本身更重要

指标最常见的工程事故，不是“没埋”，而是：

- 埋了以后把存储和查询成本打爆

最危险的问题通常叫高基数。

### 高基数标签常见雷区

- `user_id`
- `order_id`
- `trace_id`
- 原始 URL
- 原始 SQL
- 原始错误消息

### 更稳的替代方式

- 用 `route=/users/:id`，不要用完整 URL
- 用 `error_kind=timeout`，不要用整段错误字符串
- 用 `upstream=github`，不要用完整目标地址
- 用 `status_class=5xx` 或有限状态码集合

一个很实用的判断是：

**如果某个标签的可选值会随着业务数据无限增长，它大概率就不该当 metric label。**

`opentelemetry_sdk` 的 `MeterProviderBuilder` 也明确提供了 `with_view`，允许在导出前调整聚合、重命名和基数限制。

## trace 和 metric 要怎么配合

trace 和 metric 最有价值的状态，不是各自独立，而是能互相定位。

例如一次发布后你发现：

- `http_request_duration_seconds` 的 p95 升高

下一步通常会做什么？

- 去看对应接口的 trace
- 看是 SQL 慢了、外部 API 慢了，还是某个锁竞争严重

所以更稳的做法是：

- metric 名称反映稳定业务动作
- tracing span 反映单次执行上下文
- 两者都围绕同一批核心边界埋点

典型边界包括：

- HTTP handler
- service 用例
- SQL 查询
- 外部 API 调用
- 后台任务消费

如果你想把 timeout、overload、rate limit 命中和 in-flight 这类服务保护指标单独理顺，继续看：

- [Rust 限流、超时与负载保护实践](./rate-limit-timeout-and-overload-protection-practice.md)

如果 tracing 主线你还没完全补齐，先看：

- [Tracing 与可观测性实践](./tracing-and-observability-practice.md)

## OpenTelemetry 在 Rust 里主要解决什么

OpenTelemetry 在 Rust 里更像一套标准化遥测接口和导出体系。

它常见解决的是：

- trace 上下文传播
- OTLP 导出
- resource 统一标识
- trace / metric 的标准出口

`tracing-opentelemetry` 官方文档也明确说明，它提供一层把 `tracing` span 接到 OpenTelemetry 兼容系统里。

## `service.name` 这类 resource 元信息要尽早统一

至少建议明确：

- `service.name`
- `service.version`
- `deployment.environment`
- `service.instance.id`

否则你很容易在 collector、监控面板和 trace 系统里看到：

- 名字不一致
- 环境混在一起
- 同服务不同实例难区分

## Prometheus 路线怎么理解

如果你的主监控体系是 Prometheus，Rust 里很常见的组合是：

- 业务代码用 `metrics`
- 应用入口安装 `metrics-exporter-prometheus`
- 暴露 scrape endpoint 或推送到 Pushgateway

`metrics-exporter-prometheus` 官方文档也明确提供了这两种模式，并说明 `install` / `install_recorder` / `build` 这几种接入方式的差别。

一个很重要的工程点是：

- exporter 可能会启动后台 upkeep 任务
- recorder 只能全局安装一次
- 这套初始化应该尽早完成

如果你打算只在测试或部分线程里接 recorder，`metrics` crate 也提供了 `with_local_recorder` 这类能力。

## OTLP 路线怎么理解

如果你的观测基础设施是 OpenTelemetry Collector，常见做法是：

1. 构造 trace exporter 和 / 或 metric exporter
2. 用 `SdkTracerProvider` / `SdkMeterProvider` 挂上 exporter
3. 把 tracer 接到 `tracing_opentelemetry::layer()`
4. 把 provider 的生命周期纳入应用启动和关闭

`opentelemetry_sdk` 文档也明确说明：

- `MeterProvider` 没有 reader 就不会导出 metric
- `with_periodic_exporter` 是最常见用法
- `with_view` 可以改聚合、重命名或限制基数

而 `opentelemetry_otlp` 当前也提供了 builder 接口，并暴露 `shutdown` / `force_flush` 这类导出器生命周期能力。

## 初始化顺序要早，而且只能有一套主路径

更稳的顺序通常是：

1. 读配置
2. 初始化 tracing subscriber
3. 初始化 metrics recorder 或 OTel provider
4. 组装 app state
5. 启动 HTTP / worker

如果 exporter、provider、subscriber 初始化散在多个模块，就很容易出现：

- 重复初始化失败
- 指标在启动早期丢失
- 测试和生产行为不一致

## 优雅关闭必须覆盖 exporter flush / shutdown

很多服务已经知道要：

- 停 listener
- 等 in-flight request
- 等后台任务退出

但会漏掉：

- trace / metric exporter 的 flush 和 shutdown

结果就是：

- 进程退出前最后几秒指标没导出去
- 最后一批 trace 丢了

如果你在用 OTLP exporter，这一点尤其要进关闭流程。

如果你在用 Prometheus pull 模式，也要明确：

- exporter / upkeep 任务什么时候停
- scrape endpoint 什么时候摘流量

关闭流程主线可以继续看：

- [服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)

## 指标命名要稳定、低歧义

常见更稳的做法：

- 用业务动作命名，不要用实现细节命名
- 同一维度只保留一种命名风格
- 时间类指标显式带单位

例如：

- `http_requests_total`
- `http_request_duration_seconds`
- `external_api_requests_total`
- `external_api_request_duration_seconds`
- `job_queue_depth`

## 哪些位置最值得先补 metric

### 1. HTTP 入口

- 请求总数
- 错误总数
- 延迟分布
- in-flight 数量

### 2. 数据库和外部依赖边界

- SQL 耗时
- 外部 API 耗时
- 超时次数
- 重试次数

如果你想把消息发布成功率、消费失败率和 queue lag 单独理顺，继续看：

- [Rust 消息队列与事件驱动实践](./message-queue-and-event-driven-practice.md)

如果你想把上传字节数、对象存储 `put/get/delete` 失败率和 orphan 清理指标单独理顺，继续看：

- [Rust 文件上传、对象存储与 S3 实践](./file-upload-and-object-storage-practice.md)

### 3. 后台任务 / worker

- 队列长度
- 消费成功 / 失败数
- 重试数
- 单任务耗时

### 4. 资源与运行时

- 连接池占用
- 内存趋势
- worker 阻塞或积压

## 测试怎么做

指标测试通常更适合测“有没有发出正确语义”，而不是测 exporter 真发到了哪里。

一个务实拆法是：

### 1. 业务逻辑测试

先测：

- 成功路径会不会增 counter
- 失败路径会不会增 error counter
- 延迟会不会记 histogram

`metrics` crate 官方也提供了 `with_local_recorder`，很适合把 recorder 局部挂进单测。

### 2. exporter 装配测试

再测：

- 配置是否能初始化 exporter
- 端点、协议、认证头是否正确传入
- 启动失败时会不会及时报错

### 3. 端到端发布验证

最后验证：

- 发布后指标是不是能真正被 scrape / 导出
- 面板和告警是不是能正常工作

## 常见误区

### 误区 1：把 `trace_id`、`user_id` 直接打成 metric label

这通常是最快的高基数事故入口。

### 误区 2：只有错误才发指标

没有总量和延迟分布，很多错误率和容量问题根本看不出来。

### 误区 3：只看平均值

真正影响用户体验和系统稳定性的，往往是尾延迟和分布。

### 误区 4：业务代码同时混用多套 metric API

最后最容易出现重复埋点和语义漂移。

### 误区 5：进程退出时不 flush / shutdown exporter

这会让最后一段观测数据系统性丢失。

## 推荐回查入口

- 结构化日志与 span：[Tracing 与可观测性实践](./tracing-and-observability-practice.md)
- HTTP 边界埋点：[Rust HTTP Client 与外部 API 实践](./http-client-and-external-api-practice.md)
- 后台任务指标：[Rust 后台任务与 Worker 实践](./background-jobs-and-worker-practice.md)
- 生命周期与关闭：[服务配置与优雅关闭](./service-configuration-and-graceful-shutdown.md)
- 发布前验证：[Rust 服务部署与发布清单](./deployment-and-release-checklist.md)

## 推荐资料

- [metrics crate](https://docs.rs/metrics/latest/metrics/)
- [metrics-exporter-prometheus](https://docs.rs/metrics-exporter-prometheus/latest/metrics_exporter_prometheus/)
- [tracing-opentelemetry](https://docs.rs/tracing-opentelemetry/latest/tracing_opentelemetry/)
- [opentelemetry](https://docs.rs/opentelemetry/latest/opentelemetry/)
- [opentelemetry_sdk MeterProviderBuilder](https://docs.rs/opentelemetry_sdk/latest/opentelemetry_sdk/metrics/struct.MeterProviderBuilder.html)
- [opentelemetry-otlp](https://docs.rs/opentelemetry-otlp/latest/opentelemetry_otlp/)

## 自检

你至少应该能回答：

1. counter、gauge、histogram 分别更适合表达什么？
2. 为什么 `user_id`、`trace_id` 这类值通常不该作为 metric label？
3. 为什么 trace、log、metric 不能互相替代？
4. 为什么 exporter / provider 的 flush 和 shutdown 必须进优雅关闭流程？
5. 在 Rust 服务里，什么时候更适合 `metrics` facade，什么时候更适合直接走 OpenTelemetry 主线？

这些问题理顺后，Rust 服务的可观测性才会从“有日志”升级成“有稳定的指标和标准化遥测出口”。
