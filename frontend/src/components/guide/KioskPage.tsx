import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Mic, MapPin, Clock, ChevronRight, Sparkles, QrCode,
  X, Users, Sunrise, Volume2, BookOpen, Play, Pause, Loader,
} from 'lucide-react'
import DigitalHuman from './DigitalHuman'
import { useT, getLang } from '../../i18n'
import { fetchSpots, fetchSpotGuide, fetchRoutes, type SpotItem, type RouteItem, type SpotGuideItem } from '../../api'

const IDLE_TIMEOUT = 60_000

type Tier = 'oneLiner' | 'shortIntro' | 'fullIntro'

const TIER_LABELS: { tier: Tier; label: string }[] = [
  { tier: 'oneLiner', label: '一句话' },
  { tier: 'shortIntro', label: '简短版' },
  { tier: 'fullIntro', label: '深度讲解' },
]

function b64ToUrl(b64: string): string {
  const byteString = atob(b64)
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
  return URL.createObjectURL(new Blob([ab], { type: 'audio/mp3' }))
}

export default function KioskPage() {
  const [mode, setMode] = useState<'idle' | 'active'>('idle')
  const [activeTab, setActiveTab] = useState<'spots' | 'routes' | 'about'>('spots')
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [spotGuide, setSpotGuide] = useState<SpotGuideItem | null>(null)
  const [guideTier, setGuideTier] = useState<Tier>('shortIntro')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [responseText, setResponseText] = useState<string | null>(null)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [timeStr, setTimeStr] = useState('')
  const [spots, setSpots] = useState<SpotItem[]>([])
  const [routes, setRoutes] = useState<RouteItem[]>([])
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const t = useT()
  const lang = getLang()

  useEffect(() => {
    fetchSpots().then((data) => { if (data) setSpots(data) })
    fetchRoutes().then((data) => { if (data) setRoutes(data) })
  }, [])

  // 选中景点时获取三级讲解
  useEffect(() => {
    if (!selectedSpot) { setSpotGuide(null); return }
    setGuideTier('shortIntro')
    fetchSpotGuide(selectedSpot).then((g) => setSpotGuide(g ?? null))
  }, [selectedSpot])

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (mode === 'active') {
      idleTimerRef.current = setTimeout(() => {
        setMode('idle')
        setSelectedSpot(null)
        setResponseText(null)
        setSpotGuide(null)
        setIsListening(false)
        setIsSpeaking(false)
      }, IDLE_TIMEOUT)
    }
  }, [mode])

  useEffect(() => {
    resetIdleTimer()
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current) }
  }, [mode, resetIdleTimer])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    updateTime()
    const t = setInterval(updateTime, 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    return () => {
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current)
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    }
  }, [])

  const handleWake = () => { if (mode === 'idle') setMode('active') }

  const handleVoice = () => {
    if (isListening) {
      setIsListening(false)
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current)
    } else {
      setIsListening(true)
      setResponseText(null)
      listenTimerRef.current = setTimeout(() => {
        setIsListening(false)
        setIsSpeaking(true)
        setResponseText(lang === 'en'
          ? 'Lingshan is a national 5A scenic area by Taihu Lake. Main spots include the Grand Buddha, Fan Palace, Nine Dragons Bathing, Five Mudra Mandala, and Xiangfu Temple. Suggested visit: 4-6 hours.'
          : '灵山胜境位于无锡太湖之滨，是国家5A级旅游景区。核心景点包括灵山大佛、灵山梵宫、九龙灌浴、五印坛城和祥符禅寺。建议游览时间4-6小时，南门入园，沿中轴线依次游览。')
        speakTimerRef.current = setTimeout(() => { setIsSpeaking(false); resetIdleTimer() }, 8000)
      }, 2000)
    }
    resetIdleTimer()
  }

  const playTts = async (text: string) => {
    if (ttsPlaying) {
      setTtsPlaying(false)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
      return
    }
    setTtsLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 500), voice: 'zh-CN-XiaoxiaoNeural' }),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) throw new Error('TTS failed')
      const data = await res.json()
      if (data.result === 'successful' && data.audio_base64) {
        const url = b64ToUrl(data.audio_base64)
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
        const audio = new Audio(url)
        audioRef.current = audio
        setTtsLoading(false)
        setTtsPlaying(true)
        audio.play().catch(() => { setTtsPlaying(false) })
        audio.onended = () => { setTtsPlaying(false) }
      } else {
        setTtsLoading(false)
      }
    } catch {
      setTtsLoading(false)
    }
  }

  // 当前讲解内容
  const getGuideContent = (): string => {
    if (!spot || !spotGuide) return spot?.summary ?? spot?.intro ?? ''
    if (guideTier === 'oneLiner') return spotGuide.shortText || spot.summary || ''
    if (guideTier === 'shortIntro') return spotGuide.briefText || spot.summary || spot.intro || ''
    return spotGuide.longText || spot.intro || spot.summary || ''
  }

  const spot = selectedSpot ? spots.find((s) => s.id === selectedSpot) : null
  const guideContent = getGuideContent()
  const guideSource = spotGuide?.source || spot?.source || '灵山胜境'

  return (
    <div className="kiosk-root" onClick={handleWake}>
      <div className="kiosk-bg">
        <div className="kiosk-bg-pulse" />
        <div className="kiosk-bg-grid" />
      </div>

      {/* Top bar */}
      <div className="kiosk-topbar">
        <div className="kiosk-topbar-left">
          <Sparkles size={20} />
          <span>{t('kiosk.title')}</span>
        </div>
        <div className="kiosk-topbar-right">
          <span className="kiosk-time">{timeStr}</span>
          <span className="kiosk-weather">☀ 28°</span>
        </div>
      </div>

      {/* IDLE MODE */}
      <AnimatePresence>
        {mode === 'idle' && (
          <motion.div
            className="kiosk-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="idle"
          >
            <div className="kiosk-idle-dh">
              <DigitalHuman isSpeaking={false} />
            </div>
            <motion.h1
              className="kiosk-idle-title"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              {t('kiosk.tapToStart')}
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE MODE */}
      <AnimatePresence>
        {mode === 'active' && (
          <motion.div
            className="kiosk-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="active"
          >
            {/* Left: Digital Human */}
            <div className="kiosk-left">
              <div className="kiosk-dh-wrap">
                <DigitalHuman isSpeaking={isSpeaking} spotName="灵山胜境" />
              </div>
              {responseText && (
                <motion.div
                  className="kiosk-response"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Volume2 size={14} />
                  <p>{responseText}</p>
                </motion.div>
              )}
            </div>

            {/* Right: Content */}
            <div className="kiosk-right">
              <div className="kiosk-tabs">
                {[
                  { key: 'spots' as const, i18nKey: 'kiosk.tabSpots' as const, icon: MapPin },
                  { key: 'routes' as const, i18nKey: 'kiosk.tabRoutes' as const, icon: Clock },
                  { key: 'about' as const, i18nKey: 'kiosk.tabAbout' as const, icon: Users },
                ].map(({ key, i18nKey, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`kiosk-tab ${activeTab === key ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveTab(key); setSelectedSpot(null); setSpotGuide(null); resetIdleTimer() }}
                  >
                    <Icon size={18} />
                    <span>{t(i18nKey)}</span>
                  </button>
                ))}
              </div>

              <div className="kiosk-content">
                {/* Spots grid */}
                {activeTab === 'spots' && !selectedSpot && (
                  <div className="kiosk-spots-grid">
                    {spots.map((s) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        className="kiosk-spot-card"
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSpot(s.id); resetIdleTimer() }}
                      >
                        <div className="kiosk-spot-card-bg" style={{ background: 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)' }} />
                        <div className="kiosk-spot-card-content">
                          <strong>{s.name}</strong>
                          <span>{(s.tags ?? [])[0] ?? ''}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Spot detail with 三级讲解 */}
                {activeTab === 'spots' && selectedSpot && spot && (
                  <div className="kiosk-spot-detail">
                    <button
                      type="button"
                      className="kiosk-back-btn"
                      onClick={(e) => { e.stopPropagation(); setSelectedSpot(null); setSpotGuide(null) }}
                    >
                      <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                      <span>{t('kiosk.backToList')}</span>
                    </button>

                    {/* Hero */}
                    <div className="kiosk-spot-hero" style={{ background: 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)' }}>
                      <h2>{spot.name}</h2>
                      <span>{(spot.tags ?? []).slice(0, 3).join(' · ') || ''}</span>
                    </div>

                    {/* Tier tabs */}
                    <div className="kiosk-guide-tiers">
                      {TIER_LABELS.map(({ tier: t2, label }) => (
                        <button
                          key={t2}
                          type="button"
                          className={`kiosk-guide-tier-btn ${guideTier === t2 ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); setGuideTier(t2) }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="kiosk-spot-body">
                      <p>{guideContent}</p>
                      <div className="kiosk-spot-source">
                        <BookOpen size={12} />
                        <span>{guideSource}</span>
                      </div>
                    </div>

                    {/* TTS button */}
                    <div className="kiosk-tts-bar">
                      <button
                        type="button"
                        className={`kiosk-tts-btn ${ttsPlaying ? 'playing' : ''} ${ttsLoading ? 'loading' : ''}`}
                        onClick={(e) => { e.stopPropagation(); playTts(guideContent) }}
                        disabled={ttsLoading}
                      >
                        {ttsLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>
                            <Loader size={18} />
                          </motion.div>
                        ) : ttsPlaying ? (
                          <Pause size={18} />
                        ) : (
                          <Play size={18} />
                        )}
                        <span>{ttsLoading ? '生成中...' : ttsPlaying ? '暂停' : '语音讲解'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Routes */}
                {activeTab === 'routes' && (
                  <div className="kiosk-routes-list">
                    {routes.map((r) => (
                      <motion.div
                        key={r.id}
                        className="kiosk-route-card"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => resetIdleTimer()}
                      >
                        <div className="kiosk-route-card-head">
                          <strong>{r.name}</strong>
                        </div>
                        <p>{r.persona ?? ''}</p>
                        <div className="kiosk-route-card-meta">
                          <span><Clock size={13} /> {r.duration}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* About */}
                {activeTab === 'about' && (
                  <div className="kiosk-about">
                    <Sunrise size={28} />
                    <h3>{t('kiosk.aboutTitle')}</h3>
                    <p>{t('kiosk.aboutDesc')}</p>
                    <div className="kiosk-about-info">
                      <div><strong>{t('kiosk.openTime')}</strong><span>07:00 - 17:30</span></div>
                      <div><strong>{t('kiosk.suggestedDuration')}</strong><span>{t('kiosk.durationValue')}</span></div>
                      <div><strong>{t('kiosk.ticketRef')}</strong><span>{t('kiosk.ticketValue')}</span></div>
                      <div><strong>{t('kiosk.servicePhone')}</strong><span>0510-8568xxxx</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom mic bar */}
      {mode === 'active' && (
        <motion.div
          className="kiosk-mic-bar"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="kiosk-mic-hint">
            <span>{t('kiosk.micHint')}</span>
            <span className="kiosk-mic-examples">{t('kiosk.micExamples')}</span>
          </div>
          <motion.button
            type="button"
            className={`kiosk-mic-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
            whileTap={{ scale: 0.92 }}
            onClick={(e) => { e.stopPropagation(); handleVoice() }}
          >
            <Mic size={36} />
          </motion.button>
          <div className="kiosk-mic-label">
            {isListening ? t('kiosk.micListening') : isSpeaking ? t('kiosk.micSpeaking') : t('kiosk.micIdle')}
          </div>
        </motion.div>
      )}

      {/* QR code floating button */}
      <motion.button
        type="button"
        className="kiosk-qr-float"
        whileTap={{ scale: 0.94 }}
        onClick={(e) => { e.stopPropagation(); setQrOpen(true); resetIdleTimer() }}
      >
        <QrCode size={22} />
      </motion.button>

      {/* QR overlay */}
      <AnimatePresence>
        {qrOpen && (
          <motion.div
            className="kiosk-qr-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); setQrOpen(false) }}
          >
            <motion.div
              className="kiosk-qr-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="kiosk-qr-close" onClick={() => setQrOpen(false)}>
                <X size={20} />
              </button>
              <div className="kiosk-qr-code">
                <QRCodeSVG
                  value={'https://serein-hue.github.io/Software-Digital-human/app/#/guide'}
                  size={160}
                  bgColor="#fff"
                  fgColor="#1a1a1a"
                />
              </div>
              <h3>{t('kiosk.qrTitle')}</h3>
              <p>{t('kiosk.qrDesc')}</p>
              <div className="kiosk-qr-devices">
                <span>{t('kiosk.qrWechat')}</span>
                <span>·</span>
                <span>{t('kiosk.qrBrowser')}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
