#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG Core Module — 智慧景区数字人知识服务模块

标准化 RAG Pipeline: 文档解析 → 文本清洗 → 语义分块 → Embedding → 向量入库 → 语义检索 → Fallback

所有阈值、规则、话术均通过 config/ 目录外部配置文件驱动，零硬编码。
支持与数字人系统无缝集成，提供 Flask Blueprint 快速挂载。
"""

__version__ = "2.0.0"
__author__ = "RAG Team"
