"""运行控制接口"""

from fastapi import APIRouter, Request

from app.audit import ACTION_RUNTIME_CLEAR_QUEUE, ACTION_RUNTIME_MIC_TOGGLE, log_action
from app.schemas.common import ok

router = APIRouter(tags=["Runtime"])

_runtime_state = {
    "fayOnline": True,
    "ttsOnline": True,
    "speaking": False,
    "queueLength": 0,
    "avatarImageUrl": "/fay-robot/Speaking.jpg",
    "avatarImageSource": "fay-runtime",
    "avatarImageSet": {
        "normal": "/fay-robot/Normal.jpg",
        "speaking": "/fay-robot/Speaking.jpg",
        "listening": "/fay-robot/Listening.jpg",
        "thinking": "/fay-robot/Thinking.jpg",
    },
    "avatarConfig": {
        "name": "灵灵 Fay",
        "assetBase": "/fay-robot",
        "model": "fay-robot",
        "transport": "fay-runtime",
        "tts": "local-tts",
        "vad": "runtime-microphone",
        "transparentPassUser": "User",
        "liveEndpoint": "/api/start-live",
    },
    "lastError": None,
}


@router.get("/runtime/status")
def get_runtime_status(request: Request):
    trace_id = request.state.trace_id
    return ok(_runtime_state, trace_id=trace_id)


@router.post("/runtime/microphone/toggle")
def toggle_microphone(request: Request):
    trace_id = request.state.trace_id
    log_action(ACTION_RUNTIME_MIC_TOGGLE, operator="admin-console", target="microphone", detail={"status": "ok"}, trace_id=trace_id)
    return ok({"microphone": "toggled", "status": "ok"}, trace_id=trace_id)


@router.post("/runtime/clear-queue")
def clear_queue(request: Request):
    trace_id = request.state.trace_id
    _runtime_state["queueLength"] = 0
    log_action(ACTION_RUNTIME_CLEAR_QUEUE, operator="admin-console", target="broadcast-queue", detail={"queueLength": 0}, trace_id=trace_id)
    return ok({"queue": "cleared", "queueLength": 0}, trace_id=trace_id)


@router.post("/runtime/config")
async def update_runtime_config(request: Request):
    trace_id = request.state.trace_id
    payload = await request.json()
    if isinstance(payload, dict):
        config = _runtime_state.setdefault("avatarConfig", {})
        if isinstance(config, dict):
            allowed = {"name", "assetBase", "model", "transport", "tts", "vad", "transparentPassUser", "liveEndpoint"}
            for key, value in payload.items():
                if key in allowed and isinstance(value, str):
                    config[key] = value
            asset_base = config.get("assetBase", "/fay-robot")
            if isinstance(asset_base, str) and asset_base:
                _runtime_state["avatarImageUrl"] = f"{asset_base}/Speaking.jpg"
                _runtime_state["avatarImageSet"] = {
                    "normal": f"{asset_base}/Normal.jpg",
                    "speaking": f"{asset_base}/Speaking.jpg",
                    "listening": f"{asset_base}/Listening.jpg",
                    "thinking": f"{asset_base}/Thinking.jpg",
                }
    log_action("runtime.config.update", operator="admin-console", target="avatar-config", detail=payload, trace_id=trace_id)
    return ok(_runtime_state, trace_id=trace_id)
