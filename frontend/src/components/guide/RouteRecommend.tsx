import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Clock, Footprints, Star, ChevronRight, Navigation } from 'lucide-react'
import { useT } from '../../i18n'
import { fetchRoutes, type RouteItem } from '../../api'

interface RouteDisplay {
  id: string
  title: string
  description: string
  duration: string
  distance: string
  difficulty: string
  difficultyColor: string
  steps: { spot: string; duration: string; note: string }[]
  highlights: string[]
  tags: string[]
}

const DIFFICULTY_MAP: Record<string, { label: string; color: string }> = {
  'easy': { label: '轻松', color: '#155d58' },
  'medium': { label: '中等', color: '#c1a15a' },
  'hard': { label: '挑战', color: '#b4522c' },
}

const DEFAULT_DIFFICULTY = { label: '轻松', color: '#155d58' }

function toDisplay(r: RouteItem): RouteDisplay {
  const diff = DIFFICULTY_MAP[r.type ?? ''] ?? DEFAULT_DIFFICULTY
  return {
    id: r.id,
    title: r.name ?? '',
    description: r.persona ?? r.tips ?? '',
    duration: r.duration ?? '',
    distance: '',
    difficulty: diff.label,
    difficultyColor: diff.color,
    steps: (r.stops ?? []).map((s) => ({
      spot: s.spotName ?? '',
      duration: s.stayDuration ?? '',
      note: s.description ?? '',
    })),
    highlights: r.tips ? [r.tips] : [],
    tags: r.type ? [r.type] : [],
  }
}

interface Props {
  onClose: () => void
  onSpotClick: (spotId: string) => void
}

// 景点名称 → ID 映射（用于路线步骤跳转）
const SPOT_NAME_TO_ID: Record<string, string> = {
  '灵山大佛': 'LS-011',
  '灵山梵宫': 'LS-012',
  '九龙灌浴': 'LS-013',
  '五印坛城': 'LS-014',
  '祥符禅寺': 'LS-015',
  '佛手广场': 'LS-016',
  '百子戏弥勒': 'LS-017',
  '降魔成道': 'LS-018',
  '阿育王柱': 'LS-019',
  '灵山精舍': 'LS-020',
  '南门': 'LS-001',
  '佛足坛': 'LS-002',
  '菩提大道': 'LS-003',
  '曼飞龙塔': 'LS-004',
  '梵宫广场': 'LS-005',
}

export default function RouteRecommend({ onClose, onSpotClick }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [routes, setRoutes] = useState<RouteDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    fetchRoutes().then((data) => {
      if (data) {
        setRoutes(data.map(toDisplay))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  return (
    <motion.div
      className="route-page"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
    >
      <div className="route-header">
        <button type="button" className="route-back-btn" onClick={onClose} aria-label={t('guide.back')}>
          <ChevronLeft size={22} />
        </button>
        <div className="route-header-text">
          <h2>{t('route.title')}</h2>
          <span>{loading ? '加载中...' : t('route.count', { n: routes.length })}</span>
        </div>
      </div>

      <div className="route-list">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>加载路线中...</div>
        ) : routes.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>暂无路线数据</div>
        ) : (
          routes.map((route) => (
            <motion.article
              key={route.id}
              className={`route-card ${expandedId === route.id ? 'expanded' : ''}`}
              layout
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            >
              <button
                type="button"
                className="route-card-main"
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedId(expandedId === route.id ? null : route.id)
                }}
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
                  {route.distance && <span><Footprints size={13} /> {route.distance}</span>}
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
                            <button
                              type="button"
                              className="route-step-spot-btn"
                              onClick={() => {
                                const id = SPOT_NAME_TO_ID[step.spot]
                                if (id) onSpotClick(id)
                              }}
                            >
                              <strong>{step.spot}</strong>
                            </button>
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
                      <span>{t('route.startNav')}</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.article>
          ))
        )}
      </div>
    </motion.div>
  )
}
