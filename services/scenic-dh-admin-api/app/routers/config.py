"""配置中心"""

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import ConfigEntry
from app.auth import require_permission
from app.audit import audit_log, get_operator

router = APIRouter(tags=["Config"])


class UpdateConfigRequest(BaseModel):
    value: str | int | float | bool | dict | list
    description: str | None = None


@router.get("/config")
def list_config(
    request: Request,
    user_payload: dict = Depends(require_permission("config:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        entries = db.query(ConfigEntry).order_by(ConfigEntry.key).all()
        result = []
        for e in entries:
            result.append({
                "key": e.key,
                "value": e.value,
                "type": e.value_type,
                "description": e.description,
                "updated_by": e.updated_by,
                "updated_at": e.updated_at.isoformat() if e.updated_at else None,
            })
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.put("/config/{key}")
def update_config(
    key: str,
    body: UpdateConfigRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("config:write")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        entry = db.query(ConfigEntry).filter(ConfigEntry.key == key).first()
        if not entry:
            # 自动创建
            entry = ConfigEntry(key=key, value=body.value, value_type="json")
            db.add(entry)
        else:
            entry.value = body.value

        if body.description:
            entry.description = body.description
        entry.updated_by = user_payload.get("username", "unknown") if user_payload else "unknown"

        db.commit()
        db.refresh(entry)
        op_id, op_name = get_operator(user_payload)
        audit_log(db, "config.update", op_id, op_name, "config", entry.key,
                  detail={"value": str(body.value)[:100]},
                  trace_id=trace_id)
        return ok({
            "key": entry.key,
            "value": entry.value,
            "type": entry.value_type,
            "description": entry.description,
        }, trace_id)
    finally:
        db.close()
