#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG Flask Blueprint — 挂载路径 /api/v1/rag"""

import logging
import os
import time
from flask import Blueprint, jsonify, request
from rag.rag_engine import engine

logger = logging.getLogger("rag.api")
rag_bp = Blueprint("rag", __name__)


def _res(code=0, msg="success", data=None, trace_id=""):
    return jsonify({"code": code, "message": msg, "data": data, "trace_id": trace_id})


@rag_bp.route("/health", methods=["GET"])
def health():
    return _res(data={"status": "ok", "timestamp": time.time()})


@rag_bp.route("/stats", methods=["GET"])
def stats():
    try:
        return _res(data=engine.stats())
    except Exception as exc:
        return _res(code=50001, msg=f"Stats error: {exc}")


@rag_bp.route("/ingest", methods=["POST"])
def ingest():
    try:
        data = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON")
    filepath = (data.get("filepath") or "").strip()
    if not filepath:
        return _res(code=10001, msg="Missing filepath")
    if not os.path.exists(filepath):
        return _res(code=10002, msg=f"File not found: {filepath}")
    try:
        result = engine.ingest_document(filepath=filepath, metadata=data.get("metadata"),
                                        chunk_size=data.get("chunk_size"),
                                        overlap=data.get("overlap"))
        return _res(data=result)
    except Exception as exc:
        logger.error("Ingest error: %s", exc)
        return _res(code=50001, msg=f"Ingest failed: {exc}")


@rag_bp.route("/query", methods=["POST"])
def query():
    try:
        data = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON")
    query_text = (data.get("query") or "").strip()
    if not query_text:
        return _res(code=10001, msg="Missing query")
    try:
        result = engine.query(query_text=query_text, top_k=data.get("top_k"),
                              filters=data.get("filters"))
        return _res(data=result)
    except Exception as exc:
        logger.error("Query error: %s", exc)
        return _res(code=50001, msg=f"Query failed: {exc}")


@rag_bp.route("/rebuild", methods=["POST"])
def rebuild():
    try:
        return _res(data=engine.rebuild_index())
    except Exception as exc:
        return _res(code=50001, msg=f"Rebuild failed: {exc}")


@rag_bp.route("/debug_raw_query", methods=["POST"])
def debug_raw_query():
    """直接查 ChromaDB 原始结果，不做 fallback 过滤"""
    try:
        data = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON")
    query_text = (data.get("query") or "").strip()
    if not query_text:
        return _res(code=10001, msg="Missing query")
    try:
        from rag.vector_store import get_store
        from rag.embedding_service import EmbeddingService
        emb = EmbeddingService()
        vec = emb.encode(query_text)
        store = get_store()
        raw = store._collection.query(
            query_embeddings=[vec], n_results=data.get("top_k", 5),
            include=["documents", "metadatas", "distances"])
        return _res(data={"count": store.count(), "raw_ids": raw.get("ids"),
                          "raw_dists": raw.get("distances"),
                          "raw_docs": [d[:80] for d in (raw.get("documents", [[]])[0])]})
    except Exception as exc:
        import traceback
        return _res(code=50001, msg=f"Debug error: {exc}\n{traceback.format_exc()}")
