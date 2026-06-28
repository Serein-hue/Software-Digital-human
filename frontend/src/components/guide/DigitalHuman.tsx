import { motion } from 'framer-motion'
import { Sparkles, Volume2 } from 'lucide-react'
import { useT } from '../../i18n'

interface Props {
  isSpeaking: boolean
  spotName?: string
}

export default function DigitalHuman({ isSpeaking, spotName }: Props) {
  const t = useT()
  return (
    <div className="dh-stage">
      <div className="dh-scene">
        <motion.div
          className="dh-avatar"
          animate={
            isSpeaking
              ? { scale: [1, 1.015, 1, 1.01, 1], y: [0, -3, 0, -2, 0] }
              : { scale: 1, y: 0 }
          }
          transition={
            isSpeaking
              ? { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          <div className="dh-face">
            <div className="dh-eyes">
              <span className="dh-eye left" />
              <span className="dh-eye right" />
            </div>
            <motion.div
              className="dh-mouth"
              animate={isSpeaking ? { scaleY: [0.3, 1, 0.4, 0.9, 0.3] } : { scaleY: 0.5 }}
              transition={
                isSpeaking
                  ? { repeat: Infinity, duration: 0.6, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
            />
            <div className="dh-blush left" />
            <div className="dh-blush right" />
          </div>
          <div className="dh-body">
            <div className="dh-collar" />
          </div>
        </motion.div>

        {isSpeaking && (
          <motion.div
            className="dh-speech-ring"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.4, 0.15, 0.4], scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
        )}
      </div>

      <div className="dh-info">
        {isSpeaking ? (
          <motion.span
            className="dh-speaking-badge"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Volume2 size={14} />
            <span>{t('guide.speaking')}</span>
            <Sparkles size={12} />
          </motion.span>
        ) : (
          <span className="dh-idle-badge">{t('guide.brandName')}</span>
        )}
        {spotName && <span className="dh-spot-tag">{spotName}</span>}
      </div>
    </div>
  )
}
