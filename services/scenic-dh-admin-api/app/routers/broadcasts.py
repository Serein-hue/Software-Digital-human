"""运营播报 — DB 持久化"""

from datetime import datetime, timezone

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import BroadcastMsg
from app.auth import require_permission
from app.audit import audit_log, get_operator

router = APIRouter(tags=["Broadcasts"])


class BroadcastRequest(BaseModel):
    text: str
    target: str = "all"
    target_id: str | None = None
    priority: str = "normal"


@router.post("/broadcasts")
def create_broadcast(
    body: BroadcastRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("broadcasts:create")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        operator_id = user_payload.get("sub") if user_payload else None
        broadcast = BroadcastMsg(
            text=body.text,
            priority=body.priority,
            target=body.target,
            target_id=body.target_id,
            expires_at=datetime.now(timezone.utc).replace(hour=18, minute=0, second=0),
            status="queued",
            operator_id=operator_id,
        )
        db.add(broadcast)
        db.commit()
        db.refresh(broadcast)
        op_id, op_name = get_operator(user_payload)
        audit_log(db, "broadcast.create", op_id, op_name, "broadcast", broadcast.id,
                  detail={"text": body.text[:100], "priority": body.priority},
                  trace_id=trace_id)
        return ok({"broadcastId": broadcast.id, "status": broadcast.status}, trace_id)
    finally:
        db.close()


@router.get("/broadcasts")
def list_broadcasts(
    request: Request,
    user_payload: dict = Depends(require_permission("content:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        items = db.query(BroadcastMsg).order_by(BroadcastMsg.created_at.desc()).limit(50).all()
        result = []
        for b in items:
            result.append({
                "id": b.id, "text": b.text, "priority": b.priority,
                "target": b.target, "target_id": b.target_id,
                "expires_at": b.expires_at.isoformat() if b.expires_at else None,
                "status": b.status,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            })
        return ok({"items": result}, trace_id)
    finally:
        db.close()
