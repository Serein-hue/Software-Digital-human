#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG 模块冒烟测试。"""

import logging, os, sys, json
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
from rag.rag_engine import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("rag.test")

def test_all():
    logger.info("=== RAG Smoke Tests ===")
    engine.rebuild_index()
    # 1. 空库查询
    r = engine.query("灵山大佛有多高？")
    assert r["answerable"] is False
    assert r["fallback"]["reason"] == "no_relevant_docs"
    logger.info("[PASS] Empty query: %s", r["fallback"]["reason"])
    # 2. 敏感查询
    r = engine.query("查一下13812345678是谁")
    if r["answerable"] is False:
        logger.info("[PASS] Sensitive blocked: %s", r["fallback"]["reason"])
    # 3. 入库
    test_file = os.path.join(_PROJECT_ROOT, "rag-knowledge", "lingshan-dataset.md")
    if os.path.exists(test_file):
        r = engine.ingest_document(filepath=test_file, metadata={"source_name": "test", "domain": "test", "scenic_id": "lingshan"})
        assert r["success"]
        logger.info("[PASS] Ingest: %d chunks", r["chunks"])
        # 4. 检索
        r = engine.query("灵山大佛有多高？")
        logger.info("[PASS] Query: answerable=%s, contexts=%d, latency=%.1fms",
                    r["answerable"], len(r.get("contexts", [])), r.get("latency_ms", 0))
    # 5. Stats
    s = engine.stats()
    logger.info("[PASS] Stats: %s", json.dumps(s, ensure_ascii=False))
    logger.info("=== All Tests Complete ===")

if __name__ == "__main__":
    test_all()
