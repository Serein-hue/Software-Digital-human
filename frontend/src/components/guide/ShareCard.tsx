import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Copy, Check, Sparkles, MapPin, Calendar } from 'lucide-react'
import type { Message } from './ChatPanel'
import { useT, getLang } from '../../i18n'

interface Props {
  isOpen: boolean
  onClose: () => void
  messages: Message[]
  spotName?: string
}

const TEMPLATES = [
  {
    id: 'classic',
    labelKey: 'share.templateClassic',
    gradient: 'linear-gradient(160deg, #155d58 0%, #1a3a4a 40%, #0d3d38 100%)',
    accent: '#15bba0',
  },
  {
    id: 'warm',
    labelKey: 'share.templateWarm',
    gradient: 'linear-gradient(160deg, #b4522c 0%, #8a3a1a 40%, #5a2a1a 100%)',
    accent: '#e89460',
  },
  {
    id: 'ink',
    labelKey: 'share.templateInk',
    gradient: 'linear-gradient(160deg, #20231f 0%, #2a3028 40%, #1a1f18 100%)',
    accent: '#bdb4a0',
  },
]

export default function ShareCard({ isOpen, onClose, messages, spotName = '灵山胜境' }: Props) {
  const [templateId, setTemplateId] = useState('classic')
  const [copied, setCopied] = useState(false)
  const t = useT()

  const highlight = useMemo(() => {
    const guideMsgs = messages.filter((m) => m.role === 'guide' && m.id !== 'welcome')
    if (guideMsgs.length === 0) return null
    const last = guideMsgs[guideMsgs.length - 1]
    return last.text.slice(0, 80) + (last.text.length > 80 ? '...' : '')
  }, [messages])

  const today = useMemo(() => {
    const d = new Date()
    if (getLang() === 'en') {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }, [])

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]

  const stats = useMemo(() => ({
    questions: messages.filter((m) => m.role === 'user').length,
    spots: new Set(messages.map((m) => m.text?.slice(0, 10))).size,
  }), [messages])

  const handleCopy = () => {
    navigator.clipboard.writeText(
      t('share.copyText', { spot: spotName, count: stats.questions }),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="share-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="share-card-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          >
            <div className="share-card-sheet-handle" />

            <div className="share-card-header">
              <h3>{t('share.title')}</h3>
              <button type="button" className="share-card-close" onClick={onClose} aria-label={t('guide.close')}>
                <X size={20} />
              </button>
            </div>

            {/* Template picker */}
            <div className="share-template-picker">
              {TEMPLATES.map((templateOption) => (
                <button
                  key={templateOption.id}
                  type="button"
                  className={`share-template-dot ${templateId === templateOption.id ? 'active' : ''}`}
                  style={{ background: templateOption.id === templateId ? templateOption.accent : templateOption.gradient }}
                  onClick={() => setTemplateId(templateOption.id)}
                  aria-label={t(templateOption.labelKey)}
                >
                  {templateId === templateOption.id && <span className="share-template-check" />}
                </button>
              ))}
            </div>

            {/* Card Preview */}
            <motion.div
              className="share-card-preview"
              key={templateId}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{ background: template.gradient }}
            >
              <div className="share-card-inner">
                <div className="share-card-decor-top">
                  <span className="share-card-line" />
                  <Sparkles size={14} style={{ color: template.accent }} />
                  <span className="share-card-line" />
                </div>

                <div className="share-card-body">
                  <div className="share-card-spot">
                    <MapPin size={18} style={{ color: template.accent }} />
                    <h2>{spotName}</h2>
                  </div>

                  {highlight && (
                    <p className="share-card-quote">"{highlight}"</p>
                  )}

                  <div className="share-card-stats">
                    <span>
                      {t('share.explored', { count: stats.questions })}
                    </span>
                    <span>
                      <Calendar size={12} />
                      {today}
                    </span>
                  </div>
                </div>

                <div className="share-card-footer">
                  <span className="share-card-brand">{t('share.brand')}</span>
                  <span className="share-card-subtitle">{t('share.subtitle')}</span>
                </div>
              </div>

              {/* Shine effect */}
              <div className="share-card-shine" />
            </motion.div>

            {/* Actions */}
            <div className="share-card-actions">
              <motion.button
                type="button"
                className="share-card-action-btn"
                whileTap={{ scale: 0.96 }}
                onClick={handleCopy}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span>{copied ? t('share.copyDone') : t('share.copyLabel')}</span>
              </motion.button>
              <motion.button
                type="button"
                className="share-card-action-btn primary"
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
              >
                <Download size={18} />
                <span>{t('share.saveImage')}</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
