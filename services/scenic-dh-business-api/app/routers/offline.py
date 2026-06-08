"""离线包"""

from fastapi import APIRouter, Request
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import OfflinePackage

router = APIRouter(tags=["Offline"])


@router.get("/offline-packages/latest")
def get_latest_offline_package(request: Request):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        pkg = db.query(OfflinePackage).order_by(OfflinePackage.created_at.desc()).first()
        if not pkg:
            return err(40400, "暂无离线包", trace_id)

        return ok({
            "version": pkg.version,
            "size_bytes": pkg.size_bytes,
            "manifest": {
                "spots": pkg.manifest_spots,
                "guides": pkg.manifest_guides,
                "notices": pkg.manifest_notices,
                "maps": pkg.manifest_maps,
            },
            "checksum": pkg.checksum,
            "force_update": pkg.force_update,
            "release_notes": pkg.release_notes,
            "download_url": pkg.download_url,
        }, trace_id)
    finally:
        db.close()
