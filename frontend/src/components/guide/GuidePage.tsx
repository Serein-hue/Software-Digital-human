import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Clock, Camera, BookOpen, Share2, Image, WifiOff, RefreshCw, User, Bot, MapPin, ChevronRight } from 'lucide-react'
import DigitalHuman from './DigitalHuman'
import LbsStatus from './LbsStatus'
import ChatPanel, { type Message } from './ChatPanel'
import VoiceRecord from './VoiceRecord'
import SpotDetail from './SpotDetail'
import RouteRecommend from './RouteRecommend'
import PhotoRecognition from './PhotoRecognition'
import ShareCard from './ShareCard'
import { getLang, useT } from '../../i18n'
import { fetchChatAnswer, fetchSpots } from '../../api'
import type { SpotItem } from '../../api'
import { decodeAudioToVisemes } from '../../api/lipsync'
import type { VisemeFrame } from '../../api/lipsync'

const QUICK_ACTIONS = [
  { icon: Map, key: 'routeRecommend' },
  { icon: Clock, key: 'tourDuration' },
  { icon: Camera, key: 'photoRecognition' },
  { icon: BookOpen, key: 'deepGuide' },
]

const SPOT_GRADIENTS: Record<string, string> = {
  'LS-011': 'linear-gradient(135deg, #1a3a2a, #2d6a4f)',
  'LS-012': 'linear-gradient(135deg, #1b2838, #2d4a6a)',
  'LS-013': 'linear-gradient(135deg, #1a3a4a, #2d6a7a)',
  'LS-014': 'linear-gradient(135deg, #2a1a3a, #5a2d6a)',
  'LS-015': 'linear-gradient(135deg, #3a2a1a, #6a4a2d)',
  'LS-016': 'linear-gradient(135deg, #1a2a3a, #3a5a6a)',
}

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
  const [dhMode, setDhMode] = useState<'cartoon' | 'realistic'>(
    () => (localStorage.getItem('scenic_dh_mode') as 'cartoon' | 'realistic') || 'cartoon'
  )
  const [spokenText, setSpokenText] = useState('')
  const [visemeFrames, setVisemeFrames] = useState<VisemeFrame[]>([])
  const [spotDetailId, setSpotDetailId] = useState<string | null>(null)
  const [routeOpen, setRouteOpen] = useState(false)
  const [spots, setSpots] = useState<SpotItem[]>([])
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const langRef = useRef(getLang())

  function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1])
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
    return new Blob([ab], { type: mimeString })
  }

  /** 用 AudioContext 解码 MP3 blob → PCM → viseme 帧序列 */
  async function decodeBlobToVisemes(blob: Blob): Promise<VisemeFrame[]> {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    const frames = decodeAudioToVisemes(audioBuffer)
    ctx.close()
    return frames
  }

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

  // 加载景点列表
  useEffect(() => {
    fetchSpots().then(list => {
      if (list) setSpots(list.slice(0, 6)) // 取前6个主要景点
    })
  }, [])

  // ── 核心：发送消息 → 获取回答 → 先取 TTS + 解码 viseme → 音画同步启动 ──
  const handleSend = useCallback(async (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMsg])

    setIsListening(true)
    await new Promise(r => setTimeout(r, 800))
    setIsListening(false)

    // 1. 获取 AI 回答
    const remote = await fetchChatAnswer(text)

    if (!remote) {
      setMessages((prev) => [...prev, {
        id: `guide-${Date.now()}`,
        role: 'guide',
        text: '抱歉，暂时无法连接到知识库，请稍后再试。',
        source: '系统提示',
        confidence: 'low' as const,
      }])
      return
    }

    // 2. 立即显示回答文字
    setMessages((prev) => [...prev, {
      id: `guide-${Date.now()}`,
      role: 'guide',
      text: remote.answer,
      source: remote.source,
      confidence: remote.confidence,
    }])

    // 3. 先取 TTS → 解码 viseme → 再启动（音画同步关键）
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: remote.answer.substring(0, 500), voice: 'zh-CN-XiaoxiaoNeural' }),
        signal: AbortSignal.timeout(15000),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.result === 'successful' && data.audio_base64) {
          const blob = dataURItoBlob(`data:audio/mp3;base64,${data.audio_base64}`)

          // 🔑 关键：先解码出真实 viseme 帧
          const frames = await decodeBlobToVisemes(blob)

          const url = URL.createObjectURL(blob)

          // 清理之前的音频
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
          }

          // 创建新 Audio 但不播放
          const audio = new Audio(url)
          audioRef.current = audio

          // 同时启动动画 + 音频
          const durationMs = (audio.duration || frames.length * 50) * 1000 + 500
          setVisemeFrames(frames)
          setIsSpeaking(true)
          setSpokenText(remote.answer)

          if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current)
          speakingTimerRef.current = setTimeout(() => {
            setIsSpeaking(false)
            setVisemeFrames([])
          }, durationMs)

          await audio.play()
          return // 成功，跳过 fallback
        }
      }
    } catch {
      // TTS 不可用 → 降级到文字动画
    }

    // 4. Fallback：无 TTS，纯文字动画
    setVisemeFrames([])
    setSpokenText(remote.answer)
    setIsSpeaking(true)
    speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), remote.answer.length * 35)
  }, [])

  const handleRate = useCallback((id: string, rating: 'up' | 'down') => {
    console.log(`rated ${id}: ${rating}`)
  }, [])

  const toggleOffline = () => setIsOffline((v) => !v)
  const toggleDhMode = () => {
    setDhMode((prev) => {
      const next = prev === 'cartoon' ? 'realistic' : 'cartoon'
      localStorage.setItem('scenic_dh_mode', next)
      return next
    })
  }

  return (
    <div className="guide-page">
      {/* Header */}
      <header className="guide-header">
        <span className="guide-header-title">{t('guide.title')}</span>
        <div className="guide-header-actions">
          <button
            type="button"
            className={`guide-header-btn dh-mode-toggle ${dhMode === 'realistic' ? 'active' : ''}`}
            onClick={toggleDhMode}
            aria-label={dhMode === 'cartoon' ? t('guide.switchToReal') : t('guide.switchToCartoon')}
            title={dhMode === 'cartoon' ? '切换真实形象' : '切换卡通形象'}
          >
            {dhMode === 'realistic' ? <User size={17} /> : <Bot size={17} />}
          </button>
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

      <DigitalHuman
        isSpeaking={isSpeaking}
        spotName="灵山胜境"
        mode={dhMode}
        spokenText={spokenText}
        visemeFrames={visemeFrames}
        audioRef={audioRef}
      />

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
                setSpotDetailId('LS-011')
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

      {/* 景点推荐 — 横向滚动 */}
      {spots.length > 0 && (
        <div className="guide-spot-carousel">
          <div className="guide-spot-carousel-header">
            <MapPin size={14} />
            <span>{t('guide.popularSpots')}</span>
            <ChevronRight size={14} />
          </div>
          <div className="guide-spot-carousel-scroll">
            {spots.map((spot) => (
              <motion.button
                key={spot.id}
                type="button"
                className="guide-spot-card"
                style={{ background: SPOT_GRADIENTS[spot.id] || 'linear-gradient(135deg, #2a3a2a, #4a6a4a)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSpotDetailId(spot.id)}
              >
                <span className="guide-spot-card-name">{spot.name}</span>
                <span className="guide-spot-card-tags">{spot.tags?.slice(0, 2).join(' · ')}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

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
