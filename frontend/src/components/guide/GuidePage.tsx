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
import { useT } from '../../i18n'
import { fetchChatAnswer } from '../../api'

const MOCK_KNOWLEDGE: Record<string, { text: string; source: string }> = {
  '灵山大佛': {
    text: '灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨。佛体由1560块铜壁板构成。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道抱佛脚，俯瞰太湖全景。开放时间8:00-17:00。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '灵山梵宫': {
    text: '灵山梵宫建筑面积7.2万平方米，最高处66.5米，造价18亿，被誉为"东方卢浮宫"。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，28米高星空穹顶用100公斤纯金绘制。核心琉璃巨制《华藏世界》由160块彩色琉璃拼接而成。每日上演《灵山吉祥颂》大型演出（10:35/11:30/14:00/16:00）。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '九龙灌浴': {
    text: '九龙灌浴位于景区中轴线核心，总高27.2米，青铜重量260吨，中央为7.2米高鎏金太子佛像。每日4-5场表演（平日10:00/11:30/13:30/15:00），莲花瓣缓缓开启，太子佛在九龙喷泉与《佛之诞》音乐中旋转升起。每场约15分钟，建议提前10分钟到场。表演结束后可接取祈福圣水。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '五印坛城': {
    text: '五印坛城位于香水海中央独立圆岛上，五层重檐楼宇，总高约30米，占地5000㎡。"五印"代表五方五佛的五种手印。藏式碉楼风格，白墙红边金顶。转经筒长廊环绕主殿，摆放108个纯铜转经筒，游客可顺时针转动祈福。登顶层观景台可俯瞰全景。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '祥符禅寺': {
    text: '祥符禅寺始建于唐贞观年间，由玄奘法师弟子窥基大师开坛讲经。北宋大中祥符年间赐额"祥符禅寺"。寺内有千年银杏、六角古井（唐代名泉，茶圣陆羽品鉴）、钟楼内祥符禅钟重12.8吨，钟声浑厚洪亮，响彻灵山山谷。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '曼飞龙塔': {
    text: '曼飞龙塔又称"白塔"，主塔高16.9米，由一座主塔和八座小塔组成九塔组合。复刻云南西双版纳景洪市曼飞龙白塔，是南传佛教标志性建筑。汉传、藏传、南传三大语系佛教建筑齐聚灵山，彰显了佛教文化的多元性与包容性。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '最佳游览路线': {
    text: '推荐经典路线：南门入园 → 灵山大照壁 → 佛手广场（天下第一掌）→ 祥符禅寺（千年古刹）→ 灵山大佛（登顶抱佛脚）→ 灵山梵宫（艺术殿堂深度游）→ 五印坛城（藏传佛教文化体验）→ 出口。全程约6小时，建议上午9点前入园避开人流高峰。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '推荐路线': {
    text: '三条精选路线：①历史文化路线（约6小时/5.2km）适合深度游；②自然风光路线（约5小时/4.5km）适合拍照休闲；③亲子家庭路线（约4小时/3km）轻松互动，含《吉祥颂》演出。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '开放时间': {
    text: '灵山胜境旺季（3月-10月）7:30-17:30，淡季（11月-次年2月）8:00-17:00。灵山大佛8:00-17:00（冬季提前至16:30），灵山梵宫9:00-17:00，九龙灌浴平日演出10:00/11:30/13:30/15:00。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '门票': {
    text: '灵山胜境成人票210元/人，学生票105元/人（凭证件），60-69岁老人105元/人，70岁以上免票。票价包含所有核心景点及《灵山吉祥颂》演出。观光车20元/人。建议通过官方小程序提前购票。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '交通': {
    text: '灵山胜境位于无锡市滨湖区马山镇灵山路1号。公交：无锡火车站乘88路直达，约90分钟；地铁：2号线至梅园开原寺站换乘88路或89路；自驾：导航"灵山胜境"，停车场小车10元/次。从无锡市区约1小时车程。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  '九龙灌浴几点': {
    text: '九龙灌浴平日演出时间：10:00、11:30、13:30、15:00，每场约15分钟。周末及节假日增加场次。建议提前10分钟到场占位，表演结束后可接取祈福圣水。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
  default: {
    text: '灵山胜境位于江苏省无锡市太湖西北部的马山镇，是国家5A级旅游景区、世界佛教论坛永久会址，被誉为"东方佛国"。景区占地面积约30万平方米，历史可追溯至1300多年前的唐代贞观年间。核心景点包括灵山大佛（世界最高露天青铜立像）、灵山梵宫（"东方卢浮宫"）、九龙灌浴、五印坛城、祥符禅寺、曼飞龙塔等。您现在位于南门入口约320米处。开放时间旺季7:30-17:30，淡季8:00-17:00，成人票210元/人。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
  },
}

const QUICK_ACTIONS = [
  { icon: Map, key: 'routeRecommend' },
  { icon: Clock, key: 'tourDuration' },
  { icon: Camera, key: 'photoRecognition' },
  { icon: BookOpen, key: 'deepGuide' },
]

export default function GuidePage() {
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
  const t = useT()

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
  })

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

      // Try backend first, fall back to mock
      const remote = await fetchChatAnswer(text)
      let replyText: string
      let replySource: string
      let replyConfidence: 'high' | 'medium' | 'low'

      if (remote) {
        replyText = remote.answer
        replySource = remote.source
        replyConfidence = remote.confidence
      } else {
        const exactMatch = MOCK_KNOWLEDGE[text]
        const partialMatch = !exactMatch && Object.entries(MOCK_KNOWLEDGE).find(([key]) =>
          text.includes(key.slice(0, 4))
        )?.[1]
        const matched = exactMatch ?? partialMatch ?? MOCK_KNOWLEDGE.default
        replyText = matched.text
        replySource = matched.source
        replyConfidence = exactMatch ? 'high' : partialMatch ? 'medium' : 'low'
      }

      setIsSpeaking(true)
      const guideMsg: Message = {
        id: `guide-${Date.now()}`,
        role: 'guide',
        text: replyText,
        source: replySource,
        confidence: replyConfidence,
      }
      setMessages((prev) => [...prev, guideMsg])

      speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), replyText.length * 35)
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
