#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""灵山胜境示范资料入库脚本。"""

import logging, os, sys
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
from rag.rag_engine import engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("rag.ingest")

def main():
    data_dir = os.path.join(_PROJECT_ROOT, "rag-knowledge")
    files = []
    for fname in ["lingshan-dataset.md", "lingshan-guide.md", "lingshan-qa.md"]:
        fpath = os.path.join(data_dir, fname)
        if os.path.exists(fpath):
            if "dataset" in fname:
                domain = "spot_detail"
                freshness = "high"
                source_name = "灵山胜境景点结构化数据集"
            elif "qa" in fname:
                domain = "guide"
                freshness = "high"
                source_name = "灵山胜境知识库（QA）"
            else:
                domain = "guide"
                freshness = "medium"
                source_name = "灵山胜境游览指南"
            files.append((fpath, {"source_name": source_name,
                                  "domain": domain, "scenic_id": "lingshan",
                                  "authority_level": "official", "freshness_level": freshness}))
            logger.info("Found: %s", fpath)
        else:
            logger.warning("Not found: %s", fpath)
    if not files:
        logger.error("No files found in rag-knowledge/")
        logger.info("You can ingest files via API: POST /api/v1/rag/ingest")
        return
    total = 0
    for fpath, meta in files:
        logger.info("Ingesting %s ...", os.path.basename(fpath))
        result = engine.ingest_document(filepath=fpath, metadata=meta)
        if result.get("success"):
            total += result.get("chunks", 0)
            logger.info("  -> %d chunks (%.2fs)", result["chunks"], result["elapsed_seconds"])
        else:
            logger.error("  -> FAILED: %s", result.get("message"))
    logger.info("Done: %d total chunks", total)
    logger.info("Stats: %s", engine.stats())

if __name__ == "__main__":
    main()
