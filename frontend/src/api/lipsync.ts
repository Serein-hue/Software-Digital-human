/**
 * LipSync — 嘴型同步数据层
 *
 * 提供了 viseme 映射表和合成生成器。
 * - 音频波形驱动（优先级最高）：AudioContext 解码 TTS mp3 → RMS 振幅 → viseme
 * - 文本估算兜底：基于文本长度粗估语速 → 固定节奏循环
 * - 合成循环保底：纯随机模式
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
 * 从 viseme 帧序列创建嘴型播放器
 *
 * tick(deltaMs)        — 增量方式，适合文本估算或无音频时使用
 * seek(audioTimeMs)    — 绝对时间定位，用 audio.currentTime + 二分查找，
 *                         零累积误差，适合音频波形驱动
 */
export function createVisemePlayer(frames: VisemeFrame[]) {
  let index = 0
  let elapsed = 0
  let currentFrame: VisemeFrame = frames[0] ?? { Lip: 'sil', Time: 100 }

  // 预计算累积时间 → seek 用二分查找
  const cumulativeTime: number[] = []
  let accum = 0
  for (const f of frames) { accum += f.Time; cumulativeTime.push(accum) }
  const totalDuration = cumulativeTime[cumulativeTime.length - 1] ?? 100_000

  function tick(deltaMs: number): LipSyncState {
    if (index >= frames.length) {
      return { mouthOpenY: 0, viseme: 'sil' }
    }

    elapsed += deltaMs
    currentFrame = frames[index]

    // 如果当前帧时间耗尽，前进到下一帧
    // elapsed -= currentFrame.Time 而非 =0，避免溢出时间丢失累积漂移
    if (elapsed >= currentFrame.Time && index < frames.length - 1) {
      elapsed -= currentFrame.Time
      index++
      currentFrame = frames[index]
    }

    return {
      mouthOpenY: VISEME_MAP[currentFrame.Lip] ?? 0,
      viseme: currentFrame.Lip,
    }
  }

  /** 根据音频已播放时间定位帧 — 二分查找，每次独立定位，零累积误差 */
  function seek(audioTimeMs: number): LipSyncState {
    if (frames.length === 0 || audioTimeMs >= totalDuration) {
      return { mouthOpenY: 0, viseme: 'sil' }
    }
    let lo = 0, hi = cumulativeTime.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (audioTimeMs < cumulativeTime[mid]) hi = mid
      else lo = mid + 1
    }
    return {
      mouthOpenY: VISEME_MAP[frames[lo].Lip] ?? 0,
      viseme: frames[lo].Lip,
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

  return { tick, seek, reset, isFinished }
}

// ── 音频波形驱动的 viseme 生成 ──────────────────────────────────────
// 与 Python test_olipsync.py 同原理：RMS 振幅分析
// 用于替代 text-length 估算，使嘴型与 TTS 音频实际节奏一致

const AMPLITUDE_LEVELS = [
  { min: 0.00, max: 0.04, viseme: 'sil' },
  { min: 0.04, max: 0.10, viseme: 'PP' },
  { min: 0.10, max: 0.18, viseme: 'TH' },
  { min: 0.18, max: 0.28, viseme: 'DD' },
  { min: 0.28, max: 0.40, viseme: 'E' },
  { min: 0.40, max: 0.55, viseme: 'oh' },
  { min: 0.55, max: 0.72, viseme: 'ou' },
  { min: 0.72, max: 1.00, viseme: 'aa' },
]

/** 将归一化 RMS 振幅映射到 viseme 名称 */
function amplitudeToViseme(rmsNorm: number): string {
  for (const level of AMPLITUDE_LEVELS) {
    if (rmsNorm >= level.min && rmsNorm < level.max) return level.viseme
  }
  return 'sil'
}

/**
 * 计算一小段 PCM 数据的 RMS 值
 */
function calcRms(data: Float32Array, start: number, end: number): number {
  let sumSq = 0
  const len = end - start
  for (let i = start; i < end; i++) sumSq += data[i] * data[i]
  return Math.sqrt(sumSq / len)
}

/**
 * 从 AudioBuffer 解码生成 viseme 帧序列
 *
 * 原理：分帧（50ms/帧）→ 每帧计算 RMS 振幅 → 归一化 → 映射 viseme
 *       与 Python LipSyncGenerator.generate_visemes() 算法一致
 *
 * @param audioBuffer 已解码的 PCM 音频数据（AudioContext.decodeAudioData 输出）
 * @returns VisemeFrame[] 可直接传入 createVisemePlayer 播放
 */
export function decodeAudioToVisemes(audioBuffer: AudioBuffer): VisemeFrame[] {
  // 取第一个声道（单声道分析）
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const FRAME_MS = 50 // 与 Python FRAME_MS 一致
  const frameSamples = Math.floor((sampleRate * FRAME_MS) / 1000)
  const totalFrames = Math.ceil(channelData.length / frameSamples)
  const durationMs = (channelData.length / sampleRate) * 1000

  if (totalFrames < 2) {
    return [{ Lip: 'sil', Time: Math.max(100, Math.round(durationMs)) }]
  }

  // ── 第一遍：找峰值 RMS ──
  let peakRms = 0
  for (let i = 0; i < totalFrames; i++) {
    const start = i * frameSamples
    const end = Math.min(start + frameSamples, channelData.length)
    const rms = calcRms(channelData, start, end)
    if (rms > peakRms) peakRms = rms
  }

  // 近乎静音 → 只返回一个 sil
  if (peakRms < 0.001) {
    return [{ Lip: 'sil', Time: Math.round(durationMs) }]
  }

  // ── 第二遍：生成 viseme 帧 ──
  const visemes: VisemeFrame[] = []
  for (let i = 0; i < totalFrames; i++) {
    const start = i * frameSamples
    const end = Math.min(start + frameSamples, channelData.length)
    const rms = calcRms(channelData, start, end)
    const rmsNorm = Math.min(rms / peakRms, 1.0)
    const lip = amplitudeToViseme(rmsNorm)
    const timeMs = Math.round(((end - start) / sampleRate) * 1000)
    visemes.push({ Lip: lip, Time: timeMs })
  }

  return visemes
}
