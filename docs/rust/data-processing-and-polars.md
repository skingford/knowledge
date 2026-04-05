---
title: Rust 数据处理与 Polars 生态
description: 梳理 Rust 数据处理的工程主线，涵盖 Polars DataFrame、Apache Arrow 列式格式、DataFusion 查询引擎与 Python 互操作，帮助工程师建立数据工程技术选型的判断力。
search: false
---

# Rust 数据处理与 Polars 生态

## 这篇在解决什么问题

Rust 在数据处理领域正在快速崛起，但它不只是"Python 的替代品"。真正的价值在三个维度：

- **性能**：零成本抽象 + 无 GC，处理百 GB 级数据集时优势明显
- **类型安全**：数据管道的 schema 错误在编译期就能被捕获
- **可嵌入**：可以编译成 Python 扩展、WASM 模块、嵌入式查询引擎

但现实中，很多工程师面对 Polars、Arrow、DataFusion 这些名字时，分不清它们各自的定位和协作关系。

这篇的目标：把 Polars、Arrow、DataFusion 和 Python 互操作串成一条数据工程主线，让你在技术选型时有判断力，而不是逐个翻文档。

## 生态全景

Rust 数据处理生态围绕 Apache Arrow 内存格式展开，核心组件：

| 组件 | 定位 | 类比 |
|------|------|------|
| **arrow-rs** | 列式内存格式，零拷贝数据交换 | NumPy 的内存布局层 |
| **Polars** | DataFrame 库，惰性求值 + 查询优化 | pandas 的高性能替代 |
| **DataFusion** | SQL 查询引擎，基于 Arrow | 嵌入式的 Presto/Trino |
| **delta-rs** | Rust 实现的 Delta Lake | Delta Lake Java 的 Rust 移植 |
| **Ballista** | 分布式查询引擎 | 分布式版 DataFusion |

它们之间的关系：

```
                    ┌─────────────┐
                    │   应用层     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌───▼────┐ ┌────▼─────┐
        │  Polars    │ │DataFusion│ │ delta-rs │
        │ DataFrame  │ │  SQL    │ │ 存储层   │
        └─────┬──────┘ └───┬────┘ └────┬─────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  arrow-rs   │
                    │ 列式内存格式 │
                    └─────────────┘
```

关键认知：**Arrow 是底层内存格式，其他组件都建立在它之上**。Polars 和 DataFusion 是同层但不同方向——一个走 DataFrame API，一个走 SQL API。

## Polars 核心概念

### DataFrame 和 LazyFrame

Polars 有两种操作模式：

- **DataFrame（Eager）**：立即执行，类似 pandas
- **LazyFrame（Lazy）**：构建查询计划，延迟执行，允许优化

```rust
use polars::prelude::*;

// Eager 模式：立即执行
let df = CsvReadOptions::default()
    .try_into_reader_with_file_path(Some("data.csv".into()))?
    .finish()?;

// Lazy 模式：构建查询计划，最后 collect 时才执行
let lf = LazyCsvReader::new("data.csv").finish()?;
let result = lf
    .filter(col("age").gt(lit(30)))
    .group_by([col("city")])
    .agg([col("salary").mean()])
    .collect()?;
```

工程建议：**优先用 LazyFrame**。它能做谓词下推、投影裁剪、并行执行等优化，性能通常优于手动写的 Eager 链。

### 表达式系统（Expr）

Polars 的核心不是方法链，而是表达式系统。表达式描述的是"对列做什么操作"，和具体的 DataFrame 解耦：

```rust
// 表达式是独立的，可以复用
let salary_stats = col("salary").mean().alias("avg_salary");
let age_filter = col("age").gt(lit(25));

// 同一个表达式可以用在不同上下文
let result = lf
    .filter(age_filter)
    .group_by([col("department")])
    .agg([salary_stats])
    .collect()?;
```

表达式的几个关键上下文：

- `select` / `with_columns`：列级别变换
- `filter`：行级别过滤
- `group_by(...).agg(...)`：聚合上下文
- `sort`：排序

### 惰性求值与查询优化

LazyFrame 的查询优化器会自动做这些事：

- **谓词下推**：把 filter 条件推到数据源层，减少读取量
- **投影裁剪**：只读取用到的列
- **公共子表达式消除**：重复计算只做一次
- **并行执行**：自动利用多核

你可以用 `describe_plan()` 和 `describe_optimized_plan()` 来查看优化前后的差异，直观感受优化器做了什么。

### 数据类型系统

Polars 有自己的类型系统，不是直接用 Rust 原生类型：

- 数值：`Int8` ~ `Int64`、`UInt8` ~ `UInt64`、`Float32`、`Float64`
- 字符串：`String`（UTF-8）、`Categorical`
- 时间：`Date`、`Datetime`、`Duration`、`Time`
- 嵌套：`List`、`Struct`、`Array`
- 特殊：`Null`、`Boolean`、`Binary`

### 读写格式

```rust
// CSV
let df = CsvReadOptions::default()
    .try_into_reader_with_file_path(Some("data.csv".into()))?
    .finish()?;

// Parquet（推荐用于大数据集）
let df = LazyFrame::scan_parquet("data.parquet", Default::default())?
    .collect()?;

// JSON
let df = JsonReader::new(std::io::BufReader::new(file)).finish()?;

// IPC (Arrow 格式，零拷贝最快)
let df = IpcReader::new(file).finish()?;
```

工程建议：中间存储优先用 Parquet 或 IPC。CSV 只在数据交换入口使用，JSON 只在必须兼容 Web API 时用。

## Polars 实战示例

### 读取、过滤、聚合

```rust
use polars::prelude::*;

fn analyze_sales() -> PolarsResult<DataFrame> {
    let lf = LazyCsvReader::new("sales.csv").finish()?;

    lf.filter(col("amount").gt(lit(100)))
        .group_by([col("region")])
        .agg([
            col("amount").sum().alias("total_sales"),
            col("amount").mean().alias("avg_sale"),
            col("order_id").count().alias("order_count"),
        ])
        .sort(["total_sales"], SortMultipleOptions::default().with_order_descending(true))
        .collect()
}
```

### GroupBy 与窗口函数

窗口函数允许在不减少行数的前提下做分组计算：

```rust
let result = lf
    .with_columns([
        // 每个部门的平均薪资，作为新列附加
        col("salary")
            .mean()
            .over([col("department")])
            .alias("dept_avg_salary"),
        // 每个部门内的薪资排名
        col("salary")
            .rank(RankOptions::default(), None)
            .over([col("department")])
            .alias("salary_rank"),
    ])
    .collect()?;
```

### Join 操作

```rust
let orders = LazyCsvReader::new("orders.csv").finish()?;
let customers = LazyCsvReader::new("customers.csv").finish()?;

let result = orders
    .join(
        customers,
        [col("customer_id")],
        [col("id")],
        JoinArgs::new(JoinType::Left),
    )
    .collect()?;
```

### 大数据集处理

当数据集较大时，Polars 的 LazyFrame 会自动决定是否启用 streaming 模式分批处理。对于 Parquet 文件，`scan_parquet` 天然支持谓词下推到文件层面，只读取需要的 row groups，这是处理大数据集的首选方式。

## Arrow 生态

### 核心抽象

arrow-rs 提供三层核心抽象：

- **Array**：单列数据，类型化的连续内存块
- **RecordBatch**：多列组合，共享同一个 Schema
- **Schema**：列名 + 数据类型的元信息

```rust
use arrow::array::{Int32Array, StringArray};
use arrow::datatypes::{DataType, Field, Schema};
use arrow::record_batch::RecordBatch;
use std::sync::Arc;

let schema = Schema::new(vec![
    Field::new("id", DataType::Int32, false),
    Field::new("name", DataType::Utf8, false),
]);

let batch = RecordBatch::try_new(
    Arc::new(schema),
    vec![
        Arc::new(Int32Array::from(vec![1, 2, 3])),
        Arc::new(StringArray::from(vec!["alice", "bob", "carol"])),
    ],
)?;
```

### 零拷贝和内存对齐

Arrow 的核心设计原则：

- 所有数据 64 字节对齐，对 SIMD 友好
- 跨进程、跨语言传递时不需要序列化/反序列化
- Null 用独立的 bitmap 表示，不浪费数据列的空间

这意味着一个 Python 进程产生的 Arrow 数据，Rust 进程可以直接读，无需复制。

### IPC 格式与跨语言数据交换

Arrow IPC 是跨语言数据交换的首选格式。arrow-rs 提供 `FileWriter` / `FileReader` 和 `StreamWriter` / `StreamReader` 两套 API，分别用于文件和流式场景。写入时通过 `FileWriter::try_new` 创建 writer，逐个写入 RecordBatch；读取时通过 `FileReader::try_new` 迭代所有 batch。

### 与 Polars 的关系

Polars 内部使用自己的内存格式（基于 Arrow 但有优化），但提供了与 arrow-rs 的互转：

```rust
// Polars DataFrame → Arrow RecordBatch
let batches = df.to_arrow(CompatLevel::newest(), true);

// Arrow RecordBatch → Polars DataFrame
let df = DataFrame::try_from(batch)?;
```

两者可以无缝切换。当你需要 Polars 做不到的底层操作时，转到 Arrow 层处理，再转回来。

## DataFusion

### 用 SQL 查询 Arrow 数据

DataFusion 是一个嵌入式 SQL 查询引擎，基于 Arrow 内存格式：

```rust
use datafusion::prelude::*;

#[tokio::main]
async fn main() -> datafusion::error::Result<()> {
    let ctx = SessionContext::new();

    // 注册 CSV 文件为表
    ctx.register_csv("sales", "sales.csv", CsvReadOptions::new()).await?;

    // 用 SQL 查询
    let df = ctx.sql("
        SELECT region, SUM(amount) as total
        FROM sales
        WHERE amount > 100
        GROUP BY region
        ORDER BY total DESC
    ").await?;

    df.show().await?;
    Ok(())
}
```

### 自定义 TableProvider

DataFusion 的扩展性在于 `TableProvider` trait——你可以为任何数据源实现 `schema()` 和 `scan()` 方法，让 Redis、自定义文件格式、甚至远程 API 都变成 SQL 可查询的表。核心是实现数据扫描逻辑并返回 `ExecutionPlan`。

### Polars 与 DataFusion 的互补

两者不是竞争关系，而是不同场景的最优解：

| 场景 | 选 Polars | 选 DataFusion |
|------|-----------|---------------|
| 程序化数据分析 | 适合 | 不太合适 |
| 用户输入的 SQL 查询 | 不合适 | 适合 |
| 嵌入到应用中的查询引擎 | 可以但笨重 | 设计初衷 |
| ETL 数据管道 | 适合 | 可以但不如 Polars 灵活 |
| 数据湖查询 | 有限支持 | 原生支持 |

典型的组合方式：DataFusion 负责 SQL 解析和查询规划，Polars 负责具体的数据处理逻辑。

## 与 Python 互操作

### PyO3 + Polars

用 Rust 写 Python 扩展，把性能瓶颈的数据处理下沉到 Rust 层：

```rust
use pyo3::prelude::*;
use polars::prelude::*;
use pyo3_polars::PyDataFrame;

#[pyfunction]
fn process_data(py_df: PyDataFrame) -> PyResult<PyDataFrame> {
    let df = py_df.into();

    let result = df.lazy()
        .filter(col("value").gt(lit(0)))
        .group_by([col("category")])
        .agg([col("value").sum()])
        .collect()
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

    Ok(PyDataFrame(result))
}

#[pymodule]
fn my_rust_extension(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(process_data, m)?)?;
    Ok(())
}
```

Python 侧调用：

```python
import polars as pl
from my_rust_extension import process_data

df = pl.read_csv("data.csv")
result = process_data(df)
```

### polars-python 的实现方式

Polars 的 Python API 本身就是这种模式的典范——核心逻辑全部用 Rust 实现，Python 层只是薄薄的接口层。这也是 Polars 比 pandas 快的根本原因之一：不是算法更好，而是执行层换成了 Rust。

### 何时用 Rust 替代 Python 数据管道

值得迁移的场景：

- 数据量大到 Python 进程 OOM 或运行超过分钟级
- 管道需要部署为长期运行的服务
- 需要严格的类型安全和错误处理
- 需要编译为单一二进制分发

不值得迁移的场景：

- 一次性的探索性分析
- 团队全是 Python 背景，没有 Rust 维护能力
- 数据量小，Python 几秒就能跑完

### 性能对比参考

在典型的 CSV 读取 → 过滤 → GroupBy → 聚合场景中（以 100M 行级别数据集为参考）：

- pandas：基线
- Polars Python API：通常快 5-20 倍
- Polars Rust API：与 Python API 接近（因为底层是同一份 Rust 代码）
- 纯 Rust + Arrow 手写：可以更快，但开发成本高很多

结论：大多数场景用 Polars Python API 就够了，Rust API 的价值在嵌入和分发场景。

## 工程实践

### 在后端服务中嵌入数据分析

常见模式：在 axum / actix-web 的 handler 中直接用 `LazyFrame::scan_parquet` 加载数据，配合 filter、group_by、agg 做实时聚合，将结果序列化为 JSON 返回。这种方式省去单独的分析服务，适合数据量在 GB 以内的场景。更大的数据集应该走专门的分析引擎或预计算。

### ETL Pipeline 的 Rust 实现模式

典型结构遵循 Extract → Transform → Load：

```rust
async fn run_pipeline() -> Result<()> {
    // Extract
    let orders = LazyCsvReader::new("orders.csv").finish()?;
    let products = LazyFrame::scan_parquet("products.parquet", Default::default())?;

    // Transform
    let result = orders
        .join(products, [col("product_id")], [col("id")], JoinArgs::new(JoinType::Inner))
        .filter(col("status").eq(lit("completed")))
        .with_columns([(col("quantity") * col("unit_price")).alias("total_price")])
        .group_by([col("category")])
        .agg([col("total_price").sum().alias("revenue")]);

    // Load
    let df = result.collect()?;
    ParquetWriter::new(std::fs::File::create("output/revenue.parquet")?)
        .finish(&mut df.clone())?;
    Ok(())
}
```

### 内存管理和大数据集策略

几条实用原则：

1. **用 LazyFrame 而非 DataFrame**：让优化器决定何时物化
2. **用 scan 而非 read**：`scan_parquet` 支持谓词下推和投影裁剪
3. **及时 drop 不再使用的 DataFrame**：Polars 的内存回收依赖 Rust 的 RAII
4. **分区读取**：对于超大数据集，按分区目录组织 Parquet 文件
5. **关注 String 列**：字符串列的内存占用通常远超数值列，考虑用 Categorical 替代

### 从数据库加载到 Arrow

基本思路：用 sqlx 查询数据库，逐行用 arrow-rs 的 Builder（如 `Int32Builder`、`StringBuilder`）收集数据，最后 `finish()` 构建 Array 并组装成 RecordBatch。

更省事的做法是用 `connectorx`，它直接把 SQL 查询结果转成 Arrow RecordBatch，省去手动 Builder 的样板代码。

## 常见误区

### "Polars 是 Rust 版的 pandas"

表面看都是 DataFrame 库，但架构根本不同：

- pandas 是单线程、基于 NumPy 的行式处理
- Polars 是多线程、列式存储、惰性求值、有查询优化器

Polars 更接近数据库查询引擎，只是暴露了 DataFrame API。

### "Rust 数据处理只适合性能敏感场景"

忽视了其他优势：类型安全让数据管道更可靠，单一二进制分发让部署更简单，WASM 编译让浏览器端数据处理成为可能。

### "Arrow 只是一个序列化格式"

Arrow 首先是一个**内存格式**标准。它定义的是数据在内存中如何布局，不是如何写到磁盘。IPC 和 Parquet 才是序列化格式——IPC 是 Arrow 的线格式，Parquet 是面向存储优化的列式格式。

### "DataFusion 可以替代 Spark"

DataFusion 是单机嵌入式引擎。Ballista 是它的分布式版本，但成熟度远不及 Spark。DataFusion 的定位是嵌入到应用中的查询引擎，不是集群级别的大数据框架。

### 忽视 Polars 的 Python API 更成熟的事实

Polars 的 Python API 文档更完善、社区更活跃、示例更多。如果你的场景不要求嵌入或编译为独立服务，Python API 是更务实的选择。Rust API 的价值在于嵌入场景和与其他 Rust 代码的深度集成。

## 自检问题

1. **LazyFrame 相比 DataFrame 的核心优势是什么？它做了哪些自动优化？**
   提示：不只是"延迟执行"，要能说出谓词下推、投影裁剪等具体优化。

2. **Arrow 是序列化格式还是内存格式？它和 Parquet 的关系是什么？**
   提示：Arrow 定义内存布局，Parquet 定义存储格式。两者互补。

3. **什么场景下选 Polars，什么场景下选 DataFusion？**
   提示：程序化数据处理 vs. SQL 查询引擎，嵌入式查询 vs. ETL 管道。

4. **Polars 的表达式系统（Expr）为什么比方法链更好？**
   提示：表达式与 DataFrame 解耦，可复用，且让优化器有更多优化空间。

5. **用 Rust 写 Python 扩展做数据处理，什么时候值得，什么时候不值得？**
   提示：数据量、部署形态、团队能力都是决策因素。

6. **在后端服务中嵌入 Polars 做实时分析，有什么限制？**
   提示：内存占用、冷启动时间、数据量上限。

7. **Polars 内部用的是标准 Arrow 格式吗？如何与 arrow-rs 互转？**
   提示：Polars 有自己的优化内存格式，但提供了 `to_arrow` 和 `from` 转换。

8. **处理超出内存的数据集时，Polars 提供了哪些策略？**
   提示：streaming 模式、scan + 谓词下推、分区 Parquet。

## 延伸阅读

- [Serde 与数据序列化实践](./serde-and-data-serialization.md) — 数据处理管道的输入输出层离不开序列化
- [集合、字符串与迭代器](./collections-strings-and-iterators.md) — Polars 底层大量使用迭代器模式，理解 Rust 迭代器有助于写出高效的自定义函数
- [Rust 性能分析与 Profiling 指南](./performance-and-profiling-guide.md) — 数据管道的性能瓶颈定位方法
