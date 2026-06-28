"""统一响应信封 — 对齐 RAG 服务 {code, message, data, trace_id}"""

from typing import Optional, Any
from pydantic import BaseModel
from starlette.responses import JSONResponse


class Pagination(BaseModel):
    page: int = 1
    page_size: int = 20
    total: int
    total_pages: int


def ok(data: Any, trace_id: str) -> dict:
    return {
        "code": 0,
        "message": "success",
        "data": data,
        "trace_id": trace_id,
    }


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
    return JSONResponse(
        status_code=status_code or _status_from_code(code),
        content={
            "code": code,
            "message": message,
            "data": None,
            "trace_id": trace_id,
        },
    )
