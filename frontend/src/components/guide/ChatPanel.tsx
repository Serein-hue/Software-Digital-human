import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, ThumbsUp, ThumbsDown, Copy, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { useT } from '../../i18n'

export interface Message {
  id: string
  role: 'user' | 'guide'
  text: string
  source?: string
  confidence?: 'high' | 'medium' | 'low'
}

const CONFIDENCE_CONFIG = {
  high: { icon: ShieldCheck, cls: 'confidence-high', labelKey: 'chat.confidenceHigh' },
  medium: { icon: ShieldAlert, cls: 'confidence-medium', labelKey: 'chat.confidenceMedium' },
  low: { icon: ShieldQuestion, cls: 'confidence-low', labelKey: 'chat.confidenceLow' },
} as const

interface Props {
  messages: Message[]
  onSend: (text: string) => void
  isListening: boolean
  onRate?: (id: string, rating: 'up' | 'down') => void
  onVoiceClick?: () => void
  onCameraClick?: () => void
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  const cfg = CONFIDENCE_CONFIG[confidence]
  const Icon = cfg.icon
  return (
    <span className={`confidence-badge ${cfg.cls}`}>
      <Icon size={12} />
      <span>{t(cfg.labelKey)}</span>
    </span>
  )
}

export default function ChatPanel({ messages, onSend, isListening, onRate, onVoiceClick, onCameraClick }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`msg-row ${msg.role}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
            >
              <div className="msg-bubble">
                <p>{msg.text}</p>
                {(msg.source || msg.confidence) && (
                  <div className="msg-meta">
                    {msg.source && <span className="msg-source">{t('admin.sourceRef')}: {msg.source}</span>}
                    {msg.confidence && <ConfidenceBadge confidence={msg.confidence} />}
                  </div>
                )}
              </div>
              {msg.role === 'guide' && onRate && (
                <div className="msg-actions">
                  <button type="button" onClick={() => onRate(msg.id, 'up')} aria-label={t('guide.rateUp')}>
                    <ThumbsUp size={13} />
                  </button>
                  <button type="button" onClick={() => onRate(msg.id, 'down')} aria-label={t('guide.rateDown')}>
                    <ThumbsDown size={13} />
                  </button>
                  <button type="button" aria-label={t('guide.copy')} onClick={() => {
                    navigator.clipboard?.writeText(msg.text)?.catch(() => {})
                  }}>
                    <Copy size={13} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isListening && (
          <motion.div
            className="msg-row guide listening-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="msg-bubble listening">
              <span className="wave-dot" />
              <span className="wave-dot" />
              <span className="wave-dot" />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <button type="button" className="mic-btn" onClick={onVoiceClick} aria-label={t('guide.voiceInput')}>
          <Mic size={20} />
        </button>
        <button type="button" className="camera-btn" onClick={onCameraClick} aria-label={t('guide.camera')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
        <input
          type="text"
          className="chat-input"
          placeholder={t('guide.inputPlaceholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!input.trim()} aria-label={t('guide.send')}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
