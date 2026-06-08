"""景点资源接口 — SQLAlchemy 持久化"""

from fastapi import APIRouter, Request, Query
from sqlalchemy.orm import Session

from app.schemas.common import ok, err, Pagination
from app.database import SessionLocal
from app.models import Spot

router = APIRouter(tags=["Spots"])


def _spot_to_dict(s: Spot) -> dict:
    return {
        "id": s.id,
        "scenicId": s.scenic_id,
        "name": s.name,
        "nameEn": s.name_en or "",
        "tags": s.tags or [],
        "location": s.location or "",
        "summary": s.summary or "",
        "intro": s.intro or "",
        "highlights": s.highlights or [],
        "images": s.images or [],
        "source": s.source or "public_demo_package",
        "freshnessLevel": s.freshness_level or "high",
    }


@router.get("/spots")
def list_spots(
    keyword: str = Query(None),
    tag: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    request: Request = None,
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(Spot).filter(Spot.status == "published")
        if tag:
            # SQLite JSON 查询: 检查 tags 数组包含 tag
            q = q.filter(Spot.tags.contains(tag))
        if keyword:
            kw = f"%{keyword.lower()}%"
            q = q.filter(
                (Spot.name.ilike(kw)) | (Spot.summary.ilike(kw))
            )

        total = q.count()
        items = q.offset(offset).limit(limit).all()

        page = offset // limit + 1 if limit > 0 else 1
        total_pages = max(1, (total + limit - 1) // limit) if limit > 0 else 1

        result = [_spot_to_dict(s) for s in items]
        return ok(
            result,
            trace_id,
            pagination=Pagination(page=page, page_size=limit, total=total, total_pages=total_pages),
        )
    finally:
        db.close()


@router.get("/spots/{spot_id}")
def get_spot(spot_id: str, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        s = db.query(Spot).filter(Spot.id == spot_id).first()
        if not s:
            return err(40401, f"景点 {spot_id} 不存在", trace_id)
        return ok(_spot_to_dict(s), trace_id)
    finally:
        db.close()


@router.get("/spots/{spot_id}/guide")
def get_spot_guide(spot_id: str, style: str = Query(None), duration: str = Query(None), request: Request = None):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        s = db.query(Spot).filter(Spot.id == spot_id).first()
        if not s:
            return err(40401, f"景点 {spot_id} 的讲解词不存在", trace_id)
        return ok({
            "spotId": s.id,
            "shortText": s.guide_short or s.name,
            "briefText": s.guide_brief or s.summary or "",
            "longText": s.guide_long or s.intro or "",
            "fallbackText": s.guide_fallback or f"{s.name}是灵山胜境的重要景点，建议您前往参观。",
            "source": s.source or "public_demo_package",
        }, trace_id)
    finally:
        db.close()
