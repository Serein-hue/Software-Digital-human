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
    id: 'classic',
    title: '经典全景线',
    description: '涵盖黄鹤楼核心景点，适合首次到访的游客，全程节奏舒适。',
    duration: '约1.5小时',
    distance: '2.1 km',
    difficulty: '轻松',
    difficultyColor: '#155d58',
    steps: [
      { spot: '东门入口', duration: '—', note: '扫码入园，领取电子导览' },
      { spot: '胜像宝塔', duration: '10分钟', note: '元代古塔，武汉最古老地面建筑' },
      { spot: '黄鹤楼主楼', duration: '40分钟', note: '登楼观景，三层互动体验区' },
      { spot: '白云阁', duration: '15分钟', note: '最佳拍摄点，俯瞰长江大桥' },
      { spot: '落梅轩', duration: '20分钟', note: '楚文化展，编钟表演' },
      { spot: '南门出口', duration: '—', note: '结束游览，可步行至户部巷' },
    ],
    highlights: ['全程节奏舒适', '含主楼登顶', '适合拍照打卡'],
    tags: ['推荐', '首次游览', '全景'],
  },
  {
    id: 'culture',
    title: '文化深度线',
    description: '聚焦历史文化和诗词典故，适合对人文感兴趣的游客。',
    duration: '约2小时',
    distance: '2.8 km',
    difficulty: '中等',
    difficultyColor: '#c1a15a',
    steps: [
      { spot: '南门入口', duration: '—', note: '从南门进入，避开人流' },
      { spot: '诗碑廊', duration: '20分钟', note: '历代名人题咏黄鹤楼的诗碑' },
      { spot: '崔颢题诗壁', duration: '10分钟', note: '《黄鹤楼》诗全文石刻' },
      { spot: '黄鹤楼主楼', duration: '50分钟', note: '逐层细看楹联、壁画、文物展' },
      { spot: '搁笔亭', duration: '10分钟', note: '李白"眼前有景道不得"典故' },
      { spot: '白云阁', duration: '20分钟', note: '观江景、品茶歇' },
      { spot: '落梅轩', duration: '20分钟', note: '编钟表演 + 楚文化展厅' },
    ],
    highlights: ['诗词典故丰富', '含编钟表演', '避开人群路线'],
    tags: ['人文', '深度', '慢游'],
  },
  {
    id: 'family',
    title: '亲子轻松线',
    description: '节奏慢、休息点多，主楼有互动体验区，适合带老人和小孩。',
    duration: '约1小时',
    distance: '1.6 km',
    difficulty: '轻松',
    difficultyColor: '#155d58',
    steps: [
      { spot: '东门入口', duration: '—', note: '靠近停车场，步行距离短' },
      { spot: '黄鹤楼主楼', duration: '50分钟', note: '电梯上三楼互动区，孩子最爱' },
      { spot: '落梅轩', duration: '15分钟', note: '编钟表演，孩子会喜欢' },
      { spot: '南门出口', duration: '—', note: '出口即有餐饮和休息区' },
    ],
    highlights: ['步行距离最短', '互动区适合孩子', '休息点充足'],
    tags: ['亲子', '轻松', '短途'],
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
