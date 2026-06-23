"""工单中心 — 工单 / 应急求助 / 反馈投诉 管理

当前使用内存存储，后续接入共享 DB 后替换为 SQLAlchemy 查询。
"""

import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Request, Query

from pydantic import BaseModel
from app.schemas.common import ok, err

logger = logging.getLogger("admin-api.work_orders")
router = APIRouter(tags=["Admin Work Orders"])


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _uuid() -> str:
    return str(uuid.uuid4())


# ── 内存存储 ──────────────────────────────────────────────────────────
# TODO: 接入共享 DB 后替换

_WORK_ORDERS: list[dict] = []
_EMERGENCIES: list[dict] = []
_FEEDBACKS: list[dict] = []


def _seed():
    """启动时注入少量示例数据，便于前端演示"""
    if _WORK_ORDERS:
        return
    _WORK_ORDERS.extend([
        {
            "id": _uuid(),
            "sessionId": "session-001",
            "category": "complaint",
            "description": "九龙灌浴广场洗手间排队太久，建议增加指示牌",
            "location": "九龙灌浴广场",
            "contact": "138****1234",
            "status": "pending",
            "handler": None,
            "resolution": None,
            "createdAt": "2026-06-22T09:15:00Z",
            "updatedAt": "2026-06-22T09:15:00Z",
        },
        {
            "id": _uuid(),
            "sessionId": "session-002",
            "category": "suggestion",
            "description": "建议增加梵宫内部导览图的英文标识",
            "location": "灵山梵宫",
            "contact": "",
            "status": "processing",
            "handler": "张经理",
            "resolution": None,
            "createdAt": "2026-06-21T14:30:00Z",
            "updatedAt": "2026-06-22T08:00:00Z",
        },
        {
            "id": _uuid(),
            "sessionId": "session-003",
            "category": "repair",
            "description": "五印坛城二楼东侧灯光闪烁，存在安全隐患",
            "location": "五印坛城",
            "contact": "安保部 王师傅",
            "status": "resolved",
            "handler": "李工",
            "resolution": "已更换故障灯管，测试正常",
            "createdAt": "2026-06-20T10:00:00Z",
            "updatedAt": "2026-06-21T16:00:00Z",
        },
    ])

    _EMERGENCIES.extend([
        {
            "id": _uuid(),
            "sessionId": "session-004",
            "emergencyType": "medical",
            "location": "灵山大佛平台东侧",
            "contact": "139****5678",
            "description": "老人突发头晕，需要医护人员",
            "status": "arrived",
            "dispatcher": "医务室 刘医生",
            "resolvedAt": None,
            "createdAt": "2026-06-22T11:20:00Z",
            "updatedAt": "2026-06-22T11:35:00Z",
        },
        {
            "id": _uuid(),
            "sessionId": "session-005",
            "emergencyType": "lost",
            "location": "九龙灌浴",
            "contact": "",
            "description": "5岁男孩走失，穿蓝色T恤，叫乐乐",
            "status": "resolved",
            "dispatcher": "安保部 赵队长",
            "resolvedAt": "2026-06-21T15:10:00Z",
            "createdAt": "2026-06-21T14:30:00Z",
            "updatedAt": "2026-06-21T15:10:00Z",
        },
    ])

    _FEEDBACKS.extend([
        {
            "id": _uuid(),
            "sessionId": "session-006",
            "messageId": None,
            "rating": 5,
            "resolved": True,
            "comment": "AI 导游回答很准确，灵山大佛的历史讲得很好",
            "createdAt": "2026-06-22T16:00:00Z",
        },
        {
            "id": _uuid(),
            "sessionId": "session-007",
            "messageId": None,
            "rating": 2,
            "resolved": False,
            "comment": "排队等待时间太长，建议优化叫号系统",
            "createdAt": "2026-06-22T15:30:00Z",
        },
        {
            "id": _uuid(),
            "sessionId": "session-008",
            "messageId": None,
            "rating": 1,
            "resolved": False,
            "comment": "AI 回答答非所问，问门票价格回答的是开放时间",
            "createdAt": "2026-06-22T14:45:00Z",
        },
    ])


_seed()


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
    """列表工单 — 支持按状态/分类筛选和分页"""
    trace_id = request.state.trace_id
    items = _WORK_ORDERS

    if status:
        items = [o for o in items if o["status"] == status]
    if category:
        items = [o for o in items if o["category"] == category]

    # 按创建时间倒序
    items = sorted(items, key=lambda o: o["createdAt"], reverse=True)
    total = len(items)

    start = (page - 1) * page_size
    end = start + page_size

    return ok({
        "items": items[start:end],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }, trace_id)


@router.get("/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request):
    """工单详情"""
    trace_id = request.state.trace_id
    for o in _WORK_ORDERS:
        if o["id"] == order_id:
            return ok(o, trace_id)
    return err(40413, "工单不存在", trace_id)


@router.post("/work-orders/{order_id}/handle")
def handle_work_order(order_id: str, request: Request):
    """处理工单 — 设置处理人并标记 processing"""
    trace_id = request.state.trace_id
    for o in _WORK_ORDERS:
        if o["id"] == order_id:
            o["status"] = "processing"
            o["handler"] = "管理员"
            o["updatedAt"] = _now()
            return ok({"workOrderId": order_id, "status": "processing"}, trace_id)
    return err(40413, "工单不存在", trace_id)


@router.post("/work-orders/{order_id}/resolve")
def resolve_work_order(order_id: str, body: ResolveRequest = None, request: Request = None):
    """解决工单 — 标记为已解决"""
    trace_id = request.state.trace_id
    resolution = body.resolution if body else "已处理"

    for o in _WORK_ORDERS:
        if o["id"] == order_id:
            o["status"] = "resolved"
            o["resolution"] = resolution
            o["updatedAt"] = _now()
            return ok({"workOrderId": order_id, "status": "resolved"}, trace_id)
    return err(40413, "工单不存在", trace_id)


@router.post("/work-orders/{order_id}/close")
def close_work_order(order_id: str, request: Request):
    """关闭工单"""
    trace_id = request.state.trace_id
    for o in _WORK_ORDERS:
        if o["id"] == order_id:
            o["status"] = "closed"
            o["updatedAt"] = _now()
            return ok({"workOrderId": order_id, "status": "closed"}, trace_id)
    return err(40413, "工单不存在", trace_id)


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
    """列表应急求助"""
    trace_id = request.state.trace_id
    items = _EMERGENCIES
    if status:
        items = [e for e in items if e["status"] == status]
    items = sorted(items, key=lambda e: e["createdAt"], reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return ok({
        "items": items[start:end],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }, trace_id)


@router.get("/emergencies/{emergency_id}")
def get_emergency(emergency_id: str, request: Request):
    """应急详情"""
    trace_id = request.state.trace_id
    for e in _EMERGENCIES:
        if e["id"] == emergency_id:
            return ok(e, trace_id)
    return err(40414, "应急请求不存在", trace_id)


@router.post("/emergencies/{emergency_id}/dispatch")
def dispatch_emergency(emergency_id: str, request: Request):
    """派单处理"""
    trace_id = request.state.trace_id
    for e in _EMERGENCIES:
        if e["id"] == emergency_id:
            e["status"] = "dispatching"
            e["dispatcher"] = "管理员"
            e["updatedAt"] = _now()
            return ok({"emergencyId": emergency_id, "status": "dispatching"}, trace_id)
    return err(40414, "应急请求不存在", trace_id)


@router.post("/emergencies/{emergency_id}/resolve")
def resolve_emergency(emergency_id: str, request: Request):
    """标记应急已解决"""
    trace_id = request.state.trace_id
    for e in _EMERGENCIES:
        if e["id"] == emergency_id:
            e["status"] = "resolved"
            e["resolvedAt"] = _now()
            e["updatedAt"] = _now()
            return ok({"emergencyId": emergency_id, "status": "resolved"}, trace_id)
    return err(40414, "应急请求不存在", trace_id)


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
    """列表用户反馈 — 支持按评分筛选（如只看差评）"""
    trace_id = request.state.trace_id
    items = _FEEDBACKS
    if min_rating is not None:
        items = [f for f in items if (f["rating"] or 5) <= min_rating]
    items = sorted(items, key=lambda f: f["createdAt"], reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    end = start + page_size
    return ok({
        "items": items[start:end],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }, trace_id)
