"""小程序用户鉴权 — wx-login / me / 角色守卫"""

import uuid
import hashlib
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.database import get_conn
from app.schemas.common import ok, err

logger = logging.getLogger("business-api")
router = APIRouter(tags=["Auth"])


def _utcnow() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ── 请求/响应模型 ─────────────────────────────────────────────────────


class WxLoginRequest(BaseModel):
    code: str
    nickname: str = ""
    avatar: str = ""


class WxLoginResponse(BaseModel):
    token: str
    expiresIn: int
    user: dict


# ── 微信登录核心 ──────────────────────────────────────────────────────


async def _wx_code_to_openid(code: str) -> str:
    """用微信 code 换 openid（dev 模式直接 mock）"""
    if settings.WECHAT_DEV_MODE:
        # dev 模式：code + 固定前缀 hash 生成稳定 openid
        raw = f"dev_openid_{code}"
        return f"dev_{hashlib.md5(raw.encode()).hexdigest()[:16]}"

    if not settings.WECHAT_APPID or not settings.WECHAT_SECRET:
        raise HTTPException(status_code=503, detail="微信登录未配置")

    import httpx
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            settings.WECHAT_LOGIN_URL,
            params={
                "appid": settings.WECHAT_APPID,
                "secret": settings.WECHAT_SECRET,
                "js_code": code,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
        data = resp.json()
        if "openid" not in data:
            logger.error("wx code2session failed: %s", data)
            raise HTTPException(status_code=400, detail="微信登录失败")
        return data["openid"]


def _find_or_create_user(conn, openid: str, nickname: str, avatar: str) -> dict:
    """查找或创建用户，返回用户 dict"""
    row = conn.execute("SELECT * FROM users WHERE openid = ?", (openid,)).fetchone()
    now = _utcnow()

    if row:
        conn.execute(
            "UPDATE users SET last_login = ?, nickname = CASE WHEN ? != '' THEN ? ELSE nickname END, avatar = CASE WHEN ? != '' THEN ? ELSE avatar END WHERE id = ?",
            (now, nickname, nickname, avatar, avatar, row["id"]),
        )
        conn.commit()
        return dict(row)
    else:
        user_id = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO users (id, openid, nickname, avatar, role, is_active, last_login, created_at)
               VALUES (?, ?, ?, ?, 'visitor', 1, ?, ?)""",
            (user_id, openid, nickname, avatar, now, now),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row)


def _create_session_token(conn, user_id: str) -> str:
    """创建用户 session token"""
    token = f"usr_{uuid.uuid4().hex}"
    token_hash = _hash_token(token)
    expires = datetime.now(timezone.utc) + timedelta(hours=settings.TOKEN_EXPIRE_HOURS)
    expires_str = expires.strftime("%Y-%m-%dT%H:%M:%SZ")
    conn.execute(
        """INSERT INTO user_session_tokens (id, user_id, token, expires_at, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (str(uuid.uuid4()), user_id, token_hash, expires_str, _utcnow()),
    )
    conn.commit()
    return token


def get_user_by_token(token: str) -> dict | None:
    """通过 token 查找用户（验证过期）"""
    conn = get_conn()
    token_hash = _hash_token(token)
    row = conn.execute(
        """SELECT u.* FROM user_session_tokens s
           JOIN users u ON u.id = s.user_id
           WHERE s.token = ? AND u.is_active = 1""",
        (token_hash,),
    ).fetchone()
    if not row:
        return None
    expires = datetime.strptime(row["expires_at"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        conn.execute("DELETE FROM user_session_tokens WHERE token = ?", (token_hash,))
        conn.commit()
        return None
    return dict(row)


# ── 端点 ──────────────────────────────────────────────────────────────


@router.post("/auth/wx-login")
async def wx_login(body: WxLoginRequest, request: Request):
    """微信小程序一键登录（自动注册）"""
    trace_id = request.state.trace_id
    conn = get_conn()

    try:
        openid = await _wx_code_to_openid(body.code)
    except HTTPException as e:
        return err(40102, e.detail, trace_id, status_code=400)

    user = _find_or_create_user(conn, openid, body.nickname, body.avatar)
    token = _create_session_token(conn, user["id"])

    return ok(
        {
            "token": token,
            "expiresIn": settings.TOKEN_EXPIRE_HOURS * 3600,
            "user": {
                "id": user["id"],
                "nickname": user["nickname"],
                "avatar": user["avatar"],
                "role": user["role"],
                "staffName": user.get("staff_name") or None,
                "staffTitle": user.get("staff_title") or None,
            },
        },
        trace_id,
    )


@router.get("/auth/me")
def get_me(request: Request):
    """获取当前用户信息（需 Bearer token）"""
    trace_id = request.state.trace_id
    token = _extract_token(request)
    if not token:
        return err(40100, "缺少 Authorization 头", trace_id)

    user = get_user_by_token(token)
    if not user:
        return err(40101, "token 无效或已过期", trace_id)

    return ok(
        {
            "id": user["id"],
            "nickname": user["nickname"],
            "avatar": user["avatar"],
            "role": user["role"],
            "staffName": user.get("staff_name") or None,
            "staffTitle": user.get("staff_title") or None,
        },
        trace_id,
    )


@router.post("/auth/logout")
def logout(request: Request):
    """退出登录"""
    trace_id = request.state.trace_id
    token = _extract_token(request)
    if token:
        conn = get_conn()
        token_hash = _hash_token(token)
        conn.execute("DELETE FROM user_session_tokens WHERE token = ?", (token_hash,))
        conn.commit()
    return ok({"message": "已登出"}, trace_id)


# ── 工具函数（导出供其他模块使用）─────────────────────────────────────


def _extract_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return None


def require_staff(request: Request) -> dict | None:
    """校验是否为员工角色，返回 user dict"""
    token = _extract_token(request)
    if not token:
        return None
    user = get_user_by_token(token)
    if not user or user["role"] != "staff":
        return None
    return user
