#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Embedding 适配层 — 支持本地模型（PyTorch）、ChromaLite（ONNX）和云端 API 切换。"""

import hashlib
import logging
import os
from typing import Dict, List, Optional
from rag.rag_config import config

# 默认离线模式：模型已缓存至本地，避免在中国网络受限环境重试
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_HUB_OFFLINE", "1")

logger = logging.getLogger("rag.embedding")


class EmbeddingService:
    def __init__(self, provider: Optional[str] = None):
        self._provider = provider or config.embedding_provider
        self._local_model = None
        self._chroma_ef = None
        self._cache: Dict[str, List[float]] = {}

    def _load_local_model(self):
        if self._local_model is not None:
            return
        try:
            from sentence_transformers import SentenceTransformer
            model_name = config.embedding_model_name
            device = config.embedding_device
            logger.info("Loading local embedding model: %s (device=%s)", model_name, device)
            self._local_model = SentenceTransformer(model_name, device=device)
        except Exception as exc:
            raise RuntimeError(f"Failed to load local embedding model: {exc}") from exc

    def _get_chroma_ef(self):
        """ChromaDB 内置 ONNX 嵌入函数（无需 PyTorch）。"""
        if self._chroma_ef is not None:
            return self._chroma_ef
        try:
            from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
            self._chroma_ef = ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])
            logger.info("Loaded Chroma ONNX embedding (all-MiniLM-L6-v2)")
            return self._chroma_ef
        except Exception as exc:
            raise RuntimeError(f"Failed to load Chroma ONNX embedding: {exc}") from exc

    def _call_cloud_api(self, text: str) -> List[float]:
        import requests
        cloud = config.embedding_cloud_config
        base_url = cloud.get("api_base", "http://127.0.0.1:5000/v1")
        api_key = cloud.get("api_key", "sk-fay")
        model = cloud.get("model", "embedding")
        timeout = int(cloud.get("timeout", 30))
        url = base_url.rstrip("/") + "/embeddings"
        payload = {"input": text, "model": model}
        headers = {"Authorization": f"Bearer {api_key}"}
        resp = requests.post(url, json=payload, headers=headers, timeout=timeout)
        if resp.status_code != 200:
            raise RuntimeError(f"Cloud embedding API error: {resp.status_code}")
        data = resp.json()
        embedding = data.get("data", [{}])[0].get("embedding")
        if embedding is None:
            raise RuntimeError("Cloud embedding response missing 'embedding' field")
        return embedding

    def encode(self, text: str) -> List[float]:
        cache_key = hashlib.md5(f"{self._provider}|{text[:200]}".encode()).hexdigest()
        if cache_key in self._cache:
            return self._cache[cache_key]
        if self._provider == "local":
            self._load_local_model()
            vec = self._local_model.encode(text, normalize_embeddings=True).tolist()
        elif self._provider == "chroma_default":
            ef = self._get_chroma_ef()
            vec = ef([text])[0].tolist()
        elif self._provider == "cloud":
            vec = self._call_cloud_api(text)
        else:
            raise ValueError(f"Unknown embedding provider: {self._provider}")
        self._cache[cache_key] = vec
        return vec

    def encode_batch(self, texts: List[str]) -> List[List[float]]:
        if self._provider == "local":
            self._load_local_model()
            batch_size = int(config.embedding_local_config.get("batch_size", 16))
            vecs = self._local_model.encode(texts, batch_size=batch_size,
                                            normalize_embeddings=True, show_progress_bar=False)
            return [v.tolist() for v in vecs]
        elif self._provider == "chroma_default":
            ef = self._get_chroma_ef()
            return [v.tolist() for v in ef(texts)]
        else:
            return [self.encode(t) for t in texts]

    def clear_cache(self):
        self._cache.clear()
