# scenic-dh-contracts

智慧景区数字人平台 — 统一契约仓库。所有服务以本仓库为唯一交接面。

## 文件

| 文件 | 用途 |
|------|------|
| `openapi.yaml` | OpenAPI 3.0 规范，定义所有服务的端点、请求体、响应格式 |
| `errors.md` | 统一错误码表与错误响应格式 |
| `dto_examples.json` | 典型响应示例、鉴权头、数据标记规范 |

## 服务

| 服务 | 端口 | 负责人 |
|------|------|--------|
| scenic-dh-business-api | 8001 | 接口负责人 |
| scenic-dh-admin-api | 8002 | 接口负责人 |
| scenic-dh-rag-service | 8003 | RAG 负责人 |
| scenic-dh-avatar-orchestrator | 8004 | 数字人负责人 |
| scenic-dh-fay-runtime | 8005 | 数字人负责人 |
| scenic-dh-demo-mock-service | 8006 | 接口负责人 |

## 三条铁律

1. **所有成功响应必须包 `ResponseEnvelope`**：`{ success, data, traceId, timestamp }`
2. **所有错误必须使用统一错误码**：见 `errors.md`，不得自定义 HTTP 裸码
3. **所有数据必须标记来源**：`source`（public_demo_package / manual_seed / mock / official）+ `freshnessLevel`（high / medium / low / static）

## 鉴权

| 场景 | Header | 说明 |
|------|--------|------|
| 服务间调用 | `x-service-token` | 内部服务间使用 |
| 运营管理 | `x-admin-token` | 管理端操作 |
| 游客会话 | `x-session-token` | 创建 session 时下发 |

## 事件命名

所有跨服务事件使用统一前缀 `scenic.dh.<domain>.<verb>`：

```
scenic.dh.avatar.speech.started
scenic.dh.avatar.speech.finished
scenic.dh.avatar.fallback.triggered
scenic.dh.avatar.state.changed
scenic.dh.session.created
scenic.dh.arrival.arrived
```

## 修改流程

1. 接口负责人在此仓库发起变更
2. RAG 负责人、数字人负责人确认字段无歧义
3. 合并后各服务同步更新 own openapi spec

## 版本

当前 `v1.0.0` — 阶段 0，契约冻结前可调整。冻结后所有 change 走 semver。
