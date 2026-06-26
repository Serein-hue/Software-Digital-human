"""运行控制接口 — Fay 数字人运行时实际控制

将 admin 操作（状态查询、广播、麦克风、清队）透传到 Fay 真实服务。
"""

import logging

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.config import settings
from app.fay_client import (
    send_broadcast,
    toggle_microphone as fay_toggle_mic,
    clear_queue as fay_clear_queue,
)

logger = logging.getLogger("admin-api.runtime")
router = APIRouter(tags=["Runtime"])


# ── 请求模型 ──────────────────────────────────────────────────────────

class BroadcastRequest(BaseModel):
    text: str
    speaker: str = "广播消息"
    user: str = "User"
    queue: bool = True
    audio_url: str | None = None


# ── 端点 ──────────────────────────────────────────────────────────────

@router.get("/runtime/status")
async def get_runtime_status(request: Request):
    """获取数字人运行时状态（真实查询 Fay 多服务）"""
    trace_id = request.state.trace_id

    # 1) Fay core 运行状态
    fay_online = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{settings.FAY_HTTP_URL}/api/get-run-status", data={})
            data = resp.json()
            fay_online = data.get("status", False)
    except Exception:
        fay_online = False

    # 2) 数字人连接状态 — Fay 在线即视为数字人可用
    digital_human = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.FAY_HTTP_URL}/api/get-system-status")
            sys_data = resp.json()
            digital_human = fay_online  # Fay 在线 = 数字人可连接
    except Exception:
        pass

    # 3) MCP 服务状态
    mcp_online = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.FAY_MCP_URL}/api/mcp/servers")
            mcp_online = resp.ok
    except Exception:
        pass

    return ok({
        "fayOnline": fay_online,
        "digitalHumanConnected": digital_human,
        "mcpOnline": mcp_online,
        "ttsOnline": fay_online,
        "speaking": False,
        "queueLength": 0,
        "lastError": None if fay_online else "Fay 未启动",
    }, trace_id=trace_id)


@router.post("/runtime/broadcast")
def broadcast(body: BroadcastRequest, request: Request):
    """通过 Fay 发送广播播报。"""
    trace_id = request.state.trace_id
    result = send_broadcast(
        text=body.text,
        speaker=body.speaker,
        user=body.user,
        queue=body.queue,
        audio_url=body.audio_url,
    )
    if result.get("code", 0) == 0:
        return ok({"text": body.text, "queued": body.queue, "result": result.get("data")}, trace_id=trace_id)
    return err(result["code"], result["message"], trace_id=trace_id)


@router.post("/runtime/microphone/toggle")
def toggle_mic(request: Request):
    """切换 Fay 麦克风开关。"""
    trace_id = request.state.trace_id
    result = fay_toggle_mic()
    return ok(result, trace_id=trace_id)


@router.post("/runtime/clear-queue")
def clear_broadcast_queue(request: Request):
    """清空 Fay 播报队列。"""
    trace_id = request.state.trace_id
    success = fay_clear_queue()
    if success:
        return ok({"queue": "cleared", "queueLength": 0}, trace_id=trace_id)
    return err(500, "Fay queue clear failed", trace_id=trace_id)


@router.get("/runtime/queue")
def get_queue_status(request: Request):
    """获取当前播报队列状态。"""
    trace_id = request.state.trace_id
    from app.fay_client import check_runtime_status
    status = check_runtime_status()
    return ok({
        "queueLength": status.get("queueLength", 0),
        "fayOnline": status.get("fayOnline", False),
        "speaking": status.get("speaking", False),
    }, trace_id=trace_id)
