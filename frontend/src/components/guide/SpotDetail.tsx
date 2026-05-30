import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ChevronLeft, Play, Pause, BookOpen, Compass } from 'lucide-react'
import { useT } from '../../i18n'
import { fetchSpot, fetchRelatedSpots } from '../../api'

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
  'lingshan-dazhaobi': {
    id: 'lingshan-dazhaobi',
    name: '灵山大照壁',
    category: '景区门户',
    heroGradient: 'linear-gradient(160deg, #1a3a2a 0%, #2a4a3a 30%, #3a5a3a 70%, #1a3a2a 100%)',
    oneLiner: '"华夏第一壁"，赵朴初先生亲笔题写鎏金"灵山胜境"四字。',
    shortIntro: '灵山大照壁位于景区入口处，长39.8m，高7m，采用优质青石雕刻而成，被誉为"华夏第一壁"。正面鎏金大字由赵朴初先生题写，北立面刻有赵老诗作《小灵山》，奠定景区佛教文化基调。',
    fullIntro: '照壁采用优质青石精心雕刻，表面打磨光滑，纹理细腻，正面鎏金大字由赵朴初先生题写，笔力遒劲，鎏金工艺让字体在阳光下熠熠生辉。北立面刻有赵老诗作《小灵山》，诗中对比印度灵鹫山与中国小灵山，彰显中华佛教文化的自信与底蕴。照壁两侧与碧波荡漾的太湖交相辉映，构成"湖光山色共一楼"的壮美景观。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '1:30',
    related: ['lingshan-wuzhimen', 'lingshan-xiangfu'],
  },
  'lingshan-manfeilong': {
    id: 'lingshan-manfeilong',
    name: '曼飞龙塔',
    category: '南传佛教建筑',
    heroGradient: 'linear-gradient(160deg, #4a3a2a 0%, #6a5a3a 30%, #8a7a4a 70%, #5a4a2a 100%)',
    oneLiner: '复刻西双版纳曼飞龙白塔，南传佛教标志性建筑。',
    shortIntro: '曼飞龙塔主塔高16.9m，由一座主塔和八座小塔组成九塔组合，采用白色花岗岩材质。复刻云南西双版纳曼飞龙白塔，是南传佛教标志性建筑。汉传、藏传、南传三大语系佛教建筑齐聚灵山。',
    fullIntro: '曼飞龙塔又称"白塔"，是灵山胜境中代表南传佛教文化的核心建筑，完全复刻了云南西双版纳曼飞龙白塔的形制与工艺。主塔矗立在圆形须弥座中央，塔身呈葫芦状，塔刹高耸，鎏金装饰熠熠生辉；八座小塔环绕主塔分布，呈八角形排列，形成"众星拱月"的格局。塔身表面的雕刻极为精美，采用浅浮雕工艺，刻有释迦牟尼佛成道图、阿罗汉像、莲花纹、卷草纹等南传佛教特色图案。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '1:45',
    related: ['lingshan-mandala', 'lingshan-fanpalace'],
  },
  'lingshan-wuzhimen': {
    id: 'lingshan-wuzhimen',
    name: '五智门',
    category: '核心门户',
    heroGradient: 'linear-gradient(160deg, #2a2a3a 0%, #3a3a4a 30%, #4a4a5a 70%, #2a2a3a 100%)',
    oneLiner: '五门六柱石牌坊，穿过此门正式踏入禅意圣地。',
    shortIntro: '五智门高16.8m，宽35m，五门六柱汉白玉石牌坊。五门象征五方五佛，六柱代表佛教"六度波罗蜜"（布施、持戒、忍辱、精进、禅定、般若）。穿过此门，正式踏入禅意圣地。',
    fullIntro: '五智门由优质汉白玉精雕细琢而成，雕刻工艺精湛绝伦，门柱上雕刻着佛教六度智慧的相关经文，字体工整、苍劲有力；门楣处饰有飞天、神兽、莲花等吉祥图案，造型栩栩如生。整座牌坊气势恢宏，矗立在景区中轴线上，与后方的灵山大佛在同一直线上。夜间灯光点缀，更具氛围感。',
    source: '灵山胜境官方资料 · 示范景区公开资料包',
    audioDuration: '1:30',
    related: ['lingshan-dazhaobi', 'lingshan-buddha', 'lingshan-xiangfu'],
  },
}

type Tier = '一句话' | '30秒' | '3分钟'

const TIER_LABELS: { tier: Tier; icon: typeof Clock; descKey: string }[] = [
  { tier: '一句话', icon: Clock, descKey: 'spot.oneLine' },
  { tier: '30秒', icon: Clock, descKey: 'spot.shortVersion' },
  { tier: '3分钟', icon: BookOpen, descKey: 'spot.deepGuide' },
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
  const audioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [remoteSpot, setRemoteSpot] = useState<SpotData | null>(null)
  const [remoteRelated, setRemoteRelated] = useState<SpotData[] | null>(null)
  const t = useT()

  useEffect(() => {
    fetchSpot(spotId).then((data) => {
      if (data) {
        setRemoteSpot({
          id: data.id,
          name: data.name,
          category: data.category,
          heroGradient: data.heroGradient,
          oneLiner: data.shortIntro,
          shortIntro: data.shortIntro,
          fullIntro: data.fullIntro,
          source: data.source,
          audioDuration: '3:00',
          related: data.related,
        })
        fetchRelatedSpots(spotId).then((related) => {
          if (related) {
            setRemoteRelated(related.map((r) => ({
              id: r.id,
              name: r.name,
              category: r.category,
              heroGradient: r.heroGradient,
              oneLiner: r.shortIntro,
              shortIntro: r.shortIntro,
              fullIntro: r.shortIntro,
              source: '',
              audioDuration: '2:00',
              related: [],
            })))
          }
        })
      }
    }).catch(() => {})
  }, [spotId])

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
    }
  }, [])

  const spot = remoteSpot ?? SPOTS[spotId] ?? SPOTS['lingshan-buddha']
  const relatedSpots = remoteRelated ?? spot.related.map((id) => SPOTS[id]).filter(Boolean) as SpotData[]

  const content = spot[TIER_CONTENT[tier]]

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false)
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current)
    } else {
      setIsPlaying(true)
      const duration = spot.audioDuration.split(':').reduce((m, s) => m * 60 + +s, 0) * 1000
      audioTimerRef.current = setTimeout(() => setIsPlaying(false), duration)
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
        <button type="button" className="spot-back-btn" onClick={onClose} aria-label={t('guide.back')}>
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
          <span>{spot.source}</span>
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
          <span className="spot-audio-dur">{spot.audioDuration}</span>
        </div>
        {isPlaying && (
          <div className="spot-audio-bars">
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.span
                key={i}
                className="spot-audio-bar-inner"
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
          <span>{t('spot.nearbySpots')}</span>
        </div>
        <div className="spot-related-list">
          {relatedSpots.map((s) => {
            if (!s) return null
            return (
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
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export { SPOTS }
