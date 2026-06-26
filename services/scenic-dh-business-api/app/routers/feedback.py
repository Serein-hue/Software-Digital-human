"""反馈 + 工单 + 应急求助 接口

与 admin-api 共享同一个 SQLite 数据库。
游客端写入后，管理端直接读取同一条记录，无需中间同步。
"""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.database import get_conn
from app.schemas.common import ok

logger = logging.getLogger("business-api")

router = APIRouter(tags=["Feedback & Emergency"])


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── 请求模型 ──────────────────────────────────────────────────────


class FeedbackRequest(BaseModel):
    type: str = "feedback"
    content: str
    contact: str | None = None
    image: str | None = None
    location: str | None = None


class WorkOrderRequest(BaseModel):
    type: str = "complaint"
    content: str
    contact: str | None = None
    location: str | None = None


class EmergencyRequest(BaseModel):
    type: str = "sos"
    description: str = ""
    contact: str
    location: str | None = None


# ── 反馈 ──────────────────────────────────────────────────────────


@router.post("/sessions/{session_id}/feedback")
def create_feedback(session_id: str, body: FeedbackRequest, request: Request):
    """游客提交反馈/投诉"""
    trace_id = request.state.trace_id
    fb_id = str(uuid.uuid4())
    now = _now()

    conn = get_conn()
    conn.execute(
        """INSERT INTO feedbacks (id, session_id, type, content, contact, image, location, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (fb_id, session_id, body.type, body.content, body.contact or "", body.image or "", body.location or "", now),
    )
    conn.commit()

    logger.info(f"反馈提交: session={session_id}, type={body.type}")
    return ok({"feedbackId": fb_id, "status": "received"}, trace_id)


# ── 工单 ──────────────────────────────────────────────────────────


@router.post("/work-orders")
def create_work_order(body: WorkOrderRequest, request: Request, session_id: str = None):
    """游客提交工单"""
    trace_id = request.state.trace_id
    order_id = str(uuid.uuid4())
    now = _now()
    sid = session_id or "anonymous"

    conn = get_conn()
    conn.execute(
        """INSERT INTO work_orders (id, session_id, category, description, location, contact, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)""",
        (order_id, sid, body.type, body.content, body.location or "", body.contact or "", now, now),
    )
    conn.commit()

    logger.info(f"工单提交: id={order_id}, type={body.type}")
    return ok({"workOrderId": order_id, "status": "pending"}, trace_id)


@router.get("/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request):
    """游客查工单进度"""
    trace_id = request.state.trace_id
    row = get_conn().execute("SELECT status, description FROM work_orders WHERE id=?", (order_id,)).fetchone()
    if row:
        return ok({"id": order_id, "status": row["status"], "description": row["description"]}, trace_id)
    return ok({"id": order_id, "status": "unknown"}, trace_id)


# ── 应急求助 ──────────────────────────────────────────────────────


@router.post("/emergency/requests")
def create_emergency(body: EmergencyRequest, request: Request):
    """游客发起应急求助"""
    trace_id = request.state.trace_id
    e_id = str(uuid.uuid4())
    now = _now()

    conn = get_conn()
    conn.execute(
        """INSERT INTO emergencies (id, emergency_type, description, location, contact, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (e_id, body.type, body.description, body.location or "", body.contact, now, now),
    )
    conn.commit()

    logger.warning(f"应急求助: {e_id}, type={body.type}")
    return ok({"emergencyId": e_id, "status": "pending"}, trace_id)


@router.get("/emergency/requests/{request_id}")
def get_emergency(request_id: str, request: Request):
    """游客查应急进度"""
    trace_id = request.state.trace_id
    row = get_conn().execute("SELECT status, emergency_type FROM emergencies WHERE id=?", (request_id,)).fetchone()
    if row:
        return ok({"id": request_id, "status": row["status"]}, trace_id)
    return ok({"id": request_id, "status": "unknown"}, trace_id)


# ── 列表 ──────────────────────────────────────────────────────────


@router.get("/feedback")
def list_feedback(request: Request):
    trace_id = request.state.trace_id
    rows = get_conn().execute("SELECT * FROM feedbacks ORDER BY created_at DESC").fetchall()
    items = [dict(r) for r in rows]
    return ok({"items": items}, trace_id)
