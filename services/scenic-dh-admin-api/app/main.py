"""scenic-dh-admin-api: operations management API."""

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
    from app.database import init_db

    logger.info("%s v%s starting on port %s", settings.SERVICE_NAME, settings.SERVICE_VERSION, settings.PORT)
    init_db()
    yield
    logger.info("%s shutting down", settings.SERVICE_NAME)


app = FastAPI(
    title="scenic-dh-admin-api",
    version=settings.SERVICE_VERSION,
    description="Operations API for knowledge, personas, broadcasts, audit, analytics, and runtime control.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TraceMiddleware)
app.middleware("http")(admin_auth_middleware)


@app.get("/health", tags=["Health"])
def health():
    from app.schemas.common import ok

    return ok(
        {
            "status": "ok",
            "version": settings.SERVICE_VERSION,
            "dependencies": {
                "business_api": settings.BUSINESS_API_URL,
                "rag_service": settings.RAG_SERVICE_URL,
                "fay_core": settings.FAY_CORE_URL,
            },
        },
        "startup",
    )


from app.routers import analytics, audit, auth, broadcasts, data_gaps, knowledge, personas, runtime, work_orders  # noqa: E402

app.include_router(auth.router, prefix="/v1")
app.include_router(knowledge.router, prefix="/v1")
app.include_router(personas.router, prefix="/v1")
app.include_router(broadcasts.router, prefix="/v1")
app.include_router(audit.router, prefix="/v1")
app.include_router(analytics.router, prefix="/v1")
app.include_router(runtime.router, prefix="/v1")
app.include_router(data_gaps.router, prefix="/v1")
app.include_router(work_orders.router, prefix="/v1")
