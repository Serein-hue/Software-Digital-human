import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, ChevronLeft, Play, Pause, BookOpen, Compass } from 'lucide-react'
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

export default function SpotDetail({ spotId, onClose, onNavigate }: Props) {
  const [tier, setTier] = useState<Tier>('shortIntro')
  const [isPlaying, setIsPlaying] = useState(false)
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [spotData, setSpotData] = useState<SpotData | null>(null)
  const [guideData, setGuideData] = useState<SpotGuideItem | null>(null)
  const [relatedSpots, setRelatedSpots] = useState<SpotData[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetchSpot(spotId),
      fetchSpotGuide(spotId),
    ]).then(([spot, guide]) => {
      if (spot) {
        setGuideData(guide ?? null)
        setSpotData(toSpotData(spot, guide))
        setRelatedSpots([])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [spotId])

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // 切换讲解档位时停止音频
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
  }, [tier])

  if (loading) {
    return (
      <motion.div
        className="spot-detail-page"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
      >
        <div className="spot-hero" style={{ background: DEFAULT_GRADIENT }}>
          <button type="button" className="spot-back-btn" onClick={onClose}>
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="spot-content" style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>
          加载中...
        </div>
      </motion.div>
    )
  }

  if (!spotData) {
    return (
      <motion.div
        className="spot-detail-page"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
      >
        <div className="spot-hero" style={{ background: DEFAULT_GRADIENT }}>
          <button type="button" className="spot-back-btn" onClick={onClose}>
            <ChevronLeft size={22} />
          </button>
        </div>
        <div className="spot-content" style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>
          暂无景点数据
        </div>
      </motion.div>
    )
  }

  const content = spotData[tier]

  // ── TTS 语音播报 ──
  const togglePlay = () => {
    if (isPlaying) {
      // 停止
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
    } else {
      // 播放：调用 TTS 接口
      setIsPlaying(true)
      fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content.substring(0, 500), voice: 'zh-CN-XiaoxiaoNeural' }),
        signal: AbortSignal.timeout(15000),
      }).then(res => {
        if (!res.ok) throw new Error('TTS failed')
        return res.json()
      }).then(data => {
        if (data.result === 'successful' && data.audio_base64) {
          const byteString = atob(data.audio_base64)
          const ab = new ArrayBuffer(byteString.length)
          const ia = new Uint8Array(ab)
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
          const blob = new Blob([ab], { type: 'audio/mp3' })
          const url = URL.createObjectURL(blob)
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
          }
          const audio = new Audio(url)
          audioRef.current = audio
          audio.play().catch(() => {})
          // 播放结束时自动停止动画
          audio.onended = () => {
            setIsPlaying(false)
          }
        }
      }).catch(() => {
        setIsPlaying(false)
      })
    }
  }

  return (
    <motion.div
      className="spot-detail-page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      {/* Hero */}
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

      {/* Tier switcher */}
      <div className="spot-tier-bar">
        {TIER_LABELS.map(({ tier: t2, icon: Icon, descKey }) => (
          <button
            key={t2}
            type="button"
            className={`spot-tier-btn ${tier === t2 ? 'active' : ''}`}
            onClick={() => setTier(t2)}
          >
            <Icon size={14} />
            <span>{t(descKey)}</span>
          </button>
        ))}
      </div>

      {/* Content */}
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

      {/* Audio player */}
      <div className="spot-audio-bar">
        <button
          type="button"
          className={`spot-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? t('guide.pause') : t('guide.play')}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="spot-audio-info">
          <span className="spot-audio-label">{isPlaying ? t('spot.playing') : t('spot.aiNarration')}</span>
          <span className="spot-audio-dur">{spotData.audioDuration}</span>
        </div>
        {isPlaying && (
          <div className="spot-audio-bars">
            {AUDIO_BARS.map((bar) => (
              <motion.span
                key={bar.key}
                className="spot-audio-bar-inner"
                animate={{ height: [6, bar.height, 6] }}
                transition={{ repeat: Infinity, duration: bar.duration, delay: bar.key * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Related spots */}
      {relatedSpots.length > 0 && (
        <div className="spot-related">
          <div className="spot-related-head">
            <Compass size={15} />
            <span>{t('spot.nearbySpots')}</span>
          </div>
          <div className="spot-related-list">
            {relatedSpots.map((s) => (
              <motion.button
                key={s.id}
                type="button"
                className="spot-related-chip"
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate(s.id)}
              >
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
