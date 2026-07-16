/**
 * LipSync — 嘴型同步数据层
 *
 * 提供了 viseme 映射表和合成生成器。
 * - 当 Fay 系统 WebSocket 可用时，接入 real-time viseme 流
 * - 无 WebSocket 时，基于文本长度/振幅合成模拟 viseme 数据
 *
 * Python 端 LipSyncGenerator 输出的 viseme 列表格式：
 *   [{"Lip": "sil", "Time": 50}, {"Lip": "aa", "Time": 100}, ...]
 */

// ── OVR LipSync viseme → 嘴型开合度映射 ──────────────────────────
// 与 Python 端 test_olipsync.py 中的 AMPLITUDE_LEVELS 一致
export const VISEME_MAP: Record<string, number> = {
  sil: 0.0, // 闭嘴
  PP: 0.2,  // 极小开
  TH: 0.4,  // 小开
  DD: 0.5,  // 中小开
  E: 0.6,   // 中开
  oh: 0.7,  // 中大开
  ou: 0.8,  // 大开
  aa: 0.9,  // 最大开
}

export const VISEME_NAMES = Object.keys(VISEME_MAP)

export interface VisemeFrame {
  Lip: string
  Time: number // 毫秒
}

export interface LipSyncState {
  mouthOpenY: number   // 0.0 ~ 1.0
  viseme: string
}

// ── 合成 viseme 生成器 ──────────────────────────────────────────
// 当无 WebSocket 连接时，用此生成器模拟嘴型
// 基于固定模式循环，模拟说话节奏

const SPEAKING_PATTERN: string[] = [
  'sil', 'aa', 'oh', 'E', 'DD', 'E',
  'oh', 'aa', 'TH', 'E', 'DD', 'sil',
  'PP', 'aa', 'E', 'ou', 'TH', 'sil',
  'E', 'oh', 'DD', 'aa', 'E', 'sil',
]

/**
 * 创建一个合成 viseme 迭代器，每帧返回当前嘴型数据
 * 模拟真实说话时的嘴型变化节奏
 */
export function createSynthLipSync() {
  let frameIndex = 0
  const totalFrames = SPEAKING_PATTERN.length
  const FRAME_MS = 60 // 每帧 60ms ≈ 16.7 FPS

  function next(): LipSyncState {
    const viseme = SPEAKING_PATTERN[frameIndex % totalFrames]
    const mouthOpenY = VISEME_MAP[viseme] ?? 0
    frameIndex++
    return { mouthOpenY, viseme }
  }

  function reset() {
    frameIndex = 0
  }

  function getFrameMs() {
    return FRAME_MS
  }

  return { next, reset, getFrameMs }
}

/**
 * 根据文本生成一串 viseme 帧（用于 TTS 播放时预估嘴型）
 * 文本越长 → 播放时间越久 → viseme 帧数越多
 */
export function generateVisemesFromText(text: string): VisemeFrame[] {
  if (!text) return [{ Lip: 'sil', Time: 500 }]

  // 估算说话时长：按正常语速 ~4 字/秒
  const estimatedDuration = Math.max(500, text.length * 250) // ms
  const frameCount = Math.ceil(estimatedDuration / 60)
  const frames: VisemeFrame[] = []

  for (let i = 0; i < frameCount; i++) {
    const viseme = SPEAKING_PATTERN[i % SPEAKING_PATTERN.length]
    // 每个音节持续 60-120ms
    const duration = i % 2 === 0 ? 60 : 80
    frames.push({ Lip: viseme, Time: duration })
  }

  // 最后收尾闭嘴
  if (frames.length > 0) {
    frames[frames.length - 1] = { Lip: 'sil', Time: 200 }
  }

  return frames
}

/**
 * 从 viseme 帧序列创建可迭代的嘴型播放器
 * 按时间轴逐帧推进
 */
export function createVisemePlayer(frames: VisemeFrame[]) {
  let index = 0
  let elapsed = 0
  let currentFrame: VisemeFrame = frames[0] ?? { Lip: 'sil', Time: 100 }

  function tick(deltaMs: number): LipSyncState {
    if (index >= frames.length) {
      return { mouthOpenY: 0, viseme: 'sil' }
    }

    elapsed += deltaMs
    currentFrame = frames[index]

    // 如果当前帧时间耗尽，前进到下一帧
    if (elapsed >= currentFrame.Time && index < frames.length - 1) {
      index++
      elapsed = 0
      currentFrame = frames[index]
    }

    return {
      mouthOpenY: VISEME_MAP[currentFrame.Lip] ?? 0,
      viseme: currentFrame.Lip,
    }
  }

  function reset() {
    index = 0
    elapsed = 0
    currentFrame = frames[0] ?? { Lip: 'sil', Time: 100 }
  }

  function isFinished(): boolean {
    return index >= frames.length
  }

  return { tick, reset, isFinished }
}
