"""数据库连接与会话管理 — SQLAlchemy + SQLite"""

import json
import logging
import sqlalchemy as sa
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session as SASession
from fastapi import Depends
from typing import Annotated

from app.config import settings

logger = logging.getLogger("business-api.db")

# Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 多线程
    echo=False,
    pool_pre_ping=True,
)

# 让 SQLite 启用 WAL 模式 + 外键约束
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI 依赖注入 — 每个请求一个独立 session。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[SASession, Depends(get_db)]


def init_db():
    """创建所有表（幂等）。"""
    from app.models import (  # noqa: F401 — 确保 models 被 import 才会注册
        Spot, SpotGuide, Route, RouteStop,
        ScenicSession, Message, Feedback, ArrivalEvent,
        Notice, Event, ServiceFacility, TicketProduct,
        QRCodeRule, QueueResource, QueueTicket,
        WorkOrder, EmergencyRequest, OfflinePackage, MapPOI,
    )
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created / verified")


def db_to_dict(obj):
    """ORM 对象转 dict，处理 JSON 字段反序列化。"""
    result = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if isinstance(val, memoryview):
            # SQLite JSON 存储为字符串，不需要特殊处理
            val = bytes(val).decode("utf-8") if val else None
        # 如果字段是 JSON 类型且值是字符串，尝试解析
        if isinstance(col.type, sa.JSON) and isinstance(val, str):
            try:
                val = json.loads(val)
            except (json.JSONDecodeError, TypeError):
                pass
        result[col.name] = val
    return result


