import { useState } from 'react'
import SystemSettings from '../components/admin/SystemSettings'
import KnowledgeBase from '../components/admin/KnowledgeBase'
import ContentReview from '../components/admin/ContentReview'
import { Layout } from '../components/Layout'

const tabs = [
  { id: 'settings', label: '系统设置' },
  { id: 'knowledge', label: '知识库管理' },
  { id: 'review', label: '内容审核' },
] as const

export default function AdminPage() {
  const [tab, setTab] = useState<string>('settings')

  return (
    <Layout currentPage="admin" title="后台管理">
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

      {tab === 'settings' && <SystemSettings />}
      {tab === 'knowledge' && <KnowledgeBase />}
      {tab === 'review' && <ContentReview />}
    </Layout>
  )
}
