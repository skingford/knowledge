---
title: 设计模式与惯用法
description: Go 语言常用设计模式与惯用法，涵盖 Functional Options、Builder、依赖注入、分层架构、Strategy、Singleton、Table-Driven Tests、Iterator、中间件装饰器、错误处理等。
search: false
---

# 设计模式与惯用法

## 适合人群

- 已掌握 Go 语法基础，想写出更地道、可维护代码的开发者
- 需要在项目中落地常见架构模式的后端工程师
- 准备技术面试，需要理解 Go 社区推荐实践的候选人

## 学习目标

- 掌握 Functional Options、Builder 等构造模式，灵活创建复杂对象
- 理解 Go 惯用的依赖注入方式和分层架构设计
- 熟练运用 Strategy、Singleton、中间件等经典模式的 Go 实现
- 掌握 Table-Driven Tests、错误哨兵等 Go 社区标准实践
- 了解 Go 1.23+ 的 Iterator 模式（range over func）

## 快速导航

- [1. Functional Options 模式](#_1-functional-options-模式)
- [2. Builder 模式](#_2-builder-模式)
- [3. 依赖注入的 Go 惯用方式](#_3-依赖注入的-go-惯用方式)
- [4. Repository / Service / Handler 分层模式](#_4-repository-service-handler-分层模式)
- [5. Strategy 模式](#_5-strategy-模式)
- [6. Singleton 模式](#_6-singleton-模式)
- [7. Table-Driven Tests 模式](#_7-table-driven-tests-模式)
- [8. Iterator 模式 (Go 1.23+)](#_8-iterator-模式-go-1-23)
- [9. 中间件 / 装饰器模式](#_9-中间件-装饰器模式)
- [10. 错误哨兵与自定义错误类型](#_10-错误哨兵与自定义错误类型)

---

## 1. Functional Options 模式

<GoAdvancedTopicDiagram kind="functional-options" />

Go 语言没有函数默认参数和方法重载，当结构体字段很多时，构造函数的参数列表会变得冗长且难以维护。Functional Options 模式通过将每个可选配置封装为一个函数，让调用方按需组合，既保持了 API 的简洁性，又具备良好的可扩展性——新增选项不会破坏已有调用方。

::: details 点击展开代码：1. Functional Options 模式
```go
package main

import (
	"fmt"
	"time"
)

// Server 是一个 HTTP 服务器配置
type Server struct {
	host         string
	port         int
	readTimeout  time.Duration
	writeTimeout time.Duration
	tlsCert      string
	tlsKey       string
	maxConns     int
}

// Option 定义配置选项函数类型
type Option func(*Server)

// WithPort 设置端口
func WithPort(port int) Option {
	return func(s *Server) {
		s.port = port
	}
}

// WithTimeout 同时设置读写超时
func WithTimeout(d time.Duration) Option {
	return func(s *Server) {
		s.readTimeout = d
		s.writeTimeout = d
	}
}

// WithTLS 启用 TLS
func WithTLS(cert, key string) Option {
	return func(s *Server) {
		s.tlsCert = cert
		s.tlsKey = key
	}
}

// WithMaxConns 设置最大连接数
func WithMaxConns(n int) Option {
	return func(s *Server) {
		s.maxConns = n
	}
}

// NewServer 创建服务器，应用默认值后依次执行选项函数
func NewServer(host string, opts ...Option) *Server {
	// 先设置合理的默认值
	s := &Server{
		host:         host,
		port:         8080,
		readTimeout:  5 * time.Second,
		writeTimeout: 10 * time.Second,
		maxConns:     1000,
	}
	// 依次应用选项，后设置的覆盖先设置的
	for _, opt := range opts {
		opt(s)
	}
	return s
}

func main() {
	// 最简调用：全部使用默认值
	s1 := NewServer("localhost")
	fmt.Printf("默认配置: %+v\n", s1)

	// 按需定制：只覆盖需要的选项
	s2 := NewServer("0.0.0.0",
		WithPort(443),
		WithTLS("/path/cert.pem", "/path/key.pem"),
		WithTimeout(30*time.Second),
		WithMaxConns(5000),
	)
	fmt.Printf("定制配置: %+v\n", s2)
}
```
:::

### 讲解重点

- **何时使用**：结构体有 3 个以上可选字段，或者 API 需要向后兼容地扩展配置项时。
- **典型使用案例**：`google.golang.org/grpc` 的 `grpc.Dial(target, ...DialOption)` 是最经典的范例；标准库 `net/http` 的 `Server` 虽然用的是结构体字面量，但许多封装库（如 `go-kit`）都采用此模式。
- **常见误用与注意事项**：
  - 不要为只有 1-2 个参数的简单结构体使用此模式，过度设计反而增加理解成本。
  - Option 函数应保持幂等，避免在其中执行有副作用的操作（如打开文件、建立连接）。
  - 如果需要对选项做校验，可以让 Option 返回 error：`type Option func(*Server) error`。

---

## 2. Builder 模式

<GoAdvancedTopicDiagram kind="builder" />

当对象的构造过程涉及多个步骤或条件分支时，Builder 模式通过链式调用逐步构建最终对象。与 Functional Options 不同，Builder 更适合构建过程本身有顺序或状态依赖的场景——例如拼接 SQL 查询、构建 HTTP 请求等。

::: details 点击展开代码：2. Builder 模式
```go
package main

import (
	"fmt"
	"strings"
)

// QueryBuilder 用于构建 SQL 查询
type QueryBuilder struct {
	table      string
	columns    []string
	conditions []string
	args       []any
	orderBy    string
	limit      int
	offset     int
}

// NewQueryBuilder 创建查询构建器
func NewQueryBuilder(table string) *QueryBuilder {
	return &QueryBuilder{
		table:   table,
		columns: []string{"*"},
	}
}

// Select 设置查询列
func (qb *QueryBuilder) Select(columns ...string) *QueryBuilder {
	qb.columns = columns
	return qb
}

// Where 添加查询条件（支持多次调用，用 AND 连接）
func (qb *QueryBuilder) Where(condition string, args ...any) *QueryBuilder {
	qb.conditions = append(qb.conditions, condition)
	qb.args = append(qb.args, args...)
	return qb
}

// OrderBy 设置排序
func (qb *QueryBuilder) OrderBy(field string) *QueryBuilder {
	qb.orderBy = field
	return qb
}

// Limit 设置分页
func (qb *QueryBuilder) Limit(limit, offset int) *QueryBuilder {
	qb.limit = limit
	qb.offset = offset
	return qb
}

// Build 生成最终 SQL 和参数
func (qb *QueryBuilder) Build() (string, []any) {
	var sb strings.Builder

	sb.WriteString("SELECT ")
	sb.WriteString(strings.Join(qb.columns, ", "))
	sb.WriteString(" FROM ")
	sb.WriteString(qb.table)

	if len(qb.conditions) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(qb.conditions, " AND "))
	}

	if qb.orderBy != "" {
		sb.WriteString(" ORDER BY ")
		sb.WriteString(qb.orderBy)
	}

	if qb.limit > 0 {
		sb.WriteString(fmt.Sprintf(" LIMIT %d OFFSET %d", qb.limit, qb.offset))
	}

	return sb.String(), qb.args
}

func main() {
	// 链式调用构建查询
	sql, args := NewQueryBuilder("users").
		Select("id", "name", "email").
		Where("age > ?", 18).
		Where("status = ?", "active").
		OrderBy("created_at DESC").
		Limit(10, 0).
		Build()

	fmt.Println("SQL:", sql)
	fmt.Println("参数:", args)

	// 简单查询
	sql2, _ := NewQueryBuilder("orders").
		Where("user_id = ?", 42).
		Build()
	fmt.Println("SQL:", sql2)
}
```
:::

### 讲解重点

- **何时使用**：构建过程包含多个可选步骤且步骤之间可能有依赖关系时，比如 SQL 拼接、HTTP 请求构造、配置文件生成等。
- **典型使用案例**：`strings.Builder` 是标准库中最常见的 Builder；`squirrel`（SQL builder）、`testify/mock` 的 `.On().Return()` 链式调用也是此模式的典型应用。
- **常见误用与注意事项**：
  - Go 社区通常偏好 Functional Options 而非 Builder，只有在构造过程确实有多步骤/有序依赖时才选择 Builder。
  - 链式调用中的错误处理需要注意：可以在 Builder 中累积错误，在 `Build()` 时统一返回；或者每步返回 `(*Builder, error)`（但会打断链式调用）。
  - Builder 不是线程安全的，不要在多个 goroutine 间共享同一个 Builder 实例。

---

## 3. 依赖注入的 Go 惯用方式

<GoAdvancedTopicDiagram kind="dependency-injection" />

Go 社区推崇显式依赖——通过构造函数参数把依赖"注入"进来，而不是在函数内部自行创建或访问全局变量。这样做的核心好处是让代码可测试：测试时传入 mock 实现即可，无需修改被测代码。

::: details 点击展开代码：3. 依赖注入的 Go 惯用方式
```go
package main

import (
	"errors"
	"fmt"
)

// --------- 接口定义 ---------

// UserRepository 定义数据访问接口
type UserRepository interface {
	FindByID(id int) (*User, error)
	Save(user *User) error
}

// EmailSender 定义邮件发送接口
type EmailSender interface {
	Send(to, subject, body string) error
}

// --------- 数据模型 ---------

type User struct {
	ID    int
	Name  string
	Email string
}

// --------- 接口实现 ---------

// MemoryUserRepo 是内存实现的 Repository（用于演示和测试）
type MemoryUserRepo struct {
	data map[int]*User
}

func NewMemoryUserRepo() *MemoryUserRepo {
	return &MemoryUserRepo{data: make(map[int]*User)}
}

func (r *MemoryUserRepo) FindByID(id int) (*User, error) {
	u, ok := r.data[id]
	if !ok {
		return nil, errors.New("用户不存在")
	}
	return u, nil
}

func (r *MemoryUserRepo) Save(user *User) error {
	r.data[user.ID] = user
	return nil
}

// ConsoleEmailSender 是控制台输出的邮件发送器（用于演示）
type ConsoleEmailSender struct{}

func (s *ConsoleEmailSender) Send(to, subject, body string) error {
	fmt.Printf("[邮件] 收件人: %s, 主题: %s, 内容: %s\n", to, subject, body)
	return nil
}

// --------- Service 层：通过构造函数注入依赖 ---------

// UserService 依赖接口而非具体实现
type UserService struct {
	repo  UserRepository
	email EmailSender
}

// NewUserService 构造函数注入——Go 最推荐的依赖注入方式
func NewUserService(repo UserRepository, email EmailSender) *UserService {
	return &UserService{
		repo:  repo,
		email: email,
	}
}

func (s *UserService) Register(id int, name, email string) error {
	user := &User{ID: id, Name: name, Email: email}
	if err := s.repo.Save(user); err != nil {
		return fmt.Errorf("保存用户失败: %w", err)
	}
	if err := s.email.Send(email, "欢迎注册", "你好 "+name); err != nil {
		return fmt.Errorf("发送邮件失败: %w", err)
	}
	return nil
}

func (s *UserService) GetUser(id int) (*User, error) {
	return s.repo.FindByID(id)
}

func main() {
	// 组装依赖：在 main 或初始化函数中完成
	repo := NewMemoryUserRepo()
	emailSender := &ConsoleEmailSender{}
	userService := NewUserService(repo, emailSender)

	// 使用
	if err := userService.Register(1, "张三", "zhangsan@example.com"); err != nil {
		fmt.Println("注册失败:", err)
		return
	}

	user, err := userService.GetUser(1)
	if err != nil {
		fmt.Println("查询失败:", err)
		return
	}
	fmt.Printf("查询到用户: %+v\n", user)
}
```
:::

### 讲解重点

- **何时使用**：几乎所有有外部依赖（数据库、缓存、第三方 API）的业务代码都应使用构造函数注入。这是 Go 中最简单、最推荐的依赖注入方式。
- **典型使用案例**：Go 标准库中 `net/http.Server` 依赖 `Handler` 接口就是接口注入的范例。`go-kit`、`kratos` 等框架大量使用构造函数注入。
- **框架对比**：
  - **手动注入**（推荐）：显式、可追踪，适合中小型项目。
  - **wire**（Google 出品）：编译期代码生成，无运行时开销，适合依赖关系复杂的大型项目。
  - **fx**（Uber 出品）：运行时反射注入，功能强大但调试困难，适合超大型微服务。
- **常见误用与注意事项**：
  - 不要在结构体内部通过 `NewXxx()` 自行创建依赖，这会让测试变得困难。
  - 接口应由消费方定义（"Accept interfaces, return structs"），而非由提供方定义。
  - 避免过度抽象：只有在确实需要多态或需要 mock 时才引入接口。

---

## 4. Repository / Service / Handler 分层模式

<GoAdvancedTopicDiagram kind="layered-architecture" />

Go Web 应用中最常见的分层方式：Handler 负责 HTTP 协议解析和响应格式化，Service 负责业务逻辑，Repository 负责数据持久化。每层只依赖下一层的接口，实现层间解耦。

::: details 点击展开代码：4. Repository / Service / Handler 分层模式
```go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"sync"
)

// ========== 模型层 ==========

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// ========== Repository 层：数据访问 ==========

type UserRepository interface {
	GetByID(id int) (*User, error)
	List() ([]*User, error)
	Create(user *User) error
	Delete(id int) error
}

type InMemoryUserRepo struct {
	mu     sync.RWMutex
	data   map[int]*User
	nextID int
}

func NewInMemoryUserRepo() *InMemoryUserRepo {
	return &InMemoryUserRepo{
		data:   make(map[int]*User),
		nextID: 1,
	}
}

func (r *InMemoryUserRepo) GetByID(id int) (*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.data[id]
	if !ok {
		return nil, errors.New("用户不存在")
	}
	return u, nil
}

func (r *InMemoryUserRepo) List() ([]*User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	users := make([]*User, 0, len(r.data))
	for _, u := range r.data {
		users = append(users, u)
	}
	return users, nil
}

func (r *InMemoryUserRepo) Create(user *User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	user.ID = r.nextID
	r.nextID++
	r.data[user.ID] = user
	return nil
}

func (r *InMemoryUserRepo) Delete(id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if _, ok := r.data[id]; !ok {
		return errors.New("用户不存在")
	}
	delete(r.data, id)
	return nil
}

// ========== Service 层：业务逻辑 ==========

type UserService struct {
	repo UserRepository
}

func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUser(id int) (*User, error) {
	return s.repo.GetByID(id)
}

func (s *UserService) ListUsers() ([]*User, error) {
	return s.repo.List()
}

func (s *UserService) CreateUser(name, email string) (*User, error) {
	// 业务校验放在 Service 层
	if name == "" {
		return nil, errors.New("用户名不能为空")
	}
	if email == "" {
		return nil, errors.New("邮箱不能为空")
	}
	user := &User{Name: name, Email: email}
	if err := s.repo.Create(user); err != nil {
		return nil, fmt.Errorf("创建用户失败: %w", err)
	}
	return user, nil
}

func (s *UserService) DeleteUser(id int) error {
	return s.repo.Delete(id)
}

// ========== Handler 层：HTTP 协议处理 ==========

type UserHandler struct {
	svc *UserService
}

func NewUserHandler(svc *UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

// respondJSON 统一 JSON 响应
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// respondError 统一错误响应
func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}

func (h *UserHandler) HandleGetUser(w http.ResponseWriter, r *http.Request) {
	// Handler 只负责：解析请求 → 调用 Service → 格式化响应
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		respondError(w, http.StatusBadRequest, "无效的用户 ID")
		return
	}

	user, err := h.svc.GetUser(id)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, user)
}

func (h *UserHandler) HandleListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.svc.ListUsers()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, users)
}

func (h *UserHandler) HandleCreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	user, err := h.svc.CreateUser(req.Name, req.Email)
	if err != nil {
		respondError(w, http.StatusBadRequest, err.Error())
		return
	}

	respondJSON(w, http.StatusCreated, user)
}

func main() {
	// 组装依赖链：Repository → Service → Handler
	repo := NewInMemoryUserRepo()
	svc := NewUserService(repo)
	handler := NewUserHandler(svc)

	// 注册路由
	http.HandleFunc("/users", handler.HandleListUsers)
	http.HandleFunc("/users/get", handler.HandleGetUser)
	http.HandleFunc("/users/create", handler.HandleCreateUser)

	fmt.Println("服务启动在 :8080")
	fmt.Println("示例请求:")
	fmt.Println("  POST /users/create  {\"name\":\"张三\",\"email\":\"z@test.com\"}")
	fmt.Println("  GET  /users/get?id=1")
	fmt.Println("  GET  /users")

	// 为了演示可运行，这里直接测试而非启动 HTTP 服务
	repo.Create(&User{Name: "张三", Email: "zhangsan@test.com"})
	repo.Create(&User{Name: "李四", Email: "lisi@test.com"})

	users, _ := svc.ListUsers()
	for _, u := range users {
		fmt.Printf("用户: %+v\n", *u)
	}

	// 如需实际启动 HTTP 服务，取消以下注释：
	// http.ListenAndServe(":8080", nil)
}
```
:::

### 讲解重点

- **何时使用**：几乎所有 Go Web 后端项目都应采用这种分层方式，这是 Go 社区事实上的标准架构。
- **典型使用案例**：`go-kit` 明确定义了 Transport → Endpoint → Service 三层；`kratos` 框架也推荐 Handler → Service → Data（Repository）分层。
- **各层职责边界**：
  - **Handler**：解析 HTTP 请求参数、调用 Service、返回 HTTP 响应。不包含业务逻辑。
  - **Service**：业务逻辑和业务校验。不感知 HTTP 协议（不引用 `http.Request`）。
  - **Repository**：数据访问封装。不感知业务规则，只负责 CRUD。
- **常见误用与注意事项**：
  - 不要在 Handler 中写业务逻辑，也不要在 Repository 中做业务校验。
  - Service 层不应直接依赖具体的 Repository 实现，而应依赖接口。
  - 对于小型项目，可以适当合并层次（如 Handler 直接调用 Repository），避免过度分层。

---

## 5. Strategy 模式

<GoAdvancedTopicDiagram kind="strategy" />

Strategy 模式将一组可互换的算法封装在各自的结构体中，通过统一接口在运行时切换。Go 中通常用接口实现 Strategy，也可以直接用函数类型实现更轻量的版本。

::: details 点击展开代码：5. Strategy 模式
```go
package main

import (
	"errors"
	"fmt"
)

// ========== 接口方式实现 Strategy ==========

// PaymentStrategy 支付策略接口
type PaymentStrategy interface {
	Pay(amount float64) error
	Name() string
}

// CreditCardPay 信用卡支付
type CreditCardPay struct {
	CardNumber string
}

func (c *CreditCardPay) Pay(amount float64) error {
	if c.CardNumber == "" {
		return errors.New("信用卡号不能为空")
	}
	fmt.Printf("[信用卡] 使用卡号 %s 支付 %.2f 元\n", c.CardNumber, amount)
	return nil
}

func (c *CreditCardPay) Name() string { return "信用卡" }

// AlipayPay 支付宝支付
type AlipayPay struct {
	Account string
}

func (a *AlipayPay) Pay(amount float64) error {
	fmt.Printf("[支付宝] 账号 %s 支付 %.2f 元\n", a.Account, amount)
	return nil
}

func (a *AlipayPay) Name() string { return "支付宝" }

// WechatPay 微信支付
type WechatPay struct {
	OpenID string
}

func (w *WechatPay) Pay(amount float64) error {
	fmt.Printf("[微信] OpenID %s 支付 %.2f 元\n", w.OpenID, amount)
	return nil
}

func (w *WechatPay) Name() string { return "微信" }

// PaymentContext 支付上下文，持有当前策略
type PaymentContext struct {
	strategy PaymentStrategy
}

func NewPaymentContext(strategy PaymentStrategy) *PaymentContext {
	return &PaymentContext{strategy: strategy}
}

func (ctx *PaymentContext) SetStrategy(strategy PaymentStrategy) {
	ctx.strategy = strategy
}

func (ctx *PaymentContext) Execute(amount float64) error {
	fmt.Printf("使用 %s 方式支付...\n", ctx.strategy.Name())
	return ctx.strategy.Pay(amount)
}

// ========== 函数类型实现轻量 Strategy ==========

// PayFunc 函数类型策略——适合逻辑简单的场景
type PayFunc func(amount float64) error

// ProcessPayment 接受函数类型作为策略
func ProcessPayment(amount float64, payFn PayFunc) error {
	return payFn(amount)
}

func main() {
	// 接口方式：适合策略有多个方法或需要维护状态
	ctx := NewPaymentContext(&CreditCardPay{CardNumber: "6222-****-1234"})
	ctx.Execute(99.9)

	// 运行时切换策略
	ctx.SetStrategy(&AlipayPay{Account: "user@example.com"})
	ctx.Execute(199.0)

	ctx.SetStrategy(&WechatPay{OpenID: "wx_abc123"})
	ctx.Execute(49.9)

	fmt.Println("---")

	// 函数方式：适合逻辑简单、无状态的策略
	ProcessPayment(88.8, func(amount float64) error {
		fmt.Printf("[积分] 使用积分支付 %.2f 元\n", amount)
		return nil
	})
}
```
:::

### 讲解重点

- **何时使用**：当一个操作有多种可互换的实现方式，且需要在运行时动态选择时。典型场景包括支付方式、排序算法、压缩算法、消息推送渠道等。
- **典型使用案例**：`sort.Interface` 就是标准库中 Strategy 模式的经典应用；`io.Writer` / `io.Reader` 接口也可以看作 Strategy 的体现。`database/sql` 的 Driver 注册机制也是策略模式。
- **常见误用与注意事项**：
  - 策略只有一种实现时不要强行使用此模式。
  - Go 中优先考虑函数类型作为策略（如 `http.HandlerFunc`），只有策略本身有状态或多个方法时才使用接口。
  - 不要把策略模式和简单的 `if/switch` 混淆——如果分支固定且不需要扩展，直接用 `switch` 更简单。

---

## 6. Singleton 模式

<GoAdvancedTopicDiagram kind="singleton" />

Singleton 确保一个类型在整个程序生命周期中只有一个实例。Go 中使用 `sync.Once` 实现线程安全的懒加载单例，这是最推荐的方式。

::: details 点击展开代码：6. Singleton 模式
```go
package main

import (
	"fmt"
	"sync"
)

// ========== sync.Once 实现单例（推荐） ==========

// DBPool 模拟数据库连接池
type DBPool struct {
	DSN         string
	MaxConns    int
	ActiveConns int
}

var (
	dbInstance *DBPool
	dbOnce     sync.Once
)

// GetDBPool 返回数据库连接池单例
// 无论多少 goroutine 同时调用，initPool 只执行一次
func GetDBPool() *DBPool {
	dbOnce.Do(func() {
		fmt.Println(">>> 初始化数据库连接池（只会打印一次）")
		dbInstance = &DBPool{
			DSN:      "user:pass@tcp(127.0.0.1:3306)/mydb",
			MaxConns: 20,
		}
	})
	return dbInstance
}

func main() {
	// 模拟多个 goroutine 并发获取单例
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			pool := GetDBPool()
			fmt.Printf("goroutine %d 获取到连接池: %p (DSN=%s)\n", id, pool, pool.DSN)
		}(i)
	}
	wg.Wait()

	// 验证所有 goroutine 获取的是同一个实例
	p1 := GetDBPool()
	p2 := GetDBPool()
	fmt.Printf("是同一个实例: %v\n", p1 == p2)
}

// ========== 对比：init() 全局变量方式 ==========
// 下面的方式也能实现单例，但有以下问题：
// 1. 在 init() 中初始化，程序启动即创建，无法懒加载
// 2. 无法传入运行时参数（如从配置文件读取 DSN）
// 3. 测试时难以替换或重置
//
// var globalDB = &DBPool{
//     DSN:      "hardcoded:dsn",
//     MaxConns: 10,
// }
//
// func init() {
//     // 初始化逻辑
// }
```
:::

### 讲解重点

- **何时使用**：需要全局唯一且线程安全的资源实例时，如数据库连接池、配置管理器、日志记录器等。
- **典型使用案例**：标准库中没有直接的 Singleton 示例，但 `sync.Once` 本身被广泛使用。`zap` 日志库的全局 logger、各种 SDK 的客户端初始化都常用此模式。
- **`sync.Once` vs `init()` 对比**：
  - `sync.Once`：懒加载、可传参、可测试、推荐。
  - `init()`：程序启动即执行、无法传参、测试不友好。
- **常见误用与注意事项**：
  - 不要滥用 Singleton，过多全局状态会让代码难以测试和推理。优先考虑依赖注入。
  - `sync.Once` 中的函数如果 panic，Once 仍然视为已执行，后续调用不会重试。
  - 如果需要重置单例（例如测试中），考虑暴露一个 `ResetForTesting()` 函数，或改用依赖注入。

---

## 7. Table-Driven Tests 模式

<GoAdvancedTopicDiagram kind="table-driven-tests" />

Table-Driven Tests 是 Go 测试的标准模式。把测试用例组织成一个结构体切片，用 `for range` 遍历执行，配合 `t.Run()` 创建子测试。这种方式让添加新用例变得极其简单——只需新增一行数据。

::: details 点击展开代码：7. Table-Driven Tests 模式
```go
package main

import (
	"fmt"
	"math"
	"strings"
	"testing"
)

// ========== 被测函数 ==========

// Add 加法函数
func Add(a, b int) int {
	return a + b
}

// Divide 除法函数（演示错误返回）
func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("除数不能为零")
	}
	return a / b, nil
}

// ========== Table-Driven Tests ==========

func TestAdd(t *testing.T) {
	// 定义测试用例表
	tests := []struct {
		name     string // 用例名称，会显示在测试输出中
		a, b     int    // 输入
		expected int    // 期望输出
	}{
		// 正常场景
		{name: "正数相加", a: 1, b: 2, expected: 3},
		{name: "负数相加", a: -1, b: -2, expected: -3},
		{name: "正负相加", a: 1, b: -1, expected: 0},

		// 边界条件
		{name: "零值", a: 0, b: 0, expected: 0},
		{name: "最大 int32", a: math.MaxInt32, b: 0, expected: math.MaxInt32},
		{name: "最小 int32", a: math.MinInt32, b: 0, expected: math.MinInt32},
	}

	for _, tt := range tests {
		// t.Run 创建子测试，可以单独运行：go test -run TestAdd/正数相加
		t.Run(tt.name, func(t *testing.T) {
			got := Add(tt.a, tt.b)
			if got != tt.expected {
				t.Errorf("Add(%d, %d) = %d, 期望 %d", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}

func TestDivide(t *testing.T) {
	tests := []struct {
		name      string
		a, b      float64
		expected  float64
		wantErr   bool   // 是否期望出错
		errSubstr string // 错误信息应包含的子串
	}{
		{name: "正常除法", a: 10, b: 3, expected: 3.3333, wantErr: false},
		{name: "整除", a: 10, b: 2, expected: 5, wantErr: false},
		{name: "除以零", a: 10, b: 0, expected: 0, wantErr: true, errSubstr: "除数不能为零"},
		{name: "零除以数", a: 0, b: 5, expected: 0, wantErr: false},
		{name: "负数除法", a: -10, b: 3, expected: -3.3333, wantErr: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)

			// 检查错误
			if tt.wantErr {
				if err == nil {
					t.Fatal("期望返回错误，但没有")
				}
				if !strings.Contains(err.Error(), tt.errSubstr) {
					t.Errorf("错误信息 %q 不包含 %q", err.Error(), tt.errSubstr)
				}
				return
			}
			if err != nil {
				t.Fatalf("不期望的错误: %v", err)
			}

			// 浮点数比较使用容差
			if math.Abs(got-tt.expected) > 0.001 {
				t.Errorf("Divide(%.1f, %.1f) = %.4f, 期望 %.4f", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}

// 以下 main 函数仅用于演示，实际测试用 go test 运行
func main() {
	fmt.Println("Table-Driven Tests 示例")
	fmt.Println("运行测试: go test -v -run TestAdd")
	fmt.Println("运行单个子测试: go test -v -run TestAdd/正数相加")
	fmt.Println("运行除法测试: go test -v -run TestDivide")

	// 直接演示函数功能
	fmt.Println("\n函数演示:")
	fmt.Println("Add(1, 2) =", Add(1, 2))
	result, err := Divide(10, 3)
	fmt.Printf("Divide(10, 3) = %.4f, err=%v\n", result, err)
	_, err = Divide(10, 0)
	fmt.Printf("Divide(10, 0) err=%v\n", err)
}
```
:::

### 讲解重点

- **何时使用**：几乎所有 Go 函数的单元测试都应使用此模式。当一个函数需要验证多种输入输出组合时，Table-Driven Tests 比一堆独立测试函数清晰得多。
- **典型使用案例**：Go 标准库本身大量使用此模式，如 `strings` 包、`fmt` 包、`encoding/json` 包的测试代码。这是 Go 官方推荐的测试方式。
- **常见误用与注意事项**：
  - 用例名称要有描述性，`t.Run` 的名称直接决定测试输出的可读性和可筛选性。
  - 测试表中不要只有 happy path，记得覆盖边界条件、零值、错误场景。
  - 并行测试时注意：如果子测试要并行执行（`t.Parallel()`），循环变量 `tt` 在 Go 1.22 之前需要局部拷贝。Go 1.22+ 已修复循环变量捕获问题。
  - 浮点数比较不要用 `==`，使用容差（epsilon）比较。

---

## 8. Iterator 模式 (Go 1.23+)

<GoAdvancedTopicDiagram kind="iterator-range-func" />

Go 1.23 引入了 range over func 特性，允许对自定义函数进行 `for range` 迭代。标准库新增的 `iter` 包定义了 `iter.Seq[V]` 和 `iter.Seq2[K, V]` 两种迭代器类型，让自定义集合可以像内置类型一样使用 `for range`。

::: details 点击展开代码：8. Iterator 模式 (Go 1.23+)
```go
package main

import (
	"fmt"
	"iter"
)

// ========== iter.Seq：单值迭代器 ==========

// FilterFunc 返回一个迭代器，只产出满足条件的元素
func FilterFunc[T any](s []T, predicate func(T) bool) iter.Seq[T] {
	return func(yield func(T) bool) {
		for _, v := range s {
			if predicate(v) {
				if !yield(v) {
					return // 调用方 break 时，yield 返回 false
				}
			}
		}
	}
}

// Fibonacci 返回一个无限斐波那契数列的迭代器
func Fibonacci() iter.Seq[int] {
	return func(yield func(int) bool) {
		a, b := 0, 1
		for {
			if !yield(a) {
				return
			}
			a, b = b, a+b
		}
	}
}

// ========== iter.Seq2：键值对迭代器 ==========

// Enumerate 给切片元素加上索引，类似 Python 的 enumerate
func Enumerate[T any](s []T) iter.Seq2[int, T] {
	return func(yield func(int, T) bool) {
		for i, v := range s {
			if !yield(i, v) {
				return
			}
		}
	}
}

// ========== 自定义集合类型 ==========

// Set 是一个简单的集合类型
type Set[T comparable] struct {
	data map[T]struct{}
}

func NewSet[T comparable](items ...T) *Set[T] {
	s := &Set[T]{data: make(map[T]struct{})}
	for _, item := range items {
		s.data[item] = struct{}{}
	}
	return s
}

func (s *Set[T]) Add(item T) {
	s.data[item] = struct{}{}
}

// All 返回集合的迭代器，可直接用于 for range
func (s *Set[T]) All() iter.Seq[T] {
	return func(yield func(T) bool) {
		for item := range s.data {
			if !yield(item) {
				return
			}
		}
	}
}

func main() {
	// 示例 1：过滤迭代器
	nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	fmt.Print("偶数: ")
	for v := range FilterFunc(nums, func(n int) bool { return n%2 == 0 }) {
		fmt.Print(v, " ")
	}
	fmt.Println()

	// 示例 2：无限迭代器 + break
	fmt.Print("斐波那契前10个: ")
	count := 0
	for v := range Fibonacci() {
		if count >= 10 {
			break // break 时 yield 返回 false，迭代器停止
		}
		fmt.Print(v, " ")
		count++
	}
	fmt.Println()

	// 示例 3：Seq2 键值对迭代器
	fruits := []string{"苹果", "香蕉", "橘子"}
	for i, name := range Enumerate(fruits) {
		fmt.Printf("  %d: %s\n", i, name)
	}

	// 示例 4：自定义集合的迭代器
	s := NewSet("Go", "Rust", "Python", "TypeScript")
	fmt.Print("集合元素: ")
	for item := range s.All() {
		fmt.Print(item, " ")
	}
	fmt.Println()
}
```
:::

### 讲解重点

- **何时使用**：当自定义集合类型需要支持 `for range` 语法时；当需要构建惰性求值的数据管道（filter、map、take 等）时。
- **典型使用案例**：Go 1.23 标准库的 `slices` 和 `maps` 包新增了大量基于 `iter.Seq` 的函数，如 `slices.All()`、`slices.Values()`、`maps.Keys()` 等。
- **核心机制**：
  - `iter.Seq[V]` 等价于 `func(yield func(V) bool)`。
  - `iter.Seq2[K, V]` 等价于 `func(yield func(K, V) bool)`。
  - `yield` 返回 `false` 表示调用方执行了 `break`，迭代器应立即停止。
- **常见误用与注意事项**：
  - 必须检查 `yield` 的返回值，忽略它会导致 `break` 失效，产生资源泄漏或死循环。
  - 此特性需要 Go 1.23 及以上版本。
  - 迭代器函数不应有副作用（如修改外部状态），保持纯函数风格。

---

## 9. 中间件 / 装饰器模式

<GoAdvancedTopicDiagram kind="middleware-decorator" />

中间件模式通过函数包装，在不修改原始逻辑的前提下增加横切关注点（如日志、认证、限流）。这是 Go Web 框架的核心设计思想，也是函数式编程思想在 Go 中的典型应用。

::: details 点击展开代码：9. 中间件 / 装饰器模式
```go
package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// ========== HTTP 中间件链 ==========

// Middleware 定义中间件类型
type Middleware func(http.Handler) http.Handler

// LoggingMiddleware 记录请求日志
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		log.Printf("[开始] %s %s", r.Method, r.URL.Path)

		next.ServeHTTP(w, r) // 调用下一层

		log.Printf("[完成] %s %s 耗时=%v", r.Method, r.URL.Path, time.Since(start))
	})
}

// AuthMiddleware 简单认证中间件
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token := r.Header.Get("Authorization")
		if token == "" {
			http.Error(w, `{"error":"未授权"}`, http.StatusUnauthorized)
			return // 认证失败，不调用 next
		}
		log.Printf("[认证] token=%s", token)
		next.ServeHTTP(w, r)
	})
}

// RecoverMiddleware panic 恢复中间件
func RecoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[恢复] panic: %v", err)
				http.Error(w, `{"error":"内部错误"}`, http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// Chain 把多个中间件串成链：Chain(logging, auth, recover)(handler)
// 执行顺序：logging → auth → recover → handler
func Chain(middlewares ...Middleware) Middleware {
	return func(final http.Handler) http.Handler {
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}

// ========== 通用函数装饰器 ==========

// WithTiming 给任意函数添加计时
func WithTiming(name string, fn func()) func() {
	return func() {
		start := time.Now()
		fn()
		fmt.Printf("[计时] %s 耗时: %v\n", name, time.Since(start))
	}
}

// WithRetry 给返回 error 的函数添加重试逻辑
func WithRetry(maxRetries int, fn func() error) func() error {
	return func() error {
		var err error
		for i := 0; i <= maxRetries; i++ {
			err = fn()
			if err == nil {
				return nil
			}
			if i < maxRetries {
				fmt.Printf("[重试] 第 %d 次重试，错误: %v\n", i+1, err)
				time.Sleep(time.Duration(i+1) * 100 * time.Millisecond)
			}
		}
		return fmt.Errorf("重试 %d 次后仍失败: %w", maxRetries, err)
	}
}

func main() {
	// ===== HTTP 中间件演示 =====
	// 业务 Handler
	helloHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`{"message":"Hello, World!"}`))
	})

	// 方式一：手动嵌套（从外到内）
	_ = LoggingMiddleware(AuthMiddleware(RecoverMiddleware(helloHandler)))

	// 方式二：使用 Chain 函数（推荐，可读性更好）
	chain := Chain(LoggingMiddleware, AuthMiddleware, RecoverMiddleware)
	_ = chain(helloHandler)

	fmt.Println("HTTP 中间件链构建完成")
	fmt.Println("执行顺序: Logging → Auth → Recover → Handler")

	// ===== 通用装饰器演示 =====
	fmt.Println("\n--- 通用装饰器 ---")

	// 计时装饰器
	slowTask := WithTiming("慢任务", func() {
		time.Sleep(50 * time.Millisecond)
		fmt.Println("执行慢任务...")
	})
	slowTask()

	// 重试装饰器
	attempt := 0
	unreliableTask := WithRetry(3, func() error {
		attempt++
		if attempt < 3 {
			return fmt.Errorf("连接超时")
		}
		fmt.Println("任务成功!")
		return nil
	})
	if err := unreliableTask(); err != nil {
		fmt.Println("最终失败:", err)
	}
}
```
:::

### 讲解重点

- **何时使用**：需要在不修改核心逻辑的前提下，添加日志、认证、限流、监控、错误恢复等横切关注点时。
- **典型使用案例**：`net/http` 的 `Handler` 接口和 `HandlerFunc` 是中间件模式的基础设施。`chi`、`gin`、`echo` 等框架都基于此模式构建中间件系统。`alice` 库提供了中间件链的便捷工具。
- **中间件执行顺序**：
  - 中间件以洋葱模型执行：请求从外层到内层，响应从内层到外层。
  - `Chain(A, B, C)(handler)` 的执行顺序为 A → B → C → handler → C → B → A。
- **常见误用与注意事项**：
  - 中间件中调用 `next.ServeHTTP()` 之后，不要再修改 response header（可能已发送）。
  - 不要在中间件中做耗时操作（如同步数据库查询），这会阻塞整个请求链。
  - 中间件的顺序很重要：Recover 应在最外层，Auth 应在业务逻辑之前。

---

## 10. 错误哨兵与自定义错误类型

<GoAdvancedTopicDiagram kind="error-types" />

Go 1.13 引入的 `errors.Is` 和 `errors.As` 是判断错误的标准方式，取代了传统的字符串比较和类型断言。正确使用 sentinel error 和自定义错误类型，是编写健壮 Go 程序的关键。

::: details 点击展开代码：10. 错误哨兵与自定义错误类型
```go
package main

import (
	"errors"
	"fmt"
)

// ========== Sentinel Error（哨兵错误） ==========

// 包级变量，用 Err 前缀命名，表示特定的错误条件
var (
	ErrNotFound     = errors.New("资源未找到")
	ErrUnauthorized = errors.New("未授权")
	ErrForbidden    = errors.New("禁止访问")
)

// ========== 自定义错误类型 ==========

// NotFoundError 携带上下文信息的自定义错误
type NotFoundError struct {
	Resource string
	ID       any
}

func (e *NotFoundError) Error() string {
	return fmt.Sprintf("%s(id=%v) 未找到", e.Resource, e.ID)
}

// 让 NotFoundError 与 ErrNotFound 哨兵关联
// 这样 errors.Is(err, ErrNotFound) 对 NotFoundError 也返回 true
func (e *NotFoundError) Is(target error) bool {
	return target == ErrNotFound
}

// ValidationError 校验错误，包含多个字段错误
type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("校验失败: 字段 %q %s", e.Field, e.Message)
}

// ========== 错误包装与判断 ==========

// findUser 模拟数据库查询
func findUser(id int) error {
	if id <= 0 {
		return &ValidationError{Field: "id", Message: "必须大于 0"}
	}
	if id == 404 {
		// 使用 %w 包装错误，保留错误链
		return fmt.Errorf("查询数据库: %w", &NotFoundError{Resource: "用户", ID: id})
	}
	return nil
}

// createOrder 模拟创建订单
func createOrder(userID int, amount float64) error {
	if err := findUser(userID); err != nil {
		// 继续包装，构建错误链：createOrder → findUser → NotFoundError
		return fmt.Errorf("创建订单: %w", err)
	}
	if amount <= 0 {
		return &ValidationError{Field: "amount", Message: "必须大于 0"}
	}
	return nil
}

func main() {
	fmt.Println("===== errors.Is: 判断错误链中是否包含特定哨兵 =====")

	err := createOrder(404, 100)
	fmt.Printf("原始错误: %v\n", err)

	// errors.Is 会沿着错误链向上查找
	if errors.Is(err, ErrNotFound) {
		fmt.Println("✓ 匹配 ErrNotFound（通过 NotFoundError.Is 方法）")
	}

	fmt.Println("\n===== errors.As: 提取错误链中的特定类型 =====")

	// errors.As 提取具体的错误类型，获取详细信息
	var notFoundErr *NotFoundError
	if errors.As(err, &notFoundErr) {
		fmt.Printf("✓ 提取到 NotFoundError: 资源=%s, ID=%v\n",
			notFoundErr.Resource, notFoundErr.ID)
	}

	fmt.Println("\n===== ValidationError 示例 =====")

	err2 := createOrder(0, 100)
	var valErr *ValidationError
	if errors.As(err2, &valErr) {
		fmt.Printf("✓ 校验错误: 字段=%s, 信息=%s\n", valErr.Field, valErr.Message)
	}

	fmt.Println("\n===== 错误链展示 =====")

	err3 := createOrder(404, 100)
	// 逐层解包查看错误链
	for e := err3; e != nil; e = errors.Unwrap(e) {
		fmt.Printf("  → %v\n", e)
	}

	fmt.Println("\n===== 最佳实践对比 =====")

	// 错误做法：字符串比较（脆弱，不推荐）
	// if err.Error() == "资源未找到" { ... }

	// 错误做法：直接类型断言（不支持 wrapped error）
	// if _, ok := err.(*NotFoundError); ok { ... }

	// 正确做法：使用 errors.Is / errors.As
	if errors.Is(err3, ErrNotFound) {
		fmt.Println("✓ 使用 errors.Is（推荐）")
	}
}
```
:::

### 讲解重点

- **何时使用**：所有需要对错误进行分类判断的场景都应使用 `errors.Is` / `errors.As`，而非字符串比较或直接类型断言。
- **典型使用案例**：
  - 标准库的 `io.EOF`、`sql.ErrNoRows`、`os.ErrNotExist` 都是哨兵错误。
  - `fs.PathError`、`net.OpError` 是自定义错误类型的标准库示例。
  - `errors.Is(err, os.ErrNotExist)` 是判断文件不存在的标准方式。
- **`errors.Is` vs `errors.As` 的区别**：
  - `errors.Is(err, target)`：判断错误链中是否有特定值（或实现了 `Is` 方法的匹配）。
  - `errors.As(err, &target)`：从错误链中提取特定类型，获取其字段信息。
- **常见误用与注意事项**：
  - 始终使用 `fmt.Errorf("...: %w", err)` 包装错误（`%w` 而非 `%v`），否则 `errors.Is` / `errors.As` 无法穿透错误链。
  - Sentinel error 应在包级别定义为 `var`（不是 `const`），并以 `Err` 开头命名。
  - 自定义错误类型用指针接收者实现 `Error()` 方法，`errors.As` 的 target 也要用指针的指针：`var e *MyError; errors.As(err, &e)`。
  - 不要过度创建 sentinel error，只为调用方确实需要区分处理的错误条件定义哨兵。

---

## 延伸阅读

- [Effective Go](https://go.dev/doc/effective_go) — Go 官方编程风格指南
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments) — Go 代码审查惯例
- [Go Proverbs](https://go-proverbs.github.io/) — Rob Pike 的 Go 箴言
- [uber-go/guide](https://github.com/uber-go/guide) — Uber 的 Go 编码规范
- [Go Patterns](https://github.com/tmrts/go-patterns) — Go 设计模式集合
