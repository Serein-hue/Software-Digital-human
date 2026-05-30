import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircle, Mic, Smile, Volume2, Eye,
  Check, Play, Pause, RotateCcw,
} from 'lucide-react'
import { useT } from '../../i18n'

interface AvatarData {
  id: string
  name: string
  style: string
  description: string
  gradient: string
}

const AVATARS: AvatarData[] = [
  {
    id: 'classic-guide',
    name: '经典导游',
    style: '现代职业',
    description: '端庄大方的职业导游形象，适合历史文化类景区',
    gradient: 'linear-gradient(135deg, #155d58, #15bba0)',
  },
  {
    id: 'hanfu-scholar',
    name: '汉服书生',
    style: '古风国潮',
    description: '身着汉服的文人雅士，适合诗词文化类讲解',
    gradient: 'linear-gradient(135deg, #3a2a1a, #5a3a2a)',
  },
  {
    id: 'tibetan-lama',
    name: '藏文化向导',
    style: '民族特色',
    description: '藏传佛教文化主题形象，适合五印坛城等藏式景点',
    gradient: 'linear-gradient(135deg, #5a1a3a, #8a2a4a)',
  },
  {
    id: 'monk-zen',
    name: '禅意僧人',
    style: '佛教文化',
    description: '庄严肃穆的僧侣形象，适合寺院和佛教文化讲解',
    gradient: 'linear-gradient(135deg, #2a3a1a, #4a5a3a)',
  },
  {
    id: 'child-buddy',
    name: '灵山童童',
    style: '亲子萌趣',
    description: '活泼可爱的卡通形象，适合亲子路线和儿童互动',
    gradient: 'linear-gradient(135deg, #e89460, #b4522c)',
  },
  {
    id: 'modern-host',
    name: '时尚主播',
    style: '现代时尚',
    description: '年轻活力的现代主播风，适合年轻游客群体',
    gradient: 'linear-gradient(135deg, #1a3a5a, #3a5a8a)',
  },
]

const VOICE_PRESETS = [
  { id: 'default', name: '标准女声', desc: '温柔知性，语速适中' },
  { id: 'male-deep', name: '浑厚男声', desc: '庄重沉稳，适合历史讲解' },
  { id: 'female-sweet', name: '甜美女生', desc: '清新活泼，适合亲子互动' },
  { id: 'elder-warm', name: '慈祥长者', desc: '和蔼可亲，适合文化深度游' },
]

export default function DigitalHumanConfig() {
  const [selectedAvatar, setSelectedAvatar] = useState('classic-guide')
  const [voicePreset, setVoicePreset] = useState('default')
  const [speed, setSpeed] = useState(50)
  const [pitch, setPitch] = useState(50)
  const [showExpression, setShowExpression] = useState(true)
  const [showGesture, setShowGesture] = useState(true)
  const [autoSwitch, setAutoSwitch] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const t = useT()

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

      <div className="dhconfig-grid">
        {/* Avatar selection */}
        <div className="dhconfig-section">
          <div className="dhconfig-section-head">
            <UserCircle size={16} />
            <span>{t('admin.avatarSelect')}</span>
          </div>
          <div className="dhconfig-avatar-grid">
            {AVATARS.map((av) => (
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
            {VOICE_PRESETS.map((vp) => (
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

          {/* Preview button */}
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
              <input
                type="checkbox"
                checked={showExpression}
                onChange={(e) => setShowExpression(e.target.checked)}
              />
              <span className="dhconfig-toggle-knob" />
            </label>

            <label className="dhconfig-toggle">
              <div>
                <strong>{t('admin.handGesture')}</strong>
                <span>{t('admin.handGestureDesc')}</span>
              </div>
              <input
                type="checkbox"
                checked={showGesture}
                onChange={(e) => setShowGesture(e.target.checked)}
              />
              <span className="dhconfig-toggle-knob" />
            </label>

            <label className="dhconfig-toggle">
              <div>
                <strong>{t('admin.autoSpotSwitch')}</strong>
                <span>{t('admin.autoSpotDesc')}</span>
              </div>
              <input
                type="checkbox"
                checked={autoSwitch}
                onChange={(e) => setAutoSwitch(e.target.checked)}
              />
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
              style={{ background: AVATARS.find((a) => a.id === selectedAvatar)?.gradient }}
              animate={isPlaying ? { scale: [1, 1.03, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <UserCircle size={48} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </motion.div>
            <div className="dhconfig-preview-info">
              <strong>{AVATARS.find((a) => a.id === selectedAvatar)?.name}</strong>
              <span>{VOICE_PRESETS.find((v) => v.id === voicePreset)?.name}</span>
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
