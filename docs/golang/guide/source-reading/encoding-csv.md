---
title: encoding/csv 源码精读
description: 精读 encoding/csv 的流式读写机制，掌握大文件处理、自定义分隔符、带 BOM 的 UTF-8 与内存安全的最佳实践。
---

# encoding/csv：CSV 处理源码精读

> 核心源码：`src/encoding/csv/reader.go`、`src/encoding/csv/writer.go`

## 包结构图

```
encoding/csv 核心结构
══════════════════════════════════════════════════════════════════

  Reader（解析）
  ├── csv.NewReader(r io.Reader)  ← 创建读取器
  ├── r.Read() ([]string, error)  ← 读一行（[]string）
  ├── r.ReadAll() ([][]string, error) ← 读全部（慎用大文件）
  │
  ├── 配置字段：
  ├── r.Comma        rune    ← 分隔符（默认 ','）
  ├── r.Comment      rune    ← 注释行首字符（默认不启用）
  ├── r.FieldsPerRecord int  ← 每行期望字段数（-1=不检查）
  ├── r.LazyQuotes   bool   ← 宽松引号处理
  ├── r.TrimLeadingSpace bool ← 去除字段前导空格
  └── r.ReuseRecord  bool   ← 复用 slice（大文件性能优化）

  Writer（生成）
  ├── csv.NewWriter(w io.Writer) ← 创建写入器
  ├── w.Write(record []string)   ← 写一行（自动加引号/转义）
  ├── w.WriteAll(records [][]string) ← 写全部
  ├── w.Flush()                  ← 刷新缓冲（必须调用！）
  ├── w.Error() error            ← 检查 Flush 后的错误
  └── w.Comma rune               ← 分隔符（默认 ','）

  CSV 标准（RFC 4180）：
  ├── 字段含 , 或 " 或换行 → 用双引号包围
  ├── 字段内的 " → 用 "" 转义
  ├── 行结尾：CRLF（\r\n）或 LF（\n）
  └── 第一行可选为 header

══════════════════════════════════════════════════════════════════
```

---

## 一、Reader 核心实现

```go
// src/encoding/csv/reader.go（简化）
type Reader struct {
    Comma            rune   // 分隔符
    Comment          rune   // 注释字符
    FieldsPerRecord  int    // 期望字段数
    LazyQuotes       bool   // 宽松引号
    TrimLeadingSpace bool   // 去前导空格
    ReuseRecord      bool   // 复用底层 slice（节省内存）

    r        *bufio.Reader
    numLine  int
    offset   int64
    rawBuffer []byte
    recordBuffer []byte   // 字段值缓冲
    fieldIndexes []int    // 字段边界
    lastRecord   []string // ReuseRecord=true 时复用
}

func (r *Reader) Read() (record []string, err error) {
    // 跳过注释行和空行
    // 解析字段：处理引号、转义、多行字段
    // ReuseRecord：直接返回内部 slice（调用者不能持有）
}
```

---

## 二、代码示例

### 基础读取

```go
// 读取 CSV 字符串
data := `name,age,city
Alice,30,Beijing
Bob,25,Shanghai
Charlie,35,Guangzhou`

r := csv.NewReader(strings.NewReader(data))

// 读取并跳过 header
header, _ := r.Read()
fmt.Println("字段:", header) // [name age city]

// 逐行读取
for {
    record, err := r.Read()
    if err == io.EOF {
        break
    }
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("姓名: %s, 年龄: %s, 城市: %s\n",
        record[0], record[1], record[2])
}
```

### 大文件流式处理（ReuseRecord 优化）

```go
func processLargeCSV(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()

    r := csv.NewReader(bufio.NewReaderSize(f, 64*1024))
    r.ReuseRecord = true  // ← 关键：复用 []string，大文件显著减少 GC

    // 跳过 header
    if _, err := r.Read(); err != nil {
        return err
    }

    var count int
    for {
        record, err := r.Read()
        if err == io.EOF {
            break
        }
        if err != nil {
            // 跳过错误行继续处理
            if _, ok := err.(*csv.ParseError); ok {
                log.Printf("第 %d 行解析错误: %v", r.InputOffset(), err)
                continue
            }
            return err
        }

        // ⚠️ ReuseRecord=true 时不能持有 record 引用！
        // 需要保存时必须 copy
        process(record[0], record[1]) // 直接使用，不存储
        count++
    }
    fmt.Printf("处理完成: %d 行\n", count)
    return nil
}
```

### 映射到结构体

```go
type Employee struct {
    Name   string
    Age    int
    Salary float64
    Active bool
}

func parseEmployees(r io.Reader) ([]Employee, error) {
    reader := csv.NewReader(r)
    reader.TrimLeadingSpace = true

    // 读取 header，建立字段→索引映射
    header, err := reader.Read()
    if err != nil {
        return nil, err
    }
    colIndex := make(map[string]int, len(header))
    for i, col := range header {
        colIndex[strings.ToLower(col)] = i
    }

    var employees []Employee
    for {
        record, err := reader.Read()
        if err == io.EOF {
            break
        }
        if err != nil {
            return nil, err
        }

        age, _ := strconv.Atoi(record[colIndex["age"]])
        salary, _ := strconv.ParseFloat(record[colIndex["salary"]], 64)
        active, _ := strconv.ParseBool(record[colIndex["active"]])

        employees = append(employees, Employee{
            Name:   record[colIndex["name"]],
            Age:    age,
            Salary: salary,
            Active: active,
        })
    }
    return employees, nil
}
```

### 写入 CSV

```go
func writeCSV(w io.Writer, records [][]string) error {
    cw := csv.NewWriter(w)
    cw.Comma = ','  // 默认，可改为 '\t' 生成 TSV

    // 写 header
    if err := cw.Write([]string{"name", "age", "city"}); err != nil {
        return err
    }

    // 批量写入
    if err := cw.WriteAll(records); err != nil {
        return err
    }

    cw.Flush()
    return cw.Error() // Flush 后检查错误
}

// 写入文件（带 BOM，兼容 Excel 打开中文）
func writeCSVWithBOM(path string, records [][]string) error {
    f, err := os.Create(path)
    if err != nil {
        return err
    }
    defer f.Close()

    // UTF-8 BOM：让 Excel 正确识别中文
    f.Write([]byte{0xEF, 0xBB, 0xBF})

    cw := csv.NewWriter(f)
    cw.WriteAll(records)
    cw.Flush()
    return cw.Error()
}
```

### 处理带 BOM 的 CSV（读取 Excel 导出文件）

```go
func newCSVReaderSkipBOM(r io.Reader) *csv.Reader {
    br := bufio.NewReader(r)
    // 检测并跳过 UTF-8 BOM（0xEF 0xBB 0xBF）
    if b, err := br.Peek(3); err == nil &&
        b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF {
        br.Discard(3)
    }
    return csv.NewReader(br)
}
```

### TSV（Tab 分隔）和自定义分隔符

```go
// TSV 读取
r := csv.NewReader(strings.NewReader("a\tb\tc\n1\t2\t3"))
r.Comma = '\t'

// 管道分隔（|）
r2 := csv.NewReader(strings.NewReader("a|b|c\n1|2|3"))
r2.Comma = '|'

// 忽略注释行（以 # 开头）
r3 := csv.NewReader(data)
r3.Comment = '#'

// 允许行字段数不一致（默认要求所有行字段数相同）
r4 := csv.NewReader(data)
r4.FieldsPerRecord = -1
```

### HTTP 流式输出 CSV（大数据导出）

```go
func exportHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "text/csv; charset=utf-8")
    w.Header().Set("Content-Disposition", `attachment; filename="export.csv"`)

    // UTF-8 BOM for Excel
    w.Write([]byte{0xEF, 0xBB, 0xBF})

    cw := csv.NewWriter(w)
    cw.Write([]string{"ID", "姓名", "邮箱", "注册时间"})

    // 流式从数据库读取，避免全量加载
    rows, _ := db.QueryContext(r.Context(), "SELECT id,name,email,created_at FROM users")
    defer rows.Close()

    for rows.Next() {
        var id int
        var name, email string
        var createdAt time.Time
        rows.Scan(&id, &name, &email, &createdAt)

        cw.Write([]string{
            strconv.Itoa(id),
            name,
            email,
            createdAt.Format("2006-01-02"),
        })

        // 定期 Flush，避免客户端长时间等待
        if id%100 == 0 {
            cw.Flush()
        }
    }
    cw.Flush()
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| ReuseRecord 的作用和使用限制？ | 复用底层 `[]string`，减少 GC 压力；但每次 Read 后 record 内容会被覆盖，不能持有引用 |
| CSV 字段含逗号或引号如何处理？ | 自动用双引号包围字段；字段内的 `"` 转义为 `""`（RFC 4180）|
| Writer.Flush 和 Writer.Error 为什么要配合使用？ | Flush 将缓冲写入底层 Writer；Write 错误延迟到 Flush 后通过 Error() 报告 |
| 如何让 Excel 正确打开中文 CSV？ | 写入 UTF-8 BOM（0xEF 0xBB 0xBF）；读取时也需跳过 BOM |
| FieldsPerRecord 设为 -1 的意义？ | 允许每行字段数不同（默认：以第一行为准，不一致则报错）|
| 大文件 CSV 如何避免 OOM？ | 逐行 Read 而非 ReadAll；搭配 ReuseRecord=true；流式写出时定期 Flush |
