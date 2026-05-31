#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RAG 引擎 — 编排完整管线：解析 → 清洗 → 分块 → Embedding → 入库 → 检索 → Fallback。"""

import logging
import os
import time
import uuid
from typing import Any, Dict, List, Optional
from rag.rag_config import config
from rag.document_parser import parse_document
from rag.text_cleaner import clean_text
from rag.text_chunker import chunk_text
from rag.embedding_service import EmbeddingService
from rag.vector_store import get_store, reset_store
from rag.fallback import classify_fallback
from rag.citation import build_citations

logger = logging.getLogger("rag.engine")


class RAGEngine:
    def __init__(self):
        self._embedder = EmbeddingService()
        self._store = None

    @property
    def store(self):
        if self._store is None:
            self._store = get_store()
        return self._store

    def ingest_document(self, filepath: str, metadata: Optional[Dict[str, Any]] = None,
                        chunk_size: Optional[int] = None,
                        overlap: Optional[int] = None) -> Dict[str, Any]:
        start = time.time()
        meta = metadata or {}
        job_id = f"ingest_{uuid.uuid4().hex[:12]}"
        # Step 1: 解析
        raw_text, parse_meta = parse_document(filepath)
        # Step 2: 清洗
        cleaned_text = clean_text(raw_text)
        # Step 3: 分块
        base_meta = {"source_name": meta.get("source_name", os.path.basename(filepath)),
                     "source_file": os.path.basename(filepath),
                     "domain": meta.get("domain", ""),
                     "scenic_id": meta.get("scenic_id", ""),
                     "spot_id": meta.get("spot_id", ""),
                     "section": meta.get("section", ""),
                     "authority_level": meta.get("authority_level", "official"),
                     "freshness_level": meta.get("freshness_level", "high"),
                     "page": meta.get("page")}
        chunks = chunk_text(cleaned_text, chunk_size=chunk_size, overlap=overlap, base_metadata=base_meta)
        if not chunks:
            return {"job_id": job_id, "success": False, "message": "No chunks generated",
                    "chars_raw": len(raw_text), "chars_clean": len(cleaned_text),
                    "chunks": 0, "elapsed_seconds": round(time.time() - start, 2)}
        # Step 4: Embedding
        texts = [c.text for c in chunks]
        embeddings = self._embedder.encode_batch(texts)
        # Step 5: 入库
        result = self.store.upsert(chunks, embeddings)
        elapsed = round(time.time() - start, 2)
        logger.info("[%s] Ingest: %d chunks in %.2fs", job_id, len(chunks), elapsed)
        return {"job_id": job_id, "success": True, "message": "Ingest completed",
                "chars_raw": len(raw_text), "chars_clean": len(cleaned_text),
                "chunks": len(chunks), "inserted": result.get("inserted", 0),
                "elapsed_seconds": elapsed, "collection": config.chroma_collection}

    def query(self, query_text: str, top_k: Optional[int] = None,
              filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        start = time.time()
        trace_id = f"trace_{uuid.uuid4().hex[:32]}"
        k = min(top_k or config.top_k_default, config.top_k_max)
        # Step 1: 查询向量化
        query_embedding = self._embedder.encode(query_text)
        # Step 2: 向量检索
        contexts_raw = self.store.query(query_embedding, top_k=k, filters=filters)
        # Step 3: Fallback
        fallback_info = classify_fallback(contexts_raw, query=query_text)
        if not fallback_info["answerable"]:
            elapsed = round((time.time() - start) * 1000, 1)
            return {"trace_id": trace_id, "answerable": False, "contexts": [],
                    "fallback": {"reason": fallback_info["fallback_reason"],
                                 "safe_reply": fallback_info["safe_reply"],
                                 "top_score": fallback_info["top_score"]},
                    "latency_ms": elapsed}
        # Step 4: 引用
        contexts = build_citations(contexts_raw)
        # Step 5: medium 时效声明
        has_medium = any(ctx.get("freshness_level") == "medium" for ctx in contexts)
        elapsed = round((time.time() - start) * 1000, 1)
        return {"trace_id": trace_id, "answerable": True, "contexts": contexts,
                "fallback": None, "latency_ms": elapsed,
                "disclaimer": config.get_phrase("freshness_medium_disclaimer") if has_medium else None}

    def rebuild_index(self):
        reset_store()
        self._store = None
        return {"success": True, "message": "Index reset, ready for re-ingest"}

    def stats(self) -> Dict[str, Any]:
        return {"provider": config.vector_store_provider,
                "collection": config.chroma_collection,
                "vectors": self.store.count(),
                "embedding_provider": config.embedding_provider,
                "embedding_model": config.embedding_model_name,
                "score_threshold": config.score_threshold,
                "chunk_size": config.chunk_size,
                "chunk_overlap": config.chunk_overlap}


engine = RAGEngine()
