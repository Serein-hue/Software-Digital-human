"""应急求助"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok
from app.database import SessionLocal
from app.models import EmergencyRequest

router = APIRouter(tags=["Emergency"])


class EmergencyCreateRequest(BaseModel):
    session_id: str
    type: str  # sos/medical/lost_child/security/other
    description: str | None = None
    location: dict | None = None
    contact_phone: str | None = None


@router.post("/emergency/requests")
def create_emergency(body: EmergencyCreateRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        er = EmergencyRequest(
            session_id=body.session_id,
            type=body.type,
            description=body.description,
            loc_lat=body.location.get("lat") if body.location else None,
            loc_lng=body.location.get("lng") if body.location else None,
            contact_phone=body.contact_phone,
            status="pending",
        )
        db.add(er)
        db.commit()
        db.refresh(er)

        return ok({
            "request_id": er.id,
            "status": "pending",
            "responder_eta": "预计 5 分钟内响应",
        }, trace_id)
    finally:
        db.close()
