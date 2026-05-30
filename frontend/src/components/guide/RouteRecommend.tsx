import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Clock, Footprints, Star, MapPin, ChevronRight, Navigation } from 'lucide-react'

interface RouteStep {
  spot: string
  duration: string
  note: string
}

interface RouteData {
  id: string
  title: string
  description: string
  duration: string
  distance: string
  difficulty: '轻松' | '中等' | '挑战'
  difficultyColor: string
  steps: RouteStep[]
  highlights: string[]
  tags: string[]
}

const ROUTES: RouteData[] = [
  {
    id: 'history',
    title: '历史文化爱好者路线',
    description: '深度探访灵山胜境千年佛教文化，从唐代古刹到当代艺术殿堂，适合对佛教文化与历史感兴趣的游客。',
    duration: '约6小时',
    distance: '5.2 km',
    difficulty: '中等',
    difficultyColor: '#c1a15a',
    steps: [
      { spot: '南门入园', duration: '—', note: '扫码入园，领取电子导览' },
      { spot: '灵山大照壁', duration: '10分钟', note: '华夏第一壁，39.8米浮雕全景' },
      { spot: '佛手广场', duration: '15分钟', note: '天下第一掌，摸掌祈福' },
      { spot: '祥符禅寺', duration: '30分钟', note: '千年古刹，玄奘法师渊源' },
      { spot: '灵山大佛', duration: '60分钟', note: '登216级登云道，抱佛脚，俯瞰太湖' },
      { spot: '灵山梵宫', duration: '90分钟', note: '佛教艺术殿堂，赏《吉祥颂》演出' },
      { spot: '五印坛城', duration: '45分钟', note: '藏传佛教文化，转经筒祈福' },
      { spot: '三圣殿', duration: '20分钟', note: '佛教历史文化展示' },
      { spot: '出口', duration: '—', note: '结束游览' },
    ],
    highlights: ['含《吉祥颂》演出', '千年古刹深度讲解', '藏传+汉传佛教融合'],
    tags: ['推荐', '深度', '人文'],
  },
  {
    id: 'nature',
    title: '自然风光爱好者路线',
    description: '徜徉于太湖之滨、青龙白虎山环抱之间，感受佛教文化与自然环境的完美融合。',
    duration: '约5小时',
    distance: '4.5 km',
    difficulty: '轻松',
    difficultyColor: '#155d58',
    steps: [
      { spot: '南门入园', duration: '—', note: '扫码入园' },
      { spot: '佛足坛', duration: '10分钟', note: '佛教文化起点' },
      { spot: '九龙灌浴', duration: '20分钟', note: '观赏动态表演，接取祈福圣水' },
      { spot: '菩提大道', duration: '20分钟', note: '漫步林荫道，欣赏太湖风光' },
      { spot: '灵山大佛', duration: '50分钟', note: '登顶俯瞰太湖全景，拍佛光日落' },
      { spot: '曼飞龙塔', duration: '20分钟', note: '傣族佛教建筑，园林景观' },
      { spot: '灵山精舍', duration: '30分钟', note: '禅意园林，品尝素斋' },
      { spot: '梵宫广场', duration: '20分钟', note: '外观梵宫全貌，拍照留念' },
      { spot: '出口', duration: '—', note: '结束游览' },
    ],
    highlights: ['太湖最佳拍摄点', '含九龙灌浴表演', '精舍素斋体验'],
    tags: ['风光', '休闲', '拍照'],
  },
  {
    id: 'family',
    title: '亲子家庭路线',
    description: '节奏轻松、互动丰富，让孩子在玩乐中感受传统文化魅力，适合带老人和小孩的家庭。',
    duration: '约4小时',
    distance: '3.0 km',
    difficulty: '轻松',
    difficultyColor: '#155d58',
    steps: [
      { spot: '南门入园', duration: '—', note: '靠近停车场，步行便捷' },
      { spot: '九龙灌浴', duration: '25分钟', note: '动态群雕表演，孩子最爱"花开见佛"' },
      { spot: '佛手广场', duration: '15分钟', note: '摸天下第一掌，沾福气' },
      { spot: '百子戏弥勒', duration: '15分钟', note: '百个孩童雕塑，亲子互动拍照' },
      { spot: '灵山大佛', duration: '40分钟', note: '全家一起登顶抱佛脚' },
      { spot: '灵山梵宫', duration: '60分钟', note: '观看《吉祥颂》演出，欣赏琉璃壁画' },
      { spot: '五印坛城', duration: '30分钟', note: '转动108个转经筒，体验藏式文化' },
      { spot: '出口', duration: '—', note: '出口旁有素面餐厅' },
    ],
    highlights: ['步行距离短', '互动体验丰富', '含《吉祥颂》演出'],
    tags: ['亲子', '轻松', '互动'],
  },
]

interface Props {
  onClose: () => void
  onSpotClick: (spotId: string) => void
}

export default function RouteRecommend({ onClose, onSpotClick }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <motion.div
      className="route-page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <div className="route-header">
        <button type="button" className="route-back-btn" onClick={onClose} aria-label="返回">
          <ChevronLeft size={22} />
        </button>
        <div className="route-header-text">
          <h2>推荐路线</h2>
          <span>3 条精选路线</span>
        </div>
      </div>

      <div className="route-list">
        {ROUTES.map((route) => (
          <motion.article
            key={route.id}
            className={`route-card ${expandedId === route.id ? 'expanded' : ''}`}
            layout
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          >
            <button
              type="button"
              className="route-card-main"
              onClick={() => setExpandedId(expandedId === route.id ? null : route.id)}
            >
              <div className="route-card-top">
                <div className="route-card-left">
                  <h3>{route.title}</h3>
                  <p>{route.description}</p>
                  <div className="route-tags">
                    {route.tags.map((tag) => (
                      <span key={tag} className="route-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className={`route-chevron ${expandedId === route.id ? 'open' : ''}`}
                />
              </div>

              <div className="route-meta">
                <span><Clock size={13} /> {route.duration}</span>
                <span><Footprints size={13} /> {route.distance}</span>
                <span className="route-difficulty" style={{ color: route.difficultyColor }}>
                  <Star size={13} /> {route.difficulty}
                </span>
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expandedId === route.id && (
                <motion.div
                  className="route-detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: 'easeInOut' }}
                >
                  <div className="route-highlights">
                    {route.highlights.map((h) => (
                      <span key={h} className="route-highlight-chip">{h}</span>
                    ))}
                  </div>

                  <div className="route-steps">
                    {route.steps.map((step, i) => (
                      <div key={step.spot} className="route-step">
                        <div className="route-step-dot">
                          <span>{i + 1}</span>
                          {i < route.steps.length - 1 && <span className="route-step-line" />}
                        </div>
                        <div className="route-step-content">
                          <strong>{step.spot}</strong>
                          <span className="route-step-dur">{step.duration}</span>
                          <p>{step.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    type="button"
                    className="route-start-btn"
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                  >
                    <Navigation size={16} />
                    <span>开始导航</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        ))}
      </div>
    </motion.div>
  )
}

export { ROUTES }
