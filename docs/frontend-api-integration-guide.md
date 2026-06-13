# 游客端前端 → business-api 接口对接指南

## 基本信息

| 项目 | 值 |
|------|-----|
| 基准 URL（开发） | `http://localhost:8001/v1` |
| 基准 URL（生产） | 由环境变量 `VITE_SERVER_BASEURL` 配置 |
| 响应格式 | `{ code: 0, message: "success", data: {...}, trace_id: "..." }` |
| 鉴权 | 游客端无需鉴权（匿名 session） |

请求拦截器已配置好（`interceptor.ts` + `env`），只需在页面里调用 `http.get()` / `http.post()` 即可，base URL 会自动拼接。

---

## 一、首页数据

队友当前：`guide-data.ts` 里的 3 个景点写死 + 4 个 routeSteps 写死

### ① 景点列表
```typescript
// 替换 guide-data.ts import，调接口获取
import { httpGet } from '@/http/http'

// 获取所有景点
const res = await httpGet('/spots', { limit: 20 })
// res = SpotItem[] ← 展开 data 后的数组
```

**请求**: `GET /v1/spots?limit=20`

**响应 data**:
```json
{
  "items": [
    {
      "id": "LS-001",
      "name": "灵山大佛",
      "summary": "高 88 米的青铜释迦牟尼立像...",
      "tags": ["佛教文化", "标志性建筑", "必游"],
      "location": "景区中轴线北端"
    }
  ],
  "pagination": { "page": 1, "page_size": 20, "total": 16 }
}
```

**建议**: 首页只展示前 3-5 个推荐景点，用 `limit=3` 限制。

### ② 公告
**请求**: `GET /v1/notices`

**响应 data**:
```json
{
  "items": [
    { "id": "NT-001", "type": "info", "title": "梵宫内部修缮通知", "content": "...", "active": true }
  ]
}
```

### ③ 活动/演出
**请求**: `GET /v1/events`

**响应 data**:
```json
{
  "items": [
    { "id": "EV-001", "name": "九龙灌浴表演", "spotId": "LS-003", "time": "每日 10:00, 14:00, 16:00", "description": "大型音乐喷泉表演" }
  ]
}
```

---

## 二、景点详情页

队友当前：`spots.vue` 和 `spot-detail` 使用本地数据

### ④ 景点详情
```typescript
const res = await httpGet('/spots/LS-001')
```

**请求**: `GET /v1/spots/{spot_id}`

**响应 data**: 包含 `name`, `summary`, `intro`, `tags`, `highlights`, `location` 等

### ⑤ 景点讲解词
```typescript
const res = await httpGet('/spots/LS-001/guide')
```

**请求**: `GET /v1/spots/{spot_id}/guide`

**响应 data**:
```json
{
  "spotId": "LS-001",
  "shortText": "灵山大佛",
  "briefText": "灵山大佛高88米...",
  "longText": "灵山大佛高88米，加上基座总高达101.5米...",
  "fallbackText": "灵山大佛是灵山胜境的标志..."
}
```

---

## 三、路线页

队友当前：`route.vue` 里 3 条路线写死

### ⑥ 路线列表
```typescript
const res = await httpGet('/routes')
// res = { items: [...], total: 3 }
```

**请求**: `GET /v1/routes`

**响应 data**:
```json
{
  "items": [
    {
      "id": "RT-001",
      "name": "历史文化深度游",
      "type": "culture",
      "duration": "约 6 小时",
      "persona": "对佛教文化和历史感兴趣的游客",
      "stops": [
        { "order": 1, "spotId": "LS-006", "spotName": "阿育王柱", "stayDuration": "15 分钟", "description": "..." }
      ]
    }
  ]
}
```

### ⑦ 路线规划（按偏好推荐）
```typescript
const res = await httpPost('/routes/plan', { interests: ['亲子'], duration: '4' })
// res = { route: {...}, reason: "根据您的偏好推荐..." }
```

**请求**: `POST /v1/routes/plan`
```json
{ "interests": ["亲子"], "duration": "4" }
```

---

## 四、AI 问答

队友当前：`ask.vue` 里本地 mock 回复，没有实际 API 调用

需要两步：

### ⑧ 创建会话（首次使用）
```typescript
const sessionRes = await httpPost('/sessions', {
  source: 'miniprogram',
  language: 'zh'
})
const sessionId = sessionRes.sessionId // ← 存下来，后续请求都要用
```

**请求**: `POST /v1/sessions`
```json
{ "source": "miniprogram", "language": "zh" }
```

### ⑨ 发送消息 → 获取 AI 回答
```typescript
// 1. 存用户消息
await httpPost(`/sessions/${sessionId}/messages`, {
  role: 'user',
  text: '灵山大佛有多高？'
})

// 2. 调 RAG 获取答案
const ragRes = await httpPost('/rag/query', {
  query: '灵山大佛有多高？',
  top_k: 3
})

// ragRes 结构：
// {
//   answerable: true,
//   contexts: [{ text: "灵山大佛高88米...", score: 0.85 }],
//   citations: [{ quote: "灵山大佛高88米...", doc_id: "..." }],
//   fallback: null
// }

// 3. 存 AI 回复（带引用）
await httpPost(`/sessions/${sessionId}/messages`, {
  role: 'assistant',
  text: ragRes.contexts[0]?.text || '抱歉，暂无相关信息',
  citations: ragRes.citations || [],
  confidence: ragRes.contexts[0]?.score,
  fallback: !ragRes.answerable,
  fallbackReason: ragRes.fallback?.reason
})

// 4. 渲染聊天气泡
messages.value.push(
  { role: 'visitor', text: '灵山大佛有多高？' },
  { role: 'guide', text: ragRes.contexts[0]?.text, citations: ragRes.citations }
)
```

### ⑩ 获取历史消息
```typescript
const res = await httpGet(`/sessions/${sessionId}/messages`, { limit: 50 })
// res = { messages: [{ role, text, citations, createdAt }] }
```

---

## 五、服务设施页

队友当前：`facilities.vue` 使用 `guide-data.ts` 的 4 个设施

### ⑪ 服务设施列表
```typescript
const res = await httpGet('/services')
// res = { items: [{ id, category, name, location }] }
```

**请求**: `GET /v1/services`

分类筛选: `GET /v1/services?category=toilet` （可选值: `toilet` / `restaurant` / `parking` / `help_point`）

---

## 六、演出活动页

队友当前：`shows.vue` 3 条演出写死

**⑫ 直接用上面的 `GET /v1/events`**

```typescript
const res = await httpGet('/events')
events.value = res.items.map(ev => ({
  name: ev.name,
  time: ev.time,  // "每日 10:00, 14:00, 16:00"
  place: ev.spotId,  // 可以再调 GET /v1/spots/{spotId} 获取名称
  status: '建议提前 15 分钟到'
}))
```

---

## 七、票务页

队友当前：`ticket.vue` 硬编码 "2 张成人票 · 订单号 202606030018"

### ⑬ 票种展示
```typescript
const res = await httpGet('/tickets/products')
// res = { items: [{ id:"TK-001", name:"灵山胜境成人票", price:210, status:"available" }] }
```

### ⑭ 票码核验（只读）
```typescript
const res = await httpPost('/tickets/verify', {
  ticket_code: '用户输入的票码',
  order_id: '订单号（可选）'
})
// 返回: { status: "valid", ticketNames: [...], disclaimer: "此为票务信息查询..." }
```

---

## 八、地图 POI（后续补充）

如有地图页面，使用：

```typescript
// 获取所有 POI 点位
const pois = await httpGet('/map/pois')
// 获取图层配置
const layers = await httpGet('/map/layers')
```

---

## 九、完整页面改造示例

### 以 `index.vue` 首页为例

**改造前**（本地数据）:
```typescript
import { spots, routeSteps } from '../shared/guide-data'
// 直接用 spots 渲染
```

**改造后**（调 API）:
```typescript
import { ref, onMounted } from 'vue'
import { httpGet } from '@/http/http'

const spots = ref([])
const notices = ref([])
const events = ref([])

onMounted(async () => {
  try {
    const spotRes = await httpGet('/spots', { limit: 3 })
    spots.value = spotRes.items.map(s => ({
      id: s.id,
      name: s.name,
      tag: s.tags?.[0] || '推荐',
      time: s.summary?.slice(0, 20) || '',
      desc: s.summary || '',
      tip: s.highlights?.[0] || '',
    }))
    
    const noticeRes = await httpGet('/notices')
    notices.value = noticeRes.items.filter(n => n.active)
    
    const eventRes = await httpGet('/events')
    events.value = eventRes.items
  } catch (e) {
    console.error('API error', e)
  }
})
```

**`.env.development` 配置**（确保你的本地环境）:
```
VITE_SERVER_BASEURL = 'http://localhost:8001/v1'
```

---

## 十、接口清单速查

| # | 功能 | 方法 | 路径 | 队友页面 |
|---|------|------|------|---------|
| ① | 景点列表 | GET | `/spots` | index, spots |
| ② | 景点详情 | GET | `/spots/{id}` | spot-detail |
| ③ | 景点讲解词 | GET | `/spots/{id}/guide` | audio, spot-detail |
| ④ | 路线列表 | GET | `/routes` | route |
| ⑤ | 路线规划 | POST | `/routes/plan` | route |
| ⑥ | 公告 | GET | `/notices` | index |
| ⑦ | 活动/演出 | GET | `/events` | shows, index |
| ⑧ | 服务设施 | GET | `/services` | facilities |
| ⑨ | 票种 | GET | `/tickets/products` | ticket |
| ⑩ | 票码核验 | POST | `/tickets/verify` | ticket |
| ⑪ | 创建会话 | POST | `/sessions` | ask |
| ⑫ | 发消息 | POST | `/sessions/{id}/messages` | ask |
| ⑬ | 查消息 | GET | `/sessions/{id}/messages` | history |
| ⑭ | RAG 问答 | POST | `/rag/query` | ask |
| ⑮ | 地图 POI | GET | `/map/pois` | （新页面） |
| ⑯ | 排队资源 | GET | `/queues` | （新页面） |
| ⑰ | 取号 | POST | `/queue/tickets` | （新页面） |
| ⑱ | 创建工单 | POST | `/work-orders` | feedback |
| ⑲ | 应急求助 | POST | `/emergency/requests` | SOS |
| ⑳ | 离线包 | GET | `/offline-packages/latest` | 离线缓存 |

---

> **启动方式**:
> ```bash
> # 终端 1: 启动 business-api
> cd services/scenic-dh-business-api
> PYTHONIOENCODING=utf-8 py -m uvicorn app.main:app --host 0.0.0.0 --port 8001
> 
> # 终端 2: 启动队友前端
> cd softwarecup2026-a5-user
> pnpm dev:h5
> ```
