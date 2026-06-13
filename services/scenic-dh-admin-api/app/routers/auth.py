"""管理员认证 — 登录/登出/当前用户"""

import hashlib
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.config import settings
from app.database import DbSession
from app.models_admin import AdminUser, SessionToken

router = APIRouter(tags=["Admin Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _get_token_from_header(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


def get_current_user(request: Request, db: DbSession = None) -> dict | None:
    """从请求头解析当前用户（供其他 router 使用）"""
    token_str = _get_token_from_header(request)
    if not token_str:
        return None
    session = db.query(SessionToken).filter(
        SessionToken.token == token_str,
        SessionToken.expires_at > datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    ).first()
    if not session:
        return None
    user = db.query(AdminUser).filter(AdminUser.id == session.user_id).first()
    if not user or not user.is_active:
        return None
    return {"id": user.id, "username": user.username, "displayName": user.display_name, "roleId": user.role_id}


@router.post("/auth/login")
def login(body: LoginRequest, request: Request, db: DbSession = None):
    """管理员登录"""
    trace_id = request.state.trace_id
    user = db.query(AdminUser).filter(AdminUser.username == body.username, AdminUser.is_active == True).first()  # noqa: E712
    if not user or user.password_hash != _hash_password(body.password):
        return err(40100, "用户名或密码错误", trace_id)

    # 生成 token
    token_str = f"adm_{uuid.uuid4().hex}"
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    session = SessionToken(
        user_id=user.id,
        token=token_str,
        expires_at=expires.strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    db.add(session)
    user.last_login = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    db.commit()

    return ok({
        "token": token_str,
        "user": {
            "id": user.id,
            "username": user.username,
            "displayName": user.display_name,
        },
    }, trace_id)


@router.post("/auth/logout")
def logout(request: Request, db: DbSession = None):
    """登出 — 使当前 token 失效"""
    trace_id = request.state.trace_id
    token_str = _get_token_from_header(request)
    if token_str:
        db.query(SessionToken).filter(SessionToken.token == token_str).delete()
        db.commit()
    return ok({"message": "已登出"}, trace_id)


@router.get("/auth/me")
def get_me(request: Request, db: DbSession = None):
    """获取当前登录用户信息"""
    trace_id = request.state.trace_id
    user = get_current_user(request, db)
    if not user:
        return err(40101, "未登录或 token 已过期", trace_id)
    return ok(user, trace_id)
