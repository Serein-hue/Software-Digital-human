"""Admin authentication endpoints."""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.database import create_session_token, delete_session_token, get_user_by_token, verify_admin_password
from app.schemas.common import err, ok

router = APIRouter(tags=["Admin Auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


def _get_token_from_header(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return None


@router.post("/auth/login")
def login(body: LoginRequest, request: Request):
    trace_id = request.state.trace_id
    user = verify_admin_password(body.username, body.password)
    if not user:
        return err(40100, "用户名或密码错误", trace_id)

    token = create_session_token(user["id"])
    return ok(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "displayName": user["display_name"],
                "roleId": user["role_id"],
            },
        },
        trace_id,
    )


@router.post("/auth/logout")
def logout(request: Request):
    trace_id = request.state.trace_id
    token = _get_token_from_header(request)
    if token:
        delete_session_token(token)
    return ok({"message": "已登出"}, trace_id)


@router.get("/auth/me")
def get_me(request: Request):
    trace_id = request.state.trace_id
    token = _get_token_from_header(request)
    user = get_user_by_token(token) if token else None
    if not user:
        return err(40101, "未登录或 token 已过期", trace_id)
    return ok(user, trace_id)
