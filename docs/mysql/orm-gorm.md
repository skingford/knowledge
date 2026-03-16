---
title: ORM 使用经验（GORM）
description: GORM 基础 CRUD、N+1 查询问题、何时用原生 SQL 的实践经验。
---

# ORM 使用经验（GORM）

GORM 是 Go 中最流行的 ORM 框架。它提供了便捷的 CRUD、关联查询、迁移等功能，但也容易引入性能陷阱。关键是理解它生成的 SQL，知道什么时候该用 ORM、什么时候该用原生 SQL。

## GORM 基础用法

```go
package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"size:100;not null"`
	Email     string `gorm:"size:200;uniqueIndex"`
	Age       int
	CreatedAt time.Time
	UpdatedAt time.Time
}

func main() {
	dsn := "user:password@tcp(127.0.0.1:3306)/mydb?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		// 开发阶段开启日志，可以看到生成的 SQL
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal(err)
	}

	// 自动建表/迁移
	db.AutoMigrate(&User{})

	// Create
	user := User{Name: "张三", Email: "zhangsan@example.com", Age: 28}
	if err := db.Create(&user).Error; err != nil {
		log.Fatal(err)
	}
	fmt.Printf("created user id=%d\n", user.ID)

	// Read
	var found User
	if err := db.First(&found, user.ID).Error; err != nil {
		log.Fatal(err)
	}

	// Update
	db.Model(&found).Update("Age", 29)

	// Delete（软删除需要模型嵌入 gorm.DeletedAt）
	db.Delete(&User{}, user.ID)

	// 条件查询
	var users []User
	db.Where("age > ? AND name LIKE ?", 20, "%张%").
		Order("created_at DESC").
		Limit(10).
		Find(&users)
}
```

## 避免 N+1 查询问题

```go
type Order struct {
	ID     uint
	UserID uint
	User   User  `gorm:"foreignKey:UserID"` // 关联
	Total  float64
	Items  []OrderItem `gorm:"foreignKey:OrderID"`
}

type OrderItem struct {
	ID        uint
	OrderID   uint
	ProductID uint
	Qty       int
	Price     float64
}

// Bad: N+1 问题 — 查 10 个订单，每个订单再查一次 User，共 11 次查询
func getOrdersBad(db *gorm.DB) []Order {
	var orders []Order
	db.Find(&orders) // SELECT * FROM orders
	for i := range orders {
		db.First(&orders[i].User, orders[i].UserID) // 每个订单一次查询
	}
	return orders
}

// Good: 使用 Preload 预加载，GORM 会合并成 2 次查询
func getOrdersGood(db *gorm.DB) ([]Order, error) {
	var orders []Order
	err := db.Preload("User").Preload("Items").
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)).
		Find(&orders).Error
	// SELECT * FROM orders WHERE created_at > ?
	// SELECT * FROM users WHERE id IN (1,2,3,...)
	// SELECT * FROM order_items WHERE order_id IN (1,2,3,...)
	return orders, err
}
```

## 什么时候用原生 SQL

```go
// 复杂聚合查询、多表 JOIN、性能敏感的场景，建议直接用原生 SQL
type SalesReport struct {
	ProductName string
	TotalQty    int
	TotalAmount float64
}

func getSalesReport(db *gorm.DB) ([]SalesReport, error) {
	var reports []SalesReport
	err := db.Raw(`
		SELECT p.name AS product_name,
		       SUM(oi.qty) AS total_qty,
		       SUM(oi.qty * oi.price) AS total_amount
		FROM order_items oi
		JOIN products p ON p.id = oi.product_id
		JOIN orders o ON o.id = oi.order_id
		WHERE o.created_at >= ?
		GROUP BY p.id, p.name
		ORDER BY total_amount DESC
		LIMIT 20
	`, time.Now().AddDate(0, -1, 0)).Scan(&reports).Error
	return reports, err
}
```

**讲解重点：**

1. **ORM 适合简单 CRUD，复杂查询用原生 SQL**：ORM 的价值在于减少样板代码，但复杂 JOIN、子查询、窗口函数等场景下，ORM 生成的 SQL 往往不够优化，且可读性差。建议团队约定：简单 CRUD 用 ORM，复杂查询用 `db.Raw()`。
2. **N+1 问题是 ORM 最常见的性能陷阱**：每访问一个关联字段就触发一次查询，10 条主记录就变成 11 次查询。GORM 的 `Preload` 和 `Joins` 可以解决，但需要开发者主动使用。开发阶段开启 SQL 日志可以及早发现。
3. **AutoMigrate 不适合生产环境**：它只会添加列、创建索引，不会删除列或修改列类型。生产环境应使用专门的数据库迁移工具（如 golang-migrate、goose），配合版本管理和 code review。

---

## 继续阅读

- [database/sql 与连接池](./database-sql-and-connection.md)
- [事务处理与 SQL 优化](./transaction-and-optimization.md)
- [返回 MySQL 专题总览](./index.md)
