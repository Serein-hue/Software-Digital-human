"""审计日志查询 — DB"""

from fastapi import APIRouter, Request, Query, Depends
from sqlalchemy.orm import Session
from app.schemas.common import ok
from app.database import SessionLocal
from app.models import AuditLog
from app.auth import require_permission

router = APIRouter(tags=["Audit Logs"])


@router.get("/audit-logs")
def list_audit_logs(
    request: Request,
    action: str = Query(None),
    limit: int = Query(50, ge=1, le=200),
    user_payload: dict = Depends(require_permission("audit:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(AuditLog).order_by(AuditLog.created_at.desc())
        if action:
            q = q.filter(AuditLog.action == action)
        items = q.limit(limit).all()
        result = []
        for log in items:
            result.append({
                "id": log.id,
                "action": log.action,
                "operator_id": log.operator_id,
                "operator_name": log.operator_name,
                "target_type": log.target_type,
                "target_id": log.target_id,
                "detail": log.detail,
                "diff": log.diff,
                "trace_id": log.trace_id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            })
        return ok({"items": result, "total": len(result)}, trace_id)
    finally:
        db.close()
