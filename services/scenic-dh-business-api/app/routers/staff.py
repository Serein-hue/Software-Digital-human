"""员工工作台接口 — 工单/应急/反馈/概览/实时数据

所有接口需要 staff 角色的 Bearer token。
与 admin-api 共享 SQLite 数据库中的工单、应急、反馈表。
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel

from app.database import get_conn
from app.schemas.common import ok, err
from app.routers.auth import require_staff

logger = logging.getLogger("business-api")
router = APIRouter(tags=["Staff"])


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _staff_guard(request: Request) -> tuple[str, dict]:
    """统一鉴权，返回 (trace_id, user)"""
    trace_id = request.state.trace_id
    user = require_staff(request)
    if not user:
        return trace_id, None
    return trace_id, user


# ── 请求模型 ──────────────────────────────────────────────────────────


class ResolveRequest(BaseModel):
    resolution: str = "已处理"


# ═══════════════════════════════════════════════════════════════════════
# 工作台概览
# ═══════════════════════════════════════════════════════════════════════


@router.get("/staff/overview")
def staff_overview(request: Request):
    """员工工作台首页概览 — 待处理工单/应急数、今日客流、满意度"""
    trace_id = request.state.trace_id
    user = require_staff(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)

    conn = get_conn()
    pending_wo = conn.execute("SELECT COUNT(*) FROM work_orders WHERE status IN ('pending','processing')").fetchone()[0]
    pending_em = conn.execute("SELECT COUNT(*) FROM emergencies WHERE status='pending'").fetchone()[0]
    recent_fb = conn.execute("SELECT COUNT(*) FROM feedbacks WHERE created_at >= datetime('now', '-24 hours')").fetchone()[0]
    active_locations = conn.execute(
        "SELECT COUNT(*) FROM locations WHERE reported_at >= datetime('now', '-5 minutes')"
    ).fetchone()[0]

    return ok(
        {
            "pendingWorkOrders": pending_wo,
            "pendingEmergencies": pending_em,
            "recentFeedbacks24h": recent_fb,
            "activeVisitors5min": active_locations,
            "staffName": user.get("staff_name") or user.get("nickname", ""),
            "staffTitle": user.get("staff_title") or "景区工作人员",
        },
        trace_id,
    )


# ═══════════════════════════════════════════════════════════════════════
# 工单管理
# ═══════════════════════════════════════════════════════════════════════


@router.get("/staff/work-orders")
def list_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    request: Request = None,
):
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()

    where, params = [], []
    if status:
        where.append("status = ?"); params.append(status)
    if category:
        where.append("category = ?"); params.append(category)
    where_clause = "WHERE " + " AND ".join(where) if where else ""

    total = conn.execute(f"SELECT COUNT(*) FROM work_orders {where_clause}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM work_orders {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    return ok({
        "items": [dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": max(1, (total + page_size - 1) // page_size)},
    }, trace_id)


@router.get("/staff/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request):
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    row = get_conn().execute("SELECT * FROM work_orders WHERE id=?", (order_id,)).fetchone()
    if not row:
        return err(40413, "工单不存在", trace_id)
    return ok(dict(row), trace_id)


@router.post("/staff/work-orders/{order_id}/handle")
def handle_work_order(order_id: str, request: Request):
    """受理工单"""
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()
    staff_name = user.get("staff_name") or user.get("nickname", "员工")
    conn.execute(
        "UPDATE work_orders SET status='processing', handler=?, updated_at=? WHERE id=?",
        (staff_name, _now(), order_id),
    )
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "processing"}, trace_id)


@router.post("/staff/work-orders/{order_id}/resolve")
def resolve_work_order(order_id: str, body: ResolveRequest = None, request: Request = None):
    """解决工单"""
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    resolution = body.resolution if body else "已处理"
    conn = get_conn()
    conn.execute(
        "UPDATE work_orders SET status='resolved', resolution=?, updated_at=? WHERE id=?",
        (resolution, _now(), order_id),
    )
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "resolved"}, trace_id)


@router.post("/staff/work-orders/{order_id}/close")
def close_work_order(order_id: str, request: Request):
    """关闭工单"""
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()
    conn.execute("UPDATE work_orders SET status='closed', updated_at=? WHERE id=?", (_now(), order_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "closed"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 应急求助管理
# ═══════════════════════════════════════════════════════════════════════


@router.get("/staff/emergencies")
def list_emergencies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    request: Request = None,
):
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()

    where, params = [], []
    if status:
        where.append("status = ?"); params.append(status)
    where_clause = "WHERE " + " AND ".join(where) if where else ""

    total = conn.execute(f"SELECT COUNT(*) FROM emergencies {where_clause}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM emergencies {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    return ok({
        "items": [dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": max(1, (total + page_size - 1) // page_size)},
    }, trace_id)


@router.post("/staff/emergencies/{emergency_id}/dispatch")
def dispatch_emergency(emergency_id: str, request: Request):
    """派单处理应急求助"""
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()
    staff_name = user.get("staff_name") or user.get("nickname", "员工")
    conn.execute(
        "UPDATE emergencies SET status='dispatching', dispatcher=?, updated_at=? WHERE id=?",
        (staff_name, _now(), emergency_id),
    )
    conn.commit()
    if conn.total_changes == 0:
        return err(40414, "应急请求不存在", trace_id)
    return ok({"emergencyId": emergency_id, "status": "dispatching"}, trace_id)


@router.post("/staff/emergencies/{emergency_id}/resolve")
def resolve_emergency(emergency_id: str, request: Request):
    """标记应急求助已解决"""
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    now = _now()
    conn = get_conn()
    conn.execute(
        "UPDATE emergencies SET status='resolved', resolved_at=?, updated_at=? WHERE id=?",
        (now, now, emergency_id),
    )
    conn.commit()
    if conn.total_changes == 0:
        return err(40414, "应急请求不存在", trace_id)
    return ok({"emergencyId": emergency_id, "status": "resolved"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 反馈投诉查看
# ═══════════════════════════════════════════════════════════════════════


@router.get("/staff/feedbacks")
def list_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_rating: Optional[int] = None,
    request: Request = None,
):
    trace_id, user = _staff_guard(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)
    conn = get_conn()

    where, params = [], []
    if min_rating is not None:
        where.append("(rating IS NOT NULL AND rating <= ?)"); params.append(min_rating)
    where_clause = "WHERE " + " AND ".join(where) if where else ""

    total = conn.execute(f"SELECT COUNT(*) FROM feedbacks {where_clause}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM feedbacks {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    return ok({
        "items": [dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": max(1, (total + page_size - 1) // page_size)},
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 实时大屏概览（精简版运营看板）
# ═══════════════════════════════════════════════════════════════════════


@router.get("/staff/realtime")
def staff_realtime(request: Request):
    """实时运营看板 — 客流、满意度、排队、设施状态"""
    trace_id = request.state.trace_id
    user = require_staff(request)
    if not user:
        return err(40101, "需要员工权限", trace_id)

    conn = get_conn()

    # 聚合实时在园人数（5分钟内上报位置）
    active_visitors = conn.execute(
        "SELECT COUNT(*) FROM locations WHERE reported_at >= datetime('now', '-5 minutes')"
    ).fetchone()[0]

    # 各景点热度（基于位置上报）
    spot_distribution = conn.execute(
        """SELECT near_spot_id, COUNT(*) as count FROM locations
           WHERE reported_at >= datetime('now', '-5 minutes') AND near_spot_id != ''
           GROUP BY near_spot_id ORDER BY count DESC"""
    ).fetchall()

    # 待处理事项
    pending_wo = conn.execute("SELECT COUNT(*) FROM work_orders WHERE status IN ('pending','processing')").fetchone()[0]
    pending_em = conn.execute("SELECT COUNT(*) FROM emergencies WHERE status='pending'").fetchone()[0]

    # 今日满意度均值
    today_fb = conn.execute(
        "SELECT AVG(rating) FROM feedbacks WHERE created_at >= datetime('now', '-24 hours') AND rating IS NOT NULL"
    ).fetchone()[0]

    return ok(
        {
            "activeVisitors": active_visitors,
            "pendingWorkOrders": pending_wo,
            "pendingEmergencies": pending_em,
            "todayAvgRating": round(today_fb, 2) if today_fb else None,
            "spotDistribution": [{"id": r["near_spot_id"], "count": r["count"]} for r in spot_distribution],
            "mockQueueStats": [
                {"spot": "九龙灌浴", "queueMinutes": 15, "crowdLevel": "medium"},
                {"spot": "灵山梵宫", "queueMinutes": 25, "crowdLevel": "high"},
                {"spot": "灵山大佛", "queueMinutes": 8, "crowdLevel": "low"},
            ],
            "updatedAt": _now(),
        },
        trace_id,
    )
