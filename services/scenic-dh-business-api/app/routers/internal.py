"""内部接口 — 供编排服务（avatar-orchestrator）调用 — DB 持久化"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import Spot, Route, Notice

router = APIRouter(tags=["Internal"])


class ContextQueryRequest(BaseModel):
    intent: str = ""
    spot_id: str | None = None
    session_id: str | None = None


@router.post("/internal/v1/context/query")
def context_query(body: ContextQueryRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        spot = None
        route = None

        # Notices
        notices_q = db.query(Notice).filter(Notice.status == "published", Notice.active == True).limit(5).all()
        notices = [{"id": n.id, "type": n.type, "title": n.title, "content": n.content} for n in notices_q]

        weather = {"temperature": 26, "weather": "多云", "source": "mock"}

        # 根据 intent 查找
        if body.spot_id:
            s = db.query(Spot).filter(Spot.id == body.spot_id).first()
            if s:
                spot = {
                    "id": s.id, "scenicId": s.scenic_id, "name": s.name,
                    "nameEn": s.name_en, "tags": s.tags or [],
                    "location": s.location, "summary": s.summary,
                    "intro": s.intro, "highlights": s.highlights or [],
                    "images": s.images or [],
                    "source": s.source, "freshnessLevel": s.freshness_level,
                    "guide": {
                        "spotId": s.id,
                        "shortText": s.guide_short or s.name,
                        "briefText": s.guide_brief or "",
                        "longText": s.guide_long or s.intro or "",
                        "fallbackText": s.guide_fallback or "",
                        "source": s.source or "public_demo_package",
                    },
                }

        if body.intent in ("route_query", "general"):
            r = db.query(Route).filter(Route.status == "published").first()
            if r:
                stops = []
                for stop in (r.stops or []):
                    stops.append({
                        "order": stop.order, "spotId": stop.spot_id,
                        "spotName": stop.spot_name, "stayDuration": stop.stay_duration,
                        "description": stop.description,
                    })
                route = {
                    "id": r.id, "scenicId": r.scenic_id, "name": r.name,
                    "type": r.type, "duration": r.duration, "persona": r.persona,
                    "stops": stops, "tips": r.tips, "source": r.source,
                }

        return ok({
            "intent": body.intent,
            "spot": spot,
            "route": route,
            "notices": notices,
            "weather": weather,
            "session_id": body.session_id,
        }, trace_id)
    finally:
        db.close()
