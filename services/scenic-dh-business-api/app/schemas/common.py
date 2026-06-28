"""统一响应信封 — 对齐 RAG 服务 {code, message, data, trace_id}"""

from typing import Optional, Any
from pydantic import BaseModel
from starlette.responses import JSONResponse


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int
    total_pages: int


class ResponseEnvelope(BaseModel):
    code: int = 0
    message: str = "success"
    data: Optional[Any] = None
    trace_id: str = ""


def ok(data: Any, trace_id: str, pagination: Optional[Pagination] = None) -> dict:
    """构造成功响应"""
    result: dict = {
        "code": 0,
        "message": "success",
        "data": data,
        "trace_id": trace_id,
    }
    if pagination:
        result["data"] = {
            "items": data,
            "pagination": {
                "page": pagination.page,
                "page_size": pagination.page_size,
                "total": pagination.total,
                "total_pages": pagination.total_pages,
            },
        }
    return result


def _status_from_code(code: int) -> int:
    if 400 <= code <= 599:
        return code
    prefix = code // 100
    if prefix in {400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504}:
        return prefix
    if code >= 50000:
        return 500
    if code >= 40000:
        return 400
    return 400


def err(code: int, message: str, trace_id: str, status_code: int | None = None) -> JSONResponse:
    """构造错误响应"""
    return JSONResponse(
        status_code=status_code or _status_from_code(code),
        content={
            "code": code,
            "message": message,
            "data": None,
            "trace_id": trace_id,
        },
    )
