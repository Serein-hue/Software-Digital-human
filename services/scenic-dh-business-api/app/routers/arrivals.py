"""到达事件 + 位置上报接口

位置数据写入共享 SQLite（与 admin-api 共用），
管理后台可直接读取用于客流分析和大屏展示。
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.database import get_conn
from app.schemas.common import ok

router = APIRouter(tags=["Arrivals"])

_ARRIVALS: dict[str, list[dict]] = {}


class ArrivalEventRequest(BaseModel):
    spotId: str
    location: dict | None = None
    trigger: str = "manual"


@router.post("/sessions/{session_id}/arrival-events")
def create_arrival(session_id: str, body: ArrivalEventRequest, request: Request):
    trace_id = request.state.trace_id
    event_id = str(uuid.uuid4())
    event = {
        "id": event_id,
        "sessionId": session_id,
        "spotId": body.spotId,
        "location": body.location or {"lat": 31.42, "lng": 120.10},
        "trigger": body.trigger,
        "accepted": True,
        "speechState": "queued",
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    _ARRIVALS.setdefault(session_id, []).append(event)
    return ok({"eventId": event_id, "accepted": True}, trace_id)


@router.get("/sessions/{session_id}/arrival-events")
def list_arrivals(session_id: str, request: Request):
    trace_id = request.state.trace_id
    events = _ARRIVALS.get(session_id, [])
    return ok({"events": events}, trace_id)


# ── 位置上报（客流统计用）────────────────────────────────────────


class LocationReportRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: float | None = None
    nearSpotId: str | None = None


@router.post("/sessions/{session_id}/location")
def report_location(session_id: str, body: LocationReportRequest, request: Request):
    """游客端定时上报当前位置

    写入共享 SQLite（UPSERT 语义，每人只存最新 1 条），
    管理后台/admin-api 可直接读取。
    """
    trace_id = request.state.trace_id
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    conn = get_conn()
    conn.execute(
        """INSERT INTO locations (session_id, latitude, longitude, accuracy, near_spot_id, reported_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(session_id) DO UPDATE SET
             latitude=excluded.latitude,
             longitude=excluded.longitude,
             accuracy=excluded.accuracy,
             near_spot_id=excluded.near_spot_id,
             reported_at=excluded.reported_at""",
        (session_id, body.latitude, body.longitude, body.accuracy or 0, body.nearSpotId or "", now),
    )
    conn.commit()

    return ok({"recorded": True, "reportedAt": now}, trace_id)


@router.get("/admin/locations/recent")
def get_recent_locations(minutes: int = 5, request: Request = None):
    """管理后台获取最近活跃的游客位置（用于客流热力图）"""
    trace_id = request.state.trace_id
    conn = get_conn()
    rows = conn.execute(
        """SELECT * FROM locations
           WHERE reported_at >= datetime('now', ? || ' minutes')
           ORDER BY reported_at DESC""",
        (f"-{minutes}",),
    ).fetchall()

    items = [dict(r) for r in rows]
    return ok({"activeVisitors": items, "total": len(items)}, trace_id)
