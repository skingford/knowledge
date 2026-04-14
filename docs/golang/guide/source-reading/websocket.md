---
title: WebSocket 实现源码精读
description: 精读 net/http WebSocket 升级机制，掌握帧协议解析、gorilla/websocket 高并发模式、广播 Hub、心跳检测与生产级 WebSocket 服务最佳实践。
---

# WebSocket：源码精读

> 核心包：`net/http`（协议升级）、`github.com/gorilla/websocket`
>
> 图例参考：
> - `GoNetworkDiagram`：`websocket-hub-flow`

## 包结构图

```
WebSocket 体系
══════════════════════════════════════════════════════════════════

  WebSocket 握手（HTTP Upgrade）：
  Client → GET /ws HTTP/1.1
           Upgrade: websocket
           Connection: Upgrade
           Sec-WebSocket-Key: <base64(16字节随机数)>
           Sec-WebSocket-Version: 13
  Server → HTTP/1.1 101 Switching Protocols
           Upgrade: websocket
           Connection: Upgrade
           Sec-WebSocket-Accept: <base64(SHA1(key + GUID))>

  WebSocket 帧格式：
  ┌──────┬──────┬────────┬─────────────┬─────────┐
  │FIN(1)│RSV(3)│OpCode(4)│MASK(1)+Len │ Payload │
  └──────┴──────┴────────┴─────────────┴─────────┘
  OpCode: 0x1=文本 0x2=二进制 0x8=关闭 0x9=Ping 0xA=Pong

  gorilla/websocket 核心：
  ├── Upgrader.Upgrade(w, r, header) → *Conn
  ├── conn.ReadMessage() → (msgType, data, err)
  ├── conn.WriteMessage(msgType, data) → error
  ├── conn.SetPingHandler / SetPongHandler
  ├── conn.SetReadDeadline / SetWriteDeadline
  └── conn.Close()

  广播 Hub 模式（生产推荐）：
  Client → register chan → Hub → broadcast chan → Clients
  Client → unregister chan ↗

══════════════════════════════════════════════════════════════════
```

<GoNetworkDiagram kind="websocket-hub-flow" />

---

## 一、核心实现

::: details 点击展开代码：一、核心实现
```go
// WebSocket 升级核心（gorilla/websocket 简化）
// 验证 Origin、设置读写限制、完成 HTTP 101 握手

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    // CheckOrigin：生产中必须验证来源（防 CSRF）
    CheckOrigin: func(r *http.Request) bool {
        origin := r.Header.Get("Origin")
        return origin == "https://myapp.com"
    },
}
```
:::

---

## 二、代码示例

### 基础 Echo 服务器

::: details 点击展开代码：基础 Echo 服务器
```go
import (
    "github.com/gorilla/websocket"
    "net/http"
    "log"
)

func echoHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Printf("upgrade: %v", err)
        return
    }
    defer conn.Close()

    // 设置读取大小限制（防止恶意大消息）
    conn.SetReadLimit(512 * 1024) // 512KB

    for {
        msgType, msg, err := conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err,
                websocket.CloseGoingAway,
                websocket.CloseAbnormalClosure) {
                log.Printf("read error: %v", err)
            }
            break
        }
        // Echo 回去
        if err := conn.WriteMessage(msgType, msg); err != nil {
            log.Printf("write error: %v", err)
            break
        }
    }
}
```
:::

### 广播 Hub（聊天室核心）

::: details 点击展开代码：广播 Hub（聊天室核心）
```go
// 广播 Hub：用 channel 替代锁，避免并发写同一 conn
type Client struct {
    hub  *Hub
    conn *websocket.Conn
    send chan []byte // 发送缓冲（每个 client 独立 goroutine 写）
}

type Hub struct {
    clients    map[*Client]bool
    broadcast  chan []byte
    register   chan *Client
    unregister chan *Client
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*Client]bool),
        broadcast:  make(chan []byte, 256),
        register:   make(chan *Client),
        unregister: make(chan *Client),
    }
}

// Hub 主循环（单 goroutine 管理所有 client，无锁）
func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.clients[client] = true
            log.Printf("Client connected, total: %d", len(h.clients))

        case client := <-h.unregister:
            if _, ok := h.clients[client]; ok {
                delete(h.clients, client)
                close(client.send)
            }

        case msg := <-h.broadcast:
            for client := range h.clients {
                select {
                case client.send <- msg:
                default:
                    // 发送缓冲满（客户端太慢），断开连接
                    close(client.send)
                    delete(h.clients, client)
                }
            }
        }
    }
}

// writePump：每个 client 独立的写 goroutine（gorilla 要求同一连接写操作串行）
func (c *Client) writePump() {
    ticker := time.NewTicker(54 * time.Second) // Ping 间隔
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case msg, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if !ok {
                // Hub 关闭了 send channel
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            w, err := c.conn.NextWriter(websocket.TextMessage)
            if err != nil {
                return
            }
            w.Write(msg)

            // 批量写：将缓冲中剩余消息一起发出（减少系统调用）
            n := len(c.send)
            for i := 0; i < n; i++ {
                w.Write([]byte{'\n'})
                w.Write(<-c.send)
            }
            if err := w.Close(); err != nil {
                return
            }

        case <-ticker.C:
            // 定期发送 Ping（保活）
            c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}

// readPump：每个 client 独立的读 goroutine
func (c *Client) readPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()

    c.conn.SetReadLimit(maxMessageSize) // 512KB
    c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

    // Pong Handler：收到 Pong 后重置读超时
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        return nil
    })

    for {
        _, msg, err := c.conn.ReadMessage()
        if err != nil {
            break
        }
        c.hub.broadcast <- msg
    }
}

// WebSocket 升级入口
func serveWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }

    client := &Client{
        hub:  hub,
        conn: conn,
        send: make(chan []byte, 256),
    }
    hub.register <- client

    go client.writePump()
    go client.readPump()
}
```
:::

### 结构化消息（JSON 协议）

::: details 点击展开代码：结构化消息（JSON 协议）
```go
// 定义消息协议
type WSMessage struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

type ChatMessage struct {
    UserID  string `json:"user_id"`
    Content string `json:"content"`
    At      int64  `json:"at"`
}

// 路由 WebSocket 消息
func handleWSMessage(conn *websocket.Conn, hub *Hub, userID string) {
    for {
        _, raw, err := conn.ReadMessage()
        if err != nil {
            break
        }

        var msg WSMessage
        if err := json.Unmarshal(raw, &msg); err != nil {
            sendError(conn, "invalid message format")
            continue
        }

        switch msg.Type {
        case "chat":
            var chat ChatMessage
            json.Unmarshal(msg.Payload, &chat)
            chat.UserID = userID
            chat.At = time.Now().Unix()

            // 广播给所有人
            data, _ := json.Marshal(WSMessage{
                Type:    "chat",
                Payload: mustMarshal(chat),
            })
            hub.broadcast <- data

        case "typing":
            // 广播正在输入状态
            hub.broadcast <- raw

        default:
            sendError(conn, "unknown message type: "+msg.Type)
        }
    }
}

func sendError(conn *websocket.Conn, msg string) {
    data, _ := json.Marshal(map[string]string{"type": "error", "message": msg})
    conn.WriteMessage(websocket.TextMessage, data)
}

func mustMarshal(v any) json.RawMessage {
    b, _ := json.Marshal(v)
    return b
}
```
:::

### 房间系统（多频道广播）

::: details 点击展开代码：房间系统（多频道广播）
```go
// 支持多个聊天室的 Hub
type RoomHub struct {
    rooms map[string]*Room // roomID → Room
    mu    sync.RWMutex
}

type Room struct {
    id      string
    clients sync.Map // *Client → struct{}
}

func (h *RoomHub) Join(roomID string, client *Client) {
    h.mu.Lock()
    room, ok := h.rooms[roomID]
    if !ok {
        room = &Room{id: roomID}
        h.rooms[roomID] = room
    }
    h.mu.Unlock()
    room.clients.Store(client, struct{}{})
}

func (h *RoomHub) Leave(roomID string, client *Client) {
    h.mu.RLock()
    room, ok := h.rooms[roomID]
    h.mu.RUnlock()
    if ok {
        room.clients.Delete(client)
    }
}

func (h *RoomHub) Broadcast(roomID string, msg []byte) {
    h.mu.RLock()
    room, ok := h.rooms[roomID]
    h.mu.RUnlock()
    if !ok {
        return
    }

    room.clients.Range(func(key, _ any) bool {
        client := key.(*Client)
        select {
        case client.send <- msg:
        default:
            client.conn.Close()
        }
        return true
    })
}
```
:::

---

## 核心要点

| 问题 | 要点 |
|------|------|
| WebSocket 握手过程？ | 客户端发 HTTP Upgrade 请求（含随机 Key）；服务端验证后返回 101 + `Sec-WebSocket-Accept = base64(SHA1(key + magic GUID))`；双向全双工通道建立 |
| gorilla/websocket 为什么不能并发写？ | `conn.WriteMessage` 非并发安全（底层 TCP 写操作必须串行）；生产中每个 client 用独立 writePump goroutine + channel 队列，Hub 把消息投入 channel，由 writePump 串行发送 |
| Hub 为什么用 channel 而不用 mutex？ | Hub 的 register/unregister/broadcast 三种操作通过 channel 排队，由单个 goroutine 处理；避免了锁竞争和死锁；select 语义天然适合多路事件处理 |
| 如何检测僵尸连接（zombie connection）？ | writePump 定期发 Ping；readPump 设置 SetReadDeadline（60s）并在 PongHandler 中重置；超时未收到 Pong 则 ReadMessage 返回 error，触发断开 |
| `conn.SetReadLimit` 的作用？ | 限制单条消息最大字节数（防 OOM 攻击）；超过限制 ReadMessage 返回 error 并关闭连接；生产中应根据业务设置合理上限（如 512KB） |
| 如何优雅关闭 WebSocket 连接？ | 发送 CloseMessage 帧（`websocket.CloseNormalClosure`）→ 等待对端 Close 确认 → 关闭底层 TCP；强制关闭直接 `conn.Close()`，对端读取会收到 CloseAbnormalClosure |
