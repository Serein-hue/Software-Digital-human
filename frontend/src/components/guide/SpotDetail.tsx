import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Clock, ChevronLeft, Play, Pause, BookOpen, Compass } from 'lucide-react'

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

const SPOTS: Record<string, SpotData> = {
  'lingshan-buddha': {
    id: 'lingshan-buddha',
    name: '灵山大佛',
    category: '青铜佛像·世界之最',
    heroGradient: 'linear-gradient(160deg, #1a3a2a 0%, #2a5a3a 30%, #5a8a4a 70%, #3a6a2a 100%)',
    oneLiner: '世界最高露天青铜释迦牟尼立像，通高88米，总高101.5米。',
    shortIntro: '灵山大佛位于无锡灵山胜境秦履峰南侧，是世界上最高的露天青铜释迦牟尼立像。佛像通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量725吨。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。登216级登云道抱佛脚，俯瞰太湖全景。',
    fullIntro: '灵山大佛位于无锡灵山胜境秦履峰南侧，矗立在景区最高处，是世界上最高的露天青铜释迦牟尼立像，也是灵山胜境的核心地标。\n\n佛像通高88米（佛体79米，莲花瓣9米），含台基总高101.5米，总用铜量达725吨，佛体由1560块6-8毫米厚的铜壁板构成，焊缝总长度逾35公里。建造历时3年（1994-1997年），采用现代高科技与传统工艺相结合的方式。\n\n在佛教意义上，大佛右手施无畏印，代表除却众生痛苦；左手施与愿印，代表赐予众生欢乐。通往大佛的216级登云道暗合佛教108烦恼与108愿望，前108级寓意"烦恼尽除"，后108级寓意"愿望圆满"。\n\n灵山大佛的建造体现了赵朴初先生"五方五佛"的理念，与香港天坛大佛、四川乐山大佛、山西云冈大佛、河南龙门大佛共同构成中国佛教五大佛像格局。\n\n最佳体验：登顶抱佛脚，俯瞰太湖全景；在夕阳西下时拍摄，金色阳光洒在大佛身上，佛光普照，美不胜收。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '3:30',
    related: ['lingshan-fanpalace', 'lingshan-jiulong', 'lingshan-mandala'],
  },
  'lingshan-fanpalace': {
    id: 'lingshan-fanpalace',
    name: '灵山梵宫',
    category: '佛教艺术殿堂',
    heroGradient: 'linear-gradient(160deg, #3a2a1a 0%, #5a3a2a 30%, #8a5a3a 70%, #5a3a1a 100%)',
    oneLiner: '"东方卢浮宫"，世界佛教论坛永久会址，融合非遗艺术的殿堂。',
    shortIntro: '灵山梵宫建筑面积7.2万平方米，最高处66.5米，造价18亿。内部汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺，五座莲花圣塔象征五方五佛。28米高星空穹顶用100公斤纯金绘制，160块琉璃构件拼成《华藏世界》巨制，被誉为当代佛教艺术巅峰之作。',
    fullIntro: '灵山梵宫位于灵山胜境西侧香水海之畔，建筑面积达7.2万平方米，最高处66.5米，整体呈"莲花环抱"之势，拥有五座错落分布的莲花圣塔，被誉为"东方卢浮宫"，荣获中国建筑工程最高奖——鲁班奖。\n\n梵宫内部堪称艺术殿堂：廊厅两侧12幅高12米宽3米的"世界佛教传法图"油画由多名油画家耗时数年创作；中庭28米高星空穹顶用100公斤纯金绘制，148尊飞天姿态各异；核心琉璃巨制《华藏世界》宽8米高10米，由160块彩色琉璃拼接而成，是目前世界最大的琉璃艺术作品之一。\n\n梵宫是第二、四届世界佛教论坛的永久会址，圣坛可容纳2000人同时观演，内设全球唯一大型旋转舞台。每日上演《灵山吉祥颂》大型演出（10:35/11:30/14:00/16:00），运用全息投影、水雾等技术演绎佛陀修行成佛的故事。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '4:00',
    related: ['lingshan-buddha', 'lingshan-mandala', 'lingshan-jiulong'],
  },
  'lingshan-jiulong': {
    id: 'lingshan-jiulong',
    name: '九龙灌浴',
    category: '动态音乐群雕',
    heroGradient: 'linear-gradient(160deg, #1a3a5a 0%, #2a4a6a 30%, #3a6a8a 70%, #1a4a6a 100%)',
    oneLiner: '大型音乐动态群雕，重现释迦牟尼诞生"花开见佛"祥瑞场景。',
    shortIntro: '九龙灌浴总高27.2米，青铜重量260吨，中央为7.2米高鎏金太子佛像。每日4-5场表演，莲花瓣缓缓开启，太子佛在九龙喷泉与《佛诞颂》音乐中旋转升起，九龙吐水为太子沐浴，水幕与阳光交织出七彩佛光。表演结束后可接取祈福圣水。',
    fullIntro: '九龙灌浴位于灵山胜境中轴线核心位置，是景区最具标志性的动态景观。总高27.2米，青铜重量260吨，中央为7.2米高、重12吨的鎏金太子佛像，周围环绕9组72只凤凰雕塑，搭配九条栩栩如生的飞龙。\n\n大型音乐动态群雕依据《本行经》中释迦牟尼诞生的传说精心打造。表演时，在专属背景音乐《佛之诞》响起时，莲花铜雕缓缓绽放，太子佛从莲花中缓缓升起并自转一周，九条飞龙同时喷出水柱高达数十米，精准沐浴在太子佛身上，整个场景震撼人心，完美还原佛陀诞生的祥瑞瞬间。\n\n平日演出时间：10:00、11:30、13:30、15:00；周末及节假日增加演出场次。每场时长约15分钟，建议提前10分钟到场占位。表演结束后可在广场两侧接取龙头流出的"圣水"，寓意祈福安康。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '2:45',
    related: ['lingshan-buddha', 'lingshan-fanpalace', 'lingshan-xiangfu'],
  },
  'lingshan-mandala': {
    id: 'lingshan-mandala',
    name: '五印坛城',
    category: '藏传佛教文化',
    heroGradient: 'linear-gradient(160deg, #3a1a2a 0%, #5a1a3a 30%, #8a2a4a 70%, #5a1a3a 100%)',
    oneLiner: '"小布达拉宫"，藏传佛教文化瑰宝，四面环水的湖心圣殿。',
    shortIntro: '五印坛城位于香水海中央独立圆岛上，五层重檐楼宇，总高约30米，占地5000㎡。藏式碉楼风格，白墙红边金顶，四门安置瑞兽雕塑。坛城内设转经筒长廊（108个纯铜转经筒）、唐卡展厅和藏传佛教文物陈列，展现汉藏佛教文化交融。',
    fullIntro: '五印坛城位于香水海中央的独立圆岛上，通过景观栈道与灵山梵宫相连。建筑为五层重檐楼宇，总高约30米，占地5000㎡，整体采用藏式碉楼风格，白墙红边金顶，以西藏拉萨布达拉宫雪村大门为原型设计山门。\n\n"五印"代表五方五佛的五种手印（施无畏印、与愿印、说法印、禅定印、降魔印），坛城是藏传佛教中的曼陀罗道场，象征着宇宙的和谐与圆满。四门的瑞兽雕塑各有寓意：马宝象征吉祥如意，孔雀代表智慧光明，共命鸟寓意和睦友爱，象宝象征太平盛世。\n\n内部墙体绘有彩色唐卡，主殿供奉五方五佛藏式造像。转经筒长廊环绕主殿，摆放108个纯铜转经筒，游客可顺时针转动，寓意祈福消灾。登至五层顶层观景台，可俯瞰香水海、灵山梵宫与灵山大佛全景，感受"三水环抱、佛塔相映"的绝美意境。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '2:15',
    related: ['lingshan-fanpalace', 'lingshan-buddha', 'lingshan-xiangfu'],
  },
  'lingshan-xiangfu': {
    id: 'lingshan-xiangfu',
    name: '祥符禅寺',
    category: '千年古刹',
    heroGradient: 'linear-gradient(160deg, #2a3a1a 0%, #3a4a2a 30%, #4a5a3a 70%, #2a3a1a 100%)',
    oneLiner: '唐代古刹，玄奘法师弟子开坛讲经之地，千年银杏见证兴衰。',
    shortIntro: '祥符禅寺始建于唐贞观年间，由玄奘法师弟子窥基大师开坛讲经。北宋大中祥符年间赐额"祥符禅寺"，占地约30亩。寺内有千年银杏、六角古井等珍贵历史遗迹，钟楼内悬挂重12.8吨的"祥符禅钟"，钟声浑厚洪亮，响彻灵山山谷。',
    fullIntro: '祥符禅寺位于灵山胜境中轴核心，是景区内历史最悠久的人文景观。始建于唐贞观年间，与玄奘法师西行取经的壮举紧密相连——玄奘法师途经马山时见此地山形酷似印度灵鹫山，遂命名为"小灵山"，并嘱咐大弟子窥基法师在此住持道场。\n\n北宋大中祥符年间，宋真宗赐额"祥符禅寺"，寺院规模不断扩大，成为江南名刹。千百年来，寺院历经多次兴废，至清末民初毁于战火，仅存一棵千年银杏、一口六角古井和一段残垣断壁。1994年启动修复工程，千年古刹重获新生。\n\n寺内珍贵遗存：千年银杏树龄超千年，秋季金黄树叶铺满寺院；六角井为唐代名泉，曾被茶圣陆羽品鉴；钟楼内的祥符禅钟重12.8吨，钟声悠扬，响彻太湖之滨。游客可参与撞钟祈福，钟声象征"烦恼尽除，福慧增长"。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '2:00',
    related: ['lingshan-buddha', 'lingshan-jiulong', 'lingshan-fanpalace'],
  },
}

type Tier = '一句话' | '30秒' | '3分钟'

const TIER_LABELS: { tier: Tier; icon: typeof Clock; desc: string }[] = [
  { tier: '一句话', icon: Clock, desc: '一句话' },
  { tier: '30秒', icon: Clock, desc: '简短版' },
  { tier: '3分钟', icon: BookOpen, desc: '深度讲解' },
]

const TIER_CONTENT: Record<Tier, keyof SpotData> = {
  '一句话': 'oneLiner',
  '30秒': 'shortIntro',
  '3分钟': 'fullIntro',
}

interface Props {
  spotId: string
  onClose: () => void
  onNavigate: (spotId: string) => void
}

export default function SpotDetail({ spotId, onClose, onNavigate }: Props) {
  const [tier, setTier] = useState<Tier>('30秒')
  const [isPlaying, setIsPlaying] = useState(false)
  const spot = SPOTS[spotId] ?? SPOTS['lingshan-buddha']

  const content = spot[TIER_CONTENT[tier]]

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      setTimeout(() => setIsPlaying(false), spot.audioDuration.split(':').reduce((m, s) => m * 60 + +s, 0) * 1000)
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
      <div className="spot-hero" style={{ background: spot.heroGradient }}>
        <button type="button" className="spot-back-btn" onClick={onClose} aria-label="返回">
          <ChevronLeft size={22} />
        </button>
        <div className="spot-hero-overlay">
          <span className="spot-category-tag">{spot.category}</span>
          <h1 className="spot-hero-name">{spot.name}</h1>
        </div>
        <div className="spot-hero-wave">
          <svg viewBox="0 0 480 40" preserveAspectRatio="none">
            <path d="M0 20 Q120 0 240 20 Q360 40 480 20 L480 40 L0 40 Z" fill="#fff" />
          </svg>
        </div>
      </div>

      {/* Tier switcher */}
      <div className="spot-tier-bar">
        {TIER_LABELS.map(({ tier: t, icon: Icon, desc }) => (
          <button
            key={t}
            type="button"
            className={`spot-tier-btn ${tier === t ? 'active' : ''}`}
            onClick={() => setTier(t)}
          >
            <Icon size={14} />
            <span>{desc}</span>
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
          <span>{spot.source}</span>
        </div>
      </div>

      {/* Audio player */}
      <div className="spot-audio-bar">
        <button
          type="button"
          className={`spot-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="spot-audio-info">
          <span className="spot-audio-label">{isPlaying ? '正在播报...' : 'AI 语音讲解'}</span>
          <span className="spot-audio-dur">{spot.audioDuration}</span>
        </div>
        {isPlaying && (
          <div className="spot-audio-bars">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.span
                key={i}
                className="spot-audio-bar"
                animate={{ height: [6, 14 + Math.random() * 18, 6] }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.3, delay: i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Related spots */}
      <div className="spot-related">
        <div className="spot-related-head">
          <Compass size={15} />
          <span>附近景点</span>
        </div>
        <div className="spot-related-list">
          {spot.related.map((id) => {
            const s = SPOTS[id]
            if (!s) return null
            return (
              <motion.button
                key={id}
                type="button"
                className="spot-related-chip"
                whileTap={{ scale: 0.96 }}
                onClick={() => onNavigate(id)}
              >
                <MapPin size={13} />
                <div className="spot-related-text">
                  <strong>{s.name}</strong>
                  <span>{s.oneLiner.slice(0, 28)}...</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export { SPOTS }
