"""中间件：trace_id、admin 鉴权（兼容旧 token + 新 session token）"""

import uuid
import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings
from app.database import SessionLocal
from app.models_admin import SessionToken, AdminUser

logger = logging.getLogger("admin-api")


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
    """管理端鉴权 — 支持：
    1. 旧版固定 token:  Authorization: Bearer adm-dev-token
    2. 新版 session token: 登录后颁发的 token
    """
    # 公开端点
    if request.url.path in ("/health", "/docs", "/redoc", "/openapi.json"):
        return await call_next(request)
    # 登录接口公开
    if request.url.path == "/v1/admin/auth/login":
        return await call_next(request)

    # CORS 预检请求不需要鉴权
    if request.method == "OPTIONS":
        return await call_next(request)

    from app.schemas.common import err

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        trace_id = getattr(request.state, "trace_id", "unknown")
        return JSONResponse(
            status_code=401,
            content=err(40100, "缺少 Authorization 头", trace_id),
        )

    token = auth[7:].strip()

    # 兼容旧版固定 token
    if token == settings.ADMIN_TOKEN:
        return await call_next(request)

    # 新版 session token 校验
    try:
        db = SessionLocal()
        session = db.query(SessionToken).filter(
            SessionToken.token == token,
        ).first()

        if not session:
            trace_id = getattr(request.state, "trace_id", "unknown")
            db.close()
            return JSONResponse(
                status_code=401,
                content=err(40101, "token 无效或已过期", trace_id),
            )

        # 检查过期
        from datetime import datetime, timezone
        expires = datetime.strptime(session.expires_at, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            db.close()
            trace_id = getattr(request.state, "trace_id", "unknown")
            return JSONResponse(
                status_code=401,
                content=err(40101, "token 已过期，请重新登录", trace_id),
            )

        db.close()
    except Exception:
        # DB 不可用时回退到旧 token
        pass

    return await call_next(request)
