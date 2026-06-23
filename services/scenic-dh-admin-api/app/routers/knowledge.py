"""知识库治理 — 真实对接 RAG 服务 (http://127.0.0.1:5010/api/v1/rag/*)

管理闭环:
  文档上传 → 解析 → 知识候选 → 采纳 → 重建索引
"""

import os
import uuid
import tempfile
import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Request, UploadFile, File, Form, Query
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.config import settings

logger = logging.getLogger("admin-api.knowledge")
router = APIRouter(tags=["Admin Knowledge"])

_RAG_BASE = f"{settings.RAG_SERVICE_URL}/rag"


def _trace_headers(trace_id: str) -> dict:
    return {
        "X-Trace-Id": trace_id,
        "Content-Type": "application/json",
        "Authorization": "Bearer dev-token-123456",
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
async def get_knowledge_status(scenic_id: Optional[str] = None, request: Request = None):
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
async def list_sources(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), request: Request = None):
    """列出已登记的资料来源"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_get(f"/sources?page={page}&page_size={page_size}", trace_id)
        return ok(resp.get("data", {}), trace_id)
    except Exception as e:
        logger.error("Failed to list sources: %s", e)
        return err(50000, "RAG 服务不可达", trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 文档入库
# ═══════════════════════════════════════════════════════════════════════

@router.post("/knowledge/ingest")
async def ingest_document(
    file: UploadFile = File(...),
    source_name: str = Form(""),
    domain: str = Form(""),
    request: Request = None,
):
    """上传文档 → 临时目录 → 调 RAG ingest 入库

    支持的文档格式: .md, .txt, .docx, .pdf
    """
    trace_id = request.state.trace_id

    if not file.filename:
        return err(40000, "请选择文件", trace_id)

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

        # 自动登记来源
        try:
            await _rag_post("/sources", {
                "name": source_name or file.filename,
                "filepath": file.filename,
                "domain": domain or "general",
                "description": f"后台上传: {file.filename}",
                "tags": [domain] if domain else [],
            }, trace_id)
        except Exception:
            pass

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
    """重建索引 — 清空 ChromaDB 重新入库"""
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
async def list_qa(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), request: Request = None):
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
    """测试 RAG 召回效果 — 管理员后台验证知识库命中"""
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
                    "text": ctx.get("text", "")[:300],
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
# LLM 问答（检索+生成）
# ═══════════════════════════════════════════════════════════════════════

@router.post("/knowledge/answer")
async def answer_query(body: TestQueryRequest, request: Request):
    """检索 + LLM 生成 — 返回完整 AI 回答"""
    trace_id = request.state.trace_id
    try:
        resp = await _rag_post("/answer", {
            "query": body.query,
            "top_k": body.top_k,
        }, trace_id, timeout=60.0)
        data = resp.get("data", {})

        return ok({
            "answerable": data.get("answerable", False),
            "answer": data.get("answer", ""),
            "contexts": [
                {
                    "text": ctx.get("text", "")[:300],
                    "score": ctx.get("score", 0),
                    "source": ctx.get("source", ""),
                    "domain": ctx.get("domain", ""),
                }
                for ctx in (data.get("contexts") or [])
            ],
            "citations": data.get("citations", []),
            "fallback": data.get("fallback"),
            "tokens": data.get("tokens", 0),
            "llmError": data.get("llmError"),
            "latencyMs": data.get("latency_ms", 0),
        }, trace_id)
    except httpx.ConnectError:
        return err(50300, "RAG 服务不可达", trace_id)
    except Exception as e:
        logger.error("Answer query failed: %s", e)
        return err(50000, f"问答失败: {e}", trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 问答 + 数字人播报
# ═══════════════════════════════════════════════════════════════════════

@router.post("/knowledge/answer-and-broadcast")
async def answer_and_broadcast(body: TestQueryRequest, request: Request):
    """检索 + LLM 生成 + 发送到 Fay 数字人播报 — 一键测试"""
    trace_id = request.state.trace_id

    # Step 1: 获取 AI 回答
    try:
        resp = await _rag_post("/answer", {
            "query": body.query,
            "top_k": body.top_k or 5,
        }, trace_id, timeout=60.0)
        data = resp.get("data", {})
    except Exception as e:
        return err(50000, f"问答失败: {e}", trace_id)

    answer = (data.get("answer") or "").strip()
    if not answer:
        return ok({
            "answer": "",
            "broadcastStatus": "skipped",
            "broadcastMessage": "AI 未生成回答，跳过播报",
            "llmError": data.get("llmError"),
        }, trace_id)

    # Step 2: 发送到 Fay 播报（调 admin-api 自身的 runtime/broadcast 端点）
    broadcast_status = "unknown"
    broadcast_message = ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            bc_resp = await client.post(
                f"http://127.0.0.1:8002/v1/runtime/broadcast",
                json={"text": answer, "speaker": "小景"},
                headers={"Authorization": f"Bearer {settings.ADMIN_TOKEN}", "X-Trace-Id": trace_id},
            )
            if bc_resp.status_code < 400:
                broadcast_status = "sent"
                broadcast_message = "已发送至数字人播报队列"
            else:
                broadcast_status = "fay_offline"
                broadcast_message = "Fay 数字人未启动（播报接口返回异常）"
    except httpx.ConnectError:
        broadcast_status = "fay_offline"
        broadcast_message = "Fay 数字人未启动，回答已生成但未播报"
    except Exception as e:
        broadcast_status = "error"
        broadcast_message = f"播报失败: {e}"

    return ok({
        "answer": answer,
        "answerable": data.get("answerable", False),
        "tokens": data.get("tokens", 0),
        "llmError": data.get("llmError"),
        "broadcastStatus": broadcast_status,
        "broadcastMessage": broadcast_message,
    }, trace_id)

@router.get("/knowledge/low-confidence-queries")
async def list_low_confidence(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), request: Request = None):
    """低置信问答列表 — 从 RAG 日志中获取低分命中的 query 记录

    TODO: 接入共享 DB 后可以从 messages 表查询 fallback=1 的记录
    当前返回空列表占位。
    """
    trace_id = request.state.trace_id
    return ok({
        "items": [],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": 0,
            "total_pages": 1,
        },
    }, trace_id)
