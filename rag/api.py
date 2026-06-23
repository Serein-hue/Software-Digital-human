#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG Flask Blueprint — 挂载路径 /api/v1/rag

H-01 整改内容：
  1. citations 字段补上（query 返回 contexts + citations 分离）
  2. trace_id 从 X-Trace-Id 请求头读取，无则自动生成
  3. 鉴权校验（health 之外全部需要 Authorization: Bearer <token>）
  4. 状态码规范化（400/401/404/500 对应不同错误）
  5. 分页支持（列表接口预留 page/page_size）
"""

import logging
import os
import time
import uuid
from functools import wraps
from flask import Blueprint, jsonify, request
from rag.rag_engine import engine

logger = logging.getLogger("rag.api")
rag_bp = Blueprint("rag", __name__)

# ── 鉴权 ──────────────────────────────────────────────────────────────
AUTH_TOKEN = os.getenv("RAG_API_KEY", "dev-token-123456")


def _res(code=0, msg="success", data=None, trace_id=""):
    return jsonify({"code": code, "message": msg, "data": data, "trace_id": trace_id})


def _get_trace_id():
    """从 X-Trace-Id 请求头读取，无则自动生成。"""
    return request.headers.get("X-Trace-Id") or f"trace_{uuid.uuid4().hex[:32]}"


def _pagination():
    """从查询参数提取分页信息。"""
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError):
        page = 1
    try:
        page_size = max(1, min(100, int(request.args.get("page_size", 20))))
    except (ValueError, TypeError):
        page_size = 20
    return page, page_size


def _paginated_data(items, total, page, page_size):
    """包装分页外壳。"""
    total_pages = max(1, (total + page_size - 1) // page_size)
    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
        },
    }


def require_auth(f):
    """鉴权装饰器：校验 Authorization: Bearer <token>。"""
    @wraps(f)
    def decorated(*args, **kwargs):
        trace_id = _get_trace_id()
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return _res(code=40001, msg="Missing or invalid Authorization header",
                        trace_id=trace_id), 401
        token = auth[len("Bearer "):].strip()
        if not token or token != AUTH_TOKEN:
            return _res(code=40001, msg="Invalid token", trace_id=trace_id), 401
        return f(*args, **kwargs)
    return decorated


# ═══════════════════════════════════════════════════════════════════════
# 接口路由
# ═══════════════════════════════════════════════════════════════════════

@rag_bp.route("/health", methods=["GET"])
def health():
    """健康检查 — 无鉴权。"""
    trace_id = _get_trace_id()
    return _res(data={"status": "ok", "timestamp": time.time()}, trace_id=trace_id)


@rag_bp.route("/stats", methods=["GET"])
@require_auth
def stats():
    """知识库统计。"""
    trace_id = _get_trace_id()
    try:
        data = engine.stats()
        return _res(data=data, trace_id=trace_id)
    except Exception as exc:
        logger.error("Stats error: %s", exc)
        return _res(code=50001, msg="Stats error", trace_id=trace_id), 500


@rag_bp.route("/ingest", methods=["POST"])
@require_auth
def ingest():
    """文档入库。"""
    trace_id = _get_trace_id()
    try:
        body = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON body", trace_id=trace_id), 400

    filepath = (body.get("filepath") or "").strip()
    if not filepath:
        return _res(code=10001, msg="Missing filepath", trace_id=trace_id), 400
    if not os.path.exists(filepath):
        return _res(code=10002, msg=f"File not found: {filepath}", trace_id=trace_id), 404

    try:
        result = engine.ingest_document(
            filepath=filepath,
            metadata=body.get("metadata"),
            chunk_size=body.get("chunk_size"),
            overlap=body.get("overlap"),
        )
        return _res(data=result, trace_id=trace_id)
    except Exception as exc:
        logger.error("Ingest error: %s", exc)
        return _res(code=50001, msg="Ingest failed", trace_id=trace_id), 500


@rag_bp.route("/query", methods=["POST"])
@require_auth
def query():
    """语义检索 — 返回上下文全文（contexts）+ 引用来源（citations）。"""
    trace_id = _get_trace_id()
    try:
        body = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON body", trace_id=trace_id), 400

    query_text = (body.get("query") or "").strip()
    if not query_text:
        return _res(code=10001, msg="Missing query", trace_id=trace_id), 400

    try:
        result = engine.query(
            query_text=query_text,
            top_k=body.get("top_k"),
            filters=body.get("filters"),
            trace_id=trace_id,
        )
        return _res(data=result, trace_id=trace_id)
    except Exception as exc:
        logger.error("Query error: %s", exc)
        return _res(code=50001, msg="Query failed", trace_id=trace_id), 500


@rag_bp.route("/rebuild", methods=["POST"])
@require_auth
def rebuild():
    """重建索引。"""
    trace_id = _get_trace_id()
    try:
        result = engine.rebuild_index()
        return _res(data=result, trace_id=trace_id)
    except Exception as exc:
        logger.error("Rebuild error: %s", exc)
        return _res(code=50001, msg="Rebuild failed", trace_id=trace_id), 500


# ═══════════════════════════════════════════════════════════════════════
# LLM 问答
# ═══════════════════════════════════════════════════════════════════════

@rag_bp.route("/answer", methods=["POST"])
@require_auth
def answer():
    """检索 + LLM 生成 — 返回完整回答和引用来源。"""
    trace_id = _get_trace_id()
    try:
        body = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON body", trace_id=trace_id), 400

    query_text = (body.get("query") or "").strip()
    if not query_text:
        return _res(code=10001, msg="Missing query", trace_id=trace_id), 400

    top_k = body.get("top_k", 5)

    try:
        # Step 1: 检索
        result = engine.query(
            query_text=query_text,
            top_k=top_k,
            trace_id=trace_id,
        )
        contexts = result.get("contexts", [])

        # Step 2: 生成回答
        from rag.llm_client import generate_answer
        llm_result = generate_answer(query_text, contexts)

        return _res(data={
            "answerable": result.get("answerable", False),
            "answer": llm_result.get("answer", ""),
            "contexts": [
                {
                    "text": ctx.get("text", "")[:300],
                    "score": ctx.get("score", 0),
                    "source": ctx.get("source_name", ""),
                    "domain": ctx.get("domain", ""),
                }
                for ctx in contexts
            ],
            "citations": result.get("citations", []),
            "fallback": result.get("fallback"),
            "tokens": llm_result.get("tokens", 0),
            "llmError": llm_result.get("error"),
            "latencyMs": result.get("latency_ms", 0),
        }, trace_id=trace_id)
    except Exception as exc:
        logger.error("Answer error: %s", exc, exc_info=True)
        return _res(code=50001, msg="Answer failed", trace_id=trace_id), 500


@rag_bp.route("/debug_raw_query", methods=["POST"])
@require_auth
def debug_raw_query():
    """直接查 ChromaDB 原始结果，不做 fallback 过滤"""
    trace_id = _get_trace_id()
    try:
        data = request.get_json(force=True)
    except Exception:
        return _res(code=10001, msg="Invalid JSON body", trace_id=trace_id), 400
    query_text = (data.get("query") or "").strip()
    if not query_text:
        return _res(code=10001, msg="Missing query", trace_id=trace_id), 400
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
                          "raw_docs": [d[:80] for d in (raw.get("documents", [[]])[0])]},
                    trace_id=trace_id)
    except Exception as exc:
        logger.error("Debug query error: %s", exc)
        return _res(code=50001, msg="Debug query failed", trace_id=trace_id), 500
