"""SQLAlchemy ORM 模型 — business-api 所有数据表"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, Text, ForeignKey
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _uuid():
    return str(uuid.uuid4())


# ═══════════════════════════════════════════════════════════════════════
# 参考数据（由 seed 脚本写入，id 固定）
# ═══════════════════════════════════════════════════════════════════════

class Spot(Base):
    """景点"""
    __tablename__ = "spots"

    id = Column(String(32), primary_key=True)          # e.g. "LS-001"
    scenic_id = Column(String(32), default="SA-001", nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    tags = Column(JSON, default=list)
    location = Column(String(200), default="")
    summary = Column(Text, default="")
    intro = Column(Text, default="")
    highlights = Column(JSON, default=list)
    source = Column(String(50), default="public_demo_package")
    freshness_level = Column(String(20), default="high")


class SpotGuide(Base):
    """景点讲解词"""
    __tablename__ = "spot_guides"

    id = Column(String(32), primary_key=True)
    spot_id = Column(String(32), ForeignKey("spots.id"), nullable=False, index=True)
    short_text = Column(Text, default="")
    brief_text = Column(Text, default="")
    long_text = Column(Text, default="")
    fallback_text = Column(Text, default="")


class Route(Base):
    """路线模板"""
    __tablename__ = "routes"

    id = Column(String(32), primary_key=True)          # e.g. "RT-001"
    scenic_id = Column(String(32), default="SA-001", index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(32), default="general")       # culture / nature / family
    duration = Column(String(50), default="")
    persona = Column(String(200), default="")
    tips = Column(Text, default="")
    source = Column(String(50), default="public_demo_package")


class RouteStop(Base):
    """路线停靠点"""
    __tablename__ = "route_stops"

    id = Column(String(32), primary_key=True)
    route_id = Column(String(32), ForeignKey("routes.id"), nullable=False, index=True)
    order = Column(Integer, default=0)
    spot_id = Column(String(32), default="")
    spot_name = Column(String(100), default="")
    stay_duration = Column(String(50), default="")
    description = Column(Text, default="")


class Notice(Base):
    """公告"""
    __tablename__ = "notices"

    id = Column(String(32), primary_key=True)
    scenic_id = Column(String(32), default="SA-001", index=True)
    type = Column(String(20), default="info")          # info / alert / warning
    title = Column(String(200), nullable=False)
    content = Column(Text, default="")
    active = Column(Boolean, default=True)
    expires_at = Column(String(32), default="")        # ISO datetime string


class Event(Base):
    """活动 / 演出"""
    __tablename__ = "events"

    id = Column(String(32), primary_key=True)
    scenic_id = Column(String(32), default="SA-001", index=True)
    name = Column(String(200), nullable=False)
    spot_id = Column(String(32), default="")
    time = Column(String(100), default="")
    description = Column(Text, default="")


class ServiceFacility(Base):
    """服务设施（厕所/餐饮/停车/医务等）"""
    __tablename__ = "service_facilities"

    id = Column(String(32), primary_key=True)
    scenic_id = Column(String(32), default="SA-001", index=True)
    category = Column(String(32), nullable=False)      # toilet / restaurant / parking / help_point
    name = Column(String(100), nullable=False)
    location = Column(String(200), default="")
    location_coords = Column(JSON, default=None)       # {"lat": 31.42, "lng": 120.10}


class TicketProduct(Base):
    """票种口径（只读展示，不做交易）"""
    __tablename__ = "ticket_products"

    id = Column(String(32), primary_key=True)
    scenic_id = Column(String(32), default="SA-001", index=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, default=0)
    status = Column(String(20), default="available")   # available / sold_out / closed
    description = Column(Text, default="")


# ═══════════════════════════════════════════════════════════════════════
# 业务数据（由 API 动态写入，id 自动生成 UUID）
# ═══════════════════════════════════════════════════════════════════════

class ScenicSession(Base):
    """游客会话"""
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=_uuid)
    profile = Column(JSON, default=dict)
    source = Column(String(32), default="web")
    language = Column(String(10), default="zh")
    current_spot_id = Column(String(32), default=None, nullable=True)
    current_route_id = Column(String(32), default=None, nullable=True)
    status = Column(String(20), default="active")      # active / inactive / expired
    created_at = Column(String(32), default=_utcnow)
    updated_at = Column(String(32), default=_utcnow, onupdate=_utcnow)


class Message(Base):
    """对话消息"""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, index=True)
    role = Column(String(10), default="user")          # user / assistant / system
    text = Column(Text, default="")
    citations = Column(JSON, default=list)
    fallback = Column(Boolean, default=False)
    fallback_reason = Column(String(100), default=None, nullable=True)
    confidence = Column(Float, default=None, nullable=True)
    speech_state = Column(String(20), default="done")  # queued / speaking / done / interrupted
    duration_ms = Column(Integer, default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class Feedback(Base):
    """用户反馈"""
    __tablename__ = "feedbacks"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=True)
    message_id = Column(String(36), default=None, nullable=True)
    rating = Column(Integer, default=5)
    resolved = Column(Boolean, default=True)
    comment = Column(Text, default="")
    created_at = Column(String(32), default=_utcnow)


class ArrivalEvent(Base):
    """到达事件"""
    __tablename__ = "arrival_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False, index=True)
    spot_id = Column(String(32), nullable=False)
    location = Column(JSON, default=None)
    trigger = Column(String(20), default="manual")     # manual / scan / gps / beacon
    accepted = Column(Boolean, default=True)
    speech_state = Column(String(20), default="queued")
    created_at = Column(String(32), default=_utcnow)


# ═══════════════════════════════════════════════════════════════════════
# P0 业务模型 — 扫码 / 排队 / 工单 / 应急 / 离线 / 地图
# ═══════════════════════════════════════════════════════════════════════

class QRCodeRule(Base):
    """二维码绑定规则"""
    __tablename__ = "qr_code_rules"

    id = Column(String(32), primary_key=True)
    code = Column(String(100), unique=True, nullable=False, index=True)  # 扫码得到的 code
    target_type = Column(String(20), nullable=False)   # spot / ticket / event / device
    target_id = Column(String(36), nullable=False)
    description = Column(String(200), default="")
    active = Column(Boolean, default=True)
    expires_at = Column(String(32), default="")
    created_at = Column(String(32), default=_utcnow)


class QueueResource(Base):
    """可预约/排队的资源（演出场次、热门点位）"""
    __tablename__ = "queue_resources"

    id = Column(String(32), primary_key=True)
    name = Column(String(100), nullable=False)
    resource_type = Column(String(20), default="show")  # show / spot / event
    spot_id = Column(String(32), default="")
    capacity = Column(Integer, default=100)
    current_count = Column(Integer, default=0)
    status = Column(String(20), default="open")         # open / paused / closed
    schedule = Column(String(100), default="")           # e.g. "每日 10:00, 14:00, 16:00"


class QueueTicket(Base):
    """排队号"""
    __tablename__ = "queue_tickets"

    id = Column(String(36), primary_key=True, default=_uuid)
    resource_id = Column(String(32), ForeignKey("queue_resources.id"), nullable=False, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    queue_number = Column(Integer, nullable=False)
    status = Column(String(20), default="waiting")       # waiting / called / served / expired / cancelled
    call_count = Column(Integer, default=0)
    called_at = Column(String(32), default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class WorkOrder(Base):
    """工单（投诉/反馈/问题处理）"""
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), nullable=True)  # 应用级引用，不设 FK
    category = Column(String(32), default="complaint")   # complaint / suggestion / repair / other
    description = Column(Text, default="")
    location = Column(String(200), default="")
    images = Column(JSON, default=list)
    contact = Column(String(100), default="")
    status = Column(String(20), default="pending")       # pending / processing / resolved / closed
    handler = Column(String(50), default=None, nullable=True)
    resolution = Column(Text, default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)
    updated_at = Column(String(32), default=_utcnow)


class EmergencyRequest(Base):
    """应急求助（SOS/医疗/走失/安保）"""
    __tablename__ = "emergency_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    session_id = Column(String(36), nullable=False)  # 应用级引用
    emergency_type = Column(String(20), nullable=False)   # medical / lost / security / fire / other
    location = Column(String(200), default="")
    location_coords = Column(JSON, default=None)
    contact = Column(String(100), default="")
    description = Column(Text, default="")
    status = Column(String(20), default="pending")       # pending / dispatching / arrived / resolved
    dispatcher = Column(String(50), default=None, nullable=True)
    resolved_at = Column(String(32), default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class User(Base):
    """小程序用户"""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    openid = Column(String(64), unique=True, nullable=False, index=True)
    nickname = Column(String(100), default="")
    avatar = Column(String(500), default="")
    role = Column(String(20), default="visitor")        # visitor / staff
    staff_name = Column(String(50), default=None, nullable=True)
    staff_title = Column(String(50), default=None, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(String(32), default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class UserSessionToken(Base):
    """用户 session token"""
    __tablename__ = "user_session_tokens"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(String(32), nullable=False)
    created_at = Column(String(32), default=_utcnow)


class OfflinePackage(Base):
    """离线包版本"""
    __tablename__ = "offline_packages"

    id = Column(String(36), primary_key=True, default=_uuid)
    version = Column(String(20), nullable=False)
    platform = Column(String(20), default="all")         # all / ios / android / mp
    url = Column(String(500), default="")
    file_hash = Column(String(64), default="")
    size_bytes = Column(Integer, default=0)
    changelog = Column(Text, default="")
    mandatory = Column(Boolean, default=False)
    created_at = Column(String(32), default=_utcnow)


class MapPOI(Base):
    """地图 POI 点位"""
    __tablename__ = "map_pois"

    id = Column(String(32), primary_key=True)
    scenic_id = Column(String(32), default="SA-001", index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100), default="")
    category = Column(String(32), default="spot")        # spot / entrance / exit / toilet / parking / restaurant / help_point / closed_area
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(200), default="")
    tags = Column(JSON, default=list)
    images = Column(JSON, default=list)
    phone = Column(String(32), default="")
    open_time = Column(String(100), default="")
    status = Column(String(20), default="open")          # open / closed / temporary_closed / under_construction
