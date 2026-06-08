"""路线与推荐接口 — SQLAlchemy 持久化"""

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import Route, RouteStop

router = APIRouter(tags=["Routes"])


def _route_to_dict(r: Route) -> dict:
    stops = []
    for stop in (r.stops or []):
        stops.append({
            "order": stop.order,
            "spotId": stop.spot_id,
            "spotName": stop.spot_name,
            "stayDuration": stop.stay_duration,
            "description": stop.description,
        })
    return {
        "id": r.id,
        "scenicId": r.scenic_id,
        "name": r.name,
        "type": r.type,
        "duration": r.duration,
        "persona": r.persona,
        "stops": stops,
        "tips": r.tips,
        "source": r.source,
    }


class RoutePlanRequest(BaseModel):
    startSpotId: str | None = None
    duration: str | None = None
    interests: list[str] | None = None


@router.get("/routes")
def list_routes(duration: str = Query(None), persona: str = Query(None), interest: str = Query(None), request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(Route).filter(Route.status == "published")
        routes = q.all()
        result = [_route_to_dict(r) for r in routes]
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.get("/routes/{route_id}")
def get_route(route_id: str, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        r = db.query(Route).filter(Route.id == route_id).first()
        if not r:
            return err(40402, f"路线 {route_id} 不存在", trace_id)
        return ok(_route_to_dict(r), trace_id)
    finally:
        db.close()


@router.post("/routes/plan")
def plan_route(body: RoutePlanRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        routes = db.query(Route).filter(Route.status == "published").all()
        if not routes:
            return err(40402, "暂无可用路线", trace_id)

        # 简单匹配逻辑
        route = routes[0]
        if body.interests and "亲子" in str(body.interests):
            family_routes = [r for r in routes if r.type == "family"]
            route = family_routes[0] if family_routes else routes[0]
        elif body.duration and "5" in body.duration:
            nature_routes = [r for r in routes if r.type == "nature"]
            route = nature_routes[0] if nature_routes else routes[0]

        return ok({"route": _route_to_dict(route), "reason": "根据您的偏好推荐的路线"}, trace_id)
    finally:
        db.close()
