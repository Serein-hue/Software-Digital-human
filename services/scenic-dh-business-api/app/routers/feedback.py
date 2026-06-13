"""反馈接口 — DB 版"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel

from app.schemas.common import ok
from app.database import DbSession
from app.models import Feedback

router = APIRouter(tags=["Feedback"])


class FeedbackRequest(BaseModel):
    rating: int
    resolved: bool = True
    comment: str | None = None
    messageId: str | None = None


@router.post("/sessions/{session_id}/feedback")
def create_feedback(session_id: str, body: FeedbackRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    feedback_id = str(uuid.uuid4())
    fb = Feedback(
        id=feedback_id,
        session_id=session_id,
        message_id=body.messageId,
        rating=body.rating,
        resolved=body.resolved,
        comment=body.comment or "",
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    db.add(fb)
    db.commit()
    return ok({"feedbackId": feedback_id}, trace_id)


@router.get("/feedback")
def list_feedback(date_range: str = Query(None), rating: int = Query(None), request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    query = db.query(Feedback)
    if rating:
        query = query.filter(Feedback.rating == rating)
    items = query.order_by(Feedback.created_at.desc()).all()
    return ok({
        "items": [
            {
                "id": fb.id,
                "sessionId": fb.session_id,
                "messageId": fb.message_id,
                "rating": fb.rating,
                "resolved": fb.resolved,
                "comment": fb.comment,
                "createdAt": fb.created_at,
            }
            for fb in items
        ],
        "total": len(items),
    }, trace_id)
