---
title: 测试、Benchmark 与 CI/CD
description: Go 质量保障专题，覆盖单元测试、集成测试、基准测试与 CI CD 自动化交付。
search: false
---

# 测试、Benchmark 与 CI/CD

这一页覆盖交付闭环：从单元测试、Mock、集成测试，到基准测试和 CI/CD，形成完整的工程质量保障链路。

## 本页内容

- [8. 单元测试](#_8-单元测试)
- [9. Mock 测试](#_9-mock-测试)
- [10. 集成测试](#_10-集成测试)
- [11. Benchmark](#_11-benchmark)
- [12. CI/CD](#_12-ci-cd)

---

## 8. 单元测试

Go 的 `testing` 包提供了简洁而强大的测试框架。

### 基础测试

```go
// mathutil/math.go
package mathutil

func Add(a, b int) int {
	return a + b
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, fmt.Errorf("division by zero")
	}
	return a / b, nil
}
```

```go
// mathutil/math_test.go
package mathutil

import (
	"math"
	"testing"
)

func TestAdd(t *testing.T) {
	got := Add(2, 3)
	want := 5
	if got != want {
		t.Errorf("Add(2, 3) = %d, want %d", got, want)
	}
}
```

### 表驱动测试

```go
func TestDivide(t *testing.T) {
	tests := []struct {
		name    string
		a, b    float64
		want    float64
		wantErr bool
	}{
		{"normal", 10, 2, 5, false},
		{"negative", -10, 2, -5, false},
		{"decimal", 1, 3, 0.333333, false},
		{"divide by zero", 10, 0, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)
			if (err != nil) != tt.wantErr {
				t.Errorf("Divide(%v, %v) error = %v, wantErr %v", tt.a, tt.b, err, tt.wantErr)
				return
			}
			if !tt.wantErr && math.Abs(got-tt.want) > 0.001 {
				t.Errorf("Divide(%v, %v) = %v, want %v", tt.a, tt.b, got, tt.want)
			}
		})
	}
}
```

### 测试辅助函数

```go
// testutil/helper.go
package testutil

import "testing"

// AssertEqual 通用断言辅助函数
func AssertEqual[T comparable](t *testing.T, got, want T) {
	t.Helper() // 标记为辅助函数，错误信息显示调用方行号
	if got != want {
		t.Errorf("got %v, want %v", got, want)
	}
}

// AssertNoError 断言无错误
func AssertNoError(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

// AssertError 断言有错误
func AssertError(t *testing.T, err error) {
	t.Helper()
	if err == nil {
		t.Fatal("expected error, got nil")
	}
}
```

### 使用 testify 简化断言

```go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserService(t *testing.T) {
	svc := NewUserService()

	t.Run("create user", func(t *testing.T) {
		user, err := svc.Create("alice", "alice@example.com")
		require.NoError(t, err)                 // 失败直接终止
		assert.Equal(t, "alice", user.Name)      // 失败继续执行
		assert.NotZero(t, user.ID)
		assert.NotEmpty(t, user.CreatedAt)
	})

	t.Run("duplicate email", func(t *testing.T) {
		_, err := svc.Create("bob", "alice@example.com")
		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrEmailExists)
	})
}
```

### 覆盖率

```bash
# 运行测试并输出覆盖率
go test -cover ./...

# 生成覆盖率报告
go test -coverprofile=coverage.out ./...

# 查看 HTML 报告
go tool cover -html=coverage.out -o coverage.html

# 按函数查看覆盖率
go tool cover -func=coverage.out
```

::: tip 讲解重点
1. **表驱动测试是 Go 的核心测试模式**：所有用例集中在一个 slice 中，新增用例只需加一行，减少了重复代码。
2. **`t.Helper()` 让错误定位更准确**：在辅助函数中调用它，出错时报告的是调用方的行号而非辅助函数内部。
3. **`require` 与 `assert` 的区别**：`require` 失败后立即终止当前测试（`t.FailNow()`），`assert` 失败后继续执行后续断言，按场景选用。
:::

---

## 9. Mock 测试

Mock 测试通过替换外部依赖（数据库、HTTP 服务等）来实现单元级别的隔离测试。

### 基于接口的 Mock

```go
// repository/user.go - 定义接口
package repository

import "context"

type User struct {
	ID    int64
	Name  string
	Email string
}

type UserRepository interface {
	FindByID(ctx context.Context, id int64) (*User, error)
	Create(ctx context.Context, user *User) error
}
```

```go
// service/user.go - 业务层依赖接口
package service

import (
	"context"
	"fmt"

	"myproject/internal/repository"
)

type UserService struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) GetUser(ctx context.Context, id int64) (*repository.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find user: %w", err)
	}
	if user == nil {
		return nil, fmt.Errorf("user %d not found", id)
	}
	return user, nil
}
```

### 手写 Mock

```go
// service/user_test.go
package service

import (
	"context"
	"errors"
	"testing"

	"myproject/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// mockUserRepo 手写 mock 实现
type mockUserRepo struct {
	findByIDFunc func(ctx context.Context, id int64) (*repository.User, error)
	createFunc   func(ctx context.Context, user *repository.User) error
}

func (m *mockUserRepo) FindByID(ctx context.Context, id int64) (*repository.User, error) {
	return m.findByIDFunc(ctx, id)
}

func (m *mockUserRepo) Create(ctx context.Context, user *repository.User) error {
	return m.createFunc(ctx, user)
}

func TestGetUser(t *testing.T) {
	tests := []struct {
		name     string
		id       int64
		mockRepo *mockUserRepo
		want     *repository.User
		wantErr  bool
	}{
		{
			name: "user found",
			id:   1,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return &repository.User{ID: 1, Name: "alice"}, nil
				},
			},
			want: &repository.User{ID: 1, Name: "alice"},
		},
		{
			name: "user not found",
			id:   999,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return nil, nil
				},
			},
			wantErr: true,
		},
		{
			name: "db error",
			id:   1,
			mockRepo: &mockUserRepo{
				findByIDFunc: func(ctx context.Context, id int64) (*repository.User, error) {
					return nil, errors.New("connection refused")
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc := NewUserService(tt.mockRepo)
			got, err := svc.GetUser(context.Background(), tt.id)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want.ID, got.ID)
			assert.Equal(t, tt.want.Name, got.Name)
		})
	}
}
```

### 使用 testify/mock

```go
package service

import (
	"context"
	"testing"

	"myproject/internal/repository"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepo 使用 testify/mock
type MockUserRepo struct {
	mock.Mock
}

func (m *MockUserRepo) FindByID(ctx context.Context, id int64) (*repository.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.User), args.Error(1)
}

func (m *MockUserRepo) Create(ctx context.Context, user *repository.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func TestGetUser_WithTestifyMock(t *testing.T) {
	mockRepo := new(MockUserRepo)

	// 设置期望
	mockRepo.On("FindByID", mock.Anything, int64(1)).
		Return(&repository.User{ID: 1, Name: "alice"}, nil)

	svc := NewUserService(mockRepo)
	user, err := svc.GetUser(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, "alice", user.Name)

	// 验证 mock 方法被正确调用
	mockRepo.AssertExpectations(t)
	mockRepo.AssertCalled(t, "FindByID", mock.Anything, int64(1))
}
```

### 使用 gomock

```bash
# 安装 mockgen
go install go.uber.org/mock/mockgen@latest

# 从接口生成 mock 代码
mockgen -source=internal/repository/user.go -destination=internal/repository/mock/user_mock.go -package=mock
```

```go
package service

import (
	"context"
	"testing"

	"myproject/internal/repository/mock"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"
)

func TestGetUser_WithGoMock(t *testing.T) {
	ctrl := gomock.NewController(t)

	mockRepo := mock.NewMockUserRepository(ctrl)
	mockRepo.EXPECT().
		FindByID(gomock.Any(), int64(1)).
		Return(&repository.User{ID: 1, Name: "alice"}, nil).
		Times(1)

	svc := NewUserService(mockRepo)
	user, err := svc.GetUser(context.Background(), 1)

	assert.NoError(t, err)
	assert.Equal(t, "alice", user.Name)
}
```

::: tip 讲解重点
1. **Mock 的前提是面向接口编程**：只有业务层依赖接口而非具体实现，才能在测试中注入 Mock 对象。
2. **手写 Mock 适合简单场景**，使用函数字段的方式灵活且无第三方依赖；`testify/mock` 和 `gomock` 适合接口方法多、需要验证调用次数/顺序的场景。
3. **不要 Mock 一切**：只 Mock 外部依赖（数据库、HTTP 调用、消息队列），纯业务逻辑的内部函数不需要 Mock。
:::

---

## 10. 集成测试

集成测试验证多个组件协作的正确性，通常涉及真实数据库或外部服务。

### TestMain 生命周期管理

```go
package integration

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

var testDB *sql.DB

func TestMain(m *testing.M) {
	// Setup：在所有测试执行前运行
	var err error
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://test:test@localhost:5433/testdb?sslmode=disable"
	}

	testDB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("connect to test db: %v", err)
	}

	// 执行迁移
	if err := runMigrations(testDB); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	// 运行所有测试
	code := m.Run()

	// Teardown：在所有测试执行后运行
	testDB.Close()
	os.Exit(code)
}

func runMigrations(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(200) UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)
	`)
	return err
}

// cleanTable 每个测试前清理数据
func cleanTable(t *testing.T, tables ...string) {
	t.Helper()
	for _, table := range tables {
		_, err := testDB.Exec(fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table))
		if err != nil {
			t.Fatalf("clean table %s: %v", table, err)
		}
	}
}
```

### 数据库集成测试

```go
package integration

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository_Create(t *testing.T) {
	cleanTable(t, "users")

	repo := NewUserRepository(testDB)
	ctx := context.Background()

	user := &User{Name: "alice", Email: "alice@example.com"}
	err := repo.Create(ctx, user)
	require.NoError(t, err)
	assert.NotZero(t, user.ID)

	// 验证数据确实写入
	got, err := repo.FindByID(ctx, user.ID)
	require.NoError(t, err)
	assert.Equal(t, "alice", got.Name)
	assert.Equal(t, "alice@example.com", got.Email)
}

func TestUserRepository_DuplicateEmail(t *testing.T) {
	cleanTable(t, "users")

	repo := NewUserRepository(testDB)
	ctx := context.Background()

	user1 := &User{Name: "alice", Email: "same@example.com"}
	require.NoError(t, repo.Create(ctx, user1))

	user2 := &User{Name: "bob", Email: "same@example.com"}
	err := repo.Create(ctx, user2)
	assert.Error(t, err) // 应当因唯一约束失败
}
```

### 使用 Testcontainers

```go
package integration

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/wait"
	_ "github.com/lib/pq"
)

func setupPostgresContainer(t *testing.T) (*sql.DB, func()) {
	t.Helper()
	ctx := context.Background()

	// 启动 PostgreSQL 容器
	req := testcontainers.ContainerRequest{
		Image:        "postgres:16-alpine",
		ExposedPorts: []string{"5432/tcp"},
		Env: map[string]string{
			"POSTGRES_USER":     "test",
			"POSTGRES_PASSWORD": "test",
			"POSTGRES_DB":       "testdb",
		},
		WaitingFor: wait.ForLog("database system is ready to accept connections").
			WithOccurrence(2).
			WithStartupTimeout(30 * time.Second),
	}

	container, err := testcontainers.GenericContainer(ctx, testcontainers.GenericContainerRequest{
		ContainerRequest: req,
		Started:          true,
	})
	if err != nil {
		t.Fatalf("start container: %v", err)
	}

	host, _ := container.Host(ctx)
	port, _ := container.MappedPort(ctx, "5432")

	dsn := fmt.Sprintf("postgres://test:test@%s:%s/testdb?sslmode=disable", host, port.Port())
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		t.Fatalf("connect db: %v", err)
	}

	// 返回清理函数
	cleanup := func() {
		db.Close()
		container.Terminate(ctx)
	}

	return db, cleanup
}

func TestWithContainer(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test in short mode")
	}

	db, cleanup := setupPostgresContainer(t)
	defer cleanup()

	// 使用真实数据库执行测试
	_, err := db.Exec(`CREATE TABLE test_items (id SERIAL PRIMARY KEY, name TEXT)`)
	if err != nil {
		t.Fatal(err)
	}

	_, err = db.Exec(`INSERT INTO test_items (name) VALUES ($1)`, "item1")
	if err != nil {
		t.Fatal(err)
	}

	var name string
	err = db.QueryRow(`SELECT name FROM test_items WHERE id = 1`).Scan(&name)
	if err != nil {
		t.Fatal(err)
	}
	assert.Equal(t, "item1", name)
}
```

```bash
# 运行集成测试（跳过 -short 标记的测试）
go test -v -count=1 ./internal/integration/...

# 快速运行（跳过集成测试）
go test -short ./...

# 指定 build tag 隔离集成测试
# 在文件头部加: //go:build integration
go test -tags=integration ./...
```

::: tip 讲解重点
1. **`TestMain` 是包级别的测试生命周期钩子**：适合数据库连接、容器启动等重量级 Setup/Teardown，每个包只能有一个。
2. **Testcontainers 自动管理容器生命周期**：无需手动启停 Docker，测试结束自动清理，适合 CI 环境。
3. **用 `-short` 和 build tag 区分测试层次**：日常开发跑 `go test -short`（秒级），CI 全量跑集成测试（分钟级）。
:::

---

## 11. Benchmark

Go 内置的 benchmark 框架可以精确测量代码性能。

### 基础 Benchmark

```go
package stringutil

import (
	"fmt"
	"strings"
	"testing"
)

// 待测函数
func ConcatWithPlus(strs []string) string {
	result := ""
	for _, s := range strs {
		result += s
	}
	return result
}

func ConcatWithBuilder(strs []string) string {
	var b strings.Builder
	for _, s := range strs {
		b.WriteString(s)
	}
	return b.String()
}

func ConcatWithJoin(strs []string) string {
	return strings.Join(strs, "")
}

// Benchmark 函数
func BenchmarkConcatWithPlus(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer() // 重置计时器，排除初始化时间
	for i := 0; i < b.N; i++ {
		ConcatWithPlus(strs)
	}
}

func BenchmarkConcatWithBuilder(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConcatWithBuilder(strs)
	}
}

func BenchmarkConcatWithJoin(b *testing.B) {
	strs := make([]string, 100)
	for i := range strs {
		strs[i] = fmt.Sprintf("string-%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ConcatWithJoin(strs)
	}
}
```

### 内存分配统计

```go
func BenchmarkMapAccess(b *testing.B) {
	m := make(map[string]int, 1000)
	for i := 0; i < 1000; i++ {
		m[fmt.Sprintf("key-%d", i)] = i
	}

	b.ResetTimer()
	b.ReportAllocs() // 报告内存分配

	for i := 0; i < b.N; i++ {
		_ = m["key-500"]
	}
}

// 对比 sync.Map
func BenchmarkSyncMapAccess(b *testing.B) {
	var m sync.Map
	for i := 0; i < 1000; i++ {
		m.Store(fmt.Sprintf("key-%d", i), i)
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		m.Load("key-500")
	}
}
```

### 子 Benchmark 与不同输入规模

```go
func BenchmarkSliceAppend(b *testing.B) {
	sizes := []int{10, 100, 1000, 10000}

	for _, size := range sizes {
		b.Run(fmt.Sprintf("size-%d", size), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				s := make([]int, 0)
				for j := 0; j < size; j++ {
					s = append(s, j)
				}
			}
		})

		b.Run(fmt.Sprintf("size-%d-prealloc", size), func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				s := make([]int, 0, size) // 预分配
				for j := 0; j < size; j++ {
					s = append(s, j)
				}
			}
		})
	}
}
```

### 运行与解读结果

```bash
# 运行 benchmark
go test -bench=. -benchmem ./...

# 只运行特定 benchmark
go test -bench=BenchmarkConcat -benchmem ./...

# 多次运行取稳定值
go test -bench=. -benchmem -count=5 ./...

# 输出结果用 benchstat 分析
go test -bench=. -benchmem -count=10 ./... > old.txt
# 修改代码后再跑一次
go test -bench=. -benchmem -count=10 ./... > new.txt

# 比较前后差异
go install golang.org/x/perf/cmd/benchstat@latest
benchstat old.txt new.txt
```

```
# 输出解读示例：
# BenchmarkConcatWithPlus-8      5000   300000 ns/op   500000 B/op   99 allocs/op
#                        │       │      │               │              │
#                        │       │      │               │              └── 每次操作的内存分配次数
#                        │       │      │               └── 每次操作分配的字节数
#                        │       │      └── 每次操作耗时
#                        │       └── 循环次数（b.N）
#                        └── GOMAXPROCS
```

::: tip 讲解重点
1. **`b.ResetTimer()` 排除初始化开销**：如果 benchmark 前有数据准备工作，必须在循环前重置计时器。
2. **`b.ReportAllocs()` 暴露内存问题**：高频路径上的内存分配会增加 GC 压力，关注 `allocs/op` 指标。
3. **使用 `benchstat` 做科学对比**：单次 benchmark 结果有波动，至少跑 5-10 次取统计值才有参考意义。
:::

---

## 12. CI/CD

自动化 CI/CD 流水线保证代码质量并加速发布流程。

### GitHub Actions 基础配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          args: --timeout=5m

  test:
    name: Test
    runs-on: ubuntu-latest
    needs: lint

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Cache Go modules
        uses: actions/cache@v4
        with:
          path: ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          restore-keys: ${{ runner.os }}-go-

      - name: Run unit tests
        run: go test -short -race -coverprofile=coverage.out ./...

      - name: Run integration tests
        run: go test -race -tags=integration ./...
        env:
          TEST_DATABASE_URL: postgres://test:test@localhost:5432/testdb?sslmode=disable

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage.out

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Build
        run: |
          CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/api-server ./cmd/api-server
          CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/worker ./cmd/worker

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: binaries
          path: bin/
```

### Release 自动化

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GoReleaser 配置

```yaml
# .goreleaser.yml
version: 2

builds:
  - id: api-server
    main: ./cmd/api-server
    binary: api-server
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X main.version={{.Version}}
      - -X main.commit={{.Commit}}
      - -X main.date={{.Date}}

dockers:
  - image_templates:
      - "ghcr.io/yourname/api-server:{{ .Tag }}"
      - "ghcr.io/yourname/api-server:latest"
    dockerfile: Dockerfile
    build_flag_templates:
      - "--platform=linux/amd64"

archives:
  - format: tar.gz
    name_template: "{{ .ProjectName }}_{{ .Os }}_{{ .Arch }}"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"
```

### Makefile 统一入口

```makefile
# Makefile
.PHONY: all build test lint clean

GO := go
BINARY := bin/api-server
GOFLAGS := -ldflags="-s -w"

all: lint test build

build:
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o $(BINARY) ./cmd/api-server

test:
	$(GO) test -short -race -cover ./...

test-integration:
	$(GO) test -race -tags=integration -count=1 ./...

lint:
	golangci-lint run ./...

fmt:
	$(GO) fmt ./...
	goimports -w .

clean:
	rm -rf bin/ coverage.out

coverage:
	$(GO) test -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html

bench:
	$(GO) test -bench=. -benchmem ./...

docker-build:
	docker build -t api-server:latest .

run:
	$(GO) run ./cmd/api-server

help:
	@echo "Available targets:"
	@echo "  build            - Build binary"
	@echo "  test             - Run unit tests"
	@echo "  test-integration - Run integration tests"
	@echo "  lint             - Run linters"
	@echo "  fmt              - Format code"
	@echo "  coverage         - Generate coverage report"
	@echo "  bench            - Run benchmarks"
	@echo "  clean            - Remove build artifacts"
```

### Dockerfile 多阶段构建

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /api-server ./cmd/api-server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /api-server /api-server

EXPOSE 8080
ENTRYPOINT ["/api-server"]
```

::: tip 讲解重点
1. **CI 流水线分阶段执行**：Lint -> Test -> Build，前一阶段失败就跳过后续步骤，节省资源并快速反馈。
2. **`-race` 标志在 CI 中必须开启**：竞态检测器能发现并发 bug，虽然会增加约 2-10x 运行时间，但在 CI 中值得。
3. **GoReleaser + GitHub Actions 实现一键发布**：打 tag 自动触发多平台构建、Docker 镜像推送和 Changelog 生成，减少人工操作失误。
:::
