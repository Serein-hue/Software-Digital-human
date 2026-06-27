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
