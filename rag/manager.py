#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG 管理模块 — sources（资料来源）和 qa（问答对）的持久化存储。

H-03 新增：
  1. register_source() — 登记资料来源
  2. register_qa() — 采纳问答对

数据用 JSON 文件持久化，存储在 rag/data/ 目录下。
"""

import json
import logging
import os
import time
import uuid
from typing import Any, Dict, List, Optional

logger = logging.getLogger("rag.manager")

_DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
_SOURCES_FILE = os.path.join(_DATA_DIR, "sources.json")
_QA_FILE = os.path.join(_DATA_DIR, "qa_pairs.json")


def _ensure_dir():
    os.makedirs(_DATA_DIR, exist_ok=True)


def _load(filepath: str) -> List[Dict[str, Any]]:
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load %s: %s, starting fresh", filepath, exc)
        return []


def _save(filepath: str, records: List[Dict[str, Any]]):
    _ensure_dir()
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)


def _now_str() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


# ── Source ──────────────────────────────────────────────────────────────


def register_source(
    name: str,
    filepath: str,
    domain: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """登记一份新的资料来源。"""
    records = _load(_SOURCES_FILE)
    source_id = f"src_{time.strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
    record = {
        "source_id": source_id,
        "name": name,
        "filepath": filepath,
        "domain": domain or "",
        "description": description or "",
        "tags": tags or [],
        "created_at": _now_str(),
    }
    records.append(record)
    _save(_SOURCES_FILE, records)
    logger.info("[%s] Source registered: %s", source_id, name)
    return {"source_id": source_id, "success": True}


def list_sources(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """分页列出已登记的资料来源。"""
    records = _load(_SOURCES_FILE)
    total = len(records)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = start + page_size
    items = records[start:end] if start < total else []
    return {"items": items, "pagination": {
        "page": page, "page_size": page_size,
        "total": total, "total_pages": total_pages,
    }}


# ── QA ──────────────────────────────────────────────────────────────────


def register_qa(
    question: str,
    answer: str,
    source: Optional[str] = None,
    domain: Optional[str] = None,
) -> Dict[str, Any]:
    """采纳一问一答对，直接入库。"""
    records = _load(_QA_FILE)
    qa_id = f"qa_{time.strftime('%Y%m%d')}_{uuid.uuid4().hex[:6]}"
    record = {
        "qa_id": qa_id,
        "question": question,
        "answer": answer,
        "source": source or "",
        "domain": domain or "",
        "created_at": _now_str(),
    }
    records.append(record)
    _save(_QA_FILE, records)
    logger.info("[%s] QA registered: %s", qa_id, question[:40])
    return {"qa_id": qa_id, "success": True}


def list_qa(page: int = 1, page_size: int = 20) -> Dict[str, Any]:
    """分页列出已采纳的问答对。"""
    records = _load(_QA_FILE)
    total = len(records)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = start + page_size
    items = records[start:end] if start < total else []
    return {"items": items, "pagination": {
        "page": page, "page_size": page_size,
        "total": total, "total_pages": total_pages,
    }}
