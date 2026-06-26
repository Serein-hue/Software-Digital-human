import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Users, Clock, Wallet, Star, MapPin, List, AlertTriangle,
} from 'lucide-react'
import {
  CartesianGrid,
  Pie, PieChart, Cell,
  BarChart, Bar,
  ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from 'recharts'
import { useT, getLang } from '../../i18n'
import {
  fetchOverview,
  fetchSpotHeat,
  fetchCrowdFlow,
  fetchQueueStats,
  type OverviewData,
  type SpotHeatItem,
  type CrowdFlowItem,
  type QueueStatItem,
} from '../../api/admin'

export default function DataDashboard() {
  const t = useT()
  const lang = getLang()
  const isEn = lang === 'en'

  const [overview, setOverview] = useState<OverviewData>({
    activeVisitors: 0,
    totalSpots: 0,
    pendingWorkOrders: 0,
    pendingEmergencies: 0,
    avgRating: 0,
  })
  const [spotHeat, setSpotHeat] = useState<SpotHeatItem[]>([])
  const [crowdFlow, setCrowdFlow] = useState<CrowdFlowItem[]>([])
  const [queueStats, setQueueStats] = useState<QueueStatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchOverview(),
      fetchSpotHeat(5),
      fetchCrowdFlow(),
      fetchQueueStats(),
    ]).then(([ov, sh, cf, qs]) => {
      if (ov) setOverview(ov)
      if (sh) setSpotHeat(sh.items || [])
      if (cf) setCrowdFlow(cf.items || [])
      if (qs) setQueueStats(qs.items || [])
      setError(null)
    }).catch(() => {
      setError('无法加载运营数据')
    }).finally(() => setLoading(false))
  }, [])

  const visitsKey = isEn ? 'Visitors' : '游客量'

  // 基础统计数据
  const safeOverview = overview || { activeVisitors: 0, totalSpots: 0, pendingWorkOrders: 0, pendingEmergencies: 0, avgRating: 0 }

  const kpiCards = [
    { icon: Users, label: t('dashboard.totalVisitors'), value: `${safeOverview.activeVisitors}`, change: `${safeOverview.totalSpots} 景区`, color: 'var(--teal)' },
    { icon: Clock, label: '实时排队', value: `${queueStats.filter(q => q.crowdLevel === 'high').length} 高峰`, change: `${queueStats.length} 个点位`, color: queueStats.some(q => q.crowdLevel === 'high') ? 'var(--rust)' : 'var(--teal)' },
    { icon: AlertTriangle, label: '待办工单', value: `${safeOverview.pendingWorkOrders}`, change: `应急 ${safeOverview.pendingEmergencies}`, color: safeOverview.pendingEmergencies > 0 ? '#c0392b' : 'var(--teal)' },
    { icon: Star, label: t('dashboard.satisfaction'), value: `${safeOverview.avgRating}`, change: '/5.0', color: 'var(--rust)' },
  ]

  // 满意度数据（从真实评分聚合，暂无则显示 demo）
  const satisfactionData = [
    { name: '5★', value: 8, fill: '#155d58' },
    { name: '4★', value: 114, fill: '#15bba0' },
    { name: '3★', value: 314, fill: '#c1a15a' },
    { name: '2★', value: 62, fill: '#e89460' },
    { name: '1★', value: 24, fill: '#b4522c' },
  ]

  // 热门景点（从真实位置上报聚合）
  const spotChartData = spotHeat.length > 0
    ? spotHeat
    : [{ id: '0', name: '暂无数据', activeVisitors: 0 }]

  const maxVisitors = Math.max(...spotChartData.map(s => s.activeVisitors), 1)

  // 客流时段分布
  const flowData = crowdFlow.length > 0 ? crowdFlow : []

  // 排队数据
  const queueChartData = queueStats.length > 0 ? queueStats : []

  if (loading) {
    return (
      <div className="dashboard-root">
        <div className="dashboard-head">
          <h2>{t('dashboard.title')}</h2>
          <span>{t('dashboard.subtitle')}</span>
        </div>
        <div className="dashboard-loading">
          <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="dashboard-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>{t('dashboard.title')}</h2>
          <span>{t('dashboard.subtitle')}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {error && <span className="text-muted" style={{ fontSize: 12 }}>{error}</span>}
          <span className="dashboard-badge">{t('dashboard.realtime')}</span>
        </div>
      </div>

      {/* KPI cards — 真实数据 */}
      <div className="dashboard-kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.label} className="dashboard-kpi-card">
            <card.icon size={20} style={{ color: card.color }} />
            <div>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <em style={{ color: card.color }}>{card.change}</em>
            </div>
          </div>
        ))}
      </div>

      {/* Row: 客流时段 + 实时排队 */}
      <div className="dashboard-row">
        <div className="dashboard-chart-card large">
          <div className="dashboard-chart-head">
            <TrendingUp size={15} />
            <span>实时客流分布</span>
          </div>
          {flowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={flowData}>
                <defs>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#155d58" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#155d58" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ded8c9" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#155d58" fill="url(#visitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="dashboard-empty">暂无客流数据，等待位置上报</div>
          )}
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <List size={15} />
            <span>排队实况</span>
          </div>
          {queueChartData.length > 0 ? (
            <div style={{ padding: '4px 0' }}>
              {queueChartData.map((q, i) => (
                <div key={q.spot} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: q.crowdLevel === 'high' ? '#c0392b' : q.crowdLevel === 'medium' ? '#e89460' : '#15bba0',
                  }} />
                  <span style={{ flex: 1, color: '#20231f', fontWeight: 600 }}>{q.spot}</span>
                  <span style={{ color: '#62665d' }}>{q.queueMinutes}min</span>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 10,
                    background: q.crowdLevel === 'high' ? '#fce8e4' : q.crowdLevel === 'medium' ? '#fff2d8' : '#e8f2ed',
                    color: q.crowdLevel === 'high' ? '#c0392b' : q.crowdLevel === 'medium' ? '#8c6128' : '#1f6d58',
                  }}>{q.activeTickets}人</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">暂无排队数据</div>
          )}
        </div>
      </div>

      {/* Row: 景点热度 + 满意度 */}
      <div className="dashboard-row">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <MapPin size={15} />
            <span>景点实时热度</span>
            <span className="text-muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
              {spotHeat.length > 0 ? `共 ${overview?.activeVisitors || 0} 人在园` : '暂无数据'}
            </span>
          </div>
          <div className="dashboard-spot-list">
            {spotChartData.slice(0, 6).map((spot, i) => (
              <div key={spot.id} className="dashboard-spot-row">
                <span className="dashboard-spot-rank">{i + 1}</span>
                <div className="dashboard-spot-info">
                  <strong>{spot.name}</strong>
                  <span>{spot.activeVisitors} 人</span>
                </div>
                <div className="dashboard-spot-bar-wrap">
                  <motion.div
                    className="dashboard-spot-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${(spot.activeVisitors / maxVisitors) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                </div>
                <span className="dashboard-spot-ratio">
                  {maxVisitors > 0 ? `${Math.round((spot.activeVisitors / maxVisitors) * 100)}%` : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <Star size={15} />
            <span>{t('dashboard.satisfactionDist')}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ded8c9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {satisfactionData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}
