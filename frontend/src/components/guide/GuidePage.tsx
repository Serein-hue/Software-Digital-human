import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  BookOpen,
  CalendarClock,
  Camera,
  Clock3,
  CloudSun,
  Compass,
  Map,
  MapPinned,
  MessageCircle,
  Navigation,
  RefreshCw,
  Share2,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import AmbientMotion from '../AmbientMotion'
import DigitalHuman from './DigitalHuman'
import LbsStatus from './LbsStatus'
import ChatPanel, { type Message } from './ChatPanel'
import VoiceRecord from './VoiceRecord'
import SpotDetail from './SpotDetail'
import RouteRecommend from './RouteRecommend'
import PhotoRecognition from './PhotoRecognition'
import ShareCard from './ShareCard'
import { useT } from '../../i18n'
import { fetchChatAnswer } from '../../api'

gsap.registerPlugin(useGSAP)

const QUICK_ACTIONS = [
  { icon: Map, key: 'routeRecommend', tone: 'green' },
  { icon: Clock3, key: 'tourDuration', tone: 'amber' },
  { icon: Camera, key: 'photoRecognition', tone: 'blue' },
  { icon: BookOpen, key: 'deepGuide', tone: 'rust' },
] as const

export default function GuidePage() {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'guide', text: t('guide.welcome') },
  ])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [spotDetailId, setSpotDetailId] = useState<string | null>(null)
  const [routeOpen, setRouteOpen] = useState(false)
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo(
      '.guide-motion-entry',
      { autoAlpha: 0, y: 18, scale: 0.992 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.72,
        stagger: 0.075,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      },
    )
  }, { scope: rootRef })

  useEffect(() => () => {
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current)
  }, [])

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setIsListening(true)

    listeningTimerRef.current = setTimeout(async () => {
      setIsListening(false)
      const remote = await fetchChatAnswer(text)

      if (remote) {
        setIsSpeaking(true)
        const guideMsg: Message = {
          id: `guide-${Date.now()}`,
          role: 'guide',
          text: remote.answer,
          source: remote.source,
          confidence: remote.confidence,
        }
        setMessages((prev) => [...prev, guideMsg])
        speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), remote.answer.length * 35)
      } else {
        setMessages((prev) => [...prev, {
          id: `guide-${Date.now()}`,
          role: 'guide',
          text: t('guide.knowledgeUnavailable'),
          source: t('guide.systemNotice'),
          confidence: 'low',
        }])
      }
    }, 800)
  }, [t])

  const handleRate = useCallback((id: string, rating: 'up' | 'down') => {
    console.log(`rated ${id}: ${rating}`)
  }, [])

  const handleQuickAction = (key: string) => {
    if (key === 'photoRecognition') setCameraOpen(true)
    else if (key === 'routeRecommend') setRouteOpen(true)
    else if (key === 'deepGuide') setSpotDetailId('lingshan-buddha')
    else handleSend(t(`guide.${key}`))
  }

  return (
    <div ref={rootRef} className="guide-canvas">
      <AmbientMotion variant="visitor" />
      <main className="guide-page modern-guide">
        <header className="guide-header guide-motion-entry">
          <div className="guide-brand-lockup">
            <span className="guide-brand-mark"><Sparkles size={17} /></span>
            <div>
              <span>{t('guide.brandOverline')}</span>
              <strong>{t('guide.title')}</strong>
            </div>
          </div>
          <div className="guide-header-actions">
            <button
              type="button"
              className={`guide-header-btn ${isOffline ? 'is-offline' : ''}`}
              onClick={() => setIsOffline((value) => !value)}
              aria-label={isOffline ? t('guide.goOnline') : t('guide.goOffline')}
            >
              {isOffline ? <WifiOff size={17} /> : <RefreshCw size={17} />}
            </button>
            <button type="button" className="guide-header-btn" onClick={() => setShareOpen(true)} aria-label={t('guide.share')}>
              <Share2 size={17} />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isOffline && (
            <motion.div
              className="offline-banner"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <WifiOff size={14} />
              <span>{t('guide.offlineBanner')}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="guide-desktop-layout">
          <div className="guide-overview-column">
        <section className="guide-context-card guide-motion-entry">
          <div className="guide-context-copy">
            <p className="guide-context-eyebrow"><Navigation size={13} /> {t('guide.contextEyebrow')}</p>
            <h1>{t('guide.contextTitle')}</h1>
            <p>{t('guide.contextSubtitle')}</p>
            <div className="guide-context-pills">
              <span><CloudSun size={14} /> {t('guide.weatherNow')}</span>
              <span><CalendarClock size={14} /> {t('guide.nextShowValue')}</span>
            </div>
          </div>
          <DigitalHuman isSpeaking={isSpeaking} spotName={t('guide.currentSpot')} />
        </section>

        <div className="guide-motion-entry">
          <LbsStatus spotName={t('guide.currentLocation')} distance={320} online={!isOffline} />
        </div>

        <section className="guide-today-strip guide-motion-entry" aria-label={t('guide.todayPlan')}>
          <div>
            <span>{t('guide.nextShow')}</span>
            <strong>{t('guide.nextShowName')}</strong>
          </div>
          <button type="button" onClick={() => setRouteOpen(true)}>
            <Compass size={15} /> {t('guide.planRoute')}
          </button>
        </section>

        <div className="guide-quick-actions guide-motion-entry">
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.key}
              type="button"
              className={`quick-action-chip tone-${action.tone}`}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleQuickAction(action.key)}
            >
              <span className="quick-action-icon"><action.icon size={18} /></span>
              <span>{t(`guide.${action.key}`)}</span>
            </motion.button>
          ))}
        </div>

          </div>

        <div className="guide-chat-wrap guide-motion-entry">
          <div className="guide-chat-heading">
            <div>
              <span>{t('guide.chatEyebrow')}</span>
              <strong>{t('guide.chatTitle')}</strong>
            </div>
            <span className="guide-online-pill"><span /> {isOffline ? t('guide.cached') : t('guide.online')}</span>
          </div>
          <ChatPanel
            messages={messages}
            onSend={handleSend}
            isListening={isListening}
            onRate={handleRate}
            onVoiceClick={() => setVoiceOpen(true)}
            onCameraClick={() => setCameraOpen(true)}
          />
        </div>
        </div>
      </main>

      <nav className="guide-bottom-nav" aria-label={t('guide.bottomNavigation')}>
        <button type="button" className="active"><MessageCircle size={19} /><span>{t('guide.tabGuide')}</span></button>
        <button type="button" onClick={() => setRouteOpen(true)}><MapPinned size={19} /><span>{t('guide.tabRoute')}</span></button>
        <button type="button" onClick={() => setCameraOpen(true)}><Camera size={19} /><span>{t('guide.tabNearby')}</span></button>
        <button type="button" onClick={() => setSpotDetailId('lingshan-buddha')}><BookOpen size={19} /><span>{t('guide.tabServices')}</span></button>
      </nav>

      <VoiceRecord isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} onResult={handleSend} />
      <PhotoRecognition
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onSpotDetail={(spotId) => {
          setCameraOpen(false)
          setTimeout(() => setSpotDetailId(spotId), 300)
        }}
        onAsk={(question) => {
          setCameraOpen(false)
          setTimeout(() => handleSend(question), 300)
        }}
      />
      <ShareCard isOpen={shareOpen} onClose={() => setShareOpen(false)} messages={messages} spotName={t('guide.scenicName')} />

      <AnimatePresence>
        {spotDetailId && (
          <SpotDetail
            key={spotDetailId}
            spotId={spotDetailId}
            onClose={() => setSpotDetailId(null)}
            onNavigate={(id) => setSpotDetailId(id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {routeOpen && (
          <RouteRecommend
            onClose={() => setRouteOpen(false)}
            onSpotClick={(spotId) => {
              setRouteOpen(false)
              setTimeout(() => setSpotDetailId(spotId), 300)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
