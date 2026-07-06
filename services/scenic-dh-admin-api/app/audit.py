"""审计日志模块 — 记录所有管理操作（数据库持久化）"""

import json
import time
import uuid
from typing import Optional

from app.database import get_conn


def log_action(
    action: str,
    operator: str = "admin",
    target: str = "",
    detail: Optional[dict] = None,
    trace_id: str = "",
) -> dict:
    """记录一条审计日志（写入数据库）"""
    entry_id = str(uuid.uuid4())[:12]
    conn = get_conn()
    conn.execute(
        """
        INSERT INTO audit_logs (id, action, operator, target, detail, trace_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            entry_id,
            action,
            operator,
            target,
            json.dumps(detail or {}, ensure_ascii=False),
            trace_id,
            time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        ),
    )
    conn.commit()
    return {
        "id": entry_id,
        "action": action,
        "operator": operator,
        "target": target,
        "detail": detail or {},
        "trace_id": trace_id,
    }


def get_logs(limit: int = 50, action: Optional[str] = None) -> list[dict]:
    """从数据库查询审计日志"""
    conn = get_conn()
    if action:
        rows = conn.execute(
            "SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?",
            (action, limit),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    result = []
    for row in rows:
        entry = dict(row)
        try:
            entry["detail"] = json.loads(entry.get("detail", "{}"))
        except (json.JSONDecodeError, TypeError):
            entry["detail"] = {}
        result.append(entry)
    return result


# 预定义操作类型
ACTION_KNOWLEDGE_REINDEX = "knowledge.reindex"
ACTION_KNOWLEDGE_SOURCE_REGISTER = "knowledge.source.register"
ACTION_PERSONA_UPDATE = "persona.update"
ACTION_BROADCAST_CREATE = "broadcast.create"
ACTION_MESSAGE_ADOPT = "message.adopt"
ACTION_RUNTIME_CLEAR_QUEUE = "runtime.clear_queue"
ACTION_RUNTIME_MIC_TOGGLE = "runtime.microphone.toggle"
