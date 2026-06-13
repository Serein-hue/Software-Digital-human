"""路线与推荐接口 — DB 版"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.database import DbSession
from app.models import Route, RouteStop

router = APIRouter(tags=["Routes"])


class RoutePlanRequest(BaseModel):
    startSpotId: str | None = None
    duration: str | None = None
    interests: list[str] | None = None


@router.get("/routes")
def list_routes(duration: str = Query(None), persona: str = Query(None), interest: str = Query(None), request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    query = db.query(Route)
    if duration:
        query = query.filter(Route.duration.contains(duration))
    if persona:
        query = query.filter(Route.persona.contains(persona))
    routes = query.order_by(Route.id).all()
    return ok({"items": [_route_full(r.id, db) for r in routes]}, trace_id)


@router.get("/routes/{route_id}")
def get_route(route_id: str, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    r = db.query(Route).filter(Route.id == route_id).first()
    if not r:
        return err(40402, f"路线 {route_id} 不存在", trace_id)
    return ok(_route_full(route_id, db), trace_id)


@router.post("/routes/plan")
def plan_route(body: RoutePlanRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    # MVP: 简单规则匹配
    route_id = "RT-001"
    if body.interests and "亲子" in body.interests:
        route_id = "RT-003"
    elif body.duration and "5" in body.duration:
        route_id = "RT-002"
    r = db.query(Route).filter(Route.id == route_id).first()
    if not r:
        return err(40402, "无匹配路线", trace_id)
    return ok({"route": _route_full(route_id, db), "reason": "根据您的偏好推荐的路线"}, trace_id)


def _route_full(route_id: str, db) -> dict:
    r = db.query(Route).filter(Route.id == route_id).first()
    if not r:
        return {}
    stops = db.query(RouteStop).filter(RouteStop.route_id == route_id).order_by(RouteStop.order).all()
    return {
        "id": r.id,
        "scenicId": r.scenic_id,
        "name": r.name,
        "type": r.type,
        "duration": r.duration,
        "persona": r.persona,
        "tips": r.tips,
        "source": r.source,
        "stops": [
            {
                "order": s.order,
                "spotId": s.spot_id,
                "spotName": s.spot_name,
                "stayDuration": s.stay_duration,
                "description": s.description,
            }
            for s in stops
        ],
    }
