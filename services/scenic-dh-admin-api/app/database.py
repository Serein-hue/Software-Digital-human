"""admin-api 数据库 — 共享 SQLite（与 business-api 相同文件）"""

import logging
import os
import sqlalchemy as sa
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session as SASession
from fastapi import Depends
from typing import Annotated

from app.config import settings

logger = logging.getLogger("admin-api.db")

# 解析数据库路径 — 与 business-api 共享 DB
# DATABASE_URL = "sqlite:///./scenic_business.db" → 解析为 project_root/services/scenic-dh-business-api/
_db_url = settings.DATABASE_URL  # e.g. "sqlite:///./scenic_business.db"
if _db_url.startswith("sqlite:///./"):
    # 相对于 business-api 目录
    _filename = _db_url.replace("sqlite:///./", "")
    _admin_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _project_root = os.path.dirname(_admin_dir)  # services/
    _bus_dir = os.path.join(_project_root, "scenic-dh-business-api")
    _db_path = os.path.join(_bus_dir, _filename)
else:
    _db_path = _db_url

engine = create_engine(
    f"sqlite:///{_db_path}",
    connect_args={"check_same_thread": False},
    echo=False,
    pool_pre_ping=True,
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[SASession, Depends(get_db)]


def init_db():
    """创建 admin-api 专属表。业务表由 business-api 启动时创建。"""
    from app.models_admin import (  # noqa: F401
        AdminUser, Role, Permission, ContentVersion,
        PersonaConfig, BroadcastLog,
    )
    Base.metadata.create_all(bind=engine)
    logger.info("Admin tables created / verified")
