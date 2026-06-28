import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import {
  Mic, MapPin, Clock, ChevronRight, Sparkles, QrCode,
  X, Users, Sunrise, Volume2,
} from 'lucide-react'
import DigitalHuman from './DigitalHuman'
import { SPOTS } from './SpotDetail'
import { ROUTES } from './RouteRecommend'
import { useT, getLang } from '../../i18n'

const TRIVIA_ZH = [
  '灵山大佛通高88米，是世界最高的露天青铜释迦牟尼立像',
  '灵山梵宫造价18亿，被誉为"东方卢浮宫"',
  '九龙灌浴每天4-5场表演，太子佛从莲花中旋转升起',
  '五印坛城四面环水，被称为"小布达拉宫"',
  '祥符禅寺始建于唐贞观年间，玄奘法师弟子开创',
  '灵山胜境是国家5A级景区，世界佛教论坛永久会址',
  '登216级登云道抱佛脚，俯瞰太湖全景',
]

const TRIVIA_EN = [
  'The Grand Buddha stands 88m tall — the world\'s tallest outdoor bronze standing Buddha',
  'The Fan Palace cost ¥1.8B and is known as the "Louvre of the East"',
  'Nine Dragons Bathing performs 4-5 shows daily — the Prince Buddha rises from a lotus',
  'Five Mudra Mandala is surrounded by water, nicknamed "Little Potala Palace"',
  'Xiangfu Temple dates to Tang Dynasty (627 AD), founded by Xuanzang\'s disciple',
  'Lingshan is a national 5A scenic area and permanent World Buddhist Forum site',
  'Climb 216 steps to touch the Buddha\'s foot and overlook Taihu Lake',
]

const IDLE_TIMEOUT = 60_000
const TRIVIA_INTERVAL = 30_000

export default function KioskPage() {
  const [mode, setMode] = useState<'idle' | 'active'>('idle')
  const [activeTab, setActiveTab] = useState<'spots' | 'routes' | 'about'>('spots')
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [responseText, setResponseText] = useState<string | null>(null)
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [qrOpen, setQrOpen] = useState(false)
  const [timeStr, setTimeStr] = useState('')
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triviaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t = useT()
  const trivia = getLang() === 'en' ? TRIVIA_EN : TRIVIA_ZH

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (mode === 'active') {
      idleTimerRef.current = setTimeout(() => {
        setMode('idle')
        setSelectedSpot(null)
        setResponseText(null)
        setIsListening(false)
        setIsSpeaking(false)
      }, IDLE_TIMEOUT)
    }
  }, [mode])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
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
    if (mode === 'idle') {
      triviaTimerRef.current = setInterval(() => {
        setTriviaIndex((prev) => (prev + 1) % trivia.length)
      }, TRIVIA_INTERVAL)
      return () => {
        if (triviaTimerRef.current) clearInterval(triviaTimerRef.current)
      }
    } else {
      if (triviaTimerRef.current) clearInterval(triviaTimerRef.current)
    }
  }, [mode, trivia.length])

  useEffect(() => {
    return () => {
      if (listenTimerRef.current) clearTimeout(listenTimerRef.current)
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current)
    }
  }, [])

  const handleWake = () => {
    if (mode === 'idle') {
      setMode('active')
      setTriviaIndex(0)
    }
  }

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
        setResponseText('灵山胜境位于无锡太湖之滨，是国家5A级旅游景区。核心景点包括灵山大佛、灵山梵宫、九龙灌浴、五印坛城和祥符禅寺。建议游览时间4-6小时，南门入园，沿中轴线依次游览。')

        speakTimerRef.current = setTimeout(() => {
          setIsSpeaking(false)
          resetIdleTimer()
        }, 8000)
      }, 2000)
    }
    resetIdleTimer()
  }

  const spot = selectedSpot ? SPOTS[selectedSpot] : null

  return (
    <div className="kiosk-root" onClick={handleWake}>
      {/* Ambient background */}
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
            <motion.p
              className="kiosk-idle-trivia"
              key={triviaIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              {trivia[triviaIndex]}
            </motion.p>
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
              {/* Tabs */}
              <div className="kiosk-tabs">
                {[
                  { key: 'spots', i18nKey: 'kiosk.tabSpots' as const, icon: MapPin },
                  { key: 'routes', i18nKey: 'kiosk.tabRoutes' as const, icon: Clock },
                  { key: 'about', i18nKey: 'kiosk.tabAbout' as const, icon: Users },
                ].map(({ key, i18nKey, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`kiosk-tab ${activeTab === key ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setActiveTab(key as typeof activeTab); setSelectedSpot(null); resetIdleTimer() }}
                  >
                    <Icon size={18} />
                    <span>{t(i18nKey)}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="kiosk-content">
                {/* Spots */}
                {activeTab === 'spots' && !selectedSpot && (
                  <div className="kiosk-spots-grid">
                    {Object.values(SPOTS).map((s) => (
                      <motion.button
                        key={s.id}
                        type="button"
                        className="kiosk-spot-card"
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedSpot(s.id); resetIdleTimer() }}
                      >
                        <div className="kiosk-spot-card-bg" style={{ background: s.heroGradient }} />
                        <div className="kiosk-spot-card-content">
                          <strong>{s.name}</strong>
                          <span>{s.category}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {activeTab === 'spots' && selectedSpot && spot && (
                  <div className="kiosk-spot-detail">
                    <button
                      type="button"
                      className="kiosk-back-btn"
                      onClick={(e) => { e.stopPropagation(); setSelectedSpot(null); resetIdleTimer() }}
                    >
                      <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                      <span>{t('kiosk.backToList')}</span>
                    </button>
                    <div className="kiosk-spot-hero" style={{ background: spot.heroGradient }}>
                      <h2>{spot.name}</h2>
                      <span>{spot.category}</span>
                    </div>
                    <div className="kiosk-spot-body">
                      <p>{spot.shortIntro}</p>
                      <div className="kiosk-spot-meta">
                        <span>{t('kiosk.audioDuration', { dur: spot.audioDuration })}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Routes */}
                {activeTab === 'routes' && (
                  <div className="kiosk-routes-list">
                    {ROUTES.map((r) => (
                      <motion.div
                        key={r.id}
                        className="kiosk-route-card"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => resetIdleTimer()}
                      >
                        <div className="kiosk-route-card-head">
                          <strong>{r.title}</strong>
                          <span style={{ color: r.difficultyColor }}>{r.difficulty}</span>
                        </div>
                        <p>{r.description}</p>
                        <div className="kiosk-route-card-meta">
                          <span><Clock size={13} /> {r.duration}</span>
                          <span><MapPin size={13} /> {r.distance}</span>
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
                  value={`${window.location.origin}/#/guide`}
                  size={160}
                  bgColor="transparent"
                  fgColor="#fff"
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
