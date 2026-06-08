"""工单提交 & 查询"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import WorkOrder

router = APIRouter(tags=["Work Orders"])


class CreateWorkOrderRequest(BaseModel):
    session_id: str
    type: str  # complaint/feedback/emergency/low_confidence
    title: str
    description: str | None = None
    images: list[str] | None = None
    location: dict | None = None  # {lat, lng}
    contact_phone: str | None = None


@router.post("/work-orders")
def create_work_order(body: CreateWorkOrderRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        wo = WorkOrder(
            session_id=body.session_id,
            type=body.type,
            title=body.title,
            description=body.description,
            images=body.images or [],
            loc_lat=body.location.get("lat") if body.location else None,
            loc_lng=body.location.get("lng") if body.location else None,
            contact_phone=body.contact_phone,
            priority="urgent" if body.type == "emergency" else "normal",
            status="pending",
        )
        db.add(wo)
        db.commit()
        db.refresh(wo)

        return ok({
            "order_id": wo.id,
            "status": wo.status,
            "priority": wo.priority,
        }, trace_id)
    finally:
        db.close()


@router.get("/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        wo = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
        if not wo:
            return err(40405, "工单不存在", trace_id)

        return ok({
            "id": wo.id,
            "session_id": wo.session_id,
            "type": wo.type,
            "title": wo.title,
            "description": wo.description,
            "priority": wo.priority,
            "status": wo.status,
            "assignee": wo.assignee,
            "images": wo.images,
            "location": {"lat": wo.loc_lat, "lng": wo.loc_lng} if wo.loc_lat else None,
            "contact_phone": wo.contact_phone,
            "resolution": wo.resolution,
            "created_at": wo.created_at.isoformat() if wo.created_at else None,
            "updated_at": wo.updated_at.isoformat() if wo.updated_at else None,
        }, trace_id)
    finally:
        db.close()
