"""business-api ORM 模型

表:
  sessions, messages, arrivals, feedback, work_orders,
  ticket_entitlements, reservations, queue_tickets,
  pois, qr_codes, offline_packages,
  spots, routes, route_stops, notices, events, service_facilities
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import relationship
from shared.database import Base


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _utcnow():
    return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════
# 游客会话与消息
# ═══════════════════════════════════════════════════════════

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(24), primary_key=True, default=_new_id)
    language = Column(String(8), default="zh")
    interests = Column(JSON, default=list)
    group_size = Column(Integer, default=1)
    has_children = Column(Boolean, default=False)
    source = Column(String(16), default="miniprogram")  # web/miniprogram/kiosk/demo
    wechat_openid = Column(String(64), nullable=True)
    privacy_accepted = Column(Boolean, default=False)
    current_spot_id = Column(String(24), nullable=True)
    current_route_id = Column(String(24), nullable=True)
    status = Column(String(12), default="active")  # active/paused/ended
    device_info = Column(JSON, default=dict)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    arrivals = relationship("Arrival", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    role = Column(String(12), nullable=False)  # user/assistant/system
    text = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    fallback = Column(Boolean, default=False)
    fallback_reason = Column(String(64), nullable=True)
    confidence = Column(Float, nullable=True)
    speech_state = Column(String(16), nullable=True)  # queued/speaking/done/failed/interrupted
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    session = relationship("Session", back_populates="messages")


class Arrival(Base):
    __tablename__ = "arrivals"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    spot_id = Column(String(24), nullable=False)
    lat = Column(Float, default=31.42)
    lng = Column(Float, default=120.10)
    trigger = Column(String(12), default="manual")  # lbs/manual/demo
    accepted = Column(Boolean, default=True)
    speech_state = Column(String(12), default="queued")
    created_at = Column(DateTime, default=_utcnow)

    session = relationship("Session", back_populates="arrivals")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    message_id = Column(String(24), nullable=True)
    rating = Column(Integer, nullable=False)  # 1-5
    resolved = Column(Boolean, default=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 工单 & 应急
# ═══════════════════════════════════════════════════════════

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # complaint/feedback/emergency/low_confidence
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(12), default="normal")  # low/normal/high/urgent
    status = Column(String(16), default="pending")  # pending/assigned/processing/resolved/closed
    assignee = Column(String(64), nullable=True)
    sla = Column(String(32), nullable=True)
    images = Column(JSON, default=list)
    loc_lat = Column(Float, nullable=True)
    loc_lng = Column(Float, nullable=True)
    contact_phone = Column(String(20), nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # sos/medical/lost_child/security/other
    description = Column(Text, nullable=True)
    loc_lat = Column(Float, nullable=True)
    loc_lng = Column(Float, nullable=True)
    contact_phone = Column(String(20), nullable=True)
    status = Column(String(16), default="pending")  # pending/dispatched/responding/resolved
    responder_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 票务 & 排队 & 预约
# ═══════════════════════════════════════════════════════════

class TicketEntitlement(Base):
    """票务权益：票种展示 + 订单/票码只读核验"""
    __tablename__ = "ticket_entitlements"

    id = Column(String(24), primary_key=True, default=_new_id)
    product_id = Column(String(24), nullable=False)
    product_name = Column(String(64), nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String(16), default="available")  # available/limited/sold_out
    applicable_group = Column(String(32), nullable=True)  # 适用人群
    refund_policy = Column(Text, nullable=True)
    official_jump_url = Column(String(256), nullable=True)  # 官方购票跳转
    source = Column(String(24), default="manual_seed")
    freshness_level = Column(String(12), default="medium")


class TicketOrder(Base):
    """票务订单（只读核验，不做支付）"""
    __tablename__ = "ticket_orders"

    id = Column(String(24), primary_key=True, default=_new_id)
    product_id = Column(String(24), nullable=False)
    product_name = Column(String(64), nullable=False)
    quantity = Column(Integer, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String(16), default="pending")  # pending/paid/used/refunded/expired
    visit_date = Column(String(16), nullable=True)
    ticket_code = Column(String(64), nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    session_id = Column(String(24), nullable=True)
    created_at = Column(DateTime, default=_utcnow)


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    resource_type = Column(String(16), nullable=False)  # show/spot/facility
    resource_id = Column(String(24), nullable=False)
    resource_name = Column(String(64), nullable=True)
    time_slot = Column(String(32), nullable=False)
    status = Column(String(16), default="booked")  # booked/checked_in/cancelled/expired
    queue_number = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


class QueueTicket(Base):
    __tablename__ = "queue_tickets"

    id = Column(String(24), primary_key=True, default=_new_id)
    session_id = Column(String(24), ForeignKey("sessions.id"), nullable=False, index=True)
    queue_id = Column(String(24), nullable=False)
    queue_name = Column(String(64), nullable=True)
    number = Column(Integer, nullable=False)
    waiting_minutes = Column(Integer, default=0)
    people_ahead = Column(Integer, default=0)
    status = Column(String(12), default="waiting")  # waiting/called/passed/cancelled
    called_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 地图 & POI
# ═══════════════════════════════════════════════════════════

class POI(Base):
    __tablename__ = "pois"

    id = Column(String(24), primary_key=True, default=_new_id)
    name = Column(String(64), nullable=False)
    category = Column(String(20), nullable=False)  # spot/toilet/shop/restaurant/parking/...
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    icon = Column(String(64), nullable=True)
    status = Column(String(16), default="open")  # open/closed/maintenance
    scenic_id = Column(String(24), default="SA-001")
    source = Column(String(24), default="manual_seed")


# ═══════════════════════════════════════════════════════════
# 二维码
# ═══════════════════════════════════════════════════════════

class QRCode(Base):
    __tablename__ = "qr_codes"

    id = Column(String(24), primary_key=True, default=_new_id)
    code = Column(String(128), nullable=False, unique=True, index=True)
    type = Column(String(16), nullable=False)  # spot/ticket/device/event
    target_id = Column(String(24), nullable=False)
    target_name = Column(String(64), nullable=True)
    action = Column(String(24), nullable=False)  # navigate_guide/verify_ticket/queue_number/...
    meta_data = Column(JSON, default=dict)
    status = Column(String(12), default="active")  # active/disabled
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 离线包
# ═══════════════════════════════════════════════════════════

class OfflinePackage(Base):
    __tablename__ = "offline_packages"

    id = Column(String(24), primary_key=True, default=_new_id)
    version = Column(String(16), nullable=False)
    size_bytes = Column(Integer, default=0)
    manifest_spots = Column(Integer, default=0)
    manifest_guides = Column(Integer, default=0)
    manifest_notices = Column(Integer, default=0)
    manifest_maps = Column(Integer, default=0)
    checksum = Column(String(64), nullable=True)
    force_update = Column(Boolean, default=False)
    release_notes = Column(Text, nullable=True)
    download_url = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 景区内容（从种子迁移到 DB，支持后台配置）
# ═══════════════════════════════════════════════════════════

class Spot(Base):
    __tablename__ = "spots"

    id = Column(String(24), primary_key=True, default=_new_id)
    scenic_id = Column(String(24), default="SA-001")
    name = Column(String(64), nullable=False)
    name_en = Column(String(128), nullable=True)
    tags = Column(JSON, default=list)
    location = Column(String(128), nullable=True)
    summary = Column(Text, nullable=True)
    intro = Column(Text, nullable=True)
    highlights = Column(JSON, default=list)
    images = Column(JSON, default=list)
    guide_short = Column(Text, nullable=True)
    guide_brief = Column(Text, nullable=True)
    guide_long = Column(Text, nullable=True)
    guide_fallback = Column(Text, nullable=True)
    source = Column(String(24), default="public_demo_package")
    freshness_level = Column(String(12), default="high")
    status = Column(String(16), default="published")  # draft/published/revoked
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class Route(Base):
    __tablename__ = "routes"

    id = Column(String(24), primary_key=True, default=_new_id)
    scenic_id = Column(String(24), default="SA-001")
    name = Column(String(64), nullable=False)
    type = Column(String(16), nullable=False)  # culture/nature/family/quick
    duration = Column(String(32), nullable=True)
    persona = Column(String(64), nullable=True)
    tips = Column(Text, nullable=True)
    source = Column(String(24), default="public_demo_package")
    status = Column(String(16), default="published")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan",
                         order_by="RouteStop.order")


class RouteStop(Base):
    __tablename__ = "route_stops"

    id = Column(String(24), primary_key=True, default=_new_id)
    route_id = Column(String(24), ForeignKey("routes.id"), nullable=False, index=True)
    order = Column(Integer, nullable=False)
    spot_id = Column(String(24), nullable=True)
    spot_name = Column(String(64), nullable=True)
    stay_duration = Column(String(16), nullable=True)
    description = Column(Text, nullable=True)

    route = relationship("Route", back_populates="stops")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(String(24), primary_key=True, default=_new_id)
    scenic_id = Column(String(24), default="SA-001")
    type = Column(String(16), nullable=False)  # announcement/alert/info/emergency
    title = Column(String(128), nullable=False)
    content = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    priority = Column(String(12), default="normal")
    target_area = Column(String(64), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    source = Column(String(24), default="manual_seed")
    status = Column(String(16), default="published")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class Event(Base):
    __tablename__ = "events"

    id = Column(String(24), primary_key=True, default=_new_id)
    scenic_id = Column(String(24), default="SA-001")
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    spot_id = Column(String(24), nullable=True)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    schedule = Column(JSON, default=list)  # 每日场次
    active = Column(Boolean, default=True)
    source = Column(String(24), default="manual_seed")
    status = Column(String(16), default="published")
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class ServiceFacility(Base):
    __tablename__ = "service_facilities"

    id = Column(String(24), primary_key=True, default=_new_id)
    scenic_id = Column(String(24), default="SA-001")
    category = Column(String(20), nullable=False)  # toilet/shop/restaurant/parking/help_point/medical/nursery/rest_area
    name = Column(String(64), nullable=False)
    location = Column(String(128), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(String(16), default="open")
    source = Column(String(24), default="manual_seed")
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class ConfigEntry(Base):
    """business-api 配置项（功能开关、URL 等）"""
    __tablename__ = "config_entries"

    id = Column(String(24), primary_key=True, default=_new_id)
    key = Column(String(64), nullable=False, unique=True, index=True)
    value = Column(JSON, nullable=False)
    value_type = Column(String(12), default="json")  # string/number/boolean/json
    description = Column(String(256), nullable=True)
    updated_by = Column(String(64), nullable=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
