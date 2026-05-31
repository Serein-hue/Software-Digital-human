#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fallback 策略模块 — 判断检索结果是否可回答，提供降级回复。"""

import re
from typing import Any, Dict, List, Optional
from rag.rag_config import config


def check_sensitive_query(query: str) -> Optional[str]:
    if not config.sensitive_check_enabled:
        return None
    for pattern in config.sensitive_patterns:
        if pattern.search(query):
            return "sensitive_query"
    return None


def classify_fallback(contexts: List[Dict[str, Any]], query: str = "") -> Dict[str, Any]:
    # 1. 敏感查询
    reason = check_sensitive_query(query)
    if reason:
        return {"answerable": False, "fallback_reason": reason,
                "safe_reply": config.get_phrase("sensitive_query", "无法处理该查询。"),
                "top_score": 0.0}
    # 2. 无资料
    if not contexts:
        return {"answerable": False, "fallback_reason": "no_relevant_docs",
                "safe_reply": config.get_phrase("no_relevant_docs", "知识库中未找到相关信息。"),
                "top_score": 0.0}
    top_score = contexts[0].get("score", 0.0)
    # 3. 低分
    if top_score < config.score_threshold:
        return {"answerable": False, "fallback_reason": "low_confidence",
                "safe_reply": config.get_phrase("low_confidence", "不太确定。"),
                "top_score": top_score}
    # 4. 实时类
    domain = contexts[0].get("domain", "")
    if domain in config.realtime_domains:
        return {"answerable": False, "fallback_reason": "realtime_data_unavailable",
                "safe_reply": config.get_phrase("realtime_data_unavailable", "实时数据暂时无法获取。"),
                "top_score": top_score}
    return {"answerable": True, "fallback_reason": None, "safe_reply": None, "top_score": top_score}
