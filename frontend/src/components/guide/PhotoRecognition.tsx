import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Scan, Sparkles } from 'lucide-react'
import { useT } from '../../i18n'


interface Props {
  isOpen: boolean
  onClose: () => void
  onSpotDetail: (spotId: string) => void
  onAsk: (question: string) => void
}

export default function PhotoRecognition({ isOpen, onClose, onSpotDetail: _onSpotDetail, onAsk: _onAsk }: Props) {
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
                  {RECOGNITION_RESULTS.map((result, index) => (
                    <article key={result.id} className="photo-result-card">
                      <div className="photo-result-rank"><span>{index + 1}</span></div>
                      <div className="photo-result-info">
                        <div className="photo-result-top"><strong>{result.name}</strong><span className="photo-result-cat">{result.category}</span></div>
                        <p>{result.description}</p>
                        <span className="photo-confidence">{t('photo.confidence')} {result.confidence}%</span>
                      </div>
                      <div className="photo-result-actions">
                        {result.spotId && <button type="button" className="photo-action-btn" onClick={() => onSpotDetail(result.spotId!)} aria-label={`查看${result.name}详情`}><MapPin size={15} /></button>}
                        <button type="button" className="photo-action-btn ask" onClick={() => onAsk(t('photo.tellMeAbout', { name: result.name }))}><span>{t('photo.ask')}</span><ChevronRight size={14} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
