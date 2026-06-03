# scenic-dh 鉴权策略

版本 1.0.0 ｜ MVP 阶段占位方案

## 三层鉴权

| 层级 | Token | Header | 用途 |
|------|-------|--------|------|
| 游客会话 | `sess-<uuid>` | `Authorization: Bearer sess-xxx` | 创建 session 时下发，访问自身数据 |
| 内部服务 | `svc-dev-token` | `Authorization: Bearer svc-dev-token` | 服务间调用（business↔RAG↔avatar↔fay） |
| 运营管理 | `adm-dev-token` | `Authorization: Bearer adm-dev-token` | 管理端操作（admin-api 全部写操作） |

## MVP 阶段（当前）

- 游客：匿名 session，无真实用户认证
- 内部：固定 token，环境变量注入，全信任模式
- 管理：固定 token，单用户模式

## 赛前固化计划

1. 内部服务 token → JWT 签名，含 `iss`/`aud`/`exp`
2. 管理 token → 对接真实账号体系（或至少支持多 key）
3. 游客 → 保持匿名 session，增加签名防篡改
4. 所有 token 支持轮换，旧 token 有 5 分钟过渡期

## 安全边界

- `/health` 端点无需鉴权
- `/docs` / `/redoc` 仅在 DEBUG=true 时暴露
- 内部接口（`/internal/` 前缀）仅接受内部服务 token
- 管理接口仅接受管理 token
- 游客只能访问自己 session 的数据（当前未强制校验）
