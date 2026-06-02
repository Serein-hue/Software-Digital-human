#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LipSync 测试工具 — 不启动 Fay 就能验证嘴型同步是否工作

用法:
  python skills/test_lipsync.py <音频文件路径>
  python skills/test_lipsync.py samples/sample-*.wav    # 测试所有样本

输出: 时序图 + JSON 格式的 viseme 数据
"""

import sys
import os
import json

# 添加项目根到路径
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "test", "ovr_lipsync"))

from test_olipsync import LipSyncGenerator


def format_viseme_bar(viseme: str, width: int = 24) -> str:
    """将 viseme 渲染为 ASCII 进度条"""
    values = {"sil": 0.0, "PP": 0.2, "TH": 0.4, "DD": 0.5, "E": 0.6, "oh": 0.7, "ou": 0.8, "aa": 0.9}
    val = values.get(viseme, 0.0)
    filled = int(val * width)
    bar = "#" * filled + "." * (width - filled)
    return f"|{bar}| {val:.1f} ({viseme})"


def main():
    if len(sys.argv) < 2:
        # 默认测试所有 wav 样本
        samples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")
        if os.path.isdir(samples_dir):
            files = sorted([f for f in os.listdir(samples_dir) if f.endswith(('.wav', '.mp3'))])
        else:
            print(f"用法: python {sys.argv[0]} <音频文件路径>")
            sys.exit(1)
    else:
        files = sys.argv[1:]

    gen = LipSyncGenerator()

    for filepath in files:
        if not os.path.exists(filepath):
            # 尝试在 samples/ 下找
            alt = os.path.join(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                "samples",
                filepath,
            )
            if os.path.exists(alt):
                filepath = alt
            else:
                print(f"[ERR] 文件不存在: {filepath}")
                continue

        print(f"\n{'='*60}")
        print(f"FILE: {filepath}")
        print(f"{'='*60}")

        visemes = gen.generate_visemes(filepath)
        if not visemes:
            print("[ERR] 未生成 viseme 数据")
            continue

        consolidated = gen.consolidate_visemes(visemes)

        # 统计
        total_ms = sum(v["Time"] for v in consolidated)
        unique_visemes = set(v["Lip"] for v in consolidated)
        print(f"[DATA] {len(consolidated)} 帧 (合并后) / {total_ms}ms 总时长")
        print(f"[DIST] Viseme 分布: {sorted(unique_visemes)}")

        # 按 viseme 统计时长
        from collections import Counter
        time_by_viseme = Counter()
        for v in consolidated:
            time_by_viseme[v["Lip"]] += v["Time"]
        print(f"[TOP] Top visemes: {time_by_viseme.most_common(5)}")

        # 时序图（最多显示 80 帧）
        print(f"\n[TIMELINE] ({min(len(consolidated), 80)}/{len(consolidated)} 帧):")
        for v in consolidated[:80]:
            bar = format_viseme_bar(v["Lip"])
            print(f"  {v['Time']:4d}ms {bar}")

        # 输出完整 JSON
        print(f"\n[JSON] (合并后, {len(consolidated)} 帧):")
        print(json.dumps(consolidated, ensure_ascii=False, indent=2))

        # 输出 viseme → 前端期望格式
        print(f"\n[DATA] 前端 LipData[] 格式 (可直接用于 startLipSync):")
        print(json.dumps(consolidated, ensure_ascii=False))


if __name__ == "__main__":
    main()
