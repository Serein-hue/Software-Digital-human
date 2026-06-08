"""会话/消息审计"""

from fastapi import APIRouter, Request, Query, Depends
from app.schemas.common import ok
from app.auth import require_permission

router = APIRouter(tags=["Audit"])


@router.get("/sessions")
def list_sessions(
    request: Request,
    date_range: str = Query(None),
    status: str = Query(None),
    user_payload: dict = Depends(require_permission("audit:read")),
):
    trace_id = request.state.trace_id
    return ok({
        "items": [],
        "total": 0,
        "note": "session 审计数据来自 business-api DB，请通过 business-api 查询",
    }, trace_id)


@router.get("/sessions/{session_id}")
def get_session_detail(
    session_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("audit:read")),
):
    trace_id = request.state.trace_id
    return ok({
        "session_id": session_id,
        "messages": [],
        "events": [],
        "note": "详情请查询 business-api",
    }, trace_id)


@router.get("/messages")
def list_messages(
    request: Request,
    date_range: str = Query(None),
    fallback: bool = Query(None),
    user_payload: dict = Depends(require_permission("audit:read")),
):
    trace_id = request.state.trace_id
    return ok({
        "items": [],
        "note": "消息审计数据来自 business-api DB",
    }, trace_id)


@router.post("/messages/{message_id}/adopt")
def adopt_message(
    message_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("content:write")),
):
    trace_id = request.state.trace_id
    return ok({
        "message_id": message_id,
        "status": "adopted",
        "note": "问答已标记为采纳，待同步至 RAG",
    }, trace_id)
