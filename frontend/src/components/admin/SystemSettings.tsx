import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Key, Bell, Database, Info, Copy, Check,
  Trash2, RefreshCw, Shield, Globe,
} from 'lucide-react'
import { useT } from '../../i18n'

export default function SystemSettings() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const t = useT()

  const copyKey = (key: string, label: string) => {
    navigator.clipboard.writeText(key).catch(() => {})
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <motion.div
      className="settings-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>{t('admin.systemSettings')}</h2>
          <span>{t('admin.settingsDesc')}</span>
        </div>
      </div>

      <div className="settings-grid">
        {/* Basic info */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Globe size={15} />
            <span>{t('admin.basicConfig')}</span>
          </div>
          <div className="settings-fields">
            <label className="settings-field">
              <span>{t('admin.scenicName')}</span>
              <input type="text" value="灵山胜境" readOnly className="settings-input" />
            </label>
            <label className="settings-field">
              <span>{t('admin.scenicId')}</span>
              <input type="text" value="lingshan-wuxi-2025" readOnly className="settings-input" />
            </label>
            <label className="settings-field">
              <span>{t('admin.adminEmail')}</span>
              <input type="email" value="admin@lingshan.com" className="settings-input" />
            </label>
            <label className="settings-field">
              <span>{t('admin.servicePhone')}</span>
              <input type="text" value="0510-8568xxxx" className="settings-input" />
            </label>
          </div>
        </div>

        {/* API Keys */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Key size={15} />
            <span>{t('admin.apiKeys')}</span>
          </div>
          <div className="settings-fields">
            {[
              { label: 'DeepSeek API Key', key: 'sk-ds-••••••••••••••a1b2', full: 'sk-ds-xxxxxxxxxxxxxxxa1b2' },
              { label: 'Edge TTS Key', key: 'tts-••••••••••••••c3d4', full: 'tts-xxxxxxxxxxxxxxxc3d4' },
              { label: '地图服务 Key', key: 'map-••••••••••••••e5f6', full: 'map-xxxxxxxxxxxxxxxe5f6' },
            ].map((item) => (
              <div key={item.label} className="settings-key-row">
                <div className="settings-key-info">
                  <span>{item.label}</span>
                  <code>{item.key}</code>
                </div>
                <button
                  type="button"
                  className="settings-key-copy"
                  onClick={() => copyKey(item.full, item.label)}
                >
                  {copiedKey === item.label ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
            <motion.button type="button" className="settings-add-key" whileTap={{ scale: 0.97 }}>
              + {t('admin.addKey')}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Bell size={15} />
            <span>{t('admin.notifSettings')}</span>
          </div>
          <div className="settings-fields">
            {[
              { labelKey: 'admin.notifNewQuestion', descKey: 'admin.notifNewQuestionDesc', defaultChecked: true },
              { labelKey: 'admin.notifNegativeFeedback', descKey: 'admin.notifNegativeFeedbackDesc', defaultChecked: true },
              { labelKey: 'admin.notifKbExpiry', descKey: 'admin.notifKbExpiryDesc', defaultChecked: true },
              { labelKey: 'admin.notifSystemAlert', descKey: 'admin.notifSystemAlertDesc', defaultChecked: false },
            ].map((item) => (
              <label key={item.labelKey} className="settings-notif-row">
                <div>
                  <strong>{t(item.labelKey)}</strong>
                  <span>{t(item.descKey)}</span>
                </div>
                <input type="checkbox" defaultChecked={item.defaultChecked} />
                <span className="dhconfig-toggle-knob" />
              </label>
            ))}
          </div>
        </div>

        {/* Cache & data */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Database size={15} />
            <span>{t('admin.cacheData')}</span>
          </div>
          <div className="settings-fields">
            <div className="settings-cache-row">
              <div>
                <strong>{t('admin.kbCache')}</strong>
                <span>{t('admin.kbCacheDesc')} · 288 MB</span>
              </div>
              <button type="button" className="settings-cache-btn">
                <RefreshCw size={13} />
                {t('admin.refresh')}
              </button>
            </div>
            <div className="settings-cache-row">
              <div>
                <strong>{t('admin.chatHistory')}</strong>
                <span>{t('admin.chatHistoryDesc')} · 1,247</span>
              </div>
              <div className="settings-cache-actions">
                <button type="button" className="settings-cache-btn">
                  <RefreshCw size={13} />
                  {t('admin.export')}
                </button>
                <button type="button" className="settings-cache-btn danger">
                  <Trash2 size={13} />
                  {t('admin.clear')}
                </button>
              </div>
            </div>
            <div className="settings-cache-row">
              <div>
                <strong>{t('admin.staticCdn')}</strong>
                <span>{t('admin.staticCdnDesc')} · 124 MB</span>
              </div>
              <button type="button" className="settings-cache-btn">
                <RefreshCw size={13} />
                {t('admin.prefetch')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Version info */}
      <div className="settings-card">
        <div className="settings-card-head">
          <Info size={15} />
          <span>{t('admin.versionInfo')}</span>
        </div>
        <div className="settings-version-grid">
          <div className="settings-version-item">
            <span>{t('admin.frontendVersion')}</span>
            <strong>v0.2-beta</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.buildTime')}</span>
            <strong>2026-05-30</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.framework')}</span>
            <strong>React 19 + Vite 8</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.dataVersion')}</span>
            <strong>LS-2025-v1</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.license')}</span>
            <strong>A5 2026</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.deployMethod')}</span>
            <strong>GitHub Pages</strong>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="settings-save-bar">
        <motion.button type="button" className="settings-save-btn" whileTap={{ scale: 0.97 }}>
          <Shield size={15} />
          <span>{t('admin.saveConfig')}</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
