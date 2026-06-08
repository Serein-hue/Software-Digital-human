"""景区基础信息、公告、活动、服务设施、天气、排队、票务 — DB 持久化"""

from fastapi import APIRouter, Request
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import Notice, Event, ServiceFacility, TicketEntitlement

router = APIRouter(tags=["Scenic Info"])


@router.get("/scenic-areas/{scenic_id}")
def get_scenic_area(scenic_id: str, request: Request):
    trace_id = request.state.trace_id
    return ok({
        "id": scenic_id,
        "name": "灵山胜境",
        "nameEn": "Lingshan Buddhist Scenic Spot",
        "level": "5A",
        "city": "无锡",
        "intro": "灵山胜境位于无锡太湖国家旅游度假区，是中国著名的佛教文化主题景区...",
        "openTime": "07:00-17:30",
        "rules": ["请勿在佛像前大声喧哗", "保持景区卫生", "禁止无人机未经许可飞行"],
        "source": "public_demo_package",
        "freshnessLevel": "static",
    }, trace_id)


@router.get("/notices")
def list_notices(type: str = None, active: bool = True, request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(Notice).filter(Notice.status == "published")
        if active:
            q = q.filter(Notice.active == True)
        if type:
            q = q.filter(Notice.type == type)
        notices = q.all()
        result = [{
            "id": n.id, "type": n.type, "title": n.title, "content": n.content,
            "active": n.active,
            "expiresAt": n.expires_at.isoformat() if n.expires_at else None,
        } for n in notices]
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.get("/events")
def list_events(date: str = None, spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(Event).filter(Event.status == "published", Event.active == True)
        if spot_id:
            q = q.filter(Event.spot_id == spot_id)
        events = q.all()
        result = [{
            "id": e.id, "name": e.title, "spotId": e.spot_id,
            "time": e.start_time.strftime("%H:%M") if e.start_time else "待定",
            "description": e.description,
        } for e in events]
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.get("/services")
def list_services(category: str = None, nearby_spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(ServiceFacility)
        if category:
            q = q.filter(ServiceFacility.category == category)
        services = q.all()
        result = [{
            "id": s.id, "category": s.category, "name": s.name,
            "location": s.location or "",
        } for s in services]
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.get("/weather")
def get_weather(scenic_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok({
        "scenicId": scenic_id or "SA-001",
        "temperature": 26, "weather": "多云", "warning": None, "source": "mock",
    }, trace_id)


@router.get("/queues")
def get_queues(spot_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok({
        "spotId": spot_id or "LS-001",
        "queueMinutes": 15, "crowdLevel": "medium", "source": "mock",
    }, trace_id)


@router.get("/tickets/products")
def get_tickets(date: str = None, request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        tickets = db.query(TicketEntitlement).all()
        items = [{
            "id": t.id, "name": t.product_name, "price": t.price,
            "status": t.status, "source": t.source or "public_demo_package",
        } for t in tickets]
        return ok({"items": items}, trace_id)
    finally:
        db.close()


@router.get("/analytics/visitor-behavior")
def get_visitor_behavior(attraction_name: str = None, date_range: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok({
        "totalSamples": 140448, "avgSatisfaction": 4.2,
        "avgStayDuration": "3.5h", "avgTotalCost": 280,
        "source": "public_demo_package",
    }, trace_id)
