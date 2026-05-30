import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Key, Bell, Database, Info, Copy, Check,
  Trash2, RefreshCw, Shield, Globe,
} from 'lucide-react'

export default function SystemSettings() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

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
          <h2>系统设置</h2>
          <span>景区配置 · API · 缓存 · 版本</span>
        </div>
      </div>

      <div className="settings-grid">
        {/* Basic info */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Globe size={15} />
            <span>基本配置</span>
          </div>
          <div className="settings-fields">
            <label className="settings-field">
              <span>景区名称</span>
              <input type="text" value="灵山胜境" readOnly className="settings-input" />
            </label>
            <label className="settings-field">
              <span>景区 ID</span>
              <input type="text" value="lingshan-wuxi-2025" readOnly className="settings-input" />
            </label>
            <label className="settings-field">
              <span>管理员邮箱</span>
              <input type="email" value="admin@lingshan.com" className="settings-input" />
            </label>
            <label className="settings-field">
              <span>客服电话</span>
              <input type="text" value="0510-8568xxxx" className="settings-input" />
            </label>
          </div>
        </div>

        {/* API Keys */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Key size={15} />
            <span>API 密钥</span>
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
              + 添加密钥
            </motion.button>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-head">
            <Bell size={15} />
            <span>通知设置</span>
          </div>
          <div className="settings-fields">
            {[
              { label: '新问题待审核', desc: 'AI 生成答案提交审核时通知', defaultChecked: true },
              { label: '游客负面反馈', desc: '满意度低于 3 分时发送告警', defaultChecked: true },
              { label: '知识库过期提醒', desc: '内容超过 30 天未更新时提醒', defaultChecked: true },
              { label: '系统异常告警', desc: 'API 调用失败或服务降级时通知', defaultChecked: false },
            ].map((item) => (
              <label key={item.label} className="settings-notif-row">
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
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
            <span>缓存与数据</span>
          </div>
          <div className="settings-fields">
            <div className="settings-cache-row">
              <div>
                <strong>知识库缓存</strong>
                <span>向量索引 + 文档切片缓存 · 当前 288 MB</span>
              </div>
              <button type="button" className="settings-cache-btn">
                <RefreshCw size={13} />
                刷新
              </button>
            </div>
            <div className="settings-cache-row">
              <div>
                <strong>对话历史</strong>
                <span>游客问答记录 · 当前 1,247 条</span>
              </div>
              <div className="settings-cache-actions">
                <button type="button" className="settings-cache-btn">
                  <RefreshCw size={13} />
                  导出
                </button>
                <button type="button" className="settings-cache-btn danger">
                  <Trash2 size={13} />
                  清除
                </button>
              </div>
            </div>
            <div className="settings-cache-row">
              <div>
                <strong>静态资源 CDN</strong>
                <span>数字人形象资源 · 当前 124 MB</span>
              </div>
              <button type="button" className="settings-cache-btn">
                <RefreshCw size={13} />
                预加载
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Version info */}
      <div className="settings-card">
        <div className="settings-card-head">
          <Info size={15} />
          <span>版本信息</span>
        </div>
        <div className="settings-version-grid">
          <div className="settings-version-item">
            <span>前端版本</span>
            <strong>v0.2-beta</strong>
          </div>
          <div className="settings-version-item">
            <span>构建时间</span>
            <strong>2026-05-30</strong>
          </div>
          <div className="settings-version-item">
            <span>框架</span>
            <strong>React 19 + Vite 8</strong>
          </div>
          <div className="settings-version-item">
            <span>数据版本</span>
            <strong>LS-2025-v1</strong>
          </div>
          <div className="settings-version-item">
            <span>许可证</span>
            <strong>中国软件杯 2026 A5</strong>
          </div>
          <div className="settings-version-item">
            <span>部署方式</span>
            <strong>GitHub Pages</strong>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="settings-save-bar">
        <motion.button type="button" className="settings-save-btn" whileTap={{ scale: 0.97 }}>
          <Shield size={15} />
          <span>保存配置</span>
        </motion.button>
      </div>
    </motion.div>
  )
}
