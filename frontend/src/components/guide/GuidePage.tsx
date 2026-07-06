import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Clock, Camera, BookOpen, Share2, Image, WifiOff, RefreshCw } from 'lucide-react'
import DigitalHuman from './DigitalHuman'
import LbsStatus from './LbsStatus'
import ChatPanel, { type Message } from './ChatPanel'
import VoiceRecord from './VoiceRecord'
import SpotDetail from './SpotDetail'
import RouteRecommend from './RouteRecommend'
import PhotoRecognition from './PhotoRecognition'
import ShareCard from './ShareCard'
import { getLang, useT } from '../../i18n'
import { fetchChatAnswer } from '../../api'

const QUICK_ACTIONS = [
  { icon: Map, key: 'routeRecommend' },
  { icon: Clock, key: 'tourDuration' },
  { icon: Camera, key: 'photoRecognition' },
  { icon: BookOpen, key: 'deepGuide' },
]

export default function GuidePage() {
  const t = useT()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'guide',
      text: t('guide.welcome'),
    },
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
  const langRef = useRef(getLang())

  useEffect(() => {
    const current = getLang()
    if (current !== langRef.current) {
      langRef.current = current
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === 'welcome') {
          return [{ id: 'welcome', role: 'guide' as const, text: t('guide.welcome') }]
        }
        return prev
      })
    }
  }, [t])

  useEffect(() => {
    return () => {
      if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current)
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current)
    }
  }, [])

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMsg])

    setIsListening(true)
    listeningTimerRef.current = setTimeout(async () => {
      setIsListening(false)

      // Try backend
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
        const guideMsg: Message = {
          id: `guide-${Date.now()}`,
          role: 'guide',
          text: '抱歉，暂时无法连接到知识库，请稍后再试。',
          source: '系统提示',
          confidence: 'low' as const,
        }
        setMessages((prev) => [...prev, guideMsg])
      }
    }, 800)
  }, [])

  const handleRate = useCallback((id: string, rating: 'up' | 'down') => {
    console.log(`rated ${id}: ${rating}`)
  }, [])

  const toggleOffline = () => setIsOffline((v) => !v)

  return (
    <div className="guide-page">
      {/* Header */}
      <header className="guide-header">
        <span className="guide-header-title">{t('guide.title')}</span>
        <div className="guide-header-actions">
          <button
            type="button"
            className="guide-header-btn"
            onClick={toggleOffline}
            aria-label={isOffline ? t('guide.goOnline') : t('guide.goOffline')}
          >
            {isOffline ? <WifiOff size={17} /> : <RefreshCw size={17} />}
          </button>
          <button
            type="button"
            className="guide-header-btn"
            onClick={() => setShareOpen(true)}
            aria-label={t('guide.share')}
          >
            <Share2 size={17} />
          </button>
        </div>
      </header>

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            className="offline-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <WifiOff size={13} />
            <span>{t('guide.offlineBanner')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <LbsStatus spotName="灵山胜境南门" distance={320} online={!isOffline} />

      <DigitalHuman isSpeaking={isSpeaking} spotName="灵山胜境" />

      {/* Quick actions + camera entry */}
      <div className="guide-quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.key}
            type="button"
            className="quick-action-chip"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (action.key === 'photoRecognition') {
                setCameraOpen(true)
              } else if (action.key === 'routeRecommend') {
                setRouteOpen(true)
              } else if (action.key === 'deepGuide') {
                setSpotDetailId('lingshan-buddha')
              } else {
                handleSend(t(`guide.${action.key}`))
              }
            }}
          >
            <action.icon size={15} />
            <span>{t(`guide.${action.key}`)}</span>
          </motion.button>
        ))}
        <motion.button
          type="button"
          className="quick-action-chip camera-chip"
          whileTap={{ scale: 0.95 }}
          onClick={() => setCameraOpen(true)}
        >
          <Image size={15} />
          <span>{t('guide.photo')}</span>
        </motion.button>
      </div>

      <ChatPanel
        messages={messages}
        onSend={handleSend}
        isListening={isListening}
        onRate={handleRate}
        onVoiceClick={() => setVoiceOpen(true)}
        onCameraClick={() => setCameraOpen(true)}
      />

      {/* Voice recording overlay */}
      <VoiceRecord
        isOpen={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={(text) => handleSend(text)}
      />

      {/* Photo Recognition */}
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

      {/* Share Card */}
      <ShareCard
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        messages={messages}
        spotName="灵山胜境"
      />

      {/* Spot Detail */}
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

      {/* Route Recommend */}
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
