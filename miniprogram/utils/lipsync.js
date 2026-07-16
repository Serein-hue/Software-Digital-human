/**
 * LipSync 嘴型同步引擎 — 小程序版
 * 与 frontend/src/api/lipsync.ts 逻辑一致，纯 JS 无 DOM 依赖
 */

const VISEME_MAP = {
  sil: 0.0, // 闭嘴
  PP: 0.2,  // 极小开
  TH: 0.4,  // 小开
  DD: 0.5,  // 中小开
  E: 0.6,   // 中开
  oh: 0.7,  // 中大开
  ou: 0.8,  // 大开
  aa: 0.9,  // 最大开
}

const SPEAKING_PATTERN = [
  'sil', 'aa', 'oh', 'E', 'DD', 'E',
  'oh', 'aa', 'TH', 'E', 'DD', 'sil',
  'PP', 'aa', 'E', 'ou', 'TH', 'sil',
  'E', 'oh', 'DD', 'aa', 'E', 'sil',
]

/**
 * 根据文本生成 viseme 帧序列
 * @param {string} text
 * @returns {Array<{Lip: string, Time: number}>}
 */
function generateVisemesFromText(text) {
  if (!text) return [{ Lip: 'sil', Time: 500 }]
  // 估算说话时长：~4 字/秒
  const estimatedDuration = Math.max(500, text.length * 250)
  const frameCount = Math.ceil(estimatedDuration / 60)
  const frames = []
  for (let i = 0; i < frameCount; i++) {
    const viseme = SPEAKING_PATTERN[i % SPEAKING_PATTERN.length]
    const duration = i % 2 === 0 ? 60 : 80
    frames.push({ Lip: viseme, Time: duration })
  }
  if (frames.length > 0) {
    frames[frames.length - 1] = { Lip: 'sil', Time: 200 }
  }
  return frames
}

/**
 * 创建 viseme 播放器
 * @param {Array<{Lip: string, Time: number}>} frames
 * @returns {{ tick: Function, reset: Function }}
 */
function createVisemePlayer(frames) {
  let index = 0
  let elapsed = 0
  let finished = false

  function tick(deltaMs) {
    if (finished || index >= frames.length) {
      finished = true
      return { mouthOpenY: 0, viseme: 'sil', done: true }
    }
    const currentFrame = frames[index]
    elapsed += deltaMs
    if (elapsed >= currentFrame.Time && index < frames.length - 1) {
      index++
      elapsed = 0
    }
    const mouthOpenY = VISEME_MAP[frames[index].Lip] ?? 0
    return { mouthOpenY, viseme: frames[index].Lip, done: false }
  }

  function reset() {
    index = 0
    elapsed = 0
    finished = false
  }

  return { tick, reset }
}

/**
 * 创建合成嘴型生成器（无文本时使用）
 * @returns {{ next: Function, reset: Function }}
 */
function createSynthLipSync() {
  let frameIndex = 0
  function next() {
    const viseme = SPEAKING_PATTERN[frameIndex % SPEAKING_PATTERN.length]
    frameIndex++
    return { mouthOpenY: VISEME_MAP[viseme] ?? 0, viseme }
  }
  function reset() { frameIndex = 0 }
  return { next, reset }
}

module.exports = {
  VISEME_MAP,
  SPEAKING_PATTERN,
  generateVisemesFromText,
  createVisemePlayer,
  createSynthLipSync,
}
