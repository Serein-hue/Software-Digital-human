"""排队取号 & 预约"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import QueueTicket, Reservation

router = APIRouter(tags=["Reservations"])


class TakeQueueRequest(BaseModel):
    session_id: str
    queue_id: str
    queue_name: str | None = None


class CreateReservationRequest(BaseModel):
    session_id: str
    resource_type: str  # show/spot/facility
    resource_id: str
    resource_name: str | None = None
    time_slot: str


# ── 排队 ──

@router.post("/queue/tickets")
def take_queue(body: TakeQueueRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        # 计算叫号信息
        existing_count = db.query(QueueTicket).filter(
            QueueTicket.queue_id == body.queue_id,
            QueueTicket.status == "waiting",
        ).count()
        number = existing_count + 1
        waiting_minutes = max(1, existing_count * 3)  # 每号约 3 分钟

        ticket = QueueTicket(
            session_id=body.session_id,
            queue_id=body.queue_id,
            queue_name=body.queue_name or body.queue_id,
            number=number,
            waiting_minutes=waiting_minutes,
            people_ahead=existing_count,
            status="waiting",
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)

        return ok({
            "id": ticket.id,
            "queue_id": ticket.queue_id,
            "queue_name": ticket.queue_name,
            "number": ticket.number,
            "waiting_minutes": ticket.waiting_minutes,
            "people_ahead": ticket.people_ahead,
            "status": ticket.status,
        }, trace_id)
    finally:
        db.close()


@router.delete("/queue/tickets")
def cancel_queue(ticket_id: str = Query(...), request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        ticket = db.query(QueueTicket).filter(QueueTicket.id == ticket_id).first()
        if not ticket:
            return err(40407, "排队号不存在", trace_id)
        ticket.status = "cancelled"
        db.commit()
        return ok({"status": "cancelled"}, trace_id)
    finally:
        db.close()


# ── 预约 ──

@router.post("/reservations")
def create_reservation(body: CreateReservationRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        # 简单容量检查：单时段最多 200 人
        existing = db.query(Reservation).filter(
            Reservation.resource_id == body.resource_id,
            Reservation.time_slot == body.time_slot,
            Reservation.status.in_(["booked", "checked_in"]),
        ).count()
        if existing >= 200:
            return err(40902, "该时段预约已满", trace_id)

        res = Reservation(
            session_id=body.session_id,
            resource_type=body.resource_type,
            resource_id=body.resource_id,
            resource_name=body.resource_name or body.resource_id,
            time_slot=body.time_slot,
            status="booked",
            queue_number=existing + 1,
        )
        db.add(res)
        db.commit()
        db.refresh(res)

        return ok({
            "id": res.id,
            "resource_type": res.resource_type,
            "resource_id": res.resource_id,
            "resource_name": res.resource_name,
            "time_slot": res.time_slot,
            "status": res.status,
            "queue_number": res.queue_number,
        }, trace_id)
    finally:
        db.close()
