"""审计日志 — 所有写操作自动记录到 AuditLog 表"""

from sqlalchemy.orm import Session


def audit_log(
    db: Session,
    action: str,
    operator_id: str | None,
    operator_name: str | None,
    target_type: str,
    target_id: str | None = None,
    detail: dict | None = None,
    diff: dict | None = None,
    trace_id: str = "",
    ip_address: str | None = None,
):
    """写入一条审计日志。失败静默忽略，不阻断业务。"""
    from app.models import AuditLog
    try:
        db.add(AuditLog(
            action=action,
            operator_id=operator_id,
            operator_name=operator_name,
            target_type=target_type,
            target_id=target_id,
            detail=detail or {},
            diff=diff,
            trace_id=trace_id,
            ip_address=ip_address,
        ))
    except Exception:
        pass


def get_operator(user_payload: dict | None) -> tuple[str | None, str | None]:
    """从 JWT payload 提取 (operator_id, operator_name)。"""
    if not user_payload:
        return None, None
    return user_payload.get("sub"), user_payload.get("username")
