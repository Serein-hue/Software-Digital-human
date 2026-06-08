"""消息记录接口 — SQLAlchemy 持久化"""

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import Message as MessageModel

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
def create_message(session_id: str, body: CreateMessageRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        msg = MessageModel(
            session_id=session_id,
            role=body.role,
            text=body.text,
            citations=body.citations or [],
            fallback=body.fallback,
            fallback_reason=body.fallbackReason,
            confidence=body.confidence,
            speech_state=body.speechState or "done",
            duration_ms=body.durationMs,
        )
        db.add(msg)
        db.commit()
        db.refresh(msg)
        return ok({"messageId": msg.id}, trace_id)
    finally:
        db.close()


@router.get("/sessions/{session_id}/messages")
def list_messages(session_id: str, limit: int = 50, request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        messages = (
            db.query(MessageModel)
            .filter(MessageModel.session_id == session_id)
            .order_by(MessageModel.created_at.asc())
            .limit(limit)
            .all()
        )
        result = []
        for m in messages:
            result.append({
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
                "createdAt": m.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if m.created_at else None,
            })
        return ok({"messages": result}, trace_id)
    finally:
        db.close()
