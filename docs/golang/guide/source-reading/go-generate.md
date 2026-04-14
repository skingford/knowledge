---
title: go:generate 代码生成工具链源码精读
description: 精读 go generate 机制，掌握 stringer/mockgen/protoc/sqlc 集成模式，构建可维护的代码生成工作流。
---

# go:generate：代码生成工具链精读

> 核心文档：`cmd/go/internal/generate`，工具链：`stringer`、`mockgen`、`protoc-gen-go`、`sqlc`
>
> 图例参考：
> - `GoEngineeringDiagram`：`go-generate-pipeline`

## 包结构图

```
go generate 工具链体系
══════════════════════════════════════════════════════════════════

  go generate 触发机制：
  ├── 扫描 .go 文件中 //go:generate <命令> 注释
  ├── 在包目录下执行命令（不是 shell，是 os/exec）
  ├── 环境变量注入：
  │    GOFILE   ← 当前文件名
  │    GOPACKAGE ← 包名
  │    GOARCH / GOOS ← 目标平台
  │    $GOROOT / $GOPATH
  └── go generate ./...  ← 递归执行所有包

  常用代码生成工具：
  ┌─────────────────┬────────────────────────────────────────┐
  │ 工具             │ 用途                                   │
  ├─────────────────┼────────────────────────────────────────┤
  │ stringer        │ 枚举类型 String() 方法                  │
  │ mockgen         │ 接口 Mock（gomock 框架）                 │
  │ protoc-gen-go   │ .proto → Go 代码（gRPC）               │
  │ sqlc            │ SQL → 类型安全 Go 代码                  │
  │ wire            │ 依赖注入代码生成                         │
  │ go-bindata      │ 静态资源内嵌（已被 embed 取代）           │
  └─────────────────┴────────────────────────────────────────┘

  工程规范：
  ├── 生成文件加 // Code generated ... DO NOT EDIT. 头
  ├── 生成文件纳入版本控制（可选，但推荐）
  ├── Makefile 统一管理 generate 命令
  └── CI 验证：generate 后 git diff 应为空

══════════════════════════════════════════════════════════════════
```

<GoEngineeringDiagram kind="go-generate-pipeline" />

---

## 一、核心机制

::: details 点击展开代码：一、核心机制
```go
// go generate 读取 //go:generate 指令（注意：双斜杠后紧跟 go:generate，无空格）
// 文件：status.go

//go:generate stringer -type=Status -output=status_string.go

package order

type Status int

const (
    StatusPending Status = iota
    StatusActive
    StatusCompleted
    StatusCancelled
)

// 执行 go generate 后，自动生成 status_string.go：
// func (s Status) String() string {
//     switch s {
//     case StatusPending:   return "StatusPending"
//     case StatusActive:    return "StatusActive"
//     case StatusCompleted: return "StatusCompleted"
//     case StatusCancelled: return "StatusCancelled"
//     default:              return fmt.Sprintf("Status(%d)", int(s))
//     }
// }
```
:::

---

## 二、代码示例

### stringer：枚举自动生成 String()

<GoEngineeringDiagram kind="go-generate-pipeline" />

::: details 点击展开代码：stringer：枚举自动生成 String()
```go
// 文件：color.go
package color

//go:generate stringer -type=Color -linecomment

type Color int

const (
    Red   Color = iota // 红色
    Green              // 绿色
    Blue               // 蓝色
)

// -linecomment 参数：使用行尾注释作为字符串值
// 生成后：
// Red.String()   → "红色"
// Green.String() → "绿色"
// Blue.String()  → "蓝色"

// 带位掩码（-trimprefix 去掉前缀）：
//go:generate stringer -type=Permission -trimprefix Permission

type Permission uint

const (
    PermissionRead    Permission = 1 << iota // 1
    PermissionWrite                          // 2
    PermissionExecute                        // 4
)
```
:::

### mockgen：接口 Mock 自动生成

::: details 点击展开代码：mockgen：接口 Mock 自动生成
```go
// 文件：user_repo.go
package repo

//go:generate mockgen -source=user_repo.go -destination=mock/user_repo_mock.go -package=mock

type UserRepository interface {
    GetByID(ctx context.Context, id int64) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
    List(ctx context.Context, filter UserFilter) ([]*User, error)
}

// 生成后 mock/user_repo_mock.go 包含：
// type MockUserRepository struct { ... }
// func (m *MockUserRepository) GetByID(ctx context.Context, id int64) (*User, error) { ... }
// ...
```
:::

::: details 点击展开代码：mockgen：接口 Mock 自动生成
```go
// 使用生成的 Mock 编写测试
func TestUserService_GetUser(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := mock.NewMockUserRepository(ctrl)

    // 设置期望：GetByID(ctx, 123) 返回用户
    mockRepo.EXPECT().
        GetByID(gomock.Any(), int64(123)).
        Return(&User{ID: 123, Name: "Alice"}, nil).
        Times(1)

    // 测试服务层
    svc := NewUserService(mockRepo)
    user, err := svc.GetUser(context.Background(), 123)

    assert.NoError(t, err)
    assert.Equal(t, "Alice", user.Name)
}
```
:::

### protoc：gRPC 代码生成

::: details 点击展开代码：protoc：gRPC 代码生成
```protobuf
// 文件：api/user.proto
syntax = "proto3";
package api;
option go_package = "github.com/example/app/api;api";

service UserService {
    rpc GetUser(GetUserRequest) returns (GetUserResponse);
    rpc ListUsers(ListUsersRequest) returns (stream ListUsersResponse);
}

message GetUserRequest { int64 id = 1; }
message GetUserResponse {
    int64 id = 1;
    string name = 2;
    string email = 3;
}
```
:::

::: details 点击展开代码：protoc：gRPC 代码生成
```go
// 文件：api/generate.go
package api

//go:generate protoc --go_out=. --go_opt=paths=source_relative \
//go:generate          --go-grpc_out=. --go-grpc_opt=paths=source_relative \
//go:generate          user.proto

// 执行后生成：
// api/user.pb.go     ← message 结构体
// api/user_grpc.pb.go ← Service 接口和 Client/Server stub

// 实现 gRPC Server
type userServer struct {
    api.UnimplementedUserServiceServer // 嵌入，向前兼容
    repo UserRepository
}

func (s *userServer) GetUser(ctx context.Context, req *api.GetUserRequest) (*api.GetUserResponse, error) {
    user, err := s.repo.GetByID(ctx, req.Id)
    if err != nil {
        return nil, status.Errorf(codes.NotFound, "user %d not found", req.Id)
    }
    return &api.GetUserResponse{Id: user.ID, Name: user.Name, Email: user.Email}, nil
}
```
:::

### sqlc：SQL → 类型安全 Go 代码

::: details 点击展开代码：sqlc：SQL → 类型安全 Go 代码
```yaml
# sqlc.yaml 配置
version: "2"
sql:
  - engine: "postgresql"
    queries: "sql/queries/"
    schema: "sql/schema/"
    gen:
      go:
        package: "db"
        out: "internal/db"
        emit_json_tags: true
        emit_prepared_queries: true
```
:::

::: details 点击展开代码：sqlc：SQL → 类型安全 Go 代码
```sql
-- sql/queries/users.sql

-- name: GetUser :one
SELECT id, name, email, created_at FROM users WHERE id = $1;

-- name: ListUsers :many
SELECT id, name, email, created_at FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateUser :one
INSERT INTO users (name, email) VALUES ($1, $2)
RETURNING id, name, email, created_at;

-- name: UpdateUserName :exec
UPDATE users SET name = $2 WHERE id = $1;
```
:::

::: details 点击展开代码：sqlc：SQL → 类型安全 Go 代码
```go
// 文件：internal/db/generate.go
package db

//go:generate sqlc generate

// sqlc 自动生成（示例，勿手写）：
// type GetUserRow struct {
//     ID        int64
//     Name      string
//     Email     string
//     CreatedAt time.Time
// }
// func (q *Queries) GetUser(ctx context.Context, id int64) (GetUserRow, error) { ... }
// func (q *Queries) ListUsers(ctx context.Context, arg ListUsersParams) ([]ListUsersRow, error) { ... }
// func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (CreateUserRow, error) { ... }
```
:::

::: details 点击展开代码：sqlc：SQL → 类型安全 Go 代码
```go
// 使用 sqlc 生成代码（完全类型安全，无 runtime 反射）
func CreateUser(ctx context.Context, q *db.Queries, name, email string) error {
    user, err := q.CreateUser(ctx, db.CreateUserParams{
        Name:  name,
        Email: email,
    })
    if err != nil {
        return fmt.Errorf("create user: %w", err)
    }
    log.Printf("Created user: id=%d, name=%s", user.ID, user.Name)
    return nil
}
```
:::

### 自定义代码生成器（text/template）

<GoEngineeringDiagram kind="go-generate-pipeline" />

::: details 点击展开代码：自定义代码生成器（text/template）
```go
// 工具文件：tools/gen-crud/main.go
// 根据结构体定义自动生成 CRUD 方法

//go:build ignore

package main

import (
    "go/ast"
    "go/format"
    "go/parser"
    "go/token"
    "os"
    "text/template"
)

const crudTemplate = `// Code generated by gen-crud. DO NOT EDIT.
package {{.Package}}

import "context"

type {{.Name}}Repository interface {
    Get(ctx context.Context, id int64) (*{{.Name}}, error)
    List(ctx context.Context) ([]*{{.Name}}, error)
    Create(ctx context.Context, v *{{.Name}}) error
    Update(ctx context.Context, v *{{.Name}}) error
    Delete(ctx context.Context, id int64) error
}
`

func main() {
    src, _ := os.ReadFile(os.Getenv("GOFILE"))
    fset := token.NewFileSet()
    f, _ := parser.ParseFile(fset, "", src, 0)

    for _, decl := range f.Decls {
        genDecl, ok := decl.(*ast.GenDecl)
        if !ok || genDecl.Tok != token.TYPE {
            continue
        }
        for _, spec := range genDecl.Specs {
            typeSpec, ok := spec.(*ast.TypeSpec)
            if !ok {
                continue
            }

            // 生成接口代码
            var buf bytes.Buffer
            tmpl, _ := template.New("crud").Parse(crudTemplate)
            tmpl.Execute(&buf, map[string]string{
                "Package": f.Name.Name,
                "Name":    typeSpec.Name.Name,
            })

            // 格式化并写入文件
            formatted, _ := format.Source(buf.Bytes())
            filename := strings.ToLower(typeSpec.Name.Name) + "_repo.go"
            os.WriteFile(filename, formatted, 0644)
        }
    }
}
```
:::

::: details 点击展开代码：自定义代码生成器（text/template）
```go
// 在目标文件中引用生成工具
// 文件：model/user.go

//go:generate go run ../tools/gen-crud/main.go

package model

type User struct {
    ID    int64
    Name  string
    Email string
}
```
:::

### Makefile 统一管理（工程实践）

::: details 点击展开代码：Makefile 统一管理（工程实践）
```makefile
# Makefile

.PHONY: generate generate-check proto mock

# 执行所有 go generate
generate:
	go generate ./...

# CI 验证：generate 后应无 git 变动
generate-check:
	go generate ./...
	git diff --exit-code || (echo "Generated files are outdated, run 'make generate'" && exit 1)

# 单独执行 proto 生成
proto:
	find . -name "*.proto" -exec protoc \
		--go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		{} \;

# 单独执行 mock 生成
mock:
	go generate ./internal/...

# sqlc 生成
sqlc:
	sqlc generate
```
:::

### 生成文件标识规范

::: details 点击展开代码：生成文件标识规范
```go
// 所有生成文件的第一行（go generate 工具通常自动添加）
// Code generated by <tool> from <source>. DO NOT EDIT.

// 示例（stringer 自动生成）：
// Code generated by "stringer -type=Status"; DO NOT EDIT.

// 示例（手写生成器）：
// Code generated by gen-crud from user.go. DO NOT EDIT.

// 使用 build tag 区分生成文件（可选）：
//go:build !ignore

// 工具文件用 //go:build ignore 排除编译（仅 go generate 时执行）：
//go:build ignore
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| `go generate` 和 `go build` 的区别？ | `go build` 自动执行；`go generate` 需手动/CI 触发，用于生成需要纳入版本控制的代码；两者不会自动配合 |
| 生成代码应该提交到版本控制吗？ | 推荐提交：CI 可直接使用，无需安装工具；不提交：减少 PR diff 噪音，但 CI 需安装生成工具；两种方式各有取舍 |
| `stringer` 和手写 `String()` 的区别？ | stringer 自动保持与常量定义同步（新增常量忘记写 case 时，手写版会出 bug）；stringer 在 default case 返回 `Type(数字)`，永不 panic |
| `sqlc` 相比 GORM 的优势？ | 编译期类型检查（GORM 运行期才发现 SQL 错误）；生成纯 SQL（可预测性能）；无反射开销；但缺乏 GORM 的动态查询构建能力 |
| `//go:build ignore` 的作用？ | 标记文件不参与普通 `go build` 编译；专门用于工具文件（gen/*.go），只在 `go run tools/gen/main.go` 或 `go generate` 时执行 |
| 如何避免 CI 中生成代码过期？ | `go generate ./... && git diff --exit-code`：generate 后检查 git 状态；若有变更说明有人修改了源定义却没有重新 generate |
