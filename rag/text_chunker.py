#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""语义化文本分块 — 按段落/句子级别切割，保留语义完整性。"""

import hashlib
import re
from typing import Any, Dict, List, Optional
from rag.rag_config import config


class Chunk:
    """知识块数据模型。"""

    def __init__(self, text: str, source_name: str = "", source_file: str = "",
                 domain: str = "", scenic_id: str = "", spot_id: str = "",
                 section: str = "", authority_level: str = "official",
                 freshness_level: str = "high", page: int = None,
                 chunk_seq: int = 1, chunk_total: int = 1):
        self.text = text
        self.source_name = source_name
        self.source_file = source_file
        self.domain = domain
        self.scenic_id = scenic_id
        self.spot_id = spot_id
        self.section = section
        self.authority_level = authority_level
        self.freshness_level = freshness_level
        self.page = page
        self.chunk_seq = chunk_seq
        self.chunk_total = chunk_total

    @property
    def chunk_id(self) -> str:
        raw = f"{self.source_file}|{self.section}|{self.chunk_seq}|{self.text[:50]}"
        return "chunk_" + hashlib.md5(raw.encode("utf-8", errors="ignore")).hexdigest()[:14]

    @property
    def doc_id(self) -> str:
        raw = f"{self.source_file}|{self.scenic_id}|{self.domain}"
        return "doc_" + hashlib.md5(raw.encode("utf-8", errors="ignore")).hexdigest()[:12]

    def to_dict(self) -> Dict[str, Any]:
        return {"chunk_id": self.chunk_id, "doc_id": self.doc_id, "text": self.text,
                "source_name": self.source_name, "source_file": self.source_file,
                "domain": self.domain, "scenic_id": self.scenic_id, "spot_id": self.spot_id,
                "section": self.section, "authority_level": self.authority_level,
                "freshness_level": self.freshness_level, "page": self.page,
                "chunk_seq": self.chunk_seq, "chunk_total": self.chunk_total}

    def to_metadata(self) -> Dict[str, Any]:
        return {"source_name": self.source_name, "source_file": self.source_file,
                "domain": self.domain, "scenic_id": self.scenic_id, "spot_id": self.spot_id,
                "section": self.section, "authority_level": self.authority_level,
                "freshness_level": self.freshness_level, "page": self.page,
                "chunk_seq": self.chunk_seq, "chunk_total": self.chunk_total}


def _len_with_newlines(parts: List[str]) -> int:
    if not parts:
        return 0
    return sum(len(p) for p in parts) + (len(parts) - 1)


def chunk_text(text: str, chunk_size: int = None, overlap: int = None,
               base_metadata: dict = None) -> List[Chunk]:
    chunk_size = chunk_size or config.chunk_size
    overlap = overlap or config.chunk_overlap
    meta = base_metadata or {}
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    segments = []
    for para in paras:
        if len(para) <= chunk_size:
            segments.append(para)
        else:
            sents = re.split(r"(?<=[。！？!?…])", para)
            segments.extend(s.strip() for s in sents if s.strip())
    chunks = []
    buf = []
    chunk_seq = 0
    for seg in segments:
        current_len = _len_with_newlines(buf) if buf else 0
        if current_len + len(seg) + (1 if buf else 0) <= chunk_size:
            buf.append(seg)
            continue
        if buf:
            chunk_seq += 1
            chunks.append(("\n".join(buf).strip(), chunk_seq))
        if overlap > 0 and chunks:
            tail_text = chunks[-1][0]
            tail_chars = []
            tail_len = 0
            for t_char in reversed(tail_text):
                tail_chars.insert(0, t_char)
                tail_len += 1
                if tail_len >= overlap:
                    break
            buf = ["".join(tail_chars)] if tail_chars else []
        else:
            buf = []
        buf.append(seg)
    if buf:
        chunk_seq += 1
        chunks.append(("\n".join(buf).strip(), chunk_seq))
    total = len(chunks)
    result = []
    for txt, seq in chunks:
        result.append(Chunk(text=txt, source_name=meta.get("source_name", ""),
                            source_file=meta.get("source_file", ""),
                            domain=meta.get("domain", ""),
                            scenic_id=meta.get("scenic_id", ""),
                            spot_id=meta.get("spot_id", ""),
                            section=meta.get("section", ""),
                            authority_level=meta.get("authority_level", "official"),
                            freshness_level=meta.get("freshness_level", "high"),
                            page=meta.get("page"), chunk_seq=seq, chunk_total=total))
    return result
