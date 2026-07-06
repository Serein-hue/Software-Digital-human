"""Database access for scenic-dh-business-api.

SQLAlchemy is the primary ORM for scenic reference data and journey records.
Some lightweight operational tables are also exposed through sqlite3 helpers
because several routers share them directly with admin-api.
"""

import sqlite3
import threading
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.config import settings

Base = declarative_base()

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_local = threading.local()
_migrated = False


def _get_db_path() -> str:
    url = settings.DATABASE_URL
    if url.startswith("sqlite:///"):
        return url[len("sqlite:///"):]
    return url


def get_conn() -> sqlite3.Connection:
    global _migrated
    if not hasattr(_local, "conn") or _local.conn is None:
        db_path = _get_db_path()
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        _local.conn = conn
        _init_operational_tables(conn)
        if not _migrated:
            _migrated = True
            _run_migration(conn)
    return _local.conn


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


DbSession = Annotated[Session, Depends(get_db)]


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    get_conn()


def _init_operational_tables(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS feedbacks (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL DEFAULT '',
            type TEXT NOT NULL DEFAULT 'feedback',
            content TEXT NOT NULL DEFAULT '',
            contact TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT '',
            rating INTEGER DEFAULT 3,
            resolved INTEGER DEFAULT 0,
            comment TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS work_orders (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL DEFAULT '',
            category TEXT NOT NULL DEFAULT 'complaint',
            description TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '',
            contact TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            handler TEXT DEFAULT NULL,
            resolution TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS emergencies (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL DEFAULT '',
            emergency_type TEXT NOT NULL DEFAULT 'sos',
            description TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '',
            contact TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'pending',
            dispatcher TEXT DEFAULT NULL,
            resolved_at TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            openid TEXT UNIQUE NOT NULL,
            nickname TEXT NOT NULL DEFAULT '',
            avatar TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT 'visitor',
            staff_name TEXT DEFAULT NULL,
            staff_title TEXT DEFAULT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login TEXT DEFAULT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_session_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS locations (
            session_id TEXT PRIMARY KEY,
            latitude REAL NOT NULL DEFAULT 0,
            longitude REAL NOT NULL DEFAULT 0,
            accuracy REAL DEFAULT 0,
            near_spot_id TEXT DEFAULT '',
            reported_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        """
    )
    conn.commit()


def _run_migration(conn: sqlite3.Connection) -> None:
    cursor = conn.execute("PRAGMA table_info(feedbacks)")
    cols = {row[1] for row in cursor.fetchall()}
    if "type" not in cols:
        conn.execute("DROP TABLE IF EXISTS feedbacks")
        conn.executescript(
            """
            CREATE TABLE feedbacks (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL DEFAULT '',
                type TEXT NOT NULL DEFAULT 'feedback',
                content TEXT NOT NULL DEFAULT '',
                contact TEXT NOT NULL DEFAULT '',
                image TEXT NOT NULL DEFAULT '',
                location TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                rating INTEGER DEFAULT 3,
                resolved INTEGER DEFAULT 0,
                comment TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            """
        )
        conn.commit()
