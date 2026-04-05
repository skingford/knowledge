---
title: 嵌入式 Rust 与 no_std 实践
description: 理解 Rust 在嵌入式场景下的核心优势、no_std 编程模型、HAL 抽象层、主流目标平台和工具链，以及 RTIC 与 Embassy 两种并发框架的选型。
search: false
---

# 嵌入式 Rust 与 no_std 实践

Rust 在嵌入式领域解决的是一个长期痛点：C/C++ 提供了极致的底层控制力，但内存安全几乎完全靠人工纪律。

Rust 的回答是：把零成本抽象、所有权系统和类型安全带到裸机环境，同时不引入垃圾回收和运行时开销。

这篇文章不是嵌入式 Rust 教程大全，而是把 no_std 基础、HAL 抽象、常见目标平台和工具链串成一条入门主线，帮你建立判断力：什么时候该用 Rust 写嵌入式，用什么生态组件，踩坑点在哪里。

## Rust 在嵌入式领域的独特价值

嵌入式环境有几个硬约束：没有操作系统（或只有极简 RTOS）、内存极小、不能有不可预测的停顿。

Rust 刚好在这些约束下有三个核心优势：

- **零成本抽象**：trait、泛型在编译期单态化，运行时不产生额外开销
- **内存安全无需 GC**：所有权系统在编译期消除悬垂指针、double free、数据竞争
- **类型系统表达硬件约束**：可以用类型状态模式（typestate）在编译期阻止非法的硬件操作序列

这不是理论上的好处。在实际嵌入式项目中，C 代码里最难调试的往往就是内存越界和并发竞态，而这两类问题 Rust 编译器能在编译期拦住大部分。

## no_std 是什么，为什么嵌入式需要它

Rust 标准库 `std` 依赖操作系统提供的能力：堆分配、线程、文件系统、网络。裸机环境没有这些，所以需要告诉编译器不要链接 `std`。

在 crate 根部加一行：

```rust
#![no_std]
```

这意味着你只能使用 `core` 库，以及在提供了 allocator 的情况下使用 `alloc` 库。

### core vs alloc vs std 的能力边界

| 层级 | 提供什么 | 依赖 |
|------|---------|------|
| `core` | 基本类型、Option、Result、Iterator、slice 操作、格式化 trait | 无，纯编译期 |
| `alloc` | Vec、String、Box、Rc、BTreeMap | 需要全局 allocator |
| `std` | 文件、网络、线程、HashMap、时间 | 需要操作系统 |

在大多数嵌入式场景里，你只用 `core`。部分有足够 RAM 的 MCU（比如某些 ESP32 型号）可以启用 `alloc`，但这不是默认选项。

### Panic handler 和 allocator

`no_std` 环境下必须自己提供 panic handler：

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}
```

如果启用 `alloc`，还需要提供全局 allocator：

```rust
use embedded_alloc::LlffHeap as Heap;

#[global_allocator]
static HEAP: Heap = Heap::empty();
```

实际工程里更常见的做法是用 `panic-halt`（挂起）或 `panic-probe`（通过调试探针输出 panic 信息）这类 crate 来处理。

### 常用 no_std crate

- **heapless** — 固定容量的 Vec、String、队列等，不需要堆分配
- **defmt** — 专为嵌入式设计的高效日志框架，日志格式化在 host 端完成
- **embedded-hal** — 硬件抽象层 trait 标准
- **cortex-m** / **cortex-m-rt** — ARM Cortex-M 的运行时支持
- **critical-section** — 跨平台的临界区抽象

## 嵌入式 Rust 生态全景

### embedded-hal — 硬件抽象层 trait 标准

这是整个嵌入式 Rust 生态的基石。它定义了一组 trait（GPIO、SPI、I2C、UART、Timer 等），让驱动可以写成泛型的，不绑定具体芯片。

```rust
use embedded_hal::digital::OutputPin;

fn blink<P: OutputPin>(pin: &mut P) {
    pin.set_high().ok();
    // ... delay ...
    pin.set_low().ok();
}
```

这个函数不关心底层是 STM32 还是 nRF52，只要平台实现了 `OutputPin` trait 就能用。

目前生态正从 embedded-hal 0.2 迁移到 1.0，两个版本 API 有较大差异，选 crate 时要注意版本兼容性。

### HAL 实现

每个芯片系列有自己的 HAL crate，实现 embedded-hal trait：

- **stm32-hal2** / **stm32f4xx-hal** — STM32 系列
- **nrf-hal** — Nordic nRF52/nRF53 系列
- **esp-hal** — Espressif ESP32 系列（bare metal）
- **rp-hal** — Raspberry Pi RP2040

### RTIC — 实时中断驱动并发框架

RTIC（Real-Time Interrupt-driven Concurrency）利用 ARM Cortex-M 的 NVIC 中断优先级来实现零成本的抢占式并发，不需要传统 RTOS 的调度器。

核心思路：把任务绑定到硬件中断优先级，资源访问通过编译期分析保证安全，不需要运行时锁。

### Embassy — async 嵌入式框架

Embassy 把 Rust 的 async/await 带到了嵌入式。它提供：

- 一个 executor（调度器），运行在单线程上
- 基于 async 的 HAL trait
- 内置 timer、networking 等异步原语

适合 I/O 密集型嵌入式场景，比如 BLE + sensor + 通信协议同时跑的项目。

### probe-rs — 调试和烧录工具

probe-rs 是纯 Rust 实现的调试器和烧录工具，支持 CMSIS-DAP、J-Link、ST-Link 等探针。它替代了传统的 OpenOCD + GDB 工作流，体验更好。

### defmt — 高效日志框架

传统嵌入式日志（比如 `println!` 转 UART）的问题是格式化字符串占大量 flash 空间。defmt 的方案是：在固件里只存格式化字符串的索引，实际格式化在 host 端完成。

日志体积可以比传统方案小 10 倍以上。

## 目标平台

### ARM Cortex-M（最成熟）

这是嵌入式 Rust 生态最完善的平台。常见 target：

| Target triple | 对应芯片 | 特点 |
|---|---|---|
| `thumbv6m-none-eabi` | Cortex-M0/M0+ | 最小核心，无硬件除法 |
| `thumbv7m-none-eabi` | Cortex-M3 | 无 FPU |
| `thumbv7em-none-eabi` | Cortex-M4/M7（软浮点） | 有 DSP 指令 |
| `thumbv7em-none-eabihf` | Cortex-M4F/M7F（硬浮点） | 最常用的工业级 target |

STM32、nRF52、RP2040 都在这个体系下，crate 覆盖度最高。

### RISC-V

target 如 `riscv32imc-unknown-none-elf`。ESP32-C3 是 RISC-V 架构，工具链支持已经基本可用。GD32V 等国产芯片也在这个体系下。

生态比 ARM Cortex-M 年轻，但在快速追赶。

### ESP32（Espressif）

Espressif 提供两条路线：

| 路线 | 框架 | 特点 |
|---|---|---|
| bare metal | esp-hal | 纯 no_std，直接操作硬件 |
| esp-idf | esp-idf-hal | 基于 ESP-IDF（C SDK），支持 std |

ESP32（Xtensa 架构）需要特殊的 Rust 编译器 fork（`espup` 安装）。ESP32-C3/C6（RISC-V 架构）可以用标准 Rust 工具链。

### 各平台成熟度对比

| 平台 | 生态成熟度 | HAL 稳定性 | async 支持 | 社区活跃度 |
|------|-----------|-----------|-----------|-----------|
| ARM Cortex-M | 高 | 稳定 | Embassy 良好 | 最活跃 |
| RISC-V | 中 | 快速迭代中 | 基本可用 | 增长中 |
| ESP32 (bare metal) | 中 | 快速迭代中 | Embassy 支持中 | 活跃 |
| ESP32 (esp-idf) | 中高 | 依赖 C SDK | 支持 std async | 活跃 |

## 开发工具链

### 安装目标平台支持

```bash
# 以 Cortex-M4F 为例
rustup target add thumbv7em-none-eabihf

# RISC-V
rustup target add riscv32imc-unknown-none-elf
```

### cargo 配置

在项目根目录创建 `.cargo/config.toml`：

```toml
[target.thumbv7em-none-eabihf]
runner = "probe-rs run --chip STM32F411CEUx"
rustflags = ["-C", "link-arg=-Tlink.x"]

[build]
target = "thumbv7em-none-eabihf"
```

这样 `cargo run` 就能直接编译并烧录到板子上。

### 链接脚本（memory.x）

嵌入式项目需要告诉链接器 flash 和 RAM 的地址范围：

```
MEMORY
{
    FLASH : ORIGIN = 0x08000000, LENGTH = 512K
    RAM   : ORIGIN = 0x20000000, LENGTH = 128K
}
```

这个文件通常由 HAL crate 提供模板，但具体数值要根据你的芯片手册调整。

### probe-rs 烧录和调试

```bash
# 安装
cargo install probe-rs-tools

# 烧录并运行
cargo run --release

# 单独烧录
probe-rs download --chip STM32F411CEUx target/thumbv7em-none-eabihf/release/my-firmware
```

### defmt-rtt 日志

在 `Cargo.toml` 中添加：

```toml
[dependencies]
defmt = "0.3"
defmt-rtt = "0.4"
panic-probe = { version = "0.3", features = ["print-defmt"] }
```

代码中使用：

```rust
use defmt::info;

info!("传感器读数: {}", value);
```

运行时通过 probe-rs 在终端看到格式化后的日志输出。

## RTIC vs Embassy

这是嵌入式 Rust 目前两个主流并发框架，设计哲学不同，适用场景也不同。

### RTIC：基于中断优先级的零成本并发

RTIC 的核心思想是把硬件中断优先级当作任务优先级，通过 NVIC（Nested Vectored Interrupt Controller）实现抢占式调度。

关键特征：

- 任务之间的资源共享通过编译期分析保证安全
- 不需要运行时调度器，零开销
- 非常适合硬实时场景
- 学习曲线较陡，需要理解中断优先级模型

```rust
#[rtic::app(device = stm32f4xx_hal::pac, dispatchers = [USART1])]
mod app {
    use super::*;

    #[shared]
    struct Shared {
        led: Pin<'A', 5, Output>,
    }

    #[local]
    struct Local {}

    #[init]
    fn init(ctx: init::Context) -> (Shared, Local) {
        // 初始化硬件
        let gpioa = ctx.device.GPIOA.split();
        let led = gpioa.pa5.into_push_pull_output();
        (Shared { led }, Local {})
    }

    #[task(shared = [led], priority = 1)]
    async fn blink(mut ctx: blink::Context) {
        loop {
            ctx.shared.led.lock(|led| led.toggle());
            // delay...
        }
    }
}
```

### Embassy：async/await 在嵌入式的实现

Embassy 的核心思想是让嵌入式代码用 async/await 表达并发，底层由一个协作式 executor 驱动。

关键特征：

- 代码风格更接近应用层 Rust
- 内置 timer、networking 等异步原语
- 协作式调度，不是抢占式
- 适合 I/O 密集但不需要硬实时保证的场景

```rust
use embassy_stm32::gpio::{Level, Output, Speed};
use embassy_time::Timer;

#[embassy_executor::main]
async fn main(_spawner: embassy_executor::Spawner) {
    let p = embassy_stm32::init(Default::default());
    let mut led = Output::new(p.PA5, Level::Low, Speed::Low);

    loop {
        led.set_high();
        Timer::after_millis(500).await;
        led.set_low();
        Timer::after_millis(500).await;
    }
}
```

### 选型建议

| 维度 | RTIC | Embassy |
|------|------|---------|
| 并发模型 | 抢占式（中断优先级） | 协作式（async executor） |
| 实时性 | 硬实时，可预测延迟 | 软实时，任务不能长时间阻塞 |
| 代码风格 | 声明式，宏驱动 | 接近普通 async Rust |
| 学习成本 | 高，需理解中断模型 | 中，熟悉 async 即可 |
| 生态集成 | 与 HAL 直接对接 | 自带一套 HAL 抽象 |
| 适合场景 | 电机控制、工业实时 | BLE、WiFi、传感器网络 |

一个简单的判断：如果你的应用有硬实时要求（微秒级响应），优先看 RTIC；如果你在做 IoT 设备、通信协议栈这类 I/O 密集的项目，Embassy 通常更顺手。

## 与 C/C++ 嵌入式的对比

### 优势

- **类型安全**：编译期消除大量内存错误，不需要靠 coding style 和人工 review 兜底
- **所有权系统**：自动管理资源生命周期，不容易出现忘记释放、重复释放
- **更好的抽象能力**：embedded-hal trait 让驱动和平台解耦，C 里通常靠宏或函数指针模拟
- **现代工具链**：cargo 的依赖管理比 C 的手动管 makefile + submodule 舒服得多

### 劣势

- **生态不够成熟**：很多芯片的 HAL 还在快速迭代，API 频繁变动
- **库移植成本**：大量成熟的嵌入式库（传感器驱动、协议栈）只有 C 版本，需要 FFI 桥接
- **编译器支持覆盖度**：某些小众架构 LLVM 支持不完善
- **学习曲线**：所有权和生命周期对嵌入式团队是额外的学习负担
- **二进制体积**：默认情况下 Rust 编译产物比等价 C 代码更大，需要专门优化

### 现实建议

如果是新项目、主流芯片（STM32、nRF52、ESP32）、团队愿意投入学习成本，Rust 是值得认真考虑的选择。

如果项目依赖大量已有 C 库、使用小众芯片、或者团队没有 Rust 经验且交付压力大，C 仍然是更稳的选择。

混合方案也很常见：核心安全逻辑用 Rust，底层硬件驱动复用已有 C 库通过 FFI 接入。

## 工程实践

### 项目结构

一个典型的嵌入式 Rust 项目结构：

```
my-firmware/
├── .cargo/
│   └── config.toml        # target 和 runner 配置
├── memory.x               # 链接脚本
├── src/
│   ├── main.rs            # 入口
│   ├── tasks/             # 任务模块
│   └── drivers/           # 自定义驱动
├── Cargo.toml
└── build.rs               # 构建脚本（可选）
```

### CI 中的交叉编译

```yaml
# GitHub Actions 示例
- name: Install target
  run: rustup target add thumbv7em-none-eabihf

- name: Build firmware
  run: cargo build --release --target thumbv7em-none-eabihf
```

CI 里通常只做编译检查，不做烧录。确保 `cargo build` 和 `cargo clippy` 能通过就覆盖了大部分静态质量问题。

### 测试策略

嵌入式测试分三层：

1. **Host test** — 把不依赖硬件的逻辑抽成独立 crate，在 host 上跑标准 `cargo test`
2. **QEMU 模拟** — 用 QEMU 模拟 Cortex-M 运行固件级测试，覆盖部分硬件交互
3. **硬件测试** — 在真实板子上跑，通常需要 probe-rs + defmt 输出测试结果

经验上，尽量把业务逻辑和硬件交互层分开，让大部分代码可以在 host 上测试。

### 固件大小优化

嵌入式 flash 空间宝贵，常用优化手段：

```toml
[profile.release]
opt-level = "z"       # 优化体积
lto = true            # 链接时优化
codegen-units = 1     # 单编译单元，更好优化
panic = "abort"       # 不生成 unwind 表
strip = true          # 去掉符号表
```

用 `cargo-bloat` 或 `cargo size` 检查各模块占用：

```bash
cargo install cargo-bloat
cargo bloat --release -n 20
```

## 常见误区

### "no_std 意味着不能用任何标准库功能"

不对。`core` 库提供了大量基础能力：Option、Result、Iterator、slice 操作、格式化 trait 等。你失去的主要是堆分配和操作系统接口，而不是所有标准库功能。

### "Rust 嵌入式已经完全可以替代 C"

还没到那一步。HAL 生态仍在快速迭代，很多芯片的支持不够完善，大量成熟的嵌入式库只有 C 版本。Rust 嵌入式更像"在特定芯片和场景下已经可以用于生产"，而不是"全面替代 C"。

### "async 在嵌入式没用"

Embassy 已经证明 async/await 在嵌入式是可行且高效的。对于 I/O 密集型嵌入式应用（BLE、WiFi、多传感器轮询），async 模型比手动状态机清晰得多。但它不适合所有场景，硬实时需求还是要看 RTIC 或裸中断。

### "所有 crate 都支持 no_std"

大量 crate 默认依赖 `std`。选择依赖时要检查 crate 是否标注了 `#![no_std]` 支持，或者是否提供 `no_std` feature flag。crates.io 上很多 crate 没有明确标注，需要看源码确认。

### 忽视 HAL 版本碎片化

embedded-hal 0.2 到 1.0 是一次大版本迁移，很多 HAL 实现和驱动 crate 还卡在 0.2。混用两个版本的 crate 会导致 trait 不兼容。选型时要确认整条依赖链的 embedded-hal 版本一致。

## 自检

你至少应该能回答：

1. `#![no_std]` 去掉了什么，保留了什么？`core` 和 `alloc` 的边界在哪里？
2. 为什么嵌入式 Rust 项目需要自己提供 panic handler？
3. embedded-hal 解决了什么问题？为什么说它是嵌入式 Rust 生态的基石？
4. RTIC 和 Embassy 的并发模型有什么本质区别？什么场景选哪个？
5. 在 CI 中无法接真实硬件时，嵌入式项目的测试策略是什么？
6. Rust 嵌入式相比 C 的核心优势和当前最大劣势分别是什么？
7. 如何判断一个 crate 是否支持 no_std？
8. 固件体积优化有哪些关键的 Cargo profile 配置？

这些问题打通后，可以根据具体芯片平台深入对应的 HAL 文档和框架实践。

## 延伸阅读

- [Unsafe 与 FFI 边界](./unsafe-and-ffi-boundaries.md) — 嵌入式经常需要调用 C 库，FFI 边界的安全原则在这里尤其重要
- [并发与 Async 基础](./concurrency-and-async.md) — Embassy 的 async 模型建立在 Rust async 基础之上，理解 Future 和 executor 是前提
- [交叉编译与目标平台](./cross-compilation-and-targets.md) — 嵌入式开发本质上就是交叉编译，工具链配置的完整参考
