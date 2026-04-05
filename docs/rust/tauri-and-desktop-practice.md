---
title: Rust 桌面应用与 Tauri 实践
description: 从 Rust 桌面框架选型、Tauri 2.0 架构、前后端通信、系统 API 到打包分发，串起桌面应用开发的工程主线。
search: false
---

# Rust 桌面应用与 Tauri 实践

Rust 做后端服务和 CLI 工具已经比较成熟了，但桌面应用一直是一个"能做但不确定怎么选"的领域。

常见的困惑：

- 要不要用 Electron？Tauri 到底比它好在哪？
- 纯 Rust GUI 框架能不能用？
- Tauri 前后端怎么通信，权限怎么管？
- 打包分发和自动更新怎么搞？

这页的目标不是把每个框架的 API 都列一遍，而是帮你建立这样的判断力：

- 什么场景选什么方案
- Tauri 2.0 的架构和工程主线是什么
- 从开发到分发，一条路走通要经过哪些关键节点

## Rust 桌面框架全景

先拉开视角看一下目前 Rust 生态里的桌面方案。

| 框架 | 模型 | 前端技术 | 定位 | 适合场景 |
| --- | --- | --- | --- | --- |
| **Tauri** | Web 前端 + Rust 后端 | HTML/CSS/JS（任意前端框架） | 轻量安全的桌面容器 | 需要丰富 UI 的通用桌面应用 |
| **egui** / eframe | 即时模式 GUI | 纯 Rust | 简单直接，无外部依赖 | 开发工具、调试面板、内部工具 |
| **Iced** | Elm 架构、声明式 | 纯 Rust | 类 Elm 的函数式 GUI | 中等复杂度的原生应用 |
| **Dioxus Desktop** | React-like、VDOM | RSX（类 JSX） | 跨平台统一（Web/Desktop/Mobile） | 想用一套代码覆盖多端 |
| **Slint** | 声明式 UI 语言 | .slint 文件 + Rust/C++ 后端 | 嵌入式和桌面通用 | 资源受限设备、嵌入式 UI |

选型建议：

- **需要丰富 UI、复杂交互、成熟前端生态**：Tauri 是当前最实用的选择
- **只需要简单 GUI、快速出工具**：egui 上手最快，不需要前端知识
- **想要纯 Rust、函数式架构**：Iced 适合对 Elm 模型有好感的人
- **想要一套代码跨 Web、桌面和移动端**：Dioxus 在快速发展，值得关注
- **嵌入式或资源受限环境**：Slint 有独特优势

对大多数"需要做一个正经桌面应用"的场景来说，Tauri 是现阶段最值得深入学的方案。下面集中讲它。

## Tauri vs Electron：根本差异

Electron 把完整的 Chromium 和 Node.js 打包进应用。Tauri 不打包浏览器引擎，而是调用操作系统自带的 WebView。

这个区别带来的连锁效应：

| 维度 | Tauri | Electron |
| --- | --- | --- |
| 安装包体积 | 通常 2-5 MB | 通常 100 MB+ |
| 内存占用 | 更低（共享系统 WebView） | 更高（自带 Chromium） |
| 后端语言 | Rust | Node.js |
| 安全模型 | 默认最小权限，按需授权 | 默认全权限，需主动限制 |
| 前端兼容性 | 依赖系统 WebView 版本 | 锁定 Chromium 版本，一致性更高 |
| 生态成熟度 | 快速发展中，插件不断增加 | 非常成熟，社区庞大 |

关键判断：

- 如果在意体积和安全，优先 Tauri
- 如果团队前端强但不想碰 Rust，Electron 阻力更小
- 如果已有 Rust 后端能力，Tauri 的优势会更明显

## Tauri 2.0 架构

Tauri 2.0 的核心模型很清晰：一个 Rust 进程（核心进程）驱动一个或多个 WebView 窗口（前端进程）。

### 核心进程与 WebView 的关系

```text
┌─────────────────────────────┐
│       Rust Core Process     │
│  ┌───────────┐ ┌──────────┐ │
│  │  Commands │ │  Plugins │ │
│  └─────┬─────┘ └────┬─────┘ │
│        │    IPC     │       │
│  ┌─────┴────────────┴─────┐ │
│  │     Tauri Runtime      │ │
│  └────────────┬───────────┘ │
└───────────────┼─────────────┘
                │
        ┌───────┴───────┐
        │   WebView     │
        │ (系统原生)     │
        │ HTML/CSS/JS   │
        └───────────────┘
```

- **核心进程**：Rust 编写，管理窗口、系统 API、业务逻辑
- **WebView 进程**：渲染 UI，运行前端代码
- **IPC**：两者之间通过 Command 和 Event 通信

### IPC 通信模型

前端调用后端用 Command，后端推送前端用 Event。这两条通道覆盖了绝大多数场景。

### 权限模型（Capabilities）

Tauri 2.0 引入了声明式权限系统。前端默认没有任何系统访问能力，必须在配置里显式声明：

```json
{
  "identifier": "main-window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "fs:allow-read-text-file",
    "dialog:allow-open"
  ]
}
```

这跟 Electron 默认全开的模型完全相反。好处是：

- 最小权限原则，默认安全
- 审计时可以直接看配置文件
- 细粒度控制每个窗口的能力

### 插件系统

Tauri 的系统 API 大多以插件形式提供。核心只保留最基本的窗口和 IPC 能力，文件系统、对话框、通知等全部通过插件注册。

## 前后端通信

这是 Tauri 开发中最核心的部分。理解 Command 和 Event 两套机制，就能覆盖大多数通信需求。

### Command 定义与调用

后端定义 Command：

```rust
use tauri::command;

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

前端调用：

```typescript
import { invoke } from "@tauri-apps/api/core";

const greeting = await invoke<string>("greet", { name: "Rust" });
console.log(greeting); // "Hello, Rust!"
```

几个关键点：

- Command 名称默认是函数名（snake_case）
- 参数通过 JSON 传递，前端用对象，后端用结构体或基本类型
- 返回值自动经过 serde 序列化

### 参数传递与返回值

复杂参数用结构体接，前后端通过 serde 自动序列化/反序列化。请求参数用 `Deserialize`，返回值用 `Serialize`，跟写 Web API 的 DTO 模式一致。

前端调用时参数名要和 Rust 函数签名对应：

```typescript
const note = await invoke<NoteResponse>("create_note", {
  request: { title: "My Note", content: "Hello", tags: ["rust"] },
});
```

### 事件系统

Command 是请求-响应模式。如果需要后端主动推送，用事件系统。

后端发送事件：

```rust
use tauri::{AppHandle, Emitter};

fn notify_progress(app: &AppHandle, progress: u32) {
    app.emit("download-progress", progress)
        .expect("failed to emit event");
}
```

前端监听：

```typescript
import { listen } from "@tauri-apps/api/event";

const unlisten = await listen<number>("download-progress", (event) => {
  console.log(`Progress: ${event.payload}%`);
});

// 不再需要时取消监听
unlisten();
```

前端也可以向后端发事件：

```typescript
import { emit } from "@tauri-apps/api/event";

await emit("user-action", { action: "click", target: "button-1" });
```

### State 管理（Managed State）

Tauri 提供类似 axum 的 State 提取机制：

```rust
use std::sync::Mutex;
use tauri::{command, State};

struct AppState {
    counter: Mutex<u32>,
}

#[command]
fn increment(state: State<'_, AppState>) -> u32 {
    let mut counter = state.counter.lock().unwrap();
    *counter += 1;
    *counter
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            counter: Mutex::new(0),
        })
        .invoke_handler(tauri::generate_handler![increment])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

注意：

- State 在所有 Command 之间共享，需要考虑并发安全
- 用 `Mutex` 或 `RwLock` 保护可变状态
- 复杂场景可以用 `tokio::sync::RwLock` 配合 async Command

### 错误处理

Command 可以返回 `Result`，错误类型需要实现 `Serialize`：

```rust
#[derive(Debug, Serialize)]
struct AppError { code: String, message: String }

#[command]
fn read_config(path: &str) -> Result<String, AppError> {
    std::fs::read_to_string(path).map_err(|e| AppError {
        code: "FILE_READ_ERROR".to_string(),
        message: e.to_string(),
    })
}
```

前端通过 `try/catch` 捕获，拿到的是序列化后的错误对象。建议定义统一的错误结构，让前端能做结构化处理，而不是只拿到一个字符串。

## 系统 API 与插件

### 常用官方插件

Tauri 2.0 把大量系统能力拆成了独立插件：

| 插件 | Crate | 功能 |
| --- | --- | --- |
| fs | `tauri-plugin-fs` | 文件系统读写 |
| dialog | `tauri-plugin-dialog` | 文件选择、确认对话框 |
| notification | `tauri-plugin-notification` | 系统通知 |
| clipboard | `tauri-plugin-clipboard-manager` | 剪贴板读写 |
| shell | `tauri-plugin-shell` | 执行外部命令 |
| http | `tauri-plugin-http` | HTTP 客户端 |
| store | `tauri-plugin-store` | 持久化键值存储 |
| updater | `tauri-plugin-updater` | 应用自动更新 |
| log | `tauri-plugin-log` | 日志 |

注册插件的模式统一：

```rust
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

前端调用走各自的 JS API，比如 `@tauri-apps/plugin-dialog` 提供 `open()`、`save()` 等方法，`@tauri-apps/plugin-fs` 提供 `readTextFile()`、`writeTextFile()` 等。

### 自定义插件开发

当官方插件不够用时，可以用 `tauri::plugin::Builder` 封装自己的插件。插件的好处是把一组相关的 Command、State 和权限封装在一起，方便复用和分发。

```rust
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("my-plugin")
        .invoke_handler(tauri::generate_handler![my_custom_command])
        .build()
}
```

## 打包与分发

### 各平台打包

Tauri CLI 内置打包能力：

```bash
# 构建发布版本
cargo tauri build
```

各平台默认产物：

- **macOS**：`.dmg`、`.app`
- **Windows**：`.msi`（WiX）或 `.exe`（NSIS）
- **Linux**：`.deb`、`.AppImage`、`.rpm`

在 `tauri.conf.json` 中配置打包细节：

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "identifier": "com.example.myapp",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### 自动更新

使用 `tauri-plugin-updater`，在配置中声明更新端点和公钥，前端通过 `check()` 检测并触发 `downloadAndInstall()`。

关键细节：

- 更新需要代码签名验证
- 服务端返回的 JSON 要符合 Tauri 约定的格式
- 建议用 GitHub Releases 或自建静态文件服务

### 代码签名

- **macOS**：需要 Apple Developer 证书，否则用户打开时会有安全警告
- **Windows**：推荐使用 EV 代码签名证书，避免 SmartScreen 拦截
- **Linux**：一般不强制签名，但可以用 GPG 签名包

### CI/CD 集成

官方提供 `tauri-apps/tauri-action`，可以直接在 GitHub Actions 里用 matrix 策略跨三个平台构建。核心流程：checkout → 安装 Rust 和 Node → 安装前端依赖 → `tauri-action` 构建并上传产物。

注意 Linux 构建需要额外安装 `libwebkit2gtk-4.1-dev` 和 `libappindicator3-dev` 等系统库，这是一个常见的卡点。

## 工程实践

### 项目结构推荐

```text
my-app/
├── src-tauri/            # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json   # Tauri 配置
│   ├── capabilities/     # 权限声明
│   │   └── main.json
│   ├── src/
│   │   ├── main.rs       # 入口
│   │   ├── commands/     # Command 模块
│   │   │   ├── mod.rs
│   │   │   └── notes.rs
│   │   ├── state.rs      # 共享状态
│   │   └── error.rs      # 错误定义
│   └── icons/
├── src/                  # 前端代码
│   ├── App.tsx
│   ├── main.tsx
│   └── components/
├── package.json
└── vite.config.ts
```

### 前端框架选择

Tauri 对前端框架没有限制。常见选择：

- **React**：生态最大，组件库最多
- **Vue**：模板语法友好，上手快
- **Svelte**：编译时框架，产物更小
- **Solid**：性能极致，语法接近 React

一个实用建议：如果团队已有前端技术栈偏好，直接沿用。如果从零开始且在意包体积，Svelte 和 Solid 值得优先考虑。

### 开发体验

```bash
# 启动开发模式（前端 hot reload + Rust 自动重编译）
cargo tauri dev
```

- 前端修改实时生效
- Rust 代码修改后自动重新编译（比纯后端项目慢一些，因为要重启整个应用）
- 可以用浏览器 DevTools 调试前端
- Rust 侧用标准的 `println!` 或 `tracing` 输出日志

### 性能优化

几个常见优化点：

- **减小前端产物体积**：tree shaking、代码分割、压缩
- **Rust 侧避免阻塞主线程**：耗时操作用 async Command 或 spawn 到独立线程
- **减少 IPC 调用次数**：批量操作优于频繁的单次调用
- **图片和静态资源优化**：WebP 格式、合理缓存

## 常见误区

### "Tauri 和 Electron 用法一样"

不一样。Electron 前端可以直接调用 Node.js API，几乎没有隔离。Tauri 前端默认什么系统能力都没有，必须通过 Command 或插件显式开放。这意味着你不能简单地把 Electron 项目的代码搬过来。

### "Tauri 前端可以访问任何系统 API"

不行。所有系统访问都要经过 Rust 核心进程，并且需要在 capabilities 配置中授权。前端代码运行在沙箱里，这是 Tauri 安全模型的核心。

### "体积小就意味着功能少"

Tauri 体积小是因为不打包浏览器引擎，不是因为功能被阉割了。Rust 后端可以做任何系统级操作，功能上限不低于 Electron。

### "Tauri 只适合简单应用"

已有不少复杂应用基于 Tauri 构建（如笔记工具、IDE 辅助工具、数据库客户端等）。架构上没有限制，复杂度取决于你的工程能力。

### 忽视跨平台差异

虽然 Tauri 号称跨平台，但不同平台的 WebView 引擎不同（macOS 是 WebKit、Windows 是 WebView2、Linux 是 WebKitGTK），渲染和行为可能有差异。务必在目标平台上实际测试。

## 自检问题

读完这页后，建议用这几个问题检验自己的理解：

1. Tauri 和 Electron 的体积差异根本原因是什么？
2. Tauri 2.0 的权限模型（capabilities）解决了什么问题？
3. Command 和 Event 分别适合什么场景？什么时候该用 Command，什么时候该用 Event？
4. 在 Tauri Command 中如何安全地管理共享状态？
5. 为什么不能把 Electron 项目的前端代码直接搬到 Tauri？
6. 纯 Rust GUI 框架（如 egui、Iced）和 Tauri 的根本定位差异是什么？
7. Tauri 跨平台打包时，Linux 构建有什么额外要求？
8. 如何设计 Command 的错误处理，让前端能拿到结构化的错误信息？

## 相关阅读

- [Serde 与数据序列化实践](./serde-and-data-serialization.md) - Command 参数和返回值的序列化基础
- [Rust 配置管理实践](./configuration-management-practice.md) - 应用配置的建模和加载模式
- [WebAssembly 与 Wasm 实践](./webassembly-and-wasm-practice.md) - Rust 的另一个前端方向

如果你已经有 Rust 后端基础，Tauri 是把 Rust 能力延伸到桌面端最自然的一步。建议从一个小工具开始，把 Command 通信和打包流程跑通，再逐步增加复杂度。
