"""地图 POI 和图层"""

from fastapi import APIRouter, Request, Query
from sqlalchemy.orm import Session
from app.schemas.common import ok
from app.database import SessionLocal
from app.models import POI

router = APIRouter(tags=["Map"])


@router.get("/map/pois")
def list_pois(
    request: Request,
    category: str | None = Query(None),
    lat: float | None = Query(None),
    lng: float | None = Query(None),
    radius: int = Query(5000, ge=100, le=50000),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(POI)
        if category:
            q = q.filter(POI.category == category)
        items = q.all()
        result = []
        for p in items:
            result.append({
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "lat": p.lat,
                "lng": p.lng,
                "icon": p.icon,
                "status": p.status,
            })
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.get("/map/layers")
def list_layers(request: Request):
    trace_id = request.state.trace_id
    layers = [
        {"id": "poi", "name": "POI 标记", "type": "poi", "visible": True, "zIndex": 10},
        {"id": "route", "name": "路线", "type": "route", "visible": True, "zIndex": 5},
        {"id": "crowd", "name": "实时人流", "type": "crowd", "visible": False, "zIndex": 15},
        {"id": "restricted", "name": "关闭/禁行区域", "type": "restricted", "visible": True, "zIndex": 20},
        {"id": "facility", "name": "服务设施", "type": "facility", "visible": True, "zIndex": 8},
    ]
    return ok({"items": layers}, trace_id)
