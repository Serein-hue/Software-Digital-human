import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Volume2 } from 'lucide-react'
import { useT } from '../../i18n'
import { createSynthLipSync, createVisemePlayer, generateVisemesFromText } from '../../api/lipsync'

interface Props {
  isSpeaking: boolean
  spotName?: string
  mode?: 'cartoon' | 'realistic'
  spokenText?: string
}

// ── 真实模式 SVG 头像 ──────────────────────────────────────────────
function RealisticAvatar({ mouthOpenY, isSpeaking }: { mouthOpenY: number; isSpeaking: boolean }) {
  // 嘴型路径：从闭合到张开
  const getMouthPath = () => {
    if (mouthOpenY < 0.05) {
      return 'M92,114 Q100,117 108,114' // 闭唇
    }
    const openY = 114 + mouthOpenY * 6 // 最多张开到 120
    return `M92,114 Q96,${openY} 100,${openY} Q104,${openY} 108,114`
  }

  return (
    <svg viewBox="0 0 200 240" fill="none" className="dh-avatar-svg">
      <defs>
        <linearGradient id="bg-svg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#155d58" stopOpacity="0.08"/>
          <stop offset="100%" stopColor="#155d58" stopOpacity="0.02"/>
        </linearGradient>
        <linearGradient id="skin-svg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fce9d5"/>
          <stop offset="100%" stopColor="#f5d8ba"/>
        </linearGradient>
        <linearGradient id="hair-svg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a"/>
          <stop offset="100%" stopColor="#2d2d2d"/>
        </linearGradient>
        <linearGradient id="dress-svg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#155d58"/>
          <stop offset="100%" stopColor="#0e403d"/>
        </linearGradient>
        <radialGradient id="cheek-svg" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#e8a090" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#e8a090" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* 背景圆 */}
      <circle cx="100" cy="100" r="95" fill="url(#bg-svg)"/>

      {/* 身体/衣领 */}
      <g transform="translate(100,175)">
        <path d="M-38,-15 Q-42,10 -38,30 L-30,35 L-20,20 Q-10,10 0,15 Q10,10 20,20 L30,35 L38,30 Q42,10 38,-15 Z" fill="url(#dress-svg)"/>
        <path d="M-12,0 Q0,-10 12,0" stroke="#c1a15a" strokeWidth="1.5" fill="none" opacity="0.6"/>
        <path d="M-8,5 Q0,-4 8,5" stroke="#c1a15a" strokeWidth="1" fill="none" opacity="0.4"/>
      </g>

      {/* 脖颈 */}
      <rect x="86" y="155" width="28" height="25" rx="6" fill="#f5d8ba"/>

      {/* 头发后部 */}
      <ellipse cx="100" cy="90" rx="55" ry="58" fill="url(#hair-svg)" opacity="0.9"/>

      {/* 头发盘发 + 发簪 */}
      <ellipse cx="100" cy="40" rx="20" ry="12" fill="url(#hair-svg)"/>
      <ellipse cx="108" cy="38" rx="8" ry="10" fill="#1a1a1a" opacity="0.8"/>
      <line x1="108" y1="35" x2="130" y2="28" stroke="#c1a15a" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="130" cy="28" r="3" fill="#c1a15a"/>
      <circle cx="125" cy="26" r="2" fill="#e8c040"/>

      {/* 脸 */}
      <ellipse cx="100" cy="100" rx="42" ry="48" fill="url(#skin-svg)"/>

      {/* 刘海 */}
      <path d="M58,82 Q65,62 80,60 Q85,55 92,58 Q95,52 100,55 Q105,52 108,58 Q115,55 120,60 Q135,62 142,82 Q130,70 100,72 Q70,70 58,82 Z" fill="url(#hair-svg)"/>

      {/* 眉毛 */}
      <g stroke="#4a3520" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M72,90 Q78,86 85,88"/>
        <path d="M115,88 Q122,86 128,90"/>
      </g>

      {/* 眼睛 — 说话时会微闭 */}
      <g>
        <ellipse cx="80" cy="97" rx="10" ry={isSpeaking ? 5.5 : 7} fill="white"/>
        <ellipse cx="82" cy="97" rx="5" ry={isSpeaking ? 4 : 5.5} fill="#2c2416"/>
        <circle cx="84" cy="95" r="2" fill="white" opacity="0.8"/>
        <ellipse cx="80" cy="97" rx="10" ry={isSpeaking ? 5.5 : 7} stroke="#4a3520" strokeWidth="1" fill="none"/>

        <ellipse cx="120" cy="97" rx="10" ry={isSpeaking ? 5.5 : 7} fill="white"/>
        <ellipse cx="118" cy="97" rx="5" ry={isSpeaking ? 4 : 5.5} fill="#2c2416"/>
        <circle cx="120" cy="95" r="2" fill="white" opacity="0.8"/>
        <ellipse cx="120" cy="97" rx="10" ry={isSpeaking ? 5.5 : 7} stroke="#4a3520" strokeWidth="1" fill="none"/>
      </g>

      {/* 睫毛 */}
      <g stroke="#4a3520" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6">
        <path d="M72,94 L69,92"/>
        <path d="M73,92 L71,89"/>
        <path d="M127,94 L130,92"/>
        <path d="M127,92 L129,89"/>
      </g>

      {/* 腮红 */}
      <circle cx="68" cy="110" r="10" fill="url(#cheek-svg)"/>
      <circle cx="132" cy="110" r="10" fill="url(#cheek-svg)"/>

      {/* 鼻子 */}
      <path d="M99,102 Q100,108 102,108 Q104,108 101,104" stroke="#d4b89a" strokeWidth="1.2" fill="none"/>

      {/* 嘴巴 — 由 LipSync 驱动 */}
      <path d={getMouthPath()} stroke="#c47a5a" strokeWidth="2.5" strokeLinecap="round" fill={mouthOpenY > 0.1 ? '#c47a5a' : 'none'} fillOpacity={mouthOpenY > 0.3 ? 0.3 : 0}/>

      {/* 下巴阴影 */}
      <path d="M70,120 Q100,148 130,120" stroke="#d4b89a" strokeWidth="0.8" fill="none" opacity="0.3"/>
    </svg>
  )
}

// ── 卡通模式嘴型 — 由 LipSync 驱动 ──────────────────────────────
function CartoonMouth({ mouthOpenY }: { mouthOpenY: number }) {
  // scaleY: 0.0~1.0, 映射 mouthOpenY 0.0~1.0
  const scaleY = Math.max(0.3, mouthOpenY * 0.9 + 0.3)
  return (
    <motion.div
      className="dh-mouth"
      animate={{ scaleY }}
      transition={{ duration: 0.08, ease: 'easeOut' }}
    />
  )
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function DigitalHuman({ isSpeaking, spotName, mode = 'cartoon', spokenText }: Props) {
  const t = useT()
  const [mouthOpenY, setMouthOpenY] = useState(0)
  const synthRef = useRef<ReturnType<typeof createSynthLipSync> | null>(null)
  const playerRef = useRef<ReturnType<typeof createVisemePlayer> | null>(null)
  const rafRef = useRef<number>(0)
  const lastTickRef = useRef<number>(0)

  // 嘴型同步：初始化播放器 + 动画循环
  // 当 isSpeaking 或 spokenText 变化时重新初始化
  useEffect(() => {
    // 停止说话 → 闭嘴
    if (!isSpeaking) {
      setMouthOpenY(0)
      playerRef.current = null
      synthRef.current = null
      return
    }

    // 开始说话 → 初始化播放器
    if (spokenText) {
      const frames = generateVisemesFromText(spokenText)
      playerRef.current = createVisemePlayer(frames)
      synthRef.current = null
    } else {
      synthRef.current = createSynthLipSync()
      playerRef.current = null
    }

    lastTickRef.current = 0

    // 动画循环
    function tick(now: number) {
      if (lastTickRef.current === 0) {
        lastTickRef.current = now
      }
      const delta = now - lastTickRef.current
      lastTickRef.current = now

      if (playerRef.current) {
        const state = playerRef.current.tick(delta)
        setMouthOpenY(state.mouthOpenY)
        if (playerRef.current.isFinished()) {
          setMouthOpenY(0)
          return // 播放完毕，停止动画
        }
      } else if (synthRef.current) {
        const state = synthRef.current.next()
        setMouthOpenY(state.mouthOpenY)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isSpeaking, spokenText])

  return (
    <div className="dh-stage">
      <div className="dh-scene">
        <motion.div
          className={`dh-avatar ${mode === 'realistic' ? 'dh-avatar-real' : ''}`}
          animate={
            isSpeaking
              ? { scale: [1, 1.015, 1, 1.01, 1], y: [0, -3, 0, -2, 0] }
              : { scale: 1, y: 0 }
          }
          transition={
            isSpeaking
              ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          {mode === 'realistic' ? (
            <RealisticAvatar mouthOpenY={mouthOpenY} isSpeaking={isSpeaking} />
          ) : (
            <>
              <div className="dh-face">
                <div className="dh-eyes">
                  <span className="dh-eye left" />
                  <span className="dh-eye right" />
                </div>
                <CartoonMouth mouthOpenY={mouthOpenY} />
                <div className="dh-blush left" />
                <div className="dh-blush right" />
              </div>
              <div className="dh-body">
                <div className="dh-collar" />
              </div>
            </>
          )}
        </motion.div>

        {isSpeaking && (
          <motion.div
            className="dh-speech-ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.4, 0.15, 0.4], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </div>

      <div className="dh-info">
        {isSpeaking ? (
          <motion.span
            className="dh-speaking-badge"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Volume2 size={14} />
            <span>{t('guide.speaking')}</span>
            <Sparkles size={12} />
          </motion.span>
        ) : (
          <span className="dh-idle-badge">
            {mode === 'realistic' ? t('guide.brandName') + ' · AI' : t('guide.brandName')}
          </span>
        )}
        {spotName && <span className="dh-spot-tag">{spotName}</span>}
      </div>
    </div>
  )
}
