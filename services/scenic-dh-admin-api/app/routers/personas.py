"""人设配置 — DB 持久化"""

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import Persona
from app.auth import require_permission

router = APIRouter(tags=["Personas"])


class UpdatePersonaRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    tone: str | None = None
    fallback_policy: dict | None = None


@router.get("/personas/{persona_id}")
def get_persona(
    persona_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("content:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        p = db.query(Persona).filter(Persona.id == persona_id).first()
        if not p:
            return err(40400, f"人设 {persona_id} 不存在", trace_id)
        return ok({
            "id": p.id, "name": p.name, "description": p.description,
            "tone": p.tone, "fallback_policy": p.fallback_policy or {},
        }, trace_id)
    finally:
        db.close()


@router.put("/personas/{persona_id}")
def update_persona(
    persona_id: str,
    body: UpdatePersonaRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("content:write")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        p = db.query(Persona).filter(Persona.id == persona_id).first()
        if not p:
            return err(40400, f"人设 {persona_id} 不存在", trace_id)
        if body.name is not None:
            p.name = body.name
        if body.description is not None:
            p.description = body.description
        if body.tone is not None:
            p.tone = body.tone
        if body.fallback_policy is not None:
            p.fallback_policy = body.fallback_policy
        db.commit()
        db.refresh(p)
        return ok({
            "id": p.id, "name": p.name, "description": p.description,
            "tone": p.tone, "fallback_policy": p.fallback_policy or {},
        }, trace_id)
    finally:
        db.close()
