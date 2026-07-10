import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Leaf,
  Lock,
  LogIn,
  MapPinned,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { loginAdmin } from '../api/admin'
import AmbientMotion from './AmbientMotion'
import { useT } from '../i18n'

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const t = useT()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError(t('login.required'))
      return
    }
    setLoading(true)
    setError('')
    try {
      const user = await loginAdmin(username, password)
      if (user) onLogin()
      else setError(t('login.invalid'))
    } catch {
      setError(t('login.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page modern-login-page">
      <AmbientMotion variant="login" />

      <motion.section
        className="login-experience"
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-brand-lockup">
          <span className="login-brand-icon"><Leaf size={22} /></span>
          <span>{t('login.brand')}</span>
        </div>
        <p className="login-eyebrow"><Sparkles size={14} /> {t('login.eyebrow')}</p>
        <h1>{t('login.heroTitle')}</h1>
        <p className="login-lead">{t('login.heroSubtitle')}</p>

        <div className="login-feature-list">
          <div><MapPinned size={18} /><span>{t('login.featureGuide')}</span></div>
          <div><ShieldCheck size={18} /><span>{t('login.featureOps')}</span></div>
          <div><Sparkles size={18} /><span>{t('login.featureAi')}</span></div>
        </div>

        <div className="login-scenic-note">
          <span>{t('login.locationLabel')}</span>
          <strong>{t('login.locationValue')}</strong>
        </div>
      </motion.section>

      <motion.div
        className="login-card modern-login-card"
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.62, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="login-header">
          <span className="login-card-mark"><LogIn size={19} /></span>
          <p className="login-card-eyebrow">{t('login.secureAccess')}</p>
          <h2>{t('login.title')}</h2>
          <p>{t('login.subtitle')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="admin-username">{t('login.username')}</label>
          <div className="login-field">
            <User size={17} />
            <input
              id="admin-username"
              type="text"
              placeholder={t('login.usernamePlaceholder')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <label className="login-label" htmlFor="admin-password">{t('login.password')}</label>
          <div className="login-field">
            <Lock size={17} />
            <input
              id="admin-password"
              type="password"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <motion.div className="login-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button type="submit" className="login-submit" disabled={loading} whileTap={{ scale: 0.985 }}>
            <span>{loading ? t('login.loading') : t('login.submit')}</span>
            {!loading && <ArrowRight size={17} />}
          </motion.button>
        </form>

        <p className="login-privacy"><ShieldCheck size={13} /> {t('login.privacy')}</p>
      </motion.div>
    </div>
  )
}
