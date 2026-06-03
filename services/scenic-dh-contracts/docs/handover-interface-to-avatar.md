# H-06: 接口 → 数字人 交接文档

> 供数字人负责人（avatar-orchestrator）对接使用

## 服务地址

| 服务 | 地址 |
|------|------|
| business-api | `http://localhost:8001` |
| admin-api | `http://localhost:8002` |
| demo-mock | `http://localhost:8006` |

## 鉴权

所有请求带 `Authorization: Bearer svc-dev-token`

## 统一响应

```json
{"code": 0, "message": "success", "data": {...}, "trace_id": "trace_xxx"}
```

---

## 1. 创建/查询会话

```
POST /v1/sessions
GET  /v1/sessions/{id}
PATCH /v1/sessions/{id}
```

**创建请求：**
```json
{
  "source": "miniprogram",
  "language": "zh",
  "profile": {"interests": ["佛教文化"], "groupSize": 2}
}
```

**响应 data：**
```json
{
  "id": "uuid",
  "profile": {"language": "zh", "interests": [...]},
  "currentSpotId": null,
  "status": "active",
  "createdAt": "ISO8601"
}
```

---

## 2. 记录问答消息

```
POST /v1/sessions/{id}/messages
GET  /v1/sessions/{id}/messages
```

**请求：**
```json
{
  "role": "user",
  "text": "灵山大佛有多高？"
}
```

**assistant 消息（播报后记录）：**
```json
{
  "role": "assistant",
  "text": "灵山大佛高88米...",
  "citations": [{"sourceName": "景点结构化数据集", "chunkId": "xxx", "confidence": 0.95}],
  "confidence": 0.95,
  "fallback": false,
  "speechState": "done",
  "durationMs": 8000
}
```

`speechState` 值: `queued | speaking | done | failed | interrupted`

---

## 3. 到达事件

```
POST /v1/sessions/{id}/arrival-events
GET  /v1/sessions/{id}/arrival-events
```

**请求：**
```json
{
  "spotId": "LS-001",
  "location": {"lat": 31.422, "lng": 120.105},
  "trigger": "lbs"
}
```

`trigger`: `lbs | manual | demo`

---

## 4. 结构化上下文（内部接口）

```
POST /internal/v1/context/query
```

**请求：**
```json
{
  "intent": "spot_query",
  "spot_id": "LS-001",
  "session_id": "uuid"
}
```

`intent`: `spot_query | route_query | general | arrival`

**响应 data：**
```json
{
  "spot": {"id": "LS-001", "name": "灵山大佛", ...},
  "route": {...},
  "notices": [{"title": "...", "content": "..."}],
  "weather": {"temperature": 26, "weather": "多云"}
}
```

---

## 5. 反馈

```
POST /v1/sessions/{id}/feedback
```

```json
{"rating": 5, "resolved": true, "comment": "讲解很详细", "messageId": "uuid"}
```

---

## 6. 人工播报（管理端触发）

```
POST /v1/broadcasts  (admin-api :8002)
```

```json
{
  "text": "尊敬的游客，九龙灌浴表演即将开始",
  "priority": "high",
  "target": "all"
}
```

`priority`: `low | normal | high | emergency`
`target`: `all | spot | session`

---

## 7. 演示控制

```
POST /v1/demo/reset   (demo-mock :8006)
POST /v1/demo/start
POST /v1/demo/next
GET  /v1/demo/current
```

10 步剧本：创建会话→获取景点→查看详情→推荐路线→到达大佛→提问→追问→到达九龙灌浴→反馈→运营数据

---

## 完整 API 文档

- OpenAPI 规范: `scenic-dh-contracts/openapi.yaml`
- 错误码: `scenic-dh-contracts/errors.md`
- Postman 联调包: `scenic-dh-contracts/collections/scenic-dh.postman.json`
