import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Users, Clock, Wallet, Star, MapPin,
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
import { fetchAnalytics } from '../../api'

const MONTHLY_VISITS_ZH = [
  { month: '1月', 游客量: 10 }, { month: '2月', 游客量: 13 },
  { month: '3月', 游客量: 35 }, { month: '4月', 游客量: 49 },
  { month: '5月', 游客量: 54 }, { month: '6月', 游客量: 49 },
  { month: '7月', 游客量: 42 }, { month: '8月', 游客量: 68 },
  { month: '9月', 游客量: 73 }, { month: '10月', 游客量: 38 },
  { month: '11月', 游客量: 31 }, { month: '12月', 游客量: 60 },
]

const MONTHLY_VISITS_EN = [
  { month: 'Jan', Visitors: 10 }, { month: 'Feb', Visitors: 13 },
  { month: 'Mar', Visitors: 35 }, { month: 'Apr', Visitors: 49 },
  { month: 'May', Visitors: 54 }, { month: 'Jun', Visitors: 49 },
  { month: 'Jul', Visitors: 42 }, { month: 'Aug', Visitors: 68 },
  { month: 'Sep', Visitors: 73 }, { month: 'Oct', Visitors: 38 },
  { month: 'Nov', Visitors: 31 }, { month: 'Dec', Visitors: 60 },
]

const SATISFACTION_DATA = [
  { name: '5★', value: 8, fill: '#155d58' },
  { name: '4★', value: 114, fill: '#15bba0' },
  { name: '3★', value: 314, fill: '#c1a15a' },
  { name: '2★', value: 62, fill: '#e89460' },
  { name: '1★', value: 24, fill: '#b4522c' },
]

const TOP_SPOTS = [
  { name: '灵山大佛', visitors: 418, ratio: '80.1%' },
  { name: '灵山梵宫', visitors: 385, ratio: '73.8%' },
  { name: '九龙灌浴', visitors: 352, ratio: '67.4%' },
  { name: '五印坛城', visitors: 296, ratio: '56.7%' },
  { name: '祥符禅寺', visitors: 273, ratio: '52.3%' },
]

export default function DataDashboard() {
  const t = useT()
  const lang = getLang()
  const [spotData, setSpotData] = useState(TOP_SPOTS)

  const ageData = [
    { name: t('dashboard.ageUnder30'), value: 153, fill: '#155d58' },
    { name: t('dashboard.age30to49'), value: 221, fill: '#15bba0' },
    { name: t('dashboard.ageOver50'), value: 148, fill: '#8ab89e' },
  ]

  const genderData = [
    { name: t('dashboard.genderMale'), value: 275, fill: '#155d58' },
    { name: t('dashboard.genderFemale'), value: 247, fill: '#c1a15a' },
  ]

  const spendingData = [
    { name: t('dashboard.spendTicket'), value: 203, fill: '#155d58' },
    { name: t('dashboard.spendFood'), value: 228, fill: '#15bba0' },
    { name: t('dashboard.spendShopping'), value: 236, fill: '#c1a15a' },
    { name: t('dashboard.spendTransport'), value: 48, fill: '#e89460' },
    { name: t('dashboard.spendEntertainment'), value: 185, fill: '#8ab89e' },
  ]

  useEffect(() => {
    fetchAnalytics().then((data) => {
      if (data?.spotPopularity) {
        const max = Math.max(...data.spotPopularity.map((s) => s.visitors))
        setSpotData(data.spotPopularity.map((s) => ({
          name: s.name,
          visitors: s.visitors,
          ratio: `${((s.visitors / max) * 100).toFixed(1)}%`,
        })))
      }
    }).catch(() => {})
  }, [])

  const isEn = lang === 'en'
  const monthlyVisits = isEn ? MONTHLY_VISITS_EN : MONTHLY_VISITS_ZH
  const visitsKey = isEn ? 'Visitors' : '游客量'

  const kpiCards = [
    { icon: Users, label: t('dashboard.totalVisitors'), value: '522', change: '+12%', color: 'var(--teal)' },
    { icon: Clock, label: t('dashboard.avgStay'), value: '4.0h', change: '+0.3h', color: 'var(--teal)' },
    { icon: Wallet, label: t('dashboard.avgSpend'), value: '¥901', change: '+8%', color: 'var(--teal)' },
    { icon: Star, label: t('dashboard.satisfaction'), value: '3.08', change: '/5.0', color: 'var(--rust)' },
  ]

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
        <span className="dashboard-badge">{t('dashboard.realtime')}</span>
      </div>

      {/* KPI cards */}
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

      {/* Row: monthly trend + demographics */}
      <div className="dashboard-row">
        <div className="dashboard-chart-card large">
          <div className="dashboard-chart-head">
            <TrendingUp size={15} />
            <span>{t('dashboard.monthlyTrend')}</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyVisits}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#155d58" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#155d58" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ded8c9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey={visitsKey} stroke="#155d58" fill="url(#visitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <Users size={15} />
            <span>{t('dashboard.ageDist')}</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={76} paddingAngle={3}>
                {ageData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: satisfaction + spending */}
      <div className="dashboard-row">
        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <Star size={15} />
            <span>{t('dashboard.satisfactionDist')}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SATISFACTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ded8c9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {SATISFACTION_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <Wallet size={15} />
            <span>{t('dashboard.spendingDist')}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={72} paddingAngle={3}>
                {spendingData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: gender + top spots */}
      <div className="dashboard-row">
        <div className="dashboard-chart-card small">
          <div className="dashboard-chart-head">
            <Users size={15} />
            <span>{t('dashboard.genderDist')}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={68} paddingAngle={4}>
                {genderData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <MapPin size={15} />
            <span>{t('dashboard.topSpots')}</span>
          </div>
          <div className="dashboard-spot-list">
            {spotData.map((spot, i) => (
              <div key={spot.name} className="dashboard-spot-row">
                <span className="dashboard-spot-rank">{i + 1}</span>
                <div className="dashboard-spot-info">
                  <strong>{spot.name}</strong>
                  <span>{spot.visitors} {t('dashboard.visitorsUnit')}</span>
                </div>
                <div className="dashboard-spot-bar-wrap">
                  <motion.div
                    className="dashboard-spot-bar"
                    initial={{ width: 0 }}
                    animate={{ width: spot.ratio }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                </div>
                <span className="dashboard-spot-ratio">{spot.ratio}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
