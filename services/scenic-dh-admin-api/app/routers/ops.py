"""运营聚合首页"""

from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from app.schemas.common import ok
from app.database import SessionLocal
from app.auth import require_permission

router = APIRouter(tags=["Ops"])


@router.get("/admin/ops/snapshot")
def ops_snapshot(
    request: Request,
    user_payload: dict = Depends(require_permission("analytics:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        from app.models import ContentVersion
        return ok({
            "today_visitors": 0,  # 需要接真实数据
            "active_sessions": 0,
            "queued_visitors": 0,
            "active_events": db.query(ContentVersion).filter(
                ContentVersion.content_type == "event",
                ContentVersion.status == "published",
            ).count(),
            "online_devices": 1,
            "alerts": [],
            "pending_work_orders": 0,
        }, trace_id)
    finally:
        db.close()
