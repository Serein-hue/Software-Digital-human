# 灵山胜境 AI 数字人导览 — 竞赛演示脚本

## 演示前准备

### 1. 启动服务（约 60 秒）
```bash
# 终端 1: 全栈启动
bash scripts/start-all.sh

# 或手动启动:
# RAG       → py rag/run_rag_server.py                    (:5010)
# Business  → cd services/scenic-dh-business-api && py -m uvicorn app.main:app --host 0.0.0.0 --port 8001
# Admin     → cd services/scenic-dh-admin-api && py -m uvicorn app.main:app --host 0.0.0.0 --port 8002
# Demo-Mock → cd services/scenic-dh-demo-mock-service && py -m uvicorn app.main:app --host 0.0.0.0 --port 8006
```

### 2. Seed 数据库（仅首次）
```bash
cd services/scenic-dh-business-api && py -m seeds.seed_db
```

### 3. 入库 RAG 知识库
```bash
py -m rag.ingest_lingshan
```

### 4. 打开小程序
- 微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录
- AppID: 使用测试号

### 5. 验证
```bash
# 确认所有服务正常
curl http://127.0.0.1:8001/health   # business-api
curl http://127.0.0.1:5010/api/v1/rag/health  # RAG
```

---

## 演示流程（约 6 分钟）

### 第一幕：AI 智能问答（90 秒）

**操作**：
1. 打开小程序 → 首页显示 AI 导游"小景"欢迎语
2. 点击输入框，打字："灵山大佛有多高？"
3. 发送 → AI 返回："灵山大佛通高 88 米，佛体高 79 米，莲花瓣高 9 米，加上台基总高 101.5 米..."

**讲解要点**：
- 这是基于 RAG 知识库的语义检索，不是关键词匹配
- 84 条向量化知识，BAAI/bge-small-zh-v1.5 嵌入模型
- 命中置信度约 0.78

**继续追问**：
4. "推荐一条亲子路线" → AI 调用结构化 API 返回"亲子家庭欢乐游"
5. "门票多少钱？" → AI 调用票务 API 返回票种和价格
6. "九龙灌浴几点表演？" → AI 返回演出时间表

**讲解要点**：
- 智能意图识别：路线/票务/演出/服务/天气自动路由到对应 API
- RAG 兜底：API 失败时降级到本地知识库

---

### 第二幕：景点详情与路线（60 秒）

**操作**：
1. 点击快捷操作"推荐路线" → 进入路线页
2. 展示 3 条精选路线（历史文化/自然风光/亲子家庭）
3. 点击"亲子"筛选 → 调用 POST /routes/plan 智能推荐
4. 展开路线详情 → 展示每一步的景点和停留时间
5. 返回 → 点快捷操作"深度讲解" → 进入灵山大佛详情页
6. 切换讲解档位：一句话 → 简短版 → 深度讲解

**讲解要点**：
- 路线推荐支持偏好匹配（亲子/深度/休闲/全部）
- 景点详情三档文本来自 GET /spots/{id}/guide

---

### 第三幕：拍照识景（60 秒）

**操作**：
1. 点击快捷操作"拍照识景" → 进入拍照页
2. 点击拍照按钮 → 调用真实相机
3. 拍摄一张景点照片 → 照片显示在取景框
4. 输入"这是什么景点？"或点快速选择"灵山大佛"
5. 点击"识别" → RAG 返回匹配结果
6. 点击"提问" → 跳转回对话页，自动发送"给我详细讲讲灵山大佛"

**讲解要点**：
- 拍照 + AI 问答 = 视觉辅助的信息获取
- RAG 结果带置信度排序
- 无缝跳转对话页追问

---

### 第四幕：服务设施与票务（45 秒）

**操作**：
1. 点快捷操作"设施" → 展示服务设施列表
2. 按类别筛选：洗手间/餐饮/停车场/求助点
3. 返回 → 点快捷操作"票务"
4. 展示票种：成人票 ¥210、学生票 ¥105
5. 输入票码 → 点击"查询" → 核验结果

**讲解要点**：
- 服务设施数据来自 GET /services（支持分类筛选）
- 票务核验：POST /tickets/verify（只读查询，非交易）

---

### 第五幕：应急求助与反馈（30 秒）

**操作**：
1. 切换到"应急求助"页（可通过对话页入口或演示直达）
2. 选择求助类型：医疗急救
3. 自动获取 GPS 位置
4. 输入描述"在大佛广场感到头晕" → 提交
5. 显示"求助已发出，工作人员正在赶来"
6. 切换到"反馈"页 → 给 AI 导游打 5 星 → 提交

**讲解要点**：
- 应急求助自动获取 LBS 位置
- 完整闭环：问答 → 服务 → 应急 → 反馈

---

### 彩蛋：LBS 到达自动讲解（30 秒）

**操作**（演示时可口述）：
- 当游客走近某个景点时，小程序自动检测位置
- 调用 POST /sessions/{id}/arrival-events
- 触发 AI 自动播报该景点的讲解词

---

## 技术亮点（答辩用）

| 亮点 | 说明 |
|------|------|
| **RAG 语义检索** | 84 向量，BAAI/bge-small-zh-v1.5，ChromaDB 存储 |
| **智能意图路由** | 路线/票务/演出/服务/天气 5 类意图自动识别 |
| **离线降级** | 所有 API 调用有 fallback，弱网不影响核心体验 |
| **会话管理** | 游客会话持久化，多轮对话上下文，消息历史 |
| **统一响应格式** | {code, message, data, trace_id} 全栈一致 |
| **微服务架构** | RAG/Business/Admin/Demo-Mock 4 服务独立部署 |
| **41/41 测试通过** | 31 business + 10 admin |
| **中英双语** | 小程序支持一键切换 |

## 架构图（口述用）

```
游客小程序 (WXML/JS)
    │
    ├─ AI 对话 ──→ Business-API (:8001) ──→ RAG 知识库 (:5010)
    │                  │                           │
    │                  ├─ /rag/query               ├─ ChromaDB (84 vectors)
    │                  ├─ /spots, /routes          ├─ BGE Embedding
    │                  └─ /sessions, /messages     └─ Fallback 兜底
    │
    ├─ 景点/路线 ──→ Business-API ──→ SQLite (16 spots)
    ├─ 票务/设施 ──→ Business-API ──→ SQLite
    └─ 应急/反馈 ──→ Business-API ──→ SQLite

管理后台 ──→ Admin-API (:8002) ──→ SQLite ──→ Fay Runtime
Fay 数字人 ──→ Fay Core (:5000) ←── Admin-API 控制
```

## 备用方案

如果现场网络不稳定：
1. 小程序切换到离线模式 → 使用本地 MOCK_KNOWLEDGE（20+ 问答）
2. 服务全部运行在 localhost，不依赖外网
3. RAG 嵌入模型已本地缓存（BAAI/bge-small-zh-v1.5）
