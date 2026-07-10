import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Key, Bell, Database, Info, Copy, Check,
  Trash2, RefreshCw, Shield, Globe, Save, Loader2,
  CheckCircle, XCircle,
} from 'lucide-react'
import { useT } from '../../i18n'
import { fetchConfigs, updateConfig, type ConfigItem } from '../../api/admin'

interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

let toastId = 0

export default function SystemSettings() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [configs, setConfigs] = useState<ConfigItem[]>([])
  const [edited, setEdited] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const t = useT()

  const addToast: (type: Toast['type'], message: string) => void = useCallback((type, message) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }, [])

  useEffect(() => {
    fetchConfigs().then((items) => {
      if (items) {
        setConfigs(items)
        const map: Record<string, string> = {}
        items.forEach((item) => { map[item.key] = item.value })
        setEdited(map)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleChange = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }))
  }

  const dirtyCount = configs.filter((c) => edited[c.key] !== c.value).length

  const handleSave = async () => {
    setSaving(true)
    let success = 0
    let fail = 0
    for (const config of configs) {
      const newVal = edited[config.key]
      if (newVal !== config.value) {
        const result = await updateConfig(config.key, newVal)
        if (result) success++
        else fail++
      }
    }
    // 刷新已保存的值
    const fresh = await fetchConfigs()
    if (fresh) {
      setConfigs(fresh)
      const map: Record<string, string> = {}
      fresh.forEach((item) => { map[item.key] = item.value })
      setEdited(map)
    }
    setSaving(false)
    if (fail === 0) {
      addToast('success', `已保存 ${success} 项配置`)
    } else {
      addToast('error', `成功 ${success} 项，失败 ${fail} 项`)
    }
  }

  const copyKey = (key: string, label: string) => {
    navigator.clipboard.writeText(key).catch(() => {})
    setCopiedKey(label)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  /** 按前缀分组显示 */
  const basicConfigs = configs.filter((c) => ['app_name', 'app_language', 'refresh_interval_seconds'].includes(c.key))
  const ragConfigs = configs.filter((c) => ['rag_score_threshold', 'rag_top_k_default'].includes(c.key))
  const dhConfigs = configs.filter((c) => ['digital_human_default_avatar', 'digital_human_default_voice'].includes(c.key))
  const apiConfigs = configs.filter((c) => ['business_api_base', 'rag_api_base'].includes(c.key))

  if (loading) {
    return (
      <div className="page-loading"><span>加载配置...</span></div>
    )
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {dirtyCount > 0 && (
            <span style={{ fontSize: 12, color: 'var(--rust)' }}>
              有 {dirtyCount} 项未保存
            </span>
          )}
        </div>
      </div>

      {/* Toast 通知 */}
      <div className="settings-toast-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`settings-toast ${t.type}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {t.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="settings-grid">
        {/* 基础配置 */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Globe size={15} />
            <span>{t('admin.basicConfig')}</span>
          </div>
          <div className="settings-fields">
            {basicConfigs.map((cfg) => (
              <label key={cfg.key} className="settings-field">
                <span>{cfg.description}</span>
                <input
                  type="text"
                  value={edited[cfg.key] ?? ''}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  className={`settings-input ${edited[cfg.key] !== cfg.value ? 'settings-input-dirty' : ''}`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* RAG 检索配置 */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Database size={15} />
            <span>RAG 检索配置</span>
          </div>
          <div className="settings-fields">
            {ragConfigs.map((cfg) => (
              <label key={cfg.key} className="settings-field">
                <span>{cfg.description}</span>
                <input
                  type="text"
                  value={edited[cfg.key] ?? ''}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  className={`settings-input ${edited[cfg.key] !== cfg.value ? 'settings-input-dirty' : ''}`}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* 数字人配置 */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Info size={15} />
            <span>数字人默认配置</span>
          </div>
          <div className="settings-fields">
            {dhConfigs.map((cfg) => (
              <label key={cfg.key} className="settings-field">
                <span>{cfg.description}</span>
                <input
                  type="text"
                  value={edited[cfg.key] ?? ''}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  className={`settings-input ${edited[cfg.key] !== cfg.value ? 'settings-input-dirty' : ''}`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* API 地址 */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Key size={15} />
            <span>API 服务地址</span>
          </div>
          <div className="settings-fields">
            {apiConfigs.map((cfg) => (
              <label key={cfg.key} className="settings-field">
                <span>{cfg.description}</span>
                <input
                  type="text"
                  value={edited[cfg.key] ?? ''}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  className={`settings-input ${edited[cfg.key] !== cfg.value ? 'settings-input-dirty' : ''}`}
                />
              </label>
            ))}
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
            <span>系统名称</span>
            <strong>{edited.app_name ?? '灵山胜境·AI数字人导览'}</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.frontendVersion')}</span>
            <strong>v1.0</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.buildTime')}</span>
            <strong>2026-06-30</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.framework')}</span>
            <strong>React 19 + Vite 8</strong>
          </div>
          <div className="settings-version-item">
            <span>{t('admin.deployMethod')}</span>
            <strong>本地部署</strong>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="settings-save-bar">
        <motion.button
          type="button"
          className="settings-save-btn"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving || dirtyCount === 0}
          style={{ opacity: saving || dirtyCount === 0 ? 0.6 : 1 }}
        >
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
          <span>{saving ? '保存中...' : t('admin.saveConfig')}</span>
        </motion.button>
      </div>

      <style>{`
        .settings-input-dirty {
          border-color: var(--rust) !important;
          background: rgba(228, 148, 96, 0.05) !important;
        }
        .settings-toast-container {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .settings-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 200px;
        }
        .settings-toast.success {
          background: var(--teal);
          color: #fff;
        }
        .settings-toast.error {
          background: #c0392b;
          color: #fff;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}
