"""内容管理 CRUD — 景点、公告、活动、设施、票务等内容的创建/编辑/审核/发布

所有写操作自动记录 ContentVersion 用于发布审批流。
"""

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request, Query, Body
from sqlalchemy import and_

from app.schemas.common import ok, err, Pagination
from app.database import DbSession
from app.models_admin import ContentVersion
from app.routers.auth import get_current_user

# ── 业务模型（来自共享数据库）─────────────────────────────────────
# 这些表由 business-api 创建，admin-api 共享读取和写入
from sqlalchemy import text as sa_text

router = APIRouter(tags=["Admin Content"])


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ═══════════════════════════════════════════════════════════════════════
# 工具函数
# ═══════════════════════════════════════════════════════════════════════

_CONTENT_CONFIG = {
    "spots": {"table": "spots", "label": "景点", "id_col": "id", "search_cols": ["name"]},
    "notices": {"table": "notices", "label": "公告", "id_col": "id", "search_cols": ["title"]},
    "events": {"table": "events", "label": "活动", "id_col": "id", "search_cols": ["name"]},
    "services": {"table": "service_facilities", "label": "服务设施", "id_col": "id", "search_cols": ["name"]},
    "tickets": {"table": "ticket_products", "label": "票种", "id_col": "id", "search_cols": ["name"]},
    "routes": {"table": "routes", "label": "路线", "id_col": "id", "search_cols": ["name"]},
    "map_pois": {"table": "map_pois", "label": "地图POI", "id_col": "id", "search_cols": ["name"]},
    "qr_codes": {"table": "qr_code_rules", "label": "二维码规则", "id_col": "id", "search_cols": ["code"]},
}


def _get_content_list(db, content_type: str, search: str = "", page: int = 1, page_size: int = 20):
    """通用列表查询"""
    cfg = _CONTENT_CONFIG.get(content_type)
    if not cfg:
        return None, f"不支持的内容类型: {content_type}"

    table = cfg["table"]
    search_cols = cfg.get("search_cols", [])

    # 构建查询
    base = f"SELECT * FROM {table}"
    count_sql = f"SELECT COUNT(*) as cnt FROM {table}"
    params = {}

    if search and search_cols:
        like_clauses = " OR ".join(f"{c} LIKE :kw" for c in search_cols)
        base += f" WHERE ({like_clauses})"
        count_sql += f" WHERE ({like_clauses})"
        params["kw"] = f"%{search}%"

    base += " ORDER BY id LIMIT :limit OFFSET :offset"
    params["limit"] = page_size
    params["offset"] = (page - 1) * page_size

    total = db.execute(sa_text(count_sql), params).scalar() or 0
    rows = db.execute(sa_text(base), params).mappings().all()

    items = [dict(r) for r in rows]
    # JSON 字段转换
    for item in items:
        for k, v in item.items():
            if isinstance(v, str):
                try:
                    item[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    pass

    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size),
        },
    }, None


def _get_content_detail(db, content_type: str, item_id: str):
    """通用详情查询"""
    cfg = _CONTENT_CONFIG.get(content_type)
    if not cfg:
        return None, f"不支持的内容类型: {content_type}"

    row = db.execute(
        sa_text(f"SELECT * FROM {cfg['table']} WHERE {cfg['id_col']} = :id"),
        {"id": item_id},
    ).mappings().first()

    if not row:
        return None, "内容不存在"

    item = dict(row)
    for k, v in item.items():
        if isinstance(v, str):
            try:
                item[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                pass
    return item, None


def _save_content_version(db, content_type: str, content_id: str, data: dict, user_id: str, change_log: str = ""):
    """创建内容版本记录"""
    latest = db.query(ContentVersion).filter(
        ContentVersion.content_type == content_type,
        ContentVersion.content_id == content_id,
    ).order_by(ContentVersion.version.desc()).first()

    version_num = (latest.version + 1) if latest else 1
    cv = ContentVersion(
        content_type=content_type,
        content_id=content_id,
        version=version_num,
        status="draft",
        data=data,
        change_log=change_log,
        created_by=user_id,
    )
    db.add(cv)
    return cv


# ═══════════════════════════════════════════════════════════════════════
# 内容列表 / 详情（通用）
# ═══════════════════════════════════════════════════════════════════════

@router.get("/content/{content_type}")
def list_content(
    content_type: str,
    search: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    request: Request = None,
    db: DbSession = None,
):
    """列出指定类型的内容"""
    trace_id = request.state.trace_id
    result, error = _get_content_list(db, content_type, search, page, page_size)
    if error:
        return err(40000, error, trace_id)
    return ok(result, trace_id)


@router.get("/content/{content_type}/{item_id}")
def get_content_item(content_type: str, item_id: str, request: Request = None, db: DbSession = None):
    """获取单条内容详情"""
    trace_id = request.state.trace_id
    result, error = _get_content_detail(db, content_type, item_id)
    if error:
        return err(40400, error, trace_id)
    return ok(result, trace_id)


@router.put("/content/{content_type}/{item_id}")
def update_content_item(
    content_type: str, item_id: str,
    body: dict = Body(...),
    request: Request = None,
    db: DbSession = None,
):
    """更新内容（创建草稿版本）"""
    trace_id = request.state.trace_id
    user = get_current_user(request, db)
    user_id = user["id"] if user else "unknown"

    item, error = _get_content_detail(db, content_type, item_id)
    if error:
        return err(40400, error, trace_id)

    cfg = _CONTENT_CONFIG.get(content_type)
    # 更新数据
    update_parts = []
    params = {"id": item_id}
    for k, v in body.items():
        if k in ("id", cfg["id_col"] if cfg else "id"):
            continue
        if isinstance(v, (dict, list)):
            v = json.dumps(v, ensure_ascii=False)
        update_parts.append(f"{k} = :{k}")
        params[k] = v

    if update_parts:
        db.execute(
            sa_text(f"UPDATE {cfg['table']} SET {', '.join(update_parts)} WHERE {cfg['id_col']} = :id"),
            params,
        )

    # 记录版本
    updated_item, _ = _get_content_detail(db, content_type, item_id)
    _save_content_version(db, content_type, item_id, updated_item or body, user_id, "手动更新")
    db.commit()

    return ok({"id": item_id, "status": "updated"}, trace_id)


@router.post("/content/{content_type}")
def create_content_item(
    content_type: str,
    body: dict = Body(...),
    request: Request = None,
    db: DbSession = None,
):
    """创建新内容"""
    trace_id = request.state.trace_id
    user = get_current_user(request, db)
    user_id = user["id"] if user else "unknown"

    cfg = _CONTENT_CONFIG.get(content_type)
    if not cfg:
        return err(40000, f"不支持的内容类型: {content_type}", trace_id)

    cols = []
    placeholders = []
    params = {}
    for k, v in body.items():
        cols.append(k)
        placeholders.append(f":{k}")
        if isinstance(v, (dict, list)):
            v = json.dumps(v, ensure_ascii=False)
        params[k] = v

    db.execute(
        sa_text(f"INSERT INTO {cfg['table']} ({', '.join(cols)}) VALUES ({', '.join(placeholders)})"),
        params,
    )

    new_id = body.get(cfg["id_col"], "")
    _save_content_version(db, content_type, new_id, body, user_id, "新建")
    db.commit()

    return ok({"id": new_id, "status": "created"}, trace_id)


# ═══════════════════════════════════════════════════════════════════════
# 发布审批流
# ═══════════════════════════════════════════════════════════════════════

@router.post("/content/{content_type}/{item_id}/submit")
def submit_for_review(content_type: str, item_id: str, request: Request = None, db: DbSession = None):
    """提交审核"""
    trace_id = request.state.trace_id
    version = db.query(ContentVersion).filter(
        ContentVersion.content_type == content_type,
        ContentVersion.content_id == item_id,
        ContentVersion.status == "draft",
    ).order_by(ContentVersion.version.desc()).first()

    if not version:
        return err(40000, "没有待审核的版本", trace_id)

    version.status = "review"
    db.commit()
    return ok({"versionId": version.id, "status": "review"}, trace_id)


@router.post("/content/{content_type}/{item_id}/publish")
def publish_content(content_type: str, item_id: str, request: Request = None, db: DbSession = None):
    """审核通过并发布"""
    trace_id = request.state.trace_id
    user = get_current_user(request, db)
    user_id = user["id"] if user else "unknown"

    version = db.query(ContentVersion).filter(
        ContentVersion.content_type == content_type,
        ContentVersion.content_id == item_id,
        ContentVersion.status == "review",
    ).order_by(ContentVersion.version.desc()).first()

    if not version:
        return err(40000, "没有待发布的版本", trace_id)

    version.status = "published"
    version.reviewed_by = user_id
    version.reviewed_at = _now()
    version.published_at = _now()
    db.commit()
    return ok({"versionId": version.id, "status": "published"}, trace_id)


@router.post("/content/{content_type}/{item_id}/reject")
def reject_content(
    content_type: str, item_id: str,
    body: dict = Body({}),
    request: Request = None,
    db: DbSession = None,
):
    """驳回审核"""
    trace_id = request.state.trace_id
    user = get_current_user(request, db)
    user_id = user["id"] if user else "unknown"

    version = db.query(ContentVersion).filter(
        ContentVersion.content_type == content_type,
        ContentVersion.content_id == item_id,
        ContentVersion.status == "review",
    ).order_by(ContentVersion.version.desc()).first()

    if not version:
        return err(40000, "没有待驳回的版本", trace_id)

    version.status = "rejected"
    version.reviewed_by = user_id
    version.reviewed_at = _now()
    version.reject_reason = body.get("reason", "")
    db.commit()
    return ok({"versionId": version.id, "status": "rejected"}, trace_id)


@router.get("/content/{content_type}/{item_id}/versions")
def list_content_versions(content_type: str, item_id: str, request: Request = None, db: DbSession = None):
    """查看内容版本历史"""
    trace_id = request.state.trace_id
    versions = db.query(ContentVersion).filter(
        ContentVersion.content_type == content_type,
        ContentVersion.content_id == item_id,
    ).order_by(ContentVersion.version.desc()).limit(20).all()

    return ok({
        "items": [
            {
                "versionId": v.id,
                "version": v.version,
                "status": v.status,
                "changeLog": v.change_log,
                "createdBy": v.created_by,
                "reviewedBy": v.reviewed_by,
                "publishedAt": v.published_at,
                "createdAt": v.created_at,
            }
            for v in versions
        ]
    }, trace_id)
