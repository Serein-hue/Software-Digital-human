# LipSync 嘴型同步修复文档

## 问题现象

Fay 能正常对话（LLM + TTS + 音频推送均正常），Live2D Haru 模型能显示能待机动，但说话时嘴巴不动。

## 数据流分析

```
Fay TTS → audio.mp3 → LipSyncGenerator → WebSocket(Lips) → Live2D Lipsync.ts → ParamMouthOpenY
                                                                    ↓
                                                             (嘴巴张开程度 0~1)
```

整个链路中，Fay 核心代码 `core/fay_core.py` 第 2277-2295 行会调用 `LipSyncGenerator` 生成 viseme 数据，通过 WebSocket 发给 Live2D 前端。

**根因**：`test/ovr_lipsync/test_olipsync.py` 中的 `LipSyncGenerator.generate_visemes()` 返回空列表，导致 Live2D 收不到 `Lips` 数据，嘴巴不动。

## 解决方案：音频振幅驱动

### 原理

不使用任何外部 API，纯算法实现。将音频分帧，每帧计算 RMS（Root Mean Square）振幅，归一化后映射到 OVR LipSync viseme 名称。

帧长：**50ms**（20 FPS），兼顾流畅度和性能。

### 振幅 → Viseme 映射表

| RMS 范围 | Viseme | 嘴型开合度 | 说明 |
|---------|--------|-----------|------|
| 0.00~0.04 | sil | 0.0 | 静音/闭嘴 |
| 0.04~0.10 | PP | 0.2 | 极小（双唇闭合） |
| 0.10~0.18 | TH | 0.4 | 小（舌尖齿间） |
| 0.18~0.28 | DD | 0.5 | 中小（舌尖上齿） |
| 0.28~0.40 | E | 0.6 | 中（前元音） |
| 0.40~0.55 | oh | 0.7 | 中大（圆唇后元音） |
| 0.55~0.72 | ou | 0.8 | 大（圆唇突出） |
| 0.72~1.00 | aa | 0.9 | 最大（张嘴低元音） |

### 实现代码位置

**Python 端**：`test/ovr_lipsync/test_olipsync.py`

核心逻辑：
1. 用 pydub 加载音频（支持 WAV / MP3）
2. 转单声道，按 50ms 分帧
3. 第一遍扫描找 RMS 峰值（用于归一化）
4. 第二遍每帧算 RMS → 归一化 → 查表得 viseme
5. `consolidate_visemes()` 合并相邻相同 viseme，减少数据量

**前端端**：`live2d-avatar/.../Demo/src/lipsync.ts`

- `visemeMap` 定义了 viseme → 嘴型开合度映射
- 每帧渲染时按时间轴找当前 viseme，平滑过渡到目标值
- 支持 `elapsedTimeProvider` 回调（不依赖 audio.play() 的时间）

### 依赖

- `pydub`（Python 音频处理库）
- `ffmpeg`（pydub 解码 MP3 必需）

ffmpeg 通过 winget 安装，确保 ffmpeg 在 PATH 环境变量中即可。

### 测试工具

```
skills/test_lipsync.py
```

不启动 Fay 即可离线测试嘴型数据生成，输出 ASCII 时序图和 JSON：

```bash
cd <项目目录>
PYTHONIOENCODING=utf-8 python skills/test_lipsync.py samples/sample-*.wav
```

### 验证结果

5 秒音频 → 101 帧 → 合并 62 帧，8 种 viseme 全覆盖，嘴型随音量自然开合。

## 后续优化方向

- 如果效果不够精细，可接入 [Wav2Lip](https://github.com/Rudrabha/Wav2Lip) 或 [西交大/抖音方案](https://github.com/bytedance/X-Pose) 等深度学习方案
- 调整 `FRAME_MS` 可改变 FPS（小数值更精细，大数值更省性能）
- `consolidate_visemes` 的 `min_duration` 可调合并敏感度
