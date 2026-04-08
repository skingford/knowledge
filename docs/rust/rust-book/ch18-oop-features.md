---
title: "第 18 章：面向对象编程特性"
description: Rust 中的 OOP 特性、trait 对象实现动态分发、状态模式与类型驱动的替代方案。
---

# 第 18 章：面向对象编程特性

> 原文：[Chapter 18: Object-Oriented Programming Features of Rust](https://doc.rust-lang.org/book/ch18-00-oop.html)

## 本章要点

- OOP 没有统一定义，Rust 按某些定义算 OOP，按另一些不算
- Rust 通过 struct/enum + `impl` 提供**对象**（数据 + 行为）
- `pub` 关键字实现**封装**（encapsulation），默认一切私有
- Rust **没有继承**（inheritance），用 trait 的默认方法实现和 trait 对象替代
- **多态**（polymorphism）通过泛型 + trait bound（编译期）和 trait 对象（运行时）实现
- trait 对象使用 `dyn Trait` + 指针（`Box<dyn Trait>`、`&dyn Trait`）实现动态分发（dynamic dispatch）
- 状态模式（state pattern）可以用传统 OOP 风格实现，也可以用 Rust 类型系统编码为编译期约束

---

## 18.1 面向对象语言的特征

### 对象 = 数据 + 行为

GoF（Gang of Four）定义：对象将数据和操作数据的过程打包在一起。在 Rust 中，struct 和 enum 持有数据，`impl` 块提供方法，功能上等价于 OOP 的对象。

### 封装：隐藏实现细节

Rust 通过 `pub` 关键字精确控制可见性。字段和方法默认私有，只有显式标记为 `pub` 的才能被外部访问。

```rust
pub struct AveragedCollection {
    list: Vec<i32>,   // 私有字段
    average: f64,     // 私有字段
}

impl AveragedCollection {
    pub fn add(&mut self, value: i32) {
        self.list.push(value);
        self.update_average();
    }

    pub fn remove(&mut self) -> Option<i32> {
        let result = self.list.pop();
        match result {
            Some(value) => {
                self.update_average();
                Some(value)
            }
            None => None,
        }
    }

    pub fn average(&self) -> f64 {
        self.average
    }

    // 私有方法：内部自动维护 average 的一致性
    fn update_average(&mut self) {
        let total: i32 = self.list.iter().sum();
        self.average = total as f64 / self.list.len() as f64;
    }
}
```

**精读要点：**

- 结构体本身是 `pub`，但字段 `list` 和 `average` 是私有的，外部无法直接修改
- `update_average()` 是私有方法，确保每次增删元素后 `average` 自动更新
- 如果未来把 `list` 从 `Vec<i32>` 换成 `HashSet<i32>`，外部代码完全不需要改动 —— 这就是封装的价值

### 继承：Rust 的立场

**Rust 不支持传统继承。** 传统继承的缺点：

1. 子类可能继承了不需要的方法和数据，违反最小化原则
2. 单继承限制灵活性，多继承（如 C++）带来菱形继承等复杂问题
3. 父类的变更可能意外破坏子类行为（脆弱基类问题）

**Rust 的替代方案：**

| OOP 继承的用途 | Rust 的替代 |
|---|---|
| 代码复用 | trait 的默认方法实现（default method implementation） |
| 子类型多态 | trait 对象（`dyn Trait`）或泛型 + trait bound |

```rust
pub trait Summary {
    fn summarize(&self) -> String {
        String::from("(Read more...)") // 默认实现，类似父类方法
    }
}
```

实现该 trait 的类型可以选择使用默认实现，也可以覆盖（override）它。

### 多态：两种路径

| 机制 | 分发方式 | 性能 | 灵活性 |
|---|---|---|---|
| 泛型 + trait bound | 静态分发（static dispatch），编译期单态化（monomorphization） | 零成本 | 编译期确定类型 |
| trait 对象（`dyn Trait`） | 动态分发（dynamic dispatch），运行时查 vtable | 有少量开销 | 运行时确定类型 |

---

## 18.2 使用 trait 对象允许不同类型的值

### 问题背景

`Vec<T>` 只能存储同一类型的元素。如果我们在写一个 GUI 库，需要一个列表存储各种不同的组件（Button、TextField、SelectBox……），怎么办？

- 用 enum：只能处理**已知的、有限的**类型集合，库的使用者无法扩展
- 用 trait 对象：允许**开放式**的类型集合，只要实现了指定 trait 就行

### 定义 trait 和使用 trait 对象

```rust
pub trait Draw {
    fn draw(&self);
}

pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,  // 异构集合：可以放不同类型的组件
}

impl Screen {
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();  // 动态分发：运行时通过 vtable 找到正确的 draw()
        }
    }
}
```

**`Box<dyn Draw>` 解析：**

- `dyn Draw`：一个 trait 对象类型，表示"任何实现了 `Draw` 的类型"
- `Box<...>`：必须用指针包裹，因为 trait 对象是动态大小类型（DST），编译器不知道具体多大
- 底层是一个**胖指针**（fat pointer），包含两个指针：
  1. 指向实际数据的指针
  2. 指向 vtable（虚方法表）的指针，vtable 中存储了具体类型的方法地址

### 对比：泛型方案 vs trait 对象方案

**泛型方案（同构集合）：**

```rust
pub struct Screen<T: Draw> {
    pub components: Vec<T>,  // 所有元素必须是同一类型
}

impl<T> Screen<T>
where
    T: Draw,
{
    pub fn run(&self) {
        for component in self.components.iter() {
            component.draw();  // 静态分发
        }
    }
}
```

泛型方案在编译期通过单态化（monomorphization）为每个具体类型生成专用代码。`Screen<Button>` 和 `Screen<TextField>` 是两个完全不同的类型，**无法在同一个 `Screen` 中混合存储**不同类型的组件。

**trait 对象方案（异构集合）：**

```rust
pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,  // 可以混合存储不同类型
}
```

一个 `Screen` 实例可以同时包含 `Box<Button>` 和 `Box<SelectBox>`。

### 实现 trait 的具体类型

```rust
pub struct Button {
    pub width: u32,
    pub height: u32,
    pub label: String,
}

impl Draw for Button {
    fn draw(&self) {
        // 绘制按钮的具体逻辑
    }
}

struct SelectBox {
    width: u32,
    height: u32,
    options: Vec<String>,
}

impl Draw for SelectBox {
    fn draw(&self) {
        // 绘制选择框的具体逻辑
    }
}
```

### 使用示例

```rust
fn main() {
    let screen = Screen {
        components: vec![
            Box::new(SelectBox {
                width: 75,
                height: 10,
                options: vec![
                    String::from("Yes"),
                    String::from("Maybe"),
                    String::from("No"),
                ],
            }),
            Box::new(Button {
                width: 50,
                height: 10,
                label: String::from("OK"),
            }),
        ],
    };

    screen.run();  // 依次调用每个组件的 draw()
}
```

### 编译期类型安全

如果试图把没有实现 `Draw` 的类型放入 `components`，编译器会报错：

```rust
let screen = Screen {
    components: vec![Box::new(String::from("Hi"))],  // 编译错误！
};
// error[E0277]: the trait bound `String: Draw` is not satisfied
```

这就是 Rust 的 **duck typing + 编译期检查**："如果它走起来像鸭子、叫起来像鸭子，那它就是鸭子" —— 但 Rust 在编译期就验证了这一点，而非等到运行时崩溃。

### 静态分发 vs 动态分发：深入对比

| 维度 | 静态分发（泛型） | 动态分发（trait 对象） |
|---|---|---|
| 分发时机 | 编译期 | 运行时 |
| 实现机制 | 单态化：为每个具体类型生成专用代码 | vtable：运行时查表找方法地址 |
| 内联优化 | 可以内联 | **无法内联**（编译器不知道具体调用哪个方法） |
| 二进制大小 | 可能膨胀（每个类型一份代码） | 更小（共享同一份调用逻辑） |
| 集合类型 | 同构（homogeneous） | 异构（heterogeneous） |
| 适用场景 | 类型在编译期已知，追求性能 | 类型在编译期不确定，需要运行时灵活性 |

**精读要点：** 动态分发的开销通常很小（一次指针间接寻址），但它阻止了编译器的内联优化，这在热路径上可能产生可观的性能差异。在大多数应用代码中，这个差异可以忽略，但在性能敏感的库代码中需要慎重权衡。

---

## 18.3 面向对象设计模式的实现

本节用一个**博客文章发布工作流**演示状态模式（state pattern），并对比两种实现方式。

### 需求

1. 文章从空白草稿（Draft）开始
2. 草稿完成后，请求审核（request review）
3. 审核通过后，文章被发布（published）
4. 只有发布后的文章才能返回内容
5. 无效的状态转换没有效果（不报错，但也不改变状态）

### 方式一：传统 OOP 风格（trait 对象 + 状态模式）

**使用方代码：**

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();

    post.add_text("I ate a salad for lunch today");
    assert_eq!("", post.content());       // 草稿状态，返回空

    post.request_review();
    assert_eq!("", post.content());       // 待审核状态，返回空

    post.approve();
    assert_eq!("I ate a salad for lunch today", post.content());  // 已发布，返回内容
}
```

**完整实现：**

```rust
pub struct Post {
    state: Option<Box<dyn State>>,  // 当前状态，用 Option 包裹以便 take()
    content: String,
}

impl Post {
    pub fn new() -> Post {
        Post {
            state: Some(Box::new(Draft {})),
            content: String::new(),
        }
    }

    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    pub fn content(&self) -> &str {
        // 委托给当前状态对象决定返回什么
        self.state.as_ref().unwrap().content(self)
    }

    pub fn request_review(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.request_review())
        }
    }

    pub fn approve(&mut self) {
        if let Some(s) = self.state.take() {
            self.state = Some(s.approve())
        }
    }
}

trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
    fn approve(self: Box<Self>) -> Box<dyn State>;

    fn content<'a>(&self, post: &'a Post) -> &'a str {
        ""  // 默认返回空字符串
    }
}

struct Draft {}

impl State for Draft {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        Box::new(PendingReview {})  // Draft -> PendingReview
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self  // Draft 不能直接 approve，保持原样
    }
}

struct PendingReview {}

impl State for PendingReview {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self  // 已在待审核，保持原样
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        Box::new(Published {})  // PendingReview -> Published
    }
}

struct Published {}

impl State for Published {
    fn request_review(self: Box<Self>) -> Box<dyn State> {
        self  // 已发布，保持原样
    }

    fn approve(self: Box<Self>) -> Box<dyn State> {
        self  // 已发布，保持原样
    }

    fn content<'a>(&self, post: &'a Post) -> &'a str {
        &post.content  // 只有 Published 才返回实际内容
    }
}
```

**精读：关键技术细节**

1. **`Option::take()` 模式**：`self.state.take()` 把 `Option` 中的值取出，留下 `None`。这是为了满足 Rust 的所有权规则 —— 状态转换需要消耗旧状态（`self: Box<Self>`），但我们不能直接从 `&mut self` 中移出字段，`Option::take()` 解决了这个问题。

2. **`self: Box<Self>` 方法签名**：这意味着该方法只能在 `Box<Self>` 上调用，消耗掉旧的 Box，返回新的 Box。这保证了状态转换后旧状态不再可用。

3. **生命周期标注** `fn content<'a>(&self, post: &'a Post) -> &'a str`：返回值的生命周期绑定到 `post` 而非 `self`，因为实际内容存在 `Post` 中而非 `State` 中。

4. **trait 默认实现**：`content()` 的默认实现返回 `""`，只有 `Published` 覆盖了它。这样 `Draft` 和 `PendingReview` 不需要重复写返回空字符串的逻辑。

**优点：**
- `Post` 的公共 API 完全不暴露状态细节
- 添加新状态（如 `Scheduled`）只需新增一个 struct + impl，不需要修改 `Post`
- 无需 `match` 表达式判断状态

**缺点：**
- 状态之间存在耦合（每个状态需要知道所有可能的转换目标）
- `request_review` 和 `approve` 在不同状态中有重复的"返回 self"逻辑
- **无效状态转换在运行时静默忽略**，而非编译期报错

### 方式二：类型驱动方案（将状态编码为类型）

这是更 Rust 惯用的方式：用不同的类型表示不同的状态，让编译器在编译期阻止无效操作。

```rust
pub struct Post {
    content: String,
}

pub struct DraftPost {
    content: String,
}

pub struct PendingReviewPost {
    content: String,
}

impl Post {
    // 注意：返回的是 DraftPost，不是 Post
    pub fn new() -> DraftPost {
        DraftPost {
            content: String::new(),
        }
    }

    pub fn content(&self) -> &str {
        &self.content
    }
}

impl DraftPost {
    pub fn add_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    // 消耗 DraftPost，返回 PendingReviewPost
    pub fn request_review(self) -> PendingReviewPost {
        PendingReviewPost {
            content: self.content,
        }
    }
}

impl PendingReviewPost {
    // 消耗 PendingReviewPost，返回 Post
    pub fn approve(self) -> Post {
        Post {
            content: self.content,
        }
    }
}
```

**使用方代码：**

```rust
use blog::Post;

fn main() {
    let mut post = Post::new();             // 类型：DraftPost

    post.add_text("I ate a salad for lunch today");

    let post = post.request_review();       // 类型：PendingReviewPost（变量遮蔽）

    let post = post.approve();              // 类型：Post

    assert_eq!("I ate a salad for lunch today", post.content());
}
```

**精读：为什么这个方案更 "Rust"**

1. **编译期保证**：`DraftPost` 没有 `content()` 方法，所以你**不可能**在草稿阶段读取内容 —— 这不是运行时检查，是**编译器直接阻止**。

2. **所有权转移 = 状态转换**：`request_review(self)` 消耗了 `DraftPost`，返回 `PendingReviewPost`。旧变量不再可用，你**不可能**在转换后还操作草稿状态。

3. **无效操作不可表达**：`PendingReviewPost` 没有 `add_text()` 方法，`DraftPost` 没有 `approve()` 方法。这些非法操作在类型层面就不存在。

4. **零成本**：没有 vtable，没有动态分发，没有 `Option::take()`，没有 `Box` 分配。所有状态检查都在编译期完成。

### 两种方案的全面对比

| 维度 | 传统 OOP（trait 对象） | 类型驱动（编码为类型） |
|---|---|---|
| 状态表示 | 运行时 `Box<dyn State>` | 编译期不同 struct |
| 无效状态转换 | 运行时静默忽略 | **编译期错误** |
| 性能 | 动态分发 + 堆分配 | 零成本抽象 |
| API 稳定性 | `Post` 类型不变 | 每个状态是不同类型，API 可见 |
| 扩展性 | 添加状态不影响 `Post` 类型 | 添加状态需要新类型 + 调整调用链 |
| 使用方代码 | 调用者不感知状态变化 | 调用者需要 `let` 遮蔽重新绑定 |
| 对 OOP 程序员的熟悉度 | 高 | 较低 |
| Rust 惯用度 | 中 | **高** |

### 与传统 OOP 继承的根本区别

传统 OOP 中，状态模式依赖继承：

```java
// Java 风格
abstract class State {
    abstract State requestReview();
    abstract State approve();
    String content(Post post) { return ""; }
}
class Draft extends State { ... }
class PendingReview extends State { ... }
```

Rust 的 trait 对象方案在**结构上**与此类似，但有本质区别：

1. **没有继承层次**：`Draft`、`PendingReview`、`Published` 之间没有父子关系，它们是平等的兄弟类型，只是都实现了同一个 trait
2. **所有权语义**：`self: Box<Self>` 消耗旧状态，Java 中旧状态对象可能仍被引用
3. **默认实现 != 继承**：trait 的默认方法是"提供一个可覆盖的实现"，不是"从父类继承行为"—— 区别在于没有数据继承，只有行为复用
4. **组合优于继承**：Rust 鼓励通过 trait 组合（一个类型可以实现多个 trait）而非继承树来设计

---

## 小结

- Rust 具备 OOP 的核心特性（对象、封装、多态），但**有意放弃了继承**
- trait 对象（`Box<dyn Draw>`）提供运行时多态，适合需要异构集合和开放式扩展的场景
- 泛型 + trait bound 提供编译期多态，性能更优但只能处理同构集合
- 状态模式可以用 trait 对象实现，但 Rust 更惯用的方式是**将状态编码为类型**，让编译器在编译期阻止无效操作
- Rust 的设计哲学：**能在编译期检查的，就不要留到运行时**。类型驱动方案正是这一哲学的体现
- 实际项目中，两种方案都有适用场景：当类型集合需要开放式扩展时用 trait 对象；当状态转换有固定规则且安全性优先时用类型编码
