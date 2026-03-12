---
title: mime/multipart 源码精读
description: 精读 mime/multipart 的多部分报文实现，掌握文件上传解析、大文件流式处理、boundary 分隔与表单字段提取。
---

# mime/multipart：多部分报文源码精读

> 核心源码：`src/mime/multipart/multipart.go`、`src/mime/multipart/formdata.go`

## 包结构图

```
mime/multipart 体系
══════════════════════════════════════════════════════════════════

  Multipart 报文结构（RFC 2046）：
  ┌─────────────────────────────────────────────────────┐
  │  Content-Type: multipart/form-data; boundary=----abc│
  │                                                     │
  │  ------abc                 ← boundary 分隔符        │
  │  Content-Disposition: form-data; name="username"    │
  │                                                     │
  │  alice                     ← 字段值                 │
  │  ------abc                                          │
  │  Content-Disposition: form-data; name="file";       │
  │    filename="photo.jpg"                             │
  │  Content-Type: image/jpeg                           │
  │                                                     │
  │  <二进制数据...>            ← 文件内容              │
  │  ------abc--               ← 结束标志（双破折号）   │
  └─────────────────────────────────────────────────────┘

  核心类型：
  ├── Reader       ← 解析 multipart（读取方向）
  │   ├── NextPart() (*Part, error)           ← 读下一个 Part
  │   └── NextRawPart() (*Part, error)        ← 不解码 Content-Transfer-Encoding
  │
  ├── Part         ← 单个部分（实现 io.Reader）
  │   ├── Header   textproto.MIMEHeader       ← 该部分的头部
  │   └── Read(p []byte) (n int, err error)   ← 流式读取内容
  │
  ├── Writer       ← 构建 multipart（写入方向）
  │   ├── CreatePart(header) (io.Writer, error)
  │   ├── CreateFormFile(fieldname, filename) (io.Writer, error)
  │   ├── CreateFormField(fieldname) (io.Writer, error)
  │   ├── Boundary() string                   ← 返回随机 boundary
  │   └── Close() error                       ← 写结束分隔符
  │
  └── Form         ← 解析后的表单数据
      ├── Value map[string][]string  ← 文本字段
      └── File  map[string][]*FileHeader  ← 文件字段

══════════════════════════════════════════════════════════════════
```

---

## 一、核心实现

```go
// src/mime/multipart/multipart.go（简化）
type Reader struct {
    bufReader *bufio.Reader
    boundary  string
    // dashBoundary = "--" + boundary
    // dashBoundaryDash = "--" + boundary + "--"
}

// NextPart：扫描到下一个 boundary，返回 Part
func (r *Reader) NextPart() (*Part, error) {
    // 1. 跳过当前 Part 剩余内容
    // 2. 读取 boundary 行
    // 3. 检查是否为结束 boundary（带 "--" 后缀）
    // 4. 解析下一个 Part 的头部
    // 5. 返回 Part（惰性读取，调用 Part.Read 才真正读内容）
}

// Part.Read：流式读取内容，遇到 boundary 停止
// 内部用 bufio.Reader 逐行扫描，寻找 boundary 起始标志
```

---

## 二、代码示例

### HTTP 文件上传（服务端解析）

```go
// 解析 multipart/form-data 上传的文件
func uploadHandler(w http.ResponseWriter, r *http.Request) {
    // ParseMultipartForm：内存中最多保留 32MB，超出写磁盘临时文件
    if err := r.ParseMultipartForm(32 << 20); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    // 读取普通字段
    username := r.FormValue("username")
    fmt.Printf("用户名: %s\n", username)

    // 读取文件（单文件）
    file, header, err := r.FormFile("avatar")
    if err != nil {
        http.Error(w, "missing file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    fmt.Printf("文件名: %s, 大小: %d 字节\n", header.Filename, header.Size)
    fmt.Printf("Content-Type: %s\n", header.Header.Get("Content-Type"))

    // 保存到磁盘
    dst, _ := os.Create("/uploads/" + filepath.Base(header.Filename))
    defer dst.Close()
    io.Copy(dst, file)

    // 多文件上传
    for _, fileHeaders := range r.MultipartForm.File {
        for _, fh := range fileHeaders {
            f, _ := fh.Open()
            defer f.Close()
            fmt.Printf("文件: %s (%d bytes)\n", fh.Filename, fh.Size)
        }
    }

    fmt.Fprintf(w, "上传成功")
}
```

### 大文件流式上传（避免内存溢出）

```go
// 不用 ParseMultipartForm，直接流式处理（避免大文件全量加载到内存）
func streamUploadHandler(w http.ResponseWriter, r *http.Request) {
    contentType := r.Header.Get("Content-Type")
    _, params, err := mime.ParseMediaType(contentType)
    if err != nil {
        http.Error(w, "invalid content-type", http.StatusBadRequest)
        return
    }

    boundary, ok := params["boundary"]
    if !ok {
        http.Error(w, "missing boundary", http.StatusBadRequest)
        return
    }

    // 流式读取，不缓存到内存
    mr := multipart.NewReader(r.Body, boundary)
    for {
        part, err := mr.NextPart()
        if err == io.EOF {
            break
        }
        if err != nil {
            http.Error(w, err.Error(), 500)
            return
        }

        formName := part.FormName()
        fileName := part.FileName()

        if fileName != "" {
            // 文件字段：流式写入磁盘
            dst, _ := os.Create("/uploads/" + filepath.Base(fileName))
            written, _ := io.Copy(dst, part)
            dst.Close()
            fmt.Printf("保存文件 %s（%d 字节）\n", fileName, written)
        } else {
            // 普通字段
            value, _ := io.ReadAll(part)
            fmt.Printf("字段 %s = %s\n", formName, value)
        }
    }

    fmt.Fprintln(w, "流式上传完成")
}
```

### HTTP 客户端：发送 multipart 请求

```go
import (
    "bytes"
    "mime/multipart"
    "net/http"
    "os"
)

// 用 multipart.Writer 构建上传请求
func uploadFile(url, fieldName, filePath string) error {
    var buf bytes.Buffer
    writer := multipart.NewWriter(&buf)

    // 添加文件字段
    filePart, err := writer.CreateFormFile(fieldName, filepath.Base(filePath))
    if err != nil {
        return err
    }

    f, err := os.Open(filePath)
    if err != nil {
        return err
    }
    defer f.Close()
    io.Copy(filePart, f)

    // 添加普通字段
    writer.WriteField("description", "上传的文件")
    writer.WriteField("tags", "photo,2024")

    // ⚠️ 必须 Close，写入结束 boundary（--boundary--）
    writer.Close()

    req, _ := http.NewRequest("POST", url, &buf)
    // Content-Type 必须包含 boundary 参数
    req.Header.Set("Content-Type", writer.FormDataContentType())
    // 输出：multipart/form-data; boundary=xxxxxxxxxxxxxxxxxxxx

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    fmt.Printf("响应状态: %d\n", resp.StatusCode)
    return nil
}
```

### 文件类型安全验证

```go
// 安全验证：不信任 Content-Type Header，读取魔数（magic bytes）
var allowedMimeTypes = map[string]bool{
    "image/jpeg": true,
    "image/png":  true,
    "image/gif":  true,
    "application/pdf": true,
}

func validateUpload(part *multipart.Part, maxSize int64) ([]byte, string, error) {
    // 限制读取大小（防止超大文件）
    lr := io.LimitReader(part, maxSize+1)
    data, err := io.ReadAll(lr)
    if err != nil {
        return nil, "", err
    }

    if int64(len(data)) > maxSize {
        return nil, "", fmt.Errorf("文件过大（最大 %d 字节）", maxSize)
    }

    // 用 http.DetectContentType 检测真实类型（读前 512 字节的魔数）
    mimeType := http.DetectContentType(data)
    if !allowedMimeTypes[mimeType] {
        return nil, "", fmt.Errorf("不支持的文件类型: %s", mimeType)
    }

    return data, mimeType, nil
}
```

### 构建 Email MIME（复杂多部分）

```go
// 构建 multipart/mixed 邮件（text + html + 附件）
func buildEmailMIME(textBody, htmlBody string, attachments []string) ([]byte, string) {
    var buf bytes.Buffer
    mixedWriter := multipart.NewWriter(&buf)

    // 写 text/html 替代部分（alternative 子类型）
    altPart, _ := mixedWriter.CreatePart(textproto.MIMEHeader{
        "Content-Type": {fmt.Sprintf("multipart/alternative; boundary=%s",
            "inner-boundary-123")},
    })

    innerWriter := multipart.NewWriter(altPart)

    // 纯文本版本
    textPart, _ := innerWriter.CreatePart(textproto.MIMEHeader{
        "Content-Type": {"text/plain; charset=utf-8"},
    })
    fmt.Fprint(textPart, textBody)

    // HTML 版本
    htmlPart, _ := innerWriter.CreatePart(textproto.MIMEHeader{
        "Content-Type": {"text/html; charset=utf-8"},
    })
    fmt.Fprint(htmlPart, htmlBody)
    innerWriter.Close()

    // 添加附件
    for _, path := range attachments {
        data, _ := os.ReadFile(path)
        attachPart, _ := mixedWriter.CreatePart(textproto.MIMEHeader{
            "Content-Type":              {"application/octet-stream"},
            "Content-Disposition":       {`attachment; filename="` + filepath.Base(path) + `"`},
            "Content-Transfer-Encoding": {"base64"},
        })
        enc := base64.NewEncoder(base64.StdEncoding, attachPart)
        enc.Write(data)
        enc.Close()
    }

    mixedWriter.Close()
    return buf.Bytes(), mixedWriter.FormDataContentType()
}
```

---

## 面试要点

| 问题 | 要点 |
|------|------|
| `ParseMultipartForm` 的 `maxMemory` 参数是什么？ | 内存中最多缓存的字节数（不含文件头）；超出部分写入系统临时目录；`r.MultipartForm.RemoveAll()` 清理临时文件 |
| multipart.Writer.Close() 不调用会怎样？ | 结束 boundary（`--boundary--`）不被写入，接收方无法判断 multipart 是否结束，解析时会报错或挂起 |
| 大文件上传如何避免 OOM？ | 不用 `ParseMultipartForm`，直接用 `multipart.NewReader` 流式读取，每个 Part 用 `io.Copy` 流式写磁盘 |
| 如何防止文件上传漏洞？ | ① 用 `http.DetectContentType` 检测真实 MIME（不信任 Header）② `filepath.Base` 防止路径穿越 ③ `io.LimitReader` 限制大小 ④ 随机化保存文件名 |
| `part.FileName()` 返回空字符串意味着什么？ | 该 Part 是普通表单字段（非文件），只有 `name` 参数没有 `filename` 参数 |
| boundary 字符串有什么要求？ | RFC 2046：最多 70 个字符，不能以空格结尾；`multipart.NewWriter` 自动生成随机 boundary |
