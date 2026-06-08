"""admin-api ORM 模型

表:
  users, roles, permissions, audit_logs,
  content_versions, publish_approvals, config_entries
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey,
)
from sqlalchemy.orm import relationship
from shared.database import Base


def _new_id() -> str:
    return uuid.uuid4().hex[:12]


def _utcnow():
    return datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════
# IAM / RBAC
# ═══════════════════════════════════════════════════════════

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(24), primary_key=True, default=_new_id)
    name = Column(String(32), nullable=False, unique=True)
    description = Column(String(256), nullable=True)
    permissions = Column(JSON, default=list)  # ["content:read", "content:write", "users:manage", ...]
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    users = relationship("User", back_populates="role")


class User(Base):
    __tablename__ = "users"

    id = Column(String(24), primary_key=True, default=_new_id)
    username = Column(String(64), nullable=False, unique=True, index=True)
    password_hash = Column(String(256), nullable=False)
    display_name = Column(String(64), nullable=True)
    role_id = Column(String(24), ForeignKey("roles.id"), nullable=False)
    status = Column(String(12), default="active")  # active/disabled
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    role = relationship("Role", back_populates="users")


class RefreshToken(Base):
    """JWT refresh token 存储"""
    __tablename__ = "refresh_tokens"

    id = Column(String(24), primary_key=True, default=_new_id)
    user_id = Column(String(24), ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(256), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 审计日志
# ═══════════════════════════════════════════════════════════

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(24), primary_key=True, default=_new_id)
    action = Column(String(64), nullable=False, index=True)
    operator_id = Column(String(24), nullable=True)
    operator_name = Column(String(64), nullable=True)
    target_type = Column(String(32), nullable=True)  # content/user/role/config/broadcast/knowledge
    target_id = Column(String(24), nullable=True)
    detail = Column(JSON, default=dict)
    diff = Column(JSON, nullable=True)  # 前后差异
    trace_id = Column(String(64), nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=_utcnow, index=True)


# ═══════════════════════════════════════════════════════════
# 内容管理 & 发布审批
# ═══════════════════════════════════════════════════════════

class ContentVersion(Base):
    """内容版本管理：景点/路线/设施/公告/活动/票务"""
    __tablename__ = "content_versions"

    id = Column(String(24), primary_key=True, default=_new_id)
    content_type = Column(String(20), nullable=False, index=True)  # spot/route/facility/notice/event/ticket_policy
    title = Column(String(128), nullable=False)
    body = Column(JSON, nullable=False)  # 类型相关的完整内容体
    version = Column(Integer, default=1)
    status = Column(String(20), default="draft", index=True)
    # draft → pending_review → approved → published / rejected / revoked
    author_id = Column(String(24), ForeignKey("users.id"), nullable=True)
    reviewer_id = Column(String(24), ForeignKey("users.id"), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class PublishApproval(Base):
    """发布审批记录"""
    __tablename__ = "publish_approvals"

    id = Column(String(24), primary_key=True, default=_new_id)
    content_id = Column(String(24), ForeignKey("content_versions.id"), nullable=False, index=True)
    action = Column(String(16), nullable=False)  # approve/reject/revoke
    comment = Column(Text, nullable=True)
    reviewer_id = Column(String(24), ForeignKey("users.id"), nullable=True)
    diff = Column(JSON, nullable=True)  # 版本间差异
    created_at = Column(DateTime, default=_utcnow)


# ═══════════════════════════════════════════════════════════
# 运营聚合 & 配置
# ═══════════════════════════════════════════════════════════

class ConfigEntry(Base):
    """admin-api 配置项"""
    __tablename__ = "config_entries"

    id = Column(String(24), primary_key=True, default=_new_id)
    key = Column(String(64), nullable=False, unique=True, index=True)
    value = Column(JSON, nullable=False)
    value_type = Column(String(12), default="json")  # string/number/boolean/json
    description = Column(String(256), nullable=True)
    updated_by = Column(String(64), nullable=True)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


# ═══════════════════════════════════════════════════════════
# 工单中心（admin 侧继承 business 工单）
# ═══════════════════════════════════════════════════════════

class WorkOrderRecord(Base):
    """admin 侧工单处理记录"""
    __tablename__ = "work_order_records"

    id = Column(String(24), primary_key=True, default=_new_id)
    work_order_id = Column(String(24), nullable=False, index=True)  # 对应 business work_orders.id
    action = Column(String(32), nullable=False)  # assign/note/process/resolve/close/reopen
    operator_id = Column(String(24), ForeignKey("users.id"), nullable=True)
    comment = Column(Text, nullable=True)
    old_status = Column(String(16), nullable=True)
    new_status = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
