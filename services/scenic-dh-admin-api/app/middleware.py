"""Trace and authentication middleware for admin-api."""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.config import settings
from app.database import get_user_by_token

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
    public_paths = {"/health", "/docs", "/redoc", "/openapi.json", "/v1/auth/login"}
    if request.method == "OPTIONS" or request.url.path in public_paths:
        return await call_next(request)

    from app.schemas.common import err

    trace_id = getattr(request.state, "trace_id", "unknown")
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return err(40100, "缺少 Authorization 头", trace_id)

    token = auth[7:].strip()
    if settings.ALLOW_LEGACY_ADMIN_TOKEN and settings.ADMIN_TOKEN and token == settings.ADMIN_TOKEN:
        logger.warning("legacy admin token accepted; disable ALLOW_LEGACY_ADMIN_TOKEN outside local demos")
        return await call_next(request)

    try:
        user = get_user_by_token(token)
    except Exception:
        logger.exception("admin token validation failed")
        return err(50300, "认证服务不可用", trace_id)

    if not user:
        return err(40101, "token 无效或已过期", trace_id)

    request.state.admin_user = user
    return await call_next(request)
