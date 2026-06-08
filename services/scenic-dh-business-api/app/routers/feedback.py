"""反馈接口 — SQLAlchemy 持久化"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import Feedback as FeedbackModel

router = APIRouter(tags=["Feedback"])


class FeedbackRequest(BaseModel):
    rating: int
    resolved: bool = True
    comment: str | None = None
    messageId: str | None = None


@router.post("/sessions/{session_id}/feedback")
def create_feedback(session_id: str, body: FeedbackRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        fb = FeedbackModel(
            session_id=session_id,
            message_id=body.messageId,
            rating=body.rating,
            resolved=body.resolved,
            comment=body.comment,
        )
        db.add(fb)
        db.commit()
        db.refresh(fb)
        return ok({"feedbackId": fb.id}, trace_id)
    finally:
        db.close()


@router.get("/feedback")
def list_feedback(date_range: str = Query(None), rating: int = Query(None), request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(FeedbackModel)
        if rating is not None:
            q = q.filter(FeedbackModel.rating == rating)
        items = q.order_by(FeedbackModel.created_at.desc()).limit(100).all()
        result = []
        for f in items:
            result.append({
                "id": f.id,
                "sessionId": f.session_id,
                "messageId": f.message_id,
                "rating": f.rating,
                "resolved": f.resolved,
                "comment": f.comment,
                "createdAt": f.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if f.created_at else None,
            })
        return ok({"items": result, "total": len(result)}, trace_id)
    finally:
        db.close()
