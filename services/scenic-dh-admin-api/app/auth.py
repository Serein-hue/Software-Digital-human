"""JWT 鉴权工具

- create_access_token / create_refresh_token
- verify_token / verify_password / hash_password
- get_current_user: FastAPI 依赖，从 Bearer token 解析用户
- require_permission: 权限检查装饰器/依赖
"""

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

security_scheme = HTTPBearer(auto_error=False)


# ═══════════════════════════════════════════
# 密码
# ═══════════════════════════════════════════

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
    return f"sha256${salt}${h}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        algo, salt, h = hashed.split("$", 2)
        return hashlib.sha256(f"{salt}:{password}".encode()).hexdigest() == h
    except (ValueError, AttributeError):
        return False


# ═══════════════════════════════════════════
# JWT
# ═══════════════════════════════════════════

def create_access_token(user_id: str, username: str, role_id: str, permissions: list[str]) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "role_id": role_id,
        "permissions": permissions,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": uuid.uuid4().hex[:12],
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "jti": uuid.uuid4().hex[:12],
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """验证 token 并返回 payload。无效则抛异常。"""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# ═══════════════════════════════════════════
# FastAPI 依赖
# ═══════════════════════════════════════════

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
):
    """从 Bearer token 解析当前用户。非 health/docs 路由必须提供有效 token。"""
    # 白名单路径免鉴权
    path = request.url.path
    if path in ("/health", "/docs", "/redoc", "/openapi.json", "/v1/auth/login"):
        return None

    if credentials is None:
        raise HTTPException(status_code=401, detail="缺少鉴权头")

    token = credentials.credentials

    try:
        payload = verify_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token 已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="token 无效")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="请使用 access token")

    # 从数据库查用户（可选，token 里已有基本信息）
    from app.models import User
    user = db.query(User).filter(User.id == payload["sub"]).first()
    if user is None or user.status != "active":
        raise HTTPException(status_code=401, detail="用户不存在或已禁用")

    payload["_user"] = user
    return payload


def require_permission(permission: str):
    """权限检查依赖工厂。

    用法:
        @router.get("/users")
        async def list_users(user=Depends(require_permission("users:read"))):
            ...
    """
    async def _check(user_payload: dict = Depends(get_current_user)):
        if user_payload is None:
            raise HTTPException(status_code=401, detail="需要登录")
        permissions = user_payload.get("permissions", [])
        if permission not in permissions:
            raise HTTPException(status_code=403, detail=f"缺少权限: {permission}")
        return user_payload
    return _check
