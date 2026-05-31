#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""向量库接入层 — 默认 ChromaDB，Adapter 模式支持切换。"""

import logging
import os
from typing import Any, Dict, List, Optional
from rag.rag_config import config
from rag.text_chunker import Chunk

logger = logging.getLogger("rag.vector_store")


class ChromaStore:
    def __init__(self):
        import chromadb
        persist_dir = config.chroma_persist_dir
        os.makedirs(persist_dir, exist_ok=True)
        self._client = chromadb.PersistentClient(path=persist_dir)
        self._collection_name = config.chroma_collection
        self._collection = self._client.get_or_create_collection(
            name=self._collection_name, metadata={"hnsw:space": "cosine"})
        logger.info("ChromaDB ready: %s (%s)", persist_dir, self._collection_name)

    def upsert(self, chunks: List[Chunk], embeddings: List[List[float]]) -> Dict[str, Any]:
        ids, documents, metadatas = [], [], []
        for chunk, emb in zip(chunks, embeddings):
            ids.append(chunk.chunk_id)
            documents.append(chunk.text)
            metadatas.append(chunk.to_metadata())
        if ids:
            self._collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)
        return {"inserted": len(ids)}

    def query(self, query_embedding: List[float], top_k: int = 5,
              filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        where_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                if value is not None:
                    if isinstance(value, list):
                        conditions.append({key: {"$in": value}})
                    else:
                        conditions.append({key: {"$eq": value}})
            if conditions:
                where_filter = {"$and": conditions} if len(conditions) > 1 else conditions[0]
        try:
            results = self._collection.query(query_embeddings=[query_embedding],
                                             n_results=top_k, where=where_filter,
                                             include=["documents", "metadatas", "distances"])
        except Exception as exc:
            logger.error("Chroma query failed: %s", exc)
            return []
        output = []
        ids = results.get("ids", [[]])[0]
        docs = results.get("documents", [[]])[0]
        metas = results.get("metadatas", [[]])[0]
        dists = results.get("distances", [[]])[0]
        for i in range(len(ids)):
            score = 1.0 - dists[i] if dists[i] is not None else 0.0
            meta = metas[i] or {}
            output.append({"chunk_id": ids[i], "text": docs[i], "score": round(float(score), 4),
                           "metadata": meta, "source_name": meta.get("source_name", ""),
                           "section": meta.get("section", ""), "domain": meta.get("domain", ""),
                           "spot_id": meta.get("spot_id", ""),
                           "freshness_level": meta.get("freshness_level", "high"),
                           "authority_level": meta.get("authority_level", "official")})
        return output

    def count(self) -> int:
        try:
            return self._collection.count()
        except Exception:
            return 0

    def reset(self):
        try:
            self._client.delete_collection(self._collection_name)
        except Exception:
            pass
        self._collection = self._client.get_or_create_collection(
            name=self._collection_name, metadata={"hnsw:space": "cosine"})
        logger.info("Collection reset: %s", self._collection_name)


_store: Optional[ChromaStore] = None


def get_store() -> ChromaStore:
    global _store
    if _store is None:
        _store = ChromaStore()
    return _store


def reset_store():
    global _store
    if _store is not None:
        _store.reset()
    _store = None
