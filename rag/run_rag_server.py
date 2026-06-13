#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG 独立服务启动入口。启动: python rag/run_rag_server.py"""

import logging, os, sys
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
from flask import Flask
from flask_cors import CORS
from rag.api import rag_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("rag.server")

app = Flask(__name__)
CORS(app)
app.register_blueprint(rag_bp, url_prefix="/api/v1/rag")

@app.route("/")
def index():
    return {"service": "RAG Knowledge Service", "version": "2.0.0",
            "endpoints": {"health": "GET /api/v1/rag/health", "stats": "GET /api/v1/rag/stats",
                          "ingest": "POST /api/v1/rag/ingest", "query": "POST /api/v1/rag/query",
                          "rebuild": "POST /api/v1/rag/rebuild"}}

if __name__ == "__main__":
    port = int(os.getenv("RAG_SERVICE_PORT", "5010"))
    logger.info("RAG service on 0.0.0.0:%d", port)
    # 预加载 embedding 模型，避免首次查询耗时过长
    try:
        from rag.embedding_service import EmbeddingService
        logger.info("Pre-warming embedding model...")
        emb = EmbeddingService()
        emb.encode("预热")
        logger.info("Embedding model ready")
    except Exception as exc:
        logger.warning("Embedding pre-warm skipped: %s", exc)
    app.run(host="0.0.0.0", port=port, debug=False)
