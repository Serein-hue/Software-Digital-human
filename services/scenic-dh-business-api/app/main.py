"""scenic-dh-business-api — 景区业务域接口

FastAPI 应用入口。负责景点、路线、会话、消息、到达事件、反馈的结构化数据。
"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import TraceMiddleware, internal_auth_middleware

# 日志
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"%(name)s","message":"%(message)s"}',
    stream=sys.stdout,
)
logger = logging.getLogger("business-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{settings.SERVICE_NAME} v{settings.SERVICE_VERSION} starting on port {settings.PORT}")
    yield
    logger.info(f"{settings.SERVICE_NAME} shutting down")


app = FastAPI(
    title="scenic-dh-business-api",
    version=settings.SERVICE_VERSION,
    description="景区业务域接口 — 景点、路线、会话、消息、到达事件、反馈",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 自定义中间件
app.add_middleware(TraceMiddleware)
app.middleware("http")(internal_auth_middleware)


# ═══════════════════════════════════════════
# Health
# ═══════════════════════════════════════════
@app.get("/health", tags=["Health"])
def health():
    from app.schemas.common import ok
    return ok({
        "status": "ok",
        "version": settings.SERVICE_VERSION,
    }, "startup-check")


@app.get("/health/ready", tags=["Health"])
def health_ready():
    """就绪探针：检查 DB + 上游服务连通性"""
    from app.schemas.common import ok
    from app.database import SessionLocal
    checks = {}

    # DB
    try:
        db = SessionLocal()
        db.execute(db.bind if hasattr(db, 'bind') else __import__('sqlalchemy').text("SELECT 1"))
        db.close()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    # RAG
    try:
        import httpx
        r = httpx.get(f"{settings.RAG_SERVICE_URL}/api/v1/rag/health", timeout=5)
        checks["rag_service"] = "ok" if r.status_code == 200 else f"status={r.status_code}"
    except Exception as e:
        checks["rag_service"] = f"unreachable: {e}"

    all_ok = all(v == "ok" for v in checks.values())
    return ok({
        "ready": all_ok,
        "checks": checks,
    }, "readiness-probe")


# ═══════════════════════════════════════════
# Routers
# ═══════════════════════════════════════════
from app.routers import spots, routes, sessions, messages, arrivals, feedback, scenic, rag_proxy, internal  # noqa: E402
# P0 新增
from app.routers import map, qrcode, tickets_ext, reservations, work_orders, emergency, offline  # noqa: E402

app.include_router(spots.router, prefix="/v1")
app.include_router(routes.router, prefix="/v1")
app.include_router(sessions.router, prefix="/v1")
app.include_router(messages.router, prefix="/v1")
app.include_router(arrivals.router, prefix="/v1")
app.include_router(feedback.router, prefix="/v1")
app.include_router(scenic.router, prefix="/v1")
app.include_router(rag_proxy.router, prefix="/v1")
app.include_router(internal.router)  # 不带 prefix，路径自带 /internal/v1/

# P0 新增
app.include_router(map.router, prefix="/v1")
app.include_router(qrcode.router, prefix="/v1")
app.include_router(tickets_ext.router, prefix="/v1")
app.include_router(reservations.router, prefix="/v1")
app.include_router(work_orders.router, prefix="/v1")
app.include_router(emergency.router, prefix="/v1")
app.include_router(offline.router, prefix="/v1")
