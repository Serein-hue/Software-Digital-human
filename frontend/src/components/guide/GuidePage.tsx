import { useState, useCallback } from 'react'
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
  '黄鹤楼的历史': {
    text: '黄鹤楼始建于三国时期吴黄武二年（公元223年），距今已有近1800年历史。最初是作为军事瞭望台而建，后逐渐演变为观赏楼阁。历史上黄鹤楼多次毁于战火，又多次重建，现在的黄鹤楼是1985年以清代"同治楼"为蓝本重建的。',
    source: '景区官方资料 · 黄鹤楼简介',
  },
  '黄鹤楼的诗词': {
    text: '黄鹤楼因唐代诗人崔颢的《黄鹤楼》一诗而名扬天下："昔人已乘黄鹤去，此地空余黄鹤楼。黄鹤一去不复返，白云千载空悠悠。"李白也曾在此写下"故人西辞黄鹤楼，烟花三月下扬州"的千古名句。',
    source: '唐诗三百首 · 景区文化展板',
  },
  '最佳游览路线': {
    text: '推荐路线：东门入 → 胜像宝塔（10分钟）→ 黄鹤楼主楼（40分钟，含登楼）→ 白云阁（15分钟）→ 落梅轩（20分钟）→ 南门出。全程约1.5小时。如果带孩子，建议在主楼多停留20分钟，三楼有互动体验区。',
    source: '景区推荐路线 · 2026年5月更新',
  },
  default: {
    text: '黄鹤楼位于湖北省武汉市武昌区蛇山之巅，是国家5A级旅游景区，也是"武汉十大景"之首。楼高5层，总高度51.4米，登楼可俯瞰长江和武汉三镇风光。您现在位于东门入口约320米处，步行约4分钟可达主楼。',
    source: '景区官方资料',
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
      text: '欢迎来到黄鹤楼！我是您的 AI 导游小景。您可以随时向我提问，比如"黄鹤楼有什么历史故事？"或者"推荐一条游览路线"。我会根据您的位置，主动为您讲解身边的景点。',
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

  const handleSend = useCallback((text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
    }
    setMessages((prev) => [...prev, userMsg])

    setIsListening(true)
    setTimeout(() => {
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

      setTimeout(() => setIsSpeaking(false), matched.text.length * 35)
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

      <LbsStatus spotName="黄鹤楼东门" distance={320} online={!isOffline} />

      <DigitalHuman isSpeaking={isSpeaking} spotName="黄鹤楼" />

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
                setSpotDetailId('huanghelou')
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
        spotName="黄鹤楼"
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
