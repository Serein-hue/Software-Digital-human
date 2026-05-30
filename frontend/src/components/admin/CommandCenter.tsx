import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, TrendingUp, Star, Wallet, MapPin, Clock,
  Wifi, Thermometer, CloudSun, AlertTriangle, Check,
} from 'lucide-react'
import {
  CartesianGrid, Pie, PieChart, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
  Area, AreaChart,
} from 'recharts'
import { useT, getLang } from '../../i18n'

const MONTHLY_VISITS_ZH = [
  { month: '1月', visitors: 10 }, { month: '2月', visitors: 13 },
  { month: '3月', visitors: 35 }, { month: '4月', visitors: 49 },
  { month: '5月', visitors: 54 }, { month: '6月', visitors: 49 },
  { month: '7月', visitors: 42 }, { month: '8月', visitors: 68 },
  { month: '9月', visitors: 73 }, { month: '10月', visitors: 38 },
  { month: '11月', visitors: 31 }, { month: '12月', visitors: 60 },
]

const MONTHLY_VISITS_EN = [
  { month: 'Jan', visitors: 10 }, { month: 'Feb', visitors: 13 },
  { month: 'Mar', visitors: 35 }, { month: 'Apr', visitors: 49 },
  { month: 'May', visitors: 54 }, { month: 'Jun', visitors: 49 },
  { month: 'Jul', visitors: 42 }, { month: 'Aug', visitors: 68 },
  { month: 'Sep', visitors: 73 }, { month: 'Oct', visitors: 38 },
  { month: 'Nov', visitors: 31 }, { month: 'Dec', visitors: 60 },
]

const SATISFACTION_DATA = [
  { name: '5★', value: 8, fill: '#15bba0' },
  { name: '4★', value: 114, fill: '#155d58' },
  { name: '3★', value: 314, fill: '#c1a15a' },
  { name: '2★', value: 62, fill: '#e89460' },
  { name: '1★', value: 24, fill: '#b4522c' },
]

const TOP_SPOTS = [
  { name: '灵山大佛', visitors: 418, pct: '80.1%' },
  { name: '灵山梵宫', visitors: 385, pct: '73.8%' },
  { name: '九龙灌浴', visitors: 352, pct: '67.4%' },
  { name: '五印坛城', visitors: 296, pct: '56.7%' },
  { name: '祥符禅寺', visitors: 273, pct: '52.3%' },
]

const FACILITIES = [
  { name: '南门闸机', status: 'ok', load: 62 },
  { name: '东门闸机', status: 'ok', load: 34 },
  { name: '大佛电梯', status: 'ok', load: 78 },
  { name: '梵宫展厅', status: 'warn', load: 91 },
  { name: '停车场 A', status: 'ok', load: 45 },
  { name: '停车场 B', status: 'ok', load: 28 },
  { name: '观光车站', status: 'ok', load: 55 },
]

const VIEWS = ['overview', 'demographics', 'revenue', 'status'] as const
type View = typeof VIEWS[number]
const ROTATION_MS = 18_000

function AnimatedNumber({ value }: { value: number | string }) {
  return (
    <motion.span
      key={String(value)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {value}
    </motion.span>
  )
}

export default function CommandCenter() {
  const [view, setView] = useState<View>('overview')
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const t = useT()
  const isEn = getLang() === 'en'

  const monthlyVisits = isEn ? MONTHLY_VISITS_EN : MONTHLY_VISITS_ZH

  const ageData = [
    { name: t('dashboard.ageUnder30'), value: 153, fill: '#15bba0' },
    { name: t('dashboard.age30to49'), value: 221, fill: '#155d58' },
    { name: t('dashboard.ageOver50'), value: 148, fill: '#8ab89e' },
  ]

  const genderData = [
    { name: t('dashboard.genderMale'), value: 275, fill: '#15bba0' },
    { name: t('dashboard.genderFemale'), value: 247, fill: '#c1a15a' },
  ]

  const spendingData = [
    { name: t('dashboard.spendTicket'), value: 203, fill: '#15bba0' },
    { name: t('dashboard.spendFood'), value: 228, fill: '#155d58' },
    { name: t('dashboard.spendShopping'), value: 236, fill: '#c1a15a' },
    { name: t('dashboard.spendTransport'), value: 48, fill: '#e89460' },
    { name: t('dashboard.spendEntertainment'), value: 185, fill: '#8ab89e' },
  ]

  useEffect(() => {
    const update = () => {
      const d = new Date()
      const DAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']
      const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      const dayNames = getLang() === 'en' ? DAYS_EN : DAYS_ZH
      setTimeStr(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`)
      setDateStr(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${dayNames[d.getDay()]}`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    rotationRef.current = setInterval(() => {
      setView((prev) => {
        const idx = VIEWS.indexOf(prev)
        return VIEWS[(idx + 1) % VIEWS.length]
      })
    }, ROTATION_MS)
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current)
    }
  }, [])

  const switchView = (v: View) => {
    setView(v)
    if (rotationRef.current) clearInterval(rotationRef.current)
    rotationRef.current = setInterval(() => {
      setView((prev) => {
        const idx = VIEWS.indexOf(prev)
        return VIEWS[(idx + 1) % VIEWS.length]
      })
    }, ROTATION_MS)
  }

  const todayVisitors = 522
  const todayOnline = 3841
  const totalToday = todayVisitors + todayOnline

  return (
    <div className="cmd-root">
      {/* Header */}
      <header className="cmd-header">
        <div className="cmd-header-left">
          <div className="cmd-logo">
            <TrendingUp size={22} />
            <span>{t('cmd.title')}</span>
          </div>
          <div className="cmd-live-dot" />
          <span className="cmd-live-label">LIVE</span>
        </div>
        <div className="cmd-header-center">
          <div className="cmd-view-tabs">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`cmd-view-tab ${view === v ? 'active' : ''}`}
                onClick={() => switchView(v)}
              >
                {t(`cmd.${v}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="cmd-header-right">
          <div className="cmd-datetime">
            <span className="cmd-time">{timeStr}</span>
            <span className="cmd-date">{dateStr}</span>
          </div>
          <div className="cmd-weather">
            <CloudSun size={16} />
            <span>28° 晴</span>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <div className="cmd-kpi-strip">
        {[
          { icon: Users, label: t('cmd.todayVisitors'), value: totalToday.toLocaleString(), sub: `${t('cmd.inPark')} ${todayVisitors} | ${t('cmd.online')} ${todayOnline}`, color: '#15bba0' },
          { icon: Clock, label: t('cmd.realtimeInPark'), value: '1,247', sub: `${t('cmd.vsYesterday')} +8%`, color: '#155d58' },
          { icon: Wallet, label: t('cmd.todayRevenue'), value: '¥471,230', sub: `${t('cmd.perCapita')} ¥901`, color: '#c1a15a' },
          { icon: Star, label: t('cmd.todaySatisfaction'), value: '4.08', sub: `/5.0 · ${t('cmd.goodRate')} 92%`, color: '#8ab89e' },
          { icon: Thermometer, label: t('cmd.crowdLevel'), value: t('cmd.crowdComfortable'), sub: `${t('cmd.loadRate')} 52%`, color: '#15bba0' },
        ].map((kpi) => (
          <div key={kpi.label} className="cmd-kpi-card">
            <kpi.icon size={18} style={{ color: kpi.color }} />
            <div className="cmd-kpi-body">
              <span className="cmd-kpi-label">{kpi.label}</span>
              <strong className="cmd-kpi-value" style={{ color: kpi.color }}>
                <AnimatedNumber value={kpi.value} />
              </strong>
              <span className="cmd-kpi-sub">{kpi.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main view area */}
      <div className="cmd-main">
        <AnimatePresence mode="wait">
          {view === 'overview' && (
            <motion.div
              key="overview"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel large">
                <div className="cmd-panel-head"><TrendingUp size={15} />{t('cmd.monthlyTrend')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyVisits}>
                    <defs>
                      <linearGradient id="cmdVisit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15bba0" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#15bba0" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="visitors" stroke="#15bba0" fill="url(#cmdVisit)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><MapPin size={15} />{t('cmd.topSpots')}</div>
                <div className="cmd-spots-list">
                  {TOP_SPOTS.map((s, i) => (
                    <div key={s.name} className="cmd-spot-row">
                      <span className="cmd-spot-rank">{i + 1}</span>
                      <div className="cmd-spot-info">
                        <strong>{s.name}</strong>
                        <span>{s.visitors} {t('cmd.visitorsUnit')}</span>
                      </div>
                      <div className="cmd-spot-bar-wrap">
                        <motion.div
                          className="cmd-spot-bar"
                          initial={{ width: 0 }}
                          animate={{ width: s.pct }}
                          transition={{ duration: 0.8, delay: i * 0.12 }}
                        />
                      </div>
                      <span className="cmd-spot-pct">{s.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'demographics' && (
            <motion.div
              key="demographics"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Users size={15} />{t('cmd.ageDist')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                      {ageData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Users size={15} />{t('cmd.genderDist')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={84} paddingAngle={4}>
                      {genderData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Star size={15} />{t('cmd.satisfactionDist')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SATISFACTION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {SATISFACTION_DATA.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {view === 'revenue' && (
            <motion.div
              key="revenue"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Wallet size={15} />{t('cmd.spendingDist')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={90} paddingAngle={3}>
                      {spendingData.map((d) => (<Cell key={d.name} fill={d.fill} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: 13, fill: 'rgba(255,255,255,0.6)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="cmd-panel large">
                <div className="cmd-panel-head"><TrendingUp size={15} />{t('cmd.monthlyRevenue')}</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyVisits.map((d) => ({ ...d, revenue: Math.round(d.visitors * 9.01) }))}>
                    <defs>
                      <linearGradient id="cmdRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#c1a15a" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#c1a15a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1a2220', border: '1px solid #2a3a35', borderRadius: 8, color: '#fff' }} />
                    <Area type="monotone" dataKey="revenue" stroke="#c1a15a" fill="url(#cmdRev)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {view === 'status' && (
            <motion.div
              key="status"
              className="cmd-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="cmd-panel">
                <div className="cmd-panel-head"><Wifi size={15} />{t('cmd.facilityStatus')}</div>
                <div className="cmd-facilities">
                  {FACILITIES.map((f) => (
                    <div key={f.name} className="cmd-facility-row">
                      <div className={`cmd-facility-dot ${f.status}`} />
                      <span className="cmd-facility-name">{f.name}</span>
                      <div className="cmd-facility-bar-wrap">
                        <motion.div
                          className={`cmd-facility-bar ${f.status}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${f.load}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className={`cmd-facility-load ${f.status}`}>{f.load}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><AlertTriangle size={15} />{t('cmd.realtimeAlerts')}</div>
                <div className="cmd-alerts">
                  <div className="cmd-alert warn">
                    <AlertTriangle size={14} />
                    <div><strong>梵宫展厅客流预警</strong><span>承载率 91%，建议限流</span></div>
                    <span className="cmd-alert-time">2分钟前</span>
                  </div>
                  <div className="cmd-alert info">
                    <Check size={14} />
                    <div><strong>九龙灌浴演出正常</strong><span>下场演出 15:00</span></div>
                    <span className="cmd-alert-time">12分钟前</span>
                  </div>
                  <div className="cmd-alert info">
                    <Check size={14} />
                    <div><strong>全部系统运行正常</strong><span>API 响应 &lt; 80ms</span></div>
                    <span className="cmd-alert-time">刚刚</span>
                  </div>
                </div>
              </div>
              <div className="cmd-panel">
                <div className="cmd-panel-head"><MapPin size={15} />{t('cmd.heatmap')}</div>
                <div className="cmd-heatmap-placeholder">
                  <div className="cmd-heatmap-grid">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div
                        key={i}
                        className="cmd-heatmap-cell"
                        style={{ opacity: [0.2, 0.6, 0.3, 0.8, 0.95, 0.7, 0.15, 0.4, 0.55][i] }}
                      />
                    ))}
                  </div>
                  <span className="cmd-heatmap-label">{t('cmd.heatmapLabel')}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="cmd-footer">
        <div className="cmd-footer-left">
          <span>{t('cmd.refreshInterval')} 5s</span>
          <span>·</span>
          <span>{t('cmd.aiOnline')}</span>
          <span>·</span>
          <span>{t('cmd.kioskOnline', { n: 3 })}</span>
        </div>
        <div className="cmd-footer-right">
          <span>Powered by 锐捷网络 · A5 2026</span>
        </div>
      </footer>
    </div>
  )
}
