import { motion } from 'framer-motion'
import {
  TrendingUp, Users, Clock, Wallet, Star, MapPin,
  ChevronRight,
} from 'lucide-react'
import {
  CartesianGrid,
  Pie, PieChart, Cell,
  BarChart, Bar,
  ResponsiveContainer,
  Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from 'recharts'

const MONTHLY_VISITS = [
  { month: '1月', 游客量: 10 },
  { month: '2月', 游客量: 13 },
  { month: '3月', 游客量: 35 },
  { month: '4月', 游客量: 49 },
  { month: '5月', 游客量: 54 },
  { month: '6月', 游客量: 49 },
  { month: '7月', 游客量: 42 },
  { month: '8月', 游客量: 68 },
  { month: '9月', 游客量: 73 },
  { month: '10月', 游客量: 38 },
  { month: '11月', 游客量: 31 },
  { month: '12月', 游客量: 60 },
]

const AGE_DATA = [
  { name: '30岁以下', value: 153, fill: '#155d58' },
  { name: '30-49岁', value: 221, fill: '#15bba0' },
  { name: '50岁以上', value: 148, fill: '#8ab89e' },
]

const GENDER_DATA = [
  { name: '男性', value: 275, fill: '#155d58' },
  { name: '女性', value: 247, fill: '#c1a15a' },
]

const SATISFACTION_DATA = [
  { name: '5★', value: 8, fill: '#155d58' },
  { name: '4★', value: 114, fill: '#15bba0' },
  { name: '3★', value: 314, fill: '#c1a15a' },
  { name: '2★', value: 62, fill: '#e89460' },
  { name: '1★', value: 24, fill: '#b4522c' },
]

const SPENDING_DATA = [
  { name: '门票', value: 203, fill: '#155d58' },
  { name: '餐饮', value: 228, fill: '#15bba0' },
  { name: '购物', value: 236, fill: '#c1a15a' },
  { name: '交通', value: 48, fill: '#e89460' },
  { name: '娱乐', value: 185, fill: '#8ab89e' },
]

const TOP_SPOTS = [
  { name: '灵山大佛', visitors: 418, ratio: '80.1%' },
  { name: '灵山梵宫', visitors: 385, ratio: '73.8%' },
  { name: '九龙灌浴', visitors: 352, ratio: '67.4%' },
  { name: '五印坛城', visitors: 296, ratio: '56.7%' },
  { name: '祥符禅寺', visitors: 273, ratio: '52.3%' },
]

const kpiCards = [
  { icon: Users, label: '累计游客', value: '522', change: '+12%', color: 'var(--teal)' },
  { icon: Clock, label: '平均停留', value: '4.0h', change: '+0.3h', color: 'var(--teal)' },
  { icon: Wallet, label: '人均消费', value: '¥901', change: '+8%', color: 'var(--teal)' },
  { icon: Star, label: '满意度', value: '3.08', change: '/5.0', color: 'var(--rust)' },
]

export default function DataDashboard() {
  return (
    <motion.div
      className="dashboard-root"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="dashboard-head">
        <div>
          <h2>灵山胜境 · 运营数据大屏</h2>
          <span>数据来源：示范景区公开资料包 · 2025年度</span>
        </div>
        <span className="dashboard-badge">实时监控</span>
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
            <span>月度游客趋势</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MONTHLY_VISITS}>
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
              <Area type="monotone" dataKey="游客量" stroke="#155d58" fill="url(#visitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <Users size={15} />
            <span>年龄分布</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={AGE_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={76} paddingAngle={3}>
                {AGE_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
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
            <span>满意度分布</span>
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
            <span>人均消费构成 (¥)</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={SPENDING_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={72} paddingAngle={3}>
                {SPENDING_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
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
            <span>性别分布</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={GENDER_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={68} paddingAngle={4}>
                {GENDER_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-chart-card">
          <div className="dashboard-chart-head">
            <MapPin size={15} />
            <span>热门景点排行</span>
          </div>
          <div className="dashboard-spot-list">
            {TOP_SPOTS.map((spot, i) => (
              <div key={spot.name} className="dashboard-spot-row">
                <span className="dashboard-spot-rank">{i + 1}</span>
                <div className="dashboard-spot-info">
                  <strong>{spot.name}</strong>
                  <span>{spot.visitors} 人次</span>
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
