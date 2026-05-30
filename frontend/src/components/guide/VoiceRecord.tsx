import { motion, AnimatePresence } from 'framer-motion'
import { Mic, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onResult: (text: string) => void
}

const MOCK_RESULTS = [
  '灵山大佛有多高？',
  '帮我推荐一条游览路线',
  '九龙灌浴每天几场表演？',
]

export default function VoiceRecord({ isOpen, onClose, onResult }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="voice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button type="button" className="voice-close-btn" onClick={onClose} aria-label="关闭">
            <X size={22} />
          </button>

          <div className="voice-center">
            <div className="voice-rings">
              <motion.span
                className="voice-ring"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
              />
              <motion.span
                className="voice-ring"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.4 }}
              />
              <motion.span
                className="voice-ring"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.8 }}
              />
              <div className="voice-mic-icon">
                <Mic size={36} />
              </div>
            </div>

            <motion.p
              className="voice-label"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
            >
              正在聆听...
            </motion.p>

            <div className="voice-bars">
              {Array.from({ length: 16 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="voice-bar"
                  animate={{
                    height: [4, 12 + Math.random() * 28, 4],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6 + Math.random() * 0.4,
                    delay: i * 0.06,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            <div className="voice-suggestions">
              <span>试试说：</span>
              {MOCK_RESULTS.map((text) => (
                <motion.button
                  key={text}
                  type="button"
                  className="voice-suggestion-chip"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    onResult(text)
                    onClose()
                  }}
                >
                  {text}
                </motion.button>
              ))}
            </div>
          </div>

          <p className="voice-hint">轻点提示文字可快速输入 · 点击 ✕ 取消</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
