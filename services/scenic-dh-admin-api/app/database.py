"""Shared SQLite access for admin-api.

Admin-api reads operational data from the business database and owns a small
set of admin tables for login sessions and role metadata.
"""

import hashlib
import hmac
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.config import settings

_local = threading.local()
_migrated = False
PBKDF2_ITERATIONS = 210_000
LEGACY_DEFAULT_ADMIN_HASH = hashlib.sha256("admin123".encode()).hexdigest()


def _utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ITERATIONS).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${digest}"


def _verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash.startswith("pbkdf2_sha256$"):
        return False
    try:
        _, iterations, salt, expected = stored_hash.split("$", 3)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(iterations)).hex()
    except ValueError:
        return False
    return hmac.compare_digest(digest, expected)


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


def init_db() -> None:
    get_conn()


def _init_tables(conn: sqlite3.Connection) -> None:
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
        CREATE TABLE IF NOT EXISTS locations (
            session_id TEXT PRIMARY KEY,
            latitude REAL NOT NULL DEFAULT 0,
            longitude REAL NOT NULL DEFAULT 0,
            accuracy REAL DEFAULT 0,
            near_spot_id TEXT DEFAULT '',
            reported_at TEXT NOT NULL DEFAULT (datetime('now'))
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
        CREATE TABLE IF NOT EXISTS admin_roles (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS admin_permissions (
            id TEXT PRIMARY KEY,
            role_id TEXT NOT NULL,
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            scope TEXT NOT NULL DEFAULT '*',
            FOREIGN KEY(role_id) REFERENCES admin_roles(id)
        );
        CREATE TABLE IF NOT EXISTS admin_users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT NOT NULL DEFAULT '',
            role_id TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(role_id) REFERENCES admin_roles(id)
        );
        CREATE TABLE IF NOT EXISTS admin_session_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES admin_users(id)
        );
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT NOT NULL,
            operator TEXT NOT NULL DEFAULT '',
            target TEXT NOT NULL DEFAULT '',
            detail TEXT NOT NULL DEFAULT '{}',
            trace_id TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS system_configs (
            config_key TEXT PRIMARY KEY,
            config_value TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS content_versions (
            id TEXT PRIMARY KEY,
            content_type TEXT NOT NULL,
            content_id TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'draft',
            data TEXT NOT NULL DEFAULT '{}',
            change_log TEXT NOT NULL DEFAULT '',
            created_by TEXT,
            reviewed_by TEXT,
            reviewed_at TEXT,
            reject_reason TEXT,
            published_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(created_by) REFERENCES admin_users(id),
            FOREIGN KEY(reviewed_by) REFERENCES admin_users(id)
        );
        CREATE TABLE IF NOT EXISTS persona_configs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            tone TEXT NOT NULL DEFAULT 'friendly',
            system_prompt TEXT NOT NULL DEFAULT '',
            fallback_policy TEXT NOT NULL DEFAULT '{}',
            tools_enabled TEXT NOT NULL DEFAULT '[]',
            status TEXT NOT NULL DEFAULT 'active',
            version INTEGER DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS broadcast_logs (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            target TEXT NOT NULL DEFAULT 'all',
            target_id TEXT,
            priority TEXT NOT NULL DEFAULT 'normal',
            status TEXT NOT NULL DEFAULT 'queued',
            error TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(created_by) REFERENCES admin_users(id)
        );
        """
    )
    _seed_admin(conn)
    conn.commit()


def _seed_admin(conn: sqlite3.Connection) -> None:
    """初始化或更新管理员角色和引导用户"""
    now = _utcnow()
    conn.execute(
        "INSERT OR IGNORE INTO admin_roles (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("ROLE_ADMIN", "超级管理员", "系统管理员，拥有所有权限", now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO admin_roles (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("ROLE_EDITOR", "内容编辑", "可管理内容但不能修改系统设置", now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO admin_roles (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("ROLE_OPERATOR", "运营管理员", "可查看数据大屏、处理工单，不能管理知识库", now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO admin_roles (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("ROLE_SERVICE", "客服人员", "仅可处理工单和查看反馈", now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO admin_roles (id, name, description, created_at) VALUES (?, ?, ?, ?)",
        ("ROLE_VIEWER", "游客", "仅可查看公开信息", now),
    )
    _seed_permissions(conn)
    _seed_system_configs(conn)
    active_admins = conn.execute("SELECT COUNT(*) FROM admin_users WHERE is_active = 1").fetchone()[0]
    if active_admins == 0 and settings.ADMIN_BOOTSTRAP_PASSWORD:
        password_hash = _hash_password(settings.ADMIN_BOOTSTRAP_PASSWORD)
        updated = conn.execute(
            """
            UPDATE admin_users
            SET password_hash = ?, display_name = ?, role_id = ?, is_active = 1
            WHERE username = ?
            """,
            (password_hash, settings.ADMIN_BOOTSTRAP_DISPLAY_NAME, "ROLE_ADMIN", settings.ADMIN_BOOTSTRAP_USERNAME),
        ).rowcount
        if updated == 0:
            conn.execute(
                """
                INSERT INTO admin_users
                    (id, username, password_hash, display_name, role_id, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(uuid.uuid4()),
                    settings.ADMIN_BOOTSTRAP_USERNAME,
                    password_hash,
                    settings.ADMIN_BOOTSTRAP_DISPLAY_NAME,
                    "ROLE_ADMIN",
                    1,
                    now,
                ),
            )


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
    conn.execute(
        "UPDATE admin_users SET is_active = 0 WHERE username = ? AND password_hash = ?",
        ("admin", LEGACY_DEFAULT_ADMIN_HASH),
    )
    _seed_admin(conn)
    conn.commit()


def _seed_permissions(conn: sqlite3.Connection) -> None:
    """播种权限数据，为每个角色定义可访问的资源"""
    existing = conn.execute("SELECT COUNT(*) FROM admin_permissions").fetchone()[0]
    if existing > 0:
        return
    permissions = [
        # 超级管理员 — 所有资源所有操作
        ("ROLE_ADMIN", "*", "*", "*"),
        # 内容编辑 — 景点/公告/活动/知识库 读写
        ("ROLE_EDITOR", "spots", "read", "*"),
        ("ROLE_EDITOR", "spots", "update", "*"),
        ("ROLE_EDITOR", "notices", "create", "*"),
        ("ROLE_EDITOR", "notices", "read", "*"),
        ("ROLE_EDITOR", "notices", "update", "*"),
        ("ROLE_EDITOR", "events", "create", "*"),
        ("ROLE_EDITOR", "events", "read", "*"),
        ("ROLE_EDITOR", "events", "update", "*"),
        ("ROLE_EDITOR", "knowledge", "read", "*"),
        ("ROLE_EDITOR", "knowledge", "update", "*"),
        ("ROLE_EDITOR", "digital_human", "read", "*"),
        # 运营管理员 — 大屏/工单/应急/反馈 读写
        ("ROLE_OPERATOR", "analytics", "read", "*"),
        ("ROLE_OPERATOR", "work_orders", "read", "*"),
        ("ROLE_OPERATOR", "work_orders", "update", "*"),
        ("ROLE_OPERATOR", "emergencies", "read", "*"),
        ("ROLE_OPERATOR", "emergencies", "update", "*"),
        ("ROLE_OPERATOR", "feedbacks", "read", "*"),
        ("ROLE_OPERATOR", "notices", "read", "*"),
        ("ROLE_OPERATOR", "runtime", "read", "*"),
        ("ROLE_OPERATOR", "runtime", "update", "*"),
        # 客服人员 — 仅工单和反馈
        ("ROLE_SERVICE", "work_orders", "read", "*"),
        ("ROLE_SERVICE", "work_orders", "update", "*"),
        ("ROLE_SERVICE", "emergencies", "read", "*"),
        ("ROLE_SERVICE", "emergencies", "update", "*"),
        ("ROLE_SERVICE", "feedbacks", "read", "*"),
        # 游客 — 仅基本信息
        ("ROLE_VIEWER", "spots", "read", "*"),
        ("ROLE_VIEWER", "routes", "read", "*"),
        ("ROLE_VIEWER", "notices", "read", "*"),
    ]
    import uuid
    for role_id, resource, action, scope in permissions:
        conn.execute(
            "INSERT OR IGNORE INTO admin_permissions (id, role_id, resource, action, scope) VALUES (?, ?, ?, ?, ?)",
            (str(uuid.uuid4()), role_id, resource, action, scope),
        )
    conn.commit()


def _seed_system_configs(conn: sqlite3.Connection) -> None:
    """播种系统配置默认值"""
    defaults = [
        ("app_name", "灵山胜境·AI数字人导览", "系统名称"),
        ("app_language", "zh", "默认语言"),
        ("refresh_interval_seconds", "30", "运营大屏自动刷新间隔"),
        ("rag_score_threshold", "0.5", "RAG检索评分阈值"),
        ("rag_top_k_default", "5", "RAG默认检索条数"),
        ("digital_human_default_avatar", "avatar-1", "默认数字人形象ID"),
        ("digital_human_default_voice", "voice-1", "默认数字人音色ID"),
        ("business_api_base", "http://localhost:8001/v1", "导游业务API地址"),
        ("rag_api_base", "http://127.0.0.1:5010/api/v1", "RAG服务API地址"),
    ]
    for key, value, desc in defaults:
        conn.execute(
            "INSERT OR IGNORE INTO system_configs (config_key, config_value, description, updated_at) VALUES (?, ?, ?, ?)",
            (key, value, desc, _utcnow()),
        )
    conn.commit()


def verify_admin_password(username: str, password: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        """
        SELECT id, username, display_name, role_id, is_active, password_hash
        FROM admin_users
        WHERE username = ? AND is_active = 1
        """,
        (username,),
    ).fetchone()
    if not row or not _verify_password(password, row["password_hash"]):
        return None
    user = dict(row)
    user.pop("password_hash", None)
    return user


def create_session_token(user_id: str) -> str:
    conn = get_conn()
    token = f"adm_{uuid.uuid4().hex}"
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    conn.execute(
        """
        INSERT INTO admin_session_tokens (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (str(uuid.uuid4()), user_id, token, expires.strftime("%Y-%m-%dT%H:%M:%SZ"), _utcnow()),
    )
    conn.execute("UPDATE admin_users SET last_login = ? WHERE id = ?", (_utcnow(), user_id))
    conn.commit()
    return token


def get_user_by_token(token: str) -> dict | None:
    conn = get_conn()
    row = conn.execute(
        """
        SELECT u.id, u.username, u.display_name, u.role_id, s.expires_at
        FROM admin_session_tokens s
        JOIN admin_users u ON u.id = s.user_id
        WHERE s.token = ? AND u.is_active = 1
        """,
        (token,),
    ).fetchone()
    if not row:
        return None
    expires = datetime.strptime(row["expires_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        conn.execute("DELETE FROM admin_session_tokens WHERE token = ?", (token,))
        conn.commit()
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "displayName": row["display_name"],
        "roleId": row["role_id"],
    }


def delete_session_token(token: str) -> None:
    conn = get_conn()
    conn.execute("DELETE FROM admin_session_tokens WHERE token = ?", (token,))
    conn.commit()
