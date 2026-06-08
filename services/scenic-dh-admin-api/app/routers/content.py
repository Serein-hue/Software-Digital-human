"""内容管理 + 发布审批流程

状态机: draft → pending_review → approved → published / rejected
"""

from fastapi import APIRouter, Request, Query, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.schemas.common import ok, err
from app.database import SessionLocal
from app.models import ContentVersion, PublishApproval
from app.auth import require_permission

router = APIRouter(tags=["Content"])


class CreateContentRequest(BaseModel):
    type: str  # spot/route/facility/notice/event/ticket_policy
    title: str
    body: dict


class UpdateContentRequest(BaseModel):
    title: str | None = None
    body: dict | None = None


class ApprovalRequest(BaseModel):
    comment: str | None = None


@router.get("/content")
def list_content(
    request: Request,
    type: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_payload: dict = Depends(require_permission("content:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        q = db.query(ContentVersion)
        if type:
            q = q.filter(ContentVersion.content_type == type)
        if status:
            q = q.filter(ContentVersion.status == status)
        total = q.count()
        items = q.order_by(ContentVersion.updated_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        result = []
        for c in items:
            result.append({
                "id": c.id,
                "type": c.content_type,
                "title": c.title,
                "body": c.body,
                "version": c.version,
                "status": c.status,
                "author_id": c.author_id,
                "reviewer_id": c.reviewer_id,
                "published_at": c.published_at.isoformat() if c.published_at else None,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            })

        total_pages = max(1, (total + page_size - 1) // page_size)
        return ok({
            "items": result,
            "pagination": {"page": page, "page_size": page_size, "total": total, "total_pages": total_pages},
        }, trace_id)
    finally:
        db.close()


@router.post("/content")
def create_content(
    body: CreateContentRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("content:write")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        author_id = user_payload.get("sub") if user_payload else None
        content = ContentVersion(
            content_type=body.type,
            title=body.title,
            body=body.body,
            version=1,
            status="draft",
            author_id=author_id,
        )
        db.add(content)
        db.commit()
        db.refresh(content)

        return ok({
            "id": content.id,
            "type": content.content_type,
            "title": content.title,
            "version": content.version,
            "status": content.status,
            "created_at": content.created_at.isoformat() if content.created_at else None,
        }, trace_id)
    finally:
        db.close()


@router.get("/content/{content_id}")
def get_content(
    content_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("content:read")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        return ok({
            "id": content.id,
            "type": content.content_type,
            "title": content.title,
            "body": content.body,
            "version": content.version,
            "status": content.status,
            "author_id": content.author_id,
            "published_at": content.published_at.isoformat() if content.published_at else None,
            "created_at": content.created_at.isoformat() if content.created_at else None,
            "updated_at": content.updated_at.isoformat() if content.updated_at else None,
        }, trace_id)
    finally:
        db.close()


@router.put("/content/{content_id}")
def update_content(
    content_id: str,
    body: UpdateContentRequest,
    request: Request,
    user_payload: dict = Depends(require_permission("content:write")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        if content.status in ("approved", "published"):
            return err(40301, "已发布内容不可直接修改，请创建新版本", trace_id)

        if body.title is not None:
            content.title = body.title
        if body.body is not None:
            content.body = body.body
        content.version += 1

        db.commit()
        return ok({"id": content.id, "version": content.version, "status": content.status}, trace_id)
    finally:
        db.close()


@router.post("/content/{content_id}/submit")
def submit_for_review(
    content_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("content:write")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        if content.status != "draft":
            return err(40900, "仅草稿状态可提交审核", trace_id)
        content.status = "pending_review"
        db.commit()
        return ok({"id": content.id, "status": content.status}, trace_id)
    finally:
        db.close()


@router.post("/content/{content_id}/approve")
def approve_content(
    content_id: str,
    body: ApprovalRequest | None = None,
    request: Request = None,
    user_payload: dict = Depends(require_permission("content:approve")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        if content.status != "pending_review":
            return err(40900, "仅待审核状态可批准", trace_id)

        reviewer_id = user_payload.get("sub") if user_payload else None
        content.status = "published"
        content.reviewer_id = reviewer_id
        content.published_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)

        # 记录审批日志
        db.add(PublishApproval(
            content_id=content_id,
            action="approve",
            comment=body.comment if body else None,
            reviewer_id=reviewer_id,
        ))
        db.commit()

        return ok({"id": content.id, "status": content.status, "published_at": content.published_at.isoformat()}, trace_id)
    finally:
        db.close()


@router.post("/content/{content_id}/reject")
def reject_content(
    content_id: str,
    body: ApprovalRequest | None = None,
    request: Request = None,
    user_payload: dict = Depends(require_permission("content:approve")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        if content.status != "pending_review":
            return err(40900, "仅待审核状态可驳回", trace_id)

        content.status = "rejected"
        content.reviewer_id = user_payload.get("sub") if user_payload else None

        db.add(PublishApproval(
            content_id=content_id,
            action="reject",
            comment=body.comment if body else None,
            reviewer_id=user_payload.get("sub") if user_payload else None,
        ))
        db.commit()
        return ok({"id": content.id, "status": content.status}, trace_id)
    finally:
        db.close()


@router.post("/content/{content_id}/revoke")
def revoke_content(
    content_id: str,
    request: Request,
    user_payload: dict = Depends(require_permission("content:revoke")),
):
    trace_id = request.state.trace_id
    db: Session = SessionLocal()
    try:
        content = db.query(ContentVersion).filter(ContentVersion.id == content_id).first()
        if not content:
            return err(40411, "内容不存在", trace_id)
        if content.status not in ("published",):
            return err(40900, "仅已发布内容可撤回", trace_id)

        content.status = "revoked"
        db.add(PublishApproval(
            content_id=content_id,
            action="revoke",
            reviewer_id=user_payload.get("sub") if user_payload else None,
        ))
        db.commit()
        return ok({"id": content.id, "status": content.status}, trace_id)
    finally:
        db.close()
