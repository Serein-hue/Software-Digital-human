"""admin-api smoke tests."""

import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("ADMIN_BOOTSTRAP_PASSWORD", "admin123")
test_db = Path(tempfile.gettempdir()) / "scenic_dh_admin_test.db"
test_db.unlink(missing_ok=True)
os.environ.setdefault("DATABASE_URL", f"sqlite:///{test_db.as_posix()}")

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _auth_headers() -> dict[str, str]:
    resp = client.post("/v1/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    return {"Authorization": f"Bearer {body['data']['token']}"}


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["data"]["status"] == "ok"


def test_auth_required():
    resp = client.get("/v1/knowledge/status")
    assert resp.status_code == 401


def test_login_failure_uses_http_unauthorized():
    resp = client.post("/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    assert resp.json()["code"] == 40100


def test_login_and_me():
    headers = _auth_headers()
    resp = client.get("/v1/auth/me", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["username"] == "admin"


def test_runtime_status():
    resp = client.get("/v1/runtime/status", headers=_auth_headers())
    data = resp.json()
    assert data["code"] == 0
    assert "fayOnline" in data["data"]
    assert "mcpOnline" in data["data"]


def test_runtime_broadcast_does_not_raise():
    resp = client.post(
        "/v1/runtime/broadcast",
        headers=_auth_headers(),
        json={"text": "测试播报", "speaker": "测试"},
    )
    assert "code" in resp.json()


def test_runtime_microphone_toggle():
    resp = client.post("/v1/runtime/microphone/toggle", headers=_auth_headers())
    assert resp.json()["code"] == 0


def test_runtime_clear_queue():
    resp = client.post("/v1/runtime/clear-queue", headers=_auth_headers())
    assert "code" in resp.json()


def test_runtime_queue():
    resp = client.get("/v1/runtime/queue", headers=_auth_headers())
    data = resp.json()
    assert data["code"] == 0
    assert "queueLength" in data["data"]


def test_trace_header():
    resp = client.get("/health")
    assert "x-trace-id" in resp.headers


def test_system_config_list():
    resp = client.get("/v1/system-config", headers=_auth_headers())
    data = resp.json()
    assert data["code"] == 0
    assert len(data["data"]["items"]) >= 5
    keys = [item["key"] for item in data["data"]["items"]]
    assert "app_name" in keys
    assert "rag_score_threshold" in keys


def test_system_config_update():
    headers = _auth_headers()
    resp = client.put("/v1/system-config/rag_score_threshold", headers=headers, json={"value": "0.6"})
    assert resp.json()["code"] == 0
    assert resp.json()["data"]["value"] == "0.6"

    resp = client.get("/v1/system-config/rag_score_threshold", headers=headers)
    assert resp.json()["data"]["value"] == "0.6"

    # 重置回默认值
    client.put("/v1/system-config/rag_score_threshold", headers=headers, json={"value": "0.5"})
