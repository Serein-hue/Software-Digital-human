import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, CheckCircle, XCircle, Edit3, Eye, Clock,
  Search, ChevronDown, MessageCircle, BookOpen, AlertTriangle,
} from 'lucide-react'
import { useT } from '../../i18n'

interface ReviewItem {
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

const MOCK_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    question: '灵山大佛有多高？用了多少铜？',
    answer: '灵山大佛通高88米（佛体79米+莲花瓣9米），含台基总高101.5米，总用铜量达725吨。佛体由1560块6-8毫米厚的铜壁板构成，焊缝总长度逾35公里。右手施无畏印除却众生痛苦，左手施与愿印赐予众生欢乐。',
    source: '灵山胜境景点结构化数据集 · LS-001',
    spot: '灵山大佛',
    submittedAt: '2026-05-30 14:22',
    status: 'pending',
  },
  {
    id: 'rev-2',
    question: '灵山梵宫里面有什么好看的？',
    answer: '灵山梵宫汇集东阳木雕、琉璃、油画、景泰蓝等传统工艺。中庭28米高星空穹顶用100公斤纯金绘制，148尊飞天姿态各异。核心琉璃巨制《华藏世界》宽8米高10米，由160块彩色琉璃拼接而成，是目前世界最大的琉璃艺术作品之一。',
    source: '灵山胜境景点结构化数据集 · LS-002',
    spot: '灵山梵宫',
    submittedAt: '2026-05-30 14:18',
    status: 'pending',
  },
  {
    id: 'rev-3',
    question: '祥符禅寺有什么历史故事？',
    answer: '祥符禅寺始建于唐贞观年间，与玄奘法师西行取经紧密相连。玄奘途经马山时见山形酷似印度灵鹫山，命名为"小灵山"，嘱大弟子窥基法师在此住持道场。北宋大中祥符年间，宋真宗赐额"祥符禅寺"。寺内现存千年银杏、六角井等珍贵遗存。',
    source: '灵山胜境游览指南 · 第3章',
    spot: '祥符禅寺',
    submittedAt: '2026-05-30 14:10',
    status: 'pending',
  },
  {
    id: 'rev-4',
    question: '推荐一条适合带老人小孩的路线',
    answer: '亲子家庭路线（约4小时）：南门入园 → 九龙灌浴（25分钟，动态群雕表演）→ 佛手广场（15分钟，摸天下第一掌沾福气）→ 百子戏弥勒（15分钟，亲子互动拍照）→ 灵山大佛（40分钟，全家登顶抱佛脚）→ 灵山梵宫（60分钟，观看《吉祥颂》演出）→ 五印坛城（30分钟，转动转经筒）→ 出口（出口旁有素面餐厅）。全程约3公里，节奏轻松。',
    source: '灵山胜境游览指南 · 第4章 · 亲子家庭路线',
    spot: '路线推荐',
    submittedAt: '2026-05-30 13:55',
    status: 'approved',
    reviewer: '景区管理员',
    reviewedAt: '2026-05-30 15:02',
  },
  {
    id: 'rev-5',
    question: '九龙灌浴什么时候表演？',
    answer: '每日4-5场表演，平日演出时间：10:00、11:30、13:30、15:00；周末及节假日增加演出场次。每场时长约15分钟，建议提前10分钟到场占位。表演结束后可在广场两侧接取龙头流出的"圣水"。',
    source: '灵山胜境景点结构化数据集 · LS-003',
    spot: '九龙灌浴',
    submittedAt: '2026-05-30 13:40',
    status: 'approved',
    reviewer: '景区管理员',
    reviewedAt: '2026-05-30 14:55',
  },
  {
    id: 'rev-6',
    question: '灵山胜境门票多少钱？有优惠吗？',
    answer: '成人票210元，半价票105元（6-18周岁未成年人、全日制学生、60-69周岁老人），免票（6周岁以下或1.4米以下儿童、70周岁以上老人、现役军人、残疾人）。网购联票225元含观光车无限次乘坐，更划算。',
    source: '灵山胜境游览指南 · 第5章 · 实用贴士',
    spot: '实用信息',
    submittedAt: '2026-05-29 16:30',
    status: 'rejected',
    rejectReason: '票价信息需与景区官方最新公告核对，部分票种价格有调整',
    reviewer: '景区管理员',
    reviewedAt: '2026-05-29 17:10',
  },
]

type Tab = 'pending' | 'approved' | 'rejected'

const TABS: { key: Tab; i18nKey: string; icon: typeof Clock }[] = [
  { key: 'pending', i18nKey: 'admin.pendingReview', icon: Clock },
  { key: 'approved', i18nKey: 'admin.approved', icon: CheckCircle },
  { key: 'rejected', i18nKey: 'admin.rejected', icon: XCircle },
]

export default function ContentReview() {
  const [tab, setTab] = useState<Tab>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const t = useT()

  const filtered = MOCK_REVIEWS
    .filter((r) => r.status === tab)
    .filter((r) => {
      if (!search) return true
      return r.question.includes(search) || r.answer.includes(search) || r.spot.includes(search)
    })

  const counts = {
    pending: MOCK_REVIEWS.filter((r) => r.status === 'pending').length,
    approved: MOCK_REVIEWS.filter((r) => r.status === 'approved').length,
    rejected: MOCK_REVIEWS.filter((r) => r.status === 'rejected').length,
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
                      <span>{item.spot}</span>
                      <span>{item.submittedAt}</span>
                      {item.status !== 'pending' && (
                        <span>{t('admin.reviewer')}：{item.reviewer}</span>
                      )}
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

                    {item.status === 'pending' && (
                      <div className="review-actions">
                        <motion.button
                          type="button"
                          className="review-action-btn approve"
                          whileTap={{ scale: 0.97 }}
                        >
                          <CheckCircle size={15} />
                          <span>{t('admin.approve')}</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          className="review-action-btn edit"
                          whileTap={{ scale: 0.97 }}
                        >
                          <Edit3 size={15} />
                          <span>{t('admin.edit')}</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          className="review-action-btn reject"
                          whileTap={{ scale: 0.97 }}
                        >
                          <XCircle size={15} />
                          <span>{t('admin.reject')}</span>
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="kb-empty">
            <ShieldCheck size={32} />
            <span>{tab === 'pending' ? t('admin.allReviewed') : t('admin.noData')}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
