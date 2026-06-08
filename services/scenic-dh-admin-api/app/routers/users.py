"""用户管理路由: CRUD"""

from fastapi import APIRouter, Request, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import get_db
from app.models import User, Role
from app.auth import get_current_user, require_permission, hash_password

router = APIRouter(tags=["Users"])


class CreateUserRequest(BaseModel):
    username: str
    password: str
    display_name: str
    role_id: str


class UpdateUserRequest(BaseModel):
    display_name: str | None = None
    role_id: str | None = None
    status: str | None = None  # active/disabled


@router.get("/users")
def list_users(
    request: Request,
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_payload: dict = Depends(require_permission("users:read")),
):
    trace_id = request.state.trace_id
    db: Session = request.state.db if hasattr(request.state, 'db') else next(get_db())
    # 因为用了 Depends(get_current_user) 链，需要重新获取 db
    is_closing = False
    if not hasattr(request.state, 'db'):
        request.state.db = db
        is_closing = True

    try:
        q = db.query(User)
        if status:
            q = q.filter(User.status == status)
        total = q.count()
        items = q.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        result = []
        for u in items:
            result.append({
                "id": u.id,
                "username": u.username,
                "display_name": u.display_name,
                "role_id": u.role_id,
                "role_name": u.role.name if u.role else None,
                "permissions": u.role.permissions if u.role else [],
                "status": u.status,
                "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            })

        total_pages = max(1, (total + page_size - 1) // page_size)
        return ok({
            "items": result,
            "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": total_pages},
        }, trace_id)
    finally:
        if is_closing:
            db.close()


@router.post("/users")
def create_user(
    body: CreateUserRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("users:write")),
):
    trace_id = request.state.trace_id
    db = next(get_db())
    try:
        existing = db.query(User).filter(User.username == body.username).first()
        if existing:
            return err(40903, "用户名已存在", trace_id)

        role = db.query(Role).filter(Role.id == body.role_id).first()
        if not role:
            return err(40410, "角色不存在", trace_id)

        user = User(
            username=body.username,
            password_hash=hash_password(body.password),
            display_name=body.display_name,
            role_id=body.role_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        return ok({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role_id": user.role_id,
            "role_name": role.name,
            "permissions": role.permissions or [],
            "status": user.status,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }, trace_id)
    finally:
        db.close()


@router.put("/users/{user_id}")
def update_user(
    user_id: str,
    body: UpdateUserRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("users:write")),
):
    trace_id = request.state.trace_id
    db = next(get_db())
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return err(40409, "用户不存在", trace_id)

        if body.display_name is not None:
            user.display_name = body.display_name
        if body.role_id is not None:
            role = db.query(Role).filter(Role.id == body.role_id).first()
            if not role:
                return err(40410, "角色不存在", trace_id)
            user.role_id = body.role_id
        if body.status is not None:
            user.status = body.status

        db.commit()
        db.refresh(user)

        return ok({
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "role_id": user.role_id,
            "role_name": user.role.name if user.role else None,
            "status": user.status,
        }, trace_id)
    finally:
        db.close()
