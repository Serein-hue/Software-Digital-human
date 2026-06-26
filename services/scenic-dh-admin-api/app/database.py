"""共享数据库 — 反馈、工单、应急求助表

与 business-api 共用同一个 SQLite 文件。
迁移只跑一次，不丢数据。
"""

import sqlite3
import threading
from pathlib import Path

from app.config import settings

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
        _init_tables(conn)
        if not _migrated:
            _migrated = True
            _run_migration(conn)
    return _local.conn


def _init_tables(conn: sqlite3.Connection):
    conn.executescript("""
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
        CREATE TABLE IF NOT EXISTS locations (
            session_id TEXT PRIMARY KEY,
            latitude REAL NOT NULL DEFAULT 0,
            longitude REAL NOT NULL DEFAULT 0,
            accuracy REAL DEFAULT 0,
            near_spot_id TEXT DEFAULT '',
            reported_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    """)
    conn.commit()


def _run_migration(conn: sqlite3.Connection):
    cursor = conn.execute("PRAGMA table_info(feedbacks)")
    cols = {r[1] for r in cursor.fetchall()}
    if "type" not in cols:
        conn.execute("DROP TABLE IF EXISTS feedbacks")
        conn.executescript("""
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
        """)
        conn.commit()
