#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""LLM 客户端 — 通过 DeepSeek API 生成回答（兼容 OpenAI 格式）"""

import json
import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger("rag.llm")

_CONF_CACHE = None
_LAST_MTIME = 0


def _get_llm_conf() -> dict:
    global _CONF_CACHE, _LAST_MTIME
    _dir = os.path.join(os.path.dirname(__file__), "config")
    path = os.path.join(_dir, "llm_config.json")
    try:
        current_mtime = os.path.getmtime(path)
        if _CONF_CACHE is None or current_mtime > _LAST_MTIME:
            with open(path, "r", encoding="utf-8") as f:
                _CONF_CACHE = json.load(f)
                _LAST_MTIME = current_mtime
    except Exception as exc:
        if _CONF_CACHE is None:
            logger.warning("Failed to load llm_config: %s", exc)
            _CONF_CACHE = {}
    return _CONF_CACHE


def generate_answer(query: str, contexts: list[dict]) -> dict:
    """根据检索上下文生成回答。

    Args:
        query: 用户原始问题
        contexts: rag_engine.query 返回的上下文列表

    Returns:
        {"answer": str, "tokens": int, "error": str | None}
    """
    conf = _get_llm_conf()
    ds = conf.get("deepseek", {})
    api_key = ds.get("api_key", os.environ.get("DEEPSEEK_API_KEY", ""))
    if not api_key:
        return {"answer": "", "tokens": 0, "error": "未配置 DeepSeek API Key，请在 rag/config/llm_config.json 中填写 api_key 或设置环境变量 DEEPSEEK_API_KEY"}

    # 构建参考上下文文本
    refs = []
    for i, ctx in enumerate(contexts, 1):
        text = ctx.get("text", "").strip()
        source = ctx.get("source_name", "未知来源")
        score = ctx.get("score", 0)
        if text:
            refs.append(f"[{i}] 来源「{source}」(相关度={score:.2f}):\n{text}")

    if not refs:
        return {"answer": "抱歉，知识库中没有找到相关信息。", "tokens": 0, "error": None}

    references = "\n\n".join(refs)
    system_prompt = conf.get("system_prompt", "你是一个专业的景区导览助手。请根据参考资料回答。")
    temperature = ds.get("temperature", 0.3)
    max_tokens = ds.get("max_tokens", 1024)
    model = ds.get("model", "deepseek-chat")
    api_base = ds.get("api_base", "https://api.deepseek.com/v1")
    timeout = ds.get("timeout", 30)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"## 参考资料\n\n{references}\n\n## 游客问题\n\n{query}\n\n请根据参考资料回答游客的问题。"},
    ]

    try:
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                f"{api_base}/chat/completions",
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
            choice = data["choices"][0]
            answer = choice["message"]["content"].strip()
            tokens = data.get("usage", {}).get("total_tokens", 0)
            logger.info("DeepSeek answer: %d tokens, query=%s", tokens, query[:30])
            return {"answer": answer, "tokens": tokens, "error": None}
    except httpx.TimeoutException:
        return {"answer": "", "tokens": 0, "error": f"DeepSeek API 请求超时（>{timeout}s）"}
    except Exception as exc:
        logger.error("DeepSeek API error: %s", exc)
        return {"answer": "", "tokens": 0, "error": f"生成回答失败: {exc}"}
