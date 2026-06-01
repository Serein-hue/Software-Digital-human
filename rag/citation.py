#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""引用（Citation）生成模块。"""

from typing import Any, Dict, List


def build_citations(contexts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    result = []
    for ctx in contexts:
        meta = ctx.get("metadata", {})
        text = ctx.get("text", "")
        result.append({
            "chunk_id": ctx.get("chunk_id", ""),
            "doc_id": meta.get("doc_id", ""),
            "source_name": ctx.get("source_name", meta.get("source_name", "")),
            "section": ctx.get("section", meta.get("section", "")),
            "page": meta.get("page"),
            "quote": text[:200],
            "score": ctx.get("score", 0.0),
            "domain": ctx.get("domain", meta.get("domain", "")),
            "spot_id": ctx.get("spot_id", meta.get("spot_id", "")),
            "authority_level": ctx.get("authority_level", meta.get("authority_level", "official")),
            "freshness_level": ctx.get("freshness_level", meta.get("freshness_level", "high")),
        })
    return result
