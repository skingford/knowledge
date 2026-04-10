---
title: MySQL 使用技巧
description: 常用 MySQL 命令行技巧：执行 SQL、导入脚本、导出 CSV、查看建表语句、宽表查看与执行计划。
---

# MySQL 使用技巧

> 这篇不展开讲太多原理，重点放在日常开发里真正会复制粘贴的命令。适合临时查数据、导数、看表结构、执行脚本时快速翻一眼。

## 直接执行一条 SQL

适合脚本、排查、临时查看变量。

```bash
mysql -h127.0.0.1 -P3306 -uroot -p mydb -e "SELECT NOW(), @@hostname, @@version;"
```

常见参数：

- `-e`：直接执行后退出
- `-p`：提示输入密码
- `-N`：不输出列名，适合脚本处理
- `--table`：强制以表格形式输出结果

## 导入 SQL 文件

批量执行初始化脚本、DDL、补数据脚本时最常用。

```bash
mysql -h127.0.0.1 -P3306 -uroot -p mydb < /path/init.sql
```

如果你已经进入 `mysql` 交互终端，也可以直接执行：

```sql
source /path/init.sql;
```

`source` 是 `mysql` 客户端命令，不是 SQL 语句。

## 导出查询结果为 CSV

### 方式一：服务端导出，最稳妥

这是最标准的 CSV 导出方式，适合正式导数。

```bash
mysql -h127.0.0.1 -P3306 -uroot -p mydb -e "
SELECT id, name, email
FROM users
WHERE created_at >= '2026-01-01'
INTO OUTFILE '/var/lib/mysql-files/users.csv'
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '\"'
LINES TERMINATED BY '\n';
"
```

使用前要注意：

- 文件写在 MySQL 服务端机器上，不是当前执行命令的客户端机器
- 目录通常受 `secure_file_priv` 限制，先执行 `SHOW VARIABLES LIKE 'secure_file_priv';`
- 需要有 `FILE` 权限
- 目标文件不能已存在，否则会报错

### 方式二：客户端快速导出，适合临时用

如果只是临时导数据，或者没有 `FILE` 权限、不方便写服务端目录，可以让 `mysql` 先按制表符输出，再转成逗号分隔。

```bash
mysql -h127.0.0.1 -P3306 -uroot -p --batch --raw mydb -e \
"SELECT id, name, email FROM users WHERE created_at >= '2026-01-01'" \
| sed $'s/\t/,/g' > users.csv
```

按天、按站点汇总优惠券使用量时，也可以直接这么导：

```bash
mysql -h <host> -P <port> -u <user> -p<password> <database> \
  --default-character-set=utf8mb4 \
  -e "
SELECT
  DATE(created_at)  AS day,
  site_id,
  site_name,
  COUNT(coupon_id)  AS coupon_use_cnt,
  SUM(coupon_money) AS coupon_use_amount_fen
FROM \`order\`
WHERE status = 3 AND payed > 0
  AND coupon_id IS NOT NULL
GROUP BY DATE(created_at), site_id, site_name
ORDER BY day, site_id;
" | sed 's/\t/,/g' > /tmp/coupon_use_by_day_site.csv
```

使用这个办法时注意：

- `-p<password>` 中间不能有空格；但这种写法会暴露密码，正式环境更建议只写 `-p` 后手工输入，或用 `~/.my.cnf`
- 默认会把列名一起导出；如果不想要表头，可以加 `-N`
- 这个方法本质上是把 TSV 粗略转成 CSV，只适合字段里不含逗号、制表符、换行的简单场景
- 要做严格 CSV，优先用 `INTO OUTFILE`

## 只导出表结构或数据

排查线上表结构、做最小化备份、发给同事复现问题时很方便。

```bash
# 只导出表结构
mysqldump -h127.0.0.1 -P3306 -uroot -p -d mydb users > users.schema.sql

# 只导出数据，不导出建表语句
mysqldump -h127.0.0.1 -P3306 -uroot -p --no-create-info mydb users > users.data.sql
```

## 查看建表语句

确认索引、字符集、引擎、主键定义时，`SHOW CREATE TABLE` 最直接。

```sql
SHOW CREATE TABLE users\G
```

`\G` 会把结果按纵向展开，宽表结构比普通表格更容易看。

## 宽表结果按纵向查看

字段很多时，用 `\G` 比默认表格输出更清楚。

```sql
SELECT * FROM users WHERE id = 1001\G
```

如果你在 `mysql` 终端里经常看宽表，也可以临时打开分页器：

```sql
pager less -SFX
SELECT * FROM users LIMIT 20;
nopager
```

## 临时记录终端输出

排查问题时，想把 SQL 和结果一起留档，可以用 `tee`。

```sql
tee /tmp/mysql-session.log
SELECT NOW();
SHOW PROCESSLIST;
notee
```

## 看执行计划

排查慢 SQL 时，先看执行计划，不要直接靠感觉改索引。

```sql
EXPLAIN SELECT id, name FROM users WHERE created_at >= '2026-01-01';
```

如果是 MySQL 8.0.18 及以上，可以直接看实际执行信息：

```sql
EXPLAIN ANALYZE SELECT id, name FROM users WHERE created_at >= '2026-01-01';
```

---

## 继续阅读

- [查询优化](./sql-optimization.md)
- [快速拷表](./41-fastest-table-copy.md#导出csv文件)
- [返回 MySQL 专题总览](./index.md)
