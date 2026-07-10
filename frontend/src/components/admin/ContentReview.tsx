import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, CheckCircle, XCircle, Eye, Clock,
  Search, ChevronDown, MessageCircle, BookOpen, AlertTriangle,
} from 'lucide-react'
import { useT } from '../../i18n'
import { fetchLowConfidenceQueries, type LowConfidenceItem } from '../../api/admin'

type Tab = 'pending' | 'approved' | 'rejected'

interface ReviewDisplay {
  id: string
  question: string
  answer: string
  source: string
  spot: string
  submittedAt: string
  reviewer?: string
  reviewedAt?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
}

const TABS: { key: Tab; i18nKey: string; icon: typeof Clock }[] = [
  { key: 'pending', i18nKey: 'admin.pendingReview', icon: Clock },
  { key: 'approved', i18nKey: 'admin.approved', icon: CheckCircle },
  { key: 'rejected', i18nKey: 'admin.rejected', icon: XCircle },
]

export default function ContentReview() {
  const [tab, setTab] = useState<Tab>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [reviews, setReviews] = useState<ReviewDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const t = useT()

  useEffect(() => {
    fetchLowConfidenceQueries(1, 50).then((data) => {
      if (data?.items) {
        setReviews(data.items.map((item: LowConfidenceItem, i: number) => ({
          id: String(item.id ?? i),
          question: item.userQuestion,
          answer: item.assistantReply,
          source: 'AI 生成',
          spot: '',
          submittedAt: item.createdAt ?? '',
          status: (item.confidence ?? 0) < 0.4 ? 'pending' : 'approved' as 'pending' | 'approved',
          rejectReason: item.fallbackReason ?? undefined,
        })))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = reviews
    .filter((r) => r.status === tab)
    .filter((r) => {
      if (!search) return true
      return r.question.includes(search) || r.answer.includes(search)
    })

  const counts = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  }

  return (
    <motion.div
      className="review-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>{t('admin.contentReview')}</h2>
          <span>{t('admin.reviewDesc')}</span>
        </div>
        <div className="review-head-stats">
          <span className="review-head-stat pending">{t('admin.pendingCount', { n: counts.pending })}</span>
          <span className="review-head-stat approved">{t('admin.approvedCount', { n: counts.approved })}</span>
          <span className="review-head-stat rejected">{t('admin.rejectedCount', { n: counts.rejected })}</span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#62665d' }}>加载中...</div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="kb-toolbar">
            <div className="kb-search-wrap" style={{ maxWidth: 360 }}>
              <Search size={14} />
              <input
                type="text"
                className="kb-search-input"
                placeholder={t('admin.searchQA')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="review-tabs">
            {TABS.map(({ key, i18nKey, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`review-tab ${tab === key ? 'active' : ''}`}
                onClick={() => { setTab(key); setExpandedId(null) }}
              >
                <Icon size={14} />
                <span>{t(i18nKey)}</span>
                <span className="review-tab-count">{counts[key]}</span>
              </button>
            ))}
          </div>

          {/* Review list */}
          <div className="review-list">
            {filtered.length === 0 ? (
              <div className="kb-empty">
                <ShieldCheck size={32} />
                <span>{tab === 'pending' ? t('admin.allReviewed') : t('admin.noData')}</span>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((item) => (
                  <motion.div
                    key={item.id}
                    className={`review-card ${expandedId === item.id ? 'expanded' : ''}`}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <button
                      type="button"
                      className="review-card-header"
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      <div className="review-card-left">
                        <MessageCircle size={15} className="review-q-icon" />
                        <div>
                          <strong>{item.question}</strong>
                          <div className="review-card-meta">
                            <span>{item.spot || '通用'}</span>
                            <span>{item.submittedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="review-card-right">
                        {item.status === 'pending' && <span className="review-badge pending">{t('admin.pendingReview')}</span>}
                        {item.status === 'approved' && <span className="review-badge approved"><CheckCircle size={12} /> {t('admin.approved')}</span>}
                        {item.status === 'rejected' && <span className="review-badge rejected"><XCircle size={12} /> {t('admin.rejected')}</span>}
                        <ChevronDown size={16} className={`review-chevron ${expandedId === item.id ? 'open' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedId === item.id && (
                        <motion.div
                          className="review-card-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="review-answer-box">
                            <div className="review-answer-label">
                              <Eye size={13} />
                              <span>{t('admin.aiAnswer')}</span>
                            </div>
                            <p>{item.answer}</p>
                            <div className="review-source">
                              <BookOpen size={12} />
                              <span>{t('admin.sourceRef')}：{item.source}</span>
                            </div>
                          </div>

                          {item.rejectReason && (
                            <div className="review-reject-box">
                              <AlertTriangle size={13} />
                              <span>{t('admin.rejectReason')}：{item.rejectReason}</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
