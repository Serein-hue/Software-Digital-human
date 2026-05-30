import { useRef, useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Send, ThumbsUp, ThumbsDown, Copy } from 'lucide-react'

export interface Message {
  id: string
  role: 'user' | 'guide'
  text: string
  source?: string
}

interface Props {
  messages: Message[]
  onSend: (text: string) => void
  isListening: boolean
  onRate?: (id: string, rating: 'up' | 'down') => void
  onVoiceClick?: () => void
  onCameraClick?: () => void
}

export default function ChatPanel({ messages, onSend, isListening, onRate, onVoiceClick, onCameraClick }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
                {msg.source && (
                  <span className="msg-source">来源: {msg.source}</span>
                )}
              </div>
              {msg.role === 'guide' && onRate && (
                <div className="msg-actions">
                  <button type="button" onClick={() => onRate(msg.id, 'up')} aria-label="好评">
                    <ThumbsUp size={13} />
                  </button>
                  <button type="button" onClick={() => onRate(msg.id, 'down')} aria-label="差评">
                    <ThumbsDown size={13} />
                  </button>
                  <button type="button" aria-label="复制">
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
        <button type="button" className="mic-btn" onClick={onVoiceClick} aria-label="语音输入">
          <Mic size={20} />
        </button>
        <button type="button" className="camera-btn" onClick={onCameraClick} aria-label="拍照">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
        <input
          type="text"
          className="chat-input"
          placeholder="输入问题，或按语音键说话..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="send-btn" disabled={!input.trim()} aria-label="发送">
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
