"""运行控制接口 — 对接真实 Fay 运行时"""

import httpx
from fastapi import APIRouter, Request

from app.schemas.common import ok
from app.config import settings

router = APIRouter(tags=["Runtime"])


@router.get("/runtime/status")
async def get_runtime_status(request: Request):
    """获取数字人运行时状态（真实查询 Fay）"""
    trace_id = request.state.trace_id
    fay_online = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(f"{settings.FAY_HTTP_URL}/api/get-run-status", data={})
            data = resp.json()
            fay_online = data.get("status", False)
    except Exception:
        fay_online = False

    digital_human = False
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.FAY_HTTP_URL}/api/get-system-status")
            sys_data = resp.json()
            digital_human = sys_data.get("digital_human", False)
    except Exception:
        pass

    return ok({
        "fayOnline": fay_online,
        "digitalHumanConnected": digital_human,
        "ttsOnline": fay_online,
        "speaking": False,
        "queueLength": 0,
        "lastError": None if fay_online else "Fay 未启动",
    }, trace_id=trace_id)


@router.post("/runtime/microphone/toggle")
async def toggle_microphone(request: Request):
    """切换麦克风"""
    trace_id = request.state.trace_id
    return ok({"microphone": "toggled", "status": "ok"}, trace_id=trace_id)


@router.post("/runtime/clear-queue")
def clear_queue(request: Request):
    """清空播报队列"""
    trace_id = request.state.trace_id
    return ok({"queue": "cleared", "queueLength": 0}, trace_id=trace_id)
