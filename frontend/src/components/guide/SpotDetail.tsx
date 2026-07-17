import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Play, Pause, BookOpen, Compass, Clock, MapPin, Loader } from 'lucide-react'
import { useT } from '../../i18n'
import { fetchSpot, fetchSpotGuide, type SpotItem, type SpotGuideItem } from '../../api'

export interface SpotData {
  id: string
  name: string
  category: string
  heroGradient: string
  oneLiner: string
  shortIntro: string
  fullIntro: string
  source: string
  audioDuration: string
  related: string[]
}

const DEFAULT_GRADIENT = 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)'

type Tier = 'oneLiner' | 'shortIntro' | 'fullIntro'

const TIER_LABELS: { tier: Tier; icon: typeof Clock; descKey: string }[] = [
  { tier: 'oneLiner', icon: Clock, descKey: 'spot.oneLine' },
  { tier: 'shortIntro', icon: Clock, descKey: 'spot.shortVersion' },
  { tier: 'fullIntro', icon: BookOpen, descKey: 'spot.deepGuide' },
]

const ALL_TIERS: Tier[] = ['oneLiner', 'shortIntro', 'fullIntro']

const AUDIO_BARS = Array.from({ length: 7 }, (_, i) => ({
  key: i,
  height: 14 + ((i * 5) % 18),
  duration: 0.5 + (i % 4) * 0.08,
}))

interface Props {
  spotId: string
  onClose: () => void
  onNavigate: (spotId: string) => void
}

function toSpotData(spot: SpotItem, guide?: SpotGuideItem | null): SpotData {
  return {
    id: spot.id,
    name: spot.name,
    category: spot.tags?.[0] ?? '景点',
    heroGradient: DEFAULT_GRADIENT,
    oneLiner: guide?.shortText ?? spot.summary ?? '',
    shortIntro: guide?.briefText ?? spot.summary ?? spot.intro ?? '',
    fullIntro: guide?.longText ?? spot.intro ?? spot.summary ?? '',
    source: guide?.source ?? spot.source ?? '灵山胜境',
    audioDuration: '3:00',
    related: [],
  }
}

/** base64 → blob URL */
function b64ToUrl(b64: string): string {
  const byteString = atob(b64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  const blob = new Blob([ab], { type: 'audio/mp3' })
  return URL.createObjectURL(blob)
}

/** 调用 TTS 接口，返回 blob URL */
async function fetchTtsAudio(text: string): Promise<string | null> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.substring(0, 500), voice: 'zh-CN-XiaoxiaoNeural' }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.result === 'successful' && data.audio_base64) {
      return b64ToUrl(data.audio_base64)
    }
    return null
  } catch {
    return null
  }
}

export default function SpotDetail({ spotId, onClose, onNavigate }: Props) {
  const [tier, setTier] = useState<Tier>('shortIntro')
  const [isPlaying, setIsPlaying] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [spotData, setSpotData] = useState<SpotData | null>(null)
  const [relatedSpots, setRelatedSpots] = useState<SpotData[]>([])
  const [loading, setLoading] = useState(true)
  /** 预加载缓存：tier → blob URL（null=失败，undefined=加载中） */
  const ttsCacheRef = useRef<Record<string, string | null | undefined>>({})
  const [, forceUpdate] = useState(0)
  const t = useT()

  // 1. 加载景点数据
  useEffect(() => {
    setLoading(true)
    setTier('shortIntro')
    ttsCacheRef.current = {}
    Promise.all([
      fetchSpot(spotId),
      fetchSpotGuide(spotId),
    ]).then(([spot, guide]) => {
      if (spot) {
        setSpotData(toSpotData(spot, guide))
        setRelatedSpots([])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [spotId])

  // 2. 景点数据就绪 → 预加载3个档位的 TTS
  useEffect(() => {
    if (!spotData) return
    const texts = {
      oneLiner: spotData.oneLiner,
      shortIntro: spotData.shortIntro,
      fullIntro: spotData.fullIntro,
    }
    ALL_TIERS.forEach((t) => {
      if (texts[t] && ttsCacheRef.current[t] === undefined) {
        ttsCacheRef.current[t] = undefined // 标记加载中
        fetchTtsAudio(texts[t]).then((url) => {
          ttsCacheRef.current[t] = url ?? null
          forceUpdate((n) => n + 1) // 触发重渲染
        })
      }
    })
  }, [spotData])

  // 3. 清理
  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      for (const url of Object.values(ttsCacheRef.current)) {
        if (typeof url === 'string') URL.revokeObjectURL(url)
      }
    }
  }, [])

  // 4. 切换档位时停止音频
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
  }, [tier])

  if (loading) {
    return (
      <motion.div className="spot-detail-page" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
        <div className="spot-hero" style={{ background: DEFAULT_GRADIENT }}>
          <button type="button" className="spot-back-btn" onClick={onClose}><ChevronLeft size={22} /></button>
        </div>
        <div className="spot-content" style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>加载中...</div>
      </motion.div>
    )
  }

  if (!spotData) {
    return (
      <motion.div className="spot-detail-page" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
        <div className="spot-hero" style={{ background: DEFAULT_GRADIENT }}>
          <button type="button" className="spot-back-btn" onClick={onClose}><ChevronLeft size={22} /></button>
        </div>
        <div className="spot-content" style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>暂无景点数据</div>
      </motion.div>
    )
  }

  const content = spotData[tier]
  const cachedUrl = ttsCacheRef.current[tier]

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      setTtsLoading(false)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
      return
    }

    // 缓存命中 → 秒播
    if (cachedUrl && typeof cachedUrl === 'string') {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      const audio = new Audio(cachedUrl)
      audioRef.current = audio
      setIsPlaying(true)
      audio.play().catch(() => setIsPlaying(false))
      audio.onended = () => setIsPlaying(false)
      return
    }

    // 缓存未就绪 → 显示加载并现场请求
    setTtsLoading(true)
    fetchTtsAudio(content).then((url) => {
      setTtsLoading(false)
      if (!url) return
      ttsCacheRef.current[tier] = url
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      const audio = new Audio(url)
      audioRef.current = audio
      setIsPlaying(true)
      audio.play().catch(() => setIsPlaying(false))
      audio.onended = () => setIsPlaying(false)
    })
  }

  return (
    <motion.div
      className="spot-detail-page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <div className="spot-hero" style={{ background: spotData.heroGradient }}>
        <button type="button" className="spot-back-btn" onClick={onClose} aria-label={t('guide.back')}>
          <ChevronLeft size={22} />
        </button>
        <div className="spot-hero-overlay">
          <span className="spot-category-tag">{spotData.category}</span>
          <h1 className="spot-hero-name">{spotData.name}</h1>
        </div>
        <div className="spot-hero-wave">
          <svg viewBox="0 0 480 40" preserveAspectRatio="none">
            <path d="M0 20 Q120 0 240 20 Q360 40 480 20 L480 40 L0 40 Z" fill="#fff" />
          </svg>
        </div>
      </div>

      <div className="spot-tier-bar">
        {TIER_LABELS.map(({ tier: t2, icon: Icon, descKey }) => (
          <button key={t2} type="button" className={`spot-tier-btn ${tier === t2 ? 'active' : ''}`} onClick={() => setTier(t2)}>
            <Icon size={14} />
            <span>{t(descKey)}</span>
          </button>
        ))}
      </div>

      <div className="spot-content">
        <div className="spot-text">
          {content.split('\n').map((paragraph, i) =>
            paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />,
          )}
        </div>
        <div className="spot-source">
          <BookOpen size={13} />
          <span>{spotData.source}</span>
        </div>
      </div>

      <div className="spot-audio-bar">
        <button
          type="button"
          className={`spot-play-btn ${isPlaying ? 'playing' : ''} ${ttsLoading ? 'loading' : ''}`}
          onClick={togglePlay}
          disabled={ttsLoading}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {ttsLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
              <Loader size={18} />
            </motion.div>
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>
        <div className="spot-audio-info">
          <span className="spot-audio-label">
            {ttsLoading ? '加载中...' : isPlaying ? t('spot.playing') : t('spot.aiNarration')}
          </span>
          <span className="spot-audio-dur">{spotData.audioDuration}</span>
        </div>
        {ttsLoading && (
          <div className="spot-audio-bars loading">
            {AUDIO_BARS.map((bar) => (
              <motion.span key={bar.key} className="spot-audio-bar-inner"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: bar.key * 0.08 }} />
            ))}
          </div>
        )}
        {isPlaying && (
          <div className="spot-audio-bars">
            {AUDIO_BARS.map((bar) => (
              <motion.span key={bar.key} className="spot-audio-bar-inner"
                animate={{ height: [6, bar.height, 6] }}
                transition={{ repeat: Infinity, duration: bar.duration, delay: bar.key * 0.1 }} />
            ))}
          </div>
        )}
      </div>

      {relatedSpots.length > 0 && (
        <div className="spot-related">
          <div className="spot-related-head">
            <Compass size={15} />
            <span>{t('spot.nearbySpots')}</span>
          </div>
          <div className="spot-related-list">
            {relatedSpots.map((s) => (
              <motion.button key={s.id} type="button" className="spot-related-chip"
                whileTap={{ scale: 0.96 }} onClick={() => onNavigate(s.id)}>
                <MapPin size={13} />
                <div className="spot-related-text">
                  <strong>{s.name}</strong>
                  <span>{s.oneLiner.length > 28 ? s.oneLiner.slice(0, 28) + '...' : s.oneLiner}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
