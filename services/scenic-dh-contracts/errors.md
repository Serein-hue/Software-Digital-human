# scenic-dh 统一错误码

所有服务使用同一套错误码。响应 body 必须包含 `code`（string）和 `error` 对象。

## 响应格式

```json
{
  "success": false,
  "code": "SPOT_NOT_FOUND",
  "error": {
    "type": "NOT_FOUND",
    "message": "景点 LS-099 不存在",
    "detail": null
  },
  "traceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-06-02T10:30:00Z"
}
```

## 错误码表

| code | HTTP | type | 说明 |
|------|------|------|------|
| VALIDATION_ERROR | 400 | INVALID_REQUEST | 请求参数校验失败 |
| MISSING_REQUIRED_FIELD | 400 | INVALID_REQUEST | 必填字段缺失 |
| INVALID_FORMAT | 400 | INVALID_REQUEST | 字段格式错误 |
| AUTH_MISSING | 401 | AUTH | 缺少鉴权头 |
| AUTH_INVALID | 401 | AUTH | 鉴权令牌无效 |
| AUTH_EXPIRED | 401 | AUTH | 鉴权令牌过期 |
| FORBIDDEN | 403 | AUTH | 无权限 |
| NOT_FOUND | 404 | NOT_FOUND | 资源不存在 |
| SPOT_NOT_FOUND | 404 | NOT_FOUND | 景点不存在 |
| ROUTE_NOT_FOUND | 404 | NOT_FOUND | 路线不存在 |
| SESSION_NOT_FOUND | 404 | NOT_FOUND | 会话不存在 |
| MESSAGE_NOT_FOUND | 404 | NOT_FOUND | 消息不存在 |
| CONFLICT | 409 | CONFLICT | 资源冲突 |
| SESSION_EXPIRED | 410 | GONE | 会话已过期 |
| RATE_LIMITED | 429 | RATE_LIMIT | 请求频率超限 |
| INTERNAL_ERROR | 500 | INTERNAL | 内部服务错误 |
| SERVICE_UNAVAILABLE | 503 | UNAVAILABLE | 服务不可用 |
| UPSTREAM_TIMEOUT | 504 | TIMEOUT | 上游服务超时 |
| RAG_TIMEOUT | 504 | TIMEOUT | RAG 检索超时 |
| FAY_OFFLINE | 503 | UNAVAILABLE | Fay 运行时离线 |
| FAY_TTS_FAILED | 502 | UPSTREAM | Fay TTS 合成失败 |
| FALLBACK_REQUIRED | 200 | FALLBACK | 无可用事实引用，触发降级 |
| LOW_CONFIDENCE | 200 | FALLBACK | RAG 置信度过低，返回兜底话术 |

## 特殊说明

- `FALLBACK_REQUIRED` 和 `LOW_CONFIDENCE` 返回 HTTP 200，但标记降级状态。数字人端以此决定播报兜底话术。
- 所有 `5xx` 类错误应自动触发调用方重试（最多 3 次，指数退避）。
- `traceId` 必须贯穿整条调用链：前端 → business-api → rag-service → avatar-orchestrator → fay-runtime。
