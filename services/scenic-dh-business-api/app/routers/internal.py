"""内部接口 — 供编排服务（avatar-orchestrator）调用 — DB 版"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok
from app.database import DbSession
from app.models import Spot, SpotGuide, Route, Notice

router = APIRouter(tags=["Internal"])


class ContextQueryRequest(BaseModel):
    intent: str = ""           # spot_query / route_query / general / arrival
    spot_id: str | None = None
    session_id: str | None = None


@router.post("/internal/v1/context/query")
def context_query(body: ContextQueryRequest, request: Request, db: DbSession = None):
    """结构化上下文查询 — 给编排服务返回聚合后的业务数据"""
    trace_id = request.state.trace_id

    spot = None
    route = None
    notices_data = []

    if body.spot_id:
        s = db.query(Spot).filter(Spot.id == body.spot_id).first()
        if s:
            guide = db.query(SpotGuide).filter(SpotGuide.spot_id == body.spot_id).first()
            spot = {
                "id": s.id, "name": s.name, "nameEn": s.name_en,
                "tags": s.tags, "location": s.location,
                "summary": s.summary, "intro": s.intro,
                "highlights": s.highlights,
                "guide": {
                    "shortText": guide.short_text if guide else "",
                    "briefText": guide.brief_text if guide else "",
                    "longText": guide.long_text if guide else "",
                    "fallbackText": guide.fallback_text if guide else "",
                },
            }

    if body.intent in ("route_query", "general"):
        r = db.query(Route).order_by(Route.id).first()
        if r:
            route = {"id": r.id, "name": r.name, "type": r.type, "duration": r.duration}

    notices = db.query(Notice).filter(Notice.active == True).limit(5).all()  # noqa: E712
    notices_data = [
        {"id": n.id, "type": n.type, "title": n.title, "content": n.content}
        for n in notices
    ]

    weather = {"temperature": 26, "weather": "多云", "source": "mock"}

    result = {
        "intent": body.intent,
        "spot": spot,
        "route": route,
        "notices": notices_data if notices_data else None,
        "weather": weather,
        "session_id": body.session_id,
    }
    return ok(result, trace_id)
