"""票务扩展：订单只读查询 + 票码核验"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import TicketOrder, TicketEntitlement

router = APIRouter(tags=["Tickets"])


class TicketVerifyRequest(BaseModel):
    ticket_code: str
    session_id: str | None = None


@router.get("/tickets/orders")
def list_orders(
    request: Request,
    ticket_code: str | None = Query(None),
    phone: str | None = Query(None),
    order_id: str | None = Query(None),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(TicketOrder)
        if ticket_code:
            q = q.filter(TicketOrder.ticket_code == ticket_code)
        if phone:
            q = q.filter(TicketOrder.phone == phone)
        if order_id:
            q = q.filter(TicketOrder.id == order_id)

        orders = q.limit(20).all()
        result = []
        for o in orders:
            result.append({
                "order_id": o.id,
                "product_id": o.product_id,
                "product_name": o.product_name,
                "quantity": o.quantity,
                "total_price": o.total_price,
                "status": o.status,
                "visit_date": o.visit_date,
                "ticket_code": o.ticket_code,
            })

        return ok({"orders": result}, trace_id)
    finally:
        db.close()


@router.post("/tickets/verify")
def verify_ticket(body: TicketVerifyRequest, request: Request):
    """只读核验票码，不做状态变更"""
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        order = db.query(TicketOrder).filter(
            TicketOrder.ticket_code == body.ticket_code
        ).first()

        if not order:
            return err(40400, "票码不存在", trace_id)

        valid = order.status == "paid"
        reason = None
        if order.status == "used":
            reason = "该票码已使用"
            return err(41002, reason, trace_id)
        elif order.status == "refunded":
            reason = "该票已退款"
        elif order.status == "expired":
            reason = "该票已过期"

        return ok({
            "valid": valid,
            "order_id": order.id,
            "ticket_code": order.ticket_code,
            "product_name": order.product_name,
            "visit_date": order.visit_date,
            "reason": reason,
        }, trace_id)
    finally:
        db.close()
