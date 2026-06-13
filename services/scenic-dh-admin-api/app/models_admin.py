"""admin-api ORM 模型 — 管理员、角色、权限、内容版本、人设、播报日志"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Boolean, JSON, Text, ForeignKey
from app.database import Base


def _utcnow():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _uuid():
    return str(uuid.uuid4())


class Role(Base):
    """角色"""
    __tablename__ = "admin_roles"

    id = Column(String(32), primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200), default="")
    created_at = Column(String(32), default=_utcnow)


class Permission(Base):
    """权限 — 每个条目表示一个操作范围"""
    __tablename__ = "admin_permissions"

    id = Column(String(36), primary_key=True, default=_uuid)
    role_id = Column(String(32), ForeignKey("admin_roles.id"), nullable=False, index=True)
    resource = Column(String(50), nullable=False)       # e.g. "spots", "notices", "knowledge", "system"
    action = Column(String(20), nullable=False)          # e.g. "create", "read", "update", "delete", "publish"
    scope = Column(String(50), default="*")              # 范围: "*" = 全部, 或具体 id


class AdminUser(Base):
    """管理员用户"""
    __tablename__ = "admin_users"

    id = Column(String(36), primary_key=True, default=_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)   # SHA-256 或 bcrypt hash
    display_name = Column(String(100), default="")
    role_id = Column(String(32), ForeignKey("admin_roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(String(32), default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class SessionToken(Base):
    """管理员登录 session"""
    __tablename__ = "admin_session_tokens"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("admin_users.id"), nullable=False, index=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    expires_at = Column(String(32), nullable=False)
    created_at = Column(String(32), default=_utcnow)


class ContentVersion(Base):
    """内容版本管理 — 发布审批流"""
    __tablename__ = "content_versions"

    id = Column(String(36), primary_key=True, default=_uuid)
    content_type = Column(String(32), nullable=False, index=True)  # "spot", "notice", "event", "ticket", "guide"
    content_id = Column(String(32), nullable=False)                 # 对应业务表的主键
    version = Column(Integer, default=1)
    status = Column(String(20), default="draft")                    # draft / review / published / rejected / archived
    data = Column(JSON, default=dict)                               # 完整的版本快照
    change_log = Column(String(500), default="")
    created_by = Column(String(36), nullable=True)
    reviewed_by = Column(String(36), default=None, nullable=True)
    reviewed_at = Column(String(32), default=None, nullable=True)
    reject_reason = Column(String(500), default=None, nullable=True)
    published_at = Column(String(32), default=None, nullable=True)
    created_at = Column(String(32), default=_utcnow)


class PersonaConfig(Base):
    """数字人人设配置"""
    __tablename__ = "persona_configs"

    id = Column(String(32), primary_key=True)             # "P1", "P2"
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    tone = Column(String(32), default="friendly")
    system_prompt = Column(Text, default="")
    fallback_policy = Column(JSON, default=dict)
    tools_enabled = Column(JSON, default=list)
    status = Column(String(20), default="active")        # active / draft / archived
    version = Column(Integer, default=1)
    updated_at = Column(String(32), default=_utcnow)


class BroadcastLog(Base):
    """播报记录"""
    __tablename__ = "broadcast_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    text = Column(Text, nullable=False)
    target = Column(String(20), default="all")
    target_id = Column(String(36), default=None, nullable=True)
    priority = Column(String(10), default="normal")
    status = Column(String(20), default="queued")        # queued / sending / sent / failed
    error = Column(Text, default=None, nullable=True)
    created_by = Column(String(36), nullable=True)
    created_at = Column(String(32), default=_utcnow)
