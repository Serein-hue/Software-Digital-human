"""工单中心 — 工单 / 应急求助 / 反馈投诉 管理

与 business-api 共享同一个 SQLite 数据库。
读取游客端写入的反馈/工单/应急数据，提供处理流转接口。
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, Query
from pydantic import BaseModel

from app.database import get_conn
from app.schemas.common import ok, err

logger = logging.getLogger("admin-api")
router = APIRouter(tags=["Admin Work Orders"])


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class ResolveRequest(BaseModel):
    resolution: str = "已处理"


# ═══════════════════════════════════════════════════════════════════════
# 工单管理
# ═══════════════════════════════════════════════════════════════════════


@router.get("/work-orders")
def list_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    request: Request = None,
):
    trace_id = request.state.trace_id
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


@router.get("/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request):
    trace_id = request.state.trace_id
    row = get_conn().execute("SELECT * FROM work_orders WHERE id=?", (order_id,)).fetchone()
    if row:
        return ok(dict(row), trace_id)
    return err(40413, "工单不存在", trace_id)


@router.post("/work-orders/{order_id}/handle")
def handle_work_order(order_id: str, request: Request):
    trace_id = request.state.trace_id
    now = _now()
    conn = get_conn()
    conn.execute("UPDATE work_orders SET status='processing', handler='管理员', updated_at=? WHERE id=?", (now, order_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "processing"}, trace_id)


@router.post("/work-orders/{order_id}/resolve")
def resolve_work_order(order_id: str, body: ResolveRequest = None, request: Request = None):
    trace_id = request.state.trace_id
    resolution = body.resolution if body else "已处理"
    now = _now()
    conn = get_conn()
    conn.execute("UPDATE work_orders SET status='resolved', resolution=?, updated_at=? WHERE id=?", (resolution, now, order_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "resolved"}, trace_id)


@router.post("/work-orders/{order_id}/close")
def close_work_order(order_id: str, request: Request):
    trace_id = request.state.trace_id
    now = _now()
    conn = get_conn()
    conn.execute("UPDATE work_orders SET status='closed', updated_at=? WHERE id=?", (now, order_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40413, "工单不存在", trace_id)
    return ok({"workOrderId": order_id, "status": "closed"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 应急求助管理
# ═══════════════════════════════════════════════════════════════════════


@router.get("/emergencies")
def list_emergencies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    request: Request = None,
):
    trace_id = request.state.trace_id
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


@router.get("/emergencies/{emergency_id}")
def get_emergency(emergency_id: str, request: Request):
    trace_id = request.state.trace_id
    row = get_conn().execute("SELECT * FROM emergencies WHERE id=?", (emergency_id,)).fetchone()
    if row:
        return ok(dict(row), trace_id)
    return err(40414, "应急请求不存在", trace_id)


@router.post("/emergencies/{emergency_id}/dispatch")
def dispatch_emergency(emergency_id: str, request: Request):
    trace_id = request.state.trace_id
    now = _now()
    conn = get_conn()
    conn.execute("UPDATE emergencies SET status='dispatching', dispatcher='管理员', updated_at=? WHERE id=?", (now, emergency_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40414, "应急请求不存在", trace_id)
    return ok({"emergencyId": emergency_id, "status": "dispatching"}, trace_id)


@router.post("/emergencies/{emergency_id}/resolve")
def resolve_emergency(emergency_id: str, request: Request):
    trace_id = request.state.trace_id
    now = _now()
    conn = get_conn()
    conn.execute("UPDATE emergencies SET status='resolved', resolved_at=?, updated_at=? WHERE id=?", (now, now, emergency_id))
    conn.commit()
    if conn.total_changes == 0:
        return err(40414, "应急请求不存在", trace_id)
    return ok({"emergencyId": emergency_id, "status": "resolved"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 反馈投诉管理
# ═══════════════════════════════════════════════════════════════════════


@router.get("/feedbacks")
def list_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    min_rating: Optional[int] = None,
    request: Request = None,
):
    trace_id = request.state.trace_id
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
