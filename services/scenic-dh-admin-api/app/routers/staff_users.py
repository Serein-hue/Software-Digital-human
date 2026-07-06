"""员工用户管理 — 小程序用户角色管理

允许 admin 将小程序用户（visitor）升级为 staff 或降级。
"""

import logging
from typing import Optional

from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel

from app.database import get_conn
from app.schemas.common import ok, err

logger = logging.getLogger("admin-api")
router = APIRouter(tags=["Staff Users"])


@router.get("/staff/users")
def list_staff_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    request: Request = None,
):
    """列出小程序用户，支持按角色筛选"""
    trace_id = request.state.trace_id
    conn = get_conn()
    where, params = [], []
    if role:
        where.append("role = ?"); params.append(role)
    where_clause = "WHERE " + " AND ".join(where) if where else ""

    total = conn.execute(f"SELECT COUNT(*) FROM users {where_clause}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT id, openid, nickname, avatar, role, staff_name, staff_title, is_active, last_login, created_at FROM users {where_clause} ORDER BY created_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()

    return ok({
        "items": [dict(r) for r in rows],
        "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": max(1, (total + page_size - 1) // page_size)},
    }, trace_id)


class SetStaffRoleRequest(BaseModel):
    role: str  # "staff" or "visitor"
    staffName: str = ""
    staffTitle: str = ""


@router.post("/staff/users/{user_id}/role")
def set_user_role(user_id: str, body: SetStaffRoleRequest, request: Request):
    """设置用户角色（visitor ↔ staff）"""
    trace_id = request.state.trace_id
    if body.role not in ("staff", "visitor"):
        return err(40001, "角色仅支持 staff 或 visitor", trace_id)

    conn = get_conn()
    existing = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not existing:
        return err(40420, "用户不存在", trace_id)

    conn.execute(
        "UPDATE users SET role = ?, staff_name = ?, staff_title = ? WHERE id = ?",
        (body.role, body.staffName, body.staffTitle, user_id),
    )
    conn.commit()
    return ok({"userId": user_id, "role": body.role, "staffName": body.staffName, "staffTitle": body.staffTitle}, trace_id)
