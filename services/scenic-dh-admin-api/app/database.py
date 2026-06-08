"""admin-api 数据库连接"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from shared.database import (
    Base,
    create_engine_for_service,
    create_session_factory,
    init_db as _init_db,
    get_db as _get_db,
)

from app.config import settings

engine = create_engine_for_service("admin-api", getattr(settings, "DATABASE_URL", None))
SessionLocal = create_session_factory(engine)


def init_db():
    """创建所有表（开发用）。"""
    from app import models  # noqa: F401
    _init_db(engine, Base)


def get_db():
    """FastAPI 依赖注入。"""
    yield from _get_db(SessionLocal)
