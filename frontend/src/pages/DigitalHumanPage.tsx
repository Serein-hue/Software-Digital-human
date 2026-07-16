import { useState } from 'react'
import DigitalHumanConfig from '../components/admin/DigitalHumanConfig'
import DigitalHumanMonitor from '../components/admin/DigitalHumanMonitor'
import { Layout } from '../components/Layout'

const tabs = [
  { id: 'config', label: '形象配置' },
  { id: 'monitor', label: '运行监控' },
] as const

export default function DigitalHumanPage() {
  const [tab, setTab] = useState<string>('config')

  return (
    <Layout currentPage="digital-human" title="数字人管理">
      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'tab-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'config' && <DigitalHumanConfig />}
      {tab === 'monitor' && <DigitalHumanMonitor />}
    </Layout>
  )
}
