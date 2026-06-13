"""景区信息 — 公告、活动、服务设施、票务（DB 版）"""

from fastapi import APIRouter, Request

from app.schemas.common import ok
from app.database import DbSession
from app.models import Notice, Event, ServiceFacility, TicketProduct

router = APIRouter(tags=["Scenic Info"])


@router.get("/scenic-areas/{scenic_id}")
def get_scenic_area(scenic_id: str, request: Request):
    trace_id = request.state.trace_id
    return ok(
        {
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
        },
        trace_id,
    )


@router.get("/notices")
def list_notices(type: str = None, active: bool = True, request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    query = db.query(Notice)
    if type:
        query = query.filter(Notice.type == type)
    if active:
        query = query.filter(Notice.active == True)  # noqa: E712
    notices = query.order_by(Notice.id).all()
    return ok({
        "items": [
            {
                "id": n.id, "type": n.type, "title": n.title,
                "content": n.content, "active": n.active,
                "expiresAt": n.expires_at,
            }
            for n in notices
        ]
    }, trace_id)


@router.get("/events")
def list_events(date: str = None, spot_id: str = None, request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    query = db.query(Event)
    if spot_id:
        query = query.filter(Event.spot_id == spot_id)
    events = query.order_by(Event.id).all()
    return ok({
        "items": [
            {"id": ev.id, "name": ev.name, "spotId": ev.spot_id, "time": ev.time, "description": ev.description}
            for ev in events
        ]
    }, trace_id)


@router.get("/services")
def list_services(category: str = None, nearby_spot_id: str = None, request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    query = db.query(ServiceFacility)
    if category:
        query = query.filter(ServiceFacility.category == category)
    services = query.order_by(ServiceFacility.id).all()
    return ok({
        "items": [
            {"id": sv.id, "category": sv.category, "name": sv.name, "location": sv.location}
            for sv in services
        ]
    }, trace_id)


@router.get("/weather")
def get_weather(scenic_id: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok(
        {
            "scenicId": scenic_id or "SA-001",
            "temperature": 26,
            "weather": "多云",
            "warning": None,
            "source": "mock",
        },
        trace_id,
    )


@router.get("/tickets/products")
def get_tickets(date: str = None, request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    products = db.query(TicketProduct).all()
    return ok({
        "items": [
            {"id": tk.id, "name": tk.name, "price": tk.price, "status": tk.status,
             "source": "public_demo_package"}
            for tk in products
        ]
    }, trace_id)


@router.get("/analytics/visitor-behavior")
def get_visitor_behavior(attraction_name: str = None, date_range: str = None, request: Request = None):
    trace_id = request.state.trace_id
    return ok(
        {
            "totalSamples": 140448,
            "avgSatisfaction": 4.2,
            "avgStayDuration": "3.5h",
            "avgTotalCost": 280,
            "source": "public_demo_package",
        },
        trace_id,
    )
