"""scenic-dh-business-api: visitor-facing scenic business API."""

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import TraceMiddleware, internal_auth_middleware

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='{"time":"%(asctime)s","level":"%(levelname)s","service":"%(name)s","message":"%(message)s"}',
    stream=sys.stdout,
)
logger = logging.getLogger("business-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("%s v%s starting on port %s", settings.SERVICE_NAME, settings.SERVICE_VERSION, settings.PORT)
    from app.database import init_db

    init_db()
    try:
        from seeds.seed_db import seed

        seed()
    except Exception as exc:
        logger.warning("Seed skipped or failed: %s", exc)
    yield
    logger.info("%s shutting down", settings.SERVICE_NAME)


app = FastAPI(
    title="scenic-dh-business-api",
    version=settings.SERVICE_VERSION,
    description="Visitor business API for scenic areas, spots, routes, sessions, messages, arrivals, and feedback.",
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
app.middleware("http")(internal_auth_middleware)


@app.get("/health", tags=["Health"])
def health():
    from app.schemas.common import ok

    return ok(
        {
            "status": "ok",
            "version": settings.SERVICE_VERSION,
            "dependencies": {
                "rag_service": settings.RAG_SERVICE_URL,
                "avatar_orchestrator": settings.AVATAR_ORCHESTRATOR_URL,
            },
        },
        "startup-check",
    )


from app.routers import arrivals, feedback, internal, messages, operations, rag_proxy, routes, scenic, sessions, spots  # noqa: E402

app.include_router(spots.router, prefix="/v1")
app.include_router(routes.router, prefix="/v1")
app.include_router(sessions.router, prefix="/v1")
app.include_router(messages.router, prefix="/v1")
app.include_router(arrivals.router, prefix="/v1")
app.include_router(feedback.router, prefix="/v1")
app.include_router(scenic.router, prefix="/v1")
app.include_router(rag_proxy.router, prefix="/v1")
app.include_router(operations.router, prefix="/v1")
app.include_router(internal.router)
