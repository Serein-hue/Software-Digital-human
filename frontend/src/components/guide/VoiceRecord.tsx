import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, X, AlertCircle, RefreshCw } from 'lucide-react'
import { useT, getLang } from '../../i18n'

interface Props {
  isOpen: boolean
  onClose: () => void
  onResult: (text: string) => void
}

const SUGGESTIONS_ZH = [
  '灵山大佛有多高？',
  '帮我推荐一条游览路线',
  '九龙灌浴每天几场表演？',
]

const SUGGESTIONS_EN = [
  'How tall is the Grand Buddha?',
  'Recommend a tour route',
  'When are the Nine Dragons shows?',
]

type Phase = 'listening' | 'result' | 'error' | 'idle'

export default function VoiceRecord({ isOpen, onClose, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('listening')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<Phase>('listening')
  const t = useT()

  // Keep phaseRef synced so recognition.onend reads current phase without stale closure
  useEffect(() => { phaseRef.current = phase }, [phase])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* already stopped */ }
      recognitionRef.current = null
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setPhase('error')
      setErrorMsg(t('voice.unsupported'))
      return
    }

    stopListening()

    const recognition = new SpeechRecognition()
    recognition.lang = getLang() === 'en' ? 'en-US' : 'zh-CN'
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript.trim()
      setTranscript(text)

      if (result.isFinal) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        setPhase('result')
        setTimeout(() => {
          if (text) {
            onResult(text)
            onClose()
          }
        }, 600)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setPhase('error')
        setErrorMsg(t('voice.denied'))
      } else if (event.error !== 'aborted') {
        setPhase('error')
        setErrorMsg(t('voice.error'))
      }
    }

    recognition.onend = () => {
      if (phaseRef.current === 'listening') {
        setPhase('idle')
      }
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setPhase('listening')
      setTranscript('')
      setErrorMsg('')

      silenceTimerRef.current = setTimeout(() => {
        stopListening()
        setPhase('idle')
      }, 8000)
    } catch {
      setPhase('error')
      setErrorMsg(t('voice.cantStart'))
    }
  }, [onResult, onClose, stopListening])

  useEffect(() => {
    if (isOpen) startListening()
    return () => stopListening()
  }, [isOpen, startListening, stopListening])

  const handleClose = () => {
    stopListening()
    onClose()
  }

  return (
    <AnimatePresence onExitComplete={() => setPhase('listening')}>
      {isOpen && (
        <motion.div
          className="voice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button type="button" className="voice-close-btn" onClick={handleClose} aria-label={t('guide.close')}>
            <X size={22} />
          </button>

          <div className="voice-center">
            {/* Listening state */}
            {(phase === 'listening' || phase === 'idle') && (
              <>
                <div className="voice-rings">
                  <motion.span
                    className="voice-ring"
                    animate={{ scale: phase === 'listening' ? [1, 1.6, 1] : 1, opacity: phase === 'listening' ? [0.6, 0, 0.6] : 0.2 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                  />
                  <motion.span
                    className="voice-ring"
                    animate={{ scale: phase === 'listening' ? [1, 1.5, 1] : 1, opacity: phase === 'listening' ? [0.5, 0, 0.5] : 0.2 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.4 }}
                  />
                  <motion.span
                    className="voice-ring"
                    animate={{ scale: phase === 'listening' ? [1, 1.4, 1] : 1, opacity: phase === 'listening' ? [0.4, 0, 0.4] : 0.15 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.8 }}
                  />
                  <div className="voice-mic-icon">
                    <Mic size={36} />
                  </div>
                </div>

                <motion.p
                  className="voice-label"
                  animate={{ opacity: phase === 'listening' ? [0.5, 1, 0.5] : 0.7 }}
                  transition={{ repeat: phase === 'listening' ? Infinity : 0, duration: 1.6 }}
                >
                  {phase === 'listening' ? t('voice.listening') : t('voice.tapRetry')}
                </motion.p>

                {transcript && (
                  <motion.p
                    className="voice-interim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {transcript}
                  </motion.p>
                )}

                <div className="voice-bars">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="voice-bar"
                      animate={{
                        height: phase === 'listening'
                          ? [4, 12 + Math.random() * 28, 4]
                          : 4,
                      }}
                      transition={{
                        repeat: phase === 'listening' ? Infinity : 0,
                        duration: 0.6 + Math.random() * 0.4,
                        delay: i * 0.06,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Result state */}
            {phase === 'result' && (
              <motion.div
                className="voice-result"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <motion.p className="voice-result-text">{transcript}</motion.p>
                <span className="voice-result-hint">{t('voice.recognized')}</span>
              </motion.div>
            )}

            {/* Error state */}
            {phase === 'error' && (
              <div className="voice-error">
                <AlertCircle size={28} />
                <p>{errorMsg}</p>
                <motion.button
                  type="button"
                  className="voice-retry-btn"
                  whileTap={{ scale: 0.95 }}
                  onClick={startListening}
                >
                  <RefreshCw size={14} />
                  <span>{t('voice.retry')}</span>
                </motion.button>
              </div>
            )}

            {/* Suggestions (only in idle/error) */}
            {(phase === 'idle' || phase === 'error') && (
              <div className="voice-suggestions">
                <span>{t('voice.suggestions')}</span>
                {(getLang() === 'en' ? SUGGESTIONS_EN : SUGGESTIONS_ZH).map((text) => (
                  <motion.button
                    key={text}
                    type="button"
                    className="voice-suggestion-chip"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      stopListening()
                      onResult(text)
                      onClose()
                    }}
                  >
                    {text}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <p className="voice-hint">
            {phase === 'listening' ? t('voice.hintListening') : t('voice.hintDefault')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
