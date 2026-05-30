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
  huanghelou: {
    id: 'huanghelou',
    name: '黄鹤楼主楼',
    category: '古建筑',
    heroGradient: 'linear-gradient(160deg, #1a3a4a 0%, #2a5a6a 30%, #155d58 70%, #0d3d38 100%)',
    oneLiner: '天下江山第一楼，始建于三国时期，距今近1800年。',
    shortIntro: '黄鹤楼位于武汉市武昌区蛇山之巅，始建于三国时期吴黄武二年（公元223年），最初是军事瞭望台，后演变为观赏楼阁。楼高5层，总高度51.4米，登楼可俯瞰长江和武汉三镇。现楼为1985年以清代"同治楼"为蓝本重建。',
    fullIntro: '黄鹤楼位于湖北省武汉市武昌区蛇山之巅，濒临长江，是国家5A级旅游景区、"武汉十大景"之首，素有"天下江山第一楼"之称。\n\n始建于三国时期吴黄武二年（公元223年），最初是作为军事瞭望台修建在蛇山之上。到了唐代，黄鹤楼逐渐从军事设施转变为观赏性楼阁，成为文人雅士登高望远、吟诗作赋的胜地。\n\n黄鹤楼因崔颢的《黄鹤楼》一诗而名扬天下："昔人已乘黄鹤去，此地空余黄鹤楼。黄鹤一去不复返，白云千载空悠悠。"李白也曾在此写下"故人西辞黄鹤楼，烟花三月下扬州"的千古名句，使黄鹤楼成为中国文学史上的一座丰碑。\n\n历史上，黄鹤楼多次毁于战火，仅明清两代就被毁7次，又多次重建。每次重建都融入了当时的建筑风格，使得黄鹤楼成为不同时代建筑智慧的结晶。现在的黄鹤楼是1985年以清代"同治楼"为蓝本重建的，采用钢筋混凝土仿木结构。\n\n楼高5层，总高度51.4米，底层长宽各30米。外观为三层八角，内分五层。"四"大"特色：黄瓦、朱柱、飞檐、彩绘。登楼可俯瞰长江大桥、龟山电视塔和武汉三镇的壮丽景色。\n\n建议游览时间40分钟，三楼设有互动体验区，五楼为观景层，视野最佳。',
    source: '景区官方资料 · 黄鹤楼简介 · 2026年5月更新',
    audioDuration: '3:12',
    related: ['shengxiang', 'baiyunge', 'luomeixuan'],
  },
  shengxiang: {
    id: 'shengxiang',
    name: '胜像宝塔',
    category: '古建筑·元代',
    heroGradient: 'linear-gradient(160deg, #3a2a1a 0%, #5a4a3a 30%, #8a6a3a 70%, #6a4a2a 100%)',
    oneLiner: '元代喇嘛塔，武汉现存最古老的地面建筑之一。',
    shortIntro: '胜像宝塔位于黄鹤楼东侧，是一座元代喇嘛塔，建于元至正三年（1343年），距今已有680多年历史。塔高9.36米，为石砌结构，是武汉地区现存最古老的地面建筑之一。',
    fullIntro: '胜像宝塔位于黄鹤楼东侧约200米处，是一座元代喇嘛塔，也是武汉地区现存最古老的地面建筑之一。\n\n建于元至正三年（1343年），距今已有680多年历史。塔高9.36米，为石砌结构，由基座、塔身、塔刹三部分组成。塔身呈覆钵形，塔刹为十三天相轮，具有典型的藏传佛教风格。\n\n"胜像"意为殊胜的佛像，塔身原刻有佛像和经文，但因年代久远已模糊不清。塔的存在证明了元代藏传佛教在华中地区的传播和影响。\n\n1983年被列为武汉市文物保护单位，2013年升格为全国重点文物保护单位（作为黄鹤楼古建筑群的一部分）。',
    source: '武汉市文物保护单位资料 · 2025年',
    audioDuration: '1:24',
    related: ['huanghelou', 'baiyunge'],
  },
  baiyunge: {
    id: 'baiyunge',
    name: '白云阁',
    category: '仿古建筑·观景',
    heroGradient: 'linear-gradient(160deg, #2a3a5a 0%, #3a5a7a 30%, #5a7a9a 70%, #3a5a7a 100%)',
    oneLiner: '坐看云起时，黄鹤楼的最佳观赏点。',
    shortIntro: '白云阁位于蛇山最高处，海拔约87米，是拍摄黄鹤楼全景的最佳位置。阁名取自崔颢诗句"白云千载空悠悠"。登阁远眺，黄鹤楼、长江大桥和武汉三镇尽收眼底。',
    fullIntro: '白云阁位于蛇山最高处，海拔约87米，是黄鹤楼景区内的重要景点之一。\n\n阁名取自唐代诗人崔颢《黄鹤楼》中的名句"白云千载空悠悠"。建筑为仿古楼阁式，高三层，飞檐翘角，与黄鹤楼遥相呼应。\n\n白云阁是拍摄黄鹤楼全景的最佳机位。站在阁上，黄鹤楼主楼、武汉长江大桥、龟山电视塔和滔滔长江构成一幅壮丽的城市画卷。尤其在黄昏时分，落日余晖洒在黄鹤楼的金色琉璃瓦上，景色令人叹为观止。\n\n建议游览时间15-20分钟，与黄鹤楼主楼游览结合安排。',
    source: '景区导览资料 · 2025年更新',
    audioDuration: '0:58',
    related: ['huanghelou', 'luomeixuan'],
  },
  luomeixuan: {
    id: 'luomeixuan',
    name: '落梅轩',
    category: '文化展馆',
    heroGradient: 'linear-gradient(160deg, #3a1a2a 0%, #5a2a3a 30%, #7a3a4a 70%, #5a2a3a 100%)',
    oneLiner: '赏梅听曲，体验楚文化的诗意空间。',
    shortIntro: '落梅轩位于黄鹤楼景区南侧，是一座以梅花为主题的仿古建筑，内设有楚文化展览和编钟表演。轩名取自李白诗句"黄鹤楼中吹玉笛，江城五月落梅花"。',
    fullIntro: '落梅轩位于黄鹤楼景区南侧，是一座以梅花为主题的仿古建筑，集文化展示、演艺表演和游客休憩功能于一体。\n\n轩名取自唐代诗人李白的名句"黄鹤楼中吹玉笛，江城五月落梅花"。建筑风格融合了楚地传统民居和江南园林元素，庭院内种植了多种梅花，冬春之际暗香浮动。\n\n轩内设有楚文化展厅，展示编钟复制品、楚式漆器和青铜器纹样。定期有编钟古乐表演，游客可以现场感受两千多年前的楚国宫廷音乐。\n\n建议游览时间20分钟，编钟表演时间为每整点和半点各一场（10:00-16:00）。',
    source: '黄鹤楼景区导览手册 · 2026年春季版',
    audioDuration: '1:45',
    related: ['baiyunge', 'huanghelou'],
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
  const spot = SPOTS[spotId] ?? SPOTS.huanghelou

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
