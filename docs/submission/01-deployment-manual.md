# 产品部署和使用手册

## 灵山胜境 · AI 数字人导览系统

| 项目 | 内容 |
|------|------|
| 赛题 | 第十五届中国软件杯 A5 — 景区导览服务 AI 数字人 |
| 景区 | 灵山胜境（无锡，国家 5A 级景区，世界佛教论坛永久会址） |
| 版本 | v2.0.0 |
| 最后更新 | 2026-07-14 |

---

## 一、系统概述

本系统为景区导览服务 AI 数字人平台，包含三大用户端和四大后端服务：

**三端：**
- **C 端 Web 导游页** — 游客通过手机扫码访问，获取 AI 语音导游、路线推荐、拍照识景等服务
- **B 端管理后台** — 景区运营人员使用的数据看板、知识库管理、工单中心、数字人配置等
- **微信小程序** — 微信生态内原生体验，支持语音交互、拍照识景、紧急求助

**四服务：**
| 服务 | 端口 | 职责 |
|------|------|------|
| business-api | :8001 | 游客面向的业务 API（景点、路线、会话、RAG 代理） |
| admin-api | :8002 | 运营管理 API（知识库、分析、工单、数字人配置） |
| RAG 服务 | :5010 | 知识库检索 + LLM 回答生成（ChromaDB + DeepSeek） |
| demo-mock-service | :8006 | 演示兜底数据服务 |

---

## 二、环境要求

### 2.1 硬件要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 4 核 | 8 核 |
| 内存 | 8 GB | 16 GB |
| 磁盘 | 10 GB 可用 | 20 GB 可用 |
| 网络 | 可访问互联网（LLM API 调用） | 同左 |

### 2.2 软件要求

| 软件 | 版本要求 | 用途 |
|------|---------|------|
| Python | ≥ 3.10 | 后端服务运行环境 |
| Node.js | ≥ 20 | 前端构建与开发 |
| npm | ≥ 10 | 前端包管理 |
| Git | 任意版本 | 代码拉取（可选） |

### 2.3 网络与API密钥

| 外部依赖 | 用途 | 是否需要 Key |
|----------|------|-------------|
| SiliconFlow API | LLM 大模型调用（DeepSeek） | 是（可选，有 fallback） |
| 和风天气 API | 实时天气数据 | 是（可选，有 mock） |
| HuggingFace 镜像 | Embedding 模型下载 | 否（模型已缓存到本地） |

---

## 三、快速部署

### 3.1 获取代码

```bash
git clone https://github.com/Serein-hue/Software-Digital-human.git
cd Software-Digital-human
```

### 3.2 一键启动（推荐）

项目提供了自动化启动脚本：

```bash
# Windows（Git Bash）
bash scripts/start-all.sh

# 然后另开终端启动前端
cd frontend
npm install
npm run dev
```

启动后访问：
- **Web 前端**：http://localhost:5173
- **API 文档（business）**：http://localhost:8001/docs
- **API 文档（admin）**：http://localhost:8002/docs
- **RAG 健康检查**：http://127.0.0.1:5010/api/v1/rag/health

### 3.3 停止服务

```bash
bash scripts/stop-all.sh
```

### 3.4 服务状态检查

```bash
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1

# 或手动检查
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:5010/api/v1/rag/health
```

---

## 四、各服务详细部署说明

### 4.1 前端（Web + 管理后台）

```bash
cd frontend

# 安装依赖
npm install

# 开发模式启动（默认 http://localhost:5173）
npm run dev

# 生产构建（输出到 docs/app/ 目录）
npm run build
```

**环境变量配置：**
前端根目录下创建 `.env` 文件（可选，有默认值）：

```env
VITE_BUSINESS_API_BASE=http://localhost:8001/v1
VITE_ADMIN_API_BASE=http://localhost:8002/v1
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| VITE_BUSINESS_API_BASE | http://localhost:8001/v1 | 业务 API 地址 |
| VITE_ADMIN_API_BASE | http://localhost:8002/v1 | 管理 API 地址 |

### 4.2 business-api（业务服务 :8001）

```bash
cd services/scenic-dh-business-api

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 然后编辑 .env 文件，填入实际配置

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# 或者后台启动
nohup uvicorn app.main:app --host 0.0.0.0 --port 8001 > business-api.log 2>&1 &
```

**环境变量配置（.env）：**

```env
# 数据库（默认 SQLite）
DATABASE_URL=sqlite:///./scenic_business.db

# RAG 服务地址
RAG_SERVICE_URL=http://127.0.0.1:5010
RAG_API_KEY=dev-token-123456

# 数字人编排层（可选）
AVATAR_ORCHESTRATOR_URL=http://localhost:8004/v1

# 内部服务通信
SERVICE_TOKEN=svc-dev-token

# CORS 跨域
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# 天气 API（可选）
QWEATHER_API_KEY=
QWEATHER_BASE_URL=https://devapi.qweather.com/v7
WEATHER_LATITUDE=31.433
WEATHER_LONGITUDE=120.093
```

首次启动时会自动完成以下操作：
1. 创建 SQLite 数据库（scenic_business.db）
2. 创建所有数据表（spots, spot_guides, routes, route_stops, sessions, messages 等）
3. 导入种子数据（灵山胜境 20+ 景点、3 条路线、运营分析数据）

### 4.3 admin-api（管理服务 :8002）

```bash
cd services/scenic-dh-admin-api

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

**环境变量配置（.env）：**

```env
# 数据库（与 business-api 共享同一个 SQLite 文件）
DATABASE_URL=sqlite:///../scenic-dh-business-api/scenic_business.db

# 上游服务地址
BUSINESS_API_URL=http://localhost:8001/v1
RAG_SERVICE_URL=http://127.0.0.1:5010/api/v1

# Fay 数字人运行时（可选）
FAY_HTTP_URL=http://127.0.0.1:5000
FAY_CORE_URL=http://127.0.0.1:5000
FAY_WS_URL=ws://127.0.0.1:10000

# 管理员默认账号（首次启动时创建）
ADMIN_BOOTSTRAP_USERNAME=admin
ADMIN_BOOTSTRAP_PASSWORD=admin123456
ADMIN_BOOTSTRAP_DISPLAY_NAME=系统管理员

# JWT 配置
JWT_EXPIRE_HOURS=8

# 内部服务通信
INTERNAL_SERVICE_TOKEN=svc-dev-token

# CORS
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**管理后台登录：**
启动后访问 http://localhost:5173 → 自动跳转登录页
- 默认账号：`admin`
- 默认密码：在 `.env` 中配置的 `ADMIN_BOOTSTRAP_PASSWORD`

### 4.4 RAG 知识库服务（:5010）

```bash
# 首次需要设置 HuggingFace 镜像（中国大陆网络环境）
export HF_ENDPOINT=https://hf-mirror.com

# 启动服务
python rag/run_rag_server.py
```

> ⚠️ **注意**：首次启动时会自动加载 BAAI/bge-small-zh-v1.5 中文 Embedding 模型。如果首次启动时网络受限，服务会自动进入离线模式（模型已缓存后无需网络）。

**预置知识库：**
服务已内置灵山胜境知识库（73 个文本片段），涵盖：
- 20+ 景点详细信息（灵山大佛、梵宫、九龙灌浴、五印坛城等）
- 历史文化资料
- 游览指南与 FAQ
- 游客服务信息

**API 接口：**

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/v1/rag/health | 健康检查 | 无 |
| GET | /api/v1/rag/stats | 知识库统计 | Bearer |
| POST | /api/v1/rag/query | 语义检索 | Bearer |
| POST | /api/v1/rag/answer | 检索 + LLM 生成 | Bearer |
| POST | /api/v1/rag/ingest | 文档入库 | Bearer |
| POST | /api/v1/rag/rebuild | 重建索引 | Bearer |
| GET | /api/v1/rag/sources | 资料来源列表（分页） | Bearer |
| GET | /api/v1/rag/qa | 问答对列表（分页） | Bearer |
| POST | /api/v1/rag/qa | 录入问答对 | Bearer |

默认 Token：`dev-token-123456`（通过 `RAG_API_KEY` 环境变量覆盖）

**测试查询：**
```bash
curl -X POST http://127.0.0.1:5010/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token-123456" \
  -d '{"query":"灵山大佛有多高？","top_k":5}'
```

### 4.5 demo-mock-service（演示兜底 :8006）

```bash
cd services/scenic-dh-demo-mock-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8006
```

此服务提供演示脚本控制和 mock 数据，当真实数据不可用时自动降级。

---

## 五、微信小程序部署

### 5.1 打开项目

1. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开项目，选择 `miniprogram/` 目录
3. 填入小程序的 AppID

### 5.2 配置 API 地址

编辑 `miniprogram/utils/api.js`，将 `BASE_URL` 改为实际部署的 business-api 地址：

```javascript
const BASE_URL = 'http://your-server-ip:8001/v1'
```

### 5.3 真机调试

- 确保手机和服务器在同一网络（或服务器已部署到公网）
- 微信开发者工具中选择「真机调试」
- 将小程序码分享给测试人员扫码体验

---

## 六、架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端层 (React + Vite)                    │
│  ┌─────────────────┐  ┌──────────────────┐                   │
│  │  C端导游页 /kiosk │  │ B端管理后台 /dashboard              │
│  │  - 语音/文本问答  │  │ - 数据看板 / 大屏                   │
│  │  - 景点详解 / 路线 │  │ - 知识库管理                       │
│  │  - 拍照识景       │  │ - 工单中心 / 应急                  │
│  │  - LBS位置服务    │  │ - 数字人配置 / 监控                │
│  └────────┬─────────┘  └──────────┬───────────────┘          │
│           │                       │                          │
│  ┌────────▼───────────────────────▼───────────────┐          │
│  │           HTTP API (统一响应格式)                │          │
│  └────────┬───────────────────────┬───────────────┘          │
└───────────┼───────────────────────┼──────────────────────────┘
            │                       │
┌───────────▼───────────┐ ┌────────▼────────────────┐
│  business-api (:8001)  │ │   admin-api (:8002)      │
│  FastAPI + SQLAlchemy  │ │   FastAPI + SQLAlchemy   │
│                       │ │                          │
│  /v1/spots            │ │  /v1/auth                 │
│  /v1/routes           │ │  /v1/knowledge/*          │
│  /v1/sessions/messages │ │  /v1/analytics/*         │
│  /v1/rag/query(代理)  │ │  /v1/work-orders         │
│  /v1/feedback         │ │  /v1/runtime/*           │
│  /v1/weather          │ │  /v1/digital-human/*     │
└───────────┬───────────┘ └────────┬────────────────┘
            │                      │
            │         ┌────────────┘
            ▼         ▼
      ┌──────────────────┐
      │   SQLite 数据库   │
      │ scenic_business.db│
      │  spots/routes/    │
      │  sessions/work-orders│
      └──────────────────┘
            │
            ▼
┌───────────────────────┐
│  RAG 服务 (:5010)      │
│  Flask + ChromaDB     │
│  + DeepSeek LLM       │
│                       │
│  中文 Embedding 模型:  │
│  BAAI/bge-small-zh-v1.5│
│  知识库: 73 chunks    │
└───────────────────────┘
```

---

## 七、常见问题

### Q1: 启动时 RAG 服务报错 "模型加载失败"
确保模型已缓存。首次启动需要网络连接以下载 BAAI/bge-small-zh-v1.5：
```bash
# 手动下载方式
export HF_ENDPOINT=https://hf-mirror.com
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-zh-v1.5')"
```

### Q2: 前端页面白屏或接口报错
检查 business-api 和 admin-api 是否已启动：
```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health
```

### Q3: RAG 查询返回 mock 数据
这是正常现象。业务 API 的 RAG 代理会先尝试调用真实 RAG 服务（:5010），如果 RAG 服务未启动则自动降级为内置的 mock 问答。确保 RAG 服务已启动即可使用真实检索。

### Q4: 管理后台登录失败
检查 admin-api 的 `.env` 中 `ADMIN_BOOTSTRAP_PASSWORD` 是否正确配置。首次启动时服务会自动创建初始管理员账号。

### Q5: 微信小程序无法连接 API
`miniprogram/utils/api.js` 中的 `BASE_URL` 需要指向 business-api 的实际部署地址。开发时可使用电脑的局域网 IP（如 `http://192.168.x.x:8001/v1`）。

---

## 八、技术栈一览

| 维度 | 技术选型 |
|------|---------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 8 |
| 后端框架 | FastAPI (Python) / Flask (RAG) |
| ORM | SQLAlchemy 2.0 |
| 数据库 | SQLite |
| AI 大模型 | DeepSeek (通过 SiliconFlow API) |
| Embedding | BAAI/bge-small-zh-v1.5 |
| 向量数据库 | ChromaDB |
| 数字人引擎 | Live2D Cubism SDK + Fay 数字人框架 |
| 语音合成 | Edge TTS |
| 语音识别 | Web Speech API / 微信录音 API |
| 地图服务 | 微信 LBS SDK |
| 国际化 | 自建 i18n（中/英双语） |
| 样式方案 | 纯手写 CSS（零框架依赖） |
