#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG 全局配置管理 — 从外部 JSON 文件加载所有阈值和规则。
所有配置通过 config/ 目录下的 JSON 文件驱动，不做硬编码。
"""

import json
import os
import re
from typing import Any, Dict, List, Optional

_CONFIG_DIR = os.path.join(os.path.dirname(__file__), "config")


def _load_json(filename: str) -> Dict[str, Any]:
    path = os.path.join(_CONFIG_DIR, filename)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_sensitive_words(filename: str) -> List[str]:
    path = os.path.join(_CONFIG_DIR, filename)
    if not os.path.exists(path):
        return []
    words = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                words.append(line)
    return words


class RAGConfig:
    """全局 RAG 配置单例，延迟加载所有配置文件。"""

    def __init__(self):
        self._cleaning = None
        self._chunk = None
        self._embedding = None
        self._vector_store = None
        self._fallback = None
        self._phrases = None
        self._logging_cfg = None
        self._sensitive_words = None
        self._sensitive_patterns = None

    @property
    def duplicate_threshold(self) -> float:
        if self._cleaning is None:
            self._cleaning = _load_json("cleaning_rules.json")
        return float(self._cleaning.get("duplicate_similarity_threshold", 0.90))

    @property
    def garbled_max_continuous(self) -> int:
        if self._cleaning is None:
            self._cleaning = _load_json("cleaning_rules.json")
        return int(self._cleaning.get("乱码判定", {}).get("连续非UTF8最大容忍", 3))

    @property
    def garbled_char_ratio(self) -> float:
        if self._cleaning is None:
            self._cleaning = _load_json("cleaning_rules.json")
        return float(self._cleaning.get("乱码判定", {}).get("不可见字符比例阈值", 0.05))

    @property
    def chunk_size(self) -> int:
        if self._chunk is None:
            self._chunk = _load_json("chunk_config.json")
        return int(self._chunk.get("default_chunk_size", 512))

    @property
    def chunk_overlap(self) -> int:
        if self._chunk is None:
            self._chunk = _load_json("chunk_config.json")
        return int(self._chunk.get("default_overlap", 64))

    @property
    def embedding_provider(self) -> str:
        if self._embedding is None:
            self._embedding = _load_json("embedding_config.json")
        return str(self._embedding.get("provider", "local"))

    @property
    def embedding_model_name(self) -> str:
        if self._embedding is None:
            self._embedding = _load_json("embedding_config.json")
        return str(self._embedding.get("local", {}).get("model_name", "BAAI/bge-large-zh-v1.5"))

    @property
    def embedding_device(self) -> str:
        if self._embedding is None:
            self._embedding = _load_json("embedding_config.json")
        return str(self._embedding.get("local", {}).get("device", "cpu"))

    @property
    def embedding_local_config(self) -> Dict[str, Any]:
        if self._embedding is None:
            self._embedding = _load_json("embedding_config.json")
        return dict(self._embedding.get("local", {}))

    @property
    def embedding_cloud_config(self) -> Dict[str, Any]:
        if self._embedding is None:
            self._embedding = _load_json("embedding_config.json")
        return dict(self._embedding.get("cloud", {}))

    @property
    def vector_store_provider(self) -> str:
        if self._vector_store is None:
            self._vector_store = _load_json("vector_store_config.json")
        return str(self._vector_store.get("provider", "chroma"))

    @property
    def chroma_persist_dir(self) -> str:
        if self._vector_store is None:
            self._vector_store = _load_json("vector_store_config.json")
        return str(self._vector_store.get("chroma", {}).get("persist_dir", "rag/chroma_db"))

    @property
    def chroma_collection(self) -> str:
        if self._vector_store is None:
            self._vector_store = _load_json("vector_store_config.json")
        return str(self._vector_store.get("chroma", {}).get("collection_name", "scenic_kb"))

    @property
    def score_threshold(self) -> float:
        if self._fallback is None:
            self._fallback = _load_json("fallback_config.json")
        return float(self._fallback.get("score_threshold", 0.50))

    @property
    def sensitive_check_enabled(self) -> bool:
        if self._fallback is None:
            self._fallback = _load_json("fallback_config.json")
        return bool(self._fallback.get("sensitive_check_enabled", True))

    @property
    def realtime_domains(self) -> List[str]:
        if self._fallback is None:
            self._fallback = _load_json("fallback_config.json")
        return list(self._fallback.get("实时类domain标记", []))

    @property
    def top_k_default(self) -> int:
        if self._fallback is None:
            self._fallback = _load_json("fallback_config.json")
        return int(self._fallback.get("top_k_default", 5))

    @property
    def top_k_max(self) -> int:
        if self._fallback is None:
            self._fallback = _load_json("fallback_config.json")
        return int(self._fallback.get("top_k_max", 20))

    @property
    def fallback_phrases(self) -> Dict[str, str]:
        if self._phrases is None:
            self._phrases = _load_json("fallback_phrases.json")
        return dict(self._phrases)

    def get_phrase(self, key: str, default: str = "") -> str:
        return str(self.fallback_phrases.get(key, default))

    @property
    def sensitive_words(self) -> List[str]:
        if self._sensitive_words is None:
            if self._fallback is None:
                self._fallback = _load_json("fallback_config.json")
            word_file = self._fallback.get("sensitive_word_file", "rag/config/sensitive_words.txt")
            self._sensitive_words = _load_sensitive_words(word_file)
        return list(self._sensitive_words)

    @property
    def sensitive_patterns(self) -> List[re.Pattern]:
        if self._sensitive_patterns is None:
            self._sensitive_patterns = []
            for w in self.sensitive_words:
                try:
                    self._sensitive_patterns.append(re.compile(w))
                except re.error:
                    continue
            # 内置敏感模式
            try:
                self._sensitive_patterns.append(re.compile(r"1[3-9]\d{9}"))
                self._sensitive_patterns.append(re.compile(r"\d{17}[\dXx]"))
            except re.error:
                pass
        return list(self._sensitive_patterns)


# 全局配置单例
config = RAGConfig()
