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

    # ── 意图识别 + 元数据过滤 ──────────────────────────────────────
    _INTENT_MAP = [
        # (关键词列表, 意图名, domain过滤列表)
        (["多高", "多大", "多少米", "多长", "多深", "重量", "耗铜", "面积"], "spot_fact", ["spot_detail", "guide"]),
        (["门票", "价格", "多少钱", "票价", "优惠", "免费", "半价", "学生票", "老人票"], "ticket", ["ticket", "guide"]),
        (["几点", "时间", "开放", "表演", "演出", "什么时候", "场次", "开始", "开门", "关门"], "schedule", ["event", "guide", "spot_detail"]),
        (["路线", "怎么走", "怎么去", "导航", "游览", "逛", "推荐", "玩"], "route", ["guide"]),
        (["小孩", "亲子", "带娃", "儿童", "带小孩", "小朋友", "家庭"], "family", ["guide"]),
        (["电话", "客服", "联系", "投诉", "求助", "急救", "医疗"], "service", ["service"]),
        (["公告", "通知", "闭园", "暂停", "临时", "天气", "下雨"], "notice", ["notice", "event"]),
        (["停车", "厕所", "卫生间", "餐饮", "吃饭", "休息", "母婴", "观光车", "住宿"], "facility", ["service", "guide"]),
        (["历史", "文化", "故事", "寓意", "象征", "为什么", "介绍", "背景"], "culture", ["spot_detail", "guide"]),
    ]

    def _classify_intent(self, query: str) -> list:
        """基于关键词判断意图，返回建议的 domain 过滤列表。返回空列表表示不限制。"""
        for keywords, intent, domains in self._INTENT_MAP:
            if any(kw in query for kw in keywords):
                return {"intent": intent, "domains": domains}
        return {"intent": "general", "domains": []}

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
              filters: Optional[Dict[str, Any]] = None,
              trace_id: Optional[str] = None) -> Dict[str, Any]:
        start = time.time()
        trace_id = trace_id or f"trace_{uuid.uuid4().hex[:32]}"
        k = min(top_k or config.top_k_default, config.top_k_max)
        # Step 1: 意图识别 → 自动推导 domain 过滤
        intent_info = self._classify_intent(query_text)
        merged_filters = dict(filters or {})
        if intent_info["domains"] and "domain" not in merged_filters:
            merged_filters["domain"] = intent_info["domains"]
            logger.info("Intent=%s domains=%s", intent_info["intent"], intent_info["domains"])
        # Step 2: 查询向量化
        query_embedding = self._embedder.encode(query_text)
        # Step 3: 向量检索（带元数据过滤）
        contexts_raw = self.store.query(query_embedding, top_k=k, filters=merged_filters or None)
        # Step 4: Fallback
        fallback_info = classify_fallback(contexts_raw, query=query_text)
        if not fallback_info["answerable"]:
            elapsed = round((time.time() - start) * 1000, 1)
            return {"trace_id": trace_id, "answerable": False, "contexts": [],
                    "citations": [],
                    "fallback": {"reason": fallback_info["fallback_reason"],
                                 "safe_reply": fallback_info["safe_reply"],
                                 "top_score": fallback_info["top_score"]},
                    "latency_ms": elapsed}
        # Step 4: 引用
        citations = build_citations(contexts_raw)
        # Step 4b: ContextItem 格式（含全文 text）
        contexts = []
        for ctx in contexts_raw:
            meta = ctx.get("metadata", {})
            contexts.append({
                "chunk_id": ctx.get("chunk_id", ""),
                "text": ctx.get("text", ""),
                "score": ctx.get("score", 0.0),
                "source_name": ctx.get("source_name", meta.get("source_name", "")),
                "section": ctx.get("section", meta.get("section", "")),
                "domain": ctx.get("domain", meta.get("domain", "")),
                "spot_id": ctx.get("spot_id", meta.get("spot_id", "")),
                "authority_level": ctx.get("authority_level", meta.get("authority_level", "official")),
                "freshness_level": ctx.get("freshness_level", meta.get("freshness_level", "high")),
                "page": meta.get("page"),
            })
        # Step 5: medium 时效声明
        has_medium = any(ctx.get("freshness_level") == "medium" for ctx in contexts)
        elapsed = round((time.time() - start) * 1000, 1)
        return {"trace_id": trace_id, "answerable": True, "contexts": contexts,
                "citations": citations,
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
