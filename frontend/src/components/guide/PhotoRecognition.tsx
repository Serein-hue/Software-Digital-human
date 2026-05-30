import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Scan, Sparkles, ChevronRight, History, MapPin } from 'lucide-react'

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
    name: '黄鹤楼主楼',
    category: '古建筑',
    confidence: 97.3,
    description: '天下江山第一楼，始建于三国时期',
    spotId: 'huanghelou',
  },
  {
    id: 'r2',
    name: '胜像宝塔',
    category: '古建筑·元代',
    confidence: 89.6,
    description: '武汉现存最古老的地面建筑之一',
    spotId: 'shengxiang',
  },
  {
    id: 'r3',
    name: '崔颢题诗壁',
    category: '碑刻',
    confidence: 76.2,
    description: '《黄鹤楼》诗全文石刻',
  },
]

const RECENT_HISTORY = [
  { name: '白云阁', time: '3分钟前' },
  { name: '搁笔亭', time: '15分钟前' },
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

  const startScan = useCallback(() => {
    setPhase('scanning')
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setPhase('results')
          return 100
        }
        return prev + 2.5
      })
    }, 40)
  }, [])

  // Auto-start on open
  const handleOpen = useCallback(() => {
    if (isOpen) startScan()
  }, [isOpen, startScan])

  // Trigger start when opened
  if (isOpen && phase === 'scanning' && progress === 0) {
    // useEffect-like pattern but in render — actually let me use a different approach
  }

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
          <button type="button" className="photo-close-btn" onClick={onClose} aria-label="关闭">
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
                  <span className="photo-progress-label">识别中...</span>
                  <div className="photo-progress-track">
                    <motion.div
                      className="photo-progress-fill"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="photo-progress-hint">保持稳定，将景点置于框内</span>
                </div>
              </div>
            )}

            {phase === 'results' && (
              <div className="photo-results">
                <div className="photo-results-head">
                  <Sparkles size={16} />
                  <h3>识别结果</h3>
                  <button type="button" className="photo-rescan-btn" onClick={startScan}>
                    重新识别
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
                            置信度 {item.confidence}%
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
                            setTimeout(() => onAsk(`给我讲讲${item.name}`), 300)
                          }}
                        >
                          <span>提问</span>
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
                      <span>最近识别</span>
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
