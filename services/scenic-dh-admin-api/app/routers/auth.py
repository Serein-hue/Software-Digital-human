"""认证路由: POST /v1/auth/login, POST /v1/auth/refresh"""

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import get_db
from app.models import User, RefreshToken
from app.auth import (
    verify_password, create_access_token, create_refresh_token, verify_token,
)
from app.config import settings

router = APIRouter(tags=["Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/auth/login")
def login(body: LoginRequest, request: Request):
    """管理员登录"""
    trace_id = request.state.trace_id

    # 依赖注入手动获取 db（因为 login 不需要鉴权）
    db = next(get_db())
    try:
        user = db.query(User).filter(User.username == body.username).first()
        if user is None or not verify_password(body.password, user.password_hash):
            return err(40100, "用户名或密码错误", trace_id)

        if user.status != "active":
            return err(40100, "账户已被禁用", trace_id)

        # 查询角色权限
        permissions = []
        if user.role:
            permissions = user.role.permissions or []

        access_token = create_access_token(
            user.id, user.username, user.role_id or "", permissions
        )
        refresh_token_str = create_refresh_token(user.id)

        # 持久化 refresh token
        import hashlib
        token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
        from datetime import datetime, timedelta, timezone
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
        db.commit()

        return ok({
            "access_token": access_token,
            "refresh_token": refresh_token_str,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": user.id,
                "username": user.username,
                "display_name": user.display_name,
                "role_id": user.role_id,
                "role_name": user.role.name if user.role else None,
                "permissions": permissions,
            },
        }, trace_id)
    finally:
        db.close()


@router.post("/auth/refresh")
def refresh(body: RefreshRequest, request: Request):
    """刷新 access token"""
    trace_id = request.state.trace_id

    try:
        payload = verify_token(body.refresh_token)
    except Exception:
        return err(40102, "刷新令牌无效或已过期", trace_id)

    if payload.get("type") != "refresh":
        return err(40102, "请使用 refresh token", trace_id)

    db = next(get_db())
    try:
        # 检查 refresh token 是否被撤销
        import hashlib
        token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
        stored = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        ).first()
        if stored is None:
            return err(40102, "刷新令牌已被撤销", trace_id)

        user = db.query(User).filter(User.id == payload["sub"]).first()
        if user is None or user.status != "active":
            return err(40100, "用户不存在或已禁用", trace_id)

        permissions = user.role.permissions if user.role else []
        access_token = create_access_token(
            user.id, user.username, user.role_id or "", permissions
        )

        return ok({
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }, trace_id)
    finally:
        db.close()
