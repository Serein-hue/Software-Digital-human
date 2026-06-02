# RAG 配合指南

本文档给负责 RAG 的同学（队友）看的，说明当前 RAG 的状态、接口、以及后续需要配合开发的内容。

---

## 当前 RAG 状态

### 服务端
- **服务**：Flask，端口 5010
- **向量库**：ChromaDB，存储于 `rag/chroma_db/`
- **Embedding**：SiliconFlow + `BAAI/bge-large-zh-v1.5`
- **知识**：已入库 `lingshan-dataset.md` + `lingshan-guide.md`，共 73 条向量

### API 端点

所有接口前缀 `/api/v1/rag/`：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/stats` | GET | 统计（向量数等） |
| `/query` | POST | 知识检索 |
| `/ingest` | POST | 入库文档 |
| `/rebuild` | POST | 重建索引 |

### 与 Express 后端的集成

`backend/src/index.ts` → `/api/chat`：
1. 先调 RAG `/query` 检索知识
2. 查到相关结果 → 拼接回答返回
3. 查不到 → 降级到字典匹配 `KNOWLEDGE_BASE`
4. 再不行 → 默认回复

---

## RAG 同学需要做的事情

### 1. 扩充知识库
当前只有 73 条向量，远不够。需要从 **官方资料包** 补充：
- `/official-materials/示范景区公开资料包/` 中的文档
- 灵山胜境官网的景点介绍
- 游客常见问答（FAQ）

用 `/api/v1/rag/ingest` 接口批量入库：
```bash
curl -X POST http://127.0.0.1:5010/api/v1/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{"filepath": "rag-knowledge/xxx.md", "metadata": {"source": "xxx"}}'
```

### 2. RAG 编排层（与数字人协作）
需要一个**编排层**来管理：
- **多轮对话上下文**：当前 /api/chat 是无状态的，需要把历史对话传给 RAG
- **知识库路由**：判断问题类型 → 路由到对应知识子库
- **RAG + LLM 融合**：RAG 检索结果作为 prompt 上下文送给 LLM 做最终回答

建议架构：
```
用户输入 → Orchestrator → RAG检索 → 拼接Prompt → LLM回答 → TTS → Live2D
```

### 3. 知识库管理后台
项目已有 `KnowledgeBase` 页面（B 端管理），需要：
- 连接 RAG 的 ingest/rebuild/delete 接口
- 可视化管理知识条目
- 查看知识检索命中情况

### 4. RAG 评估
- 建立测试集（至少 50 个景区问答对）
- 评估检索准确率（Recall@K）
- 根据评估结果优化 chunk 大小和检索策略

---

## 接口规范

### POST /api/v1/rag/query

请求：
```json
{
  "query": "灵山大佛有多高？",
  "top_k": 3,
  "filters": {}
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "answerable": true,
    "contexts": [
      {
        "text": "灵山大佛高88米...",
        "score": 0.92,
        "source_name": "灵山知识库",
        "source_page": ""
      }
    ]
  },
  "trace_id": ""
}
```

### POST /api/v1/rag/ingest

请求：
```json
{
  "filepath": "rag-knowledge/xxx.md",
  "metadata": {"source": "官方资料", "category": "景点"},
  "chunk_size": 500,
  "overlap": 50
}
```

---

## 配合方式

| 事项 | 谁负责 | 交付物 |
|------|--------|--------|
| 知识数据整理 | RAG | 10+ 篇结构化 Markdown |
| RAG 检索调优 | RAG | 准确率 > 85% |
| 编排层设计 | **数字人** + RAG | 接口协议文档 |
| 前端知识管理 | **数字人** | KnowledgeBase 页面 |
| 全链路联调 | 双方 | 可演示 Demo |
