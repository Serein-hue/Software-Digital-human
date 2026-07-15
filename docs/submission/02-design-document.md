# 产品总体设计文档

## 灵山胜境 · AI 数字人导览系统

| 项目 | 内容 |
|------|------|
| 赛题 | 第十五届中国软件杯 A5 — 景区导览服务 AI 数字人 |
| 出题企业 | 锐捷网络（苏州）有限公司 |
| 景区 | 灵山胜境（无锡，国家 5A 级景区，世界佛教论坛永久会址） |
| 版本 | v2.0.0 |
| 最后更新 | 2026-07-14 |

---

## 目录

1. [需求分析](#1-需求分析)
2. [系统架构](#2-系统架构)
3. [技术选型](#3-技术选型)
4. [前端设计](#4-前端设计)
5. [后端设计](#5-后端设计)
6. [API 设计](#6-api-设计)
7. [数据库设计](#7-数据库设计)
8. [AI 模型与 RAG 设计](#8-ai-模型与-rag-设计)
9. [数字人设计](#9-数字人设计)
10. [安全性设计](#10-安全性设计)
11. [测试说明](#11-测试说明)

---

## 1. 需求分析

### 1.1 背景与痛点

当前景区导览服务普遍存在以下问题：

| 痛点 | 具体表现 | 影响范围 |
|------|---------|---------|
| 导游资源稀缺 | 黄金周/旺季专业导游供不应求 | 游客体验大打折扣 |
| 信息单向传递 | 传统录音导览设备内容固定，无法互动 | 无法解答个性化问题 |
| 缺乏情感连接 | 冰冷设备难以提供亲切感和情感互动 | 游客满意度低 |
| 管理盲区 | 难以评估服务质量、获取真实反馈 | 无法优化运营决策 |

### 1.2 实现目标

开发一个具备多模态交互能力（语音、文本、表情）的 AI 数字人导游软件：
1. **游客端**：实时智能问答、个性化路线讲解、情感互动
2. **管理端**：游客反馈分析、知识库管理、数据看板

### 1.3 用户角色

| 角色 | 使用端 | 核心需求 |
|------|--------|---------|
| 游客 | C 端 Web / 微信小程序 | 智能问答、景点讲解、路线推荐、拍照识景 |
| 景区管理员 | B 端管理后台 | 知识库管理、数据看板、工单处理、数字人配置 |
| 景区运营人员 | B 端指挥中心 | 实时客流监控、设施监测、应急指挥 |

---

## 2. 系统架构

### 2.1 总体架构（三端 + 四服务）

```
┌──────────────────────────────────────────────────────────────────┐
│                        用户访问层                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐   │
│  │   C 端 Web 导游  │  │  B 端管理后台    │  │  微信小程序     │   │
│  │  React + Vite   │  │  React + Vite   │  │  原生 WXML     │   │
│  │  :5173          │  │  :5173          │  │  微信生态       │   │
│  └────────┬────────┘  └────────┬────────┘  └───────┬────────┘   │
│           │                   │                    │            │
│  ┌────────▼───────────────────▼────────────────────▼────────┐   │
│  │              HTTP API 统一网关层                          │   │
│  │          响应格式: {code, message, data, trace_id}       │   │
│  └────────┬───────────────────┬────────────────────┬────────┘   │
└───────────┼───────────────────┼────────────────────┼────────────┘
            │                   │                    │
┌───────────▼───────────┐ ┌────▼────────────┐ ┌─────▼───────────┐
│  business-api (:8001) │ │  admin-api      │ │  demo-mock      │
│  FastAPI + SQLAlchemy │ │  (:8002)        │ │  (:8006)        │
│                      │ │  FastAPI         │ │  FastAPI        │
│  游客业务接口         │ │  管理接口        │ │  演示兜底        │
│  - 景点/路线/会话    │ │  - 知识库管理    │ │  - 演示脚本     │
│  - RAG 查询代理      │ │  - 运营分析      │ │  - Mock 数据    │
│  - 反馈/天气/排队    │ │  - 工单/应急     │ │                 │
│                      │ │  - 数字人配置    │ │                 │
│                      │ │  - 运行时控制    │ │                 │
└───────────┬──────────┘ └────────┬─────────┘ └─────────────────┘
            │                    │
            └────────┬───────────┘
                     ▼
          ┌──────────────────┐
          │   SQLite 数据库   │
          │  scenic_business │
          └──────────────────┘
                     │
                     ▼
          ┌───────────────────────┐
          │   RAG 服务 (:5010)     │
          │   Flask + ChromaDB    │
          │   + DeepSeek LLM      │
          │   + BGE Embedding     │
          └───────────────────────┘
```

### 2.2 架构设计原则

1. **前后端分离**：所有数据通过 RESTful API 获取，前端不直接操作数据库
2. **服务化拆分**：业务接口与管理接口分离为独立服务，职责清晰
3. **统一契约**：所有服务遵循 `scenic-dh-contracts` 定义的 API 规范
4. **优雅降级**：RAG 服务不可达时自动降级为内置 mock 数据，保证演示流畅
5. **可观测性**：统一 TraceID 全链路追踪，JSON 格式日志

---

## 3. 技术选型

### 3.1 选型依据

| 维度 | 需求 | 选型 | 理由 |
|------|------|------|------|
| 前端框架 | 快速开发、组件化 | React 19 | 生态丰富、社区活跃、学习成本低 |
| 前端构建 | 开发体验好、构建快 | Vite 8 | 冷启动秒级、HMR 即时更新 |
| 前端语言 | 类型安全 | TypeScript | 减少运行时错误、IDE 友好 |
| 后端框架 | 高性能 API | FastAPI (Python) | 异步原生、自动 OpenAPI 文档、性能优异 |
| ORM | 对象关系映射 | SQLAlchemy 2.0 | 支持多种数据库、查询灵活 |
| 数据库 | 轻量级存储 | SQLite | 零配置、无需单独部署、满足竞赛演示需求 |
| 向量数据库 | 语义检索 | ChromaDB | 轻量、Python 原生、支持元数据过滤 |
| Embedding | 中文语义理解 | BAAI/bge-small-zh-v1.5 | 国产中文模型、效果优秀、体积小 |
| LLM | 大模型问答 | DeepSeek (SiliconFlow) | 国产开源、中文能力强、API 友好 |
| 数字人驱动 | 2D 虚拟形象 | Live2D Cubism SDK | 轻量、跨平台、主流虚拟主播技术 |
| 数字人框架 | 语音/表情合成 | Fay 数字人框架 | 开源、支持多模态驱动 |

### 3.2 为什么选择前端零 CSS 框架

本项目前端纯手写 CSS，不依赖 Tailwind、MUI、Ant Design 等框架：

- **可控性**：每个像素都可精确控制，无框架样式冲突
- **体积**：6845 行手写 CSS 覆盖所有组件，无冗余框架代码
- **一致性**：所有颜色值通过 CSS 变量统一管理，零硬编码
- **性能**：无运行时 CSS-in-JS 开销，首屏渲染更快

### 3.3 为什么选择 SQLite 而非 MySQL/PostgreSQL

- **竞赛场景演示**：无需额外安装数据库服务，开箱即用
- **数据量适合**：景区静态数据（景点、路线）在百条级别，SQLite 完全胜任
- **方便部署**：单文件数据库，复制即迁移
- **SQLAlchemy 抽象层**：如需切换为 MySQL，仅需修改一行连接字符串

---

## 4. 前端设计

### 4.1 路由设计

```
/                  → 登录页（未登录）/ 管理后台首页（已登录）
/guide             → C 端导游主页（公开访问）
/kiosk             → Kiosk 大屏模式（公开访问）
/dashboard         → 数据看板
/knowledge         → 知识库管理
/review            → 内容审核
/digital-human     → 数字人配置
/digital-human-monitor → 数字人监控
/command           → 指挥中心大屏
/work-orders       → 工单中心
/settings          → 系统设置
```

### 4.2 组件架构

```
App.tsx
├── ErrorBoundary             全局错误边界
├── LoginPage                 登录页
├── GuidePage (C 端导游主页)
│   ├── ChatPanel             聊天面板（语音+文本输入）
│   ├── DigitalHuman          数字人形象
│   ├── SpotDetail            景点详情
│   ├── RouteRecommend        路线推荐
│   ├── PhotoRecognition      拍照识景
│   ├── VoiceRecord           语音录制
│   ├── ShareCard             分享卡片
│   └── LbsStatus             位置状态
├── KioskPage (大屏模式)
├── DataDashboard (数据看板)
├── KnowledgeBase (知识库管理)
├── ContentReview (内容审核)
├── DigitalHumanConfig (数字人配置)
├── DigitalHumanMonitor (数字人监控)
├── CommandCenter (指挥大屏)
├── WorkOrderCenter (工单中心)
└── SystemSettings (系统设置)
```

### 4.3 国际化设计

自建 i18n 系统（`frontend/src/i18n/index.ts`），不引入第三方库：
- 中/英双语
- 100+ 翻译键值对
- `useT()` React Hook，组件内直接调用 `t('key')`
- 一键切换，全界面实时生效

### 4.4 响应式设计

- 移动端优先：断点 ≤480px
- 纯手写 CSS 变量
- 使用 `@media` 自适应横竖屏
- Kiosk 模式专门适配大屏触摸一体机

---

## 5. 后端设计

### 5.1 business-api 模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 配置 | config.py | 环境变量读取与配置管理 |
| 数据库 | database.py | SQLAlchemy 引擎与会话管理 |
| 模型 | models.py | ORM 数据模型定义 |
| 中间件 | middleware.py | TraceID 注入、鉴权 |
| 景点路由 | routers/spots.py | 景点列表、详情、讲解词 |
| 路线路由 | routers/routes.py | 路线列表、详情、规划 |
| 会话路由 | routers/sessions.py | 游客会话管理 |
| 消息路由 | routers/messages.py | 对话消息记录 |
| RAG 代理 | routers/rag_proxy.py | RAG 查询代理 + mock 降级 |
| 反馈路由 | routers/feedback.py | 游客反馈 |
| 到达路由 | routers/arrivals.py | 到达事件记录 |

### 5.2 admin-api 模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 认证 | routers/auth.py | JWT 登录/登出/鉴权 |
| 知识库 | routers/knowledge.py | 文档入库、检索测试、QA管理 |
| 分析 | routers/analytics.py | 运营数据大屏接口 |
| 数字人 | routers/digital_human.py | 形象/声音配置 |
| 工单 | routers/work_orders.py | 工单创建/处理 |
| 应急 | routers/emergencies.py | 应急事件管理 |
| 运行时 | routers/runtime.py | Fay 状态/广播/控制 |
| 系统配置 | routers/system_config.py | 系统参数配置 |
| 人员 | routers/staff_users.py | 员工管理 |

### 5.3 RAG 服务模块

| 模块 | 文件 | 职责 |
|------|------|------|
| 配置 | rag_config.py | 全局配置管理 |
| 文档解析 | document_parser.py | DOCX/TXT/MD 解析 |
| 文本清洗 | text_cleaner.py | 去重/去乱码 |
| 语义分块 | text_chunker.py | 段落+句子级分块 |
| Embedding | embedding_service.py | 中文向量化 |
| 向量库 | vector_store.py | ChromaDB 操作 |
| 引擎 | rag_engine.py | 管线编排 |
| Fallback | fallback.py | 不可回答降级策略 |
| 引用 | citation.py | 引用来源生成 |
| API | api.py | Flask Blueprint |

---

## 6. API 设计

### 6.1 统一响应格式

所有 API 统一格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "trace_id": "trace_abc123..."
}
```

### 6.2 错误码

| 错误码 | 含义 | HTTP 状态码 |
|--------|------|------------|
| 0 | 成功 | 200 |
| 10001 | 参数错误 | 400 |
| 10002 | 文件不存在 | 404 |
| 40001 | 鉴权失败 | 401 |
| 50001 | 服务器错误 | 500 |

### 6.3 核心 API 接口清单

**business-api (/v1)：**

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /spots | 景点列表（分页/搜索/标签过滤） |
| GET | /spots/{id} | 景点详情 |
| GET | /spots/{id}/guide | 景点讲解词（三级：一句话/简短/深度） |
| GET | /routes | 路线列表 |
| GET | /routes/{id} | 路线详情（含途经站点） |
| POST | /sessions | 创建游客会话 |
| GET | /sessions/{id} | 查询会话 |
| POST | /sessions/{id}/messages | 发送消息 |
| GET | /sessions/{id}/messages | 消息历史 |
| POST | /sessions/{id}/arrival-events | 到达事件 |
| POST | /sessions/{id}/feedback | 提交反馈 |
| POST | /rag/query | RAG 问答代理 |
| GET | /notices | 景区公告 |
| GET | /events | 景区活动 |
| GET | /services | 服务设施 |
| GET | /weather | 天气信息 |
| GET | /queues | 排队信息 |
| GET | /tickets/products | 票务信息 |

**admin-api (/v1)：**

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /auth/login | 管理员登录 |
| GET | /auth/me | 当前用户信息 |
| POST | /auth/logout | 登出 |
| GET | /knowledge/status | 知识库状态 |
| POST | /knowledge/ingest | 文档入库 |
| GET | /knowledge/sources | 资料来源列表 |
| POST | /knowledge/qa | 录入问答对 |
| POST | /knowledge/test-query | 测试检索 |
| POST | /knowledge/answer | 检索+LLM生成 |
| GET | /knowledge/low-confidence-queries | 低置信度查询 |
| GET | /admin/analytics/overview | 运营概览 |
| GET | /admin/analytics/spot-heat | 景点热度 |
| GET | /admin/analytics/crowd-flow | 客流趋势 |
| GET | /admin/analytics/command-center | 指挥中心数据 |
| GET | /digital-human/avatars | 数字人形象列表 |
| GET | /digital-human/voices | 数字人声音列表 |
| GET | /runtime/status | 运行时状态 |
| POST | /runtime/broadcast | 广播消息 |
| GET | /work-orders | 工单列表 |
| GET | /emergencies | 应急事件 |
| GET | /feedbacks | 游客反馈 |
| GET | /system-config | 系统配置 |

---

## 7. 数据库设计

### 7.1 核心数据表

```
spots（景点表）
├── id (PK)           — 景点编码，如 "LS-001"
├── scenic_id         — 所属景区编码
├── name / name_en    — 中/英文名
├── tags (JSON)       — 标签数组，如 ["历史","文化","佛教"]
├── location          — 位置描述
├── summary           — 一句话简介
├── intro             — 详细文字介绍
├── highlights (JSON) — 亮点数组
├── source            — 数据来源
└── freshness_level   — 数据时效性

spot_guides（讲解词表）
├── id (PK)
├── spot_id (FK)      — 关联景点
├── short_text        — 一句话讲解（15秒）
├── brief_text        — 简短讲解（1-2分钟）
├── long_text         — 深度讲解（3-5分钟）
└── fallback_text     — 兜底讲解

routes（路线表）
├── id (PK)
├── name / type       — 路线名称/类型
├── duration          — 预计耗时
├── persona           — 适合人群
└── tips              — 温馨提示

route_stops（路线站点表）
├── id (PK)
├── route_id (FK)     — 关联路线
├── order             — 游览顺序
├── spot_id (FK)      — 关联景点
├── stay_duration     — 建议停留时间
└── description       — 站点说明

sessions（会话表）
├── id (PK)
├── scenic_id         — 景区编码
├── user_id           — 用户标识
└── status            — 会话状态

messages（消息表）
├── id (PK)
├── session_id (FK)   — 所属会话
├── role              — user/assistant
├── content           — 消息内容
└── metadata (JSON)   — 附加元数据

work_orders（工单表）
├── id (PK)
├── category          — 投诉/建议/报修/其他
├── description       — 描述
├── location          — 位置
├── status            — 待处理/处理中/已解决/已关闭
└── handler           — 处理人

emergencies（应急事件表）
├── id (PK)
├── type              — 医疗/走失/安防/火灾/其他
├── location          — 事发位置
├── status            — 待派单/已出发/已到达/已解决
└── dispatcher        — 调度人
```

### 7.2 数据库关系图

```
spots (1) ──→ (N) spot_guides
routes (1) ──→ (N) route_stops ──→ (1) spots
sessions (1) ──→ (N) messages
sessions (1) ──→ (N) arrival_events
sessions (1) ──→ (N) feedback
```

---

## 8. AI 模型与 RAG 设计

### 8.1 整体 AI 架构

```
游客提问
    │
    ▼
┌─────────────────────┐
│  意图识别 + Domain 过滤 │
│  - 门票/时间/路线/文化… │
│  10 类意图自动分类    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  语义向量检索        │
│  BAAI/bge-small-zh  │
│  ChromaDB 向量库    │
│  73 个灵山知识片段   │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
  score≥0.45   score<0.45
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│LLM 生成  │ │Fallback │
│DeepSeek  │ │兜底回复  │
└────┬────┘ └─────────┘
     │
     ▼
   回答 + 引用来源
```

### 8.2 意图识别

系统通过关键词规则匹配自动识别游客意图，并据此过滤检索范围：

| 意图 | 关键词示例 | 检索 Domain |
|------|-----------|-------------|
| spot_fact | 多高、多大、多少米 | spot_detail, guide |
| ticket | 门票、价格、多少钱 | ticket, guide |
| schedule | 几点、开放、表演 | event, guide |
| route | 路线、怎么走、推荐 | guide |
| family | 小孩、亲子、带娃 | guide |
| service | 电话、客服、救助 | service |
| culture | 历史、文化、故事 | spot_detail, guide |
| facility | 停车、厕所、餐饮 | service, guide |

### 8.3 检索流程

1. **向量化**：用户问题通过 BAAI/bge-small-zh-v1.5 编码为 384 维向量
2. **向量检索**：在 ChromaDB 中余弦相似度检索 top_k 个片段
3. **分数过滤**：
   - score ≥ 0.65 → 高置信度（high）
   - 0.45 ≤ score < 0.65 → 中置信度（medium）
   - score < 0.45 → 低置信度 → 触发 fallback
4. **LLM 生成**：对高/中置信度结果，将上下文注入 DeepSeek 模型生成自然回答
5. **引用标注**：回答附带原文引用来源

### 8.4 Fallback 策略

当检索置信度不足时，系统自动降级：
1. 检测到包含关键景点关键词 → 返回对应景点简要介绍
2. 服务类问题 → 返回官方服务热线和地址
3. 完全无法回答 → 返回景区通用介绍，引导用户重新提问

### 8.5 知识库

- 来源：灵山胜境官方资料包（景点数据集 + 游客行为分析 + 游览指南）
- 入库量：73 个文本片段
- 覆盖：20+ 景点介绍、历史文化遗产知识、常见问答
- 存储：ChromaDB 持久化到 `rag/chroma_db/` 目录

---

## 9. 数字人设计

### 9.1 Live2D 数字人

- **模型**：Haru（Live2D 官方示例模型，支持全身动作+表情）
- **SDK**：Cubism SDK for Web 5-r.4
- **集成方式**：独立 iframe 嵌入前端，通过 postMessage 通信

### 9.2 嘴型同步（LipSync）

```
Fay TTS → audio.mp3 → 振幅分析 (pydub) → WebSocket
                                                    │
                                                    ▼
                                          Lipsync.ts → visemeMap
                                          → ParamMouthOpenY
```

- **方案**：音频振幅驱动（无需外部 API）
- **帧长**：50ms/帧
- **映射**：RMS 振幅归一化 → viseme 类型（sil/PP/TH/DD/E/oh/ou/aa）→ 嘴型开合度
- **过渡**：前端线性插值平滑

### 9.3 TTS（语音合成）

- **默认方案**：Edge TTS（浏览器内置，零配置）
- **可扩展**：支持接入 GPT-SoVITS、阿里云 NLS 等

### 9.4 ASR（语音识别）

- **Web 端**：Web Speech API（浏览器原生，无需额外部署）
- **小程序端**：微信录音 API（wx.getRecorderManager）
- **可扩展**：支持接入 FunASR、阿里云 ASR 等

---

## 10. 安全性设计

### 10.1 API 鉴权体系

| 鉴权方式 | 适用范围 | 实现 |
|----------|---------|------|
| Bearer Token | admin-api 所有接口 | JWT 登录后签发，每次请求校验 |
| RAG API Key | RAG 服务（除 health 外） | Header `Authorization: Bearer <key>` |
| Service Token | 内部服务间通信 | Header `Authorization: Bearer <token>` |
| 游客 Token | sessions 接口 | `POST /sessions` 返回临时 Token |

### 10.2 CORS 配置

- 生产环境限制为已知来源的逗号分隔白名单
- admin-api 不配置通配符 CORS

### 10.3 数据安全

- 密码不明文存储（JWT 场景）
- SQLite 数据库默认不对外暴露
- 小程序配置包含 `.gitignore` 中排除 `project.private.config.json`

---

## 11. 测试说明

### 11.1 单元测试

**business-api：**
```bash
cd services/scenic-dh-business-api
pytest tests/ -v
```

**admin-api：**
```bash
cd services/scenic-dh-admin-api
pytest tests/ -v
```

**demo-mock-service：**
```bash
cd services/scenic-dh-demo-mock-service
pytest tests/ -v
```

### 11.2 冒烟测试

```bash
# 测试 RAG 检索
python rag/test_rag.py

# 测试 API 连通性
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:5010/api/v1/rag/health
```

### 11.3 测试结果

- **RAG 检索测试**：73 个知识片段全部可检索
- **业务 API 测试**：6 项（健康检查/景点列表/景点详情/路线列表/路线详情/会话创建）
- **管理 API 测试**：鉴权拒绝/参数校验/写入读取 全部通过

---

## 12. 创新要点

### 12.1 技术层面

1. **RAG 意图感知检索**：自动识别 10 类游客意图，按意图过滤检索范围，提高召回准确率
2. **三级讲解体系**：一句话（15秒）→ 简短（1-2分钟）→ 深度（3-5分钟），适配不同游览节奏
3. **自主 LipSync 方案**：音频振幅驱动嘴型同步，不依赖第三方 API，零成本、低延迟
4. **三端矩阵协同**：Web + 小程序 + 大屏，一套后端覆盖全场景
5. **优雅降级架构**：从 RAG → mock → 兜底，三级保障不中断服务

### 12.2 业务层面

1. **真实景区数据**：基于灵山胜境官方资料包开发，数据可落地
2. **游客感受度分析**：通过交互记录分析游客关注点和情绪趋势
3. **指挥中心大屏**：一站式 KPI 监控、设施监测、告警管理
4. **工单+应急闭环**：从游客求助到调度处理的全流程管理

---

## 13. 微信小程序特色

1. **原生开发**：WXML+WXSS 原生实现，保证微信生态内性能最优
2. **真实录音**：`wx.getRecorderManager()` 10秒内录音，自动上传
3. **真实拍照**：`wx.chooseMedia` 真实拍照，AI 识别景点
4. **位置服务**：微信 LBS SDK 定位，自动推荐附近景点讲解
5. **9 个功能页面**：导游/景点详情/路线/拍照/服务/活动/票务/紧急/反馈
