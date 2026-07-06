import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, X, AlertCircle, RefreshCw } from 'lucide-react'
import { useT, getLang } from '../../i18n'

interface Props {
  isOpen: boolean
  onClose: () => void
  onResult: (text: string) => void
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}

interface SpeechRecognitionEventLike {
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}

interface SpeechRecognitionErrorLike {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

const VOICE_BARS = Array.from({ length: 16 }, (_, i) => ({
  key: i,
  height: 12 + ((i * 7) % 28),
  duration: 0.6 + (i % 5) * 0.08,
}))

type Phase = 'listening' | 'result' | 'error' | 'idle'

export default function VoiceRecord({ isOpen, onClose, onResult }: Props) {
  const [phase, setPhase] = useState<Phase>('listening')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<Phase>('listening')
  const t = useT()
  const lang = getLang()

  const SUGGESTIONS = lang === 'en'
    ? ['How tall is the Grand Buddha?', 'Recommend a tour route', 'When are the Nine Dragons shows?']
    : ['灵山大佛有多高？', '帮我推荐一条游览路线', '九龙灌浴每天几场表演？']

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
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition
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

    recognition.onresult = (event) => {
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

    recognition.onerror = (event) => {
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
  }, [onResult, onClose, stopListening, t])

  useEffect(() => {
    if (isOpen) queueMicrotask(startListening)
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
                  {VOICE_BARS.map((bar) => (
                    <motion.span
                      key={bar.key}
                      className="voice-bar"
                      animate={{
                        height: phase === 'listening'
                          ? [4, bar.height, 4]
                          : 4,
                      }}
                      transition={{
                        repeat: phase === 'listening' ? Infinity : 0,
                        duration: bar.duration,
                        delay: bar.key * 0.06,
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
                {(SUGGESTIONS).map((text) => (
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
