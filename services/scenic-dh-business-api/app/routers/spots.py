"""景点资源接口 — DB 版"""

from fastapi import APIRouter, Request, Query
from sqlalchemy import or_

from app.schemas.common import ok, err, Pagination
from app.database import DbSession
from app.models import Spot, SpotGuide

router = APIRouter(tags=["Spots"])


@router.get("/spots")
def list_spots(
    keyword: str = Query(None),
    tag: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    request: Request = None,
    db: DbSession = None,
):
    trace_id = request.state.trace_id
    query = db.query(Spot)

    if tag:
        # JSON 数组包含 tag — SQLite JSON1 扩展
        query = query.filter(Spot.tags.contains(tag))
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            or_(Spot.name.ilike(kw), Spot.summary.ilike(kw))
        )

    total = query.count()
    spots = query.order_by(Spot.id).offset(offset).limit(limit).all()

    items = [_spot_to_dict(s) for s in spots]
    page = offset // limit + 1
    total_pages = (total + limit - 1) // limit

    return ok(
        items,
        trace_id,
        pagination=Pagination(page=page, page_size=limit, total=total, total_pages=total_pages),
    )


@router.get("/spots/{spot_id}")
def get_spot(spot_id: str, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    spot = db.query(Spot).filter(Spot.id == spot_id).first()
    if not spot:
        return err(40401, f"景点 {spot_id} 不存在", trace_id)
    return ok(_spot_to_dict(spot), trace_id)


@router.get("/spots/{spot_id}/guide")
def get_spot_guide(spot_id: str, style: str = Query(None), duration: str = Query(None), request: Request = None, db: DbSession = None):
    trace_id = request.state.trace_id
    guide = db.query(SpotGuide).filter(SpotGuide.spot_id == spot_id).first()
    if not guide:
        return err(40401, f"景点 {spot_id} 的讲解词不存在", trace_id)
    return ok({
        "spotId": spot_id,
        "shortText": guide.short_text,
        "briefText": guide.brief_text,
        "longText": guide.long_text,
        "fallbackText": guide.fallback_text,
        "source": "public_demo_package",
    }, trace_id)


def _spot_to_dict(s: Spot) -> dict:
    return {
        "id": s.id,
        "scenicId": s.scenic_id,
        "name": s.name,
        "nameEn": s.name_en,
        "tags": s.tags or [],
        "location": s.location or "",
        "summary": s.summary or "",
        "intro": s.intro or "",
        "highlights": s.highlights or [],
        "source": s.source or "",
        "freshnessLevel": s.freshness_level,
    }
