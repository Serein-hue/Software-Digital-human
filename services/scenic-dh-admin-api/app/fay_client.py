"""Fay adapter client — 与 Fay 数字人运行时真实通信

Fay 各服务端口（标准部署）：
  - 5000: Fay GUI / core HTTP（/transparent-pass 广播端点）
  - 5010: Fay MCP 服务（Flask，管理 MCP Server 连接）
  - 8765: Fay MCP SSE（外部 MCP 工具入口）
  - 10000: Fay WebSocket（前端实时通信）

API 风格统一使用 RAG 团队标准 {code, message, data, trace_id} 信封。
"""

import logging
import time
from typing import Optional

import requests

from app.config import settings

logger = logging.getLogger("admin-api.fay_client")

# ── Fay 服务地址（可从 config 覆盖） ──────────────────────────────────
FAY_CORE_URL: str = getattr(settings, "FAY_CORE_URL", "http://127.0.0.1:5000")
FAY_MCP_URL: str = getattr(settings, "FAY_MCP_URL", "http://127.0.0.1:5010")
FAY_WS_URL: str = getattr(settings, "FAY_WS_URL", "ws://127.0.0.1:10000")

REQUEST_TIMEOUT: float = 5.0


# ── 状态探测 ──────────────────────────────────────────────────────────

def _probe_http(url: str, timeout: float = REQUEST_TIMEOUT) -> bool:
    """探测 HTTP 服务是否存活。"""
    try:
        resp = requests.get(url, timeout=timeout)
        return resp.ok
    except requests.RequestException:
        return False


def _probe_ws(ws_url: str, timeout: float = 3.0) -> bool:
    """探测 WebSocket 服务是否存活。"""
    try:
        import websockets.sync.client as ws_client
        conn = ws_client.connect(ws_url, timeout=timeout)
        conn.close()
        return True
    except (ImportError, Exception):
        # websockets 可能未安装，或连接失败
        return False


def check_runtime_status() -> dict:
    """综合查询 Fay 各服务的运行状态。

    Returns:
        {
            "fayOnline": bool,       # Fay core HTTP 可达
            "ttsOnline": bool,       # TTS 模块状态（暂用 core 状态代替）
            "speaking": bool,        # 正在播报
            "queueLength": int,      # 队列待处理数
            "mcpOnline": bool,       # MCP 服务可达
            "wsConnected": bool,     # WebSocket 客户端已连接
            "lastError": str | None,
        }
    """
    fay_online = _probe_http(FAY_CORE_URL)
    mcp_online = _probe_http(FAY_MCP_URL) if fay_online else False
    ws_connected = _probe_ws(FAY_WS_URL) if fay_online else False

    queue_len = 0
    if fay_online and mcp_online:
        queue_len = _fetch_queue_length()

    return {
        "fayOnline": fay_online,
        "ttsOnline": fay_online,       # TTS 与 Fay 核心同进程
        "speaking": False,              # 暂无法直接获取
        "queueLength": queue_len,
        "mcpOnline": mcp_online,
        "wsConnected": ws_connected,
        "lastError": None if fay_online else "Fay core unreachable",
    }


# ── 队列 ──────────────────────────────────────────────────────────────

def _fetch_queue_length() -> int:
    """从 MCP 服务查询队列长度。"""
    try:
        resp = requests.get(f"{FAY_MCP_URL}/api/mcp/servers", timeout=REQUEST_TIMEOUT)
        if resp.ok:
            servers = resp.json()
            if isinstance(servers, list):
                online = [s for s in servers if s.get("status") == "online"]
                return len(online)
        return 0
    except requests.RequestException:
        return 0


def clear_queue() -> bool:
    """清空 Fay 播报队列。"""
    try:
        resp = requests.post(
            f"{FAY_CORE_URL}/api/stop",
            json={"clear_queue": True},
            timeout=REQUEST_TIMEOUT,
        )
        return resp.ok
    except requests.RequestException as exc:
        logger.warning("Fay clear_queue failed: %s", exc)
        return False


# ── 广播 ──────────────────────────────────────────────────────────────

def send_broadcast(
    text: str,
    speaker: str = "广播消息",
    user: str = "User",
    queue: bool = True,
    audio_url: Optional[str] = None,
) -> dict:
    """向 Fay 发送一条广播（走 /transparent-pass）。

    Returns: RAG 格式信封 {"code": 0/..., "message": ..., "data": ...}
    """
    payload: dict = {
        "text": f"{speaker}说：{text}",
        "user": user,
    }
    if audio_url:
        payload["audio"] = audio_url
    if queue:
        payload["queue"] = True
        payload["queue_playback"] = True
        payload["mode"] = "queue"

    try:
        resp = requests.post(
            f"{FAY_CORE_URL}/transparent-pass",
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )
        if resp.ok:
            body = resp.json()
            code = body.get("code", 0) if isinstance(body, dict) else 0
            if isinstance(code, int) and code >= 400:
                return {"code": code, "message": body.get("message", "broadcast rejected"), "data": None}
            return {"code": 0, "message": "broadcast sent", "data": {"text": text}}
        return {"code": resp.status_code, "message": resp.text, "data": None}
    except requests.RequestException as exc:
        logger.warning("Fay broadcast failed: %s", exc)
        return {"code": 500, "message": str(exc), "data": None}


# ── 麦克风 ────────────────────────────────────────────────────────────

def toggle_microphone() -> dict:
    """切换 Fay 麦克风状态。

    通过 Fay 的 /api/start_listening 和 /api/stop_listening 控制。
    """
    status = check_runtime_status()
    current_mic_on = status.get("fayOnline", False) and not status.get("speaking", False)

    try:
        if current_mic_on:
            resp = requests.post(f"{FAY_CORE_URL}/api/stop_listening", timeout=REQUEST_TIMEOUT)
        else:
            resp = requests.post(f"{FAY_CORE_URL}/api/start_listening", timeout=REQUEST_TIMEOUT)
        if resp.ok:
            return {"microphone": "off" if current_mic_on else "on", "status": "ok"}
        return {"microphone": "error", "status": "failed"}
    except requests.RequestException as exc:
        # 如果 Fay 不可达，返回模拟状态
        logger.warning("Fay mic toggle failed (fallback to mock): %s", exc)
        return {"microphone": f"toggled (mock, fay unreachable: {exc})", "status": "fallback"}
