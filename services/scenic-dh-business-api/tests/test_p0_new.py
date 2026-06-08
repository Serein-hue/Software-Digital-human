"""P0 集成测试: 新增端点 (map/qrcode/work-order/emergency/offline/reservation)"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestMapEndpoints:
    def test_list_pois(self):
        resp = client.get("/v1/map/pois")
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert len(data["data"]["items"]) >= 8  # 至少有 8 个 POI

    def test_list_pois_by_category(self):
        resp = client.get("/v1/map/pois?category=spot")
        assert resp.status_code == 200
        items = resp.json()["data"]["items"]
        for item in items:
            assert item["category"] == "spot"

    def test_list_layers(self):
        resp = client.get("/v1/map/layers")
        assert resp.status_code == 200
        assert len(resp.json()["data"]["items"]) >= 4


class TestQRCode:
    def test_resolve_valid_code(self):
        resp = client.post("/v1/qrcode/resolve", json={
            "code": "LS001_SCAN",
        })
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["type"] == "spot"
        assert data["action"] == "navigate_guide"

    def test_resolve_invalid_code(self):
        resp = client.post("/v1/qrcode/resolve", json={
            "code": "NONEXISTENT",
        })
        assert resp.json()["code"] == 40406


class TestWorkOrders:
    def test_create_and_query(self):
        # 先创建 session
        session_resp = client.post("/v1/sessions", json={"source": "miniprogram"})
        session_id = session_resp.json()["data"]["sessionId"]

        # 创建工单
        create_resp = client.post("/v1/work-orders", json={
            "session_id": session_id,
            "type": "complaint",
            "title": "卫生间卫生问题",
            "description": "大佛广场卫生间需要清理",
            "contact_phone": "13800138000",
        })
        assert create_resp.status_code == 200
        order_id = create_resp.json()["data"]["order_id"]
        assert create_resp.json()["data"]["status"] == "pending"

        # 查询工单
        get_resp = client.get(f"/v1/work-orders/{order_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["data"]["title"] == "卫生间卫生问题"


class TestEmergency:
    def test_create_emergency(self):
        session_resp = client.post("/v1/sessions", json={"source": "miniprogram"})
        session_id = session_resp.json()["data"]["sessionId"]

        resp = client.post("/v1/emergency/requests", json={
            "session_id": session_id,
            "type": "medical",
            "description": "游客在大佛广场晕倒",
            "location": {"lat": 31.4245, "lng": 120.1089},
            "contact_phone": "13900139000",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "pending"
        assert "responder_eta" in resp.json()["data"]


class TestOffline:
    def test_get_latest_package(self):
        resp = client.get("/v1/offline-packages/latest")
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert "version" in data
        assert "manifest" in data


class TestReservations:
    def test_queue_ticket_flow(self):
        session_resp = client.post("/v1/sessions", json={"source": "miniprogram"})
        session_id = session_resp.json()["data"]["sessionId"]

        # 取号
        take_resp = client.post("/v1/queue/tickets", json={
            "session_id": session_id,
            "queue_id": "QUEUE-DAFO",
            "queue_name": "大佛观光排队",
        })
        assert take_resp.status_code == 200
        ticket = take_resp.json()["data"]
        assert ticket["status"] == "waiting"
        assert ticket["number"] >= 1

        # 取消
        cancel_resp = client.delete(f"/v1/queue/tickets?ticket_id={ticket['id']}")
        assert cancel_resp.status_code == 200
        assert cancel_resp.json()["data"]["status"] == "cancelled"

    def test_create_reservation(self):
        session_resp = client.post("/v1/sessions", json={"source": "miniprogram"})
        session_id = session_resp.json()["data"]["sessionId"]

        resp = client.post("/v1/reservations", json={
            "session_id": session_id,
            "resource_type": "show",
            "resource_id": "SHOW-JLGY",
            "resource_name": "九龙灌浴表演",
            "time_slot": "2026-06-10T10:00",
        })
        assert resp.status_code == 200
        assert resp.json()["data"]["status"] == "booked"


class TestTicketVerify:
    def test_verify_ticket(self):
        # ticket_code 不存在 → 404
        resp = client.post("/v1/tickets/verify", json={
            "ticket_code": "NONEXISTENT-CODE",
        })
        assert resp.json()["code"] == 40400


class TestResponseFormat:
    """P0 格式合规检查"""

    def test_trace_id_in_response(self):
        resp = client.get("/v1/map/pois")
        assert "trace_id" in resp.json()

    def test_envelope_format(self):
        resp = client.get("/v1/map/pois")
        body = resp.json()
        assert "code" in body
        assert "message" in body
        assert "data" in body
        assert "trace_id" in body
        assert body["code"] == 0
        assert body["message"] == "success"
