"""P0 集成测试: Auth + RBAC"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuthFlow:
    """JWT 登录流程"""

    def test_login_success(self):
        resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["code"] == 0
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["user"]["username"] == "admin"
        assert "content:read" in data["data"]["user"]["permissions"]

    def test_login_wrong_password(self):
        resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "wrong"
        })
        assert resp.json()["code"] == 40100

    def test_refresh_token(self):
        # 先登录获取 refresh token
        login_resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        refresh_token = login_resp.json()["data"]["refresh_token"]

        resp = client.post("/v1/auth/refresh", json={
            "refresh_token": refresh_token
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()["data"]

    def test_protected_endpoint_without_token(self):
        resp = client.get("/v1/users")
        assert resp.status_code == 401

    def test_protected_endpoint_with_token(self):
        # 登录获取 token
        login_resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        token = login_resp.json()["data"]["access_token"]

        resp = client.get("/v1/users", headers={
            "Authorization": f"Bearer {token}"
        })
        assert resp.status_code == 200
        assert resp.json()["code"] == 0


class TestUserCRUD:
    """用户管理"""

    def _get_token(self):
        resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        return resp.json()["data"]["access_token"]

    def test_list_users(self):
        token = self._get_token()
        resp = client.get("/v1/users", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data["data"]

    def test_create_user(self):
        import uuid
        token = self._get_token()
        roles_resp = client.get("/v1/roles", headers={"Authorization": f"Bearer {token}"})
        editor_role = [r for r in roles_resp.json()["data"]["items"] if r["name"] == "editor"][0]

        uname = f"test_{uuid.uuid4().hex[:8]}"
        resp = client.post("/v1/users", json={
            "username": uname,
            "password": "test123",
            "display_name": "Test Editor",
            "role_id": editor_role["id"],
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["data"]["username"] == uname


class TestContentLifecycle:
    """内容生命周期: draft → submit → approve → revoke"""

    def _get_token(self):
        resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        return resp.json()["data"]["access_token"]

    def test_full_lifecycle(self):
        token = self._get_token()
        headers = {"Authorization": f"Bearer {token}"}

        # 1. 创建草稿
        create_resp = client.post("/v1/content", json={
            "type": "notice",
            "title": "测试公告",
            "body": {"content": "这是一条测试公告", "priority": "normal"},
        }, headers=headers)
        assert create_resp.status_code == 200
        content_id = create_resp.json()["data"]["id"]
        assert create_resp.json()["data"]["status"] == "draft"

        # 2. 提交审核
        submit_resp = client.post(f"/v1/content/{content_id}/submit", headers=headers)
        assert submit_resp.json()["data"]["status"] == "pending_review"

        # 3. 审核通过
        approve_resp = client.post(f"/v1/content/{content_id}/approve", json={
            "comment": "审核通过，内容无误"
        }, headers=headers)
        assert approve_resp.json()["data"]["status"] == "published"

        # 4. 撤回
        revoke_resp = client.post(f"/v1/content/{content_id}/revoke", headers=headers)
        assert revoke_resp.json()["data"]["status"] == "revoked"


class TestOpsAndConfig:
    """运营聚合 & 配置中心"""

    def _get_token(self):
        resp = client.post("/v1/auth/login", json={
            "username": "admin", "password": "admin123"
        })
        return resp.json()["data"]["access_token"]

    def test_ops_snapshot(self):
        token = self._get_token()
        resp = client.get("/v1/admin/ops/snapshot", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert "today_visitors" in resp.json()["data"]

    def test_config_list(self):
        token = self._get_token()
        resp = client.get("/v1/config", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert "items" in resp.json()["data"]

    def test_config_update(self):
        token = self._get_token()
        resp = client.put("/v1/config/mock_enabled", json={
            "value": False,
            "description": "disable mock for testing"
        }, headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200
        assert resp.json()["data"]["value"] == False
