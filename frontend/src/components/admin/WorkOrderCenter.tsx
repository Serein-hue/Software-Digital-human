/** 工单中心 — 工单 / 应急求助 / 反馈投诉 三合一管理看板 */

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Siren, MessageSquare, CheckCircle,
  XCircle, Clock, Loader2, ChevronRight, X, SendHorizonal,
  UserCheck, Phone, MapPin, Star, ThumbsDown, ThumbsUp,
  ExternalLink,
} from 'lucide-react'
import {
  fetchWorkOrders,
  fetchEmergencies,
  fetchFeedbacks,
  handleWorkOrder,
  resolveWorkOrder,
  closeWorkOrder,
  dispatchEmergency,
  resolveEmergency,
  type WorkOrder,
  type Emergency,
  type Feedback,
} from '../../api/admin'

// ── Tab 定义 ──────────────────────────────────────────────────────────

type TabKey = 'work-orders' | 'emergencies' | 'feedbacks'

const TABS: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: 'work-orders', label: '工单', icon: ClipboardList },
  { key: 'emergencies', label: '应急求助', icon: Siren },
  { key: 'feedbacks', label: '用户反馈', icon: MessageSquare },
]

// ── Toast ─────────────────────────────────────────────────────────────

let tid = 0
interface Toast { id: string; type: 'success' | 'error'; message: string }
type AddToast = (type: Toast['type'], message: string) => void

// ── 状态色和文案 ─────────────────────────────────────────────────────

const WO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#e89460' },
  processing: { label: '处理中', color: '#15bba0' },
  resolved: { label: '已解决', color: '#155d58' },
  closed: { label: '已关闭', color: '#6b7280' },
}

const EM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待派单', color: '#b4522c' },
  dispatching: { label: '派遣中', color: '#e89460' },
  arrived: { label: '已到达', color: '#15bba0' },
  resolved: { label: '已解决', color: '#155d58' },
}

const CATEGORY_MAP: Record<string, string> = {
  complaint: '投诉', suggestion: '建议', repair: '维修', other: '其他',
  medical: '医疗', lost: '走失', security: '安保', fire: '火警',
}

const STATUS_FILTERS_WO = ['all', 'pending', 'processing', 'resolved', 'closed']
const STATUS_FILTERS_EM = ['all', 'pending', 'dispatching', 'arrived', 'resolved']

// ── 主组件 ────────────────────────────────────────────────────────────

export default function WorkOrderCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>('work-orders')
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `t-${++tid}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3000)
  }, [])

  return (
    <motion.div
      className="kb-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>工单中心</h2>
          <span>工单 · 应急求助 · 用户反馈 — 处理与闭环</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="kb-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`kb-tab ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="kb-tab-content">
        {activeTab === 'work-orders' && <WorkOrdersTab addToast={addToast} />}
        {activeTab === 'emergencies' && <EmergenciesTab addToast={addToast} />}
        {activeTab === 'feedbacks' && <FeedbacksTab />}
      </div>

      {/* Toasts */}
      <div className="kb-toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className={`kb-toast kb-toast-${toast.type}`}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab: 工单
// ═══════════════════════════════════════════════════════════════════════

function WorkOrdersTab({ addToast }: { addToast: AddToast }) {
  const [items, setItems] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback((p: number, s: string) => {
    setLoading(true)
    fetchWorkOrders(p, 20, s === 'all' ? undefined : s).then((data) => {
      if (data) {
        setItems(data.items)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.total_pages)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    queueMicrotask(() => load(page, statusFilter))
  }, [page, statusFilter, load])

  const doAction = async (id: string, action: () => Promise<unknown>, msg: string) => {
    setActionLoading(id)
    try {
      const result = await action()
      if (result) {
        addToast('success', msg)
        load(page, statusFilter)
      } else {
        addToast('error', '操作失败')
      }
    } catch {
      addToast('error', '操作异常')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="kb-type-filters" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS_WO.map((s) => (
          <button
            key={s}
            type="button"
            className={`kb-type-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}
          >
            {s === 'all' ? '全部' : WO_STATUS_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="kb-loading"><Loader2 size={28} className="spin" /><span>加载工单...</span></div>
      ) : items.length === 0 ? (
        <div className="kb-empty-state">
          <ClipboardList size={36} />
          <strong>暂无工单</strong>
          <p>状态筛选条件下没有工单记录</p>
        </div>
      ) : (
        <>
          <div className="wo-list">
            {items.map((item) => {
              const isExpanded = expandedId === item.id
              const sc = WO_STATUS_MAP[item.status] ?? { label: item.status, color: '#6b7280' }
              return (
                <div
                  key={item.id}
                  className={`wo-card ${isExpanded ? 'expanded' : ''}`}
                >
                  <div className="wo-card-main" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <div className="wo-card-left">
                      <span className="wo-category-tag">{CATEGORY_MAP[item.category] ?? item.category}</span>
                      <span className="wo-desc">{item.description.slice(0, 60)}</span>
                    </div>
                    <div className="wo-card-right">
                      <span className="wo-status-badge" style={{ background: sc.color + '18', color: sc.color }}>
                        {sc.label}
                      </span>
                      <ChevronRight size={14} className={`wo-chevron ${isExpanded ? 'open' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="wo-card-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <p className="wo-full-desc">{item.description}</p>
                        <div className="wo-meta-grid">
                          {item.location && <span><MapPin size={12} /> {item.location}</span>}
                          {item.contact && <span><Phone size={12} /> {item.contact}</span>}
                          {item.handler && <span><UserCheck size={12} /> 处理人: {item.handler}</span>}
                          {item.resolution && <span><CheckCircle size={12} /> 解决: {item.resolution}</span>}
                          <span><Clock size={12} /> {item.createdAt}</span>
                        </div>
                        <div className="wo-actions">
                          {item.status === 'pending' && (
                            <button
                              type="button" className="wo-act-btn"
                              onClick={() => doAction(item.id, () => handleWorkOrder(item.id), '已受理工单')}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? <Loader2 size={13} className="spin" /> : <SendHorizonal size={13} />}
                              受理
                            </button>
                          )}
                          {item.status === 'processing' && (
                            <button
                              type="button" className="wo-act-btn primary"
                              onClick={() => doAction(item.id, () => resolveWorkOrder(item.id), '工单已解决')}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
                              解决
                            </button>
                          )}
                          {item.status === 'resolved' && (
                            <button
                              type="button" className="wo-act-btn"
                              onClick={() => doAction(item.id, () => closeWorkOrder(item.id), '工单已关闭')}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? <Loader2 size={13} className="spin" /> : <X size={13} />}
                              关闭
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="kb-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab: 应急求助
// ═══════════════════════════════════════════════════════════════════════

function EmergenciesTab({ addToast }: { addToast: AddToast }) {
  const [items, setItems] = useState<Emergency[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback((p: number, s: string) => {
    setLoading(true)
    fetchEmergencies(p, 20, s === 'all' ? undefined : s).then((data) => {
      if (data) {
        setItems(data.items)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.total_pages)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    queueMicrotask(() => load(page, statusFilter))
  }, [page, statusFilter, load])

  return (
    <div>
      <div className="kb-type-filters" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS_EM.map((s) => (
          <button
            key={s}
            type="button"
            className={`kb-type-chip ${statusFilter === s ? 'active' : ''}`}
            onClick={() => { setStatusFilter(s); setPage(1) }}
          >
            {s === 'all' ? '全部' : EM_STATUS_MAP[s]?.label ?? s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="kb-loading"><Loader2 size={28} className="spin" /><span>加载应急求助...</span></div>
      ) : items.length === 0 ? (
        <div className="kb-empty-state">
          <Siren size={36} />
          <strong>暂无应急求助</strong>
          <p>一切平安</p>
        </div>
      ) : (
        <>
          <div className="wo-list">
            {items.map((item) => {
              const isExpanded = expandedId === item.id
              const sc = EM_STATUS_MAP[item.status] ?? { label: item.status, color: '#6b7280' }
              const isUrgent = item.status === 'pending' || item.status === 'dispatching'
              return (
                <div key={item.id} className={`wo-card em-card ${isUrgent ? 'urgent' : ''} ${isExpanded ? 'expanded' : ''}`}>
                  <div className="wo-card-main" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                    <div className="wo-card-left">
                      <span className="wo-category-tag urgent">{CATEGORY_MAP[item.emergencyType] ?? item.emergencyType}</span>
                      <span className="wo-desc">{item.description.slice(0, 60)}</span>
                    </div>
                    <div className="wo-card-right">
                      <span className="wo-status-badge" style={{ background: sc.color + '18', color: sc.color }}>
                        {sc.label}
                      </span>
                      <ChevronRight size={14} className={`wo-chevron ${isExpanded ? 'open' : ''}`} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="wo-card-detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <p className="wo-full-desc">{item.description}</p>
                        <div className="wo-meta-grid">
                          {item.location && <span><MapPin size={12} /> {item.location}</span>}
                          {item.contact && <span><Phone size={12} /> {item.contact}</span>}
                          {item.dispatcher && <span><UserCheck size={12} /> 处理人: {item.dispatcher}</span>}
                          <span><Clock size={12} /> {item.createdAt}</span>
                        </div>
                        <div className="wo-actions">
                          {item.status === 'pending' && (
                            <button
                              type="button" className="wo-act-btn urgent-btn"
                              onClick={async () => {
                                setActionLoading(item.id)
                                try {
                                  const r = await dispatchEmergency(item.id)
                                  if (r) { addToast('success', '已派单'); load(page, statusFilter) }
                                  else addToast('error', '派单失败')
                                } catch { addToast('error', '派单异常') }
                                finally { setActionLoading(null) }
                              }}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? <Loader2 size={13} className="spin" /> : <SendHorizonal size={13} />}
                              派单处理
                            </button>
                          )}
                          {(item.status === 'dispatching' || item.status === 'arrived') && (
                            <button
                              type="button" className="wo-act-btn primary"
                              onClick={async () => {
                                setActionLoading(item.id)
                                try {
                                  const r = await resolveEmergency(item.id)
                                  if (r) { addToast('success', '已标记解决'); load(page, statusFilter) }
                                  else addToast('error', '操作失败')
                                } catch { addToast('error', '操作异常') }
                                finally { setActionLoading(null) }
                              }}
                              disabled={actionLoading === item.id}
                            >
                              {actionLoading === item.id ? <Loader2 size={13} className="spin" /> : <CheckCircle size={13} />}
                              标记已解决
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="kb-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab: 用户反馈
// ═══════════════════════════════════════════════════════════════════════

function FeedbacksTab() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filterLow, setFilterLow] = useState(false)

  const load = useCallback((p: number, lowOnly: boolean) => {
    setLoading(true)
    fetchFeedbacks(p, 20, lowOnly ? 3 : undefined).then((data) => {
      if (data) {
        setItems(data.items)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.total_pages)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    queueMicrotask(() => load(page, filterLow))
  }, [page, filterLow, load])

  return (
    <div>
      <div className="kb-section-head">
        <span className="kb-hint">
          满意度评分 1-5 星 · {filterLow ? '只看差评 (≤3星)' : '全部'}
        </span>
        <label className="wo-low-toggle">
          <input type="checkbox" checked={filterLow} onChange={(e) => { setFilterLow(e.target.checked); setPage(1) }} />
          <span>仅低分</span>
        </label>
      </div>

      {loading ? (
        <div className="kb-loading"><Loader2 size={28} className="spin" /><span>加载反馈...</span></div>
      ) : items.length === 0 ? (
        <div className="kb-empty-state">
          <MessageSquare size={36} />
          <strong>暂无反馈</strong>
          {filterLow ? <p>没有低分反馈</p> : <p>还没有用户提交反馈</p>}
        </div>
      ) : (
        <>
          <div className="wo-list">
            {items.map((item) => (
              <div key={item.id} className="wo-card fb-card">
                <div className="wo-card-main">
                  <div className="wo-card-left">
                    <div className="fb-stars">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          fill={i < (item.rating ?? 0) ? '#c1a15a' : 'none'}
                          color={i < (item.rating ?? 0) ? '#c1a15a' : '#d9d2c1'}
                        />
                      ))}
                      <span className="fb-rating-num">{item.rating ?? '-'}</span>
                    </div>
                    {item.comment && <span className="wo-desc">{item.comment.slice(0, 80)}</span>}
                  </div>
                  <div className="wo-card-right">
                    {item.resolved ? (
                      <span className="wo-status-badge" style={{ background: 'rgba(21,93,88,0.1)', color: '#155d58' }}>
                        <ThumbsUp size={11} /> 已解决
                      </span>
                    ) : (
                      <span className="wo-status-badge" style={{ background: 'rgba(232,148,96,0.12)', color: '#e89460' }}>
                        <ThumbsDown size={11} /> 未解决
                      </span>
                    )}
                  </div>
                </div>
                <div className="wo-meta-grid" style={{ padding: '4px 16px 12px' }}>
                  {item.sessionId && <span><ExternalLink size={11} /> Session: {item.sessionId}</span>}
                  <span><Clock size={11} /> {item.createdAt}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="kb-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
