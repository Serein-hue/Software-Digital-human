"""游客会话接口 — SQLAlchemy 持久化"""

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import Session as SessionModel

router = APIRouter(tags=["Sessions"])


class CreateSessionRequest(BaseModel):
    profile: dict | None = None
    source: str = "web"
    language: str = "zh"


class PatchSessionRequest(BaseModel):
    currentSpotId: str | None = None
    currentRouteId: str | None = None
    profile: dict | None = None


def _session_to_dict(s: SessionModel) -> dict:
    return {
        "id": s.id,
        "profile": {
            "language": s.language,
            "interests": s.interests or [],
            "groupSize": s.group_size or 1,
            "hasChildren": s.has_children or False,
        },
        "source": s.source,
        "currentSpotId": s.current_spot_id,
        "currentRouteId": s.current_route_id,
        "status": s.status,
        "createdAt": s.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if s.created_at else None,
        "updatedAt": s.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ") if s.updated_at else None,
    }


@router.post("/sessions")
def create_session(body: CreateSessionRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        profile = body.profile or {}
        session = SessionModel(
            language=body.language,
            interests=profile.get("interests", []),
            group_size=profile.get("groupSize", 1),
            has_children=profile.get("hasChildren", False),
            source=body.source,
            status="active",
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return ok({"sessionId": session.id, "status": session.status}, trace_id)
    finally:
        db.close()


@router.get("/sessions/{session_id}")
def get_session(session_id: str, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            return err(40403, f"会话 {session_id} 不存在", trace_id)
        return ok(_session_to_dict(session), trace_id)
    finally:
        db.close()


@router.patch("/sessions/{session_id}")
def patch_session(session_id: str, body: PatchSessionRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            return err(40403, f"会话 {session_id} 不存在", trace_id)
        if body.currentSpotId is not None:
            session.current_spot_id = body.currentSpotId
        if body.currentRouteId is not None:
            session.current_route_id = body.currentRouteId
        if body.profile is not None:
            if "language" in body.profile:
                session.language = body.profile["language"]
            if "interests" in body.profile:
                session.interests = body.profile["interests"]
            if "groupSize" in body.profile:
                session.group_size = body.profile["groupSize"]
            if "hasChildren" in body.profile:
                session.has_children = body.profile["hasChildren"]
        session.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return ok(_session_to_dict(session), trace_id)
    finally:
        db.close()
