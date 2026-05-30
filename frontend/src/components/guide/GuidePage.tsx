import { useState, useCallback, useRef, useEffect } from 'react'
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

const MOCK_KNOWLEDGE: Record<string, { text: string; source: string }> = {
  '灵山大佛': {
    text: '灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道抱佛脚，俯瞰太湖全景。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '灵山梵宫': {
    text: '灵山梵宫建筑面积7.2万平方米，最高处66.5米，造价18亿，被誉为"东方卢浮宫"。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，28米高星空穹顶用100公斤纯金绘制。每日上演《灵山吉祥颂》大型演出（10:35/11:30/14:00/16:00），圣坛可容纳2000人同时观演。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '最佳游览路线': {
    text: '推荐路线：南门入园 → 灵山大照壁 → 佛手广场（天下第一掌）→ 祥符禅寺（千年古刹）→ 灵山大佛（登顶抱佛脚）→ 灵山梵宫（艺术殿堂深度游）→ 五印坛城（藏传佛教文化体验）→ 出口。全程约6小时，建议上午9点前入园避开人流高峰。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  default: {
    text: '灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址，被誉为"东方佛国"。景区占地面积约30万平方米，历史可追溯至1300多年前的唐代贞观年间。您现在位于南门入口约320米处。',
    source: '灵山胜境官方资料',
  },
}

const QUICK_ACTIONS = [
  { icon: Map, label: '推荐路线' },
  { icon: Clock, label: '游览时长' },
  { icon: Camera, label: '拍照识景' },
  { icon: BookOpen, label: '深度讲解' },
]

export default function GuidePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'guide',
      text: '欢迎来到灵山胜境！我是您的 AI 导游小景。您可以随时向我提问，比如"灵山大佛有多高？"或者"推荐一条游览路线"。我会根据您的位置，主动为您讲解身边的景点。',
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
    listeningTimerRef.current = setTimeout(() => {
      setIsListening(false)

      const matched = MOCK_KNOWLEDGE[text]
        ?? (Object.entries(MOCK_KNOWLEDGE).find(([key]) =>
          text.includes(key.slice(0, 4))
        )?.[1])
        ?? MOCK_KNOWLEDGE.default

      setIsSpeaking(true)
      const guideMsg: Message = {
        id: `guide-${Date.now()}`,
        role: 'guide',
        text: matched.text,
        source: matched.source,
      }
      setMessages((prev) => [...prev, guideMsg])

      speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), matched.text.length * 35)
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
        <span className="guide-header-title">AI 导游</span>
        <div className="guide-header-actions">
          <button
            type="button"
            className="guide-header-btn"
            onClick={toggleOffline}
            aria-label={isOffline ? '切换到在线模式' : '切换到离线模式'}
          >
            {isOffline ? <WifiOff size={17} /> : <RefreshCw size={17} />}
          </button>
          <button
            type="button"
            className="guide-header-btn"
            onClick={() => setShareOpen(true)}
            aria-label="分享"
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
            <span>弱网模式 · 已缓存基础讲解包，部分功能可能受限</span>
          </motion.div>
        )}
      </AnimatePresence>

      <LbsStatus spotName="灵山胜境南门" distance={320} online={!isOffline} />

      <DigitalHuman isSpeaking={isSpeaking} spotName="灵山胜境" />

      {/* Quick actions + camera entry */}
      <div className="guide-quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.label}
            type="button"
            className="quick-action-chip"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (action.label === '拍照识景') {
                setCameraOpen(true)
              } else if (action.label === '推荐路线') {
                setRouteOpen(true)
              } else if (action.label === '深度讲解') {
                setSpotDetailId('lingshan-buddha')
              } else {
                handleSend(action.label)
              }
            }}
          >
            <action.icon size={15} />
            <span>{action.label}</span>
          </motion.button>
        ))}
        <motion.button
          type="button"
          className="quick-action-chip camera-chip"
          whileTap={{ scale: 0.95 }}
          onClick={() => setCameraOpen(true)}
        >
          <Image size={15} />
          <span>拍照</span>
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
