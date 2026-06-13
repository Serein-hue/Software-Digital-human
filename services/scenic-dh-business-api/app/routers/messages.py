"""消息记录接口 — DB 版"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok
from app.database import DbSession
from app.models import Message

router = APIRouter(tags=["Messages"])


class CreateMessageRequest(BaseModel):
    role: str = "user"
    text: str
    citations: list[dict] | None = None
    fallback: bool = False
    fallbackReason: str | None = None
    confidence: float | None = None
    speechState: str | None = None
    durationMs: int | None = None


@router.post("/sessions/{session_id}/messages")
def create_message(session_id: str, body: CreateMessageRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    message_id = str(uuid.uuid4())
    msg = Message(
        id=message_id,
        session_id=session_id,
        role=body.role,
        text=body.text,
        citations=body.citations or [],
        fallback=body.fallback,
        fallback_reason=body.fallbackReason,
        confidence=body.confidence,
        speech_state=body.speechState or "done",
        duration_ms=body.durationMs,
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    db.add(msg)
    db.commit()
    return ok({"messageId": message_id}, trace_id)


@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str, limit: int = 50, request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    # 按时间升序返回（旧→新）
    messages.reverse()
    return ok({
        "messages": [
            {
                "id": m.id,
                "sessionId": m.session_id,
                "role": m.role,
                "text": m.text,
                "citations": m.citations or [],
                "fallback": m.fallback,
                "fallbackReason": m.fallback_reason,
                "confidence": m.confidence,
                "speechState": m.speech_state,
                "durationMs": m.duration_ms,
                "createdAt": m.created_at,
            }
            for m in messages
        ]
    }, trace_id)
