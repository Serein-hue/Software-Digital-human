"""到达事件接口 — SQLAlchemy 持久化"""

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.schemas.common import ok
from app.database import SessionLocal
from app.models import Arrival as ArrivalModel

router = APIRouter(tags=["Arrivals"])


class ArrivalEventRequest(BaseModel):
    spotId: str
    location: dict | None = None
    trigger: str = "manual"


@router.post("/sessions/{session_id}/arrival-events")
def create_arrival(session_id: str, body: ArrivalEventRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        loc = body.location or {}
        event = ArrivalModel(
            session_id=session_id,
            spot_id=body.spotId,
            lat=loc.get("lat", 31.42),
            lng=loc.get("lng", 120.10),
            trigger=body.trigger,
            accepted=True,
            speech_state="queued",
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return ok({"eventId": event.id, "accepted": True}, trace_id)
    finally:
        db.close()


@router.get("/sessions/{session_id}/arrival-events")
def list_arrivals(session_id: str, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        events = (
            db.query(ArrivalModel)
            .filter(ArrivalModel.session_id == session_id)
            .order_by(ArrivalModel.created_at.desc())
            .all()
        )
        result = []
        for e in events:
            result.append({
                "id": e.id,
                "sessionId": e.session_id,
                "spotId": e.spot_id,
                "location": {"lat": e.lat, "lng": e.lng},
                "trigger": e.trigger,
                "accepted": e.accepted,
                "speechState": e.speech_state,
                "createdAt": e.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if e.created_at else None,
            })
        return ok({"events": result}, trace_id)
    finally:
        db.close()
