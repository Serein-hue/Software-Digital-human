"""知识库治理 — 真实对接 RAG 服务 (http://127.0.0.1:5010/api/v1/rag/*)

管理闭环:
  来源登记 → 文档入库 → 知识版本 → 召回测试 → 低置信采纳 → 重建索引
"""

import os
import uuid
import tempfile
import logging
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Request, UploadFile, File, Form
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.config import settings
from app.database import DbSession
from app.models_admin import ContentVersion

logger = logging.getLogger("admin-api.knowledge")
router = APIRouter(tags=["Admin Knowledge"])

_RAG_BASE = f"{settings.RAG_SERVICE_URL}/api/v1/rag"


def _trace_headers(trace_id: str) -> dict:
    return {
        "X-Trace-Id": trace_id,
        "Content-Type": "application/json",
        "Authorization": "Bearer dev-token-123456",  # RAG 服务默认 token
    }


async def _rag_get(path: str, trace_id: str, timeout: float = 10.0):
    """GET 请求 RAG 服务"""
    url = f"{_RAG_BASE}{path}"
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(url, headers=_trace_headers(trace_id))
        resp.raise_for_status()
        return resp.json()


async def _rag_post(path: str, body: dict, trace_id: str, timeout: float = 30.0):
    """POST 请求 RAG 服务"""
    url = f"{_RAG_BASE}{path}"
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(url, json=body, headers=_trace_headers(trace_id))
        resp.raise_for_status()
        return resp.json()


# ═══════════════════════════════════════════════════════════════════════
# 知识库概览
# ═══════════════════════════════════════════════════════════════════════

@router.get("/knowledge/status")
async def get_knowledge_status(scenic_id: str = None, request: Request = None):
    """知识库概览 — 聚合 RAG stats + sources/qa 数量"""
    trace_id = request.state.trace_id
    try:
        rag_stats = await _rag_get("/stats", trace_id)
        rag_data = rag_stats.get("data", {})
    except Exception as e:
        logger.warning("RAG stats unreachable: %s", e)
        return ok({
            "status": "unreachable",
            "error": "RAG 服务不可达",
            "vectors": 0,
            "sourcesCount": 0,
            "qaCount": 0,
        }, trace_id)

    # 获取 sources/qa 数量
    try:
        sources_resp = await _rag_get("/sources?page_size=1", trace_id)
        sources_total = sources_resp.get("data", {}).get("pagination", {}).get("total", 0)
    except Exception:
        sources_total = 0

    try:
        qa_resp = await _rag_get("/qa?page_size=1", trace_id)
        qa_total = qa_resp.get("data", {}).get("pagination", {}).get("total", 0)
    except Exception:
        qa_total = 0

    return ok({
        "status": "ok",
        "vectors": rag_data.get("vectors", 0),
        "provider": rag_data.get("provider", ""),
        "embeddingModel": rag_data.get("embedding_model", ""),
        "scoreThreshold": rag_data.get("score_threshold", 0),
        "chunkSize": rag_data.get("chunk_size", 0),
        "sourcesCount": sources_total,
        "qaCount": qa_total,
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 来源管理
# ═══════════════════════════════════════════════════════════════════════

@router.get("/knowledge/sources")
async def list_sources(page: int = 1, page_size: int = 20, request: Request = None):
    """列出已登记的资料来源"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_get(f"/sources?page={page}&page_size={page_size}", trace_id)
        return ok(resp.get("data", {}), trace_id)
    except Exception as e:
        logger.error("Failed to list sources: %s", e)
        return err(50000, "RAG 服务不可达", trace_id)


@router.post("/knowledge/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    source_name: str = Form(""),
    domain: str = Form(""),
    request: Request = None,
):
    """上传文档 → 保存到临时目录 → 调 RAG ingest 入库

    支持的文档格式: .md, .txt, .docx, .pdf
    """
    trace_id = request.state.trace_id

    if not file.filename:
        return err(40000, "请选择文件", trace_id)

    # 保存上传文件到临时目录
    suffix = os.path.splitext(file.filename)[1].lower()
    if suffix not in (".md", ".txt", ".docx", ".pdf"):
        return err(40000, f"不支持的文件格式: {suffix}（仅支持 .md .txt .docx .pdf）", trace_id)

    tmp_dir = tempfile.mkdtemp(prefix="rag_ingest_")
    tmp_path = os.path.join(tmp_dir, file.filename)
    try:
        content = await file.read()
        with open(tmp_path, "wb") as f:
            f.write(content)
    except Exception as e:
        return err(50000, f"文件保存失败: {e}", trace_id)

    # 调 RAG ingest
    try:
        resp = await _rag_post("/ingest", {
            "filepath": tmp_path,
            "metadata": {
                "source_name": source_name or file.filename,
                "domain": domain or "general",
                "scenic_id": "SA-001",
                "freshness_level": "high",
            },
        }, trace_id, timeout=120.0)

        rag_data = resp.get("data", {})
        # 登记来源
        try:
            await _rag_post("/sources", {
                "name": source_name or file.filename,
                "filepath": file.filename,
                "domain": domain or "general",
                "description": f"后台上传: {file.filename}",
                "tags": [domain] if domain else [],
            }, trace_id)
        except Exception:
            pass  # 来源登记非关键路径

        return ok({
            "jobId": rag_data.get("job_id", ""),
            "chunks": rag_data.get("chunks", 0),
            "success": rag_data.get("success", False),
            "message": rag_data.get("message", "入库完成"),
        }, trace_id)

    except httpx.TimeoutException:
        return err(50400, "RAG 解析超时（大文件可能需要更长时间）", trace_id)
    except Exception as e:
        logger.error("RAG ingest failed: %s", e)
        return err(50000, f"RAG 入库失败: {e}", trace_id)
    finally:
        # 清理临时文件
        try:
            os.remove(tmp_path)
            os.rmdir(tmp_dir)
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════
# 索引重建
# ═══════════════════════════════════════════════════════════════════════

@router.post("/knowledge/reindex")
async def trigger_reindex(scenic_id: str = "SA-001", reason: str = "manual", request: Request = None):
    """重建索引 — 清空后需重新入库"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_post("/rebuild", {
            "scenicId": scenic_id,
            "reason": reason,
        }, trace_id, timeout=60.0)
        return ok({
            "jobId": f"REINDEX-{uuid.uuid4().hex[:8]}",
            "status": "started",
            "message": "索引已重置，请重新入库文档",
        }, trace_id)
    except Exception as e:
        logger.error("Rebuild failed: %s", e)
        return err(50000, f"重建索引失败: {e}", trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 问答对管理
# ═══════════════════════════════════════════════════════════════════════

class QARegisterRequest(BaseModel):
    question: str
    answer: str
    source: str = ""
    domain: str = ""


@router.get("/knowledge/qa")
async def list_qa(page: int = 1, page_size: int = 20, request: Request = None):
    """列出已采纳的问答对"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_get(f"/qa?page={page}&page_size={page_size}", trace_id)
        return ok(resp.get("data", {}), trace_id)
    except Exception as e:
        logger.error("Failed to list QA: %s", e)
        return err(50000, "RAG 服务不可达", trace_id)


@router.post("/knowledge/qa")
async def register_qa(body: QARegisterRequest, request: Request):
    """手动录入问答对（管理员采纳后写入）"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_post("/qa", {
            "question": body.question,
            "answer": body.answer,
            "source": body.source or "admin_manual",
            "domain": body.domain or "general",
        }, trace_id)
        return ok(resp.get("data", {}), trace_id)
    except Exception as e:
        logger.error("Failed to register QA: %s", e)
        return err(50000, f"登记失败: {e}", trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 召回测试
# ═══════════════════════════════════════════════════════════════════════

class TestQueryRequest(BaseModel):
    query: str
    top_k: int = 5


@router.post("/knowledge/test-query")
async def test_query(body: TestQueryRequest, request: Request):
    """测试 RAG 召回效果 — 管理员在后台验证知识库命中情况"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_post("/query", {
            "query": body.query,
            "top_k": body.top_k,
        }, trace_id)
        data = resp.get("data", {})

        return ok({
            "answerable": data.get("answerable", False),
            "score": data.get("contexts", [{}])[0].get("score", 0) if data.get("contexts") else 0,
            "contexts": [
                {
                    "text": ctx.get("text", "")[:200],
                    "score": ctx.get("score", 0),
                    "source": ctx.get("source_name", ""),
                    "domain": ctx.get("domain", ""),
                }
                for ctx in (data.get("contexts") or [])
            ],
            "citations": data.get("citations", []),
            "fallback": data.get("fallback"),
            "latencyMs": data.get("latency_ms", 0),
        }, trace_id)

    except httpx.ConnectError:
        return err(50300, "RAG 服务不可达", trace_id)
    except Exception as e:
        logger.error("Test query failed: %s", e)
        return err(50000, f"查询失败: {e}", trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 低置信问答列表
# ═══════════════════════════════════════════════════════════════════════

@router.get("/knowledge/low-confidence-queries")
async def list_low_confidence(page: int = 1, page_size: int = 20, request: Request = None, db: DbSession = None):
    """低置信问答列表 — 从 messages 中筛选 fallback=True 的记录

    管理员可以在此采纳为 QA 对，形成治理闭环。
    """
    trace_id = request.state.trace_id
    from app.models_admin import ContentVersion

    # 从共享数据库的 messages 表查询低置信消息
    try:
        from sqlalchemy import text as sa_text
        count_sql = "SELECT COUNT(*) as cnt FROM messages WHERE fallback = 1 OR confidence < 0.4"
        total = db.execute(sa_text(count_sql)).scalar() or 0

        sql = """SELECT m.id, m.session_id, m.text, m.confidence, m.fallback_reason, m.created_at
                 FROM messages m
                 WHERE m.fallback = 1 OR m.confidence < 0.4
                 ORDER BY m.created_at DESC
                 LIMIT :limit OFFSET :offset"""
        rows = db.execute(
            sa_text(sql),
            {"limit": page_size, "offset": (page - 1) * page_size},
        ).mappings().all()

        items = []
        for row in rows:
            # 尝试找到对应的用户问题（上一条 user role 的消息）
            if row["session_id"]:
                prev_sql = """SELECT text FROM messages
                              WHERE session_id = :sid AND role = 'user'
                              AND created_at < :ts
                              ORDER BY created_at DESC LIMIT 1"""
                prev = db.execute(
                    sa_text(prev_sql),
                    {"sid": row["session_id"], "ts": row["created_at"]},
                ).mappings().first()
                user_question = prev["text"] if prev else ""
            else:
                user_question = ""

            items.append({
                "id": row["id"],
                "userQuestion": user_question,
                "assistantReply": row["text"],
                "confidence": row["confidence"],
                "fallbackReason": row["fallback_reason"],
                "createdAt": row["created_at"],
            })

    except Exception as e:
        logger.warning("Low confidence query failed (messages table may be empty): %s", e)
        items = []
        total = 0

    return ok({
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }, trace_id)
