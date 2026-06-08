"""二维码解析"""

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import QRCode

router = APIRouter(tags=["QR Code"])


class QRCodeResolveRequest(BaseModel):
    code: str
    session_id: str | None = None


@router.post("/qrcode/resolve")
def resolve_qrcode(body: QRCodeResolveRequest, request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        qr = db.query(QRCode).filter(
            QRCode.code == body.code,
            QRCode.status == "active",
        ).first()

        if not qr:
            return err(40406, "二维码未绑定或已停用", trace_id)

        # 检查过期
        from datetime import datetime, timezone
        if qr.expires_at and qr.expires_at < datetime.now(timezone.utc):
            return err(41001, "二维码已过期", trace_id)

        return ok({
            "code_id": qr.id,
            "type": qr.type,
            "target_id": qr.target_id,
            "target_name": qr.target_name,
            "action": qr.action,
            "meta": qr.meta_data or {},
        }, trace_id)
    finally:
        db.close()
