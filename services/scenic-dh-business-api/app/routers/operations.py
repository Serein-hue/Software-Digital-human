"""P0 业务接口 — 扫码 / 排队 / 工单 / 应急 / 离线 / 地图核验

遵循规范：
  - 所有写操作有 trace_id 和操作时间
  - 返回统一 {code, message, data, trace_id} 格式
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.database import DbSession
from app.models import (
    QRCodeRule, QueueResource, QueueTicket,
    WorkOrder, EmergencyRequest, OfflinePackage, MapPOI,
    TicketProduct,
)

router = APIRouter(tags=["Operations"])


# ═══════════════════════════════════════════════════════════════════════
# 二维码扫码解析
# ═══════════════════════════════════════════════════════════════════════

class QRCodeResolveRequest(BaseModel):
    code: str
    session_id: str | None = None


@router.post("/qrcode/resolve")
def resolve_qrcode(body: QRCodeResolveRequest, request: Request, db: DbSession = None):
    """解析二维码 — 返回绑定对象的类型和 ID"""
    trace_id = request.state.trace_id
    rule = db.query(QRCodeRule).filter(
        QRCodeRule.code == body.code,
        QRCodeRule.active == True,  # noqa: E712
    ).first()
    if not rule:
        return err(40410, f"二维码 {body.code} 无效或已停用", trace_id)
    return ok({
        "code": rule.code,
        "targetType": rule.target_type,
        "targetId": rule.target_id,
        "description": rule.description,
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 排队预约
# ═══════════════════════════════════════════════════════════════════════

@router.get("/queues")
def list_queues(spot_id: str = None, request: Request = None, db: DbSession = None):
    """列出可排队的资源"""
    trace_id = request.state.trace_id
    query = db.query(QueueResource).filter(QueueResource.status == "open")
    if spot_id:
        query = query.filter(QueueResource.spot_id == spot_id)
    resources = query.all()
    return ok({
        "items": [
            {
                "id": r.id,
                "name": r.name,
                "resourceType": r.resource_type,
                "spotId": r.spot_id,
                "capacity": r.capacity,
                "currentCount": r.current_count,
                "status": r.status,
                "schedule": r.schedule,
                "waitingCount": db.query(QueueTicket).filter(
                    QueueTicket.resource_id == r.id,
                    QueueTicket.status == "waiting",
                ).count(),
            }
            for r in resources
        ]
    }, trace_id)


class QueueTicketRequest(BaseModel):
    resource_id: str
    session_id: str


@router.post("/queue/tickets")
def create_queue_ticket(body: QueueTicketRequest, request: Request, db: DbSession = None):
    """取号"""
    trace_id = request.state.trace_id
    resource = db.query(QueueResource).filter(
        QueueResource.id == body.resource_id,
        QueueResource.status == "open",
    ).first()
    if not resource:
        return err(40411, "排队资源不存在或已关闭", trace_id)

    # 检查是否已取号
    existing = db.query(QueueTicket).filter(
        QueueTicket.resource_id == body.resource_id,
        QueueTicket.session_id == body.session_id,
        QueueTicket.status.in_(["waiting", "called"]),
    ).first()
    if existing:
        return err(40010, "您已在该队列中", trace_id)

    # 生成排队号
    max_num = db.query(QueueTicket.queue_number).filter(
        QueueTicket.resource_id == body.resource_id,
    ).order_by(QueueTicket.queue_number.desc()).first()
    next_num = (max_num[0] + 1) if max_num else 1

    ticket = QueueTicket(
        resource_id=body.resource_id,
        session_id=body.session_id,
        queue_number=next_num,
        status="waiting",
    )
    db.add(ticket)
    resource.current_count += 1
    db.commit()
    db.refresh(ticket)

    waiting = db.query(QueueTicket).filter(
        QueueTicket.resource_id == body.resource_id,
        QueueTicket.status == "waiting",
    ).count()

    return ok({
        "ticketId": ticket.id,
        "queueNumber": ticket.queue_number,
        "waitingCount": waiting,
        "status": ticket.status,
    }, trace_id)


@router.get("/queue/tickets/{ticket_id}")
def get_queue_ticket(ticket_id: str, request: Request, db: DbSession = None):
    """查询排队状态"""
    trace_id = request.state.trace_id
    ticket = db.query(QueueTicket).filter(QueueTicket.id == ticket_id).first()
    if not ticket:
        return err(40412, "排队号不存在", trace_id)

    waiting = db.query(QueueTicket).filter(
        QueueTicket.resource_id == ticket.resource_id,
        QueueTicket.status == "waiting",
        QueueTicket.queue_number < ticket.queue_number,
    ).count()

    return ok({
        "ticketId": ticket.id,
        "queueNumber": ticket.queue_number,
        "status": ticket.status,
        "aheadCount": waiting,
        "calledAt": ticket.called_at,
    }, trace_id)


@router.post("/queue/tickets/{ticket_id}/cancel")
def cancel_queue_ticket(ticket_id: str, request: Request, db: DbSession = None):
    """取消排队"""
    trace_id = request.state.trace_id
    ticket = db.query(QueueTicket).filter(QueueTicket.id == ticket_id).first()
    if not ticket:
        return err(40412, "排队号不存在", trace_id)
    if ticket.status not in ("waiting", "called"):
        return err(40011, "当前状态不可取消", trace_id)
    ticket.status = "cancelled"
    db.commit()
    return ok({"ticketId": ticket.id, "status": "cancelled"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 票务核验（只读）
# ═══════════════════════════════════════════════════════════════════════

class TicketVerifyRequest(BaseModel):
    ticket_code: str
    order_id: str | None = None


@router.post("/tickets/verify")
def verify_ticket(body: TicketVerifyRequest, request: Request, db: DbSession = None):
    """票码核验 — 只读查询，不做交易"""
    trace_id = request.state.trace_id
    # MVP: 模拟核验，后端不做完整票务交易
    # 对接真实票务系统后替换为调用第三方接口
    products = db.query(TicketProduct).all()
    ticket_names = [p.name for p in products]

    return ok({
        "ticketCode": body.ticket_code,
        "orderId": body.order_id,
        "status": "valid",
        "ticketNames": ticket_names,
        "verifiedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "disclaimer": "此为票务信息查询，非完整交易系统。购票请通过官方渠道。",
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 工单（反馈/投诉）
# ═══════════════════════════════════════════════════════════════════════

class WorkOrderRequest(BaseModel):
    session_id: str
    category: str = "complaint"
    description: str = ""
    location: str = ""
    images: list[str] = []
    contact: str = ""


@router.post("/work-orders")
def create_work_order(body: WorkOrderRequest, request: Request, db: DbSession = None):
    """创建工单"""
    trace_id = request.state.trace_id
    order = WorkOrder(
        session_id=body.session_id,
        category=body.category,
        description=body.description,
        location=body.location,
        images=body.images,
        contact=body.contact,
        status="pending",
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return ok({
        "workOrderId": order.id,
        "status": order.status,
        "createdAt": order.created_at,
    }, trace_id)


@router.get("/work-orders/{order_id}")
def get_work_order(order_id: str, request: Request, db: DbSession = None):
    """查询工单状态"""
    trace_id = request.state.trace_id
    order = db.query(WorkOrder).filter(WorkOrder.id == order_id).first()
    if not order:
        return err(40413, "工单不存在", trace_id)
    return ok({
        "workOrderId": order.id,
        "category": order.category,
        "description": order.description,
        "status": order.status,
        "handler": order.handler,
        "resolution": order.resolution,
        "createdAt": order.created_at,
        "updatedAt": order.updated_at,
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 应急求助
# ═══════════════════════════════════════════════════════════════════════

class EmergencyRequestIn(BaseModel):
    session_id: str
    emergency_type: str = "medical"
    location: str = ""
    contact: str = ""
    description: str = ""


@router.post("/emergency/requests")
def create_emergency(body: EmergencyRequestIn, request: Request, db: DbSession = None):
    """提交应急求助"""
    trace_id = request.state.trace_id
    emergency = EmergencyRequest(
        session_id=body.session_id,
        emergency_type=body.emergency_type,
        location=body.location,
        contact=body.contact,
        description=body.description,
        status="pending",
    )
    db.add(emergency)
    db.commit()
    db.refresh(emergency)
    return ok({
        "emergencyId": emergency.id,
        "status": "pending",
        "message": "已收到求助，工作人员正在赶往您的位置。紧急情况请拨打景区应急电话。",
        "createdAt": emergency.created_at,
    }, trace_id)


@router.get("/emergency/requests/{emergency_id}")
def get_emergency(emergency_id: str, request: Request, db: DbSession = None):
    """查询应急状态"""
    trace_id = request.state.trace_id
    emergency = db.query(EmergencyRequest).filter(EmergencyRequest.id == emergency_id).first()
    if not emergency:
        return err(40414, "应急请求不存在", trace_id)
    return ok({
        "emergencyId": emergency.id,
        "type": emergency.emergency_type,
        "status": emergency.status,
        "dispatcher": emergency.dispatcher,
        "resolvedAt": emergency.resolved_at,
        "createdAt": emergency.created_at,
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 离线包
# ═══════════════════════════════════════════════════════════════════════

@router.get("/offline-packages/latest")
def get_latest_offline_package(platform: str = "all", request: Request = None, db: DbSession = None):
    """获取最新离线包"""
    trace_id = request.state.trace_id
    pkg = (
        db.query(OfflinePackage)
        .filter((OfflinePackage.platform == platform) | (OfflinePackage.platform == "all"))
        .order_by(OfflinePackage.created_at.desc())
        .first()
    )
    if not pkg:
        return ok({
            "version": None,
            "url": None,
            "fileHash": None,
            "sizeBytes": 0,
            "mandatory": False,
            "changelog": "",
            "message": "暂无离线包",
        }, trace_id)
    return ok({
        "version": pkg.version,
        "platform": pkg.platform,
        "url": pkg.url,
        "fileHash": pkg.file_hash,
        "sizeBytes": pkg.size_bytes,
        "mandatory": pkg.mandatory,
        "changelog": pkg.changelog,
        "createdAt": pkg.created_at,
    }, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 地图 POI
# ═══════════════════════════════════════════════════════════════════════

@router.get("/map/pois")
def list_map_pois(category: str = None, bounds: str = None, request: Request = None, db: DbSession = None):
    """获取地图 POI 数据"""
    trace_id = request.state.trace_id
    query = db.query(MapPOI).filter(MapPOI.status != "closed")
    if category:
        query = query.filter(MapPOI.category == category)
    pois = query.order_by(MapPOI.id).all()
    return ok({
        "items": [
            {
                "id": p.id,
                "name": p.name,
                "nameEn": p.name_en,
                "category": p.category,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "address": p.address,
                "tags": p.tags or [],
                "images": p.images or [],
                "phone": p.phone,
                "openTime": p.open_time,
                "status": p.status,
            }
            for p in pois
        ]
    }, trace_id)


@router.get("/map/layers")
def list_map_layers(request: Request = None):
    """获取地图图层配置"""
    trace_id = request.state.trace_id
    return ok({
        "layers": [
            {"id": "spots", "name": "景点", "type": "poi", "visible": True},
            {"id": "services", "name": "服务设施", "type": "poi", "visible": True},
            {"id": "closed_areas", "name": "关闭区域", "type": "polygon", "visible": True},
            {"id": "routes", "name": "推荐路线", "type": "polyline", "visible": False},
            {"id": "entrances", "name": "出入口", "type": "poi", "visible": True},
        ]
    }, trace_id)
