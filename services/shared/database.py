"""共享数据库基础层 — SQLAlchemy engine / session / Base

两个服务各自导入:
    from shared.database import Base, get_db, init_db
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite 开发默认值，生产通过环境变量覆盖
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./scenic_dh.db",
)


class Base(DeclarativeBase):
    pass


def _enable_wal(dbapi_connection, connection_record):
    """启用 WAL 模式，提升并发读写性能。"""
    dbapi_connection.execute("PRAGMA journal_mode=WAL")
    dbapi_connection.execute("PRAGMA foreign_keys=ON")


def create_engine_for_service(service_name: str, db_url: str | None = None):
    """为指定服务创建 engine。

    自动添加 SQLite WAL + 外键 PRAGMA。
    """
    url = db_url or DATABASE_URL
    engine = create_engine(
        url,
        connect_args={"check_same_thread": False} if "sqlite" in url else {},
        echo=False,
    )
    if "sqlite" in url:
        event.listen(engine, "connect", _enable_wal)
    return engine


def create_session_factory(engine):
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db(engine, base=None):
    """创建所有表（开发用；生产用 Alembic 迁移）。"""
    if base is None:
        base = Base
    base.metadata.create_all(bind=engine)


def get_db(session_factory):
    """FastAPI 依赖注入：每个请求一个 session。"""
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
