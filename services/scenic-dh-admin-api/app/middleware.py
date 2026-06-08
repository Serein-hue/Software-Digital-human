"""中间件：trace_id、JWT 鉴权"""

import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings
from app.schemas.common import err

logger = logging.getLogger("admin-api")

# 免鉴权路径
PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json", "/v1/auth/login"}


class TraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("x-trace-id", str(uuid.uuid4()))
        request.state.trace_id = trace_id

        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000

        response.headers["x-trace-id"] = trace_id
        response.headers["x-service"] = settings.SERVICE_NAME
        response.headers["x-elapsed-ms"] = f"{elapsed_ms:.1f}"
        return response


async def admin_auth_middleware(request: Request, call_next):
    """管理端 JWT 鉴权。

    免鉴权路径：/health, /docs, /redoc, /openapi.json, /v1/auth/login
    其他路径：需要 Authorization: Bearer <JWT access_token>
    """
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    trace_id = getattr(request.state, "trace_id", "unknown")

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content=err(40001, "缺少鉴权头", trace_id),
        )

    token = auth[7:]

    # 兼容旧固定 token（开发过渡期，拥有全部权限）
    if token == settings.ADMIN_TOKEN:
        request.state.user = {
            "sub": "legacy-admin",
            "username": "admin",
            "role_id": "legacy",
            "permissions": [
                "content:read", "content:write", "content:approve", "content:revoke",
                "users:read", "users:write", "users:manage",
                "roles:read", "roles:write",
                "work_orders:read", "work_orders:assign", "work_orders:resolve",
                "broadcasts:create", "broadcasts:cancel",
                "knowledge:read", "knowledge:rebuild",
                "runtime:read", "runtime:control",
                "analytics:read",
                "audit:read",
                "config:read", "config:write",
            ],
        }
        return await call_next(request)

    # JWT 验证
    try:
        from app.auth import verify_token
        from app.database import SessionLocal
        from app.models import User

        payload = verify_token(token)

        if payload.get("type") != "access":
            return JSONResponse(
                status_code=401,
                content=err(40100, "请使用 access token", trace_id),
            )

        # 可选：验证用户仍存在且活跃
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == payload["sub"]).first()
            if user is None or user.status != "active":
                return JSONResponse(
                    status_code=401,
                    content=err(40100, "用户不存在或已禁用", trace_id),
                )
        finally:
            db.close()

        request.state.user = payload
        return await call_next(request)

    except Exception as e:
        msg = "鉴权令牌无效"
        if "expired" in str(e).lower() or "exp" in str(e).lower():
            msg = "鉴权令牌已过期"
        return JSONResponse(
            status_code=401,
            content=err(40100, msg, trace_id),
        )
