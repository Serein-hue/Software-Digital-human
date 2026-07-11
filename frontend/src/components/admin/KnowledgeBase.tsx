/** 知识库工坊 — 上传资料→审核沉淀→问答质检→内容更新闭环 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Search, CheckCircle, XCircle, AlertCircle,
  Clock, Database, Layers, Hash, BookOpen, Zap, RefreshCw,
  Plus, Loader2, Award, BarChart3, ChevronRight,
  X, AlertTriangle, MessageSquare, CheckCheck, FileUp, Play,
} from 'lucide-react'
import {
  fetchKbStatus,
  fetchSources,
  fetchQAList,
  fetchLowConfidenceQueries,
  uploadDocument,
  registerQA,
  testQuery,
  answerQuery,
  answerAndBroadcast,
  triggerReindex,
  type KbStatus,
  type SourceItem,
  type QAItem,
  type LowConfidenceItem,
  type TestQueryResult,
  type AnswerResult,
} from '../../api/admin'

// ── Tab 定义 ──────────────────────────────────────────────────────────

type TabKey = 'documents' | 'candidates' | 'qa' | 'sources' | 'test' | 'rebuild'

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: 'documents', label: '文档管理', icon: FileText },
  { key: 'candidates', label: '知识候选', icon: Award },
  { key: 'qa', label: '问答管理', icon: MessageSquare },
  { key: 'sources', label: '来源管理', icon: Database },
  { key: 'test', label: '问答质检', icon: BarChart3 },
  { key: 'rebuild', label: '内容更新', icon: Zap },
]

// ── Toast 反馈 ────────────────────────────────────────────────────────

interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type AddToast = (type: Toast['type'], message: string) => void

let toastId = 0

// ── 主组件 ────────────────────────────────────────────────────────────

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<TabKey>('documents')
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${++toastId}`
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <motion.div
      className="kb-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="dashboard-head">
        <div>
          <h2>知识库工坊</h2>
          <span>上传资料 → 审核沉淀 → 问答质检 → 内容更新</span>
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

      {/* Content */}
      <div className="kb-tab-content">
        {activeTab === 'documents' && <DocumentsTab addToast={addToast} />}
        {activeTab === 'candidates' && <CandidatesTab addToast={addToast} />}
        {activeTab === 'qa' && <QATab addToast={addToast} />}
        {activeTab === 'sources' && <SourcesTab />}
        {activeTab === 'test' && <TestQueryTab addToast={addToast} />}
        {activeTab === 'rebuild' && <RebuildTab addToast={addToast} />}
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
              {toast.type === 'success' && <CheckCircle size={16} />}
              {toast.type === 'error' && <XCircle size={16} />}
              {toast.type === 'info' && <AlertCircle size={16} />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 1: 文档管理
// ═══════════════════════════════════════════════════════════════════════

function DocumentsTab({ addToast }: { addToast: AddToast }) {
  const [status, setStatus] = useState<KbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [domain, setDomain] = useState('general')

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      fetchKbStatus().then((data) => {
        setStatus(data)
        setLoading(false)
      })
    })
  }, [])

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      addToast('error', '请选择文件')
      return
    }
    setUploading(true)
    try {
      const result = await uploadDocument(file, sourceName || file.name, domain)
      if (result?.success) {
        addToast('success', `入库成功: ${result.chunks} 个切片`)
        setShowUpload(false)
        setFileName('')
        setSourceName('')
        // Refresh status
        const newStatus = await fetchKbStatus()
        if (newStatus) setStatus(newStatus)
      } else {
        addToast('error', result?.message || '入库失败')
      }
    } catch {
      addToast('error', '上传失败，请检查知识服务')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="kb-loading">
        <Loader2 size={28} className="spin" />
        <span>加载知识库状态...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Status bar */}
      <div className="kb-metrics">
        <div className="kb-metric-card">
          <Database size={18} />
          <div>
            <strong>{status?.vectors ?? 0}</strong>
            <span>知识片段</span>
          </div>
        </div>
        <div className="kb-metric-card">
          <Layers size={18} />
          <div>
            <strong>{status?.sourcesCount ?? 0}</strong>
            <span>来源</span>
          </div>
        </div>
        <div className="kb-metric-card">
          <Hash size={18} />
          <div>
            <strong>{status?.qaCount ?? 0}</strong>
            <span>问答对</span>
          </div>
        </div>
        <div className="kb-metric-card">
          <BarChart3 size={18} />
          <div>
            <strong>{(status?.scoreThreshold ?? 0) * 100}%</strong>
            <span>置信阈值</span>
          </div>
        </div>
      </div>

      {/* Upload button */}
      <div className="kb-section-head">
        <h3>已入库文档</h3>
        <button type="button" className="kb-btn kb-btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={14} />
          <span>上传文档</span>
        </button>
      </div>

      {/* Sources list would go here - for now show the status */}
      <div className="kb-empty-state">
        <FileText size={36} />
        <strong>知识库状态</strong>
        <p>
          知识服务: {status?.provider ?? '-'} · 片段长度: {status?.chunkSize ?? '-'}
        </p>
        <p>
          状态: {status?.status === 'unreachable' ? '服务不可达' : '运行中'}
        </p>
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            className="kb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !uploading && setShowUpload(false)}
          >
            <motion.div
              className="kb-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kb-modal-head">
                <h3>上传文档</h3>
                <button type="button" className="kb-modal-close" onClick={() => !uploading && setShowUpload(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="kb-modal-body">
                <label className="kb-field">
                  <span>文件 (.md/.txt/.docx/.pdf)</span>
                  <input
                    type="file"
                    ref={fileRef}
                    accept=".md,.txt,.docx,.pdf"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
                    disabled={uploading}
                  />
                </label>
                {fileName && (
                  <label className="kb-field">
                    <span>来源名称（可选）</span>
                    <input
                      type="text"
                      value={sourceName}
                      onChange={(e) => setSourceName(e.target.value)}
                      placeholder={fileName}
                      disabled={uploading}
                    />
                  </label>
                )}
                <label className="kb-field">
                  <span>领域分类</span>
                  <select value={domain} onChange={(e) => setDomain(e.target.value)} disabled={uploading}>
                    <option value="general">通用</option>
                    <option value="spot">景点</option>
                    <option value="route">路线</option>
                    <option value="ticket">票务</option>
                    <option value="service">服务设施</option>
                    <option value="rule">规则</option>
                  </select>
                </label>
              </div>
              <div className="kb-modal-foot">
                <button
                  type="button"
                  className="kb-btn"
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="kb-btn kb-btn-primary"
                  onClick={handleUpload}
                  disabled={uploading || !fileName}
                >
                  {uploading ? (
                    <><Loader2 size={14} className="spin" /> 解析入库中...</>
                  ) : (
                    <><FileUp size={14} /> 开始上传</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 2: 知识候选
// ═══════════════════════════════════════════════════════════════════════

function CandidatesTab({ addToast }: { addToast: AddToast }) {
  const [items, setItems] = useState<LowConfidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adoptTarget, setAdoptTarget] = useState<LowConfidenceItem | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [adopting, setAdopting] = useState(false)

  useEffect(() => {
    fetchLowConfidenceQueries().then((data) => {
      setItems(data?.items ?? [])
      setLoading(false)
    })
  }, [])

  const handleAdopt = async () => {
    if (!adoptTarget) return
    setAdopting(true)
    try {
      const result = await registerQA(editQuestion, editAnswer, 'low_confidence_adopt')
      if (result) {
        addToast('success', '已采纳为问答对')
        setItems((prev) => prev.filter((x) => x.id !== adoptTarget.id))
        setAdoptTarget(null)
      } else {
        addToast('error', '采纳失败')
      }
    } catch {
      addToast('error', '采纳失败，请检查知识服务')
    } finally {
      setAdopting(false)
    }
  }

  if (loading) {
    return (
      <div className="kb-loading">
        <Loader2 size={28} className="spin" />
        <span>加载知识候选...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="kb-empty-state">
        <Award size={40} />
        <strong>暂无知识候选</strong>
        <p>当游客问题缺少可靠答案时，会出现在这里供您审核采纳</p>
      </div>
    )
  }

  return (
    <div>
      <div className="kb-section-head">
        <h3>低置信问答（{items.length}）</h3>
        <span className="kb-hint">以下问题的 AI 回答置信度较低，建议审核后采纳为知识库</span>
      </div>

      <div className="kb-candidate-list">
        {items.map((item) => (
          <div key={item.id} className="kb-candidate-card">
            <div className="kb-candidate-q">
              <span className="kb-label">游客提问</span>
              <p>{item.userQuestion || '(无关联问题)'}</p>
            </div>
            <div className="kb-candidate-a">
              <span className="kb-label">AI 回答</span>
              <p>{item.assistantReply}</p>
            </div>
            <div className="kb-candidate-meta">
              <span className={`kb-confidence ${(item.confidence ?? 1) < 0.4 ? 'low' : 'medium'}`}>
                置信度: {(item.confidence ?? 0).toFixed(2)}
              </span>
              {item.fallbackReason && <span className="kb-fallback-reason">待完善原因: {item.fallbackReason}</span>}
              <span className="kb-date">{item.createdAt}</span>
            </div>
            <button
              type="button"
              className="kb-candidate-adopt"
              onClick={() => {
                setAdoptTarget(item)
                setEditQuestion(item.userQuestion || '')
                setEditAnswer(item.assistantReply)
              }}
            >
              <CheckCheck size={14} />
              采纳为问答
            </button>
          </div>
        ))}
      </div>

      {/* Adopt Modal */}
      <AnimatePresence>
        {adoptTarget && (
          <motion.div
            className="kb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !adopting && setAdoptTarget(null)}
          >
            <motion.div
              className="kb-modal kb-modal-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kb-modal-head">
                <h3>采纳为问答对</h3>
                <button type="button" className="kb-modal-close" onClick={() => !adopting && setAdoptTarget(null)}>
                  <X size={16} />
                </button>
              </div>
              <div className="kb-modal-body">
                <label className="kb-field">
                  <span>问题</span>
                  <textarea
                    rows={2}
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    disabled={adopting}
                  />
                </label>
                <label className="kb-field">
                  <span>答案</span>
                  <textarea
                    rows={4}
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    disabled={adopting}
                  />
                </label>
              </div>
              <div className="kb-modal-foot">
                <button type="button" className="kb-btn" onClick={() => setAdoptTarget(null)} disabled={adopting}>
                  取消
                </button>
                <button
                  type="button"
                  className="kb-btn kb-btn-primary"
                  onClick={handleAdopt}
                  disabled={adopting || !editQuestion.trim() || !editAnswer.trim()}
                >
                  {adopting ? <><Loader2 size={14} className="spin" /> 提交中...</> : <><CheckCheck size={14} /> 确认采纳</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 3: 问答管理
// ═══════════════════════════════════════════════════════════════════════

function QATab({ addToast }: { addToast: AddToast }) {
  const [items, setItems] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const [newSource, setNewSource] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const load = useCallback((p: number) => {
    setLoading(true)
    fetchQAList(p).then((data) => {
      if (data) {
        setItems(data.items)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.total_pages)
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    queueMicrotask(() => load(page))
  }, [page, load])

  const handleCreate = async () => {
    if (!newQ.trim() || !newA.trim()) return
    setCreating(true)
    try {
      const result = await registerQA(newQ, newA, newSource || 'manual')
      if (result) {
        addToast('success', '问答对已创建')
        setShowCreate(false)
        setNewQ('')
        setNewA('')
        setNewSource('')
        load(1)
      } else {
        addToast('error', '创建失败')
      }
    } catch {
      addToast('error', '创建失败，请检查知识服务')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="kb-section-head">
        <h3>问答对（{total}）</h3>
        <button type="button" className="kb-btn kb-btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          <span>新增问答</span>
        </button>
      </div>

      {loading ? (
        <div className="kb-loading"><Loader2 size={28} className="spin" /><span>加载问答对...</span></div>
      ) : items.length === 0 ? (
        <div className="kb-empty-state">
          <MessageSquare size={36} />
          <strong>暂无问答对</strong>
          <p>采纳知识候选或手动添加问答对</p>
        </div>
      ) : (
        <>
          <div className="kb-qa-list">
            {items.map((item, idx) => {
              const isExpanded = expandedId === idx
              return (
                <div
                  key={idx}
                  className={`kb-qa-card ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setExpandedId(isExpanded ? null : idx)}
                >
                  <div className="kb-qa-q">
                    <span className="kb-label">Q</span>
                    <p>{item.question}</p>
                    <ChevronRight size={14} className={`kb-chevron ${isExpanded ? 'open' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="kb-qa-a"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div className="kb-label">A</div>
                        <p>{item.answer}</p>
                        <div className="kb-qa-meta">
                          <span>来源: {item.source || '-'}</span>
                          <span>领域: {item.domain || '-'}</span>
                          <span>{item.createdAt}</span>
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
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            className="kb-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !creating && setShowCreate(false)}
          >
            <motion.div
              className="kb-modal kb-modal-lg"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="kb-modal-head">
                <h3>新增问答对</h3>
                <button type="button" className="kb-modal-close" onClick={() => !creating && setShowCreate(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="kb-modal-body">
                <label className="kb-field">
                  <span>问题 *</span>
                  <input
                    type="text"
                    value={newQ}
                    onChange={(e) => setNewQ(e.target.value)}
                    placeholder="输入常见游客问题"
                    disabled={creating}
                  />
                </label>
                <label className="kb-field">
                  <span>答案 *</span>
                  <textarea
                    rows={4}
                    value={newA}
                    onChange={(e) => setNewA(e.target.value)}
                    placeholder="输入标准答案"
                    disabled={creating}
                  />
                </label>
                <label className="kb-field">
                  <span>来源（可选）</span>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="manual"
                    disabled={creating}
                  />
                </label>
              </div>
              <div className="kb-modal-foot">
                <button type="button" className="kb-btn" onClick={() => setShowCreate(false)} disabled={creating}>
                  取消
                </button>
                <button
                  type="button"
                  className="kb-btn kb-btn-primary"
                  onClick={handleCreate}
                  disabled={creating || !newQ.trim() || !newA.trim()}
                >
                  {creating ? <><Loader2 size={14} className="spin" /> 创建中...</> : <><Plus size={14} /> 创建</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 4: 来源管理
// ═══════════════════════════════════════════════════════════════════════

function SourcesTab() {
  const [items, setItems] = useState<SourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      fetchSources(page).then((data) => {
        if (data) {
          setItems(data.items)
          setTotal(data.pagination.total)
          setTotalPages(data.pagination.total_pages)
        }
        setLoading(false)
      })
    })
  }, [page])

  if (loading) {
    return <div className="kb-loading"><Loader2 size={28} className="spin" /><span>加载来源...</span></div>
  }

  if (items.length === 0) {
    return (
      <div className="kb-empty-state">
        <Database size={36} />
        <strong>暂无资料来源</strong>
        <p>上传文档后将自动登记来源</p>
      </div>
    )
  }

  return (
    <div>
      <div className="kb-section-head">
        <h3>资料来源（{total}）</h3>
      </div>
      <div className="kb-source-list">
        {items.map((item, idx) => (
          <div key={idx} className="kb-source-card">
            <div className="kb-source-icon"><FileText size={18} /></div>
            <div className="kb-source-body">
              <strong>{item.name}</strong>
              <span className="kb-source-path">{item.filepath}</span>
              <div className="kb-source-meta">
                <span className="kb-domain-tag">{item.domain || 'general'}</span>
                {item.tags?.map((tag) => <span key={tag} className="kb-tag">{tag}</span>)}
              </div>
              {item.description && <p>{item.description}</p>}
              <span className="kb-date">{item.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="kb-pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
          <span>{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>下一页</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 5: 问答质检
// ═══════════════════════════════════════════════════════════════════════

function TestQueryTab({ addToast }: { addToast: AddToast }) {
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [result, setResult] = useState<TestQueryResult | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'retrieval' | 'qa'>('retrieval')

  const serviceErrorText = (hasDetail: boolean) => {
    if (!hasDetail) return '知识服务暂未返回可用结果'
    return '知识生成服务异常，请稍后重试或联系运维处理'
  }

  const fallbackText = () => '当前问题缺少可靠知识依据，建议补充资料或采纳为标准问答'

  const handleTest = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setAnswerResult(null)
    try {
      if (mode === 'retrieval') {
        const data = await testQuery(query, topK)
        if (data) setResult(data)
        else setError('查询失败，知识服务不可用')
      } else {
        const data = await answerQuery(query, topK)
        if (data) {
          setAnswerResult(data)
          if (data.llmError) setError(serviceErrorText(Boolean(data.llmError)))
        } else setError('问答失败，知识服务不可用')
      }
    } catch {
      setError('查询失败')
    } finally {
      setLoading(false)
    }
  }

  const aiAnswer = answerResult?.answer

  return (
    <div>
      <div className="kb-section-head">
        <h3>{mode === 'retrieval' ? '命中验证' : '问答预览'}</h3>
        <div className="kb-type-filters">
          <button type="button" className={`kb-type-chip ${mode === 'retrieval' ? 'active' : ''}`} onClick={() => { setMode('retrieval'); setResult(null); setAnswerResult(null); setError('') }}>
            命中验证
          </button>
          <button type="button" className={`kb-type-chip ${mode === 'qa' ? 'active' : ''}`} onClick={() => { setMode('qa'); setResult(null); setAnswerResult(null); setError('') }}>
            问答预览
          </button>
        </div>
      </div>

      <div className="kb-test-bar">
        <div className="kb-test-input-wrap">
          <Search size={15} />
          <input
            type="text"
            className="kb-test-input"
            placeholder="输入测试问题，如：灵山大佛有多高？"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
            disabled={loading}
          />
        </div>
        <div className="kb-test-options">
          <label>
            <span>依据数量:</span>
            <select value={topK} onChange={(e) => setTopK(Number(e.target.value))} disabled={loading}>
              {[3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button
            type="button"
            className="kb-btn kb-btn-primary"
            onClick={handleTest}
            disabled={loading || !query.trim()}
          >
            {loading ? <><Loader2 size={14} className="spin" /> 查询中...</> : <><Search size={14} /> {mode === 'retrieval' ? '验证' : '提问'}</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="kb-test-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* AI 问答模式：显示回答 */}
      {aiAnswer && (
        <div className="kb-test-result" style={{ marginBottom: 16 }}>
          <div className="kb-test-result-head">
            <div className={`kb-answerable-badge ${answerResult?.answerable ? 'ok' : 'no'}`}>
              {answerResult?.answerable ? '已回答' : '需完善'}
            </div>
            <span>回答长度: {answerResult?.tokens ?? 0}</span>
            <span>延迟: {answerResult?.latencyMs ?? 0}ms</span>
          </div>
          <div className="kb-ai-answer">
            <p>{aiAnswer}</p>
          </div>
          <div className="kb-ai-actions">
            <button
              type="button"
              className="kb-ai-broadcast-btn"
              onClick={async () => {
                setLoading(true)
                try {
                  const r = await answerAndBroadcast(query, topK)
                  if (r?.broadcastStatus === 'sent') {
                    addToast('success', '已发送至数字人播报队列')
                  } else if (r?.broadcastStatus === 'fay_offline') {
                    addToast('info', '数字人播报服务未连接，回答已生成但未播报')
                  } else {
                    addToast('error', r?.broadcastMessage || '播报失败')
                  }
                } catch {
                  addToast('error', '播报异常')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
              <span>{loading ? '播报中...' : '问答并播报'}</span>
            </button>
          </div>
          {answerResult?.tokens && answerResult.tokens > 0 && (
            <div className="kb-test-contexts" style={{ marginTop: 12 }}>
              <h4>内容依据（{answerResult?.contexts?.length ?? 0}）</h4>
              {answerResult?.contexts?.map((ctx, idx) => (
                <div key={idx} className="kb-context-item">
                  <div className="kb-context-score">
                    <div className="kb-score-bar" style={{ width: `${(ctx.score * 100).toFixed(0)}%` }} />
                    <span>{(ctx.score * 100).toFixed(1)}%</span>
                  </div>
                  <p>{ctx.text}</p>
                  <div className="kb-context-meta">
                    <span>来源: {ctx.source || '-'}</span>
                    <span>领域: {ctx.domain || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 命中验证模式：原有结果展示 */}
      {result && !aiAnswer && (
        <div className="kb-test-result">
          <div className="kb-test-result-head">
            <div className={`kb-answerable-badge ${result.answerable ? 'ok' : 'no'}`}>
              {result.answerable ? '可回答' : '需完善'}
            </div>
            <span>匹配度: {(result.score * 100).toFixed(1)}%</span>
            <span>延迟: {result.latencyMs}ms</span>
          </div>

          {result.fallback && (
            <div className="kb-test-fallback">
              <AlertTriangle size={14} />
              <span>需人工完善: {fallbackText()}</span>
            </div>
          )}

          {result.contexts.length > 0 && (
            <div className="kb-test-contexts">
              <h4>命中依据（{result.contexts.length}）</h4>
              {result.contexts.map((ctx, idx) => (
                <div key={idx} className="kb-context-item">
                  <div className="kb-context-score">
                    <div className="kb-score-bar" style={{ width: `${(ctx.score * 100).toFixed(0)}%` }} />
                    <span>{(ctx.score * 100).toFixed(1)}%</span>
                  </div>
                  <p>{ctx.text}</p>
                  <div className="kb-context-meta">
                    <span>来源: {ctx.source || '-'}</span>
                    <span>领域: {ctx.domain || '-'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.citations.length > 0 && (
            <div className="kb-test-citations">
              <h4>引用来源（{result.citations.length}）</h4>
              {result.citations.map((cit, idx) => (
                <div key={idx} className="kb-citation-item">
                  <BookOpen size={12} />
                  <span>{typeof cit === 'string' ? cit : JSON.stringify(cit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Tab 6: 内容更新
// ═══════════════════════════════════════════════════════════════════════

function RebuildTab({ addToast }: { addToast: AddToast }) {
  const [confirming, setConfirming] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [status, setStatus] = useState<KbStatus | null>(null)

  useEffect(() => {
    fetchKbStatus().then(setStatus)
  }, [])

  const handleRebuild = async () => {
    setRebuilding(true)
    try {
      const result = await triggerReindex()
      if (result) {
        addToast('info', result.message || '重建任务已提交')
        setConfirming(false)
        // Refresh status
        const newStatus = await fetchKbStatus()
        if (newStatus) setStatus(newStatus)
      } else {
        addToast('error', '更新失败，知识服务不可用')
      }
    } catch {
      addToast('error', '更新失败')
    } finally {
      setRebuilding(false)
    }
  }

  return (
    <div>
      <div className="kb-section-head">
        <h3>内容更新</h3>
        <span className="kb-hint">重新生成问答检索内容，适用于资料批量调整后刷新服务</span>
      </div>

      <div className="kb-rebuild-panel">
        <div className="kb-rebuild-info">
          <div className="kb-rebuild-stat">
            <Database size={20} />
            <div>
              <span>当前知识片段</span>
              <strong>{status?.vectors ?? '-'}</strong>
            </div>
          </div>
          <div className="kb-rebuild-stat">
            <Layers size={20} />
            <div>
              <span>服务状态</span>
              <strong>{status?.status === 'unreachable' ? '不可用' : '运行中'}</strong>
            </div>
          </div>
          <div className="kb-rebuild-stat">
            <Clock size={20} />
            <div>
              <span>片段长度</span>
              <strong>{status?.chunkSize || '-'}</strong>
            </div>
          </div>
        </div>

        {!confirming ? (
          <button
            type="button"
            className="kb-btn kb-btn-danger"
            onClick={() => setConfirming(true)}
          >
            <Zap size={14} />
            <span>更新知识内容</span>
          </button>
        ) : (
          <div className="kb-rebuild-confirm">
            <AlertTriangle size={18} />
            <strong>确认更新知识内容？</strong>
            <p>此操作会刷新当前问答检索内容。已有问答对数据不受影响，资料更新完成前可能短暂不可检索。</p>
            <div className="kb-rebuild-actions">
              <button type="button" className="kb-btn" onClick={() => setConfirming(false)} disabled={rebuilding}>
                取消
              </button>
              <button
                type="button"
                className="kb-btn kb-btn-danger"
                onClick={handleRebuild}
                disabled={rebuilding}
              >
                {rebuilding ? <><Loader2 size={14} className="spin" /> 更新中...</> : <><RefreshCw size={14} /> 确认更新</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
