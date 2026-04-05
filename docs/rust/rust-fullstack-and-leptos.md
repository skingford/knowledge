---
title: Rust 全栈与 Leptos 实践
description: 以 Leptos 为主线，串联 Rust 全栈开发中的 SSR/CSR/Hydration、信号系统、Axum 集成与工程实践，帮你判断 Rust 全栈是否适合你的场景。
search: false
---

# Rust 全栈与 Leptos 实践

"用 Rust 写前端"不再是空想——WebAssembly + SSR 让 Rust 全栈从实验变成了可行选项。

问题不再是"能不能"，而是：什么场景下合理、工程边界怎么划、和 JS 生态比优势在哪。这篇以 Leptos 为主线，把 SSR/CSR/Hydration、信号系统和 Axum 集成串起来。选 Leptos 是因为它在 SSR/Hydration 和细粒度响应式两个方向走得最远，代表了 Rust 全栈当前最完整的路线。

## Rust 全栈框架对比

### Leptos

**定位**：细粒度响应式 + SSR/Hydration 一等支持。设计哲学接近 SolidJS：不用 Virtual DOM，信号变化直接更新对应 DOM 节点。Server Functions 让前后端共享类型，和 Axum 的集成层成熟度最高。

### Dioxus

**定位**：React-like + 跨平台（Web/Desktop/Mobile/TUI）。Virtual DOM 渲染，RSX 语法接近 JSX，组件状态管理和 React hooks 风格相似。跨平台是核心卖点。

### Yew

**定位**：最早的 Rust 前端框架。类 Elm 的组件模型 + Virtual DOM，生态最成熟但架构设计较早期，SSR 是后期加上的。

### Sycamore

**定位**：细粒度响应式，类 SolidJS。和 Leptos 思路最接近，但社区规模和生态完整度不如 Leptos。

### 对比表格

| 维度 | Leptos | Dioxus | Yew | Sycamore |
|------|--------|--------|-----|----------|
| 渲染模型 | 细粒度响应式 | Virtual DOM | Virtual DOM | 细粒度响应式 |
| SSR 支持 | 一等支持 | 支持 | 后期加入 | 基础支持 |
| Hydration | 原生支持 | 支持 | 有限 | 基础 |
| 跨平台 | Web 为主 | Web/Desktop/Mobile | Web 为主 | Web 为主 |
| 类比前端框架 | SolidJS | React | Elm/React | SolidJS |
| 学习曲线 | 中等 | 较低（有 React 经验） | 中等 | 中等偏高 |
| 社区活跃度 | 高 | 高 | 中等（趋稳） | 较低 |

**选型建议**：全栈 Web + SSR 选 Leptos，跨平台选 Dioxus，团队有 React 经验且不需要 SSR 也看 Dioxus。

## Leptos 核心概念

### 信号系统

信号（Signal）是响应式的核心原语。值变化时，所有依赖它的视图和计算自动更新：

```rust
#[component]
fn Counter() -> impl IntoView {
    let (count, set_count) = create_signal(0);
    view! {
        <button on:click=move |_| set_count.update(|n| *n += 1)>
            "点击次数: " {count}
        </button>
    }
}
```

关键理解：`create_signal` 返回读写分离的两个句柄；`count` 在 `view!` 中被读取时框架自动追踪依赖；变更只更新依赖该信号的 DOM 节点，不是 Virtual DOM diff。

### 响应式原语

```rust
let double = create_memo(move |_| count.get() * 2);  // 派生计算，有缓存
create_effect(move |_| { log!("count: {}", count.get()); });  // 副作用，无返回值
let data = create_resource(move || query.get(), |q| async move { fetch(q).await });  // 异步加载
```

`create_memo` vs `create_effect`：memo 有返回值且被缓存，effect 是纯副作用。搞混是常见错误。

### 组件模型与 view! 宏

组件是普通函数 + `#[component]` 宏，`view!` 提供 JSX-like 语法：

```rust
#[component]
fn UserCard(name: String, #[prop(optional)] avatar: Option<String>) -> impl IntoView {
    view! {
        <div>
            <h3>{name}</h3>
            {avatar.map(|url| view! { <img src=url/> })}
        </div>
    }
}
```

条件渲染用 `<Show>`，列表渲染用 `<For>`（带 `key` 做高效 diff），都是内置组件而非 HTML 标签：

```rust
view! {
    <Show when=move || count.get() > 5 fallback=|| view! { <p>"还不够"</p> }>
        <p>"超过 5 了！"</p>
    </Show>
    <For
        each=move || items.get()
        key=|item| item.id
        children=move |item| view! { <li>{item.name.clone()}</li> }
    />
}
```

## 渲染模式

### CSR（Client-Side Rendering）

浏览器下载 Wasm 完成所有渲染。最简单，适合内部工具和不需要 SEO 的应用。劣势是首屏白屏时间长。

### SSR（Server-Side Rendering）

服务端把组件渲染为 HTML 直接返回。用户看到内容最快，适合内容型网站和 SEO 场景。

### Hydration

SSR + CSR 组合：服务端先渲染 HTML，客户端下载 Wasm 后"激活"已有 DOM，绑定事件和响应式逻辑。这是 Leptos 推荐的生产模式。

```toml
# Cargo.toml — 通过 features 区分两个 target
[features]
ssr = ["leptos/ssr", "leptos_axum"]
hydrate = ["leptos/hydrate"]
```

关键：Hydration 是"认领"已存在的 DOM，不是重新渲染。服务端和客户端渲染结果不一致会导致 hydration mismatch。

### Islands 架构

页面大部分是静态 HTML，只有 `#[island]` 标记的组件需要 Wasm：

```rust
#[island]
fn InteractiveCounter() -> impl IntoView {
    let (count, set_count) = create_signal(0);
    view! {
        <button on:click=move |_| set_count.update(|n| *n += 1)>
            {count}
        </button>
    }
}
```

其余非 `#[island]` 组件不会被打进 Wasm，显著减小体积。适合内容为主、交互为辅的网站（博客、文档站、营销页）。

### 选型决策

| 场景 | 推荐模式 |
|------|---------|
| 内部后台工具 | CSR |
| 营销/内容网站 | SSR + Islands |
| 全栈 Web 应用 | SSR + Hydration |
| 内容为主 + 少量交互 | Islands |

## 与 Axum 集成

`leptos_axum` 是官方维护的集成层。核心是 `.leptos_routes()` 扩展方法，把 Leptos 路由接入 Axum Router：

```rust
let app = Router::new()
    .leptos_routes(&leptos_options, routes, App)
    .fallback(leptos_axum::file_and_error_handler(App))
    .with_state(leptos_options);
```

### Server Functions

全栈能力的核心——`#[server]` 标记的函数在服务端执行，客户端可以像普通函数一样调用：

```rust
#[server(GetTodos, "/api")]
pub async fn get_todos() -> Result<Vec<Todo>, ServerFnError> {
    let pool = use_context::<SqlitePool>()
        .ok_or(ServerFnError::new("数据库连接不可用"))?;
    sqlx::query_as::<_, Todo>("SELECT * FROM todos")
        .fetch_all(&pool).await
        .map_err(|e| ServerFnError::new(e.to_string()))
}
```

本质：编译时根据 feature flag 生成不同代码。`ssr` feature 下是服务端逻辑，`hydrate` feature 下是 HTTP 调用代理。前后端共享同一份类型定义。

### 路由与项目结构

```rust
view! {
    <Router>
        <Routes>
            <Route path="/" view=HomePage/>
            <Route path="/todo/:id" view=TodoDetail/>
        </Routes>
    </Router>
}
```

典型项目结构：`src/main.rs`（服务端入口）、`src/app.rs`（根组件 + 路由）、`src/components/`（UI 组件）、`src/server/`（服务端专用）、`src/models/`（前后端共享类型）。通过 `#[cfg(feature = "ssr")]` 区分前后端代码。

## 数据获取

`create_resource` 是异步数据加载原语，配合 `Suspense` 处理加载态，`ErrorBoundary` 处理错误态：

```rust
let todos = create_resource(|| (), |_| get_todos());
view! {
    <ErrorBoundary fallback=|errors| view! { <p>"出错了"</p> }>
        <Suspense fallback=move || view! { <p>"加载中..."</p> }>
            {move || todos.get().map(|data| /* 渲染 */)}
        </Suspense>
    </ErrorBoundary>
}
```

`Suspense` 在 SSR 下特别有用：可以等异步加载完成再发 HTML，或通过 streaming SSR 逐步填充。

缓存与 invalidation — `create_resource` 没有内置缓存层，常见做法：

- **手动 invalidation**：`resource.refetch()` 触发重新加载
- **乐观更新**：先更新本地信号，发请求，失败回滚
- **Action + Resource 联动**：

```rust
let add_todo = create_server_action::<AddTodo>();
let todos = create_resource(
    move || add_todo.version().get(),  // action 完成后版本变化，触发刷新
    |_| get_todos(),
);
```

## 状态管理

**Props 传递** — 小型组件树直接传信号，读写分开传：

```rust
#[component]
fn Parent() -> impl IntoView {
    let (name, set_name) = create_signal("Alice".to_string());
    view! { <Child name=name on_change=set_name/> }
}

#[component]
fn Child(name: ReadSignal<String>, on_change: WriteSignal<String>) -> impl IntoView {
    view! {
        <input
            prop:value=name
            on:input=move |ev| on_change.set(event_target_value(&ev))
        />
    }
}
```

**Context** — 跨多层组件用 `provide_context` / `use_context`，避免 props drilling：

```rust
// 顶层提供
provide_context(user_signal);

// 任意子组件获取
let user = use_context::<ReadSignal<Option<User>>>()
    .expect("应在 App 组件内使用");
```

**全局状态** — 复杂应用把相关信号组织成 struct，通过 context 提供。

### 与 Redux/Zustand 的对比

| 方面 | React 生态 | Leptos |
|------|-----------|--------|
| 基础单位 | state + setState / atom | Signal（ReadSignal + WriteSignal） |
| 派生数据 | useMemo / selector | create_memo |
| 跨组件共享 | Context / store | provide_context / use_context |
| 更新粒度 | 组件级重渲染 | DOM 节点级精确更新 |

Leptos 不需要外部状态库。心智转换：不再思考"哪个组件需要重渲染"，而是"哪个 DOM 节点依赖哪个信号"。

## 工程实践

### cargo-leptos

```bash
cargo install cargo-leptos
cargo leptos watch     # 开发模式（热重载）
cargo leptos build --release  # 生产构建
```

同时编译 SSR 和 Hydrate 两个 target，管理静态资源，处理 Wasm 优化。

编译速度是痛点，建议：开发用 `debug` profile、使用 `mold`（Linux）或 `zld`（macOS）链接器。

### 样式方案

Tailwind CSS 是主流选择，和 `view!` 宏配合良好。也有 Stylers 等 CSS-in-Rust 方案，但生态和文档不如 Tailwind。

### 部署

**Docker** — 最通用的方式，多阶段构建：

```dockerfile
FROM rust:1.77 AS builder
RUN cargo install cargo-leptos
COPY . .
RUN cargo leptos build --release

FROM debian:bookworm-slim
COPY --from=builder /target/release/my-app /app/my-app
COPY --from=builder /target/site /app/site
WORKDIR /app
ENV LEPTOS_SITE_ROOT=site
EXPOSE 3000
CMD ["./my-app"]
```

**Shuttle** — Rust 原生 serverless，对 Axum 项目零配置。**Vercel / Cloudflare Workers** — 通过 Wasm 运行时部署，但 SSR 模式支持有限制。

### 性能优化

Wasm 体积优化关键配置：

```toml
[profile.release]
opt-level = "z"       # 优化体积
lto = true
codegen-units = 1
strip = true
```

首屏优化：SSR + Hydration 先展示内容、Islands 减少 Wasm 体积、route-based 懒加载、gzip/brotli 压缩。

## 适用场景与局限

**适合**：全栈 Rust 团队统一技术栈、内部工具、计算密集型前端（数据可视化、在线编辑器）、追求全栈类型安全。

**不适合**：依赖大量第三方 JS 库、团队无 Rust 经验、快速迭代 MVP、SEO 密集型需要极致首屏。

### 与 React/Next.js 的务实对比

| 维度 | Leptos | React + Next.js |
|------|--------|----------------|
| 开发速度 | 较慢（编译、生态小） | 快（热重载快、npm 生态庞大） |
| 类型安全 | 编译期全栈类型安全 | TypeScript 有 any 逃生口 |
| 运行时性能 | 计算密集型场景占优 | V8 对大多数场景足够 |
| 生态 | 小而精 | 极其庞大 |
| 招人难度 | 高 | 低 |

除非有明确的 Rust 全栈理由，否则 React/Next.js 仍是更务实的选择。

## 常见误区

**"Rust 全栈比 JavaScript 更快"** — Wasm 计算密集型确实快，但 Web 应用瓶颈通常在 I/O 而非 CPU。大多数 CRUD 应用感知差距不大。

**"Leptos 可以完全替代 React"** — UI 组件生态远不如 React。日期选择器、富文本编辑器、图表库等，React 有几十个成熟选项，Leptos 可能需要自己封装或 JS interop。

**"Wasm SSR 和 Node.js SSR 一样成熟"** — Node.js SSR 经过十年打磨，Next.js 的 streaming SSR、ISR、Edge Runtime 都经过生产验证。Leptos SSR 功能完整但配套还在追赶。

**"所有 Rust 工程师都能立刻上手前端"** — 还需要学响应式编程模型、DOM 心智模型、CSS 布局、浏览器 API，这些和 Rust 语言能力正交。

**忽视 Wasm 体积对首屏的影响** — 中等复杂度 Leptos 应用 Wasm 优化后约 200KB-500KB（gzip），React 应用 JS bundle 通常 100KB-300KB。Wasm 解析速度更快，但总体首屏时间需要实测。

## 自检问题

1. Leptos 的信号系统和 React 的 useState 有什么本质区别？更新粒度的差异对性能有什么影响？

2. SSR + Hydration 模式下，服务端和客户端渲染结果不一致会发生什么？如何避免？

3. `#[server]` 宏在编译时做了什么？为什么能实现前后端类型共享？

4. Islands 架构和完整 Hydration 相比，什么场景下优势最明显？代价是什么？

5. 你的项目是否真的需要 Rust 全栈？列出三个选择 Leptos 而不是 Next.js 的具体理由。

6. 如何优化 Leptos 应用的 Wasm 体积？哪些 Cargo.toml 配置项直接影响产物大小？

7. `create_resource` 和 `create_memo` 的使用场景有什么区别？把异步数据加载写成 memo 会怎样？

8. Leptos + Axum 项目中，服务端专用代码和共享代码如何隔离？条件编译的边界怎么划？

## 交叉引用

- [Rust WebAssembly 实践](./webassembly-and-wasm-practice.md) — Wasm 工具链、浏览器集成、WASI 和性能边界
- [Axum Web 服务实践](./axum-web-service-practice.md) — Axum 的 Router、State、Extractor、Middleware 详解
- [Rust Web 框架生态与选型对比](./rust-web-framework-landscape.md) — Axum、Actix-web、Rocket 等后端框架的选型判断
