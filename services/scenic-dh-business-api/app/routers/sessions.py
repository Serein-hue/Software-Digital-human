"""游客会话接口 — DB 版"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok, err
from app.database import DbSession
from app.models import ScenicSession

router = APIRouter(tags=["Sessions"])


class CreateSessionRequest(BaseModel):
    profile: dict | None = None
    source: str = "web"
    language: str = "zh"


class PatchSessionRequest(BaseModel):
    currentSpotId: str | None = None
    currentRouteId: str | None = None
    profile: dict | None = None


@router.post("/sessions")
def create_session(body: CreateSessionRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    session = ScenicSession(
        id=session_id,
        profile=body.profile or {"language": body.language, "interests": [], "groupSize": 1, "hasChildren": False},
        source=body.source,
        language=body.language,
        status="active",
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.commit()
    return ok({"sessionId": session_id, "status": "active"}, trace_id)


@router.get("/sessions/{session_id}")
def get_session(session_id: str, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    session = db.query(ScenicSession).filter(ScenicSession.id == session_id).first()
    if not session:
        return err(40403, f"会话 {session_id} 不存在", trace_id)
    return ok(_session_to_dict(session), trace_id)


@router.patch("/sessions/{session_id}")
def patch_session(session_id: str, body: PatchSessionRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    session = db.query(ScenicSession).filter(ScenicSession.id == session_id).first()
    if not session:
        return err(40403, f"会话 {session_id} 不存在", trace_id)

    if body.currentSpotId is not None:
        session.current_spot_id = body.currentSpotId
    if body.currentRouteId is not None:
        session.current_route_id = body.currentRouteId
    if body.profile is not None:
        session.profile = body.profile
    session.updated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    db.commit()
    db.refresh(session)
    return ok(_session_to_dict(session), trace_id)


def _session_to_dict(s: ScenicSession) -> dict:
    return {
        "id": s.id,
        "profile": s.profile or {},
        "source": s.source,
        "currentSpotId": s.current_spot_id,
        "currentRouteId": s.current_route_id,
        "status": s.status,
        "createdAt": s.created_at,
        "updatedAt": s.updated_at,
    }
