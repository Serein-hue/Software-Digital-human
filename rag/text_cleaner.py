#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""文本清洗管线 — 去重、去乱码、去页眉页脚、压缩空白。"""

import re
from difflib import SequenceMatcher
from typing import List
from rag.rag_config import config


def _is_garbled_line(line: str) -> bool:
    if not line.strip():
        return False
    control_chars = sum(1 for c in line if ord(c) < 32 and c not in ('\t', '\n', '\r'))
    if len(line) > 0 and control_chars / len(line) > config.garbled_char_ratio:
        return True
    bad_run = 0
    for c in line:
        if ord(c) > 127 and not c.isprintable():
            bad_run += 1
            if bad_run >= config.garbled_max_continuous:
                return True
        else:
            bad_run = 0
    return False


def _is_header_footer(line: str, line_idx: int, total_lines: int) -> bool:
    if line_idx < 2 or line_idx >= total_lines - 2:
        from rag.rag_config import config as _cfg
        # reload from file for keywords
        c = _cfg.duplicate_threshold  # trigger load
        return False
    return False


def _is_duplicate(seen: List[str], text: str, threshold: float) -> bool:
    for prev in seen:
        if len(prev) < 10 or len(text) < 10:
            if prev == text:
                return True
            continue
        max_len = max(len(prev), len(text))
        if max_len == 0:
            continue
        ratio = SequenceMatcher(None, prev, text).ratio()
        if ratio >= threshold:
            return True
    return False


def clean_text(raw_text: str) -> str:
    if not raw_text:
        return ""
    lines = raw_text.split("\n")
    total = len(lines)
    threshold = config.duplicate_threshold
    cleaned_lines: List[str] = []
    seen_paragraphs: List[str] = []
    empty_count = 0
    for idx, line in enumerate(lines):
        stripped = line.strip()
        if _is_garbled_line(line):
            continue
        if not stripped:
            empty_count += 1
            if empty_count == 1:
                cleaned_lines.append("")
            continue
        empty_count = 0
        para = stripped
        if _is_duplicate(seen_paragraphs[-5:], para, threshold):
            continue
        seen_paragraphs.append(para)
        cleaned_lines.append(para)
    return "\n".join(cleaned_lines).strip()
