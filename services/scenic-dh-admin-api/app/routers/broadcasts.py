"""人工播报接口 — 对接 Fay 发送消息"""

import uuid
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok
from app.config import settings

router = APIRouter(tags=["Broadcasts"])

_BROADCASTS: list[dict] = []


class BroadcastRequest(BaseModel):
    text: str
    target: str = "all"
    targetId: str | None = None
    priority: str = "normal"


@router.post("/broadcasts")
async def create_broadcast(body: BroadcastRequest, request: Request):
    """创建播报 — 通过 Fay 的 /api/send 发送到数字人"""
    trace_id = request.state.trace_id
    broadcast_id = str(uuid.uuid4())[:8]

    fay_success = False
    fay_message = ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.FAY_HTTP_URL}/api/send",
                data={"data": '{"username": "System", "msg": "' + body.text + '"}'},
            )
            result = resp.json()
            fay_success = result.get("result") == "successful"
            fay_message = result.get("result", "")
    except httpx.ConnectError:
        fay_message = "Fay 未启动"
    except Exception as e:
        fay_message = str(e)

    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    bc = {
        "id": broadcast_id,
        "text": body.text,
        "priority": body.priority,
        "target": body.target,
        "targetId": body.targetId,
        "createdAt": now,
        "status": "sent" if fay_success else "failed",
        "fayResponse": fay_message,
    }
    _BROADCASTS.append(bc)
    return ok({
        "broadcastId": broadcast_id,
        "queueState": "sent" if fay_success else "failed",
        "fayOnline": fay_success,
    }, trace_id=trace_id)


@router.get("/broadcasts")
def list_broadcasts(request: Request):
    """查看播报历史"""
    trace_id = request.state.trace_id
    return ok({"items": _BROADCASTS}, trace_id=trace_id)
