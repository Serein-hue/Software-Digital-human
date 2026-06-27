"""Runtime control endpoints that proxy admin operations to Fay."""

import logging

import httpx
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.config import settings
from app.fay_client import clear_queue as fay_clear_queue
from app.fay_client import send_broadcast
from app.fay_client import toggle_microphone as fay_toggle_mic
from app.schemas.common import err, ok

logger = logging.getLogger("admin-api.runtime")
router = APIRouter(tags=["Runtime"])


class BroadcastRequest(BaseModel):
    text: str
    speaker: str = "广播消息"
    user: str = "User"
    queue: bool = True
    audio_url: str | None = None


@router.get("/runtime/status")
async def get_runtime_status(request: Request):
    trace_id = request.state.trace_id

    fay_online = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{settings.FAY_HTTP_URL}/api/get-run-status", data={})
            data = resp.json()
            fay_online = bool(data.get("status", False))
    except Exception:
        fay_online = False

    digital_human = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.get(f"{settings.FAY_HTTP_URL}/api/get-system-status")
            digital_human = fay_online
    except Exception:
        pass

    mcp_online = False
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.FAY_MCP_URL}/api/mcp/servers")
            mcp_online = resp.is_success
    except Exception:
        pass

    return ok(
        {
            "fayOnline": fay_online,
            "digitalHumanConnected": digital_human,
            "mcpOnline": mcp_online,
            "ttsOnline": fay_online,
            "speaking": False,
            "queueLength": 0,
            "lastError": None if fay_online else "Fay 未启动",
        },
        trace_id=trace_id,
    )


@router.post("/runtime/broadcast")
def broadcast(body: BroadcastRequest, request: Request):
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
    trace_id = request.state.trace_id
    result = fay_toggle_mic()
    return ok(result, trace_id=trace_id)


@router.post("/runtime/clear-queue")
def clear_broadcast_queue(request: Request):
    trace_id = request.state.trace_id
    success = fay_clear_queue()
    if success:
        return ok({"queue": "cleared", "queueLength": 0}, trace_id=trace_id)
    return err(500, "Fay queue clear failed", trace_id=trace_id)


@router.get("/runtime/queue")
def get_queue_status(request: Request):
    trace_id = request.state.trace_id
    from app.fay_client import check_runtime_status

    status = check_runtime_status()
    return ok(
        {
            "queueLength": status.get("queueLength", 0),
            "fayOnline": status.get("fayOnline", False),
            "speaking": status.get("speaking", False),
        },
        trace_id=trace_id,
    )
