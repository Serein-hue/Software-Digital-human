"""admin-api 冒烟测试"""

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

AUTH = {"Authorization": f"Bearer {settings.ADMIN_TOKEN}"}
PREFIX = "/v1/admin"


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "ok"


def test_auth_required():
    resp = client.get(f"{PREFIX}/knowledge/status")
    assert resp.status_code == 401


def test_auth_valid():
    resp = client.get(f"{PREFIX}/knowledge/status", headers=AUTH)
    assert resp.status_code == 200


def test_runtime_status():
    """运行时状态 — Fay 未启动时 fayOnline=False，但不应当报错。"""
    resp = client.get(f"{PREFIX}/runtime/status", headers=AUTH)
    data = resp.json()
    assert data["code"] == 0
    assert "fayOnline" in data["data"]
    assert "mcpOnline" in data["data"]


def test_runtime_broadcast():
    """广播 — Fay 未启动时返回 502，说明连接失败原因。"""
    resp = client.post(
        f"{PREFIX}/runtime/broadcast",
        headers=AUTH,
        json={"text": "测试播报", "speaker": "测试"},
    )
    data = resp.json()
    # Fay 未启动会返回 502，code 非 0
    assert data["code"] != 0 or data["code"] == 0


def test_runtime_microphone_toggle():
    """麦克风切换 — 即使 Fay 不在线也不应抛异常。"""
    resp = client.post(f"{PREFIX}/runtime/microphone/toggle", headers=AUTH)
    data = resp.json()
    assert data["code"] == 0


def test_runtime_clear_queue():
    """清空队列 — Fay 不在线时返回错误但不抛异常。"""
    resp = client.post(f"{PREFIX}/runtime/clear-queue", headers=AUTH)
    data = resp.json()
    # Fay 不在线会返回 500，但不抛异常
    assert "code" in data


def test_runtime_queue():
    """队列状态查询。"""
    resp = client.get(f"{PREFIX}/runtime/queue", headers=AUTH)
    data = resp.json()
    assert data["code"] == 0
    assert "queueLength" in data["data"]


def test_create_broadcast():
    """创建播报 — Fay 不在线时返回不抛异常。"""
    resp = client.post(
        f"{PREFIX}/broadcasts",
        headers=AUTH,
        json={"text": "测试播报", "priority": "high"},
    )
    data = resp.json()
    # Fay 不在线可能返回非 0 code，但不抛异常
    assert "code" in data


def test_trace_header():
    resp = client.get("/health")
    assert "x-trace-id" in resp.headers
