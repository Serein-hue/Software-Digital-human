import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircle, Mic, Smile, Volume2, Eye,
  Check, Play, Pause, RotateCcw,
} from 'lucide-react'
import { useT } from '../../i18n'
import { fetchAvatars, fetchVoices, type AvatarItem, type VoiceItem } from '../../api/admin'

export default function DigitalHumanConfig() {
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [voicePreset, setVoicePreset] = useState('')
  const [speed, setSpeed] = useState(50)
  const [pitch, setPitch] = useState(50)
  const [showExpression, setShowExpression] = useState(true)
  const [showGesture, setShowGesture] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [avatars, setAvatars] = useState<AvatarItem[]>([])
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    Promise.all([fetchAvatars(), fetchVoices()]).then(([av, vo]) => {
      if (av) {
        setAvatars(av)
        setSelectedAvatar(av[0]?.id ?? '')
      }
      if (vo) {
        setVoices(vo)
        setVoicePreset(vo[0]?.id ?? '')
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const currentAvatar = avatars.find((a) => a.id === selectedAvatar)
  const currentVoice = voices.find((v) => v.id === voicePreset)

  return (
    <motion.div
      className="dhconfig-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>{t('admin.digitalHuman')}</h2>
          <span>{t('admin.dhDesc')}</span>
        </div>
        <motion.button
          type="button"
          className="kb-upload-btn"
          whileTap={{ scale: 0.97 }}
          style={{ background: 'var(--ink)' }}
        >
          <RotateCcw size={15} />
          <span>{t('admin.resetDefault')}</span>
        </motion.button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>加载中...</div>
      ) : (
        <div className="dhconfig-grid">
          {/* Avatar selection */}
          <div className="dhconfig-section">
            <div className="dhconfig-section-head">
              <UserCircle size={16} />
              <span>{t('admin.avatarSelect')}</span>
            </div>
            <div className="dhconfig-avatar-grid">
              {avatars.map((av) => (
                <motion.button
                  key={av.id}
                  type="button"
                  className={`dhconfig-avatar-card ${selectedAvatar === av.id ? 'active' : ''}`}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedAvatar(av.id)}
                >
                  <div className="dhconfig-avatar-preview" style={{ background: av.gradient }}>
                    <UserCircle size={28} style={{ color: 'rgba(255,255,255,0.7)' }} />
                    {selectedAvatar === av.id && (
                      <span className="dhconfig-avatar-check">
                        <Check size={14} />
                      </span>
                    )}
                  </div>
                  <div className="dhconfig-avatar-info">
                    <strong>{av.name}</strong>
                    <span>{av.style}</span>
                    <p>{av.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Voice config */}
          <div className="dhconfig-section">
            <div className="dhconfig-section-head">
              <Mic size={16} />
              <span>{t('admin.voiceConfig')}</span>
            </div>

            <div className="dhconfig-voice-presets">
              {voices.map((vp) => (
                <button
                  key={vp.id}
                  type="button"
                  className={`dhconfig-voice-card ${voicePreset === vp.id ? 'active' : ''}`}
                  onClick={() => setVoicePreset(vp.id)}
                >
                  <strong>{vp.name}</strong>
                  <span>{vp.desc}</span>
                </button>
              ))}
            </div>

            <div className="dhconfig-sliders">
              <div className="dhconfig-slider-group">
                <div className="dhconfig-slider-label">
                  <Volume2 size={13} />
                  <span>{t('admin.speed')}</span>
                  <span className="dhconfig-slider-val">{speed}%</span>
                </div>
                <input
                  type="range"
                  className="dhconfig-slider"
                  min={0}
                  max={100}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
              </div>
              <div className="dhconfig-slider-group">
                <div className="dhconfig-slider-label">
                  <Mic size={13} />
                  <span>{t('admin.pitch')}</span>
                  <span className="dhconfig-slider-val">{pitch}%</span>
                </div>
                <input
                  type="range"
                  className="dhconfig-slider"
                  min={0}
                  max={100}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                />
              </div>
            </div>

            <motion.button
              type="button"
              className="dhconfig-preview-btn"
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? t('admin.stopPreview') : t('admin.testVoice')}</span>
            </motion.button>
          </div>
        </div>
      )}

      <div className="dhconfig-grid">
        {/* Expression & gesture */}
        <div className="dhconfig-section">
          <div className="dhconfig-section-head">
            <Smile size={16} />
            <span>{t('admin.expressionGesture')}</span>
          </div>

          <div className="dhconfig-toggle-list">
            <label className="dhconfig-toggle">
              <div>
                <strong>{t('admin.facialExpression')}</strong>
                <span>{t('admin.facialExprDesc')}</span>
              </div>
              <input type="checkbox" checked={showExpression} onChange={(e) => setShowExpression(e.target.checked)} />
              <span className="dhconfig-toggle-knob" />
            </label>

            <label className="dhconfig-toggle">
              <div>
                <strong>{t('admin.handGesture')}</strong>
                <span>{t('admin.handGestureDesc')}</span>
              </div>
              <input type="checkbox" checked={showGesture} onChange={(e) => setShowGesture(e.target.checked)} />
              <span className="dhconfig-toggle-knob" />
            </label>

            <label className="dhconfig-toggle">
              <div>
                <strong>{t('admin.autoSpotSwitch')}</strong>
                <span>{t('admin.autoSpotDesc')}</span>
              </div>
              <input type="checkbox" checked={autoSwitch} onChange={(e) => setAutoSwitch(e.target.checked)} />
              <span className="dhconfig-toggle-knob" />
            </label>
          </div>
        </div>

        {/* Preview area */}
        <div className="dhconfig-section">
          <div className="dhconfig-section-head">
            <Eye size={16} />
            <span>{t('admin.livePreview')}</span>
          </div>
          <div className="dhconfig-preview-stage">
            <motion.div
              className="dhconfig-preview-avatar"
              style={{ background: currentAvatar?.gradient ?? 'linear-gradient(135deg, #155d58, #15bba0)' }}
              animate={isPlaying ? { scale: [1, 1.03, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <UserCircle size={48} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </motion.div>
            <div className="dhconfig-preview-info">
              <strong>{currentAvatar?.name ?? '经典导游'}</strong>
              <span>{currentVoice?.name ?? '标准女声'}</span>
              <div className="dhconfig-preview-badges">
                {showExpression && <span className="dhconfig-preview-badge">表情 ✓</span>}
                {showGesture && <span className="dhconfig-preview-badge">手势 ✓</span>}
                {autoSwitch && <span className="dhconfig-preview-badge">自动切换 ✓</span>}
                {!showExpression && !showGesture && !autoSwitch && (
                  <span className="dhconfig-preview-badge off">{t('admin.noEffects')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
