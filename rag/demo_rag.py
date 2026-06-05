#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG 模块一键演示脚本
运行前确保 RAG 服务已启动：
    cd C:/Users/酒家何处/Software-Digital-human
    HF_ENDPOINT=https://hf-mirror.com rag/.venv/Scripts/python.exe rag/run_rag_server.py
"""

import requests
import json

BASE = "http://127.0.0.1:5010/api/v1/rag"
TOKEN = "Bearer dev-token-123456"
HEADERS = {"Authorization": TOKEN}


def print_box(title, content, indent=2):
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)
    lines = json.dumps(content, ensure_ascii=False, indent=2) if isinstance(content, dict) else str(content)
    for line in lines.split("\n"):
        print(" " * indent + line)
    print()


def test(method, path, **kwargs):
    url = f"{BASE}{path}"
    fn = getattr(requests, method.lower())
    headers = kwargs.pop("headers", HEADERS)
    r = fn(url, headers=headers, **kwargs)
    return r.json()


def main():
    print()
    print("╔════════════════════════════════════════════════════╗")
    print("║     灵山数字人 RAG 模块 — 功能演示              ║")
    print("╚════════════════════════════════════════════════════╝")
    print()
    print(" [1/6] 健康检查")
    print_box("GET /health", test("get", "/health", headers={}))

    print(" [2/6] 知识库统计")
    print_box("GET /stats", test("get", "/stats"))

    print(" [3/6] 语义检索 — 可回答的问题")
    result = test("post", "/query", json={"query": "灵山大佛有多高？"})
    data = result.get("data", {})
    if data.get("answerable"):
        best = data["contexts"][0]
        print_box(f"问：灵山大佛有多高？\n→ 分数={best['score']}", {
            "答案片段": best["text"],
            "来源": best["source_name"],
            "领域": best["domain"],
        })
    else:
        print_box("问：灵山大佛有多高？", {"结果": "未找到答案"})

    print(" [4/6] 语义检索 — 低分兜底（Fallback）")
    result = test("post", "/query", json={"query": "今天天气怎么样？"})
    data = result.get("data", {})
    if not data.get("answerable"):
        print_box("问：今天天气怎么样？\n→ 知识库无此内容，走兜底", {
            "兜底原因": data["fallback"]["reason"],
            "安全回复": data["fallback"]["safe_reply"],
        })
    else:
        print_box("问：今天天气怎么样？", {"结果": "居然能回答"})

    print(" [5/6] 登记资料来源（H-03）")
    result = test("post", "/sources", json={
        "name": "灵山官方游览手册",
        "filepath": "rag-knowledge/lingshan-guide.md",
        "domain": "guide",
        "description": "来自灵山景区官方发布的游览指南",
        "tags": ["官方", "景点介绍"],
    })
    print_box("POST /sources", result)

    print(" [6/6] 录入问答对（H-03）")
    result = test("post", "/qa", json={
        "question": "灵山大佛有多高？",
        "answer": "灵山大佛通高88米（主体79米+莲花底座9米）",
        "source": "lingshan-dataset.md",
        "domain": "spot_detail",
    })
    print_box("POST /qa", result)

    print()
    print("╔════════════════════════════════════════════════════╗")
    print("║   ✅ 所有演示完成！                             ║")
    print("║   1-2 : 服务健康检查                             ║")
    print("║   3-4 : 核心检索（能答+不能答都演示了）          ║")
    print("║   5-6 : 管理功能（H-03 新接口）                  ║")
    print("╚════════════════════════════════════════════════════╝")
    print()


if __name__ == "__main__":
    main()
