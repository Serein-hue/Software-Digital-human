# RAG Knowledge Service Module

标准化 RAG 核心模块，为数字人系统提供文档知识库检索能力。

## 目录结构

```
rag/
├── __init__.py            # 模块入口
├── rag_config.py          # 全局配置（从 JSON 文件加载）
├── document_parser.py     # 文档解析（DOCX/TXT/MD，可插拔）
├── text_cleaner.py        # 文本清洗（去重/去乱码）
├── text_chunker.py        # 语义分块（段落+句子级）
├── embedding_service.py   # Embedding 适配（本地/云端切换）
├── vector_store.py        # 向量库（ChromaDB，可切换）
├── rag_engine.py          # 核心引擎（编排完整管线）
├── fallback.py            # Fallback 策略
├── citation.py            # 引用生成
├── api.py                 # Flask Blueprint
├── run_rag_server.py      # 独立服务启动
├── ingest_lingshan.py     # 灵山数据入库
├── test_rag.py            # 冒烟测试
├── README.md
├── config/                # 配置文件（JSON，零硬编码）
│   ├── cleaning_rules.json
│   ├── chunk_config.json
│   ├── embedding_config.json
│   ├── vector_store_config.json
│   ├── fallback_config.json
│   ├── fallback_phrases.json
│   ├── sensitive_words.txt
│   └── logging_config.json
└── chroma_db/             # 向量库持久化（自动创建）
```

## 极简启动

```bash
# 1. 启动独立服务（调试）
python rag/run_rag_server.py
# -> http://127.0.0.1:5010/api/v1/rag/health

# 2. 入库灵山数据
python rag/ingest_lingshan.py

# 3. 冒烟测试
python rag/test_rag.py

# 4. 检索测试
curl -X POST http://127.0.0.1:5010/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"灵山大佛有多高？","top_k":5}'
```

## 集成到主服务

在 `faymcp/mcp_service.py` 中修改：

```python
# 文件顶部导入
try:
    from rag.api import rag_bp
    HAS_RAG = True
except ImportError:
    HAS_RAG = False

# app 创建后注册
if HAS_RAG:
    app.register_blueprint(rag_bp, url_prefix="/api/v1/rag")
```

## API 接口

| Method | Path | Description |
|--------|------|-------------|
| GET    | /api/v1/rag/health  | 健康检查 |
| GET    | /api/v1/rag/stats   | 知识库统计 |
| POST   | /api/v1/rag/ingest  | 文档入库 |
| POST   | /api/v1/rag/query   | 语义检索 |
| POST   | /api/v1/rag/rebuild | 重建索引 |
