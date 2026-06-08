"""角色管理路由"""

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import get_db
from app.models import Role
from app.auth import require_permission
from app.audit import audit_log, get_operator

router = APIRouter(tags=["Roles"])


class CreateRoleRequest(BaseModel):
    name: str
    description: str | None = None
    permissions: list[str]


class UpdateRoleRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    permissions: list[str] | None = None


@router.get("/roles")
def list_roles(
    request: Request,
    user_payload: dict = Depends(require_permission("roles:read")),
):
    trace_id = request.state.trace_id
    db = next(get_db())
    try:
        roles = db.query(Role).order_by(Role.name).all()
        result = []
        for r in roles:
            result.append({
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "permissions": r.permissions or [],
                "user_count": len(r.users) if r.users else 0,
            })
        return ok({"items": result}, trace_id)
    finally:
        db.close()


@router.post("/roles")
def create_role(
    body: CreateRoleRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("roles:write")),
):
    trace_id = request.state.trace_id
    db = next(get_db())
    try:
        existing = db.query(Role).filter(Role.name == body.name).first()
        if existing:
            return err(40900, "角色名已存在", trace_id)

        role = Role(
            name=body.name,
            description=body.description,
            permissions=body.permissions,
        )
        db.add(role)
        db.commit()
        db.refresh(role)

        op_id, op_name = get_operator(user_payload)
        audit_log(db, "role.create", op_id, op_name, "role", role.id,
                  detail={"name": role.name, "permissions": role.permissions},
                  trace_id=trace_id)

        return ok({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions or [],
            "user_count": 0,
        }, trace_id)
    finally:
        db.close()


@router.put("/roles/{role_id}")
def update_role(
    role_id: str,
    body: UpdateRoleRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("roles:write")),
):
    trace_id = request.state.trace_id
    db = next(get_db())
    try:
        role = db.query(Role).filter(Role.id == role_id).first()
        if not role:
            return err(40410, "角色不存在", trace_id)

        if body.name is not None:
            role.name = body.name
        if body.description is not None:
            role.description = body.description
        if body.permissions is not None:
            role.permissions = body.permissions

        db.commit()
        db.refresh(role)

        op_id, op_name = get_operator(user_payload)
        audit_log(db, "role.update", op_id, op_name, "role", role.id,
                  detail={"name": role.name},
                  trace_id=trace_id)

        return ok({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": role.permissions or [],
            "user_count": len(role.users) if role.users else 0,
        }, trace_id)
    finally:
        db.close()
