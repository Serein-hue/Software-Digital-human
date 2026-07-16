import { useState } from 'react'
import CommandCenter from '../components/admin/CommandCenter'
import WorkOrderCenter from '../components/admin/WorkOrderCenter'
import { Layout } from '../components/Layout'

const tabs = [
  { id: 'command', label: '指挥调度' },
  { id: 'workorder', label: '工单处理' },
] as const

export default function OperationPage() {
  const [tab, setTab] = useState<string>('command')

  return (
    <Layout currentPage="operation" title="运营中心">
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

      {tab === 'command' && <CommandCenter />}
      {tab === 'workorder' && <WorkOrderCenter />}
    </Layout>
  )
}
