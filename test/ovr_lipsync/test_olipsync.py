#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Real LipSyncGenerator — 音频振幅驱动嘴型同步

原理：将音频分帧（50ms/帧），计算每帧的 RMS 振幅，
      归一化后映射到 OVR LipSync viseme 名称，
      Live2D 前端根据 viseme 名称查表得到 ParamMouthOpenY 值。

Viseme 映射表（与前端 lipsync.ts 中的 visemeMap 一致）：
  sil=0.0, PP=0.2, TH=0.4, DD=0.5, E=0.6, oh=0.7, ou=0.8, aa=0.9

依赖：
  - pydub（需要 ffmpeg 在 PATH 中 → 用 conda install -c conda-forge ffmpeg）
  - numpy（已在 scenic-dh 环境中）
"""

import os
import sys
import numpy as np
from pydub import AudioSegment

# ── 确保 ffmpeg 在 PATH 中 ──────────────────────────────────────────
_FFMPEG_CANDIDATES = [
    r"C:\Users\32344\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.WinGet.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin",
    r"C:\Program Files\ffmpeg\bin",
    r"C:\ffmpeg\bin",
]
for _p in _FFMPEG_CANDIDATES:
    if os.path.isdir(_p) and _p not in os.environ.get("PATH", ""):
        os.environ["PATH"] = _p + os.pathsep + os.environ.get("PATH", "")


class LipSyncGenerator:
    """基于音频 RMS 振幅的嘴型同步生成器。"""

    # 振幅区间 → viseme 映射
    # 归一化 RMS [0, 1] → 嘴型开合度 [0.0, 0.9]
    AMPLITUDE_LEVELS = [
        (0.00, 0.04, "sil"),  # 静音     → 0.0
        (0.04, 0.10, "PP"),   # 极小     → 0.2
        (0.10, 0.18, "TH"),   # 小       → 0.4
        (0.18, 0.28, "DD"),   # 中小     → 0.5
        (0.28, 0.40, "E"),    # 中       → 0.6
        (0.40, 0.55, "oh"),   # 中大     → 0.7
        (0.55, 0.72, "ou"),   # 大       → 0.8
        (0.72, 1.00, "aa"),   # 最大     → 0.9
    ]

    FRAME_MS = 50  # 每帧时长（毫秒），20 FPS

    def generate_visemes(self, audio_path: str) -> list:
        """从音频文件生成 viseme 帧列表。

        Args:
            audio_path: 音频文件路径（支持 WAV / MP3）

        Returns:
            list[dict]: [{"Lip": str, "Time": int}, ...]
                        Lip = viseme 名称，Time = 时长（毫秒）
        """
        if not os.path.exists(audio_path):
            print(f"[LipSync] 音频文件不存在: {audio_path}")
            return []

        try:
            audio = AudioSegment.from_file(audio_path)

            # 转单声道（确保 RMS 计算正确）
            if audio.channels > 1:
                audio = audio.set_channels(1)

            duration_ms = len(audio)
            if duration_ms < 10:
                print(f"[LipSync] 音频过短: {duration_ms}ms")
                return []

            # ── 第一遍：找峰值 RMS ──
            peak_rms = 0.0
            for start_ms in range(0, duration_ms, self.FRAME_MS):
                end_ms = min(start_ms + self.FRAME_MS, duration_ms)
                frame = audio[start_ms:end_ms]
                rms = frame.rms  # pydub 的 rms 范围 0-32768
                if rms > peak_rms:
                    peak_rms = rms

            # 如果音频近乎静音，只返回一个 sil 帧
            if peak_rms < 50:
                print(f"[LipSync] 音频几乎静音，peak_rms={peak_rms}")
                return [{"Lip": "sil", "Time": duration_ms}]

            # ── 第二遍：生成 viseme ──
            visemes = []
            for start_ms in range(0, duration_ms, self.FRAME_MS):
                end_ms = min(start_ms + self.FRAME_MS, duration_ms)
                frame = audio[start_ms:end_ms]
                rms_norm = min(frame.rms / peak_rms, 1.0)
                viseme = self._amplitude_to_viseme(rms_norm)
                visemes.append({"Lip": viseme, "Time": end_ms - start_ms})

            print(f"[LipSync] 生成 {len(visemes)} 个 viseme，音频 {duration_ms}ms，peak_rms={peak_rms}")
            return visemes

        except Exception as e:
            print(f"[LipSync] viseme 生成失败: {e}")
            return []

    def consolidate_visemes(
        self, visemes: list, min_duration: float = 0.05
    ) -> list:
        """合并相邻相同的 viseme，降低数据量。

        Args:
            visemes: generate_visemes() 返回的列表
            min_duration: 最小合并时长（秒），默认 0.05

        Returns:
            list[dict]: 合并后的 viseme 列表
        """
        if not visemes:
            return []

        min_ms = int(min_duration * 1000)
        consolidated = []
        current = dict(visemes[0])  # 拷贝

        for v in visemes[1:]:
            if v["Lip"] == current["Lip"]:
                current["Time"] += v["Time"]
            else:
                if current["Time"] >= min_ms:
                    consolidated.append(current)
                current = dict(v)

        if current["Time"] >= min_ms:
            consolidated.append(current)

        return consolidated

    def _amplitude_to_viseme(self, amplitude: float) -> str:
        """将归一化 RMS 振幅映射到 viseme 名称。"""
        for low, high, viseme in self.AMPLITUDE_LEVELS:
            if low <= amplitude < high:
                return viseme
        return "sil"
