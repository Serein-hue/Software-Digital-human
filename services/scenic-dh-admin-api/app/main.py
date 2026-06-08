"""scenic-dh-admin-api — 运营管理接口"""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import TraceMiddleware, admin_auth_middleware

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"%(name)s","message":"%(message)s"}',
    stream=sys.stdout,
)
logger = logging.getLogger("admin-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"{settings.SERVICE_NAME} v{settings.SERVICE_VERSION} starting on port {settings.PORT}")
    yield
    logger.info(f"{settings.SERVICE_NAME} shutting down")


app = FastAPI(
    title="scenic-dh-admin-api",
    version=settings.SERVICE_VERSION,
    description="运营管理接口 — 知识库、人设、播报、审计、分析、运行控制",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(TraceMiddleware)
app.middleware("http")(admin_auth_middleware)


@app.get("/health", tags=["Health"])
def health():
    from app.schemas.common import ok
    return ok({
        "status": "ok",
        "version": settings.SERVICE_VERSION,
    }, "startup")


@app.get("/health/ready", tags=["Health"])
def health_ready():
    """就绪探针：检查 DB + 上游服务连通性"""
    from app.schemas.common import ok
    from app.database import SessionLocal
    import httpx
    checks = {}

    # DB
    try:
        db = SessionLocal()
        db.execute(__import__('sqlalchemy').text("SELECT 1"))
        db.close()
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {e}"

    # RAG
    try:
        r = httpx.get(f"{settings.RAG_SERVICE_URL}/api/v1/rag/health", timeout=5)
        checks["rag_service"] = "ok" if r.status_code == 200 else f"status={r.status_code}"
    except Exception as e:
        checks["rag_service"] = f"unreachable: {e}"

    # Business API
    try:
        r = httpx.get(f"{settings.BUSINESS_API_URL}/health", timeout=5)
        checks["business_api"] = "ok" if r.status_code == 200 else f"status={r.status_code}"
    except Exception as e:
        checks["business_api"] = f"unreachable: {e}"

    all_ok = all(v == "ok" for v in checks.values())
    return ok({
        "ready": all_ok,
        "checks": checks,
    }, "readiness-probe")


# Routers
from app.routers import knowledge, personas, broadcasts, audit, analytics, runtime, data_gaps, audit_logs  # noqa: E402
from app.routers import auth, users, roles  # noqa: E402 (P0 新增)

app.include_router(knowledge.router, prefix="/v1")
app.include_router(personas.router, prefix="/v1")
app.include_router(broadcasts.router, prefix="/v1")
app.include_router(audit.router, prefix="/v1")
app.include_router(analytics.router, prefix="/v1")
app.include_router(runtime.router, prefix="/v1")
app.include_router(data_gaps.router, prefix="/v1")
app.include_router(audit_logs.router, prefix="/v1")

# P0 新增：Auth + RBAC + Ops + Content + Config
app.include_router(auth.router, prefix="/v1")
app.include_router(users.router, prefix="/v1")
app.include_router(roles.router, prefix="/v1")

from app.routers import ops, content, config  # noqa: E402
app.include_router(ops.router, prefix="/v1")
app.include_router(content.router, prefix="/v1")
app.include_router(config.router, prefix="/v1")
