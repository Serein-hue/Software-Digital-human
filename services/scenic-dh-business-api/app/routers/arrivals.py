"""到达事件接口 — DB 版"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.common import ok
from app.database import DbSession
from app.models import ArrivalEvent

router = APIRouter(tags=["Arrivals"])


class ArrivalEventRequest(BaseModel):
    spotId: str
    location: dict | None = None
    trigger: str = "manual"


@router.post("/sessions/{session_id}/arrival-events")
def create_arrival(session_id: str, body: ArrivalEventRequest, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    event_id = str(uuid.uuid4())
    event = ArrivalEvent(
        id=event_id,
        session_id=session_id,
        spot_id=body.spotId,
        location=body.location or {"lat": 31.42, "lng": 120.10},
        trigger=body.trigger,
        accepted=True,
        speech_state="queued",
        created_at=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    )
    db.add(event)
    db.commit()
    return ok({"eventId": event_id, "accepted": True}, trace_id)


@router.get("/sessions/{session_id}/arrival-events")
def list_arrivals(session_id: str, request: Request, db: DbSession = None):
    trace_id = request.state.trace_id
    events = (
        db.query(ArrivalEvent)
        .filter(ArrivalEvent.session_id == session_id)
        .order_by(ArrivalEvent.created_at.desc())
        .all()
    )
    return ok({
        "events": [
            {
                "id": ev.id,
                "sessionId": ev.session_id,
                "spotId": ev.spot_id,
                "location": ev.location or {},
                "trigger": ev.trigger,
                "accepted": ev.accepted,
                "speechState": ev.speech_state,
                "createdAt": ev.created_at,
            }
            for ev in events
        ]
    }, trace_id)
