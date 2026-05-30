import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Scan, Sparkles, ChevronRight, History, MapPin } from 'lucide-react'
import { useT } from '../../i18n'

interface RecogResult {
  id: string
  name: string
  category: string
  confidence: number
  description: string
  spotId?: string
}

const MOCK_RESULTS: RecogResult[] = [
  {
    id: 'r1',
    name: '灵山大佛',
    category: '青铜佛像·世界之最',
    confidence: 97.3,
    description: '世界最高露天青铜释迦牟尼立像，通高88米',
    spotId: 'lingshan-buddha',
  },
  {
    id: 'r2',
    name: '灵山梵宫',
    category: '佛教艺术殿堂',
    confidence: 91.2,
    description: '"东方卢浮宫"，世界佛教论坛永久会址',
    spotId: 'lingshan-fanpalace',
  },
  {
    id: 'r3',
    name: '九龙灌浴',
    category: '动态音乐群雕',
    confidence: 84.5,
    description: '大型音乐动态群雕，重现"花开见佛"祥瑞场景',
    spotId: 'lingshan-jiulong',
  },
]

const RECENT_HISTORY = [
  { name: '五印坛城', time: '3分钟前' },
  { name: '祥符禅寺', time: '15分钟前' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onSpotDetail: (spotId: string) => void
  onAsk: (question: string) => void
}

export default function PhotoRecognition({ isOpen, onClose, onSpotDetail, onAsk }: Props) {
  const [phase, setPhase] = useState<'scanning' | 'results'>('scanning')
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startScan = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setPhase('scanning')
    setProgress(0)
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!)
          setPhase('results')
          return 100
        }
        return prev + 2.5
      })
    }, 40)
  }, [])

  const handleOpen = useCallback(() => {
    if (isOpen) startScan()
  }, [isOpen, startScan])

  return (
    <AnimatePresence onExitComplete={() => setPhase('scanning')}>
      {isOpen && (
        <motion.div
          className="photo-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={handleOpen}
        >
          <button type="button" className="photo-close-btn" onClick={onClose} aria-label={t('guide.close')}>
            <X size={22} />
          </button>

          <div className="photo-center">
            {phase === 'scanning' && (
              <div className="photo-scanner">
                {/* Viewfinder */}
                <div className="photo-viewfinder">
                  <div className="photo-grid-overlay" />
                  <span className="photo-corner tl" />
                  <span className="photo-corner tr" />
                  <span className="photo-corner bl" />
                  <span className="photo-corner br" />

                  <motion.div
                    className="photo-scan-beam"
                    animate={{ top: ['5%', '92%', '5%'] }}
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                  />

                  {/* Ripple rings */}
                  <motion.span
                    className="photo-ripple"
                    animate={{ scale: [0.6, 1.3], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  />
                  <motion.span
                    className="photo-ripple"
                    animate={{ scale: [0.6, 1.3], opacity: [0.5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}
                  />
                </div>

                <div className="photo-progress-section">
                  <Scan size={16} className="photo-scan-icon" />
                  <span className="photo-progress-label">{t('photo.scanning')}</span>
                  <div className="photo-progress-track">
                    <motion.div
                      className="photo-progress-fill"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="photo-progress-hint">{t('photo.hint')}</span>
                </div>
              </div>
            )}

            {phase === 'results' && (
              <div className="photo-results">
                <div className="photo-results-head">
                  <Sparkles size={16} />
                  <h3>{t('photo.results')}</h3>
                  <button type="button" className="photo-rescan-btn" onClick={startScan}>
                    {t('photo.rescan')}
                  </button>
                </div>

                <div className="photo-result-list">
                  {MOCK_RESULTS.map((item, i) => (
                    <motion.div
                      key={item.id}
                      className="photo-result-card"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                    >
                      <div className="photo-result-rank">
                        <span>{i + 1}</span>
                      </div>
                      <div className="photo-result-info">
                        <div className="photo-result-top">
                          <strong>{item.name}</strong>
                          <span className="photo-result-cat">{item.category}</span>
                        </div>
                        <p>{item.description}</p>
                        <div className="photo-result-bottom">
                          <span className="photo-confidence">
                            {t('photo.confidence')} {item.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="photo-result-actions">
                        {item.spotId && (
                          <motion.button
                            type="button"
                            className="photo-action-btn"
                            whileTap={{ scale: 0.94 }}
                            onClick={() => {
                              onClose()
                              setTimeout(() => onSpotDetail(item.spotId!), 300)
                            }}
                          >
                            <MapPin size={14} />
                          </motion.button>
                        )}
                        <motion.button
                          type="button"
                          className="photo-action-btn ask"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => {
                            onClose()
                            setTimeout(() => onAsk(t('photo.tellMeAbout', { name: item.name })), 300)
                          }}
                        >
                          <span>{t('photo.ask')}</span>
                          <ChevronRight size={14} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {RECENT_HISTORY.length > 0 && (
                  <div className="photo-history">
                    <div className="photo-history-head">
                      <History size={14} />
                      <span>{t('photo.recent')}</span>
                    </div>
                    {RECENT_HISTORY.map((item) => (
                      <div key={item.name} className="photo-history-item">
                        <span>{item.name}</span>
                        <span className="photo-history-time">{item.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
