import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Upload, Search, ChevronRight, Clock, CheckCircle,
  AlertCircle, Layers, Hash, EyeOff, Filter, X,
} from 'lucide-react'

interface DocEntry {
  id: string
  name: string
  source: string
  type: '景点数据' | '游览指南' | '数据集' | '图片' | '规则'
  status: 'ready' | 'processing' | 'error' | 'pending'
  chunks: number
  size: string
  updatedAt: string
  tags: string[]
}

const MOCK_DOCS: DocEntry[] = [
  {
    id: 'doc-1',
    name: '灵山胜境景点结构化数据集',
    source: '示范景区公开资料包',
    type: '景点数据',
    status: 'ready',
    chunks: 86,
    size: '45 KB',
    updatedAt: '2026-05-30',
    tags: ['景点', '结构化', '灵山'],
  },
  {
    id: 'doc-2',
    name: '灵山胜境游览指南',
    source: '示范景区公开资料包',
    type: '游览指南',
    status: 'ready',
    chunks: 134,
    size: '30 KB',
    updatedAt: '2026-05-30',
    tags: ['导游', '路线', '历史'],
  },
  {
    id: 'doc-3',
    name: '景点行为分析数据',
    source: '示范景区公开资料包',
    type: '数据集',
    status: 'ready',
    chunks: 522,
    size: '16.7 MB',
    updatedAt: '2026-05-30',
    tags: ['数据', '分析', '游客行为'],
  },
  {
    id: 'doc-4',
    name: '景区门票与优惠政策',
    source: '景区官网',
    type: '规则',
    status: 'processing',
    chunks: 12,
    size: '8 KB',
    updatedAt: '2026-05-29',
    tags: ['规则', '门票', '政策'],
  },
  {
    id: 'doc-5',
    name: '灵山大佛高清图集',
    source: '景区素材库',
    type: '图片',
    status: 'pending',
    chunks: 0,
    size: '124 MB',
    updatedAt: '—',
    tags: ['图片', '灵山大佛'],
  },
  {
    id: 'doc-6',
    name: '梵宫艺术展品说明',
    source: '景区素材库',
    type: '景点数据',
    status: 'error',
    chunks: 3,
    size: '52 KB',
    updatedAt: '2026-05-28',
    tags: ['艺术', '梵宫', '展品'],
  },
]

const STATUS_ICONS: Record<DocEntry['status'], typeof CheckCircle> = {
  ready: CheckCircle,
  processing: Clock,
  error: AlertCircle,
  pending: EyeOff,
}

const STATUS_COLORS: Record<DocEntry['status'], string> = {
  ready: 'var(--teal)',
  processing: '#e89460',
  error: '#b4522c',
  pending: 'var(--muted)',
}

const STATUS_LABELS: Record<DocEntry['status'], string> = {
  ready: '已入库',
  processing: '解析中',
  error: '失败',
  pending: '待处理',
}

const TYPE_TAGS: DocEntry['type'][] = ['景点数据', '游览指南', '数据集', '图片', '规则']

export default function KnowledgeBase() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DocEntry['type'] | null>(null)
  const [selected, setSelected] = useState<DocEntry | null>(null)

  const filtered = MOCK_DOCS.filter((d) => {
    if (typeFilter && d.type !== typeFilter) return false
    if (search && !d.name.includes(search) && !d.tags.some((t) => t.includes(search))) return false
    return true
  })

  return (
    <motion.div
      className="kb-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>知识库管理</h2>
          <span>文档入库 · 切片解析 · 检索状态</span>
        </div>
        <motion.button
          type="button"
          className="kb-upload-btn"
          whileTap={{ scale: 0.97 }}
        >
          <Upload size={15} />
          <span>上传文档</span>
        </motion.button>
      </div>

      {/* Toolbar */}
      <div className="kb-toolbar">
        <div className="kb-search-wrap">
          <Search size={14} />
          <input
            type="text"
            className="kb-search-input"
            placeholder="搜索文档名称或标签..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="kb-search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="kb-type-filters">
          {TYPE_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              className={`kb-type-chip ${typeFilter === t ? 'active' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Document list */}
      <div className="kb-list">
        {filtered.length === 0 ? (
          <div className="kb-empty">
            <FileText size={32} />
            <span>没有匹配的文档</span>
          </div>
        ) : (
          filtered.map((doc) => {
            const Icon = STATUS_ICONS[doc.status]
            return (
              <motion.div
                key={doc.id}
                className={`kb-doc-card ${selected?.id === doc.id ? 'expanded' : ''}`}
                layout
                onClick={() => setSelected(selected?.id === doc.id ? null : doc)}
              >
                <div className="kb-doc-main">
                  <div className="kb-doc-icon" style={{ background: STATUS_COLORS[doc.status] + '18' }}>
                    <FileText size={18} style={{ color: STATUS_COLORS[doc.status] }} />
                  </div>
                  <div className="kb-doc-body">
                    <div className="kb-doc-top">
                      <strong>{doc.name}</strong>
                      <span className={`kb-status-badge ${doc.status}`}>
                        <Icon size={12} />
                        {STATUS_LABELS[doc.status]}
                      </span>
                    </div>
                    <div className="kb-doc-meta">
                      <span>{doc.source}</span>
                      <span>{doc.size}</span>
                      <span><Layers size={11} /> {doc.chunks} 切片</span>
                      <span>{doc.updatedAt}</span>
                    </div>
                    <div className="kb-doc-tags">
                      <span className="kb-type-badge">{doc.type}</span>
                      {doc.tags.map((tag) => (
                        <span key={tag} className="kb-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`kb-doc-chevron ${selected?.id === doc.id ? 'open' : ''}`}
                  />
                </div>

                <AnimatePresence initial={false}>
                  {selected?.id === doc.id && (
                    <motion.div
                      className="kb-doc-detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                    >
                      <div className="kb-detail-grid">
                        <div className="kb-detail-stat">
                          <Hash size={13} />
                          <div>
                            <strong>{doc.chunks}</strong>
                            <span>文本切片</span>
                          </div>
                        </div>
                        <div className="kb-detail-stat">
                          <Layers size={13} />
                          <div>
                            <strong>{doc.type}</strong>
                            <span>文档类型</span>
                          </div>
                        </div>
                        <div className="kb-detail-stat">
                          <Clock size={13} />
                          <div>
                            <strong>{doc.updatedAt}</strong>
                            <span>最后更新</span>
                          </div>
                        </div>
                      </div>
                      <div className="kb-detail-actions">
                        <button type="button" className="kb-action-btn">
                          重新解析
                        </button>
                        <button type="button" className="kb-action-btn">
                          查看切片
                        </button>
                        <button type="button" className="kb-action-btn danger">
                          删除
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Stats footer */}
      <div className="kb-stats-bar">
        <div><strong>{MOCK_DOCS.length}</strong> 文档</div>
        <div><strong>{MOCK_DOCS.filter((d) => d.status === 'ready').length}</strong> 已入库</div>
        <div><strong>{MOCK_DOCS.reduce((s, d) => s + d.chunks, 0)}</strong> 总切片</div>
        <div><strong>{MOCK_DOCS.reduce((s, d) => {
          const num = parseFloat(d.size)
          return s + (d.size.includes('MB') ? num : num / 1024)
        }, 0).toFixed(1)} MB</strong> 总大小</div>
      </div>
    </motion.div>
  )
}
