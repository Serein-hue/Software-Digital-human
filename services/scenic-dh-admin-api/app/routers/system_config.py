"""系统配置管理接口 — 读取/更新系统配置项"""

import json
import time

from fastapi import APIRouter, Request

from app.database import get_conn
from app.schemas.common import err, ok

router = APIRouter(tags=["System Config"])


@router.get("/system-config")
def list_configs(request: Request):
    """获取所有系统配置"""
    trace_id = request.state.trace_id
    conn = get_conn()
    rows = conn.execute(
        "SELECT config_key, config_value, description, updated_at FROM system_configs ORDER BY config_key"
    ).fetchall()
    items = [{"key": row["config_key"], "value": row["config_value"], "description": row["description"], "updatedAt": row["updated_at"]} for row in rows]
    return ok({"items": items}, trace_id)


@router.get("/system-config/{config_key}")
def get_config(config_key: str, request: Request):
    """获取单个配置项"""
    trace_id = request.state.trace_id
    conn = get_conn()
    row = conn.execute(
        "SELECT config_key, config_value, description, updated_at FROM system_configs WHERE config_key = ?",
        (config_key,),
    ).fetchone()
    if not row:
        return err(40401, f"配置项 {config_key} 不存在", trace_id)
    return ok({"key": row["config_key"], "value": row["config_value"], "description": row["description"], "updatedAt": row["updated_at"]}, trace_id)


@router.put("/system-config/{config_key}")
def update_config(config_key: str, body: dict, request: Request):
    """更新配置项值"""
    trace_id = request.state.trace_id
    new_value = body.get("value")
    if new_value is None:
        return err(10001, "value 为必填", trace_id)

    conn = get_conn()
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    conn.execute(
        "UPDATE system_configs SET config_value = ?, updated_at = ? WHERE config_key = ?",
        (str(new_value), now, config_key),
    )
    if conn.total_changes == 0:
        return err(40401, f"配置项 {config_key} 不存在", trace_id)
    conn.commit()

    # 记录审计日志
    from app.audit import log_action
    log_action("system.config.update", operator=request.state.admin_user.get("displayName", "admin"), target=config_key, detail={"new_value": new_value}, trace_id=trace_id)

    return ok({"key": config_key, "value": str(new_value), "updatedAt": now}, trace_id)
